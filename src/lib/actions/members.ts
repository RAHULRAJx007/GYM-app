"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createMember(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role = "admin";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role) role = profile.role;
  }
  const isStaff = role === "staff";
  const payload: Record<string, unknown> = {
    first_name: String(formData.get("first_name") || ""),
    last_name: String(formData.get("last_name") || ""),
    phone: String(formData.get("phone") || "") || null,
    email: String(formData.get("email") || "") || null,
    gender: String(formData.get("gender") || "") || null,
    date_of_birth: String(formData.get("date_of_birth") || "") || null,
    address: String(formData.get("address") || "") || null,
    emergency_contact_name: String(formData.get("emergency_contact_name") || "") || null,
    emergency_contact_phone: String(formData.get("emergency_contact_phone") || "") || null,
    medical_notes: String(formData.get("medical_notes") || "") || null,
    status: String(formData.get("status") || "active"),
  };
  // Only add created_by if column exists (live DB may be old schema) - will be ignored if missing via fallback
  if (user?.id) (payload as any).created_by = user.id;
  if (!payload.first_name || !payload.last_name) throw new Error("Name required");
  const plan_id = String(formData.get("plan_id") || "");
  const pt_plan_id = String(formData.get("pt_plan_id") || "");
  const start_date = String(formData.get("start_date") || "");
  if (!plan_id || !start_date) throw new Error("Membership plan and start date required");
  const price_paid = formData.get("price_paid") ? Number(formData.get("price_paid")) : null;
  const payment_method = String(formData.get("payment_method") || "cash");

  // Insert member - handle old schema without created_by (error 3833558017 / PGRST204)
  let member: any = null;
  let memberError: any = null;
  {
    const payloadWithCreated = { ...payload, ...(user?.id ? { created_by: user.id } : {}) };
    const res = await supabase.from("members").insert(payloadWithCreated).select("id").single();
    member = res.data;
    memberError = res.error;
    if (memberError && (memberError.code === "PGRST204" || String(memberError.message).includes("created_by") || String((memberError as any).code) === "3833558017")) {
      const { created_by: _omit, ...payloadWithoutCreated } = payloadWithCreated as any;
      const retry = await supabase.from("members").insert(payloadWithoutCreated).select("id").single();
      member = retry.data;
      memberError = retry.error;
    }
  }
  if (memberError) throw new Error(memberError.message);
  if (!member) throw new Error("Failed to create member");

  const memberId = member.id;
  // Helper to create membership - resilient to old schema (missing created_by, pending check)
  async function createMembership(pid: string) {
    const { data: plan } = await supabase.from("membership_plans").select("duration_days,price").eq("id", pid).single();
    const duration = plan?.duration_days || 30;
    const s = new Date(start_date);
    const e = new Date(s);
    e.setDate(e.getDate() + duration);
    const end_date = e.toISOString().slice(0, 10);
    const amount = price_paid ?? (pid === plan_id ? Number(plan?.price || 0) : Number(plan?.price || 0));
    let status: string = isStaff ? "pending" : "active";
    let pStatus: string = isStaff ? "pending" : "completed";
    // Try insert with created_by + status, fallback without created_by, fallback to active/completed if pending not allowed
    const baseMm: Record<string, unknown> = { member_id: memberId, plan_id: pid, start_date, end_date, price_paid: amount || null, status, ...(user?.id ? { created_by: user.id } : {}) };
    let mm: any = null;
    let mmErr: any = null;
    {
      const res = await supabase.from("member_memberships").insert(baseMm).select("id").single();
      mm = res.data; mmErr = res.error;
      if (mmErr && (mmErr.code === "PGRST204" || String(mmErr.message).includes("created_by"))) {
        const { created_by: _o, ...withoutCreated } = baseMm as any;
        const retry = await supabase.from("member_memberships").insert(withoutCreated).select("id").single();
        mm = retry.data; mmErr = retry.error;
      }
      if (mmErr && String(mmErr.message).toLowerCase().includes("violates check constraint")) {
        // Old schema doesn't allow pending, fallback to active
        const { created_by: _o2, ...withoutPending } = baseMm as any;
        const fallbackActive = { ...withoutPending, status: "active" };
        // remove created_by already if it was there
        const retry2 = await supabase.from("member_memberships").insert(fallbackActive).select("id").single();
        mm = retry2.data; mmErr = retry2.error;
        pStatus = "completed";
      }
    }
    if (mmErr) throw new Error(mmErr.message);
    if (amount && mm) {
      const basePay: Record<string, unknown> = { member_id: memberId, membership_id: mm.id, amount, payment_method, payment_date: start_date, status: pStatus, ...(user?.id ? { created_by: user.id } : {}) };
      let payErr: any = null;
      {
        const res = await supabase.from("payments").insert(basePay).select("id").single();
        payErr = (res as any).error;
        if (payErr && (payErr.code === "PGRST204" || String(payErr.message).includes("created_by"))) {
          const { created_by: _o, ...withoutCreated } = basePay as any;
          const retry = await supabase.from("payments").insert(withoutCreated).select("id").single();
          payErr = (retry as any).error;
        }
        if (payErr && String(payErr.message).toLowerCase().includes("violates check constraint")) {
          const { created_by: _o2, ...withoutPending } = basePay as any;
          const fallbackCompleted = { ...withoutPending, status: "completed" };
          const retry2 = await supabase.from("payments").insert(fallbackCompleted).select("id").single();
          payErr = (retry2 as any).error;
        }
      }
      if (payErr) throw new Error(payErr.message);
    }
  }

  await createMembership(plan_id);
  if (pt_plan_id) await createMembership(pt_plan_id);

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/approvals");
}

export async function updateMember(id: string, formData: FormData) {
  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    first_name: String(formData.get("first_name") || ""),
    last_name: String(formData.get("last_name") || ""),
    phone: String(formData.get("phone") || "") || null,
    email: String(formData.get("email") || "") || null,
    gender: String(formData.get("gender") || "") || null,
    date_of_birth: String(formData.get("date_of_birth") || "") || null,
    address: String(formData.get("address") || "") || null,
    emergency_contact_name: String(formData.get("emergency_contact_name") || "") || null,
    emergency_contact_phone: String(formData.get("emergency_contact_phone") || "") || null,
    medical_notes: String(formData.get("medical_notes") || "") || null,
    status: String(formData.get("status") || "active"),
  };
  const { error } = await supabase.from("members").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/members");
  revalidatePath(`/dashboard/members/${id}`);
}

export async function deleteMember(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") throw new Error("Only admin can delete members");
  }
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/members");
  const { redirect } = await import("next/navigation");
  redirect("/dashboard/members");
}

export async function assignMembership(memberId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role = "admin";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role) role = profile.role;
  }
  const plan_id = String(formData.get("plan_id") || "");
  const start_date = String(formData.get("start_date") || "");
  const end_date = String(formData.get("end_date") || "");
  const price_paid = formData.get("price_paid") ? Number(formData.get("price_paid")) : null;
  if (!plan_id || !start_date || !end_date) throw new Error("Plan and dates required");
  let status: string = role === "staff" ? "pending" : "active";
  const base: Record<string, unknown> = { member_id: memberId, plan_id, start_date, end_date, price_paid, status, ...(user?.id ? { created_by: user.id } : {}) };
  let { error } = await supabase.from("member_memberships").insert(base);
  if (error && (error.code === "PGRST204" || String(error.message).includes("created_by"))) {
    const { created_by: _o, ...withoutCreated } = base as any;
    const retry = await supabase.from("member_memberships").insert(withoutCreated);
    error = retry.error as any;
  }
  if (error && String(error.message).toLowerCase().includes("violates check constraint")) {
    const { created_by: _o2, ...withoutPending } = base as any;
    delete (withoutPending as any).created_by;
    (withoutPending as any).status = "active";
    const retry2 = await supabase.from("member_memberships").insert(withoutPending);
    error = retry2.error as any;
  }
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/members/${memberId}`);
  revalidatePath("/dashboard/approvals");
}

export async function recordPayment(memberId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role = "admin";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role) role = profile.role;
  }
  const amount = Number(formData.get("amount"));
  const payment_method = String(formData.get("payment_method") || "cash");
  const payment_date = String(formData.get("payment_date") || new Date().toISOString().slice(0,10));
  const membership_id = String(formData.get("membership_id") || "") || null;
  const notes = String(formData.get("notes") || "") || null;
  if (!amount) throw new Error("Amount required");
  let status: string = role === "staff" ? "pending" : "completed";
  const base: Record<string, unknown> = { member_id: memberId, membership_id, amount, payment_method, payment_date, notes, status, ...(user?.id ? { created_by: user.id } : {}) };
  let { error } = await supabase.from("payments").insert(base);
  if (error && (error.code === "PGRST204" || String(error.message).includes("created_by"))) {
    const { created_by: _o, ...withoutCreated } = base as any;
    const retry = await supabase.from("payments").insert(withoutCreated);
    error = retry.error as any;
  }
  if (error && String(error.message).toLowerCase().includes("violates check constraint")) {
    const { created_by: _o2, ...withoutPending } = base as any;
    delete (withoutPending as any).created_by;
    (withoutPending as any).status = "completed";
    const retry2 = await supabase.from("payments").insert(withoutPending);
    error = retry2.error as any;
  }
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/members/${memberId}`);
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard");
}

export async function checkIn(memberId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("attendances").insert({ member_id: memberId } as any);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

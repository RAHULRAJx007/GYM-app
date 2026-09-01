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
  const { data: { user } } = await supabase.auth.getUser();
  let role = "admin";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role) role = profile.role;
  }
  // Staff can only edit while membership is pending approval
  if (role === "staff") {
    const { data: pending } = await supabase.from("member_memberships").select("id").eq("member_id", id).eq("status", "pending").limit(1);
    if (!pending || pending.length === 0) {
      throw new Error("Editing locked after admin approval. Only admin can edit now.");
    }
  }
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
  let end_date = String(formData.get("end_date") || "");
  const price_paid = formData.get("price_paid") ? Number(formData.get("price_paid")) : null;
  const payment_method = String(formData.get("payment_method") || "cash");
  if (!plan_id || !start_date) throw new Error("Plan and start date required");

  if (!end_date) {
    const { data: plan } = await supabase.from("membership_plans").select("duration_days").eq("id", plan_id).single();
    const d = new Date(start_date);
    d.setDate(d.getDate() + (plan?.duration_days || 30));
    end_date = d.toISOString().slice(0, 10);
  }
  // Auto-resolve amount from plan if not provided
  let finalAmount = price_paid;
  if (!finalAmount) {
    const { data: plan } = await supabase.from("membership_plans").select("price").eq("id", plan_id).single();
    finalAmount = Number(plan?.price || 0);
  }

  let status: string = role === "staff" ? "pending" : "active";
  let pStatus: string = role === "staff" ? "pending" : "completed";
  const base: Record<string, unknown> = { member_id: memberId, plan_id, start_date, end_date, price_paid: finalAmount, status, ...(user?.id ? { created_by: user.id } : {}) };
  let { data: mm, error } = await supabase.from("member_memberships").insert(base).select("id").single() as any;
  if (error && (error.code === "PGRST204" || String(error.message).includes("created_by"))) {
    const { created_by: _o, ...withoutCreated } = base as any;
    const retry = await supabase.from("member_memberships").insert(withoutCreated).select("id").single();
    mm = retry.data as any; error = retry.error as any;
  }
  if (error && String(error.message).toLowerCase().includes("violates check constraint")) {
    const { created_by: _o2, ...withoutPending } = base as any;
    delete (withoutPending as any).created_by;
    (withoutPending as any).status = "active";
    const retry2 = await supabase.from("member_memberships").insert(withoutPending).select("id").single();
    mm = retry2.data as any; error = retry2.error as any;
    pStatus = "completed";
  }
  if (error) throw new Error(error.message);
  // Auto-create payment together with membership (no manual Record Payment needed)
  if (finalAmount && mm?.id) {
    const payBase: Record<string, unknown> = { member_id: memberId, membership_id: mm.id, amount: finalAmount, payment_method, payment_date: start_date, status: pStatus, ...(user?.id ? { created_by: user.id } : {}) };
    let { error: payErr } = await supabase.from("payments").insert(payBase as any);
    if (payErr && (payErr.code === "PGRST204" || String(payErr.message).includes("created_by"))) {
      const { created_by: _o, ...withoutCreated } = payBase as any;
      const retry = await supabase.from("payments").insert(withoutCreated);
      payErr = retry.error as any;
    }
    if (payErr && String(payErr.message).toLowerCase().includes("violates check constraint")) {
      const { created_by: _o2, ...withoutPending } = payBase as any;
      delete (withoutPending as any).created_by;
      (withoutPending as any).status = "completed";
      const retry2 = await supabase.from("payments").insert(withoutPending);
      payErr = retry2.error as any;
    }
    if (payErr) throw new Error(payErr.message);
  }
  revalidatePath(`/dashboard/members/${memberId}`);
  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard/payments");
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

export async function renewMembership(memberId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).single() : { data: null } as any;
  if (profile?.role !== "admin") throw new Error("Only admin can renew membership");

  const plan_id = String(formData.get("plan_id") || "");
  const start_date = String(formData.get("start_date") || new Date().toISOString().slice(0, 10));
  const amountInput = Number(formData.get("amount") || 0);
  const payment_method = String(formData.get("payment_method") || "cash");
  const payment_date = String(formData.get("payment_date") || start_date);
  const notes = String(formData.get("notes") || "") || null;
  const proofFile = formData.get("proof") as File | null;

  if (!plan_id) throw new Error("Plan required");

  const { data: newPlan } = await supabase.from("membership_plans").select("price,duration_days").eq("id", plan_id).single();
  if (!newPlan) throw new Error("Plan not found");

  const selectedPrice = Number(newPlan.price || 0);
  const selectedDuration = Number(newPlan.duration_days || 30);

  const { data: currentMembership } = await supabase
    .from("member_memberships")
    .select("id,end_date,plan_id,price_paid,membership_plans(price,duration_days)")
    .eq("member_id", memberId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let amount = amountInput > 0 ? amountInput : selectedPrice;
  if (currentMembership?.end_date) {
    const now = new Date();
    const currentEnd = new Date(currentMembership.end_date);
    const remainingMs = Math.max(currentEnd.getTime() - now.setHours(0, 0, 0, 0), 0);
    const remainingDays = Math.max(1, Math.ceil(remainingMs / 86400000));
    const currentPlan = (currentMembership as any).membership_plans;
    const currentPrice = Number(currentPlan?.price || currentMembership.price_paid || 0);
    const currentDuration = Number(currentPlan?.duration_days || 30);
    const currentCredit = (remainingDays / currentDuration) * currentPrice;
    amount = Math.max(selectedPrice - currentCredit, 0);
  }

  if (amount <= 0) amount = selectedPrice;

  const d = new Date(start_date);
  d.setDate(d.getDate() + selectedDuration);
  const end_date = d.toISOString().slice(0, 10);

  // Upload proof if exists
  let proof_url: string | null = null;
  if (proofFile && proofFile.size > 0) {
    const ext = proofFile.name.split(".").pop() || "jpg";
    const path = `${memberId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, proofFile, { contentType: proofFile.type || "image/jpeg" });
    if (upErr) throw new Error("Proof upload failed: " + upErr.message);
    const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);
    proof_url = urlData.publicUrl;
  }

  const { data: mm, error: mmErr } = await supabase.from("member_memberships").insert({ member_id: memberId, plan_id, start_date, end_date, price_paid: amount, status: "active", notes, created_by: user?.id } as any).select("id").single();
  let membershipId: string | null = mm?.id || null;
  let finalMmErr: any = mmErr;
  if (finalMmErr && (finalMmErr.code === "PGRST204" || String(finalMmErr.message).includes("created_by"))) {
    const retry = await supabase.from("member_memberships").insert({ member_id: memberId, plan_id, start_date, end_date, price_paid: amount, status: "active", notes }).select("id").single();
    membershipId = retry.data?.id || null;
    finalMmErr = retry.error;
  }
  if (finalMmErr) throw new Error(finalMmErr.message);

  const payPayload: Record<string, unknown> = { member_id: memberId, membership_id: membershipId, amount, payment_method, payment_date, notes, proof_url, status: "completed", created_by: user?.id };
  let { error: payErr } = await supabase.from("payments").insert(payPayload as any);
  if (payErr && (payErr.code === "PGRST204" || String(payErr.message).includes("created_by") || String(payErr.message).includes("proof_url"))) {
    const { created_by: _c, proof_url: _p, ...without } = payPayload as any;
    const retry: any = await supabase.from("payments").insert({ member_id: memberId, membership_id: membershipId, amount, payment_method, payment_date, notes, status: "completed" });
    payErr = retry.error;
    if (!payErr && proof_url) {
      await supabase.from("payments").update({ notes: `${notes || ""} [proof: ${proof_url}]` } as any).eq("membership_id", membershipId).eq("amount", amount).order("created_at", { ascending: false }).limit(1);
    }
  }
  if (payErr) throw new Error(payErr.message);
  revalidatePath(`/dashboard/members/${memberId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payments");
}

export async function checkIn(memberId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("attendances").insert({ member_id: memberId } as any);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

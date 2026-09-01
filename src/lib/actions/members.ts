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
  const payload = {
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
    created_by: user?.id || null,
  };
  if (!payload.first_name || !payload.last_name) throw new Error("Name required");
  const plan_id = String(formData.get("plan_id") || "");
  const pt_plan_id = String(formData.get("pt_plan_id") || "");
  const start_date = String(formData.get("start_date") || "");
  if (!plan_id || !start_date) throw new Error("Membership plan and start date required");
  const price_paid = formData.get("price_paid") ? Number(formData.get("price_paid")) : null;
  const payment_method = String(formData.get("payment_method") || "cash");

  // Insert member
  const { data: member, error } = await supabase.from("members").insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  if (!member) throw new Error("Failed to create member");

  const memberId = member.id;
  // Helper to create membership
  async function createMembership(pid: string) {
    const { data: plan } = await supabase.from("membership_plans").select("duration_days,price").eq("id", pid).single();
    const duration = plan?.duration_days || 30;
    const s = new Date(start_date);
    const e = new Date(s);
    e.setDate(e.getDate() + duration);
    const end_date = e.toISOString().slice(0, 10);
    const amount = price_paid ?? (pid === plan_id ? Number(plan?.price || 0) : Number(plan?.price || 0));
    const status = isStaff ? "pending" : "active";
    const pStatus = isStaff ? "pending" : "completed";
    const { data: mm } = await supabase.from("member_memberships").insert({
      member_id: memberId,
      plan_id: pid,
      start_date,
      end_date,
      price_paid: amount || null,
      status,
      created_by: user?.id || null,
    }).select("id").single();
    if (amount && mm) {
      await supabase.from("payments").insert({
        member_id: memberId,
        membership_id: mm.id,
        amount,
        payment_method,
        payment_date: start_date,
        status: pStatus,
        created_by: user?.id || null,
      });
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
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/members");
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
  const status = role === "staff" ? "pending" : "active";
  const { error } = await supabase.from("member_memberships").insert({ member_id: memberId, plan_id, start_date, end_date, price_paid, status, created_by: user?.id || null });
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
  const status = role === "staff" ? "pending" : "completed";
  const { error } = await supabase.from("payments").insert({ member_id: memberId, membership_id, amount, payment_method, payment_date, notes, status, created_by: user?.id || null });
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

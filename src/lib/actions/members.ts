"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createMember(formData: FormData) {
  const supabase = await createClient();
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
  };
  if (!payload.first_name || !payload.last_name) throw new Error("Name required");
  const { error } = await supabase.from("members").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
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
  const plan_id = String(formData.get("plan_id") || "");
  const start_date = String(formData.get("start_date") || "");
  const end_date = String(formData.get("end_date") || "");
  const price_paid = formData.get("price_paid") ? Number(formData.get("price_paid")) : null;
  if (!plan_id || !start_date || !end_date) throw new Error("Plan and dates required");
  const { error } = await supabase.from("member_memberships").insert({ member_id: memberId, plan_id, start_date, end_date, price_paid, status: "active" });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/members/${memberId}`);
}

export async function recordPayment(memberId: string, formData: FormData) {
  const supabase = await createClient();
  const amount = Number(formData.get("amount"));
  const payment_method = String(formData.get("payment_method") || "cash");
  const payment_date = String(formData.get("payment_date") || new Date().toISOString().slice(0,10));
  const membership_id = String(formData.get("membership_id") || "") || null;
  const notes = String(formData.get("notes") || "") || null;
  if (!amount) throw new Error("Amount required");
  const { error } = await supabase.from("payments").insert({ member_id: memberId, membership_id, amount, payment_method, payment_date, notes });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/members/${memberId}`);
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
}

export async function checkIn(memberId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("attendances").insert({ member_id: memberId });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard");
}

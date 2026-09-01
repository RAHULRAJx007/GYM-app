"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function approveMembership(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing id");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let { error } = await supabase.from("member_memberships").update({ status: "active", approved_by: user?.id, approved_at: new Date().toISOString() } as any).eq("id", id);
  if (error && (error.code === "PGRST204" || String(error.message).includes("approved_by"))) {
    const retry = await supabase.from("member_memberships").update({ status: "active" } as any).eq("id", id);
    error = retry.error as any;
  }
  if (error) throw new Error(error.message);

  let paymentError = await supabase.from("payments").update({ status: "completed", approved_by: user?.id, approved_at: new Date().toISOString() } as any).eq("membership_id", id).in("status", ["pending", "rejected"]);
  if (paymentError.error && (paymentError.error.code === "PGRST204" || String(paymentError.error.message).includes("approved_by"))) {
    const retry = await supabase.from("payments").update({ status: "completed" } as any).eq("membership_id", id).in("status", ["pending", "rejected"]);
    paymentError = retry;
  }
  if (paymentError.error) throw new Error(paymentError.error.message);

  revalidatePath("/dashboard/approvals");
  redirect("/dashboard/approvals");
}

export async function rejectMembership(formData: FormData) {
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  await supabase.from("member_memberships").update({ status: "rejected", updated_at: new Date().toISOString() } as any).eq("id", id);
  await supabase.from("payments").update({ status: "rejected" } as any).eq("membership_id", id).in("status", ["pending", "completed"]);
  const { data: rejected } = await supabase.from("member_memberships").select("id,updated_at").eq("status", "rejected").order("updated_at", { ascending: true });
  if (rejected && rejected.length > 30) {
    const toDelete = rejected.slice(0, rejected.length - 30).map((r: any) => r.id);
    for (const delId of toDelete) await supabase.from("member_memberships").delete().eq("id", delId);
  }
  revalidatePath("/dashboard/approvals");
  redirect("/dashboard/approvals");
}

export async function approvePayment(formData: FormData) {
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let { error } = await supabase.from("payments").update({ status: "completed", approved_by: user?.id, approved_at: new Date().toISOString() } as any).eq("id", id);
  if (error && (error.code === "PGRST204" || String(error.message).includes("approved_by"))) {
    const retry = await supabase.from("payments").update({ status: "completed" } as any).eq("id", id);
    error = retry.error as any;
  }
  if (error) throw new Error(error.message);
  const { data: pay2 } = await supabase.from("payments").select("membership_id").eq("id", id).single();
  if (pay2?.membership_id) {
    let { error: mmErr } = await supabase.from("member_memberships").update({ status: "active", approved_by: user?.id, approved_at: new Date().toISOString() } as any).eq("id", pay2.membership_id).eq("status", "pending");
    if (mmErr && (mmErr.code === "PGRST204" || String(mmErr.message).includes("approved_by"))) {
      const retry = await supabase.from("member_memberships").update({ status: "active" } as any).eq("id", pay2.membership_id).eq("status", "pending");
      mmErr = retry.error as any;
    }
  }
  revalidatePath("/dashboard/approvals");
  redirect("/dashboard/approvals");
}

export async function rejectPayment(formData: FormData) {
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  await supabase.from("payments").update({ status: "rejected" } as any).eq("id", id);
  const { data: rejected } = await supabase.from("payments").select("id").eq("status", "rejected").order("created_at", { ascending: true });
  if (rejected && rejected.length > 30) {
    const toDelete = rejected.slice(0, rejected.length - 30).map((r: any) => r.id);
    for (const delId of toDelete) await supabase.from("payments").delete().eq("id", delId);
  }
  revalidatePath("/dashboard/approvals");
  redirect("/dashboard/approvals");
}

export async function reapproveMembership(formData: FormData) {
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let { error } = await supabase.from("member_memberships").update({ status: "active", approved_by: user?.id, approved_at: new Date().toISOString() } as any).eq("id", id).eq("status", "rejected");
  if (error && (error.code === "PGRST204" || String(error.message).includes("approved_by"))) {
    const retry = await supabase.from("member_memberships").update({ status: "active" } as any).eq("id", id).eq("status", "rejected");
    error = retry.error as any;
  }
  if (error) throw new Error(error.message);
  await supabase.from("payments").update({ status: "completed" } as any).eq("membership_id", id).eq("status", "rejected");
  revalidatePath("/dashboard/approvals");
  redirect("/dashboard/approvals");
}

export async function reapprovePayment(formData: FormData) {
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let { error } = await supabase.from("payments").update({ status: "completed", approved_by: user?.id, approved_at: new Date().toISOString() } as any).eq("id", id).eq("status", "rejected");
  if (error && (error.code === "PGRST204" || String(error.message).includes("approved_by"))) {
    const retry = await supabase.from("payments").update({ status: "completed" } as any).eq("id", id).eq("status", "rejected");
    error = retry.error as any;
  }
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/approvals");
  redirect("/dashboard/approvals");
}

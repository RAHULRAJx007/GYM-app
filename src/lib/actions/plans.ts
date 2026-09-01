"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPlan(formData: FormData) {
  const supabase = await createClient();
  const payload = {
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || "") || null,
    price: Number(formData.get("price")),
    duration_days: Number(formData.get("duration_days")),
    category: String(formData.get("category") || "membership"),
    is_active: String(formData.get("is_active") || "true") === "true",
  };
  if (!payload.name || !payload.price || !payload.duration_days) throw new Error("Name, price, duration required");
  const { error } = await supabase.from("membership_plans").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/plans");
}

export async function updatePlan(id: string, formData: FormData) {
  const supabase = await createClient();
  const payload = {
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || "") || null,
    price: Number(formData.get("price")),
    duration_days: Number(formData.get("duration_days")),
    category: String(formData.get("category") || "membership"),
    is_active: String(formData.get("is_active") || "true") === "true",
  };
  const { error } = await supabase.from("membership_plans").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/plans");
}

export async function deletePlan(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("membership_plans").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/plans");
}

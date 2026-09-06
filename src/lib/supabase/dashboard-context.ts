import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getDashboardContext = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, role: "staff", gym: null };
  }

  const [{ data: profile }, { data: gym }] = await Promise.all([
    supabase.from("profiles").select("role,is_active").eq("id", user.id).single(),
    supabase.from("gym_settings").select("name, phone, address, email").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  // If staff is disabled, treat as no user (will redirect to login with message)
  if (profile && (profile as any).is_active === false) {
    return { supabase, user: null, role: "staff", gym, isDisabled: true as const };
  }

  return {
    supabase,
    user,
    role: profile?.role || "staff",
    gym,
  };
});
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, MobileBottomNav } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role || "staff";
  const theme = role === "admin" ? "theme-admin" : "theme-staff";
  const bg = role === "admin" ? "bg-slate-50" : "bg-emerald-50/30";

  return (
    <div className={`${theme} min-h-screen flex`}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className={`flex-1 ${bg} p-4 md:p-6 pb-20 md:pb-6`}>{children}</main>
        <MobileBottomNav />
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, MobileBottomNav } from "@/components/layout/sidebar";
import { Dumbbell } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { data: gym }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("gym_settings").select("name").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const role = profile?.role || "staff";
  const gymName = gym?.name || "GymCore";
  const theme = role === "admin" ? "theme-admin" : "theme-staff";
  const bg = role === "admin" ? "bg-slate-50/80" : "bg-emerald-50/60";

  return (
    <div className={`${theme} min-h-screen bg-background text-foreground`}>
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <Sidebar gymName={gymName} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Dumbbell className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Gym</div>
                <div className="text-sm font-semibold">{gymName}</div>
              </div>
            </div>
          </header>
          <main className={`flex-1 ${bg} px-3 py-4 pb-24 md:px-6 md:py-6 md:pb-6`}>
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/supabase/dashboard-context";
import { Sidebar, MobileHeader } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, gym } = await getDashboardContext();
  if (!user) redirect("/");

  const gymName = gym?.name || "FORGE Gym";
  const theme = role === "admin" ? "theme-admin" : "theme-staff";

  const isAdmin = role === "admin";
  return (
    <div className={`${theme} min-h-screen bg-background text-foreground`}>
      {/* subtle grid backdrop - color adapts to theme */}
      <div
        className={`fixed inset-0 -z-10 opacity-[0.35] pointer-events-none ${isAdmin ? "forge-grid-dark" : "forge-grid"}`}
      />
      <div className="flex min-h-screen">
        <Sidebar gymName={gymName} />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader gymName={gymName} />
          {/* desktop top meta bar - theme aware */}
          <div className="hidden xl:block sticky top-0 z-10 border-b border-border backdrop-blur-xl" style={{ background: isAdmin ? "rgba(17,20,23,0.8)" : "rgba(255,255,255,0.7)" }}>
            <div className="flex h-[64px] items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-foreground px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-background">
                  {isAdmin ? "ADMIN COMMAND" : "STAFF FORGE"}
                </span>
                <span className="hidden xl:inline text-sm text-muted-foreground">
                  {isAdmin ? "Full access • Approvals • Revenue" : "Phone-optimized • Fast entry"} • <span className="font-semibold text-foreground">{gymName}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className={`h-2 w-2 rounded-full animate-pulse ${isAdmin ? "bg-[var(--accent)]" : "bg-emerald-500"}`} />{" "}
                {isAdmin ? "Admin live" : "Staff live"}
              </div>
            </div>
          </div>

          <main className="flex-1 px-2.5 py-3 sm:px-4 sm:py-6 xl:px-6 xl:pb-8">
            <div className="mx-auto max-w-[1240px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}



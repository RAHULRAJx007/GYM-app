"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  Settings,
  LogOut,
  Dumbbell,
  CheckSquare,
  BarChart3,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Overview" },
  { href: "/dashboard/members", label: "Members", icon: Users, desc: "Directory" },
  { href: "/dashboard/plans", label: "Plans", icon: Package, desc: "Pricing" },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard, desc: "History" },
  { href: "/dashboard/revenue", label: "Revenue", icon: BarChart3, adminOnly: true, desc: "Analytics" },
  { href: "/dashboard/approvals", label: "Approvals", icon: CheckSquare, adminOnly: true, desc: "Queue" },
  { href: "/dashboard/staff", label: "Staff", icon: Users, adminOnly: true, desc: "Team" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, desc: "Gym" },
] as const;

function useRole() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("role").eq("id", user.id).single().then(({ data }) => {
        if (data?.role) setRole(data.role);
      });
    });
  }, []);
  return role;
}

/* ============ DESKTOP: NARROW RAIL + EXPAND ON HOVER ============ */
export function Sidebar({ gymName = "FORGE" }: { gymName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useRole();
  const filteredNav = nav.filter((item) => !(item as any).adminOnly || role === "admin");
  const isStaff = role === "staff";

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "hidden xl:flex w-[280px] shrink-0 flex-col sticky top-0 h-screen p-3 pr-0",
        isStaff ? "bg-background" : "bg-transparent"
      )}
    >
      <div
        className={cn(
          "flex h-full flex-col rounded-[28px] border shadow-[0_12px_40px_rgba(11,14,13,0.08)] overflow-hidden",
          isStaff ? "bg-card border-border" : "bg-[#0A0F0E] border-[#1E2623] text-white"
        )}
      >
        {/* brand */}
        <div className={cn("p-5 border-b", isStaff ? "border-border bg-[#F9F8F4]" : "border-[#1E2623] bg-[#0A0F0E]")}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-foreground shadow-sm">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="hidden xl:block min-w-0 flex-1">
              <div className="text-[16px] font-black tracking-tighter leading-none">FORGE</div>
              <div className="truncate text-[12px] font-semibold text-muted-foreground">{gymName}</div>
            </div>
            <span className="hidden xl:inline-flex rounded-full bg-accent px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-foreground">
              {role === "admin" ? "Admin" : role === "staff" ? "Staff" : "…"}
            </span>
          </div>
          {/* xl only: quick stats */}
          <div className="hidden xl:grid grid-cols-2 gap-2 mt-4">
            <div className={cn("rounded-2xl p-3", isStaff ? "bg-[#F9F8F4] border border-border" : "bg-[#141C1A] border border-[#232B28]")}>
              <div className="text-[10px] uppercase tracking-[0.12em] opacity-60">Mode</div>
              <div className="text-[13px] font-bold">PHONE READY</div>
            </div>
            <div className="rounded-2xl bg-accent p-3 text-foreground">
              <div className="text-[10px] uppercase tracking-[0.12em] font-bold opacity-60">Fast</div>
              <div className="text-[13px] font-black">0.8s avg</div>
            </div>
          </div>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 hide-scrollbar">
          <div className="hidden xl:block px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] opacity-50">Navigate</div>
          {filteredNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all",
                  "xl:px-3 xl:py-2.5",
                  active
                    ? isStaff
                      ? "bg-foreground text-white shadow-md"
                      : "bg-accent text-accent-foreground shadow-[0_4px_20px_rgba(255,200,87,0.35)]"
                    : isStaff
                    ? "text-foreground/70 hover:bg-[#F9F8F4] hover:text-foreground"
                    : "text-white/70 hover:bg-[#14181A] hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl xl:h-8 xl:w-8 transition-colors",
                    active ? (isStaff ? "bg-card/15" : "bg-foreground/10") : isStaff ? "bg-[#F9F8F4] border border-border" : "bg-[#141C1A] border border-[#232B28]"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="hidden xl:block flex-1 truncate">{item.label}</span>
                <span className="hidden xl:block text-[11px] font-medium opacity-60">{item.desc}</span>
              </Link>
            );
          })}
        </nav>

        {/* footer */}
        <div className={cn("p-3 border-t space-y-2", isStaff ? "border-border bg-[#F9F8F4]" : "border-[#1E2623] bg-[#0A0F0E]")}>
          <div className="hidden xl:flex items-center gap-2 rounded-2xl border border-dashed px-3 py-2.5 text-xs font-medium opacity-70" style={{ borderColor: isStaff ? "#E7E3DB" : "#232B28" }}>
            <Sparkles className="h-4 w-4 text-accent-foreground/60" />
            Need help? Press <span className="rounded bg-card px-1 py-0.5 text-[10px] font-bold border">?</span>
          </div>
          <button
            onClick={logout}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full h-11 text-sm font-bold transition-colors xl:justify-start xl:px-4",
              isStaff ? "bg-foreground text-white hover:bg-foreground/90" : "bg-accent text-accent-foreground hover:bg-accent/90"
            )}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden xl:inline">Logout</span>
          </button>
          <div className="hidden xl:block text-center text-[10px] font-semibold uppercase tracking-[0.12em] opacity-40">© Forge Gym OS</div>
        </div>
      </div>
    </aside>
  );
}

/* ============ MOBILE: TOP BAR + DRAWER + FLOATING PILL ============ */
export function MobileHeader({ gymName = "FORGE" }: { gymName?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const role = useRole();
  const filtered = nav.filter((item) => !(item as any).adminOnly || role === "admin");

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const isAdmin = role === "admin";
  return (
    <>
      <header className={cn("xl:hidden sticky top-0 z-30 border-b backdrop-blur-xl", isAdmin ? "bg-[#111417]/90 border-[#242A2E]" : "bg-card/90 border-border")}>
        <div className="flex h-[64px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className={cn("flex h-10 w-10 items-center justify-center rounded-full", isAdmin ? "bg-accent text-accent-foreground" : "bg-foreground text-white")}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[13px] font-black tracking-tighter leading-none">FORGE</div>
              <div className="text-[11px] font-semibold text-muted-foreground truncate max-w-[140px]">{gymName}</div>
            </div>
          </div>
          <span className={cn("rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em]", isAdmin ? "bg-accent text-accent-foreground" : "bg-foreground text-accent")}>
            {role || "…"}
          </span>
        </div>
      </header>

      {/* drawer - theme aware */}
      {open && (
        <div className="xl:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className={cn("relative flex w-[88%] max-w-[340px] flex-col rounded-r-[28px] shadow-[20px_0_60px_rgba(0,0,0,0.35)] overflow-hidden animate-in slide-in-from-left", isAdmin ? "bg-[#111417] border-r border-[#242A2E]" : "bg-card")}>
            <div className={cn("flex items-center justify-between border-b p-5", isAdmin ? "bg-[#040608] border-[#242A2E]" : "bg-[#F9F8F4] border-border")}>
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", isAdmin ? "bg-accent text-accent-foreground" : "bg-foreground text-accent")}>
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <div className={cn("text-sm font-black tracking-tighter", isAdmin ? "text-white" : "text-foreground")}>FORGE.GYM</div>
                  <div className={cn("text-xs", isAdmin ? "text-white/60" : "text-muted-foreground")}>{gymName}</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className={cn("flex h-9 w-9 items-center justify-center rounded-full border", isAdmin ? "border-[#242A2E] bg-[#1A1E21] text-white" : "border-border bg-card")}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
              {filtered.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold",
                      active
                        ? isAdmin
                          ? "bg-accent text-accent-foreground shadow-md"
                          : "bg-foreground text-white shadow-md"
                        : isAdmin
                        ? "bg-[#1A1E21] border border-[#242A2E] text-white/80 hover:bg-[#242A2E]"
                        : "bg-[#F9F8F4] border border-border text-foreground hover:bg-card"
                    )}
                  >
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", active ? (isAdmin ? "bg-black/10" : "bg-card/15") : isAdmin ? "bg-[#242A2E] border border-[#2A3136]" : "bg-card border border-border")}>
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    <span className="text-xs opacity-60">{item.desc}</span>
                  </Link>
                );
              })}
            </nav>

            <div className={cn("border-t p-4 space-y-3", isAdmin ? "border-[#242A2E] bg-[#040608]" : "border-border bg-[#F9F8F4]")}>
              <div className={cn("rounded-2xl p-3 flex items-center gap-2 text-sm font-bold", isAdmin ? "bg-accent text-accent-foreground" : "bg-accent text-accent-foreground")}>
                <Sparkles className="h-4 w-4" /> {isAdmin ? "Admin command • All access" : "Thumb-friendly • No reload"}
              </div>
              <button onClick={logout} className={cn("flex w-full items-center justify-center gap-2 rounded-full h-12 font-bold", isAdmin ? "bg-accent text-accent-foreground" : "bg-foreground text-white")}>
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useRole();
  const isAdmin = role === "admin";
  const all = nav.filter((item) => !(item as any).adminOnly || role === "admin");
  // show max 4 + more; prioritize core
  const primary = all.slice(0, 4);
  const overflowCount = all.length - primary.length;

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // hide on login etc but layout only renders inside dashboard so ok
  return (
    <div className="xl:hidden fixed bottom-3 left-1/2 z-30 -translate-x-1/2 w-[calc(100%-16px)] max-w-[520px] pointer-events-none">
      <nav className={cn(
        "pointer-events-auto flex items-center justify-between gap-1 rounded-full border p-1.5 shadow-[0_16px_40px_rgba(11,14,13,0.3)]",
        isAdmin ? "border-[#2A3136] bg-[#111417]" : "border-foreground bg-foreground"
      )}>
        {primary.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-2.5 transition-all",
                active ? "bg-accent text-foreground shadow-sm" : "text-white/70 hover:text-white"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className="text-[10px] font-bold leading-none tracking-wide">{item.label}</span>
            </Link>
          );
        })}
        {/* more / logout */}
        <div className="flex items-center gap-1">
          {overflowCount > 0 && (
            <Link
              href="/dashboard/settings"
              className={cn(
                "flex flex-col items-center justify-center rounded-full px-3 py-2.5",
                pathname.startsWith("/dashboard/settings") || pathname.startsWith("/dashboard/staff") || pathname.startsWith("/dashboard/revenue") || pathname.startsWith("/dashboard/approvals")
                  ? "bg-accent text-foreground"
                  : "text-white/70"
              )}
            >
              <Menu className="h-[18px] w-[18px]" />
              <span className="text-[10px] font-bold">More</span>
            </Link>
          )}
          <button onClick={logout} className="hidden sm:flex flex-col items-center justify-center rounded-full bg-card/10 px-3 py-2.5 text-white">
            <LogOut className="h-[18px] w-[18px]" />
            <span className="text-[10px] font-bold">Exit</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

// keep MobileNav for backwards compat (not used now)
export function MobileNav() {
  return null;
}


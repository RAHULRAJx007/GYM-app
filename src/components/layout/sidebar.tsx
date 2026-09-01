"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Users, Package, CreditCard, Settings, LogOut, Dumbbell, CheckSquare, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/plans", label: "Plans", icon: Package },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/revenue", label: "Revenue", icon: BarChart3, adminOnly: true },
  { href: "/dashboard/approvals", label: "Approvals", icon: CheckSquare, adminOnly: true },
  { href: "/dashboard/staff", label: "Staff", icon: Users, adminOnly: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
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

export function Sidebar({ gymName = "GymCore" }: { gymName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useRole();
  const filteredNav = nav.filter((item) => !(item as any).adminOnly || role === "admin");

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[inset_-1px_0_0_rgba(148,163,184,0.12)]">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3 rounded-2xl bg-sidebar-accent/70 px-3 py-2.5 ring-1 ring-inset ring-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-orange-900/20">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold tracking-wide">{gymName}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/70">Gym management</div>
          </div>
          <span className="rounded-full border border-sidebar-border bg-sidebar-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/80">
            {role === "admin" ? "Admin" : role === "staff" ? "Staff" : "..."}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {filteredNav.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-orange-900/10"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 rounded-xl border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/90"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const role = useRole();
  const filteredNav = nav.filter((item) => !(item as any).adminOnly || role === "admin");
  return (
    <nav className="md:hidden flex gap-1.5 overflow-x-auto border-b border-border bg-background/90 p-2 px-3 backdrop-blur-sm sticky top-0 z-10 scrollbar-none">
      {filteredNav.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-[42px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium",
              active ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-foreground/80"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileBottomNav() {
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
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar text-sidebar-foreground border-t border-sidebar-border z-20">
      <div className="flex items-center gap-1 overflow-x-auto px-1 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] scrollbar-none">
        {filtered.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[64px] shrink-0 flex-col items-center gap-1 rounded-xl px-2.5 py-1.5",
                active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/70"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex min-w-[64px] shrink-0 flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 text-sidebar-foreground/70"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Logout</span>
        </button>
      </div>
    </nav>
  );
}

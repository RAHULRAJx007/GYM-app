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

export function Sidebar() {
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
    <aside className="w-64 border-r bg-card hidden md:flex flex-col">
      <div className="p-6 flex items-center gap-2 font-bold text-lg border-b">
        <Dumbbell className="h-5 w-5" /> GymCore
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {filteredNav.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
                active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
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
    <nav className="md:hidden flex gap-1.5 p-2 border-b overflow-x-auto scrollbar-none sticky top-0 bg-background z-10">
      {filteredNav.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3.5 py-2.5 rounded-full text-sm whitespace-nowrap font-medium flex items-center gap-1.5 min-h-[40px]",
              active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-20">
      <div className="flex overflow-x-auto scrollbar-none items-center gap-1 px-1 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]">
        {filtered.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-lg min-w-[64px] shrink-0",
                active ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
        <button onClick={logout} className="flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-lg min-w-[64px] shrink-0 text-muted-foreground">
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Logout</span>
        </button>
      </div>
    </nav>
  );
}

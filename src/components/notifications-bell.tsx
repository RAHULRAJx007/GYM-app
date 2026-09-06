"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

type Counts = { pending: number; requests: number; due: number; ended: number; total: number };

export function NotificationsBell() {
  const [counts, setCounts] = useState<Counts>({ pending: 0, requests: 0, due: 0, ended: 0, total: 0 });
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("role").eq("id", user.id).single().then(({ data }) => {
        if (data?.role) setRole(data.role);
        if (data?.role !== "admin") return;
        fetchCounts();
      });
    });
    async function fetchCounts() {
      const supabase = createClient();
      const today = new Date().toISOString().slice(0, 10);
      const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const [{ count: pendingM }, { count: pendingP }, { data: due }, { data: ended }] = await Promise.all([
        supabase.from("member_memberships").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("member_memberships").select("id,end_date,member_id").eq("status", "active").gte("end_date", today).lte("end_date", in7),
        supabase.from("member_memberships").select("id,end_date,member_id").eq("status", "active").lt("end_date", today),
      ]);
      // Deduplicate due/ended per member (same as dashboard)
      const dedupe = (rows: any[] | null) => {
        const m = new Map<string, any>();
        for (const r of rows || []) {
          const ex = m.get(r.member_id);
          if (!ex || new Date(r.end_date) > new Date(ex.end_date)) m.set(r.member_id, r);
        }
        return Array.from(m.values());
      };
      const dueCount = dedupe(due as any).length;
      const endedCount = dedupe(ended as any).length;
      const requests = pendingM || 0;
      const pending = (pendingM || 0) + (pendingP || 0);
      setCounts({ pending, requests, due: dueCount, ended: endedCount, total: pending + dueCount + endedCount });
    }
    // Poll every 30s
    const id = setInterval(() => { if (role === "admin") fetchCounts(); }, 30000);
    return () => clearInterval(id);
  }, [role]);

  if (role !== "admin") return null;
  if (counts.total === 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative h-9 w-9"><Bell className="h-5 w-5" /></Button>} />
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <div className="p-3 text-sm text-muted-foreground text-center">No new updates 🎉</div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative h-9 w-9"><Bell className="h-5 w-5" /><span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">{counts.total > 99 ? "99+" : counts.total}</span></Button>} />
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Updates</span>
            <Badge variant="destructive" className="text-[10px]">{counts.total} new</Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {counts.requests > 0 && (
            <DropdownMenuItem>
              <Link href="/dashboard/approvals" className="flex items-center justify-between w-full">
                <span>New requests</span>
                <Badge variant="outline" className="bg-sky-100 text-sky-800 border-sky-200">{counts.requests} requests</Badge>
              </Link>
            </DropdownMenuItem>
          )}
          {counts.pending > 0 && (
            <DropdownMenuItem>
              <Link href="/dashboard/approvals" className="flex items-center justify-between w-full">
                <span>Pending approvals</span>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">{counts.pending}</Badge>
              </Link>
            </DropdownMenuItem>
          )}
          {counts.due > 0 && (
            <DropdownMenuItem>
              <Link href="/dashboard/members?status=due" className="flex items-center justify-between w-full">
                <span>Due in 7 days</span>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">{counts.due}</Badge>
              </Link>
            </DropdownMenuItem>
          )}
          {counts.ended > 0 && (
            <DropdownMenuItem>
              <Link href="/dashboard/members?status=ended" className="flex items-center justify-between w-full">
                <span>Membership ended</span>
                <Badge variant="destructive" className="text-[10px]">{counts.ended}</Badge>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Link href="/dashboard" className="w-full text-xs text-muted-foreground">View dashboard →</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

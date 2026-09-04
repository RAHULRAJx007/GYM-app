import { getDashboardContext } from "@/lib/supabase/dashboard-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Users, AlertTriangle, Wallet, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { dueMessage } from "@/lib/whatsapp-link";

export default async function DashboardPage() {
  const { supabase, role, gym } = await getDashboardContext();
  const isAdmin = role === "admin";

  const todayStr = new Date().toISOString().slice(0, 10);
  const in7Str = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const [{ count: totalMembers }, { count: activeMembers }, { data: plans }, { data: payments }, { data: expiringRaw }, { data: endedRaw }] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }),
    supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("membership_plans").select("id").eq("is_active", true),
    !isAdmin ? Promise.resolve({ data: [] } as any) : supabase.from("payments").select("amount,payment_date").gte("payment_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
    supabase.from("member_memberships").select("id,end_date, member_id, members(first_name,last_name,phone),membership_plans(name)").eq("status", "active").gte("end_date", todayStr).lte("end_date", in7Str).order("end_date", { ascending: true }).limit(20),
    supabase.from("member_memberships").select("id,end_date, member_id, members(first_name,last_name,phone),membership_plans(name)").eq("status", "active").lt("end_date", todayStr).order("end_date", { ascending: false }).limit(20),
  ]);
  // Deduplicate per member: keep only latest end_date per member, so renewed members don't show old due/ended
  function dedupeByMember(rows: any[] | null) {
    const map = new Map<string, any>();
    for (const r of rows || []) {
      const existing = map.get(r.member_id);
      if (!existing || new Date(r.end_date) > new Date(existing.end_date)) map.set(r.member_id, r);
    }
    return Array.from(map.values());
  }
  const expiring = dedupeByMember(expiringRaw as any[]).slice(0,5);
  const ended = dedupeByMember(endedRaw as any[]).slice(0,5);

  const monthRevenue = (payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);

  const [{ data: recentMembers }] = await Promise.all([
    supabase.from("members").select("id,first_name,last_name,phone,status,created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Overview</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        </div>
        <Link href="/dashboard/members/new" className="w-full sm:w-auto">
          <Button className="h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold shadow-sm sm:w-auto">Add Member</Button>
        </Link>
      </div>

      <div className={!isAdmin ? "grid grid-cols-1 min-[340px]:grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3" : "grid grid-cols-1 min-[340px]:grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4"}>
        <Card className="rounded-2xl border-0 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle><Users className="h-4 w-4 text-primary" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalMembers ?? 0}</div><p className="text-xs text-muted-foreground">{activeMembers ?? 0} active</p></CardContent>
        </Card>
        {isAdmin && (
          <Card className="rounded-2xl border-0 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Revenue (MTD)</CardTitle><Wallet className="h-4 w-4 text-primary" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(monthRevenue)}</div><p className="text-xs text-muted-foreground">{payments?.length ?? 0} payments</p></CardContent>
          </Card>
        )}
        <Card className="rounded-2xl border-0 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Plans</CardTitle><UserPlus className="h-4 w-4 text-primary" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{plans?.length ?? 0}</div><p className="text-xs text-muted-foreground">active plans</p></CardContent>
        </Card>
        <Card className="rounded-2xl border-0 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Expiring (7d)</CardTitle><AlertTriangle className="h-4 w-4 text-amber-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{expiring?.length ?? 0}</div><p className="text-xs text-muted-foreground">needs renewal</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border-0 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <CardHeader><CardTitle className="text-lg">Due in 7 days</CardTitle></CardHeader>
          <CardContent>
            {expiring && expiring.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {(expiring as any[]).map((e) => {
                  const daysLeft = Math.ceil((new Date(e.end_date).getTime() - new Date().setHours(0,0,0,0)) / 86400000);
                  return (
                    <li key={e.id} className="flex flex-col gap-2 rounded-xl border border-border bg-muted p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{e.members?.first_name} {e.members?.last_name}</span>
                        <span className="text-[11px] text-muted-foreground">{e.end_date} • {daysLeft}d left</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{(e as any).membership_plans?.name || "Membership"}</div>
                      {isAdmin && (e as any).members?.phone && (
                        <WhatsAppButton phone={(e as any).members.phone} message={dueMessage(`${(e as any).members.first_name} ${(e as any).members.last_name}`, (e as any).membership_plans?.name || "Membership", e.end_date, daysLeft, gym)} label="WhatsApp reminder" />
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No memberships due in 7 days.</p>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <CardHeader><CardTitle className="text-lg">Membership Ended</CardTitle></CardHeader>
          <CardContent>
            {ended && ended.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {(ended as any[]).map((e) => (
                  <li key={e.id} className="flex flex-col gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{e.members?.first_name} {e.members?.last_name}</span>
                      <span className="text-[11px] font-medium text-destructive">Ended {e.end_date}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{(e as any).membership_plans?.name || "Membership"}</div>
                    {isAdmin && (e as any).members?.phone && (
                      <WhatsAppButton phone={(e as any).members.phone} message={dueMessage(`${(e as any).members.first_name} ${(e as any).members.last_name}`, (e as any).membership_plans?.name || "Membership", e.end_date, -1, gym)} label="WhatsApp – renewal" />
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No ended memberships.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <CardHeader><CardTitle className="text-lg">Recent Members</CardTitle></CardHeader>
        <CardContent>
          {recentMembers && recentMembers.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {recentMembers.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0">
                  <div>
                    <div className="font-medium">{m.first_name} {m.last_name}</div>
                    <div className="text-xs text-muted-foreground">{m.phone || "no phone"}</div>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{m.status}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No members yet. Add your first member.</p>}
        </CardContent>
      </Card>
    </div>
  );
}



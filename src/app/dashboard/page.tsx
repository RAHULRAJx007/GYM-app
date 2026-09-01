import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Users, AlertTriangle, Wallet, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { dueMessage } from "@/lib/whatsapp-link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).single() : { data: null } as any;
  const isAdmin = profile?.role === "admin";

  const todayStr = new Date().toISOString().slice(0, 10);
  const in7Str = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const [{ count: totalMembers }, { count: activeMembers }, { data: plans }, { data: payments }, { data: expiring }, { data: ended }] = await Promise.all([
    supabase.from("members").select("*", { count: "exact", head: true }),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("membership_plans").select("*").eq("is_active", true),
    !isAdmin ? Promise.resolve({ data: [] } as any) : supabase.from("payments").select("amount,payment_date").gte("payment_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
    supabase.from("member_memberships").select("id,end_date, member_id, members(first_name,last_name,phone),membership_plans(name)").eq("status", "active").gte("end_date", todayStr).lte("end_date", in7Str).order("end_date", { ascending: true }).limit(5),
    supabase.from("member_memberships").select("id,end_date, member_id, members(first_name,last_name,phone),membership_plans(name)").eq("status", "active").lt("end_date", todayStr).order("end_date", { ascending: false }).limit(5),
  ]);

  const monthRevenue = (payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);

  const [{ data: recentMembers }] = await Promise.all([
    supabase.from("members").select("id,first_name,last_name,phone,status,created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        <Link href="/dashboard/members/new" className="w-full sm:w-auto"><Button className="w-full sm:w-auto h-11">Add Member</Button></Link>
      </div>

      <div className={!isAdmin ? "grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3" : "grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4"}>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Members</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalMembers ?? 0}</div><p className="text-xs text-muted-foreground">{activeMembers ?? 0} active</p></CardContent></Card>
        {isAdmin && <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(monthRevenue)}</div><p className="text-xs text-muted-foreground">{payments?.length ?? 0} payments</p></CardContent></Card>}
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Plans</CardTitle><UserPlus className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{plans?.length ?? 0}</div><p className="text-xs text-muted-foreground">active plans</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Expiring (7d)</CardTitle><AlertTriangle className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{expiring?.length ?? 0}</div><p className="text-xs text-muted-foreground">needs renewal</p></CardContent></Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Due in 7 days</CardTitle></CardHeader>
          <CardContent>
            {expiring && expiring.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {(expiring as any[]).map((e) => {
                  const daysLeft = Math.ceil((new Date(e.end_date).getTime() - new Date().setHours(0,0,0,0)) / 86400000);
                  return (
                    <li key={e.id} className="flex flex-col gap-1.5 border-b pb-2.5">
                      <div className="flex justify-between">
                        <span className="font-medium">{e.members?.first_name} {e.members?.last_name}</span>
                        <span className="text-muted-foreground text-xs">{e.end_date} • {daysLeft}d left</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{(e as any).membership_plans?.name || "Membership"}</div>
                      {isAdmin && (e as any).members?.phone && (
                        <WhatsAppButton phone={(e as any).members.phone} message={dueMessage(`${(e as any).members.first_name} ${(e as any).members.last_name}`, (e as any).membership_plans?.name || "Membership", e.end_date, daysLeft)} label="WhatsApp reminder" />
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No memberships due in 7 days.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Membership Ended</CardTitle></CardHeader>
          <CardContent>
            {ended && ended.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {(ended as any[]).map((e) => (
                  <li key={e.id} className="flex flex-col gap-1.5 border-b pb-2.5">
                    <div className="flex justify-between">
                      <span className="font-medium">{e.members?.first_name} {e.members?.last_name}</span>
                      <span className="text-destructive text-xs">Ended {e.end_date}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{(e as any).membership_plans?.name || "Membership"}</div>
                    {isAdmin && (e as any).members?.phone && (
                      <WhatsAppButton phone={(e as any).members.phone} message={dueMessage(`${(e as any).members.first_name} ${(e as any).members.last_name}`, (e as any).membership_plans?.name || "Membership", e.end_date, -1)} label="WhatsApp – renewal" />
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No ended memberships.</p>}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent Members</CardTitle></CardHeader>
        <CardContent>
          {recentMembers && recentMembers.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {recentMembers.map((m) => (
                <li key={m.id} className="flex justify-between border-b pb-2">
                  <span>{m.first_name} {m.last_name} <span className="text-muted-foreground">({m.phone || "no phone"})</span></span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">{m.status}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No members yet. Add your first member.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Users, AlertTriangle, Wallet, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: totalMembers }, { count: activeMembers }, { data: plans }, { data: payments }, { data: expiring }] = await Promise.all([
    supabase.from("members").select("*", { count: "exact", head: true }),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("membership_plans").select("*").eq("is_active", true),
    supabase.from("payments").select("amount,payment_date").gte("payment_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
    supabase.from("member_memberships").select("id,end_date, member_id, members(first_name,last_name)").eq("status", "active").lte("end_date", new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)).limit(5),
  ]);

  const monthRevenue = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);

  const [{ data: recentMembers }] = await Promise.all([
    supabase.from("members").select("id,first_name,last_name,phone,status,created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/dashboard/members"><Button>Add Member</Button></Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Members</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalMembers ?? 0}</div><p className="text-xs text-muted-foreground">{activeMembers ?? 0} active</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(monthRevenue)}</div><p className="text-xs text-muted-foreground">{payments?.length ?? 0} payments</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Plans</CardTitle><UserPlus className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{plans?.length ?? 0}</div><p className="text-xs text-muted-foreground">active plans</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Expiring (7d)</CardTitle><AlertTriangle className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{expiring?.length ?? 0}</div><p className="text-xs text-muted-foreground">needs renewal</p></CardContent></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Expiring Soon</CardTitle></CardHeader>
          <CardContent>
            {expiring && expiring.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {(expiring as any[]).map((e) => (
                  <li key={e.id} className="flex justify-between border-b pb-2">
                    <span>{e.members?.first_name} {e.members?.last_name}</span>
                    <span className="text-muted-foreground">{e.end_date}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No memberships expiring in 7 days.</p>}
          </CardContent>
        </Card>
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
    </div>
  );
}

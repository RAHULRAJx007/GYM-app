import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MonthlyBar, MethodPie, CategoryPie, DailyLine } from "@/components/revenue-charts";
import { Wallet, TrendingUp, Clock, Users } from "lucide-react";

export default async function RevenuePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).single() : { data: null } as any;
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: payments } = await supabase.from("payments").select("amount,payment_date,payment_method,status,membership_id, member_memberships!inner(plan_id,membership_plans(category))").eq("status", "completed").order("payment_date", { ascending: true }).limit(2000);
  const { data: pendingPayments } = await supabase.from("payments").select("amount").eq("status", "pending");
  const { data: members } = await supabase.from("members").select("id", { count: "exact", head: true });

  const totalRevenue = (payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const pendingTotal = (pendingPayments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);

  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ytdStart = new Date(now.getFullYear(), 0, 1);
  const mtdRevenue = (payments || []).filter((p: any) => new Date(p.payment_date) >= mtdStart).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const ytdRevenue = (payments || []).filter((p: any) => new Date(p.payment_date) >= ytdStart).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const avgPerMember = members ? 0 : totalRevenue / Math.max(1, (payments || []).length);

  // Monthly last 6 months
  const monthlyMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    monthlyMap.set(key, 0);
  }
  (payments || []).forEach((p: any) => {
    const d = new Date(p.payment_date);
    const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    if (monthlyMap.has(key)) monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(p.amount));
  });
  const monthlyData = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({ month, revenue }));

  // Daily this month
  const dailyMap = new Map<string, number>();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) dailyMap.set(String(d).padStart(2, "0"), 0);
  (payments || []).filter((p: any) => new Date(p.payment_date).getMonth() === now.getMonth() && new Date(p.payment_date).getFullYear() === now.getFullYear()).forEach((p: any) => {
    const day = new Date(p.payment_date).getDate().toString().padStart(2, "0");
    dailyMap.set(day, (dailyMap.get(day) || 0) + Number(p.amount));
  });
  const dailyData = Array.from(dailyMap.entries()).map(([day, revenue]) => ({ day, revenue }));

  // By method
  const byMethod = new Map<string, number>();
  (payments || []).forEach((p: any) => byMethod.set(p.payment_method, (byMethod.get(p.payment_method) || 0) + Number(p.amount)));
  const methodData = Array.from(byMethod.entries()).map(([name, value]) => ({ name: name.toUpperCase(), value }));

  // By category (Gym vs PT)
  const byCat = new Map<string, number>([["Gym", 0], ["PT", 0]]);
  (payments || []).forEach((p: any) => {
    const cat = (p.member_memberships as any)?.membership_plans?.category === "personal_training" ? "PT" : "Gym";
    byCat.set(cat, (byCat.get(cat) || 0) + Number(p.amount));
  });
  const catData = Array.from(byCat.entries()).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Revenue Analytics</h1>
        <span className="text-xs bg-muted px-2 py-1 rounded w-fit">Admin only</span>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalRevenue)}</div><p className="text-xs text-muted-foreground">{payments?.length || 0} completed payments</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">MTD</CardTitle><TrendingUp className="h-4 w-4 text-emerald-500" /></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold">{formatCurrency(mtdRevenue)}</div><p className="text-xs text-muted-foreground">{now.toLocaleString("en-IN", { month: "long" })} • YTD {formatCurrency(ytdRevenue)}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold">{formatCurrency(pendingTotal)}</div><p className="text-xs text-muted-foreground">{pendingPayments?.length || 0} awaiting approval</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Avg / Payment</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalRevenue / Math.max(1, (payments?.length || 1)))}</div><p className="text-xs text-muted-foreground">avg ticket size</p></CardContent></Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="text-base">Monthly Revenue (6 months)</CardTitle><CardDescription className="text-xs">Completed payments only</CardDescription></CardHeader>
          <CardContent className="pt-2"><MonthlyBar data={monthlyData} /></CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="text-base">Daily Revenue (this month)</CardTitle><CardDescription className="text-xs">{now.toLocaleString("en-IN", { month: "long", year: "numeric" })}</CardDescription></CardHeader>
          <CardContent className="pt-2"><DailyLine data={dailyData} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="text-base">By Payment Method</CardTitle></CardHeader>
          <CardContent className="pt-2">
            {methodData.length > 0 ? <MethodPie data={methodData} /> : <p className="text-sm text-muted-foreground py-10 text-center">No payments yet</p>}
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {methodData.map((m) => (
                <div key={m.name} className="flex justify-between border rounded px-2 py-1"><span>{m.name}</span><span className="font-medium">{formatCurrency(m.value)}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="text-base">Gym vs PT</CardTitle><CardDescription className="text-xs">Revenue split by plan category</CardDescription></CardHeader>
          <CardContent className="pt-2">
            {catData.length > 0 ? <CategoryPie data={catData} /> : <p className="text-sm text-muted-foreground py-10 text-center">No categorized payments</p>}
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {catData.map((c) => (
                <div key={c.name} className="flex justify-between border rounded px-2 py-1"><span>{c.name}</span><span className="font-medium">{formatCurrency(c.value)}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

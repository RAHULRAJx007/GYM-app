import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MonthlyBar, MethodPie, CategoryPie, DailyLine } from "@/components/revenue-charts";
import { Wallet, TrendingUp, Clock, Users } from "lucide-react";

export default async function RevenuePage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; month?: string; year?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).single() : { data: null } as any;
  if (profile?.role !== "admin") redirect("/dashboard");

  const params = await searchParams;
  const now = new Date();
  const dateKey = (date: Date) => date.toISOString().slice(0, 10);
  let filterFrom = "";
  let filterTo = "";
  let filterLabel = "All completed payments";
  let filterMode: "all" | "month" | "year" | "range" = "all";

  if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
    const [year, month] = params.month.split("-").map(Number);
    filterFrom = `${params.month}-01`;
    filterTo = dateKey(new Date(year, month, 0));
    filterLabel = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
    filterMode = "month";
  } else if (params.year && /^\d{4}$/.test(params.year)) {
    filterFrom = `${params.year}-01-01`;
    filterTo = `${params.year}-12-31`;
    filterLabel = params.year;
    filterMode = "year";
  } else if (params.from || params.to) {
    filterFrom = params.from || "1900-01-01";
    filterTo = params.to || dateKey(now);
    filterLabel = `${params.from || "Start"} to ${params.to || "Today"}`;
    filterMode = "range";
  }

  let paymentsQuery = supabase.from("payments").select("amount,payment_date,payment_method,status,membership_id, member_memberships(plan_id,membership_plans(category))").eq("status", "completed");
  if (filterFrom) paymentsQuery = paymentsQuery.gte("payment_date", filterFrom);
  if (filterTo) paymentsQuery = paymentsQuery.lte("payment_date", filterTo);
  const { data: payments } = await paymentsQuery.order("payment_date", { ascending: true }).limit(2000);
  const { data: pendingPayments } = await supabase.from("payments").select("amount").eq("status", "pending");
  const { data: members } = await supabase.from("members").select("id", { count: "exact", head: true });

  const totalRevenue = (payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const pendingTotal = (pendingPayments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);

  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ytdStart = new Date(now.getFullYear(), 0, 1);
  const mtdRevenue = (payments || []).filter((p: any) => new Date(p.payment_date) >= mtdStart).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const ytdRevenue = (payments || []).filter((p: any) => new Date(p.payment_date) >= ytdStart).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const avgPerMember = members ? 0 : totalRevenue / Math.max(1, (payments || []).length);

  const chartStart = filterFrom ? new Date(`${filterFrom}T00:00:00`) : new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const chartEnd = filterTo ? new Date(`${filterTo}T00:00:00`) : now;
  const chartDays = Math.max(1, Math.ceil((chartEnd.getTime() - chartStart.getTime()) / 86400000) + 1);
  const dailyChart = filterMode === "month" || (filterMode === "range" && chartDays <= 62);

  // Use daily points for a selected month or short custom range, otherwise monthly points.
  const monthlyMap = new Map<string, number>();
  if (dailyChart) {
    for (let d = new Date(chartStart); d <= chartEnd; d.setDate(d.getDate() + 1)) {
      monthlyMap.set(d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), 0);
    }
  } else {
    const monthCursor = new Date(chartStart.getFullYear(), chartStart.getMonth(), 1);
    const lastMonth = new Date(chartEnd.getFullYear(), chartEnd.getMonth(), 1);
    while (monthCursor <= lastMonth) {
      monthlyMap.set(monthCursor.toLocaleString("en-IN", { month: "short", year: "2-digit" }), 0);
      monthCursor.setMonth(monthCursor.getMonth() + 1);
    }
  }
  (payments || []).forEach((p: any) => {
    const d = new Date(p.payment_date);
    const key = dailyChart
      ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      : d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    if (monthlyMap.has(key)) monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(p.amount));
  });
  const monthlyData = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({ month, revenue }));

  // Daily chart follows the selected month/range, or defaults to the current month.
  const dailyStart = filterMode === "all" ? new Date(now.getFullYear(), now.getMonth(), 1) : chartStart;
  const dailyEnd = filterMode === "all" ? new Date(now.getFullYear(), now.getMonth() + 1, 0) : chartEnd;
  const dailyMap = new Map<string, number>();
  for (let d = new Date(dailyStart); d <= dailyEnd; d.setDate(d.getDate() + 1)) dailyMap.set(d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), 0);
  (payments || []).filter((p: any) => {
    const date = new Date(`${p.payment_date}T00:00:00`);
    return date >= dailyStart && date <= dailyEnd;
  }).forEach((p: any) => {
    const day = new Date(`${p.payment_date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
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
  const years = Array.from(new Set([
    now.getFullYear().toString(),
    ...(payments || []).map((p: any) => new Date(p.payment_date).getFullYear().toString()),
  ])).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Revenue Analytics</h1>
            <p className="mt-1 text-xs text-muted-foreground">{filterLabel}</p>
          </div>
          <span className="text-xs bg-muted px-2 py-1 rounded w-fit">Admin only</span>
        </div>
        <form method="get" className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-2.5 sm:gap-3 sm:p-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] lg:items-end">
          <label className="space-y-1 text-[11px] font-medium">
            <span className="text-muted-foreground">From date</span>
            <input name="from" type="date" defaultValue={params.from || ""} className="h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-xs sm:h-10 sm:px-3 sm:text-sm" />
          </label>
          <label className="space-y-1 text-[11px] font-medium">
            <span className="text-muted-foreground">To date</span>
            <input name="to" type="date" defaultValue={params.to || ""} className="h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-xs sm:h-10 sm:px-3 sm:text-sm" />
          </label>
          <label className="space-y-1 text-[11px] font-medium">
            <span className="text-muted-foreground">Month</span>
            <input name="month" type="month" defaultValue={params.month || ""} className="h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-xs sm:h-10 sm:px-3 sm:text-sm" />
          </label>
          <label className="space-y-1 text-[11px] font-medium">
            <span className="text-muted-foreground">Year</span>
            <select name="year" defaultValue={params.year || ""} className="h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-xs sm:h-10 sm:px-3 sm:text-sm">
              <option value="">All years</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <button type="submit" className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground sm:h-10 sm:px-4 sm:text-sm">Apply</button>
          <a href="/dashboard/revenue" className="flex h-9 items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold sm:h-10 sm:px-4 sm:text-sm">Reset</a>
        </form>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Filtered Revenue</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalRevenue)}</div><p className="text-xs text-muted-foreground">{payments?.length || 0} completed payments</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">MTD</CardTitle><TrendingUp className="h-4 w-4 text-emerald-500" /></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold">{formatCurrency(mtdRevenue)}</div><p className="text-xs text-muted-foreground">{now.toLocaleString("en-IN", { month: "long" })} • YTD {formatCurrency(ytdRevenue)}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold">{formatCurrency(pendingTotal)}</div><p className="text-xs text-muted-foreground">{pendingPayments?.length || 0} awaiting approval</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Avg / Payment</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalRevenue / Math.max(1, (payments?.length || 1)))}</div><p className="text-xs text-muted-foreground">avg ticket size</p></CardContent></Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="text-base">{dailyChart ? "Daily Revenue (selected period)" : "Monthly Revenue"}</CardTitle><CardDescription className="text-xs">{filterLabel}</CardDescription></CardHeader>
          <CardContent className="pt-2"><MonthlyBar data={monthlyData} /></CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="text-base">Daily Revenue</CardTitle><CardDescription className="text-xs">{filterMode === "all" ? now.toLocaleString("en-IN", { month: "long", year: "numeric" }) : filterLabel}</CardDescription></CardHeader>
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



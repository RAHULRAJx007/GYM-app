import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("*, members(first_name,last_name)")
    .order("payment_date", { ascending: false })
    .limit(100);

  const total = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Transactions</p>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        </div>
        <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-sm font-medium text-slate-700">
          {payments?.length || 0} payments
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border-0 bg-white/80 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Total (last 100): {formatCurrency(total)}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="min-w-[120px]">Member</TableHead>
                <TableHead className="whitespace-nowrap">Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Method</TableHead>
                <TableHead className="hidden md:table-cell">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap text-sm">{formatDate(p.payment_date)}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/members/${p.member_id}`} className="text-sm font-medium text-primary underline-offset-2 hover:underline">{p.members?.first_name} {p.members?.last_name}</Link>
                    <div className="sm:hidden text-xs text-muted-foreground">{p.payment_method}</div>
                  </TableCell>
                  <TableCell className="font-semibold whitespace-nowrap text-sm">{formatCurrency(Number(p.amount))}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{p.payment_method}</TableCell>
                  <TableCell className="hidden text-xs md:table-cell max-w-[120px] truncate">{p.receipt_number}</TableCell>
                </TableRow>
              ))}
              {(!payments || payments.length === 0) && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No payments yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

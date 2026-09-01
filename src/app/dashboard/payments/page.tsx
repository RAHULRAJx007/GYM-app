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
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Payments</h1>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3"><CardTitle className="text-base sm:text-lg">Total (last 100): {formatCurrency(total)}</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead className="whitespace-nowrap">Date</TableHead><TableHead className="min-w-[120px]">Member</TableHead><TableHead className="whitespace-nowrap">Amount</TableHead><TableHead className="hidden sm:table-cell">Method</TableHead><TableHead className="hidden md:table-cell">Receipt</TableHead></TableRow></TableHeader>
            <TableBody>
              {payments?.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap text-sm">{formatDate(p.payment_date)}</TableCell>
                  <TableCell><Link href={`/dashboard/members/${p.member_id}`} className="underline text-sm">{p.members?.first_name} {p.members?.last_name}</Link><div className="sm:hidden text-xs text-muted-foreground">{p.payment_method}</div></TableCell>
                  <TableCell className="font-medium whitespace-nowrap text-sm">{formatCurrency(Number(p.amount))}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{p.payment_method}</TableCell>
                  <TableCell className="text-xs hidden md:table-cell max-w-[120px] truncate">{p.receipt_number}</TableCell>
                </TableRow>
              ))}
              {(!payments || payments.length === 0) && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

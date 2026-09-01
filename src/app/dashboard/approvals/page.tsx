import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { approveMembership, rejectMembership, approvePayment, rejectPayment, reapproveMembership, reapprovePayment } from "@/lib/actions/approvals";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "admin") {
    return (
      <div className="max-w-2xl mx-auto py-10 text-center">
        <h1 className="text-xl font-bold">Approvals</h1>
        <p className="text-sm text-muted-foreground mt-2">Only admin can approve. You are logged in as <Badge>{profile?.role}</Badge>.</p>
        <p className="text-xs text-muted-foreground mt-4">Staff: your requests will appear here for admin after you add members/collect payments.</p>
      </div>
    );
  }

  const [{ data: pendingMemberships }, { data: pendingPaymentsRaw }, { data: rejectedMemberships }, { data: rejectedPayments }] = await Promise.all([
    supabase.from("member_memberships").select("id,start_date,end_date,price_paid,notes,status,created_at,members(id,first_name,last_name,phone,email,address,gender,date_of_birth,emergency_contact_name,emergency_contact_phone,medical_notes),membership_plans(id,name,category,price,duration_days,description)").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
    supabase.from("payments").select("id,amount,payment_method,payment_date,notes,status,created_at,membership_id,members(first_name,last_name,phone,email)").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
    supabase.from("member_memberships").select("id,start_date,end_date,price_paid,notes,status,created_at,updated_at,members(id,first_name,last_name,phone,email),membership_plans(id,name,category,price,duration_days,description)").eq("status", "rejected").order("updated_at", { ascending: false }).limit(30),
    supabase.from("payments").select("id,amount,payment_method,payment_date,notes,status,created_at,members(first_name,last_name,phone,email)").eq("status", "rejected").order("created_at", { ascending: false }).limit(30),
  ]);
  // Deduplicate: payments linked to a pending membership are already shown inside that membership card, don't show twice
  const pendingMembershipIds = new Set((pendingMemberships as any[] || []).map((m) => m.id));
  const pendingPayments = (pendingPaymentsRaw as any[] || []).filter((p) => !pendingMembershipIds.has(p.membership_id));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Approvals</h1>
        <Badge variant="outline" className="w-fit">{(pendingMemberships?.length || 0) + (pendingPayments?.length || 0)} pending</Badge>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3"><CardTitle className="text-base sm:text-lg">Pending Memberships ({pendingMemberships?.length || 0})</CardTitle><CardDescription className="text-xs">Staff requests — tap a card to view full details & approve. Linked payment included.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {(pendingMemberships as any[])?.length ? (
            (pendingMemberships as any[]).map((m) => {
              const linkedPay = (pendingPaymentsRaw as any[])?.find((p: any) => p.membership_id === m.id);
              return (
                <div key={m.id} className="rounded-lg border p-3 sm:p-4 space-y-3 bg-card">
                  <Link href={`/dashboard/approvals/${m.id}`} className="block space-y-3 hover:opacity-80">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm sm:text-base flex items-center gap-2">{m.members?.first_name} {m.members?.last_name} <Badge variant="outline" className="text-[10px]">{m.members?.gender || ""}</Badge><span className="text-[11px] text-primary font-normal">View details →</span></div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>Phone: {m.members?.phone || "-"} • Email: {m.members?.email || "-"}</div>
                          <div className="hidden sm:block">Address: {m.members?.address || "-"}</div>
                        </div>
                      </div>
                      <Badge className="w-fit h-fit">Pending</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-t pt-3">
                      <div><div className="text-muted-foreground">Plan</div><div className="font-medium text-sm">{m.membership_plans?.name} <Badge variant="outline" className="ml-1 text-[10px]">{m.membership_plans?.category === "personal_training" ? "PT" : "Gym"}</Badge></div><div className="text-muted-foreground truncate">{m.membership_plans?.duration_days} days • {formatCurrency(Number(m.membership_plans?.price || 0))}</div></div>
                      <div><div className="text-muted-foreground">Period</div><div className="font-medium">{m.start_date} → {m.end_date}</div><div className="text-sm font-semibold">{formatCurrency(Number(m.price_paid || m.membership_plans?.price || 0))}</div></div>
                      <div><div className="text-muted-foreground">Payment</div>{linkedPay ? <><div className="font-medium">{formatCurrency(Number(linkedPay.amount))} • {linkedPay.payment_method.toUpperCase()}</div><div className="text-xs truncate">{formatDate(linkedPay.payment_date)}</div></> : <div className="text-muted-foreground text-xs">No linked payment</div>}</div>
                    </div>
                  </Link>
                  <div className="flex gap-2 pt-2 border-t">
                    <form action={approveMembership} className="flex-1 sm:flex-none"><input type="hidden" name="id" value={m.id} /><Button type="submit" size="sm" className="w-full sm:w-auto h-8">Approve</Button></form>
                    <form action={rejectMembership} className="flex-1 sm:flex-none"><input type="hidden" name="id" value={m.id} /><Button type="submit" size="sm" variant="destructive" className="w-full sm:w-auto h-8">Reject</Button></form>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center py-6 text-sm text-muted-foreground">No pending memberships.</p>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3"><CardTitle className="text-base sm:text-lg">Pending Standalone Payments ({pendingPayments?.length || 0})</CardTitle><CardDescription className="text-xs">Payments not linked to a pending membership (e.g., renewals for existing members)</CardDescription></CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead className="min-w-[140px]">Member</TableHead><TableHead>Amount</TableHead><TableHead className="hidden sm:table-cell">Method</TableHead><TableHead className="hidden md:table-cell">Date</TableHead><TableHead className="min-w-[160px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {(pendingPayments as any[])?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell><div className="font-medium text-sm">{p.members?.first_name} {p.members?.last_name}</div><div className="text-xs text-muted-foreground">{p.members?.phone}</div></TableCell>
                  <TableCell className="font-medium text-sm whitespace-nowrap">{formatCurrency(Number(p.amount))}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{p.payment_method}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{formatDate(p.payment_date)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <form action={approvePayment}><input type="hidden" name="id" value={p.id} /><Button type="submit" size="sm" className="h-8">Approve</Button></form>
                      <form action={rejectPayment}><input type="hidden" name="id" value={p.id} /><Button type="submit" size="sm" variant="destructive" className="h-8">Reject</Button></form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!pendingPayments || pendingPayments.length === 0) && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No pending standalone payments.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="overflow-hidden border-amber-200">
        <CardHeader className="pb-3"><CardTitle className="text-base sm:text-lg flex items-center gap-2">Rejected <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">{(rejectedMemberships?.length || 0) + (rejectedPayments?.length || 0)} / 30</Badge></CardTitle><CardDescription className="text-xs">Accidentally rejected? Approve again. Keeps last 30 — oldest auto-deleted when new rejection comes.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {(!rejectedMemberships?.length && !rejectedPayments?.length) ? (
            <p className="text-center py-6 text-sm text-muted-foreground">No rejected requests.</p>
          ) : (
            <>
              {(rejectedMemberships as any[])?.map((m) => (
                <div key={`rm-${m.id}`} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{m.members?.first_name} {m.members?.last_name} <span className="text-xs text-muted-foreground">• {m.members?.phone || ""}</span> <Badge variant="outline" className="ml-1 text-[10px] bg-white">{m.membership_plans?.name}</Badge></div>
                    <div className="text-xs text-muted-foreground">{m.start_date} → {m.end_date} • {formatCurrency(Number(m.price_paid || m.membership_plans?.price || 0))} • Rejected {m.updated_at ? formatDate(m.updated_at) : formatDate(m.created_at)}</div>
                  </div>
                  <form action={reapproveMembership}><input type="hidden" name="id" value={m.id} /><Button type="submit" size="sm" className="w-full sm:w-auto">Approve again</Button></form>
                </div>
              ))}
              {(rejectedPayments as any[])?.map((p) => (
                <div key={`rp-${p.id}`} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{p.members?.first_name} {p.members?.last_name} <span className="text-xs text-muted-foreground">• {p.members?.phone || ""}</span></div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(Number(p.amount))} • {p.payment_method} • {formatDate(p.payment_date)} • Rejected</div>
                  </div>
                  <form action={reapprovePayment}><input type="hidden" name="id" value={p.id} /><Button type="submit" size="sm" className="w-full sm:w-auto">Approve again</Button></form>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { approveMembership, rejectMembership } from "@/lib/actions/approvals";

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: m } = await supabase
    .from("member_memberships")
    .select("id,start_date,end_date,price_paid,notes,status,created_at,members(id,first_name,last_name,phone,email,address,gender,date_of_birth,emergency_contact_name,emergency_contact_phone,medical_notes,joined_at),membership_plans(id,name,category,price,duration_days,description)")
    .eq("id", id)
    .single();
  if (!m) notFound();
  if (m.status !== "pending") redirect("/dashboard/approvals");

  const { data: linkedPay } = await supabase.from("payments").select("id,amount,payment_method,payment_date,notes,status,receipt_number,created_at").eq("membership_id", id).maybeSingle();

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/approvals"><Button variant="outline" size="sm">← Back</Button></Link>
        <h1 className="text-lg sm:text-xl font-bold">Approval Details</h1>
        <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Member</CardTitle><CardDescription>Full details submitted by staff</CardDescription></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{(m as any).members?.first_name} {(m as any).members?.last_name}</span> <Badge variant="outline" className="ml-1 text-[10px]">{(m as any).members?.gender || "-"}</Badge></div>
            <div><span className="text-muted-foreground">Phone:</span> {(m as any).members?.phone || "-"}</div>
            <div><span className="text-muted-foreground">Email:</span> {(m as any).members?.email || "-"}</div>
            <div><span className="text-muted-foreground">DOB:</span> {(m as any).members?.date_of_birth ? formatDate((m as any).members.date_of_birth) : "-"}</div>
            <div className="sm:col-span-2"><span className="text-muted-foreground">Address:</span> {(m as any).members?.address || "-"}</div>
            <div><span className="text-muted-foreground">Emergency:</span> {(m as any).members?.emergency_contact_name || "-"} {(m as any).members?.emergency_contact_phone || ""}</div>
            <div><span className="text-muted-foreground">Joined:</span> {formatDate((m as any).members?.joined_at)}</div>
            {(m as any).members?.medical_notes && <div className="sm:col-span-2"><span className="text-muted-foreground">Medical:</span> {(m as any).members.medical_notes}</div>}
          </div>
          <Link href={`/dashboard/members/${(m as any).members?.id}`} className="text-xs text-primary underline">View member profile →</Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Membership Plan</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2"><span className="font-semibold text-base">{(m as any).membership_plans?.name}</span> <Badge variant="outline">{(m as any).membership_plans?.category === "personal_training" ? "PT" : "Gym"}</Badge> <Badge variant={m.status === "pending" ? "outline" : "default"} className="bg-amber-100 text-amber-800 border-amber-200">{m.status}</Badge></div>
          <div className="text-muted-foreground">{(m as any).membership_plans?.description || ""} • {(m as any).membership_plans?.duration_days} days • {formatCurrency(Number((m as any).membership_plans?.price || 0))}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t text-xs">
            <div><span className="text-muted-foreground">Period</span><div className="font-medium">{m.start_date} → {m.end_date}</div></div>
            <div><span className="text-muted-foreground">Amount (pay)</span><div className="font-semibold text-sm">{formatCurrency(Number(m.price_paid || (m as any).membership_plans?.price || 0))}</div></div>
            <div><span className="text-muted-foreground">Created</span><div>{formatDate(m.created_at)}</div></div>
          </div>
          {m.notes && <div className="text-xs"><span className="text-muted-foreground">Notes:</span> {m.notes}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Payment</CardTitle><CardDescription>Collected by staff — approve together with membership</CardDescription></CardHeader>
        <CardContent className="text-sm">
          {linkedPay ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2"><span className="font-semibold text-base">{formatCurrency(Number((linkedPay as any).amount))}</span> <Badge variant="outline">{(linkedPay as any).payment_method.toUpperCase()}</Badge> <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">{(linkedPay as any).status}</Badge></div>
              <div className="text-xs text-muted-foreground">Date: {formatDate((linkedPay as any).payment_date)} • Receipt: {(linkedPay as any).receipt_number || (linkedPay as any).id.slice(0,8)} • Created {formatDate((linkedPay as any).created_at)}</div>
              {(linkedPay as any).notes && <div className="text-xs">Notes: {(linkedPay as any).notes}</div>}
            </div>
          ) : (
            <p className="text-muted-foreground">No linked payment found. Staff may need to record payment separately.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <form action={approveMembership} className="flex-1"><input type="hidden" name="id" value={m.id} /><Button className="w-full h-11 text-base">Approve & Activate</Button></form>
        <form action={rejectMembership} className="flex-1"><input type="hidden" name="id" value={m.id} /><Button variant="destructive" className="w-full h-11 text-base">Reject</Button></form>
      </div>
    </div>
  );
}

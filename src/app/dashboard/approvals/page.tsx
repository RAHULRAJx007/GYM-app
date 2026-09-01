import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

async function approveMembership(id: string) {
  "use server";
  const { createClient: createSupabase } = await import("@/lib/supabase/server");
  const supabase = await createSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("member_memberships").update({ status: "active", approved_by: user?.id, approved_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/approvals");
}
async function rejectMembership(id: string) {
  "use server";
  const { createClient: createSupabase } = await import("@/lib/supabase/server");
  const supabase = await createSupabase();
  await supabase.from("member_memberships").update({ status: "rejected" }).eq("id", id);
  revalidatePath("/dashboard/approvals");
}
async function approvePayment(id: string) {
  "use server";
  const { createClient: createSupabase } = await import("@/lib/supabase/server");
  const supabase = await createSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("payments").update({ status: "completed", approved_by: user?.id, approved_at: new Date().toISOString() }).eq("id", id);
  // also activate linked membership if still pending
  const { data: pay } = await supabase.from("payments").select("membership_id").eq("id", id).single();
  if (pay?.membership_id) await supabase.from("member_memberships").update({ status: "active", approved_by: user?.id, approved_at: new Date().toISOString() }).eq("id", pay.membership_id).eq("status", "pending");
  revalidatePath("/dashboard/approvals");
}
async function rejectPayment(id: string) {
  "use server";
  const { createClient: createSupabase } = await import("@/lib/supabase/server");
  const supabase = await createSupabase();
  await supabase.from("payments").update({ status: "rejected" }).eq("id", id);
  revalidatePath("/dashboard/approvals");
}

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

  const [{ data: pendingMemberships }, { data: pendingPayments }] = await Promise.all([
    supabase.from("member_memberships").select("id,start_date,end_date,price_paid,status,created_at,members(first_name,last_name,phone),membership_plans(name,category,price)").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
    supabase.from("payments").select("id,amount,payment_method,payment_date,status,created_at,members(first_name,last_name,phone)").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Approvals</h1>
        <Badge variant="outline" className="w-fit">{(pendingMemberships?.length || 0) + (pendingPayments?.length || 0)} pending</Badge>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3"><CardTitle className="text-base sm:text-lg">Pending Memberships ({pendingMemberships?.length || 0})</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead className="min-w-[140px]">Member</TableHead><TableHead>Plan</TableHead><TableHead className="hidden sm:table-cell">Period</TableHead><TableHead>Amount</TableHead><TableHead className="min-w-[160px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {(pendingMemberships as any[])?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell><div className="font-medium text-sm">{m.members?.first_name} {m.members?.last_name}</div><div className="text-xs text-muted-foreground">{m.members?.phone}</div></TableCell>
                  <TableCell><div className="text-sm font-medium">{m.membership_plans?.name}</div><div className="text-xs"><Badge variant="outline" className="text-[10px]">{m.membership_plans?.category === "personal_training" ? "PT" : "Gym"}</Badge></div></TableCell>
                  <TableCell className="hidden sm:table-cell text-xs whitespace-nowrap">{m.start_date} → {m.end_date}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatCurrency(Number(m.price_paid || m.membership_plans?.price || 0))}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <form action={approveMembership.bind(null, m.id)}><Button size="sm" className="h-8">Approve</Button></form>
                      <form action={rejectMembership.bind(null, m.id)}><Button size="sm" variant="destructive" className="h-8">Reject</Button></form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!pendingMemberships || pendingMemberships.length === 0) && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No pending memberships.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3"><CardTitle className="text-base sm:text-lg">Pending Payments ({pendingPayments?.length || 0})</CardTitle></CardHeader>
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
                      <form action={approvePayment.bind(null, p.id)}><Button size="sm" className="h-8">Approve</Button></form>
                      <form action={rejectPayment.bind(null, p.id)}><Button size="sm" variant="destructive" className="h-8">Reject</Button></form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!pendingPayments || pendingPayments.length === 0) && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No pending payments.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

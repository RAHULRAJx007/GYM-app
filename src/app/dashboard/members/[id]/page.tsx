import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { assignMembership, recordPayment, checkIn, deleteMember, updateMember } from "@/lib/actions/members";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: member } = await supabase.from("members").select("*").eq("id", id).single();
  if (!member) notFound();

  const [{ data: memberships }, { data: payments }, { data: attendances }, { data: plans }] = await Promise.all([
    supabase.from("member_memberships").select("*, membership_plans(name,price)").eq("member_id", id).order("created_at", { ascending: false }),
    supabase.from("payments").select("*").eq("member_id", id).order("payment_date", { ascending: false }).limit(20),
    supabase.from("attendances").select("*").eq("member_id", id).order("check_in_at", { ascending: false }).limit(10),
    supabase.from("membership_plans").select("id,name,price,duration_days").eq("is_active", true),
  ]);

  const activeMembership = memberships?.find((m) => m.status === "active");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{member.first_name} {member.last_name} <Badge className="ml-2">{member.status}</Badge></h1>
        <Link href="/dashboard/members"><Button variant="outline">Back</Button></Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Phone:</span> {member.phone || "-"}</p>
            <p><span className="text-muted-foreground">Email:</span> {member.email || "-"}</p>
            <p><span className="text-muted-foreground">Gender:</span> {member.gender || "-"}</p>
            <p><span className="text-muted-foreground">DOB:</span> {member.date_of_birth || "-"}</p>
            <p><span className="text-muted-foreground">Joined:</span> {formatDate(member.joined_at)}</p>
            <p><span className="text-muted-foreground">Address:</span> {member.address || "-"}</p>
            <p><span className="text-muted-foreground">Emergency:</span> {member.emergency_contact_name || "-"} {member.emergency_contact_phone || ""}</p>
            <p><span className="text-muted-foreground">Medical:</span> {member.medical_notes || "-"}</p>
            <div className="pt-4 flex gap-2">
              <form action={checkIn.bind(null, id)}><Button size="sm" type="submit">Check In</Button></form>
              <form action={deleteMember.bind(null, id)}><Button size="sm" variant="destructive" type="submit">Delete</Button></form>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Current Membership</CardTitle></CardHeader>
            <CardContent>
              {activeMembership ? (
                <div className="text-sm">
                  <p className="font-medium">{(activeMembership as any).membership_plans?.name} — {formatCurrency(Number((activeMembership as any).price_paid || (activeMembership as any).membership_plans?.price || 0))}</p>
                  <p className="text-muted-foreground">{activeMembership.start_date} → {activeMembership.end_date} ({activeMembership.status})</p>
                </div>
              ) : <p className="text-sm text-muted-foreground">No active membership.</p>}
              <form action={assignMembership.bind(null, id)} className="mt-4 grid grid-cols-2 gap-2">
                <select name="plan_id" required className="border rounded-md px-3 py-2 text-sm"><option value="">Select Plan</option>{plans?.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(Number(p.price))} / {p.duration_days}d</option>)}</select>
                <Input name="price_paid" type="number" placeholder="Price paid (optional)" />
                <Input name="start_date" type="date" required defaultValue={new Date().toISOString().slice(0,10)} />
                <Input name="end_date" type="date" required />
                <Button type="submit" className="col-span-2">Assign Plan</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Record Payment</CardTitle></CardHeader>
            <CardContent>
              <form action={recordPayment.bind(null, id)} className="grid grid-cols-2 gap-2">
                <Input name="amount" type="number" step="0.01" placeholder="Amount *" required />
                <select name="payment_method" className="border rounded-md px-3 text-sm"><option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="bank_transfer">Bank Transfer</option><option value="other">Other</option></select>
                <Input name="payment_date" type="date" defaultValue={new Date().toISOString().slice(0,10)} />
                <select name="membership_id" className="border rounded-md px-3 text-sm"><option value="">Link to membership (optional)</option>{memberships?.map((m) => <option key={m.id} value={m.id}>{m.start_date} → {m.end_date}</option>)}</select>
                <Input name="notes" placeholder="Notes" className="col-span-2" />
                <Button type="submit" className="col-span-2">Record Payment</Button>
              </form>
              <div className="mt-4 space-y-1 text-sm">
                {payments?.map((p) => (
                  <div key={p.id} className="flex justify-between border-b py-1"><span>{formatDate(p.payment_date)} • {p.payment_method} • {p.receipt_number}</span><span className="font-medium">{formatCurrency(Number(p.amount))}</span></div>
                ))}
                {(!payments || payments.length === 0) && <p className="text-muted-foreground">No payments yet.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Attendance (last 10)</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              {attendances?.map((a) => <div key={a.id} className="border-b py-1">{new Date(a.check_in_at).toLocaleString("en-IN")} {a.check_out_at ? `→ ${new Date(a.check_out_at).toLocaleString("en-IN")}` : "(checked in)"}</div>)}
              {(!attendances || attendances.length === 0) && <p className="text-muted-foreground">No check-ins yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Edit Member</CardTitle></CardHeader>
            <CardContent>
              <form action={updateMember.bind(null, id)} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>First Name</Label><Input name="first_name" defaultValue={member.first_name} required /></div>
                  <div><Label>Last Name</Label><Input name="last_name" defaultValue={member.last_name} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Phone</Label><Input name="phone" defaultValue={member.phone || ""} /></div>
                  <div><Label>Email</Label><Input name="email" defaultValue={member.email || ""} /></div>
                </div>
                <div><Label>Address</Label><Input name="address" defaultValue={member.address || ""} /></div>
                <div><Label>Medical Notes</Label><Textarea name="medical_notes" defaultValue={member.medical_notes || ""} rows={2} /></div>
                <div><Label>Status</Label><select name="status" defaultValue={member.status} className="flex h-9 w-full rounded-md border px-3 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option><option value="frozen">Frozen</option><option value="cancelled">Cancelled</option></select></div>
                <input type="hidden" name="gender" value={member.gender || ""} />
                <input type="hidden" name="date_of_birth" value={member.date_of_birth || ""} />
                <input type="hidden" name="emergency_contact_name" value={member.emergency_contact_name || ""} />
                <input type="hidden" name="emergency_contact_phone" value={member.emergency_contact_phone || ""} />
                <Button type="submit">Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

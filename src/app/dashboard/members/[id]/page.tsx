import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { assignMembership, recordPayment, checkIn, deleteMember, updateMember, renewMembership } from "@/lib/actions/members";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { dueMessage } from "@/lib/whatsapp-link";
import { RenewMembershipForm } from "@/components/renew-membership-form";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).single() : { data: null } as any;
  const isAdmin = profile?.role === "admin";
  const { data: gym } = await supabase.from("gym_settings").select("name, phone, address, email").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: member } = await supabase.from("members").select("*").eq("id", id).single();
  if (!member) notFound();

  const [{ data: memberships }, { data: payments }, { data: attendances }, { data: plans }] = await Promise.all([
    supabase.from("member_memberships").select("*, membership_plans(name,price)").eq("member_id", id).order("created_at", { ascending: false }),
    supabase.from("payments").select("*").eq("member_id", id).order("payment_date", { ascending: false }).limit(20),
    supabase.from("attendances").select("*").eq("member_id", id).order("check_in_at", { ascending: false }).limit(10),
    supabase.from("membership_plans").select("id,name,price,duration_days").eq("is_active", true),
  ]);

  const activeMembership = memberships?.find((m) => m.status === "active");
  const pendingMembership = memberships?.find((m) => m.status === "pending");
  const hasPending = !!pendingMembership;
  const today0 = new Date().setHours(0,0,0,0);
  const activeEnd = activeMembership ? new Date(activeMembership.end_date).setHours(0,0,0,0) : null;
  const daysLeftActive = activeEnd !== null ? Math.ceil((activeEnd - today0) / 86400000) : null;
  const isDue = activeEnd !== null && daysLeftActive !== null && daysLeftActive >= 0 && daysLeftActive <= 7;
  const isEnded = activeEnd !== null && daysLeftActive !== null && daysLeftActive < 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {hasPending && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-medium text-amber-800">Waiting for admin approval</span>
          <span className="text-amber-700 hidden sm:inline">— membership will be active after admin approves in Approvals</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-lg sm:text-2xl font-bold break-words">{member.first_name} {member.last_name} <Badge className="ml-2 align-middle">{member.status}</Badge>{hasPending && <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">Pending approval</Badge>}{!hasPending && isDue && <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">Due in {daysLeftActive}d</Badge>}{!hasPending && isEnded && <Badge variant="destructive" className="ml-2">Ended</Badge>}</h1>
        <Link href="/dashboard/members" className="w-full sm:w-auto"><Button variant="outline" className="w-full sm:w-auto">Back</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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
            {isAdmin && (isDue || isEnded) && member.phone && activeMembership && (
              <div className="pt-3">
                <WhatsAppButton
                  phone={member.phone}
                  message={dueMessage(`${member.first_name} ${member.last_name}`, (activeMembership as any).membership_plans?.name || "Membership", activeMembership.end_date, daysLeftActive!, gym)}
                  label={isEnded ? "WhatsApp – renewal" : `WhatsApp – due in ${daysLeftActive}d`}
                  size="default"
                  className="w-full"
                />
              </div>
            )}
            <div className="pt-4 flex gap-2">
              {isAdmin ? (
                <form action={deleteMember.bind(null, id)}><Button size="sm" variant="destructive" type="submit">Delete</Button></form>
              ) : (
                <p className="text-xs text-muted-foreground py-1">Delete: admin only</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>{isAdmin ? (isEnded ? "Renew / Change Plan" : activeMembership ? "Current Membership" : "Assign Membership") : "Membership"}</CardTitle></CardHeader>
            <CardContent>
              {hasPending ? (
                <div className="text-sm rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="font-medium text-amber-800">{(pendingMembership as any).membership_plans?.name} — {formatCurrency(Number((pendingMembership as any).price_paid || (pendingMembership as any).membership_plans?.price || 0))} <Badge variant="outline" className="ml-1 bg-amber-100 text-amber-800 border-amber-200 text-[10px]">Pending</Badge></p>
                  <p className="text-amber-700">{pendingMembership!.start_date} → {pendingMembership!.end_date} (waiting for admin approval)</p>
                  <p className="text-xs text-muted-foreground mt-1">Approve in Approvals to activate. {isAdmin ? "" : "Staff cannot activate."}</p>
                </div>
              ) : activeMembership ? (
                <div className="text-sm space-y-2">
                  <p className="font-medium">{(activeMembership as any).membership_plans?.name} — {formatCurrency(Number((activeMembership as any).price_paid || (activeMembership as any).membership_plans?.price || 0))}</p>
                  <p className="text-muted-foreground">{activeMembership.start_date} → {activeMembership.end_date} ({activeMembership.status}) {(isDue || isEnded) && <span className={isEnded ? "text-destructive font-medium" : "text-amber-600 font-medium"}>• {isEnded ? "Ended" : `Due in ${daysLeftActive}d`}</span>}</p>
                </div>
              ) : <p className="text-sm text-muted-foreground">No active membership.</p>}
              {isAdmin ? (
                !activeMembership && !hasPending ? (
                  <form action={assignMembership.bind(null, id)} className="mt-4 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select name="plan_id" required className="border rounded-md px-3 py-2 text-sm h-11 bg-transparent"><option value="">Select Plan</option>{plans?.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(Number(p.price))} / {p.duration_days}d</option>)}</select>
                      <Input name="price_paid" type="number" placeholder="Amount (auto from plan)" className="h-11" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input name="start_date" type="date" required lang="en-GB" defaultValue={new Date().toISOString().slice(0,10)} className="h-11" />
                      <select name="payment_method" className="border rounded-md px-3 text-sm h-11 bg-transparent"><option value="upi">UPI</option><option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option><option value="other">Other</option></select>
                    </div>
                    <Button type="submit" className="w-full h-11">Assign Membership</Button>
                    <p className="text-xs text-muted-foreground">New member setup. Payment is auto-created from the selected plan and method.</p>
                  </form>
                ) : (
                  <RenewMembershipForm
                    memberId={id}
                    plans={plans ?? []}
                    currentMembership={activeMembership}
                    isEnded={isEnded}
                    submitLabel={isEnded ? "Renew Membership" : "Renew / Change Plan"}
                    action={renewMembership}
                  />
                )
              ) : (
                <p className="text-xs text-muted-foreground mt-3">Membership manage: admin only. Staff creates via Add Member.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payment History</CardTitle><CardDescription className="text-xs">Auto-created when you assign/renew membership — no manual entry</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {payments?.map((p) => (
                  <div key={p.id} className="flex justify-between border-b py-1.5 gap-2"><span className="min-w-0 truncate">{formatDate(p.payment_date)} • {p.payment_method} • {p.receipt_number} <Badge variant="outline" className="ml-1 text-[10px]">{p.status}</Badge>{(p as any).proof_url && <a href={(p as any).proof_url} target="_blank" className="ml-1 underline text-primary">SS</a>}</span><span className="font-medium shrink-0">{formatCurrency(Number(p.amount))}</span></div>
                ))}
                {(!payments || payments.length === 0) && <p className="text-muted-foreground">No payments yet.</p>}
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader><CardTitle>Attendance (last 10)</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                {attendances?.map((a) => <div key={a.id} className="border-b py-1">{new Date(a.check_in_at).toLocaleString("en-GB")} {a.check_out_at ? `→ ${new Date(a.check_out_at).toLocaleString("en-GB")}` : "(checked in)"}</div>)}
                {(!attendances || attendances.length === 0) && <p className="text-muted-foreground">No check-ins yet.</p>}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2">Edit Member {!isAdmin && hasPending && <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">Editable until approval</Badge>}{!isAdmin && !hasPending && <Badge variant="outline" className="text-[10px]">Locked</Badge>}</CardTitle></CardHeader>
            <CardContent>
              {!isAdmin && !hasPending ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Editing locked after admin approval. Only admin can edit now.</div>
              ) : (
                <form key={`${member.id}-${member.updated_at}`} action={updateMember.bind(null, id)} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label>First Name</Label><Input name="first_name" defaultValue={member.first_name} required className="h-11" /></div>
                    <div><Label>Last Name</Label><Input name="last_name" defaultValue={member.last_name} required className="h-11" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label>Phone</Label><Input name="phone" defaultValue={member.phone || ""} className="h-11" /></div>
                    <div><Label>Email</Label><Input name="email" defaultValue={member.email || ""} className="h-11" /></div>
                  </div>
                  <div><Label>Address</Label><Input name="address" defaultValue={member.address || ""} className="h-11" /></div>
                  <div><Label>Medical Notes</Label><Textarea name="medical_notes" defaultValue={member.medical_notes || ""} rows={2} /></div>
                  <div><Label>Status</Label><select name="status" defaultValue={member.status} className="flex h-11 w-full rounded-md border px-3 text-sm bg-transparent"><option value="active">Active</option><option value="inactive">Inactive</option><option value="frozen">Frozen</option><option value="cancelled">Cancelled</option></select></div>
                  <input type="hidden" name="gender" value={member.gender || ""} />
                  <input type="hidden" name="date_of_birth" value={member.date_of_birth || ""} />
                  <input type="hidden" name="emergency_contact_name" value={member.emergency_contact_name || ""} />
                  <input type="hidden" name="emergency_contact_phone" value={member.emergency_contact_phone || ""} />
                  <Button type="submit">Save Changes</Button>
                  {!isAdmin && hasPending && <p className="text-xs text-muted-foreground">You can edit until admin approves. After approval, editing will be locked.</p>}
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


import { createMember } from "@/lib/actions/members";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default async function NewMemberPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).single() : { data: null } as any;
  const isStaff = profile?.role === "staff";
  const { data: plans } = await supabase.from("membership_plans").select("id,name,price,duration_days,category").eq("is_active", true).order("price");
  const membershipPlans = (plans || []).filter((p: any) => p.category === "membership");
  const ptPlans = (plans || []).filter((p: any) => p.category === "personal_training");

  async function action(formData: FormData) {
    "use server";
    await createMember(formData);
    redirect("/dashboard/members");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 px-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Add Member</h1>
        <Link href="/dashboard/members"><Button variant="outline" className="w-full sm:w-auto">Back</Button></Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{isStaff ? "New Membership Request" : "Member Details"}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{isStaff ? "Fill details and send for admin approval. Member will be active after admin approves." : "Fill details. Pick a plan — will be active immediately."}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name *</Label><Input name="first_name" required className="h-11" placeholder="Rahul" autoComplete="given-name" /></div>
              <div className="space-y-2"><Label>Last Name *</Label><Input name="last_name" required className="h-11" placeholder="Sharma" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input name="phone" placeholder="9876543210" inputMode="numeric" className="h-11" /></div>
              <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" className="h-11" placeholder="rahul@email.com" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Gender</Label><select name="gender" className="flex h-11 w-full rounded-md border bg-transparent px-3 text-sm"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              <div className="space-y-2"><Label>DOB <span className="text-xs text-muted-foreground">(DD/MM/YYYY)</span></Label><Input name="date_of_birth" type="date" lang="en-GB" className="h-11" /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input name="address" className="h-11" placeholder="Street, area" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Emergency Contact</Label><Input name="emergency_contact_name" className="h-11" placeholder="Name" /></div>
              <div className="space-y-2"><Label>Emergency Phone</Label><Input name="emergency_contact_phone" className="h-11" inputMode="tel" /></div>
            </div>
            <div className="space-y-2"><Label>Medical Notes</Label><Textarea name="medical_notes" rows={2} placeholder="Allergies, conditions..." /></div>

            <div className="rounded-lg border bg-muted/20 p-3 sm:p-4 space-y-4">
              <h3 className="font-semibold text-sm">Choose Plan *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Membership Plan *</Label>
                  <select name="plan_id" required className="flex h-11 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="">Select membership</option>
                    {membershipPlans.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} — {formatCurrency(Number(p.price))} / {p.duration_days}d</option>
                    ))}
                  </select>
                  {membershipPlans.length === 0 && <p className="text-xs text-muted-foreground">No membership plans. Create in Plans first.</p>}
                </div>
                <div className="space-y-2">
                  <Label>Personal Trainer Plan (optional)</Label>
                  <select name="pt_plan_id" className="flex h-11 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="">No PT</option>
                    {ptPlans.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} — {formatCurrency(Number(p.price))} / {p.duration_days}d</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Start Date * <span className="text-xs text-muted-foreground">(DD/MM/YYYY)</span></Label><Input name="start_date" type="date" required lang="en-GB" defaultValue={new Date().toISOString().slice(0,10)} className="h-11" /></div>
                <div className="space-y-2"><Label>Amount Paid</Label><Input name="price_paid" type="number" step="0.01" placeholder="Auto from plan" className="h-11" /></div>
                <div className="space-y-2"><Label>Payment Method</Label><select name="payment_method" className="flex h-11 w-full rounded-md border px-3 text-sm"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option><option value="other">Other</option></select></div>
              </div>
              <p className="text-xs text-muted-foreground">{isStaff ? "This will be sent to Approvals. Admin will see member + payment details there." : "Admin: auto-approved and active immediately."}</p>
            </div>

            {!isStaff && <div className="space-y-2"><Label>Status</Label><select name="status" defaultValue="active" className="flex h-11 w-full rounded-md border px-3 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option><option value="frozen">Frozen</option><option value="cancelled">Cancelled</option></select></div>}
            {isStaff && <input type="hidden" name="status" value="active" />}
            <Button type="submit" className="w-full h-11 text-base">{isStaff ? "Send Membership Approval" : "Create Member + Assign Plan"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

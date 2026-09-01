import { createMember } from "@/lib/actions/members";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewMemberPage() {
  async function action(formData: FormData) {
    "use server";
    await createMember(formData);
    redirect("/dashboard/members");
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add Member</h1>
        <Link href="/dashboard/members"><Button variant="outline">Back</Button></Link>
      </div>
      <Card>
        <CardHeader><CardTitle>Member Details</CardTitle></CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name *</Label><Input name="first_name" required /></div>
              <div className="space-y-2"><Label>Last Name *</Label><Input name="last_name" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input name="phone" placeholder="9876543210" /></div>
              <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Gender</Label><select name="gender" className="flex h-9 w-full rounded-md border px-3 text-sm"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              <div className="space-y-2"><Label>DOB</Label><Input name="date_of_birth" type="date" /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input name="address" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Emergency Contact Name</Label><Input name="emergency_contact_name" /></div>
              <div className="space-y-2"><Label>Emergency Phone</Label><Input name="emergency_contact_phone" /></div>
            </div>
            <div className="space-y-2"><Label>Medical Notes</Label><Textarea name="medical_notes" rows={2} /></div>
            <div className="space-y-2"><Label>Status</Label><select name="status" defaultValue="active" className="flex h-9 w-full rounded-md border px-3 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option><option value="frozen">Frozen</option><option value="cancelled">Cancelled</option></select></div>
            <Button type="submit" className="w-full">Create Member</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

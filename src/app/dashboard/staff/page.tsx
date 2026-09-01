import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

async function createStaff(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const display_name = String(formData.get("display_name") || "");
  if (!email || !password) throw new Error("Email and password required");
  const { createClient: createSupabase } = await import("@/lib/supabase/server");
  const supabase = await createSupabase();
  // Check admin
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "admin") throw new Error("Only admin can create staff");

  // Use service role via admin API
  const { createClient: createService } = await import("@supabase/supabase-js");
  const admin = createService(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false } });
  const { data, error } = await (admin as any).auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "staff", display_name },
  });
  if (error) throw new Error(error.message);
  // ensure profile role staff
  await admin.from("profiles").upsert({ id: data.user.id, email, role: "staff", display_name });
  revalidatePath("/dashboard/staff");
}

async function toggleStaff(id: string, is_active: boolean) {
  "use server";
  const { createClient: createSupabase } = await import("@/lib/supabase/server");
  const supabase = await createSupabase();
  await supabase.from("profiles").update({ is_active }).eq("id", id);
  revalidatePath("/dashboard/staff");
}

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const isAdmin = myProfile?.role === "admin";

  const { data: staff } = await supabase.from("profiles").select("id,email,role,display_name,is_active,created_at").order("created_at", { ascending: false });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Staff</h1>
        <Badge variant="outline">You: {myProfile?.role}</Badge>
      </div>

      {isAdmin ? (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base sm:text-lg">Add Staff</CardTitle><CardDescription className="text-xs sm:text-sm">Staff can add members & collect payments. Admin approves activations.</CardDescription></CardHeader>
          <CardContent>
            <form action={createStaff} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Email *</Label><Input name="email" type="email" required placeholder="staff@gym.com" className="h-11" /></div>
                <div className="space-y-2"><Label>Password *</Label><Input name="password" type="password" required placeholder="min 6 chars" className="h-11" /></div>
              </div>
              <div className="space-y-2"><Label>Display Name</Label><Input name="display_name" placeholder="Front desk" className="h-11" /></div>
              <Button type="submit" className="w-full sm:w-auto h-11">Create Staff Login</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">Only admin can manage staff. You are staff — use Members to add members and Payments to record collections (will go to Approvals).</CardContent></Card>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="pb-3"><CardTitle className="text-base sm:text-lg">All Users</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead className="min-w-[160px]">Email</TableHead><TableHead>Role</TableHead><TableHead className="hidden sm:table-cell">Name</TableHead><TableHead>Status</TableHead>{isAdmin && <TableHead></TableHead>}</TableRow></TableHeader>
            <TableBody>
              {staff?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm font-medium break-all">{s.email} {s.id === user?.id && <span className="text-xs text-muted-foreground">(you)</span>}</TableCell>
                  <TableCell><Badge variant={s.role === "admin" ? "default" : "secondary"} className="capitalize text-xs">{s.role}</Badge></TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{s.display_name || "-"}</TableCell>
                  <TableCell><Badge variant={s.is_active ? "outline" : "destructive"} className="text-xs">{s.is_active ? "Active" : "Disabled"}</Badge></TableCell>
                  {isAdmin && s.role === "staff" && (
                    <TableCell>
                      <form action={toggleStaff.bind(null, s.id, !s.is_active)}><Button size="sm" variant="outline" className="h-8 text-xs">{s.is_active ? "Disable" : "Enable"}</Button></form>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

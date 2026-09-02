import { createClient } from "@/lib/supabase/server";
import { createPlan, deletePlan } from "@/lib/actions/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).single() : { data: null } as any;
  const isAdmin = profile?.role === "admin";
  const { data: plans } = await supabase.from("membership_plans").select("*").order("price");

  async function create(formData: FormData) {
    "use server";
    await createPlan(formData);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Offer setup</p>
          <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
        </div>
        {!isAdmin && <span className="w-fit rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">View only</span>}
      </div>

      <div className={`grid gap-4 ${isAdmin ? "lg:grid-cols-3" : "grid-cols-1"}`}>
        {isAdmin && (
          <Card className="rounded-2xl border-0 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm lg:col-span-1">
            <CardHeader><CardTitle className="text-lg">Add Plan</CardTitle></CardHeader>
            <CardContent>
              <form action={create} className="space-y-3">
                <div className="space-y-2"><Label>Name *</Label><Input name="name" required placeholder="Monthly" className="h-11 rounded-xl" /></div>
                <div className="space-y-2"><Label>Category *</Label><select name="category" defaultValue="membership" className="flex h-11 w-full rounded-xl border border-border bg-muted px-3 text-sm text-muted-foreground"><option value="membership">Membership</option><option value="personal_training">Personal Training</option></select></div>
                <div className="space-y-2"><Label>Price (INR) *</Label><Input name="price" type="number" step="0.01" required className="h-11 rounded-xl" /></div>
                <div className="space-y-2"><Label>Duration (days) *</Label><Input name="duration_days" type="number" required placeholder="30" className="h-11 rounded-xl" /></div>
                <div className="space-y-2"><Label>Description</Label><Input name="description" className="h-11 rounded-xl" /></div>
                <div className="space-y-2"><Label>Active</Label><select name="is_active" defaultValue="true" className="flex h-11 w-full rounded-xl border border-border bg-muted px-3 text-sm text-muted-foreground"><option value="true">Yes</option><option value="false">No</option></select></div>
                <Button type="submit" className="h-11 w-full rounded-xl">Create Plan</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className={isAdmin ? "lg:col-span-2 overflow-hidden rounded-2xl border-0 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm" : "overflow-hidden rounded-2xl border-0 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm"}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Duration</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead>{isAdmin && <TableHead>Action</TableHead>}</TableRow></TableHeader>
              <TableBody>
                {plans?.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="min-w-[140px]">
                      <div className="font-semibold text-card-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.description || "—"}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{formatCurrency(Number(p.price))}</TableCell>
                    <TableCell className="whitespace-nowrap">{p.duration_days}d</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{p.category === "personal_training" ? "PT" : "Gym"}</Badge></TableCell>
                    <TableCell><Badge variant={p.is_active ? "default" : "secondary"} className="text-[10px] font-medium">{p.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    {isAdmin && (
                      <TableCell>
                        <form action={deletePlan.bind(null, p.id)}><Button size="sm" variant="destructive" type="submit" className="h-8 rounded-lg">Delete</Button></form>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {(!plans || plans.length === 0) && <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-muted-foreground">No plans yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}




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
  const { data: plans } = await supabase.from("membership_plans").select("*").order("price");

  async function create(formData: FormData) {
    "use server";
    await createPlan(formData);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Membership Plans</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Add Plan</CardTitle></CardHeader>
          <CardContent>
            <form action={create} className="space-y-3">
              <div className="space-y-2"><Label>Name *</Label><Input name="name" required placeholder="Monthly" /></div>
              <div className="space-y-2"><Label>Price (INR) *</Label><Input name="price" type="number" step="0.01" required /></div>
              <div className="space-y-2"><Label>Duration (days) *</Label><Input name="duration_days" type="number" required placeholder="30" /></div>
              <div className="space-y-2"><Label>Description</Label><Input name="description" /></div>
              <div className="space-y-2"><Label>Active</Label><select name="is_active" defaultValue="true" className="flex h-9 w-full rounded-md border px-3 text-sm"><option value="true">Yes</option><option value="false">No</option></select></div>
              <Button type="submit" className="w-full">Create Plan</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Duration</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {plans?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}<br /><span className="text-xs text-muted-foreground">{p.description || ""}</span></TableCell>
                    <TableCell>{formatCurrency(Number(p.price))}</TableCell>
                    <TableCell>{p.duration_days} days</TableCell>
                    <TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <form action={deletePlan.bind(null, p.id)}><Button size="sm" variant="destructive" type="submit">Delete</Button></form>
                    </TableCell>
                  </TableRow>
                ))}
                {(!plans || plans.length === 0) && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No plans yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

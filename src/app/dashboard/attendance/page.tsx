import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { checkIn } from "@/lib/actions/members";

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data: attendances } = await supabase
    .from("attendances")
    .select("*, members(first_name,last_name,phone)")
    .order("check_in_at", { ascending: false })
    .limit(50);

  let members: any[] = [];
  if (q) {
    const { data } = await supabase.from("members").select("id,first_name,last_name,phone").or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`).limit(5);
    members = data || [];
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Attendance</h1>

      <Card>
        <CardHeader><CardTitle>Quick Check-In</CardTitle></CardHeader>
        <CardContent>
          <form className="flex gap-2">
            <Input name="q" placeholder="Search member by name/phone" defaultValue={q || ""} />
            <Button type="submit" variant="secondary">Search</Button>
          </form>
          {members.length > 0 && (
            <div className="mt-4 space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <span>{m.first_name} {m.last_name} ({m.phone || "no phone"})</span>
                  <form action={checkIn.bind(null, m.id)}><Button size="sm" type="submit">Check In</Button></form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Check-ins</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Check In</TableHead><TableHead>Method</TableHead></TableRow></TableHeader>
            <TableBody>
              {(attendances as any[])?.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.members?.first_name} {a.members?.last_name}</TableCell>
                  <TableCell>{new Date(a.check_in_at).toLocaleString("en-IN")}</TableCell>
                  <TableCell>{a.method}</TableCell>
                </TableRow>
              ))}
              {(!attendances || attendances.length === 0) && <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No check-ins yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

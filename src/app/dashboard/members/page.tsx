import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("members").select("id,first_name,last_name,phone,email,status,joined_at").order("created_at", { ascending: false }).limit(100);
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  if (status && status !== "all") query = query.eq("status", status);
  const { data: members } = await query;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Members</h1>
        <Link href="/dashboard/members/new"><Button>Add Member</Button></Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Search & Filter</CardTitle></CardHeader>
        <CardContent>
          <form className="flex gap-2">
            <Input name="q" placeholder="Search name, phone, email" defaultValue={q || ""} />
            <select name="status" defaultValue={status || "all"} className="border rounded-md px-3 text-sm">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="frozen">Frozen</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button type="submit" variant="secondary">Search</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.first_name} {m.last_name}<br /><span className="text-xs text-muted-foreground">{m.email || ""}</span></TableCell>
                  <TableCell>{m.phone || "-"}</TableCell>
                  <TableCell><Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge></TableCell>
                  <TableCell className="text-sm">{new Date(m.joined_at).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell><Link href={`/dashboard/members/${m.id}`}><Button size="sm" variant="outline">View</Button></Link></TableCell>
                </TableRow>
              ))}
              {(!members || members.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No members found. Add your first member.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

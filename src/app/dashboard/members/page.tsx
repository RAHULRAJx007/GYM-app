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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Members</h1>
        <Link href="/dashboard/members/new" className="w-full sm:w-auto"><Button className="w-full sm:w-auto h-11">Add Member</Button></Link>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Search & Filter</CardTitle></CardHeader>
        <CardContent>
          <form className="flex flex-col sm:flex-row gap-2">
            <Input name="q" placeholder="Search name, phone, email" defaultValue={q || ""} className="h-11 flex-1" />
            <select name="status" defaultValue={status || "all"} className="border rounded-md px-3 text-sm h-11 bg-transparent">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="frozen">Frozen</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button type="submit" variant="secondary" className="h-11 w-full sm:w-auto">Search</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Name</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium"><div className="font-medium">{m.first_name} {m.last_name}</div><div className="text-xs text-muted-foreground sm:hidden">{m.phone || ""}</div><div className="text-xs text-muted-foreground hidden sm:block">{m.email || ""}</div></TableCell>
                  <TableCell className="hidden sm:table-cell whitespace-nowrap">{m.phone || "-"}</TableCell>
                  <TableCell><Badge variant={m.status === "active" ? "default" : "secondary"} className="text-xs">{m.status}</Badge></TableCell>
                  <TableCell className="text-sm hidden md:table-cell whitespace-nowrap">{new Date(m.joined_at).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell><Link href={`/dashboard/members/${m.id}`}><Button size="sm" variant="outline" className="h-8">View</Button></Link></TableCell>
                </TableRow>
              ))}
              {(!members || members.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No members found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { dueMessage } from "@/lib/whatsapp-link";

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).single() : { data: null } as any;
  const isAdmin = profile?.role === "admin";
  let query = supabase.from("members").select("id,first_name,last_name,phone,email,status,joined_at").order("created_at", { ascending: false }).limit(100);
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  if (status && status !== "all") query = query.eq("status", status);
  const { data: members } = await query;
  const memberIds = (members || []).map((m) => m.id);
  const [{ data: pendingMships }, { data: activeMships }] = memberIds.length
    ? await Promise.all([
        supabase.from("member_memberships").select("member_id,status").in("member_id", memberIds).eq("status", "pending"),
        supabase.from("member_memberships").select("member_id,end_date,membership_plans(name)").in("member_id", memberIds).eq("status", "active"),
      ])
    : [{ data: [] } as any, { data: [] } as any];
  const pendingSet = new Set((pendingMships as any[] | null)?.map((p) => p.member_id) || []);
  const activeMap = new Map((activeMships as any[] | null)?.map((m: any) => [m.member_id, m]) || []);

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
              {members?.map((m) => {
                const isPending = pendingSet.has(m.id);
                const active = activeMap.get(m.id) as any;
                const today = new Date().setHours(0,0,0,0);
                const end = active ? new Date(active.end_date).setHours(0,0,0,0) : null;
                const daysLeft = end ? Math.ceil((end - today) / 86400000) : null;
                const isDue = active && daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
                const isEnded = active && daysLeft !== null && daysLeft < 0;
                const showWhatsApp = isAdmin && (isDue || isEnded) && m.phone;
                return (
                  <TableRow key={m.id} className={isPending ? "bg-amber-50/50" : isEnded ? "bg-red-50/30" : isDue ? "bg-amber-50/30" : ""}>
                    <TableCell className="font-medium">
                      <div className="font-medium flex items-center gap-1.5">{m.first_name} {m.last_name}{isPending && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{m.phone || ""}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">{m.email || ""}</div>
                      {showWhatsApp && (
                        <div className="mt-1.5">
                          <WhatsAppButton
                            phone={m.phone!}
                            message={dueMessage(`${m.first_name} ${m.last_name}`, active.membership_plans?.name || "Membership", active.end_date, daysLeft!)}
                            label={isEnded ? "WhatsApp – ended" : `WhatsApp – due in ${daysLeft}d`}
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell whitespace-nowrap">{m.phone || "-"}</TableCell>
                    <TableCell>
                      {isPending ? <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-200">Waiting for approval</Badge> : isEnded ? <Badge variant="destructive" className="text-xs">Ended</Badge> : isDue ? <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-200">Due in {daysLeft}d</Badge> : <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-xs">{m.status}</Badge>}
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell whitespace-nowrap">{new Date(m.joined_at).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell><Link href={`/dashboard/members/${m.id}`}><Button size="sm" variant="outline" className="h-8">View</Button></Link></TableCell>
                  </TableRow>
                );
              })}
              {(!members || members.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No members found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

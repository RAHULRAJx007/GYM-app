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
  const { data: gym } = await supabase.from("gym_settings").select("name, phone, address, email").order("created_at", { ascending: false }).limit(1).maybeSingle();
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Directory</p>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
        </div>
        <Link href="/dashboard/members/new" className="w-full sm:w-auto">
          <Button className="h-11 w-full rounded-xl sm:w-auto">Add Member</Button>
        </Link>
      </div>

      <Card className="rounded-2xl border-0 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search & filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-2 md:flex-row">
            <Input name="q" placeholder="Search name, phone, email" defaultValue={q || ""} className="h-11 flex-1 rounded-xl border-border bg-muted" />
            <select name="status" defaultValue={status || "all"} className="h-11 rounded-xl border border-border bg-muted px-3 text-sm text-muted-foreground md:w-44">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="frozen">Frozen</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button type="submit" variant="secondary" className="h-11 rounded-xl md:w-auto">Search</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-0 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Member</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Membership</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="w-[72px]" />
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
                const endStr = active ? new Date(active.end_date).toLocaleDateString("en-GB") : "-";
                const remaining = isPending ? "Pending approval" : active ? (isEnded ? `${Math.abs(daysLeft!)}d ago` : `${daysLeft}d left`) : "No plan";

                return (
                  <TableRow key={m.id} className={isPending ? "bg-amber-50/50" : isEnded ? "bg-red-50/20" : isDue ? "bg-amber-50/25" : ""}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-600 text-sm font-semibold text-white">
                          {m.first_name?.charAt(0)?.toUpperCase() || "M"}{m.last_name?.charAt(0)?.toUpperCase() || "M"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-semibold text-card-foreground">
                            {m.first_name} {m.last_name}
                            {isPending && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
                          </div>
                          <div className="text-xs text-muted-foreground sm:hidden">{m.phone || "No phone"}</div>
                          <div className="hidden text-xs text-muted-foreground sm:block">{m.email || "No email"}</div>
                          {active && <div className="mt-1 text-[11px] text-muted-foreground sm:hidden">Ends {endStr} • {remaining}</div>}
                          {showWhatsApp && (
                            <div className="mt-2">
                              <WhatsAppButton
                                phone={m.phone!}
                                message={dueMessage(`${m.first_name} ${m.last_name}`, active.membership_plans?.name || "Membership", active.end_date, daysLeft!, gym)}
                                label={isEnded ? "WhatsApp – ended" : `WhatsApp – due in ${daysLeft}d`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">{m.phone || "-"}</TableCell>
                    <TableCell>
                      {isPending ? <Badge variant="outline" className="border-amber-200 bg-amber-100 text-[10px] font-medium text-amber-800">Waiting</Badge> : isEnded ? <Badge variant="destructive" className="text-[10px] font-medium">Ended</Badge> : isDue ? <Badge variant="outline" className="border-amber-200 bg-amber-100 text-[10px] font-medium text-amber-800">Due {daysLeft}d</Badge> : <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-[10px] font-medium">{m.status}</Badge>}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-xs lg:table-cell">
                      {active ? (
                        <div>
                          <div className="font-medium text-card-foreground">{endStr}</div>
                          <div className={isEnded ? "text-destructive" : isDue ? "text-amber-600" : "text-muted-foreground"}>{remaining}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm md:table-cell">{new Date(m.joined_at).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/members/${m.id}`}>
                        <Button size="sm" variant="outline" className="h-8 rounded-lg">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}

              {(!members || members.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No members found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}




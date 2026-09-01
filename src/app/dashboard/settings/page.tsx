import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).single() : { data: null } as any;
  const isAdmin = profile?.role === "admin";
  // Use limit 1 to avoid PGRST116 when duplicates exist, ordered by most recent
  const { data: settings } = await supabase.from("gym_settings").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();

  async function update(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    const { data: prof } = u ? await supabase.from("profiles").select("role").eq("id", u.id).single() : { data: null } as any;
    if (prof?.role !== "admin") throw new Error("Only admin can update gym settings");
    const payload = {
      name: String(formData.get("name") || ""),
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
      address: String(formData.get("address") || "") || null,
      currency: String(formData.get("currency") || "INR"),
    };
    if (!payload.name) throw new Error("Gym name required");
    const { data: existing } = await supabase.from("gym_settings").select("id").order("created_at", { ascending: false }).limit(1).maybeSingle();
    let error: any = null;
    if (existing) {
      const res = await supabase.from("gym_settings").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", existing.id);
      error = res.error;
    } else {
      const res = await supabase.from("gym_settings").insert(payload);
      error = res.error;
    }
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/settings");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Brand</p>
          <h1 className="text-2xl font-bold tracking-tight">Gym Settings</h1>
        </div>
        {!isAdmin && <span className="w-fit rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">View only</span>}
      </div>

      <Card className="rounded-2xl border-0 bg-white/80 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Gym Info {settings?.updated_at && <span className="text-xs font-normal text-muted-foreground">• Updated {new Date(settings.updated_at).toLocaleDateString("en-GB")}</span>}</CardTitle>
        </CardHeader>
        <CardContent>
          <form key={`${settings?.id}-${settings?.updated_at}`} action={update} className="space-y-4">
            <div className="space-y-2"><Label>Gym Name *</Label><Input name="name" defaultValue={settings?.name || ""} required className="h-11 rounded-xl" disabled={!isAdmin} /></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Phone</Label><Input name="phone" defaultValue={settings?.phone || ""} className="h-11 rounded-xl" inputMode="tel" disabled={!isAdmin} /></div>
              <div className="space-y-2"><Label>Email</Label><Input name="email" defaultValue={settings?.email || ""} className="h-11 rounded-xl" type="email" disabled={!isAdmin} /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input name="address" defaultValue={settings?.address || ""} className="h-11 rounded-xl" disabled={!isAdmin} /></div>
            <div className="space-y-2"><Label>Currency</Label><select name="currency" defaultValue={settings?.currency || "INR"} disabled={!isAdmin} className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 disabled:opacity-50"><option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div>
            {isAdmin ? <Button type="submit" className="h-11 w-full rounded-xl sm:w-auto">Save</Button> : <p className="text-xs text-muted-foreground">Only admin can save. Staff view only.</p>}
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 bg-white/80 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          <p className="font-semibold text-slate-900">Connected to Supabase</p>
          <p className="mt-1 break-all">Project: https://csqkkfpaqxgnffxywmvi.supabase.co</p>
        </CardContent>
      </Card>
    </div>
  );
}

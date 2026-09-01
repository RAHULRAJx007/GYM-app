import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("gym_settings").select("*").single();

  async function update(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const payload = {
      name: String(formData.get("name") || ""),
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
      address: String(formData.get("address") || "") || null,
      currency: String(formData.get("currency") || "INR"),
    };
    const { data: existing } = await supabase.from("gym_settings").select("id").single();
    if (existing) {
      await supabase.from("gym_settings").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("gym_settings").insert(payload);
    }
    revalidatePath("/dashboard/settings");
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto px-1">
      <h1 className="text-xl sm:text-2xl font-bold">Gym Settings</h1>
      <Card>
        <CardHeader><CardTitle className="text-base sm:text-lg">Gym Info</CardTitle></CardHeader>
        <CardContent>
          <form action={update} className="space-y-4">
            <div className="space-y-2"><Label>Gym Name *</Label><Input name="name" defaultValue={settings?.name || ""} required className="h-11" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input name="phone" defaultValue={settings?.phone || ""} className="h-11" inputMode="tel" /></div>
              <div className="space-y-2"><Label>Email</Label><Input name="email" defaultValue={settings?.email || ""} className="h-11" type="email" /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input name="address" defaultValue={settings?.address || ""} className="h-11" /></div>
            <div className="space-y-2"><Label>Currency</Label><select name="currency" defaultValue={settings?.currency || "INR"} className="flex h-11 w-full rounded-md border px-3 text-sm bg-transparent"><option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div>
            <Button type="submit" className="w-full sm:w-auto h-11">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Connected to Supabase</p>
          <p className="mt-1">Project: https://csqkkfpaqxgnffxywmvi.supabase.co</p>
        </CardContent>
      </Card>
    </div>
  );
}

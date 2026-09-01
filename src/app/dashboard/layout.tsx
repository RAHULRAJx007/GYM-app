import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, MobileBottomNav } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 bg-muted/20 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
        <MobileBottomNav />
      </div>
    </div>
  );
}

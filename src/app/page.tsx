import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Users, CreditCard, BarChart3, Bell, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg sm:text-xl">
            <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6" /> GymCore
          </div>
          <Link href="/login">
            <Button size="sm" className="sm:size-default h-9">Owner Login</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Gym management, <span className="text-muted-foreground">simplified</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Track members, memberships, payments & analytics. One app per gym — runs on your own free Supabase + Vercel.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-11">Go to Dashboard</Button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-11">See Features</Button>
            </Link>
          </div>
        </section>

        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: Users, title: "Member Management", desc: "Add, search, edit members. Photos, medical notes, status tracking." },
            { icon: CreditCard, title: "Plans & Payments", desc: "Monthly/quarterly/yearly plans. Manual cash/card/UPI tracking with receipts." },
            { icon: BarChart3, title: "Dashboard & Reports", desc: "Active members, revenue, expiring soon, overdue — at a glance." },
            { icon: Bell, title: "Expiry Alerts", desc: "Know who expires in 7 days. Email reminders ready." },
            { icon: Shield, title: "Per-Gym Isolation", desc: "Each gym gets its own Supabase project. Data never mixes." },
            { icon: Dumbbell, title: "Attendance", desc: "Quick check-in, history per member." },
          ].map((f) => (
            <Card key={f.title}>
              <CardContent className="pt-6">
                <f.icon className="h-8 w-8 mb-3" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Card className="bg-muted/50">
            <CardContent className="pt-6 text-sm">
              <p className="font-semibold">How it works for you as seller:</p>
              <ol className="list-decimal ml-6 mt-2 space-y-1 text-muted-foreground text-xs sm:text-sm">
                <li>Create a Supabase free project on the client&apos;s account (500MB, ~25k members capacity)</li>
                <li>Run <code className="bg-background px-1 rounded">supabase/schema.sql</code> in SQL Editor</li>
                <li>Create owner user in Supabase Auth</li>
                <li>Deploy this app to Vercel with client&apos;s Supabase URL/keys</li>
                <li>Hand over Vercel + Supabase access to gym owner</li>
              </ol>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Built for gym owners • Vercel + Supabase free tier
      </footer>
    </div>
  );
}

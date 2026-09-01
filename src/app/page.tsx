"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dumbbell, Eye, EyeOff } from "lucide-react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="theme-login min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.22),_transparent_25%),linear-gradient(135deg,_#fff7ed_0%,_#fff_45%,_#fffaf3_100%)] text-slate-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-5 sm:justify-start">
        <div className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-orange-500/25">
            <Dumbbell className="h-4 w-4 text-primary-foreground" />
          </div>
          GymCore<span className="text-primary">.</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 pb-8 pt-2 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-orange-100 bg-white/85 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden bg-[linear-gradient(135deg,_#111827_0%,_#1f2937_35%,_#172554_100%)] p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-orange-200">
                Fitness operations
              </div>
              <h1 className="max-w-sm text-4xl font-bold leading-tight">Run your gym from a single place.</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                Track members, renew plans, review payments, and keep daily operations moving from your phone or tablet.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-2xl font-bold text-orange-300">120+</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.15em] text-slate-300">Members</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-2xl font-bold text-emerald-300">98%</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.15em] text-slate-300">Retention</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-2xl font-bold text-sky-300">24/7</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.15em] text-slate-300">Access</div>
              </div>
            </div>
          </section>

          <section className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-md">
              <div className="mb-6 flex items-center justify-center lg:hidden">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="mb-6 text-center lg:text-left">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-orange-600">Welcome back</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Sign in</h2>
              </div>

              <Card className="border-0 bg-transparent shadow-none">
                <CardHeader className="px-0 pb-4 text-center lg:text-left">
                  <CardTitle className="text-lg font-semibold">Gym dashboard</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">Manage memberships and daily operations</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="admin@gym.local"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 text-base shadow-inner focus-visible:ring-orange-300"
                        autoComplete="email"
                        inputMode="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={show ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 rounded-xl border-slate-200 bg-slate-50 pr-11 text-base shadow-inner focus-visible:ring-orange-300"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShow(!show)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                          aria-label={show ? "Hide password" : "Show password"}
                        >
                          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                      </p>
                    )}

                    <Button type="submit" className="h-12 w-full rounded-xl text-base font-semibold shadow-md shadow-orange-500/20" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>

      <footer className="px-4 pb-5 text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">
        GymCore • Mobile ready
      </footer>
    </div>
  );
}

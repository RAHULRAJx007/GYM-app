"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, Eye, EyeOff, ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";

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
    <div className="theme-login min-h-screen bg-[#F9F8F4] text-foreground selection:bg-accent">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-[#F9F8F4]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-accent">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="text-[18px] font-black tracking-tighter">FORGE<span className="font-light text-muted-foreground">.GYM</span></span>
            <span className="hidden sm:inline-flex ml-2 rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">Operations OS</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[12px] font-medium">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" /> System operational
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:py-10">
        {/* Left - editorial hero */}
        <div className="order-2 flex flex-col justify-between gap-8 rounded-[28px] border border-border bg-card p-6 sm:p-8 lg:order-1 lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
              <Zap className="h-3 w-3" /> Built for front-desk speed
            </div>
            <h1 className="mt-6 text-[34px] font-black leading-[0.95] tracking-[-0.04em] sm:text-[48px] lg:text-[56px]">
              RUN YOUR
              <span className="block font-light italic tracking-tight">GYM LIKE A</span>
              <span className="relative inline-block">
                MACHINE
                <span className="absolute -bottom-1 left-0 h-[10px] w-full bg-accent -z-10 sm:h-4" />
              </span>
            </h1>
            <p className="mt-5 max-w-[520px] text-[15px] leading-6 text-muted-foreground sm:text-[16px]">
              Members, renewals, payments and daily ops — one fast, phone-ready workspace. No clutter, no training needed.
            </p>

            <div className="mt-8 grid grid-cols-1 min-[420px]:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border bg-[#F9F8F4] p-4">
                <Users className="h-4 w-4 text-foreground" />
                <div className="mt-3 text-[22px] font-black tracking-tighter">2.4x</div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Faster check-ins</div>
              </div>
              <div className="rounded-2xl bg-foreground p-4 text-white">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <div className="mt-3 text-[22px] font-black tracking-tighter text-accent">100%</div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">Audit ready</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <Zap className="h-4 w-4" />
                <div className="mt-3 text-[22px] font-black tracking-tighter">0.8s</div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Avg action</div>
              </div>
            </div>
          </div>

          <div className="forge-grid rounded-2xl border border-border bg-[#F9F8F4] p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Live preview</span>
              <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-bold">PHONE READY</span>
            </div>
            <div className="grid grid-cols-[1fr_1fr] gap-3 p-4 text-xs">
              <div className="rounded-xl bg-card border border-border p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Members today</div>
                <div className="text-lg font-black">847</div>
                <div className="text-[11px] text-emerald-600 font-medium">↑ 12 new</div>
              </div>
              <div className="rounded-xl bg-foreground text-white p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-white/60">Revenue MTD</div>
                <div className="text-lg font-black text-accent">₹ 1.2L</div>
                <div className="text-[11px] text-white/60">42 payments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right - login card */}
        <div className="order-1 lg:order-2">
          <div className="sticky top-[88px] rounded-[28px] border border-foreground bg-card p-6 shadow-[8px_8px_0_#0B0E0D] sm:p-8">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Sign in</p>
              <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold">SECURE</span>
            </div>
            <h2 className="mt-3 text-[28px] font-black tracking-[-0.03em] leading-none">Welcome back</h2>
            <p className="mt-2 text-[14px] leading-5 text-muted-foreground">Use your admin or staff credentials. Works perfectly on phone.</p>

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-semibold">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@gymforge.in"
                  className="h-[52px] rounded-full bg-[#F9F8F4] px-5 text-[15px]"
                  autoComplete="email"
                  inputMode="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[13px] font-semibold">Password</Label>
                  <span className="text-[11px] text-muted-foreground">Min 6 chars</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="h-[52px] rounded-full bg-[#F9F8F4] px-5 pr-12 text-[15px]"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13px] font-medium text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" variant="default" size="lg" className="w-full rounded-full text-[15px]" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"} {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Trusted by gyms</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl border border-border bg-[#F9F8F4] px-2 py-3">
                  <div className="text-[12px] font-black">Offline-ready</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Phone</div>
                </div>
                <div className="rounded-2xl border border-border bg-[#F9F8F4] px-2 py-3">
                  <div className="text-[12px] font-black">Role-based</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Admin / Staff</div>
                </div>
                <div className="rounded-2xl border border-border bg-[#F9F8F4] px-2 py-3">
                  <div className="text-[12px] font-black">Fast</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">&lt; 1 sec</div>
                </div>
              </div>
            </form>

            <p className="mt-6 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              FORGE — built for the floor, not the office
            </p>
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-[1280px] px-4 pb-6 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-full border border-border bg-card px-4 py-3 text-[11px]">
          <span className="font-semibold uppercase tracking-[0.12em]">© {new Date().getFullYear()} Forge Gym OS</span>
          <span className="text-muted-foreground">Phone-first • Thumb-friendly • No refresh needed</span>
        </div>
      </footer>
    </div>
  );
}


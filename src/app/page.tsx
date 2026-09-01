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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/40 to-background">
      {/* Header - minimal, responsive */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-center sm:justify-start max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2 font-bold text-lg sm:text-xl">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="h-4 w-4 text-primary-foreground" />
          </div>
          GymCore
        </div>
      </header>

      {/* Centered login - fully responsive for phone/tablet */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <Card className="w-full max-w-[420px] shadow-lg border-muted">
          <CardHeader className="text-center space-y-1 pb-4">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mb-2">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Welcome back</CardTitle>
            <CardDescription className="text-sm">Sign in to manage your gym</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@gym.local"
                  className="h-11 text-base"
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 text-base pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-xs text-center text-muted-foreground pt-2">
                Admin: admin@gym.local • Staff: staff@gym.local
              </p>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground px-4">
        GymCore • Works on phone & tablet • Vercel + Supabase
      </footer>
    </div>
  );
}

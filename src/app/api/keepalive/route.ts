import { NextResponse } from "next/server";

// Vercel Cron will hit this every 5 days to prevent Supabase free-tier pause (7 days inactivity)
// Also keeps Vercel from sleeping. Works with 1 gym per Supabase+Vercel account model.
// See: README.md per-client setup, vercel.json crons

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Optional security: if CRON_SECRET is set, require Authorization: Bearer <secret>
  // Vercel sends it automatically if you set it in vercel.json or via header
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "Missing Supabase env" }, { status: 500 });
  }

  try {
    // Prefer service_role to bypass RLS, fallback to anon
    const key = serviceKey || anonKey;
    // Minimal lightweight query - counts as DB activity to reset 7-day timer
    // Using gym_settings (single row) is cheapest
    const res = await fetch(`${url}/rest/v1/gym_settings?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, status: res.status, error: text.slice(0, 500) }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      ping: "supabase",
      rows: Array.isArray(data) ? data.length : 0,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

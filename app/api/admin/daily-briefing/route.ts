import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const MODEL = process.env.GEMINI_BRIEFING_MODEL || process.env.GEMINI_MODEL || "gemini-3.5-flash";
const allowedHrefs = ["/admin/orders", "/admin/reservations", "/admin/messages", "/admin/menu"];

const briefingSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
    priorities: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          detail: { type: "string" },
          severity: { type: "string", enum: ["info", "attention", "urgent"] },
          href: { type: "string", enum: allowedHrefs },
        },
        required: ["label", "detail", "severity", "href"],
      },
    },
    outlook: { type: "string" },
  },
  required: ["headline", "summary", "priorities", "outlook"],
} as const;

type BriefingContent = {
  headline: string;
  summary: string;
  priorities: Array<{ label: string; detail: string; severity: "info" | "attention" | "urgent"; href: string }>;
  outlook: string;
};

type DailyStats = {
  date: string;
  active_orders: number;
  pending_orders: number;
  delivery_orders_in_progress: number;
  reservations_today: number;
  guests_today: number;
  reservations_tomorrow: number;
  pending_reservations: number;
  high_priority_reservation_requests: number;
  unread_messages: number;
  urgent_or_high_messages: number;
  unavailable_menu_items: number;
};

function manilaDate(offsetDays = 0) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(Date.now() + offsetDays * 86_400_000));
}

function extractOutputText(response: unknown) {
  if (!response || typeof response !== "object") return null;
  const result = response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  for (const candidate of result.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (typeof part.text === "string") return part.text;
    }
  }
  return null;
}

function normalizeBriefing(value: unknown, stats: DailyStats): BriefingContent {
  const item = value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
  const rawPriorities = Array.isArray(item.priorities) ? item.priorities : [];
  const priorities = rawPriorities.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const priority = raw as Record<string, unknown>;
    if (typeof priority.label !== "string" || typeof priority.detail !== "string") return [];
    const severity = ["info", "attention", "urgent"].includes(String(priority.severity))
      ? priority.severity as "info" | "attention" | "urgent"
      : "attention";
    const href = allowedHrefs.includes(String(priority.href))
      ? String(priority.href)
      : "/admin/reservations";
    return [{ label: priority.label, detail: priority.detail, severity, href }];
  }).slice(0, 4);

  return {
    headline: typeof item.headline === "string" && item.headline.trim()
      ? item.headline.trim()
      : "Today's restaurant operations",
    summary: typeof item.summary === "string" && item.summary.trim()
      ? item.summary.trim()
      : `${stats.active_orders} active orders, ${stats.reservations_today} reservations today, and ${stats.unread_messages} unread messages need review.`,
    priorities,
    outlook: typeof item.outlook === "string" && item.outlook.trim()
      ? item.outlook.trim()
      : `${stats.reservations_tomorrow} reservations are currently scheduled for tomorrow.`,
  };
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", authData.user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json(
    { error: "AI briefing is not configured. Add GEMINI_API_KEY to the server environment." },
    { status: 503 }
  );

  const body = (await request.json().catch(() => ({}))) as { force?: boolean };
  const today = manilaDate();
  if (!body.force) {
    const { data: cached } = await supabase.from("admin_daily_briefings").select("*")
      .eq("briefing_date", today).maybeSingle();
    if (cached) return NextResponse.json({ briefing: cached, cached: true });
  }

  const tomorrow = manilaDate(1);
  const inSevenDays = manilaDate(7);
  const [ordersResult, reservationsResult, messagesResult, unavailableMenuResult] = await Promise.all([
    supabase.from("orders").select("id, status, order_type, created_at")
      .in("status", ["pending", "confirmed", "preparing", "ready", "out_for_delivery"]),
    supabase.from("reservations")
      .select("id, reservation_date, reservation_time, guests, status, ai_request_analysis")
      .gte("reservation_date", today).lte("reservation_date", inSevenDays).neq("status", "cancelled"),
    supabase.from("contact_messages").select("id, status, ai_category, ai_priority, created_at").neq("status", "archived"),
    supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("is_available", false),
  ]);

  const queryError = ordersResult.error || reservationsResult.error || messagesResult.error || unavailableMenuResult.error;
  if (queryError) return NextResponse.json({ error: queryError.message }, { status: 400 });

  const orders = ordersResult.data ?? [];
  const reservations = reservationsResult.data ?? [];
  const messages = messagesResult.data ?? [];
  const stats: DailyStats = {
    date: today,
    active_orders: orders.length,
    pending_orders: orders.filter((item) => item.status === "pending").length,
    delivery_orders_in_progress: orders.filter((item) => item.order_type === "delivery" && item.status !== "ready").length,
    reservations_today: reservations.filter((item) => item.reservation_date === today).length,
    guests_today: reservations.filter((item) => item.reservation_date === today)
      .reduce((sum, item) => sum + Number(item.guests), 0),
    reservations_tomorrow: reservations.filter((item) => item.reservation_date === tomorrow).length,
    pending_reservations: reservations.filter((item) => item.status === "pending").length,
    high_priority_reservation_requests: reservations.filter((item) => {
      const analysis = item.ai_request_analysis as { priority?: string } | null;
      return analysis?.priority === "high";
    }).length,
    unread_messages: messages.filter((item) => item.status === "unread").length,
    urgent_or_high_messages: messages.filter((item) => item.status === "unread" &&
      ["urgent", "high"].includes(item.ai_priority ?? "")).length,
    unavailable_menu_items: unavailableMenuResult.count ?? 0,
  };

  const aiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "Create a concise morning operations briefing for Kainan sa Tabing Lawa, a family restaurant in Rizal, Philippines. Use only the supplied statistics and highlight actions staff can take today. Do not invent trends, capacity, availability, customer details, revenue, or problems. A zero count is not a problem. Keep the summary to 2 sentences, each priority detail to 1 sentence, and the outlook to 1 sentence. If operations are quiet, say so plainly. This is advisory only." }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(stats) }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: briefingSchema, maxOutputTokens: 700, temperature: 0.2 },
      }),
    }
  );

  const aiResult = (await aiResponse.json().catch(() => null)) as { error?: { message?: string } } | null;
  if (!aiResponse.ok) return NextResponse.json(
    { error: aiResult?.error?.message || "The AI service could not create today's briefing." },
    { status: 502 }
  );

  const outputText = extractOutputText(aiResult);
  let parsed: unknown = null;
  try {
    const cleanedOutput = outputText?.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    parsed = cleanedOutput ? JSON.parse(cleanedOutput) : null;
  } catch {
    parsed = null;
  }
  const content = normalizeBriefing(parsed, stats);

  const { data: saved, error: saveError } = await supabase.from("admin_daily_briefings").upsert({
    briefing_date: today, content, stats_snapshot: stats, model: MODEL,
    generated_at: new Date().toISOString(), generated_by: authData.user.id,
  }, { onConflict: "briefing_date" }).select().single();
  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 400 });

  return NextResponse.json({ briefing: saved, cached: false });
}

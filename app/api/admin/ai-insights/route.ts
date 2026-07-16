import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.GEMINI_INSIGHTS_MODEL || process.env.GEMINI_MODEL || "gemini-3.5-flash";
const FALLBACK_MODEL = process.env.GEMINI_INSIGHTS_FALLBACK_MODEL || "gemini-3.1-flash-lite";
const DAY_MS = 86_400_000;
const allowedHrefs = ["/admin/testimonials", "/admin/menu", "/admin/orders", "/pos/inventory", "/admin/reservations"];

type Review = { review: string; rating: number; created_at: string };
type Order = { id: number; created_at: string; status: string; order_type: string | null };
type OrderItem = { order_id: number; name: string; quantity: number };
type Reservation = { reservation_date: string; guests: number; status: string };
type GeminiResponse = { error?: { message?: string; status?: string }; candidates?: unknown[] };
type AiNarrative = {
  headline: string;
  executive_summary: string;
  review_overview: string;
  strengths: string[];
  opportunities: string[];
  themes: Array<{ label: string; sentiment: "positive" | "mixed" | "negative"; mentions: number }>;
  actions: Array<{ title: string; detail: string; priority: "high" | "medium" | "low"; href: string }>;
};

const aiSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    executive_summary: { type: "string" },
    review_overview: { type: "string" },
    strengths: { type: "array", maxItems: 3, items: { type: "string" } },
    opportunities: { type: "array", maxItems: 3, items: { type: "string" } },
    themes: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          sentiment: { type: "string", enum: ["positive", "mixed", "negative"] },
          mentions: { type: "integer" },
        },
        required: ["label", "sentiment", "mentions"],
      },
    },
    actions: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          href: { type: "string", enum: allowedHrefs },
        },
        required: ["title", "detail", "priority", "href"],
      },
    },
  },
  required: ["headline", "executive_summary", "review_overview", "strengths", "opportunities", "themes", "actions"],
} as const;

function manilaDate(date: Date | number = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(date: string, days: number) {
  return manilaDate(new Date(`${date}T04:00:00+08:00`).getTime() + days * DAY_MS);
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", weekday: "short" })
    .format(new Date(`${date}T12:00:00+08:00`));
}

function weekday(date: string) {
  return new Date(`${date}T12:00:00+08:00`).getUTCDay();
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

function cleanStrings(value: unknown, max: number) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    .map((item) => item.trim()).slice(0, max);
}

function normalizeNarrative(value: unknown, reviewCount: number): AiNarrative {
  const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rawThemes = Array.isArray(item.themes) ? item.themes : [];
  const themes = rawThemes.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const theme = raw as Record<string, unknown>;
    if (typeof theme.label !== "string") return [];
    const sentiment = ["positive", "mixed", "negative"].includes(String(theme.sentiment))
      ? theme.sentiment as "positive" | "mixed" | "negative" : "mixed";
    return [{ label: theme.label.trim(), sentiment, mentions: Math.max(1, Math.min(reviewCount, Number(theme.mentions) || 1)) }];
  }).filter((theme) => theme.label).slice(0, 6);

  const rawActions = Array.isArray(item.actions) ? item.actions : [];
  const actions = rawActions.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const action = raw as Record<string, unknown>;
    if (typeof action.title !== "string" || typeof action.detail !== "string") return [];
    const priority = ["high", "medium", "low"].includes(String(action.priority))
      ? action.priority as "high" | "medium" | "low" : "medium";
    const href = allowedHrefs.includes(String(action.href)) ? String(action.href) : "/admin/testimonials";
    return [{ title: action.title.trim(), detail: action.detail.trim(), priority, href }];
  }).filter((action) => action.title && action.detail).slice(0, 4);

  return {
    headline: typeof item.headline === "string" && item.headline.trim() ? item.headline.trim() : "Steady signals for the week ahead",
    executive_summary: typeof item.executive_summary === "string" && item.executive_summary.trim()
      ? item.executive_summary.trim() : "Recent sales and guest feedback have been summarized into a practical seven-day planning view.",
    review_overview: typeof item.review_overview === "string" && item.review_overview.trim()
      ? item.review_overview.trim() : reviewCount ? "Guest ratings provide a useful baseline, but there is not enough consistent text feedback to identify reliable themes." : "No approved review text is available yet, so review themes will appear after guests submit feedback.",
    strengths: cleanStrings(item.strengths, 3),
    opportunities: cleanStrings(item.opportunities, 3),
    themes,
    actions,
  };
}

function buildForecast(orders: Order[], items: OrderItem[], reservations: Reservation[], today: string) {
  const dayCounts = new Map<string, number>();
  for (const order of orders) {
    const date = manilaDate(new Date(order.created_at));
    dayCounts.set(date, (dayCounts.get(date) ?? 0) + 1);
  }

  const historicalDates = Array.from({ length: 56 }, (_, index) => addDays(today, index - 56));
  const weekdayAverages = Array.from({ length: 7 }, (_, day) => {
    const matching = historicalDates.filter((date) => weekday(date) === day);
    return matching.reduce((sum, date) => sum + (dayCounts.get(date) ?? 0), 0) / Math.max(1, matching.length);
  });
  const recentDates = Array.from({ length: 14 }, (_, index) => addDays(today, index - 14));
  const priorDates = Array.from({ length: 14 }, (_, index) => addDays(today, index - 28));
  const recentTotal = recentDates.reduce((sum, date) => sum + (dayCounts.get(date) ?? 0), 0);
  const priorTotal = priorDates.reduce((sum, date) => sum + (dayCounts.get(date) ?? 0), 0);
  const recentDaily = recentTotal / 14;
  const trendRatio = priorTotal > 0 ? Math.max(0.65, Math.min(1.5, recentTotal / priorTotal)) : 1;
  const historyCount = historicalDates.reduce((sum, date) => sum + (dayCounts.get(date) ?? 0), 0);
  const confidence: "low" | "medium" | "high" = historyCount >= 100 ? "high" : historyCount >= 30 ? "medium" : "low";

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index + 1);
    const reservedGuests = reservations.filter((item) => item.reservation_date === date)
      .reduce((sum, item) => sum + Number(item.guests || 0), 0);
    const baseline = weekdayAverages[weekday(date)] * 0.7 + recentDaily * 0.3;
    const reservationLift = reservedGuests * 0.08;
    return {
      date,
      label: dateLabel(date),
      expected_orders: Math.max(0, Math.round(baseline * trendRatio + reservationLift)),
      expected_guests: reservedGuests,
      confidence,
    };
  });
  const projectedOrders = days.reduce((sum, day) => sum + day.expected_orders, 0);
  const previousWeekDates = Array.from({ length: 7 }, (_, index) => addDays(today, index - 7));
  const previousWeekOrders = previousWeekDates.reduce((sum, date) => sum + (dayCounts.get(date) ?? 0), 0);
  const changePercent = previousWeekOrders > 0 ? Math.round(((projectedOrders - previousWeekOrders) / previousWeekOrders) * 100) : 0;

  const recentOrderIds = new Set(orders.filter((order) => manilaDate(new Date(order.created_at)) >= addDays(today, -28)).map((order) => order.id));
  const itemTotals = new Map<string, number>();
  for (const item of items) {
    if (recentOrderIds.has(item.order_id)) itemTotals.set(item.name, (itemTotals.get(item.name) ?? 0) + Number(item.quantity || 0));
  }
  const recentOrderCount = Math.max(1, recentOrderIds.size);
  const menuItems = [...itemTotals.entries()]
    .map(([name, quantity]) => ({
      name,
      expected_quantity: Math.max(1, Math.round((quantity / recentOrderCount) * projectedOrders)),
      trend: trendRatio > 1.08 ? "up" as const : trendRatio < 0.92 ? "down" as const : "steady" as const,
    }))
    .sort((a, b) => b.expected_quantity - a.expected_quantity)
    .slice(0, 5);

  return {
    history_days: 56,
    projected_orders: projectedOrders,
    previous_week_orders: previousWeekOrders,
    change_percent: changePercent,
    days,
    menu_items: menuItems,
    note: `Forecast blends same-weekday averages with the latest 14-day sales pace${reservations.length ? " and confirmed reservation demand" : ""}. Confidence is ${confidence}.`,
  };
}

async function createInsights(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", authData.user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI insights are not configured. Add GEMINI_API_KEY to the server environment." }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { force?: boolean };
  const today = manilaDate();
  if (!body.force) {
    const { data: cached } = await supabase.from("admin_ai_insights").select("insight_date, generated_at, content")
      .eq("insight_date", today).maybeSingle();
    if (cached) return NextResponse.json({ insights: cached, cached: true });
  }

  const historyStart = new Date(Date.now() - 84 * DAY_MS).toISOString();
  const forecastEnd = addDays(today, 7);
  const [reviewsResult, ordersResult, reservationsResult] = await Promise.all([
    supabase.from("testimonials").select("review, rating, created_at").eq("is_approved", true)
      .order("created_at", { ascending: false }).limit(100),
    supabase.from("orders").select("id, created_at, status, order_type").gte("created_at", historyStart)
      .neq("status", "cancelled").order("created_at", { ascending: false }).limit(500),
    supabase.from("reservations").select("reservation_date, guests, status").gt("reservation_date", today)
      .lte("reservation_date", forecastEnd).neq("status", "cancelled"),
  ]);
  const queryError = reviewsResult.error || ordersResult.error || reservationsResult.error;
  if (queryError) return NextResponse.json({ error: queryError.message }, { status: 400 });

  const reviews = (reviewsResult.data ?? []) as Review[];
  const orders = (ordersResult.data ?? []) as Order[];
  const reservations = (reservationsResult.data ?? []) as Reservation[];
  const orderIds = orders.map((order) => order.id);
  const { data: itemData, error: itemError } = orderIds.length
    ? await supabase.from("order_items").select("order_id, name, quantity").in("order_id", orderIds)
    : { data: [], error: null };
  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 400 });
  const items = (itemData ?? []) as OrderItem[];

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length : 0;
  const positiveShare = reviews.length
    ? Math.round((reviews.filter((review) => Number(review.rating) >= 4).length / reviews.length) * 100) : 0;
  const forecast = buildForecast(orders, items, reservations, today);
  const statsSnapshot = {
    review_count: reviews.length,
    average_rating: Number(averageRating.toFixed(2)),
    positive_share: positiveShare,
    historical_orders: orders.length,
    upcoming_reservations: reservations.length,
    forecast,
  };

  const aiInput = {
    review_metrics: {
      count: reviews.length,
      average_rating: Number(averageRating.toFixed(2)),
      positive_share_percent: positiveShare,
    },
    review_texts: reviews.map((review) => ({ rating: review.rating, text: review.review.slice(0, 800) })),
    demand_forecast: forecast,
  };
  const requestPayload = JSON.stringify({
    systemInstruction: { parts: [{ text: "You are an operations analyst for Kainan sa Tabing Lawa, a family restaurant in Rizal, Philippines. Analyze only the supplied anonymized review text and calculated forecast. Never invent customer comments, causes, events, weather, revenue, or certainty. Theme mention counts must be supported by the review texts. If there is insufficient evidence, say so plainly and return fewer themes. Recommendations must be practical, concise, and link to the closest allowed admin page. The forecast is a planning estimate, not a guarantee. Keep the headline under 10 words, summary to 2 sentences, and all list items to 1 sentence." }] },
    contents: [{ role: "user", parts: [{ text: JSON.stringify(aiInput) }] }],
    generationConfig: { responseMimeType: "application/json", responseJsonSchema: aiSchema, maxOutputTokens: 1500, temperature: 0.2 },
  });
  const models = [...new Set([MODEL, FALLBACK_MODEL])];
  let aiResponse: Response | null = null;
  let aiResult: GeminiResponse | null = null;
  let selectedModel = MODEL;
  let connectionFailed = false;

  modelLoop: for (const model of models) {
    const attempts = model === MODEL ? 2 : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(15_000),
          body: requestPayload,
        });
        aiResult = (await aiResponse.json().catch(() => null)) as GeminiResponse | null;
        if (aiResponse.ok) {
          selectedModel = model;
          break modelLoop;
        }

        const message = aiResult?.error?.message?.toLowerCase() || "";
        const capacityError = aiResponse.status === 429 || aiResponse.status === 503
          || aiResult?.error?.status === "RESOURCE_EXHAUSTED"
          || aiResult?.error?.status === "UNAVAILABLE"
          || message.includes("high demand")
          || message.includes("overloaded");
        if (!capacityError) break modelLoop;
        if (attempt + 1 < attempts) {
          await new Promise((resolve) => setTimeout(resolve, 750));
        }
      } catch (error) {
        connectionFailed = true;
        const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
        if (!timedOut) break modelLoop;
      }
    }
  }

  if (!aiResponse?.ok) {
    const serviceMessage = aiResult?.error?.message || "";
    const capacityError = aiResponse?.status === 429 || aiResponse?.status === 503
      || serviceMessage.toLowerCase().includes("high demand")
      || serviceMessage.toLowerCase().includes("overloaded");
    return NextResponse.json(
      {
        error: capacityError
          ? "Gemini is temporarily busy, including the backup model. Please try again in a few minutes."
          : connectionFailed
            ? "Could not connect to Gemini. Please try again."
            : serviceMessage || "The AI service could not prepare the analysis.",
      },
      { status: capacityError ? 503 : 502 }
    );
  }

  let parsed: unknown = null;
  try {
    const text = extractOutputText(aiResult)?.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  const narrative = normalizeNarrative(parsed, reviews.length);
  const content = {
    headline: narrative.headline,
    executive_summary: narrative.executive_summary,
    review: {
      review_count: reviews.length,
      average_rating: Number(averageRating.toFixed(1)),
      positive_share: positiveShare,
      overview: narrative.review_overview,
      strengths: narrative.strengths,
      opportunities: narrative.opportunities,
      themes: narrative.themes,
    },
    forecast,
    actions: narrative.actions,
  };

  const { data: saved, error: saveError } = await supabase.from("admin_ai_insights").upsert({
    insight_date: today,
    content,
    stats_snapshot: statsSnapshot,
    model: selectedModel,
    generated_at: new Date().toISOString(),
    generated_by: authData.user.id,
  }, { onConflict: "insight_date" }).select("insight_date, generated_at, content").single();
  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 400 });

  return NextResponse.json({ insights: saved, cached: false });
}

export async function POST(request: Request) {
  try {
    return await createInsights(request);
  } catch (error) {
    console.error("AI insights request failed:", error);
    return NextResponse.json(
      { error: "The analysis service encountered an unexpected error. Please try again." },
      { status: 500 }
    );
  }
}

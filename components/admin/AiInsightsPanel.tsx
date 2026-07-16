"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type ForecastDay = {
  date: string;
  label: string;
  expected_orders: number;
  expected_guests: number;
  confidence: "low" | "medium" | "high";
};

export type AiInsightRecord = {
  insight_date: string;
  generated_at: string;
  content: {
    headline: string;
    executive_summary: string;
    review: {
      review_count: number;
      average_rating: number;
      positive_share: number;
      overview: string;
      strengths: string[];
      opportunities: string[];
      themes: Array<{ label: string; sentiment: "positive" | "mixed" | "negative"; mentions: number }>;
    };
    forecast: {
      history_days: number;
      projected_orders: number;
      previous_week_orders: number;
      change_percent: number;
      days: ForecastDay[];
      menu_items: Array<{ name: string; expected_quantity: number; trend: "up" | "steady" | "down" }>;
      note: string;
    };
    actions: Array<{ title: string; detail: string; priority: "high" | "medium" | "low"; href: string }>;
  };
};

const sentimentStyles = {
  positive: "bg-[#E7EFE2] text-[#36543A]",
  mixed: "bg-[#FFF3D9] text-[#875E18]",
  negative: "bg-[#FCE8E4] text-[#98483A]",
};

const priorityStyles = {
  high: "border-[#D99A8B] bg-[#FFF5F2]",
  medium: "border-[#DFC48C] bg-[#FFF9EA]",
  low: "border-[#C7D4C0] bg-[#F3F7F0]",
};

export default function AiInsightsPanel({ initialInsights }: { initialInsights: AiInsightRecord | null }) {
  const [insights, setInsights] = useState(initialInsights);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requested = useRef(false);

  async function generate(force = false) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const responseText = await response.text();
      let result: { insights?: AiInsightRecord; error?: string } = {};

      if (responseText.trim()) {
        try {
          result = JSON.parse(responseText) as { insights?: AiInsightRecord; error?: string };
        } catch {
          throw new Error(
            response.ok
              ? "The analysis service returned an unreadable response. Please try again."
              : `The analysis service failed (${response.status}). Please check the server log.`
          );
        }
      } else {
        throw new Error(
          `The analysis service returned an empty response${response.status ? ` (${response.status})` : ""}. Please try again.`
        );
      }

      if (!response.ok || !result.insights) throw new Error(result.error || "Could not prepare the insights.");
      setInsights(result.insights);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not prepare the insights.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialInsights && !requested.current) {
      requested.current = true;
      void generate(false);
    }
  }, [initialInsights]);

  const maxOrders = Math.max(1, ...(insights?.content.forecast.days.map((day) => day.expected_orders) ?? [1]));
  const change = insights?.content.forecast.change_percent ?? 0;

  return (
    <section>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
            <Sparkles size={17} /> AI automation
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[#3B2716] sm:text-5xl">Review insights & demand forecast</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#6F675E]">
            A daily view of what guests are saying, what demand may look like next week, and where your team should act.
          </p>
        </div>
        <button
          type="button"
          onClick={() => generate(Boolean(insights))}
          disabled={loading}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2F4530] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3B593C] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          {loading ? "Analyzing data…" : insights ? "Refresh analysis" : "Generate analysis"}
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-7 rounded-2xl border border-[#E6B4A9] bg-[#FFF0ED] px-5 py-4 text-sm text-[#7E392E]">
          {error}
        </div>
      )}

      {!insights ? (
        <div className="mt-8 rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-10 text-center shadow-[0_18px_45px_rgba(59,39,22,0.07)]">
          <BarChart3 className="mx-auto text-[#C28B38]" size={38} />
          <h2 className="mt-4 text-3xl font-semibold text-[#3B2716]">{loading ? "Reading your latest signals" : "Your daily analysis is ready to run"}</h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-[#6F675E]">
            {loading ? "Combining recent reviews, completed sales, menu demand, and upcoming reservations." : "Generate an analysis from your restaurant data. No customer names or contact details are sent to the AI service."}
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-7">
          <div className="overflow-hidden rounded-3xl bg-[#142418] p-6 text-white shadow-[0_24px_70px_rgba(20,36,24,0.18)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D7A24A]">Today&apos;s signal</p>
                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{insights.content.headline}</h2>
                <p className="mt-4 max-w-4xl leading-7 text-white/75">{insights.content.executive_summary}</p>
              </div>
              <p className="shrink-0 text-xs text-white/50">
                Updated {new Date(insights.generated_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          </div>

          <div className="grid gap-7 xl:grid-cols-[0.9fr_1.4fr]">
            <article className="rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 shadow-[0_18px_45px_rgba(59,39,22,0.07)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#C28B38]"><MessageSquareText size={16} /> Guest voice</p>
                  <h2 className="mt-2 text-3xl font-semibold text-[#3B2716]">Review insights</h2>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1 text-2xl font-bold text-[#3B2716]"><Star size={19} fill="#C28B38" className="text-[#C28B38]" /> {insights.content.review.average_rating.toFixed(1)}</p>
                  <p className="text-xs text-[#81766A]">{insights.content.review.review_count} reviews</p>
                </div>
              </div>
              <p className="mt-5 leading-7 text-[#6F675E]">{insights.content.review.overview}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {insights.content.review.themes.map((theme) => (
                  <span key={theme.label} className={`rounded-full px-3 py-1.5 text-xs font-bold ${sentimentStyles[theme.sentiment]}`}>
                    {theme.label} · {theme.mentions}
                  </span>
                ))}
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="rounded-2xl bg-[#EEF3EA] p-4">
                  <h3 className="text-sm font-bold text-[#36543A]">Guests value</h3>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-[#52634F]">
                    {insights.content.review.strengths.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl bg-[#FFF5E2] p-4">
                  <h3 className="text-sm font-bold text-[#875E18]">Worth improving</h3>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-[#765F39]">
                    {insights.content.review.opportunities.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#E4D6C0] bg-white p-6 shadow-[0_18px_45px_rgba(59,39,22,0.07)] sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#C28B38]"><CalendarRange size={16} /> Next 7 days</p>
                  <h2 className="mt-2 text-3xl font-semibold text-[#3B2716]">Demand forecast</h2>
                </div>
                <div className="rounded-2xl bg-[#F7F4EF] px-4 py-3 text-right">
                  <p className="text-2xl font-bold text-[#3B2716]">{insights.content.forecast.projected_orders}</p>
                  <p className={`flex items-center justify-end gap-1 text-xs font-bold ${change >= 0 ? "text-[#45694A]" : "text-[#9A4F43]"}`}>
                    {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(change)}% vs last week
                  </p>
                </div>
              </div>
              <div className="mt-7 grid grid-cols-7 gap-2" aria-label="Expected orders by day">
                {insights.content.forecast.days.map((day) => (
                  <div key={day.date} className="flex min-w-0 flex-col items-center">
                    <div className="flex h-44 w-full items-end rounded-xl bg-[#F2EDE5] p-1.5">
                      <div className="w-full rounded-lg bg-[#566B43] transition-all" style={{ height: `${Math.max(10, (day.expected_orders / maxOrders) * 100)}%` }} title={`${day.expected_orders} expected orders`} />
                    </div>
                    <p className="mt-2 text-xs font-bold text-[#3B2716]">{day.label}</p>
                    <p className="text-xs text-[#81766A]">{day.expected_orders}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 rounded-xl bg-[#F7F4EF] px-4 py-3 text-xs leading-5 text-[#746B62]">{insights.content.forecast.note}</p>
            </article>
          </div>

          <div className="grid gap-7 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 sm:p-7">
              <h2 className="text-3xl font-semibold text-[#3B2716]">Menu demand</h2>
              <p className="mt-2 text-sm text-[#6F675E]">Estimated portions for the coming week from recent sales mix.</p>
              <div className="mt-5 space-y-3">
                {insights.content.forecast.menu_items.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-4 rounded-2xl border border-[#E9DFD1] bg-white px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2F4530] text-xs font-bold text-white">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#3B2716]">{item.name}</p>
                      <p className="text-xs capitalize text-[#81766A]">{item.trend} demand</p>
                    </div>
                    <p className="text-lg font-bold text-[#C28B38]">{item.expected_quantity}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 sm:p-7">
              <h2 className="text-3xl font-semibold text-[#3B2716]">Recommended actions</h2>
              <p className="mt-2 text-sm text-[#6F675E]">Prioritized from the latest guest and demand signals.</p>
              <div className="mt-5 space-y-3">
                {insights.content.actions.map((action) => (
                  <Link key={action.title} href={action.href} className={`group block rounded-2xl border p-4 transition hover:-translate-y-0.5 ${priorityStyles[action.priority]}`}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-[#3B2716]">{action.title}</h3>
                      <ArrowRight size={17} className="text-[#6F675E] transition group-hover:translate-x-1" />
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-[#6F675E]">{action.detail}</p>
                  </Link>
                ))}
              </div>
            </article>
          </div>

          <p className="text-center text-xs leading-5 text-[#8A8178]">
            Forecasts are planning estimates based on {insights.content.forecast.history_days} days of recorded sales and current reservations. Review them alongside weather, events, and staff knowledge.
          </p>
        </div>
      )}
    </section>
  );
}

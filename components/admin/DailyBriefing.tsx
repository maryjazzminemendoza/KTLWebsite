"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";

export type DailyBriefingRecord = {
  briefing_date: string;
  generated_at: string;
  content: {
    headline: string;
    summary: string;
    priorities: Array<{
      label: string;
      detail: string;
      severity: "info" | "attention" | "urgent";
      href: string;
    }>;
    outlook: string;
  };
};

const severityStyles = {
  info: "border-[#D4DDCC] bg-[#F3F6F0]",
  attention: "border-[#E6C98F] bg-[#FFF8E8]",
  urgent: "border-[#E6B4A9] bg-[#FFF0ED]",
};

export default function DailyBriefing({ initialBriefing }: { initialBriefing: DailyBriefingRecord | null }) {
  const router = useRouter();
  const [briefing, setBriefing] = useState(initialBriefing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate(force = false) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/daily-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const result = (await response.json()) as { briefing?: DailyBriefingRecord; error?: string };
      if (!response.ok || !result.briefing) throw new Error(result.error || "Could not create the briefing.");
      setBriefing(result.briefing);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the briefing.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-10 overflow-hidden rounded-3xl border border-[#D7C6A8] bg-[#142418] text-white shadow-[0_24px_70px_rgba(20,36,24,0.18)]">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D7A24A]">
              <Sparkles size={16} /> AI Daily Briefing
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              {briefing?.content.headline || "Your morning operations briefing"}
            </h2>
            {briefing && (
              <p className="mt-2 text-xs text-white/55">
                Updated {new Date(briefing.generated_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </div>
          <button type="button" onClick={() => generate(Boolean(briefing))} disabled={loading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            {loading ? "Preparing..." : briefing ? "Refresh briefing" : "Generate briefing"}
          </button>
        </div>

        {error && <div className="mt-5 rounded-xl border border-red-300/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">{error}</div>}

        {briefing ? (
          <div className="mt-7">
            <p className="max-w-4xl leading-7 text-white/80">{briefing.content.summary}</p>
            {briefing.content.priorities.length > 0 && (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {briefing.content.priorities.map((priority, index) => (
                  <Link key={`${priority.label}-${index}`} href={priority.href} className={`group rounded-2xl border p-5 text-[#3B2716] transition hover:-translate-y-0.5 ${severityStyles[priority.severity]}`}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold">{priority.label}</h3>
                      <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#6F675E]">{priority.detail}</p>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-6 border-t border-white/10 pt-5 text-sm text-white/70">
              <span className="font-bold text-[#D7A24A]">Outlook:</span> {briefing.content.outlook}
            </div>
          </div>
        ) : (
          <p className="mt-6 max-w-2xl leading-7 text-white/70">
            Generate a concise briefing from today&apos;s active orders, upcoming reservations, unread messages, and menu availability.
          </p>
        )}
      </div>
    </section>
  );
}

import AdminShell from "@/components/admin/AdminShell";
import AiInsightsPanel, { type AiInsightRecord } from "@/components/admin/AiInsightsPanel";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function manilaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function getTodaysInsights() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_ai_insights")
    .select("insight_date, generated_at, content")
    .eq("insight_date", manilaDate())
    .maybeSingle();

  if (error) {
    console.error("Error fetching AI insights:", error.message);
    return null;
  }
  return data as AiInsightRecord | null;
}

export default async function AdminInsightsPage() {
  await requireAdmin();
  const insights = await getTodaysInsights();

  return (
    <AdminShell>
      <AiInsightsPanel initialInsights={insights} />
    </AdminShell>
  );
}

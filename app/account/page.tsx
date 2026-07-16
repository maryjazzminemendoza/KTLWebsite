import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoyaltyQrCard from "@/components/account/LoyaltyQrCard";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { CalendarDays, Mail, Phone, UserRound } from "lucide-react";

async function getLoyalty(userId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("loyalty_code, full_name, phone, created_at").eq("id", userId).single(),
    supabase.from("loyalty_visits").select("*", { count: "exact", head: true }).eq("customer_id", userId),
  ]);
  return { code: profile?.loyalty_code as string | undefined, visits: count ?? 0, profile };
}

function formatMemberSince(value?: string) {
  if (!value) return "Member";
  return new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(new Date(value));
}

export default async function AccountPage() {
  const user = await requireUser();
  const loyalty = await getLoyalty(user.id);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#FFF9ED_0%,#F7F4EF_42%,#EFE9DF_100%)] px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
        <section className="mx-auto w-full max-w-5xl">
          <section className="rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 shadow-[0_16px_45px_rgba(59,39,22,0.07)] sm:p-8">
            <div className="flex items-center gap-4 border-b border-[#E4D6C0] pb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2F4530] text-white"><UserRound size={24} /></div>
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C28B38]">Account details</p><h2 className="mt-1 text-2xl font-semibold text-[#3B2716]">{loyalty.profile?.full_name || "Customer"}</h2></div>
            </div>
            <dl className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#E9DFD0] bg-white p-4"><dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#9A8B7A]"><Mail size={16} className="text-[#C28B38]" /> Email</dt><dd className="mt-2 break-all text-sm font-semibold text-[#3B2716]">{user.email}</dd></div>
              <div className="rounded-2xl border border-[#E9DFD0] bg-white p-4"><dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#9A8B7A]"><Phone size={16} className="text-[#C28B38]" /> Phone</dt><dd className="mt-2 text-sm font-semibold text-[#3B2716]">{loyalty.profile?.phone || "Not provided yet"}</dd></div>
              <div className="rounded-2xl border border-[#E9DFD0] bg-white p-4"><dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#9A8B7A]"><CalendarDays size={16} className="text-[#C28B38]" /> Member since</dt><dd className="mt-2 text-sm font-semibold text-[#3B2716]">{formatMemberSince(loyalty.profile?.created_at)}</dd></div>
            </dl>
          </section>

          {loyalty.code && (
            <div className="mt-6">
              <LoyaltyQrCard code={loyalty.code} visits={loyalty.visits} />
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

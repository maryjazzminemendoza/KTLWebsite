import AdminShell from "@/components/admin/AdminShell";
import DailyBriefing, { type DailyBriefingRecord } from "@/components/admin/DailyBriefing";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Link from "next/link";
import {
  CalendarDays,
  Inbox,
  MenuSquare,
  MessageSquareText,
  ShoppingBag,
  UsersRound,
  BrainCircuit,
} from "lucide-react";

async function getDashboardCounts() {
  const [
    menuItemsResult,
    pendingReservationsResult,
    pendingOrdersResult,
    unreadMessagesResult,
    featuredReviewsResult,
    registeredCustomersResult,
  ] = await Promise.all([
    supabase.from("menu_items").select("*", { count: "exact", head: true }),

    supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),

    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),

    supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("status", "unread"),

    supabase
      .from("testimonials")
      .select("*", { count: "exact", head: true })
      .eq("is_featured", true),

    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer"),
  ]);

  return {
    menuItems: menuItemsResult.count ?? 0,
    pendingReservations: pendingReservationsResult.count ?? 0,
    pendingOrders: pendingOrdersResult.count ?? 0,
    unreadMessages: unreadMessagesResult.count ?? 0,
    featuredReviews: featuredReviewsResult.count ?? 0,
    registeredCustomers: registeredCustomersResult.count ?? 0,
  };
}

async function getTodaysBriefing() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const serverSupabase = await createSupabaseServerClient();
  const { data, error } = await serverSupabase
    .from("admin_daily_briefings")
    .select("briefing_date, generated_at, content")
    .eq("briefing_date", today)
    .maybeSingle();

  if (error) {
    console.error("Error fetching daily briefing:", error.message);
    return null;
  }
  return data as DailyBriefingRecord | null;
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [counts, briefing] = await Promise.all([
    getDashboardCounts(),
    getTodaysBriefing(),
  ]);

  const cards = [
    {
      title: "AI Insights",
      count: 7,
      label: "day outlook",
      description:
        "Turn guest reviews and sales history into themes, demand forecasts, and suggested actions.",
      href: "/admin/insights",
      icon: BrainCircuit,
    },
    {
      title: "Manage Menu",
      count: counts.menuItems,
      label: "menu items",
      description:
        "Add dishes, update prices, mark best sellers, and hide unavailable items.",
      href: "/admin/menu",
      icon: MenuSquare,
    },
    {
      title: "Reservations",
      count: counts.pendingReservations,
      label: "pending",
      description:
        "View, confirm, cancel, and manage customer table reservations.",
      href: "/admin/reservations",
      icon: CalendarDays,
    },
    {
      title: "Orders",
      count: counts.pendingOrders,
      label: "pending",
      description:
        "View and manage cart orders submitted by customers from the website.",
      href: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      title: "Messages",
      count: counts.unreadMessages,
      label: "unread",
      description:
        "Review inquiries submitted through the public contact form.",
      href: "/admin/messages",
      icon: Inbox,
    },
    {
      title: "Reviews",
      count: counts.featuredReviews,
      label: "featured",
      description:
        "Approve customer reviews and choose which testimonials appear on the homepage.",
      href: "/admin/testimonials",
      icon: MessageSquareText,
    },
    {
      title: "Customers",
      count: counts.registeredCustomers,
      label: "registered",
      description:
        "Review registered customers and their reservation history.",
      href: "/admin/customers",
      icon: UsersRound,
    },
  ];

  return (
    <AdminShell>
      <section>
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
            Admin Dashboard
          </p>

          <h1 className="mt-3 text-5xl font-semibold text-[#3B2716]">
            Welcome Back
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6F675E]">
            Manage the restaurant website content, reservations, menu items,
            orders, reviews, and customer messages from one place.
          </p>
        </div>

        <DailyBriefing initialBriefing={briefing} />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-7 shadow-[0_18px_45px_rgba(59,39,22,0.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(59,39,22,0.12)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2F4530] text-white transition group-hover:bg-[#C28B38]">
                  <Icon size={24} />
                </div>

                <div className="mt-6 flex items-end gap-2">
                  <p className="text-5xl font-semibold leading-none text-[#3B2716]">
                    {card.count}
                  </p>

                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#C28B38]">
                    {card.label}
                  </p>
                </div>

                <h2 className="mt-5 text-2xl font-semibold text-[#3B2716]">
                  {card.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#6F675E]">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}

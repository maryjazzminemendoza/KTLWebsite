import AdminShell from "@/components/admin/AdminShell";
import MessagesAdminPanel from "@/components/admin/MessagesAdminPanel";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type ContactMessage = {
  id: number;
  full_name: string;
  phone: string | null;
  email: string;
  message: string;
  status: "unread" | "read" | "archived";
  created_at: string;
  ai_summary: string | null;
  ai_category: string | null;
  ai_priority: "low" | "normal" | "high" | "urgent" | null;
  ai_draft_reply: string | null;
  ai_processed_at: string | null;
};

async function getContactMessages() {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching contact messages:", error.message);
    return [];
  }

  return data as ContactMessage[];
}

export default async function AdminMessagesPage() {
  await requireAdmin();

  const messages = await getContactMessages();

  return (
    <AdminShell>
      <section>
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
            Admin Dashboard
          </p>

          <h1 className="mt-3 text-5xl font-semibold text-[#3B2716]">
            Contact Messages
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6F675E]">
            View customer inquiries from the contact page, mark messages as
            read, and archive messages that have already been handled.
          </p>
        </div>

        <MessagesAdminPanel initialMessages={messages} />
      </section>
    </AdminShell>
  );
}

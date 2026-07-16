"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Archive,
  Bot,
  CheckCircle,
  Copy,
  Mail,
  Phone,
  Search,
  Save,
  Send,
  Undo2,
} from "lucide-react";

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

const priorityStyles = {
  low: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const statusStyles = {
  unread: "bg-yellow-100 text-yellow-800",
  read: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-700",
};

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
  { label: "Archived", value: "archived" },
];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function MessagesAdminPanel({
  initialMessages,
}: {
  initialMessages: ContactMessage[];
}) {
  const router = useRouter();

  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const filteredMessages = useMemo(() => {
    return messages.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const searchValue = search.toLowerCase();

      const matchesSearch =
        item.full_name.toLowerCase().includes(searchValue) ||
        item.email.toLowerCase().includes(searchValue) ||
        item.phone?.toLowerCase().includes(searchValue) ||
        item.message.toLowerCase().includes(searchValue);

      return matchesStatus && matchesSearch;
    });
  }, [messages, statusFilter, search]);

  const counts = useMemo(() => {
    return {
      all: messages.length,
      unread: messages.filter((item) => item.status === "unread").length,
      read: messages.filter((item) => item.status === "read").length,
      archived: messages.filter((item) => item.status === "archived").length,
    };
  }, [messages]);

  async function updateStatus(
    messageId: number,
    status: ContactMessage["status"]
  ) {
    setNotice("");

    const { data, error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", messageId)
      .select()
      .single();

    if (error) {
      setNotice(error.message);
      return;
    }

    setMessages((prev) =>
      prev.map((item) =>
        item.id === messageId ? (data as ContactMessage) : item
      )
    );

    setNotice(`Message marked as ${status}.`);
    router.refresh();
  }

  async function analyzeMessage(messageId: number) {
    setNotice("");
    setAnalyzingId(messageId);

    try {
      const response = await fetch(`/api/admin/messages/${messageId}/analyze`, {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Could not analyze the message.");

      setMessages((previous) =>
        previous.map((item) => (item.id === messageId ? result.message : item))
      );
      setNotice("AI summary and reply draft are ready for review.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not analyze the message.");
    } finally {
      setAnalyzingId(null);
    }
  }

  function updateDraft(messageId: number, value: string) {
    setMessages((previous) =>
      previous.map((item) =>
        item.id === messageId ? { ...item, ai_draft_reply: value } : item
      )
    );
  }

  async function saveDraft(item: ContactMessage) {
    setSavingId(item.id);
    setNotice("");

    const { error } = await supabase
      .from("contact_messages")
      .update({ ai_draft_reply: item.ai_draft_reply })
      .eq("id", item.id);

    setSavingId(null);
    setNotice(error ? error.message : "Reply draft saved.");
  }

  async function copyDraft(draft: string) {
    await navigator.clipboard.writeText(draft);
    setNotice("Reply draft copied.");
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statusOptions.map((status) => {
          const key = status.value as keyof typeof counts;

          return (
            <button
              key={status.value}
              type="button"
              onClick={() => setStatusFilter(status.value)}
              className={`rounded-3xl border p-5 text-left shadow-[0_18px_45px_rgba(59,39,22,0.06)] transition ${
                statusFilter === status.value
                  ? "border-[#C28B38] bg-[#2F4530] text-white"
                  : "border-[#E4D6C0] bg-[#FBF7EF] text-[#3B2716] hover:-translate-y-1"
              }`}
            >
              <p
                className={`text-sm font-bold uppercase tracking-[0.16em] ${
                  statusFilter === status.value
                    ? "text-[#D7A24A]"
                    : "text-[#C28B38]"
                }`}
              >
                {status.label}
              </p>

              <p className="mt-3 text-4xl font-semibold">{counts[key]}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 shadow-[0_18px_45px_rgba(59,39,22,0.08)]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-[#3B2716]">
              Customer Inquiries
            </h2>

            <p className="mt-1 text-sm text-[#6F675E]">
              Messages submitted through the public contact page.
            </p>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A8B7A]"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-[#E4D6C0] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#C28B38]"
              placeholder="Search name, email, phone, or message..."
            />
          </div>
        </div>

        {notice && (
          <div className="mb-5 rounded-2xl border border-[#E4D6C0] bg-[#F7F0E4] px-4 py-3 text-sm text-[#3B2716]">
            {notice}
          </div>
        )}

        <div className="space-y-4">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[#E4D6C0] bg-white p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-serif text-3xl font-semibold text-[#3B2716]">
                        {item.full_name}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                          statusStyles[item.status]
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9A8B7A]">
                      Sent {formatDateTime(item.created_at)}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm text-[#6F675E] md:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <Mail size={17} className="text-[#C28B38]" />
                        {item.email}
                      </p>

                      {item.phone && (
                        <p className="flex items-center gap-2">
                          <Phone size={17} className="text-[#C28B38]" />
                          {item.phone}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 rounded-2xl bg-[#F7F0E4] p-5 text-sm leading-7 text-[#6F675E]">
                      {item.message}
                    </div>

                    {item.ai_summary && (
                      <div className="mt-5 rounded-2xl border border-[#D9E1D2] bg-[#F3F6F0] p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2F4530]">
                            <Bot size={16} /> AI Assistant
                          </span>
                          {item.ai_category && (
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-[#3B2716]">
                              {item.ai_category.replaceAll("_", " ")}
                            </span>
                          )}
                          {item.ai_priority && (
                            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${priorityStyles[item.ai_priority]}`}>
                              {item.ai_priority}
                            </span>
                          )}
                        </div>

                        <p className="mt-3 text-sm leading-6 text-[#3B2716]">{item.ai_summary}</p>

                        <label className="mt-5 block text-xs font-bold uppercase tracking-[0.16em] text-[#6F675E]">
                          Editable reply draft
                        </label>
                        <textarea
                          value={item.ai_draft_reply || ""}
                          onChange={(event) => updateDraft(item.id, event.target.value)}
                          rows={7}
                          className="mt-2 w-full resize-y rounded-xl border border-[#D4DDCC] bg-white px-4 py-3 text-sm leading-6 text-[#3B2716] outline-none focus:border-[#C28B38]"
                        />

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => saveDraft(item)} disabled={savingId === item.id} className="inline-flex items-center gap-2 rounded-xl bg-[#2F4530] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                            <Save size={16} /> {savingId === item.id ? "Saving..." : "Save Draft"}
                          </button>
                          <button type="button" onClick={() => copyDraft(item.ai_draft_reply || "")} className="inline-flex items-center gap-2 rounded-xl border border-[#D4DDCC] bg-white px-4 py-2 text-sm font-semibold text-[#3B2716]">
                            <Copy size={16} /> Copy
                          </button>
                          <a href={`mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent("Re: Your inquiry to Kainan sa Tabing Lawa")}&body=${encodeURIComponent(item.ai_draft_reply || "")}`} className="inline-flex items-center gap-2 rounded-xl border border-[#C28B38] bg-white px-4 py-2 text-sm font-semibold text-[#8A5F24]">
                            <Send size={16} /> Open in Email
                          </a>
                        </div>
                        <p className="mt-3 text-xs text-[#7B746C]">Review all details before sending. AI drafts may contain mistakes.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 xl:w-52 xl:flex-col">
                    <button
                      type="button"
                      onClick={() => analyzeMessage(item.id)}
                      disabled={analyzingId === item.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F4530] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3C5940] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Bot size={16} />
                      {analyzingId === item.id
                        ? "Analyzing..."
                        : item.ai_summary
                          ? "Regenerate AI Draft"
                          : "Analyze & Draft"}
                    </button>
                    {item.status !== "read" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(item.id, "read")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                      >
                        <CheckCircle size={16} />
                        Mark Read
                      </button>
                    )}

                    {item.status !== "archived" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(item.id, "archived")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                      >
                        <Archive size={16} />
                        Archive
                      </button>
                    )}

                    {item.status !== "unread" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(item.id, "unread")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E4D6C0] px-4 py-2 text-sm font-semibold text-[#3B2716] transition hover:bg-[#F7F0E4]"
                      >
                        <Undo2 size={16} />
                        Mark Unread
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D7C6A8] bg-[#F7F0E4] p-8 text-center">
              <h3 className="text-2xl font-semibold text-[#3B2716]">
                No messages found
              </h3>

              <p className="mt-2 text-sm text-[#6F675E]">
                Customer inquiries from the contact page will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Search,
  UsersRound,
  XCircle,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

type RequestAnalysis = {
  summary: string;
  priority: "low" | "medium" | "high";
  categories: string[];
  staff_actions: string[];
  clarification_needed: boolean;
  clarification_question: string | null;
  safety_note: string | null;
};

type Reservation = {
  id: number;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  special_requests: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  ai_request_analysis: RequestAnalysis | null;
  ai_analyzed_at: string | null;
  ai_analysis_model: string | null;
};

const priorityStyles = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-700",
};

function formatCategory(value: string) {
  return value.replaceAll("_", " ");
}

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-800",
};

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Completed", value: "completed" },
];

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));

  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReservationsAdminPanel({
  initialReservations,
}: {
  initialReservations: Reservation[];
}) {
  const router = useRouter();

  const [reservations, setReservations] =
    useState<Reservation[]>(initialReservations);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesStatus =
        statusFilter === "all" || reservation.status === statusFilter;

      const searchValue = search.toLowerCase();

      const matchesSearch =
        reservation.customer_name.toLowerCase().includes(searchValue) ||
        reservation.email.toLowerCase().includes(searchValue) ||
        reservation.phone.toLowerCase().includes(searchValue);

      return matchesStatus && matchesSearch;
    });
  }, [reservations, statusFilter, search]);

  const counts = useMemo(() => {
    return {
      all: reservations.length,
      pending: reservations.filter((item) => item.status === "pending").length,
      confirmed: reservations.filter((item) => item.status === "confirmed")
        .length,
      cancelled: reservations.filter((item) => item.status === "cancelled")
        .length,
      completed: reservations.filter((item) => item.status === "completed")
        .length,
    };
  }, [reservations]);

  async function updateStatus(
    reservationId: number,
    status: Reservation["status"]
  ) {
    setMessage("");
    setUpdatingId(reservationId);

    const response = await fetch(`/api/admin/reservations/${reservationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    setUpdatingId(null);

    if (!response.ok) {
      setMessage(result.error || "Unable to update the reservation.");
      return;
    }

    setReservations((prev) =>
      prev.map((reservation) =>
        reservation.id === reservationId
          ? (result.reservation as Reservation)
          : reservation
      )
    );

    const outcomes = [
      `Reservation marked as ${status}.`,
      result.emailSent ? "The customer was emailed." : `Email was not sent: ${result.emailError}`,
      result.calendarSynced
        ? status === "confirmed"
          ? "Google Calendar is synced."
          : status === "completed"
            ? "The calendar event was retained."
            : "Google Calendar is synced."
        : `Google Calendar was not synced: ${result.calendarError}`,
    ];
    setMessage(outcomes.join(" "));
    router.refresh();
  }

  async function syncCalendar(reservationId: number) {
    setMessage("");
    setSyncingId(reservationId);
    const response = await fetch(`/api/admin/reservations/${reservationId}/calendar`, {
      method: "POST",
    });
    const result = await response.json();
    setSyncingId(null);

    if (!response.ok) {
      setMessage(result.error || "Unable to sync Google Calendar.");
      return;
    }

    setMessage(`Google Calendar ${result.calendar.action} successfully.`);
  }

  async function analyzeRequest(reservationId: number) {
    setMessage("");
    setAnalyzingId(reservationId);

    const response = await fetch(`/api/admin/reservations/${reservationId}/analyze`, {
      method: "POST",
    });
    const result = await response.json();
    setAnalyzingId(null);

    if (!response.ok) {
      setMessage(result.error || "Unable to analyze the special request.");
      return;
    }

    setReservations((current) =>
      current.map((reservation) =>
        reservation.id === reservationId
          ? (result.reservation as Reservation)
          : reservation
      )
    );
    setMessage("Special request analyzed. Review the AI notes before taking action.");
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              Reservation Requests
            </h2>
            <p className="mt-1 text-sm text-[#6F675E]">
              Confirmed reservations are added to Google Calendar automatically.
              Use manual sync only to retry an existing confirmed booking.
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
              placeholder="Search name, email, or phone..."
            />
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-[#E4D6C0] bg-[#F7F0E4] px-4 py-3 text-sm text-[#3B2716]">
            {message}
          </div>
        )}

        <div className="space-y-4">
          {filteredReservations.length > 0 ? (
            filteredReservations.map((reservation) => (
              <article
                key={reservation.id}
                className="rounded-2xl border border-[#E4D6C0] bg-white p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-serif text-3xl font-semibold text-[#3B2716]">
                        {reservation.customer_name}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                          statusStyles[reservation.status]
                        }`}
                      >
                        {reservation.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-[#6F675E] md:grid-cols-2 xl:grid-cols-4">
                      <p className="flex items-center gap-2">
                        <CalendarDays size={17} className="text-[#C28B38]" />
                        {formatDate(reservation.reservation_date)}
                      </p>

                      <p className="flex items-center gap-2">
                        <Clock size={17} className="text-[#C28B38]" />
                        {formatTime(reservation.reservation_time)}
                      </p>

                      <p className="flex items-center gap-2">
                        <UsersRound size={17} className="text-[#C28B38]" />
                        {reservation.guests} guest
                        {reservation.guests > 1 ? "s" : ""}
                      </p>

                      <p className="flex items-center gap-2">
                        <Phone size={17} className="text-[#C28B38]" />
                        {reservation.phone}
                      </p>
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-sm text-[#6F675E]">
                      <Mail size={17} className="text-[#C28B38]" />
                      {reservation.email}
                    </p>

                    {reservation.special_requests && (
                      <div className="mt-4 rounded-2xl bg-[#F7F0E4] p-4 text-sm leading-6 text-[#6F675E]">
                        <span className="font-semibold text-[#3B2716]">
                          Special requests:
                        </span>{" "}
                        {reservation.special_requests}
                      </div>
                    )}

                    {reservation.ai_request_analysis && (
                      <div className="mt-4 rounded-2xl border border-[#D8C39E] bg-[#FFF9EE] p-5 text-sm text-[#3B2716]">
                        <div className="flex flex-wrap items-center gap-2">
                          <Sparkles size={17} className="text-[#C28B38]" />
                          <span className="font-bold">AI request analysis</span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${priorityStyles[reservation.ai_request_analysis.priority]}`}>
                            {reservation.ai_request_analysis.priority} priority
                          </span>
                        </div>

                        <p className="mt-3 leading-6">{reservation.ai_request_analysis.summary}</p>

                        {reservation.ai_request_analysis.categories.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {reservation.ai_request_analysis.categories.map((category) => (
                              <span key={category} className="rounded-full bg-white px-3 py-1 text-xs capitalize text-[#6F675E]">
                                {formatCategory(category)}
                              </span>
                            ))}
                          </div>
                        )}

                        {reservation.ai_request_analysis.staff_actions.length > 0 && (
                          <div className="mt-4">
                            <p className="font-semibold">Suggested staff actions</p>
                            <ul className="mt-1 list-disc space-y-1 pl-5 text-[#6F675E]">
                              {reservation.ai_request_analysis.staff_actions.map((action) => (
                                <li key={action}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {reservation.ai_request_analysis.clarification_question && (
                          <p className="mt-4 rounded-xl bg-white p-3 leading-6">
                            <span className="font-semibold">Ask the customer:</span>{" "}
                            {reservation.ai_request_analysis.clarification_question}
                          </p>
                        )}

                        {reservation.ai_request_analysis.safety_note && (
                          <p className="mt-3 flex items-start gap-2 text-red-700">
                            <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                            {reservation.ai_request_analysis.safety_note}
                          </p>
                        )}

                        <p className="mt-4 text-xs text-[#8A7B6C]">
                          Advisory only — verify important accommodations with the customer and restaurant staff.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 xl:w-56 xl:flex-col">
                    {reservation.status === "confirmed" && (
                      <button
                        type="button"
                        disabled={syncingId === reservation.id}
                        onClick={() => syncCalendar(reservation.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#EDF1E9] px-4 py-2 text-sm font-semibold text-[#2F4530] transition hover:bg-[#DDE6D7] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RefreshCw size={16} className={syncingId === reservation.id ? "animate-spin" : ""} />
                        {syncingId === reservation.id ? "Syncing..." : "Re-sync Google Calendar"}
                      </button>
                    )}
                    {reservation.special_requests && (
                      <button
                        type="button"
                        disabled={analyzingId === reservation.id}
                        onClick={() => analyzeRequest(reservation.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFF3D9] px-4 py-2 text-sm font-semibold text-[#8A5F24] transition hover:bg-[#F9E7C0] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Sparkles size={16} />
                        {analyzingId === reservation.id
                          ? "Analyzing..."
                          : reservation.ai_request_analysis
                            ? "Analyze again"
                            : "Analyze request"}
                      </button>
                    )}
                    {reservation.status !== "confirmed" && (
                      <button
                        type="button"
                        disabled={updatingId === reservation.id}
                        onClick={() =>
                          updateStatus(reservation.id, "confirmed")
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                      >
                        <CheckCircle size={16} />
                        Confirm
                      </button>
                    )}

                    {reservation.status !== "completed" && (
                      <button
                        type="button"
                        disabled={updatingId === reservation.id}
                        onClick={() =>
                          updateStatus(reservation.id, "completed")
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        <CheckCircle size={16} />
                        Complete
                      </button>
                    )}

                    {reservation.status !== "cancelled" && (
                      <button
                        type="button"
                        disabled={updatingId === reservation.id}
                        onClick={() =>
                          updateStatus(reservation.id, "cancelled")
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <XCircle size={16} />
                        Cancel
                      </button>
                    )}

                    {reservation.status !== "pending" && (
                      <button
                        type="button"
                        disabled={updatingId === reservation.id}
                        onClick={() => updateStatus(reservation.id, "pending")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E4D6C0] px-4 py-2 text-sm font-semibold text-[#3B2716] transition hover:bg-[#F7F0E4]"
                      >
                        Back to Pending
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D7C6A8] bg-[#F7F0E4] p-8 text-center">
              <h3 className="text-2xl font-semibold text-[#3B2716]">
                No reservations found
              </h3>
              <p className="mt-2 text-sm text-[#6F675E]">
                Reservation requests will appear here once customers submit the
                booking form.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

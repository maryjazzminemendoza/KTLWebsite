"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Search,
  UsersRound,
  Phone,
  Mail,
  MessageSquareText,
  Utensils,
} from "lucide-react";

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
};

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-800",
};

const statusDescriptions = {
  pending: "Your request has been submitted and is waiting for confirmation.",
  confirmed: "Your table has been confirmed. See you by the lake!",
  cancelled: "This reservation has been cancelled.",
  completed: "This visit has been completed. Thank you for dining with us.",
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
    weekday: "long",
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

export default function MyReservationsList({
  initialReservations,
}: {
  initialReservations: Reservation[];
}) {
  const [reservations] = useState<Reservation[]>(initialReservations);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesStatus =
        statusFilter === "all" || reservation.status === statusFilter;

      const searchValue = search.toLowerCase();

      const matchesSearch =
        reservation.customer_name.toLowerCase().includes(searchValue) ||
        reservation.reservation_date.toLowerCase().includes(searchValue) ||
        reservation.status.toLowerCase().includes(searchValue);

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
              Reservation History
            </h2>
            <p className="mt-1 text-sm text-[#6F675E]">
              Track the status of your table reservations.
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
              placeholder="Search reservation..."
            />
          </div>
        </div>

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
                        Reservation #{reservation.id}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                          statusStyles[reservation.status]
                        }`}
                      >
                        {reservation.status}
                      </span>
                    </div>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675E]">
                      {statusDescriptions[reservation.status]}
                    </p>

                    <div className="mt-5 grid gap-3 text-sm text-[#6F675E] md:grid-cols-2 xl:grid-cols-4">
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

                    <ReservationNotes value={reservation.special_requests} />
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
                Your reservation requests will appear here after you submit the
                booking form.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReservationNotes({ value }: { value: string | null }) {
  if (!value?.trim()) return null;
  const marker = "ADVANCE FOOD SELECTION:";
  const markerIndex = value.indexOf(marker);
  const specialRequest = markerIndex === -1 ? value.trim() : value.slice(0, markerIndex).trim();
  const foodSelection = markerIndex === -1 ? "" : value.slice(markerIndex + marker.length).trim();

  return (
    <div className="mt-5 grid gap-3 lg:grid-cols-2">
      {specialRequest && <div className="rounded-2xl border border-[#E4D6C0] bg-[#FFF9EF] p-4"><div className="flex items-center gap-2 text-[#3B2716]"><MessageSquareText size={18} className="text-[#C28B38]" /><h4 className="text-sm font-bold">Special request</h4></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#6F675E]">{specialRequest}</p></div>}
      {foodSelection && <div className="rounded-2xl border border-[#D9E1D2] bg-[#F3F6F0] p-4"><div className="flex items-center gap-2 text-[#2F4530]"><Utensils size={18} /><h4 className="text-sm font-bold">Advance food selection</h4></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#5F6B5E]">{foodSelection}</p></div>}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle, Clock, Search, UserRound, XCircle } from "lucide-react";

type Customer = {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

type Reservation = {
  id: number;
  user_id: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function CustomersAdminPanel({
  initialCustomers,
  reservations,
}: {
  initialCustomers: Customer[];
  reservations: Reservation[];
}) {
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    return initialCustomers.filter((customer) => {
      const searchValue = search.toLowerCase();

      return (
        customer.full_name?.toLowerCase().includes(searchValue) ||
        customer.id.toLowerCase().includes(searchValue)
      );
    });
  }, [initialCustomers, search]);

  function getCustomerReservationStats(userId: string) {
    const userReservations = reservations.filter(
      (reservation) => reservation.user_id === userId
    );

    return {
      total: userReservations.length,
      pending: userReservations.filter((item) => item.status === "pending")
        .length,
      confirmed: userReservations.filter((item) => item.status === "confirmed")
        .length,
      completed: userReservations.filter((item) => item.status === "completed")
        .length,
      cancelled: userReservations.filter((item) => item.status === "cancelled")
        .length,
    };
  }

  return (
    <div className="rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 shadow-[0_18px_45px_rgba(59,39,22,0.08)]">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-[#3B2716]">
            Registered Customers
          </h2>

          <p className="mt-1 text-sm text-[#6F675E]">
            Customers who created an account on the website.
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
            placeholder="Search customer..."
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const stats = getCustomerReservationStats(customer.id);

            return (
              <article
                key={customer.id}
                className="rounded-2xl border border-[#E4D6C0] bg-white p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2F4530] text-white">
                        <UserRound size={24} />
                      </div>

                      <div>
                        <h3 className="font-serif text-3xl font-semibold text-[#3B2716]">
                          {customer.full_name || "Unnamed Customer"}
                        </h3>

                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9A8B7A]">
                          Joined {formatDate(customer.created_at)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 break-all text-sm text-[#6F675E]">
                      User ID: {customer.id}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px] xl:grid-cols-5">
                    <div className="rounded-2xl bg-[#F7F0E4] p-4">
                      <CalendarDays size={18} className="text-[#C28B38]" />
                      <p className="mt-3 text-2xl font-semibold text-[#3B2716]">
                        {stats.total}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#9A8B7A]">
                        Total
                      </p>
                    </div>

                    <div className="rounded-2xl bg-yellow-50 p-4">
                      <Clock size={18} className="text-yellow-700" />
                      <p className="mt-3 text-2xl font-semibold text-yellow-800">
                        {stats.pending}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">
                        Pending
                      </p>
                    </div>

                    <div className="rounded-2xl bg-green-50 p-4">
                      <CheckCircle size={18} className="text-green-700" />
                      <p className="mt-3 text-2xl font-semibold text-green-800">
                        {stats.confirmed}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                        Confirmed
                      </p>
                    </div>

                    <div className="rounded-2xl bg-blue-50 p-4">
                      <CheckCircle size={18} className="text-blue-700" />
                      <p className="mt-3 text-2xl font-semibold text-blue-800">
                        {stats.completed}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                        Completed
                      </p>
                    </div>

                    <div className="rounded-2xl bg-red-50 p-4">
                      <XCircle size={18} className="text-red-700" />
                      <p className="mt-3 text-2xl font-semibold text-red-800">
                        {stats.cancelled}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                        Cancelled
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[#D7C6A8] bg-[#F7F0E4] p-8 text-center">
            <h3 className="text-2xl font-semibold text-[#3B2716]">
              No customers found
            </h3>

            <p className="mt-2 text-sm text-[#6F675E]">
              Registered customer accounts will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
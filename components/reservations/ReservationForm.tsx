"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCustomerErrorMessage } from "@/lib/customer-error";
import { useCart } from "@/components/cart/CartProvider";
import { CalendarDays, CheckCircle2, ShoppingBag, Utensils } from "lucide-react";

type ReservationFormProps = {
  userId: string;
  userEmail: string;
  initialName?: string;
  initialPhone?: string;
};

export default function ReservationForm({
  userId,
  userEmail,
  initialName = "",
  initialPhone = "",
}: ReservationFormProps) {
  const { items, subtotal } = useCart();
  const [customerName, setCustomerName] = useState(initialName);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [guests, setGuests] = useState("2");
  const [specialRequests, setSpecialRequests] = useState("");
  const [includeFoodOrder, setIncludeFoodOrder] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsSaving(true);
    setMessage("");

    const foodOrderDetails = includeFoodOrder && items.length > 0
      ? [
          "ADVANCE FOOD SELECTION:",
          ...items.map((item) => `${item.quantity}x ${item.name}${item.variation ? ` (${item.variation})` : ""} - ₱${(item.price * item.quantity).toFixed(2)}`),
          `ESTIMATED FOOD SUBTOTAL: ₱${subtotal.toFixed(2)}`,
          "Food selection is subject to restaurant confirmation.",
        ].join("\n")
      : "";
    const combinedRequests = [specialRequests.trim(), foodOrderDetails]
      .filter(Boolean)
      .join("\n\n");

    const payload = {
      user_id: userId,
      customer_name: customerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      reservation_date: reservationDate,
      reservation_time: reservationTime,
      guests: Number(guests),
      special_requests: combinedRequests || null,
      status: "pending",
    };

    if (
      !payload.customer_name ||
      !payload.email ||
      !payload.phone ||
      !payload.reservation_date ||
      !payload.reservation_time
    ) {
      setMessage("Please complete all required fields.");
      setIsSaving(false);
      return;
    }

    const { error } = await supabase.from("reservations").insert(payload);

    if (error) {
      setMessage(
        getCustomerErrorMessage(
          error,
          "We could not submit your reservation right now. Please try again shortly.",
        ),
      );
      setIsSaving(false);
      return;
    }

    await supabase.from("profiles").update({ full_name: payload.customer_name, phone: payload.phone }).eq("id", userId);

    setMessage(
      "Your reservation request has been submitted. Our team will confirm your booking shortly."
    );

    setCustomerName(payload.customer_name);
    setPhone(payload.phone);
    setReservationDate("");
    setReservationTime("");
    setGuests("2");
    setSpecialRequests("");
    setIncludeFoodOrder(false);
    setIsSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full min-w-0 max-w-full overflow-hidden rounded-[28px] border border-[#DED1BD] bg-white shadow-[0_24px_70px_rgba(59,39,22,0.10)] [&_input]:min-w-0 [&_input]:max-w-full [&_label]:min-w-0 [&_textarea]:min-w-0 [&_textarea]:max-w-full"
    >
      <div className="flex items-center gap-4 border-b border-[#EAE1D4] bg-[#F5EFE5] px-5 py-5 sm:px-7">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2F4530] text-white">
          <CalendarDays size={21} />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold text-[#3B2716]">Book your table</h2>
          <p className="mt-0.5 text-xs leading-5 text-[#6F675E]">We&apos;ll confirm your request after you submit.</p>
        </div>
      </div>

      <div className="min-w-0 space-y-4 px-4 py-6 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B6A3D]">Your details</p>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">
            Full Name
          </span>
          <input
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#DED1BD] bg-[#FCFAF6] px-4 py-3 text-sm outline-none transition focus:border-[#C28B38] focus:bg-white focus:ring-2 focus:ring-[#C28B38]/10"
            placeholder="Juan Dela Cruz"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">
            Email
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#DED1BD] bg-[#FCFAF6] px-4 py-3 text-sm outline-none transition focus:border-[#C28B38] focus:bg-white focus:ring-2 focus:ring-[#C28B38]/10"
            placeholder="you@example.com"
          />
        </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">
            Phone Number
          </span>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#DED1BD] bg-[#FCFAF6] px-4 py-3 text-sm outline-none transition focus:border-[#C28B38] focus:bg-white focus:ring-2 focus:ring-[#C28B38]/10"
            placeholder="09XX XXX XXXX"
          />
        </label>

        <p className="pt-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8B6A3D]">Visit details</p>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-[#3B2716]">
              Date
            </span>
            <input
              required
              type="date"
              value={reservationDate}
              onChange={(e) => setReservationDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#3B2716]">
              Time
            </span>
            <input
              required
              type="time"
              value={reservationTime}
              onChange={(e) => setReservationTime(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">
            Number of Guests
          </span>
          <input
            required
            type="number"
            min="1"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder="2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">
            Special Requests
          </span>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={2}
            className="mt-2 w-full resize-none rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder="Birthday celebration, preferred seating, allergies, etc."
          />
        </label>

        <div className="rounded-2xl border border-[#D9E0D2] bg-[#F3F6F0] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDF1E9] text-[#2F4530]">
              <Utensils size={19} />
            </div>
            <div>
              <h3 className="font-semibold text-[#3B2716]">Food pre-order <span className="font-normal text-[#817568]">· Optional</span></h3>
              <p className="mt-0.5 text-xs leading-5 text-[#6F675E]">
                Add dishes ahead of your visit.
              </p>
            </div>
          </div>

          {items.length > 0 ? (
            <>
              <div className="mt-3 max-h-32 space-y-2 overflow-y-auto border-y border-[#EEE4D6] py-3">
                {items.map((item) => (
                  <div key={item.line_key} className="flex justify-between gap-4 text-sm">
                    <span className="text-[#514A43]">{item.quantity}× {item.name}{item.variation ? ` (${item.variation})` : ""}</span>
                    <span className="shrink-0 font-semibold text-[#3B2716]">₱{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-[#EEE4D6] pt-2 text-sm font-bold text-[#3B2716]">
                  <span>Estimated subtotal</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={includeFoodOrder} onChange={(e) => setIncludeFoodOrder(e.target.checked)} className="sr-only" />
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${includeFoodOrder ? "border-[#2F4530] bg-[#2F4530] text-white" : "border-[#CDBDA7]"}`}>
                  {includeFoodOrder && <CheckCircle2 size={14} />}
                </span>
                <span className="text-sm leading-6 text-[#3B2716]">Include these dishes with my reservation</span>
              </label>

              <Link href="/menu" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#2F4530] underline decoration-[#C28B38] underline-offset-4">
                <ShoppingBag size={16} /> Edit food selection
              </Link>
            </>
          ) : (
            <Link href="/menu" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#2F4530] underline decoration-[#C28B38] underline-offset-4">
              <ShoppingBag size={17} /> Browse menu and select dishes
            </Link>
          )}
        </div>

        {message && (
          <div className="rounded-xl border border-[#E4D6C0] bg-[#F7F0E4] px-4 py-3 text-sm leading-6 text-[#3B2716]">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-[#C28B38] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(194,139,56,0.22)] transition hover:bg-[#B47E2F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Sending request…" : "Request reservation"}
        </button>
      </div>
    </form>
  );
}

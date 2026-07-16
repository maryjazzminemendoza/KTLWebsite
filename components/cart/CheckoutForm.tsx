"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/components/cart/CartProvider";
import { CheckCircle2, MapPin, ShoppingBag, Truck, X } from "lucide-react";
import { getCustomerErrorMessage } from "@/lib/customer-error";

type CheckoutFormProps = {
  userId: string;
  userEmail: string;
  initialName?: string;
  initialPhone?: string;
};

export default function CheckoutForm({ userId, userEmail, initialName = "", initialPhone = "" }: CheckoutFormProps) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [customerName, setCustomerName] = useState(initialName);
  const [email, setEmail] = useState(userEmail || "");
  const [phone, setPhone] = useState(initialPhone);
  const [orderType, setOrderType] = useState("pickup");
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, isSubmitting]);

  async function handleCheckout(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");

    if (items.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    if (!customerName.trim() || !email.trim() || !phone.trim()) {
      setMessage("Please complete your name, email, and phone number.");
      return;
    }

    if (orderType === "delivery" && (!municipality || !barangay.trim() || !streetAddress.trim())) {
      setMessage("Please complete your municipality, barangay, and delivery address.");
      return;
    }

    const orderNotes = orderType === "delivery"
      ? [
          `DELIVERY ADDRESS: ${streetAddress.trim()}, Brgy. ${barangay.trim()}, ${municipality}, Rizal`,
          landmark.trim() ? `LANDMARK: ${landmark.trim()}` : "",
          notes.trim() ? `INSTRUCTIONS: ${notes.trim()}` : "",
        ].filter(Boolean).join("\n")
      : notes.trim() || null;

    setIsSubmitting(true);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        customer_name: customerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        order_type: orderType,
        status: "pending",
        subtotal,
        notes: orderNotes,
      })
      .select()
      .single();

    if (orderError || !order) {
      setMessage(
        getCustomerErrorMessage(
          orderError,
          "We could not place your order right now. Please try again shortly.",
        ),
      );
      setIsSubmitting(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.id,
      name: item.variation ? `${item.name} (${item.variation})` : item.name,
      category: item.category,
      price: item.price,
      quantity: item.quantity,
      line_total: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      setMessage(
        getCustomerErrorMessage(
          itemsError,
          "We could not finish placing your order. Please try again shortly.",
        ),
      );
      setIsSubmitting(false);
      return;
    }

    await supabase.from("profiles").update({ full_name: customerName.trim(), phone: phone.trim() }).eq("id", userId);

    clearCart();
    setCustomerName(customerName.trim());
    setPhone(phone.trim());
    setMunicipality("");
    setBarangay("");
    setStreetAddress("");
    setLandmark("");
    setNotes("");
    setMessage(
      `Order #${order.id} has been submitted. Please wait for confirmation from the restaurant.`
    );
    setIsSubmitting(false);
    router.push("/my-orders");
  }

  return (
    <>
      <button
        type="button"
        disabled={items.length === 0}
        onClick={() => setIsOpen(true)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#C28B38] px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#B47E2F] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ShoppingBag size={18} />
        Proceed to Checkout
      </button>

      {isOpen && createPortal(
        (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) setIsOpen(false);
          }}
        >
          <form
            onSubmit={handleCheckout}
            className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-[#E4D6C0] bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8"
          >
            <button
              type="button"
              aria-label="Close checkout"
              disabled={isSubmitting}
              onClick={() => setIsOpen(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F0E4] text-[#3B2716] transition hover:bg-[#EDE2D2] disabled:opacity-50"
            >
              <X size={19} />
            </button>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2F4530] text-white">
        <ShoppingBag size={22} />
      </div>

      <h3 id="checkout-title" className="pr-12 text-3xl font-semibold text-[#3B2716]">
        Checkout Details
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#6F675E]">
        Choose pickup or local delivery, then send your order for confirmation.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">
            Full Name
          </span>
          <input
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#E4D6C0] px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder="Juan Dela Cruz"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#E4D6C0] px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">
            Phone Number
          </span>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#E4D6C0] px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder="09XX XXX XXXX"
          />
        </label>

        <fieldset>
          <legend className="text-sm font-semibold text-[#3B2716]">
            How would you like your order?
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {[
              { value: "pickup", label: "Pickup", detail: "Collect at the restaurant", icon: ShoppingBag },
              { value: "delivery", label: "Delivery", detail: "Tanay, Baras & Pililla", icon: Truck },
            ].map((option) => {
              const Icon = option.icon;
              const selected = orderType === option.value;
              return (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${selected ? "border-[#2F4530] bg-[#EDF1E9] ring-1 ring-[#2F4530]" : "border-[#E4D6C0] hover:border-[#C28B38]"}`}
                >
                  <input
                    type="radio"
                    name="orderType"
                    value={option.value}
                    checked={selected}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <Icon size={20} className="text-[#2F4530]" />
                    {selected && <CheckCircle2 size={18} className="text-[#2F4530]" />}
                  </div>
                  <p className="mt-3 text-sm font-bold text-[#3B2716]">{option.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#6F675E]">{option.detail}</p>
                </label>
              );
            })}
          </div>
        </fieldset>

        {orderType === "delivery" && (
          <div className="space-y-4 rounded-2xl border border-[#D9E1D2] bg-[#F3F6F0] p-4">
            <div className="flex gap-3 text-sm leading-6 text-[#3B2716]">
              <MapPin className="mt-0.5 shrink-0 text-[#2F4530]" size={19} />
              <p>Delivery is available within Tanay, Baras, and Pililla, Rizal. The restaurant will confirm the delivery fee before preparing your order.</p>
            </div>
            <label className="block">
              <span className="text-sm font-semibold text-[#3B2716]">Municipality</span>
              <select
                required
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#D4DDCC] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
              >
                <option value="">Select municipality</option>
                <option value="Tanay">Tanay</option>
                <option value="Baras">Baras</option>
                <option value="Pililla">Pililla</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[#3B2716]">Barangay</span>
              <input required value={barangay} onChange={(e) => setBarangay(e.target.value)} className="mt-2 w-full rounded-xl border border-[#D4DDCC] px-4 py-3 text-sm outline-none focus:border-[#C28B38]" placeholder="Enter barangay" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[#3B2716]">House no. and street</span>
              <input required value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className="mt-2 w-full rounded-xl border border-[#D4DDCC] px-4 py-3 text-sm outline-none focus:border-[#C28B38]" placeholder="House number, street or subdivision" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[#3B2716]">Nearby landmark <span className="font-normal text-[#867A6D]">(optional)</span></span>
              <input value={landmark} onChange={(e) => setLandmark(e.target.value)} className="mt-2 w-full rounded-xl border border-[#D4DDCC] px-4 py-3 text-sm outline-none focus:border-[#C28B38]" placeholder="School, store, or recognizable place" />
            </label>
          </div>
        )}

        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">
            Notes
          </span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 w-full resize-none rounded-xl border border-[#E4D6C0] px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder={orderType === "delivery" ? "Delivery instructions, allergies, or special requests" : "Special instructions or preferred pickup time"}
          />
        </label>

        {message && (
          <div className="rounded-xl border border-[#E4D6C0] bg-[#F7F0E4] px-4 py-3 text-sm leading-6 text-[#3B2716]">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className="w-full rounded-xl bg-[#C28B38] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#B47E2F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit Order"}
        </button>
      </div>
          </form>
        </div>
        ),
        document.body
      )}
    </>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCustomerErrorMessage } from "@/lib/customer-error";

export default function OrderTestimonialForm({
  orderId,
  userId,
  customerName,
  alreadySubmitted,
}: {
  orderId: number;
  userId: string;
  customerName: string;
  alreadySubmitted: boolean;
}) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!review.trim()) {
      setMessage("Please write a short review before submitting.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    const { error } = await supabase.from("testimonials").insert({
      order_id: orderId,
      user_id: userId,
      customer_name: customerName,
      review: review.trim(),
      rating,
      source: "Verified Order",
      is_approved: false,
      is_featured: false,
      display_order: 0,
    });

    if (error) {
      setMessage(
        getCustomerErrorMessage(
          error,
          "We could not submit your review right now. Please try again shortly.",
        ),
      );
    } else {
      setSubmitted(true);
      setMessage("");
    }
    setIsSaving(false);
  }

  if (submitted) {
    return (
      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#EDF4E9] p-4 text-sm text-[#2F4530]">
        <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
        <div><p className="font-bold">Testimonial submitted</p><p className="mt-1 text-xs leading-5">Thank you! It will appear on the website after approval.</p></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 rounded-2xl border border-[#E4D6C0] bg-white p-5">
      <h3 className="font-serif text-2xl font-semibold text-[#3B2716]">How was your order?</h3>
      <p className="mt-1 text-xs leading-5 text-[#6F675E]">Share your experience after this completed order.</p>
      <div className="mt-4 flex gap-1" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => setRating(value)} aria-label={`Rate ${value} stars`} className="p-1 text-[#C28B38]">
            <Star size={24} className={value <= rating ? "fill-current" : "opacity-30"} />
          </button>
        ))}
      </div>
      <textarea required rows={3} maxLength={800} value={review} onChange={(e) => setReview(e.target.value)} placeholder="Tell us what you enjoyed..." className="mt-3 w-full resize-none rounded-xl border border-[#E4D6C0] px-4 py-3 text-sm outline-none focus:border-[#C28B38]" />
      {message && <p className="mt-2 text-xs font-semibold text-red-700">{message}</p>}
      <button disabled={isSaving} className="mt-3 rounded-xl bg-[#2F4530] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#253727] disabled:opacity-60">
        {isSaving ? "Submitting..." : "Submit Testimonial"}
      </button>
    </form>
  );
}

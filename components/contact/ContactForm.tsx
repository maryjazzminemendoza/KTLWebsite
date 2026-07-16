"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCustomerErrorMessage } from "@/lib/customer-error";

export default function ContactForm({ userId, initialName = "", initialPhone = "", initialEmail = "" }: { userId?: string; initialName?: string; initialPhone?: string; initialEmail?: string }) {
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState("");

  const [statusMessage, setStatusMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsSending(true);
    setStatusMessage("");

    const payload = {
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      email: email.trim(),
      message: message.trim(),
      status: "unread",
    };

    if (!payload.full_name || !payload.email || !payload.message) {
      setStatusMessage("Please complete your name, email, and message.");
      setIsSending(false);
      return;
    }

    const { error } = await supabase.from("contact_messages").insert(payload);

    if (error) {
      setStatusMessage(
        getCustomerErrorMessage(
          error,
          "We could not send your message right now. Please try again shortly.",
        ),
      );
      setIsSending(false);
      return;
    }

    if (userId) {
      await supabase.from("profiles").update({ full_name: payload.full_name, phone: payload.phone }).eq("id", userId);
    }

    setStatusMessage(
      "Thank you! Your message has been sent. Our team will get back to you soon."
    );

    setFullName(payload.full_name);
    setPhone(payload.phone || "");
    setEmail(payload.email);
    setMessage("");
    setIsSending(false);
  }

  return (
    <div className="rounded-[2rem] border border-[#E4D6C0] bg-[#FBF7EF] p-8 shadow-[0_24px_70px_rgba(59,39,22,0.10)]">
      <div className="mb-7">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C28B38] text-white">
          <Send size={24} />
        </div>

        <h2 className="text-4xl font-semibold text-[#3B2716]">
          Send a Message
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#6F675E]">
          Send us your questions about reservations, directions, group dining,
          or special requests.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-[#3B2716]">
              Full Name
            </span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
              placeholder="Juan Dela Cruz"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#3B2716]">
              Phone Number
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
              placeholder="09XX XXX XXXX"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">Message</span>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 w-full resize-none rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder="How can we help?"
          />
        </label>

        {statusMessage && (
          <div className="rounded-xl border border-[#E4D6C0] bg-[#F7F0E4] px-4 py-3 text-sm leading-6 text-[#3B2716]">
            {statusMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSending}
          className="w-full rounded-xl bg-[#C28B38] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#B47E2F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}

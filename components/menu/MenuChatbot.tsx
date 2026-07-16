"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  LoaderCircle,
  MessageCircle,
  Send,
  ShoppingCart,
  X,
} from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

type Message = {
  role: "user" | "model";
  text: string;
  recommendations?: Recommendation[];
};

type Recommendation = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number | null;
  price_options?: { label: string; price: number }[];
  image_url: string | null;
  is_best_seller: boolean;
};

const starterPrompts = [
  "What are your best sellers?",
  "Suggest a meal for four",
  "Build me a meal under ₱1,000",
];

const welcomeMessage: Message = {
  role: "model",
  text: "Kumusta! I’m your menu assistant. Tell me what you’re craving, your budget, or how many people you’re feeding.",
};

export default function MenuChatbot() {
  const { addItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<number[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isOpen, messages, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function sendMessage(text: string) {
    const cleanText = text.trim();
    if (!cleanText || isLoading) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", text: cleanText },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/menu-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message !== welcomeMessage)
            .slice(-10)
            .map(({ role, text: messageText }) => ({
              role,
              text: messageText,
            })),
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        reply?: string;
        recommendations?: Recommendation[];
        error?: string;
      } | null;

      if (!response.ok || !result?.reply) {
        throw new Error(result?.error || "Could not reach the menu assistant.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "model",
          text: result.reply!,
          recommendations: result.recommendations || [],
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "model",
          text:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function addRecommendation(item: Recommendation) {
    if (item.price === null || (item.price_options?.length ?? 0) > 0) return;

    addItem({
      id: item.id,
      line_key: `${item.id}:standard`,
      name: item.name,
      variation: null,
      category: item.category,
      price: Number(item.price),
      image_url: item.image_url,
    });
    setAddedIds((current) => [...new Set([...current, item.id])]);
  }

  return (
    <div className="fixed bottom-5 right-4 z-[80] sm:bottom-7 sm:right-7">
      {isOpen && (
        <section
          aria-label="Kainan sa Tabing Lawa menu assistant"
          className="mb-3 flex h-[min(690px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-[#D7C6A8] bg-[#FBF7EF] shadow-[0_28px_80px_rgba(20,36,24,0.28)] sm:w-[410px]"
        >
          <header className="flex items-center justify-between bg-[#203623] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D7A24A] text-[#203623]">
                <Bot size={21} />
              </div>
              <div>
                <h2 className="font-serif text-xl font-semibold">Ask Benly</h2>
                <p className="flex items-center gap-1.5 text-xs text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-300" />
                  Grounded in today’s live menu
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu assistant"
              className="rounded-full p-2 text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronDown size={21} />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[88%] space-y-3">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "rounded-br-md bg-[#2F4530] text-white"
                        : "rounded-bl-md border border-[#E4D6C0] bg-white text-[#3B2716]"
                    }`}
                  >
                    {message.text}
                  </div>

                  {message.recommendations?.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-[#E4D6C0] bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-serif text-lg font-semibold text-[#3B2716]">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-xs text-[#7A6B5C]">
                            {item.category}
                            {item.is_best_seller ? " · Best seller" : ""}
                          </p>
                        </div>
                        {item.price !== null && (
                          <p className="shrink-0 text-sm font-bold text-[#B57927]">
                            ₱{Number(item.price).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={item.price === null || (item.price_options?.length ?? 0) > 0}
                        onClick={() => addRecommendation(item)}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#EDF1E9] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#2F4530] transition hover:bg-[#DDE7D8] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ShoppingCart size={14} />
                        {(item.price_options?.length ?? 0) > 0
                          ? "Choose size on menu"
                          : item.price === null
                          ? "Price unavailable"
                          : addedIds.includes(item.id)
                            ? "Added — add another"
                            : "Add to cart"}
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="space-y-2 pt-1">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="block w-full rounded-xl border border-[#DCCBB3] bg-[#F7F0E4] px-4 py-2.5 text-left text-xs font-semibold text-[#594531] transition hover:border-[#C28B38] hover:bg-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-[#E4D6C0] bg-white px-4 py-3 text-sm text-[#6F675E]">
                  <LoaderCircle size={16} className="animate-spin text-[#C28B38]" />
                  Checking the live menu…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-[#E4D6C0] bg-white p-3">
            <div className="flex items-center gap-2 rounded-2xl border border-[#D7C6A8] bg-[#FBF7EF] p-1.5 focus-within:border-[#C28B38]">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={700}
                disabled={isLoading}
                placeholder="Ask about dishes, budget, or group size…"
                aria-label="Message the menu assistant"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-[#3B2716] outline-none placeholder:text-[#998B7C]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2F4530] text-white transition hover:bg-[#253727] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={17} />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] leading-4 text-[#8A7D70]">
              AI may make mistakes. Confirm allergies and dietary needs with staff.
            </p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Close menu assistant" : "Open menu assistant"}
        aria-expanded={isOpen}
        className="ml-auto flex h-16 items-center gap-3 rounded-full bg-[#203623] px-5 text-white shadow-[0_16px_45px_rgba(20,36,24,0.35)] transition hover:-translate-y-0.5 hover:bg-[#2F4530]"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={23} />}
        <span className="flex items-center gap-2 text-sm font-bold">

          Ask Benly
        </span>
      </button>
    </div>
  );
}

"use client";

import { CheckCircle2, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

type AddToCartButtonProps = {
  item: {
    id: number;
    name: string;
    category: string;
    price: number | null;
    price_options?: { label: string; price: number }[];
    image_url: string | null;
  };
};

export default function AddToCartButton({ item }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const options = Array.isArray(item.price_options) ? item.price_options : [];
  const selected = options.find((option) => option.label === selectedOption);
  const selectedPrice = selected ? Number(selected.price) : item.price;
  const isDisabled = options.length > 0 ? !selected : selectedPrice === null;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleAddToCart() {
    if (selectedPrice === null || (options.length > 0 && !selected)) return;

    addItem({
      id: item.id,
      line_key: `${item.id}:${selected?.label || "standard"}`,
      name: item.name,
      variation: selected?.label || null,
      category: item.category,
      price: Number(selectedPrice),
      image_url: item.image_url,
    });

    setShowSuccess(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowSuccess(false), 2500);
  }

  return (
    <>
      {options.length > 0 && (
        <fieldset className="mt-5">
          <legend className="text-xs font-bold uppercase tracking-wide text-[#6F675E]">
            Choose size / option
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {options.map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={selectedOption === option.label}
                onClick={() => setSelectedOption(option.label)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  selectedOption === option.label
                    ? "border-[#2F4530] bg-[#E8EFE5] ring-2 ring-[#2F4530]/10"
                    : "border-[#D7C6A8] bg-white hover:border-[#C28B38]"
                }`}
              >
                <span className="block text-sm font-bold text-[#3B2716]">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-[#C28B38]">
                  ₱{Number(option.price).toFixed(2)}
                </span>
              </button>
            ))}
          </div>
          {!selected && (
            <p className="mt-2 text-xs text-[#8B7A65]">
              Select one option to continue.
            </p>
          )}
        </fieldset>
      )}
      <button
        type="button"
        disabled={isDisabled}
        onClick={handleAddToCart}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F4530] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#253727] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {showSuccess ? <CheckCircle2 size={17} /> : <ShoppingCart size={17} />}
        {isDisabled
          ? options.length > 0
            ? "Choose an Option"
            : "Price Unavailable"
          : showSuccess
            ? "Added to Cart"
            : selected
              ? `Add ${selected.label} • ₱${Number(selected.price).toFixed(2)}`
              : selectedPrice !== null
                ? `Add to Cart • ₱${Number(selectedPrice).toFixed(2)}`
                : "Add to Cart"}
      </button>

    </>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function TestimonialReview({ review }: { review: string }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const reviewId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const text = textRef.current;
    if (!text) return;

    const checkOverflow = () => {
      if (!isExpanded) {
        setCanExpand(text.scrollHeight > text.clientHeight + 1);
      }
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(text);

    return () => observer.disconnect();
  }, [isExpanded]);

  return (
    <div className="mt-6">
      <p
        ref={textRef}
        id={reviewId}
        className={`text-base leading-8 text-[#4E4A45] ${
          isExpanded ? "" : "line-clamp-3"
        }`}
      >
        “{review}”
      </p>

      {(canExpand || isExpanded) && (
        <button
          type="button"
          aria-controls={reviewId}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className="mt-3 text-sm font-semibold text-[#9A682A] underline decoration-[#C28B38]/50 underline-offset-4 transition hover:text-[#704717] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C28B38]"
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

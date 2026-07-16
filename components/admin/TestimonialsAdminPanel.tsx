"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Eye, EyeOff, Plus, Save, Star, Trash2, XCircle } from "lucide-react";

type Testimonial = {
  id: number;
  customer_name: string;
  review: string;
  rating: number;
  source: string | null;
  is_approved: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
};

type FormState = {
  customer_name: string;
  review: string;
  rating: string;
  source: string;
  is_approved: boolean;
  is_featured: boolean;
  display_order: string;
};

const emptyForm: FormState = {
  customer_name: "",
  review: "",
  rating: "5",
  source: "Google Reviews",
  is_approved: true,
  is_featured: true,
  display_order: "0",
};

export default function TestimonialsAdminPanel({
  initialTestimonials,
}: {
  initialTestimonials: Testimonial[];
}) {
  const router = useRouter();

  const [testimonials, setTestimonials] =
    useState<Testimonial[]>(initialTestimonials);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function resetForm() {
    setForm(emptyForm);
    setMessage("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    const payload = {
      customer_name: form.customer_name.trim(),
      review: form.review.trim(),
      rating: Number(form.rating),
      source: form.source.trim() || "Website",
      is_approved: form.is_approved,
      is_featured: form.is_featured,
      display_order: Number(form.display_order) || 0,
    };

    if (!payload.customer_name || !payload.review) {
      setMessage("Please enter the customer name and review.");
      setIsSaving(false);
      return;
    }

    if (payload.rating < 1 || payload.rating > 5) {
      setMessage("Rating must be between 1 and 5.");
      setIsSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("testimonials")
      .insert(payload)
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      setIsSaving(false);
      return;
    }

    setTestimonials((prev) => [data as Testimonial, ...prev]);
    setMessage("Review added successfully.");
    resetForm();
    router.refresh();
    setIsSaving(false);
  }

  async function toggleApproved(testimonial: Testimonial) {
    const { data, error } = await supabase
      .from("testimonials")
      .update({ is_approved: !testimonial.is_approved })
      .eq("id", testimonial.id)
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setTestimonials((prev) =>
      prev.map((item) =>
        item.id === testimonial.id ? (data as Testimonial) : item
      )
    );

    router.refresh();
  }

  async function toggleFeatured(testimonial: Testimonial) {
    const { data, error } = await supabase
      .from("testimonials")
      .update({ is_featured: !testimonial.is_featured })
      .eq("id", testimonial.id)
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setTestimonials((prev) =>
      prev.map((item) =>
        item.id === testimonial.id ? (data as Testimonial) : item
      )
    );

    router.refresh();
  }

  async function deleteTestimonial(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) return;

    const { error } = await supabase.from("testimonials").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTestimonials((prev) => prev.filter((item) => item.id !== id));
    setMessage("Review deleted successfully.");
    router.refresh();
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
      <form
        onSubmit={handleSubmit}
        className="h-fit rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 shadow-[0_18px_45px_rgba(59,39,22,0.08)]"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-[#3B2716]">
              Add Review
            </h2>
            <p className="mt-1 text-sm text-[#6F675E]">
              Use this for Google reviews while customer review submission is
              not yet available.
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2F4530] text-white">
            <Plus size={18} />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-[#3B2716]">
              Customer Name
            </span>
            <input
              value={form.customer_name}
              onChange={(e) =>
                setForm({ ...form, customer_name: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
              placeholder="Maria C."
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#3B2716]">
              Review
            </span>
            <textarea
              value={form.review}
              onChange={(e) => setForm({ ...form, review: e.target.value })}
              rows={5}
              className="mt-2 w-full resize-none rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
              placeholder="Paste the review here..."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-[#3B2716]">
                Rating
              </span>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
              >
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#3B2716]">
                Source
              </span>
              <input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
                placeholder="Google Reviews"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-[#3B2716]">
              Display Order
            </span>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) =>
                setForm({ ...form, display_order: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
              placeholder="1"
            />
          </label>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm font-semibold text-[#3B2716]">
              <input
                type="checkbox"
                checked={form.is_approved}
                onChange={(e) =>
                  setForm({ ...form, is_approved: e.target.checked })
                }
              />
              Approved
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm font-semibold text-[#3B2716]">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) =>
                  setForm({ ...form, is_featured: e.target.checked })
                }
              />
              Featured
            </label>
          </div>

          {message && (
            <div className="rounded-xl border border-[#E4D6C0] bg-[#F7F0E4] px-4 py-3 text-sm text-[#3B2716]">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#C28B38] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#B47E2F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />
            {isSaving ? "Saving..." : "Add Review"}
          </button>
        </div>
      </form>

      <div className="rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 shadow-[0_18px_45px_rgba(59,39,22,0.08)]">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-[#3B2716]">
            Reviews
          </h2>
          <p className="mt-1 text-sm text-[#6F675E]">
            Approved verified-order testimonials can appear automatically.
            Other reviews must also be marked as featured.
          </p>
        </div>

        <div className="space-y-4">
          {testimonials.length > 0 ? (
            testimonials.map((testimonial) => (
              <article
                key={testimonial.id}
                className="rounded-2xl border border-[#E4D6C0] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-2xl font-semibold text-[#3B2716]">
                        {testimonial.customer_name}
                      </h3>

                      {testimonial.is_approved ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700">
                          Approved
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-700">
                          Pending
                        </span>
                      )}

                      {testimonial.is_featured && (
                        <span className="rounded-full bg-[#C28B38]/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#A46F22]">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex gap-1 text-[#C28B38]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          size={16}
                          className={
                            index < testimonial.rating
                              ? "fill-current"
                              : "opacity-25"
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <p className="rounded-full bg-[#F7F0E4] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6F675E]">
                    {testimonial.source || "Website"}
                  </p>
                </div>

                <p className="mt-4 text-sm leading-7 text-[#6F675E]">
                  “{testimonial.review}”
                </p>

                <p className="mt-3 text-xs uppercase tracking-wide text-[#9A8B7A]">
                  Display Order: {testimonial.display_order}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleApproved(testimonial)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E4D6C0] px-4 py-2 text-sm font-semibold text-[#3B2716] transition hover:bg-[#F7F0E4]"
                  >
                    {testimonial.is_approved ? (
                      <>
                        <XCircle size={16} />
                        Unapprove
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Approve
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFeatured(testimonial)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E4D6C0] px-4 py-2 text-sm font-semibold text-[#3B2716] transition hover:bg-[#F7F0E4]"
                  >
                    {testimonial.is_featured ? (
                      <>
                        <EyeOff size={16} />
                        Unfeature
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        Feature
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTestimonial(testimonial.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D7C6A8] bg-[#F7F0E4] p-8 text-center">
              <h3 className="text-2xl font-semibold text-[#3B2716]">
                No reviews yet
              </h3>
              <p className="mt-2 text-sm text-[#6F675E]">
                Add your first Google review using the form on the left.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

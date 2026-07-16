import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import TestimonialsAdminPanel from "@/components/admin/TestimonialsAdminPanel";

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

async function getTestimonials() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching testimonials:", error.message);
    return [];
  }

  return data as Testimonial[];
}

export default async function AdminTestimonialsPage() {
  await requireAdmin();

  const testimonials = await getTestimonials();

  return (
    <AdminShell>
      <section>
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
            Admin Dashboard
          </p>

          <h1 className="mt-3 text-5xl font-semibold text-[#3B2716]">
            Manage Reviews
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6F675E]">
            Add Google reviews for now, approve customer testimonials, and
            choose which reviews appear on the homepage.
          </p>
        </div>

        <TestimonialsAdminPanel initialTestimonials={testimonials} />
      </section>
    </AdminShell>
  );
}

import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase";
import MenuAdminPanel from "@/components/admin/MenuAdminPanel";
import { requireAdmin } from "@/lib/auth";

type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number | null;
  serving_note: string | null;
  inclusions: string | null;
  price_options: { label: string; price: number }[];
  image_url: string | null;
  is_signature: boolean;
  is_best_seller: boolean;
  is_available: boolean;
  display_order: number;
};

async function getMenuItems() {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching menu items:", error.message);
    return [];
  }

  return data as MenuItem[];
}

export default async function AdminMenuPage() {
  const [, menuItems] = await Promise.all([requireAdmin(), getMenuItems()]);

  return (
    <AdminShell>
      <section>
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
            Admin Dashboard
          </p>

          <h1 className="mt-3 text-5xl font-semibold text-[#3B2716]">
            Manage Menu
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6F675E]">
            Add, edit, hide, and mark best-selling dishes. Items marked as best
            sellers will automatically appear on the homepage.
          </p>
        </div>

        <MenuAdminPanel initialItems={menuItems} />
      </section>
    </AdminShell>
  );
}

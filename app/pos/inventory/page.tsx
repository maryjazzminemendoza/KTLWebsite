import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import InventoryManager from "@/components/pos/InventoryManager";

export default async function InventoryPage() {
  const { profile } = await requireStaff();
  const supabase = await createSupabaseServerClient();
  const [stock, movements, menu, recipes] = await Promise.all([
    supabase.from("inventory_items").select("*").eq("is_active", true).order("name"),
    supabase.from("inventory_movements").select("id, inventory_item_id, movement_type, quantity_change, quantity_after, reason, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("menu_items").select("id, name").order("name"),
    supabase.from("menu_item_ingredients").select("menu_item_id, inventory_item_id, quantity_required"),
  ]);
  return <InventoryManager cashierName={profile.full_name || "Staff"} isAdmin={profile.role === "admin"} initialItems={stock.data || []} movements={movements.data || []} menuItems={menu.data || []} recipes={recipes.data || []}/>;
}

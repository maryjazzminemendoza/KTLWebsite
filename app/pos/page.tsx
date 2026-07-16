import { requireStaff } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import PosRegister from "@/components/pos/PosRegister";

export default async function PosPage() {
  const [{ profile }, { data, error }] = await Promise.all([
    requireStaff(),
    supabase.from("menu_items")
      .select("id, name, category, price, price_options, is_available")
      .eq("is_available", true)
      .order("category").order("display_order"),
  ]);

  return <PosRegister cashierName={profile.full_name || "Staff"} initialItems={error ? [] : data || []} />;
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function getAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? supabase : null;
}

export async function POST(request: Request) {
  const supabase = await getAdmin();
  if (!supabase) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  if (body.action === "create") {
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Item name is required." }, { status: 400 });
    const opening = Number(body.quantity || 0);
    const { data, error } = await supabase.from("inventory_items").insert({
      name, sku: String(body.sku || "").trim() || null, unit: String(body.unit || "piece"),
      quantity: 0, reorder_level: Number(body.reorderLevel || 0), unit_cost: Number(body.unitCost || 0),
      supplier: String(body.supplier || "").trim() || null,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (opening > 0) {
      const { error: stockError } = await supabase.rpc("adjust_inventory", { stock_item_id: data.id, quantity_delta: opening, movement_kind: "opening", movement_reason: "Opening stock" });
      if (stockError) return NextResponse.json({ error: stockError.message }, { status: 400 });
    }
    return NextResponse.json({ item: data });
  }

  if (body.action === "adjust") {
    const { data, error } = await supabase.rpc("adjust_inventory", {
      stock_item_id: Number(body.id), quantity_delta: Number(body.delta), movement_kind: String(body.kind || "adjustment"), movement_reason: String(body.reason || "") || null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ item: data });
  }

  if (body.action === "recipe") {
    const menuItemId = Number(body.menuItemId); const inventoryItemId = Number(body.inventoryItemId); const required = Number(body.required);
    if (!menuItemId || !inventoryItemId || required <= 0) return NextResponse.json({ error: "Choose a dish, stock item, and valid usage amount." }, { status: 400 });
    const { data, error } = await supabase.from("menu_item_ingredients").upsert({ menu_item_id: menuItemId, inventory_item_id: inventoryItemId, quantity_required: required }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ recipe: data });
  }

  return NextResponse.json({ error: "Unknown inventory action." }, { status: 400 });
}

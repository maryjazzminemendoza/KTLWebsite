"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, PackagePlus, RefreshCw } from "lucide-react";
import PosNav from "./PosNav";

type Stock = { id: number; name: string; sku: string | null; unit: string; quantity: number; reorder_level: number; unit_cost: number; supplier: string | null };
type Movement = { id: number; inventory_item_id: number; movement_type: string; quantity_change: number; quantity_after: number; reason: string | null; created_at: string };
type Menu = { id: number; name: string };
type Recipe = { menu_item_id: number; inventory_item_id: number; quantity_required: number };
const n = (value: number) => Number(value).toLocaleString("en-PH", { maximumFractionDigits: 3 });
const peso = (value: number) => `₱${Number(value).toFixed(2)}`;

export default function InventoryManager({ cashierName, isAdmin, initialItems, movements, menuItems, recipes }: { cashierName: string; isAdmin: boolean; initialItems: Stock[]; movements: Movement[]; menuItems: Menu[]; recipes: Recipe[] }) {
  const [items] = useState(initialItems); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const low = items.filter(i => Number(i.quantity) <= Number(i.reorder_level));
  const inventoryValue = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_cost), 0);
  const names = useMemo(() => new Map(items.map(i => [i.id, i.name])), [items]);

  async function send(payload: Record<string, unknown>) {
    setBusy(true); setNotice("");
    const response = await fetch("/api/pos/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) { setNotice(result.error || "Unable to update inventory."); return false; }
    window.location.reload(); return true;
  }
  function create(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const fd = new FormData(e.currentTarget); void send({ action: "create", name: fd.get("name"), sku: fd.get("sku"), unit: fd.get("unit"), quantity: fd.get("quantity"), reorderLevel: fd.get("reorder"), unitCost: fd.get("cost"), supplier: fd.get("supplier") }); }
  function adjust(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const fd = new FormData(e.currentTarget); const direction = fd.get("direction") === "out" ? -1 : 1; void send({ action: "adjust", id: fd.get("id"), delta: Number(fd.get("amount")) * direction, kind: fd.get("kind"), reason: fd.get("reason") }); }
  function recipe(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const fd = new FormData(e.currentTarget); void send({ action: "recipe", menuItemId: fd.get("menu"), inventoryItemId: fd.get("stock"), required: fd.get("required") }); }

  return <main className="min-h-screen bg-[#F2EDE4] text-[#3B2716]">
    <header className="flex flex-wrap items-center justify-between gap-3 bg-[#2F4530] px-4 py-3 text-white md:px-8"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#D7A24A]">Kainan sa Tabing Lawa</p><h1 className="text-2xl font-semibold">Inventory</h1></div><PosNav active="inventory"/><p className="text-sm text-white/70">{cashierName}</p></header>
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <section className="grid gap-3 sm:grid-cols-3"><Stat label="Stock items" value={String(items.length)}/><Stat label="Low or out of stock" value={String(low.length)} warning={low.length > 0}/><Stat label="Inventory value" value={peso(inventoryValue)}/></section>
      {notice && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{notice}</p>}
      {low.length > 0 && <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4"><h2 className="flex items-center gap-2 font-bold text-amber-900"><AlertTriangle size={18}/> Reorder needed</h2><p className="mt-2 text-sm text-amber-800">{low.map(i => `${i.name} (${n(i.quantity)} ${i.unit})`).join(" · ")}</p></section>}
      <section className="overflow-hidden rounded-2xl border border-[#DED2BF] bg-white"><div className="border-b border-[#DED2BF] p-4"><h2 className="text-2xl font-semibold">Current stock</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[#F7F0E4] text-xs uppercase text-[#74685C]"><tr><th className="p-3">Item</th><th>On hand</th><th>Reorder at</th><th>Unit cost</th><th>Supplier</th><th>Status</th></tr></thead><tbody>{items.map(item => { const isLow = Number(item.quantity) <= Number(item.reorder_level); return <tr key={item.id} className="border-t border-[#EEE5D7]"><td className="p-3 font-bold">{item.name}<small className="block font-normal text-[#8B8175]">{item.sku || "No SKU"}</small></td><td className="font-bold">{n(item.quantity)} {item.unit}</td><td>{n(item.reorder_level)} {item.unit}</td><td>{peso(item.unit_cost)}</td><td>{item.supplier || "—"}</td><td><span className={`rounded-full px-2 py-1 text-xs font-bold ${isLow ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{Number(item.quantity) === 0 ? "Out" : isLow ? "Low" : "Healthy"}</span></td></tr>})}</tbody></table></div></section>
      {isAdmin && <section className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={create} className="space-y-3 rounded-2xl border border-[#DED2BF] bg-white p-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><PackagePlus size={20}/> Add stock item</h2><Input name="name" placeholder="Item name" required/><div className="grid grid-cols-2 gap-2"><Input name="sku" placeholder="SKU"/><Input name="unit" placeholder="Unit (kg, pc, L)" required/></div><div className="grid grid-cols-3 gap-2"><Input name="quantity" type="number" step="0.001" placeholder="Opening"/><Input name="reorder" type="number" step="0.001" placeholder="Reorder"/><Input name="cost" type="number" step="0.01" placeholder="Cost"/></div><Input name="supplier" placeholder="Supplier"/><Submit busy={busy} label="Add item"/></form>
        <form onSubmit={adjust} className="space-y-3 rounded-2xl border border-[#DED2BF] bg-white p-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><RefreshCw size={20}/> Receive or adjust</h2><Select name="id" required>{items.map(i => <option key={i.id} value={i.id}>{i.name} · {n(i.quantity)} {i.unit}</option>)}</Select><div className="grid grid-cols-2 gap-2"><Select name="direction"><option value="in">Stock in</option><option value="out">Stock out</option></Select><Input name="amount" type="number" min="0.001" step="0.001" placeholder="Quantity" required/></div><Select name="kind"><option value="purchase">Purchase / delivery</option><option value="waste">Waste / spoilage</option><option value="adjustment">Count correction</option></Select><Input name="reason" placeholder="Reference or reason" required/><Submit busy={busy} label="Save movement"/></form>
        <form onSubmit={recipe} className="space-y-3 rounded-2xl border border-[#DED2BF] bg-white p-5"><h2 className="text-xl font-semibold">Recipe usage</h2><p className="text-xs text-[#74685C]">Set how much stock one serving consumes. Checkout deducts it automatically.</p><Select name="menu">{menuItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</Select><Select name="stock">{items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}</Select><Input name="required" type="number" min="0.001" step="0.001" placeholder="Used per serving" required/><Submit busy={busy} label="Save recipe link"/><p className="text-xs text-[#74685C]">{recipes.length} recipe links configured.</p></form>
      </section>}
      <section className="rounded-2xl border border-[#DED2BF] bg-white p-5"><h2 className="text-2xl font-semibold">Recent stock ledger</h2><div className="mt-4 space-y-2">{movements.length ? movements.map(m => <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EEE5D7] py-3 text-sm"><div className="flex items-center gap-2">{Number(m.quantity_change) > 0 ? <ArrowUp className="text-emerald-600" size={17}/> : <ArrowDown className="text-red-600" size={17}/>}<b>{names.get(m.inventory_item_id) || `Item #${m.inventory_item_id}`}</b><span className="text-[#74685C]">{m.movement_type} · {m.reason || "No note"}</span></div><div className="text-right"><b className={Number(m.quantity_change) > 0 ? "text-emerald-700" : "text-red-700"}>{Number(m.quantity_change) > 0 ? "+" : ""}{n(m.quantity_change)}</b><small className="ml-3 text-[#8B8175]">{new Date(m.created_at).toLocaleString("en-PH")}</small></div></div>) : <p className="text-sm text-[#74685C]">No stock movements yet.</p>}</div></section>
    </div>
  </main>;
}
function Stat({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) { return <div className={`rounded-2xl border p-5 ${warning ? "border-amber-300 bg-amber-50" : "border-[#DED2BF] bg-white"}`}><p className="text-xs font-bold uppercase tracking-wider text-[#8B8175]">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>; }
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className="w-full rounded-xl border border-[#DED2BF] bg-white px-3 py-3 text-sm outline-none focus:border-[#C28B38]"/>; }
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className="w-full rounded-xl border border-[#DED2BF] bg-white px-3 py-3 text-sm outline-none focus:border-[#C28B38]"/>; }
function Submit({ busy, label }: { busy: boolean; label: string }) { return <button disabled={busy} className="w-full rounded-xl bg-[#2F4530] px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : label}</button>; }

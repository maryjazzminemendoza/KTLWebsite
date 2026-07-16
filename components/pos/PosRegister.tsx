"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, Minus, Plus, Search, ShoppingCart, Trash2, Utensils, CheckCircle2, LogOut, ScanLine, UserRound, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PosNav from "./PosNav";

type PriceOption = { label: string; price: number };
type MenuItem = { id: number; name: string; category: string; price: number | null; price_options: PriceOption[]; is_available: boolean };
type CartItem = { key: string; menu_item_id: number; name: string; variation: string | null; price: number; quantity: number };
type Sale = { order_id: number; receipt_number: string; subtotal: number; discount: number; total: number; change: number };
type LoyaltyCustomer = { customer_id: string; full_name: string | null; completed_visits: number; next_visit_number: number; reward_due: boolean };
type PrintedReceipt = Sale & { items: CartItem[]; cashier: string; orderType: string; paymentMethod: string; amountReceived: number; notes: string; customerName: string | null; completedAt: Date };

const money = (value: number) => `₱${Number(value).toFixed(2)}`;

export default function PosRegister({ initialItems, cashierName }: { initialItems: MenuItem[]; cashierName: string }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState("dine_in");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [notes, setNotes] = useState("");
  const [loyaltyCode, setLoyaltyCode] = useState("");
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<LoyaltyCustomer | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControls = useRef<IScannerControls | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [sale, setSale] = useState<Sale | null>(null);
  const [printedReceipt, setPrintedReceipt] = useState<PrintedReceipt | null>(null);
  const [clearArmed, setClearArmed] = useState(false);

  const categories = useMemo(() => ["All", ...new Set(initialItems.map(i => i.category))], [initialItems]);
  const visibleItems = initialItems.filter(item =>
    (category === "All" || item.category === category) && item.name.toLowerCase().includes(search.toLowerCase()));
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const estimatedDiscount = orderType === "dine_in" && loyaltyCustomer?.reward_due ? subtotal * 0.1 : 0;
  const estimatedTotal = subtotal - estimatedDiscount;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cashChange = paymentMethod === "cash" && Number(amountReceived) >= estimatedTotal ? Number(amountReceived) - estimatedTotal : 0;
  const quickCash = [...new Set([estimatedTotal, 500, 1000].filter(value => value >= estimatedTotal))];

  useEffect(() => () => scannerControls.current?.stop(), []);

  async function lookupLoyalty(rawCode: string) {
    scannerControls.current?.stop(); setScanning(false); setMessage("");
    const response = await fetch("/api/pos/loyalty", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: rawCode }) });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error || "Could not read this loyalty QR.");
    setLoyaltyCode(result.code); setLoyaltyCustomer(result.customer); setScannerOpen(false);
  }

  async function startScanner() {
    setMessage(""); setScanning(true);
    try {
      const reader = new BrowserQRCodeReader();
      scannerControls.current = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } } }, videoRef.current!, result => {
        if (result) void lookupLoyalty(result.getText());
      });
    } catch (error) {
      setScanning(false);
      setMessage(error instanceof Error ? `Camera unavailable: ${error.message}` : "Camera unavailable.");
    }
  }

  function removeLoyalty() { setLoyaltyCode(""); setLoyaltyCustomer(null); }

  function add(item: MenuItem, option?: PriceOption) {
    if (item.price_options?.length && !option) return;
    const variation = option?.label || null;
    const price = Number(option?.price ?? item.price);
    const key = `${item.id}:${variation || "base"}`;
    setSale(null);
    setClearArmed(false);
    setCart(current => {
      const found = current.find(entry => entry.key === key);
      return found
        ? current.map(entry => entry.key === key ? { ...entry, quantity: entry.quantity + 1 } : entry)
        : [...current, { key, menu_item_id: item.id, name: item.name, variation, price, quantity: 1 }];
    });
  }

  function quantity(key: string, amount: number) {
    setClearArmed(false);
    setCart(current => current.map(item => item.key === key ? { ...item, quantity: item.quantity + amount } : item).filter(item => item.quantity > 0));
  }

  function quantityInCart(menuItemId: number, variation: string | null = null) {
    return cart.find(item => item.menu_item_id === menuItemId && item.variation === variation)?.quantity || 0;
  }

  function clearCartSafely() {
    if (!clearArmed) { setClearArmed(true); return; }
    setCart([]); setClearArmed(false); setAmountReceived(""); setMessage("");
  }

  function choosePayment(value: string) {
    setPaymentMethod(value);
    setAmountReceived("");
    setMessage("");
  }

  function chooseOrderType(value: string) {
    setOrderType(value);
    setMessage("");
  }

  async function completeSale() {
    setMessage(""); setSale(null);
    if (!cart.length) return setMessage("Add at least one menu item.");
    if (paymentMethod === "cash" && Number(amountReceived) < estimatedTotal) return setMessage("Cash received is less than the total.");
    setSaving(true);
    const response = await fetch("/api/pos/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      items: cart.map(({ menu_item_id, variation, quantity }) => ({ menu_item_id, variation, quantity })),
      orderType, paymentMethod, amountReceived: paymentMethod === "cash" ? Number(amountReceived) : null,
      notes, loyaltyCode: loyaltyCode.trim().replace(/^kainan-loyalty:/, "") || null,
    }) });
    const result = await response.json(); setSaving(false);
    if (!response.ok) return setMessage(result.error || "Unable to complete the sale.");
    const completedSale = result.sale as Sale;
    setSale(completedSale);
    setPrintedReceipt({ ...completedSale, items: cart.map(item => ({ ...item })), cashier: cashierName,
      orderType, paymentMethod, amountReceived: paymentMethod === "cash" ? Number(amountReceived) : completedSale.total,
      notes, customerName: loyaltyCustomer?.full_name || null, completedAt: new Date() });
    setCart([]); setAmountReceived(""); setNotes(""); removeLoyalty();
  }

  async function signOut() { await supabase.auth.signOut(); window.location.replace("/login"); }

  return <main className="pos-register min-h-screen bg-[#F2EDE4] text-[#3B2716]">
    <header className="flex flex-wrap items-center justify-between gap-3 bg-[#2F4530] px-4 py-3 text-white md:px-5 md:py-4 xl:px-8">
      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#D7A24A]">Kainan sa Tabing Lawa</p><h1 className="text-2xl font-semibold">Staff POS</h1></div>
      <PosNav active="register"/>
      <div className="flex items-center gap-4"><span className="hidden text-sm text-white/75 lg:inline">Cashier: <b className="text-white">{cashierName}</b></span><button onClick={signOut} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"><LogOut size={16}/> <span className="hidden sm:inline">Sign out</span></button></div>
    </header>

    <div className="grid min-h-[calc(100vh-76px)] md:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="min-w-0 p-4 md:p-5 xl:p-8">
        <div className="relative"><Search className="absolute left-4 top-3.5 text-[#8B8175]" size={20}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search the menu" className="w-full rounded-2xl border border-[#DED2BF] bg-white py-3 pl-12 pr-4 outline-none focus:border-[#C28B38]"/></div>
        <div className="sticky top-0 z-20 -mx-4 my-4 flex gap-2 overflow-x-auto bg-[#F2EDE4]/95 px-4 py-3 backdrop-blur md:-mx-5 md:px-5 xl:-mx-8 xl:px-8">{categories.map(value => <button key={value} onClick={() => setCategory(value)} className={`min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${category === value ? "bg-[#C28B38] text-white" : "bg-white text-[#66594C]"}`}>{value}</button>)}</div>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3 xl:gap-4">{visibleItems.map(item => <article key={item.id} className="rounded-2xl border border-[#DED2BF] bg-white p-4 shadow-sm xl:p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#A46F22]">{item.category}</p><h2 className="mt-2 text-xl font-semibold">{item.name}</h2>
          {item.price_options?.length ? <div className="mt-4 grid gap-2">{item.price_options.map(option => { const added = quantityInCart(item.id, option.label); return <button key={option.label} onClick={() => add(item, option)} className={`flex justify-between rounded-xl px-3 py-2 text-sm font-bold ${added ? "bg-[#2F4530] text-white" : "bg-[#EDF1E9] text-[#2F4530] hover:bg-[#DCE6D6]"}`}><span>{option.label}{added ? ` · ${added} added` : ""}</span><span>{money(option.price)}</span></button>; })}</div>
          : <button onClick={() => add(item)} className={`mt-4 flex w-full items-center justify-between rounded-xl px-3 py-3 font-bold ${quantityInCart(item.id) ? "bg-[#2F4530] text-white" : "bg-[#EDF1E9] text-[#2F4530] hover:bg-[#DCE6D6]"}`}><span>{quantityInCart(item.id) ? `${quantityInCart(item.id)} added` : "Add"}</span><span>{money(Number(item.price))}</span></button>}
        </article>)}</div>
      </section>

      <aside className="border-t border-[#DED2BF] bg-[#FBF7EF] p-4 md:sticky md:top-0 md:h-screen md:overflow-y-auto md:border-l md:border-t-0 md:p-4 xl:p-6">
        <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-xl font-semibold xl:text-2xl"><ShoppingCart size={22}/> Current order <span className="rounded-full bg-[#2F4530] px-2 py-1 font-sans text-xs text-white">{itemCount}</span></h2><button onClick={clearCartSafely} disabled={!cart.length} className={`min-h-11 rounded-lg px-2 text-xs font-bold uppercase disabled:opacity-30 ${clearArmed ? "bg-red-600 text-white" : "text-red-700"}`}>{clearArmed ? "Confirm clear" : "Clear"}</button></div>
        <div className="mt-3 max-h-[30vh] space-y-2 overflow-y-auto overscroll-contain pr-1 xl:mt-5 xl:max-h-[34vh] xl:space-y-3">{cart.length ? cart.map(item => <div key={item.key} className="rounded-xl border border-[#E4D6C0] bg-white p-3"><div className="flex justify-between gap-3"><div><b>{item.name}</b>{item.variation && <p className="text-xs text-[#7A6D60]">{item.variation}</p>}</div><button onClick={() => quantity(item.key, -item.quantity)} aria-label="Remove item" className="flex min-h-11 min-w-11 items-center justify-center"><Trash2 size={17} className="text-red-600"/></button></div><div className="mt-2 flex items-center justify-between"><div className="flex items-center gap-2"><button onClick={() => quantity(item.key, -1)} aria-label={`Decrease ${item.name}`} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-[#EFE8DD]"><Minus size={16}/></button><b className="min-w-5 text-center">{item.quantity}</b><button onClick={() => quantity(item.key, 1)} aria-label={`Increase ${item.name}`} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-[#EFE8DD]"><Plus size={16}/></button></div><b>{money(item.price * item.quantity)}</b></div></div>) : <div className="py-8 text-center text-sm text-[#817568]"><Utensils className="mx-auto mb-3"/>Select dishes to begin.</div>}</div>
        <div className="mt-5 space-y-3 border-t border-[#DED2BF] pt-5">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          {estimatedDiscount > 0 && <div className="flex justify-between text-sm font-bold text-emerald-700"><span>Loyalty reward (10%)</span><span>−{money(estimatedDiscount)}</span></div>}
          <div className="flex justify-between text-xl font-bold"><span>Total</span><span>{money(estimatedTotal)}</span></div>
          <div className="grid grid-cols-3 gap-2">{[["dine_in","Dine in"],["pickup","Takeaway"],["delivery","Delivery"]].map(([value,label]) => <button key={value} onClick={() => chooseOrderType(value)} className={`rounded-xl px-2 py-2 text-xs font-bold ${orderType === value ? "bg-[#2F4530] text-white" : "bg-[#EFE8DD]"}`}>{label}</button>)}</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Order notes (optional)" className="w-full rounded-xl border border-[#DED2BF] bg-white px-3 py-2 text-sm outline-none"/>
          {loyaltyCustomer ? <div className="rounded-xl border border-[#BED3B7] bg-[#EDF1E9] p-3"><div className="flex items-start justify-between"><div className="flex gap-2"><UserRound size={19}/><div><p className="text-sm font-bold">{loyaltyCustomer.full_name || "Customer account"}</p><p className="text-xs text-[#53654C]">{orderType === "dine_in" ? `Visit ${loyaltyCustomer.next_visit_number} of 5${loyaltyCustomer.reward_due ? " · 10% reward applies" : ""}` : "Account linked · Order will appear in My Orders"}</p></div></div><button onClick={removeLoyalty} aria-label="Remove customer account"><X size={17}/></button></div></div> : <div className="space-y-2"><button onClick={() => setScannerOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2F4530] px-3 py-3 text-sm font-bold text-[#2F4530]"><ScanLine size={18}/> Scan customer QR</button>{orderType !== "dine_in" && <p className="text-xs text-[#66594C]">Link the customer so this {orderType === "delivery" ? "delivery" : "takeaway"} order appears in her account. Loyalty rewards remain dine-in only.</p>}</div>}
          <div className="grid grid-cols-3 gap-2">{["cash","gcash","card"].map(value => <button key={value} onClick={() => choosePayment(value)} aria-pressed={paymentMethod === value} className={`rounded-xl px-2 py-2 text-xs font-bold uppercase ${paymentMethod === value ? "bg-[#C28B38] text-white ring-2 ring-[#8B5D1D] ring-offset-1" : "bg-[#EFE8DD]"}`}>{value}</button>)}</div>
          {paymentMethod === "cash" && <div className="space-y-2"><label className="block text-xs font-bold uppercase tracking-wide text-[#74685C]">Cash received</label><input autoComplete="off" inputMode="decimal" type="number" min="0" step="0.01" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} placeholder="₱0.00" className="w-full rounded-xl border border-[#DED2BF] bg-white px-3 py-3 text-lg font-bold outline-none focus:border-[#C28B38]"/><div className="grid grid-cols-3 gap-2">{quickCash.map((value, index) => <button key={value} onClick={() => setAmountReceived(String(value))} className="rounded-lg bg-[#EFE8DD] px-2 py-2 text-xs font-bold">{index === 0 ? "Exact" : money(value)}</button>)}</div>{Number(amountReceived) >= estimatedTotal && <div className="flex justify-between rounded-xl bg-[#EDF1E9] px-3 py-2 font-bold text-[#2F4530]"><span>Change</span><span>{money(cashChange)}</span></div>}</div>}
          {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
          <button onClick={completeSale} disabled={saving || !cart.length || (paymentMethod === "cash" && Number(amountReceived) < estimatedTotal)} className="w-full rounded-xl bg-[#C28B38] px-4 py-4 font-bold uppercase tracking-wide text-white shadow-[0_12px_25px_rgba(194,139,56,.25)] disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Processing payment…" : `Charge ${money(estimatedTotal)}`}</button>
        </div>
      </aside>
    </div>
    {printedReceipt && <section id="thermal-receipt" className="thermal-receipt" aria-label="Sales receipt">
      <div className="receipt-center">
        <p className="receipt-brand">KAINAN SA TABING LAWA</p>
        <p>Restaurant Sales Receipt</p>
        <p>Rizal, Philippines</p>
      </div>
      <div className="receipt-rule" />
      <div className="receipt-meta">
        <p><span>Receipt</span><b>{printedReceipt.receipt_number}</b></p>
        <p><span>Order</span><b>#{printedReceipt.order_id}</b></p>
        <p><span>Date</span><b>{printedReceipt.completedAt.toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" })}</b></p>
        <p><span>Cashier</span><b>{printedReceipt.cashier}</b></p>
        <p><span>Type</span><b>{printedReceipt.orderType.replace("_", " ").toUpperCase()}</b></p>
        {printedReceipt.customerName && <p><span>Customer</span><b>{printedReceipt.customerName}</b></p>}
      </div>
      <div className="receipt-rule" />
      <div className="receipt-items">
        {printedReceipt.items.map(item => <div key={item.key} className="receipt-item">
          <p>{item.quantity} x {item.name}{item.variation ? ` (${item.variation})` : ""}</p>
          <p className="receipt-item-price"><span>{money(item.price)} ea</span><b>{money(item.price * item.quantity)}</b></p>
        </div>)}
      </div>
      <div className="receipt-rule" />
      <div className="receipt-totals">
        <p><span>Subtotal</span><span>{money(printedReceipt.subtotal)}</span></p>
        {printedReceipt.discount > 0 && <p><span>Loyalty discount</span><span>-{money(printedReceipt.discount)}</span></p>}
        <p className="receipt-grand-total"><span>TOTAL</span><span>{money(printedReceipt.total)}</span></p>
        <p><span>{printedReceipt.paymentMethod.toUpperCase()}</span><span>{money(printedReceipt.amountReceived)}</span></p>
        {printedReceipt.paymentMethod === "cash" && <p><span>Change</span><span>{money(printedReceipt.change)}</span></p>}
      </div>
      {printedReceipt.notes && <><div className="receipt-rule" /><p><b>Notes:</b> {printedReceipt.notes}</p></>}
      <div className="receipt-rule" />
      <div className="receipt-center receipt-footer"><p>Thank you for dining with us!</p><p>Please keep this receipt for reference.</p><p className="receipt-reference">{printedReceipt.receipt_number}</p></div>
    </section>}
    {sale && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"><div role="dialog" aria-modal="true" aria-labelledby="sale-complete-title" className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={34}/></div><p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-emerald-700">Payment successful</p><h2 id="sale-complete-title" className="mt-2 text-3xl font-semibold">Sale completed</h2><p className="mt-2 text-sm text-[#74685C]">{sale.receipt_number}</p>{printedReceipt?.paymentMethod === "cash" && <div className="my-6 rounded-2xl bg-[#EDF1E9] p-5"><p className="text-xs font-bold uppercase tracking-wide text-[#53654C]">Change due</p><p className="mt-1 text-4xl font-bold text-[#2F4530]">{money(sale.change)}</p></div>}<div className="mt-6 grid grid-cols-2 gap-3"><button onClick={() => window.print()} className="rounded-xl border border-[#2F4530] px-4 py-3 font-bold text-[#2F4530]">Print receipt</button><button onClick={() => { setSale(null); setPrintedReceipt(null); setMessage(""); }} className="rounded-xl bg-[#C28B38] px-4 py-3 font-bold text-white">New order</button></div></div></div>}
    {scannerOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">Scan customer QR</h2><button onClick={() => { scannerControls.current?.stop(); setScannerOpen(false); setScanning(false); }} aria-label="Close scanner"><X/></button></div><div className="mt-4 overflow-hidden rounded-2xl bg-[#17251A]"><video ref={videoRef} muted playsInline className={`aspect-video w-full object-cover ${scanning ? "block" : "hidden"}`}/>{!scanning && <div className="flex aspect-video flex-col items-center justify-center text-white/70"><ScanLine size={48}/><p className="mt-3 text-sm">Position the QR code inside the camera view.</p></div>}</div><button onClick={scanning ? () => { scannerControls.current?.stop(); setScanning(false); } : startScanner} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F4530] py-3 font-bold text-white"><Camera size={19}/>{scanning ? "Stop camera" : "Start camera"}</button><form onSubmit={e => { e.preventDefault(); void lookupLoyalty(loyaltyCode); }} className="mt-4 flex gap-2"><input value={loyaltyCode} onChange={e => setLoyaltyCode(e.target.value)} placeholder="Or paste QR value" className="min-w-0 flex-1 rounded-xl border border-[#DED2BF] px-3 py-3 text-sm outline-none"/><button className="rounded-xl bg-[#C28B38] px-5 font-bold text-white">Find</button></form></div></div>}
  </main>;
}

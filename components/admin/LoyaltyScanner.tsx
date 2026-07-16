"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Camera, CheckCircle2, RefreshCw, ScanLine, UserRound } from "lucide-react";

type Customer = { customer_id: string; full_name: string | null; completed_visits: number; next_visit_number: number; reward_due: boolean };

export default function LoyaltyScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [receipt, setReceipt] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => controlsRef.current?.stop(), []);

  async function lookup(value: string) {
    controlsRef.current?.stop(); setScanning(false); setBusy(true); setMessage("");
    const response = await fetch("/api/admin/loyalty", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "lookup", code: value }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error || "Could not read this QR."); setBusy(false); return; }
    setCode(value); setCustomer(result.customer); setBusy(false);
  }

  async function startScanner() {
    setMessage(""); setCustomer(null); setScanning(true);
    try {
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } } }, videoRef.current!, (result) => {
        if (result) void lookup(result.getText());
      });
    } catch (error) {
      setScanning(false);
      setMessage(error instanceof Error ? `Camera unavailable: ${error.message}` : "Camera unavailable. Paste the QR value below instead.");
    }
  }

  async function recordVisit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/admin/loyalty", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "record", code, receipt, billAmount: customer?.reward_due ? Number(billAmount) : undefined }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error || "Could not record visit."); setBusy(false); return; }
    const discount = Number(result.visit.discount_amount || 0);
    setMessage(discount > 0 ? `Visit recorded. Apply a ₱${discount.toFixed(2)} discount to this bill.` : "Visit recorded successfully.");
    setCustomer(null); setCode(""); setReceipt(""); setBillAmount(""); setBusy(false);
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
      <div className="rounded-3xl border border-[#E4D6C0] bg-white p-6 shadow-[0_18px_45px_rgba(59,39,22,0.08)]">
        <div className="overflow-hidden rounded-2xl bg-[#17251A]">
          <video ref={videoRef} muted playsInline className={`aspect-video w-full object-cover ${scanning ? "block" : "hidden"}`} />
          {!scanning && <div className="flex aspect-video flex-col items-center justify-center px-6 text-center text-white/70"><ScanLine size={48} /><p className="mt-4 text-sm">Position the customer’s loyalty QR inside the camera view.</p></div>}
        </div>
        <button onClick={scanning ? () => { controlsRef.current?.stop(); setScanning(false); } : startScanner} disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F4530] px-5 py-3.5 font-bold text-white hover:bg-[#253A28] disabled:opacity-50"><Camera size={19} />{scanning ? "Stop camera" : "Start QR scanner"}</button>
        <form onSubmit={(e) => { e.preventDefault(); void lookup(manualCode); }} className="mt-5 border-t border-[#E4D6C0] pt-5"><label className="text-sm font-semibold text-[#3B2716]">Manual fallback</label><div className="mt-2 flex gap-2"><input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="Paste QR value" className="min-w-0 flex-1 rounded-xl border border-[#E4D6C0] px-4 py-3 text-sm outline-none focus:border-[#C28B38]" /><button disabled={busy || !manualCode.trim()} className="rounded-xl bg-[#C28B38] px-5 font-bold text-white disabled:opacity-50">Find</button></div></form>
      </div>

      <div className="rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 shadow-[0_18px_45px_rgba(59,39,22,0.08)]">
        {customer ? <form onSubmit={recordVisit}>
          <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2F4530] text-white"><UserRound /></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C28B38]">Customer found</p><h2 className="mt-1 text-2xl font-semibold text-[#3B2716]">{customer.full_name || "Unnamed customer"}</h2></div></div>
          <div className={`mt-6 rounded-2xl p-5 ${customer.reward_due ? "bg-[#C28B38] text-white" : "bg-[#EDF1E9] text-[#2F4530]"}`}><p className="text-sm font-bold uppercase tracking-wider">Visit {customer.next_visit_number} of 5</p><p className="mt-2 text-xl font-semibold">{customer.reward_due ? "10% discount due today" : `${5 - customer.next_visit_number} visits until the reward`}</p></div>
          <div className="mt-5 rounded-xl border border-[#D9E1D2] bg-[#EDF1E9] px-4 py-3 text-sm leading-6 text-[#2F4530]">This scanner records walk-in dining visits. Completed table reservations are added automatically.</div>
          <label className="mt-5 block text-sm font-semibold text-[#3B2716]">Receipt reference<input required value={receipt} onChange={(e) => setReceipt(e.target.value)} className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 outline-none focus:border-[#C28B38]" placeholder="e.g. OR-2026-00124" /></label>
          {customer.reward_due && <label className="mt-4 block text-sm font-semibold text-[#3B2716]">Eligible dine-in bill amount<input required min="0.01" step="0.01" type="number" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 outline-none focus:border-[#C28B38]" placeholder="₱0.00" />{Number(billAmount) > 0 && <span className="mt-2 block text-[#2F4530]">Discount: ₱{(Number(billAmount) * .10).toFixed(2)}</span>}</label>}
          <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F4530] px-5 py-3.5 font-bold text-white disabled:opacity-50"><CheckCircle2 size={19} />{busy ? "Recording…" : "Confirm completed visit"}</button>
        </form> : <div className="flex min-h-[360px] flex-col items-center justify-center text-center"><RefreshCw className={busy ? "animate-spin text-[#C28B38]" : "text-[#C28B38]"} size={38} /><h2 className="mt-5 text-2xl font-semibold text-[#3B2716]">{busy ? "Checking loyalty card…" : "Ready for a customer"}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#6F675E]">Customer details and fifth-visit eligibility will appear here after scanning.</p></div>}
        {message && <div className="mt-5 rounded-xl border border-[#D9C7A9] bg-white px-4 py-3 text-sm text-[#3B2716]">{message}</div>}
      </div>
    </div>
  );
}

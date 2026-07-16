"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, QrCode, ScanLine, Sparkles } from "lucide-react";

export default function LoyaltyQrCard({ code, visits }: { code: string; visits: number }) {
  const [src, setSrc] = useState("");
  const progress = visits % 5;
  const nextVisit = progress + 1;

  useEffect(() => {
    QRCode.toDataURL(`kainan-loyalty:${code}`, {
      width: 360,
      margin: 2,
      color: { dark: "#2F4530", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    }).then(setSrc);
  }, [code]);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#D9C7A9] bg-[#FBF7EF] shadow-[0_28px_80px_rgba(59,39,22,0.14)]">
      <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#C28B38]/10 blur-2xl" />
      <div className="border-b border-[#E4D6C0] bg-[#2F4530] px-6 py-5 text-white sm:px-9">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#E8C88F]"><QrCode size={20} /></span>
            <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#E8C88F]">Kainan sa Tabing Lawa</p><h1 className="mt-1 text-xl font-semibold">Dine-in Loyalty Pass</h1></div>
          </div>
          <Sparkles className="hidden text-[#E8C88F] sm:block" size={24} />
        </div>
      </div>

      <div className="relative grid gap-9 p-6 sm:p-9 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
        <div className="order-2 md:order-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C28B38]">Your reward journey</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#3B2716] sm:text-4xl">Dine four times.<br /><span className="text-[#2F4530]">Enjoy 10% off on the fifth.</span></h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#6F675E]">Present your personal QR to staff after a completed table reservation or walk-in dining visit.</p>

          <div className="mt-7 rounded-2xl border border-[#E4D6C0] bg-white p-5">
            <div className="flex items-center justify-between"><p className="text-sm font-bold text-[#3B2716]">Visit progress</p><p className="text-sm font-semibold text-[#C28B38]">{progress}/5 completed</p></div>
            <div className="mt-4 flex items-center" aria-label={`${progress} of 5 visits completed`}>
              {[1, 2, 3, 4, 5].map((stamp, index) => <div key={stamp} className="flex flex-1 items-center last:flex-none"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition ${stamp <= progress ? "border-[#2F4530] bg-[#2F4530] text-white" : stamp === nextVisit ? "border-[#C28B38] bg-[#FFF8EA] text-[#C28B38] ring-4 ring-[#C28B38]/10" : "border-[#DED4C5] bg-[#F8F4ED] text-[#9A8B7A]"}`}>{stamp <= progress ? <Check size={17} strokeWidth={3} /> : stamp}</span>{index < 4 && <span className={`h-0.5 min-w-2 flex-1 ${stamp < progress ? "bg-[#2F4530]" : "bg-[#DED4C5]"}`} />}</div>)}
            </div>
            <div className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${nextVisit === 5 ? "bg-[#C28B38] text-white" : "bg-[#EDF1E9] text-[#2F4530]"}`}>{nextVisit === 5 ? "Your next visit unlocks your 10% discount!" : `${5 - progress} more ${5 - progress === 1 ? "visit" : "visits"} until your 10% reward.`}</div>
          </div>
        </div>

        <div className="order-1 mx-auto w-full max-w-[280px] md:order-2">
          <div className="rounded-[1.75rem] border border-[#E4D6C0] bg-white p-5 shadow-[0_18px_45px_rgba(59,39,22,0.12)]">
            <div className="rounded-2xl border border-dashed border-[#CDBB9F] bg-[#FFFCF7] p-3">{src ? <img src={src} alt="Your unique Kainan loyalty QR code" className="aspect-square w-full" /> : <div className="aspect-square w-full animate-pulse rounded-xl bg-[#F7F0E4]" />}</div>
            <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-[#2F4530]"><ScanLine size={16} /> Scan at the counter</div>
          </div>
          <p className="mt-3 text-center text-xs leading-5 text-[#867A6D]">This QR is unique to your account.<br />Please do not share it.</p>
        </div>
      </div>
    </section>
  );
}

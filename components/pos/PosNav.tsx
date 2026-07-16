import Link from "next/link";
import { BarChart3, Boxes, ShoppingCart } from "lucide-react";

export default function PosNav({ active }: { active: "register" | "inventory" | "sales" }) {
  const links = [
    { key: "register", href: "/pos", label: "Register", icon: ShoppingCart },
    { key: "inventory", href: "/pos/inventory", label: "Inventory", icon: Boxes },
    { key: "sales", href: "/pos/sales", label: "Sales", icon: BarChart3 },
  ] as const;
  return <nav className="flex gap-1 rounded-xl bg-white/10 p-1">{links.map(({ key, href, label, icon: Icon }) =>
    <Link key={key} href={href} className={`flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold ${active === key ? "bg-[#C28B38] text-white" : "text-white/75 hover:bg-white/10"}`}><Icon size={16}/><span className="hidden sm:inline">{label}</span></Link>
  )}</nav>;
}

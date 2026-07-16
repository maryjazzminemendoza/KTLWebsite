"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MenuSquare,
  MessageSquareText,
  CalendarDays,
  Inbox,
  UsersRound,
  ShoppingBag,
  ScanLine,
  Boxes,
  BrainCircuit,
} from "lucide-react";

const adminLinks = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Manage Menu",
    href: "/admin/menu",
    icon: MenuSquare,
  },
  {
    label: "Reservations",
    href: "/admin/reservations",
    icon: CalendarDays,
  },
  {
    label: "Messages",
    href: "/admin/messages",
    icon: Inbox,
  },
  {
    label: "Reviews",
    href: "/admin/testimonials",
    icon: MessageSquareText,
  },
  {
    label: "Open POS",
    href: "/pos",
    icon: ScanLine,
  },
  {
    label: "AI Insights",
    href: "/admin/insights",
    icon: BrainCircuit,
  },
  {
    label: "POS Inventory",
    href: "/pos/inventory",
    icon: Boxes,
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: UsersRound,
   },
   {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
    },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-sidebar-scrollbar flex min-w-max gap-2 lg:mt-8 lg:min-h-0 lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-2 lg:overflow-y-auto lg:pr-1">
      {adminLinks.map((link) => {
        const Icon = link.icon;

        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
            : link.href === "/pos"
              ? pathname === "/pos"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.label}
            href={link.href}
            className={`flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition lg:gap-3 lg:rounded-2xl lg:px-4 lg:py-3 ${
              isActive
                ? "bg-[#C28B38] text-white shadow-[0_12px_30px_rgba(194,139,56,0.25)]"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={18} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

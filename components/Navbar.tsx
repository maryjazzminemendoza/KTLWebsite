"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronDown, LogIn, LogOut, Menu, Package, ShoppingCart, User, UserPlus, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import CartCount from "@/components/cart/CartCount";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Our Story", href: "/our-story" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [accountName, setAccountName] = useState("");
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const needsSolidBackground =
    pathname === "/cart" ||
    pathname.startsWith("/cart/") ||
    pathname === "/reservations" ||
    pathname.startsWith("/reservations/") ||
    pathname === "/my-reservations" ||
    pathname.startsWith("/my-reservations/") ||
    pathname === "/my-orders" ||
    pathname.startsWith("/my-orders/") ||
    pathname === "/account" ||
    pathname.startsWith("/account/");
  const usesCompactHeader =
    isScrolled || needsSolidBackground || isMobileOpen;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function loadAccount(currentUser: SupabaseUser | null) {
      setUser(currentUser);
      if (!currentUser) {
        setAccountName("");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUser.id)
        .single();
      setAccountName(profile?.full_name?.trim().split(/\s+/)[0] || currentUser.user_metadata?.full_name?.trim().split(/\s+/)[0] || "there");
    }

    supabase.auth.getUser().then(({ data }) => void loadAccount(data.user));

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => void loadAccount(session?.user ?? null),
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAccountOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAccountOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAccountOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsAccountOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full transition-all duration-500 ${
        usesCompactHeader
          ? "border-b border-white/10 bg-[#1f1a14]/95 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 transition-all duration-500 lg:px-12 ${
          usesCompactHeader ? "h-20" : "h-24"
        }`}
      >
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo.webp"
            alt="Kainan sa Tabing Lawa Logo"
            width={96}
            height={96}
            priority
            className="h-16 w-16 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] md:h-[72px] md:w-[72px]"
          />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className="group relative text-sm font-medium text-white/90 transition hover:text-white"
              >
                {link.label}
                <span
                  className={`absolute -bottom-3 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[#C28B38] transition-all duration-300 ${
                    isActive ? "w-5" : "w-0 group-hover:w-5"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={isAccountOpen}
              onClick={() => setIsAccountOpen((open) => !open)}
              className="flex h-10 items-center justify-center gap-1 rounded-full border border-white/25 bg-white/10 px-3 text-white backdrop-blur-sm transition hover:bg-white hover:text-[#2F4530]"
            >
              <User size={18} />
              <ChevronDown
                size={14}
                className={`transition-transform ${isAccountOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isAccountOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-[#2F4530]/10 bg-white py-2 text-[#2F4530] shadow-[0_18px_50px_rgba(0,0,0,0.25)]"
              >
                {user ? (
                  <>
                    <div className="border-b border-[#2F4530]/10 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#C28B38]">Signed in as</p>
                      <p className="mt-1 truncate text-sm font-bold text-[#2F4530]">{accountName || "Customer"}</p>
                      <p className="mt-0.5 truncate text-xs text-[#6F675E]">{user.email}</p>
                    </div>
                    <Link
                      href="/account"
                      role="menuitem"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition hover:bg-[#F4EFE6]"
                    >
                      <User size={17} /> My Account & Loyalty QR
                    </Link>
                    <Link
                      href="/my-reservations"
                      role="menuitem"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition hover:bg-[#F4EFE6]"
                    >
                      <CalendarDays size={17} /> My Reservations
                    </Link>
                    <Link
                      href="/my-orders"
                      role="menuitem"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition hover:bg-[#F4EFE6]"
                    >
                      <Package size={17} /> My Orders
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      <LogOut size={17} /> Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      role="menuitem"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition hover:bg-[#F4EFE6]"
                    >
                      <LogIn size={17} /> Log In
                    </Link>
                    <Link
                      href="/register"
                      role="menuitem"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition hover:bg-[#F4EFE6]"
                    >
                      <UserPlus size={17} /> Create Account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white hover:text-[#2F4530]"
          >
            <ShoppingCart size={18} />

            <CartCount />
          </Link>

          <Link
            href="/reservations"
            className="rounded-md bg-[#C28B38] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_22px_rgba(194,139,56,0.35)] transition hover:bg-[#B47E2F]"
          >
            Reserve a Table
          </Link>
        </div>

        <button
          type="button"
          aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMobileOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/10 text-white backdrop-blur-sm md:hidden"
        >
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        id="mobile-navigation"
        className={`overflow-y-auto border-t border-white/10 bg-[#1f1a14] transition-[max-height,opacity] duration-300 md:hidden ${
          isMobileOpen ? "max-h-[calc(100dvh-5rem)] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-1 px-5 pb-7 pt-4">
          {navLinks.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} onClick={() => setIsMobileOpen(false)} aria-current={isActive ? "page" : undefined}
                className={`flex min-h-12 items-center rounded-xl px-4 text-base font-semibold ${isActive ? "bg-white/10 text-[#E4B763]" : "text-white/85"}`}>
                {link.label}
              </Link>
            );
          })}
          <div className="my-3 border-t border-white/10" />
          <Link href="/cart" onClick={() => setIsMobileOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold text-white/85">
            <span className="relative"><ShoppingCart size={20} /><CartCount /></span> Cart
          </Link>
          {user ? (
            <>
              <p className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-[#E4B763]">Hi, {accountName || "Customer"}</p>
              <Link href="/account" onClick={() => setIsMobileOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold text-white/85"><User size={20} /> My Account & Loyalty QR</Link>
              <Link href="/my-reservations" onClick={() => setIsMobileOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold text-white/85"><CalendarDays size={20} /> My Reservations</Link>
              <Link href="/my-orders" onClick={() => setIsMobileOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold text-white/85"><Package size={20} /> My Orders</Link>
              <button type="button" onClick={handleLogout} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left font-semibold text-red-300"><LogOut size={20} /> Log Out</button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 py-3">
              <Link href="/login" onClick={() => setIsMobileOpen(false)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 font-semibold text-white"><LogIn size={18} /> Log In</Link>
              <Link href="/register" onClick={() => setIsMobileOpen(false)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 font-semibold text-white"><UserPlus size={18} /> Sign Up</Link>
            </div>
          )}
          <Link href="/reservations" onClick={() => setIsMobileOpen(false)} className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-[#C28B38] px-5 text-sm font-bold uppercase tracking-wide text-white">Reserve a Table</Link>
        </div>
      </div>
    </header>
  );
}

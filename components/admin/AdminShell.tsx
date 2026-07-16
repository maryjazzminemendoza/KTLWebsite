import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-[#E4D6C0] bg-[#142418] px-5 py-6 text-white lg:flex">
        <Link href="/admin" className="flex shrink-0 items-center gap-3">
          <Image
            src="/images/logo.webp"
            alt="Kainan sa Tabing Lawa Logo"
            width={64}
            height={64}
            className="h-auto w-16"
          />

          <div>
            <p className="font-serif text-xl font-semibold leading-tight">
              Kainan sa Tabing Lawa
            </p>
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">
              Admin Panel
            </p>
          </div>
        </Link>

        <AdminSidebarNav />

        <div className="mt-4 shrink-0 space-y-2 border-t border-white/10 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Home size={18} />
            View Website
          </Link>

          <AdminLogoutButton />
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#E4D6C0] bg-[#F7F4EF]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3">
              <Image
                src="/images/logo.webp"
                alt="Kainan sa Tabing Lawa Logo"
                width={52}
                height={52}
                className="h-auto w-12"
              />

              <div>
                <p className="font-serif text-xl font-semibold text-[#3B2716]">
                  Admin
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8B7A65]">
                  Kainan sa Tabing Lawa
                </p>
              </div>
            </Link>

            <Link
              href="/"
              className="rounded-xl bg-[#2F4530] px-4 py-2 text-sm font-semibold text-white"
            >
              Website
            </Link>
          </div>
          <div className="mt-3 overflow-x-auto pb-1">
            <AdminSidebarNav />
          </div>
        </header>

        <main className="min-h-screen px-4 py-7 sm:px-6 sm:py-10 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

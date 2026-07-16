import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaInstagram } from "react-icons/fa";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Our Story", href: "/our-story" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#142418] text-white">
      <div className="container-custom py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.9fr_1.1fr]">
          <div>
            <Image
              src="/images/logo.webp"
              alt="Kainan sa Tabing Lawa Logo"
              width={96}
              height={96}
              className="h-20 w-20 object-contain"
            />

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">
              Since 1967, we have been serving families fresh food, warm
              Filipino hospitality, and lakeside memories in Tanay.
            </p>

            <div className="mt-6 flex gap-3">
              <Link
                href="https://www.facebook.com/KTLSince1967"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:bg-white hover:text-[#142418]"
              >
                <FaFacebookF size={16} />
              </Link>

              <Link
                href="https://www.instagram.com/ktlawa/"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:bg-white hover:text-[#142418]"
              >
                <FaInstagram size={18} />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-sans text-sm font-bold uppercase tracking-[0.18em] text-[#D7A24A]">
              Quick Links
            </h3>

            <ul className="mt-5 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-sans text-sm font-bold uppercase tracking-[0.18em] text-[#D7A24A]">
              Hours
            </h3>

            <div className="mt-5 space-y-4 text-sm text-white/70">
              <div className="flex gap-3">
                <Clock size={18} className="mt-0.5 text-[#D7A24A]" />
                <div>
                  <p>Mon - Fri&nbsp;&nbsp; 10:00 AM - 9:00 PM</p>
                  <p>Sat - Sun&nbsp;&nbsp; 9:00 AM - 10:00 PM</p>
                </div>
              </div>

              <p className="text-white/60">We are open daily.</p>
            </div>
          </div>

          <div>
            <h3 className="font-sans text-sm font-bold uppercase tracking-[0.18em] text-[#D7A24A]">
              Contact
            </h3>

            <div className="mt-5 space-y-4 text-sm text-white/70">
              <p className="flex gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-[#D7A24A]" />
                Lakeshore Drive Corner Ding Tanjuatco Street.
              </p>

              <p className="flex gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-[#D7A24A]" />
                0917 123 4567
              </p>

              <p className="flex gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-[#D7A24A]" />
                kainansatabinglawa@gmail.com
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-center text-xs text-white/50 sm:flex-row sm:text-left">
          <p>&copy; {currentYear} Kainan sa Tabing Lawa. All rights reserved.</p>
          <nav aria-label="Legal" className="flex items-center gap-5">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms of Use
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

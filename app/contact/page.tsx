import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/contact/ContactForm";
import { CalendarDays, Clock, Mail, MapPin, Phone } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const contactDetails = [
  {
    icon: MapPin,
    title: "Location",
    detail: "Brgy. Sampaloc, Tanay, Rizal near Laguna Lake",
  },
  {
    icon: Phone,
    title: "Phone",
    detail: "0917 123 4567",
  },
  {
    icon: Mail,
    title: "Email",
    detail: "kainansatabinglawa@gmail.com",
  },
  {
    icon: Clock,
    title: "Opening Hours",
    detail: "Open daily for lakeside family dining",
  },
];

export default async function ContactPage() {
  const user = await getCurrentUser();
  const supabase = user ? await createSupabaseServerClient() : null;
  const { data: profile } = user && supabase
    ? await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single()
    : { data: null };
  return (
    <>
      <Navbar />

      <main className="bg-[#F7F4EF]">
        <section className="relative flex min-h-[75svh] items-center justify-center overflow-hidden px-6 pb-24 pt-32 text-center md:min-h-[80vh] md:pb-28">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/restaurant-view1.webp')",
            }}
          />

          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/25 to-black/55" />

          <div className="relative z-10 max-w-4xl">
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.35em] text-[#D7A24A]">
              Contact Us
            </p>

            <h1 className="text-5xl font-semibold leading-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] md:text-7xl">
              Visit Us by
              <br />
              Laguna Lake
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/90 drop-shadow-md">
              Have questions about reservations, directions, or group dining?
              Reach out to us and we&apos;ll be happy to help.
            </p>
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 w-full">
            <svg
              viewBox="0 0 1440 100"
              className="block h-[70px] w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0,60 C240,110 480,10 720,60 C960,105 1200,25 1440,65 L1440,100 L0,100 Z"
                fill="#F7F4EF"
              />
            </svg>
          </div>
        </section>

        <section className="py-24">
          <div className="container-custom">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
                  Get In Touch
                </p>

                <h2 className="mt-4 text-5xl font-semibold leading-[1.02] text-[#3B2716] md:text-6xl">
                  We&apos;d Love to
                  <br />
                  Hear From You
                </h2>

                <p className="mt-6 max-w-xl text-base leading-8 text-[#6F675E]">
                  Whether you&apos;re planning a family lunch, a special celebration,
                  or a relaxing meal by the lake, our team is ready to assist
                  you.
                </p>

                <div className="mt-10 grid gap-4">
                  {contactDetails.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="flex gap-4 rounded-2xl border border-[#E4D6C0] bg-[#FBF7EF] p-5 shadow-[0_14px_35px_rgba(59,39,22,0.06)]"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2F4530] text-white">
                          <Icon size={21} />
                        </div>

                        <div>
                          <h3 className="font-serif text-2xl font-semibold text-[#3B2716]">
                            {item.title}
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-[#6F675E]">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <ContactForm userId={user?.id} initialName={profile?.full_name || ""} initialPhone={profile?.phone || ""} initialEmail={user?.email || ""} />
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="container-custom">
            <div className="grid gap-8 rounded-[2rem] border border-[#E4D6C0] bg-[#2F4530] p-8 text-white shadow-[0_24px_70px_rgba(59,39,22,0.12)] md:p-14 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#D7A24A]">
                  Ready to Visit?
                </p>

                <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
                  Reserve your table before your trip.
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-8 text-white/75">
                  Registered customers can reserve online and track their
                  booking status anytime.
                </p>
              </div>

              <Link
                href="/reservations"
                className="inline-flex items-center justify-center gap-3 rounded-md bg-[#C28B38] px-8 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#B47E2F]"
              >
                <CalendarDays size={18} />
                Reserve a Table
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

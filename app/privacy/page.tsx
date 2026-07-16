import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy | Kainan sa Tabing Lawa",
  description: "How Kainan sa Tabing Lawa collects, uses, and protects customer information.",
};

const sections = [
  {
    title: "Information we collect",
    content: (
      <>
        <p>We collect information you provide when you create an account, place an order, request a reservation, contact us, join our loyalty program, or submit a review. This may include your name, email address, phone number, delivery address, order and reservation details, preferences, messages, and loyalty activity.</p>
        <p>We may also receive basic technical information needed to operate and secure the website, such as browser type, device information, IP address, and activity logs.</p>
      </>
    ),
  },
  {
    title: "How we use your information",
    content: <p>We use your information to provide and manage accounts, orders, deliveries, reservations, loyalty benefits, and customer support; communicate service updates; prevent fraud and misuse; improve our menu and services; comply with legal obligations; and maintain the security and reliability of the website.</p>,
  },
  {
    title: "How we share information",
    content: <p>We do not sell your personal information. We may share only what is necessary with service providers that help us operate the website, communications, hosting, analytics, or restaurant services; with professional advisers; or with public authorities when required by law. Service providers are expected to handle information only for the services they provide to us.</p>,
  },
  {
    title: "Retention and security",
    content: <p>We retain personal information only for as long as reasonably necessary for the purposes described here, including recordkeeping, dispute resolution, security, and legal compliance. We use reasonable administrative and technical safeguards, but no online service can guarantee absolute security.</p>,
  },
  {
    title: "Your choices and rights",
    content: <p>Subject to applicable Philippine data protection law, you may ask to access, correct, update, or delete your personal information, object to or restrict certain processing, or withdraw consent where processing relies on consent. Some information may need to be retained when required by law or for legitimate business records.</p>,
  },
  {
    title: "Children's privacy",
    content: <p>Our online account and ordering services are not intended for children who cannot legally provide consent. A parent or guardian should contact us if they believe a child has provided personal information without appropriate permission.</p>,
  },
  {
    title: "Changes to this policy",
    content: <p>We may update this policy as our services or legal obligations change. The revised version will be posted here with a new effective date.</p>,
  },
  {
    title: "Contact us",
    content: <p>For privacy questions or requests, email us at <a className="font-semibold text-[#2F4530] underline underline-offset-4" href="mailto:kainansatabinglawa@gmail.com">kainansatabinglawa@gmail.com</a> or write to Kainan sa Tabing Lawa, Lakeshore Drive Corner Ding Tanjuatco Street, Tanay, Rizal, Philippines.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#F7F4EF] px-6 pb-24 pt-36 text-[#3B2716]">
        <article className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">Your Information</p>
          <h1 className="mt-4 text-5xl font-semibold sm:text-6xl">Privacy Policy</h1>
          <p className="mt-5 text-sm text-[#6F675E]">Effective July 15, 2026</p>
          <p className="mt-8 max-w-3xl text-base leading-8 text-[#6F675E]">Kainan sa Tabing Lawa respects your privacy. This policy explains what information we collect through our website, why we use it, and the choices available to you.</p>

          <div className="mt-12 space-y-10 border-t border-[#DED1BD] pt-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-3xl font-semibold">{section.title}</h2>
                <div className="mt-3 space-y-4 text-sm leading-7 text-[#6F675E] sm:text-base sm:leading-8">{section.content}</div>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

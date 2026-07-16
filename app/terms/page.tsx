import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Terms of Use | Kainan sa Tabing Lawa",
  description: "Terms that apply when using the Kainan sa Tabing Lawa website and online services.",
};

const sections = [
  {
    title: "Using the website",
    body: "You may use this website for lawful personal use, including viewing our menu, managing an account, placing an order, requesting a reservation, contacting us, and participating in available loyalty or review features. You must not interfere with the website, attempt unauthorized access, submit false or harmful information, or use the service in a way that violates applicable law or another person's rights.",
  },
  {
    title: "Accounts",
    body: "You are responsible for providing accurate information, keeping your login details confidential, and notifying us if you suspect unauthorized account activity. We may restrict or close an account used fraudulently, unlawfully, or in violation of these terms.",
  },
  {
    title: "Orders and availability",
    body: "Submitting an online order is a request to purchase. An order is accepted only after the restaurant confirms it. Menu items, prices, portions, promotions, service areas, and availability may change. We will contact you when a requested item is unavailable or an order cannot be fulfilled. Any applicable charges will be shown or confirmed before completion.",
  },
  {
    title: "Reservations",
    body: "An online reservation request is not final until confirmed by the restaurant. Please provide accurate party and contact details and notify us promptly if plans change. We may adjust or decline requests because of capacity, operating conditions, special events, or circumstances outside our control.",
  },
  {
    title: "Food allergies and dietary needs",
    body: "Tell us about allergies or dietary requirements before ordering. Although we take reasonable care, restaurant kitchens handle common allergens and cannot guarantee that any item is completely free from allergens or cross-contact. Customers with severe allergies should speak directly with the restaurant before ordering.",
  },
  {
    title: "Loyalty features and promotions",
    body: "Loyalty rewards and promotions are subject to their displayed eligibility rules, availability, and expiration terms. They have no cash value unless stated otherwise and may be corrected, suspended, or withdrawn in cases of error, misuse, or fraud.",
  },
  {
    title: "Reviews and submitted content",
    body: "If you submit a review, message, or other content, you confirm that it is truthful, lawful, and yours to share. You allow us to store, review, and display submitted content for operating and promoting the restaurant. We may remove content that is abusive, misleading, unlawful, unrelated, or contains another person's private information.",
  },
  {
    title: "Website content",
    body: "The website's branding, photographs, design, text, and other content belong to Kainan sa Tabing Lawa or their respective owners and are protected by applicable law. You may not copy, republish, sell, or exploit them without permission, except for ordinary personal use of the website.",
  },
  {
    title: "Service availability and liability",
    body: "We work to keep information accurate and services available, but the website may occasionally be interrupted or contain errors. To the extent permitted by law, we are not responsible for indirect or unforeseeable loss arising from website use. Nothing in these terms excludes rights or remedies that cannot legally be excluded.",
  },
  {
    title: "Changes and governing law",
    body: "We may update these terms or website features from time to time. Updated terms apply after they are posted here. These terms are governed by the laws of the Republic of the Philippines, without limiting any mandatory consumer rights that apply to you.",
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#F7F4EF] px-6 pb-24 pt-36 text-[#3B2716]">
        <article className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">Website Terms</p>
          <h1 className="mt-4 text-5xl font-semibold sm:text-6xl">Terms of Use</h1>
          <p className="mt-5 text-sm text-[#6F675E]">Effective July 15, 2026</p>
          <p className="mt-8 max-w-3xl text-base leading-8 text-[#6F675E]">These terms apply when you use the Kainan sa Tabing Lawa website and its online services. By using the site, you agree to these terms and our Privacy Policy.</p>

          <div className="mt-12 space-y-10 border-t border-[#DED1BD] pt-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-3xl font-semibold">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#6F675E] sm:text-base sm:leading-8">{section.body}</p>
              </section>
            ))}
            <section>
              <h2 className="text-3xl font-semibold">Contact us</h2>
              <p className="mt-3 text-sm leading-7 text-[#6F675E] sm:text-base sm:leading-8">Questions about these terms may be sent to <a className="font-semibold text-[#2F4530] underline underline-offset-4" href="mailto:kainansatabinglawa@gmail.com">kainansatabinglawa@gmail.com</a>.</p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

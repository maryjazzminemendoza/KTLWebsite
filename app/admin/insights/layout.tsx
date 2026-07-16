import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const description = "AI-powered guest review insights and seven-day demand planning for Kainan sa Tabing Lawa.";
  const image = new URL("/og-insights.png", base).toString();

  return {
    title: "AI Insights | Kainan sa Tabing Lawa",
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: "Kainan sa Tabing Lawa",
      description,
      type: "website",
      images: [{ url: image, width: 1732, height: 909, alt: "Kainan sa Tabing Lawa — Guest insights. Smarter planning." }],
    },
    twitter: { card: "summary_large_image", title: "Kainan sa Tabing Lawa", description, images: [image] },
  };
}

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

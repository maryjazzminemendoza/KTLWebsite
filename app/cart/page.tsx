import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartPageClient from "@/components/cart/CartPageClient";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function CartPage() {
  const user = await getCurrentUser();
  const supabase = user ? await createSupabaseServerClient() : null;
  const { data: profile } = user && supabase
    ? await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single()
    : { data: null };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4EF] px-4 pb-16 pt-28 sm:px-6 sm:py-32">
        <CartPageClient
          userId={user?.id}
          userEmail={user?.email}
          initialName={profile?.full_name || ""}
          initialPhone={profile?.phone || ""}
        />
      </main>

      <Footer />
    </>
  );
}

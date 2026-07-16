import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegisterForm from "@/components/auth/RegisterForm";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <>
      <Navbar />

      <main className="flex min-h-screen items-center justify-center bg-[#F7F4EF] px-6 py-32">
        <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_480px]">
          <div className="hidden lg:block">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
              Become Part of the Family
            </p>

            <h2 className="mt-4 text-6xl font-semibold leading-[1.02] text-[#3B2716]">
              Reserve tables online with a free account.
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-[#6F675E]">
              Registered customers can reserve tables, manage bookings, and
              keep track of their dining history.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="h-[650px] w-full max-w-md animate-pulse rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] shadow-[0_24px_70px_rgba(59,39,22,0.10)]" />
            }
          >
            <RegisterForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCustomerErrorMessage } from "@/lib/customer-error";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get("redirect");
  const redirectTo =
    requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAwaitingVerification, setIsAwaitingVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);

  function getEmailRedirectTo() {
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", redirectTo);
    return callbackUrl.toString();
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: getEmailRedirectTo(),
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (error) {
      setMessage(
        getCustomerErrorMessage(
          error,
          "We could not create your account right now. Please try again shortly.",
        ),
      );
      setIsLoading(false);
      return;
    }

    if (data.session) {
      router.replace(redirectTo);
      router.refresh();
      return;
    }

    setEmail(normalizedEmail);
    setIsAwaitingVerification(true);
    setMessage(`We sent a verification link to ${normalizedEmail}. Open it to activate your account.`);
    setIsLoading(false);
  }

  async function handleResendVerification() {
    setIsResending(true);
    setMessage("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: getEmailRedirectTo() },
    });

    setMessage(
      error
        ? getCustomerErrorMessage(
            error,
            "We could not resend the verification email. Please try again shortly.",
          )
        : `A new verification link was sent to ${email}. Check your spam folder if it does not arrive soon.`
    );
    setIsResending(false);
  }

  return (
    <form
      onSubmit={handleRegister}
      className="w-full max-w-md rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-8 shadow-[0_24px_70px_rgba(59,39,22,0.10)]"
    >
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
        Join the Family
      </p>

      <h1 className="mt-3 text-5xl font-semibold leading-tight text-[#3B2716]">
        Create Account
      </h1>

      <p className="mt-4 text-sm leading-6 text-[#6F675E]">
        Create a free account to reserve tables online and view your future
        reservations.
      </p>

      <div className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">
            Full Name
          </span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder="Juan Dela Cruz"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">
            Phone Number
          </span>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder="09XX XXX XXXX"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder="Minimum 6 characters"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#3B2716]">
            Confirm Password
          </span>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder="Re-enter your password"
          />
        </label>

        {message && (
          <div className="rounded-xl border border-[#E4D6C0] bg-[#F7F0E4] px-4 py-3 text-sm text-[#3B2716]">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isAwaitingVerification}
          className="w-full rounded-xl bg-[#C28B38] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#B47E2F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </button>

        {isAwaitingVerification && (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full rounded-xl border border-[#C28B38] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#8A5F24] transition hover:bg-[#F7F0E4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResending ? "Sending..." : "Resend Verification Email"}
          </button>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-[#6F675E]">
        Already have an account?{" "}
        <Link
          href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
          className="font-bold text-[#2F4530]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

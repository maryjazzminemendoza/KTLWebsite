"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCustomerErrorMessage } from "@/lib/customer-error";

export default function LoginForm() {
  const searchParams = useSearchParams();

  const requestedRedirect = searchParams.get("redirect");
  const redirectTo =
    requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const authError = searchParams.get("error");

  const initialMessage =
    authError === "admin_required"
      ? "Please sign in with an admin account."
      : authError === "profile_unavailable"
      ? "We could not load your account right now. Please try again shortly."
      : authError === "missing_auth_code"
      ? "That verification link is incomplete. Request a new verification email."
      : authError === "auth_callback_failed"
      ? "That verification link is invalid or expired. Request a new verification email."
      : "";

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.code === "email_not_confirmed") {
          setNeedsVerification(true);
          setMessage("Please verify your email before signing in.");
        } else {
          setMessage(
            getCustomerErrorMessage(
              error,
              "We could not sign you in right now. Please try again shortly.",
            ),
          );
        }
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setMessage("Sign in failed. Please try again.");
        setIsLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut();
        setMessage("We could not load your account right now. Please try again shortly.");
        setIsLoading(false);
        return;
      }

      if (!profile) {
        await supabase.auth.signOut();
        setMessage("We could not load your account right now. Please contact us if this continues.");
        setIsLoading(false);
        return;
      }

      const role = profile.role?.toLowerCase();
      const isAdmin = role === "admin";
      const isCashier = role === "cashier";

      if (redirectTo.startsWith("/admin") && !isAdmin) {
        await supabase.auth.signOut();
        setMessage(
          "This account is not an admin. Set its profile role to admin in Supabase, then sign in again."
        );
        setIsLoading(false);
        return;
      }

      if (redirectTo.startsWith("/pos") && !isAdmin && !isCashier) {
        await supabase.auth.signOut();
        setMessage("This account does not have staff access.");
        setIsLoading(false);
        return;
      }

      const destination =
        redirectTo === "/" && isAdmin
          ? "/admin"
          : redirectTo === "/" && isCashier
            ? "/pos"
            : redirectTo;

      window.location.replace(destination);
    } catch {
      setMessage("We could not finish signing you in. Please try again.");
      setIsLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!email.trim()) {
      setMessage("Enter your email address first.");
      return;
    }

    setIsResending(true);
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", redirectTo);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: callbackUrl.toString() },
    });

    setMessage(
      error
        ? getCustomerErrorMessage(
            error,
            "We could not resend the verification email. Please try again shortly.",
          )
        : "A new verification link was sent. Check your inbox and spam folder."
    );
    setIsResending(false);
  }

  return (
    <form
      onSubmit={handleLogin}
      className="w-full max-w-md rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-8 shadow-[0_24px_70px_rgba(59,39,22,0.10)]"
    >
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C28B38]">
        Welcome Back
      </p>

      <h1 className="mt-3 text-5xl font-semibold leading-tight text-[#3B2716]">
        Sign In
      </h1>

      <p className="mt-4 text-sm leading-6 text-[#6F675E]">
        Sign in to reserve a table and manage your bookings.
      </p>

      <div className="mt-8 space-y-4">
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
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
            placeholder="Enter your password"
          />
        </label>

        {(message || initialMessage) && (
          <div className="rounded-xl border border-[#E4D6C0] bg-[#F7F0E4] px-4 py-3 text-sm text-[#3B2716]">
            {message || initialMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-[#C28B38] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#B47E2F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>

        {needsVerification && (
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
        Don&apos;t have an account?{" "}
        <Link
          href={`/register?redirect=${encodeURIComponent(redirectTo)}`}
          className="font-bold text-[#2F4530]"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminLogoutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSigningOut}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut size={18} />
      {isSigningOut ? "Signing out..." : "Sign out"}
    </button>
  );
}

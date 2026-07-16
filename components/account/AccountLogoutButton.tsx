"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AccountLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E4D6C0] bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#3B2716] transition hover:bg-[#F7F0E4]"
    >
      <LogOut size={17} />
      Sign Out
    </button>
  );
}
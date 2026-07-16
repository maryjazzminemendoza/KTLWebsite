import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  CalendarReservation,
  syncReservationCalendar,
} from "@/lib/google-calendar";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const reservationId = Number(id);
  if (!Number.isSafeInteger(reservationId) || reservationId <= 0) {
    return NextResponse.json({ error: "Invalid reservation ID." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reservations")
    .select("id, customer_name, email, phone, reservation_date, reservation_time, guests, special_requests, status")
    .eq("id", reservationId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Reservation not found." }, { status: 404 });
  }

  if (data.status !== "confirmed") {
    return NextResponse.json(
      { error: "Only confirmed reservations can be synced manually." },
      { status: 400 }
    );
  }

  try {
    const calendar = await syncReservationCalendar(data as CalendarReservation);
    return NextResponse.json({ calendar });
  } catch (calendarError) {
    const message = calendarError instanceof Error ? calendarError.message : "Calendar sync failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

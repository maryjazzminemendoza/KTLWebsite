import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  buildCustomerCalendarUrl,
  CalendarReservation,
  syncReservationCalendar,
} from "@/lib/google-calendar";

export const runtime = "nodejs";

const statuses = ["pending", "confirmed", "cancelled", "completed"] as const;
type ReservationStatus = (typeof statuses)[number];

type Reservation = {
  id: number;
  customer_name: string;
  email: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  phone: string;
  special_requests: string | null;
  status: ReservationStatus;
};

const statusCopy: Record<ReservationStatus, { subject: string; message: string }> = {
  pending: {
    subject: "Your reservation is pending",
    message: "Your reservation is pending review. We’ll let you know as soon as it is confirmed.",
  },
  confirmed: {
    subject: "Your reservation is confirmed",
    message: "Great news—your reservation has been confirmed. We look forward to welcoming you!",
  },
  cancelled: {
    subject: "Your reservation has been cancelled",
    message: "Your reservation has been cancelled. If this was unexpected, please contact us so we can help.",
  },
  completed: {
    subject: "Thank you for dining with us",
    message: "Your reservation has been marked complete. Thank you for dining with us—we hope to see you again soon!",
  },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(`${date}T00:00:00+08:00`));
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

async function sendStatusEmail(reservation: Reservation) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;

  if (!host || !user || !password || !Number.isInteger(port)) {
    throw new Error(
      "Email is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS."
    );
  }

  const copy = statusCopy[reservation.status];
  const customerCalendarUrl = reservation.status === "confirmed"
    ? buildCustomerCalendarUrl(reservation as CalendarReservation)
    : null;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass: password,
    },
  });

  await transporter.sendMail({
    from: {
      name: "Kainan sa Tabing Lawa",
      address: user,
    },
    to: reservation.email,
    subject: copy.subject,
    text: `Hi ${reservation.customer_name},\n\n${copy.message}\n\nReservation #${reservation.id}\n${formatDate(reservation.reservation_date)} at ${formatTime(reservation.reservation_time)}\n${reservation.guests} ${reservation.guests === 1 ? "guest" : "guests"}${customerCalendarUrl ? `\n\nAdd to Google Calendar: ${customerCalendarUrl}` : ""}`,
    html: `
        <div style="background:#f7f0e4;padding:32px 16px;font-family:Arial,sans-serif;color:#3b2716">
          <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e4d6c0;border-radius:20px;padding:32px">
            <p style="color:#c28b38;font-weight:700;text-transform:uppercase;letter-spacing:.12em">Kainan sa Tabing Lawa</p>
            <h1 style="font-size:28px;margin:16px 0">${escapeHtml(copy.subject)}</h1>
            <p style="line-height:1.6">Hi ${escapeHtml(reservation.customer_name)},</p>
            <p style="line-height:1.6">${escapeHtml(copy.message)}</p>
            <div style="background:#f7f0e4;border-radius:14px;padding:18px;margin-top:24px;line-height:1.7">
              <strong>Reservation #${reservation.id}</strong><br>
              ${escapeHtml(formatDate(reservation.reservation_date))} at ${escapeHtml(formatTime(reservation.reservation_time))}<br>
              ${reservation.guests} ${reservation.guests === 1 ? "guest" : "guests"}
            </div>
            ${customerCalendarUrl ? `<p style="margin-top:24px"><a href="${escapeHtml(customerCalendarUrl)}" style="display:inline-block;background:#2f4530;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px">Add to Google Calendar</a></p>` : ""}
          </div>
        </div>`,
  });
}

export async function PATCH(
  request: Request,
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

  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  if (!body?.status || !statuses.includes(body.status as ReservationStatus)) {
    return NextResponse.json({ error: "Invalid reservation status." }, { status: 400 });
  }

  const { id } = await params;
  const reservationId = Number(id);
  if (!Number.isSafeInteger(reservationId) || reservationId <= 0) {
    return NextResponse.json({ error: "Invalid reservation ID." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reservations")
    .update({ status: body.status })
    .eq("id", reservationId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const reservation = data as Reservation;
  const [emailResult, calendarResult] = await Promise.allSettled([
    sendStatusEmail(reservation),
    syncReservationCalendar(reservation as CalendarReservation),
  ]);

  const emailError = emailResult.status === "rejected"
    ? emailResult.reason instanceof Error ? emailResult.reason.message : "Email delivery failed."
    : undefined;
  const calendarError = calendarResult.status === "rejected"
    ? calendarResult.reason instanceof Error ? calendarResult.reason.message : "Calendar sync failed."
    : undefined;

  return NextResponse.json({
    reservation: data,
    emailSent: emailResult.status === "fulfilled",
    emailError,
    calendarSynced: calendarResult.status === "fulfilled",
    calendar: calendarResult.status === "fulfilled" ? calendarResult.value : undefined,
    calendarError,
  });
}

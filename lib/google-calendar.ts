import { google, calendar_v3 } from "googleapis";

const TIME_ZONE = "Asia/Manila";
const DEFAULT_DURATION_MINUTES = 120;

export type CalendarReservation = {
  id: number;
  customer_name: string;
  email: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  special_requests: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
};

export type CalendarSyncResult = {
  action: "created" | "updated" | "deleted" | "unchanged";
  eventUrl?: string;
};

function getCalendarConfig() {
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!calendarId || !clientEmail || !privateKey) {
    throw new Error(
      "Google Calendar is not configured. Add GOOGLE_CALENDAR_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY."
    );
  }

  return { calendarId, clientEmail, privateKey };
}

function getDurationMinutes() {
  const configured = Number(process.env.RESERVATION_DURATION_MINUTES || DEFAULT_DURATION_MINUTES);
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_DURATION_MINUTES;
}

function getEventId(reservationId: number) {
  // Google event IDs accept lowercase base32hex characters (a-v and 0-9).
  return `kainanreservation${reservationId}`;
}

function getStartAndEnd(reservation: CalendarReservation) {
  const time = reservation.reservation_time.slice(0, 5);
  const startDate = new Date(`${reservation.reservation_date}T${time}:00+08:00`);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("The reservation has an invalid date or time.");
  }

  const endDate = new Date(startDate.getTime() + getDurationMinutes() * 60_000);
  return {
    start: `${reservation.reservation_date}T${time}:00+08:00`,
    end: endDate.toISOString(),
  };
}

function buildEvent(reservation: CalendarReservation): calendar_v3.Schema$Event {
  const { start, end } = getStartAndEnd(reservation);
  const details = [
    `Reservation #${reservation.id}`,
    `Customer: ${reservation.customer_name}`,
    `Guests: ${reservation.guests}`,
    `Phone: ${reservation.phone}`,
    `Email: ${reservation.email}`,
    reservation.special_requests ? `Special requests:\n${reservation.special_requests}` : null,
  ].filter(Boolean);

  return {
    summary: `Kainan Reservation #${reservation.id} - ${reservation.customer_name} (${reservation.guests} ${reservation.guests === 1 ? "guest" : "guests"})`,
    description: details.join("\n"),
    location: process.env.GOOGLE_CALENDAR_EVENT_LOCATION?.trim() || undefined,
    start: { dateTime: start, timeZone: TIME_ZONE },
    end: { dateTime: end, timeZone: TIME_ZONE },
    visibility: "private",
    transparency: "opaque",
    extendedProperties: {
      private: { reservationId: String(reservation.id), source: "kainan-website" },
    },
  };
}

function isGoogleNotFound(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: number; response?: { status?: number } };
  return candidate.code === 404 || candidate.response?.status === 404;
}

function getCalendarClient(clientEmail: string, privateKey: string) {
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  });
  return google.calendar({ version: "v3", auth });
}

export async function syncReservationCalendar(
  reservation: CalendarReservation
): Promise<CalendarSyncResult> {
  if (reservation.status === "completed") return { action: "unchanged" };

  const { calendarId, clientEmail, privateKey } = getCalendarConfig();
  const calendar = getCalendarClient(clientEmail, privateKey);
  const eventId = getEventId(reservation.id);

  if (reservation.status !== "confirmed") {
    try {
      await calendar.events.delete({ calendarId, eventId, sendUpdates: "none" });
      return { action: "deleted" };
    } catch (error) {
      if (isGoogleNotFound(error)) return { action: "unchanged" };
      throw error;
    }
  }

  const requestBody = buildEvent(reservation);

  try {
    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody,
      sendUpdates: "none",
    });
    return { action: "updated", eventUrl: response.data.htmlLink || undefined };
  } catch (error) {
    if (!isGoogleNotFound(error)) throw error;
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: { ...requestBody, id: eventId },
    sendUpdates: "none",
  });
  return { action: "created", eventUrl: response.data.htmlLink || undefined };
}

export function buildCustomerCalendarUrl(reservation: CalendarReservation) {
  const { start, end } = getStartAndEnd(reservation);
  const compact = (value: string) => value.replace(/[-:]/g, "").replace(/\.000Z$/, "Z");
  const startUtc = new Date(start).toISOString();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Reservation at Kainan sa Tabing Lawa",
    dates: `${compact(startUtc)}/${compact(end)}`,
    ctz: TIME_ZONE,
    details: `Reservation #${reservation.id} for ${reservation.guests} ${reservation.guests === 1 ? "guest" : "guests"}.`,
  });

  const location = process.env.GOOGLE_CALENDAR_EVENT_LOCATION?.trim();
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

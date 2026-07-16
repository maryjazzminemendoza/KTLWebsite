import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const statuses = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "completed", "cancelled"] as const;
type OrderStatus = (typeof statuses)[number];

type Order = {
  id: number;
  customer_name: string;
  email: string;
  order_type: "pickup" | "dine_in" | "delivery";
  status: OrderStatus;
  subtotal: number;
};

const statusCopy: Record<OrderStatus, { subject: string; message: string }> = {
  pending: { subject: "Your order is pending", message: "We received your order and it is waiting for confirmation." },
  confirmed: { subject: "Your order is confirmed", message: "Your order has been confirmed and will be prepared soon." },
  preparing: { subject: "We’re preparing your order", message: "Our kitchen is now preparing your order." },
  ready: { subject: "Your order is ready", message: "Your order is ready. Please collect it when convenient." },
  out_for_delivery: { subject: "Your order is out for delivery", message: "Your order is on its way to you." },
  completed: {
    subject: "Your order is complete",
    message: "Your order has been completed. Thank you for ordering from us! You can leave a review in My Orders to share your experience.",
  },
  cancelled: { subject: "Your order has been cancelled", message: "Your order has been cancelled. If this was unexpected, please contact us so we can help." },
};

function escapeHtml(value: string) {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
  return value.replace(/[&<>'"]/g, (character) => entities[character]);
}

function formatOrderType(type: Order["order_type"]) {
  if (type === "dine_in") return "Dine In";
  if (type === "delivery") return "Delivery";
  return "Pickup";
}

async function sendStatusEmail(order: Order) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;

  if (!host || !user || !password || !Number.isInteger(port)) {
    throw new Error("Email is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.");
  }

  const copy = statusCopy[order.status];
  const orderType = formatOrderType(order.order_type);
  const total = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(order.subtotal));
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass: password } });

  await transporter.sendMail({
    from: { name: "Kainan sa Tabing Lawa", address: user },
    to: order.email,
    subject: copy.subject,
    text: `Hi ${order.customer_name},\n\n${copy.message}\n\nOrder #${order.id}\n${orderType}\nTotal: ${total}`,
    html: `<div style="background:#f7f0e4;padding:32px 16px;font-family:Arial,sans-serif;color:#3b2716"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e4d6c0;border-radius:20px;padding:32px"><p style="color:#c28b38;font-weight:700;text-transform:uppercase;letter-spacing:.12em">Kainan sa Tabing Lawa</p><h1 style="font-size:28px;margin:16px 0">${escapeHtml(copy.subject)}</h1><p style="line-height:1.6">Hi ${escapeHtml(order.customer_name)},</p><p style="line-height:1.6">${escapeHtml(copy.message)}</p><div style="background:#f7f0e4;border-radius:14px;padding:18px;margin-top:24px;line-height:1.7"><strong>Order #${order.id}</strong><br>${escapeHtml(orderType)}<br>Total: ${escapeHtml(total)}</div></div></div>`,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", authData.user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  if (!body?.status || !statuses.includes(body.status as OrderStatus)) {
    return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  }

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });

  const { data, error } = await supabase.from("orders").update({ status: body.status }).eq("id", orderId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  try {
    await sendStatusEmail(data as Order);
    return NextResponse.json({ order: data, emailSent: true });
  } catch (emailError) {
    const message = emailError instanceof Error ? emailError.message : "Email delivery failed.";
    return NextResponse.json({ order: data, emailSent: false, emailError: message });
  }
}

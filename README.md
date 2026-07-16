This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Email notifications

Reservation status updates send customer emails through Nodemailer and your SMTP provider. Add these server-only values to `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Emails use “Kainan sa Tabing Lawa” as the sender name and `SMTP_USER` as the sender address. For Gmail, use a Google App Password rather than your normal account password. Other SMTP providers can be used by changing the host, port, and credentials. Port 465 uses a secure connection automatically; port 587 uses STARTTLS. If email delivery fails, the reservation status is still saved and the admin screen displays the delivery error.

## Google Calendar reservation sync

Confirmed reservations are created or updated on the restaurant calendar. Cancelling a reservation or moving it back to pending removes the event; completed reservations retain their historical event. Confirmed customer emails also include an **Add to Google Calendar** link. Configure these server-only values:

```env
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=calendar-sync@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
RESERVATION_DURATION_MINUTES=120
GOOGLE_CALENDAR_EVENT_LOCATION="Kainan sa Tabing Lawa, Rizal"
```

In Google Cloud, enable the Google Calendar API and create a service account with a JSON key. In Google Calendar, open the target calendar's settings and share it with the service account email with permission to make changes to events. Use the calendar ID shown under **Integrate calendar**. Keep the private key server-side and preserve its line breaks as `\n` in environment-variable dashboards.

`RESERVATION_DURATION_MINUTES` and `GOOGLE_CALENDAR_EVENT_LOCATION` are optional. Calendar events are private, use deterministic event IDs to prevent duplicates, and do not invite the customer as an attendee. If syncing fails, the reservation status and email outcome remain intact and the admin can use **Sync Google Calendar** to retry a confirmed booking.

## Reservation special-request analysis

Admins can generate a staff-facing analysis of a reservation's special request. Apply the Supabase migrations, then add this server-only value to `.env.local`:

```env
GEMINI_API_KEY=your-gemini-api-key
```

The analysis uses `gemini-3.5-flash` by default. It also respects the shared `GEMINI_MODEL` setting used by the contact-message assistant; set `GEMINI_RESERVATION_MODEL` only when reservations need a different compatible model. The result is advisory and never confirms, cancels, or otherwise changes a reservation automatically.

## Email verification

Customer account verification is handled by Supabase Auth. In the Supabase dashboard:

1. Enable **Confirm email** under Authentication settings.
2. Set the production **Site URL** and allow both callback URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.com/auth/callback`
3. Configure Supabase Custom SMTP with the restaurant's SMTP provider so verification emails use the branded sender.

## AI menu assistant

The menu page includes an AI assistant grounded in currently available Supabase menu items. Add these server-only values to `.env.local`:

```env
GEMINI_API_KEY=your-google-ai-studio-api-key
GEMINI_MODEL=gemini-3.5-flash
```

Never expose `GEMINI_API_KEY` through a `NEXT_PUBLIC_` environment variable. The assistant reloads the available menu for every request, validates recommended item IDs before returning them to the browser, and lets customers add recommendations to their cart.

The application sends customers through `/auth/callback` after they open a valid verification link. Never expose `SMTP_PASS` through a `NEXT_PUBLIC_` environment variable.

## AI admin tools

Customer-message analysis, reservation-request analysis, and the cached admin daily briefing use Gemini. Add these server-only values to `.env.local` and your production environment:

```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash
```

`GEMINI_BRIEFING_MODEL` can optionally override the model used for daily briefings. Apply the Supabase migrations before using the AI admin tools. Never expose the Gemini key through a `NEXT_PUBLIC_` variable.

## AI contact-message assistant

The admin contact-message page can summarize inquiries, assign a category and
priority, and prepare an editable reply draft. Apply the latest Supabase
migrations, then add these server-only values to `.env.local`:

```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash
```

Create the API key in Google AI Studio. `GEMINI_MODEL` is optional. AI drafts are never sent automatically; an admin
must review and send them. Never expose `GEMINI_API_KEY` through a
`NEXT_PUBLIC_` environment variable. The Gemini free tier has usage limits, and
Google states that free-tier content may be used to improve its products.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

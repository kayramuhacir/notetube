# NoteTube

Paste a YouTube link, pick a note style, get a structured PDF of notes.
Free tier: 1 PDF/day. Premium: unlimited, via Stripe subscription.

## Stack

Next.js (App Router, TypeScript) · Supabase (auth + Postgres + storage) ·
Stripe (subscriptions) · Anthropic API (note generation) ·
`youtube-transcript` (captions) · `@react-pdf/renderer` (PDF output)

## 1. Create accounts and collect keys

You need five things before this runs end-to-end. Do them in this order.

### Supabase

1. Go to [supabase.com](https://supabase.com), create a free account, and
   create a new project.
2. Once it's ready, open **SQL Editor -> New query**, paste in the contents
   of [`supabase/migration.sql`](supabase/migration.sql), and run it. This
   creates the `users`, `usage`, and `notes` tables, row-level security
   policies, and a private `notes-pdfs` storage bucket.
3. Go to **Authentication -> Providers**, enable **Email** (on by default)
   and **Google** (see Google Cloud steps below for the client ID/secret it
   asks for).
4. Go to **Project Settings -> API** and copy:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** -> `SUPABASE_SERVICE_ROLE_KEY` (keep this secret —
     it bypasses row-level security)

### Google Cloud (for "Continue with Google")

1. Go to the [Google Cloud Console](https://console.cloud.google.com/),
   create a project (or reuse one), and open
   **APIs & Services -> OAuth consent screen**. Fill in the basics and add
   your email as a test user if it's in testing mode.
2. Go to **APIs & Services -> Credentials -> Create Credentials -> OAuth
   client ID**, application type **Web application**.
3. Under **Authorized redirect URIs**, add:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
   (find `<your-project-ref>` in your Supabase project URL).
4. Copy the generated **Client ID** and **Client secret**, and paste them
   into Supabase's **Authentication -> Providers -> Google** config.

### Anthropic

1. Go to [console.anthropic.com](https://console.anthropic.com/settings/keys)
   and create an API key.
2. Copy it into `ANTHROPIC_API_KEY`.

### Stripe

1. Go to [stripe.com](https://stripe.com) and create an account (you'll need
   real bank details eventually to receive payouts, but test mode works
   without them).
2. In test mode, go to **Product catalog -> Add product**. Name it
   "Premium", set a recurring monthly price (e.g. $9/mo), and save.
3. Copy the price's ID (starts with `price_...`) into
   `STRIPE_PREMIUM_PRICE_ID`.
4. Go to **Developers -> API keys** and copy the **Secret key** into
   `STRIPE_SECRET_KEY`.
5. Set up the webhook:
   - **Locally**: install the [Stripe CLI](https://stripe.com/docs/stripe-cli),
     run `stripe listen --forward-to localhost:3000/api/stripe/webhook`. It
     prints a webhook signing secret (`whsec_...`) — put that in
     `STRIPE_WEBHOOK_SECRET`.
   - **In production** (after deploying): **Developers -> Webhooks -> Add
     endpoint**, URL `https://<your-domain>/api/stripe/webhook`, events
     `customer.subscription.created`, `customer.subscription.updated`,
     `customer.subscription.deleted`. Copy its signing secret into your
     Vercel env vars.

### Vercel (deploy)

1. Go to [vercel.com](https://vercel.com), create an account, and import
   this project's git repo.
2. In the project's **Settings -> Environment Variables**, add every
   variable listed below.
3. Deploy. Update `NEXT_PUBLIC_SITE_URL` to your real domain once you have
   one, and add the production Stripe webhook (previous step).

## 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in every value:

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase -> Project Settings -> API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase -> Project Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase -> Project Settings -> API (secret) |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `STRIPE_SECRET_KEY` | Stripe -> Developers -> API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI (`stripe listen`) or Webhooks dashboard |
| `STRIPE_PREMIUM_PRICE_ID` | Stripe -> Product catalog -> your price |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, your domain in prod |

## 3. Run locally

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000). To exercise the Premium
upgrade flow locally, also run `stripe listen --forward-to
localhost:3000/api/stripe/webhook` in a second terminal.

## Not included in v1

Team/shared accounts, admin dashboard, email notifications, mobile app,
support for videos without captions.

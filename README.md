# Creator Marketing

A marketplace for digital products with a built-in influencer promotion network. India first.

**Status: full pipeline in test mode.** Sellers list products and upload files, admins approve, influencers join and submit posts, sellers approve posts (which issues a tracked link and promo code), buyers check out, download and review, and every sale is split in the ledger. Checkout is a labelled **test payment**: orders and splits are real records, but no money moves until a payment gateway is connected.

Read `docs/decisions.md` first. It records every decision and overrides the original handoff PDF.

## What works today

| Area | State |
|------|-------|
| Public site: home, hubs, search, product pages with reviews | Working, reads live products from the database |
| Seller: products, file upload, submit for review, influencer requests, post approvals, orders and earnings, brand profile | Working |
| Influencer: find products, join or apply, submit posts, link and promo code, clicks, earnings, channels | Working |
| Buyer: checkout with promo code, receipt, library, downloads (60-second private links), reviews | Working (test payment) |
| Admin: review queue, users, orders and refunds, ledger, settings | Working |
| Real payments and payouts | Not built. Blocked on business registration and gateway approval (decisions, section C) |
| Emails for each event, guest checkout, cover image uploads | Not built yet |

## Putting it online (about 20 minutes, no coding)

1. **Supabase.** Create a free project at supabase.com. Open SQL Editor, paste the whole of `supabase/migrations/0001_foundation.sql`, press Run.
2. **Keys.** In Supabase, Project Settings > API: copy the Project URL and the anon (public) key.
3. **Vercel.** Import this project, then add the two keys from `.env.example` under Settings > Environment Variables. Deploy.
4. **Email links.** In Supabase, Authentication > URL Configuration: set Site URL to your Vercel address and add `https://YOUR-ADDRESS/auth/confirm` to Redirect URLs.
5. **Make yourself admin.** Sign up on the live site, then run the one-line `update` at the bottom of the migration file with your email.

## Running it on a computer

```
npm install
npm run dev
```

Then open http://localhost:3000.

## Where things are

```
app/                    pages (public, auth, dashboards)
components/             design system and shared pieces (ui.tsx is the core)
app/globals.css         colours and fonts
lib/site.ts             name, hubs, platforms, launch settings
lib/money.ts            the money split
app/actions.ts          every button's server-side action
supabase/migrations/    database setup
docs/decisions.md       decisions log
```

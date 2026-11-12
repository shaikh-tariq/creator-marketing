# Creator Marketing

A marketplace for digital products with a built-in influencer promotion network. India first.

**Status: Milestone M0 (foundation).** Public pages, design system, sign-up with roles, empty role dashboards and the first database migration. Listings shown are samples. No payments yet.

Read `docs/decisions.md` first. It records every decision and overrides the original handoff PDF.

## What works today

| Area | State |
|------|-------|
| Home, two live hubs, two "coming soon" hubs, product pages | Working, with sample listings |
| Sell and Promote pages, Terms / Privacy / Refunds drafts | Working |
| Sign-up, email verification, login, logout, roles | Working once Supabase is connected |
| Seller, influencer, buyer and admin dashboards | Empty shells with the three key numbers |
| Money split function (`lib/money.ts`) | Working and checked |
| Listings, checkout, downloads, ledger, influencer flow | Not built (M1 to M6) |

Without Supabase keys the site runs in **preview mode**: every page is visible, sign-up is switched off.

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
lib/sample-data.ts      sample listings (removed in M1)
supabase/migrations/    database setup
docs/decisions.md       decisions log
```

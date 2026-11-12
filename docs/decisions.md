# Creator Marketing — Decisions log (Handoff v1.1)

Updated 12 November 2026. This file overrides the v1.0 handoff PDF wherever the two disagree.
Nothing here is legal or tax advice. Items marked **CA** or **Lawyer** need a professional before real money moves.

## A. Founder decisions (12 Nov 2026)

| # | Decision | What it changes |
|---|----------|-----------------|
| 1 | Platform never holds funds. Every sale is split by a licensed payment gateway. | Manual "admin marks payout paid" is removed. The app only mirrors gateway transfers. See section C. |
| 2 | Launch platform fee is 3% (standard 8% later). | Replaces the 0% launch offer. Stored in `settings.platform_fee_pct`. |
| 3 | No refund window at launch. All sales are final. | See B6 for the exceptions that still have to exist. |
| 4 | Two hubs live, the rest shown as "coming soon". | Live: Design & Creative, Creators & Social Media. Coming soon: Productivity & Business, Students & Exams. |
| 5 | Influencers can post on Instagram, LinkedIn, Pinterest, X and Facebook. | New `influencer_channels` table; every submission records its platform. YouTube and TikTok fields removed. |
| 6 | Name: Creator Marketing. | Working name used across the site. Trademark and domain search still to do. |

## B. Contradictions fixed

**B1. Money custody vs manual payouts.** v1.0 said the gateway holds funds and also that the admin pays people by hand. Now: gateway split only. Sellers and influencers complete the gateway's KYC and get paid by the gateway. The `payouts` table becomes `transfers` (a read-only mirror of gateway transfer status). The "request withdrawal" screen is removed.

**B2. Launch fee vs gateway fee.** At 3%, absorbing a gateway fee of roughly 2% + GST would leave about 0.6% per sale. Default changed: the gateway fee is deducted from the seller's share at actual cost, shown as its own line on every order. Switch: `settings.gateway_fee_borne_by` (`seller` or `platform`).

**B3. Two discount fields.** Only one discount exists now: the promo-code discount. The seller sets `promo_discount_pct` on the product (0 allowed); it is copied onto each tracking link at approval. No stacking. The seller funds the discount (commission and fees are calculated on the discounted amount).

**B4. `requires_approval` meant two things.** Split into:
- `join_mode`: `open` (any influencer can join) or `apply` (seller accepts first).
- Content approval is always required. No link or code is issued until the seller approves the submission. This is the product's differentiator and cannot be switched off.

**B5. Reminder timing.** One rule: reminder to the seller at 48 hours, second reminder plus admin escalation at 72 hours. No auto-approval.

**B6. Refunds.** No refund window; sales are final. Three things still stay, because they are not optional:
- Admin can refund when the file was never delivered, is corrupt, is materially not as described, or the buyer paid twice.
- Chargebacks and UPI disputes happen regardless of policy. They write reversing ledger entries.
- A published refund policy and a grievance contact are expected of Indian e-commerce sites. **Lawyer**

**B7. Hold period.** No longer tied to a refund window. Gateway transfers are held 14 days after the sale (`settings.hold_days`) so a dispute can be reversed before money leaves. Review after the first 100 orders.

**B8. Guest checkout vs My Library and reviews.** Guest orders are tied to the buyer's email. The receipt carries a magic link that opens the library; the first click creates the account. Reviews need that login.

**B9. Cart.** Removed from the MVP. Direct buy of one product only.

**B10. Gateway fee in the ledger.** New entry kind `gateway_fee`, so daily reconciliation can match gateway settlements.

**B11. Self-referral.** Blocked when buyer and influencer share an account, email or phone number. "Payment fingerprint" is dropped; UPI does not expose one reliably.

**B12. "Verified performance data".** Reworded to "tracked sales data": clicks and paid orders per link and code. Reach and views are not verified until platform OAuth exists (post-MVP).

## C. Payments: the blocker to clear before Milestone M2

Checked against Razorpay's Route documentation on 12 Nov 2026:

- Route (the split product) now requires either domestic turnover above ₹40 lakh, or export turnover above ₹5 lakh, with a self-declaration route for first-year or GST-exempt businesses.
- It also requires that the account receiving a split is the party directly supplying the goods to the customer. Sellers fit that. **Influencers may not** (they serve the seller, not the buyer).
- A registered business and gateway approval are needed either way.

Actions for the founder:
1. Register the business (question 3 of the handoff is now urgent). **CA**
2. Email Razorpay and Cashfree with the exact use case and ask in writing: can a first-year business use the split product, and can influencer commissions be a split leg?
3. If the influencer leg is refused, the fallback that still keeps the platform out of the money: the split pays the seller and the platform only, and the influencer commission is paid by the seller through the gateway's payout product on a monthly statement the platform generates. **Lawyer**

Nothing in M0 or M1 depends on the answer.

## D. Gaps closed

| Gap | Decision |
|-----|----------|
| Chargebacks | Reverse entries. If the transfer is still on hold, reverse it at the gateway. If already settled, negative balance recovered from later sales. |
| Partial refunds | Not in MVP. Full refunds only. |
| Content rights | The influencer owns the content. Approval grants the seller a licence to repost it with credit. Rejected content may not be used by the seller. Goes into both agreements. **Lawyer** |
| Agreements | Seller agreement and influencer agreement accepted at sign-up (timestamp stored). **Lawyer** |
| PAN and bank details | Collected by the gateway's KYC, not stored by us. We store only the gateway account id and KYC status. |
| Invoices | The seller is the supplier to the buyer. The platform invoices the seller for its fee. **CA** |
| Tax to confirm | TDS under 194-O, TDS on influencer commission, GST TCS under section 52, GST on the platform fee. **CA** |
| Data protection (DPDP Act) | Consent tick at sign-up, privacy page, click log stores a session id only. **Lawyer** |
| Disclosure | Every submission needs the paid-partnership / #ad tick, on all five platforms. |
| Students hub | When it opens: notes, planners and flashcards only. No previous-year papers (copyright). |
| Stolen products | Seller warrants ownership; takedown email on every product page; admin can unpublish. |

## E. Money formula (v1.1)

All values are integers in paise.

```
net_amount      = list_price - promo_discount
platform_fee    = round(net_amount * platform_fee_pct)
influencer_comm = round(net_amount * commission_pct)      (0 without an influencer)
gateway_fee     = round(net_amount * gateway_fee_pct)      (estimate until the gateway reports actual)
seller_earning  = net_amount - platform_fee - influencer_comm - gateway_fee   (when the seller bears the gateway fee)
```

Example at launch settings: list ₹1,000, 10% code, 3% platform fee, 20% commission, 2.36% gateway estimate:
net ₹900.00, platform ₹27.00, influencer ₹180.00, gateway ₹21.24, seller ₹671.76.

Implemented in `lib/money.ts`.

## F. Data model changes from v1.0

- `products`: `requires_approval` → `join_mode`; `buyer_discount_pct` → `promo_discount_pct`.
- `influencer_profiles`: per-platform URL columns removed. New `influencer_channels` (user, platform, profile URL, follower range).
- `submissions`: add `platform`.
- `hubs`: add `status` (`live`, `coming_soon`).
- `seller_profiles` / `influencer_profiles`: `payout_details` removed; add `gateway_account_id`, `kyc_status`.
- `payouts` → `transfers` (gateway transfer id, status, on-hold-until).
- `ledger_entries.kind`: add `gateway_fee`, `chargeback_reversal`.
- `settings`: add `gateway_fee_borne_by`, `gateway_fee_est_pct`; `refund_window_days` = 0.

## G. Build order (revised)

| Milestone | Status |
|-----------|--------|
| M0 Foundation: app, design system, public pages, sign-up with roles, role dashboards, first migration | Built 12 Nov 2026 |
| M1 Catalog: real listings, file upload, admin review queue | Next |
| M2 Checkout | Blocked until section C is answered |
| M3 to M7 | As in the handoff, with the changes above |

Honest timeline for evening work: 4 to 6 months to a private beta, not 8 to 12 weeks.

## H. Still open

1. Business registration and GST status.
2. Razorpay or Cashfree (decided by their written answers to section C).
3. Commission limits. Default 10% to 40%.
4. Domain and trademark check for the name.

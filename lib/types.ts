export type Product = {
  id: string;
  seller_id: string;
  hub_id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  format: string;
  includes: string[];
  price_paise: number;
  commission_pct: number;
  promo_discount_pct: number;
  join_mode: "open" | "apply";
  brief_text: string;
  license_text: string;
  art: number;
  status: "draft" | "pending_review" | "published" | "paused" | "rejected" | "archived";
  rejected_reason: string | null;
  created_at: string;
  seller_profiles?: { brand_name: string | null } | null;
  hubs?: { name: string; slug: string } | null;
};

export type LedgerEntry = { amount_paise: number; available_at: string; kind: string; account_type: string };

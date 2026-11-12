// SAMPLE LISTINGS. These are placeholders so the pages can be designed and tested.
// They are labelled "Sample" on the site and are replaced by real database listings in Milestone M1.

export type SampleProduct = {
  slug: string;
  title: string;
  hubSlug: string;
  seller: string;
  pricePaise: number;
  commissionPct: number;
  promoDiscountPct: number;
  format: string;
  summary: string;
  includes: string[];
  brief: string;
  art: 0 | 1 | 2 | 3;
};

export const sampleProducts: SampleProduct[] = [
  {
    slug: "studio-brand-kit-canva",
    title: "Studio Brand Kit for Canva",
    hubSlug: "design-creative",
    seller: "Sample Studio",
    pricePaise: 99900,
    commissionPct: 25,
    promoDiscountPct: 10,
    format: "Canva",
    summary: "A complete brand starter: logo layouts, colour system, 40 post templates and a one-page style guide.",
    includes: ["12 logo layouts", "40 social post templates", "Style guide page", "Commercial licence"],
    brief: "Show the kit being customised for a real small business in under a minute.",
    art: 0,
  },
  {
    slug: "warm-film-presets",
    title: "Warm Film Lightroom Presets",
    hubSlug: "design-creative",
    seller: "Sample Studio",
    pricePaise: 49900,
    commissionPct: 30,
    promoDiscountPct: 10,
    format: "Lightroom",
    summary: "Twelve mobile and desktop presets tuned for Indian skin tones and harsh afternoon light.",
    includes: ["12 presets (DNG + XMP)", "Install guide", "Before and after examples"],
    brief: "Before and after on your own photos. No stock images.",
    art: 1,
  },
  {
    slug: "saas-landing-figma-kit",
    title: "SaaS Landing Page Kit for Figma",
    hubSlug: "design-creative",
    seller: "Sample Studio",
    pricePaise: 149900,
    commissionPct: 20,
    promoDiscountPct: 10,
    format: "Figma",
    summary: "Sixty responsive sections with auto layout and variables, ready to hand to a developer.",
    includes: ["60 sections", "Light and dark styles", "Component library", "Free updates"],
    brief: "Build one landing page on screen from the kit. LinkedIn carousels work well.",
    art: 2,
  },
  {
    slug: "packaging-mockup-set",
    title: "Kraft Packaging Mockup Set",
    hubSlug: "design-creative",
    seller: "Sample Studio",
    pricePaise: 79900,
    commissionPct: 25,
    promoDiscountPct: 0,
    format: "Photoshop",
    summary: "Fifteen high-resolution box, pouch and label mockups with smart objects.",
    includes: ["15 PSD mockups", "6000 px wide", "Smart objects"],
    brief: "Drop your own client label into a mockup and show the result.",
    art: 3,
  },
  {
    slug: "reel-hooks-caption-pack",
    title: "300 Reel Hooks & Caption Pack",
    hubSlug: "creators-social",
    seller: "Sample Studio",
    pricePaise: 29900,
    commissionPct: 35,
    promoDiscountPct: 10,
    format: "PDF + Notion",
    summary: "Hooks and captions sorted by niche and goal, in English and Hinglish.",
    includes: ["300 hooks", "120 caption frameworks", "Notion database"],
    brief: "Pick one hook from the pack and use it as the hook of your own reel.",
    art: 1,
  },
  {
    slug: "90-day-content-calendar",
    title: "90-Day Content Calendar System",
    hubSlug: "creators-social",
    seller: "Sample Studio",
    pricePaise: 59900,
    commissionPct: 30,
    promoDiscountPct: 10,
    format: "Notion + Sheets",
    summary: "Plan, batch and track three months of posts across five platforms.",
    includes: ["Notion workspace", "Google Sheets version", "Festival and event dates for India"],
    brief: "Screen-record your own week planned inside the calendar.",
    art: 2,
  },
  {
    slug: "creator-media-kit",
    title: "Creator Media Kit Templates",
    hubSlug: "creators-social",
    seller: "Sample Studio",
    pricePaise: 39900,
    commissionPct: 30,
    promoDiscountPct: 0,
    format: "Canva",
    summary: "Five media kit layouts with rate card and case study pages brands actually ask for.",
    includes: ["5 layouts", "Rate card page", "Brand pitch email script"],
    brief: "Show your own media kit made from the template (blur your rates if you like).",
    art: 0,
  },
  {
    slug: "carousel-system-canva",
    title: "Carousel System: 50 Slide Layouts",
    hubSlug: "creators-social",
    seller: "Sample Studio",
    pricePaise: 69900,
    commissionPct: 25,
    promoDiscountPct: 10,
    format: "Canva",
    summary: "Editorial carousel layouts for Instagram and LinkedIn with a matching cover system.",
    includes: ["50 slide layouts", "10 cover styles", "Font pairing guide"],
    brief: "Post a carousel built with the system and mention it in the last slide.",
    art: 3,
  },
];

export function productsInHub(hubSlug: string) {
  return sampleProducts.filter((p) => p.hubSlug === hubSlug);
}

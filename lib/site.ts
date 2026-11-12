// One place for the site's name, hubs, platforms and launch settings.
// The database (settings table) holds the same values once Supabase is connected.

export const site = {
  name: "Creator Marketing",
  tagline: "Digital products, promoted by creators",
  description:
    "A marketplace for templates, presets and creator tools from Indian makers, with a built-in network of influencers who promote them for commission.",
  supportEmail: "hello@creatormarketing.example", // TODO: replace once the domain is bought
};

export type Hub = {
  slug: string;
  name: string;
  status: "live" | "coming_soon";
  blurb: string;
  examples: string[];
};

export const hubs: Hub[] = [
  {
    slug: "design-creative",
    name: "Design & Creative",
    status: "live",
    blurb: "Templates and assets for people who make things look good.",
    examples: ["Canva templates", "Figma kits", "Lightroom presets", "Mockups", "Fonts"],
  },
  {
    slug: "creators-social",
    name: "Creators & Social Media",
    status: "live",
    blurb: "Everything a creator needs to post better and more often.",
    examples: ["Reel templates", "Caption packs", "Content calendars", "Media kits"],
  },
  {
    slug: "productivity-business",
    name: "Productivity & Business",
    status: "coming_soon",
    blurb: "Notion systems, trackers, resume packs and pitch decks.",
    examples: ["Notion templates", "Excel trackers", "Resume packs", "Pitch decks"],
  },
  {
    slug: "students",
    name: "Students & Exams",
    status: "coming_soon",
    blurb: "Original notes, planners and flashcards made by toppers and tutors.",
    examples: ["Study notes", "Planners", "Flashcards"],
  },
];

export const liveHubs = hubs.filter((h) => h.status === "live");

// Where influencers can post. Link notes guide the attribution design (docs/decisions.md).
export const platforms = [
  { id: "instagram", name: "Instagram", formats: "Reels, carousels, stories", link: "Promo code and bio link" },
  { id: "linkedin", name: "LinkedIn", formats: "Posts, carousels, video", link: "Link in the post or first comment" },
  { id: "pinterest", name: "Pinterest", formats: "Pins and idea pins", link: "Every pin links straight to the product" },
  { id: "x", name: "X", formats: "Posts and threads", link: "Link in the post" },
  { id: "facebook", name: "Facebook", formats: "Reels, posts, groups", link: "Link in the post" },
] as const;

export type PlatformId = (typeof platforms)[number]["id"];

// Launch settings (percentages as plain numbers, e.g. 3 means 3%).
export const launchSettings = {
  platformFeePct: 3,
  standardPlatformFeePct: 8,
  gatewayFeeEstPct: 2.36, // roughly 2% + 18% GST; replaced by the gateway's actual figure per order
  gatewayFeeBorneBy: "seller" as "seller" | "platform",
  holdDays: 14,
  commissionMinPct: 10,
  commissionMaxPct: 40,
};

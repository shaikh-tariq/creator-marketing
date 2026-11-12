import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Notice } from "@/components/ui";
import { launchSettings, site } from "@/lib/site";

// DRAFT policy pages. Plain-language placeholders that state the decided rules.
// A lawyer must review and replace these before the site takes real money.

const docs: Record<string, { title: string; sections: { h: string; p: string }[] }> = {
  terms: {
    title: "Terms of use",
    sections: [
      { h: "What this site is", p: `${site.name} is a marketplace where sellers list digital products, influencers promote them for commission, and buyers purchase and download them.` },
      { h: "Sellers", p: "You must own or hold the rights to everything you list. Copied or stolen work is removed and the account can be suspended." },
      { h: "Influencers", p: "Posts need the seller's approval and a clear paid-partnership disclosure. Buying through your own link or code cancels the commission. You keep ownership of your content; approval lets the seller repost it with credit." },
      { h: "Payments", p: `Payments are processed by a licensed payment gateway, which splits each sale between the seller, the influencer and the platform. Shares are released ${launchSettings.holdDays} days after the sale.` },
      { h: "Fees", p: `The platform fee is ${launchSettings.platformFeePct}% of each sale during the launch period. Changes are announced in advance.` },
    ],
  },
  privacy: {
    title: "Privacy",
    sections: [
      { h: "What we collect", p: "Your name, email and role when you sign up; the social profile links influencers add; order details when you buy." },
      { h: "What we do not collect", p: "Card, UPI, bank or identity documents. Those are handled by the payment gateway." },
      { h: "Link tracking", p: "When you arrive through a creator's link we store an anonymous session id for up to 30 days so the creator can be credited." },
      { h: "Your choices", p: `You can ask for a copy of your data or for your account to be deleted by writing to ${site.supportEmail}.` },
    ],
  },
  refunds: {
    title: "Refunds",
    sections: [
      { h: "Digital products are final sale", p: "Because files are delivered instantly, there is no refund window and no change-of-mind refund." },
      { h: "When we do refund", p: "If the file was not delivered, is corrupt, is materially different from its description, or you were charged twice, we fix it or refund you in full." },
      { h: "How to ask", p: `Write to ${site.supportEmail} with your order email. We reply within two working days.` },
    ],
  },
};

type Props = { params: Promise<{ doc: string }> };

export function generateStaticParams() {
  return Object.keys(docs).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { doc } = await params;
  return { title: docs[doc]?.title ?? "Policy" };
}

export default async function LegalPage({ params }: Props) {
  const { doc } = await params;
  const page = docs[doc];
  if (!page) notFound();

  return (
    <Container className="max-w-3xl py-14 sm:py-20">
      <h1 className="text-5xl">{page.title}</h1>
      <div className="mt-6">
        <Notice>Draft. This page states the intended rules and has not yet been reviewed by a lawyer.</Notice>
      </div>
      <div className="mt-10 divide-y divide-line border-y border-line">
        {page.sections.map((s) => (
          <section key={s.h} className="py-7">
            <h2 className="text-2xl">{s.h}</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{s.p}</p>
          </section>
        ))}
      </div>
    </Container>
  );
}

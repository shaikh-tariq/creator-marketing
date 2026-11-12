// Money rules. Every amount is an integer number of paise (₹1 = 100 paise).
// Never use decimals for money. See docs/decisions.md, section E.

export type SplitInput = {
  listPricePaise: number;
  promoDiscountPct: number; // 0 when no promo code was used
  platformFeePct: number;
  commissionPct: number; // 0 when no influencer is credited
  gatewayFeePct: number;
  gatewayFeeBorneBy: "seller" | "platform";
};

export type SplitResult = {
  listPricePaise: number;
  discountPaise: number;
  netPaise: number;
  platformFeePaise: number;
  influencerCommissionPaise: number;
  gatewayFeePaise: number;
  sellerEarningPaise: number;
  platformNetPaise: number; // what the platform keeps after paying the gateway, if it bears that fee
};

// Percentages become basis points (1% = 100) so the maths stays in whole numbers.
function pctOf(amountPaise: number, pct: number): number {
  const basisPoints = Math.round(pct * 100);
  return Math.round((amountPaise * basisPoints) / 10000);
}

export function split(input: SplitInput): SplitResult {
  const discountPaise = pctOf(input.listPricePaise, input.promoDiscountPct);
  const netPaise = input.listPricePaise - discountPaise;
  const platformFeePaise = pctOf(netPaise, input.platformFeePct);
  const influencerCommissionPaise = pctOf(netPaise, input.commissionPct);
  const gatewayFeePaise = pctOf(netPaise, input.gatewayFeePct);
  const sellerPaysGateway = input.gatewayFeeBorneBy === "seller";

  const sellerEarningPaise =
    netPaise - platformFeePaise - influencerCommissionPaise - (sellerPaysGateway ? gatewayFeePaise : 0);

  if (sellerEarningPaise < 0) {
    throw new Error("Split would leave the seller with a negative amount");
  }

  return {
    listPricePaise: input.listPricePaise,
    discountPaise,
    netPaise,
    platformFeePaise,
    influencerCommissionPaise,
    gatewayFeePaise,
    sellerEarningPaise,
    platformNetPaise: platformFeePaise - (sellerPaysGateway ? 0 : gatewayFeePaise),
  };
}

export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

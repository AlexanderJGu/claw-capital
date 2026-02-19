import { NextResponse } from "next/server";

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  HYPE: "hyperliquid",
  AAVE: "aave",
  MORPHO: "morpho",
  PENDLE: "pendle",
  LIT: "lighter",
  ETHFI: "ether-fi",
  SKY: "sky",
  SYRUP: "syrup",
  VVV: "venice-token",
};

export const revalidate = 60;

export async function GET() {
  const ids = Object.values(COINGECKO_IDS).join(",");
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();

    const prices: Record<string, number> = {};
    for (const [sym, geckoId] of Object.entries(COINGECKO_IDS)) {
      if (data[geckoId]?.usd) {
        prices[sym] = data[geckoId].usd;
      }
    }
    return NextResponse.json(prices);
  } catch {
    return NextResponse.json({}, { status: 502 });
  }
}

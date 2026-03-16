import { BitcoinPrice, PriceCandle, VolatilityMetrics } from "@/types";
import { SEED_BITCOIN_PRICE, SEED_PRICE_HISTORY, SEED_VOLATILITY, addNoise, simulatePriceTick } from "@/data/seed-data";
import { annualizedVolatility } from "@/utils";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const cache: { data: BitcoinPrice | null; fetchedAt: number } = { data: null, fetchedAt: 0 };
let _simulatedPrice = SEED_BITCOIN_PRICE.price;

function getSimulatedPrice(): BitcoinPrice {
  _simulatedPrice = simulatePriceTick(_simulatedPrice);
  const change24h = _simulatedPrice - SEED_BITCOIN_PRICE.price;
  return {
    ...SEED_BITCOIN_PRICE, price: _simulatedPrice,
    priceChange24h: change24h,
    priceChangePct24h: (change24h / SEED_BITCOIN_PRICE.price) * 100,
    high24h: Math.max(SEED_BITCOIN_PRICE.high24h, _simulatedPrice),
    low24h:  Math.min(SEED_BITCOIN_PRICE.low24h,  _simulatedPrice),
    volume24h: Math.round(addNoise(SEED_BITCOIN_PRICE.volume24h, 0.02)),
    timestamp: Date.now(), source: "simulated",
  };
}

export async function fetchBitcoinPrice(): Promise<BitcoinPrice> {
  if (DEMO_MODE) return getSimulatedPrice();
  if (cache.data && Date.now() - cache.fetchedAt < 15000) return { ...cache.data, source: "coingecko_cached" };
  try {
    const resp = await fetch(`${COINGECKO_BASE}/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`, { next: { revalidate: 15 } });
    if (!resp.ok) throw new Error("error");
    const data = await resp.json();
    const m = data.market_data;
    const result: BitcoinPrice = {
      price: m.current_price.usd, priceChange24h: m.price_change_24h,
      priceChangePct24h: m.price_change_percentage_24h,
      high24h: m.high_24h.usd, low24h: m.low_24h.usd,
      volume24h: m.total_volume.usd, marketCap: m.market_cap.usd,
      dominance: 54, ath: m.ath.usd, athChangePct: m.ath_change_percentage.usd,
      timestamp: Date.now(), source: "coingecko_live",
    };
    cache.data = result; cache.fetchedAt = Date.now();
    return result;
  } catch { return getSimulatedPrice(); }
}

export async function fetchPriceHistory(days = 365): Promise<PriceCandle[]> {
  if (DEMO_MODE) return SEED_PRICE_HISTORY.slice(-days);
  try {
    const resp = await fetch(`${COINGECKO_BASE}/coins/bitcoin/ohlc?vs_currency=usd&days=${days}`, { next: { revalidate: 3600 } });
    if (!resp.ok) throw new Error("error");
    const raw: [number,number,number,number,number][] = await resp.json();
    return raw.map(([ts,open,high,low,close]) => ({ timestamp:ts, open, high, low, close, volume:0 }));
  } catch { return SEED_PRICE_HISTORY.slice(-days); }
}

export function calculateVolatility(candles: PriceCandle[]): VolatilityMetrics {
  if (candles.length < 10) return { ...SEED_VOLATILITY, timestamp: Date.now() };
  const closes = candles.map(c => c.close);
  const makeReturns = (n: number) => closes.slice(-n).map((c,i,arr) => i===0 ? 0 : (c-arr[i-1])/arr[i-1]).slice(1);
  const last14 = candles.slice(-14);
  const atr = last14.reduce((a,c) => a + (c.high - c.low), 0) / last14.length;
  return {
    historicalVolatility7d:  annualizedVolatility(makeReturns(8)),
    historicalVolatility30d: annualizedVolatility(makeReturns(31)),
    historicalVolatility90d: annualizedVolatility(makeReturns(91)),
    atr14d: Math.round(atr), timestamp: Date.now(),
  };
}
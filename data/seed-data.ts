import { BitcoinPrice, MacroData, OnChainData, PriceCandle, FearGreedIndex, VolatilityMetrics } from "../types";

export const SEED_BITCOIN_PRICE: BitcoinPrice = {
  price: 97420, priceChange24h: 1832, priceChangePct24h: 1.92,
  high24h: 98750, low24h: 95100, volume24h: 42800000000,
  marketCap: 1923000000000, dominance: 54.3, ath: 109350,
  athChangePct: -10.9, timestamp: Date.now(), source: "simulated",
};

export const SEED_MACRO_DATA: MacroData = {
  m2GlobalGrowthYoy: 5.2, m2UsaGrowthYoy: 3.8, fedFundsRate: 4.50,
  cpiYoy: 2.9, realRateApprox: 1.60, dxy: 104.2, dxyChange1m: -1.8,
  sp500: 5650, sp500Change1m: 3.2, nasdaq: 18400, nasdaqChange1m: 4.1,
  goldPrice: 2650, goldChange1m: 2.3, us10yYield: 4.28, us2yYield: 4.55,
  yieldCurveSpread: -0.27, timestamp: Date.now(), source: "simulated",
};

export const SEED_ONCHAIN_DATA: OnChainData = {
  mvrv: 2.1, nupl: 0.52, realizedPrice: 46500, sopr: 1.02,
  hashrate: 750, hashrateChange30d: 8.2, activeAddresses: 910000,
  activeAddressesChange30d: 3.5, exchangeNetFlow30d: -28500,
  etfNetFlow30d: 1240, lightningCapacity: 5320,
  timestamp: Date.now(), source: "simulated",
};

export const SEED_FEAR_GREED: FearGreedIndex = {
  value: 68, label: "Greed", timestamp: Date.now(), source: "simulated",
};

export const SEED_VOLATILITY: VolatilityMetrics = {
  historicalVolatility7d: 58, historicalVolatility30d: 52,
  historicalVolatility90d: 62, atr14d: 2850, timestamp: Date.now(),
};

function generatePriceHistory(): PriceCandle[] {
  const candles: PriceCandle[] = [];
  const now = Date.now();
  const dayMs = 86400000;
  const priceSequence = [
    42000,44500,43200,46800,48200,47100,50300,52100,55400,54200,
    58700,61200,59800,63400,65000,62300,67800,71200,69500,73800,
    76400,74200,79500,82100,80300,84700,87200,85600,89100,91400,
    88700,93200,95800,94100,97420,
  ];
  const days = 365;
  const allPrices: number[] = [];
  let currentPrice = 38000;
  for (let i = days - priceSequence.length; i > 0; i--) {
    const noise = (Math.random() - 0.48) * 0.025;
    currentPrice = Math.max(25000, Math.min(50000, currentPrice * (1 + noise)));
    allPrices.push(currentPrice);
  }
  allPrices.push(...priceSequence);
  allPrices.forEach((closePrice, idx) => {
    const ts = now - (days - idx) * dayMs;
    const v = 0.025;
    candles.push({
      timestamp: ts,
      open: Math.round(idx === 0 ? closePrice : allPrices[idx-1] * (1+(Math.random()-0.5)*0.01)),
      high: Math.round(closePrice * (1 + Math.random() * v)),
      low:  Math.round(closePrice * (1 - Math.random() * v)),
      close: Math.round(closePrice),
      volume: Math.round(30000000000 + Math.random() * 20000000000),
    });
  });
  return candles;
}
export const SEED_PRICE_HISTORY = generatePriceHistory();

export function addNoise(value: number, maxPct = 0.001): number {
  return value * (1 + (Math.random() - 0.5) * 2 * maxPct);
}
export function simulatePriceTick(lastPrice: number): number {
  const shock = (Math.random() - 0.5) * 2 * 0.0008;
  const meanRev = (97420 - lastPrice) / 97420 * 0.0001;
  return Math.round(lastPrice * (1 + 0.00002 + shock + meanRev));
}
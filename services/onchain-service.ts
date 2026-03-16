import { OnChainData, FearGreedIndex } from "@/types";
import { SEED_ONCHAIN_DATA, SEED_FEAR_GREED, addNoise } from "@/data/seed-data";

const cache: { data: FearGreedIndex | null; fetchedAt: number } = { data: null, fetchedAt: 0 };

export async function fetchOnChainData(): Promise<OnChainData> {
  return {
    ...SEED_ONCHAIN_DATA,
    mvrv:  parseFloat(addNoise(SEED_ONCHAIN_DATA.mvrv,  0.005).toFixed(3)),
    nupl:  parseFloat(addNoise(SEED_ONCHAIN_DATA.nupl,  0.003).toFixed(3)),
    sopr:  parseFloat(addNoise(SEED_ONCHAIN_DATA.sopr,  0.002).toFixed(3)),
    activeAddresses: Math.round(addNoise(SEED_ONCHAIN_DATA.activeAddresses, 0.01)),
    timestamp: Date.now(), source: "simulated",
  };
}

export async function fetchFearGreedIndex(): Promise<FearGreedIndex> {
  if (cache.data && Date.now() - cache.fetchedAt < 600000) return cache.data;
  try {
    const resp = await fetch("https://api.alternative.me/fng/?limit=1", { next: { revalidate: 600 } });
    if (!resp.ok) throw new Error("error");
    const data = await resp.json();
    const item = data.data[0];
    const result: FearGreedIndex = {
      value: parseInt(item.value, 10), label: item.value_classification,
      timestamp: parseInt(item.timestamp, 10) * 1000, source: "alternative_me",
    };
    cache.data = result; cache.fetchedAt = Date.now();
    return result;
  } catch {
    return { ...SEED_FEAR_GREED, value: Math.round(addNoise(SEED_FEAR_GREED.value, 0.02)), timestamp: Date.now(), source: "simulated" };
  }
}
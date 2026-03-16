import { MacroData } from "@/types";
import { SEED_MACRO_DATA, addNoise } from "@/data/seed-data";

export async function fetchMacroData(): Promise<MacroData> {
  return {
    ...SEED_MACRO_DATA,
    dxy: parseFloat(addNoise(SEED_MACRO_DATA.dxy, 0.002).toFixed(2)),
    sp500: Math.round(addNoise(SEED_MACRO_DATA.sp500, 0.003)),
    nasdaq: Math.round(addNoise(SEED_MACRO_DATA.nasdaq, 0.004)),
    goldPrice: Math.round(addNoise(SEED_MACRO_DATA.goldPrice, 0.003)),
    timestamp: Date.now(), source: "simulated",
  };
}
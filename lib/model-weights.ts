export const SUB_MODEL_WEIGHTS = {
  macro: 0.20, liquidity: 0.20, cycle: 0.20,
  valuation: 0.15, momentum: 0.15, onchain: 0.10,
} as const;

export const SCENARIO_PROBABILITY_TABLE: [number, number, number, number, number][] = [
  [0,  10, 0.05, 0.20, 0.75], [10, 20, 0.08, 0.25, 0.67],
  [20, 30, 0.12, 0.30, 0.58], [30, 40, 0.18, 0.37, 0.45],
  [40, 50, 0.25, 0.45, 0.30], [50, 60, 0.35, 0.45, 0.20],
  [60, 70, 0.48, 0.38, 0.14], [70, 80, 0.58, 0.32, 0.10],
  [80, 90, 0.68, 0.25, 0.07], [90,100, 0.78, 0.17, 0.05],
];

export const FORECAST_RETURNS: Record<string, {
  bull: { mean: number; std: number };
  base: { mean: number; std: number };
  bear: { mean: number; std: number };
}> = {
  "24h": { bull:{mean:3.5,std:2},  base:{mean:0.2,std:1.5}, bear:{mean:-3,std:2.5} },
  "7d":  { bull:{mean:12,std:6},   base:{mean:1.5,std:5},   bear:{mean:-10,std:8}  },
  "30d": { bull:{mean:28,std:15},  base:{mean:3,std:12},    bear:{mean:-22,std:16} },
  "90d": { bull:{mean:65,std:30},  base:{mean:8,std:25},    bear:{mean:-35,std:28} },
  "1y":  { bull:{mean:180,std:80}, base:{mean:20,std:60},   bear:{mean:-55,std:40} },
};

export const MACRO_PARAMS = {
  realRateBullishThreshold: -1.0, realRateBearishThreshold: 2.0,
  dxyBullishThreshold: -2.0, dxyBearishThreshold: 2.0,
  yieldCurveBullishThreshold: 0.5, yieldCurveBearishThreshold: -0.5,
  m2GrowthBullishThreshold: 4.0, m2GrowthBearishThreshold: -2.0,
};

export const VALUATION_PARAMS = {
  mvrvOverbought: 3.5, mvrvFairHigh: 2.0, mvrvFairLow: 1.0, mvrvOversold: 0.7,
  nuplEuphoria: 0.75, nuplBullish: 0.50, nuplBearish: 0.25, nuplCapitulation: 0.0,
  powerLawOverbought: 50, powerLawOversold: -40,
};

export const CYCLE_PARAMS = {
  halvingCycleDays: 1460,
  phases: {
    accumulation:   { start:0,    end:200  },
    early_markup:   { start:200,  end:400  },
    markup:         { start:400,  end:700  },
    late_markup:    { start:700,  end:900  },
    distribution:   { start:900,  end:1050 },
    early_markdown: { start:1050, end:1200 },
    markdown:       { start:1200, end:1350 },
    capitulation:   { start:1350, end:1460 },
  },
  phaseBaseScores: {
    accumulation:55, early_markup:65, markup:75, late_markup:70,
    distribution:45, early_markdown:35, markdown:30, capitulation:40,
  } as Record<string,number>,
};

export const MOMENTUM_PARAMS = {
  ma200BullishRatio: 1.05, ma200BearishRatio: 0.95,
  highVolatilityThreshold: 80,
  strong_bull_30d: 25, bull_30d: 10, bear_30d: -10, strong_bear_30d: -20,
};

export const MODEL_VERSION = "1.0.0";
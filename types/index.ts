export interface BitcoinPrice {
  price: number;
  priceChange24h: number;
  priceChangePct24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  dominance: number;
  ath: number;
  athChangePct: number;
  timestamp: number;
  source: DataSource;
}
export interface PriceCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
export interface VolatilityMetrics {
  historicalVolatility7d: number;
  historicalVolatility30d: number;
  historicalVolatility90d: number;
  atr14d: number;
  timestamp: number;
}
export interface MacroData {
  m2GlobalGrowthYoy: number;
  m2UsaGrowthYoy: number;
  fedFundsRate: number;
  cpiYoy: number;
  realRateApprox: number;
  dxy: number;
  dxyChange1m: number;
  sp500: number;
  sp500Change1m: number;
  nasdaq: number;
  nasdaqChange1m: number;
  goldPrice: number;
  goldChange1m: number;
  us10yYield: number;
  us2yYield: number;
  yieldCurveSpread: number;
  timestamp: number;
  source: DataSource;
}
export interface OnChainData {
  mvrv: number;
  nupl: number;
  realizedPrice: number;
  sopr: number;
  hashrate: number;
  hashrateChange30d: number;
  activeAddresses: number;
  activeAddressesChange30d: number;
  exchangeNetFlow30d: number;
  etfNetFlow30d: number;
  lightningCapacity: number;
  timestamp: number;
  source: DataSource;
}
export interface SubScore {
  score: number;
  confidence: number;
  signal: Signal;
  reasoning: string[];
}
export type Signal = "strongly_bearish"|"bearish"|"neutral"|"bullish"|"strongly_bullish";
export interface CompositeScore {
  score: number;
  signal: Signal;
  regime: MarketRegime;
  confidence: number;
  weightedInputs: WeightedInput[];
  bullBearProbabilities: BullBearProb;
}
export interface WeightedInput {
  modelName: string;
  score: number;
  weight: number;
  contribution: number;
}
export interface BullBearProb {
  bull: number;
  base: number;
  bear: number;
}
export type MarketRegime = "risk_off_extreme"|"risk_off"|"neutral"|"risk_on"|"risk_on_euphoria";
export interface ModelScores {
  macro: SubScore;
  liquidity: SubScore;
  cycle: SubScore;
  valuation: SubScore;
  momentum: SubScore;
  onchain: SubScore;
  composite: CompositeScore;
  timestamp: number;
}
export interface PriceScenario {
  label: string;
  probability: number;
  targetPrice: number;
  returnPct: number;
  description: string;
}
export interface ForecastHorizon {
  label: string;
  days: number;
  bull: PriceScenario;
  base: PriceScenario;
  bear: PriceScenario;
  confidenceInterval80: [number, number];
  confidenceInterval95: [number, number];
  expectedReturn: number;
  timestamp: number;
}
export interface ForecastOutput {
  currentPrice: number;
  horizons: ForecastHorizon[];
  dominantNarrative: string;
  keyBullFactors: string[];
  keyBearFactors: string[];
  modelVersion: string;
  timestamp: number;
}
export interface CycleData {
  halvingNumber: number;
  daysSinceLastHalving: number;
  nextHalvingEstimatedDate: string;
  daysUntilNextHalving: number;
  cyclePhase: CyclePhase;
  cycleProgressPct: number;
  stockToFlow: number;
  stockToFlowModelPrice: number;
  stockToFlowDeviation: number;
  powerLawFairValue: number;
  powerLawLow: number;
  powerLawHigh: number;
  powerLawDeviation: number;
  ma200: number;
  priceToMa200Ratio: number;
  timestamp: number;
}
export type CyclePhase = "accumulation"|"early_markup"|"markup"|"late_markup"|"distribution"|"early_markdown"|"markdown"|"capitulation";
export interface FearGreedIndex {
  value: number;
  label: string;
  timestamp: number;
  source: DataSource;
}
export type DataSource = "coingecko_live"|"coingecko_cached"|"fred_live"|"alphavantage_live"|"glassnode_live"|"alternative_me"|"simulated"|"calculated";
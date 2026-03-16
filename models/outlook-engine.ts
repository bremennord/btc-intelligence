import { BitcoinPrice, MacroData, OnChainData, PriceCandle, CycleData, ModelScores, SubScore, CompositeScore, Signal, MarketRegime, ForecastOutput, ForecastHorizon, PriceScenario, VolatilityMetrics, BullBearProb, WeightedInput } from "@/types";
import { SUB_MODEL_WEIGHTS, SCENARIO_PROBABILITY_TABLE, FORECAST_RETURNS, MACRO_PARAMS, VALUATION_PARAMS, CYCLE_PARAMS, MOMENTUM_PARAMS, MODEL_VERSION } from "@/lib/model-weights";
import { clamp, scoreToSignal, sma, addDays, dateToLabel } from "@/utils";

export function computeMacroScore(macro: MacroData): SubScore {
  const reasoning: string[] = [];
  let score = 50;
  if (macro.realRateApprox < MACRO_PARAMS.realRateBullishThreshold) { score += 15; reasoning.push(`Real rates negative (${macro.realRateApprox.toFixed(2)}%) → expansionary`); }
  else if (macro.realRateApprox > MACRO_PARAMS.realRateBearishThreshold) { score -= 15; reasoning.push(`Real rates restrictive (+${macro.realRateApprox.toFixed(2)}%) → headwind`); }
  else { reasoning.push(`Real rates neutral (${macro.realRateApprox.toFixed(2)}%)`); }
  if (macro.dxyChange1m < MACRO_PARAMS.dxyBullishThreshold) { score += 12; reasoning.push(`DXY falling (${macro.dxyChange1m.toFixed(1)}% 1m) → dollar weakness bullish`); }
  else if (macro.dxyChange1m > MACRO_PARAMS.dxyBearishThreshold) { score -= 10; reasoning.push(`DXY rising → headwind`); }
  if (macro.yieldCurveSpread < MACRO_PARAMS.yieldCurveBearishThreshold) { score -= 8; reasoning.push(`Yield curve inverted → recession signal`); }
  else if (macro.yieldCurveSpread > MACRO_PARAMS.yieldCurveBullishThreshold) { score += 8; reasoning.push(`Yield curve positive → expansion`); }
  if (macro.nasdaqChange1m > 5) { score += 8; reasoning.push(`Nasdaq +${macro.nasdaqChange1m.toFixed(1)}% → risk-on`); }
  else if (macro.nasdaqChange1m < -5) { score -= 10; reasoning.push(`Nasdaq ${macro.nasdaqChange1m.toFixed(1)}% → risk-off`); }
  const s = clamp(score, 0, 100);
  return { score: s, confidence: 0.75, signal: scoreToSignal(s), reasoning };
}

export function computeLiquidityScore(macro: MacroData): SubScore {
  const reasoning: string[] = [];
  let score = 50;
  if (macro.m2GlobalGrowthYoy > MACRO_PARAMS.m2GrowthBullishThreshold) { score += 20; reasoning.push(`Global M2 +${macro.m2GlobalGrowthYoy.toFixed(1)}% YoY → liquidity tailwind`); }
  else if (macro.m2GlobalGrowthYoy < MACRO_PARAMS.m2GrowthBearishThreshold) { score -= 20; reasoning.push(`Global M2 contracting → headwind`); }
  else { reasoning.push(`M2 growth neutral at ${macro.m2GlobalGrowthYoy.toFixed(1)}% YoY`); }
  if (macro.m2UsaGrowthYoy > 5) { score += 10; reasoning.push(`US M2 accelerating`); }
  else if (macro.m2UsaGrowthYoy < 0) { score -= 10; reasoning.push(`US M2 contracting`); }
  if (macro.realRateApprox > 2) { score -= 10; reasoning.push(`High real rates draining liquidity`); }
  else if (macro.realRateApprox < 0) { score += 10; reasoning.push(`Negative real rates → capital deployment`); }
  const s = clamp(score, 0, 100);
  return { score: s, confidence: 0.72, signal: scoreToSignal(s), reasoning };
}

export function computeCycleScore(cycleData: CycleData): SubScore {
  const reasoning: string[] = [];
  const phaseBase = CYCLE_PARAMS.phaseBaseScores[cycleData.cyclePhase] ?? 50;
  let score = phaseBase;
  reasoning.push(`Phase: ${cycleData.cyclePhase.replace(/_/g," ")} (day ${cycleData.daysSinceLastHalving})`);
  if (cycleData.stockToFlowDeviation > 50) { score -= 10; reasoning.push(`${cycleData.stockToFlowDeviation.toFixed(0)}% above S2F → extended`); }
  else if (cycleData.stockToFlowDeviation < -30) { score += 15; reasoning.push(`Below S2F model → undervalued`); }
  if (cycleData.powerLawDeviation < -20) { score += 12; reasoning.push(`${Math.abs(cycleData.powerLawDeviation).toFixed(0)}% below Power Law → cheap`); }
  else if (cycleData.powerLawDeviation > 60) { score -= 10; reasoning.push(`${cycleData.powerLawDeviation.toFixed(0)}% above Power Law → stretched`); }
  if (cycleData.daysUntilNextHalving < 180 && cycleData.daysUntilNextHalving > 0) { score += 8; reasoning.push(`Next halving in ${cycleData.daysUntilNextHalving}d`); }
  const s = clamp(score, 0, 100);
  return { score: s, confidence: 0.68, signal: scoreToSignal(s), reasoning };
}

export function computeValuationScore(onchain: OnChainData, price: number): SubScore {
  const reasoning: string[] = [];
  let score = 50;
  const { mvrv, nupl } = onchain;
  if (mvrv > VALUATION_PARAMS.mvrvOverbought) { score -= 20; reasoning.push(`MVRV ${mvrv.toFixed(2)} → overbought`); }
  else if (mvrv < VALUATION_PARAMS.mvrvOversold) { score += 25; reasoning.push(`MVRV ${mvrv.toFixed(2)} → historically undervalued`); }
  else if (mvrv < VALUATION_PARAMS.mvrvFairLow) { score += 12; reasoning.push(`MVRV ${mvrv.toFixed(2)} → strong value zone`); }
  else { reasoning.push(`MVRV ${mvrv.toFixed(2)} → fair value range`); }
  if (nupl > VALUATION_PARAMS.nuplEuphoria) { score -= 18; reasoning.push(`NUPL ${nupl.toFixed(2)} → euphoria, high risk`); }
  else if (nupl < VALUATION_PARAMS.nuplCapitulation) { score += 22; reasoning.push(`NUPL ${nupl.toFixed(2)} → capitulation zone`); }
  else { reasoning.push(`NUPL ${nupl.toFixed(2)} → ${nupl > 0.5 ? "belief" : "hope"} phase`); }
  const realizedDev = ((price - onchain.realizedPrice) / onchain.realizedPrice) * 100;
  if (realizedDev < 10) { score += 10; reasoning.push(`Near realized price $${onchain.realizedPrice.toLocaleString()} → strong support`); }
  const s = clamp(score, 0, 100);
  return { score: s, confidence: 0.78, signal: scoreToSignal(s), reasoning };
}

export function computeMomentumScore(candles: PriceCandle[], volatility: VolatilityMetrics): SubScore {
  const reasoning: string[] = [];
  if (candles.length < 30) return { score: 50, confidence: 0.3, signal: "neutral", reasoning: ["Insufficient data"] };
  let score = 50;
  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1];
  const ma200 = sma(closes, 200);
  const ratio = currentPrice / ma200;
  if (ratio > MOMENTUM_PARAMS.ma200BullishRatio) { score += 15; reasoning.push(`${((ratio-1)*100).toFixed(1)}% above 200d MA → uptrend`); }
  else if (ratio < MOMENTUM_PARAMS.ma200BearishRatio) { score -= 15; reasoning.push(`${((1-ratio)*100).toFixed(1)}% below 200d MA → downtrend`); }
  else { reasoning.push(`Near 200d MA ($${Math.round(ma200).toLocaleString()})`); }
  const ma50 = sma(closes, 50);
  if (currentPrice > ma50 && ma50 > ma200) { score += 10; reasoning.push(`Golden cross structure`); }
  else if (currentPrice < ma50 && ma50 < ma200) { score -= 10; reasoning.push(`Death cross structure`); }
  const price30d = closes[Math.max(0, closes.length-31)];
  const ch30 = ((currentPrice - price30d) / price30d) * 100;
  if (ch30 > 25) { score += 10; reasoning.push(`Strong 30d momentum: +${ch30.toFixed(1)}%`); }
  else if (ch30 < -20) { score -= 12; reasoning.push(`Negative 30d momentum: ${ch30.toFixed(1)}%`); }
  let conf = 0.75;
  if (volatility.historicalVolatility30d > 80) { score = score * 0.8 + 50 * 0.2; conf = 0.55; reasoning.push(`High volatility (${volatility.historicalVolatility30d.toFixed(0)}% ann.)`); }
  const s = clamp(score, 0, 100);
  return { score: s, confidence: conf, signal: scoreToSignal(s), reasoning };
}

export function computeOnChainScore(onchain: OnChainData): SubScore {
  const reasoning: string[] = [];
  let score = 50;
  if (onchain.hashrateChange30d > 10) { score += 12; reasoning.push(`Hashrate +${onchain.hashrateChange30d.toFixed(1)}% → miner confidence`); }
  else if (onchain.hashrateChange30d < -10) { score -= 10; reasoning.push(`Hashrate declining → miner stress`); }
  if (onchain.activeAddressesChange30d > 10) { score += 8; reasoning.push(`Active addresses growing`); }
  if (onchain.exchangeNetFlow30d < -20000) { score += 15; reasoning.push(`${Math.abs(onchain.exchangeNetFlow30d).toLocaleString()} BTC left exchanges → accumulation`); }
  else if (onchain.exchangeNetFlow30d > 20000) { score -= 12; reasoning.push(`BTC entering exchanges → distribution risk`); }
  if (onchain.etfNetFlow30d > 1000) { score += 10; reasoning.push(`ETF inflows +$${(onchain.etfNetFlow30d/1000).toFixed(1)}B → institutional demand`); }
  const s = clamp(score, 0, 100);
  return { score: s, confidence: 0.65, signal: scoreToSignal(s), reasoning };
}

function getProbabilities(score: number): BullBearProb {
  const row = SCENARIO_PROBABILITY_TABLE.find(([mn,mx]) => score >= mn && score < mx) ?? SCENARIO_PROBABILITY_TABLE[5];
  const [,,pBull,,pBear] = row;
  const bull = clamp(pBull + (Math.random()-0.5)*0.02, 0.01, 0.99);
  const bear = clamp(pBear + (Math.random()-0.5)*0.02, 0.01, 0.99);
  const base = clamp(1-bull-bear, 0.01, 0.99);
  return { bull: parseFloat(bull.toFixed(3)), base: parseFloat(base.toFixed(3)), bear: parseFloat(bear.toFixed(3)) };
}

function scoreToRegime(score: number): MarketRegime {
  if (score < 15) return "risk_off_extreme";
  if (score < 35) return "risk_off";
  if (score < 65) return "neutral";
  if (score < 85) return "risk_on";
  return "risk_on_euphoria";
}

export function computeCompositeScore(scores: Omit<ModelScores,"composite"|"timestamp">): CompositeScore {
  const inputs = [
    { modelName:"Macro",     score:scores.macro.score,     weight:SUB_MODEL_WEIGHTS.macro },
    { modelName:"Liquidity", score:scores.liquidity.score, weight:SUB_MODEL_WEIGHTS.liquidity },
    { modelName:"Cycle",     score:scores.cycle.score,     weight:SUB_MODEL_WEIGHTS.cycle },
    { modelName:"Valuation", score:scores.valuation.score, weight:SUB_MODEL_WEIGHTS.valuation },
    { modelName:"Momentum",  score:scores.momentum.score,  weight:SUB_MODEL_WEIGHTS.momentum },
    { modelName:"On-Chain",  score:scores.onchain.score,   weight:SUB_MODEL_WEIGHTS.onchain },
  ];
  const total = inputs.reduce((a,b)=>a+b.weight,0);
  const raw = inputs.reduce((acc,inp)=>acc+inp.score*inp.weight,0)/total;
  const compositeScore = clamp(Math.round(raw),0,100);
  const avgConf = [scores.macro,scores.liquidity,scores.cycle,scores.valuation,scores.momentum,scores.onchain].reduce((a,b)=>a+b.confidence,0)/6;
  const weightedInputs: WeightedInput[] = inputs.map(inp=>({ ...inp, contribution: parseFloat((inp.score*inp.weight).toFixed(1)) }));
  return {
    score: compositeScore, signal: scoreToSignal(compositeScore),
    regime: scoreToRegime(compositeScore), confidence: parseFloat(avgConf.toFixed(2)),
    weightedInputs, bullBearProbabilities: getProbabilities(compositeScore),
  };
}

export function computeCycleData(price: number): CycleData {
  const lastHalving = new Date("2024-04-19");
  const now = new Date();
  const daysSince = Math.floor((now.getTime()-lastHalving.getTime())/86400000);
  const daysUntilNext = CYCLE_PARAMS.halvingCycleDays - daysSince;
  const nextDate = addDays(lastHalving, CYCLE_PARAMS.halvingCycleDays);
  let cyclePhase: CycleData["cyclePhase"] = "accumulation";
  for (const [phase, range] of Object.entries(CYCLE_PARAMS.phases)) {
    if (daysSince >= range.start && daysSince < range.end) { cyclePhase = phase as CycleData["cyclePhase"]; break; }
  }
  if (daysSince >= CYCLE_PARAMS.halvingCycleDays) cyclePhase = "capitulation";
  const totalSupply = 19700000;
  const annualFlow = 3.125*6*24*365;
  const sf = totalSupply/annualFlow;
  const sfPrice = Math.exp(3.31819*Math.log(sf)+14.6227);
  const sfDev = ((price-sfPrice)/sfPrice)*100;
  const genesis = new Date("2009-01-03");
  const daysSinceGenesis = Math.floor((now.getTime()-genesis.getTime())/86400000)+1;
  const plFair  = Math.pow(10,-17.01593313+5.84509376*Math.log10(daysSinceGenesis));
  const plLow   = plFair*0.45;
  const plHigh  = plFair*3.5;
  const plDev   = ((price-plFair)/plFair)*100;
  return {
    halvingNumber:4, daysSinceLastHalving:daysSince,
    nextHalvingEstimatedDate:dateToLabel(nextDate), daysUntilNextHalving:Math.max(0,daysUntilNext),
    cyclePhase, cycleProgressPct:clamp((daysSince/CYCLE_PARAMS.halvingCycleDays)*100,0,100),
    stockToFlow:parseFloat(sf.toFixed(1)), stockToFlowModelPrice:Math.round(sfPrice),
    stockToFlowDeviation:parseFloat(sfDev.toFixed(1)),
    powerLawFairValue:Math.round(plFair), powerLawLow:Math.round(plLow),
    powerLawHigh:Math.round(plHigh), powerLawDeviation:parseFloat(plDev.toFixed(1)),
    ma200:0, priceToMa200Ratio:0, timestamp:Date.now(),
  };
}

export function runOutlookEngine(price: BitcoinPrice, macro: MacroData, onchain: OnChainData, candles: PriceCandle[], volatility: VolatilityMetrics): ModelScores {
  const cycleData = computeCycleData(price.price);
  const macro_s   = computeMacroScore(macro);
  const liq_s     = computeLiquidityScore(macro);
  const cycle_s   = computeCycleScore(cycleData);
  const val_s     = computeValuationScore(onchain, price.price);
  const mom_s     = computeMomentumScore(candles, volatility);
  const onchain_s = computeOnChainScore(onchain);
  const composite = computeCompositeScore({ macro:macro_s, liquidity:liq_s, cycle:cycle_s, valuation:val_s, momentum:mom_s, onchain:onchain_s });
  return { macro:macro_s, liquidity:liq_s, cycle:cycle_s, valuation:val_s, momentum:mom_s, onchain:onchain_s, composite, timestamp:Date.now() };
}

export function generateForecasts(currentPrice: number, modelScores: ModelScores): ForecastOutput {
  const prob = modelScores.composite.bullBearProbabilities;
  const conf = modelScores.composite.confidence;
  const scale = 0.5 + 0.5*conf;
  const horizons: ForecastHorizon[] = (["24h","7d","30d","90d","1y"] as const).map(label => {
    const returns = FORECAST_RETURNS[label];
    const days = ({"24h":1,"7d":7,"30d":30,"90d":90,"1y":365} as Record<string,number>)[label];
    const bR = returns.bull.mean*scale;
    const bsR = returns.base.mean;
    const brR = returns.bear.mean*scale;
    const exp = prob.bull*bR + prob.base*bsR + prob.bear*brR;
    const ep = currentPrice*(1+exp/100);
    const s80 = returns.base.std*1.28;
    const s95 = returns.base.std*1.96;
    return {
      label, days,
      bull: { label:"Bull", probability:prob.bull, targetPrice:Math.round(currentPrice*(1+bR/100)), returnPct:parseFloat(bR.toFixed(1)), description:"Strong continuation" },
      base: { label:"Base", probability:prob.base, targetPrice:Math.round(currentPrice*(1+bsR/100)), returnPct:parseFloat(bsR.toFixed(1)), description:"Gradual trend" },
      bear: { label:"Bear", probability:prob.bear, targetPrice:Math.round(currentPrice*(1+brR/100)), returnPct:parseFloat(brR.toFixed(1)), description:"Risk-off reversal" },
      confidenceInterval80: [Math.round(ep*(1-s80/100)), Math.round(ep*(1+s80/100))],
      confidenceInterval95: [Math.round(ep*(1-s95/100)), Math.round(ep*(1+s95/100))],
      expectedReturn: parseFloat(exp.toFixed(1)), timestamp: Date.now(),
    };
  });
  const keyBull: string[] = [], keyBear: string[] = [];
  for (const s of [modelScores.macro,modelScores.liquidity,modelScores.cycle,modelScores.valuation,modelScores.momentum,modelScores.onchain]) {
    if (s.score >= 60) keyBull.push(...s.reasoning.slice(0,1));
    if (s.score <= 40) keyBear.push(...s.reasoning.slice(0,1));
  }
  return {
    currentPrice, horizons,
    dominantNarrative: `Model is ${modelScores.composite.signal.replace(/_/g," ")} (${modelScores.composite.score}/100). Bull: ${(prob.bull*100).toFixed(0)}%, Base: ${(prob.base*100).toFixed(0)}%, Bear: ${(prob.bear*100).toFixed(0)}%.`,
    keyBullFactors: keyBull.slice(0,4), keyBearFactors: keyBear.slice(0,4),
    modelVersion: MODEL_VERSION, timestamp: Date.now(),
  };
}
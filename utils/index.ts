import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Signal, MarketRegime } from "@/types";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000)     return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000)         return `${(value / 1_000_000).toFixed(2)}M`;
  return value.toFixed(0);
}
export function formatPct(value: number, decimals = 2): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}
export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 10_000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}
export function signalToColor(signal: Signal): string {
  const map: Record<Signal, string> = {
    strongly_bearish: "#f43f5e", bearish: "#fb923c",
    neutral: "#94a3b8", bullish: "#34d399", strongly_bullish: "#10b981",
  };
  return map[signal];
}
export function signalToLabel(signal: Signal): string {
  const map: Record<Signal, string> = {
    strongly_bearish: "Strongly Bearish", bearish: "Bearish",
    neutral: "Neutral", bullish: "Bullish", strongly_bullish: "Strongly Bullish",
  };
  return map[signal];
}
export function regimeToLabel(regime: MarketRegime): string {
  const map: Record<MarketRegime, string> = {
    risk_off_extreme: "Risk-Off Extreme", risk_off: "Risk-Off",
    neutral: "Neutral", risk_on: "Risk-On", risk_on_euphoria: "Risk-On Euphoria",
  };
  return map[regime];
}
export function scoreToSignal(score: number): Signal {
  if (score < 20) return "strongly_bearish";
  if (score < 40) return "bearish";
  if (score < 60) return "neutral";
  if (score < 80) return "bullish";
  return "strongly_bullish";
}
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
export function sma(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] ?? 0;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}
export function annualizedVolatility(returns: number[], periodsPerYear = 365): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  return Math.sqrt(variance * periodsPerYear) * 100;
}
export function addDays(date: Date, days: number): Date {
  const result = new Date(date); result.setDate(result.getDate() + days); return result;
}
export function dateToLabel(date: Date): string { return date.toISOString().split("T")[0]; }
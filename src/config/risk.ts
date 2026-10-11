import type { LevelKey } from '../types';

export interface RiskStyle {
  value: number;
  key: LevelKey;
  label: string;
  color: string;
  /** Readable text colour on top of `color`. */
  ink: string;
}

export const RISK: readonly RiskStyle[] = [
  { value: 0, key: 'low', label: 'Low', color: '#2e9e6b', ink: '#ffffff' },
  { value: 1, key: 'moderate', label: 'Moderate', color: '#e3b505', ink: '#2b2200' },
  { value: 2, key: 'high', label: 'High', color: '#f08a24', ink: '#2b1500' },
  { value: 3, key: 'severe', label: 'Severe', color: '#d9372b', ink: '#ffffff' },
  { value: 4, key: 'no_travel', label: 'No Travel', color: '#7a1fa2', ink: '#ffffff' },
] as const;

export const riskStyle = (level: number): RiskStyle => RISK[Math.max(0, Math.min(4, Math.round(level)))];
export const riskColor = (level: number): string => riskStyle(level).color;

export const METRICS = [
  { key: 'overall', label: 'Overall' },
  { key: 'wind', label: 'Wind' },
  { key: 'rain', label: 'Rain' },
  { key: 'snow', label: 'Snow' },
] as const;

/** Colour ramp used by the heatmap canvas (RGB), indexed by risk level. */
export const RISK_RGB: readonly [number, number, number][] = [
  [46, 158, 107],
  [227, 181, 5],
  [240, 138, 36],
  [217, 55, 43],
  [122, 31, 162],
];

export const ROUTE_COLORS = ['#0b6b83', '#5a4fcf', '#8a5a2b'] as const;
export const MAX_LOAD_LBS = 80_000;

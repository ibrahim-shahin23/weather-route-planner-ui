/** Mirrors the JSON contract of the Django API (see backend/apps/trips/api/presenters.py). */

export type LatLng = [number, number];
export type Metric = 'overall' | 'wind' | 'rain' | 'snow';
export type LevelKey = 'low' | 'moderate' | 'high' | 'severe' | 'no_travel';

export interface Place {
  label: string;
  lat: number;
  lon: number;
}

export interface LocationInput {
  query?: string;
  label?: string;
  lat?: number;
  lon?: number;
}

export interface AnalyzeRequest {
  origin: LocationInput;
  destination: LocationInput;
  departure: string; // ISO 8601
  load_weight_lbs: number;
  sample_interval_miles: number | null; // null = automatic
}

export interface Checkpoint {
  index: number;
  mile: number;
  lat: number;
  lon: number;
  eta: string;
  weather: { wind_mph: number; rain_in_hr: number; snow_in_hr: number };
  risk: { overall: number; wind: number; rain: number; snow: number; reasons: string[] };
}

export interface RiskSegment {
  level: number;
  from_mile: number;
  to_mile: number;
  path: LatLng[];
}

export interface RouteSummary {
  distance_miles: number;
  duration_s: number;
  departure: string;
  arrival: string;
  checkpoint_interval_miles: number;
  checkpoint_count: number;
  max_level: number;
  avg_risk: number;
  miles_by_level: Record<LevelKey, number>;
}

export interface RouteResult {
  id: string;
  name: string;
  rank: number;
  recommended: boolean;
  summary: RouteSummary;
  geometry: LatLng[];
  risk_segments: RiskSegment[];
  checkpoints: Checkpoint[];
}

export interface Recommendation {
  route_id: string;
  headline: string;
  reasons: string[];
  warnings: string[];
}

export interface AnalysisResponse {
  origin: Place;
  destination: Place;
  departure: string;
  load_weight_lbs: number;
  routes: RouteResult[];
  recommendation: Recommendation;
  warnings: string[];
}

export interface HeatPoint {
  lat: number;
  lon: number;
  wind_mph: number[];
  rain_in_hr: number[];
  snow_in_hr: number[];
  levels: Record<Metric, number[]>;
}

export interface HeatmapRequest {
  routes: LatLng[][];
  departure: string;
  load_weight_lbs: number;
  hours?: number;
}

export interface HeatmapResponse {
  start_time: string;
  hours: number;
  hourly_max_level: number[];
  points: HeatPoint[];
}

export interface RiskRules {
  levels: { value: number; label: string }[];
  thresholds: {
    condition: 'wind' | 'rain' | 'snow';
    unit: string;
    moderate_from: number;
    high_from: number;
    severe_from: number;
    no_travel: number;
    no_travel_inclusive: boolean;
  }[];
  load_rules: { text: string }[];
}

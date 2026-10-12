import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { AnalysisResponse, HeatmapResponse, Metric } from '../../types';
import { RiskHeatOverlay } from './RiskHeatOverlay';
import { RoutesLayer } from './RoutesLayer';

const DEFAULT_CARTO_URL = 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
const DEFAULT_FALLBACK_OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function resolveTileConfig(): { primaryUrl: string; fallbackUrl: string; primaryAttribution: string } {
  const rawBase =
    (import.meta.env.VITE_TILE_BASE_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_TILE_URL as string | undefined)?.trim() ||
    DEFAULT_CARTO_URL;

  const rawKey =
    (import.meta.env.VITE_TILE_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_CARTO_KEY as string | undefined)?.trim();

  const fallbackUrl =
    (import.meta.env.VITE_FALLBACK_TILE_URL as string | undefined)?.trim() ||
    DEFAULT_FALLBACK_OSM_URL;

  const hasValidKey = Boolean(rawKey && !/^(\*+|YOUR_.*|<.*>)$/i.test(rawKey));

  let primaryUrl = rawBase;

  if (hasValidKey && rawKey) {
    if (primaryUrl.includes('{key}')) {
      primaryUrl = primaryUrl.replace('{key}', encodeURIComponent(rawKey));
    } else if (/[?&]key=/.test(primaryUrl)) {
      primaryUrl = primaryUrl.replace(/([?&]key=)[^&]*/, `$1${encodeURIComponent(rawKey)}`);
    } else {
      primaryUrl += (primaryUrl.includes('?') ? '&' : '?') + `key=${encodeURIComponent(rawKey)}`;
    }
  } else {
    // If no key or placeholder (e.g. ****), strip dummy parameter so public tiles load cleanly
    primaryUrl = primaryUrl
      .replace(/{key}/g, '')
      .replace(/([?&])key=[^&]*(&|$)/, (_m, p1, p2) => (p2 === '&' ? p1 : ''))
      .replace(/[?&]$/, '');
  }

  const isCarto = primaryUrl.includes('cartocdn.com');
  const primaryAttribution = isCarto ? CARTO_ATTRIBUTION : OSM_ATTRIBUTION;

  return { primaryUrl, fallbackUrl, primaryAttribution };
}

export interface FocusTarget {
  lat: number;
  lon: number;
  nonce: number; // changes on every request so re-focusing the same point still flies
}

export interface HeatView {
  data: HeatmapResponse;
  hour: number;
  metric: Metric;
}

interface Props {
  analysis: AnalysisResponse | null;
  selectedId: string | null;
  onSelectRoute: (id: string) => void;
  heat: HeatView | null;
  showAllCheckpoints: boolean;
  focus: FocusTarget | null;
}

function FitToRoutes({ analysis }: { analysis: AnalysisResponse | null }) {
  const map = useMap();
  useEffect(() => {
    if (!analysis) return;
    const bounds = L.latLngBounds(analysis.routes.flatMap((r) => r.geometry));
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [analysis, map]);
  return null;
}

function FlyToFocus({ focus }: { focus: FocusTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lon], Math.max(map.getZoom(), 9), { duration: 0.6 });
  }, [focus, map]);
  return null;
}

function HeatOverlay({ heat }: { heat: HeatView }) {
  const samples = useMemo(
    () => heat.data.points.map((p) => ({ lat: p.lat, lon: p.lon, level: p.levels[heat.metric][heat.hour] ?? 0 })),
    [heat.data, heat.metric, heat.hour],
  );
  return <RiskHeatOverlay samples={samples} />;
}

export function MapView({ analysis, selectedId, onSelectRoute, heat, showAllCheckpoints, focus }: Props) {
  const { primaryUrl, fallbackUrl, primaryAttribution } = useMemo(() => resolveTileConfig(), []);
  const [useFallback, setUseFallback] = useState(false);
  const errorCountRef = useRef(0);

  const handleTileError = useCallback(() => {
    errorCountRef.current += 1;
    // If primary tiles fail repeatedly (e.g. invalid key or network issue), fall back to OpenStreetMap
    if (errorCountRef.current >= 3 && !useFallback) {
      console.warn('Map tiles failed to load from primary source; switching to OpenStreetMap fallback.', primaryUrl);
      setUseFallback(true);
    }
  }, [useFallback, primaryUrl]);

  const activeUrl = useFallback ? fallbackUrl : primaryUrl;
  const activeAttribution = useFallback ? OSM_ATTRIBUTION : primaryAttribution;

  return (
    <MapContainer center={[39.5, -98.35]} zoom={4} minZoom={3} preferCanvas className="map" zoomControl>
      <TileLayer
        key={useFallback ? 'osm-fallback' : 'primary-tiles'}
        url={activeUrl}
        attribution={activeAttribution}
        subdomains="abcd"
        maxZoom={18}
        eventHandlers={{
          tileerror: handleTileError,
        }}
      />
      <FitToRoutes analysis={analysis} />
      <FlyToFocus focus={focus} />
      {heat && <HeatOverlay heat={heat} />}
      {analysis && <RoutesLayer analysis={analysis} selectedId={selectedId} showAllCheckpoints={showAllCheckpoints} onSelect={onSelectRoute} />}
    </MapContainer>
  );
}

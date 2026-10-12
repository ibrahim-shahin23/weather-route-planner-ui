import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import type { AnalysisResponse, HeatmapResponse, Metric } from '../../types';
import { Basemap } from './Basemap';
import { RiskHeatOverlay } from './RiskHeatOverlay';
import { RoutesLayer } from './RoutesLayer';

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
  return (
    <MapContainer center={[39.5, -98.35]} zoom={4} minZoom={3} preferCanvas className="map" zoomControl>
      <Basemap />
      <FitToRoutes analysis={analysis} />
      <FlyToFocus focus={focus} />
      {heat && <HeatOverlay heat={heat} />}
      {analysis && <RoutesLayer analysis={analysis} selectedId={selectedId} showAllCheckpoints={showAllCheckpoints} onSelect={onSelectRoute} />}
    </MapContainer>
  );
}

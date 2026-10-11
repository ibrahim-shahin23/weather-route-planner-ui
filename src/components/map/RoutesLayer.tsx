import L from 'leaflet';
import { Fragment, memo } from 'react';
import { CircleMarker, Marker, Polyline, Popup, Tooltip } from 'react-leaflet';
import { ROUTE_COLORS, riskColor } from '../../config/risk';
import type { AnalysisResponse, Checkpoint, RouteResult } from '../../types';
import { fmtDateTime, fmtDuration, fmtMiles } from '../../utils/format';
import { RiskBadge } from '../common/RiskBadge';

interface Props {
  analysis: AnalysisResponse;
  selectedId: string | null;
  showAllCheckpoints: boolean;
  onSelect: (id: string) => void;
}

const pin = (kind: 'start' | 'end', text: string) =>
  L.divIcon({ className: 'pin', html: `<span class="pin__label pin__label--${kind}">${text}</span>`, iconSize: [0, 0] });

function CheckpointPopup({ route, cp }: { route: RouteResult; cp: Checkpoint }) {
  return (
    <div className="popup">
      <strong>{route.name} · mile {fmtMiles(cp.mile)}</strong>
      <div>ETA {fmtDateTime(cp.eta)}</div>
      <div>
        Wind {cp.weather.wind_mph.toFixed(0)} mph · Rain {cp.weather.rain_in_hr.toFixed(2)} in/hr · Snow {cp.weather.snow_in_hr.toFixed(2)} in/hr
      </div>
      <div className="popup__risk">
        <RiskBadge level={cp.risk.overall} compact />
      </div>
      {cp.risk.reasons.length > 0 && (
        <ul>
          {cp.risk.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RouteTooltip({ route }: { route: RouteResult }) {
  const s = route.summary;
  return (
    <Tooltip sticky>
      <strong>
        {route.name}
        {route.recommended ? ' · recommended' : ''}
      </strong>
      <br />
      {fmtMiles(s.distance_miles)} mi · {fmtDuration(s.duration_s)}
      <br />
      Severe {fmtMiles(s.miles_by_level.severe)} mi · High {fmtMiles(s.miles_by_level.high)} mi
    </Tooltip>
  );
}

/** Routes, risk colouring, checkpoints and endpoints. Memoised so heatmap scrubbing never re-renders it. */
export const RoutesLayer = memo(function RoutesLayer({ analysis, selectedId, showAllCheckpoints, onSelect }: Props) {
  const ordered = [...analysis.routes].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId)); // selected drawn last (on top)
  const indexOf = (id: string) => analysis.routes.findIndex((r) => r.id === id);

  return (
    <>
      {ordered.map((route) => {
        const selected = route.id === selectedId;
        const color = ROUTE_COLORS[indexOf(route.id) % ROUTE_COLORS.length];
        return (
          <Fragment key={route.id}>
            {selected ? (
              <>
                <Polyline positions={route.geometry} pathOptions={{ color: '#ffffff', weight: 11, opacity: 0.95, interactive: false }} />
                {route.risk_segments.map((seg, i) => (
                  <Polyline key={i} positions={seg.path} pathOptions={{ color: riskColor(seg.level), weight: 6, opacity: 1, lineCap: 'butt' }}>
                    <RouteTooltip route={route} />
                  </Polyline>
                ))}
              </>
            ) : (
              <Polyline
                positions={route.geometry}
                pathOptions={{ color, weight: 5, opacity: 0.6, dashArray: '2 8', lineCap: 'round' }}
                eventHandlers={{ click: () => onSelect(route.id) }}
              >
                <RouteTooltip route={route} />
              </Polyline>
            )}

            {(selected || showAllCheckpoints) &&
              route.checkpoints.map((cp) => (
                <CircleMarker
                  key={cp.index}
                  center={[cp.lat, cp.lon]}
                  radius={selected ? 6 : 3.5}
                  pathOptions={{ color: '#ffffff', weight: selected ? 2 : 1, fillColor: riskColor(cp.risk.overall), fillOpacity: 1 }}
                >
                  <Popup>
                    <CheckpointPopup route={route} cp={cp} />
                  </Popup>
                </CircleMarker>
              ))}
          </Fragment>
        );
      })}

      <Marker position={[analysis.origin.lat, analysis.origin.lon]} icon={pin('start', 'Start')} interactive={false} />
      <Marker position={[analysis.destination.lat, analysis.destination.lon]} icon={pin('end', 'End')} interactive={false} />
    </>
  );
});

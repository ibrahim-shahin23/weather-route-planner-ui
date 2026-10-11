import { riskStyle } from '../../config/risk';
import type { RouteResult } from '../../types';

/** The route drawn as a strip: each stretch of road coloured by its risk level. */
export function RiskRibbon({ route }: { route: RouteResult }) {
  const total = route.summary.distance_miles || 1;
  const label = route.risk_segments
    .map((s) => `${(s.to_mile - s.from_mile).toFixed(0)} miles ${riskStyle(s.level).label}`)
    .join(', ');
  return (
    <span className="ribbon" role="img" aria-label={`Risk along ${route.name}: ${label}`}>
      {route.risk_segments.map((s, i) => (
        <span
          key={i}
          className="ribbon__seg"
          style={{ width: `${((s.to_mile - s.from_mile) / total) * 100}%`, background: riskStyle(s.level).color }}
        />
      ))}
    </span>
  );
}

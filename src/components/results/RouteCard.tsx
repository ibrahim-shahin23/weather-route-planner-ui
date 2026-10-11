import type { RouteResult } from '../../types';
import { ROUTE_COLORS } from '../../config/risk';
import { fmtDateTime, fmtDuration, fmtMiles } from '../../utils/format';
import { RiskBadge } from '../common/RiskBadge';
import { RiskRibbon } from '../common/RiskRibbon';

interface Props {
  route: RouteResult;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

export function RouteCard({ route, index, selected, onSelect }: Props) {
  const s = route.summary;
  return (
    <button type="button" className={selected ? 'route-card is-selected' : 'route-card'} aria-pressed={selected} onClick={onSelect}>
      <span className="route-card__head">
        <span className="route-card__swatch" style={{ borderColor: ROUTE_COLORS[index % ROUTE_COLORS.length] }} aria-hidden />
        <strong>{route.name}</strong>
        {route.recommended && <span className="tag tag--best">Recommended</span>}
        <span className="route-card__spacer" />
        <RiskBadge level={s.max_level} compact />
      </span>

      <span className="route-card__facts">
        <span><b>{fmtMiles(s.distance_miles)}</b> mi</span>
        <span><b>{fmtDuration(s.duration_s)}</b></span>
        <span>Arrive <b>{fmtDateTime(s.arrival)}</b></span>
      </span>

      <RiskRibbon route={route} />

      <span className="route-card__stats">
        <span title="Miles at No Travel risk"><b>{fmtMiles(s.miles_by_level.no_travel)}</b> mi No Travel</span>
        <span><b>{fmtMiles(s.miles_by_level.severe)}</b> mi Severe</span>
        <span><b>{fmtMiles(s.miles_by_level.high)}</b> mi High</span>
        <span title="Mile-weighted, 0 = Low to 4 = No Travel">Avg risk <b>{s.avg_risk.toFixed(2)}</b></span>
      </span>
    </button>
  );
}

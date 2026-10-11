import { riskStyle } from '../../config/risk';

export function RiskBadge({ level, compact = false }: { level: number; compact?: boolean }) {
  const s = riskStyle(level);
  return (
    <span className={compact ? 'badge badge--compact' : 'badge'} style={{ background: s.color, color: s.ink }}>
      {s.label}
    </span>
  );
}

/** A small coloured dot + value, used for per-condition cells. */
export function LevelDot({ level }: { level: number }) {
  const s = riskStyle(level);
  return <span className="dot" style={{ background: s.color }} title={s.label} aria-label={s.label} />;
}

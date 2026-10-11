import { useMemo } from 'react';
import { METRICS, RISK, riskColor } from '../../config/risk';
import { usePlayback } from '../../hooks/usePlayback';
import type { HeatmapResponse, Metric } from '../../types';
import { fmtDateTime } from '../../utils/format';

interface Props {
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  data: HeatmapResponse | null;
  hour: number;
  onHour: (h: number) => void;
  metric: Metric;
  onMetric: (m: Metric) => void;
  visible: boolean;
  onVisible: (v: boolean) => void;
  onRetry: () => void;
}

export function HeatmapPanel({ status, error, data, hour, onHour, metric, onMetric, visible, onVisible, onRetry }: Props) {
  const max = data?.hours ?? 48;
  const playback = usePlayback(hour, max, onHour);

  // Worst level across the corridor for each forecast hour, for the strip under the slider.
  const strip = useMemo(() => {
    if (!data) return [];
    if (metric === 'overall') return data.hourly_max_level;
    return Array.from({ length: data.hours + 1 }, (_, h) => data.points.reduce((m, p) => Math.max(m, p.levels[metric][h] ?? 0), 0));
  }, [data, metric]);

  const when = data ? new Date(new Date(data.start_time).getTime() + hour * 3_600_000).toISOString() : null;

  return (
    <section className="heat" aria-label="Weather heatmap">
      <div className="heat__top">
        <h2>Corridor weather</h2>
        <label className="switch">
          <input type="checkbox" checked={visible} onChange={(e) => onVisible(e.target.checked)} />
          <span>Show heatmap</span>
        </label>
        <div className="metrics" role="group" aria-label="Weather metric">
          {METRICS.map((m) => (
            <button key={m.key} type="button" className={metric === m.key ? 'is-on' : undefined} aria-pressed={metric === m.key} onClick={() => onMetric(m.key)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {status === 'loading' && <p className="heat__status">Loading the 48-hour forecast along the corridor…</p>}
      {status === 'error' && (
        <p className="heat__status heat__status--error" role="alert">
          {error} <button type="button" className="link" onClick={onRetry}>Try again</button>
        </p>
      )}

      {data && (
        <>
          <div className="scrub">
            <button type="button" className="btn btn--icon" onClick={playback.toggle} aria-label={playback.playing ? 'Pause forecast' : 'Play forecast'}>
              {playback.playing ? '❚❚' : '▶'}
            </button>
            <div className="scrub__track">
              <div className="scrub__strip" aria-hidden>
                {strip.map((lvl, h) => (
                  <span key={h} style={{ background: riskColor(lvl) }} className={h === hour ? 'is-now' : undefined} />
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={max}
                step={1}
                value={hour}
                onChange={(e) => {
                  playback.stop();
                  onHour(Number(e.target.value));
                }}
                aria-label="Forecast hour after departure"
                aria-valuetext={when ? `${hour} hours after departure, ${fmtDateTime(when)}` : undefined}
              />
            </div>
          </div>
          <div className="heat__meta">
            <span className="heat__time">{when && fmtDateTime(when)}</span>
            <span>{hour === 0 ? 'Departure hour' : `+${hour} h after departure`}</span>
            <span className="heat__legend" aria-label="Legend">
              {RISK.map((r) => (
                <span key={r.key}>
                  <i style={{ background: r.color }} />
                  {r.label}
                </span>
              ))}
            </span>
          </div>
        </>
      )}
    </section>
  );
}

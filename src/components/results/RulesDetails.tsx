import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { RiskRules } from '../../types';

/** Risk thresholds, fetched from the API so the legend always matches the scoring code. */
export function RulesDetails() {
  const [rules, setRules] = useState<RiskRules | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    api.riskRules(ctrl.signal).then(setRules).catch(() => undefined);
    return () => ctrl.abort();
  }, []);

  if (!rules) return null;
  const range = (lo: number, hi: number) => `${lo}–${hi}`;
  return (
    <details className="rules">
      <summary>How risk is scored</summary>
      <table>
        <thead>
          <tr>
            <th scope="col" />
            <th scope="col">Low</th>
            <th scope="col">Moderate</th>
            <th scope="col">High</th>
            <th scope="col">Severe</th>
            <th scope="col">No Travel</th>
          </tr>
        </thead>
        <tbody>
          {rules.thresholds.map((t) => (
            <tr key={t.condition}>
              <th scope="row">{t.condition} ({t.unit})</th>
              <td>&lt;{t.moderate_from}</td>
              <td>{range(t.moderate_from, t.high_from)}</td>
              <td>{range(t.high_from, t.severe_from)}</td>
              <td>{range(t.severe_from, t.no_travel)}</td>
              <td>{t.no_travel_inclusive ? '≥' : '>'}{t.no_travel}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul>
        {rules.load_rules.map((r) => (
          <li key={r.text}>{r.text}</li>
        ))}
      </ul>
      <p className="field__hint">Overall risk at a checkpoint is its worst condition. Routes are ranked by No Travel miles, Severe miles, High miles, average risk, then travel time.</p>
    </details>
  );
}

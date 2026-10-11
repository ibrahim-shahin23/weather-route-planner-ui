import type { AnalysisResponse } from '../../types';
import { Notice } from '../common/Notice';

export function RecommendationBanner({ data }: { data: AnalysisResponse }) {
  const rec = data.recommendation;
  return (
    <section className="reco" aria-live="polite">
      <h2>{rec.headline}</h2>
      <ul>
        {rec.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {[...rec.warnings, ...data.warnings].map((w) => (
        <Notice key={w} tone="warn">
          {w}
        </Notice>
      ))}
    </section>
  );
}

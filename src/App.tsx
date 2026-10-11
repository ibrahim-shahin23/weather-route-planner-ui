import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api/client';
import { Notice } from './components/common/Notice';
import { HeatmapPanel } from './components/heatmap/HeatmapPanel';
import { MapView, type FocusTarget } from './components/map/MapView';
import { CheckpointTable } from './components/results/CheckpointTable';
import { RecommendationBanner } from './components/results/RecommendationBanner';
import { RouteCard } from './components/results/RouteCard';
import { RulesDetails } from './components/results/RulesDetails';
import { TripForm } from './components/trip/TripForm';
import { useAsyncTask } from './hooks/useAsyncTask';
import type { Checkpoint, HeatmapRequest, Metric } from './types';
import { decimate, localTimeZone } from './utils/format';

export default function App() {
  const analysis = useAsyncTask(api.analyze);
  const heatmap = useAsyncTask(api.heatmap);
  const { run: runHeatmap, reset: resetHeatmap } = heatmap;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hour, setHour] = useState(0);
  const [metric, setMetric] = useState<Metric>('overall');
  const [heatVisible, setHeatVisible] = useState(true);
  const [showAllCheckpoints, setShowAllCheckpoints] = useState(true);
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const nonce = useRef(0);

  const data = analysis.data;

  const heatRequest = useMemo<HeatmapRequest | null>(
    () =>
      data && {
        routes: data.routes.map((r) => decimate(r.geometry, 400)),
        departure: data.departure,
        load_weight_lbs: data.load_weight_lbs,
        hours: 48,
      },
    [data],
  );

  // A new analysis resets selection and loads the matching 48 h heatmap in the background.
  useEffect(() => {
    if (!data || !heatRequest) {
      resetHeatmap();
      return;
    }
    setSelectedId(data.recommendation.route_id);
    setHour(0);
    void runHeatmap(heatRequest);
  }, [data, heatRequest, runHeatmap, resetHeatmap]);

  const onSelectRoute = useCallback((id: string) => setSelectedId(id), []);
  const onFocusCheckpoint = useCallback((c: Checkpoint) => setFocus({ lat: c.lat, lon: c.lon, nonce: ++nonce.current }), []);

  const selected = data?.routes.find((r) => r.id === selectedId) ?? null;
  const heatView = heatmap.data && heatVisible ? { data: heatmap.data, hour, metric } : null;

  return (
    <div className="app">
      <aside className="rail">
        <header className="brand">
          <h1>Weather-aware truck routing</h1>
          <p>Compare three routes by wind, rain and snow at the time you will actually be there.</p>
        </header>

        <TripForm onSubmit={analysis.run} loading={analysis.status === 'loading'} />

        {analysis.status === 'error' && <Notice tone="error">{analysis.error}</Notice>}
        {analysis.status === 'loading' && <Notice tone="info">Finding routes and checking the forecast at each checkpoint. Long trips can take up to 20 seconds.</Notice>}

        {data && (
          <div className="results">
            <RecommendationBanner data={data} />
            <p className="field__hint">Times shown in {localTimeZone()}.</p>
            <div className="route-list">
              {data.routes.map((r, i) => (
                <RouteCard key={r.id} route={r} index={i} selected={r.id === selectedId} onSelect={() => onSelectRoute(r.id)} />
              ))}
            </div>
            <label className="switch">
              <input type="checkbox" checked={showAllCheckpoints} onChange={(e) => setShowAllCheckpoints(e.target.checked)} />
              <span>Show checkpoints on all routes</span>
            </label>
            {selected && <CheckpointTable route={selected} onFocus={onFocusCheckpoint} />}
            <RulesDetails />
          </div>
        )}
      </aside>

      <main className="stage">
        <MapView analysis={data} selectedId={selectedId} onSelectRoute={onSelectRoute} heat={heatView} showAllCheckpoints={showAllCheckpoints} focus={focus} />
        {(heatmap.status !== 'idle') && (
          <HeatmapPanel
            status={heatmap.status}
            error={heatmap.error}
            data={heatmap.data}
            hour={hour}
            onHour={setHour}
            metric={metric}
            onMetric={setMetric}
            visible={heatVisible}
            onVisible={setHeatVisible}
            onRetry={() => heatRequest && void runHeatmap(heatRequest)}
          />
        )}
      </main>
    </div>
  );
}

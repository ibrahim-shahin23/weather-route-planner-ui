import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Place } from '../types';

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Type-ahead place suggestions (debounced, cancels stale requests). */
export function useGeocode(query: string, enabled: boolean) {
  const debounced = useDebounced(query.trim(), 350);
  const [state, setState] = useState<{ results: Place[]; loading: boolean }>({ results: [], loading: false });

  useEffect(() => {
    if (!enabled || debounced.length < 3) {
      setState({ results: [], loading: false });
      return;
    }
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true }));
    api
      .geocode(debounced, ctrl.signal)
      .then((results) => !ctrl.signal.aborted && setState({ results, loading: false }))
      .catch(() => !ctrl.signal.aborted && setState({ results: [], loading: false }));
    return () => ctrl.abort();
  }, [debounced, enabled]);

  return state;
}

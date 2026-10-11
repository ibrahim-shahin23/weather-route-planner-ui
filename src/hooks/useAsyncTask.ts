import { useCallback, useEffect, useRef, useState } from 'react';
import { describeError } from '../api/client';

export interface TaskState<R> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: R | null;
  error: string | null;
}

/** Runs one async request at a time; starting a new one cancels the previous. */
export function useAsyncTask<A, R>(task: (arg: A, signal: AbortSignal) => Promise<R>) {
  const [state, setState] = useState<TaskState<R>>({ status: 'idle', data: null, error: null });
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (arg: A) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setState({ status: 'loading', data: null, error: null });
      try {
        const data = await task(arg, ctrl.signal);
        if (!ctrl.signal.aborted) setState({ status: 'success', data, error: null });
      } catch (e) {
        if (!ctrl.signal.aborted) setState({ status: 'error', data: null, error: describeError(e) });
      }
    },
    [task],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: 'idle', data: null, error: null });
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);
  return { ...state, run, reset };
}

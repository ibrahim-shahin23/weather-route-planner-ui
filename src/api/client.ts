import type { AnalysisResponse, AnalyzeRequest, HeatmapRequest, HeatmapResponse, Place, RiskRules } from '../types';

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 'network', 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = body?.error;
    let message: string = err?.message ?? `Request failed (${res.status}).`;
    if (err?.fields && typeof err.fields === 'object') {
      const first = Object.entries(err.fields)[0];
      if (first) message = `${first[0].replace(/_/g, ' ')}: ${Array.isArray(first[1]) ? first[1][0] : JSON.stringify(first[1])}`;
    }
    if (res.status === 429) message = 'Too many requests. Wait a moment and try again.';
    throw new ApiError(message, err?.code ?? 'http_error', res.status);
  }
  return body as T;
}

const post = <T>(path: string, data: unknown, signal?: AbortSignal) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(data), signal });

export const api = {
  analyze: (req: AnalyzeRequest, signal?: AbortSignal) => post<AnalysisResponse>('/api/routes/analyze/', req, signal),
  heatmap: (req: HeatmapRequest, signal?: AbortSignal) => post<HeatmapResponse>('/api/heatmap/', req, signal),
  riskRules: (signal?: AbortSignal) => request<RiskRules>('/api/risk-rules/', { signal }),
  geocode: async (q: string, signal?: AbortSignal): Promise<Place[]> =>
    (await request<{ results: Place[] }>(`/api/geocode/?q=${encodeURIComponent(q)}`, { signal })).results,
};

export function describeError(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong.';
}

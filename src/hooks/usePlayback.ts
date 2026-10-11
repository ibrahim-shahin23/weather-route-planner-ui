import { useEffect, useState } from 'react';

/** Advances `value` once per `intervalMs` while playing; stops at `max`. */
export function usePlayback(value: number, max: number, setValue: (v: number) => void, intervalMs = 450) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (value >= max) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setValue(value + 1), intervalMs);
    return () => clearTimeout(t);
  }, [playing, value, max, setValue, intervalMs]);

  return {
    playing,
    toggle: () => {
      if (!playing && value >= max) setValue(0);
      setPlaying((p) => !p);
    },
    stop: () => setPlaying(false),
  };
}

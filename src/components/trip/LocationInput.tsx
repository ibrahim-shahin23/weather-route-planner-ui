import { useId, useState, type KeyboardEvent } from 'react';
import { useGeocode } from '../../hooks/useGeocode';
import type { Place } from '../../types';

export interface LocationValue {
  text: string;
  place: Place | null;
}

interface Props {
  label: string;
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  placeholder?: string;
  error?: string;
}

export function LocationInput({ label, value, onChange, placeholder, error }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const { results, loading } = useGeocode(value.text, open && value.place === null);

  const choose = (p: Place) => {
    onChange({ text: p.label, place: p });
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a <= 0 ? results.length - 1 : a - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const listId = `${id}-list`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="combo">
        <input
          id={id}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          placeholder={placeholder}
          value={value.text}
          onChange={(e) => {
            onChange({ text: e.target.value, place: null });
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
        />
        {value.place && <span className="combo__check" title="Location selected">✓</span>}
        {open && (results.length > 0 || loading) && (
          <ul id={listId} className="combo__list" role="listbox">
            {loading && results.length === 0 && <li className="combo__hint">Searching…</li>}
            {results.map((p, i) => (
              <li
                key={`${p.lat},${p.lon}`}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'is-active' : undefined}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(p);
                }}
              >
                {p.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}

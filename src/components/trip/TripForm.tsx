import { useState, type FormEvent } from 'react';
import { MAX_LOAD_LBS } from '../../config/risk';
import type { AnalyzeRequest, LocationInput as ApiLocation } from '../../types';
import { nextFullHour, toLocalInputValue } from '../../utils/format';
import { LocationInput, type LocationValue } from './LocationInput';

interface Props {
  onSubmit: (req: AnalyzeRequest) => void;
  loading: boolean;
}

type Sampling = 'auto' | '10' | '25' | '50';

const toApiLocation = (v: LocationValue): ApiLocation =>
  v.place ? { lat: v.place.lat, lon: v.place.lon, label: v.place.label } : { query: v.text.trim() };

export function TripForm({ onSubmit, loading }: Props) {
  const [origin, setOrigin] = useState<LocationValue>({ text: '', place: null });
  const [destination, setDestination] = useState<LocationValue>({ text: '', place: null });
  const [departure, setDeparture] = useState(() => toLocalInputValue(nextFullHour()));
  const [load, setLoad] = useState(34_000);
  const [sampling, setSampling] = useState<Sampling>('auto');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!origin.text.trim()) next.origin = 'Enter where the trip starts.';
    if (!destination.text.trim()) next.destination = 'Enter where the trip ends.';
    const when = new Date(departure);
    if (!departure || Number.isNaN(when.getTime())) next.departure = 'Choose a departure date and time.';
    if (!Number.isFinite(load) || load < 0 || load > MAX_LOAD_LBS) next.load = `Enter a weight between 0 and ${MAX_LOAD_LBS.toLocaleString()} lb.`;
    setErrors(next);
    if (Object.keys(next).length) return;

    onSubmit({
      origin: toApiLocation(origin),
      destination: toApiLocation(destination),
      departure: when.toISOString(),
      load_weight_lbs: Math.round(load),
      sample_interval_miles: sampling === 'auto' ? null : Number(sampling),
    });
  };

  const useExample = () => {
    setOrigin({ text: 'Denver, Colorado', place: null });
    setDestination({ text: 'Salt Lake City, Utah', place: null });
    setLoad(42_000);
    setErrors({});
  };

  return (
    <form className="trip-form" onSubmit={submit} noValidate>
      <LocationInput label="From" value={origin} onChange={setOrigin} placeholder="City or address" error={errors.origin} />
      <LocationInput label="To" value={destination} onChange={setDestination} placeholder="City or address" error={errors.destination} />

      <div className="field">
        <label htmlFor="departure">Departure</label>
        <input id="departure" type="datetime-local" value={departure} onChange={(e) => setDeparture(e.target.value)} aria-invalid={Boolean(errors.departure)} />
        {errors.departure && <p className="field__error">{errors.departure}</p>}
      </div>

      <div className="field">
        <label htmlFor="load">Load weight</label>
        <div className="load">
          <input
            id="load-range"
            type="range"
            min={0}
            max={MAX_LOAD_LBS}
            step={500}
            value={Math.min(load, MAX_LOAD_LBS)}
            onChange={(e) => setLoad(Number(e.target.value))}
            aria-label="Load weight slider"
          />
          <div className="load__num">
            <input id="load" type="number" inputMode="numeric" min={0} max={MAX_LOAD_LBS} step={500} value={Number.isNaN(load) ? '' : load} onChange={(e) => setLoad(e.target.value === '' ? NaN : Number(e.target.value))} aria-invalid={Boolean(errors.load)} />
            <span>lb</span>
          </div>
        </div>
        <p className="field__hint">Wind rules change at 30,000 lb and 40,000 lb.</p>
        {errors.load && <p className="field__error">{errors.load}</p>}
      </div>

      <fieldset className="field seg-control">
        <legend>Weather checkpoint spacing</legend>
        <div className="seg-control__row">
          {(['auto', '10', '25', '50'] as const).map((v) => (
            <label key={v} className={sampling === v ? 'is-on' : undefined}>
              <input type="radio" name="sampling" value={v} checked={sampling === v} onChange={() => setSampling(v)} />
              {v === 'auto' ? 'Auto' : `${v} mi`}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-actions">
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? 'Checking routes…' : 'Find safest route'}
        </button>
        <button className="btn btn--ghost" type="button" onClick={useExample} disabled={loading}>
          Fill example trip
        </button>
      </div>
    </form>
  );
}

import type { Checkpoint, RouteResult } from '../../types';
import { fmtDay, fmtMiles, localTimeZone } from '../../utils/format';
import { LevelDot, RiskBadge } from '../common/RiskBadge';

interface Props {
  route: RouteResult;
  onFocus: (c: Checkpoint) => void;
}

export function CheckpointTable({ route, onFocus }: Props) {
  return (
    <section className="checkpoints">
      <h3>
        {route.name} checkpoints
        <small>every {route.summary.checkpoint_interval_miles} mi · times in {localTimeZone()}</small>
      </h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Mile</th>
              <th scope="col">ETA</th>
              <th scope="col">Wind</th>
              <th scope="col">Rain</th>
              <th scope="col">Snow</th>
              <th scope="col">Risk</th>
            </tr>
          </thead>
          <tbody>
            {route.checkpoints.map((c) => (
              <tr key={c.index}>
                <td>
                  <button type="button" className="link" onClick={() => onFocus(c)} title="Show on map">
                    {fmtMiles(c.mile)}
                  </button>
                </td>
                <td>{fmtDay(c.eta)}</td>
                <td><LevelDot level={c.risk.wind} /> {c.weather.wind_mph.toFixed(0)} mph</td>
                <td><LevelDot level={c.risk.rain} /> {c.weather.rain_in_hr.toFixed(2)}</td>
                <td><LevelDot level={c.risk.snow} /> {c.weather.snow_in_hr.toFixed(2)}</td>
                <td><RiskBadge level={c.risk.overall} compact /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="field__hint">Rain and snow in inches per hour.</p>
    </section>
  );
}

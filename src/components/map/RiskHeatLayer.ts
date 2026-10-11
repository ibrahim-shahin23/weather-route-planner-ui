import L from 'leaflet';
import { RISK_RGB } from '../../config/risk';

export interface HeatSample {
  lat: number;
  lon: number;
  /** Risk level 0 (Low) to 4 (No Travel). */
  level: number;
}

const CELL_PX = 10; // resolution of the offscreen grid; the browser upscales it smoothly
const MAX_ALPHA = 0.62;

function rampColor(level: number): [number, number, number] {
  const l = Math.max(0, Math.min(4, level));
  const i = Math.min(3, Math.floor(l));
  const f = l - i;
  const a = RISK_RGB[i];
  const b = RISK_RGB[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/**
 * Leaflet layer that paints an inverse-distance-weighted risk surface.
 *
 * leaflet.heat sums point intensities, so overlapping points would look *more*
 * severe than they are. Here each pixel shows the weighted *average level* of
 * nearby samples, so colour means risk, and opacity fades with distance from the
 * corridor. The grid is drawn small and scaled up by the browser, which keeps
 * redraws cheap (a few ms) while the slider moves.
 */
export class RiskHeatLayer extends L.Layer {
  private canvas: HTMLCanvasElement | null = null;
  private samples: HeatSample[] = [];
  private frame = 0;

  onAdd(map: L.Map): this {
    const pane = map.getPane('riskHeat') ?? map.createPane('riskHeat');
    pane.style.zIndex = '350'; // below vector overlays (400), above tiles (200)
    pane.style.pointerEvents = 'none';

    const canvas = L.DomUtil.create('canvas', 'risk-heat-canvas') as HTMLCanvasElement;
    pane.appendChild(canvas);
    this.canvas = canvas;

    map.on('move zoomend resize', this.schedule, this);
    map.on('zoomstart', this.hide, this);
    this.schedule();
    return this;
  }

  onRemove(map: L.Map): this {
    map.off('move zoomend resize', this.schedule, this);
    map.off('zoomstart', this.hide, this);
    cancelAnimationFrame(this.frame);
    this.canvas?.remove();
    this.canvas = null;
    return this;
  }

  setSamples(samples: HeatSample[]): void {
    this.samples = samples;
    this.schedule();
  }

  private hide = (): void => {
    if (this.canvas) this.canvas.style.opacity = '0';
  };

  private schedule = (): void => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.draw());
  };

  private draw(): void {
    const map = this._map as L.Map | undefined;
    const canvas = this.canvas;
    if (!map || !canvas) return;

    const size = map.getSize();
    const w = Math.max(1, Math.ceil(size.x / CELL_PX));
    const h = Math.max(1, Math.ceil(size.y / CELL_PX));
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    const all = this.samples.map((s) => {
      const p = map.latLngToContainerPoint([s.lat, s.lon]);
      return { x: p.x, y: p.y, v: s.level };
    });
    if (all.length === 0) {
      canvas.style.opacity = '1';
      return;
    }

    // Influence radius follows the typical gap between neighbouring samples.
    const radius = Math.max(28, Math.min(280, medianNearest(all) * 1.7));
    const r2 = radius * radius;
    const pts = all.filter((p) => p.x > -radius && p.x < size.x + radius && p.y > -radius && p.y < size.y + radius);

    const img = ctx.createImageData(w, h);
    const px = img.data;
    for (let j = 0; j < h; j++) {
      const cy = (j + 0.5) * CELL_PX;
      for (let i = 0; i < w; i++) {
        const cx = (i + 0.5) * CELL_PX;
        let sw = 0;
        let sv = 0;
        for (let k = 0; k < pts.length; k++) {
          const dx = pts[k].x - cx;
          const dy = pts[k].y - cy;
          const d2 = dx * dx + dy * dy;
          if (d2 >= r2) continue;
          const t = 1 - d2 / r2;
          const wgt = t * t;
          sw += wgt;
          sv += wgt * pts[k].v;
        }
        if (sw <= 0.001) continue;
        const [r, g, b] = rampColor(sv / sw);
        const o = (j * w + i) * 4;
        px[o] = r;
        px[o + 1] = g;
        px[o + 2] = b;
        px[o + 3] = Math.min(1, sw * 1.2) * MAX_ALPHA * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    canvas.style.opacity = '1';
  }
}

function medianNearest(pts: { x: number; y: number }[]): number {
  if (pts.length < 2) return 80;
  const nn: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    let best = Infinity;
    for (let j = 0; j < pts.length; j++) {
      if (i === j) continue;
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      const d2 = dx * dx + dy * dy;
      if (d2 < best) best = d2;
    }
    nn.push(Math.sqrt(best));
  }
  nn.sort((a, b) => a - b);
  return nn[nn.length >> 1];
}

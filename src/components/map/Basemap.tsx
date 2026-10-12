import 'maplibre-gl/dist/maplibre-gl.css';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';

// MapLibre v6 can't locate its worker under a bundler on its own; point it at the Vite-emitted asset.
setWorkerUrl(workerUrl);

// Free, keyless basemap: OpenFreeMap (OpenStreetMap data) in its light "Positron" style.
// https://openfreemap.org — no API key, no usage limits.
const STYLE_URL = (import.meta.env.VITE_BASEMAP_STYLE_URL as string | undefined) ?? 'https://tiles.openfreemap.org/styles/positron';
const ATTRIBUTION = '&copy; <a href="https://openfreemap.org">OpenFreeMap</a> <a href="https://www.openmaptiles.org/">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const RASTER_ATTRIBUTION = (import.meta.env.VITE_TILE_ATTRIBUTION as string | undefined)
  ?? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Optional escape hatch: any raster {z}/{x}/{y} tile URL (e.g. https://tile.openstreetmap.org/{z}/{x}/{y}.png).
const RASTER_URL = import.meta.env.VITE_TILE_URL as string | undefined;

function VectorBasemap() {
  const map = useMap();
  useEffect(() => {
    const layer = maplibreGL({ style: STYLE_URL, attributionControl: false });
    layer.addTo(map);
    map.attributionControl.addAttribution(ATTRIBUTION);
    return () => {
      map.attributionControl.removeAttribution(ATTRIBUTION);
      map.removeLayer(layer);
    };
  }, [map]);
  return null;
}

export function Basemap() {
  if (RASTER_URL) {
    return <TileLayer url={RASTER_URL} attribution={RASTER_ATTRIBUTION} maxZoom={19} />;
  }
  return <VectorBasemap />;
}

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { RiskHeatLayer, type HeatSample } from './RiskHeatLayer';

export function RiskHeatOverlay({ samples }: { samples: HeatSample[] }) {
  const map = useMap();
  const layerRef = useRef<RiskHeatLayer | null>(null);

  useEffect(() => {
    const layer = new RiskHeatLayer();
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      layer.remove();
      layerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    layerRef.current?.setSamples(samples);
  }, [samples]);

  return null;
}

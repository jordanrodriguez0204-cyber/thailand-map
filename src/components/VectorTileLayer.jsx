import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import '@maplibre/maplibre-gl-leaflet'
import 'maplibre-gl/dist/maplibre-gl.css'

// Rendu vectoriel MapLibre GL pour les styles MapTiler custom :
// le plan Free ne sert pas de tuiles raster PNG pour ces styles (403),
// seul le style.json vectoriel est accessible.
export default function VectorTileLayer({ styleUrl, attribution }) {
  const map = useMap()

  useEffect(() => {
    const layer = L.maplibreGL({ style: styleUrl, attribution })
    layer.addTo(map)
    return () => { map.removeLayer(layer) }
  }, [map, styleUrl, attribution])

  return null
}

# Thailand Travel Map — CLAUDE.md

Voyage Jordaan & Abbey · Thaïlande · Août 2026
App React 18 + Vite 5 + react-leaflet 4 + Supabase + Vercel PWA

## Stack
- Frontend : React 18, Vite 5, react-leaflet 4, Leaflet
- Cartes : MapTiler (`VITE_MAPTILER_KEY` dans .env)
- Backend : Supabase (table `steps`) — mode démo localStorage si clés absentes
- Déploiement : `npx vercel --prod --yes` → https://thailand-map-omega.vercel.app
- Build : `npm run build` (dist/ → Vercel)

## Architecture clé

### Données
- `src/hooks/useSteps.js` — CRUD étapes (Supabase ou localStorage). Seed depuis `src/data/initialSteps.js`
- `src/hooks/useSegments.js` — segments transport entre étapes (`th_segments_${itinId}`)
- `src/hooks/useBudget.js` — **tableau** d'hôtels par étape (`getHotels/addHotel/updateHotel/deleteHotel/selectHotel`). Migration auto ancien format objet → tableau
- `src/hooks/useActivities.js` — activités par étape
- `src/hooks/useItineraries.js` — max 5 itinéraires, stockés localStorage

### Composants principaux
- `src/App.jsx` — layout flex (sidebar + map), FitBounds, FlyTo, contrôles
- `src/components/StepPopup.jsx` — popup étape avec onglets Info/Activités/Météo/Tips/Budget/🔗. Budget tab = multi-hôtels via `HotelsTab` + `HotelCard`
- `src/components/StepList.jsx` — sidebar liste des étapes
- `src/components/HotelMarker.jsx` — marqueur hôtel sur carte (un marker par hôtel avec lat/lng). Sélectionné = bordure violette
- `src/components/HotelPanel.jsx` — tous les hôtels par étape (`getHotels`)
- `src/components/BudgetPanel.jsx` — récap budget, utilise `getSelectedHotel`. Km = `haversine × ROUTE_FACTOR[mode]`
- `src/components/MetroWidget.jsx` — 3-4 stations BTS/MRT les plus proches via OSRM piéton
- `src/components/ExternalToolsPanel.jsx` — drawer outils externes (Windy, 12Go, Agoda…) via `createPortal`
- `src/components/WeatherBadge.jsx` — météo Open-Meteo 7 jours

### Transport & distances
- `src/data/destinations.js` — `TRANSPORT_MODES`, `FACTOR`, `SPEED`, `OVERHEAD`, `estimateDuration(rawKm, mode)`
- `ROUTE_FACTOR` dans BudgetPanel : plane×1.05, train×1.4, bus×1.5, ferry×1.2, car×1.3
- Km affiché = haversine × ROUTE_FACTOR[mode]

### Métro Bangkok
- `src/data/bangkokMetro.js` — stations BTS/MRT avec coordonnées
- `src/utils/metroUtils.js` — `getNearestStations(lat, lng, count)` + `fetchWalkingRoute()` via `routing.openstreetmap.de/routed-foot`

### Conventions importantes
- Sidebar : `position: relative` sur desktop → MapContainer est déjà réduit en width. Ne pas ajouter sidebarWidth dans paddingTopLeft de flyToBounds
- Multi-hôtels : `hotels[stepId]` est un tableau. Le premier ou celui avec `selected: true` est le budget retenu (`getSelectedHotel`)
- Géocodage : Nominatim avec stratégies fallback (voir `doGeocode` dans StepPopup)
- OSRM piéton : endpoint principal = `routing.openstreetmap.de/routed-foot` (supporte foot), fallback `router.project-osrm.org`

## Commandes utiles
```bash
npm run dev          # dev local port 5173
npm run build        # build prod
npx vercel --prod --yes  # déployer
```

## Variables d'env (.env)
```
VITE_MAPTILER_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GEMINI_KEY=...   # plus utilisé (IA supprimée)
```

# JOURNAL — mémoire partagée Cowork ↔ Claude Code

> Convention : lire ce fichier en début de session ; ajouter en fin de session une entrée datée "qui a fait quoi". Rester concis et factuel.

## État actuel (24 juillet 2026)

App de voyage Thaïlande (août 2026) fonctionnelle et déployée : itinéraire 10+ étapes, multi-hôtels avec import Booking, budget, segments transport, météo, métro Bangkok, sync cloud Supabase, PWA. Carte en 3 styles : Clair/Sombre = styles MapTiler custom rendus en vectoriel (maplibre-gl v4 + plugin Leaflet), Satellite = raster MapTiler `hybrid`. Local = origin/main = prod (https://thailand-map-omega.vercel.app), build sain, lint sans erreur bloquante.

## Historique

- **2026-07-16** — Création de l'app (carte Leaflet, étapes, tuiles CARTO Voyager). Commits `45ce58b`, `5d0c547`, `4d4d81c`.
- **2026-07-21** — Grosse journée : app complète (`936f439`), import Booking + comparaison d'hôtels (`ec3a1d2`), sync cloud + sauvegarde JSON + carte sombre (`3e1a473`), styles MapTiler custom "Thailand Day/Night" + refonte UI icônes (`859a08b`, `e944f95`).
- **2026-07-24** — Budget : prix total du séjour en plus du prix/nuit (`852110c`). Audit santé du code (Claude Code) : build OK, pas de conflits/fichiers cassés, uniquement des warnings lint mineurs. Vérification carte : tuiles vectorielles `.pbf` + satellite `hybrid` OK en dev et en prod. Redéploiement sans cache.
- **2026-07-24** — Comparateur : mode **A/B Jordan vs Abbey** — puces J/A par hôtel (`favs` sur l'hôtel, synchro cloud, un choix par personne et par étape), cartes "Sélection Jordan/Abbey" (choix perso, sinon ★), compteur d'accord/désaccord par étape.
- **2026-07-24** — Nouveau **Comparateur du voyage** (`TripComparePanel.jsx`) : tous les hôtels de toutes les étapes avec cases à cocher (panier de comparaison, persisté par appareil dans `th_trip_compare_excl_${itinId}`), ★ retenu partagé avec le Budget, totaux transports + scénarios hôtels (retenus / moins chers / plus chers cochés). Accès : menu "Plus" et bouton dans le panneau Budget. Corrigé au passage la prop `style` dupliquée de BudgetPanel.

## Leçon apprise — incident maplibre v5 (juillet 2026)

Symptôme : carte vide en prod. Le build embarquait maplibre-gl **v5**, incompatible avec `@maplibre/maplibre-gl-leaflet` : style.json, tiles.json et polices chargent (200) mais **aucune tuile `.pbf` n'est demandée**. Résolution : épingler `maplibre-gl@^4.7.1` (v4) et redéployer sans cache de build. La clé MapTiler n'a jamais été en cause (elle sert vecteur ET satellite).

## Règles

- `maplibre-gl` reste en **v4** (`^4.7.1`) tant que le plugin Leaflet ne supporte pas v5. Ne pas upgrader.
- Après tout changement de dépendances : `npm run build` local puis redéployer (`npx vercel --prod --yes`), et vérifier la carte en prod (tuiles vectorielles + satellite).
- Astuce debug : les tuiles `.pbf` sont téléchargées par le **web worker** maplibre — elles n'apparaissent ni dans `performance.getEntriesByType('resource')` ni dans certains outils réseau. Foi au rendu visuel ou à l'onglet Réseau des DevTools.
- Dans un onglet caché/arrière-plan, `requestAnimationFrame` est gelé → maplibre ne charge aucune tuile. Toujours tester carte avec l'onglet visible.

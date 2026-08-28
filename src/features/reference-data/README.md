# features/reference-data

`ReferenceDataService` — CRUD des Catégories et consultation du référentiel
prédéfini des Zones corporelles (§11.9, §12.4).

## Zones corporelles (T01-S08, D-093)

`bodyZones.ts` expose `BODY_ZONES`, le référentiel MVP des Zones corporelles
sélectionnables sur un Exercice : exactement 10 zones (Cou, Épaules, Bras,
Poignets et mains, Dos, Hanches et bassin, Cuisses, Genoux, Jambes, Chevilles
et pieds), chacune avec un `id` stable, un `name` affichable et un `order`
d'affichage. Périmètre MVP délibéré : pas de « Corps entier », pas de
distinction gauche/droite, sélection multiple uniquement.

Ce fichier est la seule source des identifiants/libellés/ordre — jamais codés
en dur ailleurs (`BodyZoneSelector.tsx`, `ExerciseScreen.tsx` le consomment
par les données, pas par une liste recopiée).

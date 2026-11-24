# 2026-11-23 — Gestion des langues : plan et benchmark

## Identification

- **Mission** : LANGUES-PLAN-ET-BENCHMARK — à partir des réponses de Hermann du 23/11, produire le benchmark des concurrents et le plan de ce qui doit être défini puis mis en œuvre.
- **Type** : préparation documentaire, sans correction.
- **Branche** : `claude/exciting-lovelace-iyn2wf`
- **Commit de départ** : `fd4d279` (rapport d'état des lieux `2026-11-23_LANGUES-ETAT-DES-LIEUX.md`)

## Périmètre

- **Demandé** : benchmark des principaux concurrents ; recommandations sur la voix (H3) et les unités (H6) ; explication de la question des gabarits (H7) ; plan de définition et de mise en œuvre. Ajouts en cours de mission : portugais, placé avant l'allemand.
- **Traité** : tout ce qui précède.

## Constats

- Benchmark : 9 applications et les plateformes iOS, Android, Expo SDK 57 et Hermes. Résultats dans `docs/preparation/langues/BENCHMARK-LANGUES-CONCURRENTS-2026-11-23.md`.
- La voix liée à l'interface correspond à l'usage majoritaire. Le changement de langue passe d'ordinaire par le réglage iOS de l'application. L'unité par défaut se déduit de la région.
- Le plan (`docs/preparation/langues/PLAN-GESTION-DES-LANGUES-2026-11-23.md`) consigne :
  - les réponses de Hermann (H1–H8, texte d'origine) ;
  - points à arbitrer (A0–A8) ;
  - 10 lots documentaires (D0–D9) et 8 lots techniques (T1–T8).

## Preuves et tests

Recherche web, sources citées dans le benchmark avec un niveau de preuve V/P/?. **Aucun test applicable.**

## Hypothèses non démontrées

- Les cellules marquées P ou ? du benchmark.
- Le support d'`Intl.PluralRules` par Hermes sur iOS, à vérifier sur iPhone.

## Modifications réalisées

- Création du plan et du benchmark (documents de préparation, non normatifs).
- Aucun fichier applicatif ni normatif modifié.
- Synchronisation code/documentation : sans objet, aucun comportement modifié. Les décisions de Hermann sont recopiées textuellement dans le plan ; leur report au chapitre 07 est le lot D0, après arbitrage de A0–A7.

## Hors périmètre / restant

- Arbitrages A0–A7.
- Mise à jour des chapitres 05, 07, 10, 12 et 13.
- Écran Figma Préférences.
- Lots T1–T8.
- Aucune vérification sur appareil à ce stade.

## Fichiers modifiés

- `docs/preparation/langues/PLAN-GESTION-DES-LANGUES-2026-11-23.md`
- `docs/preparation/langues/BENCHMARK-LANGUES-CONCURRENTS-2026-11-23.md`
- `.github/orchestration/reports/2026-11-23_LANGUES-PLAN-ET-BENCHMARK.md`

## Commit final et état Git

Voir le commit qui contient ce rapport sur `claude/exciting-lovelace-iyn2wf`.

## Complément — second échange du 23/11

- H6 bis (emplacement Langue / Unité, Notifications) et H7 (phrases : simplifier, traduire par IA, relecture native) recopiés dans le plan.
- Recommandation révisée : Langue et Unité dans Profil › Compte. Notifications maintenues hors Confidentialité. A6 tranché ; A8 ajouté.
- Aucun fichier applicatif modifié ; aucun test applicable.

## Complément — troisième échange du 23/11 : lot D0 (classe B)

- Arbitrages A0, A1, A2, A4, A5, A7 de Hermann reportés textuellement au chapitre 07 (section « Gestion des langues — décisions de Hermann du 23/11/2026 », numéro de décision à attribuer), avec 9 règles dérivées.
- Formulations contraires annotées « [Remplacé le 23/11/2026 …] », texte d'origine conservé : chapitres 02 (question ouverte), 05 (Internationalisation), 07 (D-034, D-317, alias du 27/10), 10 (RM-091, Langue du MVP, Voix, Charge RM-235 et tableau), 12 (Internationalisation), 13 (Profil, invariants, comportement).
- Synchronisation code/doc : classe **B** (évolution validée par décision explicite de Hermann) ; aucun code modifié.
- Restent ouverts : A3 (portée de « ou seulement en anglais »), processus de validation des traductions, arrondi kg ↔ lb, écran Figma Profil › Compte.
- Aucun test applicable (documentation seule).

# 2026-11-23 — LANGUES-T1-PLAN : plan d'externalisation des textes

## Identification

- **Mission** : préparer le plan du lot T1 du chantier langues : externaliser les textes encore écrits dans le code (demande de Hermann : « Oui »).
- **Type** : planification ; aucun fichier applicatif modifié.
- **Branche** : `claude/exciting-lovelace-iyn2wf`
- **Commit de départ** : `5117ee0`

## Périmètre

- **Demandé** : le plan.
- **Traité** :
  - inventaire des textes ;
  - plan `docs/preparation/langues/T1-PLAN-EXTERNALISATION-TEXTES-2026-11-23.md` (statut PLAN_READY_FOR_REVIEW).

## Constats

- Analyse syntaxique TypeScript de `src/` et `app/` : 958 littéraux texte, environ 360 textes français destinés à l'utilisateur, dans 20 fichiers.
- Exclus, avec leur motif :
  - phrase de synthèse (T6) ;
  - référentiels (T7) ;
  - textes enregistrés dans les données (T7) ;
  - outils internes ;
  - journaux de débogage ;
  - erreurs techniques.
- Deux coquilles relevées dans `executionStrings.ts` (« l'exercice suivante »), conservées.

## Preuves et tests

- Script d'inventaire exécuté avec `node_modules/typescript` (installé par `npm ci --ignore-scripts`).
- **Aucun test applicable** : planification seule.

## Hypothèses non démontrées

- Les décomptes sont approximatifs : certains textes composés sont comptés en plusieurs fragments.
- Le caractère affiché du message de `SqliteCatalogueRegistry.ts` n'est pas vérifié.

## Modifications réalisées

- Plan T1 et présent rapport.
- Classe de synchronisation code/doc : sans objet (aucun comportement modifié).

## Restant

- Revue et approbation du plan, puis implémentation.
- Contrôle sur iPhone après implémentation.

## Fichiers modifiés

- `docs/preparation/langues/T1-PLAN-EXTERNALISATION-TEXTES-2026-11-23.md`
- `.github/orchestration/reports/2026-11-23_LANGUES-T1-PLAN.md`

## Commit final et état Git

Voir le commit qui contient ce rapport sur `claude/exciting-lovelace-iyn2wf`.

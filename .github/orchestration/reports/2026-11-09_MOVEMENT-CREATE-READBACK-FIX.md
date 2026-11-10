# 2026-11-09 — MOVEMENT-CREATE-READBACK-FIX

## Identifiant et objectif

Corriger dans `main` le défaut de `SqliteMovementRepository.create` révélé par la recette iPhone de l'import des 60 Mouvements pilotes : « The created movement could not be read back ». Fusion limitée à cette seule correction, sur décision de Hermann (9/11) : « Ok pour la fusion telle que tu le préconises », après validation sur iPhone (« 1. Oui »).

## Branche et commit de départ

- Branche : `fix/movement-create-readback-20261109`, worktree `C:/Dev/KODJO-MOVFIX`.
- Départ : `origin/main` `901d7b4c` (Merge PR #420).

## Périmètre demandé / traité

- Demandé : la correction de la relecture seule. L'outil d'import, le corpus de test des 60 fiches et la variante « Routine Catalogue » **restent** sur `catalogue/integration-60-main-20261109`.
- Traité : `SqliteMovementRepository.create` et un test dédié. Rien d'autre.

## Constats

- Recette iPhone, build EAS `f882e911` (branche catalogue, commit `e8d17f16`) : import interrompu au 32e puis au 40e Mouvement, sur des fiches sans particularité ; chaque fiche fautive est enregistrée mais non relue. Import achevé par relances sans doublon.
- `create` écrivait dans `withExclusiveTransactionAsync`, puis relisait par `findById` sur la connexion principale. expo-sqlite exécute la transaction exclusive sur une connexion distincte ; en WAL, la connexion principale peut lire un instantané antérieur.
- Attribution : **plausible** (concurrence non observable directement sur appareil). Défaut antérieur à l'import, qui l'a **détecté** en enchaînant 60 créations. `SqliteSessionRepository.create` relit déjà dans sa transaction et n'est pas concerné. Les autres écritures de `SqliteMovementRepository` ne relisent pas après leur transaction.

## Modification

- `src/infrastructure/database/repositories/SqliteMovementRepository.ts` : relecture via `readMovementRecords(transaction, …)` dans la transaction d'écriture. Une relecture impossible annule l'insertion au lieu de la laisser validée.
- `src/infrastructure/database/__tests__/SqliteMovementRepository.readback.test.ts` : double de base dont la connexion principale est en retard d'un instantané après chaque transaction ; 20 créations successives.

Synchronisation code / documentation : classe **D** (technique, sans effet sur une règle, un écran ou un contrat ; suppression d'une erreur intempestive). Aucun document fonctionnel à modifier.

## Preuves et tests

- Nouveau test : **échoue sans la correction** (« The created movement could not be read back. »), **passe avec**.
- `npx tsc --noEmit` et eslint : propres.
- `src/infrastructure/database/__tests__`, `MovementCatalogue*`, `Catalogue*` : 56 suites, 639 tests, verts.
- PRE-10 (`origin/pre10-bmad/dev` `9aa90d5f`, `composition-phases-duree` `eb06ac60`) ne modifie pas `SqliteMovementRepository.ts`.

## Hypothèses non démontrées

- La cause (instantané WAL en retard sur la connexion principale) reste une hypothèse plausible ; le double de test la modélise. La correction est validée sur iPhone (10/11), ce qui confirme son efficacité sans prouver à elle seule le mécanisme exact.

## Vérifications sur appareil réel

- Build `catalogue-recette` `6987d086` (commit `2631c322` de la branche catalogue, qui contient la même correction) : après réinstallation propre de « Routine Catalogue », un import unique doit donner « 60 ajouté(s) » sans interruption, puis « 0 ajouté(s), 60 déjà identique(s) ». **Préalable à la fusion.**
- **Résultat (Hermann, 10/11/2026) : OK.** « j'ai réinstallé RoutineCatalogue et relancé l'import, 60 mouvements importés avec succès » ; puis « test réalisé, message 0 mouvements ajoutés, tous identiques ». La recette du 9/11 s'interrompait après 31 puis 7 insertions. Fusion dans `main` autorisée conditionnellement par Hermann (« Ok pour la fusion telle que tu le préconises »), condition remplie.

## Hors périmètre

- Outil d'import, corpus de test, variante « Routine Catalogue », circuit de données de catalogue et de médias (arbitrage séparé).

## Fichiers modifiés

- `src/infrastructure/database/repositories/SqliteMovementRepository.ts`
- `src/infrastructure/database/__tests__/SqliteMovementRepository.readback.test.ts`
- `.github/orchestration/reports/2026-11-09_MOVEMENT-CREATE-READBACK-FIX.md`

## Commit final et état Git

Voir le commit qui contient ce rapport sur `fix/movement-create-readback-20261109` ; état communiqué dans le compte rendu de session. Validé sur iPhone le 10/11, puis fusionné dans `main` par la PR #436 (merge commit communiqué dans le compte rendu de session).

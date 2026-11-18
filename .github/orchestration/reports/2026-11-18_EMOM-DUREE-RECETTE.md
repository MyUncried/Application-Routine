# EMOM-DUREE-RECETTE — EMOM en durée : un anneau, retenue au centre, repos à l'objectif (18/11/2026)

## 1. Mission

- **Identifiant** : EMOM-DUREE-RECETTE (recette iPhone du 18/11/2026, ligne emom-6 du cahier en ligne).
- **Objectif** : corriger l'écran d'exécution de l'EMOM en durée selon la note de Hermann (spec PRE-11 §5 point 32, texte recopié).
- **Branche** : `formats/emom-duree-20261118` (branche dédiée demandée, sans fusion), worktree `C:\Dev\KODJO-EMOM-DUREE`.
- **Commit de départ** : `089be960` (branche `formats/emom-amrap-deathby-20261118`, PR #445, après la recette EMOM du 18/11 `0dc5f8a1`).

## 2. Périmètre demandé (baseline gelée)

| PRESERVE | CHANGE | FORBIDDEN |
|---|---|---|
| For time (double anneau et centre identiques) ; autres formats ; saisie et récapitulatif de l'EMOM ; moteur d'exécution hors EMOM en durée | Écran d'exécution de l'EMOM en durée | Modifier le composant du For time autrement que pour le partager ; réécrire les tests en masse ; remplacer une primitive native |

## 3. Périmètre traité

1. Un seul anneau : l'anneau intérieur (`inner`) n'est plus tracé pendant une Série en Durée d'un EMOM ; l'anneau de la minute continue (il porte la fenêtre, indépendante de la retenue).
2. Appui au centre : la zone `execution-duration-zone`, la mention et les fonds du For time sont ouverts à l'EMOM en durée (mêmes expressions, conditions élargies, aucune copie de JSX).
3. Retenue de l'effort seul : la politique EMOM ouvre `HOLD` / `RELEASE` pendant une Série en Durée (comme l'AMRAP, `enables`) ; le noyau retient la seule référence d'étape, la fenêtre continue. Aucune modification du noyau.
4. Double chrono : au centre « effort cumulé / objectif » (« 00:25 / 00:40 ») ; dans le coin du bas à gauche (place et style du décompte du For time, même clignotement), le temps restant de la minute.
5. Repos à l'objectif : la Série se termine seule à l'effort cumulé atteint (référence d'étape retenue) ; titre « Repos », fond orange pâle, anneau du repos ; zone d'appui retirée (sans effet).

## 4. Constats

- Le noyau permettait déjà la retenue d'une étape en durée sous une échéance de portée (For time, AMRAP) : la retenue suspend la seule référence d'étape (`holdStep`), la référence `window` de l'EMOM continue. Pas de `SCOPE_EXPANSION_REQUIRED`.
- La projection EMOM déclarait toujours `RUNNING` : elle lit maintenant `held` comme le For time et l'AMRAP, et indique si la fenêtre porte une Série en Durée (`EmomView.timedWork`).
- Le centre du For time n'est pas un composant distinct mais un ensemble d'expressions de `ExecutionScreen.tsx` (zone, mention, fond, coin) : il est partagé en élargissant leurs conditions (`emomTimedWork`), sans duplication.

## 5. Preuves et tests

- `npx tsc --noEmit -p .` : aucune erreur.
- `npx eslint` (fichiers touchés) : aucun signalement.
- Nouveaux tests :
  - `src/features/execution/__tests__/ExecutionScreen.emomDuree.test.tsx` (2) : un seul anneau (`inner` nul), effort / objectif au centre, minute restante dans le coin, retenue de l'effort seul (fenêtre qui continue, fond orange), retenues répétées, repos à l'objectif (titre, fond, zone retirée), fenêtre 2 à 60 s et fin à 120 s (aucune dérive) ; une seule zone d'appui (celle du For time).
  - `src/domain/execution/__tests__/emom.pre11.test.ts` (+2) : retenues répétées, effort atteint à 55 s avec 15 s de retenue, repos, `HOLD` refusé en repos, fenêtre 2 à 60 s ; `HOLD` refusé pendant une Série en Répétitions.
- `npx jest` (suite complète) : 407 suites, 6 241 tests réussis, 32 ignorés, aucun échec.

## 6. Hypothèses non démontrées / à confirmer

- (a) Fond du repos : orange pâle `#FFEBD1` (aucune teinte donnée).
- (b) Pendant le repos, le chiffre central redevient le temps restant de la minute.
- (c) Le temps restant de la minute prend le coin du bas à gauche.
- (d) Death by en Durée inchangé (demande limitée à l'EMOM).
- (e) Limite technique : si l'échéance tombe pendant une retenue, le résultat de fenêtre (`partialDurationMs`) garde la durée depuis l'ouverture de la Série ; la synthèse, elle, lit l'effort réellement tenu (résultat de l'étape). Corriger le résultat de fenêtre demanderait d'exposer le temps d'étape au pilote (noyau, hors périmètre).
- Rendu non vérifié sur iPhone (aucun navigateur, aucune capture).

## 7. Modifications réalisées et preuve PRESERVE

- `src/domain/execution/policies/emom.ts` : `enables` ouvre `HOLD` / `RELEASE` pendant une Série en Durée (travail non terminé).
- `src/domain/execution/projection.ts` : état `HELD` de la Série en Durée de l'EMOM ; `EmomView.timedWork` (optionnel).
- `src/features/execution/ExecutionScreen.tsx` : `emomTimed`, `emomTimedWork`, `emomTimedRest`, `cornerCountdownMs` ; `inner` nul ; texte central ; coin ; mention, fond et zone élargis ; `EMOM_REST_FILL`.
- PRESERVE : aucun changement dans `kernel.ts`, `policies/forTime.ts`, `policies/amrap.ts`, `policies/deathBy.ts`, `results.ts`, `ExecutionTimerRing.tsx`, `ExecutionCornerBadge.tsx` (git diff --stat) ; dans `ExecutionScreen.tsx`, chaque expression du For time garde sa valeur hors EMOM en durée (`emomTimedWork` faux ⇒ conditions et valeurs identiques ; `cornerCountdownMs` = `durationActive.remainingMs`) ; suites For time, AMRAP, Death by et EMOM existantes inchangées et vertes.

## 8. Éléments non corrigés / hors périmètre

- Death by en Durée (même double anneau) : non modifié, à décider.
- Résultat de fenêtre pendant une retenue à l'échéance : voir § 6 (e).

## 9. Vérifications restant à effectuer sur iPhone (cahier, lignes emom-d)

- emom-d1 : un seul anneau ; emom-d2 : effort / objectif au centre, minute dans le coin ; emom-d3 : retenue au centre, la minute continue ; emom-d4 : repos tout seul à l'objectif ; emom-d5 : aucune dérive ; emom-d6 : For time inchangé.

## 10. Documentation (synchronisation code / documentation)

Classe B : spec PRE-11 §5 point 32 (texte de Hermann recopié) ; registre ch07, nouvelle entrée « EMOM en durée — recette du 18/11/2026 » et annotation de « EMOM — exécution » ; ch13 CE-FMT-05 (annotation). Chapitres 09 et 12 non modifiés.

## 11. Fichiers modifiés

`src/domain/execution/policies/emom.ts`, `src/domain/execution/projection.ts`, `src/features/execution/ExecutionScreen.tsx`, `src/domain/execution/__tests__/emom.pre11.test.ts`, `src/features/execution/__tests__/ExecutionScreen.emomDuree.test.tsx` (nouveau), `_bmad-output/pre11/spec-pre11-formats.md`, `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`, `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`, ce rapport.

## 12. Commit final et état Git

Commit de livraison et état Git : donnés dans le compte rendu de clôture (branche poussée, aucune PR, aucune fusion).

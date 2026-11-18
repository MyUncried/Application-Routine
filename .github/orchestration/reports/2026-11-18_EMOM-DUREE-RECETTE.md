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

## 13. Reprise après le retour de Hermann (18/11/2026)

**Retour** (recopié dans la spec PRE-11 §5 point 33 et au registre ch07, « EMOM en durée — précision du 18/11/2026 ») : « je ne comprends pas ce que tu as fait sur l'EMOM, tu as cassé la logique » — au centre, le chrono de l'intervalle (noir, jamais arrêté, sans valeur fixe), anneau bleu d'un tour par intervalle ; compte à rebours de la Série dans le « triangle » ; centre vert / orange, segment en cours de l'anneau orange pendant la retenue, bleu à la reprise. Libellés : « ma formulation partout » ; « "Appuyer pour" sur la première ligne, "faire une pause" sur la seconde ligne » ; « non, pour la reprise "Appuyez" et "pour repartir" ».

**Constat.** Les points 4 et 5 de la demande initiale (effort cumulé / objectif au centre, minute dans le coin) avaient été appliqués à la lettre ; la précision les remplace. Le noyau et la politique EMOM de `18f575f3` (retenue de la seule Série, minute qui continue, repos à l'objectif) restent valables et inchangés.

**Modifications (écran et libellé seulement).**
- `ExecutionScreen.tsx` : centre = `timerText` (chrono de la fenêtre, comme tout EMOM) ; coin du bas à gauche = compte à rebours de la Série (même badge, mêmes couleurs et clignotement que le For time) ; anneau : couleur du segment en cours orange en retenue (`ringColorOf("SERIES_PAUSE")`), portions passées bleues / orange (`holdSegments`) d'après les bascules notées par l'écran (`advanceHoldMarks`, état React mis à jour pendant le rendu, seulement à une bascule) ; fond blanc au repos (orange pâle `#FFEBD1` retiré).
- `executionStrings.ts` : `pressToHold` = « Appuyer pour » / « faire une pause » (tous les Formats) ; `pressToRelease` inchangé.
- Tests : `ExecutionScreen.emomDuree.test.tsx` réécrit sur la précision (un seul anneau, couleur et portions bleu / orange, chrono central sans « / », compte à rebours de la Série figé en retenue, repos à fond blanc, pas de dérive) ; `ExecutionScreen.forTimeDuree.test.tsx` : seul le libellé de pause attendu change.
- Documentation (classe B) : spec point 33 (point 32 annoté) ; ch07 nouvelle entrée et annotations de l'entrée précédente ; ch13 CE-FMT-05 et anciennes mentions « Appuyez pour faire pause » annotées ; Formats (tableau des états). Chapitres 09 et 12 non modifiés.

**PRESERVE.** For time : double anneau, centre, couleurs inchangés (seul le libellé de pause change, décision explicite) ; `forTimeDuree` vert. Noyau, politiques, AMRAP, Death by, saisie et récapitulatif : non touchés (`git diff 18f575f3 --stat` : écran, libellés, tests, documents).

**Limite (choix technique).** Les bascules de la fenêtre en cours sont notées par l'écran : après une fermeture de l'application en pleine fenêtre, les portions passées de cette fenêtre reviennent au bleu ; le temps et le résultat ne sont pas touchés.

**À confirmer.** (a) Fond blanc au repos (orange réservé à la pause) ; (b) même orange pour la retenue et le repos sur l'anneau ; (c) « triangle » = coin du bas à gauche du For time ; (d) Death by en Durée inchangé.

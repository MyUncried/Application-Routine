# FORMATS-EMOM-AMRAP-DEATHBY — Exécution des autres Formats (18/11/2026)

## 1. Mission

- **Identifiant :** FORMATS-EMOM-AMRAP-DEATHBY (PRE-11, tranches T2 EMOM, T3 AMRAP, T4 Death by).
- **Objectif :** rendre exécutables sur iPhone les Formats EMOM, AMRAP et Death by, sur le modèle du For time déjà livré.
- **Demande de Hermann (18/11/2026), recopiée :** « Oui tu attaques les autres formats. Prends en considération ce qui a été fait pour For Time, je pense que tous les élément existent déjà. »
- **Branche :** `formats/emom-amrap-deathby-20261118` (dossier `C:\Dev\KODJO-FORMATS`), partie de `a3845e0f` (fiche Mouvement 3.0.0, PR #444, elle-même partie de `main` `5fe5e519`, fusion du For time, PR #443).
- **Arbitrages du 18/11/2026 :** spec PRE-11 §5 point 30 (commandes « Comme le For time », feuille du For time pour les fins, partiel AMRAP « exercice en cours seul », sons existants).

## 2. Périmètre

| Format | Statut |
|---|---|
| EMOM (T2) | Réalisé, à vérifier sur iPhone (section 3) |
| AMRAP (T3) | À venir |
| Death by (T4) | À venir |

Hors périmètre : synthèse des résultats en fin de séance (reportée, §13.4 PRE-10), qualification transverse T5.

## 3. EMOM (T2)

### 3.1 Sources appliquées

- Classe A : FMT-20 à FMT-25, FMT-35, FMT-36 (ch10) ; conception consolidée D5, Q1, Q4, Q5, §12.2, §12.5 ; cas T10, T11, T26, T28 ; ch10 « L'Exécution continue à progresser lorsque l'application passe en arrière-plan » ; EMOM « À l'objectif » seul (ch07, 07/11/2026 ; spec §6.6).
- Classe B : arbitrages du 18/11/2026 (barre et Arrêt du For time ; sons existants). Remplace D4 « La Pause manuelle reste toujours possible » pour l'EMOM.
- Écran : Figma `8982:15709` « Exécution d'une séance — EMOM — repos déclaré » (lecture de la source, aucune validation visuelle).

### 3.2 Comportements livrés

- **Compilation.** Une portée `EMOM` par élément : Exercice EMOM (autonome, À la suite, en alternance — une portée par tour dans un Circuit standard) ou Circuit porteur « dans chaque intervalle ». Une fenêtre par Série (au tour k pour le Circuit porteur), ses deux côtés et la pause entre eux compris (Q5), terminée par son repos (`WINDOW_REST`, fin avec la fenêtre). La Récupération d'un exercice À la suite suit l'échéance de sa dernière fenêtre (FMT-21). Aucun Point d'arrêt dans la portée (D4).
- **Fenêtres.** Durée = Intervalle (ou intervalle commun). « Suivant » termine une Série en Répétitions ; une Série en Durée démarre seule et finit à son terme (« Suivant » refusé). Le travail terminé révèle le repos (T11) ; la fenêtre suivante commence à l'heure (FMT-23, D5) ; une confirmation à l'échéance est acquise (Q4) ; une seconde confirmation ne compte pas (T10).
- **Fenêtre non terminée.** Résultat « non terminée » ; bandeau non bloquant dans la fenêtre suivante (valeur proposée 0, stepper standard, coche, « Passer ») ; commande `DECLARE` du noyau, sans changement d'étape (T28). À la fin, feuille « Fin de l'EMOM » par fenêtre restant à saisir (coche seule) ; aucune feuille sinon. Une Série en Durée interrompue enregistre sa durée tenue.
- **Écran.** Grand chrono = temps restant de la fenêtre ; anneau : portion travaillée en violet, repos en orange ; « Repos » orange dans le cercle ; titre = exercice. Barre : Arrêt, Pause désactivée, « Suivant » 72. Arrêt : feuille « Arrêt de l'EMOM » (répétitions faites ou durée tenue), puis synthèse, temps continu derrière la feuille. Pas de fondu des textes (comme le For time).
- **Sons.** Bip long au début de chaque fenêtre (réglage « Démarrage d'un exercice »), annonces conservées ; 3 bips courts avant l'échéance de chaque fenêtre, pendant le travail et le repos ; pas de signal minute dans une fenêtre.
- **Arrière-plan.** Aucune Pause pendant les fenêtres (comme le For time).
- **Validité.** EMOM avec une cible À l'échec : séance invalide (`LOCKED_CONSTANT_CHANGED`).
- **Progression et durée estimée.** Chaque fenêtre pèse sa durée (N × W, E × N × W en alternance).

### 3.3 Constats

- Le noyau, les références WINDOW et les politiques de test PRE-10 couvraient déjà la mécanique ; il manquait la compilation des fenêtres, la politique réelle, la déclaration non bloquante (aucune commande ne permettait d'enregistrer un résultat sans changer d'étape : ajout de `DECLARE`), et la projection de la fenêtre.
- Dans une fenêtre, le signal « toutes les minutes » d'une Série en Répétitions tombait sur l'échéance (W = 60 s) : retiré dans les fenêtres.

### 3.4 Interprétations à confirmer (À CLARIFIER, n'empêchent aucune opération)

1. Coche du bandeau (absente de la phrase de Q1) pour rendre la saisie explicite ; le bandeau dure toute la fenêtre suivante.
2. Compteur « Minute 3/12 » de la maquette non affiché : la zone garde Série · Tour · Cycle.
3. L'appui « travail terminé » est porté par « Suivant » ; le cercle ne réagit pas (désactivé en For time, recette ftr2-regle-suivant).
4. Circuit porteur : la saisie d'une fenêtre non terminée porte sur l'exercice en cours à l'échéance (règle de l'AMRAP).
5. Fenêtre interrompue pendant la pause entre les côtés : « non terminée », rien à saisir.

### 3.5 Tests

- `npx tsc --noEmit -p .` : aucune erreur.
- `npx eslint` sur les fichiers touchés : aucun signalement.
- Nouveaux : `src/domain/execution/__tests__/emom.pre11.test.ts` (13 : compilation et durée, T11, T10, D5/Q1/T28 avec « Passer » et Clôture, sans Clôture, Q4, Série en Durée, Q5 bilatéral, T26 alternance, Circuit porteur, Arrêt, signaux, invariant À l'échec) ; `src/features/execution/__tests__/ExecutionScreen.emom.pre11.test.tsx` (2 : déroulé complet à l'écran, Arrêt).
- Attentes anciennes annotées (EMOM n'est plus l'exemple de Format indisponible ; l'AMRAP le remplace) : `plan.pre10.test.ts`, `configurationValidity.d4.test.ts`, `formatCapabilities.d3.test.ts`.
- `npx jest src/domain/execution src/features/execution src/domain/sessions src/infrastructure/haptics` : 75 suites, 1 123 tests réussis.
- `npx jest` (suite complète) : 402 suites, 6 204 tests réussis, 32 ignorés, 1 échec — garde PRE4-1.1/AC1 (`legacyModeConfinement`) : faux positif sur `bannerLeaf?.target ?? null` (`projection.ts`), réécrit sans changement de comportement ; garde et suites `domain/execution`, `features/execution` relancées : 161/161.

### 3.6 Vérifications à effectuer sur l'iPhone (Routine BMAD, Metro de `KODJO-FORMATS`)

| Ligne | Vérification |
|---|---|
| emom-1 | EMOM d'un mouvement (3 × 10 rép., 1 min) : grand chrono 01:00 qui décompte ; barre Arrêt, Pause grisée, Suivant |
| emom-2 | Suivant à mi-fenêtre : « Repos » orange, anneau violet puis orange, Suivant grisé ; fenêtre suivante à 00:00 |
| emom-3 | Fenêtre laissée sans Suivant : bandeau « Fenêtre 1 non terminée », valeur, coche ; puis « Passer » sur une autre |
| emom-4 | Fin de l'EMOM : feuille « Fin de l'EMOM » pour la fenêtre passée ; validation → exercice suivant |
| emom-5 | Arrêt pendant une Série : feuille « Arrêt de l'EMOM », valeur, coche → synthèse |
| emom-6 | Série en Durée : démarre seule, compte à rebours en bas à gauche, repos jusqu'à l'échéance |
| emom-7 | Sons : bip long au début de chaque fenêtre, 3 bips avant la fin |
| emom-8 | En alternance (A 1 min, B 1 min 30) : A, B, A, B ; dans chaque intervalle : A puis B dans la même minute |
| emom-9 | Exercice bilatéral : les deux côtés dans la même fenêtre |
| emom-10 | Arrière-plan pendant une fenêtre : au retour, le temps a continué |

## 4. AMRAP (T3)

À venir.

## 5. Death by (T4)

À venir.

## 6. Documentation (synchronisation code / documentation)

- Classe B : registre ch07 « EMOM — exécution (18/11/2026) » (décisions recopiées) ; conception consolidée, D4 annotée (texte d'origine conservé) ; ch13 CE-FMT-05 §7 complété ; référence Formats §10.1 ; spec PRE-11 §5 point 30 et §8 « T2 — EMOM ».
- Classe A : déroulement des fenêtres, arrière-plan, invariant À l'échec (règles déjà écrites).
- Chapitres 09 et 12 **non modifiés** (règle de la mission) ; compléments à reporter : résultats par fenêtre (ch09), commande `DECLARE` et pilote `EMOM` (ch12) — notés dans l'entrée ch07.

## 7. Fichiers modifiés, commit et état Git

- Domaine : `src/domain/execution/plan.ts`, `kernel.ts`, `projection.ts`, `signals.ts`, `policies/emom.ts` (nouveau), `policies/index.ts` ; `src/domain/sessions/formats/capabilities.ts`, `configurationValidity.ts`.
- Écran et service : `src/features/execution/ExecutionScreen.tsx`, `ExecutionEmomBanner.tsx` (nouveau), `ExecutionPartialRepetitionsSheet.tsx`, `ExecutionClosureSheet.tsx`, `ExecutionService.ts`, `executionStrings.ts` ; `src/infrastructure/haptics/ExecutionSignalAdapter.ts`.
- Tests : voir 3.5.
- Documents : voir 6 ; ce rapport.
- Commit, résultats de la suite complète et état Git : donnés dans le compte rendu de la livraison EMOM (commit `feat(pre11): exécution de l'EMOM (T2)`), branche poussée, sans PR.

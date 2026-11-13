# PRE-11 — Exécution des Formats (AMRAP, EMOM, For time, Death by)

Branche `pre11-formats`, partie de `main` 60395a6a (PRE-10 fusionné, PR #439). Rapport de mission : `.github/orchestration/reports/2026-11-13_PRE11_FORMATS.md`.

## 1. Demande

Hermann, 13/11/2026, après la fusion de PRE-10, en réponse à la proposition de développer d'abord le média plein écran : « Pourquoi ne pas s'attaquer maintenant aux autres formats ? L'affichage de la vidéo est moins prioritaire, et fonctionnera de la même manière pour tous les formats ».

Le média plein écran (§13.7 de `_bmad-output/pre10-son-voix/spec-guidage-reglages.md`) passe après PRE-11.

## 2. Sources normatives

- Décisions du 02/11 (D1 à D6, Q1 à Q6) et cas T10 à T28 : `docs/preparation/moteur-execution/KODJO-Conception-moteur-execution-consolidee-2026-11-02.md` (l. 41-58, §12 l. 337-381, tableau l. 512-530, livraison l. 561).
- Règles des Formats : `docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md` (FMT-21 à FMT-42, l. 1356-1430), `docs/KODJO-Formats-entrainement-2026-11-02.md`.
- Écrans : `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`, CE-FMT-05 (l. 2660-2745) et CE-FMT-06 (l. 2746-2830) ; seule frame Figma : `8982:15709` « EMOM — repos déclaré ».
- Tabata : préconfiguration standard, élément libre, déjà exécutable en PRE-10 (`src/domain/sessions/formats/capabilities.ts:145`). Hors PRE-11.

## 3. État du code (13/11/2026)

- Lancement refusé : `capabilities.ts` (`executionAvailable: false`), `plan.ts` `launchabilityOf` (`engine-unavailable`), `compileExecutablePlan` lève une erreur sur un segment de Format.
- Déjà présents : développement du plan par Format (`src/domain/sessions/planExpansion.ts:248-311`), noyau à pilotes et portées (`kernel.ts`, rôles WINDOW, DEADLINE, STOPWATCH, étape CLOSURE / commande SUBMIT), phases BLOCK_REST / WINDOW_REST / CLOSURE, politiques de test AMRAP et EMOM non raccordées (`src/domain/execution/testing/testPolicies.ts`), table `execution_results` générique.
- Manquent : pilotes réels, émission des portées dans `plan.ts`, registre des pilotes dans `ExecutionService`, projection à plusieurs niveaux (aujourd'hui `frames.length === 1`), signaux de fenêtre et d'échéance, résultats par élément formaté, écran (cadran, Clôture).

## 4. Découpage

| Tranche | Contenu | Cas de recette |
|---|---|---|
| T1 | Socle commun (portée de Format, registre des pilotes, autorisation de lancement par Format, Clôture générique, résultats persistés, reprise) + For time | T15, T19, T21, T24, Q4, R6 |
| T2 | EMOM (autonome, À la suite, En alternance, Dans chaque intervalle), appui sur le cadran, bandeau Q1, invariant « EMOM sans À l'échec » | T10, T11, T26, T28 |
| T3 | AMRAP (borne de bloc, buy-in, incrément signé, repos entre blocs, Clôture à chaque bloc) | T12, T13, T14, T25 |
| T4 | Death by (rangs, appui unique, arrêt D2, limite de l'intervalle, fin collective, CE-FMT-06) | T16, T17, T18 |
| T5 | Qualification transverse (Cycle, Circuit groupé, bilatéral R-02), mise à jour documentaire §21 | T23 |

## 5. Décisions de Hermann du 13/11/2026 (recopiées)

1. Ordre : « For time d'abord (Recommandé) » → T1 = socle + For time, puis EMOM, AMRAP, Death by.
2. Écran de Clôture : « Réutiliser « Résultat de série » (Recommandé) » → la modale existante « Résultat de série » (Figma `8937:35362`), avec les champs du Format ; pas de maquette préalable.
3. Chronomètre du For time : « Temps écoulé. La borne peut apparaître dans le triangle du haut à gauche » → le grand chrono compte le temps écoulé ; la borne, si elle existe, s'affiche dans le coin du haut à gauche du cercle (celui des répétitions dans un exercice libre).

## 6. Contradictions relevées entre sources (à trancher dans la tranche concernée)

1. CE-FMT-06 (choix « Limite atteinte / Abandonner », puis synthèse) contre D3 et FMT-34 (la Séance continue) — T4.
2. `KODJO-Formats-entrainement` §14.2 (Point d'arrêt interne qui suspend) contre D4 (Point d'arrêt refusé dans un Format) ; `arbitrages-pre9.md:151` (Tabata parmi les éléments à fenêtre) — D4 et la préconfiguration Tabata prévalent (décisions plus récentes).
3. §14.1 (incrément AMRAP ≥ 0) contre l'incrément signé du complément du 05/11 — T3.
4. `planExpansion.ts:48-51` (« À CLARIFIER ») contre FMT-34 / T16 (redémarrage au départ, tranché) — T4.
5. Descripteur `capabilities.ts` : cas `NON_DEFINI` (A4, A6) tranchés depuis par D1, D2, D5, Q1, §12.3 — mis à jour au fil des tranches.
6. EMOM « À l'objectif » seul (07/11) non imposé dans `configurationValidity.ts` (`main`) ; l'invariant existe dans la PR #430 (conflictuelle, non fusionnée) — repris isolément en T2.
7. Numéros D-514 / D-515 de `main` différents de ceux des PR #424, #426, #431 — signalé, sans action dans PRE-11.

## 7. À CLARIFIER (non bloquant pour T1)

- Articulation côté / fenêtre (R-02) — T5.
- Unité jouée par un membre AMRAP autonome dans un Circuit alterné — T3.
- Acquisition d'un membre Death by en Durée — T4.
- Forme du partiel AMRAP (un nombre ou un par membre) — T3.
- Bouton Abandonner pendant un Death by — T4.
- Sons propres aux Formats (fins de fenêtre, échéance) — T2.
- Synthèse et affichage des résultats en fin de séance — hors PRE-11 (Synthèse reportée, §13.4 PRE-10).

## 8. Suivi des tranches

(À compléter au fil de l'implémentation.)

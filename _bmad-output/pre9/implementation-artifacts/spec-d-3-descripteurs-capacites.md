# D.3 — Descripteurs de capacités par Format

Story PRE-9, epic D. Autorisation : mission de Hermann « KODJO — PRE-9 : lancement du développement BMAD » (29/10/2026). Plan : `../planning-artifacts/epics.md` § D.3 ; architecture §6 (« Descripteur de capacités ») et §7. Dépend de : C.1 (`done`).

## Livré

`src/domain/sessions/formats/capabilities.ts` : type minimal et table `FORMAT_CAPABILITIES`, un descripteur par modèle de la grille (6 Formats, 5 départs rapides, Libre), appliqué à l'élément porteur, **sans logique d'exécution**. `executionAvailable` est faux pour tous (aucun moteur spécialisé en PRE-9). Le développement du plan (D.1) lit l'expansion `PROGRESSIVE` dans ces descripteurs (une seule source).

## Table documentaire (sources : `recherche/03-formats.md` §1.4, `architecture-pre9.md` §7)

| Modèle | Porteur | Expansion | Références temporelles (A2) | Déclencheurs | Expiration (A4) | Fin | Progression | Résultats (A6) | NON DÉFINI |
|---|---|---|---|---|---|---|---|---|---|
| Libre, départs rapides | Éléments libres (FMT-28) | Finie | Étape, phases, pause de série | Cible atteinte, Suivant, échéance d'étape | Fin d'étape | Plan parcouru | Fixe | Génériques (motif, résultat, achèvement) | — |
| Tabata | Exercice ou Circuit | Finie | Étape 20 s, pause 10 s | Échéance d'étape | Fin d'étape (règle Durée) | Élément parcouru | Fixe | Génériques | Résultat spécifique partiel |
| Intervalles 30/30 | Exercice ou Circuit | Finie | Étape 30 s, pause 30 s | Échéance d'étape | Fin d'étape | Élément parcouru | Fixe | Génériques | Résultat spécifique partiel |
| EMOM | Exercice ou Circuit | Finie (N × E fenêtres) | Fenêtre de l'élément, étape, phases | Échéance de fenêtre ; appui = fin du travail | Fenêtre suivante, aucun repos inventé (FMT-23/25, REC-13) | Dernière fenêtre | Fixe | Génériques | Résultat d'une fenêtre non terminée (A6) ; coexistence fenêtre / série Durée, phases, côtés (A2, R-02) |
| AMRAP | Exercice ou Circuit | Progressive (borne de l'élément) | Échéance de l'élément, étape, phases | Borne, cible, Suivant | **NON DÉFINI** : étape en cours à l'échéance (A4) | Borne | Contenu répété | Génériques + tours réalisés (FMT-26) | Tour partiel (A6) ; suite de la Séance après l'élément (A4) |
| For time | Exercice ou Circuit | Finie | Chronomètre de l'élément, étape, phases | Cible atteinte, Suivant | Sans objet (aucune limite de temps dans les sources) | Travail accompli | Fixe (échelle) | Génériques + temps (FMT-32) | — |
| Death by | Exercice (plusieurs : R-03) | Progressive | Fenêtre, rang par horloge | Échéance, appui, arrêt déclaré | Fenêtre sans appui non acquise (FMT-36) | Arrêt déclaré | Objectif dynamique q0 + (rang − 1)·d | Génériques + tours acquis et répétitions partielles (FMT-37/38) | Suite après une fenêtre non acquise (A4) ; plusieurs Exercices (R-03) ; suite de la Séance après l'élément (A4) |

Les cas NON DÉFINI ne sont pas tranchés ici ; ils sont instruits par D.5 (document) et présentés à Hermann avant PRE-10 / PRE-11 (`arbitrages-pre9.md` §3).

## Synchronisation code / documentation

- **Classe A** : contenu repris des règles FMT, REC et ch12 l.1824-1834, sans règle nouvelle.
- **Classe D** : type et table de données ; `planExpansion.ts` lit l'expansion dans les descripteurs. Aucun document normatif modifié.

## Tests

- `src/domain/sessions/__tests__/formatCapabilities.d3.test.ts` : 4 tests verts (un descripteur par modèle, aucun moteur disponible, expansion progressive d'AMRAP et Death by seulement, porteur cohérent avec le registre, lacunes explicites) ; `planExpansion.d1` relancé, vert ; `tsc` et ESLint sans erreur.

## Correction du 30/10 — Format porté par l'Exercice

Porteur `EXERCISE` pour les six Formats ; `EXERCISE_OR_CIRCUIT` retiré. La colonne « Porteur » de la table ci-dessus (« Exercice ou Circuit », « Exercice (plusieurs : R-03) ») est historique : le porteur est l'Exercice ; la question Death by « plusieurs Exercices (R-03) » est remplacée par celle du rang de reprise au passage groupé suivant et du raccordement en alternance (D-29, PRE-10/11) ; voir `spec-c-1-persistance-registre-formats.md`, section « Correction du 30/10 — Format porté exclusivement par l'Exercice » (décision de Hermann, classe B). Tests : `formatCapabilities.d3` 4/4.

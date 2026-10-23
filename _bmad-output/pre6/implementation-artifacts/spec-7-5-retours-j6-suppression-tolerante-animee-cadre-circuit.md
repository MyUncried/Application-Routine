---
title: 'Story 7.5 — Retours J6 : suppression tolérante et animée, cadre du Circuit au changement de zone'
type: 'feature'
created: '2026-10-23'
status: 'review'
baseline_commit: '2f82bc4d'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-7-1-domaine-deplacement-tolerant-debut-fin-de-tour.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-7-4-glisser-defilement-automatique-et-coherence.md'
  - '{project-root}/docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Recette différentielle J6 de Hermann (22/10) :
- d-9 : la suppression d'un Exercice qui laisserait un Point d'arrêt interdit ou consécutif est refusée (refus doux de D-441) ; et « La suppression d'un exercice doit se faire avec un fondu pour la carte qui disparaît et un glissement des cartes. »
- d-17 (verbatim) : « Déplacement du haut hors circuit, dans le circuit : une zone grise rectangulaire remplace la carte qui se trouvait au dessus de la carte déplacée. Déplacement de la première carte du circuit en dehors vers le haut : dans le circuit un rectangle blanc persiste au niveau du circuit. Un appui long sur une carte ou l'aller retour vers l'ouverture d'une carte remet la présentation en ordre. »

**Approach:** (AC1) la suppression passe par la règle tolérante du déplacement (`settle`) ; (AC2) fondu de la carte puis glissement de la suite par le registre des translations existant, écriture du brouillon à la fin ; (AC3) cause NON prouvée sur appareil : la disposition React est démontrée correcte dans les deux scénarios (le résidu est natif) ; hypothèse retenue — le recalcul, par Fabric iOS, de la translation d'une vue animée qui change de taille — et correctif préventif : renvoi natif des translations des vues redimensionnées, à confirmer au jalon J6b.

## Boundaries & Constraints

**Always:**
- Sources : D-442 amendée (ch07, commit `2f82bc4d`) ; epics.md « Story 7.5 » ; specs 7.1 (déplacement tolérant), 7.2 (choix de Tour, annonce des points retirés), 7.4 (registre, `prepareLayoutCommit`).
- **AC1** : supprimer un Exercice est APPLIQUÉ ; les points en cause sont retirés sans message visuel, mêmes règles et même ordre que le déplacement (Circuit vidé → ses points ; interdits ; puis le second de chaque paire consécutive ; emplacement partagé) ; conflit de Tour créé (N ≥ 2) → `CHOICE_REQUIRED` et dialogue « Début de tour / Fin de tour » comme le déplacement. Refus doux, annonce de refus et textes retirés.
- **AC2** : fondu de la carte supprimée (et des points retirés), puis glissement des éléments suivants (cartes, points, cadre du Circuit, Fin de séance) ; « Réduire les animations » : écriture immédiate. Aucune régression du glisser ni du placement.
- **AC3** : après un dépôt qui fait entrer une carte dans le Circuit ou en fait sortir la première vers le haut, aucune zone grise ni rectangle blanc résiduel, sans appui long ni réouverture.
- Fins de ligne préservées par fichier.

**Never:**
- Aucune modification de `docs/`, `.github/`, `_bmad-output/pre6.zip` ; aucune migration ; aucune nouvelle dépendance ; `tokens.ts` inchangé.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected |
|---|---|---|
| [A, P, B], supprimer A | — | A supprimée, P retiré (annonce discrète) |
| [A, P, B, Q, C], supprimer B | — | B supprimée, Q retiré, P conservé |
| Circuit vidé portant un point | — | ses points retirés |
| N = 2, [A, P, B, Q] dans le Circuit, supprimer A | — | dialogue ; Annuler : rien ; Début : Q retiré ; Fin : P retiré |
| Suppression animée | disposition mesurée | fondu 150 ms, glissement 180 ms, écriture |
| « Réduire les animations » / disposition non mesurée | — | écriture immédiate |
| Seconde suppression pendant l'animation | — | ignorée |
| Glisser, placement, « Continuer », perte du premier plan pendant l'animation | — | glisser refusé ; placement / sortie : suppression écrite d'abord ; « Continuer » : suppression écrite, nouveau toucher requis |
| d-17 : B (juste au-dessus du Circuit) entre dans le Circuit | — | cadre et cartes à leur place |
| d-17 : première carte du Circuit sortie vers le haut | — | cadre et cartes à leur place |

</frozen-after-approval>

## Code Map

- `src/domain/sessions/composition.ts` : `removeOccurrenceOutcome` → `settle` ; commentaires.
- `src/features/sessions/CompositionScreen.tsx` : `deletionResult`, `PendingDeletion`, `startDeletion`, fondu (effet), glissement (`resolveRemovalShifts` dans les cibles du registre, `whenSettled`), choix de Tour `OCCURRENCE_DELETE`, rail (`railSkipped`), garde-fous ; `resyncNative` aux changements de taille (Circuit, rangées) ; retrait de `deletionRefusedAnnouncement`.
- `src/features/sessions/compositionGesture.ts` : `resolveRemovalShifts`.
- `src/features/sessions/compositionRail.ts` : plusieurs éléments sortis de la chaîne.
- `src/features/sessions/useAnimatedShift.ts` : `resyncNative`.
- `src/shared/i18n/resources/fr.ts` : clés de refus retirées.
- Tests : `composition.test.ts`, `compositionDeletion.test.ts` (nouveau), `useAnimatedShift.test.ts`, `CompositionScreen.test.tsx`, `src/shared/i18n/index.test.ts`.
- `src/domain/README.md`, `src/features/sessions/README.md`.

## Tasks & Acceptance

**Execution:**
- [x] AC1 domaine + écran (choix de Tour) + retrait du refus doux et de ses textes + tests.
- [x] AC2 fondu + glissement + rail + garde-fous + tests.
- [x] AC3 cause, correctif, tests des deux scénarios.
- [x] README.

**Acceptance Criteria:**
- Given l'arbre entier, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.
- Given un iPhone, when le jalon J6b est mené, then d-9 et d-17 sont conformes.

## Implementation Notes

**Cause de d-17 — hypothèse, non prouvée.** Sous Fabric iOS, une fois qu'une vue a reçu sa translation du pilote natif d'Animated, les commits React ne la touchent plus (`node_modules/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm` l. 351-353, `propKeysManagedByAnimated`) ; mais quand la TAILLE de la vue change, Fabric RECALCULE sa translation à partir des propriétés qu'il a gardées (`_props`, l. 650-658), que les mises à jour natives et les commits remplacent tour à tour — elles peuvent porter la translation de l'aperçu du glisser. La bande centrale du fond du Circuit (`CircuitSurface`) est la seule vue animée dont la taille suit le Circuit : au dépôt d'une carte qui entre (Circuit agrandi) ou sort (Circuit rétracté), elle peut garder la translation et l'étirement de l'aperçu (bord haut remonté d'un pas : zone grise sur la carte du dessus ; bord haut descendu d'un pas : rectangle blanc dans le Circuit) tant qu'aucune pose native ne la rétablit — c'est exactement ce que fait un appui long (`reset` : `setValue(0)` de toutes les valeurs) ou le retour d'écran (vues rattachées). Le haut, le bas arrondis et l'en-tête, de taille fixe, ne sont pas touchés, ce qui correspond au constat (une zone RECTANGULAIRE). Limite (revue, écarts de vérification) : depuis la story 7.4, un dépôt appliqué pose déjà la valeur native à 0 après le rendu ; dans les deux ordres possibles (pose native avant ou après le montage), cette pose devrait suffire à rétablir la vue — le modèle n'explique donc pas à lui seul un décalage persistant, et le renvoi ajouté renvoie la même pose une fois de plus. Il reste utile si une pose native est perdue ou précède un recalcul tardif ; d'autres causes natives (recyclage des vues de la carte remontée dans l'autre liste, fond de rangée de la carte déplacée) ne sont pas exclues. Correctif PRÉVENTIF : `AnimatedShiftRegistry.resyncNative` renvoie au pilote natif la cible posée (même valeur) des bords du Circuit quand le Circuit change de taille (`handleTourLayout`), et d'une rangée quand elle change de taille (`handleRowLayout` : même mécanisme pour les rangées que le placement agrandit). Preuve en Jest : les deux scénarios exacts (pilote natif simulé de bout en bout) montrent une disposition JS correcte — le défaut n'est pas dans l'arbre React — et vérifient que le changement de taille du Circuit renvoie ses deux bords (0, 0) au pilote natif, une seule fois par taille ; le recalcul natif lui-même n'est pas reproductible hors iOS : preuve sur iPhone au jalon J6b.

**Suppression animée.** `startDeletion` relève la disposition (`buildDragLayout`) ; phase `fade` : opacité 1 → 0 (150 ms, pilote natif, démarrée après le rendu, une microtâche plus tard) sur la carte et les points retirés, sortis de la chaîne du rail (leurs voisins se relient à travers leur place) ; phase `slide` : `resolveRemovalShifts` devient la cible du registre (180 ms, animé même après un dépôt appliqué) ; fin (`whenSettled`) : `prepareLayoutCommit` puis écriture, rejouée sur le brouillon courant (`deletionResult`), annonce discrète des points retirés.

**Choix non dictés (à valider par Hermann)**
1. Durées : fondu 150 ms (`DELETE_FADE_DURATION_MS`, courbe `Easing.out(quad)`), puis glissement 180 ms (celui du glisser) — enchaînés, pas simultanés.
2. Les points retirés par la suppression s'effacent avec la carte ; annonce VoiceOver « Point d'arrêt retiré » (comme le déplacement, story 7.2), aucun message visuel.
3. Une seule suppression animée à la fois (seconde demande ignorée) ; aucun soulèvement pendant l'animation ; « Continuer » pendant l'animation écrit la suppression et demande un nouveau toucher ; entrée en placement et perte du premier plan : suppression écrite d'abord.
4. Conflit de Tour à la suppression (N ≥ 2) : dialogue « Début de tour / Fin de tour / Annuler », comme le déplacement.
5. d-17 : renvoi natif à chaque changement de taille du Circuit et des rangées (hors glisser compris, sans effet visible).

## Spec Change Log

## Review Triage Log

Trois revues indépendantes du 23/10/2026 (aveugle, cas limites, écarts de vérification), sous-agents en lecture seule. Triage du développeur.

**Corrigés**
1. Haut (cas limites 1, vérification principal) — bande du fond du Circuit écrasée pendant le glissement d'une suppression dans le Circuit (`dragHeight` = hauteur relevée au dernier glisser, 0 sans glisser) : hauteur relevée au début de la suppression ; test `scaleY` (échoue sans le correctif).
2. Moyen (aveugle 1, cas limites 2) — Dupliquer, Monter / Descendre (cartes et points) ignorés pendant une suppression animée ; changement de N : suppression écrite d'abord ; carte et points en fondu masqués à VoiceOver ; test.
3. Moyen (aveugle 2, cas limites 5) — écriture rejouée sur le dernier brouillon rendu : annonce des points réellement retirés ; rejeu sans suppression → opacité rétablie, rien d'annoncé.
4. Moyen (cas limites 3) — garde de sortie : une suppression en cours bloque la sortie (dialogue d'abandon).
5. Bas (aveugle 3, cas limites 6) — `startDeletion` se protège d'une suppression déjà en cours.
6. Bas (cas limites 4, aveugle 5) — suppression refusée pendant un glisser ; une carte en retour animé reste hors de la chaîne du rail pendant une suppression.
7. Moyen (vérification a) — cause de d-17 requalifiée : hypothèse et correctif préventif (spec, README).

**Acceptés / soumis à Hermann (J6b)**
- Cas limites 7 — rendu possible avec décalage compté deux fois au commit (même mécanisme que les dépôts de la 7.4) : à observer.
- Cas limites 8, aveugle 5 — le rail des voisines traverse la carte dès le début du fondu : choix visuel à valider.
- Cas limites 9 — focus VoiceOver après suppression non reporté sur une voisine.
- Aveugle 4 — démontage pendant le glissement : `prepareLayoutCommit` après `stopAll` (poses natives sur des vues détachées, sans effet visible).
- Aveugle 6 — « Continuer » pendant l'animation : premier toucher absorbé (choix 3).
- Aveugle 7 — un redimensionnement pendant une animation n'est pas renvoyé (la fin de l'animation pose la cible).
- Vérification b — écran « Fin de tour » d'une suppression, garde-fous placement / « Continuer » / perte du premier plan, renvoi natif des rangées : sans test écran dédié.
- Aveugle 8 — commentaire du Domaine « conflit de Tour créé par une duplication » : cas théorique conservé du juge strict.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2`
- `npx tsc --noEmit`
- `npm run lint`

**Manual checks (J6b)** : supprimer un Exercice entre deux points, en tête, dans le Circuit (N = 1 et N = 2) ; observer fondu puis glissement ; refaire les deux gestes de d-17 plusieurs fois, en déposant vite et lentement.

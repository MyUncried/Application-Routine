---
title: 'Story 7.7 — Mouvements : disparition plus lente, apparition de la copie, actions glissées (D-438)'
type: 'feature'
created: '2026-10-23'
status: 'review'
baseline_commit: '835f2df3'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-7-6-douceur-des-mouvements.md'
  - '{project-root}/docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Recette J6c de Hermann (23/10), j6c-4, verbatim : « La disparition doit être encore plus lente. Lorsqu'on copie une carte, elle apparaît aussi brutalement, il faut qu'elle apparaisse en fondu plus lentement, idem pour le mouvement des cartes. Idem pour les mouvements glisser gauche et droite, pas d'arrêt brutal. »

**Approach:** D-438 (« Mouvements »). Fondu de suppression ralenti ; apparition en fondu lent de la copie de Dupliquer pendant que les éléments suivants glissent ; ouverture, fermeture et retour des actions glissées par le glissement partagé, sans changer le mécanisme de geste.

## Boundaries & Constraints

**Always:**
- Sources : D-438 (ch07, commit `835f2df3`) ; epics.md « Story 7.7 » ; spec 7.6 (`compositionMotion.ts`).
- **AC1** : fondu de suppression plus lent que 260 ms ; glissement des suivantes recalé (fin après le fondu).
- **AC2** : Dupliquer : la copie apparaît en fondu lent ; les éléments suivants (cartes, points, cadre du Circuit, Fin) glissent pour lui faire place, par le registre des translations existant.
- **AC3** : actions glissées (Figma `8328:28863`) : ouverture, fermeture, retour avec décélération ; mécanisme de geste inchangé (responder system, même `Pressable`, mêmes seuils).
- **AC4** : aucune régression de j6c-1 à j6c-7 ; « Réduire les animations » : sans mouvement.

**Never:**
- Aucune modification de `docs/`, `.github/`, `_bmad-output/pre6.zip` ; aucune dépendance ; aucune règle métier changée ; pas de remplacement de la primitive du geste.

## I/O & Edge-Case Matrix

| Scenario | Expected |
|---|---|
| Supprimer | fondu 450 ms ; glissement à 200 ms (320 ms) ; écriture à la fin des deux |
| Dupliquer (disposition mesurée) | brouillon écrit aussitôt ; copie en fondu 0 → 1 (450 ms) ; suivantes posées un pas plus haut, glissent (320 ms) |
| Dupliquer, « Réduire les animations » ou disposition non mesurée | copie affichée aussitôt, rien ne glisse |
| Lâcher un balayage | la carte rejoint ouverte (−154) ou fermée (0) en 320 ms, décélération ; les actions restent dessous jusqu'à la fin d'une fermeture |
| Fermeture par une autre cause (autre carte, Dupliquer, Supprimer, œil, pas accessible) | même retour animé |

</frozen-after-approval>

## Code Map

- `src/features/sessions/compositionMotion.ts` : fondu 450 ms, délai 200 ms, `MOTION_APPEAR_DURATION_MS`.
- `src/features/sessions/compositionGesture.ts` : `resolveInsertionPoses`.
- `src/features/sessions/useAnimatedShift.ts` : `prepareLayoutCommit` accepte plusieurs poses.
- `src/features/sessions/CompositionScreen.tsx` : apparition de la copie (`appearance`), fondu « qui part » / « qui arrive » (`leaving`), actions glissées (`AnimatedPressable`, `swipeX`, `settleSwipe`).
- Tests : `compositionMotion.test.ts`, `CompositionScreen.test.tsx`.
- `src/features/sessions/README.md`.

## Tasks & Acceptance

- [x] AC1, AC2, AC3, tests, README.
- Given l'arbre entier, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert. Given un iPhone, when J7, then j6c-4 conforme.

## Implementation Notes

**Disparition.** `MOTION_FADE_DURATION_MS` 260 → 450 ms ; glissement lancé à 200 ms (fin vers 520 ms), écriture à la fin du fondu ET du glissement (7.6).

**Apparition de la copie.** Le brouillon est écrit AUSSITÔT (choix) : la copie doit être dans la mise en page pour être dessinée, et l'enregistrement, la garde de sortie et les actions suivantes voient d'emblée le brouillon final (la suppression, elle, est écrite à la fin parce que la carte doit rester dessinée pendant son fondu). Avant le rendu, `resolveInsertionPoses` pose les éléments qui suivent la source là où ils étaient (un pas plus haut : hauteur de la source + écart de sa zone ; bords du Circuit et Fin selon la zone), puis le registre les fait glisser vers 0 ; la copie, à l'opacité 0, apparaît en fondu (450 ms, démarré une microtâche après le rendu). Pendant l'apparition, la copie reste touchable et accessible (contrairement à une carte qui s'efface). Une suppression lancée pendant l'apparition l'achève (opacité 1).

**Actions glissées.** Primitive inchangée : la carte reste le `Pressable` du responder system (même gestion des touchers, mêmes seuils, même `swipeTranslateX` logique) ; seul son rendu passe par `Animated.createAnimatedComponent(Pressable)` pour porter une translation horizontale animée (`swipeX`) : elle suit le doigt (`setValue`), puis rejoint la position de repos par `Animated.timing` 320 ms, courbe `MOTION_EASING`, pilote natif (au lieu d'y être posée d'un coup par un état). Le groupe d'actions reste monté jusqu'à la fin d'une fermeture (`isSwipeSettling`). Aucun ressort : pas de mécanisme natif de ressort dans cette primitive (responder system) ; la décélération de la courbe partagée assure la fin progressive.

**Choix non dictés (à valider en J7)**
1. Fondus de disparition et d'apparition : 450 ms (proposition reprise) ; glissement de la suppression lancé à 200 ms.
2. « idem pour le mouvement des cartes » lu comme : les cartes suivantes glissent (au lieu de sauter) pour faire place à la copie ; leur vitesse reste celle de 7.6 (320 ms), validée en J6c.
3. Brouillon de Dupliquer écrit aussitôt (voir ci-dessus).
4. Actions glissées : 320 ms, même courbe que les glissements ; « Réduire les animations » : position posée.
5. La copie en apparition reste touchable et lisible par VoiceOver.

## Spec Change Log

## Review Triage Log

Trois revues indépendantes du 23/10/2026 (aveugle, cas limites, écarts de vérification), sous-agents en lecture seule.

**Corrigés**
1. Haut (aveugle 1, cas limites 1) — la carte portait une translation horizontale animée (pilote natif) et une translation verticale par état React dans la même `transform` : sous Fabric iOS, après une animation native, les commits n'appliquent plus `transform` — le suivi vertical du doigt pendant le glisser aurait pu se figer. La translation verticale passe aussi par une valeur animée (`dragY`, `setValue`).
2. Moyen (aveugle 2, cas limites 2) — groupe d'actions touchable et lu par VoiceOver pendant le retour d'une fermeture (double « Dupliquer ») : inerte et masqué pendant le retour ; test.
3. Moyen (aveugle 3, cas limites 4) — poses et apparition posées avant de savoir si le Domaine crée la copie : Domaine d'abord.
4. Moyen (aveugle 4, cas limites 3) — seconde copie pendant l'apparition de la première : la première est affichée pleinement ; les éléments encore en mouvement ajoutent le reste de leur chemin à leur pose ; test.
5. Moyen (aveugle 5) — Dupliquer pendant un glisser, un aperçu tenu ou une mise en place : ignoré ; test.
6. Bas (aveugle 9) — fin de l'apparition déclenchée dans un updater d'état et avant le choix de Tour d'une suppression : déplacée après le lancement effectif de la suppression.
7. Moyen (vérification) — « Réduire les animations » des actions glissées testé ; délai de 200 ms épinglé ; harnais `swipeMotion()` étendu aux `describe` qui balayent (les animations natives ne se terminent pas sous Jest).

**Acceptés / signalés (J7)**
- Aveugle 6, cas limites 5 — balayage repris pendant le retour : la base est la position logique (saut possible au premier mouvement).
- Aveugle 7 — `isSwipeSettling` reste vrai pendant un nouveau geste (sans effet : le geste se termine toujours par un `settleSwipe`).
- Aveugle 8 — rangée de placement sous la carte : position logique (le balayage est inactif en placement).
- Aveugle 10, cas limites 6 — l'apparition rend le registre animé pendant 450 ms ; la copie peut être soulevée pendant son apparition.
- Cas limites 3b — seconde copie avant la mesure de la première : affichée sans fondu (disposition incomplète).
- Aveugle 11 — pose native de repli (tâche suivante) : à observer sur appareil.
- Aveugle 12 — un abonnement « Réduire les animations » par carte.

## Verification

**Commands:** `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`.

**Manual checks (J7)** : supprimer, dupliquer (hors Circuit, dans le Circuit, après), ouvrir / fermer / relâcher à mi-course les actions glissées, ouvrir une autre carte pendant qu'une est ouverte ; « Réduire les animations ».

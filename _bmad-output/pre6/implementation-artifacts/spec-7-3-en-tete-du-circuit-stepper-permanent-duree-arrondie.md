---
title: 'Story 7.3 — En-tête du Circuit : stepper permanent et durée arrondie'
type: 'feature'
created: '2026-10-22'
status: 'review'
baseline_commit: '2927c892'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-7-2-ecran-recuperation-en-placement-etiquette-d301-point-souleve.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-3-1-en-tete-du-circuit-et-compteur.md'
  - '{project-root}/docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Recette iPhone du 22/10 (commentaires 8 à 12) : dans l'en-tête du Circuit, les cibles du nombre de tours sont trop petites et collées à la pastille d'unité ; les textes de la ligne sont plus petits que « Circuit » ; le chiffre n'a pas le format « Valeur modifiable » ; le stepper n'apparaît qu'après un toucher du chiffre (choix D8) ; la durée du Circuit affiche des secondes ou un arrondi supérieur alors que c'est une estimation.

**Approach:** Stepper − / + toujours affiché et actif autour du chiffre (en « Valeur modifiable ») et de la pastille d'unité, sur le fond blanc arrondi du Figma `8328:28605` ; cibles réelles de 44 (boîtes qui débordent du dessin par marges négatives, sans changer la hauteur de l'en-tête) ; textes de la ligne à 16 ; suppression de l'état « révélé » et de son code ; durée de l'en-tête du Circuit arrondie à la minute la plus proche au-delà de 3 min.

## Boundaries & Constraints

**Always:**
- Sources : D-442 (ch07 l. 17-18, « En-tête du Circuit », « Durée du Circuit ») ; ch13 CE-T03-08 (l. 631, 1474, 1498, 1561, 1678, 1694) ; ch10 RM-027 (l. 553) ; epics.md « Epic 7 », story 7.3 ; Figma `8328:28605` (stepper ouvert « Circuit (− 3 tours +) ≥ 19 min »), `5271:5455`.
- **AC1** :
  - − N unité + toujours affichés et actifs (aucun toucher préalable, aucun état « révélé ») ; − et + bornés 1..99 (désactivés visuellement à la borne) ; maintien appuyé `EXECUTION_UNIT_HOLD_POLICY` conservé ;
  - N en « Valeur modifiable » (fond `colors.surface`, rayon 10, marges 10 / 4, texte `primary`) ; pastille d'unité inchangée dans son rôle (ouvre le choix de nature, menu natif iOS) ;
  - nombre, unité et durée à la taille du titre « Circuit » (16) ;
  - cibles −, + et pastille ≥ 44 de haut (et de large), sans recouvrement entre elles ni avec le titre, par des boîtes réelles (aucun `hitSlop` hors parent) ; l'en-tête garde sa hauteur minimale de 40 (débordement des boîtes compensé par marges négatives) ;
  - à court de place : la durée cède d'abord, puis le titre ; le compteur ne se tronque jamais ;
  - chaque changement de N passe par `onChangeCount` → `handleCircuitCountChange` (`circuitCountOutcome`, dialogue Début / Fin de tour de la story 7.2).
- **AC2** : durée de l'en-tête du Circuit (`formatCompositionSummary`) > 3 min arrondie à la minute la plus proche, préfixe d'estimation (≈ / ≥) conservé ; ≤ 3 min inchangée ; « — min » inchangé ; durée de séance (`formatCompositionSessionDuration`) inchangée.
- **AC3** : réglage ajustable « Nombre de tours » / « Nombre de séries », valeur annoncée avec l'unité (« 3 tours »), incrémenter / décrémenter bornés ; − et + sont des boutons accessibles (état désactivé à la borne) ; pastille « Nature du circuit » distincte.
- Suppression de l'état révélé : props `isCounterOpen` / `onToggleCounter`, `OverlayKind` `"circuitCount"`, fermeture du compteur par toucher extérieur, défilement, Continuer, dialogues, glisser — la mécanique reste pour le seul panneau de nature (Android / web).
- Textes dans `fr.ts` ; `tokens.ts` inchangé (valeurs hors registre en constantes locales) ; fins de ligne préservées par fichier.

**Never:**
- Aucun changement du Domaine, de migration, de repository ni d'API ; aucune modification sous `docs/`, `.github/` ; aucune nouvelle dépendance.
- Ne pas changer `InlineStepper` ni les autres steppers ; ne pas changer la durée de séance ni la carte de Séance.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Au repos | N = 3, Tours | « Circuit (− 3 tours +) ≈ 19 min », − et + actifs | — |
| Borne basse | N = 1 | − désactivé (signe `disabled`), + actif | toucher − : rien |
| Borne haute | N = 99 | + désactivé | maintien + : arrêt à 99 |
| + à N = 1 avec début et fin de Tour | toucher + | dialogue de Tour (7.2) | Annuler : N = 1 |
| Maintien de + | appui long | pas répétés (500 ms puis 150 ms) | relâchement : arrêt |
| Toucher de la pastille (iOS) | — | menu natif Tours / Séries | — |
| Placement actif | — | en-tête non interactif, masqué à l'accessibilité | — |
| Durée exacte 181 s | — | « 3 min » (était « 4 min ») | — |
| Durée exacte 120 s | — | « 2 min » (inchangé) | — |
| Borne ≥ 210 s | — | « ≥ 4 min » (était « ≥ 3 min 30 s ») | — |
| Borne ≥ 105 s | — | « ≥ 1 min 45 s » (inchangé) | — |
| Estimée 1 100 s | — | « ≈ 18 min » (était « ≈ 19 min ») | — |
| Largeur 375, « 99 séries » | — | compteur entier, durée tronquée (ellipse) | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/CircuitHeader.tsx` : stepper permanent, cibles, tailles.
- `src/features/sessions/CompositionScreen.tsx` : retrait de l'état révélé (`"circuitCount"`), fermeture limitée au panneau de nature.
- `src/features/sessions/compositionPresentation.ts` : arrondi de la durée du Circuit.
- `src/shared/i18n/resources/fr.ts` : libellés des boutons − / +.
- Tests : `CircuitHeader.test.tsx`, `CompositionScreen.test.tsx`, `compositionPresentation.test.ts`, `src/shared/i18n/index.test.ts`, `SqliteSessionRepository.test.ts` (attendu du résumé du Circuit : 255 s → 4 min).
- `src/features/sessions/CircuitNatureMenu.tsx` : commentaires.
- `src/features/sessions/README.md`.

## Tasks & Acceptance

**Execution:**
- [x] AC1 : stepper permanent, Valeur modifiable, tailles, cibles réelles, ordre de cession + tests.
- [x] AC2 : arrondi de la durée du Circuit + tests.
- [x] AC3 : accessibilité + tests.
- [x] Retrait de l'état révélé et du code mort + tests réécrits.
- [x] README.

**Acceptance Criteria:**
- Given l'arbre entier, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit` et `npm run lint` sont lancés, then tout est vert.
- Given un iPhone (375, 402), when la recette J6 est menée, then les commentaires 8 à 12 de la recette du 22/10 sont conformes.

## Implementation Notes

**Géométrie retenue (texte Inter 16 mesuré sur la police embarquée : « Circuit » 51,3 ; « 3 » 10,2 ; « 99 » 20,5 ; « tours » 40,3 ; « séries » 47,0 ; « ≥ 19 min » 63,4)**
- Fond blanc du stepper : hauteur 36, rayon 18, marge 4 (Figma `9819:19951`).
- − et + : cercles 28 `colors.surface` dans des boîtes de 44 × 44 (marges −4 en haut et en bas, −8 du côté du bord du fond) : le cercle reste à 4 du bord du fond, la boîte déborde de 4 hors du fond et de 2 hors de l'en-tête de 40.
- Écarts visibles : cercle − → chiffre 8 ; chiffre → pastille 6 ; pastille → cercle + 12 (cibles pastille / + séparées de 4) ; titre → fond 8 (cible − à 4 du titre ; Figma 20 avec des textes à 13) ; fond → durée 4.
- Largeur du compteur : 90 + chiffre + pastille (« 3 tours » 180,5 ; « 99 séries » 197,5). Place restante pour la durée avec « 3 tours » : 375 → 38 (tronquée) ; 402 → 65 (« ≥ 19 min » entier) ; 440 → 103.
- Pastille : boîte de 44 de haut (pastille centrée), marges −4 verticales ; sa largeur (≥ 53) dépasse 44.

**Choix non dictés (réversibles, à signaler à Hermann)**
1. Stepper composé localement (boutons `Pressable` à boîte réelle, `createHoldRepeater` + `steppedValue` + `EXECUTION_UNIT_HOLD_POLICY` de `ProfileStepper`) plutôt qu'`InlineStepper` : celui-ci est un seul élément accessible qui engloberait la pastille de nature (inaccessible à VoiceOver sur iOS) et ses cibles reposent sur `hitSlop`.
2. Libellés VoiceOver des boutons : « Retirer un tour » / « Ajouter un tour » (« … une série » en Séries), suffixe « — minimum atteint » / « — maximum atteint » à la borne.
3. Chiffre de largeur naturelle (pas de largeur fixe à deux chiffres) : le + se décale d'environ 10 au passage 9 → 10.
4. Durée Regular 16 (taille du titre, graisse et couleur tertiaire conservées).
5. Arrondi : demi-minute vers le haut (`Math.round`) ; seuil strict (> 180 s) ; la borne minimale (≥) est elle aussi arrondie au plus proche (« ≥ 3 min 20 s » → « ≥ 3 min », mais « ≥ 3 min 30 s » → « ≥ 4 min », qui dépasse le minorant connu) — **à arbitrer par Hermann** (alternative : `Math.floor` pour « ≥ »). Conséquence visible : avec un seul Circuit, l'en-tête du Circuit peut afficher une minute de moins (exact / ≈, arrondi au plus proche) ou de plus (≥) que la durée de séance (arrondi supérieur, inchangée).
6. À 375, la durée est presque toujours tronquée (38 pt pour « 3 tours ») : conséquence de la taille 16 imposée ; à valider par Hermann sur iPhone (D-442 ne fixe pas la priorité de lisibilité de la durée).
7. Un pas referme le panneau de nature (Android / web) ; une roulette de borne ouverte (superposition plein écran) n'est pas concernée.
8. Premier pas après 100 ms d'appui (`unstable_pressDelay`) : un défilement commencé sur − ou + ne change pas N.

## Spec Change Log

## Review Triage Log

Trois revues indépendantes du 22/10/2026 (aveugle, cas limites, écarts de vérification), sous-agents en lecture seule. Triage du développeur, sous la délégation de Hermann.

**Corrigés**
1. Haut (vérification 1) — `index.test.ts` (lexique) et `SqliteSessionRepository.test.ts` (255 s → 4 min) rouges : mis à jour.
2. Moyen (aveugle 1) — pas déclenché au début d'un défilement sur − / + : `unstable_pressDelay` 100 ms.
3. Moyen (aveugle 2, cas limites 1) — − / + inopérants sous TalkBack / clavier (pas d'`onPress`) : `onPress` fait un pas s'il n'a pas été précédé d'un `pressIn`.
4. Moyen (cas limites 4, vérification 4) — maintien qui reprendrait après le dialogue de Tour si le relâchement n'est pas transmis : arrêt du répéteur quand `isChoicePending` (dialogue en attente) ou `isAttenuated` (placement, cas limites 9) passe à vrai ; test écran par le bouton +.
5. Bas→Moyen (aveugle 3, vérification 2) — fond de 36 et boîte de la pastille en hauteur fixe (Dynamic Type) : hauteurs minimales.
6. Bas (cas limites 8) — deux gestes VoiceOver rapides : partent de la dernière valeur demandée.
7. Bas (aveugle 12, cas limites 10) — ref de rappel instable : `useCallback`.
8. Bas (aveugle 6, 7 ; vérification 9) — commentaires périmés (`CircuitNatureMenu.tsx`), README 5.1b / 5.2 marqués « révisé par la story 7.3 ».
9. Bas (aveugle 9, 10 ; vérification 7) — tests : signe grisé à la borne (`tintColor`), valeurs littérales de géométrie, activation sans toucher, délai d'appui.

**Acceptés / soumis à Hermann**
- Aveugle 4, cas limites 2 — « ≥ » arrondi au plus proche (peut dépasser le minorant) : lecture littérale de D-442 conservée, arbitrage demandé (choix 5).
- Aveugle 5, cas limites 3 — écart d'une minute avec la durée de séance : conséquence de la règle (choix 5).
- Vérification 3 — durée tronquée à 375 : choix 6, à juger sur iPhone.
- Vérification 6 — roulette de borne laissée ouverte par un pas : la roulette est une superposition plein écran qui couvre le stepper ; choix 7.
- Aveugle 8 — annonce de borne doublée (suffixe + désactivé) : même rendu qu'`InlineStepper`.
- Aveugle 11, vérification 5 et 8 — ordre VoiceOver avec le menu natif, largeur réelle de la pastille, débords sous Fabric : recette iPhone.
- Cas limites 5 (pas refusé sans rendu), 6 (deux doigts), 7 (borne atteinte pendant le maintien, `onPressOut` toujours émis) : sans effet observable ou identique à `InlineStepper`.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` : 145 suites, 4005 tests, vert.
- `npx tsc --noEmit` : vert.
- `npm run lint` : vert.

**Manual checks** : recette iPhone au jalon J6 (après 7.4).

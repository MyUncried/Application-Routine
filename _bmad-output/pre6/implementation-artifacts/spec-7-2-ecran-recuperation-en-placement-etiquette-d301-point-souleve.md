---
title: 'Story 7.2 — Écran : récupération seulement en placement, Étiquette, fin de D-301, point soulevé, choix de Tour'
type: 'feature'
created: '2026-10-22'
status: 'review'
baseline_commit: 'b3a12e43'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-7-1-domaine-deplacement-tolerant-debut-fin-de-tour.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-6-3-retrait-en-placement-et-libelle.md'
  - '{project-root}/docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La story 7.1 a livré au Domaine les règles de D-437 (déplacement tolérant, début et fin de Tour, retrait de récupération en placement). L'écran ne les expose pas encore : la récupération reste réglable hors placement (toucher, bulle « Retirer »), l'avertissement D-301 s'affiche toujours, la puce Étiquette est une pastille ronde, un Point d'arrêt saisi n'est pas marqué, les choix « Début de tour / Fin de tour » sont traités comme des refus muets, et l'emplacement libre de tête de Circuit n'est pas dessiné.

**Approach:** Brancher l'écran de Composition sur l'API de 7.1, sans changer le Domaine : récupération réglable seulement en placement (zones sélectionnables), dialogue natif de choix de Tour pour toutes les opérations qui le demandent, annonce discrète des points retirés, emplacement de tête dessiné dans le Circuit ; retirer D-301, la bulle et les actions accessibles de la récupération ; Étiquette en icône teintée ; point soulevé marqué.

## Boundaries & Constraints

**Always:**
- Sources : D-437 (ch07 l. 8-19) ; ch13 CE-T03-08 (« Complément D-437 » points 1 à 9, §8 à §20) ; epics.md « Epic 7 », story 7.2 ; API exactes de la spec 7.1 (« API pour la story 7.2 »).
- **AC1** : hors placement, la récupération de la ligne 3 n'est plus une cible (ni toucher → roulette, ni appui long → bulle, ni action accessible propre) ; sa valeur reste lue dans le nom de la carte ; le toucher et l'appui long de la carte couvrent la ligne 3. Code mort retiré (bulle, actions, clés, tests remplacés par ceux de la nouvelle règle).
- **AC2** : en placement, chaque zone de récupération d'un Exercice est sélectionnable. Sélectionnée (ajout, ou récupération existante, 0 comprise, non retirée) : cadre plein `primary` avec la durée ; toucher → désélection (`deselectPlacementRecovery`). Non sélectionnée : cadre en pointillés « Récupération » ; toucher → roulette (valeur initiale : durée existante, sinon défaut du Profil) ; ✓ → `selectPlacementRecovery`, X → rien. Libellés, état sélectionné, indices et annonces VoiceOver ; libellé de Confirmer par `placementConfirmation` ; Confirmer applique (`applyPlacementDraft`), Annuler restaure.
- **AC3** : D-301 retirée : ni message, ni annonce, ni clé, ni `unpausedTransitions.ts` (et ses tests) s'il n'a plus d'usage.
- **AC4** : puce Étiquette avec Étiquette : icône `label-outline` teintée de la couleur de l'Étiquette à la place de la pastille ; sans Étiquette : inchangée.
- **AC5** : Point d'arrêt soulevé : puce au style sélectionné (plein `primary`, symbole et texte blancs) et ombre de la carte soulevée, sans changer la hauteur de la rangée.
- **AC6** :
  - points retirés par un déplacement ou un pas de carte : aucun message visuel ; annonce discrète « Point d'arrêt retiré » ; focus sur la carte pour un pas ; aucune mesure de rangée conservée pour un point disparu ;
  - `CHOICE_REQUIRED` (glisser et pas d'une carte, dépose et pas d'un point, placement — emplacement libre ou resélection —, compteur du Circuit via `circuitCountOutcome`) : dialogue natif « Début de tour » / « Fin de tour » / « Annuler » ; un choix applique `resolutions.HEAD` / `.TAIL` rejouées sur l'état courant ; Annuler ne change rien (retour animé existant) ; pendant le dialogue, l'élément lâché reste où il a été lâché (mécanique du dialogue de perte, story 5.2b) ;
  - emplacement libre `CIRCUIT_HEAD` dessiné dans le Circuit, entre son en-tête et sa première carte, centré, raccordé au rail ;
  - « Monter » / « Descendre » d'une carte qui retire un point : assumé (D-437).
- Textes dans `fr.ts` ; `tokens.ts` inchangé ; cibles tactiles réelles (aucun `hitSlop` hors parent) ; fins de ligne préservées par fichier.

**Never:**
- Aucun changement du Domaine (sauf correctif nécessaire et testé), de migration, de repository ni d'API.
- Aucune modification sous `docs/`, `.github/`, ni de `tokens.ts` ; aucune nouvelle dépendance.
- Ne pas remplacer de primitive acceptée (roulette native, `Pressable`, `Modal`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Récupération hors placement | toucher / appui long sur la ligne 3 | ouvre l'Exercice / saisit la carte | — |
| Récupération existante 20 s en placement | toucher | désélectionnée, « Confirmer les modifications » | — |
| Récupération existante 0 s | entrée en placement | cadre sélectionné « 0 s » | — |
| Zone désélectionnée (ex-20 s) | toucher | roulette à 20 s ; ✓ 45 → sélectionnée 45 | X : reste désélectionnée |
| Zone sans récupération | toucher | roulette au défaut du Profil | — |
| Confirmer un retrait | 20 s désélectionnée | `postActivityRecoverySeconds = null` | — |
| Carte glissée laissant un point en tête de Séance | [A, P, B] → A après B | appliqué, P retiré, annonce | — |
| Conflit de Tour au glisser | N = 2, début + fin créés | dialogue ; carte tenue | Annuler : retour animé |
| Conflit au placement | N = 2, fin existante, toucher la tête | dialogue | Annuler : rien |
| Compteur 1 → 2 avec début et fin | + | dialogue ; Début : fin retirée | Annuler : N = 1 |
| Placement, Circuit non vide | — | puce libre en tête de Circuit | — |
| Point saisi | appui long sur le point | puce pleine `primary`, ombre | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/CompositionScreen.tsx` : écran (placement, récupérations, dialogue de Tour, annonces, tête de Circuit, D-301).
- `src/features/sessions/PlacementLayer.tsx` : cadre de récupération sélectionnable.
- `src/features/sessions/ActivityRecoveryLine.tsx`, `OccurrenceCard.tsx` : ligne 3 en simple affichage.
- `src/features/sessions/StopPointChip.tsx` : état soulevé.
- `src/features/sessions/CompositionContextHeader.tsx` : puce Étiquette.
- `src/features/sessions/TourBoundaryChoiceDialog.tsx` (nouveau) : dialogue natif.
- Retirés : `RemovalBubble.tsx`, `measureAnchor.ts` (si sans usage), `src/domain/sessions/unpausedTransitions.ts` et leurs tests.
- `src/shared/i18n/resources/fr.ts` (+ `index.test.ts`).
- Tests : `CompositionScreen.test.tsx`, `CompositionPausesFlow.integration.test.tsx`, tests unitaires des composants touchés.

## Tasks & Acceptance

**Execution:**
- [x] AC1 : récupération hors placement en simple affichage, code mort retiré + tests.
- [x] AC2 : zones de récupération sélectionnables en placement + tests.
- [x] AC3 : retrait de D-301 + tests.
- [x] AC4 : puce Étiquette + tests.
- [x] AC5 : point soulevé + tests.
- [x] AC6 : annonces des retraits, dialogue de Tour (cinq chemins), tête de Circuit + tests.
- [x] README des répertoires touchés.

**Acceptance Criteria:**
- Given l'arbre entier, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit` et `npm run lint` sont lancés, then tout est vert.
- Given un iPhone, when la recette J6 est menée, then les points 1, 2, 4 à 9 du complément D-437 (ch13) sont conformes.

## Implementation Notes

Domaine inchangé (seuls des commentaires de `circuit.ts` et `placement.ts` sont mis à jour : l'écran appelle désormais `circuitCountOutcome` et `togglePlacementStopPointOutcome`).

**Choix faits sur les cas non dictés (réversibles, à signaler à Hermann)**
1. **Dialogue natif `Alert`** (`TourBoundaryChoiceDialog.tsx`) à trois boutons « Début de tour », « Fin de tour », « Annuler » (style cancel ; sur Android, retour ou toucher hors du dialogue = Annuler). `DecisionDialog` (dialogue de perte) n'en porte que deux sur une ligne de 2 × 147 ; sa mécanique est reprise : élément lâché tenu, retour animé à l'annulation, rejeu sur l'état courant. Titre « Point d'arrêt en début et en fin de tour », message « Les deux se suivraient entre deux tours. Lequel conserver ? » (à valider).
2. **Résolution « l'autre point »** (7.1, décision 1) : au déplacement d'un point ou à l'ajout en placement, choisir la limite opposée retire le point déplacé ou jette l'ajout.
3. **Zone de récupération existante désélectionnée** : pointillés « Récupération » et opacité réduite du point « à retirer » (story 6.3) — NON VÉRIFIABLE. Noms « Ajouter une récupération après {exercice} » (sans récupération) / « Récupération après {exercice} » (existante) ; indices « Toucher pour retirer cette récupération. » / « Toucher pour choisir sa durée et la conserver. » ; annonces « Récupération retirée » / « Récupération sélectionnée » suivies du libellé de Confirmer.
4. **Roulette d'une zone existante** : ouverte sur la durée du brouillon (une modification jetée par la désélection n'est pas reprise) ; roue non déplacée sur une valeur hors grille : valeur historique conservée (comportement 4.2) ; valeur invalide (NaN, négative, non entière) : défaut du Profil.
5. **« Ajouter un arrêt »** : une récupération existante suffit à le rendre disponible ; indice « Permet de modifier ou de retirer les pauses existantes. » (récupérations) ou « Permet de retirer des points d'arrêt existants. » (points seuls) quand aucun ajout n'est possible.
6. **Points retirés** : « Point d'arrêt retiré » / « {n} points d'arrêt retirés » ; pas d'une carte : focus sur la carte ; glisser : annonce seule ; pas d'un point qui retire ce point : focus sur la carte qui précède son emplacement, à défaut le compteur du Circuit.
7. **Point soulevé** : style sélectionné du placement et ombre de la carte soulevée pendant le seul glisser (`isDragged`, comme la carte) — NON VÉRIFIABLE.
8. **Étiquette** : icône `label-outline` teintée (`tintColor`) ; une couleur claire (jaune) est peu contrastée sur la puce blanche — à juger sur iPhone.
9. **Tête de Circuit** : rangée sentinelle `CIRCUIT_HEAD_SLOT_POINT` (identifiant réservé) en tête de la séquence du Circuit en placement, rendue comme les rangées de placement (rail, cible bornée à 9). À N = 1 avec un Exercice avant le Circuit, « après {exercice} » et « au début du circuit » sont tous deux proposés (7.1, décision 7) : en choisir un retire l'autre.
10. **Compteur** : choix demandé avant tout changement de N ; pendant le dialogue, les pas suivants (maintien) sont ignorés.
11. Icône `remove-recovery` conservée dans `KodjoIcon` et le manifeste Figma (catalogue des exports).

**Retirés** : `RemovalBubble.tsx`, `measureAnchor.ts`, `domain/sessions/unpausedTransitions.ts` (et tests), roulette de modification hors placement, actions « Modifier / Retirer la récupération », clés `pauses.modifyRecovery`, `pauses.removeRecovery`, `pauses.modifiableRecoveryAccessibilityLabel`, `unpausedWarning`.

**Tests** : `CompositionScreen.test.tsx` (5.1, 4.1, 5.3, 4.2, 6.3 réécrits vers D-437 ; D-301 → absence de message ; bloc « tête de Circuit, choix de Tour et points retirés » ; glisser d'une carte et dépose d'un point à choix ; annonce d'un dépôt tolérant), `StopPointChip.test.tsx` (repris de `RemovalBubble.test.tsx`, + état soulevé), `TourBoundaryChoiceDialog.test.tsx`, `CompositionPausesFlow.integration.test.tsx` (retrait d'une récupération → Continuer → relecture), `index.test.ts`.

## Spec Change Log

## Review Triage Log

Trois revues indépendantes du 22/10/2026 (aveugle, cas limites, écarts de vérification), sous-agents en lecture seule. Triage du développeur, sous la délégation de Hermann.

**Corrigés**
1. Moyen (aveugle 1, cas limites 1) — dialogue monté sans clé : une demande arrivée dans le même lot ne rouvrait pas d'`Alert` et la garde restait bloquée. Clé par demande (`tourChoiceToken`).
2. Moyen (aveugle 2, cas limites 6, vérification 7) — effet (`queueMicrotask`) dans le calcul d'état du compteur : retiré ; un choix requis sur le brouillon courant n'applique rien.
3. Bas (aveugle 3) — `openTourChoice` ignoré mais opération « en attente » : il rend un booléen, l'opération est refusée (retour animé).
4. Bas (aveugle 4) — `circuitHeadRowPoint` recalculé à chaque rendu : mémoïsé.
5. Bas (aveugle 5, cas limites 5, vérification 5) — annonces vides ou perdues après un choix en placement : effet toujours nommé, annonce directe si le sous-brouillon ne change pas ; tests Annuler / « Fin de tour » de la resélection.
6. Bas (cas limites 2) — focus perdu quand le pas d'un point le retire : carte qui précède, à défaut compteur du Circuit.
7. Bas (cas limites 4) — valeur existante invalide conservée et sélection annoncée sans effet : valeur valide seule, annonce seulement si la zone change, roulette sur une durée finie.
8. Bas (cas limites 7) — focus d'un pas perdu après le dialogue de perte : `focusKey` conservé dans `PendingOccurrenceMove`.
9. Bas (cas limites 9) — roulette en attente du défaut du Profil ouverte plus tard : effacée par un autre toucher.
10. Bas (cas limites 11) — indice d'entrée inexact pour des points seuls : deux indices.
11. Bas (aveugle 7, 9 ; vérification 1, 11) — commentaires périmés (`moveActivityTo`, `circuit.ts`, `placement.ts`, `CircuitHeader.tsx`), README 5.1 / 5.3, `pointerEvents` en style, commentaire RM-038 du test d'intégration.
12. Écarts de vérification 3, 4, 6, 9, 10 — tests ajoutés : annonce d'un dépôt tolérant, point tenu et « Début de tour » à la dépose, point 8 (Circuit seul à N = 2 / N = 1), absence de pastille, couleur du symbole soulevé.

**Acceptés / non retenus**
- Aveugle 6 (double ✓ de la roulette) : même résultat, sans effet.
- Aveugle 8 : tests d'absence de D-301 gardés comme garde-fous du retrait.
- Cas limites 3 (puce tenue au repos pendant le dialogue) : cohérent avec la carte (style soulevé pendant le seul glisser) ; à revoir sur iPhone.
- Vérification 2 (enchaînement choix de Tour → perte de séries) : inatteignable — une entrée dans le Circuit ne crée pas de début de Tour ; mention retirée du README, code laissé générique. Cas limites 8 (Modal ouvert depuis le rappel de l'`Alert`) : même chemin, inatteignable.
- Vérification 8 (mesure oubliée), 13 (hauteur prédite sur un dépôt à choix : carte de hauteur constante) : sans effet observable.
- Vérification 12 : icône `remove-recovery` conservée (catalogue Figma).
- Cas limites 10 (contraste de l'icône jaune) : soumis à Hermann.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` : 145 suites, 3984 tests, vert.
- `npx tsc --noEmit` : vert.
- `npm run lint` : vert, 0 avertissement.

**Manual checks** : recette iPhone au jalon J6 (après 7.4) — liste dans le compte rendu de la story.

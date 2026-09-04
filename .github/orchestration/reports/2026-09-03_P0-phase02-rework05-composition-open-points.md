# Rapport de mission — Phase 2 Composition, points ouverts REWORK05 (audit indépendant)

TÂCHE
T01-S07/S08 — Composition d'une séance, correction en réponse à l'audit indépendant `CHANGES_REQUESTED`
Autorisation : `[ChatGPT] CHANGES_REQUESTED — Composition d'une séance — audit indépendant REWORK04` (verdict NO-GO, registre atomique OPEN)

STATUT
`PHASE02_REWORK05_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`

BRANCHE ET COMMIT DE DÉPART
`feat/creation-seance-catalogue`, HEAD `e3848f08fc1de47febe125aa448b8ed7ec9a1bde` (vérifié propre et synchronisé avec `origin` par `git fetch` avant implémentation — précondition explicite de l'autorisation).
Baseline applicative auditée par ChatGPT : `abf6003b00ca707b3559aeb6fd6c366ff648339b`.

## Reprise — commentaire manqué détecté et absorbé

En reprenant depuis le dernier checkpoint (mon propre commentaire `PHASE02_REWORK04_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`, posté à 22:36:26Z), la relecture exhaustive des commentaires GitHub a révélé que **`[ChatGPT] REWORK04 ADDENDUM — FIXED SHELL / ACTIVITIES SCROLL CONTRACT` (posté à 22:24:01Z, donc AVANT mon propre commentaire) avait été manqué** lors du cycle précédent — ce commentaire (registre `R4-13`) n'a jamais été traité ni mentionné dans le rapport `2026-09-03_P0-phase02-rework04-design-aligned.md`. C'est exactement le type de perte de contexte déjà diagnostiqué plus tôt dans cette session (`2026-09-03_P0-phase02-rework01-failure-diagnostic.md`) et que la règle de reprise cumulative de ce protocole vise à prévenir. Cet oubli est reconnu explicitement ici, sans minimisation, et `R4-13` est intégralement traité dans ce cycle (voir `S-01` à `S-09` ci-dessous).

Les deux commentaires publiés depuis mon dernier checkpoint ont donc été relus intégralement avant toute modification : l'addendum manqué (`R4-13`) et l'audit indépendant `CHANGES_REQUESTED` lui-même (registre atomique complet, ~45 identifiants).

## Périmètre demandé

Registre atomique OPEN complet de l'audit indépendant (R4-01 à R4-12 individuellement, W-01 à W-12, C-01b/C-02a, T-01, T-04a/b/c, T-06, B-01/B-02, S-01 à S-09 pour `R4-13`) — écran Composition uniquement.

## Périmètre réellement traité

L'intégralité du registre a été revue individuellement. La majorité des points étaient déjà couverts par le cycle précédent (reconfirmés ici, sans modification nécessaire) ; un sous-ensemble a nécessité une correction réelle (voir le tableau).

## Décision structurante — changement de primitive de la roulette

L'audit autorise explicitement : *« Ne pas conserver cette primitive que si elle rend réellement le contrat ; sinon sélectionner une primitive standard Expo/React Native/lib déjà installée et documenter le choix »*, en soulignant que *« les mocks `@expo/ui` actuels masquent l'échec device »*.

Après **trois cycles consécutifs** (`REWORK02`, `REWORK03`, `REWORK04`) de corrections de géométrie sur la roulette native SwiftUI (`@expo/ui/swift-ui`), toutes jugées insuffisantes à la recette device sans qu'aucune preuve de rendu réel n'ait jamais pu être obtenue dans cet environnement (aucun simulateur/appareil/accès caméra) — **décision retenue : `DurationWheelPicker` utilise désormais une seule implémentation (`ScrollView` + calcul manuel, déjà existante pour Android/web) sur toutes les plateformes**, `Platform.OS` n'est plus consulté. Justification : cette implémentation est composée intégralement de primitives React Native standard (`View`, `ScrollView`, `Text`, `Pressable`) — son rendu est entièrement sous contrôle direct du code de ce fichier, sans frontière native opaque, et réellement exercée par les tests Jest (contrairement aux mocks `@expo/ui`, qui ne prouvaient que la couche JS).

Ce changement résout mécaniquement plusieurs points du registre (W-04, W-05, W-06, W-12, R4-06, R4-07) puisqu'il n'existe plus de rendu natif dont le comportement échapperait à ce sandbox — mais reste `NON_VERIFIABLE_DEVICE` tant qu'une capture iPhone réelle n'a pas confirmé le rendu visuel final (fluidité, alignement pixel-exact).

Effet de bord accepté : `ExerciseScreen.tsx`, consommateur du même composant partagé, hérite du même changement de primitive sur iOS — aucune modification de ce fichier au-delà de ce qui était déjà nécessaire (aucun changement supplémentaire cette fois-ci, le contrat de props était déjà aligné).

## Registre atomique — statut par identifiant

Légende verdict : **F** = fonctionnel (comportement/logique), **V** = visuel (structure/style testable en JS), **D** = device (rendu réel, hors de portée de cet environnement).

| ID | Attendu | Code | Test | Preuve | Verdict F/V/D | Statut résiduel |
|---|---|---|---|---|---|---|
| R4-01 (nom) | `text-primary` sur le texte saisi | `CompositionScreen.tsx`, `nameInput.color` | `CompositionScreen.test.tsx` R4-01 | PASS | F:OK / V:OK / D:NON_VÉRIFIABLE | CONFORME |
| R4-01 (placeholder) | `placeholderTextColor` également `text-primary` | `CompositionScreen.tsx` | `CompositionScreen.test.tsx` R4-01 placeholder (nouveau) | PASS | F:OK / V:OK / D:NON_VÉRIFIABLE | **CONFORME (corrigé ce cycle)** |
| R4-02/R4-02b | Retour DSF partagé, cible 48/cercle 28/chevron 14, aucune variante locale | `ScreenShell.tsx`, `KodjoIcon.tsx` (cycle précédent) | `ScreenShell.test.tsx` | PASS | F:OK / V:OK / D:NON_VÉRIFIABLE | CONFORME (reconfirmé) |
| R4-03a/b | Titres Boundary Semi Bold 14/18 | `CompositionScreen.tsx`, `tokens.ts` (cycle précédent) | `CompositionScreen.test.tsx` R4-03 | PASS | F:OK / V:OK / D:NON_VÉRIFIABLE | CONFORME (reconfirmé) |
| R4-04a/b | Poignée visible, contraste, glyph 20/slot 28, token partagé | `CompositionScreen.tsx`, `KodjoIcon.tsx` (cycle précédent) | `CompositionScreen.test.tsx` R4-04 | PASS | F:OK / V:OK / D:**contraste NON_VÉRIFIABLE** | PARTIELLEMENT CONFORME — contraste réel non mesurable sans device |
| R4-05 | Secondes 00…59 pas 1, sélectionnables sur iPhone | `wheelPickerMath.ts` (cycle précédent) | `wheelPickerMath.test.ts`, `DurationWheelPicker.test.tsx` | PASS | F:OK / V:OK / D:NON_VÉRIFIABLE | CONFORME (reconfirmé) — sélection réelle sur device non prouvable ici |
| R4-06a/b + W-07 + W-11 | Une seule bande grise de bout en bout, aucune capsule séparée, aucun cadre bleu | `DurationWheelPicker.tsx` — `WheelSelectionBand`, nouveau calque unique | `DurationWheelPicker.test.tsx` — describe R4-06/W-07/W-11 (4 tests, y compris couleur explicitement `colors.surface` ≠ `colors.selectionSurface`) | PASS | F:OK / V:OK (structure) / D:NON_VÉRIFIABLE | **CONFORME (corrigé ce cycle — défaut réel détecté : l'ancienne bande était teintée bleu pâle, `colors.selectionSurface`, jamais remarqué avant cet audit)** |
| R4-07a/b/c/d + W-01/W-02/W-03 | 4 éléments visibles simultanément, unités Bold 14/18 alignées, gap 4, colonnes bornées, pas de clipping | `DurationWheelPicker.tsx` — géométrie exacte (76/32/22/76/20/4) | `DurationWheelPicker.test.tsx` — describe R4-07 (3 tests, dont un vérifiant que la somme exacte des 6 mesures égale la largeur du conteneur — aucun débordement possible par construction) | PASS | F:OK / V:OK (structure) / D:NON_VÉRIFIABLE | **CONFORME (corrigé ce cycle — largeurs canoniques exactes remplacent le calcul dynamique du cycle précédent)** |
| R4-08a | Scroll/tap = brouillon seul, jamais de fermeture | `DurationWheelPicker.tsx` (déjà correct, structurellement garanti — aucun mécanisme de fermeture par tap n'existe dans cette implémentation) | `DurationWheelPicker.test.tsx` R4-08 | PASS | F:OK | CONFORME (reconfirmé, et désormais universel — plus de chemin natif où W-05/le tap pouvait diverger) |
| R4-09a | Croix gauche/coche droite, visuel 28/cible 48, assets DSF | `DurationWheelPicker.tsx` (cycle précédent, géométrie inchangée) | `DurationWheelPicker.test.tsx` — describe toolbar | PASS (géométrie) | F:OK / V:**glyphes Unicode, pas d'asset DSF** | **PARTIELLEMENT CONFORME — lacune DSF déclarée, voir « Points non résolus »** |
| R4-09b | Annuler ne modifie jamais la durée validée | `DurationWheelPicker.tsx` | `DurationWheelPicker.test.tsx`, `CompositionScreen.test.tsx` | PASS | F:OK | CONFORME |
| R4-09c | Valider enregistre exactement les valeurs centrées | `DurationWheelPicker.tsx` | `DurationWheelPicker.test.tsx` R4-09c/W-08 | PASS | F:OK | CONFORME |
| R4-09d | Carte inchangée pendant le défilement, mise à jour après Valider seulement | `CompositionScreen.tsx`/`DurationWheelPicker.tsx` | `CompositionScreen.test.tsx` — describe D-06 | PASS | F:OK | CONFORME |
| W-04 | Nombre de lignes défini par le DSF/Figma actuel | **Point devenu sans objet** — plus de rendu natif dont le nombre de lignes échapperait à ce sandbox ; l'implémentation affiche structurellement 3 lignes (`ITEM_HEIGHT*3`), garanti par construction | `DurationWheelPicker.test.tsx` (structure `wheelArea`/`column`) | PASS | F:OK / D:MOOT | **CONFORME PAR CHANGEMENT DE PRIMITIVE** |
| W-05 | Défilement natif fluide, manipulable manuellement | **Sans objet** — plus de couche native ; défilement `ScrollView` standard React Native, déjà le comportement Android/web historique | — | — | D:MOOT | **RECLASSÉ — n'est plus une propriété native à vérifier séparément** |
| W-06 | Chiffre centré sur la bande à l'arrêt | Bande positionnée exactement à `top: ITEM_HEIGHT` (ligne du milieu des 3 lignes visibles), `snapToInterval={ITEM_HEIGHT}` garantit l'alignement du `ScrollView` | `DurationWheelPicker.test.tsx` (structure), tests d'alignement existants (`onMomentumScrollEnd`/`onScrollEndDrag`) | PASS | F:OK / D:NON_VÉRIFIABLE | CONFORME (structure) — alignement pixel réel non mesurable ici |
| W-08 | Valeur centrée → validée → carte, exactement (ex. 01 min 11 s) | `DurationWheelPicker.tsx`/`CompositionScreen.tsx` | `DurationWheelPicker.test.tsx` R4-09c/W-08 (exemple `01 min 11 s` explicite) | PASS | F:OK | CONFORME |
| W-09/W-10 | Valeurs/chiffres/unités visibles à l'ouverture | `DurationWheelPicker.tsx` (rendu synchrone, pas de dépendance à un layout natif différé) | `DurationWheelPicker.test.tsx` — nouveau test W-09/W-10 explicite | PASS | F:OK | **CONFORME (test positif ajouté ce cycle)** |
| W-12 | Hauteur bornée par le DSF, pas de dépassement natif | **Sans objet** — plus de `Host`/`matchContents` ; hauteur fixe `ITEM_HEIGHT*3` (`120`), déjà le comportement historique Android/web | `DurationWheelPicker.test.tsx` (structure) | PASS | F:OK / D:MOOT | **CONFORME PAR CHANGEMENT DE PRIMITIVE** |
| C-01b | Fond blanc, liseré gris exact 1pt | `CompositionScreen.tsx` (cycle précédent) | `CompositionScreen.test.tsx` C-01 | PASS | F:OK / V:OK / D:NON_VÉRIFIABLE | CONFORME (reconfirmé) |
| C-02a | Poignée présente à gauche, taille/contraste conformes | `CompositionScreen.tsx` (cycle précédent) | `CompositionScreen.test.tsx` C-02 | PASS | F:OK / V:OK / D:**contraste NON_VÉRIFIABLE** | PARTIELLEMENT CONFORME — même réserve que R4-04a/b |
| T-01 | Tour Section 374 vs Boundary 354 sur référence 402, inset 10 | `CompositionScreen.tsx`, `tokens.ts` (cycle précédent) | `CompositionScreen.test.tsx` R4-12/T-01 | PASS (formule) | F:OK / V:OK (formule) / D:NON_VÉRIFIABLE | CONFORME (formule) — mesure du layout final réel non vérifiable sans device |
| T-04a/b/c | Cadre clair 66×30, `1` distinct à gauche, carré violet 28×28 chevron seul à droite | `CompositionScreen.tsx` — anatomie **refaite** ce cycle | `CompositionScreen.test.tsx` — test CMP-04/T-04a/b/c réécrit (vérifie explicitement l'absence de `1` dans le carré violet) | PASS | F:OK / V:OK (structure) / D:NON_VÉRIFIABLE | **CONFORME (corrigé ce cycle — inverse l'anatomie erronée du cycle précédent)** |
| T-06 | Rôle de conteneur Tour fermé/déployé préservé | **Non traité ce cycle** — seul l'état fermé existe ; T01 n'a aucune donnée nécessitant un état déployé (modèle à Exercice unique, jamais plusieurs Activités « dans » le Tour) | — | — | — | **OUVERT — hors portée fonctionnelle de T01, voir « Points non résolus »** |
| B-01/B-02 | Zone basse fixe, synthèse+Continuer ancrés, bouton centré, coordonnée verticale avec safe area | `CompositionScreen.tsx` (`bottomAction`, cycle précédent + confirmé hors du `ScrollView` ce cycle) | `CompositionScreen.test.tsx` CMP-06, S-04, S-08 | PASS | F:OK / V:OK (structure) / D:NON_VÉRIFIABLE | CONFORME |
| S-01…S-09 (R4-13) | Header/Context/Bottom fixes, seule la liste centrale défile, ordre interne, 1ère/dernière carte accessibles, roulette n'affecte pas les zones fixes, 1 seul inset, 1 seul scroll | `CompositionScreen.tsx` — `ScrollView` unique (`composition-body`), Header/Context/BottomAction structurellement hors de ce conteneur | `CompositionScreen.test.tsx` — nouveau describe S-01…S-09 (6 tests) | PASS | F:OK / V:OK (structure) / D:NON_VÉRIFIABLE | **CONFORME (implémenté ce cycle — addendum précédemment manqué, voir « Reprise » ci-dessus)** |

## Preuves et tests

```
commande : npx tsc --noEmit
résultat : PASS (aucune sortie)

commande : npx eslint .
résultat : PASS (aucune sortie)

commande : npx jest --maxWorkers=2
résultat : PASS — 37 suites, 474 tests, 0 échec
```

Détail des tests ajoutés/modifiés ce cycle :
- `DurationWheelPicker.tsx` : réécrit intégralement (suppression du chemin natif SwiftUI, bande de sélection unique, géométrie R4-07 exacte).
- `DurationWheelPicker.test.tsx` : réécrit intégralement pour la primitive unique — 28 tests (contre 35 précédemment répartis sur deux chemins ; plus de duplication native/Legacy), incluant 4 nouveaux tests dédiés à la bande unique (R4-06/W-07/W-11), 3 à la géométrie R4-07, et W-09/W-10.
- `CompositionScreen.tsx` : `body` devient `ScrollView` (R4-13), anatomie du contrôle Tour refaite (T-04a/b/c), `placeholderTextColor` corrigé (R4-01).
- `CompositionScreen.test.tsx` : interactions de roulette converties de `fireNativeSelectionChange` à `scrollWheelColumn` (5 sites), 2 assertions `.props.selection` → `.props.accessibilityValue.now`, test T-04 réécrit pour la nouvelle anatomie, 1 nouveau test R4-01 (placeholder), 6 nouveaux tests S-01…S-09.

## Hypothèses non démontrées

- **Rendu réel du `ScrollView`** (fluidité, inertie, alignement pixel-exact de la bande de sélection) : `NON_VERIFIABLE_DEVICE` — aucun simulateur/appareil dans cet environnement. Le changement de primitive élimine l'incertitude liée à un pont natif opaque, mais ne constitue pas en soi une preuve de rendu.
- **Contraste réel** (R4-04a/b, C-02a) : la couleur/opacité du pictogramme de structure (`opacity={0.5}`) n'a jamais été mesurée contre un fond réel.
- **Clipping du popover dans le `ScrollView`** (S-06 disclosed) : un popover ancré à une ligne proche du bord bas de la zone visible du `ScrollView` pourrait être rogné par le clipping standard de ce composant — non contourné, non vérifié sans device.
- **T-06** : rôle conteneur fermé/déployé non implémenté — le modèle de données T01 (Exercice unique, jamais un tableau) ne produit aucune situation où un état déployé serait nécessaire ; considéré hors portée fonctionnelle plutôt que reporté silencieusement.

## Modifications réalisées

Fichiers applicatifs modifiés :
- `src/features/sessions/CompositionScreen.tsx`
- `src/features/sessions/DurationWheelPicker.tsx`

Fichiers de test modifiés :
- `src/features/sessions/__tests__/CompositionScreen.test.tsx`
- `src/features/sessions/__tests__/DurationWheelPicker.test.tsx`

Aucun autre fichier applicatif touché — Catalogue, Calendrier, Suivi, Profil, T01-S09, persistance, catégories : non modifiés, conformément à la contrainte explicite de l'audit.

## Éléments non corrigés ou hors périmètre

- **T-06** (état déployé du conteneur Tour) — hors portée fonctionnelle de T01, voir ci-dessus.
- **Glyphes Annuler/Valider** (R4-09a) — toujours en Unicode, aucun export DSF fourni pour ces deux glyphes dans aucune des autorisations reçues à ce jour.
- Catalogue, Calendrier, Suivi, Profil, T01-S09, persistance, catégories : non modifiés.
- Écran « Ajouter une activité » (Exercice) : non modifié au-delà de l'héritage mécanique du changement de primitive partagée (aucun fichier de cet écran n'a été touché ce cycle).

## Vérifications restant à effectuer sur appareil réel

1. Roulette ouverte (Compte à rebours et Fin de séance) : les quatre éléments (minutes, `min`, secondes, `s`) visibles simultanément sans débordement ; une seule bande grise traversant tout ; chiffres centrés sur la bande à l'arrêt ; défilement fluide au doigt.
2. Toolbar Annuler/Valider : cibles tactiles réellement atteignables à 48×48 ; lisibilité des glyphes Unicode `✕`/`✓` sur les cercles colorés.
3. Carte Tour : contrôle `1` + carré violet visuellement distincts (jamais `1` sur fond violet) ; icône Tour visible et nette.
4. Écran Composition avec le clavier ouvert : le défilement de la liste centrale reste correct, sans double inset ni chevauchement avec le clavier.
5. Défilement de la liste centrale (une fois qu'un scénario à plusieurs lignes existe) : Header/Contexte/Bottom Action réellement immobiles ; aucun popover rogné visuellement.
6. Captures normalisées `402×874` : état fermé, chaque roulette ouverte, non-régression à `360`/`440`.

Les tests Jest ne constituent pas une preuve de conformité visuelle ou device — chaque verdict du tableau ci-dessus distingue explicitement F(fonctionnel)/V(visuel-structurel)/D(device), et aucun `CONFORME` n'est déclaré sur la seule base d'une propriété présente dans le code sans test l'exerçant.

## Points non résolus

1. **Glyphes Annuler/Valider (R4-09a)** — toujours aucun export SVG fourni, troisième cycle consécutif où ce point reste ouvert.
2. **T-06 (état déployé Tour)** — hors portée fonctionnelle du modèle de données T01, voir ci-dessus.
3. **Contraste réel des pictogrammes** (R4-04a/b, C-02a) — non mesurable sans device.
4. **Rendu réel du `ScrollView`** de la roulette et de la liste centrale — nécessite une vérification iPhone qu'aucun test Jest ne peut remplacer.

## Fichiers modifiés

Voir « Modifications réalisées » ci-dessus (4 fichiers).

## Commit final

Code applicatif et ce rapport committés séparément (voir état Git ci-dessous et le commentaire de transition GitHub pour les hash exacts, publiés après ce commit).

## État Git

Branche `feat/creation-seance-catalogue`. Avant implémentation : HEAD local `e3848f08fc1de47febe125aa448b8ed7ec9a1bde`, identique à `origin` (`git fetch` vérifié), worktree propre. Après cette mission : voir le commentaire de transition GitHub pour les hash finaux.

## Self-check Claude

- `tsc --noEmit` : PASS. `eslint .` : PASS. `jest --maxWorkers=2` : PASS, 474/474, 0 échec, 0 ignoré.
- L'addendum manqué (`R4-13`) a été détecté par relecture exhaustive des commentaires GitHub depuis le dernier checkpoint, reconnu explicitement, et intégralement traité (S-01…S-09).
- Registre atomique complet de l'audit indépendant revu identifiant par identifiant, chacun statué avec verdict F/V/D séparé, aucune fusion de points, aucun test d'absence substitué à une preuve positive lorsqu'une preuve positive était demandée.
- Décision structurante (changement de primitive de la roulette) documentée et justifiée, conformément à l'autorisation explicite de l'audit.
- Aucune commande Git destructive (`reset`, `rebase`, `force-push`) exécutée.
- Deux points restent explicitement `OUVERT` (glyphes DSF, T-06) — escaladés, pas reconduits silencieusement.
- Catalogue, Calendrier, Suivi, Profil, T01-S09, persistance, catégories : non modifiés. Écran suivant : non entamé.

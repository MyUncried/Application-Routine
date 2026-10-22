---
status: approuvé par Hermann le 20/10/2026 — ARB-1 à ARB-3 clos
inputDocuments:
  - '_bmad-output/pre6/etat-de-depart.md'
  - '_bmad-output/pre6/planning-artifacts/architecture-pre6.md'
  - 'PR #390 docs/pre6-figma-ui-20261020 @ 59c682f1 (ch06, ch09, ch12, ch13), ouverte, non fusionnée'
---

# KODJO PRE-6 — Évolution de la Composition de séance : epics et stories

**Plan approuvé le 20/10/2026.** Étape 0 réalisée le même jour (résultat ci-dessous). Le développement suit l'ordre de ce document, story par story. La fusion finale sur `main` reste soumise à l'autorisation explicite de Hermann.

**Référence documentaire.** Les spécifications de `main` (`ad189847`), complétées par les corrections de la PR #390 (`59c682f1`), lues par `git show origin/docs/pre6-figma-ui-20261020:<fichier>`. La PR n'est ni fusionnée ni recopiée dans la branche PRE-6 : ses quatre passages (ch06 L399, ch09 L682, ch12 L906, ch13 L1254-1260) font foi pour PRE-6. Figma actuel, et non d'anciennes captures, pour le rendu : `DSF / Cards / Composition — exercice` `5544:6797`, `DSF / Cards / Exercice` `6214:7278`.

## Périmètre

**Inclus.** Composition des **séances libres** :

- A — Composition générale ;
- B — Circuit de Tours / de Séries ;
- C — modales « Volumes du circuit » (`8328:34965`, `8328:35135`) ;
- D — Récupérations et Points d'arrêt ;
- E — raccordement des paramètres PRE-5.

Le socle commun (organisation ≠ borne) est conçu pour être réutilisé par les formats.

**Exclus.** Le choix des formats et des modèles, les paramètres, récapitulatifs et compositions propres aux formats (Tabata, 30/30, EMOM, AMRAP, For time, Death by), les bornes Durée et Max dans l'interface, tout moteur ou chronomètre, le guidage sonore, les performances, résultats, historique et planification, le multi-circuit, et toute refonte du Catalogue, du Profil ou de l'éditeur PRE-5.

**Règles de conduite.** Réutiliser avant de créer. Ne reconstruire aucun acquis. Ne supprimer aucun contrôle sans substitution. Aucune validation ni aucun blocage hors des règles citées. Les valeurs des captures ne sont pas des règles. Les tests sont ajoutés pour les règles nouvelles ; les suites existantes servent de non-régression, sans revue globale ajoutée.

## Étape 0 — Réconciliation avec la fusion PRE-5 (préalable au développement)

Les travaux de planification ne dépendent pas de cette étape et sont faits. Elle se déroule ainsi :

1. **Identifier la baseline.** C'est le commit de `origin/main` qui contient la version PRE-5 **validée par Hermann** : fusion #389 `ad189847`, ou un commit ultérieur si la clôture (recettes iPhone R-2.5 à R-3.2, rétrospectives, correctifs) apporte d'autres changements. Hermann confirme le SHA.
2. **Raccorder la planification.** Fusionner ou rebaser `plan/pre6-bmad` sur la baseline. Seul `_bmad-output/pre6/` est propre à PRE-6, donc aucun conflit n'est attendu.
3. **Mesurer le delta.** `git diff ad189847..<baseline>` sur les fichiers que le plan touche :
   - `ExecutionParameters*.ts`, `ExecutionParametersSheet.tsx`, `ActivityEditorForm.tsx`, `ExerciseScreen.tsx` ;
   - `SessionDraft.ts`, `composition.ts`, `calculations.ts`, `executionCalculations.ts` ;
   - `CompositionScreen.tsx`, `compositionPresentation.ts` ;
   - migrations et `constants.ts`, `SegmentedControl.tsx`, `ProfileStepper.tsx`, `tokens.ts`, `fr.ts`.

   Pour chaque changement, mettre à jour `etat-de-depart.md` et les stories concernées. Vérifier en particulier `DATABASE_VERSION` (10 attendu, donc migration 011).
4. **Établir la référence de tests.** Lancer la suite Jest complète sur la baseline et consigner le nombre de suites et de tests verts. Ce sera la référence de non-régression de PRE-6.
5. **Reprendre les reports PRE-5.** Le report AC6 (indicateur de côté neutre) entre dans la story 2.2 (ARB-2 clos).
6. **Ouvrir le développement.** Créer la branche de développement depuis la baseline et initialiser `sprint-status.yaml`.

**Critère de sortie** : baseline nommée, delta consigné, référence Jest consignée, plan validé par Hermann.

**Résultat (20/10/2026).**

- Baseline : `ad189847` (fusion #389), égal à `origin/main` au 20/10 après `git fetch`. Il contient la clôture PRE-5 `67838422`, HEAD actuel du worktree PRE-5. Aucun commit PRE-5 postérieur.
- Raccordement : `plan/pre6-bmad` part déjà de `ad189847` ; aucune fusion ni aucun rebase nécessaire.
- Delta `ad189847..baseline` : vide. `DATABASE_VERSION` = 10, donc migration 011 confirmée.
- Référence de non-régression (`npm ci`, Node 24.19) : Jest 125 suites et 3242 tests verts ; `npx tsc --noEmit` sans erreur ; `npm run lint` sans erreur.
- Branche de développement : `pre6-bmad/dev`, depuis `plan/pre6-bmad`.
- Corrections documentaires PR #390 intégrées aux stories 1.2, 2.2, 2.3 et 4.3 et à AD-36.

## Epic 1: Socle Circuit, pauses et calculs (domaine et données, sans interface)

Il porte la mécanique commune réutilisable par les formats (AD-34 à AD-40). Aucun changement visible ; la preuve passe par Jest et par la lecture d'une base réelle.

### Story 1.1: Nature du Circuit, borne typée et migration 011

- **AC1** : le type `CircuitNature` (`TOURS` | `SERIES`) et le type `CircuitBound` (variante `COUNT` seule) existent. `COUNT` est le `repeatCount` existant (1..99, défaut 1), sans second compte. `switch` exhaustifs.
- **AC2** : la migration 011 ajoute `tours.nature` (défaut `TOURS`) et `activities.post_activity_recovery_present`, avec la reprise d'AD-35. `DATABASE_VERSION` = 11. La migration est idempotente et sans reconstruction de table.
- **AC3** : aller-retour domaine → `SessionDraft` → `Create/UpdateSessionInput` → SQLite → lecture, pour la nature et la présence de récupération (absente / 0 / positive). L'égalité de brouillon (`sessionDraftsEqual`) et la garde de sortie en tiennent compte.
- **AC4** : une base réelle antérieure (v10) se lit sans perte. Toutes les séances sont en Circuit de Tours ; les cibles, phases, charges et côtés PRE-5 sont intacts. La preuve suit la méthode de PRE-4 story 1.4.

### Story 1.2: Points d'arrêt de bout en bout dans le brouillon

- **AC1** : `SessionDraft.stopPoints` ; hydratation, création, mise à jour. La position d'emplacement est enregistrée telle quelle, sans renumérotation (AD-36).
- **AC2** : la validation refuse un point juste après le compte à rebours initial, juste avant la Fin, ou en doublon sur un emplacement (CE-T03-08 L1502, `isStopPointPlacementValid` réutilisé).
- **AC3** : une mise à jour ne supprime plus les points existants. Test de non-régression sur `SqliteSessionRepository.update`.
- **AC4** : le point d'arrêt est rattaché à l'occurrence qui le précède (ARB-3 clos, ch09 L682 PR #390). Il l'accompagne au déplacement, est copié avec elle à la duplication et retiré avec elle à la suppression. Les positions sont recalculées par ces opérations, dans les emplacements autorisés.

### Story 1.3: Développement du Circuit et durées

- **AC1** : développement Tours / Séries selon ch10 L651 ; éléments internes répétés, externes non répétés (RM-213, RM-220).
- **AC2** : durée d'occurrence et de Circuit conformes à RM-129, RM-038 et ch10 L2050-2052. Tests aux valeurs 75 s, 85 s, 225 s et 255 s ; points d'arrêt à 0 s (RM-191) ; aucune récupération comptée deux fois (RM-071, RM-159) ; R = 0 ne remplace pas Pi.
- **AC3** : agrégation : ≥ l'emporte sur ≈, qui l'emporte sur exact. Résumé du Circuit = ce Circuit seulement (D-382), sans « N exercice(s) » (D-390), « — min » s'il est vide (D-399). La durée de séance exclut le compte à rebours et la Fin (RM-159).
- **AC4** : les durées actuelles des séances en Circuit de Tours sont inchangées. Les tests existants de `calculations.test.ts` et `compositionPresentation.test.ts` restent verts, ou leurs attentes changent seulement là où une décision citée l'impose (D-390, D-399).

### Story 1.4: Opérations de Circuit : compte, réserve, conversion, entrée et sortie

- **AC1** : `prepareNatureChange` / `applyNatureChange` (AD-39). Tours → Séries : extension par la dernière ligne active, troncature au-delà de N, perte calculée **avant** mutation. Séries → Tours : sans message, valeurs conservées. Le régime de chaque exercice est inchangé.
- **AC2** : `setCircuitCount` en Séries. Une diminution passe immédiatement dans la réserve, sans message. Une augmentation restaure d'abord, puis préremplit par copie de la dernière ligne active. Réserve purgée à l'enregistrement. Cas 4 → 3 → 4, et enregistrement à 3 puis augmentation (CE-T03-08 L1536).
- **AC3** : entrée dans un Circuit de Séries (ajout depuis le Catalogue ou déplacement) : adaptation à N, perte signalée pour confirmation ; Annuler abandonne l'ajout. Sortie : nombre et paramètres conservés. L'exercice du Catalogue n'est jamais modifié.
- **AC4** : `circuitVolumes` fournit les lignes de la grille à partir des séries actives (réserve exclue).
- **AC5** : aucune logique de séries dupliquée avec la Feuille (AD-39). Toute primitive extraite garde son comportement, prouvé par les tests existants d'`ExecutionParametersDraft`.

Dépendances : 1.1 → 1.2. 1.1 → 1.3 → 1.4. 1.2 et 1.3 peuvent se faire en parallèle.

## Epic 2: Composition générale conforme (A, E)

### Story 2.1: En-tête, bornes de séance et Continuer

- **AC1** : en-tête conforme à `8328:28172` et `8328:28605` : titre « Composer une séance », nom, puce Étiquette (`LabelPickerModal` conservé), durée de séance, actions « Ajouter un arrêt » (entrée du placement, story 4.1) et « + ».
- **AC2** : Compte à rebours initial et Fin de séance toujours présents, immobiles, 0 s admis, défauts 10 s et 5 s (RM-030, RM-031). Contrôles selon CE-T03-08 et `8328:28998`.
- **AC3** : action finale « Continuer ». Elle est désactivée sans nom, sans Exercice valide, ou si une cible obligatoire manque (D-380, D-123). Champ manquant sur fond rouge pâle (D-389). Elle enregistre puis ouvre Catalogue / Séances. En cas d'échec, on reste sur l'écran, brouillon intact. Le flux `handleSave` existant est conservé.
- **AC4** : trait de démarcation présent hors placement ; aucune information de récupération si elle est absente ou à 0 (D-303). Corrige E5.

### Story 2.2: Cartes d'occurrence

- **AC1** : nom ; pastille et classification ; zones corporelles ; cible et durée à droite. Les volumes sont séparés par un point médian, trois valeurs au plus puis « … » (CE-T03-08 L1474). Format de durée existant (`formatCompactDuration`).
- **AC2** : récupération positive affichée sous la carte, dans sa zone structurelle dédiée (ARB-1 clos, règle validée) ; elle forme un bloc avec l'occurrence (ch13 L1680).
- **AC3** : changement de côté (ARB-2 clos, report AC6 de PRE-5) : icône seule, en haut à droite, sans badge ni flèche `D→G` / `G→D`, absente si l'exercice n'a pas de changement de côté. Synthèse en bas à droite sur la ligne secondaire, bord droit aligné sur l'icône ; zones corporelles tronquées avec un écart de 8 px (ch13 L1256 PR #390, `8328:28605`, `8328:34377`, composant `5544:6797`). Paramètres fonctionnels PRE-5 inchangés.
- **AC4** : en Circuit de Séries, la carte reflète les N séries effectives (`8328:34520`).
- **AC5** : nom accessible annonçant type, position et durée (CE-T03-08 L1522).

### Story 2.3: Organisation des occurrences

- **AC1** : ajout depuis le Catalogue et création d'une copie conservés (insertion atomique, ordre de la liste filtrée, aucune récupération automatique).
- **AC2** : Dupliquer produit `{nom} (copie)` et conserve Pause, Récupération et Point d'arrêt. Supprimer emporte la récupération et le point d'arrêt (RM-210, ARB-3). Le geste de balayage existant est conservé.
- **AC3** : glisser-déposer avant, dans et après le Circuit. Le bloc carte + récupération + point d'arrêt se déplace d'un seul tenant (`8328:33546`, ARB-3) ; un dépôt qui placerait le point sur un emplacement interdit est invalide. L'identifiant est conservé. Un dépôt invalide restitue la position. Une entrée dans ou une sortie du Circuit applique la story 1.4, avec confirmation en cas de perte.
- **AC4** : alternatives accessibles au glisser et au balayage, conservées ou étendues aux bornes du Circuit.
- **AC5** : modifier une copie conserve tous ses paramètres PRE-5 (phases, charge, cadence, pause, côtés, cibles). La Feuille s'ouvre sans Compte à rebours ni Fin d'exercice (RC-7, D-214).

## Epic 3: Circuit de Tours et de Séries (B, C)

### Story 3.1: En-tête du Circuit et compteur

- **AC1** : `CircuitHeader` : titre « Circuit », durée sous le titre (story 1.3 AC3), œil permanent, chiffre distinct de la pastille d'unité (« tour(s) » / « série(s) », avec accord singulier et pluriel). Remplace `TourCard` et le `NumberWheelPicker` du compte (E2).
- **AC2** : toucher le chiffre révèle − et + (`InlineStepper`), bornes 1..99. Toucher la valeur ou ailleurs referme (RC-4). Un ajustement accessible remplace le stepper pour VoiceOver.
- **AC3** : en Séries, chaque changement du compte applique `setCircuitCount`, sans message.
- **AC4** : geste vérifié à 375 et 402 de large et avec Dynamic Type, sans chevauchement du titre, de la durée, de l'œil et du compteur (conteneur 354 × 34, ch12 L1236).

### Story 3.2: Choix de nature et confirmation de perte

- **AC1** : toucher la pastille d'unité ouvre le choix de nature (CE-CIR-01, `8328:34805`) : deux options avec leurs sous-textes, nature courante sélectionnée. Primitive selon AD-42 / P-4.
- **AC2** : le choix de la même nature ne fait rien. Le changement sans perte est immédiat. Le changement avec perte ouvre la confirmation (CE-CIR-02, `8328:34813`), qui calcule la perte sur l'état courant. Annuler conserve nature, compte et valeurs ; Confirmer applique tout ensemble. Le voile ne confirme pas. Une double action ne convertit pas deux fois.
- **AC3** : l'ajout depuis le Catalogue dans un Circuit de Séries avec perte passe par la même confirmation ; Annuler abandonne l'ajout.
- **AC4** : recette Tours → Séries avec des exercices à moins de N, à N et à plus de N séries.

### Story 3.3: N hérité dans la Feuille des paramètres

- **AC1** : une occurrence d'un Circuit de Séries ouvre la Feuille avec `inheritedSeriesCount = N` (AD-44). Le nombre de séries est affiché et indisponible, le régime reste modifiable, l'inversion de la durée totale suit `isTotalDurationInvertible` (existant).
- **AC2** : hors Circuit de Séries, la Feuille est strictement inchangée (non-régression PRE-5).
- **AC3** : à la sortie du Circuit, le nombre redevient modifiable, sans message.

### Story 3.4: Modales « Volumes du circuit »

- **AC1** : l'œil ouvre la feuille basse « Volumes du circuit » (`8328:34965` en Séries, `8328:35135` en Tours), avec X et poignée.
- **AC2** : colonnes Exercice | S1…Smax | Unité. Smax = plus grand nombre de séries actives. Série inexistante = « — », jamais 0 (CE-CIR-03 L1926). Réserve non affichée.
- **AC3** : répétitions en nombre + « rép. » ; durée en `min:ss` ; À l'échec = ✓ et « À l'échec » dans la colonne Unité. Cas mixtes et séries identiques ou variables couverts. Indicateur de changement de côté sans doublement des valeurs.
- **AC4** : colonnes Exercice et Unité fixes ; défilement horizontal des colonnes S ; défilement vertical des lignes au-delà de la hauteur disponible.
- **AC5** : lecture seule stricte. La fermeture (X, glisser, voile) laisse le brouillon identique, vérifié par test d'égalité.
- **AC6** : lecture accessible ligne par ligne (exercice, série, valeur, unité).

## Epic 4: Récupérations et Points d'arrêt (D)

### Story 4.1: Mode placement et sous-brouillon

- **AC1** : l'action « Ajouter un arrêt » entre en placement (`8328:29270`) : contenu atténué, trait de démarcation masqué (D-303), emplacements proposés.
- **AC2** : les emplacements sont ceux de la règle, ni plus ni moins :
  - récupération après chaque occurrence, dernière comprise, jamais avant le premier Exercice ;
  - point d'arrêt avant ou après le Circuit et entre ses Exercices, jamais juste après le compte à rebours ni juste avant la Fin ;
  - un élément de chaque type par emplacement.
  
  Un emplacement qui porte déjà une récupération l'affiche comme existante.
- **AC3** : sélection multiple. Toucher Point d'arrêt bascule l'ajout. Toucher Récupération ouvre la roulette au défaut du Profil (30 s), qui confirme ou annule cet emplacement seulement.
- **AC4** : la barre affiche « Confirmer N pauses ajoutées » (récupération + point = 2 ; une désélection retranche ; à N = 0, rien à confirmer) et « Annuler ». Confirmer applique atomiquement (AD-43) ; Annuler restitue l'état d'entrée. Aucune persistance avant « Continuer ».

### Story 4.2: Durée, modification et retrait

- **AC1** : roulette « Durée de récupération » (`8328:28733`), plage 0..300 s, grille 1 / 5 / 30 s (E12). 0 est conservé comme présent (D-323). Elle est construite sur `DurationWheelPicker`.
- **AC2** : toucher une récupération positive ouvre son réglage. Un appui long sur une récupération ou un point affiche « Retirer » (`8328:29133`, `8328:33689`). Retirer rétablit la Pause terminale (RM-038).
- **AC3** : alternatives accessibles à l'appui long.

### Story 4.3: Pauses dans le déroulement et la Composition

- **AC1** : une récupération suit son occurrence lors d'un déplacement, d'une duplication ou d'une suppression (RM-210), de même que son point d'arrêt (ARB-3 clos, ch09 L682). Rendu du point aligné sur le bord droit des cartes ; en placement, symbole et texte alignés à droite (ch13 L1258 PR #390, `8328:29428`, `8328:29270`).
- **AC2** : dans le Circuit, récupérations et points sont répétés à chaque Tour ou passage. L'ordre est Exercice → R positive → Point d'arrêt (RM-219). Durées recalculées en direct (story 1.3).
- **AC3** : avertissement D-301 informatif quand deux Exercices s'enchaînent sans Pause terminale ni R positive, sans mutation ni blocage.

## Epic 5: Présentation de la Composition du 21/10/2026 (D-435)

Demande de Hermann du 21/10/2026 : mettre l'écran de Composition en conformité avec Figma au 21/10, à fonctionnalités identiques. Documentation : PR #391 (`docs/composition-layout-20261021` @ `d9e56056`), intégrée telle quelle dans la branche PRE-6 (`445457c8`) ; D-435 (ch07), CE-T03-08 et CE-FMT-03 (ch13), ch08 « Présentation des occurrences — révision du 21/10/2026 », DSF-CARTES « Exception locale — Cartes de Composition de séance v2 ». Figma : Standard `8328:28605`, placement `8328:29270`, actions glissées `8328:28863`, déplacement `8328:33546`, point d'arrêt `8328:29428`, carte v2 `9798:44464`, modification `5271:5455`. Aucune nouvelle fonctionnalité ; modèle, API, calculs, formats, paramètres, enregistrement inchangés. Différés (D-435) : ouvrir l'éditeur d'Exercice au toucher de la récupération ; supprimer le défaut Profil.

**Chevauchement avec la PR #390.** Aucun conflit textuel (ch06, ch13). Pour la Composition, le rendu de la PR #390 (synthèse en bas à droite, point d'arrêt aligné à droite) est remplacé par D-435 et par la demande de Hermann du 21/10 (points d'arrêt centrés entre les cartes). La PR #390 reste la référence pour la carte de sélection d'exercice (CE-T03-07), hors de cet epic.

**Choix par défaut D1 à D8 (sources divergentes ou muettes) : validés par Hermann le 21/10/2026.**
- D1 — Trait de démarcation : aucun trait en v2 (décision Hermann du 21/10 : pas de trait sans récupération ni point ; Figma sans trait ; D-435 supersède la représentation de D-303). ch13 L1474/L1530/L1573/L1585 conservent la phrase historique : lot documentaire.
- D2 — Sablier sans valeur : rien n'est affiché si la récupération est absente ou à 0 (ch13 L1474, ch10 ; le sablier de `8328:28605` sans valeur est illustratif, ch10 L599 de la PR #391).
- D3 — Média (remplacé par Hermann le 21/10/2026) : le gabarit 64 × 64 affiche la photo de l'exercice, ou l'image d'affiche de sa vidéo, quand elle existe (premier média de l'occurrence, mécanisme existant de la vignette du Catalogue : `CardThumbnail`, `VideoPoster`) ; sinon l'icône générique de `9798:19907`. Story 5.1b.
- D4 — Compteur du Circuit : position Figma (`8328:28605`). Œil des Volumes (remplacé par Hermann le 22/10/2026) : dans la zone de contexte, avec les commandes contextuelles, et non plus dans l'en-tête du Circuit ; comportement et modales inchangés. Story 5.1b.
- D5 — Couleurs Figma hors registre ch12 (`#F3F4F9` aplat du Circuit, `#E4E7EF` bord de carte, `#EEF0F6` fond du média, `#8C8C94` Dupliquer) : constantes locales citant ch13/DSF, sans modifier `tokens.ts` (registre verrouillé par ch12) ; ajout au registre proposé dans le lot documentaire. `tourSurface` n'est pas modifié (partagé avec `SessionCard`, `DisclosureControl`).
- D6 — Placement (remplacé par l'arbitrage D6 de la PR #391, `35c82ea1`) : cartes d'Exercice grisées et inactives ; zones d'insertion (cadre « Récupération », puces), rail, bornes et en-tête non grisés. Correctif `04f5493b`.
- D7 — Cible de la récupération en ligne 3 : sablier et valeur, cible tactile ≥ 44, jamais la ligne entière (sinon conflit avec le toucher de la carte, qui ouvre l'Exercice).
- D8 — Écran Modifier (`5271:5455`) : le stepper ouvert au repos est illustratif ; le comportement actuel (chiffre distinct, ± au toucher) est conservé.

### Story 5.1: Carte v2 et récupération en troisième ligne

- **AC1** : carte 370 × 80 à la largeur 402 (marges 16), rayon 12, fond blanc ; bord 1 hors Circuit, aucun bord dans le Circuit ; média 64 × 64 intégré (D3) ; trois lignes : nom (ellipse) + icône de côté ; pastille + Catégorie + symbole + synthèse calée à droite ; pastille + Zones (coupées) + sablier + récupération. Colonnes en proportion de la largeur utile (360, 402, 440), jamais de largeur codée en dur sur l'exemple. Catégorie et Zones depuis leurs propriétés structurées.
- **AC2** : récupération positive en ligne 3 (valeur seule), absente ou à 0 : rien (D2) ; toucher : réglage existant, sans ouvrir l'Exercice ; appui long : bulle Retirer ; actions accessibles conservées ; plus de rangée séparée ni de trait (D1). Le point d'arrêt garde son rendu existant jusqu'à la story 5.2.
- **AC3** : plus de poignée ; appui long sur toute la carte ; glisser, balayage, Dupliquer, Supprimer, récupération qui suit l'occurrence et animation de la story 2.3b inchangés.

### Story 5.1b: Photo ou affiche vidéo dans le gabarit, œil des Volumes dans la zone de contexte

- **AC1** : quand l'occurrence a un média, son premier média (photo, ou image d'affiche d'une vidéo) remplit le gabarit 64 × 64 de la carte v2 (rayon 12, recadrage centré, texte alternatif = nom de l'exercice, place réservée au chargement et en erreur), par le mécanisme existant de la vignette du Catalogue ; sans média, icône générique (D3).
- **AC2** : aucune lecture vidéo, aucun son, rien de persisté ; le média ne devient pas une cible tactile distincte (toucher et appui long de la carte inchangés).
- **AC3** : l'œil qui ouvre les modales « Volumes du circuit » (story 3.4) quitte l'en-tête du Circuit pour la zone de contexte (commandes contextuelles ; D4 remplacé par Hermann le 22/10/2026) ; disponibilité, modales, focus et accessibilité inchangés.

### Story 5.2: Rail segmenté, Circuit, bornes et points d'arrêt

- **AC1** : rail 1,5 `#7A7A80` en segments calculés depuis les positions réelles (anneaux des bornes et du Circuit, médias), sans traverser médias ni anneaux ; aucun nombre de segments ni coordonnée d'exemple ; segments qui suivent les décalages animés du glisser.
- **AC2** : Circuit en aplat sans contour (D5), débord 8, rayon et espacements Figma ; en-tête : anneau sur le rail, titre, œil (D4), compteur, durée alignée à droite sur la ligne du titre ; commandes de nature, compte et volumes inchangées ; le fond animé de la story 2.3b est conservé.
- **AC3** : point d'arrêt hors placement dans une rangée centrée entre les cartes, raccordé au rail ; retrait par appui long inchangé ; bornes et écarts verticaux selon Figma.

### Story 5.2b: Correction du rail pendant le déplacement

Demande de Hermann du 22/10/2026 (recette iPhone : rail discontinu, segments orphelins, traversée d'un gabarit photo après un déplacement). Causes prouvées : la carte soulevée grandissait de 4 dans la mise en page alors que rail et décalages la comptaient à sa hauteur de repos ; une carte revenue (dépôt refusé, annulation, dialogue de perte) restait exclue de la chaîne du rail pendant le retour.

- **AC1** : le soulèvement est neutre pour la mise en page ; seuls les éléments soulevés sortent de la chaîne du rail ; chaque segment relie les bords des éléments et ne traverse jamais un gabarit, pendant et après le geste.
- **AC2** : règles de déplacement, positions, RM-251, récupérations, calculs, données, styles et dimensions validés inchangés.

### Story 5.3: Placement mixte et défilement

- **AC1** : emplacements de point d'arrêt centrés entre les cartes, raccordés au rail ; emplacement de récupération en cadre pointillé dans la ligne 3 des seules cartes éligibles (une récupération existante, même à 0, interdit un second ajout) ; cartes non atténuées (D6).
- **AC2** : la liste défile jusqu'au dernier emplacement sous le pied protégé ; Annuler et Confirmer toujours accessibles ; sous-brouillon, positions autorisées, décompte, roulette et confirmation inchangés.

### Story 5.4: États soulevé et actions glissées

- **AC1** : état soulevé selon `8328:33546` (taille inchangée, ombre) ; actions glissées selon `8328:28863` (deux actions sur toute la hauteur de la carte v2) ; seuils et mécanismes de geste inchangés.
- **AC2** : CE-FMT-03 : aucune composition préremplie (Tabata, EMOM…) n'existe dans le code ; la story vérifie que le rendu v2 couvre les variantes de carte (Durée bilatérale, Séries identiques et variables, Répétitions, Répétitions + cadence, À l'échec) et consigne l'écart.

**Jalon J4 (iPhone, après 5.4)** : largeurs 360 / 402 / 440, cartes hors Circuit et dans le Circuit, textes longs, récupération absente / 0 / positive, placement complet, retrait, glisser, balayage, duplication, VoiceOver.

## Epic 6: Autonomie des Points d'arrêt (D-436)

Demande de Hermann du 21/10/2026 (« Composition de séance — Autonomie des Points d'arrêt »), règles R1 à R4, et arbitrages du 22/10/2026. Décision documentaire **D-436**, règle **RM-251** (lot documentaire de l'epic). **Remplace ARB-3** (20/10) et le rattachement du Point d'arrêt à son occurrence encodé par les stories 1.2 (AC4), 2.3 (AC2-AC3) et 4.3 (AC1), ainsi que le retrait par bulle des stories 4.2 (AC2) et 5.2 (AC3). Aucune migration ni évolution d'API : `{ id, scope, position }` représente déjà un point indépendant (inspection du 21/10) ; seul le Domaine pur (`StopPoint.ts`, `composition.ts`, `placement.ts`, `circuit.ts`) et l'écran changent.

**Arbitrages de Hermann du 22/10/2026 :**
- Dupliquer un Exercice ne copie pas son Point d'arrêt : `[A, P, B]` → `[A, A′, P, B]` ; la récupération reste copiée.
- Suppression d'un Exercice refusée (R4 ou position interdite) : « Supprimer » reste proposé ; au toucher, rien n'est supprimé, la carte se referme, annonce d'accessibilité de la raison.
- Frontières du Circuit : R4 structurelle (« après le dernier Exercice du Circuit » et « après le Circuit » consécutifs ; « avant » et « après » un Circuit vide consécutifs ; tête de Circuit toujours non proposée). En Séries, un passage partiel qui ferait se suivre deux Points dans le plan développé n'en exécute qu'un, sans rien retirer de la Séance.
- Libellé du placement : « Confirmer les modifications » dès qu'il y a un retrait, un mélange ou une seule modification de durée ; « Confirmer N pauses ajoutées » pour des ajouts seuls.

### Story 6.1: Domaine — Points d'arrêt indépendants et non-consécutivité

- **AC1** : déplacer, dupliquer ou supprimer une occurrence ne déplace, ne copie ni ne supprime aucun Point d'arrêt ; ils gardent leur place dans la séquence mêlée (occurrences et points de chaque portée) ; la récupération suit toujours l'occurrence.
- **AC2** : prédicat RM-251 sur la séquence structurelle (frontières du Circuit comprises) ; une opération qui le viole, ou qui rend un point interdit, est refusée sans mutation (aucune suppression silencieuse).
- **AC3** : déplacement autonome d'un point vers toute position autorisée et non consécutive ; refus sinon.
- **AC4** : le placement ne propose jamais un emplacement qui créerait deux points consécutifs, compte tenu des ajouts et retraits du sous-brouillon ; le sous-brouillon porte les retraits programmés.
- **AC5** : plan d'exécution : en Séries partielles, deux points successifs n'en produisent qu'un.

### Story 6.2: Glisser-déposer d'un Point d'arrêt

- **AC1** : la rangée du Point d'arrêt devient une rangée autonome de la séquence (hors bloc de l'occurrence) ; appui long → saisie et glisser, animation et rail de la story 2.3b et 5.2 réutilisés ; dépose valide appliquée, refus avec retour en douceur.
- **AC2** : déplacer un Exercice laisse le point en place ; refus si R1/R4.
- **AC3** : alternatives accessibles Monter / Descendre du point, proposées seulement si le déplacement est accepté.

### Story 6.3: Retrait en placement, libellé, fin de la bulle des points

- **AC1** : plus d'appui long ni de bulle « Retirer » pour un point ; la bulle de la récupération est inchangée.
- **AC2** : en placement, points existants sélectionnés ; toucher = retrait programmé, retoucher = annulation ; Confirmer applique, Annuler restaure tout ; libellés selon l'arbitrage ; persistance à « Continuer ».
- **AC3** : suppression d'un Exercice refusée selon l'arbitrage (carte refermée, annonce).

**Recette (Hermann, scénarios 1 à 15 de la demande)** : jalon J5 sur iPhone après 6.3.

## Epic 7: Retours de la recette iPhone du 22/10/2026 (D-437)

Recette J0 à J5 de Hermann du 22/10/2026 (`Recette_PRE-6.md`, commentaires 1 à 17). Décision documentaire **D-437** (ch07), propagée dans les chapitres concernés par le lot de l'epic. Aucune migration ni évolution d'API : `{ id, scope, position }` et `postActivityRecoverySeconds` suffisent.

**Interprétations retenues (réversibles, signalées à Hermann) :**
- Commentaire 5 : seule la règle du DÉPLACEMENT d'Exercice change (points en cause retirés sans message ; le premier d'une paire consécutive est conservé) ; la suppression garde le refus doux de D-436.
- Commentaires 6 et 17 : tête de Circuit proposée ; à N ≥ 2, début + fin de Tour → dialogue « lequel conserver » (Début de tour, Fin de tour, Annuler) ; à N ≥ 2, RM-219 n'interdit pas ces deux emplacements même si le Circuit ouvre ou clôt la Séance (l'exécution omet l'arrêt de tête ou de queue) ; à N = 1, RM-219 s'applique et un point devenu interdit au passage à N = 1 est retiré.
- Commentaire 7 : marque visuelle de l'état soulevé du Point d'arrêt (et état sélectionné du placement distinct).
- Commentaires 10 et 11 : stepper toujours affiché (Figma `8328:28605` le montre ouvert) ; chiffre en « Valeur modifiable » (fond `surface`, texte `primary`) ; D8 remplacé.
- Commentaire 12 : durée du Circuit > 3 min arrondie à la minute la plus proche, préfixe d'estimation conservé.
- Commentaire 16 : roulette à la sélection d'une zone non sélectionnée (durée existante, sinon défaut du Profil) ; modifier = désélectionner puis resélectionner.

### Story 7.1: Domaine — déplacement tolérant, début et fin de Tour, retrait de récupération en placement

- **AC1** : `moveOccurrence*` / `stepOccurrence` : un déplacement qui rendrait un point interdit ou consécutif est APPLIQUÉ et retire les points en cause (interdits d'abord, puis le second de chaque paire consécutive) ; l'issue nomme les points retirés. Suppression inchangée (refus).
- **AC2** : tête de Circuit autorisée et proposée (placement, déplacement autonome). À N ≥ 2 : conflit début/fin de Tour détecté (prédicat dédié) et rendu à l'appelant comme une issue « choix requis » portant les deux points, avec les deux résolutions possibles ; RM-219 levée pour ces deux emplacements ; plan d'exécution sans arrêt juste après le compte à rebours ni juste avant la Fin. Passage à N = 1 : points devenus interdits retirés ; passage à N ≥ 2 avec début + fin : choix requis.
- **AC3** : placement : récupérations existantes sélectionnées ; retrait programmé par occurrence ; resélection à une durée (modification) ; `applyPlacementDraft` retire (récupération absente) ; `placementConfirmation` compte les retraits comme changements.

### Story 7.2: Écran — récupération seulement en placement, Étiquette, fin de D-301, point soulevé

- **AC1** : hors placement, la récupération de la ligne 3 n'est plus une cible (ni toucher, ni appui long, ni bulle, ni action accessible propre) ; le toucher de la carte n'est pas changé.
- **AC2** : en placement, toutes les zones de récupération des Exercices sont sélectionnables (AC3 de 7.1), libellés et annonces ; libellé du bouton selon D-436.
- **AC3** : plus de message d'enchaînement sans pause (D-301 retirée) ; code et textes associés retirés.
- **AC4** : puce Étiquette : icône d'étiquette teintée de la couleur de l'Étiquette (sans Étiquette : inchangée).
- **AC5** : Point d'arrêt soulevé visiblement marqué ; dialogues « lequel conserver » branchés (placement, dépose d'un point, dépose d'une carte, changement de N) ; déplacement de carte tolérant (AC1 de 7.1) sans message.

### Story 7.3: En-tête du Circuit — stepper permanent et durée arrondie

- **AC1** : − N unité + toujours affichés et actifs ; N en « Valeur modifiable » ; cibles ≥ 44 espacées, pastille d'unité comprise ; textes de la ligne à la taille du titre ; troncature à 375 : durée d'abord, jamais le compteur.
- **AC2** : durée du Circuit > 3 min arrondie à la minute (préfixe d'estimation conservé).
- **AC3** : accessibilité du réglage inchangée (ajustable, unité annoncée).

### Story 7.4: Glisser — défilement automatique et cohérence après placement et changement de zone

- **AC1** : pendant un glisser (carte ou point), près du bord haut ou bas de la zone visible, la liste défile ; la position de dépose suit le défilement ; arrêt au bord de la liste, à la dépose ou à l'annulation.
- **AC2** (commentaire 13) : après la confirmation d'un placement, rail et cartes toujours à leur place (cause trouvée et corrigée, sans décalage arbitraire).
- **AC3** (commentaire 14) : glisser une carte dans ou hors du Circuit : cadre du Circuit correct pendant et après le geste.

**Jalon J6 (iPhone, après 7.4)** : commentaires 1 à 17 de la recette du 22/10 revus un par un.

## Ordre recommandé et dépendances

```
Étape 0 (réconciliation) ─┐
Epic 1 : 1.1 → 1.2 ┐       │
             1.1 → 1.3 → 1.4
Epic 2 : 2.1 (après 1.1) ; 2.2 (après 1.3) ; 2.3 (après 1.4)   → Jalon J1
Epic 3 : 3.1 (après 1.4) → 3.2 → 3.3 ; 3.4 (après 1.4, parallèle) → Jalon J2
Epic 4 : 4.1 (après 1.2, 2.1) → 4.2 → 4.3                       → Jalon J3
Epic 5 : 5.1 → 5.2 → 5.3 → 5.4 (après Epic 4 et 2.3b)              → Jalon J4
Epic 6 : 6.1 → 6.2 → 6.3 (après 5.3 ; 5.1b en parallèle)          → Jalon J5
Epic 7 : 7.1 → 7.2 → 7.3 → 7.4 (après la recette J0-J5 du 22/10)  → Jalon J6
```

Chemin critique : 1.1 → 1.3 → 1.4 → 3.1 → 3.2. Les stories 2.1, 1.2 et 3.4 peuvent avancer en parallèle.

## Recette iPhone (jalons)

Recette sur iPhone réel, build de développement, largeurs 375 et 402, VoiceOver. Jest ne remplace pas la recette (P-6).

| Jalon | Après | Points |
|---|---|---|
| J0 | 1.1 | Base réelle v10 migrée en v11 : séances, durées et paramètres PRE-5 identiques. Aucune récupération « 0 s » visible (E5). |
| J1 | Epic 2 | En-tête, Étiquette, bornes, Continuer et ses désactivations ; cartes (classification, volumes, côté) ; ajout, copie, duplication, suppression, glisser avant / dans / après ; Feuille PRE-5 ouverte depuis la Composition sans perte. |
| J2 | Epic 3 | Compteur révélé, nature, conversions avec et sans perte, 4 → 3 → 4, enregistrement à 3 puis augmentation, N hérité dans la Feuille, volumes Séries et Tours (« — », À l'échec, mixte, côtés, défilements), fermeture sans modification. |
| J3 | Epic 4 | Placement multiple, roulette, Confirmer N et Annuler, retrait, conservation au déplacement et à la duplication, répétition interne, durées, D-301. Parcours complet jusqu'à Continuer et réouverture. |

**Points soumis à Hermann pour J1 (choix faits sans règle explicite, réversibles) :** libellé « Continuer » (Q54 du 18/10 l'avait renommé « Enregistrer la séance ») ; format « 00 min 10 s » des bornes (Figma « 10 s ») ; notation « 3 × 1 min 30 s » (Figma « 1 min 30 »), unité répétée sur les durées variables, lignes mixtes « 10 · à l'échec rép. » ; « ≈ » sur la ligne estimée ; poignée conservée sur la carte (absente de Figma) ; textes des dialogues de perte à l'entrée dans un Circuit de Séries (story 2.3) ; « Squat (copie) (copie) » pour la copie d'une copie ; J3 : « Confirmer 0 pause ajoutée » actif quand seule une durée existante a été modifiée en placement (story 4.2) ; roulette de récupération centrée (Figma : feuille basse) ; D-301 (story 4.3) : deux passages successifs de la même occurrence ne sont jamais signalés (ex. Circuit de Tours avec un seul exercice), et un point d'arrêt interrompt l'enchaînement.

## Risques étayés

| # | Risque | Preuve | Parade |
|---|---|---|---|
| R1 | Régression dans un écran de 2944 lignes (3378 lignes de tests) | `CompositionScreen.tsx` | AD-41 : composants séparés. La suite existante sert de filet. |
| R2 | Effacement des points d'arrêt à la mise à jour | `SqliteSessionRepository.ts:503-510` | Story 1.2 AC3, avant toute interface. |
| R3 | Récupération « 0 s » affichée partout aujourd'hui | `compositionPresentation.ts:360`, CS L1885 | Story 2.1 AC4. |
| R4 | Duplication de la logique de séries entre la Feuille et le Circuit | `setSeriesCount` interne au brouillon de Feuille | AD-39 : extraction pure, tests existants. |
| R5 | Évolution de la Feuille PRE-5 après fusion (recettes en attente) | `sprint-status.yaml` PRE-5 | Étape 0, point 3 ; story 3.3 limitée à `inheritedSeriesCount`. |
| R6 | Migration sur données réelles | Migration 011, `DATABASE_VERSION` = 10 | ADD COLUMN seulement ; jalon J0. |
| R7 | Densité de l'en-tête du Circuit à 375 et avec Dynamic Type | Conteneur 354 × 34 ; précédents PRE-5 (deferred-work, segmentés) | Story 3.1 AC4, vérification sur appareil. |
| R8 | Glisser-déposer maison étendu aux bornes du Circuit et au bloc avec récupération | `compositionGesture.ts` | Story 2.3 ; J1 sur appareil. |
| R9 | `CLAUDE.md` du clone de révision OpenSpec présent à la racine de `main` (commit `f7ff4200`), alors qu'il indique « Ne pas fusionner tel quel dans `main` » | `CLAUDE.md` l. 3 | Traité pour PRE-6 : `CLAUDE.md` propre à la branche PRE-6 (commit `41c4a223`), exclu à la livraison ; celui de `main` reste inchangé. |

## Arbitrages (clos par Hermann le 20/10/2026)

**ARB-1 — Récupération positive dans la Composition : CLOS.** La règle validée s'applique : la récupération positive s'affiche sous la carte d'exercice, dans sa zone structurelle dédiée (story 2.2 AC2). Ce n'est pas une décision nouvelle. La formulation contraire de ch10 L602 est à réconcilier dans le lot documentaire, sans changer ce comportement.

**ARB-2 — Indicateur de changement de côté : CLOS, inclus dans PRE-6.** Icône seule quand la fonction s'applique, sans indicateur directionnel `D→G` / `G→D`. Présentation selon les composants Figma actualisés (`5544:6797`, `6214:7278`) et ch13 L1254-1260 (PR #390). Paramètres fonctionnels PRE-5 inchangés (story 2.2 AC3). Sujet non rouvert.

**Remplacé par D-436 (Hermann, 21-22/10/2026, epic 6) : le Point d'arrêt ne suit plus son occurrence.** **ARB-3 — Point d'arrêt : CLOS.** Le Point d'arrêt accompagne l'occurrence d'exercice à laquelle il est rattaché, comme la Récupération, lors des déplacements, duplications et suppressions (ch09 L682, PR #390). La représentation `{ id, scope, position }` est conservée : la position organise la séquence, elle ne fige pas le point. Les opérations de Composition actualisent les positions dans les emplacements autorisés (AD-36 ; stories 1.2 AC4, 2.3 AC2-AC3, 4.3 AC1).

### Points non bloquants (défaut appliqué, vérifié en recette)

- **Titre de l'en-tête.** « Circuit » + œil sur la ligne du titre (CIR-10, DSF-CIRCUITS L18, Figma) plutôt que « Nombre de tours » (ch12 L955 et L1250, ch13 L1553, antérieurs au 12/10). Lot documentaire de mise à jour.
- **Alignement de l'unité en grille mixte.** Non dessiné (ch13 L1888) : rendu selon les invariants de CE-CIR-03, jugé à J2.
- **Mention du N hérité dans la Feuille.** La dette Figma reste ouverte (DSF-CIRCUITS L54) : état indisponible existant, sans astérisque, jugé à J2.
- **Roulette de récupération.** Le X de `8328:28733` vaut Annuler pour cet emplacement (ch08 L467 et ch13 L1494 concordent sur l'effet).

## Raccordements transverses

- **Données** : migration 011 (AD-34, AD-35) ; `session_stop_points` sans changement de schéma (AD-36).
- **API fonctionnelles (ch11)** : API-COM-02, API-COM-09, API-COM-REC-01 à 05, placement L228-251, Circuits L255-267. Elles sont réalisées par les fonctions pures d'AD-39 et AD-43, sans nouveau service.
- **Documentation : lot proposé à Hermann** (aucune modification sans son accord). La PR #390 règle déjà la clarification du Point d'arrêt (ch09 L682) et le rendu des cartes (ch06, ch12, ch13) ; restent :
  1. ch09 : nature persistée, borne typée réservée aux formats ;
  2. ch10 L602, à réconcilier avec la règle validée (ARB-1) ;
  3. ch12 L955 et L1250 ; ch13 L1553 (compteur révélé, titre) ;
  4. ch13 L1440 : identifiants Figma périmés → `8328:*` ;
  5. ch11 API-COM-06 (« enregistrées » → brouillon, D-388) et API-COM-REC-02 (plage 0..300) ;
  6. ch10 L540 et L562 (Catégories, palette de 12 couleurs, devenus caducs).
  7. ch07 : D-124 (suffixe `(copie)`) porte encore « Révisée par D-138 » alors que D-138 ne traite que la récupération ; ch13 (Consultation et modification d'un Exercice) et la story 2.3 appliquent le suffixe.
  8. ch07, ch10 L627 et L2216, ch13 L1474, L1530, L1575, L1678 : D-303 « trait de démarcation toujours présent » remplacé par la décision de Hermann du 21/10/2026 : hors placement, aucun trait sous une occurrence sans récupération positive ni point d'arrêt (conforme à Figma `8328:28605`).
- **Interfaces impactées** : Composition, ExerciseScreen (contexte hérité), Feuille (option existante seulement), `KodjoIcon` (œil), `fr.ts`.

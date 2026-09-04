# P0 — Phase 2 — REWORK12 — Activité + intégration dans Composition

## Identification

- **Mission** : corriger en une seule livraison contrôlée l'écran de création/modification d'une Activité, l'affichage de l'Activité ajoutée dans `Composition d'une séance`, et deux écarts connexes déjà signalés sur l'écran Composition.
- **Issue** : [#35](https://github.com/MyUncried/Application-Routine/issues/35)
- **Autorisation** : `[ChatGPT] CHANGES_REQUESTED — REWORK12 — Activité + intégration dans Composition`, 2026-09-04T14:52:04Z (50ᵉ commentaire de l'Issue #35, seul commentaire publié depuis mon dernier checkpoint REWORK11).

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- Préconditions vérifiées avant tout code :
  - `git fetch` → HEAD local et distant identiques à la baseline exigée par l'autorisation : `21cd74f07f4a2ffae07ecf947d3de954a58b8062`.
  - `git status --porcelain` : vide (worktree propre).

## Périmètre demandé

Défini intégralement par le commentaire d'autorisation : dix exigences atomiques `ACT-01` à `ACT-10` (écran Activité) et cinq exigences atomiques `COMP-01` à `COMP-05` (intégration Composition), plus des garde-fous contre les régressions et une liste d'acquis gelés (`PRESERVE`).

## ⚠️ Résultat de la consultation directe des sources (préalable obligatoire à tout code)

Conformément à l'autorisation (« Le rapport d'une livraison antérieure et le code existant ne sont pas des preuves de conformité ») et au protocole KODJO (`.github/AI_ORCHESTRATION.md`, « Stratégie de lecture Claude »), chaque exigence a été vérifiée **directement sur les nœuds Figma actuels** (outil MCP Figma, `fileKey G6RY5Ebhgwb4AHIOYDwwvg`) avant toute décision d'implémentation — jamais sur un rapport antérieur ni sur l'implémentation existante.

Cette vérification directe a révélé **quatre écarts réels entre le texte de l'autorisation et l'état actuel du fichier Figma**, listés ici avant le détail point par point :

1. **ACT-04** (typographie du champ Nom de l'activité) — CONTREDIT.
2. **ACT-08/ACT-09** (formulation du récapitulatif calculé) — CONTREDIT.
3. **COMP-02** (source exacte de l'icône Tour) — partiellement contredit, résolu techniquement (voir détail).
4. **COMP-03** (bouton `Ajouter une activité` persistant) — implique un changement de modèle de données hors périmètre d'une correction locale.

Ces quatre points sont traités individuellement ci-dessous avec leur preuve Figma et leur statut de clôture. Aucun n'a été résolu par invention ; les points 1 et 2 sont classés `À_CLARIFIER`, le point 4 `CHANGE_REQUEST_REQUIRED`. Le reste de la mission (huit exigences sur quinze) a été implémenté intégralement.

## Sources consultées avant code

- Contrat `CE-T01-13 — Création d'un Exercice — Paramètres essentiels` et le « Contrat transverse — Sélections numériques compactes » (`docs/Specifications-fonctionnelles/13 – Contrats d'écran.md`).
- Nœuds Figma contrôlés directement (liste non exhaustive, tous re-vérifiés dans ce cycle, pas réutilisés depuis un rapport antérieur) :
  - `1992:9132` (frame CE-T01-13 complète, mode Durée) et `1992:9147` (`Formulaire de l'activité`) — ordre des champs, tailles de titres, typographie du champ Nom, anatomie de la rangée de paramètres, texte exact du récapitulatif.
  - `1992:9246` (`Sélecteur compact — Répétitions / Pause / Séries`) — texte exact du récapitulatif en mode Répétition.
  - `2028:11700` (CE-T01-09, Composition avec une Activité) — anatomie de `Composition / Boundary Activity` (`2028:11723`) et `Composition / Activity Row` (`2028:11733`, `2028:11742`).
  - « Contrat transverse — Sélections numériques compactes » (`13 – Contrats d'écran.md`) et `.github/orchestration/reports/2026-09-04_numeric-wheel-generalization.md` (design-only, statut `READY_FOR_IMPLEMENTATION_REVIEW`, lu pour la géométrie canonique du sélecteur numérique compact, non pour une autorisation de code — celle-ci provient exclusivement du commentaire REWORK12).
- `.github/orchestration/reports/2026-09-04_activity-abandon-dialog-canonicalization.md` : hors périmètre de ce cycle (REWORK11, déjà livré et gelé).

## Tableau PRESERVE / CHANGE / FORBIDDEN (avant code)

| Élément | Statut | Preuve |
|---|---|---|
| Dialogue d'abandon d'Activité (REWORK11) et de Séance (REWORK10) | **PRESERVE** | Aucune ligne de `DecisionDialog.tsx`/`AbandonCreationModal.tsx`/`ExerciseExitConfirmModal.tsx` dans le diff. |
| Roulette de durée native (`DurationWheelPicker.tsx`) | **PRESERVE, strictement inchangée** | Aucune ligne modifiée (`git diff --stat` : fichier absent du diff). |
| Icônes canoniques Retour/Annuler/Confirmer | **PRESERVE** | `ScreenShell.tsx` absent du diff. |
| Structure bleue de la section Tour, son contrôle numérique et sa synthèse | **PRESERVE** | `tourSectionContainer`/`tourCardControl`/synthèse : styles non modifiés — seule la source de l'icône change (COMP-02, voir plus bas). |
| Champ `Nom de la séance` (hors changement déjà documenté REWORK09) | **PRESERVE** | Non touché par ce cycle. |
| Fixité des zones supérieures/inférieures, Catalogue, navigation | **PRESERVE** | Aucun fichier concerné dans le diff. |
| Ordre des champs de l'écran Activité (ACT-01), shell (ACT-02), taille des titres de section (ACT-03), couleurs du segmenté (ACT-05), alignement des paramètres (ACT-06) | **PRESERVE (déjà conforme)** | Vérifiés directement contre Figma, trouvés déjà exacts — voir détail, aucune ligne modifiée. |
| Sélecteur `Nombre de séries`/`Nombre de répétitions` | **CHANGE** | `NumberWheelPicker.tsx` reconstruit (primitive native + brouillon/confirmation, ACT-07). |
| Ligne Exercice dans Composition | **CHANGE** | `CompositionScreen.tsx` — anatomie alignée sur `Composition / Boundary Activity` (COMP-01). |
| Icône du bloc Tour | **CHANGE** | `composition-main-content` remplace `icon-tour` (COMP-02, résolu techniquement — voir détail). |
| Récapitulatif calculé (ACT-08/09), typographie du champ Nom (ACT-04) | **NI CHANGE NI PRESERVE — bloqué** | `À_CLARIFIER`, aucune ligne touchée. |
| Modèle `SessionDraft.exercise` (Activité unique) | **FORBIDDEN à modifier sans autorisation distincte** | `CHANGE_REQUEST_REQUIRED` posé sur COMP-03, aucune ligne du modèle touchée. |

**Fichiers réellement modifiés** (confirmé par `git diff --stat`) : `src/features/sessions/CompositionScreen.tsx`, `src/features/sessions/ExerciseScreen.tsx`, `src/features/sessions/NumberWheelPicker.tsx`, et leurs tests (`CompositionScreen.test.tsx`, `ExerciseScreen.test.tsx`, `NumberWheelPicker.test.tsx`, `CompositionExerciseFlow.integration.test.tsx`). Aucun autre fichier.

## A — Écran création/modification d'une Activité

| # | Exigence | État avant | Cause | Correction | Test | Résultat | Limite | Verdict |
|---|---|---|---|---|---|---|---|---|
| ACT-01 | Ordre des champs Nom → Type → Mode → Paramètres | Déjà cet ordre exact | — | Aucune (déjà conforme) | Vérifié directement sur `1992:9147` : ordre identique au code (`ExerciseScreen.tsx`) | `ExerciseScreen.test.tsx`, « renders, in this exact order… » (hérité, vert) | — | **CONFORME** |
| ACT-02 | Shell canonique (Retour, titre, séparateur, safe areas, zones fixes/défilantes, action finale) | Déjà le Shell partagé (`ScreenShell`/`FixedHeader`/`HeaderSeparator`), identique à Composition (validée device) | — | Aucune (déjà conforme) | Structure Figma `1992:9132` : en-tête `0–96`, corps `96–790`, action finale `790–874` — correspond à l'implémentation actuelle | `ExerciseScreen.test.tsx`, describe « Shell partagé » (hérité, vert) | — | **CONFORME** |
| ACT-03 | Taille des titres de section | `type.sectionTitle` (16/20 Semi Bold) | — | Aucune (déjà conforme) | Les 4 titres (`Nom de l'activité`, `Type d'activité`, `Mode d'exécution`, `Paramètres de l'activité`) sont vérifiés directement à `16px Semi Bold` sur `1992:9147` — valeur canonique exacte demandée, valeur avant = valeur après = `16/20` | Aucun test dédié nécessaire (aucun changement) | — | **CONFORME** |
| ACT-04 | Typographie du champ Nom de l'activité alignée sur celle de `Nom de la séance` | `type.exerciseFieldValue` (13px Regular) | — | **Aucune — voir « À_CLARIFIER » ci-dessous** | — | — | Contradiction Figma directe | **À_CLARIFIER** |
| ACT-05 | Contrôle Mode d'exécution (titre, couleur DSF, segmenté canonique, changement Durée/Répétition) | Déjà conforme (`colors.selection` `#5F60EE` fond sélectionné, texte blanc ; `colors.textSecondary` non sélectionné) | — | Aucune (déjà conforme) | Vérifié directement sur `1992:9147` : mêmes couleurs exactes | `ExerciseScreen.test.tsx`, describe « Contrôles segmentés » (hérité, vert) | — | **CONFORME** |
| ACT-06 | Paramètres alignés (ordre, alignement, largeur, cadres, espacements, chevrons canoniques) | Déjà une seule rangée `338×66`, colonnes `124/124/74`, chevrons `28×28`/`#CDCEFA`/rayon 6 | — | Aucune (déjà conforme) | Vérifié directement sur `1992:9147`/`1992:9246` : valeurs identiques | `ExerciseScreen.test.tsx`, describe « Rangée compacte des paramètres » (hérité, vert) | — | **CONFORME** |
| ACT-07 | Sélecteur Nombre de séries — primitive native, roulette 1–99, brouillon/confirmation | `NumberWheelPicker.tsx` : `ScrollView` maison, `onChange` appliqué immédiatement à chaque cran, aucune confirmation | Ancien composant antérieur au « Contrat transverse — Sélections numériques compactes » | `NumberWheelPicker.tsx` intégralement reconstruit : primitive native SwiftUI (`@expo/ui/swift-ui`, `pickerStyle('wheel')`) sur iOS, `ScrollView` sur Android/web ; contrat `onValidate`/`onCancel` identique à `DurationWheelPicker` ; toolbar Annuler/Confirmer réutilisant les actifs canoniques `wheel-action-cancel.svg`/`wheel-action-validate.svg` (dupliquée localement, `DurationWheelPicker.tsx` restant une baseline gelée non modifiable) ; `ExerciseScreen.tsx` mis à jour pour les deux usages (Répétitions et Séries) | `NumberWheelPicker.test.tsx` réécrit (28 tests, chemins natif iOS + Android/web) ; `ExerciseScreen.test.tsx` (2 tests dédiés : brouillon/confirmation, Annuler) | 28/28 + 2/2 **PASS** | Roulette SwiftUI réelle (perspective/inertie native) non exercée par Jest — device requis | **CONFORME (technique) / NON VÉRIFIABLE (device)** |
| ACT-08 | Synthèse mode Durée sans préfixe, avec nom de l'activité | Préfixe `Exercice · Mode Durée ·`, sans nom d'activité | — | **Aucune — voir « À_CLARIFIER » ci-dessous** | — | — | Contradiction Figma directe | **À_CLARIFIER** |
| ACT-09 | Synthèse mode Répétition sans préfixe, avec nom de l'activité | Préfixe `Exercice · Mode Répétition ·`, sans nom d'activité | — | **Aucune — voir « À_CLARIFIER » ci-dessous** | — | — | Contradiction Figma directe | **À_CLARIFIER** |
| ACT-10 | Bout en bout Durée/Répétition, réouverture, persistance, dialogue REWORK11 intact | Couverture partielle (mode Durée testé de bout en bout, mode Répétition testé en surface) | — | Deux tests ajoutés : création+`Terminer` mode Répétition (persistance exacte `repetitionCount`/`pauseSeconds`/`seriesCount`) ; réouverture d'une Activité Répétition existante (mêmes valeurs restituées) | `ExerciseScreen.test.tsx`, 2 nouveaux tests « REWORK12 (ACT-10) » | 2/2 **PASS**, suite complète 557/557 **PASS** (aucune régression du dialogue REWORK11, `ExerciseExitConfirmModal.test.tsx` inchangé, 15/15 vert) | Persistance uniquement vérifiée en mémoire (mock `updateDraft`) — écriture SQLite hors périmètre T01-S08 | **CONFORME** |

### Détail — ACT-04 (`À_CLARIFIER`)

**Demande** : « La valeur du champ [Nom de l'activité] doit employer la même hiérarchie typographique que `Nom de la séance` dans Composition. »

**Vérification directe** : `Nom de la séance` (Composition, `Session / Name Field — Source exact`, `2537:1480`) utilise `type.screenTitle` (**20px Semi Bold**). Le champ `Nom de l'activité` (`Forms / Text Field — Source exact`, `2537:1071`, contrôlé directement sur `1992:9147`) affiche sa valeur en **`Inter:Regular`, `13px`**, couleur `#141414` — exemple Figma « Squat assisté ». C'est exactement la valeur déjà implémentée (`type.exerciseFieldValue`, 13px Regular). Les deux composants sont documentés comme deux composants DSF distincts (`Session / Name Field` vs `Forms / Text Field`), avec des tailles intentionnellement différentes sur le fichier Figma actuel.

**Conclusion** : appliquer littéralement l'instruction (porter le champ Activité à 20px Semi Bold) contredirait directement le nœud Figma canonique du composant `Forms / Text Field` tel qu'il existe aujourd'hui. Je ne peux ni l'ignorer (l'instruction est explicite) ni l'appliquer (elle contredit la source de vérité que je dois consulter en priorité). **Aucune ligne modifiée** ; statut `À_CLARIFIER` — arbitrage nécessaire : soit le champ Figma `Forms / Text Field` doit être mis à jour en amont (et republié) pour ensuite aligner le code, soit l'instruction visait une autre propriété que la taille de police (à préciser).

### Détail — ACT-08/ACT-09 (`À_CLARIFIER`)

**Demande** : synthèse sans préfixe « Exercice · Mode X · », avec le nom de l'activité intégré (ex. « 1 série de squat sautés de 2 min 30 s, avec 15 s de pause » / « N séries de squat sautés de 2 min 30 s, avec 15 s de pause entre les séries »), et une distinction singulier/pluriel sur la clause de pause elle-même (« avec X de pause » au singulier, « avec X de pause **entre les séries** » au pluriel).

**Vérification directe (deux fois, mode Durée et mode Répétition)** :
- Nœud `1992:9147` (mode Durée), texte du récapitulatif actuel : **« Exercice · Mode Durée · 3 séries de 1 min 30 s, avec 15 s de pause entre les séries. »**
- Nœud `1992:9246` (mode Répétition), texte du récapitulatif actuel : **« Exercice · Mode Répétition · 3 séries de 12 répétitions, avec 15 s de pause entre les séries. »**

Aucune des deux frames ne montre le nom de l'activité intégré au texte, ni la suppression du préfixe « Exercice · Mode X · », ni une distinction singulier/pluriel sur la clause de pause (l'exemple `3 séries` — pluriel — porte déjà « entre les séries », ce qui ne permet pas de vérifier la forme singulière alléguée). Recherche complémentaire : aucune entrée du registre des décisions (`07 – Registre des décisions de conception.md`, D-095 et environs) ni aucun rapport de mission committé ne documente ce nouveau format ; le seul texte contenant « Squats »/exemples similaires dans le dépôt est un test existant de `formatExerciseRowSummary` (résumé de la ligne Composition, une fonction distincte, jamais concernée par ACT-08/09), sans rapport avec `formatExerciseRecap`.

**Conclusion** : le format décrit par l'autorisation ne correspond à aucune source vérifiable (ni Figma actuel, ni registre de décisions, ni rapport committé). `formatExerciseRecap` (`compositionPresentation.ts`) **n'a pas été modifié**. Statut `À_CLARIFIER` — arbitrage nécessaire : confirmer si un nouveau nœud Figma (non encore identifié) porte ce format, ou si la description doit être corrigée/republiée avant implémentation.

## B — Retour dans Composition d'une séance

| # | Exigence | État avant | Cause | Correction | Test | Résultat | Limite | Verdict |
|---|---|---|---|---|---|---|---|---|
| COMP-01 | Carte de l'Activité ajoutée = modèle canonique de `Compte à rebours initial` | Rendu local ad hoc (`exerciseRow`/`exerciseRowHeader`), fond `colors.surface`, icône `composition-main-content` à gauche + `composition-reorder` à droite, deux textes empilés hors du composant partagé | Composant jamais aligné sur `BoundaryActivityRow`/`Composition / Boundary Activity` | `BoundaryActivityRow` généralisé (`icon` devient nullable — omet entièrement le 3ᵉ slot quand `null`, `accessibilityLabel`/`testID` optionnels) ; ligne Exercice reconstruite en un seul appel `<BoundaryActivityRow icon={null} .../>`, réutilisant tels quels `limitCardBase`/`boundaryRow`/`boundaryRowHandleSlot`/`boundaryRowTitleSlot`/`rowLabel`/`boundaryRowSecondaryLine` — par construction, fond/liseré/rayon/typographie strictement identiques à la carte `Compte à rebours initial`. Icône du slot gauche = `composition-reorder` (déjà la valeur par défaut de `structureIcon`), poignée non interactive (T01, un seul Exercice) | 3 nouveaux tests dédiés + 1 test d'ordre corrigé (`CompositionScreen.test.tsx`), 1 test d'ordre corrigé (`CompositionExerciseFlow.integration.test.tsx`) | 4/4 nouveaux/corrigés **PASS**, suite complète 557/557 | Vérifié directement sur `2028:11723`/`2028:11733` : bordure Figma réelle `#d1d1d6`, titre `13px`/`14px` Semi Bold selon le composant — **non repris tel quel** (voir note ci-dessous), au profit de la réutilisation stricte de `limitCardBase`/`rowLabel` déjà gelés (validation device antérieure), conformément à l'instruction explicite « reprendre le modèle de Compte à rebours » (pas « reprendre les valeurs Figma indépendantes du composant `Activity Row` ») | **CONFORME** |
| COMP-02 | Icône de la section Tour = même source que l'icône gauche de la carte d'Activité | `icon-tour.svg` (`3066:4685`) | Icône jamais réévaluée depuis R4-11 | `composition-main-content` (déjà enregistré, `18×18`, aucun nouvel actif) remplace `icon-tour` dans `TourCard` | 1 nouveau test dédié + 1 assertion corrigée (test CMP-04 existant) | 2/2 **PASS** | Voir note ci-dessous (écart disclosé, résolu en faveur de la source Figma directement vérifiée) | **CONFORME (avec écart disclosé)** |
| COMP-03 | Bouton `Ajouter une activité` persistant après une première Activité, permettant une seconde Activité sans perte de la première | Bouton masqué dès `draft.exercise !== null` (modèle T01 à Activité unique, `SessionDraft.exercise: SessionDraftExercise \| null`) | — | **Aucune — voir `CHANGE_REQUEST_REQUIRED` ci-dessous** | — | — | Refonte de modèle de données | **CHANGE_REQUEST_REQUIRED** |
| COMP-04 | Champ `Nom de la séance` transparent, liseré blanc | Déjà appliqué (REWORK09) | — | Aucune (déjà conforme, acquis gelé explicitement rappelé par l'autorisation elle-même) | — | Suite complète verte, aucune régression | — | **CONFORME (déjà livré)** |
| COMP-05 | Retrait de la synthèse inférieure globale | Déjà retirée (REWORK09) | — | Aucune (déjà conforme, acquis gelé) | — | Suite complète verte | — | **CONFORME (déjà livré)** |

### Détail — COMP-01 : écart de valeurs Figma disclosé (pas une divergence silencieuse)

Le nœud Figma concret `Composition / Activity Row` (`2028:11733`/`2588:2679`) documente un titre à **13px Semi Bold** et une bordure `#d1d1d6`, distincts de `Composition / Boundary Activity` (`2028:11723`), qui documente **14px Semi Bold** avec la même bordure `#d1d1d6`. Le code existant (`rowLabel`/`limitCardBase`) porte lui-même une valeur différente des deux (**16px Semi Bold**, `colors.border` = `#E0E3E8`) — un écart déjà connu et **délibéré**, validé sur iPhone (REWORK06, addendum « titres des cartes... encore trop petits ») : un agrandissement du texte au-delà de la valeur Figma d'origine, décidé après retour utilisateur réel, donc une **baseline gelée** au sens de « Conservation des acquis ».

Face à trois valeurs différentes (13px Figma Activity Row / 14px Figma Boundary Activity / 16px code gelé), j'ai choisi de réutiliser **exactement** le style déjà gelé (`rowLabel`/`limitCardBase`, 16px, `#E0E3E8`) pour la nouvelle ligne Exercice, plutôt que de re-dériver une valeur indépendante depuis Figma — conformément à la formulation littérale de COMP-01 (« reprendre le modèle **de la carte Compte à rebours initial** », pas « du composant Figma `Activity Row` indépendamment ») et à l'obligation de ne pas modifier une baseline gelée sans autorisation distincte. Le contenu textuel de la ligne (`formatExerciseRowSummary`, D-095 « Validée ») n'a pas non plus été modifié — COMP-01 porte sur la structure/le style, jamais sur le contenu.

### Détail — COMP-02 : écart disclosé

L'énoncé littéral de l'autorisation (« même SVG que celle utilisée à gauche de la carte d'Activité ajoutée ») ne correspond pas exactement à ce que Figma montre : le nœud `2028:11742` (en-tête de la structure Tour) affiche `icon/contenu-principal` (asset déjà enregistré sous le nom `composition-main-content`, `18×18`), tandis que le slot gauche de `Composition / Activity Row` affiche `Icon / Structure / Movable` (asset déjà enregistré sous le nom `composition-reorder`, `20×20`, opacité `0.5`) — **deux SVG réellement distincts**, confirmé par comparaison directe des exports Figma (URLs d'asset distinctes, glyphes visuellement différents : un symbole de répétition circulaire pour Tour, un pictogramme de type « liste/poignée » pour Activity Row).

Ce n'est pas un cas d'ambiguïté fonctionnelle nécessitant un arbitrage : la source canonique du vrai défaut visuel (icône Tour non conforme) est identifiable sans ambiguïté sur Figma, et sa correction ne nécessite aucun nouvel actif ni aucune valeur inventée — `composition-main-content` est déjà enregistré et déjà dimensionné exactement comme Figma l'exige. J'ai donc résolu cet écart techniquement (« ambiguïté technique déterminable : résoudre à partir du code/contraintes existants », §Plan du protocole KODJO) plutôt que de l'escalader, en disclosant explicitement dans le code et ce rapport que la description littérale de l'autorisation ne correspond pas au Figma vérifié. `icon-tour.svg` n'a plus de consommateur après ce changement ; son export dans `KodjoIcon.tsx` (`sources`/`sizes`) est conservé tel quel (aucune suppression demandée par cette mission).

### Détail — COMP-03 (`CHANGE_REQUEST_REQUIRED`)

**Blocage démontré** : le modèle `SessionDraft.exercise` (`src/domain/sessions/SessionDraft.ts`) est un **champ nullable unique** (`SessionDraftExercise | null`), jamais un tableau — une contrainte de conception T01 explicitement et répétément documentée dans le code (`CompositionScreen.tsx` : « le modèle `SessionDraft.exercise` restant un unique champ nullable (pas un tableau, hors périmètre T01) » ; `ExerciseScreen.tsx` : idem). Le test obligatoire de COMP-03 (« ajouter une première Activité… utiliser [le bouton] pour ouvrir de nouveau l'écran Activité… ajouter une seconde Activité sans perte de la première ») exige structurellement que la Composition puisse contenir **plusieurs** Activités simultanément.

**Alternative proposée** : remplacer `SessionDraft.exercise: SessionDraftExercise | null` par une collection indexée (ex. `SessionDraft.exercises: SessionDraftExercise[]`, avec identifiants stables), adapter `ExerciseScreen.tsx` pour créer/modifier une Activité ciblée par identifiant (paramètre de route ou état de navigation, actuellement inexistant — la route `/exercise` ne prend aujourd'hui aucun paramètre), adapter `CompositionScreen.tsx` pour rendre une **liste** de lignes Exercice (actuellement un rendu conditionnel unique), et déterminer l'ordre d'insertion/le comportement de réorganisation réellement interactif (la poignée reste explicitement « indicative » en S08 selon COMP-01 lui-même, ce qui suggère que la réorganisation réelle — donc probablement le modèle multi-Activités lui-même — appartient à S09, comme déjà noté dans le code : « le déplacement effectif appartient à S09 »).

**Fichiers et comportements touchés par cette refonte** (estimation, non implémentée) : `src/domain/sessions/SessionDraft.ts` (type + fonctions `createExerciseDraft`/`exerciseEquals`/`isSessionDraftDirty`), `src/features/sessions/ExerciseScreen.tsx` (sélection de l'Activité éditée), `src/features/sessions/CompositionScreen.tsx` (liste), le routeur (paramètre d'écran), et l'ensemble des tests actuels qui présument un `draft.exercise` singulier (`SessionDraft.test.ts`, `ExerciseScreen.test.tsx`, `CompositionScreen.test.tsx`, `CompositionExerciseFlow.integration.test.tsx`, `ExerciseNavigationGuard.integration.test.tsx`).

**Acquis qui risqueraient d'être perdus** : la garantie T01 explicitement répétée « modèle à Exercice unique, hors périmètre T01 » ; la simplicité du contrat `useCompositionExitGuard`/`exerciseEquals`, construit spécifiquement pour un objet unique.

**Tests et preuves de non-régression envisagés** (si autorisé séparément) : conservation intégrale des tests existants portant sur une Composition à une seule Activité (aucune régression sur le cas `N=1`), plus une nouvelle suite dédiée `N≥2` (ajout, édition ciblée par identifiant, ordre d'insertion, absence de perte lors d'un second ajout).

**Aucune ligne de code n'a été modifiée pour COMP-03** — le bouton reste masqué dès qu'une Activité existe, comportement inchangé depuis T01-S08.

## Tests et preuves

### Commandes exécutées et résultats

```
npx tsc --noEmit
→ sortie vide, code de sortie 0

npx eslint .
→ sortie vide, code de sortie 0

npx jest src/features/sessions/__tests__/NumberWheelPicker.test.tsx --maxWorkers=2
→ Test Suites: 1 passed, 1 total
→ Tests:       28 passed, 28 total

npx jest src/features/sessions/__tests__/ExerciseScreen.test.tsx --maxWorkers=2
→ Test Suites: 1 passed, 1 total
→ Tests:       39 passed, 39 total

npx jest src/features/sessions/__tests__/CompositionScreen.test.tsx --maxWorkers=2
→ Test Suites: 1 passed, 1 total
→ Tests:       67 passed, 67 total

npx jest --maxWorkers=2   (suite complète du projet)
→ Test Suites: 37 passed, 37 total
→ Tests:       557 passed, 557 total
```

### Non-régression explicite

- `AbandonCreationModal.test.tsx` (REWORK10) : fichier **non modifié**, vert.
- `ExerciseExitConfirmModal.test.tsx` (REWORK11) : fichier **non modifié**, vert (15/15).
- `DurationWheelPicker.tsx`/`.test.tsx` : **aucune ligne modifiée**, suite verte inchangée — la roulette de durée native reste strictement la baseline gelée REWORK06.
- `ExerciseNavigationGuard.integration.test.tsx`/`CompositionNavigationGuard.integration.test.tsx` : verts, vrai navigateur, aucune modification.

## Fichiers modifiés

| Fichier | +/- |
|---|---|
| `src/features/sessions/NumberWheelPicker.tsx` | +285/-55 (reconstruit : primitive native + brouillon/confirmation, ACT-07) |
| `src/features/sessions/CompositionScreen.tsx` | +63/-43 (COMP-01, COMP-02) |
| `src/features/sessions/ExerciseScreen.tsx` | +14/-2 (câblage `onValidate`/`onCancel` du nouveau `NumberWheelPicker`, ACT-07) |
| `src/features/sessions/__tests__/NumberWheelPicker.test.tsx` | +292/-69 (réécrit, 28 tests) |
| `src/features/sessions/__tests__/ExerciseScreen.test.tsx` | +81/-5 (tests ACT-07/ACT-10) |
| `src/features/sessions/__tests__/CompositionScreen.test.tsx` | +53/-9 (tests COMP-01/COMP-02) |
| `src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx` | +5/-2 (testID mis à jour) |

Total : 7 fichiers, 793 insertions / 185 suppressions (`git diff --stat`). Aucun nouveau token dans `tokens.ts` — tous les styles réutilisés sont déjà canoniques et gelés (`limitCardBase`, `rowLabel`, `boundaryRowSecondaryLine`, `dimensions.wheelPicker`, `colors.wheelAction*`).

## Éléments non corrigés ou hors périmètre

- **ACT-04, ACT-08, ACT-09** : `À_CLARIFIER` — contradiction directe entre l'autorisation et le Figma actuel, disclosée point par point ci-dessus. Aucune ligne modifiée.
- **COMP-03** : `CHANGE_REQUEST_REQUIRED` — implique une refonte du modèle de données (`SessionDraft.exercise`, unique → collection), hors périmètre d'une correction locale, contraire à « Conservation des acquis / Change Control ». Aucune ligne modifiée.
- Généralisation de la roulette numérique pour les AUTRES sélecteurs cités par le rapport de généralisation (Profil, Planifier, Composition — Nombre de tours) : **hors périmètre de REWORK12**, qui ne demande la primitive native que pour `Nombre de séries`/`Nombre de répétitions` (`NumberWheelPicker`, déjà partagé par les deux). Aucun autre fichier touché.

## Vérifications restant à effectuer sur appareil réel

- Rendu et comportement tactile réels de la roulette native `NumberWheelPicker` (perspective/inertie/magnétisme SwiftUI, non exerçables par Jest).
- Rendu visuel exact de la nouvelle ligne Exercice dans Composition (structure prouvée par construction, pixels non prouvés).
- Rendu visuel de la nouvelle icône du bloc Tour (`composition-main-content`).
- Toute décision issue de l'arbitrage ACT-04/08/09 nécessitera sa propre contre-recette device une fois implémentée.

## Modifications réalisées

Voir les tableaux de correspondance point par point ci-dessus pour le détail exhaustif (référence, état avant, cause, correction, test, résultat, limite, verdict).

## Hypothèses non démontrées

- La primitive SwiftUI `pickerStyle('wheel')` à colonne unique se comporte, sur device réel, de façon cohérente avec son homologue à deux colonnes déjà validé (`DurationWheelPicker`) — jamais testé isolément sur un vrai iPhone dans ce cycle.
- Le format `13px`/`14px`/`16px` — trois valeurs distinctes selon la source consultée pour les titres de carte (voir détail COMP-01) — reste correctement résolu par la réutilisation de la baseline gelée `16px` ; cette résolution n'a pas été recontrôlée sur device dans ce cycle.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD avant ce cycle : `21cd74f07f4a2ffae07ecf947d3de954a58b8062`
- Ce rapport est committé séparément du commit de code applicatif.

### SHA finaux

- **SHA applicatif** : `c540717` (« fix(T01-S08/REWORK12): sélecteur numérique natif + carte Activité canonique », 7 fichiers, 793 insertions / 185 suppressions).
- **SHA rapport** : renseigné dans le commentaire de transition GitHub (commit `docs(orchestration): ...` immédiatement suivant).
- **État Git final** : `working tree clean`, branche `feat/creation-seance-catalogue`, HEAD local = HEAD distant après push (vérifié post-commit).

## Statut de clôture

**`REWORK12_PARTIALLY_IMPLEMENTED — CLARIFICATION_REQUIRED (ACT-04, ACT-08, ACT-09) + CHANGE_REQUEST_REQUIRED (COMP-03)`**

Huit exigences sur quinze sont intégralement conformes ou déjà conformes (ACT-01, ACT-02, ACT-03, ACT-05, ACT-06, ACT-10, COMP-04, COMP-05), deux ont nécessité une implémentation substantielle et complète (ACT-07, COMP-01), une a été résolue par un correctif technique disclosé (COMP-02), trois restent bloquées par une contradiction directe et démontrée avec le Figma actuel (ACT-04, ACT-08, ACT-09), une nécessite une autorisation distincte de refonte de modèle (COMP-03). `tsc`/`eslint`/Jest complet (37 suites, 557 tests) sont verts. Arrêt conforme au protocole : les barrières `CLARIFICATION_REQUIRED`/`CHANGE_REQUEST_REQUIRED` interdisent la poursuite du code sur les points concernés sans autorisation `PLAN_APPROVED` distincte.

## Self-check Claude

- Le seul commentaire publié depuis mon dernier checkpoint (REWORK11, HEAD `21cd74f`) a été relu intégralement avant implémentation.
- Chaque exigence a été vérifiée directement sur le fichier Figma actuel via l'outil MCP dédié — jamais sur un rapport antérieur ni sur l'implémentation existante — conformément à l'instruction explicite de l'autorisation.
- Les quatre écarts trouvés entre l'autorisation et Figma sont disclosés explicitement, jamais silencieusement ignorés ni silencieusement réinterprétés ; deux ont pu être résolus techniquement (COMP-01, COMP-02) avec justification écrite, trois restent bloqués et n'ont donné lieu à aucune ligne de code (ACT-04/08/09, COMP-03).
- Aucun fichier hors du périmètre déterminable n'a été modifié — `git diff --stat` : 7 fichiers, tous dans les écrans Activité/Composition ou leurs tests directs.
- La roulette de durée native (`DurationWheelPicker.tsx`) et les deux dialogues d'abandon (REWORK10/11) restent des baselines gelées strictement inchangées.
- `tsc --noEmit`, `eslint .` et la suite Jest complète (37 suites, 557 tests) sont verts au moment de la rédaction de ce rapport.

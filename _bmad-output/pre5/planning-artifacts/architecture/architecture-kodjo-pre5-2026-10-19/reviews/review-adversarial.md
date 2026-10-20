# Revue adversariale du spine PRE-5 (delta) — 2026-10-19

- **Objet :** `ARCHITECTURE-SPINE.md` (PRE-5, AD-18 à AD-33), lu avec le spine parent PRE-4 (AD-1 à AD-17), le PRD PRE-5 et le code réel de `src/` (HEAD du clone, lecture seule).
- **Méthode :** pour chaque piste, on construit deux unités d'un niveau inférieur (stories ou modules) qui respectent **chaque AD à la lettre** et qui pourtant s'assemblent mal : formes de données incompatibles, deux propriétaires d'une même entité, chemins de mutation concurrents. Chaque paire est un trou à fermer par un AD nouveau ou resserré.
- **Relecteur :** indépendant, lecture seule. Ce fichier est le seul modifié.

## Verdict

Le spine fixe bien la forme persistée (AD-18), le module de la charge (AD-19) et le codec des étapes (AD-22). Il laisse pourtant **six paires incompatibles graves**. Toutes viennent d'un même angle mort : l'écart entre l'état **demandé** du Brouillon (`draft.variable`, `sideOrder`, `targetsById`) et l'état **effectif** produit par `normalizeEffective`. S'y ajoutent l'absence d'ordre entre les événements natifs du clavier et le réducteur `sheetSurface`. Le spine n'est pas prêt pour le découpage en stories tant que les AD proposés ci-dessous (AD-34 à AD-36, et les resserrements d'AD-19, AD-20, AD-21, AD-23 et AD-27) ne sont pas intégrés.

---

## Paires incompatibles graves

### P1 — N = 1 : état variable demandé ou uniforme effectif ? Phases et charge perdues au ✓

**Unités :** story Brouillon (AD-25) et story Feuille, cadre Séries (AD-20, AD-24, AD-28).

**Code réel.** Le Brouillon garde un état variable **demandé** à N = 1 (`ExecutionParametersDraft.ts:93`, `variable` ; `removeRow` peut ramener N à 1 en restant `variable`). `effectiveParameters` → `normalizeEffective` (`ExecutionParameters.ts:342-354`) rend alors un uniforme construit sur `rows[0]`. Ce littéral d'objet ne recopie que `target` et `pauseSeconds`. Le Type de série est figé à N = 1 (« Régime figé à N = 1 », `sheetSurface.ts`, événement `prune`). `setUniformTarget` et `setUniformPause` écrivent déjà `rows[0]` dans ce cas (REV-02, `Draft:428-437`).

**Construction.**
- La story Feuille suit AD-20 et FR-2 : les phases sont disponibles « en séries identiques ». Elle lit l'état **effectif**, uniforme à N = 1 : la ligne Phases est active et la ligne Charge est affichée comme commune (`KeyboardField` `row: "uniform"`, AD-27).
- La story Brouillon suit aussi AD-20 : `workPhases` est un « champ de `UniformSeries` uniquement », et `requestedParameters` produit une série `VARIABLE` quand `draft.variable` est vrai. Les phases ajoutées n'ont donc aucune place dans la série demandée. `normalizeEffective`, inchangé, reconstruit l'uniforme sans `workPhases` ni `loadKg` : au ✓, les phases et la charge commune disparaissent sans erreur. Le test d'aller-retour d'AD-25 (`requestedParameters(openSheetDraft(p)) = p`) passe quand même, puisqu'il ne traverse pas ce chemin.
- Variante : le Brouillon refuse l'ajout de phases parce que `draft.variable` est vrai. L'utilisateur est alors bloqué : la Feuille montre un uniforme, Phases est indisponible, et Type de série ne peut pas repasser à Identiques à N = 1.
- Autre variante : `setLoadValue("uniform", kg)` écrit `draft.uniform.loadKg`, mais le ✓ relit `rows[0].loadKg`. La charge saisie est perdue.

**AD proposé — AD-34 « Normalisation N = 1 : un seul propriétaire, champs PRE-5 compris ».**
- `normalizeEffective` recopie `loadKg` de la première ligne et pose `workPhases: []` quand il convertit une série `VARIABLE` à une ligne. Un test de propriété vérifie que `normalizeEffective` ne perd aucun champ de `SeriesRow` ni de `UniformSeries`.
- Toute transition PRE-5 qui porte sur l'uniforme (`setLoadValue("uniform")`, transitions de phases, Condition d'arrêt en identiques) suit la règle REV-02 de `setUniformTarget`. Seconde voie possible, à trancher une fois pour toutes : la première transition de phases à N = 1 avec `draft.variable` appelle d'abord `setVariable(false)`, comme `applyRequestedTotal` (`Draft:585`).
- L'éligibilité aux phases est **une** fonction pure du Brouillon (`workPhasesAvailable(draft)`), lue par la Feuille et appliquée par chaque transition. Elle est la seule à trancher entre état demandé et état effectif.

### P2 — Écrivain unique de D : suppression de la dernière phase et durées `null`

**Unités :** story Brouillon, transitions de phases (AD-20 et AD-25), et story Feuille, tableau des phases (FR-8).

**Construction.**
- AD-20 : « `deriveSeriesDuration` fixe `target` à `NUMBER(Σ)` si Σ ≥ 1, sinon `UNSET`. Seules les transitions de phases du Brouillon l'appellent. » Une story qui l'appelle **à chaque** transition de phases fait de la suppression de la dernière phase (Σ = 0) une Cible `UNSET`. Or FR-8 dit : « Sa durée devient la durée de série, modifiable ».
- AD-20 dit aussi : « Avec → Sans → `workPhases = []`, `target` déjà égal à la somme ». Une seconde story lit que le passage à Sans n'appelle pas `deriveSeriesDuration`. Les deux transitions, retrait de la dernière phase et passage à Sans, ont le même état d'arrivée (aucune phase) mais deux règles pour D.
- Durées `null` (phase à renseigner, FR-5) : `deriveSeriesDuration` reçoit des `WorkPhase` dont `durationSeconds` est typé `number`. Le Brouillon porte `number | null`. Une story compte `null` comme 0 et affiche D = Σ partielle. Une autre rend `UNSET` dès qu'une durée est `null` et affiche « — ». Les deux sont conformes à la lettre.
- Le retrait annulable d'une phase (« restitue … y compris D », FR-8) suppose que D soit recalculé à l'annulation. Le spine ne dit pas si `undo` passe par `deriveSeriesDuration`.

**Resserrement d'AD-20.** Écrire la règle sous forme de table :
- `deriveSeriesDuration(phases)` n'est appelé que si la liste **après** la transition est non vide. Un passage à une liste vide (retrait de la dernière, Avec → Sans) **garde** la Cible courante.
- `null` compte pour 0 dans la somme du Brouillon. Σ = 0 avec une liste non vide donne `UNSET`.
- L'annulation d'un retrait rappelle `deriveSeriesDuration`.
- `normalizeWorkPhases` au ✓ ne rappelle `deriveSeriesDuration` que si la liste normalisée est non vide. Sinon la Cible prend la valeur `UNSET` (FR-8, « aucune valeur inventée »), règle explicite et distincte.

### P3 — `KeyboardField` : focus natif et réducteur `sheetSurface`, deux chemins de mutation concurrents

**Unités :** story `KeyboardField` (AD-26) et story surfaces de la Feuille (AD-27), avec les transitions du Brouillon (AD-19, AD-25).

**Construction.**
- AD-26 : la valeur est appliquée « à la sortie du champ (perte de focus, Précédent / Suivant, fermeture) ». AD-27 : « toucher une autre surface ferme le champ (sa valeur est appliquée par la sortie du champ) et ouvre l'autre dans le même geste ». Le `onBlur` d'un `TextInput` arrive **de façon asynchrone**, après le `onPress` du contrôle touché. La story A applique la charge dans `onBlur` ; la story B traite le toucher (Charge → Sans, Type de série, croix de retrait d'une autre ligne) dans `onPress`. On obtient `setLoadEnabled(false)` **puis** `setLoadValue(...)` sur un Brouillon déjà passé à Sans, ou `setLoadValue` sur une ligne déjà retirée. Rien ne fixe l'ordre, ni la clé de la cellule (identité capturée au focus, ou rang courant).
- **Zéro en cours de navigation.** AD-19 applique `normalizeLoad` dans `setLoadValue`, à chaque sortie. En variables, saisir 0 dans la dernière cellule positive puis appuyer sur Suivant fait passer la charge à Sans, ce qui masque la colonne. `loadFieldOrder(draft)` devient `[]`. La story A appelle `focus()` sur une cellule déjà démontée.
- **Annuler invalidé par une sortie neutre.** AD-25 : « Toute transition nouvelle remet `pendingRemoval` à `null` ». Si la sortie du champ émet `setLoadValue` même quand la valeur n'a pas changé, toucher « Annuler » pendant que le clavier est ouvert fait déclencher `onBlur` et sa transition, et l'annulation est perdue avant le `onPress` d'Annuler. Le Brouillon existant rend inchangées les transitions sans effet (`Draft:34-36`), mais AD-26 ne l'exige pas de `setLoadValue` ni du libellé.
- **Focus direct.** Toucher un `TextInput` lui donne le focus nativement, sans passer par l'événement `touch` du réducteur. Si la story B n'ouvre `keyboard` que sur un `Pressable` enveloppant, le fond actif (AD-26 : « dérivé de la surface `keyboard` ») et l'absorption de ✓ et ✕ (AD-27) ne suivent pas le clavier réellement ouvert.

**Resserrement d'AD-27, ou AD-35 « Séquence clavier ».**
1. Le `onFocus` natif est la **seule** source de l'ouverture de `keyboard(field)` : le réducteur reçoit `focus(field)`. Le réducteur ne pilote le focus que pour Précédent, Suivant et Fermer.
2. La sortie applique la valeur **avant** l'événement qui l'a provoquée. Le contrôle touché appelle d'abord une fonction synchrone `flushKeyboardField()`, qui lit le texte local et dispatche, puis sa propre transition. `onBlur` ne dispatche que si la valeur n'a pas déjà été appliquée.
3. La cible est l'**identité** capturée au focus (`rowId` du Brouillon ou `WorkPhase.id`), jamais un rang. Une identité disparue rend la transition sans effet.
4. `setLoadValue` et `setPhaseLabel` avec une valeur égale à la valeur courante rendent le Brouillon **inchangé**, `pendingRemoval` compris.
5. `normalizeLoad` ne s'applique qu'à la fermeture de la famille `keyboard` (Fermer, appui extérieur, autre surface) et au ✓. Il ne s'applique pas lors d'un déplacement Précédent / Suivant : AD-19 indique aujourd'hui « à la sortie du champ », sans distinguer ces cas.

### P4 — Séparateur décimal : `parseLoadText` (langue de l'application) et `decimal-pad` (région de l'appareil)

**Unités :** `exerciseLoad.ts` (AD-19) et `KeyboardField` (AD-26).

**Construction.**
- AD-19 : `parseLoadText` lit le « séparateur de la langue » et renvoie `null` si le texte est illisible. FR-14 : « Le séparateur suit la langue de l'interface ». La langue de l'interface est le français, seul lexique.
- Sur iOS, `keyboardType="decimal-pad"` affiche le séparateur de la **région** de l'appareil, pas celui de la langue de l'application. Un iPhone réglé sur une région anglophone affiche « . ».
- La story `KeyboardField` passe le texte brut. La story `exerciseLoad` refuse « 20.5 » et renvoie `null`. Par la règle d'AD-19 (« une cellule vidée (`null`) vaut 0 à la sortie du champ … puis `normalizeLoad` »), la charge devient 0, puis **Sans**, sans message. C'est une perte silencieuse de la saisie, interdite par l'esprit de NFR-10. La même chose arrive avec « 1,2,3 » ou un collage.

**Resserrement d'AD-19.**
- `parseLoadText` accepte `,` **et** `.` comme séparateur décimal. Il refuse tout autre caractère, et refuse aussi un texte qui contient plus d'un séparateur.
- Distinguer `vide` de `illisible`. Seul le vide vaut 0. Un texte illisible rend le Brouillon inchangé : la valeur précédente est rétablie dans le champ. Cela correspond au « comportement standard des champs numériques » de FR-14.
- Un test couvre « 20.5 », « 20,5 », « 1,2,3 », « -3 » et « ».

### P5 — Mémoire « À la cible » dans `targetsById`, écrasée par `setMode` ; résultat `INCOMPLETE` en identiques

**Unités :** story Condition d'arrêt, Brouillon (AD-23), et story Feuille, cadre Exécution (AD-23, AD-24).

**Construction.**
- AD-23 : « revenir à À la cible restaure la dernière valeur `NUMBER` mémorisée dans le Brouillon pour cette identité et ce Mode (extension de `targetsById`) ». Or `rememberCurrentTargets` (`Draft:238-252`), appelé par `setMode`, `setVariable` et `setSeriesCount`, écrit **la Cible courante**, `FAILURE` compris, dans `targetsById[id][mode]`.
- La story A stocke la valeur `NUMBER` dans `targetsById` au passage à À l'échec. La story B, existante, l'écrase par `FAILURE` au premier changement de Mode : par exemple Durée 30 s, puis À l'échec, puis Répétitions, puis Durée. `setMode` conserve `FAILURE` (H27). Au retour à À la cible, la mémoire lue est `FAILURE` : la story A restaure `FAILURE` ou passe à `UNSET`, et les 30 s sont perdues contre FR-19.
- **Identiques avec une Cible `UNSET`** (création, ou Durée « — ») : `stopConditionOf` rend `INCOMPLETE` (AD-23). « La Feuille l'affiche. » Une story Feuille affiche le segmenté sans option choisie. Une autre affiche À la cible, défaut de FR-19, en lisant le `kind` de la Cible commune. Le rendu de `INCOMPLETE` n'est défini **nulle part**, ni en identiques ni en variables (FR-20 renvoie à D-384), alors que `SegmentedControl` `readOnly` (AD-24) exige une option sélectionnée.

**Resserrement d'AD-23.**
- La mémoire « À la cible » est un champ **distinct**, `lastNumberById: Record<id, Partial<Record<Mode, number>>>`. Il n'est écrit que par une Cible `NUMBER` qui quitte la ligne, au passage à À l'échec ou lors d'un `rememberCurrentTargets` sur une Cible `NUMBER`. Il n'est jamais écrit par `FAILURE` ni par `UNSET`. `setVariable(false)` le transmet à la nouvelle identité uniforme, comme `cloneIdentity`.
- `stopConditionOf` ne sert qu'en **variables**. En identiques, le choix affiché est `FAILURE` ⇔ Cible commune `FAILURE`, sinon À la cible.
- Rendu de `INCOMPLETE` en variables : préciser l'option sélectionnée, la sémantique accessible et le libellé, ou l'inscrire en question ouverte bloquante pour la story Feuille.

### P6 — Enchainement à N = 1 et Pause entre les côtés sous Sans : la donnée « conservée » est réécrite au ✓

**Unités :** story Côtés, Brouillon et Feuille (AD-21), et socle et validation (AD-13, `normalizeEffective`).

**Construction.**
- AD-21 : « à N = 1 la ligne est masquée et la valeur demandée conservée (D-415, **existant**) ». FR-17 : « l'Enchainement **enregistré** est conservé ». Dans le code, `validateForSave` renvoie `normalizeEffective(...)` (`ExecutionParameters.ts:690`), qui force `sideOrder: "BY_SIDE"` à N = 1 (`:352`). La conservation n'existe donc que dans le Brouillon. Ce qui est **persisté** est `BY_SIDE`. La story Côtés, qui croit l'existant conforme, n'y touche pas. Une story de recette lit FR-17 et constate qu'un `BY_SERIES` enregistré, après passage de N à 1 puis ✓, puis réouverture et N = 3, revient à `BY_SIDE`.
- **Pause entre les côtés.** FR-15 : « Sans masque ces lignes et **conserve leurs valeurs** ». AD-21 ratifie P3-10 : « Passer de Sans à Avec … copie la Pause entre les côtés du Profil ». `setSideMode` (`Draft:524-537`) **écrase** `sideRecoverySeconds` à chaque activation. Le parcours Avec (20 s) → Sans → Avec réécrit 20 s avec la valeur du Profil, dans la même ouverture comme après réouverture.
- Variante : une story Côtés écrit `RIGHT_LEFT` à chaque Sans → Avec (AD-21). Une valeur `LEFT_RIGHT` historique passée par Sans devient `RIGHT_LEFT`. C'est conforme à AD-21, mais AD-21 doit dire si la conservation de FR-16 couvre ce cas.

**Resserrement d'AD-21.**
- Dire explicitement que `normalizeEffective` ne réécrit **plus** `sideOrder` (l'Enchainement est simplement ignoré à N = 1 par les calculs, par le registre `buildExecutionLedger` et par la Phrase). La seconde voie, à faire trancher par Hermann car elle contredit FR-17, consiste à constater que la conservation n'existe pas après ✓ et à le noter en écart. Dans les deux cas, supprimer « existant ».
- P3-10 se limite à la **première** activation, quand la Pause entre les côtés vaut 0 ou n'a jamais été réglée. Sinon la valeur conservée sous Sans est restituée (FR-15). L'arbitrage revient à Hermann si P3-10 doit primer : c'est une différence fonctionnelle non résolue.

---

## Autres constats

### C1 — Cadence « Autre » : option dérivée de la valeur, mais Autre n'est pas une valeur (AD-24)

`cadenceOptionOf(value)` donne Autre seulement pour une valeur hors {0, 1, 2, 5}. Choisir Autre depuis 2 s laisse la valeur à 2. L'option affichée reste donc « 2 s », et le ± est révélé ou non selon la story. Ensuite, un ± qui atteint 1, 2 ou 5 fait basculer l'option affichée et masque le stepper pendant le geste (surface `stepper(beep)` sur un champ disparu). Il faut soit un état d'interface `cadenceOtherOpen`, porté par le réducteur et remis à faux à la fermeture, soit une règle « choisir Autre écrit la valeur suivante hors préréglages ». À fixer dans AD-24.

### C2 — L'Instantané ne porte aucune Description (AD-22, FR-41)

AD-22 affirme : « Transport (…, Instantané) inchangé : il porte la chaîne encodée ». Or `ExerciseSnapshot` (`exerciseSnapshot.ts:39-50`) n'a **aucun** champ `instruction` ni `description`. FR-41 exige les étapes dans les instantanés. Deux stories divergent : le socle passe l'enveloppe en v3 sans les étapes, la story Éditeur suppose qu'elles y sont. Il faut décider d'ajouter `instruction` à l'enveloppe v3 (lecture v1 et v2 → `null`), ou de consigner que l'Instantané, sans appelant de production, est hors de FR-41.

### C3 — Garde d'abandon de l'Éditeur : liste brute ou chaîne encodée ; double normalisation

AD-22 : « `formValueEquals` compare les listes ». Entrée crée une étape vide, ce qui donne une liste différente : le formulaire est « modifié » et la garde d'abandon s'affiche alors que rien ne sera enregistré. Une ancienne Description avec des lignes vides se décode en `["a", "", "b"]`, puis s'enregistre en `"a\nb"`. Par ailleurs, `validateInstruction` (`validation.ts:91-96, 368-381`) **retire les espaces du texte entier** après l'encodage. C'est un second normaliseur, qui modifie la première et la dernière étape différemment du codec. Enfin, le `maxLength={INSTRUCTION_MAX_LENGTH}` actuel (`ActivityEditorForm.tsx:419`) compte en UTF-16 et par champ, ce qui est incompatible avec une limite globale en points de code.

Il faut écrire dans AD-22 :
- `formValueEquals` compare `encodeInstructionSteps(gauche) === encodeInstructionSteps(droite)` ;
- le codec retire les espaces extérieurs de **chaque** étape, ce qui rend `normalizeInstruction` idempotent sur sa sortie ;
- le comptage de la limite est une seule fonction du codec ; aucun `maxLength` natif n'est utilisé pour les étapes ;
- Entrée à la limite est refusée, puisqu'elle ajoute un séparateur.

### C4 — `validateForSave` : tolérance à la ligne de base appliquée à une Cible dérivée (AD-13, AD-20)

Une Cible historique de 5999 s, tolérée (H25), peut être reproduite par des phases dont la somme vaut 5999. La Cible est alors égale à la base et tolérée, donc enregistrée au-delà de 3535 avec des phases, contre FR-3. Il faut ajouter : « avec `workPhases` non vide, aucune tolérance à la base ne s'applique à `target` ». Par ailleurs, `ExecutionParametersField` ne prévoit ni `workPhases`, ni `loadKg`, ni `loadEnabled`, et `toSessionViolation` (`validation.ts:389-407`) ramène tout champ inconnu à `exercise.executionMode`. Le spine doit nommer les nouveaux champs de violation et leur correspondance.

### C5 — Identités des phases : valeur initiale de `nextPhaseId`, rang ou identité dans les surfaces

AD-25 introduit `nextPhaseId` sans sa valeur à l'ouverture. Si une story prend `workPhases.length + 1` alors que les identifiants persistés sont `[2, 3]`, il y a collision, et `readV3` rejettera la donnée (identifiants non uniques). Il faut fixer `max(id) + 1`. AD-27 type `phase: number` et `row: number` sans dire s'il s'agit d'un rang ou d'une identité. Le parent impose l'identité pour `rowTarget` (`sheetSurface.ts`, en-tête). L'événement `rows` (« Ligne disparue ») ne transporte que des `rowIds` : il faut un équivalent pour les phases.

### C6 — Ligne Charge en identiques : un champ texte dans une option de segmenté (AD-24, AD-26)

FR-12 : « la valeur remplace Avec, par exemple “20 kg” ; elle reste éditable ». AD-24 classe Charge parmi les segmentés en ligne. AD-26 y met un `KeyboardField`. L'API d'AD-24 (`chevron`, `compact`, `readOnly`) ne permet pas de placer un champ dans une option. Une story étend donc `SegmentedControl`, ce qui est une nouvelle abstraction exclue par FR-27. Une autre compose la ligne hors du segmenté, ce qui donne un rendu différent. Il faut dire qui rend l'option « 20 kg » et où vit le `TextInput`.

### C7 — Panneaux ancrés et cadres arrondis (AD-28)

Le repère est unique, mais la **couche de rendu** n'est pas fixée. Un cadre gris arrondi rendu avec `overflow: "hidden"` découpe un `AnchoredPanel` placé à l'intérieur, alors qu'il doit passer « au-dessus des lignes ». Les lignes des tableaux ont trois niveaux de décalage (cadre, tableau, ligne), alors qu'AD-28 n'en nomme que deux. Les `onLayout` des cadres changent pendant les animations Q39 à Q41. Il faut fixer : panneaux rendus au niveau du contenu défilant, hors des cadres ; aucun `overflow: "hidden"` sur un cadre ; position recalculée à la fin de l'animation.

### C8 — Constantes de version après le passage à 3 (AD-18)

`readV2` compare `value.version` à `EXECUTION_PARAMETERS_VERSION` (`:792`). `serializeV2` **écrit** cette constante (`:731`). Après le passage à 3, une story socle qui ne change que la constante fait refuser le v2 par `readV2` et rend fausse la parité `serializeV2(readV2(sortie 010)) = sortie 010` (AD-10). Il faut ajouter à AD-18 que `readV2` et `serializeV2` emploient le littéral 2, et que le modèle relu depuis v2 porte `version: 3`.

### C9 — `loadEnabled = true` avec toutes les charges à 0 : état enregistrable

`normalizeLoad` ne s'exécute que dans `commitSheetDraft` (AD-25). `validateForSave` (`Terminer`, repositories) et `readV3` acceptent un état Avec dont toutes les charges valent 0, que la Feuille affichera Sans et que `loadClause` rendra « (charge : 0 kg) ». Il faut soit en faire une violation structurelle, soit faire de `normalizeLoad` une étape de `validateForSave`.

### C10 — `reactivateLoad` : quelles lignes ? (AD-19)

L'expression « toutes nulles » ne dit pas si elle porte sur les lignes actives seulement, ou aussi sur `hiddenRows` et `savedVariableRows`. Deux stories obtiennent 0,25 partout ou les valeurs restaurées pour la même saisie visible.

### C11 — Placement des clauses de phases et de charge hors de la « valeur par série » (AD-29)

Les gabarits « N séries à l'échec » et les gabarits mixtes n'ont pas de valeur par série. AD-29 ne fixe pas le point d'insertion de `loadClause` dans ces cas, pourtant exigés par Δ48 (« À l'échec avec charge »). Il faut un cas de corpus et une règle.

### C12 — Deux instantanés de retrait, un seul message (AD-25, AD-8)

Une phase et une série peuvent être retirées l'une après l'autre. AD-25 crée un instantané propre aux phases, mais AD-8 n'a qu'un message, « Série supprimée — Annuler ». Il faut dire si les deux instantanés sont mutuellement exclusifs, quel texte est affiché et à quel instantané `Annuler` s'applique.

### C13 — AD-23 se contredit

Ses « Prevents » excluent « deux règles de dérivation (Feuille, Phrase, synthèses) ». Sa règle laisse pourtant la Phrase et `formatExerciseRowSummary` garder leurs branches. Le mélange avec `UNSET` est `MIXED` pour `stopConditionOf` et sans phrase pour la Phrase. Il faut retirer cette exclusion ou dire quelle divergence est admise.

### C14 — Deux propriétaires de `sideMode` (AD-21)

`Activity.sideMode`, `SessionDraftExercise.sideMode` et `ActivityDefinition.sideMode` (`Session.ts:138`, `SessionDraft.ts:133`, `ActivityDefinition.ts:70`) doublent `executionParameters.sideMode`. L'indicateur de la Composition lit `activity.sideMode` (`CompositionScreen.tsx:1721`). La synchronisation n'existe qu'au `Terminer` de Séance (`ExerciseScreen.tsx:574`). AD-21 doit désigner la source (paramètres) et interdire toute écriture directe du scalaire.

### C15 — `phrases-276` : identifier les « cas bilatéraux » (AD-29)

Le test doit séparer les cas non bilatéraux, comparés à l'oracle, des cas bilatéraux, comparés à la fixture. Le critère de séparation (une valeur de `sideMode` dans l'entrée, ou un motif dans la phrase attendue) n'est pas écrit. Deux auteurs de test peuvent classer différemment un cas `UNILATERAL` dont la phrase mentionne un côté.

**Nombre d'autres constats : 15 (C1 à C15).**

---

## Récapitulatif des corrections proposées

| Paire ou constat | AD touché | Correction |
|---|---|---|
| P1 | nouvel AD-34 | `normalizeEffective` recopie `loadKg` et `workPhases`. Les transitions de l'uniforme suivent REV-02. Une seule fonction `workPhasesAvailable(draft)`. |
| P2 | AD-20 | Table des appels de `deriveSeriesDuration`. Liste vide : Cible gardée. `null` compte 0. Annulation recalculée. |
| P3 | AD-27 (ou nouvel AD-35) | `onFocus` seul ouvre. `flushKeyboardField()` synchrone avant toute autre transition. Cible = identité. Sortie neutre sans effet. `normalizeLoad` à la fermeture de la famille `keyboard` seulement. |
| P4 | AD-19 | `,` et `.` acceptés. Vide et illisible distingués. Un texte illisible ne modifie rien. |
| P5 | AD-23 | `lastNumberById` distinct de `targetsById`. `stopConditionOf` réservé aux variables. Rendu de `INCOMPLETE` défini. |
| P6 | AD-21 | Fin du forçage de `BY_SIDE` dans `normalizeEffective`, ou écart signalé. P3-10 limité à la première activation (arbitrage de Hermann). |
| C1 | AD-24 | État `cadenceOtherOpen`, ou valeur écrite par Autre. |
| C2 | AD-22 / AD-18 | Étapes dans l'Instantané v3, ou exclusion consignée. |
| C3 | AD-22 | Égalité sur la chaîne encodée. Retrait des espaces de chaque étape. Comptage unique. |
| C4 | AD-20 / AD-13 | Aucune tolérance pour une Cible dérivée. Champs de violation nommés. |
| C5 | AD-25 / AD-27 | `nextPhaseId = max(id) + 1`. Identités dans les surfaces. « Ligne disparue » étendue aux phases. |
| C6 | AD-24 / AD-26 | Propriétaire du rendu « 20 kg » et emplacement du `TextInput`. |
| C7 | AD-28 | Couche de rendu, pas d'`overflow: "hidden"`, recalcul après animation. |
| C8 | AD-18 | Littéral 2 dans `readV2` et `serializeV2`. |
| C9 | AD-19 | Avec et tout à 0 : violation, ou normalisation dans `validateForSave`. |
| C10 | AD-19 | Portée de `reactivateLoad`. |
| C11 | AD-29 | Insertion dans les gabarits sans valeur par série. |
| C12 | AD-25 | Un seul instantané de retrait, un message par nature. |
| C13 | AD-23 | « Prevents » corrigé. |
| C14 | AD-21 | `executionParameters.sideMode` seule source. |
| C15 | AD-29 | Critère « cas bilatéral » écrit. |

# FORMATS-MODALE-PARAMS-20261116 — Formats : entrée par la modale des paramètres d'exécution, retrait des « − » / « + »

## Identifiant et objectif

- **Mission :** FORMATS-MODALE-PARAMS-20261116. Elle complète FORMATS-TABLEAU-UNIQUE-20261115.
- **Objectif :** dans les Formats à tableau, la ligne sous le nom ouvre la modale des paramètres d'exécution, déjà développée pour la Composition. Cette modale devient l'entrée standard pour l'unité, le côté, la charge et le nombre de séries ou de tours. Les « − » / « + » des en-têtes sont retirés.
- **Sources :**
  - `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`, CE-FMT-02 §8 ;
  - registre ch07, « Formats — saisie par la modale des paramètres d’exécution (16/11/2026) ».
  - Ces deux textes sont sur `main`, commits `65df7eb9` et `6bbbc183`.

## Branche et commit de départ

- **Dépôt :** `C:\Dev\PRE10-SON`.
- **Branche :** `pre11-formats`, locale, non poussée.
- **Commit de départ :** `08817c92`. Il porte le rapport FORMATS-RECETTE-1611-B.
- **État au départ :** 102 entrées non commitées, issues des livraisons précédentes du lot. Elles étaient en attente de validation de Hermann.

## Périmètre demandé

1. **Nouveau mouvement :** « Paramètres à compléter » s'affiche en rouge sous le nom. Les valeurs du tableau restent désactivées jusqu'au choix de l'unité.
2. **Paramètres renseignés :** le texte passe en bleu. Il affiche l'unité (« rép. » ou « durée »), puis « · bilatéral » si l'option est activée. Rien n'est affiché sur la charge.
3. **Zones tactiles :**
   - le nom et la ligne dessous ouvrent la modale ;
   - la photo ouvre la Fiche du mouvement ;
   - les cases du tableau restent éditables directement.
4. **En-têtes :** les « − » / « + » sont retirés. Le triangle de défilement est conservé, à la place du « + », en 8 × 13 pt.
5. **Charge :** elle ne s'active et ne se retire que dans la modale.
6. **Écarts de la modale :**
   - (a) un Buy-in peut passer de séries fixes à séries variables ;
   - (b) un exercice en boucle affiche « tours identiques / variables ».
7. Complément de Hermann pendant la mission, recopié : « La modale ne doit pas fixer la charge à 0,25 kg quand on choisit « Avec », mais un champ avec un trait horizon et un fond rouge » ; portée confirmée par Hermann (question posée) : **partout** où la modale s'ouvre (Formats, Composition, fiche Mouvement du Catalogue).
8. Seconde précision de Hermann, recopiée : « la modale des paramètres d’exécution doit être la même qu’on l’ouvre de la composition de séance ou de l’écran d’un format, les effets de changement de rôle sont aussi identiques » ; pour la Récupération : « Je parle de la modale des paramètres d’exécution ». Constat d'origine : depuis un For time, la modale n'avait ni la ligne des rôles ni la récupération.
- **PRESERVE :**
  - le reste des écrans de Formats ;
  - la Composition ;
  - le moteur de séance ;
  - le modèle de données ;
  - les cellules du tableau et leurs colonnes.

## Périmètre réellement traité

Les six points sont traités, pour tous les Formats à tableau :

- For time ;
- Tabata, 30/30 ;
- Renforcement, À l'échec ;
- Progression, EMOM, Superset ;
- Death by ;
- AMRAP.

Avant cette mission, seul le For time ouvrait la modale (FT-3).

### Liste PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE (vérifié inchangé) :**
  - les cellules du tableau (`TableCell`, `DimensionCell`, `ValueColumn`) et leurs colonnes ;
  - le cadre des paramètres ;
  - le Déroulé ;
  - l'appui long et le glisser « Supprimer » ;
  - la Composition (`CompositionScreen`, `formatSheetContext.ts` : non modifiés) ;
  - le moteur d'exécution ;
  - le modèle de données (`formatModels.ts` non modifié ; `buildModelElements` réutilisé tel quel) ;
  - la modale elle-même. Seul ajout : un libellé facultatif (`seriesWording`). Sa validation et ses règles sont inchangées.
- **CHANGE :**
  - la ligne de mouvement (`NameRow`) ;
  - l'en-tête des blocs à séries (`SeriesBlock`) ;
  - l'ouverture et le retour de la modale (`FormatModelScreen.parametersSheet`) ;
  - la relecture des valeurs du tableau (`sheetValuesOf`) ;
  - les libellés « tours ».
- **FORBIDDEN (respecté) :**
  - aucun nouvel écran ;
  - aucune nouvelle primitive ;
  - aucun remplacement de composant natif ;
  - aucun changement des cellules.

## Constats

- **Modale pour les autres Formats.** Elle s'ouvre sur l'Exercice que le Format produirait pour ce mouvement. Cet Exercice est construit par `buildModelElements` dans une Composition provisoire, jamais enregistrée. Ses réglages de Format (Intervalle, Incrément, Durée) sont ceux que la Composition présente (`formatSheetContextOf`), sans la ligne Rôle, puisque le bloc fixe le rôle.
- **✓ de la modale.** Comme dans la Composition, il demande des objectifs complets. Pour un nouveau mouvement, il faut donc saisir l'unité et les objectifs ensemble dans la modale.
- **Unité.** La modale propose toujours Répétitions et Durée : on ne peut pas y masquer une option sans nouvelle primitive. Les règles d'unité du Format restent contrôlées au ✓ :
  - Tabata et 30/30 : Durée imposée ;
  - For time et AMRAP : au moins un exercice en Répétitions.
- **Charge (point 7).** Avant : « Avec » posait 0,25 kg (RM-239, première activation et réactivation), et une charge toute à 0 repassait d'elle-même à « Sans » à la fermeture du clavier.
  - Maintenant, « Avec » sans charge positive mémorisée laisse la charge à renseigner : « — » sur fond rouge, dans le champ commun comme dans chaque case des séries.
  - Le ✓ reste indisponible jusqu'à la saisie (violation `REQUIRED loadKg`).
  - Vider le champ ou y taper 0 laisse la charge à renseigner ; seul « Sans » retire la charge.
  - Un 0 parmi des séries chargées reste « sans charge » pour sa série (Δ19, inchangé).
- **Lexique.** La règle PRE-4 interdit « Tour » dans la modale. L'exception est limitée aux quatre libellés `roundCount*`, demandés par Hermann.

## Preuves et tests

- **TypeScript :** `npx tsc --noEmit -p .` → 0 erreur.
- **Lint des fichiers touchés :** aucune nouvelle alerte. Il reste une erreur `react-hooks/refs` à `FormatModelScreen.c3.test.tsx:108`, sur une ligne non modifiée et déjà présente dans `HEAD`.
- **Tests ciblés :** `FormatModelScreen.tableauUnique.test.tsx`, `FormatModelScreen.c3.test.tsx` et `ExecutionParametersSheet.test.tsx` → 339 réussis, 32 ignorés (déjà ignorés avant), 0 échec.
- **Suite complète** (`npx jest`, après le point 8) : 366 suites, 5 862 tests réussis, 32 ignorés, 0 échec. Après le point 7 : 366 suites, 5 861 tests réussis, 32 ignorés (les mêmes qu'avant), 0 échec. Avant le point 7, même résultat.
- **Tests adaptés à la nouvelle règle de charge (point 7)** : `exerciseLoad.test.ts`, `ExecutionParametersDraft.test.ts` (6 tests), `useSheetKeyboard.test.ts` et `ExecutionParametersSheet.test.tsx` (7 tests). Ils vérifient :
  - « — » sur fond rouge, dans le champ commun et dans les cellules ;
  - le ✓ indisponible tant que la charge manque ;
  - le champ vidé, qui reste « Avec » ;
  - « Sans », qui retire la charge.
  - Les anciennes attentes (0,25 kg, passage automatique à Sans) sont marquées remplacées dans les tests.
- **Tests réécrits.** Ils pilotaient les « − / + », le popover d'unité et « +kg ». Ils passent maintenant par la modale. Ils couvrent :
  - « Paramètres à compléter » en rouge, puis l'unité en bleu ;
  - « · bilatéral » ;
  - la charge activée et retirée dans la modale ;
  - le nombre de séries réglé dans la modale ;
  - le triangle 8 × 13 ;
  - l'écart (a) : Buy-in à deux séries, « Variables » disponible ;
  - l'écart (b) : « 3 tours variables » ;
  - la Durée refusée, avec le message court ;
  - l'enregistrement et la réouverture.
- **Bundle servi.** Le Metro LAN `http://192.168.0.16:8085` sert le nouveau code : le bundle contient `bilateralSuffix`, `roundCountVariableSingular` et `sheetValuesOf`.

## Point 8 — modale identique à celle de la Composition

- **Cause.** C'était déjà le même composant (`ExecutionParametersSheet`). Mais l'écran du Format lui passait d'autres réglages que la carte de la Composition : pas de ligne Rôle (retirée volontairement), pas de Récupération, un nombre de séries hérité calculé autrement. C'était un choix de ma part, non signalé.
- **Correction.** L'écran du Format ouvre la modale exactement comme `useMovementExerciseIntake` :
  - sur l'Exercice produit, placé dans une Composition provisoire ;
  - `inheritsCircuitSeriesCount`, `formatSheetContextOf` (ligne Rôle comprise), `recovery`, et `seriesWordingOf` (nouvelle fonction commune, utilisée aussi par la Composition).
- **Au ✓, la Composition provisoire modifiée est relue :**
  - un Rôle changé déplace le mouvement dans le bloc correspondant (`setMemberRole`, mêmes ajustements de séries et mêmes annonces de pertes) ;
  - la Récupération saisie devient celle du mouvement (`MovementValues.recovery`), et prime sur celle que le Format calcule (`buildModelElements`) ;
  - Intervalle, Incrément, Durée et borne For time rejoignent les réglages du Format.
- **Conséquences visibles :**
  - Superset et boucle du For time : le nombre de tours est imposé dans la modale, comme dans la Composition ;
  - un For time à un seul mouvement s'ouvre sur un exercice seul, à une série par tour ;
  - « tours identiques / variables » s'affiche aussi dans la Composition.
- **Test ajouté.** For time : passer un exercice de la boucle en Buy-out le déplace dans ce bloc ; une Récupération de 45″ est enregistrée.

## Point 9 — recette iPhone du 16/11/2026 (après-midi) : KO et « Autres constats » a à c

Résultats relus dans le cahier en ligne (version 122). OK : `mp-rouge`, `mp-bleu`, `mp-bilateral`, `mp-zone`, `mp-plus-moins`, `mp-modale-identique`, `mp-buyin-variables`, `mp-boucle-tours`, `mp-objectifs-requis` (interprétation (v) confirmée). KO et constats, recopiés, puis traitement :

| Écart | Note de Hermann (recopiée) | Correction |
|---|---|---|
| `mp-charge-vide` | « Charge avec - pas de liseré rouge » | Le champ de la charge commune, placé dans l'option « Avec », n'était pas signalé : sa couleur de champ actif (clavier ouvert dès « Avec ») recouvrait le fond rouge de l'option. Désormais `KeyboardField` garde le rouge (`invalidWhileEmpty`) tant que rien n'est tapé, clavier ouvert compris ; au premier chiffre, couleur du champ actif. « — » en texte primaire. Même règle pour les cases Charge des séries variables. |
| `mp-charge` | « Incrément :il ne faut pas de valeur par défaut dans la modale » | La Composition provisoire portait l'incrément de repli (Death by + 1, AMRAP 0). Quand l'Incrément est vide au tableau, l'écran du Format retire ce repli et marque la ligne à renseigner (`incrementRequired`) : « — » sur fond rouge, ✓ indisponible jusqu'à la saisie. Défaut trouvé par le test ajouté : une saisie égale au repli (1) n'était pas appliquée ; `scalarValueOf` rend désormais `null` pour un Incrément à renseigner. |
| `mp-duree-refusee` | « Les mouvements en buy-in et buy out doivent être exclus de cette vérification. Il faut au moins un exercice en répétition sur les exercices en boucle. » | For time comme AMRAP : seuls les exercices de Rôle Tour comptent — écran du Format (`lastRepetitionsLocked`, `allowedModes`), Composition (`isLastRepetitionsMember` : verrou de suppression et de sortie) et validité (`NO_REPETITIONS`). |
| `mp-triangle` | « Le triangle doit être centré verticalement par rapport au texte, il doit s’inverser et changer de côté (avant la première colonne) quand on arrive à l dernière colonne. » | Triangle centré sur les titres (`top` 9 au lieu de 7,5 ; milieu à 15,5 comme le texte). À la dernière colonne (défilement suivi par `onScroll` et `onContentSizeChange`), le triangle de droite disparaît et un triangle pointant à gauche apparaît avant la première colonne visible. |
| Constat a (1) | « la condition d'arrêt devrait être "à l'objectif". Alors que la il n'y a qu'un trait horizontal. » | Séries variables sans aucune cible renseignée : « À l'objectif » en lecture seule au lieu de « — », partout où la modale s'ouvre (interprétation (aa)). |
| Constat a (2) | « Les champs de valeur de la colonne Pause devraient être désactivés, avec un trait horizontal, comme la colonne Charge. » | For time : chaque case Pause du tableau des séries est un tiret gris non saisissable, hors de l'ordre Précédent / Suivant (interprétation (ab) : For time seulement). |
| Constat a (3) | « Tours identiques : un objectif de durée qui est inférieur à la somme de la durée des phases affiche un texte en rouge, et bloque la validation. Retirer le texte rouge et afficher la même fenêtre de message qui propose un arrondi […] » | `phaseCycleIssues` range une série plus courte que le motif parmi les arrondis à proposer : même alerte native, avec le seul choix « Arrondir à » la durée du motif (aucun multiple inférieur non nul, interprétation (ac)). Plus de message rouge ni de ✓ bloqué. |
| Constat b | « Progression : appuyer sur le mode d'exécution fait passer la condition d'arrêt à un trait "-" » | Même cause et même correction que le constat a (1) : changer d'unité vide les cibles des séries variables. |
| Constat c | « Death by - Il faut le même principe d'affichage du texte "Paramètres à compléter" de la modale des paramètres d'exécution. » | Death by : « Paramètres à compléter » en rouge sous le nom tant que le Départ ou l'Incrément manque (`RowKit.parametersMissing`) ; l'unité en bleu ensuite. |

- **Constat d** (mission « écran d'exécution du For time — exercices en durée, « + Tour », Arrêt / Pause désactivé ») : mission distincte, arrêtée à l'étape 1 (état des lieux) comme elle le demande. Rapport : `.github/orchestration/reports/2026-11-16_FORTIME-EXEC-DUREE-20261116.md`.
- **Tests ajoutés ou adaptés :**
  - `FormatModelScreen.tableauUnique.test.tsx` : triangle centré et inversé ; Death by « Paramètres à compléter » puis Incrément « — » rouge dans la modale, saisi ; aide `fillTargets` qui renseigne un Incrément vide ;
  - `FormatModelScreen.c3.test.tsx` : colonne Pause du For time (tirets) et « À l'objectif » ;
  - `formatModels.reprise0411.test.ts`, `circuitRoles.reprise0411.test.ts` : buy-in et buy-out exclus (écran du Format, Composition, validité) ;
  - remplacés et marqués comme tels : `ExecutionParametersSheet.test.tsx` (« — » de la condition d'arrêt ; charge « Avec » sans fond), `ExecutionParametersSheet.phases.test.tsx` et `phaseCycleFit.test.ts` (durée plus courte que le motif).
- **Suite complète** (`npx jest`, après le point 9) : 366 suites, 5 865 tests réussis, 32 ignorés (les mêmes qu'avant), 0 échec ; `tsc --noEmit` propre ; ESLint propre sur les fichiers modifiés au point 9.
- **Documentation (classe B) :** spec du lot, point 25 du §5 et §7 (aa) à (ad). Sur `main`, correctif préparé, non appliqué : `_bmad-output/pre11/integration-documentaire-main-2026-11-16d.patch`.
  - `git apply --cached --check` passe sur `origin/main` `baed622f` (main a avancé : `…-16c.patch` n'y passait plus au chapitre 13, conflit résolu en gardant la formulation de `main` pour la zone de texte).
  - Il remplace `…-16c.patch` et couvre : registre ch07 (entrée « Recette de la modale des paramètres », D-514), chapitre 10 (FMT-30 aux deux endroits, RM-249), chapitre 13 (CE-FMT-02, « Boucle du For time ») et le document des Formats (« Boucle du For time »).

## Point 10 — KO resté ouvert : r16b-deroule-hauteur (Déroulé)

- **Constat.** En relisant tout le cahier avant la fusion (ordre décidé par Hermann : terminer la recette, valider, committer, fusionner, puis la mission d), une ligne KO du matin n'avait jamais été traitée. Toutes les autres sections du lot sont OK (Formats à tableau, For time, exécution du For time, corrections 1 à 4).
- **Note de Hermann, recopiée :** « AMRAP, déroulé : - buy in, la largeur du Buy In doit être identique aux autres cadres - les dernières cases "n" doivent être plus haute que l'avant dernière (idem pour le format à l'échec) ».
- **Cause.** Le buy-in de l'AMRAP pesait 2,5 cases. Une case « n » sans volume connu gardait la pleine hauteur, comme le plus grand rang chiffré : les deux étaient égales.
- **Correction (`src/domain/sessions/formatTimeline.ts`) :**
  - AMRAP : le buy-in pèse une case ;
  - nombre ouvert qui croît (Death by, AMRAP à volume croissant) : `scaleRepetitions(…, openTop)` ramène les cases chiffrées à 0,8 de leur hauteur et laisse « n » à pleine hauteur ; « n » dépasse donc toujours la case qui la précède.
- **Interprétations (spec, point 27) :**
  - « le format à l'échec » est lu comme le Death by ;
  - l'AMRAP à volume constant garde « n » à la hauteur de son volume ;
  - le buy-in du For time n'est pas visé.
- **Tests :** `formatTimeline.recette1611.test.ts` (Death by adapté et marqué remplacé ; nouveau test AMRAP).
  - Suite complète : 366 suites, 5 866 tests réussis, 32 ignorés, 0 échec ; `tsc` propre.
  - ESLint : aucune erreur ; un avertissement déjà présent avant le correctif (`openGeneric` inutilisé), laissé tel quel.
- **Documentation :** `_bmad-output/pre11/integration-documentaire-main-2026-11-16e.patch`, préparé et non appliqué.
  - `git apply --cached --check` passe sur `baed622f`.
  - Il reprend `…-16d.patch` et ajoute le registre ch07 « Déroulé de l'AMRAP et du Death by » et une puce CE-FMT-02 au chapitre 13.
- **Cahier :** version 124, ligne `mq-deroule-n`.

## Hypothèses non démontrées

- La zone tactile du nom (toute la hauteur de la ligne, jusqu'au tableau) n'a pas été vérifiée au doigt. Seul un test sur iPhone peut le confirmer.
- La position et la taille du triangle (8 × 13, centré à la place du « + ») ne sont vérifiées que par leurs styles, pas visuellement. Point 9 : la position du triangle inversé (6 à gauche de la première colonne visible) et le suivi du défilement natif ne sont vérifiés que par les tests.

## Modifications réalisées

- **`src/features/sessions/ForTimeBlocks.tsx` :**
  - la ligne sous le nom affiche « Paramètres à compléter » en rouge, ou l'unité et « · bilatéral » en bleu (`parametersLine`) ;
  - le nom et cette ligne forment une seule zone qui ouvre la modale ;
  - les éléments suivants sont retirés : `UnitMenu` (popover d'unité), `ChargeToggle` sous le nom, `Glyph` « − / + » ;
  - le triangle est en 8 × 13 à la place du « + » ;
  - `RowKit` est allégé : `onUnit`, `onCharge`, `allowedUnits` et `fixedUnit` sont retirés.
- **`src/features/sessions/FormatModelScreen.tsx` :**
  - `parametersSheet` remplace `forTimeParametersSheet` et couvre tous les Formats ;
  - For time : séries du buy-in et du buy-out réglables dans la modale, ce qui corrige l'écart (a) ; « tours » en boucle, ce qui corrige l'écart (b) ;
  - autres Formats : Exercice produit, réglages de Format de la Composition, et retour vers le tableau et les réponses (nombre de séries ou de tours, Intervalle, Incrément, Durée, Départ du Death by à un mouvement) ;
  - les unités admises sont contrôlées au ✓ (`allowedUnitsOf`), avec le message court existant ;
  - `addLoad` et le passage des « − / + » sont retirés.
- **`src/domain/sessions/formatReedit.ts` :** ajout de `sheetValuesOf`, qui relit les valeurs du tableau dans les paramètres validés par la même lecture que la réédition d'un Circuit.
- **`src/features/activities/ExecutionParametersSheet.tsx` :**
  - ajout de la propriété facultative `seriesWording` (`"rounds"` : « n tours identiques / variables ») ;
  - point 7 : une charge à renseigner s'affiche « — » sur fond rouge (champ commun : option « Avec » signalée `invalid` ; cellules des séries : `invalid`), annoncée « aucune valeur ».
- **`src/domain/activities/exerciseLoad.ts` (point 7) :**
  - `reactivateLoad` ne pose plus 0,25 kg ;
  - ajout de `loadToFill` (« Avec » sans charge positive) ;
  - `REACTIVATED_LOAD_KG` est retiré.
- **`src/domain/activities/ExecutionParametersDraft.ts` (point 7) :**
  - `setLoadEnabled` restaure les valeurs telles quelles ;
  - `normalizeDraftLoad` ne repasse plus à « Sans » ;
  - `sheetDraftResult` bloque le ✓ tant que la charge est à renseigner.
- **Libellés :**
  - `src/shared/i18n/index.ts` : `roundCount*` ;
  - `src/shared/i18n/resources/fr.ts` : `parametersToComplete`, `bilateralSuffix`.
- **Tests :** `FormatModelScreen.tableauUnique.test.tsx`, `FormatModelScreen.c3.test.tsx` et `ExecutionParametersSheet.test.tsx` (exception de lexique).

### Synchronisation code / documentation

- **Classe B.** La décision du 16/11/2026 sur la modale est déjà écrite sur `main` (`65df7eb9`, `6bbbc183`). Le point 7 (charge à renseigner) est une nouvelle décision. Le correctif remplace dans `main` :
  - RM-239 (chapitre 10) : « Zéro », « Première activation » et « Réactivation après Sans » ;
  - la ligne Charge de la Feuille des paramètres (chapitre 13) ;
  - il ajoute une entrée au registre ch07, « Charge à renseigner dans la modale ».
- **Ce qu'il restait à écrire sur `main` :**
  - marquer remplacées la charge « (+ kg) / (− kg) » de la colonne Charge et des blocs du For time ;
  - marquer remplacée la seconde ligne « (rép., ± kg) » du For time ;
  - noter la correction des deux écarts de la modale et mes interprétations (ch13 CE-FMT-02 §8 ; ch07 « Mise en œuvre »).
- **Correctif préparé, non appliqué :** `_bmad-output/pre11/integration-documentaire-main-2026-11-16c.patch`.
  - `git apply --cached --check` passe sur `origin/main` `6bbbc183`.
  - Il couvre les chapitres 07, 10 et 13.
  - Il regroupe et remplace les correctifs `…-16.patch` et `…-16b.patch`, qui ne s'appliquent plus sur `6bbbc183`.
  - Les ajouts du matin devenus caducs en sont retirés : « durée » en texte simple au Tabata, et le focus après le popover d'unité.
- **Spec du lot :** `_bmad-output/pre11/spec-pre11-formats.md`, point 24 (règles recopiées) et §7 (u) à (z) (interprétations).

## Éléments non corrigés ou hors périmètre

- **Constat a de la seconde recette du 16/11** (rouvrir un Format en exercice unique par glisser gauche) : reporté par Hermann.
- **Effacement de la charge à la fermeture du clavier.** Le retrait automatique d'une charge vide quand le clavier se ferme (Complément du 5 novembre, §9) est conservé tel quel.
- **Interprétations à confirmer par Hermann :** spec §7 (w), puis (aa) à (ad) du point 9.
  - (v) confirmée (cahier, `mp-objectifs-requis` OK).
  - (w) La modale ne masque pas une Durée refusée ; le refus est annoncé par un message.
  - (x) est réglé par le point 7.
  - (aa) « À l'objectif » sans série renseignée, partout ; (ab) colonne Pause désactivée en For time seulement ; (ac) une durée plus courte que le motif ne propose que l'arrondi au motif ; (ad) l'Incrément de la modale n'est à renseigner que s'il est vide au tableau.

## Vérifications restant à faire sur l'appareil

Cahier en ligne, version 123, section « fmt-modale-1611b » (9 lignes `mq-*`, point 9). Version 122, section « fmt-modale-1611 » (13 lignes `mp-*`, dont `mp-charge-vide` pour le point 7 et `mp-modale-identique` pour le point 8, à vérifier aussi dans la Composition et le Catalogue) : https://claude.ai/artifact/Mp9Tu1rPiRdfebmKfpf8Tq

À tester sur le serveur `http://192.168.0.16:8085`, après « Reload JS ».

## Fichiers modifiés par cette mission

- `src/domain/activities/exerciseLoad.ts`
- `src/domain/activities/ExecutionParametersDraft.ts`
- `src/domain/activities/__tests__/exerciseLoad.test.ts`
- `src/domain/activities/__tests__/ExecutionParametersDraft.test.ts`
- `src/features/activities/__tests__/useSheetKeyboard.test.ts`
- `src/domain/sessions/formatReedit.ts`
- `src/domain/sessions/formatModels.ts` (point 8 : `recovery`)
- `src/features/sessions/formatSheetContext.ts` (point 8 : `seriesWordingOf`)
- `src/features/sessions/useMovementExerciseIntake.tsx` (point 8 : décompte en tours dans la Composition)
- `src/features/activities/ExecutionParametersSheet.tsx`
- `src/features/activities/__tests__/ExecutionParametersSheet.test.tsx`
- `src/features/sessions/ForTimeBlocks.tsx`
- `src/features/sessions/FormatModelScreen.tsx`
- `src/features/sessions/__tests__/FormatModelScreen.c3.test.tsx`
- `src/features/sessions/__tests__/FormatModelScreen.tableauUnique.test.tsx`
- `src/shared/i18n/index.ts`
- `src/shared/i18n/resources/fr.ts`
- Point 9 : `src/features/activities/KeyboardField.tsx`, `src/features/activities/FormatSettingsFrame.tsx`, `src/domain/sessions/circuitRoles.ts`, `src/domain/sessions/configurationValidity.ts`, `src/domain/activities/phaseCycleFit.ts`, et les tests `src/features/activities/__tests__/ExecutionParametersSheet.phases.test.tsx`, `src/domain/activities/__tests__/phaseCycleFit.test.ts`, `src/domain/sessions/__tests__/formatModels.reprise0411.test.ts`, `src/domain/sessions/__tests__/circuitRoles.reprise0411.test.ts` (en plus des fichiers déjà listés, modifiés de nouveau)
- `_bmad-output/pre11/integration-documentaire-main-2026-11-16d.patch` (nouveau, point 9 ; remplace `…-16c.patch`)
- Point 10 : `src/domain/sessions/formatTimeline.ts`, `src/domain/sessions/__tests__/formatTimeline.recette1611.test.ts`, `_bmad-output/pre11/integration-documentaire-main-2026-11-16e.patch` (nouveau ; remplace `…-16d.patch`)
- `_bmad-output/pre11/spec-pre11-formats.md`
- `_bmad-output/pre11/integration-documentaire-main-2026-11-16c.patch` (nouveau)
- `.github/orchestration/reports/2026-11-16_FORMATS-MODALE-PARAMS-20261116.md` (ce rapport)

## Commit final

- **Commit :** le commit qui contient ce rapport, et lui seul. Son hash est donné dans le compte rendu de clôture : un fichier ne peut pas contenir le hash de son propre commit.
- **Code non commité.** Consigne de Hermann : « Ne commite pas sans validation ». Le code reste dans l'arbre de travail, en attente de validation.

## État Git

- **Branche :** `pre11-formats`, locale, non poussée. Le commit du rapport suit `08817c92` ; point 9 : suit `1971d1c6`.
- **Code non commité :** 109 entrées avant le point 9, plus les fichiers du point 9. Ce sont les livraisons précédentes du lot plus celle-ci. Elles attendent la validation de Hermann.
- **Metro LAN `http://192.168.0.16:8085` :** en marche ; il sert le nouveau code.

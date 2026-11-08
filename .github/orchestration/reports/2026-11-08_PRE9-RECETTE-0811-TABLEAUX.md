# PRE9-RECETTE-0811-TABLEAUX — tableaux des récapitulatifs de Format (spécification de Hermann du 08/11/2026)

## Identifiant et objectif

- Mission : PRE9-RECETTE-0811-TABLEAUX (sous-agent ; la session principale intègre et committe).
- Objectif : appliquer exactement les deux spécifications de présentation de Hermann du 08/11/2026 aux tableaux du récapitulatif d'un Format — A « séries en colonnes » (référence EMOM, Figma `8624:30392`) et B « paramètres en colonnes » (référence AMRAP, Figma `8624:30521`) — ainsi que les notes de recette b-amrap-table et b-emom-table.

## Branche et commit de départ

- Branche : `feat/pre9-catalogues-cartes-badge-20261106`.
- Commit de départ : `5d5a5ec0`.

## Périmètre demandé

- `src/features/sessions/FormatTables.tsx` (tableaux), `FormatModelScreen.tsx` (récapitulatif, paramètres d'exécution, Déroulé uniquement, par petites modifications).
- Tests Jest, `tsc`, `eslint`.
- Documentation (classe B) : `docs/KODJO-Formats-entrainement-2026-11-02.md` et registre ch07 (spécification recopiée mot pour mot).
- Note b-emom-table : test figeant les positions, analyse historique Git.

## Périmètre réellement traité

Tout le périmètre ci-dessus. Partie C du relevé (`constats.json`, en-têtes de Circuit flottants dans la Composition) : hors périmètre, non traitée.

## Quels formats utilisent quel tableau (vérifié dans le code)

- `SeriesTable` (« séries en colonnes ») : EMOM, Progression, For time, Superset.
- Tableaux « paramètres en colonnes » : `AmrapTable` (AMRAP), `DeathByTable` (Death by à plusieurs mouvements, aussi au questionnaire), `ObjectivePauseTable` (Tabata, 30/30, Renforcement, À l'échec à plusieurs mouvements).

## Constats

1. Les tableaux utilisaient des largeurs mesurées (`MIN_COLUMN_WIDTH = 56`, `MIN_UNIT_COLUMN_WIDTH = 32`, `MAX_COLUMN_WIDTH = 26`, `UNIT_COLUMN_GAP = 4`, `COLUMN_GAP = 8`), des lignes de 36, une colonne Unité (séries) et une colonne Charge (tableaux à une ligne par mouvement), des cellules à fond blanc, et des durées « 1 min 30 ».
2. **Historique de l'écart nom / charge (b-emom-table)** — analyse `git log -S` sur `FormatTables.tsx` :
   - `52c19e28` (05/11) : ligne `4×2 + 26 + 16/14`, charge en ligne de 16.
   - `8a5befaf` (06/11, r-series) : **état compact correct** — ligne constante de 46 avec ou sans charge (`SERIES_ROW_PADDING 4`, `SERIES_LINE_HEIGHT 26`, `SERIES_SECOND_LINE_RISE 4`, charge `cellSmall` transparente en 11, hauteur 16).
   - `c8fe2857` (07/11, remarque e « champ de valeur standard ») : **introduction de la régression** — la charge prend le champ standard (cadre blanc de 24), `SERIES_LINE_GAP 4` ajouté, `SERIES_ROW_PADDING 6` ; ligne de 52 sans charge, 64 avec charge ; l'étiquette « (rép, +kg) » descend d'environ 8 (4 d'écart + centrage sur 24) quand la charge apparaît.
   - `d08cbe6b`, `5d5a5ec0` : inchangé sur ce point (détection en recette le 08/11).
   - Attribution : démontrée par les sources (valeurs des constantes à chaque commit).
3. Figma (lecture seule, `get_design_context` des deux nœuds) — écarts entre la maquette et la spécification écrite (la spécification prime, principe de Hermann) :
   - AMRAP `8624:30521` : en-tête « Par tour » aligné à droite (x = 299) et valeurs Objectif / Par tour / charge alignées à droite (227,5 / 286,5 / 238) ; la spécification B les centre dans leur colonne de 44 → centrage appliqué.
   - EMOM `8624:30392` : le cadre du tableau est décalé de 8 (`left-[8px]`) avec des textes à x = 8 dans un conteneur de 370 ; les positions absolues résultantes (16 du bord du cadre) concordent avec la spécification.
   - Figma mesure les positions sous la bordure haute de 1 (nom à 5,5, cellule à 9 / 1,5) ; la spécification les donne depuis le haut de la ligne (6,5, 10 / 2,5) : concordant.
   - Repères de temps du Déroulé en opacité 60 % dans Figma ; la spécification ne mentionne pas l'opacité : existant conservé.
   - Couleur grisée Max : spécification « #BFC2CC, comme dans l'existant » ; l'existant était #B4B8C2 (`valueFieldColors.disabled`). Valeur écrite appliquée (#BFC2CC) dans les tableaux seulement.

## Modifications réalisées

### `src/features/sessions/FormatTables.tsx`
- `TABLE_LAYOUT` (exporté) : colonnes 44, écart 12, marges 16, écart nom 12, en-tête 28 (texte à 6,5), lignes 44, marge basse 3,5, nom 6,5, étiquette 24,5, cellule 10 / 2,5 (hauteur 24), charge 24,5, radio 12. Anciennes constantes supprimées, valeurs conservées en commentaire « [Remplacé le 08/11/2026 par la spécification de Hermann …] ».
- `formatPrimeDuration` : M′SS″ / S″ (U+2032 / U+2033).
- `TableCell` dans un tableau : 44 × 24, marge horizontale 0, sans fond ; vide « — » en `colors.danger` sur `colors.dangerSurface` ; charge `load` en Regular 11, hauteur 13, sans cadre ; grisé Max #BFC2CC ; mesure de largeur seulement si `onMeasure` est fourni.
- Nouveaux éléments communs : `HeadCell`, `NameBlock`, `UnitTag` (étiquette « (rép., +kg) »), `ValueSlot`, `ChargeValue`, `MovementTableHeader`, `MovementLine`.
- `AmrapTable` : Objectif | (Par tour) | Max, plus de colonne Charge, charge sous l'Objectif après « +kg », valeurs sans unité, radio Max centré à y = 12.
- `DeathByTable`, `ObjectivePauseTable` : présentation B (charge sous la première colonne, valeurs sans unité), comportement de la charge t-coche-direct inchangé (voir « Correction demandée par la session principale »).
- `SeriesTable` : plus de colonne Unité, lignes de 44 constantes, séparateur en haut de chaque ligne, colonnes de 44 / pas de 56 dans la zone défilante (écart de 12 avec le nom inclus), charge sans cadre.
- `tableCellOrder` : dans les tableaux à une ligne par mouvement, seule une charge affichée est parcourue par Suivant (ordre Objectif > Pause > Charge conservé).

### `src/features/sessions/FormatModelScreen.tsx` (petites modifications Edit, zones récapitulatif / paramètres / Déroulé)
- Durées M′SS″ au récapitulatif (`formatDuration` selon l'étape) : lignes de durée, Durée totale, Death by à un mouvement, message EMOM, repère de fin du Déroulé ; `modelDurationText` et `genericDuration` reçoivent le format.
- `Panel summary` + `SummaryRowsContext` : lignes de paramètres de 40 + séparateur de 1 au récapitulatif (rogné sous la dernière) ; questionnaire inchangé.
- Champ « Exécution » : hauteur 26, rayon 5, fond #5F60EE.
- Cadre du tableau : plus de marge verticale de 4.
- Légende du Déroulé : nom en 13 (ligne 16), écart de 16.

### `src/shared/i18n/resources/fr.ts`
- `repetitionsUnitShort` « rép » → « rép. » ; `addLoadShort` « +kg) » → « +kg » ; `removeLoadShort` « −kg) » → « −kg » (parenthèse rendue à part, en bleu).

### Tests
- Nouveau `src/features/sessions/__tests__/formats.recette0811.test.tsx` (12 tests) : format M′SS″ ; constantes 44 / 12 / 16 / 28 / 44 / 3,5 et positions 198-242-254-298-310-354 ; en-tête (Medium 12, y = 6,5) ; séparateurs #DEE3E5 en haut ; étiquette (mot gris, ±kg bleu) ; cellules 44 × 24 sans fond ; « — » rouge #D92D20 sur #FFF1F0 ; **positions figées des deux états** (ligne 44 identique avec et sans charge, nom 6,5 et étiquette 24,5 immobiles, cellule 10 → 2,5, charge 24,5 sans cadre, écart de 2 entre texte de la valeur et charge) ; AMRAP (colonnes, #BFC2CC, radio 12) ; Death by « Avec charge » (charge toujours présente, cadre orange si vide, pas de « +kg », positions) ; Tabata. `formats.recette0611.test.tsx` vérifie de nouveau t-coche-direct (Tabata : pas de « +kg », trait dans un cadre orange, saisie qui applique la charge ; Suivant parcourt toujours la charge pour Tabata / Death by, charge affichée seulement pour l'AMRAP).
- `FormatModelScreen.c3.test.tsx` : nouveau test du récapitulatif EMOM (1′00″, M′SS″ pour Durée totale et fin du Déroulé, lignes de 41 avec séparateur, cadre sans marge, marge basse 3,5) ; attentes mises à jour (« (rép., +kg) », Death by « 1 » / « + 1 », pause « 15″ »), anciennes valeurs annotées.
- `formats.recette0611.test.tsx` : tests des largeurs mesurées, de la colonne Charge et du défilement (60 / 8) remplacés par les valeurs de la spécification (44 / 12 / 56), anciennes formulations annotées.

### Documentation (classe B)
- `docs/KODJO-Formats-entrainement-2026-11-02.md` : §9.5 nouveau paragraphe « Spécification des tableaux du 08/11/2026 » ; formulations contraires annotées « [Remplacé le 08/11/2026 …] » (§7.4 tableau AMRAP, §7.6 table des correspondances, §7.7 colonnes Charge, §9.3 colonne Unité et durées, Superset, Death by unités, Tabata colonne Charge, EMOM colonne Unité).
- Registre ch07 : nouvelle section « Recette du 08/11/2026 — spécifications des tableaux » avec ligne de décision, **texte intégral des parties A et B recopié mot pour mot** (bloc citation, généré depuis `constats.json`), notes b-amrap-table et b-emom-table mot pour mot, classement, historique Git, points à confirmer.

## Preuves et tests (résultats exacts)

- `npx jest src/features/sessions/__tests__/formats src/features/sessions/__tests__/FormatModelScreen src/features/sessions/__tests__/formatKeyboard src/features/sessions/__tests__/FormatsWindow src/features/sessions/__tests__/CarrierDuration --testPathIgnorePatterns "\.claude" -w 2` → **Test Suites: 10 passed, 10 total ; Tests: 134 passed, 134 total** (après la correction).
  - Suites `formats*` et `FormatModelScreen*` : 8 suites, 120 tests, toutes vertes.
- `npx tsc --noEmit -p .` → aucune erreur.
- `npx eslint` sur `FormatTables.tsx`, `FormatModelScreen.tsx`, `fr.ts`, `formats.recette0811.test.tsx`, `formats.recette0611.test.tsx` → aucune erreur. `FormatModelScreen.c3.test.tsx` : 1 erreur `react-hooks/refs` (ligne 105, Harness) et 1 avertissement (`Alert` inutilisé, ligne 4), préexistants, hors de mes modifications.
- Pendant la mission, trois tests de `FormatModelScreen.c3` et trois de `r0711` ont échoué temporairement (mode catalogue, cartes, préchargement d'icônes) à cause des modifications concurrentes de l'autre agent ; ils passent au dernier passage.
- Aucun navigateur ni contrôle visuel automatique.

## Correction demandée par la session principale (même mission)

L'interprétation initiale n° 1 (« +kg » par mouvement étendu à Death by, Tabata, 30/30, Renforcement, À l'échec) est **retirée** : la spécification dit « Aucun comportement fonctionnel existant ne change » et t-coche-direct (06/11/2026) reste en vigueur pour ces tableaux. Mise en œuvre :
- pas de « +kg » ; étiquette sous le nom réduite à l'unité (« (rép.) », « (durée) ») ;
- avec « Avec charge », la charge est toujours présente sous la première colonne (Objectif ou Départ), toujours parcourue par Suivant, touchable comme avant ; renseignée : Regular 11 bleu sans cadre ; vide : trait « — » dans un cadre orange (`toVerifyColors.surface`) de 44 de large ; une saisie applique la charge (`loadOn`), une case vidée la retire (inchangé) ;
- lignes de 44 dans l'état « charge affichée » (cellules à 2,5, charge à 24,5) dès que « Avec charge » est actif ;
- `tableCellOrder` : ordre d'origine pour ces tableaux ; seule l'AMRAP ne parcourt qu'une charge affichée par « +kg ».
- « +kg » par mouvement : AMRAP, EMOM, Progression, For time, Superset.

## Recette iPhone du 08/11/2026 après-midi (sur `81a7036f`) — c-emom-recap, c-tabata-recap

Notes de Hermann recopiées mot pour mot au registre ch07 (« Recette du 08/11/2026 après-midi — tableaux », sous-section de la section de cette mission).

- **c-tabata-recap — « +kg » / « −kg » par mouvement** (décision B qui remplace t-coche-direct du 06/11 pour Tabata, 30/30, Renforcement, À l'échec, Death by) : `DeathByTable` et `ObjectivePauseTable` reprennent la grammaire de l'AMRAP — étiquette « (rép., +kg) », charge sous la première colonne seulement après « +kg » (`loadOn`), Regular 11 bleu sans cadre, « (—) » gris si vide, atteinte par Précédent / Suivant ; `tableCellOrder` ne parcourt qu'une charge affichée dans tous les tableaux à une ligne par mouvement. La variante « charge toujours présente, cadre orange » (`ChargeValue always`, style `tableChargePending`) est supprimée. Le cas à un mouvement (ligne Charge du cadre des paramètres, cadre orange) n'est pas touché.
- **AMRAP** : inchangé (« AMRAP : c'est comme c'est développé actuellement. ») — répond au point à confirmer n° 1 (« +kg » gardé).
- **Parenthèses en gris** (#595E66) dans les étiquettes de tous les tableaux (`UnitTag`) ; mot gris et ±kg bleu inchangés ; **virgule laissée en bleu — à confirmer**.
- **c-emom-recap — titre « Mouvement »** : écart **démontré** dans le code du tableau des séries. Le titre (`position: "absolute", left: 0`) était enfant direct de `seriesNamesHeader` (`paddingLeft: 16`) ; une position absolue part du bord du conteneur et ignore sa marge intérieure → titre à x = 0 du cadre, alors que les noms sont à x = 16 (le bloc du nom est dans le flux, après la marge, et le texte en absolu s'y place à 0). Le titre était donc décalé de 16 **vers la gauche** ; « pas correctement aligné à droite » s'explique par cet écart (il fallait le décaler vers la droite). Correction : titre placé dans une zone `flex: 1` au retrait de 16 (`seriesHeadName`). Les tableaux à une ligne par mouvement n'avaient pas l'écart (titre et noms dans `nameArea`, déjà au retrait de 16). Police : Inter Medium 12, inchangée. Jest ne mesure pas la mise en page : le test vérifie la structure (zone au retrait de 16, texte à `left: 0`) ; position réelle à confirmer sur iPhone.
- **c-emom-recap — charge au focus** : le champ de la charge avait 80 de large (zone de centrage) et le surlignage de saisie couvrait 80 ; il a maintenant 44 (largeur de la cellule) au repos comme au focus, centré dans la zone de 80. Risque : « (12,5 kg) » (environ 45 en Regular 11) peut être rogné — à vérifier sur iPhone.
- Tests : `formats.recette0611` (Tabata « +kg », ordre de Suivant), `formats.recette0811` (Death by « +kg » et positions, parenthèses grises, titre et charge de 44 au focus).
- Résultats : `npx jest src/features/sessions/__tests__/formats src/features/sessions/__tests__/FormatModelScreen --testPathIgnorePatterns "\.claude" -w 2` → **8 suites, 122 tests, tous passés** ; `npx tsc --noEmit` → aucune erreur ; `npx eslint` (FormatTables, tests 0611 / 0811) → aucune erreur.
- Documentation : ch07 (sous-section, annotations « [Remplacé le 08/11/2026 …] » sur t-coche-direct et sur la puce « Death by, Tabata… », point (4) tranché) ; Formats §7.7 et §9.5 (annotations, parenthèses grises).

## Recette iPhone du 08/11/2026 soir (sur `54026f53`) — charge rognée

Notes de Hermann (recopiées mot pour mot au registre ch07, « Recette du 08/11/2026 soir — charge rognée ») : e-emom-focus (KO) « 12,25 kg est rogné » ; e-tabata-kg (KO) « 12,25 kg est rogné ». OK : e-emom-titre, e-parentheses (virgule bleue acceptée — point à confirmer n° 8 tranché), c-emom-recap, c-tabata-recap.

- **Cause** : depuis c-emom-recap, le champ de la charge avait une largeur fixe de 44 (`width={TABLE_LAYOUT.columnWidth}`) ; « (12,25 kg) » (environ 50 en Regular 11) y était rogné au repos comme en saisie.
- **Correction (classe A)** — `TableCell` reçoit `fit` (charge de tableau) : style de tableau, largeur du texte par le mécanisme existant des pastilles de paramètres (texte invisible qui dimensionne, champ posé par-dessus). Au repos : largeur naturelle, une ligne, sans cadre ni marge ; en saisie : `minWidth: 44`, marge de 4, rayon 4 (style `tableChargeFocus`). La zone de centrage sous la cellule passe à 120 (`CHARGE_BOX_WIDTH`, centrage seulement, sans fond). `ChargeValue` (tous les tableaux à ligne de charge) utilise `fit` au lieu de la largeur 44. Colonnes inchangées (44, pas de 56).
- **Cible tactile et Suivant** : inchangés — la charge reste `barOnly` (pas de zone tactile propre, atteinte par Précédent / Suivant), même `inputRef`, même ordre (`tableCellOrder` non modifié).
- **Dépassement** : charge centrée sur la colonne ; « (12,25 kg) » ≈ 50 dépasse de ≈ 3 de chaque côté dans l'écart de 12, deux charges voisines (tableau des séries) restent à ≈ 6 l'une de l'autre ; dans les tableaux à une ligne par mouvement seule la première colonne porte une charge. Au-delà de ≈ 56 (« (999,75 kg) »), deux charges voisines du tableau des séries se toucheraient : signalé, non traité (aucune règle ajoutée). En saisie, le cadre (texte + 8, au moins 44) peut recouvrir l'écart. Estimations de largeur non mesurées (Jest ne mesure pas le texte).
- **Tests** : `formats.recette0811` — nouveau test « recette du 08/11 soir » (valeur « (12,25 kg) », aucune largeur imposée au repos, texte de dimensionnement sur une ligne, zone centrée, colonne de 44, en saisie `minWidth` 44 et marge 4) ; attentes « width: 44 » de la charge retirées (0611, 0811), annotées.
- **Résultats** : `npx jest src/features/sessions/__tests__/formats src/features/sessions/__tests__/FormatModelScreen --testPathIgnorePatterns "\.claude" -w 2` → 8 suites, 123 tests, tous passés ; `tsc` et `eslint` (FormatTables, tests 0611 / 0811) : aucune erreur.
- **À vérifier sur iPhone** : « (12,25 kg) » entier au repos et en saisie (EMOM, Tabata, AMRAP…) ; cadre de saisie ajusté, pas plus large que nécessaire ; curseur et suffixe « kg » en saisie ; pas de chevauchement avec la charge voisine.

## Format des durées dans toute l'application (08/11/2026 au soir, sur `e369c1ae`)

Demandes de Hermann, mot pour mot : « Et tu dois encore modifier le format des durées. » ; « Partout veut bien dire partout » ; « Il y a les heures aussi » ; « 75 minutes doit s’afficher 1h 15´ ». Classe B. Recopiées au registre ch07, « Recette du 08/11/2026 soir — format des durées ».

**Règle appliquée**
- `formatPrimeDuration` (déplacé dans `src/domain/activities/durationFormat.ts`, réexporté par `FormatTables`) : `S″` sous une minute, `M′SS″` jusqu'à 59′59″, `Hh MM′` à partir d'une heure (espace insécable U+00A0, minutes sur 2 chiffres), secondes non nulles à la suite (`1h 00′01″`). **À CLARIFIER** : notation des heures (minutes sur 2 chiffres, secondes, espace insécable, prime pour l'accent aigu « ´ »).
- `formatPhraseDuration` (formateur unique, AD-5) délègue désormais à `formatPrimeDuration` : tout ce qui l'utilisait passe au nouveau format (Phrase de synthèse, feuille Paramètres d'exécution, cadre Format, Intervalle, cibles, pauses, récupération, Composition — zone de contexte, cartes, récupération —, en-têtes de Circuit, Catalogue des séances, `formatSheetContext`, messages).
- Autres formateurs ramenés au même format : `FormatTables.formatSeconds` (« 1 min 30 »), `carrierPresentation.formatMinutes` (en-tête de Circuit porteur), `compositionPresentation.formatBoundarySecondsValue` (Compte à rebours / Fin de séance « 45 s » → « 45″ »), cadence `beepLabel` (« 30 s ») et option « 1 s » de la cadence (`src/shared/i18n/index.ts`, modification ciblée), `compactBlockDuration` du Déroulé (`30"`, `1'30"`, `2'` → `30″`, `1′30″`, `2′00″`).
- `FormatModelScreen` : le questionnaire suit le récapitulatif (`formatDuration = formatPrimeDuration`).
- Seul le format change : arrondis et bornes inchangés (D-391, D-443).

**Accessibilité** — nouveaux `spokenDuration` / `spokenDurations` (« 1 heure 15 minutes », « 1 minute 30 secondes », « 45 secondes ») appliqués aux libellés VoiceOver qui portaient une durée : carte des paramètres et section « Dans cette séance » (`ActivityEditorForm`), ligne Durée de l'exercice (`totalSpokenLabel`) et options de cadence (`ExecutionParametersSheet`), en-têtes de Circuit (titre + durée, durée du porteur) et de Cycle, zone de contexte (durée de la séance), carte du Catalogue des séances (`sessionCardAccessibilityLabel`), récupération d'une occurrence (`CompositionScreen`, ligne ciblée).

**Cas signalés**
- **Heures** : aucun format en heures n'existait (H8 : minutes sans heures, ex. « 75 min »). Le nouveau format `Hh MM′` s'applique partout où une durée ≥ 1 h peut apparaître : durées totales d'Exercice et de Séance, zone de contexte, cartes, Déroulé, cellules de durée des tableaux (bornes de saisie jusqu'à 99′59″ = 5999 s → « 1h 39′59″ »).
- **Risques de texte rogné** (non élargis) : cellules de 44 des tableaux des Formats (dimensionnées sur 99′99″) — une durée ≥ 1 h (« 1h 05′30″ », jusqu'à « 1h 39′59″ ») et les incréments signés (« + 1′30″ ») peuvent dépasser 44 ; libellés des blocs du Déroulé (`numberOfLines={1}`, blocs étroits) — « 2′00″ » est plus long que l'ancien « 2' » ; cellules du tableau des séries variables de la feuille (71) avec une durée ≥ 1 h ; à vérifier sur iPhone.
- **Libellés d'accessibilité conservés** : le nom accessible d'une occurrence (« Exercice, Gainage, 1 sur 1, 4 min », `formatEstimatedDuration`, minute supérieure, `durationUnit: "min"`) garde sa forme existante ; seule la récupération qui y est ajoutée est lue en toutes lettres.
- **Non converti, sans consommateur** : `compositionPresentation.formatDurationRowValue` (« 00 min 10 s », historique story 7.8, aucun appelant).
- **Roulettes natives** : `DurationWheelPicker` affiche deux colonnes de chiffres (minutes, secondes) sans libellé « min » / « s » visible ; primitive inchangée. Les champs « MM:SS » au clavier sont inchangés.
- **TextInput des tableaux** : VoiceOver lit la valeur affichée d'une case de saisie (« 1′30″ ») ; aucun `accessibilityValue` n'existe sur `TableCell` → signalé, non modifié.
- **Documentation** : la règle « 0 s / x s / x min / m min s s » n'est pas aux lignes 609-618 du ch08 de cette branche (sujet : mise en pause) ; elle est au ch10 (§ « Phrase de synthèse des paramètres — Format d'affichage des durées ») et y est annotée remplacée. Annotés aussi : ch07 (D-391, D-443 « Durée de la Séance », point (1) des « À confirmer » tranché, nouvelle sous-section), ch13 (exemple de saisie « 1 min 30 »), spécification Formats §9.3 et §9.5. Non annotés : bornes exprimées en « 0 s..58 min 55 s » (PRODUCT, ch07 D-089…), qui énoncent des valeurs et non le format d'affichage ; ch04, ch12 et INDEX ne contiennent pas de formulation du format.
- **Tests** : les attentes des fichiers de référence (`attendus-phrases-276.json`, `phrases-276.json`, fixtures `phrases-276-cotes-neutres.json`, `phrase-variants.json`, `phrases-pre5.json`) restent inchangées sur disque ; `executionPhrase.test.ts` convertit leurs durées au format affiché (`toDisplayedDurations`) avant comparaison. Les autres attentes ont été converties (littéraux, expressions régulières) ; les libellés d'accessibilité attendent la forme lue.

**Résultats**
- `npx jest --findRelatedTests <13 fichiers source modifiés> --testPathIgnorePatterns "\.claude" -w 2` → **152 suites, 3 249 tests, tous passés**.
- `npx jest src/domain/sessions/__tests__/formats src/features/sessions/__tests__/formats src/features/sessions/__tests__/FormatModelScreen --testPathIgnorePatterns "\.claude" -w 2` → **10 suites, 159 tests, tous passés**.
- `npx tsc --noEmit` → aucune erreur. `eslint` sur les fichiers modifiés → 0 erreur ; 2 avertissements préexistants (`openGeneric` dans `formatTimeline.ts`, `testRouter` dans `ExerciseEditingPaths.integration.test.tsx`).
- Pas de suite Jest complète (consigne mémoire).

## Hypothèses non démontrées / points à confirmer par Hermann

1. ~~AMRAP : « +kg » par mouvement à confirmer~~ — tranché le 08/11/2026 après-midi : gardé.
2. Format M′SS″ appliqué au récapitulatif seulement (questionnaire inchangé : « 1 min », « 30 s »).
3. Charge vide sous « +kg » : « (—) » gris, comme dans le tableau des séries existant (conservé).
4. Glissement de la cellule (y = 10 ↔ 2,5) : aucune animation n'existait pour l'apparition de la charge ; laissé sans animation.
5. ~~Hauteur du cadre orange d'une charge vide~~ — sans objet depuis c-tabata-recap.
6. Champ « Exécution » et légende du Déroulé : composants partagés avec le questionnaire, nouvelles valeurs donc appliquées aux deux étapes.
7. Titres plus larges que 44 (« Incrément », « Par tour ») et « à l'échec » débordent symétriquement de leur colonne.
8. ~~Virgule de l'étiquette en bleu~~ — acceptée le 08/11/2026 soir (e-parentheses).

## Éléments non corrigés ou hors périmètre

- Partie C du relevé (en-têtes de Circuit flottants au défilement) : non traitée.
- Erreur ESLint préexistante de `FormatModelScreen.c3.test.tsx` (ligne 105).
- Pas de modification Figma (lecture seule), aucune migration.

## Vérifications restant à effectuer sur iPhone

- EMOM, Progression, For time, Superset : colonnes 44 / écart 12 calées à 16 du bord ; ligne de 44 identique avant / après « +kg » ; nom et étiquette immobiles ; charge « (12 kg) » sans cadre juste sous la valeur (écart compact) ; « 22′39″ » tenant dans 44 ; « — » rouge.
- AMRAP : plus de colonne Charge, charge sous l'Objectif, radio centré, grisé Max.
- [Remplacé le 08/11 après-midi :] Death by, Tabata, 30/30, Renforcement, À l'échec avec « Avec charge » : « +kg » / « −kg » par ligne, charge sous la première colonne après « +kg », lignes de 44, parenthèses grises.
- Tableau des séries : « Mouvement » aligné sur les noms (x = 16) ; charge au focus limitée à 44 ; « (12,5 kg) » lisible.
- Lignes de paramètres de 40, cadre « Intervalle / Durée totale / Exécution » de 122, écarts de 8 ; durées M′SS″ ; Déroulé.
- Saisie au clavier : focus, Précédent / Suivant vers la charge après « +kg », défilement des colonnes (pas de 56), TextInput en 11 / hauteur 13 pour la charge (rendu iOS du curseur à vérifier).

## Fichiers modifiés (par cette mission)

- `src/features/sessions/FormatTables.tsx`
- `src/features/sessions/FormatModelScreen.tsx` (zones récapitulatif / paramètres / Déroulé seulement)
- `src/shared/i18n/resources/fr.ts`
- `src/features/sessions/__tests__/formats.recette0811.test.tsx` (nouveau)
- `src/features/sessions/__tests__/formats.recette0611.test.tsx`
- `src/features/sessions/__tests__/FormatModelScreen.c3.test.tsx`
- `docs/KODJO-Formats-entrainement-2026-11-02.md`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `.github/orchestration/reports/2026-11-08_PRE9-RECETTE-0811-TABLEAUX.md` (ce rapport)

## Commit final et état Git

- Aucun commit par cette mission (consigne : la session principale intègre et committe). Livraison initiale committée par la session principale en `81a7036f` ; les corrections du 08/11 après-midi sont non committées sur ce HEAD.
- Arbre de travail : fichiers ci-dessus modifiés, plus les modifications concurrentes d'autres sessions (`CompositionScreen.tsx`, `SelectedMovementCard.tsx`, `KodjoIcon.tsx`, `CompositionScreen.recette*.test.tsx`, `FormatModelScreen.r0711.test.tsx`), non touchées par cette mission.

### Réponses de Hermann du 08/11/2026 au soir — heures (session principale)

- Verbatim : « Minutes sur 2 chiffres après les heures » ; « Non » (secondes au-delà d'une heure) ; « Oui, je n’ai pas ce symbole sur mon clavier c’est tout. » (prime).
- `formatPrimeDuration` et `spokenDuration` : à partir d'une heure, `Hh MM′` sans secondes, arrondi à la minute la plus proche (interprétation). Tests mis à jour : `durationFormat`, `formats.recette0811`, `compositionPresentation`, `ExecutionParametersSheet` (anciennes valeurs annotées).
- Tests : `--findRelatedTests durationFormat.ts` 106 suites (2 corrigées ensuite : 366/366) ; `tsc --noEmit` OK.

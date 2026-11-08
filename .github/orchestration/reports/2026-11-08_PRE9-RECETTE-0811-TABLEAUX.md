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

## Hypothèses non démontrées / points à confirmer par Hermann

1. AMRAP : avant le 08/11, sa charge suivait t-coche-direct (case toujours présente, listée dans le commentaire de `tableCellOrder` du 06/11) ; la spécification B (« (rép., +kg) ») et l'instruction de la session principale lui donnent « +kg » par mouvement. C'est un changement de comportement pour l'AMRAP, à faire confirmer.
2. Format M′SS″ appliqué au récapitulatif seulement (questionnaire inchangé : « 1 min », « 30 s »).
3. Charge vide sous « +kg » : « (—) » gris, comme dans le tableau des séries existant (conservé).
4. Glissement de la cellule (y = 10 ↔ 2,5) : aucune animation n'existait pour l'apparition de la charge ; laissé sans animation.
5. Hauteur du cadre orange d'une charge vide : 13 (ligne de la charge), rayon 6 — non spécifié, à vérifier sur iPhone.
5. Champ « Exécution » et légende du Déroulé : composants partagés avec le questionnaire, nouvelles valeurs donc appliquées aux deux étapes.
6. Titres plus larges que 44 (« Incrément », « Par tour ») et « à l'échec » débordent symétriquement de leur colonne ; « (12,5 kg) » centré dans une zone de 80.

## Éléments non corrigés ou hors périmètre

- Partie C du relevé (en-têtes de Circuit flottants au défilement) : non traitée.
- Erreur ESLint préexistante de `FormatModelScreen.c3.test.tsx` (ligne 105).
- Pas de modification Figma (lecture seule), aucune migration.

## Vérifications restant à effectuer sur iPhone

- EMOM, Progression, For time, Superset : colonnes 44 / écart 12 calées à 16 du bord ; ligne de 44 identique avant / après « +kg » ; nom et étiquette immobiles ; charge « (12 kg) » sans cadre juste sous la valeur (écart compact) ; « 22′39″ » tenant dans 44 ; « — » rouge.
- AMRAP : plus de colonne Charge, charge sous l'Objectif, radio centré, grisé Max.
- Death by, Tabata, 30/30, Renforcement, À l'échec avec « Avec charge » : charge toujours sous la première colonne, cadre orange (hauteur 13) avec trait si vide, saisie directe au toucher ; lignes de 44 ; étiquette « (rép.) » / « (durée) ».
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

- Aucun commit (consigne : la session principale intègre et committe). HEAD inchangé : `5d5a5ec0`.
- Arbre de travail : fichiers ci-dessus modifiés, plus les modifications concurrentes d'autres sessions (`CompositionScreen.tsx`, `SelectedMovementCard.tsx`, `KodjoIcon.tsx`, `CompositionScreen.recette*.test.tsx`, `FormatModelScreen.r0711.test.tsx`), non touchées par cette mission.

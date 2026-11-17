# FORMATS-TABLEAU-UNIQUE-20261115 — Formats à tableau : écran unique sans questionnaire

## Identification

- **Mission** : FORMATS-TABLEAU-UNIQUE-20261115 — développement, classe B (décision de Hermann du 15/11/2026).
- **Objectif** : Tabata, 30/30, Renforcement, À l'échec, Progression, EMOM, Superset, Death by et AMRAP s'ouvrent sur un écran unique (paramètres + tableau des mouvements + Déroulé), sans questionnaire ni cartes de mouvement.
- **Dépôt / worktree** : `C:\Dev\PRE10-SON`, branche `pre11-formats` (locale).
- **Commit de départ** : `d37f792f3af648d69f2cdaa17185965ce93bb47f` (HEAD relevé avant toute modification). L'arbre contenait déjà 87 entrées non commitées de la mission For time du même jour (code en attente de validation de Hermann).

## Sources lues

- `origin/main` (`f17f73a3`, `0765ec70`, `ba83eeb1`) — ch07 « Formats à tableau — écran unique, sans redondance (15/11/2026) » et « For time — tableau unique, sans questionnaire (15/11/2026) » ; ch13 CE-FMT-02 §4 et §8, tableau des écrans Figma (lignes du 15/11/2026). Ces sources ne sont pas fusionnées dans `pre11-formats` (règle « source normative absente de la branche » : pas de fusion).
- Figma `G6RY5Ebhgwb4AHIOYDwwvg` (lecture seule, captures) : `12455:26716` (Tabata en alternance), `12445:26716` (EMOM), `12445:27394` (AMRAP), `12445:27143` (Death by), `12445:26957` (Superset), `12445:26518` (Progression). Écrans anciens non migrés non consultés ni implémentés.

## Périmètre demandé

Règles 1 à 9 de la mission (entrée directe, écran = cadre des paramètres + tableau pleine largeur + Déroulé, seconde ligne « (unité, ±kg) », colonnes à dimensions inchangées, colonnes de séries / tours avec − / + sans plafond, unité à choisir derrière une constante isolée, variantes d'Exécution, Déroulé sans « buy-in » / « buy-out », AMRAP en deux blocs).

## Périmètre réellement traité

Toutes les règles 1 à 9. Écrans anciens (états clavier Progression, variantes AMRAP, fiche modale Tabata) : non touchés.

## Change control — PRESERVE / CHANGE / FORBIDDEN

| | Élément | Statut |
|---|---|---|
| PRESERVE | For time (écran, blocs, `testID`, popover d'unité, ±, charges, sauvegarde) | Démontré inchangé : tests For time de `FormatModelScreen.c3.test.tsx` verts sans modification (refactor de `ForTimeBlocks` à rendu identique) |
| PRESERVE | Composition, Fiche du mouvement, moteur de séance | Aucun fichier touché ; suites vertes |
| PRESERVE | Règles FMT, structure produite (`buildModelElements`), calculs de durée | `buildModelElements` et calculs non modifiés ; suite `src/domain` verte |
| PRESERVE | Mode catalogue (« + Ajouter », recherche, piles, fondus) | Inchangé ; `FormatModelScreen.r0711.test.tsx` vert (sélecteurs mis à jour seulement) |
| PRESERVE | Primitives natives (`Menu` SwiftUI d'`@expo/ui` pour l'unité et l'Exécution, feuille native) | Conservées et réutilisées ; test de la branche native |
| CHANGE | Entrée directe des 9 Formats, suppression du questionnaire et de sa route | Fait |
| CHANGE | Cadre des paramètres pleine largeur + tableau pleine largeur, plus de cartes | Fait |
| CHANGE | Colonne Charge grisée / active ; séries / tours − / + sans plafond ; Déroulé sans « buy-in » | Fait |
| CHANGE | Unité à choisir (extension proposée, constante `UNIT_CHOICE_AT_ADD`) | Fait, isolé |
| FORBIDDEN | Remplacement d'une primitive native, nouvelle bibliothèque, refonte du domaine | Respecté |

## Constats

1. Le registre ch07 écrit « For time : déjà aucun » texte buy-in dans le Déroulé, mais `formatTimeline.ts` produisait « 21 · buy-in » / « 20 · buy-out » pour le For time. La règle 8 (« aucun texte buy-in ni buy-out ») a été appliquée aussi au For time.
2. Sans questionnaire, plusieurs réglages AMRAP n'ont plus d'écran de saisie : Nombre de blocs, Repos entre les blocs, Repos de boucle, Volume croissant (À CLARIFIER).
3. Les composants `AmrapTable`, `DeathByTable`, `ObjectivePauseTable`, `SeriesTable` de `FormatTables.tsx` ne sont plus utilisés par l'écran ; ils sont conservés pour limiter le diff (aucune autre utilisation).

## Modifications réalisées

- `app/formats-window.tsx` : tous les Formats ouvrent `/format-summary`.
- `app/format-questionnaire.tsx` : supprimé ; `app/_layout.tsx` : écran `format-questionnaire` retiré (annotation datée).
- `src/features/sessions/ForTimeBlocks.tsx` : généralisé sans changer le rendu For time — `SeriesBlock` (colonnes de séries / tours, − / +, triangle), `DimensionBlock` (colonnes à dimensions), ligne commune `NameRow` (photo → Fiche, nom tronqué, « (unité, ±kg) » au-dessus de la zone glissable), accès aux valeurs paramétré (`SeriesAccess`), « + Ajouter » désactivable (Superset).
- `src/features/sessions/FormatModelScreen.tsx` : étape toujours « summary » ; Avec charge actif en interne pour tous ; AMRAP neuf avec Volume croissant ; synchronisation Buy-in AMRAP depuis le bloc ; Retour quitte le Format ; lignes communes Travail / Répétitions / Pause / Charge / Départ / Incrément retirées (le tableau les porte, même avec un seul mouvement) ; Progression : Pause, Durée totale, Exécution dans le cadre ; `formatBlocks()` par Format ; cartes, glisser par appui long et cadre entre deux paramètres retirés (Monter / Descendre VoiceOver conservés).
- `src/features/sessions/FormatTables.tsx` : `signedText` exporté ; `ChargeValue` touchable en option (colonne Charge) ; ordre de Suivant : tableau dès un mouvement, cases sans unité sautées.
- `src/domain/sessions/formatModels.ts` : `UNIT_CHOICE_AT_ADD` + `withUnitToChoose` (⚠ extension proposée, non validée) ; `summaryIssues` : ligne sans unité incomplète pour ces Formats.
- `src/domain/sessions/formatTimeline.ts` : libellés du buy-in AMRAP et du buy-in / buy-out For time sans texte.
- Documentation : `_bmad-output/pre11/spec-pre11-formats.md` point 21 du §5 et entrée À CLARIFIER (§7).
- Cahier en ligne : section « fmt-tableau-1511 », 14 lignes (version 117), https://claude.ai/artifact/Mp9Tu1rPiRdfebmKfpf8Tq.

## Synchronisation code / documentation

Classe A : le code rejoint la classe B déjà documentée sur `main` (`ba83eeb1`, `0765ec70`, `f17f73a3`). Aucune règle promue depuis le code ; écarts et interprétations en À CLARIFIER (spec du lot §7 et ci-dessous). Patch documentaire : aucun nécessaire hors du lot.

## Preuves et tests

- `npx tsc --noEmit -p .` : aucune erreur.
- `npx eslint` sur les fichiers modifiés : aucune erreur, aucun avertissement nouveau (erreurs préexistantes de `CompositionScreen.tsx`, `StickyHeader.tsx` et du harnais c3 ligne 106, non touchés).
- `npx jest` (suite complète) : **364 suites, 5841 tests réussis, 32 ignorés**, 0 échec (avant l'ajout final du typage du test : identique ; nouveau fichier relancé : 32/32).
- Nouveau fichier `src/features/sessions/__tests__/FormatModelScreen.tableauUnique.test.tsx` (32 tests) : entrée directe des 9 Formats (pas de questionnaire, cadre pleine largeur, lignes de 31, Retour) ; colonnes par Format sans colonne Unité ; colonne Charge (tiret grisé / valeur active touchable) ; − / + sans plafond au-delà de 99 et triangle ; branche native du popover d'unité (`Menu` SwiftUI) ; unité à choisir ; Tabata Durée seule ; Death by à un mouvement ; AMRAP deux blocs, Déroulé sans « buy-in », sauvegarde ; Superset limité à deux ; variantes d'Exécution, tableau inchangé.
- Tests adaptés (annotations datées, textes d'origine conservés) : 32 tests du questionnaire dans `FormatModelScreen.c3.test.tsx` désactivés (`it.skip`, couverture reprise dans le nouveau fichier) ; `FormatModelScreen.r0711.test.tsx` (sélecteurs) ; `app/__tests__/formatsWindowRoute.test.tsx`, `rootLayoutGesture.test.tsx` ; `formatModels.buyinMultiples0811.test.ts`, `formatModels.recette0411.test.ts` (libellés sans buy-in, EMOM sans unité incomplet).
- Aucun navigateur, aucun contrôle visuel automatique. Aucune preuve visuelle déclarée.

## Hypothèses non démontrées

- Rendu et géométrie fidèles à Figma (positions de « + Ajouter », colonnes, charge) : non vérifiés visuellement.
- Absence de blocage tactile du popover d'unité dans les nouveaux blocs (même montage que le correctif For time, non vérifié sur appareil).

## À CLARIFIER (décision de Hermann)

1. Extension « Unité à choisir » à Progression, EMOM, Superset, AMRAP (`UNIT_CHOICE_AT_ADD`) — proposée par Claude, non validée ; vider l'ensemble la désactive.
2. AMRAP : Nombre de blocs, Repos entre les blocs, Repos de boucle sans écran de saisie ; Volume croissant activé d'office (colonne Par tour, incrément à saisir, 0 si aucun) ; à la réouverture d'un AMRAP sans volume croissant, Par tour reste masqué.
3. AMRAP : buy-in réduit à la colonne Objectif (Figma) — Max n'y est plus proposé.
4. − / + sans plafond, mais la ligne au clavier reste bornée à 99.
5. Charge active affichée « (12 kg) » (Figma, composant commun) ; la mission écrit « 12 kg ».
6. Death by : valeurs « 1 » / « + 1 » sans unité (colonnes inchangées) ; Figma montre « 1 rép. ».
7. Le nom d'un mouvement n'ouvre rien (seule la photo ouvre la Fiche) hors For time.
8. Appui long de déplacement retiré avec les cartes (Monter / Descendre VoiceOver conservés), comme au For time.

## Éléments non corrigés ou hors périmètre

- Écrans anciens non migrés (Progression clavier, variantes AMRAP, fiche modale Tabata) : comportement non modifié, mais les variantes AMRAP à plusieurs blocs ne sont plus atteignables à la création (point 2).
- Composants de tableau devenus inutilisés conservés (constat 3).
- Erreurs de lint préexistantes hors périmètre.

## Vérifications à faire sur iPhone (Hermann)

Lignes `fmt-*` du cahier (section « Formats à tableau : écran unique ») : entrée directe, cadre et tableau pleine largeur, ligne de mouvement et espacement photo / unité / charge, colonnes à dimensions, colonne Charge, − / + et triangle, Unité rouge et popover natif, Tabata Durée seule, un seul mouvement, variantes d'Exécution, Déroulé, Superset, enregistrement et réouverture, réglages AMRAP. Metro est arrêté (mémoire) : à relancer à la demande (`npx expo start --tunnel --clear`).

## Fichiers modifiés par cette mission

`app/_layout.tsx`, `app/formats-window.tsx`, `app/format-questionnaire.tsx` (supprimé), `src/features/sessions/ForTimeBlocks.tsx`, `src/features/sessions/FormatModelScreen.tsx`, `src/features/sessions/FormatTables.tsx`, `src/domain/sessions/formatModels.ts`, `src/domain/sessions/formatTimeline.ts`, tests (`app/__tests__/formatsWindowRoute.test.tsx`, `app/__tests__/rootLayoutGesture.test.tsx`, `src/features/sessions/__tests__/FormatModelScreen.c3.test.tsx`, `FormatModelScreen.r0711.test.tsx`, `FormatModelScreen.tableauUnique.test.tsx` (nouveau), `src/domain/sessions/__tests__/formatModels.buyinMultiples0811.test.ts`, `formatModels.recette0411.test.ts`), `_bmad-output/pre11/spec-pre11-formats.md`, ce rapport.

## Commit et état Git

- Consigne permanente de Hermann : « Ne touche pas aux fichiers sans rapport avec ce correctif. Ne commite pas sans validation. » Les fichiers de code de cette mission sont les mêmes que ceux de la mission For time, encore non commitée et en attente de validation : un commit de code mêlerait les deux. **Le code n'est donc pas commité** ; seul ce rapport l'est, dans un commit documentaire rattaché au commit de départ `d37f792f`.
- Commit final : voir la réponse de clôture (hash du commit contenant ce rapport).
- État Git : branche `pre11-formats`, locale, non poussée ; code non commité (For time + écran unique).

## Performance

Durée et consommation : NON VÉRIFIABLE. Inefficacités : deux scripts d'édition à refaire (quotage du shell, fins de ligne CRLF). Action : CONTINUER.

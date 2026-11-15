# 2026-11-15 — PRE-11 · For time : récapitulatif en tableau unique, sans questionnaire

## Identifiant et objectif

- **Mission** : `PRE11_FORTIME_TABLEAU_UNIQUE`.
- **Objectif** : appliquer la décision de Hermann du 15/11/2026. Le For time n'a plus de questionnaire : l'entrée « For time » ouvre directement le récapitulatif vide, avec la carte des paramètres et trois blocs Buy-in / En boucle / Buy-out (colonnes, « − » / « + », unité par ligne, charge par mouvement).

## Branche et commit de départ

- Dépôt de travail : `C:\Dev\PRE10-SON`, branche `pre11-formats` (locale, jamais poussée).
- Commit de départ : `ab9e3005`. L'arbre de travail portait déjà 83 entrées non commitées (corrections de recette précédentes, non validées).
- Sources normatives : `origin/main` à `e6a96ac5`, précisé par `b217c86d` (« aucun plafond de séries pour le buy-in et le buy-out »). Elles ne sont pas sur `pre11-formats` et n'ont pas été fusionnées (règle « source normative absente de la branche »).

## Périmètre demandé

1. Supprimer le questionnaire For time. Coche grise puis bleue et enregistrante ; Croix ou Retour → sans ajout.
2. Carte des paramètres : Nombre de tours, Repos entre les tours, Temps limite, Exécution (dès deux exercices Tour ; libellés « séries » en « À la suite »).
3. Trois blocs avec « + Ajouter » (mode catalogue direct, sélection multiple). Un bloc vide n'a ni colonne ni ±. Plus d'interrupteurs Buy-in, Buy-out ni Avec charge.
4. Colonnes et ± :
   - S1 ou Tour 1 calé à droite, « − » à gauche des titres, « + » fixe ;
   - buy-in et buy-out sans plafond ;
   - dans la boucle, − / + règlent le Nombre de tours ;
   - un triangle signale les colonnes qui dépassent.
5. Ligne « (rép., ± kg) » :
   - unité et charge modifiables au toucher (popover d'unité) ;
   - « Unité » en rouge à l'ajout, cases désactivées tant que l'unité n'est pas choisie ;
   - charge par mouvement, affichée sous chaque valeur.
6. Baseline gelée pour tout le reste ; établir la liste PRESERVE / CHANGE / FORBIDDEN ; utiliser les primitives natives existantes.
7. Tests du parcours, du retour des valeurs, et non-régression des autres Formats.

## Périmètre réellement traité

Tous les points 1 à 7, avec les interprétations listées plus bas. Aucune vérification visuelle automatique n'a été faite ; la vérification sur iPhone reste à faire par Hermann.

## Sources lues avant le code

- ch13, CE-FMT-02 : §4 « For time — sans questionnaire », §8 « For time — mode d'exécution » et « For time — tableau unique, sans questionnaire », table des écrans Figma.
- ch07 : « For time — tableau unique, sans questionnaire (15/11/2026) », décisions recopiées et précision sans plafond.
- ch10 : FMT-31 et FMT-32.
- Figma `G6RY5Ebhgwb4AHIOYDwwvg`, en lecture seule :
  - `12377:26300` (état vide) ;
  - `12413:26346` (premier mouvement) ;
  - `12341:27002` (récapitulatif, En alternance : métadonnées et contexte de conception du bloc Buy-in `12368:26294`) ;
  - `12428:26360` (À la suite).

  Les écrans archivés (`8624:30255`, `8624:30672`, `12340:26219`) n'ont pas servi.

## Liste PRESERVE / CHANGE / FORBIDDEN (établie avant modification)

| | Élément | Résultat |
|---|---|---|
| PRESERVE | Modèle de données des séries For time (`volumes`, `loads`, `loadOn`, `mode`, rôles `buyIn` / `buyOut`) | Inchangé. |
| PRESERVE | Structure produite (`buildModelElements` For time : Exercice seul ou Circuit porteur ; `SERIES` en alternance, `TOURS` à la suite ; séries des blocs) | Inchangée ; seuls les tests d'écran l'exercent. |
| PRESERVE | Mode d'exécution (règle des deux exercices en tour, libellés « séries » à la suite) | Inchangé ; seule la place de la ligne change, conformément au §8 et au Figma. |
| PRESERVE | Déroulé (`modelTimeline`), durée, Temps limite, borne « Sans limite » | Inchangés. |
| PRESERVE | Autres Formats : questionnaires, récapitulatifs, tableaux `SeriesTable`, `AmrapTable`, `DeathByTable`, `ObjectivePauseTable` | Inchangés : `tableCellOrder` n'est modifié que dans sa branche For time, et `ChargeValue` / `valueText` ne sont qu'exportés. |
| PRESERVE | Mode catalogue intégré (fondu, piles, filtres, sélection multiple) | Réutilisé tel quel par « + Ajouter ». |
| PRESERVE | Modale des paramètres d'un mouvement (FT-3) ; barre du clavier (Précédent / Suivant / Fermer, unité) ; « +kg » / « −kg » (retrait de la charge vide à la fermeture du clavier) | Réutilisés. |
| PRESERVE | Réédition « Modifier le format » d'un Circuit For time (`format-summary` + `circuitId`) | Même écran, valeurs relues (testé). |
| CHANGE | Entrée For time de la fenêtre Formats | `app/formats-window.tsx` : `/format-summary` pour `FOR_TIME`. |
| CHANGE | Écran du Format, For time seulement | Étape « récapitulatif » d'emblée ; Retour quitte le Format ; carte des paramètres sans lignes Buy-in / Buy-out ni Avec charge, Exécution en dernière ligne ; cartes et tableaux remplacés par `ForTimeBlocks`. |
| CHANGE | Nouveau composant `ForTimeBlocks` | Trois blocs, colonnes, ± , triangle, ligne de mouvement, popover d'unité. |
| CHANGE | Validation For time | Une ligne sans unité est « à compléter » (`summaryIssues`). |
| CHANGE | Ordre Suivant For time | Cases sans unité sautées. |
| FORBIDDEN | Remplacer une primitive native ou un composant partagé | Respecté : popover d'unité = `Menu` SwiftUI d'`@expo/ui` (même procédé que le champ Exécution) ; cases = `TableCell` (pavé numérique) ; charge = `ChargeValue` / `ChargeToggle` ; retrait = `SwipeActionsRow` ; photo = `MediaPreview`. |
| FORBIDDEN | Toucher les autres Formats, le moteur d'exécution, les données persistées | Respecté. |

## Constats

- Le questionnaire For time (lignes Buy-in / Buy-out « Sans » ou N séries, interrupteur Avec charge, « Valider les paramètres ») et les cartes de mouvements au-dessus des tableaux par zone sont remplacés par la décision du 15/11.
- La règle « Croix ou Retour → Composition » (CE-FMT-02 §4) coexiste avec la formulation déjà présente pour les questionnaires (« Questionnaire croix → Composition »). Le code de ces derniers revient à l'écran qui a ouvert le Format (règle du 06/11/2026 sur l'ordre des écrans). Le Retour du For time suit le même comportement : voir les hypothèses.
- Sur `main`, l'annotation du 15/11/2026 de FMT-32 est doublée dans la liste du ch10 (deux fois la même mention entre crochets). C'est une anomalie documentaire de `main`, non corrigée ici (hors branche).

## Modifications réalisées

- `app/formats-window.tsx` : la carte For time ouvre `/format-summary` ; les autres Formats ouvrent toujours `/format-questionnaire`.
- `src/features/sessions/ForTimeBlocks.tsx` (nouveau) — trois blocs pleine largeur, séparés de 10, fond `#F9FAFC`.
  - **En-tête de bloc (28)** : titre Inter Medium 12 noir, « + Ajouter » à x = 83, et, dès un mouvement, « − » contre la première colonne et « + » fixe à droite. Les glyphes ont un trait de 1,7 en `#AEB4C6`, atténués en `#D5D8E2`.
  - **Colonnes** : 44, écart de 12, trois visibles, défilement horizontal au-delà, triangle au-delà de trois colonnes.
  - **Ligne de mouvement (48)** :
    - photo 40 (Fiche du mouvement), nom (modale des paramètres, FT-3) ;
    - « ( rép. , ±kg ) » : unité en bleu semi-gras par le popover natif, ou « Unité » en rouge ;
    - valeur par colonne, charge « (10 kg) » dessous ;
    - « – » grisé tant que l'unité manque ;
    - glissement → Supprimer ; Monter / Descendre (VoiceOver) dans le bloc.
- `src/features/sessions/FormatModelScreen.tsx`, For time seulement :
  - étape initiale « summary » ;
  - brouillon démarré avec `withLoad: true`, car la charge se décide mouvement par mouvement ;
  - mouvement ajouté sans unité, valeurs vides en nombre égal aux colonnes du bloc ;
  - `buyIn` / `buyOut` synchronisés avec le contenu des blocs ;
  - Retour → retour à l'écran appelant, sans ajout ;
  - carte des paramètres réordonnée ;
  - `forTimeBlocks()` remplace `forTimeTables()` ;
  - ligne Buy-in / Buy-out du questionnaire (`blockRow`) retirée, avec annotation.
- `src/features/sessions/FormatTables.tsx` : export de `ChargeValue` et `valueText`. Dans `tableCellOrder`, branche For time seulement, les objectifs d'une ligne sans unité sont sautés.
- `src/domain/sessions/formatModels.ts` : dans `summaryIssues` For time, une ligne sans unité est à compléter.
- `src/shared/i18n/resources/fr.ts` : chaînes `formatModel.forTimeTable`.
- Tests :
  - `src/features/sessions/__tests__/FormatModelScreen.c3.test.tsx` : 8 tests du questionnaire For time réécrits selon la décision (anciens libellés annotés) et 3 nouveaux tests ;
  - `app/__tests__/formatsWindowRoute.test.tsx` : 1 nouveau test.
- Documentation : `_bmad-output/pre11/spec-pre11-formats.md`, point 20 (classe, sources, interprétations).

## Synchronisation code / documentation

- **Classe A.** Le code rejoint la règle écrite sur `main` (ch07, ch13 CE-FMT-02, ch10 FMT-31 / FMT-32, Figma). Aucune règle nouvelle et aucune modification de spécification normative ; la règle est citée dans la spec BMAD du lot (point 20).
- Les sources normatives n'étant que sur `main`, rien n'est appliqué sur `pre11-formats` : pas de fusion, et aucune correction préparée n'est nécessaire, puisque `main` porte déjà le texte.
- Les documents PRE-11 de la branche qui décrivent l'ancien questionnaire (règles For time du 14/11) seront remplacés par la fusion de `main`.

## Preuves et tests

- Ciblé : `FormatModelScreen.c3.test.tsx` 53/53 et `formatsWindowRoute.test.tsx` vert.
- Domaine et écrans de séance (`src/features/sessions`, `src/domain/sessions`) : verts, sauf les 8 tests du questionnaire For time, réécrits.
- Suite complète : voir l'addendum en fin de rapport.
- `npx tsc --noEmit` : aucune erreur.
- `eslint` sur les fichiers touchés : une seule erreur, `react-hooks/refs` dans le harnais `FormatModelScreen.c3.test.tsx` (ligne `useState<SessionDraft>(draftRef.current)`). Elle est antérieure : présente à `HEAD` ligne 105 ; non corrigée, hors périmètre.
- Parcours couverts par les tests :
  - Composition (fenêtre Formats) → état vide ;
  - ajout buy-in → S1, « − » atténué ;
  - « + » ×4 (S5, triangle), « − » ×3 sans `Alert` ;
  - « Unité » rouge, « – » ;
  - unité au popover → cases actives ;
  - boucle : Tour 3, « + » = 4 tours, « − » ×2 = 2, ligne dédiée = 3 ;
  - coche grise tant qu'une ligne est incomplète ;
  - « +kg » et charge ;
  - enregistrement (rôles, cibles 50-40 et 21-15-9, charge 40) ;
  - retour à la Composition ;
  - Retour sans ajout ;
  - Durée refusée au dernier exercice en Répétitions ;
  - À la suite (S1…, séries, TOURS) ;
  - réouverture « Modifier le format » avec valeurs et unités retrouvées ;
  - buy-in 2 séries / buy-out 3 séries retrouvés.

## Hypothèses non démontrées / interprétations

1. **Retour / croix** : retour à l'écran qui a ouvert le Format (fenêtre Formats, ou Composition pour « Modifier le format »), comme la croix des questionnaires. Si Hermann veut un retour direct à la Composition (fenêtre Formats fermée aussi), c'est un changement d'une ligne.
2. **Valeurs à l'ajout** : cases vides à renseigner une fois l'unité choisie, sans préremplissage 21-15-9 (règle « pas de valeur inventée »).
3. **Retrait et ordre** : glissement de la ligne → Supprimer, Monter / Descendre à VoiceOver. L'appui long de déplacement des anciennes cartes n'est pas repris dans le tableau, qui ne le dessine pas.
4. Le triangle est un indicateur, non touchable.
5. **Bloc vidé** : il redevient vide (ni colonne ni ±) ; son nombre de séries est gardé pour un prochain ajout.

## Éléments non corrigés ou hors périmètre

- Erreur lint `react-hooks/refs` du harnais de test (antérieure).
- Doublon d'annotation FMT-32 dans le ch10 de `main`.
- i2 (réédition d'un For time d'un seul exercice) : toujours à construire, hors de cette mission.

## Vérifications restant à faire sur iPhone (Hermann)

- Rendu des quatre états par rapport au Figma : cotes 31 / 48 / 40 / 10, glyphes ± ton sur ton, triangle, couleur de « Unité ».
- Popover d'unité natif sous le mot « rép. » / « Unité ».
- Défilement horizontal des colonnes au-delà de trois, sans conflit avec le glissement de la ligne.
- Clavier sur les cases : Suivant enchaîne les paramètres puis les cases, en sautant les lignes sans unité.

## Fichiers modifiés (cette mission)

`app/formats-window.tsx`, `app/__tests__/formatsWindowRoute.test.tsx`, `src/features/sessions/ForTimeBlocks.tsx` (nouveau), `src/features/sessions/FormatModelScreen.tsx`, `src/features/sessions/FormatTables.tsx`, `src/domain/sessions/formatModels.ts`, `src/shared/i18n/resources/fr.ts`, `src/features/sessions/__tests__/FormatModelScreen.c3.test.tsx`, `_bmad-output/pre11/spec-pre11-formats.md`, et ce rapport.

## Commit final et état Git

- Le code n'est pas commité. Consigne de Hermann en vigueur : « Ne commite pas sans validation ». L'arbre mêle cette mission et les corrections de recette précédentes, non encore validées (mêmes fichiers `FormatModelScreen.tsx`, `formatModels.ts` et test c3).
- Ce rapport est commité seul. Hash et état Git : voir la réponse de livraison et l'addendum.

## Addendum — résultats finaux

- Suite complète `npx jest` : **363 suites, 5839 tests verts** (5837 avant la mission, + 2 tests nets : 8 tests réécrits, 3 tests d'écran et 1 test de route ajoutés, 2 cas de listes retirés).
- `npx tsc --noEmit` : aucune erreur.
- Cahier de recette en ligne : version 114, section « For time : tableau unique, sans questionnaire (décision du 15/11) », lignes `ftu-*` ; elle remplace les lignes `k15-execution-derniere` et `k15-buyin-fermer`.
- Commit : ce rapport seul, sur `pre11-formats` ; le code reste non commité, dans l'attente de la validation de Hermann.

## Addendum 2 — carte des paramètres pleine largeur (demande de Hermann du 15/11/2026)

- Demande (recopiée) : « For Time - écran questionnaire / Récapitulatif consolidé : le premier cadre des paramètres d'exécution prend aussi toute la largeur, vérifie Figma ».
- Figma `12341:27052` vérifié (contexte de conception) :
  - cadre x = 0, largeur 386, fond `#F9FAFC`, sans rayon ;
  - libellés et pastilles à 12 des bords, séparateurs `#E0E3E8` en retrait de 12 aux y = 34 / 65 / 96 ;
  - hauteur 131 pour quatre lignes.
- **Classe A** (CE-FMT-02 §8, cotes : lignes de 31, contrôles de 24 ; Figma).
- Modification : `Panel` reçoit `forTime` (pleine largeur, rayon 0, retrait 12, marges 4). Le contexte de ligne place les lignes For time à 31, séparateur compris. Les autres Formats sont inchangés.
- Tests : `src/features/sessions`, 118 suites et 1805 tests verts, dont une assertion ajoutée (style du cadre et hauteur de ligne) ; `tsc` sans erreur.
- Cahier v115 : ligne `ftu-cadre-largeur`.

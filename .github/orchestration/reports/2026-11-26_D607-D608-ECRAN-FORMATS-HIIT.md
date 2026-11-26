# 2026-11-26 — D-607 / D-608 : écran « Créer un exercice », HIIT, nom du Superset, « Nombre de <format> »

## Identification

- Mission : points 14, 15, 19 (nom seulement) et 22 de la demande de Hermann du 26/11/2026 (D-572 points 4 et 8, D-573 points 3 et 4 de la branche de documentation ; D-607 / D-608 sur `main`).
- Branche : `feat/formats-ecran-hiit-20261126` (worktree `C:\Dev\KODJO-D607-ECRAN`).
- Commit de départ : `785ac655`.
- Sources : demande de Hermann, registre D-568 à D-573, Formats § 9.9 et § 9.10 (copies de travail de la session principale) ; Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP » : `9977:19613` (P-Formats, deux colonnes), `13283:26093` (Carte — HIIT), `13300:26371` (HIIT — Récapitulatif), `12444:26592` (30/30 — Récapitulatif, comparaison).

## Périmètre demandé / traité

| Point | Demandé | Traité |
|---|---|---|
| 14 | 12 formats, ordre et sous-titres § 9.10, fr + en | Fait |
| 15 | HIIT préconfiguré comme le 30/30, partout où le 30/30 est traité | Fait, persistance comprise (migration 041) |
| 19 | Nom Superset / Tri-set / Giant set (modale, préfixe du nom de séance, carte du catalogue) | Fait (le plafond de 2 mouvements du Superset relève du point 3, autre session) |
| 22 | « Nombre de Tabata / 30/30 / EMOM / For time » + « Repos entre les cycles » | **Bloqué — À CLARIFIER** (aucun code) |

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE : titre centré, absence de sous-titre, carte Libre en tête avec logo pointillé (D-606) ; motifs, couleurs et comportement des dix cartes existantes ; comportement du 30/30 et de tous les autres formats ; structure des Circuits produits ; migrations 001 à 039 ; `ExecutionParametersSheet.tsx` (aucune modification) ; feuille native de la fenêtre.
- CHANGE : ordre et sous-titres des cartes (deux lignes, sous-titre à 67 comme Figma, marge basse 6) ; carte HIIT ; clé `HIIT` dans le registre, les modèles, le réédition, le Déroulé, les tableaux, l'écran du format, le contexte de la modale (`unitOpen`) ; `formatModelName` / `circuitDisplayTitle` ; migration 041 ; textes fr/en.
- FORBIDDEN : couleur ou icône inventée ; vignette HIIT du panneau de filtres sans source ; modèle de « cycles » inventé (point 22) ; modification des fichiers `docs/` et du registre (session principale) ; levée du plafond Superset (point 3).
- Démonstration : diff limité aux fichiers listés ci-dessous ; aucune modification de `ExecutionParametersSheet.tsx` (la feuille n'a pas de condition sur la clé 30/30 ; `formatSheetContext.ts` : ajout d'une condition sur une ligne) ; suites existantes des formats vertes sans modification de leurs attentes hors ordre/sous-titres/compte des préconfigurations.

## Constats et modifications

### Point 14
`FormatsWindow.tsx` : `FORMAT_MODEL_ORDER` = Renforcement, Superset, Progression, À l'échec, Death by, HIIT, Tabata, 30/30, EMOM, AMRAP, For time (après la carte Exercice libre) ; sous-titres de bénéfice (fr exact de § 9.10, en traduit) ; sous-titre sur deux lignes au plus (Figma : largeur 140, ligne 16, haut à 67).

### Point 15 — HIIT
- Clé `HIIT` ajoutée à `QUICK_START_KEYS` (donc `PRECONFIGURATION_KEYS`), `FORMAT_MODEL_KEYS`, `SESSION_ORIGINS`, capacités (`freeModel`).
- Valeurs initiales : 6 séries, 40 s, 20 s, sans charge, À la suite ; Durée seule ; récupération 0 s (comme le 30/30). Durée de l'exercice 6 min ; 2 mouvements : 12 min (Figma).
- Toutes les conditions `INTERVALS_30_30` complétées par `HIIT` : `formatModels.ts`, `formatReedit.ts`, `formatTimeline.ts`, `FormatTables.tsx`, `FormatModelScreen.tsx`, `formatSheetContext.ts`.
- Couleurs Figma : fond `#F5F9E2`, bande `#EAF3C8` ; logo : deux vecteurs Figma téléchargés (`assets/models/modele-hiit-eclair-petit.svg`, `…-grand.svg`), posés aux coordonnées de la bande ; accroche de Figma « 40’’ d’effort, 20’’ de récupération. Le format intense, entièrement réglable. »
- Exécution : moteur commun (exercices standards), rien de propre au 30/30 à étendre.
- **Persistance (contrat de schéma)** : `sessions.origin` (017) et `tours.origin_model` (020) sont bornés par des `CHECK` figés. Migration **041** : chaque colonne est remplacée (colonne temporaire au `CHECK` élargi, copie, `DROP COLUMN`, `RENAME COLUMN`), sans reconstruction de table ni cascade ; idempotente. **Version 40 réservée** (migration 040 des branches marquage des photos et compte/lot-1), passage sans effet ici : **à réconcilier à l'intégration**. `DATABASE_VERSION` = 41. Effet de bord : `origin_model` et `origin` passent en dernière colonne.

### Point 19 — nom du Superset
`formatModelName(key, n)` : Superset jusqu'à 2, Tri-set à 3, Giant set à 4 et plus. Utilisé par le titre de la modale du format et la proposition de nom de séance (`FormatModelScreen`), et par `circuitDisplayTitle` (carte du catalogue des séances, Composition, duplication, Renommer).

### Point 22 — bloqué
Le questionnaire actuel n'a aucun paramètre « Nombre de <format> » ni « Repos entre les cycles ». Le Cycle du domaine n'a pas de repos (`StructureCycle` : id, compte, membres) ; For time et EMOM utilisent déjà le compte du Circuit pour leurs tours. Ni la documentation ni Figma ne fixent la structure produite.

## À CLARIFIER

1. Point 22 : (a) où vit « Repos entre les cycles » (nouvelle donnée de Cycle/Circuit, ou récupération du dernier exercice) ; (b) « À la suite » : le nombre multiplie-t-il le Circuit groupé (`repeatCount`) et le repos s'applique-t-il entre ses tours ; (c) « En alternance » : Circuit alterné enveloppé dans un Cycle × N ? (d) For time et EMOM : relation avec « Nombre de tours » / « Nombre de séries » existants ; (e) valeur par défaut (1 ?) et libellé exact pour HIIT (« Nombre de HIIT »).
2. Vignette HIIT du panneau de filtres du Catalogue (`sessionFormats.ts`, Figma `4168:11149`) absente de Figma : aucune vignette ajoutée (le panneau ne propose que Libre).
3. Écart Figma mineur : la zone de contexte du récapitulatif HIIT est en `#EAF3C8` (couleur de bande) alors que le mécanisme commun (30/30 conforme à Figma) utilise la couleur de fond `#F5F9E2` ; mécanisme commun conservé. Déroulé : teintes dérivées de la bande, comme pour tous les formats (Figma : `#C3DA85`).
4. Superset : l'écran du format plafonne encore à 2 mouvements (règle du 08/11 ; levée par le point 3, autre session) ; Tri-set / Giant set n'apparaissent dans la modale qu'une fois ce plafond levé (déjà visibles pour un Circuit Superset existant de 3 membres).

## Preuves et tests

- `npx tsc --noEmit` : OK.
- ESLint sur les fichiers modifiés : 0 erreur (1 avertissement antérieur, `formatTimeline.ts` `openGeneric`).
- Nouveaux : `formats.hiit.d608.test.ts` (6), `FormatModelScreen.d607-d608.test.tsx` (4), `migration041.hiit.test.ts` (2), `FormatsWindow.c2.test.tsx` (5, dont ordre et sous-titres des 12 cartes, carte HIIT) : PASS.
- Existants (`-w 1`) : `src/infrastructure/database/__tests__` entier (62 suites) + `formats.c1` : PASS après mise à jour des attentes de version (39 → 41), de l'ordre des colonnes de `tours` (`migration014`), des listes figées (017, 020) et de l'exemple d'origine inconnue (`elementFormats.c1`, « HIIT » → « CROSS_TRAINING ») ; formats (`formatModels.c3`, `formats.complement0511`, `configurationValidity.d4`, `formatSheetContext.d604`, `formatCapabilities.d3`, `FormatModelScreen.c3/.d603/.tableauUnique`, `formats.recette0611`, `recette3.circuits`, `sessionFormats.c1`), catalogue, planification, Superset (`CompositionScreen.supersetLimit`, `supersetLimit.recette0811`) : PASS.
- Non exécuté : suite complète (mémoire), Metro, simulateur, iPhone.

## Vérifications sur iPhone

- 14 : la fenêtre « Créer un exercice » montre les 12 cartes dans l'ordre, sous-titres complets sur deux lignes, cartes de hauteur égale.
- 15 : HIIT vert lime avec deux éclairs ; récapitulatif 6 séries, 40’’ / 20’’, 12′ pour deux mouvements ; enregistrement dans la séance (migration 041 appliquée au démarrage) ; exécution par alternance et par exercice.
- 19 : nom « Superset » à deux mouvements ; Tri-set / Giant set après levée du plafond (point 3).

## Classes documentaires (synchronisation code / documentation)

- 14 : A (conformité à § 9.10 / D-608 ; remplace « un mouvement, à régler » déjà annoté dans D-573).
- 15 : A pour le comportement ; D pour la migration 041 (choix technique : remplacement de colonne sans reconstruction, version 40 réservée) — à mentionner au chapitre 12 par la session principale.
- 19 : A (D-572 point 8).
- 22 : C (non arbitré, À CLARIFIER).

## Fichiers modifiés

Code : `src/domain/sessions/formats/registry.ts`, `formats/capabilities.ts`, `formatModels.ts`, `formatReedit.ts`, `formatTimeline.ts` ; `src/features/sessions/FormatsWindow.tsx`, `FormatModelScreen.tsx`, `FormatTables.tsx`, `formatSheetContext.ts`, `carrierPresentation.ts` ; `src/infrastructure/database/constants.ts`, `migrateDatabase.ts`, `migrations/migration041.ts` (nouveau) ; `src/shared/i18n/resources/fr.ts`, `enScreensActivities.ts` ; `assets/models/modele-hiit-eclair-petit.svg`, `modele-hiit-eclair-grand.svg` (Figma).
Tests : nouveaux fichiers ci-dessus ; attentes mises à jour dans les tests de migration (version), `migration014`, `migration017`, `migration020`, `elementFormats.c1`, `formats.c1`, `formatCapabilities.d3`, `sessionFormats.c1`, `FormatsWindow.c2`, `FormatModelScreen.d603`.

## Commit final et état Git

Voir le commit qui contient ce rapport (`git log -1` sur `feat/formats-ecran-hiit-20261126`) ; arbre propre après commit, aucun push.

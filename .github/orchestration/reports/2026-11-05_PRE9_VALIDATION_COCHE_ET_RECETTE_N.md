# 2026-11-05 — PRE-9 — Coche d'en-tête, ajout en mode catalogue, espacements (§18–§19) et corrections de la recette n-*

## Identifiant et objectif

- **Mission** : `PRE9_VALIDATION_COCHE_ET_RECETTE_N`.
- **Objectif** : appliquer les décisions du 5 novembre 2026 (§18–§19 du complément « Parcours de création », demande de Hermann en conversation) en trois commits séparés, puis corriger les écarts de la recette iPhone ciblée du 05/11 (cahier, lignes `n-*`).

## Branche et commit de départ

- Branche `pre9-bmad/dev`, départ `d90ffc3c`.
- `git pull` demandé : la branche n'a pas d'amont (`no upstream configured`) et n'existe pas sur `origin` ; `git fetch` : `main` toujours à `aab49948` (déjà intégré). Aucun changement à récupérer.

## Périmètre demandé

1. Validation des modales par la coche de l'en-tête (Formats : questionnaires, récapitulatifs, choix des mouvements ; Catalogue depuis la planification ; Planifier une séance / un parcours ; Fréquence), composant d'en-tête réutilisé, variante « Fermer et valider » de l'en-tête fixe, tests d'activation.
2. « + Ajouter » ouvre directement le mode catalogue ; étape intermédiaire et lien « Ouvrir / Fermer » supprimés.
3. Espacements du gabarit des Formats (Mouvements + 8, cartes 6, dernière carte → Paramètres 16).
4. Puis : corriger les écarts de la recette `n-*`.

## Périmètre réellement traité

- Points 1 à 3 : faits pour les Formats et le choix des mouvements. **Non faits** : planification, Catalogue depuis la planification, Fréquence — ces écrans n'existent pas sur la branche (`app/(tabs)/calendar.tsx` est un `PlaceholderScreen`, `src/features/planning/` ne contient qu'un README, l'action « Planifier » du Catalogue est grisée). La variante « Fermer et valider » de `FixedHeader` est prête pour eux.
- Recette `n-*` : corrections de création (modale, fiche par-dessus la modale, croix), fiche de l'exercice, cases rouges, unités AMRAP / Tabata / 30/30, tableaux. Deux décisions demandées à Hermann et tranchées (« Durée seule, sans choix » ; « 3 colonnes visibles »).

## Constats

1. Le document joint (§19) n'est pas dans le dépôt (copie de `docs/sources/formats-2026-11-05/` arrêtée au §18) : la demande est recopiée dans ch07.
2. Aucun composant d'en-tête de modale n'était partagé : l'en-tête de la feuille des Paramètres d'exécution a été extrait (`ModalHeaderActions.tsx`) sans changement de rendu ni d'identifiant.
3. n-menu (« Créer un exercice » ouvre la Composition) : non reproduit hors appareil ; même `push("/formats-window")` que l'ancienne option Format validée sur iPhone. Cause plausible : Exercice libre refermait la modale avant d'ouvrir la fiche — corrigé.
4. n-charge-switch « Suivant ne s'arrête pas aux charges » : non reproduit ; l'ordre passe déjà par la charge d'un mouvement chargé. Question posée dans le cahier (ligne `r-suivant`).
5. n-tabata contredisait le §15 (« modifiable au clavier, Répétitions ou Durée ») : arbitré par Hermann (« Durée seule, sans choix »).

## Preuves et tests

- `npx tsc --noEmit` : sans erreur.
- ESLint (fichiers touchés) : aucune nouvelle erreur ; restent préexistantes : « Cannot access refs during render » de `FormatModelScreen.c3.test.tsx` (Harness) et l'import `Alert` inutilisé de ce test.
- Suite complète `npx jest --maxWorkers=2` (avant les deux derniers ajustements) : 302 suites, 5 362 tests, 2 échecs ; corrigés ensuite :
  - `FormatModelScreen.c3` : libellé « (+ kg) » attendu → « +kg) » sous le nom (n-charge-switch), assertion mise à jour ;
  - `CompositionScreen.recette1` (« deux Circuits ») : vert seul (50/50 avec c3) — échec sous charge de la suite complète, sans lien avec les fichiers touchés.
- Tests ajoutés : `src/shared/ui/__tests__/ModalHeaderActions.test.tsx` (5), `app/__tests__/formatsWindowRoute.test.tsx` (4), `FormatModelScreen.c3` (coche ×4, « + Ajouter » mode catalogue, espacements, croix du questionnaire vers la modale), `formats.complement0511` (unités, 3).

## Hypothèses non démontrées

- Rendu et gestes sur iPhone : **aucune vérification visuelle faite par Claude** — le poste est sous Windows, sans simulateur iOS ; les captures avant/après demandées n'ont pas pu être produites.
- Fondu de 450 ms de la Composition sous la feuille native, fermeture directe vers le Catalogue (`dismissTo` depuis la feuille), retrait de la modale au retour d'une fiche validée : à confirmer sur iPhone.
- Trois colonnes visibles : largeur mesurée de la zone défilante / 3 ; une durée « 12 min 30 » doit tenir (minimum 66).

## Modifications réalisées

- **Point 1** (`e712e447`) : `ModalHeaderActions.tsx` ; `ExecutionParametersSheet` l'utilise ; `FixedHeader.validate` ; Formats : coche d'en-tête (`format-validate`, `format-save`, `format-catalogue-add`), `PrimaryActionZone` retiré, croix du mode catalogue sans ajout.
- **Point 2** (`40b7ffd9`) : saisie avec suggestions et lien retirés ; « + Ajouter » / « Changer » → mode catalogue en focus.
- **Point 3** (`5654df0f`) : `MOVEMENTS_TOP_OFFSET` 8, `CARD_GAP` 6, `parametersTitle` 16.
- **Recette n-*** (commit de ce rapport) : `formats-window.tsx` (fiche par-dessus, croix vers le Catalogue, retrait après fiche validée), `_layout.tsx` (fondu de la Composition), `FormatModelScreen` (croix du questionnaire vers la modale, cases rouges générales, message « seul en répétitions », barre d'unités absente pour Tabata / 30/30), `ActivityEditorForm` (« Dans cette séance » en dernier), `fr.ts` (titre des phases, libellés courts), `formatModels.ts` (`allowedModes`, `lastRepetitionsLocked`, Max retiré en Durée), `FormatTables.tsx` (tableau des séries sans colonne Unité, sous-titre, trois colonnes visibles, colonnes resserrées, Max grisé en Durée).
- **Documentation** : ch07 (demande §18–§19 points 1–3 ; décisions de la recette n-* et deux arbitrages), `spec-validation-coche-catalogue-2026-11-05.md`, `spec-complement-creation-formats-2026-11-05.md` § 8 ; cahier de recette (section « Corrections du 5 novembre au soir »).

## Complément — ajout d’un mouvement (demande du 05/11/2026 au soir)

Recherche sans focus, invite petite et gris clair, zone colorée fixe remontée de 8 (101) avec la ligne « Mouvements » à sa place absolue, zone de recherche figée sous elle (fond blanc 65 % → 10 %, champ de 36). Tests : suites des Formats (17 suites, 195 tests) vertes ; `tsc` et ESLint propres. Rendu non vérifié sur appareil.

## Complément — mouvements (demandes du 05/11/2026 au soir)

Carte Résultat de la saisie du nom : ouvre le mouvement. Fiche « Modifier un mouvement » : coche Valider en haut à droite, bouton du bas retiré (erreur d'enregistrement toujours affichée). « Créer un circuit » avec un circuit formaté : non reproduit, déclaré fonctionnel par Hermann ; test ajouté. Tests : 93 suites, 2 048 tests verts (activités, mouvements, en-têtes) ; `tsc` et ESLint propres.

## Complément — titres de modales centrés (05/11/2026)

En-têtes de modale à ✕ (et feuille « Ajouter un mouvement ») : titre centré sur la page. Tests : suite complète 303 suites, 5 363 tests, 1 échec sous charge seulement (`CompositionScreen.recette1`, instabilité connue, verte isolée, aussi avant la modification) ; `tsc` et ESLint propres. Vérification iPhone à faire.

## Complément — recette du 05/11 au soir, groupe A (Formats)

Coche / boutons du bas / mode catalogue selon les réponses du 06/11 (Q1, Q4). Tests : Formats et Composition 1 118 verts ; `tsc` propre ; ESLint : erreur `react-hooks/refs` et avertissement préexistants dans `FormatModelScreen.c3.test.tsx` (identiques au commit précédent).

## Complément — groupe B (zone de recherche)

Résultats de recherche affichés à partir du bas de la barre. Test `FormatModelScreen.c3` 43 verts ; `tsc` propre.

## Complément — groupe C (fiche de mouvement)

Coche en création, titre, fiche choisie en fondu, retours Composition / Catalogue, niveau → Catalogue, abandon sans blocage (hypothèse à vérifier sur iPhone). Tests ciblés : 3 011 dont 5 adaptés ; tous verts après adaptation ; `tsc`, ESLint propres sur les fichiers touchés.

## Complément — groupe D (glisser dans le Catalogue)

Carte portée suivie hors rendu. Test `MovementCatalogueList.fam` 14 verts (le nouveau échoue sur l’ancienne version) ; Catalogue 192 verts ; `tsc`, ESLint propres. Fluidité à vérifier sur iPhone.

## Éléments non corrigés ou hors périmètre

- Écrans de planification et Fréquence (absents).
- Documents dépendants à propager dans `main` (ch03, ch06, ch08, ch10, ch13, PRODUCT, référence Formats, DSF séries variables) : liste dans la spec du lot, § 3.
- n-menu et Suivant/charges : à revérifier sur iPhone (voir constats).

## Vérifications restant à effectuer sur appareil réel

Section « Corrections du 5 novembre au soir » du cahier (`p-*`, `r-*`), en iPhone standard et petit écran : questionnaire, récapitulatif clavier ouvert, choix des mouvements ; aucun chevauchement ; Déroulé lisible en bas.

## Fichiers modifiés

Voir `git show --stat e712e447 40b7ffd9 5654df0f` et le commit de ce rapport.

## Commit final et état Git

Commit contenant ce rapport : indiqué dans le message de livraison ; aucun push, aucune fusion dans `main`.

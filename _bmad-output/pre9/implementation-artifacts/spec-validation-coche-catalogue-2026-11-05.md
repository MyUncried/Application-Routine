# PRE-9 — Complément du 5 novembre 2026, §18–§19 : validation par la coche, ajout en mode catalogue, espacements

Statut : `review` (recette iPhone à faire). Branche `pre9-bmad/dev`, départ `d90ffc3c`. Un commit par point (1, 2, 3).

## 1. Source

Demande de Hermann du 05/11/2026 (conversation Claude Code), recopiée dans le registre (ch07, « Complément du 5 novembre 2026, §18–§19 »). Le document joint (« KODJO-Complement-Parcours-creation-2026-11-05.md », §18 et §19) n'est pas présent sur la branche : la copie de `docs/sources/formats-2026-11-05/` s'arrête au §18 « Développement et vérifications pour la revue ». Figma « Prototype MVP » : en-tête `11451:20561` « En-tête modal — Paramètres d'exécution » (croix/Retour 38, titre, coche 38 bleue) dans `8624:30392` (EMOM — Récapitulatif).

## 2. Point 1 — coche de l'en-tête (classe B)

- **Composant partagé** `src/shared/ui/ModalHeaderActions.tsx` : `ModalHeader` (croix, titre, coche), `ModalValidateAction` (cercle 38, `wheel-action-validate`, fond `wheelActionValidateBackground` si possible, `disabled` sinon), `ModalCancelAction`. Extrait à l'identique de l'en-tête de la feuille des Paramètres d'exécution, qui l'utilise désormais (aucun changement de rendu ni d'identifiant).
- **Variante « Fermer et valider » de l'en-tête fixe** : `FixedHeader` reçoit `validate={{ onPress, enabled, accessibilityLabel }}` — ✕ à gauche, coche à droite (`screen-header-validate`).
- **Formats** (`FormatModelScreen`) : coche dans l'en-tête de la modale, en face de la croix / du Retour ; `PrimaryActionZone` retiré, marge basse = zone sûre + 24.
  - Questionnaire : `format-validate` → récapitulatif ; active si `canSave` (mouvements suffisants — deux pour le Superset —, rôles requis).
  - Récapitulatif : `format-save` → enregistrement (création) ou « Enregistrer les modifications » (réédition) ; active si `canSave` (complétude, contrôle EMOM bloquant, réglages requis).
  - Questionnaires enregistrés directement (Tabata, 30/30, Renforcement, À l'échec à un mouvement) : `format-save` dès le questionnaire, comme avant.
  - Choix des mouvements (mode catalogue, buy-in compris) : `format-catalogue-add` → retour au questionnaire avec la sélection ; active si au moins un mouvement choisi. La croix du mode catalogue revient au questionnaire sans ajout.
  - Libellés retirés de l'écran, conservés comme libellés d'accessibilité de la coche.
- **Non réalisés — écrans absents de la branche** : Catalogue des séances ouvert depuis la planification, Planifier une séance, Planifier un parcours (écran et modale du Calendrier), Fréquence d'un contenu de parcours. Le Calendrier est un écran provisoire (`app/(tabs)/calendar.tsx`, `PlaceholderScreen`) ; `src/features/planning/` ne contient qu'un README ; l'action « Planifier » du Catalogue est grisée (CE-T03-01). La variante « Fermer et valider » est prête pour ces écrans.

## 2 bis. Point 2 — « + Ajouter » ouvre le mode catalogue (classe B)

- `FormatModelScreen` : « + Ajouter » et « Changer » (buy-in, buy-out ; le mouvement choisi est d'abord retiré, comme avant) ouvrent directement le mode catalogue, recherche en focus (`autoFocus`), filtres, tri et piles à côté du champ.
- Retirés : champ `format-search` et cadre des suggestions (`format-suggestions`, mesures au-dessus du clavier, rebond), lien « Ouvrir / Fermer le mode catalogue » et ses libellés `openCatalogue` / `closeCatalogue`. En mode catalogue, l'en-tête de section n'a plus de lien : la croix de l'en-tête revient au questionnaire sans ajout, la coche ajoute la sélection (point 1).
- Inchangée : la fiche de création d'un exercice (Exercice libre) et ses suggestions pendant la saisie du nom.
- Tests `FormatModelScreen.c3` : aide `pick` par le mode catalogue ; tests de la saisie intermédiaire remplacés (règle remplacée citée en commentaire) ; nouveau test « + Ajouter ouvre le mode catalogue ».

## 2 ter. Point 3 — espacements (classe B, rendu)

Gabarit commun aux dix Formats (`FormatModelScreen`, constantes et styles partagés) :
- ligne « Mouvements » (première section : Mouvements, ou Buy-in / En boucle) descendue de 8 (`MOVEMENTS_TOP_OFFSET`, haut du contenu = zone de contexte + 8, hors mode catalogue) ;
- écart entre deux cartes 6 au lieu de 8 (`CARD_GAP`, pas de déplacement par défaut 66) ;
- écart dernière carte → « Paramètres d'exécution » réduit de 8 : marge haute du titre 16 au lieu de 22, avec l'écart des cartes 6 au lieu de 8 (Figma : 24 → 16). Titre du Déroulé inchangé.
- Test `FormatModelScreen.c3` (« §19 : … espacements »).

## 2 quater. Ajout d'un mouvement — demande du 05/11/2026 au soir (classe B)

- Recherche du mode catalogue sans focus à l'ouverture (`autoFocus` faux) ; invite Regular 14 gris clair (`#B4B8C2`), texte saisi 16 noir.
- Zone de contexte (zone colorée) de taille fixe : 101 (au lieu de 109), plus prolongée en mode catalogue ; ligne « Mouvements » à sa place absolue (101 + 16 = 117, comme avant).
- En mode catalogue, la ligne « Mouvements » et la recherche forment une zone figée sous la zone de contexte (`format-search-zone`), à l'emplacement de la ligne « Mouvements » ; fond blanc de 65 % en haut à 10 % en bas (12 bandes) ; champ de 36 de haut (au lieu de 44) ; marge basse 4.
- Feuille des filtres arrêtée sous cette zone.
- Tests `FormatModelScreen.c3` adaptés (règle remplacée citée).

## 2 quinquies. Mouvements — demandes du 05/11/2026 au soir (classe B)

- Saisie du nom (Catalogue des mouvements) : toucher du corps de la carte Résultat → fiche du mouvement en consultation (`router.replace`, sans garde d'abandon : le nom tapé ne servait qu'à chercher) ; aussi dans l'écran de recherche. `MovementResultCard.onOpen`, `MovementSuggestionPanel.onOpenResult`, `MovementSearchScreen.onOpen`, `useMovementOriginChoice.onOpenMovement`.
- Fiche « Modifier un mouvement » : coche « Valider » à droite de l'en-tête (`EditorHeader.validate` → `FixedHeader.validate`), bouton du bas retiré en modification ; le message d'erreur d'enregistrement reste affiché en bas.
- « Créer un circuit » dans une séance qui porte un circuit formaté : non reproduit, puis constaté fonctionnel par Hermann ; test `CompositionScreen.envelopeFormat`.
- Tests : `MovementScreen.b2.integration` (carte qui charge le mouvement ; coche en modification ; aide `finishID`).

## 2 sexies. Titres de modales centrés — demande du 05/11/2026 (classe B)

- « Centrer horizontalement tous les titres de modales sur leur page. »
- `FixedHeader.centeredTitle` (par défaut : `closeIcon` ou `validate`) : titre en calque absolu sur toute la largeur, réserve symétrique mesurée (`onLayout` de l'action gauche et du groupe de droite) ; copie invisible dans la ligne pour garder la hauteur minimale X-4 ; un seul titre exposé à l'accessibilité. `MovementSelectionScreen` en feuille : `centeredTitle`.
- Déjà centrés, inchangés : `ModalHeader`, `FilterSheetPrimitives`, sélecteurs de référentiel, `FormatModelScreen`, dialogues.
- Tests : `ScreenShell.test` (3).

## 3. Documents dépendants (à propager dans `main`)

Mentions des boutons retirés, à annoter « remplacé » quand le §19 sera intégré dans `main` : ch03 (1), ch06 (4), ch08 (4), ch10 (2), ch13 Contrats d'écran (12), `docs/PRODUCT.md`, `docs/KODJO-Formats-entrainement-2026-11-02.md`, `docs/DSF-SERIES-VARIABLES-2026-10-02.md` (recherche : « Valider les paramètres », « Enregistrer dans la séance », « Enregistrer les modifications », « Ouvrir le mode catalogue »). Non modifiés sur cette branche : la source normative (§19) n'y est pas, et les fusions précédentes ont retenu le texte de `main` (règle « source normative absente de la branche »).

## 4. Tests

- `src/shared/ui/__tests__/ModalHeaderActions.test.tsx` : coche bleue/grise, appui refusé, ordre croix–titre–coche, variante « Fermer et valider » de `FixedHeader`.
- `FormatModelScreen.c3` : « coche de l'en-tête (§18–§19) » — questionnaire (grise sans mouvement, bleue ensuite, ouvre le récapitulatif, plus de bouton en bas), Superset (deux mouvements), récapitulatif (cellule vide → grise), EMOM (incomplet → grise). Assertions de libellé des boutons retirés converties en libellé d'accessibilité.

## 5. Vérifications sur appareil

Non faites par Claude : le poste est sous Windows, sans simulateur iOS. Voir le rapport de mission.

# Rapport de mission — DOC_CATALOGUES_CARTES_MODALES (6 novembre 2026)

## Identifiant et objectif

- **Mission :** `DOC_CATALOGUES_CARTES_MODALES`.
- **Objectif :** reporter dans le DSF Figma et dans la documentation toutes les décisions prises les 5 et 6 novembre 2026. Elles portent sur :
  - la validation des modales par la coche ;
  - le mode catalogue ;
  - les couleurs par catalogue ;
  - l'onglet et la zone de contexte ;
  - la carte Séance (repliée, déployée, Démarrer) ;
  - la carte Mouvement et les piles.

  La documentation couvre la spécification, les contrats d'écran, le registre, les tokens et les captures.

## Branche et commit de départ

- **Branche :** `docs/pre9-catalogues-cartes-modales-20261106`, créée depuis `origin/main`.
- **Commit de départ :** `aab499486813f01a9ea85bb6b0ed291c0f2ae190`.

## Périmètre demandé

Demande de Hermann : « mettre directement à jour le DSF figma (composant, variable d'écran, token de couleur...), la documentation avec les écrans figma, les contrats d'écran, et le contenu des spécification associées ».

## Périmètre réellement traité

### Figma

- **Variables :** six variables sémantiques `color/catalogue/{mouvements,seances,programmes}/{context,background}`, liées à des primitives.
- **Composants :**
  - « DSF / Cards / Séance » : variantes Repliée, Déployée et Archivée ;
  - « Carte — Mouvement » ;
  - « DSF / Navigation / En-tête fixe » : nouvelle variante « Fermer et valider », dont le titre est lié à la propriété Titre.
- **Descriptions :** les composants concernés portent une description à jour.
- **Planche DSF :** `11734:2100`, sur la page « Design system — Fondations ».
- **Écrans déployés :** catalogue des séances et catalogue des mouvements.
- **Modales de planification :**
  - Démarrer masqué ;
  - séparateur « · » ;
  - coche dans l'en-tête.
- **Formats :** coche dans l'en-tête, et « + Ajouter » qui ouvre directement le mode catalogue.

### Documentation

- **Nouvelle spécification normative :** `docs/KODJO-Catalogues-cartes-modales-2026-11-06.md`, qui porte les décisions D-499 à D-509.
- **Chapitres mis à jour :**

  | Chapitre | Modifications |
  |---|---|
  | 07 | nouvelle section de décisions, et annotations sur les anciennes formulations |
  | 06 | annotations, galerie « Captures du 6 novembre 2026 » de 82 exports, note de réexport des Formats, écrans supprimés `11335:19986` et `11335:20151` signalés |
  | 12 | tokens `color.catalogue.*`, et anomalie `selectionSurface` (D-509) |
  | 13 | contrats CE-CAT-CTX-01, CE-T03-01 et CE-MVT-03 |
  | 03, 08, 10 | annotations des libellés |

- **Autres documents annotés :** `PRODUCT.md`, `INDEX.md`, la référence Formats et les DSF ou specs antérieurs (Zones de contexte PRE-9, Carte et catalogue des séances, DSF Catalogue des séances, DSF Familles).
- **Images :** 82 exports dans `docs/Specifications-fonctionnelles/images/catalogues-2026-11-06/`. Les fichiers `images/figma-<nœud>.png` déjà référencés ont été remplacés par le même export.

## Synchronisation code / documentation

- **Classe B (évolution validée) :** D-499 à D-508. Ce sont les demandes explicites de Hermann des 5 et 6 novembre 2026.
- **Classe A (conformité) :** D-509. Le code utilise `colors.selectionSurface` #E5F0FF pour la bande de contexte, alors que la règle écrite est #EAEAFF. La correction de code n'est pas faite dans cette mission ; elle est consignée en anomalie.
- **Aucune correction préparée sans être appliquée.**

## Constats

- La variante « Fermer et valider » affichait « Titre » dans ses instances. La cause : sa propriété Titre n'était pas liée. Corrigé.
- Le titre des modales de planification n'est pas aligné de la même façon partout :
  - à gauche sur les écrans en pleine page ;
  - centré dans la modale ouverte depuis le Calendrier (`1992:5794`, `7594:34653`).

  Cet écart existait avant ce lot. Il est consigné en point ouvert (spec §9) et n'est pas corrigé.
- Certains documents antérieurs gardent les anciens libellés (« Valider les paramètres », « Ouvrir le mode catalogue »), notamment `docs/sources/`, `docs/archives/` et `docs/preparation/PRE-4`. Ce sont des sources historiques ; elles ne sont pas modifiées. `docs/figma-formats-2026-11-02/captures.json` référence encore les deux écrans supprimés ; ce manifeste historique n'est pas modifié.

## Preuves et tests

- **Aucun test applicable :** la mission est purement documentaire et Figma, sans code.
- **Contrôles réalisés :**
  - captures Figma relues visuellement après chaque modification ;
  - recherche ciblée des anciens libellés, avec annotation des documents normatifs ;
  - nombre d'images de la galerie égal au nombre de fichiers exportés (82).

## Hypothèses non démontrées

- La teinte Programmes (#EFE8FF / #FAF8FF) n'a été vue que sur la planche DSF. Il n'existe pas encore d'écran Programmes avec ces couleurs.

## Éléments non corrigés ou hors périmètre

- Écrans Programmes.
- Couleurs de la Composition et de la fiche Mouvement (inchangées).
- Contextes de cartes Calendrier et Suivi non migrés.
- Proposition AMRAP (au moins un exercice en Répétitions dans la boucle ; Max uniquement en Répétitions) : non arbitrée.
- Correction du code D-509.
- Harmonisation de l'alignement du titre des modales de planification.

## Vérifications restant à effectuer sur appareil réel

- Lisibilité du contraste fond teinté / cartes blanches / liseré à 50 % sur iPhone, en plein jour.
- Cibles de 44 pt pour Rechercher (34 pt visible), Démarrer (24 pt visible) et le chevron.
- Ombre et teinte de la pilule Démarrer.

## Fichiers modifiés

- **Créés :**
  - `docs/KODJO-Catalogues-cartes-modales-2026-11-06.md` ;
  - ce rapport ;
  - `docs/Specifications-fonctionnelles/images/catalogues-2026-11-06/*.png` (82 fichiers).
- **Modifiés :**
  - chapitres 03, 06, 07, 08, 10, 12 et 13 ;
  - `PRODUCT.md` et `INDEX.md` ;
  - `KODJO-Formats-entrainement-2026-11-02.md` ;
  - `KODJO-Zones-contexte-catalogues-PRE9-2026-10-30.md` ;
  - `KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md` ;
  - `DSF-CATALOGUE-SEANCES-2026-10-27.md` ;
  - `DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md` ;
  - les captures `images/figma-<nœud>.png` remplacées.

## Commit final et état Git

Le commit final et l'état Git sont donnés dans le compte rendu de livraison, car le hash n'existe qu'après la création du commit qui contient ce rapport.

# Epic A3 Context: Niveaux

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Exposer les groupes de niveaux dans l'interface. La fiche d'un Exercice affiche son niveau sous forme de pastille et donne accès, par un popover, aux actions « Changer de niveau » et « Ajouter un niveau ». Un écran permet aussi de consulter et de réordonner les niveaux d'un groupe. La progression reste linéaire et entièrement choisie par l'utilisateur : rien n'est rattaché, choisi ou fusionné automatiquement. Le dossier de planification ne contient que `epics.md`. Les règles qui font autorité sont D-439 (ch07), MFN-05, MFN-07 et MFN-08 (ch10), CE-T03-04 (ch13) et le relevé Figma MFN (voir Sources).

## Stories

- Story A3.1 : Pastille et popover de Niveau
- Story A3.2 : Consultation et réordonnancement des Niveaux

## Requirements & Constraints

- **Groupe de niveaux** :
  - Un geste appartient au plus à un groupe, et la progression est linéaire, sans branchement.
  - Le groupe n'est pas un objet nommé : le geste porte son appartenance et une clé de tri. Le rang et le total sont dérivés, jamais persistés dans l'Exercice ni dans l'historique.
  - Tous les Exercices qui partagent un geste partagent son niveau.
  - Le « niveau suivant » n'est ni une recommandation ni un passage automatique.
- **Pastille** :
  - Elle affiche « Niveau X » dans la rangée de classification, en troisième position après Catégorie et Zone.
  - Un geste sans groupe ou dans un groupe singleton n'affiche pas un faux « Niveau 1 » : l'état est vide, ou le rang est masqué. Un groupe singleton conserve son identifiant.
  - Le rang est annoncé en texte, jamais par la seule jauge.
  - Les trois variantes graphiques n'imposent aucune limite métier à trois niveaux. La représentation au-delà du rang 3 reste à compléter dans Figma.
- **Popover** : il propose « Changer de niveau / Ajouter un niveau », et le choix du niveau affiche aussi le total. Aucune quatrième action glissée n'est ajoutée au Catalogue : D-196 reste Planifier / Dupliquer / Archiver, et « Nouveau niveau » est retiré.
- **Changer de niveau** : choisir le niveau, puis choisir explicitement les paramètres quand ce niveau compte plusieurs Exercices. Ceux-ci sont distingués par le résumé de leurs paramètres. Aucun choix silencieux et aucune valeur par défaut (MFN/AC16).
- **Ajouter un niveau** :
  - L'action crée un nouveau geste et son Exercice, jamais un niveau seul. Les paramètres de l'original peuvent être repris.
  - La description, les médias et les zones sont initialisés depuis l'original, puis restent adaptables. Aucun média distinct n'est imposé.
  - La catégorie est reprise, puis reste librement modifiable.
  - Le niveau créé s'insère juste après son origine. Il est validé sans question d'identité, puisqu'il s'agit d'une variante explicite.
- **Réordonnancement** : il se fait par glissement explicite. Ce n'est pas une modification du geste et il ne déclenche pas la question d'identité. Retirer un membre ne modifie ni le contenu ni l'identité des autres, seulement les rangs et le total affichés. Aucune fusion d'identités n'a lieu, et les records restent séparés (MFN/AC07, AC33).
- **Historique** : il n'affiche jamais le rang ni le total (MFN-11). C'est hors périmètre de PRE-7, mais aucun champ de rang ne doit être ajouté.
- **Terminologie de l'interface** : exercice, geste, niveau, jamais « mouvement ».
- **Recette** : MFN/AC02, AC07, AC08, AC16 et AC33, plus les scénarios 5 et 6 du relevé Figma (niveaux 1, 2 et 3, groupe singleton, absence de groupe, réordonnancement, noms identiques, 360 / 402 / 440 et texte agrandi).

## Technical Decisions

- Le popover est construit sur `CircuitNatureMenu.tsx`, avec le menu natif SwiftUI `@expo/ui` et le repli `AnchoredPanel.tsx`. Utiliser la primitive native, sans la réimplémenter.
- Le réordonnancement réutilise `DraggableRow` de `sheetTable.tsx`, avec les actions accessibles Monter et Descendre, ainsi que `compositionMotion.ts` et `useAnimatedShift.ts`. La mécanique de glisser de la Composition n'est pas réutilisée.
- Le groupe est manipulé par les opérations de groupe de `MovementRepository` (A1.2) : rattacher, insérer après l'origine, réordonner, retirer. La création d'un niveau passe par la création avec origine « variante » (A1.3).
- L'écran de consultation des niveaux n'a pas de frame Figma. Il est composé uniquement de composants existants, classé `NON VÉRIFIABLE` et validé en recette. Aucun composant graphique ne doit être inventé.
- L'en-tête et la jauge du popover Figma (« 2 sur 3 ») sont d'anciens exemples et n'ont aucune autorité sur le rang réel.

## UX & Interaction Patterns

- Composants Figma : icône `icon/niveau` (`9932:44044`), sélecteur de classification au rôle Niveau, états Vide et Renseigné (`9925:41506`, `9925:41515`), Zone bleue (`9029:18368`). L'espacement de la rangée est de 12 pt, avec des zones élastiques tronquées pour préserver la catégorie et le niveau.
- Le popover est le nœud `9577:19843`. Cibles tactiles d'au moins 44 × 44.

## Cross-Story Dependencies

- Livrables de l'Epic A1 utilisés :
  - A1.1 : groupe et clé de tri du `Movement`, toujours présents ensemble, sans objet Niveau ;
  - A1.2 : opérations de groupe de `MovementRepository` ;
  - A1.3 : création avec origine « variante » et liste regroupée par geste.
- Éléments de l'Epic A2 utilisés : la rangée de classification et les contextes d'édition de A2.2, ainsi que la création et ses trois choix de A2.3. Le rattachement au groupe est proposé sans présélection.
- Ordre : A2.3 → A3.1 → A3.2 → A4.1. L'Epic A4 s'appuie sur la navigation entre niveaux depuis la fiche.

## Sources

- Plan : `_bmad-output/pre7/planning-artifacts/epics.md:19-31` (réutilisation), `:90-94` (Epic A3), `:108-117` (ordre), `:119-129` (risque du glisser, `:129`).
- Décisions : `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md:17-21` (D-439 et complément de présentation), `:374` (D-196).
- Règles : `docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md:357-378` (MFN-05), `:398-404` (MFN-07), `:410` (déclencheurs de MFN-08), `:458-460` (MFN-11), `:490-526` (MFN/AC).
- Contrats d'écran : `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md:157` (`NON VÉRIFIABLE`), `:775`, `:862`.
- Navigation : `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:612-618`.
- Relevé Figma : `docs/DSF-MOUVEMENT-FILIATION-NIVEAUX-2026-10-23.md:16`, `:20-31`, `:53-54`, `:64`, `:68-70`, `:79-80`.
- Continuité : `_bmad-output/pre7/implementation-artifacts/epic-A1-context.md:17`, `:35`, `:39`.

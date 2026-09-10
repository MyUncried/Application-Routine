# KODJO — Consolidation documentaire UI du 4 septembre 2026

## Périmètre

Cette livraison aligne la documentation de référence et les captures sur le Figma courant, sans modification du code applicatif.

## Décisions intégrées

### Roulettes

- composant DSF : `Picker / Popover — Source exact` (`2537:1174`) ;
- variante Durée : `2537:1110` ; variante Heure : `2884:4415` ;
- hauteur compacte `190` : barre d’actions `40` + primitive native `150` ;
- deux cadres de sélection gris distincts `56 × 34`, rayon `17`, couvrant uniquement les chiffres ;
- unités hors cadres ; aucun cadre continu ni cadre bleu supplémentaire ;
- brouillon local pendant le défilement, application uniquement après Valider ;
- l’état `Création activité — Récupération — Durée — sélecteur ouvert` (`1992:9800`) contient une seule roulette canonique.

### Dialogues de décision

- composant DSF : `Overlay / Decision Dialog` (`2590:2961`) ;
- dialogue flottant centré, largeur `354`, rayon `18`, jamais ancré au bas de l’écran ;
- écart dernière ligne de message / première action : `spacing/16` ;
- deux choix : deux boutons `147 × 48`, écart horizontal `12` ;
- trois choix : deux actions destructives sur la première ligne, puis `Annuler` neutre `306 × 48` sur la seconde, écart vertical `12` ;
- action destructive : fond rouge et texte blanc ; action neutre : fond gris et texte sombre ; action principale : fond bleu et texte blanc ;
- libellés centrés horizontalement et verticalement.

Libellés validés :

- suppression d’une planification unique : `Annuler` / `Confirmer` ;
- suppression périodique : `Seulement cette occurrence` / `Toutes les occurrences à venir`, puis `Annuler` ;
- abandon de création : `Annuler` / `Confirmer` ;
- suppression d’une séance archivée : `Annuler` / `Confirmer`.

### Ordre des contrôles d’une Activité

Ordre canonique :

1. `Nom de l’activité` ;
2. `Type d’activité` — `Exercice / Récupération` ;
3. `Mode d’exécution` ;
4. paramètres propres à l’Activité.

### Champ Nom de la séance

- composant DSF : `Session / Name Field — Source exact` (`2537:1480`) ;
- dimensions inchangées : `354 × 42` ;
- fond transparent, laissant apparaître la couleur de séance ;
- liseré blanc intérieur `1` ;
- token Figma ajouté : `color/session-name-border` (`VariableID:3163:4015`) ;
- correspondance documentaire/code : `color.sessionNameBorder`.

Propagation contrôlée sur les neuf nœuds : `2028:11152`, `2028:11314`, `2028:11391`, `2028:11473`, `2028:11596`, `2028:11715`, `2028:11823`, `2028:11936`, `2028:12018`.

## Fichiers documentaires modifiés

- `docs/Specifications-fonctionnelles/03 – Parcours utilisateur.md`
- `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md`
- `docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md`
- `docs/Specifications-fonctionnelles/12 – Architecture technique.md`
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`

## Captures actualisées depuis Figma

- `composition-etat-initial.png`
- `composition-nom-renseigne.png`
- `composition-couleur-ouverte.png`
- `composition-nombre-tours.png`
- `composition-actions-glissees.png`
- `composition-seance.png`
- `composition-compte-rebours-ouvert.png`
- `composition-fin-seance-ouverte.png`
- `creation-activite-duree-ouverte.png`
- `creation-activite-pause-ouverte.png`
- `creation-recuperation-duree-ouverte.png`
- `planifier-heure-ouverte.png`
- `planifier-rappel-ouvert.png`
- `abandon-creation.png`
- `calendrier-suppression-unique.png`
- `calendrier-suppression-periodique.png`
- `suppression-seance-archivee.png`

## Contrôles effectués

- propriétés du composant DSF et des neuf champs de Composition relues après propagation ;
- fond vide et liseré lié au token vérifiés sur chaque nœud ;
- dimensions `354 × 42` inchangées ;
- capture de `Composition d’une séance — sans Cycle` (`2028:11700`) relue visuellement ;
- recherche transversale des anciens libellés et des anciennes dimensions de roulette ;
- aucune modification du code applicatif ; aucun commit ni push réalisé dans cette livraison différentielle.

# Rapport de mission — LANGUES-MAQUETTES (23 novembre 2026)

## Identifiant et objectif

- **Mission :** `LANGUES-MAQUETTES`.
- **Objectif :** maquettes Figma nécessaires à la gestion des langues : Langue, Unité de charge, alias d'un mouvement.
- **Hors périmètre :** code applicatif ; traductions.

## Branche et commit de départ

- **Branche :** `docs/agenda-seances-journal-filtre-20261121` (PR #448).
- **Commit de départ :** `f02c9309`.

## Périmètre traité

- **Emplacement (D-569) :** Langue et Unité dans Profil › Préférences (section en tête), et non dans Compte ni sous la silhouette (zone de contexte à hauteur fixe). Proposé par Claude, validé par Hermann. Conséquence : l'étape 1 ne dépend plus de l'onglet Compte de la branche des Programmes (présence de Préférences sur `main` à vérifier dans le code).
- **Figma :**
  - « Profil — Préférences » `1992:684` : section « Langue et unités » ajoutée ; sections suivantes décalées de 136.
  - Composant « DSF / Formulaires / Autres noms » `13108:28259` (page Design system, à côté des Phases du mouvement).
  - Nouvel écran « Mouvement — Contenu éditable — Autres noms » `13108:28285` (vue défilée) ; l'écran « Mouvement — Contenu éditable » est inchangé.

## Constats

- Le sélecteur segmenté du design system (354 de large) a été repris et réduit (96 × 32) pour kg · lb, détaché de son composant : à remplacer par le contrôle segmenté natif dans le code.

## Synchronisation code / documentation

- Classe B : D-569. Aucun code modifié.

## Preuves et tests

- Aucun test applicable. Captures Figma relues ; `git diff --check`.

## Vérifications restant à effectuer sur appareil réel

- Lisibilité de « Unité de charge » et du sélecteur ; longueur des textes en anglais et en allemand.

## Fichiers modifiés

- Registre ch07 ; ce rapport.

## Commit final et état Git

Donnés dans le compte rendu de livraison.

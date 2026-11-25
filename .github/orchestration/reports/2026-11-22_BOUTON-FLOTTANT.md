# Rapport de mission — BOUTON-FLOTTANT (22 novembre 2026)

## Identifiant et objectif

- **Mission :** `BOUTON-FLOTTANT`.
- **Objectif :** remplacer les actions de création de la zone de contexte par un bouton flottant, dans Figma puis dans la documentation, et rédiger le prompt de la mission de modification.
- **Hors périmètre :** aucun code.

## Branche et commit de départ

- **Branche :** `docs/agenda-seances-journal-filtre-20261121` (PR #448, non fusionnée).
- **Commit de départ :** `4e9fec9b`.

## Périmètre traité

**Figma :**
- composant `DSF / Actions / Bouton flottant — Créer` (`13039:49732`), avec six variantes : Plus, Calendrier, Mouvement, Séance (symbole liste existant), Programme (carnet), Fermer ;
- déploiement :
  - Journal et Agenda : calendrier « + » ;
  - catalogues : mouvement, séance ou programme « + » ;
  - composition : « + » ;
- zones de contexte :
  - boutons de création retirés ;
  - recherche élargie ;
  - Agenda et Plan centrés sur l'écran, entonnoir en miroir ;
- composition :
  - « + » et sablier retirés de la zone de contexte (36 écrans) ;
  - menu Créer ouvert vers le haut depuis le bouton, avec « Ajouter un point d'arrêt » ;
- planche de comparaison des styles `13021:19`, conservée comme trace ;
- écrans de test supprimés.

**Documentation :**
- nouveau `docs/DSF-BOUTON-FLOTTANT-2026-11-22.md` ;
- registre (ch07) : D-558 et D-559, D-555 annoté ;
- contrats d'écran (ch13) : menu Créer annoté, complément ;
- ch06 ;
- DSF Agenda, DSF Journal et DSF Plan ;
- INDEX.

## Constats

- **Identifiants :** D-558 et D-559 sont libres sur toutes les branches distantes.
- **Choix retenus par Claude**, à partir de « le bouton est flottant, donc par définition on peut le déplacer », non promus au-delà :
  - le bouton se range contre le bord le plus proche ;
  - sa position est conservée sur l'appareil, pour tous les écrans.
- **Écran « Modal — Planifier une séance — Sélectionner une séance » (`7599:14197`)** : son bouton « Planifier » de fond est retiré, mais aucun bouton flottant n'y a été ajouté, puisqu'une modale le recouvre.

## Synchronisation code / documentation

Classe B : D-558 et D-559. Le code n'est pas modifié ; la mission de modification est à lancer.

## Preuves et tests

- **Aucun test applicable** (mission documentaire et Figma).
- **Contrôles :**
  - `git diff --check` ;
  - captures Figma relues : Journal, Agenda, Plan, catalogues, composition et menu ;
  - recherche des formulations du menu Créer (trois options, « + » devenant Annuler, sablier à gauche) : toutes annotées.

## Vérifications restant à effectuer sur appareil réel

- Lisibilité du verre sur les cartes colorées de l'Agenda.
- Déplacement du bouton : distinction entre le glissement et le défilement de la liste.

## Fichiers modifiés

- **Créés :**
  - `docs/DSF-BOUTON-FLOTTANT-2026-11-22.md` ;
  - ce rapport.
- **Modifiés :**
  - DSF Agenda, DSF Journal et DSF Plan ;
  - `docs/INDEX.md` ;
  - chapitres 06, 07 et 13.

## Commit final et état Git

Donnés dans le compte rendu de livraison.

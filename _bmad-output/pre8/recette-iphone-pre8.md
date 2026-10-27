# PRE-8 — Recette iPhone différentielle des epics A et B

> Préparée le 27/10/2026 sur `pre8-bmad/dev` (commit consigné dans le rapport de mission). Aucun parcours n'est validé : la validation appartient à Hermann, sur appareil (360 / 402 / 440, iOS 26, texte agrandi). Delta par rapport à `main` @ `082390c0` (PR #401).

**Cahier interactif** (cases, Problème, Remarque, résultats lisibles par Claude) : https://claude.ai/artifact/KR5M1XyoWc4eDFpAE5bZBV — URL du serveur au 27/10 : `https://fi5f9dc-uncried-8081.exp.direct` (tunnel ; binaire ngrok ARM64 copié depuis le clone PRE-7 dans `node_modules`, hors suivi).

## Avant d'installer

- **Base attendue sur l'appareil** : schéma **13** (dernière version issue de `main`, PRE-7). PRE-8 la porte au schéma **15** au premier lancement : 014 (structure de Séance, sans perte) puis 015 (colonne d'archivage des Mouvements, additive).
- **Retour arrière impossible** : une version de `main` (schéma 13) refuse d'ouvrir une base 15 (« Database version 15 is newer than supported version 13 »). Elle n'efface rien ; réinstaller PRE-8 rouvre la base telle quelle. Pour garder intacte la base de l'application principale, tester dans **Routine BMAD** (`com.ankusha.kodjo.bmad`), qui a ses propres données.
- **Conservation des données, tests automatiques** : `migration014.test.ts` (copie de base fichier au schéma 013 peuplée : Séances aux trois zones, Points d'arrêt aux trois portées, Exercices du Catalogue, rangs non contigus ; aucune ligne supprimée ; annulation complète sur échec) ; `migration015.test.ts` (copie au schéma 014 : aucun Mouvement archivé ni réécrit, familles et ordre conservés ; annulation complète sur échec ; installation neuve) ; `sessionStructure.a4.test.ts`. Ces tests ne remplacent pas le premier lancement sur l'appareil.
- **Aucune dépendance native modifiée** (`package.json`, `app.json`, `app.config.js`, `eas.json` identiques à `082390c0`) : le build de développement Routine BMAD déjà installé suffit.

## Ouvrir PRE-8

1. Arrêter tout autre serveur Expo. Depuis `C:\Dev\KODJO-BMAD-PRE8` (PowerShell) : `$env:APP_VARIANT='bmad'; npx expo start --dev-client --tunnel --scheme routine-bmad --port 8081`.
2. Sur l'iPhone, ouvrir l'application de développement **Routine BMAD** (jamais Expo Go).
3. Scanner le QR code du terminal ou saisir l'URL `exp.direct` qu'il affiche.

## A — Migrations et Séances (premier lancement)

- [ ] Premier lancement : aucun avis de réinitialisation.
- [ ] Séances : mêmes titres, Exercices, ordre, Circuit et nombre de Tours, Exercices avant et après le Circuit, Points d'arrêt aux mêmes places.
- [ ] Exercices du Catalogue (segment Exercices) : tous présents, paramètres identiques.
- [ ] Composition : ouvrir, modifier, enregistrer une Séance existante ; rouvrir : modification conservée.
- [ ] Second lancement : aucun avis, rien de perdu.

## B — Fiche Mouvement (Catalogue → Mouvements)

- [ ] `Créer` : gabarit photo sous la zone de contexte ; ajout, consultation, retrait et réordonnancement des médias ; description en étapes ; phases (invite, saisie, déplacement, retrait) ; aucune carte Paramètres.
- [ ] Nom déjà utilisé : message, brouillon conservé.
- [ ] Ouvrir un Mouvement : consultation, crayon → édition ; dialogue de sauvegarde (aucun texte sous « Créer un nouveau mouvement »).
- [ ] Menu Niveau : consulter un autre membre ; « Ajouter un niveau » plus facile / plus difficile.

## B — Catalogue des Mouvements

- [ ] Quatre segments lisibles à 360 pt ; Mouvements en premier.
- [ ] Pile : rang le plus haut en tête, épaisseur visible ; toucher → pile dépliée (rangs décroissants, trait à gauche) ; toucher une carte → fiche ; toucher le trait → pile repliée.
- [ ] Recherche (nom, alias) : piles dépliables de la même manière ; « Aucun mouvement ne correspond… ».
- [ ] Glisser une carte vers la gauche : Partager grisé, Créer une variante, Archiver ; retour au balayage droit ; le défilement vertical reste possible.
- [ ] Créer une variante → Plus facile / Plus difficile → fiche de la variante (Catégorie, Zones, nom commencé repris).
- [ ] Archiver un Mouvement utilisé : « Archivage impossible — … utilisé par N exercices… », J'ai compris, rien ne change.
- [ ] Archiver un Mouvement inutilisé : il disparaît, snackbar « Mouvement archivé » ; Annuler le rétablit. Rangs des autres membres inchangés.
- [ ] Filtres : feuille ✕ / ✓, Réinitialiser ; Archivés seul ; Actifs + Archivés ; Catégorie ou Zone dans une pile (la pile garde ses autres membres actifs) ; Utilisation, Niveaux ; résumé « N filtres » dans la commande ; filtres conservés en changeant de segment, perdus au relancement. Trier grisé.
- [ ] Archivés : Restaurer (snackbar, Annuler) ; Supprimer → « Supprimer ce mouvement ? », Annuler ne change rien, Confirmer supprime sans annulation.
- [ ] Fiche d'un archivé : consultation sans crayon.
- [ ] Création d'un Exercice (Composition ou Catalogue des Exercices) : un Mouvement archivé n'est plus suggéré ; dans le menu Niveau d'un Exercice, son niveau est grisé.
- [ ] VoiceOver : actions de carte (Créer une variante, Archiver, Restaurer, Supprimer) ; pile annoncée « N niveaux affichés ».

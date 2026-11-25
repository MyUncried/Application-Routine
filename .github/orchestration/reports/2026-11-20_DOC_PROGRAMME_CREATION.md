# Rapport de mission — DOC_PROGRAMME_CREATION (20 novembre 2026)

## Identifiant et objectif

- **Mission :** `DOC_PROGRAMME_CREATION`.
- **Objectif :** mettre à jour la documentation avec les décisions du 20/11/2026 sur les écrans de création d'un programme. Le Suivi est exclu (demande de Hermann : « sur les écrans de création d'un programme, pas encore sur le suivi »).

## Branche et commit de départ

- **Branche :** `docs/programme-creation-20261120`, créée depuis `origin/main`.
- **Commit de départ :** `5fe5e519`.

## Périmètre demandé

« Mets à jour la documentation », limité aux écrans de création d'un programme.

## Périmètre réellement traité

- **Nouvelle spécification :** `docs/KODJO-Programme-catalogue-creation-configuration-2026-11-20.md`. Elle couvre :
  - le catalogue des programmes et ses actions glissées ;
  - la suppression d'un programme ;
  - la modale de création et de configuration ;
  - le suivi de la douleur ;
  - l'onglet Confidentialité du Profil ;
  - les composants du design system modifiés.
- **Registre (ch07) :** section « Programme — catalogue, création et configuration (20/11/2026) », décisions D-543 à D-552.
- **Contrats d'écran (ch13) :** CE-PROG-01 à CE-PROG-03, et CE-PRF-01.
- **Annotations datées :**
  - ch04 : « Paramétrage de l'option : À CLARIFIER » est résolu ; la création d'un programme est conçue ;
  - ch05 : point ouvert 3 ;
  - ch06 : onglets du Profil ;
  - ch12 : jetons Programmes, qui ont désormais des écrans ;
  - `INDEX.md`.

## Synchronisation code / documentation

- **Classe B (évolution validée) :** D-543 à D-552, demandes et validations explicites de Hermann du 20/11/2026.
- **Classe A :** la coche de la modale suit D-499 (active quand les données sont complètes et cohérentes).
- **Aucune correction de code dans cette mission.**

## Constats

- **Numérotation :** une branche non fusionnée, `docs/planification-grille-creneaux`, utilise les décisions D-516 à D-542. La numérotation commence donc à D-543 pour éviter une collision à la fusion.
- **Document de conception Programme :** la V1.2 de `Programme / Modèle de Programme` reste introuvable dans le dépôt (constat du ch05 inchangé).

## Preuves et tests

- **Aucun test applicable :** la mission est documentaire.
- **Contrôles réalisés :**
  - recherche ciblée des formulations contraires (« Archiver le programme », « Arrêter le programme », « Enrôler », onglets du Profil) ;
  - `git diff --check`.
- Les écrans Figma cités ont été relus visuellement au moment de leur modification, pendant la session.

## Hypothèses non démontrées

- La règle de suppression « comme les routines » renvoie à la modale « Supprimer une routine avec historique — Journal ». Sa formalisation détaillée se trouve sur des branches de planification non fusionnées.

## Éléments non corrigés ou hors périmètre

- **Suivi :** les écrans de résultats d'un programme sont rangés sur la ligne Suivi et restent à concevoir.
- **Rattachement :** la proposition automatique de rattachement et l'avertissement « hors période » ne sont pas traités.
- **Captures :** aucun export d'image dans `docs/`.

## Vérifications restant à effectuer sur appareil réel

- Lisibilité des dates bleues sans cadre et des trois boutons de la modale de suppression.

## Complément du 20/11/2026 (soir)

- Écran 13b refait sur la modale de l'écran 13, boutons Annuler | Autoriser côte à côte.
- Suivi de la douleur : défini dans le programme, état déduit dans Profil › Confidentialité (retrait de l'accord, effacement). D-551, spécification §5–6, CE-PROG-02 et CE-PRF-01 mis à jour.

## Fichiers modifiés

- **Créés :**
  - `docs/KODJO-Programme-catalogue-creation-configuration-2026-11-20.md` ;
  - ce rapport.
- **Modifiés :**
  - chapitres 04, 05, 06, 07, 12 et 13 ;
  - `docs/INDEX.md`.

## Commit final et état Git

Le commit final et l'état Git sont donnés dans le compte rendu de livraison.

# 2026-11-10 — CATALOGUE-CONNECTÉ — Plan de trajectoire (application ↔ administration Web locale)

## Identifiant et objectif

- **CATALOGUE-CONNECTÉ** : plan de trajectoire vers la cible fixée par Hermann le 10/11. Rien n'est développé dans cette mission.
- Cible, verbatim :
  > « Soyons clair, je gère l'ensemble du projet seul, et les données ne sont que des données de test. Je veux aller au plus vite vers la cible suivante : Un écran de gestion des catalogues dans le Profil ; L'interface de gestion des fiches de mouvements dans mon interface web locale, avec la possibilité de charger les mouvements présents uniquement sur l'application vers le site web d'administration qui a déjà été commencé ; Le chargement des fiches mouvements dans BMAD ; La poursuite de la recette avec la gestion des fiches de mouvement connectée »
- Arbitrages de Hermann, même jour :
  - « BMAD » = **ligne de développement BMAD** de l'application Routine ;
  - intégration **maintenant**, sur une **nouvelle branche partant de la ligne PRE-10**, sans modifier les branches PRE-10 ;
  - échange application ↔ administration par le **réseau Wi-Fi local**, avec un code d'appairage ;
  - administration à faire évoluer : **l'administration locale Node**.
- Dossier de passation de ChatGPT : « KODJO — Administration Web des Mouvements : état fonctionnel et technique vérifié » (10/11/2026). Il a été lu et il est cohérent avec les branches constatées (PR #429 Node locale, PR #432 statique OVH avec médias).

## Branche et commit de départ

- Plan rédigé sur `catalogue/integration-60-main-20261109` (`3b8b87e1`, CA-4).
- Base proposée pour la branche d'intégration : `origin/composition-phases-duree` (`f5bb4316`).
  - Elle contient `pre10-bmad/dev`, plus D-514 et D-515 (durée de série, phases du Mouvement).
  - C'est la ligne du dossier de travail PRE-10.
  - La fusion du catalogue y est **sans conflit** (`git merge-tree`).

## Constats

1. **Deux administrations existent** et ne sont pas interchangeables :
   - **Node locale** (PR #429) : serveur `127.0.0.1:4738`, persistance `catalogue/admin/brouillons.json`, contrôles Host/Origin/CSP, **sans les médias** ;
   - **statique OVH** (PR #432) : un seul `index.html`, médias compris, état en mémoire, export/import JSON.
2. **Ni l'une ni l'autre ne connaît le format autonome v1.** Elles éditent des **surcharges** (`KODJO_ADMIN_DRAFTS`) des 60 fiches figées et ne créent aucune fiche.
3. Le serveur local n'écoute que `127.0.0.1` : l'iPhone ne peut pas le joindre.
4. Côté application, sur la branche catalogue : format v1, registre, services et écran de recette (CA-1 à CA-4).
5. Prérequis natifs iOS pour joindre un PC en `http://` sur le Wi-Fi local :
   - autorisation de réseau local (`NSLocalNetworkUsageDescription`) ;
   - exception ATS pour le réseau local (`NSAllowsLocalNetworking`).
   Ce sont des **changements de configuration native**, qui exigent une **nouvelle build**.

## Trajectoire proposée (tranches courtes, dans l'ordre)

| Tranche | Contenu | Réemploi |
|---|---|---|
| **W1 — Administration sur le format v1** | Le serveur Node sert l'interface de la page OVH, la plus complète (médias compris), adaptée au format v1 : <br>— ouverture et enregistrement de `catalogue/catalogues/*.catalogue.json` ; <br>— **création de fiche** ; <br>— édition de toutes les propriétés (contenu, classification, provenance, sources, validation, médias) ; <br>— **révision automatique** à l'enregistrement d'une fiche modifiée (révision + 1, entrée d'historique) ; <br>— validation par le **même validateur** que l'application. <br>Import des anciens brouillons conservé pour la conversion. | `server.mjs` (sécurité, écriture atomique, contrôle de concurrence), page OVH (onglets, formulaire, médias), `parseMovementCatalogueFile`, `sheetFingerprint` |
| **W2 — Connexion Wi-Fi** | Le serveur écoute aussi sur le réseau local, avec un **code d'appairage** affiché au lancement. Il expose : <br>— la liste des catalogues ; <br>— le téléchargement d'un catalogue (même format, option B) ; <br>— une **boîte d'arrivée** des mouvements envoyés par l'application. <br>Aucune exposition Internet. | `server.mjs`, format v1 |
| **A1 — Écran « Catalogues » dans le Profil** | Entrée **Profil → Catalogues** : catalogues installés (registre), chargement depuis un fichier ou **depuis l'administration (Wi-Fi)**, décisions fiche par fiche (écran CA-4 réemployé) | `CatalogueLoadService`, `CatalogueLoadScreen`, registre |
| **A2 — Envoi des mouvements de l'application** | « Envoyer mes mouvements à l'administration » : les Mouvements qui ne sont rattachés à aucune fiche partent vers la boîte d'arrivée. Dans l'administration, « **Ajouter au catalogue** » crée la fiche, avec son Mouvement d'origine dans `install.knownLocalMovementIds`. Au chargement suivant, le téléphone la reconnaît comme **déjà présente** : ni doublon, ni écriture. | Projection inverse (Mouvement → contenu de fiche), `knownLocalMovementIds`, état `ADOPTABLE` |
| **B1 — Ligne BMAD** | Branche d'intégration depuis `composition-phases-duree` + catalogue (CA-1 à CA-4, W, A) ; story BMAD dans `_bmad-output/` ; synchronisation documentaire | Organisation `_bmad-output/<lot>/` existante |
| **R — Recette connectée** | Build de développement de Routine avec réseau local, appairage, aller-retour complet. Cahier de recette OK/KO en ligne. | Cahier de recette en ligne (format PRE-9) |

**Suppression à prévoir** : l'outil « Importer 60 fiches » et le corpus embarqué (CA-5) deviennent inutiles une fois A1 livré.

## Points à arbitrer avant le développement

1. **Figma** : l'écran Profil → Catalogues est un écran produit. Il peut être livré d'abord sans maquette, avec les composants existants, puis porté dans Figma. Sinon, la maquette doit précéder le développement.
2. **Builds** : W1 et W2 n'en demandent aucune (PC seulement). A1, A2 et R exigent une build de développement de Routine, à cause de la configuration native pour le réseau local. **Chaque build reste soumise à l'accord explicite de Hermann.**
3. **Administration OVH** : elle reste **inchangée**. Il n'y a ni remplacement ni dépôt sur OVH sans accord.
4. **Base personnelle** : Hermann précise que les données sont des données de test. Le chargement dans la base de Routine est donc possible pendant la recette R, mais pas avant la build autorisée.

## Preuves et tests

- Aucun test applicable : plan seulement, aucun code modifié.
- Vérifications faites :
  - branches distantes de l'administration (#429, #432, #434) ;
  - relation entre `pre10-bmad/dev` et `composition-phases-duree` ;
  - absence de conflit à la fusion de la branche catalogue dans `composition-phases-duree`.

## Hypothèses non démontrées

- La connexion Wi-Fi de l'iPhone vers le PC (pare-feu Windows, isolement des clients sur certaines box) n'est pas vérifiée. Elle le sera en W2, avec un essai depuis le navigateur Safari de l'iPhone **avant** toute build.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-10_CATALOGUE-CONNECTE-PLAN.md`

## Commit final et état Git

Commit documentaire sur `catalogue/integration-60-main-20261109` ; hash communiqué dans le compte rendu de session. Aucune modification de PRE-10, aucune build, aucune OTA, aucune fusion dans `main`, aucun accès à OVH.

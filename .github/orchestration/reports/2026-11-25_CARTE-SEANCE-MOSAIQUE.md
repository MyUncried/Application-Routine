# 2026-11-25 — CARTE-SEANCE-MOSAIQUE : carte de séance du catalogue (mosaïque et informations) et marquage des photos

## Mission

- **Objectif** : prompt « Claude Code — carte de séance du catalogue : mosaïque et informations (24/11/2026) ». Appliquer D-564, D-565 et D-567 de la branche `docs/planification-grille-creneaux` (lue sans fusion) à la carte **repliée** du catalogue des séances, après le prérequis « marquage des photos ».
- **Sources** :
  - DSF `docs/DSF-CARTE-SEANCE-VISUEL-INFOS-2026-11-24.md` et registre de `docs/planification-grille-creneaux` (`e3275304`) ;
  - Figma `G6RY5Ebhgwb4AHIOYDwwvg` : `DSF / Cards / Séance — catalogue` (`5544:6426` ; Repliée `13168:28159`, Sélection `13186:50543`) et `DSF / Cards / Séance — mosaïque` (`13169:28171`), lus par `use_figma` et `get_design_context`.
- **Départ** : `origin/main` `aaaa4b63`.
- **Branches** :
  - `feat/marquage-photos-20261125` (worktree `C:\Dev\KODJO-MARQUAGE`) : prérequis, format, stockage et outil Web ; elle inclut `feat/marquage-photos-web-20261125`, développée par un sous-agent ;
  - `feat/carte-seance-mosaique-20261125` (worktree `C:\Dev\KODJO-MOSAIQUE`) : la carte. Elle est empilée sur le marquage et fusionne `feat/agenda-icones-etat-20261124` (PR #456) pour réutiliser le bouton Démarrer de D-599.

## Numéros de décision

Collision technique, tranchée sans arbitrage (consigne de Hermann du 24/11) : D-564, D-565 et D-567 désignent déjà d'autres règles sur `main`. D-566 y est D-599.

| Branche de documentation | main |
|---|---|
| D-564 | **D-600** |
| D-565 | **D-601** |
| D-566 | **D-599** |
| D-567 | **D-602** |

Le registre a une nouvelle section « Carte de séance du catalogue — 24-25/11/2026 (implémentation) ». Le DSF est reporté sur `main` avec une note de numérotation.

## 0. Prérequis : marquage des photos (vérifié absent, livré d'abord)

- **Constat** : aucun champ de vue n'existait (format du catalogue, `MediaAsset`, SQLite).
- **Format** : champ facultatif `media[].view {x, y, width, height}` en pourcentage, réservé aux photos et validé par le domaine partagé (`isValidMediaView`). Commit `e7c6813f`.
- **Application** (`05282882`) :
  - `migration040` (version 40) : colonnes nullables `media_assets.view_*` (0–100) ;
  - `MediaAsset.view`, lecture et écriture par `SqliteMediaRepository` ;
  - import du catalogue : la vue suit la photo. Un asset persisté étant immuable, une vue corrigée donne une nouvelle identité d'asset ; sans vue, l'identité ne change pas.
- **Outil Web** (sous-agent, `326a7b14`, `36817e9b`, `798d5129`, `f00e222d` ; rapport `2026-11-25_MARQUAGE-PHOTOS-WEB.md`) :
  - détection des bandes blanches et règle de choix (la plus à droite ; la plus large s'il y en a trois) ;
  - surimpression, ajustement, « Image entière » ;
  - onglet « Marquage des photos » : proposer pour toutes, puis vérifier une à une ;
  - script `propose-views.mjs`.
- **Données** :
  - 53 photos du catalogue illustré ont une vue **proposée** : 43 à deux vues, 10 à trois vues ; 7 images simples restent entières ;
  - chacune de ces 53 fiches reçoit une révision et une entrée d'historique, sinon le téléphone les classerait `INCOHERENT_REVISION` (`catalogueLoadPlan.ts`).
- **Vérification humaine requise** : la vérification par la personne qui publie reste à faire. Cas douteux : trois vues de même largeur (FIT-CRO-005, FIT-CRO-006, FIT-HYR-008, FIT-PIL-008), FIT-PIL-002 et FIT-CRO-010.

## PRESERVE / CHANGE / FORBIDDEN (carte)

- **PRESERVE** (vérifié inchangé dans le diff) :
  - filtres, glissé (`SwipeActionsRow`, actions de 72), contenu de la Composition ;
  - règles de durée (`formatCatalogueSessionDuration`, « ≥ » compris) ;
  - couleurs de carte (incomplète, à vérifier, archivée) ;
  - Démarrer : même action (`onStartSession`) et même état indisponible ;
  - variante Déployée : conservée, plus ouverte par le catalogue (`expanded` / `children`) ;
  - autres contextes de choix non migrés ;
  - arbre de composition (`SessionCompositionTree`, intact).
- **CHANGE** :
  - visuel en mosaïque ;
  - trois lignes ;
  - Démarrer en icône ronde de 28 ;
  - toucher de la carte : il ouvre la Composition en modale iOS ;
  - variante Sélection ;
  - deux jetons (case « +N »).
- **FORBIDDEN** (respecté) :
  - aucune détection à l'affichage ;
  - aucune bibliothèque ajoutée ;
  - aucun changement de primitive : `MediaPreview` reçoit seulement une option `crop`, la présentation modale est la feuille native iOS (`formSheet`) et le bouton Démarrer partagé est réutilisé ;
  - aucune réécriture hors périmètre.

## Réalisé (carte)

- **`sessionMosaic.ts`** : disposition par nombre d'images.

  | Images | Disposition |
  |---|---|
  | 1 | 64 |
  | 2 | 31 × 64 ×2 |
  | 3 | colonne et deux carrés |
  | 4 | 2 × 2 |
  | 5 et plus | 3 images et « +N », N = images − 3 |

- **`mediaCrop.ts`** : `cropFrame`, la vue entière couvre la case et ses bords sont réduits autour du centre.
- **`sessionCatalogueProjection.ts`** :
  - `mosaic` : mouvements distincts par `sourceMovementId`, dans l'ordre de la composition, sans image ignorés, avec la vue de l'asset ;
  - `movementNames` ;
  - `formatNames` : Format d'un Circuit ou de son modèle d'origine, ou d'un Exercice ; distincts et ordonnés.
- **`SessionCard.tsx`** :
  - mosaïque, ou à défaut vignette du format, sinon Libre ;
  - ligne 1 : nom ;
  - ligne 2 : chronomètre, durée · formats en semi-gras (« Libre ») ;
  - ligne 3 : haltère Figma, mouvements, « +N » mesuré ;
  - Démarrer : `AgendaPlayButton` avec l'ombre `catalogueSessionsContext` (Figma), centré en hauteur, bord droit à 12 ;
  - Sélection : `context="planning"`, sans Démarrer.
- **`AgendaStatusIcon.tsx`** : options `shadowColor` et `disabled` ; le rendu de l'Agenda est inchangé.
- **`SessionCatalogueList.tsx`** : le toucher de la carte ouvre la Composition ; plus d'état déplié ; nom accessible = nom, durée, formats, mouvements.
- **Navigation** : `compositionRoutePresentation.ts` et `app/_layout.tsx` présentent le groupe `(creation)` en feuille native iOS quand la Composition est ouverte depuis une carte (`presentation=modal`). Les autres ouvertures sont inchangées.
- **`MediaPreview.tsx`** : option `crop`. Les dimensions viennent de la miniature en mémoire, sinon du chargement.

## Écart de formulation consigné (non bloquant)

- Le DSF (§ 1) et le prompt disent « gauche et droite pour une case plus horizontale que la vue, haut et bas pour une case plus verticale ».
- Sans déformation et la vue entière visible au mieux, la géométrie impose l'inverse : une case plus horizontale réduit le haut et le bas.
- C'est aussi le constat du DSF (§ 3) : « dans les cases carrées, une vue verticale perd du haut et du bas ».
- **Retenu** : recadrage centré qui couvre la case (règle géométrique et exemple du § 3). À confirmer par Hermann à la recette.

## Correction annexe

PR #456 : les 4 icônes `agenda-etat-*` n'étaient pas déclarées dans `assets/icons/manifest.json`, ce qui faisait échouer le test `visualAssets` (non lancé lors de la mission Agenda). Correction `ccf82a78` sur `feat/agenda-icones-etat-20261124` : déclaration, et cadre ramené à `viewBox="0 0 l h"` (rendu identique).

## Tests

- **Nouveaux** :
  - `SessionCard.test.tsx` réécrit, 34 tests : disposition de 1 à 6 images ; mouvements sans image ; ordre et dédoublonnage ; « +N » ; repli sans image ; vue présente et absente ; case plus horizontale ou plus verticale ; vue du bas ; lignes 2 et 3 avec et sans format ; troncature « +N » ; séance d'un seul exercice ; Démarrer (position, ombre, indisponible) ; Sélection ; carte archivée ;
  - `compositionRoutePresentation.d602.test.ts` ;
  - `migration040.test.ts` ;
  - marquage dans `MovementCatalogueFile.test.ts` et `catalogueMedia.sqlite.test.ts`.
- **Adaptés** (comportement remplacé par D-602) : `SessionCompositionTree.e3` (déploiement dans la liste → ouverture), `SessionCatalogueList.e5`, `CatalogueScreen` (paramètre `presentation`), `EmptySessionOpenFlow`, fixture de `PlanningSelection`, épinglage de version 39 → 40 des tests de migration, `migration021` (colonnes `view_*` ignorées).
- **Exécutés, en série** :
  - base de données et médias : 66 suites, 559 tests ; les 7 échecs dus à l'ajout de colonnes ont été corrigés, puis les 7 suites concernées repassées (139 tests) ;
  - suites directement liées à la carte : 17 suites, 165 tests (3 échecs corrigés : fixture et manifeste) ;
  - carte, sélection, jetons, visuels, Agenda : verts ;
  - outil Web : `node --test` 48/48.
- **Non exécuté** : `--findRelatedTests` complet (99 suites) a été arrêté par le système, mémoire insuffisante, après 5 suites vertes. Il n'a pas été relancé.
- **Types et lint** : `tsc` est propre ; le lint ne signale rien sur les fichiers modifiés.

## À vérifier sur iPhone

- Mosaïque de 1 à 5 images et plus, et recadrage des vues proposées. Prérequis : charger le catalogue illustré à jour sur le téléphone.
- Lignes 2 et 3, et « +N ».
- Relief et état appuyé de Démarrer, ombre lavande.
- Toucher la carte : la Composition s'ouvre en modale iOS. Ses sorties (✕, Enregistrer) sont à vérifier dans ce mode.
- Modale « Planifier une séance — Sélectionner une séance » : variante Sélection.
- Une suite verte ne remplace pas ces contrôles.

## Hors périmètre

Contenu de la modale de Composition ; variante Déployée ; filtres ; glissé ; contextes de choix non migrés ; production définitive des rectangles (vérification de la personne qui publie).

## Fichiers modifiés (carte)

`src/features/sessions/{SessionCard.tsx, SessionCatalogueList.tsx, CatalogueScreen.tsx, sessionCatalogueProjection.ts, sessionMosaic.ts, compositionRoutePresentation.ts}`, `src/features/activities/{MediaPreview.tsx, mediaCrop.ts}`, `src/features/planning/AgendaStatusIcon.tsx`, `app/_layout.tsx`, `src/shared/ui/tokens.ts`, `src/shared/i18n/resources/{fr.ts, enCore.ts}`, `assets/icons/icon-carte-seance-haltere.svg`, `assets/icons/manifest.json`, tests ci-dessus, documents : registre, ch. 12, `KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md`, `KODJO-Catalogues-cartes-modales-2026-11-06.md`, ce rapport.

## Classe

B : décisions de Hermann du 24-25/11/2026. Documents mis à jour dans la même livraison.

## Commits et état Git

Le commit qui contient ce rapport et l'état final sont indiqués dans le compte rendu de livraison.

# 2026-11-10 — CATALOGUE-AUTONOME — Exécution CA-1 et CA-2

## Identifiant et objectif

- **CATALOGUE-AUTONOME, tranches CA-1** (format de fichier autonome) **et CA-2** (conversion initiale du catalogue pilote).
- Autorisation de Hermann (10/11) : « Corrige le plan sur ces points, puis avance sur CA-1 et CA-2, avec leurs tests et contrôles documentaires. Ne développe pas encore CA-3 à CA-6. Présente le modèle résultant et les résultats des tests avant de poursuivre. »

## Branche et commit de départ

- Branche : `catalogue/integration-60-main-20261109`, worktree `C:/Dev/KODJO-CAT60-MAIN`.
- Commit de départ : `ccd7febc`, contenant le plan, révision 1.

## Périmètre demandé / traité

- **Demandé** :
  1. corriger le plan sur quatre points : autonomie réelle, identités distinctes, révisions et modifications locales, exhaustivité ;
  2. réaliser CA-1 et CA-2 ;
  3. réemployer l'existant.
- **Traité** :
  1. plan, révision 2 (`2026-11-10_CATALOGUE-AUTONOME-PLAN.md`) ;
  2. CA-1 ;
  3. CA-2 ;
  4. spécification du format ;
  5. ajout des nouveaux tests à la CI de branche.
- **Non traité, conformément à l'autorisation** : CA-3 à CA-6 (registre, moteur de chargement, écran, retrait du corpus embarqué, recette iPhone).

## Réemploi (aucune infrastructure nouvelle)

| Élément existant | Réemploi |
|---|---|
| `MovementEditorialProvenance` et ses tests | Reportés **à l'identique** depuis la pile catalogue historique (commit d'origine `d5dca7d3`) ; leur validateur contrôle la provenance de chaque fiche. |
| Spécification de provenance du 06/11 | Reportée à l'identique dans `docs/`. Les annotations correspondantes des chapitres 09 à 12, présentes sur la pile historique, ne sont **pas** reportées (voir « Hors périmètre »). |
| Taxonomie v0 (`taxonomie-v0-proposition.json`) | Reportée à l'identique (données). |
| `validateMovement`, `normalizeMovementName`, `encodeInstructionSteps` | Projection d'une fiche vers `Movement`. |
| `PREDEFINED_CATEGORIES` et `BODY_ZONES` | Référentiels Catégories et Zones du fichier pilote. |
| Règles médias de l'administration Web (`mediaError`) | Reprises à l'identique dans le validateur. |
| Jest et la CI de branche | Validation des fichiers versionnés, et reproductibilité de la conversion. |

## Modèle résultant

Spécification : `docs/KODJO-Format-catalogue-mouvements-v1.md`.

- **Identités** :
  - `catalogue.id` (`kodjo.pilote-60`) ;
  - `sheetId`, égal à l'identifiant d'origine (`REED-001`) ;
  - `Movement.id`, attribué à l'installation et jamais porté par le fichier ;
  - `install.knownLocalMovementIds` (`["pilot:REED-001"]`), qui sert au rapprochement des 60 Mouvements déjà installés.
- **Fiche complète** :
  - `provenance` : modèle existant, avec un propriétaire pouvant rester inconnu ;
  - `content` : nom, alias ordonnés, position de départ, matériel, **étapes ordonnées**, sécurité, notes ;
  - `classification` : Catégorie, Zones, quatre axes de taxonomie, fondement, revue, classification d'origine, spécialités d'origine ;
  - `sources` : source documentaire et contexte de prescription ;
  - `validation` : classification, clinique, droits, relecture du corpus, licence, validation clinique, publication ;
  - `media` : ordonnés, modèle de l'administration ;
  - `revision` et `history`.
- **Niveau catalogue** : propriétaire, diffuseur, statut de publication, notes, référentiels ordonnés et glossaire ordonné.
- **Empreinte `sheetFingerprint`** : couvre la fiche éditoriale complète, à l'exclusion de `revision`, `history` et `install`.

## Constats

- Les 60 fiches converties ont une projection **strictement égale** aux Mouvements de l'importeur actuel, identifiants `pilot:*` compris, avec ou sans brouillons édités : condition E8 démontrée par test.
- Aucune propriété du corpus, du préclassement ou des brouillons d'administration n'est abandonnée :
  - le convertisseur échoue sur toute propriété inconnue ;
  - les champs `kodjoCategoryId` et `kodjoBodyZoneIds` du corpus, tous vides, sont vérifiés vides avant d'être omis.
- Le validateur de provenance existant exige `owner`, alors que le corpus interdit toute attribution par déduction. Le format admet donc un propriétaire **inconnu**, signalé par `UNKNOWN_OWNER` (61 signalements dans le fichier pilote : le catalogue et ses 60 fiches).
- Interprétation retenue pour la provenance du corpus : `origin: EXTERNAL_IMPORTED`, `upstream` = classeur source (`xlsx:KODJO_Catalogue_reeducation_fitness_60_fiches.xlsx`, fiche d'origine, référence du 2026-10-27), `visibility: PRIVATE`, `reviewStatus: DRAFT`.

## Preuves et tests

| Commande | Résultat |
|---|---|
| `npx jest src/domain/catalogue tools/catalogue` | PASS, 46 tests (provenance 8, format 27, conversion 11) |
| Importeur actuel, commande, Catalogue, repository Mouvement, migrations, schéma (23 suites) | PASS, 300 tests |
| `npx tsc --noEmit` | OK |
| `npx eslint src/domain/catalogue tools/catalogue` | OK |
| `git merge-tree origin/main HEAD` | sans conflit |
| Chemins modifiés touchés par PRE-10 (`origin/pre10-bmad/dev`, `composition-phases-duree`) | aucun |

Couverture des tests :
- fiche rédigée à la main valide sans code, catalogue vide valide ;
- formats étrangers refusés ;
- doublons d'identités, de référentiels et de glossaire ;
- références inconnues ;
- historique incohérent ;
- provenance (validateur existant) ;
- propriétaire inconnu et homonymie : signalés sans blocage ;
- règles médias ;
- contrat `Movement` ;
- validité de tout fichier versionné ;
- empreinte :
  - sensible aux étapes, aux alias, à l'ordre et aux droits des médias, à la sécurité, aux classifications d'origine, aux sources, à la validation, aux auteurs et aux spécialités ;
  - insensible à l'ordre des Zones et des taxonomies, aux révisions, aux identifiants locaux et à l'ordre des clés ;
- conversion reproductible, fichier versionné identique à la conversion ;
- identités ;
- projection identique à l'importeur actuel (E8) ;
- contenu, classifications, sources et validation conservés ;
- référentiels ;
- brouillons d'administration conservés : édition, médias ordonnés, acteurs, notes, statut, ajouts et renommages de référentiels, glossaire ;
- refus de toute perte silencieuse.

## Hypothèses non démontrées

- La reconnaissance des 60 Mouvements sur l'iPhone est démontrée par égalité de projection, pas par un chargement réel (CA-3 et CA-6).

## Synchronisation code / documentation

Classe **B** (évolution validée : décision de Hermann du 10/11, format de données).

- Créés :
  - `docs/KODJO-Format-catalogue-mouvements-v1.md` ;
  - la spécification de provenance du 06/11, reportée à l'identique.
- Mis à jour :
  - `docs/KODJO-Import-catalogue-admin-vers-mobile-2026-11-07.md`, qui annonce le remplacement de son mécanisme ;
  - le plan, en révision 2.
- Aucune règle fonctionnelle ni aucun écran n'est modifié ; Figma est inchangé.

## Hors périmètre / non corrigé

- CA-3 à CA-6.
- Annotations de provenance des chapitres 01, 04, 05, 07 à 13 et de `PRODUCT.md` / `INDEX.md` : elles existent sur la pile historique, elles ne sont pas reportées ici (consigne : ne pas reprendre la pile historique). À reporter lors de l'intégration documentaire du catalogue.
- Le validateur JavaScript de l'administration Web OVH et la production directe du format v1 par l'administration : non modifiés (évolution future).
- PR #436 : en attente de la validation de la build `6987d086` sur iPhone.

## Vérifications restant à faire sur appareil réel

- Aucune pour CA-1 et CA-2, qui n'ont aucun effet sur l'application. Les vérifications sur iPhone interviendront avec CA-6.

## Fichiers modifiés

- `src/domain/catalogue/MovementEditorialProvenance.ts` (reporté)
- `src/domain/catalogue/__tests__/MovementEditorialProvenance.test.ts` (reporté)
- `src/domain/catalogue/MovementCatalogueFile.ts`
- `src/domain/catalogue/__tests__/MovementCatalogueFile.test.ts`
- `tools/catalogue/convertPilotCorpus.ts`
- `tools/catalogue/__tests__/convertPilotCorpus.test.ts`
- `catalogue/catalogues/kodjo-pilote-60.catalogue.json` (généré, puis source éditable)
- `catalogue/referentiels/taxonomie-v0-proposition.json` (reporté)
- `docs/KODJO-Format-catalogue-mouvements-v1.md`
- `docs/KODJO-Provenance-propriete-fiches-mouvements-2026-11-06.md` (reporté)
- `docs/KODJO-Import-catalogue-admin-vers-mobile-2026-11-07.md`
- `.github/workflows/kodjo-catalogue-import-recette.yml`
- `.github/orchestration/reports/2026-11-10_CATALOGUE-AUTONOME-PLAN.md` (révision 2)
- `.github/orchestration/reports/2026-11-10_CATALOGUE-AUTONOME-CA1-CA2.md`

## Commit final et état Git

Commit de livraison de CA-1 et CA-2, contenant ce rapport, sur `catalogue/integration-60-main-20261109`, poussé ; hash et CI communiqués dans le compte rendu de session. Aucune modification de PRE-10, aucune build, aucune OTA, aucune fusion dans `main`.

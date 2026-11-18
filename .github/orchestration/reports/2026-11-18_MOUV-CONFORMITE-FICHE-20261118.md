# Mission MOUV-CONFORMITE-FICHE-20261118 — Mise en conformité de la fiche Mouvement, des données et de l'administration

- **Objectif :** implémenter les décisions consolidées du 17/11/2026 (MOUV-ADM, MOUV-ACC, MOUV-PART, MOUV-UX), fusionnées par la PR #442 (`e3ee25a7`) : modèle, persistance, administration, échanges PC/iPhone, migrations ; mise à jour des bibliothèques installées sans doublon ni perte de référence.
- **Demandeur :** Hermann, 18/11/2026 (mission « Projet KODJO — Mise en conformité de la fiche Mouvement, des données et de l'administration »).
- **Branche :** `mouvement/conformite-fiche-20261118`, worktree `C:\Dev\KODJO-MOUV`.
- **Commit de départ :** `5fe5e519` (`origin/main`, après fusion du For time, PR #443) ; contient la PR #442.

## 1. Point de départ

- `origin/main` contient `e3ee25a7` (PR #442) : vérifié (`git merge-base --is-ancestor`).
- Travaux parallèles préservés, aucun worktree d'une autre session modifié : `KODJO-PLANIFICATION` (Metro 8083), `KODJO-MAIN` (Metro 8081), `KODJO-CAT-INTEG` (serveur d'administration en service, `node tools/catalogue-admin/server.mjs --lan`, ports 4738/4739), `KODJO-CAT-ADMIN` (catalogue modifié non commité), illustrations (session séparée).
- **Catalogue réel :** celui que sert l'administration en service, `C:\Dev\KODJO-CAT-INTEG\catalogue\catalogues\kodjo-pilote-60.catalogue.json` (révision 105, 81 fiches, 10 Bibliothèques, format 2.0.0). Il n'est ni remplacé ni modifié par ce chantier ; les essais portent sur des copies.

## 2. État des écarts (code de `origin/main` comparé à la cible)

| Sujet | Code existant | Écart à la cible |
|---|---|---|
| Format d'échange | `KODJO_MOVEMENT_CATALOGUE` 2.0.0 (v1 relue) | Champs abandonnés encore dans le modèle, le validateur et les échanges : `content.startingPosition`, `classification.basis/review/original/originalProposedSpecialties`, `sources` (section entière), `provenance.gestureId/publisher/reviewStatus/visibility`, `media[].alt` (obligatoire pour une photo), `library.editor`, `catalogue.manager/publisher`, `publicationAllowed` saisi au niveau Bibliothèque et catalogue. |
| Position de départ | Champ distinct, 61 fiches sur 81 le renseignent dans le catalogue réel (aucune déjà présente dans les étapes) | À reprendre en tête des étapes, sans doublon. |
| Licence de la fiche | Chaîne libre (aucune valeur dans le catalogue réel) | « Non renseignée » ou « Licence ou conditions connues » (nom et lien, ou texte). |
| Ayant droit | Acteur saisi séparément du propriétaire | Propriétaire par défaut, tiers facultatif, sans double saisie. |
| Phases | Absentes du format ; la projection installe `phases: []` | Phases de la fiche source (ordre, libellé, durée par défaut facultative), transmises à l'installation et aux mises à jour acceptées. |
| Publication | Cases `publicationAllowed` portées par fiche, Bibliothèque et catalogue | Autorisation système portée par la révision de fiche ; Bibliothèque et catalogue : synthèse calculée, jamais saisie. Contrôle central hors lot. |
| Administration | Formulaire avec Position de départ, Diffuseur, Statut éditorial, Visibilité de fiche, Sources, texte alternatif ; Éditeur de Bibliothèque ; Gestionnaire et Diffuseur du catalogue ; notes du catalogue sans interface ; pas de phases | Formulaires à aligner sur les 30 éléments ; phases administrables ; licence à deux choix ; ayant droit par défaut ; notes du catalogue internes ; empreinte et version lue en diagnostic. |
| Fiche mobile (bouton Livre) | Bibliothèque, catalogue, source, propriétaire, auteur, éditeur, ayant droit, licence, version | Matériel et consignes de sécurité conservés mais inaccessibles ; « Éditeur » repose sur des champs supprimés. Notes internes : non affichées (conforme). |
| Filtres validés | Classifications seulement dans `sheet_json` ; référentiels (libellés) non conservés sur le téléphone | Données nécessaires aux filtres (spécialités, familles gestuelles, problèmes cliniques, cibles anatomiques) à préparer sur le mobile, sans nouveau parcours. |
| Registre mobile | Schéma 3, instantanés 2.0.0 | Migration des instantanés installés, avec sauvegarde récupérable. |
| Unicité locale | `(catalogueId, sheetId)` → un Mouvement ; une fiche dans plusieurs Bibliothèques → un seul Mouvement | Conforme ; à couvrir par un test explicite. |

## 3. Plan

1. **Format 3.0.0** (`MovementCatalogueFile.ts`) : retrait effectif des champs abandonnés ; `phases[]` ; licence à deux choix ; ayant droit `null` = propriétaire ; synthèse calculée de la publication (Bibliothèque, catalogue). Lecture de 1.0.0 et 2.0.0 par conversion déterministe : position de départ reprise en tête des étapes sans doublon (nouvelle révision de la fiche, datée de sa dernière révision, résumé explicite), champs abandonnés retirés. Empreinte recalculée sur la fiche convertie.
2. **Édition** (`catalogueEditing.ts`, boîte d'arrivée) : création et révisions au format 3.0.0 ; phases.
3. **Chargement mobile** (`catalogueLoadPlan.ts`, `CatalogueLoadService.ts`) : phases projetées sur le Mouvement (identités de phase stables, valeurs locales protégées comme les autres champs projetés) ; sections du comparatif à jour.
4. **Registre** (`SqliteCatalogueRegistry.ts`, schéma 4) : sauvegarde des tables avant migration ; conversion des instantanés installés (champs retirés, empreinte recalculée) ; référentiels de classification conservés par catalogue pour les filtres.
5. **Fiche mobile** : Livre — matériel, sécurité, classifications ; licence ; ayant droit ; aucune note interne.
6. **Administration** : formulaires (30 éléments), phases, licence, ayant droit, notes du catalogue, synthèse de publication, diagnostic ; sauvegarde du fichier avant sa première réécriture au format 3.0.0.
7. **Tests et documentation technique**, PR.

## 4. Journal

- 18/11 — état des écarts et plan présentés ; développement sans nouvel arbitrage (autorisations de Hermann : « Je te donne les autorisations pour les fusions et commits nécessaires, et pour ce dont tu as besoin pour mener cette tâche à son terme » ; « Ne fusionne pas la PR sans mon instruction »).
- Format 3.0.0 (`MovementCatalogueFile.ts`, `MovementEditorialProvenance.ts`), édition (`catalogueEditing.ts`, `MovementInbox.ts`), chargement (`catalogueLoadPlan.ts`, `CatalogueLoadService.ts`, `LibraryService.ts`, `libraryPlan.ts`, `catalogueLoadPresentation.ts`), registre schéma 4 (`SqliteCatalogueRegistry.ts`), fiche Livre (`importedMovements.ts`, `ImportedMovementBadge.tsx`), filtres (`catalogueFilters.ts`), administration (`app.js`, `media.js`, `server.mjs`), convertisseur pilote (`convertPilotCorpus.ts`).
- Constat en cours de développement : l'ancien importeur pilote n'a jamais mis la position de départ dans les étapes. Sans précaution, un téléphone sans registre aurait vu ses 60 Mouvements « à rapprocher » après conversion. Ajout de `sheetBeforeStartingPositionMerge` : un Mouvement identique à la version d'avant la reprise reçoit la mise à jour (classe D).
- Constat : la clé cible d'une Bibliothèque installée inclut sa composition (dont `editor`) ; la migration la recalcule seulement si l'ancienne est reproduite, pour éviter une fausse mise à jour sur toutes les Bibliothèques.
- Constat : `updateMovementContent` conserve une durée de phase absente ; la projection écrit donc `durationSeconds: null` explicitement pour qu'un retrait de durée soit transmis.

## 5. Périmètre traité

| Demande | Statut | Preuve |
|---|---|---|
| A. Inventaire des 30 éléments dans le modèle et les échanges | Fait | Types et validateur 3.0.0 ; champs abandonnés refusés dans un fichier 3.0.0 (`MovementCatalogueFile.test.ts`) |
| Position de départ en tête des étapes, sans doublon | Fait | Tests de conversion ; copie du catalogue réel : 61 reprises, 0 doublon |
| Données techniques (installation, empreinte, version) conservées | Fait | `install`, `sheetFingerprint`, `sourceFormatVersion` ; volet « Diagnostic » |
| Notes internes non transmises | Fait | `withoutInternalNotes`, export et Wi-Fi (`server.test.mjs`), registre (`catalogueFormatV3Migration`) |
| Identités, références de séances, historiques | Fait | Mêmes `sheetId`, `movementId`, historiques prolongés sans perte (tests SQLite, copie réelle) |
| B. Administration alignée, licence à deux choix, ayant droit par défaut, historiques en lecture seule, diagnostic, glossaire conservé, publication non saisissable | Fait (code) | `app.js` ; tests serveur ; **aucune vérification visuelle** (règle : pas de navigateur) |
| C. Phases transmises (installation, mise à jour acceptée) | Fait | `catalogueFormatV3Migration` (installation puis révision : ordre, libellés, durées) |
| Familles de niveaux et médias conservés | Fait | 7 familles et 6 médias conservés sur la copie réelle ; tests familles inchangés |
| Fiche commune à plusieurs Bibliothèques = un Mouvement | Fait | Test SQLite dédié |
| Fiche importée en lecture seule, non duplicable | Inchangé (déjà en place, garde A-2) | Tests existants de la garde |
| Bouton Livre | Fait | Matériel, sécurité, classifications, ayant droit, licence ; ligne « Éditeur » retirée ; aucune note |
| Données des filtres (sans parcours) | Fait | `catalogueFilters.ts`, `importedMovementClassifications`, table `installed_references` |
| D. Sauvegarde avant migration (téléphone, administration) | Fait | Tables `*_backup_v3` ; `catalogue/admin/sauvegardes/` |
| Versionnement documenté | Fait | Format § 13 |
| Ré-import sans doublon ni réinitialisation | Fait | Tests SQLite (60 mises à jour, puis aucune écriture au réimport) |
| Illustrations | Non touchées | Aucun média ni fichier d'illustration modifié ; association par `sheetId` inchangée |

Hors périmètre (conforme à la mission) : comptes et partage, espace partagé, contrôle central de publication, stockage des médias, aide du glossaire, nouveaux écrans Figma.

## 6. Choix techniques (classe D)

- Format **3.0.0** (majeure) ; lecture 1.0.0, 2.0.0, 3.0.0 ; propriété abandonnée refusée dans un 3.0.0.
- Reprise de la position de départ = nouvelle révision déterministe (`nextRevision`, date de la dernière révision, auteur inconnu) : les téléphones reçoivent une mise à jour ordinaire ; conversion répétée identique.
- Instantanés installés convertis **sans** reprise ni révision : la mise à jour arrive par la révision du fichier source.
- Registre schéma 4 avec copies `*_backup_v3` dans la même base et la même transaction.
- Administration : copie à l'identique avant la première réécriture d'un fichier antérieur (`catalogue/admin/sauvegardes/`, ignoré par Git).
- Pilote de test 3.0.0 sans reprise (`src/domain/catalogue/testing/pilotCatalogueV3.ts`) pour les tests dont le sujet n'est pas la conversion.

## 7. Hypothèses non démontrées et limites

- Rendu de l'administration et de la fiche Livre : non vérifié visuellement (aucun navigateur, règle du projet) ; à contrôler par Hermann.
- Migration du registre réel de l'iPhone : démontrée sur bases SQLite reconstituées (schéma 3, instantanés 2.0.0 du pilote), pas encore observée sur l'appareil.
- Identités de phase : une phase ajoutée ne reprend jamais une identité de la version enregistrée courante, mais pourrait reprendre celle d'une phase supprimée lors d'une révision plus ancienne.
- Référentiels de classification : enregistrés au prochain chargement de Bibliothèque (non reconstitués par la migration) ; l'écran de recette CA-4 ne les enregistre pas.
- Critères de recette 1, 2, 3 et 7 de la cible (accès, révocation, partage, suivi) : lots futurs, non développés.

## 8. Vérifications à effectuer sur l'iPhone (Hermann)

1. Ouverture de Routine Catalogue avec le nouveau code : aucune erreur ; Bibliothèques installées toujours présentes.
2. Profil → Bibliothèques → connexion Wi-Fi : chaque Bibliothèque concernée propose « Mettre à jour » ; après mise à jour, les fiches qui avaient une position de départ l'ont en première étape, une seule fois ; aucun Mouvement en double ; séances existantes inchangées.
3. Nouveau chargement : « à jour », rien à faire.
4. Bouton Livre d'un Mouvement importé : matériel, consignes de sécurité, classifications, ayant droit, licence ; plus de ligne « Éditeur » ; aucune note interne.
5. Une fiche avec phases (après saisie dans l'administration) : phases visibles sur le Mouvement après mise à jour.

## 9. Tests et vérifications

- `npx tsc --noEmit -p .` : aucune erreur.
- `npx eslint src/features/catalogue src/domain/catalogue src/infrastructure/catalogue tools/catalogue tools/catalogue-admin` : aucun signalement. (`npx eslint src` signale des erreurs antérieures dans `CompositionScreen.tsx` et `formatTimeline.ts`, fichiers non touchés.)
- `npx jest` (suite complète) : 400 suites, 6 190 tests réussis, 32 ignorés. Après les dernières retouches : suites catalogue et fiche Mouvement, 20 suites, 272 tests réussis.
- `node --test tools/catalogue-admin/server.test.mjs tools/catalogue-admin/installation.test.mjs` : 33 réussis, 0 échec.
- Nouveaux tests : `catalogueFormatV3Migration.sqlite.test.ts` (registre 3 → 4 avec sauvegarde, réimport du fichier 2.0.0, téléphone sans registre, phases, fiche dans deux Bibliothèques, référentiels), `catalogueFilters.test.ts`, conversion 2.0.0 → 3.0.0, licence, ayant droit, phases, notes internes, synthèse de publication.
- Copie du catalogue réel (`KODJO-CAT-INTEG`, révision 105, 81 fiches, empreinte 847a0b1b2773), script hors dépôt : 61 positions reprises, 61 révisions avancées, aucune étape en double, identités et historiques conservés, champs abandonnés absents, aller-retour et conversion répétée identiques, version diffusable sans note interne ; administration sur la copie : enregistrement (révision 106), sauvegarde identique aux octets d'origine, relecture 3.0.0 canonique après redémarrage ; **fichier réel inchangé** (empreinte vérifiée après coup).

## 10. Documentation (synchronisation code / documentation)

- Classe A : le code rejoint MOUV-ADM, MOUV-ACC, MOUV-PART et MOUV-UX (registre ch07, Étape 2, ch08, ch09, ch13 déjà à jour par la PR #442).
- Classe D : versionnement et migration documentés dans `docs/KODJO-Format-catalogue-mouvements-v1.md` § 13 ; note de mise en œuvre dans `docs/KODJO-Mouvements-Etape2-Modele-cible-et-migrations-2026-11-11.md`. Chapitres 09 et 12 non modifiés (le schéma du registre distinct est décrit dans le document de format, comme ses versions précédentes).

## 11. Fichiers modifiés

Domaine : `MovementCatalogueFile.ts`, `MovementEditorialProvenance.ts`, `catalogueEditing.ts`, `MovementInbox.ts`, `catalogueLoadPlan.ts`, `libraryPlan.ts`, `catalogueFilters.ts` (nouveau), `testing/pilotCatalogueV3.ts` (nouveau, tests). Application : `CatalogueLoadService.ts`, `LibraryService.ts`, `catalogueLoadPresentation.ts`, `importedMovements.ts`, `ImportedMovementBadge.tsx`, `SqliteCatalogueRegistry.ts`. Outils : `tools/catalogue-admin/app.js`, `media.js`, `server.mjs`, `tools/catalogue/convertPilotCorpus.ts`. `.gitignore`. Tests associés. Documents ci-dessus. **Non modifiés** : `catalogue/catalogues/kodjo-pilote-60.catalogue.json`, illustrations, autres worktrees.

## 12. Commit et état Git

Branche `mouvement/conformite-fiche-20261118`, départ `5fe5e519`. Le hash du commit de livraison et l'état Git final sont donnés dans le compte rendu de clôture et dans la PR (non fusionnée, en attente de l'instruction de Hermann).

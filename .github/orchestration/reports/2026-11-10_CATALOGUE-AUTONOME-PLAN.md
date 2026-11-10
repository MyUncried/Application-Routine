# 2026-11-10 — CATALOGUE-AUTONOME — Plan d'évolution minimal (révision 2)

**Statut :** plan **partiellement validé** par Hermann (10/11) ; révision 2 intégrant ses quatre corrections. Exécution autorisée : **CA-1 et CA-2 seulement**, avec tests et contrôles documentaires. CA-3 à CA-6 non développés.
**Branche :** `catalogue/integration-60-main-20261109` (worktree `C:/Dev/KODJO-CAT60-MAIN`) ; révision 1 au commit `5956e52f` (complétée en `ccd7febc`).
**Interdits maintenus :** aucune modification de PRE-10, aucune build, aucune OTA, aucune fusion dans `main`.

## 0. Décisions de Hermann (10/11)

- Option A retenue : catalogue autonome, architecture compatible avec une option B (téléchargement depuis OVH) **sans changer le modèle de données**.
- Architecture générale et découpage CA-1 à CA-6 **approuvés**.
- Registre dans une base SQLite distincte : **accepté provisoirement** pour éviter les conflits avec PRE-10, **pas un choix définitif**.
- Quatre corrections, reprises textuellement :
  1. **Autonomie réelle** : « Le générateur fondé sur les 60 fiches existantes est une solution de conversion initiale, pas le mécanisme permanent de gestion du catalogue. Le fichier autonome doit ensuite constituer une source éditable permettant de créer de nouvelles fiches, sans modification du code ni nouvelle build. »
  2. **Identités distinctes** : « Conserver la séparation déjà documentée entre l'identifiant de fiche éditoriale (sheetId), son catalogue d'origine et le Movement.id local. Préserver la reconnaissance des 60 identifiants pilot:* déjà installés. »
  3. **Révisions et modifications locales** : « Le suivi des révisions doit couvrir la fiche éditoriale complète, pas seulement les propriétés importées dans Movement. Conserver les modifications personnelles et ne jamais les écraser automatiquement. Clarifier les cas de conflit et corriger l'affirmation selon laquelle le registre serait entièrement reconstructible après sa perte. »
  4. **Exhaustivité du modèle** : « Reprendre toutes les propriétés déjà définies dans les spécifications éditoriales et l'administration : contenus, classifications, médias et métadonnées, propriété, auteurs, droits, sources et révisions. Conserver les étapes structurées dans le contenu descriptif et non dans les classifications. Respecter l'ordre des données lorsque celui-ci a une signification fonctionnelle. »
- « Privilégie systématiquement le réemploi des modèles et mécanismes existants. Pas d'infrastructure supplémentaire sans nécessité démontrée. »

## 1. Exigences

| # | Exigence | Classement |
|---|---|---|
| E1 | Fichier autonome et **éditable** : toutes les fiches et propriétés ; création de nouvelles fiches sans code ni build ; plus aucune dépendance aux 60 fiches embarquées | Indispensable |
| E2 | Catalogue initialement vide possible ; aucune suppression de Mouvement utilisateur ni de donnée présente | Indispensable |
| E3 | Chargement idempotent ; reconnaissance de l'installé ; nouvelles fiches distinguées des nouvelles révisions | Indispensable |
| E4 | Aucune mise à jour silencieuse ; accepter / refuser / reporter ; modifications personnelles jamais écrasées automatiquement | Indispensable |
| E5 | Partage futur (particuliers, coachs, kinés) : auteur, source, révisions | **Format** indispensable ; **fonction** future |
| E6 | Médias et métadonnées préservés ; transport physique séparé | **Données** indispensables ; **transport** futur |
| E7 | Compatible avec le SQLite actuel ; indépendant du moteur PRE-10 | Indispensable |
| E8 | 60 Mouvements `pilot:*` de la build de recette conservés, ni supprimés ni dupliqués | Indispensable |

## 2. Sources réemployées (constat)

| Source | Emplacement | Réemploi |
|---|---|---|
| Spécification provenance et propriété (06/11, décisions validées) | `docs/KODJO-Provenance-propriete-fiches-mouvements-2026-11-06.md` (pile catalogue historique, absente de `main`) | Termes, identités (`sheetId` ≠ `Movement.id`), `origin`, `upstream`, `owner`, `authors`, `publisher`, `rightsHolder`, `license`, `revision`, `reviewStatus`, `visibility`, cycle de vie § 4 |
| Modèle de domaine `MovementEditorialProvenance` + validateur + tests | `src/domain/catalogue/` (même pile) | **Reporté tel quel**, réutilisé par le validateur du fichier |
| Administration OVH (brouillons `KODJO_ADMIN_DRAFTS`) | `tools/catalogue-admin/static-ovh/index.html` (PR #432) | Propriétés de fiche éditées (nom, étapes ordonnées, alias, notes, Catégorie, Zones, quatre axes de taxonomie, propriétaire, auteurs, statut éditorial, médias ordonnés), modèle de média (types, stockage, droits, attribution, licence, texte alternatif, légende, limites), référentiels ajoutés ou renommés, glossaire |
| Corpus pilote `KODJO_EDITORIAL_CANDIDATE_CORPUS` | `catalogue/pilote/mouvements-60-candidats.json` | Identifiants d'origine, position de départ, matériel, étapes, consignes de sécurité, classification d'origine, contexte de prescription, source documentaire, statuts de validation |
| Préclassement `KODJO_CLASSIFICATION_PROPOSALS` v0 (non approuvé) | `catalogue/referentiels/preclassement-60-candidats-v0.json` | Catégorie, Zones et taxonomie proposées, revue, licence, validation clinique |
| Contrat `Movement`, `encodeInstructionSteps`, `validateMovement`, `normalizeMovementName` | `src/domain/activities/` (`main`) | Projection fiche → Mouvement inchangée |
| Jest, CI de branche | existants | Validation du fichier versionné et reproductibilité de la conversion |

Contrainte de migration : `DATABASE_VERSION` vaut 23 sur `main` et **24 sur PRE-10** ; aucune migration du schéma principal par la branche catalogue.

## 3. Principe

1. **Fichier catalogue** `KODJO_MOVEMENT_CATALOGUE` : **la source de vérité éditable** du catalogue, versionnée hors de `src/`. Les nouvelles fiches s'y ajoutent directement (ou, plus tard, par l'administration Web ou un téléchargement), sans code ni build. Le même fichier sert pour A et B.
2. **Conversion initiale (CA-2)** : outil **à usage unique** qui produit le fichier pilote à partir du corpus, du préclassement et d'un export de brouillons. Après conversion, le fichier fait foi ; l'outil ne fait pas partie du cycle de gestion.
3. **Registre d'installation** (CA-3, base SQLite distincte, provisoire) et **moteur de chargement** (CA-3) : inchangés dans leur principe, précisés aux § 5 et 6.

## 4. Modèle du fichier — format v1

Spécification normative détaillée : `docs/KODJO-Format-catalogue-mouvements-v1.md` (livrée avec CA-1). Résumé :

**Identités (correction 2).**

| Identité | Portée | Exemple pilote |
|---|---|---|
| `catalogue.id` | Catalogue d'origine | `kodjo.pilote-60` |
| `sheetId` | Fiche éditoriale, unique dans son catalogue, immuable ; identité globale = (`catalogue.id`, `sheetId`) | `REED-001` |
| `Movement.id` | Mouvement local, attribué à l'installation ; **jamais** porté comme identité par le fichier | `pilot:REED-001` |
| `install.knownLocalMovementIds` | Données de rapprochement : identifiants locaux sous lesquels la fiche a déjà pu être installée (anciens importeurs) | `["pilot:REED-001"]` |

Le rapprochement des 60 Mouvements `pilot:*` est donc une **donnée du fichier**, pas une règle codée.

**Fiche éditoriale complète (correction 4)** : `sheetId`, `revision`, `history[]`, `provenance` (modèle `MovementEditorialProvenance` sans `sheetId`, `localMovementId` ni `revision`, portés ailleurs), `content` (nom, alias **ordonnés**, position de départ, matériel, **étapes structurées ordonnées**, consignes de sécurité, notes), `classification` (Catégorie, Zones, spécialités, familles gestuelles, problèmes cliniques, cibles anatomiques, base de proposition, revue, classification d'origine), `sources` (source documentaire, contexte de prescription d'origine, transcription), `validation` (classification, clinique, droits, relecture du corpus, publication), `media[]` **ordonnés** (modèle de l'administration, intégralement conservé), `install`.
Niveau catalogue : propriétaire et diffuseur éventuels, statut de publication, notes, sources, **référentiels ordonnés** (Catégories, Zones, quatre axes), glossaire ordonné.

**Ordre** : significatif pour étapes, alias, médias, historique, référentiels et glossaire ; **ensemble** (ordre indifférent) pour Zones et identifiants de taxonomie.

**Aucune attribution par déduction** : propriétaire, auteurs, ayant droit et licence restent vides s'ils ne sont pas déclarés (règle du corpus et spécification § 4.8). Écart avec le validateur existant, qui exige `owner` : voir § 8, point 1.

## 5. Révisions, modifications locales et conflits (correction 3)

**Révision de fiche** : identifiant `revision` (chaîne, comme dans `MovementEditorialProvenance`) et historique `history[]` ordonné du plus ancien au plus récent. Une **empreinte de fiche** canonique (CA-1) couvre la fiche éditoriale complète — contenu, classifications, sources, validation, provenance, médias et leurs métadonnées — à l'exclusion de `revision`, `history` et `install`. Toute modification d'une propriété quelconque change l'empreinte, même sans effet sur le Mouvement.

**Projection Mouvement** : sous-ensemble installé dans `Movement` (nom, alias, description encodée à partir des étapes, Catégorie, Zones), identique à l'importeur actuel.

Au chargement (CA-3), comparaison à trois termes : **B** = fiche installée (instantané du registre), **L** = Mouvement local actuel, **R** = fiche du fichier.

| Cas | Condition | Traitement |
|---|---|---|
| Fiche nouvelle | Aucun registre ni Mouvement rapprochable | Installée après confirmation |
| Identique | `R.revision = B.revision`, même empreinte | Rien |
| Révision incohérente | Même `revision`, empreinte différente | Refusée et signalée (révision non incrémentée dans le fichier) |
| Révision antérieure | `R.revision` présente dans l'historique avant `B.revision` | Ignorée |
| Nouvelle révision, éditoriale seulement | Projection(R) = Projection(B) | Proposée ; acceptation = mise à jour du registre seul, **aucune écriture sur le Mouvement** |
| Nouvelle révision, Mouvement non modifié localement | L = Projection(B) ≠ Projection(R) | Proposée : accepter (mise à jour du Mouvement), refuser, reporter |
| **Conflit** | L ≠ Projection(B) et Projection(R) ≠ Projection(B), sur au moins un même champ | Proposée **champ par champ**, valeur locale conservée par défaut ; l'écrasement d'une modification personnelle n'est possible que par choix explicite, après sauvegarde de la valeur locale dans le registre |
| Modification locale sans révision | L ≠ Projection(B), R inchangée | Rien ; modification personnelle préservée |
| Convergence | L = Projection(R) | Registre mis à jour, aucune écriture sur le Mouvement |
| Fiche retirée localement | Registre présent, Mouvement supprimé ou archivé | Non réinstallée, signalée |
| Révision refusée | Révision déjà refusée | Rien jusqu'à une révision ultérieure |
| Révision reportée | Révision en attente | Reproposée à chaque chargement |
| Conflit de nom | Nom normalisé pris par un autre Mouvement | Fiche écartée et signalée, les autres continuent |
| Fiche invalide | Format ou contrat `Movement` non respecté, référence inconnue | Écartée et signalée |

Une fiche absente du fichier n'est jamais supprimée localement. Un catalogue vide est valide.

**Perte du registre — correction de la révision 1.** Le registre **n'est pas entièrement reconstructible**. Seuls se retrouvent les Mouvements dont l'identifiant figure dans `install.knownLocalMovementIds` ou dans la projection de la révision courante, et dont le contenu égale cette projection. Sont **perdus** :
- la révision installée lorsqu'elle diffère de la révision courante ;
- l'instantané éditorial installé (classifications, sources, médias, provenance) ;
- les décisions de refus et de report ;
- les valeurs locales sauvegardées ;
- la distinction entre une modification personnelle et une révision plus ancienne.

Après une perte, ces Mouvements sont présentés comme **« à rapprocher »** et ne sont jamais modifiés sans décision. Le registre suit le cycle de vie de la base de l'application ; sa sauvegarde et son export relèvent d'une tranche future.

## 6. Découpage — indispensable / futur

### Indispensable

| Tranche | Contenu | État |
|---|---|---|
| **CA-1 Format** | Report du modèle `MovementEditorialProvenance` (+ tests) ; types du format v1 ; validateur pur (structure, unicité, références, médias, provenance, contrat `Movement` de la projection) ; projection Mouvement ; empreinte de fiche ; spécification documentaire ; contrôle en test de tout fichier versionné | **Autorisé** |
| **CA-2 Conversion initiale** | Conversion à usage unique corpus + préclassement + brouillons d'administration → fichier pilote versionné hors de `src/` ; preuve de reproductibilité ; projection identique à l'importeur actuel pour les 60 fiches (E8) ; brouillons, médias, glossaire et référentiels d'administration préservés | **Autorisé** |
| CA-3 Registre + moteur | Base distincte provisoire ; classement du § 5 ; décisions | Non développé — conception détaillée préparée le 10/11 (`2026-11-10_CATALOGUE-AUTONOME-PROVENANCE-CA3-PREPARATION.md`), en attente de validation |
| CA-4 Écran de recette | « Charger un catalogue » remplaçant « Importer 60 fiches » | Non développé |
| CA-5 Retrait du corpus embarqué | Suppression des imports JSON de `src/` | Non développé |
| CA-6 Recette iPhone | Trois chargements : (1) fichier pilote sur la base contenant les 60 → 60 adoptés, 0 ajouté ; (2) rechargement → aucune écriture ; (3) fichier **édité** (une fiche modifiée, une fiche **créée directement dans le fichier**) → 1 nouvelle installée, 1 révision proposée, testée en accepter / refuser / reporter, modification personnelle préservée | Non développé |

### Futur (format prêt, non développé)

- Option B : téléchargement depuis OVH.
- Transport des médias.
- Partage entre utilisateurs (`SHARED_IMPORTED`, `LOCAL_DERIVED`, `upstream`).
- Fusion assistée.
- Synchronisation.
- Édition du fichier par l'administration Web (aujourd'hui, l'administration produit des brouillons sur le corpus figé).
- Intégration du registre dans le schéma principal, après PRE-10.

## 7. Preuves prévues

- **CA-1** :
  - validation des cas valides et invalides (format, version, identités, doublons, références, médias, provenance, projection `Movement`) ;
  - empreinte sensible à toute propriété éditoriale et à l'ordre des étapes, des alias et des médias, insensible à l'ordre des Zones et taxonomies, à `revision` et `history` ;
  - fiche créée à la main dans un fichier : valide sans code ;
  - catalogue vide valide ;
  - tout fichier de `catalogue/catalogues/` valide.
- **CA-2** :
  - fichier versionné strictement égal à la conversion ;
  - projection des 60 fiches = Mouvements de l'importeur actuel ;
  - identifiants `pilot:*` rapprochables ;
  - brouillons édités, médias, glossaire et référentiels d'administration conservés sans perte ni réordonnancement.
- `tsc`, eslint, CI de branche ; aucun fichier de migration ni de PRE-10 touché.
- CA-3 à CA-6 : tests prévus en révision 1 (SQLite réelle, connexion en retard, interruption, perte du registre).

## 8. Points ouverts

1. **Propriétaire obligatoire** : `validateMovementEditorialProvenance` exige `owner` ; le corpus interdit toute attribution par déduction. Le format v1 admet un propriétaire **inconnu** (`null`) et le signale. Déclarer un propriétaire du catalogue pilote est une décision de Hermann. [Résolu le 10/11/2026 — décision de Hermann : propriétaire inconnu conservé pour les 60 fiches, formalisé dans `MovementEditorialProvenance` (`owner: null`, interdit à la diffusion et à la publication) ; ANKUSHA gestionnaire administratif du catalogue (`catalogue.manager`), ni propriétaire ni ayant droit ; `EXTERNAL_IMPORTED` depuis le classeur du 27/10/2026 validé. Voir `2026-11-10_CATALOGUE-AUTONOME-PROVENANCE-CA3-PREPARATION.md`.]
2. **Homonymie** (spécification A1) : l'unicité des noms de `Movement` demeure ; conflit de nom = fiche écartée.
3. **Référentiels inconnus du téléphone** : fiche écartée, sans création implicite.
4. **Registre** : base distincte provisoire ; destination définitive à arbitrer après PRE-10.
5. **Statut** : le fichier pilote reste non publiable (`publicationAllowed: false`) ; le chargement ne vaut ni validation éditoriale ni validation clinique.

## 9. État Git

Révision 2 du plan, livrée avec CA-1 et CA-2 ; compte rendu d'exécution : `2026-11-10_CATALOGUE-AUTONOME-CA1-CA2.md`.

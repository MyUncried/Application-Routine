# KODJO — Fiche Mouvement, contrat consolidé et préparation du développement

**Date :** 11 novembre 2026. **Statut :** consolidation documentaire ciblée de l'étape 1, préparation du développement de l'étape 2. **Périmètre exclusif :** fiche Mouvement, fichier catalogue autonome et données associées ; aucune intervention sur PRE-10, le moteur, les Séances, les interfaces Figma ou l'administration Web dans cette tranche. **Ce document n'autorise pas à inventer des règles non décidées.**

**Baseline documentaire :** branche `docs/bibliotheques-generiques-cadrage-20261110` (11/11) ; **travaux techniques examinés séparément, non fusionnés** : branche `catalogue/integration-60-main-20261109`, fichier `docs/KODJO-Format-catalogue-mouvements-v1.md`, `docs/KODJO-Provenance-propriete-fiches-mouvements-2026-11-06.md`, code CA-1/CA-2/CA-3/CA-4. Le code consulté sur la branche documentaire est distinct de celui de la branche pilote. Ce document ne déclare **aucun test exécuté** ni conformité de branche fusionnée.

## Décisions postérieures à cet audit — 11/11/2026

**Les points « auteur unique », « médias » et « copie/édition des importées » ci-dessous ont été arbitrés après cet audit et ne sont plus des questions ouvertes.** La cible est désormais : `author: ActorRef | null`, médias distants avec métadonnées conservées et cache à la demande, fiches importées non modifiables et non duplicables ; modifications d'Exercice toujours autorisées. Les passages de ce rapport qui les qualifient « À CLARIFIER » restent des **constats datés de la situation antérieure**, non la règle actuelle. [Spécification normative de l'étape 2](KODJO-Mouvements-Etape2-Modele-cible-et-migrations-2026-11-11.md).

## 1. Décisions et responsabilité des objets

1. **Mouvement local `Movement` :** objet effectivement utilisé par les Exercices et Séances dans KODJO ; `Movement.id` est stable. Il comprend le contenu utilisable dans une Séance. Ne pas intégrer la totalité des informations éditoriales dans les paramètres d'exécution.
2. **Fiche éditoriale `CatalogueSheet` :** description complète et versionnée, liée à une origine `(catalogue.id, sheetId)` et **distincte de `Movement.id`**. C'est la fiche complète qui est créée, contrôlée, révisée et exportée par le catalogue autonome et l'administration.
3. **Fichier catalogue autonome `KODJO_MOVEMENT_CATALOGUE` v1 :** contient les fiches, les références, le glossaire et les révisions, en dehors du code ; source éditable du pilote. **Ce fichier n'est pas une Bibliothèque utilisateur.**
4. **Bibliothèque générique KODJO :** regroupement identifiable de fiches, sélectionnable/installable/actualisable ultérieurement dans Profil. Les Bibliothèques personnelles/de coach et la distribution entre utilisateurs sont reportées ; les métadonnées de source et de droits des fiches ne sont **pas** reportées.
5. **Écrans :** Catalogue = création, consultation et édition courante de Mouvements personnels ; Profil = sources/Bibliothèques et mises à jour, jamais deuxième éditeur de Mouvement ; administration Web = édition de la **fiche éditoriale complète** et export. Pas d'ajout d'écran ou de champ graphique hors Figma validé.

**Règles à préserver :** identifier les fiches par source + ID, pas par leur nom ; ne jamais renommer un Mouvement existant uniquement pour l'installation ; ne pas écraser les adaptations locales ; ne pas modifier les Exercices, Séances, instantanés historiques par une simple migration éditoriale. Les versions de contenu proposées sont appliquées uniquement par décision prévue au canal concerné. Les homonymes entre sources sont autorisés dans la cible, sous réserve d'une migration cohérente des validations existantes.

## 2. Inventaire du contrat de données existant — éléments vérifiés par lecture

**Code local `src/domain/activities/Movement.ts` :** `id`, `name`, `description` (étapes encodées), `media[]` (ordre), `categoryId` (1), `bodyZoneIds[]` (1..n, distincts), `phases[]` (structure avec ID, libellé et durée par défaut facultative), `nextPhaseId` (monotone), `aliases[]` (noms alternatifs ordonnés) et `levelGroup` (0..1, identité/clé de tri). L'Exercice conserve ses paramètres d'exécution propres. **Ne pas replacer des paramètres de Séance dans la fiche source.**

**Format CA-1 `src/domain/catalogue/MovementCatalogueFile.ts` :**

| Partie du fichier | Propriétés constatées | Usage |
|---|---|---|
| `catalogue` | `id`, `title`, `revision`, `owner`, `manager`, `publisher`, `publicationAllowed`, `notes[]` | Identité/version du fichier, gestion sans présumer de la propriété |
| `references` | `categories[]`, `bodyZones[]`, `specialties[]`, `gesturalFamilies[]`, `clinicalProblems[]`, `anatomicalTargets[]` ; entrée `id,label,kind,status` | Référentiels explicites, ne pas créer de valeurs locales par déduction |
| `glossary[]` | `id,term,definition,synonyms[],relatedSheetIds[]` | Glossaire et liens vers les fiches |
| `CatalogueSheet` | `sheetId,revision,history[],provenance,content,classification,sources,validation,media[],install` | Identité et version de la fiche |
| `history[]` | `revision,date,author,summary` | Historique éditorial ordonné |
| `provenance` | `gestureId,origin,upstream,owner,authors[],publisher,rightsHolder,license,reviewStatus,visibility` | Provenance et droits déclarés |
| `content` | `name,aliases[],startingPosition,equipment,steps[],safetyNotes,notes` | Contenu descriptif, étapes et alias ordonnés |
| `classification` | `categoryId,bodyZoneIds[],specialtyIds[],gesturalFamilyIds[],clinicalProblemIds[],anatomicalTargetIds[],basis,review,original,originalProposedSpecialties[]` | Classements internes et informations d'origine |
| `sources` | `documentary` (`sourceId,section,url,usageStatement`) ou null ; `prescriptionContext{}` | Sources documentaires et contexte conservé, distinct de l'identité upstream |
| `validation` | `classification,clinical,rights,corpusReview,licensing,clinicalValidation,publicationAllowed` | États éditoriaux ; aucune validation clinique présumée |
| `media[]` | `id,kind,storage,url,fileName,caption,alt,sourceUrl,attribution,license,rightsStatus` | Métadonnées des médias ordonnés |
| `install` | `knownLocalMovementIds[]` | Rapprochement avec des installations antérieures, pas identité éditoriale |

**Cardinalités/règles vérifiées dans CA-1 :** `sheetId` unique au sein du fichier ; `history` non vide, entrée terminale correspondant à la révision ; `media[]` au plus 30 ; droits médias `UNVERIFIED`/`PERMISSION_CONFIRMED`/`RESTRICTED` ; photo intégrée bornée à 580 000 caractères ; URL média HTTPS ; source requise pour média distant ; texte alternatif requis pour photo ; attribution/licence requises lorsque le statut indique des droits confirmés. L'ordre des étapes, alias, médias, historique compte ; ordre des ensembles de classifications non significatif. **Ces limites proviennent du format pilote ; les autres bornes éventuelles doivent être reprises du validateur, pas inventées.**

**Provenance pilote :** `owner: null` signifie inconnu, pas KODJO ou ANKUSHA. `catalogue.manager` peut désigner ANKUSHA sans en faire le titulaire des droits. Les 60 fiches sont `EXTERNAL_IMPORTED` et privées, publication non autorisée en l'absence de droits établis. Ne pas promouvoir automatiquement ces fiches en Bibliothèques publiques KODJO.

## 3. Matrice de couverture actuelle et lacunes de raccordement

| Axe | Constat de code/format | État et action pour Claude |
|---|---|---|
| Fiche autonome et identité | CA-1 v1 décrit une fiche complète ; `(catalogue.id,sheetId)` distinct de `Movement.id` | **CONFORME en format**, persistance/raccordement à confirmer sur branche d'intégration |
| Source et révisions | `MovementEditorialProvenance`, `history[]`, `sheetFingerprint` présents | **CONFORME en modèle pilote**, vérifier la conservation complète de chaque révision |
| Mise à jour / conflits | CA-3 compare toutes les sections ; cinq champs projetés sur le Mouvement | **PARTIELLEMENT CONFORME** : préserver le suivi éditorial complet et la non-régression locale |
| Projection vers le Mouvement | `PROJECTED_FIELDS` : nom, alias, étapes, catégorie, zones | **PARTIELLEMENT CONFORME** : média non transporté et structure de phases/familles non importée ; définir précisément les règles avant d'étendre la projection |
| Médias | Description et droits dans `CatalogueSheet.media` ; `Movement.media` utilise des ressources locales | **PARTIELLEMENT CONFORME** : transport physique, import, gestion d'actifs, nettoyage et droits à spécifier séparément |
| Homonymie | Index global `movements(normalized_name)` et gardes dépôt/domaine/UI/pilote | **NON CONFORME à la cible multi-sources** : migration/index partiel + gardes homogènes nécessaires avant imports avec homonymes |
| Auteur | Format v1 et provenance pilote : `authors[]` ; conception BIB-02 : **au plus un auteur** | **NON CONFORME entre sources** : arbitrage sur la représentation ou adaptation du format nécessaire avant code |
| Référentiels | Catégorie et Zones du téléphone sont nécessaires ; autres axes éditoriaux dans le fichier | **PARTIELLEMENT CONFORME** : définir mapping, non-création implicite, signalement des valeurs manquantes |
| Administration Web | Brouillons et propriétés existent ; CA-1 annonce format compatible cible | **À VÉRIFIER** : capacité réelle à ouvrir/créer une 61e fiche, éditer tous les champs, réviser, puis exporter v1 |
| Réconciliation 60 fiches | `install.knownLocalMovementIds`, `ADOPTABLE`, `TO_RECONCILE`, registre pilote | **PARTIELLEMENT CONFORME** : garantir rapprochement sans perte ni duplication avec tests réels |
| Interface mobile | `MovementScreen.tsx` et `ActivityEditorForm.tsx` existent ; Figma est l'autorité visuelle | **À VÉRIFIER** champ par champ ; ne pas afficher automatiquement toutes les métadonnées de l'administration dans le mobile |
| Bibliothèque utilisateur | Décisions BIB-19–23 et écran Profil Figma `1992:778` | **Hors développement présent** : préparer la compatibilité, sans nouvelle interface |

## 4. Travail de développement à préparer, par incréments courts

**Tranche MOUV-1 — consolidation de modèle et contrats, priorité immédiate.**
- Prendre pour source technique la **branche CA-1/CA-2/CA-3/CA-4 réellement disponible**, sans recopier ses fichiers depuis la mémoire ni en fusionner des portions silencieusement.
- Déterminer le delta réel entre cette branche, la branche choisie pour développer et les contrats de la fiche. Protéger le modèle `Movement` et les références existantes.
- Stabiliser les règles de nom/homonymie, identité, révision, historique, provenance, droits et médias dans le **contrat** ; ne pas créer deux modèles éditoriaux concurrents.
- Vérifier par tests la validation exhaustive `parseMovementCatalogueFile` et la projection ; ne pas réécrire un système déjà couvert.

**Tranche MOUV-2 — persistance de fiche et import, après résolution des divergences indispensables.**
- Utiliser les tables/services existants et, si nécessaire, ajouter **une migration additive** de la base principale ; numéro déterminé au moment du développement/assemblage réel, **aucun numéro prédéfini**. Le registre séparé `kodjo-catalogue-registry.db` reste acceptable provisoirement.
- Conserver identité locale et identité éditoriale séparées ; provenance et permissions éditoriales y compris pour une copie, sans mutation de la source. Ne pas faire porter à `origin_namespace=NULL` seul la provenance d'une copie : garder une filiation dédiée.
- Modifier l'unicité des noms globalement de façon **cohérente** : SQLite, dépôt, domaine, écran et planificateur du pilote. Maintenir la protection contre deux créations locales homonymes ; accepter plusieurs sources installées homonymes ; afficher l'origine selon le contrat UX s'il existe.
- Préserver le protocole CA-3 : intention durable → écriture du Mouvement → confirmation du registre ; reprise idempotente. Test de migration sur base peuplée obligatoire.

**Tranche MOUV-3 — fiche mobile et administration, seulement dans leurs périmètres autorisés.**
- Fiche mobile : **uniquement** les propriétés et comportements déjà validés dans les contrats et Figma, sans second éditeur dans Profil ; les champs éditoriaux sans écran validé restent persistés dans le contrat source, non introduits arbitrairement dans l'UI.
- Administration Web : créer une 61e fiche, la modifier, versionner, gérer métadonnées/médias et exporter un fichier v1 accepté sans transformation par les mêmes validateurs ; vérifier les divergences Node.js local / OVH. Ne pas développer une plateforme de publication communautaire.
- Transport physique des médias : ne pas le déclarer fonctionnel tant que téléchargement/copie, droits, contrôle des chemins et récupération après échec ne sont pas éprouvés.
- Reprise des 60 : tests sur installation existante avec `Movement.id` et Séances préexistantes, aucune duplication ni perte, variations locales et interruptions.

## 5. Points à arbitrer ou clarifier avant écriture irréversible

1. **Auteur unique** : BIB-02 limite à un auteur, tandis que CA-1 conserve `authors[]` (0..n) ; conserver les données actuelles et **ne pas supprimer d'auteur à la migration**. Demander la représentation normative (champ unique ou tableau borné à 1), plutôt que trancher implicitement.
2. **Projection médias** : le format les décrit, mais leur transfert vers les actifs locaux n'est pas réalisé ; ne pas inventer une installation de média sans droits, source exploitable et stratégie de stockage.
3. **Phases et familles** : propriétés locales d'exercice/mouvement préexistantes, actuellement non modifiées par CA-3. Les importer depuis la fiche exige une règle explicite de mapping et de préservation des personnalisations.
4. **Homonymes** : index unique partiel proposé par revue Claude (créations locales `origin_namespace IS NULL`) mais non testé en exécution ; vérifier aussi toutes les gardes de saisie.
5. **Attributs éditoriaux dans le mobile** : seul Figma valide la présentation. Les `startingPosition`, `equipment`, `safetyNotes`, spécialités, autres axes, provenance détaillée ne deviennent pas automatiquement des champs modifiables dans `MovementScreen`.
6. **Pilote privé vs Bibliothèques génériques diffusables** : les 60 fiches à propriétaire inconnu sont non publiables ; obtenir les droits et métadonnées d'une version publique sans supposer que la reprise locale vaut autorisation de diffusion.
7. **Règles de copies et adaptations** : assurer identité et filiation sans écraser la source ; le traitement des conflits éditoriaux locaux reste à préciser par canal.

Ces points ne bloquent **pas** la lecture/validation/stockage sans perte du contrat existant ; ils bloquent seulement les mutations de données ou règles nouvelles qui en dépendent.

## 6. Critères de sortie et preuves attendues pour Claude

- Matrice exhaustive `propriété de fiche → format CA-1 → validateur → stockage → projection mobile → administration Web → tests`, statut **CONFORME / PARTIELLEMENT CONFORME / NON CONFORME / NON VÉRIFIABLE / À CLARIFIER**, avec fichiers et lignes.
- Tests de contrat v1 et round-trip (valeurs et ordre), homonymes, provenance/owner inconnus, droits de médias, version/fingerprint, altérations du contenu, refus atomique d'un fichier invalide.
- Migration additive sur base réelle et données conservées, y compris catalogues et références historiques ; pas de renumérotation imposée par ce document.
- CA-3 : idempotence, reprise après coupure, conservation adaptations locales et absence de suppression/duplication des 60.
- Vérification de non-régression de `MovementScreen`, des Exercices et Séances sans modifier le moteur.
- Toute fonctionnalité non implémentée doit rester explicitement **NON VÉRIFIABLE** ou « à développer » ; aucun test déclaré réussi sans exécution.
- Livraison d'une branche de code dédiée et d'un rapport de diff ; **aucune PR/fusion** sans autorisation.

## 7. Mandat de développement à remettre à Claude

> Projet KODJO, dépôt `MyUncried/Application-Routine`. Travailler exclusivement sur le chantier **Mouvement / fiche éditoriale / modèle de données / import CA-3**, sans intervenir sur PRE-10, le moteur d'exécution, les Séances, Figma ou le partage communautaire.
>
> Lire intégralement `docs/KODJO-Fiche-Mouvement-Contrat-consolide-et-handoff-2026-11-11.md`, puis les sources CA-1/CA-2/CA-3/CA-4 de la branche `catalogue/integration-60-main-20261109` : `docs/KODJO-Format-catalogue-mouvements-v1.md`, `docs/KODJO-Provenance-propriete-fiches-mouvements-2026-11-06.md`, `src/domain/catalogue/MovementCatalogueFile.ts`, `MovementEditorialProvenance.ts`, `catalogueLoadPlan.ts`, `src/features/catalogue/CatalogueLoadService.ts` et `SqliteCatalogueRegistry.ts` ; comparer au code réel de la branche de développement. **Ne pas fusionner, écraser ou reconstruire silencieusement les branches.**
>
> Priorité 1 : produire l'inventaire complet et différentiel des propriétés de fiche, du validateur, de la projection, de la persistance, de l'administration Web et des écrans mobiles ; classer les divergences avec évidences. Préserver la séparation `Movement.id` / `(catalogue.id,sheetId)`.
>
> Priorité 2 : proposer puis implémenter les corrections **déjà arbitrées** du contrat et de la persistance, en réemployant CA-1/CA-2/CA-3 ; migration additive si nécessaire, numéro attribué au moment de l'intégration, tests de conservation et de non-régression. Pour les points non tranchés (auteur, projection des médias, phases/familles, UI non représentée), ne rien inventer : documenter la décision nécessaire et isoler les travaux indépendants.
>
> Priorité 3 : préparer l'évolution de la fiche Mouvement existante dans le **Catalogue**, sans déplacer l'édition vers Profil. Établir la matrice `propriété ↔ Figma ↔ contrat d'écran ↔ état mobile` et modifier uniquement les champs dont l'UX est déjà validée. Préparer les interfaces de service communes avec l'administration Web, sans dupliquer les règles.
>
> Accepter comme critères minimaux : toutes les fiches et leurs métadonnées conservées, aucun doublon ni écrasement des 60 Mouvements déjà installés, révisions et conflits traçables, test de migration sur base peuplée, reprise idempotente, aucun impact sur le moteur et les Séances. Exécuter les tests disponibles et rapporter précisément résultats et limites.
>
> Travailler sur une **branche distincte**. Ne pas ouvrir de PR ni fusionner `main`. Fournir commits, diff complet, tests exécutés, matrice de conformité et liste courte des arbitrages effectivement bloquants.

**Portée de cette livraison :** document de cadrage et de développement ; la modification de code reste à demander à Claude. Les limitations identifiées sont issues des sources consultées, non de tests d'exécution.

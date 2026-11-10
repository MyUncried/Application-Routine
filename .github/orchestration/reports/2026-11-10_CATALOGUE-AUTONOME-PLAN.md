# 2026-11-10 — CATALOGUE-AUTONOME — Plan d'évolution minimal

**Statut :** `PLAN_READY_FOR_REVIEW` — aucune modification de code, aucune build, OTA ni fusion avant validation.
**Branche de départ :** `catalogue/integration-60-main-20261109`, commit `c14704ae` (worktree `C:/Dev/KODJO-CAT60-MAIN`).
**Décision de Hermann (10/11) :** option A, catalogue autonome, avec une architecture permettant ensuite l'option B (téléchargement depuis OVH) sans changer le modèle de données. Huit précisions (§ 1).

## 1. Exigences reçues

| # | Exigence (Hermann, 10/11) | Classement |
|---|---|---|
| E1 | Fichier autonome : toutes les fiches et propriétés (classifications, identifiants, provenance, révisions) ; plus aucune dépendance aux 60 fiches embarquées | Indispensable |
| E2 | Fonctionner avec un catalogue vide ; ne jamais supprimer les Mouvements de l'utilisateur ni les données présentes | Indispensable |
| E3 | Chargement idempotent ; reconnaître l'installé ; distinguer nouvelles fiches et nouvelles révisions | Indispensable |
| E4 | Aucune mise à jour silencieuse : accepter, refuser ou reporter ; préserver les adaptations locales | Indispensable |
| E5 | Partage futur entre utilisateurs (particuliers, coachs, kinés) : auteur, source, révisions | **Format** indispensable, **fonction** future |
| E6 | Médias et métadonnées préservés dans le modèle cible ; transport physique dans une tranche séparée | **Métadonnées** indispensables, **transport** futur |
| E7 | Compatible avec le SQLite actuel ; indépendant du moteur d'exécution PRE-10 | Indispensable |
| E8 | Conserver les 60 Mouvements déjà importés dans la build de recette, sans suppression ni doublon | Indispensable |

## 2. État actuel (constaté dans le code)

- `pilotMovementImport.ts` importe statiquement `catalogue/pilote/mouvements-60-candidats.json` et `preclassement-60-candidats-v0.json`. Le JSON d'administration ne fait que **modifier** ces 60 fiches. Toute fiche nouvelle exige une build : contraire à E1.
- Identifiants de Mouvement installés : `pilot:<originalId>` (`pilot:REED-001` … `pilot:FIT-STR-010`).
- Modèle `Movement` (SQLite v23 sur `main`) :
  - colonnes : `id`, `name`, `normalized_name`, `description`, `category_id`, `next_phase_id`, `level_group_id`, `level_sort_key`, `archived_at`, horodatages ;
  - tables liées : `movement_aliases`, `movement_body_zones`, `movement_phases`, `movement_media` → `media_assets`.
  - Aucune colonne de provenance, d'auteur ni de révision.
- Catégories et Zones : tables `categories` et `body_zones` préremplies par migration (identifiants stables).
- Réimport : un Mouvement présent mais différent **bloque tout** l'import (« contenu différent »). Il n'existe ni décision par fiche, ni mémoire de ce qui a été installé.
- **Contrainte de migration** : `DATABASE_VERSION` vaut 23 sur `main` et **24 sur PRE-10** (`origin/pre10-bmad/dev`). `migrateDatabase` applique les versions dans l'ordre et refuse une base plus récente que le code.
  - Si la build de recette recevait une migration catalogue numérotée 24, la base de « Routine Catalogue » serait ensuite incompatible avec la migration 24 de PRE-10.
  - Toute migration du schéma principal par la branche catalogue est donc à proscrire tant que PRE-10 n'est pas fusionné.

## 3. Principe retenu

Trois couches séparées, aucune modification du schéma principal :

1. **Fichier catalogue** (donnée, hors code) : format versionné `KODJO_MOVEMENT_CATALOGUE`, autonome. Le même fichier sert pour l'import local (A) et plus tard pour le téléchargement (B).
2. **Registre d'installation** (mémoire locale de ce qui vient d'un catalogue) : dans une **base SQLite distincte** (`kodjo-catalogue-registry.db`), avec ses propres versions. Elle ne touche ni `DATABASE_VERSION` ni les migrations PRE-10 (E7).
3. **Moteur de chargement** (code, sans donnée) :
   - il compare le fichier, le registre et les Mouvements réels, puis produit un plan de chargement ;
   - il n'écrit que ce qui est sans ambiguïté (nouvelles fiches) ;
   - toute modification d'un Mouvement existant attend une décision.
   - Il passe exclusivement par `MovementCatalogueService` et le repository existants, sans contournement de validation.

Les Mouvements installés restent des Mouvements KODJO ordinaires : l'exécution, les Séances et PRE-10 n'en savent rien.

## 4. Format de fichier `KODJO_MOVEMENT_CATALOGUE` v1 (proposition)

```jsonc
{
  "format": "KODJO_MOVEMENT_CATALOGUE",
  "formatVersion": "1.0.0",
  "catalogue": {
    "id": "kodjo.pilot",                 // identifiant global stable du catalogue
    "title": "Catalogue pilote KODJO",
    "revision": "2026-11-10.1",          // révision du fichier
    "generatedAt": "2026-11-10T10:00:00Z",
    "publisher": { "id": "ankusha", "name": "…", "role": "EDITOR" },
    "publicationStatus": "TEST",         // TEST | DRAFT | PUBLISHED (frontière de provenance)
    "source": { "kind": "FILE" }          // FILE (A) ; plus tard URL (B), avec empreinte
  },
  "references": {                        // vocabulaires utilisés par les fiches
    "categories": [{ "id": "cardio", "label": "…" }],
    "bodyZones":  [{ "id": "cuisses", "label": "…" }],
    "specialties": [], "gesturalFamilies": [], "anatomicalTargets": [], "clinicalProblems": []
  },
  "movements": [{
    "entryId": "pilot:REED-001",         // identifiant global stable de la fiche = id du Mouvement installé
    "revision": 1,                       // entier croissant par fiche
    "contentHash": "sha256:…",           // empreinte canonique de "content"
    "content": {                         // strictement le contrat Movement actuel
      "name": "…", "description": "…", "aliases": [], "categoryId": "…",
      "bodyZoneIds": [], "phases": [], "nextPhaseId": 1
    },
    "classifications": { "specialties": [], "gesturalFamilies": [], "anatomicalTargets": [], "clinicalProblems": [], "original": {} },
    "provenance": {
      "authors": [{ "id": "…", "name": "…", "role": "AUTHOR|COACH|PHYSIOTHERAPIST|EDITOR" }],
      "source": { "id": "PIL-ANY", "url": "…", "section": "…" },
      "derivedFrom": null,               // { entryId, revision } — partage et adaptation, futur
      "validation": { "classification": "PENDING", "clinical": "NOT_ASSESSED", "rights": "PENDING" }
    },
    "media": [{                          // métadonnées complètes ; transport futur
      "id": "…", "kind": "PHOTO|VIDEO", "mimeType": "…", "sha256": "…", "bytes": 0,
      "location": null,                  // futur : URL ou chemin relatif dans un paquet
      "caption": "", "alt": "", "attribution": "", "license": "", "rightsStatus": "UNVERIFIED"
    }],
    "history": [{ "revision": 1, "date": "…", "author": "…", "summary": "…" }]
  }]
}
```

Règles :

- `content` ne contient que ce que le modèle `Movement` sait stocker. Classifications, provenance, médias et historique sont **conservés tels quels** dans le registre, sans être ajoutés artificiellement au modèle `Movement` (règle déjà actée du pilote).
- `entryId` est l'identifiant du Mouvement installé. Pour le pilote, il reste `pilot:<id>`, ce qui permet de reconnaître les 60 Mouvements déjà présents (E8). Les catalogues futurs utiliseront `<éditeur>:<id>`.
- Les références de Catégorie et de Zone doivent exister localement. Une fiche qui en cite une inconnue est **écartée et signalée**, sans création implicite de Catégorie.
- Aucune valeur par défaut n'est cachée dans le code : le préclassement de recette devient une donnée du fichier.
- Taille : les médias ne sont pas intégrés en base64 dans le fichier, donc la limite de 24 Mo n'est plus contraignante pour les métadonnées.

## 5. Registre d'installation (base distincte)

Une ligne par fiche installée ou connue :

| Champ | Rôle |
|---|---|
| `entry_id` | Identifiant de la fiche = `movements.id` |
| `catalogue_id` | Catalogue d'origine |
| `installed_revision`, `installed_hash` | Révision et empreinte du contenu **tel qu'installé** |
| `entry_snapshot` | JSON complet de la fiche installée (classifications, provenance, médias, historique) — E5, E6 |
| `pending_revision`, `pending_snapshot` | Révision proposée en attente de décision (report) |
| `decision` | `NONE` / `DEFERRED` / `REFUSED` (avec révision refusée) |
| `installed_at`, `updated_at` | Horodatages |

Le registre ne modifie jamais un Mouvement. Il est **reconstructible** : en l'absence de ligne, un Mouvement de même identifiant et de contenu équivalent est « adopté » (cas des 60 fiches de recette, ou d'une interruption entre l'écriture du Mouvement et celle du registre). Il n'y a donc pas besoin de transaction commune aux deux bases.

## 6. Classement d'une fiche au chargement (E3, E4, E8)

Pour chaque fiche du fichier, comparée au registre et au Mouvement local :

| Cas | Condition | Action par défaut |
|---|---|---|
| `NEW` | Ni Mouvement ni registre, nom libre | **Installée** (après confirmation globale) |
| `NAME_CONFLICT` | Nom normalisé déjà pris par un autre Mouvement | Écartée et signalée ; rien n'est écrit pour cette fiche seule (les autres continuent) |
| `UNCHANGED` | Même révision, Mouvement identique à l'installé | Rien |
| `ADOPTABLE` | Mouvement présent, pas de registre, contenu équivalent | Inscription au registre seulement (**les 60 de recette**) |
| `LOCAL_ONLY_DIFF` | Mouvement présent, pas de registre, contenu différent | Inscription « adaptation locale », aucune écriture sur le Mouvement |
| `REVISION_CLEAN` | Révision plus récente, Mouvement non modifié localement | **Proposée** : accepter / refuser / reporter |
| `REVISION_ON_ADAPTED` | Révision plus récente, Mouvement modifié localement | Proposée avec avertissement ; par défaut adaptation conservée |
| `LOCALLY_ADAPTED` | Même révision, Mouvement modifié localement | Rien (adaptation préservée) |
| `LOCALLY_REMOVED` | Registre présent, Mouvement supprimé ou archivé | Non réinstallée ; signalée |
| `REFUSED` | Révision déjà refusée | Rien tant qu'une révision supérieure n'arrive pas |
| `INVALID` | Échec de `validateMovement` ou référence inconnue | Écartée et signalée |

- Les fiches absentes du nouveau fichier ne sont **jamais supprimées** localement (E2).
- Un catalogue vide est valide : 0 fiche, aucune écriture.
- Accepter une révision fait passer le Mouvement par `MovementCatalogueService.update`, en conservant son identifiant, donc ses usages dans les Séances.
- Refuser enregistre la révision refusée. Reporter enregistre la révision en attente, qui sera reproposée.
- Idempotence : recharger le même fichier n'écrit rien et ne repropose que les révisions reportées.

## 7. Découpage — indispensable / futur

### Indispensable au catalogue autonome (tranches proposées)

| Tranche | Contenu | Écritures |
|---|---|---|
| **CA-1 Format** | Schéma `KODJO_MOVEMENT_CATALOGUE` v1 ; validateur pur ; empreinte canonique ; tests | Code pur, aucune donnée de l'appareil |
| **CA-2 Générateur** | Script PC (`tools/catalogue/`) qui produit le fichier à partir du corpus actuel, du préclassement et d'un export de brouillons OVH (lecture seule, aucune modification d'OVH). Le fichier pilote est versionné hors de `src/`. | Fichier de données |
| **CA-3 Registre + moteur** | Base distincte ; classement du § 6 ; application des `NEW` et des adoptions ; décisions accepter / refuser / reporter | Mouvements via le service existant ; registre |
| **CA-4 Écran de recette** | Remplace « Importer 60 fiches » par « Charger un catalogue » : sélecteur de fichier, récapitulatif par cas, liste des révisions avec décision par fiche. Outil interne sans référence Figma, visible seulement avec `EXPO_PUBLIC_KODJO_CATALOGUE_IMPORT=1`. | — |
| **CA-5 Retrait du corpus embarqué** | Suppression des `import` JSON de `src/` ; anciens tests convertis sur le nouveau format | Code |
| **CA-6 Recette iPhone** | Build `catalogue-recette` (sur accord), puis trois chargements de fichiers **produits par le générateur (CA-2)** : (1) fichier pilote sur la base qui contient les 60 : **60 adoptés, 0 ajouté, 0 doublon** ; (2) même fichier rechargé : aucune écriture ; (3) fichier régénéré après modification d'une fiche existante et ajout d'une fiche : **1 nouvelle installée, 1 révision proposée**, testée en accepter, refuser et reporter, avec une adaptation locale préservée | Appareil de recette uniquement |

### Futur, préparé par le format mais non développé

- Option B : téléchargement depuis OVH (URL, empreinte et signature, contrôle de révision, cache).
- Transport des médias (paquet ou URL, vérification `sha256`, stockage, affichage).
- Partage entre utilisateurs : export d'un Mouvement local au même format, `derivedFrom`, identités d'auteurs vérifiées, droits.
- Fusion assistée champ par champ d'une révision et d'une adaptation locale ; historique consultable.
- Synchronisation ; catalogue éditorial publié ; validation clinique.
- Intégration éventuelle du registre dans le schéma principal (après PRE-10, numéro de migration coordonné).

## 8. Preuves prévues

- Tests purs : validation du format, empreinte stable (ordre des clés, des alias et des Zones), refus des formats étrangers.
- Tests SQLite réels (`node:sqlite`) avec le repository existant :
  - catalogue vide ;
  - 60 nouvelles fiches ;
  - rechargement identique sans écriture ;
  - **base remplie par l'ancien importeur → 60 adoptés, 0 écriture sur `movements`** (E8) ;
  - nouvelle fiche plus révision dans le même fichier ;
  - adaptation locale préservée ;
  - accepter / refuser / reporter ;
  - fiche supprimée localement non réinstallée ;
  - conflit de nom isolé ;
  - Mouvements utilisateur et tables hors Mouvement inchangés (instantané complet) ;
  - interruption puis reprise ;
  - registre perdu puis reconstruit.
- Double de base « connexion en retard » (déjà en place) appliqué au moteur.
- Générateur : le fichier pilote produit installe exactement les mêmes 60 contenus que l'ancien importeur ; une modification de fiche dans les brouillons produit une révision (`revision` + 1, nouvelle empreinte), un ajout produit une nouvelle fiche, un rechargement sans modification ne change ni révision ni empreinte.
- Chaîne complète en test automatisé : générateur → fichier → moteur → SQLite réelle, pour les trois chargements de CA-6, avant la recette sur iPhone.
- `tsc`, eslint, CI de branche. Simulation de fusion avec `main` et PRE-10 : aucun fichier de migration touché.

## 9. Risques et points à arbitrer

1. **Base distincte plutôt que migration** : elle préserve PRE-10 et `DATABASE_VERSION`, au prix d'une cohérence par réconciliation et non par transaction. À valider.
2. **`description`** : le modèle stocke un texte unique. Le format porte `content.description` tel quel ; les étapes structurées restent dans `classifications.original` tant que le modèle ne les distingue pas.
3. **Catégories et Zones inconnues** : la fiche est écartée (pas de création implicite). La création de référentiels par catalogue est une décision future.
4. **Statut `TEST`** : le fichier pilote reste marqué `publicationStatus: TEST`. Le chargement ne vaut pas validation éditoriale ni clinique.
5. **Destination de l'outil** : tout reste sur la branche catalogue. Son entrée dans `main` (sans aucune donnée de test) sera une décision séparée.
6. **PR #436** : indépendante, en attente de la validation iPhone de la build `6987d086`.

## 10. État Git et suite

- Ce document seul est ajouté (aucun fichier applicatif modifié) sur `catalogue/integration-60-main-20261109`.
- Attendu de Hermann : validation, modification ou refus du plan (en particulier § 9.1 à 9.3) avant toute écriture de code.

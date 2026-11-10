# KODJO — Dossier de conception pour revue indépendante Claude
## Bibliothèques de Mouvements, droits, distribution, mises à jour et modération

**Date :** 10 novembre 2026  
**Statut :** **PROPOSITION DE CONCEPTION POUR REVUE**, non approuvée techniquement ni développée ; décisions métier existantes respectées, options techniques et questions ouvertes explicitement séparées.  
**Dépôt :** MyUncried/Application-Routine.  
**Branche de travail :** docs/conception-bibliotheques-partage-moderation-20261110, non fusionnée dans main.  
**Source métier principale :** [Parcours utilisateurs cibles](KODJO-Bibliotheques-Parcours-utilisateurs-cibles-2026-11-10.md), décisions BIB-01–18 et F4-A–F4-F.  
**Cadre :** ne pas changer silencieusement le MVP local, le moteur PRE-10, les familles/niveaux, la structure des Séances ou Figma. Cette spécification n'autorise pas le développement sans revue et arbitrages des points bloquants.

---

## 0. Résumé architectural et périmètre

KODJO doit permettre à un utilisateur de créer/organiser localement des Bibliothèques de Mouvements, puis à terme de partager ses Bibliothèques, en recevoir, acheter éventuellement des accès et recevoir des mises à jour **sur demande**. Les Bibliothèques possèdent leur composition, les Mouvements possèdent leurs fiches et permissions. Le droit d'**accéder** aux Mouvements est transmis **par la Bibliothèque** ; les permissions **Modifier/Redistribuer** restent attachées **à chaque fiche**.

La cible vise une **séparation logique** simple, pas un ensemble de microservices dès le départ :

1. **Domaine Mouvements** : identité éditoriale, provenance, révisions, droits de modification/redistribution, médias.
2. **Domaine Bibliothèques** : composition par référence, version de composition, visibilité, archivage, partage et arrêt de diffusion.
3. **Domaine Accès** : autorisation d'utiliser les Mouvements reçus via une Bibliothèque (individu/groupe), preuve locale d'installation et conservation des droits après retrait d'un membre.
4. **Domaine Distribution et modération** : demande de diffusion, contrôle d'une révision, publication, signalements et retraits prioritaires.
5. **Domaine Commerce** : **hors périmètre de cette conception** ; il pourra fournir plus tard la validité d'un accès payant au domaine Accès sans modifier les fiches ni la composition.

**Proposition technique minimaliste :** application Expo/React Native + SQLite conservée ; backend central modulaire à sélectionner (PostgreSQL / stockage objet privé / traitements asynchrones) uniquement quand le partage sera développé. Le moteur d'exécution reste autonome hors ligne.

**Périmètre MVP :** création et utilisation locales déjà existantes seulement. Les fonctions de partage et de contrôle réseau sont **post-MVP**, à livrer par lots.

## 1. Autorité des sources et décisions

### 1.1 Règles métier validées (non négociables sans nouvel arbitrage)

| ID | Règle |
|---|---|
| BIB-01–05 | Tous profils peuvent créer des Bibliothèques ; composition par références, provenances mélangées, visibilités personnelle/partagée/publique et gratuit/payant distincts. |
| BIB-02 | Une fiche Mouvement a **un auteur maximum** et un propriétaire administratif éventuellement distinct. Auteur inconnu permis pour des imports privés à source inconnue ; pas de propriété fictive. |
| BIB-06–08 | Modifier et Redistribuer indépendants (quatre modes). Copier localement est toujours possible **sans changer les permissions**. Les paramètres d'Exercice restent indépendants. |
| BIB-09–11 | Bibliothèque reçue **non modifiable dans sa composition** ; redistribution **sélective** des seules fiches redistribuables, sans exposition des fiches interdites. |
| BIB-12–13 | Révision ordinaire appliquée seulement sur commande « Mettre à jour » ; adaptations personnelles non écrasées. |
| BIB-14–17 | Validation centrale des révisions avant toute diffusion ; privé sans anomalie = automatique possible ; premier public/payant = humain ; modération prioritaire après publication et signalement. |
| BIB-18 | Partage, comptes, modération centrale, monétisation hors MVP local. |
| F4-A | La mise à jour d'une Bibliothèque reçue est **manuelle** avec pastille. |
| F4-B | Un Mouvement retiré d'une Bibliothèque source et précédemment installé reste **dans le Catalogue local** de l'utilisateur ; ses références dans les Séances/Bibliothèques personnelles restent. |
| F4-C | Le propriétaire coach/kiné attribue le droit d'accès **au niveau Bibliothèque**, et les membres en bénéficient. Le retrait d'un membre **ne révoque pas** son usage local déjà acquis ; commerce et modération sont des exceptions à spécifier séparément. |
| F4-D | Un seul « Mettre à jour » installe la nouvelle **composition ET les nouvelles révisions de Mouvements**, sans supprimer les Mouvements retirés ni écraser les adaptations personnelles. |
| F4-E | Archiver une Bibliothèque est personnel/local et n'a **aucun effet sur les destinataires** ni sur leurs mises à jour. |
| F4-F | Arrêter le partage bloque les **nouvelles distributions** ; les destinataires existants conservent leurs installations, n'obtiennent **plus de nouvelles mises à jour** tant que le partage reste arrêté. |

**Arbitrages explicitement non faits :** détails des offres et paiements, expiration d'accès, retransmission d'une installation sur un nouvel appareil après arrêt du partage, modification postérieure de permissions, règles de groupe, gestion des conflits complexes et emplacement UX des commandes.

### 1.2 Frontières de sources de vérité

- **Figma** : rendu visuel et états existants du Prototype MVP ; les nouveaux parcours de Bibliothèques/partage/modération ne sont pas des écrans validés. Actions « Partager » observées dans le prototype (nœuds 10501:23846, 10579:21622).
- **Documentation fonctionnelle** : comportements et résultat observable ; les deux documents de conception du 10/11 sont des compléments cibles.
- **Documentation technique** : schémas et mécanismes proposés sous réserve de revue Claude.
- **Registre des décisions** : BIB-01–18 validés ; F4-A–F4-F validés dans la conversation, **non encore propagés au registre** au moment de la rédaction de ce dossier. Ne pas les attribuer fictivement à un numéro D-xxx.

## 2. Parcours utilisateur à implémenter

La source détaillée est [PU-01 à PU-16](KODJO-Bibliotheques-Parcours-utilisateurs-cibles-2026-11-10.md), à lire avant toute conception d'API ou d'écran.

| Parcours | Émetteur / destinataire | Résultat obligatoire |
|---|---|---|
| PU-01/02 | Propriétaire | Créer et composer ses Bibliothèques localement ; **associations sans copies**. |
| PU-03/04 | Auteur / détenteur local | Créer/corriger selon droits, copier en héritant strictement des permissions. |
| PU-05/06 | Diffuseur | Partager Bibliothèque ou Mouvement seul ; aucun élément non redistribuable exposé. |
| PU-07 | Plateforme | Autorisation centrale par révision ; échec ou attente bloque publication. |
| PU-08/09 | Destinataire | Installer Bibliothèque reçue en lecture seule et référencer ses fiches dans des Bibliothèques personnelles. |
| PU-10/11 | Destinataire | Pastille puis **un clic volontaire** ; actualiser composition et révisions, conserver les mouvements retirés et adaptations locales. |
| PU-12 | Propriétaire | Retrait d'un Mouvement lors d'une révision sans destruction des installations et Séances préexistantes. |
| PU-13 | Propriétaire / destinataire | Archivage/restauration sans effet sur les droits ou la diffusion. |
| PU-14 | Propriétaire | Arrêt de diffusion sans révocation des usages acquis ; plus de nouvelles mises à jour. |
| PU-15 | Utilisateur / KODJO | Signalement et retrait de modération prioritaire. |
| PU-16 | Utilisateur | Utilisation locale hors ligne, reprise après interruption d'installation. |

## 3. Architecture fonctionnelle — invariants

### 3.1 Trois notions de droits à ne pas mélanger

- **Permission éditoriale de la fiche** : booléens \`canEdit\` et \`canRedistribute\`. Quatre modes affichables. Les copies personnelles ne les amplifient pas.
- **Droit d'accès à la Bibliothèque** : accord du propriétaire à un individu/groupe ; ouvre l'usage de ses membres reçus. Une preuve de cet accès accompagne l'installation. Retirer un membre de la source ne supprime pas la preuve d'installation antérieure.
- **État de modération** : peut bloquer temporairement ou définitivement une fiche/média même si accès et permissions seraient par ailleurs suffisants.

Une future acquisition payante pourra contribuer à la validité du **droit d'accès** ; elle ne transforme ni la permission éditoriale ni le statut de modération.

### 3.2 Propriété administrative / propriété intellectuelle

Le créateur de la fiche originale devient auteur unique et propriétaire administratif par défaut. Une organisation peut gérer ou distribuer explicitement une fiche ; elle ne devient pas automatiquement titulaire des droits d'auteur. Toute publication externe nécessite une déclaration de droits appropriée ; le pilote de fiches de propriétaire inconnu reste privé.

### 3.3 Règles de version

- **Révision de Mouvement** : version éditoriale du texte, médias, description, taxonomie et provenance contrôlée ; identité immuable + empreinte de contenu.
- **Révision de Bibliothèque** : version de la **composition ordonnée** (et de ses attributs éditoriaux distribués), indépendante des révisions des fiches.
- Une proposition de mise à jour peut contenir des différences de composition, de fiches ou les deux.
- L'action unique « Mettre à jour » doit conduire à un état cohérent correspondant à la version choisie et aux révisions approuvées ; l'absence d'action conserve l'état installé.
- Des fiches exclues par droits de redistribution ne doivent pas fuiter dans la projection distribuée.
- **Modération** : traitement hors cycle de mise à jour volontaire, pouvant invalid er l'accès à une version déjà installée après synchronisation.

### 3.4 Cycle de vie de la Bibliothèque

Séparer deux dimensions indépendantes :
- **Organisation locale** : visible dans la liste courante / archivée ; la restauration n'a aucune conséquence externe.
- **Diffusion** : non partagée / partagée ou publique / arrêtée. Arrêter la diffusion n'est pas archiver.

Une Bibliothèque en cours de modification peut préparer une nouvelle composition avant de publier une nouvelle révision. Ne pas imposer l'état générique « Inactif » à l'objet Bibliothèque ; ce modèle a été écarté.

## 4. Architecture logique proposée

\`\`\`text
KODJO iPhone (Expo / RN)
  ├─ Séances / moteur Exécution  ───────────────► SQLite opérationnelle existante
  ├─ Catalogue local de Mouvements
  ├─ Bibliothèques locales / reçues / archives
  ├─ Correspondances source ↔ Mouvement local
  └─ Synchronisation explicite des révisions et modération
                 │ HTTPS authentifié, à développer
                 ▼
       Backend KODJO (modulaire)
  ├─ Identité, utilisateurs et groupes
  ├─ Catalogue éditorial : fiches, révisions, médias
  ├─ Bibliothèques : compositions et révisions
  ├─ Droits d'accès par Bibliothèque et droits éditoriaux par fiche
  ├─ Distribution filtrée + manifeste des révisions approuvées
  ├─ Modération automatique / file d'examen / décisions
  └─ Evénements / notifications de nouvelles versions / suspensions
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
 Base relationnelle    Stockage privé
 (cible à choisir)     (images / vidéos)
       │                   │
       └─────► Contrôles de sécurité, modération et journal
\`\`\`

**Proposition de simplicité :** un backend modulaire unique avec base relationnelle, plutôt que cinq microservices. Les traitements vidéo/IA pouvant être asynchrones, une file de travaux ne devient nécessaire que si la charge ou la fiabilité le justifie.

**Choix non décidés :** Supabase/PostgreSQL, service de stockage objet, fournisseur d'authentification, API de modération (texte/image/vidéo), dispositif de notifications et hébergement. Les citer dans ce dossier ne les rend pas obligatoires.

## 5. Modèle de données fonctionnel / relationnel cible

### 5.1 Référentiel central — proposition de tables

| Table logique | Clé et champs principaux | Relations et contraintes |
|---|---|---|
| \`actor\` | \`actor_id\`, \`kind\` (USER, ORGANIZATION, PLATFORM), \`display_name\` | Identité de gestion ; ne constitue pas preuve de propriété intellectuelle. |
| \`editorial_sheet\` | \`sheet_id\`, \`source_namespace\`, \`author_actor_id NULL\`, \`owner_actor_id NULL\`, \`rights_holder_actor_id NULL\`, \`can_edit\`, \`can_redistribute\`, \`origin\`, \`upstream_sheet_id NULL\` | Identité stable. Auteur unique ; provenance et permissions de copie héritées. \`owner_actor_id NULL\` possible sur import privé inconnu, diffusion interdite jusqu'à vérification. |
| \`sheet_revision\` | \`revision_id\`, \`sheet_id FK\`, \`revision_number\`, \`digest\`, \`content_json\`, \`created_at\`, \`review_status\` | Unicité (\`sheet_id\`, \`revision_number\`) ; contenu et empreinte immuables après soumission. |
| \`media_asset\` | \`media_id\`, \`digest\`, \`type\`, \`storage_key\`, \`moderation_status\` | Stockage privé ; pas d'URL publique permanente ; références depuis les révisions. |
| \`sheet_revision_media\` | \`revision_id FK\`, \`media_id FK\`, \`position\` | Référence explicite du média approuvé dans une version. |
| \`library\` | \`library_id\`, \`owner_actor_id FK\`, \`title\`, \`description\`, \`visibility\`, \`access_class\`, \`distribution_state\` | \`access_class\` = FREE / CONTROLLED ; prix et abonnements **hors de cette table**. Archivage propre à chaque compte, ne bloque pas distribution. |
| \`library_draft_member\` | \`library_id FK\`, \`sheet_id FK\`, \`position\` | Composition mutable du propriétaire ; aucun duplicata de fiche. |
| \`library_release\` | \`release_id\`, \`library_id FK\`, \`release_no\`, \`published_at\`, \`digest\` | Publication versionnée de composition, immutable. |
| \`library_release_member\` | \`release_id FK\`, \`sheet_id FK\`, \`source_revision_id FK\`, \`position\` | Références aux fiches/révisions ; projection serveur filtrée selon redistribution et autorisation de publication. |
| \`library_access_grant\` | \`grant_id\`, \`library_id FK\`, \`recipient_actor_id / group_id\`, \`issued_at\`, \`grant_kind\`, \`status\` | Droit octroyé **au niveau Bibliothèque** ; ne confère pas \`can_redistribute\` sur les fiches. |
| \`distribution_record\` | \`record_id\`, \`library_id/release_id\`, \`recipient_id\`, \`delivered_at\`, \`grant_id\` | Évidence de livraison / téléchargement, pour conservation locale et audit. |
| \`publication_submission\` | \`submission_id\`, \`target_revision_id\`, \`scope\`, \`submitted_at\`, \`state\` | Contrôle automatique ou humain par révision avant diffusion. |
| \`moderation_case\` | \`case_id\`, \`target_type\`, \`target_id\`, \`reason\`, \`state\`, \`reported_at\` | Peut viser fiche, révision, média ou publication. |
| \`moderation_decision\` | \`decision_id\`, \`case_id FK\`, \`outcome\`, \`actor_id\`, \`decided_at\`, \`reason\` | Historique traçable ; suspension séparée d'une révision. |

**Notes d'implémentation :**
- \`library_draft_member\` et \`library_release_member\` sont des associations, pas des copies de contenu.
- La version distribuée est identifiée par un \`release_id\` immuable et les références de versions validées des fiches.
- Les accès se calculent à partir de la Bibliothèque et des autorisations octroyées ; les permissions éditoriales se calculent au niveau de chaque fiche.
- La projection distribuée ne doit pas rendre l'inventaire interdit visible par un canal secondaire (recherche, nombre de membres, API, cache, miniatures ou notification).
- Les groupes et leur historique d'appartenance ne sont qu'une **interface d'extension** : leur modèle complet est à spécifier si nécessaire.
- Les colonnes SQL et types sont **proposés**, pas un schéma exécuté.

### 5.2 Stockage local SQLite — proposition de tables additionnelles

| Table logique | Champs essentiels | Rôle |
|---|---|---|
| \`local_library\` | \`local_library_id\`, \`source_library_id NULL\`, \`owner_kind\`, \`title\`, \`archived_at NULL\`, \`installed_release_id NULL\`, \`read_only\` | Bibliothèque personnelle ou reçue. L'archive locale ne touche pas le serveur. |
| \`local_library_member\` | \`local_library_id\`, \`source_sheet_id/local_sheet_id\`, \`position\`, \`source_revision_id NULL\` | Association par référence ; pour reçue, état provenant du manifeste installé seulement. |
| \`local_sheet_installation\` | \`source_namespace\`, \`source_sheet_id\`, \`local_movement_id\`, \`installed_revision_id\`, \`provenance_json\`, \`permissions_snapshot\` | Correspondance source ↔ Mouvement opérationnel ; pas de duplicata par Bibliothèque. |
| \`local_sheet_revision_cache\` | \`source_sheet_id\`, \`revision_id\`, \`digest\`, \`payload_json\` | Révisions immuables localement, nécessaire si plusieurs Bibliothèques utilisent des versions distinctes. |
| \`local_access_receipt\` | \`receipt_id\`, \`grant_id/library_id\`, \`source_sheet_id\`, \`received_at\`, \`access_state\` | Preuve que le Mouvement fut reçu légalement via une Bibliothèque ; survit à son retrait de composition. |
| \`local_update_journal\` | \`operation_id\`, \`library_id\`, \`target_release_id\`, \`state\`, \`checkpoint\`, \`created_at\` | Reprise idempotente d'installation/mise à jour, notamment si plusieurs bases sont conservées. |
| \`local_moderation_registry\` | \`target_type\`, \`target_id\`, \`decision_version\`, \`blocked\`, \`synced_at\` | Empêche le rendu/l'utilisation des contenus connus comme suspendus ; rattrapage après reconnexion. |

**Important :** ces noms sont illustratifs ; il est interdit d'introduire des tables concurrentes au registre déjà existant sans analyse de son schéma et de sa migration. Une Bibliothèque personnelle et une Bibliothèque reçue peuvent utiliser le même stockage mais des commandes différentes ; \`read_only\` ne doit pas être le seul verrou de sécurité des données distantes.

### 5.3 Relations cardinales — cible

\`\`\`text
Actor 1 ─────── N Library
Actor 1 ─────── N EditorialSheet (propriétaire administratif)
EditorialSheet 1 ─── N SheetRevision
SheetRevision N ─── N MediaAsset
Library 1 ───────── N LibraryRelease
LibraryRelease 1 ─── N LibraryReleaseMember ─── 1 EditorialSheet
Library 1 ───────── N LibraryAccessGrant ───────── 1 Recipient/Group
LibraryRelease 1 ─── N DistributionRecord (par destinataire)
EditorialSheet 1 ─── N LocalSheetInstallation (par appareil/utilisateur)
LocalLibrary N ───── N LocalSheetInstallation (association)
SheetRevision / MediaAsset 1 ─── N ModerationDecision (historique)
\`\`\`

### 5.4 Trois distinctions d'identité indispensables

1. \`Movement.id\` **local** : identifiant du Mouvement opérationnel actuel, déjà référencé dans les Exercices et les Séances.
2. \`sheet_id\` + \`source_namespace\` : identité éditoriale externe stable ; plusieurs Bibliothèques peuvent la référencer.
3. \`revision_id\` : état éditorial précis, validé et historisé.

**Le problème des homonymes locaux est ouvert.** Le catalogue actuel impose l'unicité normalisée des noms ; des sources distinctes peuvent proposer « Squat ». Ne pas résoudre ceci par écrasement, renumérotation sémantique cachée ou fusion non approuvée.

## 6. Mises à jour et cohérence transactionnelle

### 6.1 Protocole métier cible

1. Consulter les nouvelles révisions **approuvées** de Bibliothèque/fiches ; ne pas les appliquer.
2. Calculer un **aperçu des différences** : ajouts, retraits, changements de fiches et conflits locaux ; pastille visible.
3. Sur « Mettre à jour », figer la cible : \`target_release_id\` et manifeste d'empreintes des fiches.
4. Vérifier les permissions et la distribution encore ouverte, ainsi que l'absence de suspension de modération.
5. Préparer localement les contenus et références nécessaires sans modifier la version affichée.
6. Appliquer la nouvelle composition et les versions de fiches autorisées de manière **cohérente et reprenable**.
7. Mettre à jour le pointeur de version installée seulement quand tous les composants nécessaires sont disponibles.
8. Garder les Mouvements retirés dans le Catalogue local, leurs éventuels accès acquis et leurs références vers Séances/Bibliothèques personnelles.
9. Ne jamais écraser les adaptations locales ; si la mise à jour ne peut être appliquée proprement, signaler et préserver l'état antérieur.

**Invariants de sûreté :** pas de membre pointant vers une fiche absente, pas de perte de version antérieure avant confirmation, pas de double installation sur retry, pas de « mise à jour partielle » présentée comme réussie.

### 6.2 Risque majeur à auditer : une même fiche dans plusieurs Bibliothèques

Si deux Bibliothèques reçues référencent **la même fiche source** mais sont restées sur des versions différentes, une mise à jour de l'une **ne doit pas mettre à jour silencieusement la version de l'autre**.

**Option de conception proposée à Claude :** conserver en cache plusieurs révisions immuables par \`sheet_id\`, avec un pointeur de version **par Bibliothèque reçue** ; une projection opérationnelle locale du Mouvement reste à résoudre, sans créer des copies inutiles ni altérer les Séances.

**À CLARIFIER avant implémentation :** une seule révision « active » par identité de source sur l'appareil peut-elle être admise ? Si oui, comment informer l'utilisateur lorsque la mise à jour d'une Bibliothèque affecte la lecture d'une autre ? Sinon, quel plus petit mécanisme de projection permet de préserver les versions distinctes ? **Claude doit proposer des alternatives chiffrées en complexité, pas choisir silencieusement.**

### 6.3 Conflits et adaptations

- **Variante personnelle** : identité locale distincte, jamais écrasée.
- **Fiche modifiable corrigée localement sans variante** : le pilote actuel sait conserver des valeurs locales et résoudre certains conflits ; **ne pas imposer une fusion automatique** ni perdre les modifications.
- **Une seule action de mise à jour** ne signifie pas nécessairement que chaque conflit peut être résolu automatiquement : si le cas n'est pas résoluble sans décision supplémentaire, préserver l'état courant et l'expliquer à l'utilisateur.
- **Refus/report de l'import pilote CA-3** : différent du mécanisme de distribution. Ne pas le supprimer sans revue des tests existants.

### 6.4 Intégrité sur plusieurs bases SQLite

Le pilote \`catalogue/integration-60-main-20261109\` utilise provisoirement une base \`kodjo-catalogue-registry.db\` séparée de la base opérationnelle et un journal \`pending_operations\`. Si cette séparation persiste, une transaction SQL locale ne couvre pas magiquement les deux connexions/bases. Claude doit examiner :
- réutilisation du protocole journal → écriture Mouvement → confirmation registre ;
- idempotence, relecture dans la transaction et reprise après interruption ;
- possibilité de réunification ultérieure **uniquement si son coût et ses migrations le justifient**.

## 7. Distribution, validation et modération

### 7.1 Flux de soumission

\`\`\`text
Création locale
  → Demande de partage
  → Contrôle autorisation du diffuseur / permissions / provenance
  → Transfert de la révision et des médias en stockage privé
  → Contrôle automatique (format, sécurité, texte, image, vidéo)
       ├─ Privé sans anomalie → autorisation automatique possible
       └─ Public, payant ou suspect → examen humain
  → Publication de l'empreinte/révision approuvée
  → Distribution uniquement des fiches redistribuables et accessibles
\`\`\`

Le refus/suspension ne supprime pas la fiche de travail locale de l'auteur. Un contenu interdit n'est pas exposé aux destinataires par une URL, une miniature ou un endpoint secondaire. Une validation précédente ne s'applique pas à un média changé.

### 7.2 Modération a posteriori

- Signalement par utilisateur ; dossier de modération, examen, décision et historique.
- Blocage central de la diffusion/relecture réseau ; priorité sur les droits d'accès, les achats et l'action « Mettre à jour ».
- Retrait **du média seul** possible lorsque le reste de la fiche est licite ; suspension complète si nécessaire.
- Registre des décisions synchronisé sur les clients ; notification silencieuse iOS si pertinente, sans garantie d'exécution pendant la fermeture forcée de l'app ; contrôle de rattrapage au démarrage et à la synchronisation.
- Ne pas confondre modération de nudité/violence avec **preuve juridique** de propriété intellectuelle ou vérification de **validité clinique** d'un exercice.
- Prévoir informations de contact, signalement, traitement des recours, protection des données et journalisation adaptée. Une revue juridique spécifique sera nécessaire avant ouverture publique.

### 7.3 Fournisseurs envisageables — à étudier, pas imposés

- Backend relationnel/auth/stockage : PostgreSQL + services adaptés, éventuellement Supabase.
- Modération texte/image : API spécialisées (OpenAI Moderation, Google Vision SafeSearch, etc.).
- Vidéo : extraction de trames et revue humaine au début ; service vidéo dédié (ex. AWS Rekognition) si volume et couverture le justifient.
- Administration : interface Web limitée à file d'examen, visionnage sécurisé, décision, signalement et historique.

**Contrainte produit :** la validation automatique de partage privé ne doit pas dépendre d'une revue humaine sans anomalie. Le public/payant impose une approbation humaine initiale selon la décision existante.

## 8. API / contrats de services — proposition de surface minimale

Les noms HTTP suivants sont **illustratifs**, non arbitrés ; découper en services métier plutôt que multiplier les endpoints au démarrage.

| Service / opération | Requête logique | Réponse / règle obligatoire |
|---|---|---|
| \`createLibrary\` | propriétaire, nom, description | Identité locale/centrale ; état personnel par défaut. |
| \`updateLibraryDraft\` | bibliothèque, associations de fiches et ordre | Aucun nouveau Mouvement créé implicitement ; droits de gestion vérifiés. |
| \`requestDistribution\` | bibliothèque ou fiche seule, destinataires, visibilité | Projection **sans fiches interdites**, soumission des révisions non approuvées ; aucune fuite de métadonnées. |
| \`approveRevision\` | révision, décision de contrôle | Autorisation enregistrée et liée à l'empreinte ; uniquement acteur habilité/automate vérifié. |
| \`grantLibraryAccess\` | bibliothèque, utilisateur/groupe | Autorisation au **niveau Bibliothèque**, utilisable pour ses membres éligibles. |
| \`getLibraryManifest\` | bibliothèque, destinataire, version | Manifeste filtré, versions approuvées, droits d'accès valides. |
| \`getAvailableUpdates\` | installations locales, versions courantes | Différents sans mutation ; n'émet plus de nouvelle mise à jour si diffusion arrêtée. |
| \`applyLibraryUpdate\` (client) | version cible, empreintes, action explicite | Application cohérente et idempotente, préservation des retirés et des adaptations. |
| \`archiveLibraryLocally\` | identifiant local | Masquage local uniquement, aucune mutation distante. |
| \`stopDistribution\` | identifiant bibliothèque, demande propriétaire | Plus de nouveaux destinataires ni mises à jour ; anciens acquis conservés. |
| \`reportContent\` / \`suspendContent\` | cible, motif, preuve | Journal d'incident ; suspension prioritaire et notification des installations. |

**Contrôles serveur indispensables :** identité du propriétaire, droits de redistribution de chaque fiche, statut de modération, scope de destinataire, accès aux médias non publics. Ne jamais compter sur la seule désactivation d'un bouton client. Prévoir quotas, tailles/mimes des médias, protection anti-abus et journaux proportionnés.

## 9. Sécurité, confidentialité et qualité

- Minimisation : ne pas exposer aux destinataires les fiches non redistribuables ; pas de propagation implicite des informations personnelles ou données de santé associées à un coach/kiné.
- Médias privés avant approbation et accès contrôlé après publication ; URLs temporaires lorsqu'approprié, expiration et révocation côté serveur.
- Frontières serveur : authentification, contrôle d'autorisation systématique, prévention d'accès à des bibliothèques d'autres utilisateurs, journaux de modération protégés.
- Données personnelles, droit d'auteur, Apple/Google et DSA : à confirmer dans la revue juridique dédiée ; ne pas présenter la modération automatique comme certification juridique ou médicale.
- Fiabilité : hash de révision, idempotency key, reprise d'installations interrompues, compatibilité avec les versions existantes.
- Performances : index par propriétaire, identité source, Bibliothèque, révision et statut ; médias téléchargés seulement selon besoin et autorisation.
- Hors ligne : moteur et Séances fonctionnent localement ; impossibilité de garantir la révocation immédiate d'une copie hors ligne.

## 10. Stratégie de migration et compatibilité avec l'existant

### 10.1 Ce qui est identifié dans le dépôt

- Le MVP possède une base SQLite locale et un domaine Mouvement opérationnel utilisé par les Exercices/Séances. Les contraintes de nom, de classification, de phases, de niveaux et d'historique restent applicables.
- Sur la branche **catalogue/integration-60-main-20261109** (base documentaire distincte de la présente branche), le pilote définit notamment :
  - \`docs/KODJO-Provenance-propriete-fiches-mouvements-2026-11-06.md\` ;
  - \`docs/KODJO-Format-catalogue-mouvements-v1.md\` ;
  - \`src/domain/catalogue/MovementEditorialProvenance.ts\` et \`MovementCatalogueFile.ts\` ;
  - \`src/domain/catalogue/catalogueLoadPlan.ts\` ;
  - \`src/infrastructure/catalogue/SqliteCatalogueRegistry.ts\` ;
  - \`src/features/catalogue/CatalogueLoadService.ts\`.
- Le format du pilote emploie encore **\`authors[]\`** (non conforme à l'arbitrage d'auteur unique si plusieurs auteurs sont acceptés) ; le registre d'import dispose d'états/choix \`NEW\`, \`ADOPTABLE\`, \`NEW_REVISION\`, \`TO_RECONCILE\`, \`refuse\`, \`defer\` et d'une résolution manuelle des conflits.
- Ces règles du **pilote de chargement local** n'implémentent pas un partage multi-utilisateur et ne doivent pas être réinterprétées comme telles. La branche pilote ne doit pas être fusionnée ni reconstruite silencieusement.

### 10.2 Migration et contrat attendu de Claude

1. Inventorier les tables/types existants réellement présents sur la baseline Git demandée pour le développement.
2. Identifier ce qui peut être réutilisé (identité éditoriale, historique, registre d'installation, reprises après interruption) **sans nouveaux registres redondants**.
3. Décider comment porter l'auteur unique sans perdre les fiches avec propriétaire inconnu ; ne jamais convertir « inconnu » en KODJO par défaut.
4. Concevoir le rattachement sans migration destructive des \`Movement.id\` déjà référencés par des Séances et leurs historiques.
5. Examiner les migrations SQLite/serveur, la stratégie de tests, les droits/revocations, les collisions de noms et les doubles installations.
6. Conserver les noms de fichiers et références Unicode originaux ; ne pas ajouter silencieusement des documents Git hors du périmètre cible d'un ZIP.

## 11. Proposition de découpage de réalisation

| Lot | Contenu | Conditions préalables |
|---|---|---|
| **L1 — Bibliothèques locales** | Références, création, composition, archives, copie avec permissions héritées | Parcours PU-01 à PU-04 et compatibilité Mouvement local |
| **L2 — Identités et droits** | Fiches éditoriales, provenance/révisions, grants d'accès au niveau Bibliothèque, backend central minimal | Revue schéma et migrations |
| **L3 — Validation de diffusion** | Stockage privé, soumission, contrôles automatiques, file humaine initiale, retrait d'accès | L2 ; exigences de modération opérationnelles **avant** partage utilisateur |
| **L4 — Partage et réception** | Bibliothèques reçues, filtrage strict, accès particuliers/groupes, installation locale | L2 + L3 ; droits, tests sécurité |
| **L5 — Mises à jour** | Pastille, preview, « Mettre à jour » global, conservation des retirés et variantes, reprise et modération synchronisée | L4 et arbitrage sur versions concurrentes |
| **L6 — Publication publique / payante** | Découverte, droits commerciaux raccordables, volumétrie/modération renforcée | L3-L5 + chantier commercial distinct |

**Non inclus :** paiement réel, monétisation, abonnement, moteur d'Exécution, collaboration clinique détaillée, écrans Figma non validés.

## 12. Tests d'acceptation et de non-régression

| ID | Test | Résultat attendu |
|---|---|---|
| T-01 | Associer un Mouvement à deux Bibliothèques | Deux références, pas de copie source. |
| T-02 | Retirer l'association d'une Bibliothèque personnelle | L'autre Bibliothèque et les Séances ne changent pas. |
| T-03 | Copier une fiche Protégée | Nouvelle identité locale, permissions inchangées, modification refusée. |
| T-04 | Redistribuer Bibliothèque mêlant contenu Libre/Protégé | Seules les fiches redistribuables et leurs métadonnées sont visibles chez le destinataire. |
| T-05 | Destinataire tente d'ajouter/retraiter un membre à la Bibliothèque reçue | Mutation interdite ; Bibliothèque personnelle modifiable. |
| T-06 | Coach accorde la Bibliothèque à un groupe | Les membres autorisés peuvent utiliser les fiches éligibles sans grants individuels par fiche. |
| T-07 | Publication d'une révision non approuvée | Distribution impossible, médias non servis. |
| T-08 | Révision disponible mais aucune action utilisateur | Version installée inchangée ; pastille visible. |
| T-09 | Mise à jour globale avec ajout/retrait/édition | Composition et révisions cohérentes ; retrait conserve le Mouvement dans le Catalogue local. |
| T-10 | Séance référence un Mouvement retiré | Séance et historique intacts, Mouvement local toujours utilisable sous réserve de droit/modération. |
| T-11 | Adaptation personnelle et mise à jour source | Adaptation inchangée, aucune fusion silencieuse. |
| T-12 | Deux Bibliothèques reçoivent une même fiche source en révisions différentes | Aucun changement silencieux dans la Bibliothèque non mise à jour. |
| T-13 | Archivage par l'émetteur | Destinataire et capacité de recevoir les nouvelles mises à jour inchangés. |
| T-14 | Arrêt de diffusion | Nouvelle installation interdite ; utilisateurs existants gardent les installations et ne reçoivent plus de MAJ. |
| T-15 | Modération bloque une vidéo distribuée | Serveur bloque immédiatement nouvelles consultations ; client bloque à prochaine synchronisation réalisable ; références préservées. |
| T-16 | Coupure pendant mise à jour de Bibliothèque | Reprise idempotente, état cohérent, aucune perte des Mouvements/Séances. |
| T-17 | Deux fiches source ont le même titre normalisé | Aucun écrasement ; situation traitée explicitement, selon arbitrage à obtenir. |
| T-18 | Client hors ligne exécute une Séance déjà présente | Moteur disponible, pas d'exigence de connexion sauf limitations connues de modération/droits. |

## 13. Points À CLARIFIER — arbitrages métier / conception à ne pas inventer

**Métier / produit :**
- A1. Politique d'accès payant après expiration, retour/remboursement et changement d'appareil.
- A2. Possibilité de reprendre la diffusion après un arrêt et sort des destinataires existants lors de cette reprise.
- A3. Modifications ultérieures des permissions (retrait du droit de redistribuer) sur des copies déjà installées.
- A4. Permissions par défaut lors de création/partage ; les quatre modes sont validés, le défaut ne l'est pas.
- A5. Insertion de nouveaux membres dans une Bibliothèque reçue si l'abonné ne demande pas de mise à jour (règle générale : aucun changement ; confirmer cas d'accès).
- A6. Choix du comportement lorsque deux Bibliothèques référencent la même fiche avec révisions différentes.
- A7. Gouvernance des groupes, confidentialité, accès professionnel et preuve des droits d'utilisation.
- A8. Interface de partage d'une fiche seule, gestion d'une Bibliothèque de diffusion « zéro contenu ».
- A9. Sémantique de la conservation locale après retrait pour contenus restreints à un contrat de durée.

**Technique / conformité :**
- T1. Raccordement exact au schéma SQLite / registre pilote et collisions d'identifiants/noms.
- T2. Backend et fournisseurs de modération à sélectionner après évaluation coûts/confidentialité/coverage.
- T3. Protection des médias hors ligne et niveau raisonnable de révocation.
- T4. Validation humaine, recours, politique de conservation des médias et examen juridique Apple/Google/DSA/RGPD selon les usages.
- T5. Visualisation Figma et contrats d'écran : états, navigation, messages d'erreur, accessibilité.

## 14. Mandat de revue indépendante à Claude

**Mission : AUDIT ET PROPOSITION DE CORRECTIONS — AUCUN DÉVELOPPEMENT, AUCUNE MODIFICATION Figma ni fusion** sans instruction explicite.

1. Lire entièrement les deux documents cibles et la conception initiale ; comparer avec les chapitres 01–13, PRODUCT.md, INDEX.md et le registre, en conservant la distinction BIB-01–18 / F4-A–F.
2. Analyser le **code existant réellement dans les branches pertinentes** (main et pilote catalogue) avant de proposer migrations ou services ; ne pas reconstituer l'état du dépôt à partir d'un souvenir.
3. Vérifier la cohérence des 16 parcours et la traçabilité de chaque décision avec preuves, identifier toute nouvelle règle non validée.
4. Auditer en priorité : accès hérités de la Bibliothèque, conservation après retrait, mise à jour globale reprenable, versions d'une même fiche dans plusieurs Bibliothèques, héritage des permissions sur copies, arrêt/archivage, modération et droits commerciaux isolés.
5. Fournir une architecture **minimale** et une alternative si le choix proposé est complexe ; chiffrer en complexité (faible/moyen/fort) sans inventer de coût ni imposer une technologie.
6. Détailler les relations et index des tables qui seraient réellement nécessaires, ainsi que contraintes référentielles, migrations, stratégie de cache et transactions.
7. Auditer sécurité des droits côté serveur, confidentialité, accès média, signalements et capacité réelle de neutralisation iOS ; signaler les limites.
8. Contrôler le non-impact du MVP et du moteur d'Exécution, ainsi que l'interopérabilité avec l'import pilote 60 fiches.
9. Rendre **par axe** statut CONFORME / PARTIELLEMENT CONFORME / NON CONFORME / NON VÉRIFIABLE / À CLARIFIER, preuves de code/docs, contradictions et corrections proposées.
10. Classer chaque recommandation en **obligatoire pour la cohérence**, **utile mais différable** ou **surcomplexité à éviter**. Ne proposer ni microservices, ni synchronisation automatique, ni nouveaux contrôles bloquants sans justification.

**Livrables attendus de Claude :** rapport de revue contradictoire, schéma de données cible minimal corrigé, matrice décision→parcours→composants→tests, liste réduite d'arbitrages à prendre avant développement, et plan de lots réaliste. Ne pas déclarer un parcours Figma validé sans identification d'écrans/nœuds probants.

---

**Traçabilité documentaire :** ce dossier est une proposition de conception pour revue sur branche dédiée ; il ne supersède pas de lui-même les chapitres normatifs. Les décisions F4-A–F doivent être propagées au registre et aux chapitres après consolidation, sans laisser coexister de règles contradictoires. Les fichiers non concernés doivent rester inchangés.

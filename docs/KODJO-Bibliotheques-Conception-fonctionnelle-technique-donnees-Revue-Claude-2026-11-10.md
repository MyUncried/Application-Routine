# KODJO — Dossier de conception pour revue indépendante Claude

## Mise à jour du cadrage après seconde revue — 10/11/2026

**Supersession de périmètre par BIB-19 à BIB-23 :** la conception de distribution et de partage détaillée dans ce dossier n'est **pas** le périmètre de L1/L2. L1 couvre Bibliothèques génériques KODJO, découverte/sélection/installation depuis le Profil ; L2 leur mise à jour volontaire et la reprise. Les créations personnelles, Bibliothèques de coachs, permissions destinataires, diffusion, modération et commerce sont reportées. Le Catalogue conserve ses contenus personnalisables ; la composition et les fiches publiées par KODJO ne sont pas directement modifiables. La distinction Bibliothèque / Catégorie est impérative. Aucune migration « 024 » réservée : numéro défini lors de l'intégration dans la branche cible, après les autres migrations. Les sections de lots et d'architecture ci-dessous constituent une **conception historique de la cible étendue**, non une instruction de développement du premier lot ; le phasage antérieur L1–L5 est supersédé sur ce point. L'état Figma n'est pas validé.

## Bibliothèques de Mouvements, droits, distribution, mises à jour et modération

**Date :** 10 novembre 2026  
**Statut :** **PROPOSITION DE CONCEPTION POUR REVUE**, non approuvée techniquement ni développée ; décisions métier existantes respectées, options techniques et questions ouvertes explicitement séparées.  
**Dépôt :** MyUncried/Application-Routine.  
**Branche de travail :** docs/conception-bibliotheques-partage-moderation-20261110, non fusionnée dans main.  
**Source métier principale :** [Parcours utilisateurs cibles](KODJO-Bibliotheques-Parcours-utilisateurs-cibles-2026-11-10.md), décisions BIB-01–18 et F4-A–F4-F.  
**Cadre :** ne pas changer silencieusement le MVP local, le moteur PRE-10, les familles/niveaux, la structure des Séances ou Figma. Cette spécification n'autorise pas le développement sans revue et arbitrages des points bloquants.

---

## 0. Résumé architectural et périmètre

KODJO doit permettre à un utilisateur de créer/organiser localement des Bibliothèques de Mouvements, puis à terme de partager ses Bibliothèques, en recevoir, acheter éventuellement des accès et recevoir des mises à jour **sur demande**. Les Bibliothèques possèdent leur composition, les Mouvements possèdent leurs fiches et permissions. Dans le parcours **Bibliothèque**, l'accès aux Mouvements est transmis **par la Bibliothèque** ; dans l'**Espace en étoile** générique, un utilisateur transmet directement des Mouvements à un autre utilisateur, sans Bibliothèque fictive ni rôle professionnel dans le modèle ; les permissions **Modifier/Redistribuer** restent attachées **à chaque fiche**.

La cible vise une **séparation logique** simple, pas un ensemble de microservices dès le départ :

1. **Domaine Mouvements** : identité éditoriale, provenance, révisions, droits de modification/redistribution, médias.
2. **Domaine Bibliothèques** : composition par référence, version de composition, visibilité, archivage, partage et arrêt de diffusion.
3. **Domaine Accès** : autorisation d'utiliser les Mouvements reçus via une Bibliothèque (individu/groupe) ou transmis individuellement au sein de l'Espace en étoile (modalités relationnelles à préciser) ; preuve locale d'installation et conservation des droits après retrait d'un membre.
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
| F4-C | Pour un **partage de Bibliothèque** (notamment coach), le propriétaire attribue le droit d'accès au niveau Bibliothèque ; le retrait d'un membre ne révoque pas l'usage local déjà acquis. Ce modèle de Bibliothèque **ne constitue pas le parcours de transmission kiné-patient** (KIN-01) ; commerce et modération restent séparés. |
| F4-D | Un seul « Mettre à jour » installe la nouvelle **composition ET les nouvelles révisions de Mouvements**, sans supprimer les Mouvements retirés ni écraser les adaptations personnelles. |
| F4-E | Archiver une Bibliothèque est personnel/local et n'a **aucun effet sur les destinataires** ni sur leurs mises à jour. |
| F4-F | Arrêter le partage d'une Bibliothèque bloque les **nouvelles distributions** ; les destinataires existants conservent leurs installations, n'obtiennent **plus de nouvelles mises à jour** tant que le partage reste arrêté. |
| **F4-G — validé** | Une seule révision active par fiche source et par appareil : une mise à jour volontaire depuis une Bibliothèque actualise la même fiche partout où elle est référencée ; aucune autre composition n'est modifiée, l'utilisateur est averti de l'impact transversal. |
| KIN-01 | L'Espace en étoile est une **relation individuelle générique** ; transmission de Mouvements sans rôle professionnel ou prescription numérique. Dans l'usage kiné-patient, les consignes d'exécution sont orales. Invitation acceptée et possibilité de refuser ou bloquer le partageur. |

**Arbitrages explicitement non faits :** détails des offres et paiements, expiration d'accès, retransmission d'une installation sur un nouvel appareil après arrêt du partage, modification postérieure de permissions, règles de groupe, gestion des conflits complexes et emplacement UX des commandes.

### 1.2 Frontières de sources de vérité

- **Figma** : rendu visuel et états existants du Prototype MVP ; les nouveaux parcours de Bibliothèques/partage/modération ne sont pas des écrans validés. Actions « Partager » observées dans le prototype (nœuds 10501:23846, 10579:21622).
- **Documentation fonctionnelle** : comportements et résultat observable ; les deux documents de conception du 10/11 sont des compléments cibles.
- **Documentation technique** : schémas et mécanismes proposés sous réserve de revue Claude.
- **Registre des décisions** : BIB-01–18, F4-A–F4-F et KIN-01 documentés sur la présente branche ; aucun nouveau numéro D-xxx n'est attribué fictivement.

## 2. Parcours utilisateur à implémenter

La source détaillée est [PU-01 à PU-17](KODJO-Bibliotheques-Parcours-utilisateurs-cibles-2026-11-10.md), à lire avant toute conception d'API ou d'écran.

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
| PU-17 | Utilisateur émetteur / destinataire | Transmission dans un Espace en étoile générique, sans rôle professionnel ni prescription numérique ; usage kiné-patient : consignes orales. |

### Deux modes de partage sans rôles professionnels

**Bibliothèque :** un utilisateur, par exemple un coach, diffuse une Bibliothèque dont les Mouvements conservent leurs permissions. L'accès est attribué au niveau Bibliothèque.

**Espace en étoile :** relation individuelle orientée d'un utilisateur vers un autre, invitation acceptée, possibilité de refus et de blocage. Exemple d'usage : un kinésithérapeute transmet un Mouvement au patient et explique oralement l'exécution. Aucun rôle métier « kiné » ou « coach », ni prescription numérique d'Exercice/Séance dans le modèle.

**Mutualisation :** contrôles de fiches, médias, révisions, modération et installation identiques, sans Bibliothèque fictive. Les modalités restantes de la relation sont à détailler.

## 3. Architecture fonctionnelle — invariants

### 3.1 Trois notions de droits à ne pas mélanger

- **Permission éditoriale de la fiche** : Modifier et Redistribuer, quatre modes. Une création locale originale est modifiable et non redistribuable **par un tiers** par défaut ; lors de sa première diffusion, le propriétaire habilité choisit les droits des destinataires. **Publier son contenu initialement ≠ redistribuer le contenu d'autrui**. Les copies ne peuvent amplifier les droits.
- **Droit d'accès à la Bibliothèque** : accord du propriétaire à un individu/groupe ; ouvre l'usage de ses membres reçus. La transmission kiné-patient dans l'Espace relève d'une autorisation relationnelle **distincte**, dont le contrat détaillé reste à concevoir. Une preuve de cet accès accompagne l'installation. Retirer un membre de la source ne supprime pas la preuve d'installation antérieure.
- **État de modération** : peut bloquer temporairement ou définitivement une fiche/média même si accès et permissions seraient par ailleurs suffisants.

Une future acquisition payante pourra contribuer à la validité du **droit d'accès** ; elle ne transforme ni la permission éditoriale ni le statut de modération.

### 3.2 Propriété administrative / propriété intellectuelle

Le créateur de la fiche originale devient auteur unique et propriétaire administratif par défaut. Une organisation peut gérer ou distribuer explicitement une fiche ; elle ne devient pas automatiquement titulaire des droits d'auteur. Toute publication externe nécessite une déclaration de droits appropriée ; le pilote de fiches de propriétaire inconnu reste privé.

### 3.3 Règles de version

- **Révision de Mouvement** : état versionné du texte, des médias, de la classification, des permissions destinataires et de la provenance ; identité source immuable indépendante du nom, empreinte de contenu.
- **Révision de Bibliothèque** : version de la **composition ordonnée** (et de ses attributs éditoriaux distribués), indépendante des révisions des fiches.
- Une seule **révision active par identité de fiche source** existe sur l'appareil. Plusieurs Bibliothèques peuvent la référencer. Une mise à jour volontaire depuis l'une d'elles actualise la fiche partout où elle apparaît, **sans modifier les compositions** des autres Bibliothèques. L'aperçu préalable signale les Bibliothèques également concernées.
- Une proposition de mise à jour peut contenir des différences de composition, de fiches ou les deux.
- L'action unique « Mettre à jour » doit conduire à un état cohérent correspondant à la version choisie et aux révisions approuvées ; l'absence d'action conserve l'état installé.
- Des fiches exclues par droits de redistribution ne doivent pas fuiter dans la projection distribuée.
- **Modération** : traitement hors cycle de mise à jour volontaire, pouvant invalider l'accès à une version déjà installée après synchronisation.

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
  ├─ Identité et relations individuelles (groupes à arbitrer)
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

### Axes de simplification à vérifier avec Claude

| Axe | Orientation | Limite / contrôle |
|---|---|---|
| **S-01 — Révisions locales** | **Validé :** un Mouvement par identité de source, une version active, plusieurs Bibliothèques référentes. Écarter le cache des versions actives par Bibliothèque. | Aperçu préalable de l'impact transverse ; conserver les historiques d'exécution. |
| **S-02 — Identité** | Identifiant source stable indépendant du nom ; des fiches distinctes peuvent s'appeler « Squat ». | Migration de l'unicité globale `normalized_name` ; décision technique sur l'index, sans modifier `Movement.id`. |
| **S-03 — Bibliothèques locales** | Une table Bibliothèque et une table d'associations vers les Mouvements existants. | Contrôles de lecture seule sur les Bibliothèques reçues. |
| **S-04 — Registre** | Réemployer `installed_sheets` du pilote pour provenance/révision/droits, sans second registre parallèle. | Respect de la base SQLite provisoire distincte. |
| **S-05 — Mises à jour** | Réutiliser les opérations du pilote par fiche ; un mécanisme de cohérence globale seulement si nécessaire. | Une reprise par fiche ne prouve pas l'atomicité observable du lot. Tester les coupures entre fiches. |
| **S-06 — Diffusion** | Pipeline commun fiche/révision/média pour Bibliothèques et Espace individuel. | Publication du propriétaire ≠ redistribution du destinataire. |
| **S-07 — Accès** | Droit au niveau Bibliothèque ; transfert individuel via relation générique ; commerce séparé. | Conserver la preuve des droits acquis après retrait du membre. |
| **S-08 — Modération** | Un contrôle central partagé, état de blocage local consultable. | Peut bloquer le média, la fiche ou son affichage ; aucune révocation instantanée garantie hors ligne. |
| **S-09 — Groupes** | Réception nominative envisageable en premier ; groupe reportable. | Phasage non validé ; ne pas supprimer la fonctionnalité cible. |

Les orientations S-02 à S-09 sont des **candidats techniques**, à confronter au code. Les fusions de tables proposées par Claude (C-07/C-17) ne sont pas imposées : deux faits métier distincts ne doivent pas être fusionnés sans justification.

**Choix non décidés :** Supabase/PostgreSQL, service de stockage objet, fournisseur d'authentification, API de modération (texte/image/vidéo), dispositif de notifications et hébergement. Les citer dans ce dossier ne les rend pas obligatoires.

## 5. Modèle de données fonctionnel / relationnel cible

### 5.1 Modèle de données central — proposition minimale à auditer

La cible sépare les **identités de fiches**, leurs **révisions approuvées**, les **Bibliothèques publiées** et les **droits d'accès**, puis réutilise les mêmes fiches pour la transmission individuelle et la modération. Les tables physiques et les éventuelles fusions ne sont pas arbitrées.

| Ensemble | Données indispensables | Invariant |
|---|---|---|
| Identité utilisateur/organisation | \`actor_id\`, gestionnaire et état du compte | **Aucun rôle « coach » ou « kiné »** dans le modèle |
| Fiche source | \`source_namespace\`, \`sheet_id\`, auteur unique nullable, propriétaire administratif, provenance | Identité stable indépendante du nom et des Bibliothèques |
| Révision de fiche | \`revision_id\`, contenu/digest, droits Modifier/Redistribuer des destinataires, état de validation | Une révision approuvée est identifiable ; la première diffusion par le propriétaire habilité ne requiert pas le droit de redistribution des destinataires |
| Médias liés à une révision | Média, empreinte, droits sur le média, position, statut de modération | Les droits d'une fiche ne suffisent pas à publier une vidéo tierce |
| Bibliothèque et version publiée | \`library_id\`, propriétaire, visibilité, diffusion, \`release_id\`, composition ordonnée par références | Le brouillon peut rester local ; pas de copie des fiches membres |
| Autorisation et preuve de réception | Bibliothèque, destinataire, droit d'accès et preuve de livraison | Deux faits à distinguer même si une seule table suffit techniquement |
| Relation et transfert individuels | lien orienté entre utilisateurs, transmission d'une révision approuvée | Espace en étoile générique ; pas de Bibliothèque artificielle ni de prescription numérique |
| Modération et décisions | contrôle de publication, signalement, décisions et état courant | Les contrôles initiaux et les incidents ultérieurs peuvent partager une infrastructure, pas nécessairement tous les mêmes états |

**Simplifications candidates :** ne pas maintenir \`library_draft_member\` sur le serveur si l'édition de composition reste locale ; ne pas stocker de pointeur de révision active par Bibliothèque ; ne pas créer de tables spécifiques à un profil professionnel ; ne pas intégrer les achats aux fiches. Claude doit vérifier si la fusion d'un contrôle préalable et d'un signalement reste traçable et si le suivi des droits acquis nécessite une preuve distincte de l'accès actuel.

### 5.2 Stockage SQLite — réemploi et séparation des responsabilités

| Stockage | Modèle à privilégier | Point de contrôle |
|---|---|---|
| Base principale \`kodjo.db\` | Tables additionnelles **Bibliothèque** et **association ordonnée vers \`Movement.id\`** ; réutilisation du Mouvement et des FK existants vers Exercices/Séances | Aucune duplication à l'affectation ; Bibliothèques reçues en lecture seule |
| Registre provisoire \`kodjo-catalogue-registry.db\` | Réutiliser \`installed_sheets\`, l'identité de source, la révision active, les empreintes et les contrôles \`pending_operations\` du pilote | Ne pas créer une deuxième table d'installation sans besoin non couvert |
| État local de Bibliothèque reçue | Identité source de Bibliothèque, \`release_id\` installé et état de réception | Version de **composition** uniquement, pas version active propre à chaque Bibliothèque pour un Mouvement partagé |
| État de modération | Cibles neutralisées et version de décision, accessible à l'affichage et aux services de lecture | État appliqué sans supprimer les références des Séances |
| Reprise de lot | Réutilisation du journal par fiche, **plus petit mécanisme supplémentaire si nécessaire** pour une mise à jour globale cohérente | Une reprise fiche par fiche ne garantit pas à elle seule une visibilité atomique sur l'ensemble de la Bibliothèque |

**Écart technique actuel :** la migration 013 de \`main\` impose \`movements.normalized_name UNIQUE\`. Accepter des fiches de **sources différentes** portant exactement le nom « Squat » exige une migration ciblée de cette contrainte. Conserver \`Movement.id\` pour les Exercices et les Séances. Une identité d'auteur/publisher ne remplace pas un identifiant source stable ; un renommage ou transfert de gestion ne doit pas changer l'identité. Le comportement des homonymes créés dans le même espace personnel est distinct et reste à arbitrer.

### 5.3 Cardinalités logiques

\`\`\`text
Actor 1 ─── N Sheet 1 ─── N SheetRevision
SheetRevision N ─── N Media
Actor 1 ─── N Library 1 ─── N LibraryRelease
LibraryRelease 1 ─── N MemberRef ─── 1 Sheet
Library ─── N accès destinataires et N preuves de réception
Actor ─── N relations individuelles orientées ─── Actor
Relation 1 ─── N transmissions ─── SheetRevision
SheetRevision/Media ─── N décisions de modération
Client : (source_namespace, sheet_id) ─── 1 Movement.id local / 1 révision active
Client : Bibliothèque N ─── N Mouvement par associations de membres
Client : Exercices et Séances ─── Movement.id inchangé
\`\`\`

Les noms de tables exacts et la nécessité d'une table distincte pour chaque fait sont des propositions pour la revue technique, **pas des décisions figées**.

### 5.4 Identités et homonymes

1. **\`Movement.id\` local** : identifiant opérationnel existant et stable pour toutes les références d'Exercices/Séances.
2. **\`(source_namespace, sheet_id)\`** : identité éditoriale stable de la fiche indépendante du nom, de l'auteur, du propriétaire administratif et de toute Bibliothèque. Un créateur local hors ligne utilise un espace de noms local persistant, non affiché.
3. **\`revision_id\`** : version éditoriale d'une fiche source ; une seule version **active** sur l'appareil, avec conservation possible de l'historique éditorial au serveur.

Plusieurs fiches distinctes peuvent porter le même nom visible « Squat ». Leur provenance ou un indicateur de source permet de les distinguer dans le Catalogue. La proposition initiale d'index utilisateur + nom peut aider au contrôle local de doublons, **mais ne remplace pas l'identité immuable d'une fiche**. Claude doit concevoir la migration de l'index global \`normalized_name\` et mesurer ses effets sur recherche, niveaux, copies et import sans casser les identifiants existants.

**Décision métier :** homonymes de **sources distinctes** admis ; aucun suffixe numéroté imposé lors de l'installation. **Ouvert :** contrôler ou non des noms identiques parmi les créations originales du même utilisateur.

## 6. Mises à jour et cohérence transactionnelle

### 6.1 Protocole métier cible

1. Consulter les nouvelles révisions **approuvées** de Bibliothèque/fiches ; ne pas les appliquer.
2. Calculer un **aperçu des différences** : ajouts, retraits, changements de fiches et conflits locaux ; pastille visible.
3. Sur « Mettre à jour », figer la cible : \`target_release_id\`, manifeste d'empreintes et liste des autres Bibliothèques utilisant les fiches modifiées, communiquée avant confirmation.
4. Vérifier les permissions et la distribution encore ouverte, ainsi que l'absence de suspension de modération.
5. Préparer localement les contenus et références nécessaires sans modifier la version affichée.
6. Appliquer la nouvelle composition et les versions de fiches autorisées de manière **cohérente et reprenable**.
7. Mettre à jour le pointeur de version installée seulement quand tous les composants nécessaires sont disponibles.
8. Garder les Mouvements retirés dans le Catalogue local, leurs éventuels accès acquis et leurs références vers Séances/Bibliothèques personnelles.
9. Ne jamais écraser les adaptations locales ; si la mise à jour ne peut être appliquée proprement, signaler et préserver l'état antérieur.

**Invariants de sûreté :** pas de membre pointant vers une fiche absente, pas de perte de version antérieure avant confirmation, pas de double installation sur retry, pas de « mise à jour partielle » présentée comme réussie.

### 6.2 Une révision active unique — propagation validée

Le Mouvement source `coachA:mvt-001` peut figurer dans plusieurs Bibliothèques. L'utilisateur dispose **d'une seule fiche locale active**, identifiée par la source et son identifiant, et non d'une version différente dans chaque Bibliothèque.

- Avant « Mettre à jour » une Bibliothèque, l'aperçu indique les Mouvements modifiés et les **autres Bibliothèques qui les référencent**.
- L'action explicite de l'utilisateur installe la nouvelle révision approuvée de ces fiches. Elle apparaît alors dans **toutes les Bibliothèques** qui référencent les mêmes `Movement.id`, sans deuxième validation.
- Seule la **composition de la Bibliothèque mise à jour** peut changer de membres ou d'ordre. Les autres Bibliothèques conservent leur composition et leur propre version de composition installée.
- Les copies/adaptations personnelles distinctes et les instantanés des exécutions passées ne changent pas.
- Le client **ne maintient aucun pointeur de version active par Bibliothèque**. Une release serveur peut conserver ses références historiques de versions pour la preuve de publication, sans forcer l'affichage de cette révision historique dans les autres Bibliothèques locales.

**Arbitrage clos** : la gestion de révisions actives distinctes d'une même fiche par Bibliothèque n'est plus recherchée. Le point qui reste technique est la cohérence de la mise à jour globale avec un stockage réparti entre deux bases et la protection des modifications personnelles.

### 6.3 Conflits et adaptations

- **Variante personnelle** : identité locale distincte, jamais écrasée.
- **Fiche modifiable corrigée localement sans variante** : le pilote actuel sait conserver des valeurs locales et résoudre certains conflits ; **ne pas imposer une fusion automatique** ni perdre les modifications.
- **Une seule action de mise à jour** ne signifie pas nécessairement que chaque conflit peut être résolu automatiquement : si le cas n'est pas résoluble sans décision supplémentaire, préserver l'état courant et l'expliquer à l'utilisateur.
- **Refus/report de l'import pilote CA-3** : différent du mécanisme de distribution. Ne pas le supprimer sans revue des tests existants.

### 6.4 Intégrité sur plusieurs bases SQLite

Le pilote \`catalogue/integration-60-main-20261109\` utilise provisoirement une base \`kodjo-catalogue-registry.db\` séparée de la base opérationnelle et un journal \`pending_operations\` **par fiche**. Une mise à jour de Bibliothèque concerne potentiellement **plusieurs fiches** et la composition : le simple fait d'écrire le pointeur de release en dernier ne garantit pas à lui seul qu'une coupure ne laisse aucune fiche partiellement actualisée. Claude doit vérifier le comportement réel sous interruption, avant de supprimer ou d'ajouter un mécanisme de reprise de lot :
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
| **L1 — Bibliothèques locales** | Création, composition par références, archives et restauration ; copie à permissions héritées après raccordement des droits | PU-01/02/13 et compatibilité locale |
| **L2 — Identités et droits** | Identité de source, provenance, droits par révision, copie avec permissions héritées, comptes et autorisations de Bibliothèque | Revue du schéma, migration homonymes et gardes |
| **L3 — Validation de diffusion** | Stockage privé, soumission, contrôles automatiques, file humaine initiale, retrait d'accès | L2 ; exigences de modération opérationnelles **avant** partage utilisateur |
| **L4 — Partage et réception** | Bibliothèques reçues, filtrage strict, accès individuels ; groupes selon phasage validé | L2 + L3 ; permissions serveur, installation et tests |
| **L5 — Mises à jour** | Pastille, preview, « Mettre à jour » global, conservation des retirés et variantes, reprise et modération synchronisée | L4 et arbitrage sur versions concurrentes |
| **L6 — Publication publique / payante** | Découverte, droits commerciaux raccordables, volumétrie/modération renforcée | L3-L5 + chantier commercial distinct |

**Non inclus :** paiement réel, monétisation, abonnement, moteur d'Exécution, collaboration clinique détaillée, écrans Figma non validés.

## 12. Tests d'acceptation et de non-régression

| ID | Test | Résultat attendu |
|---|---|---|
| T-01 | Associer un Mouvement à deux Bibliothèques | Deux références, pas de copie source. |
| T-02 | Retirer l'association d'une Bibliothèque personnelle | L'autre Bibliothèque et les Séances ne changent pas. |
| T-03 | Copier une fiche Protégée | Nouvelle identité locale, permissions inchangées, modification refusée. |
| T-04 | Propriétaire publie sa Bibliothèque mêlant ses propres fiches Protégées et des fiches tierces non redistribuables | Le propriétaire peut publier ses propres fiches avec droits destinataires Protégé ; les fiches tierces interdites ne sont jamais exposées. |
| T-05 | Destinataire tente d'ajouter/retraiter un membre à la Bibliothèque reçue | Mutation interdite ; Bibliothèque personnelle modifiable. |
| T-06 | Coach accorde la Bibliothèque à un groupe | Les membres autorisés peuvent utiliser les fiches éligibles sans grants individuels par fiche. |
| T-07 | Publication d'une révision non approuvée | Distribution impossible, médias non servis. |
| T-08 | Révision disponible mais aucune action utilisateur | Version installée inchangée ; pastille visible. |
| T-09 | Mise à jour globale avec ajout/retrait/édition | Composition et révisions cohérentes ; retrait conserve le Mouvement dans le Catalogue local. |
| T-10 | Séance référence un Mouvement retiré | Séance et historique intacts, Mouvement local toujours utilisable sous réserve de droit/modération. |
| T-11 | Adaptation personnelle et mise à jour source | Adaptation inchangée, aucune fusion silencieuse. |
| T-12 | Même fiche source dans deux Bibliothèques : mise à jour depuis A | Aperçu signale B ; la révision active locale se propage à A et B ; composition de B inchangée ; pas de confirmation supplémentaire. |
| T-13 | Archivage par l'émetteur | Destinataire et capacité de recevoir les nouvelles mises à jour inchangés. |
| T-14 | Arrêt de diffusion | Nouvelle installation interdite ; utilisateurs existants gardent les installations et ne reçoivent plus de MAJ. |
| T-15 | Modération bloque une vidéo distribuée | Serveur bloque immédiatement nouvelles consultations ; client bloque à prochaine synchronisation réalisable ; références préservées. |
| T-16 | Coupure pendant mise à jour de Bibliothèque | Reprise idempotente, état cohérent, aucune perte des Mouvements/Séances. |
| T-17 | Deux fiches de sources distinctes intitulées « Squat » | Deux Mouvements coexistent avec noms affichés identiques, identités sources distinctes et provenance consultable ; aucune fusion ni suffixe imposé. |
| T-18 | Client hors ligne exécute une Séance déjà présente | Moteur disponible, pas d'exigence de connexion sauf limitations connues de modération/droits. |
| T-19 | Un kiné transmet un Mouvement dans l'Espace d'un patient | Le patient reçoit le Mouvement, aucun Exercice/Séance ni paramètres d'exécution prescrits numériquement ne sont créés ; les autres patients ne sont pas destinataires. |

## 13. Points À CLARIFIER — arbitrages métier / conception à ne pas inventer

**Métier / produit :**
- A1. Politique d'accès payant après expiration, retour/remboursement et changement d'appareil.
- A2. Possibilité de reprendre la diffusion après un arrêt et sort des destinataires existants lors de cette reprise.
- A3. Modifications ultérieures des permissions (retrait du droit de redistribuer) sur des copies déjà installées.
- A4. **Précisé** : création originale modifiable localement et non redistribuable par des tiers par défaut ; le propriétaire choisit les droits des destinataires à la première publication. Modalité de restriction ultérieure encore ouverte.
- A5. Insertion de nouveaux membres dans une Bibliothèque reçue si l'abonné ne demande pas de mise à jour (règle générale : aucun changement ; confirmer cas d'accès).
- A6. **Résolu par F4-G** : révision active unique, propagation transversale et aperçu préalable des Bibliothèques concernées. Cohérence multi-fiches à vérifier techniquement.
- A7. Gouvernance des groupes, confidentialité et preuve des droits ; **Espace en étoile générique**, sans rôle professionnel, invitation acceptée, possibilité de refus/blocage. Détails relationnels encore ouverts.
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

1. Lire entièrement les deux documents cibles et la conception initiale ; comparer avec les chapitres 01–13, PRODUCT.md, INDEX.md et le registre, en conservant la distinction BIB-01–18 / F4-A–F / KIN-01.
2. Analyser le **code existant réellement dans les branches pertinentes** (main et pilote catalogue) avant de proposer migrations ou services ; ne pas reconstituer l'état du dépôt à partir d'un souvenir.
3. Vérifier la cohérence des 17 parcours et la traçabilité de chaque décision avec preuves, identifier toute nouvelle règle non validée.
4. Auditer en priorité : accès hérités de la Bibliothèque, conservation après retrait, mise à jour globale reprenable, versions d'une même fiche dans plusieurs Bibliothèques, héritage des permissions sur copies, arrêt/archivage, modération et droits commerciaux isolés.
5. Fournir une architecture **minimale** et une alternative si le choix proposé est complexe ; chiffrer en complexité (faible/moyen/fort) sans inventer de coût ni imposer une technologie.
6. Détailler les relations et index des tables qui seraient réellement nécessaires, ainsi que contraintes référentielles, migrations, stratégie de cache et transactions.
7. Auditer sécurité des droits côté serveur, confidentialité, accès média, signalements et capacité réelle de neutralisation iOS ; signaler les limites.
8. Contrôler le non-impact du MVP et du moteur d'Exécution, ainsi que l'interopérabilité avec l'import pilote 60 fiches.
9. Rendre **par axe** statut CONFORME / PARTIELLEMENT CONFORME / NON CONFORME / NON VÉRIFIABLE / À CLARIFIER, preuves de code/docs, contradictions et corrections proposées.
10. Classer chaque recommandation en **obligatoire pour la cohérence**, **utile mais différable** ou **surcomplexité à éviter**. Ne proposer ni microservices, ni synchronisation automatique, ni nouveaux contrôles bloquants sans justification.

**Livrables attendus de Claude :** distinguer explicitement l'architecture Bibliothèque/coach de la transmission de Mouvement kiné/Espace (sans prescription numérique) et proposer leur mutualisation minimale pour la diffusion/modération ; rapport de revue contradictoire, schéma de données cible minimal corrigé, matrice décision→parcours→composants→tests, liste réduite d'arbitrages à prendre avant développement, et plan de lots réaliste. Ne pas déclarer un parcours Figma validé sans identification d'écrans/nœuds probants.

---

**Traçabilité documentaire :** ce dossier est une proposition de conception pour revue sur branche dédiée ; il ne supersède pas de lui-même les chapitres normatifs. Les décisions F4-A–F doivent être propagées au registre et aux chapitres après consolidation, sans laisser coexister de règles contradictoires. Les fichiers non concernés doivent rester inchangés.

# KODJO — Conception des Bibliothèques et du partage des Mouvements

**Date :** 10 novembre 2026.  
**Statut :** conception fonctionnelle cible ultérieure du partage ; premier lot limité aux Bibliothèques génériques KODJO (BIB-19 à BIB-23).

**Parcours normatifs :** [PU-01 à PU-17](KODJO-Bibliotheques-Parcours-utilisateurs-cibles-2026-11-10.md). **Conception technique pour revue :** [architecture et données](KODJO-Bibliotheques-Conception-fonctionnelle-technique-donnees-Revue-Claude-2026-11-10.md).
  
**Autorité :** décisions BIB-01 à BIB-18 ci-dessous ; registre au chapitre 07.  
**Périmètre :** création, provenance, composition, partage, droits, mises à jour, modération et principes techniques de distribution des Mouvements. **KIN-01 :** la transmission individuelle s'effectue dans un **Espace en étoile générique**, sans rôle professionnel dans le modèle. Dans l'usage kiné-patient, les consignes d'exécution sont orales, sans prescription numérique. Ce document ne spécifie pas de nouvel écran Figma et ne déclare aucune fonction réseau livrée.

## Articulation avec le socle éditorial — 11/11/2026

BIB-19 à BIB-23 limitent **l'offre de Bibliothèques proposée à l'utilisateur** à celles maintenues par KODJO ; ils ne reportent pas les exigences de **fiche éditoriale complète**, provenance, auteur, droits de source, licences des médias et révisions. Elles restent nécessaires aux étapes 1–5 du plan de six étapes et à l'administration Web KODJO (création du 61e Mouvement et export d'un fichier compatible). La **composition personnelle** et la **redistribution par des utilisateurs** décrites ci-dessous sont des cibles ultérieures, non un flux du chantier courant. Les services de fichier catalogue autonome CA-3 et la réconciliation des 60 Mouvements font partie du chantier immédiat. L'édition du contenu local est dans le Catalogue ; l'édition source exhaustive est dans l'administration Web ; Profil est la gestion des Bibliothèques. Le partage interutilisateurs n'est pas une dépendance de la mise à jour des Bibliothèques KODJO.

## Bibliothèques génériques KODJO — premier lot (BIB-19 à BIB-23, 10/11/2026)

Le premier lot est limité aux Bibliothèques génériques éditées par KODJO : sélection, installation et mises à jour volontaires depuis le Profil ; contenus utilisés et personnalisés dans le Catalogue. Le bloc « Mes données » du Profil est supprimé. Les contenus publiés ne sont pas modifiables directement ; les Bibliothèques sont distinctes des catégories du Catalogue. Bibliothèques personnelles ou de coachs, partage, permissions, relations et commerce sont reportés. Les anciens parcours de partage ci-dessous restent des **cibles ultérieures**, non le premier lot. Désinstallation et traitement des adaptations locales **À CLARIFIER**. Figma inchangé. Voir le registre BIB-19 à BIB-23.

## 1. Concepts et identités

- **Mouvement** : fiche éditoriale décrivant un geste, ses consignes et médias ; son identité de source et sa révision sont distinctes de l'identifiant local du Mouvement utilisé par l'application. Le geste physique générique n'est pas assimilé à une œuvre créée par KODJO.
- **Auteur** : un seul auteur identifié par fiche (ou inconnu pour une source dont l'auteur n'est pas établi). Le créateur d'une fiche originale devient auteur ; aucune gestion des coauteurs ou des contributeurs.
- **Propriétaire administratif** : utilisateur ou organisation responsable de la gestion et de la distribution de la fiche. Par défaut, le créateur de la fiche originale est également propriétaire administratif. L'attribution à une organisation doit être explicite et traçable. Ce rôle ne constitue pas une preuve juridique de titularité des droits.
- **Titulaire des droits** : information de droits distincte lorsqu'elle est connue ; les déclarations de droits et licences ne sont pas automatiquement vérifiées.
- **Diffuseur** : acteur présentant une fiche ou une Bibliothèque à des destinataires habilités ; le fait de diffuser ne modifie ni auteur ni propriété.
- **Bibliothèque** : collection identifiée de références vers des Mouvements, et non ensemble de copies physiques. Elle possède notamment un propriétaire, un nom, une description et une composition ordonnée. Une même fiche peut être référencée dans plusieurs Bibliothèques.
- **Installation** : matérialisation locale d'une fiche et de sa révision d'origine ; elle ne transfère ni auteur, ni propriété, ni permissions de redistribution.

La provenance, l'identité de source, l'historique des révisions et les permissions sont conservés à travers les copies et les installations. Une Bibliothèque peut être distribuée par tout utilisateur ; une transmission individuelle est distinctement possible dans une relation de l'Espace en étoile, sans Bibliothèque fictive ni prescription numérique. Le pilote existant de 60 fiches peut garder un auteur ou un propriétaire « inconnu » sans les inventer ; aucune diffusion d'une fiche dont les droits nécessaires ne sont pas établis.

## 2. Décisions fonctionnelles validées

| Référence | Décision |
|---|---|
| **BIB-01** | Tout utilisateur peut créer des Mouvements et une ou plusieurs Bibliothèques personnelles. |
| **BIB-02** | Une fiche possède au plus un auteur ; par défaut son créateur original est aussi son propriétaire administratif, sauf attribution explicite. |
| **BIB-03** | Affecter un Mouvement à une Bibliothèque ajoute une référence, sans copie ; le même Mouvement peut appartenir à plusieurs Bibliothèques. |
| **BIB-04** | Une Bibliothèque personnelle peut mélanger librement des Mouvements propres, reçus d'un utilisateur, d'un coach, d'un kinésithérapeute ou de KODJO. |
| **BIB-05** | Visibilité indépendante des conditions d'accès : personnelle, partagée avec des destinataires nommés ou des groupes, publique ; accès gratuit ou payant. Il n'existe pas de type structurel séparé « Coach », « Kiné » ou « KODJO » **pour les Bibliothèques qu'ils créent**. Cela ne fait pas d'une Bibliothèque le support du parcours de transmission kiné-patient (KIN-01). |
| **BIB-06** | **Supersédée par MOUV-D3 pour toute fiche importée** : aucune modification ni duplication ; seul le droit de redistribuer reste pertinent pour une future diffusion autorisée. Les quatre modes ci-dessous ne constituent plus une règle applicable aux fiches importées. |
| **BIB-07** | **Supersédée par MOUV-D3 pour toute fiche importée** : la copie de Mouvement importé est interdite, même pour usage personnel. La duplication des Mouvements créés personnellement reste possible suivant les règles locales. |
| **BIB-08** | Les restrictions sur la fiche ne verrouillent pas les paramètres d'exécution propres aux Exercices et aux Séances. |
| **BIB-09** | Une Bibliothèque reçue/téléchargée est en lecture seule sur sa composition locale : ni ajout, ni retrait, ni réordonnancement. Le destinataire peut créer ses propres Bibliothèques et y référencer les Mouvements reçus, sans les retirer de la Bibliothèque source ni les copier. |
| **BIB-10** | Une Bibliothèque partagée contient les fiches que le propriétaire est habilité à **publier pour la première fois** et les fiches tierces dont il possède le droit de **redistribution**. Les autres fiches tierces sont intégralement exclues pour le destinataire ; aucune métadonnée interdite n'est exposée. La composition personnelle de l'émetteur reste inchangée. |
| **BIB-11** | Dans une future redistribution autorisée, la fiche importée est transmise **à l'identique**, sans droit de modification ni copie personnelle. Les anciens modes de permission éditoriale sont supersédés pour les fiches importées (MOUV-D3). |
| **BIB-12** | Une nouvelle révision éditoriale d'un Mouvement distribué n'est **jamais installée automatiquement** : pastille d'alerte chez le destinataire, accès à la Bibliothèque et action **« Mettre à jour »**. Sans action de l'utilisateur, sa version reste inchangée. |
| **BIB-13** | Une adaptation locale autorisée ne modifie jamais la fiche source ni les autres installations. Une révision distante ne doit pas écraser silencieusement une adaptation personnelle. |
| **BIB-14** | Le premier partage d'une révision exige une autorisation centrale KODJO. Pour un partage privé sans anomalie : contrôles automatiques suffisants ; un doute conduit à revue humaine. |
| **BIB-15** | Pour la première publication publique ou payante : contrôles automatiques **et** validation humaine. Une révision approuvée et inchangée est réutilisable dans d'autres Bibliothèques sans nouvelle validation. Toute nouvelle révision à diffuser repasse par le contrôle approprié. |
| **BIB-16** | KODJO doit pouvoir signaler, refuser, suspendre ou retirer un contenu problématique après diffusion, indépendamment de l'accord du propriétaire ou du destinataire ; l'historique de décision est traçable. |
| **BIB-17** | Un retrait de modération neutralise autant que possible le contenu litigieux, sans détruire inutilement les références de la fiche dans les Bibliothèques, Exercices, Séances ou historiques ; le blocage distant est effectif dès la prochaine synchronisation capable de l'appliquer. |
| **BIB-18** | Les fonctions de diffusion, comptes, paiements, contrôle central et modération appartiennent à la cible **post-MVP** ; le MVP local et son moteur d'exécution ne sont pas rendus dépendants d'un serveur. |

### 2.1 Permissions applicables après MOUV-D3

| Origine de la fiche | Modifier / dupliquer la fiche | Redistribuer | Utiliser dans des Exercices/Séances |
|---|---|---|---|
| Création personnelle | Oui, dans le Catalogue selon règles locales | Sous autorisation applicable à la publication future | Oui |
| Fiche importée | **Non / Non** | Seulement si la source l'autorise, dans un lot futur | Oui, selon droit d'accès |

L'ancienne matrice à quatre modes BIB-06 est **supersédée** pour les fiches importées ; le droit de redistribution ne donne jamais un droit d'édition ou de copie.

Les droits s'appliquent à la fiche éditoriale **reçue**, pas à l'insertion ou aux paramètres d'un Exercice. Le propriétaire habilité peut publier sa propre fiche avec des permissions destinataires Protégé ; un destinataire ne peut pas redistribuer une telle fiche. La création originale locale est modifiable et non redistribuable par des tiers avant choix explicite de droits à la première diffusion. L'installation technique ou l'association à une Bibliothèque ne constitue pas une redistribution. Le titulaire et les droits de la fiche restent attachés à la source ; aucune opération de copie d'une fiche importée n'est permise.

### 2.2 Distribution sélective d'une Bibliothèque

La composition personnelle peut inclure des fiches propres Protégées et des fiches tierces non redistribuables. La version reçue n'expose que les fiches que l'émetteur a le droit de publier ou redistribuer : aucune donnée des fiches tierces interdites, pas même un titre ou un emplacement bloqué. Les Mouvements reçus gardent leurs restrictions ; le destinataire ne peut ni réorganiser la Bibliothèque reçue ni faire apparaître les éléments non autorisés.

Un changement de permission ne doit jamais révéler rétroactivement un contenu avant autorisation centrale et contrôle de droits. Le devenir d'une ancienne version déjà téléchargée après modification de droits ou de composition est à préciser (§ 7).

## 3. Révisions, alerte et intervention de modération

**Révision ordinaire :** le propriétaire habilité prépare une nouvelle version de la fiche et de ses permissions destinataires ; cette révision contrôlée reçoit son propre identifiant et repasse par la validation avant diffusion. Le destinataire voit une pastille dans le parcours Bibliothèques et peut choisir « Mettre à jour ». Aucune nouvelle version n'est appliquée tant qu'il ne demande pas l'opération. Ne pas réintroduire « Accepter / Refuser / Reporter » comme obligation ou contrôle bloquant de la mise à jour distribuée. Une Bibliothèque possède sa version de **composition** ; **F4-G** fixe une **seule révision active sur l'appareil** par fiche source, même lorsqu'elle est référencée dans plusieurs Bibliothèques. Une mise à jour volontaire de la fiche la rend visible dans toutes ses Bibliothèques référentes, avec information préalable des effets transversaux ; les autres compositions ne changent pas.

**Mesure de modération :** si un média ou une fiche est illicite, obscène ou dangereux, KODJO peut suspendre immédiatement sa distribution centrale, puis demander la neutralisation des installations à la prochaine synchronisation. La révocation est indépendante de la mise à jour éditoriale volontaire et ne requiert pas le bouton « Mettre à jour ». Lorsque seule une vidéo pose problème, la fiche et les associations peuvent rester accessibles avec ce média bloqué. Une mesure grave peut rendre toute la fiche inaccessible.

**Limite hors ligne/iOS :** une notification silencieuse peut accélérer la prise en compte sur un iPhone connecté et autorisé à exécuter l'application en arrière-plan, mais sa réception/exécution n'est pas garantie lorsque KODJO est fermé. Une application durablement hors ligne ou fermée de force peut conserver temporairement des données locales. Prévoir le contrôle au démarrage et aux synchronisations, sans promettre un effacement immédiat des fichiers déjà présents.

## 4. Parcours cible

1. Création d'un Mouvement et de sa Bibliothèque personnelle : fonctionnement local immédiat, sans contrôle central tant que rien n'est partagé.
2. L'utilisateur sélectionne une fiche ou une Bibliothèque à partager ; KODJO conserve ses propres fiches publiables et les fiches tierces redistribuables, sans exposer celles dont la redistribution est interdite.
3. Pour chaque révision non encore approuvée : transfert sécurisé de la fiche et de ses médias vers un espace privé, contrôle automatique, escalade humaine selon type de publication ou anomalie.
4. Une fois approuvées et après contrôle des droits d'accès, les fiches sont distribuables aux destinataires ; les références non redistribuables sont exclues.
5. Le destinataire installe ou consulte la Bibliothèque en lecture seule ; il peut référencer les Mouvements dans ses Bibliothèques personnelles sans copier les fiches.
6. Lorsqu'une nouvelle révision est approuvée, pastille d'alerte ; « Mettre à jour » déclenche la mise à jour demandée et les contrôles de cohérence. Rien n'est modifié sans action.
7. Lors d'un signalement, l'équipe de modération peut bloquer la distribution ou neutraliser un média, informer les acteurs concernés et tracer la décision.

## 5. Modèle logique minimal — cible de conception

- **Fiche source :** identité stable (`source_namespace`, `sheet_id`), auteur unique nullable, propriétaire administratif, provenance et historique des révisions ; nom affiché non unique globalement.
- **Révision :** contenu et médias référencés, empreinte, permissions des destinataires Modifier/Redistribuer et décision d'approbation. La première publication par le propriétaire habilité ne dépend pas du droit de redistribution accordé aux destinataires.
- **Mouvement local :** identité `Movement.id` existante et **une seule version active** par fiche source. Les Bibliothèques le référencent, sans duplication.
- **Bibliothèque :** identité, propriétaire, composition ordonnée par références, version publiée, visibilité et accès. La version de composition n'impose pas une version active distincte de la fiche chez le destinataire.
- **Accès et preuve :** droit attribué au niveau Bibliothèque et preuve de livraison, conservés dans la mesure nécessaire à l'usage acquis après retrait d'une fiche.
- **Espace en étoile :** relation individuelle générique et transmission de fiches, sans entité de prescription, de profil clinique ou de rôle professionnel.
- **Modération :** approbation de révision, contrôles de médias et état de suspension prioritaire.
- **Commerce :** contrat indépendant, sans prix ou transaction dans la fiche ni la composition.

La cible technique cherche à réutiliser la base locale opérationnelle et le registre d'installation du pilote. Les homonymes de sources différentes nécessitent d'adapter l'unicité globale de `normalized_name` (migration 013), sans modifier `Movement.id`. Les groupes et conditions d'accès payantes sont différables ; les tables exactes, la cohérence multi-fiches et le journal de reprise doivent être audités par Claude.

## 6. Architecture technique cible — choix de réalisation non figés

**Dans l'iPhone :** catalogue local et moteur d'exécution SQLite préservés ; préparation d'une demande de partage ; état d'installation, pastille d'alerte et commande « Mettre à jour » ; contrôle local des décisions de modération lors des synchronisations et au démarrage.

**Côté serveur :** identité/authentification, registre central des fiches et révisions, droits de redistribution et d'accès, stockage privé des médias, soumission de publication, tâches asynchrones de modération, file humaine et journal des décisions, distribution contrôlée, registre des contenus suspendus et signalements. Le serveur doit vérifier les droits à chaque diffusion ; masquer un bouton dans l'application ne suffit pas.

**Chaîne de modération :** contrôles de format et de cohérence ; analyse automatique des textes/images ; vidéos par examen de séquences ou service spécialisé ; approbation humaine des premières publications publiques et payantes, et des cas suspects. Aucun outil automatique ne prouve à lui seul les droits d'auteur ni la validité clinique d'une démonstration. Déclarations de droits, signalement, traitement des contestations et suspension restent nécessaires.

**Options techniques à évaluer (non arbitrées) :** PostgreSQL/Supabase, stockage privé et URL temporaires, fonctions serveur et file de travaux, API de modération texte/image, service d'analyse vidéo, petite interface d'administration web. Ne pas confondre l'administration éditoriale locale/OVH actuelle avec un backend de publication ou une console de modération opérationnelle. Prévoir la maîtrise des coûts, la protection des données personnelles, les durées de rétention et la conformité juridique.

**Invariants :** un contenu non approuvé n'est pas téléchargeable par un tiers ; une approbation concerne une empreinte/révision précise ; toute nouvelle révision à diffuser repasse par le contrôle ; les permissions de fiche sont appliquées côté serveur ; aucune validation précédente ne couvre un média modifié.

## 7. Points restant À CLARIFIER

1. **Commerce :** achat définitif, abonnement, expiration, récupération après changement d'appareil et droits acquis associés.
2. **Permissions ultérieures :** effet d'une restriction de modification/redistribution sur des installations ou redistributions déjà réalisées ; droits et licences des médias.
3. **Réconciliation historique :** les anciennes adaptations éventuelles des 60 fiches déjà installées sont conservées et rapprochées par CA-3 sans fusion ni écrasement silencieux ; les nouvelles fiches importées sont en lecture seule (MOUV-D3).
4. **Cohérence des lots :** mécanisme technique minimal de mise à jour globale et reprise après interruption avec deux bases SQLite.
5. **Homonymes :** forme exacte de l'index et contrôle des doublons parmi les fiches originales d'un même utilisateur.
6. **Groupes et Espace :** phasage des groupes, fin de relation individuelle, notifications et confidentialité.
7. **Modération :** critères de contrôle, délais, contestations et droit applicable selon les données effectivement traitées.
8. **UX / Figma :** écrans Bibliothèques, aperçu de propagation vers d'autres Bibliothèques, commandes de partage, mise à jour et signalement, non validés visuellement à ce stade.

**Déjà définis et non ouverts :** une seule révision active par fiche source et par appareil ; propagation de son actualisation à toutes les Bibliothèques référentes ; compositions des autres Bibliothèques inchangées ; **aucune copie ou édition des fiches importées (MOUV-D3)** ; archivage indépendant de la diffusion ; arrêt du partage sans suppression des installations existantes.

## 8. Périmètre et traçabilité

Les décisions ci-dessus concernent la conception cible au-delà du MVP local. Elles ne modifient pas la création locale déjà livrée, les règles d'Exécution, les calculs des formats, les familles de niveaux ni les écrans Figma MVP. Les structures post-MVP doivent être ajoutées sans migration destructive des Mouvements, des Séances ou de leurs historiques.

**Références :** chapitres 02 à 05, 07 à 12 des Spécifications fonctionnelles ; PRODUCT.md ; INDEX.md ; documents de pilote de la branche catalogue/integration-60-main-20261109 (non fusionnés dans main au 10/11/2026).

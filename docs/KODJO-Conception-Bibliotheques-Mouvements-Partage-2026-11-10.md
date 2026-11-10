# KODJO — Conception des Bibliothèques et du partage des Mouvements

**Date :** 10 novembre 2026.  
**Statut :** conception fonctionnelle cible arbitrée avec le propriétaire du produit ; réalisation post-MVP, sauf composants déjà présents explicitement identifiés ailleurs.

> **Complément validé F4-A à F4-F — 10/11/2026 :** les questions de mise à jour de composition, de conservation locale, d'accès par Bibliothèque, d'archivage et d'arrêt du partage ont été arbitrées après la présente version. Consulter les [parcours consolidés](KODJO-Bibliotheques-Parcours-utilisateurs-cibles-2026-11-10.md) et le [dossier d'architecture soumis à Claude](KODJO-Bibliotheques-Conception-fonctionnelle-technique-donnees-Revue-Claude-2026-11-10.md). Les anciennes interrogations du §7 sur ces points sont supersédées ; les points commerciaux et de conflit de versions restent ouverts.
  
**Autorité :** décisions BIB-01 à BIB-18 ci-dessous ; registre au chapitre 07.  
**Périmètre :** création, provenance, composition, partage, droits, mises à jour, modération et principes techniques de distribution des Mouvements. **Précision KIN-01 :** le parcours kiné-patient transmet le Mouvement dans l'Espace professionnel en étoile, sans prescription numérique d'Exercice/Séance ; l'exécution est expliquée oralement. Ce document ne spécifie pas de nouvel écran Figma et ne déclare aucune fonction réseau livrée.

## 1. Concepts et identités

- **Mouvement** : fiche éditoriale décrivant un geste, ses consignes et médias ; son identité de source et sa révision sont distinctes de l'identifiant local du Mouvement utilisé par l'application. Le geste physique générique n'est pas assimilé à une œuvre créée par KODJO.
- **Auteur** : un seul auteur identifié par fiche (ou inconnu pour une source dont l'auteur n'est pas établi). Le créateur d'une fiche originale devient auteur ; aucune gestion des coauteurs ou des contributeurs.
- **Propriétaire administratif** : utilisateur ou organisation responsable de la gestion et de la distribution de la fiche. Par défaut, le créateur de la fiche originale est également propriétaire administratif. L'attribution à une organisation doit être explicite et traçable. Ce rôle ne constitue pas une preuve juridique de titularité des droits.
- **Titulaire des droits** : information de droits distincte lorsqu'elle est connue ; les déclarations de droits et licences ne sont pas automatiquement vérifiées.
- **Diffuseur** : acteur présentant une fiche ou une Bibliothèque à des destinataires habilités ; le fait de diffuser ne modifie ni auteur ni propriété.
- **Bibliothèque** : collection identifiée de références vers des Mouvements, et non ensemble de copies physiques. Elle possède notamment un propriétaire, un nom, une description et une composition ordonnée. Une même fiche peut être référencée dans plusieurs Bibliothèques.
- **Installation** : matérialisation locale d'une fiche et de sa révision d'origine ; elle ne transfère ni auteur, ni propriété, ni permissions de redistribution.

La provenance, l'identité de source, l'historique des révisions et les permissions sont conservés à travers les copies et les installations. Un **coach** peut distribuer une Bibliothèque ; un **kinésithérapeute** transmet ses Mouvements dans la relation individuelle au patient, au sein de son Espace professionnel, et non par une Bibliothèque prescrite. Le pilote existant de 60 fiches peut garder un auteur ou un propriétaire « inconnu » sans les inventer ; aucune diffusion d'une fiche dont les droits nécessaires ne sont pas établis.

## 2. Décisions fonctionnelles validées

| Référence | Décision |
|---|---|
| **BIB-01** | Tout utilisateur peut créer des Mouvements et une ou plusieurs Bibliothèques personnelles. |
| **BIB-02** | Une fiche possède au plus un auteur ; par défaut son créateur original est aussi son propriétaire administratif, sauf attribution explicite. |
| **BIB-03** | Affecter un Mouvement à une Bibliothèque ajoute une référence, sans copie ; le même Mouvement peut appartenir à plusieurs Bibliothèques. |
| **BIB-04** | Une Bibliothèque personnelle peut mélanger librement des Mouvements propres, reçus d'un utilisateur, d'un coach, d'un kinésithérapeute ou de KODJO. |
| **BIB-05** | Visibilité indépendante des conditions d'accès : personnelle, partagée avec des destinataires nommés ou des groupes, publique ; accès gratuit ou payant. Il n'existe pas de type structurel séparé « Coach », « Kiné » ou « KODJO ». |
| **BIB-06** | Deux seules permissions de fiche : **Modifier** et **Redistribuer**, indépendantes. Quatre modes : Protégé (non/non), Libre localement (oui/non), Partageable à l'identique (non/oui), Libre (oui/oui). |
| **BIB-07** | **Copier** est toujours possible pour l'usage personnel et n'est pas une permission. Toute copie conserve obligatoirement les permissions et la provenance de la source ; les copies successives ne peuvent élargir les droits. Copier n'efface ni n'affecte la fiche source. |
| **BIB-08** | Les restrictions sur la fiche ne verrouillent pas les paramètres d'exécution propres aux Exercices et aux Séances. |
| **BIB-09** | Une Bibliothèque reçue/téléchargée est en lecture seule sur sa composition locale : ni ajout, ni retrait, ni réordonnancement. Le destinataire peut créer ses propres Bibliothèques et y référencer les Mouvements reçus, sans les retirer de la Bibliothèque source ni les copier. |
| **BIB-10** | Lorsqu'une Bibliothèque personnelle est partagée, **seuls** les Mouvements autorisés à la redistribution sont visibles et récupérables par le destinataire ; aucun élément interdit n'est exposé, même verrouillé. Filtrage automatique ; composition de l'émetteur inchangée. |
| **BIB-11** | Une fiche « Partageable à l'identique » conserve son contenu, sa provenance et ses restrictions lors de la redistribution ; les copies autorisées à la redistribution ne gagnent pas le droit de modification. |
| **BIB-12** | Une nouvelle révision éditoriale d'un Mouvement distribué n'est **jamais installée automatiquement** : pastille d'alerte chez le destinataire, accès à la Bibliothèque et action **« Mettre à jour »**. Sans action de l'utilisateur, sa version reste inchangée. |
| **BIB-13** | Une adaptation locale autorisée ne modifie jamais la fiche source ni les autres installations. Une révision distante ne doit pas écraser silencieusement une adaptation personnelle. |
| **BIB-14** | Le premier partage d'une révision exige une autorisation centrale KODJO. Pour un partage privé sans anomalie : contrôles automatiques suffisants ; un doute conduit à revue humaine. |
| **BIB-15** | Pour la première publication publique ou payante : contrôles automatiques **et** validation humaine. Une révision approuvée et inchangée est réutilisable dans d'autres Bibliothèques sans nouvelle validation. Toute nouvelle révision à diffuser repasse par le contrôle approprié. |
| **BIB-16** | KODJO doit pouvoir signaler, refuser, suspendre ou retirer un contenu problématique après diffusion, indépendamment de l'accord du propriétaire ou du destinataire ; l'historique de décision est traçable. |
| **BIB-17** | Un retrait de modération neutralise autant que possible le contenu litigieux, sans détruire inutilement les références de la fiche dans les Bibliothèques, Exercices, Séances ou historiques ; le blocage distant est effectif dès la prochaine synchronisation capable de l'appliquer. |
| **BIB-18** | Les fonctions de diffusion, comptes, paiements, contrôle central et modération appartiennent à la cible **post-MVP** ; le MVP local et son moteur d'exécution ne sont pas rendus dépendants d'un serveur. |

### 2.1 Matrice des permissions

| Mode | Modifier la fiche ou une copie personnelle | Redistribuer la fiche ou une copie autorisée | Utiliser dans ses Exercices/Séances |
|---|---|---|---|
| Protégé | Non | Non | Oui, si droit d'accès valide |
| Libre localement | Oui | Non | Oui, si droit d'accès valide |
| Partageable à l'identique | Non | Oui, sans changement de contenu | Oui, si droit d'accès valide |
| Libre | Oui | Oui | Oui, si droit d'accès valide |

Les droits s'appliquent à la fiche éditoriale, pas à l'insertion ou aux paramètres d'un Exercice. L'installation technique ou l'association à une Bibliothèque ne constitue pas une redistribution. Le mode et le titulaire de droit restent attachés à la source et ne sont pas redéfinis par le simple copieur.

### 2.2 Distribution sélective d'une Bibliothèque

La composition personnelle peut inclure six Mouvements dont seulement trois sont redistribuables. La version reçue n'expose que les trois fiches autorisées : aucune donnée de la fiche interdite, pas même son titre ou un emplacement bloqué. Les Mouvements reçus gardent leurs restrictions ; le destinataire ne peut ni réorganiser la Bibliothèque reçue ni faire apparaître les éléments non autorisés.

Un changement de permission ne doit jamais révéler rétroactivement un contenu avant autorisation centrale et contrôle de droits. Le devenir d'une ancienne version déjà téléchargée après modification de droits ou de composition est à préciser (§ 7).

## 3. Révisions, alerte et intervention de modération

**Révision ordinaire :** l'auteur/propriétaire habilité prépare une nouvelle version ; elle reçoit sa propre identité de révision et repasse par la validation avant diffusion. Le destinataire voit une pastille dans le parcours Bibliothèques et peut choisir « Mettre à jour ». Aucune nouvelle version n'est appliquée tant qu'il ne demande pas l'opération. Ne pas réintroduire « Accepter / Refuser / Reporter » comme obligation ou contrôle bloquant de la mise à jour distribuée. La composition de Bibliothèque fait l'objet d'une version propre à la Bibliothèque, distincte des révisions des fiches.

**Mesure de modération :** si un média ou une fiche est illicite, obscène ou dangereux, KODJO peut suspendre immédiatement sa distribution centrale, puis demander la neutralisation des installations à la prochaine synchronisation. La révocation est indépendante de la mise à jour éditoriale volontaire et ne requiert pas le bouton « Mettre à jour ». Lorsque seule une vidéo pose problème, la fiche et les associations peuvent rester accessibles avec ce média bloqué. Une mesure grave peut rendre toute la fiche inaccessible.

**Limite hors ligne/iOS :** une notification silencieuse peut accélérer la prise en compte sur un iPhone connecté et autorisé à exécuter l'application en arrière-plan, mais sa réception/exécution n'est pas garantie lorsque KODJO est fermé. Une application durablement hors ligne ou fermée de force peut conserver temporairement des données locales. Prévoir le contrôle au démarrage et aux synchronisations, sans promettre un effacement immédiat des fichiers déjà présents.

## 4. Parcours cible

1. Création d'un Mouvement et de sa Bibliothèque personnelle : fonctionnement local immédiat, sans contrôle central tant que rien n'est partagé.
2. L'utilisateur sélectionne une fiche ou une Bibliothèque à partager ; KODJO calcule la liste des fiches redistribuables, sans révéler celles qui ne le sont pas.
3. Pour chaque révision non encore approuvée : transfert sécurisé de la fiche et de ses médias vers un espace privé, contrôle automatique, escalade humaine selon type de publication ou anomalie.
4. Une fois approuvées et après contrôle des droits d'accès, les fiches sont distribuables aux destinataires ; les références non redistribuables sont exclues.
5. Le destinataire installe ou consulte la Bibliothèque en lecture seule ; il peut référencer les Mouvements dans ses Bibliothèques personnelles sans copier les fiches.
6. Lorsqu'une nouvelle révision est approuvée, pastille d'alerte ; « Mettre à jour » déclenche la mise à jour demandée et les contrôles de cohérence. Rien n'est modifié sans action.
7. Lors d'un signalement, l'équipe de modération peut bloquer la distribution ou neutraliser un média, informer les acteurs concernés et tracer la décision.

## 5. Conception logique minimale — cible, pas schéma SQL imposé

- **MovementEditorialSheet** : identité éditoriale de source, auteur unique optionnel, propriétaire administratif, titulaire déclaré des droits, permissions, état de diffusion et origine. La fiche locale Movement conserve son identifiant et ses relations actuelles avec Exercices/Séances.
- **MovementRevision** : identifiant de fiche, numéro de révision, empreinte du contenu, contenu éditorial, références médias, horodatage, état de validation.
- **MovementMedia** : identifiant, type, emplacement privé, empreinte, statut d'analyse, statut d'accès.
- **Library** : identité, propriétaire, nom, description, visibilité, conditions d'accès (gratuit/payant), statut d'archivage éventuel à arbitrer.
- **LibraryMembership** : couple (Bibliothèque, fiche), position, sans copie du contenu.
- **LibraryRevision** : état publié de la composition et historique ; politique de retrait/synchronisation des membres à préciser.
- **DistributionGrant / Entitlement** : destinataire ou groupe, mode de visibilité, preuve du droit d'accès et, si payant, droit commercial valide ; ne doit jamais élargir les permissions de la fiche.
- **LocalInstallation / SourceLink** : correspondance entre fiche/révision source et fiche locale, Bibliothèque reçue, dernière révision installée et éventuelles adaptations locales.
- **ModerationCase / Decision / Report** : cible et révision, motif, auteur du signalement, contrôles, décision, horodatage, acteur et état de notification.

Les champs et opérations réels doivent être reconciliés avec la provenance préparatoire et le format de catalogue pilote présents sur la branche catalogue/integration-60-main-20261109. Ces sources ne sont pas fusionnées dans la baseline main au 10/11/2026 ; notamment le tableau authors[] du pilote est à adapter à la décision d'auteur unique et le refus de révision du chargement pilote ne décrit pas le partage futur.

## 6. Architecture technique cible — choix de réalisation non figés

**Dans l'iPhone :** catalogue local et moteur d'exécution SQLite préservés ; préparation d'une demande de partage ; état d'installation, pastille d'alerte et commande « Mettre à jour » ; contrôle local des décisions de modération lors des synchronisations et au démarrage.

**Côté serveur :** identité/authentification, registre central des fiches et révisions, droits de redistribution et d'accès, stockage privé des médias, soumission de publication, tâches asynchrones de modération, file humaine et journal des décisions, distribution contrôlée, registre des contenus suspendus et signalements. Le serveur doit vérifier les droits à chaque diffusion ; masquer un bouton dans l'application ne suffit pas.

**Chaîne de modération :** contrôles de format et de cohérence ; analyse automatique des textes/images ; vidéos par examen de séquences ou service spécialisé ; approbation humaine des premières publications publiques et payantes, et des cas suspects. Aucun outil automatique ne prouve à lui seul les droits d'auteur ni la validité clinique d'une démonstration. Déclarations de droits, signalement, traitement des contestations et suspension restent nécessaires.

**Options techniques à évaluer (non arbitrées) :** PostgreSQL/Supabase, stockage privé et URL temporaires, fonctions serveur et file de travaux, API de modération texte/image, service d'analyse vidéo, petite interface d'administration web. Ne pas confondre l'administration éditoriale locale/OVH actuelle avec un backend de publication ou une console de modération opérationnelle. Prévoir la maîtrise des coûts, la protection des données personnelles, les durées de rétention et la conformité juridique.

**Invariants :** un contenu non approuvé n'est pas téléchargeable par un tiers ; une approbation concerne une empreinte/révision précise ; toute nouvelle révision à diffuser repasse par le contrôle ; les permissions de fiche sont appliquées côté serveur ; aucune validation précédente ne couvre un média modifié.

## 7. Points restant À CLARIFIER

1. **F4-E/F4-F VALIDÉS :** l'archivage masque localement sans affecter les destinataires, tandis que l'arrêt du partage interdit les nouvelles distributions et mises à jour sans révoquer les installations existantes. Les états « Brouillon / Active / Inactive » ne sont pas retenus. Détails et exceptions : parcours consolidés.
2. **F4-A à F4-D VALIDÉS :** pastille puis mise à jour manuelle globale (composition + révisions). Un Mouvement précédemment installé et retiré de la Bibliothèque source reste dans le Catalogue local, les Bibliothèques personnelles et Séances. Accès accordé au niveau Bibliothèque ; le cas des révisions divergentes d'une même fiche dans plusieurs Bibliothèques reste À CLARIFIER.
3. **Accès payant :** achat définitif contre abonnement, suspension d'utilisation lorsque le droit commercial expire, droits sur les données déjà téléchargées, et statut « actif » d'un Mouvement dans une Bibliothèque.
4. **Valeur initiale des permissions** lors d'une première création ou d'un premier partage : quatre modes validés, mais défaut non explicitement arbitré.
5. **Gestion de conflits** lors d'une mise à jour manuelle d'une fiche dont une variante locale a été personnalisée ; pas d'écrasement implicite, modalités de rapprochement encore à définir.
6. **Révocation de redistribution** d'une fiche déjà reçue/repartagée, gestion des droits acquis et exigences contractuelles/licences : règles commerciales et juridiques à préciser.
7. **Critères d'approbation et recours :** catégories interdites, seuils de contrôle, délai de revue, traitement des infractions graves, déclaration des droits et procédure de contestation.
8. **Parcours UX/Figma :** pastille, écran Bibliothèques, commandes de mise à jour, création/partage et modération non représentés dans la conception UI MVP vérifiée ; contrats d'écran à produire avant développement.
9. **Identités locales homonymes :** collisions de noms entre fiches de sources distinctes ; raccordement au catalogue de Mouvements actuel à concevoir.

## 8. Périmètre et traçabilité

Les décisions ci-dessus concernent la conception cible au-delà du MVP local. Elles ne modifient pas la création locale déjà livrée, les règles d'Exécution, les calculs des formats, les familles de niveaux ni les écrans Figma MVP. Les structures post-MVP doivent être ajoutées sans migration destructive des Mouvements, des Séances ou de leurs historiques.

**Références :** chapitres 02 à 05, 07 à 12 des Spécifications fonctionnelles ; PRODUCT.md ; INDEX.md ; documents de pilote de la branche catalogue/integration-60-main-20261109 (non fusionnés dans main au 10/11/2026).

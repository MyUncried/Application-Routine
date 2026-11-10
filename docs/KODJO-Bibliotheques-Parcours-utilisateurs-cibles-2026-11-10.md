# KODJO — Parcours utilisateurs cibles : Mouvements et Bibliothèques

**Date :** 10 novembre 2026  
**État :** consolidation fonctionnelle des décisions déjà validées ; **parcours cibles stabilisés au niveau métier**, détails UX non représentés dans Figma à arbitrer avant développement.  
**Usage :** base fonctionnelle du dossier d'architecture soumis à Claude. Aucune modification Figma ni déclaration de fonctionnalité livrée.  
**Source de décisions :** BIB-01 à BIB-18, F4-A à F4-F et précisions successives de Hermann ; [conception initiale](KODJO-Conception-Bibliotheques-Mouvements-Partage-2026-11-10.md).  
**Périmètre :** futur partage des Bibliothèques de Mouvements, hors MVP local.

## 1. Définitions et règles communes

- Une **fiche Mouvement** possède une identité éditoriale source (distincte de son identifiant local), une révision, **un auteur au maximum**, un propriétaire administratif, des permissions et une provenance.
- Une **Bibliothèque personnelle** est créée/administrée par un utilisateur ; elle est immédiatement utilisable et peut référencer des Mouvements de toute provenance.
- Une **Bibliothèque reçue** représente la composition publiée par son propriétaire, dans la version acceptée par le destinataire ; elle est **en lecture seule sur sa composition**.
- **Référencer** un Mouvement dans une Bibliothèque n'est **pas copier** le Mouvement. Un même Mouvement peut appartenir à plusieurs Bibliothèques.
- **Copier** est toujours possible pour un usage personnel ; la copie a une identité locale propre, garde la provenance et **exactement les permissions de la source**. Une succession de copies ne desserre jamais les droits.
- Permissions du contenu de la fiche : **Modifier** et **Redistribuer**, indépendantes. Elles ne verrouillent ni les paramètres d'Exercice ni la réutilisation dans les Séances.
- **Accès à une Bibliothèque** : accordé par son propriétaire à un utilisateur/groupe ; les Mouvements présents en bénéficient pour l'utilisation. Ceci ne change pas leurs permissions de modification et redistribution.
- Un Mouvement précédemment téléchargé reste localement disponible s'il est ultérieurement retiré de la Bibliothèque source, sous réserve des conditions commerciales non arbitrées et des mesures de modération.
- Une **révision ordinaire** ne s'applique jamais automatiquement ; une **mesure de modération** peut au contraire restreindre un contenu sans attendre l'action du destinataire.
- Tout partage effectif d'une **nouvelle révision** requiert une validation centrale : automatique possible pour le privé sans anomalie ; contrôle humain initial pour la publication publique/payante et pour les anomalies.

### Matrice des modes de fiche

| Mode | Modifier le contenu | Redistribuer | Copier pour usage personnel |
|---|---|---|---|
| Protégé | Non | Non | Oui, permissions conservées |
| Libre localement | Oui | Non | Oui, permissions conservées |
| Partageable à l'identique | Non | Oui, à l'identique | Oui, permissions conservées |
| Libre | Oui | Oui | Oui, permissions conservées |

La visibilité d'une Bibliothèque est **personnelle, partagée ou publique**, indépendamment de la condition d'accès **gratuite ou payante**. La gestion commerciale est un chantier séparé.

### Raccordement des arbitrages F4 validés

| Arbitrage | Application aux parcours |
|---|---|
| **F4-A** | Mise à jour de la Bibliothèque sur action explicite, jamais automatique (PU-10). |
| **F4-B** | Mouvement retiré d'une version reçue conservé localement et dans les Séances (PU-10/12). |
| **F4-C** | Accès attribué au niveau Bibliothèque ; retrait du Mouvement n'annule pas l'usage déjà reçu (PU-08/12). |
| **F4-D** | Un seul « Mettre à jour » installe composition et nouvelles révisions sans écraser les adaptations (PU-10). |
| **F4-E** | Archivage du propriétaire sans effet pour les destinataires (PU-13). |
| **F4-F** | Arrêt explicite du partage : pas de nouveaux destinataires, aucune nouvelle MAJ, installations existantes conservées (PU-14). |

## 2. Parcours détaillés

### PU-01 — Créer une Bibliothèque personnelle

**Acteur :** tout utilisateur. **Précondition :** application locale disponible.  
**Déroulement :** l'utilisateur demande la création d'une Bibliothèque, renseigne au minimum son nom, puis enregistre. Il peut ensuite y référencer ses Mouvements et ceux déjà installés depuis d'autres Bibliothèques.  
**Résultat :** Bibliothèque personnelle utilisable localement, composition sous son contrôle. Aucune publication ni contrôle de modération pour le seul usage local.  
**Non tranché :** emplacement précis de la commande et champs facultatifs d'interface.

### PU-02 — Composer ou modifier une Bibliothèque personnelle

**Acteur :** propriétaire de la Bibliothèque.  
**Déroulement :** recherche/sélection d'un Mouvement déjà présent dans le Catalogue local ; ajout par référence, réordonnancement ou retrait de cette Bibliothèque.  
**Résultat :** seule l'association (et l'ordre éventuel) change ; aucun Mouvement source n'est créé, modifié, supprimé ni retiré d'une autre Bibliothèque. Le propriétaire peut associer plusieurs provenances et des copies personnelles explicites.  
**Contrôle :** « ajouter » ne doit pas être transformé en « copier ». Les permissions de la fiche ne conditionnent pas le référencement local.

### PU-03 — Créer ou corriger une fiche personnelle

**Acteur :** utilisateur auteur de la fiche.  
**Déroulement :** création locale, rédaction de la fiche, ajout éventuel de médias, sauvegarde. Les corrections d'une fiche reçue ne sont possibles que lorsque « Modifier » est autorisé ; elles ne remontent jamais à la source.  
**Résultat :** fiche originale sans diffusion implicite, ou adaptation personnelle distincte. Le créateur original reste l'auteur de sa fiche ; aucune fonction de coauteurs.  
**Réserve :** les parcours « Ajouter un niveau » et l'édition locale existants gardent leurs règles propres ; ne pas assimiler « niveau » et « copie ».

### PU-04 — Copier un Mouvement

**Acteur :** utilisateur ayant installé la fiche.  
**Déroulement :** demande de copie pour son Catalogue personnel.  
**Résultat :** nouvelle identité locale, provenance et permissions héritées intégralement. Une copie Protégée demeure non modifiable ; une copie Libre localement demeure non redistribuable. Les références de l'original sont conservées.  
**Réserve :** résolution des noms homonymes à concevoir avec l'actuelle contrainte d'unicité du Catalogue.

### PU-05 — Préparer le partage d'une Bibliothèque personnelle

**Acteur :** propriétaire/diffuseur.  
**Déroulement :** choix des destinataires (personne/groupe ou publication publique) et de la Bibliothèque ; KODJO calcule les seules fiches **redistribuables** et présente le résultat exploitable. Les fiches interdites restent dans la Bibliothèque personnelle de l'émetteur.  
**Résultat :** demande de diffusion d'une composition filtrée ; les destinataires ne reçoivent **ni contenu ni métadonnées** des fiches exclues.  
**Précondition :** propriétaire habilité à redistribuer chaque fiche retenue ; droits et validation vérifiés côté serveur.  
**Non tranché :** forme du résumé avant soumission et choix exact des destinataires.

### PU-06 — Partager un Mouvement seul

**Acteur :** utilisateur autorisé à redistribuer le Mouvement, ou propriétaire publiant sa fiche.  
**Déroulement :** action « Partager » sur la fiche ; même contrôle central que pour une fiche incluse dans une Bibliothèque, sans obligation métier de créer une Bibliothèque persistante.  
**Résultat :** distribution de la révision approuvée aux destinataires habilités avec ses permissions et sa provenance.  
**Technique à examiner :** mutualiser le service de partage sans imposer un objet Bibliothèque fictif.

### PU-07 — Soumettre une révision à la validation centrale

**Acteur :** émetteur et service de modération.  
**Déroulement :** transfert privé des données/médias ; contrôles automatiques ; en cas de doute, revue humaine ; première publication publique ou payante soumise à validation humaine.  
**Résultat :** révision approuvée, en attente de revue ou refusée ; aucune diffusion d'une révision non approuvée. Une même révision inchangée déjà approuvée peut être référencée dans d'autres Bibliothèques sans nouvelle revue.  
**Réserve :** les seuils et délais de revue ne sont pas validés.

### PU-08 — Recevoir / installer une Bibliothèque

**Acteur :** destinataire habilité par le propriétaire de la Bibliothèque.  
**Déroulement :** consultation des éléments éligibles ; installation de la composition proposée et des fiches/révisions autorisées.  
**Résultat :** Bibliothèque reçue en **lecture seule** sur sa composition ; Mouvements disponibles dans le Catalogue local pour création d'Exercices, de Séances et de Bibliothèques personnelles. Une même fiche source installée via plusieurs Bibliothèques ne crée pas systématiquement plusieurs Mouvement locaux.  
**Contrôle :** auteur, permissions, source et version conservés ; le droit d'accès vient de la Bibliothèque, sans élargir la redistribution.

### PU-09 — Télécharger une Bibliothèque KODJO gratuite ou payante

**Acteur :** utilisateur.  
**Déroulement :** découverte de la Bibliothèque officielle, vérification du droit d'accès, installation selon PU-08.  
**Résultat :** même modèle technique qu'une Bibliothèque de coach/kiné. Le volet « gratuit/payant » ne change pas la composition ni les permissions de chaque fiche.  
**À CLARIFIER, chantier commercial distinct :** paiement, abonnements, remboursement, expiration, restauration d'achat, offres et distribution en boutique.

### PU-10 — Recevoir une mise à jour globale

**Acteur :** destinataire d'une Bibliothèque distribuée.  
**Déroulement :** nouvelle composition et/ou nouvelles révisions approuvées disponibles → **pastille d'alerte** → ouverture de la Bibliothèque et consultation des changements (ajouts, retraits, fiches actualisées) → action unique **« Mettre à jour »**.  
**Résultat si action confirmée :** nouvelle composition installée **et** nouvelles révisions éligibles des fiches appliquées comme une opération cohérente ; les Mouvements retirés restent dans le Catalogue local et dans les Séances/Bibliothèques personnelles les référençant ; les adaptations personnelles ne sont jamais écrasées.  
**Résultat sans action :** aucune modification de la version installée. Une mesure de modération demeure prioritaire.  
**Exigence technique :** détection de préconditions et reprise idempotente en cas d'interruption ; ne pas prétendre à une transaction SQL couvrant deux bases SQLite distinctes sans mécanisme adapté.  
**Point de revue Claude :** gestion des conflits et fiches installées via plusieurs Bibliothèques, sans réintroduire une fusion automatique.

### PU-11 — Mettre à jour un Mouvement reçu hors Bibliothèque

**Acteur :** destinataire d'une fiche distribuée individuellement.  
**Déroulement :** alerte de révision, consultation et demande explicite de mise à jour ; même invariants que PU-10.  
**Résultat :** aucune nouvelle révision sans action ; adaptations et usages existants préservés.  
**À préciser :** point d'accès UX pour une fiche reçue sans Bibliothèque visible.

### PU-12 — Retirer une fiche de la Bibliothèque source

**Acteur :** propriétaire de la Bibliothèque source.  
**Déroulement :** retrait dans la composition et publication d'une nouvelle version. Chaque destinataire doit demander « Mettre à jour » pour adopter cette version.  
**Résultat :** le Mouvement retiré n'appartient plus à la nouvelle composition de la Bibliothèque reçue mais **reste installé localement** chez le destinataire qui l'avait téléchargé, et utilisable dans ses Séances et Bibliothèques personnelles selon ses droits. **Aucune copie supplémentaire** n'est nécessaire.  
**Exception :** mesure de modération ; conditions d'accès payant ou temporaire à préciser dans le chantier commercial.

### PU-13 — Archiver / restaurer une Bibliothèque

**Acteur :** propriétaire ou destinataire pour sa propre organisation locale.  
**Déroulement :** archiver la Bibliothèque pour la masquer des listes courantes ; restauration ultérieure.  
**Résultat :** contenu, références et historique conservés. **Si le propriétaire archive une Bibliothèque déjà distribuée, cela ne change strictement rien chez les destinataires**, y compris la possibilité de recevoir les mises à jour publiées. Archivage ≠ arrêt de partage.  
**Non tranché :** détails du filtre « Archives » et apparence des commandes.

### PU-14 — Arrêter explicitement le partage

**Acteur :** propriétaire/diffuseur.  
**Déroulement :** action de suspension/arrêt de diffusion, distincte de l'archivage.  
**Résultat :** aucun nouveau destinataire ne peut télécharger ; destinataires existants, Bibliothèques reçues, Mouvements, Séances et Bibliothèques personnelles restent intacts et utilisables, sous réserve de leurs droits ; **plus de nouvelles mises à jour proposées** tant que le partage est arrêté. Les décisions de modération restent applicables.  
**À CLARIFIER :** reprise ultérieure de la diffusion et éventuelle réinstallation sur un nouvel appareil.

### PU-15 — Signaler et neutraliser un contenu

**Acteur :** utilisateur, modérateur KODJO.  
**Déroulement :** signalement d'une fiche ou d'un média → enregistrement de l'incident → examen → éventuelle suspension centrale prioritaire.  
**Résultat :** les demandes de diffusion sont bloquées immédiatement côté serveur. À la prochaine synchronisation capable de l'appliquer, le client neutralise le contenu ; ses références sont conservées autant que possible. Le blocage **ne dépend pas** de « Mettre à jour ». Si seul un média est litigieux, la fiche peut subsister sans ce média.  
**Limite :** une app fermée de force ou un iPhone hors ligne ne garantit pas une suppression locale instantanée.

### PU-16 — Utiliser KODJO hors ligne ou pendant une interruption

**Acteur :** utilisateur.  
**Déroulement :** consultation, composition et Exécution sur des données locales déjà installées ; mise à jour réseau reportée si indisponible.  
**Résultat :** l'Exécution MVP ne dépend pas du service distant. Les mutations locales sont reprises de manière idempotente ; une panne au milieu de l'installation d'une Bibliothèque ne doit ni laisser de références cassées ni dupliquer des fiches. Les décisions de modération sont rattrapées à la prochaine connexion exploitable.

## 3. États métier — distinction indispensable

| Objet | États/niveaux pertinents | Nature |
|---|---|---|
| Bibliothèque personnelle | courante / archivée (organisation locale) | L'archivage ne modifie pas la diffusion |
| Diffusion de Bibliothèque | personnelle / partagée / publique ; distribution en cours / arrêtée | Ne définit pas la visibilité dans la liste personnelle |
| Bibliothèque reçue | version installée et mise à jour disponible éventuelle | Composition inchangée avant « Mettre à jour » |
| Fiche éditoriale | permissions Modifier/Redistribuer, révision source | Indépendante des droits d'accès |
| Accès | accord au niveau Bibliothèque à personne/groupe | Droit d'utilisation, pas droit de redistribution |
| Modération | approuvée, à contrôler, refusée, suspendue | Prioritaire sur les autres états |
| Commerce | droits payants / abonnements / expiration | Domaine séparé, non arbitré |

Ne pas introduire un cycle universel « Brouillon → Active → Inactive » pour les Bibliothèques : il a été écarté comme modèle fonctionnel général.

## 4. Critères d'acceptation fonctionnels transverses

1. Affecter un même Mouvement à deux Bibliothèques personnelles ne produit **qu'une fiche source** et deux associations.
2. Retirer cette association de l'une des Bibliothèques n'affecte ni l'autre Bibliothèque ni les Séances.
3. Le destinataire ne peut jamais changer la composition d'une Bibliothèque reçue.
4. L'écran d'une Bibliothèque redistribuée ne révèle aucun élément non redistribuable, même sous forme verrouillée.
5. Une copie d'un Mouvement Protégé reste Protégée ; une copie d'un Mouvement non redistribuable reste non redistribuable.
6. Deux utilisateurs autorisés par le même coach reçoivent les Mouvements de sa Bibliothèque sans droits individuels attribués fiche par fiche.
7. Sans action « Mettre à jour », aucune nouvelle version éditoriale ni composition n'est installée.
8. Une action « Mettre à jour » actualise composition et révisions, préserve les variantes personnelles et garde en local les Mouvements retirés de la composition.
9. Le propriétaire archive une Bibliothèque distribuée ; aucune différence n'apparaît chez ses destinataires.
10. Le propriétaire arrête la diffusion ; les nouveaux destinataires n'installent plus et les destinataires existants ne reçoivent plus de mises à jour.
11. Une révision non approuvée n'est pas distribuée ; une révision approuvée et inchangée n'est pas revalidée pour chaque Bibliothèque.
12. Une suspension de modération bloque l'accès réseau et est prise en compte lors d'un contact ultérieur de l'application, sans attendre une mise à jour éditoriale.
13. Les préférences ou paramètres d'Exercice ne deviennent pas verrouillés du seul fait qu'une fiche Mouvement est Protégée.
14. Hors connexion, l'Exécution des données locales reste disponible sous réserve des restrictions déjà connues.

## 5. À CLARIFIER — ne pas transformer en décisions

- Parcours visuels exacts, navigation, libellés secondaires, emplacement de la pastille et des actions : **Figma reste à concevoir**.
- Politique de conflit pour une fiche source actualisée quand plusieurs Bibliothèques la fournissent, notamment versions différentes.
- Défaut de permission d'une fiche à la création et au partage.
- Conséquences d'un changement ultérieur de permission et d'une révocation de redistribution.
- Droits commerciaux, achats/abonnements/expiration, accès après changement d'appareil.
- Groupes : gouvernance de l'appartenance, invitation, révocation et confidentialité.
- Collision de noms de Mouvements provenant de différentes sources.
- Définition précise du terme « propriétaire » lorsque droits d'auteur et gestion administrative diffèrent.
- Gestion de la première diffusion d'une Bibliothèque dont zéro Mouvement est redistribuable.
- Destinataires d'une Bibliothèque publique après arrêt de diffusion.
- Garantie d'intégrité lorsque le pilote existant emploie plusieurs bases SQLite.

**Statut des parcours :** les comportements explicitement décidés sont consolidés ; les points de conception détaillée ci-dessus attendent une décision ou une revue. La présente description ne constitue ni maquette Figma, ni preuve d'implémentation.

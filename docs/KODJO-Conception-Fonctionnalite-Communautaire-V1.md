# KODJO — Conception Fonctionnalité Communautaire V1

**Statut :** PRÊTE À PLANIFIER  
**Nature :** document autonome de conception

---

# 1. Contexte

KODJO doit intégrer une dimension communautaire simple permettant aux utilisateurs de voir l’activité d’autres utilisateurs, de se motiver, de se comparer, de partager des contenus KODJO et, dans certains cas, d’interagir avec des professionnels comme un kiné ou un coach.

La conception privilégie systématiquement la simplicité, la lisibilité et l’absence de mécanismes sociaux ou de permissions inutilement complexes.

# 2. Intention

Permettre à un utilisateur KODJO de :

- suivre d’autres utilisateurs ;
- créer des relations réciproques de type Ami ;
- appartenir à des espaces relationnels ;
- voir l’activité réalisée par d’autres utilisateurs ;
- réagir et commenter ;
- partager des contenus KODJO ;
- gérer simplement la confidentialité de son historique d’exécution ;
- utiliser les mêmes mécanismes avec des professionnels, sans créer un système distinct.

# 3. Définition de l’évolution

La fonctionnalité communautaire ajoute trois mécanismes relationnels distincts :

1. **Follow** : relation unidirectionnelle ;
2. **Ami** : relation réciproque après invitation et acceptation ;
3. **Espace relationnel** : espace commun volontaire réunissant 2 à n membres.

Le flux communautaire est une vue des exécutions visibles auxquelles l’utilisateur a accès.

# 4. Périmètre

## Inclus

- Follow public ;
- relation Ami ;
- recherche simple par pseudo / identifiant ;
- demandes d’ami ;
- profil public minimal ;
- espaces relationnels ;
- rôles simples Administrateur / Membre ;
- visibilité des exécutions ;
- confidentialité par exception ;
- flux global et flux d’espace ;
- commentaires ;
- réactions ;
- partage de contenus KODJO ;
- récupération sous forme de copie indépendante ;
- blocage d’utilisateur ;
- comparaison et classement comme capacité future alimentée par les données communautaires.

## Hors périmètre / différé

- messagerie privée ;
- signalement et modération avancée ;
- QR codes ;
- liens d’invitation ;
- réglages avancés de découvrabilité ;
- rôles personnalisés complexes ;
- matrice fine de permissions ;
- algorithme de recommandation du flux ;
- publications libres ;
- indicateurs détaillés de comparaison / classement ;
- vérification officielle des professionnels ;
- fonctionnalités de prescription médicale.

# 5. Conception générale

## 5.1 Synthèse en parcours utilisateurs

### Parcours 1 — Suivre quelqu’un

Un utilisateur trouve un autre utilisateur et choisit de le suivre.

Le Follow est unidirectionnel et immédiat si la personne suivie autorise le Follow public.

Le follower peut voir dans son flux les exécutions visibles de la personne suivie, commenter et réagir.

La personne suivie peut désactiver complètement le Follow public. Cela n’affecte ni ses amis, ni sa trouvabilité par pseudo.

### Parcours 2 — Devenir amis

Un utilisateur envoie une demande d’ami.

Le destinataire peut :
- accepter ;
- refuser ;
- laisser la demande en attente.

Après acceptation, la relation Ami est réciproque.

Deux amis peuvent :
- voir leurs flux visibles respectifs ;
- commenter ;
- réagir ;
- se partager directement des contenus KODJO.

Ils n’ont pas besoin de créer un espace relationnel pour un échange ou un partage individuel.

### Parcours 3 — Créer ou rejoindre un espace relationnel

Un utilisateur peut créer ou rejoindre un espace relationnel.

Un espace relationnel peut regrouper 2 personnes ou davantage.

L’accès peut se faire :
- sur invitation ;
- ou sur demande d’adhésion lorsque l’espace l’autorise.

Un espace peut être découvrable, mais son contenu reste privé aux membres.

Les membres voient la liste des autres membres.

Un ou plusieurs administrateurs gèrent :
- les membres ;
- les rôles ;
- les demandes d’adhésion ;
- les droits simples nécessaires.

### Parcours 4 — Voir l’activité des autres

Les exécutions réalisées sont visibles par défaut.

Elles alimentent :
- le flux des amis ;
- le flux des followers si le Follow public est autorisé ;
- les flux des espaces relationnels concernés.

Le flux global agrège les exécutions visibles issues des relations Ami, des Follow et des espaces relationnels.

Le flux est chronologique, du plus récent au plus ancien.

Une même exécution n’apparaît qu’une seule fois dans le flux global.

### Parcours 5 — Garder une exécution privée

Un utilisateur peut rendre privée une exécution.

Le périmètre de confidentialité concerne l’historique d’exécution :
- activité ;
- séance ;
- circuit ;
- programme.

Par défaut, une exécution est visible.

L’utilisateur peut la rendre privée :
- au moment de l’exécution ;
- ou après coup depuis l’historique.

Une exécution privée :
- n’apparaît pas dans les flux ;
- n’est pas visible automatiquement par les amis ;
- n’est pas visible automatiquement par les followers ;
- n’est pas visible automatiquement dans les espaces relationnels.

Elle peut néanmoins être partagée explicitement.

Pour une séance ou un circuit, la confidentialité porte sur l’exécution globale, pas activité par activité.

### Parcours 6 — Partager un contenu KODJO

Un utilisateur peut partager :
- une activité ;
- une séance ;
- un circuit ;
- un programme ;
- un modèle.

Le partage peut être direct avec un Ami ou réalisé dans un espace relationnel.

Le contenu partagé n’est pas ajouté automatiquement à la bibliothèque du destinataire.

Le destinataire doit choisir explicitement de l’ajouter.

Lorsqu’il l’ajoute, il reçoit une copie indépendante.

Les modifications ultérieures de l’auteur n’affectent pas cette copie.

Si l’auteur supprime l’original avant récupération, le contenu devient indisponible.

### Parcours 7 — Relation avec un professionnel

Un professionnel utilise les mêmes mécanismes communautaires qu’un autre utilisateur.

Il peut avoir un rôle déclaré :
- kiné ;
- coach ;
- professeur de yoga ;
- autre rôle pertinent.

Il n’existe pas de système séparé de prescription.

Le professionnel peut créer une séance, un circuit, un programme ou un autre contenu KODJO et le partager avec un utilisateur.

Le destinataire choisit ensuite s’il souhaite l’ajouter à sa bibliothèque.

### Parcours 8 — Quitter une relation ou un espace

Lorsqu’un membre quitte un espace relationnel :
- il perd l’accès futur ;
- ce qu’il a déjà partagé ou commenté reste dans l’historique de l’espace.

Lorsqu’une relation Ami est supprimée :
- la relation s’arrête pour l’avenir ;
- les copies déjà récupérées restent acquises ;
- les commentaires et réactions historiques restent.

### Parcours 9 — Bloquer un utilisateur

Un utilisateur peut en bloquer un autre.

Le blocage coupe les interactions directes :
- Follow ;
- relation Ami ;
- partage direct ;
- accès direct aux flux respectifs.

Si les deux utilisateurs appartiennent au même espace relationnel, le blocage ne modifie pas cet espace.

Ils continuent à voir les contributions de l’autre dans le contexte collectif de cet espace.

## 5.2 Modèle simplifié

```text
Utilisateur
│
├── Follow
│    └── unidirectionnel
│
├── Ami
│    └── réciproque après invitation + acceptation
│
├── Espace relationnel
│    ├── 2..n membres
│    ├── Administrateur / Membre
│    └── droits simples
│
├── Historique d’exécution
│    └── visible par défaut / privé par exception
│
└── Flux
     └── projection chronologique des exécutions visibles
```

# 6. Règles détaillées

## 6.1 Follow

- unidirectionnel ;
- immédiat si le Follow public est autorisé ;
- pas de demande de Follow ;
- peut être désactivé globalement par l’utilisateur suivi ;
- n’affecte pas la relation Ami ;
- donne accès au flux visible, aux commentaires et aux réactions.

## 6.2 Ami

- relation réciproque ;
- invitation + acceptation ;
- peut rester en attente ;
- permet flux visible, commentaires, réactions et partage direct ;
- ne crée pas automatiquement un espace relationnel.

## 6.3 Espace relationnel

- 2 à n membres ;
- créé volontairement ;
- administrateurs multiples possibles ;
- créateur administrateur par défaut ;
- rôles standards : Administrateur / Membre ;
- pas de rôles personnalisés complexes ;
- pas de matrice fine de permissions.

## 6.4 Visibilité

Principe général :

> Visible par défaut, privé par exception.

La confidentialité porte sur l’historique d’exécution.

Le masquage est applicable à une exécution d’activité, séance, circuit ou programme.

Pour une exécution composée, la confidentialité est globale.

## 6.5 Flux

- uniquement les exécutions réalisées et leurs résultats principaux ;
- pas de publication libre ;
- pas de contenus créés simplement parce qu’ils ont été créés ;
- affichage résumé ;
- ouverture possible vers le détail ;
- ordre chronologique ;
- déduplication dans le flux global.

## 6.6 Commentaires et réactions

- disponibles sur les exécutions visibles ;
- un utilisateur peut retirer ses propres commentaires ;
- un utilisateur peut retirer ses propres réactions ;
- un administrateur d’espace ne peut pas supprimer le contenu ou commentaire d’un autre membre.

## 6.7 Partage de contenu

- partage direct entre Amis ;
- partage possible dans un espace relationnel ;
- aucun ajout automatique dans la bibliothèque ;
- récupération explicite ;
- récupération = copie indépendante ;
- suppression de l’original avant récupération = contenu indisponible ;
- suppression de l’original après récupération = aucune conséquence sur la copie.

## 6.8 Blocage

- coupe les relations directes ;
- ne modifie pas automatiquement les espaces relationnels communs ;
- ne supprime pas rétroactivement l’historique.

## 6.9 Découverte

- recherche simple par pseudo / identifiant ;
- profil public minimal ;
- pas de recherche par email ou téléphone ;
- pas de réglages avancés de découvrabilité dans le périmètre initial.

# 7. Cycle de vie et états

## Demande d’ami

- envoyée ;
- en attente ;
- acceptée ;
- refusée.

## Relation Ami

- active ;
- supprimée.

## Follow

- actif ;
- supprimé / désactivé par fin du Follow public.

## Espace relationnel

- actif ;
- membre actif ;
- membre sorti / retiré.

# 8. Temporalité

Le flux est chronologique.

Les exécutions antérieures à l’activation de la fonctionnalité communautaire ne deviennent pas visibles rétroactivement.

Seules les exécutions postérieures à l’activation peuvent alimenter les flux communautaires.

# 9. Interactions avec l’existant

La fonctionnalité communautaire s’appuie sur :
- les utilisateurs ;
- les contenus KODJO existants ;
- l’historique d’exécution ;
- les résultats d’exécution ;
- les bibliothèques personnelles.

Elle ne modifie pas :
- le moteur d’exécution ;
- le principe de planification ;
- la structure fonctionnelle des contenus KODJO.

# 10. Cas limites retenus

- un membre quittant un espace ne supprime pas son historique ;
- supprimer un Ami ne supprime pas les copies déjà récupérées ;
- bloquer quelqu’un ne casse pas un espace commun ;
- supprimer un contenu avant récupération le rend indisponible ;
- un contenu récupéré reste indépendant de l’original.

# 11. Décisions validées

- D01 — Follow unidirectionnel.
- D02 — Ami réciproque après invitation + acceptation.
- D03 — Espace relationnel distinct de la relation Ami.
- D04 — Flux centré sur les exécutions réalisées.
- D05 — Visible par défaut, privé par exception.
- D06 — Confidentialité appliquée à l’historique d’exécution.
- D07 — Partage direct possible entre Amis.
- D08 — Récupération explicite sous forme de copie indépendante.
- D09 — Professionnels utilisant les mêmes mécanismes que les autres utilisateurs.
- D10 — Pas de système de prescription spécifique.
- D11 — Messagerie différée.
- D12 — Signalement différé.
- D13 — Blocage limité aux interactions directes.
- D14 — Rôles simples Administrateur / Membre.
- D15 — Pas de publication libre.
- D16 — Pas de rétro-publication de l’historique ancien.

# 12. Points à clarifier

Aucun point bloquant de conception générale ou détaillée identifié à ce stade.

# 13. Analyse d’impact

| Axe | Statut | Impact / raison | Action future |
|---|---|---|---|
| Fonctionnel | IMPACT FORT | Nouveau domaine communautaire | Planifier en tranches |
| Données | IMPACT FORT | Relations, espaces, interactions, visibilité | Modéliser |
| Processus | IMPACT FORT | Follow, Ami, adhésion, partage | Détailler dans le plan |
| Planification | IMPACT FAIBLE | Pas de changement du moteur | Préserver |
| Exécution | IMPACT MOYEN | Ajout de visibilité communautaire | Brancher après exécution |
| Historique | IMPACT FORT | Source principale du flux | Ajouter visibilité |
| UX / écrans | IMPACT FORT | Nouveaux parcours et écrans | Concevoir Figma |
| API / services | IMPACT FORT | Relations, flux, interactions | Concevoir contrats |
| Architecture | IMPACT MOYEN À FORT | Nouveau domaine social | Isoler proprement |
| Migration | IMPACT MOYEN | Pas de rétro-publication | Préserver historique existant |
| Tests | IMPACT FORT | Confidentialité, blocage, relations | Couverture dédiée |
| Documentation | IMPACT FORT | Multiples docs transverses | Propager lors de l’intégration |

# 14. Compatibilité et préservation de l’existant

À préserver :
- exécution actuelle ;
- planning actuel ;
- historique existant ;
- bibliothèques existantes ;
- contenus existants.

Aucune donnée historique existante ne doit devenir publique automatiquement.

# 15. Éléments différés

- messagerie ;
- signalement ;
- modération avancée ;
- QR code ;
- lien d’invitation ;
- réglages avancés de découvrabilité ;
- rôles personnalisés ;
- permissions fines ;
- algorithme de feed ;
- publications libres ;
- classements et indicateurs détaillés ;
- vérification officielle des professionnels.

# 16. Décisions techniques à instruire ultérieurement

- modèle de persistance des relations ;
- modèle de projection du flux ;
- mécanisme de contrôle d’accès ;
- pagination du flux ;
- stratégie de suppression logique / historique ;
- contrats API ;
- architecture des interactions ;
- stratégie de migration.

# 17. Conclusion de conception

La fonctionnalité communautaire repose sur un modèle volontairement simple :

- Follow pour suivre ;
- Ami pour une relation réciproque ;
- Espace relationnel pour un contexte commun ;
- historique d’exécution visible par défaut ;
- confidentialité par exception ;
- flux chronologique ;
- partage de contenus par copie indépendante ;
- professionnels traités comme des utilisateurs avec rôle déclaré.

Les fonctions sociales avancées sont volontairement différées.

# 18. Statut de sortie

`PRÊTE À PLANIFIER`

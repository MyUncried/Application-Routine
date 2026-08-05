
# Objectif de cette note

Décrire, du point de vue de l’utilisateur, les principales étapes permettant d’atteindre un objectif dans l’application.

Cette note décrit ce que l’utilisateur cherche à faire et l’enchaînement logique des actions, sans définir encore précisément les écrans ni les choix techniques.

# Gestion des référentiels utilisateur

Les référentiels utilisateur regroupent les listes de valeurs personnalisables utilisées dans l'application.

Dans le MVP, deux référentiels sont gérés :

- les catégories de routines ;
- les zones corporelles.

Ces référentiels sont propres à chaque utilisateur et peuvent être enrichis ou adaptés selon ses besoins.

## Gestion des catégories

Les catégories permettent de classer les routines afin d'en faciliter l'organisation et la recherche.

Une routine peut appartenir à une ou plusieurs catégories.

Depuis l'écran **Gestion des catégories**, l'utilisateur peut :

- consulter la liste des catégories ;
- créer une nouvelle catégorie ;
- modifier le nom d'une catégorie ;
- désactiver une catégorie ;
- réactiver une catégorie ;
- supprimer une catégorie lorsqu'elle n'est utilisée par aucune routine.

Une catégorie désactivée n'est plus proposée lors de la création ou de la modification d'une routine, mais reste associée aux routines existantes.

### Parcours principal

1. Ouvrir **Gestion des catégories**.
2. Consulter les catégories existantes.
3. Choisir une action :
    - créer ;
    - modifier ;
    - désactiver ;
    - réactiver ;
    - supprimer.
4. Les modifications sont immédiatement prises en compte dans l'application.

## Gestion des zones corporelles

Les zones corporelles permettent de caractériser les exercices selon les parties du corps principalement sollicitées.

Une activité de type **Exercice** peut être associée à une ou plusieurs zones corporelles.

Depuis l'écran **Gestion des zones corporelles**, l'utilisateur peut :

- consulter la liste des zones existantes ;
- créer une nouvelle zone ;
- modifier son nom ;
- désactiver une zone ;
- réactiver une zone ;
- supprimer une zone lorsqu'elle n'est utilisée par aucune activité.

Une zone désactivée n'est plus proposée lors de la création ou de la modification d'une activité, mais reste associée aux activités existantes.
### Parcours principal

1. Ouvrir **Gestion des zones corporelles**.
2. Consulter les zones existantes.
3. Choisir une action :
    - créer ;
    - modifier ;
    - désactiver ;
    - réactiver ;
    - supprimer.
4. Les modifications sont immédiatement disponibles lors de la création ou de la modification d'une activité.
# Parcours principal — Créer et exécuter une routine personnelle

## Situation de départ

L’utilisateur souhaite organiser une activité composée d’une ou plusieurs étapes : exercices physiques, mobilité, rééducation, préparation sportive, routine quotidienne ou autre activité nécessitant un calendrier, des rappels ou un minuteur.

Il peut partir :

- d’une routine entièrement nouvelle ;
- d’une routine existante à copier ou adapter ;
- d’exercices ou d’étapes déjà enregistrés ;
- de plusieurs routines ou parties de routines à combiner.

## 1. Créer une routine

L’utilisateur :

1. choisit de créer une nouvelle routine ;
2. lui donne un nom ;
3. peut éventuellement lui associer une catégorie, un objectif ou une description ;
4. ajoute un ou plusieurs exercices, étapes ou sous-routines ;
5. organise ces éléments dans l’ordre souhaité ;
6. enregistre la routine.

La création doit rester rapide. L’utilisateur ne doit pas être obligé de renseigner toutes les informations possibles pour pouvoir commencer.

## 2. Définir la structure et les paramètres d’exécution

L’utilisateur construit sa routine à partir d’exercices, d’étapes ou de séquences pouvant être répétés et organisés dans l’ordre souhaité.

#### Pour chaque exercice ou étape

L’utilisateur peut renseigner, selon ses besoins :

- un nom ;
- une consigne ;
- une photo ou une vidéo ;
- une durée prévue ;
- un nombre de répétitions ;
- le matériel éventuellement nécessaire ;
- sa position dans la routine.

Une étape peut également ne comporter aucune durée prédéterminée. Dans ce cas, l’utilisateur indique lui-même lorsqu’elle est terminée et l’application peut enregistrer sa durée réelle.

### Pour une séquence d’exercices

L’utilisateur peut :

- regrouper plusieurs exercices dans une même séquence ;
- définir le nombre de fois que cette séquence doit être répétée ;
- ajouter explicitement une pause dans la séquence si une récupération est souhaitée ;
- organiser plusieurs séquences au sein d’une même routine.

### Pour l’ensemble de la routine

L’utilisateur peut définir :

- un compte à rebours avant le démarrage ;
- un échauffement initial ;
- des pauses ou récupérations placées explicitement dans la structure ;
- un nombre de cycles ;
- des séries éventuelles après le série dans chaque cycle et en fin de routine ;
- des paramètres par défaut applicables aux exercices de la routine.

Les paramètres définis pour l’ensemble de la routine peuvent éventuellement être adaptés pour un exercice ou une séquence particulière.

### Guidage pendant l’exécution

L’utilisateur peut régler séparément :

- les bips de rythme pendant les exercices chronométrés ;
- le compte à rebours sonore de fin d’étape ;
- les annonces vocales ;
- éventuellement les vibrations.

Par défaut, pendant l’exécution :

- une voix annonce le nom de chaque exercice, pause ou récupération au moment où cette étape commence ;
- pendant un exercice chronométré, un bip grave et discret retentit chaque seconde ;
- aucun bip de rythme n’est émis pendant une pause ou une récupération ;
- pendant les trois dernières secondes de toute étape chronométrée, un bip aigu retentit à chaque seconde ;
- pendant un exercice, les bips aigus des trois dernières secondes remplacent les bips graves ;
- à la fin du compte à rebours, l’application passe à l’étape suivante et en annonce le nom.

Ces signaux permettent à l’utilisateur de suivre la séance sans regarder constamment l’écran. Ils doivent rester audibles lorsque le téléphone est posé à distance ou que l’écran est verrouillé.

## 3. Réutiliser ou combiner des contenus existants

Au lieu de tout recréer, l’utilisateur peut :

- rechercher un exercice ou une étape déjà enregistré ;
- réutiliser une partie d’une autre routine ;
- intégrer une routine complète dans la nouvelle routine ;
- modifier l’ordre des éléments ajoutés ;
- adapter le contenu réutilisé à son nouveau besoin.

L’utilisateur doit comprendre si le contenu ajouté est une copie indépendante ou s’il reste lié à son contenu d’origine. **Cette règle reste à définir.**

## 4. Programmer la routine

L’utilisateur peut :

- exécuter immédiatement la routine ;
- la programmer à une date et une heure précises ;
- définir une répétition, par exemple certains jours de la semaine ;
- choisir de recevoir un rappel ;
- modifier ou supprimer une programmation.

Une même routine peut être programmée plusieurs fois sans devoir être recréée.

## 5. Démarrer une séance

Au moment prévu, ou lorsqu’il le souhaite, l’utilisateur ouvre la routine et démarre son exécution.

Avant de commencer, il peut consulter :

- les différentes étapes ;
- la durée estimée, lorsqu’elle peut être calculée ;
- le matériel éventuellement nécessaire ;
- les consignes générales.

Avant le démarrage, l’utilisateur peut vérifier si les bips, les annonces vocales et, le cas échéant, les vibrations sont activés. Il peut modifier ces réglages sans devoir éditer la structure de la routine.

## 6. Être guidé pendant l’exécution

L’application présente les étapes dans l’ordre prévu.

Au début de chaque étape, l’application en annonce le nom. Les signaux sonores accompagnent ensuite l’exécution selon la nature de l’étape : exercice chronométré, pause ou récupération. Les trois dernières secondes indiquent l’imminence de la transition, puis l’étape suivante commence automatiquement.

Pour chaque étape, l’utilisateur peut :

- consulter les instructions, la photo ou la vidéo ;
- lancer ou suivre un minuteur ;
- indiquer les répétitions ou séries réalisées ;
- passer à l’étape suivante ;
- mettre la séance en pause ;
- ignorer une étape ;
- revenir à une étape précédente ;
- arrêter la séance avant la fin.
- activer ou désactiver les bips ;
- activer ou désactiver les annonces vocales.

L’application doit limiter les manipulations nécessaires pendant l’activité.

## 7. Terminer et enregistrer la séance

À la fin, l’application enregistre notamment :

- la routine exécutée ;
- sa version au moment de l’exécution ;
- la date et l’heure ;
- la durée réelle, lorsqu’elle est pertinente ;
- le statut de réalisation : complète, partielle ou abandonnée ;
- les étapes réalisées ou non réalisées.

L’utilisateur peut éventuellement ajouter un commentaire ou signaler une difficulté, sans que cette saisie soit obligatoire.

## 8. Consulter son activité

Après la séance, l’utilisateur peut :

- retrouver cette exécution dans son historique ;
- consulter les prochaines séances programmées ;
- voir les séances réalisées, partielles ou non réalisées ;
- examiner des statistiques simples de fréquence, de régularité et de durée ;
- consulter un tableau de bord synthétique ;
- filtrer les informations par période, routine ou catégorie.

## 9. Faire évoluer la routine

L’utilisateur peut ensuite modifier la routine :

- en ajoutant, supprimant ou réorganisant des étapes ;
- en modifiant les durées ou répétitions des exercices, ainsi que l’ordre des séries, séries et cycles ;
- en remplaçant des consignes ou des médias ;
- en réutilisant de nouveaux contenus.

Les exécutions passées doivent rester rattachées à la version de la routine qui était utilisée à leur date, afin de préserver un historique compréhensible.

## 10. Résultat attendu

L’utilisateur a pu créer, programmer, exécuter et suivre une routine dans une seule application, sans devoir combiner séparément des notes, des vidéos, un calendrier et un minuteur.
# Parcours complémentaire 1 — Créer rapidement une routine à partir de contenus existants

## Situation de départ

L’utilisateur souhaite créer une nouvelle routine sans devoir recréer manuellement les exercices, étapes ou séquences qu’il utilise déjà.
## Parcours

1. L’utilisateur choisit de créer une nouvelle routine.
2. Il lui donne un nom et peut renseigner quelques informations facultatives : catégorie, objectif ou description.
3. Il choisit d’ajouter du contenu existant.
4. Il peut rechercher ou parcourir :
   - ses exercices et étapes déjà enregistrés ;
   - ses routines existantes ;
   - les parties réutilisables de ces routines ;
   - éventuellement, plus tard, des modèles proposés par l’application ou partagés par d’autres utilisateurs.
5. Il sélectionne :
   - un exercice ou une étape ;
   - plusieurs exercices ;
   - un bloc ou une séquence réutilisable ;
   - une partie de routine ;
   - une routine complète ;
   - plusieurs routines ou parties de routines à combiner.
6. Les éléments sélectionnés sont ajoutés à la nouvelle routine.
7. L’utilisateur peut les réorganiser, les supprimer ou les adapter.
8. Il peut compléter la routine avec de nouveaux exercices ou de nouvelles étapes.
9. Il enregistre la routine, puis peut la programmer ou la démarrer immédiatement.
## Points d’attention

- L’ajout de contenus existants doit nécessiter peu de manipulations.
- L’utilisateur doit pouvoir prévisualiser le contenu avant de l’intégrer.
- Il doit être possible de sélectionner seulement certaines étapes d’une routine.
- L’application doit éviter les doublons difficiles à identifier.
- L’utilisateur doit comprendre si le contenu intégré est une copie indépendante ou s’il reste lié à son contenu d’origine.
## Résultat attendu

L’utilisateur a construit rapidement une nouvelle routine en réutilisant et en combinant des contenus existants, sans devoir tout recréer.
# Parcours complémentaire 2 — Gérer les séances programmées

## Situation de départ

L’utilisateur souhaite consulter, ajouter ou modifier les moments auxquels ses routines doivent être réalisées.

## Parcours

1. L’utilisateur ouvre son calendrier ou la liste de ses prochaines séances.
2. Il consulte les routines prévues pour une journée, une semaine ou une période donnée.
3. Il peut sélectionner une séance programmée pour :
   - consulter son contenu ;
   - la démarrer ;
   - modifier sa date ou son heure ;
   - la reporter ;
   - modifier ou désactiver son rappel ;
   - supprimer uniquement cette occurrence ;
   - modifier toute la programmation récurrente.
4. Lorsqu’il programme une routine, il peut définir :
   - une date ;
   - une heure, facultative selon le type de routine ;
   - une fréquence de répétition ;
   - une date de fin ou un nombre d’occurrences ;
   - un ou plusieurs rappels.
5. Il peut également démarrer une routine sans l’avoir programmée.
6. L’application distingue les séances :
   - à venir ;
   - réalisées ;
   - partiellement réalisées ;
   - non réalisées ;
   - reportées ou annulées.

## Points d’attention

- Une modification ponctuelle ne doit pas nécessairement modifier toute la récurrence.
- Une séance non réalisée ne doit pas être considérée automatiquement comme annulée.
- Le calendrier doit rester lisible lorsque plusieurs routines sont programmées le même jour.
- Reporter une séance doit être plus simple que supprimer puis recréer sa programmation.

## Résultat attendu

L’utilisateur sait clairement ce qu’il a prévu, peut adapter facilement son programme et retrouve la différence entre les séances planifiées et celles réellement exécutées.


# Parcours complémentaire 3 — Gérer une séance interrompue ou partiellement réalisée

## Situation de départ

Pendant l’exécution d’une routine, l’utilisateur ne réalise pas toutes les étapes prévues ou doit interrompre sa séance.

## Parcours

1. L’utilisateur démarre une routine.
2. Pendant la séance, il peut :
   - ignorer une étape ;
   - arrêter une étape avant son terme ;
   - effectuer moins de séries ou de répétitions que prévu ;
   - mettre la séance en pause ;
   - revenir à une étape précédente ;
   - interrompre complètement la séance.
3. En cas d’interruption, l’application lui propose, selon la situation :
   - de reprendre immédiatement ;
   - de conserver la séance en pause ;
   - de terminer et enregistrer la séance comme partielle ;
   - d’abandonner la séance.
4. Si la séance est conservée en pause, l’utilisateur peut la reprendre ultérieurement.
5. Lorsqu’il termine ou abandonne la séance, l’application présente un récapitulatif indiquant :
   - les étapes réalisées ;
   - les étapes partiellement réalisées ;
   - les étapes ignorées ou non commencées ;
   - la durée réellement consacrée à la séance.
6. L’utilisateur peut corriger ce récapitulatif et ajouter, s’il le souhaite, un commentaire ou une difficulté rencontrée.
7. La séance est enregistrée avec un statut adapté : complète, partielle ou abandonnée.

## Points d’attention

- Une fermeture accidentelle de l’application ne doit pas faire perdre la séance en cours.
- Les données déjà enregistrées doivent pouvoir être récupérées.
- L’application ne doit pas obliger l’utilisateur à justifier chaque étape non réalisée.
- La différence entre une séance mise en pause, partielle et abandonnée doit rester compréhensible.
- Une reprise très tardive pourrait être considérée comme une nouvelle exécution plutôt que comme la continuation de la séance initiale. **Cette règle reste à préciser.**

## Résultat attendu

L’utilisateur conserve une trace fidèle de ce qu’il a réellement effectué, même lorsque la séance ne correspond pas exactement à ce qui était prévu.


# Parcours prévus pour une phase ultérieure

Les parcours suivants sont pris en compte dans la conception, mais ne sont pas détaillés à ce stade :

- partager une routine avec une personne ou un groupe ;
- rejoindre ou quitter un groupe ;
- administrer une routine partagée ;
- définir les droits de consultation et de modification ;
- partager certaines informations d’exécution ou certaines statistiques ;
- recevoir une routine créée par un professionnel ;
- gérer plusieurs utilisateurs dans une interface professionnelle.

# Parcours spécifique de la V1

## Objectif du parcours

Permettre à une personne utilisant l’application pour la première fois de créer une routine simple, de l’exécuter immédiatement en étant guidée, puis de retrouver la séance dans son historique.

La V1 fonctionne entièrement sur l’appareil, sans création de compte, synchronisation ni intervention d’un professionnel.

## Situation de départ

L’utilisateur souhaite reproduire régulièrement une suite d’exercices ou d’étapes, par exemple une routine donnée oralement par son kinésithérapeute.

Il dispose éventuellement de consignes, de photos ou de vidéos prises pendant la séance.

## 1. Créer une routine

1. L’utilisateur accède à la liste de ses routines.
2. Il choisit de créer une nouvelle routine.
3. Il lui donne un nom.
4. La routine est créée et enregistrée automatiquement.
5. Il accède immédiatement à son parcours vide et commence à le composer.

La V1 ne comporte pas de statut « brouillon ». Une routine vide reste enregistrée, mais elle ne peut pas être lancée tant qu’elle ne contient aucun exercice ou aucune étape.

## 2. Ajouter les exercices et les pauses

Pour chaque exercice ou étape, l’utilisateur peut :

1. créer un nouvel exercice ou sélectionner un exercice déjà créé ;
2. lui donner un nom ;
3. ajouter une consigne ;
4. ajouter une photo ou une vidéo ;
5. choisir son mode d’exécution :
   - pendant une durée définie ;
   - selon un nombre de répétitions ;
   - jusqu’à ce qu’il indique manuellement avoir terminé ;
6. ajouter l’exercice à la routine comme une série élémentaire.

Lorsqu’un exercice existant est réutilisé, une copie indépendante est ajoutée à la routine. Elle peut donc être adaptée sans modifier l’exercice d’origine.

L’utilisateur peut également ajouter une pause entre deux exercices et définir :

- sa durée ;
- une consigne facultative ;
- une fin automatique ou manuelle.

Il peut ensuite :

- modifier un exercice ou une pause ;
- déplacer les éléments pour changer leur ordre ;
- dupliquer un élément ;
- supprimer un élément.

Dans la V1, l’échauffement, les séries de fin de cycle et les séries de fin de routine sont composés des mêmes séries ordinaires que le reste de la routine. `Retour au calme` n’est pas un type particulier.

L’utilisateur définit le nombre de répétitions directement dans les conteneurs `Série × N` et `Cycle × N`. Le série contient une séquence ordonnée de séries. Le cycle contient les répétitions du série, suivies de zéro, une ou plusieurs séries exécutées une fois à la fin de chaque cycle. Des séries placées après le cycle sont exécutées une seule fois en fin de routine.

Le série et le cycle peuvent être repliés ou dépliés. Aucune pause ou récupération n’est ajoutée automatiquement.

La routine peut être exécutée dès qu’elle contient au moins un exercice ou une étape.

## 3. Vérifier et lancer la routine

Avant le lancement, l’utilisateur consulte un résumé comprenant notamment :

- le nom de la routine ;
- la liste ordonnée des exercices et des pauses ;
- les séries et leur emplacement dans le série, le cycle ou la fin de routine ;
- le nombre de répétitions des séries et des cycles ;
- le nombre d’éléments ;
- la durée estimée, lorsqu’elle peut être calculée.

Il choisit ensuite de démarrer immédiatement la routine.

Une séance est créée au moment du lancement. Elle conserve un instantané de la routine telle qu’elle existe à cet instant.

## 4. Exécuter la séance

Pendant la séance, l’application présente successivement les exercices et les pauses dans l’ordre défini.

Pour chaque exercice, l’utilisateur peut consulter :

- son nom ;
- sa consigne ;
- sa photo ou sa vidéo ;
- sa durée ou son nombre de répétitions ;
- la série en cours et la progression dans le série et le cycle ;
- l’élément suivant.

Pour un exercice défini par une durée, une minuterie guide son exécution.

Pour un exercice défini par des répétitions, l’utilisateur indique lorsqu’il a terminé.

Pour un exercice sans mesure prédéterminée, l’utilisateur passe manuellement à l’élément suivant.

Pendant l’exécution, il peut :

- mettre la séance en pause ;
- reprendre la séance ;
- terminer un exercice ;
- ignorer un exercice ;
- passer à l’élément suivant ;
- interrompre la séance ;
- terminer la séance avant la fin prévue.

Les pauses se terminent automatiquement ou manuellement selon leur configuration.

Les séries sont exécutées selon leur position dans le série, le cycle ou la fin de routine. Une pause est facultative et doit être ajoutée explicitement. Lorsque deux exercices s’enchaînent sans pause, l’application en informe l’utilisateur sans bloquer l’enregistrement ni le lancement.

## 5. Terminer la séance

Lorsque tous les éléments ont été parcourus, l’application indique que la séance est terminée.

Elle enregistre localement :

- la routine exécutée ;
- la date et l’heure de la séance ;
- sa durée réelle ;
- son statut ;
- les exercices terminés ;
- les exercices ignorés ;
- les séries, séries et cycles réalisés ;
- les éventuelles interruptions.

Une séance arrêtée avant son terme reste enregistrée comme séance partielle ou interrompue.

L’utilisateur peut ensuite renseigner facultativement :

- son ressenti général sur la séance ;
- une douleur ou une gêne ressentie ;
- une note libre sur la séance.

Ces informations ne sont jamais obligatoires.

## 6. Consulter l’historique

L’utilisateur accède à l’historique de ses séances.

Pour chaque séance, il peut consulter au minimum :

- le nom de la routine ;
- la date de réalisation ;
- la durée réelle ;
- le statut de la séance.

En ouvrant une séance, il peut retrouver :

- les exercices prévus au moment du lancement ;
- les exercices terminés ;
- les exercices ignorés ;
- les éventuelles interruptions.

La séance conserve la version réellement exécutée de la routine. Toute modification ultérieure de la routine reste donc sans effet sur cet historique.

Si elles ont été renseignées, les informations ajoutées en fin de séance sont également consultables :

- le ressenti général ;
- le signalement d’une douleur ou d’une gêne ;
- la note de séance.

## 7. Réutiliser ou modifier la routine

Après la séance, l’utilisateur peut revenir à la routine pour :

- l’exécuter de nouveau ;
- modifier ses consignes ;
- modifier la durée ou les répétitions d’un exercice ;
- modifier ses séries, ses séries et ses cycles, et ajouter, déplacer ou supprimer les pauses et récupérations explicites ;
- ajouter, déplacer ou supprimer des éléments ;
- la dupliquer ;
- la supprimer.

Les modifications apportées s’appliquent uniquement aux prochaines séances. Les séances passées restent inchangées.

## Limites volontaires de ce parcours

Dans la V1, l’utilisateur ne peut pas encore :

- intégrer une routine complète dans une autre ;
- utiliser des structures spécifiques de warm-up et de cooldown ;
- programmer des séances récurrentes ;
- recevoir des notifications ;
- synchroniser ses données entre plusieurs appareils ;
- partager ses données avec un kinésithérapeute ;
- recevoir une routine prescrite par un professionnel.

Ces fonctions sont réparties entre les versions suivantes dans la note `04 – Versions du produit`.

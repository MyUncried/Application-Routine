# Glossaire

Le glossaire définit le vocabulaire officiel du projet KODJO. Les écrans, la documentation, les tests et le code doivent rester rattachables à ces termes et ne doivent pas introduire de concept concurrent.

Une **entité métier** possède une identité propre et peut être représentée dans le modèle de données. Un **concept métier** décrit une règle, un état ou une structure sans correspondre nécessairement à un objet persistant.

## 1. Identité du produit

| Terme | Définition |
| --- | --- |
| **KODJO** | Nom du produit et de l’application mobile. |
| **ANKUSHA** | Société propriétaire, marque mère et éditeur de KODJO. KODJO ne remplace pas la dénomination ANKUSHA. |
| **Keep On. Do Just One.** | Slogan produit affiché notamment sur le splash. |

## 2. Entités métier

| Terme | Définition | Exemple |
| --- | --- | --- |
| **Utilisateur** | Propriétaire local des données. Dans le MVP, un seul Utilisateur local existe, sans compte distant obligatoire. | Utilisateur de l’appareil |
| **Séance** | Modèle de contenu exécutable. Elle possède un nom, une couleur et une Composition comprenant un Compte à rebours initial, des Activités, un Tour unique, un Cycle technique et une Fin de séance. Elle peut être exécutée directement ou planifiée par une Routine. | `Renforcement du genou` |
| **Activité** | Plus petite unité fonctionnelle exécutable définie par l’utilisateur. Une Activité est un Exercice ou une Récupération explicite et appartient à une seule Séance. | 12 squats ; 30 s de récupération |
| **Exercice** | Activité définie par une durée ou un nombre de Répétitions. Elle possède au moins une Série et peut inclure une Pause après Série. | 3 Séries de 12 squats |
| **Récupération** | Activité toujours chronométrée, utilisée pour matérialiser un temps de repos explicite dans la Composition. | Récupération de 30 s |
| **Tour** | Conteneur ordonné d’Activités appartenant à une Séance. Le MVP contient exactement un Tour visible, répété de 1 à 99 fois. | Mobilité → gainage, répété 3 fois |
| **Cycle** | Structure technique unique qui enveloppe les Activités placées avant le Tour, le Tour et les Activités placées après le Tour. Dans le MVP, sa répétition vaut toujours 1, n’est pas modifiable et n’est jamais affichée à l’utilisateur. | Cycle technique × 1 |
| **Routine** | Planification d’une Séance. Elle est unique ou périodique et possède zéro ou un rappel. | Mobilité chaque lundi à 8 h |
| **Occurrence planifiée** | Instance temporelle calculée à partir d’une Routine. Une occurrence future peut être exécutée en avance ; une occurrence passée sans Exécution disparaît de l’interface du MVP. | Séance prévue mardi à 18 h |
| **Exécution** ou **Exécution de séance** | Réalisation effective d’une Séance. Elle est créée au démarrage effectif et repose sur un Instantané de séance. | Exécution démarrée à 18 h 03 |
| **Résultat d’Activité** | Résultat enregistré pour une occurrence d’Activité effectivement atteinte dans le Plan d’Exécution. | Gainage terminé en 30 s |
| **Instantané de séance** | Copie fonctionnelle immuable de la Séance au démarrage d’une Exécution. Il garantit la restitution de l’historique après modification, archivage ou suppression de la Séance source. | Version de `Renforcement du genou` exécutée lundi |
| **Catégorie** | Classement facultatif d’une Séance. Une Séance peut posséder plusieurs Catégories prédéfinies ou personnalisées. | Mobilité |
| **Zone corporelle** | Valeur d’un référentiel prédéfini pouvant être associée à un Exercice. Elle n’est pas applicable à une Récupération. | Genou |
| **Préférences** | Réglages globaux de l’application : Sons, Annonces vocales, Vibration, Compte à rebours initial, Fin de séance et Notifications. | Fin de séance : 5 s |
| **Ressenti** | Évaluation obligatoire sélectionnée sur la Synthèse lorsqu’elle est présentée. | Positif, moyen ou difficile |
| **Commentaire de Synthèse** | Texte facultatif associé à une Exécution, limité à 200 caractères. | `Douleur légère au genou` |

## 3. Concepts de composition

| Terme | Définition |
| --- | --- |
| **Composition** | Structure ordonnée d’une Séance et écran unique permettant de renseigner son nom, sa couleur et ses Activités. |
| **Compte à rebours initial** | Phase structurelle précédant la première Activité. Sa valeur initiale est 10 s ; 0 s la rend instantanée. Ce n’est pas une Activité. |
| **Fin de séance** | Phase structurelle suivant la dernière Activité. Sa valeur initiale est 5 s ; 0 s la rend instantanée. Ce n’est pas une Activité. |
| **Série** | Exécution de la durée ou du nombre de Répétitions d’un Exercice, suivie de sa Pause après Série éventuelle. La Série n’est pas une entité métier autonome. |
| **Répétition** | Unité quantitative d’un Exercice non chronométré. Le pluriel `Répétitions` désigne également ce mode d’Exercice dans l’interface. |
| **Pause après Série** | Durée facultative exécutée après chaque Série. Elle génère une Récupération technique dans le Plan d’Exécution. |
| **Récupération technique** | Étape calculée à partir d’une Pause après Série. Elle apparaît dans le Plan d’Exécution et ses résultats, mais pas comme Activité autonome dans la Composition. |
| **Activité avant le Tour** | Activité exécutée une seule fois avant la première répétition du Tour. |
| **Activité dans le Tour** | Activité exécutée à chaque répétition du Tour. |
| **Activité après le Tour** | Activité exécutée une seule fois après la dernière répétition du Tour et avant la Fin de séance. |
| **Plan d’Exécution** | Liste ordonnée calculée au démarrage après développement des Séries, Récupérations techniques et répétitions du Tour. |

## 4. Concepts de planification

| Terme | Définition |
| --- | --- |
| **Planification unique** | Routine produisant une occurrence à une date et une heure déterminées. Le libellé d’interface utilisé est `Aucune` dans le choix de répétition. |
| **Planification périodique** | Routine produisant des occurrences hebdomadaires selon une fréquence en semaines, des jours sélectionnés et une date de fin incluse. |
| **Rappel** | Notification locale facultative associée à une Routine. Une Routine possède zéro ou un rappel. |
| **Calendrier** | Écran de consultation des occurrences planifiées, disponible en vues Jour, Semaine et Mois dans le MVP. |

## 5. Concepts d’exécution et de suivi

| Terme | Définition |
| --- | --- |
| **Activité suivante** | Commande terminant normalement un Exercice en Répétitions ou demandant confirmation avant d’interrompre une Activité chronométrée non terminée. |
| **Réinitialiser l’activité** | Commande recommençant uniquement l’Activité ou la Série courante sans revenir à une Activité précédente. |
| **Suspendue** | État technique d’une Exécution mise en pause par l’utilisateur ou par une garde de sécurité. |
| **Terminée** | Statut d’une Exécution ou d’une Activité accomplie conformément au Plan d’Exécution. |
| **Partielle** | Statut métier court d’une Exécution ou d’une Activité seulement partiellement réalisée. `Partiellement réalisée` peut être utilisé dans une phrase explicative. |
| **Interrompue** | Statut d’une Exécution arrêtée avant l’achèvement de son Plan. |
| **Non exécutée** | État d’une Activité du Plan jamais atteinte avant la fin ou l’interruption de l’Exécution. |
| **Synthèse** | Écran présenté à la fin ou lors de l’arrêt d’une Exécution, permettant de choisir un Ressenti et d’ajouter un commentaire. |
| **Suivi** | Écran affichant l’historique des Exécutions terminées, partielles ou interrompues. |
| **Nombre d’Activités de la Composition** | Nombre d’Activités définies par l’utilisateur, sans développement des Séries ou Tours et sans Récupérations techniques. |
| **Nombre total d’Activités à exécuter** | Nombre d’occurrences d’Activités du Plan développé, Récupérations techniques incluses, Compte à rebours initial et Fin de séance exclus. |
| **Nombre d’Activités exécutées** | Nombre de Résultats d’Activité enregistrés. Une Activité Partielle compte ; une Activité jamais atteinte ne compte pas. |
| **Durée estimée** | Somme des durées déterminables du Plan. En présence d’un Exercice en Répétitions, elle devient une borne minimale précédée de `≥`. |
| **Durée réelle** | Temps effectivement exécuté, hors Pauses déclenchées par l’utilisateur. |

## 6. Interface et navigation

| Terme | Définition |
| --- | --- |
| **Catalogue des séances** | Écran d’accueil après le splash. Il présente les Séances actives, planifiées ou archivées selon la vue sélectionnée. |
| **Toutes** | Vue du Catalogue affichant les Séances non archivées. |
| **Planifiées** | Vue du Catalogue affichant les Séances possédant au moins une Routine. |
| **Archivées** | Vue du Catalogue dans laquelle une Séance peut être restaurée ou supprimée définitivement après confirmation. |
| **Profil** | Espace relatif à l’identité locale de l’utilisateur et à ses Préférences. |
| **Safe Area** | Zone d’affichage utilisable fournie par le système, hors encoche, barre d’état, indicateur d’accueil et autres éléments système. |

## 7. Termes réservés aux évolutions post-MVP

| Terme | Définition |
| --- | --- |
| **Média** | Photo ou vidéo associable à une Activité dans une version ultérieure, avec une limite prévue d’un média par Activité. Aucun média n’est disponible dans le MVP. |
| **Groupe** | Ensemble d’Utilisateurs partageant une Séance dans une version ultérieure. |
| **Partage** | Mise à disposition d’une Séance ou de données d’Exécution à d’autres Utilisateurs selon des autorisations à définir. |
| **Tableau de bord** | Présentation statistique prévue après le MVP. Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivées dans le MVP. |

## 8. Termes obsolètes ou interdits

| Terme | Règle |
| --- | --- |
| **Set** | Terme remplacé par **Tour**. Il ne doit plus être utilisé dans l’interface, les spécifications actives, le modèle de données, les API ou le code. |
| **Bloc** | Ancienne appellation non retenue pour la structure répétable. |
| **Mes séances** | Ancienne appellation de l’écran désormais nommé **Catalogue des séances**. |
| **Sans répétition** | Ancien libellé du choix de planification unique ; l’interface utilise **Aucune**. |
| **Routine** pour désigner une Séance | Usage incorrect. Une Routine désigne uniquement la planification d’une Séance. |


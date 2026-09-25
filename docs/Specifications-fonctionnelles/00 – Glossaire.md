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
| **Séance** | Modèle de contenu exécutable. Elle possède un nom, une couleur et une Composition comprenant un Compte à rebours initial, des Exercices, un Tour unique, un Cycle technique et une Fin de séance. Elle peut être exécutée directement ou planifiée par une Routine. | `Renforcement du genou` |
| **Activité** | Plus petite unité fonctionnelle définie par l’utilisateur. Elle est exécutée selon une Durée, un nombre de Répétitions ou jusqu’à l’échec et peut porter une Pause entre les Séries ainsi qu’une Récupération après l’ensemble des Séries. Dans le MVP T03, elle existe soit comme `ActivityDefinition` persistante autonome du Catalogue, soit comme `SessionActivity` propre à une Séance ; l’ajout depuis le Catalogue crée une copie indépendante. | 3 Séries de 12 squats, puis 30 s de récupération |
| **Point d’arrêt** | Élément de Composition qui suspend l’enchaînement jusqu’à une reprise explicite, sans écran dédié. Le temps passé au Point d’arrêt n’entre pas dans la durée de la Séance. | |
| **Compte à rebours d’Activité** | Phase optionnelle propre à une Activité, distincte du Compte à rebours initial de la Séance. | |
| **Fin d’activité** | Phase optionnelle propre à une Activité, distincte de la Fin de séance. | |
| **Exercice** | **Exercice (anciennement Activité)** : Synonyme fonctionnel de l’Activité exécutée. `Exercice` n’est plus une valeur d’un type opposé à `Récupération`. | 3 Séries de 12 squats |
| **Récupération** | Durée facultative appartenant à une Activité. Elle est exécutée une fois après tous les côtés d’une Activité autonome, ou une fois par passage de côté lorsque l’Activité appartient à un Tour bilatéral. Elle ne constitue ni une Activité autonome ni une Pause entre les Séries. Une valeur de `0 s` signifie qu’aucune phase de Récupération n’est créée. | Récupération de 30 s après l’Exercice |
| **Tour** | Conteneur ordonné d’Exercices appartenant à une Séance. Le MVP contient exactement un Tour visible, répété de 1 à 99 fois. | Mobilité → gainage, répété 3 fois |
| **Cycle** | Structure technique unique qui enveloppe les Exercices placées avant le Tour, le Tour et les Exercices placées après le Tour. Dans le MVP, sa répétition vaut toujours 1, n’est pas modifiable et n’est jamais affichée à l’utilisateur. | Cycle technique × 1 |
| **Routine** | Planification d’un contenu autonome : une Séance ou un Exercice persistant. Elle est unique ou périodique et possède zéro ou un rappel. | Squats chaque lundi à 8 h |
| **Occurrence planifiée** | Instance temporelle calculée à partir d’une Routine, pour une Séance ou un Exercice. Une occurrence future peut être exécutée en avance ; une occurrence passée sans Exécution disparaît de l’interface du MVP. | Exercice prévu mardi à 18 h |
| **Exécution** ou **Exécution de séance** | Réalisation effective d’un contenu. Une Exécution d’origine `SESSION` repose sur un Instantané de séance ; une Exécution directe d’origine `ACTIVITY` repose sur un Instantané autonome d’Activité. | Exécution démarrée à 18 h 03 |
| **Résultat d’Activité** | Résultat enregistré pour une occurrence d’Activité effectivement atteinte dans le Plan d’Exécution. | Gainage terminé en 30 s |
| **Instantané de séance** | Copie fonctionnelle immuable de la Séance au démarrage d’une Exécution. Il garantit la restitution de l’historique après modification, archivage ou suppression de la Séance source. | Version de `Renforcement du genou` exécutée lundi |
| **Étiquette** | Classement d’une Séance. L’Étiquette porte la couleur affichée de la Séance. | Hyrox |
| **Catégorie** | Classement d’une Activité, distinct de ses Zones corporelles. La Catégorie porte la couleur sémantique affichée pour l’Activité. | Renforcement |
| **Zone corporelle** | Valeur facultative d’un référentiel utilisateur administrable pouvant être associée à une Activité. Le référentiel est initialisé avec des valeurs par défaut et peut être enrichi, renommé ou nettoyé par l’utilisateur. | Genou |
| **Préférences** | Réglages globaux de l’application : Sons, Annonces vocales, Vibration, Compte à rebours initial, Fin de séance et Notifications. | Fin de séance : 5 s |
| **Ressenti** | Évaluation obligatoire sélectionnée sur la Synthèse lorsqu’elle est présentée. | Positif, moyen ou difficile |
| **Commentaire de Synthèse** | Texte facultatif associé à une Exécution, limité à 200 caractères. | `Douleur légère au genou` |

## 3. Concepts de composition

| Terme | Définition |
| --- | --- |
| **Composition** | Structure ordonnée d’une Séance et écran unique permettant de renseigner son nom, sa couleur et ses Exercices. |
| **Compte à rebours initial** | Phase structurelle précédant la première Activité. Sa valeur initiale est 10 s ; 0 s la rend instantanée. Ce n’est pas une Activité et elle n’est pas déplaçable. |
| **Fin de séance** | Phase structurelle chronométrée suivant la dernière Activité. Elle correspond au type d’étape `SESSION_END` du Plan d’Exécution d’une Séance. Sa valeur initiale est 5 s ; 0 s la rend instantanée. Son achèvement termine l’Exécution de Séance. Ce n’est pas une Activité et elle n’est pas déplaçable. |
| **Série** | Exécution d’une Activité selon sa durée cible, ses Répétitions cibles ou jusqu’à l’échec. Pour une Activité bilatérale autonome, le nombre de Séries s’entend par côté. Pour `C` Séries d’un même côté, une Pause éventuelle intervient `C` fois si la Récupération vaut `0`, y compris après la dernière Série, ou `C − 1` fois si la Récupération est positive et remplace alors la dernière Pause. La Série n’est pas une entité métier autonome. |
| **Répétition** | Unité quantitative d’un Exercice non chronométré. Le pluriel `Répétitions` désigne également ce mode d’Exercice dans l’interface. |
| **Pause entre les Séries** | Durée facultative rattachée aux Séries d’un même côté. Pour `C` Séries, elle est exécutée `C` fois lorsque la Récupération vaut `0`, y compris après la dernière Série ; lorsqu’une Récupération positive existe, elle est exécutée `C − 1` fois et la Récupération remplace la dernière Pause. Elle reste distincte de la Récupération. `Pause après Série` peut être conservé comme libellé historique. |
| **Phase de Récupération** | Étape chronométrée calculée lorsque la Récupération de l’Activité est supérieure à `0 s`. Pour une Activité autonome, elle s’exécute une fois après tous les côtés ; dans un Tour bilatéral, elle s’exécute une fois à la fin de chaque passage de côté. Elle n’est pas comptée comme une Activité. |
| **Durée totale de l’Activité** | Durée calculée globale d’une occurrence d’Activité autonome en mode Durée : `D = L × [C × A + P(C,R) × B] + R`, avec `P(C,R) = C` si `R = 0`, sinon `C − 1`, `L = 1` en unilatéral et `L = 2` en bilatéral. Elle n’est pas une seconde donnée canonique indépendante du nombre de Séries. En Répétitions, le texte éditable affiche `Durée totale >= {estimation}` ; cette estimation compte conventionnellement 1 seconde par répétition et y ajoute les Pauses et la Récupération selon les règles existantes. En À l’échec, la Durée totale n’est pas affichée dans le texte éditable. |
| **Activité avant le Tour** | Activité exécutée une seule fois avant la première répétition du Tour. |
| **Activité dans le Tour** | Activité exécutée à chaque répétition du Tour. |
| **Activité après le Tour** | Activité exécutée une seule fois après la dernière répétition du Tour et avant la Fin de séance. |
| **Plan d’Exécution** | Liste ordonnée calculée au démarrage après développement des Séries, Pauses, phases de Récupération et répétitions du Tour. |

### Direction propre et direction héritée

- La **direction propre** est persistée sur l’Activité : `UNILATERAL`, `RIGHT_LEFT` ou `LEFT_RIGHT`.
- La **direction héritée** provient d’un Tour bilatéral. Le Tour porte et affiche seul la direction ; l’Activité conserve un réglage propre `UNILATERAL`, visible mais désactivé, et sa carte comme la synthèse de l’éditeur ne répètent pas la direction héritée.
- Hors Tour bilatéral, une Activité proprement bilatérale affiche `D→G` ou `G→D` dans le petit indicateur de sa carte ; seul le texte de la Synthèse de l’écran Ajouter/Modifier une Activité développe `à droite, puis à gauche` ou `à gauche, puis à droite`.

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
| **Suivant** | Commande terminant normalement la Série courante d’un Exercice en Répétitions ou À l’échec ; pour une Activité chronométrée non terminée, elle demande confirmation avant de passer à l’Activité suivante. |
| **Réinitialiser l’activité** | Commande recommençant uniquement l’Activité ou la Série courante sans revenir à une Activité précédente. |
| **Réinitialiser la récupération** | Commande affichée pendant une phase de Récupération ; elle recommence uniquement cette phase et ne rejoue pas l’Activité terminée. |
| **Suspendue** | État technique d’une Exécution mise en pause par l’utilisateur ou par une garde de sécurité. |
| **Terminée** | Statut d’une Exécution ou d’une Activité accomplie conformément au Plan d’Exécution. |
| **Partielle** | Statut métier court d’une Exécution ou d’une Activité seulement partiellement réalisée. `Partiellement réalisée` peut être utilisé dans une phrase explicative. |
| **Interrompue** | Statut d’une Exécution arrêtée avant l’achèvement de son Plan. |
| **Non exécutée** | État d’une Activité du Plan jamais atteinte avant la fin ou l’interruption de l’Exécution. |
| **Synthèse** | Écran présenté à la fin ou lors de l’arrêt d’une Exécution, permettant de choisir un Ressenti et d’ajouter un commentaire. |
| **Suivi** | Écran affichant l’historique des Exécutions terminées, partielles ou interrompues. |
| **Nombre d’Exercices de la Composition** | Nombre d’Exercices définies par l’utilisateur, sans développement des Séries ou Tours et sans compter leurs phases de Récupération. |
| **Nombre total d’Exercices à exécuter** | Nombre d’occurrences d’Exercices du Plan développé. Les Pauses et phases de Récupération, le Compte à rebours initial et la Fin de séance ne sont pas des Exercices et ne sont pas comptés. |
| **Nombre d’Exercices exécutées** | Nombre de Résultats d’Activité enregistrés. Une Activité Partielle compte ; une Activité jamais atteinte ne compte pas. |
| **Durée estimée d’exécution** | Somme des durées déterminables du Plan d’Exécution complet : Compte à rebours initial, Exercices, Pauses, phases de Récupération et Fin de séance pour une Exécution de Séance. En présence d’une Activité en Répétitions ou À l’échec, elle devient une borne minimale précédée de `≥`. |
| **Durée synthétique des Exercices** | Somme des durées déterminables des occurrences d’Exercices, de leurs Séries, Pauses, Récupérations et répétitions du Tour. Elle exclut toujours le Compte à rebours initial et la Fin de séance. Elle est utilisée dans le Catalogue et dans la synthèse du Tour de la Composition. |
| **Durée réelle** | Temps actif effectivement exécuté, Compte à rebours initial et Fin de séance inclus lorsqu’ils appartiennent au Plan exécuté, hors Pauses déclenchées manuellement par l’utilisateur. |

## 6. Interface et navigation

| Terme | Définition |
| --- | --- |
| **Catalogue des séances** | Écran du Catalogue lorsque le segment `Séances` est sélectionné. Il est le segment par défaut à l’ouverture initiale et après relance complète. |
| **Catalogue des exercices** | Destination MVP livrée en T03 du Catalogue multi-type. Elle liste les Exercices persistantes, permet de les créer, consulter, modifier, archiver/restaurer, sélectionner pour une Séance ou exécuter directement. |
| **Catalogue des parcours** | État du Catalogue associé au segment `Parcours`, visible mais désactivé dans T03. |
| **Catalogues** | Libellé permanent de la destination correspondante dans la navigation basse, indépendamment du segment Catalogue actif. |
| **Toutes** | Valeur du filtre de Catalogue affichant les Séances non archivées. |
| **Planifiées** | Valeur du filtre de Catalogue affichant les Séances possédant au moins une Routine. |
| **Archivées** | Valeur du filtre de Catalogue donnant accès aux éléments archivés et aux actions de restauration ou suppression définitive applicables. |
| **Profil** | Espace relatif à l’identité locale de l’utilisateur et à ses Préférences. |
| **Safe Area** | Zone d’affichage utilisable fournie par le système, hors encoche, barre d’état, indicateur d’accueil et autres éléments système. |

## 7. Termes réservés aux évolutions post-MVP

| Terme | Définition |
| --- | --- |
| **Média** | Photo ou vidéo associable à une Activité dans une version ultérieure. L’architecture prépare `0..n` médias ordonnés par Activité ; aucun média n’est fonctionnel dans le MVP T03. |
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

## 9. Concepts ajoutés — Exercices, Médias et Parcours

| Terme | Définition de référence |
|---|---|
| **Activité de référence** | Activité persistante autonome du Catalogue des exercices dans le MVP T03. Elle est directement exécutable à partir d’un instantané autonome et sert aussi de source à des copies indépendantes, incluant sa Pause et sa Récupération éventuelles. |
| **Activité de Séance** | Copie indépendante d’une Activité, intégrée et ordonnée dans une Séance. Elle est persistée avec la Séance mais n’apparaît jamais comme doublon dans le Catalogue des exercices. |
| **À l’échec** | Troisième mode d’Exercice du MVP, sans durée ni répétitions cibles. Chaque Série se termine par l’action `Suivant`, comme en mode Répétitions. |
| **Contrôle pilote** | Parmi `Séries` et `Durée totale`, contrôle dont la dernière valeur confirmée détermine le calcul de l’autre. Il reçoit un contour `color/selection` renforcé. Le choix n’est pas persisté. |
| **Contrôle calculé** | Contrôle dépendant recalculé depuis le contrôle pilote. Il conserve son apparence standard, reste tactile et peut devenir pilote après validation de sa roulette. |
| **Média** | Photo ou vidéo associée à une Activité. Dans le MVP, le média associé peut être affiché dans la carte déployée du Catalogue ; la gestion multiple et les mécanismes d’acquisition suivent leur périmètre propre. |
| **Parcours** | **Parcours (anciennement Circuit)** : contenu persistant post-MVP composé d’au moins deux étapes ordonnées référençant des Séances. Une même Séance peut apparaître plusieurs fois. |
| **Étape de Parcours** | Occurrence ordonnée d’une Séance dans un Parcours ; elle ne possède pas de nombre de répétitions. |
| **Exécution de Parcours** | Exécution globale d’un Parcours, fondée sur un instantané et liée aux Exécutions de Séance de ses étapes. |

`Toutes`, `Planifiées`, `Non planifiées` et `Archivées` désignent des valeurs du filtre de Catalogue, jamais les segments de sélection du type de contenu.

## 10. Bilatéralité

| Terme | Définition canonique |
|---|---|
| **Changement de côté** | Paramètre d’une Activité parmi `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT`, affiché à l’utilisateur comme `Aucun`, `D→G` ou `G→D`. Dans la version actuelle, aucun réglage de côté n’est exposé au niveau du Tour ; un éventuel champ technique historique du Tour reste fixé à `UNILATERAL`. |
| **Direction effective** | Réglage réellement utilisé par le Plan d’Exécution. Dans la version actuelle, il provient de l’Activité ; le Tour n’expose aucun changement de côté. |
| **Côté courant** | `RIGHT` ou `LEFT` pour le passage en cours. L’interface l’affiche sous le nom de l’Activité par `Côté droit` ou `Côté gauche`. Aucun compteur `1/2` ou `2/2` n’est affiché. |
| **Activité bilatérale autonome** | Activité exécutant toutes ses Séries du premier côté, puis toutes ses Séries du second côté. Aucune Pause n’est ajoutée spécifiquement entre les côtés ; la Récupération intervient une fois après le second côté. |
| **Tour bilatéral** | Capacité technique historique non exposée dans la version actuelle ; le Tour reste fonctionnellement `UNILATERAL`. |

## 11. Concepts d’exécution directe — MVP T03

| Terme | Définition |
|---|---|
| **Origine d’Exécution** | Nature du contenu ayant produit l’Exécution : `SESSION` ou `ACTIVITY`. |
| **Exécution directe d’Activité** | Exécution d’une Activité persistante depuis le Catalogue des exercices, sans création de Séance artificielle. |
| **Préparation directe** | Phase système fixe de `5 s` précédant une Exécution d’origine `ACTIVITY` ; elle n’appartient pas à la définition de l’Activité. |

## 9. Complément D-203 — Exécution média

| Terme | Définition |
| --- | --- |
| **Face Information** | Face par défaut de la carte d’Exécution ; elle porte les informations d’Exécution et peut être retournée vers la Face Média lorsqu’au moins un média existe. |
| **Face Média** | Face alternative de la carte d’Exécution affichant un seul média de l’Exercice à la fois, dans l’ordre de sa galerie. |
| **Cadre flottant d’Exécution** | Cadre superposé au média en plein écran, alimenté par l’état courant du moteur et présentant le contexte et les commandes essentielles d’Exécution. |
| **État média de séance** | État transitoire, limité à la séance d’Exécution courante, comprenant notamment la face et le média courant ; il n’est pas une préférence persistante. |

Ces termes décrivent la conception post-MVP définie dans `../CONCEPTION-EXECUTION-MEDIA.md`.

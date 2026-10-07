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
| **Séance** | Modèle de contenu exécutable. Elle possède un nom, une couleur et une Composition comprenant un Compte à rebours initial, des Exercices organisés avant, dans ou après un Circuit répété en Tours, et une Fin de séance. Elle peut être exécutée directement ou planifiée par une Routine. | `Renforcement du genou` |
| **Exercice** | Plus petite unité fonctionnelle définie par l’utilisateur. Elle est exécutée selon une Durée, un nombre de Répétitions ou jusqu’à l’échec. Elle porte une Pause après chaque série et peut porter une **Pause entre les côtés** lorsqu’elle est bilatérale. Une `ActivityDefinition` ne porte jamais de Récupération après exercice ; cette dernière appartient uniquement à l’occurrence contextualisée dans une Séance/Parcours. Dans le MVP T03, l’Exercice existe soit comme `ActivityDefinition` persistante autonome du Catalogue, soit comme `SessionActivity` propre à une Séance. | 3 Séries de 12 squats |
| **Point d’arrêt** | Élément de Composition qui suspend l’enchaînement jusqu’à une reprise explicite, sans écran dédié. Le temps passé au Point d’arrêt n’entre pas dans la durée de la Séance. | |
| **Compte à rebours d’Exercice** | Phase optionnelle propre à un Exercice, distincte du Compte à rebours initial de la Séance. | |
| **Fin d’exercice** | Phase optionnelle propre à un Exercice, distincte de la Fin de séance. | |
| **Plan d’Exécution** | Liste ordonnée calculée au démarrage après développement des Séries, Pauses, phases `SIDE_RECOVERY`/`POST_ACTIVITY_RECOVERY` applicables et répétitions du Circuit en Tours. | |
| **Pause après chaque série** | Pause Pi attachée à la Série i, y compris la dernière. En occurrence, R>0 remplace uniquement PN terminale ; R=0 la conserve. La fréquence dépend de l’Ordre des côtés (v13 §4). | 15 s après une Série |
| **Pause entre les côtés** | Durée intrinsèque facultative d’un Exercice bilatéral, portée par `sideRecoverySeconds`. Elle n’a de sens qu’avec `D→G` ou `G→D`, s’exécute selon l’Ordre des côtés : une fois entre les blocs ou une fois à l’intérieur de chaque paire, et entre dans la durée intrinsèque de l’Exercice. Avec `Aucun`, elle est sans objet. Sa valeur initiale lors de l’activation bilatérale provient du défaut global **Pause entre les côtés** du Profil (`10 s` dans le Figma de référence) et reste modifiable dans l’éditeur de l’Exercice. | 30 s entre côté droit et côté gauche |
| **Récupération après exercice** | Pause chronométrée ajoutée explicitement à une occurrence, absente par défaut ; jamais sur ActivityDefinition. Attachée à l’occurrence lors des opérations. À 0s : aucune information de récupération ni phase ; trait indépendant D-303. | Récupération30s ajoutée |
| **Phase de récupération** | Phase d’Exécution positive matérialisée soit par `SIDE_RECOVERY`, entre les deux côtés d’un Exercice bilatéral, soit par `POST_ACTIVITY_RECOVERY`, après une occurrence de Séance/Parcours. Elles ont des porteurs et positions distincts et ne sont pas comptées comme des Exercices. | |
| **Durée totale de l’Exercice** | Total intrinsèque calculé suivant v13 §5 : exact en Durée, estimé ≈ avec cadence, borne ≥ sans cadence, omis À l’échec. Inclut les Pauses et PC applicables ; exclut R contextuelle, Compte à rebours et Fin propres. |  |
| **Cycle** | Structure technique unique qui enveloppe les Exercices placés avant le Circuit, le Circuit et les Exercices placés après le Circuit. Dans le MVP, sa répétition vaut toujours 1, n’est pas modifiable et n’est jamais affichée à l’utilisateur. | Cycle technique × 1 |
| **Routine** | Planification d’un contenu autonome. Dans le MVP, la source est une Séance ou un Exercice persistant ; lorsqu’un Parcours devient planifiable, il utilise la même Routine. Elle est unique ou périodique et possède zéro ou un rappel. | Squats chaque lundi à 8 h |
| **Occurrence planifiée** | Instance temporelle calculée à partir d’une Routine, pour une Séance ou un Exercice. Une occurrence future peut être exécutée en avance ; une occurrence passée sans Exécution disparaît de l’interface du MVP. | Exercice prévu mardi à 18 h |
| **Exécution** ou **Exécution de séance** | Réalisation effective d’un contenu. Une Exécution d’origine `SESSION` repose sur un Instantané de séance ; une Exécution directe d’origine `ACTIVITY` repose sur un Instantané autonome d’Exercice. | Exécution démarrée à 18 h 03 |
| **Résultat d’Exercice** | Résultat enregistré pour une occurrence d’Exercice effectivement atteinte dans le Plan d’Exécution. | Gainage terminé en 30 s |
| **Instantané de séance** | Copie fonctionnelle immuable de la Séance au démarrage d’une Exécution. Il garantit la restitution de l’historique après modification, archivage ou suppression de la Séance source. | Version de `Renforcement du genou` exécutée lundi |
| **Étiquette** | Classement d’une Séance. L’Étiquette porte la couleur affichée de la Séance. | Hyrox |
| **Catégorie** | Classement obligatoire d’un Exercice, distinct de ses Zones corporelles. Un Exercice valide possède exactement une Catégorie. La Catégorie porte la couleur sémantique affichée pour l’Exercice. | Renforcement |
| **Zone corporelle** | Valeur d’un référentiel utilisateur administrable. Un Exercice valide en possède une ou plusieurs ; la sélection est multiple. Le référentiel est initialisé avec des valeurs par défaut et peut être enrichi, renommé ou nettoyé par l’utilisateur. | Genou |
| **Préférences** | Réglages globaux de l’application : Sons, Annonces vocales, Vibration, Compte à rebours initial, Fin de séance et Notifications. | Fin de séance : 5 s |
| **Ressenti** | Évaluation obligatoire sélectionnée sur la Synthèse lorsqu’elle est présentée. | Positif, moyen ou difficile |
| **Commentaire de Synthèse** | Texte facultatif associé à une Exécution, limité à 200 caractères. | `Douleur légère au genou` |

## 3. Concepts de composition

| Terme | Définition |
| --- | --- |
| **Composition** | Structure ordonnée d’une Séance et écran permettant de renseigner son nom, sa couleur, ses Exercices et leur position avant, dans ou après le Circuit. |
| **Compte à rebours initial** | Phase structurelle précédant la premier Exercice. Sa valeur initiale est 10 s ; 0 s la rend instantanée. Ce n’est pas un Exercice et elle n’est pas déplaçable. |
| **Fin de séance** | Phase structurelle chronométrée suivant le dernier Exercice. Elle correspond au type d’étape `SESSION_END` du Plan d’Exécution d’une Séance. Sa valeur initiale est 5 s ; 0 s la rend instantanée. Son achèvement termine l’Exécution de Séance. Ce n’est pas un Exercice et elle n’est pas déplaçable. |
| **Circuit** | Groupe ordonné d’Exercices placé dans la Composition d’une Séance et répété en Tours. Les Exercices peuvent aussi être placés avant le Circuit ou après celui-ci. Le Circuit est une structure interne à la Séance, pas un contenu autonome du Catalogue. |
| **Tour** | Une répétition du Circuit. Le nombre de Tours indique combien de fois le groupe ordonné d’Exercices du Circuit est exécuté. Le Tour ne constitue pas une entité métier autonome. Exemple : Mobilité → gainage, répété 3 Tours. |
| **Série** | Définition subordonnée à l’Exercice : cible éventuelle et Pause. N signifie N Séries par côté en bilatéral. Paramètres communs en uniforme, collection ordonnée propre à chaque Série en variable. Pas une entité autonome. |
| **Répétition** | Unité quantitative d’un Exercice en mode Répétitions, avec ou sans cadence ; aucune mesure automatique de sa réalisation physique. Le pluriel `Répétitions` désigne également ce mode d’Exercice dans l’interface. |
| **Exercice avant le Circuit** | Exercice exécuté une seule fois avant la première Tour du Circuit. |
| **Exercice dans le Circuit** | Exercice exécuté à chaque Tour du Circuit. |
| **Exercice après le Circuit** | Exercice exécuté une seule fois après la dernière Tour du Circuit et avant la Fin de séance. |

### Direction propre

- La **direction propre** est persistée sur l’Exercice : `UNILATERAL`, `RIGHT_LEFT` ou `LEFT_RIGHT`.
- Le Circuit et ses Tours ne portent aucun changement de côté. Une bilatéralité éventuelle est définie au niveau de l’Exercice.
- Pour un Exercice bilatéral hors de toute règle de Circuit, un Exercice proprement bilatérale affiche `D→G` ou `G→D` dans le petit indicateur de sa carte ; seul le texte de la Synthèse de l’écran Ajouter/Modifier un Exercice développe `à droite, puis à gauche` ou `à gauche, puis à droite`.

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
| **Suivant** | Commande terminant normalement la Série courante d’un Exercice en Répétitions ou À l’échec ; pour un Exercice chronométrée non terminée, elle demande confirmation avant de passer à l’Exercice suivante. |
| **Réinitialiser l’exercice** | Commande recommençant uniquement l’Exercice ou la Série courante sans revenir à un Exercice précédente. |
| **Réinitialiser la récupération** | Commande affichée pendant une phase de Récupération ; elle recommence uniquement cette phase et ne rejoue pas l’Exercice terminée. |
| **Suspendue** | État technique d’une Exécution mise en pause par l’utilisateur ou par une garde de sécurité. |
| **Terminée** | Statut d’une Exécution ou d’un Exercice accomplie conformément au Plan d’Exécution. |
| **Partielle** | Statut métier court d’une Exécution ou d’un Exercice seulment partiellement réalisée. `Partiellement réalisée` peut être utilisé dans une phrase explicative. |
| **Interrompue** | Statut d’une Exécution arrêtée avant l’achèvement de son Plan. |
| **Non exécutée** | État d’un Exercice du Plan jamais atteinte avant la fin ou l’interruption de l’Exécution. |
| **Synthèse** | Écran présenté à la fin ou lors de l’arrêt d’une Exécution, permettant de choisir un Ressenti et d’ajouter un commentaire. |
| **Suivi** | Écran affichant l’historique des Exécutions terminées, partielles ou interrompues. |
| **Nombre d’Exercices de la Composition** | Nombre d’Exercices définies par l’utilisateur, sans développement des Séries ou Tours et sans compter leurs phases de Récupération. |
| **Nombre total d’Exercices à exécuter** | Nombre d’occurrences d’Exercices du Plan développé. Les Pauses et phases de Récupération, le Compte à rebours initial et la Fin de séance ne sont pas des Exercices et ne sont pas comptés. |
| **Nombre d’Exercices exécutés** | Nombre de Résultats d’Exercice enregistrés. Un Exercice Partielle compte ; un Exercice jamais atteinte ne compte pas. |
| **Durée estimée d’exécution** | Somme des durées déterminables du Plan d’Exécution complet : Compte à rebours initial, Exercices, Pauses, phases de Récupération et Fin de séance pour une Exécution de Séance. Répétitions cadencées : estimation ≈ ; sans cadence : symbole ≥ ; montant soumis à Q-07 ; ≥ prévaut sur ≈. |
| **Durée synthétique des Exercices** | Somme des durées déterminables des occurrences d’Exercices, de leurs Séries, Pauses, Récupérations et Tours du Circuit. Elle exclut toujours le Compte à rebours initial et la Fin de séance. Elle est utilisée dans le Catalogue et dans la synthèse du Circuit de la Composition. |
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
| **Groupe** | Ensemble d’Utilisateurs partageant une Séance dans une version ultérieure. |
| **Partage** | Mise à disposition d’une Séance ou de données d’Exécution à d’autres Utilisateurs selon des autorisations à définir. |
| **Tableau de bord** | Présentation statistique prévue après le MVP. Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivées dans le MVP. |

## 8. Termes obsolètes ou interdits

| Terme | Règle |
| --- | --- |
| **Activité** | Ancien terme UX remplacé par **Exercice** ; les identifiants techniques ActivityDefinition/ACTIVITY restent inchangés. |
| **Set** | Ancien terme de groupe remplacé par **Circuit** ; **Tour** désigne une répétition du Circuit. Il ne doit plus être utilisé dans l’interface, les spécifications actives, le modèle de données, les API ou le code. |
| **Bloc** | Ancienne appellation non retenue pour la structure répétable. |
| **Mes séances** | Ancienne appellation de l’écran désormais nommé **Catalogue des séances**. |
| **Sans répétition** | Ancien libellé du choix de planification unique ; l’interface utilise **Aucune**. |
| **Routine** pour désigner un contenu | Usage incorrect. Une Routine désigne la planification d’une source : Séance ou Exercice persistant dans le MVP, et Parcours lorsque sa planification est livrée. |

## 9. Concepts ajoutés — Exercices, Médias et Parcours

| Terme | Définition de référence |
|---|---|
| **Exercice de référence** | Exercice persistante autonome du Catalogue des exercices dans le MVP T03. Elle est directement exécutable à partir d’un instantané autonome et sert aussi de source à des copies indépendantes, incluant sa Pause et sa Récupération éventuelles. |
| **Exercice de Séance** | Copie indépendante d’un Exercice, intégrée et ordonnée dans une Séance. Elle est persistée avec la Séance mais n’apparaît jamais comme doublon dans le Catalogue des exercices. |
| **À l’échec** | Troisième mode d’Exercice du MVP, sans durée ni répétitions cibles. Chaque Série se termine par l’action `Suivant`, comme en mode Répétitions. |
| **Contrôle pilote** | Parmi `Séries` et `Durée totale`, contrôle dont la dernière valeur confirmée détermine le calcul de l’autre. Il reçoit un contour `color/selection` renforcé. Le choix n’est pas persisté. |
| **Contrôle calculé** | Contrôle dépendant recalculé depuis le contrôle pilote. Il conserve son apparence standard, reste tactile et peut devenir pilote après validation de sa roulette. |
| **Média** | Photo ou vidéo déjà associée à un Exercice, consultable dans le MVP dans les présentations de carte applicables et pendant l’Exécution : galerie ordonnée, vidéo et plein écran (D-203). L’ajout/import dans l’éditeur n’est pas activé par D-203. La vignette de carte et la galerie d’Exécution sont deux présentations distinctes ; Photo retire Déployer selon D-238. |
| **Parcours** | Contenu autonome persistant post-MVP composé d’au moins deux étapes ordonnées référençant des Séances. Une même Séance peut apparaître plusieurs fois. Le Parcours est distinct du Circuit interne à la Composition d’une Séance. |
| **Étape de Parcours** | Occurrence ordonnée d’une Séance dans un Parcours ; elle ne possède pas de nombre de répétitions. |
| **Exécution de Parcours** | Exécution globale d’un Parcours, fondée sur un instantané et liée aux Exécutions de Séance de ses étapes. |

`Toutes`, `Planifiées`, `Non planifiées` et `Archivées` désignent des valeurs du filtre de Catalogue, jamais les segments de sélection du type de contenu.

## 10. Bilatéralité

| Terme | Définition canonique |
|---|---|
| **Changement de côté** | Paramètre d’un Exercice parmi `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT`, affiché à l’utilisateur comme `Aucun`, `D→G` ou `G→D`. Dans la version actuelle, aucun réglage de côté n’est exposé au niveau du Circuit ; un éventuel champ technique historique correspondant reste fixé à `UNILATERAL`. |
| **Direction effective** | Réglage réellement utilisé par le Plan d’Exécution. Dans la version actuelle, il provient de l’Exercice ; le Tour n’expose aucun changement de côté. |
| **Côté courant** | `RIGHT` ou `LEFT` pour le passage en cours. L’interface l’affiche sous le nom de l’Exercice par `Côté droit` ou `Côté gauche`. Aucun compteur `1/2` ou `2/2` n’est affiché. |
| **Exercice bilatérale autonome** | Exercice exécutant toutes ses Séries du premier côté, puis toutes ses Séries du second côté. Aucune Pause n’est ajoutée spécifiquement entre les côtés ; la Récupération intervient une fois après le second côté. |
| **Bilatéralité du Circuit** | Le Circuit et ses Tours n’ont pas de direction ni de réglage de côté. Le changement de côté est porté uniquement par l’Exercice. |

## 11. Concepts d’exécution directe — MVP T03

| Terme | Définition |
|---|---|
| **Origine d’Exécution** | Nature du contenu ayant produit l’Exécution : `SESSION` ou `ACTIVITY`. |
| **Exécution directe d’Exercice** | Exécution d’un Exercice persistante depuis le Catalogue des exercices, sans création de Séance artificielle. |
| **Préparation directe** | Phase système fixe de `5 s` précédant une Exécution d’origine `ACTIVITY` ; elle n’appartient pas à la définition de l’Exercice. |

## 9. Complément D-203 — Exécution média

| Terme | Définition |
| --- | --- |
| **Face Information** | Face par défaut de la carte d’Exécution ; elle porte les informations d’Exécution et peut être retournée vers la Face Média lorsqu’au moins un média existe. |
| **Face Média** | Face alternative de la carte d’Exécution affichant un seul média de l’Exercice à la fois, dans l’ordre de sa galerie. |
| **Cadre flottant d’Exécution** | Cadre superposé au média en plein écran, alimenté par l’état courant du moteur et présentant le contexte et les commandes essentielles d’Exécution. |
| **État média de séance** | État transitoire, limité à la séance d’Exécution courante, comprenant notamment la face et le média courant ; il n’est pas une préférence persistante. |

Ces termes décrivent la consultation média incluse au MVP définie dans `../CONCEPTION-EXECUTION-MEDIA.md`.

## Cartes et iconographie — complément du 30 septembre 2026

Décisions finales du propriétaire : les 17 points du 30/09 sont clos. Révision des cartes du 03/10/2026 (D-260 à D-264) : un seul format de carte d’Exercice, avec une gouttière permanente de 64 px dans le Catalogue et les listes de sélection d’exercices ; photo si média associé, icône de nature sinon. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture (D-264). Les Séances ne portent jamais de visuel. Aucune photo dans les listes mixtes, le Calendrier ou le Suivi. Aucun déploiement d’Exercice ni de carte du Suivi ; le déploiement des Séances reste accessible dans le Catalogue et le Calendrier Semaine. Le Suivi présente deux lignes : nature/titre/statut, puis durée/catégorie/ressenti ; sans heure, zones corporelles ni étiquettes. Le Ressenti y est un indicateur sans action, distinct de sa saisie obligatoire en Synthèse. Les variantes déployées d’Exercice et du Suivi sont historiques, hors MVP. Pauses/récupérations et prochaine planification restent absentes des cartes concernées. Les données, instantanés, calculs et fonctions de planification sont conservés.

Synthèses : « N séries de X », « N séries de N rép. », « N séries à l’échec » ; bilatéralité par miroir dans les variantes concernées. Heure Semaine « 08:00 » ; aucune heure dans la carte du Suivi. Séance sans étiquette : catégories de ses exercices ; listes de catégories/zones séparées par un point médian et tronquées avec « … ». Choix sans badge durée ; récurrence du Calendrier Semaine dans la carte déployée seulement.

RG-10 : le Profil porte une préférence silhouette facultative, homme/femme ; absence = homme affiché. Elle ne pilote que l’icône de zone corporelle, sans filtre, recherche ou effet métier. RG-11 à RG-13 : vignette 64 centrée et recadrée sans déformation (couverture pour une vidéo), place réservée pendant chargement/erreur, texte alternatif égal au nom de l’exercice.

D-239 : Calendrier Jour est une exception compacte (séance 298 × 46, exercice 298 × 48, x=80, hauteur d’instance adaptée à l’événement), avec barre colorée 4, nature 26, titre 13 gras, heure/durée 11, lecture 26 et aucun Déployer. Les deux sets comportent 10 variantes chacun. Suivi — Vue d’ensemble est hors MVP. Les boutons Calendrier Aujourd’hui/Planifier restent à 32, sans cible 44 ajoutée : situation acceptée, à revoir et développer après T04. Les nouvelles icônes sont nommées icon/<nom>, les anciennes ne sont pas renommées ; target est réservé au Programme, pulse aux rapports/Suivi.

Silhouette : préférence de présentation de l’icône de zone corporelle. Carte : représentation d’un objet existant, pas une entité. Classement : catégories/étiquettes/zones, en pastille ; valeurs : nombres/heures/durées, icônes nues.

Référence normative ciblée : [DSF — Cartes, icônes et appuis](../DSF-CARTES-ICONES-APPUIS-2026-09-30.md). Ces règles finales prévalent sur les anciennes formulations d’affichage du présent chapitre dans ce périmètre uniquement.


| Terme complémentaire | Définition |
|---|---|
| **Séries variables** | État explicite : chaque Série a ses propres cible et Pause, avec un mode commun à l’Exercice. |
| **Ordre des côtés** | Un côté après l’autre (défaut) ou Les deux côtés à chaque série. Indépendant de la direction D→G/G→D ; normalisé au premier ordre à N=1. |

## Cadence et métriques — complément du06/10/2026

| Terme | Définition unique |
|---|---|
| Cadence | Durée prescrite facultative d’une répétition, entière1..60s ; propriété de Série, option du mode Répétitions. Aucun comptage physique. |
| Intervalle de cadence | Fenêtre temporelle de Ci secondes ; première répétition commence immédiatement. Une fraction abandonnée par Pause n’est pas acquise pour la progression. |
| Fin nominale | Instant auquel Ri intervalles prescrits ont été acquis ; signal distinct, Série encore active jusqu’à Suivant. Décalée après interruption d’intervalle. |
| Temps actif cumulé | Temps réellement dépensé, incluant fractions abandonnées et tentatives réinitialisées ; distinct du chronomètre de la tentative courante. |
| Incertitude de durée | Déterminable : sans symbole ; approximation :≈ ; composante non estimable :≥ pour les agrégats. Le total d’Exercice À l’échec reste omis. |

Références normatives : Cadence v1 et paramètres v13. Circuit reste la structure interne de Séance, Tour son nombre de passages, Parcours l’objet autonome post-MVP ; aucun ancien arbre de création n’est réintroduit.


## Vocabulaire complémentaire — 07/10

| Terme | Définition |
|---|---|
| Pause de Composition | Regroupe Récupération chronométrée et Point d’arrêt. Distincte de la Pause de Série et de la Pause utilisateur. |
| Rythme | Organisation temporelle du mouvement ; non retenu comme libellé du réglage en secondes par répétition. |
| Fréquence | Occurrences par unité de temps, réciproque de l’intervalle de cadence ; terme technique non retenu dans l’interface. |
| Trait de démarcation | Élément graphique indépendant des informations récupération/point ; conservé hors placement, absent pendant le choix. |

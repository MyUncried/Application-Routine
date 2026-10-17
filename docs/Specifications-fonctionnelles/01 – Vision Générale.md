# Vision et glossaire

## L’idée en une phrase

KODJO est une application mobile qui permet à une personne de créer, organiser, planifier, exécuter et suivre ses séances grâce à un guidage visuel, sonore et vocal.

## Identité du produit

- **KODJO** est le nom du produit et de l’application.
- **ANKUSHA** est la société propriétaire, la marque mère et l’éditeur de KODJO.
- Le slogan produit est **Keep On. Do Just One.**
- Le splash affiche `KODJO`, `Keep On. Do Just One.` et `Votre assistant du quotidien` avant d’ouvrir le `Catalogue des séances`, segment `Séances` du Catalogue.

## Le problème rencontré

Les exercices et séances sont souvent communiqués oralement, sur papier, par message ou en vidéo. Ils sont difficiles à retrouver, à organiser dans un ordre précis, à planifier et à exécuter sans mobiliser plusieurs outils. Pendant un exercice, l’utilisateur ne peut pas toujours regarder son téléphone. Il manque enfin d’une vision simple de ce qu’il a réellement effectué.

## La réponse proposée

KODJO réunit dans une même application :

La classification est dissociée : une **Étiquette** qualifie la Séance et porte sa couleur ; une **Catégorie** qualifie l’Exercice et porte sa couleur. Les Zones corporelles restent une information distincte de l’Exercice.

- un espace `Catalogues` pour les contenus ;
- la création et la modification de Séances structurées ;
- à partir de T03, un Catalogue des exercices persistants et leur Exécution directe ;
- dans PRE-3, l’import/ajout de photos ou vidéos locales ordonnées associées aux Exercices, avant le moteur d’exécution (D-333) ;
- un calendrier et la planification individuelle ;
- une Exécution guidée, adaptée aux Exercices chronométrés, en Répétitions ou À l’échec ;
- des signaux sonores, des annonces vocales et des vibrations fonctionnelles configurables ;
- un Suivi des Exécutions terminées, partielles ou interrompues ;
- des Préférences globales simples.

## Utilisateur prioritaire du MVP

Le MVP s’adresse en priorité à une personne qui crée ses propres Séances et Exercices, planifie directement ses Séances **ou ses Exercices**, les exécute et consulte leur historique sur son appareil.

Il fonctionne :

- sans compte utilisateur obligatoire ;
- sans synchronisation entre appareils ;
- sans partage avec un professionnel ou un groupe ;
- uniquement en français à l’écran.

L’architecture textuelle repose néanmoins sur un lexique centralisé et des clés de traduction, afin de pouvoir modifier un terme partout dans l’application et ajouter ultérieurement d’autres langues sans réécrire les écrans.

## Périmètre fonctionnel du MVP

### Catalogue des séances

Le `Catalogue des séances` est l’état par défaut de l’espace `Catalogues` après le splash et après une relance complète. Il permet d’ouvrir sa carte en modification, de la planifier, de la dupliquer ou de l’archiver. Une Séance active ne peut pas être supprimée directement : elle doit d’abord être archivée. Depuis la liste des Séances archivées, elle peut être restaurée ou supprimée après confirmation.

### Catalogue des exercices — T03

T03 rend le segment `Exercices` fonctionnel. Il permet de créer, consulter, modifier, archiver, restaurer et supprimer définitivement un Exercice persistant, de l’ajouter à une Séance par copie indépendante, de l’exécuter directement **et de la planifier directement** au même titre qu’une Séance. Le segment `Parcours` est absent du Catalogue et des sélecteurs de type de contenu au MVP.

Un Exercice créé uniquement dans une Séance ne rejoint pas automatiquement le Catalogue. Une Exécution directe d’Exercice utilise l’origine `ACTIVITY`, un instantané autonome et une préparation fixe de `5 s`, sans Séance artificielle ni `SESSION_END`.

### Création et composition

La création est réalisée dans un écran unique `Composer une séance`. Une Séance possède obligatoirement un nom et une couleur choisie dans une palette prédéfinie de 12 couleurs. Elle devient validable lorsqu’elle contient au moins un Exercice valide et qu’aucun de ses Exercices ne comporte de cible obligatoire non renseignée (D-380).

Une Séance contient :

1. un Compte à rebours initial ;
2. des Exercices éventuellement placées avant le Circuit ;
3. un Circuit unique, visible et répétable de 1 à 99 Tours ;
4. des Exercices éventuellement placées après le Circuit ;
5. une Fin de séance.

Un Exercice peut également porter son propre Compte à rebours et sa propre Fin d’exercice. La Composition peut contenir un Point d’arrêt déplaçable ; son attente n’est pas comptabilisée dans la durée d’exécution.

Le Cycle est conservé uniquement dans le modèle technique pour l’évolutivité. Dans le MVP, sa répétition vaut toujours 1, n’est pas modifiable et n’est jamais affichée à l’utilisateur.

Un Exercice est une action exécutée en mode Durée ou Répétitions, avec cible chiffrée ou À l’échec par série. Elle comprend au moins une Série et peut inclure une Pause après chaque série. Un Exercice bilatéral peut en outre définir une **Pause entre les côtés**, exécutée selon l’Ordre des côtés. La **Récupération après exercice** n’est pas intrinsèque à l’Exercice : elle appartient à son occurrence lorsqu’elle est placée dans une Séance.

Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel.

Les valeurs initiales de l’application sont de 10 secondes pour le Compte à rebours initial et de 5 secondes pour la Fin de séance. L’utilisateur peut choisir 0 seconde, ce qui rend la phase instantanée sans la supprimer du modèle. Ces deux cartes structurelles ne sont pas déplaçables.

### Planification et calendrier

Une Séance peut être planifiée une seule fois ou périodiquement. Le Calendrier propose les vues Jour, Semaine et Mois dans le MVP. Les rappels sont facultatifs. La demande d’autorisation système des notifications n’est déclenchée que lorsque l’utilisateur active pour la première fois un rappel pendant une planification.

### Exécution guidée

L’Exécution d’une Séance présente l’Exercice en cours, la Série, le Tour, l’Exercice suivant, le temps et la progression. Le Cycle n’est jamais exposé.

L’Exécution continue à progresser lorsque l’application passe en arrière-plan ou que l’écran se verrouille. Au retour, l’état est recalculé à partir d’horodatages de référence. Une pause de sécurité intervient après 30 minutes sans interaction au-delà de la fin théorique d’un Exercice chronométré ou de la fin nominale recalculée d’une Série cadencée, ou après 2 heures sans interaction pour un Exercice en Répétitions sans cadence ou À l’échec.

### Suivi

Le Suivi conserve les Exécutions terminées, partielles et interrompues. Chaque Exécution repose sur un instantané immuable de sa source au démarrage afin que l’historique demeure fidèle après une modification, un archivage ou une suppression de la source.

Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivées dans le MVP ; leurs fonctions sont prévues après le MVP.

### Profil et Préférences

Le Profil MVP permet de gérer une photo et un nom d’affichage. Les Préférences sont : Sons, Annonces vocales, Vibration, Compte à rebours initial, Fin de séance et Notifications.

Les Sons, les Annonces vocales et les Vibrations fonctionnelles sont indépendants. Le feedback haptique léger des roulettes numériques reste systématique dans le MVP et n’est pas piloté par le réglage `Vibration`.

## Ambition après le MVP

KODJO a vocation à devenir un assistant personnel de planification et de suivi pour la rééducation, la mobilité, l’exercice physique, la santé quotidienne et les habitudes personnelles.

Les évolutions envisagées comprennent notamment :

- comptes, synchronisation et sauvegarde distante ;
- partage de Séances et groupes ;
- interface destinée aux professionnels ;
- statistiques, filtres et tableaux de bord ;
- connexions à des calendriers et services de santé ;
- prise en charge de langues supplémentaires.

Ces perspectives orientent l’architecture, mais ne doivent pas être présentées comme des fonctions disponibles dans le MVP.

## Cible fonctionnelle confirmée

### Catalogue multi-type

Le Catalogue constitue l’accès central aux contenus. Il distingue `Exercices` et `Séances`. `Séances` est sélectionné par défaut à l’ouverture initiale et après relance complète ; `Exercices` est fonctionnel à partir de T03 ; `Parcours` est absent du sélecteur. L’ancien objet autonome Parcours est retiré (D-328).

### Catalogue des exercices — MVP T03

La tranche MVP T03 apporte un Catalogue d’Exercices persistants. Le Catalogue des exercices permet de créer, consulter, modifier, archiver/restaurer et exécuter directement un Exercice de référence. Dès T03, depuis la Composition d’une Séance, l’utilisateur peut également sélectionner plusieurs Exercices existants ; chacun est copié dans la Séance et devient indépendante de sa référence.

Un Exercice créé uniquement dans une Séance ne rejoint pas automatiquement le Catalogue. Cette capacité locale reste conservée mais n’est pas exposée dans le parcours courant de composition, qui propose la sélection depuis le Catalogue. Dans le MVP, le média associé est affiché dans la gouttière permanente de la carte d’Exercice du Catalogue, sans déploiement ; cette règle n’ajoute pas implicitement de mécanisme d’import ou de capture (D-260/D-261).

L’Exécution directe réutilise le sous-ensemble moteur autonome avec une origine `ACTIVITY`, commence par une préparation standard de `5 s`, n’ajoute ni Séance artificielle ni phase `SESSION_END`, puis affiche une Synthèse avec Ressenti obligatoire. Le Suivi identifie cette Exécution comme un Exercice et applique les statistiques compatibles sans compter une Séance.

### Parcours — post-MVP

**Ancienne cible autonome retirée le 08/10/2026.** Parcours est désormais le libellé d’un créneau à plusieurs contenus, sans identité, persistance, étapes ou exécution globale propres. Programme est un conteneur distinct ; Circuit reste interne à la Séance. Voir la [spécification de planification du 08/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification), y compris ses points ouverts ; aucune règle manquante ne se déduit des valeurs Figma.

## Vision de la bilatéralité

La configuration permet de choisir `Aucun`, droite puis gauche, ou gauche puis droite sur un Exercice. Dans la version actuelle, le changement de côté n’est pas exposé au niveau du Circuit ; le Circuit n’a pas de bilatéralité fonctionnelle. L’Exécution rend le côté courant explicite sans alourdir la progression, au moyen du sous-titre `Côté droit` ou `Côté gauche` sous le nom de l’Exercice. Les résultats restent distinguables par côté et l’historique demeure fondé sur un instantané immuable.

## Vision cible — médias pendant l’Exécution

Le MVP permet de consulter les médias de l’Exercice sans quitter l’Exécution ni interrompre son moteur. L’utilisateur peut retourner la zone d’information vers une face Média, parcourir une galerie ordonnée, lancer une vidéo à la demande et ouvrir le média en plein écran. Le plein écran conserve un cadre flottant de suivi et de commande de l’Exécution.

Cette consultation est incluse au MVP (D-203, confirmation du 28/09/2026). Voir `../CONCEPTION-EXECUTION-MEDIA.md`.

### Cible de planification commune

Une Routine planifie une liste ordonnée de Séances et/ou Exercices persistants. Les contenus filtrent les occurrences du créneau ; parcours est un libellé sans entité autonome (D-328).

## Concepts de composition

La terminologie cible distingue **parcours** (libellé de planification à plusieurs contenus), **Circuit** (groupe répété interne à une Séance) et **Tour** (une répétition du Circuit). La classification n’influence pas l’Exécution : un Exercice requiert une Catégorie et au moins une Zone corporelle ; l’Étiquette de Séance reste facultative. Les préférences Profil initialisent les nouveaux objets sans rétroactivité. Dans une Séance, les Compte à rebours d’exercice et Fin d’exercice ne sont jamais exécutés ; seuls le Compte à rebours initial et la Fin de séance s’appliquent, une fois, par substitution. Aucun booléen ni contrôle d’activation n’existe à cet effet. Les valeurs propres restent conservées pour l’exécution de l’Exercice seul.

> **Clôture des contrats — 01/10/2026.** Les règles consolidées du [chapitre 13, §6](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#clôture-des-réserves-fonctionnelles-des-contrats) s’appliquent : progression sur le plan complet ; transitions et pauses selon D-248/v13 (ancien repli D-242 retiré) ; fréquence 1..12 semaines ; rappel personnalisé au plus 24 h. En Un côté après l’autre, le reset porte sur le bloc du côté courant ; la même règle s’applique à l’ordre alterné en conservant les résultats de l’autre côté (chapitre13 R-03). Les étapes et calculs ci-dessous se lisent avec ces précisions ; aucune nouvelle disposition d’écran.

### Saisie des paramètres d’exécution

Contenu identique à la section [« Saisie des paramètres d’exécution »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#saisie-des-paramètres-dexécution) : il n’est pas recopié ici.

## Cadence facultative — cible documentaire

Le guidage de cadence pendant l’Exécution appartient au MVP (D-378). Les deux modes peuvent émettre un Bip de cadence, intervalle0..10s,0=Aucun, sans quatrième mode. Chronomètre croissant et signaux guident l’utilisateur ; Suivant conserve la fin normale de Série, même après la fin nominale. KODJO ne détecte pas les mouvements. Pour une cible À l’échec en Répétitions, le relevé facultatif peut être déclaré ; avec bip, une estimation est proposée et conservée tant qu’elle n’est pas explicitement confirmée ou corrigée. Référence : [Règles détaillées](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#resultats-temporels).

## Conception de planification

Choisir une ou plusieurs Séances/Exercices par cases → Ajouter n éléments → Programme facultatif, Début, Répétition, contenus ordonnés si plusieurs, Rappel → Enregistrer. Chaque contenu filtre les occurrences du créneau par son motif x fois sur n. Les modalités ouvertes ne sont pas considérées livrées. Voir la [spécification](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification), les contrats CE-UI-04/05/11 et le [DSF général](../DSF-INTERFACE-GENERALE-2026-10-08.md).

<a id="formats-vision"></a>
## Formats et création rapide

Les six formats proposent des contraintes d’exécution, tandis que les six autres entrées accélèrent la création d’une séance libre. Les six formats et ces départs rapides appartiennent au MVP (D-378). L’utilisateur peut modifier les réglages autorisés du format après composition, sans modifier ses constantes ni changer son identité. Les calculs et synthèses suivent la configuration effective. Les rapports comparatifs, charge additionnelle et tempo restent hors de cette évolution.

<a id="glossaire"></a>
## Glossaire

Le glossaire définit le vocabulaire officiel du projet KODJO. Les écrans, la documentation, les tests et le code doivent rester rattachables à ces termes et ne doivent pas introduire de concept concurrent.

Une **entité métier** possède une identité propre et peut être représentée dans le modèle de données. Un **concept métier** décrit une règle, un état ou une structure sans correspondre nécessairement à un objet persistant.

#### 1. Identité du produit

| Terme | Définition |
| --- | --- |
| **KODJO** | Nom du produit et de l’application mobile. |
| **ANKUSHA** | Société propriétaire, marque mère et éditeur de KODJO. KODJO ne remplace pas la dénomination ANKUSHA. |
| **Keep On. Do Just One.** | Slogan produit affiché notamment sur le splash. |

#### 2. Entités métier

| Terme | Définition | Exemple |
| --- | --- | --- |
| **Utilisateur** | Propriétaire local des données. Dans le MVP, un seul Utilisateur local existe, sans compte distant obligatoire. | Utilisateur de l’appareil |
| **Séance** | Modèle de contenu exécutable. Elle possède un nom, une couleur et une Composition comprenant un Compte à rebours initial, des Exercices organisés avant, dans ou après un Circuit répété en Tours, et une Fin de séance. Elle peut être exécutée directement ou planifiée par une Routine. | `Renforcement du genou` |
| **Exercice** | Plus petite unité fonctionnelle définie par l’utilisateur. Elle est exécutée selon une Durée, un nombre de Répétitions ou jusqu’à l’échec. Elle porte une Pause après chaque série et peut porter une **Pause entre les côtés** lorsqu’elle est bilatérale. Une `ActivityDefinition` ne porte jamais de Récupération après exercice ; cette dernière appartient uniquement à l’occurrence contextualisée dans une Séance. Dans le MVP T03, l’Exercice existe soit comme `ActivityDefinition` persistante autonome du Catalogue, soit comme `SessionActivity` propre à une Séance. | 3 Séries de 12 squats |
| **Point d’arrêt** | Élément de Composition qui suspend l’enchaînement jusqu’à une reprise explicite, sans écran dédié. Le temps passé au Point d’arrêt n’entre pas dans la durée de la Séance. | |
| **Compte à rebours d’Exercice** | Phase optionnelle propre à un Exercice, distincte du Compte à rebours initial de la Séance. | |
| **Fin d’exercice** | Phase optionnelle propre à un Exercice, distincte de la Fin de séance. | |
| **Plan d’Exécution** | Représentation des occurrences effectives issue de l’instantané. Développement fini pour les comptes bornés ; génération progressive pour AMRAP/Death by selon leur borne. Les fenêtres, séries, pauses et récupérations ne sont pas comptées deux fois. | |
| **Pause après chaque série** | Pi configurée et exécutée après chaque Série, dernière comprise, même à N=1. Seule la dernière Pause est remplacée par la récupération positive qui suit l’Exercice. Pause de série et pause de changement de côté se cumulent à leur frontière. | 15s après chaque Série |
| **Pause entre les côtés** | Durée intrinsèque facultative d’un Exercice bilatéral, portée par `sideRecoverySeconds`. Elle n’a de sens qu’avec `D→G` ou `G→D`, s’exécute selon l’Ordre des côtés : une fois entre les blocs ou une fois à l’intérieur de chaque paire, et entre dans la durée intrinsèque de l’Exercice. Avec `Aucun`, elle est sans objet. Sa valeur initiale lors de l’activation bilatérale provient du défaut global **Pause entre les côtés** du Profil (`10 s` dans le Figma de référence) et reste modifiable dans l’éditeur de l’Exercice. | 30 s entre côté droit et côté gauche |
| **Récupération après exercice** | Pause chronométrée ajoutée explicitement à une occurrence, absente par défaut ; jamais sur ActivityDefinition. Attachée à l’occurrence lors des opérations. À 0s : aucune information de récupération ni phase ; trait indépendant D-303. | Récupération30s ajoutée |
| **Phase de récupération** | Phase d’Exécution positive matérialisée soit par `SIDE_RECOVERY`, entre les deux côtés d’un Exercice bilatéral, soit par `POST_ACTIVITY_RECOVERY`, après une occurrence de Séance. Elles ont des porteurs et positions distincts et ne sont pas comptées comme des Exercices. | |
| **Durée totale de l’Exercice** | Total intrinsèque calculé suivant chapitre 08, paramètres d’exercice : exact en Durée, estimé ≈ avec cadence, borne omission sans bip à l’Exercice, omis À l’échec. Inclut les Pauses et PC applicables ; exclut R contextuelle, Compte à rebours et Fin propres. |  |
| **Cycle** | Structure technique unique qui enveloppe les Exercices placés avant le Circuit, le Circuit et les Exercices placés après le Circuit. Dans le MVP, sa répétition vaut toujours 1, n’est pas modifiable et n’est jamais affichée à l’utilisateur. | Cycle technique × 1 |
| **Routine** | Créneau de planification portant une liste ordonnée de Séances et/ou Exercices persistants, une règle de récurrence éventuelle, un rappel facultatif et un Programme facultatif. |
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

#### 3. Concepts de composition

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

##### Direction propre

- La **direction propre** est persistée sur l’Exercice : `UNILATERAL`, `RIGHT_LEFT` ou `LEFT_RIGHT`.
- Le Circuit et ses Tours ne portent aucun changement de côté. Une bilatéralité éventuelle est définie au niveau de l’Exercice.
- Pour un Exercice bilatéral hors de toute règle de Circuit, un Exercice proprement bilatérale affiche `D→G` ou `G→D` dans le petit indicateur de sa carte ; seul le texte de la Synthèse des écrans Créer un exercice / Modifier un exercice développe `à droite, puis à gauche` ou `à gauche, puis à droite`.

#### 4. Concepts de planification

| Terme | Définition |
| --- | --- |
| **Planification unique** | Routine produisant une occurrence à une date et une heure déterminées. Elle correspond à l’interrupteur `Répétition` désactivé ; l’option `Aucune` est supprimée (D-330). |
| **Planification périodique** | Routine produisant des occurrences selon une unité Jour, Semaine ou Mois (D-330), des jours sélectionnés et une date de fin incluse. |
| **Rappel** | Notification locale facultative associée à une Routine. Une Routine possède zéro ou un rappel. |
| **Calendrier** | Écran de consultation des occurrences planifiées, disponible en vues Jour, Semaine et Mois dans le MVP. |

#### 5. Concepts d’exécution et de suivi

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
| **Durée estimée d’exécution** | Somme des durées déterminables du Plan d’Exécution complet : Compte à rebours initial, Exercices, Pauses, phases de Récupération et Fin de séance pour une Exécution de Séance. Exercice : exact en Durée, ≈ en Répétitions avec bip, omitted en Répétitions sans bip et À l’échec. Séance : exact si tout exact, ≈ avec estimation sans inconnu, ≥ avec travail inconnu. Bip v2 gouverne calculs et périmètres. |
| **Durée synthétique des Exercices** | Somme des durées déterminables des occurrences d’Exercices, de leurs Séries, Pauses, Récupérations et Tours du Circuit. Elle exclut toujours le Compte à rebours initial et la Fin de séance. Elle est utilisée dans le Catalogue ; le total affiché sous le titre du Circuit de la Composition concerne exclusivement ce Circuit (D-382). |
| **Durée réelle** | Temps actif effectivement exécuté, Compte à rebours initial et Fin de séance inclus lorsqu’ils appartiennent au Plan exécuté, hors Pauses déclenchées manuellement par l’utilisateur. |

#### 6. Interface et navigation

| Terme | Définition |
| --- | --- |
| **Catalogue des séances** | Écran du Catalogue lorsque le segment `Séances` est sélectionné. Il est le segment par défaut à l’ouverture initiale et après relance complète. |
| **Catalogue des exercices** | Destination MVP livrée en T03 du Catalogue multi-type. Elle liste les Exercices persistantes, permet de les créer, consulter, modifier, archiver/restaurer, sélectionner pour une Séance ou exécuter directement. |
| **Catalogue des parcours** | Ancien concept retiré ; aucun onglet ou segment Parcours. |
| **Catalogues** | Libellé permanent de la destination correspondante dans la navigation basse, indépendamment du segment Catalogue actif. |
| **Toutes** | Valeur du filtre de Catalogue affichant les Séances non archivées. |
| **Planifiées** | Valeur du filtre de Catalogue affichant les Séances possédant au moins une Routine. |
| **Archivées** | Valeur du filtre de Catalogue donnant accès aux éléments archivés et aux actions de restauration ou suppression définitive applicables. |
| **Profil** | Espace relatif à l’identité locale de l’utilisateur et à ses Préférences. |
| **Safe Area** | Zone d’affichage utilisable fournie par le système, hors encoche, barre d’état, indicateur d’accueil et autres éléments système. |

#### 7. Termes réservés aux évolutions post-MVP

| Terme | Définition |
| --- | --- |
| **Groupe** | Ensemble d’Utilisateurs partageant une Séance dans une version ultérieure. |
| **Partage** | Mise à disposition d’une Séance ou de données d’Exécution à d’autres Utilisateurs selon des autorisations à définir. |
| **Tableau de bord** | Présentation statistique prévue après le MVP. Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivées dans le MVP. |

#### 8. Termes obsolètes ou interdits

| Terme | Règle |
| --- | --- |
| **Activité** | Ancien terme UX remplacé par **Exercice** ; les identifiants techniques ActivityDefinition/ACTIVITY restent inchangés. |
| **Set** | Ancien terme de groupe remplacé par **Circuit** ; **Tour** désigne une répétition du Circuit. Il ne doit plus être utilisé dans l’interface, les spécifications actives, le modèle de données, les API ou le code. |
| **Bloc** | Ancienne appellation non retenue pour la structure répétable. |
| **Mes séances** | Ancienne appellation de l’écran désormais nommé **Catalogue des séances**. |
| **Sans répétition** | Ancien libellé du choix de planification unique ; l’interface utilise l’interrupteur `Répétition` désactivé (D-330). |
| **Routine** pour désigner un contenu | Usage incorrect : la Routine est le créneau de planification et sa liste ordonnée de références, pas une Séance ni un Exercice. |

#### 9. Concepts ajoutés — Exercices, Médias et Parcours

| Terme | Définition de référence |
|---|---|
| **Exercice de référence** | Exercice persistante autonome du Catalogue des exercices dans le MVP T03. Elle est directement exécutable à partir d’un instantané autonome et sert aussi de source à des copies indépendantes, incluant sa Pause et sa Récupération éventuelles. |
| **Exercice de Séance** | Copie indépendante d’un Exercice, intégrée et ordonnée dans une Séance. Elle est persistée avec la Séance mais n’apparaît jamais comme doublon dans le Catalogue des exercices. |
| **À l’échec** | Nature de cible d’une Série, disponible dans les modes Durée et Répétitions. Aucun nombre prescrit ; fin par Suivant. Relevé éventuel distinct de la prescription. |
| **Contrôle pilote** | Parmi `Séries` et `Durée totale`, contrôle dont la dernière valeur confirmée détermine le calcul de l’autre. Il reçoit un contour `color/selection` renforcé. Le choix n’est pas persisté. |
| **Contrôle calculé** | Contrôle dépendant recalculé depuis le contrôle pilote. Il conserve son apparence standard, reste tactile et peut devenir pilote après validation de sa roulette. |
| **Média** | Photo ou vidéo déjà associée à un Exercice, consultable dans le MVP dans les présentations de carte applicables et pendant l’Exécution : galerie ordonnée, vidéo et plein écran . L’ajout/import dans l’éditeur n’est pas activé par D-203. La vignette de carte et la galerie d’Exécution sont deux présentations distinctes ; Photo retire Déployer selon D-238. |
| **Parcours** | Libellé du résultat d’une planification à plusieurs contenus liés sur un même créneau ; aucune identité, persistance, fiche ou exécution autonome. |
| **Étape de Parcours** | Ancien concept retiré. Une entrée ordonnée de contenu appartient à la Routine, pas à une entité Parcours. |
| **Exécution de Parcours** | Ancien concept retiré ; aucun nouvel agrégat d’exécution autonome n’est décidé par le libellé parcours. |

`Toutes`, `Planifiées`, `Non planifiées` et `Archivées` désignent des valeurs du filtre de Catalogue, jamais les segments de sélection du type de contenu.

#### 10. Bilatéralité

| Terme | Définition canonique |
|---|---|
| **Changement de côté** | Paramètre d’un Exercice parmi `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT`, affiché à l’utilisateur comme `Aucun`, `D→G` ou `G→D`. Dans la version actuelle, aucun réglage de côté n’est exposé au niveau du Circuit ; un éventuel champ technique historique correspondant reste fixé à `UNILATERAL`. |
| **Direction effective** | Réglage réellement utilisé par le Plan d’Exécution. Dans la version actuelle, il provient de l’Exercice ; le Circuit n’expose aucun changement de côté. |
| **Côté courant** | `RIGHT` ou `LEFT` pour le passage en cours. L’interface l’affiche sous le nom de l’Exercice par `Côté droit` ou `Côté gauche`. Aucun compteur `1/2` ou `2/2` n’est affiché. |
| **Exercice bilatérale autonome** | Exercice exécutant toutes ses Séries du premier côté, puis toutes ses Séries du second côté. Aucune Pause n’est ajoutée spécifiquement entre les côtés ; la Récupération intervient une fois après le second côté. |
| **Bilatéralité du Circuit** | Le Circuit et ses Tours n’ont pas de direction ni de réglage de côté. Le changement de côté est porté uniquement par l’Exercice. |

#### 11. Concepts d’exécution directe — MVP T03

| Terme | Définition |
|---|---|
| **Origine d’Exécution** | Nature du contenu ayant produit l’Exécution : `SESSION` ou `ACTIVITY`. |
| **Exécution directe d’Exercice** | Exécution d’un Exercice persistante depuis le Catalogue des exercices, sans création de Séance artificielle. |
| **Préparation directe** | Phase système fixe de `5 s` précédant une Exécution d’origine `ACTIVITY` ; elle n’appartient pas à la définition de l’Exercice. |

#### 9. Complément D-203 — Exécution média

| Terme | Définition |
| --- | --- |
| **Face Information** | Face par défaut de la carte d’Exécution ; elle porte les informations d’Exécution et peut être retournée vers la Face Média lorsqu’au moins un média existe. |
| **Face Média** | Face alternative de la carte d’Exécution affichant un seul média de l’Exercice à la fois, dans l’ordre de sa galerie. |
| **Cadre flottant d’Exécution** | Cadre superposé au média en plein écran, alimenté par l’état courant du moteur et présentant le contexte et les commandes essentielles d’Exécution. |
| **État média de séance** | État transitoire, limité à la séance d’Exécution courante, comprenant notamment la face et le média courant ; il n’est pas une préférence persistante. |

Ces termes décrivent la consultation média incluse au MVP définie dans `../CONCEPTION-EXECUTION-MEDIA.md`.

#### Cartes et iconographie — complément du 30 septembre 2026

Décisions finales du propriétaire : les 17 points du 30/09 sont clos. Révision des cartes du 03/10/2026 (D-260 à D-264) : un seul format de carte d’Exercice, avec une gouttière permanente de 64 px dans le Catalogue et les listes de sélection d’exercices ; photo si média associé, icône de nature sinon. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture . Les Séances ne portent jamais de visuel. Aucune photo dans les listes mixtes, le Calendrier ou le Suivi. Aucun déploiement d’Exercice ni de carte du Suivi ; le déploiement des Séances reste accessible dans le Catalogue et le Calendrier Semaine. Le Suivi présente deux lignes : nature/titre/statut, puis durée/catégorie/ressenti ; sans heure, zones corporelles ni étiquettes. Le Ressenti y est un indicateur sans action, distinct de sa saisie obligatoire en Synthèse. Les variantes déployées d’Exercice et du Suivi sont historiques, hors MVP. Pauses/récupérations et prochaine planification restent absentes des cartes concernées. Les données, instantanés, calculs et fonctions de planification sont conservés.

Synthèses : « N séries de X », « N séries de N rép. », « N séries à l’échec » ; bilatéralité par miroir dans les variantes concernées. Heure Semaine « 08:00 » ; aucune heure dans la carte du Suivi. Séance sans étiquette : catégories de ses exercices ; listes de catégories/zones séparées par un point médian et tronquées avec « … ». Choix sans badge durée ; récurrence du Calendrier Semaine dans la carte déployée seulement.

RG-10 : le Profil porte une préférence silhouette facultative, homme/femme ; absence = homme affiché. Elle ne pilote que l’icône de zone corporelle, sans filtre, recherche ou effet métier. RG-11 à RG-13 : vignette 64 centrée et recadrée sans déformation (couverture pour une vidéo), place réservée pendant chargement/erreur, texte alternatif égal au nom de l’exercice.

D-239 : Calendrier Jour est une exception compacte (séance 298 × 46, exercice 298 × 48, x=80, hauteur d’instance adaptée à l’événement), avec barre colorée 4, nature 26, titre 13 gras, heure/durée 11, lecture 26 et aucun Déployer. Les deux sets comportent 10 variantes chacun. Suivi — Vue d’ensemble est hors MVP. Les boutons Calendrier Aujourd’hui/Planifier restent à 32, sans cible 44 ajoutée : situation acceptée, à revoir et développer après T04. Les nouvelles icônes sont nommées icon/<nom>, les anciennes ne sont pas renommées ; target est réservé au Programme, pulse aux rapports/Suivi.

Silhouette : préférence de présentation de l’icône de zone corporelle. Carte : représentation d’un objet existant, pas une entité. Classement : catégories/étiquettes/zones, en pastille ; valeurs : nombres/heures/durées, icônes nues.

Référence normative ciblée : [DSF — Cartes, icônes et appuis](../DSF-CARTES-ICONES-APPUIS-2026-09-30.md). Ces règles finales prévalent sur les anciennes formulations d’affichage du présent chapitre dans ce périmètre uniquement.

| Terme complémentaire | Définition |
|---|---|
| **Séries variables** | État explicite : chaque Série a ses propres cible et Pause, avec un mode commun à l’Exercice. |
| **Ordre des côtés** | Un côté après l’autre (défaut) ou Les deux côtés à chaque série. Indépendant de la direction D→G/G→D ; normalisé au premier ordre à N=1. |

#### Cadence et métriques — complément du06/10/2026

| Terme | Définition unique |
|---|---|
| Bip de cadence | Stepper | Trois modes, réglage commun | Non | Aucun (0) | Entier0..10s | Série | ± dans le brouillon ;0 retire le bip | Propagation à toutes les Séries ; conservation au changement de mode |
| Intervalle de cadence | Fenêtre temporelle de Ci secondes ; première répétition commence immédiatement. Une fraction abandonnée par Pause n’est pas acquise pour la progression. |
| Fin nominale | Instant auquel Ri intervalles prescrits ont été acquis ; signal distinct, Série encore active jusqu’à Suivant. Décalée après interruption d’intervalle. |
| Temps actif cumulé | Temps réellement dépensé, incluant fractions abandonnées et tentatives réinitialisées ; distinct du chronomètre de la tentative courante. |
| Incertitude de durée | Déterminable : sans symbole ; approximation :≈ ; composante non estimable :≥ pour les agrégats. Le total d’Exercice À l’échec reste omis. |

Références normatives : Bip v 2 et paramètres v 13. Circuit reste la structure interne de Séance, Tour son nombre de passages, parcours le libellé de plusieurs contenus planifiés ; aucun ancien arbre de création n’est réintroduit.

#### Vocabulaire complémentaire

| Terme | Définition |
|---|---|
| Pause de Composition | Regroupe Récupération chronométrée et Point d’arrêt. Distincte de la Pause de Série et de la Pause utilisateur. |
| Trait de démarcation | Élément graphique indépendant des informations récupération/point ; conservé hors placement, absent pendant le choix. |

| Terme | Définition |
|---|---|
| Bip de cadence | Signal sonore périodique pendant les Séries des deux modes. Intervalle entier0..10s ;0=Aucun. Ne détecte pas les répétitions et ne termine pas la Série. Le nombre d’intervalles logiques peut proposer un relevé estimé en Répétitions à l’échec. |

#### Titres affichés

| Contexte | Titre visible | Contrat |
|---|---|---|
| Création d’Exercice | Créer un exercice | CE-T03-04 |
| Modification d’Exercice | Modifier un exercice | CE-T03-04 |
| Composition d’une nouvelle Séance | Composer une séance | CE-T03-08 |
| Modification d’une Séance | Modifier une séance | CE-T03-08 |

Les noms de frames Figma et annotations restent des références techniques : ils peuvent conserver « Ajouter un exercice » ou « Composition d’une séance ». Ils ne prescrivent pas le titre affiché. Les actions Ajouter gardent leur sens et leur destination définis par le contrat ; aucun arbre de création supplémentaire. « Créer une activité » n’est pas concerné. D-325.

#### Planification — concepts du 08/10/2026

| Terme | Définition |
|---|---|
| **Fréquence de contenu** | Motif x fois sur n occurrences du créneau ; aucune unité de temps. |
| **Programme** | Conteneur réel facultatif avec fenêtre temporelle bornant les dates ; distinct du simple libellé parcours. Parcours de création/rattachement à compléter. |
| **Borne de fin** | Paramètre jusqu’au (date) ou pendant (nombre d’unités) ; conversion encore ouverte. |

Voir la [spécification de planification du 08/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification), y compris ses points ouverts ; aucune règle manquante ne se déduit des valeurs Figma.

#### Circuits — vocabulaire cible du12/10/2026

| Terme | Définition |
|---|---|
| Circuit de tours | Groupe ordonné ; chaque tour exécute toutes les séries de chaque exercice. Nature par défaut et reprise des anciens objets. |
| Circuit de séries | Groupe ordonné ; au passage i, chaque exercice exécute sa série i. N est commun, imposé par le circuit. |
| Passage | Position dans le développement du circuit ; ne constitue pas une nouvelle entité persistante autonome. |
| Régime | Identiques ou variables, explicite et propre à l’exercice ; non déduit de l’égalité des valeurs. |
| Valeur héritée en lecture seule | Valeur réelle déterminée par le contexte, visible sans possibilité d’édition ; différente d’un champ sans effet affichant un tiret. |

<a id="formats-vocabulaire"></a>

#### Formats de séance — vocabulaire normatif

| Terme | Définition |
|---|---|
| Format appliqué | Règles contraignantes : Tabata, Intervalles 30/30, EMOM, AMRAP, For time, Death by. Fixé à la création ; absent pour une séance libre. |
| Origine de création | Modèle de départ conservé pour la provenance ; ne contraint pas les exercices. Renforcement, Gainage · Mobilité, Superset, Progression, À l’échec et Libre restent libres. |
| Réglage du format | Paramètre de séance autorisé à être modifié dans la composition ; distinct des constantes et des valeurs calculées. |
| Organisation des efforts | Par exercice ou en alternance lorsque le format l’autorise ; distinct du mode Durée/Répétitions. |
| Fenêtre cadencée | Intervalle de durée imposée ; la fin du travail ne déclenche pas sa fin. La cadence de fenêtre est distincte du bip périodique d’exercice. |
| Volume par tour | Objectif indexé par tour : For time 21 · 15 · 9 signifie 21 de chaque exercice au premier tour, puis 15, puis 9. |
| Répétitions par série | Objectif indexé par série ; Progression conserve cette unité dans les deux organisations. |
| Tour acquis — Death by | Fenêtre dont l’objectif accompli a été confirmé sur le cadran ; distinct du rang temporel de fenêtre. |
| Incomplet — Death by | État d’achèvement conservé pour limite atteinte comme abandon ; un résultat reste enregistré. Ne pas le transformer en Terminée. |
| Motif de fin | Cause de l’arrêt, distincte du résultat et de l’achèvement. Pour Death by : limite atteinte ou abandon. |

Les libellés des champs ne créent pas d’entités persistantes supplémentaires. Les concepts généraux d’historique ne sont pas redéfinis pour ces formats.

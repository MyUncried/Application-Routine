# PRODUCT — KODJO

## 1. Finalité

KODJO est l’application mobile éditée par ANKUSHA permettant à un utilisateur de créer, exécuter, planifier et suivre des séances personnelles, notamment des exercices physiques, de mobilité ou de rééducation. Sa signature est `Keep On. Do Just One.`

L’application remplace l’usage dispersé de notes, vidéos, alarmes et minuteurs par un parcours unique, simple et guidé.

## 2. Utilisateur prioritaire

Le MVP est conçu pour un utilisateur individuel qui :
- crée ses propres séances ;
- crée et réutilise des Activités persistantes à partir de T03 ;
- les exécute immédiatement ou planifie ses Séances ;
- consulte l’historique détaillé de ses exécutions ;
- utilise l’application sans compte et sans synchronisation cloud.

La kinésithérapie constitue un premier cas d’usage, mais le produit reste généraliste.

## 3. Concepts fonctionnels structurants

### Séance

Une Séance est un contenu exécutable défini par l’utilisateur.

Elle possède notamment :
- un nom ;
- une couleur ;
- zéro ou une Classification ;
- une Composition présentée autour d’un Tour unique ;
- des paramètres de guidage et d’exécution.

### Routine

Une Routine est la planification d’une Séance.

Une même Séance peut être utilisée par plusieurs Routines. Une Routine ne contient pas de copie de la Séance et reprend sa couleur.

Dans le MVP, une Routine possède zéro ou un rappel.

### Activité

Une Activité est une définition d’Exercice. Dans le MVP, elle existe comme copie intégrée à une Séance et, à partir de T03, comme référence persistante autonome dans le Catalogue des activités ; son ajout à une Séance crée une copie indépendante.

Une Activité possède un Compte à rebours d’activité et une Fin d’activité propres, initialisés à la création depuis les valeurs par défaut du Profil puis modifiables dans sa fiche. Elle porte zéro ou une Catégorie et zéro ou plusieurs Zones corporelles. Dans l’éditeur, Catégorie et Zones corporelles sont sélectionnées via deux contrôles directs du bandeau supérieur : `Catégorie` et `Zones corporelles` (chacun précédé de l’icône vectorielle `+`). Après sélection, ces contrôles affichent les valeurs courantes et permettent de rouvrir leur modale pour les modifier ; aucune section repliable Catégorie/Zone corporelle n’est conservée.

Une Activité utilise l’un des trois modes `Durée`, `Répétitions` ou `À l’échec`. Elle porte un réglage de côté parmi `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT`, avec `UNILATERAL` par défaut. Elle peut définir une Pause entre les Séries d’un même côté et une Récupération optionnelle, exécutée une seule fois après tous les côtés de cette Activité. `Récupération` n’est plus un type d’Activité.

Une Activité peut être placée avant le Tour, dans le Tour ou après le Tour et peut être réordonnée entre ces zones.

### Série

Une Série désigne la répétition d’un même Exercice.

Le Nombre de Séries est un paramètre de l’Exercice et ne constitue pas un conteneur structurel de la Séance.

Une Pause entre Séries peut être définie pour une Activité. Pour `C` Séries d’un même côté, elle est comptée `C` fois lorsque la Récupération `R` vaut `0`, y compris après la dernière Série, ou `C − 1` fois lorsque `R > 0`, la Récupération remplaçant alors la dernière Pause. Aucune Pause supplémentaire n’est ajoutée spécifiquement entre les deux côtés. Une Récupération distincte peut être définie ; elle appartient à l’Activité, n’augmente jamais le nombre d’Activités de la Composition et s’exécute une fois après tous les côtés de cette Activité.

Pour une Activité autonome, le nombre de Séries s’entend par côté. En mode Durée, sa Durée totale globale est calculée par `D = L × [C × A + P(C,R) × B] + R`, avec `P(C,R) = C` lorsque `R = 0`, sinon `P(C,R) = C − 1`, avec `L = 1` en unilatéral et `L = 2` en bilatéral, `C` le nombre de Séries par côté, `A` la durée par Série, `B` la Pause et `R` la Récupération. `Séries` et `Durée totale` sont deux entrées dépendantes : la dernière valeur confirmée pilote le calcul, tandis que le nombre entier de Séries reste la donnée canonique persistée.

### Tour et Cycle

Le MVP contient exactement un Tour visible et un Cycle technique.

Le Tour est un groupe ordonné d’Activités exécuté intégralement de 1 à 99 fois. Dans la version actuelle, il ne porte aucun réglage de côté fonctionnel : `tour.sideMode` reste techniquement présent mais figé à `UNILATERAL`. Chaque Activité conserve son propre réglage de côté, y compris lorsqu’elle appartient au Tour.

Le Cycle est conservé dans le modèle pour l’évolutivité, mais son nombre de répétitions vaut toujours `1`, n’est pas modifiable et n’est jamais affiché à l’utilisateur dans le MVP.

### Exécution

Une Exécution est la réalisation effective d’un contenu exécutable d’origine `SESSION` ou `ACTIVITY`.

Chaque Exécution repose au démarrage sur un instantané JSON immuable de sa source : Séance ou Activité persistante. Cet instantané garantit que l’historique reste lisible même si la source est ensuite modifiée ou supprimée.

Pour un plan bilatéral, cet instantané conserve la direction effective et chaque Résultat d’Activité conserve son côté. L’interface affiche uniquement `Côté droit` ou `Côté gauche` sous le nom de l’Activité pendant le passage concerné, sans compteur `1/2` ou `2/2`.

## 4. Périmètre du MVP

### Catalogue des séances

Le MVP permet de :
- créer une Séance avec un nom et une couleur obligatoires ;
- composer et modifier une Séance ;
- associer zéro ou une Classification ;
- afficher dans chaque carte du Catalogue la Classification éventuelle et l’union dédupliquée des Zones corporelles de tous ses Exercices ;
- dupliquer et archiver une Séance active ;
- restaurer ou supprimer une Séance archivée, la suppression exigeant donc un archivage préalable ;
- effectuer une recherche globale sur les formes Catalogue, Planifiée, Exécutée et Archivée d’une Séance ;
- empêcher l’exécution d’une Séance invalide ou vide.

### Catalogue des activités — T03

À partir de T03, le MVP permet de :
- ouvrir le segment `Activités` du Catalogue ;
- créer, consulter et modifier une `ActivityDefinition` persistante ;
- archiver une Activité, accéder aux définitions archivées via `Filtrer > Archivées`, la restaurer et la supprimer définitivement depuis les archives ;
- préserver les copies `SessionActivity` et les Instantanés/Exécutions historiques lorsqu’une définition est supprimée ;
- ajouter une ou plusieurs Activités existantes à une Composition par copie indépendante ;
- exécuter directement une Activité valide depuis son bouton Lecture ;
- préserver recherche, filtres, tri implicite et position de défilement pendant l’aller-retour courant, sans les persister après relance complète ;
- afficher `Trier` comme contrôle commun visible mais désactivé en T03 ; le tri appliqué reste la dernière modification décroissante.

La rangée de commandes Catalogue est commune aux écrans représentés `Séances` et `Activités` : `Créer`, `Filtrer` et `Trier` sont alignés horizontalement ; dans la référence Figma `402 pt`, chacun mesure visuellement `108 × 32 pt`, avec `8 pt` d’espace entre contrôles et un ensemble centré. Cette géométrie est une contrainte de rendu/recette, pas une instruction de coordonnées absolues React Native ; les cibles tactiles restent ≥ `48 × 48 pt`. `Trier` reste visible disabled T03. `Filtrer` est actif là où le comportement est défini.

`Filtrer` et `Trier` sont des contrôles communs aux trois Catalogues. Le contenu complet de leurs options peut dépendre du segment actif et n’est pas encore défini. Pour T03 Activités, seule l’option `Archivées` est fonctionnellement exigée dans `Filtrer`; aucune autre option ne doit être inventée. Les **contrôles d’entrée** sont désormais conçus dans Figma ; seul le détail visuel de leurs **panneaux/options ouverts** reste à définir.

`Créer` est contextuel au Catalogue affiché : il ouvre directement la création de l’objet correspondant, sans écran ni arbre intermédiaire. L’état `Recherche globale — Champ déployé` conserve la rangée `Créer / Filtrer / Trier` dans le Catalogue visible en arrière-plan.

Une Séance est composée exclusivement à partir d’Activités persistantes du Catalogue. Aucune Activité n’est créée comme simple `SessionActivity` à la volée depuis la Composition.

### Référentiels administrables

Les Catégories, Classifications et Zones corporelles sont des référentiels administrables. Une valeur peut être archivée puis réactivée. Une valeur archivée reste attachée aux contenus existants mais n’est plus proposée pour une nouvelle affectation. La suppression d’une valeur utilisée demande confirmation puis retire l’affectation des contenus concernés. Les Instantanés historiques restent immuables. Les Zones corporelles restent multi-sélectionnables sur une Activité.

### Composition d’une Séance

La structure affichée comprend, dans l’ordre :
1. un Compte à rebours initial structurellement présent, éventuellement instantané à `0 s` ;
2. zéro, une ou plusieurs Activités avant le Tour ;
3. un Tour unique contenant zéro, une ou plusieurs Activités et répété de 1 à 99 fois ;
4. zéro, une ou plusieurs Activités après le Tour ;
5. une Fin de séance structurellement présente, d’une durée initiale de `5 s` et pouvant être réglée à `0 s`.

Le Cycle technique unique enveloppe ce plan avec une répétition fixée à `1`.

Une Séance est exécutable lorsqu’elle contient au moins un Exercice valide.

Aucune Récupération n’est ajoutée implicitement entre deux Activités. Une Récupération est exécutée uniquement lorsqu’une durée non nulle est configurée sur l’Activité ; elle intervient une fois après tous les côtés de cette Activité, y compris pour la dernière Activité avant `SESSION_END`.

Dans la version actuelle, la bilatéralité configurable est portée exclusivement par les Activités. Le Tour conserve techniquement un champ `sideMode`, mais le produit courant le fige à `UNILATERAL` et n’expose aucun contrôle permettant de le modifier. La mécanique moteur capable de traiter `RIGHT_LEFT` / `LEFT_RIGHT` au niveau du Tour est conservée comme capacité technique dormante et ne constitue pas un comportement produit actif.

Dans la Composition, une carte d’Activité affiche `D→G` ou `G→D` dans son indicateur secondaire si sa direction propre est bilatérale ; elle n’affiche rien en `UNILATERAL`. Le texte de la carte de Composition ne développe jamais la direction : l’indicateur `D→G` ou `G→D` la porte seul. Dans l’écran Ajouter/Modifier une Activité, la synthèse ajoute `à droite, puis à gauche` ou `à gauche, puis à droite` après la cible du mode et avant la Pause ; elle omet cette clause en unilatéral. Le nom de l’Activité est en gras dans cette Synthèse.

Dans l’éditeur, le contrôle est visible dans les trois modes : `Durée totale` en mode Durée et `Durée totale >=` en Répétitions / À l’échec. Cette forme courte du contrôle ne modifie pas la règle fonctionnelle : la Synthèse reste formulée `Durée totale : ≥ {durée connue}` lorsque la durée complète n’est pas déterminable. Le nom `Renforcement du genou` utilisé dans les maquettes renseignées est une valeur de démonstration Figma et ne constitue jamais un libellé statique ; l’état vide conserve `Nom de l’activité` comme placeholder/état vide.

Le Compte à rebours initial et la Fin de séance sont structurels et non déplaçables : aucun appui long ni aucune poignée de déplacement ne leur est associé.

Une Activité ne possède aucun média fonctionnel dans le MVP. La section Médias est visible et repliable dans l’éditeur ; son contrôle `Déployer / Condenser` et son placeholder média restent désactivés, sans import, capture, lecture ni stockage. Les médias multiples ordonnés restent post-MVP.

### Exécution d’une Séance

Le MVP permet de :
- lancer une Séance depuis le catalogue ou depuis une occurrence du Calendrier ;
- construire le plan d’Exécution à partir de l’instantané ;
- afficher l’Activité en cours, l’Activité suivante, le temps et la progression ;
- afficher les informations de Série et de Tour, sans jamais exposer le Cycle ;
- afficher le côté courant sous le nom de l’Activité lorsque la direction effective est bilatérale ;
- réinitialiser l’Activité courante ;
- mettre la Séance en Pause et la reprendre ;
- passer à l’Activité suivante ;
- arrêter volontairement la Séance uniquement depuis l’état Pause ;
- afficher une Synthèse lorsque le parcours le permet.

Pour une Activité chronométrée passée avant son terme, une confirmation est demandée et le Résultat d’Activité est enregistré `Partielle` si le passage est confirmé.

Pour un Exercice en mode Répétitions ou À l’échec, le bouton `Suivant` termine normalement la Série courante et ne demande pas de confirmation.

Une Activité bilatérale exécute toutes ses Séries du premier côté puis toutes celles du second, y compris lorsqu’elle appartient au Tour. La modale générique de passage anticipé reste inchangée : depuis le premier côté, confirmer conserve le résultat partiel de ce côté et conduit au second. Une réinitialisation ne concerne que le côté courant et préserve le résultat de l’autre côté.

Une Récupération d’Activité est une phase chronométrée. Elle annonce `Récupération`, se termine automatiquement à zéro et peut être quittée avec `Activité suivante` après confirmation. L’Exercice reste alors terminé et la Récupération est enregistrée partiellement. `Réinitialiser la récupération` recommence uniquement cette phase. Un arrêt pendant la Récupération produit une Exécution `Interrompue`.

Un arrêt volontaire confirmé produit une Exécution `Interrompue` et ouvre la Synthèse. Une interruption technique ou système peut produire une Exécution `Interrompue` sans affichage de la Synthèse et donc sans Ressenti.

Aucun retour à l’Activité précédente n’est inclus dans le MVP.

### Exécution directe d’une Activité — T03

Le bouton Lecture d’une carte d’Activité valide lance une Exécution d’origine `ACTIVITY` sans créer de Séance artificielle. L’Exécution repose sur un instantané autonome, commence par une préparation système fixe de `5 s`, applique les règles existantes de Séries, Pauses, directions `UNILATERAL | RIGHT_LEFT | LEFT_RIGHT` et Récupération, puis se clôt sans Tour, Cycle ni phase `SESSION_END`. Le signal de fin ouvre la Synthèse.

Le Ressenti est obligatoire lorsque la Synthèse est présentée ; le Commentaire reste facultatif. L’Exécution rejoint le Suivi général sous le type Activité et alimente les statistiques compatibles sans augmenter le nombre de Séances. T03 ne développe que ce sous-ensemble autonome réutilisable du moteur ; l’orchestration complète de Séance relève de T04.

### Calculs et progression

La Durée estimée est calculée à partir de toutes les durées déterminables du plan d’Exécution développé, passages bilatéraux et Récupérations d’Activité compris.

Aucune durée conventionnelle n’est attribuée aux Exercices en mode Répétitions ou À l’échec. Lorsqu’au moins un tel Exercice existe, la valeur affichée est une borne minimale avec le signe `≥`, par exemple `≥ 18 min`, qui additionne les Pauses et Récupérations connues.

Le temps total écoulé et la Durée réelle excluent les périodes de Pause utilisateur.

Trois indicateurs d’Activités sont distingués :
- Nombre d’Activités de la Composition ;
- Nombre total d’Activités à exécuter ;
- Nombre d’Activités exécutées.

La barre de progression utilise une pondération hybride :
- les Activités chronométrées sont pondérées proportionnellement à leur durée ;
- chaque occurrence d’Exercice en mode Répétitions ou À l’échec reçoit un poids `1/N`, où `N` est le Nombre total d’Activités à exécuter ;
- la part restante est répartie entre les Activités chronométrées proportionnellement à leur durée.

La barre est visuellement continue, sans frontière de segment visible.

La progression globale tient compte de tous les passages développés. `Activité X/Y` conserve néanmoins le rang logique de l’Activité et ne change pas entre ses deux côtés.

### Guidage

Le guidage comprend :
- l’annonce vocale du nom de l’Activité au démarrage ;
- l’annonce du côté au début du premier passage et une seule fois lors du passage au second côté ;
- les sons prévus pendant les Activités chronométrées, dont le bip grave de rythme ;
- le signal des trois dernières secondes ;
- un réglage global des sons dans le MVP ;
- un réglage séparé des annonces vocales ;
- les vibrations fonctionnelles de séance selon les préférences définies ;
- un feedback haptique léger et systématique à chaque changement effectif de valeur d’une roulette numérique, indépendant du réglage `Vibrations`.

La désactivation spécifique du bip grave est reportée à une version ultérieure.

En arrière-plan ou écran verrouillé, le Plan d’Exécution continue selon ses horodatages de référence et l’état est recalculé au retour. Une pause de sécurité intervient 30 minutes après la fin théorique d’une Activité chronométrée sans interaction, ou après 2 heures sans interaction pour un Exercice en Répétitions ou À l’échec. Les mécanismes natifs restent soumis aux validations techniques prévues dans l’architecture.

### Planification et Calendrier

La planification est incluse dans le MVP.

Le MVP permet de :
- créer une Routine depuis le Calendrier ;
- sélectionner la Séance associée ;
- définir une Date de début et une Heure ;
- choisir entre `Aucune` et `Périodique` ;
- pour `Périodique`, définir une fréquence en semaines, sélectionner un ou plusieurs jours et définir une Date de fin obligatoire ;
- configurer zéro ou un rappel ;
- modifier ou supprimer une Routine ;
- consulter les occurrences dans les vues Jour, Semaine et Mois.

Pour une Routine périodique, la semaine contenant la Date de début est la semaine d’ancrage. Les Date de début et Date de fin sont inclusives.

Une Routine ne possède pas d’état actif/inactif dans le MVP : elle existe ou est supprimée.

Les occurrences futures sont calculées dynamiquement. Pour une planification périodique, la suppression propose `Cette occurrence` ou `Cette occurrence et les suivantes` ; les Exécutions historiques sont conservées.

### Suivi et historique

Chaque Exécution conserve notamment :
- l’origine `SESSION` ou `ACTIVITY` et l’instantané immuable correspondant ;
- la date et l’heure ;
- la Durée réelle ;
- le statut ;
- les Résultats d’Activités exécutées ;
- le côté de chaque Résultat lorsque l’Activité est effectivement bilatérale ;
- le Ressenti obligatoire lorsque la Synthèse est présentée ;
- un Commentaire facultatif limité à 200 caractères.

Les statuts d’Exécution sont : Terminée, Partielle, Interrompue.

Une Activité `Partielle` compte comme exécutée dans le Nombre d’Activités exécutées. Une Activité jamais atteinte ne compte pas.

Le Suivi du MVP comprend une liste chronologique du plus récent au plus ancien, une vue condensée ou déployée et le détail d’Exécution directement dans la carte déployée.

Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` du Suivi restent visibles mais désactivées. Cette règle du Suivi est distincte de D-184 pour les Catalogues : dans le Catalogue des activités, `Filtrer` est fonctionnel pour `Archivées`.

### Profil et préférences

Les Préférences globales définissent notamment les valeurs par défaut du Compte à rebours initial et de la Fin de séance, ainsi que les valeurs par défaut du Compte à rebours d’activité et de la Fin d’activité pour toute nouvelle Activité. Elles définissent également les sons, les annonces vocales, les vibrations fonctionnelles de séance et l’activation des notifications.

Les valeurs initiales sont `10 s` pour le Compte à rebours initial, `5 s` pour la Fin de séance et `activée` pour Vibration. Le réglage `Vibration` ne pilote pas le feedback haptique des roulettes numériques, qui reste systématique.

Les notifications ne sont pas autorisées par défaut. La demande d’autorisation système est déclenchée dans le contexte de la première activation d’un rappel pendant une planification. En cas de refus, le rappel reste désactivé.

Elles ne modifient jamais rétroactivement une Séance existante ni une Exécution passée.

## 5. Navigation principale

Le MVP comporte quatre destinations principales :
- `Catalogues` ;
- `Calendrier` ;
- `Suivi` ;
- `Profil`.

`Catalogues` est le libellé permanent de navigation. Dans cet espace, les titres contextuels sont `Catalogue des séances`, `Catalogue des activités` et `Catalogue des circuits`. Le Catalogue s’ouvre et se réinitialise après relance complète sur le segment `Séances`.

Le composant DSF canonique de navigation est `Navigation / Bottom — Source exact` (`2537:214`). Les dessins des quatre destinations ont une dimension maximale de `24 pt`, sont centrés dans leur boîte optique `32 × 32 pt` et conservent une cible tactile conforme aux règles communes.

## 6. Hors périmètre du MVP

- compte utilisateur distant ;
- synchronisation cloud ou multi-appareils ;
- partage de Séances ;
- relation avec un professionnel ;
- groupes et communautés ;
- tableaux de bord analytiques avancés ;
- filtres avancés du Suivi ;
- signalement détaillé de douleur ou de gêne ;
- intelligence artificielle ;
- Séances imbriquées ;
- structures comportant plusieurs Tours ou plusieurs Cycles ;
- modification individuelle d’une occurrence de Calendrier ;
- Circuits fonctionnels ;
- médias multiples fonctionnels ;
- options avancées de filtre/tri Catalogue non encore arbitrées.

## 7. Principes métier structurants

1. Une Séance est un contenu exécutable ; dans le MVP T03, une Activité persistante l’est également ; une Routine planifie une Séance.
2. Une Séance et ses Routines sont indépendantes.
3. Chaque Exécution conserve son origine et un instantané immuable du contenu utilisé.
4. Une modification ou une suppression ultérieure ne change jamais une Exécution passée.
5. La suppression d’une Routine ne supprime jamais l’historique.
6. La suppression d’une Séance supprime ses Routines mais conserve les Exécutions passées.
7. La suppression définitive d’une `ActivityDefinition` n’altère ni les copies de Séance ni les Instantanés/Exécutions historiques.
8. Une Activité porte zéro ou une Catégorie ; une Séance porte zéro ou une Classification.
9. Les zones corporelles qualifient les Activités ; elles restent facultatives.
10. La couleur appartient à la Séance et est reprise par ses Routines.
11. Le plan d’Exécution est calculé au démarrage et n’est pas manipulé directement par l’utilisateur.
12. Le Compte à rebours initial et la Fin de séance sont structurellement présents ; `0 s` signifie phase instantanée.
13. Les occurrences du Calendrier sont calculées dynamiquement.
14. Toutes les données du MVP sont stockées localement sur l’appareil.
15. Les règles de calcul fonctionnelles sont déterministes et centralisées dans les spécifications.
16. Une direction bilatérale n’est appliquée qu’à un seul niveau : celle du Tour prévaut, sinon celle de l’Activité.
17. Les Résultats bilatéraux sont séparés par côté ; un seul côté partiellement réalisé rend l’Activité globale partielle.

## 8. Écrans de référence

Les principaux écrans du MVP sont :
- Profil ;
- Catalogue des séances ;
- Catalogue des activités ;
- création contextuelle directe depuis le Catalogue ;
- sélection multiple d’Activités existantes ;
- création du nom et de la couleur d’une Séance ;
- Composition d’une Séance ;
- création ou modification d’une Activité ;
- options d’une Activité ;
- Classification de la Séance dans une modale de sélection/validation ouverte depuis la Composition ;
- Calendrier semaine et mois ;
- planification d’une Séance ;
- Exécution d’une Séance ;
- Exécution directe d’une Activité ;
- modales d’interruption ;
- Synthèse ;
- Suivi.

Les maquettes Figma validées définissent la présentation de référence. La spécification UI déterministe combine les Screen Shells et composants communs décrits au chapitre 12 avec les règles fonctionnelles du chapitre 06 et les contrats d’écran du chapitre 13. Une règle métier propre à un écran ne devient pas une règle générique du Design System.

Les contrôles d’entrée `Créer / Filtrer / Trier` des Catalogues sont conçus et vérifiables dans Figma. Seul le détail visuel des panneaux/options ouverts `Filtrer` et `Trier` n’est pas encore conçu ; il reste `NON VÉRIFIABLE` / `À CLARIFIER` jusqu’à création des frames correspondantes. Ce manque ne permet pas d’inventer un composant visuel local.

## 9. Contraintes techniques initiales

- base de code unique React Native / Expo ;
- TypeScript ;
- Expo Router ;
- compatibilité iOS et Android ;
- fonctionnement en mode portrait ;
- adaptation aux différentes tailles d’écran de smartphone ;
- respect des Safe Areas système et navigation basse intégrant l’inset inférieur ;
- largeur minimale cible de `360` points logiques, contrôles à `360`, `390`, `402` et `430–440` points, avec contenu centré au-delà de `440` points ;
- utilisation exclusive d’unités logiques et de contraintes Flexbox, sans coordonnées absolues copiées du gabarit Figma `402 × 874` ;
- design tokens canoniques pour les couleurs, typographies, espacements, rayons, dimensions partagées et tailles visuelles d’icônes ;
- cibles tactiles communes minimales de `48 × 48` points logiques sur iOS et Android, indépendamment de la taille visuelle du pictogramme ou du contrôle ;
- gestion du clavier, du défilement, des textes agrandis et des modales conformément au contrat adaptatif des chapitres 06 et 12 ;
- accessibilité prise en compte dès le MVP ;
- stockage local avec SQLite et couche d’accès typée aux données ;
- données métier et historique conservés localement ;
- notifications locales planifiées selon une fenêtre glissante conformément à l’architecture ;
- support web utile au développement sans complexifier le MVP mobile.

Les choix d’implémentation détaillés et les spikes techniques sont définis dans le chapitre 12 — Architecture technique.

## 10. Évolutions prévues

Les versions futures pourront notamment introduire :
- synchronisation et comptes ;
- partage et relation avec des professionnels ;
- tableaux de bord et analyses comparatives ;
- filtres avancés et critères de tri supplémentaires dans le Suivi ;
- critères supplémentaires de filtre et options utilisateur de tri dans les Catalogues après arbitrage fonctionnel/visuel ;
- signalement détaillé de douleur ou de gêne ;
- structures de Séances plus complexes ;
- réglages sonores plus fins ;
- association de `0..n` photos ou vidéos ordonnées par Activité ;
- activation de `Déployer` sur les cartes du Catalogue des activités avec le lot Médias ;
- Circuits persistants composés d’au moins deux Séances ordonnées et exécutables manuellement ; leur planification est reportée en V3 ;
- planification périodique étendue, notamment mensuelle ;
- intelligence artificielle d’aide à la création, à l’adaptation et à l’analyse des Séances.

## 11. Activités, Catalogue et Circuits

### Catalogue multi-type

Le Catalogue conserve un seul espace mais distingue `Activités`, `Séances` et `Circuits`. `Séances` est le segment sélectionné par défaut ; `Activités` devient fonctionnel en T03 ; `Circuits` reste visible mais désactivé. Une fermeture/reprise complète ne mémorise pas le dernier segment et revient à `Séances`.

`Créer`, `Filtrer` et `Trier` constituent la rangée commune de commandes d’entrée. Dans la maquette de référence `402 pt`, chacun est dessiné en `108 × 32 pt`, les gaps sont de `8 pt` et l’ensemble est centré. `Filtrer` et `Trier` sont communs aux trois contextes de Catalogue ; le contenu des options peut dépendre du segment actif. Pour T03 / Activités, `Filtrer` est fonctionnel au minimum pour `Archivées`, `Trier` est visible mais désactivé, et le tri appliqué reste la dernière modification décroissante. Toute autre option est hors contrat tant qu’elle n’est pas arbitrée.

### Activités persistantes — MVP T03

Une Activité de Catalogue est une référence persistante `ActivityDefinition`. L’utilisateur peut la créer, la consulter, la modifier, l’archiver, accéder aux archives par `Filtrer > Archivées`, la restaurer, la supprimer définitivement depuis les archives, l’exécuter directement ou la sélectionner depuis une Composition.

Son insertion dans une Séance copie les propriétés métier applicables au moment de l’insertion — nom, Description, mode/cible, Séries, Pause, Récupération, Catégorie éventuelle, Zones corporelles, direction propre et autres champs applicables — **à l’exception du Compte à rebours d’activité et de la Fin d’activité**. La `SessionActivity` appartient ensuite à la Séance et évolue indépendamment. La migration T03 ne transforme pas les `SessionActivity` historiques en `ActivityDefinition`.

Dans les Catalogues, `Créer` ouvre directement la création de l’objet correspondant au Catalogue courant : Activité persistante depuis `Activités`, Séance depuis `Séances`, et Circuit depuis `Circuits` lorsque ce Catalogue devient fonctionnel. Aucun écran ni arbre intermédiaire n’est affiché. Cette règle n’active pas les Circuits dans T03/MVP. Depuis `Ajouter une activité` dans une Composition, la modale de sélection des Activités du Catalogue s’ouvre directement. Si l’Activité recherchée n’existe pas, `Créer une activité` ouvre sa création ; après enregistrement elle est ajoutée directement à la Séance puis le parcours revient à la Composition. La sélection multiple insère les Activités selon leur ordre visible dans la liste filtrée au moment de la validation, indépendamment de l’ordre des touchers.

Les cartes du Catalogue des activités portent une barre verticale bleue. La surface principale ouvre la consultation/modification. Le bouton Lecture lance exclusivement l’Exécution directe. Le contrôle `Déployer` reste **visible mais fonctionnellement désactivé** en T03 ; il réutilise exactement le composant DSF du Catalogue des séances `2537:1033 — State=Collapsed`, avec la même zone réservée sur toutes les cartes. Aucune poignée de déplacement n’est affichée. `Déployer` ne devient fonctionnel qu’avec une évolution Médias ultérieure.

### Exécution directe d’une Activité — MVP T03

Une Exécution directe d’origine `ACTIVITY` crée un instantané autonome et immuable, applique une préparation fixe de `5 s`, développe Séries, Pauses, côtés et Récupération selon les règles existantes puis se termine sans `SESSION_END`. Le signal de fin ouvre immédiatement la Synthèse.

Le Ressenti est obligatoire lorsque la Synthèse est présentée ; le Commentaire est facultatif. L’Exécution rejoint le Suivi général sous le type Activité et alimente toutes les statistiques compatibles sans augmenter le nombre de Séances. `Terminer` restaure l’état du Catalogue des activités du parcours courant. Cet état n’est pas conservé après relance complète.

### Corrections UX communes T03

- une roulette ouverte laisse le bouton principal inférieur visuellement inchangé sous le voile grisé, mais le rend fonctionnellement et accessibilité-inactif ;
- le swipe gauche déplace réellement la carte tandis que le bloc d’actions reste fixe et révèle progressivement ses options ;
- à l’état ouvert de référence, le gap carte→actions vaut `10 pt` et est égal au gap actions→bord droit du conteneur ; le premier bouton porte les rayons gauches, le dernier les rayons droits, et une action unique porte les quatre rayons ;
- seul un swipe droit commencé sur la carte contextuellement ouverte la referme ;
- les autres contrôles restent actifs, mais une seule carte peut exposer simultanément ses actions ;
- une confirmation destructive déclenchée depuis le swipe conserve la carte ouverte et l’action déclenchante visibles sous le voile modal jusqu’à décision ;
- le Compte à rebours initial et la Fin de séance ne sont pas déplaçables et n’acceptent aucun appui long de déplacement ;
- après enregistrement depuis Classification, la cible est `Catalogue des séances`, segment `Séances` ;
- la navigation d’avancement canonique fait entrer la cible depuis la droite et sortir l’écran courant vers la gauche ;
- dans le Catalogue, la rangée `Créer / Filtrer / Trier` suit la géométrie commune validée ; dans Activités, `Filtrer` permet `Archivées`, tandis que `Trier` reste visible disabled jusqu’à arbitrage de ses options ;
- dans l’éditeur Activité, `Renforcement du genou` est une donnée de démonstration, l’état vide affiche `Nom de l’activité`, et Répétitions/À l’échec affichent le contrôle `Durée totale >=` sans modifier la Synthèse fonctionnelle `Durée totale : ≥ {durée connue}`.

### Médias et Circuits

Les médias multiples `0..n` sont post-MVP. Le contrôle `Déployer` visible en T03 est préparatoire et reste désactivé.

Un Circuit reste conceptualisé et préparé dans le modèle/architecture, mais T03 ne développe ni création, ni modification, ni Exécution, ni planification de Circuit. Le segment `Circuits` est visible et désactivé.

## 12. Roadmap des tranches MVP

| Tranche | Périmètre de référence |
|---|---|
| T01–T02 | Création, modification et Composition des Séances. |
| T03 | Catalogue des activités : persistance et cycle de vie, liste, accès aux archives, création contextuelle directe, sélection multiple, copie indépendante dans une Séance, Exécution directe autonome et corrections UX associées. |
| T04 | Moteur d’Exécution complet des Séances ; ancienne T03, lots 1 et 2. |
| T05 et suivantes | Ancienne T04 et tranches ultérieures, décalées d’un rang sans modification implicite de contenu. |

La tranche bilatéralité `V2-BILAT-01` reste un incrément préparatoire antérieur et clos ; elle n’est pas renommée T03.

## 13. Gouvernance documentaire

`PRODUCT.md` est une synthèse. Il ne remplace pas les spécifications détaillées.

En cas de contradiction, l’ordre de référence est :

1. registre des décisions de conception et arbitrages explicitement supersédants ;
2. glossaire, modèle fonctionnel et modèle de données ;
3. conception fonctionnelle détaillée ;
4. écrans et navigation ;
5. contrats d’écran du chapitre 13 ;
6. versions du produit et vision générale ;
7. documents de travail, historiques et revues externes.

Pour T03, les références explicites de cette mise à jour sont :
- `06 – Ecrans et navigation de la V1.md`, qui intègre directement les corrections UX T03 ;
- `07 – Registre des décisions de conception.md`, qui intègre D-167 à D-187 ;
- `09 bis – Modèle et migration T03 Catalogue.md` ;
- `13 – Contrats d’écran.md`, unique référence des contrats d’écran T03 ;
- `MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md` ;
- `Specifications-fonctionnelles/images/README-T03-FIGMA.md` pour les évidences Figma embarquées.

Toute évolution fonctionnelle doit préciser son impact sur Figma, la documentation fonctionnelle, le modèle de données, les règles métier, les API ou services, l’architecture technique, les contrats d’écran et la version du produit.

Pour la spécification et la validation UI, la composition documentaire de référence est : `Screen Shell → composant ou contrôle du Design System → règle spécifique → contrat d’écran`. Une règle commune n’est pas recopiée inutilement ; une exception locale doit être explicitement identifiée et justifiée par Figma ou par une décision fonctionnelle validée.

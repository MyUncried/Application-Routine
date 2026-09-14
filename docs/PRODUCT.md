# PRODUCT — KODJO

## 1. Finalité

KODJO est l’application mobile éditée par ANKUSHA permettant à un utilisateur de créer, exécuter, planifier et suivre des séances personnelles, notamment des exercices physiques, de mobilité ou de rééducation. Sa signature est `Keep On. Do Just One.`

L’application remplace l’usage dispersé de notes, vidéos, alarmes et minuteurs par un parcours unique, simple et guidé.

## 2. Utilisateur prioritaire

Le MVP est conçu pour un utilisateur individuel qui :
- crée ses propres séances ;
- les exécute immédiatement ou les planifie ;
- consulte l’historique détaillé de ses exécutions ;
- utilise l’application sans compte et sans synchronisation cloud.

La kinésithérapie constitue un premier cas d’usage, mais le produit reste généraliste.

## 3. Concepts fonctionnels structurants

### Séance

Une Séance est un contenu exécutable défini par l’utilisateur.

Elle possède notamment :
- un nom ;
- une couleur ;
- zéro, une ou plusieurs catégories ;
- une Composition présentée autour d’un Tour unique ;
- des paramètres de guidage et d’exécution.

### Routine

Une Routine est la planification d’une Séance.

Une même Séance peut être utilisée par plusieurs Routines. Une Routine ne contient pas de copie de la Séance et reprend sa couleur.

Dans le MVP, une Routine possède zéro ou un rappel.

### Activité

Une Activité est une définition d’Exercice. Dans le MVP, elle existe comme copie intégrée à une Séance. En V2, elle peut aussi exister comme référence persistante autonome dans le catalogue Activités ; son ajout à une Séance crée une copie indépendante.

Une Activité utilise l’un des trois modes `Durée`, `Répétitions` ou `À l’échec`. Elle porte un réglage de côté parmi `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT`, avec `UNILATERAL` par défaut. Elle peut définir une Pause entre les Séries d’un même côté et une Récupération optionnelle. Pour une Activité autonome, cette Récupération est exécutée une seule fois après tous ses côtés ; dans un Tour bilatéral, elle est exécutée une fois après chaque passage de côté. `Récupération` n’est plus un type d’Activité.

Une Activité peut être placée avant le Tour, dans le Tour ou après le Tour et peut être réordonnée entre ces zones.

### Série

Une Série désigne la répétition d’un même Exercice.

Le Nombre de Séries est un paramètre de l’Exercice et ne constitue pas un conteneur structurel de la Séance.

Une Pause entre Séries peut être définie pour une Activité. Pour `C` Séries d’un même côté, elle est comptée `C` fois lorsque la Récupération `R` vaut `0`, y compris après la dernière Série, ou `C − 1` fois lorsque `R > 0`, la Récupération remplaçant alors la dernière Pause. Aucune Pause supplémentaire n’est ajoutée spécifiquement entre les deux côtés. Une Récupération distincte peut être définie ; elle appartient à l’Activité, n’augmente jamais le nombre d’Activités de la Composition et s’exécute après tous les côtés d’une Activité autonome ou après chaque passage de côté dans un Tour bilatéral.

Pour une Activité autonome, le nombre de Séries s’entend par côté. En mode Durée, sa Durée totale globale est calculée par `D = L × [C × A + P(C,R) × B] + R`, avec `P(C,R) = C` lorsque `R = 0`, sinon `P(C,R) = C − 1`, avec `L = 1` en unilatéral et `L = 2` en bilatéral, `C` le nombre de Séries par côté, `A` la durée par Série, `B` la Pause et `R` la Récupération. `Séries` et `Durée totale` sont deux entrées dépendantes : la dernière valeur confirmée pilote le calcul, tandis que le nombre entier de Séries reste la donnée canonique persistée.

### Tour et Cycle

Le MVP contient exactement un Tour visible et un Cycle technique.

Le Tour est un groupe ordonné d’Activités exécuté intégralement de 1 à 99 fois. Il porte lui aussi un réglage de côté. À chaque répétition, un Tour bilatéral exécute toutes ses Activités pour le premier côté, puis toutes pour le second, selon la direction choisie. Le Tour porte alors seul la direction effective : les réglages propres de ses Activités sont remis à `UNILATERAL`, affichés désactivés et ne sont pas restaurés si le Tour redevient unilatéral.

Le Cycle est conservé dans le modèle pour l’évolutivité, mais son nombre de répétitions vaut toujours `1`, n’est pas modifiable et n’est jamais affiché à l’utilisateur dans le MVP.

### Exécution

Une Exécution est la réalisation effective d’une Séance.

Chaque Exécution repose sur un instantané JSON immuable de la Séance au démarrage. Cet instantané garantit que l’historique reste lisible même si la Séance est ensuite modifiée ou supprimée.

Pour un plan bilatéral, cet instantané conserve la direction effective et chaque Résultat d’Activité conserve son côté. L’interface affiche uniquement `Côté droit` ou `Côté gauche` sous le nom de l’Activité pendant le passage concerné, sans compteur `1/2` ou `2/2`.

## 4. Périmètre du MVP

### Catalogue des séances

Le MVP permet de :
- créer une Séance avec un nom et une couleur obligatoires ;
- composer et modifier une Séance ;
- associer zéro, une ou plusieurs Catégories ;
- afficher dans chaque carte du Catalogue les Catégories associées et l’union dédupliquée des Zones corporelles de tous ses Exercices ;
- dupliquer et archiver une Séance active ;
- restaurer ou supprimer une Séance archivée, la suppression exigeant donc un archivage préalable ;
- effectuer une recherche globale sur les formes Catalogue, Planifiée, Exécutée et Archivée d’une Séance ;
- empêcher l’exécution d’une Séance invalide ou vide.

### Composition d’une Séance

La structure affichée comprend, dans l’ordre :
1. un Compte à rebours initial structurellement présent, éventuellement instantané à `0 s` ;
2. zéro, une ou plusieurs Activités avant le Tour ;
3. un Tour unique contenant zéro, une ou plusieurs Activités et répété de 1 à 99 fois ;
4. zéro, une ou plusieurs Activités après le Tour ;
5. une Fin de séance structurellement présente, d’une durée initiale de `5 s` et pouvant être réglée à `0 s`.

Le Cycle technique unique enveloppe ce plan avec une répétition fixée à `1`.

Une Séance est exécutable lorsqu’elle contient au moins un Exercice valide.

Aucune Récupération n’est ajoutée implicitement entre deux Activités. Une Récupération est exécutée uniquement lorsqu’une durée non nulle est configurée sur l’Activité ; elle intervient après tous les côtés d’une Activité autonome ou après chaque passage de côté d’un Tour bilatéral, y compris pour la dernière Activité avant `SESSION_END`.

Le contrôle `Côté` cycle entre Unilatéral, `D→G` et `G→D` sur une Activité comme sur un Tour. Dans la Composition, le contrôle du Tour est placé dans l’en-tête du Tour, sur la même ligne que `Nombre de tours`, immédiatement à droite du cadre numérique ; aucun titre `Côté` ou `Côtés` n’est visible. L’activation bilatérale est directe si le Tour est vide ou si toutes ses Activités sont propres `UNILATERAL`. Une confirmation n’est affichée que si au moins une Activité possède encore un réglage propre `RIGHT_LEFT` ou `LEFT_RIGHT` qui sera remplacé ; `Confirmer` applique atomiquement la direction au Tour et remet les seules Activités concernées à `UNILATERAL`, tandis qu’`Annuler` ne modifie rien. Il n’existe aucune propriété ni validation d’Activité « latéralisable » : toutes les Activités du Tour héritent de sa direction effective.

Dans la Composition, une carte hors Tour bilatéral affiche `D→G` ou `G→D` dans ses informations secondaires si sa direction propre est bilatérale ; elle n’affiche rien en `UNILATERAL`. Dans un Tour bilatéral, la carte ne répète jamais la direction portée par le Tour. La synthèse propre ajoute `à droite, puis à gauche` ou `à gauche, puis à droite` après la cible du mode et avant la Pause ; elle omet cette clause en unilatéral ou lorsque la bilatéralité vient seulement du Tour. Le libellé visible est toujours `Durée totale`; en Répétitions et À l’échec, la borne reste `Durée totale : ≥ {durée connue}`.

Une Activité ne possède aucun média fonctionnel dans le MVP. Le bouton `+ Ajouter un média` reste visible mais désactivé et la section Médias est masquée. En V2, une Activité peut associer `0..n` photos ou vidéos ordonnées.

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

Une Activité bilatérale autonome exécute toutes ses Séries du premier côté puis toutes celles du second. Un Tour bilatéral exécute, à chaque répétition, tout son contenu du premier côté puis tout son contenu du second. La modale générique de passage anticipé reste inchangée : depuis le premier côté, confirmer conserve le résultat partiel de ce côté et conduit au second. Une réinitialisation ne concerne que le côté courant et préserve le résultat de l’autre côté.

Une Récupération d’Activité est une phase chronométrée. Elle annonce `Récupération`, se termine automatiquement à zéro et peut être quittée avec `Activité suivante` après confirmation. L’Exercice reste alors terminé et la Récupération est enregistrée partiellement. `Réinitialiser la récupération` recommence uniquement cette phase. Un arrêt pendant la Récupération produit une Exécution `Interrompue`.

Un arrêt volontaire confirmé produit une Exécution `Interrompue` et ouvre la Synthèse. Une interruption technique ou système peut produire une Exécution `Interrompue` sans affichage de la Synthèse et donc sans Ressenti.

Aucun retour à l’Activité précédente n’est inclus dans le MVP.

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
- l’instantané immuable de la Séance ;
- la date et l’heure ;
- la Durée réelle ;
- le statut ;
- les Résultats d’Activités exécutées ;
- le côté de chaque Résultat lorsque l’Activité est effectivement bilatérale ;
- le Ressenti éventuel ;
- un Commentaire facultatif limité à 200 caractères.

Les statuts d’Exécution sont :
- Terminée ;
- Partielle ;
- Interrompue.

Une Activité `Partielle` compte comme exécutée dans le Nombre d’Activités exécutées. Une Activité jamais atteinte ne compte pas.

Le Suivi du MVP comprend :
- une liste chronologique du plus récent au plus ancien ;
- une vue condensée ou déployée ;
- le détail d’Exécution directement dans la carte déployée.

Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivées. Les fonctions correspondantes, dont les graphiques et comparaisons avancées, sont hors MVP.

### Profil et préférences

Les Préférences globales définissent notamment :
- les valeurs par défaut du Compte à rebours initial et de la Fin de séance ;
- les sons ;
- les annonces vocales ;
- les vibrations fonctionnelles de séance ;
- l’activation des notifications.

Les valeurs initiales sont `10 s` pour le Compte à rebours initial, `5 s` pour la Fin de séance et `activée` pour Vibration. Le réglage `Vibration` ne pilote pas le feedback haptique des roulettes numériques, qui reste systématique.

Les notifications ne sont pas autorisées par défaut. La demande d’autorisation système est déclenchée dans le contexte de la première activation d’un rappel pendant une planification. En cas de refus, le rappel reste désactivé.

Elles ne modifient jamais rétroactivement une Séance existante ni une Exécution passée.

## 5. Navigation principale

Le MVP comporte quatre onglets :
- Séances ;
- Calendrier ;
- Suivi ;
- Profil.

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
- modification individuelle d’une occurrence de Calendrier.

## 7. Principes métier structurants

1. Une Séance est un contenu exécutable ; une Routine est sa planification.
2. Une Séance et ses Routines sont indépendantes.
3. Chaque Exécution conserve un instantané immuable de la Séance utilisée.
4. Une modification ou une suppression ultérieure ne change jamais une Exécution passée.
5. La suppression d’une Routine ne supprime jamais l’historique.
6. La suppression d’une Séance supprime ses Routines mais conserve les Exécutions passées.
7. Les catégories qualifient les Séances.
8. Les zones corporelles qualifient les Activités ; elles restent facultatives.
9. La couleur appartient à la Séance et est reprise par ses Routines.
10. Le plan d’Exécution est calculé au démarrage et n’est pas manipulé directement par l’utilisateur.
11. Le Compte à rebours initial et la Fin de séance sont structurellement présents ; `0 s` signifie phase instantanée.
12. Les occurrences du Calendrier sont calculées dynamiquement.
13. Toutes les données du MVP sont stockées localement sur l’appareil.
14. Les règles de calcul fonctionnelles sont déterministes et centralisées dans les spécifications.
15. Une direction bilatérale n’est appliquée qu’à un seul niveau : celle du Tour prévaut, sinon celle de l’Activité.
16. Les Résultats bilatéraux sont séparés par côté ; un seul côté partiellement réalisé rend l’Activité globale partielle.

## 8. Écrans de référence

Les principaux écrans du MVP sont :
- Profil ;
- Catalogue des Séances ;
- création du nom et de la couleur d’une Séance ;
- Composition d’une Séance ;
- création ou modification d’une Activité ;
- options d’une Activité ;
- catégories de la Séance ;
- Calendrier semaine et mois ;
- planification d’une Séance ;
- Exécution d’une Séance ;
- modales d’interruption ;
- Synthèse de Séance ;
- Suivi — Séances.

Les maquettes Figma validées définissent la présentation de référence. La spécification UI déterministe combine les Screen Shells et composants communs décrits au chapitre 12 avec les règles fonctionnelles du chapitre 06 et les contrats d’écran concernés. Une règle métier propre à un écran ne devient pas une règle générique du Design System.

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
- signalement détaillé de douleur ou de gêne ;
- structures de Séances plus complexes ;
- réglages sonores plus fins ;
- bibliothèque d’Activités persistantes, réutilisées par copie indépendante ;
- association de `0..n` photos ou vidéos ordonnées par Activité ;
- Circuits persistants composés d’au moins deux Séances ordonnées, exécutables manuellement ; leur planification est reportée en V3 ;
- planification périodique étendue, notamment mensuelle ;
- intelligence artificielle d’aide à la création, à l’adaptation et à l’analyse des Séances ;
- suppression d’une Catégorie personnalisée créée par erreur, reportée au MVP bis.

## 11. Évolution Activités, Catalogue et Circuits — décision du 6 septembre 2026

Le Catalogue conserve un seul écran mais distingue `Activités`, `Séances` et `Circuits`. Dans le MVP, `Séances` est sélectionné et fonctionnel ; `Activités` et `Circuits` restent visibles mais désactivés. Les anciens segments `Toutes`, `Planifiées` et `Archivées` ne sont plus une navigation principale : ces états deviennent des filtres dédiés.

Le MVP ajoute le troisième mode d’Exercice `À l’échec`. Il ne possède ni durée ni répétitions cibles et utilise exactement le mécanisme du mode Répétitions : l’utilisateur termine chaque Série avec `Suivant`. La durée affichée est une borne minimale fondée sur les seuls temps connus.

En V2, l’Activité de catalogue est une référence persistante directement exécutable. Son insertion dans une Séance copie son nom, son mode, ses paramètres, sa Pause, sa Récupération et ses associations média ; la copie appartient à la Séance, n’apparaît pas dans le catalogue et évolue indépendamment. L’action future `Enregistrer dans mes activités` n’est pas proposée dans la première version de cette bibliothèque.

La nouvelle structure d’Activité — absence de type, sections Description et Zone corporelle repliables, Mode déployé par défaut, paramètres `Séries / cible / Pause`, puis `Côté / Récupération / Durée totale` — constitue un prérequis documentaire et fonctionnel à T03.

Une tranche Configuration préalable à T03 livre les réglages `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT`, leur persistance, leur copie et leur duplication, les calculs et synthèses, les contrôles Activité et Tour, la confirmation conditionnelle d’activation d’un Tour et la résolution de la direction propre ou effective. Cette tranche n’exécute pas encore les passages bilatéraux.

T03 est révisée pour exécuter les modes Durée, Répétitions et À l’échec, les Séries multiples, les répétitions du Tour et les passages bilatéraux. Elle développe le Plan d’Exécution, affiche le côté courant, pondère la progression, annonce les changements de côté, limite la réinitialisation au passage courant et conserve des Résultats séparés par côté. Les anciennes exclusions limitant T03 à une Série ou reportant cette exécution à T04 sont supprimées.

Un Circuit V2 possède un nom, une couleur et au moins deux étapes ordonnées. Il référence les Séances existantes, autorise plusieurs occurrences d’une même Séance et ne possède pas de compteur de répétition d’étape. Une Exécution de Circuit fige un instantané et relie les Exécutions de Séance de ses étapes. La planification des Circuits relève de la V3.

## 12. Gouvernance documentaire

`PRODUCT.md` est une synthèse. Il ne remplace pas les spécifications détaillées.

En cas de contradiction, l’ordre de référence est :
1. registre des décisions de conception ;
2. glossaire, modèle fonctionnel et modèle de données ;
3. conception fonctionnelle détaillée ;
4. écrans et navigation ;
5. versions du produit et vision générale ;
6. documents de travail, historiques et revues externes.

Toute évolution fonctionnelle doit préciser son impact sur :
- Figma ;
- documentation fonctionnelle ;
- modèle de données ;
- règles métier ;
- API ou services ;
- architecture technique ;
- version du produit.

Pour la spécification et la validation UI, la composition documentaire de référence est : `Screen Shell → composant ou contrôle du Design System → règle spécifique et contrat d’écran`. Une règle commune n’est pas recopiée dans chaque contrat ; une exception locale doit être explicitement identifiée et justifiée par Figma ou par une décision fonctionnelle validée.\n\n## 13. Exécution directe d’une Activité — décision du 14 septembre 2026

En V2, une Activité persistante peut être exécutée directement depuis le Catalogue des Activités. Le moteur crée un instantané autonome de la définition au lancement ; aucune Séance artificielle n’est créée.

L’Exécution directe commence par une préparation système fixe de `5 s`, qui n’est pas un attribut de l’Activité. Elle exécute ensuite ses Séries, ses Pauses, sa direction bilatérale éventuelle et sa Récupération. Après la dernière phase, un signal clôt l’Exécution et ouvre immédiatement la Synthèse ; aucune phase `SESSION_END` n’est ajoutée.

Le Ressenti reste obligatoire lorsque la Synthèse est présentée, comme pour une Séance, et le Commentaire reste facultatif. L’Exécution est conservée dans le Suivi général avec l’origine `ACTIVITY`, contribue à toutes les statistiques compatibles sans augmenter le nombre de Séances, puis `Terminer` ramène au Catalogue des Activités dans son état précédent.\n
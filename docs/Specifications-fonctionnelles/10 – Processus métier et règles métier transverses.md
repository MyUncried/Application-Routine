# Processus métier et règles métier transverses

## Objet

Ce chapitre rassemble les règles fonctionnelles qui s’appliquent à plusieurs écrans ou parcours. Le détail visuel et les interactions écran par écran restent définis dans le chapitre 06.

## 1. Gestion du Catalogue et des Séances

| ID | Règle |
| --- | --- |
| RM-001 | Une Séance possède un identifiant unique, un nom obligatoire et une couleur obligatoire. |
| RM-002 | Le Catalogue des séances est l’écran d’accueil après le splash. |
| RM-003 | Une Séance est soit active, soit archivée. Les vues actives excluent les Séances archivées. |
| RM-004 | Toucher le corps d’une carte de Séance active ouvre cette Séance en mode modification. |
| RM-005 | Le glissement sur une Séance active expose uniquement les actions prévues pour ce contexte : `Planifier`, `Dupliquer` et `Archiver`. |
| RM-006 | La duplication crée une copie indépendante de la Séance et de sa Composition. Elle ne crée ni Routine ni Exécution. |
| RM-007 | Une Séance active ne peut pas être supprimée depuis les vues `Toutes` ou `Planifiées`. Elle doit d’abord être archivée. |
| RM-008 | L’archivage supprime les Routines futures associées à la Séance, mais conserve les Exécutions et leurs Instantanés historiques. |
| RM-009 | Une Séance archivée peut être restaurée. La restauration ne recrée aucune ancienne Routine. |
| RM-010 | Après restauration, un message `Séance restaurée` propose temporairement `Annuler`. |
| RM-011 | Une Séance archivée peut être supprimée définitivement après confirmation explicite. Cette suppression ne supprime pas ses Exécutions historiques. |
| RM-012 | Dans l’état glissé d’une carte, la carte conserve sa position ; les options chevauchent la carte conformément à la convention du prototype. |
| RM-013 | La recherche globale ne modifie pas la collection. Retour ramène au contexte depuis lequel la recherche a été ouverte. |
| RM-014 | L’état vide du Catalogue permet de lancer la création de la première Séance. |

## 2. Création et modification d’une Séance

| ID | Règle |
| --- | --- |
| RM-015 | La création s’effectue dans un écran unique `Composition d’une séance` ; il n’existe plus d’écran préalable réservé au nom. |
| RM-016 | Une couleur est proposée par défaut et peut être choisie dans une palette prédéfinie de 12 couleurs organisée en 4 × 3. |
| RM-017 | `Continuer` reste désactivé tant que le nom est vide, qu’aucune couleur n’est sélectionnée ou qu’aucun Exercice valide n’est présent. |
| RM-018 | Retour pendant une création commencée ouvre un dialogue flottant centré. `Annuler`, action neutre, conserve les données ; `Confirmer`, action destructive rouge, supprime le brouillon et revient au Catalogue. |
| RM-019 | La Composition expose un seul bouton global `+ Ajouter une activité`. |
| RM-020 | La première Activité créée est insérée après le Compte à rebours initial et avant le Tour. Les suivantes sont insérées après la dernière Activité existante de la Composition ; toutes peuvent ensuite être déplacées manuellement avant, dans ou après le Tour. |
| RM-021 | Toucher une carte d’Activité ouvre directement son édition. La duplication et la suppression sont accessibles par glissement gauche dans la Composition. |
| RM-022 | Après `Continuer`, l’utilisateur peut associer facultativement zéro, une ou plusieurs Catégories à la Séance. |
| RM-023 | Une Catégorie personnalisée peut être créée depuis l’écran de sélection. Une Catégorie supprimée est retirée des Séances concernées sans modifier les Instantanés historiques. |
| RM-024 | L’enregistrement des Catégories termine la création ou la modification et revient au Catalogue des séances. |

## 3. Composition, Tour et Cycle technique

| ID | Règle |
| --- | --- |
| RM-025 | Une Séance contient exactement un Tour visible et un Cycle technique. |
| RM-026 | Le Tour est un conteneur ordonné d’Activités exécuté intégralement de 1 à 99 fois ; sa valeur initiale est 1. |
| RM-027 | Le nombre de Tours est modifié avec un contrôle compact `xN` ouvrant un sélecteur. Les boutons `+ / −` ne font pas partie de l’UX de référence. |
| RM-028 | Le Cycle est conservé pour l’évolutivité du modèle. Dans le MVP, son nombre de répétitions vaut toujours 1, n’est pas modifiable et n’est jamais affiché. |
| RM-029 | Des Activités peuvent être placées avant le Tour, dans le Tour ou après le Tour. Leur ordre est persistant. |
| RM-030 | Le Compte à rebours initial et la Fin de séance sont structurellement présents. Une valeur de 0 seconde rend la phase instantanée sans la supprimer. |
| RM-031 | Les valeurs initiales de l’application sont de 10 secondes pour le Compte à rebours initial et de 5 secondes pour la Fin de séance. |
| RM-032 | Une modification des valeurs globales s’applique aux nouvelles Séances ; elle ne modifie pas une Séance existante ni une Exécution en cours. |

## 4. Activités, Séries et Récupérations

| ID | Règle |
| --- | --- |
| RM-033 | Une Activité est de type `Exercice` ou `Récupération`. |
| RM-034 | Un Exercice est défini soit par une durée, soit par un nombre de Répétitions. |
| RM-035 | Tout Exercice possède un nombre entier de Séries de 1 à 99 (D-092) ; la valeur initiale est 1. |
| RM-036 | Une Série correspond à l’exécution de la durée ou des Répétitions de l’Exercice, suivie de sa Pause après Série éventuelle. Elle n’est pas une entité métier autonome. |
| RM-037 | Lorsqu’une Pause après Série est configurée, une Récupération technique est générée après chaque Série. Après la dernière Série, elle est omise si l’étape suivante est déjà une Récupération explicite. |
| RM-038 | Une Récupération explicite est toujours chronométrée, reçoit initialement le nom `Récupération` et se termine automatiquement à zéro. |
| RM-039 | Un Exercice peut être associé à zéro, une ou plusieurs Zones corporelles. Une Récupération ne possède aucune Zone corporelle. |
| RM-040 | Les Zones corporelles constituent un référentiel prédéfini : elles sont sélectionnables mais non créables, non modifiables et non supprimables dans le MVP. |
| RM-041 | Une Activité ne possède aucun média dans le MVP. Le modèle prévoit au plus un média par Activité après le MVP. |
| RM-042 | L’action de validation de l’édition d’une Activité est libellée `Terminer`. |

## 5. Planification et Calendrier

| ID | Règle |
| --- | --- |
| RM-043 | Une Routine est la planification d’une Séance ; une Séance peut posséder plusieurs Routines. |
| RM-044 | Une Routine est unique ou périodique et possède zéro ou un rappel. Elle reprend la couleur de sa Séance et ne possède pas de couleur indépendante. |
| RM-045 | Les vues Jour, Semaine et Mois du Calendrier font partie du MVP ; la vue Jour est la vue initiale. |
| RM-046 | En vue Semaine, la liste et le sélecteur de jour sont synchronisés : le jour en tête de liste devient le jour sélectionné, et sélectionner un jour positionne sa section en tête. |
| RM-047 | Pour une Routine périodique, la semaine contenant la date de début est la semaine d’ancrage n°1. Avec une fréquence de N semaines, les occurrences sont générées, dates de début et de fin incluses, pour les jours sélectionnés des semaines correspondantes. |
| RM-048 | Une occurrence future peut être exécutée en avance depuis l’action contextuelle disponible sur sa carte. Elle n’est ensuite pas reproposée à son horaire initial. |
| RM-049 | Une occurrence passée sans Exécution disparaît de l’interface et n’est pas ajoutée au Suivi du MVP. |
| RM-050 | Supprimer une Routine demande une confirmation et ne supprime ni la Séance ni les Exécutions historiques. |

## 6. Notifications et rappels

| ID | Règle |
| --- | --- |
| RM-051 | Les notifications ne sont pas autorisées ni activées par défaut par l’application. |
| RM-052 | La demande d’autorisation système est déclenchée dans le contexte de la première activation d’un rappel pendant une planification. |
| RM-053 | En cas de refus ou d’indisponibilité de l’autorisation, le rappel reste désactivé ; la planification peut néanmoins être enregistrée. |
| RM-054 | Les notifications locales sont planifiées selon la stratégie technique définie au chapitre 12. |
| RM-054a | Dans le sélecteur de rappel, `Aucun` et `Personnalisé` restent toujours visibles. Les délais rapides prédéfinis sont affichés entre eux dans une zone horizontale défilante et extensible. Une seule option peut être sélectionnée. |

## 7. Exécution d’une Séance

| ID | Règle |
| --- | --- |
| RM-055 | Chaque démarrage crée une Exécution distincte fondée sur un Instantané immuable de la Séance. |
| RM-056 | L’entrée dans l’Exécution ne démarre pas immédiatement le décompte. L’utilisateur déclenche explicitement le démarrage. |
| RM-057 | Une Exécution peut être `En cours`, `Suspendue`, `Terminée`, `Partielle` ou `Interrompue`. |
| RM-058 | Pour un Exercice en Répétitions, le temps actif est un chronomètre croissant. Une rotation complète de l’indicateur représente une minute et un bip est émis à chaque minute. |
| RM-059 | `Activité suivante` termine normalement un Exercice en Répétitions sans confirmation. |
| RM-060 | Pour une Activité chronométrée non arrivée à zéro, `Activité suivante` demande confirmation. Si elle est confirmée, le Résultat d’Activité est `Partielle` et l’Exécution continue. |
| RM-061 | Une Activité chronométrée arrivée à zéro se termine automatiquement. |
| RM-062 | `Réinitialiser l’activité` recommence uniquement l’Activité ou la Série courante ; les positions de Tour et de Cycle technique restent inchangées. |
| RM-063 | Aucun retour à une Activité précédente et aucune sélection libre d’une autre Activité ne font partie du MVP. |
| RM-064 | Après une interruption technique d’une Exécution en cours, l’utilisateur doit choisir `Reprendre la séance` ou `Arrêter la séance` avant d’en démarrer une nouvelle. |
| RM-065 | Le bouton Retour de l’Exécution revient au contexte réel de lancement. Dans le prototype de démonstration, il revient au Catalogue des séances non vide. |

## 8. Arrière-plan, verrouillage et sécurité temporelle

| ID | Règle |
| --- | --- |
| RM-066 | Une Exécution chronométrée ne se fige pas lorsque l’application passe en arrière-plan ou que l’écran se verrouille. |
| RM-067 | L’état temporel est fondé sur des horodatages de référence ; au retour, l’application recalcule la position qui aurait dû être atteinte. |
| RM-068 | Sans interaction, une pause de sécurité intervient 30 minutes après la fin théorique d’une Activité chronométrée. |
| RM-069 | Pour un Exercice en Répétitions, une pause de sécurité intervient après 2 heures sans interaction depuis son démarrage. |
| RM-070 | Les limites des mécanismes natifs en arrière-plan doivent être validées sur appareils iOS et Android réels conformément au chapitre 12. |

## 9. Calculs et progression

| ID | Règle |
| --- | --- |
| RM-071 | La durée estimée est la somme des durées déterminables du plan développé : Compte à rebours initial, Fin de séance, Activités chronométrées et Récupérations techniques générées. |
| RM-072 | Aucun temps conventionnel n’est attribué aux Exercices en Répétitions. S’il en existe au moins un, la durée estimée est une borne minimale précédée de `≥`. |
| RM-073 | Le temps total écoulé et la durée réelle excluent les Pauses déclenchées par l’utilisateur et incluent le temps réellement exécuté dans les autres phases. |
| RM-074 | Le Nombre d’Activités de la Composition compte les Activités définies par l’utilisateur une seule fois, sans développer Séries ni Tours et sans compter les Récupérations techniques. |
| RM-075 | Le Nombre total d’Activités à exécuter compte les occurrences du plan développé après Séries et Tours, y compris les Récupérations techniques effectivement générées, mais exclut le Compte à rebours initial et la Fin de séance. |
| RM-076 | Le Nombre d’Activités exécutées correspond aux Résultats d’Activité créés. Une Activité `Partielle` compte ; une Activité jamais atteinte ne compte pas. |
| RM-077 | La progression mathématique est continue. Chaque occurrence en Répétitions pèse `1/N` ; la part restante est répartie entre les Activités chronométrées proportionnellement à leur durée. La piste peut être structurée visuellement par Tours conformément au prototype Figma, sans effet sur le calcul. |
| RM-101 | La durée estimée (RM-071), exprimée en secondes, est convertie en minutes pour son affichage à l’utilisateur (Catalogue, Composition) par arrondi à la minute supérieure, afin de ne jamais sous-estimer la durée réelle (D-090). |

## 10. Synthèse, Suivi et historique

| ID | Règle |
| --- | --- |
| RM-078 | Le Ressenti est obligatoire lorsque l’écran de Synthèse est présenté. Il peut être absent après une interruption technique sans passage par la Synthèse. |
| RM-079 | Le Commentaire de Synthèse est facultatif et limité à 200 caractères. |
| RM-080 | `Terminer` reste désactivé tant qu’aucun Ressenti n’est sélectionné, puis enregistre la Synthèse et ouvre le Suivi. |
| RM-081 | Le Suivi conserve les Exécutions `Terminées`, `Partielles` et `Interrompues`. |
| RM-082 | Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivées dans le MVP. |
| RM-083 | Chaque Résultat d’Activité conserve les informations nécessaires à sa restitution, notamment sa position, ses indices de Série et de Tour, son statut et sa durée réelle. Le Cycle technique peut être conservé dans les données mais n’est jamais affiché. |
| RM-084 | Toute modification, archivage ou suppression ultérieure de la Séance source est sans effet sur les Instantanés existants. |

## 11. Préférences, sons, voix et vibrations

| ID | Règle |
| --- | --- |
| RM-085 | Les Préférences MVP sont Sons, Annonces vocales, Vibration, Compte à rebours initial, Fin de séance et Notifications. |
| RM-086 | Les Préférences sont sauvegardées immédiatement. |
| RM-087 | Sons, Annonces vocales et Vibrations fonctionnelles sont indépendants. |
| RM-088 | La voix utilisée est celle du système et son volume dépend du téléphone. |
| RM-089 | La valeur initiale de `Vibration` est activée. |
| RM-090 | Le feedback haptique léger émis à chaque changement effectif de valeur d’une roulette est systématique dans le MVP et indépendant de `Vibration`. |

## 12. Langue, terminologie et accessibilité structurelle

| ID | Règle |
| --- | --- |
| RM-091 | Le MVP est affiché uniquement en français et ne présente aucun sélecteur de langue. |
| RM-092 | Tous les textes applicatifs sont centralisés dans un lexique fondé sur des clés de traduction ; un changement de terme ou l’ajout d’une langue ne doit pas exiger la modification de chaque écran. |
| RM-093 | Les termes `Séance`, `Activité`, `Exercice`, `Récupération`, `Série`, `Tour`, `Routine` et `Exécution` sont utilisés conformément au glossaire et de manière uniforme. |
| RM-094 | Les écrans respectent les Safe Areas du système, y compris l’inset inférieur sous la navigation fixe. |
| RM-095 | Les cibles tactiles principales respectent une zone commune minimale de 48 × 48 points logiques sur iOS et Android, même si leur représentation visuelle est plus petite. Un conteneur tactile ou un `hitSlop` étend les contrôles compacts sans agrandir leur pictogramme. |
| RM-096 | Les éléments de navigation restent au premier plan et les contenus défilants ne doivent pas passer visuellement au-dessus d’eux. |
| RM-097 | Un contrôle segmenté répartit sa largeur intérieure également entre ses options ; chaque libellé et le fond sélectionné sont centrés dans la zone de leur option. |
| RM-098 | Un groupe d’actions de carte est ancré au bord droit intérieur de la carte avec une marge constante ; son espacement interne ne dépend pas de la largeur de l’écran. |
| RM-099 | Toute liste placée au-dessus d’une navigation fixe défile dans une zone bornée et conserve au moins `16` points d’espace visuel avant cette navigation. |
| RM-100 | Les cadres de synthèse utilisent la largeur utile et une hauteur déterminée par leur texte multi-ligne ; aucun texte de synthèse ne peut dépasser son cadre. |
| RM-102 | À l’ouverture d’une roulette avec confirmation explicite, le brouillon est initialisé avec la dernière valeur confirmée. Le défilement et le toucher de la bande de sélection ne ferment pas le contrôle et ne modifient pas la donnée persistée. |
| RM-103 | Annuler ferme la roulette et détruit le brouillon ; Confirmer enregistre exactement les valeurs centrées, actualise l’affichage hôte puis ferme. Une réouverture restitue cette dernière valeur confirmée. |
| RM-104 | Tout contrôle historique de type `pull-up`, `pull-down` ou menu numérique ouvre une roulette native OS. Pour une valeur scalaire, elle utilise une seule colonne et la variante DSF `Type=Numeric wheel`; aucune sélection n’est persistée sans action explicite Confirmer. |
| RM-105 | Le Compte à rebours initial et la Fin de séance conservent des valeurs et des brouillons indépendants. Les secondes d’une durée sont sélectionnables de `00` à `59`, par pas de `1`. |
| RM-106 | Les Catégories prédéfinies suivent leur `displayOrder`; les Catégories personnalisées sont affichées ensuite par date de création croissante. Une sélection ne change pas cet ordre et aucune réorganisation manuelle n’est proposée dans le MVP. |
| RM-107 | Une Catégorie personnalisée créée depuis le parcours de création d’une Séance reste dans le brouillon. Son existence temporaire est distincte de sa sélection : elle est sélectionnée automatiquement à la création, demeure visible après désélection et peut être resélectionnée sans doublon. La navigation Catégories ↔ Composition conserve les deux états. `Enregistrer la séance` persiste atomiquement la Séance, sa Composition, les nouvelles Catégories sélectionnées et leurs associations ; un abandon ou un échec ne crée aucune Catégorie orpheline. |
| RM-108 | En cas d’échec de l’enregistrement final, l’écran Catégories reste affiché, le brouillon complet est conservé, l’action est réactivée et le message `La séance n’a pas pu être enregistrée. Réessayez.` est affiché. Une nouvelle tentative est possible et aucune donnée partielle n’est conservée. |
| RM-109 | La ligne de métadonnées d’une carte du Catalogue agrège les Catégories de la Séance et l’union dédupliquée des Zones corporelles de tous ses Exercices persistés ; les deux groupes sont séparés par ` : ` seulement lorsqu’ils existent tous les deux. |
| RM-110 | Une roulette numérique ouverte bloque toute interaction et tout défilement du contenu sous-jacent jusqu’à Annuler ou Confirmer. |

# Processus métier et règles métier transverses

## Objet

Ce chapitre rassemble les règles fonctionnelles qui s’appliquent à plusieurs écrans ou parcours. Le détail visuel et les interactions écran par écran restent définis dans le chapitre 06.

## 1. Gestion du Catalogue et des Séances

| ID | Règle |
| --- | --- |
| RM-001 | Une Séance possède un identifiant unique et un nom obligatoire. Son Étiquette est facultative ; lorsqu’elle existe, sa couleur devient la couleur affichée de la Séance. |
| RM-002 | Le Catalogue des séances est l’écran d’accueil après le splash. |
| RM-003 | Une Séance est soit active, soit archivée. Les vues actives excluent les Séances archivées. |
| RM-004 | Toucher le corps d’une carte de Séance active ouvre cette Séance en mode modification. |
| RM-005 | Le glissement sur une Séance active expose uniquement les actions prévues pour ce contexte : `Planifier`, `Dupliquer` et `Archiver`. |
| RM-006 | La duplication crée une copie indépendante de la Séance et de sa Composition. Elle ne crée ni Routine ni Exécution. |
| RM-007 | Une Séance active ne peut pas être supprimée. Elle doit d’abord être archivée, puis supprimée depuis le résultat du filtre `Archivées`. |
| RM-008 | L’archivage supprime les Routines futures associées à la Séance, mais conserve les Exécutions et leurs Instantanés historiques. Sans Routine associée, l’archivage est immédiat et sans confirmation, puis un snackbar `Séance archivée` propose temporairement `Annuler`. Si au moins une Routine est associée, une confirmation explicite est requise avant l’archivage et leur suppression ; après confirmation, aucun snackbar d’annulation n’est affiché. |
| RM-009 | Une Séance archivée peut être restaurée. La restauration ne recrée aucune ancienne Routine. |
| RM-010 | Après restauration, un message `Séance restaurée` propose temporairement `Annuler`. |
| RM-011 | Une Séance archivée peut être supprimée définitivement après confirmation explicite. Cette suppression ne supprime pas ses Exécutions historiques. |
| RM-012 | Le glissement gauche déplace visiblement la carte avec le geste et révèle progressivement les actions placées derrière. Une fois ouverte, la carte se referme uniquement par un glissement droit commencé sur cette même carte ; un glissement droit ailleurs, un appui sur le fond ou un appui sur sa surface principale hors options n’a aucun effet de fermeture. Une seule carte peut exposer simultanément ses actions, sans désactiver les autres contrôles de l’écran. |
| RM-013 | La recherche globale ne modifie pas la collection. Retour ramène au contexte depuis lequel la recherche a été ouverte. |
| RM-014 | L’état vide du Catalogue permet de lancer la création de la première Séance. |

## 2. Création et modification d’une Séance

| ID | Règle |
| --- | --- |
| RM-015 | La création s’effectue dans un écran unique `Composition d’une séance` ; il n’existe plus d’écran préalable réservé au nom. |
| RM-016 | Une couleur est proposée par défaut et peut être choisie dans une palette prédéfinie de 12 couleurs organisée en 4 × 3. |
| RM-017 | `Continuer` reste désactivé tant que le nom est vide ou qu’aucun Exercice valide n’est présent. L’Étiquette est facultative ; lorsqu’elle est renseignée, sa couleur devient celle de la Séance. |
| RM-018 | Retour pendant une création commencée ouvre un dialogue flottant centré. `Annuler`, action neutre, conserve les données ; `Confirmer`, action destructive rouge, supprime le brouillon et revient au Catalogue. |
| RM-019 | La Composition expose un seul bouton global `+ Ajouter une activité`. |
| RM-020 | La première Activité créée est insérée après le Compte à rebours initial et avant le Tour. Les suivantes sont insérées après la dernière Activité existante de la Composition ; toutes peuvent ensuite être déplacées manuellement avant, dans ou après le Tour. |
| RM-021 | Toucher brièvement une carte d’Activité ouvre directement son édition. Un appui long amorce son déplacement ; l’ordre et la position structurelle ne sont modifiés qu’à la dépose dans une destination valide. La duplication et la suppression sont accessibles par glissement gauche dans la Composition. Dupliquer crée une copie indépendante avec un nouvel identifiant, le suffixe de nom `(copie)` puis numéroté si nécessaire, tous les paramètres et associations média de la source ; la copie est placée immédiatement après la source dans la même zone structurelle et ne crée aucune Activité dans le catalogue. Cette règle d’appui long ne s’applique pas au Compte à rebours initial ni à la Fin de séance, qui ne sont pas déplaçables. |
| RM-022 | La Séance est classée par Étiquette ; la couleur affichée de la Séance est celle de cette Étiquette. |
| RM-023 | Une Catégorie qualifie une Activité et porte sa couleur sémantique ; les Zones corporelles restent distinctes. |
| RM-024 | L’enregistrement des Catégories termine la création ou la modification et revient au `Catalogue des séances`, segment `Séances` sélectionné. |
| RM-124 | Dans le MVP, la création d’une Catégorie personnalisée attribue automatiquement l’icône officielle KODJO et la couleur blanche issue du token sémantique `color.background` (`#FFFFFF`) du Design System. Ces deux valeurs sont persistées mais non modifiables par l’utilisateur. La couleur de la Séance reste choisie indépendamment de ses Catégories. |

## 3. Composition, Tour et Cycle technique

| ID | Règle |
| --- | --- |
| RM-025 | Une Séance contient exactement un Tour visible et un Cycle technique. |
| RM-026 | Le Tour est un conteneur ordonné d’Activités exécuté intégralement de 1 à 99 fois ; sa valeur initiale est 1. |
| RM-027 | Le nombre de Tours est modifié avec un contrôle compact affichant uniquement `N`, sans préfixe `x` ni signe `×`, et ouvrant un sélecteur. Son bord droit est aligné avec celui des cartes d’Activité. Les boutons `+ / −` et le chevron de repli ne font pas partie de l’UX de référence. |
| RM-028 | Le Cycle est conservé pour l’évolutivité du modèle. Dans le MVP, son nombre de répétitions vaut toujours 1, n’est pas modifiable et n’est jamais affiché. |
| RM-029 | Des Activités peuvent être placées avant le Tour, dans le Tour ou après le Tour. Leur ordre est persistant. |
| RM-030 | Le Compte à rebours initial et la Fin de séance sont structurellement présents. Une valeur de 0 seconde rend la phase instantanée sans la supprimer. Ces deux cartes structurelles ne sont pas déplaçables et n’acceptent aucun appui long de déplacement. |
| RM-031 | Les valeurs initiales de l’application sont de 10 secondes pour le Compte à rebours initial et de 5 secondes pour la Fin de séance. |
| RM-032 | Une modification des valeurs globales s’applique aux nouvelles Séances ; elle ne modifie pas une Séance existante ni une Exécution en cours. |

## 4. Activités, Séries et Récupérations

| ID | Règle |
| --- | --- |
| RM-033 | Le modèle cible ne possède aucun type d’Activité `Exercice` ou `Récupération`. Une Activité utilise exactement un mode parmi Durée, Répétitions et À l’échec. |
| RM-034 | Une Activité porte une Pause entre Séries d’un même côté et une durée de Récupération positionnée selon sa direction effective ; ces deux paramètres ont `0 s` comme valeur canonique en leur absence. |
| RM-035 | Toute Activité possède un nombre entier de Séries de 1 à 99 (D-092) ; la valeur initiale est 1. |
| RM-036 | Une Série correspond à l’exécution de la cible du mode. Pour `C` Séries, une Pause éventuelle est insérée `C` fois si `R = 0`, y compris après la dernière Série, ou `C − 1` fois si `R > 0`; une Série n’est pas une entité métier autonome. |
| RM-037 | Une phase `RECOVERY` positive est insérée après tous les côtés de l’Activité. Elle reste attachée à l’Activité et ne constitue pas une Activité. |
| RM-038 | La phase `RECOVERY` est chronométrée, annoncée par « Récupération », utilise les sons standards de fin et passe automatiquement à la suite à zéro. Après la dernière Activité, elle précède `SESSION_END`. |
| RM-039 | Une Activité peut être associée à zéro, une ou plusieurs Zones corporelles. |
| RM-040 | Les Zones corporelles constituent un référentiel utilisateur administrable : sélection multiple sur une Activité, création, renommage et suppression sont autorisés dans le MVP. Une suppression utilisée demande confirmation, retire les associations des Activités courantes et préserve les Instantanés/Exécutions historiques. |
| RM-041 | Dans le MVP, le média associé à une Activité peut être affiché dans la carte déployée du Catalogue. Les capacités d’import/capture et de gestion multiple suivent leur périmètre propre. |
| RM-042 | L’action de validation de l’édition d’une Activité est libellée `Terminer`. |
| RM-129 | En mode Durée, avec `L = 1` en unilatéral ou `2` en bilatéral et `P(C,R) = C` si `R = 0`, sinon `C − 1`, la Durée totale globale d’une Activité autonome est `D = L × [C × A + P(C,R) × B] + R`. |
| RM-130 | Si Séries pilote, toute modification de `A`, `B`, `C`, `R` ou `L` recalcule `D`. Si l’utilisateur confirme une Durée totale cible, calculer `Cth = D / [L × (A + B)]` si `R = 0`, sinon `Cth = ((D − R) / L + B) / (A + B)`, arrondir au plus proche avec `.5` vers le haut, borner à `1`, puis recalculer et afficher la durée réalisable. |
| RM-131 | Séries et Durée totale ne pilotent jamais simultanément. Séries est le pilote implicite initial sans contour ; le dernier contrôle confirmé devient le pilote et reçoit le contour `color/selection`. Le pilote n’est pas persisté. |
| RM-132 | Le libellé `Durée totale` reste visible dans les trois modes. En Répétitions et À l’échec, la valeur est affichée sous forme de borne minimale `Durée totale : ≥ {durée connue}`, calculée uniquement à partir des temps connus, notamment Pauses et Récupération. |

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
| RM-123 | Depuis une occurrence du Calendrier, `Dupliquer` utilise la Routine sous-jacente comme source, crée un brouillon reprenant la même Séance et tous les paramètres de planification, puis ouvre ce brouillon en modification. La nouvelle Routine n’est persistée qu’après validation explicite. |

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
| RM-058 | Pour une Activité en Répétitions ou À l’échec, le temps actif est un chronomètre croissant. Une rotation complète de l’indicateur représente une minute et un bip est émis à chaque minute. |
| RM-059 | `Suivant` termine normalement la Série courante d’une Activité en Répétitions ou À l’échec sans confirmation. |
| RM-060 | Pour une Activité chronométrée non arrivée à zéro, `Activité suivante` demande confirmation. Si elle est confirmée, le Résultat d’Activité est `Partielle` et l’Exécution continue. |
| RM-061 | Une Activité chronométrée arrivée à zéro se termine automatiquement. |
| RM-062 | `Réinitialiser l’activité` recommence uniquement l’Activité ou la Série courante. Pendant `RECOVERY`, l’action devient `Réinitialiser la récupération` et recommence uniquement cette phase ; les Activités antérieures et leurs Résultats restent inchangés. |
| RM-063 | Aucun retour à une Activité précédente et aucune sélection libre d’une autre Activité ne font partie du MVP. |
| RM-064 | Après une interruption technique d’une Exécution en cours, l’utilisateur doit choisir `Reprendre la séance` ou `Arrêter la séance` avant d’en démarrer une nouvelle. |
| RM-065 | Le bouton Retour de l’Exécution revient au contexte réel de lancement. Dans le prototype de démonstration, il revient au Catalogue des séances non vide. |
| RM-065a | Pendant `RECOVERY`, `Activité suivante` avant zéro demande confirmation. Si elle est confirmée, l’Activité demeure terminée, la Récupération est enregistrée partiellement et l’Exécution continue. Un arrêt de la Séance pendant cette phase produit le statut `Interrompue`. |

## 8. Arrière-plan, verrouillage et sécurité temporelle

| ID | Règle |
| --- | --- |
| RM-066 | Une Exécution chronométrée ne se fige pas lorsque l’application passe en arrière-plan ou que l’écran se verrouille. |
| RM-067 | L’état temporel est fondé sur des horodatages de référence ; au retour, l’application recalcule la position qui aurait dû être atteinte. |
| RM-068 | Sans interaction, une pause de sécurité intervient 30 minutes après la fin théorique d’une Activité chronométrée. |
| RM-069 | Pour un Exercice en Répétitions ou À l’échec, une pause de sécurité intervient après 2 heures sans interaction depuis son démarrage. |
| RM-070 | Les limites des mécanismes natifs en arrière-plan doivent être validées sur appareils iOS et Android réels conformément au chapitre 12. |

## 9. Calculs et progression

| ID | Règle |
| --- | --- |
| RM-071 | La Durée estimée d’exécution est la somme des durées déterminables du Plan développé complet : Compte à rebours initial, Activités chronométrées, Pauses entre Séries, Récupérations attachées, puis Fin de séance. |
| RM-072 | Aucun temps conventionnel n’est attribué aux Exercices en Répétitions ou À l’échec. Toute métrique estimée qui en comprend au moins un devient une borne minimale précédée de `≥` et additionne uniquement les temps connus de son propre périmètre. |
| RM-073 | Le temps total écoulé et la Durée réelle excluent uniquement les Pauses manuelles déclenchées par l’utilisateur. Ils incluent tout le temps effectivement exécuté dans le Compte à rebours initial, les Activités, les Pauses entre Séries, les phases `RECOVERY` et la Fin de séance. |
| RM-074 | Le Nombre d’Activités de la Composition compte les Activités définies par l’utilisateur une seule fois, sans développer Séries ni Tours et sans compter les Pauses ou Récupérations attachées. |
| RM-075 | Le Nombre total d’Activités à exécuter compte les occurrences d’Activité du plan développé après Séries et Tours, mais ne compte pas les phases `SERIES_PAUSE`, `RECOVERY`, le Compte à rebours initial ni la Fin de séance comme Activités. |
| RM-076 | Le Nombre d’Activités exécutées correspond aux Résultats d’Activité créés. Une Activité `Partielle` compte ; une Activité jamais atteinte ne compte pas. |
| RM-077 | La progression mathématique est continue. Chaque occurrence en Répétitions ou À l’échec pèse `1/N` ; la part restante est répartie entre les Activités chronométrées proportionnellement à leur durée. La piste peut être structurée visuellement par Tours conformément au prototype Figma, sans effet sur le calcul. |
| RM-159 | La Durée synthétique des Activités, affichée dans le Catalogue et la Composition, additionne les occurrences déterminables d’Activités, les Pauses entre Séries et les Récupérations attachées après développement des Séries et répétitions du Tour ; elle exclut toujours le Compte à rebours initial et la Fin de séance. Exprimée en secondes dans le Domaine, elle est convertie en minutes par arrondi à la minute supérieure (`Math.ceil`). Elle est distincte de la Durée estimée d’exécution définie par RM-071. |
| RM-125 | La fin de la dernière Activité déclenche `SESSION_END`. La clôture, l’enregistrement et la détermination du statut interviennent après son achèvement. Une durée de `0 s` l’achève immédiatement ; tout arrêt antérieur, y compris pendant cette phase, produit le statut `Interrompue`. L’écran suivant est la fin minimale dans T04, puis la Synthèse dans la tranche qui la livre. |
| RM-126 | La barre de progression couvre le Plan d’Exécution complet et inclut `INITIAL_COUNTDOWN` et `SESSION_END`. Elle atteint `100 %` uniquement à l’achèvement de `SESSION_END`. Dans T04, les étapes chronométrées sont pondérées proportionnellement à leur durée planifiée ; les occurrences en Répétitions ou À l’échec suivent RM-077 et leur part est acquise avec `Suivant`. Les Pauses manuelles sont exclues de l’avancement. |
| RM-127 | T04 accepte les Activités en Durée, Répétitions ou À l’échec, les Séries multiples, les Tours multiples et les passages bilatéraux. Elle refuse avant toute écriture uniquement un Plan invalide ou impossible à développer. |
| RM-128 | Dans T04, Sons et Annonces vocales sont activés par défaut. Aucun réglage utilisateur ni aucune préférence correspondante ne sont lus ou persistés par cette tranche ; la configuration depuis le Profil est hors T04. |

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
| RM-154 | Les éléments de navigation restent au premier plan et les contenus défilants ne doivent pas passer visuellement au-dessus d’eux. |
| RM-155 | Un contrôle segmenté répartit sa largeur intérieure également entre ses options ; chaque libellé et le fond sélectionné sont centrés dans la zone de leur option. |
| RM-156 | Un groupe d’actions de carte est ancré au bord droit intérieur de la carte avec une marge constante ; son espacement interne ne dépend pas de la largeur de l’écran. |
| RM-157 | Toute liste placée au-dessus d’une navigation fixe défile dans une zone bornée et conserve au moins `16` points d’espace visuel avant cette navigation. |
| RM-158 | Les cadres de synthèse utilisent la largeur utile et une hauteur déterminée par leur texte multi-ligne ; aucun texte de synthèse ne peut dépasser son cadre. |
| RM-160 | À l’ouverture d’une roulette avec confirmation explicite, le brouillon est initialisé avec la dernière valeur confirmée. Le défilement et le toucher de la bande de sélection ne ferment pas le contrôle et ne modifient pas la donnée persistée. |
| RM-161 | Annuler ferme la roulette et détruit le brouillon ; Confirmer enregistre exactement les valeurs centrées, actualise l’affichage hôte puis ferme. Une réouverture restitue cette dernière valeur confirmée. |
| RM-104 | Tout contrôle historique de type `pull-up`, `pull-down` ou menu numérique ouvre une roulette native OS. Pour une valeur scalaire, elle utilise une seule colonne et la variante DSF `Type=Numeric wheel`; aucune sélection n’est persistée sans action explicite Confirmer. |
| RM-105 | Le Compte à rebours initial et la Fin de séance conservent des valeurs et des brouillons indépendants. Les secondes d’une durée sont sélectionnables de `00` à `59`, par pas de `1`. |
| RM-106 | Les Catégories prédéfinies suivent leur `displayOrder`; les Catégories personnalisées sont affichées ensuite par date de création croissante. Une sélection ne change pas cet ordre et aucune réorganisation manuelle n’est proposée dans le MVP. |
| RM-107 | Une Catégorie personnalisée créée depuis le parcours de création d’une Séance reste dans le brouillon. Son existence temporaire est distincte de sa sélection : elle est sélectionnée automatiquement à la création, demeure visible après désélection et peut être resélectionnée sans doublon. La navigation Catégories ↔ Composition conserve les deux états. `Enregistrer la séance` persiste atomiquement la Séance, sa Composition, les nouvelles Catégories sélectionnées et leurs associations ; un abandon ou un échec ne crée aucune Catégorie orpheline. |
| RM-108 | En cas d’échec de l’enregistrement final, l’écran Catégories reste affiché, le brouillon complet est conservé, l’action est réactivée et le message `La séance n’a pas pu être enregistrée. Réessayez.` est affiché. Une nouvelle tentative est possible et aucune donnée partielle n’est conservée. |
| RM-109 | Le Catalogue sélectionne `Activités`, `Séances` ou `Circuits`. `Séances` est sélectionné par défaut à l’ouverture initiale et après relance complète ; `Activités` est actif à partir de T03 ; `Circuits` reste visible mais désactivé. |
| RM-110 | Sans filtre, toutes les Séances non archivées sont triées par dernière modification décroissante. Les filtres sont Toutes, Planifiées, Non planifiées, Archivées ; les tris initiaux portent uniquement sur dernière modification et nom. |
| RM-111 | Un Exercice À l’échec n’a ni durée ni répétitions cibles ; `Suivant` termine chaque Série comme en mode Répétitions. |
| RM-112 | Répétitions et À l’échec rendent la durée totale indéterminée ; l’affichage `≥` additionne uniquement les temps connus. |
| RM-113 | Une référence d’Activité du MVP T03 est copiée dans une Séance sans lien de propagation et ses copies ne figurent pas au catalogue. |
| RM-114 | Dans le MVP, une carte d’Activité du Catalogue peut être déployée/repliée pour afficher son média associé. Cette activation d’affichage n’introduit pas à elle seule d’import ou de capture supplémentaire dans l’éditeur. |
| RM-115 | Une association média est copiée indépendamment mais partage un fichier immuable ; le fichier n’est supprimé que sans aucune référence. |
| RM-116 | Un Circuit validé exige nom, couleur et au moins deux étapes. Une Séance peut apparaître plusieurs fois ; aucune répétition d’étape n’est définie. |
| RM-117 | L’écran de transition d’un Circuit est obligatoire. Il attend l’utilisateur en manuel ou passe automatiquement après la durée globale, `30 s` par défaut. |
| RM-118 | Chaque Séance conserve son compte à rebours initial. Une fin intermédiaire est remplacée par la transition et seule la dernière étape ouvre la fin du Circuit. |
| RM-119 | L’Exécution de Circuit et ses Exécutions de Séance liées utilisent un instantané immuable ; un arrêt confirmé conserve l’exécution partielle et ne crée rien pour les étapes futures. |
| RM-120 | Activités, Séances et Circuits peuvent être archivés. Un élément archivé reste valable dans ses usages existants mais n’est plus proposé à un nouvel usage. |
| RM-143 | Le `Changement de côté` d’une Activité propose `Aucun` (`UNILATERAL`), `D→G` (`RIGHT_LEFT`) et `G→D` (`LEFT_RIGHT`). Aucun réglage de côté n’est exposé au niveau Tour dans la version actuelle. |
| RM-144 | Une Activité autonome bilatérale exécute toutes ses Séries par côté, sans Pause entre côtés, puis une seule Récupération. |
| RM-145 | Le support technique historique de bilatéralité du Tour est conservé pour non-régression mais reste non exposé et contraint à `UNILATERAL` dans la version actuelle. |
| RM-146 | La direction effective exposée provient de l’Activité ; le Tour n’impose aucune direction à ses Activités dans la version actuelle. |
| RM-147 | Aucun contrôle ni confirmation d’activation bilatérale du Tour n’est exposé dans la version actuelle. |
| RM-148 | L’Exécution affiche `Côté droit` ou `Côté gauche` sous le nom de l’Activité, sans compteur de côté. La progression `Activité X/Y` ne change pas de rang entre les deux passages. |
| RM-149 | Réinitialiser ne touche que le côté courant. Confirmer la modale générique de passage anticipé sur le premier côté conserve un résultat partiel et ouvre le second côté. |
| RM-150 | Les résultats sont séparés par côté ; l’état global est partiel dès qu’un côté est partiel ou manquant après avancement. |
| RM-151 | Dans la Composition, une carte affiche sa direction propre `D→G` ou `G→D` lorsqu’elle est bilatérale ; aucune indication avec `Aucun`. Le Tour ne porte pas de direction exposée. |
| RM-152 | Dans l’écran Ajouter/Modifier une Activité, la synthèse bilatérale place la direction développée après la cible du mode et avant la Pause. Cette clause est absente avec `Aucun`. Dans une carte de Composition, le petit indicateur `D→G` ou `G→D` porte seul la direction. |
| RM-153 | Le libellé utilisateur est `Durée totale`; en Répétitions et À l’échec, `≥` signale une borne basse sans changer le calcul. |

## 12. Règles métier — Exécution directe d’une Activité — MVP T03

| ID | Règle |
|---|---|
| RM-096 | `Exécuter` est disponible uniquement pour une `ActivityDefinition` valide. |
| RM-097 | Le lancement crée un instantané autonome d’origine `ACTIVITY` sans Séance artificielle. |
| RM-098 | La préparation directe dure exactement `5 s` et n’est pas persistée dans la définition de l’Activité. |
| RM-099 | Le plan applique les règles communes de mode, Séries, Pauses, bilatéralité et Récupération, sans Tour, Cycle visible ni `SESSION_END`. |
| RM-100 | La dernière phase achevée déclenche le signal de fin puis la Synthèse. |
| RM-101 | Le Ressenti reste obligatoire lorsque la Synthèse est présentée ; `Terminer` reste désactivé avant sa sélection. |
| RM-102 | Le Suivi conserve l’origine `ACTIVITY` et les statistiques compatibles, sans incrémenter le nombre de Séances. |
| RM-103 | La finalisation restaure l’état antérieur du Catalogue des Activités pour l’aller-retour courant ; cet état n’est pas persisté après une fermeture/reprise complète de l’application. |
| RM-162 | Dans le Catalogue des Activités, un appui sur la carte hors bouton Lecture ouvre l’Activité en consultation ou modification ; le bouton Lecture lance uniquement l’Exécution directe. `Déployer` affiche/masque le média associé. Un swipe gauche sur une Activité active expose `Planifier / Dupliquer / Archiver`; dans les archives il expose `Supprimer`. |
| RM-163 | À la validation d’une sélection multiple d’Activités existantes, `CompositionService` copie les Activités sélectionnées dans l’ordre où elles sont présentées par la liste filtrée à cet instant. L’ordre des actions de sélection n’est pas conservé comme ordre métier. |
| RM-188 | Un filtre de Catalogue persiste uniquement pendant la session applicative courante. Au relaunch, aucun filtre n’est appliqué ; l’état étendu affiche `Filtres / Aucun` jusqu’à sélection d’un critère. |
| RM-189 | Toutes les roulettes des écrans actifs s’ouvrent dans une modale basse standardisée avec `Annuler / Confirmer`. |
| RM-190 | Une Activité peut porter un Compte à rebours propre et une Fin d’activité propre, distincts des phases structurelles de Séance. |
| RM-191 | Un Point d’arrêt suspend l’enchaînement jusqu’à reprise explicite et son attente est exclue de la durée de la Séance. |
| RM-192 | Le parcours de composition exposé sélectionne les Activités dans le Catalogue ; la création locale de SessionActivity reste techniquement et fonctionnellement disponible mais non exposée dans cet enchaînement. |
| RM-164 | Lorsqu’une roulette est ouverte, le voile grisé bloque l’arrière-plan. Le bouton principal fixe inférieur reste visuellement inchangé mais devient fonctionnellement désactivé et non déclenchable via VoiceOver/TalkBack jusqu’à fermeture de la roulette. |

# Processus métier et règles métier transverses

> Planification à plusieurs contenus (08/10) : les règles antérieures d’archivage supprimant les Routines associées restent décrites pour le cas à contenu unique. Leur extension à une Routine contenant d’autres contenus est **non définie** ; ne pas supprimer ces autres planifications par généralisation. Voir la chapitre 08, Planification.

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
| RM-013 | **Supersédée par D-221.** Aucune recherche globale ni recherche locale de Catalogue n’est incluse dans le MVP. |
| RM-014 | L’état vide du Catalogue permet de lancer la création de la première Séance. |

## 2. Création et modification d’une Séance

| ID | Règle |
| --- | --- |
| RM-015 | La création s’effectue dans un écran unique `Composer une séance` ; il n’existe plus d’écran préalable réservé au nom. |
| RM-016 | Une couleur est proposée par défaut et peut être choisie dans une palette prédéfinie de 12 couleurs organisée en 4 × 3. |
| RM-017 | `Continuer` reste désactivé tant que le nom est vide ou qu’aucun Exercice valide n’est présent. L’Étiquette est facultative ; lorsqu’elle est renseignée, sa couleur devient celle de la Séance. |
| RM-018 | Retour pendant une création commencée ouvre un dialogue flottant centré. `Annuler`, action neutre, conserve les données ; `Confirmer`, action destructive rouge, supprime le brouillon et revient au Catalogue. |
| RM-019 | La Composition expose un seul bouton global `+ Ajouter un exercice`. |
| RM-020 | Le premier Exercice créé est insérée après le Compte à rebours initial et avant le Circuit. Les suivantes sont insérées après le dernier Exercice existant de la Composition ; toutes peuvent ensuite être déplacées manuellement avant, dans ou après le Circuit. |
| RM-021 | Toucher brièvement une carte d’Exercice ouvre directement son édition. Un appui long amorce son déplacement ; l’ordre et la position structurelle ne sont modifiés qu’à la dépose dans une destination valide. La duplication et la suppression sont accessibles par glissement gauche dans la Composition. Dupliquer crée une copie indépendante avec un nouvel identifiant, le suffixe de nom `(copie)` puis numéroté si nécessaire, tous les paramètres et associations média de la source ; la copie est placée immédiatement après la source dans la même zone structurelle et ne crée aucun Exercice dans le catalogue. Cette règle d’appui long ne s’applique pas au Compte à rebours initial ni à la Fin de séance, qui ne sont pas déplaçables. |
| RM-022 | La Séance est classée par Étiquette ; la couleur affichée de la Séance est celle de cette Étiquette. |
| RM-023 | Une Catégorie qualifie un Exercice et porte sa couleur sémantique ; les Zones corporelles restent distinctes. |
| RM-024 | L’enregistrement des Catégories termine la création ou la modification et revient au `Catalogue des séances`, segment `Séances` sélectionné. |
| RM-124 | Dans le MVP, la création d’une Catégorie personnalisée attribue automatiquement l’icône officielle KODJO et la couleur blanche issue du token sémantique `color.background` (`#FFFFFF`) du Design System. Ces deux valeurs sont persistées mais non modifiables par l’utilisateur. La couleur de la Séance reste choisie indépendamment de ses Catégories. |

## 3. Composition, Tour et Cycle technique

| ID | Règle |
| --- | --- |
| RM-025 | Une Séance contient exactement un Tour visible et un Cycle technique. |
| RM-026 | Le Circuit est le conteneur ordonné d’Exercices ; un Tour est une exécution complète. Le nombre de Tours vaut de 1 à 99, avec 1 par défaut . |
| RM-027 | Le nombre de Tours est modifié avec un contrôle compact affichant uniquement `N`, sans préfixe `x` ni signe `×`, et ouvrant un sélecteur. Son bord droit est aligné avec celui des cartes d’Exercice. Les boutons `+ / −` et le chevron de repli ne font pas partie de l’UX de référence. |
| RM-028 | Le Cycle est conservé pour l’évolutivité du modèle. Dans le MVP, son nombre de répétitions vaut toujours 1, n’est pas modifiable et n’est jamais affiché. |
| RM-029 | Des Exercices peuvent être placées avant le Circuit, dans le Circuit ou après le Circuit. Leur ordre est persistant. |
| RM-030 | Le Compte à rebours initial et la Fin de séance sont structurellement présents. Une valeur de 0 seconde rend la phase instantanée sans la supprimer. Ces deux cartes structurelles ne sont pas déplaçables et n’acceptent aucun appui long de déplacement. |
| RM-031 | Les valeurs initiales de l’application sont de 10 secondes pour le Compte à rebours initial et de 5 secondes pour la Fin de séance. |
| RM-032 | Une modification des valeurs globales s’applique aux nouvelles Séances ; elle ne modifie pas une Séance existante ni une Exécution en cours. |

## 4. Exercices, Séries et Récupérations

| ID | Règle |
| --- | --- |
| RM-033 | Deux modes communs à l’Exercice : Durée et Répétitions. Chaque Série porte une cible chiffrée dans l’unité du mode ou une cible À l’échec. Cette dernière n’est ni un troisième mode, ni une cible manquante. Aucun type Exercice/Récupération ne revient. |
| RM-034 | Uniforme : cible/Pause communes ; variable : paramètres ordonnés propres à chaque Série. PC intrinsèque ; R contextuelle à l’occurrence. |
| RM-035 | Toute Exercice possède un nombre entier de Séries de 1 à 99  ; la valeur initiale est 1. |
| RM-036 | Une Série est une définition cible/Pause subordonnée à l’Exercice ; N1..99 par côté, modes non mélangés. Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : chapitre 10, Calculs des durées et ordre des phases. |
| RM-037 | L’ordre d’exécution vient du paramètre Ordre des côtés : Un côté après l’autre (défaut) ou Les deux côtés à chaque série. En bilatéral N est toujours par côté, paramètres communs aux deux côtés. Les successions et pauses sont celles de chapitre 08, paramètres d’exercice ; aucun repli de PC vers la Pause. Les cibles et Pauses variables proviennent de la ligne courante. |
| RM-038 | Récupération ajoutée explicitement à l’occurrence ;0 sans phase ; positive après l’Exercice à chaque Tour concerné. R positive remplace seulement la dernière Pause ; sa suppression la rétablit. |
| RM-039 | Un nouvel Exercice valide est associé à une ou plusieurs Zones corporelles ; la sélection reste multiple. |
| RM-040 | Les Zones corporelles constituent un référentiel utilisateur administrable : sélection multiple sur un Exercice, création, renommage et suppression sont autorisés dans le MVP. Une suppression utilisée demande confirmation, retire la valeur des choix futurs, conserve les associations des Exercices existants et préserve les Instantanés/Exécutions historiques. |
| RM-200 | Dans les modales de sélection des Étiquettes, Catégories et Zones corporelles, l’appui court valide et ferme une sélection simple ou sélectionne/désélectionne en sélection multiple  ; l’appui long ouvre une confirmation de suppression sans modifier la sélection. Toutes les valeurs sont supprimables, initiales comme personnalisées. `Annuler` ne modifie rien ; `Supprimer` retire la valeur des nouveaux choix, conserve les affectations existantes sur les objets déjà enregistrés, puis conserve la modale de sélection ouverte. L’historique reste inchangé. |
| RM-041 | Dans le MVP, le média associé à un Exercice est affiché dans la gouttière permanente de sa carte Catalogue, sans déploiement . L’import/ajout local et les associations ordonnées sont inclus au MVP dans PRE-3 , sans activation implicite de la caméra. |
| RM-042 | L’action de validation de l’édition d’un Exercice est libellée `Terminer`. |
| RM-129 | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel. |
| RM-130 | En Durée uniforme seulement, saisie Tv recalcule N1..99 au plus proche, égalité vers le haut, avec normalisation N=1 ; réafficher T(N), message si différent. En variable aucune inversion ; chapitre 08, paramètres d’exercice. |
| RM-131 | La ligne active de roulette/segmenté porte le contour ; les steppers restent permanents sans contour pilote. Le total variable/Répétitions est en lecture seule ; aucun état pilote persisté. |
| RM-132 | Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. |

## 5. Planification et Calendrier

| ID | Règle |
| --- | --- |
| RM-043 | Une Routine porte une liste ordonnée de références SESSION/ACTIVITY ; chaque contenu filtre les occurrences générées par le créneau . |
| RM-044 | Routine unique ou répétée,0..1 rappel. Le repère visuel mono-source reste défini par sa source ; l’agrégation visuelle d’un créneau mixte n’est pas déduite arbitrairement. |
| RM-045 | Les vues Jour, Semaine et Mois du Calendrier font partie du MVP ; la vue Jour est la vue initiale. |
| RM-046 | En vue Semaine, la liste et le sélecteur de jour sont synchronisés : le jour en tête de liste devient le jour sélectionné, et sélectionner un jour positionne sa section en tête. |
| RM-047 | Pour l’unité Semaine, la semaine contenant le début est l’ancrage ; fréquence N semaines, jours sélectionnés, bornes inclusives. Ne définit pas les règles Jour/Mois. |
| RM-048 | Une occurrence future peut être exécutée en avance depuis l’action contextuelle disponible sur sa carte. Elle n’est ensuite pas reproposée à son horaire initial. |
| RM-049 | Une occurrence passée sans Exécution disparaît de l’interface et n’est pas ajoutée au Suivi du MVP. |
| RM-050 | Supprimer une Routine demande une confirmation et ne supprime ni sa source planifiée ni les Exécutions historiques. |
| RM-123 | Dupliquer une Routine prépare un brouillon avec la liste ordonnée des contenus, leurs motifs et les paramètres ; aucune persistance avant Enregistrer. |
| RM-206 | Un Exercice persistant actif peut être planifié directement. Son archivage met fin aux occurrences futures de ses Routines selon la même règle de conservation historique que pour une Séance : les occurrences historisées, Exécutions et Instantanés restent conservés. Sa restauration ne recrée pas automatiquement les anciennes Routines. |
| RM-207 | Dans les Catalogues des Séances et des Exercices, une carte affiche la prochaine occurrence future de sa source lorsqu’elle existe. En l’absence d’occurrence future, la ligne de prochaine planification est absente et ne réserve aucun espace. |

## 6. Notifications et rappels

| ID | Règle |
| --- | --- |
| RM-051 | Les notifications ne sont pas autorisées ni activées par défaut par l’application. |
| RM-052 | La demande d’autorisation système est déclenchée dans le contexte de la première activation d’un rappel pendant une planification. |
| RM-053 | En cas de refus ou d’indisponibilité de l’autorisation, le rappel reste désactivé ; la planification peut néanmoins être enregistrée. |
| RM-054 | Les notifications locales sont planifiées selon la stratégie technique définie au chapitre 12. |
| RM-054a | Rappel par interrupteur ; activé :5 min/15 min/30 min/1 h/Autre, options de même largeur. Aucun n’est plus une option. |

## 7. Exécution d’une Séance

| ID | Règle |
| --- | --- |
| RM-055 | Chaque démarrage crée une Exécution distincte fondée sur un Instantané immuable de la Séance. |
| RM-056 | L’entrée dans l’Exécution ne démarre pas immédiatement le décompte. L’utilisateur déclenche explicitement le démarrage. |
| RM-057 | Une Exécution peut être `En cours`, `Suspendue`, `Terminée`, `Partielle` ou `Interrompue`. |
| RM-058 | Bip commun entier0..10 dans les deux modes,0=Aucun. Périodique pendant Série ; ne termine aucune Série. Durée chiffrée : minuteur ; Répétitions et toute cible À l’échec : Suivant. Aucun nominal pour une cible À l’échec. En Répétitions à l’échec, nombre de bips logiques proposé comme relevé estimé, confirmé/corrigé explicitement pour devenir déclaré. |
| RM-059 | Suivant termine normalement toute Série en Répétitions et toute Série à cible À l’échec, y compris en Durée, sans confirmation de fin. Il ne confirme pas implicitement un relevé estimé. |
| RM-060 | Pour un Exercice chronométré non arrivée à zéro, `Exercice suivant` demande confirmation. Si elle est confirmée, le Résultat d’Exercice est `Partielle` et l’Exécution continue. |
| RM-061 | Un Exercice chronométré arrivée à zéro se termine automatiquement. |
| RM-062 | `Réinitialiser l’exercice` recommence la Série courante en unilatéral ou le bloc du côté courant en bilatéral, dans les deux ordres (D-029/D-150, chapitre 08, paramètres d’exercice). L’autre côté et le temps actif réel cumulé sont conservés ; seule la progression du périmètre est remise à zéro. Pendant `SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY`, l’action devient `Réinitialiser la récupération` et recommence uniquement la phase courante ; les Séries déjà acquises et les Résultats antérieurs restent inchangés. |
| RM-063 | Aucun retour à un Exercice précédente et aucune sélection libre d’une autre Exercice ne font partie du MVP. |
| RM-064 | Après une interruption technique d’une Exécution en cours, l’utilisateur doit choisir `Reprendre la séance` ou `Arrêter la séance` avant d’en démarrer une nouvelle. |
| RM-065 | Le bouton Retour de l’Exécution revient au contexte réel de lancement. Dans le prototype de démonstration, il revient au Catalogue des séances non vide. |
| RM-065a | Pendant `SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY`, un passage anticipé avant zéro demande confirmation. Si elle est confirmée, la durée partielle de la phase courante est enregistrée et le Plan poursuit vers son étape suivante ; les Séries déjà acquises ne sont pas rejouées. Un arrêt de la Séance pendant une phase de récupération produit le statut `Interrompue`. |

## 8. Arrière-plan, verrouillage et sécurité temporelle

| ID | Règle |
| --- | --- |
| RM-066 | Une Exécution chronométrée ne se fige pas lorsque l’application passe en arrière-plan ou que l’écran se verrouille. |
| RM-067 | L’état temporel est fondé sur des horodatages de référence ; au retour, l’application recalcule la position qui aurait dû être atteinte. |
| RM-068 | Sans interaction, une pause de sécurité intervient 30 minutes après la fin théorique d’un Exercice chronométré ou la fin nominale recalculée d’une Série cadencée. |
| RM-069 | Toute cible À l’échec, avec/sans bip et dans les deux modes, ainsi que Répétitions chiffrées sans bip : pause de sécurité après2h sans interaction. Répétitions chiffrées avec bip :30min après nominal recalculé. Durée chiffrée conserve ses transitions chronométrées. |
| RM-070 | Les limites des mécanismes natifs en arrière-plan doivent être validées sur appareils iOS et Android réels conformément au chapitre 12. |

## 9. Calculs et progression

| ID | Règle |
| --- | --- |
| RM-071 | Hors règles propres des formats (RM-et RM-), La Durée estimée d’exécution agrège les étapes contributives du Plan développé complet, Compte à rebours initial et Fin de séance compris. Les durées d’occurrence appliquent chapitre 08, paramètres d’exercice : R positive remplace uniquement la dernière PN ; aucune Pause, Pause entre les côtés ou Récupération n’est comptée deux fois. Les Compte à rebours/Fin propres des Exercices sont toujours exclus du plan de Séance, du total prévu et de la pondération de progression ; aucune option ne les réactive. L’incertitude suit RM-072. |
| RM-072 | Hors règles propres des formats (RM-FMT-20–27 et RM-FMT-33–38), Exercice : exact en Durée, ≈ en Répétitions avec bip, omitted en Répétitions sans bip et À l’échec. Séance : exact si tout exact, ≈ avec estimation sans inconnu, ≥ avec travail inconnu. Bip v2 gouverne calculs et périmètres. |
| RM-073 | Le temps total écoulé et la Durée réelle excluent uniquement les Pauses manuelles déclenchées par l’utilisateur. Ils incluent le Compte à rebours initial, les Exercices, les Pauses entre Séries, `SIDE_RECOVERY`, `POST_ACTIVITY_RECOVERY` et la Fin de séance. |
| RM-074 | Le Nombre d’Exercices de la Composition compte les Exercices définies par l’utilisateur une seule fois, sans développer Séries ni Tours et sans compter les Pauses ou les deux types de récupération. |
| RM-075 | Hors règles propres des formats (RM-FMT-20–27 et RM-FMT-33–38), Le Nombre total d’Exercices à exécuter compte les occurrences d’Exercice du plan développé après Séries et Tours, mais ne compte pas `SERIES_PAUSE`, `SIDE_RECOVERY`, `POST_ACTIVITY_RECOVERY`, le Compte à rebours initial ni la Fin de séance comme Exercices. |
| RM-076 | Le Nombre d’Exercices exécutés correspond aux Résultats d’Exercice créés. Un Exercice `Partielle` compte ; un Exercice jamais atteinte ne compte pas. |
| RM-077 | Pour les plans finis à compte borné hors fenêtres de formats, le calcul porte sur le plan développé et conserve la piste existante. M compte les étapes contributives ; R compte toutes les Séries à cible À l’échec et les Séries Répétitions chiffrées sans cadence ; T somme les durées des phases chronométrées positives et les Ri×Ci des Séries Répétitions à cible chiffrée cadencées. Chaque Série sans durée déterminable pèse1/M ; chaque étape temporelle de durée d pèse(1−R/M)×d/T. Sans R, poids d/T ; sans T, poids1/M. Phases0s, Pause manuelle et attente de point n’ont aucun poids. Les non-cadencées/À l’échec acquièrent leur part à Suivant ; les Répétitions chiffrées avec bip progressent continûment, Suivant acquiert leur reste. À fin nominale, part de Série100% mais Série active. Pause abandonne la fraction d’intervalle pour la progression, conserve le temps réel ; reprise sur intervalle complet. Aucun100% global publié avant finalisation du plan. Poids figés au départ ; reset remet à zéro son périmètre seulement. Aucun nouveau composant de progression par Série. |
| RM-159 | La Durée synthétique du Catalogue porte sur la durée intrinsèque des Exercices, incluant `sideRecoverySeconds` éventuel. Dans la Composition/Séance, il utilise les durées d’occurrence avec récupération explicite (To=T−PN+R si R>0, sinon To=T pour un travail calculable), puis développe les Tours sans ajouter R une seconde fois ; il exclut toujours le Compte à rebours initial et la Fin de séance. Exprimée en secondes dans le Domaine, elle est convertie en minutes par arrondi à la minute supérieure (`Math.ceil`). Elle est distincte de la Durée estimée d’exécution définie par RM-071. |
| RM-125 | Hors règles propres des formats (RM-FMT-20–27 et RM-FMT-33–38), La fin de le dernier Exercice déclenche `SESSION_END`. La clôture, l’enregistrement et la détermination du statut interviennent après son achèvement. Une durée de `0 s` l’achève immédiatement ; tout arrêt antérieur, y compris pendant cette phase, produit le statut `Interrompue`. L’écran suivant est la fin minimale dans T04, puis la Synthèse dans la tranche qui la livre. |
| RM-126 | Hors règles propres des formats (RM-FMT-20–27 et RM-FMT-33–38), La barre de progression couvre le Plan d’Exécution complet et inclut `INITIAL_COUNTDOWN` et `SESSION_END`. Elle atteint `100 %` uniquement à l’achèvement de `SESSION_END`. Dans T04, les étapes chronométrées sont pondérées proportionnellement à leur durée planifiée ; les occurrences à cible À l’échec (les deux modes), ou Répétitions chiffrées sans cadence acquièrent leur part avec Suivant ; les Répétitions chiffrées cadencées suivent la progression temporelle RM-077 sans fin automatique. Les Pauses manuelles sont exclues de l’avancement. |
| RM-127 | T04 accepte les Exercices en Durée ou Répétitions, avec cible chiffrée ou À l’échec par série, les Séries multiples, les Tours multiples et les passages bilatéraux. Elle refuse avant toute écriture uniquement un Plan invalide ou impossible à développer. |
| RM-128 | Dans T04, Sons et Annonces vocales sont activés par défaut. Aucun réglage utilisateur ni aucune préférence correspondante ne sont lus ou persistés par cette tranche ; la configuration depuis le Profil est hors T04. |

## 10. Synthèse, Suivi et historique

| ID | Règle |
| --- | --- |
| RM-078 | Le Ressenti est obligatoire lorsque l’écran de Synthèse est présenté. Il peut être absent après une interruption technique sans passage par la Synthèse. |
| RM-079 | Le Commentaire de Synthèse est facultatif et limité à 200 caractères. |
| RM-080 | `Enregistrer` reste désactivé tant qu’aucun Ressenti n’est sélectionné, puis enregistre la Synthèse et ouvre le Suivi. |
| RM-081 | La cible Formats ajoute l’achèvement fonctionnel incomplet du Death by avec motif/résultat distincts ; son mapping physique reste à qualifier. Le Suivi conserve les Exécutions `Terminées`, `Partielles` et `Interrompues`. |
| RM-082 | Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivées dans le MVP. |
| RM-083 | Chaque Résultat d’Exercice conserve les informations nécessaires à sa restitution, notamment sa position, ses indices de Série et de Tour, son statut et sa durée réelle. Le Cycle technique peut être conservé dans les données mais n’est jamais affiché. |
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
| RM-093 | Les termes `Séance`, `Exercice`, `Circuit`, `Récupération`, `Série`, `Tour`, `Routine` et `Exécution` sont utilisés conformément au glossaire et de manière uniforme. |
| RM-094 | Les écrans respectent les Safe Areas du système, y compris l’inset inférieur sous la navigation fixe. |
| RM-095 | Les cibles tactiles principales respectent une zone commune minimale de 44 × 44 points logiques (RG-7 du 30 septembre ; cibles spécifiques de 48 conservées) sur iOS et Android, même si leur représentation visuelle est plus petite. Un conteneur tactile ou un `hitSlop` étend les contrôles compacts sans agrandir leur pictogramme. |
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
| RM-109 | Le Catalogue sélectionne `Exercices` ou `Séances`. `Séances` est sélectionné par défaut à l’ouverture initiale et après relance complète ; `Exercices` est actif à partir de T03 ; `Parcours` est absent du sélecteur. |
| RM-110 | Sans filtre, toutes les Séances non archivées sont triées par dernière modification décroissante. Les filtres sont Toutes, Planifiées, Non planifiées, Archivées ; les tris initiaux portent uniquement sur dernière modification et nom. |
| RM-111 | Absorbée par RM-033 : À l’échec est une cible par Série dans chacun des deux modes ; aucune valeur numérique prescrite, fin normale par Suivant. |
| RM-112 | Exercice : exact en Durée, ≈ en Répétitions avec bip, omitted en Répétitions sans bip et À l’échec. Séance : exact si tout exact, ≈ avec estimation sans inconnu, ≥ avec travail inconnu. Bip v2 gouverne calculs et périmètres. |
| RM-113 | Une référence d’Exercice du MVP T03 est copiée dans une Séance sans lien de propagation et ses copies ne figurent pas au catalogue. |
| RM-114 | Dans le MVP, une carte d’Exercice du Catalogue affiche son média associé dans une gouttière permanente ; sans média, l’icône de nature occupe la même place. Aucun déploiement n’est accessible . Cette activation d’affichage n’introduit pas à elle seule d’import ou de capture supplémentaire dans l’éditeur. |
| RM-115 | Une association média est copiée indépendamment mais partage un fichier immuable ; le fichier n’est supprimé que sans aucune référence. |
| RM-116 | **Retirée de la cible par D-328 (08/10).** Ancienne règle autonome : Un Parcours validé exige nom, couleur et au moins deux étapes. Une Séance peut apparaître plusieurs fois ; aucune répétition d’étape n’est définie. |
| RM-117 | **Retirée de la cible par D-328 (08/10).** Ancienne règle autonome : L’écran de transition d’un Parcours est obligatoire. Il attend l’utilisateur en manuel ou passe automatiquement après la durée globale, `30 s` par défaut. |
| RM-118 | **Retirée de la cible par D-328 (08/10).** Ancienne règle autonome : Chaque Séance conserve son compte à rebours initial. Une fin intermédiaire est remplacée par la transition et seule la dernière étape ouvre la fin du Parcours. |
| RM-119 | **Retirée de la cible par D-328 (08/10).** Ancienne règle autonome : L’Exécution de Parcours et ses Exécutions de Séance liées utilisent un instantané immuable ; un arrêt confirmé conserve l’exécution partielle et ne crée rien pour les étapes futures. |
| RM-120 | Exercices et Séances peuvent être archivés ; ancien objet autonome Parcours retiré par D-328. Un élément archivé reste valable dans ses usages existants mais n’est plus proposé à un nouvel usage. |
| RM-143 | Le `Changement de côté` d’un Exercice propose `Aucun` (`UNILATERAL`), `D→G` (`RIGHT_LEFT`) et `G→D` (`LEFT_RIGHT`). Aucun réglage de côté n’est exposé au niveau Tour dans la version actuelle. |
| RM-144 | Un Exercice autonome bilatéral exécute toutes ses Séries par côté, sans Pause entre côtés, puis une seule Récupération. |
| RM-145 | Le support technique historique de bilatéralité du Tour est conservé pour non-régression mais reste non exposé et contraint à `UNILATERAL` dans la version actuelle. |
| RM-146 | La direction effective exposée provient de l’Exercice ; le Tour n’impose aucune direction à ses Exercices dans la version actuelle. |
| RM-147 | Aucun contrôle ni confirmation d’activation bilatérale du Tour n’est exposé dans la version actuelle. |
| RM-148 | L’Exécution affiche `Côté droit` ou `Côté gauche` sous le nom de l’Exercice, sans compteur de côté. La progression `Exercice X/Y` ne change pas de rang entre les deux passages. |
| RM-149 | Réinitialiser ne touche que le côté courant. Confirmer la modale générique de passage anticipé sur le premier côté conserve un résultat partiel et ouvre le second côté. |
| RM-150 | Les résultats sont séparés par côté ; l’état global est partiel dès qu’un côté est partiel ou manquant après avancement. |
| RM-151 | Dans la Composition, une carte affiche sa direction propre `D→G` ou `G→D` lorsqu’elle est bilatérale ; aucune indication avec `Aucun`. Le Tour ne porte pas de direction exposée. |
| RM-152 | Dans l’écran Ajouter/Modifier un Exercice, la phrase unique suit RM-232/D-298 : cible/cadence, Pause, puis côtés selon le contexte ; deux directions et deux ordres distingués. La clause de côté est absente avec `Aucun`. Dans une carte de Composition, le petit indicateur `D→G` ou `G→D` porte seul la direction. |
| RM-153 | **Supersédée par RM-232 / D-298** pour la phrase active v1. |

## 12. Règles métier — Exécution directe d’un Exercice — MVP T03

| ID | Règle |
|---|---|
| RM-096 | `Exécuter` est disponible uniquement pour une `ActivityDefinition` valide. |
| RM-097 | Le lancement crée un instantané autonome d’origine `ACTIVITY` sans Séance artificielle. |
| RM-098 | La préparation directe dure exactement `5 s` et n’est pas persistée dans la définition de l’Exercice. |
| RM-099 | Le plan applique les règles communes de mode, Séries, Pauses, bilatéralité et Récupération, sans Tour, Cycle visible ni `SESSION_END`. |
| RM-100 | La dernière phase achevée déclenche le signal de fin puis la Synthèse. |
| RM-101 | Le Ressenti reste obligatoire lorsque la Synthèse est présentée ; `Enregistrer` reste désactivé avant sa sélection. |
| RM-102 | Le Suivi conserve l’origine `ACTIVITY` et les statistiques compatibles, sans incrémenter le nombre de Séances. |
| RM-103 | La finalisation restaure l’état antérieur du Catalogue des Exercices pour l’aller-retour courant ; cet état n’est pas persisté après une fermeture/reprise complète de l’application. |
| RM-162 | Dans le Catalogue des Exercices, un appui sur la carte hors bouton Lecture ouvre l’Exercice en consultation ou modification ; le bouton Lecture lance uniquement l’Exécution directe. `Déployer` affiche/masque le média associé. Un swipe gauche sur un Exercice active expose `Planifier / Dupliquer / Archiver`; dans les archives il expose `Supprimer`. |
| RM-163 | À la validation d’une sélection multiple d’Exercices existants, `CompositionService` copie les Exercices sélectionnés dans l’ordre où ils sont présentés par la liste filtrée à cet instant. L’ordre des actions de sélection n’est pas conservé comme ordre métier. |
| RM-188 | Un filtre de Catalogue persiste uniquement pendant la session applicative courante. Au relaunch, aucun filtre n’est appliqué ; l’état étendu affiche `Filtres / Aucun` jusqu’à sélection d’un critère. |
| RM-189 | Toutes les roulettes des écrans actifs s’ouvrent dans une modale basse standardisée avec `Annuler / Confirmer`. |
| RM-190 | Un Exercice peut porter un Compte à rebours propre et une Fin d’exercice propre, distincts des phases structurelles de Séance. |
| RM-191 | Un Point d’arrêt suspend l’enchaînement jusqu’à reprise explicite et son attente est exclue de la durée de la Séance. |
| RM-192 | Le parcours de composition exposé sélectionne les Exercices dans le Catalogue ; la création locale de SessionActivity reste techniquement et fonctionnellement disponible mais non exposée dans cet enchaînement. |
| RM-164 | Lorsqu’une roulette est ouverte, le voile grisé bloque l’arrière-plan. Le bouton principal fixe inférieur reste visuellement inchangé mais devient fonctionnellement désactivé et non déclenchable via VoiceOver/TalkBack jusqu’à fermeture de la roulette. |

## RM-203 — Consultation média pendant l’Exécution

- **RM-203.1** — Sans média, aucun bouton de changement de face n’est affiché.
- **RM-203.2** — Le changement de face ne met jamais l’Exécution en pause.
- **RM-203.3** — La galerie respecte l’ordre défini pour l’Exercice et un swipe ne change que d’un média.
- **RM-203.4** — La galerie est bornée et non circulaire.
- **RM-203.5** — Une vidéo exige une action Lecture et ne démarre jamais automatiquement.
- **RM-203.6** — Le son vidéo est actif par défaut ; une annonce vocale KODJO déclenche une baisse temporaire de son volume.
- **RM-203.7** — Retour Information ou changement de média met la vidéo en pause.
- **RM-203.8** — Face et média courant sont mémorisés uniquement pendant la séance courante et réinitialisés entre séances.
- **RM-203.9** — Le plein écran n’interrompt pas le moteur et conserve un cadre flottant d’Exécution.
- **RM-203.10** — La fin de l’Exercice ferme son média / plein écran avant la transition normale.
- **RM-203.11** — Un média indisponible n’interrompt ni l’Exécution ni l’accès aux autres médias.

Ces règles décrivent une conception post-MVP à planifier.

| RM-208 | Ancienne extension à une source Parcours autonome retirée. La planification multi-contenus utilise les sources SESSION/ACTIVITY de chaque entrée. |

| RM-209 | Aucune récupération automatique à la création d’une occurrence. Une récupération explicite est proposée au défaut Profil (30 s initialement) lors de son ajout ; elle reste solidaire de son occurrence. postActivityRecoverySeconds est sa projection de calcul, 0 en l’absence de récupération . |
| RM-210 | La récupération après exercice se déplace avec l’occurrence, est copiée lors de sa duplication et supprimée avec elle ; aucun recalcul ne dépend de l’adjacence. |
| RM-211 | Une Exécution directe d’`ActivityDefinition` n’exécute jamais de récupération post-exercice ; elle peut uniquement exécuter la Pause entre les côtés si l’Exercice est bilatéral. |
| RM-212 | `sideRecoverySeconds` est initialisé depuis le défaut global **Pause entre les côtés** du Profil (`10 s` dans le Figma de référence) lorsqu’un Exercice passe de `Aucun` à `D→G` ou `G→D`; la valeur reste modifiable dans l’éditeur de l’Exercice. |

## Règles RM-213 à RM-221 — consolidation du 26 septembre 2026

| ID | Règle |
|---|---|
| RM-213 | Un Circuit est le groupe ordonné d’Exercices interne à une Séance ; un Tour est une répétition complète de ce Circuit. Un élément interne au Circuit est exécuté à chaque Tour sauf règle explicite contraire. |
| RM-214 | Un nouvel Exercice n’est valide qu’avec exactement une Catégorie et au moins une Zone corporelle ; plusieurs Zones corporelles sont autorisées. Une Étiquette de Séance reste facultative. |
| RM-215 | Supprimer une valeur de référentiel la retire des nouvelles sélections mais conserve ses affectations existantes. Une valeur supprimée déjà affectée peut rester lors d’un enregistrement ultérieur ; si elle est remplacée, elle ne peut plus être réaffectée. |
| RM-216 | Modifier la couleur d’une Étiquette/Catégorie modifie le rendu de tous les objets qui la référencent. Une valeur retirée conserve sa dernière couleur sur les objets existants. |
| RM-217 | Les défauts Profil n’ont aucun effet rétroactif sur les Exercices/Séances déjà créés. |
| RM-218 | Dans une Séance, les Compte à rebours d’exercice et Fin d’exercice ne sont jamais exécutés ; seuls le Compte à rebours initial et la Fin de séance s’appliquent, une fois, par substitution. Aucun booléen ni contrôle d’activation n’existe à cet effet. Les valeurs propres restent conservées pour l’exécution de l’Exercice seul. |
| RM-219 | Après un Exercice, la Récupération après exercice est exécutée avant un éventuel Point d’arrêt. Aucun Point d’arrêt juste après le Compte à rebours initial ni juste avant la Fin de séance. |
| RM-220 | Un Point d’arrêt peut être placé avant/après le Circuit et entre ses Exercices ; s’il est dans le Circuit, il est rencontré à chaque Tour. |
| Ancienne RM-221 (phrase, historique) | Supersédée par RM-232 / D-298 ; la RM-221 active ci-dessous porte sur les Catalogues. |

| RM-221 | Les Catalogues du MVP ne proposent aucune recherche globale ou locale ; filtres et tri restent les mécanismes de réduction/organisation disponibles selon leur périmètre. |
| RM-222 | En planification, cases à cocher pour un ou plusieurs contenus ; valider par Ajouter 1 élément / Ajouter n éléments. Le toucher ne ferme pas la modale. La Composition et les référentiels conservent leurs contrats propres. |
| RM-223 | Planifier sans contenu ; Planifier une séance ou Planifier un exercice à contenu unique ; Planifier un parcours à plusieurs contenus, de même type ou mixtes. Aucun objet autonome Parcours. |

| RM-231 | **Supersédée par RM-232 / D-298.** |
| RM-232 | Phrase v1 étendue : segments {texte, gras}, sans persistance. Cibles variables énumérées jusqu’à3 ; au-delà, mélange compacté « de 10 rép. à l’échec » / « de 1 min 30 s à l’échec » selon minimum numérique. Tout échec : formulation existante. Total fourni par le calcul, ≥ pour mélange calculable ; sans bip en Répétitions ou tout échec : omis. Pauses variables non énumérées. Compte à rebours/Fin hors phrase. Excel exclusivement rédactionnel. Voir chapitre 08, Phrase de synthèse. |

| RM-233 | Au changement de mode, conserver les paramètres communs et, pendant l’édition, la dernière valeur spécifique de chaque mode. Après la première sélection, aucun retour à l’état « aucun mode » ; `Terminer` reste désactivé avant cette première sélection. |
| RM-234 | Séries `1..99`; Répétitions `1..100`; Durée par Série `5..3535 s`; pauses inter-Séries/inter-côtés `0..300 s`. Les deux pauses utilisent un stepper : tap1s, maintien accéléré1/5/10 selon DSF Bip. |

## RG des cartes — 30 septembre 2026

Décisions finales du propriétaire : les 17 points du 30/09 sont clos. Révision des cartes du 03/10/2026 (D-260 à D-264) : un seul format de carte d’Exercice, avec une gouttière permanente de 64 px dans le Catalogue et les listes de sélection d’exercices ; photo si média associé, icône de nature sinon. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture . Les Séances ne portent jamais de visuel. Aucune photo dans les listes mixtes, le Calendrier ou le Suivi. Aucun déploiement d’Exercice ni de carte du Suivi ; le déploiement des Séances reste accessible dans le Catalogue et le Calendrier Semaine. Le Suivi présente deux lignes : nature/titre/statut, puis durée/catégorie/ressenti ; sans heure, zones corporelles ni étiquettes. Le Ressenti y est un indicateur sans action, distinct de sa saisie obligatoire en Synthèse. Les variantes déployées d’Exercice et du Suivi sont historiques, hors MVP. Pauses/récupérations et prochaine planification restent absentes des cartes concernées. Les données, instantanés, calculs et fonctions de planification sont conservés.

Synthèses : « N séries de X », « N séries de N rép. », « N séries à l’échec » ; bilatéralité par miroir dans les variantes concernées. Heure Semaine « 08:00 » ; aucune heure dans la carte du Suivi. Séance sans étiquette : catégories de ses exercices ; listes de catégories/zones séparées par un point médian et tronquées avec « … ». Choix sans badge durée ; récurrence du Calendrier Semaine dans la carte déployée seulement.

RG-10 : le Profil porte une préférence silhouette facultative, homme/femme ; absence = homme affiché. Elle ne pilote que l’icône de zone corporelle, sans filtre, recherche ou effet métier. RG-11 à RG-13 : vignette 64 centrée et recadrée sans déformation (couverture pour une vidéo), place réservée pendant chargement/erreur, texte alternatif égal au nom de l’exercice.

D-239 : Calendrier Jour est une exception compacte (séance 298 × 46, exercice 298 × 48, x=80, hauteur d’instance adaptée à l’événement), avec barre colorée 4, nature 26, titre 13 gras, heure/durée 11, lecture 26 et aucun Déployer. Les deux sets comportent 10 variantes chacun. Suivi — Vue d’ensemble est hors MVP. Les boutons Calendrier Aujourd’hui/Planifier restent à 32, sans cible 44 ajoutée : situation acceptée, à revoir et développer après T04. Les nouvelles icônes sont nommées icon/<nom>, les anciennes ne sont pas renommées ; target est réservé au Programme, pulse aux rapports/Suivi.

Référence normative ciblée : [DSF — Cartes, icônes et appuis](../DSF-CARTES-ICONES-APPUIS-2026-09-30.md). Ces règles finales prévalent sur les anciennes formulations d’affichage du présent chapitre dans ce périmètre uniquement.

Appuis — D-237 : la spécification figée v2 du 29 septembre impose une dilatation au contact, un retour au relâchement et une action immédiate au relâchement, sans attendre le ressort. Annulation hors cible : retour sans action ; nouvel appui : reprise depuis l’état courant. Stepper selon DSF Bip (maintien≈500ms, répétition150ms, paliers1/5/10) et réduction des animations par opacité seule. Paramètres et preuves dans le complément DSF.

> **Clôture des contrats — 01/10/2026.** Les règles consolidées du [chapitre 13, §6](13%20–%20Contrats%20d’écran.md#6-clôture-des-réserves-fonctionnelles-des-contrats) s’appliquent : progression sur le plan complet ; transitions et pauses selon D-248/v13 (ancien repli D-242 retiré) ; fréquence 1..12 semaines ; rappel personnalisé au plus 24 h. En Un côté après l’autre, le reset porte sur le bloc du côté courant ; la même règle s’applique à l’ordre alterné en conservant les résultats de l’autre côté (chapitre13 R-03). Les étapes et calculs ci-dessous se lisent avec ces précisions ; aucune nouvelle disposition d’écran.

### Saisie des paramètres — D-246

La référence active est [Paramètres en modale v13](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#parametres-exercice), contrats CE-T03-04/CE-UI-10. Elle intègre Séries variables, Ordre des côtés, pauses terminales et récupération de l’occurrence. Feuille transactionnelle : ✕ annule, ✓ applique au parent, Terminer persiste. Les calculs et comportements sont normatifs dans les spécifications ; Figma définit le layout seulement. Les anciens textes v11 sont historiques.

## Cadence — règles transverses complémentaires

CAD-01 à CAD-30 sont transcrites sans doublon dans D-268 à D-297 ; appliquer la spécification Bip v2. Intervalles sonores et progression sont distincts de la fin métier. Pause abandonne la fraction pour progression seulement ; reset n’efface pas le temps réel. Arrière-plan n’est pas Pause, aucun rejeu de signal manqué. Cadence commune à toutes les Séries dans l’éditeur, aucun défaut ni préférence Profil. Les formules de pauses/Récupération de RM-129 restent inchangées hors Ti.

## Avertissement non bloquant d’enchaînement 

Lorsque deux Exercices consécutifs n’ont ni pause effective de transition ni Récupération positive après son occurrence, la Composition affiche l’avertissement non bloquant : « Attention, les exercices vont s’enchaîner sans pause. » Il concerne l’enchaînement entre Exercices ; aucun avertissement distinct entre Séries n’est ajouté. Il n’empêche ni l’enregistrement ni l’exécution et ne modifie aucun paramètre. La condition concerne la frontière entre deux Exercices dans leur ordre d’exécution, y compris aux transitions du Circuit ; elle utilise les paramètres de l’occurrence, sans modifier les règles de substitution R/PN de v13.

## Planification multi-contenus

Le créneau produit d’abord sa suite d’occurrences. Chaque contenu retient ensuite les positions définies par son motif x/n ; changer Jour en Semaine ne change pas le motif. L’origine de l’index et son évolution après modification restent à préciser, pas à inférer du calendrier dessiné.

Sans répétition : une date/heure. Avec répétition : Jour/Semaine/Mois. Pour Semaine, conserver l’ancrage sur la semaine contenant le début, le multiplicateur 1..12 et les dates inclusives du calcul existant. Ne pas utiliser ce calcul comme définition du mode Mois ou de la conversion pendant/jusqu’au.

Rappel : interrupteur puis 5 min/15 min/30 min/1 h/Autre, choix égaux sur la largeur. Aucun n’est plus une option ; Autre ouvre le réglage personnalisé. Les règles de permission et le plafond personnalisé 24 h existants restent conservés.

La modification agit sur le futur ; suppression de Routine conserve sources et histoire. L’agrégation des états de plusieurs contenus, les exclusions d’occurrence et l’archivage d’un contenu de liste nécessitent les compléments explicitement ouverts dans la spécification. Ne pas créer d’Exécution fictive pour un contenu non réalisé.

Voir la [spécification de planification du 08/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification), y compris ses points ouverts ; aucune règle manquante ne se déduit des valeurs Figma.

## Règles transverses — circuits du12/10/2026

- Nature tours : développement historique conservé. Nature séries : boucle i=1..N, puis exercices dans l’ordre, série i seulement.
- Passage bilatéral unique : côté de départ → PC → autre côté → Pi. Aucun Pi ajouté avant PC ; réglage propre non réécrit. R positive remplace seulement Pi terminale.
- Conversion tours→séries : extension par dernière ligne active ; troncature au-delà de N. Confirmation si au moins un exercice perd des séries. Annuler préserve intégralement l’état précédent. Séries→tours : aucun message, valeurs conservées.
- Diminution de N sans conversion : immédiate, sans message, réserve jusqu’à enregistrement de la séance ; augmentation restaure d’abord, puis préremplit.
- Ajout catalogue avec perte : confirmer ou abandonner l’ajout, sans modification du catalogue. Sortie : conserver nombre et paramètres. Multicircuit hors MVP.
- Régime identiques/variables indépendant de la nature. Normalisations et validations existantes conservées, sauf déroulement contextuel bilatéral explicitement défini ci-dessus.
- Préparation/fin : séance uniquement en SESSION, exercice uniquement en autonome ; aucun booléen.
- Points/récupérations internes répétés ; externes non répétés. R0 ne supprime pas Pi. Ne jamais compter une récupération deux fois.
- Durée et progression suivent le plan effectif. lowerBound prime sur estimated, qui prime sur exact dans les agrégats ; omitted reste propre à l’exercice concerné.

<a id="formats-regles"></a>

## Formats — règles métier transverses

<a id="fmt-01"></a>

### RM-FMT-01

**FMT-01 — Format appliqué.** Une séance peut porter Tabata, Intervalles 30/30, EMOM, AMRAP, For time ou Death by. Ce champ détermine des contraintes et un comportement d’exécution. Une séance libre ne porte aucun format contraignant.

<a id="fmt-02"></a>

### RM-FMT-02

**FMT-02 — Origine de création.** Le modèle de départ est conservé séparément. Il classe la provenance, sans imposer à lui seul de comportement. Renforcement, Gainage · Mobilité, Superset, Progression, À l’échec et Libre alimentent cette origine sans devenir des formats.

<a id="fmt-03"></a>

### RM-FMT-03

**FMT-03 — Identité du format.** Le format est fixé à la création et ne devient pas un autre format par édition ordinaire. Les constantes restent imposées.

<a id="fmt-04"></a>

### RM-FMT-04

**FMT-04 — Réglages de séance.** Les réglages autorisés par le format restent modifiables après composition. Leur portée est la séance, distincte des paramètres propres à chaque exercice.

<a id="fmt-05"></a>

### RM-FMT-05

**FMT-05 — Valeurs dérivées.** Toute modification d’un réglage ou de la composition met à jour les valeurs calculées et la synthèse courante. Une valeur calculée n’est pas un second réglage concurrent.

<a id="fmt-06"></a>

### RM-FMT-06

**FMT-06 — Historique.** Modifier la séance ne modifie pas rétroactivement les paramètres ni les résultats de ses exécutions passées. Cette préservation réutilise l’exigence générale d’instantané ; elle n’invente pas un nouvel historique parallèle.

<a id="fmt-07"></a>

### RM-FMT-07

**FMT-07 — Présentation et synthèse.** Le texte descriptif du modèle peut rester fixe ; la synthèse de la séance décrit ses paramètres effectifs. Une synthèse ne disparaît pas au seul motif que la séance a été composée ou modifiée.

<a id="fmt-08"></a>

### RM-FMT-08

**FMT-08 — Indexation explicite.** Une échelle de valeurs est indexée sur l’unité nommée par le paramètre. Une liste numérique ne change pas d’unité par simple changement de libellé ou réinterprétation technique.

<a id="fmt-09"></a>

### RM-FMT-09

**FMT-09 — Réemploi des circuits.** Conserver les circuits de tours et de séries de SRC-04. Les circuits de séries ne sont pas réservés aux seules progressions ou pyramides. Un format peut imposer une organisation ; cela ne retire pas les choix existants à une séance libre.

<a id="fmt-10"></a>

### RM-FMT-10

**FMT-10.** Le format impose huit séries par exercice, 20 secondes d’effort par série et une pause de 10 secondes après chaque série.

<a id="fmt-11"></a>

### RM-FMT-11

**FMT-11.** Avec plusieurs exercices, le réglage global propose « Par exercice » et « En alternance ». Avec un exercice unique, la question est inutile puisque l’enchaînement est identique.

<a id="fmt-12"></a>

### RM-FMT-12

**FMT-12.** Par exercice : A1…A8, puis B1…B8. La configuration illustrée comporte un circuit d’un tour et deux cartes affichant chacune `8 × 20 s`. Le réglage de répétition de l’ensemble reste distinct des huit séries imposées.

<a id="fmt-13"></a>

### RM-FMT-13

**FMT-13.** En alternance : A1, B1, A2, B2…A8, B8. Le circuit de séries existant exprime cette organisation avec huit séries par exercice. Les huit séries ne deviennent pas huit efforts au total répartis entre A et B.

<a id="fmt-14"></a>

### RM-FMT-14

**FMT-14.** Le récapitulatif nomme le compte commun « Séries par exercice — 8 », compatible avec les deux organisations. Il ne présente pas ce compte comme huit tours de circuit dans le cas par exercice.

<a id="fmt-15"></a>

### RM-FMT-15

**FMT-15.** Le contrôle « Exécution » est en dernière ligne du bloc Paramètres, après Durée totale, avec séparateur. Son libellé et les options sont alignés sur la même ligne ; la taille de texte est celle des paramètres voisins. Le layout précis relève du DSF et du Figma courant.

<a id="fmt-16"></a>

### RM-FMT-16

**FMT-16.** Dans la composition par exercice, la carte affiche le volume `8 × 20 s`, sans afficher la pause dans cette expression.

<a id="fmt-17"></a>

### RM-FMT-17

**FMT-17.** La modale correspondante affiche Mode d’exécution = Durée, Nombre de séries = 8, Durée d’une série = 20 s et Pause après chaque série = 10 s. Les quatre valeurs sont visibles, grisées et non modifiables ; leur caractère imposé par Tabata est expliqué. Elles restent effectives et ne sont pas remplacées par un tiret.

<a id="fmt-18"></a>

### RM-FMT-18

**FMT-18.** Les 10 secondes constituent la pause après chaque série. Une récupération de séance n’est pas créée pour rendre cette pause visible. Aucune récupération supplémentaire n’est ajoutée par défaut. Si une récupération positive est explicitement ajoutée là où le modèle l’autorise, sa substitution à la dernière pause suit SRC-04/05, sans double comptage.

<a id="fmt-19"></a>

### RM-FMT-19

**FMT-19.** Les constantes sont 30 secondes de travail et 30 secondes de pause. La borne réglée est un compte, jamais une durée totale saisie. La durée se déduit des occurrences effectivement prévues et de leurs phases. Les réglages de compte et la récupération éventuelle restent ceux du format décrit par SRC-01 ; ne pas déduire d’un chiffre de maquette une règle supplémentaire.

<a id="fmt-20"></a>

### RM-FMT-20

**FMT-20 — Réglages.** L’utilisateur règle la cadence, c’est-à-dire la durée d’une fenêtre, le nombre de tours et l’organisation « Par exercice » ou « En alternance ».

<a id="fmt-21"></a>

### RM-FMT-21

**FMT-21 — Durée.** La durée du bloc EMOM est calculée et affichée en direct : `nombre de tours × nombre d’exercices × durée de fenêtre`. Elle n’est jamais saisie. Les éventuelles phases propres de séance restent distinguées de ce total de bloc.

<a id="fmt-22"></a>

### RM-FMT-22

**FMT-22 — Composition.** Ajouter ou retirer un exercice conserve le nombre de tours et recalcule la durée. La durée n’entraîne aucun arrondi du nombre de tours ni dernier tour tronqué.

<a id="fmt-23"></a>

### RM-FMT-23

**FMT-23 — Fenêtre.** Chaque fenêtre va jusqu’à son terme ; la suivante commence à l’échéance. Terminer l’objectif avant l’échéance ne raccourcit pas la fenêtre. Ne pas terminer l’objectif ne prolonge pas la fenêtre.

<a id="fmt-24"></a>

### RM-FMT-24

**FMT-24 — Appui.** L’appui sur le cadran indique que le travail de la fenêtre est terminé et révèle le repos restant. Il ne passe pas à la fenêtre suivante.

<a id="fmt-25"></a>

### RM-FMT-25

**FMT-25 — Repos.** Le repos de la fenêtre est le temps qui reste entre la fin effective du travail et son échéance. Il est variable, non réglable et inclus dans la fenêtre ; il ne s’ajoute pas une deuxième fois à la durée totale. Sans fin de travail signalée avant l’échéance, aucune durée de repos positive n’est inventée.

<a id="fmt-26"></a>

### RM-FMT-26

**FMT-26.** L’AMRAP a une durée imposée réglable. Le circuit est répété jusqu’à l’échéance globale ; le nombre de tours réalisés est un résultat, pas une borne saisie.

<a id="fmt-27"></a>

### RM-FMT-27

**FMT-27.** Pour les formats cadencés Tabata, Intervalles et EMOM, la borne saisie est un compte. Cette règle ne s’applique pas à l’AMRAP ni au For time. Elle ne change pas les possibilités des séances libres en dehors du périmètre décidé.

<a id="fmt-28"></a>

### RM-FMT-28

**FMT-28.** Renforcement, Gainage · Mobilité, Superset, Progression, À l’échec et Libre ne font que préremplir une séance libre. Aucun verrouillage métier ne provient de cette origine.

<a id="fmt-29"></a>

### RM-FMT-29

**FMT-29.** Progression propose « Par exercice » et « En alternance ». Ses valeurs sont des répétitions **par série**. En alternance, les passages restent comptés en séries : A10, B10, A12, B12, A14, B14. Par exercice : A10, A12, A14, puis B10, B12, B14. L’ordre n’efface ni ne réindexe la prescription.

<a id="fmt-30"></a>

### RM-FMT-30

**FMT-30.** Le paramètre s’appelle « Volume par tour ». Pour `21 · 15 · 9`, chaque exercice est exécuté à 21 répétitions au premier tour, 15 au deuxième, 9 au troisième.

<a id="fmt-31"></a>

### RM-FMT-31

**FMT-31.** Aucun sélecteur « Par exercice / En alternance » n’est proposé pour For time. L’échelle reste indexée par tour ; elle n’est pas transformée en trois séries successives à l’intérieur de chaque exercice.

<a id="fmt-32"></a>

### RM-FMT-32

**FMT-32.** La phrase normative est : « 21 répétitions au premier tour, 15 au deuxième, 9 au troisième. Le plus vite possible. » Le travail prescrit borne le format ; le temps réellement nécessaire pour l’accomplir est un résultat.

<a id="fmt-33"></a>

### RM-FMT-33

**FMT-33.** Le rang de fenêtre est déduit de l’horloge d’exécution ; l’utilisateur ne déclare jamais un nombre de tours à chaque passage. L’objectif est calculé depuis le rang, le départ et l’incrément du format. Dans le cas de référence : une répétition la première minute, puis une de plus à chaque minute.

<a id="fmt-34"></a>

### RM-FMT-34

**FMT-34.** Un seul bouton met fin à la séance et ouvre une confirmation distinguant « Limite atteinte » et « Abandonner ».

<a id="fmt-35"></a>

### RM-FMT-35

**FMT-35.** Un tour est acquis lorsque l’objectif de sa fenêtre est accompli, signalé par l’appui sur le cadran. Cet appui révèle le repos restant ; il ne fait pas avancer la fenêtre et ne compte pas les mouvements individuellement.

<a id="fmt-36"></a>

### RM-FMT-36

**FMT-36.** Une fenêtre entamée sans appui n’est pas un tour acquis. Son échéance ne vaut pas confirmation implicite. Le rang courant et le nombre de tours acquis sont deux données distinctes. Un appui répété dans la même fenêtre ne peut acquérir deux tours.

<a id="fmt-37"></a>

### RM-FMT-37

**FMT-37.** Lorsqu’une dernière fenêtre est entamée sans être achevée, elle ne compte pas comme tour. La confirmation d’arrêt demande le nombre de répétitions réalisées dans cette fenêtre, prérempli à zéro. La validation confirme la valeur affichée. Avant validation, ce zéro est une valeur proposée dans le formulaire, pas une mesure constatée.

<a id="fmt-38"></a>

### RM-FMT-38

**FMT-38.** Le résultat associe les tours acquis et les répétitions partielles, par exemple « 12 tours + 5 répétitions ». Le motif est « limite atteinte » ou « abandon ». Dans les deux cas, l’état d’achèvement reste **incomplet**, conformément à la décision du 14/10 à 17:13.

<a id="fmt-39"></a>

### RM-FMT-39

**FMT-39.** Conserver les données effectives nécessaires à l’historique selon les règles générales existantes. Ne pas définir maintenant les critères de comparaison, classements ou rapports de suivi.

<a id="fmt-40"></a>

### RM-FMT-40

**FMT-40.** Les séances existantes sans format conservent leur comportement libre. Ne pas leur attribuer un format d’après un titre « Tabata » ou une coïncidence numérique ; ne pas leur imposer de nouveaux verrouillages.

<a id="fmt-41"></a>

### RM-FMT-41

**FMT-41.** Les phases Compte à rebours d’exercice et Fin d’exercice restent exclues des séances dans tous les cas. Les seules phases propres de séance s’exécutent selon les règles existantes ; aucun booléen d’activation n’est ajouté.

<a id="fmt-42"></a>

### RM-FMT-42

**FMT-42.** Les phrases restent générées depuis les paramètres sous forme de segments `{texte, gras}` et ne sont pas persistées comme vérité métier. Le For time conserve son texte validé et son indexation par tour.

<a id="calculs-durees"></a>

## Calculs des durées et ordre des phases

### Ordres d’exécution et pauses

La spécification [Règles détaillées](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#resultats-temporels) définit la succession des phases. Sans côté : S1→P1→S2→P2→S3→P3. Par côté : D1→P1→D2→P2→D3→PN→PC→G1→P1→G2→P2→G3→P3. Par paire : D1→PC→G1→P1→D2→PC→G2→P2→D3→PC→G3→P3. Inverser D/G si départ gauche.

Pause terminale incluse, même avec une seule Série. À la frontière des deux côtés successifs, PN du premier côté puis PC restent exécutées selon la règle déjà validée. Par paire, Pi après chaque paire, dernière comprise et PC à l’intérieur de chaque paire. N=1 est normalisé par côté. Compte à rebours/Fin propres joués une fois pour l’Exercice complet en exécution autonome uniquement. Dans une Séance, ils ne sont jamais exécutés : seuls ceux de la Séance s’appliquent, sans booléen. Récupération explicite après l’occurrence seulement ; aucune en direct. Phases nulles franchies de façon idempotente.

### Durées, affichage et inversion

N=Séries par côté ; Ti=travail calculable de la Série ; Pi=Pause configurée ; PC=Pause de changement de côté ; R=Récupération de l’occurrence. Durée : Ti=cible ; Répétitions avec bip b>0 : Ti=Ri×b. Sans bip en Répétitions et en À l’échec : total propre omitted.

| Configuration | Total intrinsèque calculable | Uniforme |
|---|---|---|
| Unilatéral | Σ(Ti+Pi) | N×(d+p) |
| Un côté après l’autre | 2Σ(Ti+Pi)+PC | 2N×(d+p)+PC |
| Les deux côtés à chaque série, N≥2 | 2ΣTi+ΣPi+N×PC | N×(2d+p+PC) |

Occurrence calculable To=T−PN+R si R>0 ; sinon To=T. R remplace uniquement la toute dernière Pause et n’est pas ajouté deux fois. Les totaux de Séance développent les Tours et les phases réellement prévues. Même si le total d’Exercice est omitted, ses pauses connues contribuent au total partiel de Séance selon chapitre 10, résultats temporels. Périmètres Catalogue/Composition/plan complet inchangés ; Compte à rebours et Fin propres restent exclus du total intrinsèque ; ils sont inclus une fois dans le plan autonome de l’Exercice, jamais dans le plan de Séance. Seuls le Compte à rebours initial et la Fin de séance appartiennent au plan complet SESSION. Temps réalisé jamais réécrit.

Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Séance : exact si tout exact, ≈ si au moins une estimation et aucun inconnu, ≥ si au moins un inconnu. Erreur de cible : validation distincte, aucune fausse valeur.

**Inversion réservée à Durée uniforme avec nombre de séries libre.** Sous compte hérité d’un circuit de séries, le total calculé est en lecture seule : aucune inversion ni ajustement implicite de la cible. N dans1..99 au plus proche, égalité vers le haut. Candidats : unilatéral arrondi(Tv/(d+p)) ; succession des côtés arrondi((Tv−PC)/(2(d+p))) ; par paire arrondi(Tv/(2d+p+PC)). Comparer les candidats réalisables et N=1 calculé avec l’ordre normalisé par côté ; retenir le total le plus proche, égalité N le plus grand. Les bornes du sélecteur suivent les extrêmes réalisables. Si T(N)≠Tv : « Durée ajustée à {T(N)} pour respecter un nombre entier de séries. » Sinon aucun message. Le message porte « Annuler » dans un cadre plus clair que son fond : Annuler restaure les valeurs précédant l’ajustement ; toucher le reste du message le ferme sans annuler . Présentation d’Annuler : capsule sans contour, blanc transparent à 90 %, demi-cercles, marges droite/haut/bas égales . Total variable et Répétitions non éditable.

### Scénarios de recette normative

| Cas | Paramètres | Résultat courant |
|---|---|---|
| A | Unilatéral ; cibles30/45/60s ; Pauses10/20/30s | 135+10+20+30=195s =3min15s |
| B | A avec R120s | 195−30+120=285s =4min45s |
| C | A par côté ; PC15s | 270+120+15=405s =6min45s |
| D | A par paire ; PC15s | 270+60+45=375s =6min15s |
| E | Répétitions12/10/8 ; bip0 ; Pauses30/45/60s | omitted, aucune durée d’Exercice ;135s de pauses connues dans le plan |
| F | À l’échec ; bip0 ou4 ; Pauses30/45/60s | omitted, même avec bip |
| Uniforme | N3,d90s,p15s | 270+45=315s =5min15s |
| Bilatéral | N3,d90s,p15s,PC10s | Par côté640s ; par paire615s |
| N1 bilatéral | d90s,p15s,PC10s | Ordre par côté,220s ; R30s →235s |
| Douze séries | Total travail390s,Pause10s | 390+12×10=510s =8min30s |
| Répétitions avec bip | N4,Ri15,b4s,p15s | 240+60=300s ; ≈5min |
| Durée avec bip | N4,Ti60s,b4s,p15s | 300s exact ; bip sans effet sur total |
| Une Série unilatérale | Ti30s,p15s | 45s, dont15s de pause après chaque série |

Tester les deux directions/ordres, p0/PC0 sans repli, R0/positive, N1/99, bascules/annulation/restauration, nouvelle dernière ligne après déplacement, copie et snapshot. Inversion et résultats dérivés de la spécification, pas des exemples Figma ni d’Excel.

<a id="resultats-temporels"></a>

## Résultats temporels et agrégation du circuit

### Résultats de durée

| Périmètre | Mode / contenu | Bip | Retour | Rendu |
|---|---|---|---|---|
| Exercice | Durée, toutes cibles chiffrées | 0 ou positif | exact | Valeur sans symbole |
| Exercice | Répétitions | 0 | omitted | Ligne absente |
| Exercice | Répétitions, toutes cibles chiffrées | positif | estimated | ≈ valeur |
| Exercice | Toutes cibles À l’échec, les deux modes | 0 ou positif | omitted | Ligne absente |
| Exercice | Mélange chiffré/échec, Durée ou Répétitions avec bip | Selon mode | lowerBound | ≥ travail connu/estimable + pauses prévues |
| Séance | Tous les exercices exacts | Selon exercices | exact | Valeur sans symbole |
| Séance | Au moins une estimation, aucun exercice sans durée | Selon exercices | estimated | ≈ somme |
| Séance | Au moins un exercice sans durée | Selon exercices | lowerBound | ≥ contributions connues |

Les pauses chronométrées changent le montant, jamais la nature. ≥ est autorisé pour un Exercice mixte calculable ; il prime sur ≈. Toutes cibles À l’échec ou Répétitions sans bip restent omitted, même avec pauses ou récupération. omitted signifie absence de ligne, de valeur, de zéro et de tiret. Une erreur de saisie est un état de validation séparé : elle ne devient pas un cinquième résultat temporel valide. En Répétitions sans bip, la ligne reste absente même si une cible est incomplète ; l’erreur reste portée par la cible et interdit ✓. Une cible À l’échec explicitement sélectionnée est valide sans nombre.

Une durée réelle réalisée reste réelle, sans symbole prévisionnel ni réécriture de l’historique. La redondance rédactionnelle d’un total Durée à une seule Série reste distincte du résultat exact calculé.

### Calcul, pauses et périmètres

Pour une Série i : Durée chiffrée → Ti=durée prescrite ; Répétitions chiffrées avec bip b>0 → Ti=Ri×b ; Répétitions sans bip et À l’échec → durée de travail inconnue. Aucune estimation forfaitaire de répétition n’est utilisée.

Le total intrinsèque exclut Compte à rebours et Fin d’exercice. **Pause après chaque série**, dernière comprise, même avec N=1 et même avec une Pause entre les côtés. Pi=0 ne crée pas de phase positive. Cette clarification explicite du propriétaire remplace les passages contraires du prompt précédent.

| Configuration | Total intrinsèque, si travail calculable | Succession N=3, départ D |
|---|---|---|
| Unilatéral | Σ(Ti+Pi) | S1→P1→S2→P2→S3→P3 |
| Un côté après l’autre | 2Σ(Ti+Pi)+PC | D1→P1→D2→P2→D3→P3→PC→G1→P1→G2→P2→G3→P3 |
| Les deux côtés à chaque série, N≥2 | 2ΣTi+ΣPi+N×PC | D1→PC→G1→P1→D2→PC→G2→P2→D3→PC→G3→P3 |

N reste par côté. Au changement de côté en ordre successif, PN et PC se cumulent, même si PC>0. En ordre par paire, Pi suit la paire complète ; aucune PC supplémentaire au retour au premier côté. N=1 est normalisé Un côté après l’autre : T=2(d+p)+PC. PC=0 ne supprime ni ne remplace Pi.

Une Récupération positive explicite de Séance qui suit l’Exercice remplace **uniquement sa toute dernière Pause** : To=T−PN+R. Sans récupération positive : To=T. R=0 ne produit pas de phase et ne supprime pas PN. La Pause du premier côté reste intacte. En direct, aucune Récupération contextuelle : PN reste exécutée. Déplacement des Séries : déterminer la nouvelle dernière ligne avant substitution. Développer les Tours avant sommation ; ne jamais ajouter R une seconde fois. Retirer une récupération rétablit la dernière Pause configurée.

Pour une Séance avec travail inconnu, sommer les phases chronométrées réellement prévues et les travaux estimables, une seule fois ; le travail inconnu n’ajoute aucun montant inventé mais impose lowerBound. Les pauses prévues d’un Exercice dont le total propre est omitted contribuent à cette somme. Conformément au prompt, une estimation cadencée reste incluse dans les contributions connues : ≥ exprime ici un total prévisionnel partiel, pas une garantie mathématique sur le temps réel si l’utilisateur accélère ou abrège. Ne pas présenter cette estimation comme une mesure.

**Clarification du12/10/2026 — D-214 :** Dans une Séance, les Compte à rebours d’exercice et Fin d’exercice ne sont jamais exécutés ; seuls le Compte à rebours initial et la Fin de séance s’appliquent, une fois, par substitution. Aucun booléen ni contrôle d’activation n’existe à cet effet. Les valeurs propres restent conservées pour l’exécution de l’Exercice seul. Ces phases propres ne contribuent donc ni au total prévu ni à la progression d’une Séance.

Les métriques Catalogue/Composition conservent leur périmètre de phases structurelles ; le plan complet inclut Compte à rebours/Fin quand applicables. L’omission du total d’Exercice ne supprime ni ses phases, ni ses données, ni leur exécution.

Exemple normatif : 4×15×4+4×15=300 s, soit ≈5 min. Il est justifié par la règle explicite du propriétaire, pas seulement par le texte de la capture. Pour les cibles mixtes : agrégation partielle également à l’Exercice mixte calculable.

### Extension normative du12/10 — niveau Circuit

Le Circuit produit exact si tout le travail est exact ; estimated si au moins une estimation et aucun travail inconnu ; lowerBound si au moins un travail inconnu. Répétitions chiffrées avec Bip>0 : estimées ; Répétitions avec Bip0 ou toute cible À l’échec : travail inconnu. Les pauses et travaux estimables contribuent même si le total propre de l’exercice est omitted. Symbole préfixé au montant de l’en-tête : ≈ ou ≥, aucun symbole en exact.

Développer d’abord la nature du circuit. En circuit de séries, un passage bilatéral calculable vaut 2Ti+PC+Pi, ou 2Ti+PC+R si R>0 le suit. Pas de Pi avant PC. Cette règle contextuelle unique s’applique aussi à un circuit de compte1 ; elle ne réécrit pas le réglage propre ni les formules de l’exercice autonome/circuit de tours. Unilatéral : Ti+Pi, ou Ti+R si R>0. Sommer les passages une seule fois. Attentes de points exclues du prévu. Tests normatifs : Ti30,Pi10,PC5 → passage bilatéral75s ; R20 →85s. Trois passages identiques →225s, ou255s avec R20 à chaque passage. PC0 ne supprime pas Pi.

<a id="formats-raccordement"></a>

<a id="cibles-mixtes"></a>

## Calculs et cas de recette des cibles mixtes

### Calcul de la durée prévisionnelle

Pour une série i :

- Durée chiffrée : travail connu Ti = durée prescrite.
- Répétitions chiffrées, bip b > 0 : travail estimable Ti = Ri × b.
- À l’échec : travail inconnu, quel que soit le mode ou le bip.
- Répétitions sans bip : travail inconnu, même avec cible numérique.

Les pauses et répétitions de passages proviennent du plan développé, sans réintroduire les phases propres d’un exercice dans une séance. Compte à rebours/Fin sont exclus du total intrinsèque de l’exercice selon les règles existantes.

| Configuration de l’exercice | Résultat prévisionnel | Affichage |
|---|---|---|
| Durée, toutes cibles chiffrées | exact | Durée sans symbole |
| Durée, mélange chiffré/échec | lowerBound | ≥ suivi du total partiel |
| Répétitions avec bip, toutes cibles chiffrées | estimated | ≈ suivi du total |
| Répétitions avec bip, mélange chiffré/échec | lowerBound | ≥ suivi du total partiel |
| Répétitions sans bip, toutes configurations de cibles | omitted | Aucun total d’Exercice |
| Toutes séries à l’échec, dans les deux modes | omitted | Aucun total d’Exercice |

Pour un mélange calculable, le total partiel comprend les contributions de travail connues ou estimables et les pauses réellement prévues. Le travail inconnu n’est pas remplacé par une estimation arbitraire.

Comme dans l’agrégation existante, ≥ sur des répétitions cadencées exprime un total prévisionnel partiel intégrant une estimation. Il ne garantit pas une borne mathématique du temps réel si l’utilisateur accélère ou abrège.

L’omission à l’Exercice ne supprime pas ses pauses du total Circuit/Séance. Ceux-ci conservent le traitement de travail inconnu et de contributions connues déjà spécifié. Une saisie invalide reste une erreur de validation et n’est pas assimilée à omitted.

Dès qu’une cible est À l’échec, aucun calcul inverse depuis un total saisi n’est disponible. Le total applicable est en lecture seule ; omitted reste absent. Le verrouillage déjà imposé par un circuit de séries reste également applicable.

### Recettes déterministes à intégrer

| ID | Situation | Attendu |
|---|---|---|
| R01 | Durée : 30 s, 45 s, échec ; pause 10 s après chaque série, unilatéral direct | ≥ 1 min 45 s ; total non éditable |
| R02 | Répétitions : 10, 12, échec ; bip 2 s ; mêmes pauses | ≥ 1 min 14 s prévisionnel partiel, incluant du travail estimé |
| R03 | Même exercice avec bip 0 | Aucun total d’Exercice |
| R04 | Trois cibles à l’échec, pauses positives, dans chaque mode et avec/sans bip | Aucun total d’Exercice ; pauses conservées dans le plan et l’agrégat |
| R05 | Durée à l’échec avec bip | Pas de fin automatique ni de nominal estimé ; Suivant termine |
| R06 | 12 bips proposés, utilisateur poursuit | 12 conservé comme estimation, enchaînement non bloqué |
| R07 | 12 proposés, confirmation | 12 déclaré |
| R08 | 12 proposés, correction à 10 | 10 déclaré ; origine et proposition distinguables |
| R09 | Répétitions à l’échec sans bip, pas de saisie | Relevé absent, pas zéro ; suite autorisée |
| R10 | Temps 20 s, reset, 35 s, Suivant | Temps cumulé 55 s ; relevé 35 s |
| R11 | Pause/Reprendre et sons désactivés | Pas de répétitions issues des pauses ; proposition fondée sur intervalles logiques, indépendante du son |
| R12 | Bilatéral et circuit à plusieurs passages | Relevés distincts par côté et occurrence ; séquences de pauses inchangées |
| R13 | Reprise ou double événement de fin | Pas de double comptage ni double relevé ; qualification préservée |
| R14 | Cible vide/invalide | Validation bloquée selon règle existante, pas conversion en échec |
| R15 | Ancien mode À l’échec | Lecture/migration vers Répétitions + cibles échec ; historique sans valeur inventée |
| R16 | Phrase à 2/3/>3 cibles mixtes | Énumération puis compaction actée, segments/gras corrects ; calcul indépendant du corpus |

Ces recettes sont des obligations de la future réalisation, pas des tests exécutés sur l’application.

<a id="recette-formats"></a>

## Cas de recette des formats

### Recettes fonctionnelles et preuves attendues

Ces recettes sont prescrites, **non exécutées sur l’application**. Elles constituent des unités de recette à rattacher aux exigences dans le futur dossier VNext.

| Repère | Situation | Attendu | Exigences |
|---|---|---|---|
| REC-01 | Créer une séance via Renforcement puis modifier ses valeurs | Origine conservée, aucun format contraignant ni verrouillage ajouté | 01–03, 28 |
| REC-02 | Modifier un réglage autorisé après composition | Même séance, synthèse et calculs actualisés ; format conservé | 03–07 |
| REC-03 | Reconsulter une exécution antérieure après cette modification | Paramètres et résultats passés inchangés | 06, 39 |
| REC-04 | Tabata A/B, par exercice, un tour | A1…A8 puis B1…B8 ; 16 efforts | 10–12 |
| REC-05 | Même Tabata en alternance | A1 B1…A8 B8 ; même volume | 10–11, 13 |
| REC-06 | Tabata unilatéral sans autres phases | 480 s pour A/B avec toutes les pauses ; aucune récupération ajoutée | 10, 18 |
| REC-07 | Ouvrir la composition par exercice | Cartes 8 × 20 s ; aucune pause incorporée au libellé de volume | 16 |
| REC-08 | Ouvrir la modale Tabata | Quatre valeurs réelles grisées, non éditables ; raison visible | 17 |
| REC-09 | Tabata avec un exercice | Pas de question d’organisation inutile | 11 |
| REC-10 | EMOM 2 exercices, 6 tours, fenêtre 60 s | 12 min calculées, aucune saisie de durée totale | 20–21 |
| REC-11 | Ajouter un troisième exercice | 6 tours conservés ; 18 min | 22 |
| REC-12 | Fin de travail à 35 s d’une fenêtre de 60 s | 25 s de repos ; pas de transition avant 60 s | 23–25 |
| REC-13 | Échéance EMOM sans signal de fin du travail | Fenêtre suivante ; pas d’allongement ni de repos positif inventé | 23, 25 |
| REC-14 | Intervalles : modifier le compte | Durée recalculée ; aucune durée globale saisie | 19, 27 |
| REC-15 | AMRAP atteint sa durée | Arrêt selon borne temporelle, non selon nombre prédéfini de tours | 26 |
| REC-16 | Progression A/B 10 · 12 · 14, changer organisation | Ordre modifié, valeurs toujours indexées par série | 08–09, 29 |
| REC-17 | For time A/B 21 · 15 · 9 | A21 B21 A15 B15 A9 B9 ; aucun sélecteur d’organisation | 30–31 |
| REC-18 | Phrase For time | Texte exact validé ; segments/gras conformes au générateur existant | 32, 42 |
| REC-19 | Death by, fenêtre 13, départ 1/incrément 1 | Objectif 13 calculé ; aucune saisie du rang | 33 |
| REC-20 | Death by : appui puis second appui dans la même fenêtre | Un seul tour acquis ; repos révélé ; échéance inchangée | 35–36 |
| REC-21 | Fenêtre Death by sans appui | Pas de tour acquis, même si l’échéance passe | 36 |
| REC-22 | 12 tours acquis puis arrêt après 5 répétitions dans la fenêtre 13 | Formulaire initial à 0, saisie 5 ; résultat 12 tours + 5 répétitions | 37–38 |
| REC-23 | Clôture Death by par limite puis cas séparé par abandon | Motifs différents ; état incomplet dans les deux cas | 34, 38 |
| REC-24 | Valider 0 répétition partielle | Zéro déclaré ; aucun objectif automatiquement substitué | 37 |
| REC-25 | Charger une ancienne séance sans format | Comportement libre inchangé ; aucun classement inféré depuis le nom | 40 |
| REC-26 | Exercice doté de compte à rebours/fin, utilisé en séance | Phases propres non exécutées ; seules phases de séance applicables | 41 |
| REC-27 | Reprise, événement d’échéance répété, son désactivé | Pas de double acquisition ; fenêtre déterminée temporellement, pas par audio | 23, 33, 36 |
| REC-28 | Contrôle visuel du récapitulatif | Alignement, séparateurs, proportions et couleurs conformes aux sources DSF/Figma retenues | 14–15 |

Preuves : tests fonctionnels pour calculs et transitions ; analyse statique pour types, compatibilité et propagation ; comparaison visuelle et contrôle d’accessibilité pour les contrats UI ; contrôle sur appareil pour horloge, reprise et interactions. Un test de calcul ne prouve pas le layout. Aucun résultat de ces preuves n’est déclaré obtenu par ce document.

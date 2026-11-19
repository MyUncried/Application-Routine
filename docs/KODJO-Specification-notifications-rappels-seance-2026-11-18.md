# KODJO — Notifications de rappel de séance : spécification éditoriale et technique

**Date :** 18 novembre 2026  
**Statut :** proposition consolidée prête pour validation produit et cadrage du développement ; non publiée dans le dépôt.  
**Périmètre :** rappel individuel à l’heure planifiée pour commencer une séance. Ne couvre pas les rappels d’autres natures (conseils, réengagement marketing, fin de séance).

## 1. Contrat d’affichage

- **Identité :** l’OS affiche l’icône et le nom KODJO ; ne pas les dupliquer dans le texte.
- **Titre `title` :** accroche courte, **30 caractères maximum dans le catalogue français** (cible éditoriale, non limite du champ natif). Pas de point final.
- **Corps `body` :** commence **toujours** par le nom réel et complet de la séance. Si une proposition de complément conduit à plus de **40 caractères**, retirer le complément et conserver uniquement le nom complet. Pas de troncature applicative du nom.
- **Nom :** obligatoire pour les rappels ; le nom original reste dans la charge utile et l’écran de destination, même lorsque l’OS tronque son affichage.
- **Sous-titre `subtitle` :** absent pour le MVP (économise de l’espace, rendu Android variable).
- **Photo de séance :** absente en MVP ; la notification dépend uniquement du texte, de l’icône système et du contenu de navigation. Une extension avec photo est décrite ci-dessous.
- **Action :** appui sur la notification → séance correspondant à l’occurrence planifiée, avec démarrage explicite par l’utilisateur ; aucun démarrage automatique. Pas de bouton d’action redondant « Ouvrir ».
- **Son :** réglage de notification conforme aux choix système/utilisateur ; ne pas considérer le guidage sonore interne de la séance comme le son du rappel.
- **Badge :** pas de compteur des séances planifiées sur l’icône de l’app ; le badge système correspond normalement aux notifications non lues, pas au planning.

**Règle centrale :** « le nom de séance est toujours dans le corps transmis » ne signifie pas « le nom entier sera visible en bannière compacte ». Le rendu natif, la police, l’accessibilité, le mode Concentration, l’écran verrouillé et les réglages de prévisualisation restent maîtres de l’affichage.

## 2. Contraintes systèmes et politique KODJO

| Aspect | iOS | Android | Décision KODJO |
|---|---|---|---|
| En-tête | Nom/icône de l’application gérés par le système | Nom, petite icône et horodatage système | Ne pas répéter KODJO dans le contenu |
| Titre | Titre recommandé court ; aucune limite universelle de caractères/lignes visible | Titre tronqué sur **une ligne, même développé** ; guide design **≤ 30 caractères** | Cible éditoriale **≤ 30 caractères** |
| Corps | Nombre de lignes variable selon la surface/état, texte éventuellement tronqué | Texte compact bref ; recommandation design **≤ 40 caractères** ; vue étendue possible | Corps cible **≤ 40** si le nom le permet, sinon nom complet seul |
| Sous-titre | Champ natif disponible, généralement au-dessus du corps | `subText` au rendu dépendant du constructeur | Non utilisé |
| Taille de police / lignes | Choix du système, de la taille de texte et de l’accessibilité | Choix système/OEM, de la densité et de l’accessibilité | Pas de taille px ni nombre de lignes garantis |
| Petite icône | Icône d’app système | Icône monochrome de notification obligatoire, PNG blanc sur fond transparent **96×96 px** pour la configuration Expo | Préparer un pictogramme KODJO dédié sur Android |
| Photo / vignette | Pièce jointe média possible dans des états enrichis | `BigPictureStyle` en vue développée si prise en charge native | Aucune photo MVP ; ne jamais compter sur elle pour comprendre le rappel |
| Confidentialité | Contenu parfois masqué sur écran verrouillé | Contenu masqué selon réglages et visibilité | Texte non sensible ; respecter les choix système |
| Actions | Actions possibles selon la catégorie | Actions possibles et notification développée | Appui standard uniquement MVP |
| Permission | Consentement et restrictions système | Autorisation `POST_NOTIFICATIONS` à partir d’Android 13 | Ne programmer que si la préférence produit et l’autorisation le permettent |
| Urgence | Les niveaux de notification modifient leur distribution, Focus peut masquer un rappel | Canaux/importance, modes silencieux et restrictions batterie | Rappel normal, non critique et non présenté comme une alarme |

**Important :** 30 et 40 caractères sont des repères de design **Android**, non des coupures techniques obligatoires. Un nom long doit rester complet dans `body`, même s’il n’est pas complètement visible sans développer la notification.

### Politique photo, hors MVP

Si la photo de séance est ajoutée ultérieurement :

- Utiliser une image réelle et pertinente pour la séance, sans texte essentiel incrusté ; ne jamais inventer une photo de séance lorsqu’aucune image adaptée n’existe.
- Cible de production interne **JPEG/PNG 1200×600 px (2:1) et ≤ 300 Ko** : **objectif KODJO**, non exigence native iOS/Android. Prévoir recadrages et une zone centrale sûre ; tester formats portrait et paysage.
- **iOS :** une pièce jointe image locale de notification peut être utilisée ; maximum Apple documenté **10 Mo** pour une image JPEG/GIF/PNG. Les photos distantes de push imposent un traitement adapté (extension de service) ; ne pas supposer qu’une URL distante suffit à une notification locale.
- **Android :** `BigPictureStyle` peut afficher une photo en version développée, mais le champ `attachments` d’Expo SDK 57 est **iOS seulement**. Une implémentation Android distincte (native ou canal push compatible) doit être étudiée et recettée avant de promettre la photo.
- L’image est un enrichissement facultatif ; même quand disponible, le **titre + le corps restent autonomes**.

## 3. Catalogue de messages

Chaque ligne indique la famille, l’identifiant stable, le **titre** et le **corps nominal**. À l’exécution, la fonction d’ajustement de longueur supprime la fin du corps si elle fait dépasser 40 caractères. Les formulations ne comprennent pas d’emoji dans le MVP.

| ID | Famille | Titre | Corps nominal |
|---|---|---|---|
| `GEN-01` | `GEN` | Un défi t’attend | {nom de la séance} : c’est maintenant ! |
| `GEN-02` | `GEN` | Chaque séance compte | {nom de la séance} t’attend. |
| `GEN-03` | `GEN` | À toi de jouer | {nom de la séance} : c’est parti ! |
| `GEN-04` | `GEN` | Allez, on s’y met | {nom de la séance} est prête. |
| `FIRST-01` | `FIRST` | C’est parti pour une première | {nom de la séance} t’attend. |
| `FIRST-02` | `FIRST` | Le premier pas compte | {nom de la séance} : c’est le moment ! |
| `FIRST-03` | `FIRST` | À toi de jouer | {nom de la séance} : ta première séance ! |
| `SINGLE-01` | `SINGLE` | Un défi t’attend | {nom de la séance} : c’est maintenant ! |
| `SINGLE-02` | `SINGLE` | Tout est prêt | {nom de la séance} t’attend. |
| `SINGLE-03` | `SINGLE` | Allez, on s’y met | {nom de la séance} est prête. |
| `RECUR-01` | `RECUR` | On garde le rythme | {nom de la séance} t’attend. |
| `RECUR-02` | `RECUR` | La régularité compte | {nom de la séance} : c’est le moment ! |
| `RECUR-03` | `RECUR` | Une séance de plus | {nom de la séance} t’attend. |
| `PROGRAM-01` | `PROGRAM` | Une étape de plus | {nom de la séance} t’attend. |
| `PROGRAM-02` | `PROGRAM` | Ton programme avance | {nom de la séance} : c’est le moment ! |
| `PROGRAM-03` | `PROGRAM` | Chaque séance compte | {nom de la séance} est au programme. |
| `RESTART-01` | `RESTART` | On reprend le mouvement | {nom de la séance} t’attend. |
| `RESTART-02` | `RESTART` | À ton rythme | {nom de la séance} : on s’y remet ! |
| `RESTART-03` | `RESTART` | Un nouveau départ | {nom de la séance} t’attend. |
| `MON-01` | `MON` | On lance la semaine | {nom de la séance} t’attend. |
| `MON-02` | `MON` | Une semaine qui bouge | {nom de la séance} : c’est parti ! |
| `MIDWEEK-01` | `MIDWEEK` | On garde l’élan | {nom de la séance} t’attend. |
| `MIDWEEK-02` | `MIDWEEK` | Un moment pour bouger | {nom de la séance} : c’est le moment ! |
| `FRI-01` | `FRI` | On finit en mouvement | {nom de la séance} t’attend. |
| `FRI-02` | `FRI` | On termine bien la semaine | {nom de la séance} : c’est parti ! |
| `SAT-01` | `SAT` | Le week-end, on bouge | {nom de la séance} t’attend. |
| `SAT-02` | `SAT` | À toi de jouer ce samedi | {nom de la séance} : c’est le moment ! |
| `SUN-01` | `SUN` | Un dimanche actif | {nom de la séance} t’attend. |
| `SUN-02` | `SUN` | Un moment pour toi | {nom de la séance} : c’est parti ! |
| `MORNING-01` | `MORNING` | On démarre en mouvement | {nom de la séance} t’attend. |
| `MORNING-02` | `MORNING` | Un bon départ | {nom de la séance} : c’est le moment ! |
| `LUNCH-01` | `LUNCH` | La pause qui fait du bien | {nom de la séance} t’attend. |
| `LUNCH-02` | `LUNCH` | Place au mouvement | {nom de la séance} : c’est parti ! |
| `AFTERNOON-01` | `AFTERNOON` | Un peu d’énergie | {nom de la séance} t’attend. |
| `AFTERNOON-02` | `AFTERNOON` | À toi de jouer | {nom de la séance} : c’est le moment ! |
| `EVENING-01` | `EVENING` | On finit sur une bonne note | {nom de la séance} t’attend. |
| `EVENING-02` | `EVENING` | Un moment rien qu’à toi | {nom de la séance} : c’est le moment ! |
| `NIGHT-01` | `NIGHT` | À ton rythme | {nom de la séance} t’attend. |
| `CAT-RENFO-01` | `CAT-RENFO` | On gagne en force | {nom de la séance} t’attend. |
| `CAT-RENFO-02` | `CAT-RENFO` | Prêt à te renforcer | {nom de la séance} : c’est parti ! |
| `CAT-CARDIO-01` | `CAT-CARDIO` | On fait monter le rythme | {nom de la séance} t’attend. |
| `CAT-CARDIO-02` | `CAT-CARDIO` | On active le cardio | {nom de la séance} : c’est parti ! |
| `CAT-MOBILITE-01` | `CAT-MOBILITE` | On retrouve de l’aisance | {nom de la séance} t’attend. |
| `CAT-MOBILITE-02` | `CAT-MOBILITE` | Bouger plus librement | {nom de la séance} : c’est le moment ! |
| `CAT-ETIREMENTS-01` | `CAT-ETIREMENTS` | On gagne en souplesse | {nom de la séance} t’attend. |
| `CAT-ETIREMENTS-02` | `CAT-ETIREMENTS` | Un moment pour s’étirer | {nom de la séance} : c’est le moment ! |
| `CAT-EQUILIBRE-01` | `CAT-EQUILIBRE` | On travaille sa stabilité | {nom de la séance} t’attend. |
| `CAT-EQUILIBRE-02` | `CAT-EQUILIBRE` | Trouve ton équilibre | {nom de la séance} : c’est parti ! |
| `CAT-COORDINATION-01` | `CAT-COORDINATION` | Place à la coordination | {nom de la séance} t’attend. |
| `CAT-COORDINATION-02` | `CAT-COORDINATION` | Concentration et mouvement | {nom de la séance} : c’est parti ! |
| `CAT-RECUP-01` | `CAT-RECUP` | On prend soin de soi | {nom de la séance} t’attend. |
| `CAT-RECUP-02` | `CAT-RECUP` | Le temps de récupérer | {nom de la séance} : c’est le moment ! |
| `CAT-RESPIRATION-01` | `CAT-RESPIRATION` | Un moment pour souffler | {nom de la séance} t’attend. |
| `CAT-RESPIRATION-02` | `CAT-RESPIRATION` | On retrouve son souffle | {nom de la séance} : c’est parti ! |
| `CAT-MEDITATION-01` | `CAT-MEDITATION` | Une pause pour l’esprit | {nom de la séance} t’attend. |
| `CAT-MEDITATION-02` | `CAT-MEDITATION` | Un moment de calme | {nom de la séance} : c’est le moment ! |
| `CAT-AUTRE-01` | `CAT-AUTRE` | À toi de jouer | {nom de la séance} t’attend. |
| `CAT-AUTRE-02` | `CAT-AUTRE` | Un moment pour toi | {nom de la séance} : c’est parti ! |

### Familles et éligibilité

| Famille | Éligibilité |
|---|---|
| `RESTART` | Dernières séances réellement échues non réalisées ; afficher l’accroche de reprise **une fois après chaque nouvelle période d’absence**, pas à chaque rappel |
| `FIRST` | Première séance à démarrer : aucune séance achevée et aucune occurrence antérieure manquée |
| `PROGRAM` | Occurrence explicitement associée à un programme, et non déduite de son nom |
| `RECUR` | Occurrence issue d’une planification récurrente, pas d’un nom de séance répété |
| `SINGLE` | Occurrence issue d’une planification ponctuelle |
| `CAT-*` | Une seule catégorie distincte sur les exercices de la séance, et catégorie connue du référentiel |
| `MON`, `MIDWEEK`, `FRI`, `SAT`, `SUN` | Jour du **début planifié**, dans le fuseau de planification applicable |
| `MORNING`, `LUNCH`, `AFTERNOON`, `EVENING`, `NIGHT` | Créneau de l’heure **planifiée**, pas de l’heure de calcul |
| `GEN` | Toujours éligible, solution de repli |

**Périodes proposées :** matin 05:00–10:59 ; midi 11:00–14:59 ; après-midi 15:00–17:59 ; soir 18:00–22:59 ; nuit 23:00–04:59. `MON` = lundi ; `MIDWEEK` = mardi–jeudi ; `FRI` = vendredi ; `SAT` = samedi ; `SUN` = dimanche. Cette partition est une **convention KODJO**, pas une norme iOS/Android.

**Catégories de KODJO vérifiées dans le code :** `renforcement`, `cardio`, `mobilite`, `etirements`, `equilibre`, `coordination`, `recuperation`, `respiration`, `meditation`, `autre`. L’identification de catégorie de séance doit utiliser la projection existante dérivée des exercices, **pas une nouvelle catégorie stockée dans la séance**. Deux catégories distinctes ou plus, catégorie personnalisée non reconnue, ou aucune catégorie → pas d’accroche `CAT-*`, les autres familles restent disponibles.

## 4. Algorithme de sélection

1. Vérifier l’autorisation système et la préférence de notification. Pas de rappel si la séance est annulée, supprimée ou déjà accomplie avant son heure prévue.
2. Calculer les propriétés de **l’occurrence** : `sessionId`, `occurrenceId`, `plannedAt`, nom complet, relation à un programme, type de récurrence, statut de réalisation, historique de manque, catégorie(s) déduite(s) des exercices.
3. Si un `RESTART` est dû et n’a pas déjà été envoyé depuis le dernier épisode d’absence, prendre une variante `RESTART`.
4. Sinon si véritable première séance, prendre une variante `FIRST`.
5. Sinon constituer les familles éligibles (`PROGRAM` ou `RECUR`/`SINGLE`, catégorie unique connue, jour, moment et `GEN`) et choisir une famille en **rotation déterministe et persistée**, en privilégiant les familles les moins récemment utilisées ; départager dans l’ordre `PROGRAM`, `RECUR/SINGLE`, `CAT-*`, jour, moment, `GEN`.
6. Éviter de répéter un même ID de modèle lors de deux notifications consécutives. Pour une occurrence et un état métier donnés, conserver le choix déjà effectué lors d’une simple reprogrammation technique, sauf si le contexte a changé.
7. Composer `title` et `body` ; si `body` dépasse 40 caractères, le remplacer par **le nom complet uniquement** ; jamais le tronquer applicativement. Ne pas créer de sous-titre.
8. Programmer le déclenchement local une seule fois pour l’occurrence ; enregistrer l’identifiant système de notification pour pouvoir l’annuler. Sur modification/annulation/réalisation/renommage : synchroniser les notifications planifiées.
9. Au toucher, router vers la séance et vérifier à nouveau qu’elle existe et est accessible ; si indisponible, afficher un état explicite plutôt que de démarrer autre chose.

**Définition d’« épisode d’absence » à tester :** au moins une occurrence planifiée passée, non réalisée et non annulée après la dernière séance terminée ; un message `RESTART` peut être montré pour cet ensemble, puis n’est plus répété tant qu’aucune nouvelle occurrence manquée ne survient. Une absence de réception de notification n’est pas une séance manquée.

**Plusieurs séances à la même heure :** émettre un rappel lié à chaque occurrence, sauf décision ultérieure de regroupement. L’OS peut les regrouper ; ne pas remplacer les noms par « Vos séances », puisque la règle produit impose les noms.

**Fuseau horaire :** appliquer le fuseau de référence retenu pour l’occurrence par le moteur de planification ; changements de fuseau et d’heure été/hiver à tester, sans déduire la règle produit des API natives.

## 5. Exemples de sortie finale

| Contexte | Titre | Corps |
|---|---|---|
| Première séance, samedi matin, nom `Mobilité douce` | C’est parti pour une première | Mobilité douce t’attend. |
| Séance cardio récurrente samedi, nom `Cardio 30 min` | On fait monter le rythme | Cardio 30 min t’attend. |
| Même séance, samedi suivant | Le week-end, on bouge | Cardio 30 min t’attend. |
| Séance programmée, nom `Renfo du haut du corps` | Une étape de plus | Renfo du haut du corps t’attend. |
| Après un manque, `Mobilité du dos` | On reprend le mouvement | Mobilité du dos t’attend. |
| Nom long `Renforcement musculaire du haut du corps et gainage` | À toi de jouer | Renforcement musculaire du haut du corps et gainage |

## 6. Contrat de développement / recette

**Entrée fonctionnelle :** `occurrenceId`, `sessionId`, `plannedAt` (avec fuseau), `sessionName`, `status`, `programId?`, `recurrenceId?`, `categoryIds[]`, états de séances passées, `previousTemplateIds[]`, préférence notification, autorisation système.

**Sortie :** `{templateId, title, body, data:{occurrenceId, sessionId}}` ; la date de notification et le canal sont gérés séparément.

**Tests minimaux :** couverture de toutes les familles ; titre ≤ 30 caractères ; corps commence exactement par le nom ; longueur courte/longue ; accents/apostrophes ; catégories multiples ; première séance + absence préalable ; série récurrente portant des noms identiques ; programme ; lundi/vendredi/samedi/dimanche ; cinq périodes horaires ; changement de fuseau ; changement heure été/hiver ; refus de permission ; changement de nom ou suppression après programmation ; séance accomplie en avance ; notification touchée après suppression ; non-répétition de modèles ; essai sur iOS et sur au moins deux profils Android de densité/police, et avec taille de texte augmentée.

**À confirmer avant intégration documentaire normative :** gestion des collisions de plusieurs séances au même instant ; éventuelle future préférence éditoriale sur les formulations ; politique de retards de livraison et d’annulation des notifications déjà visibles. Il ne s’agit **pas** de nouvelles décisions déjà enregistrées dans le registre de KODJO.

## 7. Références techniques vérifiées le 18/11/2026

- Apple HIG, notifications : https://developer.apple.com/design/human-interface-guidelines/notifications
- Apple, gestion des notifications / Focus : https://developer.apple.com/design/human-interface-guidelines/managing-notifications
- Apple, `UNNotificationAttachment` et tailles maximales : https://developer.apple.com/documentation/usernotifications/unnotificationattachment
- Android, guide design (30 caractères titre, 40 caractères corps) : https://developer.android.com/design/ui/mobile/guides/home-screen/notifications
- Android, BigPictureStyle : https://developer.android.com/develop/ui/compose/notifications/expanded
- Expo SDK 57, `expo-notifications` : https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
- KODJO, catégories prédéfinies : https://github.com/MyUncried/Application-Routine/blob/main/src/domain/categories/defaults.ts
- KODJO, projection des catégories de séance : https://github.com/MyUncried/Application-Routine/blob/main/src/features/sessions/sessionCatalogueProjection.ts

**Périmètre documentaire :** ce fichier est un livrable indépendant, pas une modification du dépôt GitHub, de Figma ou d’une baseline ZIP.

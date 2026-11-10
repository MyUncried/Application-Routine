# Lot PRE-10 — Son et annonces vocales de l'Exécution

## Origine

Recette iPhone PRE-10 n° 2 du 09/11/2026, choix provisoire 6 (`q-son`) : « OK = ajouter expo-audio / expo-speech maintenant (nouvelle version native) ». Hermann, même jour : « Oui » à la préparation du lot ; installation et build EAS soumis à son feu vert.

## Règles applicables (classe A, rien à décider)

- ch08 « Guidage sonore » : Sons et Annonces vocales actifs au début de chaque Exécution, modifiables pendant (interrupteurs déjà livrés) ; annonce vocale du nom de l'Exercice à son début ; « Récupération » au début de `SIDE_RECOVERY` / `POST_ACTIVITY_RECOVERY` ; côté annoncé « côté 1 » / « côté 2 », jamais droite / gauche (RM-243) ; bip aigu pendant les trois dernières secondes de toute étape chronométrée ; Répétitions sans bip et À l'échec sans bip : bip minute ; cadence : signal périodique, sans signal final distinct.
- ch08 « Arrière-plan et verrouillage » : sons et annonces maintenus « dans la mesure permise par iOS et Android » ; comportement précis renvoyé au spike (RT-001 / P6).
- Signaux déjà planifiés par le moteur (`signals.ts`, `ExecutionService.emitSignal`) : `TRANSITION` (phase, nom d'Exercice, côté), `COUNTDOWN`, `CADENCE`, `MINUTE`. Aucune modification du moteur.

## Réalisation prévue

1. Espace de travail séparé (`C:\Dev\PRE10-SON`, branche `pre10-son-voix` depuis `pre10-bmad/dev`) avec son propre `node_modules` : celui de PRE10 est une jonction vers `KODJO-BMAD-PRE8`, qu'une installation modifierait.
2. `npx expo install expo-audio expo-speech` (versions du SDK 57) ; plugin `expo-audio` dans la configuration si la documentation v57 l'exige.
3. Deux sons courts générés (bip aigu, bip grave ; WAV mono, quelques ko) dans `assets/sounds/`.
4. `ExecutionSignalAdapter` : restitution par canal, chacun indépendant et sans effet sur l'Exécution en cas d'échec natif :
   - vibration : inchangée ;
   - son (`soundEnabled`) : `COUNTDOWN` → bip aigu ; `CADENCE`, `MINUTE` → bip grave ;
   - voix (`voiceEnabled`, français) : `TRANSITION` d'un Exercice → nom, suivi de « côté 1 » / « côté 2 » pour un Exercice avec changement de côté ; `TRANSITION` de récupération → « Récupération ».
   - Session audio : lecture même en mode silencieux, les autres sons (musique) atténués pendant un bip ou une annonce puis rétablis.
5. Tests : choix du son / du texte par signal, interrupteurs, échec natif sans effet ; modules natifs simulés dans Jest.
6. Documentation : ch12 §12.11 (choix technique, classe D) ; spec PRE-10 et rapport.
7. Build EAS `development-bmad` (iOS), après feu vert ; installation sur l'iPhone ; Metro servi depuis `PRE10-SON`.

## À CLARIFIER (n'empêchent que le point concerné ; choix provisoires proposés)

1. **Son de transition** : ch08 ne prévoit qu'une annonce vocale au début d'une étape. Proposé : avec la voix coupée et le son actif, un bip grave au début de chaque étape ; aucune annonce pour Compte à rebours initial, Pause entre séries et Fin de séance.
2. **« Bip grave pendant les exercices chronométrés »** (ch08, liste du guidage) : sens non précisé (bip de cadence ? battement régulier ?). Proposé : bip grave réservé à la cadence et au signal minute ; rien de plus pendant une Durée.
3. **Arrière-plan / écran verrouillé** : non traité dans ce lot (spike RT-001 / P6) ; sons et annonces au premier plan seulement.

## Feu vert et réalisation (09/11/2026)

Hermann : « Feu vert pour toutes les étapes ». Les trois choix provisoires À CLARIFIER sont appliqués tels que proposés (non confirmés explicitement ; à confirmer en recette, points S5–S7 du cahier). Réalisé : `npm ci` dans `PRE10-SON` ; `expo-audio` ~57.0.5, `expo-speech` ~57.0.3 ; plugin `expo-audio` non ajouté (documentation v57 : inutile pour la lecture au premier plan ; il ajouterait mode audio d’arrière-plan et permission micro) ; `ExecutionSounds`, `ExecutionVoice`, `ExecutionSignalAdapter` ; tests `ExecutionSignalAdapter.test.ts` ; ch12 §12.11 (note d’implémentation, classe D). Classe des comportements : A (ch08 « Guidage sonore », RM-243) et C pour les trois choix provisoires.


## Recette « Son et voix » du 09/11/2026 — retours et suite

Notes de Hermann (cahier en ligne, recopiées textuellement) :

- S1 (KO) : « Impression d’un très léger décalage entre le bip et le tempo, le bip en avance, peut être dû à la durée du bip. »
- S2 : « Voix très robotique, qui saute un peu au début du premier. Un bip aigu comme un sifflet doit être entendu au démarrage à t0 »
- S3 (KO) : « Il faut annoncer les pauses et les récupération aussi. Annoncer le nombre de rep ou la durée avec le nom de l’exercice, en option (je n’ai pas défini où gérer l’option du nom de l’exercice). Il faut un bip, et qu’il soit spécifique, pour le pour d’arrêt »
- S6 (OK) : « La définition des sons doit se faire dans le profil (compte à rebours / fin de séance, départ d’exercice en compte à rebours / chronomètre, pause, point d’arrêt, récupération, dernier bip, activation guidage d’arrière plan ou pas). Cadence : le bip doit être comme un tic tac »
- S7 (OK) : « Je n’entends pas d’annonce ni de bip lorsque l’application tourne en arrière plan. Bip / voix d’arrière plan doivent être possible en fonction de la configuration dans le profil, voir dans la séance. »
- S9 (KO) : « La musique ne baisse pas de volume »
- S0, S4, S5, S8 : OK. S5 confirme le bip grave au début d’une étape sans annonce.

Réalisé sans nouveau build (JavaScript et sons seulement), classe B pour les règles et D pour la technique :

- S2 : sifflet à t0 au début de chaque Exercice, annonce du nom 450 ms après. La voix française de meilleure qualité installée est choisie (Premium, puis Améliorée). La session audio et la voix sont préparées au début de l’Exécution, et la session est activée avant de parler.
- S3 : « Pause » au début d’une Pause entre séries ; « Récupération » aussi entre blocs (`BLOCK_REST`) ; son spécifique au Point d’arrêt (deux notes descendantes).
- S6 : cadence en tic et tac alternés.
- S1 : son et vibration joués à l’image suivante, après l’affichage de la seconde. Cause **non démontrée** (écart estimé d’une à trois images).
- S9 : la session audio est désactivée après sa configuration, activée avant une annonce et libérée à la fin de la dernière. iOS n’applique `duckOthers` qu’à l’activation. Cause **plausible, non démontrée sur l’iPhone**.

À CLARIFIER / tranche ultérieure, sans rien bloquer d’autre :

1. Configuration des sons dans le Profil (S6) : écran et contenu à concevoir (Figma).
2. Annonce optionnelle des répétitions ou de la durée (S3) : emplacement de l’option non défini.
3. Guidage en arrière-plan (S7) : nécessite le mode audio d’arrière-plan (plugin `expo-audio`, `UIBackgroundModes`), donc un nouveau build. Il dépend aussi de la configuration du point 1.

Documents : ch08 « Guidage sonore » (complément daté).


## Définition complète du 10/11/2026 (formulaire « Guidage sonore KODJO »)

Source : base du formulaire https://claude.ai/artifact/68bqRRkmsuP9qKABnhr5BR, collection `definition`, lue le 10/11/2026. Hermann a laissé certains moments sans modification, ce qui vaut acceptation de la valeur proposée. La table est recopiée dans ch08 « Guidage sonore ».

- Moments modifiés :
  - dernières secondes : bip grave, 3 s, vibration moyenne ;
  - zéro : rien ;
  - départ en Répétitions : sifflet pur à 55 % ;
  - changement de côté : double bip à 55 % ;
  - cadence : clic doux à 35 % ;
  - signal minute : ding à 15 % ;
  - Point d'arrêt : double bip à 100 % ;
  - fin de séance : bip long, vibration moyenne.
- Moments acceptés tels que proposés :
  - Compte à rebours : « Préparez-vous » ;
  - départ en Durée : sifflet roulé ;
  - Pause entre séries : « Pause » ;
  - récupérations : « Récupération ».
- Réglages généraux :
  - musique : « tout » (atténuée pendant les annonces et les sons) ;
  - mode silencieux : audible ;
  - arrière-plan : oui ;
  - moment de l'annonce du nom : avant ;
  - détail des répétitions ou de la durée : selon une option ;
  - réglage : non coché, remarque « Les trois ».

Réalisé (JavaScript et sons, sans nouveau build) :

- Table appliquée : sons, volumes, vibrations par moment.
- « Prochain exercice : … » ajouté à l'annonce du Compte à rebours, de la Pause ou de la récupération qui précède un autre exercice. Au départ, le son seul, ou « Côté 1 » ; le nom n'est annoncé au départ que s'il ne l'a pas été avant.

À CLARIFIER (n'empêchent que le point concerné) :

1. **Musique « tout »** : atténuer la musique pendant chaque son oblige iOS à réactiver la session audio à chaque bip. C'est la cause probable des bips « très en retard » du 2e passage. Choix possibles :
   - (A) atténuer pendant les annonces seulement (appliqué en attendant) ;
   - (B) atténuer pendant toute l'Exécution ;
   - (C) atténuer à chaque son, en acceptant un retard.
2. **« Les trois »** : interprétation retenue, à confirmer : réglage dans le Profil, modification possible pour une séance, et interrupteurs Sons et Voix pendant l'Exécution.
3. **Tranche suivante**, qui demande un nouveau build et des écrans à concevoir :
   - réglages du Profil et de la séance ;
   - option d'annonce des répétitions ou de la durée ;
   - guidage en arrière-plan.

## Demandes du 10/11/2026 (après application de la définition)

Texte de Hermann, recopié :

> Peux tu ajouter au formulaire :
>  - la possibilité de renseigner le texte vocal avant le prochain exercice
>  - l’enregistrement du besoin suivant. A suivre : mettre en ligne la liste des exercices de la séance et afficher au fur et à mesure 1. l’exercice en cours (gras), mettre l’exercice passé en gris puis qui disparaît. C’est une tentative pour voir ce que cela apporterait avant de faire le Figma cible

Traitement :

- Formulaire « Guidage sonore KODJO » (version 3) : nouvelle fiche « Annonce du prochain exercice ». Texte proposé : « Prochain exercice : {prochain} », comme dans l'application aujourd'hui. Le texte retenu sera appliqué après lecture de la base. Aucun changement de code pour l'instant.
- Section « Besoins à suivre » ajoutée au formulaire. Le besoin ci-dessus y est enregistré (base, document `definition/besoins`).

À SUIVRE (non arbitré, aucune règle créée, classe C) : un essai de liste des exercices de la séance pendant l'Exécution :

- l'exercice en cours en gras ;
- l'exercice passé en gris, puis il disparaît.

Cet essai sert à juger l'apport avant le Figma cible. Il n'est ni spécifié ni planifié. Le Figma cible reste la référence du rendu.

## Réponses du 10/11/2026 aux trois points À CLARIFIER

Réponses de Hermann, recopiées :

1. Musique : « A — Annonces seulement (Recommandé) ». La musique baisse pendant les annonces vocales seulement. C'est déjà le cas dans l'application, aucun changement de code. Cette réponse remplace « tout ». Point 1 résolu.
2. « Les trois » : « Oui, les trois ». Réglage dans le Profil, modifiable pour une Séance, interrupteurs Sons et Voix pendant l'Exécution. Point 2 résolu.
3. Lot suivant : « Oui, prépare la spec ». La spec est rédigée dans `spec-guidage-reglages.md` et attend sa validation.

ch08 « Guidage sonore » est complété par une annotation datée (classe B).


## Recette iPhone du 10/11/2026 « Guidage sonore — définition » et choix du formulaire

Résultats de Hermann, recopiés (cahier, collection `results`) :

- G1 Compte à rebours, G4 départ en Répétitions, G5 bilatéral, G9 Point d'arrêt : OK.
- G2 dernières secondes : KO, « Le bip grave est la, mais il y a un autre son ne même temps, le son n'est pas pur. »
- G3 départ en Durée : KO, « Le sifflet roulé est la, mais il y a un autre son ne même temps, le son n'est pas pur. »
- G6 cadence : KO, « Le clic doux est la, mais il y a un autre son ne même temps, le son n'est pas pur. »
- G7 signal minute : KO, « Il n'y a pas de bip à la minute d'un exercice en répétition, et augmenter le son à 50% ».
- G8 Pause : OK, avec la note « A corriger : annoncer l'objectif (nombre de répétition, durée) avec le nom du mouvement. »
- G10 fin de séance : KO, « je n'ai rien entendu ».
- Constat : « Bilatéralité : annoncer "changez de côté" plutôt que "côté 1". et "premier côté" à la place de "côté 1" ».

Choix enregistrés dans le formulaire après l'application du 10/11 (base `definition`, lue le 10/11/2026) :

- annonce du prochain exercice : « À suivre : {prochain} » ;
- départ en Durée : sifflet roulé à 55 %, annonce « {exercice} » ;
- départ en Répétitions : sifflet pur à 85 %, annonce « {exercice} {répétitions} » ;
- changement de côté : sifflet court à 55 % ;
- zéro : bip grave à 100 %, sans vibration ;
- fin de séance : fanfare courte (raccourcie le 10/11) à 60 %, vibration moyenne.

Traitement (classe B, ch08 annoté) :

- Annonces :
  - « À suivre : {exercice}, {objectif} » au Compte à rebours, à la Pause ou à la récupération qui précède un autre exercice ;
  - objectif annoncé avec le nom au départ quand le nom n'a pas été annoncé avant ;
  - format de l'objectif : spec des réglages §7.3. Une plage de répétitions n'existe pas dans le modèle de cible actuel, rien n'est donc annoncé pour ce cas.
  - L'option d'annonce de l'objectif (Profil) reste dans le lot des réglages. D'ici là, l'objectif est toujours annoncé, comme demandé par la note G8.
- Bilatéral : « Premier côté » au départ, « Changez de côté » au changement de côté. Le constat prévaut sur l'annonce « {exercice}, côté {côté} » du formulaire.
- Zéro : bip grave quand l'étape qui commence n'a pas son propre son. Quand elle a un sifflet, seul le sifflet sonne (un signal par instant, T07).
- G10 :
  - le son de fin de séance est joué à l'achèvement de la Séance, nouveau signal `FINISH` du service d'exécution ;
  - avant cette correction, le bip long était joué au début de la Fin de séance seulement ;
  - le début de la Fin de séance reçoit le bip grave du zéro ou de la règle S5.
- G7 : ding porté à 50 %. Cause probable : le ding à 15 % était inaudible.
  - Le signal minute reste réservé aux Séries sans bip de cadence (ch08, `signals.ts`).
  - Si l'exercice testé avait un bip de cadence, c'est la règle actuelle. À confirmer par la recette h6.
- G2, G3, G6 : cause non démontrée. Les fichiers WAV sont propres (aucun écrêtage, un seul son). Deux hypothèses :
  - (a) la vibration, simultanée et audible ;
  - (b) le même son joué deux fois par deux instances.

  Correctif de sûreté contre (b) : un seul lecteur par son pour toute l'application, et un même signal n'est jamais restitué deux fois. Diagnostic demandé dans la recette h1 : rejouer avec Vibrations désactivé.


## Recette iPhone du 10/11/2026 « Guidage sonore — 2 »

Résultats et constats de Hermann, recopiés (cahier, collection `results`) :

- h1 : KO, « le son "click" est toujours la pendant les 3 bips, pas pendant la cadence, ni pour le point final ou le sifflet. enlever la vibration ne change rien. »
- h2 : KO, « J'entends le sifflet et le click de la cadence en même temps il faut retirer le click de la cadence quand 'il y a un sifflet / Au zéro, mettre le son de la "Pause" / du "Point d'arrêt" (double bip) ».
- h3 : OK, « régler le sifflet pur à la même force que le sifflet roulé (55%) ».
- h4 : OK, « Modifier : Découper le message des exercices en deux : le nom du mouvement tel qu'il est annoncé actuellement, le nombre de répétition ou la durée après le coup de sifflet. »
- h5 et h7 : OK.
- h6 : KO, « Je n'entends pas de signal à la minute, avec ou sans bip de cadence. »
- G7 : « A corriger : mettre le bip à la minute d'un exercice en répétition avec cadence aussi ; mettre son à 30% ».
- G8 et G10 : OK.
- t1 : KO, « Après avoir appuyé sur pause, puis reprendre la séance, le bip est décalé par rapport au temps. »
- Constats :
  - a) « Quand on appuie sur pause, il faut le son "Pause" / "Point d'arrêt" » ;
  - b) « Encore des problèmes de décalage entre les bips et le chrono, souvent après une pause et une reprise, dès fois deux clics très rapprochés notamment juste après une annonce. » ;
  - c) « Découper le message des exercices en deux : le nom du mouvement tel qu'il est annoncé actuellement, le nombre de répétition ou la durée après le coup de sifflet. » ;
  - d) « encore des problème d'annonce, mot qui premier saute ou avec première syllabe coupée » ;
  - f) « retirer le bip du démarrage du compte à rebours ».

Causes et traitement (classe B, ch08 annoté) :

- h1, cause démontrée par le code :
  - un exercice en Durée avec bip de cadence jouait ses clics jusqu'au zéro, en plus des trois bips graves ;
  - « son pas pur » de G2 n'est donc pas la vibration (confirmé par Hermann).
  - Correctif : plus de clic de cadence dans les trois dernières secondes d'une étape chronométrée (`signals.ts`).
- h2 :
  - pas de clic de cadence moins de 700 ms après un autre son (`ExecutionSignalAdapter`) ;
  - zéro : double bip.
- t1 et b :
  - cause démontrée par le code : après une Pause, les clics étaient ancrés sur l'instant de la reprise (§13 « premier nouveau bip après un intervalle complet »), donc décalés du chronomètre, qui affiche le temps actif.
  - Correctif : clics calés sur le temps actif. Le décompte des intervalles acquis (T04) n'est pas modifié.
  - Deux clics rapprochés après une annonce : cause probable, un clic retardé pendant la reconfiguration de la session audio, suivi du clic suivant à l'heure. Correctif : un clic demandé pendant une reconfiguration est omis plutôt que joué en retard. Cause non démontrée.
- a) : signal `PAUSE` émis par le service d'exécution pour une Pause de l'utilisateur. Il joue le double bip, avec une vibration forte.
- c) et h4 :
  - avant le départ : « À suivre : {exercice} » ;
  - après le sifflet : l'objectif, précédé de « premier côté », ou du nom s'il n'a pas été annoncé avant.
- d) : la parole attend 180 ms après la réactivation de la session audio (`VOICE_START_DELAY_MS`). Cause probable, non démontrée.
- f) : l'état de l'adaptateur (étape précédente chronométrée) n'est plus hérité de l'Exécution précédente. Cause démontrée par le code.
- G7 et h6 :
  - signal minute pour toute Série en Répétitions ou À l'échec, cadence comprise, prioritaire sur le clic au même instant ;
  - ding à 30 % ;
  - le test unitaire confirme l'émission à 60 s et 120 s.
  - Cause de l'absence sur iPhone non démontrée.
  - Un journal `[guidage]` (mode développement) est ajouté dans la console Metro pour la diagnostiquer à la prochaine recette.
- h3 : sifflet pur à 55 %.

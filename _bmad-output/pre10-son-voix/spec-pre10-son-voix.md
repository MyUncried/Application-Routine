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

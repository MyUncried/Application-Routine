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

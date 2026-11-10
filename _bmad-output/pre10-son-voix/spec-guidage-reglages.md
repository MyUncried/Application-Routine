# Spec — Réglages du guidage sonore, annonce du détail, guidage en arrière-plan

Lot : suite de PRE-10 son et voix (branche `pre10-son-voix`). Statut : **validée par Hermann le 10/11/2026** (réponses au §7). Rédigée le 10/11/2026.

## 1. Décisions sources (recopiées)

Réponses de Hermann du 10/11/2026 aux trois points À CLARIFIER de `spec-pre10-son-voix.md` :

1. Musique d'une autre application : « A — Annonces seulement ». La musique baisse pendant les annonces vocales seulement. Les bips ne la baissent pas, pour partir à l'heure. Cette réponse remplace « tout » de la définition du 10/11/2026.
2. « Les trois » : « Oui, les trois ». Le réglage se fait dans le Profil. Il est modifiable pour une séance. Les interrupteurs Sons et Voix restent disponibles pendant l'Exécution.
3. Lot suivant : « Oui, prépare la spec ».

Définition du 10/11/2026 (formulaire « Guidage sonore KODJO », réglages généraux) :

- arrière-plan : « Sons et annonces continuent » ;
- détail des répétitions ou de la durée : « Selon une option » ;
- moment de l'annonce du nom : « avant » (« Prochain exercice : … »).

Demande du 10/11/2026 : le texte de l'annonce avant le prochain exercice se renseigne dans le formulaire. Le texte retenu sera lu dans la base du formulaire et appliqué à l'application.

## 2. Existant (constaté dans le code et la documentation)

- Profil (`src/domain/preferences/Profile.ts`, CE-UI-07) :
  - quatre préférences : `soundsEnabled`, `voiceAnnouncementsEnabled`, `vibrationEnabled` et `notificationsEnabled` ;
  - elles s'enregistrent immédiatement, sans bouton Enregistrer.
- Exécution (`ExecutionScreen.tsx`) :
  - elle lit seulement `vibrationEnabled` ;
  - Sons et Voix sont toujours actifs au début de l'Exécution (`setAudible(true, true)`), puis modifiables par les interrupteurs ;
  - ch08 « Guidage sonore » le dit : « cette tranche ne lit ni n'enregistre encore de préférence utilisateur correspondante ».
- Séance : elle n'a aucun champ de guidage. Le Compte à rebours initial et la Fin de séance sont initialisés depuis le Profil (`SessionDraftProvider`).
- Arrière-plan :
  - `setAudioModeAsync({ shouldPlayInBackground: false })` ;
  - le plugin `expo-audio` n'est pas déclaré dans `app.json`, donc l'application n'a pas le mode d'arrière-plan `audio` ;
  - le spike RT-001 (ch12) n'a pas été réalisé sur ce point.

## 3. Périmètre proposé

### 3.1 Réglages du Profil (CE-UI-07)

Nouveau groupe « Guidage », à la place des lignes Sons et Annonces vocales actuelles :

| Ligne | Type | Défaut | Effet |
| --- | --- | --- | --- |
| Sons | bascule | activée | état initial de l'interrupteur Sons de l'Exécution |
| Annonces vocales | bascule | activée | état initial de l'interrupteur Voix de l'Exécution |
| Annoncer les répétitions ou la durée | bascule | désactivée | ajoute le détail à l'annonce du prochain exercice (§3.4) |
| Guidage écran verrouillé | bascule | activée | sons et annonces continuent en arrière-plan (§3.5) |

Les lignes Vibration et Notifications restent inchangées. L'enregistrement est immédiat, comme les autres préférences du Profil.

La table « son, volume, annonce, vibration » par moment reste fixe dans l'application, selon la définition du 10/11/2026. Elle n'est pas réglable dans le Profil, voir À CLARIFIER 1.

### 3.2 Modification pour une Séance

- Champs de la Séance, nullables. `null` signifie « comme le Profil ».
  - `soundsEnabled`
  - `voiceAnnouncementsEnabled`
  - `announceDetail`
- Emplacement proposé dans la Composition : un élément « Guidage », placé avec le Compte à rebours initial. Il affiche « Comme le Profil » ou les réglages propres à la Séance, et ouvre une feuille à trois bascules avec « Revenir au Profil ». Voir À CLARIFIER 2.
- Le guidage en arrière-plan reste un réglage du Profil seulement, car il touche l'appareil et pas la Séance.
- Données :
  - migration SQLite : trois colonnes nullables sur la Séance ;
  - copie dans l'instantané d'Exécution (`plan.ts`), comme `initialCountdownSeconds`.

### 3.3 Exécution

- État initial des interrupteurs Sons et Voix : la valeur de la Séance, sinon celle du Profil.
- Les interrupteurs restent modifiables pendant l'Exécution. Ce changement ne s'enregistre ni dans la Séance ni dans le Profil, comme aujourd'hui.

### 3.4 Annonce des répétitions ou de la durée

- Quand l'option est active, le détail suit le nom dans l'annonce du prochain exercice, avec le texte retenu dans le formulaire. Par exemple :
  - « Prochain exercice : Pompes, 12 répétitions » ;
  - « Prochain exercice : Gainage, 45 secondes ».
- Si le nom est annoncé au départ (aucune annonce avant), le détail suit aussi le nom.
- Formats à confirmer : voir À CLARIFIER 3.

### 3.5 Guidage en arrière-plan (iOS)

- Technique, selon la doc Expo SDK 57 (`expo-audio`) :
  - déclarer le plugin `expo-audio` dans `app.json`, avec `enableBackgroundPlayback: true`, qui ajoute le mode d'arrière-plan `audio` ;
  - passer `shouldPlayInBackground: true` à `setAudioModeAsync` quand le réglage est actif.
  - Cela demande un **nouveau build EAS**.
- Risque principal : la doc Expo ne garantit pas que le JavaScript (moteur et minuteries) continue de tourner en arrière-plan.
  - Une session audio active le maintient en général sous iOS, mais rien n'est démontré.
  - Il faut d'abord un **spike RT-001 ciblé sur iPhone réel**, sur un build de développement :
    - écran verrouillé pendant une séance de 10 minutes ;
    - bips à l'heure ;
    - annonces ;
    - reprise au premier plan.
  - Si le JavaScript est suspendu, la solution est à revoir avant d'en faire une règle, par exemple des sons planifiés à l'avance. Ce point sera alors soumis à Hermann.
- Les vibrations ne sont pas restituées par iOS quand l'application est en arrière-plan. Une règle fonctionnelle explicite est à écrire après le spike.
- Musique : choix A, la musique baisse pendant les annonces seulement, y compris en arrière-plan.

## 4. Documents à mettre à jour (classe B)

- ch08 « Guidage sonore » :
  - réglages Profil, Séance et Exécution ;
  - détail répétitions ou durée ;
  - arrière-plan ;
  - remplacement de la phrase « ne lit ni n'enregistre encore ».
- ch13 CE-UI-07 : groupe Guidage. Contrat de Composition : élément Guidage et sa feuille.
- ch09 : nouveaux champs du Profil et de la Séance.
- ch12 : RT-001 (résultats du spike arrière-plan) et note `expo-audio` en arrière-plan.
- ch07 : décisions D-xxx (musique A, « Les trois », arrière-plan, option détail).

## 5. Découpage proposé

1. **Spike arrière-plan** (build de développement, iPhone) : il conditionne le §3.5.
2. Profil : groupe Guidage et lecture par l'Exécution. Le §3.1 et le §3.3 sans la Séance.
3. Séance : champs, migration, élément Guidage de la Composition, instantané d'Exécution.
4. Annonce du détail et texte du formulaire.
5. Arrière-plan, selon le résultat du spike.

Pour chaque étape : tests Jest du domaine et des services, recette iPhone via le cahier en ligne, rapport de mission.

## 6. À CLARIFIER

1. **Niveau de réglage dans le Profil** :
   - (A) bascules générales seulement, table par moment fixe (proposé) ;
   - (B) choix du son et du volume par moment ;
   - (C) formulaire complet par moment (son, volume, annonce, vibration).
2. **Emplacement du réglage de Séance** : élément « Guidage » dans la Composition (proposé), ou ailleurs (paramètres de la Séance, écran de lancement de l'Exécution). Une maquette Figma est-elle attendue avant le code ?
3. **Formats du détail** :
   - plage de répétitions : « 8 à 12 répétitions » ;
   - À l'échec : rien, ou « jusqu'à l'échec » ;
   - durée en minutes : « 1 minute 30 ».
4. **Arrière-plan désactivé** : quand l'application passe en arrière-plan, l'Exécution continue sans son, ou se met en pause ?

## 7. Réponses du 10/11/2026 (recopiées)

1. Profil : « A — Bascules générales (Recommandé) ». Le Profil a quatre bascules. La table par moment reste fixe.
2. Séance : « Élément Guidage (Recommandé) ». Un élément « Guidage » dans la Composition, près du Compte à rebours initial. Claude propose l'écran sans maquette Figma préalable.
3. Détail : « Proposition (Recommandé) ». Les textes sont :
   - « 8 à 12 répétitions » ;
   - « jusqu'à l'échec » ;
   - « 1 minute 30 ».
4. Arrière-plan désactivé : « Continue sans son (Recommandé) ». Le temps continue sans son ni annonce, et le guidage reprend au retour.

Les quatre points À CLARIFIER du §6 sont résolus.

## 8. Ajout du 10/11/2026 : bibliothèque dédiée aux sons courts

Décision de Hermann, recopiée :

- « la gestion des sons est importante pour Kodjo, le respect du tempo aussi, sasn décalage. que coute vraiment de créer une bibliothèque dédiée aux sons courts ? faut-il revoir tous les sons déjà choisis ? »
- « ok, faisons comme cela » : elle est ajoutée à ce lot, avant PRE-11.

Contexte :

- \`expo-audio\` lit les sons avec un lecteur prévu pour la musique et la vidéo.
- Après une annonce vocale, rejouer un même lecteur claque. C'est démontré le 10/11/2026 sur l'écran de diagnostic des sons. Le correctif actuel crée un lecteur neuf par son.
- Chaque son part 25 à 40 ms après sa demande, avec une petite variation.

Périmètre :

1. Spike sur l'écran de diagnostic, dans la nouvelle version native déjà requise par le guidage en arrière-plan. Une bibliothèque de sons courts compatible avec Expo SDK 57 est à choisir ; la compatibilité est à vérifier, rien n'est supposé. Critères :
   - aucun click, y compris après une annonce ;
   - sons programmés à l'avance sur l'horloge audio : bips de fin et cadence à l'instant exact ;
   - mode silencieux ;
   - cohabitation avec \`expo-speech\` et avec la musique atténuée toute la séance (décision 1.A) ;
   - arrière-plan.
2. Remplacement de l'implémentation de \`BeepPort\` (\`ExecutionSounds\`). Le moteur, la table de guidage, la voix et les vibrations ne changent pas.
3. Les signaux de cadence et de fin d'étape sont programmés à l'avance, à partir du temps actif de l'étape, au lieu d'être joués à leur instant.
4. Recette du guidage sonore sur iPhone.

Sons : les fichiers et les choix du formulaire sont conservés tels quels ; rien n'est à revoir.

Ordre conseillé : avant PRE-11. Les Formats à fenêtres et à échéance (EMOM, Tabata, AMRAP) enchaînent de nombreux bips sur le tempo.

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

### 8.1 Essai : musique modulée dans les silences (accord de Hermann du 10/11/2026, « ok »)

Constat : iOS n'atténue ou ne rend le volume des autres applications qu'en désactivant puis réactivant la session audio de KODJO. Avec la musique modulée, cela a produit :

- des bips décalés et deux bips manquants (journal du 10/11/2026, observé) ;
- probablement des sons coupés net, non démontré.

D'où la décision 1.A : musique atténuée toute la séance.

Essai à mener dans le spike de la bibliothèque dédiée :

- les sons étant programmés à l'avance, ne reconfigurer la session que dans une fenêtre sans son prévu, par exemple au début d'une récupération ;
- objectif : musique atténuée pendant l'effort et rendue pendant les récupérations, sans click ni décalage.

Si l'essai réussit, le choix sera soumis de nouveau à Hermann. Sinon, 1.A reste en vigueur.


## 9. Réalisation de l'étape 2 (10/11/2026) : groupe Guidage du Profil

Demande de Hermann, recopiée : « C’était juste un essai. Mettons cette liste de côté et continuons le développement ».

Réalisé :

- Profil :
  - préférence `announceObjectiveEnabled`, dans la table singleton `guidance_preferences` (`migration025`, version 25) ;
  - `profiles` reste inchangée ;
  - la table accueillera « Guidage écran verrouillé ».
- Écran Profil : groupe **Guidage** (Sons, Annonces vocales, Annoncer les répétitions ou la durée), placé entre Séance et Préférences. Le groupe Préférences garde Vibration et Notifications.
- Exécution :
  - état initial des interrupteurs Sons et Voix selon le Profil ;
  - annonce de l'objectif selon la préférence (`ExecutionSignalAdapter.setAnnounceObjective`).
- Documents : ch08 (remplacement daté), ch09 (attribut), ch13 CE-UI-07 (groupe Guidage).

Écart au §3.1 :

- La bascule « Annoncer les répétitions ou la durée » est **activée** par défaut, et non désactivée comme prévu au §3.1.
- Raison : Hermann a demandé ensuite d'annoncer l'objectif (G8, « A corriger : annoncer l'objectif »), puis a validé ce comportement (h4, k6).
- À confirmer par Hermann.

Restent :

- étape 3 : réglage de Séance, élément Guidage de la Composition ;
- étape 5 : arrière-plan, avec la nouvelle version native ;
- §8 : bibliothèque dédiée aux sons courts.


## 10. Catégories d'annonces séparées (10/11/2026)

Recette p3 KO, recopiée : « Annonce vocale coupée, annonce objectif activé : il annonce toujours le nom du mouvement ».

Précision de Hermann, recopiée : « Je m’attends à ce que que l’annonce vocale n’arrête que l’annonce des noms de mouvements, et que l’annonce de répétitions durée n’arrête que l’annonce de la répétition et de la durée mais pas l’annonce du nom. On est d’accord ? »

Réponses, recopiées :

- autres annonces : « Il faut séparer : noms d’exercices ; pauses / récupérations / point d’arrêt ; début / fin de séance ; changements de cote » ;
- interrupteur Voix de la séance : « Oui, toute la voix ».

Analyse : le comportement constaté était conforme au code (Annonces vocales coupait toute la voix), mais pas à l'attente de Hermann. Il s'agit d'une évolution validée (classe B), pas d'une anomalie.

Réalisé :

- Cinq catégories, chacune activée par défaut :
  - nom des exercices (`voiceAnnouncementsEnabled`, renommé « Annoncer le nom des exercices ») ;
  - répétitions ou durée ;
  - pauses et récupérations ;
  - début et fin de séance ;
  - changements de côté.
- `migration026` (version 26) : trois colonnes sur `guidance_preferences`.
- `ExecutionSignalAdapter.setAnnouncements` : chaque partie de l'annonce suit sa catégorie, par exemple « Récupération » et « À suivre : X ».
- Interrupteur Voix : coupe tout ; il démarre actif si au moins une catégorie est active.
- Le Point d'arrêt et la fin de séance n'ont pas d'annonce vocale aujourd'hui ; leurs bascules ne coupent rien de plus pour l'instant.
- Documents : ch08, ch09, ch13 (CE-UI-07).

Recette « Annonces par catégorie » (10/11/2026) : a2, a3, a4 et p3 OK.

a1 KO, recopié : « Annoncer le début de séance (préparez vous) est toujours actif malgré l’interrupteur inactif (on n’annonce la fin de séance actuellement, il faut ajouter une annonce après le son « Bravo, séance terminée ») ».

- Analyse :
  - dans le journal, une séance a démarré avec `session:true` et a annoncé « Préparez-vous » ; la suivante, avec `session:false`, n'a rien annoncé ;
  - cause probable : les catégories n'étaient lues qu'à l'ouverture de l'écran d'Exécution, donc une modification du Profil faite pendant que l'écran restait ouvert n'était pas prise en compte. Non démontré.
- Correctifs :
  - les catégories sont relues au retour sur l'écran d'Exécution ;
  - « Bravo, séance terminée » est annoncé 0,8 s après la fanfare d'achèvement (catégorie début et fin de séance ; classe B, ch08 annoté).


## 11. Phases du mouvement (constat B du 10/11/2026)

Constat de Hermann, recopié : « Il manque l’annonce des phases de l’exercice, et le bip des phases de l’exercice. »

Choix de Hermann, recopié : « Bip et nom de la phase (Recommandé) ».

Réalisé (classe B, ch08, ch09 et ch13 annotés) :

- Signal `PHASE` (`signals.ts`) au début de chaque phase du motif D-446 :
  - sauf à l'instant 0 (départ de l'exercice) ;
  - jusqu'à la limite du guidage (`nominalGuidanceSeconds`) ;
  - jamais dans les trois dernières secondes d'une étape chronométrée ;
  - priorité : après le compte à rebours, avant le signal minute et la cadence.
- `ExecutionService` transmet le motif de l'exercice en cours et le nom de la phase (`phaseLabel`).
- `ExecutionSignalAdapter` : bip court à 50 %, vibration légère, puis le nom de la phase si la catégorie « phases » est active.
- Profil : bascule « Annoncer les phases du mouvement », `migration027` (version 27).
- Son : « Bip court » de la bibliothèque du formulaire, **provisoire**. Hermann peut en choisir un autre dans le formulaire.

## 12. Fin de PRE-10 — étapes 3 et 4 réalisées (11/11/2026)

Demande de Hermann, recopiée : « lance le développement pour terminer PRE-10 ».

Étape 3, Séance (§3.2 et §3.3, réponse 2 du §7 « Élément Guidage (Recommandé) ») :

- trois réglages nullables sur la Séance : Sons, Annonces vocales, Annoncer les répétitions ou la durée ; `null` = comme le Profil ;
- `migration028` (version 28) ; Séances existantes inchangées ;
- élément « Guidage » de la Composition, au-dessus du Compte à rebours initial, et feuille « Guidage de la séance » (✕, ✓, trois bascules avec leur origine, « Revenir au Profil ») ; écran proposé sans maquette Figma, à valider en recette ;
- copie dans l'instantané d'Exécution ; au démarrage, interrupteurs Sons et Voix selon la Séance, sinon le Profil ; annonce de l'objectif selon la Séance quand elle a son réglage.

Choix techniques (classe D) :

- l'interrupteur Voix de la Séance porte toutes les annonces, comme celui de l'Exécution (décision « Oui, toute la voix ») ;
- les autres catégories d'annonces restent des préférences du Profil seulement.

Étape 4, annonce du détail (§3.4, réponse 3) : déjà conforme. « jusqu'à l'échec » et « 1 minute 30 » sont produits par `objectiveText`. « 8 à 12 répétitions » est sans objet : le modèle n'a pas de plage de répétitions (cible : nombre, échec ou non renseignée).

Classe A, hors de cette spec : écran maintenu actif pendant l'exécution (ch09 Profil, « Écran maintenu actif »). Aucune bascule du Profil n'est réalisée : aucun contrat d'écran ne la décrit (non arbitré, À CLARIFIER si elle est voulue).

Restent : étape 1 (spike arrière-plan) et étape 5 (arrière-plan), §8 (bibliothèque de sons courts) et §8.1 (modulation de la musique). Toutes demandent une nouvelle version native (build EAS).

### 12.1 Nouvelle version native et spike (11/11/2026)

Décision de Hermann, recopiée : « Oui, un seul build (Recommandé) » ; « Oui, relance Metro ».

- Build EAS `development-bmad` `2e47648d` (commit `bfe40729`) : `react-native-audio-api`, plugin `expo-audio` (arrière-plan, sans micro), `react-native-svg`.
- Spike (§8, étape 1) : écran de diagnostic, essais K1 à K6 :
  - click après annonce ;
  - cadence avec annonce ;
  - tempo actuel contre programmé ;
  - arrière-plan programmé d'avance ou au fil de l'eau ;
  - musique modulée (§8.1).
- Le remplacement de `BeepPort` (§8, étapes 2 et 3) et le guidage en arrière-plan (étape 5) attendent les résultats du spike sur iPhone.
- Écran d'Exécution (CE-EXEC-SESSION-01) :
  - réalisés : Roboto Condensed, chrono circulaire, piste par Tours ;
  - À CLARIFIER : sens de remplissage de l'anneau. Choix provisoire : il se remplit avec le temps écoulé.

### 12.2 Recette du 11/11/2026 (cahier) — décisions recopiées et traitement

- Constat d (demande de Hermann, texte complet dans le cahier) : « Modifie le développement actuel pour aligner le Profil, ses Préférences et le guidage sonore de la Composition de séance sur le design validé. […] Récupère la documentation publiée sur main au commit ebe72f76 et conserve les évolutions déjà présentes sur ta branche. » Précision ultérieure : « Pour être clair, ne développe pas l'écran Profil (navigation) - Profil (section), mais uniquement les écrans Profil (navigation) - Préférences ». Classe B. Remplace §3.2 et §3.3 (élément Guidage, trois réglages nullables).
- w1, w2, w3 (élément et feuille Guidage) : remplacés par la modale Guidage sonore.
- x2 : « le mouvement circulaire est saccadé, il doit être fluide et continu quelque soit la durée. » ; « pas de mouvement circulaire pendant le compte à rebours et la fin de séance ». x3 : OK (sens validé). x4 : « Il faut que ce soit la même chose avec cadence, un tour par minute puis recommence. » Classe B.
- Constat a : « Pendant un appel vidéo ou téléphonique, ou l'utilisation d'une autre application, il faut une interruption de la séance, par défaut. » Classe B ; À CLARIFIER : verrouillage de l’écran.
- Constat b : « Première annonce d'exercices, dire "Premier exercice" s'il y en a plus d'un, et sinon "A suivre" comme maintenant. » Classe B.
- Spike : K1, K2, K4 OK ; K3 et K5 non renseignés ; K6 KO, constaté sur une séance (musique Spotify non baissée au retour), pas sur l’essai K6 de l’écran de diagnostic. Le remplacement de `BeepPort` attend K3, K5 et K6.
- À CLARIFIER : groupe Exercice et Récupération après exercice conservés dans les Préférences ; sons du système du design ; moment du signal Mi-temps ; verrouillage de l’écran et Pause.

### 12.3 Retour du 11/11/2026 sur l’alignement Figma

- Hermann, recopié : « tu n'as pas utilisé la référence Figma pour le layout / La charte graphique, ni le contenu des préférences ou je vois encore des anciennes entrées. A corriger avec que je ne continue les tests ». Classe B.
- Préférences : en-tête à onglets du Figma (composant des Catalogues), Notifications, Séance (deux réglages), Annonces vocales, Sons et vibrations ; bloc Identité, groupe Exercice et Récupération après exercice retirés de l’écran (valeurs conservées et appliquées).
- Modale et Choix d’un son : présentation du Figma (groupes bordés, lignes de 40, valeur Regular 12, petit chevron ; lignes de 44, coche bleue).
- Restent À CLARIFIER : sons du système, Mi-temps, verrouillage de l’écran.

### 12.4 Retour du 11/11/2026 après-midi (cahier, y1 et y3)

- Hermann, recopié (y1) : « Supprimer le titre de section "Diagnostic des sons..." / Eloigner plus à gauche la colonne "Son", centrer le titre de la colonne / Compte à rebours et la fin de séance : utiliser le clavier et non pas le stepper / Remplacer "Toutes les X minutes" par "Toutes les minutes" (dans la modale et les préférences) ». Classe B.
- Hermann, recopié (y3) : « Quand "Aucun" est sélectionné, son nom doit être "Aucun" dans la liste des préférences, et non pas "Non". / Dans la modale : / - Supprimer le texte "Toucher un son..." / - quand "Par défaut" est sélectionné, le son par défaut de l'application doit aussi être coché en même temps, cela permet de savoir lequel c'est. ». Classe B.
- Préférences : Compte à rebours de la séance et Fin de séance au clavier numérique (`ProfileNumberField`), bornes inchangées (0 à 60 s), valeur hors bornes ramenée à la borne ; lien de diagnostic retiré de l’écran (l’écran de diagnostic reste dans le code, sans accès depuis les Préférences).
- Sons et vibrations (Préférences et modale) : « Toutes les minutes », « Aucun », colonne Son à largeur fixe (112 / 104) à 20 de l’interrupteur, titre centré.
- Choix d’un son : indication retirée ; « Par défaut » coche aussi le son par défaut de l’événement.
- Documents : ch13 (CE-UI-07, Guidage sonore) annoté. Classe D : aucune.

### 12.5 Retour du 11/11/2026 (récapitulatif Tabata)

- Hermann, recopié : « C’est un règle stupide que je n’ai jamais édictée et qu’il faut supprimer. » Classe B.
- Règle visée : « sauf le récapitulatif Tabata » (ch06 Guidage sonore, ch13 CE-UI Guidage sonore), introduite par le commit documentaire 935b6a5d du 11/11/2026. Exception supprimée, texte d’origine conservé et annoté.
- Code : aucun changement (le bouton reste dans l’en-tête de la Composition ; les écrans du questionnaire et du récapitulatif de Format n’en ont jamais eu). Cahier : essai z5 retiré.

### 12.6 Recette du 11/11/2026 au soir (cahier)

- r2, x2 (classe B) : « La règle à suivre est exactement l’inverse. L’anneau ne doit PAS tourner pendant le compte à rebours et la fin de séance. » ; « il ne faut pas de mouvement circulaire pendant le compte à rebours et la fin de séance » Anneau vide et immobile pendant le Compte à rebours initial et la Fin de séance (`ringMotion(…, still)`). ch13 CE-EXEC-SESSION-01 annoté.
- Constat de position (classe B) : « Entre deux exercices d’une séance, le chronomètre et les autres éléments affichés ne doivent jamais changer de position sur l’écran (à corriger : le chronomètre est plus haut ou plus bas en fonction des informations affichées). » Hauteurs fixes pour le titre (2 lignes), le contexte, le côté, l’objectif et le guidage. ch13 annoté.
- y5 (classe B) : « Le signal de mi temps est réservé aux exercice en durée définie, uniquement. On exclut les le compte à rebours, la fin de seance, les pauses et récupérations. » Signal `HALF_TIME` (événement Mi-temps, Bip long par défaut) à la moitié d’un exercice en Durée ; jamais en Répétitions, À l’échec, Compte à rebours, Fin de séance, Pauses ni récupérations ; aucun dans les trois dernières secondes. ch13 (À CLARIFIER résolu).
- Constat cadence (classe D) : « Le bip de cadence est en retard par rapport au chronomètre » K3, K5, K6 OK : `BeepPort` passe par la bibliothèque de sons courts quand le module natif est présent. ch12 annoté. À vérifier sur iPhone.
- z1 (classe B) : « A corriger : Mettre le bouton gris clair à 17 du bord, c’est la marge dans le développement, vérifie. » Marge vérifiée : 16 (`layout.screenGutter`, celle du bouton Fermer) ; bouton aligné dessus. ch12 annoté.
- y3 (classe B) : « Décaler plus à droite les clamps de la colonne "Son", centrer le titre de la colonne » : chevrons au bord droit de la colonne, valeur centrée dans la place restante, titre centré.
- z2 : « interrupteurs ne sont pas centrés verticalement sur leur ligne » — non corrigé : la mise en page centre déjà l’interrupteur (mesure native de React Native) ; capture d’écran demandée pour mesurer l’écart.
- w3 : essai devenu sans objet (rangée Guidage de la Composition retirée, z1) ; retiré du cahier. x4 : KO sans note, texte de l’essai mis à jour (un tour par minute, avec ou sans cadence), à refaire.

- z2, précisé par Hermann : « les interrupteurs sont trop hauts ». Interrupteurs des Préférences et de la modale abaissés de 2 (correction visuelle, classe D) ; valeur à ajuster sur constat.

- Colonne Son, précisé par Hermann : « Décaler un peu plus les chevrons à droite, et les textes aussi en réduisant l’espace avec les chevrons ». Colonne à 10 de l’interrupteur (au lieu de 20), valeur alignée à droite à 4 du chevron (au lieu de centrée à 7). Classe B.

- Colonne Son, Hermann : « L’espace est trop réduit pour le coup ». Valeur à 7 du chevron (au lieu de 4), toujours alignée à droite ; colonne à 10 de l’interrupteur.

- Hermann : « "phase" ne peut pas s’afficher ? » — « Changement de phase » était tronqué. Colonne Son réduite à la plus longue valeur : 96 (Préférences, au lieu de 112) et 90 (modale, au lieu de 104). Classe D. Tests : 52/52.

- Hermann : « Centrer vibration du l’interrupteur ». Titre « Vibration » centré, à la largeur mesurée de l’interrupteur (au lieu d’aligné à droite sur 51). Classe B. Tests : tsc, 52/52.

- m2 (classe A, décision 1.A du 10/11/2026 : musique atténuée pendant toute l’Exécution), Hermann : « Lance d'une séance > lancement de spotify > retour sur la séance > Reprendre la séance : La musique ne baisse à aucun moment lors de la séance. » iOS n’atténue que la musique déjà en cours à l’activation de la session ; au retour de l’application au premier plan pendant une Exécution, la session est désactivée puis réactivée (`reclaimExecutionAudio`). À vérifier sur iPhone.

- m2, second essai (classe A, décision 1.A : musique atténuée pendant l’Exécution, donc pas hors de l’application), Hermann : « Lance d'une séance > lancement de spotify > retour sur la séance > Reprendre la séance : La musique baisse > retour sur spotify : la musique ne redevient pas au volume initial > retour sur la séance : le son augmente et diminue de suite > Reprendre la séance : le volume reste diminué. » Session audio rendue quand l’application passe en arrière-plan (`releaseExecutionAudio`) ; au retour, simple réactivation, sans remontée passagère. [Désactivation puis réactivation au retour — remplacé.] À vérifier sur iPhone.

- m2, troisième essai (classe B, précision de la décision 1.A), Hermann : « Dernier écart : lorsque la séance est terminée et que je reste sur l'applciation le volume doit revenir à l'original, et notamment lorsque je retrouve sur Spotify. » Séance terminée, ou écran d’Exécution quitté : session audio rendue 4 s après (fanfare et annonce de fin jouées), la musique retrouve son volume ; une nouvelle Exécution reprend la session. À vérifier sur iPhone.

## 13. Suite du guidage (12/11/2026)

Demande de Hermann, recopiée (réponse à la liste « reste à faire » de PRE-10 : 1 sons programmés à l’avance, 2 guidage en arrière-plan, 3 écran de séance conforme à Figma, 4 fin de séance) :

« Le développement des bibliothèques prends plus de temps. En parallèle continuons le développement du guidage :

  1. Sons programmés à l’avance
  2. Guidage en arrière-plan : on a déjà un écran flottant conçu dans Figma " P-Exécution d'un exercice — Média plein écran" qu'on peut réutiliser dans le contexte d'une autre application ouverte, d'un appel, etc.
  3. Oui pour l'écran d'exécution de séance.
  4. Ok »

### 13.1 Sons programmés à l’avance (§8, étape 3) — réalisé

Classe A : le code rejoint la règle déjà écrite au §8, étape 3 (« Les signaux de cadence et de fin d'étape sont programmés à l'avance, à partir du temps actif de l'étape, au lieu d'être joués à leur instant »).

- `ExecutionService` : à chaque rafraîchissement et après chaque transition, les signaux de l’étape en cours (cadence, trois dernières secondes, minute, mi-temps, phases) des 1,5 s suivantes sont remis à `onScheduleSignal` avec leur délai, une seule fois chacun. Tout changement de génération de l’état (Pause, étape suivante, Suivant, Réinitialiser, fin) les annule (`onCancelScheduled`).
- `ExecutionSignalAdapter.schedule` : même son, même volume et même règle « pas de cadence juste après un autre son » qu’à l’instant ; à son instant, le signal donne la vibration et l’annonce, sans rejouer le son.
- `ScheduledSounds.scheduleIn` / `cancelScheduled` : départ sur l’horloge audio, lu au moment de la demande ; un son déjà commencé n’est jamais coupé.
- Inchangés : les transitions (zéro, sifflets, double bip, fanfare) restent jouées à leur instant, avec leur annonce ; sans la bibliothèque de sons courts (ancienne version de l’application, ou session rendue hors de l’application), le son est joué à son instant comme avant.
- À vérifier sur iPhone : cadence et bips des dernières secondes à l’heure ; aucun bip après une Pause, Suivant ou Réinitialiser.

### 13.2 Guidage en arrière-plan — écran flottant (ARBITRAGE en cours)

Référence Figma citée par Hermann : « Exécution d'un exercice — Média plein écran » (`5009:6069`, CE-MEDIA-EXEC-02).

Recherche technique (12/11/2026, sources dans le rapport de mission) :

- Fenêtre flottante iOS au-dessus des autres applications = Picture in Picture (`AVPictureInPictureController`, contenu dessiné image par image, iOS 15+). Aucune bibliothèque React Native maintenue ne le fait pour un contenu non vidéo : module natif Swift à écrire (Expo Modules API), nouveau build EAS.
- Contraintes Apple : le PiP ne démarre que sur une action de l’utilisateur (ou automatiquement à la sortie de l’application si l’écran est « en lecture ») ; impossible pendant qu’un appel FaceTime affiche sa propre fenêtre ; risque de revue App Store pour une application qui n’est pas une vidéo (précédent : minuteur refusé puis accepté).
- Alternative native : Live Activity (écran verrouillé et Dynamic Island) avec `expo-widgets` (SDK 57), chrono qui défile sans le JavaScript ; ce n’est pas une fenêtre libre.
- Non démontré : le JavaScript continue-t-il entre deux sons en arrière-plan (session audio active) ; les sons programmés d’avance (K5) tombent écran verrouillé.

Choix soumis à Hermann ; rien n’est développé avant sa décision. [Complété le 12/11/2026 — décision de Hermann : « On n'a pas besoin de suite de cette écran flottant, il faut qu'on règle les basiques d'abord, donc on met pour plus tard. » Écran flottant (hors de l’application comme dans l’application, CE-MEDIA-EXEC-01/02) reporté à plus tard ; aucun développement.]

### 13.3 Écran d’Exécution conforme à Figma (r6)

« Oui pour l'écran d'exécution de séance » : positions des éléments de l’écran d’Exécution de séance alignées sur Figma (CE-EXEC-SESSION-01). Réalisé (classe A, contrat CE-EXEC-SESSION-01 §7 complété) : disposition de `1992:8132`, icônes Figma (`assets/icons/execution-*.svg`). Écarts assumés : marges verticales réduites de 12 sous le titre et sous le cadre pour tenir dans la hauteur réelle (barre d’état de l’iPhone plus haute que celle de la maquette) ; formats de durée inchangés (« 00:05 ») ; boutons « Basculer le côté » non réalisés. À vérifier sur iPhone.

### 13.4 Fin de séance

« Ok » : fin de séance minimale conservée dans PRE-10 ; la Synthèse (Ressenti, Commentaire) relève d’une tranche ultérieure.

### 13.5 Recette e1 à e5 du 12/11/2026 — décisions de Hermann (classe B)

Notes de Hermann dans le cahier en ligne (e1 « Haut de l'écran », e2 « Zone Progression et suite »), recopiées :

- e1 a) « Arrondir les coins bas gauche et droite du cadre gris » ; e2 : « mettre les 4 coins du cadre gris arrondis ; laisser une marge à gauche et à droite en le fond gris clair et le bord de l'écran. » → zone à quatre coins de 24, marges latérales de la gouttière d’écran. Réalisé.
- b) « compte à rebours initial : montrer 3, 2, 1 puis ne pas montrer 0 et rapidement ; apparition du nombre de séries et de tours dès le début avec les autres information du cadre, commencer à 1/X pour les deux. » → secondes seules, jamais 0 ; Série et Tour du premier exercice dès le Compte à rebours. Réalisé. [Interprétation technique : le nombre seul (« 3 ») remplace « 00:03 » pendant tout le Compte à rebours initial.]
- c) « Disparition et apparition de tous les textes et symboles ou contrôles en fondu moyennement lent. Disparition à la fin du temps / Apparition en début du suivant. » → fondu de 0,5 s : effacement pendant la dernière demi-seconde d’un compte à rebours, apparition au début de l’étape suivante ; un bouton qui en remplace un autre apparaît en fondu. Positions inchangées. Réalisé.
- d) « Phases : montrer le texte le nombre de minutes / secondes, mais pas le décompte. » → « Contracter · 2 s ». Réalisé.
- e) « Appui sur pause : pendant une annonce > Elle se termine plutôt que de s'arrêter net. On supprime la fenêtre de dialogue […] » → plus de modale de Pause : Pause devient Démarrer (bleu), Réinitialiser devient Arrêt définitif (carré blanc sur rouge), sans texte (ch13 annoté). Réalisé. Annonce coupée net à la Pause : aucune commande d’arrêt de la voix à la Pause dans le code ; cause non démontrée, à observer sur iPhone sans la modale.
- f) « Au point d'arrêt : le bouton pause doit se transformer en bouton démarrer, appuyer dessus doit relancer l'exercice (les deux sont à corriger) ; Un chronomètre se déclenche, couleur gris clair du cercle » → Démarrer vaut Continuer ; chronomètre de l’attente (projection : Point d’arrêt chronométré), anneau gris clair. Réalisé. Le temps de Séance n’inclut toujours pas cette attente (arbitrage du 09/11).
- g) « Supprimer le texte "sur XX" sous le compte à rebours. » → la durée visée n’est plus répétée sous un compte à rebours ; « Sur 12 rép. » reste sous le chronomètre des Répétitions. Réalisé.
- h) « le bord du cercle tout en bas est rogné par le cadre gris, ainsi que la petite barre verticale qu'on ne voit pas. » → le haut de l’écran ne rétrécit plus ; l’écart au-dessus du cadre À suivre se resserre (40 → 12 au plus) quand la hauteur manque. Réalisé.
- i) « la voix n'est pas parfaitement claires […] ce n'était pas prioritaire. » → non traité (à instruire).
- e3 (KO) : « le bouton son ne coupe pas le son, alors que le bouton voix coupe les annonces et le son, à corriger ». Journal Metro de la recette : Son coupé → aucun son joué ni programmé (« sons=non »), annonces seules ; Voix coupée → sons programmés et joués (« sons=oui voix=non »). Écart non reproduit dans le journal : question posée à Hermann (ce qu’il entend, Son coupé).
- p4 : « Je ne comprends pas ce test » → reformulé dans le cahier.

### 13.6 Second passage de la recette e1 (12/11/2026, soir) — décisions de Hermann (classe B)

OK : e1a, e1c, e1d, e1e-pause, e1h, e3b (Son et Voix séparés), p4. Notes recopiées et traitement :

- e1b (KO) : « Série 1/X n'apparaît pas, le nombre de tours présent 1/2. Il faut que les deux présentent le nombre de séries et de tours de l'exercice à venir. La barre de progression doit présenter celle de l'exercice à venir, et ne pas progresser. » → projection `upcoming` (exercice à venir, Série sans filtre « plus d'une série ») ; piste à 0 pendant le Compte à rebours. Réalisé.
- e1-haut h et e1b : « retirer le temps total écoulé de la ligne Temps écoulé. Positionner cette valeur sous la barre de progression, aligné verticalement avec "Tour", aligné horizontalement à droite de la barre de progression. Même taille pour les deux textes, l'augmenter un peu. » → ligne « Tour … temps total » sous la piste, 13 pt. Réalisé.
- e1e-annonce (KO) et e1-haut e : « L'annonce doit s'arrêter net à la pause, et reprendre au début lorsqu'on recommence l'exercice. » → la Pause coupe l'annonce (en cours ou sur le point de partir) ; reprise de la même étape : redite depuis le début ; autre étape à la reprise : non redite. [§13.5 e, « Elle se termine plutôt que de s'arrêter net » — remplacé par cette décision.] Réalisé.
- e1f (KO) : « Le texte du chronomètre doit être gris foncé. le bouton réinitialiser doit être arrêt (carré blanc fond rouge). le bouton Suivant doit être désactivé. Le titre Série a disparu, il faut le laisser et mettre le numéro de série du prochain exercice. le titre de l'écran et l'écran entier, n'est pas point d'arrêt, mais l'exercice qui suit : exercice en durée : mettre le chrono au début du compte à rebours ; exercice en répétition : mettre le chrono à 00:00 (en noir) et attendre (ne pas faire défiler le chronomètre au niveau du cercle), faire tourner un chrono dans la zone du bas du cercle. Il disparait à la relance de l'exercice. Un texte "Appuyer sur démarrer" en bleu doit apparaître dans la zone haute du chrono. » → au Point d'arrêt : titre, Série, Tour et À suivre de l'exercice qui suit ; chrono à son départ (durée ou 00:00), anneau immobile ; « Appuyer sur démarrer » en bleu en haut de l'anneau ; chronomètre de l'attente en gris foncé en bas ; Arrêt (rouge) à la place de Réinitialiser (suspend puis arrête) ; Suivant désactivé ; Démarrer relance. [§13.5 f, anneau gris clair en mouvement — remplacé.] [Interprétation du 12/11 : « gris foncé » vise le chronomètre de l'attente, le chrono principal restant noir — remplacée.] Précision de Hermann (12/11, soir) : « Au point d'arrêt : le chrono à l'arrêt est en gris, le petit chrono qui tourne est en noir. » Réalisé.
- e1g : « La charge est trop petite et trop proche du chrono. On doit répartir les zones du haut et du bas comme suit : en haut le guidage : Côté, puis Phase ; en bas les objectifs : nombre de répétitions, puis Charge » → anneau : Côté, Phase, chrono, Objectif, Charge (20 pt, écartés du chrono). Réalisé.
- vi1 : « V3 n'aide pas, elle est légèrement plus lente. » ; vi2 : « V1 identique à V2. J'ai l'impression d'un fond de voix peu métallique très légèrement en décalé. notamment lorsque je compare avec les voix de siri. Les voix françaises installées sont toutes robotiques. » → la session audio de la séance n'est pas en cause ; la limite est la synthèse d'iOS accessible aux applications (les voix Siri ne le sont pas). ARBITRAGE ouvert : moteur de voix neuronal embarqué, ou voix neuronale en ligne générée et mise en cache, ou statu quo.
- Retour du soir (fondus) : « Entre deux exercices le cercle gris disparaît aussi, il ne faut pas, seul le cercle de couleur doit disparaître » → pendant la dernière demi-seconde d'une étape, l'anneau de couleur et sa pastille s'effacent en même temps que les textes ; l'anneau gris et les repères restent affichés. Constat technique : l'anneau de couleur, plus large que l'anneau gris, le recouvre entièrement en fin de compte à rebours. Réalisé.

- Retour du soir (cadre) : « Le temps écoulé, la ligne de séparation et le nombre de répétitions ont plus de marge à droite qu'il n'en a à gauche » → cadre Temps écoulé / À suivre avec marges égales (16 de chaque côté). [Marge droite de 32 relevée dans Figma `4790:6204` — remplacé.] Réalisé.
- Retour du soir (nom de la séance) : « Retirer le nom de la séance de l'écran » → la ligne de contexte de l'écran d'Exécution en cours ne montre plus que le nom de l'Exercice pendant une récupération ou une pause ; sa place reste réservée (positions fixes). L'écran avant le démarrage et l'écran de fin gardent le nom de la séance. ch13 annoté. Réalisé.
- Retour du soir (titre du départ) : « Remplacer le texte compte à rebours, par Préparez vous » → titre de l'écran d'Exécution pendant le Compte à rebours initial : « Préparez-vous ». Le nom de l'élément « Compte à rebours initial » reste inchangé dans la Composition et les réglages. Réalisé.
- Retour du soir (cercle) : « La centralisation verticale du chronomètre » puis « Correction, c'est le cercle qu'il faut centrer verticalement » → le cercle (repères compris) est centré entre le titre et le cadre gris : 22 au-dessus (ligne de contexte comprise) et 22 en dessous. Mesure sur la capture de Hermann : le chrono était déjà centré dans le cercle (2 px). Réalisé.
- Retour du soir (cadre Temps écoulé) : « Abaisser un peu le bord haut du cadre du temps écoulé pour que la marge intérieure en haut soit égale à la marge en bas » → bord haut abaissé de 8 (cadre 124, marge haute 13 ; mesure sur capture : 26 en haut contre 18 en bas), bas du cadre inchangé. Réalisé.
- Retour du soir (police des phases) : « Le texte des phase doit être de la même police que cote et le reste des textes » → ligne Phase en Roboto Condensed Medium 18 (au lieu d'Inter Medium 14), couleur inchangée. Réalisé.
- Retour du soir (repères) : « Foncer un peu les 16 barres autour du cercle » → repères intermédiaires à 70 % d'opacité (au lieu de 40 %, Figma), couleur et taille inchangées. Réalisé.
- Retour du 13/11 (cadre Temps écoulé) : « Éclaircir le cadre du temps écoulé pour améliorer le contraste » → fond du cadre blanc (#FFFFFF au lieu de #FAFAFE, Figma) sur la zone #F6F6FA. Réalisé.
- Retour du 13/11 (À suivre) : « Enlever l'information série dans le "A suivre" » → À suivre : nom de l'exercice suivant et sa valeur (durée, répétitions ou À l'échec), sans « Série n/N ». Réalisé.
- Retour du 13/11 (textes du cadre) : « Augmenter un peu la taille de mes trois textes du cadre temps écoulé. Pas les valeurs » → « Temps écoulé » 18 (au lieu de 16), « À suivre » 12 (au lieu de 10), nom de l'exercice suivant 18 (au lieu de 16) ; valeurs inchangées. Réalisé.
- Retour du 13/11 (phases) : « Les phases sont annoncées aléatoirement... » → constat dans les journaux Metro : « Rotule dos assis », 16 s, Contracter 6 s / Relâcher 2 s ; le changement de phase à 8 s tombait à la mi-temps, prioritaire (un seul signal par instant), et n'était ni sonné ni annoncé ; celui de 14 s tombe dans les trois dernières secondes, sans phase (recette du 10/11, constat B, inchangé). Décision technique, faute de règle écrite sur l'ordre mi-temps / phase : le changement de phase l'emporte sur la mi-temps (classe C résolue au plus près de la demande ; à confirmer par Hermann). Réalisé.
- Retour du 13/11 (départ du premier exercice) : « Après le compte à rebours, au départ du premier exercice, toutes les informations du cadre (sauf le temps total) disparaissent et réapparaissent. Elles ne doivent pas disparaître. » et « qu'il n'y a pas de blanc entre Préparez vous et le nom de l'exercice qui arrive, car là ça fait un peu effet flash » → la zone du bas (Série • Tour, À suivre), qui montre déjà l'exercice à venir pendant le Compte à rebours et au Point d'arrêt, ne s'efface ni ne réapparaît au départ de cet exercice ; le titre « Préparez-vous » ne s'efface plus avant la fin du compte à rebours, puis disparaît en fondu pendant que le nom de l'exercice apparaît (fondu enchaîné, 500 ms). [§13.5, fondus à chaque étape — précisé pour ces deux départs.] Réalisé.
- Retour du 13/11 (phases jusqu'à la fin) : « Annoncer les changements de phase jusqu'à la fin, oui » → les changements de phase sont signalés et annoncés aussi pendant les trois dernières secondes ; s'ils tombent sur un bip des dernières secondes, ce bip est joué et le nom de la phase annoncé. [Recette du 10/11, constat B : aucun changement de phase pendant les trois dernières secondes — remplacé.] La priorité de la phase sur la mi-temps (retour précédent) n'a pas été contestée : conservée. Réalisé.
- Retour du 13/11 (annonces des Séries) : « Effectivement c'est correct, dans ce cas : ne pas répéter ce qui ne change pas (le nom de l'exercice, le côté) ; annoncer deuxième série, troisièmes série, etc. » → Série suivante du même exercice : seul ce qui change est annoncé (« Deuxième série » ; « Changez de côté, première série » ; « Premier côté, deuxième série » en alternance ; objectif seulement s'il change). ch08 annoté. Constat préalable : l'enchaînement côté par côté de « Rotule dos assis » était conforme (simulation des deux ordres). Réalisé.
- Retour du 13/11 (Séries sans flash) : « Entre deux séries, même côté, les informations à l'intérieur du cercle disparaissent et les nouvelles apparaissent, cela fait un effet flash qu'il faut supprimer, comme pour le nom de l'exercice » → quand l'étape suivante est une Série du même exercice et du même côté (sans Pause entre elles), titre, contexte, contenu de l'anneau et zone du bas sont remplacés sur place, sans fondu de sortie ni d'entrée ; l'anneau de couleur s'efface et repart de zéro comme avant (f10). Avec une Pause entre séries ou un changement de côté, les fondus restent. Réalisé.
- Retour du 13/11 (anneau au départ) : « Après le compte à rebours, au démarrage de l'exercice, le cercle guide de couleur disparaît et réapparaît » → l'anneau de couleur (vide, pastille seule) ne s'efface plus à la fin du Compte à rebours initial. Réalisé.
- Retour du 13/11 (titre des pauses) : « Lors d'une pause ou un pause entre les cotes, retirer le sous-titre, et n'écrire que Pause » → Pause entre séries et Pause entre les côtés : titre « Pause », ligne de contexte vide. La Récupération garde le nom de l'exercice dessous ; « À suivre » garde « Pause entre les côtés » (non visé). ch13 annoté. Réalisé.
- Retour du 13/11 (cadres répétitions / charge, côté sous le titre) : « un cadre gris léger en bas à gauche du cercle pour accueillir le nombre de répétitions s'il existe ; le même cadre à droite pour la charge si elle existe. Pas de cadre si l'information n'existe pas (bords arrondis, valeur en gras centrée à l'intérieur, taille supérieure à la taille de la charge actuelle). Positionner l'information de côté sous le nom de l'exercice, qu'on peut remonter un peu sur l'écran. » → cadres #F0F1F5, rayon 12, Roboto Condensed Bold 24, en bas à gauche (« 12 rép. », ou « À l'échec ») et à droite (« 15 kg ») du cercle, absents sans valeur et au Point d'arrêt ; « Côté 1 » sous le titre (Roboto Condensed Medium 20, gris) ; titre remonté de 8 ; cercle toujours centré (24 au-dessus et en dessous). [§13.6 e1g, objectif et charge en bas de l'anneau ; côté en haut de l'anneau — remplacé.] Interprétation : « À l'échec » occupe le cadre des répétitions. Réalisé.
- Retour du 13/11 (Série et Tour) : « Abaisser la barre de progression ; réduire la taille de Série et de Tour, garder la taille des valeurs, et les mettre sur deux lignes (texte en haut, valeur en dessous) » → libellés « Série » / « Tour » en Roboto Condensed Medium 16 gris au-dessus des valeurs (« 1/2 », 30 gras, inchangées), point médian au niveau des valeurs ; piste à 26 sous les valeurs (au lieu de 20). Réalisé.
- Retour du 13/11 (valeurs Série / Tour) : « Augmenter la taille des valeurs » → valeurs de Série et de Tour (et point médian) en 36 (au lieu de 30). Réalisé.
- Retour du 13/11 (Série / Tour, suite) : « Centrer Série et Tour sur leur valeur. Mettre un trait vertical blanc de séparation à la place du point. Mettre plus d'espace entre le texte et sa valeur. » → libellé centré au-dessus de sa valeur, 8 d'écart (au lieu de 0) ; trait vertical blanc (2 × 52) entre Série et Tour, à la place du point médian. Réalisé.
- Retour du 13/11 (Série / Tour centrés) : « Centrer horizontalement série et tour dans leur espace respectif » → chaque paire libellé / valeur est centrée dans sa moitié de la zone. [Série contre le trait à droite, Tour à gauche — remplacé.] Réalisé.
- Retour du 13/11 (zone du bas) : « Attention, le cadre blanc s'est abaissé et a perdu sa marge en bas avec le cadre gris. Le restaurer. Augmenter légèrement la taille des valeurs, du texte série et tour aussi (même taille que temps écoulé). Rabaisser un peu la ligne Série / tour et leurs valeurs, abaisser le cadre gris. » → cause : la zone du bas, devenue plus haute (Série / Tour sur deux lignes), ne tenait plus et le cadre blanc débordait sous le cadre gris. Libellés Série / Tour 18 (comme Temps écoulé), valeurs 40 ; ligne Série / Tour à 34 du haut du cadre gris (au lieu de 30) ; place reprise : titre remonté de 8, commandes à 12 sous le cadre gris (au lieu de 24), marge basse de l'écran −6, piste à 18 sous les valeurs, écart minimal au-dessus du cadre blanc 10. Budget pour un iPhone de 402 × 874 : zone de 306 disponibles pour 305 nécessaires. Réalisé.
- Retour du 13/11 (capture, cadres coupés) : les cadres des répétitions et de la charge étaient coupés en bas (ils dépassaient de 12 sous la zone du cercle, coupée par le défilement du haut de l'écran) → la zone du cercle s'étend de 12 et contient les cadres ; position des cadres et écart de 24 jusqu'au cadre gris inchangés. Réalisé.
- Retour du 13/11 (haut du cadre gris) : « Abaisser les chiffres série et tour de quelques points, les textes un peu plus pour resserrer un peu, et beaucoup plus pour le cadre gris (il y a trop d'espace avec le bord haut) » → bord haut du cadre gris abaissé de 20 ; libellés Série / Tour +8, valeurs +4 (écart libellé / valeur 4) ; piste, cadre blanc et commandes inchangés ; cercle descendu de 10 pour rester centré entre le titre et le cadre gris (34 de part et d'autre). Réalisé.
- Retour du 13/11 (cadre gris, suite) : « On doit pouvoir abaisser encore le cadre gris » → bord haut encore abaissé de 10 (12 au-dessus de « Série » / « Tour ») ; contenu de la zone à la même place ; cercle descendu de 5, toujours centré (39 / 39). Réalisé.
- Retour du 13/11 (cadres, unités) : « rep et kg peuvent être un peu plus petit (conserver la taille des chiffres) et gris foncé sur gris clair » → dans les cadres, chiffres en 24 gras (inchangés), unités « rép. » / « kg » en 18 ; texte gris foncé #3C3C43 sur le gris clair du cadre (au lieu du noir). « À l'échec » reste en 24. Interprétation : « gris foncé » s'applique à tout le texte du cadre. Réalisé.
- Retour du 13/11 (cadres en haut) : « Même taille de cadre, texte centré à l'intérieur. Mettre les deux cadres en haut et non en bas » → deux cadres de même taille (92 × 40), texte centré, en haut à gauche (répétitions) et à droite (charge) du cercle, 12 au-dessus de l'anneau, sans chevaucher « Côté n » ; cercle toujours centré (39 / 39). [Cadres en bas du cercle, largeur selon le texte — remplacé.] Réalisé.
- Retour du 13/11 (cercle recentré) : « Le cercle peut être recentré verticalement » → depuis que « Côté n » est sous le titre, le cercle était à 15 de cette ligne et à 39 du cadre gris ; il est centré entre la ligne du côté et le cadre gris (27 de part et d'autre), les cadres répétitions / charge restant à 12 au-dessus de l'anneau. Réalisé.
- Retour du 13/11 (côté et phase dans le cercle) : « Côté 1 peut retourner dans le cercle en haut et la phase dans le cercle en bas » → « Côté n » en haut de l'anneau, phase (« Contracter · 6 s ») sous le chrono ; la ligne sous le titre ne porte plus le côté (vide pendant un exercice, nom de l'exercice pendant une récupération) ; cercle de nouveau centré entre le titre et le cadre gris (39 / 39). [Côté sous le titre ; phase au-dessus du chrono — remplacé.] Réalisé.
- Retour du 13/11 (phase, cadre gris, cadres) : « Abaisser un peu la phase dans le cercle 2/3 1/3 ; remonter un peu le grand cadre gris pour respecter la marge avec le bouton démarrer ; remonter un peu les deux cadres sur les côtés » → phase centrée aux deux tiers entre le bas des chiffres du chrono et le bord intérieur de l'anneau (le chronomètre d'attente du Point d'arrêt suit) ; cadre gris remonté de 8, commandes à 20 sous lui (au lieu de 12) ; cercle à 35 / 35 entre le titre et le cadre gris ; cadres répétitions / charge à 20 au-dessus de l'anneau (au lieu de 12). Budget de hauteur (402 × 874) : 276 disponibles, 275 nécessaires. Réalisé.
- Retour du 13/11 (cercle) : « Abaisser de 6px le cercle » → cercle et cadres répétitions / charge descendus de 6 (41 sous le titre, 29 au-dessus du cadre gris) ; cadre gris inchangé. Réalisé.
- Retour du 13/11 (cadres) : « Remonter un peu les deux cadres » → cadres répétitions / charge à 28 au-dessus de l'anneau (au lieu de 20) ; ils empiètent sur la ligne sous le titre, vide pendant un exercice (les cadres n'existent que pendant un exercice). Réalisé.
- Retour du 13/11 (Cycle) : « Il faut ajouter le cycle et donc séparer le cadre en trois. Lorsqu'il n'y a pas de cycle / tour / série, alors le texte et les valeurs sont écrites en gris » → zone du bas : Série | Tour | Cycle (traits blancs), toujours affichés ; projection `cycle` (répétition / nombre du Cycle, D-451), y compris pour l'exercice à venir ; sans valeur, libellé et « – » en gris clair #C4C6CE. Interprétation : valeur absente affichée « – » (et non « 1/1 »). La piste reste découpée par Tours. Réalisé.
- Retour du 13/11 (phases qui s'arrêtent) : « A un moment, qui semble aléatoire, les phases ne sont plus annoncées » → constat dans les journaux Metro (« Rotule dos assis », 12 répétitions, Contracter 6 s / Relâcher 2 s) : 24 changements de phase annoncés, de +6 s à +94 s, puis plus rien jusqu'à la Pause à +131 s ; la limite du guidage est atteinte à 12 × 8 s = 96 s (D-446 Q4 : « après le nombre cible, plus de signal »). Comportement conforme à la règle ; l'arrêt dépend du moment où les répétitions prévues sont écoulées, d'où l'impression d'aléatoire. À CLARIFIER (Hermann) : poursuivre les phases au-delà du nombre de répétitions prévu, jusqu'à Suivant ? En attente de décision ; rien n'est changé.
- Retour du 13/11 (cadres en coin) : « A la place de rectangles pour la charge et les répétitions, une forme plus triangulaire à bords ronds, formée par un deuxième rectangle de même taille mais vertical, juxtaposé, les deux étant reliés par une forme arrondie qui épouse la forme circulaire du cercle. Dans l'esprit Apple Watch. » → cadres en coin (carré 92 privé d'un disque concentrique à l'anneau, 6 au-delà des repères) : bras horizontal de 40 en haut qui porte la valeur, bras vertical sur le côté, bord intérieur qui suit le cercle, angles arrondis ; à gauche les répétitions, à droite la charge (symétrique). Sans module SVG natif : cadre rectangulaire. ch13 annoté. Réalisé.
- Retour du 13/11 (guidage au-delà de la cible, compteur, coins) : « Oui il faut continuer le guidage, c'est à l'utilisateur d'arrêter. Mais on peut ajouter un compteur automatique dans ce cas puisqu'on est supposé suivre ce guidage. Il serait posé dans un triangle en bas à droite. » et « Le triangle est ok, mais il faut éloigner la courbure du cercle, que cela fasse plus aéré et plus triangle » → (1) en Répétitions, phases signalées et annoncées au-delà du nombre prévu, jusqu'à Suivant (D-446 « sans signal » remplacé, ch07 annoté) ; (2) compteur automatique (cycles complets du motif) dans un coin en bas à droite du cercle, pour toute Série en Répétitions guidée par des phases ; (3) coins à 18 des repères de l'anneau (au lieu de 6). Réalisé.
- Retour du 13/11 (coins) : « Aligner encore un peu plus du cercle » (compris : « éloigner ») → coins à 26 des repères de l'anneau (au lieu de 18) ; valeur décalée vers l'angle extérieur, où la forme est la plus épaisse. Limite : sur un écran de 375 de large, la forme ne peut plus porter la valeur et le cadre redevient rectangulaire. Réalisé.
- Retour du 13/11 (marge sous le coin du bas) : « Remonter un peu le cercle, je dois trouver un moyen de préserver une marge entre le triangle du bas et le cadre. Il faut rogner un peu partout équitablement. » → 12 entre le coin du bas et le cadre gris (au lieu de 1) ; place prise un peu partout : au-dessus du cercle −8 (le cercle remonte de 8), Série / Tour / Cycle −4 (écart libellé / valeur 2, interligne des valeurs 45), cadre blanc −4 (marges intérieures 11), commandes −2 (18 sous le cadre gris), écart minimal au-dessus du cadre blanc −2 (8). Taille des coins inchangée (bras de la valeur trop fin sinon). Budget (402 × 874) : 275 disponibles, 265 nécessaires. Réalisé.

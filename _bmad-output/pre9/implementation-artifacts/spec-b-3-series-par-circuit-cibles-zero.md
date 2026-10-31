# B.3 — Séries groupées / alternées par Circuit, cibles à 0

Story PRE-9, epic B. Plan : `../planning-artifacts/epics.md` § B.3 (dépend de B.1 ; arbitrage ARB-10, décidé). Branche `pre9-bmad/dev`, départ `f807a491`. Aucune migration, aucun changement Figma, `tokens.ts` inchangé.

## Sources appliquées

| Source | Passage appliqué |
|---|---|
| COMP §2 (`docs/KODJO-Composition-conteneurs-2026-10-28.md`) | « La conversion groupées → alternées conserve N, adapte les séries de chaque exercice à N, étend par la dernière valeur et tronque au-delà. Confirmation si et seulement si des valeurs sont perdues ; Annuler restitue tout l'état antérieur. […] Alternées → groupées conserve les séries et paramètres, sans confirmation. La diminution de N sans conversion conserve la règle existante de réserve dans le brouillon. » |
| COMP §3 | « Une cible de série peut être 0 s ou 0 répétition, à toute position […] L'étape correspondante et sa pause sont sautées. » ; « Une nouvelle ligne porte un tiret […] Le tiret […] bloque l'enregistrement ; le zéro est renseigné et l'autorise sous réserve que l'exercice ait un volume non nul. Un exercice dont toutes les cibles numériques sont nulles est refusé. Les cibles À l'échec restent un état distinct » ; « Les bornes numériques de cible deviennent 0..100 répétitions et 0..3535 s par série. Le nombre de séries demeure 1..99 […] Cette ouverture ne rend pas nulles les durées de phases du mouvement » ; « D-232, D-430 et RM-234 sont remplacées sur le seul minimum de cible de série. » |
| COMP §6 | « Le déplacement d'un exercice vers un circuit alterné respecte le N commun […] confirmation en cas de perte, Annuler conserve emplacement et données d'origine, Confirmer réalise déplacement et adaptation ensemble. […] La disparition du conteneur source vidé appartient à l'application effective du déplacement. » |
| ch10 l.1026-1182 | Développement des circuits ; conversion et règle de déclenchement de la confirmation ; « Nombre imposé et diminution » (N en lecture seule dans la feuille, réserve de brouillon, enregistrement des seules lignes actives) ; « Ajout et sortie du circuit » ; « Suppression et interactions » (« pas de suppression locale permettant de rompre l'invariant N dans un seul exercice »). |
| ch10 l.2616 + ARB-10b | Série nulle : indice conservé, étape et pause sautées ; récupération directement associée à l'occurrence sautée non exécutée. |
| ARB-10 (`arbitrages-pre9.md`) | « Une série peut avoir une cible nulle lorsque les règles le permettent, mais le volume total de l'Exercice doit être non nul. » |
| Arbitrages consolidés du 30/10 (`origin/main`) D-07, D-08, D-09, §2.2, §2.4 | D-07 : « En alternance, conserver le régime de séries et les paramètres propres compatibles ; adapter le nombre actif de séries à N. Confirmation avant perte de valeurs ; sortie : conserver le nombre actif et les paramètres actuels » ; D-08 : en groupées, « sans modifier leurs séries intrinsèques » ; D-09 : confirmation seulement en cas de perte ; §2.4 : « Les combinaisons non compatibles sont refusées sans altération » ; D-17 : « Les constantes des Formats ne sont jamais effacées ou modifiées silencieusement ». |
| spec C.1, « Correction du 30/10 » | Le Format est porté par l'Exercice seul ; le Circuit n'a qu'une organisation et un compte ; aucun Format transmis. |
| ch07 « Recette PRE-9 n° 1 » | « Durée d'une série : ne pas sélectionner 1 s par défaut lorsqu'on ouvre la roulette » (ouverture à 00:00 sans valeur retenue) : conservée. |

## Réalisé

**Domaine — par Circuit** (`src/domain/sessions/layoutOperations.ts`) :
- Déjà livré en B.1b et réutilisé tel quel : N d'un Circuit 1..99 avec réserve de brouillon (`setLayoutCircuitCount`), conversion par Circuit avec pertes calculées avant mutation (`prepareLayoutNatureChange` / `applyLayoutNatureChange`), fonctions `adaptExercise` / `lostSeriesCount` du Circuit unique.
- `settleLayoutCircuitMembership` : équivalent, pour chaque Circuit d'une disposition générale, de `settleCircuitMembership` (ancien modèle). Un Exercice qui entre dans un Circuit alterné (nouveau ou venu d'ailleurs) est adapté au N de CE Circuit ; pertes rendues avant écriture ; en groupées, aucune modification (D-08) ; une sortie retire l'entrée de réserve, nombre actif et paramètres conservés.
- `moveExerciseToCircuit` : opération de domaine du déplacement d'un Exercice (niveau Séance, Cycle ou autre Circuit) vers un rang d'un Circuit : `APPLIED`, `CONFIRMATION_REQUIRED` (brouillon proposé, à écrire seulement après « Confirmer » ; « Annuler » garde l'entrée) ou `REFUSED` (inconnu ; Exercice formaté incompatible ; Séance avec Points d'arrêt). Le Circuit source vidé disparaît. **Aucun geste ne l'appelle encore : le glisser-déposer est B.4.**
- Exercices formatés (`formattedMemberFits`, matrice §2.2 via `circuitCompatibility`) : groupées admises sans modification ; alternées admises seulement si la matrice l'admet, sans réglage à adapter (EMOM : C.4) et avec un nombre de séries déjà égal à N (Tabata à N = 8). Sinon refus sans altération : déplacement refusé ; N ou nature d'un Circuit qui modifierait les séries d'un membre formaté non appliqués.

**Domaine — cibles à 0** (`src/domain/activities/ExecutionParameters.ts`, `executionCalculations.ts`) :
- Bornes de saisie `durationTarget` 0..3535, `repetitionTarget` 0..100 ; Cible `NUMBER` ≥ 0 au niveau structurel et à la lecture ; `WORK_PATTERN_DURATION_BOUNDS` (1..3535) pour les phases, inchangées.
- `ZERO_VOLUME` : toutes les Cibles nulles → refus aux deux niveaux (feuille ✓, `Continuer`, repository) ; une violation par série en variables (cellules signalées), une seule en identiques. Le tiret (`UNSET`) garde sa violation `REQUIRED`.
- Durées : une série nulle ne produit ni travail, ni pause, ni changement de côté ; la Récupération remplace la dernière pause jouée ; en Circuit alterné le passage nul est sauté avec sa Récupération (ARB-10b).
- Projection scalaire historique : une première Cible 0 s'écrit NULL (CHECK de `migration014` : durée 1..5999, répétitions ≥ 1) ; la Cible 0 vit dans `execution_parameters`. **Aucune migration.**
- « — » s'ouvre et s'incrémente toujours sur la plus petite Cible positive (Q25, Q26) ; − depuis 1 donne 0.

**Interface** :
- Feuille : 0 saisi au clavier dans une cellule Cible du tableau est une Cible 0 ; cellule vidée → « — ». Les roues de la Cible commune (séries identiques) gardent un minimum de 1 : une Cible commune 0 serait un volume nul, et la position neutre 00:00 de la recette du 29/10 laisse ✓ indisponible.
- Carte de Composition : un Exercice de volume nul affiche « Paramètres à compléter » (rouge, D-448 point 7) ; `Continuer` indisponible (validation complète existante).
- Éditeur d'Exercice en disposition générale : N en lecture seule (indice existant) et croix de série indisponibles pour un Exercice de N'IMPORTE QUEL Circuit alterné (`inheritsCircuitSeriesCount`, déjà utilisé par la feuille ouverte depuis la carte) ; un Exercice d'un Circuit groupé reste libre.
- Insertion d'ARB-07 en disposition générale (`insertIntoRichLayout` : éditeur, Mouvements choisis, ancienne sélection d'activités) : l'occurrence entrée dans un Circuit alterné est adaptée à son N, avec le dialogue de confirmation existant (`CircuitEntryConfirmModal`) si elle perd des séries. [B.2 : « Le réglage d'une occurrence qui entre dans un Circuit alterné (N du Circuit) relève de B.3 : il n'est pas appliqué ici » — remplacé.]

## Synchronisation code / documentation

- **Classe A** : tout le comportement ci-dessus rejoint des règles écrites (COMP §2, §3, §6 ; ch10 l.1026-1182, l.2616 ; ARB-10, ARB-10b ; D-05, D-07, D-08, D-09, D-17, §2.2, §2.4 ; recette n° 1 pour la roue). Aucune spécification modifiée.
- **Classe C** : voir « À CLARIFIER » (rendus et interprétations, choix provisoires en place).
- **Classe D** : projection scalaire 0 → NULL (sans migration) ; `WORK_PATTERN_DURATION_BOUNDS`, `FIRST_POSITIVE_TARGET` ; code `ZERO_VOLUME` ; `RichLayoutInsertion`.
- **Documents mis à jour** : aucun document normatif (A/C/D).
- **Formulation contradictoire résiduelle trouvée (recherche ciblée « 1..100 », « 1..3535 », « 00:00 interdit »), annotée le 31/10 dans la même livraison (classe A : COMP §3 la remplace déjà ; texte d'origine conservé)** : ch13 « Contrats d'écran » l.1543-1544, tableau des bornes : « Répétitions par Série | 1..100 » et « Durée par Série | 1..3535 s […] ; 00:00 interdit comme cible ». COMP §3 la remplace déjà explicitement (D-232, D-430, RM-234 sur le seul minimum) ; ch10 l.2566 est à jour. Annotation proposée, texte d'origine conservé : « [28/10/2026, COMP §3 : cibles 0..100 répétitions et 0..3535 s par série ; volume total de l'Exercice non nul (ARB-10) ; les phases conservent leur minimum de 1 s.] ».
- Fichiers `epics.md` et ch07 modifiés dans l'arbre de travail par une autre session (précisions A.2b / B.4b du 31/10) : non touchés par B.3.

## À CLARIFIER (classe C)

1. **Nouvelle ligne ajoutée à la main : tiret ou copie ?** ch10 l.1120 et COMP §3 : « Depuis le 28/10, une nouvelle ligne ajoutée manuellement porte un tiret et exige une saisie » ; ch10 l.1162 (« Régime et validation : règles existantes conservées ») : « Ajouter une série restaure d'abord une ligne récupérable, sinon copie la dernière ligne active » et l.1116 : « Une nouvelle série copie les paramètres de la dernière ligne active ». Aucun remplacement explicite de l'une par l'autre. **Comportement en place inchangé (copie).** Décision attendue : la ligne ajoutée par + dans la feuille porte-t-elle « — » (à renseigner) ?
2. **[0, À l'échec]** : admis (le volume d'une série à l'échec n'est pas nul : « ne pas assimiler l'absence de durée calculable à un volume nul »). Lecture littérale possible : « toutes les cibles numériques sont nulles » → refus. Décision attendue.
3. **Signalement d'un Exercice de volume nul** : carte « Paramètres à compléter » (rouge) et ✓ / `Continuer` indisponibles, cellules signalées ; aucun message propre (décision D-2 de la recette PRE-4 : pas de « Renseignez … »). Rendu à confirmer.
4. **Cible commune 0** : non proposée par les roues de la Cible commune (identiques) — elle annulerait toutes les séries ; 0 se saisit dans une cellule du tableau des séries variables.
5. **Circuit contenant un Exercice formaté** : un changement de N ou de nature qui modifierait ses séries n'est pas appliqué, sans message (aucun Exercice formaté n'est créable par l'interface avant C.2–C.4). Message et adaptation des réglages (EMOM, For time) : C.3 / C.4.
6. **Déplacement vers un Circuit alterné** : opération de domaine livrée et testée ; geste en B.4. Le suivi des Points d'arrêt lors d'un déplacement relève de B.4 / B.6 (refus sans altération d'ici là).

## Tests

- `src/domain/sessions/__tests__/layoutOperations.b3.test.ts` (16) : N et réserve par Circuit, conversions avec et sans perte, entrée dans un Circuit alterné, déplacements (sans perte, avec perte, entre deux Circuits alternés avec disparition du source, vers groupées, réordonnancement), refus, Exercices formatés.
- `src/domain/activities/__tests__/zeroTargets.b3.test.ts` (10) : bornes, ouverture « — », zéro à toute position, `ZERO_VOLUME`, [0, à l'échec], tiret, persistance JSON et projection, durées (seul, bilatéral, Circuit alterné).
- `src/infrastructure/database/__tests__/seriesPerCircuit.b3.test.ts` (3, SQLite réelle) : aller-retour nature et N par Circuit, séries actives seules (réserve non enregistrée), conversion enregistrée, première Cible 0 (colonne NULL), volume nul refusé sans écriture.
- `src/features/sessions/__tests__/CompositionScreen.b3.test.tsx` (6) : deux Circuits de natures différentes, stepper et réserve, conversions avec / sans perte, Annuler, alternées → groupées, cible 0 et volume nul.
- `src/features/sessions/__tests__/ExerciseScreen.test.tsx` (+3) : N en lecture seule dans un Circuit alterné parmi d'autres, insertion avec perte (dialogue, Annuler, Confirmer) et sans perte.
- Tests existants mis à jour (bornes 0, annotations datées) : `ExecutionParameters.test.ts`, `ExecutionParametersDraft.test.ts`, `validation.test.ts`, `cellEntry.test.ts`, `useSheetKeyboard.test.ts`, `ExecutionParametersSheet.test.tsx`.
- Exécutions ciblées (`--maxWorkers=1`) : voir le compte rendu de livraison. Suite complète non exécutée ici. Aucune vérification sur iPhone.

## Recette iPhone (Expo Go / build de développement)

1. Créer une Séance avec deux Circuits (poser un Circuit sur deux Exercices différents) ; mettre le Circuit A en « alternées », laisser B en « groupées ». Les en-têtes affichent chacun leur nombre et leur adjectif.
2. Circuit A alterné, 3 tours : ouvrir un Exercice de A → feuille : le nombre de séries est grisé avec son indice, les croix de suppression de séries sont indisponibles ; ouvrir un Exercice de B → nombre modifiable.
3. Stepper du Circuit A : passer de 3 à 2 → les cartes de A affichent 2 séries ; revenir à 3 → les valeurs de la 3e série d'un Exercice en séries variables reviennent ; B ne bouge pas.
4. Dans B, mettre un Exercice à 5 séries, puis passer B en « alternées » (2 tours) → dialogue de perte ; Annuler → rien ne change ; recommencer et Confirmer → 2 séries ; repasser en « groupées » → toujours 2 séries.
5. Passer A d'« alternées » à « groupées » → aucun dialogue, séries conservées.
6. Le dernier Exercice entré étant dans le Circuit A alterné : « Créer un nouveau mouvement » / « Utiliser un mouvement existant » → le nouvel Exercice arrive dans A avec le nombre de séries de A ; via l'éditeur, régler 5 séries avant « Terminer » dans un Circuit à 3 tours → dialogue ; Annuler reste sur l'écran ; Confirmer ajoute l'Exercice à 3 séries.
7. Feuille d'un Exercice en séries variables : taper 0 dans une cellule Cible → « 0 s » (ou « 0 rép. »), ✓ disponible si une autre série est positive ; vider la cellule → « — », ✓ indisponible.
8. Mettre toutes les cellules Cible à 0 → cellules signalées, ✓ indisponible ; si la Séance contient un tel Exercice (par conversion), sa carte affiche « Paramètres à compléter » en rouge et « Continuer » est indisponible.
9. Séries identiques : ouvrir la roue de Durée d'une Cible « — » → 00:00 sans valeur retenue, ✓ indisponible tant que la roue n'a pas tourné (recette du 29/10, inchangé).
10. Enregistrer la Séance après avoir réduit N (étape 3 sans réaugmenter), la rouvrir : 2 séries, N du Circuit A et nature de chaque Circuit conservés ; augmenter N recopie la dernière série enregistrée.
11. Durée affichée : un Exercice 30 s · 0 · 40 s avec 10 s de pause compte 30 + 10 + 40 + 10 = 90 s (série nulle et sa pause sautées).

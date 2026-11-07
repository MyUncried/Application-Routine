# Mise à jour des spécifications — Formats d'entraînement et portage du format par le circuit

**D-499 — précision validée par Hermann le 06/11/2026 :** « Valider les paramètres » apparaît uniquement lorsqu’une seconde étape est nécessaire et ouvre le récapitulatif sans enregistrer dans la séance. Dans ce cas, la coche du questionnaire reste grise et inactive. Sans seconde étape, la coche enregistre dans la séance lorsque les données sont complètes et cohérentes. Dans le récapitulatif, elle devient bleue et active lorsque les données sont complètes et cohérentes, puis enregistre dans la séance. Death by à un mouvement : questionnaire → coche → Composition, sans récapitulatif ; à deux mouvements : questionnaire → « Valider les paramètres » → récapitulatif → coche → Composition. L’enregistrement reste un ajout au brouillon de Composition, sans sauvegarde définitive de la Séance. Cette précision supersède la suppression générale du bouton dans les questionnaires ; les autres validations par coche restent applicables.

> **Révision du 05/11/2026 :** validation des modales de Format par la coche de l’en-tête (D-499) et « + Ajouter » en mode catalogue direct (D-500) — [KODJO-Catalogues-cartes-modales-2026-11-06](KODJO-Catalogues-cartes-modales-2026-11-06.md) §1–§2.

**Référence active — mise à jour du 5 novembre 2026.** [Complément final validé du 5 novembre](sources/formats-2026-11-05/KODJO-Complement-Parcours-creation-2026-11-05.md) ; [base du 4 novembre](sources/formats-2026-11-04/KODJO-Mise-a-jour-ecrans-formats-consolidee-2026-11-04_finale.md). Les règles ci-dessous constituent la cible ; elles ne prouvent pas leur réalisation. Les archives OpenSpec restent inchangées.

Figma : fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP » (`510:101`). Les noms exacts des frames sont des références ; les paramètres, parcours et règles ci-dessous constituent la cible fonctionnelle. Galerie et statut des exports : chapitre 06, ancre formats-galerie. La configuration appartient à PRE-9 ; le moteur spécialisé reste PRE-10/11.

**Sujet différé B10 :** la représentation et le lancement d’un Format sans Mouvement sélectionné, notamment par un accès direct au minuteur, sont mis de côté. Aucune création d’un Exercice « Mouvement libre », dispense de champs obligatoires ou nouveau parcours de lancement n’est validé ici. Les références graphiques à un état sans mouvement ne suffisent pas à autoriser ce comportement.

## 1. Règle de portage du format

Le Format est porté par l’Exercice autonome ou par le Circuit qui porte le temps commun ou coordonne la progression et la fin du défi :

- **un exercice autonome** : l’Exercice porte le Format (AMRAP, EMOM, For time, Death by). Un AMRAP à un seul mouvement crée toutefois un Circuit si le nombre de blocs dépasse 1, si le repos après chaque tour est supérieur à 0, ou si un buy-in est présent ;
- **plusieurs exercices qui partagent un même temps**, ou un Death by coordonné en alternance : le Circuit porte le Format via **Format d’origine**. En Death by alterné, le portage de l’identité et de la fin collective au Circuit ne transfère pas l’intervalle des membres au Circuit.

Cas où le circuit porte le format :

| Format | Cas | Nature du circuit (fixée) | Temps porté par le circuit |
|---|---|---|---|
| AMRAP | Plusieurs exercices, plusieurs blocs, buy-in, ou un seul mouvement avec repos après chaque tour > 0 | Groupées | Durée de chaque bloc (saisie) |
| For time | Plusieurs exercices, ou buy-in / buy-out | Alternées | Temps limite optionnel (section 11) |
| EMOM | Dans chaque intervalle | Groupées | Durée de chaque tour = intervalle |
| Death by | Dans chaque intervalle | Groupées | Intervalle commun ; tours « jusqu’à l’échec » |
| Death by | En alternance | Alternées | Pas de durée dans l’en-tête ; intervalles propres aux Exercices ; tours « jusqu’à l’échec » et arrêt collectif au premier échec |

Tabata en alternance et EMOM en alternance créent des Circuits standards. Tabata, EMOM et Death by À la suite créent un Circuit standard groupé à un tour dès deux Exercices. Le Death by en alternance est un Circuit porteur du Format, au même titre que le Death by dans chaque intervalle (A2).

Le Format est porté selon le partage temporel décrit ci-dessus. L’état du code est vérifié séparément ; aucune conformité applicative n’est déduite de cette spécification. Paramètres du Circuit :

- le paramètre **Format d'origine** : AMRAP | For time | EMOM | Death by, vide pour un circuit standard. Il est hérité du questionnaire à l'enregistrement du format, n’est pas modifiable. Il fixe la nature applicable au Circuit selon le tableau, sans faire apparaître un nouveau type de conteneur. Il ne fait pas du circuit un nouveau type : il indique à l'application le libellé de l'en-tête (« AMRAP », « For time »…), la nature fixée, l’affichage de la ligne Rôle et les paramètres compatibles à reprendre pour un Exercice qui entre ;
- la **Durée de chaque bloc** AMRAP et l’intervalle commun EMOM/Death by **dans chaque intervalle**, saisis et modifiables sur le Circuit porteur. Dans ces organisations groupées, un tour correspond à l’intervalle commun. En Death by **alterné**, chaque Exercice conserve son Intervalle, modifiable dans sa modale ; le Circuit n’affiche pas de durée. Un passage complet par les membres dure la somme de leurs intervalles, sans affichage trompeur d’un intervalle unique comme durée de tour ;
- la **nature du circuit**, fixée et non modifiable sur un circuit porteur d'un format (voir le tableau).

**Périmètre des modèles.** Quatre Formats spécialisés : AMRAP, EMOM, For time et Death by. Tabata et les cinq départs rapides (§9.2) sont des préconfigurations standards modifiables. Leur présence dans la même grille utilisateur ne crée pas six identités de Format dans le domaine. D-378 et FMT-01 sont remplacées sur cette classification.

**Identité et réglages.** Seul le paramètre Format d’origine est hérité du questionnaire et non modifiable. Les valeurs effectivement portées par le Circuit — durée de bloc/tour, compte fini applicable, intervalle commun en organisation groupée et temps limite — restent modifiables selon le Format. L’Intervalle du Death by alterné appartient à chaque Exercice et ne fait pas partie de ces valeurs de Circuit. Modifier une de ces valeurs ne retire pas le Format. La nature groupées/alternées reste fixée par le Format. Le régime « jusqu’à l’échec » du Death by ne devient pas un nombre fini de tours.

### 1.1 Regroupement des Exercices créés par un modèle

**Règle.** Dès que l'enregistrement d'un Format crée **au moins deux Exercices**, ces Exercices sont placés dans un **Circuit**. Il n'y a plus d'Exercices successifs posés à plat dans la Séance.

| Cas | Structure créée |
|---|---|
| Circuits porteurs d'un Format (AMRAP, For time, EMOM et Death by dans chaque intervalle, Death by en alternance) | Circuit porteur |
| Circuits standards déjà créés (Tabata et EMOM en alternance, Superset) | Circuit standard |
| **À la suite** (Tabata, EMOM, Death by) et départs rapides à plusieurs mouvements (30/30, Renforcement, Progression, À l'échec) | **Circuit standard, nature « groupées », 1 tour** |

**Correspondance « À la suite ».** La nature « groupées » avec 1 tour reproduit exactement l'exécution À la suite : chaque Exercice fait toutes ses séries, puis le suivant démarre. Les paramètres des Exercices sont inchangés :
- la récupération entre les mouvements reste la Récupération de chaque Exercice, 0 s sur le dernier ;
- les durées sont identiques (Tabata À la suite : 8 min 50 s) ;
- les Exercices EMOM et Death by gardent leur propre Format, comme tout Exercice formaté simple dans un Circuit standard groupé : un Death by qui échoue termine ce membre, puis le Circuit passe au suivant ; les résultats restent distincts.

**Pourquoi.** Ce que l'utilisateur a composé en une fois est une unité : on le replie, on le déplace et on le supprime d'un seul geste, et l'en-tête dit comment il s'enchaîne. Le Circuit standard existe déjà et ne demande aucun nouveau paramètre.

**Dans la Séance.** Le Circuit s'affiche comme tout Circuit standard, avec pour titre le nom de son modèle (« Tabata », « Progression », §7.8) et en deuxième ligne « 1 tour · groupées ». Il reste librement modifiable (nombre de tours, nature, ajout ou sortie d'un Exercice) selon les règles des Circuits standards.

**Cas laissé de côté.** Le Format à un seul Exercice n'est pas traité ici : il garde son comportement actuel.

## 2. Correspondance des paramètres AMRAP

| Paramètre | Porté par | Champ / valeur |
|---|---|---|
| Durée | Exercice autonome : Durée de l’exercice — Circuit : Durée de chaque bloc | 12 min par défaut |
| Nombre de blocs AMRAP | Circuit | Nombre de blocs ; au-delà de 1, un Circuit est créé, même avec un seul mouvement |
| Repos entre deux blocs AMRAP | Circuit | Repos entre les blocs |
| Objectif par tour | Exercice | Nombre de répétitions (lu « par tour ») |
| Max | Exercice | Condition d'arrêt = À l'échec ; l’objectif et l’incrément sont grisés et inactifs, sans masquer ; Charge reste modifiable |
| Incrément | Exercice | Nouveau champ **Incrément par tour**, ≥ 0, mode Répétitions uniquement |
| Repos après chaque tour de boucle | Dernier Exercice de la boucle à l’enregistrement | Initialise sa Récupération ; les autres Exercices de boucle sont initialisés à 0 s ; buy-in fixé à 0 s |
| Buy-in | Exercice | **Rôle dans le circuit** : Buy-in, sinon Tour par défaut ; plusieurs buy-in possibles |
| Organisation | — | Sans objet : les exercices s'enchaînent dans l'ordre |

### 2.1 Blocs AMRAP et tours de boucle

Deux niveaux sont distincts :
- **bloc AMRAP** : effort complet borné par sa durée configurée ; Nombre de blocs AMRAP / nombre de blocs du Circuit compte ces blocs ;
- **tour de boucle** : passage par les mouvements de la boucle à l’intérieur d’un bloc ; Incrément par tour et Repos après chaque tour concernent ce niveau.

Chaque bloc dispose de sa durée complète et redémarre ses objectifs et incréments aux valeurs initiales. Exemple : 3 blocs de 12 minutes, séparés par 2 minutes de repos ; le résultat est conservé séparément pour chacun des trois blocs. Le Circuit emploie **bloc(s)** : « AMRAP · 3 blocs · groupées ». Le questionnaire affiche **Durée**, **Nombre d’AMRAP** et **Repos entre deux AMRAP** ; ces deux dernières lignes comptent les blocs et leur repos, sans désigner les tours de boucle. « Tour » reste réservé à la boucle et à son résultat. Les noms fonctionnels Nombre de blocs et Repos entre les blocs désignent ces mêmes réglages, sans créer de données supplémentaires.

Le buy-in est effectué une seule fois dans tout le Circuit. Il consomme le temps du premier bloc uniquement ; les blocs suivants commencent directement par la boucle.

### 2.2 Repos après un tour de boucle

Un AMRAP à un seul mouvement avec un Repos après chaque tour supérieur à 0 crée un Circuit d’un seul membre, même pour un seul bloc (A3). Exemple : 10 burpees puis 30 s de repos, répétés dans les 12 minutes ; le repos est appliqué à chaque tour de boucle. Un exercice autonome AMRAP n’est donc créé que sans ce repos, sans buy-in et pour un seul bloc.

Le questionnaire initialise la récupération du dernier Exercice de la boucle à la valeur du Repos après chaque tour. Les autres membres sont initialisés à 0 s et le buy-in reste à 0 s. Exemple : A → B → récupération → A → B.

Cette récupération est comprise dans la durée AMRAP : le chronomètre continue. À l’échéance, le bloc se termine, y compris pendant cette récupération ; le repos entre deux blocs AMRAP s’applique ensuite s’il reste un bloc. Les deux repos ne sont pas confondus.

Après enregistrement, la récupération appartient à cet Exercice et se règle dans sa modale. Elle le suit s’il est réordonné ; elle n’est pas transférée automatiquement au nouveau dernier membre. La préconfiguration « après chaque tour » décrit donc l’organisation produite à l’enregistrement, pas un nouvel objet de repos indépendant de l’Exercice.

## 3. Rôle dans le circuit, modes et incréments

**Rôle dans le circuit.** Dans un Circuit AMRAP ou For time, chaque Exercice porte un **Rôle dans le circuit** (libellé à l'écran : « Rôle »), qui remplace le champ « Passage » (Une fois / À chaque tour). Ce concept est distinct du Format porté par l'Exercice : le Rôle dit sa place dans l'organisation, pas ce qu'il fait.
- **AMRAP** : **Buy-in | Tour**. Pas de buy-out : l'échéance termine le bloc (puis sa clôture, et le bloc suivant ou la suite de la Séance) ; un travail après l'AMRAP n'est pas compté dans son temps et se compose comme l'élément suivant de la Séance ;
- **For time** : **Buy-in | Tour | Buy-out**.

La ligne n'existe que dans ces deux Circuits, et y est toujours présente ; « Tour » par défaut. Le rôle est une donnée explicite : la position en découle, et non l'inverse.

**Le rôle fixe la zone.** Le Circuit est découpé en trois zones dans cet ordre : buy-in, tour (la boucle), buy-out.
- Passer un Exercice en Buy-in le place à la fin de la zone buy-in ; en Buy-out, à la fin de la zone buy-out ; revenir à Tour le place en tête de la boucle. Un Exercice ajouté après coup peut ainsi prendre l'une ou l'autre position.
- Le glisser-déposer réordonne à l'intérieur d'une zone ; changer de zone passe par le Rôle, pour qu'un geste imprécis ne transforme pas un Exercice en buy-in.
- **Plusieurs buy-in sont autorisés** (par exemple 1000 m de rameur puis 50 burpees avant l'AMRAP), ainsi que plusieurs buy-out en For time. Ils s'enchaînent dans l'ordre, une seule fois. En AMRAP, les buy-in consomment le temps du premier bloc uniquement.
- **Au moins un Exercice reste en Tour** : pour le dernier Exercice de la boucle, les options Buy-in et Buy-out sont désactivées ; il ne peut pas non plus être supprimé ni sorti du Circuit tant qu'un buy-in ou un buy-out reste présent (message court invitant à passer d'abord un autre Exercice en Tour).
- **Changer de rôle** ne perd rien : passer en Buy-in ou Buy-out conserve l'Incrément et la Récupération de l'Exercice sans les appliquer (ligne grisée, Récupération à 0 s) ; revenir à Tour les rétablit. En For time, un Exercice à l'échec passé en Buy-in ou Buy-out passe À l'objectif, son objectif « à renseigner ».

**Ce qu'impose un buy-in ou un buy-out.** Pas d'incrément (ligne grisée), une seule exécution, Récupération 0 s verrouillée. Condition d'arrêt :
- **AMRAP** : À l'objectif ou **À l'échec** (par exemple un max de pompes avant l'AMRAP). Le temps passé est pris sur le premier bloc. « Terminé » lance immédiatement la boucle : aucune saisie ne s'intercale pendant que le temps du bloc court. Les répétitions réalisées sur le buy-in se saisissent **à la clôture du bloc**, avec le résultat de l'AMRAP (tours complets et partiel) ;
- **For time** : À l'objectif uniquement. Le résultat est le temps mis pour finir : un buy-in ou buy-out à l'échec le rendrait dépendant de l'effort fourni sur le max, et non comparable d'une séance à l'autre. « For time puis max en 1 min » se compose avec deux éléments successifs.

**Mode.** Un buy-in ou un buy-out peut être en **Répétitions ou en Durée** (par exemple 2 min de rameur) ; la cible est le Nombre de répétitions ou l'Objectif de durée selon le Mode. En For time, une durée fixe s'ajoute au chrono sans fausser le résultat. Revenir à Tour rend l'Incrément et la Récupération modifiables.

La modale d'un buy-in n'a ni ligne Séries ni ligne Pause : aucune modale AMRAP n'a de Séries, le tour en tient lieu, et le temps qui suit le buy-in est sa Récupération.

**Incrément par tour (AMRAP).** Ligne toujours présente, +0 par défaut, signe positif/négatif ; calcul borné à 1 dans l’unité, sans fin automatique de boucle. Inactif pour Buy-in et À l’échec.
- Rôle Buy-in : pas de tour suivant ;
- Condition d'arrêt À l'échec : pas d'objectif chiffré à augmenter.

Le For time n'a pas d'Incrément par tour.

**Modale For time d'un Exercice seul.** Les séries peuvent être **variables** (21 / 15 / 9, cas le plus courant) ou **identiques** (par exemple 5 × 20 burpees) : le For time fixe un travail fait le plus vite possible, sans imposer sa forme. L'écran « For time — Modale exercice, standard » montre l'état initial cohérent avec le questionnaire : « 3 séries variables » sélectionné, 21 / 15 / 9 répétitions, pauses à 0 s.

**Boucle du For time.** Un Exercice de rôle Tour peut être en Répétitions ou en Durée (par exemple « 3 tours : 20 burpees, puis 30 s de gainage » : le chrono mesure toujours la performance). **Au moins un Exercice de l’ensemble du Circuit reste en Répétitions**, buy-in et buy-out compris : le travail du Circuit ne doit pas être entièrement défini par des durées fixes. Pour le dernier Exercice en Répétitions du Circuit, l’option Durée est désactivée, avec un message court. Ce contrôle s’applique aussi à la suppression, au déplacement hors du Circuit et aux autres modifications de mode. Une boucle entièrement en Durée est possible si un buy-in ou un buy-out reste en Répétitions.

**Données et développement.** Le champ « Passage » (Une fois / À chaque tour) devient « Rôle dans le circuit » (Buy-in / Tour / Buy-out). La règle qui réservait « Une fois » au premier ou au dernier Exercice, la limite à un seul buy-in et l'interdiction de dupliquer isolément un buy-in sont retirées : dupliquer un buy-in crée un second buy-in, exécuté une seule fois, placé juste après l'original dans la zone buy-in ; il en va de même pour un buy-out, dont la copie est placée juste après l'original dans la zone buy-out. Les règles de réordonnancement des buy-in et buy-out (§6, points 4 et suivants) sont remplacées par le découpage en zones ci-dessus.

**Point ouvert, à décider séparément : la distance.** KODJO ne connaît que les Modes Répétitions et Durée. Un Mode Distance (en mètres) toucherait la saisie, l'exécution, les résultats et les records de tous les formats ; il n'est pas introduit par cette règle.

**Écrans :** ligne « Rôle » sur « AMRAP — Modale exercice, buy-in », « … dans un circuit », « … dans un circuit, durée à l'échec », « For time — Modale exercice, dans un circuit » et « … buy-in ou buy-out » ; Durée activable sur les modales de buy-in et buy-out et sur « For time — Modale exercice, dans un circuit », et À l'échec sur « AMRAP — Modale exercice, buy-in » ; ligne Incrément grisée sur « AMRAP — Modale exercice, buy-in », « … simple, à l'échec (Max) » et « … dans un circuit, durée à l'échec ».

**AMRAP simple :** Mode Répétitions ; en Circuit, Répétitions ou Durée. Le guidage de cadence AMRAP/For time reste facultatif et sans incidence sur les durées, cibles, transitions et comptages réels.

## 4. Résultat

- Chaque bloc AMRAP possède son propre résultat : **tours de boucle complets + partiel du tour entamé**. Le rang de boucle et l’incrément redémarrent à chaque bloc.
- Le total des répétitions est calculé à partir de la séquence (volumes, incréments, buy-in) lorsque tous les exercices sont en répétitions.
- Les répétitions d'un exercice à l'échec sont saisies par l'utilisateur.

## 5. Affichage dans la séance

- En-tête du Circuit AMRAP : « AMRAP · N bloc(s) · groupées », avec la Durée de chaque bloc en bleu, modifiable ; le titre peut être renommé sans modifier cette organisation. « 1 bloc » et « 3 blocs » désignent des efforts chronométrés ; « 7 tours » désigne le résultat de la boucle (§2.1).
- Exercice de Rôle Buy-in ou Buy-out : la carte affiche ce Rôle à la place de la récupération, aligné à droite. Le libellé dépend de la donnée Rôle, jamais de la seule position.

## 6. Ajout et retrait d'exercices dans un circuit porteur d'un format

Tout Exercice ajouté ou déplacé dans un Circuit porteur d’un Format suit les règles du Circuit d’arrivée. Il reprend ses paramètres compatibles ; les valeurs incompatibles ou ambiguës restent à renseigner. Aucun calcul de conversion arbitraire et aucune confirmation de perte ne sont ajoutés.

1. **Entrée d’un Exercice libre ou déjà formaté** :
   - conserver les valeurs directement compatibles avec la prescription d’arrivée ;
   - des séries à cible commune permettent de reprendre cette cible ; des séries à cibles différentes ou un mélange chiffré/échec ne donnent lieu ni à une somme, ni à une moyenne, ni au choix automatique d’une série : les champs concernés restent à renseigner ;
   - conserver la charge commune, les phases et les côtés compatibles ; si les charges ou d’autres paramètres varient de façon incompatible, les valeurs concernées restent à compléter ;
   - dans l’AMRAP en Circuit, conserver le mode Durée s’il est applicable et son Objectif de durée par passage ; la Durée globale propre de l’Exercice n’est plus portée localement ;
   - appliquer les valeurs imposées du Format d’arrivée ; initialiser le Rôle à Tour et l’incrément à 0 si aucun incrément compatible n’est repris ;
   - compléter dans la modale existante, avec les contrôles habituels de validation. Pas de questionnaire de conversion supplémentaire et pas de confirmation de perte.
2. **Exercice sorti du Circuit** : choix de la section 13 entre « Conserver le format d’entraînement » et « Adopter un format d’entraînement libre ». Ce choix de destination reste présent ; aucune confirmation de perte supplémentaire.
3. **Exercice déjà formaté, de même Format ou d’un autre** : entrée autorisée selon le point 1. Les règles d’arrivée remplacent le contexte précédent sans imbriquer deux Formats.
4. **Buy-in et buy-out** : zones, réordonnancement interne, duplication, modes et conditions d’arrêt selon §3. La copie s’insère après l’original dans sa zone et s’exécute une fois. Sortir un buy-in/out le rend libre sans choix de conservation de Format ; son Rôle disparaît, paramètres compatibles conservés et autres à compléter. Les garde-fous du dernier membre Tour et du dernier membre en Répétitions For time s’appliquent aussi aux suppressions et sorties.

5. **Paramètres applicables dans les Circuits porteurs d’un Format** :

| Circuit | Paramètres de l’Exercice | Paramètres portés par le Circuit / retirés de la saisie locale |
|---|---|---|
| AMRAP | Mode Répétitions ou Durée ; cible par passage ou À l’échec ; Incrément par tour signé en Répétitions ou Durée ; Rôle ; Récupération ; autres paramètres standards compatibles | Séries et durée globale ; l’Objectif de durée d’un passage reste local en mode Durée |
| For time | Mode Répétitions ou Durée sous la garde du §3, Condition d’arrêt À l’objectif ; Séries identiques ou variables, nombre = nombre de tours ; Cadence facultative sans incidence sur les durées ; Rôle ; Récupération initiale 0 s ; Durée de l’exercice héritée, grisée | Borne temporelle et compte du Circuit ; la borne reste rappelée en lecture seule, exception explicite au retrait (§11) |
| EMOM dans chaque intervalle | Mode Répétitions par défaut ou Durée, Condition d’arrêt, cible chiffrée propre au mode, Charge par série si activée, régime Variables ou identiques ; ~~Récupération initiale 0 s~~ (remplacé le 07/11/2026, D-517 : champ absent) | Nombre de séries hérité des tours, Intervalle, Durée de l’exercice, Récupération |
| Death by dans chaque intervalle | Mode Répétitions ou Durée, Condition d’arrêt À l’échec, objectif de départ, Incrément par intervalle ≥ 1, Cadence Sans, Récupération initiale 0 s | Compte ouvert et intervalle commun du Circuit ; durée globale non portée localement |
| Death by en alternance | Mode Répétitions ou Durée, Condition d’arrêt À l’échec, objectif de départ, Incrément par intervalle ≥ 1, **Intervalle propre modifiable dans la modale**, Cadence Sans, Récupération initiale 0 s | Identité Death by et compte ouvert au Circuit ; aucune durée dans son en-tête |

**Entrée EMOM dans chaque intervalle (D-518).** Seul le régime de séries reste local. Le nombre de séries vient des tours. Intervalle, durée globale et récupération disparaissent de la saisie locale. Une cible numérique commune est reprise à chaque rang. Des cibles différentes ou une cible à l’échec laissent la cible à renseigner, sans somme, moyenne, sélection automatique ni confirmation de perte.

6. **Déplacement direct entre deux Circuits porteurs de Formats** : seule la règle d’entrée du Circuit d’arrivée s’applique. Les paramètres compatibles sont conservés et les autres à compléter, sans confirmation de perte, sans étape intermédiaire d’Exercice seul et sans choix de sortie du §13. Un Circuit ne se déplace pas à l’intérieur d’un autre Circuit.
7. **Dernier Exercice du Circuit** :
   - un Circuit porteur d’un Format réduit à un Exercice reste un Circuit ; pas de transformation automatique en Exercice formaté simple ;
   - lorsque le dernier Exercice sort, le Circuit vide est supprimé ; le §13 s’applique à cet Exercice, sauf buy-in/buy-out qui deviennent libres ;
   - si le dernier Exercice est supprimé, le Circuit vide disparaît.

### 6.1 Exercice formaté simple dans un Circuit standard (A5)

Cette opération est distincte de l’entrée dans un Circuit porteur d’un Format. D-15/D-16 restent applicables dans leur portée compatible avec A2 et A5 :

| Exercice autonome entrant | Circuit standard groupé | Circuit standard alterné |
|---|---|---|
| AMRAP | Admis ; chaque passage reprend le bloc complet depuis ses réglages initiaux | Refusé |
| For time | Admis ; chaque passage rejoue toute l’échelle depuis le début | Refusé ; le For time à plusieurs mouvements suit le Circuit porteur du §11 |
| EMOM | Admis ; bloc complet à chaque passage | Admis selon le cas du §10 ; N prend le nombre de tours et la récupération est retirée (D-518) |
| Death by | Admis ; chaque nouvelle exécution repart du départ initial ; son échec termine uniquement l’exécution de ce membre, puis le Circuit poursuit | Refusé ; le Death by coordonné en alternance est créé par le questionnaire avec Format porté par le Circuit (§12) |
| Tabata et 30/30 préconfigurés | Règles des Exercices standards | Règles des Exercices standards ; aucune restriction Tabata N = 8 ni interdiction propre au 30/30 |

A5 conserve explicitement la matrice : il ne supprime donc pas l’admission groupée de l’AMRAP et du For time. La phrase justificative de la contre-revue qui suggère de les exclure ne remplace pas cette décision. Il n’y a pas de temps partagé entre ces blocs autonomes : le Circuit groupé les rejoue successivement.

**Dépose Death by — décision complémentaire d’Hermann :** un Death by autonome ne peut pas entrer dans un Circuit standard alterné. Aucun transfert de Format ni conversion du conteneur n’est réalisé. En Circuit standard groupé, chaque passage rejoue le Death by depuis ses réglages initiaux ; l’échec termine uniquement l’exécution de ce membre, puis l’organisation du Circuit se poursuit. Ce cas reste distinct du Death by alterné coordonné créé par le questionnaire, dont le Circuit porte le Format et s’arrête collectivement au premier échec. Cette décision clôt l’articulation A2/A5.

Une boucle AMRAP ou For time doit conserver au moins un membre de Rôle Tour. Le dernier membre Tour ne peut pas devenir buy-in/out, être supprimé ou sortir tant qu’un buy-in/out subsiste ; message invitant à passer d’abord un autre membre en Tour. For time : au moins un membre en Répétitions dans l’ensemble du Circuit (§3).

## 7. Parcours de composition

Une seule **modale de création** est ouverte depuis deux endroits :
- le bouton **Créer** du **Catalogue des séances** ;
- l'option **Créer un exercice** du menu Créer de la **Composition**.

Elle propose :
- **Exercice libre** : la fiche de création d'un exercice vierge, mouvement puis paramètres d'exécution (parcours existant « Ajouter un exercice ») ;
- **les Formats**, dans la grille à deux colonnes existante : chaque Format ouvre son questionnaire, puis son récapitulatif.

| Départ | Choix | Suite | Arrivée |
|---|---|---|---|
| Catalogue des séances, Créer | Exercice libre | Fiche de création : mouvement, puis paramètres | Composition d'une **nouvelle** Séance, contenant cet Exercice |
| Catalogue des séances, Créer | Un Format | Questionnaire, récapitulatif, « Enregistrer dans la séance » | Composition d'une **nouvelle** Séance, contenant la structure du Format [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.] |
| Composition, Créer un exercice | Exercice libre | Fiche de création | Retour à la Composition, Exercice ajouté |
| Composition, Créer un exercice | Un Format | Questionnaire, récapitulatif | Retour à la Composition, structure ajoutée |

- **Nouvelle Séance depuis le catalogue** : un nouveau **brouillon** de Séance est ouvert à l’arrivée dans la Composition, avec son contenu déjà en place. La sauvegarde définitive n’intervient qu’à la validation de la Composition ; son nom se saisit dans la Composition (le parcours Format n'affiche plus le nom de la Séance). Quitter la Composition sans enregistrer déclenche la confirmation d'abandon existante.
- **Fermer** la modale de création, le questionnaire (croix) ou la fiche de création sans valider : retour au point de départ, aucune Séance enregistrée créée ni modifiée. Le point de départ du parcours est conservé pour revenir au Catalogue ou à la Composition concernée, sans altérer son état antérieur.
- La modale de création remplace, depuis le catalogue, l'ouverture directe d'une Composition vide.

Le menu passe de cinq à **trois** options, dans cet ordre :
1. **Créer un exercice** : ouvre la modale de création (§1) ;
2. **Créer un circuit** : comportement actuel de « Ajouter un circuit » (choix de l'emplacement) ;
3. **Créer un cycle** : comportement actuel de « Ajouter un cycle ».

« Utiliser des mouvements existants » et « Utiliser un format d'entraînement » sont retirés du menu : la sélection d'un mouvement existant se fait dans la fiche de création (suggestions pendant la saisie du nom, ou mode catalogue), et les Formats sont dans la modale de création. Les autres règles du menu sont conservées : bouton + transformé en Annuler, voile, axe vertical (qui s'arrête à Créer un cycle), fermeture.

Questionnaires et récapitulatifs conservent les gabarits modaux, Retour au questionnaire et le contenu du parcours. Depuis le Catalogue, leur fond visuel ne vaut pas création ni sauvegarde d’une Séance vide. Le récapitulatif ajoute au nouveau brouillon ou au brouillon existant selon le point de départ ; la réédition d’un Circuit garde son parcours et son bouton distinct « Enregistrer les modifications » (§7.9). [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]

### 7.1 Questionnaire (« AMRAP — Questionnaire »)

Le questionnaire ne porte que les paramètres indépendants des mouvements.

- **Zone de contexte** : couleur et motif AMRAP, tagline sur deux lignes (« Douze minutes, autant de tours que vous pouvez. Aucun repos prescrit, on compte les tours. »).
- **Mouvements** : titre de section avec « + Ajouter », qui ouvre la saisie locale.
- **Ajout d’un mouvement** (tous Formats) : « + Ajouter » affiche un champ sous le titre, avec focus et clavier, et devient « Ouvrir le mode catalogue ». Le champ propose les Mouvements existants ; quitter une saisie vide referme le champ et rétablit « + Ajouter ». Les suggestions utilisent la petite carte « Carte — Mouvement sélectionné », variante Suppression=Aucune, avec filet des niveaux d’une famille. La carte montre nom et zones corporelles précédées de leur pastille (12 px gris), sans description tronquée. « Ouvrir le mode catalogue » reste dans la même modale de questionnaire : aucune navigation sortante ni modale de catalogue supplémentaire. La recherche reste visible avec le texte saisi et les résultats déjà filtrés ; croix d’effacement dès que le champ contient du texte. Filtrer, Trier et Replier / déplier les piles sont à droite sur la même ligne. Les petites cartes occupent la hauteur disponible jusqu’au bas de la modale, avec le filet des niveaux d’une famille, sans compteur « n familles · n mouvements ». « Ajouter » applique la sélection et referme ce mode ; « Fermer le mode catalogue » revient à la saisie sans ajouter de mouvement. La boucle permet la sélection multiple ; le buy-in, sous « Mouvement du buy-in », une sélection unique. [06/11/2026 : lien retiré ; « + Ajouter » ouvre directement le mode catalogue — D-500.]
- **Fiche du mouvement** : Dans le questionnaire et le récapitulatif, toucher la **photo** d’une petite carte ouvre la **Fiche du mouvement** en consultation seule, en modale par-dessus celle du Format, sur un second voile. Apparition par le bas, pleine largeur, coins hauts arrondis 24 px ; en-tête croix et titre « Fiche du mouvement », fond blanc et trait conservés. Nom, catégorie, zones corporelles, niveau, média, description et phases habituels ; aucun bouton d’action. Fermer restitue exactement l’état du parcours sous-jacent. Toucher le reste de la carte conserve son comportement existant.
- **Paramètres d'exécution** :
  - Durée : 12 min ;
  - Nombre d’AMRAP : 1 (nombre de blocs) ;
  - Repos entre deux AMRAP : 2 min, affiché seulement si le Nombre d’AMRAP est supérieur à 1 ;
  - Repos après chaque tour de boucle : 0 s ; initialise la récupération du dernier membre (§2.2) ;
  - Buy-in : interrupteur, désactivé par défaut ;
  - Volume croissant à chaque tour : interrupteur, désactivé par défaut.
- **Déroulé** générique (cases 1, 2, 3… n), calé en bas de l'écran, au-dessus de « Valider les paramètres » lorsque ce bouton est présent ; sinon l’espace libéré revient au contenu. Il réagit aux réponses.
- **Bouton** « Valider les paramètres » : apparaît uniquement lorsqu’une seconde étape est nécessaire ; la coche du questionnaire reste alors grise et inactive. Il ouvre le récapitulatif avec les réponses conservées, sans ajout à la Composition. « Enregistrer dans la séance » appartient au récapitulatif ; la sauvegarde définitive reste dans la Composition. [06/11/2026 : enregistrement porté par la coche ; bouton « Valider les paramètres » conservé uniquement si une seconde étape est nécessaire, coche du questionnaire alors grise — D-499 précisée le 06/11/2026.]
- **Sans mouvement — B10 en attente** : la représentation « Mouvement libre », les conditions de validation sans Mouvement et le lancement direct d’un minuteur ne sont pas validés dans cette révision. Ne pas implémenter la règle antérieure « toujours actif, même sans mouvement » ni une obligation nouvelle déduite de son retrait. Le parcours d’ajout avec des Mouvements et les validations existantes restent la base de travail ; le cas sans mouvement sera traité séparément.

**État plusieurs blocs** : écran « AMRAP — Questionnaire, plusieurs blocs » (`11410:20361`). Trois blocs de 12 min avec deux repos de 2 min : **40 min** au total. Le déroulé affiche Bloc 1, repos, Bloc 2, repos, Bloc 3 ; les repos sont gris et sans libellé dans la frise, les largeurs proportionnelles aux durées. Cet exemple représente les blocs configurés, pas les tours de boucle réalisés. La ligne de repos entre blocs est conditionnelle ; le Repos après chaque tour de boucle demeure un réglage distinct.

### 7.2 Choix des mouvements (« AMRAP — Choix des mouvements »)

État « mode catalogue » du questionnaire existant, sans modale distincte ; sélection multiple des mouvements de la boucle. « Ouvrir le mode catalogue » reste dans la même modale de questionnaire : aucune navigation sortante ni modale de catalogue supplémentaire. La recherche reste visible avec le texte saisi et les résultats déjà filtrés ; croix d’effacement dès que le champ contient du texte. Filtrer, Trier et Replier / déplier les piles sont à droite sur la même ligne. Les petites cartes occupent la hauteur disponible jusqu’au bas de la modale, avec le filet des niveaux d’une famille, sans compteur « n familles · n mouvements ». « Ajouter » applique la sélection et referme ce mode ; « Fermer le mode catalogue » revient à la saisie sans ajouter de mouvement. La boucle permet la sélection multiple ; le buy-in, sous « Mouvement du buy-in », une sélection unique. [06/11/2026 : lien retiré ; « + Ajouter » ouvre directement le mode catalogue — D-500.]

### 7.3 Choix du buy-in (« AMRAP — Choix du buy-in »)

Affiché seulement si l’interrupteur Buy-in est activé. Mode catalogue dans la même modale, section « Mouvement du buy-in », sélection unique. « Ajouter » applique ce choix ; « Fermer le mode catalogue » revient sans ajout.

### 7.4 Récapitulatif (« AMRAP — Récapitulatif, incrément et max » et « AMRAP — Récapitulatif, buy-in et incrément »)

- **En-tête modal** : Retour vers le questionnaire avec réponses conservées, titre = nom du Format ; contexte et tagline selon §7. Aucun bloc ni champ de nom de Séance. Cette règle vaut pour tous les récapitulatifs des Formats et départs rapides.
- **Mouvements** : composant « Carte — Mouvement sélectionné » (photo 44 px, nom puis zones corporelles précédées de leur pastille en 12 px gris, sans description tronquée) ; suppression par glissement vers la gauche (voir ci-dessous).
  - Réordonnancement par appui long (norme de l'application).
  - Variante « Suppression = Bloquée » pour le dernier mouvement de la boucle.
  - Avec buy-in : section « Buy-in · une fois, au départ » avec « Changer », puis section « En boucle · dans le temps restant » avec « + Ajouter ». Sans buy-in : section « Mouvements » avec « + Ajouter ».
- **Paramètres d’exécution du récapitulatif** : Durée de chaque bloc (ou Durée de l’exercice si autonome), déjà prévue par la base. Nombre de blocs, Repos entre les blocs et Repos après chaque tour de boucle sont les réglages repris du questionnaire ; cette révision n’ajoute pas silencieusement des contrôles d’édition au récapitulatif. Aucun nouveau contrôle d’édition de ces autres réglages n’est ajouté ici ; le bouton Retour permet de les modifier au questionnaire, avec réponses conservées.
- **Tableau des mouvements** : colonnes Mouvement | Objectif | Par tour | Charge (si activée) | Max.
  - Par tour : affichée seulement si le Volume croissant est activé.
  - Max : grise et désactive Objectif et Par tour, sans les masquer ; Charge reste modifiable. Condition d’arrêt À l’échec.
  - Lignes des buy-in : Objectif en Répétitions ou Durée, À l’échec possible ; Par tour inactif, Charge facultative. Le résultat à l’échec est saisi à la clôture du premier bloc.
- **Déroulé** : bloc continu AMRAP avec tours illustratifs de durée variable (buy-in, boucle, valeurs croissantes, « max »), calé en bas de l'écran dans l’espace libéré par l’ancien bouton d’enregistrement. Si le contenu dépasse, le contenu de la modale défile ; l’enregistrement est porté par la coche de l’en-tête (D-499).
- **Bouton** « Enregistrer dans la séance » : crée l’Exercice ou le Circuit selon la section 1 dans le brouillon de Composition, sans sauvegarde définitive de la Séance à ce stade. [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]

- **Suppression d'un mouvement** (récapitulatif, règle valable pour tous les formats) : glisser la carte vers la gauche fait apparaître l'action rouge « Supprimer », au format des actions glissées de l'application. Pour le dernier mouvement de la boucle (variante « Suppression = Bloquée »), l'action apparaît grisée et la carte revient en place. Les résultats de recherche (variante « Suppression = Aucune ») ne se glissent pas. Réordonnancement par appui long. Écran : « AMRAP — Récapitulatif, suppression glissée ».

**Fiche du mouvement au récapitulatif :** Dans le questionnaire et le récapitulatif, toucher la **photo** d’une petite carte ouvre la **Fiche du mouvement** en consultation seule, en modale par-dessus celle du Format, sur un second voile. Apparition par le bas, pleine largeur, coins hauts arrondis 24 px ; en-tête croix et titre « Fiche du mouvement », fond blanc et trait conservés. Nom, catégorie, zones corporelles, niveau, média, description et phases habituels ; aucun bouton d’action. Fermer restitue exactement l’état du parcours sous-jacent. Toucher le reste de la carte conserve son comportement existant.

### 7.5 Dans la séance (« AMRAP — Séance, circuit avec buy-in »)

- Le circuit ou l'exercice AMRAP s'affiche selon la section 5.
- Toucher la Durée de chaque bloc ouvre une roulette de durée ; toucher le nombre de blocs ouvre le choix du nombre de blocs.
- Toucher un exercice ouvre sa modale des paramètres d'exécution :
  - « AMRAP — Modale exercice, buy-in » ;
  - « AMRAP — Modale exercice, dans un circuit » ;
  - « AMRAP — Modale exercice, dans un circuit, durée à l'échec » ;
  - « AMRAP — Modale exercice simple, à la cible » et « … à l'échec ».

<a id="formats-formulaire-controles"></a>
### 7.6 Tableaux et données effectives

**Décision de Hermann du 06/11/2026, tous formats.** La saisie de S1 ou du premier tour ne se reporte dans aucune autre colonne, ni pour la cible ni pour la charge. Les cases non saisies restent à renseigner selon les règles du format. Les valeurs prédéfinies d’un modèle (Progression, échelle For time) et la reprise de valeurs déjà enregistrées à la réouverture ont leur propre origine.

Les unités proposées restent limitées par le modèle et le contexte de l’Exercice ; le tableau ci-dessous ne généralise pas Durée à l’AMRAP autonome ni à un autre cas qui l’exclut. Le principe du §7.6 de la référence Formats est inchangé : chaque ligne d'un tableau correspond à un Exercice, et chaque case écrit dans un champ standard de cet Exercice, sans second stockage. Correspondances à jour :

| Format et tableau | Case | Champ de l'Exercice alimenté |
|---|---|---|
| Tous les tableaux | Colonne Unité, ou unité choisie au clavier | **Mode d'exécution** = Répétitions / Durée |
| Tous les tableaux | « (+ kg) » / « (− kg) » | **Charge** = Avec / Sans (restauration dans le brouillon seulement, §16 du complément du 5 novembre) |
| Tous les questionnaires | Interrupteur « Avec charge » désactivé | **Charge** = Sans pour tous les Exercices (restauration dans le brouillon seulement, §16 du complément du 5 novembre) |
| Progression — S1…Sn | Objectif et charge de la série k | **Séries variables** : cible et charge de la série k |
| For time — Tour 1…n | Objectif et charge du tour k | **Séries variables** : cible et charge de la série k ; nombre de séries = nombre de tours |
| Superset — Tour 1…n | Objectif et charge du tour k | **Séries variables** : cible et charge de la série k ; nombre de séries = nombre de tours (Circuit standard à séries alternées : A1, B1, récupération, A2, B2…) ; « Récupération après le tour » = **Récupération** du dernier Exercice |
| EMOM — S1…Sn | Objectif et charge de la série k | **Séries variables** : cible et charge de la série k ; nombre de séries = Nombre de séries de l'EMOM |
| Tabata, 30/30 — Objectif \| Pause \| Charge | Objectif | **Objectif de durée** (ou Nombre de répétitions) de chaque série, **séries identiques** |
| | Pause | **Pause** après chaque série |
| | Charge | **Charge** commune de l'Exercice |
| Renforcement — Objectif \| Pause \| Charge | Objectif | **Nombre de répétitions** (ou Objectif de durée) de chaque série, séries identiques |
| | Pause, Charge | **Pause** après chaque série ; **Charge** commune |
| À l'échec — Objectif \| Pause \| Charge | Objectif | **Condition d'arrêt** = À l'échec, dans le Mode choisi ; séries identiques |
| | Pause, Charge | **Pause** après chaque série ; **Charge** commune |
| AMRAP — Objectif \| Par tour \| Charge \| Max | Objectif, Par tour, Max | Inchangé (§7.6 de la référence Formats) |
| | Charge | **Charge** commune |
| Death by — Départ \| Incrément \| Charge | Départ | **Objectif de départ** (répétitions ou durée, §13 du complément du 5 novembre) |
| | Incrément | **Incrément par intervalle** (au minimum + 1 dans l'unité) |
| | Charge | **Charge** commune |
| Un seul mouvement (Tabata, 30/30, Renforcement, À l'échec) | Ligne Charge sous Durée totale | **Charge** commune |

**Préremplissage et réouverture.** ~~La copie de la valeur de S1 concerne l’EMOM et le Superset décrits ici.~~ **(remplacé le 06/11/2026 : chaque colonne se saisit indépendamment ; les cases non saisies restent à renseigner)** Elle ne remplace pas les valeurs initiales propres aux autres modèles : la Progression conserve notamment 10 / 12 / 14 ; une échelle For time explicitement choisie n’est pas uniformisée. Les cases initiales non définies restent à renseigner, sans prendre les chiffres illustratifs Figma comme défauts. L’ajout ultérieur de séries/tours conserve les règles existantes de nouvelles cases à compléter. À la réouverture (« Modifier le format »), les cases affichent les valeurs effectives de chaque série, sans réinitialisation ni changement silencieux Identiques/Variables. Un réglage commun dont les valeurs diffèrent entre Exercices affiche « variable » (§7.9 de la référence Formats).

**EMOM — tableau et validation du 5 novembre.** Tableau Unité | S1…Sn, quatre colonnes visibles au plus, nom et unité fixes ; chaque série porte sa cible et sa charge. Pas de champ d’incrément d’objectif ni de charge. Création : ~~valeurs de S1 reprises initialement~~ **(remplacé le 06/11/2026 : chaque colonne se saisit indépendamment ; les cases non saisies restent à renseigner)** ; nouvelles séries ajoutées après coup à compléter selon les règles existantes ; réouverture sans réinitialisation. Pour chaque rang/fenêtre, travail connu en Durée incluant deux côtés et pause entre côtés applicable ; somme des membres dans un intervalle commun, intervalle local sinon. Atteinte ou dépassement de l’intervalle bloque la validation (message et cadres rouges), y compris après modification en Composition ; aucune durée inventée pour les membres en Répétitions.

**Death by — cible du 5 novembre.** Répétitions ou Durée, Objectif de départ et Incrément ≥ +1 dans l’unité. Seul un premier rang dont le travail connu atteint ou dépasse l’intervalle déclenche un avertissement non bloquant ; sauvegarde autorisée si les autres champs sont valides. À l’exécution, ne pas lancer un rang dont ce travail atteint ou dépasse la fenêtre : arrêt après le précédent, résultat « limite de l’intervalle atteinte », aucun échec ni tentative fictifs. En Durée : deux côtés et pause applicable, somme des membres en fenêtre commune ou intervalle du membre en alternance. Rangs acquis et rang courant distincts ; durée partielle renseignée seulement pour une fenêtre réellement tentée et non tenue. Les autres règles de fin et d’achèvement Death by restent applicables ; aucune fenêtre prolongée. Exemple 10 s puis +10 s / 60 s : cinq rangs réussis, arrêt avant le rang 6. La progression future compatible au départ ne déclenche pas d’avertissement.

Les paramètres requis absents ou invalides bloquent l’enregistrement ; l’avertissement temporel Death by du §12 constitue une exception non bloquante. Les défauts Profil réellement repris restent orange avant première validation, sans confondre défauts des modèles et du Profil.

### 7.7 Charges des modèles et restauration temporaire

**Règle.** En Progression et en For time, la charge se décide **mouvement par mouvement**, dans le tableau du récapitulatif. Une même Progression ou un même For time associe souvent un mouvement chargé et un mouvement au poids du corps : la décision se prend par mouvement, une fois l'interrupteur « Avec charge » activé.

- **À la création**, chaque mouvement n’a que sa ligne d’objectif tant qu’aucune charge n’est activée pour lui. À la réouverture, son état effectif et ses valeurs sont repris (§16 du complément du 5 novembre).
- **Un bouton sur chaque ligne**, dans la colonne Unité, en bleu KODJO, qui bascule selon l'état :
  - **« + kg »** (mouvement sans charge, sous « rép. ») : ajoute la ligne de charge de ce mouvement (cases « — ») et ouvre le clavier sur la première série (ou le premier tour) ;
  - **« − kg »** (mouvement avec charge, en face de la ligne de charge) : retire la ligne. Dans le même brouillon non sauvegardé, les valeurs saisies sont conservées sans s’appliquer et reviennent si l’on touche à nouveau « + kg » (§16 du complément du 5 novembre).
- **Ligne de charge** : sous l'objectif, valeurs avec leur unité (« 10 kg »), modifiables au clavier (Précédent, Suivant, Fermer ; pavé décimal avec virgule).
- **Vider toutes les cases** retire la ligne à la fermeture du clavier, et « + kg » revient ; il n’y a rien à restaurer.
- **Présentation** : sur la ligne de charge, les valeurs s'affichent entre parenthèses avec leur unité (« (12 kg) », case vide « (—) »), et le bouton aussi (« (+ kg) », « (− kg) »), pour distinguer la charge de l'objectif. C'est un affichage seulement : la valeur reste un nombre décimal (12,5 kg possible). Même présentation en Progression, For time et Superset.
- **Données** : « + kg » met la Charge de l'Exercice sur « Avec » ; une ligne vidée la remet sur « Sans ».
- **Réouverture** (« Modifier le format ») : chaque mouvement affiche son état effectif ; l’interrupteur global suit la règle du §16.

**Interrupteur du questionnaire.** Progression et For time comportent « Avec charge », désactivé par défaut, selon le §16. Son activation rend disponibles les commandes locales ; la charge reste facultative pour chaque mouvement.

**Écrans Figma :** questionnaires Progression et For time avec interrupteur ; récapitulatifs et états clavier avec « (+ kg) » sur les mouvements sans charge et « (− kg) » sur les mouvements chargés ; « Progression — Récapitulatif, ajout d’une charge (+ kg) ».

**Documentation :** référence Formats (Progression §9.2–9.3, For time §11), ch13 (tableaux des récapitulatifs).

**Règle.** Chaque questionnaire d'un Format où une charge peut s'appliquer comporte l'interrupteur **« Avec charge »**, désactivé par défaut : Progression, For time, Superset, Tabata, 30/30, Renforcement, À l'échec, AMRAP, EMOM, Death by.
- **Activé** : les options de charge apparaissent dans le tableau du récapitulatif : bouton « (+ kg) » / « (− kg) » par mouvement et ligne de charge (Progression, For time, Superset, EMOM), ou colonne Charge (AMRAP, Tabata, 30/30, Renforcement, À l'échec, Death by). La décision reste prise **mouvement par mouvement**.
- **Renforcement et À l'échec** (structure de séries identiques, comme le 30/30) : un seul mouvement → ligne Charge sous Durée totale ; plusieurs → tableau **Mouvement | Objectif | Pause | Charge** dans son propre cadre (« 15 rép. » / « à l'échec », « 1 min » / « 2 min »), lignes communes « Répétitions par série » ou « Cible par série » et « Pause » retirées des paramètres. Une charge fixe par mouvement ; une charge qui évolue d'une série à l'autre relève de la Progression.
- **Death by** : colonne **Charge** ajoutée au tableau Mouvement | Départ | Incrément, une charge fixe par mouvement (par exemple Death by thrusters à 20 kg).
- **Désactivé** : aucune option de charge n'apparaît ; le tableau reste plus lisible pour une séance au poids du corps.
- **Réouverture** : l'interrupteur reprend l'état effectif (activé si au moins un Exercice a sa Charge sur « Avec », §7.9 de la référence Formats). Dans le même brouillon non sauvegardé, désactiver puis réactiver l’interrupteur retrouve les mouvements précédemment chargés et leurs valeurs ; ceux qui étaient sans charge le restent. La même restauration temporaire s’applique aux boutons locaux. Une première activation globale rend les commandes disponibles sans charger automatiquement tous les mouvements.

**Portée de la restauration.** Elle suit le fonctionnement des Paramètres d’exécution dans la même session d’édition, avant sauvegarde. Elle ne crée aucune nouvelle obligation de mémorisation après sauvegarde : une ouverture ultérieure lit l’état effectif enregistré selon les règles de persistance existantes. Vider volontairement une valeur n’équivaut pas à la masquer : les valeurs effacées ne sont pas restaurées automatiquement.

**Écrans Figma :** interrupteur ajouté, représenté activé pour correspondre aux récapitulatifs, sur « P-Tabata — Questionnaire », « 30/30 — Questionnaire », « Superset — Questionnaire », « For time — Questionnaire », « Progression — Questionnaire », « Renforcement — Questionnaire », « À l'échec — Questionnaire », « Death by — Questionnaire » ; « Renforcement — Récapitulatif » et « À l'échec — Récapitulatif » : tableau Mouvement | Objectif | Pause | Charge ; récapitulatifs Death by : colonne Charge ; « 30/30 — Récapitulatif » : tableau Mouvement | Objectif | Pause | Charge, lignes « Travail par série » et « Pause » retirées des paramètres.

<a id="formats-actions-circuit"></a>
### 7.8 Circuit replié : actions et nom

**Règle.** Dans la Composition, un **glissé à gauche sur un Circuit replié** révèle **Renommer | Dupliquer | Supprimer** pour un Circuit composé à la main ou sans Modèle d'origine ; un Circuit issu d’un modèle propose **Renommer | Modifier le format | Dupliquer | Supprimer** (§7.9), sur le modèle du glissé d'un Exercice. Le Circuit déplié ne se glisse pas : le geste déplacerait tout le bloc et entrerait en concurrence avec le glissé des Exercices qu'il contient. Le Cycle n'est pas concerné : il n'est jamais replié.

**Présentation.** Le cadre du Circuit glisse à gauche avec son contenu et s'arrête à 8 px de Renommer. Les boutons ont la hauteur du cadre et forment un seul bloc : Renommer (bleu KODJO) arrondi à gauche, Modifier le format (violet, pour un Circuit issu d’un modèle) et Dupliquer (gris) à coins carrés, Supprimer (rouge) arrondi à droite, avec le rayon du cadre du Circuit.

- **Nom du Circuit** : nouvel attribut du Circuit. Par défaut : le nom de son **Modèle d'origine** pour tout Circuit créé par un modèle, porteur (« AMRAP », « For time ») ou standard (« Tabata », « Superset ») ; « Circuit » pour un Circuit composé à la main. Le nom ne remplace que le titre : la deuxième ligne garde l'organisation (« AMRAP · 1 bloc · groupées »), et renommer ne modifie ni le Format ni sa nature. L'appui sur le titre et le chevron reste réservé au repli et au dépliage ; le nom ne se modifie que par l'action Renommer.
- **Renommer** : le titre passe en saisie en ligne, avec le clavier ; validation par la touche Retour ; un nom vide reprend le nom par défaut.
- **Dupliquer** : la copie est insérée juste après l'original, repliée, avec tous ses Exercices et réglages, y compris le Format porté et le Modèle d’origine ; elle est indépendante de l'original. Son titre passe aussitôt en saisie, prérempli avec le nom d'origine suivi de « (C) » (« Circuit (C) ») et sélectionné : l'utilisateur tape un nouveau nom ou valide.
- **Supprimer** : confirmation « Supprimer ce circuit ? », « Le circuit et ses N exercices seront supprimés de la séance. », Annuler / Supprimer. La confirmation se justifie parce qu'une erreur de geste fait perdre plusieurs Exercices.

**Écrans :** « Composition séance — Circuit replié, actions glissées » (trois actions), « Composition séance — Circuit issu d'un format, actions glissées » (quatre actions), « Composition séance — Circuit replié, suppression (confirmation) », « Composition séance — Circuit dupliqué, saisie du titre ».

<a id="formats-reedition"></a>
### 7.9 Réédition depuis la Composition

### 7.9.1. Règle

Le glissé à gauche sur un **Circuit replié issu d'un modèle** (Modèle d'origine renseigné) révèle une quatrième action, **« Modifier le format »**, entre Renommer et Dupliquer : **Renommer | Modifier le format | Dupliquer | Supprimer**. Un Circuit composé à la main garde les trois actions.

« Modifier le format » ouvre la **modale du récapitulatif** du modèle, préremplie avec l'état actuel du Circuit. Le bouton Retour mène au questionnaire, pour changer la structure (par exemple l'Exécution) ; « Valider les paramètres » ramène au récapitulatif. Le bouton du récapitulatif s'intitule **« Enregistrer les modifications »** et suit la même règle d'activation que « Enregistrer dans la séance » (§7.6). L'enregistrement met à jour le Circuit existant ; fermer sans enregistrer ne change rien. [06/11/2026 : enregistrement porté par la coche ; bouton « Valider les paramètres » conservé uniquement si une seconde étape est nécessaire, coche du questionnaire alors grise — D-499 précisée le 06/11/2026.]

### 7.9.2. Origine du Circuit

- **Modèle d'origine** : le Circuit garde le modèle qui l'a créé. Ce champ est **distinct** de « Format d'origine », qui reste propre aux Circuits porteurs et gouverne leur exécution (§7.9.7) ; il est renseigné pour tous les Circuits créés par un modèle :
  - Circuits porteurs : AMRAP, For time, EMOM, Death by (déjà connus) ;
  - Circuits standards créés par un Format : Tabata, 30/30, Superset, Renforcement, Progression, À l'échec, et les exécutions « À la suite » (§1.1 du présent document).
- Un Circuit sans Modèle d'origine (composé à la main) n'a pas l'action.
- Le Modèle d'origine n'est pas modifiable et ne change rien à l'exécution du Circuit standard ; il sert uniquement à rouvrir le bon questionnaire.

### 7.9.3. Préremplissage

- Le questionnaire et le récapitulatif sont **reconstruits à partir de l'état actuel** du Circuit et de ses Exercices ; les réponses d'origine ne sont pas stockées.
- Ils montrent donc ce qui sera exécuté, y compris les modifications faites après coup (valeurs, Exercices ajoutés ou retirés, Rôles).
- Les réponses se déduisent des champs : durée et nombre de blocs, nombre de tours, nature, présence d'un buy-in ou buy-out (Rôles), volume croissant (incrément non nul), « Avec charge » (§7.9.7), objectifs et charges des tableaux.

### 7.9.4. Enregistrement

- Le Circuit est **mis à jour en place**, pas recréé : mêmes identifiants d'Exercices, même position dans la Séance, même nom du Circuit.
- Seuls les champs **effectivement modifiés** dans le questionnaire et le récapitulatif sont mis à jour. Les autres sont **conservés** : phases, cadence, côtés, réglages faits dans la modale de l'Exercice.
- **Changement de structure** (par exemple EMOM « dans chaque intervalle » vers « à la suite ») : la règle d'entrée dans un Circuit s'applique (§6). Les paramètres compatibles sont conservés, les autres passent « à renseigner », et « Enregistrer les modifications » reste inactif tant qu'ils manquent. Aucune confirmation de perte supplémentaire. Le Format d'origine suit la nouvelle structure (renseigné pour un Circuit porteur, vide pour un Circuit standard) ; le Modèle d'origine et le nom du Circuit sont conservés. [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]
- **Fermer sans enregistrer** (Retour vers le questionnaire, puis croix) : aucune modification n'est appliquée.

### 7.9.5. Ce qui ne change pas

- Instantanés déjà figés, historique et records existants : aucun effet rétroactif. Les prochains lancements utilisent la configuration modifiée. L'instantané d'une Séance est figé au démarrage.
- Les autres actions glissées (Renommer, Dupliquer, Supprimer) et leurs règles.

### 7.9.6. Écrans Figma

- « Composition séance — Circuit issu d'un format, actions glissées » : quatre actions de 70 px ; « Modifier le format » en violet, coins carrés ; exemple sur un Circuit « Tabata ».
- « Tabata — Récapitulatif rouvert depuis la Composition » : récapitulatif prérempli, bouton « Enregistrer les modifications ». [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]

### 7.9.7. Représentation de l'état courant dans le formulaire

- **Charge des modèles — cible du 5 novembre.** Les dix questionnaires proposent Avec charge, Sans par défaut. L’activation globale rend les commandes locales disponibles sans charger tous les mouvements ; (+ kg)/(− kg) pilote chaque Exercice. Charges facultatives : Progression/For time/Superset/EMOM par série ou tour ; autres modèles fixes par mouvement. Affichage entre parenthèses et unité kg. Masquer puis réactiver retrouve états et valeurs dans le même brouillon avant sauvegarde ; vider efface réellement. Une réouverture lit l’état enregistré, sans nouvelle obligation de mémorisation de réponses historiques. Aucun incrément de charge EMOM ; seules les charges effectives par série font référence.
- **Réglages hétérogènes.** Quand un réglage commun du questionnaire ou du récapitulatif (nombre de séries, travail par série, pause, intervalle, valeurs par série…) ne correspond pas à une valeur unique parce que les Exercices ont des valeurs différentes :
  - le champ commun affiche **« variable »**, dans le style d'une valeur modifiable ;
  - les valeurs propres à chaque Exercice sont **conservées** à la réouverture et visibles là où le récapitulatif les détaille (tableaux, déroulé) ; elles ne sont jamais uniformisées automatiquement ;
  - seule une **modification explicite** du champ commun (saisie d'une valeur) remplace les valeurs de tous les Exercices concernés ; une confirmation courte l'annonce, puisque des valeurs personnalisées sont écrasées ;
  - « variable » n'est pas une valeur « à renseigner » : il ne bloque pas « Enregistrer les modifications ». [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]
- **Modèle d'origine et Format d'exécution.** Le modèle technique distingue l'information qui permet de rouvrir le parcours (Modèle d'origine) et les paramètres qui gouvernent l'exécution (Format d'origine d'un Circuit porteur, paramètres standards). Un Circuit standard issu d'un modèle conserve son exécution standard ; son origine ne lui attribue aucun Format partagé.

### 7.9.8. Vérifications attendues

- Réouverture avec les valeurs actuelles, y compris après modification individuelle d’un Exercice.
- Enregistrement en place : conservation des identifiants des Exercices conservés, du nom, de la position et des réglages hors périmètre des champs effectivement modifiés.
- Fermeture et retour sans enregistrement : aucune modification de la Composition.
- Changement de structure : conservation des paramètres compatibles, paramètres incompatibles à compléter, validation inactive si des valeurs obligatoires manquent, sans confirmation de perte supplémentaire.
- Circuit manuel ou ancien Circuit sans Modèle d’origine : absence de l’action.
- Avec / Sans charge repris de l'état effectif ; charges conservées en « Sans » sans réactivation.
- Réglage hétérogène affiché « variable », valeurs conservées, remplacement seulement sur saisie explicite.
- Duplication : conservation du Modèle d’origine et indépendance de la copie.

---

## 8. Limite connue

Pas de mode Distance ni Calories pour l'instant. Leur ajout se fera par une valeur supplémentaire du Mode, qui reste exclusif car il pilote l'exécution, avec un impact limité. Les précisions descriptives (Charge, Hauteur, Distance descriptive) seront des attributs cumulables qui ne pilotent pas l'exécution.

## 9. Application de la règle au Tabata

Le Tabata se traduit entièrement en **exercices standards** et, avec plusieurs mouvements, en **circuit standard** : aucun paramètre propre au format n'est nécessaire, ni sur l'exercice ni sur le circuit. Le Tabata est un modèle de départ : le questionnaire et le récapitulatif calculent les valeurs des champs standards, que l'utilisateur peut ensuite modifier librement.

Paramètres du questionnaire : Nombre de séries (8), Travail par série (20 s), Pause (10 s) ; avec plusieurs mouvements, choix de l'Exécution : **À la suite | En alternance**.

Exemple ci-dessous : 2 mouvements, 8 séries, 20 s / 10 s.

| Exécution | Ce qui se passe | Structure créée | Paramétrage de chaque exercice (champs standards) | Durée |
|---|---|---|---|---|
| Un seul mouvement | Un Tabata | 1 exercice | Mode Durée ; Séries « 8 séries identiques » ; Objectif de durée 20 s ; Pause 10 s ; Durée de l'exercice 4 min ; Récupération 0 s | 4 min |
| **À la suite** | Tabata de A, récupération, Tabata de B | Circuit standard groupé, 1 tour | Mode Durée ; Séries « 8 séries identiques » ; Objectif de durée 20 s ; Pause 10 s ; Durée de l'exercice 4 min ; Récupération = récupération entre les mouvements (1 min) sur le premier, 0 s sur le dernier ; elle remplace la dernière Pause du premier Exercice | 8 min 50 s |
| **En alternance** | Deux Tabata entrelacés (A, B, A, B… 16 séries), chaque mouvement fait ses 8 séries | Circuit standard : 8 tours, nature « alternées » | Mode Durée ; Séries « 8 séries identiques » ; Objectif de durée 20 s ; Pause 10 s ; Durée de l'exercice 4 min ; Récupération 0 s | 8 min |

Règles :
- Le **Nombre de séries** garde le même libellé et le même sens quelle que soit l'exécution : ce sont les séries de chaque mouvement. L'exécution choisie détermine le résultat (structure créée, durée), affiché par le déroulé et la durée totale. Un Tabata de 4 min alternant deux mouvements se règle à 4 séries en alternance.
- En alternance (séries alternées), le nombre de tours du circuit est égal au nombre de séries de chaque exercice.

Écrans Figma : récapitulatifs « P-Tabata — Récapitulatif, à la suite » et « … en alternance » ; séance « Tabata — Séance, circuit en alternance » et modales « Tabata — Modale exercice, standard » et « Tabata — Modale exercice, en alternance » (identique pour chaque exercice du circuit). Les autres cas n'ont pas d'écran : leur paramétrage, entièrement standard, est décrit ci-dessus.

### 9.1 Pause terminale du Tabata À la suite

La règle générale s’applique : une récupération après l’Exercice remplace sa dernière Pause ; elle ne s’y ajoute pas. Pour deux mouvements à 8 séries de 20 s / 10 s, avec 1 min de récupération après le premier et 0 s après le second : **8 × 20 + 7 × 10 + 60 + 8 × (20 + 10) = 530 s, soit 8 min 50 s**.

A1 remplace B06 : aucune exception liée à l’origine Tabata n’est conservée. Les Exercices restent standards et librement modifiables. Les 4 minutes du premier bloc dans le questionnaire décrivent le 20/10 sans récupération ; sa durée effective avec récupération est de 4 min 50 s ; le second Exercice dure 4 min, soit 8 min 50 s au total.

### 9.2 Départs rapides : 30/30, Renforcement, Superset, Progression, À l’échec

Ces cinq départs sont des **préconfigurations librement modifiables**. Ils créent des Exercices et, si nécessaire, des Circuits standards, sans nouveau paramètre de Format ni verrouillage propre au modèle. Les 30 s d’effort et 30 s de pause du 30/30 sont des valeurs initiales modifiables, au même titre que les 20/10 du Tabata. Son état initial est Mode Durée, 6 séries identiques, Objectif de durée 30 s, Pause 30 s, Durée de l’exercice 6 min, Récupération 0 s ; les 30 s de pause ne sont pas une récupération après Exercice. Aucun verrouillage propre au 30/30 n’est ajouté.

Les réglages et structures initiales déjà définis pour ces départs sont repris depuis leurs sources documentaires actuelles, sauf le Superset corrigé par A4 : deux mouvements choisis dans le questionnaire, puis Circuit standard alterné à trois tours pour le Superset ; aucun emplacement vide. « Aucun Mouvement présélectionné » signifie aucun choix arbitraire avant la sélection de l’utilisateur, pas une création sans Mouvement. Renforcement reste à 3 séries × 15 répétitions ; Progression à 10 / 12 / 14 répétitions ; À l’échec à 3 séries à l’échec (D-24). Les réglages du Superset restent libres ; aucune cible chiffrée nouvelle n’est inventée. Progression utilise les séries variables standards ; À l’échec utilise les cibles à l’échec standards. Les noms d’écran du §16 ne constituent pas, à eux seuls, la définition de leurs paramètres initiaux.

### 9.3 Progression — tableau des séries et saisie au clavier

**Règle.** Le questionnaire Progression comporte un interrupteur **« Avec charge »**, entre Pause et Durée totale. Il n'existe que dans le questionnaire.
- **Activé** : le tableau des séries du récapitulatif affiche, sous les répétitions de chaque série, une **charge par série** pour chaque mouvement. La charge est facultative par mouvement : laissée vide, ce mouvement est fait sans charge, par exemple un mouvement au poids du corps dans la même Progression. Une charge vide ne bloque donc pas « Enregistrer dans la séance ». [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]
- **Désactivé** : le tableau n'affiche que les répétitions, et aucune charge n'est créée sur les Exercices.
- **Après l'enregistrement**, la charge se modifie dans la modale de l'Exercice, comme pour tout Exercice standard. L'interrupteur n'est pas reporté dans le récapitulatif ni dans la Séance.

**Valeur par défaut.** Désactivé (Sans charge). L'écran « Progression — Questionnaire » le représente activé, pour correspondre au récapitulatif « Progression — Récapitulatif » (charges sur « Fentes avant », aucune sur « Squats sautés »).

**Tableau des séries.** Le tableau affiche au plus **4 colonnes visibles** à côté du nom du mouvement : la première pour l'**unité** de l'objectif (« rép. », ou « durée »), puis une colonne par série (S1, S2, S3). Au-delà de trois séries, les colonnes de séries défilent horizontalement ; le nom et l'unité restent fixes. Les cases de l'objectif ne portent que des nombres (« 12 ») ; la durée s'affiche au format de l'application (« 30 s », « 1 min 30 »). La ligne de charge apparaît sous l'objectif quand l'interrupteur est activé, avec l'unité à côté de la valeur (« 10 kg »), en bleu KODJO comme toute valeur modifiable. Le déroulé garde les nombres seuls.

**Saisie au clavier.** Toutes les valeurs du tableau se saisissent avec le clavier numérique déjà développé pour les séries variables (barre au-dessus du clavier, boutons en pastilles, Fermer plein en bleu KODJO). Pas de roulette.
1. **Première case d'une ligne sans unité** : la barre affiche **Répétitions**, **Durée** et **Fermer**. Fermer ferme le clavier sans rien enregistrer. Un chiffre tapé sans choix vaut Répétitions.
2. **Unité choisie** : elle reste affichée dans la barre en état sélectionné (identifiable pendant la frappe), suivie de **Précédent**, **Suivant** et **Fermer** ; l'utilisateur entre les valeurs. Les autres cases de la ligne s'ouvrent directement dans cette configuration. Fermer garde les valeurs saisies.
3. **Nouvel appui sur l'unité** : Précédent et Suivant disparaissent, et la barre propose à nouveau les deux unités, la courante restant sélectionnée. Choisir l'autre unité remet les valeurs de la ligne « à renseigner », sans conversion.
4. **Durée** : les chiffres se remplissent par la droite (3, 0 → 30 s ; 1, 3, 0 → 1 min 30). **Charge** : même clavier, avec la virgule, sans choix d'unité (kg).
5. **Ordre de Suivant** : objectif S1 → S3, puis charges S1 → S3, puis ligne suivante.

**Écrans :** « Progression — Récapitulatif » ; « Progression — Récapitulatif, clavier étape 1 (unité) », « … étape 2 (valeurs) », « … étape 3 (changement d'unité) », placés à la suite du récapitulatif.

### 9.4 Superset

**Deux mouvements à la création.** Un superset est une paire : le questionnaire n'accepte que deux mouvements. « + Ajouter » se désactive dès que deux mouvements sont choisis ; « Valider les paramètres » ne s'active qu'avec deux. Après l'enregistrement, le Circuit est un Circuit standard : un troisième Exercice peut y être ajouté depuis la Composition. [06/11/2026 : enregistrement porté par la coche ; bouton « Valider les paramètres » conservé uniquement si une seconde étape est nécessaire, coche du questionnaire alors grise — D-499 précisée le 06/11/2026.]

**Réouverture** (« Modifier le format ») : le questionnaire et le récapitulatif affichent les Exercices actuels du Circuit, y compris un troisième ajouté depuis la Composition ; la présence de plus de deux Exercices ne bloque pas « Valider les paramètres » ni « Enregistrer les modifications », sous réserve que tous les paramètres requis soient renseignés et cohérents ; « + Ajouter » reste désactivé ; un mouvement peut être retiré tant qu'il en reste au moins deux. [06/11/2026 : enregistrement porté par la coche ; bouton « Valider les paramètres » conservé uniquement si une seconde étape est nécessaire, coche du questionnaire alors grise — D-499 précisée le 06/11/2026.]

**Questionnaire.** La ligne « Répétitions par série » est retirée : l'objectif dépend du mouvement. Le questionnaire garde la structure : Circuit (nombre de tours, **3 tours par défaut**), Récupération après le tour, Durée totale.

**Récapitulatif.** Le tableau reprend celui de la Progression et du For time (§9.3 de la référence Formats, §9 du complément du 5 novembre ci-dessus) : colonne **Unité** (mode Répétitions ou Durée, choisi au clavier), puis une colonne par tour (**Tour 1, Tour 2, Tour 3** ; 4 colonnes visibles au plus, défilement au-delà).
- **Aucune progression par défaut** : ~~chaque tour est prérempli avec la valeur du premier~~ **(remplacé le 06/11/2026 : chaque colonne se saisit indépendamment ; les cases non saisies restent à renseigner)** ; l'utilisateur modifie les tours qui évoluent (charge montante 40 / 45 / 50 kg, répétitions dégressives 12 / 10 / 8).
- **Charge par tour**, par mouvement : bouton « + kg » / « − kg » sur chaque ligne (§9 du complément du 5 novembre). Présentation des charges : voir §9.
- **Présentation** : trois cadres séparés (Circuit ; tableau ; Récupération après le tour et Durée totale), §12.
- **À l'échec** n'est pas dans le tableau : c'est une condition d'arrêt, pas une unité ; elle se règle dans la modale de l'Exercice.

**Organisation.** Le Superset créé est un Circuit standard à **séries alternées**, trois tours par défaut : A1, B1, récupération, A2, B2… Chaque membre porte autant de séries effectives que de tours. Un tour ne rejoue pas la collection entière des séries de chaque membre. « Récupération après le tour » est la Récupération du **dernier** Exercice du Circuit ; aucun repos supplémentaire n’est ajouté entre les membres par cette préconfiguration. Les règles existantes de Pause terminale et de substitution par la Récupération restent applicables, sans double comptage.

**Troisième membre ajouté depuis la Composition.** Aucun transfert automatique : chaque Exercice garde sa Récupération. À la réouverture, « Récupération après le tour » affiche celle du nouveau dernier Exercice (« à renseigner » s’il n’en a pas) et l’enregistrement l’écrit sur lui ; les membres intermédiaires gardent la leur.

**Écrans Figma :** « Superset — Questionnaire » (ligne retirée, 3 tours) ; « Superset — Récapitulatif » (tableau par tour : Squats sautés 12 / 12 / 12 sans charge, Fentes avant 10 / 10 / 10 à 12 kg ; « + Ajouter » désactivé avec deux mouvements ; déroulé à jour). Le libellé « Récupération après la paire » des écrans devient « Récupération après le tour ».

### 9.5 Tableaux, Tabata, 30/30, Renforcement et À l’échec

**Règle.** Dans les récapitulatifs Progression, For time, Superset, Death by et EMOM, le tableau des mouvements est **isolé dans son propre cadre**, entre le cadre des paramètres qui le précèdent (nombre de séries, de tours, intervalle…) et celui des paramètres qui le suivent (pause, récupération, durée totale, condition d'arrêt, exécution). **Position.** Pour Tabata, 30/30, Renforcement, À l'échec (sous « Nombre de séries ») et For time (sous « Nombre de tours »), le tableau des mouvements est placé **juste sous la ligne du nombre de séries ou de tours**, qui forme son propre cadre ; les autres paramètres (durée totale, exécution, récupération…) suivent dans un troisième cadre. En Death by, le tableau n'a pas de fond blanc propre : il prend la couleur de son cadre. Ses valeurs portent leur unité, à côté de la valeur (« 1 rép. », « + 1 rép. », « 10 s », « + 10 s »). Les cadres sont séparés de 8 px ; quand la place manque au-dessus du déroulé, l'écart descend à 4 px et le contenu de la modale défile si nécessaire.

**Écrans Figma :** « Progression — Récapitulatif » et ses écrans clavier et d'ajout de charge, « For time — Récapitulatif », « Superset — Récapitulatif », « Death by — Récapitulatif, dans chaque intervalle », « … en alternance », « … à la suite ».

**Progression : aucune.** Tabata et 30/30 sont des protocoles de temps fixe (20 / 10 s, 30 / 30 s) : on progresse par le nombre de répétitions ou la vitesse dans la fenêtre, pas par la durée d'une série à l'autre. Le récapitulatif n'a pas de tableau par série ; les séries variables restent accessibles dans la modale de l'Exercice pour un cas particulier.

**Charge : par mouvement** (interrupteur au questionnaire, §16 du complément du 5 novembre). Ces formats se font souvent au poids du corps, mais aussi au kettlebell ou au wall ball. Une seule valeur de charge par mouvement (charge commune de l'Exercice, identique d'une série à l'autre), saisie au clavier (pavé décimal avec virgule) ; « (+ kg) » sur un mouvement sans charge, « (12 kg) » puis « (− kg) » pour la retirer (restauration temporaire dans le même brouillon selon §16 du complément du 5 novembre). Deux présentations :
- **Un seul mouvement** : une ligne **Charge** dans le cadre des paramètres, sous Durée totale.
- **Plusieurs mouvements** : un tableau par mouvement dans son propre cadre (§12 du complément du 5 novembre), sous les paramètres. L'Objectif est le travail par série de chaque mouvement (20 s en Tabata, 30 s en 30/30 ; modifiable au clavier, Répétitions ou Durée) ; la ligne commune « Travail par série » est retirée des paramètres. **30/30** : trois colonnes de valeurs, **Objectif | Pause | Charge** ; la ligne commune « Pause » est aussi retirée. **Tabata** : **Objectif | Pause | Charge** également (« 20 s », « 10 s ») ; la ligne commune « Pause » est retirée des paramètres. La colonne Charge n'apparaît que si « Avec charge » est activé (§16 du complément du 5 novembre).

**Écrans Figma :** « 30/30 — Récapitulatif », « P-Tabata — Récapitulatif, à la suite » et « … en alternance » : tableau Mouvement | Objectif | Pause | Charge, cette dernière colonne étant conditionnelle. Les lignes communes Travail par série et Pause sont retirées au profit des valeurs par mouvement. Le cas à un mouvement suit la règle décrite ci-dessus, même sans frame dédiée.

## 10. Application de la règle à l'EMOM

Champ propre au format, porté par l'exercice (Type d'exercice = EMOM) : **Intervalle** (1 min par défaut), qui remplace la Pause. Chaque série démarre au début d'un intervalle ; le repos est le temps restant jusqu'à l'intervalle suivant. Les paramètres standards compatibles restent applicables ; **Répétitions par défaut et Durée possible**, par Exercice et dans toutes les organisations. Un EMOM peut associer 10 burpees et 20 s de gainage dans chaque minute, ou un seul gainage de 40 s par minute. Les objectifs en Durée sont soumis au contrôle strict de l’intervalle du §7.6.

Paramètres du questionnaire : Nombre de séries (6), Intervalle (1 min) ; avec plusieurs mouvements, choix de l'Exécution : **Dans chaque intervalle | À la suite | En alternance**.

Exemple chiffré ci-dessous : 2 mouvements, 6 séries, intervalle 1 min, 10 répétitions par mouvement. Le mode et la cible restent propres à chaque Exercice ; les tableaux actuels montrent aussi un mélange 10 répétitions / 30 s.

| Exécution | Ce qui se passe | Structure créée | Paramétrage de chaque exercice | Durée |
|---|---|---|---|---|
| Un seul mouvement | Une série par intervalle | 1 exercice EMOM | Mode Répétitions ; Condition d’arrêt À l’objectif ; Séries « 6 séries identiques » ; Nombre de répétitions 10 ; Intervalle 1 min ; Durée de l'exercice 6 min ; Récupération 0 s | 6 min |
| **À la suite** | EMOM de A, récupération, EMOM de B | Circuit standard groupé, 1 tour ; Formats locaux EMOM | Comme ci-dessus ; Récupération entre les mouvements (1 min) sur le premier | 13 min |
| **En alternance** | Intervalle 1 : A, intervalle 2 : B… chacun fait ses 6 séries | Circuit standard : 6 tours, « alternées » | ~~Comme pour un seul mouvement~~ (remplacé le 07/11/2026, D-517 : N hérité, récupération absente, intervalle propre modifiable, durée calculée en lecture seule) | 12 min |
| **Dans chaque intervalle** | A puis B dans le même intervalle, repos jusqu'à l'intervalle suivant | Circuit **porteur du format** (Format d'origine = EMOM) : 6 tours, nature fixée « groupées », **Durée de chaque tour** = intervalle (1 min), modifiable | Mode Répétitions ; Nombre de répétitions 10 ; ~~ni Séries, ni Intervalle, ni Durée de l'exercice (portés par le circuit) ; Récupération 0 s~~ (remplacé le 07/11/2026, D-517 : régime local, N hérité ; aucun champ Intervalle, Durée de l’exercice ou Récupération) | 6 min |

« Dans chaque intervalle » est le seul cas EMOM où le circuit porte le format : l'intervalle englobe plusieurs exercices. Il réutilise le champ « Durée de chaque tour » du circuit, introduit pour l'AMRAP.

Écrans Figma : modales « EMOM — Modale exercice, standard » (~~valable pour un seul mouvement, à la suite et en alternance~~ (remplacé le 07/11/2026, D-517 : standard pour seul ou à la suite, variante dédiée en alternance)) et « EMOM — Modale exercice, dans chaque intervalle » ; séance « EMOM — Séance, circuit dans chaque intervalle ».

### Modale EMOM — décision du 07/11/2026 (D-517)

Chaque Exercice a son Mode (Répétitions par défaut ou Durée), ses Phases du mouvement (Avec/Sans) et sa cible chiffrée (Nombre de répétitions ou Objectif de durée). « À l’objectif » est sélectionné. « À l’échec » reste visible, grisé et non sélectionnable, y compris en séries variables. Charge Avec/Sans (une charge par série si activée), De chaque côté Avec/Sans et Cadence Autre/1 s/Sans restent disponibles. Aucune ligne Pause ni cellule Pause par série. Le repos occupe le reste de l’intervalle.

| Organisation | Séries (Variables ou identiques) | Intervalle | Durée de l’exercice | Récupération |
|---|---|---|---|---|
| Un mouvement | N modifiable | Propre, modifiable, 1 min par défaut | N × intervalle, en lecture seule sous Intervalle | Modifiable |
| À la suite (Circuit standard groupé, 1 tour) | N modifiable par Exercice | Propre, modifiable | Même calcul, même emplacement | Récupération entre les mouvements, 0 s sur le dernier à la création |
| En alternance (Circuit standard alterné) | N = tours, non modifiable ici | Propre, modifiable | Même calcul, même emplacement | Absente pour respecter le prochain top |
| Dans chaque intervalle (Circuit porteur EMOM groupé) | N = tours, non modifiable ici | Durée de tour du Circuit, aucun champ local | Absente | Absente |

Les règles génériques « Durée de l’exercice modifiable » et « À l’échec proposé » sont **remplacées pour EMOM le 07/11/2026** par les états ci-dessus. Références Figma : [standard 8795:14588](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8795-14588), [en alternance 11856:24719](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=11856-24719), [dans chaque intervalle 8598:30515](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8598-30515).

En Composition, la carte porte uniquement la prescription (« 6 × 10 rép. », « 10 · 12 · 14 rép. »). L’en-tête du Circuit porteur affiche « N tours · groupées » et la durée de tour en bleu, modifiable.

Le Nombre de séries garde le même sens qu’au Tabata (séries de chaque mouvement).

**EMOM — tableau et validation du 5 novembre.** Tableau Unité | S1…Sn, quatre colonnes visibles au plus, nom et unité fixes ; chaque série porte sa cible et sa charge. Pas de champ d’incrément d’objectif ni de charge. Création : ~~valeurs de S1 reprises initialement~~ **(remplacé le 06/11/2026 : chaque colonne se saisit indépendamment ; les cases non saisies restent à renseigner)** ; nouvelles séries ajoutées après coup à compléter selon les règles existantes ; réouverture sans réinitialisation. Pour chaque rang/fenêtre, travail connu en Durée incluant deux côtés et pause entre côtés applicable ; somme des membres dans un intervalle commun, intervalle local sinon. Atteinte ou dépassement de l’intervalle bloque la validation (message et cadres rouges), y compris après modification en Composition ; aucune durée inventée pour les membres en Répétitions.

**Validation du récapitulatif :** « Enregistrer dans la séance » n’est actif que si tous les paramètres requis sont renseignés et la configuration cohérente. Une cible à renseigner est signalée dans son cadre et bloque l’ajout ; un récapitulatif incomplet ne crée pas un Exercice « Paramètres à compléter » dans la Composition. Cet état reste possible après une modification ultérieure de Composition, notamment une entrée/sortie de Circuit ou de Format. Chaque case de tableau et la modale correspondante lisent et écrivent les mêmes champs standards de l’Exercice ; aucun second stockage. [06/11/2026 : action portée par la coche de l’en-tête de la modale, sans bouton en bas — D-499.]

**Contrôle EMOM des durées — seuil inclusif :** le travail prévu d’un Exercice en Durée est sa cible, multipliée par deux s’il est fait de chaque côté, plus la pause entre les côtés applicable. En simple, alternance et À la suite, travail prévu ≥ intervalle propre bloque la validation ; Dans chaque intervalle, somme du travail prévu des membres ≥ intervalle commun bloque la validation. Les membres en Répétitions contribuent pour 0 à ce contrôle de durée connue, sans garantie que le travail total tiendra dans la fenêtre. Message sous le tableau, cadres des valeurs concernées et de l’intervalle rouges ; validation bloquée dans le récapitulatif, la modale et lors de l’édition de l’intervalle du Circuit. À 60 s : 40 s d’un seul côté admis, 40 s de chaque côté refusés ; 30 s + 30 s refusés ; 10 répétitions + 30 s ne déclenche pas ce seul contrôle.

**Règle.** Le récapitulatif EMOM reprend le tableau de la Progression (§9 du complément du 5 novembre, §12 du complément du 5 novembre) : colonne **Unité** (« rép. » ou « durée », choisie au clavier), puis une colonne par série (**S1, S2, S3** ; 4 colonnes visibles au plus, défilement horizontal au-delà, nom et unité fixes). Le tableau est isolé dans son propre cadre.
- **Progression de l'EMOM** : ~~chaque série est préremplie avec la valeur de S1 (objectif fixe par défaut)~~ **(remplacé le 06/11/2026 : chaque colonne se saisit indépendamment ; les cases non saisies restent à renseigner)** ; l'utilisateur modifie les séries qui évoluent (« 3, 4, 5… soulevés de terre », « planche 20 s, 25 s, 30 s… »). Il n'y a pas de champ d'incrément.
- **Charge** : l'interrupteur « Avec charge » du questionnaire EMOM est conservé (il signale consciemment qu'une charge est à renseigner) ; activé, il fait apparaître le bouton « (+ kg) » / « (− kg) » sur chaque ligne ; la charge s'affiche en ligne sous l'objectif, une valeur par série (« (12 kg) »), comme en Progression.
- **Contrôle d’intervalle — bloquant.** Vérifier chaque série/fenêtre : travail prévu en Durée, deux côtés et pause entre côtés applicable compris, comparé à son intervalle. Dans chaque intervalle commun, sommer les travaux connus de tous les membres pour le rang concerné. Si le total atteint ou dépasse l’intervalle, afficher le message, les cadres rouges et bloquer la validation. Les membres en Répétitions ne reçoivent aucune estimation inventée. Ce contrôle s’applique aussi après modification depuis la Composition.

**Données.** Les objectifs et charges de chaque série sont les valeurs effectives de l’Exercice ; aucune formule d’incrément de charge EMOM n’est persistée ni réappliquée. Les diminutions de charge se saisissent directement dans les séries. Aucune mention de charge calculée nulle/négative ne s’applique.

**EMOM et Death by.** Les deux Formats partagent le principe de fenêtres temporelles, mais conservent leurs contrats distincts : compte fini et objectifs prescrits par série pour l’EMOM ; progression par rang, compte ouvert et fin au premier échec pour le Death by. Leur proximité ne justifie pas leur fusion.

**Écrans Figma :** « EMOM — Récapitulatif, dans chaque intervalle » (charge activée : Squats sautés 10 / 10 / 10 rép. « (+ kg) » ; Fentes avant 30 s × 3 à « (12 kg) » « (− kg) ») ; « … en alternance » et « … à la suite » (sans charge). L'écran « EMOM — Récapitulatif, saisie d'un incrément de charge négatif au clavier » est supprimé.

## 11. Application de la règle au For time

Principe : un volume fixé, le plus vite possible. Résultat : le temps réalisé ; en cas d'arrêt avant la fin (temps limite atteint ou arrêt par l'athlète), les tours (séries) et répétitions faits.

**Temps limite optionnel**, sans champ supplémentaire : un champ de durée existant devient soit une **borne** (temps limite saisi), soit une durée **mesurée** à l'exécution (pas de temps limite). La durée mesurée appartient au résultat de l'exécution (historique), pas à la composition de la séance.
- **Circuit** : sans temps limite, l'en-tête n'affiche aucune durée, seulement le libellé discret « Sans limite » (gris, tactile, ouvre la roulette de durée) ; avec un temps limite, il affiche « ≤ X min », modifiable. Tout exercice du circuit hérite de cette borne : sa Durée de l'exercice est affichée grisée (« Sans limite » ou « ≤ X min »).
- **Exercice seul** : le champ Durée de l'exercice est renommé **« Durée maximum du For time »**, modifiable, « Aucune » par défaut.

**Un seul exercice** — l'exercice porte le format (Type d'exercice = For time), champs standards :

| Champ | Valeur |
|---|---|
| Mode | Répétitions (Durée grisé) |
| Condition d'arrêt | À l’objectif (À l’échec grisé) |
| Séries | Nombre de tours : « 3 séries identiques », ou « Variables » pour le 21-15-9 (tableau standard des séries variables) |
| Nombre de répétitions | Volume de chaque série (21) |
| Pause | Repos entre les tours, 0 s |
| Durée maximum du For time | Champ Durée de l'exercice renommé : temps limite optionnel, « Aucune » par défaut ; s'il est saisi (ex. 15 min), il est lu comme un maximum |
| Cadence | Sans par défaut ; guidage facultatif, sans incidence sur les durées ni sur l’exécution du Format (§3) |
| Charge, De chaque côté | Inchangés |
| Récupération | 0 s |

**Plusieurs exercices, ou buy-in / buy-out** — le circuit porte le format (Format d'origine = For time) :

| Paramètre | Porté par | Champ / valeur |
|---|---|---|
| Nombre de tours | Circuit | Nombre de tours (3) |
| Temps limite | Circuit | Optionnel, porté par la durée du circuit : rien n'est affiché sans temps limite (libellé « Sans limite ») ; avec un temps limite, « ≤ X min », modifiable |
| Organisation | Circuit | Nature fixée à « alternées » : une série de chaque exercice à chaque tour, dans l'ordre ; le nombre de séries de chaque exercice est égal au nombre de tours |
| 21-15-9 | Exercice | Séries « Variables » : tableau standard des séries variables (21, 15, 9 ; pause 0 s) |
| Repos entre les tours | Circuit | Repos entre les tours, 0 s |
| Buy-in / buy-out | Exercice | Rôle explicite ; plusieurs membres par zone, exécutés une seule fois (§3) |
| Volume | Exercice | Séries identiques ou variables, cible de répétitions ou durée selon le Mode ; buy-in/out une seule exécution |
| Buy-in / buy-out : Séries | Exercice | Absentes : une seule exécution |
| Durée de l'exercice | Exercice | Héritée du circuit, grisée : « Sans limite » ou « ≤ X min » |
| Mode, Condition d’arrêt, Cadence | Exercice | Répétitions ou Durée, sous la garde du §3 ; À l’objectif ; Cadence Sans par défaut, guidage facultatif sans incidence sur les durées |
| Récupération | Exercice | 0 s |

**Adaptation à N — A6.** Dans le Circuit For time, les séries variables suivent le nombre de tours : à l’augmentation, conserver les séries existantes et ajouter les lignes manquantes à compléter ; à la diminution, retirer les lignes au-delà du nouveau N. Aucun volume n’est copié, extrapolé ou converti, et aucune confirmation de perte n’est demandée. Exemple : 21-15-9 passé à 4 tours donne 21-15-9-« à compléter » ; passé à 2 tours, 21-15. Les champs manquants sont contrôlés par la validation standard. Cette règle ne change pas l’échelle d’un For time autonome rejoué intégralement dans un Circuit standard groupé (§6.1).

**Pas de choix d'exécution** : l'alternance (A, B, puis A, B au tour suivant) est le fonctionnement même du For time à plusieurs tours ; « Dans chaque intervalle » n'a pas de sens (pas d'intervalle) ; « À la suite » revient à un For time d'un seul tour où chaque mouvement porte la somme de ses volumes (« chipper ») et se règle avec Nombre de tours = 1.

Écrans Figma : « For time — Modale exercice, standard », « For time — Séance, circuit avec buy-in et buy-out », « For time — Modale exercice, dans un circuit », « For time — Modale exercice, buy-in ou buy-out ».


## 12. Application de la règle au Death by

Principe : à chaque intervalle (1 min), le nombre de répétitions augmente (1, 2, 3…) ; on continue tant que l'athlète termine dans l'intervalle. Résultat : la dernière minute réussie (et les répétitions faites dans la minute manquée).

Paramètres du questionnaire : Intervalle (1 min), Objectif de départ (1), Incrément par intervalle (+ 1) ; Condition d'arrêt : à l'échec (fixe), avec arrêt avant un rang temporel incompatible. Avec plusieurs mouvements, Exécution : **À la suite | En alternance | Dans chaque intervalle**. À la suite correspond à des tests indépendants successifs ; les deux autres organisations coordonnent plusieurs mouvements dans un Circuit.

**Un seul mouvement** — l'exercice porte le format (Type d'exercice = Death by) :

Dans la modale « Paramètres d’exécution » de Death by, la condition d’arrêt standard « À l’échec » porte seule la fin de l’exercice. La ligne « Séries » est retirée. Le nombre de séries découle de l’échec. En mode Répétitions, la série de rang n (à partir de 1) demande le nombre de répétitions de départ augmenté de (n − 1) fois l’incrément par intervalle.

| Champ | Valeur |
|---|---|
| Mode | Répétitions (Durée grisé) |
| Condition d'arrêt | À l’échec, imposée (À l’objectif grisé) |
| Séries | ~~« Jusqu'à l'échec » (Variables grisé) : seule nouveauté, une valeur du champ Séries à la place d'un nombre~~. **Remplacé le 07/11/2026 (D-514).** Ligne retirée. |
| Nombre de répétitions | 1 (départ) |
| Incrément par intervalle | + 1 rép. par défaut, **au minimum + 1** (0 n'est pas proposé : ce serait un EMOM jusqu'à l'échec) — champ Incrément par tour de l'AMRAP |
| Intervalle | 1 min (champ de l'EMOM) |
| Cadence | « Sans » (autres valeurs grisées) |
| Durée de l'exercice | Absente : mesurée à l'exécution |
| Récupération | 0 s |

**Récapitulatifs Death by à plusieurs mouvements :** tableau « Mouvement | Départ | Incrément » juste sous Intervalle dans les trois organisations. Il remplace les lignes communes Nombre de répétitions et Incrément par intervalle ; chaque Exercice conserve son départ et son incrément ≥ +1 (exemples 1/+1 et 2/+2). Le cas à un mouvement conserve ses lignes. Présentation et alignement identiques au tableau EMOM ; pas de nouveau champ ni de stockage commun concurrent.

**Plusieurs mouvements :**
- **À la suite** : Circuit standard groupé à un tour dès deux Exercices Death by indépendants. Chacun porte son propre Format, son intervalle, son objectif initial et son incrément. L’échec termine cet Exercice ; sa récupération configurée s’exécute, puis le suivant démarre depuis ses propres valeurs initiales. Les résultats de ces tests sont distincts.
- **En alternance** : Circuit porteur du Format d’origine Death by, nature fixée « alternées », tours « jusqu’à l’échec ». A occupe un intervalle, puis B le suivant, puis A, B… ; chacun conserve sa progression par passage sur son mouvement, son objectif de départ, son incrément et son **Intervalle propre**, 1 min par défaut, modifiable dans sa modale. Le premier échec arrête le Circuit entier, puis la Séance poursuit les éléments suivants ; il ne met pas fin à toute la Séance ni au Cycle englobant. L’en-tête affiche exactement « Death by · jusqu’à l’échec · alternées », **sans durée** : un tour complet dure la somme des intervalles des membres, pas un intervalle commun. Les cartes montrent ~~« 1 → n rép. »~~ (remplacé le 07/11/2026 par « 1 rép. +1/min », D-516) dans l’exemple (`11411:20181`). Les intervalles locaux se succèdent ; ils ne sont pas fusionnés en horloge commune de tour.
- **Dans chaque intervalle** : circuit porteur du format (Format d'origine = Death by), nature fixée « groupées », Durée de chaque tour = intervalle (1 min), tours « jusqu'à l'échec » ; chaque exercice : Mode Répétitions ou Durée, Condition d'arrêt À l'échec, Objectif de départ 1 rép. ou valeur en Durée renseignée, Incrément par intervalle + 1, ni Séries, ni Intervalle, ni Durée de l'exercice ; Récupération 0 s. En-tête du circuit : « Death by · jusqu'à l'échec · groupées », intervalle en bleu, modifiable.

Écrans Figma : « Death by — Questionnaire », « Death by — Récapitulatif » (un mouvement), « Death by — Récapitulatif, dans chaque intervalle » et « Death by — Récapitulatif, en alternance » (deux mouvements, choix de l'Exécution ; le déroulé montre A et B dans la même minute, ou une minute sur deux), « Death by — Modale exercice, standard », « Death by — Séance, circuit dans chaque intervalle », « Death by — Modale exercice, dans chaque intervalle ». [06/11/2026 : l’écran « Death by — Récapitulatif » à un mouvement est renommé « Death by — Questionnaire, un mouvement » (`8624:30602`), conformément à la précision D-499.]

**Condition d’arrêt Death by.** À l’échec désigne la condition de fin du défi : ne pas accomplir l’objectif croissant dans l’intervalle. Le Objectif de départ et l’Incrément restent visibles et actifs. Ne pas appliquer le masquage de cible de l’Exercice standard à l’échec. Cette combinaison était déjà définie dans la base ; elle n’ajoute pas de nouveau contrôle. La Cadence Death by reste Sans : l’assouplissement du §3 concerne AMRAP et For time seulement.

Le récapitulatif « Death by — Récapitulatif, à la suite » (`11411:20474`) représente désormais les tests indépendants : Exécution À la suite, récupération entre mouvements réglable (1 min dans l’exemple), progression de A jusqu’à l’échec, bloc gris de récupération, puis progression de B depuis son départ initial. Le déroulé montre 1, 2, 3, 4, …, n pour chaque mouvement, avec hauteur croissante et légende Récupération. « Jusqu’à l’échec » est le repère de fin ; ce n’est pas une durée fixe calculée.

**Règle.** Chaque Exercice Death by peut être en Répétitions ou en Durée, sans restriction des mouvements sélectionnables : le Mode appartient à l’Exercice. Départ et Incrément portent cette unité (« 10 s », « + 10 s ») ; l’incrément vaut au minimum +1 répétition ou +1 s. Le changement d’unité ne convertit pas les valeurs et laisse les champs incompatibles à renseigner.

**Travail prévu d’un rang.** Pour un Exercice en Durée, il inclut les deux côtés et la pause entre côtés applicable. Dans un intervalle commun, c’est la somme des travaux connus des membres de la fenêtre ; à intervalles locaux, celui du membre. Les membres en Répétitions n’ont pas de durée déduite.

**À l’enregistrement.** Une progression en Durée finit toujours par atteindre l’intervalle : c’est la fin normale du défi, sans avertissement. Seul le cas où le **premier rang** atteint ou dépasse déjà l’intervalle déclenche un **avertissement non bloquant** : « Le premier intervalle ne peut pas être tenu : le défi s’arrêtera avant de commencer. » L’enregistrement reste possible. Le contrôle EMOM du §14 du complément du 5 novembre reste bloquant.

**À l’exécution.** Un rang dont le travail prévu connu atteint ou dépasse l’intervalle n’est pas lancé : le défi s’arrête à la fin du rang précédent. Même seuil que l’EMOM (atteint ou dépasse), appliqué à l’exécution plutôt qu’à la saisie. Sinon, la fin reste celle du Death by : la première fenêtre non tenue. Aucune fenêtre n’est prolongée.

**Résultat.** Rangs acquis = derniers rangs entièrement tenus. Fin par limite : mention « limite de l’intervalle atteinte », aucun échec ni tentative fictifs. Fin par fenêtre non tenue : pour un membre en Durée, la durée tenue est renseignée à la clôture, jamais déduite de l’objectif prescrit. Unités et côtés du résultat suivent la prescription.

**Documentation :** référence Formats §12 du complément du 5 novembre, règles métier, données/résultats, capacités et conception du moteur. Le libellé « Nombre de répétitions de départ » devient « Objectif de départ » ; la tagline et les textes doivent couvrir les deux modes et les intervalles configurables, sans imposer ici une nouvelle formulation graphique.

**Écrans Figma :** récapitulatifs Death by avec un exemple mixte Répétitions/Durée. L’avertissement du premier rang n’a pas d’écran dédié : il suit la présentation des messages du formulaire.

## 13. Sortie d'un format

Lorsqu'un exercice sort d'un circuit qui porte un format (AMRAP, For time, EMOM ou Death by en alternance ou dans chaque intervalle), ou lorsque l'utilisateur veut faire sortir de son format un exercice qui le porte lui-même, une confirmation propose deux options :

1. **« Conserver le format [nom du format] »** (option par défaut) : l’Exercice devient un Exercice formaté simple. Il reprend les paramètres compatibles de l’Exercice et ceux jusque-là portés par le Circuit ; les autres restent à renseigner dans la modale. Aucune conversion de valeur ni confirmation de perte supplémentaire.
   - Sortie d’un Circuit AMRAP → AMRAP simple en Répétitions ; durée d’un bloc reprise du Circuit (ex. 12 min). Si le membre était en Durée, aucune durée n’est convertie en répétitions : l’objectif de répétitions reste à renseigner ; les phases et autres paramètres compatibles sont conservés. Les phases chronométrées ne transforment pas la cible de l’AMRAP simple en Durée.
   - Sortie d'un circuit For time → For time simple ; Séries = nombre de tours, mêmes volumes.
   - Sortie d'un circuit EMOM « dans chaque intervalle » → EMOM simple ; Intervalle = durée de chaque tour, Séries = nombre de tours. Conserver les cibles et charges par série, initialiser la récupération à 0 s et recalculer la durée en lecture seule. Le choix Libre suit le point 2.
   - Sortie d’un Circuit Death by → Death by simple ; ~~Séries « Jusqu’à l’échec »,~~ **Remplacé le 07/11/2026 (D-514)** (aucune ligne Séries à rétablir). Nombre de répétitions et Incrément conservés. Dans chaque intervalle : Intervalle repris du Circuit. En alternance : Intervalle propre de l’Exercice conservé, sans reprise d’une durée de Circuit inexistante.
2. **« Adopter un format libre »** : l'exercice devient un exercice standard. Exception : un buy-in ou un buy-out sorti du circuit devient directement un exercice libre (section 6), sans cette confirmation. Le choix explicite du Format Libre reprend les paramètres compatibles et laisse les autres à compléter ; aucune conversion de durée en répétitions, aucun calcul arbitraire et aucune confirmation supplémentaire de perte. Ne pas promettre « aucune perte » pour tous les changements de prescription.

**Dialogue représenté** : « AMRAP — Séance, sortie d’un exercice du circuit (confirmation) » (`11410:20123`), composant « DSF / Overlays / Confirmation », variante Trois actions, sur fond voilé. Titre « Sortir du circuit AMRAP ? » ; exemple de message « Fentes avant devient un AMRAP simple de 12 min, ou un exercice libre sans incrément par tour. » Actions : **Conserver le format AMRAP** (principale bleue, choix par défaut), **Adopter un format libre** (secondaire), **Annuler**. Annuler conserve l’emplacement et les paramètres antérieurs. Le message varie selon le mouvement, le Format et les paramètres effectivement repris ; ce texte illustratif ne supprime pas les règles de compatibilité ou de champs à compléter.

**Circuits standards et réédition (D-518).** À la sortie d’un Circuit standard groupé ou alterné, l’EMOM simple conserve son format et son intervalle, sans dialogue. N redevient modifiable et la récupération revient à 0 s. Dans « Modifier le format », un changement d’exécution applique les règles de la structure d’arrivée (§6, §6.1 et §10). Conserver les paramètres compatibles, laisser les autres à compléter. Un transfert direct entre porteurs applique uniquement la règle d’entrée du destinataire.

Un exercice qui porte lui-même son format (EMOM, For time, AMRAP simple…) ne sort de rien : le passage au format libre est une action volontaire dans sa modale, jamais automatique. Un Circuit standard ne porte pas de Format, mais ses membres peuvent être formatés. Un EMOM en alternance et les Exercices formatés autonomes admis au §6.1 conservent leur Format en sortant d’un tel Circuit. Le Death by alterné porte désormais son Format au Circuit et suit le choix de sortie ci-dessus. La sortie ne les rend pas libres automatiquement ; le passage au Libre est une action volontaire distincte dans leur modale. Les Exercices issus du Tabata et des départs rapides standards sont, eux, déjà libres et ne nécessitent pas de choix de sortie de Format.

## 14. Synthèse des champs nouveaux

| Champ | Porté par | Valeurs | Utilisé par |
|---|---|---|---|
| Format d'origine | Circuit | AMRAP \| For time \| EMOM \| Death by ; vide pour un circuit standard ; hérité du questionnaire, non modifiable | Section 1 |
| Durée de chaque bloc | Circuit AMRAP | Durée, modifiable | AMRAP |
| Intervalle du Circuit / Durée de chaque tour | Circuit porteur EMOM ou Death by, organisation groupée uniquement | Durée commune, modifiable | EMOM et Death by dans chaque intervalle |
| Durée du circuit en borne | Circuit | « Sans limite » ou « ≤ X min » | For time |
| Nombre de tours « jusqu’à l’échec » | Circuit | Régime ouvert à la place d’un nombre fini | Death by dans chaque intervalle et en alternance |
| Incrément par tour (libellé « Incrément par intervalle » en Death by) | Exercice | AMRAP : ≥ 0 ; Death by : ≥ + 1 | AMRAP, Death by |
| Rôle dans le circuit | Exercice | Buy-in \| Tour \| Buy-out (For time) | Circuits AMRAP/For time (§3) |
| Nom du circuit | Circuit | Nom modifiable ; modèle par défaut, sinon Circuit | Tous Circuits (§7.8) |
| Modèle d’origine | Circuit | Modèle de création non modifiable, distinct du Format d’origine | Réouverture du parcours (§7.9) |
| Intervalle | Exercice | Durée (1 min par défaut), modifiable dans sa modale, remplace la Pause | EMOM autonome ou alterné ; Death by autonome ou membre du Circuit Death by alterné |
| Séries « Jusqu'à l'échec » | Exercice | ~~Valeur du champ Séries à la place d'un nombre~~. **Remplacé le 07/11/2026 (D-514).** Aucun paramètre de nombre de séries. | Death by |
| Durée maximum du For time | Exercice | Libellé de la Durée de l'exercice pour un For time simple ; « Aucune » par défaut | For time |

Champs propres au format qui restent sur un exercice qui porte lui-même son format :
- **Tabata** : aucun (champs standards) ;
- **AMRAP simple** : Incrément par tour ;
- **EMOM** : Intervalle ;
- **For time** : Durée maximum du For time ;
- **Death by** : Intervalle, Incrément par intervalle, ~~Séries « Jusqu'à l'échec »~~ (**Remplacé le 07/11/2026 (D-514)**, ligne retirée).

Les valeurs imposées par un Format restent visibles et grisées ; les valeurs initiales réglables ne sont pas des constantes imposées. Seuls les paramètres effectivement portés par le Circuit sont retirés de la saisie locale de l’Exercice ; l’Intervalle du Death by alterné reste local. Exception informative : le rappel de la borne For time (« Sans limite » ou « ≤ X min »), conservé grisé. Les préconfigurations Tabata et départs rapides restent modifiables (§9).

### 14.1 Bornes de saisie et valeurs calculées

Les bornes de saisie existantes restent inchangées pour les champs réutilisés de même sens. L’incrément AMRAP reste ≥ 0, celui du Death by ≥ 1. Aucune autorisation nouvelle de saisir un incrément hors borne n’est introduite.

Les objectifs calculés peuvent dépasser une borne de saisie sans plafonnement ni arrêt automatique : avec un départ à 90 et un incrément de 5, les objectifs peuvent être 90, 95, 100, 105… même si le champ manuel est limité à 100. La même distinction vaut pour le nombre ouvert de tours réalisés. Les protections techniques ne doivent ni tronquer silencieusement la progression ni devenir une condition de fin métier.

### 14.2 Points d’arrêt, pauses et horloges

Un Point d’arrêt interne ou une pause volontaire suspend l’exécution et les horloges du Format concerné. La reprise conserve la progression et le temps restant, sans remise à zéro. Une récupération programmée est une étape normale : elle suit les règles temporelles du Format ; en AMRAP, elle consomme le temps du bloc (§2.2).

### 14.3 Défauts de Format et défauts du Profil

Une valeur explicitement fournie ou imposée par le Format est distincte d’un défaut du Profil. Le fond orange avant première validation des paramètres reste réservé aux valeurs effectivement initialisées depuis le Profil. La récupération reste un paramètre de l’Exercice, affiché sans duplication dans la Composition et réglé dans sa modale ; aucun ajout par Pause / Ajouter un arrêt.

## 15. Déroulé

Le déroulé est une illustration dynamique : il n'est pas dessiné à la main mais **calculé à partir des paramètres**, avec les règles ci-dessous. Les écrans Figma cités servent de cas de recette : pour ces réglages, le rendu attendu est celui de l'écran.

**Données d'entrée** : la structure que l'enregistrement va créer (séries ou tours, intervalles, volumes, incrément, buy-in / buy-out, ordre des mouvements). Le déroulé ne définit pas une seconde prescription : il lit les mêmes valeurs que la Séance créée, avec les blocs AMRAP et tours de boucle distingués (§2.1). Le guidage de cadence facultatif ne change aucun calcul temporel.

**Mise à jour** : il se redessine à chaque réponse ou cellule modifiée, dans le questionnaire comme dans le récapitulatif. Le bas du cadre Déroulé se situe à **25 px** au-dessus du haut du bouton d’action sur les écrans de la rangée Formats qui le présentent ; le titre Déroulé suit son cadre. Respecter les Safe Areas et la visibilité sous clavier ; cette cote ne justifie pas de masquer le tableau actif.

**Règles de rendu :**

Pour un AMRAP à plusieurs blocs, le questionnaire représente la séquence des blocs et repos intercalés, avec sa durée totale configurée (3 × 12 min + 2 × 2 min = 40 min). Le déroulé des tours de boucle à l’intérieur d’un bloc reste ouvert et relève des règles suivantes. Ne pas confondre les blocs graphiques élémentaires de la frise et le compteur fonctionnel de blocs AMRAP.
1. **Un bloc par unité d'exécution** : une série (Tabata, 30/30, Renforcement, À l’échec), un intervalle (EMOM, Death by), un passage de mouvement dans un tour (AMRAP, For time). La représentation d’un For time sans mouvement reste différée avec B10.
2. **Libellé du bloc**, quand il a un sens : volume (« 10 », « 21 »), « max », « échec », « 50 · buy-in », numéro d'intervalle ou de tour (« 1 », « n »). Pas de libellé quand la largeur ne le permet pas (Tabata, EMOM à plusieurs mouvements).
3. **Hauteur** : constante lorsque le volume est constant ; proportionnelle au volume lorsqu’il varie d’un bloc à l’autre (Death by, For time 21-15-9, Progression).
4. **Couleur** : la représentation sans mouvement reste différée (B10) ; avec des mouvements, une nuance de la couleur du format par mouvement, et une légende dès deux mouvements. Le buy-in est dans une nuance plus foncée, avec texte blanc ; son bloc est plus large.
5. **Récupération entre mouvements** (exécution à la suite) : bloc neutre, dans la légende.
6. **Nombre de blocs** :
   - nombre connu (séries, tours, intervalles) : tous les blocs sont affichés, répartis sur toute la largeur ;
   - nombre ouvert (AMRAP : autant de tours que possible ; Death by : jusqu'à l'échec) : les premiers blocs, puis une case « … », puis le ou les derniers blocs (« n », ou « n-1, n » ; en alternance, un bloc « n » par mouvement). Le dernier bloc est aligné à droite.
7. **Repères de temps** : « 0 » à gauche ; à droite, selon le format :
   - durée totale quand elle est calculable (« 4 min », « 12 min », « 8 min 50 s » pour les deux Tabata À la suite du §9) ;
   - « ≥ X min » quand une partie dépend de l'exécution (temps de série non fixé) ;
   - « jusqu'à l'échec » (Death by) ;
   - « temps mesuré » (For time).

**Cas de recette (écrans Figma) :**

| Format | Écrans |
|---|---|
| Tabata | « P-Tabata — Questionnaire », « P-Tabata — Récapitulatif, à la suite », « P-Tabata — Récapitulatif, en alternance » |
| EMOM | « EMOM — Questionnaire », « EMOM — Récapitulatif, dans chaque intervalle », « … en alternance », « … à la suite » |
| AMRAP | « AMRAP — Questionnaire », « AMRAP — Questionnaire, plusieurs blocs » (`11410:20361`), « AMRAP — Récapitulatif, incrément et max », « AMRAP — Récapitulatif, buy-in et incrément » |
| Death by | « Death by — Questionnaire », « Death by — Questionnaire, un mouvement » (ancien « Death by — Récapitulatif »), « … dans chaque intervalle », « … en alternance », « Death by — Récapitulatif, à la suite » (`11411:20474`) |
| For time | « For time — Questionnaire », « For time — Récapitulatif » |
| Départs rapides | Questionnaires et récapitulatifs : « 30/30 — … », « Renforcement — … », « Superset — … », « Progression — … », « À l'échec — … » |

## 16. Inventaire Figma

Fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP » (`510:101`). Inventaire actualisé sur Figma le 3 novembre 2026 ; ce périmètre ne couvre pas les modifications hors du travail sur les Formats.

### 16.1 Écrans

**Rangée des formats (parcours de composition) :**

| Format | Écrans |
|---|---|
| Fenêtre des formats | « P-Formats — Choix du format, deux colonnes » (fenêtre sur fond voilé) |
| Tabata | « P-Tabata — Questionnaire », « … Questionnaire, saisie d'un mouvement », « … Choix des mouvements », « … Récapitulatif, à la suite », « … Récapitulatif, en alternance », « P-Tabata — Récapitulatif, fiche du mouvement (modale) » (`11472:20899`) |
| EMOM | « EMOM — Questionnaire », « … Récapitulatif, dans chaque intervalle », « … en alternance », « … à la suite » |
| AMRAP | « AMRAP — Questionnaire », « … Questionnaire, saisie d'un mouvement », « AMRAP — Questionnaire, plusieurs blocs » (`11410:20361`), « … Choix des mouvements », « … Choix du buy-in », « … Récapitulatif, incrément et max », « … Récapitulatif, suppression glissée », « … Récapitulatif, buy-in et incrément » |
| Death by | « Death by — Questionnaire », « … Récapitulatif », « … Récapitulatif, dans chaque intervalle », « … Récapitulatif, en alternance », « Death by — Récapitulatif, à la suite » (`11411:20474`) |
| For time | « For time — Questionnaire », « … Récapitulatif » |
| Départs rapides | Questionnaire et Récapitulatif de « 30/30 », « Renforcement », « Superset », « Progression », « À l'échec » |

**Rangée des modales et des séances :**

| Format | Écrans |
|---|---|
| Tabata | « Tabata — Modale exercice, standard », « … Séance, circuit en alternance », « … Modale exercice, en alternance » |
| EMOM | « EMOM — Modale exercice, standard », « … Séance, circuit dans chaque intervalle », « … Modale exercice, dans chaque intervalle » |
| AMRAP | « AMRAP — Séance, circuit avec buy-in », « … Modale exercice, buy-in », « … Modale exercice, dans un circuit », « … dans un circuit, durée à l'échec », « … Modale exercice simple, à la cible », « … simple, à l'échec (Max) », « AMRAP — Séance, sortie d’un exercice du circuit (confirmation) » (`11410:20123`) |
| Death by | « Death by — Modale exercice, standard », « … Séance, circuit dans chaque intervalle », « Death by — Séance, circuit en alternance » (`11411:20181`), « … Modale exercice, dans chaque intervalle » |
| For time | « For time — Modale exercice, standard », « … Séance, circuit avec buy-in et buy-out », « … Modale exercice, dans un circuit », « … Modale exercice, buy-in ou buy-out » |
| 30/30 | « 30/30 — Modale exercice » |

**Écran existant modifié :** « Composition séance — Créer (menu) » : option « Utiliser un format d'entraînement » (remplace « Utiliser une séance existante »), avec l'icône du menu « Créer un circuit » de l'écran archivé.

**Écrans retirés lors de la version antérieure :** « Gainage · Mobilité — Questionnaire » et « … Récapitulatif » ; écran de choix du format en trois colonnes.

**Complément du 2 novembre :** quatre écrans ajoutés, aucun écran supprimé à cette occasion. Les écrans suivants ont été décalés horizontalement ; leurs identifiants restent les références. Les suppressions mentionnées ci-dessus appartiennent à l’inventaire antérieur et ne sont pas de nouvelles suppressions du 2 novembre.

### 16.2 Composants

| Composant | Statut | Contenu |
|---|---|---|
| Carte — Mouvement sélectionné (Design system — Fondations) | Ajouté | Variantes Suppression = Possible \| Bloquée \| Aucune ; 370 × 52, photo 44 px ; nom puis zones corporelles précédées de la pastille, 12 px gris, sans description tronquée, dans Possible/Bloquée/Aucune ; pas de croix, suppression par glissement vers la gauche. Utilisé dans les questionnaires (résultats de saisie, variante Aucune) et les récapitulatifs |
| DSF / Navigation / En-tête fixe | Modifié | Variante Retour : halo blanc du bouton et courbure de la zone de contexte visibles (contenu non rogné) |
| DSF / Overlays / En-tête de modale | Réutilisé | Variante Sélection pour questionnaire (croix) et récapitulatif (icon/retour), titre centré Inter Semi Bold 18 ; fond transparent et trait masqué localement dans les Formats, fond blanc et trait conservés pour la Fiche du mouvement. Variantes Classification/Roulette conservées |
| Replier / déplier les piles | Réutilisé / adapté | Contrôle 34 × 34 à droite de la recherche, même gabarit et état inactif que Trier, cible tactile 44 × 44 |
| Effacer la recherche | Réutilisé | Dès qu’un texte est présent : pastille grise 20 px, cible tactile 44 × 44 |
| Valeur modifiable | Réutilisé | Variante État = Grisé pour les champs imposés par le format (Récupération du buy-in / buy-out, Durée de l'exercice héritée…) |
| Action glissée — Supprimer | Réutilisé | Modèle des actions glissées du catalogue des mouvements, appliqué à la suppression d'un mouvement dans le récapitulatif |
| Carte — Mouvement — Résultat | Référence | Rendu des résultats lors de la création d'un mouvement, repris pour la saisie d'un mouvement dans les questionnaires |
| Interrupteur, Radio | Réutilisés | Interrupteurs du questionnaire AMRAP (Buy-in, Volume croissant), colonne Max du récapitulatif |
| DSF / Overlays / Confirmation | Réutilisé | Variante Trois actions pour le choix de sortie AMRAP : Conserver le format AMRAP / Adopter un format libre / Annuler (`11410:20123`) |

**État visuel de référence :** questionnaires et récapitulatifs sont présentés en modale sur la Composition ; les trois états de choix des mouvements/buy-in restent dans cette modale. Nouvelle frame de consultation superposée `11472:20899`. Le nom visible derrière le voile appartient à la Composition, jamais au formulaire du Format. Tagline Death by : « Une répétition de plus à chaque minute. On continue tant qu’on termine dans la minute. »

### 16.3 Tokens

Aucun token ajouté. Couleurs saisies en dur, à transformer en tokens si le développement le juge utile :
- nuance foncée du buy-in dans le déroulé AMRAP (#7984C7, texte blanc) ;
- nuances de couleur par mouvement dans les déroulés (une par format, dérivées de la couleur du format) ;
- gris des blocs de récupération dans les déroulés (#D9DBE0).


**Références visuelles du 4 novembre :** nouveaux états de clavier AMRAP `11488:20964`, `11488:21171` ; Progression `11546:21334`, `11546:21502`, `11546:21672` ; actions Circuit `11515:21221`, `11515:21387`, `11515:21558`, `11551:21479` ; réédition Tabata `11551:21673`. Galerie et métadonnées de capture au chapitre 06. Les tours dessinés dans la frise AMRAP sont illustratifs, jamais une estimation de performance. À l’échec : aucune durée totale affichée au questionnaire ni au récapitulatif.

### Complément — incrément AMRAP signé

**Règle.** L’Incrément par tour AMRAP peut être négatif, en Répétitions ou en Durée, pour représenter une échelle descendante. Il s’affiche avec son signe (« − 1 rép. », « − 5 s »). Le Death by conserve un incrément positif, au minimum +1 dans l’unité choisie (§13 du complément du 5 novembre). L’EMOM n’a aucun champ d’incrément de charge ni d’objectif : ses valeurs sont saisies par série (§14 du complément du 5 novembre).

**Borne des objectifs calculés.** Lorsqu’une progression AMRAP descendante atteindrait zéro ou une valeur négative, l’objectif calculé est borné à 1 répétition ou 1 s. La boucle ne se termine pas à cette borne : 5, 3, 1, 1, 1… La borne s’applique aux objectifs de cette progression, sans modifier les règles générales des cibles nulles intentionnelles ni rendre actif un Exercice sauté. Aucun incrément n’est appliqué aux membres pour lesquels il est inactif (Buy-in ou À l’échec).

**Saisie du signe.** Sur le champ Incrément par tour, la barre du clavier natif comporte **± | Précédent | Suivant | Fermer**. ± inverse le signe ; la saisie respecte l’unité et les bornes du champ. Aucun clavier personnalisé n’est introduit.

**Écran Figma :** « AMRAP — Récapitulatif, saisie d’un incrément négatif au clavier ».

**Documentation :** référence Formats (AMRAP), ch10 (bornes des incréments), ch13 (barre du clavier).

### Complément — consultation de l’Exercice en Composition

**Règle.** Dans la Composition, **l'appui sur la carte** d'un Exercice ouvre ses Paramètres d'exécution (inchangé) ; **l'appui sur la photo** ouvre la **fiche de l'exercice**, en modale et **en lecture seule** :
- contenu de la fiche du mouvement : média, nom, catégorie, zones corporelles, niveau, description et phases du mouvement si elles existent ;
- section **« Dans cette séance »** : la synthèse des paramètres de cet Exercice : réutiliser la phrase générée pour les paramètres qu’elle couvre, et présenter la Récupération propre à l’Exercice sans modifier silencieusement les règles de cette phrase ;
- **aucun bouton Modifier** : la croix ramène à la Composition ; pour modifier, l'utilisateur touche la carte.

**Pourquoi.** Un geste, un rôle : la photo pour voir, la carte pour modifier. Un seul chemin de modification, donc un seul chemin de retour. Les phases restent lisibles au moment où l'on relit la séance (important en rééducation), avec ce qui est prévu dans cette séance. Même geste et même fiche que dans le questionnaire et le récapitulatif des Formats (§7.1 de la référence Formats), complétés du contexte de la Séance.

**Écran Figma :** « Composition séance — Fiche de l'exercice (modale) ».

**Documentation :** ch06 (Composition : appui sur la photo), ch13 (contrat de la fiche en lecture seule).

### Écart visuel restant — Death by, contrôle du 5 novembre

**PARTIELLEMENT CONFORME visuel.** Le récapitulatif `11376:20189` représente bien des membres en Répétitions et en Durée ; l’accroche reste formulée en répétitions et minutes. Elle doit couvrir les deux modes et l’intervalle configurable, selon le complément §13. Aucun nouveau texte graphique n’est arbitré ici. Les captures montrent l’état courant ; aucune modification Figma ni recette de l’application n’est déclarée.

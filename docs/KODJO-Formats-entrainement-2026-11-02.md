# Mise à jour des spécifications — Formats d'entraînement et portage du format par le circuit

**Référence active — mise à jour du 3 novembre 2026.** Décisions d’Hermann, contre-revue A1 à A7 et modifications des écrans du 3 novembre intégrées. [Source de la mise à jour](sources/formats-2026-11-03/KODJO-Mise-a-jour-ecrans-formats-2026-11-03(3).md). Remplace les prescriptions antérieures contradictoires sur le périmètre Formats et départs rapides. Les sources de baselines restent conservées hors dépôt ; les archives OpenSpec ne sont pas modifiées.

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

Tabata en alternance et EMOM en alternance créent des Circuits standards. Tabata, EMOM et Death by À la suite créent des Exercices successifs sans Circuit. Le Death by en alternance est un Circuit porteur du Format, au même titre que le Death by dans chaque intervalle (A2).

La documentation du dépôt examinée pour l’analyse (`main @ fce276fd`) exclut le Format du Circuit. La présente cible remplace cette règle dans les cas du tableau. L’état du code développé doit être vérifié séparément ; aucune conformité du code n’est déduite de ce document. À représenter dans la cible :

- le paramètre **Format d'origine** : AMRAP | For time | EMOM | Death by, vide pour un circuit standard. Il est hérité du questionnaire à l'enregistrement du format, n’est pas modifiable. Il fixe la nature applicable au Circuit selon le tableau, sans faire apparaître un nouveau type de conteneur. Il ne fait pas du circuit un nouveau type : il indique à l'application le libellé de l'en-tête (« AMRAP », « For time »…), la nature fixée, l'affichage de la ligne Passage et les paramètres compatibles à reprendre pour un Exercice qui entre ;
- la **Durée de chaque bloc** AMRAP et l’intervalle commun EMOM/Death by **dans chaque intervalle**, saisis et modifiables sur le Circuit porteur. Dans ces organisations groupées, un tour correspond à l’intervalle commun. En Death by **alterné**, chaque Exercice conserve son Intervalle, modifiable dans sa modale ; le Circuit n’affiche pas de durée. Un passage complet par les membres dure la somme de leurs intervalles, sans affichage trompeur d’un intervalle unique comme durée de tour ;
- la **nature du circuit**, fixée et non modifiable sur un circuit porteur d'un format (voir le tableau).

**Périmètre des modèles.** Quatre Formats spécialisés : AMRAP, EMOM, For time et Death by. Tabata et les cinq départs rapides (§9.2) sont des préconfigurations standards modifiables. Leur présence dans la même grille utilisateur ne crée pas six identités de Format dans le domaine. D-378 et FMT-01 sont remplacées sur cette classification.

**Identité et réglages.** Seul le paramètre Format d’origine est hérité du questionnaire et non modifiable. Les valeurs effectivement portées par le Circuit — durée de bloc/tour, compte fini applicable, intervalle commun en organisation groupée et temps limite — restent modifiables selon le Format. L’Intervalle du Death by alterné appartient à chaque Exercice et ne fait pas partie de ces valeurs de Circuit. Modifier une de ces valeurs ne retire pas le Format. La nature groupées/alternées reste fixée par le Format. Le régime « jusqu’à l’échec » du Death by ne devient pas un nombre fini de tours.

## 2. Correspondance des paramètres AMRAP

| Paramètre | Porté par | Champ / valeur |
|---|---|---|
| Durée | Exercice autonome : Durée de l’exercice — Circuit : Durée de chaque bloc | 12 min par défaut |
| Nombre de blocs AMRAP | Circuit | Nombre de blocs ; au-delà de 1, un Circuit est créé, même avec un seul mouvement |
| Repos entre deux blocs AMRAP | Circuit | Repos entre les blocs |
| Objectif par tour | Exercice | Nombre de répétitions (lu « par tour ») |
| Max | Exercice | Condition d'arrêt = À l'échec ; l'objectif et l'incrément sont masqués |
| Incrément | Exercice | Nouveau champ **Incrément par tour**, ≥ 0, mode Répétitions uniquement |
| Repos après chaque tour de boucle | Dernier Exercice de la boucle à l’enregistrement | Initialise sa Récupération ; les autres Exercices de boucle sont initialisés à 0 s ; buy-in fixé à 0 s |
| Buy-in | Exercice | Nouveau champ **Passage** : À chaque tour (standard, par défaut) \| Une fois (exception) |
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

## 3. Règles

- **AMRAP porté par un Exercice autonome** : Mode = Répétitions, la valeur Durée est désactivée. Un AMRAP à un seul membre organisé en Circuit suit les règles de membre du Circuit.
- **Exercice d'un circuit AMRAP** : Mode Répétitions ou Durée ; Condition d’arrêt À l’objectif ou À l'échec.
- **Passage = Une fois** n'est proposé que pour le premier exercice d'un circuit AMRAP (buy-in) et pour le premier ou le dernier exercice d'un circuit For time (buy-in, buy-out). L'exercice est fait une seule fois dans tout le circuit, et non à chaque tour ; en AMRAP, son exécution consomme uniquement la durée du premier bloc AMRAP. Il impose :
  - Mode = Répétitions ;
  - Condition d’arrêt = À l’objectif ;
  - pas d'incrément ;
  - Récupération = 0 s.
- **Affichage de la ligne Passage** : la ligne n'apparaît dans la modale que pour un exercice placé dans un Circuit porteur du Format AMRAP ou For time (« À chaque tour » par défaut). Elle est absente pour un exercice seul (AMRAP simple, For time simple) et pour un exercice d'un circuit standard (Tabata, EMOM…). Elle apparaît quand l'exercice entre dans un tel circuit (enregistrement du format ou ajout manuel) et disparaît quand il en sort.
- **Modale AMRAP** : réutiliser la Condition d’arrêt et les contrôles standards ; ajouter Incrément par tour et Passage lorsqu’ils s’appliquent ; pas de champ Séries. En Circuit, conserver la cible adaptée au mode (Nombre de répétitions ou Objectif de durée) ainsi que Charge, phases et côtés lorsqu’ils restent compatibles. L’AMRAP simple reste en Répétitions : des phases chronométrées ne transforment pas sa cible en Durée.
- **Cadence AMRAP et For time** : « Sans » par défaut ; guidage facultatif autorisé. Ce guidage n’a aucune incidence sur les calculs de durée, même estimée, les horloges globales, les objectifs, les transitions ou les conditions de fin. Il ne sert pas à déduire les répétitions réellement effectuées. La cadence n’est pas utilisée pour calculer une durée théorique de ces Formats.

## 4. Résultat

- Chaque bloc AMRAP possède son propre résultat : **tours de boucle complets + partiel du tour entamé**. Le rang de boucle et l’incrément redémarrent à chaque bloc.
- Le total des répétitions est calculé à partir de la séquence (volumes, incréments, buy-in) lorsque tous les exercices sont en répétitions.
- Les répétitions d'un exercice à l'échec sont saisies par l'utilisateur.

## 5. Affichage dans la séance

- En-tête du Circuit AMRAP : « AMRAP · N bloc(s) · groupées », avec la Durée de chaque bloc en bleu, modifiable. « 1 bloc » et « 3 blocs » désignent des efforts chronométrés ; « 7 tours » désigne le résultat de la boucle (§2.1).
- Exercice avec Passage = Une fois : la carte affiche « Buy-in » (premier exercice) ou « Buy-out » (dernier exercice) sur la troisième ligne, à la place de la récupération, aligné à droite. Le libellé est déduit de la position ; dans la modale, Passage garde la valeur « Une fois ». Règle valable pour l'AMRAP et le For time.

## 6. Ajout et retrait d'exercices dans un circuit porteur d'un format

Tout Exercice ajouté ou déplacé dans un Circuit porteur d’un Format suit les règles du Circuit d’arrivée. Il reprend ses paramètres compatibles ; les valeurs incompatibles ou ambiguës restent à renseigner. Aucun calcul de conversion arbitraire et aucune confirmation de perte ne sont ajoutés.

1. **Entrée d’un Exercice libre ou déjà formaté** :
   - conserver les valeurs directement compatibles avec la prescription d’arrivée ;
   - des séries à cible commune permettent de reprendre cette cible ; des séries à cibles différentes ou un mélange chiffré/échec ne donnent lieu ni à une somme, ni à une moyenne, ni au choix automatique d’une série : les champs concernés restent à renseigner ;
   - conserver la charge commune, les phases et les côtés compatibles ; si les charges ou d’autres paramètres varient de façon incompatible, les valeurs concernées restent à compléter ;
   - dans l’AMRAP en Circuit, conserver le mode Durée s’il est applicable et son Objectif de durée par passage ; la Durée globale propre de l’Exercice n’est plus portée localement ;
   - appliquer les valeurs imposées du Format d’arrivée ; initialiser Passage à À chaque tour et l’incrément à 0 si aucun incrément compatible n’est repris ;
   - compléter dans la modale existante, avec les contrôles habituels de validation. Pas de questionnaire de conversion supplémentaire et pas de confirmation de perte.
2. **Exercice sorti du Circuit** : choix de la section 13 entre « Conserver le format d’entraînement » et « Adopter un format d’entraînement libre ». Ce choix de destination reste présent ; aucune confirmation de perte supplémentaire.
3. **Exercice déjà formaté, de même Format ou d’un autre** : entrée autorisée selon le point 1. Les règles d’arrivée remplacent le contexte précédent sans imbriquer deux Formats.
4. **Buy-in et buy-out** (AMRAP et For time) :
   - ils ne sont pas réordonnables à l’intérieur du Circuit : buy-in en première position, buy-out en dernière ; aucun Exercice n’est inséré avant le buy-in ni après le buy-out ;
   - ils **ne peuvent pas être dupliqués**. Reprendre leur mouvement dans la boucle passe par un ajout volontaire normal, avec une prescription adaptée ;
   - Récupération fixée à 0 s, grisée ;
   - ils restent modifiables, remplaçables et supprimables selon leur parcours ;
   - ils peuvent sortir du Circuit : ils deviennent directement des Exercices libres, sans le choix de conservation de Format ; Passage disparaît, les paramètres compatibles restent et les autres sont à renseigner ;
   - le buy-in AMRAP consomme le temps du premier bloc uniquement. Sorti du Circuit et placé avant celui-ci, il se fait en amont et chaque bloc conserve sa durée complète.
5. **Paramètres applicables dans les Circuits porteurs d’un Format** :

| Circuit | Paramètres de l’Exercice | Paramètres portés par le Circuit / retirés de la saisie locale |
|---|---|---|
| AMRAP | Mode Répétitions ou Durée ; cible par passage ou À l’échec ; Incrément par tour en Répétitions ; Passage ; Récupération ; autres paramètres standards compatibles | Séries et durée globale ; l’Objectif de durée d’un passage reste local en mode Durée |
| For time | Mode Répétitions, Condition d’arrêt À l’objectif ; Séries identiques ou variables, nombre = nombre de tours ; Cadence facultative sans incidence sur les durées ; Passage ; Récupération initiale 0 s ; Durée de l’exercice héritée, grisée | Borne temporelle et compte du Circuit ; la borne reste rappelée en lecture seule, exception explicite au retrait (§11) |
| EMOM dans chaque intervalle | Mode Répétitions par défaut ou Durée, Condition d’arrêt, cible chiffrée propre au mode, Charge, Récupération initiale 0 s ; autres paramètres standards compatibles | Séries, Intervalle, Durée de l’exercice |
| Death by dans chaque intervalle | Mode Répétitions, Condition d’arrêt À l’échec, objectif de départ, Incrément par intervalle ≥ 1, Cadence Sans, Récupération initiale 0 s | Compte ouvert et intervalle commun du Circuit ; durée globale non portée localement |
| Death by en alternance | Mode Répétitions, Condition d’arrêt À l’échec, objectif de départ, Incrément par intervalle ≥ 1, **Intervalle propre modifiable dans la modale**, Cadence Sans, Récupération initiale 0 s | Identité Death by et compte ouvert au Circuit ; aucune durée dans son en-tête |

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
| EMOM | Admis ; bloc complet à chaque passage | Admis selon le cas du §10 ; compte de séries adapté au Circuit |
| Death by | Admis ; chaque nouvelle exécution repart du départ initial ; son échec termine uniquement l’exécution de ce membre, puis le Circuit poursuit | Refusé ; le Death by coordonné en alternance est créé par le questionnaire avec Format porté par le Circuit (§12) |
| Tabata et 30/30 préconfigurés | Règles des Exercices standards | Règles des Exercices standards ; aucune restriction Tabata N = 8 ni interdiction propre au 30/30 |

A5 conserve explicitement la matrice : il ne supprime donc pas l’admission groupée de l’AMRAP et du For time. La phrase justificative de la contre-revue qui suggère de les exclure ne remplace pas cette décision. Il n’y a pas de temps partagé entre ces blocs autonomes : le Circuit groupé les rejoue successivement.

**Dépose Death by — décision complémentaire d’Hermann :** un Death by autonome ne peut pas entrer dans un Circuit standard alterné. Aucun transfert de Format ni conversion du conteneur n’est réalisé. En Circuit standard groupé, chaque passage rejoue le Death by depuis ses réglages initiaux ; l’échec termine uniquement l’exécution de ce membre, puis l’organisation du Circuit se poursuit. Ce cas reste distinct du Death by alterné coordonné créé par le questionnaire, dont le Circuit porte le Format et s’arrête collectivement au premier échec. Cette décision clôt l’articulation A2/A5.

Une boucle AMRAP ou For time sans aucun membre Passage = À chaque tour est invalide, même si un buy-in ou buy-out subsiste. La Composition peut représenter une configuration à compléter ; D.4 la signale et bloque sa validation comme configuration complète, sans supprimer automatiquement le buy-in/buy-out (R09).

## 7. Parcours de composition

Écrans Figma de référence (page « Prototype MVP ») : rangée des formats, « AMRAP — … », et rangée des modales, « AMRAP — … ».

Entrée : Catalogue des séances → Créer → Composition de séance → menu Créer → « Utiliser un format d'entraînement » → fenêtre « Formats d'entraînement » → AMRAP → questionnaire.

Fenêtre « Formats d'entraînement » (écran « P-Formats — Choix du format, deux colonnes ») :
- le menu Créer s'efface ; la fenêtre s'affiche sur la composition de séance, sous le même fond voilé, avec une marge à gauche et à droite ; pas de barre de navigation ;
- titre « Formats d'entraînement » et croix de fermeture dans la fenêtre ; un tap sur le fond voilé ferme aussi la fenêtre et ramène à la composition ;
- tous les formats (formats spécifiques et départs rapides) s'affichent dans une seule grille sur deux colonnes, sans défilement et sans distinction visible : l'utilisateur choisit selon son objectif, la différence apparaît dans le questionnaire et les paramètres ;
- le choix ouvre le questionnaire en modale sur la Composition. Le questionnaire et le récapitulatif sont des **modales sur la Composition**, ouvertes par le bas, pleine largeur, sous le titre de Composition. Ils ne portent aucun champ ni bloc « Titre de séance » : le nom, l’Étiquette et les réglages de Séance restent dans la Composition derrière le voile. Le titre de la modale est le nom du Format. Le questionnaire se ferme par croix vers la Composition ; son bouton **« Valider les paramètres »** ouvre le récapitulatif sans ajouter de structure. Le récapitulatif revient au questionnaire par Retour avec réponses conservées ; **« Enregistrer dans la séance »** ajoute la structure au brouillon de Composition, sans sauvegarde définitive. Aucun changement de nom de Séance n’est déclenché par ces étapes.

Référence 402 × 874 : modale à y=95, pleine largeur, coins hauts 24 px, coins bas carrés, sans poignée. En-tête « DSF / Overlays / En-tête de modale », variante Sélection sans validation ; titre Inter Semi Bold 18 centré, croix au questionnaire et icon/retour au récapitulatif. Fond transparent et trait masqué uniquement dans ces modales Formats ; la Fiche du mouvement conserve fond blanc et trait. Zone de contexte 109 px depuis le haut de la modale, couleur et motif du Format ; tagline centrée 14/20 sur deux lignes. Bouton à y=802 de l’écran de référence et déroulé 25 px au-dessus. Contenu défilant, bouton en bas, clavier au premier plan ; ces cotes décrivent le rendu de référence, pas une hauteur fixe imposée à tous les appareils. Valeurs non modifiables et colonnes numériques alignées sur le texte des valeurs modifiables, avec un retrait de 10 px par rapport au bord droit de leur pastille.

Le menu Créer de la composition de séance propose :
- Créer un exercice → fiche d'exercice ;
- Utiliser des mouvements existants → modale Catalogue des mouvements ;
- Utiliser un format d'entraînement → fenêtre « Formats d'entraînement » (les formats libres « Un exercice » et « Une séance » n'y figurent plus), puis questionnaire du format ;
- Ajouter un circuit ; Ajouter un cycle.

Ce menu comporte cinq options, dans cet ordre. Il remplace MENU-FMT-01, ARB-05 dans sa portée sur les cartes Exercice/Séance et le départ Libre de la grille, ainsi que l’ancienne liste à quatre options. « Utiliser une séance existante » n’est plus proposée ici ; B.8 est développée et recettée selon Hermann le 02/11 ; la nouvelle liste de menu ne supprime pas son comportement livré. La fenêtre des Formats ne présente plus les cartes « Un exercice » / « Une séance ». Le comportement +/Annuler, l’axe et le voile du menu existant restent applicables.

Quel que soit le chemin emprunté, la validation de la séance ramène au Catalogue des séances, actualisé.

### 7.1 Questionnaire (« AMRAP — Questionnaire »)

Le questionnaire ne porte que les paramètres indépendants des mouvements.

- **Zone de contexte** : couleur et motif AMRAP, tagline sur deux lignes (« Douze minutes, autant de tours que vous pouvez. Aucun repos prescrit, on compte les tours. »).
- **Mouvements** : titre de section avec « + Ajouter », qui ouvre la saisie locale.
- **Ajout d’un mouvement** (tous Formats) : « + Ajouter » affiche un champ sous le titre, avec focus et clavier, et devient « Ouvrir le mode catalogue ». Le champ propose les Mouvements existants ; quitter une saisie vide referme le champ et rétablit « + Ajouter ». Les suggestions utilisent la petite carte « Carte — Mouvement sélectionné », variante Suppression=Aucune, avec filet des niveaux d’une famille. La carte montre nom et zones corporelles précédées de leur pastille (12 px gris), sans description tronquée. « Ouvrir le mode catalogue » reste dans la même modale de questionnaire : aucune navigation sortante ni modale de catalogue supplémentaire. La recherche reste visible avec le texte saisi et les résultats déjà filtrés ; croix d’effacement dès que le champ contient du texte. Filtrer, Trier et Replier / déplier les piles sont à droite sur la même ligne. Les petites cartes occupent la hauteur disponible jusqu’au bas de la modale, avec le filet des niveaux d’une famille, sans compteur « n familles · n mouvements ». « Ajouter » applique la sélection et referme ce mode ; « Fermer le mode catalogue » revient à la saisie sans ajouter de mouvement. La boucle permet la sélection multiple ; le buy-in, sous « Mouvement du buy-in », une sélection unique.
- **Fiche du mouvement** : Dans le questionnaire et le récapitulatif, toucher la **photo** d’une petite carte ouvre la **Fiche du mouvement** en consultation seule, en modale par-dessus celle du Format, sur un second voile. Apparition par le bas, pleine largeur, coins hauts arrondis 24 px ; en-tête croix et titre « Fiche du mouvement », fond blanc et trait conservés. Nom, catégorie, zones corporelles, niveau, média, description et phases habituels ; aucun bouton d’action. Fermer restitue exactement l’état du parcours sous-jacent. Toucher le reste de la carte conserve son comportement existant.
- **Paramètres d'exécution** :
  - Durée : 12 min ;
  - Nombre d’AMRAP : 1 (nombre de blocs) ;
  - Repos entre deux AMRAP : 2 min, affiché seulement si le Nombre d’AMRAP est supérieur à 1 ;
  - Repos après chaque tour de boucle : 0 s ; initialise la récupération du dernier membre (§2.2) ;
  - Buy-in : interrupteur, désactivé par défaut ;
  - Volume croissant à chaque tour : interrupteur, désactivé par défaut.
- **Déroulé** générique (cases 1, 2, 3… n), calé en bas de l'écran, au-dessus du bouton ; il réagit aux réponses.
- **Bouton** « Valider les paramètres » : ouvre le récapitulatif avec les réponses conservées, sans ajout à la Composition. « Enregistrer dans la séance » appartient au récapitulatif ; la sauvegarde définitive reste dans la Composition.
- **Sans mouvement — B10 en attente** : la représentation « Mouvement libre », les conditions de validation sans Mouvement et le lancement direct d’un minuteur ne sont pas validés dans cette révision. Ne pas implémenter la règle antérieure « toujours actif, même sans mouvement » ni une obligation nouvelle déduite de son retrait. Le parcours d’ajout avec des Mouvements et les validations existantes restent la base de travail ; le cas sans mouvement sera traité séparément.

**État plusieurs blocs** : écran « AMRAP — Questionnaire, plusieurs blocs » (`11410:20361`). Trois blocs de 12 min avec deux repos de 2 min : **40 min** au total. Le déroulé affiche Bloc 1, repos, Bloc 2, repos, Bloc 3 ; les repos sont gris et sans libellé dans la frise, les largeurs proportionnelles aux durées. Cet exemple représente les blocs configurés, pas les tours de boucle réalisés. La ligne de repos entre blocs est conditionnelle ; le Repos après chaque tour de boucle demeure un réglage distinct.

### 7.2 Choix des mouvements (« AMRAP — Choix des mouvements »)

État « mode catalogue » du questionnaire existant, sans modale distincte ; sélection multiple des mouvements de la boucle. « Ouvrir le mode catalogue » reste dans la même modale de questionnaire : aucune navigation sortante ni modale de catalogue supplémentaire. La recherche reste visible avec le texte saisi et les résultats déjà filtrés ; croix d’effacement dès que le champ contient du texte. Filtrer, Trier et Replier / déplier les piles sont à droite sur la même ligne. Les petites cartes occupent la hauteur disponible jusqu’au bas de la modale, avec le filet des niveaux d’une famille, sans compteur « n familles · n mouvements ». « Ajouter » applique la sélection et referme ce mode ; « Fermer le mode catalogue » revient à la saisie sans ajouter de mouvement. La boucle permet la sélection multiple ; le buy-in, sous « Mouvement du buy-in », une sélection unique.

### 7.3 Choix du buy-in (« AMRAP — Choix du buy-in »)

Affiché seulement si l’interrupteur Buy-in est activé. Mode catalogue dans la même modale, section « Mouvement du buy-in », sélection unique. « Ajouter » applique ce choix ; « Fermer le mode catalogue » revient sans ajout.

### 7.4 Récapitulatif (« AMRAP — Récapitulatif, incrément et max » et « AMRAP — Récapitulatif, buy-in et incrément »)

- **En-tête modal** : Retour vers le questionnaire avec réponses conservées, titre = nom du Format ; contexte et tagline selon §7. Aucun bloc ni champ de nom de Séance. Cette règle vaut pour tous les récapitulatifs des Formats et départs rapides.
- **Mouvements** : composant « Carte — Mouvement sélectionné » (photo 44 px, nom puis zones corporelles précédées de leur pastille en 12 px gris, sans description tronquée) ; suppression par glissement vers la gauche (voir ci-dessous).
  - Réordonnancement par appui long (norme de l'application).
  - Variante « Suppression = Bloquée » pour le dernier mouvement de la boucle.
  - Avec buy-in : section « Buy-in · une fois, au départ » avec « Changer », puis section « En boucle · dans le temps restant » avec « + Ajouter ». Sans buy-in : section « Mouvements » avec « + Ajouter ».
- **Paramètres d’exécution du récapitulatif** : Durée de chaque bloc (ou Durée de l’exercice si autonome), déjà prévue par la base. Nombre de blocs, Repos entre les blocs et Repos après chaque tour de boucle sont les réglages repris du questionnaire ; cette révision n’ajoute pas silencieusement des contrôles d’édition au récapitulatif. Aucun nouveau contrôle d’édition de ces autres réglages n’est ajouté ici ; le bouton Retour permet de les modifier au questionnaire, avec réponses conservées.
- **Tableau des mouvements** : colonnes Mouvement | Rép. | Par tour | Max.
  - Par tour : affichée seulement si le Volume croissant est activé.
  - Max (bouton radio) : exclusif avec Rép. ; activé, il masque et désactive les cases Rép. et Par tour, et renseigne la Condition d’arrêt À l’échec.
  - Ligne du buy-in : volume seul, ni Par tour ni Max.
- **Déroulé** : frise des tours (buy-in, puis alternance des mouvements de la boucle, valeurs croissantes, « max »), calé en bas de l'écran, au-dessus du bouton. Si le contenu dépasse, le contenu de la modale défile, le bouton reste en bas.
- **Bouton** « Enregistrer dans la séance » : crée l’Exercice ou le Circuit selon la section 1 dans le brouillon de Composition, sans sauvegarde définitive de la Séance à ce stade.

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
### 7.6 Tableaux, champs standards et contrôle du formulaire

**Validation du récapitulatif :** « Enregistrer dans la séance » n’est actif que si tous les paramètres requis sont renseignés et la configuration cohérente. Une cible à renseigner est signalée dans son cadre et bloque l’ajout ; un récapitulatif incomplet ne crée pas un Exercice « Paramètres à compléter » dans la Composition. Cet état reste possible après une modification ultérieure de Composition, notamment une entrée/sortie de Circuit ou de Format. Chaque case de tableau et la modale correspondante lisent et écrivent les mêmes champs standards de l’Exercice ; aucun second stockage.

| Tableau | Case | Champ standard de l’Exercice |
|---|---|---|
| EMOM | Mode Rép. / Durée | Mode d’exécution Répétitions / Durée |
| EMOM | Objectif en Rép. | Nombre de répétitions, cible chiffrée de chaque série |
| EMOM | Objectif en Durée | Objectif de durée de chaque série |
| Death by | Départ | Nombre de répétitions de départ |
| Death by | Incrément | Incrément par intervalle ≥ +1 |
| AMRAP | Rép. | Nombre de répétitions lu par tour |
| AMRAP | Par tour | Incrément par tour |
| AMRAP | Max | Condition d’arrêt À l’échec ; cases Rép. et Par tour masquées et inactives |
| Progression | Répétitions de série k | Cible de la série k dans les séries variables |
| Progression | Charge de série k | Charge de la série k, seulement si Charge de l’Exercice = Avec |

La complétude porte sur les champs requis applicables : les cases Rép. et Par tour masquées et inactives par Max ne constituent pas des cibles numériques manquantes. Une charge Sans ne rend pas ses valeurs inactives obligatoires.

**Initialisation :** valeurs initiales propres au Format à la création de la ligne : EMOM en Répétitions ; Death by départ 1 et incrément +1 ; Progression 10, 12, 14 pour ses trois séries initiales ; AMRAP selon le questionnaire. Les valeurs déjà saisies ne sont pas réinitialisées à chaque ouverture. Seuls les défauts effectivement repris du Profil gardent le fond orange jusqu’à la première validation (§14.3). Une nouvelle série supplémentaire de Progression reste à renseigner selon §9.3.

**Changement de mode EMOM :** le Mode appartient à chaque Exercice. Rép. → Durée ou Durée → Rép. rend l’objectif à renseigner dans la nouvelle unité, sans conversion numérique ni valeur déduite. Séries, charge, côtés et phases compatibles sont conservés ; la nouvelle cible doit être renseignée pour activer Enregistrer. Une modification depuis le tableau ou depuis la modale est immédiatement reflétée dans l’autre vue du même brouillon.

**Contrôle EMOM des durées — seuil inclusif :** en simple, alternance ou À la suite, bloquer si un objectif de durée est ≥ à l’Intervalle de cet Exercice ; Dans chaque intervalle, bloquer si la somme des objectifs de durée des membres est ≥ à l’intervalle commun. Les membres en Répétitions contribuent pour 0 à ce seul contrôle de durée connue : ni cadence ni phases ne servent à leur attribuer une durée ; cela ne signifie pas qu’ils ne réalisent aucun travail. Message explicatif sous le tableau, cadres des objectifs de durée concernés et de l’Intervalle sur fond rouge, validation désactivée tant que l’erreur subsiste. Le cas égal est refusé comme le dépassement. Même règle après l’ajout, dans la modale d’Exercice et lors de la modification d’intervalle depuis l’en-tête du Circuit : ne pas valider la modification incohérente. Une valeur candidate invalide peut être affichée dans la saisie, pas enregistrée comme configuration valide. Aucun changement de moteur ni nouveau champ de données.

Exemples de contrôle pour W=60 s : 40 s est admissible ; 60 s et 70 s sont refusés. Dans chaque intervalle : 20 s + 30 s est admissible ; 30 s + 30 s et 30 s + 40 s sont refusés ; 10 répétitions + 30 s ne déclenche pas ce contrôle (durée connue 30 s), sous réserve des autres validations. L’objectif absent n’est pas remplacé par zéro : il bloque déjà la validation du formulaire.

Le message peut être « Les durées atteignent ou dépassent l’intervalle de 1 min : il ne reste pas de temps pour le reste du travail ni pour le repos. » Il décrit la condition réelle, y compris l’égalité. Les durées de phase, pauses, récupérations et estimations des membres en Répétitions ne sont pas ajoutées silencieusement à la formule décidée, qui porte sur les objectifs de durée.

Ce contrôle de formulaire ne modifie pas les frontières temporelles du moteur. Le cas B10 sans Mouvement demeure différé ; aucune nouvelle règle de création sans Mouvement n’est déduite de l’activation conditionnelle du bouton.

## 8. Limite connue

Pas de mode Distance ni Calories pour l'instant. Leur ajout se fera par une valeur supplémentaire du Mode, qui reste exclusif car il pilote l'exécution, avec un impact limité. Les précisions descriptives (Charge, Hauteur, Distance descriptive) seront des attributs cumulables qui ne pilotent pas l'exécution.

## 9. Application de la règle au Tabata

Le Tabata se traduit entièrement en **exercices standards** et, avec plusieurs mouvements, en **circuit standard** : aucun paramètre propre au format n'est nécessaire, ni sur l'exercice ni sur le circuit. Le Tabata est un modèle de départ : le questionnaire et le récapitulatif calculent les valeurs des champs standards, que l'utilisateur peut ensuite modifier librement.

Paramètres du questionnaire : Nombre de séries (8), Travail par série (20 s), Pause (10 s) ; avec plusieurs mouvements, choix de l'Exécution : **À la suite | En alternance**.

Exemple ci-dessous : 2 mouvements, 8 séries, 20 s / 10 s.

| Exécution | Ce qui se passe | Structure créée | Paramétrage de chaque exercice (champs standards) | Durée |
|---|---|---|---|---|
| Un seul mouvement | Un Tabata | 1 exercice | Mode Durée ; Séries « 8 séries identiques » ; Objectif de durée 20 s ; Pause 10 s ; Durée de l'exercice 4 min ; Récupération 0 s | 4 min |
| **À la suite** | Tabata de A, récupération, Tabata de B | 2 exercices successifs, sans circuit | Mode Durée ; Séries « 8 séries identiques » ; Objectif de durée 20 s ; Pause 10 s ; Durée de l'exercice 4 min ; Récupération = récupération entre les mouvements (1 min) sur le premier, 0 s sur le dernier ; elle remplace la dernière Pause du premier Exercice | 8 min 50 s |
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

Les réglages et structures initiales déjà définis pour ces départs sont repris depuis leurs sources documentaires actuelles, sauf le Superset corrigé par A4 : deux mouvements choisis dans le questionnaire, puis Circuit standard groupé à un passage ; aucun emplacement vide. « Aucun Mouvement présélectionné » signifie aucun choix arbitraire avant la sélection de l’utilisateur, pas une création sans Mouvement. Renforcement reste à 3 séries × 15 répétitions ; Progression à 10 / 12 / 14 répétitions ; À l’échec à 3 séries à l’échec (D-24). Les réglages du Superset restent libres ; aucune cible chiffrée nouvelle n’est inventée. Progression utilise les séries variables standards ; À l’échec utilise les cibles à l’échec standards. Les noms d’écran du §16 ne constituent pas, à eux seuls, la définition de leurs paramètres initiaux.

### 9.3 Progression — tableau des séries et saisie directe

La Progression utilise les **séries variables standards** : répétitions et charge propres à chaque série et à chaque mouvement, sans champ nouveau.

- **Questionnaire** (`8656:35005`) : Nombre de séries, Pause et Durée totale. Aucune ligne globale « Répétitions par série · 10 · 12 · 14 » sans mouvement ; déroulé générique 1, 2, 3 avec hauteurs égales. Les valeurs par mouvement se règlent au récapitulatif.
- **Récapitulatif** (`8656:35062`) : tableau **Mouvement**, juste sous Nombre de séries et avant Pause, Durée totale et Exécution. Une ligne par mouvement, une colonne par série. Cadre blanc arrondi de rayon 8 dans le bloc gris, en-têtes gris, séparateurs fins et trait horizontal sous Nombre de séries. Hauteur de référence de l’écran : 874 px.
- **Charge** : aucun interrupteur global. Le réglage Avec/Sans appartient à chaque Exercice. Sans charge, la cellule présente les répétitions ; Avec, la charge se place sous les répétitions. Exemples illustratifs : Squats sautés 10/12/14 sans charge ; Fentes avant 12 à 10 kg, 10 à 12 kg, 8 à 14 kg. Les répétitions 10/12/14 sont les valeurs initiales des trois séries de chaque nouvelle ligne (§7.6), librement modifiables ; la séquence de Fentes et les charges de cet exemple ne constituent pas un autre défaut.
- **Saisie** : toucher une cellule ouvre le clavier sur cette cellule ; numérique pour les répétitions, décimal pour la charge (D-405). Suivant parcourt répétitions S1, charge S1 lorsqu’active, répétitions S2, etc. Le tableau reste visible au-dessus du clavier. La modale du mouvement reste accessible pour les autres paramètres, notamment Charge Avec/Sans. Le parcours série par série décrit ici est propre au tableau Progression ; les tableaux EMOM, Death by et AMRAP éditent leurs propres cases selon les contrôles standards et le §7.6.
- **Nombre de séries** : passer de 3 à 4 ajoute une colonne à compléter ; passer à 2 retire la dernière, sans confirmation de perte. Aucune valeur de répétitions ou charge n’est inventée pour la nouvelle colonne. La validation standard signale les champs obligatoires manquants.
- **Déroulé** : il lit le tableau courant, avec hauteurs proportionnelles aux répétitions ; la charge ne devient pas un facteur de calcul temporel. En-tête de tableau de référence 28 px, ligne avec charge 44 px, 12 px au-dessus du déroulé.

## 10. Application de la règle à l'EMOM

Champ propre au format, porté par l'exercice (Type d'exercice = EMOM) : **Intervalle** (1 min par défaut), qui remplace la Pause. Chaque série démarre au début d'un intervalle ; le repos est le temps restant jusqu'à l'intervalle suivant. Les paramètres standards compatibles restent applicables ; **Répétitions par défaut et Durée possible**, par Exercice et dans toutes les organisations. Un EMOM peut associer 10 burpees et 20 s de gainage dans chaque minute, ou un seul gainage de 40 s par minute. Les objectifs en Durée sont soumis au contrôle strict de l’intervalle du §7.6.

Paramètres du questionnaire : Nombre de séries (6), Intervalle (1 min) ; avec plusieurs mouvements, choix de l'Exécution : **Dans chaque intervalle | À la suite | En alternance**.

Exemple chiffré ci-dessous : 2 mouvements, 6 séries, intervalle 1 min, 10 répétitions par mouvement. Le mode et la cible restent propres à chaque Exercice ; les tableaux actuels montrent aussi un mélange 10 répétitions / 30 s.

| Exécution | Ce qui se passe | Structure créée | Paramétrage de chaque exercice | Durée |
|---|---|---|---|---|
| Un seul mouvement | Une série par intervalle | 1 exercice EMOM | Mode Répétitions ; Condition d’arrêt À l’objectif ; Séries « 6 séries identiques » ; Nombre de répétitions 10 ; Intervalle 1 min ; Durée de l'exercice 6 min ; Récupération 0 s | 6 min |
| **À la suite** | EMOM de A, récupération, EMOM de B | 2 exercices EMOM successifs | Comme ci-dessus ; Récupération entre les mouvements (1 min) sur le premier | 13 min |
| **En alternance** | Intervalle 1 : A, intervalle 2 : B… chacun fait ses 6 séries | Circuit standard : 6 tours, « alternées » | Comme pour un seul mouvement | 12 min |
| **Dans chaque intervalle** | A puis B dans le même intervalle, repos jusqu'à l'intervalle suivant | Circuit **porteur du format** (Format d'origine = EMOM) : 6 tours, nature fixée « groupées », **Durée de chaque tour** = intervalle (1 min), modifiable | Mode Répétitions ; Nombre de répétitions 10 ; ni Séries, ni Intervalle, ni Durée de l'exercice (portés par le circuit) ; Récupération 0 s | 6 min |

« Dans chaque intervalle » est le seul cas EMOM où le circuit porte le format : l'intervalle englobe plusieurs exercices. Il réutilise le champ « Durée de chaque tour » du circuit, introduit pour l'AMRAP.

Écrans Figma : modales « EMOM — Modale exercice, standard » (valable pour un seul mouvement, à la suite et en alternance) et « EMOM — Modale exercice, dans chaque intervalle » ; séance « EMOM — Séance, circuit dans chaque intervalle ».

Le Nombre de séries garde le même sens qu’au Tabata (séries de chaque mouvement).

**EMOM : Répétitions par défaut, Durée possible par Exercice**, y compris les mélanges dans un intervalle commun. Aux récapitulatifs multi-mouvements, tableau **Mouvement | Objectif | Mode** immédiatement sous Nombre de séries. Mode à droite, popover Rép. / Durée comme Exécution ; Objectif modifiable à sa gauche, « 10 » sans unité de répétitions, « 30 s » avec unité de durée. Champs Mode de largeur commune, champs Objectif de largeur commune et contenu centré. Changer le mode change celui de l’Exercice et laisse l’objectif à renseigner, sans conversion ni valeur inventée ; séries, charge, côtés et phases compatibles sont conservés. Retirer la ligne « Repos · jusqu’à la cadence » : le repos est le restant de fenêtre, pas un paramètre. Death by multi-mouvements : tableau **Mouvement | Départ | Incrément** sous Intervalle, valeurs propres à chaque Exercice et incrément ≥ +1 ; le cas à un mouvement conserve ses lignes.

**Validation du récapitulatif :** « Enregistrer dans la séance » n’est actif que si tous les paramètres requis sont renseignés et la configuration cohérente. Une cible à renseigner est signalée dans son cadre et bloque l’ajout ; un récapitulatif incomplet ne crée pas un Exercice « Paramètres à compléter » dans la Composition. Cet état reste possible après une modification ultérieure de Composition, notamment une entrée/sortie de Circuit ou de Format. Chaque case de tableau et la modale correspondante lisent et écrivent les mêmes champs standards de l’Exercice ; aucun second stockage.

**Contrôle EMOM des durées — seuil inclusif :** en simple, alternance ou À la suite, bloquer si un objectif de durée est ≥ à l’Intervalle de cet Exercice ; Dans chaque intervalle, bloquer si la somme des objectifs de durée des membres est ≥ à l’intervalle commun. Les membres en Répétitions contribuent pour 0 à ce seul contrôle de durée connue : ni cadence ni phases ne servent à leur attribuer une durée ; cela ne signifie pas qu’ils ne réalisent aucun travail. Message explicatif sous le tableau, cadres des objectifs de durée concernés et de l’Intervalle sur fond rouge, validation désactivée tant que l’erreur subsiste. Le cas égal est refusé comme le dépassement. Même règle après l’ajout, dans la modale d’Exercice et lors de la modification d’intervalle depuis l’en-tête du Circuit : ne pas valider la modification incohérente. Une valeur candidate invalide peut être affichée dans la saisie, pas enregistrée comme configuration valide. Aucun changement de moteur ni nouveau champ de données.

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
| Buy-in / buy-out | Exercice | Passage = Une fois, sur le premier / le dernier exercice |
| Volume | Exercice | Séries « N séries identiques » + Nombre de répétitions, ou Séries « Variables » |
| Buy-in / buy-out : Séries | Exercice | Absentes : une seule exécution |
| Durée de l'exercice | Exercice | Héritée du circuit, grisée : « Sans limite » ou « ≤ X min » |
| Mode, Condition d’arrêt, Cadence | Exercice | Répétitions, À l’objectif ; Cadence Sans par défaut, guidage facultatif sans incidence sur les durées |
| Récupération | Exercice | 0 s |

**Adaptation à N — A6.** Dans le Circuit For time, les séries variables suivent le nombre de tours : à l’augmentation, conserver les séries existantes et ajouter les lignes manquantes à compléter ; à la diminution, retirer les lignes au-delà du nouveau N. Aucun volume n’est copié, extrapolé ou converti, et aucune confirmation de perte n’est demandée. Exemple : 21-15-9 passé à 4 tours donne 21-15-9-« à compléter » ; passé à 2 tours, 21-15. Les champs manquants sont contrôlés par la validation standard. Cette règle ne change pas l’échelle d’un For time autonome rejoué intégralement dans un Circuit standard groupé (§6.1).

**Pas de choix d'exécution** : l'alternance (A, B, puis A, B au tour suivant) est le fonctionnement même du For time à plusieurs tours ; « Dans chaque intervalle » n'a pas de sens (pas d'intervalle) ; « À la suite » revient à un For time d'un seul tour où chaque mouvement porte la somme de ses volumes (« chipper ») et se règle avec Nombre de tours = 1.

Écrans Figma : « For time — Modale exercice, standard », « For time — Séance, circuit avec buy-in et buy-out », « For time — Modale exercice, dans un circuit », « For time — Modale exercice, buy-in ou buy-out ».


## 12. Application de la règle au Death by

Principe : à chaque intervalle (1 min), le nombre de répétitions augmente (1, 2, 3…) ; on continue tant que l'athlète termine dans l'intervalle. Résultat : la dernière minute réussie (et les répétitions faites dans la minute manquée).

Paramètres du questionnaire : Intervalle (1 min), Nombre de répétitions de départ (1), Incrément par intervalle (+ 1) ; Condition d'arrêt : à l'échec (fixe). Avec plusieurs mouvements, Exécution : **À la suite | En alternance | Dans chaque intervalle**. À la suite correspond à des tests indépendants successifs ; les deux autres organisations coordonnent plusieurs mouvements dans un Circuit.

**Un seul mouvement** — l'exercice porte le format (Type d'exercice = Death by) :

| Champ | Valeur |
|---|---|
| Mode | Répétitions (Durée grisé) |
| Condition d'arrêt | À l’échec, imposée (À l’objectif grisé) |
| Séries | **« Jusqu'à l'échec »** (Variables grisé) : seule nouveauté, une valeur du champ Séries à la place d'un nombre |
| Nombre de répétitions | 1 (départ) |
| Incrément par intervalle | + 1 rép. par défaut, **au minimum + 1** (0 n'est pas proposé : ce serait un EMOM jusqu'à l'échec) — champ Incrément par tour de l'AMRAP |
| Intervalle | 1 min (champ de l'EMOM) |
| Cadence | « Sans » (autres valeurs grisées) |
| Durée de l'exercice | Absente : mesurée à l'exécution |
| Récupération | 0 s |

**Récapitulatifs Death by à plusieurs mouvements :** tableau « Mouvement | Départ | Incrément » juste sous Intervalle dans les trois organisations. Il remplace les lignes communes Nombre de répétitions et Incrément par intervalle ; chaque Exercice conserve son départ et son incrément ≥ +1 (exemples 1/+1 et 2/+2). Le cas à un mouvement conserve ses lignes. Présentation et alignement identiques au tableau EMOM ; pas de nouveau champ ni de stockage commun concurrent.

**Plusieurs mouvements :**
- **À la suite** : Exercices Death by successifs, sans Circuit. Chacun porte son propre Format, son intervalle, son objectif initial et son incrément. L’échec termine cet Exercice ; sa récupération configurée s’exécute, puis le suivant démarre depuis ses propres valeurs initiales. Les résultats de ces tests sont distincts.
- **En alternance** : Circuit porteur du Format d’origine Death by, nature fixée « alternées », tours « jusqu’à l’échec ». A occupe un intervalle, puis B le suivant, puis A, B… ; chacun conserve sa progression par passage sur son mouvement, son objectif de départ, son incrément et son **Intervalle propre**, 1 min par défaut, modifiable dans sa modale. Le premier échec arrête le Circuit entier, puis la Séance poursuit les éléments suivants ; il ne met pas fin à toute la Séance ni au Cycle englobant. L’en-tête affiche exactement « Death by · jusqu’à l’échec · alternées », **sans durée** : un tour complet dure la somme des intervalles des membres, pas un intervalle commun. Les cartes montrent « 1 → n rép. » dans l’exemple (`11411:20181`). Les intervalles locaux se succèdent ; ils ne sont pas fusionnés en horloge commune de tour.
- **Dans chaque intervalle** : circuit porteur du format (Format d'origine = Death by), nature fixée « groupées », Durée de chaque tour = intervalle (1 min), tours « jusqu'à l'échec » ; chaque exercice : Mode Répétitions, Condition d'arrêt À l'échec, Nombre de répétitions 1, Incrément par intervalle + 1, ni Séries, ni Intervalle, ni Durée de l'exercice ; Récupération 0 s. En-tête du circuit : « Death by · jusqu'à l'échec · groupées », intervalle en bleu, modifiable.

Écrans Figma : « Death by — Questionnaire », « Death by — Récapitulatif » (un mouvement), « Death by — Récapitulatif, dans chaque intervalle » et « Death by — Récapitulatif, en alternance » (deux mouvements, choix de l'Exécution ; le déroulé montre A et B dans la même minute, ou une minute sur deux), « Death by — Modale exercice, standard », « Death by — Séance, circuit dans chaque intervalle », « Death by — Modale exercice, dans chaque intervalle ».

**Condition d’arrêt Death by.** À l’échec désigne la condition de fin du défi : ne pas accomplir l’objectif croissant dans l’intervalle. Le Nombre de répétitions de départ et l’Incrément restent visibles et actifs. Ne pas appliquer le masquage de cible de l’Exercice standard à l’échec. Cette combinaison était déjà définie dans la base ; elle n’ajoute pas de nouveau contrôle. La Cadence Death by reste Sans : l’assouplissement du §3 concerne AMRAP et For time seulement.

Le récapitulatif « Death by — Récapitulatif, à la suite » (`11411:20474`) représente désormais les tests indépendants : Exécution À la suite, récupération entre mouvements réglable (1 min dans l’exemple), progression de A jusqu’à l’échec, bloc gris de récupération, puis progression de B depuis son départ initial. Le déroulé montre 1, 2, 3, 4, …, n pour chaque mouvement, avec hauteur croissante et légende Récupération. « Jusqu’à l’échec » est le repère de fin ; ce n’est pas une durée fixe calculée.

## 13. Sortie d'un format

Lorsqu'un exercice sort d'un circuit qui porte un format (AMRAP, For time, EMOM ou Death by en alternance ou dans chaque intervalle), ou lorsque l'utilisateur veut faire sortir de son format un exercice qui le porte lui-même, une confirmation propose deux options :

1. **« Conserver le format [nom du format] »** (option par défaut) : l’Exercice devient un Exercice formaté simple. Il reprend les paramètres compatibles de l’Exercice et ceux jusque-là portés par le Circuit ; les autres restent à renseigner dans la modale. Aucune conversion de valeur ni confirmation de perte supplémentaire.
   - Sortie d’un Circuit AMRAP → AMRAP simple en Répétitions ; durée d’un bloc reprise du Circuit (ex. 12 min). Si le membre était en Durée, aucune durée n’est convertie en répétitions : l’objectif de répétitions reste à renseigner ; les phases et autres paramètres compatibles sont conservés. Les phases chronométrées ne transforment pas la cible de l’AMRAP simple en Durée.
   - Sortie d'un circuit For time → For time simple ; Séries = nombre de tours, mêmes volumes.
   - Sortie d'un circuit EMOM « dans chaque intervalle » → EMOM simple ; Intervalle = durée de chaque tour, Séries = nombre de tours.
   - Sortie d’un Circuit Death by → Death by simple ; Séries « Jusqu’à l’échec », Nombre de répétitions et Incrément conservés. Dans chaque intervalle : Intervalle repris du Circuit. En alternance : Intervalle propre de l’Exercice conservé, sans reprise d’une durée de Circuit inexistante.
2. **« Adopter un format libre »** : l'exercice devient un exercice standard. Exception : un buy-in ou un buy-out sorti du circuit devient directement un exercice libre (section 6), sans cette confirmation. Le choix explicite du Format Libre reprend les paramètres compatibles et laisse les autres à compléter ; aucune conversion de durée en répétitions, aucun calcul arbitraire et aucune confirmation supplémentaire de perte. Ne pas promettre « aucune perte » pour tous les changements de prescription.

**Dialogue représenté** : « AMRAP — Séance, sortie d’un exercice du circuit (confirmation) » (`11410:20123`), composant « DSF / Overlays / Confirmation », variante Trois actions, sur fond voilé. Titre « Sortir du circuit AMRAP ? » ; exemple de message « Fentes avant devient un AMRAP simple de 12 min, ou un exercice libre sans incrément par tour. » Actions : **Conserver le format AMRAP** (principale bleue, choix par défaut), **Adopter un format libre** (secondaire), **Annuler**. Annuler conserve l’emplacement et les paramètres antérieurs. Le message varie selon le mouvement, le Format et les paramètres effectivement repris ; ce texte illustratif ne supprime pas les règles de compatibilité ou de champs à compléter.

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
| Passage | Exercice | À chaque tour \| Une fois | Exercices d'un circuit AMRAP ou For time |
| Intervalle | Exercice | Durée (1 min par défaut), modifiable dans sa modale, remplace la Pause | EMOM autonome ou alterné ; Death by autonome ou membre du Circuit Death by alterné |
| Séries « Jusqu'à l'échec » | Exercice | Valeur du champ Séries à la place d'un nombre | Death by |
| Durée maximum du For time | Exercice | Libellé de la Durée de l'exercice pour un For time simple ; « Aucune » par défaut | For time |

Champs propres au format qui restent sur un exercice qui porte lui-même son format :
- **Tabata** : aucun (champs standards) ;
- **AMRAP simple** : Incrément par tour ;
- **EMOM** : Intervalle ;
- **For time** : Durée maximum du For time ;
- **Death by** : Intervalle, Incrément par intervalle, Séries « Jusqu'à l'échec ».

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
| Death by | « Death by — Questionnaire », « Death by — Récapitulatif », « … dans chaque intervalle », « … en alternance », « Death by — Récapitulatif, à la suite » (`11411:20474`) |
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

**État visuel du 3 novembre :** 13 questionnaires et 18 récapitulatifs de la rangée sont présentés en modale sur la Composition ; les trois états de choix des mouvements/buy-in restent dans cette modale. Nouvelle frame de consultation superposée `11472:20899`. Le nom visible derrière le voile appartient à la Composition, jamais au formulaire du Format. Tagline Death by : « Une répétition de plus à chaque minute. On continue tant qu’on termine dans la minute. »

### 16.3 Tokens

Aucun token ajouté. Couleurs saisies en dur, à transformer en tokens si le développement le juge utile :
- nuance foncée du buy-in dans le déroulé AMRAP (#7984C7, texte blanc) ;
- nuances de couleur par mouvement dans les déroulés (une par format, dérivées de la couleur du format) ;
- gris des blocs de récupération dans les déroulés (#D9DBE0).


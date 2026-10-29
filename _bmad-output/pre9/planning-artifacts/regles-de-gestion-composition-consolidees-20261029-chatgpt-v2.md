# PRE-9 — Règles de gestion de la composition avec Formats : version corrigée pour contre-revue (29/10/2026)

> **Objet.** Ce document rassemble toutes les décisions et règles de gestion arbitrées le 29/10/2026 pour la composition d'une séance avec des formats. Il les confronte à la documentation normative existante, pour repérer les contradictions à corriger. Il est destiné à une **revue indépendante** (ChatGPT) : il doit se lire seul.
>
> **Version de travail corrigée par ChatGPT pour contre-revue de Claude.** Source exacte : `fe8af6a5`. Cette version ne vaut pas nouveau arbitrage de Hermann et ne modifie ni plan, ni documentation normative, ni Figma. Le document d'origine reste inchangé.
>
> **Références.** Branche `docs/pre9-arbitrages-reponses-20261029`, commit `28dfbce5` ou plus récent. Documentation normative : `main`, commit `c73079e9`. Dans les citations, « ch10 » désigne le chapitre 10 « Processus métier et règles métier transverses », « ch13 » le chapitre 13 « Contrats d'écran », « ch05 » le chapitre 05 « Versions du produit ».
>
> **Qualification.** **[DÉCIDÉ]** : décision attribuée à Hermann, telle que retranscrite dans le document de réponses au même commit ; **[NORMATIF]** : règle effectivement contrôlée sur `main @ c73079e9` ; **[PROPOSÉ]** : mécanisme non expressément validé ; **[À CLARIFIER]** : effet non tranché ; **[NON VÉRIFIABLE]** : attribution ou absence de problème non démontrée par les sources examinées.

## 1. Décisions de Hermann du 29/10/2026

### 1.1 Structure de la séance

- **D-01 [DÉCIDÉ]** Une séance peut contenir plusieurs formats successifs, directement ou dans un cycle. Un cycle peut répéter une séquence comprenant plusieurs éléments formatés et libres.
- **D-02 [DÉCIDÉ]** Un format est porté par un **exercice** lorsque son organisation ne nécessite pas de circuit, et par un **circuit** lorsqu'elle en nécessite un. Un format posé sur un exercice seul n'est pas transféré automatiquement vers un circuit : le lien dans un circuit est un **choix de l'utilisateur**.
- **D-03 [DÉCIDÉ]** Le nom d'un circuit ou d'un exercice porteur reprend le nom du format.
- **D-04 [DÉCIDÉ]** Un cycle peut être créé en posant le conteneur sur un premier contenu, puis en y glissant d'autres contenus. Pas d'imbrication de circuit dans un circuit, ni de cycle dans un cycle.

### 1.2 Circuits

- **D-05 [DÉCIDÉ] Principes des circuits, validés le 29/10/2026 :**
  1. Un format appartient à l'élément qui le porte.
  2. Un circuit fixe son organisation (groupé ou alterné) et son nombre de tours. Il ne fixe jamais les paramètres propres de ses membres.
  3. Un élément qui entre dans un circuit prend son organisation et son nombre de tours, et garde ses propres paramètres. Si son nombre de tours est variable, il prend la valeur du circuit.
  4. Une entrée est refusée seulement si elle change la nature de l'élément.
  - **[NORMATIF / À CLARIFIER]** Le ch10 distingue le Circuit groupé (N répète un passage complet sans changer les séries des membres) du Circuit alterné (N impose le nombre actif de séries, avec adaptation et confirmation en cas de perte). « Garde ses paramètres » ne signifie donc pas conservation inconditionnelle d'un nombre de séries différent de N. Les contraintes intrinsèques du Format et les conflits de Formats doivent rester contrôlés ; ces quatre principes ne suffisent pas à les résoudre.
- **D-06 [NON VÉRIFIABLE comme décision explicite]** Un Circuit formaté figerait son organisation et tout paramètre dont la modification dénaturerait le Format. FMT-09 précise seulement qu'un Format **peut** imposer une organisation. **[À CLARIFIER]** Identifier la source de validation et la liste des paramètres figés Format par Format ; ne pas généraliser.
- **D-07 [DÉCIDÉ + NORMATIF, portée précisée]** Un élément entrant dans un Circuit **alterné** conserve son **régime** et ses paramètres intrinsèques compatibles ; son exemplaire actif est adapté au nombre de séries N du Circuit. Confirmation si des valeurs sont perdues ; à la sortie, le nombre actif et les valeurs actuelles sont conservés. Les règles de réserve temporaire du brouillon et d'annulation restent applicables. **[À CLARIFIER]** Aucun ajustement ne doit violer une constante imposée ; distinguer simple dépose et adoption volontaire d'un Format.
- **D-08 [DÉCIDÉ]** Un circuit **groupé** répète le passage complet de chacun de ses membres, selon son compte. Il ne modifie pas le nombre de séries de ses membres.
- **D-09 [DÉCIDÉ]** Une confirmation est demandée seulement si au moins un exercice perd des valeurs.
- **D-10 [DÉCIDÉ]** Insertion d'un circuit formaté par l'entrée « Format » : il est inséré immédiatement après le circuit qui contient le dernier exercice entré, dans le même parent (cycle si le circuit en fait partie, niveau séance sinon).
- **D-11 [DÉCIDÉ]** L'utilisateur qui ajoute un format déjà présent dans la séance choisit entre **ajouter au circuit formaté existant** et **créer un nouveau circuit**. Le graphisme relève de Figma.

### 1.3 Ajout d'exercices à un format existant

- **D-12 [DÉCIDÉ, mécanisme à raccorder]** Le second Exercice **ajouté volontairement au Format** adopte ce Format ; confirmation avant remplacement de valeurs renseignées, nombre de tours conservé. **[À CLARIFIER]** Le geste et le niveau qui matérialisent cette adoption doivent être distingués d'une simple dépose d'Exercice déjà formaté (D-02/D-05/D-26 : pas de transfert automatique).
- **D-13 [DÉCIDÉ]** Le sélecteur d'organisation (Par exercice / En alternance) est proposé à l'arrivée du second exercice pour Tabata, EMOM et Progression. Il est exclu pour For time.

### 1.4 Formats

- **D-14 [DÉCIDÉ] Valeurs initiales** : Tabata 8 séries, 20 s, 10 s (imposés). 30/30 : 6 séries (constantes 30 s / 30 s imposées). EMOM : fenêtre 60 s, 6 tours. AMRAP : 12:00. For time : échelle 21 · 15 · 9. Death by : départ 1, incrément 1, fenêtre 1 min. Ces valeurs sont modifiables, sauf celles qu'un format impose.
- **D-15 [DÉCIDÉ] Circuit groupé** : admis pour les six formats.
  - Tabata et 30/30 : chaque passage exécute ses séries et ses pauses.
  - EMOM : chaque passage est un bloc complet ; la durée totale est la somme des blocs.
  - For time : chaque passage exécute l'échelle complète depuis 21 ; le temps de chaque passage est enregistré ; le total est la somme.
  - AMRAP : chaque répétition utilise **la durée réglée de son bloc**, initialement proposée à 12:00 (D-14), sans échéance commune fusionnant les répétitions.
  - Death by : arrêter l'exercice met fin à cet élément seulement ; le bloc suivant se lance automatiquement, avec sa récupération et ses points d'arrêt.
- **D-16 [DÉCIDÉ] Circuit alterné** :
  - Tabata : admis si N = 8, refusé sinon.
  - 30/30 : refusé, son organisation alternée n'est pas décrite.
  - EMOM : admis ; le nombre de tours prend la valeur N, réglable ; confirmation si une valeur est perdue.
  - For time : refusé, son organisation alternée est exclue.
  - AMRAP : refusé, aucun nombre de séries à contraindre.
  - Death by : **admis fonctionnellement**, chaque Death by avec sa référence temporelle propre, active pendant ses minutes dans l'alternance ; arrêter un Death by ne met fin qu'à lui. **[À CLARIFIER pour l'exécution]** Articulation de N du Circuit avec rangs, fenêtres, membres arrêtés et changement de bloc (ch05 R-03).
- **D-17 [DÉCIDÉ] Un cycle répète la séquence entière**, y compris les éléments formatés. Un circuit répète les passages de ses membres selon son compte. Le nombre de répétitions d'un cycle ne remplace jamais le nombre de séries d'un circuit.

### 1.5 Exécution

- **D-18 [DÉCIDÉ] Arrêt d'un Death by** : il met fin à l'élément en cours, non à la séance. Le bloc suivant se lance automatiquement.
- **D-19 [DÉCIDÉ] Appui « tour terminé »** (AMRAP et For time) : calqué sur le Death by. Un appui acquiert un tour ; un seul appui par tour ; un tour inachevé n'est pas compté.
- **D-20 [DÉCIDÉ] Tour partiel de l'AMRAP** : au terme du temps, les répétitions réalisées du tour inachevé sont saisies dans la modale des répétitions partielles, avec 0 par défaut.
- **D-21 [DÉCIDÉ] Plafond de temps du For time** : optionnel, il sert en général à la sécurité. Quand il est atteint, l'exercice s'arrête. Le For time arrêté par son plafond est présenté comme incomplet, comme le Death by arrêté par « Limite atteinte ».

### 1.6 Départs rapides

- **D-22 [DÉCIDÉ]** Aucun exercice n'est proposé par défaut : l'utilisateur choisit les exercices au moment du format.
- **D-23 [DÉCIDÉ]** Les réglages proposés par défaut sont ceux qui définissent le format.
- **D-24 [DÉCIDÉ]** Valeurs confirmées : Renforcement 3 séries de 15 répétitions ; Progression 10, 12, puis 14 répétitions ; À l'échec 3 séries à l'échec ; Superset circuit groupé d'un tour, avec deux exercices vides, réglages libres.
- **D-25 [DÉCIDÉ]** Le départ Gainage · Mobilité est **supprimé**.

### 1.7 Décisions qui remplacent des formulations antérieures

- **D-26 [DÉCIDÉ] Remplace ARB-24** sur les valeurs imposées d'un circuit formaté : elles ne sont plus appliquées à l'exercice qui entre (D-05).
- **D-27 [DÉCIDÉ] Précise ARB-03** : un format est porté par un circuit si l'utilisateur place ses exercices dans ce circuit. Il n'y a pas de transfert automatique (D-02).
- **D-28 [DÉCIDÉ] Précise ARB-25** : voir D-17.
- **D-29 [DÉCIDÉ : admission fonctionnelle ; À CLARIFIER : exécution]** D-16 autorise le Death by en Circuit alterné. R-03 (ch05) continue de demander le raccordement des rangs, fenêtres, changements d'Exercice et incréments. La formule « aucun blocage technique identifié » n'est pas démontrée par les sources examinées ; ne pas déclarer le moteur qualifié.

## 2. Règles de gestion consolidées

### 2.1 Les six Formats — matrice de compatibilité corrigée

**Lecture :** D-15/D-16 décident l'admission dans un Circuit groupé ou alterné. Les valeurs initiales viennent de D-14 ; les constantes, les sélecteurs et la propriété du Format viennent des FMT et de D-02. Un Format peut être porté par un Exercice seul ou par un Circuit choisi ; ne pas transformer « peut » en « toujours ». La présence simultanée d'un Format sur le Circuit et sur un membre reste **À CLARIFIER**.

| Format | Constantes / contraintes imposées | Valeurs initiales modifiables | Groupé (D-15) | Alterné (D-16) | Sélecteur propre au Format |
|---|---|---|---|---|---|
| Tabata | 8 séries/Exercice ; 20 s effort ; 10 s pause | Aucune cadence réglable | Admis : bloc entier par passage | Admis si N = 8, sinon refus | Oui, FMT-11 |
| 30/30 | 30 s effort / 30 s pause | 6 séries | Admis : bloc entier par passage | Refusé | Aucun sélecteur propre décidé par FMT-19 |
| EMOM | Fenêtres cadencées et durée calculée, sans nombre numérique imposé | W = 60 s, N = 6 | Admis : bloc entier par passage | Admis avec adaptation de N ; interaction avec FMT-22 **À CLARIFIER** | Oui, FMT-20 |
| For time | Échelle indexée par tour ; pas de sélecteur d'organisation | 21 · 15 · 9 | Admis : échelle complète par passage | Refusé | Non, FMT-31 |
| AMRAP | Borne temporelle du bloc, tours réalisés = résultat | Durée 12:00 | Admis, durée configurée par bloc | Refusé | Non |
| Death by | Progression par fenêtres/rangs, acquisition déclarée | Départ 1, incrément 1, W = 1 min | Admis fonctionnellement | Admis fonctionnellement ; raccordement temporel **À CLARIFIER** | Pas de sélecteur autonome défini ; dépose alternée autorisée |

Les **12 cellules Groupé / Alterné** reproduisent les choix D-15/D-16. Les autres cellules ne doivent pas être présentées comme découlant de ces deux seules décisions.

**Réserve structurelle :** si un Circuit porte déjà un Format, il reste à distinguer compatibilité des contraintes, adoption volontaire du Format par un membre, coexistence éventuelle de Formats et conservation à la sortie. Aucune règle de priorité ni de transfert n'est inventée ici.

### 2.2 Départs rapides

| Départ | Contenu |
|---|---|
| Renforcement | 3 × 15 |
| Progression | 10 · 12 · 14 |
| À l'échec | 3 séries à l'échec |
| Superset | Circuit groupé d'un tour, deux **emplacements d'Exercices vides** ; aucun Mouvement présélectionné |
| Libre | séance vide |
| Gainage · Mobilité | **supprimé** (D-25) |

### 2.3 Exécution — décisions et raccordements à réaliser

| Sujet | Décision existante | Cas non entièrement définis |
|---|---|---|
| Tour terminé AMRAP / For time | Un appui acquiert un tour, au plus une fois ; tour inachevé non acquis (D-19) | Si le tour comprend plusieurs Exercices, déclenchement exact et rattachement des volumes **À CLARIFIER** |
| Tour partiel AMRAP | Au terme du bloc, modale de répétitions réellement réalisées avec 0 proposé (D-20) | Répartition d'un tour partiel entre Exercices et côtés **À CLARIFIER** |
| AMRAP répété | Chaque passage est borné par la durée **configurée**, initialement 12:00 (D-14/D-15) | Reprise, résultat par passage, agrégation |
| Plafond For time | Facultatif ; atteinte entraîne arrêt et résultat incomplet (D-21) | Tour en cours, volume acquis, continuation dans une Séance multi-Formats, arrêt volontaire |
| Arrêt Death by | Termine l'élément, pas la Séance, puis enchaînement (D-18) | Dernier membre d'un Circuit alterné, N, fenêtres, récupération et points d'arrêt |
| Partiels Death by | FMT-36 : sans appui, fenêtre non acquise ; **FMT-37/38 prévoient déjà** des répétitions partielles à la clôture, 0 proposé | Déclencheur différent de l'AMRAP ; mutualisation technique éventuelle, non imposée |
| Fenêtres et commandes | FMT-23–25/33–38 et RM-066–070 demeurent applicables dans leur périmètre | Pause, reprise, arrière-plan, réinitialisation, bilatéralité : réserves ch05 |
| Résultats d'exécution | Motif, résultat acquis et achèvement distincts lorsqu'ils ont une utilité | Agrégation par Exercice/Format/Séance et répétitions : PRE-10/11 |

**Séparation de périmètre :** PRE-9 configure les Formats et prépare leur contrat. Ces cas n'ont pas à être implémentés avant les stories d'exécution correspondantes, et ne bloquent pas les travaux de Composition indépendants.

## 3. Analyse de cohérence avec la documentation normative

Chaque ligne indique le texte normatif concerné, le conflit, et l'action proposée. **Aucune action n'a été appliquée.**

| # | Texte normatif | Conflit avec les décisions | Action proposée |
|---|---|---|---|
| C-01 | ch10 FMT-26 : « Le circuit est répété jusqu'à l'échéance globale » | Contredit D-15 (AMRAP : chaque répétition dure 12 minutes, sans limite globale). | **Annoter comme remplacé** sur ce point, texte d'origine conservé (classe B). |
| C-02 | ch10 FMT-28 et FMT-02 : listent « Gainage · Mobilité » parmi les départs | Contredit D-25. | **Annoter** : retirer Gainage · Mobilité de la liste, texte d'origine conservé. |
| C-03 | ch10 FMT-21 : durée EMOM = tours × exercices × fenêtre | Ne dit pas comment se compte la durée d'un EMOM répété dans un circuit groupé (D-15 : somme des blocs). | **Compléter** : durée d'un bloc = tours × exercices × fenêtre, répétée par passage. Lecture cohérente, mais la règle doit le dire. |
| C-04 | ch10 FMT-34 : « met fin à la séance » | Déjà annoté et aligné sur D-18 (commit `990542fd`). | Aucune action. |
| C-05 | ch10 FMT-31 et FMT-32 : pas de sélecteur d'organisation pour For time ; échelle indexée par tour | Cohérent avec D-13 et D-15. | Aucune action. |
| C-06 | ch05 R-03 : Death by à plusieurs exercices « doit être explicitement raccordé » | Levé pour le circuit alterné (D-29). Le texte de R-03 n'est pas mis à jour. | **Annoter** : raccordé pour le circuit alterné, par D-16 et D-29. |
| C-07 | ch10 : pas de limite de temps du For time dans les sources | Le plafond est décidé (D-21). | **Ajouter** la règle de plafond au For time, avec sa source (Hermann, 29/10/2026). |
| C-08 | ch13 CE-FMT-03 §14 : « Contraintes réappliquées après édition » | Ambigu : si les contraintes sont réappliquées après édition, cela peut contredire D-05 (un circuit ne fixe pas les paramètres de ses membres). | **À vérifier** : préciser que « contraintes » désigne les contraintes du circuit (organisation, N), non celles du format de l'élément. |
| C-09 | ARB-24 (plan) : valeurs imposées d'un circuit formaté appliquées à l'exercice entrant | Remplacé par D-05 et D-26. | **Annoter** dans le plan. |
| C-10 | ARB-03 (plan) : « Un Format est porté par un Circuit, lorsque son organisation nécessite un Circuit » | Précisé par D-02 et D-27 : pas de transfert automatique. | **Annoter** dans le plan. |
| C-11 | Plan, architecture §5 l.66 : For time « Circuit ; Volume par tour = tours du Circuit » | Contredit D-02 et D-13 : le For time est porté par un exercice ; son échelle n'est pas celle du circuit. | **Corriger** dans l'architecture. |
| C-12 | Plan, architecture §7 l.99 : For time « pas de limite de temps dans les sources » | Contredit D-21. | **Corriger** dans l'architecture. |
| C-13 | ch10 RM-PRE5-02 : formats imposés « interruption ou série achevée sous la cible » | Étendu à l'AMRAP par D-20 (tour partiel). | **Compléter** la liste des formats concernés. |
| C-14 | ch10 FMT-36 : un tour non appuyé n'est pas acquis (Death by) | Cohérent avec D-19 pour l'appui, mais D-20 introduit une saisie de répétitions partielles pour l'AMRAP, qui n'existe pas pour le Death by. | **À vérifier** : les deux mécanismes sont-ils distincts par construction ? |
| C-15 | ch10 l.1152 et l.1156 : adaptation à N lors de l'ajout et du déplacement dans un circuit alterné | Cohérent avec D-07. | Aucune action. |

## 4. Points restant ouverts

**Aucune décision ouverte côté règles.** Les points C-08 et C-14 sont à vérifier par la revue, et ne demandent pas d'arbitrage de Hermann sauf si la vérification révèle un conflit réel.

Restent hors règles : le graphisme du choix entre circuit existant et nouveau circuit (D-11, Figma).

## 5. Questions à la revue

1. Chaque décision D-01 à D-29 est-elle fidèlement résumée et sans extrapolation ? Signale tout ce qui va au-delà de ce qui est écrit.
2. La matrice du §2.1 est-elle cohérente avec D-15 et D-16 ? Chaque cellule découle-t-elle d'une décision ?
3. Les conflits C-01 à C-15 sont-ils exacts ? Vérifie les citations sur `main` @ `c73079e9`.
4. Y a-t-il une contradiction entre deux décisions que cette analyse n'a pas relevée ? En particulier entre D-05, D-06, D-07 et D-15.
5. Les règles de §2.3 couvrent-elles les cas d'exécution sans trou ? Signale tout cas qui n'est pas tranché.
6. Verdict : COHÉRENT, COHÉRENT SOUS RÉSERVE DE CORRECTIONS, ou INCOHÉRENT, avec la liste des corrections.

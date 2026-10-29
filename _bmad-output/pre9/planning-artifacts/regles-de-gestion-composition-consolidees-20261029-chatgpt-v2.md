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

## 3. Analyse de cohérence avec la documentation normative — citations contrôlées

**Référence normative : main @ c73079e9**, distincte des commits plus récents. Les mentions du plan concernent `pre9-bmad/plan @ 265f3d9d`. Un complément de portée n'est pas automatiquement une contradiction, et une décision nouvelle ne doit pas effacer l'ancienne règle sans identifier précisément ce qu'elle remplace.

**Lecture des statuts :** RÈGLE REMPLACÉE, COMPLÉMENT, COHÉRENT, À CLARIFIER ou ERREUR FACTUELLE.

| # | Texte normatif | Conflit avec les décisions | Action proposée |
|---|---|---|---|
| C-01 | ch10 FMT-26 : circuit répété jusqu'à l'échéance globale (citation exacte) | COMPLÉMENT DE PORTÉE : « globale » peut désigner le bloc AMRAP, pas nécessairement la Séance entière | Préciser une borne propre à chaque passage, de durée réglable ; ne pas effacer FMT-26 sans conflit démontré |
| C-02 | ch10 FMT-02 et FMT-28 citent bien Gainage · Mobilité | RÈGLE REMPLACÉE par D-25 | Corriger les occurrences actives, leurs reprises consolidées et les références d'écran concernées |
| C-03 | ch10 FMT-21 : durée EMOM = N × E × W (citation exacte) | COMPLÉMENT, pas contradiction : un bloc répété conserve sa formule interne | Clarifier cumul des passages et éviter tout multiplicateur caché |
| C-04 | ch10 FMT-34 sur main @ c73079e9 : « met fin à la séance » ; correctif ultérieur 990542fd | RÈGLE REMPLACÉE, mais NON ALIGNÉE sur le commit normatif cité ; le constat « déjà annoté » est faux pour c73079e9 | Vérifier le statut sur la baseline de propagation, sans attribuer le correctif à un commit antérieur |
| C-05 | ch10 FMT-31/32 : pas de sélecteur d'organisation For time, échelle indexée par tour | COHÉRENT avec D-13/D-16 ; répétition du bloc distincte de l'organisation | Pas de correction de fond ; vérifier l'indexation de l'échelle |
| C-06 | ch05 R-03 : raccordement Death by multi-Exercices explicitement requis | PARTIELLEMENT COUVERT : admission D-16, exécution spécialisée encore à raccorder | Ne pas déclarer R-03 techniquement levé ; réserver le détail des fenêtres/rangs à PRE-11 |
| C-07 | ch10 FMT-30–32 ne définissent pas de plafond temporel facultatif For time | RÈGLE NOUVELLE D-21 | Propager plafond, arrêt et résultat incomplet avec provenance |
| C-08 | ch13 CE-FMT-03 §14 : « contraintes réappliquées après édition » (exact), sans limitation au Circuit | À CLARIFIER : la résolution proposée qui efface les contraintes du Format de l'Exercice est infondée | Conserver validation à chaque niveau ; voir §3.1 |
| C-09 | Plan ARB-24 : réapplication des valeurs imposées du Circuit formaté à l'Exercice entrant (source : plan, non ch10) | RÈGLE DU PLAN À RÉVISER selon D-05/D-26, mais D-12 reste à articuler | Annoter arbitrages, architecture et C.4 après clarification de l'adoption explicite |
| C-10 | Plan ARB-03 : porteur Circuit si l'organisation le nécessite | PRÉCISION D-02/D-27 : pas de transfert automatique | Séparer porteur courant, choix explicite et mécanisme de création |
| C-11 | Plan architecture §5 : For time sur Exercice seul ou Circuit multi-Exercices ; échelle reliée au tour dans ce second cas | INCOMPATIBILITÉ POTENTIELLE, pas preuve que For time doit toujours être un Exercice | Vérifier deux porteurs et l'échelle par tour, sans remplacement automatique Circuit → Exercice |
| C-12 | Plan architecture §7 : « pas de limite de temps dans les sources » | RÈGLE DU PLAN À ACTUALISER par D-21 | Séparer plafond facultatif et temps réalisé |
| C-13 | ch10 RM-PRE5-02 : modale partielle avec 0 proposé, interruption ou sous-cible ; pas de liste fermée de Formats | COMPLÉMENT DE DÉCLENCHEMENT, pas extension d'une liste | Décrire échéance AMRAP et rattachement au tour partiel |
| C-14 | ch10 FMT-36 : fenêtre Death by sans appui non acquise ; FMT-37/38 prévoient déjà ses répétitions partielles | ERREUR FACTUELLE de la version initiale : « n'existe pas pour Death by » est faux | Distinguer déclencheur Death by du déclencheur AMRAP ; voir §3.2 |
| C-15 | ch10 l.1141–1161 : adaptation à N, confirmation avant perte, conservation à la sortie | COHÉRENT pour la mécanique générale et les Formats compatibles | Conserver la norme et contrôler les constantes du Format lors de la dépose |

### 3.1 C-08 — Les contraintes ne se limitent pas à l'organisation et à N

CE-FMT-03 §14 impose une réapplication des contraintes après édition, sans préciser qu'elles seraient uniquement celles du Circuit. Il faut contrôler distinctement les contraintes **intrinsèques du Format de l'Exercice**, la nature et N du Circuit, les éventuelles contraintes d'un Format **porté par le Circuit**, les valeurs saisies et les confirmations avant perte. La priorité en cas de deux porteurs formatés reste **À CLARIFIER**. Ne pas inventer un effacement automatique, ni une interdiction générale.

### 3.2 C-14 — Les répétitions partielles existent déjà pour Death by

FMT-36 régit l'acquisition d'une fenêtre ; **FMT-37 et FMT-38 prévoient déjà** la saisie de répétitions partielles après un arrêt de Death by, avec zéro proposé. Pour AMRAP, D-20 définit **un autre déclencheur**, à l'échéance temporelle du bloc. Le composant de modale peut être mutualisé techniquement si cela convient ; ce n'est pas une règle métier nouvelle.

## 4. Points restant ouverts — localisés par opération

L'assertion initiale « aucune décision ouverte côté règles » est **retirée**. Les arbitrages explicitement rendus ne sont pas remis en cause ; ce sont leurs raccordements incomplets ou certaines attributions insuffisamment sourcées qui restent à instruire.

| Contrôle de cohérence (pas un nouvel arbitrage) | Question / conflit observable | Dépendance limitée |
|---|---|---|
| **PC-01** | D-05/D-07 : distinguer valeurs intrinsèques, régime, nombre actif de séries, adaptation à N et constante imposée | Dépose d'un Exercice formaté, C.4 |
| **PC-02** | D-05/D-12/D-26 : adoption volontaire du Format par un second Exercice contre simple dépose d'un Exercice déjà formaté | Ajout à un élément formaté, C.4 |
| **PC-03** | D-02/D-11/D-27 : Format porté par le Circuit, par chaque membre, ou par les deux ; règles quand les Formats sont identiques / distincts et lors de la sortie | Modèle et validation C.1/C.4 |
| **PC-04** | D-06 : preuve de la décision de figer l'organisation et portée Format par Format | Verrouillages C.3/C.4 |
| **PC-05** | D-16/D-29 : Death by alterné, compte N, horloges des membres, rangs/fenêtres, fin d'un membre avant les autres | Contrat D.3/D.5 ; exécution PRE-11 |
| **PC-06** | Exécution multi-Exercices AMRAP / For time, tours partiels, plafond et résultats cumulés ; commandes générales en fenêtres | Contrat D.3/D.5 ; PRE-10/11 |

**C-08 : À CLARIFIER** sur les règles de coexistence des contraintes. **C-14 : erreur documentaire corrigée**, sans besoin de réinventer les règles de partiels Death by.

**Graphisme D-11 :** le rendu du choix « Circuit existant / nouveau Circuit » relève de Figma, sans constituer un arbitrage technique ou un blocage produit général.

**Règle de priorité opérationnelle :** aucun point ne bloque la totalité du plan. Seule l'opération dont le comportement est réellement non défini attend clarification ; les autres stories PRE-9 demeurent développables sous leurs règles et tests existants.

## 5. Consignes pour la contre-revue de Claude

1. Vérifier la fidélité de **D-01 à D-29**, en distinguant le texte attribué à Hermann de ce qui est seulement dérivé de règles ou proposé. Ne pas remplacer une décision validée par une préférence technique.
2. Vérifier les **12 cellules Groupé / Alterné** du §2.1, puis séparément la qualification des constantes, des valeurs initiales et des porteurs.
3. Vérifier **C-01 à C-15** sur la version **exacte** des sources : main @ c73079e9 ; ancien plan pre9-bmad/plan @ 265f3d9d ; correctif FMT-34 @ 990542fd à signaler séparément.
4. Contrôler particulièrement les cas : Tabata N=8 / N différent ; EMOM réglable N différent ; ajout d'Exercice Libre à Circuit déjà formaté ; dépose d'un Exercice déjà formaté dans Circuit du même Format ou d'un autre ; AMRAP et For time répétés ; Death by alterné avec fin d'un seul membre.
5. Indiquer pour PC-01 à PC-06 si la correction est une **précision documentaire**, une **décision fonctionnelle manquante**, ou un **raccordement technique différable à PRE-10/11**.
6. Contester, si nécessaire, chaque correction ChatGPT en citant l'**évidence textuelle exacte** et l'effet observable. Ne pas invoquer l'absence de preuve comme conformité.
7. Formuler un verdict : **COHÉRENT**, **COHÉRENT SOUS RÉSERVE DE CORRECTIONS** ou **INCOHÉRENT**, avec corrections ciblées et ordre de priorité.

**Point d'arrêt :** contre-revue seulement ; ne pas réviser le plan BMAD ni la documentation normative, ne pas modifier Figma et ne pas développer l'application sur la seule base de ce document.

## 6. Traçabilité et limites de la version corrigée

**Original conservé :** `regles-de-gestion-composition-consolidees-20261029.md`, commit `fe8af6a5`.

**Sections affectées :** qualification de D-05, D-06, D-07, D-12, D-15, D-16 et D-29 ; matrice §2.1 ; précision Superset §2.2 ; règles d'exécution §2.3 ; C-01 à C-15 et analyses distinctes C-08/C-14 ; points ouverts §4 ; demandes de revue §5.

**Aucune décision nouvelle :** les « À CLARIFIER » désignent des limites de preuve ou de raccordement, pas des règles créées par ChatGPT.

**Propagation ultérieure à contrôler après contre-revue :** plan BMAD (PRD, architecture §§2/3/5/6/7, Epics B.4/C.1/C.3/C.4/D.1/D.3/D.5, matrice d'écarts, statut) ; registre ch07, conception ch08, modèle ch09, règles ch10, API ch11, architecture ch12, contrats ch13, réserves ch05, matrice et DSF Formats ; PRODUCT.md/INDEX.md uniquement si réellement impactés. Respecter les noms Unicode et les références Markdown exactes.

**Seconde passe requise :** contrôler les 29 décisions et 15 conflits individuellement, rechercher les formulations antérieures contradictoires, vérifier que chaque règle repose sur une évidence et ne pas qualifier « vérifié » ce qui ne l'est pas.

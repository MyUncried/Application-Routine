# PRE-9 — Réponses aux questions ouvertes du plan (Hermann, 29/10/2026)

> **Objet.** Ce document répond **point par point** aux questions encore ouvertes du plan PRE-9, telles qu'elles sont posées par `arbitrages-pre9.md` §2 bis (révision 2) : **ARB-04, ARB-22c, ARB-26, ARB-27, ARB-28**. Il consigne les arbitrages de Hermann du 29/10/2026. Aucune décision close n'est rouverte.
>
> **Base.** Branche de planification `pre9-bmad/plan`, commit `265f3d9d`. Documentation normative : `main`, commit `c73079e9`.
>
> **Portée.** Ce document est la **source** à partir de laquelle `arbitrages-pre9.md`, `architecture-pre9.md` et la propagation normative seront révisés. Il ne modifie lui-même ni le plan, ni la documentation normative, ni Figma.
>
> **Version 2 du 29/10/2026**, après la revue indépendante de ChatGPT (`arbitrages-pre9-revue-chatgpt-20261029.md`, verdict REVISE). Les huit constats de sa section 11 sont traités au §11 ci-dessous. ARB-04, ARB-22c et ARB-28 sont inchangés, jugés conformes par la revue. ARB-26 et ARB-27 passent de « clos » à **partiellement clos** : la part réellement décidée est séparée de la part qui reste à arbitrer, et aucune décision n'est inventée pour les refermer.
>
> **Trois niveaux de qualification** sont employés dans tout le document et doivent être lus comme tels :
> **[DÉCIDÉ]** décision explicite et citable de Hermann, ou règle déjà écrite et citée · **[PROPOSÉ]** mécanisme déduit d'une décision, cohérent avec elle, mais non énoncé par elle : à confirmer · **[À CLARIFIER]** aucune règle ni décision ne tranche : rien n'est inventé, le cas est soumis à arbitrage.

## 1. Synthèse

| ID | Question du plan | Statut | Option retenue |
|---|---|---|---|
| ARB-04 | Valeurs initiales des réglables de Format | **CLOS** | A, validée valeur par valeur, complétée de deux valeurs fournies |
| ARB-22c | Contenu initial des cinq départs rapides | **OUVERT** (en attente de définition fonctionnelle) | aucune |
| ARB-26 | Compatibilité d'un Exercice formaté déposé dans un Circuit | **PARTIELLEMENT CLOS** | critère décidé ; règle des séries établie ; quatre cas soumis à arbitrage |
| ARB-27 | Second Exercice pour un Format porté par un Exercice unique | **PARTIELLEMENT CLOS** | A sur le principe ; transfert de porteur à confirmer |
| ARB-28 | Position d'un Circuit formaté inséré par l'entrée « Format » | **CLOS** | A, précisée |

Trois décisions de principe sont confirmées au §7. Les points restant ouverts après ce document sont consolidés au §10.

## 2. ARB-04 — Valeurs initiales des réglables de Format

**Question posée.** Valeurs initiales des réglables de Format : nombre de séries 30/30, W et N de l'EMOM, durée de l'AMRAP, échelle du For time, q0 / d / W du Death by. Options : A, exemples validés valeur par valeur ; B, table fournie par Hermann ; C, pas de défaut, champ à renseigner.

**[DÉCIDÉ] Option A**, les cas de référence déjà écrits sont adoptés comme valeurs initiales, valeur par valeur ; **complétée** des deux valeurs qui n'existaient nulle part, fournies par Hermann : **durée AMRAP = 12:00** et **nombre de séries du 30/30 = 6**.

| Format | Réglable | Valeur initiale | Source |
|---|---|---|---|
| Tabata | aucun réglable de cadence | sans objet : 8 séries par exercice, 20 s d'effort, 10 s de pause **imposés** | FMT-10, FMT-14 |
| Intervalles 30/30 | nombre de séries | **6** | décision du 29/10 (aucune valeur documentée) ; constantes 30 s / 30 s imposées par FMT-19 |
| EMOM | fenêtre W | **60 s** | REC-10 |
| EMOM | nombre de tours N | **6** | REC-10 |
| AMRAP | durée | **12:00** | décision du 29/10 (aucune valeur documentée) |
| For time | échelle, volume par tour | **21 · 15 · 9** | FMT-30, FMT-32 |
| Death by | départ q0 | **1** | FMT-33 |
| Death by | incrément d | **1** | FMT-33 |
| Death by | fenêtre W | **1 min** | FMT-33 |

**Effet documentaire.** Par cette décision, et pour **ces valeurs seulement**, la réserve de ch10 l.1524 (« les chiffres des recettes et de Figma sont des exemples ») ne s'applique plus : ces valeurs deviennent les valeurs initiales documentées des réglables. Aucune autre valeur illustrée dans Figma ou dans les recettes ne devient un défaut. Classe **B** de la règle permanente de synchronisation.

**Nature.** Une valeur initiale est **proposée et modifiable** ; elle ne devient jamais une contrainte. Elle ne doit pas être confondue avec une **valeur imposée et verrouillée** : celles-ci restent exactement celles que les règles de Format désignent comme non modifiables (FMT-10 et FMT-17 pour Tabata, les constantes de FMT-19 pour le 30/30, FMT-30 et FMT-31 pour le For time).

**Débloqué.** La mise à disposition (activation dans la grille) de chacun des six Formats. Plus aucun Format ne reste indisponible faute de valeur initiale. Le registre C.1 porte ces valeurs comme données.

## 3. ARB-22c — Contenu initial des cinq départs rapides

**Question posée.** Paramètres et, le cas échéant, Mouvements préremplis pour chacun des cinq départs rapides : Renforcement, Gainage · Mobilité, Superset, Progression, À l'échec.

**[À CLARIFIER] OUVERT. En attente de définition fonctionnelle de Hermann.** Aucune valeur n'est proposée, déduite ni inventée, conformément à la contrainte de mission et à P-2 (« ne jamais inventer une règle »).

**Ce qui n'est pas bloqué.** Le mécanisme unique exigé par ARB-22b, capable de porter les trois cas (A paramètres seuls, B Mouvements et paramètres, C contenu variable selon le départ), se construit sans ces valeurs : le contenu d'un départ est une **donnée**, pas un parcours. FMT-28 énonce que ces entrées « ne font que préremplir une séance libre. Aucun verrouillage métier ne provient de cette origine ». Un départ rapide ne crée donc aucune contrainte à concevoir.

**Bloqué.** L'activation de chaque départ rapide (story C.5), départ par départ, tant que son contenu n'est pas défini.

## 4. ARB-26 — Compatibilité d'un Exercice formaté déposé dans un Circuit

**Question posée.** Critères de compatibilité d'un Exercice formaté déplacé dans un Circuit, libre ou formaté. Options : A, refus dans tout Circuit ; B, admis dans un Circuit libre groupé de compte 1 ; C, admis dans un Circuit formaté du même Format et des mêmes réglages. Recommandation du plan : C, puis B.

### 4.1 Le critère décidé

**[DÉCIDÉ]** Aucune des trois options. Le critère retenu est celui énoncé par Hermann le 29/10 :

> « Ajouter un exercice formaté à un circuit alterné changerait la nature du format de l'exercice, donc c'est interdit, en tout cas c'est interdit si ça change la nature de l'exercice formaté. »

L'opération est donc **admise tant qu'elle ne change pas la nature du Format porté par l'Exercice ; refusée sans altération dans le cas contraire.** Le critère ne porte pas sur le type de Circuit en soi, mais sur ce que le Circuit **fait** aux prescriptions du Format.

Deux autres décisions du même jour encadrent son application :

> « J'accepte que le compte d'un circuit groupé répète un élément formaté, c'est même son principe, il n'y a pas de contradiction ni d'incohérence. »

> « l'un des objectifs du circuit c'est de pouvoir avec le nombre de tours multiplier le nombre d'exécutions d'un ou de plusieurs exercices. À ce titre c'est l'équivalent du cycle et il est dans son rôle, il ne fait pas le travail du cycle, il fait le sien. »

### 4.2 Deux compatibilités distinctes

Le critère décidé s'applique à **toutes** les prescriptions d'un Format, et pas seulement à son nombre de séries. Il faut donc distinguer deux examens, que la version 1 de ce document confondait :

1. **Compatibilité des séries.** Ce que le Circuit fait au nombre de séries de ses membres. Cet examen est **tranché par une règle écrite**, ch10 l.1053 : dans un **Circuit à séries groupées**, le nombre de séries par exercice est « propre à chaque exercice, indépendant d'un exercice à l'autre » ; dans un **Circuit à séries alternées**, il est « identique pour tous, hérité du circuit », et ce Circuit « ne crée pas de paramètre, il **contraint** un paramètre existant ».
2. **Compatibilité du Format.** Ce que le Circuit fait aux autres prescriptions : fenêtres, borne globale, progression dynamique, condition de fin, et coexistence éventuelle de deux Formats sur deux niveaux. **La ligne 1053 ne tranche rien de cela.** Elle décrit une mécanique de séries, pas un régime de compatibilité entre Formats.

La règle du §4.4 ne couvre donc que le premier examen. Le second n'est établi que là où une règle de Format le dit, et reste **à clarifier** ailleurs (§4.5). C'est la raison du passage d'ARB-26 en partiellement clos.

### 4.3 Matrice des issues

Issues possibles : **ADMIS** · **ADMIS AVEC CONFIRMATION** · **REFUSÉ** (sans altération des paramètres ni des données) · **À CLARIFIER** (aucune décision, aucune règle inventée). Les six Formats sont couverts ; chaque cellule porte une issue unique.

| Format de l'Exercice entrant | Circuit **libre groupé** | Circuit **libre alterné** | Circuit **formaté** (même Format ou autre) |
|---|---|---|---|
| **Tabata** | **ADMIS** — aucune série touchée (l.1053) ; les 8 séries, 20 s et 10 s de FMT-10 et FMT-17 restent effectives ; le compte du Circuit répète le passage complet | **ADMIS si N = 8** — la séquence obtenue est littéralement FMT-13, `A1 B1 … A8 B8`, avec le compte commun de FMT-14. **REFUSÉ si N ≠ 8** — le Circuit contraindrait un compte que le Format impose | **À CLARIFIER — a** |
| **Intervalles 30/30** | **ADMIS** — constantes 30 s / 30 s de FMT-19 et compte réglé intacts | **À CLARIFIER — b** | **À CLARIFIER — a** |
| **EMOM** | **ADMIS** — fenêtre et nombre de tours intacts ; la durée de FMT-21 est multipliée par le compte, comme un Cycle × k multiplie le développement (RM-252) | **À CLARIFIER — b** | **À CLARIFIER — a** |
| **For time** | **À CLARIFIER — c** | **À CLARIFIER — c** | **À CLARIFIER — a et c** |
| **AMRAP** | **À CLARIFIER — d** | **REFUSÉ** — aucun nombre de séries à contraindre : les tours sont « un résultat, pas une borne saisie » (FMT-26). Un Circuit alterné n'a rien sur quoi s'appliquer | **À CLARIFIER — a et d** |
| **Death by** | **À CLARIFIER — d** | **REFUSÉ** — le rang de fenêtre est déduit de l'horloge (FMT-33) ; aucun compte de séries n'existe. Si la dépose rendrait le Death by multi-Exercices, R-03 s'y oppose en outre | **À CLARIFIER — a et d** |

Aucun trou, aucun recouvrement : chacune des dix-huit situations reçoit une issue, et les quatre clarifications a, b, c, d sont disjointes.

### 4.4 Règle des séries établie

**[DÉCIDÉ]** Seule la mécanique des séries est tranchée, et seulement pour les Formats dont le nombre de séries est un paramètre existant.

**Circuit à séries groupées.** Il ne touche pas au nombre de séries de ses membres ; son compte répète intégralement leur passage. Un Exercice portant un Format **fini et cadencé** (Tabata, 30/30, EMOM) y entre donc sans qu'aucun de ses paramètres, imposés ou réglés, ne soit modifié : **ADMIS**. Les Formats dont la fin est conditionnelle (AMRAP, Death by) ou dont le volume est indexé par tour (For time) ne relèvent pas de cette démonstration, le compte du Circuit agissant alors sur une borne ou une échelle et non sur des séries : voir c et d.

**Circuit à séries alternées.** Il impose son compte N aux séries de ses membres et les entrelace. Trois cas selon le statut du nombre de séries du Format :

| Statut du nombre de séries | Issue | Justification |
|---|---|---|
| **Imposé et égal à N** | **ADMIS** | Aucune valeur n'est changée ; la séquence obtenue est la forme canonique du Format. Cas sourcé : Tabata, N = 8 (FMT-13, FMT-14) |
| **Imposé et différent de N** | **REFUSÉ** | Le Circuit contraindrait un paramètre que le Format impose : soit le compte du Format est écrasé, soit celui du Circuit ne s'applique pas. Les deux changent la nature du Format (critère du §4.1) |
| **Réglable** | **À CLARIFIER — b** | Le caractère réglable ne suffit pas : il faut savoir si la dépose remplace la valeur réglée, la conserve, ou exige une confirmation. Aucune règle ne le dit |
| **Résultat, non réglable** | **REFUSÉ** | AMRAP (FMT-26) et Death by (FMT-33) n'ont aucun paramètre de séries à contraindre |

La version 1 de ce document rangeait le cas « réglable » en ADMIS. C'était une inférence, non une règle : elle est retirée et devient la clarification b.

### 4.5 Les quatre cas soumis à arbitrage

**[À CLARIFIER — a] Circuit de destination lui-même formaté, et sort du Format à la sortie.**
Cas concret : un Exercice EMOM est déposé dans un Circuit Tabata groupé. Deux Formats portent alors des prescriptions simultanées sur le même contenu. Rien dans les sources ne décide lequel prévaut.
Options : **a1** refus de toute dépose dans un Circuit formaté, quel que soit le Format ; **a2** admis uniquement si le Circuit porte le même Format aux mêmes réglages, l'Exercice devenant simple membre et son Format propre disparaissant au profit de celui du Circuit, refusé sinon ; **a3** admis avec confirmation, le Format du Circuit absorbant celui de l'Exercice. Le même arbitrage doit dire si un Exercice qui **quitte** ensuite ce Circuit retrouve un Format, et lequel.
Recommandation : **a2**. C'est la seule option qui n'invente aucun régime de priorité entre deux Formats et qui conserve le principe « un porteur, un Format » d'ARB-03. Elle couvre le besoin réel, réunir deux éléments de même Format, et refuse les combinaisons dont aucune règle ne décrit l'exécution.

**[À CLARIFIER — b] Format fini dont le compte est réglable, déposé dans un Circuit alterné.**
Cas concrets : un EMOM de W = 60 s et N = 6 déposé dans un Circuit alterné de N = 4 ; un 30/30 de 6 séries déposé dans un Circuit alterné de N = 4. Deux obstacles distincts : **FMT-22** énonce que « ajouter ou retirer un exercice conserve le nombre de tours », ce qui s'oppose au remplacement automatique de N par celui du Circuit ; et **FMT-19** ne définit aucun sélecteur d'organisation pour le 30/30, dont l'exécution en alternance n'est donc pas décrite.
Options : **b1** refus dans tout Circuit alterné dont N diffère ; **b2** admis avec confirmation, le compte du Format étant remplacé par N, avec avertissement explicite ; **b3** admis en conservant le compte du Format, le Circuit n'imposant alors plus son N, ce qui contredit la ligne 1053.
Recommandation : **b1** pour le 30/30, dont l'organisation alternée n'est pas décrite, et **b2** pour l'EMOM, dont FMT-20 décrit explicitement l'organisation « En alternance ». b3 est à écarter : il ferait du Circuit alterné un conteneur à comptes hétérogènes, contre la ligne 1053.

**[À CLARIFIER — c] For time porté par un Exercice, déposé dans un Circuit.**
La table des porteurs du plan (`architecture-pre9.md` §5 et §7) prévoit un For time porté par un **Exercice ou** un Circuit. Le cas existe donc. FMT-31 refuse le sélecteur d'organisation, mais ne refuse pas les déplacements ; FMT-30 et FMT-32 indexent le volume par tour. Un Circuit qui répète ce bloc multiplie une échelle déjà indexée par tour, et aucune règle ne dit si la deuxième exécution reprend l'échelle à son premier terme ou la prolonge.
Options : **c1** refus de toute dépose d'un For time dans un Circuit, l'échelle par tour étant déjà un mécanisme de tours ; **c2** admis dans un Circuit groupé, chaque passage rejouant l'échelle complète depuis son premier terme ; **c3** admis, l'échelle étant prolongée.
Recommandation : **c1**. Le For time est le seul Format dont le paramètre principal est déjà indexé par tour ; lui superposer le compte d'un Circuit crée exactement le double comptage que ch11 l.313-314 et CE-FMT-02 §12 interdisent. Un besoin de répétition se traite par un Cycle, dont ARB-25 dit qu'il répète la séquence entière.

**[À CLARIFIER — d] AMRAP et Death by répétés par un Circuit groupé.**
Deux obstacles sourcés. Pour l'**AMRAP**, FMT-26 fixe une borne globale ; un Circuit de compte 3 doit dire si la borne de 12:00 est réarmée à chaque passage, soit trois bornes successives, ou si une borne unique de 36:00 s'y substitue. Pour le **Death by**, **FMT-34** énonce qu'« un seul bouton met fin à la **séance** » : la règle écrite ne connaît pas la fin d'un bloc Death by suivie d'autre chose. Répéter le bloc exige donc de décider ce qui termine une occurrence sans terminer la séance, et ce qui déclenche la suivante.
Options : **d1** refus de la dépose d'un AMRAP ou d'un Death by dans un Circuit, la répétition de ces blocs relevant du Cycle, pour lequel ARB-25 prévoit déjà que « le Cycle répète éventuellement le bloc complet sans remplacer leurs progressions ni leurs conditions de fin, le comportement d'une nouvelle exécution étant dérivé de leurs spécifications » ; **d2** admis, avec arbitrage préalable de la borne réarmée pour l'AMRAP et de la distinction fin de bloc / fin de séance pour le Death by.
Recommandation : **d1**. ARB-25 a déjà attribué au Cycle la répétition de ces deux Formats et renvoyé leur comportement à leurs spécifications propres. Ouvrir en plus la voie du Circuit obligerait à écrire deux fois les mêmes règles de terminaison, pour un besoin que le Cycle couvre.

### 4.6 Statut et portée

**Ce qui est clos.** Le critère du §4.1 et la règle des séries du §4.4, soit les onze cellules de la matrice portant ADMIS ou REFUSÉ. Ces onze issues peuvent être propagées.

**Ce qui reste ouvert.** Les sept cellules portant À CLARIFIER, regroupées en quatre arbitrages a, b, c, d. **ARB-26 ne doit pas être déclaré clos ni propagé comme règle normative complète.** Tant que a, b, c et d ne sont pas arbitrés, ces dépôts sont **refusés sans altération** dans B.4 et C.4, conformément à la position de repli déjà prévue par le plan.

**Ce que la règle remplace.** Les options A, B et C de `arbitrages-pre9.md` §2 bis. Elle est plus large que la recommandation C sur un point établi, tout Circuit libre groupé est admis pour les trois Formats finis et cadencés, quel que soit son compte, et non seulement un compte de 1.

## 5. ARB-27 — Second Exercice pour un Format porté par un Exercice unique

**Question posée.** Comment ajouter un second Exercice à un Format porté par un Exercice unique. Options : A, poser un Circuit sur l'Exercice formaté fait passer le Format à ce Circuit ; B, refus, l'élément doit être recréé par l'entrée « Format ».

**Option A retenue sur le principe.** Les quatre composantes de cette réponse n'ont pas le même statut, et la revue a eu raison d'exiger qu'elles soient séparées.

**[DÉCIDÉ] 1. Le second Exercice entrant adopte le Format du premier.** Hermann, 29/10 :

> « Le cas est-il que nous avons un circuit et un exercice formatés, et que si on y fait entrer un deuxième exercice, celui-ci adopte le format du premier exercice ? Si c'est le cas je suis d'accord. »

Si des valeurs qu'il portait sont remplacées par des valeurs imposées, confirmation préalable, par application d'ARB-24 et de CE-FMT-03 §14.

**[PROPOSÉ] 2. Poser un Circuit sur un Exercice formaté fait remonter le Format au Circuit, réglages inchangés.** Ce mécanisme est cohérent avec ARB-03, qui dit qu'« un Format est porté par un Circuit, lorsque son organisation nécessite un Circuit ; un Exercice, lorsqu'un Circuit n'est pas nécessaire » : passer d'un à deux Exercices change le porteur approprié. Mais la décision citée au point 1 porte sur l'adoption du Format par le second Exercice, pas sur le transfert de propriété du Format de l'Exercice vers le Circuit. **À confirmer** avant propagation. L'option B, refus et recréation par l'entrée « Format », reste l'alternative si le transfert n'est pas voulu.

**[PROPOSÉ] 3. La question d'organisation, Par exercice ou En alternance, est posée à l'arrivée du second Exercice.** FMT-11 énonce bien qu'« avec plusieurs exercices, le réglage global propose Par exercice et En alternance. Avec un exercice unique, la question est inutile », mais cette règle est écrite **dans la section Tabata**. Elle n'est pas générale : FMT-20 donne le sélecteur à l'EMOM, FMT-31 le refuse explicitement au For time. La règle correcte est donc : la question est posée à l'arrivée du second Exercice **pour les seuls Formats dont une règle propre prévoit le sélecteur**, et n'est pas posée pour les autres. Formulation à valider.

**[DÉCIDÉ] 4. Death by exclu** tant que R-03 (ch05, « Death by à plusieurs exercices ») n'est pas clos. La réserve est écrite : « l'exemple d'un exercice ne prouve pas ce raccordement ».

**[À CLARIFIER]** Si l'un des deux Exercices quitte ensuite le Circuit, le Format revient-il à l'Exercice restant, ou le Circuit à un membre conserve-t-il le Format ? Question traitée avec la clarification **a** du §4.5, qui porte le même sujet.

**Débloqué.** Le point 1 et le point 4 peuvent être propagés. Le geste complet, Circuit posé sur un Exercice formaté, reste suspendu aux points 2 et 3 dans C.4.

## 6. ARB-28 — Position d'un Circuit formaté inséré par l'entrée « Format »

**Question posée.** Où insérer un Circuit formaté créé par l'entrée « Format » quand la position d'ARB-07, après le dernier Exercice entré dans son conteneur, se trouve à l'intérieur d'un Circuit. Options : A, juste après ce Circuit dans le même parent ; B, à la fin du niveau Séance.

**[DÉCIDÉ] Option A**, avec la précision de Hermann : « A, juste après, même parent = Cycle si applicable. »

Le Circuit formaté est inséré **immédiatement après le Circuit qui contient le dernier Exercice entré, dans le parent de ce Circuit**. Ce parent est le **Cycle** lorsque le Circuit est membre d'un Cycle, et le niveau Séance sinon. L'élément n'est jamais imbriqué dans le Circuit existant (D-451, pas d'imbrication Circuit dans Circuit) et n'est jamais renvoyé à la fin de la Séance alors que le travail en cours se situe dans un Cycle.

**Débloqué.** Ce seul cas d'insertion, dans C.4. La revue a confirmé la conformité de ce point.

## 7. Décisions de principe confirmées, et précision apportée à ARB-25

Ces points n'étaient pas des questions du §2 bis. Ils ont été tranchés le 29/10 pendant l'examen d'ARB-26 et conditionnent la lecture des réponses ci-dessus.

**[DÉCIDÉ] 1. ARB-03 est conservé ; la simplification « toujours un Circuit » est abandonnée.** La proposition examinée consistait à faire porter tout Format par un Circuit, même à un seul Exercice. Hermann : « On conserve la règle qui est qu'un format peut être porté par un exercice, et on abandonne l'idée d'utiliser systématiquement un circuit. » Un Format à un seul Exercice reste donc porté par cet Exercice.

**[DÉCIDÉ] 2. Un Exercice formaté peut être répété par un Circuit ou par un Cycle.** Ses paramètres d'exécution, imposés pour certains, ne lui interdisent pas d'être ensuite répété. C'est le fondement de la colonne « Circuit libre groupé » du §4.3, dans les limites qu'elle énonce.

**[DÉCIDÉ] 3. Précision datée du 29/10/2026 apportée à ARB-25.** ARB-25 énonçait que « le Cycle est le mécanisme permettant de répéter intégralement un élément formaté ». Cette formulation est désormais lue comme une **attribution de rôles**, non comme l'interdiction pour un Circuit de répéter un élément formaté. Hermann : le Circuit, en multipliant les exécutions par son nombre de tours, « est dans son rôle, il ne fait pas le travail du cycle, il fait le sien ». La portée exacte de chaque mécanisme, après cette précision :

| Mécanisme | Ce qu'il répète | Ce qu'il ne fait jamais |
|---|---|---|
| **Circuit groupé** | les passages complets de **ses membres**, selon son compte | créer ou modifier le nombre de séries d'un membre (l.1053) |
| **Circuit alterné** | les séries de même indice de ses membres, entrelacées | créer un paramètre : il contraint un paramètre existant (l.1053) |
| **Cycle** | la **séquence entière** qu'il contient, qui peut comprendre plusieurs Circuits et plusieurs éléments formatés | remplacer le nombre de séries d'un Circuit (ARB-25) |
| **Format** | rien : il **prescrit** séries, fenêtres, progression, borne et terminaison | céder une prescription imposée à un conteneur |

**Interdiction de double comptage, maintenue.** Un seul mécanisme de répétition s'applique à un niveau donné. Aucune répétition ne transforme silencieusement la borne ni la condition d'arrêt d'un Format : c'est précisément ce que les clarifications c et d du §4.5 préservent, en refusant pour l'instant les combinaisons où ce risque existe. Sources de l'interdiction : ch11 l.313-314, CE-FMT-02 §12, ch05 l.485 (« l'EMOM Par exercice ne doit pas multiplier à la fois séries et tours »), RM-252.

## 8. Conséquences sur le plan et sur la documentation

À traiter dans la révision suivante du plan, puis dans la story qui livre le comportement, selon la règle permanente de synchronisation code / documentation. **Seules les parties closes sont propageables** ; les clarifications a à d et ARB-22c ne donnent lieu à aucune correction normative.

### 8.1 Artefacts de planification PRE-9

| Artefact | Section | Action |
|---|---|---|
| `arbitrages-pre9.md` | §1 ARB-04 | Passer en **CLOS** ; recopier la table du §2 ; conserver et annoter la formulation remplacée |
| `arbitrages-pre9.md` | §2 bis | ARB-04 et ARB-28 **CLOS** ; ARB-26 et ARB-27 **PARTIELLEMENT CLOS** avec leurs cas ouverts ; ARB-22c inchangé ; ajouter les quatre arbitrages a à d |
| `arbitrages-pre9.md` | §0 bis, conséquences 4 à 6 | Remplacer les mentions « non décidé », « non déductible », « non défini » par les règles des §4.4, §5 et §6, avec leurs réserves |
| `prd-pre9.md` | exigences de Composition | Valeurs initiales ; règles de dépose closes ; conservation du Format ; position d'insertion |
| `architecture-pre9.md` | §§2 et 3 | Propriété du Format et transition Exercice vers Circuit ; conservation lors des mutations et de la persistance ; cas de deux niveaux porteurs à laisser ouvert |
| `architecture-pre9.md` | §5 et §7 | Statut du nombre de séries par Format, imposé, réglable ou résultat : c'est l'entrée de la règle du §4.4. Confirmer la ligne For time porté par un Exercice, qui ouvre la clarification c |
| `architecture-pre9.md` | §6 | Contrat Composition vers Exécution pour les éléments formatés répétés ; cas de contraintes concurrentes laissés ouverts |
| `epics.md` | C.1 | Valeurs initiales comme données du registre des Formats |
| `epics.md` | C.3 | Paramètres imposés ; tests de conservation des valeurs lors d'une dépose admise |
| `epics.md` | B.4 et C.4 | Les onze issues closes du §4.3 ; refus sans altération pour les sept autres ; geste d'ARB-27 limité à ses points 1 et 4 ; position d'ARB-28 |
| `epics.md` | D.1 et D.3 | Développement des occurrences d'un élément formaté répété ; descripteurs de capacités et bornes |
| `epics.md` | C.5 | Inchangé, conditionné à ARB-22c |
| `etat-initial-et-ecarts.md` | matrice | Statut réel des dépendances : closes, partiellement closes, ouvertes |
| `README.md`, `implementation-artifacts/sprint-status.yaml` | statuts | Statuts d'arbitrage et dépendances localisées |

### 8.2 Documentation normative, contrôle ciblé

Modification seulement si une dépendance réelle est confirmée. Classe B pour les décisions validées, classe A pour les règles citées sans modification.

| Document | Conséquence à vérifier |
|---|---|
| ch07 Registre des décisions | Nouvelles décisions du 29/10 ; précision datée apportée à ARB-25 (§7.3) ; distinction entre arbitrage et mécanisme proposé |
| ch08 Conception | Entrée et sortie d'un Circuit, adoption éventuelle d'un Format, position d'insertion |
| ch09 Données | Propriété du Format après transfert Exercice vers Circuit ; présence simultanée d'un Format sur deux niveaux |
| ch10 règles de Format | Valeurs initiales décidées. **Règle de compatibilité distincte** de la règle existante sur les séries : la ligne 1053 reste une mécanique de séries, citée sans modification (classe A), et ne porte pas à elle seule la règle d'ARB-26 |
| ch11 API | Contrôle de compatibilité avant mutation : accepté, accepté après confirmation, refusé, et motif |
| ch12 Architecture technique | Représentation et conservation des contraintes portées par un Circuit et par un Exercice |
| ch13 Contrats d'écran | **CE-FMT-02 et CE-FMT-04** autant que CE-FMT-03 : valeurs proposées, bornes, verrouillage, contrôle avant dépose, confirmation, refus sans altération |
| `DSF-FORMATS-SEANCES-2026-10-14.md`, `MATRICE-FORMATS-SEANCES-2026-10-14.md` | Nouvelles valeurs initiales ; conséquences sur scénarios, contrôles et références |
| `PRODUCT.md`, `INDEX.md` | Rechercher les mentions dépendantes ; modifier seulement en cas de contradiction effective |

## 9. Écarts d'exécution signalés, hors périmètre de ces cinq questions

Trois points relevés, qualifiés selon leur degré d'établissement. **Aucun n'est une exigence normative à ce stade**, et aucun ne bloque une story PRE-9. Leur instruction relève du cadrage de l'exécution PRE-10 et PRE-11.

1. **[À CLARIFIER] Appui de déclaration de tour pour l'AMRAP et le For time.** Les deux écrans d'exécution portent « Appuyez à chaque tour terminé ». **Aucune règle RM-FMT ne décrit cet appui** pour ces deux Formats. FMT-35 le décrit pour le Death by seulement ; il ne démontre rien par analogie, et il n'est cité ici que comme **modèle de rédaction** d'une règle à écrire, non comme preuve. Deux règles restent à écrire, et à décider.
2. **[À CLARIFIER, décision rapportée, source à retrouver] Expiration du plafond de temps du For time.** Rapportée comme décidée en conversation le 28/10/2026. **Non retrouvée dans les sources normatives au commit `c73079e9`** : l'expression « plafond de temps » n'y apparaît pas, et FMT-32 fait du temps un résultat sans fixer de limite. À confirmer par Hermann avant toute propagation.
3. **[À CLARIFIER] Tour partiel de l'AMRAP et `RM-PRE5-02`.** Le raccordement du tour partiel d'un AMRAP vers la modale de répétitions partielles reste à étayer : `RM-PRE5-02` nomme comme formats imposés « interruption ou série achevée sous la cible », ce qui ne vise pas explicitement un tour d'AMRAP inachevé.

## 10. Points ouverts après ce document

| Réf. | Point | Bloque |
|---|---|---|
| ARB-22c | Contenu des cinq départs rapides | Activation de chaque départ (C.5) |
| ARB-26 a | Circuit de destination formaté ; sort du Format à la sortie | Sept cellules du §4.3 ; sortie d'ARB-27 |
| ARB-26 b | Format à compte réglable dans un Circuit alterné (EMOM, 30/30) | Deux cellules du §4.3 |
| ARB-26 c | For time porté par un Exercice, déposé dans un Circuit | Trois cellules du §4.3 |
| ARB-26 d | AMRAP et Death by répétés par un Circuit groupé | Quatre cellules du §4.3 |
| ARB-27 points 2 et 3 | Transfert du Format au Circuit ; généralisation du sélecteur d'organisation | Le geste complet de C.4 |

Les trois écarts du §9 ne bloquent aucune story PRE-9.

## 11. Traitement des huit constats de la revue ChatGPT

| Constat | Statut | Référence normative vérifiée | Correction apportée | Limite |
|---|---|---|---|---|
| **1.** §4.1 « Circuit groupé toujours admis » non démontré | **Corrigé, avec contestation partielle** | ch10 l.1053 (mécanique des séries seule) ; FMT-26 ; FMT-34 | « Toujours admis » est retiré. ADMIS est conservé, sans hedging, pour les trois Formats finis et cadencés, où aucune prescription n'est touchée et où la démonstration tient. For time, AMRAP et Death by sortent de l'issue ADMIS vers les clarifications c et d | La contestation porte sur la forme : l'erreur était d'étendre ADMIS aux six Formats, non d'affirmer ADMIS là où la ligne 1053 et la décision du 29/10 suffisent |
| **2.** §4.2 matrice incomplète : six Formats, For time, EMOM N différent, 30/30, destination formatée | **Corrigé** | FMT-22 (« ajouter ou retirer un exercice conserve le nombre de tours ») ; FMT-19 (aucun sélecteur d'organisation) ; FMT-20 ; `architecture-pre9.md` §5 et §7 (For time porté par un Exercice) | Matrice §4.3 de six Formats × trois destinations, dix-huit cellules, chacune avec une issue unique. Le cas « réglable » quitte ADMIS pour la clarification b | Aucune |
| **3.** §4 séparer compatibilité des séries et du Format ; deux niveaux porteurs ; sortie | **Corrigé** | ch10 l.1053 ne tranche que les séries | §4.2 pose explicitement les deux examens. La coexistence de deux Formats et la sortie de l'Exercice deviennent la clarification a, avec options et recommandation a2 | Aucune règle n'est inventée : le cas est soumis à arbitrage, non refermé |
| **4.** §5 ARB-27 : distinguer validé, proposé, non arbitré | **Corrigé** | FMT-11 écrit dans la section Tabata ; FMT-20 ; FMT-31 ; ch05 R-03 | Les quatre composantes sont qualifiées séparément. L'adoption du Format par le second Exercice est [DÉCIDÉ] ; le transfert de porteur et la généralisation du sélecteur sont [PROPOSÉ] ; Death by reste réservé par R-03 | FMT-11 ne vaut que pour Tabata : la généralisation que la version 1 en tirait est retirée |
| **5.** §7 tracer la précision apportée à ARB-25, sans double comptage | **Corrigé** | ARB-25 ; ch11 l.313-314 ; CE-FMT-02 §12 ; ch05 l.485 ; RM-252 | §7.3 porte la précision datée du 29/10, la table de portée des quatre mécanismes et l'interdiction de double comptage avec ses sources | Aucune |
| **6.** §8 impacts incomplets ; ne pas tout attribuer à la ligne 1053 | **Corrigé** | Existence vérifiée de CE-FMT-01 à CE-FMT-06, des chapitres 07 à 13, du PRD, de `etat-initial-et-ecarts.md`, du `README.md`, de `sprint-status.yaml`, des deux documents DSF et matrice Formats | §8 scindé en artefacts de planification et documentation normative ; les quinze documents de la revue sont intégrés ; la ligne 1053 est explicitement classée A, mécanique des séries, et ne porte plus la règle d'ARB-26 | Aucune |
| **7.** §9 qualifier les écarts d'exécution comme non démontrés | **Corrigé pour le plafond de temps, contesté pour l'appui** | « plafond de temps » absent de `docs/` au commit `c73079e9` ; FMT-32 ; FMT-35 ; `RM-PRE5-02` | Le plafond For time devient « décision rapportée, source à retrouver, non retrouvée au commit vérifié ». Les trois points passent en [À CLARIFIER] | La version 1 ne tirait aucun argument d'analogie sur l'appui AMRAP et For time : elle constatait l'absence de règle et citait FMT-35 comme modèle de rédaction. La qualification explicite est néanmoins ajoutée |
| **8.** Seconde passe : issue explicite pour chaque situation, sans trou ni recouvrement | **Corrigé** | — | Quatre issues définies au §4.3 et appliquées aux dix-huit cellules ; les quatre clarifications sont disjointes ; aucune question ouverte n'est transformée en règle ; §10 consolide les six points ouverts | Les sept cellules À CLARIFIER restent non tranchées, par construction : elles exigent un arbitrage de Hermann |

# PRE-9 — Réponses aux questions ouvertes du plan (Hermann, 29/10/2026)

> **Objet.** Ce document répond **point par point** aux questions encore ouvertes du plan PRE-9, telles qu'elles sont posées par `arbitrages-pre9.md` §2 bis (révision 2) : **ARB-04, ARB-22c, ARB-26, ARB-27, ARB-28**. Il consigne les arbitrages de Hermann du 29/10/2026. Aucune décision close n'est rouverte.
>
> **Base.** Branche de planification `pre9-bmad/plan`, commit `265f3d9d`. Documentation normative : `main`, commit `c73079e9`.
>
> **Portée.** Ce document est la **source** à partir de laquelle `arbitrages-pre9.md`, `architecture-pre9.md` et la propagation normative seront révisés. Il ne modifie lui-même ni le plan, ni la documentation normative, ni Figma.
>
> **Version 3 du 29/10/2026.** La version 2 traitait les huit constats de la revue indépendante de ChatGPT (`arbitrages-pre9-revue-chatgpt-20261029.md`, verdict REVISE) : traitement consigné au §11. Un contrôle indépendant de cette version 2 a relevé vingt-et-un défauts, dont treize bloquants : traitement consigné au §12. Les corrections les plus lourdes portent sur le dénombrement des cellules propageables, faux en version 2, et sur deux règles déjà écrites que la version 2 déclarait inexistantes.
>
> **Trois niveaux de qualification** sont employés dans tout le document et doivent être lus comme tels :
> **[DÉCIDÉ]** décision explicite et citable de Hermann, ou règle déjà écrite et citée · **[PROPOSÉ]** mécanisme déduit d'une décision ou d'une règle, cohérent avec elle, mais non énoncé par elle : à confirmer · **[À CLARIFIER]** aucune règle ni décision ne tranche : rien n'est inventé, le cas est soumis à arbitrage.

## 1. Synthèse

| ID | Question du plan | Statut | Option retenue |
|---|---|---|---|
| ARB-04 | Valeurs initiales des réglables de Format | **CLOS** | A, validée valeur par valeur, complétée de deux valeurs fournies |
| ARB-22c | Contenu initial des cinq départs rapides | **OUVERT** (en attente de définition fonctionnelle) | aucune |
| ARB-26 | Compatibilité d'un Exercice formaté déposé dans un Circuit | **PARTIELLEMENT CLOS** | critère décidé ; huit des dix-huit situations tranchées ; trois cas soumis à arbitrage |
| ARB-27 | Second Exercice pour un Format porté par un Exercice unique | **PARTIELLEMENT CLOS** | principe et sélecteur d'organisation décidés ; transfert de porteur à confirmer |
| ARB-28 | Position d'un Circuit formaté inséré par l'entrée « Format » | **CLOS** | A, précisée |

Trois décisions de principe sont confirmées au §7. Les points restant ouverts sont consolidés au §10.

## 2. ARB-04 — Valeurs initiales des réglables de Format

**Question posée.** Valeurs initiales des réglables de Format : nombre de séries 30/30, W et N de l'EMOM, durée de l'AMRAP, échelle du For time, q0 / d / W du Death by. Options : A, exemples validés valeur par valeur ; B, table fournie par Hermann ; C, pas de défaut, champ à renseigner.

**[DÉCIDÉ] Option A**, les cas de référence déjà écrits sont adoptés comme valeurs initiales, valeur par valeur ; **complétée** des deux valeurs qui n'existaient nulle part, fournies par Hermann : **durée AMRAP = 12:00** et **nombre de séries du 30/30 = 6**.

| Format | Réglable | Valeur initiale | Source |
|---|---|---|---|
| Tabata | aucun réglable de cadence | sans objet : 8 séries par exercice, 20 s d'effort, 10 s de pause **imposés** | FMT-10, FMT-14, FMT-17 |
| Intervalles 30/30 | nombre de séries | **6** | décision du 29/10 (aucune valeur documentée) ; constantes 30 s / 30 s imposées par FMT-19 |
| EMOM | fenêtre W | **60 s** | REC-10 |
| EMOM | nombre de tours N | **6** | REC-10 |
| AMRAP | durée | **12:00** | décision du 29/10 (aucune valeur documentée) |
| For time | échelle, volume par tour | **21 · 15 · 9** | FMT-30, FMT-32 |
| Death by | départ q0 | **1** | FMT-33 |
| Death by | incrément d | **1** | FMT-33 |
| Death by | fenêtre W | **1 min** | FMT-33 |

**Effet documentaire.** Deux réserves générales interdisaient jusqu'ici de promouvoir un chiffre illustré en valeur par défaut : `docs/INDEX.md`, « les valeurs de démonstration des captures ne définissent pas les calculs », et FMT-19, « ne pas déduire d'un chiffre de maquette une règle supplémentaire ». Par la décision du 29/10, et **pour ces valeurs seulement**, ces réserves cessent de s'appliquer : les valeurs ci-dessus deviennent les valeurs initiales documentées des réglables. Aucune autre valeur illustrée dans Figma ou dans les recettes ne devient un défaut. Classe **B** de la règle permanente de synchronisation.

**Nature.** Une valeur initiale est **proposée et modifiable** ; elle ne devient jamais une contrainte. Elle ne doit pas être confondue avec une **valeur imposée et verrouillée** : celles-ci restent exactement celles que les règles de Format désignent comme non modifiables (FMT-10 et FMT-17 pour Tabata, les constantes de FMT-19 pour le 30/30, FMT-30 et FMT-31 pour le For time).

**Débloqué.** La mise à disposition (activation dans la grille) de chacun des six Formats. Plus aucun Format ne reste indisponible faute de valeur initiale. Le registre C.1 porte ces valeurs comme données.

## 3. ARB-22c — Contenu initial des cinq départs rapides

**Question posée.** Paramètres et, le cas échéant, Mouvements préremplis pour chacun des cinq départs rapides : Renforcement, Gainage · Mobilité, Superset, Progression, À l'échec.

**[À CLARIFIER] OUVERT. En attente de définition fonctionnelle de Hermann.** Aucune valeur n'est proposée, déduite ni inventée, conformément à la contrainte de mission et à P-2 (« ne jamais inventer une règle »). La réserve applicable est écrite : « les exemples 3 × 15, postures, deux exercices enchaînés, 10 · 12 · 14 et trois séries à l'échec sont des préremplissages de leurs modèles respectifs, pas des constantes du moteur » (ch10 l.1524).

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

1. **Compatibilité des séries.** Ce que le Circuit fait au nombre de séries de ses membres. Cet examen est **tranché par des règles écrites** : ch10 l.1050 à 1057, où un **Circuit à séries groupées** laisse le nombre de séries « propre à chaque exercice, indépendant d'un exercice à l'autre » et fait exécuter à chaque passage « toutes les séries de chaque exercice », tandis qu'un **Circuit à séries alternées** le rend « identique pour tous, hérité du circuit » et « ne crée pas de paramètre, il contraint un paramètre existant » ; et ch10 l.1150 à 1156, qui règle l'ajout, le déplacement et la sortie.
2. **Compatibilité du Format.** Ce que le Circuit fait aux autres prescriptions : fenêtres, borne globale, progression dynamique, condition de fin, et coexistence éventuelle de deux Formats sur deux niveaux. **Aucune de ces règles ne tranche cela.** Elles décrivent une mécanique de séries, pas un régime de compatibilité entre Formats.

La règle du §4.4 ne couvre que le premier examen, et l'étend au second là où une règle de Format le permet. Le reste est **à clarifier** (§4.5). C'est la raison du passage d'ARB-26 en partiellement clos.

### 4.3 Matrice des issues

Issues possibles : **ADMIS** · **ADMIS AVEC CONFIRMATION** · **REFUSÉ** (sans altération des paramètres ni des données) · **À CLARIFIER** (aucune décision, aucune règle inventée). Les six Formats sont couverts ; chaque cellule porte une issue déterminée, conditionnelle le cas échéant.

| Format de l'Exercice entrant | Circuit **libre groupé** | Circuit **libre alterné** | Circuit **formaté** |
|---|---|---|---|
| **Tabata** | **ADMIS** — aucune série touchée (l.1053-1054) ; les 8 séries, 20 s et 10 s de FMT-10 et FMT-17 restent effectives ; le compte du Circuit répète le passage complet | **ADMIS si N = 8** — la séquence obtenue est littéralement FMT-13, `A1 B1 … A8 B8`, avec le compte commun de FMT-14. **REFUSÉ si N ≠ 8** — le Circuit contraindrait un compte que le Format impose | **À CLARIFIER — a** |
| **Intervalles 30/30** | **ADMIS** — constantes 30 s / 30 s de FMT-19 et compte réglé intacts ; la prescription est une série suivie d'une pause, non une fenêtre continue | **REFUSÉ** — le sélecteur d'organisation « est explicitement décidé pour Tabata, EMOM et Progression » (ch10 l.1495) ; le 30/30 n'en a pas, son exécution en alternance n'est décrite nulle part | **À CLARIFIER — a** |
| **EMOM** | **ADMIS si l'EMOM est le seul membre du Circuit**, les fenêtres restant alors contiguës. **À CLARIFIER — e** si le Circuit a d'autres membres | **ADMIS AVEC CONFIRMATION** — le sélecteur « En alternance » est décidé pour l'EMOM (FMT-20, ch10 l.1495) et le déplacement vers un Circuit à séries alternées suit « la même adaptation » à N (ch10 l.1156) ; confirmation si et seulement si des valeurs sont perdues (ch10 l.1077) | **À CLARIFIER — a** |
| **For time** | **À CLARIFIER — c** | **REFUSÉ** — le sélecteur d'organisation est « explicitement exclu pour For time » (ch10 l.1495, FMT-31) et « interdit For time » (ch11 l.314) ; un Circuit alterné lui imposerait l'organisation que les règles refusent | **À CLARIFIER — a et c** |
| **AMRAP** | **À CLARIFIER — d** | **REFUSÉ** — aucun nombre de séries à contraindre : les tours sont « un résultat, pas une borne saisie » (FMT-26). Un Circuit alterné n'a rien sur quoi s'appliquer | **À CLARIFIER — a et d** |
| **Death by** | **À CLARIFIER — d** | **REFUSÉ** — le rang de fenêtre est déduit de l'horloge (FMT-33) ; aucun compte de séries n'existe | **À CLARIFIER — a et d** |

**Couverture.** Dix-huit situations, aucune sans issue. **Huit cellules sont tranchées sans réserve** : Tabata groupé et alterné, 30/30 groupé et alterné, EMOM alterné, For time alterné, AMRAP alterné, Death by alterné. **Dix cellules portent une clarification**, dont l'EMOM groupé, admis lorsque le Circuit n'a pas d'autre membre.

**Les clarifications ne sont pas disjointes**, contrairement à ce qu'affirmait la version 2 : treize mentions se répartissent sur dix cellules, car trois cellules de la colonne « Circuit formaté » en portent deux. Répartition : **a** 6 cellules, **c** 2, **d** 4, **e** 1. **Ordre de résolution :** **a** se tranche d'abord, puisqu'il décide si une dépose dans un Circuit formaté est possible ; c et d ne sont examinés pour ces trois cellules que si a l'admet. Si a est arbitré seul, les trois cellules For time formaté, AMRAP formaté et Death by formaté restent ouvertes au titre de c et de d.

**Limite de la matrice.** La colonne « Circuit formaté » ne croise pas la nature groupée ou alternée de la destination, alors que la revue demandait de séparer les deux dimensions. L'effet est nul en l'état, les six cellules portant la même issue, mais l'arbitrage **a** devra distinguer les deux natures.

### 4.4 Règles établies

**[DÉCIDÉ]** Deux examens, tranchés par les sources citées.

**Circuit à séries groupées.** Il ne touche pas au nombre de séries de ses membres ; son compte répète intégralement leur passage (l.1053-1054). Un Exercice portant un Format dont la prescription est une série suivie d'une pause (Tabata, 30/30) y entre donc sans qu'aucun paramètre, imposé ou réglé, ne soit modifié : **ADMIS**. La répétition multiplie le nombre de séries effectivement exécutées, ce que Hermann a explicitement accepté et qu'ARB-25 illustre déjà pour le Cycle (« Tabata A et B placé dans un Cycle × 2 → 16 séries par Exercice »).

Trois Formats échappent à cette démonstration, le compte du Circuit agissant alors sur autre chose que des séries : l'EMOM, dont la prescription est une **fenêtre continue** (clarification e) ; le For time, dont le volume est **déjà indexé par tour** (clarification c) ; l'AMRAP et le Death by, dont la fin est **conditionnelle** (clarification d).

**Circuit à séries alternées.** Il impose son compte N aux séries de ses membres et les entrelace (l.1053, l.1057). Le régime de l'entrant est écrit : il « conserve son régime et ses paramètres, puis son exemplaire de séance est adapté à N », avec « confirmation avant application » s'il faut retirer des séries, et « déplacement vers un autre circuit à séries alternées selon la même adaptation » (ch10 l.1152, l.1156) ; la confirmation s'affiche « si et seulement si au moins un exercice perd des valeurs » (ch10 l.1077). La sortie est également écrite : elle « conserve le nombre actif et les paramètres actuels » (l.1154).

Appliqué à un Exercice formaté, ce régime donne quatre cas selon le statut de son nombre de séries :

| Statut du nombre de séries | Issue | Justification |
|---|---|---|
| **Imposé et égal à N** | **ADMIS** | Aucune valeur n'est changée ; la séquence obtenue est la forme canonique du Format. Cas sourcé : Tabata, N = 8 (FMT-13, FMT-14) |
| **Imposé et différent de N** | **REFUSÉ** | L'adaptation à N de l.1152 écraserait une valeur que le Format impose, ce que le critère du §4.1 interdit |
| **Réglable, et le Format admet l'organisation alternée** | **ADMIS AVEC CONFIRMATION** | Régime de l.1152 et l.1156, confirmation de l.1077. Seul cas sourcé : l'EMOM (FMT-20, ch10 l.1495) |
| **Format n'admettant pas l'organisation alternée**, ou nombre de séries qui est un **résultat** | **REFUSÉ** | 30/30 et For time : sélecteur non décidé ou explicitement exclu (ch10 l.1495, FMT-31, ch11 l.314). AMRAP et Death by : aucun paramètre de séries à contraindre (FMT-26, FMT-33) |

La version 2 déclarait ce dernier examen indéterminé en écrivant « aucune règle ne le dit ». C'était faux : les règles d'ajout, de déplacement et de sortie du circuit à séries alternées sont écrites en ch10 l.1150 à 1156, et la règle de confirmation en l.1077. La clarification b de la version 2 est donc **supprimée**, résolue par ces règles.

### 4.5 Les cas soumis à arbitrage

**[À CLARIFIER — a] Circuit de destination lui-même formaté, et sort du Format à la sortie.**
Cas concret : un Exercice EMOM est déposé dans un Circuit Tabata groupé. Deux Formats portent alors des prescriptions simultanées sur le même contenu. Rien dans les sources ne décide lequel prévaut.
Options : **a1** refus de toute dépose dans un Circuit formaté ; **a2** admis uniquement si le Circuit porte le même Format aux mêmes réglages, l'Exercice devenant simple membre et son Format propre disparaissant au profit de celui du Circuit, refusé sinon ; **a3** admis avec confirmation, le Format du Circuit absorbant celui de l'Exercice. L'arbitrage doit aussi dire si un Exercice qui **quitte** ensuite ce Circuit retrouve un Format, et lequel, la règle de sortie de l.1154 ne traitant que le nombre de séries et les paramètres, pas l'identité du Format. Il doit enfin distinguer les destinations groupée et alternée.
Recommandation : **a2**. C'est la seule option qui n'invente aucun régime de priorité entre deux Formats et qui conserve le principe « un porteur, un Format » d'ARB-03. Elle couvre le besoin réel, réunir deux éléments de même Format, et refuse les combinaisons dont aucune règle ne décrit l'exécution.

**[À CLARIFIER — c] For time porté par un Exercice, déposé dans un Circuit groupé.**
La table des porteurs du plan (`architecture-pre9.md` §5 l.66 et §7 l.99) prévoit un For time porté par un **Exercice ou** un Circuit. Le cas existe donc. FMT-30 et FMT-32 indexent le volume par tour ; un Circuit groupé qui répète ce bloc multiplie une échelle déjà indexée par tour, et aucune règle ne dit si la seconde exécution reprend l'échelle à son premier terme ou la prolonge.
Options : **c1** refus, l'échelle par tour étant déjà un mécanisme de tours ; **c2** admis, chaque passage rejouant l'échelle complète depuis son premier terme ; **c3** admis, l'échelle étant prolongée.
Recommandation : **c1**. Le For time est le seul Format dont le paramètre principal est déjà indexé par tour ; lui superposer le compte d'un Circuit crée exactement la double multiplication que ch11 l.315 (« aucun double multiplicateur série × tour ») et ch10 l.1506 (« éviter de multiplier une seconde fois les séries et les tours ») proscrivent.

**[À CLARIFIER — d] AMRAP et Death by répétés, par un Circuit groupé comme par un Cycle.**
Deux obstacles sourcés. Pour l'**AMRAP**, FMT-26 fixe une borne globale : une répétition d'ordre k doit dire si la borne de 12:00 est réarmée à chaque occurrence, soit k bornes successives, ou si une borne unique s'y substitue. Pour le **Death by**, **FMT-34** énonce qu'« un seul bouton met fin à la **séance** » : la règle écrite ne connaît pas la fin d'un bloc Death by suivie d'autre chose. Répéter le bloc exige donc de décider ce qui termine une occurrence sans terminer la séance, et ce qui déclenche la suivante.
**Cette question n'est pas créée par ARB-26 et ne disparaît pas en refusant le Circuit.** ARB-25 admet déjà que, « pour AMRAP et Death by, le Cycle répète éventuellement le bloc complet sans remplacer leurs progressions ni leurs conditions de fin, le comportement d'une nouvelle exécution étant dérivé de leurs spécifications » ; or ces spécifications ne décrivent pas cette nouvelle exécution. La clarification porte donc sur les deux conteneurs.
Options : **d1** arbitrer d'abord le comportement d'une occurrence répétée, réarmement de la borne AMRAP et fin de bloc Death by distincte de la fin de séance, puis admettre la répétition par les deux conteneurs ; **d2** réserver la répétition de ces deux Formats au Cycle seul, en arbitrant le même comportement, et refuser la dépose dans un Circuit.
Recommandation : **d1**. Le comportement doit être écrit de toute façon pour le chemin du Cycle, déjà ouvert par ARB-25 ; une fois écrit, rien ne distingue le Circuit groupé, dont le compte répète le passage complet de ses membres.

**[À CLARIFIER — e] EMOM répété par un Circuit groupé comportant d'autres membres.**
FMT-23 énonce que « chaque fenêtre va jusqu'à son terme ; la suivante commence à l'échéance ». Dans un Circuit groupé d'au moins deux membres, les autres membres s'exécutent entre deux passages, donc entre deux fenêtres de l'EMOM, ce qui rompt cette contiguïté. S'y ajoute la valeur affichée : FMT-21 calcule la durée du bloc et ch10 l.1506 précise que « la fenêtre commune et le nombre total de fenêtres restent identiques », sans dire ce que devient ce total sous un compte de Circuit.
Options : **e1** refus de la dépose d'un EMOM dans un Circuit groupé de plusieurs membres ; **e2** admis, chaque passage rouvrant une série de fenêtres contiguës, le total affiché étant multiplié par le compte ; **e3** admis avec confirmation, le compte du Circuit étant reporté sur le nombre de tours de l'EMOM plutôt que superposé.
Recommandation : **e2**, qui traite l'interruption entre passages comme une frontière de passage et non comme une rupture de fenêtre, par cohérence avec le traitement d'un Cycle (RM-252 : « les circuits du cycle conservent leur compte propre ; le cycle répète leur développement complet »). e3 est à écarter : il ferait du compte du Circuit un réglage du Format, contre l.1053.

### 4.6 Statut et portée

**Ce qui est clos.** Le critère du §4.1 et les règles du §4.4, soit les **huit cellules** de la matrice tranchées sans réserve. Ces huit issues peuvent être propagées.

**Ce qui reste ouvert.** Les **dix cellules** portant une clarification, regroupées en quatre arbitrages a, c, d, e. **ARB-26 ne doit pas être déclaré clos ni propagé comme règle normative complète.** Tant que ces arbitrages ne sont pas rendus, ces dépôts sont **refusés sans altération** dans B.4 et C.4, conformément à la position de repli déjà prévue par le plan, à l'exception de l'EMOM seul membre d'un Circuit groupé, admis.

**Ce que la règle remplace.** Les options A, B et C de `arbitrages-pre9.md` §2 bis. Elle est plus large que l'option **B** (« admis dans un Circuit libre groupé de compte 1 ») sur un point établi : tout Circuit libre groupé est admis pour le Tabata et le 30/30, quel que soit son compte.

## 5. ARB-27 — Second Exercice pour un Format porté par un Exercice unique

**Question posée.** Comment ajouter un second Exercice à un Format porté par un Exercice unique. Options : A, poser un Circuit sur l'Exercice formaté fait passer le Format à ce Circuit ; B, refus, l'élément doit être recréé par l'entrée « Format ».

Les quatre composantes de la réponse n'ont pas le même statut, et la revue a eu raison d'exiger qu'elles soient séparées. **L'option A n'est pas retenue en bloc** : seuls les points 1 et 3 sont décidés.

**[DÉCIDÉ] 1. Le second Exercice entrant adopte le Format du premier.** Hermann, 29/10 :

> « Le cas est-il que nous avons un circuit et un exercice formatés, et que si on y fait entrer un deuxième exercice, celui-ci adopte le format du premier exercice ? Si c'est le cas je suis d'accord. »

Si des valeurs qu'il portait sont remplacées par des valeurs imposées, confirmation préalable : ARB-24, et ch10 l.1077, « une fenêtre de confirmation, Annuler / Confirmer, s'affiche si et seulement si au moins un exercice perd des valeurs ». Pour l'EMOM, l'arrivée du second Exercice **conserve le nombre de tours** et recalcule la durée (FMT-22, illustré par REC-11 : « ajouter un troisième exercice, 6 tours conservés, 18 min »).

**[PROPOSÉ] 2. Poser un Circuit sur un Exercice formaté fait remonter le Format au Circuit, réglages inchangés.** Ce mécanisme est cohérent avec ARB-03, qui dit qu'« un Format est porté par un Circuit, lorsque son organisation nécessite un Circuit ; un Exercice, lorsqu'un Circuit n'est pas nécessaire » : passer d'un à deux Exercices change le porteur approprié. Mais la décision citée au point 1 porte sur l'adoption du Format par le second Exercice, pas sur le transfert de propriété du Format de l'Exercice vers le Circuit. **À confirmer** avant propagation. L'option B, refus et recréation par l'entrée « Format », reste l'alternative si le transfert n'est pas voulu.

**[DÉCIDÉ] 3. La question d'organisation est posée à l'arrivée du second Exercice, pour les seuls Formats qui admettent le sélecteur.** La règle est écrite : « ce sélecteur est explicitement décidé pour Tabata, EMOM et Progression, et explicitement exclu pour For time » (ch10 l.1495), confirmée par ch11 l.314, « Tabata/EMOM/Progression selon règles ; interdit For time ». FMT-11 ajoute, pour Tabata, qu'« avec un exercice unique, la question est inutile ». La version 2 présentait cette formulation comme à valider : elle est déjà normative.

**[PROPOSÉ] 4. Death by exclu tant que le raccordement multi-Exercices n'est pas démontré.** La réserve de ch05 l.484 exige que « le rang global, le changement d'exercice et l'incrément soient explicitement raccordés si le parcours autorise plusieurs exercices », et précise que « l'exemple d'un exercice ne prouve pas ce raccordement ». Mais la même section énonce aussi que « ces points ne remettent pas en question les décisions consignées ; ils ne constituent pas des blocages démontrés » (l.487). La réserve **n'interdit donc pas** : l'exclusion du Death by est une prudence proposée, pas une règle. La version 2 la qualifiait à tort de décidée et affirmait que R-03 « s'y oppose ». À arbitrer : exclure le Death by de ce geste, ou le permettre en raccordant le rang global.

**[À CLARIFIER]** Si l'un des deux Exercices quitte ensuite le Circuit, le Format revient-il à l'Exercice restant ? La règle de sortie de ch10 l.1154 ne traite que le nombre de séries et les paramètres, pas l'identité du Format. Question traitée avec la clarification **a** du §4.5, qui porte le même sujet.

**Débloqué.** Les points 1 et 3 peuvent être propagés. Le geste complet, Circuit posé sur un Exercice formaté, reste suspendu aux points 2 et 4 dans C.4.

## 6. ARB-28 — Position d'un Circuit formaté inséré par l'entrée « Format »

**Question posée.** Où insérer un Circuit formaté créé par l'entrée « Format » quand la position d'ARB-07, après le dernier Exercice entré dans son conteneur, se trouve à l'intérieur d'un Circuit. Options : A, juste après ce Circuit dans le même parent ; B, à la fin du niveau Séance.

**[DÉCIDÉ] Option A**, avec la précision de Hermann : « A, juste après, même parent = Cycle si applicable. »

Le Circuit formaté est inséré **immédiatement après le Circuit qui contient le dernier Exercice entré, dans le parent de ce Circuit**. Ce parent est le **Cycle** lorsque le Circuit est membre d'un Cycle, et le niveau Séance sinon. L'élément n'est jamais imbriqué dans le Circuit existant (D-451, pas d'imbrication Circuit dans Circuit) et n'est jamais renvoyé à la fin de la Séance alors que le travail en cours se situe dans un Cycle.

**Débloqué.** Ce seul cas d'insertion, dans C.4. La revue a confirmé la conformité de ce point.

## 7. Décisions de principe confirmées, et précision apportée à ARB-25

Ces points n'étaient pas des questions du §2 bis. Ils ont été tranchés le 29/10 pendant l'examen d'ARB-26 et conditionnent la lecture des réponses ci-dessus.

**[DÉCIDÉ] 1. ARB-03 est conservé ; la simplification « toujours un Circuit » est abandonnée.** La proposition examinée consistait à faire porter tout Format par un Circuit, même à un seul Exercice. Hermann : « On conserve la règle qui est qu'un format peut être porté par un exercice, et on abandonne l'idée d'utiliser systématiquement un circuit. » Un Format à un seul Exercice reste donc porté par cet Exercice.

**[DÉCIDÉ] 2. Un Exercice formaté peut être répété par un Circuit ou par un Cycle.** Ses paramètres d'exécution, imposés pour certains, ne lui interdisent pas d'être ensuite répété. C'est le fondement de la colonne « Circuit libre groupé » du §4.3, dans les limites qu'elle énonce.

**[DÉCIDÉ] 3. Précision datée du 29/10/2026 apportée à ARB-25.** ARB-25 énonçait que « le Cycle est le mécanisme permettant de répéter intégralement un élément formaté ». Cette formulation est désormais lue comme une **attribution de rôles**, non comme l'interdiction pour un Circuit de répéter un élément formaté. Hermann : le Circuit, en multipliant les exécutions par son nombre de tours, « est dans son rôle, il ne fait pas le travail du cycle, il fait le sien ». Portée de chaque mécanisme après cette précision :

| Mécanisme | Ce qu'il répète | Ce qu'il ne fait jamais |
|---|---|---|
| **Circuit groupé** | les passages complets de **ses membres**, selon son compte | créer ou modifier le nombre de séries d'un membre (ch10 l.1053) |
| **Circuit alterné** | les séries de même indice de ses membres, entrelacées | créer un paramètre : il contraint un paramètre existant (ch10 l.1057) |
| **Cycle** | la **séquence entière** qu'il contient, qui peut comprendre plusieurs Circuits et plusieurs éléments formatés ; les Circuits du Cycle « conservent leur compte propre » (RM-252) | remplacer le nombre de séries d'un Circuit (ARB-25) |
| **Format** | rien : il **prescrit** séries, fenêtres, progression, borne et terminaison | céder une prescription imposée à un conteneur |

**Interdiction de double comptage, maintenue.** Un seul mécanisme de répétition s'applique à un niveau donné. Aucune répétition ne transforme silencieusement la borne ni la condition d'arrêt d'un Format : c'est ce que les clarifications c, d et e préservent, en n'admettant pas les combinaisons où ce risque existe. Sources : ch11 l.315 (« aucun double multiplicateur série × tour »), ch10 l.1506 (« éviter de multiplier une seconde fois les séries et les tours »), ch05 l.485 (« l'EMOM Par exercice ne doit pas multiplier à la fois séries et tours »), FMT-18 et FMT-25 (aucune pause ni repos compté deux fois).

## 8. Conséquences sur le plan et sur la documentation

À traiter dans la révision suivante du plan, puis dans la story qui livre le comportement, selon la règle permanente de synchronisation code / documentation. **Seules les parties closes sont propageables** ; les clarifications a, c, d, e, les points 2 et 4 d'ARB-27 et ARB-22c ne donnent lieu à aucune correction normative.

### 8.1 Artefacts de planification PRE-9

| Artefact | Section | Action |
|---|---|---|
| `arbitrages-pre9.md` | §1 ARB-04 | Passer en **CLOS** ; recopier la table du §2 ; conserver et annoter la formulation remplacée |
| `arbitrages-pre9.md` | §2 bis | ARB-04 et ARB-28 **CLOS** ; ARB-26 et ARB-27 **PARTIELLEMENT CLOS** avec leurs cas ouverts ; ARB-22c inchangé ; ajouter les arbitrages a, c, d, e |
| `arbitrages-pre9.md` | §0 bis, conséquences 4 à 6 | Remplacer les mentions « non décidé », « non déductible », « non défini » par les règles des §4.4, §5 et §6, avec leurs réserves |
| `arbitrages-pre9.md` | §5, l.190 et l.201 | **Instructions de propagation devenues inexactes** par la précision du §7 point 3 : « la répétition intégrale d'un Tabata se fait par un Cycle » (annotation prévue sur FMT-12) et « répétition par Cycle dans la Composition » (annotation prévue sur CE-FMT-02) doivent être reformulées, le Circuit groupé répétant aussi |
| `prd-pre9.md` | exigences de Composition | Valeurs initiales ; règles de dépose closes ; conservation du Format ; position d'insertion |
| `architecture-pre9.md` | §§2 et 3 | Propriété du Format et transition Exercice vers Circuit ; conservation lors des mutations et de la persistance ; cas de deux niveaux porteurs laissé ouvert |
| `architecture-pre9.md` | §5 l.66 et §7 l.99 | Statut du nombre de séries par Format, imposé, réglable ou résultat : entrée de la règle du §4.4. Confirmer la ligne For time porté par un Exercice, qui ouvre la clarification c |
| `architecture-pre9.md` | §6 | Contrat Composition vers Exécution pour les éléments formatés répétés ; cas de contraintes concurrentes laissés ouverts |
| `epics.md` | C.1 | Valeurs initiales comme données du registre des Formats |
| `epics.md` | C.3 | Paramètres imposés ; tests de conservation des valeurs lors d'une dépose admise ; adaptation à N avec confirmation |
| `epics.md` | B.4 et C.4 | Les huit issues closes du §4.3 ; refus sans altération pour les dix autres, hors EMOM seul membre ; points 1 et 3 d'ARB-27 ; position d'ARB-28 |
| `epics.md` | D.1 et D.3 | Développement des occurrences d'un élément formaté répété ; descripteurs de capacités et bornes |
| `epics.md` | C.5 | Inchangé, conditionné à ARB-22c |
| `etat-initial-et-ecarts.md` | §2, matrice | Statut réel des dépendances : closes, partiellement closes, ouvertes |
| `README.md`, `implementation-artifacts/sprint-status.yaml` | statuts | Statuts d'arbitrage et dépendances localisées |

### 8.2 Documentation normative, contrôle ciblé

Modification seulement si une dépendance réelle est confirmée. Classe B pour les décisions validées, classe A pour les règles citées sans modification.

| Document | Conséquence à vérifier |
|---|---|
| ch07 Registre des décisions | Nouvelles décisions du 29/10 ; précision datée apportée à ARB-25 (§7 point 3) ; distinction entre arbitrage et mécanisme proposé |
| ch08 Conception | Entrée et sortie d'un Circuit, adoption éventuelle d'un Format, position d'insertion |
| ch09 Données | Propriété du Format après transfert Exercice vers Circuit ; présence simultanée d'un Format sur deux niveaux |
| ch10 règles de Format | Valeurs initiales décidées. **Règle de compatibilité distincte** de la mécanique des séries : l.1050-1057, l.1077 et l.1150-1156 restent citées sans modification (classe A) et ne portent pas à elles seules la règle d'ARB-26 |
| ch11 API fonctionnelles | Contrôle de compatibilité avant mutation : accepté, accepté après confirmation, refusé, et motif |
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
| ARB-26 a | Circuit de destination formaté, groupé ou alterné ; sort du Format à la sortie | Six cellules du §4.3 ; sortie d'ARB-27 |
| ARB-26 c | For time porté par un Exercice, déposé dans un Circuit groupé | Deux cellules du §4.3 |
| ARB-26 d | AMRAP et Death by répétés, par un Circuit comme par un Cycle | Quatre cellules du §4.3 ; comportement d'une occurrence répétée sur le chemin du Cycle, déjà ouvert par ARB-25 |
| ARB-26 e | EMOM répété par un Circuit groupé de plusieurs membres | Une cellule du §4.3 |
| ARB-27 point 2 | Transfert du Format de l'Exercice vers le Circuit posé sur lui | Le geste complet de C.4 |
| ARB-27 point 4 | Exclusion ou admission du Death by dans ce geste | Ce geste pour le Death by |

Les trois écarts du §9 ne bloquent aucune story PRE-9.

## 11. Traitement des huit constats de la revue ChatGPT

| Constat | Statut | Référence normative vérifiée | Correction apportée | Limite |
|---|---|---|---|---|
| **1.** §4.1 « Circuit groupé toujours admis » non démontré | **Corrigé, avec contestation partielle** | ch10 l.1053-1054 ; FMT-23 ; FMT-26 ; FMT-34 | « Toujours admis » retiré. ADMIS conservé pour le Tabata et le 30/30, dont la prescription est une série suivie d'une pause. EMOM, For time, AMRAP et Death by sortent vers les clarifications e, c et d | La contestation portait sur l'extension aux six Formats. Le contrôle indépendant a montré que la version 2 maintenait encore l'EMOM à tort : corrigé par la clarification e |
| **2.** §4.2 matrice incomplète : six Formats, For time, EMOM N différent, 30/30, destination formatée | **Corrigé** | ch10 l.1495 ; l.1152, l.1156, l.1077 ; FMT-20 ; FMT-31 ; ch11 l.314 ; `architecture-pre9.md` §5 l.66 et §7 l.99 | Matrice §4.3 de six Formats × trois destinations, dix-huit situations, chacune avec une issue déterminée | La colonne « Circuit formaté » ne croise pas la nature groupée ou alternée : limite énoncée au §4.3, à lever par l'arbitrage a |
| **3.** §4 séparer compatibilité des séries et du Format ; deux niveaux porteurs ; sortie | **Corrigé** | ch10 l.1050-1057 et l.1150-1156 ne tranchent que les séries | §4.2 pose les deux examens. La coexistence de deux Formats et la sortie de l'Exercice deviennent la clarification a | Aucune règle inventée : le cas est soumis à arbitrage, non refermé |
| **4.** §5 ARB-27 : distinguer validé, proposé, non arbitré | **Corrigé** | ch10 l.1495 ; ch11 l.314 ; FMT-11 ; FMT-22 ; REC-11 ; ch05 l.484 et l.487 ; ch10 l.1077 | Les quatre composantes qualifiées séparément. Points 1 et 3 [DÉCIDÉ], points 2 et 4 [PROPOSÉ]. L'option A n'est pas retenue en bloc | Le point 3, que la version 2 donnait à valider, s'est révélé déjà normatif ; le point 4, qu'elle donnait pour décidé, ne l'est pas |
| **5.** §7 tracer la précision apportée à ARB-25, sans double comptage | **Corrigé** | ARB-25 ; ch11 l.315 ; ch10 l.1506 ; ch05 l.485 ; FMT-18 ; FMT-25 ; RM-252 | §7 point 3 porte la précision datée, la table de portée des quatre mécanismes et l'interdiction de double comptage | Les sources de l'interdiction citées en version 2 étaient inexactes : corrigées |
| **6.** §8 impacts incomplets ; ne pas tout attribuer à la mécanique des séries | **Corrigé** | Existence vérifiée de CE-FMT-01 à CE-FMT-06, des chapitres 07 à 13, du PRD, de `etat-initial-et-ecarts.md`, du `README.md`, de `sprint-status.yaml`, des deux documents DSF et matrice Formats | §8 scindé en artefacts de planification et documentation normative ; les quinze documents de la revue intégrés ; ajout du §5 du plan, dont deux instructions de propagation deviennent inexactes | Aucune |
| **7.** §9 qualifier les écarts d'exécution comme non démontrés | **Corrigé pour le plafond de temps, contesté pour l'appui** | « plafond de temps » absent de `docs/` au commit `c73079e9` ; FMT-32 ; FMT-35 ; `RM-PRE5-02` | Le plafond For time devient « décision rapportée, source à retrouver ». Les trois points passent en [À CLARIFIER] | La version 1 ne tirait aucun argument d'analogie sur l'appui : elle constatait l'absence de règle et citait FMT-35 comme modèle. La qualification explicite est néanmoins ajoutée |
| **8.** Seconde passe : issue explicite pour chaque situation, sans trou ni recouvrement | **Corrigé** | — | Quatre issues définies et appliquées aux dix-huit situations ; §10 consolide les sept points ouverts | Le recouvrement existe et est désormais **énoncé** : trois cellules portent deux clarifications, avec l'ordre de résolution. La version 2 affirmait à tort la disjonction |

## 12. Traitement du contrôle indépendant de la version 2

Vingt-et-un défauts relevés, treize bloquants. Tous vérifiés par lecture directe des sources avant correction ; aucun n'a été écarté.

| Défauts | Nature | Correction |
|---|---|---|
| 1, 4, 8 (couverture et unicité) | La version 2 affirmait la disjonction des clarifications et l'unicité des issues ; trois cellules en portaient deux, et la cellule Tabata alterné porte une issue conditionnelle | §4.3 énonce le recouvrement, le dénombre (13 mentions sur 10 cellules) et pose l'ordre de résolution. « Issue unique » devient « issue déterminée, conditionnelle le cas échéant » |
| 2, 3 (dénombrement) | **Défaut matériel** : la version 2 annonçait onze cellules propageables et sept ouvertes, là où six étaient closes et douze ouvertes. En l'état, la révision du plan aurait propagé cinq cellules non établies | Dénombrement refait et vérifié cellule par cellule : après les autres corrections, **huit** closes et **dix** portant une clarification. Repris au §4.6 et au §10 |
| 5, 6, 7, 8, 21 (citations) | Cinq citations inexactes : ch10 l.1524 porte sur les préremplissages des départs rapides, non sur les chiffres de Figma ; l'interdiction de double multiplication est à ch11 l.315, non l.313-314, et CE-FMT-02 §12 ne la porte pas ; RM-252 n'énonce aucune interdiction ; CE-FMT-03 §14 ne porte pas la règle de confirmation ; la mécanique des séries s'étend de l.1050 à l.1057 | Remplacées par `docs/INDEX.md` et FMT-19 (§2), ch11 l.315 et ch10 l.1506 (§4.5 c, §7), RM-252 cité seulement comme règle de développement du Cycle, ch10 l.1077 pour la confirmation, et le bloc l.1050-1057 |
| 9, 15 (règle déclarée inexistante) | La version 2 écrivait « aucune règle ne le dit » sur le compte réglable en Circuit alterné. **Faux** : ch10 l.1152, l.1154 et l.1156 règlent l'ajout, le déplacement et la sortie, avec adaptation à N et confirmation. Et FMT-22, invoqué comme obstacle, régit la composition **à l'intérieur** du bloc EMOM, non la dépose dans un Circuit hôte | La clarification b est **supprimée**, résolue : EMOM alterné devient ADMIS AVEC CONFIRMATION, 30/30 alterné REFUSÉ sur ch10 l.1495. FMT-22 est déplacé au §5 point 1, où il s'applique |
| 10 (règle déclarée à valider) | Le sélecteur d'organisation est déjà arbitré par ch10 l.1495 et ch11 l.314 | ARB-27 point 3 passe en [DÉCIDÉ] et quitte la liste des points ouverts |
| 11, 16 (qualifications) | L'exclusion du Death by d'ARB-27 était donnée pour décidée et appuyée sur une opposition de R-03 qui n'existe pas (ch05 l.487 : « ne constituent pas des blocages démontrés ») ; et « option A retenue » n'était porté par aucune citation | Point 4 en [PROPOSÉ], mention de l'opposition retirée ; le chapeau du §5 dit que l'option A n'est pas retenue en bloc |
| 12, 14 (asymétrie EMOM) | L'EMOM en Circuit groupé était déclaré ADMIS par assertion, sur une analogie avec RM-252, alors que FMT-23 impose des fenêtres contiguës que les autres membres rompent | Nouvelle clarification **e**. L'EMOM groupé devient ADMIS s'il est seul membre, À CLARIFIER sinon. L'analogie est déplacée dans la justification de la recommandation e2, où elle est présentée comme telle |
| 13 (périmètre de d) | La recommandation refusait le Circuit au motif que « le Cycle couvre le besoin » ; ARB-25 renvoie au contraire le comportement d'une occurrence répétée aux spécifications des Formats, qui ne le décrivent pas | La clarification d porte désormais sur le Circuit **et** le Cycle ; la justification inexacte est retirée et la recommandation devient d1, arbitrer le comportement avant d'admettre l'un ou l'autre |
| 17 (dimensions) | La séparation destination libre / formatée ne croisait pas la nature groupée / alternée | Limite énoncée au §4.3 et portée dans l'arbitrage a |
| 18 (propagation) | Le §5 du plan instruit d'annoter FMT-12 et CE-FMT-02 par « répétition par Cycle », formulation que le §7 point 3 contredit | Ligne ajoutée au §8.1 |
| 19, 20 (références) | Renvoi à un « §7.3 » inexistant ; élargissement attribué à l'option C au lieu de B | Corrigés |

**Trois points relèvent d'un arbitrage de Hermann et non d'une correction rédactionnelle**, et sont portés au §10 : l'exclusion du Death by du geste d'ARB-27 (point 4), le comportement d'une occurrence répétée pour l'AMRAP et le Death by (clarification d), et la contiguïté des fenêtres d'un EMOM répété (clarification e).

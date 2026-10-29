# PRE-9 — Réponses aux questions ouvertes du plan (Hermann, 29/10/2026)

> **Objet.** Ce document répond **point par point** aux questions encore ouvertes du plan PRE-9, telles qu'elles sont posées par `arbitrages-pre9.md` §2 bis (révision 2) : **ARB-04, ARB-22c, ARB-26, ARB-27, ARB-28**. Il consigne les arbitrages de Hermann du 29/10/2026. Aucune décision close n'est rouverte.
>
> **Base.** Branche de planification `pre9-bmad/plan`, commit `265f3d9d`. Documentation normative : `main`, commit `c73079e9`.
>
> **Portée.** Ce document est la **source** à partir de laquelle `arbitrages-pre9.md`, `architecture-pre9.md` §5 et la propagation normative §5 seront révisés. Il ne modifie lui-même ni le plan ni la documentation normative. Figma n'est pas modifié.
>
> **Lecture.** Chaque réponse donne : la décision, l'option du plan qu'elle retient ou remplace, sa justification sourcée, l'opération qu'elle débloque.

## 1. Synthèse

| ID | Question du plan | Statut après ce document | Option retenue |
|---|---|---|---|
| ARB-04 | Valeurs initiales des réglables de Format | **CLOS** | A, validée valeur par valeur, complétée de deux valeurs fournies |
| ARB-22c | Contenu initial des cinq départs rapides | **OUVERT** (en attente de définition fonctionnelle) | aucune |
| ARB-26 | Compatibilité d'un Exercice formaté déposé dans un Circuit | **CLOS** | aucune des trois : règle nouvelle, plus large que C, qui remplace A, B et C |
| ARB-27 | Second Exercice pour un Format porté par un Exercice unique | **CLOS** | A |
| ARB-28 | Position d'un Circuit formaté inséré par l'entrée « Format » | **CLOS** | A, précisée |

Trois décisions de principe sont confirmées au passage (§7). Deux écarts documentaires, hors du périmètre de ces cinq questions, sont signalés (§9).

## 2. ARB-04 — Valeurs initiales des réglables de Format

**Question posée.** Valeurs initiales des réglables de Format : nombre de séries 30/30, W et N de l'EMOM, durée de l'AMRAP, échelle du For time, q0 / d / W du Death by. Options : A, exemples validés valeur par valeur ; B, table fournie par Hermann ; C, pas de défaut, champ à renseigner.

**Décision.** **Option A**, les cas de référence déjà écrits sont adoptés comme valeurs initiales, valeur par valeur ; **complétée** des deux valeurs qui n'existaient nulle part, fournies par Hermann : **durée AMRAP = 12:00** et **nombre de séries du 30/30 = 6**.

| Format | Réglable | Valeur initiale | Source |
|---|---|---|---|
| Tabata | aucun réglable de cadence | sans objet : 8 séries par Exercice, 20 s d'effort, 10 s de pause **imposés** | FMT-10, FMT-14 |
| Intervalles 30/30 | nombre de séries | **6** | décision du 29/10 (aucune valeur documentée) ; constantes 30 s / 30 s imposées par FMT-19 |
| EMOM | fenêtre W | **60 s** | REC-10 |
| EMOM | nombre de tours N | **6** | REC-10 |
| AMRAP | durée | **12:00** | décision du 29/10 (aucune valeur documentée) |
| For time | échelle, volume par tour | **21 · 15 · 9** | FMT-30, FMT-32 |
| Death by | départ q0 | **1** | FMT-33 |
| Death by | incrément d | **1** | FMT-33 |
| Death by | fenêtre W | **1 min** | FMT-33 |

**Effet documentaire.** Par cette décision, et pour **ces valeurs seulement**, la réserve de ch10 l.1524 (« les chiffres des recettes et de Figma sont des exemples ») ne s'applique plus : ces valeurs deviennent les valeurs initiales documentées des réglables. Aucune autre valeur illustrée dans Figma ou dans les recettes ne devient un défaut. Classe **B** de la règle permanente de synchronisation.

**Débloqué.** La mise à disposition (activation dans la grille) de chacun des six Formats. Plus aucun Format ne reste indisponible faute de valeur initiale. Le registre C.1 porte ces valeurs comme données.

**Rappel de nature.** Une valeur initiale est proposée et modifiable par l'utilisateur ; elle ne devient jamais une contrainte. Les valeurs **imposées** restent celles que les règles de Format désignent comme non modifiables (FMT-10 pour Tabata, FMT-19 pour les constantes du 30/30, FMT-30 / FMT-31 pour le For time).

## 3. ARB-22c — Contenu initial des cinq départs rapides

**Question posée.** Paramètres et, le cas échéant, Mouvements préremplis pour chacun des cinq départs rapides : Renforcement, Gainage · Mobilité, Superset, Progression, À l'échec.

**Statut.** **OUVERT. En attente de définition fonctionnelle de Hermann.** Aucune valeur n'est proposée, déduite ni inventée, conformément à la contrainte de mission (« ne pas inventer les paramètres ni les Mouvements des départs rapides ») et à P-2 (« ne jamais inventer une règle »).

**Ce qui n'est pas bloqué.** Le mécanisme unique exigé par ARB-22b, capable de porter les trois cas (A paramètres seuls, B Mouvements et paramètres, C contenu variable selon le départ), se construit sans ces valeurs : le contenu d'un départ est une **donnée**, pas un parcours. Rappel sourcé : FMT-02 et FMT-28 énoncent que les cinq départs rapides « ne font que préremplir une séance libre. Aucun verrouillage métier ne provient de cette origine ». Un départ rapide ne crée donc aucune contrainte à concevoir.

**Bloqué.** L'activation de chaque départ rapide (story C.5), départ par départ, tant que son contenu n'est pas défini.

## 4. ARB-26 — Compatibilité d'un Exercice formaté déposé dans un Circuit

**Question posée.** Critères de compatibilité d'un Exercice formaté déplacé dans un Circuit, libre ou formaté. Options : A, refus dans tout Circuit ; B, admis dans un Circuit libre groupé de compte 1 ; C, admis dans un Circuit formaté du même Format et des mêmes réglages. Recommandation du plan : C, puis B.

**Décision.** Aucune des trois options. Le critère retenu est celui énoncé par Hermann :

> « Ajouter un exercice formaté à un circuit alterné changerait la nature du format de l'exercice, donc c'est interdit, en tout cas c'est interdit si ça change la nature de l'exercice formaté. »

Le critère est donc : **l'opération est admise tant qu'elle ne change pas la nature du Format porté par l'Exercice ; elle est refusée, sans altération, dans le cas contraire.** Il ne porte pas sur le type de Circuit en soi, mais sur ce que le Circuit **fait** au paramètre de séries du Format.

Ce critère se décide à partir d'une règle déjà écrite, ch10 l.1053 : dans un **Circuit à séries groupées**, le nombre de séries par Exercice est « propre à chaque exercice, indépendant d'un exercice à l'autre » ; dans un **Circuit à séries alternées**, il est « identique pour tous, hérité du circuit », et ce Circuit « ne crée pas de paramètre, il **contraint** un paramètre existant ».

### 4.1 Circuit à séries groupées : toujours admis

Un Circuit groupé ne touche pas au nombre de séries de ses membres. Son compte **répète intégralement** le passage de chaque membre. Un Exercice formaté y entre donc sans qu'aucun de ses paramètres, imposés ou réglés, ne soit modifié. Admis pour les six Formats, AMRAP et Death by compris, le bloc complet étant rejoué comme ARB-25 le prévoit pour ces deux Formats.

Hermann, 29/10 :

> « J'accepte que le compte d'un circuit groupé répète un élément formaté, c'est même son principe, il n'y a pas de contradiction ni d'incohérence. »

### 4.2 Circuit à séries alternées : admis sous condition

Un Circuit alterné impose son compte N au nombre de séries de ses membres et entrelace les séries. Quatre cas, selon le statut du nombre de séries dans le Format déposé :

| Cas | Statut du nombre de séries du Format | Résultat | Justification |
|---|---|---|---|
| 1 | **Imposé et égal à N** | **Admis** | Aucune valeur n'est changée. La séquence obtenue est exactement la forme canonique du Format : un Tabata (8 séries imposées, FMT-14) dans un Circuit alterné de N = 8 produit `A1 B1 A2 B2 … A8 B8`, c'est-à-dire FMT-13 mot pour mot. |
| 2 | **Imposé et différent de N** | **Refusé**, sans altération | Le Circuit contraindrait un paramètre que le Format impose : soit le compte du Format est écrasé, soit le compte du Circuit ne s'applique pas. Les deux changent la nature du Format. |
| 3 | **Réglable** | **Admis**, le compte adopte N | Aucune valeur imposée n'est touchée ; les constantes du Format sont conservées. Cas du 30/30, dont FMT-19 fait du compte une valeur réglée, et de l'EMOM, dont FMT-20 offre explicitement l'organisation En alternance. |
| 4 | **Résultat, non réglable** | **Jamais compatible** | AMRAP (FMT-26 : les tours réalisés sont « un résultat, pas une borne saisie ») et Death by (FMT-33 : le rang est déduit de l'horloge) n'ont aucun paramètre de séries à contraindre. Un Circuit alterné n'a donc rien sur quoi s'appliquer. |

Le For time ne figure pas dans cette table : son volume est indexé par tour (FMT-30, FMT-32) et FMT-31 interdit tout sélecteur d'organisation. Son porteur est un Circuit par nature ; le cas d'un Exercice For time déposé dans un autre Circuit ne se présente pas.

### 4.3 Ce que la règle remplace

Elle remplace les options A, B et C de `arbitrages-pre9.md` §2 bis. Elle est **plus large** que la recommandation C sur deux points : tout Circuit groupé est admis, quel que soit son compte, et non seulement un compte de 1 ; un Circuit alterné est admis quand le compte du Format est réglable ou déjà égal à N, et pas seulement quand le Circuit porte le même Format aux mêmes réglages.

### 4.4 Débloqué

Les dépôts de B.4 et C.4. Le contrôle avant mutation exigé par ARB-24 et CE-FMT-03 §14 s'évalue désormais avec un critère écrit. En cas de refus : refus net, aucun paramètre ni donnée altéré.

## 5. ARB-27 — Second Exercice pour un Format porté par un Exercice unique

**Question posée.** Comment ajouter un second Exercice à un Format porté par un Exercice unique. Options : A, poser un Circuit sur l'Exercice formaté fait passer le Format à ce Circuit ; B, refus, l'élément doit être recréé par l'entrée « Format ».

**Décision. Option A.** Hermann, 29/10 :

> « Le cas est-il que nous avons un circuit et un exercice formatés, et que si on y fait entrer un deuxième exercice, celui-ci adopte le format du premier exercice ? Si c'est le cas je suis d'accord. »

Règle retenue :

1. Poser un Circuit sur un Exercice formaté fait **remonter le Format de l'Exercice au Circuit**, réglages inchangés. Le porteur change, le Format et ses valeurs ne changent pas (ARB-03 : « Un Format est porté par un Circuit, lorsque son organisation nécessite un Circuit ; un Exercice, lorsqu'un Circuit n'est pas nécessaire »).
2. Le second Exercice entrant dans ce Circuit **adopte le Format du Circuit** et ses valeurs imposées. Si des valeurs qu'il portait sont remplacées par des valeurs imposées, confirmation préalable (ARB-24, CE-FMT-03 §14).
3. La question d'organisation, Par exercice ou En alternance, est posée **à l'arrivée du second Exercice**, conformément à FMT-11, et pas au moment où le Circuit est posé sur un Exercice seul.
4. **Death by exclu** tant que R-03 (Death by à plusieurs Exercices, ch05 l.484) n'est pas clos.

**Débloqué.** Ce seul geste, Circuit posé sur un Exercice formaté, dans C.4.

## 6. ARB-28 — Position d'un Circuit formaté inséré par l'entrée « Format »

**Question posée.** Où insérer un Circuit formaté créé par l'entrée « Format » quand la position d'ARB-07, après le dernier Exercice entré dans son conteneur, se trouve à l'intérieur d'un Circuit. Options : A, juste après ce Circuit dans le même parent ; B, à la fin du niveau Séance.

**Décision. Option A**, avec la précision de Hermann : « A, juste après, même parent = Cycle si applicable. »

Règle retenue : le Circuit formaté est inséré **immédiatement après le Circuit qui contient le dernier Exercice entré, dans le parent de ce Circuit**. Ce parent est le **Cycle** lorsque le Circuit est membre d'un Cycle, et le niveau Séance sinon. L'élément n'est jamais imbriqué dans le Circuit existant (D-451, pas d'imbrication) et n'est jamais renvoyé à la fin de la Séance alors que le travail en cours se situe dans un Cycle.

**Débloqué.** Ce seul cas d'insertion, dans C.4.

## 7. Décisions de principe confirmées au passage

Ces trois points n'étaient pas des questions du §2 bis. Ils ont été tranchés pendant l'examen d'ARB-26 et conditionnent la lecture des réponses ci-dessus.

1. **ARB-03 est conservé ; la simplification « toujours un Circuit » est abandonnée.** La proposition examinée consistait à faire porter tout Format par un Circuit, même à un seul Exercice, afin de supprimer le cas du Format porté par un Exercice. Hermann : « On conserve la règle qui est qu'un format peut être porté par un exercice, et on abandonne l'idée d'utiliser systématiquement un circuit. » Un Format à un seul Exercice reste donc porté par cet Exercice, et ARB-27 décrit la bascule vers un Circuit lorsqu'un second Exercice arrive.

2. **Un Exercice formaté peut être répété par un Circuit ou par un Cycle.** Ses paramètres d'exécution, imposés pour certains, ne lui interdisent pas d'être ensuite répété. C'est le fondement du §4.1.

3. **Le Circuit et le Cycle ont chacun leur rôle ; le Circuit ne double pas le Cycle.** Hermann : « l'un des objectifs du circuit c'est de pouvoir avec le nombre de tours multiplier le nombre d'exécutions d'un ou de plusieurs exercices. À ce titre c'est l'équivalent du cycle et il est dans son rôle, il ne fait pas le travail du cycle, il fait le sien. » Lecture correcte d'ARB-25 : c'est une **attribution de rôles**, non l'interdiction d'un compteur supplémentaire. ARB-25 dit que le Cycle est le mécanisme de répétition intégrale d'un élément formaté et que « le nombre de répétitions du Cycle ne remplace jamais le nombre de séries du Circuit ». Il ne dit pas qu'un Exercice formaté ne peut pas être répété par un Circuit. La différence de portée : le Circuit multiplie les passages de **ses membres**, le Cycle multiplie une **séquence entière**, qui peut contenir plusieurs Circuits.

## 8. Conséquences sur le plan et sur la documentation

À traiter dans la révision suivante du plan, puis dans la story qui livre le comportement, selon la règle permanente de synchronisation code / documentation.

| Artefact | Section | Action |
|---|---|---|
| `arbitrages-pre9.md` | §1 ARB-04 | Passer en **CLOS** ; recopier la table des valeurs initiales du §2 ci-dessus ; conserver et annoter la formulation remplacée |
| `arbitrages-pre9.md` | §2 bis | ARB-04, ARB-26, ARB-27, ARB-28 passent en **CLOS** ; ARB-22c reste la seule ligne ouverte |
| `arbitrages-pre9.md` | §0 bis, conséquences 4 à 6 | Les mentions « non décidé », « non déductible », « non défini » sont remplacées par les règles des §4, §5 et §6 ci-dessus |
| `architecture-pre9.md` | §5, table par Format | Porter les valeurs initiales d'ARB-04 et le statut du nombre de séries de chaque Format, imposé, réglable ou résultat, qui est l'entrée de la règle du §4.2 |
| `epics.md` | C.1 | Les valeurs initiales deviennent des données du registre des Formats |
| `epics.md` | B.4, C.4 | Critères de compatibilité du §4 ; geste d'ARB-27 ; position d'ARB-28 |
| `epics.md` | C.5 | Reste conditionnée à ARB-22c, départ par départ |
| Propagation normative §5 | ch10, réglables de Format | Classe B : valeurs initiales documentées ; la réserve de ch10 l.1524 est levée pour ces valeurs seulement |
| Propagation normative §5 | ch13, CE-FMT-03 §14 à §16 | Classe B : le contrôle avant dépose cite désormais les critères du §4 ; le geste d'ARB-27 et la position d'ARB-28 sont écrits |
| Propagation normative §5 | ch10 l.1053 | Classe A : règle existante, citée comme source de la règle du §4, non modifiée |

Aucune correction normative n'est faite au titre d'ARB-22c, qui reste ouvert.

## 9. Écarts documentaires signalés, hors périmètre de ces cinq questions

Deux manques relevés dans les règles de Format, indépendants des cinq questions ci-dessus, à écrire avant le moteur d'exécution (PRE-10) :

1. **Appui de déclaration de tour pour l'AMRAP et le For time.** Les deux écrans d'exécution portent « Appuyez à chaque tour terminé ». Aucune règle RM-FMT ne décrit cet appui, alors que FMT-35 le fait pour le Death by. Règle à écrire sur ce modèle, pour chacun des deux Formats.
2. **Expiration du plafond de temps du For time.** Décidée le 28/10, règle non encore écrite ; le terme « plafond de temps » n'apparaît nulle part dans `docs/`. Le lien du tour partiel de l'AMRAP vers `RM-PRE5-02` (répétitions partielles) reste également à écrire.

Ces deux points ne bloquent aucune story PRE-9.

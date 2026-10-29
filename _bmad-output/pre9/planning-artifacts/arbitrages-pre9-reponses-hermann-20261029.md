# PRE-9 — Réponses aux questions ouvertes du plan (Hermann, 29/10/2026)

> **Objet.** Ce document consigne les arbitrages de Hermann du 29/10/2026 sur les questions ouvertes du plan PRE-9 (`arbitrages-pre9.md` §2 bis) : ARB-04, ARB-22c, ARB-26, ARB-27, ARB-28.
>
> **Base.** Branche de planification `pre9-bmad/plan`, commit `265f3d9d`. Documentation normative : `main`, commit `c73079e9`.
>
> **Portée.** Ce document est la source à partir de laquelle le plan et la documentation normative seront révisés. Il ne modifie ni le plan, ni la documentation normative, ni Figma. L'affichage est traité dans Figma.
>
> **Trois niveaux de qualification.** **[DÉCIDÉ]** : décision explicite de Hermann, ou règle déjà écrite et citée. **[PROPOSÉ]** : mécanisme cohérent avec une décision, non énoncé par elle, à confirmer. **[À CLARIFIER]** : aucune décision ni règle ne tranche ; le cas est soumis à arbitrage.

## 1. Synthèse

| Question | Statut | Décision |
|---|---|---|
| Valeurs initiales des réglages de format | **CLOS** | Cas de référence validés, plus deux valeurs fournies (§2) |
| Contenu des cinq départs rapides | **OUVERT** | En attente de la définition de Hermann (§3) |
| Format porté par un exercice déposé dans un circuit | **CLOS pour les circuits groupés**, **OUVERT pour les circuits formatés** (§4) |
| Second exercice ajouté à un format porté par un exercice seul | **PARTIELLEMENT CLOS** (§5) |
| Position d'un circuit formaté inséré par l'entrée « Format » | **CLOS** (§6) |

## 2. Valeurs initiales des réglages de format

**[DÉCIDÉ]** Les cas de référence déjà écrits deviennent les valeurs initiales, avec deux valeurs fournies par Hermann : durée de l'AMRAP 12:00 et nombre de séries du 30/30 égal à 6.

| Format | Réglage | Valeur initiale |
|---|---|---|
| Tabata | aucun réglage de cadence | 8 séries, 20 s d'effort, 10 s de pause, **imposés** |
| 30/30 | nombre de séries | 6 |
| EMOM | durée d'une fenêtre | 60 s |
| EMOM | nombre de tours | 6 |
| AMRAP | durée | 12:00 |
| For time | échelle | 21 · 15 · 9 |
| Death by | départ | 1 |
| Death by | incrément | 1 |
| Death by | durée d'une fenêtre | 1 min |

Ces valeurs sont modifiables par l'utilisateur, sauf les valeurs imposées par le format : Tabata, les constantes 30 s / 30 s du 30/30, et la structure du For time. Aucune autre valeur illustrée dans Figma ou dans les recettes ne devient un défaut. Ce changement est une évolution validée : il lève pour ces seules valeurs la réserve selon laquelle les exemples ne sont pas des défauts.

## 3. Contenu des cinq départs rapides

**[À CLARIFIER]** Renforcement, Gainage et Mobilité, Superset, Progression, À l'échec : les exercices et réglages proposés par défaut ne sont pas définis. Le mécanisme commun peut être construit sans eux ; l'activation de chaque départ attend sa définition.

## 4. Format porté par un exercice déposé dans un circuit

**Question.** Un exercice porteur d'un format peut-il être déposé dans un circuit, et à quelles conditions ?

### 4.1 Critère

**[DÉCIDÉ]** L'opération est admise tant qu'elle ne change pas la nature du format de l'exercice. Elle est refusée sans altération dans le cas contraire.

> « Ajouter un exercice formaté à un circuit alterné changerait la nature du format de l'exercice, donc c'est interdit, en tout cas c'est interdit si ça change la nature de l'exercice formaté. »

> « J'accepte que le compte d'un circuit groupé répète un élément formaté, c'est même son principe, il n'y a pas de contradiction ni d'incohérence. »

> « Le circuit […] multiplie le nombre d'exécutions d'un ou de plusieurs exercices. [...] il ne fait pas le travail du cycle, il fait le sien. »

### 4.2 Circuit groupé : admis pour les six formats

**[DÉCIDÉ]** Le circuit groupé répète la passage complet de chacun de ses membres, selon son compte. Pour chaque format :

| Format | Ce qui se passe à chaque passage |
|---|---|
| **Tabata** | Les 8 séries, 20 s d'effort et 10 s de pause sont exécutées à chaque passage. |
| **30/30** | Les 30 s de travail et 30 s de pause sont exécutées à chaque passage. |
| **EMOM** | Chaque passage est un bloc de fenêtres complet. La durée totale est la somme des blocs. |
| **For time** | Chaque passage exécute l'échelle complète, depuis 21. Le temps de chaque passage est enregistré ; le temps total est la somme. |
| **AMRAP** | Chaque répétition dure 12 minutes. Il n'existe pas de limite globale. |
| **Death by** | Arrêter l'exercice met fin à cet élément seulement, pas à la séance. Le bloc suivant se lance automatiquement. La récupération et les points d'arrêt se déroulent normalement. |

**Point de conformité.** FMT-34 écrit qu'« un seul bouton met fin à la séance ». La décision ci-dessus en change la portée pour le Death by : le bouton met fin à l'élément en cours. Cette formulation est à annoter comme remplacée, avec son texte d'origine conservé, dans la propagation normative (§8.2).

### 4.3 Circuit alterné

**[DÉCIDÉ]** Le circuit alterné impose son compte N aux séries de ses membres. Une dépose est admise ou refusée selon le format :

| Format | Issue |
|---|---|
| **Tabata** | **ADMIS si N = 8**, avec le compte commun du Tabata. **REFUSÉ si N ≠ 8.** |
| **30/30** | **REFUSÉ** : son organisation alternée n'est pas décrite. |
| **EMOM** | **ADMIS AVEC CONFIRMATION** : l'organisation alternée est décidée pour l'EMOM, et la confirmation est demandée si des valeurs sont perdues. |
| **For time** | **REFUSÉ** : son organisation alternée est exclue. |
| **AMRAP** | **REFUSÉ** : aucun nombre de séries à contraindre. |
| **Death by** | **REFUSÉ** : aucun nombre de séries à contraindre. |

Le régime de la dépose est celui des règles écrites : l'exercice conserve son régime et ses paramètres, puis son exemplaire est adapté à N, avec confirmation s'il faut retirer des séries (ch10 l.1077, l.1152, l.1156). La sortie conserve le nombre actif et les paramètres actuels (ch10 l.1154).

### 4.4 Circuit formaté : À CLARIFIER

**[À CLARIFIER]** Un exercice porteur d'un format est déposé dans un circuit qui porte déjà un format. Cas concret : un EMOM déposé dans un circuit Tabata.

Options :
- **a1.** Refus de toute dépose dans un circuit formaté.
- **a2.** Admis seulement si le circuit porte le même format aux mêmes réglages. L'exercice devient simple membre, et son format propre disparaît au profit de celui du circuit. Refus sinon.
- **a3.** Admis avec confirmation, le format du circuit l'emportant sur celui de l'exercice.

L'arbitrage doit aussi dire si un exercice qui quitte ce circuit retrouve son format, et distinguer un circuit formaté groupé d'un circuit formaté alterné.

**Recommandation : a2.** C'est la seule option qui n'invente aucune priorité entre deux formats. Aucune règle n'établit laquelle des deux prescriptions l'emporte.

## 5. Second exercice ajouté à un format porté par un exercice seul

**Cas.** Un EMOM est sur l'exercice Squat. On ajoute un second exercice, Fentes.

- **[DÉCIDÉ] Le second exercice adopte l'EMOM.** Si des valeurs qu'il portait sont remplacées, une confirmation est demandée. Le nombre de tours reste 6, et la durée est recalculée.
- **[DÉCIDÉ] Pour l'EMOM, le sélecteur d'organisation est proposé à l'arrivée du second exercice.** Il est explicitement prévu pour l'EMOM, le Tabata et la Progression, et exclu pour le For time.
- **[PROPOSÉ] Le format remonte de l'exercice au circuit, réglages inchangés.** Hermann a validé que le second exercice adopte le format, pas le transfert de propriété. À confirmer.
- **[À CLARIFIER] Le Death by dans ce geste.** Son comportement avec plusieurs exercices n'est pas défini. Exclure le Death by de ce geste pour l'instant, ou le permettre en définissant comment le rang global se calcule.

## 6. Position d'un circuit formaté inséré par l'entrée « Format »

**[DÉCIDÉ]** Le circuit est inséré immédiatement après le circuit qui contient le dernier exercice entré, dans le même parent. Ce parent est le cycle si le circuit en fait partie, le niveau séance sinon. Il n'est jamais imbriqué dans le circuit existant.

## 7. Décisions de principe

1. **[DÉCIDÉ] ARB-03 est conservé.** Un format peut être porté par un exercice, sans passer par un circuit.
2. **[DÉCIDÉ] Un exercice formaté peut être répété par un circuit groupé ou par un cycle.**
3. **[DÉCIDÉ] ARB-25 est précisé.** Le cycle répète la séquence entière, y compris les éléments formatés. Le circuit répète les passages de ses membres selon son compte. Le nombre de répétitions du cycle ne remplace jamais le nombre de séries d'un circuit.
4. **[DÉCIDÉ] Arrêt d'un Death by.** Arrêter un Death by met fin à cet élément, non à la séance. Le bloc suivant se lance automatiquement, avec sa récupération et ses points d'arrêt.
5. **[DÉCIDÉ] AMRAP répété.** Chaque répétition dure 12 minutes.

## 8. Conséquences sur le plan et la documentation

Seules les parties décidées sont propageables. Les points §4.4, §5 et §3 ne donnent lieu à aucune correction normative.

### 8.1 Planification PRE-9

- `arbitrages-pre9.md` : ARB-04 et ARB-26 pour le circuit groupé passent en **CLOS** ; ARB-26 pour le circuit formaté reste ouvert ; ARB-27 reste **PARTIELLEMENT CLOS** ; ARB-28 **CLOS**.
- `arbitrages-pre9.md` §5, lignes 190 et 201 : les annotations prévues pour FMT-12 et CE-FMT-02 disent « la répétition intégrale d'un Tabata se fait par un Cycle » : à reformuler, le circuit groupé répétant aussi.
- `architecture-pre9.md` §§2, 3, 5 et 6 : propriété du format lors de la transition exercice vers circuit ; statut du nombre de séries par format ; contrat de composition vers exécution pour les répétitions.
- `epics.md` : B.4 et C.4 pour les formats admis en circuit groupé et en circuit alterné selon la matrice ; C.4 pour les cinq cas du §4.2 ; C.5 inchangé, conditionné au §3.
- `etat-initial-et-ecarts.md`, `README.md`, `sprint-status.yaml` : statuts mis à jour.

### 8.2 Documentation normative

Classe B pour les décisions validées, avec annotation des formulations remplacées, texte d'origine conservé :

- **FMT-34** : portée de la fin pour le Death by (§4.2, §7 point 4).
- **FMT-26** : borne globale de l'AMRAP, remplacée pour la répétition par 12 minutes (§7 point 5).
- **ch10 réglages de format** : valeurs initiales (§2).
- **CE-FMT-02 et CE-FMT-03** : contrôle de dépose, confirmation, refus sans altération.
- **ch07 registre** : décisions du 29/10 et précision apportée à ARB-25.

**Non concerné :** FMT-23 (fenêtre contiguë) reste vrai à l'intérieur d'un bloc EMOM.

## 9. Écarts d'exécution, hors périmètre

Trois points, sans exigence normative à ce stade :

1. **[À CLARIFIER]** L'appui « Appuyez à chaque tour terminé » est présent sur les écrans AMRAP et For time, mais aucune règle ne le décrit pour ces deux formats.
2. **[À CLARIFIER]** Le plafond de temps du For time, rapporté comme décidé le 28/10/2026, n'est retrouvé dans aucune source au commit `c73079e9`. Hermann doit le confirmer.
3. **[À CLARIFIER]** Le tour partiel de l'AMRAP et la règle de répétitions partielles ne sont pas raccordés explicitement.

## 10. Points ouverts

| Point | Bloque |
|---|---|
| Contenu des cinq départs rapides (§3) | Activation de chaque départ |
| Circuit formaté : a1, a2 ou a3 (§4.4) | Six cas de dépose dans un circuit formaté |
| Format remonte de l'exercice au circuit (§5, point 2) | Le geste complet d'ajout d'un second exercice |
| Death by dans ce geste (§5, point 4) | Ce geste pour le Death by |
| Trois écarts d'exécution (§9) | Aucun développement PRE-9 |

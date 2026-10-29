# PRE-9 — Réponses aux questions ouvertes du plan (Hermann, 29/10/2026)

> **Objet.** Ce document consigne les arbitrages de Hermann du 29/10/2026 sur les questions ouvertes du plan PRE-9 (`arbitrages-pre9.md` §2 bis).
>
> **Base.** Branche de planification `pre9-bmad/plan`, commit `265f3d9d`. Documentation normative : `main`, commit `c73079e9`.
>
> **Portée.** Ce document est la source à partir de laquelle le plan et la documentation normative seront révisés. Il ne modifie ni le plan, ni la documentation normative, ni Figma. L'affichage est traité dans Figma.
>
> **Trois niveaux de qualification.** **[DÉCIDÉ]** : décision explicite de Hermann, ou règle déjà écrite et citée. **[PROPOSÉ]** : mécanisme cohérent avec une décision, non énoncé par elle, à confirmer. **[À CLARIFIER]** : aucune décision ni règle ne tranche ; le cas est soumis à arbitrage.

## 1. Synthèse

| Question | Statut |
|---|---|
| Valeurs initiales des réglages de format | **CLOS** (§2) |
| Principes des circuits formatés | **CLOS** (§4) ; remplace ARB-24 sur les valeurs imposées |
| Dépose d'un élément formaté dans un circuit | **CLOS** pour les six formats, groupé comme alterné (§4.3) |
| Second exercice ajouté à un format porté par un exercice seul | **PARTIELLEMENT CLOS** (§5) |
| Position d'un circuit formaté inséré par l'entrée « Format » | **CLOS** (§6) |
| Contenu des cinq départs rapides | **OUVERT** (§3) |
| Ajout d'un format identique dans une séance : choix entre circuit existant et nouveau circuit | **CLOS** côté règles ; graphisme dans Figma (§4.5) |

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

Ces valeurs sont modifiables, sauf celles qu'un format impose : Tabata, constantes 30 s / 30 s du 30/30, structure du For time. Aucune autre valeur illustrée dans Figma ou dans les recettes ne devient un défaut.

## 3. Contenu des départs rapides

**[DÉCIDÉ]** Aucun exercice n'est proposé par défaut : l'utilisateur choisit les exercices au moment du format.

**[DÉCIDÉ]** Les réglages proposés par défaut sont ceux qui définissent le format.

**[DÉCIDÉ]** Le départ **Gainage · Mobilité est supprimé.** Il ne se distinguait pas d'une séance libre.

**[DÉCIDÉ] Superset** : un circuit groupé d'un tour, avec deux exercices vides ; les réglages de chaque exercice restent libres.

**[DÉCIDÉ] Valeurs confirmées par Hermann le 29/10/2026 :**

| Départ | Réglage proposé |
|---|---|
| Renforcement | 3 séries de 15 répétitions |
| Progression | 10, 12, puis 14 répétitions |
| À l'échec | 3 séries à l'échec |
| Superset | circuit groupé d'un tour, deux exercices vides |

## 4. Circuits formatés et dépose d'éléments

### 4.1 Principes

**[DÉCIDÉ]** Définis par Hermann le 29/10/2026 :

1. **Un format appartient à l'élément qui le porte.** Un exercice porte son format ; le lien dans un circuit ne le transfère pas.
2. **Un circuit fixe son organisation (groupé ou alterné) et son nombre de tours.** Il ne fixe jamais les paramètres propres de ses membres.
3. **Un élément qui entre dans un circuit prend son organisation et son nombre de tours, et garde ses propres paramètres.** Si son nombre de tours est variable, il prend la valeur du circuit.
4. **Une entrée est refusée seulement si elle change la nature de l'élément**, par exemple un alterné imposant un nombre de séries différent de celui que son format impose.

**Remplacement d'ARB-24.** ARB-24 disait que les valeurs imposées d'un circuit formaté sont appliquées à l'exercice qui entre. Le principe 2 remplace ce passage. La confirmation reste prévue lorsqu'une valeur est perdue (ch10 l.1077).

### 4.2 Critère de dépose

**[DÉCIDÉ]** L'élément peut entrer dans un circuit tant que son format ne change pas de nature. Le seul paramètre que le circuit peut contraindre est le nombre de séries (alterné) ou de tours, et seulement sous la règle de l'organisation.

> « Ajouter un exercice formaté à un circuit alterné changerait la nature du format de l'exercice, donc c'est interdit, en tout cas c'est interdit si ça change la nature de l'exercice formaté. »

> « J'accepte que le compte d'un circuit groupé répète un élément formaté, c'est même son principe, il n'y a pas de contradiction ni d'incohérence. »

### 4.3 Matrice de dépose

L'identité du circuit formaté n'intervient pas dans la décision : seuls comptent son organisation et son nombre de tours. Un circuit Tabata se traite donc comme un circuit alterné de 8 ; un circuit formaté groupé se traite comme un circuit groupé.

**Circuit groupé : admis pour les six formats.**
- **Tabata** : chaque passage exécute les 8 séries, 20 s et 10 s.
- **30/30** : chaque passage exécute ses séries et ses pauses.
- **EMOM** : chaque passage est un bloc complet ; la durée est la somme des blocs.
- **For time** : chaque passage exécute l'échelle complète depuis 21. Le temps de chaque passage est enregistré ; le total est la somme.
- **AMRAP** : chaque répétition dure 12 minutes, sans limite globale.
- **Death by** : arrêter l'exercice met fin à cet élément seulement, pas à la séance. Le bloc suivant se lance automatiquement, avec sa récupération et ses points d'arrêt.

**Circuit alterné :**
- **Tabata** : **ADMIS si N = 8** ; **REFUSÉ si N ≠ 8**, car le Tabata impose 8 séries.
- **30/30** : **REFUSÉ**, son organisation alternée n'est pas décrite.
- **EMOM** : **ADMIS**. Son nombre de tours prend la valeur N, qui reste modifiable ; confirmation si une valeur est perdue.
- **For time** : **REFUSÉ**, son organisation alternée est exclue.
- **AMRAP** : **REFUSÉ**, aucun nombre de séries à contraindre.
- **Death by** : **ADMIS**, chaque Death by avec sa propre horloge (décision du 29/10, §5).

**Point de conformité.** FMT-34 écrit « un seul bouton met fin à la séance ». La décision sur le Death by en change la portée. La formulation est déjà annotée dans le chapitre 10 (commit `990542fd`).

### 4.4 Régime de la dépose

Un élément qui entre dans un circuit alterné **conserve son régime et ses paramètres**, son exemplaire est adapté à N, et une confirmation est demandée s'il faut retirer des séries (ch10 l.1152). La sortie conserve le nombre actif et les paramètres actuels (ch10 l.1154).

### 4.5 Ajout d'un format identique dans une séance

**[DÉCIDÉ] Choix à l'utilisateur.** Lorsqu'il ajoute un format qui existe déjà dans la séance, l'utilisateur choisit entre **ajouter au circuit formaté existant** et **créer un nouveau circuit**. Ce choix est porté par l'interface. Son traitement graphique relève de Figma.

## 5. Second exercice ajouté à un format porté par un exercice seul

**Cas.** Un EMOM est sur l'exercice Squat. On ajoute un second exercice, Fentes.

- **[DÉCIDÉ] Le second exercice adopte l'EMOM.** Si des valeurs qu'il portait sont remplacées, une confirmation est demandée. Le nombre de tours reste 6, et la durée est recalculée.
- **[DÉCIDÉ] Le sélecteur d'organisation est proposé à l'arrivée du second exercice**, pour les formats qui l'admettent : Tabata, EMOM, Progression. Il est exclu pour le For time.
- **[DÉCIDÉ] Pas de transfert automatique.** Le format appartient à chaque exercice qui le porte. Le lien dans un circuit est un choix de l'utilisateur. Il n'y a aucun mécanisme de montée du format vers le circuit.
- **[DÉCIDÉ] Un Death by peut être lié à un autre exercice dans un circuit alterné.** Chaque Death by a sa propre horloge, qui avance pendant ses propres minutes actives dans l'alternance. Arrêter un Death by met fin à cet élément seulement.

## 6. Position d'un circuit formaté inséré par l'entrée « Format »

**[DÉCIDÉ]** Le circuit est inséré immédiatement après le circuit qui contient le dernier exercice entré, dans le même parent. Ce parent est le cycle si le circuit en fait partie, le niveau séance sinon. Il n'est jamais imbriqué dans le circuit existant.

## 7. Décisions de principe

1. **[DÉCIDÉ] ARB-03 est conservé.** Un format peut être porté par un exercice, sans passer par un circuit.
2. **[DÉCIDÉ] Un élément formaté peut être répété par un circuit groupé ou par un cycle.**
3. **[DÉCIDÉ] ARB-25 est précisé.** Le cycle répète la séquence entière, y compris les éléments formatés. Le circuit répète les passages de ses membres selon son compte. Le nombre de répétitions du cycle ne remplace jamais le nombre de séries d'un circuit.
4. **[DÉCIDÉ] Arrêt d'un Death by.** Il met fin à cet élément, non à la séance.
5. **[DÉCIDÉ] AMRAP répété.** Chaque répétition dure 12 minutes.
6. **[DÉCIDÉ] Principes des circuits formatés** (§4.1), qui remplacent le passage d'ARB-24 sur les valeurs imposées. Version resserrée validée le 29/10/2026.
7. **[DÉCIDÉ] Pas de transfert automatique du format.** Le format appartient à l'élément qui le porte. ARB-03 est précisé : un format n'est porté par un circuit que si l'utilisateur place ses exercices dans ce circuit.

## 8. Conséquences sur le plan et la documentation

Seules les parties décidées sont propageables.

### 8.1 Planification PRE-9

- `arbitrages-pre9.md` : ARB-04 et ARB-26 **CLOS** ; ARB-24 **remplacé** sur les valeurs imposées ; ARB-27 **PARTIELLEMENT CLOS** ; ARB-28 **CLOS**.
- `arbitrages-pre9.md` §5, lignes 190 et 201 : annotations à reformuler, le circuit groupé répétant aussi.
- `architecture-pre9.md` §§2, 3, 5, 6 : propriété du format ; statut du nombre de séries par format ; contrat de composition vers exécution.
- `epics.md` : B.4 et C.4 selon la matrice du §4.3 ; C.5 inchangé, conditionné au §3.
- `etat-initial-et-ecarts.md`, `README.md`, `sprint-status.yaml` : statuts.

### 8.2 Documentation normative

Classe B pour les décisions validées, avec annotation des formulations remplacées, texte d'origine conservé :

- **ch10, ARB-24** : valeurs imposées du circuit formaté, remplacées par le principe 2 (§4.1).
- **ch10, FMT-26** : borne globale de l'AMRAP, remplacée pour la répétition par 12 minutes.
- **ch10, réglages de format** : valeurs initiales (§2).
- **CE-FMT-03** : contrôle de dépose ; le circuit n'impose pas les paramètres de ses membres.
- **ch07 registre** : décisions du 29/10 et précision apportée à ARB-25.

**Non concerné :** FMT-23 reste vrai à l'intérieur d'un bloc EMOM.

## 9. Exécution : AMRAP et For time

**[DÉCIDÉ] Plafond de temps du For time.** Il est optionnel, et sert en général pour des raisons de sécurité. Quand il est atteint, l'exercice s'arrête.

**[DÉCIDÉ] Appui « tour terminé » (AMRAP et For time).** Calqué sur le Death by : chaque appui acquiert un tour ; un seul appui par tour ; un tour inachevé n'est pas compté.

**[DÉCIDÉ] Tour partiel de l'AMRAP.** Au terme du temps, les répétitions réalisées du tour inachevé sont saisies dans la modale des répétitions partielles, valeur initiale 0.

**[DÉCIDÉ] Résultat d'un For time arrêté par son plafond.** Il est présenté comme incomplet, comme le Death by arrêté par « Limite atteinte ».

## 10. Points ouverts

| Point | Bloque |
|---|---|
| Confirmation des valeurs proposées (§3) | Activation de chaque départ |
| Traitement graphique du choix circuit existant ou nouveau circuit (§4.5) | Figma, hors règles |

# PRE-9 — Règles de gestion de la composition avec formats : état consolidé et analyse de cohérence (29/10/2026)

> **Objet.** Ce document rassemble toutes les décisions et règles de gestion arbitrées le 29/10/2026 pour la composition d'une séance avec des formats. Il les confronte à la documentation normative existante, pour repérer les contradictions à corriger. Il est destiné à une **revue indépendante** (ChatGPT) : il doit se lire seul.
>
> **Ce document ne modifie ni le plan, ni la documentation normative, ni Figma.** Les corrections sont listées au §5, sans être appliquées.
>
> **Références.** Branche `docs/pre9-arbitrages-reponses-20261029`, commit `28dfbce5` ou plus récent. Documentation normative : `main`, commit `c73079e9`. Dans les citations, « ch10 » désigne le chapitre 10 « Processus métier et règles métier transverses », « ch13 » le chapitre 13 « Contrats d'écran », « ch05 » le chapitre 05 « Versions du produit ».
>
> **Qualification.** **[DÉCIDÉ]** : décision explicite de Hermann le 29/10/2026, citée ou résumée fidèlement. **[NORMATIF]** : règle déjà écrite dans la documentation, sur `main`. **[À VÉRIFIER]** : point signalé par cette analyse, non tranché.

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
- **D-06 [DÉCIDÉ]** Un circuit formaté fige son organisation et tout paramètre dont la modification dénaturerait le format.
- **D-07 [DÉCIDÉ]** Un élément qui entre dans un circuit **alterné** conserve son régime et ses paramètres. Son exemplaire est adapté au nombre de tours N. Une confirmation est demandée s'il faut retirer des séries. Sa sortie conserve le nombre actif et les paramètres actuels.
- **D-08 [DÉCIDÉ]** Un circuit **groupé** répète le passage complet de chacun de ses membres, selon son compte. Il ne modifie pas le nombre de séries de ses membres.
- **D-09 [DÉCIDÉ]** Une confirmation est demandée seulement si au moins un exercice perd des valeurs.
- **D-10 [DÉCIDÉ]** Insertion d'un circuit formaté par l'entrée « Format » : il est inséré immédiatement après le circuit qui contient le dernier exercice entré, dans le même parent (cycle si le circuit en fait partie, niveau séance sinon).
- **D-11 [DÉCIDÉ]** L'utilisateur qui ajoute un format déjà présent dans la séance choisit entre **ajouter au circuit formaté existant** et **créer un nouveau circuit**. Le graphisme relève de Figma.

### 1.3 Ajout d'exercices à un format existant

- **D-12 [DÉCIDÉ]** Un second exercice ajouté à un format porté par un exercice seul **adopte le format**. Si des valeurs qu'il portait sont remplacées, une confirmation est demandée. Le nombre de tours reste inchangé.
- **D-13 [DÉCIDÉ]** Le sélecteur d'organisation (Par exercice / En alternance) est proposé à l'arrivée du second exercice pour Tabata, EMOM et Progression. Il est exclu pour For time.

### 1.4 Formats

- **D-14 [DÉCIDÉ] Valeurs initiales** : Tabata 8 séries, 20 s, 10 s (imposés). 30/30 : 6 séries (constantes 30 s / 30 s imposées). EMOM : fenêtre 60 s, 6 tours. AMRAP : 12:00. For time : échelle 21 · 15 · 9. Death by : départ 1, incrément 1, fenêtre 1 min. Ces valeurs sont modifiables, sauf celles qu'un format impose.
- **D-15 [DÉCIDÉ] Circuit groupé** : admis pour les six formats.
  - Tabata et 30/30 : chaque passage exécute ses séries et ses pauses.
  - EMOM : chaque passage est un bloc complet ; la durée totale est la somme des blocs.
  - For time : chaque passage exécute l'échelle complète depuis 21 ; le temps de chaque passage est enregistré ; le total est la somme.
  - AMRAP : chaque répétition dure la durée réglée de l'AMRAP (12:00 par défaut), sans limite globale.
  - Death by : arrêter l'exercice met fin à cet élément seulement ; le bloc suivant se lance automatiquement, avec sa récupération et ses points d'arrêt.
- **D-16 [DÉCIDÉ] Circuit alterné** :
  - Tabata : admis si N = 8, refusé sinon.
  - 30/30 : refusé, son organisation alternée n'est pas décrite.
  - EMOM : admis ; le nombre de tours prend la valeur N, réglable ; confirmation si une valeur est perdue.
  - For time : refusé, son organisation alternée est exclue.
  - AMRAP : refusé, aucun nombre de séries à contraindre.
  - Death by : admis, chaque Death by avec sa propre horloge, qui avance pendant ses minutes actives dans l'alternance ; arrêter un Death by ne met fin qu'à lui.
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
- **D-29 [DÉCIDÉ] Lève la réserve documentaire sur le Death by à plusieurs exercices** pour le cas du circuit alterné (D-16). Aucun blocage technique identifié.
- **D-30 [DÉCIDÉ] La durée de l'AMRAP est réglable.** Dans un circuit répété, cette durée s'applique à chaque répétition, sans limite globale. L'exemple de 12 minutes ne fixe pas la valeur.

## 2. Règles de gestion consolidées

### 2.1 Les six formats

| Format | Porté par | Valeurs imposées | Circuit groupé | Circuit alterné | Organisation choisissable |
|---|---|---|---|---|---|
| Tabata | exercice | 8 séries, 20 s, 10 s | admis (D-15) | admis si N = 8 (D-16) | oui |
| 30/30 | exercice | 30 s / 30 s | admis (D-15) | refusé (D-16) | non |
| EMOM | exercice | fenêtre 60 s | admis, bloc par passage (D-15) | admis, tours = N (D-16) | oui |
| For time | exercice | échelle 21 · 15 · 9 | admis, échelle par passage (D-15) | refusé (D-16) | non |
| AMRAP | exercice | durée réglable (12:00 par défaut), appliquée à chaque répétition | admis (D-15) | refusé (D-16) | non |
| Death by | exercice | départ 1, incrément 1, fenêtre 1 min | admis (D-15) | admis, horloge propre (D-16) | non |

### 2.2 Départs rapides

| Départ | Contenu |
|---|---|
| Renforcement | 3 × 15 |
| Progression | 10 · 12 · 14 |
| À l'échec | 3 séries à l'échec |
| Superset | circuit groupé d'un tour, deux exercices vides |
| Libre | séance vide |
| Gainage · Mobilité | **supprimé** (D-25) |

### 2.3 Exécution

| Sujet | Règle |
|---|---|
| Appui de tour (AMRAP, For time) | un appui acquiert un tour ; un seul par tour ; tour inachevé non compté (D-19) |
| Tour partiel AMRAP | répétitions réalisées saisies dans la modale, 0 par défaut (D-20) |
| Plafond For time | optionnel ; arrêt à l'atteinte ; résultat incomplet (D-21) |
| Arrêt Death by | met fin à l'élément ; bloc suivant automatique (D-18) |

## 3. Analyse de cohérence avec la documentation normative

Chaque ligne indique le texte normatif concerné, le conflit, et l'action proposée. **Aucune action n'a été appliquée.**

| # | Texte normatif | Conflit avec les décisions | Action proposée |
|---|---|---|---|
| C-01 | ch10 FMT-26 : « Le circuit est répété jusqu'à l'échéance globale » | Contredit D-15 et D-30 (durée réglable appliquée à chaque répétition, sans limite globale). | **Annoter comme remplacé** sur ce point, texte d'origine conservé (classe B). |
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

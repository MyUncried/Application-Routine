# Protocole générique de conception d’une évolution — V1

## 1. Objet

Ce protocole transforme une idée ou un besoin en une conception suffisamment claire, cohérente et documentée pour pouvoir être planifiée.

Il est générique et indépendant d’un produit, d’un dépôt, d’un langage, d’une architecture ou d’un protocole de delivery particulier.

Il couvre uniquement la phase de conception. Il ne déclenche aucun workflow de planification, de développement, de revue ou de publication.

## 2. Résultat attendu

La phase se termine lorsque l’évolution est dans l’état :

`PRÊTE À PLANIFIER`

Cet état signifie que l’on sait de manière suffisamment déterministe :

- ce que l’évolution doit apporter ;
- ce qui entre dans son périmètre ;
- ce qui en est exclu ;
- quelles règles fonctionnelles ou techniques structurantes ont été décidées ;
- quels impacts ont été identifiés ;
- quelles dépendances et prérequis existent ;
- quels points restent éventuellement ouverts sans empêcher la planification.

`PRÊTE À PLANIFIER` ne signifie pas que tout est figé, développé ou intégré dans une documentation normative.

## 3. Principes de conduite

### 3.1 Guidage strictement pas à pas

Le protocole est conduit de manière conversationnelle.

Pour les arbitrages structurants :

- une seule question est posée à la fois ;
- la question est formulée de manière concise ;
- les options sont présentées sous forme `A / B / C...` lorsqu’il existe plusieurs choix plausibles ;
- une recommandation argumentée est donnée dans le même message que la question, avant la réponse utilisateur ;
- la réponse est consolidée avant de passer à la question suivante.

### 3.2 Marqueur d’avancement obligatoire

Chaque interaction affiche un marqueur de ce type :

```text
PROTOCOLE CONCEPTION — <évolution>
Étape X/6 : <nom de l’étape>
Avancement étape : N/?
Avancement global : X/6
Statut : EN CONCEPTION
```

Lorsque l’étape est terminée :

```text
Étape X/6 : <nom> — TERMINÉE
```

### 3.3 Ne pas reposer ce qui est déjà décidé

Une décision validée devient une contrainte de conception.

Il est interdit de poser une nouvelle question si sa réponse :

- est déjà explicitement décidée ;
- découle directement d’une décision validée ;
- est imposée par une règle de simplicité déjà actée ;
- ne présente qu’une alternative artificielle ou irréaliste.

Dans ces cas, la conséquence est enregistrée directement comme **décision dérivée**.

### 3.4 Ne soumettre que les vrais arbitrages

Une question utilisateur n’est justifiée que si au moins une des conditions suivantes est vraie :

- le choix modifie réellement le modèle conceptuel ;
- le choix modifie un comportement utilisateur important ;
- le choix modifie le périmètre de la version ou de l’évolution ;
- plusieurs options réalistes ont des conséquences sensiblement différentes ;
- le choix conditionne des décisions ultérieures.

Les choix purement techniques ne sont pas soumis à l’utilisateur sauf s’ils ont un impact visible, fonctionnel, architectural structurant ou de périmètre.

### 3.5 Simplicité par défaut

Lorsqu’une conséquence peut être traitée par une règle simple déjà cohérente avec l’existant, ne pas créer un nouvel objet métier, statut, workflow, synchronisation ou mécanisme spécifique.

Éviter notamment :

- les synchronisations implicites ;
- les états redondants ;
- les doubles sources de vérité ;
- les comportements automatiques difficiles à anticiper ;
- les variantes techniques sans valeur produit démontrée.

### 3.6 Cas limites secondaires

Les cas très spécifiques, peu probables ou de faible impact peuvent être regroupés dans un bloc d’arbitrages secondaires.

Format :

```text
BLOC D’ARBITRAGES SECONDAIRES

S1 — Cas
Décision proposée : ...
Justification : ...

S2 — Cas
Décision proposée : ...
Justification : ...

Validation :
A. Valider tout le bloc
B. Corriger certains items
```

Un tel bloc ne doit jamais contenir une décision structurante ou contredire une décision déjà validée.

### 3.7 Effets surprenants

Lorsqu’une décision fonctionnelle entraîne un effet potentiellement surprenant pour l’utilisateur, le besoin d’information ou de feedback utilisateur correspondant doit être consigné immédiatement, même si la conception détaillée des écrans intervient plus tard.

### 3.8 Statuts de conception

Chaque point peut être qualifié :

- `VALIDÉ`
- `PROPOSÉ`
- `À CLARIFIER`

Les points `À CLARIFIER` ne bloquent pas automatiquement l’avancement.

## 4. Étape 1 — Intention et reformulation

### Objectif

Transformer une idée initiale en une intention claire sans concevoir prématurément la solution.

### Sujets à couvrir selon pertinence

- problème ou opportunité ;
- valeur attendue ;
- utilisateurs ou usages concernés ;
- exemples concrets ;
- périmètre pressenti ;
- ce que l’évolution ne cherche pas à faire.

### Sortie

Une définition courte et validée de l’évolution, accompagnée de son intention et de son périmètre initial.

### Clôture

Avant de passer à l’étape 2, poser obligatoirement :

> Un sujet important relevant de l’intention, de la valeur ou du périmètre général n’a-t-il pas été traité ?

## 5. Étape 2 — Conception générale

### Objectif

Définir la structure de haut niveau de la solution.

### Sujets à couvrir selon pertinence

- nouveaux concepts ou objets ;
- relations avec l’existant ;
- responsabilités respectives ;
- comportement principal ;
- cycle général ;
- frontières entre fonctions ;
- principes structurants ;
- compatibilité avec les usages existants.

### Sortie

Un modèle conceptuel de haut niveau et les principes structurants validés.

### Clôture

Avant de passer à l’étape 3, vérifier explicitement s’il reste un sujet de conception générale non traité.

## 6. Étape 3 — Conception détaillée et arbitrages

### Objectif

Transformer la conception générale en règles suffisamment précises pour pouvoir être planifiées et développées.

### Axes possibles

Utiliser uniquement les axes pertinents :

- création ;
- modification ;
- suppression ;
- cycle de vie ;
- états ;
- temporalité ;
- récurrence ;
- copie / référence ;
- duplication ;
- historique ;
- propriété ;
- partage ;
- interactions avec l’existant ;
- erreurs ;
- cas limites ;
- compatibilité future utile.

### Format standard d’un arbitrage

```text
Question
Contexte
Options A/B/C
Recommandation
Réponse utilisateur
Décision consolidée
Impact éventuel
```

### Décisions dérivées

Les conséquences logiques évidentes sont consignées sans nouvelle question.

### Sortie

Un registre consolidé des règles, décisions, points ouverts et éléments différés.

### Clôture

Vérifier explicitement s’il reste un comportement significatif ou un cas d’usage majeur non traité.

## 7. Étape 4 — Analyse d’impact

### Objectif

Identifier ce que la conception change réellement.

### Axes standards

Qualifier chaque axe :

- `IMPACT FORT`
- `IMPACT MOYEN`
- `IMPACT FAIBLE`
- `NON CONCERNÉ`
- `À ANALYSER`

Axes possibles :

1. fonctionnel ;
2. modèle de données ;
3. processus et règles métier ;
4. planification ;
5. exécution ;
6. historique ;
7. UX / contrats d’écran ;
8. Figma ou autre source visuelle ;
9. API / services ;
10. architecture ;
11. persistance / migration ;
12. tests ;
13. documentation ;
14. dépendances ;
15. périmètre de version.

### Règle sur les choix techniques

L’analyse d’impact identifie les décisions techniques à instruire, mais ne les transforme pas en arbitrages utilisateur si elles n’ont pas d’impact fonctionnel ou de périmètre.

### Sortie

Une matrice d’impact avec :

- axe ;
- niveau d’impact ;
- raison ;
- éléments concernés ;
- dépendances ;
- actions futures ;
- points encore ouverts.

## 8. Étape 5 — Consolidation

### Objectif

Produire un document autonome de conception.

Le document consolidé utilise le template `TEMPLATE_CONCEPTION_EVOLUTION.md`.

Il doit contenir uniquement les décisions effectivement validées ou clairement marquées comme proposées / à clarifier.

Il ne doit pas inventer de règle pour combler un vide.

### Sortie

Un document autonome, versionnable et relisible sans la conversation d’origine.

## 9. Étape 6 — Préparation à la planification

### Objectif

Définir précisément ce qui doit pouvoir être pris en charge par une phase de planification, sans planifier elle-même le développement.

Utiliser le template `TEMPLATE_PRET_A_PLANIFIER.md`.

### Questions à résoudre

- quel est le périmètre exact à développer ;
- quel est le hors périmètre ;
- quelles dépendances existent ;
- quels prérequis sont nécessaires ;
- quel découpage logique est possible ;
- quels éléments doivent rester ensemble ;
- quels éléments peuvent être différés ;
- quels points ouverts restent réellement bloquants.

### Sortie

Une fiche de transfert avec le statut :

`PRÊTE À PLANIFIER`

## 10. Conditions de fin

Une évolution est `PRÊTE À PLANIFIER` lorsqu’il est possible de déterminer de manière fiable :

- son objectif ;
- son périmètre ;
- ses comportements attendus ;
- ses dépendances principales ;
- ses impacts ;
- ses exclusions ;
- les éventuels points encore ouverts et leur caractère bloquant ou non.

La conception n’a pas besoin d’être parfaite ou immuable.

Elle doit être suffisamment déterministe pour éviter qu’une phase de planification doive redéfinir le concept de fond.

## 11. Artefacts produits

Le protocole produit au minimum :

1. un **document autonome de conception** ;
2. une **fiche PRÊTE À PLANIFIER**.

Les décisions intermédiaires peuvent rester dans la conversation tant qu’elles sont intégralement consolidées dans ces deux artefacts en fin de phase.

## 12. Hors périmètre de ce protocole

Ce protocole ne définit pas :

- la planification du développement ;
- les tranches ;
- les branches Git ;
- les workflows CI/CD ;
- le développement ;
- la revue d’implémentation ;
- la finalisation ;
- la publication.

Il est volontairement indépendant de ces mécanismes.

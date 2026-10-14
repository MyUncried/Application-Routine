# KODJO — Règles et concepts nouveaux

> **Formats de séances — cible du 14/10/2026 :** [spécification Formats du 14/10](SPECIFICATION-FORMATS-SEANCES-2026-10-14.md). Les règles propres aux formats complètent les séances libres ; elles ne changent pas les preuves figées de PRE-3/PRE-4. Moteur cible à développer. [Traçabilité](../MATRICE-FORMATS-SEANCES-2026-10-14.md) et [revue transverse](../REVUE-COHERENCE-FORMATS-2026-10-14.md).


**Actualisation13/10 :** [Deux modes et cible À l’échec](SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md). Mode commun Durée/Répétitions, cible typée par Série ; ≥ pour mélange calculable. Contrat CE-UI-10 et DSF Deux modes pour le sélecteur actuel.

**Spécification fonctionnelle cible — arbitrages clos le12/10/2026 à09h39. Propagation documentaire autorisée à09h44. Captures et DSF à aligner ultérieurement.**

*12 octobre 2026 · Fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg` · pages `Conception — Hors MVP` et `Prototype MVP`*

---

## 0. Objet, et comment lire ce document

Ce document énonce **ce qui a été décidé**, pas ce qui a été essayé. Chaque section donne la règle, son domaine d'application, et les cas limites qu'elle tranche. Les sections 9 à 13 consolident les décisions, les vérifications, les impacts et les points résiduels. Les décisions du propriétaire priment sur les formulations antérieures. Aucun nouveau design n’est demandé.

La nature du circuit est une nouvelle information métier. Le régime explicite des séries est déjà prescrit dans Paramètres v13. Les migrations physiques et les champs effectivement manquants doivent être déterminés par comparaison au schéma implémenté ; leur absence ou présence ne se déduit pas de Figma.

Trois sources font autorité et ne sont pas réécrites ici :

- `docs/Specifications-fonctionnelles/SPECIFICATION-BIP-CADENCE-v2.md` (07/10/2026) pour le contrat temporel ;
- le DSF, pour les composants et les mesures ;
- le document jumeau *Modifications Figma*, pour l'inventaire des écrans et des composants.

**Avertissement sur le code.** Le document source signalait un retard de `calculations.ts` sur Bip v2. Ce constat n’a pas été requalifié dans ce lot documentaire. Les spécifications définissent la cible ; aucun comportement attendu ne se déduit d’un commentaire d’implémentation.

---

## 1. Un circuit est *de tours* ou *de séries*

### 1.1 La règle

Un circuit porte désormais une **nature**, qui prend deux valeurs. L’ordre des exercices est conservé, mais le développement de leurs séries et le nombre d’occurrences exécutées diffèrent. La nature détermine aussi **d’où vient le nombre de séries de chaque exercice**.

| | circuit **de tours** | circuit **de séries** |
|---|---|---|
| exemple : compte 3, A et B à 3 séries | (A1 A2 A3 B1 B2 B3) × 3 | A1 B1 A2 B2 A3 B3 |
| nombre de séries par exercice | propre à chaque exercice, **indépendant** d'un exercice à l'autre | **identique pour tous**, hérité du circuit |
| ce qu'un passage exécute | toutes les séries de chaque exercice | **une et une seule** série de chaque exercice |
| statut | comportement actuel, inchangé | nouveau |

Le circuit de tours **est** le comportement existant : rien n'y change. Le circuit de séries **ne crée pas de paramètre**, il **contraint** un paramètre existant — le nombre de séries de chaque exercice du circuit vaut N, le nombre porté par l'en-tête.

C'est le circuit de séries qui rend exprimable le **circuit à volumes progressifs** : X exercices qui s'enchaînent, dont les volumes croissent d'un passage au suivant.

### 1.2 Le contrôle

La nature est portée par **le mot d'unité du compteur de l'en-tête de circuit**, déjà présent : « 3 tours » ou « 3 séries ».

- appuyer sur **le chiffre** révèle les boutons `−` et `+`, qui changent le nombre ;
- appuyer sur la pastille **« tours » ou « séries »** ouvre le choix de nature ;
- la pastille n’entoure jamais le chiffre.

Les deux cibles tactiles sont distinctes. Cette décision du 12 octobre remplace l’ancienne cible unique sur toute la valeur.

### 1.3 La conversion entre les deux natures

Le nombre affiché ne change pas : « 3 tours » devient « 3 séries ».

**Séries → tours ne perd rien.** La contrainte disparaît, chaque exercice garde son compte et ses valeurs. Aucune confirmation.

**Tours → séries force tous les exercices à N.** Un exercice qui a moins de N séries en gagne, **préremplies en répétant sa dernière valeur** ; un exercice qui en a plus **perd les séries au-delà de N, avec leurs valeurs**.

**L'aller-retour n'est donc pas réversible**, et c'est ce qui justifie une confirmation.

### 1.4 La règle de déclenchement de la confirmation

Une fenêtre de confirmation — Annuler / Confirmer — s'affiche **si et seulement si au moins un exercice perd des valeurs**.

Un exercice qui en gagne ne la déclenche pas : rien n'est détruit, et la valeur ajoutée est visible et corrigible à l'écran suivant.

**Les séries tronquées par une conversion confirmée ne sont pas mémorisées.** Un retour vers « tours » ne les restitue pas. Annuler abandonne toute la conversion : nature, compte et exercices restent inchangés. La diminution du compte sans changement de nature suit une règle distincte de brouillon, définie au §9.2.

### 1.5 Ce que le circuit ne contraint pas

**Une correction d'une formulation antérieure.** La définition du circuit de séries a été écrite une première fois comme « les exercices ont des séries variables, leur nombre est identique d'un exercice à l'autre et il est hérité ». **Le mot « variables » n'a pas lieu d'y être.**

**Le circuit contraint le nombre de séries, jamais leur régime.** Le régime — séries identiques ou séries variables — est un réglage propre à chaque exercice, et il existe déjà dans les écrans (ligne « Séries » de la modale des modalités d'exécution). Basculer de tours à séries ne change que le compte.

**Le défaut d’un exercice nouvellement créé et ajouté à un circuit est « identiques ».** Un exercice existant provenant du catalogue conserve son régime (voir §9.3). Il naît à une série ; le circuit porte son compte à N ; le préremplissage répète la même valeur. Sa carte lit alors « 3 × 30 s ».

---

## 2. Le régime des séries d'un exercice

### 2.1 Deux valeurs

| régime | signification |
|---|---|
| **identiques** | toutes les séries ont la même valeur |
| **variables** | chaque série a sa propre valeur |

Le réglage est porté par un champ de la ligne « Séries », et le choix se fait par popover à deux entrées.

### 2.2 Trois états d'affichage, pas deux

Le régime et le repli de la liste sont **deux informations distinctes**, portées par deux contrôles distincts : le champ pour le régime, un chevron pour le repli.

| état | champ | chevron |
|---|---|---|
| séries identiques | `identiques` | **absent** — il n'y a pas de liste |
| variables, liste visible | `variables` | déployé |
| variables, liste masquée | `variables` | replié |

### 2.3 Le préremplissage, et la disparition du marqueur d'incomplétude

**Une série validée satisfait les paramètres requis par son mode.** Durée et Répétitions exigent une cible valide ; À l’échec n’exige pas de cible numérique. Une nouvelle série copie les paramètres de la dernière ligne active dans l’ordre courant, après restauration prioritaire des lignes temporairement retirées lorsque celle-ci s’applique. Cette règle existe déjà dans Paramètres v13 §3 ; elle comprend la cible et la Pause. Le Bip reste commun à l’exercice.

Conséquence directe : **il n'y a pas d'état « volume manquant » à signaler sur une carte de composition.** Le marqueur d'incomplétude envisagé pour la carte n'a plus d'objet et ne doit pas apparaître dans la documentation.

Le préremplissage s'applique dans les deux cas où une série apparaît sans saisie : l'ajout manuel d'une série, et l'extension forcée par la conversion tours → séries.

---

## 3. La fenêtre des volumes du circuit

### 3.1 Le besoin

Dans un circuit, la composition ne dit pas ce que contient chaque série de chaque exercice : il faut ouvrir chaque exercice pour le savoir. La vue d'ensemble manque au moment où elle est la plus utile — quand on compose.

### 3.2 La règle

Un bouton œil, posé **sur la ligne du titre de l'en-tête de circuit**, ouvre une fenêtre **en lecture seule** présentant une grille :

- une colonne `Exercice` ;
- une colonne par série, `S 1` … `S n` ;
- une **dernière colonne d’unité ou de mode**, à droite : `rép.`, `min:ss` ou `À l’échec`. Les rendus complétés sont définis au §9.5.

**Pas de pauses, pas de récupérations.** On y lit des volumes, pas un déroulé.

### 3.3 Le bouton est permanent, dans les deux natures

Il serait défendable de ne l'offrir qu'au circuit de séries, où il est le plus utile. Il est **présent dans les deux natures**, et actif dans les deux : un en-tête de circuit a une composition fixe, qui ne se réorganise pas quand on change sa nature.

### 3.4 La grille accepte deux régimes dans la même colonne

Un circuit peut contenir un exercice en séries variables et un autre en séries identiques. La grille les présente dans les mêmes colonnes :

- une ligne **plate** — « 45 · 45 · 45 » — pour un exercice en séries identiques ;
- une ligne de valeurs propres — « 10 · 12 · 14 », par exemple — pour un exercice en séries variables ; elles peuvent aussi décroître ou être égales.

La grille montre les valeurs. Elle ne permet pas de déduire le régime lorsque des séries variables ont des valeurs égales ; le régime reste une donnée explicite de l’exercice.

### 3.5 Sens de lecture, et défilement

Le tableau se lit **par colonne** dans un circuit de séries — une colonne est un passage — et **par ligne** dans un circuit de tours — une ligne est un exercice et toutes ses séries. Les deux lectures sont légitimes ; **la structure n'en privilégie aucune**.

Si l'on veut guider la lecture : coloriser une colonne sur deux, ou une ligne sur deux. Pour la place : **figer la colonne de titre et la colonne d'unité**, et faire défiler les colonnes de séries.

**Au-delà de la hauteur de l'écran, la fenêtre défile.** Ce n'est pas une décision de conception, c'est le comportement par défaut ; il n'appelle aucune règle particulière. Mesure utile au dimensionnement : à douze séries, le contenu dépasse de 153 px.

---

## 4. Ce que porte la carte d'un exercice, en composition

### 4.1 La règle

**La carte affiche le volume de l'exercice.** Les valeurs séparées par un point médian quand les séries varient, la forme courte sinon. L'unité est en fin d'énoncé.

| cas | affichage | statut |
|---|---|---|
| série unique, durée | `45 s` | inchangé |
| trois séries identiques, durée | `3 × 45 s` | inchangé |
| trois séries variables, répétitions | **`10 · 12 · 14 rép.`** | **nouveau** — remplaçait « 3 séries variables » |
| trois séries, durée composée | `3 × 1 min 30` | inchangé |
| bilatéral | `3 × 10 rép.` + pastille `D→G` | inchangé |
| à l'échec | `3 séries à l'échec` | inchangé |
| douze séries variables | **`10 · 12 · … rép.`** | **nouveau** — remplaçait « 12 séries variables » |

Les rendus variables remplacent l’ancien libellé limité au nombre de séries. Le tableau ci-dessus présente sept exemples, sans prétendre constituer un inventaire exhaustif des états Figma.

### 4.2 Le repli, et sa règle

**Autant de valeurs que la place en autorise, trois au maximum, puis `…`.** En pratique : trois valeurs pour les répétitions et les secondes, une seule pour les durées composées, qui sont longues.

Le `…` ne signifie pas « plus de trois séries ». Il signifie **« la suite est dans la fenêtre des volumes »**, ce qui est vrai dans les deux cas.

### 4.3 La forme suit le régime, pas les valeurs

Un exercice en régime **variables** dont les trois valeurs se trouvent être égales affiche **`45 · 45 · 45 s`**, et non `3 × 45 s`.

La raison est la **stabilité à l'édition** : sous une règle qui regarderait les valeurs, corriger une seule série ferait changer la *forme* du libellé, pas seulement son contenu. Le lecteur verrait la notation sauter d'un format à l'autre sans avoir rien demandé de tel.

### 4.4 Deux arbitrages actés, à ne pas rouvrir

**Le préfixe « N × » est conservé même dans un circuit de séries**, où le nombre est pourtant hérité et déjà écrit dans l'en-tête. La régularité de la carte l'emporte sur l'économie de place.

**La notation ne change pas selon le contexte.** Une carte s'écrit de la même façon qu'elle soit dans un circuit ou hors circuit, dans un circuit de tours ou de séries. Un lecteur peut inférer une absence ; il ne peut pas inférer une règle de notation qui varie. *Omettre ce qui est redondant* reste un principe recevable ; *changer de notation selon le contexte* ne l'est pas.

---

## 5. Le circuit, niveau d'agrégation temporelle

### 5.1 Le défaut corrigé

Sur un même écran, l'en-tête de séance affichait « ≥ 21 min » et l'en-tête de circuit, quarante pixels plus bas, « 19 min » — alors que ce circuit contenait un exercice en répétitions, dont la durée de travail est inconnue. Un tout approximatif composé de parties affirmatives.

Ce n'était pas une faute formelle : **la spécification Bip v2 ne nomme que deux niveaux**, l'Exercice et la Séance. Le circuit n'y figure pas. Le « 19 min » occupait un vide — et il l'occupait par une affirmation.

### 5.2 La règle posée

**Un circuit est un agrégat : il porte les trois mêmes états qu'une séance.**

| état | condition |
|---|---|
| exact | tous les exercices du circuit ont une durée exacte |
| `≈` | au moins une estimation, aucun travail inconnu |
| **`≥`** | **au moins un exercice a un travail inconnu** |

Critère opérationnel : présence d’un exercice en Répétitions avec Bip = 0, ou en À l’échec quel que soit le Bip. Les répétitions avec Bip positif produisent une estimation, pas du travail inconnu. Le calcul consulte les paramètres métier, jamais le texte d’une carte.

Le symbole est **préfixé à la valeur** — « ≥ 19 min ». La spécification attache le `≥` au libellé pour la modale (`compactLabelLowerBound: "Durée totale ≥"`), mais l'en-tête de circuit n'a pas de libellé : seul le nombre y figure.

### 5.3 Rappel du contrat temporel, inchangé

Ce qui suit reprend le contrat temporel existant pour ses règles conservées. Le nouveau circuit de séries complète le développement bilatéral au §11 Q-01 ; ses passages ne doivent pas être calculés avec la formule de succession de toutes les séries d’un côté.

| niveau | cas | résultat |
|---|---|---|
| Exercice | Durée | exact, sans symbole |
| Exercice | Répétitions, bip positif | `≈` valeur |
| Exercice | Répétitions, bip 0 | **omitted** — ligne absente |
| Exercice | À l'échec | omitted — ligne absente |
| Séance | tout exact | exact |
| Séance | au moins une estimation, aucun inconnu | `≈` somme |
| Séance | au moins un exercice sans durée | `≥` contributions connues |

Les règles qui ne se devinent pas :

- `Ti = Ri × b` en répétitions avec bip ; **aucune estimation forfaitaire de répétition n'est utilisée** — il n'existe pas de cadence par défaut, le défaut est **0 = Aucun** ;
- **aucun `≥` au niveau d'un Exercice**, même avec pauses ou récupération — le `≥` est réservé aux agrégats ;
- **`omitted` signifie absence de ligne, de valeur, de zéro et de tiret** ;
- les pauses d'un exercice dont le total propre est omis **contribuent quand même au total de Séance** ;
- bilatéralité : `2Σ(Ti+Pi)+PC` pour « un côté après l'autre », `2ΣTi+ΣPi+N×PC` pour « les deux côtés à chaque série ». **Les totaux comptent les deux côtés et la pause de changement de côté.**

---

## 6. Le modèle d'interaction des valeurs réglables

Cette section décrit un modèle d'interaction général, appliqué à toutes les valeurs numériques de la modale des modalités d'exécution et aux réglages de composition de séance.

### 6.1 Au repos, seule la valeur est visible

Les boutons `−` et `+` n'apparaissent **qu'à l'appui sur la valeur**. Au repos, la ligne ne porte qu'un libellé à gauche et une valeur à droite.

Les boutons apparaissent **à droite de la valeur**, qui recule d'une translation constante. Les mettre à gauche ferait couvrir le chiffre par la main pendant qu'il change.

### 6.2 Un seul champ actif à la fois

Appuyer sur une autre valeur ferme le précédent et ouvre le nouveau **d'un seul geste**. Les boutons disparaissent et réapparaissent plutôt que de voyager d'une ligne à l'autre.

### 6.3 Il n'y a rien à valider

Chaque appui sur `−` ou `+` est acquis. **L'appui à l'extérieur range l'outil** ; il n'y a pas de bouton Annuler.

C'est ce qui distingue ce modèle du popover de roulette, qui a besoin d'une validation parce qu'un défilement continu n'a pas d'instant de décision.

### 6.4 Deux règles de sûreté

**L'appui qui range l'outil ne doit pas activer ce qu'il touche lorsque la cible est destructive.** Sinon on supprime une série en croyant terminer un réglage. Pour une cible inoffensive — une autre valeur, un chevron — l'appui peut faire les deux.

Ranger l’outil ne revient pas sur les appuis ±. Ils restent cependant dans le brouillon transactionnel : ✕ annule l’ouverture de la feuille, ✓ applique au parent. **La suppression manuelle par croix est immédiate, sans confirmation, avec une action « Annuler » restaurant position et paramètres** (§9.6).

### 6.5 La cellule active a deux coordonnées

Dans un tableau où les boutons sont communs à toutes les lignes, ils ne disent plus sur quoi ils agissent. La cellule visée est donc désignée **trois fois** : une barre d'accent sur la ligne, un fond coloré sur la colonne, et **la mention textuelle de la cellule dans le pied du tableau** — « Série 1 · Durée ».

---

## 7. Le marqueur d'un déclencheur de popover

### 7.1 L'état des lieux, établi par recensement

- le seul composant du DSF qui porte un chevron **déploie ou replie** ; son second emploi, pointant à droite, est la **navigation** ;
- le composant qui sert de déclencheur de popover **ne contient qu'un texte**, sans marqueur — **341 instances** sur la page du prototype, plus 65 contrôles segmentés ;
- une seule exception dans tout le fichier, dans un écran d'exploration ancien, jamais généralisée.

**La convention établie, à l'échelle de 341 champs, est : valeur bleue, sans marqueur.** Un chevron y dirait « ceci se déploie », ce qui est faux.

### 7.2 La règle retenue

**Un déclencheur de popover situé en dehors du formulaire de l'exercice reçoit un fond — une pastille — là où la couleur bleue ne suffit pas à dire qu'on peut appuyer.**

À l'intérieur du formulaire, toute valeur bleue s'appuie : la pastille n'y ajouterait rien et multiplierait les boîtes par écran. **Les 341 champs restent nus.** En faire la règle générale serait une campagne à part, à décider explicitement.

Le cas d'application est l'en-tête de circuit : « 3 **tours** », où seul le mot d'unité reçoit la pastille, le nombre restant nu puisqu'il relève des boutons.

---

## 8. Impacts attendus

### 8.1 Modèle de données

| objet | impact |
|---|---|
| Circuit | **un attribut de nature**, deux valeurs : *tours* (défaut, comportement actuel) / *séries* |
| Circuit | le nombre existant — `tourRepeatCount` ou son équivalent — **change de sens selon la nature** : nombre de tours, ou nombre de séries imposé à chaque exercice. À vérifier : vaut-il mieux un second champ qu'une surcharge de sens ? |
| Exercice | Régime identiques/variables déjà prescrit dans la spécification ; contrôler sa présence dans le schéma réel. Ne jamais le déduire de l’égalité des valeurs. |
| Série | aucun champ nouveau |

### 8.2 Règles de calcul

1. **Agrégation temporelle au niveau Circuit** — à ajouter : un circuit produit un résultat typé `exact` / `estimated` / `lowerBound`, selon les mêmes règles que la Séance. La spécification Bip v2 est à compléter de ce niveau.
2. **Préremplissage** — à implémenter dans les deux cas : ajout manuel d'une série, et extension par conversion tours → séries. Valeur reprise : **la dernière ligne active dans l’ordre courant**, conformément à Paramètres v13 §3.
3. **Troncature à la conversion** — perte définitive des séries au-delà de N, sans mémorisation.
4. **Détection de perte** — prédicat déclenchant la confirmation : « au moins un exercice du circuit a plus de N séries ».
5. **Formatage du volume d'une carte** — fonction nouvelle, dont l'entrée est le régime de l'exercice et la liste de ses valeurs, et qui applique §4.1 et §4.2.

### 8.3 Documentation à mettre à jour

| document | ce qui change |
|---|---|
| Spécification du circuit | la nature, le contrôle, la conversion, la confirmation, la fenêtre des volumes |
| `SPECIFICATION-BIP-CADENCE-v2.md` | ajout du **niveau Circuit** dans la table des résultats typés |
| Spécification de la composition de séance | ce que porte la carte d'un exercice (§4) |
| Spécification des modalités d'exécution | le régime des séries, le préremplissage, le modèle d'interaction (§6) |
| Guide de contribution au DSF | la règle du marqueur de déclencheur (§7) |

### 8.4 Ce qui disparaît de la documentation

**Le marqueur d'incomplétude sur la carte de composition.** Il n'a plus d'objet : le préremplissage garantit qu'une série a toujours un volume (§2.3).

---

## 9. Compléments normatifs issus des arbitrages du 12 octobre

### 9.1 Périmètre et plan d’exécution

Le MVP comporte **un seul circuit par composition**. Aucun écran de gestion multicircuit n’est introduit. Les décisions sur les déplacements entre circuits sont conservées pour une évolution future.

Circuit de séries : pour chaque indice i de 1 à N, parcourir les exercices dans l’ordre de composition et exécuter leur série i. Chaque passage d’un exercice bilatéral réalise ses deux côtés avant de passer à l’exercice suivant. Le côté de départ est conservé. **Le circuit n’écrit pas le réglage Ordre des côtés de l’exercice et ne le rend pas en lecture seule.** Le déroulement est unique : premier côté → Pause entre les côtés → second côté → Pause après la série → exercice suivant. Le réglage enregistré « Un côté après l’autre » ne crée pas de seconde variante de passage dans un circuit de séries (Q-01 close, §11).

Une récupération interne suit son emplacement de composition à chaque passage. Exemple, récupération après B : A1 → B1 → R → A2 → B2 → R → A3 → B3 → R. Si R>0, elle remplace uniquement la pause terminale du passage de B ; les pauses de A sont conservées. R=0 n’ajoute aucune phase et ne remplace aucune pause. La pause configurée reste dans les données de l’exercice.

Un point d’arrêt **interne** suit également son emplacement à chaque passage. Conserver l’ordre existant : Exercice → Récupération positive éventuelle → Point d’arrêt → suite. Les points extérieurs au circuit restent extérieurs : ils ne sont pas dupliqués avec ses passages. Leur attente reste exclue des durées prévues.

**Préparation et fin :** un exercice seul utilise son Compte à rebours et sa Fin d’exercice une fois. Dans une séance, ces paramètres propres ne sont jamais exécutés : seuls ceux de la séance s’appliquent, par substitution, une fois aux frontières de la séance. Cette décision explicite remplace pour la cible de cette évolution les mentions contraires du référentiel (voir §10). Aucun compte à rebours supplémentaire à chaque série ou passage. **Clarification du12/10 à09h28 : aucun booléen de Séance, même désactivé par défaut, ni contrôle correspondant. La règle est inconditionnelle. Figma est confirmé aligné par le propriétaire.**

Le déplacement d’une série conserve le comportement de Paramètres v13 : ses paramètres se déplacent ensemble, l’ordre est renuméroté et les autres exercices restent inchangés. Aucun nouvel arbitrage ni redesign.

### 9.2 Nombre imposé et diminution

Dans un circuit de séries, le nombre de séries de chaque exercice est N, porté par l’en-tête. Dans la feuille de l’exercice, il reste visible avec sa valeur réelle, non modifiable. La mention discrète de son origine et un éventuel astérisque seront positionnés dans Figma. Pas de tiret à la place du nombre. **Ce nouvel état de lecture seule ne concerne pas l’Ordre des côtés.** Le régime reste celui de l’exercice, sous réserve des règles existantes de N=1.

Diminuer N, sans changer la nature du circuit, est immédiat et sans message. Les lignes retirées sont conservées pendant **l’édition de la séance** ; réaugmenter les restaure avec leurs paramètres et leur ordre. L’enregistrement ne conserve que les lignes actives. Une augmentation postérieure copie la dernière ligne persistée. Une ouverture/validation de la feuille d’un exercice ne doit pas purger à elle seule la réserve créée par le compteur du circuit : cette réserve appartient au brouillon de séance.

Cette réserve est une exception limitée au brouillon, pas un historique persistant. Elle est distincte de la troncature définitive d’une conversion confirmée. Les lignes retirées ne participent ni aux cartes, ni à la grille, ni au calcul, ni au plan.

Hors héritage du circuit, conserver la frontière existante de la feuille : restauration avant ✓ ; après ✓ les lignes retirées de cette feuille ne sont plus conservées. Aucun allongement implicite de leur durée de vie à toute la séance.

### 9.3 Ajout et sortie du circuit

Un exercice du catalogue ajouté au circuit conserve son régime et ses paramètres, puis son exemplaire de séance est adapté à N. S’il manque des séries, copier la dernière ligne ; s’il faut en retirer, confirmation avant application. Annuler abandonne l’ajout ; confirmer applique l’ajout et l’adaptation atomiquement. **L’exercice du catalogue n’est jamais modifié.**

Sortir l’exercice du circuit conserve le nombre actif et les paramètres actuels. Le nombre redevient modifiable ; aucun ancien nombre n’est restauré et aucun message n’est nécessaire.

Futur, hors MVP : déplacement vers un autre circuit de séries selon la même adaptation. Annuler conserve emplacement et données d’origine ; confirmer réalise déplacement et adaptation ensemble.

### 9.4 Régime et validation : règles existantes conservées

Variables → identiques reprend la première ligne dans l’ordre actuel : cible **et Pause**, déjà définies dans Paramètres v13 §3. Aucun nouveau message. La réactivation avant ✓ retrouve le tableau variable ; validation en uniforme ne persiste pas les alternatives cachées.

Ajouter une série restaure d’abord une ligne récupérable, sinon copie la dernière ligne active. Les pauses et cibles suivent la règle existante. Changer de mode ne convertit pas arbitrairement les cibles : les validations et la conservation temporaire propres aux modes restent celles de v13.

L’absence de marqueur d’incomplétude sur la carte de composition **ne supprime pas les erreurs de saisie dans la feuille**. Un changement de mode peut exiger une nouvelle cible ; ✓ reste interdit tant qu’une cible requise est invalide. À l’échec ne demande jamais de volume numérique.

### 9.5 Grille des volumes

- Colonnes S1…Smax, où Smax est le nombre maximal de séries des exercices ; circuit de séries : Smax=N.
- Série inexistante : `—`, sans signifier zéro ou erreur de saisie.
- Répétitions : nombres dans les cellules ; `rép.` en dernière colonne.
- Durées : `min:ss` dans toutes les cellules, par exemple `0:45`, `1:00`, `1:30` ; `min:ss` en dernière colonne.
- À l’échec : `✓` dans chaque cellule existante, `À l’échec` en dernière colonne. Dans cette vue de composition, le symbole signifie série prévue, jamais résultat réalisé. Libellé accessible : « Série N, à l’échec ».
- Bilatéral : cible **par côté**, sans doublement ; pastille de côté près du nom. Une cible de 10 répétitions par côté affiche 10.
- Lecture seule ; aucune pause ou récupération dans cette grille. Les durées `min:ss` sont des cibles de travail et non des totaux incluant les pauses.
- Conserver défilement horizontal des séries, colonne Exercice et colonne Unité/mode fixes ; contenu vertical accessible et défilant.

### 9.6 Suppression et interactions

Croix de suppression : retirer immédiatement, sans confirmation ; message discret « Série supprimée — Annuler ». Annuler restaure les paramètres et la position. Réutiliser la convention existante de notification ; ne pas inventer une durée ou un nouvel écran. Les bornes de validité existantes restent applicables.

Dans un circuit de séries, le nombre se règle dans l’en-tête : pas de suppression locale permettant de rompre l’invariant N dans un seul exercice. Le déplacement de lignes reste possible.

Un appui extérieur sur une cible destructive range d’abord l’outil sans déclencher la destruction. Un appui sur une cible inoffensive peut fermer et agir en un seul geste.

La pastille de nature et le chiffre sont deux cibles distinctes (§1.2 corrigé). Le régime et le chevron de repli restent distincts. Leur position, la couleur de la suppression et l’indication de lecture seule sont des finitions DSF/Figma, pas de nouveaux choix métier.

## 10. Vérification du référentiel existant

Lecture GitHub du 12 octobre 2026, arbre de `main` figé pour cette vérification : `46b91bd279424899a02c099a68b2729f6d710809`.

Sources effectivement lues :

- `docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v13.md`, §§2–8 ;
- `docs/Specifications-fonctionnelles/SPECIFICATION-BIP-CADENCE-v2.md`, notamment §§2–3, 7–8 ;
- `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md` ;
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`, notamment D-249/D-250 ;
- `docs/archives/series-variables-2026-10-02/conception-source.md`, source historique, sans primauté sur les amendements.

| Sujet vérifié | Résultat | Traitement |
|---|---|---|
| Préremplissage, cible et Pause | Déjà prescrit, dernière ligne active, restauration prioritaire | Reprise sans nouvel arbitrage |
| Variables → identiques | Première ligne, cible et Pause, déjà prescrit | Reprise sans nouvel arbitrage |
| Déplacement d’une série | Paramètres déplacés ensemble, déjà prescrit | Aucun nouveau design |
| Conservation après réduction | Existante jusqu’à ✓ dans la feuille | Nouvelle portée explicite du brouillon de séance pour le compteur du circuit uniquement |
| Bip positif en Répétitions | Estimation, pas durée inconnue | Corriger le critère erroné du document initial |
| Compte à rebours / Fin propres | Chapitre08 conserve un réglage global « Appliquer compte à rebours et fin des exercices », actif par défaut | Correction dédiée du référentiel demandée le12/10 à09h28 : supprimer le booléen du besoin, des données/API cibles et des contrats ; D-214 révisée et V-04 close. Les anciens champs éventuellement persistés ne peuvent réactiver ces phases ; migration physique à inventorier. Pas de modification applicative dans ce lot |
| N=1 bilatéral | Normalisation explicite « Un côté après l’autre », pauses différentes de l’ordre par paire | Q-01 close : déroulement contextuel unique, sans application de la seconde pause de succession des côtés |
| Durée uniforme ajustable | v13 inverse la durée en faisant varier N | Q-02 close : total en lecture seule lorsque N est hérité |
| Réinitialisation bilatérale | v13 remonte à la première série du côté courant, résultats de l’autre côté conservés | Préserver la portée ; spécifier le raccordement des occurrences entrelacées avant qualification, sans rejouer implicitement les autres exercices |

Cette vérification est documentaire et ciblée. Elle ne certifie ni le schéma implémenté, ni les captures Figma, ni le comportement de PRE-3.

## 11. Clôture des deux questions métier et travaux de vérification

### Q-01 — Déroulement bilatéral unique par passage — CLOSE

**Décision du propriétaire du12/10 à09h36 :** dans un circuit de séries, les deux côtés de chaque exercice et la pause sont exécutés à chaque passage. « Un côté après l’autre » n’a pas de décomposition distincte par passage. La proposition de conserver deux variantes de pauses est abandonnée.

Séquence normative : premier côté i → PC → second côté i → Pi → exercice suivant. La direction initiale reste celle de l’exercice. Pas de Pi supplémentaire avant PC. Les phases de durée0 ne produisent pas d’attente. Une récupération positive après l’exercice remplace uniquement Pi terminale ; elle ne remplace pas PC. Un point d’arrêt suit la récupération éventuelle.

Conséquence de calcul, lorsque Ti est calculable : passage bilatéral = 2Ti + PC + Pi ; avec R>0 à cet emplacement = 2Ti + PC + R. Somme sur les N passages, sans multiplier encore par N. Avec travail inconnu, PC et Pi (ou R en substitution) restent des contributions connues ; le résultat agrégé reste lowerBound. Les répétitions avec Bip positif restent estimées.

Cette règle contextuelle vaut pour les passages du circuit de séries ; elle ne réécrit ni le réglage Ordre des côtés enregistré, ni les règles d’un exercice autonome ou d’un circuit de tours. La normalisation existante d’un exercice à N=1 ne doit pas introduire une seconde pause dans ce déroulement contextuel unique.

### Q-02 — Durée totale sous nombre de séries imposé — CLOSE

**Décision validée le12/10 à09h39 :** la Durée totale de l’exercice reste calculée et affichée, mais non modifiable lorsque son nombre de séries est imposé par le circuit. L’inversion Durée totale → nombre de séries est indisponible dans ce contexte. Aucun ajustement implicite de la cible ou du compte du circuit.

Les règles d’affichage temporel restent applicables : un résultat omitted n’acquiert pas de ligne, de zéro ni de tiret. La lecture seule concerne donc une durée affichable ; elle ne force pas l’affichage d’un total en Répétitions sans Bip ou À l’échec. Les changements de cibles/pauses ou du compte du circuit recalculent le total.

À la sortie du circuit de séries, le total retrouve son comportement ordinaire : modifiable uniquement si le mode et le régime l’autorisent déjà (Durée uniforme). Aucun nouveau contrôle n’est introduit ; les modalités visuelles de lecture seule sont à positionner dans Figma.

### Travaux de formalisation et de vérification, sans questionnaire de redesign

- Décrire la réinitialisation et la reprise sur les identifiants stables des occurrences entrelacées, en conservant les résultats acquis et la portée existante. Si cela révèle un choix métier non couvert, le présenter avec un exemple précis.
- Bornes vérifiées dans chapitre08 et Paramètres v13 : compte du circuit et nombre de séries sont compatibles,1..99, défaut1. Aucune nouvelle borne.
- Vérifier le schéma et les APIs avant de choisir les noms physiques et la migration ; préférer un compte sémantiquement neutre associé à la nature plutôt que deux valeurs concurrentes.
- Finaliser le layout dans Figma : astérisque/mention, position du chevron, couleur destructive, formats longs et notification Annuler. Document jumeau et inventaire des frames encore nécessaires pour une propagation exhaustive des captures.
- Historique du lot du 12/10 : les formats et le multicircuit n’étaient pas inclus. Depuis la spécification Formats du 14/10, EMOM est borné par un compte, AMRAP par une durée, Death by par arrêt déclaré ; leurs extensions sont documentées dans ce lot distinct. Le multicircuit reste exclu.

## 12. Propagation documentaire et architecture cible

Ne pas intégrer cette évolution dans les corrections de conformité PRE-3. Conserver sa référence extraite et traiter cette spécification comme une évolution distincte.

| Cible | Mise à jour à préparer |
|---|---|
| Glossaire / modèle fonctionnel | Nature de circuit, compte, série définie vs occurrence exécutée, un circuit MVP |
| Paramètres v13 | Nombre hérité, contrôles, conservation au bon niveau de brouillon, suppression annulable, déroulement bilatéral unique et total en lecture seule (Q-01/Q-02 closes) |
| Bip v2 | Circuit comme agrégat exact/estimated/lowerBound ; développer le plan avant somme, sans double multiplication ; préparation/fin de séance par substitution |
| Plan et processus métier | Deux développements du circuit ; récupérations et arrêts répétés seulement s’ils sont internes ; identifiants stables, reprise et reset |
| Modèle de données / APIs | Nature avec reprise historique tours ; compte et régime explicite ; invariant N ; copies d’occurrences indépendantes du catalogue ; mutation atomique |
| Instantanés / historique | Conserver la nature et le plan effectif ; ne pas réinterpréter les résultats passés avec une nouvelle règle |
| Chapitres06/13 et DSF | Contrats et états complets des contrôles, confirmation, grille, suppression, accessibilité ; captures liées aux frames identifiées |
| Cartes / phrases | Nouveau formateur compact des volumes ; aucune phrase persistée, segments conservés ; ne pas remplacer le corpus des phrases complètes par les règles de troncature des cartes |
| Registre et recette | Décisions ci-dessous, liens sources/écrans/tests ; scénarios de conversion, annulation, restauration, exécution et non-régression |

Les résultats temporels et les phrases sont dérivés, pas des sources persistées concurrentes. Les réserves temporaires de séries appartiennent au brouillon, jamais à l’historique exécuté. Les anciennes données sans nature restent des circuits de tours. Les migrations physiques seront planifiées après inventaire réel ; aucun serveur, hébergement ou nouveau service n’est requis par principe pour ces règles locales.

## 13. Matrice de traçabilité et recette attendue

Les identifiants ci-dessous sont locaux à ce document ; ils ne remplacent pas les identifiants du registre du dépôt.

| ID | Décision / correction | Référence | Vérification attendue |
|---|---|---|---|
| C01 | Deux natures, plans distincts, un circuit MVP | §§1,9.1 | 18 vs6 occurrences dans l’exemple A/B ; ancien comportement tours conservé |
| C02 | Conversion atomique, confirmation si perte, pas de restauration après conversion | §§1.3–1.4 | Annuler ne change rien ; confirmer tronque ; retour tours ne restaure pas |
| C03 | Récupération après B à chaque passage | §9.1 | R après B1/B2/B3 ; R0 conserve Pi ; R positive remplace seulement Pi terminale |
| C04 | Deux côtés avant exercice suivant, réglage non réécrit | §§9.1,11 Q-01 | Premier côté → PC → second côté → Pi ; R positive remplace seulement Pi ; deux directions et N1/plusieurs |
| C05 | Compte hérité visible non modifiable | §9.2 | Pas de tiret ; pas de modification locale ; mention accessible |
| C06 | Diminution sans message, réserve jusqu’à enregistrement de séance | §9.2 | 4→3→4 restaure ; enregistrer3 puis augmenter copie la dernière active |
| C07 | Préremplissage et bascules existants | §9.4 | Cible et Pause ; première/dernière ligne selon action ; retour avant ✓ |
| C08 | Ajout catalogue sans mutation de source | §9.3 | Extension ; troncature confirmée ; Annuler abandonne ajout |
| C09 | Sortie conserve l’état actif | §9.3 | Nombre libre après sortie, valeurs inchangées |
| C10 | Déplacement entre circuits futur | §9.3 | Consigné hors MVP, aucun écran ajouté |
| C11 | Grille hétérogène | §9.5 | Maximum des comptes ; tirets seulement pour séries absentes |
| C12 | Échec compact et cible bilatérale | §9.5 | ✓ prévu, non réalisé ; volume par côté avec pastille |
| C13 | Durées min:ss | §9.5 | 0:45/1:00/1:30, même format et unité |
| C14 | Suppression annulable | §9.6 | Suppression immédiate ; restauration complète ; respect du nombre imposé |
| C15 | Chiffre et pastille distincts | §1.2 | Chiffre révèle ± ; unité ouvre nature ; pas de chevauchement tactile |
| C16 | Préparation/fin par substitution | §§9.1,10 | En direct une fois ; en séance seulement les phases de séance |
| C17 | Point d’arrêt interne répété | §9.1 | Après récupération ; extérieur non répété ; attente hors total |
| C18 | Déplacement de série inchangé | §§9.1,10 | Paramètres joints ; autres exercices inchangés |
| C19 | Agrégation corrigée | §5 | Bip positif → estimation ; inconnu prioritaire ; pauses connues incluses |
| C20 | Validation sans marqueur de carte | §§2.3,9.4 | Cible requise invalide bloque ✓ ; échec sans cible numérique valide |
| C21 | Total en lecture seule sous nombre imposé | §11 Q-02 | Aucun accès d’inversion ; calcul réactif ; omitted reste absent ; sortie restaure le comportement ordinaire |

**État de clôture :** décisions consolidées ; Q-01 et Q-02 closes. Aucun arbitrage supplémentaire identifié à ce stade. Formalisation de reprise à vérifier, layout et migrations non certifiés. Aucune affirmation de conformité exhaustive Figma ou de recette exécutée. La présente version porte la propagation normative de l’évolution des circuits, autorisée le12/10 à09h44. Les captures et le DSF restent une étape distincte. Exception autorisée le12/10 à09h28 : correction documentaire ciblée des phases propres en Séance, portée séparément dans la branche docs/session-phases-sans-booleen-20261012.


**Suivi de publication :** la correction indépendante « aucun booléen de phases propres en Séance » est publiée dans la [PR #349](https://github.com/MyUncried/Application-Routine/pull/349). Ce lien ne constitue pas une preuve de fusion. Les autres règles sont propagées dans ce lot documentaire dédié ; aucune livraison logicielle ni conformité visuelle n’est revendiquée.

<a id="formats-raccordement"></a>

## Raccordement aux formats de séance — 14/10

Par exercice et en alternance sont des organisations, pas de nouveaux modes. Tabata : huit séries par exercice ; alternance via circuit de séries ; copie par exercice à un tour. Progression conserve l’indexation série. For time impose une échelle par tour et n’expose pas ce sélecteur. EMOM conserve N passages par exercice, durée N × E × W quelle que soit l’organisation ; ne pas multiplier deux fois N. Les champs hérités restent effectifs. Les formats à fin temporelle/arrêt déclaré complètent le cas historique des comptes finis.

Source : [spécification Formats du 14/10](SPECIFICATION-FORMATS-SEANCES-2026-10-14.md).

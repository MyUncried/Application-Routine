# KODJO — Conception fonctionnelle
## Séries variables et organisation bilatérale par série

**Date :** 2 octobre 2026  
**Statut :** Conception fonctionnelle validée — prête pour proposition UX/UI dans Figma  
**Position dans le processus :** après PRE-1, avant planification PRE-2  
**Nature du document :** handoff autonome de conception ; ne modifie pas à lui seul les spécifications normatives, Figma ou le code.

---

## 1. Contexte

KODJO modélise actuellement un Exercice selon un mode d’exécution unique :

- **Durée** ;
- **Répétitions** ;
- **À l’échec**.

Un Exercice possède notamment :

- un nombre de Séries ;
- une cible commune à toutes les Séries lorsque le mode en exige une ;
- une Pause commune ;
- un Changement de côté `Aucun / D→G / G→D` ;
- une Pause au changement de côté lorsqu’il est bilatéral ;
- une Récupération après Exercice uniquement lorsqu’il est contextualisé dans une Séance ;
- un Compte à rebours propre et une Fin d’exercice propre.

Deux limites fonctionnelles ont été identifiées lors de l’analyse des structures d’entraînement représentables :

1. toutes les Séries d’un Exercice partagent actuellement la même cible et la même Pause ;
2. un Exercice bilatéral exécute actuellement toutes les Séries du premier côté puis toutes celles du second.

La présente conception traite exclusivement ces deux extensions :

- **Séries variables** ;
- **Organisation des côtés = Séries groupées / Par série**.

Les cibles d’intensité telles que charge, RPE/RIR, fréquence cardiaque, puissance, allure ou cadence restent volontairement hors modèle paramétrique. Elles peuvent être décrites dans le nom, la Description ou la consigne de l’Exercice.

---

## 2. Objectif

Étendre la capacité de modélisation de KODJO sans introduire de nouveaux types d’entraînement spécifiques tels que « pyramide », « drop set », « ladder », etc.

L’objectif est de conserver une grammaire générique :

- un Exercice ;
- un mode ;
- N Séries ;
- éventuellement des paramètres propres à chaque Série ;
- une organisation bilatérale ;
- des Pauses ;
- une éventuelle Récupération contextuelle après l’Exercice.

Cette évolution doit permettre de représenter notamment :

- pyramides de Durée ou de Répétitions ;
- progressions/dégressions ;
- intervalles à durées variables ;
- Pauses variables entre Séries ;
- alternance droite/gauche Série par Série ;
- combinaisons de Séries variables et de bilatéralité.

---

## 3. Frontières de conception

### Inclus

- modèle fonctionnel des Séries variables ;
- règles de bascule uniforme/variable ;
- interaction avec les trois modes d’Exercice ;
- interaction avec la bilatéralité ;
- organisation des côtés ;
- règles de Pause ;
- substitution par la Récupération post-exercice ;
- calcul de Durée totale ;
- règles de brouillon et de validation ;
- impacts sur l’Exécution ;
- impacts attendus sur données, domaine, calculs et futurs contrats UI ;
- contraintes à transmettre pour la conception Figma.

### Hors périmètre de cette phase

- choix précis du layout Figma ;
- géométrie, tailles, espacements, placement des contrôles ;
- choix détaillé du composant visuel utilisé pour chaque interaction ;
- développement ;
- modification de la documentation normative existante ;
- modification du registre des décisions ;
- modification du code ;
- modification de Figma.

Ces éléments seront traités après ce handoff.

---

## 4. Principes maintenus

1. **Exercice** reste l’unité fonctionnelle.
2. **Série** reste un paramètre de l’Exercice et ne devient pas une entité métier autonome réutilisable.
3. Le **mode d’exécution est unique pour tout l’Exercice**.
4. Un même Exercice ne mélange pas Durée, Répétitions et À l’échec selon les Séries.
5. Le nombre de Séries reste compris dans les bornes produit existantes.
6. La bilatéralité reste portée uniquement par l’Exercice.
7. Le nombre de Séries d’un Exercice bilatéral est toujours entendu **par côté**.
8. La Récupération après Exercice reste contextuelle à une occurrence de Séance et n’appartient jamais à `ActivityDefinition`.
9. Les deux nouvelles capacités sont optionnelles et préservent le comportement existant par défaut.
10. Les données d’intensité ne deviennent pas des paramètres structurants.

---

# 5. Décisions validées

## C1 — Paramètres variables par Série

Lorsque **Séries variables** est activé :

- en mode **Durée**, chaque Série possède sa propre durée ;
- en mode **Répétitions**, chaque Série possède son propre nombre de répétitions ;
- en mode **À l’échec**, la cible reste `À l’échec` pour toutes les Séries ;
- dans les trois modes, chaque Série possède sa propre **Pause après Série**.

Le mode d’exécution reste commun à tout l’Exercice.

---

## C2 — Bascule Séries uniformes / Séries variables

### Activation

Lorsqu’un Exercice uniforme devient variable :

- chaque Série est initialisée avec la cible commune courante ;
- chaque Série est initialisée avec la Pause commune courante.

### Désactivation

La désactivation ne demande pas de confirmation.

Les valeurs uniformes actives reprennent les paramètres de la **Série 1**.

### Brouillon transactionnel

Tant que la feuille de paramètres n’a pas été validée :

- les anciennes valeurs variables restent conservées dans le brouillon ;
- si l’utilisateur réactive `Séries variables`, elles réapparaissent.

Si la feuille est validée alors que `Séries variables` est désactivé :

- seul l’état uniforme est conservé ;
- les anciennes valeurs variables masquées ne sont pas persistées.

---

## C3 — Pause après Série et substitution par la Récupération

Chaque Série possède une **Pause après Série**, y compris la dernière.

Une Pause de `0 s` signifie absence explicite de Pause.

### Exercice direct ou occurrence sans Récupération

La Pause de la dernière Série est exécutée normalement.

### Occurrence de Séance avec Récupération positive

La Récupération après Exercice **remplace uniquement la Pause terminale de l’Exercice complet**.

La Pause terminale et la Récupération ne se cumulent jamais.

La Pause stockée dans l’Exercice n’est ni supprimée ni modifiée par cette substitution.

---

## C4 — Signification de N Séries en bilatéral

Pour un Exercice bilatéral :

> `N Séries` signifie toujours **N Séries par côté**.

Exemple avec 3 Séries :

- droit : 3 passages ;
- gauche : 3 passages ;
- total : 6 passages.

Le changement d’organisation des côtés ne modifie pas la quantité de travail prescrite.

---

## C5 — Organisation `Par série`

En mode **Par série**, une Série bilatérale comprend les deux côtés avant le passage à la Série suivante.

Avec `D→G` :

`D1 → PC → G1 → P1 → D2 → PC → G2 → P2 → D3 → PC → G3 → [P3 ou R]`

Avec `G→D` :

`G1 → PC → D1 → P1 → G2 → PC → D2 → P2 → G3 → PC → D3 → [P3 ou R]`

où :

- `PC` = Pause au changement de côté ;
- `Pi` = Pause après la Série i ;
- `R` = Récupération après Exercice.

La Pause au changement de côté intervient **à l’intérieur de chaque Série bilatérale**, entre les deux côtés.

La Pause après Série intervient après l’achèvement des deux côtés de cette Série.

---

## C6 — Paramètres communs aux deux côtés

Une Série possède une définition unique, appliquée aux deux côtés.

Exemple :

- Série 2 = `45 s / Pause 20 s`.

Alors :

- D2 = 45 s ;
- G2 = 45 s ;
- la Pause de Série 2 reste 20 s.

KODJO ne permet pas, dans un même Exercice bilatéral, de définir des cibles ou Pauses distinctes pour le côté droit et le côté gauche.

Une asymétrie volontaire doit être représentée par des Exercices distincts.

---

## C7 — Modification du nombre de Séries en mode variable

### Augmentation

Les nouvelles Séries héritent des paramètres de la dernière Série existante.

Exemple :

- S1 = 30 s / 10 s ;
- S2 = 45 s / 20 s ;
- S3 = 60 s / 30 s.

Passage de 3 à 5 :

- S4 = 60 s / 30 s ;
- S5 = 60 s / 30 s.

### Réduction dans le brouillon

Si le nombre de Séries est réduit puis réaugmenté avant validation :

- les anciennes valeurs des Séries retirées sont restaurées.

### Après validation

Les Séries supprimées ne sont plus conservées.

Une augmentation ultérieure crée à nouveau les nouvelles Séries depuis la dernière Série persistée.

---

## C8 — Source de vérité en mode variable

Lorsque `Séries variables = Non` :

- cible commune ;
- Pause commune.

Lorsque `Séries variables = Oui` :

- les paramètres communs cessent d’être les valeurs effectives ;
- les paramètres individuels de chaque Série deviennent l’unique source de vérité.

Il n’existe pas de système « valeur commune + surcharge par Série ».

`Séries variables` est un état explicite de l’Exercice, non déduit de la comparaison des valeurs.

---

## C9 — Changement de mode avec Séries variables

Lorsqu’on change le mode d’exécution :

- le nombre de Séries est conservé ;
- les Pauses propres à chaque Série sont conservées ;
- les cibles incompatibles sont remplacées par des valeurs à renseigner ;
- aucune conversion automatique Durée ↔ Répétitions n’est réalisée.

Exemple :

`30 s/10 s – 45 s/20 s – 60 s/30 s`

devient en Répétitions :

`—/10 s – —/20 s – —/30 s`.

Dans le brouillon, revenir au mode précédent avant validation restaure les dernières cibles de ce mode.

---

## C10 — Durée totale avec Séries variables

Lorsque `Séries variables = Oui` :

- la Durée totale reste affichée lorsqu’elle est applicable ;
- elle est calculée automatiquement ;
- elle n’est pas éditable ;
- elle ne peut pas recalculer le nombre de Séries.

Les paramètres détaillés des Séries sont l’unique source de vérité.

Lorsque `Séries variables = Non`, le comportement existant permettant à la Durée totale de piloter le recalcul du nombre de Séries en mode Durée peut être conservé.

En Répétitions, la Durée totale reste une estimation avec `≥`.

En À l’échec, aucune Durée totale n’est affichée.

---

## C11 — Séparation direction / organisation

Le paramétrage bilatéral comporte deux dimensions.

### Changement de côté

- Aucun ;
- D→G ;
- G→D.

Il détermine l’existence de la bilatéralité et le côté de départ.

### Organisation des côtés

- **Séries groupées** — valeur par défaut ;
- **Par série**.

`Organisation des côtés` est sans objet si `Changement de côté = Aucun`.

---

## C11-bis — Libellés retenus

Libellé :

**Organisation des côtés**

Valeurs :

- **Séries groupées**
- **Par série**

### Séries groupées

`D1 → D2 → D3 → G1 → G2 → G3`

### Par série

`D1 → G1 → D2 → G2 → D3 → G3`

Ces exemples ne détaillent pas les Pauses ; les règles exactes sont décrites ailleurs dans ce document.

---

## C12 — Durée intrinsèque vs durée de l’occurrence

Deux notions doivent rester distinctes.

### Durée totale de l’Exercice

Elle décrit la durée intrinsèque de l’Exercice.

Elle comprend :

- les cibles de l’Exercice ;
- les Pauses propres aux Séries ;
- les Pauses au changement de côté.

Elle exclut :

- la Récupération post-exercice ;
- le Compte à rebours propre ;
- la Fin d’exercice propre, conformément au périmètre actuel du calcul de paramètres.

### Durée de l’occurrence dans une Séance

Elle tient compte du contexte de Séance.

Si une Récupération positive est définie :

- elle remplace la Pause terminale de l’Exercice ;
- elle contribue au Plan d’Exécution de la Séance ;
- elle ne devient pas une composante intrinsèque de l’Exercice.

---

## C13 — Résumé des Séries variables

La carte récapitulative reste compacte.

Libellé attendu :

> **`N séries variables`**

Exemples de principe :

- `3 séries variables · Durée totale 2 min 45 s`
- `3 séries variables · Durée totale ≥ 1 min 36 s`
- `3 séries variables` en mode À l’échec.

La carte ne détaille pas toutes les cibles et Pauses Série par Série.

Le détail complet appartient à la feuille de paramètres.

Le rendu précis est à proposer dans Figma.

---

## C14 — Indépendance Pause finale / Récupération

La Pause de la dernière Série reste persistée dans l’Exercice.

La Récupération d’une occurrence :

- ne la supprime pas ;
- ne la remplace pas dans les données de l’Exercice ;
- s’y substitue uniquement au moment de l’exécution terminale de l’occurrence.

Ainsi, un même Exercice peut conserver une Pause finale de 30 s :

- exécution directe : 30 s exécutées ;
- occurrence avec Récupération 0 s : 30 s exécutées ;
- occurrence avec Récupération 120 s : 120 s exécutées à la place des 30 s.

---

## C15 — Détail des Séries dans une même feuille

Lorsque `Séries variables = Oui`, toutes les Séries sont accessibles dans la même feuille de paramètres.

Fonctionnellement, chaque Série expose :

- sa cible lorsque le mode en exige une ;
- sa Pause après Série.

Exemple Durée :

| Série | Durée | Pause |
|---|---:|---:|
| Série 1 | 30 s | 10 s |
| Série 2 | 45 s | 20 s |
| Série 3 | 60 s | 30 s |

En Répétitions, la colonne cible correspond au nombre de répétitions.

En À l’échec, aucune cible chiffrée n’est exposée ; la Pause reste individualisable.

Le layout exact est à proposer dans Figma.

---

## C16 — Affichage Série/côté pendant l’Exécution

Le compteur d’Exécution reste :

> **Série n/N**

avec N Séries par côté.

Le côté courant est affiché séparément.

En mode Par série, pour 3 Séries :

- D1 → `Série 1/3` + `Côté droit`
- G1 → `Série 1/3` + `Côté gauche`
- D2 → `Série 2/3` + `Côté droit`
- G2 → `Série 2/3` + `Côté gauche`

Il n’existe pas de compteur global `1/6`, `2/6`, etc.

La même logique s’applique aux Séries groupées.

---

## C17 — Une seule Série et Séries variables

Dans le brouillon, réduire temporairement N à 1 ne détruit pas immédiatement l’état variable antérieur.

Si N repasse à 2+ avant validation :

- l’état variable précédent peut être restauré.

Si la feuille est validée avec N = 1 :

- l’Exercice est normalisé en **Série uniforme** ;
- `Séries variables = Non` ;
- les Séries supprimées ne sont pas persistées.

Un état persistant `1 série variable` n’est pas autorisé.

---

## C18 — Une seule Série et Organisation des côtés

Avec une seule Série :

- Séries groupées ;
- Par série

produisent le même ordre d’exécution.

Dans le brouillon, un choix antérieur `Par série` peut être conservé temporairement.

Si la feuille est validée avec N = 1 :

- l’Organisation des côtés persistée est normalisée vers **Séries groupées**.

Si N est augmenté ultérieurement, le défaut repart donc de Séries groupées.

---

## C19 — Indépendance cible / Pause

Dans une Série variable :

- la cible ;
- la Pause

sont deux paramètres fonctionnellement indépendants.

Modifier l’un ne modifie pas l’autre.

Le mode d’interaction précis et le layout sont laissés à la conception Figma.

---

## C20 — Indépendance des deux nouvelles capacités

`Séries variables` et `Organisation des côtés` sont indépendants.

Combinaisons possibles :

- Séries uniformes + Séries groupées ;
- Séries uniformes + Par série ;
- Séries variables + Séries groupées ;
- Séries variables + Par série.

Aucune option n’active automatiquement l’autre.

---

## C21 — Compatibilité et valeurs par défaut

Tout Exercice existant est interprété comme :

- `Séries variables = Non` ;
- `Organisation des côtés = Séries groupées`.

L’introduction de ces capacités ne doit donc pas modifier silencieusement l’ordre ou la quantité de travail des Exercices existants.

---

## C22 — Validité d’un Exercice variable

Lorsque `Séries variables = Oui` :

- chaque Série active doit avoir une cible valide si le mode l’exige ;
- une Série incomplète empêche la validation de la feuille ;
- en À l’échec, aucune cible chiffrée n’est requise ;
- la Pause peut valoir `0 s`.

---

## C23 — Bornes

Les bornes existantes s’appliquent à chaque valeur individuelle.

Notamment :

- Séries : `1..99` ;
- Répétitions : borne existante par Série ;
- Durée : borne existante par Série ;
- Pause après Série : borne existante ;
- Pause au changement de côté : borne existante.

Cette évolution ne crée pas de nouvelle borne fonctionnelle.

---

## C24 — Copie et duplication

Une copie ou duplication conserve :

- le mode uniforme/variable ;
- les paramètres de toutes les Séries variables ;
- le Changement de côté ;
- l’Organisation des côtés ;
- la Pause au changement de côté.

Pour une occurrence de Séance, la Récupération post-exercice continue de suivre ses règles contextuelles propres.

---

## C25 — Exécution directe

Une `ActivityDefinition` exécutée directement ne possède pas de Récupération post-exercice contextuelle.

La Pause de sa dernière Série s’exécute donc normalement, sauf si elle vaut `0 s`.

---

## C26 — Récupération d’une occurrence de Séance

Pour une occurrence :

### Récupération = 0

La Pause terminale de l’Exercice s’exécute normalement.

### Récupération > 0

La Récupération remplace uniquement la Pause terminale de l’Exercice complet.

Toutes les autres Pauses restent inchangées.

Cette règle est identique en :

- unilatéral ;
- bilatéral Séries groupées ;
- bilatéral Par série.

---

## C27 — Compte à rebours et Fin d’exercice

Les nouvelles capacités ne changent pas leur portée.

Le Compte à rebours propre et la Fin d’exercice propre restent liés à l’Exercice complet.

Ils ne sont pas rejoués :

- pour chaque Série ;
- pour chaque côté.

---

# 6. Ordres d’exécution canoniques

## 6.1 Unilatéral — Séries variables

Pour N = 3 :

`S1 → P1 → S2 → P2 → S3 → [P3 ou R]`

`R` remplace P3 uniquement s’il est positif dans une occurrence de Séance.

---

## 6.2 Bilatéral — Séries groupées — D→G

Pour N = 3 :

`D1 → P1 → D2 → P2 → D3 → P3 → PC → G1 → P1 → G2 → P2 → G3 → [P3 ou R]`

La Pause P3 après le premier côté reste une Pause normale.

Seule la Pause terminale après G3 peut être remplacée par R.

---

## 6.3 Bilatéral — Séries groupées — G→D

`G1 → P1 → G2 → P2 → G3 → P3 → PC → D1 → P1 → D2 → P2 → D3 → [P3 ou R]`

---

## 6.4 Bilatéral — Par série — D→G

`D1 → PC → G1 → P1 → D2 → PC → G2 → P2 → D3 → PC → G3 → [P3 ou R]`

---

## 6.5 Bilatéral — Par série — G→D

`G1 → PC → D1 → P1 → G2 → PC → D2 → P2 → G3 → PC → D3 → [P3 ou R]`

---

# 7. Formules cibles

Notation :

- `N` = nombre de Séries par côté ;
- `Ti` = durée cible de la Série i ;
- en Répétitions, pour l’estimation uniquement : `Ti = Ri × 2 s` ;
- `Pi` = Pause après la Série i ;
- `PC` = Pause au changement de côté ;
- `R` = Récupération après Exercice d’une occurrence.

## 7.1 Unilatéral

### Durée intrinsèque

`T = Σ(Ti + Pi)`

---

## 7.2 Bilatéral — Séries groupées

### Durée intrinsèque

`T = 2 × Σ(Ti + Pi) + PC`

PC intervient une seule fois entre les deux groupes de Séries.

---

## 7.3 Bilatéral — Par série

### Durée intrinsèque

`T = 2 × Σ(Ti) + Σ(Pi) + N × PC`

PC intervient une fois à l’intérieur de chaque Série bilatérale.

---

## 7.4 Occurrence avec Récupération

Si `R = 0` :

`T_occurrence = T_intrinsèque`

Si `R > 0` :

`T_occurrence = T_intrinsèque − PN + R`

où `PN` est la Pause terminale de la dernière Série.

Cette formule remplace uniquement la Pause située à la fin de l’Exercice complet.

---

## 7.5 Séries uniformes

Les mêmes règles de Pause finale s’appliquent.

Avec :

- N Séries ;
- cible commune T ;
- Pause commune P.

### Unilatéral

`N × (T + P)`

### Bilatéral — Séries groupées

`2N × (T + P) + PC`

### Bilatéral — Par série

`N × (2T + P + PC)`

En mode Durée uniforme, la Durée totale peut continuer à piloter le nombre de Séries si cette capacité est conservée ; l’inversion doit alors utiliser la formule correspondant à l’Organisation des côtés.

En mode variable, la Durée totale est uniquement calculée.

---

# 8. Répétitions et À l’échec

## Répétitions

Chaque Série variable possède son nombre de répétitions propre.

Pour la Durée totale estimée uniquement :

`Ti = Ri × 2 s`

Le résultat est affiché avec `≥`.

Cette convention ne définit pas un rythme d’exécution.

## À l’échec

Toutes les Séries restent « À l’échec ».

Seules leurs Pauses peuvent varier.

Aucune Durée totale n’est affichée.

---

# 9. Brouillon transactionnel

La feuille de paramètres reste transactionnelle.

Pendant une même ouverture :

- les valeurs masquées à la suite d’une désactivation restent récupérables ;
- les Séries temporairement supprimées restent récupérables ;
- les cibles des anciens modes restent récupérables ;
- un ancien choix `Par série` peut rester récupérable lorsque N passe temporairement à 1.

`✕` annule les changements de cette ouverture.

`✓` applique l’état fonctionnel actif et valide au brouillon parent.

Après validation :

- aucun état alternatif caché n’est persisté uniquement pour permettre un futur retour arrière ;
- les normalisations N=1 s’appliquent.

---

# 10. Résumé dans l’interface

Le détail de toutes les Séries variables n’est pas reproduit dans la carte récapitulative.

La synthèse doit permettre d’identifier au minimum :

- le nombre de Séries ;
- le fait qu’elles sont variables ;
- la Durée totale lorsqu’elle s’applique ;
- la bilatéralité et son organisation lorsqu’elles sont utiles à la compréhension.

Texte validé :

> `N séries variables`

Le wording complémentaire et le layout restent à proposer dans Figma.

---

# 11. Exécution

## Compteur Série

Toujours :

`Série n/N`

N reste le nombre de Séries par côté.

## Côté courant

Affiché séparément :

- Côté droit ;
- Côté gauche.

Aucun compteur global `1/(2N)` n’est introduit.

## Paramètres de la Série courante

Le Plan d’Exécution devra utiliser les paramètres de la Série effectivement en cours :

- cible de cette Série ;
- Pause de cette Série ;
- côté courant ;
- organisation des côtés ;
- Pause au changement de côté applicable.

---

# 12. Modèle fonctionnel cible à représenter

La conception ne prescrit pas ici une structure de classes ou de tables, mais le modèle futur doit pouvoir représenter sans ambiguïté :

### Au niveau Exercice

- mode d’exécution ;
- nombre de Séries ;
- indicateur uniforme/variable ;
- soit paramètres uniformes ;
- soit collection ordonnée de paramètres de Séries ;
- Changement de côté ;
- Organisation des côtés ;
- Pause au changement de côté ;
- Compte à rebours ;
- Fin d’exercice.

### Paramètres d’une Série variable

Selon le mode :

- index/ordre de Série ;
- cible éventuelle ;
- Pause après Série.

Une Série reste conceptuellement subordonnée à l’Exercice et ne devient pas un objet métier autonome du Catalogue.

---

# 13. Contradictions documentaires actuelles à traiter ultérieurement

La documentation actuelle comporte des formulations incompatibles avec la présente conception et, sur certains points, des contradictions déjà internes au projet.

La future propagation documentaire devra rechercher et remplacer notamment :

1. `C−1 Pauses` systématiques ;
2. « aucune Pause après la dernière Série » ;
3. la règle disant que la Récupération ne remplace jamais la dernière Pause ;
4. la règle disant que Pause et Pause au changement de côté ne se cumulent jamais ;
5. le fallback `PC > 0 ? PC : Pause entre Séries` ;
6. la règle unique « toutes les Séries du premier côté puis toutes celles du second » ;
7. les formules D-208 / D-232 / v11 fondées sur ces hypothèses ;
8. les règles de Plan d’Exécution qui supposent une cible et une Pause uniques par Exercice.

### Contradiction historique déjà observée

Le code et des tests historiques contiennent déjà une règle du type :

> la Récupération remplace la dernière Pause.

La documentation fonctionnelle consolidée récente comporte au contraire des formulations `C−1` et « récupération indépendante ».

La cible validée par la présente conception est :

- une Pause existe après chaque Série ;
- la Pause terminale existe dans l’Exercice ;
- une Récupération post-exercice positive remplace uniquement cette Pause terminale lors de l’exécution d’une occurrence.

Cette contradiction devra être corrigée explicitement lors de la propagation documentaire. Elle ne doit pas être résolue silencieusement.

---

# 14. Impact attendu sur PRE-1 / PRE-2

## PRE-1

La tranche PRE-1 en cours ne doit pas être rouverte uniquement pour intégrer cette conception.

Sa source produit est déjà figée et son cycle d’implémentation/revue est avancé.

## Entre PRE-1 et PRE-2

Avant la planification de PRE-2, il faudra :

1. intégrer formellement ces décisions dans la documentation normative ;
2. mettre à jour le registre des décisions ;
3. propager les règles au modèle fonctionnel et aux règles métier ;
4. identifier l’impact sur le modèle de données et la persistance ;
5. adapter le socle de données/domain si nécessaire ;
6. stabiliser les contrats UI correspondants ;
7. disposer de propositions Figma validées.

## PRE-2

PRE-2 doit démarrer sur la cible stabilisée, afin d’éviter de construire une UI ou une Composition déterministe sur un modèle uniforme qui serait ensuite à reprendre.

---

# 15. Impacts documentaires futurs

À contrôler transversalement lors de l’intégration :

- `PRODUCT.md` ;
- `INDEX.md` si nécessaire ;
- Glossaire ;
- Vision générale ;
- Parcours utilisateur ;
- Modèle fonctionnel ;
- Versions du produit ;
- Écrans et navigation ;
- Registre des décisions ;
- Conception fonctionnelle détaillée ;
- Modèle de données fonctionnel ;
- Processus métier et règles métier ;
- API fonctionnelles ;
- Architecture technique ;
- Contrats d’écran ;
- spécification active de la feuille de paramètres ;
- matrices/rapports spécifiques relatifs à bilatéralité, récupération et Durée totale.

La propagation doit supprimer ou superséder les anciennes règles contradictoires ; les deux versions ne doivent pas coexister comme règles actives.

---

# 16. Mission Figma à proposer à Claude

## Objectif

Produire dans le Figma KODJO actuel des **propositions de conception** pour intégrer les Séries variables et l’Organisation des côtés sans modifier les règles fonctionnelles validées dans ce document.

### Figma de référence

- fileKey : `G6RY5Ebhgwb4AHIOYDwwvg`
- page Prototype MVP : `510:101`

La proposition doit partir de l’état actuel du fichier Figma et du Design System existant.

---

## États fonctionnels à couvrir dans les propositions

Au minimum :

1. Exercice uniforme — état actuel de référence ;
2. activation de Séries variables ;
3. Séries variables en mode Durée ;
4. Séries variables en mode Répétitions ;
5. Séries variables en mode À l’échec ;
6. édition d’un nombre de Séries suffisamment grand pour démontrer le comportement scrollable ;
7. bilatéral D→G / G→D avec Séries groupées ;
8. bilatéral D→G / G→D avec Par série ;
9. combinaison Séries variables + Par série ;
10. Durée totale calculée et non éditable en mode variable ;
11. résumé avec `N séries variables` ;
12. cas N=1 montrant que les options sans effet ne doivent pas créer d’ambiguïté ;
13. états de changement de mode avec cibles à renseigner ;
14. éventuels états de validation impossible lorsqu’une Série active est incomplète.

---

## Contraintes impératives pour Figma

Claude ne doit pas modifier les décisions fonctionnelles suivantes :

- un mode unique par Exercice ;
- paramètres variables par Série ;
- Pause propre à chaque Série ;
- Pause finale existante ;
- substitution de la Pause terminale par la Récupération contextuelle ;
- N Séries par côté ;
- `Séries groupées / Par série` ;
- paramètres communs aux deux côtés ;
- Durée totale non éditable en mode variable ;
- résumé `N séries variables` ;
- compteur d’Exécution `Série n/N` ;
- côté courant séparé.

---

## Liberté laissée au design

Figma peut proposer librement, sous réserve du DSF :

- placement du contrôle `Séries variables` ;
- représentation du détail Série par Série ;
- lignes, cartes, tableau, groupes ou autre organisation ;
- comportement visuel du scroll ;
- affordances d’édition ;
- présentation de `Organisation des côtés` ;
- hiérarchie typographique ;
- densité ;
- regroupements visuels ;
- affordances de valeurs calculées/non éditables ;
- éventuelles variantes de proposition.

Un détail purement graphique proposé dans Figma ne devient pas automatiquement une règle fonctionnelle.

Toute proposition introduisant un nouveau comportement fonctionnel doit être signalée comme telle et ne doit pas être considérée comme validée sans arbitrage.

---

# 17. Scénarios de référence à utiliser pour vérifier les propositions

## Scénario A — Durée variable unilatérale

- 3 Séries variables ;
- S1 = 30 s / Pause 10 s ;
- S2 = 45 s / Pause 20 s ;
- S3 = 60 s / Pause 30 s ;
- aucun côté ;
- aucune récupération.

Ordre :

`30 → 10 → 45 → 20 → 60 → 30`

Durée intrinsèque :

`195 s`.

---

## Scénario B — Même Exercice avec Récupération de 120 s dans une Séance

Ordre :

`30 → 10 → 45 → 20 → 60 → 120`

La Récupération remplace uniquement la Pause terminale de 30 s.

Durée de l’occurrence :

`285 s`.

La définition de l’Exercice conserve néanmoins P3 = 30 s.

---

## Scénario C — Bilatéral Séries groupées

- D→G ;
- 3 Séries variables ;
- cibles : 30 / 45 / 60 s ;
- Pauses : 10 / 20 / 30 s ;
- PC = 15 s.

Ordre :

`D1 30 → P10 → D2 45 → P20 → D3 60 → P30 → PC15 → G1 30 → P10 → G2 45 → P20 → G3 60 → P30`

Durée intrinsèque :

`2 × (30+10+45+20+60+30) + 15 = 405 s`.

---

## Scénario D — Bilatéral Par série

Mêmes valeurs.

Ordre :

`D1 30 → PC15 → G1 30 → P10 → D2 45 → PC15 → G2 45 → P20 → D3 60 → PC15 → G3 60 → P30`

Durée intrinsèque :

`2 × (30+45+60) + (10+20+30) + 3×15 = 375 s`.

---

## Scénario E — Répétitions variables

- 3 Séries variables ;
- répétitions : 12 / 10 / 8 ;
- Pauses : 30 / 45 / 60 s ;
- unilatéral.

La carte indique :

`3 séries variables`

et affiche une Durée totale estimée avec `≥` selon la convention de 2 s par répétition.

---

## Scénario F — À l’échec variable

- 3 Séries ;
- chaque Série = À l’échec ;
- Pauses : 30 / 45 / 60 s.

Aucune Durée totale n’est affichée.

---

# 18. Points explicitement non ouverts

Cette conception ne rouvre pas :

- les trois modes Durée / Répétitions / À l’échec ;
- les bornes produit existantes ;
- le principe de bilatéralité au niveau Exercice ;
- la séparation Pause / Pause au changement de côté / Récupération post-exercice ;
- le fait que la Récupération post-exercice appartient à l’occurrence de Séance ;
- le caractère transactionnel de la feuille de paramètres ;
- la convention d’estimation 2 s/répétition ;
- la non-modélisation des cibles d’intensité ;
- la distinction Exercice de Catalogue / occurrence de Séance.

---

# 19. Statut de clôture

## Conception fonctionnelle

**CLOSE — VALIDÉE**

Les décisions C1 à C27 et leurs conséquences dérivées forment la base fonctionnelle à transmettre à la conception Figma.

## Figma

**À CONCEVOIR**

Aucune proposition visuelle issue de cette évolution n’est encore validée dans ce document.

## Documentation normative

**À PROPAGER APRÈS CONCEPTION / VALIDATION FIGMA**

La présente spécification est un document de handoff de conception et ne doit pas être confondue avec une propagation déjà effectuée dans les chapitres normatifs.

## Développement

**NON DÉMARRÉ**

Cette évolution doit être stabilisée avant la planification de PRE-2.

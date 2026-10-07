# KODJO — Conception fonctionnelle — Cadence des répétitions

**Version :** 1.0  
**Date :** 05/10/2026  
**Statut :** Conception fonctionnelle close — prête pour conception Figma puis propagation documentaire  
**Baseline analysée :** `MyUncried/Application-Routine`, `main`, commit `6d03f5be579f2d0e2e7602b6abf1c2b46f4c740b`  
**Périmètre :** mode `Répétitions`

## 1. Objet

Cette évolution permet d’associer facultativement une **cadence** à une Série d’un Exercice en mode `Répétitions`.

La cadence est une consigne de rythme exprimée en secondes par répétition. Elle sert notamment au contrôle de vitesse, à la reproductibilité, au pacing et à certains protocoles de renforcement/rééducation.

Elle ne constitue pas une mesure de la réalisation physique de chaque répétition.

## 2. Principes structurants

- Le mode reste `Répétitions`. Aucun nouveau mode n’est créé.
- La Répétition reste une unité quantitative, pas une entité métier.
- La cadence est une propriété facultative de la **Série**.
- Le temps reste un **chronomètre croissant**.
- La cadence guide par signaux sonores ; elle ne termine pas automatiquement la Série.
- `Suivant` reste la validation explicite de fin de Série.
- La conception graphique détaillée reste hors périmètre de ce document.

## 3. Propriété de cadence

Propriété fonctionnelle :

```text
cadence
- absente : Série non cadencée
- entier de 1 à 60 secondes : Série cadencée
```

Identifiant technique recommandé :

```text
repetitionIntervalSeconds
```

Règles :
- entier uniquement ;
- `1..60 s` ;
- applicable uniquement à `Répétitions` ;
- absente en `Durée` et `À l’échec`.

Aucune cadence n’est présélectionnée.

La convention historique `2 s/répétition` reste uniquement une convention d’estimation et ne devient jamais une cadence implicite.

## 4. Séries uniformes et variables

### Séries uniformes

La cadence est commune à toutes les Séries.

Exemple :

```text
3 séries
10 répétitions
cadence 4 s
pause 30 s
```

équivaut à :

```text
S1 : 10 répétitions · 4 s · pause 30 s
S2 : 10 répétitions · 4 s · pause 30 s
S3 : 10 répétitions · 4 s · pause 30 s
```

### Séries variables

Le modèle supporte la cadence au niveau de chaque Série variable.

Lors de l’activation des Séries variables :
- chaque Série reçoit la cadence commune courante ;
- la cadence devient une propriété de chaque Série ;
- l’interface de la première version n’expose pas encore l’édition individuelle de cette cadence.

Tant que cette édition individuelle n’existe pas :
- modifier la cadence commune propage la nouvelle valeur à toutes les Séries ;
- supprimer la cadence la supprime sur toutes les Séries.

Le modèle est donc prêt pour une future cadence distincte par Série sans l’exposer immédiatement.

## 5. Changement de mode

La cadence suit la logique transactionnelle existante :

- quitter temporairement `Répétitions` puis y revenir avant validation restaure la dernière cadence du brouillon ;
- valider un autre mode supprime toute cadence cachée ;
- un retour ultérieur à `Répétitions` repart sans cadence.

Aucun brouillon caché n’est persisté.

## 6. Exécution d’une Série cadencée

Exemple :

```text
10 répétitions
cadence 4 s
```

Déroulé :

```text
00:00  début Série / répétition 1
00:04  bip cadence
00:08  bip cadence
...
00:36  bip cadence
00:40  signal distinct de fin de cadence nominale
00:41+
```

Règles :
- la première répétition commence immédiatement ;
- un bip est émis à chaque intervalle complet ;
- le dernier intervalle utilise un signal distinct ;
- le dernier signal ne termine pas la Série ;
- après le dernier signal, le chronomètre continue ;
- aucun nouveau bip de cadence n’est émis ;
- `Suivant` termine la Série.

## 7. `Suivant`

`Suivant` termine normalement la Série sans confirmation, avant ou après la durée estimée.

Exemple :

```text
10 répétitions × 4 s
durée estimée : 40 s
Suivant à 32 s
```

Résultat :
- fin normale ;
- aucun statut `Partielle` du seul fait d’une fin avant 40 s ;
- les signaux restants sont annulés.

La cadence est une consigne de rythme, pas une contrainte de validation.

## 8. Durées

### Série cadencée

```text
Ti = Ri × Ci
```

avec :
- `Ri` = cible de répétitions ;
- `Ci` = cadence.

Exemple :

```text
10 × 4 s = 40 s
```

Cette valeur est utilisée comme **Durée estimée**.

### Série non cadencée

```text
Ti ≈ 2 × Ri
```

La convention `2 s/répétition` reste une approximation.

### À l’échec

Aucune durée propre estimable.

### Hiérarchie des symboles

- toutes les composantes sont temporellement déterminables → `Durée estimée : X`
- au moins une composante est approximative mais estimable → `Durée estimée ≈ X`
- au moins une composante est non estimable → `Durée estimée ≥ X`

`≥` domine `≈` lorsque les deux niveaux d’incertitude coexistent.

## 9. Formules existantes

Les formules existantes de durée restent applicables. Seule la valeur `Ti` évolue :

```text
Durée :
Ti = durée cible

Répétitions cadencées :
Ti = Ri × Ci

Répétitions non cadencées :
Ti ≈ 2 × Ri

À l’échec :
Ti non estimable
```

Puis les règles existantes de Séries, Pauses, côtés, récupérations et Tours s’appliquent.

## 10. Progression

### Répétitions non cadencées

Comportement historique : la part de Série est acquise à validation.

### Répétitions cadencées

La progression est temporelle et continue.

Exemple :

```text
10 répétitions × 4 s = 40 s
20 s sans interruption → 50 % de la part temporelle
40 s → 100 %
```

Si `Suivant` intervient avant 40 s :
- la part restante de la Série est acquise immédiatement.

Après le dernier signal :
- la part reste plafonnée à 100 % ;
- la Série reste néanmoins en cours jusqu’à `Suivant`.

La progression temporelle et l’achèvement métier sont donc distincts.

## 11. Pause / Reprise

Une Pause utilisateur :
- interrompt l’intervalle de cadence courant ;
- conserve le temps actif déjà consommé dans la durée réelle ;
- n’acquiert pas la fraction incomplète pour la progression de cadence.

À la reprise :
- l’intervalle interrompu n’est pas repris avec son reliquat ;
- un **nouvel intervalle complet** démarre.

Exemple :

```text
cadence 4 s
dernier bip : 16 s
Pause à 17 s
Reprise
→ prochain bip 4 s après Reprendre
```

La progression revient au dernier intervalle entièrement acquis.

Cette règle peut provoquer une légère régression de progression au moment de la Pause ; elle est intentionnelle.

## 12. Réinitialisation

La cadence hérite de la portée existante de `Réinitialiser`.

### Unilatéral

Réinitialisation de la Série courante :
- chrono courant → `00:00`
- cadence → intervalle 1
- progression de cette Série → zéro
- paramètres inchangés

### Bilatéral

La portée reste celle du bloc du côté courant selon les règles existantes :
- reprise au début du périmètre concerné ;
- autre côté préservé.

### Durée réelle

Le temps actif déjà consacré au travail n’est pas effacé.

Exemple :

```text
Tentative 1 : 12 s
Réinitialiser
Tentative 2 : 40 s

Durée réelle de Série = 52 s
```

La progression est réinitialisée ; le temps réellement dépensé ne l’est pas.

## 13. Résultats

Pour chaque Série cadencée exécutée, KODJO conserve :
- la cible de répétitions via l’instantané ;
- la cadence prescrite via l’instantané ;
- la durée estimée dérivable ;
- la **durée réelle active cumulée** ;
- le contexte Série ;
- le côté lorsqu’il existe.

KODJO ne :
- déduit pas le nombre de répétitions réellement effectuées ;
- demande pas à l’utilisateur de renseigner ce nombre à chaque Série.

Un temps réel inférieur ou supérieur à la durée estimée ne permet pas de conclure sur le nombre de répétitions physiquement accomplies.

## 14. Arrière-plan et écran verrouillé

La cadence continue selon les horodatages de référence lorsque :
- l’application passe en arrière-plan ;
- l’écran est verrouillé.

Au retour :
- KODJO recalcule la position temporelle atteinte ;
- les signaux éventuellement manqués ne sont pas rejoués ;
- le prochain événement pertinent est recalculé.

Le passage en arrière-plan n’est pas une Pause utilisateur et ne redémarre donc pas un intervalle complet.

## 15. Pause de sécurité

Pour une Série cadencée :
- référence = fin nominale recalculée de la Série ;
- pause de sécurité = 30 minutes après cette fin sans interaction.

Exemple :

```text
10 × 4 s
fin nominale : 40 s
pause de sécurité : 30 min 40 s
```

Après une Pause ayant redémarré un intervalle complet, la fin nominale est décalée en conséquence.

Règles conservées :
- Répétitions non cadencées : 2 h sans interaction ;
- À l’échec : 2 h sans interaction.

## 16. Audio

Deux événements sonores sont requis :
1. signal de cadence intermédiaire ;
2. signal distinct de fin de cadence nominale.

Le choix des sons exacts relève de la conception audio/UX.

Pour une Série cadencée :
- les signaux de cadence remplacent le bip historique à la minute ;
- aucun bip minute supplémentaire n’est ajouté.

Pour une Série non cadencée :
- le bip minute historique reste applicable.

Aucune préférence sonore dédiée à la cadence n’est créée ; les signaux héritent du mécanisme global de sons existant.

## 17. Contextes d’exécution

La cadence est intrinsèque à la Série et s’applique :
- en Exécution directe ;
- en Exécution de Séance ;
- à chaque occurrence effective ;
- à chaque côté en bilatéral ;
- à chaque Tour lorsqu’un Exercice appartient au Circuit.

Aucune règle spécifique supplémentaire n’est créée pour `ACTIVITY` ou `SESSION`.

## 18. Modèle de données cible

Modèle logique :

```text
SeriesParameters
├── target
├── repetitionIntervalSeconds?
└── pauseSeconds
```

`repetitionIntervalSeconds` :
- `null`/absent → pas de cadence ;
- entier `1..60` → cadence active.

En uniforme :
```text
commonTarget
commonRepetitionIntervalSeconds?
commonPause
```

En variable :
```text
seriesParameters[i]
├── target
├── repetitionIntervalSeconds?
└── pause
```

Les anciens objets sont interprétés avec :

```text
repetitionIntervalSeconds = null
```

Aucune migration ne doit leur attribuer `2 s`.

## 19. Instantané d’Exécution

L’instantané immuable doit conserver la cadence effective de chaque Série.

Une modification ultérieure de la définition de l’Exercice ne doit jamais changer l’interprétation d’une ancienne Exécution.

## 20. Plan d’Exécution

Aucun nouveau :
- mode ;
- type de phase ;
- nœud par répétition ;
- objet Répétition.

Le nœud/étape de Série doit fournir ou permettre de dériver :

```text
targetRepetitions
repetitionIntervalSeconds?
estimatedCadenceDurationSeconds
```

avec :

```text
estimatedCadenceDurationSeconds
= targetRepetitions × repetitionIntervalSeconds
```

## 21. État moteur requis

À cause de la règle de Pause/Reprise, le moteur ne peut pas dériver la cadence uniquement depuis le temps actif total.

Il doit pouvoir distinguer au minimum :
- nombre d’intervalles complètement acquis ;
- début de l’intervalle courant ;
- durée de l’intervalle ;
- état `fin nominale atteinte` ;
- temps actif réel cumulé de la Série.

Cela permet :
- de redémarrer un intervalle complet après Pause ;
- de recalculer la progression ;
- de poursuivre en arrière-plan ;
- de ne pas rejouer des signaux dépassés ;
- de conserver la durée réelle malgré les resets.

Le détail d’implémentation reste libre.

## 22. Impact sur la machine d’Exécution

Le moteur doit désormais distinguer deux propriétés indépendantes :

```text
durée prévisionnelle déterminable
fin automatique par le temps
```

Pour une Série cadencée :

```text
durée déterminable = oui
fin automatique = non
```

Une durée planifiée ne doit donc jamais être assimilée automatiquement à une transition de phase.

## 23. API fonctionnelles

### Paramétrage

Accepter :
- cadence absente ;
- cadence `1..60 s` en `Répétitions`.

Refuser :
- cadence en `Durée` ;
- cadence en `À l’échec`.

En Séries variables, chaque ligne porte la propriété.

### Calculs

Les API de durée doivent permettre de distinguer :
- déterminable ;
- approximatif ;
- non estimable.

Le résultat doit rendre possible le rendu :
- sans symbole ;
- `≈` ;
- `≥`.

### État d’Exécution

L’état courant doit permettre d’obtenir les informations nécessaires à :
- la cadence configurée ;
- l’avancement de la cadence ;
- la position dans l’intervalle courant ;
- la durée active ;
- l’atteinte de la fin nominale.

### Résultats

La durée réelle de Série doit être conservée séparément, y compris à travers les réinitialisations.

## 24. Architecture

### Invariants conservés

Aucun besoin de :
- nouveau mode métier ;
- nouvelle entité Répétition ;
- nouveau type de phase de Plan ;
- nouvelle préférence Profil ;
- nouveau mécanisme de récupération.

### Scheduling

Les événements de cadence doivent être pilotables par horodatages/ancres temporelles et non dépendre exclusivement d’un timer JavaScript continu.

La capacité réelle à émettre les signaux en arrière-plan ou écran verrouillé doit être qualifiée sur iOS et Android réels.

Cette qualification technique ne change pas la règle fonctionnelle :
- la cadence continue ;
- les signaux manqués ne sont pas rejoués.

### Durée réelle

Un accumulateur de durée réelle doit être distinct du chrono de tentative courant, car :
- un reset remet le chrono courant à zéro ;
- le temps déjà consommé reste dans la durée réelle ;
- une Pause peut abandonner une fraction d’intervalle tout en conservant ce temps réel.

## 25. État du code actuel observé

La documentation cible décrit déjà les Séries variables comme une collection ordonnée de cibles/Pauses.

Le code `main` observé au commit de baseline expose encore dans certaines structures d’`ActivityDefinition` des propriétés scalaires telles que :

```text
repetitionCount
seriesCount
pauseSeconds
```

et ne matérialise pas partout le modèle cible des Séries variables.

Il s’agit d’un **écart d’implémentation**, pas d’une ambiguïté fonctionnelle.

La future implémentation de la cadence doit partir du modèle documentaire cible v12 des Séries variables.

## 26. Exigences fonctionnelles à transmettre à Figma

La conception graphique est hors périmètre de ce document.

Figma devra néanmoins matérialiser les états fonctionnels suivants.

### Paramétrage
- Répétitions sans cadence ;
- Répétitions avec cadence `1..60 s` ;
- aucune valeur présélectionnée ;
- possibilité fonctionnelle de supprimer la cadence ;
- Séries uniformes avec cadence commune ;
- Séries variables dont la cadence existe dans le modèle mais n’est pas éditée individuellement dans la première version ;
- modification commune propagée aux Séries variables.

### Durées
- durée estimée déterminable ;
- approximation `≈` ;
- borne `≥`.

### Exécution
- Série non cadencée ;
- Série cadencée avant fin nominale ;
- fin nominale atteinte mais Série toujours active ;
- Pause/Reprise avec nouvel intervalle complet ;
- fin avec `Suivant` avant durée estimée ;
- fin avec `Suivant` après durée estimée.

La représentation visuelle de ces états relève de Figma.

## 27. Contradictions documentaires à superséder

### Bip toutes les minutes
Ancienne règle : toutes les Répétitions utilisent un bip minute.  
Nouvelle règle :
- non cadencées → bip minute ;
- cadencées → signaux de cadence, sans bip minute parallèle.

### Répétitions toujours non chronométrées pour la progression
Ancienne règle : part acquise uniquement avec `Suivant`.  
Nouvelle règle :
- non cadencées → comportement historique ;
- cadencées → progression temporelle puis validation séparée.

### `≥` pour toutes les Répétitions
Ancienne règle : Répétitions ou À l’échec → `≥`.  
Nouvelle règle :
- déterminable → valeur simple ;
- Répétitions non cadencées → `≈` ;
- partie non estimable → `≥`.

### Pause/Reprise
Ancienne règle générique : reprise depuis l’état temporel exact.  
Nouvelle exception cadencée :
- temps actif conservé ;
- intervalle incomplet abandonné ;
- nouvel intervalle complet à la reprise.

### Pause de sécurité
Ancienne règle : 2 h pour Répétitions/À l’échec.  
Nouvelle règle :
- Répétitions non cadencées → 2 h ;
- À l’échec → 2 h ;
- Répétitions cadencées → 30 min après fin nominale recalculée.

## 28. Documents à propager

Contrôler au minimum :
- `docs/PRODUCT.md`
- `docs/INDEX.md`
- `00 – Glossaire.md`
- `01 – Vision Générale.md`
- `02 – Utilisateurs et besoins.md`
- `03 – Parcours utilisateur.md`
- `04 – Modèle fonctionnel.md`
- `05 – Versions du produit.md` si le périmètre de livraison l’exige
- `06 – Ecrans et navigation de la V1.md`
- `07 – Registre des décisions de conception.md`
- `08 – Conception fonctionnelle détaillée.md`
- `09 – Modèle de données fonctionnel.md`
- `10 – Processus métier et règles métier transverses.md`
- `11 – API fonctionnelles.md`
- `12 – Architecture technique.md`
- `13 – Contrats d’écran.md`
- spécification active des paramètres en modale v12
- documentation DSF/Figma concernée après conception graphique

Rechercher notamment toutes les anciennes variantes :
- `bip chaque minute` ;
- `Répétitions ou À l’échec` traités indistinctement ;
- `≥` systématique ;
- `2 s/répétition` présenté comme borne ;
- Série en Répétitions toujours non chronométrée ;
- progression acquise uniquement avec `Suivant` ;
- pause de sécurité 2 h pour toute Répétition ;
- reprise exacte de l’intervalle après Pause.

## 29. Hors périmètre

- tempo multi-phases (`3-1-1`) ;
- détection automatique des répétitions ;
- mesure biomécanique par répétition ;
- correction automatique d’avance/retard ;
- cadence en `À l’échec` ;
- cadence en `Durée` ;
- édition graphique individuelle de la cadence par Série variable dans la première version ;
- nouvelle préférence Profil de cadence ;
- choix des sons exacts ;
- choix des composants Figma ;
- disposition graphique.

## 30. Décisions consolidées

| ID | Décision |
|---|---|
| CAD-01 | La cadence est une option du mode `Répétitions`, pas un nouveau mode. |
| CAD-02 | La cadence est une propriété de Série. |
| CAD-03 | Valeur facultative entière de `1..60 s`. |
| CAD-04 | Aucune cadence par défaut ; `2 s` reste une convention d’estimation. |
| CAD-05 | À l’activation des Séries variables, chaque Série reçoit la cadence commune. |
| CAD-06 | La modification commune est propagée à toutes les Séries variables. |
| CAD-07 | Le chronomètre reste croissant. |
| CAD-08 | La première répétition commence immédiatement. |
| CAD-09 | Signal à chaque intervalle ; dernier signal distinct. |
| CAD-10 | Le dernier signal ne termine pas la Série. |
| CAD-11 | `Suivant` termine normalement sans confirmation, avant ou après l’estimation. |
| CAD-12 | Une Série cadencée est temporellement déterminable pour les calculs. |
| CAD-13 | Une Série non cadencée reste estimée à `2 s/répétition`. |
| CAD-14 | Non cadencée → `≈`; non estimable → `≥`. |
| CAD-15 | Progression cadencée temporelle et continue. |
| CAD-16 | `Suivant` anticipé complète la part restante. |
| CAD-17 | Après fin nominale, progression plafonnée à 100 %, Série encore active. |
| CAD-18 | Une Pause abandonne la fraction d’intervalle en cours. |
| CAD-19 | À la reprise, un intervalle complet redémarre. |
| CAD-20 | Le temps actif de l’intervalle abandonné reste dans la durée réelle. |
| CAD-21 | La progression revient au dernier intervalle complet. |
| CAD-22 | Réinitialiser recommence la cadence selon la portée existante du reset. |
| CAD-23 | La durée réelle conserve le temps des tentatives réinitialisées. |
| CAD-24 | La cadence continue en arrière-plan ; les signaux manqués ne sont pas rejoués. |
| CAD-25 | Pause de sécurité : 30 min après fin nominale recalculée. |
| CAD-26 | KODJO ne déduit ni ne demande le nombre de répétitions réellement effectuées. |
| CAD-27 | Durée réelle conservée par Série et par côté lorsque pertinent. |
| CAD-28 | Changement de mode : restauration en brouillon, aucune cadence cachée persistée. |
| CAD-29 | Aucun bip minute supplémentaire en Série cadencée. |
| CAD-30 | Aucun nouvel objet Répétition ni nouveau type de phase de Plan. |

## 31. Points techniques à qualifier

Sans arbitrage fonctionnel supplémentaire :
1. précision des signaux en arrière-plan iOS ;
2. comportement écran verrouillé iOS ;
3. équivalent Android ;
4. scheduling sans timer JavaScript permanent ;
5. restauration de l’ancre temporelle après suspension système ;
6. accumulation correcte des durées réelles à travers resets ;
7. migration du schéma d’implémentation courant vers le modèle cible des Séries variables.

## 32. Statut final

**Conception fonctionnelle : CLOSE**

Aucun arbitrage fonctionnel restant n’a été identifié après la passe de complétude.

Le document peut servir :
1. de source pour Figma ;
2. de base pour la conception technique détaillée ;
3. de source de propagation dans la documentation générale ;
4. de référence pour les futurs tests fonctionnels.

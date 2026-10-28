# KODJO — Stratégie PRE-9 / PRE-10 / PRE-11 et cadrage préalable du moteur d’exécution

**Date :** 28 octobre 2026  
**Statut :** document de cadrage pour la rédaction des spécifications et plans par Claude — **non constitutif d'une validation des arbitrages encore ouverts**.  
**Dépôt :** `MyUncried/Application-Routine`  
**Références de contexte :** décisions D-449 (Séance comme objet unique, 26/10/2026), D-451 (Composition, cycles et multi-circuits, 28/10/2026), documentation de Composition du 28/10, spécifications Formats du 14/10, chapitres fonctionnels 04, 08–13 et `PRODUCT.md` / `INDEX.md`. Les références doivent être revérifiées sur la dernière baseline Git lors de l'élaboration des livrables.

## 1. Finalité et principes

Préparer le développement du moteur d’exécution sans réintroduire les anciens Exercices autonomes et sans construire un moteur exclusivement conçu autour du format Libre. La stratégie retenue privilégie une livraison progressive : stabiliser les séances et leurs formats de configuration, livrer une exécution Libre réelle sur un socle commun, puis raccorder les comportements spécialisés.

**Décision de séquencement retenue :**

| Tranche | Finalité | Compris dans le périmètre | Hors périmètre à ce stade |
|---|---|---|---|
| **PRE-9 — Composition et configuration** | Achever le modèle simplifié de séance et rendre les formats configurables | Séance comme objet unique ; abandon des anciens parcours d'Exercices autonomes ; cycles, exercices directs, multi-circuits, organisation et pauses ; choix et configuration des Formats ; contraintes/paramètres imposés ; validation, persistance, compatibilité des données ; contrat d'entrée vers l'exécution | Moteur d'exécution opérationnel ; comportements d'exécution spécialisés |
| **PRE-10 — Moteur commun et exécution Libre** | Réaliser un moteur fiable et une première exécution de séance de bout en bout | Développement d'une prescription Libre en étapes exécutables ; état/transitions ; temps, interruptions et reprise selon règles validées ; interface d'exécution Libre ; événements et résultats de base ; points d'extension justifiés pour les Formats | Implémentation exhaustive de Tabata, EMOM, AMRAP, For time, Death by et Intervalles 30/30 |
| **PRE-11 — Exécution spécialisée** | Ajouter les comportements particuliers des Formats sur le moteur commun | Ordonnancement spécialisé, fenêtres, bornes, progression, conditions de fin et résultats propres aux Formats ; qualification ciblée | Refonte générale du socle sauf impossibilité démontrée et arbitrée |

La numérotation précédente des tranches n'est pas à réutiliser : ce séquencement actualise la stratégie « moteur commun Libre d'abord, Formats spécialisés ensuite » discutée antérieurement.

### Principes directeurs

1. **Réutiliser avant de créer.** Ne pas reconstruire les acquis des tranches antérieures.
2. **Distinguer représenter, configurer et exécuter.** PRE-9 doit pouvoir enregistrer des séances de Formats spécialisés sans prétendre que leur exécution est déjà livrée.
3. **Anticiper sans sur-développer.** PRE-10 doit intégrer des interfaces et invariants d'extension nécessaires, pas implémenter des fonctionnalités hypothétiques ou des mécanismes inutilisés.
4. **Aucune inférence comme décision.** Les comportements non définis sont `À CLARIFIER`, avec variantes et impacts, jamais des règles silencieusement ajoutées.
5. **Séparer règles métier et technologie.** La présente architecture fonctionnelle est indicative : les choix de bibliothèques, ordonnanceurs, états techniques et composants sont à décider dans l'architecture technique.
6. **Conserver la traçabilité.** Documenter toute règle remplacée, toute limite connue et tout report explicite.

## 2. Prérequis obligatoires de PRE-9

### A. Composition simplifiée

- Appliquer la Séance comme objet unique (D-449) ; ne pas maintenir deux parcours actifs concurrents « Exercice autonome » et « Séance ».
- Achever le modèle de Composition D-451 : cycles visibles, exercices directs et circuits ; plusieurs circuits dans un cycle ; enchaînements, séries groupées/alternées et déplacement des éléments conformément aux règles validées.
- Maintenir un ordre de développement déterministe des exercices, séries, pauses et cycles ; distinguer ordre visible, conteneurs et occurrences exécutables.
- Revoir les anciens chemins applicatifs et données, en veillant à ne pas supprimer de données utilisateur sans règle de migration validée.
- Vérifier les états de création, modification, enregistrement, annulation et reprise de brouillon.

### B. Formats configurables

- Raccorder les modèles de Formats à la **nouvelle Séance**, non à l'ancien schéma d'Exercice autonome.
- Reprendre les parcours documentés : sélection du modèle, présentation des paramètres imposés, récapitulatif et Composition préremplie, en vérifiant leur compatibilité avec Figma et D-449/D-451.
- Distinguer les contraintes invariantes du Format, les paramètres réglables et les valeurs initiales préremplies.
- Garantir que les paramètres imposés sont correctement enregistrés, restitués, validés et transmis au futur moteur.
- Ne pas annoncer comme exécutable un Format dont le comportement spécialisé n'est pas encore implémenté ; l'état exact de lancement et son information utilisateur nécessitent un contrat explicite.

### C. Contrat fonctionnel de passage à l'exécution

- Produire un instantané cohérent de la Séance configurée, indépendant des modifications ultérieures du catalogue selon les règles existantes.
- Identifier le Format d'origine, ses paramètres effectifs, la hiérarchie et l'ordre des éléments, leurs bornes et les règles de progression/arrêt pertinentes.
- Vérifier la validité et l'intégrité des données pour l'exécution (pauses, paramètres obligatoires, cycles et circuits, exercices, séries et conditions d'arrêt).
- Couvrir les migrations et la conservation de l'existant : une incompatibilité doit être détectée explicitement, non réparée silencieusement en perdant des paramètres.

## 3. Dix dimensions à examiner transversalement

Pour chacune, Claude devra produire : **règle source**, **capacité minimale**, **Formats concernés**, **état actuel** (`DÉFINI`, `PARTIELLEMENT DÉFINI`, `À CLARIFIER`), **conséquence PRE-9 / PRE-10 / PRE-11**, **scénarios de validation**.

| # | Dimension | Questions de cadrage | Enjeu pour le moteur |
|---|---|---|---|
| 1 | **Structure du plan** | Séance, cycles, circuits, exercices directs, séries, phases, pauses, points d'arrêt : quelles entités sont exécutables et lesquelles structurent l'ordre ? | Représentation stable des étapes et répétitions |
| 2 | **Ordre d'exécution** | Séries groupées/alternées, cycles et circuits imbriqués, transitions entre éléments : quelles règles produisent la séquence ? | Aucune duplication de multiplicateurs ni ambiguïté de parcours |
| 3 | **Gestion du temps** | Durée d'une étape, chrono global, compte à rebours, fenêtres indépendantes, limites de temps : peuvent-ils coexister ? | Gestion des horloges et échéances |
| 4 | **Déclencheurs de transition** | Temps écoulé, cible atteinte, validation utilisateur, fin de fenêtre ou autre événement ? | Transitions commandées par la règle applicable |
| 5 | **Progression dynamique** | Le nombre et le contenu des occurrences sont-ils entièrement connus à l'avance ? Leur volume peut-il croître ? | Développement fixe ou progressif de la prescription |
| 6 | **Terminaison** | Fin normale, délai atteint, échec, interruption, abandon, maximum atteint : quels états distincts ? | Arrêt explicite et cohérence des résultats |
| 7 | **Paramètres imposés** | Qu'est-ce qui est verrouillé, réglable, prérempli ou recalculé ? Que se passe-t-il si l'utilisateur édite la Composition ? | Respect des contraintes propres au Format |
| 8 | **Résultats** | Prévu/réalisé, séries partielles, cycles achevés, volume réel, dépassements, raisons d'arrêt ? | Historique et exploitation ultérieure des séances |
| 9 | **Interruptions/reprise** | Pause volontaire, arrière-plan, verrouillage, interruption audio, fermeture, reprise ? | Robustesse temporelle et conservation d'état |
| 10 | **Signaux d'exécution** | Bips, décomptes, haptique, annonces, changements de phase : quelle synchronisation avec les événements du plan ? | Cohérence entre moteur, interface et signaux |

Les dimensions 1 et 2 doivent être stabilisées dans PRE-9. Les dimensions 3 à 10 doivent être **analysées avant PRE-10**, mais seules les capacités utiles à Libre ou nécessaires à une compatibilité structurelle démontrée doivent être implémentées dans PRE-10.

## 4. Matrice de cadrage initiale des Formats

Cette matrice exprime les **questions à vérifier dans les spécifications**, non des décisions nouvelles sur les règles précises des Formats.

| Format | Contraintes à documenter | Capacités potentiellement nécessaires | Points à qualifier avant PRE-10 |
|---|---|---|---|
| **Tabata** | Travail/récupération imposés ; nombre et ordre des intervalles ; organisation des exercices | Séquence temporelle, échéances automatiques | Interaction avec les pauses/conditions d'arrêt de la Séance simplifiée |
| **Intervalles 30/30** | Alternance travail/repos ; répétitions ; règles de fin | Intervalles et transitions temporelles | Paramètres imposés et articulation cycle/circuit |
| **EMOM** | Fenêtres temporelles ; volume prévu ; repos résiduel | Horloge de fenêtre distincte de l'étape ; événement d'expiration | Que se passe-t-il si le travail n'est pas terminé dans sa fenêtre ? |
| **AMRAP** | Borne temporelle globale ; répétition du contenu ; cycles partiels | Génération progressive et arrêt sur borne | Représentation du réalisé et terminaison pendant un exercice |
| **For time** | Plan à parcourir ; chronométrage global ; limite éventuelle | Chronomètre global, plan fini, résultat d'achèvement | Règle à l'expiration d'une limite pendant le plan |
| **Death by** | Augmentation du volume ; fenêtres éventuelles ; échec/limite | Progression dynamique et fin conditionnelle | Règle exacte d'augmentation et de constat d'échec |

### Départs rapides à qualifier

**Renforcement**, **Gainage · Mobilité**, **Superset**, **Progression**, **À l'échec** : pour chacun, distinguer simple préconfiguration Libre et capacité nouvelle du moteur. Ne pas présumer qu'ils nécessitent cinq moteurs ou cinq politiques distinctes. Reprendre la définition des modèles dans les sources actuelles.

### Matrice de travail demandée à Claude

Pour **chaque** modèle, renseigner :

- paramètres imposés, optionnels, modifiables et par défaut ;
- structure de séance admissible ;
- origine et règle d'expansion du plan ;
- horloges et événements temporels ;
- transition et terminaison ;
- progression fixe/dynamique ;
- résultats prévus et partiels ;
- interruptions/reprise et signaux ;
- documentation/Figma/source de vérité ;
- décisions manquantes, avec impact et date de résolution nécessaire.

## 5. Sept arbitrages structurants à vérifier ou obtenir

**Aucun de ces items n'est déclaré nouvellement validé par ce document.** Rechercher d'abord les décisions existantes, puis ne solliciter que les arbitrages réellement absents ou contradictoires.

| ID | Question | Impact si non tranchée | Attendu avant PRE-10 |
|---|---|---|---|
| A1 | Le plan peut-il être développé progressivement pendant l'exécution plutôt qu'entièrement au lancement ? | Contrat d'expansion et d'état | Capacité structurelle connue ; politique par Format éventuellement différée |
| A2 | Plusieurs horloges ou bornes (globales, fenêtre, étape) peuvent-elles coexister ? | Modèle temporel | Compatibilité explicitement prévue ou exclusion motivée |
| A3 | Quels acteurs/événements autorisent l'avancement d'une étape ? | Contrat des transitions | Familles de déclencheurs identifiées |
| A4 | Que devient une étape en cours lorsqu'une fenêtre expire ? | Résultats partiels, progression et arrêt | Cas représentable ; règle précise par Format à documenter avant son développement |
| A5 | Quelle adaptation du plan est permise pendant l'exécution ? | Immutabilité de la prescription et évolution de la progression | Distinguer progression prescrite et modification libre de la séance |
| A6 | Comment représenter une exécution partielle et son motif de fin ? | Persistance, historique, restitution | Schéma conceptuel minimal identifié |
| A7 | Quelles règles temporelles s'appliquent aux interruptions, arrière-plan et reprise ? | Fiabilité des échéances | Invariants transverses définis avant la conception technique |

**Règle de proportionnalité :** une réponse exacte propre à EMOM ou Death by peut attendre PRE-11 si PRE-10 dispose déjà des événements et données nécessaires sans refonte. À l'inverse, toute décision qui conditionne la structure du plan, l'identité d'une étape ou l'horloge du moteur doit être stabilisée avant PRE-10.

## 6. Architecture fonctionnelle cible — proposition à instruire, non décision d'implémentation

```text
[SÉANCE CONFIGURÉE / INSTANTANÉ]
  Composition, Format, paramètres effectifs, contraintes
                     |
                     v
[DÉVELOPPEUR DE PRESCRIPTION]
  Occurrences exécutables finies ou générées progressivement
  Ordre, répétitions et progression conformément au contrat
                     |
                     v
[MOTEUR COMMUN D'EXÉCUTION]
  État et transitions | Temps et échéances
  Progression          | Interruptions et reprise
                     |
                     v
[ÉVÉNEMENTS ET SORTIES]
  Interface | Audio et haptique | Résultats | Persistance
```

### Responsabilités et frontières

- **Séance configurée :** porte l'intention utilisateur et les contraintes effectives du Format ; ne contient pas d'état de lecture volatile.
- **Développeur de prescription :** transforme les conteneurs et règles en occurrences exécutables ; peut être fini ou progressif selon la capacité finalement retenue ; ne pilote pas directement l'interface.
- **Moteur commun :** applique des événements et maintient une progression cohérente ; ne code pas les règles de chaque Format en dur dans l'interface.
- **Sorties/adaptateurs :** rendent les états, notifient les signaux et enregistrent les résultats ; ne décident pas eux-mêmes du prochain exercice.

Claude devra comparer cette séparation aux modules existants, identifier les éléments déjà réutilisables et proposer **la solution la plus simple** compatible avec les capacités effectivement requises. Ne pas transformer ce schéma en prescription de quatre services, classes ou bibliothèques obligatoires.

## 7. Contrat de préparation et critères d'entrée en PRE-10

L'entrée en PRE-10 est possible lorsque les **preuves suivantes** sont disponibles :

1. Le modèle simplifié de Séance et l'ordre de développement des exercices, circuits, cycles, séries et pauses sont spécifiés et qualifiés dans PRE-9.
2. Les paramètres de configuration des onze modèles et de Libre sont inventoriés, leurs contraintes exprimées et les incohérences avec D-449/D-451 résolues ou explicitement arbitrées.
3. Les dix dimensions ont été examinées pour chaque famille de Format ; aucun doute non résolu ne remet en cause la structure du socle commun.
4. Les sept questions structurantes ont une décision existante, une nouvelle décision validée ou une justification explicite de report sans risque de refonte.
5. Le contrat d'entrée du moteur (instantané, ordre, paramètres, contraintes et identité des occurrences) est suffisamment stable pour concevoir PRE-10.
6. Les responsabilités du moteur et des adaptateurs sont séparées dans la conception ; les mécanismes spécialisés non encore nécessaires ne sont pas implémentés par anticipation.
7. Les scénarios de compatibilité futurs sont identifiés, sans imposer leur exécution prématurée.

Cela ne constitue **pas** une garantie de risque zéro ; il s'agit d'une maîtrise explicite des risques de refonte.

## 8. Travail demandé à Claude pour rédiger les livrables

### Étape 1 — Inventaire sourcé

- Partir exclusivement de la dernière baseline validée (Git / ZIP désigné le cas échéant) et lire les décisions D-449/D-451, les spécifications Formats, Composition, modèles de données, règles métier, contrats d'écrans et architecture.
- Vérifier l'état de Figma pour toute conséquence UX/UI : page Prototype MVP `510:101`, fichier `G6RY5Ebhgwb4AHIOYDwwvg`.
- Produire une matrice des exigences **avec références exactes** (fichier, section, décision et écran/nœud Figma si pertinent).
- Distinguer `EXISTANT`, `À DÉVELOPPER`, `PARTIEL`, `CONTRADICTOIRE`, `À CLARIFIER` et `REPORTÉ`.

### Étape 2 — Analyse de compatibilité

- Confronter les Formats documentés avant le 26/10 au nouveau modèle de Séance.
- Identifier les contraintes irréductibles des Formats qui exigent une capacité du socle, sans présumer des détails non arbitrés.
- Proposer les arbitrages absents sous une forme compréhensible : règle actuelle, cas concret, options, impact sur PRE-9/10/11 et recommandation justifiée.
- Ne pas rouvrir les décisions validées et ne pas ajouter de contrôles bloquants disproportionnés.

### Étape 3 — Livrables de conception pour validation

1. **Matrice Format × capacité moteur**, renseignée et sourcée.
2. **Liste courte des arbitrages structurants**, avec statut et impacts.
3. **Contrat fonctionnel de passage Composition → Exécution**, indépendant de l'implémentation.
4. **Proposition d'architecture technique PRE-10**, distinguant acquis, extensions indispensables et travaux PRE-11.
5. **Découpage PRE-9 / PRE-10 / PRE-11** avec dépendances et critères de recette ciblés.

**Aucune modification applicative ni démarrage de PRE-10 ou PRE-11 sur la seule base de ce document.** Après arbitrage utilisateur, propager les décisions dans la documentation réellement concernée et réaliser une seconde passe indépendante (contradictions, références, Unicode, documents transverses et Figma lorsque pertinent).

## 9. Hors périmètre et limites connues

- **VoiceOver :** travaux de compatibilité différés dans un batch d'accessibilité de fin de MVP selon l'arbitrage du 28/10 ; ne pas réintroduire comme blocage PRE-9/10 des anomalies exclusivement VoiceOver, sous réserve d'obligations applicables.
- **PRE-8 :** ne pas rouvrir les décisions déjà closes, notamment `e2-11` accepté sur tests automatisés et les reports VoiceOver.
- **Historique/statistiques complets, planification et refonte du catalogue :** ne pas les ajouter comme chantiers préalables autonomes, sauf dépendance fonctionnelle démontrée à l'exécution.
- **Formats :** la matrice présente des capacités à analyser, non la certification que chaque règle détaillée est déjà validée.
- **Architecture :** le diagramme est une hypothèse fonctionnelle de travail, non un choix de modules ni une validation technique.

## 10. Références documentaires principales à contrôler

- `docs/PRODUCT.md` et `docs/INDEX.md`.
- `docs/KODJO-Seance-Objet-Unique-Decisions-2026-10-26.md` (D-449).
- `docs/KODJO-Composition-conteneurs-2026-10-28.md` et `docs/REVUE-COMPOSITION-2026-10-28.md` (D-451).
- `docs/REVUE-COHERENCE-FORMATS-2026-10-14.md`.
- `docs/sources/formats-2026-10-14/concept-V2.md` et `inventaire-ecrans.md` (sources à confronter aux décisions plus récentes, non à appliquer aveuglément).
- `docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md`.
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`.
- `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md`.
- `docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md`.
- `docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md`.
- `docs/Specifications-fonctionnelles/11 – API fonctionnelles.md`.
- `docs/Specifications-fonctionnelles/12 – Architecture technique.md`.
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`.

**Gouvernance :** conserver le présent document comme support de cadrage et d'instruction. Seul un arbitrage explicitement validé puis propagé aux sources de vérité transforme une option en règle du projet.

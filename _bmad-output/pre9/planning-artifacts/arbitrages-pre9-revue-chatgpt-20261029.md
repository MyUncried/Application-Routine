# KODJO — Revue indépendante des réponses aux arbitrages PRE-9

**Date :** 29 octobre 2026  
**Auteur de la revue :** ChatGPT  
**Verdict : REVISE**  
**Portée :** revue documentaire et fonctionnelle, sans modification des fichiers examinés, du plan BMAD ou des sources normatives.

## 1. Périmètre et références vérifiées

**Document soumis :** [arbitrages-pre9-reponses-hermann-20261029.md](arbitrages-pre9-reponses-hermann-20261029.md), branche `docs/pre9-arbitrages-reponses-20261029`, commit `0a50f9040e9924613c980281df1781b1177f3df0`.

**Plan examiné séparément :** `_bmad-output/pre9/` sur `pre9-bmad/plan`, commit `265f3d9dfff26d5cfb6abf0cfdfdcf36b9d27583`. Ce plan n'a pas été révisé à partir du document soumis.

**Sources normatives consultées :** `main @ c73079e9`, en particulier :

- [Chapitre 10 — Processus métier et règles transverses, organisation des Circuits, autour de la ligne 1053](https://github.com/MyUncried/Application-Routine/blob/c73079e9/docs/Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#L1038-L1070).
- [Chapitre 10 — RM-FMT-10 à RM-FMT-38](https://github.com/MyUncried/Application-Routine/blob/c73079e9/docs/Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#L1238-L1380), et [REC-01 à REC-24](https://github.com/MyUncried/Application-Routine/blob/c73079e9/docs/Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#L1405-L1435).
- [Chapitre 13 — CE-FMT-03, notamment §§12 à 17](https://github.com/MyUncried/Application-Routine/blob/c73079e9/docs/Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#L2490-L2540).
- [Chapitre 05 — réserves sur les combinaisons des Formats, dont Death by multi-Exercices (R-03)](https://github.com/MyUncried/Application-Routine/blob/c73079e9/docs/Specifications-fonctionnelles/05%20%E2%80%93%20Versions%20du%20produit.md#L478-L490).
- [Chapitre 07 — décisions D-449/D-451](https://github.com/MyUncried/Application-Routine/blob/c73079e9/docs/Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md).

L'examen distingue : **règle effectivement écrite**, **décision nouvelle de Hermann transcrite dans le document** et **inférence ou proposition de raccordement**. Une source qui ne tranche pas un cas ne peut pas constituer une preuve de sa conformité.

## 2. Verdict par réponse

| Arbitrage | Verdict | Justification |
|---|---|---|
| **ARB-04 — valeurs initiales** | **CONFORME** | Cas de référence correctement identifiés ; 12:00 AMRAP et 6 séries 30/30 expressément fournis par Hermann. |
| **ARB-22c — départs rapides** | **CONFORME** | Aucun contenu ni paramètre inventé ; statut ouvert correctement maintenu. |
| **ARB-26 — Exercice formaté déposé dans un Circuit** | **NON CONFORME** | La règle de la ligne 1053 est citée correctement, mais insuffisante pour établir une compatibilité de Format dans tous les cas. Trous et recouvrements. |
| **ARB-27 — ajout d'un second Exercice** | **PARTIELLEMENT CONFORME** | Principe plausible et réserve Death by fondée ; la citation de validation est conditionnelle et ne prouve pas tous les mécanismes dérivés. |
| **ARB-28 — position du Circuit formaté** | **CONFORME** | Insertion après le Circuit courant, dans le même parent, cohérente avec D-451. |

## 3. ARB-04 — contrôle des valeurs initiales

Le §2 ne dépasse pas la décision de Hermann pour les valeurs **présentées comme initiales**.

| Format | Valeur du document | Évidence ou provenance |
|---|---|---|
| Tabata | 8 séries, 20 s d'effort, 10 s de pause | **Constantes imposées**, FMT-10/FMT-14, **pas** de nouveau réglable de cadence. |
| Intervalles 30/30 | **6 séries** | Nouvelle valeur fournie le 29/10 ; constantes 30 s / 30 s de FMT-19. |
| EMOM | **W = 60 s ; N = 6** | Cas de référence REC-10, devenu valeur initiale par la décision du 29/10. |
| AMRAP | **12:00** | Nouvelle valeur fournie le 29/10. |
| For time | **21 · 15 · 9** | Exemple normatif FMT-30/FMT-32, adopté comme défaut par décision explicite. |
| Death by | **q0 = 1 ; d = 1 ; W = 1 min** | Cas de référence FMT-33, adopté comme défaut par décision explicite. |

La réserve du chapitre 10 selon laquelle les illustrations et recettes **ne sont pas automatiquement des défauts** demeure applicable à toutes les autres valeurs. Le §2 limite correctement la promotion en valeur initiale aux cas listés.

Un **défaut modifiable** ne doit pas être confondu avec une **valeur imposée et verrouillée**.

**Action demandée : aucune correction de fond à ARB-04.**

## 4. ARB-22c — contrôle de l'absence d'invention

Le §3 laisse **ouverts** Renforcement, Gainage · Mobilité, Superset, Progression et À l'échec ; il ne leur attribue aucun Mouvement ni aucun paramètre ou nombre par défaut.

FMT-02/FMT-28 étayent le fait que ces entrées sont des **préremplissages d'une Séance libre**, sans contrainte métier imposée du seul fait de leur origine.

Un mécanisme de préremplissage commun peut être planifié sans que les contenus définitifs soient inventés. L'activation de chaque départ reste conditionnée à sa définition fonctionnelle.

**Action demandée : aucune correction à ARB-22c.**

## 5. ARB-26 — non-exhaustivité et dépassement de portée

### 5.1 Ce que dit réellement le chapitre 10, ligne 1053

La règle source est correcte sur la **mécanique des séries** :

- **Circuit groupé** : nombre de séries propre à chaque Exercice, indépendant des autres ; chaque passage exécute toutes les séries des Exercices.
- **Circuit alterné** : nombre de séries identique pour tous, hérité du Circuit ; chaque passage exécute une série de chaque Exercice ; le Circuit contraint un paramètre existant.

**Cette règle ne décide pas à elle seule** si les contraintes temporelles, la borne globale, la progression dynamique, la terminaison d'un Format ou la coexistence de deux Formats restent compatibles.

Par conséquent, la conclusion du §4.1 **« Circuit à séries groupées : toujours admis »** n'est pas démontrée par la ligne 1053, même si la décision nouvelle de Hermann confirme qu'un Circuit groupé peut répéter un élément formaté.

### 5.2 Couverture insuffisante des six Formats

| Format de l'Exercice entrant | Circuit groupé | Circuit alterné | Lacune à traiter explicitement |
|---|---|---|---|
| **Tabata** | Répétition par Circuit admise en principe | N = 8 préserve le nombre imposé de séries, **sans suffire à prouver toute la compatibilité** | Circuit de destination lui-même formaté ; autres constantes et ordre/pauses. |
| **Intervalles 30/30** | En principe réutilisable | §4.2 suppose qu'un compte réglable suffit | FMT-19 ne définit pas à lui seul un sélecteur d'organisation alternée. |
| **EMOM** | Répétition possible selon la décision nouvelle | §4.2 indique que N réglable adopte le N du Circuit | FMT-22 conserve N à l'ajout/retrait d'un Exercice : remplacement automatique non démontré ; portée des fenêtres. |
| **AMRAP** | §4.1 l'admet sans réserve | §4.2 le refuse comme « résultat » | Borne du bloc et fin de chaque occurrence répétée ; bloc déjà dans un Circuit formaté. |
| **For time** | §4.1 le dit admis | **Écarté de la table sans démonstration** | Le plan autorise For time porté par un Exercice unique ; la dépose existe donc. FMT-31 exclut le sélecteur d'organisation, pas tous les déplacements. |
| **Death by** | §4.1 l'admet sans réserve | §4.2 le refuse comme « résultat » | Terminaison conditionnelle ; articulation avec la suite de Séance ; réserve R-03 sur plusieurs Exercices. |

### 5.3 Cas concrets non tranchés

**Cas A — EMOM avec N différent.** EMOM W = 60 s, N = 6, déplacé dans un Circuit alterné N = 4. Le §4.2, cas « réglable », remplace N par 4. Or FMT-22 conserve N quand on ajoute ou retire un Exercice. Il faut décider si la dépose conserve N, demande une confirmation, ou est refusée ; **« réglable » ne suffit pas à l'autoriser automatiquement**.

**Cas B — Circuit formaté de destination.** Un Exercice EMOM entre dans un Circuit Tabata groupé. Le §4.1 dit « toujours admis », alors que les deux Formats portent potentiellement des contraintes simultanées. Il faut décider si le Format de l'Exercice subsiste, si celui du Circuit prend le dessus, ou si la dépose est refusée. Aucun comportement de priorité ou d'absorption ne doit être inventé.

**Cas C — For time sur Exercice unique.** La table de porteurs du plan prévoit un For time directement sur un Exercice. Le §4.2 écarte pourtant ce cas au motif que For time serait nécessairement porté par un Circuit. Cette justification est fausse au regard de l'architecture proposée ; le cas exige un traitement explicite, ou le statut **À CLARIFIER**.

**Cas D — AMRAP dans Circuit groupé de compte 3.** La nouvelle décision permet la répétition du bloc. Il faut préciser si la borne de 12 minutes est **réinitialisée à chaque passage** et distinguer les trois bornes successives d'une éventuelle borne globale de 36 minutes. Cette précision ne découle pas du mécanisme de séries de la ligne 1053.

**Cas E — Death by répété.** FMT-34 décrit une commande mettant fin à la Séance. Le nouveau modèle admet des blocs successifs. La différence entre fin du **bloc** Death by et fin de **Séance**, et le déclenchement du bloc suivant, ne sont pas établis par §4.1. R-03 concerne en outre le Death by à plusieurs Exercices.

**Cas F — Format déjà présent sur les deux niveaux.** Un Circuit et un de ses Exercices portent chacun un Format, identique ou différent. Le §4 ne décide ni la priorité, ni la conservation des deux prescriptions, ni la restitution du Format si l'Exercice quitte ensuite le Circuit. Ce sont des situations distinctes du simple conflit de nombre de séries.

### 5.4 Trou et recouvrement de la classification

Les cas du §4.2 (« imposé égal », « imposé différent », « réglable », « résultat ») ne forment **pas une partition exhaustive** des situations fonctionnelles : For time est absent, la présence éventuelle de deux Formats n'est pas un axe de classement, et le comportement de certains Formats n'est pas réductible à leur nombre de séries.

De plus, un Circuit alterné **formaté** peut lui-même imposer un nombre N ou d'autres contraintes. Dire que le nombre de séries de l'Exercice est « réglable » ne suffit pas à décider qu'il hérite sans réserve de N.

**Correction exigée :** séparer au moins les dimensions suivantes : (1) nature groupée/alternée du Circuit, (2) destination libre/formatée, (3) Format de l'Exercice, (4) valeurs et contraintes éventuellement incompatibles, (5) sort de l'identité et des paramètres du Format lors de l'entrée puis de la sortie.

Pour toute combinaison pertinente, prévoir une issue **ADMIS**, **ADMIS AVEC CONFIRMATION**, **REFUSÉ** ou **À CLARIFIER**, sans inventer les règles manquantes. Les six Formats doivent être couverts, y compris les Formats portés par un seul Exercice.

**Verdict ARB-26 : NON CONFORME.** Ce point ne doit pas être déclaré clos ni propagé tel quel.

## 6. ARB-27 — ajout du second Exercice

Le changement de porteur **Exercice → Circuit** est cohérent avec ARB-03. FMT-11 confirme que le choix « Par exercice / En alternance » devient pertinent quand plusieurs Exercices existent ; le chapitre 05 (R-03) réserve la définition du Death by à plusieurs Exercices.

Cependant, la réponse de Hermann reproduite dans le document est **formulée comme une question conditionnelle** portant sur un second Exercice entrant dans un Circuit. Elle ne démontre pas, à elle seule, la validation de toutes les étapes suivantes : poser d'abord un Circuit autour d'un Exercice formaté ; transférer automatiquement la propriété du Format ; faire adopter les valeurs imposées au second Exercice.

**Correction exigée :** distinguer clairement (i) le principe métier accepté, (ii) le mécanisme technique proposé, (iii) les transitions nécessitant encore une décision si elles ne sont pas couvertes par une instruction explicite vérifiable. Maintenir R-03 pour Death by à plusieurs Exercices. Ne pas présenter une interprétation comme une décision de Hermann.

**Verdict ARB-27 : PARTIELLEMENT CONFORME.**

## 7. ARB-28 — insertion d'un Circuit formaté

La règle « insérer immédiatement après le Circuit contenant le dernier Exercice entré, au même niveau (Cycle si applicable, sinon Séance) » est claire et respecte l'absence d'imbrication Circuit → Circuit de D-451.

**Verdict ARB-28 : CONFORME. Aucune correction demandée.**

## 8. Précision de lecture sur ARB-25

Le §7 du document ajoute qu'un Circuit groupé peut répéter un élément formaté et qu'un Cycle répète une séquence entière. Cela est compatible **sur le principe**, mais affine la formulation précédente « le Cycle est le mécanisme de répétition intégrale d'un élément formaté ».

Tracer explicitement cette précision datée, pour ne pas laisser entendre que les deux formulations ont toujours eu exactement la même portée :

| Mécanisme | Rôle |
|---|---|
| Circuit groupé | Répète les passages complets de ses membres selon son compte. |
| Circuit alterné | Entrelace les séries de même indice de ses membres. |
| Cycle | Répète la séquence entière qu'il contient, y compris les éléments formatés. |
| Format | Conserve ses prescriptions propres de séries, fenêtres, progression, borne et terminaison. |

Les règles de répétition doivent éviter le double comptage et ne pas transformer silencieusement la borne ou la condition d'arrêt d'un Format.

## 9. §8 — Conséquences sur le plan et sur les sources normatives

La liste du document couvre certains impacts directs, mais **elle n'est pas exhaustive**. Les documents suivants doivent être ajoutés à la matrice **pour contrôle ciblé**, avec modification seulement si une dépendance réelle est confirmée.

| Document / zone | Conséquence à vérifier ou intégrer |
|---|---|
| **PRD PRE-9** | Valeurs initiales, règles de dépose, préservation de Format, changement de porteur, position d'insertion. |
| **Architecture PRE-9 §§2–3** | Propriété du Format et évolution Exercice → Circuit ; conservation lors des mutations et de la persistance. |
| **Architecture PRE-9 §6** | Contrat Composition → Exécution pour éléments formatés répétés et cas de contraintes concurrentes. |
| **Epics C.3** | Paramètres et valeurs initiales ; tests de conservation de valeurs. |
| **Epics D.1 et D.3** | Développement des occurrences ; descriptions des capacités des Formats répétés et des bornes. |
| **Matrice des écarts PRE-9** | Statut des dépendances et décisions réellement closes/ouvertes. |
| **README / sprint-status PRE-9** | Statuts d'arbitrage et dépendances localisées. |
| **Chapitre 07 — décisions** | Nouvelles décisions ; précision d'ARB-25 ; distinction entre arbitrage et proposition technique. |
| **Chapitre 08 — conception** | Entrée/sortie d'un Circuit, adoption éventuelle d'un Format, insertion. |
| **Chapitre 09 — données** | Propriété du Format après transfert Exercice → Circuit ; présence simultanée de Format sur les deux niveaux. |
| **Chapitre 10 — règles métier** | Nouvelle règle de compatibilité **distincte** de la règle existante sur les séries, et valeurs initiales décidées. |
| **Chapitre 11 — API** | Contrôle de compatibilité avant mutation : accepté, accepté après confirmation, refusé, et motifs. |
| **Chapitre 12 — architecture technique** | Représentation et conservation des contraintes sur Circuit et Exercice. |
| **Chapitre 13 — CE-FMT-02 / CE-FMT-04** | Valeurs proposées, bornes, verrouillage ; ne pas limiter le contrôle à CE-FMT-03. |
| **DSF Formats / matrice Formats** | Nouveaux défauts et conséquences sur scénarios, contrôles et références. |
| **PRODUCT.md / INDEX.md** | Rechercher les mentions dépendantes ; modifier seulement si une contradiction effective est constatée. |

**Classement de propagation :** la ligne 1053 du chapitre 10 demeure une **règle existante de mécanique des séries** (classe A si citée sans modification), mais les règles nouvelles sur la **compatibilité d'un Exercice formaté dans un Circuit** doivent être traitées comme des évolutions validées (classe B), uniquement après arbitrage explicite de leurs cas non définis.

## 10. §9 — Écarts d'exécution signalés séparément

Le document signale (a) l'appui de déclaration de tour en AMRAP / For time et (b) un plafond temporel For time présenté comme décidé le 28/10, ainsi qu'un raccordement de tours partiels AMRAP.

Ces éléments ne doivent pas être promus en exigences normatives sur la seule base de ce rapport :

- FMT-35 spécifie l'appui pour **Death by** ; il ne suffit pas à démontrer par analogie le fonctionnement identique d'AMRAP et de For time.
- La prétendue décision du 28/10 sur le **plafond de temps For time** n'a pas été retrouvée dans les règles normatives vérifiées au commit `c73079e9`. La classer comme **décision rapportée, source à retrouver**, et non comme décision démontrée par ce commit.
- Un lien « tour partiel AMRAP → RM-PRE5-02 » reste à étayer dans les sources applicables.

Ces questions ne constituent pas, dans cette revue, des blocages du développement des fonctions PRE-9 indépendantes. Leur instruction appartient au cadrage de l'exécution PRE-10 / PRE-11.

## 11. Verdict et liste précise des corrections requises

**VERDICT : REVISE.**

Avant toute révision du plan BMAD PRE-9 sur la base de ce document de réponses :

1. **§4.1** — Remplacer « Circuit groupé : toujours admis » par une règle limitée à la répétition admise **en principe**, sous réserve des autres contraintes et de la portée des limites/terminaisons des Formats.
2. **§4.2** — Produire une matrice couvrant **les six Formats**, For time compris, le cas EMOM N différent, le statut de 30/30 et la destination libre **ou déjà formatée**.
3. **§4** — Séparer compatibilité des séries et compatibilité du Format ; traiter explicitement le cas de deux niveaux porteurs de Formats, leur éventuelle coexistence et la sortie ultérieure de l'Exercice.
4. **§5** — Clarifier ce qui est explicitement validé pour ARB-27, ce qui est proposé comme transfert de porteur, et ce qui reste non arbitré ; conserver la réserve Death by / R-03.
5. **§7** — Tracer la précision apportée à ARB-25 sur la répétition par Circuit groupé et par Cycle, sans double comptage.
6. **§8** — Compléter les impacts de planification et les dépendances normatives détaillées au §9 de cette revue ; ne pas attribuer toute la règle ARB-26 à la seule mécanique de la ligne 1053.
7. **§9** — Qualifier le plafond de temps For time et les autres raccordements d'exécution comme **non démontrés par les sources normatives consultées**, tant qu'une décision vérifiable n'est pas retrouvée.
8. **Seconde passe ciblée** — Contrôler que chaque situation pertinente donne une issue explicite **ADMIS / ADMIS AVEC CONFIRMATION / REFUSÉ / À CLARIFIER**, sans trou ni recouvrement ; ne pas transformer une question ouverte en nouvelle règle.

### Points conservables sans révision de fond

- **ARB-04** : valeurs initiales, y compris 12:00 AMRAP et 6 séries 30/30.
- **ARB-22c** : en attente de définition fonctionnelle, sans contenu inventé.
- **ARB-28** : insertion immédiatement après le Circuit courant, au même parent.

**Point d'arrêt :** ne pas propager ARB-26 comme règle normative et ne pas réviser le plan PRE-9 sur cette base tant que les corrections demandées ne sont pas apportées au document de réponses.

---

*Cette revue ne constitue ni un test applicatif, ni une qualification du moteur d'exécution, ni une validation exhaustive des écrans Figma. Aucun fichier source, document normatif ou artefact de planification n'a été modifié pendant l'analyse.*

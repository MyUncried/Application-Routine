# KODJO — Protocole par tranche V2

## Spécification normative et architecture détaillée

| Métadonnée | Valeur |
|---|---|
| Statut | Spécification corrigée ; arbitrage de stockage clos par décision utilisateur |
| Phase | Phase 1 — spécification et architecture uniquement |
| Version du document | 0.6.11 |
| Date | 2026-09-10 |
| Dépôt de référence | `MyUncried/Application-Routine` |
| Branche analysée | `main` |
| HEAD initialement analysé | `358347ffe572ef72002046926dc6952a83e8f70c` |
| HEAD contrôlé par la revue | `f141c04a554e1b7edcde497c3ee9cbb0799c9260` |
| Registre de référence | `KODJO_PROTOCOL_INCIDENT_REGISTER.md` 3.3.1 corrigé et validé séparément |
| Revues sources | Revue initiale et revues ciblées `0.2.0`, `0.3.0` et `0.4.0` |
| Protocole existant analysé | `KODJO_SLICE_PROTOCOL_V1.md` |
| Tranche protégée pendant la conception | `T01-S10`, Issue `#42` |

> Ce document spécifie et instrumente le pilote V2. Il ne migre pas S10 et ne lance aucune IA lors de son installation.

### Historique 0.6.11

La version 0.6.11 implémente l’adaptateur Claude Code local prévu au §10 sans réintroduire de développement distant. Elle fixe Claude Code `2.1.263`, limite l’exécution à une invocation, douze tours et une heure, restreint les outils aux lectures/modifications locales et aux trois commandes de contrôle déterministes, interdit Git, GitHub, le réseau, les MCP et les commandes destructives, puis vérifie après exécution que les références Git et le périmètre sont intacts. Claude reçoit l’obligation d’exécuter les contrôles ciblés, d’en lire lui-même les erreurs, de corriger la cause et de relancer le contrôle au sein de la même invocation bornée. Les contrôles déterministes sont rejoués par le superviseur après Claude. Le jeton OAuth long terme est conservé localement sous Windows par DPAPI, injecté uniquement dans le processus enfant et retiré aussitôt après l’exécution.

### Historique 0.6.10

La version 0.6.10 sépare physiquement le stockage des preuves du dépôt applicatif. Le writer cible exclusivement le dépôt privé fixe `MyUncried/Application-Routine-KODJO-Evidence` et sa branche fixe `kodjo/protocol-evidence-v2`, au moyen d'une deploy key propre à ce seul dépôt. Le job reste en `contents: read` sur `MyUncried/Application-Routine`, n'utilise plus `github.token` pour écrire et ne possède donc aucun identifiant capable de modifier une branche fonctionnelle. Cette évolution répond à l'absence d'application des protections de branches sur le dépôt privé avec la formule GitHub courante.

### Historique 0.6.9

La version 0.6.9 implémente le premier writer de preuves borné dans un job dédié de `kodjo-v2-transition.yml`. Le writer vérifie la branche cible fixe, les chemins canoniques, l'allowlist des objets protocolaires et leurs hash, refuse tout remplacement, toute suppression et tout fichier applicatif intégré, puis pousse exclusivement vers `refs/heads/kodjo/protocol-evidence-v2`. Les permissions effectives sur les branches restent une condition de qualification du dépôt : le workflow seul ne transforme pas un jeton `contents: write` en autorisation limitée à une branche.

### Historique 0.6.8

La version 0.6.8 clôt `MAJ-03` par décision utilisateur. L'artefact GitHub Actions est **la barrière immédiate de récupération et un moyen de transport temporaire** ; il ne devient jamais, par défaut, la preuve canonique définitive. Le patch et son manifeste sont ensuite enregistrés durablement sur la branche de preuves par un **writer technique dédié**, séparé du checkout fonctionnel, ne recevant aucun nom de branche en entrée, ciblant exclusivement `kodjo/protocol-evidence-v2`, restreint à des chemins append-only prédéfinis, incapable de modifier ou de supprimer une preuve existante, dépourvu de toute autorisation sur une branche fonctionnelle et n'intégrant aucun fichier applicatif. Le workflow d'implémentation reste en `contents: read`. En l'absence de writer qualifié, le diagnostic est `EVIDENCE_WRITER_ABSENT` et **l'activation de V2 est interdite**. Pour rendre cet écart observable plutôt que documentaire, le job d'implémentation produit désormais une **demande de dépôt de preuves** décrivant exactement ce que le writer devra ajouter, sans lui conférer la moindre capacité d'écriture.

### Historique 0.6.6

La version 0.6.6 applique la contre-analyse OpenAI de la revue `0.6.4`. Trois écarts sont corrigés par rapport à la `0.6.5`. Premièrement, les répertoires techniques du protocole sont **implantés hors de la copie de travail** et une implantation invalide est désormais **refusée bruyamment** avant toute production : les exclusions de chemin restent une défense secondaire et ne doivent jamais faire passer silencieusement une mauvaise configuration. Deuxièmement, l'arbitrage de stockage n'est **pas** rouvert : la branche de preuves reste le support canonique durable, l'artefact Actions ne devient pas la copie unique autorisée, et la §4.5 définit à la place un writer de preuves distant, séparé du job d'implémentation. Troisièmement, la déclaration de statut d'un adaptateur devient un **contrat structuré** ; le code de sortie `75` n'est que la liaison de ce pilote, pas une obligation d'architecture. La sélection des workflows à valider repose enfin sur un **type déclaré**, et une dérivation non déclarée est refusée.

### Historique 0.6.5

La version 0.6.5 intègre les constats de la revue indépendante Claude portant sur le paquet `0.6.4`. Quatre corrections normatives : le delta conservé exclut désormais explicitement les répertoires d'orchestration matérialisés dans la copie de travail, qui faisaient échouer le contrôle de périmètre à chaque exécution réelle et rendaient `IMPLEMENTED_AND_VERIFIED` inatteignable ; un téléversement de récupération en échec est un échec de préservation et produit `IMPLEMENTATION_FAILED`, jamais un statut annonçant une reprise ciblée sans artefact source ; une reprise `TARGETED_FIX` privée des contrôles repris relance l'ensemble des contrôles requis afin de pouvoir converger ; et la durabilité réelle de l'artefact de récupération sur le chemin distant éphémère est énoncée sans contradiction avec le §4.5. Six corrections documentaires accompagnent ces changements. Aucun arbitrage d'architecture n'est rouvert.

### Historique 0.6.4

La version 0.6.4 aligne le workflow de référence sur l’invariant déjà normatif et sur le pilote GitHub Actions validé : l’artefact immuable de récupération est téléversé immédiatement après la validation du patch et **avant** Jest, TypeScript, lint et le contrôle de périmètre. L’artefact de résultat, distinct, est produit après les contrôles. Une interruption du runner pendant un contrôle ne peut donc plus supprimer l’unique copie récupérable des modifications.

### Historique 0.6.3

La version 0.6.3 corrige l’incident réel T02 où une implémentation exploitable a été rendue inaccessible par deux tests devenus obsolètes après 44 minutes de travail. Elle sépare désormais production, conservation, contrôles et validation. Un exécutant distant peut travailler uniquement dans un workspace éphémère sans credentials d’écriture fonctionnelle et produire un patch/artefact ; il ne peut ni committer ni pousser le produit. Toute modification durable du dépôt fonctionnel reste appliquée, vérifiée, commitée et synchronisée depuis `/Dev`. La reprise `TARGETED_FIX` réutilise l’artefact et ne relance jamais l’implémentation complète par défaut.

### Historique 0.6.2

La version 0.6.2 clôt la conception après l’audit Claude 0.6.1 (`ACCEPTABLE_WITH_CHANGES`). Elle intègre uniquement les quatre prérequis techniques au pilote : version Claude Code figée, outils Claude en autorisation positive, paramètres de sécurité portés par les arguments effectifs du lanceur et preuve exécutable de `NOT_SENT`. Elle impose aussi qu’une revue suivant `CHANGES_REQUIRED` soit différentielle. Aucune nouvelle revue générale OpenAI ou Claude n’est requise ; les autres capacités sont qualifiées pendant le pilote.

### Historique 0.6.1

La version 0.6.1 simplifie définitivement le parcours local. Le protocole ne gouverne plus chaque geste Git, n’impose ni CLI pour commiter/pousser, ni autorisations techniques séparées `MODIFY/COMMIT/PUSH`, ni événements d’intention de commit/push. Après le développement et les contrôles locaux, l’utilisateur valide fonctionnellement puis utilise son flux habituel `Commit/Sync` depuis `/Dev`. Le protocole observe ensuite le HEAD GitHub. Cette décision est normative et ne peut être rouverte par une revue indicative sauf faille critique, concrète et reproductible.

### Historique 0.6.0

La version 0.6.0 applique l’arbitrage utilisateur définitif : `/Dev local → vérification locale → commit local → push local → observation et revue distantes`. Actions et les agents distants sont en lecture seule sur le dépôt fonctionnel et ne créent aucun commit applicatif, même temporaire. Le workflow Claude développeur, les branches de tentative distantes, leur promotion et le transfert Actions/CLI du droit d’écrire le produit sont supprimés. La coordination des appels IA et des preuves demeure, sans capacité d’écriture fonctionnelle distante.

Les choix de la 0.5.0 restent inchangés : événement interne `REVISION_AUTHORIZED`, PLAN/binding figés après Gate 1, nouvelle tranche pour toute évolution du PLAN, `CausalWorkDescriptor` et table d’héritage, JSON explicitement présentés comme gabarits/fragments. Cette version historique n’activait rien et ne prouvait aucune exécution. Les historiques suivants décrivent les versions antérieures ; les règles courantes sont celles de la version la plus récente du présent document, soit `0.6.11`.

### Historique 0.5.0

La version 0.5.0 applique quatre choix de simplification assumés après la revue ciblée 0.4.0 : `REVISION_AUTHORIZED` est un événement interne déterministe, le remplacement d’un PLAN après Gate 1 est interdit dans une tranche active, la racine causale est définie par un descripteur minimal et une table d’héritage exhaustive, et les exemples JSON sont explicitement qualifiés comme enveloppes ou fragments. Aucun mécanisme général de succession dynamique des bindings n’est introduit.

### Historique 0.4.0

La version 0.4.0 conserve les dix clôtures documentaires acquises et corrige exclusivement les six constats encore `PARTIALLY_CLOSED` après la revue de la 0.3.0 : `REV-V2-001`, `002`, `003`, `007`, `010` et `013`. Elle ne change aucun arbitrage utilisateur.

### Historique 0.3.0

La version 0.3.0 conserve sans régression les cinq clôtures documentaires acquises (`REV-V2-009`, `011`, `012`, `014`, `016`) et corrige les onze constats encore ouverts ou partiellement clos dans la revue ciblée de la 0.2.0. Elle définit notamment une coordination Git concrète et choisit une règle conservatoire : **aucun transfert de propriété n’est permis tant qu’un ancien effet IA reste incertain**.

### Historique 0.2.0

La version 0.2.0 corrige la 0.1.0 à partir des constats `REV-V2-001` à `REV-V2-016`. Elle enregistre les trois arbitrages utilisateur suivants :

1. le PLAN est revu par une **nouvelle conversation OpenAI**, distincte de la conversation autrice ;
2. le journal et les paquets de preuve canoniques sont conservés sur une **branche Git dédiée** ;
3. le chemin manuel **contourne les bridges, jamais le noyau** : si le moteur commun ou ses contrats sont défaillants, la tranche s’arrête de manière conservatoire.

Ces décisions sont documentaires. Leur faisabilité et leur conformité opérationnelles restent `NON VÉRIFIABLE` jusqu’aux tests et au pilote prévus au §13.

---

## 1. Objet et décision d’architecture

### 1.1 Problème

Le protocole V1 contient de nombreux invariants pertinents mais les applique au moyen d’une architecture fragmentée : workflows multiples, expressions GitHub, Bash, PowerShell, Ruby, `jq`, CLI et formats de commentaires partiellement structurés.

Cette fragmentation a trois effets démontrés par le registre :

1. une règle corrigée dans un chemin n’est pas nécessairement appliquée aux autres ;
2. les tests peuvent contrôler une représentation simplifiée différente du code effectivement exécuté ;
3. une défaillance de transport ou de syntaxe peut bloquer une tranche alors que le travail fonctionnel est disponible.

La V2 ne doit donc pas ajouter une nouvelle couche de correctifs à la V1. Elle doit remplacer le centre d’exécution du protocole tout en conservant ses invariants utiles.

### 1.2 Décision proposée

La V2 repose sur :

- un moteur TypeScript unique et versionné ;
- trois workflows opérationnels au maximum : transitions, OpenAI et implémentation éphémère avec publication d’artefact ;
- une machine à états explicite ;
- un contrat JSON commun pour toutes les commandes et tous les résultats ;
- des transitions idempotentes ;
- un journal GitHub reconstructible ;
- un coupe-circuit permanent ;
- trois mécanismes génériques de reprise ;
- un mode manuel officiel exécutant le même moteur ;
- aucun enchaînement automatique indispensable à la progression ;
- une consommation Claude explicitement autorisée, bornée et tracée.

### 1.2-A Arbitrage impératif : écriture fonctionnelle locale

Aucun workflow GitHub Actions ni agent distant ne peut créer, fusionner ou pousser un commit fonctionnel. Un agent distant peut modifier une copie éphémère uniquement afin de produire un patch ou une archive récupérable ; cette copie n’est jamais une branche fonctionnelle ni une source de vérité. Toute modification durable du dépôt fonctionnel est appliquée dans `/Dev`, puis vérifiée, commitée et poussée depuis le poste local. Aucun commit applicatif distant n’est permis, même sur une branche isolée ou temporaire.

`/Dev` désigne la copie autorisée du poste utilisateur, ici `C:\Dev\Application-routine`, pas un runner self-hosted piloté par Actions. Un agent distant ne peut contourner cette règle en déclenchant SSH, un runner ou un service écrivant dans cette copie. Claude Code local peut utiliser une API de modèle ; seuls ses outils locaux supervisés peuvent modifier les fichiers. L’utilisateur conserve son interface habituelle de commit et de synchronisation.

GitHub reste source de lecture, support de revue, stockage de preuves et destination du push local. La branche de preuves reçoit des objets protocolaires et les références d’artefacts de récupération, jamais un commit fonctionnel ou une fusion applicative. Un patch applicatif est un objet de transport inerte : il ne peut être appliqué automatiquement à la branche fonctionnelle et doit être restauré puis vérifié dans `/Dev`.

Le moteur et ses schémas restent uniques. Le noyau local réalise le travail fonctionnel ; le moteur distant prépare/valide des commandes et produit observations, revues et preuves. `AUTOMATED` décrit une orchestration contrôlée, jamais un droit d’écriture distante ; `MANUAL_CONTROLLED` contourne un bridge, jamais le noyau. Aucun mécanisme plus général de distribution des writers n’est ajouté.

### 1.3 Différence fondamentale

**V1 :** plusieurs workflows interprètent des commentaires et réimplémentent les règles du protocole.

**V2 :** un événement structuré demande une transition à un moteur unique. Le moteur valide l’état GitHub, la causalité, les autorisations et l’idempotence, puis produit un résultat structuré. Les workflows ne portent aucune règle métier du protocole.

---

## 2. Périmètre

### 2.1 Inclus

La V2 gouverne :

- la préparation d’une tranche ;
- le PLAN OpenAI/Codex ;
- la revue indépendante du PLAN ;
- le Gate utilisateur 1 ;
- l’implémentation Claude Code ;
- les corrections Claude ;
- la revue indépendante de l’implémentation ;
- le commit et le push fonctionnels depuis le poste local, puis leur observation distante ;
- le Gate utilisateur 2 ;
- la finalisation déterministe ;
- les arrêts pour clarification, décision, limitation externe ou orchestration ;
- la conservation des résultats avant publication ;
- la reprise sans nouvel appel IA ;
- la mise en quarantaine d’un bridge ;
- le mode `MANUAL_CONTROLLED` ;
- la qualification du protocole avant activation ;
- la coexistence temporaire avec V1.

### 2.2 Exclus

La V2 ne gouverne pas :

- le contenu fonctionnel des tranches KODJO ;
- les décisions produit ou Figma ;
- le fonctionnement interne des modèles OpenAI ou Claude ;
- le contournement d’une limitation, d’un quota ou d’une authentification externe ;
- une modification du protocole au milieu d’une tranche ;
- la migration de S10 ;
- une relance automatique d’IA ;
- une réparation improvisée par l’utilisateur.

### 2.3 Acteurs

| Acteur | Autorité | Interdictions principales |
|---|---|---|
| ChatGPT Développement | Pilote la tranche, prépare les commandes, contrôle périmètre et gates | Ne s’auto-attribue pas une revue indépendante de son propre résultat |
| OpenAI/Codex auteur | Produit le PLAN | Ne développe pas implicitement et n’approuve pas son propre plan |
| OpenAI/Codex reviewer | Revoit le PLAN ou l’implémentation dans une nouvelle conversation | Ne partage ni conversation ni contexte d’exécution avec l’auteur du livrable examiné |
| Claude Code local | Modifie et teste les fichiers dans `/Dev` après Gate 1 | Aucun développement distant, commit/push autonome, décision de gate ou relance implicite |
| Exécutant distant éphémère | Peut produire des modifications dans un workspace jetable et les exporter en patch/artefact | Aucun commit fonctionnel, push, merge, application automatique dans `/Dev` ou conservation exclusive sur le runner |
| Utilisateur | Approuve le PLAN et le résultat fonctionnel/visuel ; utilise ensuite son `Commit/Sync` habituel | Aucun paramétrage, identifiant, hash, formulaire ou commande CLI supplémentaire |
| Noyau V2 local | Applique les contrats et vérifie avant/après la modification | Ne remplace pas l’interface Git habituelle et ne contourne aucun gate, scope, budget ou contrôle de HEAD |
| Moteur V2 distant / Actions | Prépare/valide commandes, observe le HEAD poussé, produit rapports et preuves | Aucun commit, merge, push ou outil d’écriture applicatif, même par délégation au poste |
| GitHub | Conserve sources, événements, résultats et preuves | Un commentaire libre n’est pas une commande protocolaire |

### 2.4 Indépendance des revues

Le changement de gouvernance par rapport à V1 est explicite : la revue du PLAN est confiée à OpenAI dans une **nouvelle conversation**, et non à Claude. Claude reste développeur et pourra réaliser ultérieurement un audit technique ciblé, distinct des revues ordinaires.

Une identité logique `producer_role` ne suffit pas à démontrer l’indépendance. Chaque production et chaque revue portent aussi `principal_id`, `context_id`, `provider` et le hash exact du livrable. Le moteur refuse la revue si `context_id` est identique, si le reviewer a produit le livrable, ou si le hash examiné ne correspond pas au hash déclaré.

L’indépendance minimale exige :

- un contexte de revue séparé ;
- aucune instruction demandant au reviewer de défendre le résultat initial ;
- accès direct aux sources GitHub ;
- un verdict structuré ;
- absence de modification du travail examiné durant la revue.

Un compte de transport GitHub ne prouve pas l’identité intellectuelle : le principal autorisé, le contexte d’exécution et le compte transporteur sont vérifiés séparément.

#### Attestation du contexte reviewer

`context_id` n’est jamais fourni librement par le reviewer. Le pilote crée un `REVIEW_ASSIGNMENT` durable avant la revue : identifiant généré, fournisseur, conversation cible nouvellement créée, hash du livrable, `producer_context_id`, reviewer attendu et expiration. Le connecteur OpenAI retourne l’identifiant de conversation effectivement utilisé ; l’adaptateur le lie à `REVIEW_ASSIGNMENT` et le moteur compare cette attestation au contexte producteur. Une valeur déclarée sans attestation d’exécution est rejetée.

Le contrôle d’indépendance compare en priorité les contextes intellectuels : même conversation ou même exécution ayant produit le livrable = refus, même si rôle ou login diffèrent. Deux conversations réellement distinctes peuvent partager le principal pilote ; le pilote n’est pas assimilé à l’auteur lorsque l’attestation désigne deux contextes distincts. La neutralité des instructions reste une règle de revue contrôlée par le paquet de mission, distincte de cette preuve technique de séparation.

---

## 3. Principes normatifs

Les termes **DOIT**, **NE DOIT PAS**, **DEVRAIT** et **PEUT** sont normatifs.

1. Une tranche DOIT référencer une version exacte et immuable du protocole.
2. Une transition DOIT recevoir une commande JSON conforme au schéma V2.
3. Une transition DOIT produire un résultat JSON ou un diagnostic JSON conforme au schéma V2.
4. Le moteur DOIT reconstruire l’état depuis GitHub avant toute transition.
5. Le texte humain d’un commentaire NE DOIT PAS être parsé pour décider d’une transition.
6. L’état attendu, le HEAD, la baseline et l’incrément DOIVENT être contrôlés séparément.
7. Une même identité d’opération NE DOIT produire qu’un seul résultat fonctionnel terminal ; elle PEUT posséder plusieurs tentatives et publications diagnostiquées.
8. Une sortie ambiguë, tronquée, incomplète ou invalide NE DOIT franchir aucun gate.
9. Toute sortie IA brute, même invalide, DOIT être conservée durablement avant validation et publication.
10. Une panne de publication NE DOIT entraîner ni nouvel appel IA ni redéveloppement.
11. Un `ORCHESTRATION_FAILURE` NE DOIT déclencher aucun retry automatique.
12. Deux échecs du même bridge sur la même transition DOIVENT placer ce bridge en quarantaine.
13. Le mode manuel DOIT utiliser le même noyau, les mêmes sources et les mêmes contrats que le mode automatisé ; il contourne uniquement un bridge défaillant.
14. Une transition manuelle NE DOIT déclencher automatiquement aucune transition suivante.
15. Une tranche DOIT utiliser une seule session Claude opérationnelle, sauf rollover explicitement autorisé par la règle 16.
16. Une session Claude démontrée épuisée, massive ou inutilisable NE DOIT être reprise ; `PREPARE_ROLLOVER` PEUT préparer explicitement son remplacement sur le même HEAD causal, sans appel IA.
17. Une correction Claude DOIT recevoir uniquement le delta causal utile, sauf `ROLLOVER_COMPACT` où un paquet compact complet est explicitement construit.
18. Aucun appel Claude NE DOIT être lancé sans budget, mode, session et plafond d’appels explicites.
19. Une limitation Claude DOIT arrêter la transition sans retry, fallback ou nouvelle session implicite.
20. Un changement du protocole actif pendant une tranche EST INTERDIT.
21. Les tests DOIVENT exécuter le même moteur compilé et les mêmes schémas que la production.
22. Sans preuve V2, un invariant reste `NON VÉRIFIABLE`, même s’il était `PASS` en V1.
23. Une défaillance prouvée ou suspectée du noyau commun DOIT produire un arrêt conservatoire ; aucune procédure manuelle ne peut la contourner.
24. Les claims, tentatives, résultats et publications DOIVENT être distingués et liés à la même identité d’opération.
25. L’autorisation fonctionnelle issue du Gate DOIT désigner l’objet, le HEAD d’entrée, le périmètre, l’incrément et l’écrivain local ; elle couvre le travail local prévu sans demander trois autorisations techniques distinctes.
26. La CLI locale PEUT fournir les contrôles et le mode manuel, mais elle n’est jamais obligatoire pour le `Commit/Sync` utilisateur.
27. Aucun travail local non commité ne peut être présumé récupérable ; une nouvelle exécution Claude commence dans `/Dev` propre au HEAD GitHub autorisé. La réconciliation d’un commit local déjà produit, sans nouvel appel, relève du §9.2.
28. Toute application durable d’une modification au dépôt fonctionnel, tout commit applicatif, merge éventuel et push fonctionnel DOIVENT être exécutés exclusivement depuis `/Dev` sur le poste local. Un agent distant PEUT modifier une copie éphémère uniquement afin de produire un patch ou une archive récupérable ; cette copie n’est jamais une branche fonctionnelle active.
29. Les identifiants distants DOIVENT être incapables d’écrire une référence Git fonctionnelle. Ils PEUVENT publier des rapports, commentaires, patchs, archives et artefacts de récupération, et journaliser sur la branche de preuves.
30. Le verrou distant NE DOIT conférer aucun droit d’écriture sur le produit. Une seule exécution Claude locale est admise à la fois dans `/Dev`; aucune manipulation de verrou n’est demandée à l’utilisateur.
31. La simplicité est normative : aucune branche distante de tentative, promotion applicative distante ou reprise de writer Actions vers CLI n’est conservée.
32. Dès que l’agent a produit des modifications, le workflow DOIT préserver une livraison récupérable avant toute opération susceptible d’échouer. Un échec de test, compilation, lint, contrôle de périmètre, revue ou publication PEUT bloquer la validation, mais ne DOIT jamais entraîner la perte du travail produit.

---

## 4. Architecture logique

### 4.1 Composants

| Composant | Responsabilité |
|---|---|
| `engine` | Point d’entrée unique, orchestration déterministe |
| `state-machine` | États, transitions, rôles et préconditions |
| `contracts` | Validation des enveloppes et charges utiles |
| `github-adapter` | Lecture GitHub, pagination, vérification des acteurs, publication |
| `git-causality` | Baseline, ascendance, HEAD distant et incrément |
| `idempotency-store` | Détection des commandes et résultats équivalents |
| `circuit-breaker` | Comptage causal des échecs et quarantaine |
| `evidence-store` | Conservation préalable des sorties et diagnostics |
| `openai-adapter` | PLAN et revues OpenAI |
| `claude-adapter` | INITIAL, RESUME_DELTA et ROLLOVER_COMPACT exclusivement dans le processus local supervisé |
| `diagnostics` | Codes, message utilisateur et prochaine action |

### 4.2 Frontière des responsabilités

Le moteur décide **si** une transition peut être exécutée. L’adaptateur exécute uniquement l’opération autorisée. Le moteur valide ensuite la sortie avant qu’elle puisse devenir un résultat protocolaire.

Un adaptateur ne peut pas :

- changer l’état directement ;
- fabriquer une autorisation ;
- déclencher la transition suivante ;
- modifier la clé d’idempotence ;
- masquer une erreur externe.

### 4.3 Workflows cibles

Trois workflows au maximum suffisent :

- `kodjo-v2-transition.yml` : commandes déterministes sans écriture applicative, gates, observation du HEAD poussé localement, diagnostics, finalisation et republication de preuves.
- `kodjo-v2-openai.yml` : `BUILD_PLAN`, `REVISE_PLAN`, `REVIEW_PLAN`, `REVIEW_IMPLEMENTATION`, avec sources fonctionnelles en lecture seule et résultats sur la branche de preuves.
- `kodjo-v2-implementation-artifact.yml` : exécution éventuelle dans un workspace distant éphémère sans droits d’écriture GitHub sur le produit, préservation du patch avant contrôles, publication systématique et reprise `TARGETED_FIX`.

Le workflow distant ne remplace jamais l’application locale. `IMPLEMENT` et `CORRECT_IMPLEMENTATION` peuvent produire soit directement dans `/Dev`, soit dans un workspace éphémère exporté en artefact. Dans ce second cas, l’état ne devient pas `IMPLEMENTATION_AVAILABLE` avant récupération, application et validation locales. Aucun dispatch distant ne lance une exécution sur le poste.

Après un push local confirmé, une commande explicite d’observation/revue peut être remise au workflow prévu. L’observation ne lance aucune nouvelle IA sans autorisation et ne produit aucune correction. Les YAML ne contiennent que permissions limitées, déclencheur typé, checkout de lecture sans credentials applicatifs, installation verrouillée, appel du moteur et conservation des résultats.

### 4.4 Arborescence cible

```text
.github/
├── workflows/
│   ├── kodjo-v2-transition.yml
│   ├── kodjo-v2-openai.yml
│   └── kodjo-v2-implementation-artifact.yml
└── orchestration/
    ├── KODJO_PROTOCOL_INCIDENT_REGISTER.md
    └── v2/
        ├── KODJO_PROTOCOL_V2_SPEC.md
        ├── package.json
        ├── package-lock.json
        ├── tsconfig.json
        ├── src/
        │   ├── engine.ts
        │   ├── state-machine.ts
        │   ├── contracts.ts
        │   ├── github-adapter.ts
        │   ├── git-causality.ts
        │   ├── idempotency-store.ts
        │   ├── circuit-breaker.ts
        │   ├── evidence-store.ts
        │   └── diagnostics.ts
        ├── schemas/
        │   ├── envelope.schema.json
        │   └── payloads.schema.json
        ├── fixtures/
        │   └── incident-invariants.json
        └── tests/
            ├── unit/
            ├── contracts/
            ├── incidents/
            └── e2e/
```

### 4.5 Stockage autoritatif

Le stockage retenu est le dépôt privé dédié `MyUncried/Application-Routine-KODJO-Evidence`, sur la branche Git fixe `kodjo/protocol-evidence-v2`. Ce dépôt est distinct du dépôt applicatif `MyUncried/Application-Routine`. La deploy key du writer est enregistrée uniquement sur le dépôt de preuves et ne confère aucun droit au dépôt applicatif.

Elle contient, sous `slices/<slice_id>/`, un journal append-only logique composé d’un fichier immuable par événement, ainsi que les paquets bruts et validés. Un chemin canonique est dérivé de `operation_id`, `attempt_id` et `publication_id`; un chemin existant ne peut pas être remplacé. Les commits de preuve sont techniques et ne contiennent jamais de code fonctionnel. Ils sont construits depuis l’arbre de preuves, jamais depuis un checkout applicatif. Un producteur local ou distant autorisé aux seules preuves peut les écrire.

Les rôles sont :

| Support | Autorité |
|---|---|
| Dépôt et branche Git de preuves dédiés | Journal, commandes, tentatives, sorties brutes, résultats validés, diagnostics, gates et publications |
| Branche applicative | HEAD et commits créés dans `/Dev` puis poussés exclusivement depuis le poste local |
| Commentaire d’Issue | Vue humaine dérivée et lien vers le paquet canonique |
| Artefact Actions | Logs volumineux temporaires et transport d'une livraison récupérable ; **jamais** preuve canonique unique |
| Snapshot | Vue dérivée reconstructible, jamais source de vérité |

L’état courant est la réduction déterministe des entrées valides de la branche de preuves, liées par causalité et intégrité de contenu. L’ordre de date seul ne suffit pas. Toute modification, suppression, duplication ou rupture de chaîne est détectée et bloque la réduction.

Chaque événement contient `sequence`, `previous_event_sha256`, son propre `content_sha256` et le hash du `SliceIdentity`. La racine de confiance est le commit d’activation V2 approuvé. Le reducer suit une chaîne unique depuis cette racine ; deux événements portant la même séquence, un prédécesseur absent, un hash faux, un remplacement de chemin canonique ou un commit non signé par un principal autorisé produisent `EVIDENCE_INTEGRITY` et l’arrêt. Aucun tri chronologique ne résout un conflit.

Les règles de protection interdisent force-push et suppression sur la branche de preuves, exigent le principal moteur autorisé et un contrôle CI refusant toute modification/suppression d’un chemin existant. Le moteur ajoute exclusivement de nouveaux chemins de preuves. Chaque ajout compare le HEAD de preuves attendu ; un conflit impose relecture puis revalidation de la séquence, causalité et idempotence avant un nouvel ajout, sans répéter l’effet IA/applicatif. Aucun merge applicatif ne résout un conflit de journal. Une vérification depuis un clone vierge repart de la racine d’activation, vérifie toute la chaîne, recalcule l’état puis retrouve le paquet par `operation_id`.

#### Writer de preuves dédié — rôle de l'artefact Actions

L'arbitrage A du §16 n'est pas rouvert. La répartition des rôles est la suivante, et elle est normative :

| Support | Rôle exact |
|---|---|
| Artefact GitHub Actions | **Barrière immédiate de récupération** et **moyen de transport temporaire**. Jamais la preuve canonique définitive, ni par défaut, ni par expiration du writer |
| `MyUncried/Application-Routine-KODJO-Evidence` / `kodjo/protocol-evidence-v2` | Enregistrement **durable** du patch et de son manifeste, ajouté par le writer dédié |

Le writer de preuves est un composant technique dédié, soumis à huit règles cumulatives :

1. il travaille dans un espace **séparé du checkout fonctionnel** ;
2. il ne reçoit **aucun nom de dépôt ni de branche en entrée** ;
3. il cible exclusivement le dépôt fixe `MyUncried/Application-Routine-KODJO-Evidence` et la branche fixe `kodjo/protocol-evidence-v2` ;
4. il ne peut ajouter que des objets protocolaires, sous des chemins **append-only prédéfinis** ;
5. il ne peut ni modifier ni supprimer une preuve existante ;
6. sa deploy key est limitée au dépôt de preuves et il ne possède **aucune** autorisation de modification du dépôt applicatif ou d'une branche fonctionnelle ;
7. aucun commit de preuve ne contient de fichier applicatif directement intégré ;
8. il n'applique rien : le patch reste un objet de preuve et de transport, jamais transformé en commit fonctionnel à distance.

Le workflow d'implémentation reste en `contents: read`. Toute capacité d'écriture de preuves appartient **exclusivement** au writer séparé, et doit être qualifiée avant l'activation de V2.

**Demande de dépôt et état actuel.** Le job d'implémentation, qui n'a et ne doit avoir aucun droit d'écriture, produit une `EvidenceDepositRequest` jointe à l'artefact de résultat : dépôt et branche cibles fixes, chemins canoniques append-only dérivés de la seule identité protocolaire — `slice_id`, `operation_id`, `attempt_id` —, liste des membres avec leur hash et absence de fichier applicatif. Le writer `0.6.10` valide cette demande avant tout ajout. Sa qualification distante du 10 septembre 2026 a démontré le dépôt dans le dépôt dédié et l'absence de droit d'écriture applicatif.

Tant que le writer n'a pas réussi sa qualification complète, le diagnostic normatif `EVIDENCE_WRITER_ABSENT` reste actif au sens « aucun writer qualifié disponible », et **l'activation de V2 est interdite**. L'artefact Actions ne devient jamais la preuve canonique définitive par défaut. Les obligations d'exploitation intérimaires demeurent : rétention déclarée au moins égale à la durée de la tranche, récupération et validation dans `/Dev` avant expiration, et `OUTPUT_NOT_RECOVERABLE` — jamais un statut implémenté — en cas d'expiration d'un artefact non récupéré.

**Hébergement du writer.** Le writer est un **job dédié**, distinct de celui de l'implémentation, et non un quatrième workflow : il est hébergé par `kodjo-v2-transition.yml`, auquel le §4.3 confie déjà la republication de preuves. La limite normative de trois workflows du §1.2 est ainsi préservée.

Le choix de cette branche ne constitue pas, à lui seul, une preuve de claim atomique. Le mécanisme de claim est défini au §7.2 et doit être qualifié techniquement avant activation.

### 4.6 Commentaire V2

Chaque commentaire protocolaire comprend :

````text
[KODJO_PROTOCOL_V2]
Résumé humain compréhensible.

```json
{ ...enveloppe ou résultat canonique... }
```
````

Le bloc JSON est une **vue vérifiable du résultat déjà canonique**, jamais une commande ni une source d’état. Aucun commentaire, même parfaitement valide, ne déclenche une transition ou ne modifie le reducer. La première ligne et le JSON servent uniquement à la lecture humaine, à la vérification et au lien vers la branche de preuves.

Les seules entrées V2 sont une commande `workflow_dispatch` typée ou une commande CLI validée, toutes deux admises uniquement pour une tranche inscrite au registre d’activation V2. Les sorties distantes sont limitées aux preuves et commentaires dérivés sur l’Issue V2 dédiée. Le seul changement applicatif reçu par GitHub provient d’un commit et d’un push locaux autorisés. Aucune branche distante de tentative ni promotion applicative n’existe. Leurs préfixes, Issues et branches sont réservés et ne contiennent aucun marqueur de commande V1. Aucun de ces éléments ne vise l’Issue `#42` ni la branche S10.

### 4.7 Conservation avant publication

Ordre obligatoire :

1. **avant tout appel IA ou effet de transition**, hors lectures et acquisition préalable de coordination, écrire `ATTEMPT_RESERVED` et, si IA autorisée, `AI_CALL_INTENT` avec `ai_invocation_id` et budget réservé ;
2. recevoir les octets bruts et calculer leur hash sans les interpréter ;
3. écrire durablement le paquet brut et les métadonnées de tentative sur la branche de preuves ;
4. seulement après confirmation du commit de preuve, valider et canonicaliser la sortie ;
5. écrire le résultat validé ou le diagnostic d’invalidité dans un nouveau commit de preuve ;
6. tenter la publication d’une vue humaine contenant la référence et le hash du paquet ;
7. écrire séparément l’état de publication : `CONFIRMED`, `FAILED` ou `UNKNOWN` ;
8. en cas d’acquittement ambigu, réconcilier par lecture avant toute nouvelle publication ;
9. republier le paquet existant sans rappeler l’IA.

Si `ATTEMPT_RESERVED` ou `AI_CALL_INTENT` ne peut pas être confirmé sur la branche de preuves, **l’appel ou l’effet n’est pas lancé**. Après réception d’une sortie, si son premier commit de preuve échoue, l’exécutant écrit une copie locale durable dans un répertoire explicitement annoncé, en lecture seule, avec hash et instruction de reprise, puis s’arrête `EVIDENCE_PENDING`. Cette copie n’autorise ni gate ni reprise IA. Si elle est perdue avant commit Git, le résultat est `EVIDENCE_LOST`, la consommation reste celle enregistrée par l’intention, et toute reconstruction supposée de l’output est interdite ; une nouvelle opération exige une décision utilisateur explicite.

Un commit créé localement puis poussé depuis le poste est une preuve durable du code, mais ne remplace pas IMPLEMENTATION_OUTPUT. L’ordre propre au travail local est défini au §7.2 : brut conservé avant validation, résultat réussi seulement après observation du push local.

Un paquet durable minimal contient : version du schéma et du moteur, `operation_id`, `attempt_id`, causalité, commande canonique et hash, sortie brute et hash, résultat validé ou diagnostic, HEAD d’entrée, HEAD produit éventuel, incrément, identité du producteur, autorisation applicable et références des preuves obligatoires. Une machine vierge doit pouvoir retrouver ce paquet depuis GitHub seul.

Pour une implémentation distante éphémère, une barrière supplémentaire s’applique dès qu’au moins un fichier diffère du `source_head` : le workflow fabrique, valide, fige **et téléverse** l’`ImplementationDeliveryArtifact` de récupération du §6.13-B **avant** Jest, TypeScript, lint, contrôle de périmètre, revue ou publication. Sa seule présence dans le workspace du runner ne constitue pas une conservation durable. Les contrôles lisent ensuite cette livraison figée ou le worktree correspondant ; ils ne précèdent jamais son téléversement. Le téléversement est un **fait observé, jamais présumé** : l'issue de l'étape de dépôt est transmise à la synthèse. Si aucun dépôt durable n'a abouti — ni le dépôt initial, ni sa tentative de secours obligatoire —, la préservation a échoué au sens du §5.2-A et le statut est `IMPLEMENTATION_FAILED` avec le diagnostic `RECOVERY_NOT_DURABLE`. Il est interdit d'annoncer un statut récupérable, une coordonnée d'artefact ou une reprise `TARGETED_FIX` lorsque l'artefact source n'existe pas.

Après les contrôles, un artefact de résultat distinct porte leurs verdicts et le statut métier. La préparation et la publication de ce résultat s’exécutent même après erreur (`if: always()` ou mécanisme équivalent). Le code de sortie rendant le run rouge n’est émis qu’après les tentatives de conservation, de synthèse et de publication.

---

## 5. Machine à états

### 5.1 États normaux

| État | Signification |
|---|---|
| `SPEC_READY` | Tranche définie, sources et baseline figées |
| `PLAN_AVAILABLE` | PLAN produit et conservé, en attente de revue |
| `PLAN_REVIEWED` | Revue favorable disponible sur le hash exact du PLAN |
| `PLAN_APPROVED` | Gate utilisateur 1 accordé sur le PLAN exact |
| `IMPLEMENTATION_AVAILABLE` | HEAD créé/poussé localement, observé sur GitHub et output conservé, en attente de revue |
| `IMPLEMENTATION_REVIEWED` | Revue favorable disponible sur le HEAD et l’incrément exacts |
| `IMPLEMENTATION_APPROVED` | Gate utilisateur 2 accordé sur le HEAD exact |
| `DONE` | Finalisation déterministe réussie |

### 5.2 États d’arrêt

| État | Signification | Sortie autorisée |
|---|---|---|
| `CLARIFICATION_REQUIRED` | Source insuffisante ou contradiction métier | Résolution explicite puis répétition de la transition |
| `USER_DECISION_REQUIRED` | Arbitrage de gouvernance nécessaire | Autorisation utilisateur causale |
| `EXTERNAL_LIMIT` | Quota, auth, service ou runner indisponible | Attente ou chemin manuel selon la cause |
| `ORCHESTRATION_FAILURE` | Le bridge a échoué | Diagnostic, qualification hors circuit ou manuel |

`QUARANTINED` est un état de bridge, pas un état fonctionnel de la tranche. La tranche conserve son dernier état valide.

### 5.2-A Statuts métier de l’implémentation

Ces statuts décrivent le résultat récupérable du travail, indépendamment du statut rouge ou vert du run GitHub :

| Statut | Condition normative | Suite |
|---|---|---|
| `IMPLEMENTED_AND_VERIFIED` | Un correctif récupérable est préservé et tous les contrôles requis réussissent | Restauration dans `/Dev`, vérification locale, commit/push locaux, puis revue |
| `IMPLEMENTED_WITH_FAILED_CHECKS` | Un correctif récupérable est préservé et au moins un contrôle échoue | `START_IMPLEMENTATION_RECOVERY` en mode `TARGETED_FIX` |
| `CLARIFICATION_REQUIRED` | Le développement est suspendu avant livraison complète à cause d’une ambiguïté fonctionnelle attestée | Réponse causale, puis reprise explicitement autorisée |
| `IMPLEMENTATION_FAILED` | Aucun correctif exploitable n’a été produit, la préservation elle-même a échoué, ou le patch n’a pu être déposé durablement (`RECOVERY_NOT_DURABLE`) | Diagnostic ; nouvelle implémentation seulement après décision explicite |

Un contrôle en échec bloque la validation, jamais la conservation. Dès qu’un patch exploitable a été préservé **et déposé durablement**, le statut ne peut pas être rétrogradé en `IMPLEMENTATION_FAILED` à cause de Jest, TypeScript, lint, du contrôle de périmètre, de la revue ou de la publication du commentaire. L’échec du dépôt durable lui-même n’est pas un contrôle : c’est une préservation incomplète, et il produit `IMPLEMENTATION_FAILED`. Un patch présent dans le seul workspace éphémère n’est pas un patch conservé.

### 5.3 Table des transitions

| Source | Transition | Auteur autorisé | Préconditions essentielles | État après succès | Suite autorisée |
|---|---|---|---|---|---|
| `SPEC_READY` | `BUILD_PLAN` | Auteur OpenAI | Identité de tranche, version, baseline et périmètre valides | `PLAN_AVAILABLE` | `REVIEW_PLAN` |
| `PLAN_AVAILABLE` | `REVISE_PLAN` | Auteur OpenAI | Revue défavorable, refus utilisateur causal ou clarification résolue ; événement `REVISION_AUTHORIZED` correspondant | `PLAN_AVAILABLE` | `REVIEW_PLAN` |
| `PLAN_AVAILABLE` | `REVIEW_PLAN` | Nouvelle conversation OpenAI | Hash du PLAN, contexte indépendant, critères complets | `PLAN_REVIEWED` si favorable ; sinon `PLAN_AVAILABLE` | Gate 1 ou révision |
| `PLAN_REVIEWED` | `APPROVE_PLAN` | Utilisateur | PLAN et revue favorables exacts | `PLAN_APPROVED` | Premier incrément autorisé |
| `PLAN_APPROVED` ou `IMPLEMENTATION_APPROVED` | `AUTHORIZE_INCREMENT` | Utilisateur/pilote selon gate existant | Incrément suivant prévu par le PLAN, base immédiate et écrivain exacts | état source inchangé | `IMPLEMENT` |
| `PLAN_APPROVED` ou `IMPLEMENTATION_APPROVED` | `IMPLEMENT` | Claude Code local ou agent distant éphémère | Incrément autorisé, HEAD propre, périmètre, budget et session valides | Statut du §5.2-A ; `IMPLEMENTATION_AVAILABLE` seulement après restauration éventuelle, vérification, commit/push locaux et observation | Revue ou reprise ciblée |
| État source d’un `IMPLEMENTED_WITH_FAILED_CHECKS` | `START_IMPLEMENTATION_RECOVERY` | Noyau local ; agent distant seulement si explicitement nécessaire | Artefact intègre, run source identifié, échecs bornés, mode `TARGETED_FIX` | Nouvel artefact cumulatif ; statut du §5.2-A | Vérification locale puis revue, ou nouvelle reprise ciblée |
| `IMPLEMENTATION_AVAILABLE` | `REVIEW_IMPLEMENTATION` | Reviewer OpenAI indépendant | HEAD distant, output et périmètre d’incrément exacts | `IMPLEMENTATION_REVIEWED` si favorable ; sinon `IMPLEMENTATION_AVAILABLE` | Gate 2 ou correction |
| `IMPLEMENTATION_AVAILABLE` | `CORRECT_IMPLEMENTATION` | Claude Code local / noyau local | Revue défavorable **ou refus utilisateur causal**, incrément autorisé, session utilisable et delta borné | `IMPLEMENTATION_AVAILABLE` après nouveau `Commit/Sync` utilisateur observé et output conservé | Nouvelle revue obligatoire |
| `PLAN_APPROVED`, `IMPLEMENTATION_APPROVED` ou `IMPLEMENTATION_AVAILABLE` | `PREPARE_ROLLOVER` | Pilote / noyau local | Session inutilisable démontrée, ancienne exécution terminée, autorisation explicite, HEAD GitHub propre | état fonctionnel inchangé ; aucune invocation IA | `IMPLEMENT` ou `CORRECT_IMPLEMENTATION` explicite |
| `IMPLEMENTATION_REVIEWED` | `APPROVE_IMPLEMENTATION` | Utilisateur | Revue favorable et validation fonctionnelle/visuelle sur HEAD exact | `IMPLEMENTATION_APPROVED` | Lot suivant ou finalisation |
| `IMPLEMENTATION_REVIEWED` | `REJECT_IMPLEMENTATION` | Utilisateur | Refus motivé sur HEAD exact | `IMPLEMENTATION_AVAILABLE` | Correction puis nouvelle revue |
| `PLAN_REVIEWED` | `REJECT_PLAN` | Utilisateur | Refus motivé sur hash exact | `PLAN_AVAILABLE` | Révision puis nouvelle revue |
| Tout état non terminal | `REQUEST_CLARIFICATION` | Moteur/pilote | Question structurée nécessaire | état fonctionnel inchangé + arrêt `CLARIFICATION_REQUIRED` | `RESOLVE_CLARIFICATION` |
| État conservé avec clarification | `RESOLVE_CLARIFICATION` | Utilisateur ou autorité désignée | Réponse attestée liée à `question_id` | état fonctionnel conservé | Nouvelle opération explicitement autorisée |
| `IMPLEMENTATION_APPROVED` | `FINALIZE` | Moteur | Tous incréments alloués terminés, HEAD inchangé, gates et contrôles finaux réussis | `DONE` | Aucune |

`REVISION_AUTHORIZED` n’est ni une commande, ni une transition exposée, ni un appel IA. C’est un événement interne émis automatiquement par le reducer lorsqu’il valide une cause attestée autorisant une révision : verdict `CHANGES_REQUIRED` du reviewer compétent, refus utilisateur causal, ou clarification résolue exigeant une modification. Il contient l’autorité attestée, l’événement causal, l’opération/révision précédente et la révision attendue. Il ne vaut ni autorisation d’écriture, ni autorisation d’exécution ; celles-ci restent vérifiées séparément.

### 5.4 Règles de transition

- Une transition ne change d’état qu’après conservation d’un résultat terminal valide.
- Un diagnostic ne modifie pas l’état fonctionnel antérieur.
- Une clarification n’autorise pas implicitement la reprise.
- Une correction invalide toute revue portant sur l’ancien HEAD.
- Un Gate utilisateur désigne exactement le PLAN ou le HEAD approuvé.
- `FINALIZE` ne contient aucun appel IA.
- Un arrêt est un résultat de tentative superposé à l’état fonctionnel ; il ne remplace pas cet état.
- La résolution d’une clarification crée une nouvelle commande causale ; elle ne rejoue rien implicitement.
- Un incrément n’est exécutable que s’il est alloué au PLAN approuvé et autorisé depuis sa base immédiate.
- Un lot n’est jamais pénalisé pour un critère explicitement différé à un lot ultérieur.
- Un refus visuel invalide le Gate 2 et impose correction, nouvelle sortie et nouvelle revue.
- Après `APPROVE_PLAN`, le PLAN et son binding sont figés pour la tranche active. Toute modification du PLAN exige l’arrêt de cette tranche et l’activation explicite d’une nouvelle tranche ; aucun remplacement à chaud, aucune succession de bindings et aucune réutilisation des autorisations antérieures ne sont permis.
- Après `CHANGES_REQUIRED`, la revue suivante est exclusivement différentielle : elle vérifie les corrections demandées, leur effet sur les éléments directement dépendants et l’absence de régression introduite par ces corrections. Elle ne réexécute pas la revue complète et ne crée pas une nouvelle boucle pour une réserve de traçabilité non bloquante. Un élargissement n’est permis que si la correction révèle un défaut fonctionnel ou technique nouveau, critique et précisément démontré.

### 5.5 Déroulés normatifs de clôture documentaire

| Scénario | Séquence sans transition implicite |
|---|---|
| Nominal | `SPEC_READY → PLAN_AVAILABLE → PLAN_REVIEWED → PLAN_APPROVED → IMPLEMENTATION_AVAILABLE → IMPLEMENTATION_REVIEWED → IMPLEMENTATION_APPROVED → DONE` |
| PLAN révisé | `PLAN_AVAILABLE → REVIEW_PLAN(CHANGES_REQUIRED) → REVISION_AUTHORIZED(REVIEW_CHANGES_REQUIRED) → REVISE_PLAN → PLAN_AVAILABLE → REVIEW_PLAN` |
| PLAN revu favorablement puis refusé | `PLAN_REVIEWED → REJECT_PLAN → PLAN_AVAILABLE → REVISION_AUTHORIZED(USER_REJECTION) → REVISE_PLAN → REVIEW_PLAN` |
| Deux incréments | Gate 1 → autorisation lot 1 → modification/vérification/commit/push locaux → observation/revue/Gate 2 → même parcours local lot 2 → observation/revue/Gate 2 → finalisation |
| Correction technique | `IMPLEMENTATION_AVAILABLE → REVIEW_IMPLEMENTATION(CHANGES_REQUIRED) → REVISION_AUTHORIZED(REVIEW_CHANGES_REQUIRED) → CORRECT_IMPLEMENTATION → IMPLEMENTATION_AVAILABLE → REVIEW_IMPLEMENTATION` |
| Refus visuel | `IMPLEMENTATION_REVIEWED → REJECT_IMPLEMENTATION → IMPLEMENTATION_AVAILABLE → REVISION_AUTHORIZED(USER_REJECTION) → CORRECT_IMPLEMENTATION → REVIEW_IMPLEMENTATION` |
| Clarification | état fonctionnel conservé + `CLARIFICATION_REQUIRED` → réponse explicite → `REVISION_AUTHORIZED(CLARIFICATION_RESOLVED)` si une révision est requise → nouvelle opération explicitement autorisée |
| Première implémentation interrompue sans output | `PLAN_APPROVED → IMPLEMENT(diagnostic, état conservé) → PREPARE_ROLLOVER si nécessaire → nouvelle autorisation → IMPLEMENT` |

---

### 5.6 Parcours local et observation distante

| Scénario | Parcours normatif |
|---|---|
| Implémentation nominale | Gate 1 → contrôle automatique H0/scope → Claude local → vérifications locales → validation utilisateur → `Commit/Sync` habituel → observation H1 sur GitHub → output valide → IMPLEMENTATION_AVAILABLE → revue distante explicitement autorisée |
| Correction | Revue/refus causal → REVISION_AUTHORIZED interne → correction bornée → artefact cumulatif si exécution éphémère → vérifications/commit/push locaux → nouvelle revue du HEAD poussé |
| Commit créé, push en attente | Conserver SHA et preuves → état fonctionnel antérieur + diagnostic → réconciliation locale §9.2 → push du même commit sous autorisation → observation ; aucun nouvel appel IA |
| Commande distante IMPLEMENT | Travail permis uniquement dans une copie éphémère ; préservation obligatoire avant contrôles ; patch/artefact sans commit ni push ; restauration et décision d’intégration dans `/Dev` |
| Contrôle distant en échec | Le run peut rester rouge ; l’artefact est publié et le statut métier est `IMPLEMENTED_WITH_FAILED_CHECKS` ; aucune réimplémentation complète automatique |
| Rapport distant défavorable | Rapport conservé, code inchangé ; aucune correction, merge, commit ou exécution locale déclenchée à distance |
| Travail local interrompu | Arrêt/effets vérifiés par le superviseur local ; travail partiel non qualifié ; reprise sans IA seulement si les effets existants sont vérifiables ; aucun transfert vers Actions |

## 6. Contrats structurés

### 6.1 Enveloppe commune

Toute commande précise `execution_environment` : `LOCAL` ou `REMOTE_EPHEMERAL`. L’application durable, le rollover du développeur local, le commit et le push exigent `LOCAL` et la CLI lancée sur le poste. Une déclaration JSON `LOCAL` reçue d’Actions ne suffit pas : origine du processus et principal sont contrôlés. Les commandes distantes imposent `business_commit_allowed=false`, `business_push_allowed=false` et `functional_ref_write_allowed=false` ; elles peuvent seulement modifier leur copie jetable et exporter une livraison. Aucun mode d’exécution ne déroge à cette règle.

```json
{
  "schema_version": "kodjo.protocol.v2.0",
  "protocol_version": "2.0.0",
  "event_id": "uuid",
  "causation_id": "uuid-or-null",
  "correlation_id": "T01-S11",
  "repository": "MyUncried/Application-Routine",
  "issue_number": 43,
  "slice_id": "T01-S11",
  "transition": "BUILD_PLAN",
  "input_head": "40-character-lowercase-sha",
  "target_branch": "feat/example",
  "baseline_head": "40-character-lowercase-sha",
  "increment": {
    "id": "FULL",
    "base_head": "40-character-lowercase-sha",
    "result_head": null
  },
  "actor": {
    "role": "CHATGPT_DEVELOPMENT",
    "principal_id": "stable-authorized-principal",
    "context_id": "distinct-conversation-or-session-id",
    "provider": "OPENAI",
    "transport_login": "verified-github-login"
  },
  "execution_mode": "AUTOMATED",
  "execution_environment": "REMOTE",
  "operation_id": "sha256-of-semantic-operation-descriptor",
  "idempotency_key": "same-value-as-operation_id",
  "operation_revision": 1,
  "slice_bootstrap_sha256": "64-hex",
  "approved_plan_binding_sha256": null,
  "engine_ref": {
    "commit": "40-character-lowercase-sha",
    "schema_bundle_sha256": "64-hex",
    "lockfile_sha256": "64-hex",
    "node_version": "exact-version",
    "claude_code_version": "2.1.263",
    "claude_adapter_config_sha256": "64-hex"
  },
  "created_at": "ISO-8601-UTC",
  "payload": {}
}
```

Champs obligatoires pour toutes les transitions :

- `schema_version` ;
- `protocol_version` ;
- identité causale ;
- HEAD et baseline ;
- incrément, même lorsqu’il vaut `FULL` ;
- auteur et rôle vérifiés ;
- `execution_mode` et `execution_environment` ;
- clé d’idempotence.

L’objet ci-dessus est un **gabarit d’enveloppe de commande**. Pour former une commande complète, `payload` doit être remplacé par le payload de la transition concernée, notamment celui du §6.2 pour `BUILD_PLAN`. Il ne contient ni champ générique `head` ni HEAD futur. Contraintes d’égalité : `correlation_id = slice_id`; `transition = payload.requested_transition`; `increment.base_head = input_head` pour une écriture ; `increment.result_head = null`; `idempotency_key = operation_id`. Toute divergence est rejetée.

Un **résultat** reprend `operation_id`, ajoute obligatoirement `attempt_id`, `result_id`, `input_head` et `result_head`. Pour une écriture locale réussie : `result_head = commit_head = increment.result_head` ; ce SHA, créé/poussé localement et observé sur GitHub, descend strictement de `input_head`. Pour une opération sans écriture : `result_head = input_head`. Les schémas `CommandEnvelope` et `ResultEnvelope` sont discriminés et interdisent les champs réservés à l’autre phase.

### 6.1.1 Identité initiale et liaison au PLAN

`SliceBootstrapIdentity` est créée avant `BUILD_PLAN` et reste immuable. Elle contient uniquement des données déjà disponibles : dépôt, `slice_id`, Issue V2 dédiée, branche cible, baseline, version/commit du protocole, registre d’activation V2, tranche précédente et checkpoint final ou `null`, sources produit figées et acteurs autorisés. Son JSON canonique est ancré par le commit d’activation ; `slice_bootstrap_sha256` est obligatoire dans toute commande et tout résultat.

Après Gate 1, un événement immuable et unique `APPROVED_PLAN_BINDING` ajoute, sans modifier l’identité initiale : `slice_bootstrap_sha256`, hash du PLAN approuvé, revue exacte, Gate 1, liste ordonnée des incréments et hash de cette liste. Les commandes antérieures au Gate 1 portent `approved_plan_binding_sha256=null`; les commandes postérieures portent le hash exact de cet unique binding. Après Gate 1, toute commande visant un autre binding est rejetée. Une évolution du PLAN exige une nouvelle tranche et une nouvelle identité bootstrap ; les preuves de la tranche arrêtée restent intactes.

Le manifeste V1 n’est jamais utilisé comme identité V2. `SliceIdentity` désigne dans la suite le couple `{SliceBootstrapIdentity, binding courant ou null}`.

### 6.2 Fragment de payload d’une commande de transition

```json
{
  "requested_transition": "BUILD_PLAN",
  "expected_state": "SPEC_READY",
  "input_head": "40-character-lowercase-sha",
  "slice_bootstrap_sha256": "64-hex",
  "approved_plan_binding_sha256": null,
  "source_refs": [
    "issue:43",
    "slice_bootstrap_ref:...",
    "protocol_commit:..."
  ],
  "constraints": {
    "ai_call_allowed": true,
    "max_ai_calls": 1,
    "business_write_allowed": false
  }
}
```

### 6.3 Fragment de payload d’un résultat commun

```json
{
  "status": "SUCCEEDED",
  "state_before": "SPEC_READY",
  "state_after": "PLAN_AVAILABLE",
  "contract_type": "PLAN_RESULT",
  "producer_role": "OPENAI_PLAN_AUTHOR",
  "subject_ref": "artifact-or-commit-ref",
  "subject_sha256": "64-hex",
  "commit_head": null,
  "next_expected_action": "REVIEW_PLAN",
  "evidence": [{"kind":"CANONICAL_PACKAGE","ref":"git-evidence-ref","sha256":"64-hex"}],
  "warnings": []
}
```

`status` décrit l’issue fonctionnelle de l’opération. Il est distinct de la fin d’une tentative et de l’état de publication. Un résultat `SUCCEEDED` exige au moins une preuve canonique ; `evidence: []` est interdit pour un contrat terminal.

Ce JSON est un fragment à insérer dans un `ResultEnvelope`, lequel porte obligatoirement les identifiants et les HEAD définis au §6.1. Pour une opération sans écriture applicative, dont `PLAN_RESULT`, `commit_head=null` et `result_head=input_head`. Pour une écriture applicative locale réussie et dont le push est observé, `commit_head=result_head=increment.result_head` et ce HEAD descend strictement de `input_head`. Un commit de preuve n’est jamais placé dans `commit_head`.

### 6.4 PLAN

Champs propres :

- `objective` ;
- `source_heads` ;
- `scope_in` ;
- `scope_out` ;
- `acceptance_coverage` ;
- `implementation_steps` ;
- `test_strategy` ;
- `risks` ;
- `blocking_points` ;
- `terminal_marker`.

Un PLAN ne peut être `READY` si `blocking_points` n’est pas vide.

### 6.5 Revue du PLAN

```json
{
  "reviewed_plan_ref": "...",
  "reviewer_role": "OPENAI_PLAN_REVIEWER",
  "verdict": "APPROVE",
  "findings": [],
  "required_changes": [],
  "criteria": {
    "complete": true,
    "traceable": true,
    "executable": true,
    "testable": true,
    "scope_safe": true
  }
}
```

Verdicts autorisés : `APPROVE`, `CHANGES_REQUIRED`, `BLOCKED`, `NON_VERIFIABLE`.

### 6.6 Autorisation utilisateur

```json
{
  "authorization_type": "PLAN_APPROVAL",
  "decision": "APPROVED",
  "subject_ref": "exact-plan-ref",
  "subject_head": "exact-head",
  "subject_sha256": "exact-content-hash",
  "scope_ref": "approved-scope-ref",
  "increment_id": "LOT-1",
  "input_head": "exact-head-before-authorized-write",
  "authorized_writer": {"principal_id":"...","role":"CLAUDE_DEVELOPER"},
  "execution_environment": "LOCAL",
  "execution_mode": "AUTOMATED",
  "allowed_output_branch": "feat/example",
  "local_repository_path": "C:\\Dev\\Application-routine",
  "granted_by": "verified-user",
  "expires_on_external_head_change": true
}
```

Le Gate 1 et l’autorisation d’incrément couvrent le développement prévu dans ce périmètre. Ils ne créent pas trois validations techniques `MODIFY`, `COMMIT` et `PUSH`. Le HEAD produit conformément à cette autorisation ne l’invalide pas rétroactivement. Toute divergence avant le travail ou toute modification hors périmètre la rend caduque. L’écriture durable et toute écriture de référence Git fonctionnelle ne peuvent jamais basculer vers le distant. Après restauration éventuelle et validation fonctionnelle dans `/Dev`, l’utilisateur effectue son `Commit/Sync` habituel ; le protocole vérifie ensuite le HEAD observé.

### 6.7 Sortie d’implémentation

Champs propres :

- `claude_mode`: `INITIAL`, `RESUME_DELTA` ou `ROLLOVER_COMPACT` ;
- `session_id` ;
- `superseded_session_id` pour rollover ;
- `prompt_length` ;
- `call_number` et `max_calls` ;
- `max_turns`, `max_duration_seconds`, `max_prompt_bytes` et `max_rollovers` ;
- `usage_reset_at` lorsqu’il est connu, sinon `UNKNOWN` ;
- référence de l’autorisation de rollover le cas échéant ;
- `input_head`, `result_head`, `commit_head`, `commits` ; pour une livraison distante non appliquée, `result_head=input_head` et `commit_head=null` ;
- `increment.id`, `increment.base_head`, `increment.result_head` avec les égalités du §6.1 ;
- `changed_files` ;
- `tests_executed` ;
- `worktree_preservation` ;
- `execution_environment=LOCAL|REMOTE_EPHEMERAL` ; le second exige `business_commit_allowed=false`, `business_push_allowed=false` et une référence d’artefact ;
- `implementation_status` selon le §5.2-A, `source_run_id`, `source_head`, `artifact_ref`, `artifact_sha256` et `failed_checks` ;
- autorisation de l’incrément, contrôles locaux avant/après et confirmation du HEAD observé sur GitHub ;
- `limitations` ;
- `terminal_marker`.

### 6.8 Revue d’implémentation

Champs propres :

- `reviewed_head` ;
- `reviewed_increment` ;
- `reviewed_output_ref` ;
- `verdict` ;
- `scope_findings` ;
- `functional_findings` ;
- `technical_findings` ;
- `test_evidence` ;
- `required_changes`.

La revue doit refuser un HEAD différent du HEAD distant au moment de la revue. Elle observe le commit local poussé sans en revendiquer la production : `input_head=result_head=reviewed_head`, `commit_head=null`, `increment.result_head=null`. Une correction proposée reste un rapport, jamais un patch appliqué ni un commit distant.

### 6.9 Validation utilisateur

```json
{
  "authorization_type": "IMPLEMENTATION_APPROVAL",
  "decision": "APPROVED",
  "validated_head": "exact-reviewed-head",
  "validated_review_ref": "...",
  "functional_validation": "PASS",
  "visual_validation": "PASS"
}
```

### 6.10 Finalisation

Champs propres :

- `final_head` ;
- `plan_gate_ref` ;
- `implementation_gate_ref` ;
- `final_checks` ;
- `open_failures` ;
- `slice_status: DONE`.

La finalisation échoue si un bridge en quarantaine a masqué une preuve requise. Le recours au manuel est acceptable seulement si le résultat manuel équivalent existe.

`final_checks` contient obligatoirement, chacun avec `check_id`, `status`, `observed_head`, preuve et heure : intégrité complète du journal depuis la racine ; version moteur/schémas/lockfile ; PLAN et Gate 1 exacts ; allocation unique de tous les critères ; chaque incrément autorisé, implémenté, revu et approuvé ; aucun diagnostic bloquant ouvert ; aucun effet `UNKNOWN` ; aucune preuve requise masquée par quarantaine ; HEAD distant égal au dernier HEAD approuvé ; tests obligatoires rejoués sur ce HEAD ; validation fonctionnelle/visuelle requise ; absence d’écriture hors périmètre ; preuves de commit/push fonctionnels locaux et contrôles locaux réussis ; état des budgets et sessions terminal. Un seul `FAIL`, `UNKNOWN` ou élément absent interdit `DONE`.

### 6.11 Diagnostic d’orchestration

```json
{
  "code": "KODJO-V2-HEAD-DIVERGED",
  "step": "validate_causality",
  "cause": "Le HEAD distant ne correspond pas à la commande.",
  "expected": {"input_head": "aaa..."},
  "observed": {"input_head": "bbb..."},
  "forbidden_automatic_action": "Ne pas appeler l’IA ni modifier la branche.",
  "recommended_next_action": "Reconstruire la commande depuis le HEAD distant.",
  "ai_call_consumed": false,
  "user_message": "Le code a changé. Aucun appel IA n’a été consommé.",
  "transition_identity": "sha256...",
  "bridge_failure_count": 1,
  "bridge_status": "AVAILABLE"
}
```

`ai_call_consumed` accepte `true`, `false` ou `UNKNOWN`. Après envoi non acquitté, il vaut obligatoirement `UNKNOWN`; aucun nouvel appel n’est autorisé avant réconciliation explicite.

### 6.12 Modèle opération–tentative–publication

| Objet | Cardinalité | Terminalité | Identifiant |
|---|---:|---|---|
| Opération sémantique | 1 | Un résultat fonctionnel au plus | `operation_id` |
| Tentative d’exécution | 1..n, toujours explicitement autorisées | Diagnostic propre à la tentative | `attempt_id` |
| Appel IA | 0..1 par tentative selon budget | Consommation `true/false/UNKNOWN` | `ai_invocation_id` |
| Résultat fonctionnel | 0..1 par opération | `SUCCEEDED`, `REJECTED` ou `BLOCKED` | `result_id` |
| Publication | 0..n sans nouvel effet métier | `CONFIRMED`, `FAILED` ou `UNKNOWN` | `publication_id` |

Un diagnostic n’occupe jamais la place du résultat fonctionnel. Une tentative échouée reste durable et contribue au coupe-circuit. Une republication conserve `operation_id` et `result_id` mais reçoit un nouveau `publication_id`.

Les tentatives de travail local ajoutent les événements internes du §7.2 avant RESULT_TERMINAL ; une validation du brut ne vaut pas encore succès d’implémentation. Les étapes d’appel ci-dessous sont omises pour une commande sans IA ; son effet déterministe reste réservé et journalisé.

États durables d’une tentative : `RESERVED → EXTERNAL_CALL_INTENDED → EXTERNAL_CALL_SENT → RAW_RECEIVED → RAW_PERSISTED → VALIDATED → RESULT_TERMINAL`. Chaque passage est un événement. Après interruption, le reducer prend l’état le plus avancé prouvé. `EXTERNAL_CALL_INTENDED` sans preuve contraire interdit de déclarer la consommation nulle ; `EXTERNAL_CALL_SENT` sans résultat terminal donne `UNKNOWN` et bloque tout nouvel appel.

La réconciliation recherche, selon l’adaptateur, un identifiant d’appel et un résultat terminal authentifié. Ses seules issues sont : `NOT_SENT` prouvé, `COMPLETED` avec sortie récupérée, `FAILED_TERMINAL`, ou `UNKNOWN`. Seule une preuve `NOT_SENT` rend le budget réservé réutilisable. `REJECTED` et `BLOCKED` terminent la révision courante ; une reprise fonctionnelle nécessite `REVISION_AUTHORIZED` et une nouvelle `operation_id` sous le même `root_operation_id`.

Pour l’adaptateur Claude local, `NOT_SENT` possède une définition exécutable. Après `AI_CALL_INTENT`, le superviseur tente de créer le processus Claude et écrit immédiatement soit `CLAUDE_PROCESS_STARTED` avec PID, heure et empreinte de commande effective, soit `CLAUDE_PROCESS_CREATE_FAILED` issu de l’API de création de processus. `NOT_SENT` n’est admis que dans le second cas, si aucun PID/handle n’a été délivré, qu’aucun enfant correspondant n’est observé et que le canal de sortie n’a produit aucun octet ni identifiant de requête. Dès qu’un processus a démarré, une absence de résultat ne vaut jamais `NOT_SENT` : elle reste `UNKNOWN` jusqu’à un terminal authentifié ou une réconciliation qualifiée. Le crash du superviseur entre la demande de création et la preuve durable produit également `UNKNOWN`.

### 6.13 Clarification structurée

Une clarification contient `question_id`, `subject_ref`, `subject_sha256`, une question unique, deux ou trois options mutuellement exclusives, la possibilité d’une réponse libre, puis une réponse signée liée au même objet. La réponse ne vaut ni Gate ni autorisation d’écriture sauf si son contrat le déclare explicitement.

« Signée » signifie ici attestée par le principal autorisé du rôle attendu via le transport authentifié enregistré dans `SliceIdentity`; il ne s’agit pas d’un champ texte libre. La réponse contient `question_id`, `answer_id`, `answered_by_principal_id`, transport attesté, contenu canonique, hash et date. Le moteur vérifie le rôle et le hash de l’objet avant `RESOLVE_CLARIFICATION`.

### 6.13-A Délégation du pilote

Seul l’utilisateur accorde les Gates et toute première autorisation d’écriture. Le pilote peut émettre `AUTHORIZE_INCREMENT` sans nouveau Gate uniquement si le Gate 1 approuvé contient une délégation explicite listant les incréments, writers, environnements, modes, branches et dates autorisés. Il ne peut élargir aucun de ces champs. Toute correction, bascule de writer/mode, incrément non listé ou divergence exige une nouvelle décision utilisateur.

### 6.13-B Livraison récupérable d’une implémentation

`ImplementationDeliveryArtifact` est un paquet immuable adressé par hash. Il contient obligatoirement :

- `implementation.patch`, patch Git binaire et full-index couvrant les fichiers suivis modifiés, supprimés ou renommés **et les nouveaux fichiers** ;
- `modified-files.json`, avec pour chaque chemin le statut Git, le hash du contenu et l’indication `tracked`/`untracked` ;
- `manifest.json`, portant au minimum `schema_version`, `slice_id`, `operation_id`, `attempt_id`, `source_run_id`, `source_head`, `session_id`, `created_at`, `implementation_status`, `patch_sha256`, les références du rapport et le résumé des contrôles ;
- `development-report.md`, même incomplet si l’agent s’est interrompu après avoir modifié des fichiers ;
- `checks/*.json`, un résultat structuré par contrôle exécuté ;
- facultativement `changed-files.tar`, archive des seuls chemins listés, avec hash dans le manifeste.

Le patch est construit sans commit. Pour inclure les fichiers non suivis, le workflow utilise un index Git temporaire isolé (`GIT_INDEX_FILE`), y ajoute la totalité du delta autorisé, puis produit `git diff --cached --binary --full-index` depuis `source_head`. **Les répertoires techniques du protocole — répertoire de livraison et répertoires de téléchargement d'artefacts source — sont implantés hors de la copie de travail.** Sur un runner, ils vivent sous le répertoire temporaire fourni par la plateforme. Une implantation à l'intérieur de la copie de travail est **refusée avant toute production**, avec le diagnostic `DELIVERY_LOCATION_INVALID` : elle est une erreur de configuration et doit être signalée comme telle, non contournée. Les exclusions de chemin appliquées à la fabrication du patch, ainsi que la garde `DELIVERY_DIR_IN_DELTA` qui rejette un chemin technique présent malgré tout dans le delta, sont des **défenses secondaires** ; elles ne rendent jamais une implantation invalide acceptable. La validation structurelle du workflow refuse également toute implantation figée dans l'environnement et tout chemin d'artefact relatif à la copie de travail. Il ne modifie pas l’index fonctionnel, ne crée pas de commit et ne pousse aucune référence. Avant publication, un espace vierge au `source_head` DOIT réussir `git apply --check implementation.patch`; l’échec de ce contrôle rend la préservation invalide et produit `IMPLEMENTATION_FAILED`.

L’artefact de récupération contient uniquement la livraison figée et validée avant contrôles ; il n’est jamais réécrit pour y ajouter leurs résultats. Son nom, son URL, son identifiant et son digest sont transmis à la synthèse. Les contrôles sont ensuite exécutés avec capture individuelle de leur code de sortie afin que Jest, TypeScript, lint ou le contrôle de périmètre ne court-circuitent ni la synthèse ni l’artefact de résultat. La dernière étape peut restituer un échec au run GitHub après ces publications. L’échec du commentaire ne supprime ni ne masque l’artefact de récupération : il crée un reçu séparé `publication_status=FAILED` et autorise uniquement `REPUBLISH_EXISTING`.

Commentaire dérivé obligatoire :

```text
[KODJO_SLICE] IMPLEMENTATION_OUTPUT
slice_id=<slice>
status=<IMPLEMENTED_AND_VERIFIED|IMPLEMENTED_WITH_FAILED_CHECKS|CLARIFICATION_REQUIRED|IMPLEMENTATION_FAILED>
source_head=<commit>
source_run_id=<run>
artifact=<lien-ou-référence>
artifact_sha256=<sha256>
failed_checks=<liste>
failed_tests=<nombre>
passed_tests=<nombre>
recovery=<NONE|TARGETED_FIX|CLARIFICATION|REIMPLEMENT>
```

**Contrat de statut de l'adaptateur.** Un adaptateur d'implémentation borné DOIT pouvoir déclarer son issue de manière **structurée** : un statut parmi `COMPLETED`, `CLARIFICATION_REQUIRED` et `INTERRUPTED`, accompagné pour une clarification de la question canonique du §6.13. C'est cette déclaration structurée qui est normative, et elle prime sur toute autre indication. Une liaison par code de sortie PEUT être définie par une implémentation donnée pour les adaptateurs qui ne produisent pas de déclaration — le présent pilote lie `0`, `75`, `78` et les autres valeurs aux statuts correspondants — mais aucune valeur numérique n'est imposée par l'architecture. Quel que soit le mécanisme, le delta déjà produit est conservé et déposé selon le §4.7.

### 6.13-C Commande de reprise ciblée

```text
[KODJO_SLICE] START_IMPLEMENTATION_RECOVERY
slice_id=<slice>
source_run_id=<run>
source_artifact_sha256=<sha256>
mode=TARGETED_FIX
failed_checks=<liste>
```

La reprise : (1) télécharge et vérifie le paquet existant ; (2) restaure le patch dans un espace de contrôle propre au `source_head` ; (3) corrige uniquement les erreurs attestées ; (4) relance les contrôles échoués et ceux directement impactés ; (5) produit un nouvel artefact **cumulatif par rapport au `source_head` d’origine** ; (6) soumet ce résultat complet à la revue après application, vérification, commit et push locaux. Les contrôles non relancés sont repris de l'artefact de **résultat** du run source. Si cet artefact est absent ou vide, la reprise relance l'ensemble des contrôles requis : un contrôle jamais exécuté reste `NOT_RUN`, et une reprise incapable d'exécuter tous les contrôles requis ne pourrait jamais atteindre `IMPLEMENTED_AND_VERIFIED` — la boucle de reprise ne convergerait pas. Elle n’exécute jamais automatiquement une nouvelle implémentation complète. Une correction locale déterministe n’appelle aucune nouvelle session Claude ; un nouvel appel IA exige une justification et une autorisation explicites.

### 6.14 Preuves minimales par contrat

| Contrat | Preuves obligatoires |
|---|---|
| PLAN | paquet canonique, hash, sources et couverture des critères |
| Revue | hash examiné, identité/contexte du reviewer, verdict et constats |
| Autorisation | objet, périmètre, HEAD d’entrée, writer, environnement et mode |
| Implémentation | paquet brut, `ImplementationDeliveryArtifact`, hash vérifié, liste des fichiers y compris non suivis, rapport, contrôles et budget IA ; après intégration : commits/push locaux attestés et HEAD distant observé |
| Revue d’implémentation | HEAD distant observé, incrément, tests et constats |
| Finalisation | PLAN/Gates, couverture de tous les incréments, HEAD final et contrôles normatifs |
| Diagnostic | opération, tentative, workflow/run si disponibles, révision exécutée et cause observée |

---

## 7. Idempotence, causalité et concurrence

### 7.1 Identité d’une transition

L’identité stable est calculée par le moteur, jamais acceptée sur confiance. Elle est le hash canonique du descripteur sémantique :

```text
repository
+ slice_id
+ protocol_version
+ transition
+ baseline_head
+ input_head
+ increment.id
+ increment.base_head
+ immutable_subject_sha256
+ operation_revision
+ functional_scope_sha256
```

`subject_ref` est une adresse de transport et ne participe pas à l’identité ; son contenu doit produire `immutable_subject_sha256`. Une correction substantielle du PLAN ou d’une sortie augmente `operation_revision` et change l’identité. Une republication garde la même révision et la même identité.

Le descripteur d’opération contient uniquement l’intention fonctionnelle stable. Writer, environnement, mode `AUTOMATED/MANUAL_CONTROLLED`, compte transporteur, budget et autorisation d’exécution sont exclus et appartiennent à `AttemptDescriptor`. Une bascule autorisée change `attempt_id` et `execution_authorization_sha256`, jamais `operation_id`. Le périmètre fonctionnel autorisé par Gate reste représenté par `functional_scope_sha256`.

Le sujet immuable et les entrées supplémentaires sont fixés par transition :

| Transition | `immutable_subject_sha256` | Entrées sémantiques obligatoires |
|---|---|---|
| `BUILD_PLAN` | hash de `SliceBootstrapIdentity` + sources figées + demande produit | `input_head`, périmètre, critères |
| `REVISE_PLAN` | hash du PLAN précédent + revue/réponse causale | décision de révision attestée |
| `REVIEW_PLAN` | hash du PLAN à revoir | identité du contexte reviewer |
| `APPROVE/REJECT_PLAN` | hash du PLAN + revue exacte | décision utilisateur |
| `AUTHORIZE_INCREMENT` | hash du binding PLAN + incrément visé | délégation/Gate et base immédiate |
| `IMPLEMENT` | hash du PLAN + définition fonctionnelle de l’incrément | `input_head`, scope fonctionnel |
| `CORRECT_IMPLEMENTATION` | hash de l’output/HEAD + revue ou refus causal | delta autorisé |
| `REVIEW_IMPLEMENTATION` | hash de l’output + `result_head` | incrément et critères alloués |
| `APPROVE/REJECT_IMPLEMENTATION` | hash du HEAD + revue exacte | décision utilisateur |
| `FINALIZE` | hash de l’identité de tranche et de tous les résultats/gates | `result_head` final |
| `PREPARE_ROLLOVER` | hash de la session remplacée + opération de travail cible | preuve d’inutilisabilité et décision |
| `REQUEST_CLARIFICATION` | hash de l’objet incomplet/contradictoire | question et options canoniques |
| `RESOLVE_CLARIFICATION` | hash de la question | réponse attestée |
| `REVISION_AUTHORIZED` | événement interne : hash de l’opération précédente + cause | autorité attestée, événement causal et révision attendue |

`operation_revision` et `root_operation_id` ne sont jamais choisis par l’appelant. Le reducer construit le descripteur canonique minimal `CausalWorkDescriptor` :

```json
{
  "slice_bootstrap_sha256": "64-hex",
  "approved_plan_binding_sha256": "64-hex-or-null",
  "transition_family": "PLAN|INCREMENT|IMPLEMENTATION_REVIEW|FINALIZATION",
  "business_key": "FULL|increment.id",
  "allocated_scope_sha256": "64-hex"
}
```

`allocated_scope_sha256` vaut : pour `PLAN`, le hash canonique de la demande produit et des sources figées ; pour `INCREMENT`, le hash de la définition fonctionnelle de l’incrément dans le binding ; pour `IMPLEMENTATION_REVIEW`, le même hash d’incrément complété par le rôle de revue ; pour `FINALIZATION`, le hash canonique de la liste ordonnée des incréments du binding. Il n’inclut jamais writer, mode, tentative, transport, session, budget, HEAD produit ou autorisation d’exécution. Le JSON canonique utilise UTF-8, clés triées et valeurs normalisées selon le schéma. Pour une racine initiale, le reducer calcule `root_operation_id = sha256(canonical(CausalWorkDescriptor))` et impose `operation_revision=1`.

L’affectation et l’héritage sont exhaustifs :

| Commande ou événement | Famille | `business_key` | Racine |
|---|---|---|---|
| `BUILD_PLAN`, `REVIEW_PLAN`, `APPROVE_PLAN`, `REJECT_PLAN`, `REVISE_PLAN` | `PLAN` | `FULL` | racine PLAN ; `REVISE_PLAN` l’hérite après `REVISION_AUTHORIZED` |
| `AUTHORIZE_INCREMENT`, `IMPLEMENT`, `CORRECT_IMPLEMENTATION` | `INCREMENT` | `increment.id` alloué | racine propre de l’incrément ; correction, changement de mode/writer et reprise l’héritent |
| `REVIEW_IMPLEMENTATION`, `APPROVE_IMPLEMENTATION`, `REJECT_IMPLEMENTATION` | `IMPLEMENTATION_REVIEW` | `increment.id` alloué | racine propre de revue, dérivée du même scope alloué ; une nouvelle revue du HEAD corrigé est une nouvelle opération sous cette racine |
| `FINALIZE` | `FINALIZATION` | `FULL` | racine de finalisation unique du binding |
| `PREPARE_ROLLOVER` | famille de `target_operation_id` | clé de la cible | hérite de la racine de l’opération de travail cible, qui doit déjà exister |
| `REQUEST_CLARIFICATION`, `RESOLVE_CLARIFICATION` | famille de `subject_operation_id` | clé du sujet | héritent de la racine du sujet existant |
| `REVISION_AUTHORIZED` | famille de `previous_operation_id` | clé de l’opération précédente | événement interne sous la racine précédente ; il autorise exactement `previous_revision+1` |
| `REPUBLISH_EXISTING` | famille de `target_operation_id` | clé de la cible | référence la racine existante sans créer de travail fonctionnel |

Les références `target_operation_id`, `subject_operation_id` et `previous_operation_id` sont obligatoires et vérifiées dans le journal ; l’appelant ne fournit jamais une racine. Un incrément ne peut être ciblé qu’après `AUTHORIZE_INCREMENT`, qui crée sa première opération et sa racine depuis le binding unique. Deux incréments distincts ont des `business_key` distinctes et donc des racines distinctes. Le PLAN étant figé après Gate 1, les cas de lots conservés, modifiés ou ajoutés dans un binding de remplacement sont hors périmètre de la V2 : ils exigent une nouvelle tranche.

Sont explicitement exclus :

- le run GitHub ;
- l’identifiant du commentaire ;
- l’heure ;
- le numéro de tentative ;
- l’identifiant technique du runner.

| Variation | Même opération ? |
|---|---|
| Nouveau run, commentaire, `event_id`, heure ou runner | Oui |
| Passage automatisé vers manuel pour exécuter la même commande | Oui ; nouvelle tentative et nouvelle autorisation de writer |
| Republication du résultat existant | Oui |
| Changement de référence avec contenu identique | Oui |
| PLAN corrigé autorisé | Nouvelle `operation_id`, même `root_operation_id` |
| HEAD d’entrée changé dans la suite causale du même incrément | Nouvelle opération, même racine de l’incrément |
| Périmètre alloué ou incrément changé | Nouvelle racine ; après Gate 1, une modification du PLAN exige une nouvelle tranche |
| Nouveau HEAD produit par l’opération autorisée | Oui pour son résultat ; ce HEAD devient l’entrée d’une opération suivante |

Une relance ne peut donc pas contourner l’idempotence ou le coupe-circuit.

`REPUBLISH_EXISTING` est une commande de publication qui référence `target_operation_id` et `result_id`; elle ne recalcule jamais l’identité de l’opération fonctionnelle avec la transition `REPUBLISH_EXISTING`. Sa propre clé empêche seulement une publication dupliquée.

### 7.2 Coordination proportionnée : preuves distantes et travail local

#### Opérations distantes sans écriture fonctionnelle

La référence `refs/kodjo-v2/locks/<slice_id>` coordonne uniquement les tentatives distantes d’appel IA, de production de rapports/preuves et leur reprise équivalente par la CLI. Elle ne verrouille pas les fichiers de /Dev, n’autorise aucun commit applicatif et ne transfère jamais un writer fonctionnel entre Actions et CLI. Une lecture pure n’acquiert pas un droit d’effet. Les ajouts au journal, y compris ceux du noyau local, comparent le HEAD de preuves attendu (§4.5).

1. L’exécutant d’un rapport prépare un commit technique de lock contenant slice, opération, racine, tentative, propriétaire attesté, environnement, session éventuelle, génération 1, input_head et budget réservé. Aucun arbre applicatif n’y figure.
2. Il crée la référence par `git push --force-with-lease=refs/kodjo-v2/locks/<slice_id>: origin <lock_commit>:refs/kodjo-v2/locks/<slice_id>` : l’attente vide exige l’absence. Un concurrent relit le gagnant et s’arrête TRANSITION_ALREADY_CLAIMED.
3. Avant l’appel/effet distant, le push du lock et ATTEMPT_RESERVED, puis AI_CALL_INTENT si nécessaire, sont confirmés. Toute mutation/suppression ultérieure compare explicitement l’OID attendu. Un conflit interdit l’effet ; une réponse ambiguë impose une relecture.
4. La libération écrit ATTEMPT_TERMINAL puis supprime conditionnellement la référence. La reprise d’un rapport exige diagnostic durable, autorisation explicite, consommation connue, TerminationCertificate, puis CAS avec génération précédente + 1.

Le certificat provient d’API/superviseurs qualifiés, jamais d’une auto-attestation du pilote. Pour Actions : run/jobs terminaux, annulation achevée, enfants absents et jeton de preuves/coordination propre à la tentative révoqué ou expiré. Pour la CLI reprenant ce rapport : superviseur/session terminés, enfants absents et même révocation. Une requête en vol non terminale ou un ancien exécutant susceptible d’agir interdit le transfert ; UNKNOWN produit EFFECT_UNKNOWN. Ces jetons n’ont jamais de capacité d’écriture applicative.

Récupérations : lock sans réservation → certificat, absence d’intention/effet, ORPHAN_LOCK_CLEANUP, suppression CAS sans rejeu ; terminal écrit avec lock présent → restitution du terminal, TERMINAL_LOCK_CLEANUP, suppression CAS ; suppression non acquittée → absent confirme, même OID permet une seule suppression conditionnelle, autre OID interdit toute suppression. Un message tardif est conservé comme LATE_EXTERNAL_MESSAGE, sans remplacer le résultat canonique ni déclencher d’effet.

| Temps | Actions A : rapport/revue uniquement | CLI B : même rapport | Décision |
|---|---|---|---|
| t1 | lock génération 1 | — | A seul producteur du rapport |
| t2 | suspendu avant appel | demande reprise | refus tant que A peut agir |
| t3 | processus/enfants terminés, jeton preuves révoqué, NOT_SENT attesté | autorisation explicite | reprise du rapport admissible |
| t4 | — | CAS génération 2 | B produit le rapport autorisé |
| t5 | message retardé livré | enregistre LATE_EXTERNAL_MESSAGE | A ne revient pas ; aucun effet fonctionnel |
| Variante | appel envoyé, issue UNKNOWN | demande reprise | refus, aucune nouvelle IA |

#### Permissions et suppression de la promotion distante

Les identifiants des workflows/agents distants permettent la lecture du produit, les rapports/commentaires autorisés et, si nécessaire, l’écriture exclusivement sur les preuves/références techniques. Ils ne peuvent créer un commit applicatif via Git ou API, créer une branche applicative temporaire, merger ou pousser le produit. Les restrictions couvrent toutes les références applicatives, pas seulement la branche active. Un token doté de droits d’écriture produit trop larges est incompatible avec l’activation ; une convention de prompt ne suffit pas. Les droits de preuve n’exposent pas les credentials locaux du produit.

Il n’existe plus de branche distante `kodjo/work/...`, de promotion de tentative ni de fencing de push applicatif distant. Le poste local détient seul les credentials fonctionnels. Ils ne sont fournis ni à Actions, ni à un agent distant, ni à Claude Code comme permission autonome de commit/push. L’utilisateur conserve son mécanisme habituel `Commit/Sync`.

#### Exécution fonctionnelle exclusivement dans /Dev

Un seul poste et une seule copie fonctionnelle `/Dev` sont utilisés par tranche. Une seule exécution Claude locale peut modifier cette copie à la fois. Cette exclusivité est contrôlée par l’outil local sans action utilisateur et ne couvre pas son geste ultérieur `Commit/Sync`. Aucun bail distant ne confère un droit sur `/Dev`. Aucun nouvel appel Claude n’est lancé tant qu’un appel précédent peut encore produire un effet.

Le parcours appartient à `IMPLEMENT` ou `CORRECT_IMPLEMENTATION` et reste volontairement court :

1. L’outil local vérifie automatiquement le dépôt, la branche, le périmètre et `HEAD local = HEAD GitHub = input_head`, puis empêche une seconde exécution Claude concurrente.
2. Claude Code local modifie uniquement le périmètre autorisé et lance les contrôles prévus. Le diff et les résultats sont présentés à l’utilisateur.
3. L’utilisateur valide fonctionnellement. S’il refuse, aucun commit n’est demandé et une correction explicite est préparée. S’il accepte, il utilise son flux habituel `Commit/Sync` depuis `/Dev`; aucun identifiant, hash, formulaire ou commande CLI supplémentaire ne lui est demandé.
4. Le protocole observe le HEAD poussé sur GitHub, vérifie sa descendance, son périmètre et les contrôles associés, puis rend `IMPLEMENTATION_AVAILABLE`. La revue distante ultérieure ne peut ni modifier le code ni déclencher automatiquement une correction.

Une interruption conserve l’état fonctionnel antérieur et produit une explication. Le protocole n’effectue ni stash, reset destructif, merge, rebase ni redéveloppement automatique. Un commit local non poussé reste un état Git ordinaire géré par l’utilisateur dans son interface habituelle ; aucun nouvel appel IA n’est lancé pour le reproduire.

### 7.3 Causalité Git

Les contrôles distincts sont :

- `baseline_head` existe ;
- `increment.base_head` descend de la baseline ou lui est égal ;
- dans une commande, `increment.result_head=null` ; uniquement dans un résultat d’écriture applicative réussi, `increment.result_head` descend strictement de `increment.base_head` ; pour PLAN, revue, gate, clarification et publication, `increment.result_head=null` et `result_head=input_head` ;
- `input_head` égale le HEAD distant attendu avant l’effet et, pour une écriture, le HEAD initial de `/Dev` propre ; seul un commit local poussé et observé peut devenir le result_head d’implémentation ;
- aucun commit hors incrément n’est attribué au lot examiné.

### 7.4 Progression incrémentale

Le PLAN approuvé contient une liste ordonnée d’incréments. Chacun définit `id`, `sequence`, `base_policy`, critères d’acceptation alloués, critères différés, fichiers ou domaines autorisés, dépendances et condition de passage. `AUTHORIZE_INCREMENT` lie l’incrément au hash du PLAN et à sa base immédiate.

Un incrément est complet lorsque tous ses critères alloués sont couverts par des preuves recevables ; les critères différés ne peuvent pas motiver son rejet. Le suivant ne peut démarrer qu’après le Gate prévu. `FINALIZE` vérifie que chaque critère du PLAN est alloué exactement une fois, qu’aucun incrément n’est omis et que le dernier HEAD approuvé est le HEAD distant.

---

## 8. Coupe-circuit

### 8.1 Objet

Le coupe-circuit empêche une tranche de rester bloquée dans une boucle de réparation du protocole.

### 8.2 Règles

1. Aucun retry automatique n’est autorisé après `ORCHESTRATION_FAILURE`.
2. Le premier échec produit un diagnostic structuré et un compteur `1`.
3. La correction du bridge est qualifiée hors de la tranche opérationnelle.
4. Le deuxième échec du même bridge et du même `root_operation_id` produit un compteur `2`, même après une révision autorisée.
5. Le bridge devient `QUARANTINED` pour la clé complète `slice_id + bridge_logical_id + root_operation_id` ; toute `operation_id` ou révision descendante de cette racine est refusée en automatisé.
6. Toute nouvelle tentative automatisée équivalente est refusée avant exécution.
7. Le mode `MANUAL_CONTROLLED` devient le chemin officiel de poursuite.
8. La quarantaine ne transforme jamais l’échec en `PASS`.
9. Une correction du bridge ne le réactive pas au milieu de la tranche.
10. La correction peut être promue pour une tranche future après qualification.
11. Le compteur, réduit depuis les événements durables `ATTEMPT_RESERVED` et `ATTEMPT_TERMINAL`, est indexé par `slice_id + bridge_logical_id + root_operation_id` et ne varie pas avec révision, transport, mode, référence ou tentative.
12. Une tentative dont l’effet est incertain incrémente le compteur et interdit tout rappel IA jusqu’à réconciliation.
13. La deuxième tentative n’est permise que sur commande explicite, après qualification hors tranche ou décision motivée du pilote.
14. Le manuel peut être choisi dès le premier échec ou dès l’indisponibilité avérée ; deux échecs ne sont pas un prérequis.
15. Aucune troisième tentative automatisée n’est admise.
16. Une tentative `RESERVED` sans événement terminal après arrêt attesté est comptée comme échec conservatoire ; si son effet reste inconnu, elle est comptée et bloque en plus toute reprise IA.
17. Une panne empêchant l’écriture de `ATTEMPT_RESERVED` survient avant tout effet et n’est pas comptée comme tentative exécutée ; elle impose l’arrêt. Une panne après réservation reste reconstructible et compte selon les règles précédentes.

Exemple normatif : deux échecs automatisés sur la révision 1 d’un incrément mettent sa racine en quarantaine. Une `REVISION_AUTHORIZED` créant la révision 2 conserve cette racine ; l’automatisation reste refusée. Seul `MANUAL_CONTROLLED`, avec nouvelle autorisation de tentative et noyau sain, peut poursuivre.

### 8.3 Bridge

Un bridge est défini par :

- son rôle : transition de preuves, OpenAI ou adaptateur Claude local ;
- sa version de workflow pour une opération distante, ou de lanceur local pour Claude ;
- sa version de moteur ;
- la transition demandée.

Changer un nom de workflow ou créer un nouvel `event_id` ne change pas le bridge logique.

`bridge_logical_id` est figé dans la version de protocole. Pour l’adaptateur Claude local, sa définition versionnée référence aussi `claude_code_version` et `claude_adapter_config_sha256`. Une nouvelle version de workflow, moteur, CLI Claude ou configuration pendant la tranche ne remet pas le compteur à zéro et ne peut pas être injectée dans la tranche active.

---

## 9. Reprises et mode manuel

### 9.1 Trois mécanismes génériques

| Mécanisme | Condition | Appel IA |
|---|---|---|
| `REPLAY_SAFE` | IA non appelée, aucun résultat produit | Possible uniquement après nouvelle autorisation explicite |
| `REPUBLISH_EXISTING` | Sortie ou commit déjà produit, publication absente | Interdit |
| `MANUAL_CONTROLLED` | Bridge indisponible, défaillant ou en quarantaine ; noyau sain | Selon la transition, au plus l’appel explicitement autorisé |

### 9.2 Cas matériels

#### IA non appelée

- produire `AI_NOT_CALLED` pour l’appel concerné ; une reprise de commit/push local déjà effectué suit sa réconciliation propre et ne doit pas rejouer le travail ;
- indiquer `ai_call_consumed=false` ;
- ne pas prétendre que la transition a été exécutée ;
- permettre une nouvelle commande explicite.

#### Sortie IA non publiée

- localiser le paquet durable sur la branche de preuves par identité d’opération ;
- valider de nouveau son schéma et son hash ;
- publier le résultat existant ;
- ne pas rappeler l’IA.

#### Commit local créé, push absent ou non acquitté

Ne pas relancer Claude et ne pas recréer le commit. L’utilisateur vérifie simplement dans son interface Git habituelle si le commit est local, synchronisé ou en conflit. Si le SHA local exact apparaît sur GitHub, le protocole poursuit par observation. Si GitHub est resté sur `input_head`, l’utilisateur peut refaire `Sync` depuis son interface. Si un autre HEAD est présent, le protocole s’arrête et explique la divergence ; il n’effectue ni force-push, merge ou rebase automatique. Aucune procédure protocolaire supplémentaire n’est imposée à l’utilisateur.

#### Commit local poussé mais sortie absente

- préserver le HEAD ;
- rechercher le paquet `IMPLEMENTATION_OUTPUT` sur la branche de preuves ;
- le republier ; s’il est réellement absent, produire `OUTPUT_NOT_RECOVERABLE`, conserver le HEAD et exiger une réconciliation humaine sans redéveloppement automatique ;
- ne jamais redévelopper automatiquement.

#### Publication dupliquée

- retourner le résultat canonique antérieur ;
- ne publier aucun nouveau commentaire ;
- conserver une preuve du duplicata détecté.

#### HEAD divergent

- arrêter avant appel IA ;
- produire `HEAD_DIVERGED` ;
- demander la reconstruction de la commande.

#### Runner indisponible

- le pilote ou la CLI constate en lecture seule l’absence de run/job après le délai configuré et produit `RUNNER_UNAVAILABLE` ;
- ne pas boucler ;
- proposer `MANUAL_CONTROLLED` si ses préconditions sont satisfaites.

#### Limite ou authentification Claude

- classifier avant l’erreur générique lorsque possible ;
- conserver les traces déjà disponibles sans en déduire qu’un worktree partiel est valide ou récupérable ;
- interdire le retry avant le reset annoncé ;
- ne créer aucune nouvelle session implicitement ;
- permettre ultérieurement `PREPARE_ROLLOVER`, explicitement approuvé, si la session est inutilisable.

### 9.3 Mode `MANUAL_CONTROLLED`

Le mode manuel :

- lit les mêmes sources GitHub ;
- vérifie le même HEAD et le même incrément ;
- utilise le même moteur compilé ;
- respecte les mêmes rôles ;
- produit le même résultat ;
- contrôle l’absence d’un résultat équivalent ;
- inscrit `execution_mode=MANUAL_CONTROLLED` ;
- ne déclenche aucune transition suivante ;
- laisse ChatGPT Développement reprendre le pilotage.

Le mode manuel contourne seulement les bridges : déclencheur GitHub, runner Actions, adaptateur de transport ou publication de commentaire. Il ne contourne jamais `engine`, `state-machine`, `contracts`, `git-causality`, `authorization`, `idempotency` ou `circuit-breaker`. Si l’un de ces composants est défaillant, incohérent ou non vérifiable, le résultat obligatoire est `CORE_FAILURE` et l’arrêt conservatoire. Toute procédure exceptionnelle indépendante du noyau est hors V2 et demanderait une conception, une autorisation et un audit distincts.

Deux interfaces peuvent exposer ce mode :

- `workflow_dispatch`, uniquement pour les opérations sans écriture produit si Actions fonctionne ;
- outil local ou CLI pour le travail fonctionnel et, si utile, la reprise des rapports quand Actions est indisponible.

L’outil local réutilise le moteur figé et ses contrôles. La CLI est une interface possible, jamais une obligation pour le commit ou la synchronisation. Le geste Git utilisateur reste extérieur à l’orchestration et est seulement observé après coup.

Le manuel exige que GitHub reste accessible pour lire l’état, écrire le journal canonique et, pour les opérations de rapports concernées, acquérir leur verrou. Il couvre l’indisponibilité d’Actions, du runner ou du bridge de publication, **pas une indisponibilité générale de GitHub**. Si la branche de preuves, le service Git de coordination ou le HEAD distant ne sont pas accessibles et vérifiables, la CLI produit un diagnostic local et l’exécution s’arrête ; aucun effet IA ou applicatif n’est autorisé.

Une panne de la CLI locale ou de l’adaptateur Claude local n’autorise pas un développeur distant. Si un bridge local peut être contourné par l’interface manuelle officielle, cette interface réutilise le même noyau local, ses contrats et ses contrôles ; sinon la tranche s’arrête. Un changement de mode ne rend jamais disponible une capacité absente.

### 9.4 Matrice opération × mode

| Opération | `AUTOMATED` | `MANUAL_CONTROLLED` |
|---|---|---|
| PLAN, revue, gate, diagnostic sans écriture produit | Workflow de lecture/preuves | CLI ou dispatch limité au même rapport, noyau identique |
| IMPLEMENT, CORRECT_IMPLEMENTATION, rollover du développeur | Outil Claude local sous contrôles V2 | Même outil local/noyau ; jamais Actions |
| Commit et push fonctionnels | `Commit/Sync` habituel de l’utilisateur | Identique ; aucune procédure parallèle |
| `REPLAY_SAFE` | Nouvelle tentative explicite | Nouvelle tentative explicite |
| `REPUBLISH_EXISTING` | Sans IA | Sans IA |
| Noyau défaillant | Arrêt conservatoire | Arrêt conservatoire |

---

## 10. Maîtrise de Claude Code

### 10.1 Principe

Claude Code développe exclusivement dans `/Dev` sous les contrôles locaux du protocole. Il modifie et teste les fichiers autorisés, mais ne commite ni ne pousse de manière autonome. Après validation fonctionnelle, l’utilisateur effectue son `Commit/Sync` habituel. Le futur audit Claude, éventuellement distant, reste une analyse sans écriture ni commit. Aucun workflow de développement Claude n’existe.

### 10.1-A Adaptateur Claude qualifié

La première version activable utilise exactement Claude Code `2.1.263`, version auditée. Cette valeur figure dans `engine_ref` et dans l’identité versionnée du bridge local. Toute autre version est refusée avant appel jusqu’à un test de compatibilité borné ; une mise à jour ne réinitialise ni compteur, ni racine, ni budget d’une tranche active.

La sécurité repose sur une **liste positive d’outils**, refus par défaut. L’adaptateur autorise seulement les outils de lecture et de modification nécessaires au périmètre déclaré. Un shell général n’est pas autorisé : chaque commande de test admise et chaque lecture Git admise sont des motifs positifs explicites et versionnés. Sont notamment absents de la liste : `git add`, `git commit`, `git push`, `git merge`, `git rebase`, création/suppression de branche, force-push, accès aux credentials et toute commande permettant un contournement équivalent. Les serveurs MCP sont eux aussi limités à une liste positive ; aucun MCP d’écriture GitHub ou système hors périmètre n’est chargé.

Une instruction présente dans le dépôt (`CLAUDE.md`, règle de livraison ou équivalent) ne peut jamais élargir le périmètre ou les outils accordés par la commande V2. Si elle exige un fichier, un commit ou une publication interdits par la mission, l’adaptateur signale `INSTRUCTION_SCOPE_CONFLICT` et respecte la restriction la plus forte ; il ne crée aucun livrable supplémentaire et ne commite rien.

Les garde-fous effectifs sont fournis et contrôlés par les arguments du processus Claude réellement lancé : version, mode non interactif, format de sortie, plafond de tours, outils autorisés et configuration MCP stricte. Un fichier `--settings` peut compléter la configuration mais ne constitue jamais l’unique mécanisme de sécurité, car son application silencieuse ne peut être présumée. Avant l’appel, le lanceur restitue sa configuration effective normalisée, le noyau la compare au hash `claude_adapter_config_sha256` et refuse toute option absente, inconnue ou ignorée.

L’audit a établi que `--max-turns` est accepté par Claude Code `2.1.263`, bien qu’absent de son aide publique. La V2 l’active donc uniquement avec cette version figée. Son comportement terminal et les champs de résultat restent à confirmer pendant le pilote ; un écart produit un arrêt conservatoire, pas `max_turns=UNENFORCED` implicite.

### 10.2 Budget obligatoire

Toute commande Claude comporte :

- `claude_mode` ;
- `session_id` attendu ou `null` pour une initialisation autorisée ;
- `max_ai_calls`, normalement `1` ;
- `max_turns` ; la valeur initiale est `8` pour `ROLLOVER_COMPACT` avec Claude Code `2.1.263`, à qualifier effectivement pendant le pilote ;
- `max_duration_seconds`, `max_prompt_bytes`, `max_total_prompt_bytes` et `max_rollovers` ;
- taille du prompt ;
- HEAD causal ;
- incrément ;
- heure de début ;
- résultat ou classification d’échec.

Une invocation est un lancement externe de Claude. Un tour est un échange interne mesurable par l’adaptateur. Les plafonds portent séparément sur invocation, tours, durée, taille du prompt et cumul de tranche. Une métrique inaccessible vaut `UNKNOWN` et n’est jamais inventée. Le dépassement d’un plafond arrête l’adaptateur sans fallback.

`BudgetState`, conservé dans le journal avant chaque appel, contient les plafonds et consommations cumulés par tranche, `root_operation_id`, session et tentative. Avant toute émission, l’adaptateur réserve atomiquement **une invocation et les octets de prompt** sous l’exclusion locale et par ajout conditionnel au journal. Il ne réserve un rollover que par `PREPARE_ROLLOVER`. `INITIAL` et `RESUME_DELTA` exigent `rollover_reservation_id=null`. Une nouvelle tentative hérite des consommations ; elle ne recrée jamais le budget. Une réservation d’invocation n’est rendue que si `NOT_SENT` est prouvé.

Les mesures obligatoires pour autoriser l’appel sont : compteur d’invocations, nombre de rollovers, octets du prompt avant envoi et durée murale contrôlée par timeout externe. Si l’une est indisponible ou `UNKNOWN`, l’appel est refusé conservatoirement. Avec la version figée, `max_turns` est obligatoire. Le pilote doit observer son application effective et le terminal `error_max_turns`; en cas d’échec, l’adaptateur s’arrête et aucune configuration `UNENFORCED` n’est activée sans une nouvelle décision utilisateur.

Les seuils `session_massive_prompt_bytes`, `session_max_age`, `max_invocations_per_slice`, `max_invocations_per_root_operation`, `max_rollovers_per_slice` et les timeouts appartiennent à la configuration versionnée et hashée par `engine_ref`. Leur absence produit `BUDGET_CONFIG_MISSING` avant appel.

### 10.3 INITIAL

`INITIAL` est autorisé une fois au début de la tranche. Il reçoit le paquet de contexte compact reconstruit depuis GitHub.

### 10.4 RESUME_DELTA

`RESUME_DELTA` :

- reprend la session unique de tranche ;
- contient uniquement le HEAD, les références causales, la revue et le delta nouveau ;
- ne retransmet pas le PLAN complet ni les documents déjà présents ;
- refuse les marqueurs de paquet complet ;
- ne possède aucun fallback automatique vers `INITIAL`.

### 10.5 `PREPARE_ROLLOVER` et mode Claude `ROLLOVER_COMPACT`

À la suite de `INC-077`, la règle « une tranche = une session » est précisée :

- une tranche possède une session opérationnelle courante ;
- une session démontrée massive, épuisée ou techniquement inutilisable est clôturée ;
- son remplacement nécessite une transition explicite `PREPARE_ROLLOVER` ;
- le même HEAD causal et le même incrément sont conservés ;
- les traces disponibles sont conservées sans être déclarées valides ni restaurables ;
- toute nouvelle exécution part du HEAD GitHub propre autorisé ; aucune restauration automatique de stash ou de worktree local non qualifié n’est permise ;
- la session remplacée est inscrite dans `superseded_session_id` ;
- le nouveau paquet contient le contexte minimal nécessaire, pas l’historique complet ;
- `PREPARE_ROLLOVER` ne lance aucune IA ; il réserve exactement un rollover et prépare la nouvelle session ;
- il crée `rollover_reservation_id` avec les états `RESERVED`, `CONSUMED` ou `RELEASED` ; une répétition idempotente retourne la même réservation ;
- l’appel ultérieur, séparément autorisé, doit référencer cette réservation `RESERVED`, la passe atomiquement à `CONSUMED` et consomme exactement une invocation sans réserver un second rollover ;
- une réservation abandonnée ne passe à `RELEASED` que si aucune invocation liée n’a été envoyée (`NOT_SENT` prouvé) ; sinon elle reste consommée ou bloque en `UNKNOWN` ;
- `INITIAL` et `RESUME_DELTA` ne créent, ne consomment et ne libèrent aucune réservation de rollover ;
- aucun appel de correction additionnel n’est implicite : la sortie de cette invocation est le travail local demandé ; le noyau complète son output après vérification, commit local et push local observé, sans second appel IA ;
- le rollover ne constitue ni un retry automatique ni un appel supplémentaire caché.
- l’autorisation de rollover, son heure, son auteur et le nouveau budget sont portés par le contrat.

### 10.6 Limites

Un HTTP 429, une limite de session ou un token expiré produit `EXTERNAL_LIMIT`. L’utilisateur ayant augmenté son forfait ne constitue jamais une autorisation générale de consommation.

---

## 11. Diagnostics

### 11.1 Format obligatoire

Tout diagnostic contient :

- code stable ;
- étape ;
- cause compréhensible ;
- état attendu ;
- état observé ;
- action automatique interdite ;
- prochaine action recommandée ;
- consommation IA ;
- identité de transition ;
- compteur et état du bridge.

### 11.2 Catalogue minimal

| Code | Signification |
|---|---|
| `KODJO-V2-SCHEMA-INVALID` | Commande ou résultat invalide |
| `KODJO-V2-STATE-MISMATCH` | État attendu différent de l’état reconstruit |
| `KODJO-V2-HEAD-DIVERGED` | HEAD distant divergent |
| `KODJO-V2-INCREMENT-MISMATCH` | Incrément causal incorrect |
| `KODJO-V2-ACTOR-NOT-AUTHORIZED` | Auteur ou rôle non autorisé |
| `KODJO-V2-REVIEWER-NOT-INDEPENDENT` | Reviewer identique au producteur |
| `KODJO-V2-TRANSITION-CLAIMED` | Transition concurrente déjà réclamée |
| `KODJO-V2-DUPLICATE-RESULT` | Résultat terminal équivalent existant |
| `KODJO-V2-OUTPUT-INCOMPLETE` | Sortie IA incomplète ou ambiguë |
| `KODJO-V2-PUBLISH-FAILED` | Sortie conservée mais publication échouée |
| `KODJO-V2-RUNNER-UNAVAILABLE` | Runner indisponible |
| `KODJO-V2-CLAUDE-AUTH` | Authentification Claude invalide |
| `KODJO-V2-CLAUDE-USAGE-LIMIT` | Limite Claude atteinte |
| `KODJO-V2-CLAUDE-SESSION-UNUSABLE` | Session à clôturer ou remplacer explicitement |
| `KODJO-V2-BRIDGE-QUARANTINED` | Deuxième échec causal du bridge |
| `KODJO-V2-CORE-FAILURE` | Noyau commun défaillant ; arrêt conservatoire obligatoire |
| `KODJO-V2-EFFECT-UNKNOWN` | Effet ou consommation IA non réconcilié |
| `KODJO-V2-EVIDENCE-INTEGRITY` | Journal ou paquet canonique altéré/incomplet |
| `KODJO-V2-EVIDENCE-WRITER-ABSENT` | Aucun writer de preuves qualifié : le dépôt durable n'a pas eu lieu et l'activation de V2 reste interdite |
| `KODJO-V2-NO-JOB-OBSERVED` | Aucun job observé dans le délai configuré par le pilote ou la CLI |

Les messages `exit 1`, `baseline`, `skipped` ou une erreur brute ne sont jamais suffisants.

---

## 12. Capitalisation du registre 3.3.1 corrigé

Chaque ligne ci-dessous correspond à un invariant V2 regroupant un ou plusieurs incidents.

| Invariant | Incidents | Traitement V2 | Composant | Test futur | Preuve V2 actuelle |
|---|---|---|---|---|---|
| État durable reconstructible depuis GitHub | 001, 002, 055, 062 | Conservé et simplifié | `github-adapter`, reducer | Reconstruction sans mémoire locale | NON VÉRIFIABLE |
| Qualification E2E avant activation | 002, 022, 059, 071 | Conservé | tests E2E | Tranche factice complète sans métier | NON VÉRIFIABLE |
| Identité, rôle et événement séparés | 003, 004, 023, 029, 030, 042 | Remplacé par enveloppe validée | contracts + GitHub | Bot, utilisateur, tiers et événements voisins | NON VÉRIFIABLE |
| Une causalité produit une sortie | 005, 039, 067, 074 | Renforcé | idempotency | Concurrence et double lancement | NON VÉRIFIABLE |
| Arbitrage causal et reconstructible | 006, 056 | Simplifié | authorization | Autorisation absente, périmée, autre HEAD | NON VÉRIFIABLE |
| Continuité Claude compacte | 007, 008, 011, 012, 072, 073, 077 | Conservé avec rollover explicite | claude-adapter | INITIAL, DELTA, rollover, session épuisée | NON VÉRIFIABLE |
| Préflight de l’exécuteur/auth | 009, 010, 028, 046, 047, 064 | Adapté : poste/superviseur avant Claude local ; runner seulement pour rapports | preflight | Poste, droits, token, config et capacité absents ; runner de revue absent | NON VÉRIFIABLE |
| Sortie IA complète avant gate | 013, 014, 016, 025, 061 | Remplacé par schéma strict | contracts | Vide, tronquée, ambiguë, blocage tardif | NON VÉRIFIABLE |
| Un seul langage protocolaire | 015, 019, 020, 021, 024, 031, 032, 035, 036, 075, 076 | Remplacé architecturalement | moteur TypeScript | Unicode, BOM, CRLF, quotes, valeurs vides | NON VÉRIFIABLE |
| Transformations textuelles littérales sûres | 035, 075, 076, 078 | Renforcé | moteur + outillage documentaire | `$&`, ``$` ``, `$'`, `$n`, YAML final et sentinelles | NON VÉRIFIABLE |
| Chemins Git Unicode sûrs | 017 | Conservé | git-causality | Accents, espaces, caractères Unicode | NON VÉRIFIABLE |
| Travail préservé avant transport | 018, 026, 038, 077 | Renforcé | evidence-store | Sortie/worktree puis panne de publication/quota | NON VÉRIFIABLE |
| Conservation avant contrôles et reprise ciblée | 079 | Introduit en 0.6.3, corrigé en 0.6.5 | delivery + status + workflow d'implémentation | Matrice `T02-PRES-001` à `T02-PRES-018` | PASS en exécution locale ; primitives GitHub vérifiées ; cycle complet NON VÉRIFIABLE |
| Recovery qualifié jusqu’à l’effet final | 022, 038, 039, 042 | Remplacé par trois reprises | recovery | E2E de chaque reprise | NON VÉRIFIABLE |
| API et capacités non supposées | 033, 034, 041, 043 | Simplifié | adaptateurs | Capacité absente et environnement vierge | NON VÉRIFIABLE |
| Incrément propagé bout en bout | 037, 040, 049, 065 | Renforcé | envelope + git-causality | Descendant, divergence, rollback, SHA invalide | NON VÉRIFIABLE |
| Permissions minimales par opération | 042, 060 | Conservé | workflows | Matrice opération/permission | NON VÉRIFIABLE |
| Quota Claude sans contournement | 027, 044, 068, 072, 077 | Renforcé | claude-adapter | 429, reset, travail partiel, rollover | NON VÉRIFIABLE |
| Aucun paramétrage utilisateur pendant la tranche | 045 | Conservé | procédure d’exploitation | E2E sans action technique utilisateur | NON VÉRIFIABLE |
| No-job diagnostiqué | 048 | Remplacé par routage minimal | workflow + diagnostics | Trigger absent ou condition fausse | NON VÉRIFIABLE |
| Aucune écriture avant Gate 1 et préservation Git | 050–054, 063 | Conservé | state-machine + git-causality | Écriture avant autorisation, divergence ou mutation destructive | NON VÉRIFIABLE |
| Bascule de writer réautorisée | 053, 056, 057 | Simplifié | authorization | AUTOMATED vers MANUAL sans gate | NON VÉRIFIABLE |
| Mesure absente non inventée | 058, 072 | Conservé | diagnostics | Métrique absente | NON VÉRIFIABLE |
| Coexistence non ambiguë | 071 | Conservé | version-router | Un événement ne crée qu’un flux actif | NON VÉRIFIABLE |
| Preuves fonctionnelles observables | 066, 069, 070 | Conservé à la frontière revue | review contract | Assertions sur états réellement observés | NON VÉRIFIABLE |

### 12.1 Répétitions que V2 doit empêcher structurellement

| Apprentissage antérieur | Incident ultérieur | Défaut de généralisation V1 | Prévention V2 |
|---|---|---|---|
| 003 | 023, 029, 042 | Transport bot corrigé localement | Adaptateur GitHub unique |
| 004 | 030 | Identité/routage non centralisés | Enveloppe et enum de transition |
| 014, 016 | 037 | Métadonnée perdue dans un autre transport | Incrément obligatoire au niveau racine |
| 015, 019, 020 | 035, 076 | Chaînes multi-interpréteurs persistantes | TypeScript unique |
| 018, 022 | 038 | Reprise conçue après l’incident | Evidence store avant publication |
| 024 | 031 | Sémantique différente selon interpréteur | Tests du moteur réel |
| 034 | 041 | Capacité CLI supposée | Adaptateur et inventaire versionnés |
| 040 | 049 | Invariant non appliqué au nouveau gate | Fonction causale unique |
| 035, 075, 076 | 078 | Remplacement JavaScript non littéral et validation finale absente | Écriture structurée ou remplacement littéral, puis parse et contrôle d’intégrité du fichier final |

---

## 13. Stratégie de tests

### 13.1 Tests unitaires

- états et transitions autorisées/interdites ;
- rôles ;
- canonicalisation et hash ;
- causalité Git ;
- idempotence ;
- claims concurrents ;
- compteur du coupe-circuit ;
- classification des erreurs ;
- normalisation Unicode, BOM et fins de ligne ;
- budget et modes Claude.

### 13.2 Tests de contrats

- schémas nominaux ;
- champs absents, inconnus ou dupliqués ;
- SHA invalide ;
- enum voisin ou suffixé ;
- incrément absent ;
- résultat incomplet ;
- verdict ambigu ;
- reviewer non indépendant ;
- gate visant le mauvais objet.

### 13.3 Fixtures d’incidents

Chaque fixture indique :

- invariant ;
- incidents sources ;
- entrée brute ;
- état GitHub simulé ;
- résultat attendu ;
- consommation IA attendue ;
- statut du bridge attendu.

Plusieurs incidents peuvent partager une fixture lorsque le même invariant les couvre. Aucun incident applicable ne peut disparaître de la traçabilité.

### 13.4 Tests négatifs prioritaires

- deux événements concurrents ;
- commentaire dupliqué ;
- HEAD modifié après Gate 1 ;
- lot 2 revu comme lot 3 ;
- sortie OpenAI `completed` mais sans verdict ;
- 429 Claude après création d’un travail partiel ;
- publication en panne après push local confirmé, sans nouvel appel ni nouveau commit ;
- runner indisponible ;
- deuxième échec puis tentative automatisée supplémentaire ;
- passage manuel avec résultat automatisé déjà existant.
- crash local avant appel, après envoi non acquitté, après réponse, après commit local, après push local non acquitté et après publication ;
- deux producteurs de rapports Actions/CLI : ancien processus/enfant actif interdit la reprise ; certificat et jeton preuves révoqué permettent seulement la reprise du rapport ; message tardif sans effet ;
- deux processus locaux visant `/Dev` : un seul peut modifier/commiter/pousser ; arrêt incertain ou appel UNKNOWN bloque la reprise ;
- tentative distante de commit, branche temporaire applicative, merge ou push via Git/API refusée ; aucune délégation via SSH/runner au poste ;
- token de preuves incapable d’écrire le produit ; ajout de code fonctionnel ou fusion applicative dans l’arbre de preuves refusé ;
- modification locale hors scope, index contenant un fichier étranger ou HEAD divergent : arrêter et expliquer avant de demander le `Commit/Sync` ;
- revue distante d’un HEAD différent du SHA local poussé, faux résultat distant d’écriture et gate pendant travail local incomplet : refus ;
- perte du workspace et expiration d’un artefact Actions, puis republication depuis une machine vierge ;
- journal de preuves modifié, supprimé, dupliqué ou désordonné ;
- branche de preuves refusant un remplacement de chemin canonique ;
- aucune exécution de job après le délai d’observation du pilote ;
- panne du noyau en mode manuel produisant obligatoirement `CORE_FAILURE` ;
- trois lots avec critères alloués/différés et finalisation prématurée refusée ;
- chaînes contenant `$&`, ``$` ``, `$'` et `$n`, suivies d’une validation du fichier final réellement exécuté.
- implémentation produite puis Jest en échec : patch disponible, 862/864 comptabilisés, statut `IMPLEMENTED_WITH_FAILED_CHECKS`, run rouge seulement après upload/commentaire ;
- implémentation produite puis TypeScript en échec : même conservation et `failed_checks=[typescript]` ;
- contrôle de périmètre en échec : delta intégral conservé pour diagnostic, validation bloquée et aucune application automatique ;
- fichier nouvellement créé et non suivi : présent dans `implementation.patch`, dans `modified-files.json`, restauré dans un espace vierge et hash identique ;
- publication du commentaire en échec : artefact accessible, `publication_status=FAILED`, republication sans appel IA ;
- reprise `TARGETED_FIX` : restauration depuis l’artefact source, correction bornée, contrôles concernés relancés, nouvel artefact cumulatif applicable sur le `source_head` initial ;
- tentative de `git commit`, `git push`, écriture de ref ou création de branche fonctionnelle par le workflow distant : refus avant effet ;
- répertoire de livraison ou de téléchargement situé dans la copie de travail : refus `DELIVERY_LOCATION_INVALID` avant toute production, aucun patch fabriqué, statut `IMPLEMENTATION_FAILED` ;
- implantation nominale hors de la copie de travail : le delta ne contient que la modification fonctionnelle, le contrôle de périmètre passe, et la restauration ne crée aucun répertoire de protocole ;
- workflow déclarant un type KODJO, et copie non déclarée présentant la même structure : la première est validée, la seconde est refusée ; un workflow ordinaire ne produit aucun faux positif ;
- adaptateur déclarant un statut structuré : la déclaration prime sur la liaison par code de sortie ;
- demande de dépôt de preuves : branche fixe non paramétrable, chemins append-only uniques, hashes exacts, patch marqué transport et preuve, aucun fichier applicatif, `writer_status=PENDING` et `EVIDENCE_WRITER_ABSENT` ;
- job d'implémentation tentant d'écrire une référence de preuves ou élevant `contents` : refus à la validation structurelle ;
- téléversement de l'artefact de récupération en échec, puis dépôt de secours également en échec : `IMPLEMENTATION_FAILED` avec `RECOVERY_NOT_DURABLE`, aucune coordonnée d'artefact publiée, aucune reprise ciblée annoncée ;
- téléversement initial en échec et dépôt de secours réussi : contrôles exécutés, statut métier normal, artefact effectivement applicable ;
- reprise `TARGETED_FIX` sans artefact de résultat source : l'ensemble des contrôles requis est relancé et la reprise peut converger ;
- adaptateur sortant en `75` après avoir modifié des fichiers : statut `CLARIFICATION_REQUIRED`, delta conservé et déposé ;
- workflow d'implémentation renommé : les règles normatives s'appliquent toujours grâce au type déclaré `KODJO_WORKFLOW_KIND`; une structure KODJO d'implémentation non déclarée est refusée sous `UNDECLARED_KODJO_WORKFLOW`.

### 13.5 Simulations

1. Simulation complète sans IA avec adaptateurs factices.
2. Simulation avec sorties IA nominales factices.
3. Simulation avec sorties invalides et limitations factices.
4. Qualification GitHub de lecture/preuves et permissions ; commits de fixtures fonctionnelles éventuelles uniquement depuis le poste local dans le périmètre isolé.
5. Pilote E2E isolé sur une tranche post-S10.

### 13.6 Critères d’activation

V2 ne peut être activée que si :

- toutes les familles applicables du registre ont un test ;
- tests unitaires et contrats sont `PASS` ;
- simulation complète est `PASS` ;
- republication sans IA est `PASS` ;
- coupe-circuit et quarantaine sont `PASS` ;
- mode manuel est `PASS` ;
- rollover Claude compact est `PASS` ou explicitement exclu de l’activation ;
- coexistence V1/V2 est `PASS` ;
- pilote E2E est `PASS` ;
- toute absence de preuve reste `NON VÉRIFIABLE`.
- acquisition/CAS, terminaison, révocation et concurrence Actions/CLI des rapports sont démontrés sans capacité d’écriture produit ;
- exclusion locale, vérifications avant/après, provenance des commits/pushs et réconciliation locale sont PASS ;
- lecture seule fonctionnelle des identifiants distants et séparation des preuves sont démontrées, y compris branches temporaires/API et contournement par runner ;
- parcours `/Dev → vérification → commit local → push local → observation/revue distante` est PASS ;
- reconstruction et republication depuis une machine vierge sont `PASS` ;
- panne du noyau et arrêt conservatoire sont `PASS` ;
- intégrité de la branche de preuves et détection d’altération sont `PASS`.
- matrice de conservation T02 (Jest, TypeScript, scope, fichier non suivi, commentaire indisponible et reprise ciblée) est `PASS` ;
- aucun chemin d’échec post-modification ne précède la fabrication et la validation du patch ;
- aucun job distant ne dispose d’un droit effectif de commit ou push sur une référence fonctionnelle ;
- aucun chemin d'orchestration n'apparaît dans un delta conservé, et le contrôle de périmètre est exécutable avec un verdict utile ;
- toute implantation d'un répertoire technique dans la copie de travail est refusée avant production ;
- chaque workflow KODJO déclare son type, et toute duplication ou dérivation non déclarée présentant la structure du workflow d'implémentation est refusée ;
- le writer de preuves dédié est implémenté, séparé du job d'implémentation et **qualifié** : branche fixe, chemins append-only, refus de tout remplacement, absence d'autorisation fonctionnelle et absence de fichier applicatif démontrées. Sans cette qualification, le diagnostic `EVIDENCE_WRITER_ABSENT` est actif et **l'activation de V2 est interdite** — aucune décision d'exploitation ne peut lever cette interdiction ;
- une `EvidenceDepositRequest` est produite pour toute livraison récupérable, et son contenu est vérifié : branche fixe, chemins canoniques uniques, hashes exacts, aucun fichier applicatif ;
- un échec du dépôt durable est détecté et ne produit jamais un statut annonçant une récupération possible ;
- une reprise ciblée converge en un nombre borné d'itérations dans tous les scénarios de la matrice T02.

---

## 14. Coexistence et migration

### 14.1 Protection de S10

- S10 conserve `kodjo.slice.v1` ;
- aucun workflow ou manifeste actif de S10 n’est modifié ;
- V2 ne consomme aucun commentaire de l’Issue #42 ;
- aucune qualification V2 n’utilise la branche applicative de S10.

### 14.2 Isolation des événements

- aucune modification de V1 n’est supposée pendant S10 ;
- V2 ne s’abonne pas aux commentaires, Issues, labels, branches ou manifests V1 génériques ;
- V2 n’accepte que des tranches explicitement autorisées dans un registre d’activation V2, sur une Issue V2 dédiée et hors Issue `#42` ;
- les commandes V2 sont fournies par `workflow_dispatch` typé ou par la CLI, jamais par inclusion d’un marqueur dans un commentaire libre ;
- V2 refuse tout événement sans enveloppe V2 valide et sans tranche autorisée ;
- avant activation, tous les consommateurs V1 historiques sont testés avec les stimuli V2 afin de vérifier l’absence d’effet croisé ;
- le test prouve qu’aucun stimulus V2 ne déclenche d’écriture sur l’Issue ou la branche de S10.

### 14.3 Version figée

La tranche référence :

- `protocol_version` ;
- commit exact du moteur ;
- hash des schémas ;
- version Node ;
- lockfile.

Une correction ultérieure crée une nouvelle version applicable seulement à une nouvelle tranche. Une tranche en cours continue ou passe en manuel avec sa version figée.

### 14.4 Activation

Ordre proposé :

1. terminer S10 sous V1 ;
2. rédiger et revoir les artefacts V2 ;
3. implémenter V2 isolément ;
4. qualifier sans code métier ;
5. effectuer un pilote E2E isolé ;
6. activer V2 au début de S11 ou d’une tranche ultérieure ;
7. conserver le manuel comme repli ;
8. archiver V1 après absence de toute tranche active V1.

### 14.5 Retour manuel

Le passage manuel ne constitue pas un rollback de version. Il poursuit la même version figée avec `execution_mode=MANUAL_CONTROLLED`.

---

## 15. Critères d’acceptation de la conception

La conception est prête pour revue indépendante lorsque :

- un seul moteur et un seul langage principal sont définis ;
- trois workflows courts au maximum sont prévus, dont un producteur distant éphémère de patch sans droit de commit/push ;
- trois reprises génériques au maximum sont définies ;
- états et transitions sont non ambigus ;
- auteurs, préconditions, effets et prochaine décision sont définis ;
- contrats communs contiennent version, causalité, HEAD, incrément, auteur, mode et idempotence ;
- le coupe-circuit résiste à une nouvelle tentative ou à un nouvel identifiant ;
- le mode manuel utilise le même moteur ;
- aucun échec de publication ne peut rappeler l’IA ;
- la consommation Claude est explicitement bornée ;
- `INC-077` est couvert par une règle de conservation et de rollover explicite ;
- l’incident T02 est couvert par une barrière de conservation avant contrôles et une reprise `TARGETED_FIX` ;
- chaque invariant applicable du registre a un futur test ;
- V1 et V2 ne peuvent consommer le même événement ;
- aucune migration de S10 n’est requise ;
- les preuves absentes sont indiquées `NON VÉRIFIABLE`.

---

## 16. Arbitrages décidés

### A — Conservation des sorties IA — DÉCIDÉ

| Option | Avantage | Risque |
|---|---|---|
| Artefact GitHub puis commentaire | Simple et natif | Rétention limitée |
| Branche Git de preuves | Durable et diffable | Commits techniques supplémentaires |
| Stockage externe | Durabilité configurable | Nouveau système, secrets et dépendances |

**Décision :** branche Git dédiée aux preuves et au journal. Les commentaires et artefacts Actions sont dérivés ou complémentaires. Le mécanisme de claim reste à qualifier séparément.

**Confirmation `0.6.8`.** Cet arbitrage a été réexaminé à l'occasion du constat `MAJ-03` et **confirmé sans modification**. L'artefact Actions reste une barrière de récupération et un transport ; il n'acquiert jamais le statut de preuve canonique définitive. Le dépôt durable relève d'un writer dédié dont les règles et la qualification obligatoire figurent au §4.5.

### B — Interfaces du mode manuel — DÉCIDÉ

| Option | Avantage | Limite |
|---|---|---|
| `workflow_dispatch` seul | Rapports et gates sans écriture produit | Insuffisant pour développer ; aucune écriture fonctionnelle permise |
| CLI locale seule | Indépendante du bridge Actions | Préflight local indispensable |
| Les deux | CLI pour le produit, interfaces équivalentes pour rapports | Permissions et limites de chaque interface à qualifier |

**Décision :** outil Claude local obligatoire pour modifier le produit ; `Commit/Sync` effectué par l’utilisateur dans son interface habituelle ; `workflow_dispatch` limité aux rapports, preuves et commandes sans écriture produit. Le manuel contourne les bridges, jamais le noyau ; un défaut du noyau impose l’arrêt.

### C — Journal et snapshot — DÉCIDÉ

| Option | Avantage | Limite |
|---|---|---|
| Commentaires structurés seuls | Append-only et lisibles | Reconstruction plus lente |
| Fichier mutable seul | Lecture rapide | Conflits et deuxième vérité |
| Journal + snapshot dérivé | Durable et rapide | Nécessite de prouver la reconstructibilité |

**Décision :** journal structuré sur la branche de preuves, autoritatif ; snapshot dérivé non autoritatif.

### D — Signification exacte de l’indépendance OpenAI — DÉCIDÉ

Options :

1. session/conversation distincte avec rôle reviewer ;
2. modèle distinct ;
3. fournisseur distinct.

**Décision :** nouvelle conversation OpenAI et rôle reviewer distincts comme minimum normatif ; hash exact du livrable obligatoire. Un fournisseur distinct n’est requis que pour l’audit Claude ciblé, pas pour chaque tranche.

---

## 17. Inventaire de transition V1 vers V2

| Élément V1 | Décision cible |
|---|---|
| 7 workflows génériques actuels | Remplacés par 2 workflows V2 de lecture/preuves et l’outil Claude local après clôture V1 |
| Workflows historiques et tests expérimentaux | Archivés après conservation des preuves utiles |
| Parsing de commentaires | Supprimé au profit du JSON validé |
| Ruby dans les gates | Supprimé |
| `jq` dans les workflows | Supprimé |
| Logique PowerShell protocolaire | Supprimée |
| Expressions GitHub complexes | Réduites au routage minimal |
| Manifeste YAML mutable | Remplacé par identité de tranche figée et journal d’événements |
| Reprises spécialisées | Remplacées par trois mécanismes génériques |
| Commentaires humains | Conservés comme vue lisible, non comme langage de commande |
| Registre d’incidents | Conservé comme cahier de non-régression |
| Gates utilisateur | Conservés et renforcés par référence exacte |
| Revue indépendante | Conservée |
| Checkpoints Git | Conservés |

---

## 18. Risques résiduels

| Risque | Traitement | Statut actuel |
|---|---|---|
| Indisponibilité générale de GitHub ou de la coordination Git | Arrêt conservatoire ; aucun mode manuel fonctionnel | NON VÉRIFIABLE |
| Indisponibilité runner de rapports | Diagnostic et reprise du rapport via CLI ; aucun développement déplacé vers Actions | NON VÉRIFIABLE |
| Poste local indisponible ou travail partiel perdu | Arrêt du travail fonctionnel ; diagnostic et conservation des preuves, aucun fallback distant | NON VÉRIFIABLE |
| Commit local non poussé / push non acquitté | Réconciliation du même SHA sous noyau local ; aucun nouvel appel/commit automatique | NON VÉRIFIABLE |
| Droits distants trop larges | Activation interdite tant que commits/branches applicatifs via Git/API ne sont pas empêchés | NON VÉRIFIABLE |
| Authentification OpenAI/Claude | Préflight et arrêt avant appel | NON VÉRIFIABLE |
| Quota Claude | Aucun retry, reprise après reset ou rollover autorisé | NON VÉRIFIABLE |
| Rétention des artefacts | Branche Git de preuves canonique ; artefacts non autoritatifs | NON VÉRIFIABLE |
| `EVIDENCE_WRITER_ABSENT` — aucun writer de preuves qualifié | Writer dédié spécifié au §4.5, huit règles cumulatives ; `EvidenceDepositRequest` produite par le job d'implémentation en lecture seule ; obligations intérimaires de rétention et de récupération | **ACTIVATION DE V2 INTERDITE** tant que le writer n'est pas qualifié |
| Échec du dépôt durable de l'artefact de récupération | Détection par l'issue observée de l'étape, dépôt de secours obligatoire, sinon `IMPLEMENTATION_FAILED` / `RECOVERY_NOT_DURABLE` | PASS en exécution locale |
| Qualité d’une sortie IA valide | Revue indépendante et critères de fond | NON VÉRIFIABLE |
| Concurrence rapports / journal | Claim distant limité, CAS du journal et idempotence | NON VÉRIFIABLE |
| Concurrence locale / HEAD changé | Exclusion locale, validations avant/après et vérification du push ; arrêt sur divergence | NON VÉRIFIABLE |
| Mauvaise qualification du moteur | Activation conditionnée aux tests du même noyau réel local/distant | NON VÉRIFIABLE |
| Complexité réintroduite progressivement | limite normative de composants/workflows | NON VÉRIFIABLE |

---

## 19. Décision de fin de conception et audit technique

### 19.1 Clôture des revues OpenAI

La boucle de revue documentaire OpenAI est close après quatre revues indépendantes/ciblées. Aucune cinquième contre-revue n’est requise. Les choix de la 0.5.0 et les arbitrages locaux des versions 0.6.0/0.6.1 sont retenus par décision utilisateur. Les réserves documentaires antérieures sont indicatives et ne rouvrent plus la conception en l’absence d’une faille critique, concrète et reproductible.

L’audit Claude ciblé 0.6.1 a été réalisé. Il conclut `ACCEPTABLE_WITH_CHANGES`, sans mécanisme indispensable jugé irréalisable. Les quatre changements classés `REQUIRED_BEFORE_PILOT` sont intégrés dans la présente version. Les autres réserves sont qualifiées pendant le pilote ou restent facultatives ; elles ne déclenchent aucune nouvelle boucle documentaire.

### 19.2 Résultat de l’audit Claude ciblé

L’audit a examiné :

- faisabilité de l’adaptateur Claude Code exécuté sur le poste dans /Dev, des modes INITIAL, RESUME_DELTA et ROLLOVER_COMPACT ;
- session, authentification, superviseur/processus enfants locaux, arrêt et appels en vol ;
- contrôles du noyau avant/après modification, préservation vérifiable du worktree et récupération du commit local sans nouvel appel ;
- séparation des outils de modification de Claude et du `Commit/Sync` habituel effectué par l’utilisateur ;
- comptabilité des invocations, prompts, timeout, rollover et capacité réelle de plafonnement des tours ;
- observation/revue après push local et mode manuel utilisant le même noyau.

L’audit n’a identifié aucun blocage d’implémentation. Il a confirmé la faisabilité de `INITIAL`, `RESUME_DELTA`, `ROLLOVER_COMPACT`, de l’authentification locale, des budgets et de la reprise ; supervision, effet `UNKNOWN`, worktree, tours et séparation Git sont faisables avec l’adaptateur borné défini en 0.6.2.

Décision : passage au pilote technique borné. Aucun nouvel audit général n’est requis avant ce pilote.

### 19.3 Traçabilité après correction 0.6.2

| Constat | Correction normative principale | Statut documentaire proposé |
|---|---|---|
| `REV-V2-001` | `REVISION_AUTHORIZED` interne déterministe ; PLAN figé après Gate 1 ; traces complètes | DÉCISION RETENUE |
| `REV-V2-002` | `CausalWorkDescriptor` canonique et table exhaustive famille/cible/héritage | DÉCISION RETENUE |
| `REV-V2-003` | Coordination de rapports limitée, CAS/terminaison conservés ; exclusion locale et aucune promotion distante | Clôture 0.4.0 historique ; portée 0.6.0 à vérifier, preuve technique requise |
| `REV-V2-004` | Séparation opération/tentative/résultat/publication et valeur `UNKNOWN` | CLOS PAR REVUE 0.3.0 — non-régression à contrôler |
| `REV-V2-005` | Branche Git de preuves, brut avant validation, republication machine vierge | CLOS PAR REVUE 0.3.0 — non-régression à contrôler |
| `REV-V2-006` | Outil local pour le produit ; manuel limité aux bridges ; noyau en arrêt conservatoire | CLOS PAR REVUE 0.3.0 — adaptation locale retenue |
| `REV-V2-007` | Compteur et quarantaine sur la racine déterministe du §7.1 | DÉCISION RETENUE |
| `REV-V2-008` | Nouvelle conversation OpenAI, identité de contexte et hash examiné | CLOS PAR REVUE 0.3.0 — non-régression à contrôler |
| `REV-V2-009` | Autorisation liée au writer, environnement, mode, périmètre et HEAD d’entrée | CLOS PAR REVUE 0.2.0 — non-régression à contrôler |
| `REV-V2-010` | Binding unique figé ; exemples qualifiés ; `commit_head` et diagnostics HEAD clarifiés | DÉCISION RETENUE |
| `REV-V2-011` | Allocation ordonnée des critères aux incréments et finalisation exhaustive | CLOS PAR REVUE 0.2.0 — non-régression à contrôler |
| `REV-V2-012` | Départ depuis HEAD GitHub propre ; aucune restauration automatique de stash | CLOS PAR REVUE 0.2.0 — non-régression à contrôler |
| `REV-V2-013` | Réservation et consommation idempotentes du rollover | CLOS PAR REVUE 0.4.0 — audit Claude ultérieur |
| `REV-V2-014` | Registre 3.3.1 corrigé et INC-078/T-051 intégrés | CLOS PAR REVUE 0.2.0 — non-régression à contrôler |
| `REV-V2-015` | Activation positive V2 isolée, sans supposer une capacité nouvelle de V1 | CLOS PAR REVUE 0.3.0 — non-régression à contrôler |
| `REV-V2-016` | Observation no-job par pilote ou CLI, sans quatrième service | CLOS PAR REVUE 0.2.0 — non-régression à contrôler |

Les clôtures acquises décrivent leurs versions sources, jamais une preuve d’exécution. La conception est close. Toute amélioration restante est reportée au pilote, sauf faille critique reproductible. La conformité reste `NON VÉRIFIABLE` avant implémentation et tests, mais le démarrage du pilote est autorisé.

---

## 20. Livrables de la phase d’implémentation future

La phase suivante, désormais autorisée comme pilote technique borné, devra produire exactement :

1. schéma JSON de l’enveloppe ;
2. schémas JSON des charges utiles ;
3. moteur TypeScript unique, exécuté localement pour l’intégration durable et à distance pour lecture, preuves ou fabrication éphémère d’un patch ;
4. catalogue exécutable des diagnostics ;
5. fixtures dérivées du registre ;
6. suites unitaires, contrats, négatives et E2E ;
7. trois workflows courts au maximum : transition, revue OpenAI et implémentation éphémère avec conservation/reprise ;
8. outil local : modification supervisée dans `/Dev` et vérification ; `Commit/Sync` reste le flux utilisateur habituel ;
9. qualification isolée des permissions distantes et observation du HEAD après synchronisation locale, sans commit, push ni écriture de référence fonctionnelle distante ;
10. rapport du pilote ;
11. procédure d’activation d’une nouvelle tranche ;
12. procédure d’archivage V1.

---

## 21. Conclusion normative

La V2 applique un noyau unique au flux `production locale ou éphémère → conservation avant contrôles → restauration/vérification dans /Dev → commit local → push local → observation et revue distantes`. Les workflows et agents distants ne créent ni commit, ni push, ni référence fonctionnelle ; leurs modifications éphémères ne deviennent durables que par application et validation locales. Les preuves restent séparées. Les révisions internes, racines causales et PLAN figé de la 0.5.0 sont conservés.

Sa réussite ne sera pas démontrée par la seule rédaction de ce document. Elle nécessitera que :

- les schémas soient formalisés ;
- le moteur réel soit testé ;
- les incidents soient convertis en fixtures ;
- la republication sans IA soit démontrée ;
- le coupe-circuit et le manuel soient exercés ;
- un pilote E2E isolé soit réussi avant activation.

La version `0.6.11` étend le pilote à l’implémentation locale. L’adaptateur réel est présent, sa configuration effective est hashée, sa version figée, ses outils restreints et ses propriétés de sécurité testées sans consommation IA. Le superviseur vérifie après l’appel l’absence de mutation des références et tout dépassement de périmètre. L’invariant reste strict : aucun agent distant ne modifie le produit et Claude local ne committe ni ne pousse.

La dernière preuve avant activation est l’exécution réelle de cet adaptateur sur le poste `/Dev`, avec authentification OAuth long terme, sur une petite modification fonctionnelle et ses contrôles. Jusqu’à cette preuve E2E unique, l’adaptateur reste **IMPLÉMENTÉ — QUALIFICATION RÉELLE EN ATTENTE**.

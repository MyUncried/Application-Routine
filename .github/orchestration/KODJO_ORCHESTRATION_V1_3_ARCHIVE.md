# KODJO Orchestration V1.3 — archive factuelle

Statut : `ARCHIVED`

Date de clôture : 2026-09-01

Cette archive fige l’état historique de V1.3. Elle ne modifie pas rétroactivement
ses règles et ne constitue pas le protocole V1.4.

## Sources reconstruites

Les documents normatifs et de clôture V1.3 ne sont pas présents sur `main` au
moment de l’archivage. Ils sont conservés sur la branche historique
`feat/creation-seance-catalogue`, au commit
`640f2c91d0a219e88ca010d8feb9e6c181fa4db1` :

- `.github/AI_ORCHESTRATION.md` ;
- `.github/AI_ORCHESTRATION_CONTINUITY.md` ;
- `.github/orchestration/PROTOCOL_EVOLUTION_BACKLOG.md` ;
- `.github/orchestration/T1_T9_CLOSURE_20260829.md` ;
- `CLAUDE.md`, qui importe `docs/AGENTS.md` et les deux documents V1.3.

Sur `main`, `CLAUDE.md` contient uniquement `@AGENTS.md`, tandis que le fichier
`AGENTS.md` correspondant est absent. Cette divergence est enregistrée comme un
fait de reconstruction ; elle n’est pas corrigée dans cette archive car cela
modifierait un autre contrat du dépôt.

## Capacités démontrées

Les preuves durables du test intégré
`KODJO-V13-T1T9-20260829-01` établissent, dans la configuration testée :

- GitHub comme état durable d’orchestration ;
- l’orchestration de plusieurs acteurs avec séparation orchestration / métier ;
- des barrières de sécurité et un écrivain unique explicite ;
- des arbitrages utilisateur durables, reconstructibles, avec A/B/C et
  `C=OTHER` ;
- une question utilisateur comme non-décision ;
- la reprise après certains `ORCHESTRATION_FAILURE` sans rappeler l’IA lorsque
  sa sortie valide existe déjà ;
- le réveil de Work par `pull_request:synchronize` dans la configuration testée,
  avec séparation entre état durable et commit technique de signal ;
- la traçabilité des transitions et la déduplication des décisions/signaux ;
- la mesure de durée, tours et coût Claude lorsque ces métriques étaient
  exposées ;
- la distinction entre échec IA et échec ultérieur de transport, de
  matérialisation ou de publication ;
- l’exécution de la chaîne T1→T9 sans écriture métier T01-S09.

La transition finale T9 est `DÉMONTRÉE`. Le verdict global historique du test
intégré reste `PARTIELLEMENT DÉMONTRÉ` : il ne doit pas être requalifié.

Preuves principales : PR #19, commentaires `5464255963`, `5464534980`,
`5464550997` et verdict canonique `5464561408`; signal final
`db55395a9a1f6b85e35c3a008adfc9ce89ce2dbf`.

## Limite structurante : continuité Claude Cloud

Le micro-test `KODJO-CLAUDE-SESSION-RESUME-01` a produit le résultat suivant :

- BASE réel réussi dans le run `33384761722` ;
- session BASE valide : `1995230a-7b4a-4c7b-ba54-60b0762ad850` ;
- RESUME exécuté dans le run distinct `33387674954` avec
  `--resume 1995230a-7b4a-4c7b-ba54-60b0762ad850` ;
- erreur observée : `No conversation found with session ID...` ;
- aucun `--fork-session`, aucun fallback et aucune session de remplacement ;
- compteur final : `2/2` appels Claude ;
- verdict : continuité native Claude Cloud `NON DÉMONTRÉE`.

Les preuves forensiques sont conservées sur la branche
`test-state/claude-session-resume-01`, sous
`.github/orchestration/state/KODJO-CLAUDE-SESSION-RESUME-01/`, et par les PR
techniques #20 à #28.

Conséquence : un `session_id` seul n’a pas transporté la conversation entre deux
runners GitHub hébergés éphémères. La continuité logique V1.3 fondée sur GitHub,
les checkpoints et les deltas reste utile, mais elle n’est pas une reprise native
de la même session Claude.

## Options Cloud étudiées puis abandonnées

### Agent SDK et SessionStore externe

Le test `KODJO-CLAUDE-SESSION-STORE-RESUME-02` a été préparé dans la PR #29 avec
un backend S3 et n’a pas été exécuté (`0/2`). La PR reste une preuve historique
et ne doit pas être fusionnée dans le produit. Cette piste n’est pas poursuivie :
elle ajoute une infrastructure de persistance, son authentification, sa sécurité
et son exploitation (S3, Redis ou PostgreSQL, par exemple), disproportionnées
pour KODJO.

### Claude Managed Agents

La piste offre des sessions persistantes gérées côté Anthropic, mais requiert une
API et un mode de consommation distincts avec facturation spécifique. Elle est
abandonnée sans expérimentation KODJO.

### Checkpoint + delta Cloud

Cette mécanique a démontré son utilité pour la continuité logique et la reprise
contrôlée. Elle n’est pas retenue comme architecture nominale future, car elle ne
fournit pas la continuité native recherchée.

## Décision architecturale

À la clôture de V1.3, KODJO arrête l’étude de Claude Cloud comme architecture
nominale d’orchestration du développement. La suite de l’étude porte sur Claude
Code exécuté localement, en capitalisant les barrières et preuves utiles de V1.3.

Cette décision ne crée pas encore un protocole V1.4.

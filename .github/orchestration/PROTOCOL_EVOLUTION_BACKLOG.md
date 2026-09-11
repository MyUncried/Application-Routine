# KODJO — backlog d’évolution du protocole

Ce fichier conserve les sujets à étudier ou tester après l’exécution de T01-S09 avec le protocole V1.3 consolidé.

Il n’est pas normatif. Une entrée de ce backlog ne devient une règle du protocole qu’après décision explicite, intégration dans le document normatif concerné et démonstration lorsque la capacité est technique.

Statuts autorisés : `À ÉTUDIER`, `À TESTER`, `DÉMONTRÉ`, `REJETÉ`.

| ID | Besoin | Statut | Évidence / origine | Dépendances | Moment prévu |
|---|---|---|---|---|---|
| PE-01 | Privilégier Claude Local lorsque le poste est disponible, avec Claude Cloud comme fallback contrôlé. | À ÉTUDIER | Besoin exprimé après le test T1→T9 Cloud. | Self-hosted runner ; sélection d’un writer unique ; stratégie de fallback. | Après T01-S09. |
| PE-02 | Installer et tester un GitHub Actions self-hosted runner local permettant une exécution Claude locale automatisée. | À TESTER | Architecture envisagée pour conserver l’automaticité avec Claude Local. | PE-01 ; environnement Windows local ; sécurité des secrets. | Après T01-S09. |
| PE-03 | Garantir qu’un seul writer `LOCAL` ou `CLOUD` est actif pour une transition donnée et qu’une bascule invalide l’autorisation précédente. | À ÉTUDIER | Barrière de concurrence nécessaire à une architecture hybride. | PE-01 ; protocole principal `mode + écrivain`. | Avec le prototype Local/Cloud. |
| PE-04 | Produire un message Work explicite lorsque la chaîne s’arrête en erreur ou nécessite une action utilisateur. | À TESTER | Risque utilisateur de silence indéfini identifié pendant la conception du test. | Transport GitHub→Work ; matérialisation durable de l’échec. | Après T01-S09. |
| PE-05 | Ajouter un watchdog / timeout anti-silence capable de détecter une transition attendue qui ne progresse plus. | À ÉTUDIER | Un workflow qui ne démarre pas ou un runner indisponible ne peut pas toujours publier lui-même son échec. | PE-04 ; définition de délais fondée sur mesures réelles. | Après T01-S09. |
| PE-06 | Tester volontairement un échec contrôlé et vérifier qu’un message d’incident apparaît spontanément dans le même Work sans intervention utilisateur. | À TESTER | Propriété de notification d’échec encore non démontrée. | PE-04 ; éventuellement PE-05. | Après définition du mécanisme d’alerte. |
| PE-07 | Formaliser le handover d’une conversation Work devenue saturée, lente, inaccessible ou remplacée. | À ÉTUDIER | La résilience générale existe dans `AI_ORCHESTRATION_CONTINUITY.md`, mais la procédure opérationnelle de changement de cockpit reste à préciser. | Checkpoint GitHub complet ; nouveau Work ; rattachement du trigger. | Après T01-S09. |
| PE-08 | Reconstruire automatiquement le nouveau cockpit Work depuis GitHub sans dépendre de la mémoire de l’ancienne conversation. | À TESTER | Principe V1.3 de reconstruction depuis GitHub ; scénario de handover à démontrer. | PE-07. | Avec le test de handover. |
| PE-09 | Rattacher et vérifier le trigger GitHub→Work sur le nouveau cockpit après handover. | À TESTER | Une reconstruction du contexte ne suffit pas si les futurs événements réveillent encore l’ancien fil. | PE-07 ; PE-08 ; transport `pull_request:synchronize`. | Avec le test de handover. |
| PE-10 | Adopter une convention humaine de nommage des conversations Work, sans en faire une clé technique de routage. | À ÉTUDIER | Besoin de navigation entre cockpits successifs ; aucun conversation ID exploitable n’a été démontré. | PE-07. | Lors de la formalisation du handover. |
| PE-11 | Mesurer et réduire la latence GitHub→Work. | À ÉTUDIER | Mesures T1→T9 variables, environ 20 s à 55 s selon les réveils observés. | Instrumentation t0/t1/t2/t3 ; transport Work. | Après T01-S09. |
| PE-12 | Réduire l’intrusivité Git des commits techniques utilisés uniquement pour `pull_request:synchronize`. | À ÉTUDIER | `synchronize` est le transport démontré mais nécessite un commit technique. | Signal idempotent ; artefact technique isolé. | Après T01-S09. |
| PE-13 | Éviter que les commits de signal `synchronize` déclenchent des CI sans rapport avec l’orchestration. | À ÉTUDIER | Risque identifié lors des micro-tests ; PR #19 n’avait pas de workflow global concerné. | Filtres paths/branches des workflows. | Avec PE-12. |
| PE-14 | Conserver une mesure distincte des coûts Claude, OpenAI/Work et autres API ; ne jamais assimiler `NON_VERIFIABLE` à zéro. | DÉMONTRÉ | T1→T9 a produit des coûts Claude mesurés séparément et a laissé OpenAI/Work et autres API `NON_VERIFIABLE`. | Instrumentation disponible par acteur. | Continuer sur T01-S09 ; améliorer ensuite si de nouvelles métriques deviennent accessibles. |
| PE-15 | Démontrer une vraie continuité de session Claude entre deux étapes. | À TESTER | T1→T9 : continuité d’une même session Claude `NON DÉMONTRÉE`, les reprises ont créé de nouvelles sessions. | Session ID demandée/retournée ; `--resume` réellement supporté. | Après T01-S09, sauf nécessité plus tôt. |
| PE-16 | Optimiser la reprise après défaut de publication/transport pour réutiliser systématiquement une sortie IA valide sans rappel inutile. | DÉMONTRÉ | Règle intégrée dans `AI_ORCHESTRATION.md` ; reprise T1→T9 après `ORCHESTRATION_FAILURE` sans rappeler INITIAL démontrée. | Publication déterministe ; état durable GitHub. | Maintenir et réutiliser sur T01-S09. |
| PE-17 | Comparer l’efficacité réelle du protocole Cloud V1.3 à l’ancien chemin V1.2 et, plus tard, au chemin Local. | À ÉTUDIER | V1.2 T01-S09 avait montré une reconstruction lourde ; T1→T9 V1.3 a mesuré des appels ciblés. | Données T01-S09 réelle ; puis prototype Local. | Après exécution T01-S09. |
| PE-18 | Requalifier sur Windows réel le verrou propriétaire, le diagnostic courant, `request_id`, les lectures Git et le budget 40 tours de la 0.6.17. | DÉMONTRÉ | Runs #12/#13 ; INC-080 à INC-084 ; T-053 à T-057. | PR protocolaire 0.6.17 ; runner self-hosted Windows ; aucun appel Claude. | Qualifié par le run 34599962140 avant toute nouvelle reprise applicative. |
| PE-19 | Certifier systématiquement les dépendances système et l'état persistant réels avant toute reprise applicative. | DÉMONTRÉ | Run #14 `34602213649` ; INC-085 : T-053 avait mocké le scanner et confondu les Claude VS Code avec Claude KODJO. | T-058 PASS : run `34604146149`, job `103278373498`, artefact `10264893697`, `claude_invoked:false`. | Obligatoire sur chaque PR touchant verrou, reprise, invocation ou diagnostic. |

## Résultats déjà consolidés hors backlog

Les éléments suivants ne sont pas des sujets ouverts de ce backlog : ils sont désormais traités dans les documents normatifs applicables.

- arbitrage durable matérialisé avant sollicitation utilisateur ;
- reconstruction d’un arbitrage indépendamment de la mémoire du tour Work précédent ;
- déduplication des décisions ;
- question pendant arbitrage = non-décision ;
- convention `A / B / C — autre` avec `C/OTHER` définissable immédiatement ou après clarification ;
- transport GitHub Actions → `pull_request:synchronize` → Work démontré dans la configuration testée ;
- séparation état durable / commit technique de signal ;
- reprise après `ORCHESTRATION_FAILURE` sans rappel d’une IA dont la sortie valide existe déjà.

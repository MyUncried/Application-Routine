# KODJO V2 — contrat d'exploitation lean

Version : 0.6.18

## Principe opposable

L'utilisateur intervient uniquement sur les décisions métier. Il ne lui est demandé ni commande PowerShell, ni commande Git, ni SHA, ni chemin local, ni administration du runner.

## Trois portes humaines

1. **Périmètre** — confirmer le besoin, les sources fonctionnelles et les exclusions.
2. **Plan** — accepter, demander une révision ou refuser le plan détaillé.
3. **Résultat** — accepter, demander une correction ou refuser le résultat vérifié.

Les décisions sont exprimées en langage naturel. ChatGPT Protocole les traduit en artefacts GitHub typés et en transitions de protocole.

## Mécanique automatisée

Après autorisation d'implémentation, ChatGPT Protocole crée dans `.github/orchestration/queue/v2/` une demande immuable liée à l'identité de tranche. La demande peut être lancée explicitement par `workflow_dispatch` : le protocole utilise alors le commit courant comme borne `after` et son parent direct comme borne `before`. Une PR technique et sa fusion ne sont plus nécessaires pour produire le signal de lancement.

Le runner Windows :

- utilise son workspace GitHub Actions isolé ; il ne travaille pas dans `C:\Dev` ;
- se positionne sur le `source_head` autorisé ;
- refuse un arbre sale, une identité invalide, une révision divergente ou un périmètre non conforme ;
- exécute Claude une seule fois selon les limites V2 ;
- exécute les contrôles déterministes opposables ;
- ne publie une branche et une PR que si le verdict est `IMPLEMENTED_AND_VERIFIED` ;
- publie un diagnostic technique en cas d'échec, sans demander à l'utilisateur de réparer le protocole.

Le verrou Claude identifie son propriétaire par PID et date de démarrage, ainsi que par le run, la demande et la session. Il n'est remplacé automatiquement qu'après preuve de l'absence du propriétaire ; un état ambigu bloque sans tuer de processus. Chaque diagnostic est lié à `github.run_id` et `github.run_attempt`, y compris avant invocation de Claude. `request_id` reste non nullable de la file aux preuves. Une reprise utilise une invocation au plus. KODJO n’impose aucun plafond arbitraire de tours ; la durée, le périmètre, l’appel unique et les règles de sécurité restent bornés.

## Lancement allégé d’une demande

Une demande de file n’est pas une modification du protocole. Elle est donc soumise à une admission ciblée — ajout unique, `request_id` unique, contrat et autorisations — mais ne déclenche pas la campagne de qualification Linux/Windows réservée aux changements du protocole.

Le lancement explicite ne demande à l’utilisateur ni branche, ni PR, ni fusion, ni SHA. ChatGPT Protocole crée la demande et pilote le déclenchement. Si l’interface GitHub doit exceptionnellement être utilisée, l’unique geste technique admis est `Run workflow` sur `KODJO V2 Lean Queue`, immédiatement après le commit de la demande ; aucune valeur technique n’est à saisir.

Dans le run réel, les contrôles déterministes sont exécutés par le superviseur après Claude. La suite applicative complète n’est exécutée qu’une fois par tentative réelle ; elle n’est pas dupliquée par la qualification préalable d’une PR de transport.

## Responsabilités

| Acteur | Responsabilité |
|---|---|
| Utilisateur | Les trois décisions métier uniquement |
| ChatGPT Conception / documentaire | Sources fonctionnelles et plan détaillé |
| ChatGPT Protocole | Identité, périmètre, transitions, création de la demande, lecture du verdict |
| Claude local | Modification bornée des fichiers autorisés |
| Superviseur Windows | Isolation, contrôles, scellement, branche et PR |
| ChatGPT Développement | Analyse applicative ou correction explicitement demandée ; aucune administration courante du protocole |

## Incidents

Un runner hors ligne est une indisponibilité d'infrastructure, pas une étape utilisateur. Le protocole conserve la demande en file et signale `INFRASTRUCTURE_UNAVAILABLE`. Le service Windows est configuré pour démarrer automatiquement et récupérer les travaux après redémarrage. Une intervention administrateur n'est demandée qu'en maintenance exceptionnelle, séparée de la tranche métier.

Le clone `C:\Dev\Application-routine` reste un espace de consultation/développement humain. Sa synchronisation n'est ni une précondition ni un mécanisme d'exécution du protocole.


## Voie rapide documentaire `DOC_ONLY_FAST_PATH`

### Finalité

`DOC_ONLY_FAST_PATH` autorise ChatGPT Conception / documentaire à livrer de bout en bout une correction documentaire ciblée déjà décidée, sans intervention Git, GitHub ou PowerShell de l’utilisateur. Cette voie constitue l’unique exception contrôlée à l’interdiction des écritures distantes ; elle ne s’étend jamais au code fonctionnel.

### Conditions d’entrée cumulatives

La voie rapide est autorisée uniquement lorsque :

- la décision métier ou la formulation à reporter a déjà été explicitement validée ;
- tous les fichiers à modifier sont des fichiers Markdown `.md` situés sous `docs/` ;
- aucun arbitrage fonctionnel, UX, technique ou de périmètre ne subsiste ;
- le HEAD actuel de `main` est lu et enregistré immédiatement avant la création de la branche.

Si une condition manque, le traitement s’arrête avant toute écriture et demande uniquement l’arbitrage nécessaire.

### Exécution automatique obligatoire

ChatGPT Conception / documentaire réalise lui-même, au moyen des capacités GitHub autorisées :

1. la lecture du HEAD courant de `main` ;
2. la création d’une branche dédiée `docs/<objet-court>` depuis ce HEAD exact ;
3. la modification exclusive des fichiers Markdown autorisés sous `docs/` ;
4. le commit et le push sur cette branche ;
5. la création d’une PR vers `main` ;
6. le contrôle du diff et de la liste exhaustive des fichiers modifiés ;
7. la fusion automatique uniquement si tous les contrôles sont conformes ;
8. la suppression automatique de la branche source après fusion, lorsque la plateforme l’expose directement ou que le dépôt la supprime automatiquement ;
9. la relecture du nouveau HEAD de `main` ;
10. une confirmation finale concise comprenant la PR et le nouveau HEAD.

L’utilisateur ne réalise aucune de ces opérations et ne reçoit aucune commande PowerShell, Git ou GitHub.

### Contrôles opposables avant fusion

La fusion est interdite si l’une des conditions suivantes n’est pas démontrée :

- la base de la PR correspond au HEAD de `main` lu au démarrage, ou le delta intervenu depuis a été revalidé sans contradiction ;
- chaque chemin modifié correspond à `docs/**/*.md` ;
- aucun fichier n’est supprimé ou renommé ;
- le diff correspond exclusivement à la correction explicitement validée ;
- aucun code applicatif, workflow, script, fichier de configuration, artefact protocolaire hors `docs/` ou manifeste historique n’est modifié ;
- la PR est fusionnable sans conflit ;
- les contrôles automatiques applicables sont réussis.

Tout dépassement produit un arrêt `ARBITRAGE_REQUIRED` sans tentative d’élargissement silencieux du périmètre.

### Limites

Cette voie ne peut ni :

- créer ou modifier un comportement applicatif ;
- modifier `.github/workflows/`, `scripts/`, `.github/orchestration/`, les manifestes ou les artefacts d’une tranche ;
- transformer une décision non validée en règle canonique ;
- corriger un échec technique en élargissant le périmètre ;
- utiliser le clone local `C:\\Dev\\Application-routine` comme mécanisme obligatoire de livraison.

Une modification documentaire transverse, ambiguë ou indissociable d’un changement technique revient au processus normal.

### Reprise courte

La demande utilisateur peut être formulée simplement :

`Applique cette correction documentaire validée avec DOC_ONLY_FAST_PATH.`

ChatGPT Conception / documentaire retrouve alors le dépôt, lit `main`, applique la présente procédure et ne revient vers l’utilisateur qu’avec le résultat final ou un véritable arbitrage métier.
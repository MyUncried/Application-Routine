# KODJO V2 — contrat d'exploitation lean

Version : 0.6.13

## Principe opposable

L'utilisateur intervient uniquement sur les décisions métier. Il ne lui est demandé ni commande PowerShell, ni commande Git, ni SHA, ni chemin local, ni administration du runner.

## Trois portes humaines

1. **Périmètre** — confirmer le besoin, les sources fonctionnelles et les exclusions.
2. **Plan** — accepter, demander une révision ou refuser le plan détaillé.
3. **Résultat** — accepter, demander une correction ou refuser le résultat vérifié.

Les décisions sont exprimées en langage naturel. ChatGPT Protocole les traduit en artefacts GitHub typés et en transitions de protocole.

## Mécanique automatisée

Après autorisation d'implémentation, ChatGPT Protocole crée dans `.github/orchestration/queue/v2/` une demande immuable liée à l'identité de tranche. Ce commit est le déclencheur technique.

Le runner Windows :

- utilise son workspace GitHub Actions isolé ; il ne travaille pas dans `C:\Dev` ;
- se positionne sur le `source_head` autorisé ;
- refuse un arbre sale, une identité invalide, une révision divergente ou un périmètre non conforme ;
- exécute Claude une seule fois selon les limites V2 ;
- exécute les contrôles déterministes opposables ;
- ne publie une branche et une PR que si le verdict est `IMPLEMENTED_AND_VERIFIED` ;
- publie un diagnostic technique en cas d'échec, sans demander à l'utilisateur de réparer le protocole.

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

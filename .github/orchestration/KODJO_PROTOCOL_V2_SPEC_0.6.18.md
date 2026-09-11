# KODJO Protocol V2 — spécification normative 0.6.18

Cette version complète et supersède `KODJO_PROTOCOL_V2_SPEC_0.6.17.md` pour la détection de processus et la qualification du runner persistant. Les autres invariants 0.6.17 restent applicables.

## Détection Windows sans auto-correspondance

La commande PowerShell d'inventaire CIM ne contient aucun nom, chemin ou motif permettant d'identifier Claude. Elle retourne uniquement les attributs bruts `ProcessId`, `ParentProcessId`, `CreationDate`, `Name`, `ExecutablePath` et `CommandLine`.

Le filtrage est effectué dans le processus Node superviseur. Le superviseur et ses descendants sont exclus. Une identité Claude positive exige `Name=claude.exe` ou le chemin exact du paquet `@anthropic-ai/claude-code`. Un nom de fichier contenant seulement le mot `claude` ne suffit pas.

Une erreur CIM, une sortie non analysable ou une identité contradictoire reste `AMBIGUOUS`. Aucun processus n'est tué par le protocole.

## Qualification systématique du runner persistant

Toute PR modifiant les workflows Lean, le verrou, la reprise, l'invocation ou les diagnostics doit exécuter T-058 sur le runner `KODJO-LOCAL-RUNNER`, sous Windows PowerShell 5.1, avec son véritable répertoire d'état persistant.

T-058 doit, sans invoquer Claude :

1. inventorier et empreinter le verrou préexistant sans publier son contenu ;
2. prouver l'absence d'auto-correspondance du scanner CIM réel ;
3. refuser et préserver un verrou lorsqu'un processus positif contrôlé est vivant ;
4. acquérir puis libérer le verrou réel uniquement après preuve d'absence de Claude ;
5. vérifier l'absence de verrou résiduel et de processus de test en sortie ;
6. publier un artefact nominatif portant le runner, PowerShell, les états avant/après et `claude_invoked:false`.

Un test mocké reste utile comme test unitaire, mais ne peut plus établir à lui seul le résultat `PASS` d'un invariant dépendant de Windows ou de l'état persistant.

## Admission après qualification

Une reprise applicative n'est autorisée qu'après fusion du correctif et preuve `PASS` de T-058 sur le commit exact de la PR. L'exécution de qualification ne crée aucune demande Lean Queue et ne lance aucune session Claude.

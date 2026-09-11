# KODJO V2 — rapport de changement 0.6.17 → 0.6.18

Origine : run Lean Queue #14 `34602213649`, job `103272027821`, diagnostic `10264104201`.

## Cause démontrée

Le scanner 0.6.17 assimilait tout `claude.exe` au propriétaire possible du verrou KODJO. La première certification réelle, run `34603741701`, job `103277049720`, artefact `10264798262`, a démontré deux Claude légitimes de l'extension VS Code sous `.vscode\\extensions`, étrangers au binaire KODJO installé sous `%APPDATA%\\npm\\node_modules`. Elle a échoué sans modifier le verrou historique vide et sans arrêter ces processus. Le test T-053 simulait la réponse du scanner et ne couvrait pas cette coexistence réelle.

## Correction

- inventaire CIM brut sans motif Claude dans PowerShell ;
- classification dans Node par chemin d'installation KODJO, et non par le seul nom `claude.exe` ;
- observation sans blocage ni arrêt des Claude externes, notamment VS Code ;
- exclusion de l'inspecteur et de ses descendants ;
- suppression du motif générique `claude` ;
- refus conservateur inchangé en cas d'ambiguïté ;
- certification T-058 obligatoire sur le runner Windows persistant réel ;
- artefact de certification sans contenu sensible et avec `claude_invoked:false`.

## Qualification

Le run PR `34604146149` est PASS : job Ubuntu `103278373251`, job Windows PowerShell 5.1 `103278373498`, artefact T-058 `10264893697`.

L'artefact prouve `claude_invoked:false`, deux Claude externes laissés vivants, le verrou historique vide remplacé avec la disposition `LEGACY_STALE_REPLACED`, l'acquisition/libération réelle, le refus avec préservation face au processus KODJO contrôlé et l'absence finale de verrou. La suite complète et le parcours isolé de file sont également PASS.

## Périmètre

Aucun fichier applicatif, plan métier, revue, demande Lean Queue ou comportement fonctionnel n'est modifié. Claude n'est pas invoqué.

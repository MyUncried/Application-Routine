# Rapport de changement KODJO V2 0.6.22

## Objet

Recaler la portée de la certification `RESUME_DELTA`, préparer la certification du parcours ordinaire et ajouter les mesures et règles d'hygiène nécessaires sans retirer aucun contrôle.

## Changements

- plan opposable de campagne `V2-PROD-00`, distinguant scénarios, runs, invocations Claude et publications ;
- correction de l'oracle de reprise : `RESUME_DELTA` invoque Claude une fois avec `--resume` dans le run de reprise ;
- distinction entre refus sûrs sur parcours réel et provocations réservées aux tests déterministes ;
- séparation de PE-22 entre qualification jetable, parcours ordinaire et transport `retry_of_run_id` ;
- suppression de `max_turns` dans l'exemple canonique ;
- normalisation progressive des preuves JSON UTF-8 sans BOM ;
- contrat explicite du pathspec en mode supervisé ;
- instrumentation non bloquante du checkout, de `npm ci`, de Claude et du stockage ;
- nettoyage borné du checkout ordinaire après préservation.

## Non-changements

- aucun plafond de tours ;
- durée Claude maximale 3 600 secondes et workflow 90 minutes conservés ;
- suite complète toujours bloquante avant publication ;
- aucun cache de `node_modules` ;
- aucune sélection ciblée activée ;
- aucune tranche applicative ni PR jetable lancée par cette version.


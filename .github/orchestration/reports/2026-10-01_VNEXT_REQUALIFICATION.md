# Nouvelle campagne jetable INITIAL puis REVISION

Demande utilisateur explicite du 1er octobre 2026 : « donc on rejoue maintenant Initial et revision avec ce nouveau protocole. »

Campagne : `06f35a5b-db9c-4448-ab28-c7b778cba368`. Base exacte : `e703a68823a3c090b518714b194dfbb3a51809d1`.

Les exécutions acquises restent PASS et leurs preuves/demandes consommées sont préservées. Cette campagne utilisera de nouveaux dossiers, sessions, gates réels et UUID de transport générés après réservation. Aucune ancienne demande ne sera rejouée.

Raccordement minimal : le superviseur INITIAL conserve son tuple historique pour le contrôle anti-rejeu et accepte un nouveau tuple uniquement avec une identité de campagne UUID v4 et des ancres distinctes. Le message exact, sa réaction réelle, la qualification GitHub et la consommation atomique restent obligatoires. L’admission exige INITIAL/count 0/limit 1 ; une REVISION ne peut pas se substituer à INITIAL. Le préparateur remplace uniquement la ligne de la tranche jetable après validation du bootstrap précédent ; toutes les autres activations restent inchangées.

Déroulement : préparation et vraie revue INITIAL, publication du dossier, qualification exacte Linux/Windows, vraie approbation déléguée sur message exact, exécution INITIAL et preuves ; puis benchmark négatif REVISION, vraie revue REVISE, une correction causale, vraie revue APPROVE et outcome RESOLVED count 1/limit 1 ; nouveau transport/gate, qualification exacte, exécution REVISION et preuves. Le HEAD reste stable pendant chaque phase.

FINAL, activation/cutover, fusion et PRE-1 restent hors périmètre. Aucun verdict, réaction ou résultat n’est anticipé.

## Préparation INITIAL réelle

Run 36916159035 SUCCESS ; nouvelle revue APPROVE, session `bb719f88-f175-4cd6-aa03-c7d6ce0f654c`. Artefact 11191289600 téléchargé et SHA256 vérifié : `17e02c27d15e962c4d4ef386eefecc667841a624178ec5063cc4197d27d95284`.

Réservation réelle `issue_comment:5940186046`, transport UUID neuf `b2af3723-0ce8-4f7f-8488-cf4498eb9d92`. La réservation ne vaut pas approbation. Le dossier est publié pour qualification exacte ; aucun runtime n’a encore été exécuté dans cette campagne. Preuves : `.github/orchestration/vnext12/VNEXT-12-QUALIF/requalification/06f35a5b-db9c-4448-ab28-c7b778cba368/initial/preparation-evidence.json`.

# Nouvelle campagne jetable INITIAL puis REVISION

Demande utilisateur explicite du 1er octobre 2026 : « donc on rejoue maintenant Initial et revision avec ce nouveau protocole. »

Campagne : `06f35a5b-db9c-4448-ab28-c7b778cba368`. Base exacte : `e703a68823a3c090b518714b194dfbb3a51809d1`.

Les exécutions acquises restent PASS et leurs preuves/demandes consommées sont préservées. Cette campagne utilisera de nouveaux dossiers, sessions, gates réels et UUID de transport générés après réservation. Aucune ancienne demande ne sera rejouée.

Raccordement minimal : le superviseur INITIAL conserve son tuple historique pour le contrôle anti-rejeu et accepte un nouveau tuple uniquement avec une identité de campagne UUID v4 et des ancres distinctes. Le message exact, sa réaction réelle, la qualification GitHub et la consommation atomique restent obligatoires. L’admission exige INITIAL/count 0/limit 1 ; une REVISION ne peut pas se substituer à INITIAL. Le préparateur remplace uniquement la ligne de la tranche jetable après validation du bootstrap précédent ; toutes les autres activations restent inchangées.

Déroulement : préparation et vraie revue INITIAL, publication du dossier, qualification exacte Linux/Windows, vraie approbation déléguée sur message exact, exécution INITIAL et preuves ; puis benchmark négatif REVISION, vraie revue REVISE, une correction causale, vraie revue APPROVE et outcome RESOLVED count 1/limit 1 ; nouveau transport/gate, qualification exacte, exécution REVISION et preuves. Le HEAD reste stable pendant chaque phase.

FINAL, activation/cutover, fusion et PRE-1 restent hors périmètre. Aucun verdict, réaction ou résultat n’est anticipé.

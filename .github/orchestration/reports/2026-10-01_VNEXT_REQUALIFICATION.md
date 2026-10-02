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

## Admission INITIAL du dossier exact

Qualification réelle du candidat `0e95e9deb18c0a8226df114773d63b2589e57395` : run [36924310800](https://github.com/MyUncried/Application-Routine/actions/runs/36924310800), quatre jobs Linux/Windows SUCCESS. Message du [gate 5940186046](https://github.com/MyUncried/Application-Routine/pull/269#issuecomment-5940186046) exact, cible `e601b5db91a198c26c24b7390a20e4088bb8720be1082254c4014fb6b4cb3ac6`, réaction réelle `430241739` de MyUncried sous délégation technique Codex, aucune revue humaine revendiquée. Admission réelle AUTHORIZED. Demande EXECUTE_INITIAL avec UUID frais `b2af3723-0ce8-4f7f-8488-cf4498eb9d92` ; aucun PASS runtime déclaré avant les preuves.

## INITIAL réellement PASS

[Run 36930459022](https://github.com/MyUncried/Application-Routine/actions/runs/36930459022), job 110598428318 terminé à 22:32:02 UTC le 1 octobre 2026. Session Claude réelle `f6571f37-d20c-437e-8253-e995c923e738`. value() observé 2, exactement core.js + core.test.js modifiés, keep.js intact. Jest 1257/1257, TypeScript et lint PASS. Refus réels avant Claude pour autorisation/preuve absente, consommation atomique vérifiée et cleanup confirmé. Artefact 11197084650 SHA256 `9815cde44fb2e74d7e07187d509eb2e4cf01dd988842cf8ed93efb2d17359862` conservé intégralement avec empreintes de tous ses membres. UUID consommé interdit de rejeu.

PREPARE_REVISION demandé sur le même code du protocole. Le problème de commande Claude en arrière-plan n’a pas fait échouer INITIAL ; cela ne prouve pas sa prévention. Correctif préventif à traiter après cette campagne avec validation ciblée, sans rejouer INITIAL. Aucun FINAL, cutover, fusion ni changement applicatif durable.

## Préparation REVISION réelle approuvée

Run 36936098221, job 110620831497 : REVISE session `f3d2f9ad-3b55-4d75-8287-34ac717fc5c9`, une correction causale vers 2, APPROVE session `963200fd-8221-44b7-a33e-a7e2badce137`, RESOLVED borné 1/1. Artefact 11199998426 SHA256 `2cf9b28784654f6088507107046276d0f2e79004cc5573661a65888c669a58cb` conservé intégralement. Nouveau gate réservé `issue_comment:5948929682`, UUID frais `3287a592-43f8-4e77-a7d6-f414a1061f70`. Aucune approbation propriétaire ni exécution revendiquée à ce stade. QUALIFY_ONLY avant lancement.

Correctifs post-campagne convenus : attente Claude (V2 c6bda99c / run 36932540055 ; preuve comportementale et test statique, environnement effectif non journalisé), réduction des archives complètes en préservant celles référencées, publication Routine Dev explicite (V2 8c5650f0 / run 36938795033 ; automatisation non livrée). Rapport source V2 au commit e719214b : `.github/orchestration/reports/2026-10-02_V2_ORCHESTRATION_FIXES_FOR_VNEXT.md`. Aucune modification de ces chemins pendant la qualification en cours.

## Fresh REVISION admission — 2026-10-02

Exact candidate `cb9c45800a9b62342db684cc42b087a288c18ccf` qualified by run [36988943451](https://github.com/MyUncried/Application-Routine/actions/runs/36988943451), all four Linux/Windows qualification and historical jobs SUCCESS. Full pilot 36988943435 and drivers 36988943442 SUCCESS. Actual gate [5948929682](https://github.com/MyUncried/Application-Routine/pull/269#issuecomment-5948929682) updated to exact approval message; actual owner account reaction 430648379 under user technical delegation, human_review_performed=false. Fresh request `3287a592-43f8-4e77-a7d6-f414a1061f70`; target `e0502768e7880c5f7fec39daf32994390f9ef391cab759d35b6b2adf3bddd880`. Admission AUTHORIZED, REVISION RESOLVED 1/1. EXECUTE_REVISION requested; no runtime PASS declared. No protocol code changes in this handoff.

## Fresh campaign complete — 2026-10-02

INITIAL PASS run 36930459022 and REVISION PASS [36994408231](https://github.com/MyUncried/Application-Routine/actions/runs/36994408231). Actual REVISION Claude session `4390fed1-3cc5-4e4b-84ae-a32873815fa7`, value 2, exact core.js/core.test.js delta, keep.js intact, Jest 1257/1257, TypeScript/lint PASS, cleanup verified. Atomic consumption tag `d0b762fbe53f9b99efa0304cb87bfeacd07a26f3` verified against GitHub. Request 3287a592-43f8-4e77-a7d6-f414a1061f70 must never be replayed. Raw artifact 11222807464 SHA256 `641f822a8bc88a72f4525c54a1c627c2469541c06de09f8be49a956819ec42ee` and all member hashes preserved. Controller qualification 36994408177 and full pilot 36994408183 SUCCESS. VNext admission planning_mode REVISION/RESOLVED 1/1; the legacy adapter INITIAL label means fresh implementation session, not reuse of the old INITIAL approval. No FINAL or application publication.

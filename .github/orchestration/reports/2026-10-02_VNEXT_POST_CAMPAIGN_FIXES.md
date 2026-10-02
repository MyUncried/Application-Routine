# VNext — correctifs après campagne réelle

Mission : appliquer trois corrections techniques autorisées sans rejouer la campagne INITIAL/REVISION ni modifier une tranche applicative.

Branche : `protocol/vnext-proof-stability-20260930`, PR #269. Départ exact : `340d7e858e48b7995f9e2a8a078cc0d6782b2dcf`.

## Preuve préalable conservée

La campagne fraîche est terminée : INITIAL PASS 36930459022 et REVISION PASS [36994408231](https://github.com/MyUncried/Application-Routine/actions/runs/36994408231). REVISION : session réelle `4390fed1-3cc5-4e4b-84ae-a32873815fa7`, admission REVISION/RESOLVED 1/1, value=2, exactement core.js/core.test.js, keep.js intact, Jest 1257/1257, TypeScript/lint PASS, nettoyage confirmé. Archive 11222807464 SHA256 `641f822a8bc88a72f4525c54a1c627c2469541c06de09f8be49a956819ec42ee` et empreintes de chaque membre publiées dans le checkpoint précédent. La demande `3287a592-43f8-4e77-a7d6-f414a1061f70` est consommée et ne doit jamais être rejouée.

## Modifications limitées

| Correction | Fichier | Comportement livré |
|---|---|---|
| Contrôles au premier plan | `scripts/kodjo/run-local-claude.js` | Désactivation du background Claude et délai Bash par défaut/plafond 900000 ms (15 min). Valeurs fixées après environnement hérité et dans le settings JSON passé à Claude ; trois valeurs non secrètes journalisées avant lancement. Limite globale de session inchangée. |
| Archives sources redondantes | `.github/workflows/kodjo-v2-pilot-tests.yml` | Plus de snapshot complet sur chaque PR. Option booléenne `preserve_complete_source`, désactivée par défaut, disponible en workflow_dispatch pour récupération explicite. Même nom exact HEAD, contrôle checkout et SHA256. Aucun artefact acquis supprimé ; preuves runtime, patchs et packages de récupération inchangés. |
| Publication Routine Dev explicite | `.github/workflows/kodjo-routine-dev-environment-sync.yml` | Ajout workflow_dispatch avec run et tentative de revue obligatoires ; même identité dans run-name, concurrency et resolver. Entrées via variables d’environnement citées, sans interpolation de texte utilisateur dans le shell. Resolver existant exige toujours vraie revue SUCCESS/APPROVE, commentaire unique lié à la tentative et HEAD applicatif exact. |

Les exact blob OID des deux workflows et de l’adapter gelé modifiés sont actualisés dans `KODJO_VNEXT_REMOTE_WRITE_POLICY.json`. Toutes les autres lignes de politique restent identiques. Aucun test historique modifié ; 420 sujets/protections et preuves acquises préservés.

## Causes et limites

Les réglages foreground reprennent le correctif V2 c6bda99c dont le run 36932540055 est SUCCESS après trois échecs de vérifications placées en arrière-plan. Son environnement enfant n’était pas journalisé. Le présent correctif journalise les valeurs transmises, sans affirmer qu’un log du lanceur est une observation interne de Claude. Documentation officielle vérifiée le 2026-10-02 : https://code.claude.com/docs/en/env-vars et https://code.claude.com/docs/en/settings. Une stratégie ou configuration administrée prioritaire demeure extérieure au protocole ; aucune garantie universelle de non-récurrence n’est revendiquée.

La dernière preuve runtime REVISION pèse 224698 octets ; l’archive complète de la précédente CI pesait 12785036 octets. Le gain porte sur les snapshots complets répétés, pas sur une promesse de taille constante ni sur la suppression des preuves indispensables.

Publication explicite issue du correctif V2 8c5650f0, publication réelle 36938795033. Rapport source : https://github.com/MyUncried/Application-Routine/blob/main/.github/orchestration/reports/2026-10-02_V2_ORCHESTRATION_FIXES_FOR_VNEXT.md. L’automatisation après une revue lancée par queue n’est pas ajoutée ni prétendue vérifiée. Le workflow existant garde son checkout des outils sur main ; aucune mise en production, fusion ou publication EAS n’est réalisée dans cette mission. Les correctifs sont livrés sur la branche protocole et doivent suivre son processus ultérieur de promotion.

## Vérification

- 77 tests ciblés PASS, 0 FAIL : 5 nouveaux contrôles, suite des sidecars/revue et du registre d’incidents, adapter Claude et runner Windows.
- Un véritable processus Node enfant observe les trois valeurs transmises malgré un environnement parent contradictoire. Ce test vérifie le transport d’environnement du lanceur, pas une nouvelle session Claude réelle.
- Les deux guards d’archive sont évalués sur PR, dispatch false et dispatch true ; l’option ne change aucun gate d’exécution.
- Entrées de sync invalides refusées avant accès GitHub ; les tests de revue existants conservent les refus de tentative différente, verdict REVISE, bot absent, commentaire ambigu, fork et mauvais workflow.
- Validation préalable de l’arbre exact (YAML indépendant, invariants exécutables, politique writers, correspondance historique) requise avant publication.
- Qualification CI Linux/Windows du nouveau candidat exact à collecter. Aucune nouvelle exécution INITIAL/REVISION ni revue humaine revendiquée.

## Hors périmètre / clôture

PRE-1, contrôle appareil réel, FINAL, activation, cutover, fusion et publication applicative restent hors périmètre. Aucun package applicatif ni dépendance supplémentaire. Fichiers traités : adapter, deux workflows, politique writers, nouveau test ciblé, checkpoint et présent rapport. Commit final : SHA du commit contenant ce rapport (GitHub). État Git de livraison : arbre candidat vérifié ; résultats CI à compléter dans un checkpoint documentaire après retour réel.

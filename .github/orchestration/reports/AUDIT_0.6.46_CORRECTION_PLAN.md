# Correction bornée de l’audit 0.6.46

Source exclusive : Audit_KODJO_V2_0.6.46_f3ba2e69.md, rapport final du 19 septembre 2026.
Baseline distante vérifiée avant modification : f3ba2e69efbf5ef3aa455062daaeb71110a3f3ef.
Ce plan précède toute modification de code. Aucun état, gate ou périmètre applicatif nouveau. Aucune fusion autorisée.

| Ordre | Défaut | Correction minimale prévue / fichiers | Invariant | Non-régression | Risque |
|---|---|---|---|---|---|
| 1 | F01 | Restaurer le bloc tronqué de kodjo-slice-finalize.yml, test du PowerShell embarqué | I4 | Parse natif et contrats V2/legacy | Élevé : clôture |
| 2 | F02 | Rendre exclusives les conditions IMPLEMENT/VISUAL_CORRECTION dans kodjo-slice-implementation-review.yml | I2/I4 | Table de sélection des steps | Moyen : routage |
| 3 | F14 | Refuser NON_VERIFIABLE device en review selon N40, verify-ui-implementation-review.js | I3/I4 | Statuts PASS/FAIL/PENDING_DEVICE/NON_VERIFIABLE | Moyen : review |
| 4 | F06 | Cohérence, complétude et applicabilité dans preflight-contract.js et verify-preflight-attestation.js ; fixtures/tests préflight | I3/I5 | Contre-exemples audit et chemins légitimes | Élevé : admission |
| 5 | F08 | Sélection bornée puis agrégation, verify-queue-admission.js et Lean Queue ; conserver admission complète par défaut | I1/I5 | Défauts multiples, autorisation toujours requise avant mutation | Élevé : contrôles déplacés |
| 6 | F09 | Préserver directement l’attestation d’échec dans kodjo-v2-lean-queue.yml | I1/I3 | Chemin upload après échec, sans runtime Claude | Faible |
| 7 | F07 | Actualiser PR/ref avant mutation, agent et push ; runtime/runner/live-target/finalizer | I5 | Changement de cible entre phases ; HEAD local autorisé distinct du remote attendu | Élevé : races/refus indus |
| 8 | F03 | YAML du sidecar Dev valide et garde de syntaxe dans qualification | I3 | Parse indépendant ; ancien contre-exemple rejeté | Faible |
| 9 | F04 | Applicabilité strictement booléenne, deux sidecars | I5 | true/false/null/absent/vide/types invalides | Moyen : publication |
| 10 | F05 | Événement de fin de review observé latéralement, lien exact au run/commentaire ; sidecar/resolver/producteur/tests | I5 | Run étranger/échoué, commentaire non lié, dédoublement | Élevé : event chain |
| 11 | F11 | Aucun statut de check autre que PASS ne compte comme réussi, lib/status.js | I3 | Table audit, conservation des patches et statuts existants | Moyen |
| 12 | F12 | Acheminer la sortie IMPLEMENT existante vers la contre-vérification indépendante ; ne pas inventer un gate runtime que N39 ne prescrit pas | I1/I4 | Rapport absent/incomplet visible au reviewer, legacy/delta préservés | Moyen |
| 13 | F13 | Actualiser PACKAGE_MANIFEST, test des références normatives | I1/I2 | Héritage normatif et versions exactes | Faible |

F10 réservé : la politique de consommation durable entre runs est explicitement classée À CLARIFIER en G1 du rapport. Aucun mécanisme de consommation nouveau sans décision.
Les points NON VÉRIFIABLE et la preuve humaine détaillée (G2) restent hors correction.

Après chaque lot : tests ciblés. À la fin : suite pilote et seconde passe distincte cherchant anciennes formulations, raccords, conditions et fixtures contradictoires. Une preuve locale/simulée n’est pas un E2E distant. La PR restera non fusionnée.

## Complément autorisé — décisions D1/D2 du 19 septembre 2026

Plan établi avant les modifications complémentaires, HEAD distant de départ `cee4a9117ec5b8ecbf05740817453babe5c71bcc`.
Les réserves F10/G1 et G2 ci-dessus sont historiques et remplacées uniquement par D1/D2 explicites.

| Ordre | Défaut/décision | Fichiers prévus | Correction minimale / invariant | Test de non-régression | Risque |
|---|---|---|---|---|---|
| 1 | F10 / D1 | nouveau `scripts/kodjo/consume-queue-request.js`, `run-queued-request.ps1`, `verify-queue-admission.js`, test `audit-consumption.pilot.js` | Création atomique d'une référence Git distante par request_id vers une preuve de consommation, après préflight et avant checkout/exécution. Pas de mise à jour de main ; registre historique conservé. Une consommation n'est jamais libérée, même en cas d'échec. Reprise par nouvel ID causal selon contrat existant. I5 | Deux processus/runs distincts attempt=1 sur même ID : une seule admission à l'exécution ; concurrence, API indisponible/réponse perdue, redémarrage, ID différent, registre historique. | Élevé : fail-closed peut consommer sans exécution si interruption ; reprise explicite obligatoire. Aucune promesse d'exécution réussie exactly-once après crash. |
| 2 | D2 / F14 | tests `ui-e2e-finalization.pilot.js`, consignes de review et spécification 0.6.46 ; code seulement si écart démontré | VISUAL_APPROVED ne satisfait que les preuves humaines/device requises par le plan courant. Maintien des contrôles techniques, scope et préservation indépendants. I3/I4 | Approbation humaine présente mais technique FAIL/NON_VERIFIABLE/PENDING_DEVICE, critère non conforme, frontière non PASS, mauvais HEAD/review : refus. | Faible si compatibilité confirmée ; aucun changement de canal/gate humain. |
| 3 | F12 | `lib/implementation-contract.js`, `collect-implementation-report.js`, nouveau validateur de rapport, `verify-ui-implementation-review.js`, workflow de review, tests rapport/runner | Consommer la complétude du rapport par criterion_id et les sept champs exigés ; omissions/duplications/arrêt absent rendent la preuve NON_VERIFIABLE dans la revue existante. Diagnostic sans nouveau stop runtime. Définir un encodage JSON du bloc exigé, ne pas inventer de statut. I1/I4 | Sorties sans bloc, incomplètes, critères absents/dupliqués, marqueur absent, tronquées, mauvaise identité : jamais APPROVE ; cas complet permis mais pas assimilé à une preuve sémantique réelle. | Moyen : anciens rapports non structurés restent explicitement non vérifiables automatiquement, aucun faux succès. |

Après chaque lot : tests ciblés. Puis seconde passe distincte des anciens libellés/branchements/fixtures, suite Linux et Windows sur le HEAD publié. Aucune campagne E2E complète, aucun Claude/EAS/device, aucune fusion. Le jugement réel d'un reviewer sur un développement réel reste NON VÉRIFIABLE si non exécuté ; les tests simulés seront désignés comme tels.

### Raccord F12 identifié pendant la seconde passe (avant correction)

Le workflow charge son validateur après le checkout applicatif : un HEAD applicatif antérieur peut remplacer le consommateur corrigé par son ancienne version. Correction minimale prévue dans `kodjo-slice-implementation-review.yml` : figer seulement le validateur et ses trois dépendances avant ce checkout, pour IMPLEMENT uniquement. Invariant I1/I4 : la preuve est consommée par le validateur protocolaire courant. Test `audit-report-consumption.pilot.js` : dépendances autonomes, ancien validateur applicatif volontairement divergent, consumer figé toujours opérant. Risque limité aux paths du script ; conditions legacy/delta conservées. Nouvelle qualification Linux/Windows sur le HEAD résultant.

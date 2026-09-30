# PR250 — correction des chemins runtime après audit indépendant

## Preuves de départ

HEAD candidat vérifié : `48531a9574857c4296d3baf11be751b73a648f48`. Qualification `36645216503` SUCCESS : Linux 773 PASS / 0 FAIL / 1 SKIP ; Windows 770 PASS / 0 FAIL / 4 SKIP. Préflight Windows archivé, HEAD exact, 1256 tests applicatifs PASS, TypeScript/lint PASS, nettoyage PASS.

Audit `36645216443` publié avec REVISE, commentaire `5901445229`, rapport Git `a482978eead212b46a76d3af51120959e4fc6834`, SHA256 du rapport intégral `f540b179d1735ae84691bf2bf2a55f747fc43649584ace1cbf01aa52dbb2b495`, contrôlé après lecture. Deux blocages, deux majeurs, cinq mineurs. Le succès technique du run est la preuve de publication, pas une approbation.

## Cause et corrections

Les scripts passaient dans le checkout protocolaire complet. Après checkout d'un ancien HEAD applicatif, trois appels cherchaient encore de nouveaux scripts dans cet arbre ancien. La vérification précédente des dépendances figées du reviewer ne couvrait pas la reprise et la clôture.

| Finding | Correction et preuve ciblée |
|---|---|
| IA-001 BLOCKING | `decide-plan-review-retry.js` figé dans les deux reviewers avant checkout applicatif ; invocation via RUNNER_TEMP. Les CLI RETRY et USER_VALIDATION sont exécutées depuis une application sans scripts protocolaires. |
| IA-002 BLOCKING | `inventory-closure-artifacts.js` et `lib/artifact-policy.js` figés avant checkout final. Transformateur de clôture et inventaire exécutés depuis une application sans scripts protocolaires. |
| IA-003 MAJOR | Préflight de budget dans le job d'audit avant Claude ; échec d'inventaire ou quota atteint bloque. Transport obligatoire inchangé. Test quota atteint et ordre réel des étapes YAML. |
| IA-004 MAJOR | Manifeste complété pour les entrées normatives et scripts référencés par les workflows V2. En-tête de matrice actualisé : entrée exécutable du candidat, #252 incorporée mais ouverte, aucun HEAD implicitement certifié. Oracle de couverture du manifeste. |
| IA-005 MINOR | Identités historiques v2 conservées uniquement en consommation d'un contrat embarqué ; génération contrôle les identités. Test consume accepté / produce refusé pour IDs positionnels. |
| IA-006 MINOR | Héritage non-UI comparé après normalisation des champs opposables et preuves triées. Ordre des clés et métadonnées optionnelles ne provoquent pas de dérive ; changement d'évidence refusé. |
| IA-007 MINOR | Fallback fonctionnel réservé à la classe historique v1 sans contrat d'exigences, exposée comme HISTORICAL_V1_ONLY ; nouvelles productions restent v3, provenance/approuvation toujours contrôlée en amont. Pour tout plan contractuel, absence de preuve exacte ⇒ NON_VERIFIABLE, jamais PASS via Jest global. Test négatif ; fixtures positives fournissent les bindings exacts. |
| IA-008 MINOR | Réconciliation du scope en prose couvre assets et extensions non JS/TS ; tests négatifs SVG/JSON/MD. |
| IA-009 MINOR | Cible PLAN bloquante générique refusée ; exception précise NON_UI_COVERAGE conservée. Prompts de revue demandent des cibles PATH/REQUIREMENT_ID/CRITERION_ID exactes pour les autres corrections. |

## Limites conservées

Le contrôle de quota lit l'inventaire et applique le seuil existant ; il ne réserve pas de capacité et ne garantit pas la disponibilité du service d'upload. Les tests de runtime exécutent les CLI figées et contrôlent l'ordre et les chemins du YAML réel ; ils ne prétendent pas réaliser la transition distante GitHub ni une exécution device. PowerShell natif et qualification GitHub restent requis au nouveau HEAD.

Pas d'élargissement aux mécanismes PARTIAL de la matrice, pas de dispense de finding, pas de changement applicatif, pas de nouvel abonné issue_comment, pas de nouvelle capacité d'écriture. Aucun ancien run relancé.

## État de livraison

21 tests dédiés PASS. YAML indépendant, validateur de workflows et scanner des writers PASS. Les tests complets locaux et la qualification distante sont consignés dans la description de PR avec leurs preuves exactes. Cette correction nécessite une nouvelle qualification et un nouvel audit sur son propre HEAD ; aucun verdict APPROVE n'est revendiqué.

PR252 reste ouverte jusqu'au traitement final de PR250. PRE-1 reste issue #249, baseline `e216294506bed87dd80855937e3fabfbfa322b82`, PLAN_OUTPUT `5874870872`, revue causale REVISE `5878031654`. Aucun nouveau plan ni lancement PRE-1 dans ce lot.

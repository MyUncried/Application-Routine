# KODJO — Audit de déterminisme du protocole — planification, développement et tests

Date : 2026-09-29  
Périmètre audité : pipeline KODJO V2 de planification, revue de plan, génération de Lean Request, développement local supervisé, contrôles et revue d’implémentation.  
Référence runtime active auditée : `main=6ba8262cc7f3ae0b1217bb7449d81649759b873b`.  
Correctif en attente pris en compte séparément : PR #252, HEAD `3226adb3ee0d69a579ea03567f7e12a8a766ccf3`, non fusionnée au moment de l’audit.

Cet audit ne modifie pas le runtime actif et ne qualifie pas les autres domaines du protocole hors périmètre demandé.

Matrice opérationnelle associée : `.github/orchestration/reports/2026-09-29_PROTOCOL_DETERMINISM_MATRIX.md`.

## 1. Méthode

Chaque sous-étape est classée selon sa nature actuelle :

- `DETERMINISTIC` : résultat dérivé mécaniquement d’entrées immuables et vérifiables ;
- `MODEL_ASSISTED` : une IA produit une décision sémantique ou une synthèse ;
- `HUMAN_DECISION` : une décision produit ou un gate humain est requis.

Statuts d’audit :

- `CONFORME` : la déterminisation utile est déjà en place ;
- `PARTIELLEMENT CONFORME` : certains faits sont mécanisés mais une sortie calculable reste confiée au modèle ;
- `NON CONFORME` : une donnée ou une décision calculable dépend encore d’une génération/interprétation libre ;
- `NON VÉRIFIABLE` : l’évidence disponible ne permet pas de conclure ;
- `À CLARIFIER` : une décision de conception est nécessaire.

Principe directeur retenu pour les corrections :

1. supprimer la cause par déterminisation lorsque le résultat est calculable ;
2. valider mécaniquement avant les étapes coûteuses ;
3. réserver l’auto-correction bornée aux résidus ;
4. solliciter l’utilisateur uniquement pour un arbitrage réellement ouvert.

## 2. Synthèse exécutive

Le protocole possède déjà une base déterministe solide pour les identités Git, les gates, le scope, le rejeu d’impact, les autorisations, la détection des fichiers modifiés, l’exécution finale des checks et l’héritage des critères UI non affectés.

La principale non-détermination résiduelle se concentre dans quatre zones :

1. **la création du contrat de plan** : les racines de modification, les identifiants de critères, certains chemins de tests et les exigences non-UI restent largement produits par le modèle ;
2. **la révision après REVISE** : #251 borne désormais la base causale, mais les constats de revue restent essentiellement en prose libre ;
3. **le contrat d’implémentation non-UI** : contrairement à l’UI, les exigences fonctionnelles/techniques ne disposent pas encore d’identifiants et d’un contrat machine complet ;
4. **la preuve d’implémentation** : plusieurs faits calculables sont encore auto-déclarés par Claude puis réinterprétés par le reviewer, alors qu’ils pourraient être calculés directement depuis le diff, le graphe de dépendances et les logs de checks.

Conclusion : la prochaine évolution doit tendre vers un **contrat de requirements unifié, structuré et versionné**, dont les identités, chemins, relations, tests et preuves calculables sont assemblés mécaniquement ; l’IA ne doit plus produire que les classifications ou interprétations réellement sémantiques.

---

# 3. PLANIFICATION

| ID | Sous-étape | Nature actuelle | Statut | Évidence actuelle | Élément à déterminiser | Correction recommandée | Priorité |
|---|---|---|---|---|---|---|---|
| P-01 | Identité de tranche, source_head, bootstrap, registre, sources produit | DETERMINISTIC | CONFORME | Gates des workflows `kodjo-v2-slice-initial-plan.yml` et `kodjo-v2-slice-plan.yml` | Aucun changement majeur | Conserver les contrôles exacts Git/SHA/registry ; ne pas les redemander au modèle | P0-conserver |
| P-02 | Sélection initiale de `modified_modules` | MODEL_ASSISTED | PARTIELLEMENT CONFORME | Le draft INITIAL demande au modèle les chemins exacts `MODIFY/CREATE` | Identité des chemins existants ; univers des emplacements CREATE admissibles | Construire d’abord un inventaire Git exact + candidats architecturaux ; faire choisir/classer le modèle sur des identités fournies, jamais recopier librement un chemin existant | P0 |
| P-03 | Validation `MODIFY existe / CREATE absent` | DETERMINISTIC mais tardive | PARTIELLEMENT CONFORME | `scanDirectImporters()` refuse un MODIFY absent et un CREATE déjà présent, après le premier appel IA | Validation avant traitement coûteux ; casse/Unicode/path exact | Exécuter la validation immédiatement après réception structurée du draft, avant scan complet/finalisation ; pour CREATE vérifier aussi emplacement autorisé | P0 |
| P-04 | Classification des candidats d’impact INITIAL | MODEL_ASSISTED | NON CONFORME sur main ; correction préparée | Sur main, la réponse finale contient encore une liste `decisions[{path,...}]` que le modèle recopie ; PRE-1 a produit `INITIAL_PLAN_DECISION_CARDINALITY` | Clés exactes du scan | PR #252 remplace la recopie libre par des propriétés obligatoires construites depuis `scan.candidates` et reconstruit mécaniquement la liste ordonnée. À fusionner seulement après qualification | P0 — déjà préparé |
| P-05 | Graphe direct d’imports et candidats | DETERMINISTIC | CONFORME avec réserve de couverture | `scripts/kodjo/lib/plan-impact.js` calcule les importeurs directs au HEAD et leur type TEST/CONSUMER | Pas une non-détermination ; couverture technique à renforcer séparément | À terme, préférer résolution TypeScript/AST/tsconfig à des regex pour aliases, re-exports et cas syntaxiques complexes ; ne pas confondre déterminisme et exhaustivité | P2 |
| P-06 | Assemblage `scope_allow` | DETERMINISTIC | CONFORME | `scope_allow = MODIFY ∪ TEST_MUST_ADAPT`, vérifié au rejeu | Aucun | Conserver comme source unique de scope ; interdire toute liste parallèle en prose non réconciliée | P0-conserver |
| P-07 | Matrice UI : structure, couverture et relations de preuve | Mixte | PARTIELLEMENT CONFORME | Le validateur impose schema, couverture de chaque UI path, proof types, preservation, scope | `criterion_id`, squelette des cibles, proof mapping calculable, candidats composants | Générer mécaniquement l’identité des critères et le squelette depuis requirements + scope ; dériver `proof_required` des risk types ; fournir au modèle seulement requirement sémantique, risk classification et choix REUSE/EXTEND/CREATE lorsque non calculables | P0 |
| P-08 | Identité des critères UI | MODEL_ASSISTED | NON CONFORME | `criterion_id` est fourni librement par le modèle sous contrainte de format | Identifiant stable | Dériver l’ID depuis un requirement ID normatif ou, à défaut, un hash canonique `source.path + locator + requirement`; le modèle ne choisit plus l’identité | P0 |
| P-09 | Contrat de tests du plan | Mixte | PARTIELLEMENT CONFORME | Les tests impactés existants peuvent provenir du scan ; le modèle doit aussi nommer les nouveaux tests dans la section Tests et dans les critères UI | Identité des tests existants, CREATE/MODIFY, association critère→test, commande/proof | Introduire un `test_contract` structuré : tests impactés existants dérivés du graphe ; nouveaux tests sous emplacements autorisés ; binding requirement/criterion → test path → proof type ; prose rendue mécaniquement | P0 |
| P-10 | Exigences non-UI | MODEL_ASSISTED / prose | NON CONFORME | Le plan non-UI ne possède pas de criterion IDs machine ; la revue d’implémentation ré-énumère ensuite les exigences depuis la prose | Inventaire canonique des exigences fonctionnelles/techniques | Généraliser le contrat de critères à **toutes** les exigences : `requirement_id`, source/locator, nature, change_targets, tests, proof_required, preserve/forbidden, dépendances. L’UI devient une spécialisation, pas l’unique contrat structuré | P0 critique |
| P-11 | Construction du plan final Markdown | Mixte | PARTIELLEMENT CONFORME | Le modèle produit `plan_markdown`, puis le protocole injecte/reconcilie plusieurs blocs machine | Ordre, sections, scope, tests obligatoires, blocs machine | Faire du JSON structuré la représentation canonique ; rendre le Markdown mécaniquement depuis le contrat. Le modèle fournit les champs sémantiques, pas la mise en forme ni les listes calculables | P1 |
| P-12 | Statut `READY / CLARIFICATION_REQUIRED` | MODEL_ASSISTED puis contrôlé | PARTIELLEMENT CONFORME | Le modèle retourne `plan_status`; des clarifications existent aussi dans les classifications | Statut final | Dériver le statut mécaniquement : toute classification/requirement bloquante => CLARIFICATION_REQUIRED ; sinon READY. Le modèle peut signaler une ambiguïté mais ne décide pas du statut agrégé | P1 |
| P-13 | Revue indépendante : checks calculables | DETERMINISTIC + MODEL_ASSISTED | PARTIELLEMENT CONFORME | Rejeu scan, plan contract et UI contract sont déjà exécutés avant Claude ; Claude reçoit encore des consignes de revérifier migration safety, compatibilité, couverture et scope | Tout contrôle mécaniquement démontrable | Étendre le paquet de preuves déterministes : invariants migrations/hash, interdictions de chemins, test bindings, preservation structurée. Le reviewer ne juge plus que complétude sémantique, pertinence architecturale et ambiguïtés non calculables | P1 |
| P-14 | Findings de revue `REVISE` | MODEL_ASSISTED / prose | NON CONFORME | Le verdict est structuré mais les constats bloquants restent dans le texte libre du reviewer | Identité, cible et périmètre causal de chaque finding | Sortie structurée : `finding_id`, catégorie, requirement/criterion/path ciblé, diagnostic, correction attendue, `dependency_expansion_required`, preuve. La révision consomme cette liste fermée | P0 critique |
| P-15 | Révision après `REVISE` | Mixte | PARTIELLEMENT CONFORME | #251 sélectionne le dernier PLAN_OUTPUT INITIAL + sa revue REVISE et impose la préservation des éléments non contestés | Delta exact à rouvrir | Combiner #251 avec P-14 : calculer mécaniquement la liste des requirements/paths/criteria à rouvrir ; rendre les autres blocs immuables pendant la correction ; toute extension exige une dépendance explicitement prouvée | P0 |
| P-16 | Verdict de revue de plan | MODEL_ASSISTED | À conserver comme MODEL_ASSISTED, mais agrégat partiellement calculable | Claude conclut APPROVE/REVISE après les validateurs | Agrégation des findings bloquants | Le reviewer produit des findings sémantiques structurés ; le verdict final est dérivé mécaniquement : finding bloquant ou clarification => REVISE, sinon APPROVE | P1 |

## 3.1 Ce qui doit rester MODEL_ASSISTED en planification

La déterminisation ne doit pas déplacer artificiellement des décisions réellement sémantiques dans du code. Restent légitimement MODEL_ASSISTED :

- interpréter une exigence métier ou UX non structurée ;
- décider si un consommateur direct doit réellement évoluer lorsque l’import seul ne suffit pas ;
- choisir entre REUSE / EXTEND / CREATE lorsque plusieurs solutions sont techniquement valides ;
- identifier une dépendance causale non exprimable par le graphe statique ;
- évaluer la complétude conceptuelle d’un plan face aux sources normatives.

En revanche, le modèle ne doit jamais choisir librement une identité déjà calculable : chemin Git, clé de candidat, ordre d’un ensemble, criterion ID dérivable, scope, hash, statut agrégé ou liste de preuves mécaniquement imposée.

---

# 4. DÉVELOPPEMENT / TESTS / REVUE D’IMPLÉMENTATION

| ID | Sous-étape | Nature actuelle | Statut | Évidence actuelle | Élément à déterminiser | Correction recommandée | Priorité |
|---|---|---|---|---|---|---|---|
| D-01 | Génération Lean Request depuis plan approuvé | DETERMINISTIC | CONFORME | `generate-approved-plan-lean-request.js` dérive scope, checks, bindings plan/revue/gate | Aucun majeur | Conserver ; enrichir plus tard avec requirements/test contract sans saisie libre | P0-conserver |
| D-02 | Scope de mutation | DETERMINISTIC | CONFORME | Scope exact opposable, mutation runner borné, contrôle avant/après, delta fingerprint | Aucun | Conserver comme barrière indépendante de l’IA | P0-conserver |
| D-03 | Décomposition du travail d’implémentation | MODEL_ASSISTED | PARTIELLEMENT CONFORME | Claude lit mission + plan et choisit ordre, fichiers/symboles et stratégie dans le scope | Work items issus du plan structuré | Générer une liste ordonnée de work items depuis requirements/criteria et dépendances ; Claude choisit l’implémentation interne, pas l’inventaire des obligations | P0 |
| D-04 | REUSE / EXTEND / CREATE | MODEL_ASSISTED puis revue IA | PARTIELLEMENT CONFORME | Le plan porte la décision, la mission l’impose, mais la conformité réelle est surtout interprétée par le reviewer | Binding composant ↔ chemin/export/symbole | Pour REUSE/EXTEND, enregistrer le composant sélectionné avec path/export symbol ; vérifier import/usage ou modification par analyse statique. Pour CREATE, vérifier absent avant / présent après sur cible autorisée | P0 |
| D-05 | PRESERVE / FORBIDDEN | MODEL_ASSISTED + diff | NON CONFORME pour la partie sémantique | Les entrées de preservation ont surtout `target + justification`, puis le reviewer retourne PASS/FAIL | Localisateur machine du boundary et invariant testable | Structurer chaque boundary : path, optional symbol/locator, invariant type/hash/absence/change prohibition. Produire automatiquement PASS/FAIL quand calculable ; réserver NON_VERIFIABLE au non-calculable | P0 critique |
| D-06 | Rapport `KODJO_IMPLEMENTATION_CONFORMANCE` | MODEL_ASSISTED / auto-déclaré | NON CONFORME | Claude déclare `files_or_symbols`, `tests_run`, `component_used`, `proof_status`, etc.; le parser vérifie surtout présence/forme | Fichiers réellement modifiés, tests réellement exécutés, preuve de check, composant importé/étendu | Générer mécaniquement la majeure partie du rapport depuis Git + runner + contrat. Claude ne fournit que notes sémantiques et justification résiduelle. Interdire qu’un fait calculable repose sur l’auto-déclaration de l’agent | P0 critique |
| D-07 | Exécution finale Jest / TypeScript / lint / scope | DETERMINISTIC | CONFORME | `run-local-claude.js` exécute les checks de la request après mutation ; la revue relance npm test, tsc et lint sur le HEAD exact | Aucun pour le verdict final | Conserver la double barrière si souhaitée ; les résultats runner deviennent la seule source de vérité pour les preuves correspondantes | P0-conserver |
| D-08 | Boucle de checks pendant l’appel Claude | MODEL_ASSISTED | PARTIELLEMENT CONFORME | Le prompt demande à Claude de lancer/corriger/rejouer les checks jusqu’au succès ou blocage | Ordre nominal des checks et diagnostics de reprise | Option recommandée : laisser les checks interactifs comme aide non autorisante, mais faire piloter la convergence canonique par le superviseur : mutation → checks fixes → failure set structuré → éventuel RESUME_DELTA borné | P1 |
| D-09 | Sélection des checks à rejouer en correction | DETERMINISTIC mais grossière | PARTIELLEMENT CONFORME | `resolveChecksToRerun` utilise une matrice fixe et ajoute toujours scope | Impact précis des modifications depuis la correction | Dériver l’ensemble minimal depuis failed_checks + type de fichiers modifiés + test contract ; conserver une requalification complète finale avant approbation | P2 |
| D-10 | Association requirement/criterion → preuve FUNCTIONAL_TEST | MODEL_ASSISTED | NON CONFORME | Le reviewer reçoit tests/diff et déclare PASS/FAIL ; les logs globaux prouvent que Jest a passé mais pas nécessairement le binding précis | Test exécuté, résultat, critère couvert | Capturer résultats Jest machine-readable par test ; joindre chaque test contract à un criterion/requirement ; produire automatiquement proof_result FUNCTIONAL_TEST | P0 |
| D-11 | Preuve STATIC_ANALYSIS | MODEL_ASSISTED pour l’attribution ; exécution déterministe | PARTIELLEMENT CONFORME | tsc/lint/diff-check sont exécutés mécaniquement mais le reviewer remplit encore les proof_results | PASS/FAIL et evidence structurée | Construire automatiquement proof_result STATIC_ANALYSIS depuis les jobs exacts et le HEAD ; le reviewer n’a plus à réinterpréter un exit code | P0 |
| D-12 | Critères UI AFFECTED / INHERITED | DETERMINISTIC | CONFORME | `verify-ui-implementation-review.js` détermine AFFECTED par intersection changed files / targets/tests et impose copie exacte des INHERITED | Aucun majeur | Conserver ; améliorer éventuellement au niveau symbole après structuration des locators | P0-conserver |
| D-13 | Review non-UI | MODEL_ASSISTED / reconstruction depuis prose | NON CONFORME | Pour `ui_applicable=false`, le reviewer doit lui-même « enumerate every functional acceptance requirement » depuis le plan | Inventaire des requirements et leur identité | Supprimer cette reconstruction : consommer le même requirement contract structuré que la planification et l’implémentation. Chaque requirement apparaît exactement une fois dans la revue | P0 critique |
| D-14 | Verdict d’implémentation | MODEL_ASSISTED puis cohérence validée | PARTIELLEMENT CONFORME | Le modèle renvoie verdict + statuses ; le validateur refuse un verdict incohérent avec les statuts | Verdict agrégé | Ne plus demander `verdict` au modèle : le calculer depuis statuses/proofs/boundaries. Idem pour `device_gate_required`, déjà calculé dans l’input | P1 |
| D-15 | VISUAL_COMPARE / DEVICE_CHECK | HUMAN_DECISION / device evidence | CONFORME | Le reviewer automatisé ne peut jamais retourner PASS ; il laisse PENDING_DEVICE sauf FAIL démontré | Aucun | Conserver le gate humain/device ; ne pas chercher à le « déterminiser » artificiellement | P0-conserver |
| D-16 | ACCESSIBILITY_CHECK | Mixte | PARTIELLEMENT CONFORME | PASS peut être automatisé si preuve déterministe suffisante, sinon PENDING_DEVICE | Sous-contrôles statiques accessibles au code | Séparer la preuve en assertions atomiques : statique calculable vs runtime assistive technology/device. Agréger ensuite mécaniquement | P1 |
| D-17 | Stop statuses d’implémentation | MODEL_ASSISTED | PARTIELLEMENT CONFORME | Claude émet `KODJO_STOP_STATUS`; le superviseur valide la valeur | Causes observables de blocage | Déduire automatiquement les stops lorsqu’un mécanisme du protocole les constate : tentative hors scope → SCOPE_EXPANSION_REQUIRED ; mutation interdite/composant absent si preuve structurée ; conserver CLARIFICATION_REQUIRED/CHANGE_REQUEST_REQUIRED pour les arbitrages sémantiques | P1 |
| D-18 | Correction après tests/revue | MODEL_ASSISTED | PARTIELLEMENT CONFORME | Diagnostics existent, reprise bornée possible, mais le delta de correction n’est pas toujours dérivé d’un ensemble structuré de findings/failed proofs | Exact set des critères/paths/tests à rouvrir | Réutiliser le même modèle que P-14/P-15 : findings structurés + dépendances démontrées → liste fermée de work items de correction → revalidation complète | P0 |

---

# 5. CIBLE DE CONTRAT DÉTERMINISTE

Le levier principal est d’éviter plusieurs contrats parallèles (`plan prose`, `UI matrix`, `implementation report`, `review prose`) qui réinterprètent la même exigence.

La cible proposée est un contrat versionné unique de type :

```text
Normative sources + Git HEAD
→ REQUIREMENT SET déterministe
→ classification sémantique bornée
→ PLAN CONTRACT
→ Lean Request
→ IMPLEMENTATION WORK ITEMS
→ actual diff + actual checks
→ IMPLEMENTATION EVIDENCE
→ independent semantic assessment
→ verdict agrégé mécaniquement
```

Chaque requirement doit, lorsque pertinent, porter au minimum :

- `requirement_id` stable ;
- source normative : path + locator + texte/empreinte ;
- type : FUNCTIONAL / DATA / UI / TECHNICAL / MIGRATION / PRESERVATION ;
- `change_targets` exacts ;
- dépendances directes calculées ;
- décision sémantique requise ou non ;
- tests existants impactés ;
- tests CREATE requis ;
- `proof_required` ;
- boundaries PRESERVE/FORBIDDEN machine-addressables ;
- état de clarification ;
- état de revue ;
- état d’implémentation ;
- preuves réelles issues des runners.

Les agrégats suivants deviennent entièrement mécaniques :

- `scope_allow` ;
- `plan_status` ;
- `device_gate_required` ;
- liste des work items ;
- liste des checks/tests contractuels ;
- AFFECTED / INHERITED ;
- FUNCTIONAL_TEST / STATIC_ANALYSIS proof status lorsque les résultats sont disponibles ;
- verdict final APPROVE / REVISE à partir des statuts élémentaires.

---

# 6. ORDRE DE MISE EN ŒUVRE RECOMMANDÉ

## P0 — avant d’étendre le protocole à de nouvelles tranches complexes

1. **Finaliser #252** : lier les classifications INITIAL aux chemins exacts du scan.
2. **Créer le requirement contract unifié UI + non-UI** avec IDs déterministes.
3. **Structurer les findings de revue** et dériver mécaniquement le delta à rouvrir après REVISE.
4. **Structurer le test contract** et lier test path → requirement/criterion → proof.
5. **Rendre PRESERVE/FORBIDDEN machine-addressables**.
6. **Remplacer l’auto-déclaration de preuves calculables dans le rapport d’implémentation** par une synthèse mécanique Git/runner.
7. **Faire consommer à la revue d’implémentation les mêmes requirement IDs**, y compris non-UI.

## P1 — convergence et réduction des appels inutiles

8. Dériver automatiquement plan_status, verdict plan et verdict implémentation depuis les états élémentaires.
9. Piloter la boucle correction/tests par le superviseur avec failure set structuré, l’appel IA restant borné aux corrections.
10. Produire le Markdown de plan et les rapports humains depuis les contrats structurés.
11. Atomiser ACCESSIBILITY en preuves statiques et device.

## P2 — robustesse technique complémentaire

12. Remplacer progressivement le scan regex d’imports par une résolution TypeScript/AST tenant compte de tsconfig/aliases/re-exports.
13. Affiner la sélection de checks ciblés pour les corrections, tout en conservant la requalification finale complète.

---

# 7. CONCLUSION D’AUDIT

Statut global — planification : **PARTIELLEMENT CONFORME**.

La causalité, les identités Git, le scope et le rejeu sont robustes. La non-détermination restante vient surtout de la création libre d’identités et de listes par le modèle, ainsi que de la coexistence d’un contrat UI structuré avec un plan non-UI encore principalement narratif.

Statut global — développement/tests : **PARTIELLEMENT CONFORME**.

Les mutations sont fortement bornées et les checks finaux sont déterministes. En revanche, la décomposition des obligations, la preuve d’implémentation, les boundaries sémantiques et surtout la revue non-UI reposent encore trop sur l’auto-déclaration ou la réinterprétation IA.

Le prochain saut de déterminisme ne nécessite pas davantage de retries. Il nécessite de **transformer les exigences, findings, tests et preuves en identités et relations machine stables**, puis de réserver l’IA à ce qui ne peut réellement pas être dérivé.

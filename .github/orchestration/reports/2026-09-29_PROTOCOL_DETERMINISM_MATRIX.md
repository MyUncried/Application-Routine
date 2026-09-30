# KODJO — Matrice de déterminisation du protocole

Date : 2026-09-29
Source d’audit : `.github/orchestration/reports/2026-09-29_PROTOCOL_DETERMINISM_AUDIT.md`
Baseline historique de conception : `6ba8262cc7f3ae0b1217bb7449d81649759b873b`.
Base fusionnée observée lors du dernier audit : `5ea680c53b6ff035c1afa126273c80c64e1e7eed`.
Le correctif INITIAL de PR #252 est incorporé dans le candidat #250 ; #252 reste ouverte jusqu'au traitement final de #250.

Cette matrice est une entrée normative exécutable du candidat #250 : ses 64 identités et priorités sont consommées par le vérificateur d'audit et le manifeste de classification. Elle ne certifie aucun HEAD. La qualification et le verdict sont liés aux SHA exacts dans les preuves GitHub ; le dernier audit du HEAD `48531a9` est REVISE.

## Légende

**Nature**
- `DETERMINISTIC` : résultat calculé mécaniquement à partir d’entrées opposables.
- `MODEL_ASSISTED` : interprétation ou classification sémantique confiée à l’IA.
- `HUMAN_DECISION` : décision utilisateur/device réellement nécessaire.

**Déterminisation**
- `OUI` : le résultat cible peut être dérivé mécaniquement.
- `PARTIELLE` : seuls certains champs doivent devenir mécaniques.
- `NON` : conserver une décision sémantique ou humaine.

**Effort**
- `S` : faible, contrat/assemblage local.
- `M` : moyen, plusieurs scripts/workflows/tests.
- `L` : structurant, contrat transversal et migration progressive.

---

# 1. Planification / revue de plan

| ID | Étape | Entrées actuelles | Résultat actuel | Nature actuelle | Source de non-détermination | Déterminisation | Mécanisme cible | Rôle IA résiduel | Gate humain | Effort | Risque de changement | Preuve de qualification attendue | Priorité |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P-01 | Admission tranche / bootstrap / source HEAD | Issue, bootstrap, registry, SHA Git | identité et contexte immuables | DETERMINISTIC | — | NON | conserver validations Git/SHA/registry | aucun | non | S | Faible | tests positifs/négatifs identité, SHA, activation | P0-conserver |
| P-02 | Construction des racines `modified_modules` | sources normatives, code, mission | chemins MODIFY/CREATE | MODEL_ASSISTED | le modèle inventorie et recopie librement les paths | PARTIELLE | fournir inventaire Git exact + candidats CREATE autorisés ; sortie par clés fermées | décider quels modules doivent réellement changer/créer | non | L | Élevé | aucun MODIFY hors inventaire ; aucun CREATE sur fichier existant ; scénario besoin réel non pré-listé traité explicitement | P0 |
| P-03 | Validation MODIFY/CREATE | `modified_modules`, Git HEAD | accept/refus paths | DETERMINISTIC mais tardive | contrôle après appel IA coûteux | OUI | déplacer validation immédiatement après draft structuré | aucun | non | S | Faible | fichier absent/casse/Unicode/CREATE existant bloqués avant finalisation | P0 |
| P-04 | Clés des classifications de candidats INITIAL | `scan.candidates` | décisions path + classification | MODEL_ASSISTED sur main | recopie libre des paths par le modèle | OUI pour clés ; NON pour sémantique | schéma dynamique fermé construit depuis les candidats ; assemblage mécanique | classer impact réel | non | S | Faible | cardinalité et ordre strictement égaux au scan ; chemins impossibles à inventer | P0 / #252 |
| P-05 | Graphe direct d’imports | tree Git + imports | candidats TEST/CONSUMER | DETERMINISTIC | regex peut être incomplète mais pas non déterministe | NON pour déterminisme ; amélioration couverture possible | AST/TypeScript resolver ultérieur | aucun | non | M | Moyen | corpus aliases/reexports/dynamic import comparé au resolver | P2 |
| P-06 | `scope_allow` | rows de matrice | liste de mutation autorisée | DETERMINISTIC | — | NON | conserver `MODIFY ∪ TEST_MUST_ADAPT` comme source unique | aucun | non | S | Faible | replay exact de scope et rejet de tout scope prose divergent | P0-conserver |
| P-07 | Squelette matrice UI | requirements + UI paths + scope | criteria + preservation | MODEL_ASSISTED + validation | IDs, cibles et preuves largement générés ensemble | PARTIELLE | squelette mécanique : IDs, cibles, types de preuve obligatoires, relations scope | requirement wording, risk sémantique, REUSE/EXTEND/CREATE | non | L | Élevé | même input => même squelette ; modèle ne peut ajouter/retirer clés/cibles | P0 |
| P-08 | `criterion_id` UI | source path + locator + requirement | ID | MODEL_ASSISTED | identifiant libre | OUI | ID depuis `requirement_id` ou hash canonique versionné | aucun | non | S | Moyen | stabilité ID sur rejouage ; changement source => changement contrôlé | P0 |
| P-09 | Choix `REUSE/EXTEND/CREATE` | requirement + inventaire composants | décision composant | MODEL_ASSISTED | choix architectural réel | NON en général | fournir candidats réels et métadonnées ; fermer l’ensemble quand exhaustif | arbitrer entre candidats/plausibilité d’extension | non | M | Moyen | aucun composant inexistant ; justification liée au candidat exact | P0 |
| P-10 | Tests impactés existants | graphe imports/tests, scope | tests à adapter | MODEL_ASSISTED + scan | une partie calculable est encore reformulée | OUI | dériver tests existants touchés du graphe et du contract | décider adaptation sémantique quand import ne suffit pas | non | M | Moyen | tests existants ne peuvent être omis/inventés ; classification bornée | P0 |
| P-11 | Nouveaux tests CREATE | requirement + conventions repo | path test à créer | MODEL_ASSISTED | chemin libre | PARTIELLE | emplacements autorisés déterminés ; path candidat dérivé du module/feature ; validation CREATE | choisir si un nouveau test est nécessaire si non déductible | non | M | Moyen | CREATE absent au HEAD, chemin canonique et convention valide | P0 |
| P-12 | `test_contract` | requirements, tests impactés/créés, proof types | requirement→test→proof | absent aujourd’hui | relations dispersées entre prose/UI matrix | OUI pour relations explicites | objet versionné `test_contract` assemblé mécaniquement | justification de couverture non triviale | non | L | Élevé | chaque requirement testable a au moins une relation ou justification explicite `NO_AUTOMATED_TEST` | P0 |
| P-13 | Requirements non-UI | docs normatives + mission | exigences prose | MODEL_ASSISTED | pas d’identité machine stable | PARTIELLE | `requirement_contract` commun UI/non-UI avec ID/source/locator/type | interpréter la portée exacte du texte normatif | éventuellement si ambigu | L | Élevé | même source donne mêmes IDs ; aucune exigence ne disparaît entre plan/revue/dev | P0 critique |
| P-14 | Boundaries PRESERVE/FORBIDDEN | requirements + architecture | target + justification | MODEL_ASSISTED | target souvent sémantique non adressable | PARTIELLE | path/symbol/locator + invariant type + état attendu | formuler invariant sémantique si non calculable | non | L | Élevé | boundaries calculables produisent PASS/FAIL sans reviewer | P0 critique |
| P-15 | `plan_status` | classifications, ambiguïtés, contracts | READY / CLARIFICATION_REQUIRED | MODEL_ASSISTED | agrégat fourni par modèle | OUI | règle d’agrégation mécanique | signaler une ambiguïté locale structurée | non | S | Faible | un seul élément bloquant => CLARIFICATION_REQUIRED ; zéro => READY | P1 |
| P-16 | Markdown du plan | sortie modèle + blocs machine | document final | MODEL_ASSISTED + réconciliation | ordre/listes calculables encore générés en prose | OUI pour structure | JSON contract canonique → renderer Markdown | rédiger justifications/narratif borné | non | M | Moyen | round-trip contract→Markdown sans perte ; Markdown non source d’autorité | P1 |
| P-17 | Rejeu plan avant revue | plan + Git HEAD | scan/proofs/contracts | DETERMINISTIC | — | NON | conserver et étendre | aucun | non | S | Faible | replay indépendant bit-for-bit / hashes égaux | P0-conserver |
| P-18 | Findings de revue `REVISE` | plan, code, preuves | prose + verdict | MODEL_ASSISTED | constats non identifiés ni adressés structurellement | PARTIELLE | `finding_id`, category, target IDs/paths, blocking, expected_correction, dependency_expansion | détecter défaut sémantique et formuler correction | non | L | Élevé | aucun finding sans cible ; tous les findings bloquants fermés avant APPROVE | P0 critique |
| P-19 | Sélection du delta après REVISE | base plan + findings | contenu à rouvrir | MODEL_ASSISTED borné par #251 | dépendances causalement affectées encore interprétées | PARTIELLE | fermeture mécanique sur findings + dépendances explicitement démontrées ; autres éléments verrouillés | déclarer une dépendance causale non calculable | non | M | Élevé | éléments non ciblés inchangés structurellement ; élargissement toujours justifié | P0 |
| P-20 | Verdict revue de plan | findings + validators | APPROVE/REVISE | MODEL_ASSISTED | agrégation demandée au reviewer | OUI | `blocking finding OR clarification => REVISE`, sinon APPROVE | produire findings sémantiques | non | S | Faible | verdict divergent impossible | P1 |
| P-21 | Device/UX ambiguïté réelle en plan | Figma + doc + décisions | arbitrage produit | HUMAN_DECISION | règle non déductible | NON | rester `À CLARIFIER` | préparer options factuelles | oui | — | — | décision utilisateur explicite et traçable | conserver humain |

---

# 2. Développement / exécution locale

| ID | Étape | Entrées actuelles | Résultat actuel | Nature actuelle | Source de non-détermination | Déterminisation | Mécanisme cible | Rôle IA résiduel | Gate humain | Effort | Risque de changement | Preuve de qualification attendue | Priorité |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D-01 | Lean Request depuis plan approuvé | plan/review/gate/impact | request immutable | DETERMINISTIC | — | NON | conserver génération mécanique | aucun | gate déjà en amont | S | Faible | hash/binding/scope identiques au plan | P0-conserver |
| D-02 | Génération mission implémentation | plan + UI contract | mission .md | DETERMINISTIC | contrat actuel surtout UI | OUI à étendre | renderer depuis requirement contract unifié | aucun | non | M | Moyen | mission reflète exactement requirements/criteria et stops | P0 |
| D-03 | Work items d’implémentation | mission + plan | ordre libre de travail | MODEL_ASSISTED | Claude reconstruit les obligations depuis le texte | PARTIELLE | dériver work items = requirements AFFECTED + targets + dependencies | choisir stratégie interne et ordre fin dans dépendances équivalentes | non | L | Moyen | aucun requirement actif sans work item ou justification `NO_CODE_CHANGE` | P0 |
| D-04 | Scope de mutation | Lean Request | chemins autorisés | DETERMINISTIC | — | NON | conserver | aucun | non | S | Faible | toute mutation hors scope bloquée | P0-conserver |
| D-05 | Détection delta Git | worktree | fichiers modifiés/renommés | DETERMINISTIC | — | NON | conserver porcelain v2 -z + fingerprint | aucun | non | S | Faible | Unicode/rename/copy/symlink corpus | P0-conserver |
| D-06 | Conformité REUSE | plan + diff | déclaration Claude/reviewer | MODEL_ASSISTED | usage du composant pas prouvé mécaniquement | PARTIELLE | binding `selected_component={path,export}` + analyse import/usage | juger adéquation sémantique | non | M | Moyen | REUSE sans import/usage exact impossible à marquer conforme | P0 |
| D-07 | Conformité EXTEND | plan + diff | déclaration Claude/reviewer | MODEL_ASSISTED | symbole/path d’extension pas formalisé | PARTIELLE | binding path/symbol + diff symbolique/AST | juger qualité/adéquation de l’extension | non | M | Moyen | EXTEND doit toucher le composant exact ou dépendance déclarée | P0 |
| D-08 | Conformité CREATE | plan + Git before/after | déclaration/review | Mixte | existence avant/après calculable | OUI | vérifier absent au base HEAD, présent au delivery HEAD, chemin dans scope | aucun sur existence ; sémantique reste revue | non | S | Faible | CREATE déjà existant / absent après implémentation => FAIL | P0 |
| D-09 | PRESERVE calculable | boundary + before/after | PASS/FAIL reviewer | MODEL_ASSISTED | comparaison non encodée | OUI quand path/symbol/hash adressable | hash/blob/symbol snapshot avant/après | aucun pour invariant calculable | non | M | Moyen | mutation d’un PRESERVE => FAIL automatique | P0 |
| D-10 | FORBIDDEN calculable | boundary + diff | PASS/FAIL reviewer | MODEL_ASSISTED | interdiction non machine-addressable | OUI quand cible explicite | assert absence de mutation/usage/création selon invariant type | aucun pour invariant calculable | non | M | Moyen | violation => FAIL avant revue IA | P0 |
| D-11 | Ambiguïté / changement requis | contexte d’implémentation | KODJO_STOP_STATUS | MODEL_ASSISTED | plusieurs stops sont déclaratifs | PARTIELLE | stops observables générés par superviseur ; stops sémantiques restent agent | CLARIFICATION_REQUIRED / CHANGE_REQUEST_REQUIRED non mécaniques | parfois oui après stop | M | Moyen | stop hors scope dérivé sans dépendre du texte Claude | P1 |
| D-12 | Rapport fichiers/symboles modifiés | Git + diff | auto-déclaration Claude | MODEL_ASSISTED | fait calculable | OUI | générer depuis Git + analyse symbols | notes explicatives seulement | non | M | Faible | rapport == delta réel | P0 |
| D-13 | Rapport `tests_run` | runner invocations | auto-déclaration Claude | MODEL_ASSISTED | fait calculable | OUI | journal runner signé/structuré ; injecté au rapport | aucun | non | S | Faible | aucun test déclaré RUN sans invocation observée | P0 |
| D-14 | Rapport `proof_status` calculable | outputs checks/diff | auto-déclaration Claude | MODEL_ASSISTED | exit codes et relations contractuelles déjà connus | OUI partiellement | preuve machine par requirement/proof | preuves visuelles/sémantiques non calculables | non | M | Moyen | FUNCTIONAL_TEST/STATIC_ANALYSIS dérivés des résultats exacts | P0 |
| D-15 | Résumé humain d’implémentation | diff + preuves | texte Claude | MODEL_ASSISTED | synthèse, non autorisante | NON nécessaire | conserver comme vue humaine non source de vérité | synthèse/justifications | non | S | Faible | divergence du résumé n’affecte pas les gates | P2 |

---

# 3. Tests / qualification / revue d’implémentation

| ID | Étape | Entrées actuelles | Résultat actuel | Nature actuelle | Source de non-détermination | Déterminisation | Mécanisme cible | Rôle IA résiduel | Gate humain | Effort | Risque de changement | Preuve de qualification attendue | Priorité |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| T-01 | Sélection checks INITIAL | Lean Request | jest/typescript/lint | DETERMINISTIC | — | NON | conserver set contractuel | aucun | non | S | Faible | set exact et versionné | P0-conserver |
| T-02 | Exécution Jest finale | HEAD exact | PASS/FAIL + counts | DETERMINISTIC | — | NON | conserver, produire sortie machine-readable | aucun | non | S | Faible | même HEAD/lockfile ; exit code + test results capturés | P0 |
| T-03 | Exécution TypeScript | HEAD exact | PASS/FAIL | DETERMINISTIC | — | NON | conserver | aucun | non | S | Faible | exit code exact au HEAD | P0-conserver |
| T-04 | Exécution lint/diff-check | HEAD exact | PASS/FAIL | DETERMINISTIC | — | NON | conserver | aucun | non | S | Faible | lint global + fichiers changés + diff-check | P0-conserver |
| T-05 | Scope post-implémentation | delta préservé + allowlist | PASS/FAIL | DETERMINISTIC | — | NON | conserver | aucun | non | S | Faible | out-of-scope toujours bloquant | P0-conserver |
| T-06 | Mapping test → requirement | Jest results + test_contract | aujourd’hui interprété | MODEL_ASSISTED | pas de relation machine complète | OUI | résultats Jest structurés + `test_contract` | aucun pour exécution ; sémantique de pertinence en plan | non | L | Moyen | chaque proof FUNCTIONAL_TEST pointe un test réellement exécuté et PASS | P0 |
| T-07 | STATIC_ANALYSIS proof | tsc/lint/static rules | proof_result reviewer | MODEL_ASSISTED | attribution de preuve | OUI | proof result construit mécaniquement depuis checks requis du criterion | aucun | non | M | Faible | exit code !=0 empêche PASS ; evidence référence run/check exact | P0 |
| T-08 | Préparation UI AFFECTED/INHERITED | criteria + changed files + previous review | scope de revue | DETERMINISTIC | — | NON | conserver intersection targets/tests | aucun | non | S | Faible | unchanged criterion copié bit-for-bit | P0-conserver |
| T-09 | Boundaries review | preservation contract + diff | PASS/FAIL/NON_VERIFIABLE IA | MODEL_ASSISTED | targets insuffisamment machine-addressables | PARTIELLE | exécuter d’abord toutes assertions calculables ; reviewer seulement pour reste | évaluer invariants sémantiques | non | L | Moyen | calculable boundary jamais réinterprétée | P0 |
| T-10 | Review non-UI requirements | plan prose + diff | ré-énumération par reviewer | MODEL_ASSISTED | absence requirement IDs | OUI pour inventaire/couverture | reviewer reçoit requirement contract exact ; 1 résultat par ID | jugement sémantique de conformité | non | L | Élevé | impossibilité d’omettre/inventer une exigence | P0 critique |
| T-11 | Review UI criteria | criterion input + diff + evidence | statuses par IA | MODEL_ASSISTED | conformité sémantique réelle | PARTIELLE | machine préremplit preuves calculables ; IA statue uniquement sur résidu sémantique | conformité de comportement/design non calculable | non | M | Moyen | preuves machine immuables ; output IA ne peut pas les altérer | P0 |
| T-12 | `device_gate_required` | proof_required | boolean | DETERMINISTIC déjà dans input | reviewer le renvoie encore | OUI | ne plus demander au modèle ; injecter dans review contract | aucun | oui si true | S | Faible | divergence impossible | P1 |
| T-13 | Verdict revue implémentation | statuses + proof results + boundaries | verdict IA puis validé | MODEL_ASSISTED | agrégat calculable | OUI | calcul mécanique après review rows | aucun sur agrégat | non | S | Faible | blocking => REVISE, sinon APPROVE | P1 |
| T-14 | VISUAL_COMPARE | device/Figma/rendu | PENDING_DEVICE/FAIL | HUMAN_DECISION | preuve runtime visuelle | NON | conserver gate visuel/device | reviewer peut signaler défaut manifeste sans PASS | oui | — | — | PASS uniquement après preuve device/humaine admise | conserver humain |
| T-15 | DEVICE_CHECK | appareil réel | PENDING_DEVICE/FAIL | HUMAN_DECISION | environnement réel | NON | conserver | aucun PASS automatisé | oui | — | — | preuve device liée au HEAD exact | conserver humain |
| T-16 | ACCESSIBILITY statique | code + règles | aujourd’hui mixte | MODEL_ASSISTED + éventuelle preuve | PARTIELLE | séparer assertions statiques et runtime AT/device | juger aspects non automatisables | oui si runtime requis | M | Moyen | chaque assertion atomique a type de preuve propre | P1 |
| T-17 | Rejeu ciblé après correction | failed_checks | subset checks | DETERMINISTIC grossier | matrice IMPACT fixe | PARTIELLE | dériver subset depuis findings + files + test_contract | aucun | non | M | Moyen | subset contient tous impacts démontrés ; full qualification avant clôture | P2 |
| T-18 | Requalification finale | HEAD final + contracts | verdict technique | DETERMINISTIC + MODEL_ASSISTED | semantic review reste légitime | PARTIELLE | toutes preuves calculables fermées avant reviewer | uniquement résidus sémantiques | device gate séparé | M | Faible | aucune preuve calculable NON_VERIFIABLE par défaut | P1 |

---

# 4. Matrice de priorisation des transformations

| Lot | Contenu | Dépendances | Effort | Risque | Gain attendu | Critère de sortie | Priorité de clôture |
|---|---|---|---|---|---|---|---|
| DET-01 | Finaliser #252 : clés de décisions liées au scan | aucune | S | Faible | supprime `INITIAL_PLAN_DECISION_CARDINALITY` et paths recopiés | suite Linux + Windows + replay PRE-1 passent | REQUIRED |
| DET-02 | `requirement_contract` unifié UI/non-UI + IDs stables | DET-01 | L | Élevé | élimine reconstruction des exigences à chaque phase | même set d’IDs du plan à la revue finale | REQUIRED |
| DET-03 | Findings structurés + delta-only mécanique | DET-02 + #251 | L | Élevé | empêche reconstruction globale après REVISE | test : finding ciblé ne modifie aucun requirement hors cible/dépendance | REQUIRED |
| DET-04 | `test_contract` requirement→test→proof | DET-02 | L | Moyen | preuve fonctionnelle traçable et moins d’interprétation IA | chaque preuve test renvoie à un test exact exécuté | REQUIRED |
| DET-05 | PRESERVE/FORBIDDEN machine-addressables | DET-02 | L | Moyen | transforme de nombreuses revues en assertions | invariants calculables PASS/FAIL avant IA | REQUIRED |
| DET-06 | Rapport d’implémentation mécanique | DET-02/04/05 | L | Moyen | supprime auto-déclaration de faits Git/test | files/tests/proofs calculables produits sans texte Claude | REQUIRED |
| DET-07 | Review contract hybride : machine facts + semantic residuals | DET-02/04/05/06 | L | Élevé | IA réservée aux jugements sémantiques | reviewer ne peut modifier les facts machine | REQUIRED |
| DET-08 | Agrégation mécanique plan_status/verdicts/device flag | DET-03/07 | M | Faible | supprime divergences d’agrégat | aucune sortie IA d’agrégat requise | REQUIRED |
| DET-09 | Superviseur de correction : failure set → work items → retry borné | DET-03/04/07 | L | Moyen | retry devient filet de sécurité, pas convergence nominale | résidu corrigé sans élargissement ; erreur prévenable ne rappelle pas IA | REQUIRED |
| DET-10 | Resolver AST/TypeScript des dépendances | indépendant après stabilisation | M/L | Moyen | améliore exhaustivité du scope | corpus reexports/aliases/imports dynamiques qualifié | DEFERRED |

---

# 5. Ordre causal proposé

```text
DET-01  #252
  ↓
DET-02  requirement_contract
  ├── DET-03 findings + delta-only
  ├── DET-04 test_contract
  └── DET-05 boundaries machine
           ↓
        DET-06 implementation evidence
           ↓
        DET-07 review hybride
           ↓
        DET-08 agrégats mécaniques
           ↓
        DET-09 correction supervisée

DET-10 graphe AST peut être qualifié séparément après stabilisation du contrat.
```

## Principe de non-régression

La déterminisation ne doit jamais :
- transformer une ambiguïté produit réelle en pseudo-règle technique ;
- élargir silencieusement un scope ;
- rendre facultative une revue sémantique qui reste nécessaire ;
- remplacer un gate humain/device par une heuristique ;
- convertir une absence de preuve en PASS ;
- reconstituer un path, ID ou ensemble déjà fourni par une source déterministe.

La cible n’est pas « zéro IA ». La cible est : **zéro IA pour les identités, faits, agrégats et relations calculables ; IA uniquement pour les décisions réellement sémantiques**.

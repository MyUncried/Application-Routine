# Mission d’implémentation — VNEXT-12-QUALIF

plan_contract_hash=10c0874fa012c538b0ac92d7b14e46b09f17eb5da727821ffcbc1bcc56102557
application_head=3bb64be15d7662a76160bbe918a3bac297731935
operation_kind=IMPLEMENT
execution_context={"mode":"LOCAL","writer_id":"CLAUDE:kodjo-local-vnext12"}
checks=jest,typescript,lint
Rapport obligatoire: lire les contrats UI et NON_UI du plan opposable. Produire KODJO_IMPLEMENTATION_CONFORMANCE avec criteria (vide si aucun critere UI), et KODJO_REQUIREMENT_CONFORMANCE avec chaque requirement_id NON_UI du KODJO_REQUIREMENT_CONTRACT_JSON, sans omission ni nouvel identifiant.
Si le plan contient figma_references : lire le bloc exact KODJO_VNEXT_UI_ATOMICITY_JSON ; consulter les captures et ressources de KODJO_VNEXT_FIGMA_READ_JSON et respecter les predicates de chaque assertion. Leur hash doit rester celui de la reference approuvee. La lecture seule n’est pas une preuve de conformite. Ne pas convertir les exemples Figma en regles metier ; toute ambiguite mixte reste CLARIFICATION_REQUIRED.
Chaque ligne NON_UI porte implementation_status, files_or_symbols (chemins exacts modifies), tests_run (noms des checks observes: jest, typescript, lint), proof_status et residual_status. Chaque ligne UI ajoute criterion_id, component_used et preserve_status. Aucun test non execute ne peut etre declare PASS.
Encodage: <KODJO_IMPLEMENTATION_CONFORMANCE>{"criteria":[]}</KODJO_IMPLEMENTATION_CONFORMANCE> et <KODJO_REQUIREMENT_CONFORMANCE>{"requirements":[{"requirement_id":"identifiant exact du plan","implementation_status":"IMPLEMENTED","files_or_symbols":["chemin exact"],"tests_run":["check observe"],"proof_status":"preuve observee","residual_status":"NONE ou risque reel"}]}</KODJO_REQUIREMENT_CONFORMANCE>. Les valeurs du modele illustratif ne sont jamais des preuves.
Terminer par exactement une ligne KODJO_STOP_STATUS: NONE, ou un des arrets opposables si necessaire: CHANGE_REQUEST_REQUIRED, SCOPE_EXPANSION_REQUIRED, NATIVE_PRIMITIVE_EXCEPTION_REQUIRED, CLARIFICATION_REQUIRED.

## Autorisation

Implémenter exclusivement le périmètre autorisé par l’ExecutionRequest VNext.
Aucun élargissement de scope n’est autorisé.
Le scope opposable de transport est exactement :
- scripts/kodjo/fixtures/vnext12/core.js
- tests/fixtures/vnext12/core.test.js

Tout besoin hors scope doit arrêter l’exécution avant modification.
Toute substitution native sans autorisation explicite doit arrêter en NATIVE_PRIMITIVE_EXCEPTION_REQUIRED avant code.

## Plan exact approuvé à exécuter

Lire le plan opposable .github/orchestration/vnext12/VNEXT-12-QUALIF/initial/technical-plan.md avant toute modification. Sa projection exacte suit.
Le plan impose les intentions, tests, preuves et préservations. Arrêter en CLARIFICATION_REQUIRED si une exigence est ambiguë.
# KODJO VNext — Plan canonique

- schema: `kodjo.vnext.plan-contract.v1`
- contract_hash: `10c0874fa012c538b0ac92d7b14e46b09f17eb5da727821ffcbc1bcc56102557`
- requirements: 1
- write_scope: 2

## Boundaries

- forbidden_policy: `ALL_OUTSIDE_WRITE_SCOPE`
- CHANGE `scripts/kodjo/fixtures/vnext12/core.js` (MODIFY)
- CHANGE `tests/fixtures/vnext12/core.test.js` (MODIFY)
- PRESERVE `scripts/kodjo/fixtures/vnext12/keep.js`

## REQ-8aca95ddb8af1f5c583c78a8

- disposition: `CHANGE`
- kind: `FUNCTIONAL`
- rationale: INITIAL opérationnel nominal, deux fichiers, une exigence observable.
- impacts:
  - `IMP-79197b9529c84dd2718de01c`
  - `IMP-86e2c44271d08e527daf37ba`
- changes:
  - `scripts/kodjo/fixtures/vnext12/core.js` — MODIFY — Conserver l’export CommonJS value() ; retourner exactement le nombre 2, sans autre comportement ni dépendance.
  - `tests/fixtures/vnext12/core.test.js` — MODIFY — Conserver le test Jest et son import direct ; remplacer son attente 1 par 2 ; exécuter ce test puis les checks contractuels.
- tests:
  - ADAPT — `tests/fixtures/vnext12/core.test.js` — Le test Jest observe value() === 2.
- proofs:
  - FUNCTIONAL_TEST — Le test Jest passe avec la valeur 2.
- constraints:
  - Modifier uniquement les deux fichiers du write_scope.
  - Préserver keep.js octet pour octet.
  - Ne pas créer de dépendance ; aucun composant UI ni exception native.
  - Ne pas publier, fusionner, activer VNext ni intervenir sur PRE-1.
- residual_risks:
  - Tranche synthétique jetable : ne certifie aucun comportement produit réel.

<KODJO_VNEXT_PLAN_CONTRACT_JSON>
{
  "schema_version": "kodjo.vnext.plan-contract.v1",
  "requirement_registry_hash": "fb451829c747f32d5a08d5b625975107c18380159f528300572bb037e1cff150",
  "impact_graph_hash": "6d87addd7af06f072c50919e42a60686ade5b0aabbbc6262b827410126c3f58c",
  "candidate_manifest_hash": "82726662008e7be960e0722cf72b2aa6d725ebf585d481eafef30d24d2ef380b",
  "requirement_count": 1,
  "plan_item_count": 1,
  "plan_items": [
    {
      "plan_item_id": "PLAN-d5bb287983b6d77b1b381fc0",
      "requirement_id": "REQ-8aca95ddb8af1f5c583c78a8",
      "requirement_kind": "FUNCTIONAL",
      "disposition": "CHANGE",
      "impact_ids": [
        "IMP-79197b9529c84dd2718de01c",
        "IMP-86e2c44271d08e527daf37ba"
      ],
      "change_items": [
        {
          "change_id": "CHG-6521a48fe3c72ab7f39c246c",
          "impact_id": "IMP-86e2c44271d08e527daf37ba",
          "candidate_id": "CAND-4a0f135a8f922960f21f136f",
          "path": "scripts/kodjo/fixtures/vnext12/core.js",
          "change_kind": "MODIFY",
          "intent": "Conserver l’export CommonJS value() ; retourner exactement le nombre 2, sans autre comportement ni dépendance."
        },
        {
          "change_id": "CHG-fd1a8ccf06e49c1a4ecce3b3",
          "impact_id": "IMP-79197b9529c84dd2718de01c",
          "candidate_id": "CAND-0f876570c118f92bf2ac0b92",
          "path": "tests/fixtures/vnext12/core.test.js",
          "change_kind": "MODIFY",
          "intent": "Conserver le test Jest et son import direct ; remplacer son attente 1 par 2 ; exécuter ce test puis les checks contractuels."
        }
      ],
      "test_obligations": [
        {
          "test_id": "TEST-907ec31573116b65b17af2cc",
          "target_impact_id": "IMP-79197b9529c84dd2718de01c",
          "target_candidate_id": "CAND-0f876570c118f92bf2ac0b92",
          "path": "tests/fixtures/vnext12/core.test.js",
          "action": "ADAPT",
          "covered_change_impact_ids": [
            "IMP-79197b9529c84dd2718de01c",
            "IMP-86e2c44271d08e527daf37ba"
          ],
          "expected": "Le test Jest observe value() === 2.",
          "justification": "Vérification directe de la fonction réellement modifiée."
        }
      ],
      "proof_obligations": [
        {
          "proof_id": "PROOF-d46fedc59e461c3d157d3265",
          "proof_type": "FUNCTIONAL_TEST",
          "target_test_impact_id": "IMP-79197b9529c84dd2718de01c",
          "covered_change_impact_ids": [
            "IMP-79197b9529c84dd2718de01c",
            "IMP-86e2c44271d08e527daf37ba"
          ],
          "expected": "Le test Jest passe avec la valeur 2.",
          "justification": "Résultat exécuté ; pas de statut déclaré sans observation."
        }
      ],
      "implementation_constraints": [
        "Modifier uniquement les deux fichiers du write_scope.",
        "Préserver keep.js octet pour octet.",
        "Ne pas créer de dépendance ; aucun composant UI ni exception native.",
        "Ne pas publier, fusionner, activer VNext ni intervenir sur PRE-1."
      ],
      "residual_risks": [
        "Tranche synthétique jetable : ne certifie aucun comportement produit réel."
      ],
      "rationale": "INITIAL opérationnel nominal, deux fichiers, une exigence observable."
    }
  ],
  "boundaries": {
    "write_scope": [
      {
        "candidate_id": "CAND-4a0f135a8f922960f21f136f",
        "path": "scripts/kodjo/fixtures/vnext12/core.js",
        "change_kind": "MODIFY"
      },
      {
        "candidate_id": "CAND-0f876570c118f92bf2ac0b92",
        "path": "tests/fixtures/vnext12/core.test.js",
        "change_kind": "MODIFY"
      }
    ],
    "preserve_scope": [
      {
        "candidate_id": "CAND-a55a6a4f23f08d016fededda",
        "path": "scripts/kodjo/fixtures/vnext12/keep.js"
      }
    ],
    "forbidden_policy": "ALL_OUTSIDE_WRITE_SCOPE"
  },
  "contract_hash": "10c0874fa012c538b0ac92d7b14e46b09f17eb5da727821ffcbc1bcc56102557"
}
</KODJO_VNEXT_PLAN_CONTRACT_JSON>

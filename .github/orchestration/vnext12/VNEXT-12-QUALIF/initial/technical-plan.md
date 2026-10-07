# KODJO VNext — Projection transport du plan

application_head=3bb64be15d7662a76160bbe918a3bac297731935
plan_contract_hash=10c0874fa012c538b0ac92d7b14e46b09f17eb5da727821ffcbc1bcc56102557

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
<KODJO_UI_CRITERIA_MATRIX_JSON>
{
  "schema": "kodjo.ui-criteria.v1",
  "criteria": [],
  "preservation": {
    "preserve": [
      {
        "target": "scripts/kodjo/fixtures/vnext12/keep.js",
        "justification": "Exact approved VNext preserve_scope."
      }
    ],
    "change": [
      {
        "target": "scripts/kodjo/fixtures/vnext12/core.js",
        "justification": "Exact approved VNext write_scope: MODIFY"
      },
      {
        "target": "tests/fixtures/vnext12/core.test.js",
        "justification": "Exact approved VNext write_scope: MODIFY"
      }
    ],
    "forbidden": [
      {
        "target": "OUTSIDE_WRITE_SCOPE",
        "justification": "ALL_OUTSIDE_WRITE_SCOPE"
      }
    ]
  }
}
</KODJO_UI_CRITERIA_MATRIX_JSON>
<KODJO_UI_PLAN_CONTRACT_JSON>
{
  "schema": "kodjo.ui-plan-contract.v1",
  "contract_version": 1,
  "protocol_commit": "3bb64be15d7662a76160bbe918a3bac297731935",
  "scan_revision": "3bb64be15d7662a76160bbe918a3bac297731935",
  "ui_applicable": false,
  "ui_paths": [],
  "criterion_count": 0,
  "matrix_sha256": "7f596a126509d82f5c4105ed7db6b11983ed5ee30b646a07eec99841ae5a40a6"
}
</KODJO_UI_PLAN_CONTRACT_JSON>
<KODJO_VNEXT_SCOPE_JSON>
{
  "schema": "kodjo.vnext.downstream-scope.v1",
  "plan_contract_hash": "10c0874fa012c538b0ac92d7b14e46b09f17eb5da727821ffcbc1bcc56102557",
  "scope_allow": [
    "scripts/kodjo/fixtures/vnext12/core.js",
    "tests/fixtures/vnext12/core.test.js"
  ]
}
</KODJO_VNEXT_SCOPE_JSON>
<KODJO_NON_UI_REQUIREMENTS_JSON>
[
  {
    "requirement_type": "FUNCTIONAL",
    "source": {
      "path": ".github/orchestration/vnext12/VNEXT-12-QUALIF/requirement.md",
      "locator": "FULL_FILE",
      "requirement": "La fonction CommonJS value() de scripts/kodjo/fixtures/vnext12/core.js doit retourner exactement le nombre 2 au lieu de 1. Son test Jest direct tests/fixtures/vnext12/core.test.js doit vérifier cette valeur 2. Conserver le fichier scripts/kodjo/fixtures/vnext12/keep.js octet pour octet. Ne modifier que la fonction et son test, sans dépendance supplémentaire, sans UI ni exception native. Il s’agit d’une tranche jetable de qualification VNext-12 ; aucune publication applicative, fusion, activation ou intervention sur PRE-1.\nVNext requirement_id=REQ-8aca95ddb8af1f5c583c78a8"
    },
    "change_targets": [
      "scripts/kodjo/fixtures/vnext12/core.js",
      "tests/fixtures/vnext12/core.test.js"
    ],
    "tests": [
      "tests/fixtures/vnext12/core.test.js"
    ],
    "proof_required": [
      "FUNCTIONAL_TEST"
    ],
    "status": "DEFINED"
  }
]
</KODJO_NON_UI_REQUIREMENTS_JSON>
<KODJO_REQUIREMENT_CONTRACT_JSON>
{
  "schema": "kodjo.requirement-contract.v1",
  "requirement_count": 1,
  "requirement_ids_sha256": "2998a4475914ab0cb87308850cb2da2ab8d9436af3867e31cb07b0b7224f2f05",
  "requirements": [
    {
      "requirement_id": "REQ-E9A3ADD89E5402C4",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": ".github/orchestration/vnext12/VNEXT-12-QUALIF/requirement.md",
        "locator": "FULL_FILE",
        "requirement": "La fonction CommonJS value() de scripts/kodjo/fixtures/vnext12/core.js doit retourner exactement le nombre 2 au lieu de 1. Son test Jest direct tests/fixtures/vnext12/core.test.js doit vérifier cette valeur 2. Conserver le fichier scripts/kodjo/fixtures/vnext12/keep.js octet pour octet. Ne modifier que la fonction et son test, sans dépendance supplémentaire, sans UI ni exception native. Il s’agit d’une tranche jetable de qualification VNext-12 ; aucune publication applicative, fusion, activation ou intervention sur PRE-1.\nVNext requirement_id=REQ-8aca95ddb8af1f5c583c78a8"
      },
      "change_targets": [
        "scripts/kodjo/fixtures/vnext12/core.js",
        "tests/fixtures/vnext12/core.test.js"
      ],
      "tests": [
        "tests/fixtures/vnext12/core.test.js"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST"
      ],
      "status": "DEFINED"
    }
  ]
}
</KODJO_REQUIREMENT_CONTRACT_JSON>
<KODJO_TEST_CONTRACT_JSON>
{
  "schema": "kodjo.test-contract.v1",
  "binding_count": 1,
  "bindings": [
    {
      "requirement_id": "REQ-E9A3ADD89E5402C4",
      "test_path": "tests/fixtures/vnext12/core.test.js",
      "proof_type": "FUNCTIONAL_TEST"
    }
  ]
}
</KODJO_TEST_CONTRACT_JSON>
<KODJO_BOUNDARY_CONTRACT_JSON>
{
  "schema": "kodjo.boundary-contract.v1",
  "boundary_count": 2,
  "boundaries": [
    {
      "category": "FORBIDDEN",
      "target": "OUTSIDE_WRITE_SCOPE",
      "justification": "ALL_OUTSIDE_WRITE_SCOPE",
      "locator": {
        "kind": "SEMANTIC",
        "value": "OUTSIDE_WRITE_SCOPE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "scripts/kodjo/fixtures/vnext12/keep.js",
      "justification": "Exact approved VNext preserve_scope.",
      "locator": {
        "kind": "PATH",
        "value": "scripts/kodjo/fixtures/vnext12/keep.js"
      }
    }
  ]
}
</KODJO_BOUNDARY_CONTRACT_JSON>
<KODJO_VNEXT_REQUIREMENT_REGISTRY_JSON>
{
  "schema_version": "kodjo.vnext.requirement-registry.v1",
  "planning_envelope_hash": "a865e604a4a56a3feb8fffdbce1abbdfbb6a8102f03b42a7309070406426b190",
  "source_manifest_hash": "37a3a6c2cd7472f2a5d07e29ed02cb9552af7401c5d65eb6f09822d78b9027d1",
  "registry_status": "READY",
  "blocking_reasons": [],
  "source_unit_count": 1,
  "requirement_source_unit_count": 1,
  "requirement_count": 1,
  "requirement_ids_sha256": "d5bb287983b6d77b1b381fc01a07f4d34836d57fdb88ba61243dd0aad5f4da0d",
  "coverage": [
    {
      "source_id": "SRC-96a468e158d814ccc8091e8b",
      "unit_id": "UNIT-ca7ad261317da9dadf7bfa63",
      "disposition": "REQUIREMENT_SOURCE",
      "requirement_ids": [
        "REQ-8aca95ddb8af1f5c583c78a8"
      ],
      "coverage_status": "COVERED"
    }
  ],
  "requirements": [
    {
      "requirement_id": "REQ-8aca95ddb8af1f5c583c78a8",
      "source_id": "SRC-96a468e158d814ccc8091e8b",
      "unit_id": "UNIT-ca7ad261317da9dadf7bfa63",
      "kind": "FUNCTIONAL",
      "statement": "La fonction CommonJS value() de scripts/kodjo/fixtures/vnext12/core.js doit retourner exactement le nombre 2 au lieu de 1. Son test Jest direct tests/fixtures/vnext12/core.test.js doit vérifier cette valeur 2. Conserver le fichier scripts/kodjo/fixtures/vnext12/keep.js octet pour octet. Ne modifier que la fonction et son test, sans dépendance supplémentaire, sans UI ni exception native. Il s’agit d’une tranche jetable de qualification VNext-12 ; aucune publication applicative, fusion, activation ou intervention sur PRE-1.",
      "priority": "MUST",
      "status": "ACTIVE",
      "preservation": "NONE_DECLARED",
      "rationale": "Tranche jetable autorisée pour la qualification opérationnelle VNext-12.",
      "related_unit_ids": [],
      "conflict_unit_ids": [],
      "source": {
        "source_kind": "MARKDOWN",
        "authority": "FUNCTIONAL",
        "locator": ".github/orchestration/vnext12/VNEXT-12-QUALIF/requirement.md",
        "revision": "3bb64be15d7662a76160bbe918a3bac297731935",
        "unit_locator": "FULL_FILE",
        "unit_fingerprint": "4a9e1c9ced7cd6125c65012293f2941f4d24e1d198405f7c111e7443ae92014e",
        "unit_disposition": "REQUIREMENT_SOURCE"
      },
      "related_requirement_ids": [],
      "conflict_ids": []
    }
  ],
  "contract_hash": "fb451829c747f32d5a08d5b625975107c18380159f528300572bb037e1cff150"
}
</KODJO_VNEXT_REQUIREMENT_REGISTRY_JSON>

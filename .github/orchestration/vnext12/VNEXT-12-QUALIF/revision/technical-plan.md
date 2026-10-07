# KODJO VNext — Projection transport du plan

application_head=061660b233e58719d3963a2efd9092880c9f3961
plan_contract_hash=0e8f6bb1fa2dda20b94a3031a49eaa946f89d5d1b9e338ff17b0709a12da0d49

# KODJO VNext — Plan canonique

- schema: `kodjo.vnext.plan-contract.v1`
- contract_hash: `0e8f6bb1fa2dda20b94a3031a49eaa946f89d5d1b9e338ff17b0709a12da0d49`
- requirements: 1
- write_scope: 2

## Boundaries

- forbidden_policy: `ALL_OUTSIDE_WRITE_SCOPE`
- CHANGE `scripts/kodjo/fixtures/vnext12/core.js` (MODIFY)
- CHANGE `tests/fixtures/vnext12/core.test.js` (MODIFY)
- PRESERVE `scripts/kodjo/fixtures/vnext12/keep.js`

## REQ-b8df1c0ec7eb57e497b76c59

- disposition: `CHANGE`
- kind: `FUNCTIONAL`
- rationale: INITIAL opérationnel nominal, deux fichiers, une exigence observable.
- impacts:
  - `IMP-8b28569ac36f429767b18567`
  - `IMP-da3e5dd1de2f57177a6e22b1`
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
  "requirement_registry_hash": "271a2e2199d64f538ac530e2e55fbb5e2a4d05bd215e42a75a442dc16f17a757",
  "impact_graph_hash": "d32853a88585a9639fc93306f2cbffcc2a355264dd733ac08c322a773546eac7",
  "candidate_manifest_hash": "1526399cbffeccdef75a9eca802c7ded4a2a643686408bfcd7f9559b2b32ee90",
  "requirement_count": 1,
  "plan_item_count": 1,
  "plan_items": [
    {
      "plan_item_id": "PLAN-404fade111857bc2d5b6440c",
      "requirement_id": "REQ-b8df1c0ec7eb57e497b76c59",
      "requirement_kind": "FUNCTIONAL",
      "disposition": "CHANGE",
      "impact_ids": [
        "IMP-8b28569ac36f429767b18567",
        "IMP-da3e5dd1de2f57177a6e22b1"
      ],
      "change_items": [
        {
          "change_id": "CHG-9ba2870b7686ebdc8c2a2456",
          "impact_id": "IMP-da3e5dd1de2f57177a6e22b1",
          "candidate_id": "CAND-2281ef502c77693934d578ec",
          "path": "scripts/kodjo/fixtures/vnext12/core.js",
          "change_kind": "MODIFY",
          "intent": "Conserver l’export CommonJS value() ; retourner exactement le nombre 2, sans autre comportement ni dépendance."
        },
        {
          "change_id": "CHG-dbd5c8d69117442864fabe9e",
          "impact_id": "IMP-8b28569ac36f429767b18567",
          "candidate_id": "CAND-c9dc2f7c4cb57f01fa733ef4",
          "path": "tests/fixtures/vnext12/core.test.js",
          "change_kind": "MODIFY",
          "intent": "Conserver le test Jest et son import direct ; remplacer son attente 1 par 2 ; exécuter ce test puis les checks contractuels."
        }
      ],
      "test_obligations": [
        {
          "test_id": "TEST-3d504b38a1c5f4c67d4f9b41",
          "target_impact_id": "IMP-8b28569ac36f429767b18567",
          "target_candidate_id": "CAND-c9dc2f7c4cb57f01fa733ef4",
          "path": "tests/fixtures/vnext12/core.test.js",
          "action": "ADAPT",
          "covered_change_impact_ids": [
            "IMP-8b28569ac36f429767b18567",
            "IMP-da3e5dd1de2f57177a6e22b1"
          ],
          "expected": "Le test Jest observe value() === 2.",
          "justification": "Vérification directe de la fonction réellement modifiée."
        }
      ],
      "proof_obligations": [
        {
          "proof_id": "PROOF-e96cf3ddb493a62c0a240406",
          "proof_type": "FUNCTIONAL_TEST",
          "target_test_impact_id": "IMP-8b28569ac36f429767b18567",
          "covered_change_impact_ids": [
            "IMP-8b28569ac36f429767b18567",
            "IMP-da3e5dd1de2f57177a6e22b1"
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
        "candidate_id": "CAND-2281ef502c77693934d578ec",
        "path": "scripts/kodjo/fixtures/vnext12/core.js",
        "change_kind": "MODIFY"
      },
      {
        "candidate_id": "CAND-c9dc2f7c4cb57f01fa733ef4",
        "path": "tests/fixtures/vnext12/core.test.js",
        "change_kind": "MODIFY"
      }
    ],
    "preserve_scope": [
      {
        "candidate_id": "CAND-f1d05a2437b1bc6b977a8ed4",
        "path": "scripts/kodjo/fixtures/vnext12/keep.js"
      }
    ],
    "forbidden_policy": "ALL_OUTSIDE_WRITE_SCOPE"
  },
  "contract_hash": "0e8f6bb1fa2dda20b94a3031a49eaa946f89d5d1b9e338ff17b0709a12da0d49"
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
  "protocol_commit": "061660b233e58719d3963a2efd9092880c9f3961",
  "scan_revision": "061660b233e58719d3963a2efd9092880c9f3961",
  "ui_applicable": false,
  "ui_paths": [],
  "criterion_count": 0,
  "matrix_sha256": "7f596a126509d82f5c4105ed7db6b11983ed5ee30b646a07eec99841ae5a40a6"
}
</KODJO_UI_PLAN_CONTRACT_JSON>
<KODJO_VNEXT_SCOPE_JSON>
{
  "schema": "kodjo.vnext.downstream-scope.v1",
  "plan_contract_hash": "0e8f6bb1fa2dda20b94a3031a49eaa946f89d5d1b9e338ff17b0709a12da0d49",
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
      "requirement": "La fonction CommonJS value() de scripts/kodjo/fixtures/vnext12/core.js doit retourner exactement le nombre 2 au lieu de 1. Son test Jest direct tests/fixtures/vnext12/core.test.js doit vérifier cette valeur 2. Conserver le fichier scripts/kodjo/fixtures/vnext12/keep.js octet pour octet. Ne modifier que la fonction et son test, sans dépendance supplémentaire, sans UI ni exception native. Il s’agit d’une tranche jetable de qualification VNext-12 ; aucune publication applicative, fusion, activation ou intervention sur PRE-1.\nVNext requirement_id=REQ-b8df1c0ec7eb57e497b76c59"
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
  "requirement_ids_sha256": "e04ffff076ffd0eae117a64efdb0a95ebadeb100b751ab2877eb3aaadcf980d5",
  "requirements": [
    {
      "requirement_id": "REQ-39A7976141997794",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": ".github/orchestration/vnext12/VNEXT-12-QUALIF/requirement.md",
        "locator": "FULL_FILE",
        "requirement": "La fonction CommonJS value() de scripts/kodjo/fixtures/vnext12/core.js doit retourner exactement le nombre 2 au lieu de 1. Son test Jest direct tests/fixtures/vnext12/core.test.js doit vérifier cette valeur 2. Conserver le fichier scripts/kodjo/fixtures/vnext12/keep.js octet pour octet. Ne modifier que la fonction et son test, sans dépendance supplémentaire, sans UI ni exception native. Il s’agit d’une tranche jetable de qualification VNext-12 ; aucune publication applicative, fusion, activation ou intervention sur PRE-1.\nVNext requirement_id=REQ-b8df1c0ec7eb57e497b76c59"
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
      "requirement_id": "REQ-39A7976141997794",
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
  "planning_envelope_hash": "7d4c7e4341b88a95c9bb2208f2e517b739b79465e1a08f867390e5a9feabdfed",
  "source_manifest_hash": "81e12ecc77c86a33e5e3b15461c6f6119687598700b6f62a5cace05674a19dc6",
  "registry_status": "READY",
  "blocking_reasons": [],
  "source_unit_count": 1,
  "requirement_source_unit_count": 1,
  "requirement_count": 1,
  "requirement_ids_sha256": "404fade111857bc2d5b6440ce3c3d2f45da6bb1c54fc1ed80bee5af761b4f95e",
  "coverage": [
    {
      "source_id": "SRC-6089720dbd3533b009b8c46c",
      "unit_id": "UNIT-d90ab9d4c4e41172141737bd",
      "disposition": "REQUIREMENT_SOURCE",
      "requirement_ids": [
        "REQ-b8df1c0ec7eb57e497b76c59"
      ],
      "coverage_status": "COVERED"
    }
  ],
  "requirements": [
    {
      "requirement_id": "REQ-b8df1c0ec7eb57e497b76c59",
      "source_id": "SRC-6089720dbd3533b009b8c46c",
      "unit_id": "UNIT-d90ab9d4c4e41172141737bd",
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
        "revision": "061660b233e58719d3963a2efd9092880c9f3961",
        "unit_locator": "FULL_FILE",
        "unit_fingerprint": "4a9e1c9ced7cd6125c65012293f2941f4d24e1d198405f7c111e7443ae92014e",
        "unit_disposition": "REQUIREMENT_SOURCE"
      },
      "related_requirement_ids": [],
      "conflict_ids": []
    }
  ],
  "contract_hash": "271a2e2199d64f538ac530e2e55fbb5e2a4d05bd215e42a75a442dc16f17a757"
}
</KODJO_VNEXT_REQUIREMENT_REGISTRY_JSON>

# KODJO VNext — Projection transport du plan

application_head=7fac320080f83eb74359272b9d039e7b1d8fac5f
plan_contract_hash=03d939de35bef9acdcef79338674b0e567765d6877f56492d647006fa8ce7ace

# KODJO VNext — Plan canonique

- schema: `kodjo.vnext.plan-contract.v1`
- contract_hash: `03d939de35bef9acdcef79338674b0e567765d6877f56492d647006fa8ce7ace`
- requirements: 1
- write_scope: 2

## Boundaries

- forbidden_policy: `ALL_OUTSIDE_WRITE_SCOPE`
- CHANGE `scripts/kodjo/fixtures/vnext12/core.js` (MODIFY)
- CHANGE `tests/fixtures/vnext12/core.test.js` (MODIFY)
- PRESERVE `scripts/kodjo/fixtures/vnext12/keep.js`

## REQ-9dddc2972fcd3efdc7a4a12b

- disposition: `CHANGE`
- kind: `FUNCTIONAL`
- rationale: INITIAL opérationnel nominal, deux fichiers, une exigence observable.
- impacts:
  - `IMP-8ffc4a063a93d6664a2ddba3`
  - `IMP-dc2c178ee0f91395e50a979b`
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
  "requirement_registry_hash": "f963f1a1e1f062f0152242d995977d8738a41f4a4a86bda189472fdcb144f366",
  "impact_graph_hash": "0fb7bc3e7b17c27e8ecf9a9eda44896464e9d1758b28dc8e3cc2e0778567ff91",
  "candidate_manifest_hash": "aabd74e71c1e4730cf03d04fac510c46c595b7a829d8a411263af79db6de284f",
  "requirement_count": 1,
  "plan_item_count": 1,
  "plan_items": [
    {
      "plan_item_id": "PLAN-1004dfa27a21b3cd2c3e567c",
      "requirement_id": "REQ-9dddc2972fcd3efdc7a4a12b",
      "requirement_kind": "FUNCTIONAL",
      "disposition": "CHANGE",
      "impact_ids": [
        "IMP-8ffc4a063a93d6664a2ddba3",
        "IMP-dc2c178ee0f91395e50a979b"
      ],
      "change_items": [
        {
          "change_id": "CHG-5f3180c5dad3d09ca1de63a9",
          "impact_id": "IMP-8ffc4a063a93d6664a2ddba3",
          "candidate_id": "CAND-be60773f2e3e5a208de31c53",
          "path": "scripts/kodjo/fixtures/vnext12/core.js",
          "change_kind": "MODIFY",
          "intent": "Conserver l’export CommonJS value() ; retourner exactement le nombre 2, sans autre comportement ni dépendance."
        },
        {
          "change_id": "CHG-80526ddf926d41392e24d8d3",
          "impact_id": "IMP-dc2c178ee0f91395e50a979b",
          "candidate_id": "CAND-35e0bb8cab320b2411e4958e",
          "path": "tests/fixtures/vnext12/core.test.js",
          "change_kind": "MODIFY",
          "intent": "Conserver le test Jest et son import direct ; remplacer son attente 1 par 2 ; exécuter ce test puis les checks contractuels."
        }
      ],
      "test_obligations": [
        {
          "test_id": "TEST-9a9b4bc1756bba687548ceeb",
          "target_impact_id": "IMP-dc2c178ee0f91395e50a979b",
          "target_candidate_id": "CAND-35e0bb8cab320b2411e4958e",
          "path": "tests/fixtures/vnext12/core.test.js",
          "action": "ADAPT",
          "covered_change_impact_ids": [
            "IMP-8ffc4a063a93d6664a2ddba3",
            "IMP-dc2c178ee0f91395e50a979b"
          ],
          "expected": "Le test Jest observe value() === 2.",
          "justification": "Vérification directe de la fonction réellement modifiée."
        }
      ],
      "proof_obligations": [
        {
          "proof_id": "PROOF-795c6002c59f2385828b1735",
          "proof_type": "FUNCTIONAL_TEST",
          "target_test_impact_id": "IMP-dc2c178ee0f91395e50a979b",
          "covered_change_impact_ids": [
            "IMP-8ffc4a063a93d6664a2ddba3",
            "IMP-dc2c178ee0f91395e50a979b"
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
        "candidate_id": "CAND-be60773f2e3e5a208de31c53",
        "path": "scripts/kodjo/fixtures/vnext12/core.js",
        "change_kind": "MODIFY"
      },
      {
        "candidate_id": "CAND-35e0bb8cab320b2411e4958e",
        "path": "tests/fixtures/vnext12/core.test.js",
        "change_kind": "MODIFY"
      }
    ],
    "preserve_scope": [
      {
        "candidate_id": "CAND-30ceff46ee0ac607974766df",
        "path": "scripts/kodjo/fixtures/vnext12/keep.js"
      }
    ],
    "forbidden_policy": "ALL_OUTSIDE_WRITE_SCOPE"
  },
  "contract_hash": "03d939de35bef9acdcef79338674b0e567765d6877f56492d647006fa8ce7ace"
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
  "protocol_commit": "7fac320080f83eb74359272b9d039e7b1d8fac5f",
  "scan_revision": "7fac320080f83eb74359272b9d039e7b1d8fac5f",
  "ui_applicable": false,
  "ui_paths": [],
  "criterion_count": 0,
  "matrix_sha256": "7f596a126509d82f5c4105ed7db6b11983ed5ee30b646a07eec99841ae5a40a6"
}
</KODJO_UI_PLAN_CONTRACT_JSON>
<KODJO_VNEXT_SCOPE_JSON>
{
  "schema": "kodjo.vnext.downstream-scope.v1",
  "plan_contract_hash": "03d939de35bef9acdcef79338674b0e567765d6877f56492d647006fa8ce7ace",
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
      "requirement": "La fonction CommonJS value() de scripts/kodjo/fixtures/vnext12/core.js doit retourner exactement le nombre 2 au lieu de 1. Son test Jest direct tests/fixtures/vnext12/core.test.js doit vérifier cette valeur 2. Conserver le fichier scripts/kodjo/fixtures/vnext12/keep.js octet pour octet. Ne modifier que la fonction et son test, sans dépendance supplémentaire, sans UI ni exception native. Il s’agit d’une tranche jetable de qualification VNext-12 ; aucune publication applicative, fusion, activation ou intervention sur PRE-1.\nVNext requirement_id=REQ-9dddc2972fcd3efdc7a4a12b"
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
  "requirement_ids_sha256": "d016df276390e87e0ba4e3655e55eeaae65344e88b38079fe7cb611005b45d28",
  "requirements": [
    {
      "requirement_id": "REQ-89FAC24300A3BF1D",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": ".github/orchestration/vnext12/VNEXT-12-QUALIF/requirement.md",
        "locator": "FULL_FILE",
        "requirement": "La fonction CommonJS value() de scripts/kodjo/fixtures/vnext12/core.js doit retourner exactement le nombre 2 au lieu de 1. Son test Jest direct tests/fixtures/vnext12/core.test.js doit vérifier cette valeur 2. Conserver le fichier scripts/kodjo/fixtures/vnext12/keep.js octet pour octet. Ne modifier que la fonction et son test, sans dépendance supplémentaire, sans UI ni exception native. Il s’agit d’une tranche jetable de qualification VNext-12 ; aucune publication applicative, fusion, activation ou intervention sur PRE-1.\nVNext requirement_id=REQ-9dddc2972fcd3efdc7a4a12b"
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
      "requirement_id": "REQ-89FAC24300A3BF1D",
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
  "planning_envelope_hash": "c995c2e16fc775129ed360447420fe24365af4d4df8f63fdc51fbc02354793bc",
  "source_manifest_hash": "42cf5b68a2e594757b5c577518504359540903f6769e27844382065e34030fba",
  "registry_status": "READY",
  "blocking_reasons": [],
  "source_unit_count": 1,
  "requirement_source_unit_count": 1,
  "requirement_count": 1,
  "requirement_ids_sha256": "1004dfa27a21b3cd2c3e567c0d4df800e732cd0eb18e9731d2b037954875f127",
  "coverage": [
    {
      "source_id": "SRC-a6e97fd61810ad5d225f12d0",
      "unit_id": "UNIT-5c5f964cba18cf3af3c52067",
      "disposition": "REQUIREMENT_SOURCE",
      "requirement_ids": [
        "REQ-9dddc2972fcd3efdc7a4a12b"
      ],
      "coverage_status": "COVERED"
    }
  ],
  "requirements": [
    {
      "requirement_id": "REQ-9dddc2972fcd3efdc7a4a12b",
      "source_id": "SRC-a6e97fd61810ad5d225f12d0",
      "unit_id": "UNIT-5c5f964cba18cf3af3c52067",
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
        "revision": "7fac320080f83eb74359272b9d039e7b1d8fac5f",
        "unit_locator": "FULL_FILE",
        "unit_fingerprint": "4a9e1c9ced7cd6125c65012293f2941f4d24e1d198405f7c111e7443ae92014e",
        "unit_disposition": "REQUIREMENT_SOURCE"
      },
      "related_requirement_ids": [],
      "conflict_ids": []
    }
  ],
  "contract_hash": "f963f1a1e1f062f0152242d995977d8738a41f4a4a86bda189472fdcb144f366"
}
</KODJO_VNEXT_REQUIREMENT_REGISTRY_JSON>

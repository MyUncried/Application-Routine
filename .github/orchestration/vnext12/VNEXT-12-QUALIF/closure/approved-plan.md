# KODJO VNext — Projection transport du plan

application_head=7992c924aa13cd3e6dc495814b9d15a78baf9152
plan_contract_hash=e3bea1e4fcfdf2edd67c9ff666da22a4b1b0d4800c78a26c4f26c36f9b59d903

# KODJO VNext — Plan canonique

- schema: `kodjo.vnext.plan-contract.v1`
- contract_hash: `e3bea1e4fcfdf2edd67c9ff666da22a4b1b0d4800c78a26c4f26c36f9b59d903`
- requirements: 1
- write_scope: 2

## Boundaries

- forbidden_policy: `ALL_OUTSIDE_WRITE_SCOPE`
- CHANGE `scripts/kodjo/fixtures/vnext12/core.js` (MODIFY)
- CHANGE `tests/fixtures/vnext12/core.test.js` (MODIFY)
- PRESERVE `scripts/kodjo/fixtures/vnext12/keep.js`

## REQ-21bc35016ea439b2ad03fdd9

- disposition: `CHANGE`
- kind: `FUNCTIONAL`
- rationale: INITIAL opérationnel nominal, deux fichiers, une exigence observable.
- impacts:
  - `IMP-69bfb567e17ddaccab7eb733`
  - `IMP-df8d142f24c507ef3e4be8d4`
- changes:
  - `tests/fixtures/vnext12/core.test.js` — MODIFY — Conserver le test Jest et son import direct ; remplacer son attente 1 par 2 ; exécuter ce test puis les checks contractuels.
  - `scripts/kodjo/fixtures/vnext12/core.js` — MODIFY — Conserver l’export CommonJS value() ; retourner exactement le nombre 2, sans autre comportement ni dépendance.
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
  "requirement_registry_hash": "6926018180bedd5c6f6416ebfd9d09e5c221385cac1dcdb87d091bc9acc660e6",
  "impact_graph_hash": "52989d05b15f364ddfa5f56db1d3c99e2cbcc779c66beeda816e6c674664ab33",
  "candidate_manifest_hash": "28cb86191ac82a7956d58c0e74c0b317a7c18e9c29c5bc4eec10337c4425a252",
  "requirement_count": 1,
  "plan_item_count": 1,
  "plan_items": [
    {
      "plan_item_id": "PLAN-f91d92e4b8fa8b41f7592a84",
      "requirement_id": "REQ-21bc35016ea439b2ad03fdd9",
      "requirement_kind": "FUNCTIONAL",
      "disposition": "CHANGE",
      "impact_ids": [
        "IMP-69bfb567e17ddaccab7eb733",
        "IMP-df8d142f24c507ef3e4be8d4"
      ],
      "change_items": [
        {
          "change_id": "CHG-7ae5c31edf7e773ab406f54e",
          "impact_id": "IMP-69bfb567e17ddaccab7eb733",
          "candidate_id": "CAND-a025c8e586cdb4d66e443958",
          "path": "tests/fixtures/vnext12/core.test.js",
          "change_kind": "MODIFY",
          "intent": "Conserver le test Jest et son import direct ; remplacer son attente 1 par 2 ; exécuter ce test puis les checks contractuels."
        },
        {
          "change_id": "CHG-fb9902182d74cbcfcca4679d",
          "impact_id": "IMP-df8d142f24c507ef3e4be8d4",
          "candidate_id": "CAND-3f0b5b3a274a0bc9ca7ffbb5",
          "path": "scripts/kodjo/fixtures/vnext12/core.js",
          "change_kind": "MODIFY",
          "intent": "Conserver l’export CommonJS value() ; retourner exactement le nombre 2, sans autre comportement ni dépendance."
        }
      ],
      "test_obligations": [
        {
          "test_id": "TEST-53362229d8eb301c14329a65",
          "target_impact_id": "IMP-69bfb567e17ddaccab7eb733",
          "target_candidate_id": "CAND-a025c8e586cdb4d66e443958",
          "path": "tests/fixtures/vnext12/core.test.js",
          "action": "ADAPT",
          "covered_change_impact_ids": [
            "IMP-69bfb567e17ddaccab7eb733",
            "IMP-df8d142f24c507ef3e4be8d4"
          ],
          "expected": "Le test Jest observe value() === 2.",
          "justification": "Vérification directe de la fonction réellement modifiée."
        }
      ],
      "proof_obligations": [
        {
          "proof_id": "PROOF-9c05ce34bf43a7c23949a9bb",
          "proof_type": "FUNCTIONAL_TEST",
          "target_test_impact_id": "IMP-69bfb567e17ddaccab7eb733",
          "covered_change_impact_ids": [
            "IMP-69bfb567e17ddaccab7eb733",
            "IMP-df8d142f24c507ef3e4be8d4"
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
        "candidate_id": "CAND-3f0b5b3a274a0bc9ca7ffbb5",
        "path": "scripts/kodjo/fixtures/vnext12/core.js",
        "change_kind": "MODIFY"
      },
      {
        "candidate_id": "CAND-a025c8e586cdb4d66e443958",
        "path": "tests/fixtures/vnext12/core.test.js",
        "change_kind": "MODIFY"
      }
    ],
    "preserve_scope": [
      {
        "candidate_id": "CAND-95682c35aafe8ca69ba55514",
        "path": "scripts/kodjo/fixtures/vnext12/keep.js"
      }
    ],
    "forbidden_policy": "ALL_OUTSIDE_WRITE_SCOPE"
  },
  "contract_hash": "e3bea1e4fcfdf2edd67c9ff666da22a4b1b0d4800c78a26c4f26c36f9b59d903"
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
  "protocol_commit": "7992c924aa13cd3e6dc495814b9d15a78baf9152",
  "scan_revision": "7992c924aa13cd3e6dc495814b9d15a78baf9152",
  "ui_applicable": false,
  "ui_paths": [],
  "criterion_count": 0,
  "matrix_sha256": "7f596a126509d82f5c4105ed7db6b11983ed5ee30b646a07eec99841ae5a40a6"
}
</KODJO_UI_PLAN_CONTRACT_JSON>
<KODJO_VNEXT_SCOPE_JSON>
{
  "schema": "kodjo.vnext.downstream-scope.v1",
  "plan_contract_hash": "e3bea1e4fcfdf2edd67c9ff666da22a4b1b0d4800c78a26c4f26c36f9b59d903",
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
      "requirement": "La fonction CommonJS value() de scripts/kodjo/fixtures/vnext12/core.js doit retourner exactement le nombre 2 au lieu de 1. Son test Jest direct tests/fixtures/vnext12/core.test.js doit vérifier cette valeur 2. Conserver le fichier scripts/kodjo/fixtures/vnext12/keep.js octet pour octet. Ne modifier que la fonction et son test, sans dépendance supplémentaire, sans UI ni exception native. Il s’agit d’une tranche jetable de qualification VNext-12 ; aucune publication applicative, fusion, activation ou intervention sur PRE-1.\nVNext requirement_id=REQ-21bc35016ea439b2ad03fdd9"
    },
    "change_targets": [
      "tests/fixtures/vnext12/core.test.js",
      "scripts/kodjo/fixtures/vnext12/core.js"
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
  "requirement_ids_sha256": "b93a53a1e5f9a392c30be480bd616ce237d622178e797d0d837b55d08d243345",
  "requirements": [
    {
      "requirement_id": "REQ-8CF0779C445C35FE",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": ".github/orchestration/vnext12/VNEXT-12-QUALIF/requirement.md",
        "locator": "FULL_FILE",
        "requirement": "La fonction CommonJS value() de scripts/kodjo/fixtures/vnext12/core.js doit retourner exactement le nombre 2 au lieu de 1. Son test Jest direct tests/fixtures/vnext12/core.test.js doit vérifier cette valeur 2. Conserver le fichier scripts/kodjo/fixtures/vnext12/keep.js octet pour octet. Ne modifier que la fonction et son test, sans dépendance supplémentaire, sans UI ni exception native. Il s’agit d’une tranche jetable de qualification VNext-12 ; aucune publication applicative, fusion, activation ou intervention sur PRE-1.\nVNext requirement_id=REQ-21bc35016ea439b2ad03fdd9"
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
      "requirement_id": "REQ-8CF0779C445C35FE",
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
  "planning_envelope_hash": "d09f2b7d30a009c06a84106c4c7de03b86d3332014eb5fc8b18bfce0c5d8dc52",
  "source_manifest_hash": "2b9e3820c0ef10db07fe2f6aefce3db236458bda7be8b58bc9fd16ff944f6f66",
  "registry_status": "READY",
  "blocking_reasons": [],
  "source_unit_count": 1,
  "requirement_source_unit_count": 1,
  "requirement_count": 1,
  "requirement_ids_sha256": "f91d92e4b8fa8b41f7592a84f241033adf609dd59c79fad1955fe8af3ddf804c",
  "coverage": [
    {
      "source_id": "SRC-dd40e7a3be4aa0d71bdaac53",
      "unit_id": "UNIT-28501aeb178cbeae047850ad",
      "disposition": "REQUIREMENT_SOURCE",
      "requirement_ids": [
        "REQ-21bc35016ea439b2ad03fdd9"
      ],
      "coverage_status": "COVERED"
    }
  ],
  "requirements": [
    {
      "requirement_id": "REQ-21bc35016ea439b2ad03fdd9",
      "source_id": "SRC-dd40e7a3be4aa0d71bdaac53",
      "unit_id": "UNIT-28501aeb178cbeae047850ad",
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
        "revision": "7992c924aa13cd3e6dc495814b9d15a78baf9152",
        "unit_locator": "FULL_FILE",
        "unit_fingerprint": "4a9e1c9ced7cd6125c65012293f2941f4d24e1d198405f7c111e7443ae92014e",
        "unit_disposition": "REQUIREMENT_SOURCE"
      },
      "related_requirement_ids": [],
      "conflict_ids": []
    }
  ],
  "contract_hash": "6926018180bedd5c6f6416ebfd9d09e5c221385cac1dcdb87d091bc9acc660e6"
}
</KODJO_VNEXT_REQUIREMENT_REGISTRY_JSON>

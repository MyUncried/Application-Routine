# KODJO VNext — Projection transport du plan

application_head=7f47ebeafdedce768f4678c1921372034ab56500
plan_contract_hash=bdefce306e6f215e5278ff0fadfbda03698b909b1aadf1714709c3cd59efbc7d

# KODJO VNext — Plan canonique

- schema: `kodjo.vnext.plan-contract.v1`
- contract_hash: `bdefce306e6f215e5278ff0fadfbda03698b909b1aadf1714709c3cd59efbc7d`
- requirements: 1
- write_scope: 2

## Boundaries

- forbidden_policy: `ALL_OUTSIDE_WRITE_SCOPE`
- CHANGE `scripts/kodjo/fixtures/vnext12/core.js` (MODIFY)
- CHANGE `tests/fixtures/vnext12/core.test.js` (MODIFY)
- PRESERVE `scripts/kodjo/fixtures/vnext12/keep.js`

## REQ-da8f9b0c8031077b41abd089

- disposition: `CHANGE`
- kind: `FUNCTIONAL`
- rationale: INITIAL opérationnel nominal, deux fichiers, une exigence observable.
- impacts:
  - `IMP-6ef4ec808a85c58d117de014`
  - `IMP-b46cbbafa29dbc022a6e3dbb`
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
  "requirement_registry_hash": "22b4bff7ac90e852020e2a9a80d2673a2b2f633cd042ec94a067888d96a22217",
  "impact_graph_hash": "531f154bf8399489d8849a519e53a1ff86b053517468845477c2ca644f891b70",
  "candidate_manifest_hash": "4a5a5508fa8ea228760cf4c0b6f9149aa757a7f575f8b897003c965bdbc85299",
  "requirement_count": 1,
  "plan_item_count": 1,
  "plan_items": [
    {
      "plan_item_id": "PLAN-e3d458e6192022df6cfc339d",
      "requirement_id": "REQ-da8f9b0c8031077b41abd089",
      "requirement_kind": "FUNCTIONAL",
      "disposition": "CHANGE",
      "impact_ids": [
        "IMP-6ef4ec808a85c58d117de014",
        "IMP-b46cbbafa29dbc022a6e3dbb"
      ],
      "change_items": [
        {
          "change_id": "CHG-0b3ad38cf6b4e2de8626a6f4",
          "impact_id": "IMP-6ef4ec808a85c58d117de014",
          "candidate_id": "CAND-72ec5f86e04c6a8f7578859c",
          "path": "scripts/kodjo/fixtures/vnext12/core.js",
          "change_kind": "MODIFY",
          "intent": "Conserver l’export CommonJS value() ; retourner exactement le nombre 2, sans autre comportement ni dépendance."
        },
        {
          "change_id": "CHG-a8a808a5ccf5c63a6cc379ad",
          "impact_id": "IMP-b46cbbafa29dbc022a6e3dbb",
          "candidate_id": "CAND-6ec2c65051b42042b6a16059",
          "path": "tests/fixtures/vnext12/core.test.js",
          "change_kind": "MODIFY",
          "intent": "Conserver le test Jest et son import direct ; remplacer son attente 1 par 2 ; exécuter ce test puis les checks contractuels."
        }
      ],
      "test_obligations": [
        {
          "test_id": "TEST-1c1c23a5dfbc9fcfeb10bc2d",
          "target_impact_id": "IMP-b46cbbafa29dbc022a6e3dbb",
          "target_candidate_id": "CAND-6ec2c65051b42042b6a16059",
          "path": "tests/fixtures/vnext12/core.test.js",
          "action": "ADAPT",
          "covered_change_impact_ids": [
            "IMP-6ef4ec808a85c58d117de014",
            "IMP-b46cbbafa29dbc022a6e3dbb"
          ],
          "expected": "Le test Jest observe value() === 2.",
          "justification": "Vérification directe de la fonction réellement modifiée."
        }
      ],
      "proof_obligations": [
        {
          "proof_id": "PROOF-0835770ecf0114202dcedc1e",
          "proof_type": "FUNCTIONAL_TEST",
          "target_test_impact_id": "IMP-b46cbbafa29dbc022a6e3dbb",
          "covered_change_impact_ids": [
            "IMP-6ef4ec808a85c58d117de014",
            "IMP-b46cbbafa29dbc022a6e3dbb"
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
        "candidate_id": "CAND-72ec5f86e04c6a8f7578859c",
        "path": "scripts/kodjo/fixtures/vnext12/core.js",
        "change_kind": "MODIFY"
      },
      {
        "candidate_id": "CAND-6ec2c65051b42042b6a16059",
        "path": "tests/fixtures/vnext12/core.test.js",
        "change_kind": "MODIFY"
      }
    ],
    "preserve_scope": [
      {
        "candidate_id": "CAND-41872d225fcb2f760e2f258e",
        "path": "scripts/kodjo/fixtures/vnext12/keep.js"
      }
    ],
    "forbidden_policy": "ALL_OUTSIDE_WRITE_SCOPE"
  },
  "contract_hash": "bdefce306e6f215e5278ff0fadfbda03698b909b1aadf1714709c3cd59efbc7d"
}
</KODJO_VNEXT_PLAN_CONTRACT_JSON>

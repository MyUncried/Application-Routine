# KODJO VNext — Projection transport du plan

application_head=f7350762ce44a593a9cc5c85e2f22d46c4f8ae74
plan_contract_hash=cd9b08ffb365f0c8128f56eef884264c318db5d6a03370da6d60ebdde62a5484

# KODJO VNext — Plan canonique

- schema: `kodjo.vnext.plan-contract.v1`
- contract_hash: `cd9b08ffb365f0c8128f56eef884264c318db5d6a03370da6d60ebdde62a5484`
- requirements: 1
- write_scope: 2

## Boundaries

- forbidden_policy: `ALL_OUTSIDE_WRITE_SCOPE`
- CHANGE `scripts/kodjo/fixtures/vnext12/core.js` (MODIFY)
- CHANGE `tests/fixtures/vnext12/core.test.js` (MODIFY)
- PRESERVE `scripts/kodjo/fixtures/vnext12/keep.js`

## REQ-a99b50399ba259bf28ec11b5

- disposition: `CHANGE`
- kind: `FUNCTIONAL`
- rationale: INITIAL opérationnel nominal, deux fichiers, une exigence observable.
- impacts:
  - `IMP-43c15e27c8e32e1f2a1a13ca`
  - `IMP-e889445a28c8e797456bde91`
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
  "requirement_registry_hash": "ffbb52aed96c13901d9cad9c6632e0ab64ac56ea18b087075d324cae75d0e3f9",
  "impact_graph_hash": "ff2496fe28711963e5975d8e60372d433a93d2ee1ddf6a826cefe9317f506902",
  "candidate_manifest_hash": "662da62f8524be5e72df360358da7e173e9c4fc8412eb296e9b190f1e2960c1f",
  "requirement_count": 1,
  "plan_item_count": 1,
  "plan_items": [
    {
      "plan_item_id": "PLAN-f41dd003abe7d5f542bddad4",
      "requirement_id": "REQ-a99b50399ba259bf28ec11b5",
      "requirement_kind": "FUNCTIONAL",
      "disposition": "CHANGE",
      "impact_ids": [
        "IMP-43c15e27c8e32e1f2a1a13ca",
        "IMP-e889445a28c8e797456bde91"
      ],
      "change_items": [
        {
          "change_id": "CHG-67f6e17c41561aae92a0e861",
          "impact_id": "IMP-43c15e27c8e32e1f2a1a13ca",
          "candidate_id": "CAND-62bbd5ecc4fc22dc7b42157f",
          "path": "tests/fixtures/vnext12/core.test.js",
          "change_kind": "MODIFY",
          "intent": "Conserver le test Jest et son import direct ; remplacer son attente 1 par 2 ; exécuter ce test puis les checks contractuels."
        },
        {
          "change_id": "CHG-79bdc5d448de43c2d06e4998",
          "impact_id": "IMP-e889445a28c8e797456bde91",
          "candidate_id": "CAND-5615de1e896030d87fa3d20a",
          "path": "scripts/kodjo/fixtures/vnext12/core.js",
          "change_kind": "MODIFY",
          "intent": "Conserver l’export CommonJS value() ; retourner exactement le nombre 2, sans autre comportement ni dépendance."
        }
      ],
      "test_obligations": [
        {
          "test_id": "TEST-0ff46cdd833a779fc78d1567",
          "target_impact_id": "IMP-43c15e27c8e32e1f2a1a13ca",
          "target_candidate_id": "CAND-62bbd5ecc4fc22dc7b42157f",
          "path": "tests/fixtures/vnext12/core.test.js",
          "action": "ADAPT",
          "covered_change_impact_ids": [
            "IMP-43c15e27c8e32e1f2a1a13ca",
            "IMP-e889445a28c8e797456bde91"
          ],
          "expected": "Le test Jest observe value() === 2.",
          "justification": "Vérification directe de la fonction réellement modifiée."
        }
      ],
      "proof_obligations": [
        {
          "proof_id": "PROOF-b21210d3f8791b4d88a93769",
          "proof_type": "FUNCTIONAL_TEST",
          "target_test_impact_id": "IMP-43c15e27c8e32e1f2a1a13ca",
          "covered_change_impact_ids": [
            "IMP-43c15e27c8e32e1f2a1a13ca",
            "IMP-e889445a28c8e797456bde91"
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
        "candidate_id": "CAND-5615de1e896030d87fa3d20a",
        "path": "scripts/kodjo/fixtures/vnext12/core.js",
        "change_kind": "MODIFY"
      },
      {
        "candidate_id": "CAND-62bbd5ecc4fc22dc7b42157f",
        "path": "tests/fixtures/vnext12/core.test.js",
        "change_kind": "MODIFY"
      }
    ],
    "preserve_scope": [
      {
        "candidate_id": "CAND-0636dfbdbb718bf31dd64265",
        "path": "scripts/kodjo/fixtures/vnext12/keep.js"
      }
    ],
    "forbidden_policy": "ALL_OUTSIDE_WRITE_SCOPE"
  },
  "contract_hash": "cd9b08ffb365f0c8128f56eef884264c318db5d6a03370da6d60ebdde62a5484"
}
</KODJO_VNEXT_PLAN_CONTRACT_JSON>

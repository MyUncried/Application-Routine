# KODJO VNext — Projection transport du plan

application_head=070722462d9ac6edb797072e9c74c4817dee0601
plan_contract_hash=a0058e265238f489a8e3f15db8b11a68ee7365298973b3f20dc684cea0a1c3b4

# KODJO VNext — Plan canonique

- schema: `kodjo.vnext.plan-contract.v1`
- contract_hash: `a0058e265238f489a8e3f15db8b11a68ee7365298973b3f20dc684cea0a1c3b4`
- requirements: 1
- write_scope: 2

## Boundaries

- forbidden_policy: `ALL_OUTSIDE_WRITE_SCOPE`
- CHANGE `scripts/kodjo/fixtures/vnext12/core.js` (MODIFY)
- CHANGE `tests/fixtures/vnext12/core.test.js` (MODIFY)
- PRESERVE `scripts/kodjo/fixtures/vnext12/keep.js`

## REQ-ba9620fed4ab08b9da7579ae

- disposition: `CHANGE`
- kind: `FUNCTIONAL`
- rationale: INITIAL opérationnel nominal, deux fichiers, une exigence observable.
- impacts:
  - `IMP-7814a465eb9e746d2a70f5e9`
  - `IMP-808104c371b98d7509421dd1`
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
  "requirement_registry_hash": "9f37f47185f9edbbffa1b127c68d304294625cea396c1a4a10ae3d8aa4a524be",
  "impact_graph_hash": "5c7c80a825f07a59ce6bef7d00d8034cea01f4cd58e4fa37a20b32d99c5518c0",
  "candidate_manifest_hash": "cbc78dc6302f45342ed699e14b18748278d97c50a01a656c86e768368d573f56",
  "requirement_count": 1,
  "plan_item_count": 1,
  "plan_items": [
    {
      "plan_item_id": "PLAN-77155becd16868a6ecd2a3ee",
      "requirement_id": "REQ-ba9620fed4ab08b9da7579ae",
      "requirement_kind": "FUNCTIONAL",
      "disposition": "CHANGE",
      "impact_ids": [
        "IMP-7814a465eb9e746d2a70f5e9",
        "IMP-808104c371b98d7509421dd1"
      ],
      "change_items": [
        {
          "change_id": "CHG-01e2c75893a62998f2d4035d",
          "impact_id": "IMP-7814a465eb9e746d2a70f5e9",
          "candidate_id": "CAND-8c35fcefd6b9b68bf24422be",
          "path": "tests/fixtures/vnext12/core.test.js",
          "change_kind": "MODIFY",
          "intent": "Conserver le test Jest et son import direct ; remplacer son attente 1 par 2 ; exécuter ce test puis les checks contractuels."
        },
        {
          "change_id": "CHG-f90c04f10369340338c827a3",
          "impact_id": "IMP-808104c371b98d7509421dd1",
          "candidate_id": "CAND-7ead98a505d571b06c78013d",
          "path": "scripts/kodjo/fixtures/vnext12/core.js",
          "change_kind": "MODIFY",
          "intent": "Conserver l’export CommonJS value() ; retourner exactement le nombre 2, sans autre comportement ni dépendance."
        }
      ],
      "test_obligations": [
        {
          "test_id": "TEST-f8666a90a6855491d17361f1",
          "target_impact_id": "IMP-7814a465eb9e746d2a70f5e9",
          "target_candidate_id": "CAND-8c35fcefd6b9b68bf24422be",
          "path": "tests/fixtures/vnext12/core.test.js",
          "action": "ADAPT",
          "covered_change_impact_ids": [
            "IMP-7814a465eb9e746d2a70f5e9",
            "IMP-808104c371b98d7509421dd1"
          ],
          "expected": "Le test Jest observe value() === 2.",
          "justification": "Vérification directe de la fonction réellement modifiée."
        }
      ],
      "proof_obligations": [
        {
          "proof_id": "PROOF-4c3cb07b929ed1aae8421f08",
          "proof_type": "FUNCTIONAL_TEST",
          "target_test_impact_id": "IMP-7814a465eb9e746d2a70f5e9",
          "covered_change_impact_ids": [
            "IMP-7814a465eb9e746d2a70f5e9",
            "IMP-808104c371b98d7509421dd1"
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
        "candidate_id": "CAND-7ead98a505d571b06c78013d",
        "path": "scripts/kodjo/fixtures/vnext12/core.js",
        "change_kind": "MODIFY"
      },
      {
        "candidate_id": "CAND-8c35fcefd6b9b68bf24422be",
        "path": "tests/fixtures/vnext12/core.test.js",
        "change_kind": "MODIFY"
      }
    ],
    "preserve_scope": [
      {
        "candidate_id": "CAND-1cb705f7d0fc5290b3c5755c",
        "path": "scripts/kodjo/fixtures/vnext12/keep.js"
      }
    ],
    "forbidden_policy": "ALL_OUTSIDE_WRITE_SCOPE"
  },
  "contract_hash": "a0058e265238f489a8e3f15db8b11a68ee7365298973b3f20dc684cea0a1c3b4"
}
</KODJO_VNEXT_PLAN_CONTRACT_JSON>

# Mission d’implémentation — VNEXT-12-QUALIF

plan_contract_hash=f45c4079a5a6e5e8248254361b6ff29d710290af8ec66f2b432ae913771317c2
application_head=eef6fb596c36301047ae90afbd31adbf2d401391
operation_kind=IMPLEMENT
execution_context={"mode":"LOCAL","writer_id":"CLAUDE:kodjo-local-vnext12"}
checks=jest,typescript,lint

## Autorisation

Implémenter exclusivement le périmètre autorisé par l’ExecutionRequest VNext.
Aucun élargissement de scope n’est autorisé.
Le scope opposable de transport est exactement :
- scripts/kodjo/fixtures/vnext12/core.js
- tests/fixtures/vnext12/core.test.js

Tout besoin hors scope doit arrêter l’exécution avant modification.
Toute substitution native sans autorisation explicite doit arrêter en NATIVE_PRIMITIVE_EXCEPTION_REQUIRED avant code.

## Plan exact approuvé à exécuter

Lire le plan opposable .github/orchestration/vnext12/VNEXT-12-QUALIF/revision/technical-plan.md avant toute modification. Sa projection exacte suit.
Le plan impose les intentions, tests, preuves et préservations. Arrêter en CLARIFICATION_REQUIRED si une exigence est ambiguë.
# KODJO VNext — Plan canonique

- schema: `kodjo.vnext.plan-contract.v1`
- contract_hash: `f45c4079a5a6e5e8248254361b6ff29d710290af8ec66f2b432ae913771317c2`
- requirements: 1
- write_scope: 2

## Boundaries

- forbidden_policy: `ALL_OUTSIDE_WRITE_SCOPE`
- CHANGE `scripts/kodjo/fixtures/vnext12/core.js` (MODIFY)
- CHANGE `tests/fixtures/vnext12/core.test.js` (MODIFY)
- PRESERVE `scripts/kodjo/fixtures/vnext12/keep.js`

## REQ-89c66c1ecde9af2eab690454

- disposition: `CHANGE`
- kind: `FUNCTIONAL`
- rationale: INITIAL opérationnel nominal, deux fichiers, une exigence observable.
- impacts:
  - `IMP-046f3acfe7d0c96ac01aa1b5`
  - `IMP-60c307cec02ea51e7fee54ae`
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
  "requirement_registry_hash": "cb51f1d07b29f6821bf404a8c5d5fb424a4c53f10d65a3d74c09deeb1701665d",
  "impact_graph_hash": "48551ea66b0b2a75d5cd8c284682e189c6b31ab4a06c70817470afaeab959381",
  "candidate_manifest_hash": "0cf61ef6b00ebff88f1513ad87faede9e9f4131104689721c59ad0a89bcf3d1c",
  "requirement_count": 1,
  "plan_item_count": 1,
  "plan_items": [
    {
      "plan_item_id": "PLAN-965deb457ef4787e7151f10e",
      "requirement_id": "REQ-89c66c1ecde9af2eab690454",
      "requirement_kind": "FUNCTIONAL",
      "disposition": "CHANGE",
      "impact_ids": [
        "IMP-046f3acfe7d0c96ac01aa1b5",
        "IMP-60c307cec02ea51e7fee54ae"
      ],
      "change_items": [
        {
          "change_id": "CHG-4fb98d794110bdede604093d",
          "impact_id": "IMP-60c307cec02ea51e7fee54ae",
          "candidate_id": "CAND-d1a7429a923f9848c28ebe64",
          "path": "tests/fixtures/vnext12/core.test.js",
          "change_kind": "MODIFY",
          "intent": "Conserver le test Jest et son import direct ; remplacer son attente 1 par 2 ; exécuter ce test puis les checks contractuels."
        },
        {
          "change_id": "CHG-75fdcd96ec207091c8a95db5",
          "impact_id": "IMP-046f3acfe7d0c96ac01aa1b5",
          "candidate_id": "CAND-befd34bd0b0f345009825240",
          "path": "scripts/kodjo/fixtures/vnext12/core.js",
          "change_kind": "MODIFY",
          "intent": "Conserver l’export CommonJS value() ; retourner exactement le nombre 2, sans autre comportement ni dépendance."
        }
      ],
      "test_obligations": [
        {
          "test_id": "TEST-d9c2ec7d482a80fc3ec98622",
          "target_impact_id": "IMP-60c307cec02ea51e7fee54ae",
          "target_candidate_id": "CAND-d1a7429a923f9848c28ebe64",
          "path": "tests/fixtures/vnext12/core.test.js",
          "action": "ADAPT",
          "covered_change_impact_ids": [
            "IMP-046f3acfe7d0c96ac01aa1b5",
            "IMP-60c307cec02ea51e7fee54ae"
          ],
          "expected": "Le test Jest observe value() === 2.",
          "justification": "Vérification directe de la fonction réellement modifiée."
        }
      ],
      "proof_obligations": [
        {
          "proof_id": "PROOF-33f9f82049431db44d14339e",
          "proof_type": "FUNCTIONAL_TEST",
          "target_test_impact_id": "IMP-60c307cec02ea51e7fee54ae",
          "covered_change_impact_ids": [
            "IMP-046f3acfe7d0c96ac01aa1b5",
            "IMP-60c307cec02ea51e7fee54ae"
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
        "candidate_id": "CAND-befd34bd0b0f345009825240",
        "path": "scripts/kodjo/fixtures/vnext12/core.js",
        "change_kind": "MODIFY"
      },
      {
        "candidate_id": "CAND-d1a7429a923f9848c28ebe64",
        "path": "tests/fixtures/vnext12/core.test.js",
        "change_kind": "MODIFY"
      }
    ],
    "preserve_scope": [
      {
        "candidate_id": "CAND-195ce94734f3e1d628576d0e",
        "path": "scripts/kodjo/fixtures/vnext12/keep.js"
      }
    ],
    "forbidden_policy": "ALL_OUTSIDE_WRITE_SCOPE"
  },
  "contract_hash": "f45c4079a5a6e5e8248254361b6ff29d710290af8ec66f2b432ae913771317c2"
}
</KODJO_VNEXT_PLAN_CONTRACT_JSON>

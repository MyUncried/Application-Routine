# Mission d’implémentation — VNEXT-12-QUALIF

plan_contract_hash=659b9a1d0d38a86c56fd03e34a392df95c30e3212087209aeaa6b0201cd027f2
application_head=b8f871001f21ecf6f3444479f845bc9aae59e5a3
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

Lire le plan opposable .github/orchestration/vnext12/VNEXT-12-QUALIF/initial/technical-plan.md avant toute modification. Sa projection exacte suit.
Le plan impose les intentions, tests, preuves et préservations. Arrêter en CLARIFICATION_REQUIRED si une exigence est ambiguë.
# KODJO VNext — Plan canonique

- schema: `kodjo.vnext.plan-contract.v1`
- contract_hash: `659b9a1d0d38a86c56fd03e34a392df95c30e3212087209aeaa6b0201cd027f2`
- requirements: 1
- write_scope: 2

## Boundaries

- forbidden_policy: `ALL_OUTSIDE_WRITE_SCOPE`
- CHANGE `scripts/kodjo/fixtures/vnext12/core.js` (MODIFY)
- CHANGE `tests/fixtures/vnext12/core.test.js` (MODIFY)
- PRESERVE `scripts/kodjo/fixtures/vnext12/keep.js`

## REQ-a59a20f44ccd33046665de8a

- disposition: `CHANGE`
- kind: `FUNCTIONAL`
- rationale: INITIAL opérationnel nominal, deux fichiers, une exigence observable.
- impacts:
  - `IMP-ae55aefcf42e48d2843ff80d`
  - `IMP-bda57b0afcef1a38a5d42404`
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
  "requirement_registry_hash": "78d87a1f4e9b898278a053e3a255cb1d2c12c8352830f1294697894e813b4e9f",
  "impact_graph_hash": "57fef8411e423b3810b6bb189a0cf333acd279fa9d8d1307fd2fdb57936bccdc",
  "candidate_manifest_hash": "1d96844fc9913945fce9f9b11cc75f4542b6966dcfcbefa787fd257c876bd9d6",
  "requirement_count": 1,
  "plan_item_count": 1,
  "plan_items": [
    {
      "plan_item_id": "PLAN-d085d8e9609fdfd5d59e738a",
      "requirement_id": "REQ-a59a20f44ccd33046665de8a",
      "requirement_kind": "FUNCTIONAL",
      "disposition": "CHANGE",
      "impact_ids": [
        "IMP-ae55aefcf42e48d2843ff80d",
        "IMP-bda57b0afcef1a38a5d42404"
      ],
      "change_items": [
        {
          "change_id": "CHG-38c91642674f09eb8ec02eba",
          "impact_id": "IMP-bda57b0afcef1a38a5d42404",
          "candidate_id": "CAND-7b6ef3e51b31f6837a942e53",
          "path": "tests/fixtures/vnext12/core.test.js",
          "change_kind": "MODIFY",
          "intent": "Conserver le test Jest et son import direct ; remplacer son attente 1 par 2 ; exécuter ce test puis les checks contractuels."
        },
        {
          "change_id": "CHG-8a743e9421fef962de7cdadd",
          "impact_id": "IMP-ae55aefcf42e48d2843ff80d",
          "candidate_id": "CAND-98c3779601e132e1149b427b",
          "path": "scripts/kodjo/fixtures/vnext12/core.js",
          "change_kind": "MODIFY",
          "intent": "Conserver l’export CommonJS value() ; retourner exactement le nombre 2, sans autre comportement ni dépendance."
        }
      ],
      "test_obligations": [
        {
          "test_id": "TEST-5a9287ded57cdfd838d1ed46",
          "target_impact_id": "IMP-bda57b0afcef1a38a5d42404",
          "target_candidate_id": "CAND-7b6ef3e51b31f6837a942e53",
          "path": "tests/fixtures/vnext12/core.test.js",
          "action": "ADAPT",
          "covered_change_impact_ids": [
            "IMP-ae55aefcf42e48d2843ff80d",
            "IMP-bda57b0afcef1a38a5d42404"
          ],
          "expected": "Le test Jest observe value() === 2.",
          "justification": "Vérification directe de la fonction réellement modifiée."
        }
      ],
      "proof_obligations": [
        {
          "proof_id": "PROOF-f8efa894f4eb2fdce0b4b922",
          "proof_type": "FUNCTIONAL_TEST",
          "target_test_impact_id": "IMP-bda57b0afcef1a38a5d42404",
          "covered_change_impact_ids": [
            "IMP-ae55aefcf42e48d2843ff80d",
            "IMP-bda57b0afcef1a38a5d42404"
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
        "candidate_id": "CAND-98c3779601e132e1149b427b",
        "path": "scripts/kodjo/fixtures/vnext12/core.js",
        "change_kind": "MODIFY"
      },
      {
        "candidate_id": "CAND-7b6ef3e51b31f6837a942e53",
        "path": "tests/fixtures/vnext12/core.test.js",
        "change_kind": "MODIFY"
      }
    ],
    "preserve_scope": [
      {
        "candidate_id": "CAND-98b0062be9bfd9f74afeaa20",
        "path": "scripts/kodjo/fixtures/vnext12/keep.js"
      }
    ],
    "forbidden_policy": "ALL_OUTSIDE_WRITE_SCOPE"
  },
  "contract_hash": "659b9a1d0d38a86c56fd03e34a392df95c30e3212087209aeaa6b0201cd027f2"
}
</KODJO_VNEXT_PLAN_CONTRACT_JSON>

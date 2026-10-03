# Mission d’implémentation — VNEXT-12-QUALIF

plan_contract_hash=03d939de35bef9acdcef79338674b0e567765d6877f56492d647006fa8ce7ace
application_head=7fac320080f83eb74359272b9d039e7b1d8fac5f
operation_kind=IMPLEMENT
execution_context={"mode":"LOCAL","writer_id":"CLAUDE:kodjo-local-vnext12"}
checks=jest,typescript,lint
Rapport obligatoire: lire les contrats UI et NON_UI du plan opposable. Produire KODJO_IMPLEMENTATION_CONFORMANCE avec criteria (vide si aucun critere UI), et KODJO_REQUIREMENT_CONFORMANCE avec chaque requirement_id NON_UI du KODJO_REQUIREMENT_CONTRACT_JSON, sans omission ni nouvel identifiant.
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

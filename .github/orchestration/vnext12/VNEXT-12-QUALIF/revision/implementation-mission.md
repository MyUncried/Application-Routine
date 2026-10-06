# Mission d’implémentation — VNEXT-12-QUALIF

plan_contract_hash=e3bea1e4fcfdf2edd67c9ff666da22a4b1b0d4800c78a26c4f26c36f9b59d903
application_head=7992c924aa13cd3e6dc495814b9d15a78baf9152
operation_kind=IMPLEMENT
execution_context={"mode":"LOCAL","writer_id":"CLAUDE:kodjo-local-vnext12"}
checks=jest,typescript,lint
Rapport obligatoire: lire les contrats UI et NON_UI du plan opposable. Produire KODJO_IMPLEMENTATION_CONFORMANCE avec criteria (vide si aucun critere UI), et KODJO_REQUIREMENT_CONFORMANCE avec chaque requirement_id NON_UI du KODJO_REQUIREMENT_CONTRACT_JSON, sans omission ni nouvel identifiant.
Si le plan contient figma_references : lire le bloc exact KODJO_VNEXT_UI_ATOMICITY_JSON ; consulter les captures et ressources de KODJO_VNEXT_FIGMA_READ_JSON et respecter les predicates de chaque assertion. Leur hash doit rester celui de la reference approuvee. La lecture seule n’est pas une preuve de conformite. Ne pas convertir les exemples Figma en regles metier ; toute ambiguite mixte reste CLARIFICATION_REQUIRED.
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

Lire le plan opposable .github/orchestration/vnext12/VNEXT-12-QUALIF/revision/technical-plan.md avant toute modification. Sa projection exacte suit.
Le plan impose les intentions, tests, preuves et préservations. Arrêter en CLARIFICATION_REQUIRED si une exigence est ambiguë.
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

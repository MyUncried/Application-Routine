[KODJO_V2] PLAN_OUTPUT
slice_id=V2-E2E-20260919
bootstrap_path=.github/orchestration/v2-slices/V2-E2E-20260919/slice-bootstrap.json
source_head=55a5b618181b98fde7d52684a975d5b4af2b3bb9
planning_mode=INITIAL
planning_contract=kodjo.plan-impact.v1
ui_planning_contract=kodjo.ui-plan-criteria.v1
STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW

# Plan technique — qualification jetable de `sumNonNegativeIntegers`

## Références et état de départ

- Issue : #212.
- Slice : `V2-E2E-20260919`.
- Référence immuable : `55a5b618181b98fde7d52684a975d5b4af2b3bb9`.
- Sources normatives : `planning-mission.md` et `.github/orchestration/v2-slices/V2-E2E-20260919/qualification-spec.md`.
- La planification est en mode lecture seule. Aucun fichier ne doit être créé ou modifié à cette étape.
- La PR future sera jetable, ne sera jamais fusionnée dans `main` et ne donnera lieu à aucun déploiement Routine ou Routine Dev.

## Périmètre d’écriture

L’implémentation future créera exclusivement les deux fichiers suivants :

- `tests/kodjo-prod-qualif/e2e-sum.ts`
- `tests/kodjo-prod-qualif/e2e-sum.test.ts`

Aucun fichier `src/**` ou `app/**`, aucune configuration, aucun script, aucun package, aucune dépendance et aucune documentation ne doit être modifié. Le périmètre d’impact direct est limité à la fonction créée et au test qui l’importe ; aucun consommateur produit existant n’est ajouté ou modifié.

## Conception technique

### `tests/kodjo-prod-qualif/e2e-sum.ts`

Créer et exporter uniquement la fonction demandée :

```ts
sumNonNegativeIntegers(values: readonly number[]): number
```

L’algorithme proposé est volontairement local et sans dépendance :

1. Initialiser le total à `0`.
2. Parcourir `values` sans modifier le tableau reçu.
3. Pour chaque valeur, vérifier qu’elle est un entier sûr et qu’elle est supérieure ou égale à zéro. Toute valeur non finie, négative, fractionnaire ou hors de l’intervalle des entiers sûrs provoque un `RangeError`.
4. Ajouter la valeur au total puis vérifier que le total reste un entier sûr. Un dépassement de `Number.MAX_SAFE_INTEGER` provoque un `RangeError`.
5. Retourner le total, notamment `0` pour un tableau vide.

Le contrôle peut s’appuyer sur `Number.isSafeInteger`; aucun message d’erreur particulier n’est ajouté au contrat. Aucune validation ou API supplémentaire concernant des types qui ne sont pas couverts par la signature TypeScript n’est requise.

### `tests/kodjo-prod-qualif/e2e-sum.test.ts`

Créer une suite Jest réelle qui importe uniquement `./e2e-sum`. Le test ne doit importer aucun module de `src/**` ou `app/**`, ne doit pas mocker la fonction testée et doit vérifier les résultats et les exceptions produites par l’implémentation réelle.

Les assertions d’exception porteront sur le type `RangeError`, sans figer un message qui ne fait pas partie du contrat.

## Critères d’acceptation

1. `sumNonNegativeIntegers([])` retourne `0`.
2. Un tableau de zéros est accepté et retourne `0`.
3. `[1, 2, 3]` retourne `6`.
4. `[Number.MAX_SAFE_INTEGER]` est accepté et retourne exactement `Number.MAX_SAFE_INTEGER`.
5. Toute valeur négative provoque un `RangeError`.
6. Toute valeur fractionnaire provoque un `RangeError`.
7. `NaN`, `Infinity` et `-Infinity` provoquent chacun un `RangeError`.
8. Une valeur entière hors de l’intervalle sûr provoque un `RangeError`.
9. Une addition dont le résultat dépasse `Number.MAX_SAFE_INTEGER` provoque un `RangeError`, même lorsque chaque opérande est individuellement valide.
10. Le tableau fourni reste identique après un calcul réussi ; l’implémentation ne le trie pas, ne le réécrit pas et ne le remplace pas.
11. La signature publique reste limitée à `readonly number[]` vers `number`, sans export ou comportement additionnel.

## Tests

Le fichier de test exact à créer et à exécuter est :

- `tests/kodjo-prod-qualif/e2e-sum.test.ts`

Il devra contenir au minimum les cas Jest suivants :

| Cas | Données | Preuve attendue |
|---|---|---|
| Tableau vide | `[]` | résultat `0` |
| Zéros | `[0, 0, 0]` | résultat `0` |
| Addition normale | `[1, 2, 3]` | résultat `6` |
| Borne acceptée | `[Number.MAX_SAFE_INTEGER]` | résultat égal à `Number.MAX_SAFE_INTEGER` |
| Préservation | tableau mutable contenant des entiers valides, avec copie avant appel | résultat correct puis égalité du tableau avec sa copie initiale |
| Négatif | `[-1]` | `RangeError` |
| Fractionnaire | `[1.5]` | `RangeError` |
| Non-nombre fini | `[NaN]` | `RangeError` |
| Infini positif | `[Infinity]` | `RangeError` |
| Infini négatif | `[-Infinity]` | `RangeError` |
| Entier non sûr | `[Number.MAX_SAFE_INTEGER + 1]` | `RangeError` |
| Dépassement de somme | `[Number.MAX_SAFE_INTEGER, 1]` | `RangeError` |

Les exemples invalides doivent être testés séparément afin de démontrer chaque branche normative et d’éviter qu’un seul cas ne masque une catégorie non vérifiée.

## Vérifications techniques et preuves attendues

Après implémentation, sans modifier les configurations existantes :

1. Exécuter le test ciblé avec Jest, par exemple `npm test -- --runInBand tests/kodjo-prod-qualif/e2e-sum.test.ts`, et conserver la sortie réelle.
2. Exécuter la suite Jest du dépôt avec `npm test -- --runInBand` pour vérifier l’absence de régression observable.
3. Exécuter `npx tsc --noEmit`. Le `tsconfig.json` inclut les fichiers TypeScript sous `tests/**`, ce qui doit vérifier les deux nouveaux fichiers en mode strict.
4. Exécuter le lint existant du dépôt avec `npm run lint`, puis vérifier explicitement les deux chemins avec la configuration ESLint existante si la sortie du script ne les énumère pas. Aucune modification de `eslint.config.js` n’est autorisée.
5. Vérifier le diff et son périmètre avec `git diff --check` et une inspection des chemins modifiés : seuls `tests/kodjo-prod-qualif/e2e-sum.ts` et `tests/kodjo-prod-qualif/e2e-sum.test.ts` doivent apparaître.
6. Confronter le rapport d’implémentation au contenu réel des fichiers, au diff et aux sorties de commandes lors de la contre-revue indépendante F12. Un rapport indiquant un statut global positif ne remplacera pas ces preuves.

Le chemin de test n’est pas le répertoire ignoré `/e2e/` de Jest : `kodjo-prod-qualif` doit donc rester collectable par la configuration actuelle. Les scripts, dépendances et configurations existants doivent rester inchangés. Si un environnement empêche réellement une commande, le blocage et la commande concernée devront être rapportés explicitement ; une vérification non exécutée ne devra pas être déclarée réussie.

## Préservation et exclusions

- Préserver tous les fichiers existants et tous les comportements de l’application.
- Ne créer aucun import depuis `src/**` ou `app/**`.
- Ne créer aucun écran, composant, API produit, dépendance ou changement de configuration.
- Ne pas ajouter de validation runtime hors du contrat demandé comme nouveau choix produit.
- Ne pas ajouter d’exigence `VISUAL_COMPARE` ou `DEVICE_CHECK` : cette qualification est purement fonctionnelle et sans interface utilisateur.
- Ne pas effectuer de changement EAS, Routine ou Routine Dev.
- Conserver les invariants d’admission, d’identité, de provenance, de consommation durable et de revue du workflow.

Aucune clarification fonctionnelle ou technique ne reste nécessaire pour soumettre ce plan à la revue indépendante puis à l’approbation utilisateur exacte.



### scope_allow machine

```text
tests/kodjo-prod-qualif/e2e-sum.test.ts
tests/kodjo-prod-qualif/e2e-sum.ts
```

<KODJO_MODIFIED_MODULES_JSON>
[
  {
    "path": "tests/kodjo-prod-qualif/e2e-sum.ts",
    "change": "CREATE"
  },
  {
    "path": "tests/kodjo-prod-qualif/e2e-sum.test.ts",
    "change": "CREATE"
  }
]
</KODJO_MODIFIED_MODULES_JSON>
<KODJO_UI_CRITERIA_MATRIX_JSON>
{"schema":"kodjo.ui-criteria.v1","criteria":[],"preservation":{"preserve":[],"change":[],"forbidden":[]}}

</KODJO_UI_CRITERIA_MATRIX_JSON>
PLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW


<KODJO_PLAN_IMPACT_JSON>
{
  "schema": "kodjo.plan-impact.v1",
  "scan_revision": "55a5b618181b98fde7d52684a975d5b4af2b3bb9",
  "scan_sha256": "ea857cad0d299fcef6cfe83b40ab80473ed89095f75984f10c3014cd0d51dd52",
  "modified_modules": [
    {
      "path": "tests/kodjo-prod-qualif/e2e-sum.test.ts",
      "change": "CREATE"
    },
    {
      "path": "tests/kodjo-prod-qualif/e2e-sum.ts",
      "change": "CREATE"
    }
  ],
  "rows": [
    {
      "path": "tests/kodjo-prod-qualif/e2e-sum.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "tests/kodjo-prod-qualif/e2e-sum.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    }
  ],
  "scope_allow": [
    "tests/kodjo-prod-qualif/e2e-sum.test.ts",
    "tests/kodjo-prod-qualif/e2e-sum.ts"
  ]
}
</KODJO_PLAN_IMPACT_JSON>

<KODJO_UI_PLAN_CONTRACT_JSON>
{
  "schema": "kodjo.ui-plan-contract.v1",
  "contract_version": 1,
  "protocol_commit": "850b6f3145c41499a022c863e93a606d5e28964d",
  "scan_revision": "55a5b618181b98fde7d52684a975d5b4af2b3bb9",
  "ui_applicable": false,
  "ui_paths": [],
  "criterion_count": 0,
  "matrix_sha256": "7db352a09e755ed120e0b37e7e00864da089bdb53c2cdce940506ad78381f8fe"
}
</KODJO_UI_PLAN_CONTRACT_JSON>

<KODJO_PLAN_CONTRACT_JSON>
{
  "schema": "kodjo.plan-contract-consistency.v2",
  "contract_version": 2,
  "protocol_commit": "850b6f3145c41499a022c863e93a606d5e28964d",
  "scan_revision": "55a5b618181b98fde7d52684a975d5b4af2b3bb9",
  "write_scope": [
    "tests/kodjo-prod-qualif/e2e-sum.test.ts",
    "tests/kodjo-prod-qualif/e2e-sum.ts"
  ],
  "required_test_writes": [
    "tests/kodjo-prod-qualif/e2e-sum.test.ts",
    "tests/kodjo-prod-qualif/e2e-sum.ts"
  ]
}
</KODJO_PLAN_CONTRACT_JSON>

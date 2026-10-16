# Séparation des instructions — clone `KODJO-OPENSPEC-DOCS`

Ce dossier documente la séparation, **propre à ce clone et à la branche `docs/openspec-revision`**, entre :

1. les **exigences produit** (comportements, calculs, sources de vérité documentaires, contraintes techniques produit) — [`EXIGENCES-PRODUIT.md`](EXIGENCES-PRODUIT.md) ;
2. les **obligations d’orchestration VNext** (machine à états, relais ChatGPT, `PLAN_APPROVED`, runners, Work, PRE-x, rapports de mission VNext) — [`ORCHESTRATION-VNEXT.md`](ORCHESTRATION-VNEXT.md), **non actives** dans ce chantier.

## Pourquoi

Le `CLAUDE.md` racine du dépôt (base `main` `6656fefc58330955f5ad74d513ce616ea51809b0`) importe `@docs/AGENTS.md`, `@.github/AI_ORCHESTRATION.md` et `@.github/AI_ORCHESTRATION_CONTINUITY.md`, et contient lui-même des règles VNext. Ce chantier de révision documentaire OpenSpec est indépendant : il ne doit avoir aucun raccordement à BMAD ni à VNext, tout en respectant les exigences produit.

## Ce qui a été fait

| Élément | Traitement | Empreinte Git (blob) à la base |
|---|---|---|
| `CLAUDE.md` racine | **Remplacé dans ce clone** par une version OpenSpec. Original conservé à l’identique dans [`originaux/CLAUDE.md`](originaux/CLAUDE.md). | `61761a5df82d36788836c39d9e9f25dfa6464468` |
| `docs/AGENTS.md` | Inchangé. Toujours importé (consigne Expo, non VNext). | `0e6bc801ce6b38319ab05d7516a52d659ac17b98` |
| `.github/AI_ORCHESTRATION.md` | Inchangé, **plus importé** par le `CLAUDE.md` de ce clone. Exigences produit qu’il contient recopiées avec citation dans `EXIGENCES-PRODUIT.md`. | `6c2c7877066873b0bfaf347a3a850c44e8c07e32` |
| `.github/AI_ORCHESTRATION_CONTINUITY.md` | Inchangé, **plus importé**. Purement orchestration. | `e720630a1cdb07e79325e073a7b92ee7d3bd10cf` |

Vérification : `git diff 6656fefc -- .github/ docs/AGENTS.md` doit rester vide sur cette branche.

## Règle de fusion

Le `CLAUDE.md` de cette branche est **spécifique à ce clone**. Il ne doit pas être fusionné tel quel dans `main` : une éventuelle intégration du chantier OpenSpec dans `main` exige une décision explicite d’Hermann sur le sort des instructions VNext. Restaurer l’original : `cp openspec/instructions/originaux/CLAUDE.md CLAUDE.md`.

## Règle de lecture

- En cas de doute sur une exigence produit, la source citée dans `EXIGENCES-PRODUIT.md` fait foi, pas la recopie.
- Aucune règle VNext n’est supprimée ni affaiblie dans le dépôt : elle est seulement hors du contexte d’instructions de ce chantier.

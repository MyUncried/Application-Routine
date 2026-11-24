# PROG-CAT-01 — intégration documentaire sur `main` (préparée, non appliquée)

Règle `.claude/rules/synchronisation-code-documentation.md`, « Cas particulier : source normative absente de la branche » : la
spécification Programme et D-543 à D-552 n'existent que sur `main` (PR #447). Les décisions de Hermann du 21/11/2026 (classe B,
D-553 à D-559) sont préparées en patch contre `main`.

- Patch : `integration-documentaire-main.patch` (registre ch07, spécification Programme §2 à §5, ch13 CE-PROG-01 à 03 et
  CE-PRF-01, ch04 « Le Programme »). Formulations d'origine conservées, annotations datées entre crochets.
- Vérification : `git apply --check` réussi sur `origin/main` `fe7d71d6` (21/11/2026).
- Application : sur décision de Hermann (branche documentaire depuis `main`, puis PR).

[Appliqué le 24/11/2026 dans la consolidation (`integration/consolidation-20261124`) : le patch ne s'appliquait plus au registre ; spécification, ch04 et ch13 appliqués par `git apply` après renumérotation, registre porté à la main. D-553 à D-559 → D-570 à D-576.]

# VNEXT ARCHITECTURE COMPLETENESS / FAILURE-MODE AUDIT

Audit d'architecture anticipé, distinct de la qualification finale. Lecture seule.
Ne pas rouvrir #250/#252 ni auditer globalement le protocole historique. Aucun
résultat de cette mission n'est un gate supplémentaire pour PRE-1. Aucune
recommandation ne devient automatiquement une exigence. Aucun APPROVE final.

Le candidat exact figure en fin de prompt. Les outils autorisés sont Read,
Glob et Grep ; aucune écriture, aucun shell ni réseau. Les tests de contrat ont
été exécutés dans les jobs Linux et Windows du même run. Cela ne prouve aucun
E2E GitHub, modèle, device, publication, recovery ou cutover. Classer toute
sonde non exécutée NON VERIFIABLE, sans la transformer en défaut démontré.

Lire en priorité :

- `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md` ;
- `.github/orchestration/KODJO_VNEXT_PRE1_COVERAGE.md` ;
- `.github/orchestration/KODJO_VNEXT_ANTI_REGRESSION_MATRIX.md` ;
- `scripts/kodjo/lib/vnext-*.js` et leur fermeture locale de dépendances ;
- `scripts/kodjo/lib/audit-convergence-contract.js`, `review-contract.js`,
  `revision-contract.js`, `approval-handoff-contract.js` ;
- les tests `tests/kodjo/vnext-*.pilot.js` et le workflow du présent audit.

Chercher activement les angles morts : machine à états ; identité/hash/scope ;
convergence et stabilité des réserves ; preuve indisponible/défaut/ambiguïté ;
réouverture causale ; préservation ; approbation exacte ; permissions et secrets ;
code arbitraire hors scanner ; transport LF/CRLF ; producteur/consommateur ;
publication/recovery/replay/rerun ; interruptions/runner/quota ; coexistence ;
cutover/rollback/retrait des workflows et runs legacy ; dépendances V2 cachées ;
protections seulement contractuelles et hypothèses non exercées. Vérifier
notamment si une absence d'intégration permet de contourner un nouveau contrat.

Le registre historique 165 incidents / 138 tests est un inventaire, pas une
preuve de couverture individuelle. Utiliser ses classes de risques pour
challenger VNext sans refaire l'audit de #250/#252. Ne déclarer aucune ligne
historique conforme sur la seule cardinalité ou disparition d'un workflow.

Pour chaque constat : identifiant stable par règle/cible ; classe parmi
VIOLATION_EXISTANTE / TROU_ARCHITECTURAL / PREUVE_MANQUANTE / RECOMMANDATION /
PREFERENCE ; règle normative exacte ; fichiers/lignes ; preuve effectivement
observée ; sévérité générale ; nécessité pour ce lot et cette phase ; correction
minimale ; test de fermeture ; risque de régression. Distinguer les observations
de lecture des reproductions exécutées. Signaler les décisions structurantes
réellement nouvelles. Ne réinventer aucune règle pour obtenir un verdict.

Conclusion : lacunes empêchant VNext-12, lacunes réservées au cutover,
recommandations facultatives. Ne lancer aucune correction, revue ou reprise.

# Mission de planification — V2-E2E-20260919

PLAN_ONLY / PLANNING_AUTHORIZED ; implémentation NON autorisée à cette étape.
Issue #212 ; dépôt MyUncried/Application-Routine ; source immuable 55a5b618181b98fde7d52684a975d5b4af2b3bb9 ; bootstrap .github/orchestration/v2-slices/V2-E2E-20260919/slice-bootstrap.json.

Produire le premier plan technique via le workflow V2 INITIAL existant. Appliquer la spécification qualification-spec.md liée par le bootstrap, et vérifier les configurations Jest, TypeScript et ESLint fournies parmi ses sources. Le bootstrap conserve la version d’identité 0.6.12 ; le protocole courant et ses addenda restent applicables.

Le seul périmètre d’écriture envisagé est :
- tests/kodjo-prod-qualif/e2e-sum.ts
- tests/kodjo-prod-qualif/e2e-sum.test.ts

Nommer ces deux chemins exacts dans modified_modules et dans le plan ; nommer le fichier de test exact dans la section Tests. Aucun fichier src/**, app/**, composant UI, configuration, package ou documentation ne doit être modifié par l’implémentation. Ne pas créer les fichiers pendant la planification.

Décrire les critères d’acceptation de la fonction sumNonNegativeIntegers, les cas invalides et limites, les tests réels et la préservation de l’entrée, sans ajouter d’API ou de comportement au contrat fixé. Aucun nouveau choix produit ne reste à arbitrer. Les sources décrivent une fonction sans UI : matrice UI vide, aucune exigence VISUAL_COMPARE ou DEVICE_CHECK. Aucun EAS ni changement de Routine/Routine Dev.

Examiner le périmètre d’impact direct sans inventer de dépendances dans le produit. Les deux nouveaux fichiers ne sont importés par aucun consommateur existant ; le nouveau test importe seulement la fonction jetable. Les scripts et configurations existants sont conservés. Si les preuves révèlent un véritable blocage, le nommer explicitement plutôt que déclarer un contrôle non exécuté comme PASS.

Le plan sera soumis à une revue indépendante puis à l’approbation utilisateur exacte avant Lean Queue et Claude. La PR applicative reste jetable et ne sera pas fusionnée. Le rapport IMPLEMENT devra être confronté au diff, au code et aux résultats réels par la contre-revue F12 ; ni le format du rapport ni un statut global vert ne suffisent à cette preuve.

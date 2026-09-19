# Spécification de qualification jetable — V2-E2E-20260919

Source : issue #212, campagne E2E autorisée par l’utilisateur. Ce document ne constitue pas un PLAN_APPROVED.

## Périmètre
Créer exclusivement tests/kodjo-prod-qualif/e2e-sum.ts et tests/kodjo-prod-qualif/e2e-sum.test.ts. Aucun import depuis src/** ou app/** ; aucune dépendance, aucun écran, aucun changement fonctionnel du produit.

## Contrat fonctionnel
Exporter sumNonNegativeIntegers(values: readonly number[]): number.
- Tableau vide : 0.
- Accepter les entiers sûrs positifs ou nuls ; [1,2,3] donne 6.
- Lancer RangeError pour toute valeur non finie, négative, fractionnaire ou hors entier sûr, et pour toute somme hors entier sûr.
- Ne pas modifier le tableau reçu.
- Le contrat TypeScript fixe le domaine d’entrée à un tableau de nombres ; aucune nouvelle API ni validation d’autres types n’est demandée.

## Preuves attendues
Tests Jest réels dans le fichier exact : tableau vide, zéros, addition, borne Number.MAX_SAFE_INTEGER acceptée, valeurs négatives, fractionnaires, NaN, +Infinity, -Infinity, entier non sûr et dépassement de somme. Vérifier la préservation du tableau. Jest, TypeScript et lint doivent collecter et vérifier les deux fichiers sans modifier leur configuration.

## Parcours et limites
PLAN initial produit par le workflow V2 existant ; contre-revue indépendante ; approbation utilisateur liée au plan exact avant toute implémentation ; admission Lean Queue ; exécution Claude ; PR jetable ; contre-revue du rapport IMPLEMENT confronté au code, au diff et aux tests (F12).
La PR applicative jetable ne sera jamais fusionnée dans main. Aucun déploiement Routine ou Routine Dev. Aucune exigence visuelle/device pour cette fonction sans UI. Aucun ancien plan, gate ou revue réutilisé.

## Préservation
Préserver l’ensemble des autres fichiers, les comportements produit existants et tous les invariants d’admission, d’identité, de provenance, de consommation durable et de revue. Le correctif protocolaire de #211 est intégré avant cette campagne.

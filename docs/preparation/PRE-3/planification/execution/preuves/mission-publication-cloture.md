# PRE-3 #340 — dernière publication avant fusion

## Autorité et cible

Hermann a validé PRE-3 intégralement le12/10 à23:52:48 Paris, puis demandé au pilote sa clôture à23:53:45. La décision exacte est `validation-finale-proprietaire.json`. La PR de livraison existante est **#351**, branche `feat/pre3-exercice-20261009`. Aucun nouvel objet, aucune évolution suivante, aucun correctif du protocole.

Reprendre cette branche depuis la tête distante vérifiée ; préserver le worktree et ses éventuels changements locaux. Ne pas réutiliser une tête locale périmée.

## Pourquoi ce dernier relais

La revue de clôture de ChatGPT a exécuté 1970 assertions vertes, mais le processus Jest quittait avec1 : rappels d'animations après destruction de l'environnement dans ExecutionParametersSheet.test.tsx et CatalogueScreen.test.tsx. La cause est conservée dans le rapport de clôture. Deux effets démarrent une animation sans nettoyage. Le pilote ajoute seulement `return () => animation.stop()` après le démarrage de ces deux animations :
- `src/features/activities/ExecutionParametersSheet.tsx` ;
- `src/shared/ui/SegmentedControl.tsx`.

Aucun durée, rendu, champ, donnée, clavier, texte ou comportement de sélection n'est changé. Ce nettoyage arrête l'animation à la disparition du composant et avant le remplacement d'un effet. Aucun délai ajouté, aucune exception ignorée, aucune assertion supprimée, aucun --forceExit.

## Travail autorisé, jusqu'au résultat

1. Vérifier indépendamment ce **seul correctif de nettoyage**, ses consommateurs et les résultats publiés. Les constats REV-01..06 sont traités dans le rapport ; ne pas rouvrir toute la conception ni les lignes de recette validées. Signaler un défaut causal précis si constaté.
2. Vérifier le dossier propre et la tête distante. Publier les éventuelles preuves documentaires nécessaires sans force ; aucun commit local laissé sans statut explicite.
3. Classifier la compatibilité avec le build Routine Dev8 et la dernière OTA29d149bd. Le delta de nettoyage est JavaScript seulement : utiliser le mécanisme existant de publication **OTA review** si confirmé compatible. Aucun nouveau build natif gratuit, aucune modification VNext.
4. Exécuter la publication depuis le commit exact, attendre son succès et vérifier le manifeste servi, `gitCommitHash`, identifiant et assets comme lors des publications précédentes. Ne pas déclarer réussi sur la seule soumission.
5. Publier `publication-ota-cloture.json`, `verification-ota-cloture.json` et un rapport `.github/orchestration/reports/YYYY-MM-DD_PRE3-340_PUBLICATION-CLOTURE.md`. Identifier le SHA exact, l'OTA, le build compatible, le statut, les erreurs et les limites.
6. Retourner les liens GitHub et Expo au pilote. Si une permission/authentification bloque, conserver les preuves et donner le refus exact ; pas de contournement ni relance automatique.

Aucune commande PowerShell à transférer à Hermann. L'authentification Expo existe sur son poste ; le pilote ChatGPT n'a ni cet accès ni un outil de dispatch EAS/reprise de cette session locale.

## Frontière de livraison

Cette publication met le code destiné à la fusion à disposition ; elle ne demande pas de refaire la recette intégrale déjà validée. La présence de la nouvelle OTA doit être vérifiable par l'écran de diagnostic. Ne pas affirmer qu'elle est exécutée sur l'iPhone sans observation.

Ne pas fusionner ni fermer #340 dans cette mission : ChatGPT vérifiera la CI de #351 et la publication, puis fusionnera et publiera le registre final. Ne pas auto-déclarer une clôture canonique VNext.

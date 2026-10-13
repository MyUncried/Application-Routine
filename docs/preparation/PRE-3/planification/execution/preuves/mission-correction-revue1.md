# PRE3-340 — correction après première revue indépendante

## Mission exécutable

Même branche `feat/pre3-exercice-20261009`, même #340, écrivain Claude Code local unique. Référence examinée `96c46c7447aee1697f2dd2670b1952d51cca2928`, plan approuvé `43e7b344`. Lire le rapport `.github/orchestration/reports/2026-10-10_PRE3-340_REVUE-IMPLEMENTATION-1.md`, puis exécuter cette mission depuis la tête distante qui le contient. Aucun développement concurrent à lancer, aucune modification VNext/V2, aucune fusion.

Il s'agit de corriger la livraison existante, pas de refaire le plan, de réduire PRE-3 ou de lancer une campagne d'audit du protocole. Conserver les preuves et rapports précédents.

## Résultats attendus avant code

- REV-01 : la réserve d'un autre mode ne devient jamais une cible active ; restauration correcte du mode précédent, N/pauses/bip/order conservés, ✕ annule et ✓ ne conserve que l'effectif valide.
- REV-02 : à N=1 effectif uniforme, le total proposé par le contrôle ouvert est effectivement appliqué selon l'inversion ; remontée de N, restauration et sauvegarde cohérentes. Aucun bouton actif sans effet.
- REV-03 : une sélection A,B,C reste dans cet ordre après échec/réessai d'A/B/C, sauf réordonnancement explicite utilisateur ; aucun doublon ni perte. Préservation des fichiers et ordre SQLite après sauvegarde/réouverture.
- REV-04 : deux suites existantes adaptées au vrai parcours et aux providers, sans supprimer leurs contrats de persistance/atomicité/position/double-appui/Continuer. Suite complète verte.
- REV-05 : le texte Photos couvre Profil et médias d'Exercice, aucune caméra/micro ajoutée ; contrôle de configuration générée avant nouvelle build native.
- REV-06 : corriger les écarts aux sources, produire les comparaisons rendues pertinentes, sans les remplacer par du code inspection ou une acceptation globale propriétaire.

## Portée et adaptations minimales

Conserver le write_scope Git du plan approuvé et son contrôle. Le pilote identifie pour cette correction une **extension technique bornée** pour :

1. `src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx` — harnais et gestes, assertions de préservation conservées ;
2. `src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx` — idem ;
3. `app.json` — texte de permission Photos uniquement.

Documenter séparément cette extension dans le rapport et le diff. Ne pas modifier le plan figé ni falsifier le PASS du contrôle original : celui-ci peut signaler ces trois chemins. Vérifier chaque chemin contre le scope original plus cette liste explicite, et vérifier que toute autre divergence est absente. Tout chemin supplémentaire requis pour une fidélité Figma démontrée doit être identifié précisément avec justification et consommateurs avant élargissement ; pas de refonte partagée générale. Les preuves et le rapport de mission restent dans les chemins documentaires déjà autorisés.

## Travail et tests

Lire intégralement les sources normatives pertinentes, les décisions R-1/R-2 et les instructions du dépôt. Avant code Expo, relire les docs exactes SDK 57. Ne pas corriger seulement les trois exemples : examiner les transitions croisées et les mêmes écritures dans les quatre parcours.

La preuve indépendante `revue-independent-transitions.repro.tsx` contient des tests adversariaux intentionnellement rouges sur 96c46c7447aee1697f2dd2670b1952d51cca2928. Conserver leurs attendus ; les relancer explicitement avec la commande du rapport. Ajouter les régressions exhaustives dans les vraies suites propriétaires ; ne pas s'en tenir au fichier de preuve. Le succès des trois exemples ne vaut pas conformité de la tranche.

Relancer tsc, lint applicatif, toute la suite Jest (y compris les deux intégrations), SQL réel/migrations/copies/médias, calculs indépendants/276 phrases, tests de consommateurs et vérificateur du plan. Conserver et expliquer tous les échecs ; aucune suppression silencieuse d'assertions. Vérifier le diff de portée avant chaque publication.

Pour les comparaisons rendues : utiliser un environnement produit réellement disponible, sans nouvelle extraction globale Figma. Si aucun simulateur/appareil/environnement de rendu pertinent n'est disponible, indiquer le blocage exact et préparer le candidat installable/version + commande de build et procédure bornée ; ne pas annoncer de validation visuelle. Ne demander à Hermann ni tests SQLite ni calculs. Caméra/permissions/rendu natif réel ne sont pas attestés par Jest.

## Publication et point d'arrêt

Avancer jusqu'au candidat corrigé et testé, publier sans force sur la même branche, commandes Git séparées et contrôle de la tête distante. Rapports/preuves versionnés, couverture des 23 exigences et écarts restants individualisés. Rapport obligatoire sous `.github/orchestration/reports/2026-10-10_PRE3-340_CORRECTION-REVUE1.md`. Vérifier que la branche publiée contient tous les commits.

Ne pas se déclarer APPROVE, ne pas fusionner, ne pas clôturer #340. Retour GitHub pour seconde passe indépendante, sans copier-coller de JSON. Si une permission/authentification ou un moyen de rendu/build manque, conserver le travail et donner un blocage précis. Une seule question fonctionnelle si une décision véritablement nouvelle subsiste après lecture des sources ; pas de réouverture des règles closes.

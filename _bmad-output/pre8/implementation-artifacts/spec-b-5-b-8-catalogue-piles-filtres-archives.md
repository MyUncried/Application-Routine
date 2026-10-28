# Stories B.5 à B.8 — Piles, actions glissées, filtres et archives du Catalogue des Mouvements

> Statut : done. Arbitrages de Hermann du 27/10/2026 (« Arbitrages Catalogue des Mouvements et poursuite A/B », puis « Arbitrage définitif Q3 »), consignés au chapitre 07. Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101` : `10266:20575` (piles), `10471:23291` (pile déployée), `10475:47634` (actions glissées), `10462:23370` (filtres), `10465:23141` (filtre actif), `10495:24054` (archivage refusé), `10495:24099` et `10496:23705` (Archivés), `10500:23772` (suppression).

## B.5 — Piles et déploiement

- Pile : famille d'au moins deux membres affichés ; rang le plus haut en tête (Q-B2) ; épaisseur décorative sous la carte du dessus.
- Toucher une pile fermée la déplie (membres en rang décroissant, trait de famille à gauche) ; dépliée, chaque carte ouvre sa fiche.
- Un seul membre affiché : carte simple, avec sa pastille au rang de la famille complète.
- `movementCatalogueView.ts` (pur), `MovementCatalogueList.tsx`.

## B.6 — Actions glissées

- `SwipeActionsRow.tsx` : même mécanisme que la carte de Composition (responder natif en capture, révélation progressive, seuils et animation de `compositionGesture.ts` et `compositionMotion.ts`), sans déplacement par appui long. Actions aussi accessibles par VoiceOver (actions d'accessibilité).
- Carte active : Partager (grisé, inerte), Créer une variante (déploie Plus facile / Plus difficile, puis `/movement?variantOf=…&placement=…`, parcours B.2 existant), Archiver.
- Carte archivée : Restaurer, Supprimer.

## B.7 — Recherche et filtres

- Feuille `MovementFilterSheet.tsx` : Statut, Niveaux, Utilisation, Catégories (actives), Zones ; ✓ applique, ✕ ferme sans appliquer, Réinitialiser vide le brouillon.
- Règles (Q1, Q2, Q4, Q3 définitif) : statut d'abord (défaut Actifs) ; OU dans un groupe, ET entre groupes ; Catégories et Zones : au moins une valeur commune ; une pile s'affiche avec tous ses membres autorisés dès qu'un membre autorisé correspond ; aucun filtre autre que Statut ne rend visible un archivé ; indépendants filtrés seuls ; recherche ET filtres.
- Filtres conservés pendant la session (état de `CatalogueScreen`), perdus au relancement. Filtrer actif sur le seul segment Mouvements ; résumé « N filtres ». Trier grisé.

## B.8 — Archivage, restauration, suppression

- `migration015` : `movements.archived_at`, additive. `DATABASE_VERSION = 15`.
- Archivage refusé tant qu'un Exercice persisté référence le Mouvement (Séance active ou archivée) : dialogue « Archivage impossible — Ce mouvement est utilisé par N exercices… », rien n'est écrit.
- Archivé : famille, position et rangs inchangés (Q5) ; restauration à l'identique (Q7) ; annulation immédiate de l'archivage et de la restauration (snackbar « Annuler », Q8) ; suppression définitive depuis les Archives, confirmée, sans annulation ni cascade, refusée si encore référencé.
- Q6 : un archivé n'est plus proposé dans la recherche à la création d'un Exercice (`useMovementOriginChoice`) ni sélectionnable dans le menu Niveau d'un Exercice (`ExerciseScreen`) ; il reste compté par le contrôle d'unicité du nom.

## Choix techniques à valider par Hermann (sans nouvelle règle fonctionnelle)

- **Exercices du Catalogue** (`activity_definitions`, en attendant l'Epic E) : comptés comme Exercices persistés pour le refus d'archivage et de suppression (intégrité des références ; ils deviendront des Séances à un exercice, Q-E1).
- **Repli d'une pile dépliée** : par le trait de famille, à gauche (Figma le montre ; son effet n'est pas écrit).
- **Fiche d'un Mouvement archivé** : consultation seule (ni crayon, ni ajout de niveau), comme une Séance archivée non modifiable ; on restaure depuis les Archives.
- **Libellés non fournis** : snackbars « Mouvement archivé » / « Mouvement restauré » (transposés de « Séance archivée ») ; refus de suppression « Suppression impossible — Ce mouvement est utilisé par N exercices. » ; résumé de la commande « N filtres ».
- **Couleurs des actions glissées** : Partager (grisé), Créer une variante (gris secondaire), Archiver (orange `warning`), Restaurer (indigo `selection`), Supprimer (rouge `danger`), d'après Figma, tokens existants.

## Recette automatique

- `movementCatalogueView.b7.test.ts` (6), `MovementFilterSheet.b7.test.tsx` (2), `MovementCatalogueList.b5.test.tsx` (7, remplace `MovementCatalogueList.b3.test.tsx`, liste plate supplantée), `movementLifecycle.b8.test.ts` (7), `migration015.test.ts` (3), `MovementScreen.b2.integration.test.tsx` (+2 : Q6, fiche archivée), `CatalogueScreen.test.tsx` (+1 : Filtrer sur Mouvements seulement).

## Non développé

- Tri (aucune règle), Partager (nouveau), réordonnancement des familles depuis la pile (Figma `10480:23374`, `10484:23428`, hors lot), C08.

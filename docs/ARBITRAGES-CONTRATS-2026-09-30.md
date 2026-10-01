# Clôture des réserves des contrats — arbitrages clos

## Rappel personnalisé — maximum validé

Le 30 septembre 2026, réponse « A » : délai maximal du rappel personnalisé « Autre » = 24 heures avant l’occurrence planifiée. Contrôle et design existants conservés. Propagé au contrat CE-UI-05 et à D-243.

## Pause de sécurité sans réponse — précision dérivée

Le chapitre 08 prévoit une suspension et un choix Reprendre/Arrêter. Sans réponse, l’exécution reste suspendue, son état est conservé et le temps n’avance plus. Aucun délai supplémentaire d’arrêt automatique n’est ajouté. Aucun nouvel arbitrage utilisateur nécessaire.

Contrainte utilisateur : conserver le design, les shells, composants, dispositions et parcours déjà validés. Ne soumettre que les contradictions fonctionnelles réellement non résolues.

## Progression globale — validé par l’utilisateur

Le 30 septembre 2026, réponse « A » : conserver la barre existante et corriger son calcul pour couvrir toutes les étapes du plan. Réserver une part aux étapes non chronométrées ; répartir le reste entre les phases chronométrées proportionnellement à leur durée. La part non chronométrée est acquise à sa validation, la part chronométrée avec le temps. La progression atteint 100 % uniquement à la fin du plan.

Statut : décision propagée au registre, à la formule de progression et aux contrats.

## Transition entre côtés — précision explicite de l’utilisateur

Le 30 septembre 2026 : « Si il y a une pause de changement de côté on ne compte pas la pause entre les séries au changement de côté, sinon on la compte ».

À la transition entre côtés, appliquer la pause de changement de côté si elle est positive ; sinon appliquer la pause entre Séries. Aucun cumul de ces deux pauses à la transition. La réponse de l’assistant précise que cette règle s’applique aussi au passage anticipé vers le second côté. Les pauses entre Séries internes à chaque côté restent inchangées.

Conséquence dérivée pour la durée intrinsèque bilatérale : 2 × (N × d + (N − 1) × pS) + (pC si pC > 0, sinon pS). Propager aussi à l’estimation en Répétitions et au calcul inverse du nombre de Séries. Cette précision révise la formule antérieure D-208/D-232/v10.2 qui omettait la pause de transition lorsque pC = 0.

Statut : décision propagée aux formules principales et aux contrats.

## Fréquence — validée le 01/10/2026

Réponse utilisateur « 12 » : fréquence entière comprise entre 1 et 12 semaines incluses.

## Consolidation

Les décisions sont propagées dans les contrats §6 et D-241 à D-245, les formules principales et la règle RM-077. Les captures et le design ne sont pas modifiés. Aucune recette applicative n’est revendiquée. Les limites de preuve visuelle V-01 à V-12 restent distinctes des arbitrages fonctionnels clos.

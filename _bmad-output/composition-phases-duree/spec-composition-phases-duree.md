# Composition — durée de série et phases du mouvement (spec du lot)

Ouvert le 09/11/2026 sur décision de Hermann (« 2. Oui » à « Faut-il l'ouvrir dans un lot Composition ? »), à partir du constat d) de la recette iPhone PRE-10 n° 1 (cahier en ligne https://claude.ai/artifact/Mp9Tu1rPiRdfebmKfpf8Tq). Branche `composition-phases-duree`, créée depuis `pre10-bmad/dev` (`d0c4a85a`).

## Décision

Texte de Hermann (constat d, 09/11/2026) : « Si un objectif en durée est inférieur à la durée totale des phases, il faut un message d'alerte. Si ce n'est pas un multiple il faut un message et demander s'il faut arrondir la valeur au multiple supérieur ou inférieur (appliquer le même mécanisme à la durée totale). »

Arbitrages du même jour (questions de Claude, réponses de Hermann) :

| Question | Réponse |
|---|---|
| À quel moment afficher l'alerte et la question d'arrondi ? | « À la saisie » : dès que la valeur est validée au clavier, et à nouveau au ✓ si une phase a changé depuis. |
| Une durée inférieure à la somme des phases doit-elle bloquer l'enregistrement ? | « Bloquante » : message rouge sous la valeur, ✓ indisponible tant que la durée n'atteint pas un motif complet. |
| Une durée non multiple du motif : quels choix proposer ? | « Inférieur / Supérieur » : deux choix seulement ; la valeur doit devenir un multiple. |

Enregistrée au registre : **D-514** (ch07).

## Livré

| Élément | Module |
|---|---|
| Calcul : `phaseCycleFit(cible, motif)` (OK / BELOW / NOT_MULTIPLE avec multiples encadrants) et `phaseCycleIssues(paramètres)` (rangs inférieurs, rangs non multiples) | `src/domain/activities/phaseCycleFit.ts` |
| Feuille Paramètres d'exécution : message « La durée de la série est inférieure à la durée des phases du mouvement (…). » sous le cadre Séries (place et style du message EMOM), valeur en rouge, ✓ indisponible ; alerte native `Alert.alert` « Arrondir la durée de la série ? » à la sortie d'une Cible (commune ou par série) non multiple, et au ✓ si une durée est restée non multiple (phase modifiée), deux boutons « Arrondir à … » | `src/features/activities/ExecutionParametersSheet.tsx`, `src/shared/i18n/index.ts` |

Primitive native : alerte iOS (`Alert`), aucune réimplémentation.

## Synchronisation code / documentation

| Comportement | Classe | Documents |
|---|---|---|
| Durée de série inférieure au motif : signalée, enregistrement bloqué | B | D-514 (ch07) ; PHC-20261026 et la même formulation dans ch03, ch04, ch05, ch07, ch08, ch09, ch10 (×2), ch11, ch12, ch13 annotées « Remplacé le 09/11/2026 … D-514 » ; ch03 l. 259 annotée |
| Durée non multiple : alerte d'arrondi inférieur / supérieur, à la saisie et au ✓ | B | idem |
| Multiple supérieur au-delà de 58′55″ : seul l'arrondi inférieur proposé | D | borne existante de la Cible (D-430) ; aucun document |
| Motif incomplet ou hors bornes, Répétitions, À l'échec : aucun contrôle | A | PHC-20261026 (le motif ne s'applique qu'aux phases complètes ; la somme hors bornes est déjà signalée sur ses cellules) |

## À CLARIFIER

1. **« appliquer le même mécanisme à la durée totale »** : la Durée de l'exercice est saisie par inversion (story 3.7) ; elle conserve la durée de série et recalcule le nombre de séries, avec le message d'ajustement existant. La durée de série restant contrôlée par D-514, l'inversion ne peut pas produire une série incohérente. Aucun contrôle supplémentaire sur la Durée de l'exercice n'a été ajouté : la durée totale comprend les pauses et n'a pas de multiple naturel du motif. Confirmer cette lecture, ou préciser le multiple attendu pour la Durée de l'exercice.
2. **Séances déjà enregistrées** : une durée de série existante incohérente avec ses phases n'est signalée qu'à l'ouverture de la feuille (message, ✓ indisponible) ; la carte de la Composition n'est pas marquée « Paramètres à compléter ». Faut-il la marquer ?

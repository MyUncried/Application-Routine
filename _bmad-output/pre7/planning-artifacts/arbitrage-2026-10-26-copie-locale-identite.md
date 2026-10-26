# Arbitrage de Hermann du 26/10/2026 — copie d'un Exercice local et identité du geste (recette JA, point 2)

> Remplace le choix conservateur du commit `f99c3f95` (`settlePendingLocalCopies` : nouveau Mouvement automatique dès que le contenu de la copie diffère), que Hermann ne valide pas.

## Décision de Hermann (verbatim)

Je ne valide pas la création automatique d'un nouveau mouvement dès que le contenu de la copie est modifié.

La duplication conserve le même mouvement et crée des paramètres d'exécution indépendants. Une modification du contenu peut être une correction partagée : applique le dialogue prévu par D-445, sans déduire automatiquement une nouvelle identité.

Distingue aussi la structure et les libellés des phases, portés par le mouvement, de leurs durées, portées par les paramètres d'exécution. Changer ces durées ne doit jamais créer un mouvement.

Le fait que la séance soit encore en brouillon ne change pas ces principes : conserve l'identité partagée dans le brouillon et rends explicite le choix entre correction partagée et création distincte avant persistance.

Enfin, explique où est porté le suffixe « (copie) ». Il ne doit ni renommer le mouvement partagé ni entraîner sa duplication automatique. Si sa conservation exige un nom propre à l'exercice distinct du nom du mouvement, ne crée pas ce nouveau mécanisme implicitement.

## Précisions établies avec Hermann

- Le dialogue visé est celui de **MFN-08** (ch10 l.408-436 ; D-447 couvre B1–B10). Libellés retenus : « Corriger ce geste / En faire un geste distinct / Annuler » (variante « création sur geste repris », Figma `9952:44349`). [libellés remplacés par ceux de D-445 C03 : « Mettre à jour ce mouvement / Créer un nouveau mouvement / Annuler », ou « Annuler / Confirmer » — voir la correction ci-dessous]
- Déclencheurs : ceux de MFN-08 (nom, description, média, structure des phases), appliqués à la copie en attente dans le brouillon. Durées de phases et autres paramètres : jamais de dialogue ni de nouveau Mouvement.
- Suffixe « (copie) » : nom propre de l'occurrence (colonne `activities.name`, mécanisme existant, ch10 MFN-09 l.448). Il reste non éditable (l.448) ; il ne renomme pas le Mouvement. Défaut à corriger : si la source locale est supprimée avant l'enregistrement, le Mouvement créé depuis la copie doit prendre le nom sans suffixe de copie. [remplacé par l’arbitrage Q3 de Hermann du 26/10/2026 : le suffixe est un attribut d’occurrence non éditable (numéro de copie), affiché après le nom du mouvement ; plus de nom propre de l’occurrence (D-445 C05)]
- « En faire un geste distinct » : la copie reçoit son propre Mouvement à l'enregistrement de la Séance. [libellé remplacé par « Créer un nouveau mouvement » (D-445 C03)]
- **« Corriger ce geste » dans le brouillon — réponse A de Hermann** : la correction devient le contenu du geste, et l'original local (non enregistré) ainsi que les autres copies en attente du même geste dans ce brouillon la reprennent. Exception limitée au brouillon, justifiée parce que le geste n'existe encore que dans ce brouillon ; MFN-08 l.426 (pas de synchronisation des occurrences déjà posées) reste inchangé pour tout ce qui est enregistré. [caduc : contredit par la correction de Hermann ci-dessous (« ce n’est pas une exception ») ; le contenu du mouvement est partagé (D-445 C05)]

## Correction de Hermann (26/10/2026, verbatim) — remplace les précisions ci-dessus sur le dialogue et l'« exception »

Je valide A : « Corriger ce geste » applique la correction à l'original et à sa copie dans le brouillon, sans modifier leurs paramètres d'exécution respectifs.
Ce n'est pas une exception : vérifie ta version de MFN-08 et intègre D-445, publiée sur main par la PR #397. Le contenu du mouvement est désormais partagé ; l'ancienne interdiction de synchroniser les copies ne doit pas être réintroduite. N'ajoute pas de mécanisme particulier pour ce cas.

Conséquences : le dialogue et ses libellés sont ceux de D-445 de `main` (C03 : « Mettre à jour ce mouvement / Créer un nouveau mouvement / Annuler » si le nom change ; confirmation simple ou sauvegarde silencieuse sinon), et non l'ancien MFN-08 (« Corriger ce geste / En faire un geste distinct ») ; la mention « exception limitée au brouillon » et la référence à MFN-08 l.426 ci-dessus sont caduques. La copie garde le même mouvement ; son contenu est celui du mouvement partagé (D-445 C05).
# KODJO Protocol V2 — addendum normatif 0.6.24

La présente version supersède 0.6.23 pour les règles ci-dessous. Toutes les autres règles restent applicables.

## A. Séparation du périmètre restauré et du périmètre de mutation

En `RESUME_DELTA`, deux ensembles ont des autorités distinctes :

- le **périmètre restauré** est la liste exacte `paths` du paquet immuable du run source ;
- le **périmètre de mutation** est `scope_allow`, dérivé du plan approuvé pour la correction courante.

Le paquet est accepté uniquement si sa provenance (tranche, session, baseline, run), son empreinte, son intégrité, sa migration certifiée et son applicabilité atomique sont valides. Ses chemins sont relatifs, exacts, uniques et doivent correspondre exactement aux chemins déclarés par le patch. Aucun motif générique du paquet n'est interprété comme une autorisation.

Après restauration et avant l'appel externe, le superviseur empreinte le delta restauré. Après l'appel, il calcule les fichiers réellement modifiés depuis cet état. Chacun de ces fichiers doit appartenir à `scope_allow`. Un fichier simplement restauré peut rester hors de `scope_allow`; s'il est ensuite modifié, créé, supprimé ou ramené à la baseline, il consomme le périmètre de mutation et est refusé s'il n'y appartient pas.

Le paquet cumulatif suivant contient l'union exacte du delta restauré et des mutations autorisées. Le diagnostic durable publie `recovery_scope_paths`, `mutation_scope_allow` et `agent_mutation_files`.

## B. Double référence de planification

Une révision de plan portant sur une livraison applicative non fusionnée lie séparément :

- `source_head` : HEAD exact de la branche cible, utilisé pour le protocole et les sources produit courantes ;
- `application_pr` et `application_head` : PR ouverte, branche cible et HEAD exact vérifiés via GitHub, utilisés pour inventorier et scanner le code et les tests.

Le plan et sa revue publient ces trois références. La revue revalide que la PR est ouverte, que son HEAD n'a pas bougé et qu'elle cible la branche déclarée. Le scan déterministe est rejoué sur `application_head`, tandis que la documentation fonctionnelle est lue à `source_head`.

Cette séparation n'ajoute aucune revue. Elle empêche seulement qu'une revue analyse le mauvais état applicatif.

## C. V2-BILAT-01

Le paquet autorisé est celui du run `34872653037`, artefact `10358639677`, session `80daf10b-8c53-4990-af9d-38031814dc20`. Le code à analyser est la PR #131 au HEAD `df38ade5e8737ed8f59a3a7472ebe9b168a85145`. Les sources produit sont celles du HEAD documentaire `a9877597fe41d20d88780517a4b7595cc6161289`.

Aucune demande consommée n'est rejouable et la présente évolution n'autorise aucune invocation de Claude.

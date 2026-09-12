# KODJO Protocol V2 — addendum normatif 0.6.22

La présente version supersède 0.6.21 pour les règles ci-dessous. Toutes les autres règles de 0.6.21 restent applicables.

## A. Portée de la certification RESUME_DELTA

Les runs `34686287653` et `34686704447` certifient le parcours jetable de conservation, restauration et reprise `RESUME_DELTA` avec Claude réel. Ils ne certifient pas à eux seuls l'admission de file, l'installation des dépendances ni la publication d'une tranche ordinaire.

## B. Preuves JSON

Tout JSON produit comme preuve est encodé en UTF-8 sans BOM, avec fins de ligne LF et nouvelle ligne terminale. Tout lecteur protocolaire accepte provisoirement un BOM UTF-8 historique en entrée.

## C. Pathspec de publication

Dans un run supervisé de file, un verdict vert exige une destination déclarée pour le pathspec de publication. Son absence est un échec immédiat et nommé. Les qualifications sans publication peuvent conserver une destination absente et un pathspec nul.

## D. Mesures d'infrastructure

Le parcours ordinaire conserve séparément les durées de checkout et d'installation des dépendances, les versions d'outillage, l'empreinte du lockfile et les volumes du répertoire persistant. Ces mesures n'affectent aucun verdict fonctionnel.

## E. Nettoyage du checkout ordinaire

Après préservation des diagnostics et paquets de reprise, le workflow tente de supprimer exclusivement `_kodjo/<github.run_id>`. La racine et l'identité du run sont validées avant suppression. Le nettoyage est borné à cinq tentatives ; tout échec publie les processus et chemins résiduels avant de rendre le workflow rouge.

## F. Allègement

Aucun contrôle n'est retiré par la 0.6.22. La suite complète reste obligatoire avant publication. Une éventuelle sélection ciblée reste en observation et ne peut être activée comme substitut sans décision ultérieure fondée sur des tranches réelles.


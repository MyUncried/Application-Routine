# Sources reçues — évolutions et phrases v15 — 07/10/2026

Originaux `source-evolutions.md` et classeur conservés octet pour octet. Ils documentent la demande reçue ; leurs contradictions sont résolues dans la [matrice courante](../../MATRICE-EVOLUTIONS-V15-2026-10-07.md), ils ne constituent pas une seconde spécification concurrente.

Le classeur remplace v14 comme corpus **rédactionnel uniquement**. Extraction des 276 cellules I4:I279 sans exécution de formule ; texte exact dans `phraseSource`, montant d’exemple remplacé par `{total}` dans `phraseGabarit`. Le total est injecté depuis le calcul métier. 36 phrases changent leur montant d’exemple ; aucun des 276 gabarits ne change. 140 phrases sans total, 46 estimées, 90 exactes ; maximum 224 caractères (cas144). Les cellules de durée et la feuille Calcul des durées ne sont jamais des oracles de recette métier.

Le source reprend le commit6d03f5b, antérieur à la fusion documentaire72d1bf4. Son §6.3 contient une erreur :315−15+30=330s, pas300s. Son §6.1 ne permet pas de remplacer les Pauses de Série par les pauses de Composition. Son §6.5 ne remplace pas l’arbitrage explicite D-303 sur le trait. Les quatre CF sont rapprochés des décisions déjà publiées ; aucun redesign ni remise en cause implicite.

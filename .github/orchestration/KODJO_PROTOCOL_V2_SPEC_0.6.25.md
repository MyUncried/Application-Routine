# KODJO Protocol V2 — addendum normatif 0.6.25

La présente version supersède 0.6.24 pour le cycle de vie d'une revue de plan. Toutes les autres règles restent applicables.

## A. Références distinctes

- `source_head` reste le HEAD produit immuable sur lequel le plan a été construit.
- `application_head` reste le HEAD exact de la PR applicative analysée.
- `protocol_execution_head` est relevé automatiquement sur la branche cible au début de la revue. Il n'est ni saisi par l'utilisateur ni ajouté au plan historique.

## B. Transition entre planification et revue

Si `protocol_execution_head` diffère de `source_head`, la revue est admise uniquement lorsque :

1. `source_head` est un ancêtre de `protocol_execution_head` ;
2. le checkout exécuté correspond exactement à `protocol_execution_head` ;
3. le bootstrap, le registre d'activation, la mission de planification, le plan versionné et chaque `product_source` du bootstrap sont inchangés ;
4. chaque autre chemin modifié appartient à la surface protocolaire fermée du vérificateur ;
5. une preuve JSON durable contient les deux HEAD, les chemins protégés, le diff classé et le verdict.

Tout changement applicatif, documentaire fonctionnel, ambigu, non classé ou portant sur une entrée protégée impose une nouvelle planification. Il n'existe aucun motif général `docs/**` ou `.github/orchestration/**`.

## C. Exécution et coût

Le contrôle est local, déterministe et sans IA. Il n'ajoute ni revue, ni demande, ni appel Claude. La revue indépendante reste unique selon la règle 0.6.23. Le contrôle remplace seulement l'égalité globale entre le HEAD produit historique et le HEAD protocolaire courant.

## D. Qualification

Le scénario `plan produit → correction protocolaire → revue du plan historique` est obligatoire dans les suites Linux et Windows. Les cas négatifs minimaux sont : changement applicatif, entrée produit ou bootstrap modifié, source non ancêtre, checkout discordant et chemin protocolaire non reconnu.

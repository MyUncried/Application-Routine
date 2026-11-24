# Mission LANGUES-J3-PLAN — plan de l'unité de charge (kg · lb)

- **Objectif** : proposer le plan de l'étape J3 (unité de charge), avant tout code, comme le demande `docs/preparation/langues/PROMPT-J1-LANGUE-ET-UNITES.md`, partie 2. Demande de Hermann du 24/11/2026 : « concentre toi sur l'unité de poids ».
- **Type** : plan, sans modification applicative.
- **Branche** : `feat/unite-charge-20261124`, créée depuis `origin/main` à `b074c416`.

## Périmètre

- **Demandé** : plan couvrant l'arrondi et la non-dérive, le stockage, les écrans touchés et la migration.
- **Traité** : la même chose, plus l'historique des exécutions, les tests prévus et cinq questions à trancher (U1 à U5).

## Constats

- Les charges sont stockées en kg, au pas de 0,25, à trois endroits :
  - le JSON des paramètres d'exécution (Catalogue et séances) ;
  - les modèles de Formats ;
  - les plans figés des exécutions (`executions.snapshot_json`).
- Aucune préférence d'unité n'existe aujourd'hui.
- Il n'y a pas de migration 040 sur les branches distantes au 24/11/2026 : la préférence prendra le numéro 040.
- La maquette de la ligne est déjà prévue : D-569, Figma `1992:684`. Le blocage « Figma de la ligne Unité » noté dans le suivi est donc levé.

## Livrables

- `docs/preparation/langues/J3-PLAN-UNITE-DE-CHARGE-2026-11-24.md` : le plan.
- `docs/preparation/langues/SUIVI.md` : ligne J3 mise à jour.

## Hypothèses non démontrées

- Pas de 0,5 lb, option de non-dérive, unité par défaut selon la région, historique dans son unité d'origine : ce sont des propositions, à trancher (U1 à U5).

## Tests

Aucun test applicable : la mission ne produit que de la documentation.

## Non traité

- Toute implémentation, en attente de la validation du plan.
- La mission UI-FAB-01 : son texte est arrivé tronqué et attend la suite.

## Vérifications sur iPhone

Aucune pour le plan.

## Synchronisation code / documentation

Aucun code modifié. Les règles proposées passeront dans le registre (classe B) seulement après la décision de Hermann.

## Commit final et état Git

Voir le commit qui contient ce rapport sur `feat/unite-charge-20261124`, envoyé sur GitHub ; arbre propre.

## Mise à jour du 24/11/2026 — réponses de Hermann

- **U1** : grille de pas adaptatifs pour les champs de charge et les conversions, en kg et en lb (recopiée au § 3.2 du plan). Elle remplace le pas unique de 0,25 kg.
- **U2, U4, U5** : « Ok ».
- **Sans réponse** : U3.
- **Nouvelles questions nées de U1** :
  - U6 : arrondi d'une valeur tapée hors grille ;
  - U7 : charges déjà enregistrées hors grille.
- Aucun code ; aucun test applicable.

- **Complément** : U3 « unité de la région du téléphone », U6 « Ok », U7 « Ok ». Le plan est tranché. U3 pour une base existante en région à livres : À CLARIFIER, sans effet sur l'iPhone de Hermann.

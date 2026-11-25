# 2026-11-24 — CONSOLIDATION-DECISIONS : collision D-532, report de D-516 à D-518

## Mission

- **Décisions de Hermann** (24/11/2026) :
  - sur la collision D-532 : « Ok, c'est technique, aucun intérêt pour moi, pas besoin de me demander » ;
  - sur D-516 à D-518 : « fusionne donc si c'est nécessaire ».
- **Branche** : `docs/consolidation-decisions-20261124`, créée depuis `origin/main` `862c84f1`, après la fusion des PR #453, #452 et #454.
- **Type** : mission documentaire. Aucun fichier applicatif n'est modifié.

## Constats

- **D-532** désignait deux décisions :
  - « Calendrier : Journal · Agenda · Vue d'ensemble » : ligne du tableau, citée par le code du Calendrier ;
  - « EMOM à plusieurs mouvements : série et tour selon le mode d'exécution » : section du 18/11 et son complément. Aucun fichier de `src/` ne cite ce sens ; seul le message du commit `fdf0a278` le mentionne.
- **D-516 à D-518** n'existaient que dans une chaîne de PR de documentation ouvertes depuis le 07/11 et jamais fusionnées :
  - #426 → `docs/death-by-parametres-execution-20261107`, porte D-514 et D-515 ;
  - #427 → #426, porte D-516 ;
  - #431 → #427, porte D-517 et D-518.
  - Le code EMOM cite D-517 et D-518.
- **Essai de fusion** de la chaîne dans `main` (worktree temporaire, annulé) :
  - **7 documents en conflit** : INDEX, PRODUCT, Composition-conteneurs, Formats, ch. 06, 07 et 13 ;
  - **numéros en collision** : la chaîne utilise D-514 et D-515 pour d'autres décisions que celles de `main`.
  - Une fusion directe n'est donc pas possible sans une reprise complète de ces documents.

## Modifications (registre, ch. 07)

- **D-532** reste au Calendrier. La section EMOM et son complément deviennent **D-596**, avec une note de renvoi à l'ancien numéro.
- **D-516, D-517 et D-518** sont reportés tels quels après D-515 (numéros libres sur `main`), avec leur source.
- Les D-514 et D-515 de la PR #426 deviennent **D-597** (Death by : ligne « Séries » retirée) et **D-598** (carte de Composition : prescription seule), avec leur source.
- La note « Collision … À CLARIFIER » est annotée « tranché ».

## Preuves

- **Unicité des identifiants du tableau** (script node) : 523 lignes, aucun doublon. D-500 à D-598 sont présents, sauf D-596, qui est une section et non une ligne du tableau.
- **Tests applicatifs** : aucun, mission documentaire.

## Hors périmètre et restes

- **Contenu détaillé des PR #426, #427 et #431** : il n'est pas reporté. Ce sont les compléments aux chapitres 06 et 13, aux Formats et à PRODUCT.
  - Ces textes du 07/11 ont depuis été en partie dépassés sur `main`, par exemple la carte d'exercice du 08/11.
  - Leur report demande une consolidation document par document, avec annotation des formulations remplacées.
  - Les trois PR restent ouvertes.
- **D-597 et D-598** reprennent les décisions du 07/11 telles quelles. Leur concordance avec les règles plus récentes de `main` n'est pas vérifiée.

## Fichiers modifiés

- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- ce rapport

## État Git

Le commit et l'état Git figurent dans le message de livraison.

# Intégration documentaire des phases d’exercice

Base relue : main `6656fefc58330955f5ad74d513ce616ea51809b0`. Sources : deux documents V2 du 15/10/2026 et arbitrages explicites de la conversation, consolidés dans KODJO-Phases-specification-consolidee-2026-10-15.md. Le contenu normatif est intégré directement aux chapitres 01 à 13, sans annexe normative nouvelle. Ce rapport reste hors de la documentation principale.

## Matrice de couverture

| Point validé | Destination normative et vérification |
|---|---|
| MVP, subdivision d’une série, pas de nouveau compteur | 01 glossaire ; 02 besoin ; 04 structure ; 05 MVP |
| Durée chiffrée, séries identiques, exclusion Répétitions/échec/variables | 08 Phases ; 10 règles ; CE-UI-10 états/invariants ; D-370 |
| Six phases maximum | 08 ; CE-UI-10 contrôles/recette ; DSF Deux modes |
| Libellé vingt caractères maximum | 08 ; 09 ; CE-UI-10 ; DSF Deux modes |
| Aucune crée la première phase, pas de chevron sans liste | 03 ; 06 ; 08 ; CE-UI-10 structure/interactions |
| Première phase reprend la durée actuelle | 08 ; CE-UI-10 ; cas sans durée explicitement ouvert |
| Ajout libre copie la dernière durée | 08 ; CE-UI-10 recette6→6+6 ; D-371 |
| Suppression de la dernière conserve sa durée en série simple | 08 ; CE-UI-10 ; D-371 |
| Phases autorisées avec durée de travail imposée | 08 formats ; CE-FMT-04 ; DSF Formats |
| Dernière phase reçoit le restant, pas de blocage à validation | 08 ; CE-UI-10 ; CE-FMT-04 ; D-372 |
| Ajout sous format à zéro, aucune division automatique | 08 exemple20+0 ; CE-UI-10 |
| Déplacement conserve les valeurs, dernière position calculée | 08 ; CE-UI-10 gestes ; DSF Formats |
| Suppression reporte le temps sur la dernière restante | 08 exemples5+7+8 ; CE-UI-10 |
| Zéro temporaire retiré silencieusement à validation | 08 ; 09 ; 11 ; CE-UI-10 validation/brouillon ; D-373 |
| Libellé vide remplacé par Phase n | 08 ; 11 ; CE-UI-10 validation |
| Adaptation proportionnelle dans les deux sens | 08 exemples30→20 et9→20 ; 11 ; CE-FMT-04 ; D-374 |
| Message informatif, aucune confirmation supplémentaire | 08 ; CE-UI-10/CE-FMT-04 ; DSF Formats |
| Catalogue inchangé, copie de séance indépendante | 03 ; 09 ; 11 ; CE-UI-10 |
| Durée de série dérivée, total72s hors préparation/fin | 04 ; 08 formule/exemple ; 10 ; CE-UI-10 recette |
| Cadence continue, transition prioritaire | 08 ; 10 ; contrats communs4.12 ; DSF Bip ; D-375 |
| Annonce de chaque phase sans délai, interruption de la précédente | 08 ; 10 ; 12 ; contrats4.12 ; DSF Bip |
| Commandes et côtés existants préservés | 08 ; 10 ; 12 ; contrats4.12 |
| Paramètres versionnés, copie, instantané et ancienne donnée | 09 ; 11 ; 12 ; CE-UI-10 persistance |
| Segments de phrase non persistés | 08 ; 09 ; 11 ; CE-UI-10 données/persistance |
| Total inverse conserve N comme variable, pas les durées de phases | Règle préexistante13/R-02 réutilisée explicitement dans08 et CE-UI-10 ; pas de nouvel arbitrage |

## Cohérence transverse

- Les 20 rubriques de CE-UI-10 sont renseignées pour cette extension ; les 20 rubriques de CE-FMT-04 sont conservées et ses interactions/recettes étendues. Les contrats d’exécution héritent de la section commune4.12.
- Durée simple saisie et durée calculée sont distinguées : une somme6+3=9s n’est pas arrondie au pas de5s de la roulette de série.
- Les règles de pauses, côtés et récupération restent propriétaires de leurs frontières ; aucune pause entre phases n’est introduite.
- L’adaptation à une durée de travail imposée n’est pas étendue par erreur à toute la fenêtre EMOM.
- La progression conserve la série comme unité contributive ; subdiviser une durée ne modifie pas son poids dans un plan mixte.
- La suppression de zéros saisis ne sert pas à justifier une suppression d’action après arrondi proportionnel : ce cas reste ouvert.
- Le calcul inverse de durée totale est déjà défini par R-02 : ajustement de N. Il a été réutilisé sans restriction nouvelle ni redistribution des phases.
- L’écart préexistant code1..5999 / documentation5..3535 est signalé avec la primauté documentaire, sans modifier le code ni les données historiques dans ce lot.

## Contrôles réalisés

Comparaison des sources au main épinglé ; vérification des ancres ajoutées et de leurs destinations ; conservation de la structure20/20 des deux contrats ; contrôle des exemples72s, des deux adaptations et des règles de dernière phase ; diff limité aux13 chapitres, trois DSF existants et ce rapport. Aucun code produit, protocole, image ou composant Figma modifié. Aucune recette applicative n’est revendiquée.

## Limites explicites

Les bornes/pas propres aux phases et les arrondis extrêmes, l’initialisation sans durée, les nouveaux textes de synthèse et la présentation cadran/cartes restent localisés au chapitre08. Les annonces exercice/côté et première phase doivent être articulées à l’intégration audio.

Le rapport Figma V2 décrit trois états dédiés,38 écrans modifiés sur deux pages et16 modales de format non complétées. Pas de nouvel inventaire direct ni de réexport dans ce lot ; le chapitre06 signale que les captures antérieures n’illustrent pas encore ces états. La PR363 des44 captures précédentes reste indépendante et ouverte à la vérification initiale.

Les règles métier validées sont propagées ; ces limites ne sont ni déclarées résolues ni transformées en blocage général de l’éditeur ou du développement.

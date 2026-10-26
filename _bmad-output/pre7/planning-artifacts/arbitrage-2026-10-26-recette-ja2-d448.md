# Arbitrage de Hermann du 26/10/2026 — recette JA2 et lot D-448

> Source : cahier de recette JA2 (artefact « Recette JA2 PRE-7 », collection `results`), synthèse proposée en séance, réponses de Hermann. PH-5 et NV-3 : verbatim. Points 1, 2, 4, 6 à 10 : formulation de la proposition, validée telle quelle (« Oui, tous validés »). Défaut cr-8 : écart à R-5, corrigé sans arbitrage.

## Résultats de la recette JA2

39 points OK sur 53. Migration 013 (JA1-bis) validée. Non testés : VoiceOver (ax-1 à 3), alias sans écran de saisie (cr-7), suppression au Catalogue non développée (pa-5), Circuit de Séries (nv-8, « Le circuit de série sera abandonné »).

## PH-5 — verbatim

La durée totale ne doit pas dépendre de la complétude des phases lorsque l'exercice est en mode Durée.

En mode Durée, elle est calculée à partir des cibles de séries, des pauses et des autres paramètres applicables, indépendamment des durées des phases.

Une phase dont la durée est vide reste une phase non renseignée, et non une phase de 0 seconde. Elle ne doit pas empêcher l'affichage du total calculable en mode Durée. Les règles de validation des phases manquantes restent toutefois applicables à l'enregistrement et à l'exécution.

En mode Répétitions chiffrées avec phases, appliquer PHC-20261026 : l'estimation nominale dépend du nombre de répétitions et de la durée du motif complet. Si une durée de phase manque, ne pas inventer une valeur de 0 pour produire une estimation.

Ne pas modifier les autres règles de calcul des durées ni introduire de nouvelles restrictions.

## NV-3 — verbatim

Je valide le préremplissage des durées de phases manquantes lors d'un changement de niveau.

Priorité :

1. Conserver les durées locales des phases de rang commun.
2. Pour les durées manquantes, reprendre celles de l'Exercice du Catalogue explicitement sélectionné pour le niveau cible.
3. Si aucune durée de référence n'existe, laisser le champ vide, sans inventer 0 s.

Ne jamais écraser une durée locale renseignée.

Attention : le Mouvement porte la structure des phases, mais leurs durées appartiennent aux paramètres des Exercices. Un niveau ne possède donc pas de durées par défaut uniques lorsqu'il regroupe plusieurs Exercices.

Cette règle remplace uniquement les dispositions contraires sur les durées manquantes dans le changement de niveau. Conserver les autres règles de transfert de paramètres et d'annulation.

**Précision (réponse à la question de séance) :** en Séance et en reprise, le menu Niveau choisit un mouvement, sans Exercice du Catalogue sélectionné : **pas de préremplissage**, les durées manquantes restent vides. Le préremplissage ne s'applique qu'où un Exercice du Catalogue est explicitement sélectionné.

## Lot validé (formulation de la proposition)

1. **Recherche** : en plus de R02, un mot tapé qui est le début d'un mot du nom suffit pour trouver le mouvement (« Squ », « Squats sau »). Les résultats sont triés de façon stable. Panneau sous le nom et écran de recherche.
2. **Éditeur** : retirer le lien vers l'écran de recherche. L'écran reste accessible ailleurs.
4. **Phases activées, désactivées puis réactivées (ph-1)** : libellés et durées saisis restaurés pendant l'édition.
6. **Durée de phase à 0 s** : acceptée au lieu d'être ramenée à 1 s ; champ rouge ; sauvegarde impossible.
7. **Signalements en rouge** : « Paramètres à compléter » en rouge ; fond rouge d'une carte de Composition qui manque de données après un changement de rang.
8. **Libellés et mise en page** : « Phases du mouvement » au lieu de « Phases de l'exercice » ; cadre des phases variables élargi (chevron éloigné du nombre de phases) ; au dépliage de « Durée de l'exercice », défilement pour que les deux lignes soient visibles.
9. **Menu Niveau au Catalogue** : « Naviguer vers » > liste des niveaux ; « Ajouter un niveau » > Plus facile / Plus difficile ; « Réordonner les niveaux ».
10. **Crayon en Séance (nv-9)** : reste affiché et actif pendant l'édition ; le toucher à nouveau quitte l'édition, avec la confirmation prévue s'il y a des changements.

## Répartition en stories (epic R)

- **r-7** — Phases, durées et signalements : PH-5, NV-3, points 4, 6, 7, 8 ; consignation de D-448 au chapitre 07.
- **r-8** — Recherche et variante : défaut cr-8, points 1 et 2.
- **r-9** — Menu Niveau et crayon : points 9 et 10.

## Précisions de Hermann (questions de séance du 26/10/2026)

- **Point 2, accès à l'écran de recherche** : le lien de l'éditeur en était le seul accès. Réponse : « Conservé sans accès pour l'instant » : l'écran et la fonction restent dans le code, sans point d'entrée dans l'interface, en attendant un autre accès.
- **Point 9, portée du menu Niveau** : réponse « Structure partout, libellé adapté » : « Réordonner les niveaux » passe à la racine dans les trois contextes ; « Naviguer vers » au Catalogue en modification ; « Changer de niveau » conservé en Séance et en reprise, où le choix remplace le mouvement de l'occurrence.

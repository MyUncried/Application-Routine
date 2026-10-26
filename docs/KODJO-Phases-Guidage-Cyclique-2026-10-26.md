# KODJO — Phases : guidage cyclique et objectif de série

Décision fonctionnelle de Hermann du 26 octobre 2026. Référence stable : **PHC-20261026**. Documentation cible ; aucune réalisation applicative ou Figma revendiquée.

## Principe et compatibilité

Les phases forment un motif cyclique de guidage : un passage complet correspond à une répétition guidée. Chaque phase conserve une durée en secondes. La somme des phases est la durée du motif, jamais la durée cible de la série. Les modes Durée et Répétitions, avec cible chiffrée ou À l’échec, sont compatibles ; seules les séries variables restent incompatibles avec les phases. La condition d’arrêt appartient à la série. En Durée chiffrée, la cible indépendante termine la série à échéance, même au milieu d’une phase. À l’échec, le guidage boucle jusqu’à Suivant. En Répétitions chiffrées, R motifs donnent une durée nominale R × somme des phases ; Suivant conserve la validation manuelle existante. Chaque nouvelle série recommence à la première phase. Les cycles guidés ne prouvent pas les répétitions effectivement réalisées.

Modifier, ajouter ou supprimer une phase ne réécrit pas la cible de série. Toutes les durées de phase sont éditables, y compris sous un format à durée imposée : aucune dernière phase calculée, aucune adaptation proportionnelle pour faire tenir le motif dans la série. Une durée manquante reste à renseigner ; ne pas inventer une durée depuis l’objectif de série. Les bornes existantes des phases restent des bornes du motif, indépendantes de celles de la cible. Le retrait 2 → 1 conserve le passage à Sans mais ne remplace plus la cible par la durée restante. Sans phases conserve également la cible existante.

## Exemples normatifs

Montée sur mollets 5 s, descente 2 s : motif de 7 s.

| Paramètres | Résultat attendu |
|---|---|
| Durée, 120 s, 3 séries identiques | Chaque série boucle le motif jusqu’à 120 s ; arrêt pendant la montée du 18e motif, après 17 motifs complets (119 s) |
| Durée, À l’échec, 3 séries identiques | Bouclage jusqu’à Suivant pour chaque série ; durée finale inconnue |
| Répétitions, 10, 3 séries identiques | 10 motifs par série, durée nominale 70 s ; validation manuelle conservée |
| Répétitions, À l’échec, 3 séries identiques | Bouclage jusqu’à Suivant ; nombre réalisé non prescrit |
| Phases + séries variables | Combinaison indisponible ; pas de conversion destructive |
| Format de travail 20 s, motif 5 + 2 s | Durées de phase inchangées ; arrêt à 20 s au milieu du troisième motif |

## Édition, durées et changements de mouvement

La structure et les libellés restent au mouvement, les durées dans les paramètres d’exécution. Les relations partagées, la filiation et les instantanés de D-445 sont conservés.

L’objectif de série reste modifiable avec phases, sous les contraintes propres au format. Activer les phases ne copie pas la cible de série comme durée du motif ; demander les durées manquantes. Une nouvelle phase peut reprendre la durée de la dernière selon la convention existante, sans réécrire la cible. Un changement de mouvement conserve mode, objectif, condition d’arrêt et paramètres compatibles : sans→phases demande les durées ; phases→sans conserve la cible, jamais la somme ; phases→phases conserve le transfert par rang. La correction d’un même mouvement conserve les valeurs par identifiant stable de phase.

Durée : utiliser la cible de série pour les agrégats. Répétitions avec phases : utiliser R × durée du motif comme estimation nominale, même sans bip, sans y ajouter une seconde estimation fondée sur la cadence. Présenter cette contribution comme estimée, pas comme une mesure réelle. À l’échec : durée non calculable, affichage existant ; ne pas afficher la somme du motif comme total de série. Pauses, côtés, récupérations, préparation et fin suivent leurs règles existantes ; ne pas compter les phases comme séries supplémentaires.

## Exécution et contrat d’écran

Afficher la phase courante, passer à la suivante à expiration de sa durée, puis revenir à la première tant que la série continue. La fin de série prime sur une transition de phase simultanée ; ne pas annoncer une phase qui ne sera pas exécutée. Suivant termine la série selon les règles du mode, jamais une seule phase. Pause/Reprendre conserve la position du guidage et le temps restant ; Réinitialiser garde son périmètre existant et repart à la première phase. Utiliser l’instantané figé.

Le bip et les annonces conservent leurs règles de priorité et n’allongent pas le temps de travail. La cadence sonore ne remplace pas la durée du motif pour l’estimation d’un exercice à phases. Les commandes Durée/Répétitions et À la cible/À l’échec restent actives avec phases ; Variables reste indisponible. La durée cible n’est plus une somme en lecture seule. Les durées de phase restent numériques, sans choix À l’échec dans leurs cellules.

## Limites explicites

Deux points restent distincts des trois corrections validées : (1) le comportement du guidage entre l’atteinte du nombre cible de répétitions et la validation manuelle Suivant doit être vérifié dans la règle existante, puis précisé si elle ne tranche pas ; ne pas introduire de fin automatique ; (2) « deux séries à la cible, dernière à l’échec » est actuellement représenté par des séries variables. Ne pas autoriser implicitement phases + variables ni inventer un réglage de dernière série. L’arrêt mixte avec paramètres communs demande une spécification séparée.

## Remplacement des anciennes règles

Cette clarification remplace D-370 pour l’éligibilité et le passage unique ; D-372/D-374 pour le budget de phase et l’adaptation proportionnelle ; les conséquences de D-371/D-432/D-438 qui transféraient une durée ou somme de phases vers la cible ; les calculs et contrats dérivés. Les bornes, les identifiants, la validation des durées manquantes et les autres dispositions restent applicables. QP5-03 et D-434 concernent la saisie numérique d’une phase, pas l’interdiction d’une série À l’échec.

D-446 est citée dans le travail local de Claude mais absente de main au dernier contrôle. Rapprocher ce texte de D-446 lors de la consolidation PRE-7, sans inventer son contenu ni créer deux décisions concurrentes. Les spécifications sources historiques et livraisons PRE-5/PRE-6 restent des preuves datées, pas des consignes à réappliquer sur ce point.

## Recette automatique attendue

| Cas | Vérification |
|---|---|
| PHC/AC01 | Les quatre combinaisons Durée/Répétitions × cible/échec acceptent les phases |
| PHC/AC02 | Variables et phases restent incompatibles sans suppression silencieuse |
| PHC/AC03 | Cible 120 s et phases 5 + 2 s coexistent ; modifier une phase ne change pas 120 s |
| PHC/AC04 | Transitions à 5 s, 7 s, 12 s, 14 s ; boucle tant que la série continue |
| PHC/AC05 | À 120 s, fin de série même au milieu d’une phase ; pas de phase suivante annoncée |
| PHC/AC06 | Échec : guidage sans durée finale prescrite, terminé par Suivant |
| PHC/AC07 | Répétitions : 10 motifs donnent 70 s nominales ; aucune clôture automatique introduite |
| PHC/AC08 | Nouvelle série et réinitialisation repartent à la première phase ; pause conserve la position |
| PHC/AC09 | Format 20 s conserve 5 + 2 s ; aucune mise à l’échelle ni dernière durée calculée |
| PHC/AC10 | Suppression/retour Sans/changement de mouvement conservent l’objectif de série |
| PHC/AC11 | Estimation par motif sans bip ; pas de double comptage avec cadence, pauses ou phases |
| PHC/AC12 | Instantané et historique restent figés après correction du mouvement |

Ces tests sont à implémenter dans la CI existante avec le correctif produit ; leur énumération ne vaut pas exécution.

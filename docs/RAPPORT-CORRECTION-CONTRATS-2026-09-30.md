# Correction des contrats d’écran — 30 septembre 2026
Base : main@0e22836cee511352dd663a0ee4a0aeb4f2a37d27 ; les sources documentaires sont identiques au commit audité9292878fcf90e6fde95acbbb9c3a38eec04d1bf5.
## Livraison

- 29 contrats actifs,609 rubriques numérotées, toutes renseignées.
- 24 contrats revus ; cinq familles ajoutées ; deux contrats média remis à21 sections ; CE-T03-16 remplacé par Étiquettes.
- Correction des doublons Exercice/Média du glossaire et du remplacement circulaireD-202.
- Rattachements corrigés dans INDEX et matrice ; passages UI dépendants corrigés dans06 (Synthèse, référentiels, entrée Exécution, éditeur et preuves). Aucune modification de code, workflow, protocole ou Figma ; les PNG existants sont conservés.
## Portée et réserves

La revue corrige les contrats, pas tous les chapitres métier/API/architecture de l’audit. R-01 àR-04 du chapitre13 isolent les sources encore non univoques : progression/estimation globale, bornes de contrôles, transitions bilatérales/gardes, exclusion persistante d’occurrence. V-01 àV-12 identifient les preuves graphiques absentes/divergentes et les limites déjà acceptées. Aucun arbitrage fermé n’est rouvert et aucune recette interactive n’est revendiquée.
## Suivi des constats de l’audit

« Contrat corrigé » signifie traitement dans le chapitre13 ; il ne prétend pas que toutes les occurrences du problème dans les autres chapitres ont été corrigées.

| Constat | Sujet | Traitement livré |
|---|---|---|
| A01 | Deux définitions d’Exercice et remplacement circulaire | Glossaire corrigé ; périmètre des contrats clarifié ; propagation restante aux autres chapitres pour A03. |
| A02 | Circuit, Tour et Parcours restent mélangés | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A03 | Média : définitions et périmètres incompatibles | Glossaire corrigé ; périmètre des contrats clarifié ; propagation restante aux autres chapitres pour A03. |
| A04 | Référentiels obligatoires contre facultatifs | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A05 | Couleur de Séance et ancien écran final Catégories | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A06 | Couleur de référentiel modifiable ou immuable | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A07 | Suppression de référentiel : conservation contre retrait | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A08 | Séance vide : existence et enregistrement contradictoires | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A09 | Sauvegarde de Composition : brouillon ou immédiate | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A10 | Recherche et commandes Suivi encore actives dans le texte | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A11 | Affichage des cartes : règles retirées encore prescrites | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A12 | Classement de carte : deux prescriptions dans le DSF | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A13 | Photo et Déployer : état ancien encore actif dans le contrat | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A14 | Bilatéralité : récupération au mauvais endroit | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A15 | Ancienne bilatéralité du Circuit encore opérante | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A16 | Plan d’exécution incomplet pour les phases récentes | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A17 | Réglage global de Séance sans couverture UI suffisante | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A18 | Points d’arrêt : captures présentes, contrat incomplet | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A19 | Progression hybride : cas non chronométré non résolu | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A20 | Durée réelle et pauses : exclusions incomplètes | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A21 | Fin d’exécution et phases propres omises | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A22 | Réinitialiser et Suivant : granularité ambiguë | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A23 | Origines SESSION/ACTIVITY non propagées partout | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A24 | Historique : figer quoi et à quel moment | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A25 | Deux secondes par répétition : portée du calcul à clarifier | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A26 | Bornes de Durée totale et calcul inverse incomplets | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A27 | Contrôle numérique : règles générales et exceptions mélangées | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A28 | Suppression d’une seule occurrence sans modèle complet | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A29 | Planification : paramètres contradictoires ou non déterministes | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A30 | Sélection simple : un CTA inventé dans le contrat | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A31 | Multisélection : libellés et insertion des éléments masqués | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A32 | Éditeur : ancienne structure et texte de synthèse | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A33 | Synthèse : libellé d’action et données insuffisamment décrites | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A34 | Profil : couverture limitée à la silhouette | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A35 | Calendrier : contrats surtout graphiques | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A36 | Les deux contrats média n’utilisent pas la trame complète | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A37 | Média : taille et contexte d’exécution contradictoires | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A38 | Dialogue de suppression absent de sa propre capture | Preuve requalifiée et cible explicitée au §5 ; modification/réexport Figma non effectués. |
| A39 | État visuel de l’éditeur non aligné avec son libellé | Preuve requalifiée et cible explicitée au §5 ; modification/réexport Figma non effectués. |
| A40 | Roulettes et champs absents dans certaines variantes | Preuve requalifiée et cible explicitée au §5 ; modification/réexport Figma non effectués. |
| A41 | Captures : autres libellés ou états trompeurs | Preuve requalifiée et cible explicitée au §5 ; modification/réexport Figma non effectués. |
| A42 | Vocabulaire visible et accessibilité non nettoyés | Preuve requalifiée et cible explicitée au §5 ; modification/réexport Figma non effectués. |
| A43 | Traçabilité des contrats vers les écrans erronée | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A44 | Familles sans contrat complet ou variante propriétaire explicite | Contrat corrigé/complété ; voir famille propriétaire et recette du chapitre13. |
| A45 | Identifiants et tableaux détériorés | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |
| A46 | Statuts de preuves et inventaires périmés | Preuve requalifiée et cible explicitée au §5 ; modification/réexport Figma non effectués. |
| A47 | Consolidation annoncée plus complète que son résultat | Contrats réconciliés ou réserve amont explicite §6 ; propagation métier/API/architecture reste à traiter. Pas de clôture globale du constat. |

## Vérification

Comptage21 rubriques par contrat, unicité des29 IDs, absence de section vide, contrôle des références de contrat, couvertureE01–E73, recherche des anciens parcours/CTA et rattachements corrigés. Les différences ont été relues ; les preuves visuelles sont celles de l’audit des119 captures. Tests applicatifs non exécutés : livraison documentaire.


## Mise à jour du 01/10/2026 — clôture fonctionnelle

La réserve fonctionnelle R-01 à R-04 est remplacée par les règles du chapitre13 §6, D-241 à D-245. Les mentions de réserves dans le bilan initial ci-dessus décrivent la première livraison. Maxima confirmés : rappel 24 h, fréquence 12 semaines. Transition entre côtés corrigée avec repli sur la pause entre Séries. Progression pondérée sur toutes les étapes. Les limites visuelles V-01 à V-12 demeurent, sans redesign ni prétention de recette applicative.

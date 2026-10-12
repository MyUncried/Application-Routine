# Correction documentaire — phases propres des Exercices en Séance

Décision explicite d’Hermann du12/10/2026. Base vérifiée : main `46b91bd279424899a02c099a68b2729f6d710809`.

## Règle

En SESSION, aucun Compte à rebours d’exercice ni Fin d’exercice, dans tous les cas. Seuls le Compte à rebours initial et la Fin de séance s’exécutent, une fois. Aucun booléen, valeur par défaut, surcharge par occurrence ou contrôle d’activation. Les valeurs propres restent conservées pour ACTIVITY autonome. D-214 est révisée, RM-218 alignée et V-04 close. Figma est confirmé aligné par le propriétaire ; aucune retouche demandée.

## Traçabilité

| Périmètre | Correction |
|---|---|
| INDEX, PRODUCT, chapitres01–05 | Suppression de l’option et du booléen du besoin |
| Chapitres06/08/13 | Composition sans contrôle, états et plan SESSION sans phases propres, réserve V-04 close |
| Registre07, règles10 | D-214 révisée, RM-218 et RM-071 alignées |
| Données09, API11, architecture12 | Aucun champ d’activation cible ; génération inconditionnelle, compatibilité des anciens champs à inventorier |
| Bip v2, Paramètres v13 | Portée autonome vs Séance explicite ; calcul/progression cohérents avec phases réellement générées |
| Rapports de réconciliation et du07/10 | Note de remplacement/fermeture, sans présenter l’ancienne réserve comme encore active |

## Vérification documentaire et recette prescrite

Lecture des24 Markdown à la racine des spécifications fonctionnelles et54 Markdown à la racine docs. Relecture ciblée des occurrences D-214, RM-218, V-04, booléen/réglage global et phases propres. Les archives sources et preuves de livraisons historiques ne sont pas réécrites. Correction documentaire uniquement ; aucun test applicatif exécuté.

Cas à vérifier lors de l’implémentation : exercice autonome avec ses phases une fois ; même exercice en Séance sans ses phases, valeurs propres conservées ; Séance avec paramètres0 et positifs ; plusieurs occurrences/Tours sans répétition de la préparation ou fin de Séance ; anciens champs absents/vrai/faux sans effet sur un nouveau plan SESSION ; totaux et progression sans phases exclues ; instantanés/résultats historiques inchangés.

Aucun changement de moteur, migration SQL, nouvelle capture ou autre concept de circuit n’est livré par ce correctif. Les évolutions de circuits restent dans leur spécification en conception.

# Claude Code — Implémenter les niveaux et la recherche v5

Tu interviens dans le dépôt MyUncried/Application-Routine pour implémenter la spécification définitive Niveaux et recherche v5, validée par Hermann.

## Sources à lire

Commence par les instructions du dépôt et docs/INDEX.md. Lis intégralement docs/KODJO-Niveaux-Recherche-Parcours-Regles-v5.md : elle fait autorité sur les anciens énoncés contradictoires dans sa portée.

Puis lis les sections concernées des chapitres 01, 03, 04, 06 à 13 de docs/Specifications-fonctionnelles : règles MFN, modèle Mouvement/ActivityDefinition/SessionActivity/instantané, API, contrats CE-T03-02, CE-T03-04, CE-T03-07, CE-T03-08 et CE-UI-10, contrats du Suivi. Consulte les captures référencées au chapitre 06 et docs/DSF-MOUVEMENT-FILIATION-NIVEAUX-2026-10-23.md. Les captures décrivent leur date d’export ; la v5 décrit les évolutions à réaliser. Ne demande pas à Hermann de recopier les écrans ou les règles déjà disponibles.

## Démarrage et méthode

Vérifie la branche et les modifications locales ; préserve le travail en cours. Assure-toi que la branche de travail contient la documentation v5, en récupérant la branche documentaire si elle n’est pas encore intégrée dans main. Examine le code réellement présent, les développements PRE en cours et le workflow BMAD du dépôt. Réutilise ce qui est implémenté ; n’engage pas de refonte de VNext.

Établis une analyse d’impact ciblée et un plan de réalisation avec les tests nécessaires, puis poursuis l’implémentation selon le workflow du projet. Les arbitrages produit v5 sont rendus ; ne les rouvre pas. Résous les détails techniques raisonnables, documente-les, et n’escalade qu’une contradiction qui empêche réellement de réaliser le comportement attendu.

## Périmètre

- Séparer contenu du geste et paramètres d’exécution ; alias facultatifs sur le geste, jamais noms propres aux exercices. Intégrité réelle de la relation Catalogue, filiation immuable des copies sans cascade.
- Commande vide « Niveau » sur les fiches ; rien sur les supports informatifs sans niveau. Groupes linéaires sans plafond métier ; création Plus facile / Plus difficile, réordre, singleton sans rang. Variante et exercice créés ensemble. Avertissement N08 non bloquant à trois actions.
- Catalogue ouvert directement en édition des paramètres et référentiels ; contenu partagé accessible par l’unique crayon Modifier le geste. Inclure les alias dans le contrôle d’identité conditionnel ; annonce du nombre réel de définitions affectées. Pas de dialogue redondant pour une variante explicite.
- Recherche R02–R07 : saisie déclenchante, normalisation prudente, rapprochement textuel, classement, alias et un résultat par geste selon sa meilleure correspondance ; inclure les gestes locaux. Recherche explicite préremplie, liste unique, état sans résultat et Voir tous les gestes. Aucun rattachement automatique ni contrôle supplémentaire à la sauvegarde après choix indépendant.
- Sélecteur d’insertion avec recherche et filtres Catégorie/Zones, sélection conservée entre requêtes et compteur global. Insertion selon le tri Catalogue puis date de création et identifiant croissants.
- Changement de niveau dans une séance : nouvelle occurrence remplaçant l’ancienne, nouvelle filiation, position et récupération conservées. Appliquer exactement les quatre cas de phases du §8, avec transfert par rang (et non par ID ou égalité de libellés). Ne pas réintroduire l’ancien prérequis de structures identiques. Les contraintes existantes du moteur et du format restent applicables ; aucun verrou nouveau.
- Aucun rang stocké dans l’historique. Résolution facultative de la classification actuelle à la lecture ; contenu exécuté inchangé et consultable indépendamment de la source. Pas de rang sur les lignes compactes 1992:8996.

## Analyse technique ciblée

Vérifie les fonctions de normalisation existantes, le cycle de recalcul des représentations de recherche pour le nom et chaque alias, et le coût du parcours en mémoire. N’introduis un index qu’en présence d’un besoin démontré.

Les coefficients et seuils sont initiaux : ajuste-les avant livraison contre R07. Précise de façon déterministe les détails nécessaires (appariement unique des tokens, cas vides, longueurs, départage des scores). Vérifie notamment l’indépendance à l’ordre des mots malgré le bonus de préfixe et la cohérence du rôle des bonus Catégorie/Zones avec les seuils. Les tests de comportement sont l’oracle ; ne modifie pas silencieusement les attendus pour faire passer une formule.

Le départ sur base vierge reste autorisé par D-440 : pas de migration ni de reprise des anciennes données exigée. La réinitialisation est ponctuelle, jamais répétée aux démarrages suivants. N’efface pas une base ou des fichiers de travail pendant la seule analyse.

## Vérification automatique obligatoire

Implémente le jeu R07 dans les tests automatiques et raccorde-le à la CI existante. Couvre toutes les familles et tous les cas minimaux de v5 : exact, accents/casse, pluriels/mots courts, fautes, noms partiels, ordre des mots, alias, différences significatives. Vérifie présence et absence attendues, classement pertinent, suggestions et déduplication par geste. Toute évolution du calcul relance ce jeu ; chaque défaut corrigé ajoute son cas. Aucun réglage ni validation manuelle des coefficients n’est demandé à Hermann.

Ajoute les tests d’intégration utiles : transactions création/annulation, filtres et sélections masquées, classement d’insertion, quatre transitions de phases, remplacement avec contexte conservé, classification après réordre sans mutation des instantanés, contenu toujours consultable si la source manque. Exécute les contrôles du projet adaptés aux fichiers modifiés et rends les résultats réels.

## Présentation et livraison

Réutilise les composants existants et les captures documentaires. Les vignettes et informations des résultats et de l’écran Niveaux suivent la v5. Le niveau des cartes accompagne le nom, jamais la rangée du résumé des paramètres. Les placements exacts de certaines cartes et les icônes au-delà de trois rangs restent à compléter : consigne les limites visuelles et poursuis les travaux indépendants, sans inventer une limite de niveaux ou prétendre qu’un écran non fourni est certifié Figma.

Livre le code, les tests automatisés, les ajustements documentaires techniques nécessaires et une PR avec le périmètre, les vérifications et les limites restantes. N’annonce pas de recette appareil ou de conformité visuelle non exécutée. Ne fusionne pas la PR de développement sans instruction de Hermann.

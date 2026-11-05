# DSF — Formats de séances — référence actualisée le 2 novembre 2026

Source fonctionnelle : [Formats d’entraînement](KODJO-Formats-entrainement-2026-11-02.md). Source graphique : Figma G6RY5Ebhgwb4AHIOYDwwvg, page Prototype MVP ; galerie du chapitre 06. Les anciennes prescriptions de constantes Tabata/30/30 et de portage exclusivement Exercice sont remplacées. Aucun composant Figma n’est créé par cette livraison documentaire.

## 1. Portée et familles

CE-FMT-01 : fenêtre Formats à deux colonnes sur voile. CE-FMT-02 : questionnaires et récapitulatifs, tableau Progression. CE-FMT-03 : Composition et sortie. CE-FMT-04 : modales contextualisées. CE-FMT-05/06 : contrats fonctionnels d’exécution futurs, pas une preuve de moteur livré.

Pas de visuel de Séance persisté depuis la grille ; les cartes modèles ne remplacent pas les cartes catalogue. Réutiliser les composants existants de blocs, lignes, segmentés, tableaux, navigation et durée.

## 2. Navigation et organisations

Questionnaires : croix, fermeture vers Composition. Tous les récapitulatifs : Retour vers le questionnaire avec réponses conservées et titre inchangé. Fenêtre Formats : croix interne ou voile ferme la fenêtre ; aucune carte Exercice/Séance ou Libre.

Tabata : À la suite ou En alternance ; EMOM et Death by : Dans chaque intervalle, À la suite ou En alternance. For time : aucun choix additionnel d’exécution. Les segmentés reprennent les styles standards et la taille normale des options, sans nouveau contrôle.

## 3. Valeurs modifiables, calculées ou imposées

Tabata et 30/30 sont standards : aucun verrouillage dû à leur origine. Un paramètre imposé par un Format spécialisé reste réel, visible et grisé avec sa raison ; une durée calculée non modifiable est noire sans pastille selon CE-UI-10, distincte du gris verrouillé. Les valeurs reprises du Profil gardent le fond orange jusqu’au premier ✓, sans assimiler un défaut de modèle à un défaut Profil.

30/30 initial : 6 séries identiques, Objectif de durée 30 s, Pause 30 s, durée 6 min, Récupération 0 s. Le 30/30 ne crée pas de récupération pour représenter une pause.

Cadence AMRAP/For time : Sans sélectionné par défaut, Autre et 1 s disponibles ; aucune incidence sur calcul temporel ou résultat. Death by reste Sans.

## 4. Composition et volumes

Circuits porteurs : identité Format d’origine et nature fixée, valeurs applicables modifiables. AMRAP affiche bloc(s), tours réservés à la boucle. Death by alterné affiche « Death by · jusqu’à l’échec · alternées » sans durée ; chaque membre garde l’intervalle local. Groupé coordonné : Durée de chaque tour = intervalle commun, en bleu modifiable. Circuit Tabata standard, nom Circuit et compte modifiable.

Cartes et phrases lisent les paramètres effectifs ; aucun texte persisté ne pilote un calcul. Dialogue de sortie AMRAP : composant DSF / Overlays / Confirmation, Trois actions, Conserver le format AMRAP principal bleu par défaut, Adopter un format libre secondaire, Annuler.

## 5. Tableau Progression et déroulé

Questionnaire sans ligne de répétitions globale ; récapitulatif : tableau Mouvement sous Nombre de séries, avant Pause/Durée totale/Exécution. Fond blanc rayon 8 dans cadre gris, titres gris et séparateurs fins ; trait sous Nombre de séries. Une ligne par mouvement, colonnes S1…SN, répétitions puis charge si Avec pour cet Exercice ; aucun interrupteur global.

Tap cellule : clavier numérique répétitions, décimal charge, Suivant vers la cellule suivante dans l’ordre de la série. Tableau et cellule actifs visibles au-dessus du clavier ; autres réglages via modale. En référence 874 px, en-tête 28 px, ligne avec charge 44 px, espace 12 px avant Déroulé. Les paramètres réutilisent les données standards de séries, pas une nouvelle structure fonctionnelle.

Écart bas du cadre Déroulé → haut du bouton d’action : 25 px dans les écrans Formats concernés. Le titre suit son cadre. Hauteur égale pour données constantes ou déroulé générique, proportionnelle aux répétitions variables ; les charges ne deviennent pas des durées.

## Phases dans les modales de format

Appliquer D-446 et CE-UI-10 : phases compatibles selon les paramètres effectifs ; aucune dernière phase calculée ni adaptation proportionnelle historique. Phases du mouvement dans son bloc dédié. Ne pas confondre durée d’effort et intervalle EMOM/Death by.

## Preuves et limites

La galerie active et son inventaire indiquent pour chaque nœud la capture disponible ou la limite d’export. Figma décrit le rendu et les états représentés, la spécification les comportements et calculs. Une capture ne prouve pas le fonctionnement ; un état sans maquette dédiée ne bloque pas un comportement suffisamment spécifié. Aucun moteur, résultat d’exécution ni nouvelle obligation de recette globale n’est livré par ce DSF.

## Portée actualisée le 5 novembre 2026

Ce relevé daté ne gouverne plus l’accès œil/Volumes en Composition (retiré, CE-CIR-03), ni les présentations des récapitulatifs remplacées par la référence Formats active : EMOM par série, Superset alterné trois tours, charges locales après activation globale et restauration temporaire dans le brouillon. Les autres observations historiques restent datées.

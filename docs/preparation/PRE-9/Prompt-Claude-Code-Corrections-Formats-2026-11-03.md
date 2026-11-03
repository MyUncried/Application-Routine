# Prompt Claude Code — Corrections des écrans Formats PRE-9 du 3 novembre 2026

Tu poursuis le développement Formats de KODJO dans `MyUncried/Application-Routine`, sur ta branche PRE-9 actuelle. **Implémente maintenant les corrections ci-dessous jusqu’à un résultat testable**, après avoir confronté l’existant aux sources. Ne t’arrête pas à un plan ou à un audit. Réutilise ce qui est déjà conforme et corrige les écarts confirmés.

## Sources à relire avant les changements

La documentation de `main` a été actualisée depuis la base `88f3ffc7`. Récupère le commit documentaire livré avec ce prompt et intègre-le proprement à ta branche, en préservant le développement en cours ; ne remets pas ta branche à zéro et n’écrase pas ses changements. Si les mêmes règles ont déjà été actualisées sur ta branche, consolide leur état final sans créer de prescriptions concurrentes.

Lis tout le périmètre affecté, pas seulement le diff du code :

- `docs/KODJO-Formats-entrainement-2026-11-02.md`, actualisé le 3 novembre : §7 à §7.5, §10, §12 et §16 ; les autres règles de portage et de composition restent applicables.
- Chapitre 06, galerie `formats-galerie` : captures actualisées et leurs nœuds Figma.
- Chapitre 08, section Formats ; chapitre 13, CE-FMT-01, CE-FMT-02 et CE-FMT-04.
- Chapitre 10 FMT-20 et FMT-21–25 ; chapitres 04/09/12 pour les invariants et le stockage existant.
- `_bmad-output/pre9/planning-artifacts/epics.md` C.2–C.4 et `architecture-pre9.md`.
- Source détaillée : `docs/sources/formats-2026-11-03/KODJO-Mise-a-jour-ecrans-formats-2026-11-03.md`.

Figma est la référence visuelle actuelle : fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page Prototype MVP `510:101`. Contrôle directement les frames et composants concernés avec le connecteur disponible. Les captures datées du 3 novembre sont indexées dans `docs/figma-formats-2026-11-02/captures.json`. Leurs identifiants restent stables même si les frames ont été déplacées sur le canevas.

## 1. Questionnaire et récapitulatif en modale

Tous les questionnaires et récapitulatifs Formats/départs rapides deviennent des modales sur la Composition : apparition par le bas, pleine largeur, juste sous le titre de Composition, coins hauts 24 px et bas carrés, sans poignée. La Composition reste visible derrière le voile.

En-tête : composant DSF / Overlays / En-tête de modale, variante Sélection sans validation ; questionnaire avec croix et nom du Format ; récapitulatif avec icon/retour et nom du Format. Titre Inter Semi Bold 18 centré, fond transparent et trait masqué localement. Zone de contexte depuis le haut de la modale, 109 px sur la référence ; tagline centrée 14/20 sur deux lignes. Ne modifie pas globalement les en-têtes de Fiche du mouvement : ils gardent fond blanc et trait.

Référence 402 × 874 : haut de modale y=95 ; bouton y=802 ; déroulé 25 px au-dessus. Adapte aux Safe Areas, dimensions et clavier par les mécanismes existants. Contenu défilant, bouton maintenu en bas ; clavier au premier plan au-dessus des modales.

Retire le champ Nom de Séance et le bloc Titre de séance de ces formulaires. Ils restent dans la Composition, visible derrière le voile. Préserve le nom existant, notamment personnalisé.

- Questionnaire : **Valider les paramètres** ouvre le récapitulatif sans ajout à la Composition, y compris AMRAP plusieurs blocs et états de saisie.
- Récapitulatif : **Enregistrer dans la séance** ajoute une seule fois la structure au brouillon ; la sauvegarde définitive reste celle de la Séance.
- Retour conserve les réponses ; croix du questionnaire revient à la Composition selon le contrat de brouillon existant.

Tagline Death by : « Une répétition de plus à chaque minute. On continue tant qu’on termine dans la minute. »

## 2. Mode catalogue intégré

Remplace « Ouvrir le catalogue » par **Ouvrir le mode catalogue**. Depuis un questionnaire, ce mode ne quitte pas la modale et n’ouvre pas de modale de Catalogue supplémentaire.

- Recherche détachée et toujours visible, texte repris et résultats déjà filtrés.
- Croix d’effacement visible lorsque le champ contient du texte : pastille grise 20 px, cible 44 × 44.
- Filtrer, Trier et nouveau contrôle Replier / déplier les piles sur la même ligne à droite ; ce dernier reprend gabarit visuel 34 × 34 et état inactif de Trier, cible tactile 44 × 44.
- Résultats en petites cartes et filet de famille jusqu’au bas de la modale ; aucun compteur « n familles · n mouvements » dans ce contexte.
- **Ajouter** applique la sélection et ferme ce mode ; **Fermer le mode catalogue** revient à la saisie sans ajout.
- Boucle : sélection multiple ; buy-in AMRAP : section Mouvement du buy-in et sélection unique.

Préserve le comportement du Catalogue appelé directement depuis le menu Composition : seule son ouverture depuis les questionnaires est remplacée par ce mode intégré.

## 3. Fiche du mouvement superposée

Dans questionnaire et récapitulatif, toucher la **photo** de la petite carte ouvre la Fiche du mouvement en consultation seule, par-dessus la modale Format avec un second voile. Réutilise la fiche habituelle : nom, catégorie, zones, niveau, média, description, phases ; aucune action de création, sélection ou modification.

Croix et titre « Fiche du mouvement », fond blanc et trait conservés, apparition par le bas, largeur complète et coins hauts 24 px. Fermer restitue réponses, recherche, sélection et état de la vue sous-jacente. L’appui sur le reste de la carte garde son comportement existant ; l’appui photo ne doit pas sélectionner/supprimer le mouvement par propagation du geste.

## 4. EMOM

**Mode Répétitions imposé**, Durée grisée et non sélectionnable, dans les modales standard et dans chaque intervalle et toutes les organisations. Applique la contrainte dans la validation des nouvelles configurations, pas seulement dans le rendu. Ne convertis ni ne réécris silencieusement des données historiques.

Récapitulatifs à plusieurs mouvements, dans chaque intervalle / alternance / à la suite : tableau **Mouvement | Rép.** juste sous Nombre de séries. Chaque ligne modifie les paramètres existants de son Exercice ; A=10 et B=15 restent distincts lors de l’enregistrement puis de la réouverture. Réutilise tableaux et saisies existants, sans second stockage.

Supprime la ligne **Repos · jusqu’à la cadence**. Le repos reste le temps résiduel de fenêtre ; aucun changement de formule ou de rythme du moteur n’est demandé.

## 5. Death by

Aux récapitulatifs multi-mouvements dans les trois organisations : tableau **Mouvement | Départ | Incrément** juste sous Intervalle. Il remplace les deux lignes communes Nombre de répétitions et Incrément par intervalle. Chaque Exercice porte ses valeurs propres, incrément ≥ +1 ; par exemple A=1/+1, B=2/+2. Le cas à un mouvement garde ses lignes.

Conserve les règles de portage actuelles, l’intervalle local Death by alterné, la fin collective du Circuit coordonné et les tests indépendants À la suite. Aucun nouveau champ ni nouvelle migration induite par ces tableaux.

## 6. Petites cartes et alignements

Dans le composant **Carte — Mouvement sélectionné**, 370 × 52 sur la référence, remplace la description tronquée par les zones corporelles précédées de leur pastille, 12 px gris comme en Composition. Applique aux variantes Possible/Bloquée/Aucune et à tous leurs usages : suggestions, mode catalogue, récapitulatifs. Préserve suppression glissée, dernier membre protégé et réordonnancement. Ne généralise pas le changement aux autres familles de cartes.

Dans les cadres des questionnaires/récapitulatifs, aligne les valeurs non modifiables sur le **texte** des valeurs modifiables, pas sur le bord de leur pastille : retrait 10 px sur la référence. Même alignement dans les colonnes numériques des tableaux. Tableau blanc arrondi dans cadre gris, en-têtes gris et séparateurs fins.

## Références Figma prioritaires

| Famille | Nœuds |
|---|---|
| Questionnaire, saisie, mode catalogue Tabata | `8624:29980`, `11335:20151`, `8598:29503` |
| Récapitulatifs Tabata et fiche superposée | `8624:30306`, `11146:18902`, `11472:20899` |
| AMRAP saisie, choix, buy-in, plusieurs blocs | `11335:19986`, `11220:19121`, `11220:19397`, `11410:20361` |
| EMOM récapitulatifs : commun, alterné, successif | `8624:30392`, `11158:18922`, `11158:19033` |
| EMOM paramètres : standard, commun | `8795:14588`, `8598:30515` |
| Death by : questionnaire et récapitulatif simple | `8624:30198`, `8624:30602` |
| Death by récapitulatifs : commun, alterné, successif | `11376:20189`, `11376:20325`, `11411:20474` |

Contrôle aussi les autres questionnaires/récapitulatifs de la galerie : la règle modale et les CTA sont communs à toute la famille, pas seulement à ces exemples.

## Vérification et livraison

Réutilise les composants existants : modales, en-têtes, recherche, filtres, tri, piles, cartes, tableaux, claviers et contrôles de paramètres. Ne crée un composant nouveau que si un manque réel le justifie, et explique-le brièvement. Pas de bibliothèque, de migration ou de nouveau moteur sans nécessité démontrée. Ne lance pas PRE-10/PRE-11 ; poursuis PRE-9 sans refaire les lots déjà conformes.

Ajoute ou adapte les tests utiles :

- transitions questionnaire/récapitulatif/Retour/croix, conservation des valeurs et du nom de Séance, absence d’ajout avant Enregistrer et absence de double ajout ;
- mode catalogue conservant la recherche, effacement, filtres/tri/piles, Ajouter et fermer sans ajout, sélection unique buy-in ;
- photo ouvrant la consultation seule et fermeture conservant l’état, geste distinct de la sélection ;
- EMOM imposant Répétitions et refusant une nouvelle configuration Durée ;
- tableaux EMOM et Death by avec valeurs différentes par mouvement, persistance et relecture à l’identique ; incrément minimum ;
- petites cartes toutes variantes sans régression de suppression/réordonnancement ;
- non-régression des porteurs, calculs de durées et ajouts au brouillon existants.

Vérifie le rendu sur les captures/Figma et sur le dispositif de recette disponible : en-têtes, voiles superposés, bouton fixe, défilement et clavier. Une assertion textuelle ne prouve pas la conformité visuelle. Exécute les contrôles requis du dépôt et les tests adaptés au périmètre ; distingue tests automatisés, comparaison visuelle et recette appareil réellement réalisés.

À la fin, livre un rapport court : changements réalisés, fichiers principaux, tests et résultats, état de la comparaison Figma, écarts ou blocages factuels restants. Actualise le suivi PRE-9 au stade réellement atteint ; ne déclare pas de recette iPhone sans l’avoir faite.

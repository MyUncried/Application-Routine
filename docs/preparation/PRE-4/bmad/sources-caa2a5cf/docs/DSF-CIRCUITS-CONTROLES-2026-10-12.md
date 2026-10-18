# DSF — Circuits, volumes et contrôles de séries — 12/10/2026

**Actualisation13/10 :** [DSF Deux modes et cible À l’échec](DSF-DEUX-MODES-ECHEC-2026-10-13.md) remplace les références à trois modes et complète les roulettes, cibles et totaux. Les dispositions non concernées restent applicables.

Référence courante pour les éléments ci-dessous. Complète le [DSF général](DSF-INTERFACE-GENERALE-2026-10-08.md) et remplace les anciennes descriptions d’interrupteur de régime, de steppers permanents par cellule et de compteur Circuit indivisible. Ne change ni shells ni règles métier. Sources : inspection directe des pages Prototype MVP et Fondations le 12/10 ; [inventaire préalable](INVENTAIRE-DSF-CIRCUITS-2026-10-12.md), [matrice des exports](MATRICE-DSF-CIRCUITS-2026-10-12.md).

Figma définit le layout. [Circuits](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#circuits), Paramètres v13 et CE-T03-08 / CE-UI-10 / CE-CIR-01…03 déterminent les données, interactions, bornes et calculs. Toutes les mesures sont des références à 402 × 874, pas des coordonnées absolues à reproduire sur tous les appareils. Safe Areas, texte agrandi, en-tête accessible et contenu défilant restent requis.

## En-tête du circuit et choix de nature

Le titre Circuit et l’œil sont sur la même ligne. La durée agrégée est sous le titre. À droite, le chiffre commande l’édition numérique ; la pastille porte seulement « tours » ou « séries » et ouvre le choix de nature. Les zones sont distinctes. Au repos, les ± ne sont pas permanents : ils apparaissent après appui sur la valeur, un seul champ actif. Les captures à ± visibles illustrent cet état ; elles ne redéfinissent pas le repos.

| Élément | Référence inspectée / mesure | Usage |
|---|---|---|
| Icône œil | Maître `8165:13756`, 24 × 24 ; paupières 20 × 14, pupille 4,5 × 4,5 | Accès permanent « Afficher les volumes du circuit », dans les deux natures |
| Assemblage compteur | `8328:34728`, 164 × 36 ; variante séries `8328:35031`, 170 × 36 | Chiffre séparé de l’unité ; largeur intrinsèque du libellé |
| Ancien maître Stepper / Tour | `5847:4029`, 137 × 36 | Ne constitue pas à lui seul le nouveau composant à deux interactions ; ne pas imposer sa largeur au nouvel assemblage |
| Popover Nature | `8328:34805`, x114/y416, 252 × 117 ; options 250 × 49 | Deux options avec titre et explication ; ancrer au déclencheur et adapter à l’espace disponible |
| Confirmation générique | Instance `8328:34964`, x24/y635, 354 × 215 | Annuler à gauche, Confirmer à droite ; exemple dynamique N=3, jamais valeur figée |

Le dialogue apparaît uniquement en cas de perte de séries/valeurs. Annuler conserve nature, compte et valeurs. Le fond et le popover derrière le dialogue sont inertes. La présence du popover derrière la confirmation n’autorise pas deux surfaces interactives simultanées.

## Modalités d’exécution et tableau variable

La ligne Séries regroupe le libellé, le régime identiques/variables, le chevron de repli indépendant en variable, puis le nombre à droite. Le régime ouvre son popover ; identiques n’a pas de chevron. Les modes d’exécution et choix de côtés reprennent les popovers exportés ; ne pas réintroduire les anciens segmentés dans ces emplacements.

| Élément | Maître / géométrie locale inspectée | Prescription |
|---|---|---|
| Ligne à deux colonnes | `8129:31593`, 334 × 36 | Poignée, numéro, cible, Pause, retrait ; pas deux steppers permanents |
| Poignée | x0/y9, 12 × 18 | Déplacement d’une ligne entière selon v13 ; alternative accessible requise |
| Numéro | x24/y10, 24 × 17, texte 14 | Position de la série |
| Cellules | x79/y6 et x175/y6, chacune 76 × 24 | Cible puis Pause ; cellule active distincte ; unité selon le mode |
| Retrait | Zone x294/y0, 36 × 36 | Suppression immédiate avec Annuler selon contrat ; indisponible si N hérité |
| Pied commun de réglage | `8129:31601`, 354 × 48 | Nom de la cellule active à gauche, ± à droite ; agir uniquement sur cette cellule |
| Libellé actif du pied | x12/y17, texte 12 | Exemple « Série 1 · Durée » ; annoncer série et champ |
| Groupe ± du pied | x254/y6, 88 × 36 | Conserver paliers et bornes du champ, définis par la spécification |
| Icône retirer | `8129:31604`, 24 × 24, trait 14 px | Maître existant ; les copies exportées montrent encore une croix : existence ne vaut pas propagation |

Les dimensions du dessin ne définissent pas à elles seules la cible accessible. Garder des zones sans chevauchement et les règles d’accessibilité communes. Le tableau n’a pas de défilement vertical indépendant du corps. Un seul champ est actif ; toucher ailleurs ferme le réglage sans déclencher une suppression située sous ce toucher.

Les feuilles courantes sont illustrées notamment par Durée variable `8328:38632`, Répétitions `8328:38741`, À l’échec `8328:38848`, repli `8328:39181`, déplacement `8328:39279` et régime `8328:39390`. La cible À l’échec n’est pas un nombre modifiable. Ne pas transposer le ✓ de la grille des volumes à tous les champs sans référence correspondante.

## Lecture seule avec origine extérieure

Trois situations doivent rester distinctes : modifiable, sans effet (grisé / tiret selon les règles existantes), et valeur effective héritée. Sous circuit de séries, le nombre effectif reste visible et non modifiable, avec raison discrète ; ce n’est ni un tiret ni une valeur masquée. Le total affichable reste lui aussi en lecture seule. L’ordre des côtés demeure un paramètre de l’exercice ; ne pas le déclarer hérité du circuit.

Le set Valeur modifiable `6944:26423` expose Texte 13/14 × État Normal/Grisé (quatre variantes). Il n’expose pas de variante héritée identifiée. La position de l’astérisque ou de la mention n’est pas fixée par les captures retrouvées. Cette dette Figma reste ouverte ; aucun nouvel emplacement n’est inventé ici. Le comportement, lui, est tranché.

## Volumes du circuit

Feuille basse blanche, en-tête avec fermeture à gauche, titre « Volumes du circuit », grille en lecture seule. Aucun bouton de validation de données. Références `8328:34965` (séries) et `8328:35135` (tours).

| Partie | Mesure de l’exemple 402 × 874 |
|---|---|
| Feuille | x0/y684, 402 × 190 pour deux exercices |
| En-tête | x12/y0, 378 × 60, coordonnées dans la feuille |
| Grille | x12/y60, 378 × 130 |
| Titre | x73/y19 dans l’en-tête, 232 × 22 |

La hauteur suit le contenu disponible ; ne pas coder 190 comme plafond. Colonnes Exercice, S1…Smax, Unité ; première et dernière fixes lorsque les colonnes de séries défilent horizontalement. Défilement vertical de la liste. Répétitions : nombre + rép. en dernière colonne ; Durée : min:ss ; À l’échec : ✓ dans chaque cellule existante, « À l’échec » en dernière colonne. Série absente : tiret. Cible bilatérale par côté, direction près du nom. Ni pauses ni récupérations dans cette grille.

Écarts conservés dans les exports : cellule S3 vide pour Extension du genou dans la vue tours ; directions absentes des lignes de grille. Les exemples ne couvrent pas ✓, grand N, défilements, colonnes gelées ni texte agrandi. Ces comportements ne sont pas abandonnés : ils restent prescrits par CE-CIR-03, sans prétendre qu’une capture statique les démontre.

## Composants et qualification

Ce lot met à jour le DSF documentaire et les preuves visuelles ; il ne modifie pas les maîtres Figma. Les nouveaux composants de ligne, pied et œil sont présents, mais les assemblages Circuit et Volumes ne sont pas déclarés entièrement factorisés. Les dettes de variantes et de propagation sont tracées dans la matrice. Aucun test applicatif ni changement du périmètre PRE-3.

## Raccordement Formats du 14/10/2026

Le [DSF Formats](DSF-FORMATS-SEANCES-2026-10-14.md) complète ce document : organisation Par exercice/En alternance, compte nommé selon son unité, constantes Tabata grisées mais effectives et phrases contextuelles. L’état imposé effectif conserve une valeur réelle ; ne pas lui appliquer le tiret des valeurs sans effet. Les cartes de modèles illustrées ne changent pas la règle des cartes catalogue. Les points de layout non qualifiés restent signalés dans la [revue transverse](REVUE-COHERENCE-FORMATS-2026-10-14.md).

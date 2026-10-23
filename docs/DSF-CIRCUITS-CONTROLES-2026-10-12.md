# DSF — Circuits, volumes et contrôles de séries — 12/10/2026

**Actualisation13/10 :** [DSF Deux modes et cible À l’échec](DSF-DEUX-MODES-ECHEC-2026-10-13.md) remplace les références à trois modes et complète les roulettes, cibles et totaux. Les dispositions non concernées restent applicables.

**Mise à jour du 18/10/2026 — spécification v3.0 :**
- Arbitrages de Hermann du 18/10/2026 : chaque cellule du tableau variable utilise le sélecteur existant de son champ, pour cette seule cellule (D-417) ; à une seule série, la ligne Enchainement n’apparaît pas (D-415).
- Remplacé pour la présentation : dans « Paramètres d’exécution et tableau variable », la ligne Séries (régime par popover, chevron de repli indépendant, nombre à droite) et les popovers de mode et de côtés (D-413, D-410, D-406 : lignes Nombre de séries, Type de série, Mode et Changement de côté en contrôles segmentés) ; le pied commun de réglage, son libellé actif et son groupe ± (D-413 : pas de boutons +/− de tableau) ; la position du numéro de série, rapproché de la poignée (D-413) ; la direction affichée près du nom dans la grille Volumes (D-407). La ligne de série reçoit une colonne Charge lorsque la charge est Avec (D-404). Bornes, paliers, déplacement, retrait et grille Volumes restent régis par leurs règles.
- Comportements : règles RM-235 à RM-250 du chapitre 10, [Charge, côtés, cadence et condition d’arrêt — règles du 18/10/2026](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#charge-côtés-cadence-et-condition-darrêt--règles-du-18102026) (décisions D-403 à D-413 du [registre](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md#parametres-execution-20261018)) ; ce DSF n’en reprend pas l’énoncé. Les valeurs des captures restent illustratives.
- Présentation nouvelle de la feuille des paramètres (D-413 ; spécification v3.0, GR-01 et PR-01 à PR-04 ; référence 402 × 874) : quatre cadres successifs espacés de 8 px, dans l’ordre de D-413 ; contrôles segmentés alignés à droite, titres à gauche, sans enveloppe blanche ; tableaux à fond blanc sans contour, lignes de 36 px, sans boutons +/− de tableau ; Cadence en 12 px ; labels Regular, plus petits que les valeurs ; options inactives en texte gris Regular sur le fond des champs variables ; option sélectionnée selon le traitement violet existant ; saisie de la charge au clavier décimal, tableau visible au-dessus du clavier avec une marge de 12 px (D-405) ; chevrons à l’intérieur des options Variables (Type de série) et Avec (Changement de côté) (D-410) ; Durée de l’exercice avec son chevron à 12 px du libellé (D-409).
- Tokens : les valeurs correspondantes sont à relever dans Figma avant publication ; aucun nouveau token n’est défini ici.

Référence courante pour les éléments ci-dessous. Complète le [DSF général](DSF-INTERFACE-GENERALE-2026-10-08.md) et remplace les anciennes descriptions d’interrupteur de régime, de steppers permanents par cellule et de compteur Circuit indivisible. Ne change ni shells ni règles métier. Sources : inspection directe des pages Prototype MVP et Fondations le 12/10 ; [inventaire préalable](INVENTAIRE-DSF-CIRCUITS-2026-10-12.md), [matrice des exports](MATRICE-DSF-CIRCUITS-2026-10-12.md).

Figma définit le layout. [Circuits](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#circuits), Paramètres v13 et CE-T03-08 / CE-UI-10 / CE-CIR-01…03 déterminent les données, interactions, bornes et calculs. Toutes les mesures sont des références à 402 × 874, pas des coordonnées absolues à reproduire sur tous les appareils. Safe Areas, texte agrandi, en-tête accessible et contenu défilant restent requis.

## En-tête du circuit et choix de nature

Le titre Circuit et l’œil sont sur la même ligne. La durée agrégée est sous le titre. À droite, le chiffre commande l’édition numérique ; la pastille porte seulement « tours » ou « séries » et ouvre le choix de nature. Les zones sont distinctes. Au repos, les ± ne sont pas permanents : ils apparaissent après appui sur la valeur, un seul champ actif. Les captures à ± visibles illustrent cet état ; elles ne redéfinissent pas le repos. **Remplacé par D-442 (22/10/2026) :** le stepper du nombre de Tours ou de Séries est toujours affiché et actif (− et + autour du nombre), sans toucher préalable ; le nombre est au format « Valeur modifiable » ; les cibles du −, du + et de la pastille d’unité sont espacées et d’au moins 44 pt ; nombre, unité et durée ont la taille du titre « Circuit » ; la durée affichée est arrondie à la minute la plus proche au-delà de 3 minutes. **Remplacé par D-443 (23/10/2026) :** la durée du Circuit n’est plus affichée dans son en-tête, et le stepper du nombre de Tours ou de Séries y est aligné à droite.

| Élément | Référence inspectée / mesure | Usage |
|---|---|---|
| Icône œil | Maître `8165:13756`, 24 × 24 ; paupières 20 × 14, pupille 4,5 × 4,5 | Accès permanent « Afficher les volumes du circuit », dans les deux natures |
| Assemblage compteur | `8328:34728`, 164 × 36 ; variante séries `8328:35031`, 170 × 36 | Chiffre séparé de l’unité ; largeur intrinsèque du libellé |
| Ancien maître Stepper / Tour | `5847:4029`, 137 × 36 | Ne constitue pas à lui seul le nouveau composant à deux interactions ; ne pas imposer sa largeur au nouvel assemblage |
| Popover Nature | `8328:34805`, x114/y416, 252 × 117 ; options 250 × 49 | Deux options avec titre et explication ; ancrer au déclencheur et adapter à l’espace disponible |
| Confirmation générique | Instance `8328:34964`, x24/y635, 354 × 215 | Annuler à gauche, Confirmer à droite ; exemple dynamique N=3, jamais valeur figée |

Le dialogue apparaît uniquement en cas de perte de séries/valeurs. Annuler conserve nature, compte et valeurs. Le fond et le popover derrière le dialogue sont inertes. La présence du popover derrière la confirmation n’autorise pas deux surfaces interactives simultanées.

## Paramètres d’exécution et tableau variable

[remplacé par D-413 et D-410 le 18/10/2026] La ligne Séries regroupe le libellé, le régime identiques/variables, le chevron de repli indépendant en variable, puis le nombre à droite. Le régime ouvre son popover ; identiques n’a pas de chevron. Les modes d’exécution et choix de côtés reprennent les popovers exportés ; ne pas réintroduire les anciens segmentés dans ces emplacements.

| Élément | Maître / géométrie locale inspectée | Prescription |
|---|---|---|
| [complété par D-404 le 18/10/2026 : colonne Charge lorsque la charge est Avec, RM-238] Ligne à deux colonnes | `8129:31593`, 334 × 36 | Poignée, numéro, cible, Pause, retrait ; pas deux steppers permanents |
| Poignée | x0/y9, 12 × 18 | Déplacement d’une ligne entière selon v13 ; alternative accessible requise |
| [remplacé par D-413 le 18/10/2026 : numéro rapproché de la poignée, mesure à relever dans Figma] Numéro | x24/y10, 24 × 17, texte 14 | Position de la série |
| Cellules | x79/y6 et x175/y6, chacune 76 × 24 | Cible puis Pause ; cellule active distincte ; unité selon le mode |
| Retrait | Zone x294/y0, 36 × 36 | Suppression immédiate avec Annuler selon contrat ; indisponible si N hérité |
| [remplacé par D-413 le 18/10/2026] Pied commun de réglage | `8129:31601`, 354 × 48 | Nom de la cellule active à gauche, ± à droite ; agir uniquement sur cette cellule. Sans cellule active, le pied reste affiché et ses ± sont indisponibles (décision PRE-4 Q26 du 16/10, D-385). Sur une cellule active dont la cible est à renseigner, + donne la valeur minimale (5 s ou 1) et − est indisponible (Q26) |
| [remplacé par D-413 le 18/10/2026] Libellé actif du pied | x12/y17, texte 12 | Exemple « Série 1 · Durée » ; annoncer série et champ |
| [remplacé par D-413 le 18/10/2026] Groupe ± du pied | x254/y6, 88 × 36 | Conserver paliers et bornes du champ, définis par la spécification |
| Icône retirer | `8129:31604`, 24 × 24, trait 14 px | Maître existant ; les copies exportées montrent encore une croix : existence ne vaut pas propagation |

Les dimensions du dessin ne définissent pas à elles seules la cible accessible. Garder des zones sans chevauchement et les règles d’accessibilité communes. La règle de défilement du tableau est désormais énoncée au [chapitre 13, CE-UI-10, « 10. Responsive, Safe Areas, texte, scroll et clavier »](Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#10-responsive-safe-areas-texte-scroll-et-clavier-5) (transfert G4). Un seul champ est actif ; toucher ailleurs ferme le réglage sans déclencher une suppression située sous ce toucher.

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

La hauteur suit le contenu disponible ; ne pas coder 190 comme plafond. Colonnes Exercice, S1…Smax, Unité ; première et dernière fixes lorsque les colonnes de séries défilent horizontalement. Défilement vertical de la liste. Répétitions : nombre + rép. en dernière colonne ; Durée : min:ss ; À l’échec : ✓ dans chaque cellule existante, « À l’échec » en dernière colonne. Série absente : tiret. Cible bilatérale par côté, [remplacé par D-407 le 18/10/2026 : sans direction, RM-243] direction près du nom. Ni pauses ni récupérations dans cette grille.

Écarts conservés dans les exports : cellule S3 vide pour Extension du genou dans la vue tours ; [sans objet depuis D-407 le 18/10/2026 : aucune direction à afficher] directions absentes des lignes de grille. Les exemples ne couvrent pas ✓, grand N, défilements, colonnes gelées ni texte agrandi. Ces comportements ne sont pas abandonnés : ils restent prescrits par CE-CIR-03, sans prétendre qu’une capture statique les démontre.

## Composants et qualification

Ce lot met à jour le DSF documentaire et les preuves visuelles ; il ne modifie pas les maîtres Figma. Les nouveaux composants de ligne, pied et œil sont présents, mais les assemblages Circuit et Volumes ne sont pas déclarés entièrement factorisés. Les dettes de variantes et de propagation sont tracées dans la matrice. Aucun test applicatif ni changement du périmètre PRE-3.

## Raccordement Formats du 14/10/2026

Le [DSF Formats](DSF-FORMATS-SEANCES-2026-10-14.md) complète ce document : organisation Par exercice/En alternance, compte nommé selon son unité, constantes Tabata grisées mais effectives et phrases contextuelles. L’état imposé effectif conserve une valeur réelle ; ne pas lui appliquer le tiret des valeurs sans effet. Les cartes de modèles illustrées ne changent pas la règle des cartes catalogue. Les points de layout non qualifiés restent signalés dans la [revue transverse](REVUE-COHERENCE-FORMATS-2026-10-14.md).

### Cible variable — accès au choix

Toucher la cellule cible ouvre la roulette sur sa cible courante, numérique ou À l’échec. Le choix s’applique à cette cellule seulement. Le pied commun est retiré (D-413) ; chaque cellule utilise le sélecteur de son champ (D-417). ✓ de la roulette applique la sélection au brouillon de la feuille ; ✕ de la roulette restaure la valeur à son ouverture. ✓ de la feuille applique l’ensemble au parent ; ✕ de la feuille annule toutes les modifications depuis son ouverture, y compris celles validées dans une roulette. Aucune persistance définitive à la validation de la roulette.

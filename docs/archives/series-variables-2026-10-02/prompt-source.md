# Prompt — Mise à jour de la documentation : Séries variables et Ordre des côtés

Tu reprends une tâche de **propagation documentaire**. La conception fonctionnelle (spec du 2 octobre 2026) est validée ; la conception Figma vient d'être menée, et elle a produit des **décisions qui modifient ou complètent la spec**. Écris en français. Lis ce document en entier avant d'agir.

## 1. Mission

1. Intégrer dans la documentation normative du dépôt `MyUncried/Application-Routine` (dossier `docs/`) la conception « Séries variables » + « Ordre des côtés », **telle qu'amendée par la section 4 ci-dessous**.
2. Remplacer (ne pas faire coexister) les règles contradictoires listées en section 3.
3. Signaler explicitement, sans les trancher seul, les points de la section 5.
4. Ne rien modifier dans le code, dans Figma, ni rouvrir PRE-1.

## 2. Sources

- Spécification : `KODJO_CONCEPTION_SERIES_VARIABLES_ORGANISATION_COTES_2026-10-02.md` (décisions C1 à C27, scénarios A à F). Les numéros de lignes cités plus bas renvoient à ce fichier.
- Figma : fileKey `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP » (`510:101`). Les écrans de travail sont préfixés « Copie — » et se trouvent dans la rangée y = 8268 (x ≥ 5773) ; ils seront intégrés aux écrans existants (voir section 7).
- Principe de travail de l'utilisateur : **les écrans n'illustrent que des présentations d'interface, jamais des règles de calcul**. Les règles de calcul vont dans la documentation.

## 3. Règles anciennes à remplacer (rappel de la spec §13, confirmé)

1. `C−1` pauses systématiques.
2. « Aucune pause après la dernière série ».
3. « La Récupération ne remplace jamais la dernière Pause ».
4. « Pause et Pause au changement de côté ne se cumulent jamais ».
5. Le repli `PC > 0 ? PC : Pause entre séries`.
6. « Toutes les séries du premier côté puis toutes celles du second » comme règle unique.
7. Les formules D-208 / D-232 / v11 fondées sur ces hypothèses.
8. Les règles de Plan d'Exécution qui supposent une cible et une Pause uniques par Exercice.

Contradiction historique à corriger **explicitement** (ne pas la résoudre silencieusement) : le code et des tests historiques ont déjà « la Récupération remplace la dernière Pause », tandis que la documentation consolidée récente dit `C−1` et « récupération indépendante ». La cible est : une Pause existe après chaque Série, la Pause terminale existe dans l'Exercice, et une Récupération positive la remplace uniquement à l'exécution d'une occurrence.

## 4. Décisions prises depuis la spec (à intégrer)

### 4.1 Terminologie (remplace C11-bis)

| Spec (à remplacer) | Nouveau |
|---|---|
| Organisation des côtés | **Ordre des côtés** |
| Séries groupées (défaut) | **Un côté après l'autre** (défaut) |
| Par série | **Les deux côtés à chaque série** |
| Pause au changement de côté (PC) | **Pause entre les côtés** |
| Pause après Série (Pᵢ) | libellé d'interface : **Pause après chaque série** (concept inchangé) |

- Les ordres d'exécution canoniques (§6) et les formules (§7) **ne changent pas** ; seuls leurs titres et noms changent.
- Notation d'illustration retenue : flèches « → » et parenthèses de groupes, par exemple `(D1 → D2) → (G1 → G2)` pour « Un côté après l'autre » et `(D1 → G1) → (D2 → G2)` pour « Les deux côtés à chaque série ». Cette notation est un moyen d'illustration ; elle ne redéfinit pas « Série » (voir 4.2).
- Sections touchées de la spec (numéros de ligne) : `Organisation des côtés` 37, 340, 345, 353, 510, 523, 546, 564, 604, 773, 887, 993, 1053 ; `Séries groupées` 37, 342, 357, 360, 488, 514, 523, 525, 550, 552, 564, 636, 666, 678, 715, 765, 1014, 1035, 1103 ; `Par série` 37, 195, 197, 343, 358, 364, 479, 515, 519, 551, 553, 637, 684, 690, 725, 769, 812, 1015, 1016, 1035, 1121 ; `Pause au changement de côté` 25, 209, 213, 591, 605, 704, 871, 888, 913, 1167. Sections : §1, C5, C11, C11-bis, C16, C18, C20, C21, C24, C26, §6.2 à 6.5, §7.2, §7.3, §7.5, §12, §16, §17 (scénarios C et D).
- La liste « Contraintes impératives pour Figma » (§16) cite `Séries groupées / Par série` : la mettre à jour avec les nouveaux libellés.

### 4.2 Pourquoi « Série » ne change pas de sens

Une alternative a été étudiée puis écartée : définir la série comme « groupe de côtés » ou « groupe d'exercices ». Elle faisait varier le nombre de séries (3 ou 2) selon l'option pour une même valeur du stepper, contredisait « N séries par côté », le compteur « Série n/N » et les lignes du tableau, et employait « exercice » pour désigner un passage.
**Décision** : la Série reste une définition stable (une cible + une Pause, numérotée 1..N, exécutée sur chaque côté). Seul l'**ordre** varie. Les deux Pauses (« Pause après chaque série » et « Pause entre les côtés ») gardent un sens fixe ; **seule leur fréquence change** :

| Configuration (N = 3, D→G) | Pause après chaque série | Pause entre les côtés |
|---|---|---|
| Les deux côtés à chaque série | ×3 (après chaque paire D/G ; la dernière est la Pause terminale) | ×3 (entre D et G, dans chaque série) |
| Un côté après l'autre | ×6 (chaque Pᵢ revient sur les deux côtés) | ×1 (entre D3 et G1) |

À la frontière des deux côtés dans « Un côté après l'autre », la spec impose P3 puis PC (§6.2) : conserver ce comportement.

### 4.3 Séries variables : présentation et états (compléments à C13, C15, C17, C18, C22)

- **Contrôle** : un interrupteur « Séries variables », sous la ligne « Séries ».
- **Détail des séries** : tableau dans la même feuille, une ligne par série (numéro aligné à droite sans symbole, valeur cible, Pause), les deux valeurs modifiables **directement par stepper**, sans modale supplémentaire. En Répétitions la colonne cible est « Répétitions » ; en À l'échec elle affiche « À l'échec » (non modifiable) et seule la Pause est modifiable.
- **Attache visuelle** : le tableau est présenté comme rattaché à la ligne « Séries variables » (encadré à fond gris clair et contour) ; il disparaît quand l'interrupteur est désactivé.
- **Masquer / afficher** : un chevron sur la ligne « Séries variables » replie le tableau (présentation uniquement, sans effet fonctionnel). La Durée totale reste visible.
- **Durée totale** (complète C10) : en lecture seule en mode variable ; **elle affiche « — » tant qu'une série est incomplète** (valeur non calculable). En Répétitions, libellé « Durée totale ≥ » ; en À l'échec, aucune Durée totale.
- **N = 1** (précise C17/C18) : « Séries variables » et « Ordre des côtés » restent visibles mais **inactives (grisées)**, sans texte explicatif. Aucun message temporaire à la désactivation de « Séries variables » (décision explicite de l'utilisateur).
- **Validation impossible** (précise C22) : le ✓ est grisé, la cellule incomplète est signalée et un message en ligne indique la série à renseigner.
- **Changement de mode** (illustre C9) : les cibles incompatibles passent à « — » ; les Pauses sont conservées.
- **Défilement** : toute la feuille défile ; l'en-tête ✕ / ✓ reste fixe.
- Aucun libellé « par côté · N passages » ni « Sans effet avec une seule série » n'est retenu.

### 4.4 Résumé et lignes de séance (complète C13 / §10)

- **Carte « Paramètres d'exécution »** : `N séries variables : v1 · v2 · v3 …` (les trois premières valeurs, puis « … » s'il y en a davantage ; valeurs manquantes affichées « — »). En Répétitions : `12 · 10 · 8 rép.`. En À l'échec : `pauses 30 s · 45 s · 1 min`. La Durée totale suit en lecture seule. La carte ne détaille toujours pas toutes les séries.
- **Ligne d'exercice dans une séance** (composition, séances déployées) : `N séries variables` seul, sans les valeurs.
- La phrase de la carte intègre l'ordre des côtés : `droite puis gauche, un côté après l'autre` ou `…, les deux côtés à chaque série`.

### 4.5 Durée de l'occurrence (option retenue : b)

- Dans les contextes de **séance** (totaux de composition, séances déployées, calendrier, exécution), les durées sont des **durées d'occurrence** (`T − PN + R`). Dans le catalogue et pour une exécution directe, c'est la durée intrinsèque.
- Conséquence à documenter : lorsque `R > 0`, la durée d'occurrence est **identique** à l'ancien calcul (`C−1` pauses + R) ; elle ne diffère que si `R = 0` et `P > 0`, où l'exercice gagne sa Pause terminale.
- Aucun écran dédié : c'est une règle de calcul (principe 2).

### 4.6 Exécution (complète C16, C27)

- `Série n/N` et côté courant séparé (inchangé). **Aucune barre de progression par Série** : seule la barre « Tour » est conservée (la segmentation par série serait ambiguë : 3 groupes d'un côté, 2 de l'autre selon le point de vue).
- Libellé de « À suivre » : **Pause**, **Pause entre les côtés**, ou **Récupération** (uniquement la Pause terminale d'une occurrence avec R > 0). En exécution directe il n'y a jamais de Récupération (C25) : la Pause terminale s'affiche « Pause ».
- « Temps écoulé / total » : le total est la durée de l'occurrence.

### 4.7 Valeurs de démonstration et durées affichées

- Avec « Pause après chaque série » (N pauses), les exercices uniformes de démonstration passent de 5 min à **5 min 15 s** (3 × 1 min 30 s, pause 15 s) ; en Répétitions, de ≥ 2 min 45 s à **≥ 3 min** ; en bilatéral « Un côté après l'autre » (PC = 10 s) à **10 min 40 s**, « Les deux côtés à chaque série » à **10 min 15 s**.
- Scénarios vérifiés lors de cette relecture : A = 195 s (3 min 15 s), B = 285 s, C = 405 s (6 min 45 s), D = 375 s (6 min 15 s). **Le scénario E (Répétitions) n'a pas de valeur dans la spec** : l'ajouter, `≥ 195 s` soit `≥ 3 min 15 s` (Σ des répétitions × 2 s = 60 s, plus Σ des Pauses = 135 s).

## 5. Points à signaler, sans les trancher seul

1. **Réordonnancement des séries** (nouveau comportement, absent de la spec) : le tableau offre une poignée pour déplacer une ligne. Règle proposée à valider : la cible et la Pause d'une série se déplacent ensemble ; la ligne finale porte la Pause terminale ; la désactivation (C2) reprend la nouvelle première ligne ; interaction avec la restauration du brouillon (C7) à préciser.
2. **Granularité des steppers** : la spec fixe des bornes, pas de pas. Proposition : 5 s pour les durées et les Pauses (comme la roulette actuelle), 1 pour les répétitions, maintien selon D-237. Précision de 1 s à confirmer ou non.
3. **Cohérence avec C21** : C21 garantit que l'ordre et la quantité de travail des Exercices existants ne changent pas. Or la Pause terminale devenant exécutée, la **durée affichée** des exercices existants augmente d'une Pause (exécution directe, ou occurrence avec R = 0). Rédiger C21 pour dire explicitement que c'est un changement de durée assumé, pas de travail.
4. **Alignement de vocabulaire hors feuille** : la préférence de profil « Pause au changement de côté » (écran « Profil — Stepper Pause changement de côté » et valeur par défaut associée) doit-elle devenir « Pause entre les côtés » ? Recommandation : oui, un seul terme dans tout le produit. Impacts Glossaire, Modèle fonctionnel, Contrats d'écran.
5. **État d'affichage à N = 1 avec un brouillon variable** : l'interrupteur grisé affiche-t-il l'état antérieur (activé) ou « désactivé » ? Figma montre « désactivé » dans le cas uniforme ; le cas brouillon variable est à décider.
6. **Couverture G→D** : l'illustration G→D a été retirée à dessein (le seul changement est l'inversion des lettres dans la notation). Noter que G→D n'a plus d'écran dédié, sans que cela invalide l'item 7 de la liste de la spec §16.
7. Numéros de décisions : vérifier la dernière décision publiée dans `07 – Registre des décisions de conception.md` avant de numéroter (D-246 était la dernière connue) ; ne pas supposer.

## 6. Documents à examiner (instantané du dépôt cloné le 2 octobre 2026 : à revérifier sur `main`)

Formulations repérées (`Pause au changement de côté`, `C−1`, `Durée totale`, `bilatéral`, « pause entre les séries ») :

- Racine : `docs/PRODUCT.md`, `docs/INDEX.md`.
- Spécifications : `00 – Glossaire`, `01 – Vision Générale`, `02 – Utilisateurs et besoins`, `03 – Parcours utilisateur`, `04 – Modèle fonctionnel`, `05 – Versions du produit`, `06 – Ecrans et navigation de la V1`, `07 – Registre des décisions de conception`, `08 – Conception fonctionnelle détaillée`, `09 – Modèle de données fonctionnel`, `10 – Processus métier et règles métier transverses`, `11 – API fonctionnelles`, `12 – Architecture technique`, `13 – Contrats d'écran`, `SPECIFICATION-PARAMETRES-MODALE-v11.md` (à remplacer par une version suivante, v10.2 restant archivée), `SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v10.2.md` (archive, ne pas réactiver).
- DSF et matrices : `DSF-PARAMETRES-MODALE-2026-10-01.md`, `DSF-V2-MOTIFS-LOT-3.md`, `MATRICE-TRACABILITE-BILATERALITE.md`, `MATRICE-TRACABILITE-RECUPERATION-DUREE-TOTALE.md`, `MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md`, `RAPPORT-CONFORMITE-BILATERALITE.md`, `RAPPORT-CONFORMITE-RECUPERATION-DUREE-TOTALE.md`, `MATRICE-COUVERTURE-FIGMA-CHAPITRE-06.md`, `MATRICE-ECRANS-CARTES-2026-09-30.md`, `SOURCE-SAISIE-PARAMETRES-MODALE-2026-10-01.md` (source utilisateur à conserver ; la préserver telle quelle et créer une nouvelle source datée).

Pour chaque fichier : indiquer s'il est modifié, remplacé, archivé ou inchangé, avec la raison.

## 7. Éléments Figma à documenter (chapitre 06 et DSF)

Écrans de travail (rangée « Copie — », à renuméroter à l'intégration) : Séries variables 1 à 6 (activation, Durée, Répétitions, À l'échec, 12 séries haut / bas) ; Ordre des côtés 7 et 8 (sélection des deux valeurs) ; Séries variables + Les deux côtés à chaque série ; Une seule série ; Changement de mode ; Validation impossible ; Tableau masqué ; Déplacement d'une série ; 4 résumés ; copie de « Composition séance — Standard » (ligne « 3 séries variables ») ; exemples d'exécution (Récupération, Pause entre les côtés, Pause) ; 12 copies corrigées des écrans « Paramètres en modale ».

Composants à formaliser (aujourd'hui en tests, zone « Tests — Composants Séries variables ») : ligne de série (numéro, poignée de déplacement, deux steppers de 128 px), ligne interrupteur, segmenté à deux options (options sur deux lignes, titre centré, notation en flèches), encadré du tableau (fond gris clair, contour), chevron de repli, indicateur de défilement. Respecter les prescriptions existantes du DSF (feuille, ligne sélectionnée, stepper commun, valeur lecture seule).

## 8. Règles de travail

- Les deux versions d'une règle ne coexistent jamais comme actives : superséder, archiver, ou supprimer avec trace.
- Aucune règle n'est inventée : ce qui n'est pas dans la spec ou en section 4 est un point de la section 5.
- Pas de modification du code, des tests, de Figma ; PRE-1 non rouvert ; l'intégration formelle précède la planification de PRE-2.
- Vérification de fin : rechercher dans `docs/` (hors archives) les anciens termes `Organisation des côtés`, `Séries groupées`, `Par série`, `Pause au changement de côté`, `Pause entre les séries`, `C−1` ; lister ceux qui subsistent et pourquoi.

## 9. Livrable attendu

Un rapport de mise à jour (fichiers modifiés / remplacés / archivés / inchangés), la liste des contradictions résiduelles, la liste des questions de la section 5 restées ouvertes, et les décisions ajoutées au registre (numérotées après vérification).

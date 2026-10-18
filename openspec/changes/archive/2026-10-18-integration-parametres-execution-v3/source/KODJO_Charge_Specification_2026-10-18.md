# KODJO — Évolution des paramètres d’exécution

Spécification fonctionnelle, analyse d’impact et mission d’intégration documentaire

Version 3.0 — 18 octobre 2026 — Arbitrages clos et spécification consolidée

## 1. Objet et statut

Permettre de renseigner une charge facultative en kilogrammes pour un exercice, commune à ses séries identiques ou définie par série variable. La charge est une information : Kodjo ne l’interprète pas et n’en déduit ni durée, ni performance, ni instruction de sécurité.

Ce document consolide les arbitrages de la conversation. Il est destiné à être réintégré dans la documentation principale, sans créer de chapitre permanent supplémentaire aux chapitres 01 à 13. Il comprend un prompt de travail OpenSpec en section 10. Le nom historique du fichier est conservé ; cette version remplace intégralement la version 1.0 centrée sur la charge.

Les impacts ci-dessous sont une analyse fonctionnelle et technique de conception, pas un audit du code actuel. Le dépôt, sa dernière révision et ses règles OpenSpec n’ont pas été inspectés pour ce livrable. Les emplacements exacts et mécanismes existants devront être vérifiés à l’intégration. Aucun développement, fusion ou changement documentaire dans le dépôt n’est déclaré réalisé.

Le périmètre comprend désormais la charge, le changement de côté sans désignation anatomique, les options rapides de cadence, le repli des signaux sous la durée, les chevrons intégrés aux options, la condition d’arrêt et les groupes visuels de paramètres. Les règles de charge ci-dessous restent applicables ; les autres évolutions sont spécifiées en section 9.

## 2. Périmètre

Inclus : création et modification des exercices, séries identiques et variables, activation/désactivation de la charge, saisie décimale, conservation des valeurs, phrase de synthèse et affichage de la charge courante pendant l’exécution.

Exclus : résistance d’élastique ou niveau de machine, autres unités, convention par haltère ou poids total, calcul de tonnage, estimation de force ou de calories, recommandations de charge, saisie d’une charge réellement réalisée distincte de celle prévue, nouveaux rapports de suivi. Ces sujets ne sont pas introduits implicitement.

La charge est indépendante du mode Durée/Répétitions, de la condition d’arrêt À la cible/À l’échec et du changement de côté. Elle ne crée aucune nouvelle combinaison interdite. Elle ne modifie pas les règles de phases ou de formats de séances.

## 3. Règles fonctionnelles

### CH-01 — Nature de la valeur

La charge est une valeur numérique informative en kg. Kodjo n’applique aucune convention liée au matériel : 10 kg représente exactement la valeur saisie par l’utilisateur. Aucun doublement par côté ou par nombre d’haltères n’est effectué.

### CH-02 — État initial et activation

La charge est désactivée par défaut : « Sans » est sélectionné. Les exercices antérieurs à cette évolution sont traités comme sans charge lorsqu’ils ne portent pas ce paramètre. Il ne faut pas les convertir en exercices avec une charge de 0 kg.

La ligne « Charge » utilise les options « Avec / Sans ». Pour les séries identiques, après saisie, la valeur avec son unité remplace « Avec », par exemple « 20 kg ». La valeur reste éditable.

### CH-03 — Séries identiques

Une seule charge s’applique aux séries identiques de l’exercice. La ligne est placée après la pause dans le bloc des paramètres de séries. L’activation doit permettre d’accéder directement à la saisie, sans écran préalable de choix de matériel ou de type de résistance.

### CH-04 — Séries variables

La ligne Charge — Avec / Sans reste sous le tableau ; son titre de colonne est non interactif. Avec affiche la colonne Charge ; Sans la masque tout en conservant les valeurs. Lorsque la charge est activée, le tableau permet de renseigner une charge par série. La valeur reste attachée à sa série lors d’un déplacement de ligne. Le tableau de référence présente les colonnes Durée ou Répétitions, Pause, Charge.

Les règles de remplissage initial, de champs vides, d’ajout/retrait de séries et de passage identiques/variables reprennent celles des autres champs de séries déjà spécifiées. Ne pas créer une autorisation particulière de charge vide et ne pas appliquer une propagation automatique non prévue par ces règles.

La saisie d’une nouvelle charge dans une série ne doit pas se propager automatiquement aux autres cellules par une règle particulière. Le comportement existant commun aux champs prévaut. L’initialisation commune à 0,25 kg décrite en CH-05 est le cas explicitement arbitré.

### CH-05 — Saisie décimale

La saisie accepte les décimales, notamment 2,5 kg et 1,25 kg. Le clavier numérique doit permettre le séparateur décimal. L’arrondi suit exclusivement le pas de 0,25 kg validé ci-dessous, sans message.

Le séparateur est présenté selon la langue de l’interface ; la couche de saisie normalise la valeur avant son enregistrement. L’unité kg est une information d’affichage, pas une partie du nombre enregistré.

Le pas est de 0,25 kg et la première valeur positive est 0,25 kg. Aucun plafond métier n’est imposé. Une saisie positive hors pas est automatiquement arrondie au multiple de 0,25 kg immédiatement supérieur, sans message. L’arrondi intervient à la sortie du champ ou à la validation, jamais pendant la frappe. Exemple : 1,3 kg devient 1,5 kg ; 1,25 kg reste 1,25 kg. Zéro reste zéro et signifie Sans charge. Les valeurs négatives ne représentent pas une charge valide ; appliquer le comportement standard des champs numériques du projet.

En séries identiques, zéro désactive la charge de l’exercice. En séries variables, zéro signifie sans charge pour la seule série concernée ; tant qu’une autre série a une charge positive, la charge reste activée globalement. Si toutes les séries passent à zéro, l’exercice passe automatiquement à Sans charge. Ne pas remplacer les valeurs zéro explicitement saisies par d’anciennes charges positives.

À la première activation, sans valeur mémorisée, initialiser la charge commune ou chaque série variable à 0,25 kg et ouvrir directement la saisie. Après une désactivation explicite par Sans, Avec restaure les valeurs mémorisées. Si toutes ces valeurs sont à zéro, Avec initialise chaque série à 0,25 kg. Si certaines seulement sont à zéro, restaurer les valeurs telles quelles, y compris ces zéros.

### CH-06 — Conservation avec Sans

Passer à « Sans » désactive la charge sans effacer la dernière valeur, ou les dernières valeurs par série. Revenir à « Avec » les restaure. L’état activé et les valeurs conservées doivent donc être distingués.

Lorsque la charge est désactivée, ses valeurs conservées ne sont ni présentées comme une consigne d’exécution ni ajoutées à la synthèse. La conservation des valeurs doit suivre le cycle normal d’enregistrement des paramètres, y compris après réouverture de l’exercice enregistré.

### CH-07 — Cohérence avec les autres paramètres

La charge suit le comportement existant de validation, annulation et modification des paramètres. Elle n’introduit pas de message ou de confirmation supplémentaires pour les changements de structure déjà gérés.

La suppression, le réordonnancement et la restauration éventuelle de séries doivent traiter la charge comme les autres valeurs de la série. La charge ne crée pas de valeur distincte pour chaque côté : cette possibilité n’a pas été demandée.

### CH-08 — Phrase de synthèse

Lorsque la charge est active et renseignée conformément aux règles de validation, la synthèse inclut « avec une charge de 10 kg », avec adaptation de la valeur. Avec « Sans », aucune mention de charge n’est produite.

Pour les séries variables, les valeurs sont associées aux séries correspondantes selon la grammaire existante des séries variables. Ne pas présenter une charge unique comme commune si les séries ont des charges différentes. Le positionnement exact du groupe de mots est à intégrer à la grammaire actuelle, sans réécrire les autres règles de génération.

Le générateur conserve son contrat existant de segments structurés, notamment pour le gras des valeurs. La phrase est recalculée depuis les paramètres ; elle n’est pas persistée en base. La charge ne change pas le statut des durées ni leurs symboles.

### CH-09 — Exécution

L’exécution affiche la charge correspondant à la série courante lorsqu’elle est active. En séries identiques, la valeur commune est utilisée ; en séries variables, la valeur de la série courante est utilisée. Aucun clic d’acquittement de charge n’est ajouté.

Figma définira l’emplacement et le traitement visuel de cette information. L’accord sur cet affichage ne valide pas un emplacement « à côté de la cible » : cet emplacement reste une décision de layout.

La charge ne modifie ni minuteurs, ni répétitions cibles, ni cadence, ni pauses, ni ordre d’exécution, ni condition d’arrêt, ni calcul de durée. Aucune modification de charge en cours d’exécution n’est ajoutée par cette évolution.

## 4. Références Figma et écarts de présentation à traiter

Fichier : https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg — page Prototype MVP. Les noms peuvent évoluer ; utiliser les identifiants et vérifier la version courante avant extraction.

| Référence | Identifiant | Rôle |
| --- | --- | --- |
| Création activité — Paramètres (modale) — Charge | 9289:17849 | Charge commune, valeur remplaçant Avec, Sans à droite |
| Création activité — Paramètres (modale) — Séries variables avec charge | 9290:17953 | Tableau à trois colonnes, exemples 20/25/30 kg |
| Création activité — Paramètres (modale) — Séries variables avec charge — Clavier numérique | 9292:18077 | Saisie directe, sans fenêtre supplémentaire, tableau visible au-dessus du clavier |
| Série en durée — Durée de l’exercice déployée | 9307:18208 | Référence distincte de déploiement des signaux, pas une règle de charge |

La ligne Charge avec Sans a été déployée sur 27 écrans existants de création/modification. Trois exemples avec charge ont été conservés ; la copie ultérieure de Série en durée hérite également de la ligne. Ces comptes décrivent les opérations de la session, pas un inventaire figé de la prochaine version Figma.

Écarts à reporter explicitement :

1. Le clavier de référence importé comporte les chiffres et l’effacement mais pas de séparateur décimal. Il doit illustrer une saisie décimale pour être aligné avec CH-05. Le clavier natif réel dépendra de la plateforme.
2. L’exemple des séries identiques montre la valeur déjà saisie ; l’état de saisie lui-même n’a pas été dessiné. Réutiliser le comportement de saisie existant cohérent avec la saisie directe validée pour les séries variables ; ne pas présenter une nouvelle modale comme déjà validée.
3. La ligne globale Charge — Avec / Sans sous le tableau est validée et ajoutée à 9290:17953. L’essai de titre de colonne cliquable est abandonné. À la demande de l’utilisateur, l’exemple avec clavier 9292:18077 n’a pas reçu cette ligne : cet état de présentation ne supprime pas le réglage disponible hors saisie.
4. L’affichage de la charge sur l’écran d’exécution n’est pas encore illustré dans les modifications de cette session.

Les chiffres de Figma sont illustratifs. Les règles de comportement et de calcul viennent des spécifications. Cette mission documentaire ne doit pas corriger Figma ni recalculer ses chiffres sans demande distincte.

## 5. Analyse d’impact

| Domaine | Modification nécessaire | Ampleur / limite |
| --- | --- | --- |
| Modèle des paramètres | Porter l’activation, la valeur commune et les valeurs par série selon la structure existante | Ajout localisé ; conserver les valeurs lorsque désactivées |
| Persistance / échanges | Étendre sérialisation, chargement, duplication et sauvegarde ; couvrir API, synchronisation, export/import si présents | Transverse mais additif ; noms et schémas à vérifier dans le dépôt |
| Compatibilité | Lire les anciens exercices sans champ de charge comme Sans | Ne pas imposer une réécriture massive sans nécessité technique |
| Éditeur | Ligne facultative, valeur éditable, colonne conditionnelle, saisie décimale | Impact principal sur les formulaires et le clavier |
| Séries variables | Associer la charge à l’identité de la série et aux opérations existantes | Éviter que la charge change de série lors du réordonnancement |
| Synthèse | Ajouter le groupe charge et les valeurs par série aux segments | Mettre à jour les exemples attendus sans multiplier artificiellement toutes les combinaisons |
| Exécution | Fournir et afficher la charge courante | Aucun changement d’ordonnancement ou de calcul ; adaptation du contexte affiché seulement |
| Historique | Si un instantané des paramètres est déjà enregistré, lui faire conserver la charge correspondante | Pas de nouveau module de rapport ; pas de confusion prévu/réalisé |
| DSF / contrats / captures | Documenter les états de charge et de saisie ; actualiser les captures affectées | Réutiliser les styles existants ; identifier séparément les illustrations manquantes |
| Calculs | Aucun changement de formule | Vérifier l’invariance des durées, pauses et conditions d’arrêt |
| Infrastructure | Pas de nouveau service nécessaire à la conception | Aucun besoin intrinsèque d’hébergement ou de fournisseur externe supplémentaire |

Conclusion : évolution additive de taille limitée, sans remise en cause du moteur d’exécution. Elle ne se réduit toutefois pas à une ligne Figma : les paramètres, leurs échanges et le générateur doivent rester cohérents. Un chiffrage fiable exige la lecture du code actuel. Aucun coût ou délai chiffré n’est établi ici.

Modèle logique indicatif, sans imposer de noms de champs : état de charge activée ; charge commune facultative ; charge par série facultative, liée à la série. Les valeurs stockées sont numériques et l’unité est kg. L’implémentation doit réutiliser les conventions de précision et de sérialisation du projet tout en préservant les valeurs décimales acceptées.

## 6. Scénarios d’acceptation

| ID | Situation | Résultat attendu |
| --- | --- | --- |
| AC-01 | Création ou ouverture d’un exercice ancien sans charge | Sans ; pas de mention de charge dans la synthèse ou l’exécution |
| AC-02 | Séries identiques, charge 10 kg | Valeur commune, affichage 10 kg à la place de Avec |
| AC-03 | Saisie de 1,25 kg | Valeur conservée après enregistrement/réouverture, sans arrondi entier |
| AC-04 | Avec 10 kg → Sans → Avec | 10 kg restauré ; pas de mention active pendant Sans |
| AC-05 | Séries variables à 20/25/30 kg | Chaque série affiche et transmet sa propre charge |
| AC-06 | Déplacement de la deuxième série | Sa charge suit la série, ainsi que ses autres paramètres |
| AC-07 | Passage identiques/variables, ajout/retrait ou champ vide | Même comportement que les règles existantes des autres champs, explicitement référencées à l’intégration |
| AC-08 | Synthèse de séries à charges différentes | Chaque charge reste associée à sa série ; sortie en segments ; aucune phrase persistée |
| AC-09 | Exécution d’une série à charge active | Information affichée ; aucune confirmation supplémentaire |
| AC-10 | Comparaison du même exercice avec et sans charge | Durées, cadence, pauses, cibles et transitions inchangées |
| AC-11 | Clavier ouvert sur tableau | Cellule en saisie et tableau de référence accessibles au-dessus du clavier ; séparateur décimal disponible |
| AC-12 | Duplication ou copie d’un exercice | Charge et activation suivent le mécanisme de copie des paramètres, sans perte des valeurs désactivées |

## 7. Intégration documentaire

Rechercher les sections effectives dans la dernière version du dépôt ; ne pas attribuer de numéro de chapitre non vérifié.

| Zone de documentation | Contenu à intégrer |
| --- | --- |
| Concepts et paramètres d’exercice | Définition informative, unité, activation, absence d’interprétation |
| Création et modification | Saisie, conservation, séries identiques/variables, réutilisation des règles existantes |
| Modèle de données et compatibilité | État distinct des valeurs, charge par série, anciens exercices |
| Générateur de synthèse | Mention de charge, association par série, segments et non-persistance |
| Exécution | Information de série courante ; invariance du moteur |
| Chapitre des contrats d’écran | États Sans, valeur saisie, tableau, clavier, erreurs existantes, déploiement |
| DSF et captures | Réemploi des contrôles, styles, clavier décimal, espace visible au-dessus du clavier |
| Validation | Scénarios ciblés ci-dessus et contrôle de cohérence transverse |

La traçabilité détaillée reste dans le dossier de travail OpenSpec ou un rapport séparé. Le document principal reste un ensemble cohérent de chapitres 01 à 13, sans nouvelle annexe redondante de spécification ou de consolidation.

## 8. Contrôle de cohérence et limites

Les arbitrages de cette évolution sont clos. Les règles héritées de saisie et de conversion de séries doivent être retrouvées et référencées, pas réinventées. Le pas, zéro, l’arrondi, le moment de normalisation, l’absence de plafond, les valeurs initiales et la réactivation sont explicitement définis en CH-05. Les écarts de captures signalés sont des travaux d’alignement, pas des décisions métier ouvertes.

Les sept évolutions sont maintenant explicitement incluses dans cette mission. Le repli de la durée ne modifie pas son périmètre de calcul. La charge ne change pas les règles de pauses, de cadence ou de phases. Les calculs existants restent régis par la spécification métier ; les exemples Figma ne les remplacent pas.

## 9. Spécification complémentaire des paramètres d’exécution

### CO-01 — Changement de côté : Avec / Sans

Le contrôle ne demande plus de choisir Gauche puis Droite ou Droite puis Gauche. Il présente Avec à gauche et Sans à droite. L’utilisateur choisit lui-même son côté de départ ; Kodjo ne le qualifie pas anatomiquement. Les descriptions, synthèses, instructions et annonces utilisent côté 1 / côté 2 ou changement de côté selon leur contexte. Aucune nouvelle notation de l’enchaînement n’est créée : conserver sa présentation Figma et les deux comportements définis.

La suppression de la désignation anatomique ne supprime pas les deux côtés, ni le choix de leur enchaînement, ni la pause entre les côtés. Les deux stratégies d’enchaînement déjà définies restent conservées. Distinguer dans toute la documentation la désignation du côté de départ et l’enchaînement des séries : ce sont deux informations différentes.

Avec rend disponibles les réglages d’enchaînement et de pause entre les côtés. Le contrôle peut être replié ou déployé, signalé par son chevron intérieur. Sans masque ces lignes suivant le comportement existant. La décision Avec / Sans ne crée pas à elle seule de restriction supplémentaire selon le nombre de séries ; conserver les règles d’éligibilité déjà spécifiées. L’écran Une seule série a été illustré avec Avec désactivé : confronter cet état à la règle métier existante avant de le généraliser.

Impacts : paramètres de création et de modification, modèle de données, copies, import/export, plan d’exécution, annonces vocales, synthèses, contrats et libellés. Si une donnée historique encode D→G ou G→D, les deux correspondent désormais à Avec pour la nouvelle configuration. Ne pas réinterpréter ces valeurs comme un choix d’enchaînement et ne pas réécrire les historiques sans nécessité. La stratégie technique de compatibilité reste à adapter au schéma réel.

### CA-01 — Cadence et choix rapides

La ligne Cadence présente dans cet ordre : Autre | 5 s | 2 s | 1 s | Sans. Les choix rapides sélectionnent directement l’intervalle correspondant. Sans désactive la cadence. Autre permet de saisir une valeur personnalisée avec le mécanisme de saisie numérique de l’application ; le seul contrôle segmenté ne définit ni nouvelles bornes ni nouveau pas.

Cette évolution simplifie la sélection d’un paramètre existant ; elle ne redéfinit pas le comportement des bips ni leur influence éventuelle selon les modes. Conserver les dernières règles métier de cadence, de durée estimée et de condition d’arrêt du dépôt. Ne pas reprendre une ancienne règle depuis l’historique de conversation si elle a été remplacée.

Ne pas introduire un champ métier distinct pour chaque raccourci : la valeur de cadence et son activation suffisent conceptuellement. Le choix visuel doit refléter la valeur courante. Les modalités exactes d’affichage de la valeur personnalisée sont à reprendre du contrôle existant ou de sa référence Figma, sans inventer un nouvel état.

### DU-01 — Repli sous Durée de l’exercice

« Durée totale » dans la demande désigne ici la ligne dont le libellé visible validé est « Durée de l’exercice ». Ne pas rétablir le libellé Durée totale sur les écrans.

Le chevron est placé à côté du libellé, avec un espace de 12 px dans les maquettes actuelles. Replié : chevron vers le bas, Compte à rebours et Fin d’exercice masqués. Déployé : chevron vers le haut et deux lignes visibles. Les valeurs et leur activation sont conservées ; masquer ne signifie pas désactiver. L’ouverture de la section est indépendante de l’éventuelle édition de la valeur de durée.

L’état initial illustré est replié. Une copie dédiée de Série en durée montre l’état déployé (9307:18208). Les autres écrans disposant de cette ligne ont été repliés. Dans les exercices ouverts depuis une séance, les signaux propres à l’exercice restent absents conformément à la substitution déjà spécifiée : ce changement ne les réintroduit pas et ne crée pas de réglage booléen d’exécution de ces signaux.

La durée affichée conserve son périmètre de calcul actuel : elle n’absorbe pas les signaux du seul fait que leurs contrôles sont placés dessous. Décision validée : lorsqu’aucune ligne Durée de l’exercice n’est affichée, Compte à rebours et Fin d’exercice restent directement visibles, lorsqu’ils sont applicables. Ne pas créer de faux total ni de contrôle de repli alternatif.

### CV-01 — Chevrons intégrés aux options

Le chevron de séries variables est à l’intérieur de l’option Variables du contrôle Type de série. Celui des phases est à l’intérieur de l’option Avec du contrôle Phases de l’exercice. Ils sont centrés verticalement avec le texte, sans changer l’alignement du contrôle.

Le chevron indique le déploiement du tableau : haut si ouvert, bas si fermé. Replier le tableau conserve ses valeurs et son mode actif. Les conditions métier d’activation des phases, leur incompatibilité éventuelle avec les séries variables et les règles de saisie restent celles de la spécification existante. Le chevron ne crée pas une nouvelle étape de configuration.

Le même principe d’intégration visuelle est déjà illustré dans Avec du changement de côté. Les options non modifiables conservent leur valeur réelle et utilisent l’état visuel correspondant.

### AR-01 — Condition d’arrêt : entrée ou résultat

Le libellé est « Condition d’arrêt », qui remplace Cible puis Arrêt. Les deux libellés métier sont « À l’échec » et « À la cible » ; la typographie du prototype peut encore afficher A sans accent. « Définie » est obsolète dans ce contrôle.

Initialement, et lorsque les séries sont identiques, deux options sont sélectionnables : À l’échec à gauche, À la cible à droite. Le choix s’applique aux séries identiques, selon le mode de l’exercice.

En séries variables, cette ligne devient un résultat automatiquement actualisé d’après les séries, non modifiable à cet endroit :

| Détail des séries | Présentation du résultat |
| --- | --- |
| Toutes à cible définie | Deux options visibles, À la cible sélectionnée automatiquement |
| Toutes à l’échec | Deux options visibles, À l’échec sélectionnée automatiquement |
| Au moins une série à cible et une à l’échec | Les deux options sont remplacées par une seule : « À la cible et à l’échec » |

Il y a trois résultats possibles, pas trois boutons simultanément ni un troisième choix manuel Mixte. Si le détail redevient homogène, les deux options réapparaissent avec la sélection correspondante. Le résultat est dérivé, pas un paramètre indépendant pouvant diverger des séries. Ne pas introduire de nouvelle valeur métier persistée Mixte si les données existantes permettent de calculer le résultat.

Le style automatique suit celui validé dans Figma : sélection violette atténuée, texte blanc, groupe non sélectionnable. Ce rendu indique une valeur déterminée par le détail ; il ne signifie pas que la condition d’arrêt est sans effet. Conserver le libellé explicite et la sémantique accessible d’une information non modifiable.

Pour un tableau en cours de saisie incomplet, réutiliser la convention des autres résultats calculés incomplets ; ne pas considérer une cellule vide comme une série à l’échec ou à cible. Ne pas inventer de validation supplémentaire.

Écart identifié : l’écran Séries variables, cas mixte (8470:13303) a reçu temporairement le texte « A la cible et l’arrêt ». La présente clarification utilisateur le remplace par « À la cible et à l’échec ». La documentation doit porter ce dernier libellé ; relever l’écart Figma s’il persiste lors de la prochaine lecture.

### GR-01 — Regroupement visuel des paramètres

La modale utilise quatre cadres successifs, de fond gris légèrement teinté, arrondis, séparés par un espace réduit. Les paramètres conservent leurs labels à gauche et leurs contrôles à droite ; le contenu conditionnel reste dans son groupe.

| Groupe | Contenu et ordre de référence |
| --- | --- |
| 1 — Exécution | Mode, Condition d’arrêt |
| 2 — Séries | Phases de l’exercice et tableau éventuel, Nombre de séries, Type de série, Durée ou Répétitions et Pause ou tableau de séries variables, Charge |
| 3 — Côtés | Changement de côté, puis Enchainement et Pause entre les côtés lorsque déployés |
| 4 — Cadence et durée | Cadence, Durée de l’exercice, puis Compte à rebours et Fin d’exercice lorsque déployés et applicables |

Le nombre de séries précède Type de série. Les tables ont un fond blanc sans contour extérieur, avec séparateurs internes et marges respectées. Les boutons +/− dédiés à ces tableaux ont été retirés du prototype ; ne pas les réintroduire par recopie d’un ancien contrat. Les options inactives ont un texte gris regular et un fond cohérent avec celui des champs variables ; les options sélectionnées utilisent le traitement violet existant. Il n’y a pas d’enveloppe blanche supplémentaire autour des contrôles segmentés.

Les maquettes de référence ont une largeur de 402 px et une hauteur de 874 px. Les groupes sont espacés de 8 px dans les modifications de la session. Ces dimensions servent de référence de layout, pas de contrainte d’écran physique. Réutiliser les tokens DSF existants ; vérifier les valeurs actuelles dans Figma avant de publier le DSF.

La modale s’adapte au contenu visible. L’ouverture du clavier conserve le tableau accessible au-dessus du clavier, comme dans 9292:18077. Le repli d’une section ne laisse pas son ancienne hauteur vide. Les exceptions liées aux formats de séance ne doivent pas être remplacées par des champs génériques supplémentaires.

### RO-01 — Roulette de durée selon le type de série

Pour les séries identiques, la roulette « Durée d’une série » propose uniquement une durée numérique. L’option « À l’échec » n’y est plus nécessaire : cette condition est choisie dans le contrôle global Condition d’arrêt. Ne pas conserver deux endroits concurrents pour définir cette condition. L’accès au champ de durée suit l’applicabilité déjà définie pour la condition d’arrêt sélectionnée.

Pour les séries variables en mode Durée, la roulette ouverte depuis une cellule du tableau propose une durée numérique ou « À l’échec ». Ce choix s’applique uniquement à la série éditée. La sélection de « À l’échec » n’est pas une durée égale à zéro : elle représente une condition d’arrêt différente, sans cible temporelle définie. Le tableau affiche alors « à l’échec » suivant son format validé.

Chaque modification d’une cellule met à jour immédiatement le résultat global Condition d’arrêt selon AR-01 : À la cible, À l’échec ou À la cible et à l’échec. Cette ligne reste non sélectionnable en séries variables. Les pauses et les autres paramètres de la série ne sont pas modifiés par ce choix.

Le retour d’À l’échec vers une durée reprend les conventions existantes de conservation et de saisie des valeurs. Cette clarification ne crée ni borne ni durée par défaut supplémentaire. Elle ne modifie pas la roulette propre à une phase d’exercice : ne pas retirer son option À l’échec par généralisation de la règle des séries identiques.

Références de la session : 8328:37862 (« Durée d’une série (roulette) ») illustre la durée seule. 9232:44646, nommé « Durée d’une phase (roulette) », comporte une option À l’échec et un arrière-plan de séries variables. Ce nom ne suffit pas à déterminer son contrat : vérifier le contrôle d’origine et expliciter la référence de saisie d’une série variable, sans réaffecter silencieusement un contrat de phase. Signaler un scénario manquant si nécessaire.

Impacts : contrats des roulettes et des cellules, DSF (durée seule / durée ou échec), distinction valeur numérique et condition d’arrêt dans les données, agrégation automatique de la condition d’arrêt, captures et règles de validation. Les calculs existants des séries à l’échec restent inchangés.

### 9.1 Matrice d’impact consolidée

| Évolution | Données et comportement | Documentation / DSF / contrats |
| --- | --- | --- |
| Charge CH-01 à CH-09 | Nouveau paramètre informatif et valeurs par série ; synthèse et contexte d’exécution | Paramètres, modèle, compatibilité, générateur, exécution, saisie et captures |
| Côtés CO-01 | Suppression du choix anatomique ; maintien du bilatéral et de l’enchaînement | Glossaire, règles, annonces, synthèses, modèle, migration, contrôles et exemples D/G |
| Cadence CA-01 | Accès rapides à une valeur existante ; pas de nouvelle règle de calcul | Contrats de saisie, DSF, références de cadence et captures |
| Durée DU-01 | État de déploiement visuel ; valeurs de signaux conservées | Contrats, DSF, visibilité conditionnelle, distinction valeur éditable / section dépliable |
| Chevrons CV-01 | Présentation des tableaux sans effacement ni changement de mode | États replié/déployé/non modifiable et dimensions des options |
| Arrêt AR-01 | Choix commun en identiques ; agrégation dérivée en variables | Mode d’exécution, règles de dérivation, cellules du tableau, synthèse et contrats |
| Roulettes RO-01 | Durée seule en séries identiques ; durée ou échec par série variable | Contrats de saisie, DSF, agrégation de l’arrêt et références de captures |
| Groupes GR-01 | Réorganisation de présentation | Anatomie de modale, ordre des champs, responsive, tableaux, DSF et captures |

L’effort est principalement concentré sur l’éditeur et ses états. Les deux impacts de données significatifs sont l’ajout de charge et la suppression de la désignation anatomique des côtés. La sélection automatique d’arrêt doit s’appuyer sur les conditions déjà portées par les séries. Aucun nouveau service ou hébergement n’est requis par ces concepts. Les effets exacts sur le code restent à vérifier.

### 9.2 Scénarios d’acceptation complémentaires

| ID | Vérification attendue |
| --- | --- |
| AC-13 | Avec/Sans ne propose plus Gauche/Droite ; l’enchaînement et la pause de côté restent disponibles selon les règles existantes |
| AC-14 | Une configuration ancienne D→G ou G→D ne perd ni sa bilatéralité ni sa stratégie d’enchaînement lors de la compatibilité |
| AC-15 | Les raccourcis 5/2/1 s mettent à jour la cadence ; Autre permet la saisie ; Sans désactive ; les règles de calcul restent identiques |
| AC-16 | Replier/déployer les signaux conserve les valeurs et ne modifie pas la durée affichée |
| AC-17 | Un exercice ouvert depuis une séance ne récupère pas ses signaux propres via ce chevron |
| AC-18 | Variables et Avec des phases portent leur chevron intérieur ; le repli conserve les données et le mode |
| AC-19 | Séries identiques : les deux conditions d’arrêt sont sélectionnables |
| AC-20 | Séries variables homogènes : résultat correct, deux options visibles non sélectionnables |
| AC-21 | Séries variables mixtes : un seul résultat « À la cible et à l’échec » ; retour aux deux options dès que le détail redevient homogène |
| AC-22 | Les cadres suivent l’ordre défini ; champs conditionnels et tables ne se chevauchent pas ; les sections repliées ne laissent pas d’espace vide |
| AC-23 | Les synthèses, annonces, glossaire et contrats ne continuent pas à imposer un côté anatomique de départ |

| AC-24 | La roulette de durée commune aux séries identiques ne présente pas À l’échec ; la condition se règle globalement |
| AC-25 | En séries variables, sélectionner À l’échec dans une cellule affecte seulement cette série et actualise le résultat global |
| AC-26 | Revenir à une durée numérique actualise le tableau et le résultat global sans modifier les pauses ; zéro n’est pas utilisé comme code d’échec |

### 9.3 Contradictions et raccordements à vérifier à l’intégration

- Les formules d’enchaînement visibles dans Figma restent des illustrations des deux stratégies ; ne pas inventer de notation C1S1/C2S1. L’utilisateur a explicitement rejeté cette proposition. Le choix anatomique de départ est supprimé, pas les enchaînements.
- Le libellé mixte exact est désormais « À la cible et à l’échec », et non « A la cible et l’arrêt » ni un bouton Mixte.
- Les écrans sans ligne de durée gardent un accès direct aux signaux, lorsque ceux-ci sont applicables ; ne pas généraliser le masquage sans moyen d’accès.
- Les règles de durée, pauses et cadence ne sont pas remplacées par les échantillons de chiffres Figma.
- Le comportement existant de saisie des autres nombres ne devient pas automatiquement une saisie au clavier du fait de l’ajout de charge. La généralisation des claviers ou roulettes à d’autres champs n’est pas incluse sans décision explicite.
- Le document ne modifie pas les bornes numériques discutées antérieurement pour les autres paramètres : vérifier les décisions déjà intégrées au dépôt plutôt que propager des propositions non closes.

## 10. Prompt prêt à transmettre à OpenSpec

```text
Tu interviens sur KODJO, dépôt MyUncried/Application-Routine.

Mission : intégrer les sept évolutions des paramètres d’exécution décrites dans
la version 3.0 du document joint KODJO_Charge_Specification_2026-10-18.md :
charge ; changement de côté Avec/Sans sans désignation anatomique ; cadence
Autre/5 s/2 s/1 s/Sans ; repli des signaux sous Durée de l’exercice ; chevrons
intérieurs Variables et Avec des phases ; condition d’arrêt entrée/résultat ;
regroupement des paramètres en quatre cadres ; clarification RO-01 des roulettes
de durée en séries identiques et variables.

Il s’agit d’une mission documentaire, pas d’un développement produit.

1. Lis AGENTS.md et les conventions OpenSpec du dépôt. Vérifie l’état git, la
branche, les derniers commits et les travaux BMAD/OpenSpec en cours. Utilise
la documentation la plus récente. Préserve les modifications locales et évite
les écritures concurrentes sur les mêmes fichiers. Aucune réinitialisation.

2. Utilise le workflow OpenSpec réellement installé : découvre les commandes et
schémas locaux sans supposer de syntaxe. Crée ou complète le changement dédié
en élargissant son périmètre aux sept évolutions. Ne crée pas sept procédures
indépendantes ni de contrôles supplémentaires sans nécessité.

3. Lis intégralement la spécification jointe. Retrouve les règles existantes de
saisie, validation, conservation, séries identiques/variables, phases, cadence,
calcul de durée, bilatéralité, enchaînement, annonces et génération des phrases.
Ne réouvre pas les arbitrages clos. Applique les arbitrages clos, dont CH-05 : pas 0,25 kg, arrondi supérieur en fin
de saisie sans message, zéro = Sans, aucun plafond métier, initialisation et
réactivation à 0,25 kg dans les cas définis. Réutilise les autres règles existantes
sans inventer de nouvelle propagation ni de nouvelle règle d’annulation.

4. Dresse l’inventaire des sections, contrats, données, textes et captures
affectés. Réintègre le contenu dans la documentation principale existante,
chapitres 01 à 13 uniquement, ainsi que dans le DSF et tous les contrats concernés.
Ne crée pas d’annexe permanente de spécification/consolidation redondante.
Garde la matrice de traçabilité dans OpenSpec ou le rapport de livraison séparé.

5. Points impératifs :
- Charge informative, pas 0,25 kg, zéro = Sans, arrondi supérieur à la sortie
  du champ ou validation sans message ; aucun plafond métier. Avec réinitialise
  à 0,25 kg si toutes les valeurs sont nulles, sinon restaure les valeurs.
  En séries variables, la ligne Avec/Sans sous le tableau commande la visibilité
  de la colonne ; son titre reste non interactif. Pas de calcul
  de tonnage ni de suivi réel ajouté implicitement.
- Plus de sélection gauche/droite ; conserver changement de côté, enchaînement
  et pause. Réviser les mentions anatomiques dans modèles, synthèses et annonces.
- Cadence : choix rapides et personnalisé, sans redéfinir les règles métier.
- Libellé Durée de l’exercice ; son chevron révèle les signaux sans changer
  le calcul ni leur activation. Respecter leur absence dans une séance.
- Chevrons à l’intérieur de Variables et Avec des phases, repli sans perte.
- Condition d’arrêt : deux entrées pour séries identiques ; trois résultats
  possibles pour séries variables. Jamais trois boutons : pour le résultat mixte,
  une seule valeur non modifiable « À la cible et à l’échec ».
- Quatre groupes : mode/arrêt ; phases/séries/charge ; côtés ; cadence/durée/signaux.
- Roulette de durée : aucune option À l’échec pour la durée commune des séries
  identiques ; conserver cette option pour chaque série variable en mode Durée.
  Ne pas assimiler échec et zéro ni appliquer cette suppression aux phases.

6. Relis les frames actuelles de Prototype MVP (fichier et IDs dans le document).
Figma définit les layouts, pas les règles de calcul ou de comportement.
Exporte uniquement les captures nouvelles ou obsolètes et vérifie le rendu
documentaire. Ne modifie pas Figma dans cette mission. Signale les écarts restants :
clavier sans séparateur décimal, ancien libellé mixte, affichage de charge en exécution
non illustré. Ne transforme pas ces écarts en règles métier et n’invente pas de capture.

7. Vérifie la cohérence transverse : données conservées, charge liée à sa série,
compatibilité des anciens exercices, synthèse en segments non persistée,
côté 1/côté 2, conservation des enchaînements, sélection automatique d’arrêt,
accès aux signaux même lorsque la durée n’existe pas, invariance des calculs,
états DSF et contrats complets. Vérifie que les anciennes formulations ne
subsistent pas comme règles concurrentes dans le document principal.

8. Traite aussi PR-01 à PR-05 et l’inventaire de scénarios en section 11.2.
Ne propage pas les variantes remplacées ni les propositions non arbitrées
identifiées en section 11.3.
Exécute les contrôles documentaires et validations OpenSpec du dépôt.
Produis une matrice CH-01 à CH-09, CO-01, CA-01, DU-01, CV-01, AR-01, GR-01, RO-01 et
AC-01 à AC-26 vers les fichiers/sections réellement modifiés, avec les statuts
traité/partiel/restant. Rapporte les changements, captures, vérifications et
limites. Ne prétends pas avoir testé le produit pour une mission documentaire.

Ne lance pas de développement, de fusion main, de publication ou de pull forcé.
Prépare la revue selon le workflow du dépôt. Pas de nouveau design ni de
réouverture des décisions validées.
```


## 11. Relecture exhaustive des modifications de la conversation

Cette vérification couvre les décisions et opérations rapportées dans cette conversation. Elle ne constitue pas un nouvel audit de toutes les frames Figma actuelles ni de la documentation du dépôt. Les écrans ont parfois été supprimés ou renommés par l’utilisateur : les noms et comptes historiques ne doivent pas être utilisés comme preuve de leur présence actuelle.

### 11.1 Compléments de présentation à intégrer aux contrats et au DSF

**PR-01 — Libellés et contrôles.** Employer Mode (Répétitions / Durée), Condition d’arrêt (À l’échec / À la cible), Phases de l’exercice (Avec / Sans), Nombre de séries, Type de série (Variables / Identiques), Changement de côté (Avec / Sans), Enchainement, Cadence, Durée de l’exercice. Phases se rapporte à l’exercice, pas à une série. Ne pas réintroduire Activité, Tour, Cible, Définie ou Ordre comme anciens libellés de ces contrôles. Cette consigne n’interdit pas les mots cible ou tour lorsqu’ils ont leur sens métier ailleurs.

**PR-02 — Tableaux.** Retirer les lignes de boutons +/− et les séparateurs résiduels associés. Pas de séparateur supplémentaire après le tableau des phases. Le tableau reste dans son cadre de section ; son fond blanc ne déborde pas et ne chevauche pas les lignes voisines. Les lignes des tableaux de référence sont de 36 px. L’espace de la dernière ligne jusqu’au bord inférieur du fond blanc correspond à une hauteur de ligne. Les marges supérieures permettent de distinguer les contrôles du tableau ; l’espace inférieur avant la ligne suivante ou le bord du groupe est réduit, sans chevauchement. Les valeurs Durée/Répétitions, Pause et Charge sont alignées avec leurs en-têtes. Les numéros de série sont rapprochés des poignées de déplacement. Ces principes priment sur la recopie d’une ancienne capture.

**PR-03 — Traitement des contrôles.** Labels regular, plus petits que les valeurs principales ; texte des options non sélectionnées gris regular. Cadence en 12 px dans les maquettes validées. Contrôles à droite, titres à gauche ; mêmes largeurs pour des options équivalentes d’un même contrôle. Absence de contour blanc global autour des segments. Options inactives et champs variables partagent le même fond clair. Cadres de groupes gris plus soutenu pour rendre le contraste visible. Les sources actuelles DSF/Figma sont à relever avant de figer les tokens.

**PR-04 — Modales et clavier.** Ajuster la hauteur de la modale aux lignes visibles et préserver la marge basse réduite. Écran de référence 402 × 874 px ; la hauteur d’une modale ne constitue pas la hauteur de l’écran. Les roulettes conservent leur voile et leur fenêtre de saisie. Pour la charge, la fenêtre intermédiaire « Charge — Série 1 » a été supprimée : le clavier agit directement sur la cellule ; le tableau est entièrement visible au-dessus du clavier avec une marge de 12 px dans le scénario validé. Le clavier doit offrir les décimales, même si le composant iOS illustratif actuellement utilisé ne les montre pas.

**PR-05 — Enchaînement des côtés.** Les deux options utilisent une notation synthétique avec flèches réelles, dont une flèche plus marquée entre les groupes, et non des chevrons ASCII. La notation d’enchaînement reste celle de Figma, conformément au dernier arbitrage. Aucune nouvelle notation n’est requise. Ne pas supprimer l’une des deux stratégies et ne pas réintroduire un choix anatomique de départ.

### 11.2 Inventaire des corrections de scénarios de référence

Ces corrections concernent des illustrations et leurs contrats de présentation. Les valeurs chiffrées ne deviennent pas des constantes métier.

| Référence de scénario | État validé à conserver lors de la mise à jour des captures |
| --- | --- |
| Champs vides | Bouton Valider désactivé ; Durée de l’exercice présente avec « — » ; champs de valeurs de largeur adaptée |
| Mode d’exécution (sélection segmentée) | Durée d’une série et Durée de l’exercice à « — », sans champ exagérément large |
| Changement de côté Replié | Avec sélectionné, chevron intérieur vers le bas, détails de côté repliés |
| Une seule série | Même arrière-plan que Série en durée ; Sans changement de côté sélectionné ; Avec désactivé dans ce scénario |
| Durée totale (roulette) | Valeur illustrée de roulette : 5 min 30 s ; ne pas en déduire une règle ou recalculer les autres captures |
| Durée d’une série (roulette) | Roulette numérique seule, sans option À l’échec |
| Durée d’une phase (roulette), ID 9232:44646 | Arrière-plan demandé : Séries variables en durée ; option À l’échec sélectionnée. Le nom et l’origine du contrôle doivent être clarifiés à l’inventaire, sans supprimer l’option par confusion avec la durée commune d’une série |
| Séries variables en Répétition Avec Cadence | Mode Répétitions, cadence 1 s ; même tableau que l’exemple Sans Cadence (12/10/8 répétitions, pauses 30/45/60 s dans l’illustration de la session) |
| Séries variables (tableau replié), anciennement Cachée | Condition à la cible ; durée illustrative 3 min 15 s visible ; condition automatiquement déterminée |
| Phases verrouillées (séries variables) | Deux options d’arrêt ; À l’échec sélectionné automatiquement ; trois séries à l’échec ; absence de ligne Durée de l’exercice |
| Séries variables, cas mixte | Résultat automatique unique « À la cible et à l’échec » ; ancien texte « A la cible et l’arrêt » à corriger s’il subsiste |
| Tableau de 3 phases | Sans changement de côté ; Variables désactivé ; Durée de l’exercice non modifiable, texte simple sans fond de champ |
| Charge | Charge illustrative 20 kg ; Sans changement de côté ; signaux repliés selon la dernière décision |
| Séries variables avec charge | Colonnes Durée/Pause/Charge ; charges illustratives 20/25/30 kg ; signaux repliés selon la dernière décision |
| Séries variables avec charge — Clavier numérique | Saisie directe, pas de fenêtre de charge ni de voile supplémentaire ; tableau au-dessus du clavier ; numéros proches des poignées |
| Série en durée — Durée de l’exercice déployée, ID 9307:18208 | Seul exemple dédié conservé déployé ; compte à rebours et fin d’exercice visibles ; chevron vers le haut |

La sélection automatique d’arrêt a été demandée pour les écrans de séries variables, y compris tableau replié, déplacement, répétitions avec/sans cadence et arrière-plan de la roulette. Ne pas limiter cette règle aux seules captures citées : elle est générale suivant AR-01.

**Liens de prototype.** Les liens sortants vers d’autres écrans ont été retirés des 17 écrans alors situés sur la même ligne et à droite de « Mode d’exécution (sélection segmentée) — séries variables ». Cette opération nettoie le prototype ; elle n’abolit aucune navigation métier de l’application. Ne pas inférer les parcours applicatifs depuis l’absence de raccordement Figma.

### 11.3 Décisions remplacées et propositions à ne pas transformer en règles

- Les essais centrés, puis l’organisation de Proposition 3/4, ont abouti aux contrôles alignés à droite et aux cadres par groupe. Les variantes d’essai supprimées ne sont pas à réintégrer.
- L’option manuelle Mixte ajoutée puis retirée est remplacée par AR-01. Elle ne doit plus être documentée comme choix utilisateur.
- Le déploiement temporaire des signaux sur les deux exemples avec charge a été remplacé par leur repli et par la copie dédiée Série en durée déployée.
- La convention par haltère/barre/machine a été explicitement écartée : la charge reste informative.
- L’autorisation particulière de cellules de charge vides a été écartée : conserver les règles communes des champs.
- La proposition d’un champ « Autre résistance » n’a pas été retenue.
- La proposition d’un emplacement de charge à côté de la cible pendant l’exécution n’a pas été arrêtée : Figma déterminera son emplacement.
- La liste de nouvelles bornes numériques évoquée plus tôt (séries 1–16, durées, pauses, signaux, etc.) était une demande de comparaison au code et à la documentation, pas une validation générale de toutes ces bornes. Ne pas la déployer silencieusement dans cette spécification.
- La volonté exprimée de saisir les nombres et durées dans une interface de saisie dédiée plutôt qu’avec des steppers doit être rapprochée du périmètre déjà documenté. L’exception de saisie directe de la charge au clavier est ultérieure et explicite. Ne pas étendre automatiquement cette exception aux autres nombres.

### 11.4 Couverture et statut de l’audit de conversation

| Famille | Couverture de la présente spécification | Statut |
| --- | --- | --- |
| Charge, conservation, décimales, synthèse et exécution | CH-01 à CH-09, AC-01 à AC-12 | Intégré |
| Côtés neutres, enchaînement conservé, compatibilité | CO-01, PR-05, AC-13/14/23 | Intégré ; aucune nouvelle notation |
| Cadence rapide/personnalisée/Sans | CA-01, PR-03, AC-15 | Intégré |
| Repli de durée et des signaux | DU-01, AC-16/17, inventaire des scénarios | Intégré |
| Chevrons intérieurs et valeurs conservées | CV-01, AC-18 | Intégré |
| Arrêt saisi ou calculé, résultat mixte exact | AR-01, AC-19 à AC-21 | Intégré ; ancien libellé Figma signalé |
| Cadres, tableaux, marges, styles et ordre | GR-01, PR-01 à PR-04, AC-22 | Intégré |
| Roulettes durée seule ou durée/échec | RO-01, AC-24 à AC-26 | Intégré ; ambiguïté de nom de frame signalée |
| États particuliers de validation et valeurs illustratives | Section 11.2 | Intégré |
| Suppression de raccordements de prototype | Section 11.2 | Intégré comme opération de prototype, pas comme règle de navigation |
| Propositions remplacées ou non arbitrées | Section 11.3 | Explicitement distinguées |

Complément impératif au prompt OpenSpec de la section 10 : traiter également PR-01 à PR-05 et l’inventaire des scénarios de la section 11.2 ; inclure ces références dans la matrice de traçabilité séparée. Les seules modifications à répercuter sont les décisions finales, pas les variantes intermédiaires. Retrouver les éventuelles décisions déjà intégrées au dépôt avant toute réécriture. Rendre compte séparément des règles intégrées, des captures actualisées et des écarts Figma restant réellement présents.


## 12. Clôture des derniers arbitrages — version 3.0

| Décision | Règle définitive |
| --- | --- |
| Pas de charge | 0,25 kg |
| Valeur zéro | Sans charge ; par série en mode variable |
| Toutes les séries à zéro | Désactivation globale automatique |
| Plafond | Aucun plafond métier |
| Hors pas | Arrondi au pas supérieur, sans message |
| Moment de l’arrondi | Sortie du champ ou validation |
| Première activation | 0,25 kg, ouverture directe de la saisie |
| Réactivation après Sans | Restauration des valeurs mémorisées |
| Réactivation après toutes les valeurs à zéro | Chaque série initialisée à 0,25 kg |
| Activation de charge variable | Ligne Avec / Sans sous le tableau, validée |
| Colonne désactivée | Masquée ; valeurs conservées |
| Titre de colonne cliquable | Proposition rejetée ; titre simple |
| Enchaînement des côtés | Pas de nouvelle notation ; présentation Figma conservée |
| Absence de durée affichée | Signaux directement visibles lorsqu’applicables |

Scénarios complémentaires : 1,3 → 1,5 kg ; 0,01 → 0,25 kg ; 1,25 inchangé ; 0 inchangé. Pour [0 ; 10 ; 15], seule la première série est sans charge. Pour [0 ; 0 ; 0], l’état global devient Sans puis Avec donne [0,25 ; 0,25 ; 0,25]. Une désactivation de [0 ; 10 ; 15] via Sans suivie d’Avec restaure [0 ; 10 ; 15]. L’arrondi ne modifie pas la saisie pendant la frappe. Aucune alerte hors pas n’est affichée.

Aucun arbitrage métier n’est laissé à OpenSpec. Il reste à exécuter l’intégration dans le dépôt, référencer les règles communes existantes et aligner les illustrations identifiées. Cette version remplace les propositions antérieures contradictoires.

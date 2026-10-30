# PRODUCT — KODJO

> **Composition actualisée — 28/10/2026 :** [référence consolidée](KODJO-Composition-conteneurs-2026-10-28.md), [analyse critique et réserves](REVUE-COMPOSITION-2026-10-28.md). D-451 : cycles visibles avec exercices directs et multi-circuit dans le MVP ; création par enveloppe, séries groupées/alternées, zéro intentionnel, en-têtes et défilement. Les maquettes de composition ont été vérifiées ; réalisation non qualifiée.

> **Évolution fonctionnelle validée — D-449 (26/10/2026)** : [Séance comme objet unique, six décisions closes](KODJO-Seance-Objet-Unique-Decisions-2026-10-26.md). Cette cible remplace la dualité Exercice autonome/Séance, le cycle technique unique et les catalogues séparés par nature. Elle conserve Mouvement et Exercice comme composant de séance ; plusieurs cycles successifs sans imbrication ; lancement de toute la séance ; catalogue unique à vues filtrées. Le code PRE-7 et les visuels existants restent l’état livré antérieur sur ces points.

**Référence courante — évolutions v15 :** [inventaire, plan et preuves](MATRICE-EVOLUTIONS-V15-2026-10-07.md), [consolidation fonctionnelle](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#calculs-durees), [DSF phrases](DSF-PHRASES-V15-2026-10-07.md). Corpus276 actualisé ; calculs conservés ; captures et contrats repris.

**Lot cartes du07/10, avant v15 :** [matrice cartes/phrases](MATRICE-CARTES-PHRASES-2026-10-07.md) ; [DSF cartes sans cadre de durée](DSF-CARTES-DUREE-2026-10-07.md). Pause après chaque série, récupération substitutive,276 textes v15, segments non persistés.

## 1. Finalité

KODJO est l’application mobile éditée par ANKUSHA permettant à un utilisateur de créer, exécuter, planifier et suivre des séances personnelles, notamment des exercices physiques, de mobilité ou de rééducation. Sa signature est `Keep On. Do Just One.`

L’application remplace l’usage dispersé de notes, vidéos, alarmes et minuteurs par un parcours unique, simple et guidé.

## 2. Utilisateur prioritaire

Le MVP est conçu pour un utilisateur individuel qui :
- crée ses propres séances ;
- crée et réutilise des Exercices persistants à partir de T03 ;
- les exécute immédiatement ou planifie directement ses Séances et Exercices persistants ;
- consulte l’historique détaillé de ses exécutions ;
- utilise l’application sans compte et sans synchronisation cloud.

Le fitness constitue le premier cas d’usage ; le produit reste généraliste et couvre aussi la rééducation (D-436).

## 3. Concepts fonctionnels structurants

### Séance

Une Séance est un contenu exécutable défini par l’utilisateur.

Elle possède notamment :
- un nom ;
- une Étiquette de Séance lorsqu’elle est renseignée ; la couleur affichée de la Séance est la couleur de cette Étiquette ;
- une Composition ordonnée d’exercices, de circuits et de cycles facultatifs ;
- des paramètres de guidage et d’exécution.

### Routine

Une Routine représente un créneau portant une **liste ordonnée de contenus**, Séances (`SESSION`), Exercices persistants (`ACTIVITY`) ou mélange des deux. Le créneau produit les occurrences ; chaque contenu les filtre par sa fréquence sans unité **x fois sur n** et ses positions retenues. Le cas x=n s’affiche « à chaque fois ».

Programme facultatif (« Aucun » par défaut) précède Début le. Répétition désactivée produit un créneau unique ; activée, elle expose Jour/Semaine/Mois et une borne **jusqu’au** (date) ou **pendant** (nombre d’unités). Aucun/Aucune ne sont plus des options de Rappel/Répétition : des interrupteurs portent leur absence. Rappel reste facultatif,0..1 par Routine.

La sélection utilise des cases à cocher et « Ajouter 1 élément » / « Ajouter n éléments », avec les espaces et accords usuels. Le formulaire porte Planifier sans contenu, Planifier une séance/un exercice à contenu unique, Planifier un parcours à plusieurs contenus. **Parcours est uniquement un libellé**, sans entité, catalogue ni exécution autonome. Circuit reste le groupe interne à une Séance, répété en Tours.

La spécification du 08/10 définit le comportement cible et ses points ouverts ; elle ne certifie pas une implémentation. Une Routine peut toujours partager ses sources avec d’autres Routines. Les données historiques ne sont pas réécrites.

Voir [la spécification](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification).

### Exercice

Un Exercice est une définition d’Exercice. Dans le MVP, elle existe comme copie intégrée à une Séance et, à partir de T03, comme référence persistante autonome dans le Catalogue des exercices ; son ajout à une Séance crée une copie indépendante.

Un Exercice utilise l’un des deux modes `Durée` ou `Répétitions` ; chaque Série porte une cible chiffrée ou À l’échec. Elle porte un `Changement de côté` `Avec` ou `Sans`, `Sans` par défaut ; les valeurs historiques `RIGHT_LEFT` et `LEFT_RIGHT` valent `Avec` (D-406, RM-242, RM-244). Elle définit une Pause après chaque série et peut définir une **Pause entre les côtés** (`sideRecoverySeconds`) uniquement lorsqu’elle est bilatérale. Elle peut porter une charge facultative en kg, informative, désactivée par défaut, commune aux séries identiques ou propre à chaque série variable (D-403, RM-235 à RM-241). Une `ActivityDefinition` ne porte jamais de récupération après exercice. `Récupération` n’est plus un type d’Exercice.

Un Exercice peut être placée avant le Circuit, dans le Circuit ou après le Circuit et peut être réordonnée entre ces zones.

### Série

Une Série désigne la répétition d’un même Exercice.

Le Nombre de Séries est un paramètre de l’Exercice et ne constitue pas un conteneur structurel de la Séance.

Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : [Calcul, pauses et périmètres](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#calcul-pauses-et-périmètres) et [Calculs des durées et ordre des phases](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#calculs-des-durées-et-ordre-des-phases).

Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durées selon [Résultats temporels et agrégation du circuit](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#résultats-temporels-et-agrégation-du-circuit) et [Calculs des durées et ordre des phases](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#calculs-des-durées-et-ordre-des-phases) : Durée exacte si toutes les cibles sont chiffrées ; Répétitions avec bip estimées ≈ si toutes les cibles sont chiffrées ; mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈ ; Répétitions sans bip, ou toutes les cibles À l’échec : omitted au niveau Exercice. Séance/Circuit : ≥ si travail inconnu (RM-132). Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel.

### Circuit, Tours et Cycle

Plusieurs circuits et cycles successifs sont dans le MVP (D-451). Un circuit contient des exercices et porte 1..99 tours, défaut 1, en séries groupées ou alternées. Un cycle visible contient circuits et exercices directs, avec 1..99 répétitions, défaut 1. Aucun cycle technique implicite ni conteneur de même type imbriqué. Les exercices directs du cycle sont rejoués à chaque répétition, ceux de la séance une seule fois. La bilatéralité reste propre aux exercices.

Voir [Composition : circuits, cycles et création](KODJO-Composition-conteneurs-2026-10-28.md).

### Exécution

Une Exécution est la réalisation effective d’un contenu exécutable d’origine `SESSION` ou `ACTIVITY`.

Chaque Exécution repose au démarrage sur un instantané JSON immuable de sa source : Séance ou Exercice persistant. Cet instantané garantit que l’historique reste lisible même si la source est ensuite modifiée ou supprimée.

Pour un plan bilatéral, cet instantané conserve le changement de côté effectif et chaque Résultat d’Exercice conserve son côté. L’interface affiche uniquement `Côté 1` ou `Côté 2` (RM-243) sous le nom de l’Exercice pendant le passage concerné, sans compteur `1/2` ou `2/2`.

## 4. Périmètre du MVP

### Catalogue des séances

**Résultats de recherche Mouvements — PRE-9.** Les résultats de création de Mouvement utilisent la carte Résultat avec « Ajouter un niveau » à droite (description 179 pt) ; les cartes réutilisées depuis la Composition/création d'un Exercice ne portent aucun bouton (description 253 pt sur deux lignes ellipsées). Les familles conservent le filet bleu centre-à-centre ; le choix « Plus facile | Plus difficile » utilise une seule carte dépliée, sans « Utiliser ce mouvement ». Référence : [spécification de développement](KODJO-Resultats-recherche-mouvements-PRE9-2026-10-30.md) et CE-MVT-RESULT-01.

**Zones de contexte — PRE-9.** Les Catalogues Mouvements et Séances partagent la bande lilas Recherche et création, leurs champs Recherche, Filtre/Tri/Créer et les compteurs en première ligne selon [la spécification de développement](KODJO-Zones-contexte-catalogues-PRE9-2026-10-30.md). Mouvements : « N familles · N mouvements » avec compteurs de filtrage exclusifs et désélectionnables ; Séances : « Un exercice N | Plusieurs N » avec nombres informatifs, bascule inchangée ; sur les états filtrés/archivés, « N résultats » égale la taille réelle de liste après filtres et recherche. Aucun titre de page individuel ; navigation des Catalogues conservée.

Le MVP permet de :
- créer une Séance avec un nom obligatoire, au moins un Exercice valide et une Étiquette facultative dont la couleur devient la couleur affichée de la Séance ;
- composer et modifier une Séance ;
- associer l’Étiquette de la Séance ;
- afficher dans chaque carte du Catalogue l’Étiquette de Séance et la Catégorie d’Exercice selon les contrats d’écran actifs ;
- dupliquer et archiver une Séance active ;
- restaurer ou supprimer une Séance archivée, la suppression exigeant donc un archivage préalable ;
- empêcher l’exécution d’une Séance invalide ou vide ;
- ne pas afficher la prochaine planification sur la carte : elle est absente des Catalogues (D-238 ; données et calculs de D-206 conservés).

### Catalogue des exercices — T03

À partir de T03, le MVP permet de :
- ouvrir le segment `Exercices` du Catalogue ;
- créer, consulter et modifier une `ActivityDefinition` persistante ;
- archiver un Exercice, accéder aux définitions archivées via `Filtrer > Archivées`, la restaurer et la supprimer définitivement depuis les archives ;
- préserver les copies `SessionActivity` et les Instantanés/Exécutions historiques lorsqu’une définition est supprimée ;
- ajouter une ou plusieurs Exercices existants à une Composition par copie indépendante ;
- exécuter directement un Exercice valide depuis son bouton Lecture ;
- planifier directement un Exercice persistant depuis son action `Planifier`, avec le même mécanisme de Routine que pour une Séance ;
- ne pas afficher la prochaine planification sur la carte, absente des Catalogues (D-238 ; données et calculs de D-206 conservés) ;
- préserver filtres, tri implicite et position de défilement pendant l’aller-retour courant, sans les persister après relance complète ;
- afficher `Trier` comme contrôle commun visible mais désactivé en T03 ; le tri appliqué reste la dernière modification décroissante.

La rangée de commandes Catalogue est commune aux écrans représentés `Séances` et `Exercices` : `Créer`, `Filtrer` et `Trier` utilisent les boutons contextuels du DSF, cercles visibles de `34 pt`, pictogrammes de `20 pt`, écart visuel de `12 pt`, cibles tactiles d’au moins `44 × 44 pt` sans chevauchement. Une pilule étendue conserve une hauteur de `34 pt`. La géométrie est une contrainte de rendu responsive, pas une instruction de coordonnées absolues React Native. `Trier` reste visible disabled T03. `Filtrer` est actif là où le comportement est défini.

`Filtrer` et `Trier` sont des contrôles communs aux deux Catalogues. Les options de filtre sont contextuelles et les panneaux ouverts sont définis dans Figma. Pour `Exercices`, le filtre couvre le statut (`Actives` / `Archivées`), les Catégories et les Zones corporelles. Pour `Séances`, il couvre le statut des Séances et les Étiquettes. `Trier` reste visible mais désactivé dans le périmètre T03.

`Créer` est contextuel au Catalogue affiché : il ouvre directement la création de l’objet correspondant, sans écran ni arbre intermédiaire. Le MVP ne comporte aucune recherche, globale ou locale dans les Catalogues ; une recherche pourra être reconçue dans une version ultérieure.

`Filtrer` est contextuel au Catalogue. À l’ouverture d’une nouvelle session applicative, aucun filtre n’est appliqué. Le bouton blanc replié s’étend sur appui et affiche `Filtres / Aucun` sans modifier la liste ; un critère n’est appliqué qu’après sélection. Un filtre appliqué est conservé pendant la session courante et lors des allers-retours, puis revient à `Aucun` après relance complète.


Un Exercice créé directement dans une Composition reste propre à cette Séance. T03 n’expose aucune action `Enregistrer dans mes exercices` ou `Enregistrer dans le catalogue`.

Dans le parcours utilisateur actuellement exposé pour composer une Séance, l’ajout passe par la sélection d’un Exercice du Catalogue. La capacité existante de créer directement un Exercice local à la Séance reste fonctionnellement et techniquement conservée, sans modification de modèle ni d’API ; elle n’est simplement pas exposée dans cet enchaînement d’écrans.

Un Exercice peut définir un Compte à rebours propre et une Fin d’exercice propre, distincts du Compte à rebours initial et de la Fin de séance. Un Point d’arrêt peut être inséré dans la Composition ; il suspend l’enchaînement jusqu’à reprise explicite et son temps d’attente n’entre pas dans la durée de la Séance.


### Composition d’une Séance

La structure affichée comprend, dans l’ordre :
1. un Compte à rebours initial structurellement présent, éventuellement instantané à `0 s` ;
2. zéro, une ou plusieurs Exercices avant le Circuit ;
3. une séquence de circuits et de cycles facultatifs, non vides, et d’exercices directs, avec les comptes définis par D-451 ;
4. zéro, une ou plusieurs Exercices après le Circuit ;
5. une Fin de séance structurellement présente, d’une durée initiale de `5 s` et pouvant être réglée à `0 s`.

Les cycles visibles enveloppent leurs membres avec leur compte propre (D-451) ; aucun cycle implicite n’enveloppe la séance.

Une Séance est exécutable lorsqu’elle contient au moins un Exercice valide.

Chaque occurrence d’Exercice dans une Séance peut porter une **Récupération après exercice** ajoutée explicitement, jamais créée automatiquement (D-304) ; `postActivityRecoverySeconds` en est la projection de calcul, 0 en son absence (D-304, D-307, RM-209). Cette donnée appartient à l’occurrence, pas à l’`ActivityDefinition`. Lorsqu’elle est positive, elle est exécutée après l’occurrence, y compris après le dernier Exercice d’un Tour et après le dernier Exercice de la Séance avant `SESSION_END`; lorsque l’occurrence appartient au Circuit, elle est exécutée à chaque passage. Elle se déplace, se duplique et se supprime avec l’occurrence sans recalcul lié à l’adjacence.

Le contrôle utilisateur `Changement de côté` d’un Exercice propose `Avec` et `Sans` (D-406, RM-242). Aucun contrôle de changement de côté n’est exposé sur le Circuit dans la version actuelle ; le support technique historique correspondant reste conservé mais fixé à `UNILATERAL` et non modifiable.

Dans la Composition, une carte affiche dans son indicateur secondaire un indicateur de changement de côté, sans direction, si son changement de côté propre est `Avec` ; elle n’affiche rien avec `Sans` (D-407, RM-243). L’indicateur respecte la géométrie Figma validée. Le texte de la carte ne développe jamais le changement de côté : l’indicateur le porte seul. Dans l’écran Créer un exercice ou Modifier un exercice (D-325), la phrase suit D-298 : Série/cible/cadence, puis Pause et côtés selon leur contexte. Elle distingue l’ordre par paire de l’ordre par côté et désigne les côtés par côté 1 et côté 2 (RM-243). Le nom reste hors de la phrase intrinsèque ; les valeurs des paramètres sont en gras dans le texte courant.

Dans la phrase de synthèse des paramètres d’exécution, le mode est affiché séparément et la phrase commence par le nombre de Séries. Tant qu’aucun mode n’est sélectionné, le champ est vide. Le total intrinsèque fourni par le calcul est affiché sauf en À l’échec ou lorsqu’il est réellement redondant en Durée unilatérale à une Série. En Répétitions, Ti=Ri×Ci avec cadence, avec ≈ ; sans bip, total d’Exercice omis selon [Résultats temporels et agrégation du circuit](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#résultats-temporels-et-agrégation-du-circuit). Lorsque la charge est active, la phrase la mentionne selon RM-240. La phrase est régénérée lors de ✓ de la feuille valide ; ✕ conserve la phrase précédente. Elle suit D-298 et [Phrase de synthèse des paramètres](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phrase-de-synthèse-des-paramètres).

Le Compte à rebours initial et la Fin de séance sont structurels et non déplaçables : aucun appui long ni aucune poignée de déplacement ne leur est associé.

Dans le MVP, les médias déjà associés à un Exercice peuvent être consultés dans le Catalogue, dans l’éditeur d’Exercice (lecture vidéo et plein écran par le lecteur natif de la plateforme, iOS sur iPhone et Android sur Android, sans lecture automatique ; décision PRE-4 Q27 du 16/10, D-385, précisée par D-393) et pendant l’Exécution. Pendant l’Exécution, la galerie ordonnée, la pagination et le plein écran suivent D-203. L’ajout/import de photos ou vidéos locales, leurs associations ordonnées et leur persistance sont inclus au MVP dans PRE-3, avant le moteur d’exécution (D-333). Les règles de stockage et de non-duplication de D-066/D-068 sont conservées.

### Formats et départs rapides

**PRE-9, décisions consolidées du 30/10/2026 :** [règles actives de Composition et Formats](KODJO-PRE9-Arbitrages-Composition-Formats-Consolides-2026-10-30.md). Six Formats configurables avec leurs valeurs initiales et contraintes : Tabata, 30/30, EMOM, AMRAP (12:00 proposé, réglable), For time et Death by ; compatibilité des Circuits déterminée Format par Format. Départs rapides sans Mouvement présélectionné : Renforcement 3×15, Progression 10/12/14, À l'échec 3 séries, Superset Circuit groupé d'un passage/deux emplacements vides, Libre ; **Gainage · Mobilité supprimé**. Seul l'Exercice porte le Format, le Circuit organise ses membres, le Cycle répète sa séquence. L'exécution spécialisée reste hors PRE-9.

Les six formats d’entraînement (Tabata, Intervalles 30/30, EMOM, AMRAP, For time, Death by) et les départs rapides appartiennent au MVP (D-378). **Dans la cible PRE-9, chaque Exercice porte son éventuel Format et ses réglages ; le Circuit organise les membres sans porter de Format propre.** Plusieurs Formats peuvent se succéder dans une Séance et dans ses Circuits/Cycles. Les Circuits repliés présentent la liste existante de leurs Exercices, enrichie du Format éventuel de chacun (Figma `10717:20056` / `10725:20142`). Leurs règles sont au chapitre 10 et le contrat de Composition au chapitre 13 ; le moteur n’est pas encore développé (D-369).

### Exécution d’une Séance

Le MVP permet de :
- lancer une Séance depuis le catalogue ou depuis une occurrence du Calendrier ;
- construire le plan d’Exécution à partir de l’instantané ;
- afficher l’Exercice en cours, l’Exercice suivant, le temps et la progression ;
- afficher les informations de Série et de Tour, en conservant le contexte du cycle visible lorsqu’il existe (D-451 ; rendu d’exécution à qualifier) ;
- afficher le côté courant sous le nom de l’Exercice lorsque l’Exercice est effectivement bilatéral (`Côté 1` / `Côté 2`, RM-243) ;
- afficher la charge de la Série courante lorsque la charge est active (RM-241) ;
- réinitialiser l’Exercice courant ;
- mettre la Séance en Pause et la reprendre ;
- passer à l’Exercice suivant ;
- arrêter volontairement la Séance uniquement depuis l’état Pause ;
- afficher une Synthèse lorsque le parcours le permet.

Pour un Exercice chronométré passée avant son terme, une confirmation est demandée et le Résultat d’Exercice est enregistré `Partielle` si le passage est confirmé.

Pour une Série en mode Répétitions ou à cible À l’échec (D-111), le bouton `Suivant` termine normalement la Série courante et ne demande pas de confirmation.

Un Exercice bilatéral exécute ses Séries selon son Ordre des côtés : toutes les Séries du premier côté puis celles du second (défaut), ou les deux côtés à chaque Série (D-247). La modale générique de passage anticipé reste inchangée : depuis le premier côté, confirmer conserve le résultat partiel de ce côté et conduit au second. Une réinitialisation ne concerne que le côté courant et préserve le résultat de l’autre côté.

Le moteur distingue deux phases de récupération. `SIDE_RECOVERY`, lorsqu’elle existe, intervient selon l’Ordre des côtés (une fois par Exercice ou une fois par Série) d’un Exercice bilatéral. `POST_ACTIVITY_RECOVERY`, lorsqu’elle existe, intervient après l’occurrence d’Exercice dans une Séance. Une phase de récupération chronométrée annonce `Récupération`, se termine automatiquement à zéro et peut être quittée avec `Exercice suivant` après confirmation ; l’Exercice reste alors terminé et la récupération est enregistrée partiellement. `Réinitialiser la récupération` recommence uniquement la phase courante. Un arrêt pendant une phase de récupération produit une Exécution `Interrompue`.

Un arrêt volontaire confirmé produit une Exécution `Interrompue` et ouvre la Synthèse. Une interruption technique ou système peut produire une Exécution `Interrompue` sans affichage de la Synthèse et donc sans Ressenti.

Aucun retour à l’Exercice précédente n’est inclus dans le MVP.

### Exécution directe d’un Exercice — T03

Le bouton Lecture d’une carte d’Exercice valide lance une Exécution d’origine `ACTIVITY` sans créer de Séance artificielle. L’Exécution repose sur un instantané autonome, commence par une préparation système fixe de `5 s`, applique les Séries, les Pauses et le changement de côté `Sans` / `Avec` (valeurs historiques `RIGHT_LEFT` et `LEFT_RIGHT` lues `Avec`, RM-244). Si l’Exercice est bilatéral, sa Pause entre les côtés éventuelle est exécutée selon l’Ordre des côtés. **Aucune Récupération après exercice n’est ajoutée en Exécution directe.** Le signal de fin ouvre ensuite la Synthèse.

Le Ressenti est obligatoire lorsque la Synthèse est présentée ; le Commentaire reste facultatif. L’Exécution rejoint le Suivi général sous le type Exercice et alimente les statistiques compatibles sans augmenter le nombre de Séances. T03 ne développe que ce sous-ensemble autonome réutilisable du moteur ; l’orchestration complète de Séance relève de T04.

### Calculs et progression

La Durée estimée est calculée à partir de toutes les durées déterminables du plan d’Exécution développé, passages bilatéraux et Récupérations d’Exercice compris.

Durées selon [Résultats temporels et agrégation du circuit](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#résultats-temporels-et-agrégation-du-circuit) et [Calculs des durées et ordre des phases](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#calculs-des-durées-et-ordre-des-phases) : Durée exacte si toutes les cibles sont chiffrées ; Répétitions avec bip estimées ≈ si toutes les cibles sont chiffrées ; mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈ ; Répétitions sans bip, ou toutes les cibles À l’échec : omitted au niveau Exercice. Séance/Circuit : ≥ si travail inconnu (RM-132). Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel.

Le temps total écoulé et la Durée réelle excluent les périodes de Pause utilisateur.

Trois indicateurs d’Exercices sont distingués :
- Nombre d’Exercices de la Composition ;
- Nombre total d’Exercices à exécuter ;
- Nombre d’Exercices exécutés.

La barre de progression couvre toutes les étapes du Plan d’Exécution : les poids des étapes non chronométrées sont réservés, puis le solde est réparti proportionnellement entre les phases chronométrées (D-241 ; règle détaillée : RM-077, RM-126).

La barre est visuellement continue, sans frontière de segment visible.

La progression globale tient compte de tous les passages développés. `Exercice X/Y` conserve néanmoins le rang logique de l’Exercice et ne change pas entre ses deux côtés.

### Guidage

Le guidage comprend :
- l’annonce vocale du nom de l’Exercice au démarrage ;
- l’annonce du côté au début du premier passage et une seule fois lors du passage au second côté ;
- les sons prévus pendant les Exercices chronométrés, dont le bip grave de rythme ;
- le signal des trois dernières secondes ;
- le guidage de cadence pendant l’Exécution (D-378) ;
- un réglage global des sons dans le MVP ;
- un réglage séparé des annonces vocales ;
- les vibrations fonctionnelles de séance selon les préférences définies ;
- un feedback haptique léger et systématique à chaque changement effectif de valeur d’une roulette numérique, indépendant du réglage `Vibrations`.

La désactivation spécifique du bip grave est reportée à une version ultérieure.

En arrière-plan ou écran verrouillé, le Plan d’Exécution continue selon ses horodatages de référence et l’état est recalculé au retour. Une pause de sécurité intervient 30 minutes après la fin théorique d’un Exercice chronométré ou la fin nominale recalculée d’une Série cadencée sans interaction, ou après 2 heures sans interaction pour un Exercice en Répétitions sans cadence ou À l’échec. Les mécanismes natifs restent soumis aux validations techniques prévues dans l’architecture.

### Planification et Calendrier

Une Routine représente un créneau portant une **liste ordonnée de contenus**, Séances (`SESSION`), Exercices persistants (`ACTIVITY`) ou mélange des deux. Le créneau produit les occurrences ; chaque contenu les filtre par sa fréquence sans unité **x fois sur n** et ses positions retenues. Le cas x=n s’affiche « à chaque fois ».

Programme facultatif (« Aucun » par défaut) précède Début le. Répétition désactivée produit un créneau unique ; activée, elle expose Jour/Semaine/Mois et une borne **jusqu’au** (date) ou **pendant** (nombre d’unités). Aucun/Aucune ne sont plus des options de Rappel/Répétition : des interrupteurs portent leur absence. Rappel reste facultatif,0..1 par Routine.

La sélection utilise des cases à cocher et « Ajouter 1 élément » / « Ajouter n éléments », avec les espaces et accords usuels. Le formulaire porte Planifier sans contenu, Planifier une séance/un exercice à contenu unique, Planifier un parcours à plusieurs contenus. **Parcours est uniquement un libellé**, sans entité, catalogue ni exécution autonome. Circuit reste le groupe interne à une Séance, répété en Tours.

La spécification du 08/10 définit le comportement cible et ses points ouverts ; elle ne certifie pas une implémentation. Une Routine peut toujours partager ses sources avec d’autres Routines. Les données historiques ne sont pas réécrites.

Depuis Catalogue ou Calendrier, les changements restent dans un brouillon jusqu’à Enregistrer. Une Routine définit une seule heure ; plusieurs créneaux peuvent répondre à plusieurs horaires. Les occurrences futures sont calculées dynamiquement ; le contenu filtre cette suite sans ajouter de dates. Les règles hebdomadaires existantes restent propres à Semaine.

Voir [la spécification](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification) pour les limites Jour/Mois, le motif par contenu, les écrans Programme manquants et les règles de suppression/archivage à compléter pour plusieurs contenus.

### Suivi et historique

Chaque Exécution conserve notamment :
- l’origine `SESSION` ou `ACTIVITY` et l’instantané immuable correspondant ;
- la date et l’heure ;
- la Durée réelle ;
- le statut ;
- les Résultats d’Exercices exécutés ;
- le côté de chaque Résultat lorsque l’Exercice est effectivement bilatérale ;
- le Ressenti obligatoire lorsque la Synthèse est présentée ;
- un Commentaire facultatif limité à 200 caractères.

Les statuts d’Exécution sont : Terminée, Partielle, Interrompue.

Un Exercice `Partielle` compte comme exécutée dans le Nombre d’Exercices exécutés. Un Exercice jamais atteinte ne compte pas.

Le Suivi du MVP comprend une liste chronologique du plus récent au plus ancien et des cartes à deux lignes, sans déploiement : nature/titre/statut puis durée réelle/catégorie/ressenti. Heure, zones corporelles et étiquettes ne sont pas affichées ; les instantanés et résultats complets restent conservés (D-262).

Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` du Suivi restent visibles mais désactivées. Cette règle du Suivi est distincte de D-184 pour les Catalogues : dans le Catalogue des exercices, `Filtrer` est fonctionnel pour `Archivées`.

### Profil et préférences

Les Préférences globales définissent notamment les valeurs par défaut du Compte à rebours initial et de la Fin de séance, les sons, les annonces vocales, les vibrations fonctionnelles de séance et l’activation des notifications.

Les valeurs initiales sont `10 s` pour le Compte à rebours initial, `5 s` pour la Fin de séance et `activée` pour Vibration. Le réglage `Vibration` ne pilote pas le feedback haptique des roulettes numériques, qui reste systématique.

Les notifications ne sont pas autorisées par défaut. La demande d’autorisation système est déclenchée dans le contexte de la première activation d’un rappel pendant une planification. En cas de refus, le rappel reste désactivé.

Elles ne modifient jamais rétroactivement une Séance existante ni une Exécution passée.

## 5. Navigation principale

Le MVP comporte cinq destinations principales :
- `Catalogues` ;
- `Calendrier` ;
- `Suivi` ;
- `Communauté` ;
- `Profil`.

`Catalogues` est le libellé permanent de navigation. Dans cet espace, les titres contextuels sont `Catalogue des séances` et `Catalogue des exercices`. Le Catalogue s’ouvre et se réinitialise après relance complète sur le segment `Séances`.

Le composant DSF canonique de navigation est `Navigation / Bottom — 5 onglets` (`6513:20151`). Les dessins des cinq destinations ont une dimension maximale de `24 pt`, sont centrés dans leur boîte optique `32 × 32 pt` et conservent une cible tactile conforme aux règles communes.

## 6. Hors périmètre du MVP

- compte utilisateur distant ;
- synchronisation cloud ou multi-appareils ;
- partage de Séances ;
- relation avec un professionnel ;
- groupes et communautés ;
- tableaux de bord analytiques avancés ;
- filtres avancés du Suivi ;
- signalement détaillé de douleur ou de gêne ;
- intelligence artificielle ;
- Séances imbriquées ;
- cycles imbriqués et circuits imbriqués (les conteneurs multiples successifs sont dans le MVP depuis D-451) ;
- modification individuelle d’une occurrence de Calendrier ;
- Parcours fonctionnels ;
- options avancées de filtre/tri Catalogue non encore arbitrées.

**Couverture de Prototype MVP (D-426).** Tous les écrans et états de la page Figma `Prototype MVP` relèvent du MVP. Les écrans de déclaration de douleur avant une séance (`8921:35275`) et d’effort perçu et douleur en synthèse (`8921:35340`) y figurent. Les échelles visibles sont de 0 à 10 pour la douleur et de 1 à 10 pour l’effort perçu ; leur logique de stockage, leur articulation avec le Ressenti existant et leurs conditions d’usage restent **À CLARIFIER** dans les contrats. Ce point ne valide pas le signalement détaillé de gêne, reporté hors MVP.

### Arbitrages PRE-5 — évaluations et résultats (D-427 à D-429)
Standard : sans évaluation avant, Ressenti triétat obligatoire après. Enrichi exclusivement pour le lancement dans un Programme avec option active : douleur initiale 0–10 obligatoire avant (sans localisation) ; douleur finale 0–10 non présélectionnée et effort perçu 1–10 obligatoires après, en remplacement du Ressenti. Si douleur finale positive, localisation d'au moins une zone corporelle KODJO, sélection multiple autorisée avec latéralité applicable ; zéro explicite. Saisie manquante bloque l'action. Un lancement indépendant conserve le standard. Configuration Programme non précisée.

Répétitions partielles (8928:15098), formats imposés, à l'interruption ou série sous cible : proposition zéro, minimum zéro, dépassement cible autorisé. Validation enregistre résultat réel et poursuit automatiquement le plan ; annulation sans effet ni progression.

Résultat de série (8937:35362) : proposition zéro, minimum zéro, dépassement cible autorisé ; validation enregistre résultat réel et poursuit automatiquement le plan ; annulation sans effet ni progression. Déclencheur exact de la modale non arbitré.

## 7. Principes métier structurants

1. Une Séance est un contenu exécutable ; dans le MVP T03, un Exercice persistant l’est également ; une Routine planifie une Séance.
2. Une Séance et ses Routines sont indépendantes.
3. Chaque Exécution conserve son origine et un instantané immuable du contenu utilisé.
4. Une modification ou une suppression ultérieure ne change jamais une Exécution passée.
5. La suppression d’une Routine ne supprime jamais l’historique.
6. La suppression d’une Séance supprime ses Routines mais conserve les Exécutions passées.
7. La suppression définitive d’une `ActivityDefinition` n’altère ni les copies de Séance ni les Instantanés/Exécutions historiques.
8. Les Étiquettes qualifient les Séances et portent leur couleur.
9. Les Étiquettes, Catégories et Zones corporelles sont des référentiels utilisateur administrables. Toutes leurs valeurs, y compris celles fournies initialement par KODJO, peuvent être supprimées. Dans une modale de sélection, en sélection simple (Catégorie, Étiquette), un appui court marque la valeur sans fermer et ✓ confirme (D-343, D-355) ; en sélection multiple, il sélectionne/désélectionne une valeur ; un appui long ouvre une confirmation de suppression. La suppression retire la valeur des choix futurs mais conserve ses affectations sur les objets existants ainsi que les Instantanés/Exécutions historiques.
10. La couleur affichée d’une Séance est celle de son Étiquette et est reprise par ses Routines.
11. Le plan d’Exécution est calculé au démarrage et n’est pas manipulé directement par l’utilisateur.
12. Le Compte à rebours initial et la Fin de séance sont structurellement présents ; `0 s` signifie phase instantanée.
13. Les occurrences du Calendrier sont calculées dynamiquement.
14. Toutes les données du MVP sont stockées localement sur l’appareil.
15. Les règles de calcul fonctionnelles sont déterministes et centralisées dans les spécifications.
16. Dans la version actuelle, le changement de côté actif est porté par l’Exercice ; aucun changement de côté n’est exposé au niveau du Circuit.
17. Les Résultats bilatéraux sont séparés par côté ; un seul côté partiellement réalisé rend l’Exercice globale partielle.

## 8. Écrans de référence

Les principaux écrans du MVP sont :
- Profil ;
- Catalogue des séances ;
- Catalogue des exercices ;
- création contextuelle directe depuis le Catalogue ;
- sélection multiple d’Exercices existants ;
- création du nom et de la couleur d’une Séance ;
- Composition d’une Séance ;
- création ou modification d’un Exercice ;
- options d’un Exercice ;
- Étiquette de la Séance ;
- Calendrier semaine et mois ;
- planification d’un contenu — Séance ou Exercice ;
- Exécution d’une Séance ;
- Exécution directe d’un Exercice ;
- modales d’interruption ;
- Synthèse ;
- Suivi.

Les maquettes Figma validées définissent la présentation de référence. La spécification UI déterministe combine les Screen Shells et composants communs décrits au chapitre 12 avec les règles fonctionnelles du chapitre 06 et les contrats d’écran du chapitre 13. Une règle métier propre à un écran ne devient pas une règle générique du Design System.

Les contrôles d’entrée `Créer / Filtrer / Trier` et les panneaux ouverts de `Filtrer` sont conçus et vérifiables dans Figma. Les options de filtre sont contextuelles au Catalogue. `Trier` reste visible mais désactivé dans le périmètre T03.

## 9. Contraintes techniques initiales

- base de code unique React Native / Expo ;
- TypeScript ;
- Expo Router ;
- compatibilité iOS et Android ;
- fonctionnement en mode portrait ;
- adaptation aux différentes tailles d’écran de smartphone ;
- respect des Safe Areas système et navigation basse intégrant l’inset inférieur ;
- largeur minimale cible de `360` points logiques, contrôles à `360`, `390`, `402` et `430–440` points, avec contenu centré au-delà de `440` points ;
- utilisation exclusive d’unités logiques et de contraintes Flexbox, sans coordonnées absolues copiées du gabarit Figma `402 × 874` ;
- design tokens canoniques pour les couleurs, typographies, espacements, rayons, dimensions partagées et tailles visuelles d’icônes ;
- cibles tactiles communes minimales de `44 × 44` points logiques (RG-7 du 30 septembre ; les dimensions spécifiques supérieures sont conservées) sur iOS et Android, indépendamment de la taille visuelle du pictogramme ou du contrôle ;
- gestion du clavier, du défilement, des textes agrandis et des modales conformément au contrat adaptatif des chapitres 06 et 12 ;
- accessibilité prise en compte dès le MVP ;
- stockage local avec SQLite et couche d’accès typée aux données ;
- données métier et historique conservés localement ;
- notifications locales planifiées selon une fenêtre glissante conformément à l’architecture ;
- support web utile au développement sans complexifier le MVP mobile.

Les choix d’implémentation détaillés et les spikes techniques sont définis dans le chapitre 12 — Architecture technique.

## 10. Évolutions prévues

Les versions futures pourront notamment introduire :
- synchronisation et comptes ;
- partage et relation avec des professionnels ;
- tableaux de bord et analyses comparatives ;
- filtres avancés et critères de tri supplémentaires dans le Suivi ;
- critères supplémentaires de filtre et options utilisateur de tri dans les Catalogues après arbitrage fonctionnel/visuel ;
- signalement détaillé de douleur ou de gêne ;
- structures de Séances plus complexes ;
- réglages sonores plus fins ;

- Ancienne cible de Parcours autonome retirée ; la planification multi-contenus relève de la spécification du 08/10 ;
- planification périodique étendue, notamment mensuelle ;
- intelligence artificielle d’aide à la création, à l’adaptation et à l’analyse des Séances.

## 11. Exercices, Catalogue et Parcours

### Catalogue multi-type

Le Catalogue conserve un seul espace mais distingue `Exercices` et `Séances`. `Séances` est le segment sélectionné par défaut ; `Exercices` devient fonctionnel en T03 ; `Parcours` est absent du sélecteur. Une fermeture/reprise complète ne mémorise pas le dernier segment et revient à `Séances`.

`Créer`, `Filtrer` et `Trier` constituent la rangée commune de commandes d’entrée. La référence courante utilise des boutons contextuels visibles de `34 pt`, des pictogrammes de `20 pt`, des gaps de `12 pt` et des cibles ≥ `44 × 44 pt` sans chevauchement. `Filtrer` et `Trier` sont communs aux deux contextes de Catalogue ; le contenu des options peut dépendre du segment actif. Pour T03 / Exercices, `Filtrer` est fonctionnel au minimum pour `Archivées`, `Trier` est visible mais désactivé, et le tri appliqué reste la dernière modification décroissante. Toute autre option est hors contrat tant qu’elle n’est pas arbitrée.

### Exercices persistants — MVP T03

Un Exercice de Catalogue est une référence persistante `ActivityDefinition`. L’utilisateur peut la créer, la consulter, la modifier, l’archiver, accéder aux archives par `Filtrer > Archivées`, la restaurer, la supprimer définitivement depuis les archives, l’exécuter directement ou la sélectionner depuis une Composition.

Son insertion dans une Séance copie toutes les propriétés métier applicables au moment de l’insertion — nom, Description facultative structurée en étapes ordonnées (D-425), mode/cible, Séries, Pause, Récupération, Zones corporelles, changement de côté propre, charge (activation et valeurs, RM-236) et autres champs persistants applicables. La `SessionActivity` appartient ensuite à la Séance et évolue indépendamment. Un Exercice créé dans une Séance ne rejoint pas automatiquement le Catalogue. La migration T03 ne transforme pas les `SessionActivity` historiques en `ActivityDefinition`.

Dans les Catalogues, `Créer` ouvre directement la création de l’objet correspondant au Catalogue courant : Exercice persistant depuis `Exercices`, Séance depuis `Séances` ; aucun Catalogue Parcours. Aucun écran ni arbre intermédiaire n’est affiché. Cette règle n’active pas les Parcours dans T03/MVP. Depuis `Ajouter un exercice` dans une Composition, le parcours actuellement exposé ouvre la sélection d’Exercices du Catalogue. La capacité existante de création directe d’un Exercice local à la Séance reste conservée fonctionnellement et techniquement mais n’est pas exposée dans cet enchaînement. La sélection multiple insère les Exercices selon leur ordre visible dans la liste filtrée au moment de la validation, indépendamment de l’ordre des touchers.

Les cartes du Catalogue des exercices portent la couleur de leur Catégorie. La surface principale ouvre la consultation/modification. Le bouton Lecture lance exclusivement l’Exécution directe. Aucun contrôle `Déployer` n’est accessible sur les cartes d’Exercice. La gouttière permanente présente la photo associée ou l’icône de nature en son absence (D-260/D-261). Un glissement gauche expose `Planifier`, `Dupliquer` et `Archiver` sur un Exercice active ; dans la liste des Exercices archivées, il expose `Supprimer`. Aucune poignée de déplacement n’est affichée.

### Exécution directe d’un Exercice — MVP T03

Une Exécution directe d’origine `ACTIVITY` crée un instantané autonome et immuable, applique une préparation fixe de `5 s`, développe Séries, Pauses et côtés selon les règles existantes, sans Récupération après exercice (D-208, RM-211) puis se termine sans `SESSION_END`. Le signal de fin ouvre immédiatement la Synthèse.

Le Ressenti est obligatoire lorsque la Synthèse est présentée ; le Commentaire est facultatif. L’Exécution rejoint le Suivi général sous le type Exercice et alimente toutes les statistiques compatibles sans augmenter le nombre de Séances. `Terminer` restaure l’état du Catalogue des exercices du parcours courant. Cet état n’est pas conservé après relance complète.

### Corrections UX communes T03

- une roulette ouverte laisse le bouton principal inférieur visuellement inchangé sous le voile grisé, mais le rend fonctionnellement et accessibilité-inactif ;
- le swipe gauche déplace réellement la carte et révèle progressivement les actions placées derrière ;
- seul un swipe droit commencé sur la carte contextuellement ouverte la referme ;
- les autres contrôles restent actifs, mais une seule carte peut exposer simultanément ses actions ;
- le Compte à rebours initial et la Fin de séance ne sont pas déplaçables et n’acceptent aucun appui long de déplacement ;
- après validation de la Composition, la cible est `Catalogue des séances`, segment `Séances` ;
- la navigation d’avancement canonique fait entrer la cible depuis la droite et sortir l’écran courant vers la gauche ;
- dans le Catalogue, la rangée `Créer / Filtrer / Trier` suit la géométrie commune validée ; les options de `Filtrer` sont contextuelles et `Trier` reste visible disabled dans T03 ;
- dans l’éditeur Exercice, `Renforcement du genou` est une donnée de démonstration et l’état vide affiche `Nom de l’exercice` ; dans la phrase de synthèse, Répétitions affiche `Durée totale {symbole éventuel}{total fourni}` (bip positif : ≈, prévision Ri×b ; bip nul : durée omise), tandis que Durée avec une seule Série unilatérale sans pause, ainsi qu’À l’échec n’affichent pas de clause Durée totale (D-298).

### Médias et Parcours

L’affichage du média associé dans la gouttière permanente de la carte du Catalogue des Exercices appartient au MVP, sans déploiement (D-260/D-261). L’import/ajout de `0..n` photos ou vidéos locales ordonnées est inclus au MVP dans PRE-3 (D-333). La capture caméra n’est pas implicitement décidée par cet amendement.

Le modèle autonome Parcours est retiré (D-328). Le mot parcours désigne plusieurs contenus liés sur un créneau, sans objet propre ; le Circuit interne à une Séance reste conservé.

## 12. Roadmap des tranches MVP

| Tranche | Périmètre de référence |
|---|---|
| T01–T02 | Création, modification et Composition des Séances. |
| T03 | Catalogue des exercices : persistance et cycle de vie, liste, accès aux archives, création contextuelle directe, sélection multiple, copie indépendante dans une Séance, Exécution directe autonome et corrections UX associées. |
| T04 | Moteur d’Exécution complet des Séances ; ancienne T03, lots 1 et 2. |
| T05 et suivantes | Ancienne T04 et tranches ultérieures, décalées d’un rang sans modification implicite de contenu. |

La tranche bilatéralité `V2-BILAT-01` reste un incrément préparatoire antérieur et clos ; elle n’est pas renommée T03.

## 13. Gouvernance documentaire

`PRODUCT.md` est une synthèse. Il ne remplace pas les spécifications détaillées.

Ce document n’établit pas d’ordre de référence propre : les règles d’autorité décidées sont réunies dans [INDEX.md, « Autorité documentaire — ce qui est décidé »](INDEX.md#autorité-documentaire--ce-qui-est-décidé) (D-402, QR-6). Une décision n’en remplace une autre que si elle le dit explicitement.

Aucune priorité automatique n’existe entre la conception fonctionnelle (chapitre 08) et les contrats d’écran (chapitre 13) : une contradiction entre eux qui n’est pas résolue par une décision explicite reste `À CLARIFIER` (D-376).

Pour T03, les références explicites de cette mise à jour sont :
- `06 – Ecrans et navigation de la V1.md`, qui intègre directement les corrections UX T03 ;
- `07 – Registre des décisions de conception.md`, qui intègre D-167 à D-187 ;
- `09 – Modèle de données fonctionnel.md` — inclut désormais le modèle et la migration T03 Catalogue ;
- `13 – Contrats d’écran.md`, unique référence des contrats d’écran T03 ;
- `MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md` ;
- `Specifications-fonctionnelles/images/README-T03-FIGMA.md` pour les évidences Figma embarquées.

Toute évolution fonctionnelle doit préciser son impact sur Figma, la documentation fonctionnelle, le modèle de données, les règles métier, les API ou services, l’architecture technique, les contrats d’écran et la version du produit.

Pour la spécification et la validation UI, la composition documentaire de référence est : `Screen Shell → composant ou contrôle du Design System → règle spécifique → contrat d’écran`. Une règle commune n’est pas recopiée inutilement ; une exception locale doit être explicitement identifiée et justifiée par Figma ou par une décision fonctionnelle validée.

## 14. Évolution conçue — Média pendant l’Exécution

Pendant l’Exécution MVP, l’utilisateur peut basculer entre les faces Information et Média d’un Exercice disposant déjà de médias. La face Média respecte l’ordre de la galerie, affiche un média à la fois, permet le swipe horizontal unitaire, la lecture vidéo et l’ouverture plein écran sans suspendre le moteur d’Exécution. En plein écran, un cadre flottant conserve les informations et commandes essentielles d’Exécution.

L’état de face et le média courant sont mémorisés uniquement pendant la séance en cours et sont réinitialisés entre deux séances. Une vidéo ne démarre jamais automatiquement. Le son vidéo est actif par défaut et son volume est temporairement abaissé pendant les annonces vocales KODJO.

Les états média `4997:6113` et `5009:6069` font partie du MVP selon la confirmation du 28/09/2026. L’ajout/import de média dans l’éditeur est inclus au MVP dans PRE-3 (D-333) ; les règles de stockage de D-068 sont conservées.

Référence de conception : [CONCEPTION-EXECUTION-MEDIA.md](./CONCEPTION-EXECUTION-MEDIA.md).

### Récupération après occurrence dans une Séance — D-208

Une récupération est ajoutée explicitement après une occurrence et reste distincte de la définition d’Exercice. Absente par défaut, elle se déplace et se duplique avec l’occurrence ; sa suppression rétablit la Pause terminale configurée. Une valeur positive est exécutée après l’occurrence, y compris en fin de Séance, et à chaque Tour si elle appartient au Circuit. Le défaut Profil est proposé à l’ajout explicite, sans effet rétroactif. postActivityRecoverySeconds est une projection de calcul, égale à 0 en son absence. À 0 s, aucune information ni phase de récupération ; le trait reste visible hors placement (D-303 à D-307).

**Valeur initiale :** lors du passage du Changement de côté de `Sans` à `Avec` (D-406), `sideRecoverySeconds` reprend le défaut global **Pause entre les côtés** du Profil (`10 s` dans le Figma de référence). Cette valeur est proposée à la création de l’Exercice et reste modifiable dans l’éditeur.

## Consolidation fonctionnelle — 26 septembre 2026

- Terminologie fonctionnelle : **Exercice** est le terme UX ; **Circuit** est le groupe ordonné d’Exercices interne à une Séance ; un **Tour** est une répétition de ce Circuit ; **parcours** est le libellé de plusieurs contenus planifiés, sans entité autonome.
- Un nouvel Exercice valide possède exactement **une Catégorie** et **une ou plusieurs Zones corporelles**. L’Étiquette de Séance reste facultative.
- Étiquettes, Catégories et Zones corporelles sont des métadonnées de classification/reporting sans effet sur l’Exécution. Une valeur supprimée sort des choix futurs mais reste conservée sur les objets qui la référencent déjà. Pour Étiquette/Catégorie, nom et dernière couleur sont préservés.
- La couleur est une propriété de l’Étiquette/Catégorie, source de vérité commune : modifier la couleur modifie l’affichage de tous les objets qui la référencent. Les Zones corporelles n’ont pas de couleur.
- Les valeurs du Profil sont des valeurs initiales proposées, sans rétroactivité : Pause entre les côtés, Compte à rebours d’exercice et Fin d’exercice pour un nouvel Exercice ; Récupération après exercice pour une nouvelle occurrence de Séance.
- Dans une Séance, les Compte à rebours d’exercice et Fin d’exercice ne sont jamais exécutés ; seuls le Compte à rebours initial et la Fin de séance s’appliquent, une fois, par substitution. Aucun booléen ni contrôle d’activation n’existe à cet effet. Les valeurs propres restent conservées pour l’exécution de l’Exercice seul.
- La phrase de synthèse suit D-298 : champ vide sans mode ; mode hors phrase ; Durée totale en mode Durée sauf redondance réelle (N1 unilatéral sans pause) ; Répétitions : ≈ avec bip positif, omission sans bip ; À l’échec = aucune Durée totale.
- Point d’arrêt : ordre `Exercice → Récupération après exercice → Point d’arrêt → suite`; interdit immédiatement après le Compte à rebours initial et immédiatement avant la Fin de séance ; autorisé aux frontières et à l’intérieur du Circuit ; lorsqu’il est dans le Circuit, il est exécuté à chaque Tour. Deux Points d’arrêt ne se suivent jamais sans Exercice entre eux, une Récupération n’étant pas un séparateur ; le Point se déplace de façon autonome par appui long, ne suit pas l’Exercice déplacé ou dupliqué, et se retire en mode Placement par désélection (D-441, RM-251). Depuis D-442 : tête de Circuit autorisée ; à N ≥ 2 Tours ou Séries, un Point de début et un Point de fin de Tour qui se suivraient donnent lieu au choix de celui à conserver, et restent autorisés même si le Circuit ouvre ou clôt la Séance (seul l’arrêt contigu au Compte à rebours ou à la Fin est omis à l’exécution) ; un déplacement ou une suppression d’Exercice qui laisserait un Point à une position non autorisée est appliqué et retire ce Point sans message (le premier de deux Points consécutifs est conservé ; pour la suppression, D-442 remplace le refus doux de D-441).
- Récupération après exercice : ajoutée, modifiée et retirée uniquement en mode Placement, où une récupération existante apparaît sélectionnée ; hors placement, elle n’est plus une cible (D-442). La Composition n’affiche aucun avertissement d’enchaînement sans pause (D-301 retirée par D-442).
- Média d’Exécution compact : le bouton Lecture central disparaît pendant la lecture vidéo ; le retour à Information met la vidéo en pause ; le plein écran n’interrompt pas l’Exécution.


**Convention de saisie D-219.** Les durées utilisent les roulettes en modale basse ; les sélections d’objets/référentiels utilisent leurs modales dédiées ; les entiers simples `Nombre de Séries` et `Nombre de Tours` utilisent des steppers inline sans roulette ; la cible `Nombre de répétitions` utilise une roulette native à une colonne, 1 à 100, avec « Aucune répétition, à l’échec » en tête dans une cellule de séries variables seulement (décision PRE-4 Q8 du 16/10, D-385 ; retirée en séries identiques par D-418). La charge fait exception : saisie directe au clavier numérique décimal (D-405, RM-239). Depuis D-434 (19/10/2026), les cellules Durée et Pause du tableau des séries variables et les durées de phase se saisissent aussi au clavier numérique, en MMSS, dans la cellule ; hors tableaux, la convention est inchangée. Les dialogues de confirmation restent centrés.


**Contexte d’Exécution (D-220).** La ligne immédiatement sous le nom de l’Exercice est toujours renseignée : nom de Séance et Catégorie de l’Exercice lors d’une Exécution de Séance, Catégorie de l’Exercice seule en Exécution directe. L’indication du côté courant, lorsqu’elle existe, reste distincte.


### Clôture Figma / DSF du 28 septembre 2026

Le Prototype MVP comporte exactement cinq destinations principales : `Catalogues`, `Calendrier`, `Suivi`, `Communauté`, `Profil`. Les écrans de recherche globale sont archivés et aucune recherche locale n’est incluse dans le MVP (D-221). En planification, les cases à cocher et le CTA « Ajouter 1 élément » / « Ajouter n éléments » remplacent la validation immédiate ; les titres dépendent du nombre et du type de contenus (D-222/D-223 révisées le 08/10). Les référentiels conservent leurs propres contrats.

Les fondations visuelles et composants communs suivent DSF V2 : fonds et zones de contexte D-224, navigation basse D-225, actions flottantes et boutons circulaires D-226, steppers/badges D-227, modales D-228, roulettes et modale Planifier D-229, listes et états spécialisés D-230. Ces prescriptions sont des contraintes de rendu/recette lorsqu’elles ne portent pas un comportement métier.


### Générateur de phrase — référence active v1 (06/10/2026)

Le générateur suit v13 §7. Le résumé omet le total uniquement lorsqu’il égale réellement la cible ; une Pause positive à N=1 rend ces valeurs différentes. En variable : énumération jusqu’à3 puis plage min/max, total en lecture seule. Compte à rebours et Fin d'exercice restent hors phrase et hors calcul de Durée totale. Les pauses d’Exercice utilisent les steppers de la feuille sur0..300s ; les réglages de durée du Profil utilisent des steppers. Les steppers de pauses utilisent tap1s puis maintien accéléré1/5/10 selon DSF Bip ; ancienne grille dépendante de la valeur abandonnée. Séries = `1..99`, Répétitions = `0..100`, Durée par Série = `0 s..58 min 55 s` (28/10 : minimum zéro pour les cibles de série, distinct du tiret ; remplace le minimum de D-430).

## Mise à jour visuelle du 30 septembre 2026

[DSF — Cartes, icônes et animations d’appui](DSF-CARTES-ICONES-APPUIS-2026-09-30.md) : références actuelles de Cartes - Icônes et Démonstrations — Animations d’appui, tokens, composants, RG-1 à RG-13, journal des changements, écarts et critères atomiques. Décisions D-233 à D-239. Les 17 points du 30/09 sont clos. D-260 à D-264 consignent la révision du 03/10 : gouttière permanente des Exercices dans le Catalogue et les choix, aucune photo sur Séance/listes mixtes/Calendrier/Suivi, aucun déploiement d’Exercice ou du Suivi, indicateur Ressenti 20 × 20. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture (D-264). D-195/D-235/D-238 et les anciennes décisions Suivi sont révisées sur ces affichages ; les données restent conservées. Aucun changement de protocole ni de calcul métier n’est inclus.

## Paramètres — consolidation du02/10/2026

Référence courante : [Paramètres et brouillon d’un exercice](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#paramètres-et-brouillon-dun-exercice), [DSF](DSF-SERIES-VARIABLES-2026-10-02.md), [matrice](MATRICE-SERIES-VARIABLES-2026-10-02.md) et [rapport](RAPPORT-MISE-A-JOUR-SERIES-VARIABLES-2026-10-02.md). D-247 à D-255 remplacent les anciennes formules et descriptions uniformes sur ce périmètre. Les règles de cartes sans rapport avec les paramètres restent conservées. Les nouvelles copies fournissent le layout ; elles ne prouvent ni intégration DSF ni conformité du moteur.

## Inventaire courant du parcours Créer un exercice — 03/10/2026

[État des lieux exhaustif,42frames et revue des contrats](ETAT-DES-LIEUX-CREATION-EXERCICE-2026-10-03.md). Les références actuelles remplacent les copies du02/10 :37frames de la famille création/modification,2effets Catalogue/Composition et3exécutions. La réserve de réinitialisation a été retirée : D-029/D-150 restent applicables aux deux ordres.

## Cadence et DSF — cible documentaire06/10/2026

Les deux modes acceptent Bip de cadence0..10s,0=Aucun par défaut ; la ligne Cadence le présente par Autre | 5 s | 2 s | 1 s | Sans (D-408, RM-245). Répétitions/À l’échec gardent le chronomètre croissant et la fin manuelle ; Durée garde son minuteur. Le bip ne modifie pas ces terminaisons. La phrase de paramètres est unique, valeurs en gras, issue des paramètres validés et d’un total calculé par la spécification. Exercice : exact en Durée, ≈ en Répétitions avec bip, omitted en Répétitions sans bip et À l’échec. Séance : exact si tout exact, ≈ avec estimation sans inconnu, ≥ avec travail inconnu. [Résultats temporels et agrégation du circuit](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#résultats-temporels-et-agrégation-du-circuit) gouverne calculs et périmètres.

Références actives : [Paramètres et brouillon d’un exercice](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#paramètres-et-brouillon-dun-exercice), [Résultats temporels et agrégation du circuit](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#résultats-temporels-et-agrégation-du-circuit), [Exécution d'une séance — Bip de cadence, progression et sécurité](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#exécution-dune-séance--bip-de-cadence-progression-et-sécurité), [Phrase de synthèse des paramètres](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phrase-de-synthèse-des-paramètres), chapitre13 et DSF-CADENCE-2026-10-06, actualisé le 13/10 par DSF-DEUX-MODES-ECHEC-2026-10-13. Cible à implémenter/qualifier ; aucune annonce de livraison. Les règles photos, Circuit/Tour, pauses et récupération restent conservées. Le classeur v13 est exclusivement rédactionnel.





## Circuits de tours et de séries —12/10/2026

[Spécification normative](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#circuits) : décisions consolidées, propagation fonctionnelle et contrats CE-CIR-01/02/03. Un circuit MVP ; nature, conversions, héritage, volumes, calcul et bilatéralité définis. Captures et DSF à aligner dans une étape ultérieure ; aucun développement applicatif livré.

## Évolution validée — Mouvement, filiation et niveaux

D-437 à D-440 (23/10/2026) séparent le contenu du mouvement et les paramètres d’exécution, partagent le contenu au Catalogue et conservent des occurrences autonomes avec filiation statistique. Niveaux linéaires, édition directe avec correction partagée explicite, historique sans rang. Transition sur base vierge, sans reprise et sans effacement aux lancements suivants [D-440 assouplie les 23 et 24/10/2026 : préférences du Profil, Catégories et Zones corporelles conservées avec leurs personnalisations ; seuls les Exercices, les Séances et leurs associations sont réinitialisés, une seule fois, par la migration du nouveau schéma, avec avis] [arbitrage de Hermann du 26/10/2026 (Q1, Q2) : C05 appliqué intégralement dans PRE-7 (occurrence sans copie persistante du contenu partagé ni synchronisation, intégrité des références actives, instantanés autonomes et figés) ; migration 013 de réinitialisation ponctuelle, exécutée une seule fois : Profil, Catégories, Zones corporelles et Étiquettes conservés avec leurs personnalisations ; Mouvements, groupes de Niveaux, Exercices, Séances et associations devenues obsolètes réinitialisés ; migration 012 inchangée]. Règles normatives : [chapitre 10](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#mouvement-filiation-et-niveaux). Cette cible reste à implémenter ; elle ne livre ni calcul de records ni passage automatique de niveau.


## Niveaux et recherche — documentation du 25/10/2026

**D-445 :** huit points clos ; C08 seul différé. [Règles consolidées](KODJO-Niveaux-Recherche-Parcours-Regles-v7.md). [section redondante avec « Décisions closes — D-445 » qui suit et en tient lieu ; conservée, sans portée propre — annotation du 26/10/2026]

## Décisions closes — D-445

Huit points clos : C01–C07 et C09. C08 seul reste différé sur le périmètre MVP. [Règles consolidées](KODJO-Niveaux-Recherche-Parcours-Regles-v7.md), [prompt Claude Code](PROMPT-CLAUDE-CODE-NIVEAUX-RECHERCHE-V7.md).

Une `ActivityDefinition` référence directement un mouvement et porte ses paramètres propres. Une `SessionActivity` possède son identifiant et référence **directement le mouvement**, sans dépendance de contenu envers l’exercice Catalogue ; elle porte une copie locale complète des paramètres au moment de l’insertion, puis les conserve indépendamment. Elle ne conserve pas une copie modifiable du nom, de la description, des médias, de la catégorie, des zones ni de la structure des phases.

Les corrections du contenu partagé sont visibles à la prochaine lecture des définitions et des séances ; aucun mécanisme de propagation de copies de contenu n’est nécessaire. Modifier les paramètres Catalogue ne modifie pas ceux des séances. Supprimer ou archiver la définition Catalogue ne casse pas les occurrences.

Au démarrage, résoudre le contenu courant avec les paramètres de l’exercice puis construire un instantané autonome. Cet instantané, l’exécution déjà démarrée et les historiques ne changent plus avec le mouvement. Leur `sourceMovementId` conserve l’identité exécutée, sans rang stocké ; la classification actuelle peut être résolue séparément à la lecture.

Les relations actives vers le mouvement doivent rester intègres, depuis les définitions **et les occurrences de séance**. L’absence de contrainte référentielle et la tolérance d’orphelins concernent la filiation des instantanés, pas le contenu vivant. La suppression explicite d’un mouvement encore référencé par un exercice est interdite ; son parcours reste dans C08. La suppression du dernier exercice ne supprime jamais le mouvement : un mouvement peut exister sans exercice et reste recherchable.

**Annotation PRE-7 du 26/10/2026 :** C05 est appliqué intégralement dans PRE-7, avec une migration 013 de réinitialisation ponctuelle (arbitrage de Hermann, Q1 et Q2 ; annotation de D-445 au chapitre 07). Les phases forment un motif cyclique commun aux séries identiques et variables (D-446, annotation PRE-7 de [PHC-20261026](KODJO-Phases-Guidage-Cyclique-2026-10-26.md)).


Navigation : voir le [contrôle exhaustif des écrans et assets](DSF-NAVIGATION-CINQ-DESTINATIONS-2026-10-27.md), référence du 27 octobre 2026.


## Catalogue des séances — cible du 27/10/2026

Une collection unique de séances, une carte commune et deux vues désélectionnables « Un exercice | Plusieurs », aucune active par défaut. Segmenté Mouvements/Séances/Programmes. Le catalogue autonome d'exercices est remplacé par la vue Un exercice. La carte Catalogue porte photo/vignette, catégories et synthèse format/volume/durée ; étiquettes et zones servent aux filtres, sans affichage sur la carte. Lancement de la séance entière. Calendrier/Suivi/Choix inchangés. [Spécification](KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md), [contrôle Figma](DSF-CATALOGUE-SEANCES-2026-10-27.md) et CE-T03-01. La nouvelle règle de titre (§8) appartient à la création/composition ; elle est distincte de la tranche Catalogue proposée.

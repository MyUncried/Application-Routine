# KODJO — Formats de séances et modèles de départ

**Version :** 1.0 — 14 octobre 2026.  
**Statut :** spécification fonctionnelle consolidée à partir des arbitrages du propriétaire ; intégré dans ce lot documentaire ; fusion et réalisation applicative distinctes.  
**Propriétaire des décisions :** Hermann.  
**Baseline documentaire consultée :** `MyUncried/Application-Routine`, `main` au commit `55aa34480d51472b540156e2e664b8528c511f6b`.  
**État de réalisation :** le moteur d’exécution cible n’est pas encore développé, conformément à la clarification du propriétaire du 14/10 à 17:15, heure de Paris. Les comportements ci-dessous sont des exigences de réalisation future, pas des capacités applicatives vérifiées.  
**Figma :** Claude prend en charge la poursuite des modifications. Une lecture complémentaire du 14/10 et les captures associées sont consignées dans la matrice ; elles ne constituent pas une recette interactive ni une conformité métier globale de Figma.

## 0. Objet et convention VNext

Ce document définit les formats de séance, leur distinction avec les modèles de préremplissage, les règles de composition et d’exécution, les données nécessaires et les impacts sur la documentation. Il consolide les décisions du 14 octobre sans rouvrir les arbitrages validés.

Il est une **source fonctionnelle adressable pour VNext**, pas un PlanContract, un RequirementRegistry canonique, une autorisation de développement ou une preuve de qualification. Les repères `FMT-*`, `DEC-*`, `REC-*` et `INT-*` sont des identifiants éditoriaux locaux. Les identifiants VNext, empreintes, scopes et contrats JSON seront produits par les constructeurs du protocole lors de la préparation de la réalisation.

Les principes repris de VNext sont : sources avant interprétation ; exigences séparées ; décisions causales ; impacts et preuves rattachés aux exigences ; préservation explicite ; aucune contradiction masquée par une hypothèse d’implémentation. La présente analyse d’impacts n’est pas l’ImpactGraph calculé depuis le dépôt.

## 1. Sources, autorité et périmètre

### 1.1 Sources

| Repère | Source | Autorité et utilisation |
|---|---|---|
| SRC-01 | [Formats de séance — analyse d’impacts V2](../sources/formats-2026-10-14/concept-V2.md), transmis le 14/10 | Proposition fonctionnelle, amendée par les décisions SRC-03 ; ses passages remplacés sont recensés au §12 |
| SRC-02 | [Inventaire des écrans reçu](../sources/formats-2026-10-14/inventaire-ecrans.md), transmis le 14/10 | Inventaire et intentions de présentation ; ne détermine pas les calculs ou les règles d’exécution |
| SRC-03 | Arbitrages explicites d’Hermann dans cette conversation, 14/10/2026 | Source prioritaire pour les décisions consolidées au §2 ; horaires en Europe/Paris |
| SRC-04 | `docs/Specifications-fonctionnelles/SPECIFICATION-CIRCUITS-TOURS-SERIES-2026-10-12.md` à la baseline | Natures de circuit, séries identiques/variables, héritage du nombre, conversions et bilatéralité |
| SRC-05 | `docs/Specifications-fonctionnelles/SPECIFICATION-BIP-CADENCE-v2.md` à la baseline | Bip, pauses, récupération, calculs et phases propres de séance ; amendements Deux modes applicables |
| SRC-06 | `docs/Specifications-fonctionnelles/SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md` à la baseline | Deux modes, cible à l’échec par série, qualification des relevés et préservation de l’historique |
| SRC-07 | `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md` à la baseline, notamment §1, 5–8 et 12–15 | Méthode de traçabilité, contrats canoniques et frontières ; aucune règle métier sportive n’en est déduite |
| SRC-08 | Figma `G6RY5Ebhgwb4AHIOYDwwvg`, pages Prototype MVP et Conception — Hors MVP | Layout et composants ; relevés datés du 14/10, avant la fin des modifications de Claude |

Les décisions explicites du propriétaire remplacent les passages incompatibles de SRC-01. Les spécifications gouvernent le comportement et les calculs. Figma gouverne la présentation. Un chiffre illustratif Figma n’est pas une formule normative. Le corpus Excel des phrases reste une référence rédactionnelle, jamais un calculateur de durée.

### 1.2 Inclus et exclus

Inclus : six formats, six entrées de séance libre, paramètres effectifs, organisation des efforts, borne et transitions, modalités de fin du Death by, phrases, impacts des écrans, modèle fonctionnel de données, compatibilité et recettes.

Exclus : conception des rapports de suivi et de la comparaison entre individus, classement, charge physique additionnelle, tempo biomécanique, création d’une entrée Pyramide, développement applicatif, modification du protocole VNext et nouvelle modification Figma par cette conversation. Le terme « charge de la fenêtre » désigne ici l’objectif de répétitions, pas un poids en kilogrammes.

Les changements de cartes, navigation, badges et planification décrits par SRC-02 mais indépendants des formats ne deviennent pas des exigences de ce concept. Leur propagation doit conserver son périmètre propre.

## 2. Registre des décisions et provenance

| Repère | Sujet / alternatives examinées | Décision retenue et preuve dans la conversation | Exigences |
|---|---|---|---|
| DEC-01 | Réglages figés après création ou modifiables | 14:16 : « les réglages modifiables du format restent modifiables dans la séance composée » | FMT-04–06 |
| DEC-02 | Tabata par exercice ou alternance imposée | 14:35–14:41 : proposer les deux organisations ; confirmation que le récapitulatif concerné est Tabata | FMT-10–13 |
| DEC-03 | Présentation du choix | 14:43–14:50 : dans la liste des paramètres, dernière ligne « Exécution », libellés à la taille des autres paramètres, séparateur et distribution régulière ; « Séries par exercice — 8 » remplace « Circuit — 8 tours » | FMT-14–15 |
| DEC-04 | Configuration Tabata par exercice | 14:58–15:13 : copie à 1 tour, cartes 8 × 20 s, pause de 10 s dans la modale ; Durée, 8, 20 s, 10 s grisés | FMT-12, FMT-16–18 |
| DEC-05 | EMOM borné par durée ou par compte | 16:14 : nombre de tours réglable, fenêtre réglable, organisation réglable ; durée calculée en direct, repos résiduel non réglable, fenêtres continues | FMT-20–25 |
| DEC-06 | Borne des formats cadencés | 16:14 : Tabata, Intervalles et EMOM bornés par un compte ; For time par le travail, AMRAP par la durée | FMT-19, FMT-26–27 |
| DEC-07 | Progression | 16:22 : Claude propose les deux organisations dans Figma ; ne pas rouvrir le choix comme un nouveau problème métier | FMT-28–29 |
| DEC-08 | Commande d’arrêt Death by | 16:22 : un seul bouton, puis confirmation « limite atteinte » ou « abandon » | FMT-34 |
| DEC-09 | Rapports et comparaison | 16:25–16:30 : conception reportée au Suivi ; les exigences générales d’historique ne sont pas spécifiques aux formats | FMT-39 |
| DEC-10 | Interprétation 21 · 15 · 9 | 17:02 : volume par tour, chaque exercice à 21 puis 15 puis 9 ; aucun sélecteur d’organisation pour For time | FMT-30–32 |
| DEC-11 | Comptage Death by | 17:13 : rang et objectif déduits de l’horloge ; appui confirme l’objectif accompli et révèle le repos ; fenêtre sans appui non acquise | FMT-33, FMT-35–36 |
| DEC-12 | Dernière fenêtre et achèvement Death by | 17:13 : répétitions partielles demandées à l’arrêt, préremplies à zéro ; résultat tours acquis + répétitions ; état toujours incomplet | FMT-37–38 |
| DEC-13 | État de développement | 17:15 : le moteur n’a pas encore été développé | §10 et §14 |

Les échanges sont reproduits ici sous forme de décisions fonctionnelles avec leur provenance. Lors de la constitution du dossier VNext, rattacher les DecisionRecords aux preuves source durables ; ne pas présenter ces repères locaux comme des objets canoniques déjà construits.

## 3. Concepts et invariants

### 3.1 Format, origine et paramètres

- **FMT-01 — Format appliqué.** Une séance peut porter Tabata, Intervalles 30/30, EMOM, AMRAP, For time ou Death by. Ce champ détermine des contraintes et un comportement d’exécution. Une séance libre ne porte aucun format contraignant.
- **FMT-02 — Origine de création.** Le modèle de départ est conservé séparément. Il classe la provenance, sans imposer à lui seul de comportement. Renforcement, Gainage · Mobilité, Superset, Progression, À l’échec et Libre alimentent cette origine sans devenir des formats.
- **FMT-03 — Identité du format.** Le format est fixé à la création et ne devient pas un autre format par édition ordinaire. Les constantes restent imposées.
- **FMT-04 — Réglages de séance.** Les réglages autorisés par le format restent modifiables après composition. Leur portée est la séance, distincte des paramètres propres à chaque exercice.
- **FMT-05 — Valeurs dérivées.** Toute modification d’un réglage ou de la composition met à jour les valeurs calculées et la synthèse courante. Une valeur calculée n’est pas un second réglage concurrent.
- **FMT-06 — Historique.** Modifier la séance ne modifie pas rétroactivement les paramètres ni les résultats de ses exécutions passées. Cette préservation réutilise l’exigence générale d’instantané ; elle n’invente pas un nouvel historique parallèle.
- **FMT-07 — Présentation et synthèse.** Le texte descriptif du modèle peut rester fixe ; la synthèse de la séance décrit ses paramètres effectifs. Une synthèse ne disparaît pas au seul motif que la séance a été composée ou modifiée.

### 3.2 Trois dimensions à distinguer

| Dimension | Question traitée | Exemples |
|---|---|---|
| Organisation / parcours | Dans quel ordre les efforts sont-ils exécutés ? | Par exercice ; en alternance ; circuit de tours ou de séries selon les règles du format |
| Indexation des objectifs | À quelle unité chaque valeur se rapporte-t-elle ? | Répétitions par série ; volume par tour |
| Borne | Qu’est-ce qui termine l’exécution prévue ? | Compte atteint ; durée écoulée ; travail accompli ; arrêt déclaré |

- **FMT-08 — Indexation explicite.** Une échelle de valeurs est indexée sur l’unité nommée par le paramètre. Une liste numérique ne change pas d’unité par simple changement de libellé ou réinterprétation technique.
- **FMT-09 — Réemploi des circuits.** Conserver les circuits de tours et de séries de SRC-04. Les circuits de séries ne sont pas réservés aux seules progressions ou pyramides. Un format peut imposer une organisation ; cela ne retire pas les choix existants à une séance libre.

« Exécution » sur un contrôle d’organisation ne remplace pas le mode Durée/Répétitions de l’exercice. À l’échec reste une cible par série, pas un troisième mode ni un format supplémentaire.

## 4. Tabata et Intervalles

### 4.1 Tabata

- **FMT-10.** Le format impose huit séries par exercice, 20 secondes d’effort par série et une pause de 10 secondes après chaque série.
- **FMT-11.** Avec plusieurs exercices, le réglage global propose « Par exercice » et « En alternance ». Avec un exercice unique, la question est inutile puisque l’enchaînement est identique.
- **FMT-12.** Par exercice : A1…A8, puis B1…B8. La configuration illustrée comporte un circuit d’un tour et deux cartes affichant chacune `8 × 20 s`. Le réglage de répétition de l’ensemble reste distinct des huit séries imposées.
- **FMT-13.** En alternance : A1, B1, A2, B2…A8, B8. Le circuit de séries existant exprime cette organisation avec huit séries par exercice. Les huit séries ne deviennent pas huit efforts au total répartis entre A et B.
- **FMT-14.** Le récapitulatif nomme le compte commun « Séries par exercice — 8 », compatible avec les deux organisations. Il ne présente pas ce compte comme huit tours de circuit dans le cas par exercice.
- **FMT-15.** Le contrôle « Exécution » est en dernière ligne du bloc Paramètres, après Durée totale, avec séparateur. Son libellé et les options sont alignés sur la même ligne ; la taille de texte est celle des paramètres voisins. Le layout précis relève du DSF et du Figma courant.
- **FMT-16.** Dans la composition par exercice, la carte affiche le volume `8 × 20 s`, sans afficher la pause dans cette expression.
- **FMT-17.** La modale correspondante affiche Mode d’exécution = Durée, Nombre de séries = 8, Durée d’une série = 20 s et Pause après chaque série = 10 s. Les quatre valeurs sont visibles, grisées et non modifiables ; leur caractère imposé par Tabata est expliqué. Elles restent effectives et ne sont pas remplacées par un tiret.
- **FMT-18.** Les 10 secondes constituent la pause après chaque série. Une récupération de séance n’est pas créée pour rendre cette pause visible. Aucune récupération supplémentaire n’est ajoutée par défaut. Si une récupération positive est explicitement ajoutée là où le modèle l’autorise, sa substitution à la dernière pause suit SRC-04/05, sans double comptage.

Exemple normatif unilatéral, sans récupération ni autre phase : deux exercices × huit séries × (20 + 10) secondes = **480 secondes, soit 8 minutes** dans les deux organisations. Il s’agit du total de ces efforts et pauses, pas du total incluant le compte à rebours et la fin de séance.

La copie avec 1 tour et 8 × 20 s est nommée « Par exercice », indépendamment de sa position de deuxième écran sur le canvas. L’ordre des copies Figma n’est pas une identité métier.

### 4.2 Intervalles 30/30

- **FMT-19.** Les constantes sont 30 secondes de travail et 30 secondes de pause. La borne réglée est un compte, jamais une durée totale saisie. La durée se déduit des occurrences effectivement prévues et de leurs phases. Les réglages de compte et la récupération éventuelle restent ceux du format décrit par SRC-01 ; ne pas déduire d’un chiffre de maquette une règle supplémentaire.

La généralisation aux formats cadencés porte sur la borne par compte. Elle ne suffit pas à créer, à elle seule, un sélecteur d’organisation pour tous les formats : ce sélecteur est explicitement décidé pour Tabata, EMOM et Progression, et explicitement exclu pour For time.

## 5. EMOM : fenêtres et borne

- **FMT-20 — Réglages.** L’utilisateur règle la cadence, c’est-à-dire la durée d’une fenêtre, le nombre de tours et l’organisation « Par exercice » ou « En alternance ».
- **FMT-21 — Durée.** La durée du bloc EMOM est calculée et affichée en direct : `nombre de tours × nombre d’exercices × durée de fenêtre`. Elle n’est jamais saisie. Les éventuelles phases propres de séance restent distinguées de ce total de bloc.
- **FMT-22 — Composition.** Ajouter ou retirer un exercice conserve le nombre de tours et recalcule la durée. La durée n’entraîne aucun arrondi du nombre de tours ni dernier tour tronqué.
- **FMT-23 — Fenêtre.** Chaque fenêtre va jusqu’à son terme ; la suivante commence à l’échéance. Terminer l’objectif avant l’échéance ne raccourcit pas la fenêtre. Ne pas terminer l’objectif ne prolonge pas la fenêtre.
- **FMT-24 — Appui.** L’appui sur le cadran indique que le travail de la fenêtre est terminé et révèle le repos restant. Il ne passe pas à la fenêtre suivante.
- **FMT-25 — Repos.** Le repos de la fenêtre est le temps qui reste entre la fin effective du travail et son échéance. Il est variable, non réglable et inclus dans la fenêtre ; il ne s’ajoute pas une deuxième fois à la durée totale. Sans fin de travail signalée avant l’échéance, aucune durée de repos positive n’est inventée.

Avec deux exercices et six passages chacun : « Par exercice » regroupe les six fenêtres de A puis les six de B ; « En alternance » alterne A et B six fois. La fenêtre commune et le nombre total de fenêtres restent identiques. Cette description est fonctionnelle : le raccordement aux champs du circuit doit éviter de multiplier une seconde fois les séries et les tours.

Exemple : 6 tours × 2 exercices × 60 s = **12 min**. Ajouter C donne **18 min**, toujours avec 6 tours. Fin du travail à 35 s dans une fenêtre de 60 s : **25 s de repos**. La durée de la fenêtre n’est pas le paramètre « Bip de cadence » de l’exercice ; ce sont deux informations distinctes.

## 6. AMRAP, For time et départs rapides

### 6.1 AMRAP

- **FMT-26.** L’AMRAP a une durée imposée réglable. Le circuit est répété jusqu’à l’échéance globale ; le nombre de tours réalisés est un résultat, pas une borne saisie.
- **FMT-27.** Pour les formats cadencés Tabata, Intervalles et EMOM, la borne saisie est un compte. Cette règle ne s’applique pas à l’AMRAP ni au For time. Elle ne change pas les possibilités des séances libres en dehors du périmètre décidé.

SRC-01 exclut pour l’AMRAP le circuit de séries et les séries variables : ne pas lui appliquer le sélecteur de Progression par généralisation. Les objectifs par exercice restent les valeurs prescrites du format.

### 6.2 Départs rapides et Progression

- **FMT-28.** Renforcement, Gainage · Mobilité, Superset, Progression, À l’échec et Libre ne font que préremplir une séance libre. Aucun verrouillage métier ne provient de cette origine.
- **FMT-29.** Progression propose « Par exercice » et « En alternance ». Ses valeurs sont des répétitions **par série**. En alternance, les passages restent comptés en séries : A10, B10, A12, B12, A14, B14. Par exercice : A10, A12, A14, puis B10, B12, B14. L’ordre n’efface ni ne réindexe la prescription.

Les exemples 3 × 15, postures, deux exercices enchaînés, 10 · 12 · 14 et trois séries à l’échec sont des préremplissages de leurs modèles respectifs, pas des constantes du moteur. La charge additionnelle et une entrée Pyramide distincte restent hors périmètre.

### 6.3 For time

- **FMT-30.** Le paramètre s’appelle « Volume par tour ». Pour `21 · 15 · 9`, chaque exercice est exécuté à 21 répétitions au premier tour, 15 au deuxième, 9 au troisième.
- **FMT-31.** Aucun sélecteur « Par exercice / En alternance » n’est proposé pour For time. L’échelle reste indexée par tour ; elle n’est pas transformée en trois séries successives à l’intérieur de chaque exercice.
- **FMT-32.** La phrase normative est : « 21 répétitions au premier tour, 15 au deuxième, 9 au troisième. Le plus vite possible. » Le travail prescrit borne le format ; le temps réellement nécessaire pour l’accomplir est un résultat.

Avec A et B : A21, B21, A15, B15, A9, B9. Les trois valeurs décrivent trois tours. Le modèle doit garantir la cohérence entre nombre de tours et valeurs applicables, sans inventer un objectif pour une entrée manquante. La mécanique exacte de l’éditeur d’échelle sera raccordée au contrat d’écran courant, sans recopier automatiquement la règle des séries variables si elle change l’unité.

« Le plus vite possible » exprime l’objectif du format, pas l’interdiction de faire une pause ni une détection automatique des mouvements. Les commandes générales non remplacées restent applicables.

## 7. Death by

### 7.1 Fenêtres, objectif et acquisition

- **FMT-33.** Le rang de fenêtre est déduit de l’horloge d’exécution ; l’utilisateur ne déclare jamais un nombre de tours à chaque passage. L’objectif est calculé depuis le rang, le départ et l’incrément du format. Dans le cas de référence : une répétition la première minute, puis une de plus à chaque minute.
- **FMT-34.** Un seul bouton met fin à la séance et ouvre une confirmation distinguant « Limite atteinte » et « Abandonner ».
- **FMT-35.** Un tour est acquis lorsque l’objectif de sa fenêtre est accompli, signalé par l’appui sur le cadran. Cet appui révèle le repos restant ; il ne fait pas avancer la fenêtre et ne compte pas les mouvements individuellement.
- **FMT-36.** Une fenêtre entamée sans appui n’est pas un tour acquis. Son échéance ne vaut pas confirmation implicite. Le rang courant et le nombre de tours acquis sont deux données distinctes. Un appui répété dans la même fenêtre ne peut acquérir deux tours.

Pour une fenêtre de durée W et un temps actif t depuis le départ du bloc, hors traitement exact de la frontière d’échéance : `rang = floor(t / W) + 1`. Pour un départ q0 et un incrément d : `objectif(rang) = q0 + (rang − 1) × d`. Ces expressions décrivent la logique temporelle ; les événements de frontière doivent être traités une seule fois par le moteur.

La fenêtre n’attend pas une déclaration de rang pour démarrer. La progression temporelle et la confirmation du travail sont séparées. La confirmation du travail est déclarative, pas une mesure de répétitions par capteur.

### 7.2 Dernière fenêtre et résultat

- **FMT-37.** Lorsqu’une dernière fenêtre est entamée sans être achevée, elle ne compte pas comme tour. La confirmation d’arrêt demande le nombre de répétitions réalisées dans cette fenêtre, prérempli à zéro. La validation confirme la valeur affichée. Avant validation, ce zéro est une valeur proposée dans le formulaire, pas une mesure constatée.
- **FMT-38.** Le résultat associe les tours acquis et les répétitions partielles, par exemple « 12 tours + 5 répétitions ». Le motif est « limite atteinte » ou « abandon ». Dans les deux cas, l’état d’achèvement reste **incomplet**, conformément à la décision du 14/10 à 17:13.

Cette règle remplace explicitement la V2 et l’interprétation antérieure selon lesquelles une limite atteinte produisait l’état « terminée ». Un arrêt après acquisition d’une fenêtre ne doit pas compter une seconde fois cette même fenêtre comme répétitions partielles.

Le formulaire de répétitions partielles est propre à cette clôture Death by. Il ne généralise pas une saisie obligatoire à toutes les cibles À l’échec des exercices. L’absence d’appui ne doit pas être transformée rétrospectivement en objectif accompli.

## 8. Données, calculs et compatibilité

### 8.1 Modèle fonctionnel cible

| Objet | Information à porter ou à réutiliser | Invariant |
|---|---|---|
| Séance | Format appliqué facultatif ; origine de création ; réglages du format ; organisation applicable | Format et origine distincts ; aucun format inféré depuis le nom |
| Définition du format | Constantes, réglages autorisés, règles de parcours et de borne | Une constante n’est pas un réglage local d’exercice librement modifiable |
| Prescription | Objectif et unité d’indexation : série ou tour | Une même liste ne peut être interprétée alternativement selon le consommateur |
| Circuit | Nature, compte applicable et condition de fin | Pas de confusion entre parcours, borne et résultat |
| Exercice dans la séance | Paramètres effectifs et provenance des valeurs imposées | Ne pas modifier l’exercice du catalogue pour appliquer une contrainte contextuelle |
| Exécution / instantané | Configuration effective et version des règles | Les modifications futures n’altèrent pas une exécution passée |
| Fenêtre cadencée | Rang, début, échéance, fin de travail signalée, objectif et acquisition applicables | L’horloge ne dépend pas du nombre de signaux audio réellement joués |
| Résultat Death by | Tours acquis, répétitions partielles confirmées, motif et achèvement | Rang ≠ tours acquis ; incomplet ≠ absence de résultat |

Ce tableau prescrit des informations fonctionnelles, pas des noms de colonnes SQL ni une nouvelle table par ligne. L’inventaire du schéma réel déterminera les ajouts et réemplois.

- **FMT-39.** Conserver les données effectives nécessaires à l’historique selon les règles générales existantes. Ne pas définir maintenant les critères de comparaison, classements ou rapports de suivi.
- **FMT-40.** Les séances existantes sans format conservent leur comportement libre. Ne pas leur attribuer un format d’après un titre « Tabata » ou une coïncidence numérique ; ne pas leur imposer de nouveaux verrouillages.
- **FMT-41.** Les phases Compte à rebours d’exercice et Fin d’exercice restent exclues des séances dans tous les cas. Les seules phases propres de séance s’exécutent selon les règles existantes ; aucun booléen d’activation n’est ajouté.
- **FMT-42.** Les phrases restent générées depuis les paramètres sous forme de segments `{texte, gras}` et ne sont pas persistées comme vérité métier. Le For time conserve son texte validé et son indexation par tour.

### 8.2 Calculs et absence de régression

La cadence de fenêtre de l’EMOM ou du Death by est distincte du bip de cadence périodique de l’exercice. La première détermine une échéance ; le second reste un repère sonore selon SRC-05/06.

Le total des fenêtres EMOM est connu parce que la durée de chaque fenêtre est imposée. Il ne doit pas être requalifié en estimation sous prétexte que les répétitions réalisées sont variables. Le temps de travail et le repos se partagent cette fenêtre sans en augmenter la durée.

Les règles exact / estimated / lowerBound / omitted des exercices libres et des agrégats existants restent applicables dans leur périmètre. Ne pas imposer un total prévisionnel chiffré au Death by, dont le nombre de fenêtres est inconnu. Ne pas confondre durée du bloc, durée structurelle de séance et temps total incluant les phases initiales/finales.

Les pauses après chaque série, la substitution par récupération positive, les côtés, les points d’arrêt et les conversions de circuits conservent les règles de SRC-04/05 lorsqu’elles ne sont pas explicitement remplacées. Les combinaisons avec une borne de fenêtre doivent être vérifiées dans le plan développé : aucune phase ne peut être ajoutée silencieusement au-delà d’une formule normative de fenêtre.

## 9. Contrats d’écrans à intégrer

Les noms ci-dessous identifient des familles existantes ou des contrats à compléter. Aucun numéro global CE n’est réservé sans vérifier le registre courant.

| Famille | Informations et contrôles | Comportement attendu / validation |
|---|---|---|
| Choix du modèle | Six formats ; cinq départs rapides ; Libre | Format ou simple origine correctement initialisé ; aucune contrainte pour un départ rapide |
| Paramètres du modèle | Constantes, réglages, valeurs calculées distingués | Seuls les réglages sont éditables ; calcul actualisé en direct |
| Tabata — récapitulatif | Liste des exercices ; Séries par exercice ; Exécution en dernière ligne | Deux choix lorsque plusieurs exercices ; aucune lecture « 8 tours » pour le compte de séries |
| Tabata — composition par exercice | 1 tour dans l’exemple ; cartes 8 × 20 s | Pas de récupération artificielle pour afficher la pause |
| Tabata — modale par exercice | Durée, 8, 20 s, 10 s grisés ; raison visible | Valeurs réelles non modifiables, pas de tiret |
| EMOM — paramètres / récapitulatif | Cadence, nombre de tours, organisation ; durée calculée | Durée non saisissable ; ajout/retrait d’exercice recalcule le total sans modifier le compte |
| Progression — récapitulatif | Deux organisations ; répétitions par série | Alternance conserve l’indexation série |
| For time — paramètres / modale / composition | Volume par tour ; phrase normative | Pas de contrôle d’organisation ; ne pas présenter la liste comme des séries locales successives |
| Exécution EMOM / Death by | Cadran, échéance, repos révélé | Appui ne raccourcit pas la fenêtre ; affichage cohérent avec son rang |
| Arrêt Death by | Un déclencheur ; deux issues ; répétitions partielles quand applicables | Validation distingue motif, résultat et état incomplet |
| Historique / synthèse | Paramètres effectifs, résultat et motif | Aucune invention de rapport de comparaison dans ce lot |

Chaque contrat devra conserver les rubriques du référentiel en vigueur : objectif et accès, sources, structure et placement, données et formats, états, actions/transitions, validation, annulation/persistance, accessibilité, erreurs et critères de recette. Les dimensions communes viennent des composants/tokens ; les surcharges d’instance et leur justification sont identifiées séparément.

Ne pas affirmer que le parcours compte quatre étapes identiques pour toutes les entrées : le Tabata comporte une sélection d’exercices et les départs rapides peuvent différer. Les captures doivent être inventoriées depuis le Figma final de Claude, avec leur nœud, leur état et leur date, avant remplacement documentaire.

## 10. Analyse d’impacts sur la solution

| Domaine | Impact cible | Nature et limite du constat |
|---|---|---|
| Modèle de données | Format/origine, paramètres contextualisés, indexation par tour, fenêtres et résultats | Extension à comparer au schéma réel ; aucune migration physique définie ici |
| Composition déjà développée | Préremplissage, réglages globaux, valeurs imposées, organisation, synthèses | Adaptations ciblées attendues ; code non audité dans cette rédaction |
| Moteur d’exécution | Parcours finis et non bornés en compte ; fenêtres indépendantes de la fin du travail ; objectifs par rang | Capacités à concevoir dès la première réalisation ; aucune refonte d’un moteur livré n’est annoncée |
| Calculs | Total EMOM, nombre de fenêtres, pause/repo sans double compte | Réemploi des règles de durée avec extensions selon format |
| Phrases et cartes | Unité d’indexation explicite, texte For time, volume Tabata | Générateur de segments conservé ; corpus à enrichir |
| Persistance / reprise | Instantané, échéances, acquisition idempotente, saisie de clôture | S’appuyer sur la conception générale ; preuve device future nécessaire |
| Suivi | Conserver le résultat et ses conditions | Conception des rapports reportée |
| Infrastructure / hébergement | Aucun nouveau service distant imposé par ces règles | Ne pas déduire de ce concept un besoin de serveur ou un coût d’hébergement supplémentaire |

L’évolution est principalement additive sur la solution existante. L’effort d’exécution est substantiel dans le développement à venir, mais ne constitue pas une remise en cause d’un moteur déjà implémenté. Aucun chiffrage fiable ne découle du seul document ; l’ImpactGraph VNext devra être construit depuis le code et ses importeurs directs.

## 11. Recettes fonctionnelles et preuves attendues

Ces recettes sont prescrites, **non exécutées sur l’application**. Elles constituent des unités de recette à rattacher aux exigences dans le futur dossier VNext.

| Repère | Situation | Attendu | Exigences |
|---|---|---|---|
| REC-01 | Créer une séance via Renforcement puis modifier ses valeurs | Origine conservée, aucun format contraignant ni verrouillage ajouté | 01–03, 28 |
| REC-02 | Modifier un réglage autorisé après composition | Même séance, synthèse et calculs actualisés ; format conservé | 03–07 |
| REC-03 | Reconsulter une exécution antérieure après cette modification | Paramètres et résultats passés inchangés | 06, 39 |
| REC-04 | Tabata A/B, par exercice, un tour | A1…A8 puis B1…B8 ; 16 efforts | 10–12 |
| REC-05 | Même Tabata en alternance | A1 B1…A8 B8 ; même volume | 10–11, 13 |
| REC-06 | Tabata unilatéral sans autres phases | 480 s pour A/B avec toutes les pauses ; aucune récupération ajoutée | 10, 18 |
| REC-07 | Ouvrir la composition par exercice | Cartes 8 × 20 s ; aucune pause incorporée au libellé de volume | 16 |
| REC-08 | Ouvrir la modale Tabata | Quatre valeurs réelles grisées, non éditables ; raison visible | 17 |
| REC-09 | Tabata avec un exercice | Pas de question d’organisation inutile | 11 |
| REC-10 | EMOM 2 exercices, 6 tours, fenêtre 60 s | 12 min calculées, aucune saisie de durée totale | 20–21 |
| REC-11 | Ajouter un troisième exercice | 6 tours conservés ; 18 min | 22 |
| REC-12 | Fin de travail à 35 s d’une fenêtre de 60 s | 25 s de repos ; pas de transition avant 60 s | 23–25 |
| REC-13 | Échéance EMOM sans signal de fin du travail | Fenêtre suivante ; pas d’allongement ni de repos positif inventé | 23, 25 |
| REC-14 | Intervalles : modifier le compte | Durée recalculée ; aucune durée globale saisie | 19, 27 |
| REC-15 | AMRAP atteint sa durée | Arrêt selon borne temporelle, non selon nombre prédéfini de tours | 26 |
| REC-16 | Progression A/B 10 · 12 · 14, changer organisation | Ordre modifié, valeurs toujours indexées par série | 08–09, 29 |
| REC-17 | For time A/B 21 · 15 · 9 | A21 B21 A15 B15 A9 B9 ; aucun sélecteur d’organisation | 30–31 |
| REC-18 | Phrase For time | Texte exact validé ; segments/gras conformes au générateur existant | 32, 42 |
| REC-19 | Death by, fenêtre 13, départ 1/incrément 1 | Objectif 13 calculé ; aucune saisie du rang | 33 |
| REC-20 | Death by : appui puis second appui dans la même fenêtre | Un seul tour acquis ; repos révélé ; échéance inchangée | 35–36 |
| REC-21 | Fenêtre Death by sans appui | Pas de tour acquis, même si l’échéance passe | 36 |
| REC-22 | 12 tours acquis puis arrêt après 5 répétitions dans la fenêtre 13 | Formulaire initial à 0, saisie 5 ; résultat 12 tours + 5 répétitions | 37–38 |
| REC-23 | Clôture Death by par limite puis cas séparé par abandon | Motifs différents ; état incomplet dans les deux cas | 34, 38 |
| REC-24 | Valider 0 répétition partielle | Zéro déclaré ; aucun objectif automatiquement substitué | 37 |
| REC-25 | Charger une ancienne séance sans format | Comportement libre inchangé ; aucun classement inféré depuis le nom | 40 |
| REC-26 | Exercice doté de compte à rebours/fin, utilisé en séance | Phases propres non exécutées ; seules phases de séance applicables | 41 |
| REC-27 | Reprise, événement d’échéance répété, son désactivé | Pas de double acquisition ; fenêtre déterminée temporellement, pas par audio | 23, 33, 36 |
| REC-28 | Contrôle visuel du récapitulatif | Alignement, séparateurs, proportions et couleurs conformes aux sources DSF/Figma retenues | 14–15 |

Dans la dernière colonne, les nombres abrègent les repères `FMT-*`.

Preuves : tests fonctionnels pour calculs et transitions ; analyse statique pour types, compatibilité et propagation ; comparaison visuelle et contrôle d’accessibilité pour les contrats UI ; contrôle sur appareil pour horloge, reprise et interactions. Un test de calcul ne prouve pas le layout. Aucun résultat de ces preuves n’est déclaré obtenu par ce document.

## 12. Disposition explicite des règles antérieures

| Source / prescription | Disposition VNext | Traitement |
|---|---|---|
| V2 : réglages choisis une fois, non modifiables ensuite | SUPERSÉDÉE_EXPLICITEMENT | Remplacé par FMT-04 ; constantes et identité du format restent fixes |
| V2 : parcours de tours imposé pour tous les formats | SUPERSÉDÉE_EXPLICITEMENT dans les cas arbitrés | Organisation Tabata et EMOM réglable ; autres formats selon leurs règles |
| V2 : circuit de séries réservé aux progressions/pyramides | SUPERSÉDÉE_EXPLICITEMENT | Règle générale SRC-04 conservée |
| V2 : Progression uniquement de séries | SUPERSÉDÉE_EXPLICITEMENT | Deux organisations, indexation par série |
| V2 : quatre étapes strictement identiques pour douze entrées | SUPERSÉDÉE_EXPLICITEMENT | Parcours vérifiés et contrats propres aux familles |
| V2 : suppression d’un ancien choix « En durée » dans le libre | Contexte à réconcilier | Ne pas annoncer la suppression d’un choix qui n’existe pas dans la baseline des deux natures ; distinguer borne et nature |
| V2 : utilisateur déclare ses tours à chaque passage Death by | SUPERSÉDÉE_EXPLICITEMENT | Horloge, objectif calculé et acquisition par appui |
| V2 : Death by attend une déclaration pour chaque nouveau tour | SUPERSÉDÉE_EXPLICITEMENT | Cadencement temporel ; appui ne déclenche pas le passage |
| V2 : limite atteinte = terminée | SUPERSÉDÉE_EXPLICITEMENT | Death by toujours incomplet ; motif conservé séparément |
| V2 : cible À l’échec comme nouveauté à créer | REMPLACÉE_ÉQUIVALENTE | Réutiliser SRC-06 ; pas de troisième mode |
| Circuits, pauses, côtés, phases propres et instantanés existants | CONSERVÉE | Conservés hors remplacement explicite, vérification des combinaisons au §14 |
| Rapports, comparaison, charge et tempo | NON_APPLICABLE_JUSTIFIÉE | Pas de prérequis artificiel à la spécification des formats |

Ces dispositions sont préparées pour la traçabilité. Leur rattachement aux unités exactes du SourceManifest et aux contrats canoniques reste à construire lors de la préparation VNext.

## 13. Matrice des mises à jour documentaires

Racine existante : `docs/Specifications-fonctionnelles/`. Les titres ci-dessous correspondent aux chemins présents à la baseline consultée. Propagation effectuée dans ce lot : voir la matrice `../MATRICE-FORMATS-SEANCES-2026-10-14.md`.

| Repère | Support existant | Modification attendue | Couverture |
|---|---|---|---|
| INT-01 | `00 – Glossaire.md`, `04 – Modèle fonctionnel.md` | Format/origine, fenêtre, organisation, volume par tour, tour acquis | FMT-01–09, 30, 33–38 |
| INT-02 | `03 – Parcours utilisateur.md` | Parcours selon modèle ; paramètres globaux ; confirmation Death by | FMT-11, 20, 28–29, 34, 37 |
| INT-03 | `06 – Ecrans et navigation de la V1.md` | Inventaire final des écrans, copies nouvelles, captures et renvois aux contrats | FMT-14–17, 20, 29–32, 34 |
| INT-04 | `07 – Registre des décisions de conception.md` | Intégrer DEC-01…13, réserver les vrais numéros disponibles, superséder les passages contraires | §2 et §12 |
| INT-05 | `08 – Conception fonctionnelle détaillée.md` | Contraintes, calculs, parcours, indexation, acquisition et clôture | FMT-01–38 |
| INT-06 | `09 – Modèle de données fonctionnel.md` | Format, origine, réglages, objectifs indexés, fenêtre, résultat et compatibilité | FMT-01–09, 33–42 |
| INT-07 | `10 – Processus métier et règles métier transverses.md` | Règles par format et préservation des règles générales ; suppression des contradictions à leur emplacement | FMT-10–41 |
| INT-08 | `11 – API fonctionnelles.md` | Transport et validation des informations effectives ; ne pas persister une phrase comme source | FMT-04–06, 08, 33–42 |
| INT-09 | `12 – Architecture technique.md` | Capacités futures du moteur, horloge, plan progressif, indexation et reprise | §8–10 |
| INT-10 | `13 – Contrats d’écran.md` | Compléter toutes les rubriques des familles §9 ; distinguer exigences et captures disponibles | FMT-14–17, 20–25, 29–38 |
| INT-11 | Spécifications Circuits, Bip v2, Paramètres v13 et Phrase v1 | Raccordements ciblés ; fenêtre ≠ bip ; série ≠ tour ; nouveaux textes ; aucune modification globale des pauses | FMT-08–42 |
| INT-12 | DSF documentaire, index, corpus de phrases et matrices Figma | Contrôle d’organisation, rendu readonly grisé effectif, volumes et traçabilité des composants ; corpus enrichi | FMT-14–17, 29–32, 42 |

La mise à jour doit remplacer les formulations contradictoires dans les sections actives. Un addendum seul ne suffit pas si l’ancien corps continue de prescrire une autre règle. Les rapports et snapshots historiques restent conservés et explicitement datés.

## 14. Conditions d’intégration et limites de qualification

### 14.1 Séquence documentaire puis VNext

1. Reprendre le HEAD courant et les travaux parallèles ; conserver les corrections PRE-3/PRE-4 et du protocole.
2. Intégrer cette source et le registre de décisions, puis les règles métier et le modèle fonctionnel.
3. Rapprocher les écrans finaux de Claude des familles du §9 ; capturer les états modifiés et compléter leurs contrats/DSF.
4. Propager INT-01…12 ; étendre le corpus et les recettes ; vérifier qu’aucune prescription active ne contredit DEC-01…13.
5. Construire ensuite, pour le développement, SourceManifest et DecisionRecords, RequirementRegistry, ImpactGraph lié au code réel, PlanContract et critères UI atomiques. Ne pas présenter cette rédaction comme un paquet admis ou revu par VNext.

### 14.2 Vérifications de raccordement à ne pas masquer

Les arbitrages explicitement traités sont clos. Cela ne vaut pas qualification exhaustive de toutes les combinaisons du futur moteur. Avant de déclarer un périmètre de réalisation prêt, les raccordements suivants doivent être démontrés dans les sources détaillées ou signalés comme incomplets :

- **Fenêtres et commandes générales :** portée de Pause/Reprendre, réinitialisation, points d’arrêt et reprise système face à la règle « fenêtre continue ». Cette règle décrit déjà la fin du travail ; elle ne suffit pas à décider silencieusement de supprimer les commandes générales ou de les laisser modifier les échéances.
- **Fenêtres et bilatéralité :** rattachement des côtés et de leurs pauses à la fenêtre commune. La formule EMOM validée ne doit pas recevoir un multiplicateur caché ; conserver une règle existante seulement si elle est compatible et démontrée.
- **Death by à plusieurs exercices :** la règle validée lie un tour acquis à une fenêtre accomplie ; le rang global, le changement d’exercice et l’incrément doivent être explicitement raccordés si le parcours autorise plusieurs exercices. L’exemple d’un exercice ne prouve pas ce raccordement.
- **Reconfiguration des comptes :** l’éditeur du Volume par tour doit conserver le lien entre nombre de tours et échelle ; l’EMOM « Par exercice » ne doit pas multiplier à la fois séries et tours. La représentation technique doit respecter les séquences et formules déjà décidées.
- **Dernier Figma :** lecture et 46 captures effectuées dans ce lot. Les écarts résiduels F-01…04 et l’absence de layout qualifié pour CE-FMT-05/06 sont recensés dans la revue transverse ; ils empêchent de déclarer un alignement complet. Les erreurs numériques d’une maquette ne remplacent aucune règle de cette spécification.

Ces points ne remettent pas en question les décisions consignées. Ils ne constituent pas des blocages démontrés ; leur effet éventuel se limite au comportement dont une règle manquerait réellement. S’ils ne se résolvent pas par les règles existantes, le dossier VNext doit conserver une clarification localisée, sans inventer de comportement.

### 14.3 État de livraison de ce document

| Élément | État |
|---|---|
| Décisions de la conversation consolidées | Incluses et tracées |
| Règles, données, impacts et recettes | Rédigés dans ce document |
| Propagation des chapitres / DSF / contrats | Effectuée dans ce lot, couverture détaillée dans la matrice Formats du 14/10 |
| Lecture du dernier Figma modifié par Claude | Inventaire et 46 captures du 14/10 intégrés ; écarts encore observés consignés séparément |
| Audit du code et migration physique | Non réalisés |
| Moteur d’exécution | À développer |
| Contrats JSON et revue indépendante VNext | Non produits / non lancés |
| Fusion main et pull local | Non effectués |

## Annexe — Repères Figma observés le 14 octobre

Ces références permettent de retrouver le travail ; elles ne figent pas une version et ne remplacent pas les captures finales.

| Page | Écran | Nœud |
|---|---|---|
| Prototype MVP | Composition séance — Modèles — Tabata (récapitulatif) | `8624:30306` |
| Conception | Même récapitulatif | `8388:32052` |
| Prototype MVP | Composition séance — Tabata (préremplie) — Par exercice | `8747:14320` |
| Conception | Même composition | `8747:30858` |
| Prototype MVP | Modification activité — Paramètres (modale) — Exercice Tabata — Par exercice | `8747:14451` |
| Conception | Même modale | `8747:30989` |

Fichier : https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg

## Clarification d’autorité et de portée — 14/10/2026

Les spécifications définissent les règles métier, les calculs et les comportements. Figma illustre les scénarios de présentation des écrans et contrôles. Un scénario absent de Figma ne constitue pas une lacune fonctionnelle lorsque son comportement est spécifié. Les shells, composants, DSF et contrats existants permettent de décliner des états sans dessiner chaque combinaison.

R-01 à R-05 sont des sujets de vérification ciblée, pas cinq blocages démontrés ni un préalable global au développement. R-01 concerne les commandes du moteur à fenêtres ; R-02 son exécution bilatérale ; R-03 l’enchaînement Death by multi-exercices. Leurs réponses doivent être recherchées dans les spécifications avant toute question. R-04 concerne uniquement la synchronisation des champs de l’éditeur For time s’ils sont modifiables séparément ; le contrôle du double comptage EMOM relève de l’implémentation et de ses tests. R-05 ne bloque rien du seul fait de captures absentes : une clarification de présentation n’est nécessaire que si l’implantation d’un élément nouveau ne peut pas être déterminée depuis les contrats et le DSF.

Aucun de ces constats ne suspend globalement la création/composition. Seule une règle effectivement absente ou contradictoire doit être clarifiée avant l’implémentation du comportement concerné. Les mentions de preuve visuelle partielle décrivent la couverture des illustrations, pas une obligation de produire une nouvelle maquette.

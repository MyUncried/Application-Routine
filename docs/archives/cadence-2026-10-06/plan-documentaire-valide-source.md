# KODJO — Analyse des sources et plan de mise à jour documentaire

6 octobre 2026 — Révision 2, après clarification du propriétaire sur le rôle de l’Excel. Analyse préparatoire ; aucune modification du dépôt, de Figma ou des documents sources.

## 1. Conclusion

**La mise à jour documentaire peut commencer.** La conception Cadence fournit les règles fonctionnelles ; l’Excel v13 est une référence de rédaction des phrases de synthèse. Il n’est ni un calculateur de durée ni un jeu de tests du moteur. Ses montants illustratifs et l’absence de paramètres permettant de les recalculer ne constituent pas des anomalies à corriger ou des prérequis.

La première analyse avait donné à l’Excel une autorité qu’il n’a pas. Les exigences de correction de ses30 totaux et de complétion de ses24 jeux de paramètres variables sont retirées. Le fichier `CONTROLE-SCENARIOS-v13.csv` précédemment livré est **hors périmètre et retiré des références de ce plan** ; il ne doit servir ni de liste de corrections ni de condition de clôture.

La mise à jour suit six lots : consolidation des références, rédaction de la spécification de phrase, propagation des règles et données, écrans/contrats, DSF/assets, puis contrôle transverse. Les précisions de rédaction et les vérifications visuelles restantes sont traitées dans les lots concernés ; elles ne bloquent pas le démarrage des autres travaux. Aucune refonte ni réouverture des décisions établies n’est nécessaire.

Le rapport de corrections apporte une suite à mon contre-audit : plusieurs écarts y sont déclarés corrigés. Ces déclarations doivent remplacer les anciens statuts « à faire » dans le suivi, avec leur provenance. Elles ne constituent pas une nouvelle vérification indépendante de Figma ; cette analyse porte sur les documents et le dépôt.

## 2. Sources et version de départ

La tête distante de `main` a été vérifiée par l’API GitHub pendant cette analyse : **`6d03f5be579f2d0e2e7602b6abf1c2b46f4c740b`**, fusion de #322 du 5 octobre à 08:48:17 UTC. C’est aussi la baseline indiquée dans la conception Cadence. La comparaison ci-dessous utilise les fichiers à ce SHA, et non une ancienne copie présumée à jour.

[Documentation à la révision contrôlée](https://github.com/MyUncried/Application-Routine/tree/6d03f5be579f2d0e2e7602b6abf1c2b46f4c740b/docs)

Les éventuelles modifications locales non publiées de `C:\Dev\Application-routine` ne sont pas accessibles dans ce contrôle. Elles devront être rapprochées avant toute écriture future ; elles ne doivent pas être écrasées.

| Réf. | Pièce analysée | Autorité / usage |
|---|---|---|
| S1 | `KODJO_Conception_Fonctionnelle_Cadence_Repetitions_V1(2).md`, version interne 1.0 | Règles fonctionnelles Cadence et décisions CAD-01 à CAD-30 |
| S2 | `KODJO_Dossier_Cadence_et_Phrase_de_synthese.md` | Présentation de la phrase, changements déclarés des écrans et compléments à propager |
| S3 | `generateur-phrase-activite_v13.xlsx` | Référence de formulation : grammaire, accords, ordre, omissions, présentation des symboles et100 exemples de phrases. Les calculs et montants illustratifs ne font pas autorité |
| S4 | `JOURNAL-MODIFICATIONS-DSF-FIGMA-2026-10-05.md` | Journal des opérations et limites ; remplace l’annexe G sur le récit des modifications |
| S5 | `POINTS-A-REINTEGRER-DANS-LA-DOCUMENTATION-2026-10-05(1).md` | Liste de décisions et de conséquences documentaires, avec renvois au journal |
| S6 | `RAPPORT-CORRECTIONS-AUDIT-DSF-2026-10-05.md` | Statuts de correction A01–A15, typographie, registre et mapping partiel des icônes |

Les deux fichiers « POINTS… » ont été comparés : la version `(1)` ajoute principalement les renvois au journal, sans modifier les arbitrages. Ils ne constituent pas deux jeux d’exigences. Le fichier sélectionné sans suffixe n’a pas été modifié. S6, cité dans la demande mais absent des copies jointes, a été récupéré et lu.

Références du dépôt examinées : chapitres 00 à 13, paramètres en modale v12, ancien document de phrase v10.2, PRODUCT, INDEX, README, DSF cartes et séries variables, matrices de couverture et état des lieux du parcours de création. Le document v10.2 est déjà marqué **HISTORIQUE** ; il ne faut pas le réactiver lors de la reprise des formulations du classeur.

### Autorité des sources — clarification validée

- **Spécifications fonctionnelles et décisions validées** : calculs, pauses, côtés, récupération, cadence, progression, états et comportements.
- **Excel v13** : rédaction des phrases, accords, ordre des informations, omissions et présentation des symboles. Sa feuille « Calcul des durées » ne fait pas partie des règles à importer.
- **Figma** : layout et rendu ; ni les chiffres de démonstration ni les interactions de prototype ne définissent les règles métier.
- **Phrase générée** : décrit les paramètres et met en forme le résultat fourni par le calcul spécifié. Elle ne recalcule pas la durée à partir de sa propre grammaire.

## 3. Ce qui est cohérent et directement intégrable

- Cadence facultative, entier de 1 à 60 secondes, exclusivement en Répétitions, sans présélection. Les 2 s/répétition restent une approximation, jamais une cadence créée par migration.
- Propriété de Série, commune dans l’interface de cette version, propagée aux séries variables ; pas d’édition individuelle exposée.
- Chronomètre croissant ; signaux intermédiaires et signal nominal final distinct ; aucun arrêt automatique à la fin nominale. `Suivant` termine normalement la Série, y compris avant la durée prévue.
- Progression temporelle de cadence distincte de l’achèvement ; pause manuelle abandonnant l’intervalle incomplet pour la progression, mais conservant le temps actif réel ; reprise avec intervalle complet.
- Instantané immuable, durée réelle cumulative préservée après réinitialisation, arrière-plan sans rejeu des sons manqués, pause de sécurité adaptée.
- Phrase unique générée à la validation de la feuille, paramètres en gras dans le texte courant ; la zone entière ouvre la feuille, pas des segments interactifs autonomes.
- Les nouvelles sources confirment l’exclusion du compte à rebours propre et de la fin propre du total intrinsèque des paramètres. Ces phases restent dans le plan complet lorsqu’elles sont applicables.
- Rationalisation des couleurs, distinction des deux scrims, Roboto Condensed et décor de barre d’état : décisions à propager sans redessiner les écrans.

L’absence de total d’Exercice en mode À l’échec **n’est pas une contradiction nouvelle** : v12 le prévoit déjà. Il faut distinguer cette omission locale de la borne `≥` d’une Séance comportant du travail non estimable.

## 4. Cohérence : écarts et traitement recommandé

| ID | Constat prouvé / source | Conséquence | Traitement pour la mise à jour |
|---|---|---|---|
| C01 | L’Excel contient des exemples chiffrés et une feuille de calcul descriptive | **Point clos par clarification du propriétaire** : ces éléments n’ont aucune autorité sur les calculs | Conserver v12/D-248 et appliquer l’évolution de Ti définie par S1 ; aucune correction du classeur requise |
| C02 | La première analyse avait demandé de corriger30 totaux et de compléter24 jeux de paramètres | **Exigence retirée** : un recueil de phrases n’a pas à constituer une entrée complète du moteur | Retirer ces tâches et leur caractère bloquant ; ne pas utiliser le CSV de contrôle numérique comme référence de recette |
| C03 | S3 Grammaire ligne16 justifie l’omission des pauses variables par leur présence dans l’énumération, alors que les exemples n’énumèrent que les cibles | Précision rédactionnelle à apporter dans la spécification de phrase, sans reconstruire les données de calcul | Décrire fidèlement les phrases approuvées ; préciser le résumé À l’échec variable à partir de v12 ; ne pas modifier les formules de pauses |
| C04 | S2 et S3 omettent le total dès qu’il y a une seule Série Durée sans côté ; v12 le permet seulement si total=cible | Avec une pause terminale positive, le total ne vaut plus la cible | Omission seulement si redondance réelle : une Série Durée, unilatérale et pause nulle. Avec pause positive, afficher le total |
| C05 | Les exemples bilatéraux du classeur commencent à droite | Le recueil illustre une direction ; il n’a pas à énumérer toutes les combinaisons métier | Formaliser dans la spécification la substitution droite/gauche selon la direction déjà définie ; conserver D-250 à N=1 ; aucun enrichissement préalable du classeur requis |
| C06 | S2 : « plus aucun ≥ dans le fichier » ; S1 maintient ≥ pour une composante non estimable | Risque de supprimer globalement un symbole encore nécessaire | Remplacer ≥ par ≈ uniquement pour les Répétitions non cadencées estimables ; garder ≥ pour les agrégats avec partie non estimable, et l’omission À l’échec au niveau Exercice |
| C07 | S1 emploie « Durée estimée », S2/S3 « Durée totale » | Confusion possible entre nature de la métrique et libellé d’interface | Définir total intrinsèque, total d’occurrence, estimation et durée réalisée séparément. Garder les libellés de l’interface validée ; ajouter un niveau d’incertitude dans le calcul |
| C08 | S5 n°19 / S4 §6 décrivent Valeur modifiable à deux variantes ; S2 ajoute l’axe Normal/Grisé et la quatrième variante de roulette | Inventaire DSF antérieur à la cadence | Documenter les deux axes Texte et État et la roulette avec unité ; relever les variantes réellement présentes avant publication, sans déduire un nombre de variantes uniquement du produit des axes |
| C09 | S5 n°16 annonce encore 50 styles / 350–432–4 variables ; S4 ajoute un style neutre et supprime deux variables observées après l’audit | Comptages successifs présentés comme simultanés | Conserver les chiffres anciens comme mesures datées ; refaire un inventaire ciblé final avant d’écrire les comptes courants |
| C10 | S6 laisse compactCardTitle « à trancher » ; S5 le donne décidé à 15/18. S5 conserve cardTitle=16 mais laisse les cartes 15/16 ouvertes | Les pièces ont des statuts différents ; risque de migration globale erronée | Intégrer compactCardTitle 15/18 comme décision consignée ; garder cardTitle 16 pour son rôle historique et les cartes approuvées 15 avec un rôle distinct, conformément à la recommandation S6. Aucun redessin automatique des cartes |
| C11 | caption cible 11/13, mais S5 porte « valeur à confirmer au plan ». S6 recommande navLabel 13 tout en notant son rôle non vérifié | Une valeur recommandée peut être présentée à tort comme qualifiée | Conserver les statuts ; traiter Auto par rôle, avec exceptions explicites. caption doit être confirmé au plan ; navLabel doit être mesuré avant changement |
| C12 | S5 présente la relation Parcours/Circuit et l’ancien arbre « Un circuit » comme ouverts | Deux questions déjà résolues dans le dépôt | Glossaire §§3/9 : Circuit interne à la Séance, Parcours autonome post-MVP ; D-187/INDEX : arbre de création retiré. Ne pas demander un nouvel arbitrage |
| C13 | S4 §8 et S5 n°4 citent « N circuits » en Composition | Contradiction avec Tour = répétition du Circuit | Conserver « Circuit » comme titre de structure et « N tours » pour sa répétition. Signaler le libellé Figma à corriger si confirmé ; ne pas redéfinir le modèle métier à partir de ce texte |
| C14 | S6 A02 écrit « recréés manuellement » mais §5 et S4 disent encore à recréer ; base retenue 410/285 | Statut d’action ambigu | Consigner « correction manuelle confiée au propriétaire, réalisation non démontrée ». La décision de ne pas bloquer le développement est distincte de la réparation du prototype |
| C15 | S6 dit mapping « prêt » ; son tableau contient des sources « probables » et six rôles sans composant identifié | Le manifeste n’est pas prêt à remplacer mécaniquement | Qualifier les correspondances, tracés et dimensions avant de publier le mapping comme canonique |
| C16 | S2 annonce 30 écrans, puis 31 phrases, 25 modales et 3 créations ; aucune liste exhaustive d’IDs de ces changements | Impossible d’établir le nombre unique de captures à remplacer par addition | Construire l’union des IDs, statuts nouveau/modifié/inchangé et contrats hôtes ; les volumes par opération ne sont pas un inventaire de frames |
| C17 | S2 §8 déclare encore absents trois états cadencés, avec sept écrans d’exécution et trois de synthèse concernés | On ne peut pas annoncer tous les écrans/contrats entièrement matérialisés | Intégrer les règles métier et marquer le layout de ces états « à compléter » ; créer ou confirmer leur présence dans une étape Figma distincte |

### Points d’implémentation à ne pas transformer en décisions produit

S2 demande de résorber le modèle scalaire avant la cadence. C’est une dépendance technique réelle, mais pas l’obligation de lancer une tranche de développement séparée : la planification pourra ordonner les travaux dans un même lot. La documentation cible doit dès maintenant décrire la collection de Séries avec cadence facultative.

Les sons exacts restent hors du document fonctionnel, mais les deux événements sont spécifiés. Leur choix et leur qualification sur appareil restent des tâches d’implémentation/UX audio ; ils ne remettent pas en cause le comportement validé.

## 5. Exploitation du classeur v13 — phrases uniquement

Le classeur comprend100 exemples de phrases. La vérification pertinente porte sur leur expression et sur la transposition de leurs règles rédactionnelles dans la documentation.

| Élément à reprendre | Travail documentaire |
|---|---|
| Ordre des informations | Nombre de Séries → contenu/cible et cadence éventuelle → pause selon le contexte → côtés → phrase de durée lorsqu’applicable |
| Accords | Série/séries, répétition/répétitions, menée/menées, séparée/séparées ; formaliser les cas singuliers sans réclamer un exemple Excel pour chacun |
| Cadence | Suffixe « cadencées toutes les… » accolé aux répétitions, seulement lorsque la cadence est renseignée |
| Séries variables | Énumération jusqu’à trois valeurs, puis plage min/max ; préciser la ponctuation des cas à une/deux/trois valeurs |
| Côtés | Formulations distinctes pour une Série, alternance par Série et un côté après l’autre ; adapter droite/gauche à la direction du paramètre |
| Omissions | Absence de « sans changement de côté », durée omise À l’échec au niveau Exercice, condition de redondance à expliciter (C04) |
| Durée et symbole | Mettre en forme le total et son niveau d’incertitude fournis selon la spécification ; aucun calcul métier défini par le classeur |
| Présentation | Texte unique ; paramètres en gras ; ponctuation et unités homogènes ; aucune interaction par segment |

Les100 longueurs de la colonne « Car. » ont été vérifiées ; le maximum observé est211 caractères (cas62). Cela fournit un exemple d’encombrement, **pas une limite fonctionnelle de longueur ni une preuve de couverture exhaustive**.

La spécification de phrase doit préciser ses entrées : paramètres utiles au texte et résultat du calcul applicable, comprenant le total et son niveau d’incertitude. Le résultat peut être absent selon le mode et le contexte. Les tests de formulation pourront injecter un total fourni et vérifier sa mise en forme, sans recalculer la durée dans le générateur de phrase.

### Calculs et comportements : référence séparée

La documentation de calcul conserve les formules v12/D-248, modifiées seulement sur Ti par la conception Cadence : Ti=Ri×Ci avec cadence, Ti≈2×Ri sans cadence. Les tests du moteur, de Pause/Reprise, des réinitialisations et des agrégats proviennent de ces spécifications. Ils ne sont ni déduits des nombres de l’Excel ni exigés comme nouvelles lignes de ce classeur.

**Aucun recalcul, enrichissement numérique ou transformation du classeur en modélisateur n’est prévu par ce plan.** Les exemples du classeur servent à la rédaction ; tout exemple chiffré normatif ajouté dans les chapitres métier est établi à partir des spécifications.

## 6. Inventaire des mises à jour documentaires

Les noms ci-dessous sont ceux du dépôt contrôlé. « Mise à jour » signifie un changement ciblé dans le passage concerné, pas une réécriture du chapitre.

| Document / emplacement | Mise à jour attendue | Critère de clôture |
|---|---|---|
| `docs/PRODUCT.md` | Présenter la cadence optionnelle et la nouvelle phrase ; distinguer cible documentaire et fonctionnalités déjà livrées ; corriger estimations et renvois | Aucun engagement implicite de livraison ni règle héritée contradictoire |
| `docs/INDEX.md`, `docs/README.md` | Référencer les sources actives, le classeur comme référence rédactionnelle et les matrices ; supprimer les désignations actives résiduelles de v10.2 ; actualiser la liste des contrats jusqu’à CE-UI-10 | Une chaîne de lecture active unique ; archives clairement historiques |
| `00 – Glossaire.md` | Cadence, intervalle, fin nominale, temps actif cumulé, durée déterminable/approximative/non estimable ; préserver Circuit/Tour/Parcours | Concepts distincts, sans créer une entité Répétition |
| `01 – Vision Générale.md` | Cadence comme option du mode Répétitions et guidance sonore | Trois modes conservés ; pas de comptage physique automatique |
| `02 – Utilisateurs et besoins.md` | Besoin de rythme reproductible et guidage pour entraînement/rééducation ; limites de mesure | Besoin relié aux fonctions décrites, sans promesse de détection |
| `03 – Parcours utilisateur.md` | Paramétrage facultatif, suppression, validation, exécution cadencée, pause/reprise et retour synthèse | Parcours direct et Séance couverts ; aucun nouveau parcours Profil |
| `04 – Modèle fonctionnel.md` | Cadence portée par Série ; uniforme/variable ; progression distincte de fin métier ; durée réelle cumulée | Même modèle que09/11 ; pas de surcharge commune persistée concurrente |
| `05 – Versions du produit.md` | Positionner l’évolution et les dépendances dans la cible, avec statut prévu | Ne pas marquer Cadence ou modèle variable « implémentés » sur seule foi des maquettes |
| `06 – Ecrans et navigation de la V1.md` | Recenser nouvelles frames13/14/phrase longue, ligne Cadence, nouveaux symboles, phrase unique, séparateurs, écrans indirectement affectés par DSF ; renouveler les images | Captures centralisées ici ; chaque ID présent ou explicitement manquant ; aucune galerie vide |
| `07 – Registre des décisions de conception.md` | Transcrire CAD-01…30 ; nouvelles décisions DSF/phrase ; amender les règles supersédées (D-080/111, D-133/241, D-232/253 selon portée), conserver D-248 | IDs attribués après vérification du dernier ID, sans collision ; liens précis vers les décisions remplacées |
| `08 – Conception fonctionnelle détaillée.md` | Calculs, édition transactionnelle, générateur, audio, exécution, sécurité, résultats ; actualiser tableaux de champs et règles dupliquées | Même traitement de la cadence dans le texte, tableaux et annexes |
| `09 – Modèle de données fonctionnel.md` | `repetitionIntervalSeconds?` par Série, valeurs communes de l’édition uniforme, instantanés, données de temps réel ; défaut null des objets existants | Historique immuable ; duplication/copie/migration décrites ; ni cadence2 s implicite ni nouvelle entité Répétition |
| `10 – Processus métier et règles métier transverses.md` | Réviser RM-058,068/069,072,112,129/132,232 et règles liées ; ajouter événements et exception Pause/Reprise | Retirer les contradictions « aucune estimation » / « 2 s » ; trois niveaux d’incertitude et périmètres explicites |
| `11 – API fonctionnelles.md` | Validation cadence, édition commune, calcul avec niveau d’incertitude, instantané, état de cadence, résultats | Contrats entrée/sortie, erreurs et compatibilité ; pas seulement ajout d’un champ |
| `12 – Architecture technique.md` | Séparer durée déterminable et fin automatique ; ordonnancement par ancres, accumulateur réel, reprise et version d’instantané ; tokens/polices/composants/assets | Cible technique cohérente avec09/11 ; limites mobiles à qualifier explicites |
| `13 – Contrats d’écran.md` | Mise à jour ciblée des familles listées §7 ; règles communes de durée/progression et DSF ; nouvelles références Figma | Les 21 rubriques de chaque contrat concerné restent complètes et alignées ; aucune image ajoutée ici |
| `SPECIFICATION-PARAMETRES-MODALE-v12.md` | Préparer une révision active explicitement supersédante pour Cadence, nouvelles phrases, symboles et contrôles ; préserver pauses, normalisation et brouillon | Pas de modification silencieuse du sens de v12 ; ancien état traçable ; nouveau numéro distinct de la version du classeur |
| `SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v10.2.md` | Garder historique ; ajouter seulement le renvoi approprié si nécessaire | Ne pas importer ses anciennes formules ni rétablir ses segments éditables |
| Nouvelle spécification active de phrase / annexe normative liée aux paramètres | Formaliser les formulations S3, accords, gras, ponctuation, omissions, min/max, direction et génération ; expliciter les seules précisions rédactionnelles nécessaires | Une seule fonction conceptuelle, alimentée par les paramètres ; aucune phrase stockée comme vérité indépendante |
| Classeur v13 — référence rédactionnelle | Référencer les exemples sans modifier le classeur ; en dériver les règles et cas de formulation dans la spécification de phrase | Phrase fidèle aux paramètres ; total fourni par le calcul spécifié correctement mis en forme ; aucune validation numérique du classeur exigée |
| `docs/DSF-SERIES-VARIABLES-2026-10-02.md` | Ligne commune Cadence et contrôles, tableau variable, déplacement d’une ligne avec toutes ses propriétés, états inactifs | Alignement de la révision documentaire avec le DSF courant |
| `docs/DSF-CARTES-ICONES-APPUIS-2026-09-30.md` | Tokens de surfaces/neutres, titres par rôle, symboles de durée, nouveaux assets ; conserver règles média Séance/Exercice/listes mixtes | Aucun changement de comportement média introduit par la cadence |
| Documentation DSF transverse | Roulettes, Valeur modifiable, Tri, en-têtes/Safe Areas, décor statut, destructif, opacités ; réserves et archives | Tables de rôles et valeurs actuelles ; sources mesurées et datées |
| `docs/MATRICE-COUVERTURE-FIGMA-CHAPITRE-06.md` | Union des frames modifiées/créées et contrats correspondants ; état des captures | Chaque frame reliée à une section06, une capture et un contrat13, ou manque explicite |
| `docs/MATRICE-SERIES-VARIABLES-2026-10-02.md`, état des lieux de création du03/10 | Ajouter les états de cadence et les nouveaux composants ; remplacer références périmées | Distinction nouveau/remplacé/retiré/absent, sans inventer d’ID |
| `docs/MATRICE-ECRANS-CARTES-2026-09-30.md` et matrices actives de durée/récupération | Contrôle de propagation des symboles et renvois aux formules ; ne modifier que les versions actives | Pas de réécriture des preuves historiques ni des archives |
| Registre des assets / `assets/icons/manifest.json` | Préparer mapping validé, dimensions, sources et exports nécessaires | Une modification d’asset est un lot ultérieur explicite ; aucune source « probable » publiée comme certaine |

Le chapitre12 a également des tableaux historiques qui disent encore « non relié aux variables » ; les remplacer par un inventaire daté et ses limites. Les commentaires de `tokens.ts`, le chargement des polices et `ProfileStepper.tsx` sont des dépendances de l’alignement du code : les recenser dans le plan de développement, sans prétendre les corriger par une PR documentaire.

## 7. Contrats d’écran : portée précise

Le fichier actuel contient **30 contrats avec les 21 titres de rubriques chacun** (contrôle structurel réalisé). Cela ne certifie pas le contenu après évolution. Il faut examiner toutes les rubriques de chaque contrat affecté, même lorsque la modification principale est localisée.

| Famille | Contrats à revoir | Contenu à transmettre au développement |
|---|---|---|
| Création et paramètres | CE-T03-04, CE-UI-10 | Position de Cadence, visibilité, Aucune, ouverture/fermeture de roulette, plage1..60, suppression, gras de phrase, feuille transactionnelle, propagation aux Séries variables, validation et erreurs |
| Catalogue / sélection / composition | CE-T03-01/02/06/07/08 ; contrôle contextuel de CE-T03-03 | Total intrinsèque vs occurrence, symboles, cartes et titres, direction/ordre ; aucun détail variable supplémentaire dans les lignes compactes ; pas de retour à l’arbre de création supprimé |
| Exécution directe | CE-T03-09/10/11/12/13 | Conditions d’entrée, série cadencée active avant/après fin nominale, Pause/Reprise, Suivant, reset par périmètre, signaux et chronométrage réel |
| Exécution de Séance | CE-EXEC-SESSION-01, règles communes §4.12 et R-01 | Même cadence par occurrence/côté/Tour ; pondération d’une Série à durée prévisionnelle déterminable sans transition automatique ; fin globale distincte des100 % nominaux d’une Série |
| Média pendant exécution | CE-MEDIA-EXEC-01/02 | Continuité du temps et de la cadence pendant changement de face/plein écran, audio selon règles existantes ; éviter pause implicite |
| Synthèse et suivi | CE-T03-14/15, CE-UI-08 | Cadence prescrite de l’instantané, durée réelle cumulative, côté, aucune déduction du nombre de répétitions accomplies |
| Calendrier et planification | CE-UI-02/03/04/05 | Propagation des niveaux d’estimation et périmètre ACTIVITY/SESSION, sans nouvelle formule locale |
| Profil / navigation | CE-UI-01/07, CE-T03-17 | Aucune nouvelle préférence Cadence ; polices et icônes concernées, Safe Areas, barre d’état décorative |
| Référentiels / confirmations | CE-T03-05/16, CE-UI-09 et confirmations embarquées | Rouge danger, textes/dimensions par rôle ; dix zones initiales et Fessier comme exemple utilisateur, pas onzième valeur obligatoire |

### Granularité attendue

Le contrat doit préciser pour chaque contrôle concerné : parent et ordre, alignement/indentation, largeur adaptable et comportement en scroll, état visible/masqué/inactif, valeur et source, interaction, validation, effet sur le brouillon et sur la persistance, accessibilité et recette. Les valeurs de layout déclarées dans S2 (indentation x52, séparateurs314, phrase largeur324 et interligne20) doivent être contextualisées à la frame de référence, pas transformées en coordonnées absolues de tous les appareils.

Pour la nouvelle roulette1..60, le moyen de revenir à « Aucune » n’est pas décrit suffisamment précisément dans les pièces. Il faut retrouver son interaction dans Figma et la renseigner dans CE-UI-10 ; la possibilité fonctionnelle de supprimer est déjà décidée. Ne pas fabriquer un contrôle supplémentaire si cette interaction existe.

Les trois états d’exécution manquants déclarés par S2 ne nécessitent pas automatiquement trois nouveaux contrats : commencer par étendre les états des contrats hôtes. Leur absence visuelle doit rester visible dans la matrice jusqu’à matérialisation.

## 8. Plan ordonné et critères de sortie

| Étape | Travail | Livrable / sortie | Dépendances et limites |
|---:|---|---|---|
| 1 | Revalider main et les changements locaux ; figer les sources et comparer leurs versions ; consigner les décisions déjà closes | Matrice source→règle→document, baseline exacte, source active unique | Aucun écrasement de travaux locaux ; S5(1) fait doublon enrichi, pas nouvelle conception |
| 2 | Formaliser les phrases à partir de l’Excel et du dossier ; préciser accords, omissions, direction, symboles et contrat d’entrée du générateur | Spécification rédactionnelle active, exemples de phrases et renvois au calcul normatif | Aucun recalcul ni enrichissement numérique de l’Excel ; les règles métier restent dans les spécifications |
| 3 | Propager métier, données, API, exécution et décisions | Chapitres00–05,07–11 et parties fonctionnelles12/13 cohérents ; nouvelle référence des paramètres/phrase | Aucune nouvelle cadence par défaut ; pas de modification des pauses ; historique conservé |
| 4 | Relever les IDs courants Figma, rapprocher les changements DSF et inventorier les captures ; mettre à jour06 et contrats13 | Matrice frame→capture→contrat ; nouvelles captures centralisées06 ; contrats21 rubriques | Les états déclarés absents restent à matérialiser avant clôture graphique complète |
| 5 | Consolider DSF/typographie/assets et documents supports | Chapitre12, DSF et mapping ; statuts A01–A15 actualisés avec provenance | Réexport et code dans leur lot dédié ; caption/roles non mesurés qualifiés avant migration ; aucune suppression massive |
| 6 | Relecture transverse et clôture documentaire | Rapport de modifications, incohérences résiduelles, liens/images contrôlés, statut documentaire exact | Ne pas certifier comportement mobile, implémentation ou indépendance à partir des documents |

**Recommandation :** une branche documentaire cohérente, avec lots de commits séparant règles/phrases, écrans/contrats et DSF. Les références croisées sont validées avant fusion. Les changements de code et les exports d’assets à qualification incomplète ne doivent pas être mêlés silencieusement à cette mise à jour.

L’intégration documentaire peut démarrer immédiatement sur les règles et formulations établies, pendant les vérifications ciblées de références et d’états visuels. En revanche, la clôture « documentation complète et alignée » exige que les manques soient effectivement résolus, et pas seulement déplacés dans une annexe.

## 9. Vérifications de clôture prévues

1. Vérification des formulations : paramètres décrits correctement, accords, ordre, omissions et mise en forme du total/symbole fournis selon les spécifications. Vérification séparée de la cohérence des formules dans les chapitres métier ; aucune qualification numérique de l’Excel exigée.
2. Recherche des anciennes règles dans les documents actifs : ≥ systématique, bip minute pour toutes les Répétitions, reprise exacte sans exception, sécurité2 h pour toute Répétition, validation seule pour toute progression. Chaque occurrence est évaluée dans son contexte ; ne pas supprimer celles encore valides pour les non-cadencées.
3. Contrôle de toutes les21 rubriques des contrats concernés et des renvois aux décisions/règles/API/données ; présence de recettes avant/après fin nominale et après pause/reset.
4. Inventaire des captures par ID unique, fichier présent et rendu lisible ; lien depuis06 et renvoi depuis13. Pas de galerie exhaustive déclarée complète sans fichiers.
5. Inventaire DSF final daté ; pas de métrique d’audit ancienne présentée comme mesure après corrections ; conservation des exceptions volontaires.
6. Conservation des règles cartes (Séances sans photo, listes mixtes sans photo), Circuit/Tour/Parcours, pauses et récupération ; aucune règle nouvelle tirée d’un chiffre ou d’un clic Figma.
7. Diff final limité aux documents/artefacts autorisés ; distinction explicite « règle validée », « Figma matérialisé », « code livré », « testé sur appareil ».

## 10. Éléments restant à obtenir ou qualifier

- Interaction visuelle exacte de suppression de cadence et présence actuelle des trois états d’exécution annoncés absents.
- Confirmation de caption11/13 conformément au statut de S5 ; mesures de rôles typographiques encore non qualifiés. Les décisions compactCardTitle15/18 et cardTitle16 ne sont pas à reposer.
- Identification des six rôles d’icônes sans source actuelle établie et comparaison des tracés/dimensions.
- Preuve de recréation des interactions et version Figma nommée, si elles sont exigées pour la qualification finale ; elles ne sont pas des règles de calcul.
- Rapprochement des éventuels fichiers locaux de spécification non publiés avant la première écriture.

Il n’est pas nécessaire de demander à nouveau si Parcours et Circuit sont différents, ni de redessiner les cartes ou de rouvrir les pauses. Les références existantes apportent déjà ces réponses.

## 11. Historique de cette révision

Révision2 : clarification du propriétaire du6 octobre2026 intégrée dans la conclusion, l’autorité des sources, C01/C02/C03/C05, l’exploitation du classeur, l’inventaire, les étapes et les critères de clôture. Suppression des tâches de correction/recalcul de l’Excel et de complétion des paramètres variables. Le CSV numérique précédemment livré est retiré du plan. Les autres travaux documentaires et les vérifications Figma ciblées restent conservés.

**Statut : analyse et plan prêts pour démarrer la mise à jour documentaire.** Cette révision met à jour le plan uniquement ; les spécifications du dépôt restent à modifier selon les étapes ci-dessus.

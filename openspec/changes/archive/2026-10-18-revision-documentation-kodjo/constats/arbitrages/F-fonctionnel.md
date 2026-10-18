# Arbitrages fonctionnels Q-E à Q-L : réexamen (lecture seule)

Base : `main` 6656fefc (les fichiers `docs/` de la branche `docs/openspec-revision`, HEAD e8fa0910, sont identiques : `git diff --stat 6656fefc HEAD -- docs` est vide). Abréviations : `chNN` = `docs/Specifications-fonctionnelles/NN – ….md` ; `pre4-r2` = `scratchpad/pre4-bmad-questions-ouvertes-r2.md` ; `SPEC-FMT`, `SPEC-CIR`, `SPEC-2M`, `SPEC-v13` = `git show 7a89220f^:docs/Specifications-fonctionnelles/SPECIFICATION-{FORMATS-SEANCES-2026-10-14, CIRCUITS-TOURS-SERIES-2026-10-12, DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13, PARAMETRES-MODALE-v13}.md`.

**Portée des décisions pre4-r2.** Le fichier s'intitule « PRE-4 BMAD — questions, contradictions et hypothèses » (pre4-r2:1). Une seule décision déclare une portée plus large : Q19, « Décision pour la phase projet, commune aux versions PRE-4 BMAD et VNext » (pre4-r2:Q19). Aucune autre ne dit si elle vaut au-delà de PRE-4. Deux indices vont dans ce sens sans le dire : Q8 nomme les passages généraux qu'elle « remplace » (ch13 l. 125, D-219…), et le rapport de PR #371 indique « Validation propriétaire du 16 octobre 2026 » pour Q11–Q18 (pr371.diff:9). Dans la suite, une décision Qxx autre que Q19 est donc lue comme une décision PRE-4, sans extension implicite.

## Tableau récapitulatif

| ID | Décision attendue | Classement | Preuve principale | Question résiduelle |
|---|---|---|---|---|
| Q-E | Médias consultables pendant l'Exécution : MVP ou non | RÉSOLUE_PAR_SOURCES (à reporter) | D-203, « périmètre MVP confirmé le 28/09/2026 » (ch07:259) ; deux phrases antérieures restées en place (ch01:155, ch10:250) | Aucune. L'affectation à une tranche relève de Q-D |
| Q-F | Prédicat du statut de Séance `Partielle` | ARBITRAGE_PRODUIT (restreint) | Statut d'Exercice fixé (D-053, RM-060, D-150) ; deux définitions de Séance d'origine (07/08), jamais arbitrées (ch08:996, ch08:1386) | Une Séance est-elle `Partielle` si et seulement si au moins un Résultat d'Exercice est `Partielle` ? Une récupération écourtée (RM-065a) compte-t-elle ? |
| Q-G | Suppression d'une Séance active | RÉSOLUE_PAR_SOURCES (à reporter) | RM-007 (ch10:19), D-121 (ch07:153), ch08:1492 et 1741 ; ch08 §2.5 date du 07/08 | Aucune |
| Q-H (a) | Persistance de la Composition | RÉSOLUE_PAR_SOURCES (à reporter) | ch06:329 ; CE-T03-08 §15 (ch13:988) ; D-123 ; P8 | Aucune |
| Q-H (b) | Séance avec un Exercice valide et un invalide : enregistrable, exécutable ? | ARBITRAGE_PRODUIT | RM-017 n'exige qu'un Exercice valide ; ch08:352 refuse l'exécution d'une « séance incomplète » ; H29 (hypothèse, d'après le code) refuse `Continuer` | Q fermée au §Q-H |
| Q-I | Statut visible d'un Death by à achèvement incomplet | ARBITRAGE_PRODUIT, différable | SPEC-FMT et D-365 renvoient la conception du Suivi à plus tard ; RM-081 laisse le raccordement « à qualifier » | Quel libellé dans le Suivi et la Synthèse ? Peut attendre la planification de Formats |
| Q-J | Mesure affichée sous le titre du Circuit | ARBITRAGE_PRODUIT | D-100 et D-131 (somme des Exercices de la Séance) contre SPEC-CIR §5.2 et ch10:684 (agrégat du Circuit) | Circuit seul, ou tous les Exercices de la Séance ? |
| Q-K (a) | Valeur héritée hors bornes non modifiée : valide pour ✓, `Terminer`, API-PARAM-01 ? | ARBITRAGE_PRODUIT (confirmer H25) | Q15 règle l'affichage et le calcul seulement ; H25 et P44 reposent sur une hypothèse ; la lettre de ch13:4100 et API-PARAM-01 refuse | Confirmer H25, avec sa portée |
| Q-K (b) | Ligne Total pendant une cible à renseigner : « — » ou absente | ARBITRAGE_PRODUIT | ch06:1119 et ch08:1565 (« — si incomplet », depuis le 03/10) contre H10 (hypothèse) | « — » ou absence ? Et en uniforme ? |
| Q-L | Intégration de Q8, Q19–Q26 ; corrections X-06 et X-07 ; ordre avec #370 et #371 | X-06 et X-07 : RÉSOLUES_PAR_SOURCES ; ordre : RECOMMANDATION_DOCUMENTAIRE ; portée de Q8 et Q20–Q26 : ARBITRAGE_PRODUIT (gouvernance) | Q18 et Q8 verbatim (pre4-r2) ; pr371.diff:127, 197, 166 ; fusion d'essai : les trois PR entrent en conflit au ch06 l. 1162 | Q8 et Q20–Q26 entrent-elles dans la doc générale ? |

---

## Q-E — Médias pendant l'Exécution

1. **Décision attendue.** La consultation des médias pendant l'Exécution fait-elle partie du MVP ?
2. **Sources qui répondent.**
   - `ch07:259` (D-203, statut) : « Validée — 25/09/2026 ; périmètre MVP confirmé le 28/09/2026 ». Corps : « Les états de consultation média représentés par `4997:6113` et `5009:6069` sont inclus au MVP (confirmation du 28/09/2026). »
   - `ch05:242` : « La consultation des médias pendant l'Exécution fait partie du MVP, conformément à la confirmation du 28/09/2026 (D-203 […]) ».
   - `docs/CONCEPTION-EXECUTION-MEDIA.md:7` : « Statut produit : **consultation des médias pendant l'Exécution incluse au MVP** ».
   - `ch09:469` : « consultation des médias pendant l'Exécution incluse au MVP ».
   - `ch01:153` : « Le MVP permet de consulter les médias de l'Exercice sans quitter l'Exécution ni interrompre son moteur. »
   - D-333 (`ch07:539`) inclut aussi l'import au MVP et le livre « dans PRE-3, avant le moteur d'exécution qui utilise ces médias ». D-334 et D-335 (photothèque seule, modalités d'import ; `docs/preparation/PRE-3/planification/plan-technique-travail.md:64-70`) portent sur l'import, pas sur la consultation, et ne figurent pas au ch07 (voir Q-M).
3. **Sources contraires** (deux résidus antérieurs à la confirmation) :
   - `ch01:155` : « Cette cible est conçue mais n'est pas ajoutée au périmètre MVP courant sans décision de roadmap distincte. »
   - `ch10:250` (fin de RM-203, non relevée dans P-05) : « Ces règles décrivent une conception post-MVP à planifier. »
   - Historique Git : les deux phrases viennent de fd30978a (25/09). Le commit fd9555bc (30/09), qui reporte la confirmation du 28/09, a réécrit ch01:153 (« La cible post-MVP permet… » devient « Le MVP permet… ») et CONCEPTION-EXECUTION-MEDIA, mais a laissé ch01:155 et ch10:250. Ce sont des oublis, pas une seconde décision.
4. **Classement : RÉSOLUE_PAR_SOURCES**, par D-203 et la confirmation du 28/09/2026. Il reste à supprimer ch01:155 et la dernière phrase de ch10:250, ou à les remplacer par un renvoi à D-203. Distinction à garder : le périmètre MVP est fixé, la tranche de livraison ne l'est pas (`CONCEPTION-EXECUTION-MEDIA.md:150` : « L'affectation à une tranche de réalisation reste distincte du périmètre MVP confirmé »). Cette tranche relève de Q-D. PRE-3 n'a pas de lecteur en exécution (`docs/preparation/PRE-3/planification/plancontract-publie.md:24` : « Aucun lecteur en exécution ni moteur sonore »), ce qui n'est pas contradictoire.
5. —
6. **Dépendances.** Q-D (tranche), Q-M (D-334 et D-335 absentes du registre). ch01 et ch10 sont `[PRE4]`. Aucune PR ne touche ces lignes.
7. **Certitude : élevée.**

## Q-F — Statut `Partielle`

1. **Décision attendue.** Quel événement rend une Séance `Partielle` ?
2. **Sources qui répondent (niveau Exercice, non contredites).**
   - `ch07:84` (D-053) : « Un Exercice chronométré passée avant son terme via `Exercice suivant` est enregistrée avec le statut métier **Partielle** ». Repris par RM-060 (`ch10:112`) et `ch06:1860`.
   - `ch07:182` (D-150) : « Depuis le premier côté, confirmer enregistre ce côté comme partiel ».
   - `ch04:358` : « au moins un résultat partiel ou un côté manquant après avancement produit `Partielle` ».
   - `ch08:919` : Suivant en Répétitions ou À l'échec « ne crée pas de statut Partielle ». `ch13:1282` : « Suivant anticipé en cadence […] sans confirmation ni Partielle due à la durée ».
   - `ch06:2037` (niveau Séance) : « peut être `Terminée` ou `Partielle` selon les Exercices réellement réalisés ».
3. **Sources contraires (niveau Séance).**
   - `ch08:996` et `ch03:288` : « au moins un Exercice a été interrompue ou ignorée ».
   - `ch08:1386` : « au moins un exercice chronométré a été interrompue avant la fin de sa durée ».
   - `ch03:271` : « ignorer un exercice » ; cette action n'existe pas dans ch08 §4.5, et RM-063 (`ch10:115`) exclut toute sélection libre.
   - `ch10:118` (RM-065a) : une récupération écourtée enregistre « la durée partielle de la phase courante », sans dire si la Séance devient `Partielle`.
   - Historique : les deux grilles de Séance figurent dans le texte initial (2fd478a1, 07/08). fd9555bc n'a fait que remplacer « activité » par « exercice ». Aucune décision D-xxx ne les arbitre.
4. **Classement : ARBITRAGE_PRODUIT, sur un point restreint.** Le statut d'Exercice est fixé. Il manque la règle de dérivation au niveau Séance et le sort de la récupération écourtée. « Ignorée » ne correspond à aucun événement défini.
5. **Question fermée.** « Une Séance dont `SESSION_END` est achevée est `Partielle` si et seulement si au moins un Résultat d'Exercice est `Partielle` (D-053, D-150) ; une récupération écourtée (RM-065a) ne la rend pas `Partielle` ; l'action « ignorer un exercice » est retirée du ch03. Oui / Non (préciser) ? »
   - Option A, dérivée des résultats d'Exercice : ch06:2037, ch04:358, D-053, D-150.
   - Option B, récupération écourtée comprise : lecture large de ch08:996 (« interrompue »).
   - *Recommandation (proposition, pas une règle) :* option A. C'est la seule qui s'appuie sur des décisions validées, et ch13:1282 montre déjà qu'un passage anticipé ne suffit pas.
6. **Dépendances.** Lien avec Q-I : le Death by incomplet est un axe à part, pas un cas de `Partielle`. ch03, ch08 et ch10 sont `[PRE4]`. Aucune PR.
7. **Certitude** : élevée sur le constat, moyenne sur la recommandation.

## Q-G — Suppression d'une Séance

1. **Décision attendue.** Une Séance active se supprime-t-elle directement, ou seulement après archivage ?
2. **Sources qui répondent.**
   - `ch10:19` (RM-007) : « Une Séance active ne peut pas être supprimée. Elle doit d'abord être archivée, puis supprimée depuis le résultat du filtre `Archivées`. »
   - `ch07:153` (D-121, Validée) : « La suppression définitive n'est proposée que depuis les archives ».
   - `ch08:1492` : « Supprimer | Disponible uniquement après archivage. » `ch08:1741` : « disponible uniquement via le filtre `Archivées` ».
   - RM-008 et RM-011 (`ch10:20`, `ch10:23`) : les Routines sont supprimées à l'archivage ; la suppression définitive conserve les Exécutions.
3. **Sources contraires.** `ch08:129` : « Une séance peut être supprimée depuis le catalogue. » ; `ch08:135` : « La suppression d'une séance entraîne également la suppression de toutes les routines qui lui sont associées. » Les deux datent du texte initial (2fd478a1, 07/08). RM-007 date du 25/08 (6ba86ad6).
4. **Classement : RÉSOLUE_PAR_SOURCES** (RM-007 et D-121, décision validée). Il reste à réécrire ch08 §2.5 en renvoi vers RM-007, RM-008 et RM-011. La note de `ch08:3`, qui déclare non défini le cas des Routines à plusieurs contenus, est un sujet distinct.
5. —
6. **Dépendances.** ch08 est `[PRE4]`. Aucune PR.
7. **Certitude : élevée.**

## Q-H — Composition : persistance ; exercice invalide

### (a) Enregistrement automatique ou `Continuer`
1. **Décision attendue.** Les modifications de Composition sont-elles persistées au fil de l'eau, ou seulement à `Continuer` ?
2. **Sources qui répondent.**
   - `ch06:329` : « la Composition conserve toujours un brouillon jusqu'à `Continuer` (CE-T03-08) ».
   - `ch13:988` : « Confirmer applique atomiquement au parent, Continuer seul persiste Session+Composition. »
   - `ch07:155` (D-123) : l'action finale porte toujours le libellé `Continuer`.
   - P8 (pre4-r2) : « persisté au `Continuer` de Composition (ch. 06 l. 329, ch. 13 l. 988) ».
3. **Source contraire.** `ch08:403` : « les modifications sont enregistrées automatiquement ; » (texte initial, 65a1392c du 06/08 et 2fd478a1).
4. **Classement : RÉSOLUE_PAR_SOURCES.** Il reste à corriger la puce de ch08:403.

### (b) Séance contenant un Exercice invalide
1. **Décision attendue.** Une Séance qui contient au moins un Exercice valide et un Exercice invalide (cible à renseigner, par exemple) peut-elle être enregistrée ? Peut-elle être exécutée ?
2. **Sources qui répondent en partie.**
   - `ch10:34` (RM-017) : « `Continuer` reste désactivé tant que le nom est vide ou qu'aucun Exercice valide n'est présent. » Même règle en `ch13:982`, `ch06:870` et `ch03:118`.
   - `ch06:874` : « La Séance n'est exécutable que si elle contient au moins un Exercice valide. » Même règle en `ch09:296` et `ch08:1513`.
   - Lues à la lettre, ces règles permettent d'enregistrer et d'exécuter une Séance mixte. Le sort de l'Exercice invalide pendant l'Exécution (sauté ? bloquant ?) n'est écrit nulle part.
3. **Sources contraires.**
   - `ch08:352` : « Une séance incomplète peut être enregistrée mais ne peut pas être exécutée. » `ch13:275` : « Les objets historiques incomplets restent consultables mais Démarrer est désactivé tant qu'ils ne sont pas exécutables. »
   - H29 (pre4-r2, hypothèse, citant `validation.ts:586-597`) : « `Continuer` refuse tant que la Cible n'est pas renseignée ». H29 cite le code et n'en tire pas une règle.
   - `ch08:350` (« Les exercices incomplètes sont signalées ») heurte `ch08:490` et CIR-09 (« aucun marqueur d'incomplétude », `ch07:597`).
4. **Classement : ARBITRAGE_PRODUIT.** Trois lectures sont possibles, et aucune décision ne tranche.
5. **Question fermée.** « Une Séance dont au moins un Exercice a une Cible à renseigner : (A) s'enregistre et s'exécute en sautant cet Exercice ; (B) s'enregistre mais ne s'exécute pas (ch08:352) ; (C) ne s'enregistre pas, `Continuer` étant désactivé (H29) ? »
   - *Recommandation (proposition) :* (C) ou (B). Ce sont les seules lectures sans comportement d'exécution à inventer. (C) prolonge le comportement PRE-3 décrit par H29 et ne change rien pour PRE-4.
6. **Dépendances.** Le cas ne se produit en pratique qu'avec des données migrées (H28, H29, H30 ; Q19). ch08, ch10 et ch13 sont `[PRE4]`. Aucune PR.
7. **Certitude** : élevée pour (a), élevée sur le constat de (b).

## Q-I — Death by « incomplet »

1. **Décision attendue.** Quel statut l'utilisateur voit-il dans le Suivi et la Synthèse pour un Death by clos par « Limite atteinte » ou « Abandonner » ?
2. **Ce que disent les sources.**
   - SPEC-FMT:167 (FMT-38) : « Dans les deux cas, l'état d'achèvement reste **incomplet** ». Repris en D-368 (`ch07:629`), `ch01:446`, `ch09:1214` et `ch13:4051`.
   - SPEC-FMT:55 (DEC-09) et D-365 (`ch07:626`) : « conception reportée au Suivi ». SPEC-FMT:237 : « Suivi | Conserver le résultat et ses conditions | Conception des rapports reportée ». SPEC-FMT:221 : « Historique / synthèse | Paramètres effectifs, résultat et motif ».
   - `ch09:1218` : l'état « incomplet » n'est pas converti en Terminée ou Interrompue ; le schéma doit conserver « les trois axes motif/résultat/achèvement ». `ch13:2771` : « La représentation visuelle de ce résultat reste à illustrer ».
   - Les REC-23 et REC-24 de SPEC-FMT §11 (l. 270-271) vérifient le motif et l'état incomplet, pas un libellé de statut. Aucune réponse n'existait avant la consolidation.
3. **Sources contraires ou incomplètes.** `ch10:154` (RM-081) : « son mapping physique reste à qualifier. Le Suivi conserve les Exécutions `Terminées`, `Partielles` et `Interrompues`. » `ch08:1642-1643` : seuls ces trois statuts sont affichés.
4. **Classement : ARBITRAGE_PRODUIT, différé explicitement par D-365.** Ce n'est pas une contradiction : les sources interdisent tout mapping implicite et renvoient la décision à plus tard.
5. **Question fermée.** « Pour un Death by clos (limite ou abandon), la carte du Suivi et la Synthèse affichent : (A) un des trois statuts existants, lequel, avec le motif à côté ; (B) un quatrième libellé, par exemple « Incomplet » ; (C) décision différée à la planification de Formats (D-365) ? »
   - *Recommandation (proposition) :* (C). Formats ne figure ni dans PRE-4 (Q4) ni dans aucune tranche (Q-D). Seul le libellé trompeur « mapping physique » de RM-081 serait à corriger dès maintenant : c'est une question produit d'affichage, pas un sujet technique.
6. **Dépendances.** Q-D (version de Formats), Q-F. Aucun effet sur PRE-4.
7. **Certitude : élevée.**

## Q-J — Montant de l'en-tête du Circuit

1. **Décision attendue.** La durée affichée sous le titre Circuit porte-t-elle sur le Circuit seul, ou sur tous les Exercices de la Séance ?
2. **Lecture « Séance ».**
   - `ch07:132` (D-100, « Validée post-Figma ») : « la synthèse calculée `N exercice(s) · X min` est intégrée au conteneur Circuit […] Elle compte et totalise exclusivement les Exercices ; le Compte à rebours initial et la Fin de séance […] en sont toujours exclus. Elle n'est plus affichée séparément au bas de l'écran. »
   - `ch07:163` (D-131) : la « Durée synthétique des Exercices, affichée dans le Catalogue et sous `Nombre de tours` dans la Composition » est la même mesure que celle du Catalogue, c'est-à-dire la Séance entière.
   - `ch08:1509` : « la durée de Séance intègre les durées intrinsèques des Exercices ainsi que leurs récupérations ». `ch06:794` dit de même.
3. **Lecture « Circuit ».**
   - SPEC-CIR §5.1-5.2 (l. 197, 203-209) : « l'en-tête de circuit […] « 19 min » — alors que ce circuit contenait un exercice en répétitions » ; « **Un circuit est un agrégat** » ; « exact | tous les exercices du circuit ont une durée exacte ».
   - `ch10:684` : « Symbole préfixé au montant de l'en-tête : ≈ ou ≥ ». `ch08:1505` : « Total exact/≈/≥ calculé sur les passages réels ». `DSF-CIRCUITS-CONTROLES-2026-10-12.md:11` : « La durée agrégée est sous le titre. »
   - Les deux lectures ne donnent pas le même montant dès qu'il y a des Exercices avant ou après le Circuit, ce que prévoient `ch04:177-179` et D-061. SPEC-CIR mentionne aussi un « en-tête de séance » distinct affichant « ≥ 21 min » (l. 197). Je n'ai pas retrouvé cet élément dans CE-T03-08, et D-100 a retiré l'affichage séparé : **doute non levé**.
   - Ni CIR-01 à CIR-12 (`ch07:589-600`) ni SPEC-CIR ne citent D-100 ou D-131 pour les remplacer.
4. **Classement : ARBITRAGE_PRODUIT.** Deux décisions (D-100/D-131 et la spécification Circuits du 12/10) visent le même emplacement, et aucune ne remplace l'autre explicitement. Que la seconde soit plus récente ne suffit pas.
5. **Question fermée.** « Avec des Exercices avant ou après le Circuit, la ligne sous le titre Circuit affiche : (A) le nombre d'Exercices et la durée du Circuit développé seul (SPEC-CIR §5, ch10:684) ; (B) le nombre et la durée de tous les Exercices de la Séance, hors Compte à rebours et Fin (D-100, D-131, ch08:1509) ? Dans le cas (A), où s'affiche la durée de la Séance ? »
   - Aucune recommandation : les deux options s'appuient sur des décisions validées.
6. **Dépendances.** Composition et circuits sont hors PRE-4 (Q4). Faible lien avec ED-15 (agrégation), sans libellé exposé (pre4-r2 §4). Aucune PR.
7. **Certitude** : élevée sur l'existence de la divergence, moyenne sur l'interprétation de D-100 (« exclusivement les Exercices »).

## Q-K — Valeur historique hors bornes ; Total pendant une saisie incomplète

### (a) Valeur héritée hors bornes
1. **Décision attendue.** Une cible, une Pause ou un Bip hérité hors bornes, non modifié, laisse-t-il le ✓ de la feuille, `Terminer` et API-PARAM-01 réussir ?
2. **Ce que les sources fixent déjà (affichage et calcul).**
   - pre4-r2:Q15 : « Une valeur historique hors grille (7 s, 5999 s…) reste affichée et calculée telle quelle tant qu'on ne la modifie pas. La modifier impose une valeur de la grille. »
   - pre4-r2:Q21 : ouverture de la roulette sur la valeur valide la plus proche, ± vers le multiple de 5 s voisin. P38 : au-dessus de la borne haute, « + est indisponible […] − ramène à la borne haute ».
   - pre4-r2:Q25 : sur une Cible à renseigner, la roulette s'ouvre sur la valeur minimale.
   - `ch13:4106` : « Les valeurs historiques ne sont pas arrondies silencieusement à la lecture ». `ch09:1270` : « ne pas tronquer ».
   - Analogue explicite pour le Profil : D-265 (`ch07:406`), « Une valeur déjà enregistrée au-delà de 60 s est conservée telle quelle […] « + » est inactif et « − » ramène d'abord à 60 s ».
   - **Portée** : Q15, Q21, Q25 et P38 sont des décisions PRE-4 sans portée générale déclarée. PR #371 reporte Q15 dans la doc générale (pr371.diff:270 : « conserver et afficher exactement la valeur tant que l'utilisateur ne la modifie pas »), sans rien dire de la validation.
3. **Sources contraires (validation).**
   - `ch13:4100` : « ✓ grisé tant que le mode ou une cible active exigée est invalide ».
   - `ch11:352` (API-PARAM-01) : « paramètres valides / erreur | […] durée par Série `5..3535 s` ».
   - `ch13:3041` : « données héritées hors plage à traiter explicitement » (ne tranche rien).
   - En face, H25 (hypothèse) : « une valeur ancienne non modifiée […] n'empêche ni le ✓ de la Feuille ni `Terminer` ». P44 (règle de priorité) s'appuie explicitement sur H25 : « une valeur héritée non modifiée reste enregistrable (H25) ». P45 classe parmi les données illisibles (Q19) ce que la base ne peut pas représenter : cela fixe une limite à H25, pas une confirmation.
4. **Classement : ARBITRAGE_PRODUIT, à distinguer selon la portée.** Pour PRE-4, H25 et P44 permettent d'avancer, mais H25 reste une hypothèse. Pour la doc générale, il n'existe aucune règle.
5. **Question fermée.** « Confirmez-vous H25 : une valeur héritée hors bornes non modifiée (Cible, Pause, Bip) laisse ✓ et `Terminer` actifs et est réenregistrée telle quelle, seule une valeur modifiée devant respecter les bornes ? Vaut-elle pour PRE-4 seulement, ou aussi pour la doc générale (RM-234, API-PARAM-01) ? »
   - *Recommandation (proposition) :* oui, avec une portée générale. C'est cohérent avec Q15 (« tant qu'on ne la modifie pas ») et avec D-265. L'écart de bornes du code (1..5999 s, pr370.diff:357) rend ces données probables.

### (b) Total pendant une cible à renseigner
1. **Décision attendue.** Pendant qu'une cible est à renseigner, la ligne Total de la feuille affiche-t-elle « — » ou disparaît-elle ?
2. **Sources qui répondent.**
   - `ch08:1565` : « Variable : lecture seule, — si incomplet ».
   - `ch06:1119` : « Total variable readonly et — si incomplet ».
   - Origine : 117bedcb et 012f2364 (03/10, consolidation séries variables v12 ; « Variable : […] Total lecture seule et — si incomplet »). La règle n'est ni dans SPEC-v13 ni dans SPEC-2M. Elle n'a jamais été remplacée explicitement.
3. **Sources contraires ou silencieuses.**
   - H10 (hypothèse) : « aucune ligne de total ni de montant, et ✓ indisponible ».
   - `ch10:613` (« Erreur de cible : validation distincte, aucune fausse valeur. »), `ch11:379` (« incomplete reste une erreur de validité distincte ») et `ch11:463` (« aucune cible inventée ») sont compatibles avec les deux lectures.
   - P24 ne vise que le total *omis* (« absente quand le total est omis »), pas le total incomplet. Rien n'est dit pour l'uniforme.
4. **Classement : ARBITRAGE_PRODUIT.** Deux textes normatifs s'opposent à une hypothèse PRE-4.
5. **Question fermée.** « Cible à renseigner : la ligne Total affiche (A) « — » (ch06:1119, ch08:1565) ou (B) n'apparaît pas (H10) ; et ce choix vaut-il aussi en uniforme ? »
   - Aucune recommandation. Si H10 est retenue, deux passages normatifs doivent être modifiés.
6. **Dépendances (a et b).** PRE-4 : ED-09, ED-13, ED-14 et ED-18 (pre4-r2 §5). PR #371 couvre Q15 mais pas la validation. Q19 et P45 pour les données illisibles.
7. **Certitude : élevée** sur les deux constats.

## Q-L — Intégration de Q8 et Q19–Q26 ; X-06 et X-07 ; ordre des PR

### Couverture de chaque décision par les PR

| Décision | Portée déclarée | Couverte par une PR ? | Passages de main encore à aligner (vérifiés) |
|---|---|---|---|
| Q8 (roulette Répétitions) | non déclarée ; nomme les passages généraux à remplacer | **En partie, par #371** : ligne de tête de la roulette à une colonne dans CE-UI-10 (pr371.diff:258, ch13 vers l. 3008) et DSF Deux modes (pr371.diff:55) | D-219 `ch07:294` ; `ch13:125` ; `ch06:186` ; `ch06:2199` ; `ch08:1559` (« Stepper intégré ») ; `ch08:1573`, réécrite par #371 en gardant « Répétitions `1..100` utilisent des steppers » (pr371.diff:166) ; `ch08:1808` |
| Q19 (données illisibles écartées) | **phase projet** (PRE-4 BMAD et VNext) | Non (aucune occurrence de « illisible » dans #363, #370, #371) | ch09 (migration, l. 1156 et 1260) ; `ch12:1597` (« Migration versionnée et atomique ») ; remplace « l'obligation antérieure de tout annuler » |
| Q20 (≥ en min et s, sans arrondi) | non déclarée ; rectifiée le 16/10 | Non (aucune occurrence de `Math.ceil` ou « 1 min 45 » dans les diffs) | RM-159 `ch10:141` ; D-090 `ch07:124` (X-01), avec P41 |
| Q21 (valeur valide la plus proche) | non déclarée | **En partie, par #371**, et de façon ambiguë : « Le pied ± de cible Durée utilise un pas de 5 s » (pr371.diff:270 et 69) ; la position d'ouverture et le « multiple voisin » manquent (X-05) | ch13 l. 4093 et 4104-4106 ; DSF Deux modes ; P38 |
| Q22 (dev client « Routine Dev ») | préparation de recette | Sans objet | Aucun : cette décision ne relève pas de la doc normative |
| Q23 (retrait du bouton de Mode sur la Carte) | non déclarée | Non | **`docs/DSF-PHRASES-V15-2026-10-07.md:15`** : « Le champ à droite de Paramètres d'exécution affiche le **mode** des paramètres appliqués ». La prémisse de Q23 (« absent des frames et des sources ») est donc inexacte pour ce DSF, qui devra être amendé. À signaler à Hermann |
| Q24 (« {N} séries à l'échec ») | non déclarée | Sans objet | main est déjà conforme (`ch01:363`, `ch05:252`, `ch08:1814`) ; la décision ne change que le code PRE-3. Préciser éventuellement « en Régime identiques comme variables » |
| Q25 (ouverture sur la valeur minimale) | non déclarée | Non | ch13 l. 4104 (« À l'ouverture : cible numérique → … ; cible échec → … », sans cas pour une cible à renseigner) ; DSF Deux modes |
| Q26 (± du pied sans Cellule active) | non déclarée | Non | `ch13:2997` (pied commun) ; DSF Circuits |

### X-06 : texte d'abandon en création
- pre4-r2:Q18 : « Création : « Abandonner la création ? » / « Les informations saisies seront perdues et l'exercice ne sera pas créé. » »
- pr371.diff:127 (D-094) : « en création : titre `Abandonner la création ?`, message `L'exercice ne sera pas créé.` ». pr371.diff:197 (CE-T03-04 §4) : « Création : « Abandonner la création ? » / « L'exercice ne sera pas créé. ». »
- Le rapport de la PR (pr371.diff:20 : « Messages distincts création/modification et correction cet exercice ») ne dit pas que le raccourci est voulu. Le titre, le message de modification et les boutons sont conformes. main garde « cette exercice » (`ch07:128`).
- **RÉSOLUE_PAR_SOURCES** : corriger les deux lignes de #371 avec le texte exact de Q18. Certitude élevée.

### X-07 : stepper des Répétitions
- pre4-r2:Q8 : « **Roulette native à une colonne** […] Elle remplace, pour la cible, le stepper en ligne de ch. 13 l. 125, ch. 06 l. 186 et 2199, D-219 et ch. 08 l. 1559 et 1573. »
- pr371.diff:166 (hunk `-1570,7 +1571,7`, ancienne ligne 1573) : « Séries `1..99` et Répétitions `1..100` utilisent des steppers ».
- La PR n'a aucun hunk sur ch07 l. 294 (D-219), ch13 l. 125, ch06 l. 186 et 2199, ni ch08 l. 1559 et 1808 (en-têtes de hunks relevés). Le stepper reste juste pour `Nombre de Séries` et `Nombre de Tours`.
- **RÉSOLUE_PAR_SOURCES** (Q8 explicite) : corriger la ligne réécrite par #371 et, dans #371 ou dans le lot 2, les six autres passages. Certitude élevée.

### Ordre avec #370 et #371 (RECOMMANDATION_DOCUMENTAIRE)
- Fusion d'essai faite dans un dépôt jetable du scratchpad (archive de 6656fefc, puis supprimé) :
  - chaque PR s'applique seule sur main ;
  - la fusion 3-way de #370 et #371 entre en conflit **uniquement** dans `ch06` (insertion au même endroit, l. 1162-1165) ; ch07, ch08 et ch13 se fusionnent automatiquement ;
  - #363 entre en conflit avec chacune des deux autres au même endroit du ch06.
  - L'ordre ne supprime donc pas le conflit, qui se résout à la main au ch06.
- Recommandation (proposition) :
  1. corriger d'abord #371 (X-06, X-07, la formulation du ± selon Q21 et P38), puis la fusionner en premier : c'est la plus petite, et elle corrige du texte existant ;
  2. rebaser #370, puis #363, en résolvant le ch06 l. 1162 ;
  3. intégrer ensuite Q19–Q21 et Q23–Q26 dans un lot dédié, distinct du lot 1B. Ce lot reprend le modèle du rapport de #371, une ligne par décision, et ne touche pas les lignes de #370.
- Contraintes à respecter :
  - « ne pas fusionner pendant le travail BMAD sans coordination explicite » (`pr371-body.md`) ;
  - les fichiers `[PRE4]` ne sont pas modifiés dans main sans décision explicite (design.md « Sources figées PRE-4 »). PRE-4 BMAD lit des copies figées à `caa2a5cf` (pre4-r2:Q1–Q3), donc une fusion dans main ne change pas ses sources.

### Question de gouvernance (ARBITRAGE_PRODUIT)
« Les décisions Q8, Q20, Q21, Q23, Q25 et Q26, prises pour PRE-4 BMAD, valent-elles aussi pour la documentation normative générale, ce qui permettrait de les reporter dans les chapitres et les DSF ? Q19 l'est déjà (« phase projet »). » Options : oui en bloc / au cas par cas. *Recommandation (proposition) :* oui en bloc, avec Q23 accompagnée de l'amendement de DSF-PHRASES-V15:15. Sans cette confirmation, ces reports étendraient une décision PRE-4 de façon implicite, ce que le brief exclut.

**Dépendances.** Q-K (H25 et H10 ne s'intègrent qu'une fois confirmées), X-01, X-05, lot 1B. **Certitude** : élevée sur la couverture et les conflits, moyenne sur l'ordre (les PR peuvent encore évoluer).

---

## Couverture

- **Lu en entier** : le brief ; tasks.md §1C ; les constats X-03 à X-07, S-01 à S-05, S-14 et P-05 ; pre4-r2 (Q1–Q26, P1–P45, H1–H33) ; les corps de PR #370 et #371 ; les lignes ajoutées de pr371.diff ; les en-têtes de hunks des trois PR.
- **Spécifications supprimées** : `git show 7a89220f^:…/SPECIFICATION-{FORMATS-SEANCES-2026-10-14, CIRCUITS-TOURS-SERIES-2026-10-12, DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13, PARAMETRES-MODALE-v13}.md`, copiées en lecture dans `scratchpad/arbitrages/src/`. Passages lus : §5, §8, §9 et §11 de Circuits ; §7, §8, §11 et §14 de Formats.
- **Historique Git** (`git log -S`) sur :
  - « post-MVP à planifier », « n'est pas ajoutée au périmètre MVP courant », « Le MVP permet de consulter les médias » (fd30978a, fd9555bc) ;
  - « au moins un exercice chronométré a été interrompue », « a été interrompue ou ignorée », « au moins une activité chronométrée » (2fd478a1) ;
  - « Une séance peut être supprimée depuis le catalogue », « Une Séance active ne peut pas être supprimée » (6ba86ad6) ;
  - « les modifications sont enregistrées automatiquement », « Une séance incomplète peut être enregistrée » ;
  - « lecture seule, — si incomplet », « Total variable readonly et — si incomplet » (117bedcb, 012f2364) ;
  - « durée de Séance intègre », « Symbole préfixé au montant » (079cc57a).
- **Recherches principales** (`grep -rn` sur `docs/Specifications-fonctionnelles/*.md docs/*.md`) : `D-334|D-335`, `RM-203`, `CE-MEDIA-EXEC-0[12]`, `post-MVP|hors MVP` avec média, `Partielle`, `incomplet`, `conteneur unique|avant le Circuit|un seul circuit`, `exercice(s) ·|sous .Nombre de tours|durée agrégée`, `Exercice valide|incomplète peut|enregistrées automatiquement`, `Choisir un mode|affiche le mode|champ à droite`, `séries à l'échec|séries jusqu'à l'échec`, `aucune fausse valeur`, `5999`.
- **Dans les diffs** : `illisible`, `Math.ceil`, `1 min 45`, `plus proche`, `voisin`, `Choisir un mode`, `valeur minimale`, `cellule active`, `à renseigner`.
- **Fusion d'essai** : `git apply --check` et `git merge` dans un dépôt jetable du scratchpad, construit par `git archive 6656fefc`, puis supprimé. Aucun fichier du dépôt n'a été modifié.
- **Code PRE-3** : non consulté. Il n'est cité qu'à travers H29 et pr370.diff:357.
- **Limites** :
  - l'« en-tête de séance » de SPEC-CIR §5.1 n'a pas été localisé dans les contrats actuels ;
  - la citation de ch06 l. 2199 par Q8 a été vérifiée : la ligne mentionne bien `Nombre de répétitions` en stepper.

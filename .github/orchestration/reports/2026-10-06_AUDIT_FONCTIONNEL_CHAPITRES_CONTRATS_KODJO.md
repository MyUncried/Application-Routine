# 2026-10-06 — AUDIT_FONCTIONNEL_CHAPITRES_CONTRATS_KODJO

## Identifiant, objectif et limites

- Mission : `AUDIT_FONCTIONNEL_CHAPITRES_CONTRATS_KODJO` — complément fonctionnel de `2026-10-06_AUDIT_TRANSVERSE_FINAL_DOCUMENTATION_KODJO.md`, qui avait limité sa portée aux contrôles structurels et ciblés. Objectif : analyser la cohérence **fonctionnelle** des spécifications, des règles métier, des décisions, des chapitres de conception, de données et d'API, et des contrats d'écran, pour la cadence, les phrases, les durées, les pauses, la bilatéralité, Circuit/Tour/Parcours, le Point d'arrêt, les cartes et les états d'exécution.
- Mission en lecture seule sur les documents, le code et Figma. Aucun workflow, test applicatif ni qualification lancé.
- Auteur : l'IA qui a réalisé les modifications Figma ; **revue non indépendante**.
- **Cette revue n'est pas exhaustive** (voir « Couverture réelle »). Elle ne conclut pas à un alignement total.

## Départ

- Branche `docs/cadence-dsf-2026-10-06`, PR n° 323. Lecture effectuée sur le commit `4665654580740059eacd649cc79e615fd07b9a66`, puis **tête distante revérifiée en fin de mission : `81dc851fc882dbafbb60045062d57cefdcfdd8f1`** (commit « corriger les constats G-01 à G-05 de l'audit transverse », 06/10 11:41). `main` = `6d03f5be579f2d0e2e7602b6abf1c2b46f4c740b`, inchangé.
- Le commit `81dc851` corrige G-01 à G-05 du rapport transverse : captures `figma-4997-6113.png` et `figma-5021-5994.png` réexportées (repères mesurés à `(215, 217, 223)`, soit 62 %), formulation de « Parcours » corrigée dans `06` et `13`, valeur historique qualifiée dans `DSF-SERIES-VARIABLES`, rapports liés à l'index, matrice complétée. **Tous les écarts retenus ci-dessous (H-01, H-02, H-06, H-08, H-09, H-10) ont été revérifiés présents sur `81dc851`, aux mêmes lignes ; H-12 et H-03 ont été établis sur ce même contenu** (le commit n'a modifié ni `08`, ni `09`, ni v13, et dans le chapitre 13 qu'une ligne de CE-T03-08 § 21).
- Checkouts isolés : worktrees détachés sur `4665654` puis sur `81dc851` ; aucun travail existant écrasé. Instructions du dépôt (`CLAUDE.md`) relues.

## Couverture réelle

| Élément | Traitement |
|---|---|
| `SPECIFICATION-CADENCE-REPETITIONS-v1.md` (66 lignes) | **lue en entier** |
| `SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md` (50 lignes) | **lue en entier** |
| `SPECIFICATION-PARAMETRES-MODALE-v13.md` (150 lignes) | § 1 à 5 et § 7 lus ; § 6, § 8 et suivants non relus |
| Chapitre 13, § 4 « Règles communes T03 » (l. 59-191) | **lu en entier** |
| Contrat `CE-UI-10` (l. 3054-3167) | **lu en entier** |
| Contrats | **30 sur 30 lus** hors rubriques de mise en page (§ 6, 9, 10, 13, 18 pour la plupart) et hors phrases modèles répétées ; **CE-UI-10, CE-T03-08 à 13, CE-EXEC-SESSION-01 et CE-MEDIA-EXEC-01 et 02 lus en entier** ; § 4 (règles communes) et § 6 (R-01 à R-04) lus en entier |
| Chapitres 08 à 12 | lignes mentionnant la cadence relues ; chapitre 08 : § 4.6, tableaux des paramètres (l. 955-966) et de la Composition (l. 898-906), récupérations (l. 1176-1196) ; chapitre 09 : attributs et règles de l'Exercice (l. 538-583), bilatéralité (l. 1124-1135), récupérations (l. 1208-1221), paramètres et cadence (l. 1260-1279), attributs du Profil (l. 836-852) ; chapitre 10 : RM-054 à RM-082 et RM-215 à RM-234 ; chapitre 11 : API Exercices, API Exécution, extension Cadence (l. 64-76, 105-126, 377-389) ; chapitre 12 : sections couleurs, typographie, composants, dimensions et pauses de sécurité |
| Chapitre 06 | prose des sections **Composition d'une séance** (l. 772-1099) et **Exécution** (l. 1716-2138) lue ; autres sections et chapitres 01 à 05 : recherches ciblées et balayage des marqueurs d'ouverture (à matérialiser, à trancher, question ouverte) uniquement |
| Registres | `D` (298 lignes), `RM` (182), `DM` (20) : unicité et références contrôlées exhaustivement |
| Identifiants Figma | chapitre 13 : **114 identifiants** (extraction corrigée, voir note) : 99 dans la matrice, 12 présents ailleurs dans Figma (composants, archives, wireframes), 2 documentés comme disparus (`3787:5148`, `3787:5209`), 1 inexistant cité comme courant (`6665:24120`). Autres documents actifs : 214 identifiants hors matrice, **65 inexistants dans Figma** (pages toutes chargées) |
| Frames de démonstration | 5 frames de phrase/cadence et 4 feuilles de paramètres comparées |

Ce qui n'a **pas** été lu fonctionnellement : environ 90 % du chapitre 06, les chapitres 01 à 05 (recherches ciblées et balayage des marqueurs d'ouverture seulement), l'essentiel des chapitres 08 à 11, et les rubriques de mise en page des contrats.

**Note de correction.** Le rapport transverse indiquait 101 identifiants dans le chapitre 13 : mon extraction ne reconnaissait pas les identifiants collés au mot précédent (espace manquant, par exemple « courante6665:24120 »). L'extraction corrigée donne 114 identifiants ; les chiffres ci-dessus remplacent ceux du rapport transverse.

## Contrôles automatisés (Conformes)

| Contrôle | Résultat |
|---|---|
| Bornes de paramètres : Séries `1..99`, Répétitions `1..100`, Durée par Série `1 s..99 min 59 s` (= 5999 s), pauses `0..300 s`, Tours `1..99`, cadence `1..60` | **Conforme** : mêmes valeurs dans `PRODUCT`, `04`, `08`, `09`, `10` (RM-035, RM-234), `13`, v13, Cadence v1 ; aucune valeur divergente |
| Grille des pauses (`1 s` jusqu'à 5 s, `5 s` jusqu'à 120 s, `30 s` jusqu'à 300 s) | **Conforme** : identique dans 8 occurrences et dans CE-UI-10 § 14 |
| Pause de sécurité : 30 min après fin nominale d'une Série cadencée ou fin théorique d'un Exercice chronométré ; 2 h sans cadence ou À l'échec | **Conforme** : Cadence v1 § 5, RM-068/069, chapitre 08 (l. 528-532), chapitre 12 (l. 358-361), CE-T03-11, D-292 |
| Pause entre les côtés : défaut 10 s, libellé unique ; préparation fixe 5 s en exécution directe | **Conforme** : 4 et 14 occurrences concordantes |
| Formule d'agrégat (`T`, `To = T` si `R = 0`, `T − PN + R` si `R > 0`) et symboles `≈`, `≥` | **Conforme** : énoncé identique dans `INDEX`, `PRODUCT`, `01`, `04`, `09`, `10`, `13` § 4.12, v13 § 5, Cadence v1 § 2 |
| Cadence : champ `repetitionIntervalSeconds?` entier 1..60, absence = Aucune, jamais `2 s` par défaut | **Conforme** : Cadence v1, `04` l. 439, `09` l. 1270, `11` l. 381-384, `13` CE-T03-11 et CE-UI-10 |
| Bip minute remplacé par les signaux de cadence ; Suivant termine normalement sans confirmation ; fin nominale sans fin de Série | **Conforme** : RM-058, `08` l. 461, `13` § 4.12, CE-T03-11 |
| Recette Cadence v1 § 7 (arithmétique) | **Conforme** : 9 bips pour 10×4 s ; progression 15 % → 10 % après une Pause à 6 s ; seuil 30 min 40 s ; temps réel cumulé 16 s |
| Propagation de la cadence aux contrats | **Conforme** : 29 contrats portent des phrases cohérentes entre elles et avec Cadence v1 (templates identiques répétés) |
| Ordre des lignes de la feuille de paramètres (CE-UI-10 § 7) | **Conforme** : ordre vertical des 4 frames Figma comparées identique au contrat (Mode, Séries, Séries variables avec sous-lignes à `x = 52`, Changement de côté, Ordre / PC, total, compte à rebours, fin) |
| Valeurs par défaut et bornes : compte à rebours initial 10 s, fin de séance 5 s, compte à rebours et fin d'exercice 10 s et 5 s (D-256), préparation 5 s, commentaire ≤ 200, nom d'affichage 1..80, rappel ≤ 24 h, fréquence 1..12 semaines | **Conforme** : valeurs identiques dans tous les documents où elles figurent (hors la pause entre Séries, H-12) |
| `Suivant` sans confirmation en Répétitions et À l'échec ; confirmation en Durée avant terme | **Conforme** : énoncé identique dans `PRODUCT`, `06`, `07` (D-030, D-278), `08`, `10` (RM-059, RM-060), `11`, `13`, Cadence v1 |
| Pause prolongée (30 min en pause, D-047) et pause de sécurité (30 min / 2 h) | **Conforme** : deux mécanismes distincts, énoncés de façon cohérente dans `01`, `03`, `07`, `08`, `10`, `11`, `12`, `13`, Cadence v1 |
| Sens du mot « Tour » | **Conforme** : aucun emploi résiduel de « Tour » comme conteneur (D-209) dans les documents actifs |
| Phrases quasi identiques copiées entre documents | **Conforme** sauf les cas retenus : 2 299 phrases de plus de 110 caractères comparées, 101 paires quasi identiques mais différentes, aucune divergence de fond hors H-01, H-08, H-09, H-12, H-13 |
| Registres d'identifiants | **Conforme** : 0 doublon (`D`, `RM`, `DM`) ; 0 `D` ou `DM` cité sans définition ; `RM-203` est défini sous forme de titre avec sous-règles 203.1 à 203.11 (pas un identifiant orphelin) |
| Circuit, Tour, Parcours ; Point d'arrêt | **Conforme** : glossaire l. 22, 51, 122, 138 ; RM-191 ; `13` l. 163, 1453 ; Circuit unique répété de 1 à 99 Tours dans `PRODUCT`, `01`, `04`, `08`, `09` |
| Confirmations de Pause, Arrêter, Reprendre | **Conforme** : `08` l. 492, `13` l. 1069, 1487, 2814 |

## Écarts

### H-01 — Majeure — NON CONFORME — Réserves CAD-V01 à CAD-V04 encore ouvertes dans des documents actifs

- Source : décisions de levée (matrice Cadence l. 159-162, rapport de mise à jour, `13` l. 1275 et 3164, DSF-CADENCE § 4) : la suppression d'une cadence se fait par « Aucun » dans la même roulette ; aucune frame, aucun bouton supplémentaire ; états avant/après nominal et Pause/Reprise sur le layout d'exécution existant, sans trois maquettes.
- Passages encore en contradiction :
  - `05 – Versions du produit.md` l. 276 : « les trois états d'exécution cadence et le contrôle visuel de suppression restent à matérialiser/qualifier ».
  - `06 – Ecrans et navigation de la V1.md` l. 1362 : « Suppression de cadence : fonction définie, contrôle exact non trouvé ; réserve CAD-V01 » ; l. 1785 : « Les états avant/après nominal et Pause/Reprise sont à matérialiser graphiquement (matrice CAD-V02–04) ».
  - `08 – Conception fonctionnelle détaillée.md` l. 961 : « contrôle de suppression visuellement manquant ».
  - `13 – Contrats d'écran.md`, CE-UI-10 : l. 3110 (§ 11, « État graphique de suppression non identifié ; ne pas l'annoncer couvert »), l. 3142 (§ 17, « Contrôle de suppression non démontré par Figma : seule sa matérialisation demeure ouverte »), l. 3158 (§ 20, « suppression lorsque son témoin sera complété »). Le même contrat dit, en § 12 et § 21, que la suppression se fait par « Aucun » et que les réserves sont levées.
- Preuve : lecture des lignes citées ; contradiction interne à CE-UI-10 entre § 11/17/20 et § 12/21.
- Impact : le lot code peut attendre un design ou implémenter un contrôle de suppression supplémentaire que la décision exclut ; le contrat présente simultanément la fonction comme définie et comme non matérialisée.
- Correction minimale : remplacer ces six passages par la formulation levée (« suppression par « Aucun » dans la même roulette, CAD-V01 levée ; aucune frame ni contrôle dédié requis ») ; ne pas toucher aux autres limites (par exemple le placement du libellé de cadence en CE-T03-11, l. 1265, qui est une limite distincte).

### H-02 — Moyenne — PARTIEL — Décision D-029 non annotée alors que sa portée est précisée ailleurs

- Source : `07 – Registre…` l. 51 : « seule l'exercice en cours est recommencée depuis le début ; la progression de la séance est conservée » ; D-150 (côté courant).
- Textes actifs plus précis : `08` § 4.6 (l. 473-480) : première phrase « recommencer l'exercice en cours depuis son début », puis « en unilatéral, la Série courante recommence ; en bilatéral, le bloc du côté courant » ; RM-062 (`10` l. 112), Cadence v1 § 4 (l. 38), `13` § 4.12 (« Réinitialiser Série unilatérale »), `13` l. 31 et 3212 et v13 § 7 l. 114 (« recommencer le côté courant depuis sa première Série »).
- Constat : D-029 est lue comme « tout l'Exercice recommence » alors que la portée active est la Série courante en unilatéral et le bloc du côté courant en bilatéral. Les documents actifs citent D-029 comme source de cette portée sans que le registre l'annote.
- Impact : ambiguïté de traçabilité (une personne lisant le registre implémenterait un reset d'Exercice entier en unilatéral).
- Correction minimale : ajouter à la ligne D-029 une note de portée (« précisée par RM-062, D-150 et v13 § 7 : Série courante en unilatéral, bloc du côté courant en bilatéral ») et aligner la première phrase de `08` § 4.6. Aucun arbitrage rouvert.

### H-03 — Moyenne — À CLARIFIER — Formulation « séparées par » et total incluant la pause terminale

- Source : v13 § 2 (« Pi est la Pause attachée à la Série i, y compris la dernière ») ; v13 § 5 (`T = Σ(Ti+Pi)`) ; Phrase v1 § 2 (« séparées par 15 s de pause »).
- Constat : pour plusieurs Séries uniformes avec pause positive, la phrase annonce des pauses « séparant » les Séries (N − 1 pauses), alors que le total « Durée totale » inclut N pauses. Exemple : « 3 séries de 30 s, séparées par 15 s de pause. Durée totale : 2 min 15 s », alors qu'un lecteur calcule 2 min. Phrase v1 reconnaît la pause terminale seulement pour une Série unique (« suivie de 15 s de pause »).
- Impact : lecture d'un écart arithmétique apparent entre la phrase et le total ; aucun défaut de calcul (D-248 inchangée).
- Proposition : ne pas rouvrir D-248 ; demander au propriétaire si la phrase doit préciser la pause terminale (« … puis 15 s de pause finale ») ou si l'écart est accepté, et le consigner.

### H-06 — Majeure — NON CONFORME — CE-T03-10 : la pause après la dernière Série est supprimée

- Source : v13 § 4 (succession canonique `S1 → P1 → S2 → P2 → S3 → [P3 ou R]`) ; v13 l. 50 (« La Pause terminale existe en direct ») ; v13 § 5 (`T = Σ(Ti+Pi)`, pause terminale incluse) ; `13` CE-T03-10 § 5 (l. 1139, « En direct : … Pause terminale normale ») ; CE-T03-11 § 4 et CE-T03-12 § 8, § 14 (« y compris la dernière »).
- Passage en contradiction : `13` CE-T03-10 § 4 (l. 1133) : « Fin Série → pause inter-Séries **seulement s'il reste une Série**, sinon Fin d'exercice propre applicable ». Seule occurrence de cette règle dans les documents actifs (recherche textuelle sur les 57 documents).
- Impact : pour un Exercice en Durée unilatéral exécuté en direct, le contrat prescrit de sauter la pause terminale, alors que le total affiché l'inclut et que les deux autres contrats d'exécution directe l'exécutent. La recette du même contrat (§ 20 : « pause 0/>0 ») ne permet pas de trancher.
- Correction minimale : remplacer par « Fin Série → Pause (y compris la Pause terminale si positive) → Fin d'exercice propre applicable → CE-T03-13 », en cohérence avec v13 § 4.
- Dans le même passage de CE-T03-10 : la phrase modèle « Série n/N, côté courant distinct … Pause entre les côtés » (l. 1155, recopiée dans CE-T03-09, 11, 12, 13) contredit les § 7 et § 18 du même contrat unilatéral (« côté absent », « aucun côté annoncé ») ; la rendre conditionnelle au bilatéral.

### H-08 — Moyenne — PARTIEL — « Récupération » en Composition : énoncés contradictoires dans les documents et dans Figma

- Règle de retrait (D-238) : `06` l. 859 (« aucune ligne attachée `Récupération {durée}` : cette ancienne exigence d'affichage est supprimée »), l. 897 et l. 1806 ; `08` l. 903 ; `13` CE-T03-08 § 9 (« aucune ligne Récupération affichée ») et § 19. La valeur reste portée par l'occurrence ; `06` l. 859 précise « aucun nouvel accès de réglage n'est inventé ».
- Énoncés qui disent le contraire : `06` l. 839 (« La valeur `0 s` reste affichée dans la Composition ») ; `08` l. 1181 (« La ligne reste visible à `0 s`, y compris après le dernier Exercice du Circuit ») ; `06` l. 867 (« bloc Exercice–Récupération »). D-217 et `08` l. 1194 décrivent une ligne visuelle partagée entre la Récupération et le Point d'arrêt.
- Figma (relevé du 06/10) : **13 des 17 frames de composition** affichent des lignes « Récupération », dont la référence principale `2028:11700` (4 lignes) et le placement de point d'arrêt `4893:6675`. Seules `2028:11137`, `11298`, `11375` et `12003` n'en ont pas.
- Documentation de l'écart : `13` l. 3181 (V-10) parle de « certaines cartes Composition » ; CE-T03-08 § 21 ne cite que `6665:23973`.
- Impact : le lot code ne sait pas si la ligne doit exister, dans quels états, ni où la Récupération est réglable par occurrence ; trois passages actifs (`06` l. 839, `08` l. 1181, D-217) sont en contradiction avec D-238 sans être qualifiés d'historiques.
- Correction minimale : qualifier `06` l. 839 et `08` l. 1181 comme antérieurs à D-238 ; élargir V-10 à « toutes les frames de composition peuplées (13 sur 17) » ; préciser si la ligne partagée de D-217 subsiste en mode placement du Point d'arrêt (à confirmer par le propriétaire, sans rouvrir D-238).

### H-09 — Mineure — NON CONFORME — Énoncés périmés des chapitres 06, 08 et 10

- `08` l. 963 (ligne « Médias ») : « carte Catalogue déployée du MVP », contre D-261 (aucun déploiement des cartes d'Exercice ; vignette en gouttière permanente de 64, déjà correctement écrite en `09` l. 563 et `11` API-ACT-04).
- `08` l. 214, `10` RM-080 (l. 151) et RM-101 (l. 222) : « `Terminer` » pour le bouton de la Synthèse, alors que le libellé courant est « `Enregistrer` » (`13` § 4.12 et CE-T03-14 § 21 ; vérifié dans Figma sur `4968:8055` et `4968:8105`).
- `06` l. 841 : avertissement non bloquant « selon la règle existante » lorsque deux Exercices s'enchaînent sans pause ni récupération : la règle citée n'existe nulle part ailleurs dans les documents actifs.
- Correction minimale : aligner les deux premiers points sur les textes courants ; décider si l'avertissement du troisième est une règle (à décrire) ou à retirer.

### H-10 — Moyenne — NON CONFORME — Identifiants Figma inexistants cités comme courants

Contrôle exhaustif des 214 identifiants cités hors matrice : 65 sont absents de Figma (pages toutes chargées). Après tri, ceux qui sont présentés comme courants dans des documents normatifs :
- `12 – Architecture technique.md` l. 942 et 951 : « `icon/ajouter` (`2884:4315`) dans `Action / Add Activity — Source exact` (`2537:1484`) » ; aucun des deux n'existe ; l'icône courante est `icon/ajouter` `6959:15706` (DSF-CADENCE § 6).
- `12` l. 1374 : `Icon / Selection Check` `3847:5512` : inexistant, aucun composant de ce nom dans Figma.
- `12` l. 1078-1086 (section « Source canonique de l'icône Tour ») : instances `3272:4126` à `3272:4161`, `3067:4835` / `3067:247` et frame `2028:11921` : inexistantes ; seul le composant `DSF / Primitives / Icône de tour` (`3066:4685`) existe.
- `07` l. 130 : frame `3224:4082` (confirmation d'abandon d'un Exercice) inexistante.
- `06` l. 391 : lignes `4179:9550` et `4179:9556` du Profil inexistantes.
- `13` CE-T03-02 § 21 : « référence variable courante `6665:24120` » inexistante.
- Non triés (documents datés ou historiques probables, à qualifier) : `INDEX.md` l. 95-97 (`3788:5258`, `3789:5405`, `3879:5947`, `3879:6079`), `DSF-V2-MOTIFS-LOT-3.md`, `MATRICE-SERIES-VARIABLES-2026-10-02.md` (frames « Copie — … » du 02/10), `ETAT-DES-LIEUX-CREATION-EXERCICE-2026-10-03.md`, `06` l. 2409-2416 (section d'audit historique).
- Impact : traçabilité cassée dans les passages normatifs sur les icônes et la source canonique de l'icône Tour ; certains nœuds ont été supprimés lors du nettoyage Figma du 05/10 (gabarits masqués, familles « Source exact » fusionnées).
- Correction minimale : remplacer par les identifiants courants (`6959:15706`, `3066:4685`) ou qualifier la citation d'historique ; ne pas inventer de remplacement quand il n'existe pas.

### H-12 — Majeure — NON CONFORME — Valeur initiale et existence de la pause entre Séries : trois énoncés incompatibles

- Source active : v13 l. 92 (« Création : … Série 1, Pause 0 s ») ; `08` l. 1209 (« La Pause après chaque série est initialisée à `0 s` dans la feuille ») ; `13` CE-UI-10 § 3 (l. 3068, « carte vide : N1, Pause 0 s »).
- Énoncés en contradiction :
  - `13` CE-UI-07 § 8 (l. 2698) : « La pause inter-Séries **5 s** appartient à l'initialisation de l'éditeur ».
  - `09 – Modèle de données` l. 846 (attributs du Profil) : « **Pause après chaque série par défaut** — valeur proposée entre deux Séries d'un Exercice », alors que CE-UI-07 écrit « aucune Pause inter-Séries globale ajoutée » et ne liste que six défauts, sans cette pause.
- Impact : l'éditeur peut démarrer à 0 s ou à 5 s, et le Profil peut ou non porter un défaut de pause ; la valeur initiale change le total et la phrase générés pour tout nouvel Exercice (cas de recette « carte vide » de CE-UI-10).
- Correction minimale : aligner CE-UI-07 § 8 sur v13 (initialisation à 0 s, sans pause globale) et retirer la ligne de `09` l. 846 (ou la qualifier d'historique) ; si 5 s est en réalité voulu, le dire une fois dans v13 et corriger les trois autres passages.

### H-13 — Mineure — PARTIEL — Valeurs de couleur : le même élément reçoit deux valeurs selon les chapitres

- Pilule de navigation : `12` l. 1434 donne `#F9FAFC` (token `color/navigation/pill`, vérifié dans Figma), alors que `06` l. 2478 et `07` l. 310 donnent `#FCFCFE` pour le même token. Bouton circulaire clair : `#FCFCFE` en `06` l. 2480, `07` l. 311 et `12` l. 1436, mais les 85 calques « Fond circulaire — Retour » de Prototype MVP sont liés à des primitives `color/observed/…` de valeur `#FCFCFE`, sans token sémantique.
- Carte archivée : `06` l. 700 et `13` CE-T03-01 § 8 donnent fond `#F6F6F6` ; le composant DSF `Cartes / Exercice` (Archivé) est aujourd'hui à `#F5F7FA` lié à `color/surface`. L'ancienne valeur de `cards/archive-surface`, que le rapport de corrections disait introuvable dans les sources, y figure donc (`#F6F6F6`).
- Les écarts sont de 1 à 4 unités par canal, dans la tolérance de fusion arrêtée par le propriétaire : seule la cohérence entre chapitres est en cause.
- Correction minimale : écrire la valeur du token (`#F9FAFC`, `#F5F7FA`) et la valeur observée en note d'écart accepté, une seule fois, dans `12` ; renvoyer `06` et `07` vers `12`.

## Éléments non vérifiables ou hors périmètre

- **Chapitres 01 à 05 et sections du chapitre 06 autres que Composition et Exécution** (Profil, Catalogues, Calendrier, Planification, Synthèse, Suivi) : pas de lecture continue ; contrôlés par recherches ciblées, balayage des marqueurs d'ouverture, recoupement des valeurs par défaut et des bornes, et détection des phrases copiées avec variantes. Ces contrôles ne trouvent que ce qui a été copié ou énoncé de façon comparable.
- **Chapitres 08, 09, 11 et 12** : lus aux passages listés dans la couverture ; le reste n'est pas relu.
- **Rubriques de mise en page, de gestes et d'accessibilité des contrats** : non relues (la fidélité au rendu Figma de ces rubriques n'est pas contrôlée).
- Concepts vérifiés conformes à la lecture des contrats : bilatéralité (le Circuit n'a pas de côté, l'Exercice le porte : glossaire l. 152, CE-EXEC-SESSION-01 § 8 et § 19), règles des cartes (CE-T03-01 et 02 conformes à D-260/D-261 et à `DSF-CARTES` RG-4), référentiel initial de dix zones (D-093, CE-UI-09 : Fessier est un ajout utilisateur), bornes du Profil et de la planification (CE-UI-05, 07, R-02), exemples chiffrés de v13 (195 s, 510 s) conformes à `Σ(Ti+Pi)`.
- Interactions du prototype : hors périmètre.

## Conclusion

- **La partie cadence, phrases et durées est cohérente sur ce qui a été lu** : bornes, formules, seuils, champs, valeurs par défaut et propagation concordent entre les spécifications, les chapitres 08 à 11 et les 30 contrats. G-02 (totaux de démonstration) est couvert par `81dc851`.
- **Trois défauts majeurs** à corriger avant clôture : les réserves CAD-V01 à CAD-V04 levées mais écrites comme ouvertes dans cinq documents (H-01) ; la pause terminale supprimée dans CE-T03-10 alors qu'elle existe en direct (H-06) ; la valeur initiale de la pause entre Séries, énoncée 0 s, 5 s et « défaut du Profil » selon les documents (H-12).
- **Défauts moyens** : portée de la réinitialisation non annotée dans D-029 (H-02) ; Récupération en Composition, énoncés et frames contradictoires (H-08) ; identifiants Figma inexistants cités comme courants (H-10) ; un point à soumettre au propriétaire sans rouvrir d'arbitrage (H-03).
- **Défauts mineurs** : énoncés périmés des chapitres 06, 08 et 10 (H-09) ; valeurs de couleur à deux valeurs selon les chapitres (H-13).
- **Critère d'arrêt atteint pour ce qui peut être recoupé sans lecture continue** : les trois derniers balayages (valeurs par défaut, propositions copiées avec variantes, énoncés sur `Suivant`, pauses prolongées et sens de « Tour ») n'ont produit aucun écart indépendant nouveau ; les écarts H-08, H-09 et H-13 ont été étendus ou précisés par eux. Les chapitres 01 à 05 et six sections du chapitre 06 restent sans lecture continue : aucune affirmation de conformité n'est faite à leur sujet au-delà des recoupements cités.
- La documentation **ne peut pas être déclarée intégralement relue** ni « totalement alignée ». Les corrections nécessaires à la clôture sont H-01, H-06 et H-12 (comportements et valeurs initiales), puis H-02, H-08 et H-10 ; H-03, H-09 et H-13 peuvent suivre dans le même lot.

## Modifications réalisées et fichiers

Création de ce rapport. Aucun document audité, code ou Figma modifié.

- `.github/orchestration/reports/2026-10-06_AUDIT_FONCTIONNEL_CHAPITRES_CONTRATS_KODJO.md` (nouveau)

## Destination et état Git

- Destination prévue : `docs/cadence-dsf-2026-10-06` (PR n° 323), au-dessus de `81dc851` ; chemin hors filtres de workflows (`reports/**` exclu).
- **Publication non réalisée** : aucun accès en écriture à GitHub ; commit local et patch fournis.

# QC — Qualité de la spécification KODJO : CONTENU et COMPLÉTUDE

Passe 2 (qualité), lecture seule. Base : `C:\Dev\KODJO-OPENSPEC-DOCS` (main 6656fefc). Dimensions : **CONTENU** (parcours et contrats) et **COMPLÉTUDE** (couverture des capacités, règles transverses, exigences non fonctionnelles).
Référentiels : ISO/IEC/IEEE 29148:2018 (§5.2.5, §5.2.6), INCOSE GtWR v4 (C1–C15, R1–R42), IREB CPRE FL, ISO/IEC 25010:2023, Cockburn 2001. Aucune certification n'est revendiquée. Les incohérences entre sources ne sont pas recensées ici (elles relèvent d'une autre passe).
Abréviation : `SF/` = `docs/Specifications-fonctionnelles/`.

---

## 1. Couverture réelle de la revue

| Fichier | Lu intégralement | Lu partiellement (plages) | Mesuré mécaniquement (grep / comptes) |
|---|---|---|---|
| SF/02 Utilisateurs et besoins (247 l.) | oui | — | — |
| SF/05 Versions du produit (284 l.) | oui | — | grep des exigences non fonctionnelles (ENF) |
| SF/03 Parcours utilisateur (565 l.) | — | 90–170, 258–305, 356–447 | titres |
| SF/10 Règles transverses (784 l.) | — | 1–235 (RM-001 à RM-192) | titres, grep ENF |
| SF/12 Architecture technique (1623 l.) | — | 20–45, 156–520 (§12.6–12.21), 552–606, 1179–1240 (§12.27–12.28), 1300–1352 (§12.31–12.33) | titres, grep ENF |
| SF/13 Contrats d'écran (4343 l.) | — | 7–60, 169–248 (§4.12, inventaire), 534–654 (CE-T03-04), 916–1020 (CE-T03-08, rubriques 2/3/4/14–17), 2663–2769 (CE-EXEC-SESSION-01), extraits de CE-UI-03/05/07/09 | titres, comptes des rubriques 17 et 18 |
| SF/08 Conception détaillée (1850 l.) | — | 801–1000 (§4 Exécution), 1311–1324 | titres, grep |
| SF/09 Modèle de données (1274 l.) | — | 715–730 (Préférences) | titres, grep « migration » |
| SF/06 Écrans (2794 l.) | — | 1705–1722, 1885–1915 | grep |
| PRODUCT.md (526 l.) | — | 1–60, 205–295, 339–360 | titres |
| SF/01, SF/04, SF/07, SF/11, DSF-*.md | non lus | — | grep seulement |

**Limites.** Environ 25 % du corpus a été lu ligne à ligne. Le reste a seulement été parcouru par grep. Une recherche négative (0 occurrence) prouve l'absence du **terme**, pas toujours celle du **sujet**. Je l'indique pour chaque constat (« manque démontré » ou « sujet à confirmer »). Je ne conclus donc pas à la complétude globale du corpus.

---

## 2. Tableau de couverture des capacités annoncées

Sources des capacités : SF/05 §V1 et compléments MVP, SF/02 §1 et §9, PRODUCT.md §4.
Colonnes : Règles = ch. 08/10 ; Données = ch. 09 (titres d'entités ou grep) ; Contrat = ch. 13.
Légende : ✔ = présent (lu) ; (✔) = présent d'après le grep ou un titre, sans lecture complète ; ◐ = partiel ou points ouverts déclarés ; ✘ = absence démontrée par recherche.

| # | Capacité annoncée | Règles (08/10) | Données (09) | Contrat (13) | Appréciation |
|---|---|---|---|---|---|
| 1 | Créer / modifier / dupliquer / archiver / supprimer une Séance | ✔ RM-001…RM-024, 08 §2 | ✔ 09.2, 09.12, 09.13 | ✔ CE-T03-01, CE-T03-08 | couvert |
| 2 | Composer : Circuit 1–99 Tours, avant/dans/après, Point d'arrêt, Récupération | ✔ RM-025…RM-038, RM-191 | (✔) 09.2, D-208 | ✔ CE-T03-08, CE-CIR-01..03 | couvert |
| 3 | Exercice persistant : créer / modifier / archiver (T03) | ✔ RM-096…RM-113, 08 §2 bis | ✔ 09.5, 09.15 | ✔ CE-T03-04, CE-T03-05 | couvert |
| 4 | Paramètres de l'Exercice (modes, Séries, Pauses, côtés, Séries variables, cadence) | ✔ RM-033…RM-037, RM-129…RM-132 | (✔) 09 §Paramètres, Cadence | ✔ CE-UI-10 | couvert, très détaillé |
| 5 | Référentiels Étiquettes / Catégories / Zones (appui long, suppression) | ✔ RM-040, RM-200 | ✔ 09.10, 09.10.1, 09.11 | ✔ CE-T03-16, CE-UI-09 | couvert |
| 6 | Médias : import de 0..n photos/vidéos (PRE-3) | ◐ RM-041, RM-115 | ✔ 09.6 | ◐ CE-T03-04 §5 : « Sources système, formats, permissions […] : À CLARIFIER » (SF/13:564) | **partiel, déclaré** |
| 7 | Consultation des médias pendant l'Exécution | ✔ RM-203 | (✔) 09 « état média » | ✔ CE-MEDIA-EXEC-01/02 | couvert |
| 8 | Exécuter une Séance (phases, Pause, Suivant, Réinitialiser, Arrêter) | ✔ RM-055…RM-065a, 08 §4 | ✔ 09.7, 09.8 | ✔ CE-EXEC-SESSION-01 | couvert |
| 9 | Exécution directe d'un Exercice (5 s) | ✔ RM-096…RM-103 | ✔ 09.15 | ✔ CE-T03-09…13 | couvert |
| 10 | Guidage audio : bips, annonces vocales, réglages Sons/Voix | ✔ 05, RM-085…RM-088, RM-128 | ✔ 09.9 | ✔ CE-UI-07 | couvert pour l'application ; **comportement face au système non spécifié** (QC-02, QC-03) |
| 11 | Arrière-plan / verrouillage / pause de sécurité | ✔ RM-066…RM-070, 08 §4.9 | (✔) | ✔ CE-EXEC-SESSION-01 §17 | règle présente, **garantie conditionnelle** (QC-01) |
| 12 | Reprise après interruption technique (Reprendre / Arrêter) | ✔ RM-064, 12.33 | ✔ 09:1003 | **✘** : aucun contrat ni état d'écran (« Reprendre la séance » : 0 occurrence dans SF/13) | **manque démontré** (QC-04) |
| 13 | Synthèse : Ressenti obligatoire, Commentaire ≤ 200 | ✔ RM-078…RM-080 | (✔) 09.7 | ✔ CE-UI-08, CE-T03-14 | couvert |
| 14 | Suivi : cartes deux lignes, commandes désactivées | ✔ RM-081, RM-082, 08 §6 | ✔ 09.7 | ✔ CE-T03-15 (ACTIVITY et SESSION) | couvert |
| 15 | Planification : Routine unique / répétée, Jour/Semaine/Mois, multi-contenus | ◐ RM-043…RM-050, RM-206 ; RM-047 « Ne définit pas les règles Jour/Mois » (SF/10:85) ; points ouverts SF/08:1311–1316 | ✔ 09.3, 09.4 | ◐ CE-UI-02…05, CE-UI-11 (« ne certifient pas leur recette », §4.15) | **partiel, déclaré** (QC-12) |
| 16 | Rappel (0..1), autorisation des notifications | ✔ RM-051…RM-054a | ✔ 09.3 | ✔ CE-UI-05 | couvert sauf l'appui sur la notification et son contenu (QC-07) |
| 17 | Préférences (Profil) et valeurs par défaut | ✔ RM-085…RM-090 | ✔ 09.9 | ✔ CE-UI-07, CE-UI-01 | couvert ; un attribut de données (« Écran maintenu actif ») n'a ni règle ni contrat (QC-11) |
| 18 | Formats (EMOM, AMRAP, Death by…) | ✔ RM-… (ch. 10 §Formats) | ✔ 09 §Formats | ✔ CE-FMT-01…06 | couvert en tant que **cible** (SF/05 : « Le moteur n'est pas encore développé ») |
| 19 | Données uniquement locales, hors ligne | ✔ 05 | — | — | énoncé en 12.1 (SF/12:31) ; aucune règle de sauvegarde (QC-08) |
| 20 | Monolingue FR, lexique centralisé | ✔ RM-091, RM-092 | — | ✔ (rubriques 20) | couvert ; formats de date et d'heure non spécifiés (QC-09) |

**Synthèse de couverture.** Sur 20 capacités, 14 sont couvertes à la fois par des règles, des données et un contrat d'écran. 3 sont partielles, et la spécification le déclare elle-même (médias PRE-3, planification Jour/Mois et multi-contenus, Formats en cible). 1 n'a pas de contrat d'écran (reprise après interruption technique). Pour 2 capacités, la règle existe, mais son interaction avec le système d'exploitation n'est pas spécifiée (audio, arrière-plan).

---

## 3. Dimension CONTENU (parcours et contrats)

### 3.1 Bilan — **acceptable**

Les contrats d'écran (ch. 13) sont **solides** sur le plan du contenu. Les 40 contrats ont tous les rubriques « 17. Erreurs et cas limites » et « 18. Accessibilité » (40/40 par grep). Les brouillons, les abandons, les échecs de transaction et les invariants y sont traités.

Les **parcours** du ch. 03 sont **faibles** au regard de la grille de Cockburn. Ce sont des récits sans acteur explicite ni préconditions vérifiables, sans garantie minimale et souvent sans extensions. Pour reconstituer un cas d'utilisation complet, il faut assembler ch. 03 + ch. 08 + ch. 10 + ch. 13.

Les transitions d'état de l'Exécution sont bien définies (statuts, table §4.12). En revanche, deux situations sont sous-spécifiées : l'interruption par le système (appel, focus audio, processus tué) et la reprise différée.

### 3.2 Évaluation de trois parcours selon la grille de Cockburn

#### P1 — Créer / modifier un Exercice (SF/03:356–372 ; CE-T03-04 SF/13:534–654)

| Élément Cockburn | Constat | Passage |
|---|---|---|
| Acteur principal | Implicite (« l'utilisateur ») ; rubrique absente | SF/03:358 « Depuis le Catalogue des Exercices, utiliser `Créer`… » |
| Préconditions | Absentes du ch. 03. Le ch. 13 donne seulement le contexte d'entrée (« Créer depuis Catalogue ou modifier une définition existante », §3) | SF/13 CE-T03-04 §3 |
| Garantie de succès | Ch. 13 : « Persistance à Terminer uniquement, atomique. » | SF/13 CE-T03-04 §15 |
| Garantie minimale (échec) | Ch. 13 seulement : « Échec DB : conserver brouillon, rester éditeur et permettre nouvelle tentative. » | SF/13:628 |
| Scénario nominal | Six étapes numérotées et claires | SF/03:358–372 |
| Extensions | Absentes du ch. 03. Ch. 13 : abandon (« Retour avec modifications → confirmation d'abandon existante », SF/13:552), validation (§14), référentiel vide (CE-UI-09). L'étape média reste indéterminée : « 5. Ajouter ou consulter le média selon le périmètre disponible. » (SF/03:371), et la permission d'accès à la photothèque est « À CLARIFIER » (SF/13:564) | — |

**Verdict P1 : acceptable.** Le contrat d'écran compense les lacunes du parcours, sauf pour la branche média (permission refusée, format refusé, import échoué).

#### P2 — Composer une Séance (SF/03:106–131 ; RM-015…RM-021, RM-107, RM-108 ; CE-T03-08)

| Élément | Constat | Passage |
|---|---|---|
| Acteur / déclencheur | « L'utilisateur crée une nouvelle séance depuis le Catalogue. » | SF/03:110 |
| Préconditions | « Situation de départ » sous forme de récit, non vérifiable | SF/03:99–103 |
| Garantie de succès | « `Continuer` valide et enregistre la Séance avec sa Composition et son Étiquette. » | SF/03:118 |
| Garantie minimale | Explicite et vérifiable : « En cas d'échec de l'enregistrement final, […] le brouillon complet est conservé, l'action est réactivée et le message `La séance n'a pas pu être enregistrée. Réessayez.` est affiché. » | SF/10:190 (RM-108) |
| Extensions | Abandon (RM-018, SF/10:35), drop invalide, doublon, double tap (SF/13:998), Catégorie créée puis abandonnée sans orphelin (RM-107, SF/10:189) | — |
| Effet sur les données anciennes | « Anciennes séances : aucune reprise imposée par ce lot ; ne pas confondre migration de schéma et reprise fonctionnelle. » (SF/13:998) | voir QC-10 |

**Verdict P2 : solide.** C'est le parcours le mieux outillé du corpus : garanties d'atomicité, message d'erreur exact et règles d'abandon.

#### P3 — Exécuter une Séance jusqu'au résultat, interruptions comprises (SF/03:134–150, 258–303 ; SF/08 §4 ; RM-055…RM-070 ; 12.10–12.12, 12.33 ; CE-EXEC-SESSION-01)

| Élément | Constat | Passage |
|---|---|---|
| Préconditions | « Séance contenant ≥1 Exercice valide ; pas de double démarrage. » ; « Une seule exécution peut être en cours simultanément. » | SF/13 CE-EXEC-SESSION-01 §14 ; SF/09:590 |
| Scénario nominal | Bien défini et ordonné (table §4.12, SF/08 §4.2–4.11) | SF/13:169–192 |
| Garanties | Instantané immuable (RM-055) ; statuts Terminée / Partielle / Interrompue définis par une table | SF/08 §4.11 |
| Extension « Pause / Arrêter » | Complète (modale, confirmation, statut, Synthèse) | SF/06:1899–1922 |
| Extension « arrière-plan / verrouillage » | La règle est forte (horodatages, aucune pause implicite, signaux manqués non rejoués : « La cadence continue en arrière-plan ; les signaux manqués ne sont pas rejoués. », SF/07:439). **Mais la garantie audio est conditionnelle** (QC-01) | SF/10:124–128 |
| Extension « appel entrant / autre application audio / mode silencieux » | **Absente** (QC-02, QC-03) | — |
| Extension « processus tué puis relance » | Règle présente (RM-064, SF/12:1351). **Aucun contrat d'écran.** L'état reconstitué après une longue absence n'est pas défini (QC-04). La granularité de persistance n'est pas définie (QC-05) | — |
| Abandon sans réponse | « En l'absence de réponse, la Séance reste suspendue avec son état conservé » | SF/08 §4.10 |

**Verdict P3 : acceptable pour le fonctionnement interne de l'application, faible pour les interruptions venant du système** (l'environnement mobile).

### 3.3 Défauts concrets — CONTENU

**QC-01 — Garantie de guidage en arrière-plan assortie d'une clause échappatoire, sans critère d'acceptation**
- Verbatim : « Le guidage sonore doit, dans la mesure permise par le système d'exploitation, continuer lorsque l'écran est verrouillé ou que l'application fonctionne en arrière-plan. » — `SF/05 – Versions du produit.md:57` (même formule en :38).
- Référentiel : INCOSE GtWR R8 (clauses échappatoires) ; ISO/IEC/IEEE 29148 §5.2.5 (exigence *verifiable*).
- Contexte : le ch. 12 renvoie le résultat au spike RT-001 (« Toute limitation de plateforme identifiée donne lieu […] à une règle fonctionnelle explicite », `SF/12:1202`). Aucun résultat de RT-001 n'est consigné : « RT-001 » n'apparaît que 2 fois dans le corpus (`SF/12:474`, `SF/12:1183`).
- Conséquence : le testeur ne peut pas déclarer l'exigence « échouée ». Le développeur ne sait pas quel comportement de repli il doit implémenter (notification, vibration, rien) si iOS suspend l'audio.

**QC-02 — Mode silencieux : simple condition de test, aucun comportement attendu**
- Verbatim : « - téléphone en mode silencieux ; » — `SF/12 – Architecture technique.md:344` ; « - mode silencieux ; » — `SF/12:1215`.
- Recherche : `silencieux|sourdine|mute` → 4 occurrences dans le corpus. Elles sont toutes en SF/12 (listes de tests), sauf `SF/13:3074` (« blocage silencieux », hors sujet). **Manque démontré.**
- Référentiel : ISO/IEC/IEEE 29148 §5.2.5 (*complete*) ; ISO/IEC 25010:2023 Compatibilité (coexistence), Capacité d'interaction.
- Conséquence : le comportement reste indéterminé. Les bips et les annonces passent-ils outre l'interrupteur de sourdine iOS ? La vibration prend-elle le relais ? Le choix appartiendra au développeur, alors que le guidage « sans consultation permanente de l'écran » est un besoin central (SF/02 §5).

**QC-03 — Interruption par un appel ou par une autre source audio : aucune règle**
- Verbatim : « - avec d'autres sources audio actives. » — `SF/12:345` ; « - autre application audio active. » — `SF/12:1219`.
- Recherche : `appel téléphonique|appel entrant|interruption audio|audio focus` → 0 occurrence (hors « mixage », `SF/12:1430`, limité à la vidéo KODJO). **Manque démontré.**
- Référentiel : Cockburn (extensions) ; ISO/IEC 25010:2023 Fiabilité (tolérance aux fautes) et Compatibilité (coexistence).
- Conséquence : pendant un appel, l'Exécution continue-t-elle (aucune pause implicite, conformément à RM-066), se met-elle en pause, ou les annonces sont-elles supprimées ? À la fin d'un appel, l'utilisateur peut se retrouver plusieurs Exercices plus loin sans l'avoir choisi.

**QC-04 — Reprise après interruption technique : règle sans contrat d'écran, état reconstitué non défini**
- Verbatim : « Au retour au premier plan ou au prochain démarrage, l'état sauvegardé est détecté et l'utilisateur doit choisir entre **Reprendre la séance** et **Arrêter la séance**. » — `SF/12:1351`.
- Recherche : « Reprendre la séance » → 0 occurrence dans SF/13. Dans SF/06, les occurrences (:1717, :1899) décrivent la **modale de pause**, pas l'écran de réconciliation. **Manque démontré** pour le contrat.
- Point non défini : la reprise a-t-elle lieu à la position « qui aurait dû être atteinte » (RM-067), donc plusieurs Exercices plus loin, ou à la position persistée ? Le ch. 03 dit « l'exécution reprend à le dernier exercice enregistrée » (`SF/03:277`), sans préciser lequel.
- Référentiel : ch. 13 §1 (l'auteur exige lui-même des contrats exhaustifs) ; Cockburn (extensions) ; 29148 §5.2.6 (ensemble *complete*).
- Conséquence : il n'y a ni maquette, ni libellés, ni comportement d'écran sur l'accueil (où le dialogue s'affiche-t-il ? avant le Catalogue ?), ni recette.

**QC-05 — Granularité de persistance de l'Exécution renvoyée à une architecture qui ne la définit pas**
- Verbatim : « Instantané immuable ; résultats/temps checkpointés selon architecture » — `SF/13:2737` ; « L'état minimal nécessaire à la reconstruction fiable d'une Exécution est persisté. » — `SF/12:322`.
- Recherche : `checkpoint` → 1 occurrence dans tout le corpus (SF/13:2737). SF/12 n'énumère ni l'« état minimal » ni le moment d'écriture. **Manque démontré.**
- Référentiel : 29148 §5.2.5 (*unambiguous*, *verifiable*) ; ISO/IEC 25010:2023 Fiabilité (récupérabilité).
- Conséquence : on ne peut pas tester combien de progression une fermeture forcée peut faire perdre. Le cas « échec d'écriture pendant l'Exécution » n'a pas de garantie minimale.

**QC-06 — Parcours du ch. 03 rédigés en récit, sans préconditions ni garanties testables**
- Verbatim : « - Les données déjà enregistrées doivent pouvoir être restaurées. » — `SF/03:293` ; « - La différence entre une séance suspendue, terminée et abandonnée doit rester compréhensible. » — `SF/03:295`.
- Référentiel : GtWR R7 (termes vagues) ; Cockburn (préconditions, garanties) ; IREB CPRE FL (documentation des exigences par cas d'utilisation).
- Conséquence : ces phrases ne peuvent pas servir d'oracle de test. « Restaurées » n'est pas défini (restauration après crash ? restauration d'archives ?). Les vraies garanties se trouvent dans RM-064 et dans le ch. 13, ce qui oblige à assembler quatre chapitres pour reconstituer un cas d'utilisation.

**QC-07 — Notification de rappel : effet de l'appui sur la notification et contenu non spécifiés**
- Recherche : `(toucher|appui sur|ouvrir|ouverture de) (la|une) notification|depuis (la|une) notification` → 0 ; `(rappel|notification)s?.{0,40}(ouvre|touch|appui|tap|redirig|deep link)` → 0 ; `contenu de la notification|texte de la notification` → 0. **Manque démontré** (sous ces termes).
- Référentiel : Cockburn (déclencheur, scénario nominal) ; 29148 §5.2.6 (*complete*).
- Conséquence : le développeur doit décider seul de la destination (occurrence ? écran initial d'Exécution ? Calendrier ?), du texte de la notification et de son comportement si la source a été archivée ou si une Exécution est déjà en cours.

### 3.4 Points forts — CONTENU

- **Garanties minimales explicites dans les règles** : RM-107 (« un abandon ou un échec ne crée aucune Catégorie orpheline », `SF/10:189`) et RM-108 (message d'échec exact, `SF/10:190`).
- **Transitions d'état complètes pour l'arrêt volontaire** : table des statuts (SF/08 §4.11), clause « Interrompue […] y compris pendant cette phase ».
- **Fiabilité temporelle bien pensée** : « Le moteur d'Exécution ne détermine jamais le temps réellement écoulé par comptage des ticks d'un timer JavaScript. » (`SF/12:309`) ; horloge injectable ; pas de rejeu des signaux manqués (`SF/07:439`).
- **Gabarit de contrat homogène** : 20 rubriques, dont « Erreurs et cas limites » et « Accessibilité » présentes dans 40/40 contrats.
- **Points ouverts déclarés honnêtement** : « Points ouverts, à consigner comme tels » (`SF/08:1311`), « À CLARIFIER » (`SF/13:564`). Cela correspond à une bonne pratique de traçabilité des lacunes (IREB).

---

## 4. Dimension COMPLÉTUDE (capacités, règles transverses, ENF)

### 4.1 Bilan — **acceptable pour le fonctionnel, faible pour le non fonctionnel**

La couverture fonctionnelle est élevée (tableau §2) et les lacunes sont en grande partie déclarées.

En revanche, les **exigences non fonctionnelles** de l'app mobile sont surtout formulées comme des *principes d'architecture* ou des *conditions de test* (SF/12 §12.11, §12.18, §12.27), sans valeur cible ni comportement attendu. Les seuls seuils chiffrés concernent la sécurité temporelle (30 min / 2 h), les cibles tactiles (44 × 44) et les largeurs d'écran (360–440).

Sur les caractéristiques d'ISO/IEC 25010:2023 :
- **non couvertes** : efficacité de performance (temps de réponse, ressources, batterie) ;
- **peu couvertes** : compatibilité (coexistence audio), sécurité et confidentialité (effacement des données), flexibilité (versions minimales des OS).

### 4.2 Recherches mécaniques sur les ENF (ch. 05 / 10 / 12, puis corpus entier)

Comptes de lignes par `grep -ciE` ; « corpus » = SF/*.md + PRODUCT.md + DSF-*.md. Pour les termes ambigus, les occurrences ont été inspectées une à une.

| Sujet ENF (ISO 25010:2023) | Motif recherché | ch05 | ch10 | ch12 | Corpus | Lecture des occurrences | Classement |
|---|---|---|---|---|---|---|---|
| Performance — temps de réponse | `performance\|fluidit\|60 ?fps\|cold start` | 0 | 0 | 1 | 5 | ch12:470 = objet de test sans critère ; les autres = « performances » sportives (ch03, ch08) | **Manque démontré** |
| Fiabilité du minuteur — précision | `précision\|tolérance\|dérive\|écart maximal` | 1 | 1 | 3 | 23 | aucune tolérance temporelle (ms) ; ch12:560 « Fiabilité du timer \| Critique » sans valeur | **Manque démontré** (aucune tolérance de bip ou de transition) |
| Audio — mode silencieux | `silencieux\|sourdine\|mute` | 0 | 0 | 3 | 4 | uniquement des listes de tests | **Manque démontré** (QC-02) |
| Audio — appel / autre source | `appel téléphonique\|appel entrant\|interruption audio\|audio focus` | 0 | 0 | 0 | 0 | — | **Manque démontré** (QC-03) |
| Écouteurs / Bluetooth | `Bluetooth\|écouteurs` | 0 | 0 | 2 | 2 | tests uniquement | Sujet à confirmer |
| Écran maintenu allumé | `maintenu actif\|keep.?awake\|veille` | 0 | 0 | 0 | 1 | SF/09:724 seulement | **Manque démontré** pour la règle (QC-11) |
| Hors ligne | `hors ligne\|offline\|sans connexion` | 0 | 0 | 4 | 5 | SF/12:31 principe | Couvert (principe) |
| Sauvegarde / restauration / export | `iCloud\|Auto Backup\|sauvegarde (système\|automatique)` ; `exporter\|export des données` | 0 | 0 | 0 | 0 | sauvegarde : V3 (SF/05) ; perte acceptée (SF/12:247) | **Manque démontré** pour le MVP (QC-08) |
| Stockage plein | `espace (disque\|de stockage)\|stockage (plein\|insuffisant)` | 0 | 0 | 0 | 0 | — | Sujet à confirmer (cas d'erreur générique « erreur technique », SF/12 §12.17) |
| Batterie | `batterie\|énergie` | 0 | 0 | 0 | 0 | — | Sujet à confirmer (faible priorité MVP) |
| Accessibilité — lecteur d'écran | `VoiceOver\|TalkBack\|lecteur d.écran\|libellé accessible` | 0 | 1 | 0 | 6 | RM-164, contrats §18 | Couvert (partiellement) |
| Accessibilité — contraste | `WCAG\|4[.,]5 ?: ?1\|ratio de contraste` | 0 | 0 | 0 | 0 | « contrastes suffisants » (SF/12:1321) ; « contraste pastel » accepté (SF/07:338) | **Manque démontré** pour un seuil |
| Accessibilité — mouvement réduit | `réduire les animations\|reduce motion` | 0 | 0 | 0 | 5 | D-342 et suivantes, CE-UI-10 | Couvert |
| Localisation — fuseau / heure d'été | `UTC\|heure locale\|fuseau\|heure d.été\|changement d.heure` | 0 | 0 | 0 | 0 | — | **Manque démontré** (QC-09) |
| Localisation — format horaire 12/24 h | `AM/PM\|12 ?h\b\|format (d.heure\|horaire)` | 0 | 0 | 0 | 0 pertinent | les « 24 h » trouvés = plafond du rappel (D-243) ; seul exemple : « Heure Semaine « 08:00 » » (SF/05:252) | **Manque démontré** |
| Confidentialité | `confidentialit\|RGPD\|données de santé\|données personnelles` | 1 | 0 | 4 | 7 | 12.20 principes ; données de santé renvoyées à « ultérieurement » (SF/12:511) | Sujet à confirmer (QC-13) |
| Effacement des données par l'utilisateur | `effacer (mes\|les) données\|réinitialiser l.application\|désinstall` | 0 | 0 | 0 | 1 (hors sujet) | — | **Manque démontré** |
| Compatibilité — versions des OS | `version minimale\|iOS 1[0-9]\|Android 1[0-9]\|minSdk\|API level` | 0 | 0 | 0 | 0 | — | Sujet à confirmer (peut relever du plan technique) |
| Migration des données | `migration` | 1 | 1 | 24 | 62 | nombreuses mentions « à planifier » | Partiel (QC-10) |
| Horloge — changement manuel / redémarrage | `monoton\|horloge système\|reboot` | — | — | 2 | 5 | « ancres temporelles monotones » (SF/08:1050) contre « horloge système » (SF/12:311) | Sujet à confirmer (QC-14) |

### 4.3 Défauts concrets — COMPLÉTUDE

**QC-08 — Aucune exigence MVP de sauvegarde ou d'export, alors que la perte de données est reconnue**
- Verbatim : « Sans compte ni sauvegarde distante, la suppression de l'application ou la perte de l'appareil peut entraîner la perte de l'identité locale et des données associées. » — `SF/12 – Architecture technique.md:247` ; en parallèle, le besoin transverse dit : « - Une sauvegarde locale fiable et un historique immuable. » — `SF/02:153`.
- Recherche : sauvegarde système (iCloud / Android Auto Backup), export → 0 occurrence. **Manque démontré.**
- Référentiel : ISO/IEC 25010:2023 Fiabilité (récupérabilité) ; 29148 §5.2.5 (*unambiguous* : « fiable » n'est pas défini) ; GtWR R7.
- Conséquence : la décision d'inclure ou d'exclure la base SQLite et les médias de la sauvegarde de l'OS est implicite. Elle a pourtant un effet sur la confidentialité et sur la restauration lors d'un changement d'appareil.

**QC-09 — Localisation temporelle : fuseau, heure d'été et format 12/24 h absents**
- Verbatim (seul indice) : « Heure Semaine « 08:00 » ; aucune heure dans la carte du Suivi. » — `SF/05:252`.
- Recherche : `UTC|heure locale|fuseau|heure d.été|changement d.heure` → 0 sur le corpus. **Manque démontré.**
- Référentiel : ISO/IEC 25010:2023 Flexibilité (adaptabilité) ; 29148 §5.2.6 (*complete*).
- Conséquence : la planification (Routines répétées, rappels, « 08:00 ») et l'horodatage du Suivi n'ont pas de règle pour un voyage ou un changement d'heure. Un rappel peut se décaler d'une heure ou une occurrence peut être dédoublée. Le format 12 h, s'il est réglé sur l'appareil, est ignoré ou appliqué au hasard.

**QC-10 — Migration et compatibilité des données anciennes : principe posé, scénarios non spécifiés**
- Verbatim : « Pour D-208, la base de développement peut être **réinitialisée** […] Aucune exigence de migration utilisateur de l'ancien `recovery_seconds` n'est portée par cette conception. » — `SF/12:600` ; « Le schéma physique et sa migration sont à implémenter, pas réputés présents du fait de cette cible. » — `SF/09:1156`.
- Point fort associé : « Le format physique de stockage doit permettre de relire les anciens Instantanés même après une évolution du modèle de données. » (`SF/12:418`) ; « Échec stockage/migration : signaler échec selon architecture, sans effacer les données. » (`SF/13:2559`).
- Référentiel : 29148 §5.2.5 (*complete*) ; ISO/IEC 25010:2023 Maintenabilité (modifiabilité), Fiabilité.
- Classement : **sujet à confirmer**. Si aucune version n'a été installée chez des utilisateurs, la réinitialisation est légitime. Le corpus ne précise pas à partir de quelle version une migration des données utilisateur devient obligatoire.

**QC-11 — Attribut « Écran maintenu actif » sans règle ni contrat**
- Verbatim : « | Écran maintenu actif | Empêche la mise en veille pendant une exécution de séance | Facultatif | Pendant l'exécution uniquement | » — `SF/09:724`.
- Recherche : `maintenu actif|keep.?awake|veille` → 1 seule occurrence dans le corpus. RM-085 (`SF/10:163`) énumère les préférences sans cet attribut. **Manque démontré** de règle, de valeur par défaut et de contrat d'écran.
- Référentiel : IREB CPRE FL (traçabilité entre exigence et donnée) ; 29148 §5.2.6.
- Conséquence : on ne sait pas si l'écran s'éteint pendant une Exécution. C'est pourtant déterminant pour la lisibilité du minuteur et pour la batterie.

**QC-12 — Planification : capacité annoncée en MVP dont des règles sont explicitement non définies**
- Verbatim : « Ne définit pas les règles Jour/Mois. » — `SF/10:85` (RM-047) ; « Leur extension à une Routine contenant d'autres contenus est **non définie** » — `SF/10:3`.
- Référentiel : 29148 §5.2.6 (ensemble *complete*, *feasible*) ; IREB (gestion des exigences ouvertes).
- Classement : manque **déclaré par l'auteur**. Le défaut tient à l'écart entre le périmètre annoncé (« unité Jour/Semaine/Mois », SF/05 §V1) et l'absence d'une échéance ou d'une condition de blocage pour clore ces points.
- Conséquence : un développeur ne peut pas livrer Jour/Mois (fin de mois, ancrage) sans inventer des règles.

**QC-13 — Confidentialité : données de santé renvoyées au futur, alors que le MVP vise la rééducation**
- Verbatim : « Si des comptes utilisateurs, une synchronisation cloud ou des données de santé sont introduits ultérieurement, une revue spécifique de sécurité et de protection des données devra être réalisée » — `SF/12:511`.
- Contexte : le MVP cible déjà la rééducation et la santé quotidienne (SF/02 §1). Il stocke un Ressenti obligatoire et des photos ou vidéos locales, et Sentry est prévu (`SF/12:491`). Aucune fonction d'effacement des données n'est spécifiée (recherche : 0).
- Référentiel : ISO/IEC 25010:2023 Sécurité (confidentialité) ; 29148 §5.2.5 (*necessary* / *complete*).
- Classement : **sujet à confirmer**. La qualification juridique du Ressenti et des médias comme « données de santé » doit être arbitrée. Elle n'est pas tranchée ici.

**QC-14 — Performance et précision temporelle non quantifiées**
- Verbatim : « | Fiabilité du timer | Critique | Le moteur d'exécution est une fonction centrale du produit | » — `SF/12:560` ; « | Tests sur appareils réels | Audio, arrière-plan, verrouillage, notifications, performances | » — `SF/12:470`.
- Recherche : aucune tolérance en ms ni aucun temps de réponse (tableau §4.2). **Manque démontré.**
- Point lié, **sujet à confirmer** : la source d'horloge. Le ch. 08 parle d'« ancres temporelles monotones » (`SF/08:1050`) et le ch. 12 d'« horloge système » (`SF/12:311`). Le comportement en cas de redémarrage de l'appareil ou de changement manuel de l'heure n'est pas spécifié.
- Référentiel : ISO/IEC 25010:2023 Efficacité de performance (comportement temporel) ; GtWR C7 (vérifiable) ; 29148 §5.2.5 (*verifiable*).
- Conséquence : un bip émis 400 ms trop tard, ou un écran d'Exécution qui met 3 s à s'ouvrir, ne peut être ni accepté ni refusé objectivement.

**QC-15 — Accessibilité : principes qualitatifs sans seuil**
- Verbatim : « - contrastes suffisants ; » — `SF/12:1321` ; « - support raisonnable de l'agrandissement système du texte sans casser les écrans critiques. » — `SF/12:1324`.
- Recherche : `WCAG|4,5:1|ratio de contraste` → 0 (un seul ratio est cité pour un token : `color.selection` 4,78:1, SF/12:861).
- Référentiel : GtWR R7 (termes vagues : « suffisants », « raisonnable ») ; 29148 §5.2.5 ; ISO/IEC 25010:2023 Capacité d'interaction (inclusivité).
- Conséquence : la « revue d'accessibilité avant livraison » (12.31) n'a pas de critère de réussite. Il manque aussi le facteur d'agrandissement maximal à tester et la liste des « écrans critiques ».

### 4.4 Points forts — COMPLÉTUDE

- **Hors ligne et local-first posés comme principes structurants** : « | Fonctionnement hors ligne | Toutes les fonctions principales du MVP fonctionnent hors connexion | » (`SF/12:31`).
- **Cibles tactiles quantifiées et uniformes** : RM-095, 44 × 44 points logiques sur iOS et Android (`SF/10:178`).
- **Notifications** : permission demandée au moment de l'usage, et refus géré (RM-051…RM-053 ; SF/12 §12.13 « fenêtre glissante »).
- **Compatibilité de l'historique** : instantanés JSON immuables relisibles après une évolution du schéma (`SF/12:418`) ; lecture versionnée de l'ancien TO_FAILURE (`SF/09:1198`).
- **Validation sur appareils réels imposée** (RT-001, RT-003, `SF/12:474`) : le risque est bien identifié, même si les critères manquent.
- **Mouvement réduit pris en compte** dans les décisions D-342 et suivantes et dans les contrats.

---

## 5. Recommandations priorisées

| Prio | Recommandation | Défauts | Effort |
|---|---|---|---|
| P1 | Rédiger un **contrat d'écran « Reprise d'une Exécution interrompue »** : déclencheur, position de reprise (persistée ou recalculée), interaction avec la pause de sécurité, recette | QC-04, QC-05 | moyen |
| P1 | Remplacer « dans la mesure permise par le système » par un **comportement nominal et un comportement de repli** (à confirmer par les résultats RT-001, à consigner) | QC-01 | moyen |
| P1 | Spécifier les **interruptions venant du système** : appel, autre application audio, mode silencieux, écouteurs (une règle par cas, statut de l'Exécution, son et annonces) | QC-02, QC-03 | moyen |
| P1 | Définir la **granularité de persistance de l'Exécution** (événements écrits, perte maximale admise) et la garantie minimale en cas d'échec d'écriture | QC-05 | faible |
| P2 | Ajouter des **ENF chiffrées** : tolérance des bips et transitions, temps d'ouverture de l'Exécution, seuil de contraste, facteur d'agrandissement du texte | QC-14, QC-15 | moyen |
| P2 | Règles de **localisation temporelle** : fuseau de référence des Routines, heure d'été, format 12/24 h | QC-09 | faible |
| P2 | Spécifier l'**appui sur une notification de rappel** et le contenu de celle-ci | QC-07 | faible |
| P2 | Décider de la **sauvegarde système (inclusion ou exclusion)** et de l'**effacement des données** au MVP | QC-08, QC-13 | faible (décision) |
| P2 | Donner une règle ou retirer l'attribut **« Écran maintenu actif »** | QC-11 | faible |
| P3 | Restructurer les parcours du ch. 03 selon un gabarit (acteur, préconditions, garanties, nominal, extensions) qui **renvoie** aux RM et CE au lieu de les paraphraser | QC-06 | fort |
| P3 | Échéancier des points ouverts de planification (Jour/Mois, multi-contenus) avec une condition de blocage avant développement | QC-12 | faible |
| P3 | Préciser le seuil de version à partir duquel la **migration des données utilisateur** devient obligatoire, et les versions minimales iOS/Android | QC-10 | faible |

---

## 6. Exemples AVANT / APRÈS

Les réécritures n'inventent aucune valeur. Les éléments manquants sont marqués [À CONFIRMER].

### Exemple 1 — Guidage en arrière-plan (QC-01)

**AVANT** (`SF/05:57`) :
> Le guidage sonore doit, dans la mesure permise par le système d'exploitation, continuer lorsque l'écran est verrouillé ou que l'application fonctionne en arrière-plan.

**APRÈS** :
> **ENF-AUDIO-01 — Guidage sonore écran verrouillé.** Pendant une Exécution `En cours`, lorsque l'écran est verrouillé ou que l'application passe en arrière-plan, l'application émet les bips et les annonces vocales prévus par le Plan d'Exécution, avec un décalage d'au plus [À CONFIRMER] ms par rapport à leur instant théorique.
> **Repli** : si la plateforme [À CONFIRMER : iOS et/ou Android, version] empêche l'émission audio, l'application [À CONFIRMER : comportement retenu après RT-001], et l'état reste recalculé au retour (RM-067).
> **Vérification** : essai sur appareil réel iOS et Android (RT-001), écran verrouillé pendant [À CONFIRMER] min.

### Exemple 2 — Reprise après interruption technique (QC-04)

**AVANT** (`SF/10:116`, RM-064) :
> Après une interruption technique d'une Exécution en cours, l'utilisateur doit choisir `Reprendre la séance` ou `Arrêter la séance` avant d'en démarrer une nouvelle.

**APRÈS** :
> **Cas d'utilisation — Reprendre une Exécution interrompue par le système.**
> *Acteur* : utilisateur. *Déclencheur* : ouverture de l'application alors qu'une Exécution persistée a le statut `En cours`.
> *Préconditions* : une seule Exécution `En cours` existe (09:590).
> *Garantie minimale* : l'Exécution, son Instantané et ses résultats déjà persistés ne sont ni modifiés ni supprimés tant que l'utilisateur n'a pas choisi.
> *Nominal* : 1. L'application affiche [À CONFIRMER : dialogue ou écran, emplacement] avec `Reprendre la séance` et `Arrêter la séance`. 2. `Reprendre` restaure la position [À CONFIRMER : persistée, ou recalculée selon RM-067 en appliquant la pause de sécurité RM-068/069]. 3. `Arrêter` clôt au statut `Interrompue` (12.33).
> *Extensions* : 2a. Aucune action → [À CONFIRMER]. 2b. L'utilisateur tente de démarrer une autre Exécution → refus avec [À CONFIRMER : message].

### Exemple 3 — Accessibilité (QC-15)

**AVANT** (`SF/12:1321–1324`) :
> - contrastes suffisants ;
> - support raisonnable de l'agrandissement système du texte sans casser les écrans critiques.

**APRÈS** :
> **ENF-ACC-01** — Tout texte de l'interface présente un rapport de contraste avec son fond d'au moins [À CONFIRMER : valeur et référentiel], hors exceptions listées [À CONFIRMER : liste, dont le « contraste pastel » accepté par 07:338].
> **ENF-ACC-02** — Avec l'agrandissement système du texte réglé à [À CONFIRMER : niveau maximal testé], les écrans [À CONFIRMER : liste nominative, par exemple CE-EXEC-SESSION-01, CE-UI-08] affichent sans troncature le temps, la phase et l'action principale. Le reste du contenu est accessible par défilement.

### Exemple 4 — Mode silencieux (QC-02)

**AVANT** (`SF/12:344`) :
> - téléphone en mode silencieux ;

**APRÈS** :
> **ENF-AUDIO-02 — Interrupteur de sourdine.** Lorsque l'appareil est en mode silencieux et que la préférence `Sons` est activée, les bips de l'Exécution [À CONFIRMER : sont émis malgré la sourdine / ne sont pas émis]. Les annonces vocales [À CONFIRMER]. Si `Vibration` est activée, les vibrations fonctionnelles [À CONFIRMER : remplacent ou accompagnent les bips].
> *Vérification* : appareil réel iOS (interrupteur physique) et Android (mode Ne pas déranger / vibreur), conformément à RT-003.

*Variante au format OpenSpec (convention d'outil, facultative)* : la même exigence peut s'écrire `### Requirement:` puis `#### Scenario: mode silencieux` WHEN/THEN. Ce choix de forme ne change rien au fond ci-dessus.

---

## 7. Récapitulatif : manque démontré ou sujet à confirmer

| ID | Sujet | Classement | Recherche justificative |
|---|---|---|---|
| QC-02 | Mode silencieux (comportement) | Manque démontré | `silencieux\|sourdine\|mute` : 4 occurrences, toutes des listes de tests |
| QC-03 | Appel entrant / focus audio | Manque démontré | 0 occurrence |
| QC-04 | Contrat d'écran de reprise après interruption | Manque démontré | « Reprendre la séance » : 0 occurrence dans SF/13 |
| QC-05 | Granularité de persistance de l'Exécution | Manque démontré | `checkpoint` : 1 occurrence (SF/13), 0 dans SF/12 |
| QC-07 | Appui sur la notification et contenu | Manque démontré | 3 motifs, 0 occurrence |
| QC-08 | Sauvegarde système / export au MVP | Manque démontré | 0 occurrence |
| QC-09 | Fuseau / heure d'été / format 12-24 h | Manque démontré | 0 occurrence |
| QC-11 | Règle « Écran maintenu actif » | Manque démontré | 1 seule occurrence (SF/09:724) |
| QC-14 | Tolérance temporelle / performance | Manque démontré | aucune valeur en ms ; seule mention = objet de test |
| QC-15 | Seuil de contraste | Manque démontré | `WCAG\|ratio de contraste` : 0 |
| QC-01 | Repli audio en arrière-plan | Sujet à confirmer (dépend de RT-001, dont le résultat n'est pas consigné) | « RT-001 » : 2 occurrences, aucun résultat |
| QC-10 | Migration des données utilisateur | Sujet à confirmer (base installée ?) | 62 mentions, aucun scénario utilisateur |
| QC-12 | Planification Jour/Mois, multi-contenus | Manque **déclaré** par l'auteur | SF/10:3, :85 ; SF/08:1311 |
| QC-13 | Données de santé / effacement | Sujet à confirmer (qualification juridique) | 7 occurrences, renvoi au futur |
| — | Versions minimales des OS, batterie, stockage plein, Bluetooth | Sujet à confirmer (peut relever d'un plan technique hors corpus) | 0 occurrence chacun (Bluetooth : 2, en tests) |
| — | Horloge après redémarrage ou changement manuel de l'heure | Sujet à confirmer | « monotone » (SF/08:1050) / « horloge système » (SF/12:311) |

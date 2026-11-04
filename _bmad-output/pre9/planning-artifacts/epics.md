# PRE-9 — Epics et stories — base Formats du 2 novembre 2026

**État déclaré par Hermann le 02/11/2026 :** B.4c (en-têtes collants), B.7, B.8 et B.9 sont **développés et recettés**. La pause antérieure de B.8 est levée ; ne pas refaire ni supprimer ce qui est livré. C.2–C.4 ont été arrêtés avant poursuite pour cette mise à jour. Les nouvelles règles peuvent nécessiter des adaptations ciblées de C.1/D.1 et des calculs, sur écart prouvé ; ce n’est pas une réouverture générale des lots recettés. La présence des livraisons sur `main` n’est pas présumée : Claude doit préserver sa branche de développement et y intégrer cette base documentaire.

> **Statut : plan validé par Hermann le 29/10/2026** (révision 2, après la revue ChatGPT ; mission « KODJO — PRE-9 : lancement du développement BMAD ») ; développement sur `pre9-bmad/dev`, suivi dans `implementation-artifacts/sprint-status.yaml`. [28–29/10 : « plan en revue (ChatGPT, puis Hermann). Aucune story n'est lancée. »] Références : `prd-pre9.md`, `architecture-pre9.md`, `arbitrages-pre9.md`, `etat-initial-et-ecarts.md`. Chaque story applique la règle permanente de synchronisation code / documentation (classe A à D consignée dans sa spec ; documentation de classe B mise à jour dans la même livraison).
>
> **Révision 1 du 29/10/2026** : décisions de Hermann intégrées (`arbitrages-pre9.md` §0) ; aucune story ajoutée, supprimée ni fusionnée ; A.5 devient conditionnelle ; Q.0 sort du chemin critique. Le plan compte **29 unités de travail** : 24 stories de développement (A.1–A.5 dont A.5 conditionnelle, B.1–B.9, C.1–C.6, D.1–D.4), 3 unités documentaires (D.5, DOC.0, DOC.1) et 2 activités de qualification (Q.0, Q.1). [Le compte rendu du 28/10 annonçait « 31 stories » : erreur de décompte, corrigée.] Les passages remplacés sont annotés entre crochets.

**Source active :** [référence active Formats du 02/11/2026](../../../docs/KODJO-Formats-entrainement-2026-11-02.md). Tous les écrans, le parcours et plusieurs règles Formats ont évolué. Relire ce périmètre avant reprise ; les anciennes prescriptions exclusivement Exercice et les anciens verrous ne font plus foi.

## Menu Créer — règle active

Le menu Créer propose cinq options, dans cet ordre : **Créer un exercice**, **Utiliser des mouvements existants**, **Utiliser un format d’entraînement**, **Ajouter un circuit**, **Ajouter un cycle**. L’accès Formats ouvre une fenêtre sur fond voilé, grille à deux colonnes sans cartes Un exercice/Une séance ni départ Libre. MENU-FMT-01 et ARB-05 sont remplacés dans cette portée. Le bouton + devient Annuler, croix grise 34 px au même emplacement ; les règles d’axe, de voile et de fermeture sont conservées. Utiliser une séance existante n’est plus une option de ce menu ; le comportement B.8 déjà livré n’est pas supprimé par cette nouvelle liste.

À l’ouverture, le bouton + « Ajouter une activité » devient Annuler : croix standard sur fond gris, 34 px, à l’emplacement exact du + et au-dessus du voile. Le toucher ferme le menu sans action ; la fermeture rétablit +. Le bouton Pause / Ajouter un arrêt conserve sa place à gauche, sous le voile. [Précisé le 01/11/2026 — recette iPhone PRE-9 de Hermann : « la zone de contexte doit être sous le voile grisé, seuls le bouton créer -> annuler, et les options doivent être visible dessus » : toute la zone de contexte est sous le voile ; seuls Annuler (le + transformé), l’axe et les options sont au-dessus.] Un axe vertical, au-dessus du voile et sous les options, relie Annuler aux icônes et s’arrête à Ajouter un cycle. Aucune option Annuler n’est ajoutée à la liste.

L’écran ouvert par « Créer un exercice » porte ce même titre. Le bouton de confirmation du mouvement sélectionné porte « Créer un exercice ». Les cartes de suggestion conservent les composants et règles du parcours de recherche existant ; ce libellé ne renomme pas les actions distinctes de correction ou de création d’un Mouvement dans les autres contextes.

**MENU-FMT-01 — remplacée :** le parcours actif est celui de la fenêtre Formats et du menu à cinq options ci-dessus.

Les exigences de menu ci-dessous se lisent avec cette règle ; aucune story ne doit réintroduire une entrée retirée.

## Ordre de reprise

B.4c, B.7, B.8, B.9 : terminés et recettés selon Hermann. Reprise : lecture complète de la nouvelle base → contrôle ciblé et adaptation de C.1/D.1 si requis → C.2 → C.3 → C.4 → **recette iPhone n°3** → C.5 → C.6 → D.2 → D.3 → D.4 → D.5 → A.4 (migration 020 annoncée, à vérifier sur la branche) [renumérotée 021 le 03/11/2026, Hermann : « 020, A.4→021, A.5→022 » ; 020 = modèle d'origine des Circuits, recette n° 3] → A.3 → DOC.1 → Q.1 → recette de fin PRE-9. [04/11/2026 : A.4 abandonnée (Hermann) ; A.3 suit D.5.] [04/11/2026, seconde instruction de Hermann : « Hermann abandonne la conversion sans perte prévue par A.4 : les anciens exercices concernés par cette conversion peuvent être supprimés plutôt que migrés. » A.3 commence par ce nettoyage (migration 021).]

A.1/B.1/B.2/B.3/B.4 fournissent la structure multi-conteneurs : les réutiliser, ne pas reconstruire une Composition mono-Circuit. Les livraisons antérieures non vérifiées sur la branche locale sont rapprochées de l’état déclaré, sans les reclasser arbitrairement backlog. A.5 reste conditionnelle ; aucun moteur PRE-10/11 n’est ajouté à PRE-9.

## Epic CAT — Catalogues (extension PRE-9 indépendante)

### CAT.1 — Zones de contexte des Catalogues Mouvements et Séances

**Exécution dès PRE-9**, sans dépendance au moteur ni à la Composition de Séance. Décision fonctionnelle validée le 30/10/2026.

**Spécification complète, source de vérité de développement :** [KODJO — Zones de contexte des Catalogues — PRE-9](../../../docs/KODJO-Zones-contexte-catalogues-PRE9-2026-10-30.md), et **CE-CAT-CTX-01** (chapitre 13). Sources Figma `10266:20575`, `10465:23141`, `10495:24099`, `1992:9910`, `4549:6742`.

**Livrer :** bande lilas y=92..207 à 402×874 ; compteurs à x24/y118 ; recherche x16/y155 de 216×44 pt (107×44 en filtré/archivé), placeholder « Rechercher » en 15 pt #7A7A80 ; Filtre/Tri/Créer visuels 34 pt à x260/306/352, y160, touchers 44×44 ; titre de page masqué ; deux compteurs filtrants et exclusifs « N familles · N mouvements » avec décompte des cartes affichées, sans compter les membres cachés ; « Un exercice N | Plusieurs N », bascule existante inchangée et nombres informatifs ; « N résultats » en filtré/archivé, bord droit x378, calcul live après recherche et filtres, singulier pour 1 seulement. Couleurs, graisses, espacement, sources de données et tous les états suivent la spécification complète.

**Tests ciblés :** géométrie et cibles à 402×874 ; navigation et titres ; bascule/désélection mutuellement exclusive Mouvements ; non-régression des vues Séances ; valeurs dérivées des cartes réellement affichées (piles déployées/repliées, archives, 0 résultat, recherche croisée) ; calcul de « N résultats » et accords 0/1/2 ; cumul des critères et actions Filtre/Tri/Créer.

**Livraison :** modifications applicatives ciblées et tests associés ; synchronisation de la documentation dans la même livraison, sans modifier Figma, sans recréer des données fixes de maquette ni modifier les règles de catalogues hors zone.
### CAT.2 — Résultats de recherche des Mouvements : cartes Résultat et Composition

**À réaliser immédiatement dans PRE-9**, indépendamment du moteur et de la persistance des Formats. N'altère pas CAT.1 ; les deux stories peuvent avancer sans dépendance fonctionnelle nouvelle.

**Référence complète :** [Résultats de recherche des Mouvements — PRE-9](../../../docs/KODJO-Resultats-recherche-mouvements-PRE9-2026-10-30.md), contrat CE-MVT-RESULT-01, maquettes `10415:21713`, `10415:21814`, `10415:21916`, `10415:21939`, `9882:19049`, `10175:20349`, `10131:21995`.

**Livrer :** carte de Résultat de création Mouvement, bouton « Ajouter un niveau » (66 × 32 pt à x264 ; tactile 78 × 36 pt x258/y31), description 179 pt ; carte Composition sans bouton, 338 × 73 pt, description 253 pt et deux lignes ellipsées, sur tous ses emplois ; regroupement par filet bleu (x3, largeur 2 pt, centres des cartes extrêmes) ; état Niveau avec unique carte 338 × 104 pt, quatrième ligne « Plus facile | Plus difficile », contrôles, séparateur et hauteur de liste spécifiés ; aucune commande « Utiliser ce mouvement » ni second cadre dans cet état.

**Tests et recette :** vérifier les deux contextes de création séparément, les états nom déjà utilisé/options, la liste de cinq exemples sans en figer les valeurs, les six regroupements, l'ouverture/fermeture du choix de Niveau, la création seulement après validation, et les non-régressions clavier, recherche, familles, classement, filtres et Composition. Aucun changement des autres écrans (planification, Profil, Suivi, archivage Séances) au titre de CAT.2.

**Livrable :** code et tests ciblés, preuve de comparaison Figma, modification documentaire de classe B synchronisée, compte rendu des écarts. Pas de fusion dans `main` sans accord explicite.


---

## Epic Q — Qualification transverse

### Q.0 — Vérification globale fractionnée (dette PRE-8)
Activité distincte, **hors chemin critique** : ne bloque ni la validation du plan ni A.1. [28/10 : « recommandée avant A.1 » ; « toute anomalie est qualifiée avant de démarrer A.1 » — remplacé le 29/10.]
- Suite Jest complète exécutée par lots (domaines, infrastructure, fonctionnalités) et ESLint global ; résultats consignés.
- Toute anomalie est qualifiée (PRE-8 ou préexistante) et traitée séparément ; une anomalie qui touche une story en cours lui est signalée.

### Q.1 — Qualification de fin de PRE-9
- Suite complète fractionnée et ESLint verts ; recette iPhone ciblée (§ Stratégie) validée par Hermann ; critères de sortie du PRD vérifiés.

---

## Epic A — Séance simplifiée

### A.1 — Brouillon, service et dépôt sur la structure générale (fondation)
Dépend de : —. Arbitrages : —. Migration 016.
- Le brouillon porte une `SessionStructure` ; création, modification, consultation, duplication et réouverture passent par le chemin structuré.
- **Exercices directs de Cycle** représentés dans le domaine et en base (D-451 « Cycle : Exercices directs et Circuits » ; lacune constatée le 29/10 : `StructureCycle` ne porte que des Circuits, `activities` n'a pas de `cycle_id`) ; emplacement de Point d'arrêt à l'intérieur d'un Cycle (`session_stop_points.cycle_id`, ARB-06). Migration 016 testée en mémoire et sur copie de base réelle.
- Une Séance existante (ancien modèle) se rouvre à l'identique ; une Séance à Cycles (avec Exercices directs) et multi-Circuits (créée en test) se rouvre, se consulte et se duplique sans erreur.
- L'écran de Composition conserve exactement son comportement actuel (tous les tests d'intégration existants verts) : le changement est interne.
- Réserve de séries par Circuit ; points d'arrêt de l'ancien modèle conservés à leurs positions.

### A.2 — Créer un Exercice depuis un Mouvement
Dépend de : A.1, B.2 (menu Créer). Arbitrage : ARB-22a.
- « Créer un exercice » ouvre l’éditeur du même titre ; la saisie du nom propose les Mouvements existants ; la confirmation du Mouvement sélectionné porte « Créer un exercice ». [01/11/2026, recette iPhone : l’accès séparé « Utiliser un mouvement existant » est rétabli dans le menu Créer, 2e option.] Aucun accès séparé Utiliser un mouvement existant. [29/10, recette n° 1 (Hermann) : l'Exercice est posé « Paramètres à compléter » ; toucher sa carte ouvre ses paramètres] (annotation PRE-9 portée sur l’ancienne formulation, à réexaminer)
- Plus aucune lecture d'`activity_definitions` dans la Composition ; `ActivitySelectionScreen` et les parcours `catalogueDefinitionId` ne sont plus atteignables depuis la Composition.

### A.2b — Durées des phases portées par le Mouvement
Ajoutée le 30/10/2026 à la demande de Hermann (contre-recette PRE-9 n° 1) ; placée après B.3 par sa décision du 30/10 (« Story dédiée après B.3 »). Dépend de : A.2. Remplace DSF Mouvements §2 « sa durée n'est pas une propriété du mouvement » et MVT-09 « aucune durée […] sur la fiche ».
- Demande, texte de Hermann : « Créer un mouvement : les durées de la phase peuvent faire partie du mouvement, si elles sont renseignées elles sont reprises par défaut et peuvent être changées dans la séance, si elles n'existent pas elles sont à renseigner dans la séance. »
- Durée facultative par phase dans la fiche Mouvement ; reprise par identité stable de phase dans un nouvel Exercice ; modification locale dans la Séance sans effet sur le Mouvement. À préciser avant développement : effet d'une modification ultérieure des durées du Mouvement sur les Exercices existants (règle proposée : aucun) ; persistance (forme du stockage des phases). [31/10/2026, Hermann : modification ultérieure des durées du Mouvement — « Inchangés » : les Exercices existants gardent leurs durées locales ; les durées du Mouvement ne servent que de valeurs par défaut à la création d'un Exercice. Persistance : choix technique (classe D).] [31/10/2026, Hermann : « Oui, migration 018 (Recommandé) » — « Colonne ajoutée, existant intact (durées vides), preuves de conservation, d'échec et de reprise ; A.4 → 019, A.5 → 020, plan annoté. » Réalisation : `_bmad-output/pre9/implementation-artifacts/spec-a-2b-durees-phases-mouvement.md`.]

### A.4 — Conversion E.8-b — **ABANDONNÉE le 04/11/2026**
[04/11/2026, Hermann, 04/11/2026 : « A.4 n'est pas nécessaire si c'est une migration. On peut supprimer ces entrées. » ; puis, au choix proposé : « Les laisser, inutilisées » — **A.4 abandonnée** : aucune conversion des anciens Exercices autonomes (`activity_definitions`) en Séances, aucune migration 021 pour cela, aucune suppression par le code. Les lignes restent dans la table, sans parcours actif après A.3 ; leur effacement relève seulement de A.5 (suppression de la table), avec autorisation explicite de Hermann.] [04/11/2026, seconde instruction de Hermann, qui remplace « Les laisser, inutilisées » et « aucune suppression par le code » : « Hermann abandonne la conversion sans perte prévue par A.4 : les anciens exercices concernés par cette conversion peuvent être supprimés plutôt que migrés. » A.4 reste abandonnée (aucune conversion) ; les anciennes définitions sont supprimées par la migration 021, prérequis de A.3.]
Dépend de : A.2. Arbitrage : ARB-01 (**validé**, révision 2). Migration 020 (état annoncé par Hermann ; contrôler la branche avant exécution). [03/11/2026, recette iPhone n° 3, Hermann : « 020, A.4→021, A.5→022 » : migration **021** ; 020 = modèle d’origine des Circuits.]
- Conversion automatique et transactionnelle, testée sur copie de base réelle : chaque définition devient une Séance d'un Exercice (titre Q-E1), Mouvement, paramètres, médias, associations et autres données pertinentes conservés ; annulation complète en cas d'échec ; rapport dans `migration_notices` ; comptage et comparaison source → Séances consignés (preuve réutilisée par A.5).
- [03/11/2026, Hermann : les définitions ne bloquent plus l'archivage d'un Mouvement — registre ch. 07, « Archivage d'un Mouvement utilisé seulement dans des Séances archivées ». La conversion doit donc accepter une définition dont le Mouvement est archivé : la Séance produite référence ce Mouvement archivé, sans le restaurer.]
- **Aucune ligne historique n'est retirée ni supprimée** par la conversion. [28/10 : « retrait de la définition dans la même transaction » — remplacé le 29/10 : conversion distinguée de la suppression.]
- [Révision 1 : « Si ARB-01 retient l'option B ou C, la story est réécrite » — sans objet, option A validée.]

### A.3 — Retrait des parcours d'Exercices autonomes
Dépend de : A.4. [04/11/2026 : A.4 abandonnée ; dépend de A.2. Les définitions restantes ne sont ni converties ni supprimées.] [04/11/2026, seconde instruction de Hermann : « Hermann abandonne la conversion sans perte prévue par A.4 : les anciens exercices concernés par cette conversion peuvent être supprimés plutôt que migrés. » — « ni supprimées » est remplacé : **prérequis de A.3 = nettoyage des anciennes définitions**, migration **021** (suppression de toutes les lignes, table conservée vide, transaction unique du démarrage, sans avis) ; Mouvements, Séances, historique et instantanés conservés.] [Révision 1 : « la décision ARB-01 ; si option A, de A.4 » — ARB-01 validé.]
- Commande « Modifier » (E.8-a), parcours `/exercise?catalogueDefinitionId=` et écritures `ActivityDefinitionService` retirés ; `ExerciseScreen` limité à l'édition d'un Exercice de Séance ; `ActivityDefinitionService` réduit aux services Mouvements et référentiels encore utilisés (ou renommé).
- Test de garde : plus aucune lecture ni écriture d'`activity_definitions` hors migration. [04/11/2026 : réalisé — `src/infrastructure/database/__tests__/legacyDefinitionsGuard.a3.test.ts` ; restent autorisés les migrations, le séquenceur, l'historique des versions et les preuves des migrations historiques.]
- [04/11/2026, réalisation : gardes du Mouvement (suppression, suppression depuis les Archives, comptes d'Exercices liés, compte d'usage, reprise des valeurs par défaut) limitées aux Exercices des Séances ; `Category.isUsed` = Catégorie référencée par au moins un Mouvement, archivé ou non — règle conservatrice **À CLARIFIER** (classe C).]

### A.5 — Retrait de la table des définitions (**conditionnelle**)
Dépend de : A.3. Arbitrage : ARB-01. Migration 019. [31/10/2026, Hermann, 31/10/2026 : « Oui, migration 018 (Recommandé) » — « A.4 → 019, A.5 → 020, plan annoté » : migration **020**.] [31/10/2026, recette iPhone n° 2 (constat e, décision de Hermann du 31/10) : migration 019 attribuée à la marque « Paramètre à vérifier » : migration **021**.] [03/11/2026, recette iPhone n° 3, Hermann : « 020, A.4→021, A.5→022 » : migration **022**.] [04/11/2026 : la 021 est prise par le nettoyage des anciennes définitions (A.3) : migration **023 (022 réservée au nom du Circuit)**.] **Hors engagement PRE-9 par défaut.** [04/11/2026 : toujours **non autorisée** ; la seconde instruction de Hermann du 04/11 (« Hermann abandonne la conversion sans perte prévue par A.4 : les anciens exercices concernés par cette conversion peuvent être supprimés plutôt que migrés. ») autorise la suppression des lignes (A.3, migration 021), pas celle de la table.]
- Lancée seulement si trois conditions sont réunies : (1) justification de non-utilisation — le test de garde de A.3 est vert et aucun parcours ne lit la table ; (2) conservation des données démontrée — comptage et comparaison source → Séances sur copie de base réelle (A.4) [04/11/2026 : sans objet, A.4 abandonnée ; la suppression de la table effacerait les définitions non converties, ce que l'autorisation (3) doit couvrir explicitement] ; (3) autorisation explicite de Hermann.
- Sinon la table est conservée, sans parcours actif ; l'état est consigné à la clôture de PRE-9.
- Si lancée : migration distincte supprimant `activity_definitions` et `activity_definition_body_zones` ; garde de non-régression sur toutes les migrations antérieures.
- [28/10 : « Dépend de : A.3, une version stable » — reclassée le 29/10 : la suppression n'est pas automatiquement autorisée.]

---

## Epic B — Composition D-451

### B.1 — Rendu de la structure : Cycles, Circuits, Exercices directs
Dépend de : A.1. Arbitrages : ARB-12, ARB-13, ARB-19 (décidés).
- Affichage des trois niveaux, Exercices directs de Séance et de Cycle, en-têtes (nom, chevron, compteur, durée), lettres (pas de lettre pour un conteneur unique ; après Z : AA, AB…, réattribuées selon l'ordre de Composition — ARB-13), hiérarchie par les fonds, Circuit replié (seconde ligne des noms, 68 pt), Cycle non repliable — Figma `10717:20056`, `10725:20142`, `10744:20108`.
- État replié/déplié non persisté ; Circuit déplié à l'ouverture ; **aucun contenu du brouillon perdu pendant un repli** (ARB-12). En position repliée, la deuxième ligne existante liste les noms des Exercices et leur Format éventuel (Figma `10717:20056`, `10725:20142`) ; déplié, les cartes individuelles restent visibles ; Circuit standard sans Format commun ; Circuit porteur présenté selon la référence du 02/11, AMRAP en blocs et Death by alterné sans durée d’en-tête.
- Circuit standard et Cycle : comptes finis selon règles existantes ; nature du Circuit standard éditable. Circuit porteur : nature fixée et réglages applicables selon la référence active ; Death by ouvert, AMRAP en blocs.
- Composants existants réutilisés (`CircuitHeader`, `OccurrenceCard`, `DisclosureControl`, stepper) ; un rendu non dessiné qui empêche une décision est signalé précisément, sans blocage général (ARB-19).

### B.2 — Menu Créer et création par enveloppe
Dépend de : B.1. Arbitrages : ARB-06, ARB-07 (décidés).
- Menu Créer : cinq options et bouton +/Annuler selon CE-T03-08 et la règle active ci-dessus. Nouvelle occurrence après le dernier Exercice entré, dans son conteneur ; création par enveloppe inchangée.
- « Ajouter un circuit / un cycle » : l'utilisateur **pose le conteneur sur un premier contenu** ; le conteneur est créé autour de ce contenu ; jamais de conteneur vide ; une Séance commence sans Circuit (D-451 « aucun cycle implicite », COMP l.19, ch09 l.134 ; rendu Figma `10818:20175`). Contenus éligibles, déduits des règles d'imbrication D-451 : pour un Circuit, un Exercice du niveau Séance ou d'un Cycle ; pour un Cycle, un Exercice ou un Circuit du niveau Séance. Circuit posé sur un Exercice formaté : compatibilité de Circuit standard selon la référence active, sans promotion implicite vers Circuit porteur ; aucun refus global hérité d’ARB-27.
- Le rendu Figma du mode enveloppe (`10819:20344`, `10836:20478`) est réutilisé pour désigner le premier contenu ; aucune sélection multiple n'est développée. [31/10/2026 : sélection multiple et périmètre ajustable développés par B.4b, à la demande de Hermann.]
- [28/10 : « mode enveloppe […] Confirmer crée le conteneur avec au moins un membre » avec sélection contiguë sous un même parent — remplacé le 29/10 par ARB-06 ; les contenus suivants rejoignent le conteneur par glisser-déposer (B.4).]
- Détail local : présentation de l'action lorsqu'aucun contenu n'est éligible (Séance vide) — traitement existant des actions indisponibles réutilisé.

### B.3 — Séries groupées / alternées par Circuit, cibles à 0
Dépend de : B.1. Arbitrage : ARB-10 (décidé).
- Règles COMP §2 et ch10 l.1026-1156 appliquées à chaque Circuit (N commun, conversions avec confirmation si perte, réserve jusqu'à l'enregistrement, ajout ou déplacement vers un Circuit alterné).
- Cibles à 0 permises selon les règles, volume total de l'Exercice non nul (ARB-10, COMP §3 l.40), tiret bloquant, bornes du 28/10 (COMP §3).
- Modification d'un Exercice dans un conteneur : feuille de paramètres, N en lecture seule dans un Circuit alterné, pas de suppression locale de série qui romprait N (ch10 l.1142, l.1182).

### B.4 — Glisser-déposer entre conteneurs et défilement
Dépend de : B.2. Arbitrages : ARB-06, ARB-09, ARB-24 (décidés).
- G1–G8 (Exercice vers Circuit, Cycle ou Séance ; Circuit replié entre Cycles ou vers la Séance ; Circuit déployé replié au début du geste) ; éclairage de la destination ; défilement automatique (`useDragAutoScroll`) ; en-têtes collantes CS-D1–CS-D8 ; conteneur source vidé retiré au relâchement.
- **Remplir un conteneur** (ARB-06) : tout contenu peut y être déposé depuis une position non contiguë ou un autre conteneur, sans contrainte de contiguïté ni de parent commun, dans le respect des règles d'imbrication D-451.
- **Déplacement d'un Cycle entier** par le même geste (ARB-09). [28/10 : « ARB-09 : hors PRE-9 ou appui long » — remplacé.]
- **Point d'arrêt déposé dans un conteneur**, selon les règles de sa position de destination (ARB-06, B.6).
- Éléments formatés (en coordination avec C.4) : les **Exercices** conservent leur Format et réglages à la dépose, y compris vers un Circuit ou un Cycle ; les Circuits déplacés conservent nature, compte, membres et leur Format d’origine lorsqu’ils en portent un. B.4 fournit le contrôle avant mutation (admis / avec confirmation / refusé sans altération), neutre pour les Exercices libres.
- Déplacement pas à pas existant (`stepOccurrence`) conservé et généralisé aux positions de l'arbre ; son retrait éventuel demanderait une décision de Hermann (comportement qualifié). [28/10 : « ou retiré explicitement, décision consignée » — corrigé le 29/10.]

### B.4b — Enveloppe multiple et périmètre ajustable
Ajoutée le 29/10/2026 à la demande de Hermann (recette n° 1, constat i) ; placée après B.4 par sa décision du 29/10 (« Après B.4 »). Dépend de : B.2, B.4.
- Demande, texte de Hermann : « On doit pouvoir sélectionner plusieurs exercices pour ajouter directement plusieurs circuits, ou plusieurs exercices / circuits pour ajouter plusieurs cycles en une fois. » ; « Lorsqu'on a sélectionné un exercice pour poser un circuit, deux petits traits horizontaux apparaissent au dessus et en dessous des bords du cadre aux liserés pleins, en haut et en bas, qui permettent de déplacer le périmètre du circuit (idem pour la séance) en faisant glisser les bords en haut et en bas (appui sur les traits puis glissement). »
- Règles d'imbrication D-451 et lettres ARB-13 inchangées ; précisions de comportement (un conteneur par élément désigné ou un seul autour d'éléments contigus ; « idem pour la séance » à interpréter) à faire valider avant développement. [31/10/2026, Hermann : sélection multiple puis « Ajouter un circuit » → « Un Circuit par Exercice » (chaque Exercice sélectionné devient le premier membre de son propre Circuit) ; « idem pour la séance » désigne « Le Cycle » : les traits de périmètre servent aussi au Cycle en cours de création.]

### B.4c — En-têtes collants — DÉVELOPPÉ ET RECETTÉ

Hermann confirme la livraison et la recette le 02/11/2026. Maintenir en-têtes Circuit/Cycle, poussée par l’en-tête suivant, deux niveaux maximum, commandes actives et recalage au repli. Ne pas reconstruire cette story pendant C.2–C.4.

### B.5 — Suppression et duplication
- [30/10/2026, Hermann] « Circuit : l'apparition et la disparition du circuit doivent se faire progressivement et plus lentement » — précision de Hermann du 30/10/2026 : la disparition vise aussi le retrait d'un Circuit de la Séance (« b) et ok pour le traiter en B.4 / B.5 ») : effacement progressif et lent du Circuit retiré, puis remontée douce des éléments suivants. À réaliser avec le retrait de Circuit (B.4 dépose, B.5 suppression).
Dépend de : B.2. Arbitrages : ARB-08, ARB-17 (décidés).
- Suppression d'un Exercice (dernier membre : conteneur retiré ; points d'arrêt devenus interdits retirés sans message) ; duplication d'un Exercice (D-441), Format et paramètres conservés pour un Exercice formaté (ARB-17).
- Pas de duplication de Circuit ni de Cycle dans PRE-9 (ARB-08). [28/10 : « duplication d'un conteneur selon ARB-08 » — remplacé.]

### B.6 — Pauses et points d'arrêt sur toute la structure
Dépend de : B.4. Arbitrages : ARB-02, ARB-02a/b (**validés**, révision 2). Colonne de Point dans un Cycle : migration 016 (A.1).
- Mode Placement sur tous les niveaux ; RM-219, RM-251, D-441, D-442 évalués sur la séquence fonctionnelle de toute la structure, frontières de chaque conteneur comprises (règles retenues ARB-02) ; récupération attachée à l'occurrence (RM-209/210). [Remplacé le 01/11/2026 pour la récupération (ordre de Hermann, point 2 ; ch07 « Récupération de l'Exercice et défauts du Profil », qui clôt REC-PARAM-01) : la Récupération appartient à l'Exercice, reprise du Profil à sa création, réglée uniquement dans Paramètres d'exécution ; le mode Placement ne porte que les Points d'arrêt. Voir `spec-menu-creer-parametres-01-11.md` § « Récupération de l'Exercice et défauts du Profil ».]
- Point à l'intérieur d'un Cycle rencontré à chaque répétition ; Point au niveau Séance non répété du fait du Cycle (ARB-02a).
- Cycle répété : frontières entre répétitions, exceptions de début et de fin (RM-219), demande de choix entre Point de début et Point de fin de répétition, retraits et annulations comme pour le Circuit (D-442) — même mécanisme, aucun second (ARB-02b).
- [Révision 1 : « Points à l'intérieur d'un Cycle : ARB-02a/b, seule partie bloquée » — clos.]
- [28/10 : « ARB-02 (bloquant). Migration 017 si option B » — remplacé.]

### B.7 — Durées et synthèses

**Développé et recetté selon Hermann, 02/11/2026.** Ne modifier que les écarts démontrés imposés par la nouvelle cible Formats.

**Périmètre : vérification ciblée de l’existant, pas réécriture du calcul.** Identifier les fonctions et tests déjà livrés et vérifier leur couverture des Cycles, multi-Circuits, Formats, arrondis et récupérations. Modifier uniquement un écart démontré entre comportement actuel et règle validée ; si aucun écart n’est trouvé, clôturer sur les preuves existantes. La liste ci-dessous décrit les résultats attendus, pas des développements tous manquants.
Dépend de : B.1, D.1. Arbitrage : ARB-11 (décidé).
- Durée par Circuit et par Cycle dans les en-têtes, total de Séance (≈/≥, D-443) calculés sur le plan développé (D.1) ; durée et arrondi du Cycle selon les règles de la Séance (ARB-11) ; un élément AMRAP contribue par sa **durée configurée**, initialement 12:00 ; un élément Death by, sans durée calculable, est traité comme un Exercice sans durée conventionnelle, préfixe « ≥ » (application de D-070, à confirmer en revue) ; un Cycle × k multiplie une fois la durée de ses éléments, formatés compris (ARB-25) ; aucune valeur Figma prise comme oracle.

### B.8 — Utiliser une Séance existante — DÉVELOPPÉ ET RECETTÉ

**État déclaré par Hermann le 02/11/2026 :** B.4c (en-têtes collants), B.7, B.8 et B.9 sont **développés et recettés**. La pause antérieure de B.8 est levée ; ne pas refaire ni supprimer ce qui est livré. C.2–C.4 ont été arrêtés avant poursuite pour cette mise à jour. Les nouvelles règles peuvent nécessiter des adaptations ciblées de C.1/D.1 et des calculs, sur écart prouvé ; ce n’est pas une réouverture générale des lots recettés. La présence des livraisons sur `main` n’est pas présumée : Claude doit préserver sa branche de développement et y intégrer cette base documentaire.

La nouvelle liste du menu Formats retire cette entrée visible ; elle ne prescrit pas de supprimer le comportement B.8 déjà livré. Les copies conservent leurs identifiants propres, les paramètres et porteurs adaptés à la nouvelle base.

### B.9 — Nom de séance à trois états

**Développé et recetté selon Hermann, 02/11/2026.** Ne modifier que les écarts démontrés imposés par la nouvelle cible Formats.

Dépend de : B.2. Arbitrages : ARB-14, ARB-15 (décidés).
- Le nom du Format est une suggestion initiale facultative, modifiable dès l’ouverture, jamais un nom imposé ni un champ verrouillé. Tant que le nom reste suggéré, les règles de proposition liées aux Exercices s’appliquent ; dès qu’il est personnalisé, aucune substitution automatique (ARB-14/ARB-15 précisés le 01/11/2026).
- Titre personnalisé jamais remplacé automatiquement ; titre encore suggéré recalculé selon les règles existantes (ARB-14).
- Point signalé (ch08 l.851 suppose un Format unique) : titre suggéré d'une Séance réunissant plusieurs éléments formatés, ou ouverte préremplie de plusieurs Exercices — appliquer ARB-14/ARB-15 sans règle nouvelle ; si elles ne suffisent pas, le cas précis est présenté à Hermann au moment de la story.

---

## Epic C — Configuration des Formats

### C.1 — Persistance et registre — réalignement ciblé de la fondation

Dépend de : A.1. Vérifier l’existant livré avant modification ; ne pas réécrire une migration exécutée.
- Exercice autonome ou Circuit porteur selon le tableau de référence ; Format d’origine Circuit non modifiable, nature fixée, réglages applicables modifiables ; origine de Séance distincte.
- Quatre Formats spécialisés ; Tabata et cinq départs rapides standards. Death by alterné : intervalle local aux membres, compte ouvert Circuit ; groupé coordonné : intervalle commun de Circuit.
- Persistance/validation/duplication de plusieurs Circuits de Formats différents ; pas de compteur fini artificiel ni Format déduit du titre. Adaptation additive du schéma réel si nécessaire ; aucun numéro supposé.

### C.2 — Fenêtre de choix et nouveau parcours

Dépend de : C.1, Composition existante. CE-FMT-01.
- Menu Créer cinq options ; fenêtre `9977:19613` sur voile, deux colonnes : Tabata, 30/30, EMOM, AMRAP, For time, Death by, Renforcement, Superset, Progression, À l’échec.
- Aucune carte Exercice/Séance, Libre ou Gainage · Mobilité ; questionnaire et récapitulatif en modale sur Composition, sans bloc Titre de séance ; questionnaire croix vers Composition, Valider les paramètres vers récapitulatif ; récapitulatif Retour avec réponses conservées, Enregistrer dans la séance vers brouillon.
- Réutiliser Catalogue/saisie de Mouvements et composants ; pas de création Mouvement libre ou lancement direct de minuteur (B10 différé).

### C.3 — Questionnaires, récapitulatifs et séries variables

Dépend de : C.2. CE-FMT-02 ; paramètres et structures de la référence active.
- Tabata et 30/30 modifiables ; EMOM trois organisations ; AMRAP blocs distincts des tours, repos de boucle et inter-blocs, sélection unique par ajout de buy-in, plusieurs buy-in possibles ; For time borne optionnelle et séries par tour ; Death by À la suite, alterné coordonné et dans chaque intervalle.
- Progression : questionnaire sans cibles globales de répétitions ; récapitulatif tableau Mouvement sous Nombre de séries, répétitions et charge par série/mouvement. Charge Avec/Sans local via modale, interrupteur Avec charge au questionnaire, Sans par défaut. Saisie directe numérique/décimale, Suivant, tableau visible au-dessus du clavier.
- Augmenter N : lignes/colonnes nouvelles à compléter ; diminuer : surplus retiré, sans confirmation de perte dans les cas For time/Progression arbitrés. Déroulé à 25 px du bouton, proportions selon valeurs réelles ; 3 blocs AMRAP 12 min + 2 repos 2 min = 40 min.
- Mode catalogue intégré à la même modale, recherche conservée, croix d’effacement, Filtrer/Trier/Replier-déplier, Ajouter et Fermer sans ajout ; sélection unique par ajout de buy-in, plusieurs buy-in possibles. Photo : Fiche du mouvement en consultation seule superposée, retour dans le même état. Petite carte : zones corporelles avec pastille au lieu de la description, toutes variantes.
- EMOM Répétitions par défaut, Durée possible ; tableau Mouvement | Objectif sous Nombre de séries, mode par Exercice et objectif à renseigner sans conversion lors du changement ; sans ligne Repos. Death by multi-mouvements : Mouvement | Départ | Incrément sous Intervalle, paramètres locaux, incrément ≥ +1.
- Rendu modal et alignement texte des valeurs non modifiables selon CE-FMT-02 ; contenu défilant, bouton ancré, clavier au-dessus.
- Formulaire complet et cohérent avant Enregistrer : aucun ajout à Composition avec cible à renseigner. Contrôle EMOM ≥ intervalle (objectif local ou somme des objectifs de durée en commun, Répétitions exclues) : message, cadres rouges, validation bloquée ; même garde dans la modale et l’en-tête Circuit après ajout. État Paramètres à compléter réservé aux modifications ultérieures de Composition.
- Tableaux = champs standards des Exercices, synchronisés avec leurs modales. Max AMRAP grise et désactive Objectif/Par tour, sans masquer ; Charge reste modifiable ; initialisation Death by 1/+1, Progression 10/12/14 selon la source révisée ; aucune réinitialisation des valeurs saisies à la réouverture.
- Aucune nouvelle constante ni formule depuis un chiffre illustratif ; les modèles standard réutilisent leurs paramètres existants.

### C.4 — Composition préremplie, paramètres et compatibilité

Dépend de : C.3 et fondations multi-conteneurs A.1/B.1/B.2/B.3/B.4. CE-FMT-03/04.
- Enregistrer dans la séance ajoute à son brouillon ; sauvegarde finale depuis Composition. Garder le nom suggéré modifiable et préserver le titre personnalisé.
- Entrée Circuit porteur : paramètres compatibles repris, reste à compléter sans conversion arbitraire ni confirmation de perte ; déplacement direct entre Circuits selon arrivée. Sortie : Conserver / Libre / Annuler ; annulation restitue l’état antérieur.
- Circuit standard : AMRAP/For time groupés admis, alternés refusés ; EMOM selon la référence ; Death by autonome groupé admis avec fin locale/redémarrage, standard alterné refusé sans mutation. Pas de transfert implicite du Format au conteneur.
- Buy-in/out duplicables après l’original dans leur zone, exécutés une fois, récupération fixée 0 s ; boucle vide invalide ; Circuit un membre conservé. AMRAP un mouvement avec repos de boucle > 0 crée un Circuit.
- Nature fixée seulement pour Circuit porteur ; réglages autorisés modifiables ; Death by alterné sans durée d’en-tête et intervalles propres en modale. Pas de verrous Tabata/30/30 ; cadence AMRAP/For time facultative sans incidence temporelle.
- Tests d’aller-retour, conversions/annulation et multi-Circuits ; recette iPhone n°3 après livraison C.4.

### C.5 — Départs rapides standards

Dépend de : C.2/C.3. Cinq départs rapides : 30/30, Renforcement, Superset, Progression, À l’échec. Tabata est une autre préconfiguration standard de la grille ; Libre et Gainage · Mobilité n’y figurent pas.
- Réutiliser un seul mécanisme de préconfiguration ; Superset = deux Mouvements choisis, Circuit groupé un passage, paramètres libres ; aucun emplacement vide.
- Renforcement 3×15, Progression valeurs standards initiales 10/12/14, À l’échec trois séries ; valeurs par Mouvement et charges de démonstration non universelles. Tous les paramètres standards restent modifiables.

### C.6 — Édition, duplication et réouverture

Dépend de : C.4/C.5.
- Conserver la structure multi-conteneurs, le bon porteur, ses valeurs et les paramètres locaux à l’édition, sauvegarde, relecture et duplication de Séance.
- Aucun Format spécialisé inféré de Tabata/30/30, aucun verrous de préconfiguration recréé. Respecter nature fixée des Circuits porteurs et titre personnalisé.
- Lecture indisponible conservée jusqu’au moteur ; aucun développement transitoire d’exécution.

## Epic D — Contrat d'exécution

### D.1 — Développement du plan — contrôle du rattachement des segments

Dépend de : A.1, C.1. Réutiliser le développement fini livré ; adaptation ciblée si écart démontré.
- Toute structure D-451, Cycle et Circuit sans double multiplication ; récupérations liées aux membres, zéros sautés et Points d’arrêt selon règles existantes.
- AMRAP/Death by : segment progressif rattaché au bon porteur, sans liste non bornée. Buy-in à l’intérieur du premier bloc AMRAP, jamais élément avant le Circuit.
- Blocs réinitialisés ; Death by autonome groupé termine localement et repart du départ au passage suivant, coordonné termine son Circuit. Les horloges et génération progressive exécutées restent PRE-10/11.

### D.2 — Instantané de Séance

Dépend de : D.1, C.1.
- Instantané versionné indépendant des modifications ultérieures des Mouvements ; Format et réglages sur Exercice autonome ou Circuit selon la cible.
- Conserver appartenance, membres, Passage, récupération, objectifs, incréments et intervalles locaux Death by alterné ; intervalle commun groupé et durée de bloc restent au bon porteur.
- Constructeur pur PRE-9 ; persistance opérationnelle chez le premier consommateur PRE-10, sans lancer le moteur ici.

### D.3 — Descripteurs de capacités par Format et organisation

Dépend de : C.1.
- Quatre Formats spécialisés et leurs organisations ; préconfigurations standards distinctes. Porteur, expansion, référence temporelle, borne, progression, portée de fin et résultats.
- Death by coordonné groupé/alterné, intervalles locaux en alternance ; fin locale autonome groupée ; AMRAP blocs/buy-in ; For time borne optionnelle ; suspension/reprise sans remise à zéro ; cadence AMRAP/For time sans effet temporel.
- ExecutionAvailable reste distinct de la validité ; détails moteur véritablement absents signalés sans inventer de compte fini ou de condition de fin.

### D.4 — Validité de configuration

Dépend de : D.1, D.3.
- Contrôles par porteur et structure complète : paramètres à compléter, volumes invalides, boucle vide, incompatible Circuit standard ; aucun refus général de Format sur Circuit.
- Retour valid/invalid et motifs lisibles, sans réparation silencieuse ; disponibilité moteur distincte et Lecture indisponible inchangée.
- Refus Death by autonome standard alterné sans mutation ; aucune constante Tabata/30/30 imposée ; cibles calculées autorisées au-delà des bornes manuelles.

### D.5 — Instruction des capacités d'exécution (document, sans code)
Dépend de : D.3.
- Pour les dimensions 3 à 10 du cadrage : règle source, capacité minimale, Formats concernés, état (DÉFINI / PARTIELLEMENT DÉFINI / NON DÉFINI), conséquence PRE-10 / PRE-11 ; interruptions et reprise (RM-066…070, R-01), résultats (motif, résultat réalisé, achèvement), familles d'événements de signal (interface, audio, haptique).
- A2, A4, A6 documentés **par Format** à partir des règles existantes ; seuls les cas réellement non définis sont présentés à Hermann (`arbitrages-pre9.md` §3), dont la suite de la Séance après un élément AMRAP ou Death by. [28/10 : « questions A2, A4, A6, A7 présentées à Hermann avant PRE-10 » — remplacé le 29/10.]

---

## Epic DOC — Documentation

### DOC.0 — Traçabilité PRE-8 et décisions du 29/10 (dès validation du plan)
- Mentions « PRE-8 non fusionnée » actualisées (`_bmad-output/pre8/README.md`, `sprint-status.yaml`, `epics.md`, bilan E) ; E.8-b / Q-E1 réexprimés « PRE-9, chantier A » (ch07, artefacts PRE-8).
- Décisions validées du 29/10 (`arbitrages-pre9.md` §0 et §0 bis) consignées dans le registre (ch07), classe B ; FMT-12 annotée (répétition par Cycle, ARB-25) ; artefact PRE-8 de la conversion E.8-b annoté (ARB-01) ; propagation par document : `arbitrages-pre9.md` §5 ; aucune question ouverte n'y est inscrite comme décision.

### DOC.1 — Lot documentaire de clôture
- Contradictions D-451, ARB-03 et Formats listées dans `arbitrages-pre9.md` § 4 corrigées ou annotées selon les décisions prises ; seconde passe indépendante.

---

## Stratégie de qualification

**Automatisée**
- Domaine pur d'abord : tests unitaires de l'arbre (insertion, pose d'un conteneur sur un premier contenu, déplacement d'un Exercice, d'un Circuit, d'un Cycle et d'un Point, suppression, duplication d'Exercice, natures, points d'arrêt, développement, Formats par élément) avec cas limites (0, volume nul, N commun, conteneur vidé, frontières, élément formaté dans un Cycle répété, répétition d'un même Format en groupées et en alternées, compatibilité des déposes, changement d'organisation d'un Circuit formaté à volume conservé, Points aux frontières de répétition de Cycle).
- Base de données réelle (`NodeSqliteDatabase`) : chaque migration testée en mémoire **et sur copie d'une base réelle** ; aller-retour structure → stockage → structure sans perte, Format des éléments compris.
- Intégration écran : tests existants de la Composition gardés verts à chaque story ; nouveaux flux par epic (création par enveloppe, glisser entre conteneurs, Format bout en bout).
- Gardes : non-régression des migrations 001–015 ; pas de lecture `activity_definitions` hors migration (test de garde) après A.3.
- Suite complète exécutée par lots (contrainte mémoire constatée en PRE-8).

**Recette iPhone ciblée** (pas de recette générale ; Hermann ; page de recette avec résultats en base comme en PRE-8)
1. Après B.2 : créer une Séance à deux Cycles (avec Exercices directs), Circuits multiples et Exercices directs ; enregistrer, rouvrir, dupliquer.
2. Après B.6 : remplir un conteneur par glisser-déposer depuis des positions non contiguës, déplacer un Cycle entier, défilement, pauses et points d'arrêt, durées.
3. Après C.4 : Tabata (Circuit) et EMOM (Exercice) de bout en bout ; champs verrouillés ; Tabata répété par un Cycle × 2 ; entrée « Format » du menu Créer ; dépose refusée puis confirmée ; Tabata passé de Par exercice à En alternance (8 séries conservées) ; réouverture.
4. Fin de PRE-9 : chaque Format disponible et départ rapide défini, Séance à plusieurs Formats, conversion E.8-b sur les données réelles, non-régression Catalogue PRE-8.

## Risques de planification
- [HISTORIQUE de la révision 2, supersédé le 30/10 ; aucun de ces arbitrages n'est encore ouvert] Anciennes opérations bloquées (`arbitrages-pre9.md` §2 bis) : ARB-04 (mise à disposition des Formats concernés) ; ARB-22c (activation des départs rapides) ; ARB-26, ARB-27, ARB-28 (une opération chacun dans C.4). Aucune story n'est bloquée en entier. [Révision 1 : liste ARB-01, ARB-02a/b, ARB-04, ARB-22c, ARB-24, ARB-25, ARB-23, ARB-10b — clos en révision 2, sauf ARB-04 et ARB-22c.] [28/10 : « ARB-01 à ARB-05 conditionnent environ 11 stories » — remplacé.]
- Le volume du chantier B est le plus élevé ; la découpe B.1–B.9 permet une recette intermédiaire.
- C.4 regroupe le flux de Format dans la Composition, l'entrée « Format » et la compatibilité des déposes : story la plus dense de l'epic C, à découper en tâches au moment de sa spec si nécessaire, sans nouvelle story.
- A.1 porte désormais une migration (016) en plus du changement de modèle : tests sur copie de base réelle obligatoires.
- La dette de vérification globale PRE-8 (Q.0) est traitée séparément ; une régression constatée pendant A.1 est qualifiée avec Q.0 si elle n'est pas encore faite.


## Formats — base finale du 4 novembre 2026

**Formats — état cible du 4 novembre 2026.** Rôle dans le circuit : Buy-in/Tour pour AMRAP, Buy-in/Tour/Buy-out pour For time ; zones ordonnées, plusieurs buy-in/out, duplication dans la même zone, une seule exécution. AMRAP : incrément par tour en répétitions ou durée ; buy-in à l’échec possible, résultat à la clôture du premier bloc, sans saisie intercalée pendant le chrono. For time : membres en Répétitions ou Durée, au moins un Exercice en Répétitions dans l’ensemble du Circuit, buy-in/out compris. Dès deux Exercices créés par un modèle : Circuit ; À la suite et départs rapides correspondants : Circuit standard groupé à un tour. Nom du Circuit modifiable, modèle comme titre initial. Modèle d’origine distinct du Format d’origine d’exécution ; un Circuit standard n’acquiert aucun Format partagé par sa provenance. Réédition depuis le récapitulatif, mise à jour en place des seuls champs modifiés, annulation sans effet, valeurs hétérogènes « variable » sans uniformisation automatique. Avec/Sans charge effectif conservé, y compris les valeurs inactives sous Sans. Charges facultatives, vide ≠ zéro ; progression EMOM matérialisée par série et jamais réappliquée automatiquement sur des charges personnalisées.

C.1 : Nom du Circuit, Modèle d’origine distinct du Format d’origine, Rôle explicite du membre, conservation de charge inactive. C.2/C.3 : écrans actuels, clavier et charges, formulaires complets/cohérents. C.4 : regroupement multi-exercices, zones et garde-fous, actions Circuit, réédition en place. C.5/C.6 : départs rapides et édition/duplication selon cette même base. D.1 : développement selon le bon porteur et les Rôles, plusieurs buy-in/out, membres en Durée et incréments. D.2 : instantané des données effectives et provenance, historique immuable. D.3/D.4 : capacités et validations alignées, contrôle EMOM bilatéral. D.5 : correspondances aux capacités réellement livrées, sans déclarer le moteur spécialisé développé. Exécution spécialisée PRE-10/11 ; ne pas la développer par fragments sous couvert des seuls écrans. B.4c/B.7/B.8/B.9 sont développés et recettés selon Hermann ; reprendre au périmètre Formats après lecture intégrale des règles actuelles.

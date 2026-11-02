# PRD — PRE-9 — base Formats actualisée

**État déclaré par Hermann le 02/11/2026 :** B.4c (en-têtes collants), B.7, B.8 et B.9 sont **développés et recettés**. La pause antérieure de B.8 est levée ; ne pas refaire ni supprimer ce qui est livré. C.2–C.4 ont été arrêtés avant poursuite pour cette mise à jour. Les nouvelles règles peuvent nécessiter des adaptations ciblées de C.1/D.1 et des calculs, sur écart prouvé ; ce n’est pas une réouverture générale des lots recettés. La présence des livraisons sur `main` n’est pas présumée : Claude doit préserver sa branche de développement et y intégrer cette base documentaire.

Source : [référence active Formats du 02/11/2026](../../../docs/KODJO-Formats-entrainement-2026-11-02.md). Les révisions antérieures sur le porteur et les verrous sont remplacées dans cette portée.

## Menu Créer — règle active

Le menu Créer propose cinq options, dans cet ordre : **Créer un exercice**, **Utiliser des mouvements existants**, **Utiliser un format d’entraînement**, **Ajouter un circuit**, **Ajouter un cycle**. L’accès Formats ouvre une fenêtre sur fond voilé, grille à deux colonnes sans cartes Un exercice/Une séance ni départ Libre. MENU-FMT-01 et ARB-05 sont remplacés dans cette portée. Le bouton + devient Annuler, croix grise 34 px au même emplacement ; les règles d’axe, de voile et de fermeture sont conservées. Utiliser une séance existante n’est plus une option de ce menu ; le comportement B.8 déjà livré n’est pas supprimé par cette nouvelle liste.

À l’ouverture, le bouton + « Ajouter une activité » devient Annuler : croix standard sur fond gris, 34 px, à l’emplacement exact du + et au-dessus du voile. Le toucher ferme le menu sans action ; la fermeture rétablit +. Le bouton Pause / Ajouter un arrêt conserve sa place à gauche, sous le voile. Un axe vertical, au-dessus du voile et sous les options, relie Annuler aux icônes et s’arrête à Ajouter un cycle. Aucune option Annuler n’est ajoutée à la liste.

L’écran ouvert par « Créer un exercice » porte ce même titre. Le bouton de confirmation du mouvement sélectionné porte « Créer un exercice ». Les cartes de suggestion conservent les composants et règles du parcours de recherche existant ; ce libellé ne renomme pas les actions distinctes de correction ou de création d’un Mouvement dans les autres contextes.

**MENU-FMT-01 — remplacée :** le parcours actif est celui de la fenêtre Formats et du menu à cinq options ci-dessus.

Les exigences de menu ci-dessous se lisent avec cette règle ; aucune story ne doit réintroduire une entrée retirée.

## 1. Objectif

À l'issue de PRE-9, KODJO permet de **créer, modifier, organiser, enregistrer et rouvrir** les Séances du MVP, libres ou configurées par un Format, selon le modèle simplifié (D-449) et la Composition à conteneurs (D-451) ; une Séance peut réunir plusieurs éléments formatés et libres, directement ou dans des Cycles (ARB-03). Leur structure, leurs contraintes et leur instantané sont assez définis pour que PRE-10 développe le moteur commun sans reconstruire le modèle de Séance.

PRE-9 **représente et configure** ; il n'exécute pas. Aucun Format n'est annoncé comme exécutable (cadrage §1, principe 2).

## 2. Utilisateur et valeur

Hermann, utilisateur unique sur iPhone, compose ses séances d'entraînement : il veut des Cycles répétés, plusieurs Circuits et des Exercices directs dans une même Séance, et partir d'un Format (Tabata, EMOM…) dont les règles sont respectées et lisibles.

## 3. Périmètre

### Inclus
- **Chantier CAT.2 — Résultats de recherche des Mouvements** : différencier cartes Résultat (bouton Ajouter un niveau à droite) et Composition (sans bouton), assurer description et troncature, regroupement des familles et état Plus facile/Plus difficile selon la [spécification PRE-9](../../../docs/KODJO-Resultats-recherche-mouvements-PRE9-2026-10-30.md) et CE-MVT-RESULT-01 ; implementation immédiate indépendante du moteur et de la Composition PRE-9.
- **Chantier CAT — Zone de contexte des Catalogues** : bande lilas et deux lignes, recherche, filtre/tri/création, compteurs de Mouvements interactifs et exclusifs, compteurs de vues Séances informatifs, « N résultats » filtrés/archivés en direct, titres individuels masqués, adaptation 402 × 874 ; sans modification des cartes ni des comportements métier existants.
- **Chantier A — Séance simplifiée** : Composition, consultation, duplication et réouverture sur la structure générale (Exercices directs de Cycle compris) ; création d'Exercice uniquement depuis un Mouvement ; fin des parcours `activity_definitions` ; conversion E.8-b et titres Q-E1 selon ARB-01 ; suppression des tables historiques seulement sous conditions (A.5).
- **Chantier B — Composition D-451** : Cycles, multi-Circuits, Exercices directs (Séance et Cycle), séries groupées/alternées, comptes, menu Créer à cinq options (CE-FMT-01), création par enveloppe (ARB-06), replié/déployé, glisser-déposer entre conteneurs et déplacement d'un Cycle entier avec défilement automatique, suppression, duplication d'Exercice, pauses et points d'arrêt (ARB-02), durées et synthèses, reprise d'une Séance existante, nom à trois états.
- **Chantier C — Formats** : fenêtre de choix, questionnaires, récapitulatifs, tableau Progression, portage et Composition contextualisés de la référence active ; C.2–C.6. Tout le périmètre doit être relu, aucun ancien écran ou parcours pris comme base.
- **Chantier D — Contrat** : développement déterministe des plans finis, instantané de Séance versionné, descripteurs de capacités par Format, validité de configuration distinguée de la disponibilité du moteur.

### Exclu (PRE-10, PRE-11 ou autre)
Moteur, écrans d'exécution, horloges, audio, haptique, résultats persistés, reprise d'exécution (PRE-10) ; comportements spécialisés et règles R-01 à R-04 (PRE-11) ; VoiceOver (lot de fin de MVP) ; Planification, Programmes, Historique ; Trier ; emplacement pointillé (écart accepté PRE-8) ; duplication de Circuit ou de Cycle (ARB-08) ; génération des occurrences des Formats progressifs (PRE-10/11).

## 4. Exigences fonctionnelles (références)

| ID | Exigence | Source |
|---|---|---|
| FR-A1 | La Séance est le seul contenu enregistré, planifiable et lançable ; l'Exercice est un composant de la Séance | D-449 §1-2, SU-01…02 |
| FR-A2 | Toute Séance (Cycles avec Exercices directs, multi-Circuits, Exercices directs, éléments formatés) s'ouvre, se consulte, se duplique et se rouvre sans perte | D-449, D-451, R-E6, ARB-17 |
| FR-A3 | Un Exercice se crée depuis un nouveau Mouvement ou un Mouvement existant, dans la Séance ; aucun parcours n'écrit ni ne lit d'Exercice autonome | D-449, COMP §5 |
| FR-A4 | Les anciennes définitions sont traitées selon ARB-01, sans effacement implicite ; titre Q-E1 ; conversion automatique, transactionnelle et sans perte (Mouvements, paramètres, médias, associations) ; la conversion ne supprime aucune donnée historique ; la suppression des tables exige justification de non-utilisation, preuve de conservation et autorisation de Hermann | D-449 §5, Q-E1, ARB-01 |
| FR-B1 | Séance : Exercices, Circuits, Cycles dans leur ordre ; Cycle : Exercices directs et Circuits ; Circuit : Exercices ; pas d'imbrication au-delà | D-451, RM-025…029 |
| FR-B2 | Comptes des Circuits standards et Cycles 1..99 selon leurs règles ; régime ouvert Death by distinct ; AMRAP compte ses blocs. | Référence Formats 02/11 ; CE-FMT-01 à 04 |
| FR-B3 | Séries groupées/alternées, N commun en alternées, conversions avec confirmation si perte | COMP §2, ch10 l.1026-1156 |
| FR-B4 | Cibles à 0 autorisées, tiret bloquant, bornes du 28/10 | COMP §3, RM-234 |
| FR-B5 | Menu cinq options et fenêtre Formats deux colonnes selon CE-FMT-01 ; +/Annuler inchangé ; questionnaire croix, récapitulatif Retour conservant les réponses. | Référence Formats 02/11 ; CE-FMT-01 à 04 |
| FR-B6 | En-têtes existants, Circuit repliable ; Circuits porteurs affichent leur Format d’origine ; AMRAP en blocs ; Death by alterné sans durée, intervalles locaux. | Référence Formats 02/11 ; CE-FMT-01 à 04 |
| FR-B7 | Glisser-déposer G1–G8, déplacement d'un Cycle entier, Point d'arrêt déposé dans un conteneur, défilement automatique, en-têtes collantes CS-D1–CS-D8 | COMP §6-7, D-442, ARB-06, ARB-09 |
| FR-B8 | Pauses (récupérations) et points d'arrêt selon RM-209/210/219/220/251, D-441, D-442 appliquées à toute la structure ; Point interne à un Cycle rencontré à chaque répétition, Point au niveau Séance non répété ; frontières, exceptions, demande de choix et retraits des répétitions de Cycle comme pour le Circuit, par le même mécanisme | D-441, D-442, ARB-02a/b |
| FR-B9 | Durées exactes/≈/≥, agrégats sur le plan développé, durée visible dans les en-têtes, arrondi D-443, Cycle selon les règles de la Séance | ch10 l.937, D-391, D-443, ARB-11 |
| FR-B10 | Comportement B.8 développé et recetté selon Hermann : copie au niveau principal, nouveaux identifiants, mêmes Mouvements, sans synchronisation ; éléments formatés copiés avec Format et paramètres | D-449 §3, SU-03, ARB-16 |
| FR-B11 | Nom de séance à trois états ; nom du Format comme nom initial proposé ; titre personnalisé jamais remplacé | ch08 l.849-855, ARB-14, ARB-15 |
| FR-B12 | Brouillon : seule « Continuer » enregistre ; validité = au moins un Exercice valide sans cible manquante ; Séance archivée en consultation | D-388, D-380, PRE-8 r2-02 |
| FR-C0 | Exercice autonome ou Circuit porte le Format selon la référence active ; structure multi-conteneurs et Cycles conservée, aucun multiplicateur caché. | Référence Formats 02/11 ; CE-FMT-01 à 04 |
| FR-C1 | Persistance sur le bon porteur ; origine de Séance distincte ; réglages effectifs conservés à la relecture/duplication ; aucune réécriture historique. | Référence Formats 02/11 ; CE-FMT-01 à 04 |
| FR-C2 | Valeurs initiales modifiables et contraintes réelles distinguées ; Tabata et 30/30 standards ; cadence facultative AMRAP/For time sans calcul temporel. | Référence Formats 02/11 ; CE-FMT-01 à 04 |
| FR-C3 | Questionnaire → récapitulatif → structure ajoutée au brouillon de Composition ; portage Circuit et modales contextualisées selon CE-FMT-02/03/04. | Référence Formats 02/11 ; CE-FMT-01 à 04 |
| FR-C4 | Cinq départs standards : 30/30, Renforcement, Superset avec deux mouvements choisis, Progression et À l’échec ; Tabata standard ; aucune entrée Libre ou Gainage · Mobilité. | Référence Formats 02/11 ; CE-FMT-01 à 04 |
| FR-C7 | Choix des Mouvements dans le flux d'un Format et de la carte Exercice par le parcours existant du Catalogue ; les Mouvements choisis deviennent des Exercices configurés | ch03 l.646 ; ARB-22a |
| FR-C8 | Fenêtre Formats commune à deux colonnes sans cartes Exercice/Séance ; aucune création sans Mouvement (B10 différé). | Référence Formats 02/11 ; CE-FMT-01 à 04 |
| FR-C5 | Un élément formaté n'est jamais converti silencieusement en élément libre avec perte de contraintes | Mission PRE-9 §4.C ; ARB-03 |
| FR-C9 | Entrée porteur : compatible conservé, reste à compléter sans conversion/confirmation de perte ; standard selon matrice ; Death by autonome standard alterné refusé, groupé admis avec fin locale/redémarrage. | Référence Formats 02/11 ; CE-FMT-01 à 04 |
| FR-C6 | Aucun Format n'est présenté comme exécutable avant PRE-10/PRE-11 ; « Lecture indisponible » conservé, sans développement transitoire | Cadrage §2.B, l.47 (non décisionnel) ; ARB-21 |
| FR-D1 | Développement déterministe des plans finis : Séance → Cycles (répétitions) → Circuits (groupées/alternées) → séries → côtés → R → point d'arrêt ; séries nulles sautées sans leur récupération associée (pauses indépendantes conservées) ; Cycle × k = k développements complets, sans autre facteur ; points consécutifs dédoublonnés ; éléments progressifs (AMRAP, Death by) représentés par un segment, sans occurrence générée | RM-252, ch10 l.1014-1015, l.1130, RM-234, RM-251, ch12 l.1829 |
| FR-D2 | Instantané de Séance figé, versionné, indépendant des modifications ultérieures des Mouvements | SU-07, ch09 l.593-598 |
| FR-D3 | Capacités par Format spécialisé et organisation, porteur Exercice ou Circuit, références temporelles communes ou locales, fin et résultats ; préconfigurations standards distinctes. | Référence Formats 02/11 ; CE-FMT-01 à 04 |
| FR-D4 | Validité de configuration (par élément et pour la Séance, avec motifs) distincte de la disponibilité du moteur | Mission du 29/10 §10.5 ; CE-FMT-02/04 §14 |

## 5. Exigences non fonctionnelles

- **Conservation des données** : aucune perte à la migration ; toute incompatibilité détectée explicitement (cadrage §2.C).
- **Performance** : glisser-déposer fluide sur iPhone avec plusieurs conteneurs (référence : correctif PRE-8 f3-01, pas de rendu complet par image).
- **Primitives natives** privilégiées ; animations « Réduire les animations » respectées (B05).
- **Texte agrandi** et largeurs 360 / 402 / 440 ; cibles ≥ 44 pt sauf exception documentée (COMP l.56).
- **Synchronisation code / documentation** : chaque livraison applique `.claude/rules/synchronisation-code-documentation.md`.

## 6. Critères de sortie de PRE-9

1. Stories du périmètre actif terminées et recette iPhone ciblée validée ; A.5 reste conditionnelle. Le suivi distingue déclaration de recette et preuve vérifiée sur la branche.
2. Plus aucun parcours actif ne lit ou n'écrit `activity_definitions` (selon ARB-01) ; données historiques conservées sauf suppression autorisée (A.5).
3. Une Séance libre à Cycles (avec Exercices directs) et multi-Circuits, et une Séance réunissant plusieurs éléments formatés dont un dans un Cycle répété, s'enregistrent et se rouvrent à l'identique ; chaque Format mis à disposition fonctionne de bout en bout jusqu'à « Lecture indisponible ».
4. Le contrat de passage (instantané, développement, descripteurs) est testé et documenté ; les critères d'entrée en PRE-10 du cadrage §7 sont vérifiables.
5. Suite Jest complète et ESLint global exécutés (fractionnés) et verts.


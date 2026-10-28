# API fonctionnelles

## Opérations de famille depuis le catalogue — 28/10/2026

CE-MVT-03 et les [règles A à E](../DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md) définissent réordonner, lier, entrer, sortir et dissoudre le dernier couple au relâchement. Annuler restaure l'opération pendant les 3 secondes du message d'appartenance. Les écritures et invariants sont au chapitre 09 ; aucune nouvelle route technique n'est imposée par ce lot documentaire. Ne pas assimiler dissoudre une famille à supprimer ses mouvements ni modifier les références d'exercices, l'historique ou les performances.

> **C08 — actualisation du 28/10/2026.** La [composition des familles depuis le catalogue](../DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md), règles A à E et CE-MVT-03, est désormais définie : rattacher, détacher et dissoudre une famille par geste. Les mentions antérieures « C08 différé » restent historiques pour ces opérations ; elles ne sont plus une restriction active. La suppression définitive d'un mouvement reste distincte et n'est pas clôturée par ce lot.

> **Cible validée D-449 — 26/10/2026.** [Six décisions closes](../KODJO-Seance-Objet-Unique-Decisions-2026-10-26.md). Les dispositions ci-dessous sur l’exercice autonome de catalogue, le lancement `ACTIVITY`, le cycle technique unique et les catalogues séparés par nature décrivent le modèle antérieur et sont remplacées sur ces seuls points. Les autres règles restent applicables. La réalisation et les visuels Figma ne sont pas déclarés livrés.

## Contrats fonctionnels cibles — D-449

Les opérations d’enregistrement, de planification et de lancement portent sur la Séance, même lorsqu’elle ne contient qu’un exercice. L’ajout/modification d’un exercice porte sur sa composition et ne crée pas une définition autonome de catalogue. Reprendre une séance copie sa composition et ses paramètres avec de nouveaux identifiants, conserve les références aux mouvements, sans routines ni résultats ni réglages propres début/fin. Le lancement résout les mouvements et fige la séance complète. Les anciennes opérations ActivityDefinition/ACTIVITY ci-dessous documentent le modèle antérieur ; D-449 ne demande pas de lancement isolé ni de sélection d’exercices au démarrage.

**D-445 — décisions validées le 25/10 :** C01–C07 et C09 sont clos ; C08 seul reste différé sur le périmètre MVP. [Spécification consolidée v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md).


## Sommaire

- [Objet et organisation du chapitre](#objet-et-organisation-du-chapitre)
  - [Objet et périmètre](#objet-et-périmètre)
- [Séances](#séances)
  - [API Séances](#api-séances)
- [Exercices](#exercices)
  - [Contrats MFN — évolution des opérations existantes](#contrats-mfn--évolution-des-opérations-existantes)
  - [API Exercices](#api-exercices)
  - [API du Catalogue des Exercices, des Médias et des Parcours](#api-du-catalogue-des-exercices-des-médias-et-des-parcours)
- [Paramètres d’exécution](#paramètres-dexécution)
  - [Extension des API — Cadence et phrase](#extension-des-api--cadence-et-phrase)
  - [Contrat technique de phrase](#contrat-technique-de-phrase)
  - [Contrats de service — cibles typées et relevés](#contrats-de-service--cibles-typées-et-relevés)
  - [Contrat du générateur de phrase](#contrat-du-générateur-de-phrase)
  - [Migration T03 — Catalogue des Exercices — Contrat technique de phrase](#migration-t03--catalogue-des-exercices--contrat-technique-de-phrase)
- [Composition des séances](#composition-des-séances)
  - [API Composition d'une séance](#api-composition-dune-séance)
  - [Sélection multiple d’Exercices existants — MVP T03](#sélection-multiple-dexercices-existants--mvp-t03)
  - [Contrat fonctionnel futur — médias pendant l’Exécution](#contrat-fonctionnel-futur--médias-pendant-lexécution)
  - [Pauses et symboles](#pauses-et-symboles)
  - [Opérations sur les récupérations et points d’arrêt](#opérations-sur-les-récupérations-et-points-darrêt)
- [Circuits](#circuits)
  - [Contrats fonctionnels — circuits](#contrats-fonctionnels--circuits)
- [Formats de séances](#formats-de-séances)
  - [Formats — contrats de services fonctionnels](#formats--contrats-de-services-fonctionnels)
- [Bilatéralité](#bilatéralité)
  - [API de bilatéralité](#api-de-bilatéralité)
- [Exécution](#exécution)
  - [API Exécution](#api-exécution)
  - [Exécution directe d’un Exercice — MVP T03](#exécution-directe-dun-exercice--mvp-t03)
- [Planification](#planification)
  - [API Routines et Planification](#api-routines-et-planification)
- [Suivi et synthèse](#suivi-et-synthèse)
  - [API 11.7 Historique et Suivi](#api-117-historique-et-suivi)
- [Profil et préférences](#profil-et-préférences)
  - [API Préférences globales](#api-préférences-globales)
- [Référentiels](#référentiels)
  - [Référentiels](#référentiels-1)
- [Technique](#technique)
  - [Conventions fonctionnelles de gestion des erreurs](#conventions-fonctionnelles-de-gestion-des-erreurs)
  - [API externes et évolutions futures](#api-externes-et-évolutions-futures)
- [Sujets transverses](#sujets-transverses)
  - [Principes généraux](#principes-généraux)
  - [Compléments de cohérence MVP](#compléments-de-cohérence-mvp)
  - [API fonctionnelles — consolidation D-209 à D-217](#api-fonctionnelles--consolidation-d-209-à-d-217)

## Objet et organisation du chapitre

### Objet et périmètre

> *Texte identique à celui de la section [« Règles métier et calculs »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#règles-métier-et-calculs) ; il n’est pas recopié ici.*

Ce chapitre définit les API fonctionnelles internes nécessaires au fonctionnement du MVP.

Une API fonctionnelle décrit une opération mise à disposition des composants de l’application pour manipuler les objets métier et appliquer les règles fonctionnelles.

Pour chaque opération sont précisés :
- son identifiant ;
- son objectif ;
- ses principales données d’entrée ;
- son résultat ;
- ses principales règles et validations ;
- les objets fonctionnels impactés.

Ce chapitre ne définit pas :
- le protocole technique utilisé ;
- les endpoints ;
- les formats d’échange ;
- les codes HTTP ;
- l’architecture des services ;
- le stockage physique des données.

Ces éléments relèvent du chapitre `12 – Architecture technique`.

Les intégrations avec des services externes, notamment les calendriers Apple, Google ou Microsoft et les fournisseurs externes de contenus, ne font pas partie des API internes du MVP décrites dans ce chapitre.

## Séances

### API Séances

| ID         | Opération                     | Entrées principales                               | Résultat                                        | Règles / validations                                                                                                                          | Objets impactés                                             |
| ---------- | ----------------------------- | ------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| API-SEA-01 | Lister les séances            | Statut, étiquette, tri éventuels                  | Liste des Séances correspondant aux critères, avec Étiquette et métadonnées d’Exercices utiles au Catalogue | La durée retournée pour le Catalogue exclut toujours le Compte à rebours initial et la Fin de séance ; les Séances archivées ne sont incluses que si demandées ; filtres et tris doivent être valides | Séance, Catégories, Exercices, Zones corporelles, lecture |
| API-SEA-02 | Lire une séance               | ID Séance                                         | Séance et composition complète                  | La Séance doit exister                                                                                                                        | Séance, Cycle, Tour, Exercices                              |
| API-SEA-03 | Créer une séance              | Brouillon complet : propriétés générales, Étiquette, Composition | Nouvelle Séance complète | Transaction unique ; aucun objet partiel en cas d’échec | Séance, Étiquette, Cycle, Tour, Exercices |
| API-SEA-04 | Modifier une séance           | ID Séance, valeurs à modifier                     | Séance mise à jour                              | La Séance doit exister ; les Exécutions historisées ne sont pas modifiées                                                                     | Séance                                                      |
| API-SEA-05 | Dupliquer une séance          | ID Séance source                                  | Nouvelle Séance indépendante                    | Nouveaux identifiants ; nom `{nom} (copie)` puis suffixe numéroté disponible ; copie de l’Étiquette, de la Composition et des paramètres ; aucune Routine ni Exécution n’est dupliquée | Séance, Étiquette, Cycle, Tour, Exercices |
| API-SEA-06 | Archiver une séance           | ID Séance, confirmation conditionnelle            | Séance archivée ; Routines à contenu unique associées supprimées | Aucune confirmation si 0 Routine associée ; confirmation explicite si ≥ 1 Routine associée ; seules les Routines dont la Séance est l’unique contenu relèvent de la suppression validée (RM-008). Effet sur les Routines à plusieurs contenus : `À CLARIFIER`, sans suppression déduite des autres contenus ; occurrences historisées et Exécutions conservées | Séance, Routine |
| API-SEA-07 | Restaurer une séance archivée | ID Séance                                         | Séance au statut `Active`                       | Aucune ancienne Routine n'est restaurée ; toute nouvelle planification nécessite une nouvelle Routine                                         | Séance                                                      |
| API-SEA-08 | Supprimer une séance archivée | ID Séance, confirmation                           | Séance supprimée                                | La Séance doit être archivée ; aucune suppression directe d’une Séance active ; Exécutions historiques conservées                              | Séance                                                      |

## Exercices

### Contrats MFN — évolution des opérations existantes

Ces opérations implémentent D-445, sans service distant imposé.

| Opération | Contrat cible |
|---|---|
| Rechercher / créer | Nom unique garanti à l’écriture ; recherche nom/alias dédupliquée ; mouvements sans exercice et locaux inclus |
| Lire une définition ou une occurrence | Résoudre directement le mouvement courant et les paramètres propres de l’objet ; aucune dépendance de SessionActivity envers ActivityDefinition |
| Préparer une sauvegarde | Comparer nom/contenu, compter autres définitions et occurrences liées, rechercher existence d’exécution par identité ; branche de dialogue selon MFN-08 |
| Mettre à jour | Écrire le contenu du mouvement atomiquement ; garder paramètres locaux ; détecter les phases devenues incomplètes ; ne pas synchroniser des copies de contenu |
| Créer distinct | Nouvelle identité et nom unique ; rattacher l’objet édité, remplacer l’occurrence si contexte séance ; originaux et historiques conservés |
| Ajouter un niveau | Nouveau mouvement, description/médias vierges, catégorie/zones reprises, nom commencé ; groupe selon difficulté choisie ; aucun exercice associé implicitement depuis le catalogue des mouvements (D-449 / CE-MVT-01) ; pas de confirmation de correction |
| Insérer / dupliquer | Nouvelle occurrence, même référence au mouvement et paramètres locaux copiés ; aucune écriture d’indicateur d’utilisation sur insertion |
| Démarrer | Vérifier compatibilité et complétude, résoudre contenu/paramètres puis figer l’instantané avec filiation ; pas de relecture pendant exécution |
| Supprimer un exercice | Conserver le mouvement et tous les instantanés ; aucun ramassage automatique |
| Supprimer un mouvement | Préserver intégrité des références actives ; parcours et admission MVP différés C08 |

Règles et recettes : MFN-01 à MFN-13 / MFN-AC du chapitre 10. Base vierge D-440 ; pas de migration.

### API Exercices

|ID|Opération|Entrées principales|Résultat|Règles / validations|Objets impactés|
|---|---|---|---|---|---|
| API-ACT-01 | Paramétrer un Exercice | Nom, description facultative sous forme d’étapes ordonnées (D-425), référentiels, mode unique, N, uniforme/variable, cibles/Pauses/Bip0..10 ordonnés, charge (activation, valeur commune ou par Série), changement de côté Sans / Avec, ordre des côtés, PC, CR/Fin | Exercice validé | Validation v13 ; charge selon RM-239, valeurs conservées sous Sans transportées (RM-236) ; changement de côté selon RM-242 et RM-244 ; N1 normalisé ; aucune R contextuelle sur ActivityDefinition ; écriture atomique | Exercice |
| API-ACT-02 | Calculer les paramètres temporels | Mode, N, uniforme/variable, cibles/Pauses/Bip0..10 ordonnés, changement de côté, ordre des côtés, PC, R contextuel éventuel, Tv en Durée uniforme | Total dérivé avec niveau d’incertitude, statut incomplet et N canonique si inversion | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec phases (R × durée du motif) ou, sans phases, avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip ni phases, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel. La charge n’entre pas dans le calcul (RM-235). | Exercice / occurrence |
| API-ACT-03 | Définir les pauses | Paramètres uniformes/variables, PC | Exercice validé | Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : chapitre 10, Calculs des durées et ordre des phases. | Exercice |
|API-ACT-04|Lire/afficher les médias associés|ID Exercice|Média(s) associé(s) pour la gouttière permanente de la carte d’Exercice|L’affichage en gouttière, sans déploiement, fait partie du MVP (D-260/D-261) ; cette API fonctionnelle ne préjuge pas du mécanisme d’import/capture|Exercice, Média|
|API-ACT-05|Associer des zones corporelles|ID Exercice, zones corporelles|Zones corporelles mises à jour|Une ou plusieurs zones du référentiel utilisateur courant pour un Exercice valide (D-211)|Exercice, Zone corporelle|
|API-ACT-06|Définir le nombre de Séries|ID Exercice, nombre de Séries|Exercice mis à jour|Entier de 1 à 99 ; valeur par défaut 1 ; valeur canonique persistée ; ne crée aucune entité Série autonome|Exercice|
|API-ACT-07|Dupliquer un Exercice de Séance|ID Exercice source|Nouvelle Exercice de Séance indépendante|Nouvel identifiant ; copie des propriétés intrinsèques dont Pause et `sideRecoverySeconds`, ainsi que du `postActivityRecoverySeconds` contextuel de l’occurrence ; insertion immédiatement après la source dans la même zone ; le Point d’arrêt qui suit la source n’est pas copié et garde sa place (`[A, P, B]` → `[A, A′, P, B]`, D-441) ; aucune création dans le catalogue|Exercice, Composition, associations Média|
### Contrats internes des phases d’exercice

Les opérations de création, modification, copie et duplication transportent la liste ordonnée de phases avec les paramètres canoniques. Aucun endpoint ni service distant supplémentaire n’est requis. Contrat de données : chapitre 09, Phases de l’exercice [libellé d’interface remplacé par D-448 du 26/10/2026 : « Phases du mouvement » ; titre de section du chapitre 09 inchangé] ; comportement : [chapitre 08](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phases-exercice).

- Validation du brouillon (D-438) : une durée de phase nulle ou vide reste à renseigner, sans suppression ; l’exercice édité ne peut être enregistré incomplet. Le nommage par défaut des phases ajoutées reste conservé. Retrait de structure uniquement explicite au Catalogue ; structure modifiée par le crayon du mouvement partagé, jamais par une normalisation silencieuse des paramètres locaux.
- Validation : éligibilité, six phases maximum, libellés 20 caractères, chaque phase validée ≥ 1 s et somme des phases comprise entre 1 et 3 535 s (D-430), indépendance vis-à-vis de la durée de série imposée (PHC-20261026) ; les données corrompues ne bénéficient pas d’un effacement silencieux.
- Calcul : somme des phases comme durée du motif ; cible de série indépendante ; projections et agrégats issus des mêmes paramètres, sans double comptage.
- Format : applique sa cible à la série sans modifier les durées des phases ; aucun service d’adaptation proportionnelle ni message de mise à l’échelle (PHC-20261026).
- Génération du plan : conserve la série comme unité logique et expose les sous-étapes chronométrées et leur identité à la reprise/audio.
- Génération de phrase : segments `{texte, gras}` depuis les paramètres effectifs, sans chaîne persistée. Les formulations exactes avec phases restent à intégrer au corpus ; ne pas appliquer les seuls 276 cas historiques comme couverture de cette extension.

Conserver les contrats d’annulation et de copie indépendante ; D-440 dispense de lecture des versions antérieures pour la transition MFN ; ne pas supprimer une liste de phases lors d’un aller-retour par un DTO historique.

### API du Catalogue des Exercices, des Médias et des Parcours

| API | Version | Entrée principale | Résultat / règle |
|---|---|---|---|
| `API-ACT-REF-01..05` | MVP T03 | définition d’Exercice | Créer, lire, lister, modifier, archiver/supprimer une référence autonome. Si des Routines ciblent l’Exercice, l’archivage arrête leurs occurrences futures selon la même règle que pour une Séance ; les occurrences historisées et Exécutions restent conservées. |
| `API-ACT-COPY-01` | MVP T03 | ID référence, ID Séance, position | Crée une occurrence avec référence directe au mouvement et paramètres locaux copiés, charge/activation comprises ; aucun contenu autonome à synchroniser, aucun lien de dépendance envers la définition Catalogue. D-445 / MFN-03. |
| `API-MED-01..05` | MVP PRE-3 | exercice, fichier ou position | Importer/choisir, associer, lister, réordonner et retirer `0..n` médias locaux (D-333) ; nettoyage physique seulement sans référence. Capture caméra à clarifier, sans activation implicite. |
| `API-CAT-01` | MVP T03 / V2 | type, filtre, tri | Avant T03, accepte uniquement `SESSION`; dans le MVP T03, accepte également `ACTIVITY`; l’ancien type autonome `CIRCUIT` n’est pas réintroduit par la planification multi-contenus. Défaut : non archivés, dernière modification décroissante. |
| API-CIR (ancienne famille) | Retirée 08/10 | Sans nouvelle implémentation | L’objet autonome Parcours et son exécution globale ne font plus partie de la cible. |

`API-EXE-05` termine par Suivant toute Série Répétitions ou à cible À l’échec. Les DTO acceptent DURATION/REPETITIONS et une cible typée par Série, ainsi que la charge (activation, valeur commune ou par Série, RM-235 à RM-239) ; TO_FAILURE est un format historique à migrer (chapitre 09). La confirmation du relevé est indépendante de la transition.

## Paramètres d’exécution

### Extension des API — Cadence et phrase

| Opération | Entrées | Sortie / effet atomique | Refus et compatibilité |
|---|---|---|---|
| Valider/appliquer paramètres | Brouillon mode, Séries ordonnées, Bip commun 0..10 et charge (activation, valeur commune ou par Série) | Normalise N1 ; propage cadence ; ✓ remplace le brouillon parent ; Terminer seul persiste | Bip−1/11/non entier : validation refusée et erreur champ ; 0 valide ; les deux modes conservent le Bip ; charge : pas, arrondi, zéro et valeur négative selon RM-239 |
| Calculer paramètres (API-ACT-02) | Collection effective, côtés, PC, R contextuelle éventuelle | Total intrinsèque/occurrence et niveau d’incertitude, ou incomplet ; Ri×b si bip positif en Répétitions, omitted sinon ; Durée chiffrée exacte ; mélange calculable lowerBound ; toutes cibles échec omitted | Pas d’inversion Répétitions ; ni Figma ni Excel en entrée de calcul |
| Générer la phrase | Paramètres valides et résultat temporel fourni | Segments ordonnés `{texte, gras}`, mention de charge active selon RM-240 ; régénérés à chaque affichage | Aucun recalcul de pause/durée dans cette fonction ; aucune mutation métier |
| Démarrer/copier/dupliquer | Définition ou occurrence avec cadences et charge | Snapshot/collection complets, charge et son activation comprises (RM-236) ; début immédiat de première répétition ; aucune nouvelle phase Répétition | Ancien objet sans champ : Bip 0=Aucun ; aucun tempo implicite ; sans charge : Sans, jamais 0 kg (RM-236) |
| Pause/Reprendre/Réinitialiser/Suivant | Exécution, identifiant de transition et horodatage monotone | État récupérable + temps actif cumulé ; intervalle complet après Pause, scope existant pour reset ; Suivant fin normale | Idempotence ; mauvais état refusé ; fin nominale ne déclenche pas Suivant |
| Lire/finaliser résultats | Snapshot et accumulateurs par Série/côté | Prescription immuable et durées réelles, statut existant | Aucun compte de répétitions réalisées ; reset ne supprime pas le temps dépensé |

Les erreurs utilisent les catégories existantes de validation et INVALID_STATE, avec champ/Série localisés ; aucune nouvelle API réseau ou nouvelle entité imposée. La charge, le changement de côté Sans / Avec, les choix rapides de cadence et la Condition d’arrêt dérivée étendent les paramètres échangés par les opérations existantes, sans nouveau service (D-403 à D-413). La nouvelle version d’instantané doit rester lisible avec les snapshots antérieurs ; qualification technique et mobile à réaliser.

### Contrat technique de phrase

Contenu identique à la section [« Migration T03 — Catalogue des Exercices — Contrat technique de phrase »](#migration-t03--catalogue-des-exercices--contrat-technique-de-phrase) : il n’est pas recopié ici.

### Contrats de service — cibles typées et relevés

Validation/édition/copie/instantané transportent le mode commun, la cible typée de chaque Série et la charge, active ou conservée sous Sans (RM-236). La Condition d’arrêt n’est pas transportée comme valeur indépendante : en séries identiques, la choisir fixe la cible commune (RM-248) ; en séries variables, elle est dérivée des cibles (RM-249). Le calcul retourne exact/estimated/lowerBound/omitted selon la chapitre 10, Calculs des cibles mixtes ; aucune valeur pour omitted, erreur distincte. Le générateur reçoit ce résultat et retourne des segments, jamais une phrase persistée.

La fin de Série reste indépendante du relevé. Le service de relevé reçoit l’identité de l’occurrence/côté/tentative, valeur facultative, unité, origine et qualification ; une proposition issue du bip reste estimée jusqu’à confirmation/correction explicite. Événements idempotents, pas de doublons lors de reprise. Aucun endpoint réseau ni nouvelle API déjà implémentée n’est présumé par ce contrat fonctionnel.

<a id="api-phrase"></a>
### Contrat du générateur de phrase

#### Contrat de génération et persistance

Fonction pure : mêmes paramètres, même locale et même résultat métier donnent les mêmes segments. Retour **`Array<{texte: string, gras: boolean}>`**, jamais une chaîne à redécouper par recherche de valeurs. Le choix du gras appartient au gabarit à l’émission des segments ; deux valeurs identiques restent deux occurrences distinctes. La concaténation des `texte` restitue la phrase exacte. Valeurs et unités paramétrées en gras, texte grammatical normal.

Exemple de début : `[{texte:"3",gras:true},{texte:" séries de ",gras:false},{texte:"30 s",gras:true}]`. React Native rend les segments directement en `<Text>` imbriqués dans un `<Text>` parent. Aucun balisage Markdown à analyser au rendu, aucune recherche/remplacement de sous-chaînes pour le gras.

**Aucune phrase ni aucun segment n’est stocké en base**, dans la définition, l’occurrence ou l’instantané. Seuls les paramètres métier sont persistés ; la phrase se régénère **à chaque affichage**, notamment après validation ✓. ✕ annule le brouillon ; ✓ applique atomiquement au parent ; Terminer persiste ses paramètres. Le retour sur une séance existante utilise la grammaire courante, pas une phrase figée avant correction. Les paramètres et durées réelles historiques restent immuables.

Pendant un brouillon incomplet, aucune cible inventée : conserver les règles de champs manquants/validation et interdire✓. Compte à rebours et Fin sont des lignes séparées, exclus du texte et du total intrinsèque.

### Migration T03 — Catalogue des Exercices — Contrat technique de phrase

La [spécification de phrase](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phrases) gouverne le générateur pur : paramètres métier + résultat de durée + locale française → `Array<{texte: string, gras: boolean}>`. Retour vide `[]` si aucune phrase applicable. Aucun calcul depuis Excel, aucune chaîne à redécouper pour trouver les valeurs en gras. React Native utilise des Text imbriqués ; le découpage est émis par le gabarit, y compris si une valeur se répète.

Aucune colonne phrase ni sérialisation des segments dans définition/occurrence/snapshot. Génération à chaque affichage depuis les paramètres ; ✓ applique le brouillon, ne persiste pas le texte. Un changement rédactionnel est visible au prochain rendu des objets existants. Paramètres historiques et temps réalisés préservés.

Français uniquement au MVP. Internationalisation ultérieure : gabarits et règles de pluriel/genre/ordre par locale, avec recette dédiée ; prévoir la réécriture de la grammaire française, pas une traduction des segments isolés. Corpus 276 utilisé uniquement pour les phrases, valeurs totales injectées par le calcul métier.

## Composition des séances

### API Composition d'une séance

| ID         | Opération                              | Entrées principales                                             | Résultat                           | Règles / validations                                                                           | Objets impactés     |
| ---------- | -------------------------------------- | --------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------- |
| API-COM-01 | Initialiser le Cycle technique         | ID Séance                                                        | Cycle créé avec répétition `1`     | Opération interne à la création ; valeur non modifiable et non exposée dans le MVP                           | Cycle               |
| API-COM-02 | Modifier le nombre de Tours du Circuit | ID technique `Tour` représentant le Circuit, nombre de Tours | Conteneur technique `Tour` mis à jour | Nombre de Tours de **1 à 99** ; le nom technique historique n’est pas renommé par D-209. Passage de N = 1 à N ≥ 2 avec un Point de début de Tour et un Point de fin de Tour : choix de celui à conserver, ou annulation du changement ; passage à N = 1 : un Point devenu interdit par RM-219 est retiré sans message (D-442) | Tour (Circuit fonctionnel) |
| API-COM-03 | Ajouter un exercice                   | Position structurelle éventuelle, paramètres, position | Nouvelle Exercice avec identifiant | Aucun type d’Exercice ; premier Exercice créé fonctionnellement avant le Circuit ; les valeurs techniques historiques restent `Avant Tour`, `Dans Tour`, `Après Tour` | Exercice, Cycle, Tour technique éventuel |
| API-COM-04 | Modifier un exercice                  | ID Exercice, valeurs à modifier                                 | Exercice mis à jour               | Respect des règles du mode et des paramètres ; les Exécutions historisées ne sont pas modifiées | Exercice            |
| API-COM-05 | Supprimer un exercice                 | ID Exercice                                                     | Exercice retiré de la composition | L’Exercice doit exister ; les données historiques restent exploitables. Appliquée même si elle laisse un Point à une position non autorisée ou deux Points d’arrêt consécutifs : le ou les Points en cause sont retirés sans message, le premier de deux Points devenus consécutifs étant conservé (D-442, recette J6 du 22/10, qui remplace le refus de D-441 ; RM-251) | Exercice, conteneur |
| API-COM-06 | Réordonner les exercices               | ID Exercice déplacé, position structurelle cible et ordre cible | Nouvelles positions enregistrées   | L’appui long ne persiste rien ; l’opération est appelée uniquement à la dépose dans une destination valide. Déplacement fonctionnel autorisé avant, dans ou après le Circuit ; valeurs techniques historiques `Avant Tour`, `Dans Tour`, `Après Tour` ; positions uniques dans chaque zone. Les Points d’arrêt ne suivent pas l’Exercice et gardent leur position ; dépose appliquée même si elle laisse un Point à une position non autorisée (juste après le Compte à rebours, juste avant la Fin, ou consécutif à un autre Point) : le ou les Points en cause sont retirés sans message, le premier de deux Points devenus consécutifs étant conservé (D-442, qui remplace le refus de D-441 ; RM-251). À N ≥ 2 Tours ou Séries, si la dépose fait se suivre un Point de début de Tour et un Point de fin de Tour, l’utilisateur choisit lequel conserver ou annule la dépose (D-442) | Exercices, Cycle, Tour technique |
| API-COM-07 | Paramétrer le compte à rebours initial | ID Séance, durée, texte vocal                                   | Paramètres mis à jour              | Élément toujours présent ; durée ≥ 0 ; une durée de 0 s rend la phase instantanée              | Séance              |
| API-COM-08 | Paramétrer la fin de séance            | ID Séance, durée, texte vocal                                   | Paramètres mis à jour              | Élément toujours présent ; durée ≥ 0 ; la Fin de séance n’est pas un Exercice                 | Séance              |
| API-COM-09 | Insérer / déplacer / retirer un Point d’arrêt | ID Séance, position ordonnée | Composition mise à jour | Aucun écran dédié ; attente exclue de la durée. Déplacement autonome, indépendant de l’Exercice précédent, appelé à la seule dépose valide ; position interdite ou consécutive à un autre Point refusée sans mutation (RM-251). Tête de Circuit (début de Tour) autorisée ; à N ≥ 2, Points de début et de fin de Tour : choix de celui à conserver, ou annulation de l’action ; à N ≥ 2, début ou fin de Tour autorisés même si le Circuit ouvre ou clôt la Séance (D-442). Retrait par le sous-brouillon de placement, appliqué par Confirmer (D-441) | Séance, Composition |
### Sélection multiple d’Exercices existants — MVP T03

`CompositionService` reçoit les identifiants sélectionnés dans l’ordre courant de présentation produit par la liste filtrée au moment de la validation. Il crée une copie indépendante de chaque `ActivityDefinition` dans cet ordre, en une seule opération de composition. L’ordre temporel des touchers ne fait pas partie du contrat et ne doit pas être persisté.

| Contrat | Entrée | Sortie | Règle |
|---|---|---|---|
| `API-COMP-SEL-01` | IDs d’Exercices ordonnés selon la liste visible, position d’insertion | Références de composition créées | Conserve strictement l’ordre fourni ; aucune modification des définitions persistantes sources. |
| `API-COMP-SEL-02` | Sélection vide | Aucune écriture | L’action de validation reste désactivée. |
| `API-COMP-SEL-03` | Erreur pendant la copie groupée | Erreur fonctionnelle, Composition inchangée | L’insertion est atomique ; aucun sous-ensemble ne reste inséré. |

### Contrat fonctionnel futur — médias pendant l’Exécution

D-203 n’ajoute aucun endpoint MVP immédiatement. La future capacité d’Exécution média devra néanmoins fournir au client, pour l’Exercice courant :
- la liste ordonnée des médias accessibles ;
- le type de chaque média et les informations nécessaires à son rendu / sa lecture ;
- la capacité à signaler un média indisponible sans bloquer la liste.

La face courante, l’index de galerie et l’état de lecture sont des états de session UI et ne nécessitent pas de persistance API durable. Aucun contrat de nommage d’endpoint supplémentaire n’est arrêté par cette conception.

#### Extension future des API Routine — Parcours

Contenu identique à la section [« Parcours MVP T03 — Catalogue des Exercices — Créer et exécuter un Parcours — hors MVP, conception partielle »](Annexe%20%E2%80%93%20Historique%20des%20consolidations.md#parcours-mvp-t03--catalogue-des-exercices--créer-et-exécuter-un-parcours--hors-mvp-conception-partielle) : il n’est pas recopié ici.

#### API de récupération contextuelle — D-208

| ID | Opération | Entrées | Résultat | Règle |
| --- | --- | --- | --- | --- |
| API-COM-REC-01 | Ajouter explicitement une récupération | occurrence, durée validée | pause recovery du brouillon | Proposer le défaut Profil à l’ajout, jamais créer de récupération avec une occurrence. Appelée uniquement depuis le sous-brouillon de placement, appliquée par Confirmer (D-442). |
| API-COM-REC-02 | Modifier la récupération après exercice | ID occurrence, durée ≥ 0 | occurrence mise à jour | `0 s` est une valeur valide et conservée. Appelée uniquement depuis le sous-brouillon de placement : la roulette s’ouvre sur la durée existante (D-442) ; hors placement, la récupération affichée n’est plus une cible. Le retrait passe par la désélection de la récupération en placement et rétablit la Pause terminale (RM-038). |
| API-COM-REC-03 | Déplacer une occurrence | ID occurrence, nouvelle position | ordre mis à jour | `postActivityRecoverySeconds` reste inchangé. |
| API-COM-REC-04 | Dupliquer une occurrence | ID occurrence | copie indépendante | Copie `postActivityRecoverySeconds`. |
| API-COM-REC-05 | Supprimer une occurrence | ID occurrence | occurrence supprimée | La récupération contextuelle disparaît avec elle. |

### Pauses et symboles

Les API de placement travaillent dans un sous-brouillon : ouverture, ajout/édition/retrait par identifiant, validation des positions par type, confirmation atomique/annulation. Le calcul renvoie exact/estimated/lowerBound/omitted ; incomplete reste une erreur de validité distincte. Le générateur reçoit la nature et le montant applicable, jamais les formules Excel.

<a id="api-pauses"></a>
### Opérations sur les récupérations et points d’arrêt

#### Modèle fonctionnel et API

Le modèle logique distingue deux objets de pause : recovery (durée, occurrence source) et breakpoint (position structurelle). La présence explicite n’est pas déduite de la durée. Un identifiant stable permet les opérations idempotentes. L’attachement de recovery à l’occurrence est conservé ; le Point d’arrêt garde ses règles de position structurelle.

postActivityRecoverySeconds devient une projection compatible pour les calculs : durée de recovery si présente,0 sinon. Il n’est pas une seconde source persistée concurrente. Schéma physique et index relèvent du développement. Au main 72d1bf4, seules les migrations 001..008 existent :009 est le numéro suivant constaté, à revalider à l’ouverture de la tranche, pas une réservation globale. Aucune reprise des séances anciennes n’est demandée dans ce lot de conception.

Déplacer/dupliquer l’occurrence conserve sa récupération explicite et ses paramètres ; supprimer l’occurrence supprime sa récupération. Les règles structurelles des points d’arrêt restent celles de la Composition : un breakpoint ne suit ni ne se copie avec l’occurrence, et une opération qui rendrait deux breakpoints consécutifs est refusée (D-441, RM-251), sauf le déplacement et la suppression d’une occurrence, appliqués en retirant sans message le ou les breakpoints en cause, le premier d’une paire étant conservé (D-442). Le snapshot copie les pauses effectives ; POST_ACTIVITY_RECOVERY est générée seulement pour recovery positive. Aucune récupération post-exercice en exécution directe. La machine distingue récupération chronométrée et attente au point d’arrêt ; phases existantes réutilisées.

| Opération | Entrée | Résultat et contrat |
|---|---|---|
| Ouvrir le placement | Brouillon Composition | Sous-brouillon isolé, positions autorisées par type |
| Ajouter recovery | Occurrence, durée validée | Objet explicite ; défaut proposé au moment de l’ajout |
| Ajouter breakpoint | Position autorisée | Objet structurel, pas de durée cible ; refusé s’il suit ou précède un autre breakpoint sans Exercice entre eux (RM-251) ; tête de Circuit autorisée ; à N ≥ 2, début et fin de Tour simultanés : choix de celui à conserver ou annulation (D-442) |
| Déplacer un Point d’arrêt | Identifiant du breakpoint, position cible | Mutation du brouillon à la seule dépose valide ; identité et propriétés conservées ; position interdite ou consécutive refusée sans mutation (D-441, RM-251) |
| Modifier/retirer | Identifiant de pause | Mutation du sous-brouillon de placement, aucune sauvegarde prématurée ; le retrait d’un breakpoint (D-441) ou d’une recovery (D-442) passe par sa désélection dans le sous-brouillon de placement puis Confirmer ; la modification d’une recovery passe par la roulette en placement (D-442) |
| Confirmer/Annuler | Sous-brouillon | Application atomique ou restitution, décompte correct ; libellé « Confirmer les modifications » dès qu’un retrait ou une modification existe (D-441) |
| Calculer le total | Plan et séries effectives | exact/estimated/lowerBound/omitted, ou incomplete |
| Exécuter | Snapshot | Séries/pauses/côtés/récupérations/points selon plan, cadence sonore conservée |

Le scalaire historique `ActivityDefinition.pauseSeconds` représente la Pause après chaque série : sa refonte doit porter cette valeur dans chaque `SeriesParameters.pauseSeconds`. Il ne peut pas être remplacé par la collection de pauses de Composition, qui représente récupération/point d’arrêt. Les deux collections et leurs cycles de vie restent distincts.

## Circuits

### Contrats fonctionnels — circuits

| Opération | Entrées / résultat / atomicité |
|---|---|
| Préparer une conversion | Circuit courant + nature cible ; calcul des exercices affectés et pertes, sans mutation partielle |
| Appliquer une conversion | État préparé confirmé si perte ; appliquer nature, compte et lignes ensemble ; Annuler conserve tout |
| Modifier le compte | Brouillon du circuit ; synchroniser tous les exercices en nature séries, avec réserve temporaire/restauration |
| Ajouter/sortir un exercice | Copie locale indépendante ; confirmer adaptation destructrice à l’ajout ; sortie conserve état actif |
| Obtenir les volumes | Projection en lecture seule : cellules typées valeur/échec/absence, unité/mode, changement de côté ; aucune mutation ni total inventé |
| Construire le plan | Même représentation que validation/calcul ; développement selon nature et phases contextuelles ; identifiants d’occurrences stables |
| Calculer la durée du circuit | Somme des phases effectives, résultat exact/estimated/lowerBound ; aucune lecture du texte de carte |

L’API de mise à jour des paramètres refuse une modification locale de N lorsqu’il est hérité et ne propose pas l’inversion de durée dans ce contexte. Les validations ne reposent pas sur la seule désactivation visuelle. Le formateur de volume respecte le régime ; la phrase complète conserve son générateur de segments et son corpus propre.

## Formats de séances

<a id="formats-api"></a>
### Formats — contrats de services fonctionnels

| Opération | Entrée / sortie | Validation et effets |
|---|---|---|
| Initialiser depuis un modèle | Entrée choisie → brouillon de séance, format/origine et paramètres | Départ rapide = libre ; ne pas déduire le format du nom |
| Modifier un réglage | Brouillon + réglage autorisé → paramètres effectifs, synthèse et durée | Constantes et format inchangés ; refus d’une édition non autorisée |
| Changer l’organisation | Choix admis → ordre effectif | Tabata/EMOM/Progression selon règles ; interdit For time ; volume conservé |
| Développer la prescription | Instantané → occurrences finies ou générateur progressif | Unité d’indexation explicite ; aucun double multiplicateur série × tour |
| Calculer les métriques | Prescription effective → durée typée | EMOM N × E × W ; aucun repos résiduel ajouté ; aucune durée Death by inventée |
| Signaler le travail accompli | Identité d’exécution et de fenêtre courante | Révèle repos ; échéance inchangée ; Death by acquiert au plus une fois la fenêtre |
| Clore Death by | Motif limite/abandon + répétitions partielles applicables | Résultat confirmé, état incomplet ; un seul déclencheur de confirmation |
| Générer les modalités | Paramètres effectifs → segments ordonnés texte/gras | Pas de phrase persistée ; unité par tour/série préservée |
| Lire l’historique | Identité d’exécution → instantané et résultat | Jamais de recalcul depuis la séance source actuelle |

La saisie du rang de fenêtre ou d’un nombre de tours à chaque passage n’est pas exposée. L’horloge génère les échéances ; les commandes doivent être idempotentes face aux doublons. Le formulaire proposé à zéro n’est pas une mesure avant validation. Erreurs : format incompatible, constante modifiée, objectif ou compte invalide selon sa borne existante, unité incohérente et fenêtre obsolète ne doivent pas être acceptés silencieusement. Les détails des combinaisons non résolues sont tracés dans la revue, pas compensés par une valeur métier arbitraire.

## Bilatéralité

### API de bilatéralité

| ID | Commande | Entrée | Effet et garanties |
|---|---|---|---|
| `API-SIDE-01` | Modifier le Changement de côté d’un Exercice | ID, `sideMode` | Valide Sans / Avec (RM-242) ; aucune direction n’est plus choisie ; les valeurs historiques `UNILATERAL` (Sans), `RIGHT_LEFT` et `LEFT_RIGHT` (Avec) restent acceptées en lecture, sans réinterprétation de l’Ordre des côtés (RM-244) ; recalcule les durées et synthèses. |
| `API-SIDE-02` | Compatibilité technique du côté Tour | ID Tour | Aucune mutation utilisateur exposée dans la version actuelle ; le champ historique reste conservé et contraint à `UNILATERAL`. |
| `API-SIDE-03` | Dupliquer | ID Exercice ou Tour | Copie fidèlement `sideMode`, valeur historique comprise sans réécriture (RM-244), ainsi que le contenu dupliqué selon les règles existantes. |
| `API-SIDE-04` | Insérer un Exercice persistant | ID source, ID Séance | Copie `sideMode` dans l’occurrence, valeur historique comprise (RM-244) ; aucun lien dynamique ultérieur. |
| `API-EXE-SIDE-01` | Générer le Plan | Instantané de Séance | Résout `effectiveSideMode`, développe côtés (côté 1 puis côté 2, RM-243)/Séries/Tours, insère `SIDE_RECOVERY` entre côtés et `POST_ACTIVITY_RECOVERY` après occurrences selon leurs valeurs, puis produit un ordre déterministe. |
| `API-EXE-SIDE-02` | Enregistrer un passage | Nœud de plan, côté, résultat | Écriture idempotente séparée par `executionSide` (côté 1 / côté 2 ; résultats historiques lisibles, RM-244) ; agrégation du statut global. |
| `API-EXE-SIDE-03` | Réinitialiser | Nœud et côté courant | Efface ou recommence uniquement le résultat du passage courant. |
| `API-EXE-SIDE-04` | Passer à la suite | Nœud, confirmation éventuelle | Utilise la modale générique ; après le premier côté, ouvre le second avant l’Exercice logique suivant. |

### Évaluations et résultats : contrats fonctionnels PRE-5 (D-427 à D-429)
Standard : sans évaluation avant, Ressenti triétat obligatoire après. Enrichi exclusivement pour le lancement dans un Programme avec option active : douleur initiale 0–10 obligatoire avant (sans localisation) ; douleur finale 0–10 non présélectionnée et effort perçu 1–10 obligatoires après, en remplacement du Ressenti. Si douleur finale positive, localisation d'au moins une zone corporelle KODJO, sélection multiple autorisée avec latéralité applicable ; zéro explicite. Saisie manquante bloque l'action. Un lancement indépendant conserve le standard. Configuration Programme non précisée.

Répétitions partielles (8928:15098), formats imposés, à l'interruption ou série sous cible : proposition zéro, minimum zéro, dépassement cible autorisé. Validation enregistre résultat réel et poursuit automatiquement le plan ; annulation sans effet ni progression.

Résultat de série (8937:35362) : proposition zéro, minimum zéro, dépassement cible autorisé ; validation enregistre résultat réel et poursuit automatiquement le plan ; annulation sans effet ni progression. Déclencheur exact de la modale non arbitré.

Les opérations de démarrage et de fin d'exécution contrôlent les entrées nécessaires selon le contexte. Aucune route ni technologie supplémentaire n'est imposée.

## Exécution

### API Exécution

| ID         | Opération                         | Entrées principales              | Résultat                                                                  | Règles / validations                                                                                                                                | Objets impactés                  |
| ---------- | --------------------------------- | -------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| API-EXE-01 | Démarrer une séance               | ID Séance, occurrence éventuelle | Nouvelle Exécution positionnée au Compte à rebours initial                | La Séance démarre toujours par le Compte à rebours initial ; aucune Exécution n’est enregistrée si l’utilisateur quitte avant le démarrage effectif | Exécution, Occurrence éventuelle |
| API-EXE-01A | Démarrer un Exercice persistant | ID `ActivityDefinition`, occurrence éventuelle | Nouvelle Exécution d’origine `ACTIVITY`, fondée sur un Instantané autonome | L’Exercice peut être lancé directement depuis le Catalogue ou depuis une occurrence d’une Routine `ACTIVITY` ; la préparation directe et les phases propres de l’Exercice s’appliquent ; aucune Séance artificielle n’est créée | Exécution, Occurrence éventuelle |
| API-EXE-02 | Mettre en pause                   | ID Exécution                     | Exécution suspendue                                                       | Exécution en cours requise                                                                                                                          | Exécution                        |
| API-EXE-03 | Reprendre                         | ID Exécution                     | Exécution reprise                                                         | Exécution suspendue requise                                                                                                                         | Exécution                        |
| API-EXE-04 | Réinitialiser l’étape courante | ID Exécution, confirmation | Exercice, Série ou phase de récupération courante recommencée | Confirmation obligatoire ; pendant `SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY`, seul le chronomètre de la phase courante repart du début et l’action est libellée `Réinitialiser la récupération` ; aucun Résultat antérieur n’est modifié | Exécution |
| API-EXE-05 | Actionner `Suivant` | ID Exécution, confirmation éventuelle | Série, Exercice ou phase de récupération courante clôturée, suite activée | Pour un Exercice chronométré, `SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY` avant zéro, confirmation obligatoire selon le contexte ; les temps partiels sont enregistrés dans les champs correspondant à la phase ; en Répétitions ou À l’échec, `Suivant` termine normalement la Série sans confirmation | Exécution |
| API-EXE-06 | Arrêter l’exécution               | ID Exécution, confirmation       | Exécution clôturée                                                        | Arrêt disponible depuis l’état Pause ; après confirmation, l’Exécution est clôturée avec le statut `Interrompue` et la Synthèse est ouverte                                                          | Exécution                        |
| API-EXE-07 | Terminer l’exécution              | ID Exécution                     | Exécution terminée, statut déterminé, résultats enregistrés et écran de sortie applicable ouvert | L’étape `SESSION_END` doit être achevée ; si sa durée vaut `0 s`, l’achèvement est immédiat. T04 ouvre la fin minimale ; la Synthèse n’est ouverte que par la tranche qui la livre. Un arrêt avant cet achèvement relève d’API-EXE-06 et produit le statut `Interrompue` | Exécution, Occurrence éventuelle |
| API-EXE-08 | Obtenir l’état courant            | ID Exécution                     | Étape courante, progression, temps total écoulé, Durée estimée d’exécution, état temporel courant et prochaine étape | Le temps total écoulé inclut toutes les phases effectivement exécutées, dont Pauses entre Séries, `SIDE_RECOVERY`, `POST_ACTIVITY_RECOVERY`, Compte à rebours initial et Fin de séance, et exclut uniquement les Pauses manuelles ; l’état temporel fournit le temps restant pour un Exercice chronométré ou une phase de récupération et le temps écoulé pour un Exercice en Répétitions ou À l’échec | Exécution, lecture |
| API-EXE-09 | Gérer une suspension prolongée     | ID Exécution, durée de suspension, réponse utilisateur éventuelle | Exécution reprise ou clôturée avec le statut `Interrompue` | à partir de 30 min consécutives en pause, proposer Reprendre/Arrêter ; sans réponse, rester suspendu. Reprise : plan conservé, intervalle complet si cadence, aucun effacement du temps actif | Exécution |
| API-EXE-10 | Réconcilier une Exécution après interruption technique | ID Exécution, choix `Reprendre` ou `Arrêter` | Exécution reprise ou clôturée `Interrompue` | Aucune nouvelle Exécution tant que la réconciliation n’est pas faite | Exécution |
| API-EXE-11 | Enregistrer la Synthèse | ID Exécution, Ressenti, Commentaire éventuel | Exécution finalisée et données de Synthèse enregistrées | Ressenti obligatoire si Synthèse présentée ; Commentaire ≤ 200 caractères | Exécution |

#### Règles de navigation pendant l’exécution

Une Séance démarre toujours par le Compte à rebours initial.

L’utilisateur ne peut :
- ni choisir arbitrairement l’étape de démarrage ;
- ni sélectionner directement une autre étape ;
- ni revenir à une étape déjà exécutée.

Il peut uniquement :
- poursuivre l’enchaînement normal ;
- réinitialiser l’Exercice courant après confirmation ;
- passer à l’étape suivante.

Une étape terminée ou passée ne peut pas être rejouée au cours de la même Exécution.

### Exécution directe d’un Exercice — MVP T03

| ID | Service | Entrée | Sortie | Règles |
|---|---|---|---|---|
| API-ACT-EXE-01 | Vérifier l’éligibilité | ID Exercice | Éligible ou erreurs | Validation complète de la définition. |
| API-ACT-EXE-02 | Démarrer | ID Exercice, état de retour Catalogue | ID Exécution, plan | Instantané autonome, origine `ACTIVITY`, préparation `5 s`, aucune Séance créée. |
| API-ACT-EXE-03 | Construire le plan | Instantané Exercice | Étapes développées | Séries, Pauses, côtés et `SIDE_RECOVERY` éventuelle ; charge active de chaque Série transmise pour l’affichage, sans effet sur les étapes (RM-241) ; aucune `POST_ACTIVITY_RECOVERY`, aucun Tour/Cycle ni `SESSION_END`. |
| API-ACT-EXE-04 | Finaliser la Synthèse | ID Exécution, Ressenti, Commentaire éventuel | Exécution finalisée | Ressenti obligatoire si Synthèse présentée ; statistiques compatibles mises à jour. |
| API-ACT-EXE-05 | Obtenir la destination de sortie | ID Exécution | État Catalogue | Filtres et position restaurés ; aucune recherche Catalogue dans le MVP (D-221). |

Les services d’exécution communs acceptent une origine discriminante `SESSION | ACTIVITY`. Ils ne doivent jamais fabriquer une Séance pour satisfaire leurs contrats historiques.

## Planification

### API Routines et Planification

Ces opérations conservent leurs identifiants, avec une entrée étendue à la liste ordonnée de contenus. Contrat fonctionnel cible, pas signature d’API implémentée.

| ID | Opération | Entrées et résultat | Contraintes |
|---|---|---|---|
| API-ROU-01 | Créer | Paramètres du créneau, Programme facultatif, liste ordonnée avec type/référence/fréquence/motif, rappel → Routine | Validation globale ; aucune écriture au simple choix d’une carte |
| API-ROU-02 | Lire | IDRoutine → créneau et ses entrées ordonnées | Respecter le propriétaire et les références |
| API-ROU-03 | Modifier | IDRoutine, brouillon complet → Routine actualisée | Préserver l’échu ; règles de conversion et de motif ouvertes |
| API-ROU-04 | Supprimer | IDRoutine → arrêt du calcul futur | Ne supprime ni sources ni exécutions historiques |
| API-ROU-05 | Calculer | Créneau, période → occurrences avec contenus retenus dans leur ordre | Génération puis filtrage ; un contenu ne crée pas d’occurrence |
| API-ROU-06 | Prochaine occurrence | Type/IDcontenu ou IDRoutine → prochaine occurrence applicable | Le motif du contenu doit être respecté |
| API-ROU-07 | Historiser | Occurrence et résultats des contenus | Modèle d’identité et d’agrégation multi-contenus à préciser avant implémentation |
| API-ROU-08 | Définir/retirer rappel | IDRoutine, activation, délai → rappel local | Permission système ; rappel facultatif unique |
| API-ROU-09 | Préparer duplication | IDRoutine → brouillon incluant liste, ordre, motifs et paramètres | Pas de création avant validation explicite |

Le mode d’exécution de chaque source reste SESSION ou ACTIVITY ; le mot parcours ne crée pas un troisième moteur. La suppression du modèle autonome Parcours retire ses anciennes API-CIR de la cible. L’enchaînement et les états d’une occurrence à plusieurs contenus doivent être spécifiés avant livraison ; ne pas reprendre par défaut l’ancienne Exécution de Parcours.

*Texte identique à celui de la section [« Entité Routine »](09%20%E2%80%93%20Mod%C3%A8le%20de%20donn%C3%A9es%20fonctionnel.md#entité-routine) ; il n’est pas recopié ici.*

## Suivi et synthèse

### API 11.7 Historique et Suivi

| ID         | Opération                         | Entrées principales        | Résultat                                                         | Règles / validations                                                                                          | Objets impactés                          |
| ---------- | --------------------------------- | -------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| API-HIS-01 | Consulter l’historique            | Aucun critère MVP | Exécutions ordonnées du plus récent au plus ancien | Les occurrences `Non exécutée` ne sont pas exposées ; `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivés | Occurrence planifiée, Exécution, lecture |
| API-HIS-02 | Lire une exécution                | ID Exécution               | Détail de l’Exécution                                            | Les informations correspondent aux données historisées au moment de l’Exécution                               | Exécution, lecture                       |
| API-HIS-03 | Lire une occurrence historisée    | ID Occurrence              | Détail de la planification passée et de son statut               | Une occurrence `Exécutée` peut référencer une Exécution ; une occurrence `Non exécutée` n’en référence aucune | Occurrence planifiée, lecture            |
#### Périmètre du Suivi dans le MVP

Le MVP expose la liste chronologique des Séances/Exécutions et leur détail. Les tableaux de bord, graphiques, comparaisons de périodes et indicateurs analytiques avancés ne font pas partie des API fonctionnelles du MVP. Ils seront spécifiés dans une version ultérieure à partir des données historisées.

#### Conservation de l’historique

Les modifications ultérieures d’une Séance ou d’une Routine ne doivent pas rendre illisibles les Exécutions et occurrences déjà historisées.

Chaque Exécution repose sur un **Instantané fonctionnel immuable** créé au démarrage. Cet instantané conserve les informations nécessaires pour restituer fidèlement la Séance exécutée et, dès l’introduction des médias au MVP (D-333), les associations et références média stables, sans dupliquer les fichiers physiques.

Le choix du format et du mode de persistance de cet instantané relève du chapitre `12 – Architecture technique`.

## Profil et préférences

*Préférence facultative `silhouette` du Profil : contrat de service énoncé à la section [« Impact API de la revue des cartes »](06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md#impact-api-de-la-revue-des-cartes) ; il n’est pas recopié ici.*

### API Préférences globales

| ID         | Opération                         | Entrées principales | Résultat                                            | Règles / validations                                                                                                                                     | Objets impactés               |
| ---------- | --------------------------------- | ------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| API-PRE-01 | Lire les préférences globales     | Profil courant      | Préférences de création, planification et exécution | Retourne les valeurs actuellement applicables                                                                                                            | Préférences globales, lecture |
| API-PRE-02 | Modifier les préférences globales | Valeurs à modifier  | Préférences mises à jour                            | Les nouvelles valeurs par défaut ne modifient pas rétroactivement les Séances et Routines existantes lorsque ces valeurs ont été copiées à leur création | Préférences globales          |

## Référentiels

### Référentiels

| ID         | Opération                     | Entrées principales             | Résultat                                    | Règles / validations                                            | Objets impactés          |
| ---------- | ----------------------------- | ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- | ------------------------ |
| API-REF-01 | Lister les catégories         | Aucun ou filtre éventuel        | Liste des catégories                        | Prédéfinies selon `displayOrder`, puis personnalisées par date de création croissante | Catégorie, lecture       |
| API-REF-02 | Créer une catégorie           | Nom, couleur                     | Nouvelle catégorie                          | Respect des contraintes d’unicité ; icône KODJO attribuée automatiquement et non modifiable dans le MVP ; couleur choisie dans la palette de création (12 couleurs de D-026, D-344) ; dans le parcours de création d’une Séance, l’opération reste dans le brouillon et est persistée par `API-SEA-03` ; un nom correspondant à une valeur retirée la réactive (D-257) | Catégorie |
| API-REF-03 | Modifier une catégorie        | ID Catégorie, nouveau nom, couleur éventuelle | Catégorie mise à jour                       | La Catégorie doit exister ; l’icône n’est pas modifiable dans le MVP ; la couleur est modifiable (D-259) | Catégorie |
| API-REF-04 | Supprimer une catégorie | ID Catégorie, confirmation | Catégorie supprimée | Toute Catégorie, initiale ou personnalisée, est supprimable ; si utilisée, elle est retirée des choix futurs mais reste affectée aux Exercices existants concernés ; les Instantanés/Exécutions historiques restent inchangés | Catégorie, Exercice |
| API-REF-05 | Lister les zones corporelles | Aucun | Liste des zones corporelles | Retourne le référentiel utilisateur courant, valeurs par défaut et personnalisées | Zone corporelle, lecture |
| API-REF-06 | Créer une Zone corporelle | Nom | Nouvelle Zone corporelle | Nom obligatoire et unique ; nouvel identifiant stable ; la Zone devient immédiatement sélectionnable ; un nom correspondant à une valeur retirée la réactive (D-257) | Zone corporelle |
| API-REF-07 | Renommer une Zone corporelle | ID Zone, nouveau nom | Zone corporelle mise à jour | L’identifiant reste inchangé ; nom obligatoire et unique | Zone corporelle |
| API-REF-08 | Supprimer une Zone corporelle | ID Zone, confirmation | Zone corporelle supprimée | Toute Zone, initiale ou personnalisée, est supprimable ; si utilisée, la retire des choix futurs tout en conservant les associations des Exercices existants ; les Instantanés/Exécutions historiques restent inchangés | Zone corporelle, Exercice |
| API-REF-09 | Lister les Étiquettes | Aucun | Liste des Étiquettes | Retourne toutes les valeurs courantes du référentiel utilisateur | Étiquette, lecture |
| API-REF-10 | Créer une Étiquette | Nom, couleur | Nouvelle Étiquette | Nom obligatoire et unique ; couleur issue de la palette contrôlée ; un nom correspondant à une valeur retirée la réactive (D-257) | Étiquette |
| API-REF-11 | Renommer une Étiquette | ID Étiquette, nouveau nom | Étiquette mise à jour | L’identifiant reste inchangé ; les Séances associées conservent la référence | Étiquette |
| API-REF-12 | Supprimer une Étiquette | ID Étiquette, confirmation | Étiquette supprimée | Toute Étiquette, initiale ou personnalisée, est supprimable ; si utilisée, elle est retirée des choix futurs mais reste affectée aux Séances existantes ; les Instantanés/Exécutions historiques restent inchangés | Étiquette, Séance |

## Technique

### Conventions fonctionnelles de gestion des erreurs

Toute API fonctionnelle doit retourner soit un résultat valide, soit une erreur fonctionnelle explicite.

Une erreur fonctionnelle comporte au minimum :
- un **code stable**, destiné à l’application ;
- un **message utilisateur**, compréhensible et non technique ;
- éventuellement le **champ ou l’objet concerné** lorsque l’erreur est liée à une donnée précise.

Les erreurs sont classées selon les catégories suivantes :

| Catégorie | Usage | Exemple |
|---|---|---|
| `VALIDATION` | Une donnée fournie ne respecte pas une règle fonctionnelle | fréquence hebdomadaire < 1 |
| `NOT_FOUND` | L’objet demandé n’existe pas ou n’est plus disponible | Séance inexistante |
| `INVALID_STATE` | L’opération n’est pas autorisée dans l’état courant de l’objet | reprendre une Exécution non suspendue |
| `CONFLICT` | L’opération créerait une incohérence avec les données existantes | création d’une catégorie avec un nom déjà utilisé |
| `PERMISSION` | L’utilisateur n’est pas autorisé à effectuer l’opération | réservé aux évolutions avec gestion des comptes |
| `TECHNICAL` | Une erreur technique empêche l’opération | stockage indisponible |

Les codes d’erreur sont stables et indépendants du texte affiché à l’utilisateur.

Une erreur technique ne doit jamais exposer directement à l’utilisateur des informations internes telles qu’une trace d’exception, un chemin de fichier, une requête ou une information sensible.

Les erreurs de validation doivent être détectées avant toute modification persistante lorsque cela est possible.

Une opération qui échoue ne doit pas laisser les données dans un état partiellement modifié.

Lorsqu’une opération comporte plusieurs modifications liées, celles-ci doivent être considérées fonctionnellement comme une seule opération : soit l’ensemble réussit, soit aucune modification n’est conservée.

Les codes d’erreur suivent une convention lisible et stable, par exemple :
- `SESSION_NOT_FOUND`
- `ROUTINE_INVALID_FREQUENCY`
- `EXECUTION_INVALID_STATE`
- `CATEGORY_ALREADY_EXISTS`

La liste exhaustive des codes d’erreur est établie au cours de l’implémentation à partir des règles fonctionnelles définies dans la documentation.

Les détails techniques de représentation des erreurs, notamment les exceptions, objets de résultat, codes de transport ou mécanismes de journalisation, sont définis dans le chapitre `12 – Architecture technique`.

### API externes et évolutions futures

Les interfaces externes suivantes ne font pas partie du périmètre des API internes du MVP mais constituent des extensions possibles :

- synchronisation avec les calendriers Apple, Google et Microsoft ;
- import de contenus externes associés aux exercices ;
- intégration de bibliothèques externes de vidéos ou médias ;
- échanges avec des kinésithérapeutes ou coachs ;
- réception ou partage de Séances et programmes ;
- synchronisation multi-appareils ou avec un service cloud ;
- exposition future d’API permettant à des solutions tierces d’interagir avec l’application.

Ces intégrations feront l’objet de spécifications dédiées lorsqu’elles entreront dans le périmètre d’une version du produit.

## Sujets transverses

### Principes généraux

Les API fonctionnelles respectent les principes suivants :
- une Séance représente un contenu exécutable ; dans le MVP T03, un Exercice persistant valide peut aussi constituer directement une source d’Exécution ;
- *Texte identique à celui de la section [« Synthèse des parcours du MVP — Principes communs »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#synthèse-des-parcours-du-mvp--principes-communs) ; il n’est pas recopié ici.*
- une Exécution représente la réalisation effective d’une source `SESSION` ou `ACTIVITY` ;
- les occurrences futures d’une Routine sont calculées dynamiquement et ne sont pas persistées ;
- une occurrence arrivée à échéance est historisée avec le statut `Exécutée` ou `Non exécutée` ;
- une modification des Préférences globales n’altère pas rétroactivement les objets déjà créés lorsque ces préférences ont été copiées dans ces objets ;
- les règles de validation définies dans les chapitres fonctionnels restent applicables aux opérations décrites ici ;
- une opération ne modifie jamais rétroactivement les données historisées, sauf règle explicite contraire.
- les services applicatifs accèdent aux données via des contrats de Repository et ne dépendent pas directement de SQLite, de Drizzle ORM ou d’un futur fournisseur cloud ;
- les API fonctionnelles restent identiques qu’une donnée soit persistée localement ou, dans une version future, synchronisée avec une source distante.

### Compléments de cohérence MVP

- Une Exécution lancée depuis une occurrence planifiée conserve le lien avec cette occurrence et la date/heure initialement prévues.
- L’Instantané d’Exécution est un JSON immuable ; les champs nécessaires à la recherche et au tri chronologique du Suivi MVP sont accessibles efficacement. Les index dédiés aux filtres avancés sont reportés avec cette évolution.
- Les API Média sont incluses au MVP dans PRE-3 (D-333) pour importer/associer, lister, réordonner et retirer `0..n` photos ou vidéos locales ; la capture caméra n’est pas implicitement activée.

### API fonctionnelles — consolidation D-209 à D-217

- Création/mise à jour d’un Exercice : Catégorie exactement `1`, Zones corporelles `1..n`; une référence retirée du référentiel actif reste acceptable si elle est déjà affectée à l’objet modifié, mais ne peut pas être nouvellement affectée.
- Suppression référentiel : désactive la valeur pour les nouvelles sélections sans casser les références existantes ; Étiquette/Catégorie conservent nom et couleur nécessaires au rendu des objets existants.
- Mise à jour couleur Étiquette/Catégorie : agit sur le référentiel source ; les consommateurs relisent cette couleur, sans copie locale par objet.
- Création Exercice / occurrence : lecture ponctuelle des défauts Profil, sans synchronisation ultérieure.
- Mise à jour Séance : aucun paramètre d’activation des Compte à rebours/Fin propres aux Exercices. Construction du plan SESSION : exclusion inconditionnelle de ces phases, sans effacement des valeurs propres ; les phases de Séance les remplacent.
- Construction du Plan : développe le Circuit pour `tourCount` Tours ; tout Point d’arrêt interne au Circuit est reproduit à chaque Tour ; après un Exercice, `POST_ACTIVITY_RECOVERY` précède le Point d’arrêt.

| ID | Opération | Entrées principales | Résultat | Règles / validations | Objets impactés |
|---|---|---|---|---|---|
| API-PHRASE-01 | Générer la phrase de synthèse | Paramètres courants de l’Exercice | Segments `{texte, gras}` ou tableau vide | Applique D-298 et [Phrase de synthèse des paramètres](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phrase-de-synthèse-des-paramètres) à partir des paramètres et du résultat de calcul fourni (total et niveau d’incertitude) ; sans mode retourne un tableau vide. Mention de charge selon RM-240 ; côtés désignés côté 1 / côté 2 (RM-243). Ne recalcule aucune durée et ne persiste aucune phrase ni aucun segment, même en cache en base. | Exercice |
| API-PARAM-01 | Valider les bornes des paramètres | Paramètres d’exécution | paramètres valides / erreur | Séries `1..99`; Répétitions `1..100`; durée par Série `1..3535 s` (D-430); somme des phases `1..3535 s` (D-430); pauses inter-Séries/inter-côtés `0..300 s`. Une valeur héritée hors bornes, non modifiée, est acceptée ; toute valeur saisie ou modifiée doit respecter ces bornes (D-383). Charge : RM-239 (D-405), hors de ces bornes. | Exercice |

> **Clôture des contrats — 01/10/2026.** Les règles consolidées du [chapitre 13, §6](13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#clôture-des-réserves-fonctionnelles-des-contrats) s’appliquent : progression sur le plan complet ; transitions et pauses selon D-248 et [Ordres d’exécution et pauses](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#ordres-dexécution-et-pauses) (ancien repli D-242 retiré) ; fréquence 1..12 semaines ; rappel personnalisé au plus 24 h. En Un côté après l’autre, le reset porte sur le bloc du côté courant ; la même règle s’applique à l’ordre alterné en conservant les résultats de l’autre côté (chapitre 13 R-03). Les étapes et calculs ci-dessous se lisent avec ces précisions ; aucune nouvelle disposition d’écran.

#### Saisie des paramètres d’exécution

Contenu identique à la section [« Saisie des paramètres d’exécution »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#saisie-des-paramètres-dexécution) : il n’est pas recopié ici.

#### Contrat transverse des paramètres v13

Validation, calcul, duplication, insertion dans une Séance et instantané partagent la représentation de chapitre 08, paramètres d’exercice. Le tableau ordonné cible/Pause/charge et l’état variable explicite sont copiés intégralement, avec l’activation de la charge (RM-236). Les API de Séance calculent To avec récupération explicite, sans ajouter R deux fois. Les API de lecture ne réécrivent pas les résultats historiques. Aucun champ caché de brouillon ne traverse la persistance ; les charges conservées sous Sans ne sont pas un champ caché de brouillon et sont persistées (RM-236, D-403).


## Contrats de service — incidence du relevé 25/10

**D-445 — décisions validées le 25/10 :** C01–C07 et C09 sont clos ; C08 seul reste différé sur le périmètre MVP. [Spécification consolidée v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md). [bandeau répété dans ce chapitre, sans portée propre : même renvoi à D-445 que celui d’en-tête — annotation du 26/10/2026]

Références : [v6](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md), [relevé courant, contradictions et couverture](../DSF-NIVEAUX-RECHERCHE-2026-10-25.md).


### Phases — clarification PHC-20261026

Les phases forment un motif cyclique de guidage : un passage complet correspond à une répétition guidée. Chaque phase conserve une durée en secondes. La somme des phases est la durée du motif, jamais la durée cible de la série. Les modes Durée et Répétitions, avec cible chiffrée ou À l’échec, sont compatibles ; seules les séries variables restent incompatibles avec les phases. [remplacé par D-446 du 26/10/2026 : les phases sont aussi compatibles avec les séries variables ; une seule séquence de phases et de durées, commune à toutes les séries] La condition d’arrêt appartient à la série. En Durée chiffrée, la cible indépendante termine la série à échéance, même au milieu d’une phase. À l’échec, le guidage boucle jusqu’à Suivant. En Répétitions chiffrées, R motifs donnent une durée nominale R × somme des phases ; Suivant conserve la validation manuelle existante. Chaque nouvelle série recommence à la première phase. Les cycles guidés ne prouvent pas les répétitions effectivement réalisées.

Modifier, ajouter ou supprimer une phase ne réécrit pas la cible de série. Toutes les durées de phase sont éditables, y compris sous un format à durée imposée : aucune dernière phase calculée, aucune adaptation proportionnelle pour faire tenir le motif dans la série. Une durée manquante reste à renseigner ; ne pas inventer une durée depuis l’objectif de série. Les bornes existantes des phases restent des bornes du motif, indépendantes de celles de la cible. Le retrait 2 → 1 conserve le passage à Sans mais ne remplace plus la cible par la durée restante. Sans phases conserve également la cible existante.

Référence normative : [PHC-20261026](../KODJO-Phases-Guidage-Cyclique-2026-10-26.md). La règle Répétitions sans bip = non calculable concerne désormais les exercices sans phases : avec phases, R × durée du motif donne une estimation nominale, jamais une mesure. Arrêt mixte et guidage après objectif avant Suivant restent les deux points distincts décrits dans cette référence. [clos par D-446 du 26/10/2026 : l’arrêt mixte se représente par les séries variables, avec phases ; en Répétitions chiffrées, le motif continue de boucler, sans signal, entre la cible et Suivant] Les anciennes captures sont des preuves datées ; alignement Figma et code non revendiqué.

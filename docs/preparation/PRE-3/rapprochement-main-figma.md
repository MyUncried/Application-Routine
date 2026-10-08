# PRE-3 — Rapprochement de main, du périmètre et de Figma

Date : 08/10/2026. Baseline exclusive : `main@17d9774a31429bc2bee4eb834e4ed1e9aafa68ec`, après la fusion documentaire #338. Préparation existante : #333, `a6d0bb1ca7d3ee2904f5607e9be33e9455eda039`.

## Résultat de la vérification

Le périmètre validé reste pertinent : éditeur d’Exercice depuis Catalogue/Séance, paramètres uniformes/variables, côtés, bip configuré, calculs, phrases, référentiels ouverts depuis l’éditeur, persistance/copies et import de médias avant le moteur. Les 23 exigences sont conservées. La mise à jour de planification #338 ne devient pas implicitement un développement PRE-3.

Les 41 références Figma existent dans `Prototype MVP`, page `510:101`, et conservent leurs noms et dimensions 402×874. Leurs textes, accès médias et dimensions des feuilles Paramètres ont été interrogés directement. Quatre compositions ont été inspectées visuellement : `4217:6980`, `6665:24616`, `7059:13302`, `4478:7209`. [Preuve structurée](verification-figma-2026-10-08.json). Ce relevé initial est complété par [l’extraction détaillée](extraction-figma.md), avec 6 725 éléments, 41 captures, maîtres/variantes, tokens et seconde lecture des 41 arbres. La conformité d’une implémentation reste à qualifier.

Le détail du parcours d’import n’est pas suffisamment défini pour un plan technique complet : La photothèque est mentionnée dans la cible médias du chapitre05 (ancienne répartition V2 du06/09). L’extension à la capture caméra, les formats/contraintes, permissions et états d’import restent À CLARIFIER. L’accès photo visible et les médias de démonstration ne prouvent ni une caméra, ni un type de sélecteur système, ni des limites métier.

## Corrections et contrôle par axe

Le statut porte sur la cohérence du dossier de préparation, pas sur une fonctionnalité implémentée ou testée dans l’application.

| Axe | Attendu / source | Statut après correction | Évidence et ancienne règle recherchée | Suite |
|---|---|---|---|---|
| Baseline | main après #338 | CONFORME | Tête Git vérifiée ; préparation actualisée depuis 17d9774a, sans reprendre silencieusement l’ancien main | Refiger au départ du développement si main avance |
| Décisions | Identifiants uniques et règles explicites | CONFORME | D-327 de main = grille DSF ; ancienne D-327 médias de #333 réconciliée en D-333. D-327–332 de main préservées ; D-066/D-068/D-115 amendées, ancien D-116 identifié comme historique | Aucune décision fonctionnelle supplémentaire déduite |
| Médias au MVP | Décision propriétaire, CE-T03-04, D-333 | CONFORME sur l’inclusion | Exclusions « hors MVP », « post-MVP », « actif en V2 », section masquée et API-MED V2 recherchées. Vision, versions, modèle, données, processus, API, architecture, contrats, PRODUCT et INDEX alignés | Détails d’import ci-dessous |
| Import utilisable | Ajouter, enregistrer, rouvrir, copier ; P3-23 | PARTIELLEMENT CONFORME | Chapitre09 définit photo/vidéo, 0..n, ordre, fichiers locaux et conservation ; Figma4217:6980/4734:6342 expose l’accès. Photothèque mentionnée au chapitre05 ; ancienne capture V2 non arbitrée pour PRE-3 ; formats/permissions/erreurs non définis | Clarifier et compléter les états avant l’implémentation |
| Racines de données | Préserver la cible de main | CONFORME | Résolution du conflit09 : MediaAsset/ActivityMedia passent au MVP ; anciennes lignes Parcours/CircuitSession/CircuitExecution ne sont pas réintroduites. D-328 conservée | Planification reste un chantier distinct |
| Paramètres | Paramètres v13, D-247–255, D-308–314 | CONFORME sur le périmètre | Trois modes, variable explicite, N1, deux directions/ordres, bornes, restauration de brouillon, pauses et bip présents dans le dossier ; références6665 et7059 vérifiées | Plan technique et tests futurs |
| Calculs | Bip v2§§2–3 et Paramètres v13§§4–5,9 | CONFORME sur les règles de sortie | Totaux A195/B285/C405/D375 ; N1 bilatéral220 puis235 avec récupération ; répétitions cadencées300. Pas de 2s/répétition ; R remplace la dernière Pause seulement | Implémenter puis qualifier domaine et projections SQL |
| Phrase | Phrase v1 et corpus276 v15 | CONFORME sur le périmètre | Exception N1 précisée : total omis seulement sans côté ET sans pause. Ancienne formulation « redondante (N1 unilatéral) » du modèle précisée ; périmètre complété. Montants Excel non utilisés comme oracle métier | Tests des segments et calculs indépendants |
| Interface de référence | Figma actuel et DSF commun | EXTRACTION DOCUMENTÉE | 41/41 arbres relus ; 6 725 éléments, 47 maîtres, 17 ensembles/75 racines de variantes, 22 styles/134 variables et 41 PNG. Usages recensés dans les 11 pages. DSF général D-327 de main conservé | Relier ces propriétés au plan et comparer l’application après développement |
| Profil / récupération | D-304/D-307 | CONFORME sur la frontière | Aucune récupération automatique à créer dans PRE-3 ; existantes conservées. Défauts Profil lus sans refonte du Profil | Corriger adaptateurs de création/copie dans le plan |
| Frontières | PRE-4/PRE-5/EXE | CONFORME sur le périmètre | Placement récupération/points, refonte générale des cartes, planification nouvelle, lecture média et audio réel exclus de cette livraison PRE-3 ; données utiles au moteur incluses | Affectations inchangées |
| Code et migrations | Existant main, pas proposition ancienne | PARTIELLEMENT CONFORME | Scalars, projections d’édition sans médias, remplacement associations, SQL de durée recopié et migrations001–008 relus/recherchés | Graphe d’impact exhaustif, schéma/migration et liste finale de fichiers à établir |
| Conformité applicative | Livraison puis preuves | NON VÉRIFIABLE dans ce lot | Aucun code applicatif modifié ; aucun test d’une future implémentation PRE-3 effectué | Qualification après développement |

## Médias : opérations déterminées et points à clarifier

Déterminé par les sources et la décision validée :

- Ajouter/importer des photos ou vidéos locales depuis l’éditeur, dans les quatre parcours créer/modifier × Catalogue/Séance.
- Associer au brouillon puis persister avec l’Exercice ; rouvrir sans perdre les associations lors d’une simple modification de nom/paramètres.
- Collection 0..n ; ajout en dernière position ; réorganisation des associations ; premier média comme vignette, couverture si vidéo.
- Copies indépendantes des associations, référence possible au même fichier immuable ; retrait d’association seulement ; aucun fichier encore référencé par définition, copie ou instantané supprimé.
- Métadonnées locales nécessaires au moteur ultérieur ; aucun moteur de lecture d’exécution réalisé dans PRE-3.

Source retrouvée : photothèque au chapitre05, répartition du06/09. À CLARIFIER avant de figer le plan d’import : éventuelle extension aux fichiers ou à la capture caméra (ancienne mention V2 « capture ou photothèque »), formats/compatibilité et éventuelles limites, gestion des permissions/refus, présentation des états chargement/annulation/erreur et gestes de réorganisation/retrait dans l’éditeur. Aucune capacité caméra ni limite arbitraire n’est validée ici. Les règles de stockage local et de conservation sont déjà fermées et ne sont pas reposées.

## Entrées du futur plan technique

La [matrice23 exigences](perimetre-et-couverture.md) reste la recette de référence ; aucune identité VNext, activation de tranche, requête de file ou revue produit n’est créée par cette préparation.

| Bloc / exigences | Fichiers ou consommateurs observés | Travail à préparer et tests |
|---|---|---|
| Modèle et brouillon — P3-04–11,16–18 | ActivityDefinition.ts, Session.ts, SessionDraft.ts, validation.ts | Collection et état explicite, normalisation anciens objets et N1, brouillon atomique, copie ; tests domaine/transitions |
| Calculs et inversion — P3-12–14 | calculations.ts, compositionPresentation.ts, SqliteSessionRepository.ts | Résultat typé et représentation partagée ; mettre à jour aussi les projections SQL des listes, pas seulement le calcul JS ; tests numériques et parité SQLite |
| Phrase — P3-15 | ActivityEditorForm.tsx et résumés Composition/Catalogue | Générateur pur et segments ;276 gabarits, montants indépendants ; tests gras/ponctuation/min-max/longueur |
| Éditeur — P3-01–03,16,19–21 | ExerciseScreen.tsx, ActivityEditorForm.tsx ; CategoryPickerModal.tsx, BodyZonePickerModal.tsx | Deux adaptateurs et formulaire commun ; sous-brouillon Paramètres, référentiels, focus, clavier/scroll ; tests rendu/navigation/annulation |
| Contrôles partagés — P3-19–22 | DurationWheelPicker et WheelPickerOverlay sont utilisés par ActivityEditorForm ET CompositionScreen ; ProfileStepper est utilisé par ProfileScreen | Réutiliser/adapter sans modifier implicitement le Profil ou la Composition ; tests de régression de ces consommateurs avant de changer les composants partagés |
| Persistance — P3-17–18 | SqliteActivityDefinitionRepository, SqliteSessionRepository, migrations001–008 | Migration additive, conservation IDs et anciennes données, copies/instantanés ; numéro revalidé au développement |
| Médias — P3-23 | MediaAsset.ts, ActivityMedia.ts, MediaRepository.ts, SqliteMediaRepository.ts, projection activityDefinitionToInput et copie en SessionDraft | Service d’import et cycle fichiers/associations ; préserver l’existant en édition ; représentation des associations de copie à compléter ; import nominal/annulé/erreur, redémarrage et suppression référencée |

Les fichiers ci-dessus sont des entrées observées, pas une liste d’écriture approuvée. Les tests existants ActivityDefinition, ActivityEditorForm, ActivityDefinitionService, calculations, SessionDraft, SessionService, SqliteActivityDefinitionRepository, SqliteSessionRepository, SqliteMediaRepository, MediaRepository et les tests des roulettes/référentiels sont repérés ; ils restent à relier à chaque assertion atomique dans le plan. L’extraction Figma est disponible ; le graphe applicatif complet (dont barrels/résumés/instantanés) et les règles d’import manquantes restent nécessaires avant de déclarer ce plan prêt.

## Seconde passe

Passe distincte après modification : vérifier D-333 et l’absence de collision avec D-327–332 ; rechercher les exclusions médias et leurs variantes dans les sources actives ; comparer les modifications à main ; contrôler les références Markdown et les noms physiques ; confronter les règles N1/Pause/bip aux trois spécifications normatives ; vérifier les références Figma de la matrice. Les historiques explicitement supersédés et rapports datés restent conservés, sans normalisation globale. Résultat exécuté : 20 fichiers documentaires ajoutés/modifiés ; 2 286 fichiers de la baseline inchangés dans l’index Git, aucune suppression ni aucun renommage. Identifiants de décisions uniques ; 23 exigences P3 et 41 références Figma contrôlées ; aucune nouvelle référence Markdown cassée, aucune dégradation UTF-8, aucun marqueur de conflit. Exclusions médias actives recherchées et supprimées ; les mentions de déploiement de carte historique et les décisions explicitement supersédées restent conservées. Aucun fichier applicatif ou workflow modifié. Les règles N1 et les reports D-115 ont été repris lors de cette seconde passe. git diff --check réussit. Ces contrôles documentaires ne remplacent pas les tests de la future implémentation.

## Arbitrage de reprise PRE-3 — source d’import

Le08/10/2026, Hermann choisit la **photothèque seule** (D-334, issue #340). Photos et vidéos locales restent incluses. Les mentions précédentes « caméra / sources système à clarifier » décrivent la préparation antérieure et sont remplacées sur ce seul point. Formats/compatibilité, permissions effectives et présentation des états/gestes manquants restent à finaliser dans le plan ; aucune limite arbitraire ajoutée.

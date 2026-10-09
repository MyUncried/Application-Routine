# PRE-3 — Plan technique corrigé pour la troisième revue ciblée

Opération #340. Version du 9 octobre 2026. **CORRECTED_PENDING_INDEPENDENT_REVIEW**. Aucun développement autorisé, aucune approbation propriétaire du plan.

Ce document et les fichiers de `manifest.json` constituent le dossier effectif de cette troisième revue ciblée. La seconde revue publiée au commit `bf6a8cbc0d770031d7940f1aafe209f427f5f627` conserve onze résolutions indépendantes ; seuls FND-5b6a, FND-c3c9 et leurs régressions REG-01/REG-02 sont à revoir. Les anciens PlanContract/UIContract scellés restent des preuves historiques du plan initial ; leurs projections ne sont plus le plan soumis à approbation. Sur instruction du propriétaire « tu corriges le plan, on relance la revue avec Claude, on voit après », la révision contourne uniquement le verrou de portée VNext qui empêchait la correction. Elle n'est pas présentée comme un nouveau `produced` VNext admis, ni comme un reçu valide. Aucun correctif du protocole n’est engagé par cette révision ; aucun reçu existant n’est modifié.

Le périmètre normatif complet `../../perimetre-et-couverture.md` reste opposable. Baseline applicative `1ddfb6d144552f578388257adc78db47ab5992c8`. D-333/D-334/D-335 et la clarification numérique A sont conservées. Les propositions physiques/compatibilité neutre CR/Fin déjà soumises demeurent des choix techniques à examiner dans ce plan, pas des décisions produit nouvelles.

## 1. Résultat et frontières

Les 23 exigences et toutes les règles de `../../perimetre-et-couverture.md` restent opposables. Livrer les quatre parcours créer/modifier × définition Catalogue/copie de Séance, paramètres, calculs, phrase, persistance et import de photos/vidéos. Conserver les noms/chemins. Aucun moteur d’exécution, émission sonore, lecture en exécution, refonte générale Composition/Catalogue/Profil/Étiquettes/Calendrier, placement PRE-4 ou sélecteur Catalogue à deux options.

Photothèque seule : choix propriétaire recueilli dans cette conversation et reporté sur #340. D-335 valide les modalités A, consignées dans decision-modalites-import.json. Les limites natives seront établies par vérification technique, sans réduction de P3-23.

## 2. Parcours utilisateur général

Depuis Catalogue, créer ouvre un brouillon de définition ; modifier charge la définition et ses associations. Depuis Séance, créer/modifier travaille sur une copie isolée du brouillon de Composition. Aucun changement de la copie ne modifie la définition Catalogue.
La carte Paramètres ouvre une copie de travail. ✕/retour abandonne cette ouverture ; ✓ remplace atomiquement les paramètres du parent sans écrire l’Exercice. Terminer seul valide et enregistre la définition Catalogue, ou applique la copie au parent Composition selon le parcours existant ; Continuer conserve sa responsabilité de persister la Séance complète. Aucune sauvegarde prématurée de Séance n’est introduite pour rendre l’éditeur indépendant.
La capacité locale existante est préservée ; le parcours courant Ajouter un exercice → sélection Catalogue reste inchangé (CE-T03-06), sans réintroduire un menu à deux options.

## 3. Graphe observé et écritures

`graphe-consommateurs.json` conserve le scan des imports littéraux, reexports et require de 219 fichiers src/app et la fermeture inverse de 12 racines. Ce scan n’atteste pas les écritures SQL ni les accès dynamiques : revue sémantique obligatoire de ces frontières.

| Chaîne | Entrées et consommateurs à traiter | Écriture / conservation |
|---|---|---|
| Définition | ActivityDefinition.ts, ActivityDefinitionRepository.ts, ActivityDefinitionService.ts, ExerciseScreen.tsx, ActivityEditorForm.tsx | Create/update SQLite ; validation, mappings complets et réouverture |
| Copie | ActivitySelectionScreen.tsx, activityDefinitionToDraftExercise, SessionDraft.ts, SessionDraftContext/Provider, ExerciseScreen.tsx, SessionService.ts | Brouillon de copie puis transaction de Séance ; IDs distincts, aucun write-back Catalogue |
| Séance | Session.ts, validation.ts, composition.ts, SqliteSessionRepository.ts, DatabaseRows.ts | Create/update/read, synchronisation des occurrences, associations et paramètres |
| Calculs | calculations.ts, compositionPresentation.ts, formatSessionSummary.ts, ExerciseScreen.tsx, cartes et catalogues | Adaptation minimale des projections et symboles ; retirer le second calcul divergent SQL |
| Référentiels | CategoryPickerModal.tsx, BodyZonePickerModal.tsx, services et repositories existants | Garder réactivation, affectations retirées, transaction et validation PRE-2 ; nom vide désactive Ajouter sans erreur |
| Contrôles | DurationWheelPicker.tsx, WheelPickerOverlay.tsx, ProfileStepper.tsx, shells et tokens | Réutilisation ciblée ; ne pas changer le comportement du Profil et Composition hors besoin démontré |
| Médias | MediaAsset.ts, ActivityMedia.ts, MediaRepository.ts, SqliteMediaRepository.ts, SqliteActivityDefinitionRepository.ts et les copies de Séance | Fichier interne stable ; liens ordonnés distincts pour chaque propriétaire ; aucune suppression si encore référencé |
| Historique | Aucun domaine/repository d’Exécution/Snapshot trouvé dans src/domain de cette baseline | Ne pas créer le moteur ; fournir sérialisation de paramètres/médias versionnée testable pour les futurs instantanés ; ne jamais réécrire un historique existant |

Points démontrés : activityDefinitionToInput et la copie ne transportent pas les médias ; update supprime les liens puis réinsère input.media ou [] ; le Repository médias ne sait que lire ; SessionDraftExercise manque de catégorie, PC et médias ; les calculs restent scalaires ; la projection SQL ignore cadence, variable et ordre par paire ; ExerciseScreen crée encore une récupération depuis le Profil.

## 4. Représentation cible proposée

Créer un module Domaine partagé `src/domain/activities/ExecutionParameters.ts` (nom de création proposé, à inscrire dans les create slots VNext). Structure versionnée, discriminée par mode et séries uniformes/variables : un seul N par côté ; soit cible/Pause uniformes, soit N lignes ordonnées cible/Pause. Variable reste explicite même si toutes les lignes sont égales. Pas de surcharges cachées.
Direction, ordre des côtés, PC, bip commun, compte à rebours et fin appartiennent aux paramètres d’Exercice. R reste exclusivement dans l’occurrence. La cadence n’a aucune saisie autonome par ligne ; toute projection des lignes la copie depuis le champ commun.
Le normaliseur d’anciens objets restitue uniforme, ordre par côté, bip=0 ; garde mode, quantité de travail, cible, pause et direction. Ne pas relire le Profil pour les objets existants. `schema-et-ecritures.md` explicite la proposition de compatibilité neutre CR/Fin0 pour les anciens objets absents, distincte des défauts des nouveaux ; cette proposition doit passer la revue et la validation du plan, sans être présentée comme une décision déjà acquise.
N=1 normalise l’état effectif et l’ordre immédiatement. Le brouillon peut garder les états temporaires, mais la valeur sauvegardée à N=1 ne les contient jamais. Les scalaires de compatibilité, s’ils restent exposés, sont des projections dérivées de la représentation canonique : aucune écriture indépendante et aucun calcul métier concurrent.

## 5. Migration et SQLite

Migrations 001..008 seules présentes à cette baseline ; version suivante observée 009, à revalider avant développement. Ne modifier aucun fichier de migration historique. Ajouter une représentation versionnée des paramètres aux définitions et occurrences, et les associations de médias d’occurrence avec FK et position unique par propriétaire. Les nouvelles colonnes peuvent être nullable pour distinguer un ancien objet d’un objet canonique.
Le choix physique proposé est un JSON canonique versionné pour les paramètres, validé au Domaine et au Repository, avec adaptation des anciens scalaires à la lecture. La migration conserve IDs, données, références et dates ; elle ne backfill pas les valeurs Profil courantes. La confrontation aux CHECK et writers conduit à conserver les tables et écrire les scalaires comme projections de la première cible/Pause effective : voir `schema-et-ecritures.md` et `inventaire-ecritures.json`. Aucun schéma SQL livré ni approuvé n’est déclaré dans ce dossier.
En variable, l’ordre du JSON est la source ; ni cible uniforme persistée concurrente, ni phrase/total dérivé en base. Transactions exclusives existantes conservées. Paramètres et liens d’un Exercice sont validés et écrits ensemble. Erreur : rollback et brouillon intact. La liste des Séances doit utiliser un seul calcul métier partagé après lecture des données nécessaires, ou une projection SQL démontrée équivalente ; aucun ancien calcul scalaire laissé en production pour les listes.
Tester avec NodeSqliteDatabase réel : base neuve, upgrade v8 peuplé, idempotence, rollback, PRAGMA foreign_key_check, contraintes, 100 répétitions, 99 séries, cibles à 5999 et pauses à 300. Tester fichiers sur disque temporaire réels, distinctement des mocks du sélecteur.

## 6. Machine de brouillon proposée

Module pur dédié aux paramètres ; parent et sous-brouillon distincts. État actif + réserves temporaires par mode et variable uniquement pendant l’ouverture. Basculer variable copie chaque ligne ; revenir uniforme prend la première actuelle ; réactiver restaure. Réduire N retire par la fin ; remonter restitue l’ordre retiré puis clone la dernière active. Réordonner transporte cible et Pause et recalcule PN.
Changer de mode conserve N/Pauses/bip ; cibles incompatibles deviennent null, jamais 0 ; retour restaure avant ✓. N=1 : normalisation effective immédiate, réserves restaurables si N remonte avant ✓. Repli sans mutation ni contournement de validité. ✓ refusé si mode/cibles actifs incomplets, même tableau replié ; message nommant la Série. ✕ annule tous les déplacements et réglages. Double tap et échec d’écriture ne créent aucune ligne partielle ni copie supplémentaire.

## 7. Calculs et phrase

Résultat temporel discriminé exact/estimated/omitted pour l’Exercice ; lowerBound uniquement pour agrégation Séance avec travail inconnu. Validation invalide hors de ce résultat. Travail Répétitions = Ri×b lorsque b>0 ; aucune convention 2s. À l’échec toujours omitted, bip positif compris.
Unilatéral Σ(Ti+Pi) ; côtés successifs 2Σ(Ti+Pi)+PC ; par paire N>=2 : 2ΣTi+ΣPi+N×PC. Occurrence : retirer une seule nouvelle PN et ajouter R si R>0, sinon conserver T. Travail inconnu : pauses connues incluses en Séance, aucun zéro présenté comme durée intrinsèque. Développer Tour/Cycle selon le périmètre existant ; CR/Fin propres une seule fois dans le plan complet applicable.
Inversion seulement Durée uniforme : énumérer les 99 candidats, normaliser N1 pour chaque calcul, distance minimale puis N le plus grand en égalité ; message seulement si ajustement. Les attendus numériques sont inscrits avant développement dans `attendus-numeriques.json`. `oracle-attendus.py` énumère les contributions indépendamment de l’implémentation et produit `attendus-phrases-276.json` ; le contrôle de cohérence de ces attendus ne teste pas l’application. Les cibles N6 des fixtures sont choisies explicitement, pas récupérées depuis un total Excel.
Générateur pur de segments {texte,gras}. Corpus 276 v15 inchangé, données grammaticales conservées ; remplacer le seul montant d’exemple par le total calculé indépendamment. Ne pas remplacer globalement les nombres ni redécouper une chaîne pour son gras. Phrase complète au rendu, française, jamais persistée, variables jusqu’à 3 puis min/max ; clauses de Pause variable omises. Total Durée N1 unilatéral omis seulement sans Pause. Texte imbriqué en flux, pas de boîte par segment, aucune troncature.

## 8. Médias : architecture proposée et décisions D-334/D-335

Réutiliser les dépendances Expo déjà installées : expo-image-picker et expo-file-system. Le helper photo du Profil fournit un exemple de copie interne, mais sa suppression de photo précédente est inadaptée aux fichiers partagés : ne pas le réutiliser comme lifecycle d’Exercice et ne pas modifier le Profil.
Séparer acquisition système, copie physique et associations. Après sélection, copier dans un espace interne immuable avec identifiant ; métadonnées type/MIME/taille/durée vidéo/URI/miniature selon disponibilité. URI du cache système jamais persistée comme seule référence durable. Ordre d’ajout stable ; ordre du sélecteur si établi techniquement. Réouverture charge tous les liens avant édition. Copie Catalogue→Séance crée de nouveaux liens et conserve les mêmes fichiers. Échec de copie/DB conserve le parent ; fichiers préparés sans lien peuvent être nettoyés uniquement après vérification des références et des brouillons encore actifs.
Le futur instantané devra transporter identifiants/ordre/URI et métadonnées immuables ; ne pas ajouter un pipeline d’exécution pour cela. Par sécurité de conservation, aucun garbage collector global destructif non indispensable à PRE-3.

Décision propriétaire D-335 (option A) pour les points fonctionnels auparavant non documentés : photos/vidéos de la photothèque en sélection multiple, formats compatibles avec la plateforme sans plafond produit ni conversion systématique ; incompatibilité ou stockage insuffisant signalés, brouillon conservé ; annulation sans erreur ; état Importation puis erreur locale avec Réessayer ; menu par média Retirer/Monter/Descendre et équivalents accessibles. Cette décision ne vaut pas approbation du plan technique. Compatibilité réelle des APIs/format et comportement du sélecteur doivent être vérifiés dans la documentation Expo versionnée avant code ; aucune liste de codecs supposée.

## 9. Interface et preuves

La table de 6725 éléments, maîtres, variantes et tokens est réutilisée. Le premier contrôle ciblé de 7 états est complété par `controle-fraicheur-figma.json` : les 41 arbres et leurs 101 champs capturés concordent selon deux digests de comparaison et longueur exacte, sans nouvelle capture. Ces digests ne sont pas cryptographiques ; les fichiers sont figés par Git et leurs empreintes. Liens de maîtres asynchrones et définitions actuelles des styles/variables ne sont pas inclus dans ce contrôle. Les compléments ciblés de 60 propriétés critiques et 41 topologies de variantes servent la fermeture requise par VNext ; aucune conformité du produit livré n’est déduite de ces lectures.
Mapper les 41 états aux composants rendus et chaque élément applicable aux critères/atomic assertions avant PlanContract. Séparer valeurs d’exemple et règles. Sheet bas ancrée, header fixe, corps défilant, exclusivité roulette/segmenté, éléments absents retirés, voile prescrit. Steppers : tap : 1, maintien : 500 ms, cadence : 150 ms, paliers : 2 s/4 s, multiples directionnels, saturation et aucun tap au relâchement ; Bip/CR/Fin : pas 1. Si le composant Profil est partagé, conserver sa politique existante via paramètres explicites et prouver ses consommateurs.
Tests techniques : assertions de rendu, transitions, navigation, labels/focus et alternatives au drag. Comparaisons visuelles : états Figma aux largeurs 360/402/440 et texte agrandi, avant recette propriétaire ; mesures/propriétés et captures par état, écarts nommés. Appareil : photothèque vidéo réelle, redémarrage, permissions effectives, stockage/annulation, VoiceOver/focus, maintien et scroll. Aucun test SQLite/calcul transféré à Hermann.
Le protocole courant maintient les attestations génériques visual/accessibility à false : conserver preuves et observations produit séparées, réserves explicites selon contrat ; ne pas modifier VNext pour écrire true. Aucun PASS technique transformé en certification perceptive.


## 10. Corrections effectives de la seconde passe

Les identifiants des 95 exigences documentaires sont conservés pour rapprocher les constats originaux. Les références Figma et les 6 725 éléments ne sont pas réduits. La représentation corrigée est lisible et référencée, sans copies répétées d'un même chapitre normatif dans des milliers d'objets.

- `requirements.json` remplace le classement uniforme UI et les rattachements visuels abusifs : 95 états avec kinds/scope/test owners explicites, une exigence DATA canonique, huit exigences MIGRATION. Les exigences de conservation portent REQUIRED. Les règles d'inversion sont P3-14/P3-12 ; P3-20 est réservé au rendu du message.
- `tests-and-preservation.json` remplace les obligations agrégées et les intentions copiées sur les mauvais fichiers. Il contient les eight scénarios SQLite distincts, 13 cas numériques, 276 cas de phrase avec segments gras et montant indépendant, et le cas d'inversion explicitement au Domaine. Une suite UI atteste son rendu et sa délégation, pas la justesse SQL/métier par mock.
- Les suites de baseline dont le contrat change sont dans le write_scope ADAPT avec attente de conservation ; les autres restent à relancer sans modification ; chaque MODIFY porte ses preuves de préservation et chaque importer NO_CHANGE des obligations RUN_EXISTING. Le développeur conserve les assertions baseline et adapte uniquement celles remplacées par des règles PRE-3 explicitement tracées.
- `baseline-observations.json` et `baseline-blobs.json` matérialisent 156 blobs Git exacts à la baseline (contenu, Git blob et SHA-256), y compris la roulette native. `creation-observations.json` conserve les 23 slots sans prétendre qu'un fichier non créé aurait un blob baseline : soit 179 objets du catalogue initial. Les fichiers de tests supplémentaires déclarés dans le write_scope sont également à créer/adapter selon existence baseline.
- `ui-criteria.json` déclare dix contrôles/surfaces avec assertions INTERACTION, preuve FUNCTIONAL_TEST et obligations ACCESSIBILITY_CHECK individuelles ; DEVICE réservé aux vérifications réellement natives. Les quatre évaluations de roulette native AVAILABLE se rattachent à INTERACTION/wheel. Labels, focus, disabled, alternative au drag et phrase intégrale ont des attendus distincts.
- `ui-elements.json` garde les 6 725 références, dont 65 masquées. vectorPaths/blendMode/strokeJoin/strokeAlign/strokeCap/dashPattern sont CONTEXTE DE SOURCE, aucune obligation de prouver leurs valeurs internes. Le contour/la forme visuellement rendus restent contrôlés sur les PNG, avec couleur, épaisseur/effets/dimensions/relations. Maîtres, variantes, styles et variables de l'extraction restent les autorités de ces références, sans nouvelle extraction globale.
- Les 41 comparaisons visuelles par état sont conservées, aux largeurs 360/402/440, texte agrandi et phrase longue. Deux captures identiques ne sont pas fusionnées automatiquement : états 3542:4656 et 6407:9458 conservent leurs attentes sémantiques distinctes.

## 11. Répartition des preuves et critères de livraison

Tests automatisés métier : transitions de brouillon, sérialisation, calculateurs et générateur de segments ; SQL réel et fichiers physiques pour migrations, associations et partage. Le corpus est un attendu d'avant développement, pas une preuve applicative.

Visuel : comparaison des 41 états et des relations adaptatives, valeurs mesurées/tokens/texte/visibilité ; chaque écart documenté avec impact, justification, statut et décision. Aucun report global des écarts visuels pour priorité fonctionnelle.

Appareil : permissions/photothèque photo et vidéo, sélection limitée/refus/annulation, redémarrage et conservation, accès natif/VoiceOver/focus/maintien/scroll. Procédure ciblée au propriétaire uniquement après contrôles techniques ; aucun test de base de données/calcul ne lui est transféré.

Avant livraison : preuves des 23 scopes, revue d'implémentation et corrections, recette des quatre parcours, diff des frontières exclues et historique intact, commits fusionnés, registre final, build installable/version/lien. Un résultat exact du domaine n'est jamais une attestation perceptive. Toute réserve doit avoir impact/justification/statut/décision.

## 12. Corrections après la seconde revue indépendante

Référence conservée : `reviews/2026-10-09_revue-passe2-claude.json`, publiée au commit `bf6a8cbc0d770031d7940f1aafe209f427f5f627`. Onze résolutions ne sont pas rouvertes. Le registre `finding-resolutions.json` les porte RESOLVED avec cette preuve ; les deux constats et les deux régressions ci-dessous restent CORRECTED_PENDING_INDEPENDENT_REVIEW.

| Objet à revoir | Correction et preuve attendue |
|---|---|
| FND-5b6a6d10170c7a649a2c3861 | Dix attendus différents par surface, avec cas sémantiques, propriétaire de test, source et scénario VoiceOver propre. Les propriétés automatisables ne prouvent pas la perception native. |
| FND-c3c9529d7f622ac36707b163 | Propriétaires repris exactement de chaque assertion source ; frontières UI/logique/SQLite distinctes ; suites i18n/tokens existantes ADAPT. |
| REG-01 | Les 59 ensembles de propriétaires sont identiques à `assertions-recette.json#/assertions[*].proposedTestPaths`. Les 54 états documentaires utilisent leur assertion propre ; les 41 états Figma l’ensemble de leurs assertions explicitement liées. `functional_test_paths` est calculé depuis ces liens, jamais directement depuis le scope. Les obligations repository indiquent NodeSqliteDatabase REAL. |
| REG-02 | Aucune création de `src/shared/i18n/__tests__/index.test.ts` ni `src/shared/ui/__tests__/tokens.test.ts`. Adapter `src/shared/i18n/index.test.ts` et `src/shared/ui/__tests__/tokensSpecification.test.ts`, incluses dans la préservation de leurs modules. |

Le contrat de tokens PRE-3 réutilise les couleurs/typographies canoniques existantes, notamment `colors.overlayScrim = rgba(31,33,41,0.34)` ; aucune nouvelle couleur ou typographie canonique n’est proposée. Le chapitre 12 reste inchangé. Les valeurs géométriques de la feuille sont prouvées sur sa surface, pas dans le test de tokens.

L’oracle d’inversion explicite fixe Durée uniforme unilatérale T=30 s, Pause=10 s, CR=0 s, Fin=0 s et aucune Récupération : T(N)=40N s. Demande 100 s → N=3, 120 s, message ; demande 80 s → N=2, 80 s, sans message. Les bornes et la normalisation N=1 restent les mêmes.

Les 59 assertions, les huit scénarios migration, les 13 cas numériques, les 276 phrases, les 95 états, les 23 exigences, les 41 frames et les 6 725 éléments sont conservés. Les obligations sont redistribuées vers leurs propriétaires ; leur nombre brut n’est pas une mesure de couverture.

Aucun fichier applicatif ou du protocole VNext n’est modifié. Les rapports de la seconde revue restent intacts. Le vérificateur documentaire est renforcé contre les deux régressions identifiées ; ce n’est pas un correctif du protocole.

La troisième revue se limite à ces quatre objets et aux régressions directement causées par leurs corrections, avec causalité démontrée. Les onze décisions RESOLVED précédentes restent acquises, sauf régression causale explicite. APPROVE ne vaut ni approbation propriétaire du plan final, ni autorisation de développement.

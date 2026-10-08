# PRE-3 — Plan technique de travail

Issue : #340. Baseline exclusive : `1ddfb6d144552f578388257adc78db47ab5992c8`.
Étape : REQUIREMENTS / IMPACT → préparation PLAN. Statut : travail non approuvé ; aucune autorisation d’implémentation.
Ce document prépare les entrées du contrat JSON VNext. Il n’est pas une projection d’un PlanContract déjà produit et ne doit pas être utilisé comme plan approuvé.

## 1. Résultat et frontières

Les 23 exigences et toutes les règles de `../perimetre-et-couverture.md` restent opposables. Livrer les quatre parcours créer/modifier × définition Catalogue/copie de Séance, paramètres, calculs, phrase, persistance et import de photos/vidéos. Conserver les noms/chemins. Aucun moteur d’exécution, émission sonore, lecture en exécution, refonte générale Composition/Catalogue/Profil/Étiquettes/Calendrier, placement PRE-4 ou sélecteur Catalogue à deux options.

Photothèque seule : choix propriétaire recueilli dans cette conversation et reporté sur #340. Les formats, états d’import et gestes non représentés restent à arbitrer après recherche dans les sources ; ne pas confondre ces inconnues avec une permission de réduire P3-23.

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
Le normaliseur d’anciens objets restitue uniforme, ordre par côté, bip=0 ; garde mode, quantité de travail, cible, pause et direction. Ne pas relire le Profil pour les objets existants. Les défauts CR/Fin des anciens objets absents doivent être reliés à la règle documentaire de compatibilité applicable dans le contrat final ; ne pas inventer une rétroactivité.
N=1 normalise l’état effectif et l’ordre immédiatement. Le brouillon peut garder les états temporaires, mais la valeur sauvegardée à N=1 ne les contient jamais. Les scalaires de compatibilité, s’ils restent exposés, sont des projections dérivées de la représentation canonique : aucune écriture indépendante et aucun calcul métier concurrent.

## 5. Migration et SQLite

Migrations 001..008 seules présentes à cette baseline ; version suivante observée 009, à revalider avant développement. Ne modifier aucun fichier de migration historique. Ajouter une représentation versionnée des paramètres aux définitions et occurrences, et les associations de médias d’occurrence avec FK et position unique par propriétaire. Les nouvelles colonnes peuvent être nullable pour distinguer un ancien objet d’un objet canonique.
Le choix physique proposé est un JSON canonique versionné pour les paramètres, validé au Domaine et au Repository, avec adaptation des anciens scalaires à la lecture. La migration conserve IDs, données, références et dates ; elle ne backfill pas les valeurs Profil courantes. Le plan final doit confronter ce choix aux CHECK des tables activities et à chaque writer, puis décider si les colonnes scalaires deviennent des projections d’écriture ou doivent être restructurées. Aucun schéma SQL n’est déclaré final dans ce dossier.
En variable, l’ordre du JSON est la source ; ni cible uniforme persistée concurrente, ni phrase/total dérivé en base. Transactions exclusives existantes conservées. Paramètres et liens d’un Exercice sont validés et écrits ensemble. Erreur : rollback et brouillon intact. La liste des Séances doit utiliser un seul calcul métier partagé après lecture des données nécessaires, ou une projection SQL démontrée équivalente ; aucun ancien calcul scalaire laissé en production pour les listes.
Tester avec NodeSqliteDatabase réel : base neuve, upgrade v8 peuplé, idempotence, rollback, PRAGMA foreign_key_check, contraintes, 100 répétitions, 99 séries, cibles à 5999 et pauses à 300. Tester fichiers sur disque temporaire réels, distinctement des mocks du sélecteur.

## 6. Machine de brouillon proposée

Module pur dédié aux paramètres ; parent et sous-brouillon distincts. État actif + réserves temporaires par mode et variable uniquement pendant l’ouverture. Basculer variable copie chaque ligne ; revenir uniforme prend la première actuelle ; réactiver restaure. Réduire N retire par la fin ; remonter restitue l’ordre retiré puis clone la dernière active. Réordonner transporte cible et Pause et recalcule PN.
Changer de mode conserve N/Pauses/bip ; cibles incompatibles deviennent null, jamais 0 ; retour restaure avant ✓. N=1 : normalisation effective immédiate, réserves restaurables si N remonte avant ✓. Repli sans mutation ni contournement de validité. ✓ refusé si mode/cibles actifs incomplets, même tableau replié ; message nommant la Série. ✕ annule tous les déplacements et réglages. Double tap et échec d’écriture ne créent aucune ligne partielle ni copie supplémentaire.

## 7. Calculs et phrase

Résultat temporel discriminé exact/estimated/omitted pour l’Exercice ; lowerBound uniquement pour agrégation Séance avec travail inconnu. Validation invalide hors de ce résultat. Travail Répétitions = Ri×b lorsque b>0 ; aucune convention 2s. À l’échec toujours omitted, bip positif compris.
Unilatéral Σ(Ti+Pi) ; côtés successifs 2Σ(Ti+Pi)+PC ; par paire N>=2 : 2ΣTi+ΣPi+N×PC. Occurrence : retirer une seule nouvelle PN et ajouter R si R>0, sinon conserver T. Travail inconnu : pauses connues incluses en Séance, aucun zéro présenté comme durée intrinsèque. Développer Tour/Cycle selon le périmètre existant ; CR/Fin propres une seule fois dans le plan complet applicable.
Inversion seulement Durée uniforme : énumérer les 99 candidats, normaliser N1 pour chaque calcul, distance minimale puis N le plus grand en égalité ; message seulement si ajustement. Les attendus numériques sont inscrits avant développement dans `attendus-numeriques.json` ; l’oracle de test final doit énumérer les contributions de façon indépendante de l’implémentation.
Générateur pur de segments {texte,gras}. Corpus 276 v15 inchangé, données grammaticales conservées ; remplacer le seul montant d’exemple par le total calculé indépendamment. Ne pas remplacer globalement les nombres ni redécouper une chaîne pour son gras. Phrase complète au rendu, française, jamais persistée, variables jusqu’à 3 puis min/max ; clauses de Pause variable omises. Total Durée N1 unilatéral omis seulement sans Pause. Texte imbriqué en flux, pas de boîte par segment, aucune troncature.

## 8. Médias : architecture proposée et arbitrage restant

Réutiliser les dépendances Expo déjà installées : expo-image-picker et expo-file-system. Le helper photo du Profil fournit un exemple de copie interne, mais sa suppression de photo précédente est inadaptée aux fichiers partagés : ne pas le réutiliser comme lifecycle d’Exercice et ne pas modifier le Profil.
Séparer acquisition système, copie physique et associations. Après sélection, copier dans un espace interne immuable avec identifiant ; métadonnées type/MIME/taille/durée vidéo/URI/miniature selon disponibilité. URI du cache système jamais persistée comme seule référence durable. Ordre d’ajout stable ; ordre du sélecteur si établi techniquement. Réouverture charge tous les liens avant édition. Copie Catalogue→Séance crée de nouveaux liens et conserve les mêmes fichiers. Échec de copie/DB conserve le parent ; fichiers préparés sans lien peuvent être nettoyés uniquement après vérification des références et des brouillons encore actifs.
Le futur instantané devra transporter identifiants/ordre/URI et métadonnées immuables ; ne pas ajouter un pipeline d’exécution pour cela. Par sécurité de conservation, aucun garbage collector global destructif non indispensable à PRE-3.

Proposition à arbitrer pour les points fonctionnels non documentés : photos/vidéos de la photothèque en sélection multiple, formats compatibles avec la plateforme sans plafond produit ni conversion systématique ; incompatibilité ou stockage insuffisant signalés, brouillon conservé ; annulation sans erreur ; état Importation puis erreur locale avec Réessayer ; menu par média Retirer/Monter/Descendre et équivalents accessibles. Cette proposition n’est pas une décision validée. Compatibilité réelle des APIs/format et comportement du sélecteur doivent être vérifiés dans la documentation Expo versionnée avant code ; aucune liste de codecs supposée.

## 9. Interface et preuves

La table de 6725 éléments, maîtres, variantes et tokens est réutilisée. Le contrôle Figma ciblé sur 7 états constate identité, dimensions, nombre d’éléments et textes sélectionnés identiques ; il ne certifie pas tous les tokens/maîtres ni 41 écrans courants. La fraîcheur complémentaire pertinente reste à vérifier au gel de référence de livraison.
Mapper les 41 états aux composants rendus et chaque élément applicable aux critères/atomic assertions avant PlanContract. Séparer valeurs d’exemple et règles. Sheet bas ancrée, header fixe, corps défilant, exclusivité roulette/segmenté, éléments absents retirés, voile prescrit. Steppers : tap1, maintien500ms, cadence150ms, paliers2s/4s, multiples directionnels, saturation et aucun tap au relâchement ; Bip/CR/Fin pas1. Si le composant Profil est partagé, conserver sa politique existante via paramètres explicites et prouver ses consommateurs.
Tests techniques : assertions de rendu, transitions, navigation, labels/focus et alternatives au drag. Comparaisons visuelles : états Figma aux largeurs360/402/440 et texte agrandi, avant recette propriétaire ; mesures/propriétés et captures par état, écarts nommés. Appareil : photothèque vidéo réelle, redémarrage, permissions effectives, stockage/annulation, VoiceOver/focus, maintien et scroll. Aucun test SQLite/calcul transféré à Hermann.
Le protocole courant maintient les attestations génériques visual/accessibility à false : conserver preuves et observations produit séparées, réserves explicites selon contrat ; ne pas modifier VNext pour écrire true. Aucun PASS technique transformé en certification perceptive.

## 10. Suite canonique

Produire les sources adressables et DecisionRecord résolus, puis la recette `launch` avec capture/réconciliation Figma figée et inventaire documentaire des états/scénarios exigé par vnext-figma-launch. Construire RequirementRegistry → CandidateManifest/ImpactGraph → PlanContract/UI atomicité. La matrice de travail n’usurpe aucun de ces contrats.
Préparer la nouvelle identité avec activate-kodjo-v2-slice.js portant explicitement protocol=VNEXT et prepared-chain.json. Son nom est compatible ; son routage refuse le parcours legacy. Pas d’activation de développement tant que les entrées ne sont pas prêtes.
Revue réelle via vnext-chain review ; réponse intégrale conservée hors checkout, reçu validé. Traitement causal des constats, puis prepare/reserve-gate/request-approval. USER_APPROVAL exact du propriétaire avant handoff/admit/exécution locale. Les noms de workflow/runner de transport sont ceux dérivés par les scripts courants, pas une nouvelle campagne.
Après code : tests réels, revue d’implémentation, corrections, comparaisons produit et recette bornée, finalisation puis kodjo-vnext-closure.yml avec provenance de tests exécutés. La clôture ne fusionne ni ne publie elle-même l’application : prévoir séparément fusion vérifiée et build installable par le parcours produit existant, version et lien exacts. Revalider tous les gates à la tête de livraison.

## 11. Ce qui empêche de présenter le plan final

Arbitrage produit des formats/états/gestes médias réellement manquants ; compatibilité CR/Fin anciens à relier aux sources ; décision physique de migration après vérification exhaustive des writers ; mapping atomique et frais Figma ; recipe et contrats VNext non produits ; revue indépendante non déclenchée. Aucun de ces travaux n’est présenté comme terminé ou approuvé. Les 23 exigences restent incluses.

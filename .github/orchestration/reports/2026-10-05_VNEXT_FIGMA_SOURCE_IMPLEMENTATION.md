# VNext — raccordement des sources Figma et couverture atomique

Date : 2026-10-05. PR #269, branche `protocol/vnext-proof-stability-20260930`.
Campagne conservée : `628b3349-88b4-4bf1-be6b-50bc09e7d245`, VNEXT-12-QUALIF.
Base de l’évolution : `978d78198b27c55e56bff71a3dd0c310f5a3a50e`. Le premier candidat `c6bbacad6f3f959dd396be18dcb8753596d4e935` est remplacé pour corriger la disposition des deux libellés fixes constatée lors de la seconde lecture ; ses qualifications ne valent pas qualification du nouveau paquet.

## Résultat et portée

Le raccordement contractuel est implémenté dans la chaîne VNext existante : extraction indépendante, gel Git, unités source, exigences, assertions typées, plan opposable, dossier de revue de plan et vue temporaire de l’implémenteur. Le consommateur de ressources est également disponible pour la revue d’implémentation. Aucune modification des workflows V2/PRE-2, aucune campagne créée, aucun changement applicatif, aucune promotion sur main.

Ce rapport poursuit le diagnostic historique `2026-10-05_VNEXT_RECOVERY_AND_FIGMA_CONNECTION.md`. Ses statuts « NOT_IMPLEMENTED » décrivent le candidat antérieur. `integrity.json` dans le dossier Figma reste la preuve de l’extraction initiale ; la nouvelle preuve est `implementation-evidence.json`.

## Référence et rapprochement

Référence lue directement, sans écriture Figma : fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101`, frame `4478:7209`, 402×874. Les 149 nœuds du frame et les 73 nœuds de fermeture des maîtres/variantes donnent 222 nœuds. Les 9 racines propriétaires couvrent les ensembles et leurs variantes ; les chemins vectoriels et segments de texte sont complétés séparément. Les 50 variables incluent les alias transitifs et les modes des collections. Une capture PNG courante et trois SVG d’actions sont transportés avec leurs octets et empreintes.

Les 8 425 emplacements de propriétés observées reçoivent une disposition motivée. Parmi eux, 1 237 propriétés sont obligatoires, sur 79 éléments. Les règles distinguent valeurs observées, relations au parent à 402 pt et contraintes adaptatives aux largeurs 360/402/440. Le titre « Zones corporelles » et l’action « Créer une zone corporelle » sont des libellés fixes obligatoires. Les noms et sélections de zones restent un jeu de démonstration et ne ferment pas le référentiel métier.

CE-UI-09 et §4.2 du chapitre 13 ont été rapprochés à la révision main `9fad303d8bf72f447dde2d0c91295e696d2c50ac`. Les extraits exacts et leurs empreintes sont conservés. Le consommateur relit cette révision Git ; une copie locale ou un Figma vivant ne remplace pas silencieusement la source approuvée. Les 24 obligations documentaires couvrent notamment sélection multiple/confirmation/annulation, scroll, noms longs, texte agrandi, focus, états de liste/création/erreur, identité et réactivation explicite, persistance et accessibilité. Certaines obligations décrivent plusieurs états : leur décomposition en scénarios exécutables reste à examiner dans le vrai plan produit ; le compteur n’est pas une preuve d’exhaustivité sémantique.

Les bounds Figma de certains tags se recouvrent ; cela ne prouve pas le recouvrement des cibles tactiles natives. Les contraintes natives ≥44×44 et sans recouvrement sont indépendantes et obligatoires. Un conflit mixte démontré exige une décision explicite ; aucune résolution métier n’a été inventée.

## Mécanismes exécutables

- `freeze-vnext-figma.js` contrôle les inventaires et lots indépendamment des assertions déclarées. Maître, variante, propriété, alias ou géométrie manquants sont bloquants.
- `vnext-figma-source.js` vérifie le paquet, les ressources (hash, dimensions, CRC et décodage PNG), les documents et les classifications. Avant planification, chaque élément requis et état documentaire doit avoir une exigence active ; avant admission, chaque propriété obligatoire doit avoir une assertion exacte et une obligation de preuve visuelle.
- `vnext-live-chain.js` observe les objets Git gelés, lie les références au contrat UI et matérialise les ressources pour la revue de plan indépendante. L’ancien chemin sans Figma reste compatible.
- Le plan approuvé porte le même paquet compact sans perte. `vnext-runtime-plan.js` matérialise les ressources hors dépôt pour l’implémenteur, transmet le manifeste dans son environnement et refuse une modification du plan, du manifeste ou des ressources après admission. La restauration conserve le diagnostic.
- `consume-vnext-figma.js` expose les trois rôles PLANNER, IMPLEMENTER et IMPLEMENTATION_REVIEWER. `verifyMeasurements` refuse une mesure absente, une mauvaise référence ou une valeur ne satisfaisant pas la cible ; la réutilisation d’un composant ne dispense pas de cette comparaison.

Identité figée : `84e4759b5a160bef1aa591a7b8800ac6e070bebe2d3851e50e1fe14432af2981`.
Transport JSON : 3 373 987 → 612 126 octets, réduction de 81,86 %, reconstruction et hash contrôlés. Cette mesure concerne le paquet seul ; elle ne démontre ni gain de durée Claude ni coût total du dossier. Aucun délai n’est augmenté.

## Couverture

Le test nominal utilise des objets Git locaux réels et des réponses de reviewer/approbation injectées : source → exigences → plan → assertions → revue → préparation → admission → vue d’exécution → détection d’altération → restauration. Les trois rôles consomment exactement les ressources attendues. Le vrai frame est validé séparément, y compris le transport aller-retour sans perte.

| Cas négatif | Refus testé |
|---|---|
| 1. Élément omis | Inventaire/lot incomplet, indépendamment des assertions |
| 2. Propriété omise | Classification ou disposition source altérée |
| 3. Assertion vague | Valeur textuelle sans cible exacte, relation non structurée |
| 4. Mauvaise référence | Hash/frame/dimensions incompatibles |
| 5. Conflit mixte | Absence de décision explicite, priorité documentaire automatique refusée |
| 6. Réemploi incorrect | Rayon mesuré 8 pour cible 24, valeur non finie ou mesure absente |
| 7. Variante/état oublié | Fermeture de variante, assertion ou état documentaire manquant |
| 8. Source inaccessible/tronquée/modifiée | Refus du remplacement implicite ; requalification nécessaire |
| 9. Ressource inutilisable | Octets corrompus/absents, propriétés de transport manquantes |

Les résultats exacts, commandes, empreintes du code et journaux sont dans `figma-zones/implementation-evidence.json`. La suite VNext comprend également les 26 cas du cycle des preuves issus de l’incident PRE-2 : attente autorisée, preuve technique manquante/échouée, refus de falsifier un PASS, dérogation explicite limitée et réserves conservées. Le correctif V2 PR #320 et sa finalisation réelle n’ont pas été vérifiés ou modifiés.

## Limites et qualification suivante

La matérialisation et la lecture des octets attestent leur disponibilité, pas leur consultation effective ni la conformité du rendu. Chaque manifeste dit `NOT_ATTESTED_BY_BYTE_OBSERVATION`. Les conclusions du reviewer dans les tests sont injectées ; aucun appel réel Claude n’est revendiqué. Les mesures nominales sont synthétiques ; aucune conformité visuelle, accessibilité ou appareil n’est déclarée.

Le hook automatique de revue de plan et celui de l’implémenteur sont raccordés. Le rôle IMPLEMENTATION_REVIEWER dispose du consommateur testé, mais son appel par le workflow partagé de revue d’implémentation et l’observation effective des mesures restent à qualifier ; ce workflow V2 est laissé intact conformément à la portée demandée. Le gel Git est automatique ; la comparaison avec une nouvelle extraction Figma exige une capture explicite, sans surveillance du Figma vivant.

La qualification Linux/Windows distante est réussie sur le candidat exact `12041962da5d3283a889dea6f3868014da4dfff3` de cette même PR : contrats 286/286 sur chaque OS, équivalence historique et drivers réussis, pilote Windows 1 049 PASS / 0 FAIL / 4 SKIP et préflight sans Claude réussi. Preuves récupérées après la coupure dans `figma-zones/recovery-qualification.json` ; runs 37251628601, 37251628495 et 37251628493. La vérification locale de reprise repasse 286/286 tests. Aucun workflow relancé. Les jobs INITIAL/REVISION ont été SKIPPED sous QUALIFY_ONLY et ne prouvent aucun parcours Figma réel. Les parcours INITIAL/REVISION/après recette, les réveils et l’audit final réel restent des étapes distinctes ouvertes. Aucun résultat local ne certifie les étapes 6–8, PRE-3 ou une autorisation de promotion.

## Reprise après « Error in input system »

La cause du message de conversation est NON VÉRIFIABLE depuis les preuves Git/GitHub. Aucun changement non enregistré ne subsistait dans le checkout ; la tête publiée correspondait à la tête locale. Aucun run VNext actif observé lors de la reprise ; le run PRE-2 en cours et l’ancienne Lean Queue restent hors périmètre.

La suite réelle reste ouverte : raccordement automatique du consommateur à la revue d’implémentation VNext, scénarios documentaires et mesures visuelles réelles, parcours INITIAL/REVISION/après acceptation puis audit final. Le connecteur GitHub disponible permet lecture et rejeu de jobs, mais ne fournit pas de création de workflow_dispatch ; aucun exécutable Claude local n’est disponible. Un rejeu de QUALIFY_ONLY ou d’une ancienne demande consommée ne remplace pas ces parcours et n’a pas été lancé. VNext reste non certifié ; PRE-3 n’est pas commencé par cette reprise.

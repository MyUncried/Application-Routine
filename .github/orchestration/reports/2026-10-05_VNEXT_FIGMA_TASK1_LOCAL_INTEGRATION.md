# VNext Figma — tâche 1, intégration et vérifications locales

Périmètre : chantier PR #269, branche `protocol/vnext-proof-stability-20260930`, parent `66eb4eaac092564301813d80950e8c739ee8746e`, campagne existante `628b3349-88b4-4bf1-be6b-50bc09e7d245` / `VNEXT-12-QUALIF`. Les neuf fichiers récupérés ont été conservés et complétés. Aucune activation V2, PRE-2 ou PRE-3 ; aucune demande de parcours réel, appel Claude ou revue indépendante de clôture.

## Cause démontrée et correction

Le précontrôle produisait une empreinte à partir d'une reconstruction JSON différente de la sérialisation réellement commitée. `launch` réordonnait les propriétés de premier niveau (`nodes` avant `variables`), tandis que le paquet issu de `freeze` plaçait `nodes` en fin d'objet. Le callback `persist` du pilote annonçait ensuite comme figés les octets reconstruits, sans relire les octets du commit.

Reproduction avant correction : même longueur (3 882 944 octets), égalité canonique des objets, première différence à l'offset 259 ; SHA-256 attendu `b8b267832bc04708d9bdf919defdb3e673285c9e004d39c94d0d9824266c5d7a`, observé `309f1124ac4de548ee38d45c469ace5c872438ec4526821592c21e29357d61ee`. Le dépôt temporaire de cette reproduction a été supprimé après le contrôle ; ces empreintes décrivent cette reproduction, pas une livraison applicative.

Correction : valider l'égalité logique de la capture reconstruite avec le paquet persisté, conserver la représentation JSON persistée pour dériver la source, et relire le paquet Git dans le callback du pilote. Aucun hash attendu n'est remplacé arbitrairement et la vérification stricte d'octets dans `observeSources` demeure. La non-régression réussit avec un ordre d'objet différent ; une simple ligne vide ajoutée au blob Git est toujours refusée avec `VNEXT_SOURCE_OBSERVATION_HASH_MISMATCH`.

## Raccordements opérationnels locaux

- `vnext-chain.js launch` appelle l'adaptateur versionné, puis la préparation avant le constructeur du plan. L'entrée `produce` refuse tout input Figma sans checkpoint de lancement, même si le déclarant omet `figmaScope`.
- `vnext-live-chain.launchAndProduce` génère le manifeste et les exigences depuis le paquet figé, puis reconstruit et vérifie ces contrats au lieu de faire confiance à des contrats préapprouvés.
- Les états/scénarios sont extraits du bloc structuré des contrats d'écran existants. Le paquet doit correspondre exactement à cet inventaire documentaire, y compris les états `DOCUMENT_ONLY` (conditions, navigation, validation, persistance). La réconciliation ne peut changer les documents normatifs. Aucun inventaire graphique ne peut remplacer cette couverture.
- Les propriétés requises sont liées aux exigences, assertions, preuves et viewports. Les omissions, assertions vagues, bindings étrangers, ressources altérées, inventaires incomplets et conflits ouverts conservent leurs refus. Les preuves exigées par les scénarios sont également exigées dans le plan.
- Le consommateur existant `vnext-runtime-plan` transmet automatiquement les ressources et leur observation à l'implémenteur ; cette observation comprend maintenant l'inventaire documentaire. Une destination déjà présente avec des octets différents est refusée, sans écrasement.
- L'entrée VNext existante expose `prepare-implementation-review`, `implementation-review`, `verify-implementation-review`. Le dossier est dérivé du plan approuvé, les faits sont relus dans les artefacts vérifiés et liés au HEAD courant. Les références/propriétés/viewports/scénarios doivent être complets ; un reçu complet peut être recontrôlé sans nouvel appel, un résultat incomplet interdit une relance implicite.

Les workflows et scripts historiques gelés, notamment `kodjo-slice-implementation-review.yml` et `verify-ui-implementation-review.js`, sont identiques au parent. Le contrôle du registre a identifié cette protection ; les ajouts temporaires à ces deux fichiers ont été retirés. Le raccordement utilise l'entrée VNext et ne prétend pas avoir activé le reviewer événementiel V2 pour VNext.

## Vérifications finales

`node --test tests/kodjo/vnext-*.pilot.js tests/kodjo/ui-implementation-review.pilot.js` : **318 tests, 318 PASS, 0 FAIL, 0 SKIP**. Les 16 tests du nouveau pilote couvrent notamment l'ordre générique, des identifiants Figma différents, l'autorité documentaire, les états non graphiques, le précontrôle du paquet réel figé, les refus d'artefacts et les entrées opérationnelles. Les invocations de reviewer dans les tests utilisent uniquement un double explicite.

Précontrôle sans modèle : `qualify-vnext-figma-real-path.js precheck <répertoire extérieur neuf>` ; le JSON durable associé constate l'égalité entre hash source et hash Git observé, trois Requirements, quatre assertions et deux scénarios. Le commit source de ce précontrôle est celui d'une fixture temporaire ; le dépôt temporaire est nettoyé. Le JSON n'atteste ni une livraison ni une acquisition Figma fraîche.

Syntaxe YAML : 64 workflows acceptés. Invariants exécutables : PASS. Politique d'écritures : `PASS_WITH_FROZEN_LEGACY`, aucune finding. Le diff et la syntaxe des JavaScript sont contrôlés avant enregistrement.

Preuves : `../vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/task1/{local-checks.json,local-tests.log,precheck.json}`.

## Limites et point d'entrée de la tâche 2

1. Les adaptateurs de capture/réconciliation restent des interfaces versionnées à configurer pour la tranche. Leur invocation automatique et leurs refus sont vérifiés localement ; l'accès Figma authentifié du runner et une capture fraîche ne sont pas démontrés.
2. Une documentation uniquement en prose, sans inventaire structuré dans son contrat d'écran, est refusée au lancement. L'exhaustivité sémantique de prose libre, les contradictions non formalisées et l'utilisation sémantique réelle des ressources exigent une revue ; elles ne sont pas certifiées par des hashes ou des déclarations du modèle.
3. Le comparateur actuellement disponible relit des faits JSON exécutés. Il ne certifie pas le rendu perceptif/natif ni l'appareil. Un adaptateur renderer et ses preuves indépendantes seront nécessaires pour de telles conclusions.
4. Le pilote `initial` est préparé mais n'a pas été exécuté. Le contrôleur existant ne sélectionne pas encore ce nouveau pilote Figma. La tâche 2 devra raccorder explicitement ce pilote dans la même campagne, qualifier le candidat exact, préserver le dépôt livré et les preuves avant son nettoyage, puis lancer seulement le parcours autorisé. Correction/reprise après validation et clôture indépendante restent des étapes ultérieures.

Le point de départ de la tâche 2 est le commit enregistré de cette tâche et son précontrôle local. Le fichier `request.json` reste strictement inchangé (`QUALIFY_ONLY`, `final_audit_authorized=false`). Une publication normale de ce delta déclencherait les qualifications PR Ubuntu/Windows et les contrôles historiques ; l'audit architectural est limité à `opened`, l'exécution Claude du pilote nécessite une autre sélection explicite, et la qualification jetable V2 nécessite un dispatch distinct. Le point de reprise est enregistré avec `[skip ci]` pour ne programmer aucune qualification supplémentaire pendant cette tâche locale. Il ne vaut pas qualification CI du nouveau commit.

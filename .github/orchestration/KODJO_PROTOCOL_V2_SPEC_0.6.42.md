# KODJO Protocol V2 — spécification 0.6.42

Date : 2026-09-19  
Base : 0.6.41  
Objet : architecture globale du préflight déterministe unique avant Lean Queue.

## Statut

0.6.42 est une **version d’architecture**, pas encore une activation runtime.

Elle définit le contrat cible, la position dans la chaîne, les responsabilités et la matrice des contrôles.

Aucun chemin de production n’est modifié dans ce lot.

## Décision

Le protocole adopte un modèle à quatre niveaux :

1. **SELECTION** : déterminer la queue exacte issue du boundary Git ;
2. **PREFLIGHT** : agréger toutes les préconditions déterminables avant exécution ;
3. **FRESHNESS_GUARD** : revalider uniquement les données volatiles au dernier moment ;
4. **EXECUTION_POST** : conserver les contrôles post-Claude, review et finalisation.

Le futur préflight unique devra produire une attestation locale :

`kodjo.protocol.v2.queue-preflight.v1`.

Cette attestation n’est ni un état protocolaire, ni un canal GitHub, ni un nouveau schéma Lean Queue.

## Règles d’architecture

- une règle stable a une seule source de vérité ;
- le futur orchestrateur appelle les validateurs existants au lieu de recopier leurs règles ;
- tous les échecs indépendants sont collectés dans un rapport unique ;
- une dépendance non vérifiable à cause d’un échec amont est marquée `BLOCKED` ;
- aucune mutation et aucun Claude avant `status=PASS` ;
- un contrôle LIVE ou RUNNER_VOLATILE peut être rejoué uniquement comme freshness guard minimal ;
- PLAN, PLAN_REVIEW, IMPLEMENTATION_REVIEW, gate humain/device et FINAL_VERIFICATION restent hors du préflight ;
- VISUAL_CORRECTION conserve sa sémantique différentielle ;
- le legacy non-V2 est hors périmètre ;
- les trois HEAD protocole / scan-plan / application restent distincts.

## Sources autoritatives

Le préflight doit réutiliser les implémentations existantes :

- `verify-queue-admission.js` pour la sélection ;
- `lib/queue-contract.js` pour le contrat Lean Queue ;
- `lib/scope-path.js` pour les chemins ;
- `verify-authorizations.js` pour plan/review/gate ;
- `verify-visual-checkpoint.js` pour le checkpoint ;
- `lib/recovery-migration.js` pour l’attestation ;
- `verify-plan-contract-consistency.js` pour le plan courant ;
- `verify-implementation-mission.js` pour IMPLEMENT ;
- `project-queued-request.js` + `normalizeRequest` pour la projection ;
- `lib/claude-local.js` pour prompt/budget/version ;
- `lib/execution-lock.js` pour le lock ;
- `verify-ui-implementation-review.js` et `verify-v2-finalization.js` restent en aval.

## Phasage d’implémentation

### Lot A
Créer le moteur de préflight et l’attestation sans supprimer aucun contrôle existant.

### Lot B
Faire consommer l’attestation par `run-queued-request.ps1`, puis retirer seulement les duplications stables démontrées.

### Lot C
Qualifier E2E les parcours IMPLEMENT, RESUME_DELTA, VISUAL_CORRECTION et les races LIVE.

## Non-régression

0.6.42 architecture :

- ne modifie aucun fichier `app/**` ou `src/**` ;
- ne modifie aucun workflow de production ;
- ne modifie aucun script runtime de production ;
- ne modifie aucun statut protocolaire ;
- ne modifie aucun transport ;
- ne modifie pas Lean Queue 0.6.13.

## Validation

La validation de cette architecture repose sur :

- `.github/orchestration/KODJO_PROTOCOL_V2_PREFLIGHT_ARCHITECTURE_0.6.42.md` ;
- `.github/orchestration/KODJO_PREFLIGHT_ARCHITECTURE_MATRIX_0.6.42.json` ;
- `tests/kodjo/preflight-architecture.pilot.js`.

Le test doit démontrer :
- couverture des quatre phases ;
- couverture IMPLEMENT + VISUAL_CORRECTION ;
- rattachement des cinq invariants ;
- existence de chaque source de vérité ;
- séparation immutable/live/runner volatile ;
- ordre courant des frontières pré-Claude ;
- absence de nouvel état/canal.

L’implémentation runtime du préflight est interdite tant que cette architecture n’est pas qualifiée.

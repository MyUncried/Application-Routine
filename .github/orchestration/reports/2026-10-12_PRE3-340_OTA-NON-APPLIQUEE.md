# PRE-3 (#340) — l’OTA `01a12fae` n’est pas appliquée sur l’iPhone de recette

## Identité de la mission

| Élément | Valeur |
|---|---|
| Identifiant | `PRE3-340_OTA-NON-APPLIQUEE` |
| Objectif | Établir pourquoi l’OTA publiée n’est pas appliquée : configuration du build, téléchargement, activation, erreur ou retour arrière. Prouver l’identifiant de mise à jour réellement exécuté dans Routine Dev. |
| Déclencheur | Hermann, 12/10 à 14:46 (Paris) : « Annuler » encore présent dans « Créer une catégorie ». Captures du build `e1deb07e`, 1.0.0 (7), canal `review`. |
| Branche | `feat/pre3-exercice-20261009`, départ `c8eaccc1` (local = distant) |
| Limites | Avant l’arbitrage : aucune modification de code, aucune OTA, aucun build. Après l’arbitrage A : écran de diagnostic et build 8 seulement. Pas de PRE-4, de fusion, de clôture ni de `VISUAL_APPROVED`. |
| Statut | Arbitrage rendu : **A** (Hermann, 12/10). Build 8 de diagnostic livré. **La preuve sur l’appareil est attendue** (`procedure-diagnostic-ota.md`). |

## Périmètre

- **Demandé** : diagnostiquer la non-application de l’OTA et prouver l’identifiant exécuté.
- **Traité** :
  - chaîne serveur entièrement vérifiée ;
  - données EAS côté appareil ;
  - recensement des moyens de preuve sur l’appareil.
- **Non traité** : reprise de la recette, suspendue sur instruction.

## Correction d’une attribution antérieure

Le rapport `2026-10-12_PRE3-340_T15-DEPOT-SERIE.md` qualifiait de « démontrée » l’attribution du constat T-15 à `01a12f22`. **Ce rapport la ramène à « non vérifiée ».**
- Les données EAS sont compatibles avec cette attribution, mais n’identifient pas la version exécutée.
- Le registre (ligne T-15) et `procedure-retest-T15.md` sont corrigés en ce sens. Le retest T-15 est suspendu.

## Constats

| Maillon | Vérification | Résultat | Qualification |
|---|---|---|---|
| Build installé | Capture expo.dev ; publications antérieures | Build 7 `e1deb07e`, `9f5cee0`, canal `review`, runtime 1.1.0. `expo-updates ~57.0.23` présent, `updates.url` correct. Le même build a installé 5 OTA du canal sur 7 jours, dont `01a12f22` à 08:0x UTC le 12/10. | Configuration conforme : **démontré** |
| Canal | `eas channel:view review` | Non mis en pause ; pointe sur la branche `review` (logique `true`, sans déploiement progressif) ; dernière mise à jour iOS : `01a12fae` | Conforme : **démontré** |
| Mise à jour | `eas update:view` | `01a12fae` : iOS, runtime 1.1.0, aucun déploiement progressif, pas de signature de code (comme `01a12f22`) | Conforme : **démontré** |
| Manifeste servi | Requête du client (iOS, 1.1.0, `review`, `multipart/mixed`) | HTTP 200, id `01a12fae…`, créée à 10:35:16 UTC | Conforme : **démontré** |
| Assets | Téléchargés comme `expo-updates` (en-têtes `authorization` EAS-HMAC de l’extension), SHA-256 comparés | `01a12fae` : **57/57**, HTTP 200, empreintes conformes. `01a12f22` : 57/57. | Téléchargeable et intègre : **démontré** |
| Contenu | Bundle `01a12fae` | Contient le repère T-15 (`execution-sheet-table-insertion-guide-before-`), absent du bundle `01a12f22` | **Démontré** |
| Téléchargement par l’iPhone | `eas update:insights` à 12:35 UTC | `01a12fae` : 0 installation, 0 échec. `01a12f22` : 1 installation à 08:0x UTC. | **Aucun téléchargement enregistré** (le délai de collecte d’EAS n’est pas documenté) |
| Retour arrière | Même source | 0 installation échouée pour toutes les mises à jour du canal | Aucun retour arrière signalé ; sur l’appareil : **non vérifiable** |
| Version exécutée | Capture de 14:46 | « Annuler » présent, donc **le code exécuté n’est pas `a12bb92f`**. La capture ne distingue pas `01a12f22` du bundle embarqué du build 7. | **Identifiant exécuté : non vérifiable** depuis le PC |

**Conclusion.** Toute la chaîne côté serveur est vérifiée et fonctionne. Le défaut se situe dans l’app, entre la vérification au lancement et l’activation.

**Hypothèses non démontrées**, par ordre de plausibilité :
1. **Aucune vérification ou aucun téléchargement réussi depuis 10:35 UTC** : requête échouée sur le réseau, ou téléchargement interrompu. Hypothèse compatible avec 0 installation et 0 échec.
2. Téléchargement non comptabilisé par EAS, puis lancement non activé. Il faudrait que le comptage d’EAS soit en retard.
3. Lancement de `01a12fae` en échec, puis retour arrière silencieux : peu compatible avec 0 échec signalé.

**Les données serveur ne permettent pas de trancher. Seuls ces champs, lus sur l’appareil, le permettent :**
- `Updates.updateId`, `isEmbeddedLaunch` ;
- `isEmergencyLaunch`, `emergencyLaunchReason` ;
- `useUpdates()` : `checkError`, `downloadError`, `lastCheckForUpdateTimeSinceRestart` ;
- `Updates.readLogEntriesAsync()`.

## Pollution des preuves

Le contrôle des assets (≈ 12:55 UTC) a téléchargé les deux bundles depuis ce PC. Après ce moment, les compteurs d’installation d’EAS ne prouvent plus une installation par l’iPhone.

## Moyens de prouver l’identifiant exécuté

L’app n’expose aujourd’hui aucune de ces informations (aucun usage d’`expo-updates` dans `src/` et `app/`). Le PC n’a ni service Apple Mobile Device ni outil de journal iOS. Trois voies existent ; chacune exige une décision de Hermann :

| Choix | Moyen | Avantages | Coût et limites |
|---|---|---|---|
| A | **Build 8** du code actuel, avec un panneau de diagnostic `expo-updates` (identifiant exécuté, lancement embarqué ou OTA, lancement d’urgence, dernières erreurs de vérification et de téléchargement, journal). | Le code du candidat est chargé **par construction** (embarqué), sans dépendre de l’OTA. Le panneau prouve l’identifiant, puis observe chaque OTA suivante. | Ajout de code hors de la `write_scope` PRE-3. Nouveau build sans modification native, contraire à la règle actuelle (build seulement si le natif l’impose). Environ 6 min de build EAS, puis « Install » sur l’iPhone. Le journal des échecs actuels risque de ne pas survivre. |
| B | **Journal système par USB** : application Apple Devices (Microsoft Store) et `pymobiledevice3` sur ce PC, iPhone branché et approuvé, une ouverture de l’app pendant la capture. | Aucun code, aucun build. Observe l’état actuel de l’appareil. | Logiciels à installer sur le PC ; iPhone branché à ce PC ; une ouverture de l’app pendant la capture. Les messages d’`expo-updates` affichés dépendent de leur niveau de journal : **utilité plausible, non garantie**. |
| C | Autre voie, à préciser. | — | — |

## Preuves et tests

Aucun test applicatif n’était applicable : aucun code n’a été modifié.

Preuves :
- `docs/preparation/PRE-3/planification/execution/preuves/ota-non-appliquee-diagnostic.json` : canal, métadonnées, 57/57 assets par mise à jour, contenu des bundles, adoption du canal sur 7 jours, captures de Hermann ;
- `t15-verification-ota-executee.json` (mission précédente).

## Modifications réalisées

Documentaires :
- le présent rapport ;
- `ota-non-appliquee-diagnostic.json` ;
- `registre-recette2.md` : T-15, attribution ramenée à « non vérifiée » ;
- `procedure-retest-T15.md` : retest suspendu.

## Non traité, hors périmètre

T-15 (non validé), T-53, T-58, EXT-R2-A/B/C, R2-01 à R2-11 et les non-concluants : inchangés et ouverts.

## Vérifications restant à faire sur l’appareil

Lire l’identifiant de mise à jour exécuté par la voie A ou B, une fois l’arbitrage rendu.

## Commit final et état Git

Un commit documentaire sur `feat/pre3-exercice-20261009`, publié sans force. Son hash et sa vérification par l’API GitHub sont donnés dans la réponse de livraison.

## Arbitrage A : build 8 de diagnostic

Décision de Hermann le 12/10 : **A — build 8 + diagnostic**. Elle autorise un ajout de code hors de la `write_scope` PRE-3 et un build sans modification native.

**Code** (`58bbc3bc3221bbd4f2dd080016469620b6bf2643`) :
- `app/diagnostic-updates.tsx` : route `routine://diagnostic-updates`, sans aucun lien depuis un écran du produit ;
- `src/features/diagnostics/UpdatesDiagnosticScreen.tsx` : écran du diagnostic ;
- son test.

L’écran affiche :
- `updateId`, lancement embarqué ou OTA, lancement d’urgence et sa raison ;
- canal, runtime, build ;
- `useUpdates()` : dernière vérification, mise à jour disponible ou en attente, erreurs de vérification et de téléchargement ;
- le journal `readLogEntriesAsync` sur 7 jours ;
- un bouton de vérification manuelle (`checkForUpdateAsync`, sans téléchargement ni relance).

Aucun autre fichier applicatif n’est modifié.

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | PASS |
| `npx eslint src app` | PASS |
| `jest src/features/diagnostics` | 2/2 PASS |
| `jest` complet | 97/98 suites, 1942/1951 tests. Les 9 échecs sont tous dans `ExerciseScreen.test.tsx` : attente de fermeture de la feuille Catégorie (`waitFor` 3000 ms), dépassée sur cette machine. **Préexistants** : reproduits à l’identique sans les fichiers du diagnostic (`git stash -u`, même code que `2f7ab292`). Cette suite passait lors de la mission de la recette 2 ; les durées constatées ici (132 s pour la suite seule) indiquent une machine chargée. Non corrigés : hors périmètre. |

**Build 8** :

| Élément | Valeur |
|---|---|
| Build | `38bf5fc2-b053-4fd1-a475-48f08b7f542f`, profil `review`, iOS 1.0.0 (**8**), canal `review`, runtime 1.1.0, commit `58bbc3bc` |
| Page | https://expo.dev/accounts/ankushas-team/projects/routine/builds/38bf5fc2-b053-4fd1-a475-48f08b7f542f |
| IPA vérifiée | Téléchargée (17,8 Mo). `Info.plist` : `com.ankusha.kodjo.dev`, 1.0.0 (8), schéma `routine`. `main.jsbundle` : repère T-15 présent ; route `updates-diagnostic` présente. |
| Mise à jour embarquée | `19e31f06-f210-432a-8297-fffe72cf2a0d`, commitTime 2026-10-12T13:32:34Z, plus récente que `01a12fae` : le build 8 lance son bundle embarqué |
| `Expo.plist` | `EXUpdatesCheckOnLaunch=ALWAYS`, `EXUpdatesLaunchWaitMs=0` (téléchargement en arrière-plan, application au lancement suivant), `EXUpdatesEnableBsdiffPatchSupport=true`, canal `review` |

**Nouvelle hypothèse non démontrée.** La prise en charge des correctifs différentiels (bsdiff) est active. Un échec d’application d’un correctif sur l’appareil n’est pas exclu. Le journal du diagnostic permettra de le confirmer ou de l’écarter.

**Version de recette.** Build 8 = code `a12bb92f` (candidat de la recette 2) + écran de diagnostic. Le retest T-15 reste suspendu jusqu’à l’examen des captures du diagnostic.

**Procédure** : `docs/preparation/PRE-3/planification/execution/preuves/procedure-diagnostic-ota.md`.


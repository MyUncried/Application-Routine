# DIAG-CPU-MEMOIRE — consommation processeur et mémoire de Routine BMAD (rapport d'étape)

## Identifiant et objectif

- **Mission :** DIAG-CPU-MEMOIRE (demande de Hermann du 21/11/2026, 22h10 : « Oui, c'est important »).
- **Objectif :** trouver pourquoi Routine BMAD consomme presque tout le processeur et une mémoire croissante au cours d'une session, jusqu'à sa fermeture par iOS (21/11/2026, 21h49).
- **Type :** diagnostic, sans correction. Aucun fichier applicatif n'est modifié ; seul ce rapport est committé.
- **Statut :** en cours. Cause non démontrée ; une mesure sur l'iPhone est attendue.

## Branche et commit de départ

- Branche `diag/cpu-memoire-20261121`, créée depuis `origin/feat/plan-20261121` au commit `c8d389ca` (PLAN-01), dans le worktree `C:\Dev\KODJO-DIAG-CPU`.
- Application observée : Routine BMAD (`com.ankusha.kodjo.bmad`), version de développement servie par Metro (`C:\Dev\KODJO-PLAN`, port 8083, `APP_VARIANT=development`, `EXPO_NO_METRO_LAZY=1`).

## Périmètre demandé

Diagnostic de la consommation : mesure sur une session longue, recherche de l'écran ou du code responsable, rapport.

## Périmètre réellement traité

1. Lecture des rapports iOS fournis par Hermann.
2. Mesures du moteur JavaScript (Hermes) par l'inspecteur de Metro (CDP).
3. Lecture ciblée du code : rafraîchissement de l'écran d'Exécution, sons, PlanScreen et geste de déplacement de la planification.

Il n'y a pas eu de mesure sur une session longue reproduisant la soirée (voir « Restant à faire »).

## Constats

### 1. La fermeture de 21h49 n'est pas causée par le geste signalé

- Le geste signalé est : création d'un parcours dans l'Agenda, trois séances, « Changer », appui long sur la dernière séance.
- Après une fermeture complète puis une réouverture de l'application, le même geste **ne se reproduit pas** (Hermann, 22h08).
- Metro n'a enregistré aucune erreur JavaScript.
- Aucun rapport de plantage ne date de 21h49.
- PLAN-01 n'a pas modifié le geste de déplacement (`useRowDrag`, `PlanningScreen.tsx`, recette du 19/11, q19-deplacement).

### 2. La même session a saturé le processeur avec une mémoire croissante

Les trois rapports iOS `cpu_resource` du processus 7069 (lancé vers 21h15) montrent ceci, avec `Action taken: none` à chaque fois :

| Fenêtre | Processeur | Mémoire du processus |
|---|---|---|
| 21:15:11 – 21:17:01 | 90 s sur 110 s (82 %) | — |
| 21:24:12 – 21:25:43 | 90 s sur 92 s (98 %) | 1 410 → 1 480 Mo (max 1 516) |
| 21:34:24 – 21:35:55 | 90 s sur 92 s (98 %) | 1 984 → 2 060 Mo (max 2 091) |

- La mémoire augmente d'environ 55 Mo par minute.
- Prolongée à ce rythme, elle atteint environ 2,8 Go vers 21h49.
- **Hypothèse plausible, non démontrée :** arrêt par iOS pour excès de mémoire. Aucune entrée « JetsamEvent » n'a été consultée.

### 3. Le fil saturé est le fil JavaScript

La pile la plus lourde des rapports `cpu_resource` a été identifiée grâce aux identifiants des bibliothèques (images de `RoutineBMAD-2026-11-21-211236.ips`) :

- `F833B928…` = `React.framework` ; `25EB07E0…` = `hermesvm.framework`.
- La pile part de `RCTJSThreadManager runRunLoop` et descend dans Hermes : c'est **du JavaScript qui s'exécute en continu**.
- Ce n'est ni le son (thread audio) ni l'affichage natif.

### 4. Un problème antérieur à PLAN-01

- La liste « Données d'analyse » de l'iPhone contient deux autres rapports `cpu_resource` de Routine BMAD : **20/11 à 23:53** et **21/11 à 00:25**.
- Ils sont antérieurs à PLAN-01 et à AGENDA-SEANCES-01. Leur contenu n'a pas été consulté.

### 5. Plantage de 21h12 : distinct, lié au rechargement

- Rapport : `RoutineBMAD-2026-11-21-211236.ips`.
- `EXC_BAD_ACCESS` dans `Scheduler::uiManagerDidFinishTransaction`, 8 s après le lancement.
- Deux fils `com.facebook.react.runtime.JavaScript` coexistent, chacun avec son ramasse-miettes Hermes : l'ancienne instance était démontée pendant que la nouvelle s'affichait.
- C'est un plantage interne de React Native lors d'un rechargement en développement, au premier chargement après la relance de Metro. Il est sans lien avec le code de l'application.

### 6. Mesures directes du moteur JavaScript (CDP)

| Situation | Tas JavaScript | Moteur occupé |
|---|---|---|
| Application au repos, après démarrage à neuf (22h1x) | 87,0 → 87,1 Mo en 15 s (stable) | — (profil interrompu) |
| Séance en **Pause** (22h1x) | **100,7 → 109,6 Mo en 15 s** | **11 %**, presque tout en rendu React (`performWorkOnRoot`), GC 10 % |

- Le tas JavaScript ne représente qu'une petite part des 2 Go mesurés par iOS. La croissance du processus est donc surtout native.
- Les objets d'affichage créés à chaque rendu en sont une source plausible, non démontrée.

### 7. Lecture du code : l'écran d'Exécution se rafraîchit sans fin en Pause

Dans `src/features/execution/ExecutionScreen.tsx` :

- l'effet de rafraîchissement (l. 225–269) tourne tant que `running = active !== null && active.state.status !== "FINISHED"`, donc **aussi en Pause** ;
- chaque passage appelle `service.pulse()` puis `refresh()`, ce qui redessine l'écran ;
- le délai `refreshDelayMs` (l. 1968) vaut `min(250, max(16, ((remainingMs − 1) % 1000) + 1 + 20))` pour un compte à rebours, et un calcul semblable pour un chronomètre ;
- en Pause, le temps restant est figé, donc ce délai est **constant**. Il vaut entre 21 et 250 ms selon l'instant où la Pause a figé le chrono, soit de 4 à environ 47 rafraîchissements par seconde, jusqu'à la sortie de l'écran.

Cette lecture concorde avec la mesure du constat 6 (rendu continu en Pause, tas croissant), mais **ne suffit pas** à expliquer une saturation à 98 %.

### 7 bis. Essais complémentaires du soir (22h47 – 23h20)

**Séance en Pause seule, au premier plan, de 22h47 à 23h15 (28 minutes)**

- Aucun nouveau rapport `cpu_resource` (liste vérifiée par Hermann à 23h17).
- La Pause seule reste donc sous le seuil d'iOS (50 % sur 180 s), ce qui concorde avec les 11 % mesurés.
- Réserve : iOS peut limiter le nombre de rapports par jour. Quatre avaient déjà été écrits le 21/11.
- Un essai de 22h25 n'est pas retenu : l'application était en arrière-plan, donc suspendue.

**Rapports antérieurs à PLAN-01**

| Rapport | Processus | Processeur | Mémoire |
|---|---|---|---|
| `cpu_resource-2026-11-20-235325` (23:50:46 – 23:53:23) | 5267 | 57 % sur 157 s | 444 → 516 Mo |
| `cpu_resource-2026-11-21-002516` (00:23:34 – 00:25:14) | 5283 | 91 % sur 99 s | 439 → 525 Mo (+86 Mo en 90 s) |

- La pile la plus lourde est la même que le 21/11 au soir : `RCTJSThreadManager` → React → Hermes. C'est le même mécanisme JavaScript.
- Le binaire installé est le même (`4DE42FBA…`).
- Le processus 5283 tournait depuis moins de 30 minutes : le processus 5267 était encore actif à 23h53. Une session longue n'est donc pas nécessaire. Quelque chose déclenche la boucle, qui ne s'arrête plus ensuite.
- Le 20/11 au soir, l'activité de recette portait sur les Mouvements et le catalogue (commits `495e7c21`, `a47a6e23`, `ab55f0f4`). Le 21/11, elle portait sur l'Agenda et le Plan. Le déclencheur est donc probablement commun à l'application.
- Hermann ne se souvient pas de son activité juste avant 0h23 le 21/11.

**Rapport reçu en double**

`RoutineBMAD-2026-11-21-211236.ips` et `cpu_resource-2026-11-21-002516` ont chacun été reçus deux fois. Les fichiers sont identiques, ou portent le même identifiant d'incident.

### 8. Pistes examinées et écartées comme cause principale

- **Sons** (`ScheduledSounds`) : l'`AudioContext` n'est jamais fermé, car `stop()` n'est appelé nulle part ; la session audio est seulement rendue. C'est un point à examiner, mais la pile saturée est celle du fil JavaScript, pas du fil audio.
- **PlanScreen** : aucune minuterie ni boucle d'effet. Le chargement a lieu au focus et au changement de semaine.

## Preuves et tests

- Rapports iOS (conservés dans le dossier des envois de la conversation, hors dépôt) :
  - `RoutineBMAD-2026-11-21-211236.ips` (reçu deux fois, fichiers identiques octet pour octet) ;
  - `RoutineBMAD.cpu_resource-2026-11-21-211701.ips`, `…-212546.ips`, `…-213558.ips`.
- Profils CDP : `pause1.cpuprofile` et sortie de `cdp-measure.js` et `analyse.js`, dans le dossier temporaire de la session.
- Aucun test Jest lancé : diagnostic sans modification de code, aucun test applicable.

## Hypothèses non démontrées

1. Arrêt de 21h49 par iOS pour excès de mémoire.
2. Rendu continu de l'écran d'Exécution en Pause comme contributeur à la croissance de la mémoire.
3. Une autre boucle JavaScript, non identifiée, nécessaire pour atteindre 98 %. Il pourrait s'agir d'une séance en Pause restée longtemps ouverte, cumulée au coût d'une version de développement (`dev=true`, React Compiler, `runWithFiberInDEV`).

## Incident de méthode

- Les connexions de l'outil de mesure à l'inspecteur ont coïncidé avec des disparitions de la cible de débogage.
- Elles ont aussi coïncidé avec quatre rechargements de l'application en une minute (22h24–22h25).
- Un lien de cause n'est pas exclu. La surveillance automatique a été arrêtée, et la suite se fait sans connexion à l'application, à partir des rapports iOS.
- Les mesures ont aussi été faussées par le passage de l'application en arrière-plan (Hermann utilisait Claude sur le même iPhone), ce qui coupe la liaison avec Metro.

## Modifications réalisées

Aucune modification applicative. Seul ce rapport est ajouté.

## Éléments non corrigés ou hors périmètre

- Rafraîchissement de l'écran d'Exécution en Pause : correction possible (arrêter ou ralentir la boucle en Pause). Elle **n'est pas faite** : elle touche l'Exécution (PRE-10), son comportement relève d'un arbitrage, et la cause principale n'est pas établie.
- `AudioContext` jamais fermé : à examiner séparément.
- Numéros de décision en double (D-553 à D-555, PROG-CAT-01 contre AGENDA-SEANCES-01 et PLAN-01), et migration 035 sautée sur les bases déjà en version 37 : signalés à Hermann, hors de ce diagnostic.

## Vérifications restant à effectuer sur appareil réel

1. **Prochaine étape, accord de Hermann à 23h20 :** surveillance légère par l'inspecteur de Metro.
   - Une mesure de 3 s par minute, pendant une utilisation normale de Routine BMAD au premier plan.
   - Profil complet enregistré dès qu'une mesure dépasse 50 % d'occupation, pour nommer les fonctions JavaScript en cause.
   - Script : `watch.js`, dans le dossier temporaire de la session.
   - La surveillance a été lancée à 23h22, puis arrêtée avant la nuit, sans aucune mesure. Elle sera relancée à la reprise.
2. Dès qu'un profil est obtenu : identifier le composant ou l'effet en boucle, puis proposer une correction, soumise à l'accord de Hermann.

## Suspension

Mission suspendue le 21/11/2026 à 23h25, à la demande de Hermann (« Je vais me coucher, je reprends demain »). Metro reste lancé depuis `C:\Dev\KODJO-PLAN` (port 8083), comme avant la suspension.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-21_DIAG-CPU-MEMOIRE.md` (nouveau)

## Commit final et état Git

Renseignés dans le compte rendu de livraison (commit de ce rapport sur `diag/cpu-memoire-20261121`).

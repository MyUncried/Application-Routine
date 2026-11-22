# DIAG-CPU-MEMOIRE-2211 — fermeture de Routine BMAD du 22/11/2026 à 21h12

## Identifiant et objectif

- **Mission :** DIAG-CPU-MEMOIRE-2211, suite de DIAG-CPU-MEMOIRE (rapport `2026-11-21_DIAG-CPU-MEMOIRE.md`).
- **Demande de Hermann (22/11/2026, 21h18) :** « l'application vient de planter, à 21h12 » (Routine BMAD, Metro port 8083), pendant le test de a31-deploye dans l'Agenda.
- **Type :** diagnostic, sans correction. Aucun fichier applicatif modifié ; seul ce rapport est committé.

## Branche et commit de départ

- Rapport : branche `diag/cpu-memoire-20261121`, commit de départ `a6975270`, worktree `C:\Dev\KODJO-DIAG-CPU`.
- Application observée : Routine BMAD servie par Metro depuis `C:\Dev\KODJO-PLAN` (`feat/plan-20261121`, HEAD `1f6b94c3`, code de `2f1a7cdf`), port 8083.

## Périmètre demandé

Comprendre l'arrêt de 21h12.

## Périmètre réellement traité

1. Journal de Metro de la session (lancée à 18h52).
2. Liste des rapports « Données d'analyse » de l'iPhone (capture de Hermann, 21h20).
3. Rapport `RoutineBMAD.cpu_resource-2026-11-22-210244.ips` (fourni par Hermann).
4. Lecture ciblée : `CalendarWeekScreen.tsx`, `ExecutionScreen.tsx` (`close`), routeur d'`expo-router` 57.0.16.

## Constats

### 1. Ce n'est pas un plantage, c'est une fermeture par iOS

- Aucun rapport de plantage `RoutineBMAD-2026-11-22-*.ips` dans la liste de l'iPhone (les derniers datent du 21/11 : 211236 et 222526).
- Metro n'a enregistré aucune erreur JavaScript. Dernières traces avant l'arrêt : deux séances terminées à 19h03 et 19h10 ; puis un rechargement à 21:13:27, qui est la réouverture de l'application par Hermann.
- L'application tournait donc sur le même chargement depuis au moins 19h10.
- Absence de `JetsamEvent` non vérifiée (recherche « jetsam » demandée à Hermann, pas encore faite).

### 2. Le rapport de 21:02:44 montre une mémoire énorme et croissante

| Mesure (21:00:44 → 21:02:43) | Valeur |
|---|---|
| Processeur | 90 s sur 119 s (75 % en moyenne ; seuil iOS 50 % sur 180 s) |
| Mémoire du processus | **1 598,50 Mo → 1 854,78 Mo (+256 Mo en 107 s, ≈ 140 Mo/min)** |
| État | Application au premier plan, active, sur batterie |
| `Action taken` | none |

- À ce rythme, la mémoire dépasse 3 Go vers 21h12 : la fermeture par iOS pour excès de mémoire est **plausible**, non démontrée (pas de `JetsamEvent` consulté).
- La pile la plus lourde (16 échantillons sur 23) est un fil à boucle d'exécution propre (`pthread → Foundation (NSThread) → CFRunLoop → binaire de l'application`), puis le moteur `25EB07E0…` (12 échantillons). C'est la forme du fil JavaScript de React Native qui exécute Hermes. Rapport non symbolisé : les fonctions ne sont pas nommables.
- D'autres rapports `cpu_resource` existent aujourd'hui à 14:14:05 et 14:29:47, et les 20/11 et 21/11 : le problème de processeur est **antérieur** au code du 22/11.

### 3. Défaut démontré par le code : la fin d'une séance du Catalogue empile un second jeu d'onglets

- `2f1a7cdf` (22/11, 01h46, recette du 21/11, constat f) : `ExecutionScreen.close` appelle `router.navigate({ pathname: "/calendar", … })` après une séance lancée depuis le Catalogue.
- `expo-router` 57.0.16 envoie un `NAVIGATE` vers la pile racine avec le nom `(tabs)`. Dans `StackRouter` (`node_modules/expo-router/build/react-navigation/routers/StackRouter.js`, l. 178–238), sans `pop` ni identifiant, un écran existant n'est réutilisé que s'il est l'écran courant. L'écran courant est `execution`, donc **un nouvel écran `(tabs)` est poussé** au-dessus de l'Exécution.
- Conséquence : après chaque séance lancée depuis le Catalogue, la pile devient `(tabs) → execution → (tabs) → …`. L'écran d'Exécution terminé et un jeu complet d'onglets restent montés en dessous.
- Ce soir, deux séances (19h03, 19h10) ont été jouées. Si elles venaient du Catalogue, au moins deux jeux d'onglets supplémentaires étaient montés à 21h12.
- La boucle de rafraîchissement de l'Exécution s'arrête une fois la séance terminée (`running` faux à `FINISHED`, puis `service.release()`). L'écran resté monté ne tourne donc **pas** en boucle par ce mécanisme.

## Attribution (règle du diagnostic historique)

| Élément | Introduit par | Détecté | Attribution |
|---|---|---|---|
| Empilement d'onglets après une séance du Catalogue | `2f1a7cdf` (22/11) | ce diagnostic (lecture du code) | **démontrée** pour le mécanisme ; effet mémoire réel **plausible** |
| Processeur saturé et mémoire croissante | antérieur : rapports `cpu_resource` des 20/11 23:53, 21/11 00:25, 21/11 21:17–21:35 et 22/11 14:14–14:29, tous avant ou sans lien avec `2f1a7cdf` | rapports iOS | **indéterminée** |
| Fermeture de 21h12 | — | Hermann | iOS pour excès de mémoire : **plausible** |

L'empilement aggrave probablement la mémoire, mais il **n'explique pas** les saturations antérieures au 22/11. Il ne faut pas lui attribuer toute la panne.

## Preuves et tests

- Journal Metro : `C:\Users\hadjo\AppData\Local\Temp\claude\7fadec8524875022\5b6ef079-0b58-4ec7-a3d4-0a7647e576dc\tasks\bppeturaj.output` (67 lignes, dernière écriture 21:13:27).
- Rapport iOS : `RoutineBMAD.cpu_resource-2026-11-22-210244.ips` (incident `1BF02C66-3F83-4A83-80EA-ABD99FA9BBDD`, PID 9609).
- Aucun test Jest lancé : diagnostic sans modification de code.

## Hypothèses non démontrées

1. Fermeture de 21h12 par iOS pour excès de mémoire.
2. Contribution de l'empilement d'onglets à la mémoire de ce soir (dépend de l'origine des séances de 19h03 et 19h10).
3. Une boucle JavaScript non identifiée occupe le fil JavaScript à 75 % : elle existe depuis au moins le 20/11.

## Modifications réalisées

Ce rapport seulement.

## Éléments non corrigés ou hors périmètre

- **Correctif proposé, non appliqué**, pour l'empilement : dans `ExecutionScreen.close`, revenir aux onglets au lieu d'en pousser de nouveaux (par exemple `router.dismissTo` vers `/calendar` avec le jour, ou `navigate` avec `pop`). Il touche `feat/plan-20261121` (worktree `C:\Dev\KODJO-PLAN`) : à faire avec l'accord de Hermann.
- Identification de la boucle JavaScript : nécessite un profil (inspecteur de Metro, comme prévu le 21/11) ou un rapport symbolisé.

## Vérifications restant à effectuer sur appareil réel

1. Recherche « jetsam » dans Données d'analyse (22/11, vers 21h12).
2. Après correctif de l'empilement : jouer deux séances depuis le Catalogue, puis vérifier que le geste « retour » de l'Agenda ne ramène pas à une Exécution terminée.
3. Profil du fil JavaScript pendant une saturation.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-22_DIAG-CPU-MEMOIRE-2211.md` (nouveau)

## Commit final et état Git

Commit documentaire sur `diag/cpu-memoire-20261121`, envoyé sur `origin` (hash donné dans le compte rendu).

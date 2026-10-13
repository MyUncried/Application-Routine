# PRE3-340 — première revue indépendante d'implémentation

Date : 10 octobre 2026 (Europe/Paris). Pilote/reviewer : ChatGPT. Opération existante #340.

## Référence et résultat

Branche `feat/pre3-exercice-20261009`, tête examinée **96c46c7447aee1697f2dd2670b1952d51cca2928**, code final `bdc133c3`, départ `ae50aaedc1aaf506dccbb81c4e406e127af9824b`, plan approuvé `43e7b344937a2d60b04b987f19636faebb5aee06`.

**REVISE.** Première passe indépendante : contrôles, reproduction de défauts et examen ciblé des brouillons, médias, migrations et surfaces déclarées. Ce rapport n'affirme ni une revue exhaustive achevée de tous les 76 fichiers, ni la conformité des 23 exigences, ni une admission VNext. Aucun changement applicatif, fusion, build ou nouvelle campagne de qualification du protocole.

Le développement est publié, mais sa livraison finale n'est pas vérifiée. Le chiffre auteur « 442/442 obligations PASS » n'est pas une preuve indépendante de conformité complète : trois contre-exemples exécutés ci-dessous échouent.

## Contrôles exécutés indépendamment

Checkout propre du SHA exact, Linux, Node **v24.19.0**, dépendances installées avec `npm ci --ignore-scripts --no-audit --no-fund`.

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | PASS, avant et après ajout de la preuve |
| `npx eslint src app` | PASS |
| `npx jest --runInBand --silent` | 95/97 suites ; 1886/1893 tests ; 7 échecs, reproduits |
| `node docs/preparation/PRE-3/planification/passe2/verifier-passe2.cjs` | 2143 contrôles PASS ; pas une preuve applicative |
| `node docs/preparation/PRE-3/planification/execution/controle-portee.cjs --start ae50aaedc1aaf506dccbb81c4e406e127af9824b` | PASS, 76 chemins livrés |
| Reproductions indépendantes, commande ci-dessous | 3/3 assertions attendues échouent : défauts confirmés |

La preuve `execution/preuves/revue-independent-transitions.repro.tsx` est volontairement hors du motif standard `.test.tsx` : elle ne change pas le décompte de la suite applicative. Elle se lance explicitement :

```sh
npx jest --runInBand --silent --testRegex 'revue-independent-transitions.repro.tsx$' --runTestsByPath docs/preparation/PRE-3/planification/execution/preuves/revue-independent-transitions.repro.tsx
```

## Constats bloquants et corrections attendues

### REV-01 — anciennes cibles variables restaurées dans le mauvais mode (P3-04/05/16)

Fichier : `src/domain/activities/ExecutionParametersDraft.ts`, `setVariable`, `setMode`, `savedVariableRows`.

Reproduction : Durée variable [30 s, 60 s] → uniforme → Répétitions → variable. Attendu [null, null] (cibles incompatibles non renseignées). Observé [30, 60], **accepté par commitSheetDraft comme 30/60 répétitions** sans nouvelle saisie. Les cibles du tableau réservé ne sont pas transformées par le changement de mode.

Correction : conserver les réserves par mode et identité/ordre de lignes, sans importer des cibles incompatibles ; préserver N, pauses, bip et restauration légitime. Croiser bascules uniforme/variable, mode, N et réordonnancement ; annulation et ✓. Reproduire aussi le passage par À l'échec, pas seulement un cas isolé.

### REV-02 — contrôle de total actif mais validation sans effet après N=1 (P3-08/14/19)

Fichiers : `ExecutionParametersSheet.tsx` calcule l'éditabilité sur l'état EFFECTIF ; `ExecutionParametersDraft.ts/applyRequestedTotal` refuse l'état DEMANDÉ `draft.variable`.

Reproduction : tableau Durée variable → N=1 → demande de total 120 s. L'état effectif est uniforme et le contrôle est ouvert ; `applyRequestedTotal` retourne null. La feuille ferme la roulette sans appliquer la sélection.

Correction : rendre la décision d'éditabilité et l'application cohérentes avec la normalisation immédiate et les règles de remontée de N. Ne pas corriger en supprimant un contrôle requis. Tester dans la feuille la valeur réellement appliquée, le total réalisé et le message d'ajustement, puis annulation/✓/réouverture et remontée de N.

### REV-03 — réessai d'import inverse l'ordre choisi (P3-23)

Fichier : `src/features/activities/ActivityEditorForm.tsx/useMediaImport`, `handleResult` et `retry`.

Reproduction rendue sous Jest : choix photo A puis B ; A échoue, B réussit ; Réessayer A réussit. Attendu A,B ; observé B,A. Les médias prêts sont filtrés puis le réessai est simplement ajouté en fin.

Correction : identité et place de chaque sélection conservées malgré échec/réessai ; les choix de réordonnancement explicites de l'utilisateur ne doivent pas être annulés. Tester échec en tête/milieu/fin, plusieurs réessais, ajout de sélection ultérieure, annulation, retrait/réordonnancement, sauvegarde et vraie réouverture SQLite. Ne jamais supprimer de fichier référencé.

### REV-04 — deux parcours d'intégration restent rouges (P3-01/16/22)

`CompositionExerciseFlow.integration.test.tsx` (5) et `CategoriesSaveFlow.integration.test.tsx` (2).

Les échecs ne sont pas uniquement des libellés anciens : le premier parcours échoue dès `useReferentialService must be used within a SessionServiceProvider`. Adapter le harnais/providing aux dépendances réelles et les gestes à l'éditeur PRE-3. Préserver les assertions de persistance, position, absence de doublon, échec atomique, Continuer et retour Catalogue. Une suite verte obtenue en supprimant ces contrats serait refusée.

Extension technique bornée nécessaire : ces deux fichiers étaient omis du write_scope. Elle ne modifie aucune règle produit ni aucun protocole. Mission de correction publiée avec cette disposition ; l'ancien plan figé reste intact.

### REV-05 — permission native Photos inexacte avant build (P3-23)

`app.json` annonce un usage uniquement pour la photo du Profil, devenu inexact pour les médias d'Exercice. Adaptation minimale de cette seule chaîne/configuration nécessaire ; aucune nouvelle permission caméra/micro. Extension technique bornée de ce fichier, sans autre modification de configuration.

### REV-06 — fidélité visuelle non démontrée (P3-02/03/19/20/21)

L'auteur fournit une comparaison statique, **aucune capture rendue**, 20 écarts E1–E20 ouverts/délibérés sans acceptation démontrée. Dégradé remplacé par gris, sélection de mode affichée malgré aucun choix, groupe variable absent, libellés/surfaces différents : l'absence de token ou de chemin dans le plan ne suffit pas à reporter une exigence de livraison.

Corriger les écarts imposés par les sources ; distinguer réellement règle normative, adaptation responsive et choix produit nouveau. Ne pas solliciter une acceptation globale des 20 écarts. R-1 sur la suite de roulette ne vaut pas autorisation de changer son design. Produire les comparaisons rendues par état pertinent aux largeurs 360/402/440 et texte agrandi ; séparer celles-ci des tests sémantiques et de la perception iPhone/VoiceOver. Une absence d'environnement de rendu doit être déclarée comme besoin précis, pas comme PASS ni transfert de toute la validation à Hermann.

## Limites et suite

Le rapport technique de l'auteur et les tests SQL sont présents ; les suites migrations/repositories relancées passent. Leurs résultats ne valent pas une preuve de l'intégralité de tous les parcours ou du rendu natif. Pas de build installable publiée dans le dossier observé, pas de PR produit ouverte observée, #340 encore ouverte.

Aucune réparation VNext à engager. Même branche, écrivain Claude local unique. Mission corrective : `execution/preuves/mission-correction-revue1.md`. Après corrections publiées : revue indépendante des corrections et de leurs effets transverses, compléter l'examen du diff applicatif restant, puis recette appareil bornée et build. Aucune fusion avant ces preuves.

Fichiers de cette mission : ce rapport, preuve de reproduction, mission corrective. Aucun code applicatif modifié. Commit final : commit documentaire qui contient ces trois fichiers, communiqué au propriétaire après vérification du distant. Les travaux locaux de preuve sont conservés ; ancien rapport d'implémentation et corpus approuvé non réécrits.

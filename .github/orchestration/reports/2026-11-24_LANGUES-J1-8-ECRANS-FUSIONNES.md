# 2026-11-24 — LANGUES-J1-8 : écrans arrivés avec la fusion, traduits

## Identification

- **Mission** : traduire les écrans signalés par Hermann après la fusion. Liste de Hermann : Catalogue de séances (noms des catégories), Programmes (Actifs / Terminés, Rechercher, cartes), modale de programme, Journal / Agenda / Plan, Privacy.
- **Plan** : proposé dans la conversation et approuvé (« oui »). Il complète l'étape J1, dont le plan prévoyait que les textes de la branche Programmes passent au catalogue et soient traduits lors de la fusion.
- **Branche** : `claude/exciting-lovelace-iyn2wf`
- **Commit de départ** : `b074c416` (identique à `main`)

## Modifications

- **Programmes et Confidentialité** (agent, partie A) :
  - `programStrings.ts` est supprimé et remplacé par `strings.programs` (`frPrograms.ts`, `enPrograms.ts`) ;
  - `programPresentation.ts` utilise désormais des gabarits pour les dates (`dates.*`), « le {date} », les heures et la répétition ;
  - `toLocaleLowerCase` suit la langue de l'interface ;
  - environ 150 textes.
- **Planification : Journal, Agenda, Plan** (agent, partie B) :
  - `planningStrings.ts` est supprimé et remplacé par `strings.planning` (`frPlanning.ts`, `enPlanning.ts`), environ 300 textes ;
  - mois, jours et heures passent par des gabarits ;
  - « du {start} au {end} », semaine « S{n} » / « W{n} », jours de la semaine dans une phrase ;
  - les `"fr-FR"` et `"fr"` écrits en dur sont remplacés par `appLocaleTag`.
- **Notifications de rappel** : `localizedReminder`. Le domaine choisit toujours le modèle ; le texte vient du catalogue (55 modèles, anglais au plus 30 caractères par titre). En français, le texte est identique au domaine : un test le vérifie pour chaque modèle.
- **Catégories et Zones KODJO** (`referenceNames.ts`, appliqué à la lecture dans les dépôts) : leurs noms sont traduits tant que l'utilisateur ne les a pas renommées. Un nom modifié est un contenu utilisateur et reste tel quel.
- **Garde-fou** : les exclusions de `planningStrings`, `programStrings` et `programPresentation` sont retirées.
- **Cahier de recette J1** complété (cas 19 à 25).

## Écarts

- **Pluriels** : les deux agents ont gardé `count === 1` plutôt que `pluralOf`. Avec `pluralOf`, le français afficherait le singulier pour 0 ; or ce singulier contient « 1 » écrit en dur. `count === 1` donne le bon résultat en anglais et garde le français identique.
- **Premier jour de la semaine** : il reste le lundi (sujet séparé, hors de ce lot).

## Preuves et tests

- `tsc` : 0 erreur. `eslint` : 0 erreur.
- Suite complète : **476 suites, 6 722 tests verts**, 32 ignorés. Aucune attente de test modifiée.
- Nouveaux tests : `referenceNames.test`, `localizedReminder.test`. Parité des traductions et garde-fou verts.

## Choix de traduction à valider par Hermann

- Planification → « Schedule ».
- Rattacher → « Add » (programme) ou « Attach » (choix du programme d'une routine).
- Hors planification → « Unscheduled ».
- Objectif d'un programme → « Goal ».
- Relevés → « readings ».
- Pseudo → « Username ».
- Semaine « S12 » → « W12 ».
- Heures en anglais au format « 8:00 ».
- Messages de rappel : traduction libre et courte, en « you ».

## Restant

- Recette iPhone : cahier J1, cas 19 à 25.
- Le registre (ch. 07, l. 3380) cite encore `planningStrings.ts` comme référence historique ; laissé inchangé.

## Synchronisation code / documentation

- Classe **A** : conformité aux règles 1 à 5 de « Gestion des langues » (ch. 07).
- Catégories et Zones : règle 5, contenus KODJO traduits, appliquée en avance sur J4 à la demande de Hermann. Aucune nouvelle règle.

## Commit final et état Git

Voir le commit qui contient ce rapport sur `claude/exciting-lovelace-iyn2wf`.

# B.9 — Nom de séance à trois états

Story PRE-9, epic B. Plan : `../planning-artifacts/epics.md` § B.9 (ARB-14, ARB-15, précisés par Hermann le 01/11/2026, main `fce276fd`). Branche `pre9-bmad/dev`. Aucune migration, aucun changement Figma.

## Décisions de Hermann appliquées (textes recopiés)

| Date / source | Texte |
|---|---|
| 01/11/2026 (conversation ; main `fce276fd`, ch07 l.7, epics § B.9) | « pour B9 la restriction sur le titre n'est pas justifiée dans la conception actuelle. La règle devient : le nom du Format peut être suggéré ; le champ est modifiable dès l'ouverture ; un nom personnalisé n'est jamais remplacé automatiquement ; le Format reste affiché séparément sur la carte. » |
| 27/10/2026 (ch08 « Nom de séance — trois états », mis à jour par `fce276fd`) | « 1. À l'ouverture, le nom du Format peut être proposé comme suggestion initiale. Le champ est modifiable immédiatement ; le Format n'impose jamais le nom de la Séance. 2. À l'ajout du premier exercice, nom de cet exercice, éditable. 3. À l'ajout du second exercice, invite « Entrer un nom de séance », grise et éditable ; l'obligation de nommer apparaît. Aucun suffixe de niveau dans le nom. […] Un titre personnalisé n'est jamais remplacé automatiquement (ARB-14). Seul un titre resté suggéré suit les règles de recalcul applicables ; les cas non définis de retrait d'Exercices ne créent aucune nouvelle substitution. » |
| ARB-15 (ch07) | « Le nom du Format est le nom initial proposé. » |

## État avant B.9

Champ de nom libre (« Nom de la séance »), sans aucune suggestion : ni nom du premier Exercice, ni invite au deuxième. Le nom est obligatoire à l'enregistrement (1 à 80 caractères, `validateSessionName`), inchangé.

## Réalisé

- **Domaine** `src/domain/sessions/sessionNaming.ts` (nouveau) : `initialSessionName(formatName)` (état 1) ; `suggestedSessionNameAfter(previous, next, current)` — seul un **ajout** d'Exercices recalcule : premier Exercice → son nom (nom du Mouvement, sans suffixe de niveau) ; deuxième ou plus → nom vide (invite) ; retraits et autres changements → nom conservé ; `sessionNamePromptShown` (deux Exercices ou plus).
- **Brouillon** `SessionDraftProvider.tsx` : en création, le nom reste suggéré tant que l'utilisateur ne l'a pas saisi ; toute saisie le rend personnalisé (jamais remplacé) ; une nouvelle création repart d'un nom suggéré ; une Séance modifiée garde son nom (aucun recalcul).
- **Écran** `CompositionContextHeader.tsx` : dès deux Exercices, le champ vide montre l'invite grise « Entrer un nom de séance » (`colors.textSecondary`) ; sinon le libellé historique « Nom de la séance ». Le champ est toujours modifiable.
- `fr.ts` : `composition.namePrompt`.

**État 1 (Format)** : aucun parcours n'ouvre encore la Composition depuis un Format (C.2 « sélection du modèle », C.4 « composition préremplie ») ; `initialSessionName` est prêt pour ces stories. Le Format reste affiché séparément sur la carte (`SessionCard`, inchangé).

**Point signalé par l'epics** (plusieurs éléments formatés, ou ouverture préremplie de plusieurs Exercices) : ARB-14/ARB-15 suffisent — la suggestion initiale est le nom du Format choisi ; une ouverture préremplie de plusieurs Exercices n'est pas un « ajout » et garde cette suggestion, modifiable. Aucune règle nouvelle ; à revoir avec C.4 si le parcours le montre insuffisant.

## Synchronisation documentaire

Classe **A** : le code rejoint ch08 « Nom de séance — trois états » et ARB-14/ARB-15 tels que précisés par Hermann et publiés dans main (`fce276fd`, déjà intégré dans `pre9-bmad/dev` par `7fc264e4`). La formulation contraire de la spec Carte et catalogue (§8, « en gris, non modifiable ») a été annotée lors de cette intégration. Aucune autre spécification modifiée.

## Tests

- `__tests__/SessionDraftProvider.b9.test.tsx` : domaine (trois états, retraits), brouillon (premier/deuxième Exercice, nom saisi jamais remplacé, nom suggéré modifié, nouvelle création, Séance modifiée).
- Non-régression : dossier `src/features/sessions`.

## Recette iPhone

Créer une Séance : premier Exercice → nom proposé ; deuxième → invite grise ; nom saisi avant ou après → conservé.

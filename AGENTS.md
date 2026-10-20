<!-- bmad:context -->
<!-- Vérifié 2026-10-16 contre 1506add6. Géré par bmad-project-context ; les modifications à l'intérieur de ce bloc sont remplacées au refresh. Conserver hors des marqueurs tout ce qui doit survivre. -->

## KODJO (Routine)

Application mobile de création et d'exécution de séances d'entraînement. Expo SDK 57, React Native 0.86, expo-router, TypeScript strict, SQLite local, aucun backend. La spécification fonctionnelle fait treize chapitres dans `docs/Specifications-fonctionnelles/`, indexés par `docs/INDEX.md`. La méthode de travail est BMad Method tel qu'installé ; `/bmad-help` indique l'étape suivante.

Aucune tranche n'est sélectionnée par défaut : le périmètre d'une mission est choisi au moment de la mission.

## Règles décidées ou appliquées par un contrôle

Chaque ligne renvoie à sa source ; aucune n'est une déduction.

- Les spécifications définissent les règles métier, les calculs et les comportements ; Figma définit le layout et le rendu seulement. Un chiffre lu dans une capture n'est jamais une règle (D-255, D-300). Inversement, ne pas inventer un composant graphique absent de Figma : le classer `NON VÉRIFIABLE` (chapitre 13).
- Implémenter un écran dans cet ordre : chapitre 07 (décisions validées, priorité aux supersédantes) → 04, 09, 10 (modèle, données, règles métier) → 11 (API) → 12 (architecture) → 06 (navigation, captures) → 13 (contrat d'écran) → Figma en dernier, visuel uniquement (chapitre 13 §2).
- Lorsqu'une primitive native iOS ou Android existe pour l'interaction demandée, l'utiliser plutôt qu'une réimplémentation React Native, un assemblage de `ScrollView` ou une imitation graphique. Si le rendu natif demande une adaptation de conteneur, de largeur ou d'alignement, corriger l'intégration autour de la primitive sans remplacer son mécanisme d'interaction.
- Ne pas remplacer un composant ou une primitive déjà acceptés par une réimplémentation. Une difficulté de style, une absence de couverture de test ou l'impossibilité d'obtenir soi-même une capture sur appareil ne justifient jamais un remplacement.
- Une suite de tests verte ne vaut jamais, à elle seule, preuve visuelle ou tactile sur appareil réel. Ne pas déclarer une conformité visuelle à partir de tests fonctionnels : la validation visuelle appartient à Hermann.
- Les termes obsolètes ou interdits sont listés au chapitre 01 §8. Deux portent à conséquence dans le code : le terme métier `Set` est proscrit de l'interface, des spécifications actives, du modèle de données, des API et du code (D-077) — la structure JavaScript `Set` n'est pas concernée ; et « Activité », remplacé par « Exercice » en interface, laisse les identifiants `ActivityDefinition` et `ACTIVITY` inchangés.
- Les identifiants techniques historiques ne se renomment pas lors d'un changement de terminologie, jusqu'à une refactorisation explicitement planifiée (chapitre 12, D-201, D-202, D-207).
- Les noms de code sont en anglais et rattachables au glossaire français (D-035).
- Tout accès à la persistance passe par les repositories ; aucun ORM (chapitre 12, D-043).
- Les textes d'interface sont centralisés dans un lexique de clés (RM-092) ; le MVP est en français sans sélecteur de langue (RM-091).
- Ne jamais modifier `src/infrastructure/database/migrations/migration001.ts` : c'est le schéma initial, déjà appliqué sur les installations existantes. Un changement de schéma passe par une nouvelle migration numérotée, à la suite des dix présentes (001 à 010 au 20/10/2026).
- Les valeurs de `src/shared/ui/tokens.ts` sont verrouillées par `tokensSpecification.test.ts` contre le registre du chapitre 12 : en changer une casse un test par conception.

## Où sont les choses

- Décisions `D-xxx` : chapitre 07. Règles métier transverses `RM-xxx` : chapitre 10. Contrats d'écran : chapitre 13. Glossaire : chapitre 01.
- `docs/INDEX.md` n'indexe que les treize chapitres. Pour les autres fichiers de `docs/` (familles `DSF-`, `MATRICE-`, `RAPPORT-`, `VERIFICATION-`, `SOURCE-`, `CORPUS-`), la fraîcheur se lit dans les premières lignes du fichier lui-même — aucun index ne la donne.
- Interface base de données et repositories : `src/infrastructure/database/`. Textes d'interface : `src/shared/i18n/` via `strings`. Jetons de design : `src/shared/ui/tokens.ts`.
- Chaque répertoire de `src/` porte un `README.md` maintenu, qui fait référence pour sa tranche.
- Figma, page « Prototype MVP » : https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=510-101
- Le protocole d'orchestration VNext est conservé comme référence inactive dans ce clone : `.github/AI_ORCHESTRATION.md`, `.github/AI_ORCHESTRATION_CONTINUITY.md`, `.github/orchestration/`, `scripts/kodjo/`, `tests/kodjo/`. Ces fichiers ne sont pas chargés et ne s'appliquent pas ici. Ne pas les modifier depuis ce clone.

## Exécuter et vérifier

- Après `npm ci`, les trois contrôles avant de considérer un changement terminé : `npm test`, `npx tsc --noEmit`, `npm run lint`.
- `npx tsc --noEmit` n'a aucun script npm et n'est couvert par aucun test. Ne pas le sauter : `tsconfig.json` est en `strict`, et c'est le seul contrôle de types.
- Aucune CI ne couvre une modification limitée à `src/` ou `app/` dans ce clone. Les trois contrôles locaux sont le filet.
- `npx tsc --noEmit` n'est pas limité à `src/` : il balaie aussi un fichier `.repro.tsx` sous `docs/preparation/`. Une édition dans `docs/` peut casser le typecheck.
- Node 24 est la version utilisée ; aucun `.nvmrc` ni champ `engines` ne la déclare dans le dépôt.
- Ne pas lancer `start-kodjo.ps1` : il bascule de branche et tire avant de démarrer Expo. Utiliser `npx expo start`.

## Conventions observées dans le code

Relevés d'état, non des règles validées. Les suivre par défaut pour rester homogène ; un écart n'est pas une infraction.

- `app/` ne contient que des coquilles de routes courtes vers `src/features/` ; `src/domain/` n'importe rien hors de lui-même ; `src/features/sessions/SessionServiceProvider.tsx` est le seul fichier de feature à importer `expo-sqlite`.
- Les imports passent par l'alias `@/` et par le module direct plutôt que par les barils de tranche.
- Les cas métier attendus sont retournés comme unions discriminées plutôt que levés ; seule une entrée invalide lève (`src/domain/sessions/SessionRepository.ts:8-16`).
- Styles par `StyleSheet.create`, sans bibliothèque de style. Pas de gestionnaire d'état : des contextes écrits à la main, le fichier `*Context.tsx` séparé de son `*Provider.tsx` et importable sans module natif.
- Tests dans `__tests__/` à côté de la source, `*.integration.test.tsx` pour les flux multi-écrans, et `{ describe, expect, it, jest }` importés explicitement depuis `@jest/globals`.
- Commentaires et blocs JSDoc en français, denses, citant les identifiants de décision.

## Pièges connus

- Ne jamais passer les `children` de l'application à `SQLiteProvider` : son comparateur `React.memo` ignore `children`, qui serait silencieusement avalé — écran blanc sans erreur. N'y envelopper qu'un composant interne stable (`SessionServiceProvider.tsx:31-49` ; régression couverte par `SessionServiceProvider.test.tsx:36-47`).
- Le checkout Windows produit des CRLF : tout découpage sur LF ou comparaison de fin de ligne doit retirer le CR. Cause de corrections répétées sur plusieurs mois.
- Une duplication et un paramètre inutilisé sont volontaires, chacun documenté dans son propre fichier : le `PickerToolbar` de `NumberWheelPicker.tsx:48-57`, non importé de `DurationWheelPicker.tsx` ; et le second paramètre de `SessionService.ts:56-60`, conservé en type et en position. Lire le commentaire avant d'y toucher.
- `src/infrastructure/database/migrations/` importe `BODY_ZONES` depuis `src/features/reference-data/` : inversion assumée, les migrations s'en servent pour amorcer.
- Les tests `DurationWheelPicker.test.tsx:371` et `NumberWheelPicker.test.tsx:260` assertent zéro `ScrollView` sur iOS : ce sont les garde-fous qui empêchent la substitution silencieuse de la primitive native. Ne pas les affaiblir.

<!-- /bmad:context -->

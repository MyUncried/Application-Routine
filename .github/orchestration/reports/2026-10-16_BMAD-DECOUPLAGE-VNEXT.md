# Mission BMAD-DECOUPLAGE-VNEXT — rendre l'environnement BMAD indépendant de VNext

## Identifiant et objectif

- **Identifiant** : `BMAD-DECOUPLAGE-VNEXT-20261016`
- **Type** : modification des instructions locales de ce clone
- **Objectif** : retirer du chargement automatique de ce clone les obligations propres à l'orchestration VNext, afin d'utiliser BMad Method tel qu'installé, sans raccordement ni protocole hybride. Conserver intégralement les exigences produit et les contrôles de qualité.
- **Autorisation** : instruction Hermann du 2026-10-16 autorisant explicitement la modification de `CLAUDE.md` et `AGENTS.md`, et remplaçant la consigne antérieure de conservation intégrale.

Ce rapport est produit sous l'obligation de rapport qui était encore active au démarrage de la mission. C'est cette même obligation que la mission retire du contexte actif ; elle ne s'appliquera donc plus aux missions suivantes menées dans ce clone.

## Branche et commit de départ

- Branche : `bmad/pre5-preparation`
- HEAD de départ : `1506add6d83a97bcb388436bfb72062cf29f00a5`

## Périmètre demandé

Examiner les instructions réellement chargées, séparer les exigences KODJO de l'orchestration VNext, retirer les secondes du chargement automatique dans ce clone seulement, conserver les fichiers du protocole comme références inactives, adapter `CLAUDE.md` et `AGENTS.md`, rendre le choix de tranche indépendant de BMAD, et signaler toute dépendance extérieure au clone sans la modifier.

## Périmètre réellement traité

Identique au périmètre demandé. Aucun développement produit, aucun cadrage fonctionnel, aucun push, aucun workflow, aucune publication EAS, aucune modification Figma, aucune intervention sur PRE-4 ni sur l'environnement VNext.

## Constats — ce qui était effectivement chargé

| Source | Nature | Décision |
| --- | --- | --- |
| `CLAUDE.md` (81 l.) | 3 imports + 2 sections VNext | Réécrit |
| `@docs/AGENTS.md` (3 l.) | Produit / technique : Expo 57, docs versionnées | Conservé et toujours importé |
| `@.github/AI_ORCHESTRATION.md` (502 l.) | Orchestration VNext, avec deux sections mixtes produit | Import retiré ; substance produit reprise dans `AGENTS.md` |
| `@.github/AI_ORCHESTRATION_CONTINUITY.md` | Orchestration VNext pure (reprise, arbitrage, checkpoints, réveil Work) | Import retiré |
| `.claude/settings.json` | `enabledPlugins: expo` uniquement | Inchangé — aucune dépendance VNext |
| Hooks projet | Aucun (`settings.local.json` absent, aucun `"hooks"` déclaré) | Sans objet |
| `~/.claude/CLAUDE.md` | Absent | Sans objet |

Aucun hook ni réglage de projet n'imposait VNext : la dépendance passait uniquement par les deux imports de `CLAUDE.md` et par ses deux sections.

## Modifications réalisées

### 1. `CLAUDE.md` — réécrit

Retirés du chargement automatique :

- l'import `@.github/AI_ORCHESTRATION.md` ;
- l'import `@.github/AI_ORCHESTRATION_CONTINUITY.md` ;
- la section « Livraison documentaire obligatoire de chaque mission » (lignes 5-67 de la version `1506add6`) ;
- la section « Diagnostic historique obligatoire de VNext » (lignes 69-81).

Conservé : l'import `@docs/AGENTS.md`, qui est une exigence technique produit sans lien avec VNext.

Ajouté : la méthode de travail (BMad tel qu'installé, `/bmad-help`), le renvoi vers `AGENTS.md`, la neutralité de tranche, et l'inventaire des références VNext devenues inactives.

### 2. `AGENTS.md` — créé

Bloc géré `bmad:context`, portant l'orientation, les règles décidées avec leur source, les pointeurs documentaires, les commandes de vérification, les conventions observées et les pièges connus. Les conventions déduites du code sont étiquetées comme observations et formulées au descriptif, non comme interdictions.

### 3. `.github/orchestration/archive/CLAUDE_VNEXT_INSTRUCTIONS_2026-10-16.md` — créé

Copie verbatim de `CLAUDE.md` au commit `1506add6`, en référence inactive. Aucune instruction n'est perdue : les instructions utilisateur des 6 et 7 octobre 2026 y restent intégralement lisibles.

## Instructions VNext désactivées dans ce clone

| Règle retirée du contexte actif | Justification du retrait |
| --- | --- |
| Rapport de mission Markdown obligatoire à chaque mission, avec chemin, hash, état Git et résultats de tests comme condition de clôture | Mécanisme de livraison VNext. BMad produit ses propres artefacts dans `_bmad-output/` selon ses skills ; superposer les deux crée le protocole hybride explicitement exclu. |
| Clause d'exception littérale `EXCEPTION EXPRESSE — AUCUN RAPPORT DE MISSION` | Accessoire de la règle ci-dessus. |
| Réinterprétation de « ne modifier aucun fichier » en « aucun fichier applicatif » | Accessoire de la règle ci-dessus. |
| Parcours de test VNext, qualifications jetables, `FIGMA_INITIAL`, `DIRECT_REAL_USER_REQUEST`, `PREPARE_REVISION` | Orchestration VNext. Sans objet hors de ses parcours de test. |
| Diagnostic historique obligatoire avant tout correctif (dernier succès comparable, premier échec conservé, classement démontré/plausible/indéterminé) | Procédure de diagnostic VNext, liée à ses runs et à ses preuves conservées. |
| `PLAN_APPROVED`, machine à états, barrières d'arrêt, `CLARIFICATION_REQUIRED`, `WORKTREE_LOCKED`, `ORCHESTRATION_FAILURE`, `ARBITRAGE`, `USER_VALIDATION` | Orchestration VNext : suppose un orchestrateur ChatGPT distinct et un transport GitHub. |
| Désignation d'écrivain, verrou `ai-orchestration-writer.lock`, modes `LOCAL`/`CLOUD` | Idem. |
| `CHANGE_REQUEST_REQUIRED`, `SCOPE_EXPANSION_REQUIRED`, `NATIVE_PRIMITIVE_EXCEPTION_REQUIRED` | Jetons de barrière VNext. **La substance produit de ces règles est conservée** dans `AGENTS.md` — voir section suivante. |
| Contrats et bootstraps de tranche, file lean, runner, routeur de commentaires, checkpoints, reprise événementielle | Orchestration VNext. |
| Allowlist de portée des tranches, `check-scope.js`, politique d'écriture distante au blob épinglé, projection `lean-request.schema.json` | Contrôles de l'orchestration VNext, non du produit. |
| Branche de bloc `feat/creation-seance-catalogue` pour tout `T01-Sxx` | Règle VNext, par ailleurs contredite par trois schémas de branche en usage. Non reportée : la branche est un choix de mission. |

## Exigences produit et contrôles conservés

Repris explicitement dans `AGENTS.md`, avec leur source :

| Exigence conservée | Origine |
| --- | --- |
| Spécifications normatives, Figma limité au layout ; un chiffre de capture n'est pas une règle | D-255, D-300, chapitre 13 |
| Ordre de lecture pour implémenter un écran | Chapitre 13 §2 |
| Priorité aux primitives natives de l'OS ; corriger l'intégration autour, pas le mécanisme d'interaction | `AI_ORCHESTRATION.md:346-358`, substance reprise sans le jeton de barrière |
| Ne pas remplacer un composant ou une primitive déjà acceptés ; une difficulté de style, un manque de couverture ou l'impossibilité d'obtenir une capture ne justifient rien | `AI_ORCHESTRATION.md:337-338, 354` |
| Une suite de tests verte ne vaut jamais preuve visuelle ou tactile sur appareil réel ; la validation visuelle appartient à Hermann | `AI_ORCHESTRATION.md:341`, `CLAUDE.md:79` (version archivée) |
| Termes obsolètes et interdits ; `Set` proscrit comme terme métier | Chapitre 01 §8, D-077 |
| Identifiants techniques historiques non renommés | Chapitre 12, D-201, D-202, D-207 |
| Noms de code en anglais rattachés au glossaire français | D-035 |
| Accès à la persistance par repositories ; aucun ORM | Chapitre 12, D-043 |
| Textes d'interface centralisés ; MVP français sans sélecteur | RM-091, RM-092 |
| `migration001.ts` immuable | Schéma initial déjà appliqué ; resourcé sur la raison produit et non plus sur la CI VNext |
| Jetons de design verrouillés par test contre le registre du chapitre 12 | `tokensSpecification.test.ts` |
| Trois contrôles avant de considérer un changement terminé : `npm test`, `npx tsc --noEmit`, `npm run lint` | `package.json`, `tsconfig.json` |
| Garde-fous anti-substitution de primitive native (zéro `ScrollView` sur iOS) | `DurationWheelPicker.test.tsx:371`, `NumberWheelPicker.test.tsx:260` |
| Piège `SQLiteProvider` / `children` | `SessionServiceProvider.tsx:31-49`, régression couverte |
| Piège CRLF au checkout Windows | Corrections répétées sur plusieurs mois |

Aucun contrôle de qualité produit n'a été supprimé. Le quatrième contrôle du quatuor VNext, `check-scope.js`, est le seul retiré : il vérifie une allowlist de portée de tranche, pas une propriété du produit.

## Dépendances restantes

**Hors du clone, non modifiée comme demandé.** `C:\Users\hadjo\.claude\settings.json` contient :

- `permissions.additionalDirectories` : `C:\Dev\Application-routine-pre2-plan\.github\workflows` et `C:\Dev\Application-routine-pre2-plan\scripts\kodjo`. Toute session Claude Code de cet utilisateur, y compris dans ce clone, reçoit donc l'accès en lecture à ces deux répertoires VNext d'un autre clone.
- `permissions.allow` : plusieurs entrées visant `scripts/kodjo/validate-workflows.js`, `tests/kodjo/*.pilot.js` et `kodjo-v2-slice-plan-review.yml`.

Ce sont des autorisations, pas des instructions : elles n'imposent aucune obligation VNext et ne chargent aucun contexte. Mais elles maintiennent une adjacence avec l'environnement VNext d'un autre clone. Les neutraliser relève de la configuration utilisateur, hors du périmètre autorisé.

**Dans le clone, assumée.** Les fichiers du protocole restent présents (`.github/AI_ORCHESTRATION*.md`, `.github/orchestration/`, `scripts/kodjo/`, `tests/kodjo/`). C'est le choix demandé : références inactives, non supprimées. Ils ne sont plus chargés.

## Hypothèses non démontrées

- **H1** : Claude Code charge le `AGENTS.md` de la racine sans import explicite depuis `CLAUDE.md`. Je n'ai pas ajouté `@AGENTS.md` pour éviter un double chargement du même bloc. À confirmer par la vérification en session neuve décrite ci-dessous ; si le bloc n'apparaît pas, ajouter l'import.
- **H2** : aucun autre harnais que Claude Code n'est utilisé dans ce clone. Non vérifié. Un harnais qui ne lirait ni `AGENTS.md` ni `CLAUDE.md` ne recevrait aucun contexte.
- **H3** : contradiction documentaire relevée et non tranchée — le chapitre 01 §8 donne `Circuit` comme remplaçant de `Set` (avec `Tour` pour une répétition du Circuit), tandis que D-077 énonce que `Tour` remplace complètement `Set`. `AGENTS.md` cite la proscription sans désigner le remplaçant. À arbitrer hors de cette mission.

## Preuves et tests

Aucun test logiciel n'était applicable : la mission ne touche aucun fichier applicatif. `node_modules/` est par ailleurs absent de ce worktree, donc `npm test`, `npx tsc --noEmit` et `npm run lint` échoueraient au lancement avant `npm ci`.

Vérifications exécutées :

| Vérification | Résultat |
| --- | --- |
| `cat .claude/settings.json` | `enabledPlugins: expo` uniquement |
| `ls .claude/settings.local.json` | absent |
| `grep -rln '"hooks"' .claude _bmad` | aucun résultat |
| `ls ~/.claude/CLAUDE.md` | absent |
| `grep -riE "vnext\|kodjo" ~/.claude/settings.json` | entrées de permissions uniquement (cf. dépendances restantes) |
| `grep -rnE "\bSet\b" src app` filtré des usages JavaScript | 0 occurrence du terme métier |
| `sed -n '1,20p' migration001.ts` | schéma initial (`CREATE TABLE users`, `sessions`) ; 9 migrations présentes |
| `git diff --stat` après écriture | 3 fichiers, cf. section suivante |

## Fichiers modifiés

- `CLAUDE.md` — réécrit
- `AGENTS.md` — créé
- `.github/orchestration/archive/CLAUDE_VNEXT_INSTRUCTIONS_2026-10-16.md` — créé
- `.github/orchestration/reports/2026-10-16_BMAD-DECOUPLAGE-VNEXT.md` — ce rapport

Aucun fichier applicatif, aucun workflow, aucun script, aucun skill BMad modifié.

## Éléments non corrigés ou hors périmètre

- `~/.claude/settings.json` : dépendance extérieure signalée, non modifiée.
- `_bmad/` et `.claude/skills/` restent non suivis par Git. Décision de versionnement non prise ; hors périmètre.
- Règle de branche contradictoire dans `AI_ORCHESTRATION.md:459` : non corrigée, le fichier étant devenu référence inactive.
- Contradiction `Circuit` / `Tour` sur le remplacement de `Set` : consignée en H3, non tranchée.

## Vérifications restant à effectuer sur appareil réel

Aucune. La mission ne modifie ni le code, ni le rendu, ni le comportement sur appareil.

## Vérifier en session neuve que VNext n'est plus chargé

La session courante a chargé les anciennes instructions à son démarrage ; elles y restent présentes. Les modifications ci-dessus ne les effacent pas de cette session.

Pour contrôler, ouvrir une session neuve dans ce clone :

1. `cd C:\Dev\KODJO-BMAD-PRE5`
2. `claude`
3. Demander : « Liste les fichiers d'instructions que tu as chargés et cite leurs titres de section. »

Attendu : `CLAUDE.md`, `docs/AGENTS.md` et `AGENTS.md` ; aucune mention de `AI_ORCHESTRATION.md`, `AI_ORCHESTRATION_CONTINUITY.md`, de « Livraison documentaire obligatoire » ni de « Diagnostic historique obligatoire de VNext ».

Contrôle complémentaire : demander « Dois-tu produire un rapport de mission committé pour une simple question ? ». La réponse attendue est non.

Si le bloc `bmad:context` de `AGENTS.md` n'apparaît pas dans les instructions chargées, H1 est fausse : ajouter `@AGENTS.md` en tête de `CLAUDE.md`.

## Commit final

Voir la section « État Git » ; le hash est communiqué dans la réponse de clôture.

## État Git

- Branche : `bmad/pre5-preparation`
- HEAD de départ : `1506add6d83a97bcb388436bfb72062cf29f00a5`
- Non suivis conservés tels quels : `.claude/skills/`, `_bmad/`
- Aucun push.

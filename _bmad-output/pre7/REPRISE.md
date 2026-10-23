# PRE-7 — Point de reprise (24/10/2026)

- **Clone** : `C:\Dev\KODJO-BMAD-PRE7` (clone de `MyUncried/Application-Routine`), BMad 6.12.4 local (`_bmad/`, `.claude/skills/bmad-*`, exclus par `.git/info/exclude`), `node_modules` installé (`npm ci`).
- **Branche** : `pre7-bmad/dev`, créée depuis `main` @ `bcd84481` (fusion de la PR #393, PRE-6). Aucun push ; `main` non modifié.
- **Plan approuvé** : `_bmad-output/pre7/planning-artifacts/epics.md` (6 epics, 13 stories ; précisions de Hermann du 24/10 intégrées en A1.3 et A2.2). Suivi : `_bmad-output/pre7/implementation-artifacts/sprint-status.yaml`.

## Terminé

1. Clone, branche, BMad, `CLAUDE.md` propre au clone PRE-7 (exclu de la livraison avec `AGENTS.md`).
2. **Epic 0 / story 0.1** (commit `4cecf382`) : D-440 et MFN-12 assouplies (Profil et Catégories conservés, Exercices et Séances réinitialisés une seule fois par la migration 012) ; **D-445** (finalisation de l'éditeur, B1 à B10) avec propagation dans ch01, 04, 06, 07, 08, 10, 12, 13 et `PRODUCT.md`. Spec : `implementation-artifacts/spec-0-1-decisions-et-reconciliation-documentaire.md`.

## Points ouverts (sans blocage)

- **Zones corporelles personnalisées** : l'assouplissement de D-440 nomme le Profil et les Catégories ; proposition de conserver aussi le référentiel des Zones modifiable (ch12, vers l. 1559). À confirmer par Hermann **avant A1.2**.
- B9 : la règle de D-434 « flèches seules si la largeur manque » reste applicable.

## Prochaine étape

Story **B.1 — Harmonisation visuelle de la Feuille des paramètres** (B3, B4, B6, B7), avec en parallèle possible **A1.1 — Domaine Mouvement et paramètres v4** (domaine pur). Méthode par story : spec dans `implementation-artifacts/`, implémentation, trois revues (aveugle, cas limites, lacunes de vérification), triage, `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, commit local, statut `review`. Recette iPhone JB après B.3 ; JA1 (prévenir Hermann avant le chargement de la migration 012) ; JA à la fin.

Serveur Expo : aucun lancé depuis ce clone (celui du port 8081 tourne depuis le clone PRE-6). Lancer : `APP_VARIANT=bmad npx expo start --dev-client --tunnel --scheme routine-bmad --port 8081` après avoir arrêté l'autre.

# 2026-11-23 — Gestion des langues : état des lieux de ce qui est défini

## Identification

- **Mission** : LANGUES-ETAT-DES-LIEUX — ouvrir la conversation sur la gestion des langues en recensant ce qui est déjà défini (documentation et code).
- **Type** : investigation documentaire, sans correction.
- **Branche** : `claude/exciting-lovelace-iyn2wf`
- **Commit de départ** : `fe7d71d` (Merge pull request #447)

## Périmètre

- **Demandé** : « Vérifie ce qui a été défini à ce jour » sur la gestion des langues.
- **Traité** : spécifications fonctionnelles (chapitres 01 à 13 et annexes), `docs/*.md` de premier niveau (DSF, KODJO-*), format catalogue / Bibliothèques, code `src/` (i18n, voix). Non lus : `docs/preparation/**` (copies historiques des mêmes chapitres), rapports d'orchestration.

## Constats — ce qui est décidé

### Règle produit (MVP)

| Référence | Contenu |
|---|---|
| D-034 (ch. 07) | MVP monolingue français, **aucun sélecteur de langue**. Textes externalisés dans un catalogue de ressources. L'évolution multilingue pourra gérer **séparément la langue de l'interface et celle de la synthèse vocale**. |
| D-081 (ch. 07) | Tous les textes utilisateur passent par des clés de traduction centralisées : pluriels, variables, formats locaux, notifications, libellés d'accessibilité. |
| D-317 (ch. 07) | Dette documentée : le générateur de phrases est francophone ; une extension multilingue exige des grammaires / règles de pluriel et de genre par locale. « Réécriture des assemblages français à planifier avant i18n ». |
| RM-091 / RM-092 (ch. 10) | Français uniquement, aucun sélecteur ; lexique centralisé à clés, l'ajout d'une langue ne doit pas exiger de modifier chaque écran. |
| ch. 10, l. 2291-2292 | Voix = toujours celle du système ; aucun choix de voix au MVP ; langue de synthèse sélectionnable lors de l'évolution multilingue. |
| ch. 10, l. 751 / 769 | Séparateur décimal de saisie et d'affichage des charges **suit la langue de l'interface**. |
| B-066 (ch. 02) | Besoin : lexique centralisé permettant de modifier un terme partout et d'ajouter des langues. |
| ch. 05 « Internationalisation » | Évolutions prévues : plusieurs langues d'interface, sélection de la langue d'interface, sélection de la langue des annonces vocales, **contenus traduisibles** sans refonte. |
| ch. 12 « Internationalisation » | Pas de texte en dur ; catalogue à clés stables ; dates/heures/nombres au format de la locale ; ajout d'une langue = ajout de traductions ; **aucune détection, aucun choix, aucune préférence de langue persistée** au MVP. Code nommé en anglais (D-035). |
| ch. 12 « Internationalisation — décision et dette » / ch. 11 / ch. 13 l. 1291 | Le générateur (276 gabarits v15) n'est pas traduisible par fragments : gabarits par locale avec ordre, accords, ponctuation, unités ; tests par langue ; « ne pas chiffrer comme une simple traduction de libellés ». |
| ch. 13 Profil (l. 4969, 5111, 5143) | Aucun sélecteur de langue au Profil ni dans les Préférences. |
| ch. 07, recette du 27/10 (PRE-8 B.10) | **Saisie d'alias de Mouvement reportée « à la question des langues »**. |

### Questions explicitement ouvertes

- ch. 02 §7 : « Quelles langues seront proposées après le français ? » (sans réponse).
- ch. 01 et ch. 03 : multilingue listé comme hors MVP / évolution.

## Constats — état du code

- `src/shared/i18n/resources/fr.ts` (1 991 lignes) + `src/shared/i18n/index.ts` : catalogue français unique, clés anglaises, interpolation `{n}`, singulier/pluriel par **clés séparées** (`…Singular` / `…Plural`), pas de moteur i18n (aucune dépendance i18next/intl/expo-localization dans `package.json`). Importé par 143 fichiers.
- Voix : `EXECUTION_VOICE_LANGUAGE = "fr-FR"` codé en constante (`src/infrastructure/speech/ExecutionVoice.ts:27`).
- **Textes français hors catalogue** (indicatif, recherche par motif, commentaires exclus) : notamment `features/catalogue/LibraryScreens.tsx` (~92 lignes), `features/execution/executionStrings.ts` (~54), `features/catalogue/catalogueLoadPresentation.ts` (~48), `CatalogueLoadScreen.tsx`, `domain/activities/executionPhrase.ts`, `domain/sessions/formats/registry.ts`, `libraryPresentation.ts`… Écart partiel à RM-092 / D-081, **non audité ligne à ligne**.
- Contenus : le format catalogue de Mouvements v1/v2 (`docs/KODJO-Format-catalogue-mouvements-v1.md`) et les Bibliothèques ne portent **aucun champ de langue** ; nom, alias, étapes sont monolingues.

## Ce qui n'est pas défini (à arbitrer dans cette conversation)

1. Langues cibles et ordre de priorité.
2. Choix de la langue d'interface : langue du système, sélecteur dans l'application, ou les deux (et comportement si la langue système n'est pas supportée).
3. Langue de la voix : liée à l'interface ou indépendante (D-034 prévoit la séparation, sans la trancher).
4. Langue des **contenus** : Mouvements / Bibliothèques KODJO traduits par locale ? Contenus créés par l'utilisateur jamais traduits ? Champ de langue dans le format catalogue ?
5. Alias de Mouvement (reportés à cette question) : alias = synonymes ou noms dans d'autres langues ?
6. Unités et formats (kg / lb, format de date, premier jour de semaine du Calendrier).
7. Générateur de phrases : stratégie de gabarits par locale (D-317).
8. Repli en cas de clé manquante.

## Preuves et tests

Commandes de recherche (`grep`) sur `docs/Specifications-fonctionnelles`, `docs/*.md`, `src/`, `package.json`. **Aucun test applicable** (investigation documentaire).

## Hypothèses non démontrées

- Le décompte des textes en dur est approximatif (motif sur caractères accentués) ; certains peuvent être des textes de diagnostic ou de développement.

## Modifications réalisées

- Création de ce rapport uniquement. Aucun fichier applicatif ni normatif modifié. Classe synchronisation code/doc : sans objet (aucun comportement modifié).

## Hors périmètre / vérifications sur appareil

- Aucune vérification sur appareil nécessaire.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-23_LANGUES-ETAT-DES-LIEUX.md` (création)

## Commit final et état Git

Voir le commit qui contient ce rapport sur `claude/exciting-lovelace-iyn2wf`.

# Prompt — section « Langue et unités » de Profil › Préférences

À coller dans une session Claude Code ouverte sur le dépôt `MyUncried/Application-Routine`, à partir de `main`.

---

Chantier « Gestion des langues ». Implémente la section **« Langue et unités »** de **Profil › Préférences**, selon la décision **D-569** (registre ch. 07) et la maquette Figma :

- **Figma — Profil — Préférences (section « Langue et unités » en tête)** : https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-684

Sources à lire d'abord :
- `docs/preparation/langues/SUIVI.md` (état du chantier) ;
- registre ch. 07 : « Gestion des langues — décisions de Hermann du 23/11/2026 » et **D-569** (D-569 prime sur l'emplacement « Profil › Compte » de la section du 23/11, annotée comme remplacée) ;
- `docs/preparation/langues/J1-PLAN-KODJO-EN-ANGLAIS-2026-11-23.md` (élément 10) et `PLAN-GESTION-DES-LANGUES-2026-11-23.md` (§ 2.2, étape J3) ;
- `src/shared/i18n/` (catalogue par langue, `locale.ts`, `format.ts`, garde-fous `hardcodedUserText.test.ts` et `translationParity.test.ts`).

**Partie 1 — Langue (étape J1, à faire maintenant)**
- Ligne « Langue — <langue en cours, écrite dans sa propre langue : Français, English> › » au format des cartes existantes de Préférences.
- Toucher la ligne ouvre le réglage iOS de langue de l'application (`Linking.openSettings()`). KODJO ne stocke aucune préférence de langue (règle 2).
- Textes dans le catalogue, en français et en anglais (glossaire `docs/preparation/langues/GLOSSAIRE-EN-2026-11-23.md`).

**Partie 2 — Unité de charge (étape J3, plan d'abord)**
- Sélecteur segmenté **kg · lb**, avec le **contrôle segmenté natif** (la maquette réduit celui du design system à 96 × 32 ; protocole « Priorité aux primitives natives »).
- Règles (ch. 07, règle 7) :
  - une seule unité pour tout le profil ;
  - charges enregistrées et affichées dans cette unité ;
  - **conversion des valeurs seulement quand l'unité change** ;
  - valeur par défaut selon la région du téléphone (`measurementSystem` d'`expo-localization`).
- Avant tout code de la partie 2, propose un plan couvrant :
  - la règle d'arrondi et la non-dérive (aller-retour kg → lb → kg) ;
  - le stockage ;
  - les écrans qui affichent ou saisissent une charge (Paramètres d'exécution, tableau des séries variables, carte d'exercice, Exécution, Formats) ;
  - la migration.
  Le plan est à valider par Hermann.

Contraintes : aucun autre écran ne change de forme (D-569) ; alias invisibles (D-569) ; tests complets verts ; rapport de mission dans `.github/orchestration/reports/` ; `SUIVI.md` mis à jour.

---

# Epic A4 Context: Catalogue et Composition

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Terminer l'axe MFN côté Catalogue et Composition. Le Catalogue des Exercices est regroupé par geste, et chaque définition y reste distinguée par le résumé de ses paramètres. La sélection multiple de la Composition désigne toujours une définition précise. La duplication en Composition conserve la filiation. L'epic se termine par le jalon de recette iPhone JA, qui clôt l'axe A. Le dossier de planification ne contient que `epics.md`. Les règles qui font autorité sont D-437, D-439, D-124 et D-196 (ch07), MFN-03, MFN-09 et MFN-10 (ch10), CE-T03-02 et CE-T03-07 (ch13) (voir Sources).

## Stories

- Story A4.1 : Catalogue par geste et sélection

## Requirements & Constraints

- **Catalogue regroupé (CE-T03-02)** :
  - Les définitions sont regroupées par geste, mais chacune garde son identité et le résumé calculé de ses paramètres. Il n'y a pas d'alias et pas de Catalogue de gestes autonome.
  - Les relations entre niveaux se parcourent depuis la fiche, séparément de ce regroupement.
  - Le tri par défaut, les filtres, les archives et la gouttière restent ceux du contrat existant. La règle D-221 reste en vigueur : pas de recherche dans le Catalogue.
- **Ligne regroupée** : elle n'est ni exécutable ni insérable sans désigner une définition précise. Aucun jeu de paramètres n'est choisi silencieusement par défaut.
- **Sélection multiple (CE-T03-07)** :
  - L'utilisateur choisit des définitions précises. Les copies sont insérées dans l'ordre de la liste affichée, pas dans l'ordre des touchers.
  - Fermer ou Annuler ne modifie rien.
  - Chaque copie reçoit le contenu résolu (libellés de phases compris) et un `sourceMovementId` non nul. Elle ne relit jamais la source par la suite.
  - La modale n'expose ni filtre ni recherche supplémentaire.
- **Duplication en Composition (D-124)** : nouvel identifiant d'occurrence, même `sourceMovementId`, suffixe système « (copie) » au nom, ce nom restant non éditable. Le geste source et les autres Exercices ne sont pas renommés (MFN/AC32). Une insertion dans un brouillon abandonné ne marque pas le geste « déjà utilisé ».
- **Occurrence insérée** : son contenu est verrouillé et ses paramètres restent modifiables (MFN-09). Remplacer une occurrence ne réécrit pas sa filiation.
- **Duplication au Catalogue (D-196, MFN-10)** : elle crée une nouvelle définition sur le même geste, sans suffixe. Deux duplicatas identiques peuvent rester indiscernables. Les actions glissées Planifier / Dupliquer / Archiver restent hors périmètre de PRE-7, constatées non implémentées.
- **Frère incomplet** : il reste exclu du lancement, qui exige un Exercice exécutable.
- **Terminologie de l'interface** : exercice, geste, niveau, jamais « mouvement ».
- **Recette** : MFN/AC01, AC04, AC05, AC31, AC32, AC35 et AC36. **Jalon JA** final sur iPhone (360 / 402 / 440, texte agrandi). Une suite verte ne vaut pas preuve visuelle.

## Technical Decisions

- La liste regroupée vient de `ActivityDefinitionService` (A1.3). Le regroupement est une présentation, pas une nouvelle entité.
- Composants à réutiliser : `ActivityCard.tsx`, `CardTitleLine.tsx` et `formatExerciseRowSummary` pour le résumé des paramètres.
- Copie dans le brouillon par `SessionService` (A1.3) : `sourceMovementId` est porté par le brouillon et conservé à la réécriture des occurrences et aux duplications. La filiation n'est jamais utilisée pour charger un contenu affiché ou exécuté.
- Cartes de choix de la Composition : géométrie existante, sans badge de durée.
- Aucune frame Figma n'illustre le regroupement par geste. Ne pas inventer de composant graphique : réutiliser les cartes existantes, et classer `NON VÉRIFIABLE` ce qui n'est pas représenté.

## Cross-Story Dependencies

- Livrables de l'Epic A1 utilisés :
  - A1.1 : `movementId`, état exécutable ou incomplet, type d'instantané avec `sourceMovementId` ;
  - A1.2 : repositories de définitions et de séances adaptés, `activities.source_movement_id` ;
  - A1.3 : liste regroupée par geste, transport de `sourceMovementId` par le brouillon, duplication d'occurrence et de séance.
- Éléments des Epics A2 et A3 utilisés : verrouillage d'occurrence et signalement du frère incomplet (A2.1, A2.2), navigation entre niveaux depuis la fiche (A3.1).
- Ordre : A3.2 → A4.1 → JA.

## Sources

- Plan : `_bmad-output/pre7/planning-artifacts/epics.md:15` (D-196 non implémentée), `:19-31` (réutilisation), `:96-100` (Epic A4 et hors périmètre), `:108-117` (ordre).
- Décisions : `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md:9-11` (D-437), `:17-19` (D-439), `:287` (D-124), `:374` (D-196), `:432` (D-221).
- Règles : `docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md:313-343` (MFN-03), `:353` (brouillon abandonné), `:440-448` (MFN-09), `:450-456` (MFN-10), `:490-525` (MFN/AC).
- Contrats d'écran : `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md:157` (`NON VÉRIFIABLE`), `:665-697` (CE-T03-02, regroupement à `:695`), `:1369-1393` (CE-T03-07, regroupement à `:1391`), `:1521` (occurrence), `:1652` (cartes de choix).
- Relevé Figma : `docs/DSF-MOUVEMENT-FILIATION-NIVEAUX-2026-10-23.md:16`, `:64`, `:80`.
- Continuité : `_bmad-output/pre7/implementation-artifacts/epic-A1-context.md:19`, `:38-39`.

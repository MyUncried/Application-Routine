# Epic A2 Context: Éditeur d'Exercice MFN

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Rendre visible dans l'éditeur d'Exercice et dans sa Feuille des paramètres le modèle « Mouvement, filiation et niveaux » posé par l'Epic A1. L'éditeur doit distinguer le contenu partagé du geste (nom, description, médias, catégorie, zones, structure des phases) des paramètres propres à l'Exercice. Il gère trois contextes d'édition, la correction partagée avec sa question d'identité, l'étape de complétion des durées manquantes et la création d'un Exercice à partir d'un geste existant (suggestions, recherche, trois choix). Sans cet epic, les données MFN existent mais restent inaccessibles à l'utilisateur. Le dossier de planification ne contient que `epics.md`. Les règles qui font autorité sont D-437 à D-439 (ch07), MFN-02, MFN-04, MFN-06, MFN-08 et MFN-09 (ch10), CE-T03-04 et CE-UI-10 (ch13) et le relevé Figma MFN (voir Sources).

## Stories

- Story A2.1 : Feuille des paramètres MFN
- Story A2.2 : Contenu partagé et verrouillage
- Story A2.3 : Création, recherche et suggestions de gestes

## Requirements & Constraints

- **Trois contextes d'édition, toujours explicites** :
  1. Exercice existant du Catalogue : ouverture directement en édition, sans lecture seule préalable.
  2. Création sur un geste repris : le contenu est d'abord en lecture seule, avec un crayon annoncé « Modifier le geste ». Les paramètres restent modifiables. Le crayon modifie le brouillon et ne persiste rien.
  3. Occurrence de séance : nom, description, médias, catégorie, zones et structure des phases sont verrouillés, sans crayon de déverrouillage. Les paramètres restent modifiables, avec le mode verrouillé en présence de phases.
- **Exception de création locale** : un Exercice créé dans une Séance reste modifiable jusqu'au premier enregistrement de cette Séance. Ensuite, la question d'identité s'applique.
- **Feuille des paramètres** : au Catalogue, la structure des phases reste modifiable (Avec/Sans, nombre, retrait, déplacement, libellé). Dans une occurrence, elle est verrouillée, mais les durées restent modifiables. À la validation, une durée nulle ou vide reste à renseigner sans que la phase soit supprimée. L'Exercice édité ne peut pas être enregistré dans cet état. La croix de retrait est disponible dès 2 phases, et le passage de 2 à 1 phase donne Sans, avec la durée restante comme durée de série. Le nommage par défaut d'une phase ajoutée est conservé. Un Exercice frère incomplet est signalé et ne peut pas être exécuté.
- **Question d'identité conditionnelle** : elle n'apparaît que si le geste est « déjà utilisé » **et** que son nom, sa description, son média ou sa structure de phases a changé. Les paramètres, la catégorie, les zones ou l'ordre dans le groupe, modifiés seuls, ne la déclenchent jamais. Elle n'apparaît pas non plus pour une variante explicitement choisie ni pour une reprise inchangée.
  - Libellés en modification Catalogue : « Corriger cet exercice / Créer un nouvel exercice / Annuler ».
  - Libellés en création sur geste repris : « Corriger ce geste / En faire un geste distinct / Annuler ». Aucun Exercice supplémentaire n'est créé dans ce cas.
  - Annuler rend le brouillon appelant intact.
  - Au-delà d'un Exercice concerné, le dialogue affiche leur nombre, calculé et jamais copié de la maquette. Une création en cours compte dans le total.
  - Une nouvelle identité conserve l'original et propose le groupe de niveaux sans présélection.
- **Complétion des durées manquantes** : c'est une étape distincte, après une correction structurelle. Elle présente les durées manquantes de chaque Exercice concerné, sans valeur inventée. L'Exercice édité doit être complet. La complétion d'un frère peut être passée explicitement, et ce frère reste alors incomplet.
- **Création (MFN-06)** : trois choix explicites (même geste avec d'autres paramètres, variante ou niveau, geste indépendant). Rien n'est présélectionné, et aucun rattachement n'est automatique. Une suggestion peut apparaître sur un nom proche, et une recherche explicite reste accessible indépendamment de la similarité. La recherche porte sur tous les gestes, locaux compris, sans former un Catalogue de gestes. Elle reste une recherche spécialisée et ne lève pas l'exclusion de D-221. Une sélection n'écrase jamais silencieusement ce qui a déjà été saisi. Le geste repris est celui qui a réellement été choisi.
- **Création depuis le Catalogue ou depuis une Séance** : une création locale ne publie rien au Catalogue. Annuler ne laisse ni geste, ni média, ni marque « déjà utilisé ».
- **Terminologie de l'interface** : exercice, geste, niveau, jamais « mouvement » (MFN/AC37). Les textes passent par le lexique `strings`.
- **Recette** : MFN/AC09, AC10, AC15, AC23 à AC29 et AC34, plus les scénarios 1 à 4 et 6 du relevé Figma. Une suite verte ne vaut pas preuve sur appareil.

## Technical Decisions

- Les états MFN sont dérivés dans le domaine (A1.1). L'éditeur se limite au rendu, parce qu'il compte quatre parcours et de nouveaux modes.
- Écritures par les services A1.3 : création avec origine explicite, correction partagée atomique (contenu, durées par `phaseId`, frères incomplets), création locale atomique avec la Séance. Aucune synchronisation des copies.
- Composants à réutiliser :
  - dialogues : `DecisionDialog.tsx`, `TourBoundaryChoiceDialog.tsx`, `CircuitEntryConfirmModal.tsx` ;
  - feuilles basses : `CategoryPickerModal`, `BodyZonePickerModal`, `useReferenceSheet.ts` ;
  - action principale : `PrimaryActionZone.tsx`.
- La confirmation est une feuille basse (`9952:44349`). L'étape de complétion et l'état de frère incomplet n'ont pas de frame dédiée : les classer `NON VÉRIFIABLE` et ne pas inventer de composant.
- Figma définit seulement le rendu. Les noms, rangs et comptes des maquettes sont des exemples. Le câblage systématique de Terminer vers la confirmation, comme celui de la variante vers la confirmation, n'est pas conforme.

## UX & Interaction Patterns

- Rangée de classification « Zone bleue » : Catégorie, Zone, Niveau. Le crayon au trait est en bleu KODJO.
- Cibles tactiles d'au moins 44 × 44, Safe Areas, texte agrandi. La troncature visuelle des zones ne tronque pas le libellé accessible.
- États Figma :
  - suggestion : `9882:19049` ;
  - geste repris en lecture seule : `9891:39982` ;
  - contenu éditable : `9959:19518` ;
  - recherche : `9959:19623` ;
  - confirmation : `9952:44349`.

## Cross-Story Dependencies

- Livrables de l'Epic A1 utilisés :
  - A1.1 : types `Movement`, `movementId`, paramètres v4 `{phaseId, durationSeconds|null}`, état exécutable ou incomplet, validateur et brouillon (fin du nettoyage silencieux, croix à 2 phases) ;
  - A1.2 : `MovementRepository`, avec la recherche de gestes locaux, l'état « déjà utilisé » et le nombre de définitions ;
  - A1.3 : création avec origine, correction partagée, création locale avec la Séance, `sourceMovementId`.
- Ordre : A2.1 vient après A1.3 **et** après B.3, parce que les deux touchent `ExecutionParametersSheet.tsx`. Ensuite A2.1 → A2.2 → A2.3, puis l'Epic A3.

## Sources

- Plan : `_bmad-output/pre7/planning-artifacts/epics.md:19-31` (réutilisation), `:82-88` (Epic A2), `:108-117` (ordre), `:119-129` (risques).
- Décisions : `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md:9-11` (D-437), `:13-15` (D-438), `:17-21` (D-439 et complément de présentation), `:432` (D-221).
- Règles : `docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md:251` (terminologie), `:287-309` (MFN-02), `:345-353` (MFN-04), `:382-396` (MFN-06), `:408-436` (MFN-08), `:440-448` (MFN-09), `:483-528` (MFN/AC).
- Contrats d'écran : `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md:157` (`NON VÉRIFIABLE`), `:773-775`, `:791`, `:797`, `:846`, `:862-870`, `:894` (CE-T03-04), `:1030`, `:1128`, `:1163`, `:1244` (CE-UI-10), `:1521` (occurrence verrouillée).
- Navigation : `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md:135-139`, `:578-620`.
- Relevé Figma : `docs/DSF-MOUVEMENT-FILIATION-NIVEAUX-2026-10-23.md:9-16`, `:20-31`, `:39-60`, `:62-71`, `:73-82`.
- Continuité : `_bmad-output/pre7/implementation-artifacts/epic-A1-context.md:15-45`.

# Epic A1 Context: Données et domaine MFN

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Poser les fondations du modèle « Mouvement, filiation et niveaux » (MFN) : séparer le contenu partagé du geste (Mouvement) des paramètres d'exécution propres à chaque Exercice, porter la filiation non nulle des copies vers leur Mouvement, puis installer le nouveau schéma par une migration 012 exécutée une seule fois. Aujourd'hui, MFN n'existe pas dans le code. Le contenu est aplati dans `activity_definitions`, et une occurrence de séance ne garde aucun lien vers sa définition. L'epic livre le domaine pur, la persistance, les repositories et les services. Les éditeurs (A2), les niveaux en interface (A3) et le Catalogue regroupé (A4) en dépendent. Le dossier de planification ne contient que `epics.md` : les règles qui font autorité sont D-437 à D-440 (ch07), MFN-01 à MFN-13 (ch10), l'architecture cible MFN (ch12) et les passages MFN des ch09 et ch11 (voir Sources).

## Stories

- Story A1.1 : Domaine Mouvement et paramètres v4
- Story A1.2 : Schéma 012, transition et repositories
- Story A1.3 : Services et filiation

## Requirements & Constraints

- **Mouvement** : identifiant stable ; nom, description en étapes ordonnée, médias ordonnés, catégorie obligatoire, zones 1..n ; structure ordonnée des phases `(id, label)` ; compteur de phase monotone ; état durable « déjà utilisé », faux au départ ; groupe de niveaux et clé de tri facultatifs, toujours présents ensemble (au plus un groupe, aucun objet Niveau, aucun rang persisté, groupe singleton conservé).
- **ActivityDefinition** : `movementId` non nul, avec intégrité réelle ; paramètres propres ; durées associées par `phaseId`. Aucun alias, aucun contenu partagé dupliqué.
- **SessionActivity et instantané** : contenu résolu copié (avec les libellés de phases) et `sourceMovementId` non nul, immuable, sans contrainte référentielle. Ce champ n'est jamais utilisé pour charger un contenu à afficher ou à exécuter. Une filiation orpheline est conservée telle quelle. La récupération après exercice reste portée par l'occurrence.
- **Phases** : on réutilise `WorkPhase.id` (entier ≥ 1, unique dans le Mouvement, conservé au déplacement et au clonage). Les identifiants sont alloués par le compteur du Mouvement, jamais par max + 1, et un identifiant retiré n'est jamais réutilisé. L'éligibilité est inchangée : mode Durée, cible chiffrée, séries identiques, 6 phases au plus, libellés de 20 caractères, chaque phase ≥ 1 s, somme entre 1 et 3 535 s.
- **Fin du nettoyage silencieux (D-438)** : une phase à 0 s ou vide reste présente avec une durée non renseignée, et l'Exercice édité ne peut pas être enregistré. Le retrait est explicite : la croix est disponible dès 2 phases, et le passage de 2 à 1 phase donne Sans, avec la durée restante comme durée de série. Le nommage par défaut d'une phase ajoutée est conservé.
- **Exercices frères incomplets** : après une correction structurelle partagée, un frère peut être persisté avec une durée non renseignée, si l'utilisateur choisit explicitement de passer la complétion. Il reste inexécutable tant qu'il n'est pas complété. Cet état doit être porté par les types **et** par la persistance, pas seulement par le brouillon.
- **Phrase et calculs de durée** : inchangés pour une définition complète. La charge n'entre pas dans les calculs.
- **« Déjà utilisé »** : l'état s'écrit dans la transaction de succès de l'enregistrement d'une Séance (ou au démarrage direct, hors PRE-7). Il ne s'écrit jamais pour un brouillon abandonné et reste irréversible. C'est la seule métadonnée écrite sur la source, sans aucune création Catalogue (RM-021).
- **Cycle de vie** : aucun ramassage automatique d'un Mouvement enregistré. La suppression d'un Mouvement est refusée tant qu'une définition le référence, et supprimer une définition ne supprime pas son Mouvement. Une création annulée ne laisse ni Mouvement ni média orphelin.
- **Transition (D-440 assouplie, 23 et 24/10)** : la migration 012 est versionnée et s'exécute une seule fois. Elle supprime et recrée les tables d'Exercices, de médias, d'associations Exercice–zones, de Séances et d'occurrences. Les préférences du Profil, les Catégories et les Zones corporelles sont **conservées avec leurs personnalisations**. L'intégrité référentielle est préservée, et un avis est affiché via `migration_notices`. Aucune conversion ni lecture des anciens formats v2/v3 n'est faite. Aucune réinitialisation n'a lieu aux lancements suivants (MFN/AC13).
- **Jalon JA1** : Hermann est prévenu **avant** tout chargement de la version contenant 012 sur son iPhone. Une suite verte ne prouve rien sur appareil.
- **Hors périmètre** : moteur d'exécution, historique et records (MFN-11, MFN-13), actions Catalogue D-196.

## Technical Decisions

- Paramètres d'exécution **JSON v4** : couples `{phaseId, durationSeconds|null}` dans le Catalogue, sans libellé (aucune seconde source modifiable). Aucun lecteur v3 n'est conservé après 012. Ne pas supposer que les parseurs v3 transportent les nouveaux champs. Une version inconnue ne doit jamais retomber silencieusement sur une durée scalaire.
- Le domaine reste pur (A1.1) : types, validateur, brouillon et état exécutable ou incomplet dérivés dans le domaine, couverts par des tests unitaires. La suite existante sert de filet pour le passage v3 → v4.
- Ne jamais modifier `migration001.ts`. La migration 012 suit 001 à 011 dans la transaction exclusive de `migrateDatabase.ts`. Elle crée `movements`, rattache les zones et les médias au Mouvement, et ajoute `activity_definitions.movement_id` (avec intégrité) et `activities.source_movement_id` (non nul, sans clé étrangère).
- `MovementRepository` SQLite : créer, lire, rechercher (Mouvements locaux compris), marquer utilisé, compter les définitions, refuser la suppression d'un Mouvement référencé. Côté groupe : rattacher, insérer après l'origine, réordonner, retirer. Les repositories de définitions et de séances sont adaptés. Tout accès passe par les repositories, sans ORM. Les cas métier attendus sont retournés en unions discriminées.
- Test de migration sur une base de copie (patron `buildVersion10.ts`) : il prouve la conservation du Profil, des Catégories et des Zones corporelles, personnalisations comprises, et l'absence de réinitialisation au second lancement.
- Les transactions couvrent : la création locale du Mouvement avec la Séance (MFN-04), la correction partagée atomique (contenu, durées par `phaseId` et frères incomplets), et le marquage « déjà utilisé » au succès. Des tests d'échec au milieu de la transaction sont prévus.
- `SessionService` : `sourceMovementId` est porté par le brouillon, pour que la réécriture des occurrences à chaque mise à jour de Séance ne le perde pas (test dédié). Il est conservé à la duplication d'occurrence (D-124, suffixe `(copie)`, nom non éditable) et à la duplication de séance. Le type d'instantané porte déjà `sourceMovementId` pour les futurs instantanés d'exécution, sans champ de rang ni de total.
- `ActivityDefinitionService` : création avec une origine explicite (même geste, variante ou geste indépendant, sans rattachement automatique) et liste regroupée par geste. La correction transmet le nombre de définitions touchées et ne synchronise jamais les copies.
- Terminologie : « Mouvement » est un terme interne au code. L'interface dit exercice, geste ou niveau (MFN/AC37). Les identifiants `ActivityDefinition` et `ACTIVITY` restent inchangés.

## Cross-Story Dependencies

- Ordre : A1.1 → A1.2 (JA1) → A1.3, après 0.1. A1.1 peut avancer en parallèle de l'Epic B.
- A2.1 dépend de A1.3 **et** de B.3, parce qu'elle touche le même fichier `ExecutionParametersSheet.tsx`. Les Epics A2, A3 et A4 consomment ensuite ces types, repositories et services.

## Sources

- Plan : `_bmad-output/pre7/planning-artifacts/epics.md:13-17` (existant), `:33-41` (transition), `:74-80` (Epic A1), `:108-117` (ordre), `:119-129` (risques).
- Décisions : ch07 `07 – Registre des décisions de conception.md:9` (D-437), `:13` (D-438), `:17` (D-439), `:23-27` (D-440 et son annotation « Assouplie par Hermann les 23 et 24/10/2026 »).
- Règles : ch10 `10 – Processus métier et règles métier transverses.md:249-251` (section MFN), `:256` (MFN-01), `:287` (MFN-02, identité des phases vers `:305`), `:313` (MFN-03), `:345` (MFN-04), `:357` (MFN-05), `:408` (MFN-08, frères incomplets vers `:433`), `:440` (MFN-09), `:450` (MFN-10), `:464-472` (MFN-12 assouplie à `:468`), `:474` (MFN-13), `:483-526` (scénarios MFN/AC01 à AC37).
- Architecture : ch12 `12 – Architecture technique.md:237-247` (architecture cible MFN, assouplissement à `:241`).
- Données : ch09 `09 – Modèle de données fonctionnel.md:287-303` (modèle cible : table `:291-297`, phases `:299`, frères incomplets `:301`, suppression `:303`), `:305` (transition D-440), `:402` (contrat versionné).
- API : ch11 `11 – API fonctionnelles.md:97-112` (contrats MFN), `:126-137` (contrats internes des phases, D-438).
- Relevé Figma MFN : `docs/DSF-MOUVEMENT-FILIATION-NIVEAUX-2026-10-23.md:39-60` (navigation et brouillons, utile surtout pour A2), `:73-82` (recette complémentaire).

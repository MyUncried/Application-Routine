[KODJO_V2] PLAN_OUTPUT
slice_id=V2-PRE-2
bootstrap_path=.github/orchestration/v2-slices/V2-PRE-2/slice-bootstrap.json
source_head=4eff1882a65dbb2c80f302aeacd11aa26a12e67a
application_pr=303
application_head=10ac761ef453f360110bf7b668b3998487b071b3
supersedes_plan_blob_oid=ae2a7a0d30e5895b91e5782e5a85d0a5f1808e94
prior_review_blob_oid=a7fe0ec8b655ae79e4315fba8bf6548dc684c8b2
planning_contract=kodjo.plan-impact.v1
ui_planning_contract=kodjo.ui-plan-criteria.v2
published_plan_commit=6b9a36418ed409b2e970a083f52b2e521660a35a
published_plan_blob=fe46bda9f32c20a190e5a5fb6db9993defe6e27b
STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW

# V2-PRE-2 — Référentiels + Profil — Plan technique

## 0. Statut

- Plan préparé et assemblé localement, sans génération par le modèle de planification.
- **Révision du 04/10/2026** (recette iPhone de la livraison #303, `10ac761e`) : voir §0 bis. Le plan ci-dessous est le plan approuvé (revue de fermeture 5974629353) complété par cette révision ; tout élément non cité au §0 bis est inchangé.
- **Candidat corrigé** après la revue indépendante du run 37136337819 (publiée par le commentaire 5971511255 : REVISE, 13 constats dont 11 bloquants). Les 13 constats sont fermés dans ce candidat ; le registre de correction (`correction-register.md`) donne pour chacun la justification, la correction exacte et la preuve de fermeture. **Non approuvé** : une revue de fermeture limitée à ces constats doit suivre.
- Blocs machine assemblés avec les scripts V2 du dépôt (`scan-plan-impact.js`, `generate-ui-plan-contract.js decode`, `reconcile-initial-plan-prose.js`) et contrôlés par `verify-ui-plan-criteria.js`, `verify-plan-contract-consistency.js`, `verify-plan-impact.js` sur les octets exacts de ce fichier. La sortie structurée normalement produite par le modèle de planification V2 a été rédigée localement par Claude ; aucun appel à une API de modèle n'a été fait.
- Décisions de Hermann D1 à D4 du 03/10/2026 consignées dans les sources : D-256 à D-259 (PR #285, registre L390–393, chapitres 13, 09, 11, v12).
- Tranche activée : issue #288, bootstrap `eb8bdca3…`, registre (PR #289).

## 0 bis. Révision du 04/10/2026 — recette iPhone

Contexte : livraison #303 (`10ac761e`, revue d'implémentation 5976789183 APPROVE, `device_gate_required=true`), recette iPhone non validée. Registre : `.github/orchestration/v2-slices/V2-PRE-2/recette-2026-10-04.md`. Révision appliquée à la livraison existante (PR #303) : le code livré est conservé, seuls les points ci-dessous changent. Sources lues à `7a51179f` (D-265 à D-267, #304) ; les entrées produit de `source_head` (commit de `main` contenant ce plan publié) leur sont identiques octet pour octet ; les numéros de ligne du chapitre 13 sont réancrés sur cette révision.

| # | Point | Exigence | Delta d'implémentation sur #303 |
|---|---|---|---|
| D-265 | Bornes des valeurs par défaut CR initial / Fin de séance | C07 D-265 (L417) ; C13 CE-UI-07 §14 L2552, R-02 L2978 ; C08 L1083–1084 | `profileDurationBounds` : 0..60 pour `sessionInitialCountdownSecondsDefault` et `sessionFinalPhaseSecondsDefault` ; aucune réécriture ni plafonnement d'une valeur stockée > 60 (lecture, service, migration) : affichage exact, « + » inactif, « − » ramène d'abord à 60 puis pas 1 s. `migration008` inchangée (CHECK de stockage 0..3599, déjà appliquée sur les bases de recette) ; champs de la Séance en Composition inchangés (0..3599, D-089 amendée) |
| D-266 | Libellé « Compte à rebours d'un exercice » | C07 D-266 ; CE-UI-07 §5 L2514 | `fr.ts` et libellés accessibles dérivés ; fixtures de tests |
| D-267 | Séparateurs entre lignes des groupes du Profil | C07 D-267 ; CE-UI-07 §9 L2532 | Séparateur `colors.divider` entre lignes consécutives de chaque groupe, aucun après la dernière (`ProfileScreen.tsx`, `ProfileStepper.tsx` si nécessaire) |
| R1 | Profil : défilement, marge basse, accès à Modifier le profil | CE-UI-07 §7 L2522, §10 L2536 ; C08 L1077–1079 | `ScrollView` avec marge finale `navigationBarTotalHeight()` + 16 (patron `CatalogueScreen`) ; bloc Identité en tête (photo ou initiales, nom, action Modifier → `/profile-edit`), en réutilisant les aides d'initiales et de photo de `ProfileEditScreen` |
| R4 | Palette Catégorie / Étiquette bloquée | §4.10 L133 ; CE-UI-09 §10 L2808 ; CE-T03-16 §10 L1645 ; Figma 4474:7157, 4640:6308 | Palette rendue dans le flux de la carte (mode en ligne de `ColorPalette`, seuls consommateurs : les deux sélecteurs) ; carte évitant le clavier et défilante ; confirmation par Ajouter / Enregistrer ; aucune fermeture automatique imposée ; modale Zones (sans palette) : liste défilante, carte de création et de renommage évitant le clavier (CE-UI-09 L2796, L2808) |
| R5 | Pastille de Catégorie dans l'éditeur d'Exercice | C09 L926 ; CE-UI-09 §9 L2804 ; Figma 6407:9702 ; DSF L129 | Pastille colorée 26 avant le nom dans la pilule Catégorie de `ExerciseScreen` ; couleur suivie après recoloration |
| R6 | Zone créée visible après réouverture seulement | CE-UI-09 L2784, L2816, L2840 ; registre R6 | Rafraîchissement de la liste des Zones de l'éditeur et des noms de Zones de la Composition (jeton de rafraîchissement après création, renommage ou suppression dans la modale ; `useBodyZonesReferential` de `CompositionScreen` reçoit ce jeton comme `useLabelsReferential`), icônes de silhouette conservées |
| R7a | Nom de l'Étiquette absent en Composition | CE-T03-16 L1609 (Figma 4581:6404), §18 L1677 | Pilule avec pastille et nom ; sans Étiquette : icône d'étiquette au trait (Figma 2028:11204 / 4640:6308) ; couleur de présentation d'une Séance sans Étiquette inchangée (R7b, sources muettes) |
| R9 | Preuves non visibles à l'écran | T21 ; plan initial | Ajout de deux tests d'écran, sans champ : Récupération du Profil sur un Exercice local (`ExerciseScreen.test.tsx` / `CompositionExerciseFlow`), copie de la Pause entre les côtés à l'activation D→G/G→D dans l'éditeur du Catalogue (0 s sinon) |
| R10 | VoiceOver | CE-UI-07 §18 L2568 ; CE-UI-09 §10 L2808, §18 L2840 ; CE-T03-16 §18 L1677 | Ligne d'interrupteur = un seul élément accessible (rôle interrupteur, état) ; indication d'action « choisir / retirer » sur les Étiquettes ; titres de modale en en-tête ; retour explicite du focus sur l'option après fermeture du dialogue d'appui long |

Corrections après la revue indépendante du run 37198105017 (verdict REVISE, 7 constats bloquants, tous intégrés) : (1) rendu de la modale Zones, de sa carte de création et de son dialogue destructif (CE-UI-09 L2772, L2804 ; frames 4478:7209, 4683:6336, 4861:6348) ; (2) défilement, clavier, actions visibles et texte agrandi de la modale Zones (L2796, L2808) ; (3) R6 étendu à la Composition ; (4) erreurs des modales de référentiel — nom vide ou invalide, échec d'écriture, saisie et brouillon conservés, aucune modification partielle (L2812, L2836 ; CE-T03-16 L1665, L1673) ; (5) validité du nom dans l'exigence des référentiels (C09 L885, L915 ; bornes T9) ; (6) ordre d'affichage déterministe (C09 L917, L955 ; T12) ; (7) titres des trois modales exposés comme en-têtes accessibles (CE-UI-09 L2840 ; CE-T03-16 L1677).

Corrections après la revue indépendante du run 37202181321 (commentaire 5980019179, REVISE, 5 constats bloquants ; registre `revision-2026-10-04/correction-register-5980019179.md`) : (1) exigence Profil étendue à C08 L1076–1103 — quitter le Profil sans confirmation (L1103, CE-UI-07 L2556) et clés de traduction centralisées pour tous les textes et libellés d'accessibilité (Langue du MVP, L1098) ; (2) liste des Catégories défilante, nom long et texte agrandi (CE-UI-09 L2808) ; (3) chaînes de suppression partagées (§4.10 L134–L135) liées à `src/shared/i18n/resources/fr.ts` et `src/shared/i18n/index.test.ts` pour Catégorie, Zones et Étiquette ; (4) Modifier le profil défilant dans les Safe Areas, clavier et texte agrandi (CE-UI-01 L2004) ; (5) feuille d'Étiquettes limitée à la zone sûre, liste défilante, titre non tronqué, texte agrandi (CE-T03-16 L1645). Aucun autre élément du plan n'est modifié.

Hors révision : R8 (retour sans avertissement depuis l'éditeur d'Exercice du Catalogue, CE-T03-04 §12) est préexistant et non régressif, il relève de l'éditeur du Catalogue hors PRE-2 ; R7b n'est pas un défaut. Comportements réussis sur iPhone à préserver : six valeurs initiales, un seul stepper ouvert, persistance des durées et interrupteurs ; suppression avec message adapté, disparition des nouveaux choix, maintien des associations, réactivation ; sélection multiple, annulation, création et conservation des Zones. Séparation PRE-2 / PRE-3 et D-256 à D-259 inchangées.

## 1. Baseline et sources

- Baseline du plan (`source_head`, révision du scan) : `53cb05c782e17eb19d269f2724a0db3cfbceb1a2` = ancre `67064d1b` + D-256 à D-259 (#285) + dépendances photo et runtime natif isolé (#286) + icônes silhouette (#287). Activation (#289, `11b7ab85`) postérieure, fichiers d'orchestration seulement.
- Aucune opération PRE-2 antérieure ; runs actifs sans rapport (VNext, test en file depuis le 13/09), non touchés.

| Source | Blob | Usage |
|---|---|---|
| `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md` | voir bootstrap | CE-UI-01 (L1964–2050), CE-UI-07 (L2494–2582), CE-UI-09 (L2768–2856), CE-T03-16 (L1605–1691), §4.10 (L128–145), CE-T03-04 (L535–571), CE-T03-08 (L879–927), R-02 (L2978), ordre des sources (L13–25) |
| `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` | voir bootstrap | D-004, D-076, D-079, D-089, D-188, D-199, D-200, D-210 à D-214, D-222, D-227, D-228, D-236 à D-240, D-252, D-253, D-255, **D-256 à D-259 (L390–393)** |
| `docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md` | voir bootstrap | 09.1 Entité Utilisateur L118–152 (nom affiché, photo L145–150), préférences L840–865 (Pause entre les côtés L844), Étiquette L869–896, Catégorie L899–929, Zone L931–977, cardinalités L1222–1226 |
| `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md` | voir bootstrap | Profil L1076–1101 (nom 1..80, Vibration sans effet sur l'haptique des roulettes) |
| `docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md` | voir bootstrap | Grille des pauses L93–100 ; ligne 7 (L86, Pause entre les côtés : bilatéral uniquement, copie du Profil à activation) ; lignes 9, 10 (L88–89) |
| `docs/DSF-CARTES-ICONES-APPUIS-2026-09-30.md` | voir bootstrap | RG-5, RG-10, silhouettes Profil, ANI-06, PRO-01/02 ; L30 (cartes uniquement) |
| `docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md` | voir bootstrap | Pause entre les côtés L251 ; phases propres d'Exercice L252–253 ; Récupération d'occurrence L259 |
| Matrice `KODJO_Matrice_couverture_PRE_EXE_PRE2_2026-10-03.md` (fournie par Hermann) | — | §5 périmètre, §6 critères P2-01..P2-22 |

Empreintes SHA-256 des sources produit : `.github/orchestration/v2-slices/V2-PRE-2/slice-bootstrap.json` (blobs à la baseline `53cb05c7`). Le chapitre 10 (`10 – Processus métier et règles métier transverses.md`, RM-106 L186) n'est pas une source attestée de la tranche : il n'est cité qu'à titre de cohérence (T12), aucune règle du plan n'en dépend.

Ordre d'application (C13 L13–25) : décisions → modèle fonctionnel/données/règles → API → architecture → C06 → C13 → Figma (rendu uniquement, D-255).

## 2. Décisions de Hermann intégrées (03/10/2026)

- **D1** — Compte à rebours d'Exercice : 0..60 s, pas 1 s, défaut 10 s. Fin d'exercice : 0..60 s, pas 1 s, défaut 5 s. Sans effet sur la durée de réalisation de l'Exercice. Valeurs par défaut du Profil CR initial et Fin de séance : 0..60 s depuis D-265 (04/10/2026) ; champs de la Séance en Composition : 0..3599 s (D-089 amendée).
- **D2** — Créer, dans un référentiel, un nom dont la clé normalisée correspond à une entrée retirée réactive cette entrée : même identifiant, associations conservées, aucune confirmation ni parcours de restauration ; couleur choisie appliquée (Catégorie, Étiquette) et propagée aux objets courants. Entrée active : contrôle de doublon. Démarrage et migrations ne réactivent jamais.
- **D3** — Photo du Profil depuis la galerie uniquement ; copie locale persistante ; annulation sans effet ; erreur signalée sans perte du brouillon ; nouveau build natif et vérification sur iPhone.
- **D4** — Dialogue d'appui long : `Annuler`, `Modifier` (renommer ; couleur pour Catégorie et Étiquette), `Supprimer`. L'appui long ne sélectionne ni ne désaffecte. Nouvel appui sur l'Étiquette sélectionnée : désaffectation. Composants et styles existants réutilisés.

## 3. Delta réel (code au commit `53cb05c7`)

| Domaine | Existant | Manque |
|---|---|---|
| Étiquettes | `Label`, `validateLabelName` (≤40), `LabelRepository{listAll,create}`, table `labels` sans clé canonique | Renommage, couleur, retrait, unicité, réactivation, sélecteur (aucune UI n'affecte `draft.labelId`) |
| Catégories | Clé canonique, `categories.canonical_key UNIQUE`, `CategoryRepository{listAll}`, création seulement dans la transaction d'Exercice (`resolveCategoryId`), sélecteur inline sans palette | Opérations explicites, palette, réactivation, garde « valeur retirée » |
| Zones | `BodyZone`, `BodyZoneRepository{listAll}`, `BodyZoneSelector` | Création, renommage, retrait, unicité, réactivation, validation explicite, icône |
| Liaison Zones d'occurrence | `activity_body_zones.body_zone_id CHECK IN (10 ids)` (migration002/003/004) | **Bloquant** : une Zone créée ne peut pas être liée à une occurrence |
| Profil | 4 défauts, `ProfileRepository{get}` | 2 défauts de Séance, bornes, mise à jour, 4 préférences, identité, silhouette, service, écrans |
| Défauts de Séance | Constantes `DEFAULT_INITIAL_COUNTDOWN_SECONDS`, `DEFAULT_FINAL_PHASE_SECONDS` via `createEmptyDraft()` | Lecture depuis le Profil |
| Pause entre les côtés | Profil 10 s jamais consommée (`ExerciseScreen.tsx` L160 `useState(0)`) | Initialisation du nouvel Exercice |
| Récupération après exercice | `SessionService.createSession` écrase toutes les occurrences à l'enregistrement (L105–115) ; 0 pour une occurrence ajoutée en modification (`ActivitySelectionScreen.tsx` L136) | Copie à la création de l'occurrence |
| Phases propres d'Exercice | Constantes Profil, aucun champ sur l'Exercice | Réglages Profil (PRE-2) ; champ de l'Exercice (PRE-3) |
| Photo | `expo-image-picker` ~57.0.20, `expo-file-system` ~57.0.7 et plugin galerie installés (#286) | Adaptateur de sélection et copie locale |
| Silhouette | Icônes `body-zone-homme.svg` / `body-zone-femme.svg` (masters Figma `6322:10874` / `6322:10877`, #287) déclarées au manifeste ; aucun résolveur | Enregistrement dans `KodjoIcon`, résolveur `BodyZoneIcon` |

## 4. Décisions techniques tracées

| # | Point | Résolution | Source |
|---|---|---|---|
| T1 | Pas des steppers de durée | 1 s (CR initial, Fin de séance, phases propres d'Exercice) | D-252 ; D1 |
| T2 | Grille Pause entre les côtés / Récupération | 0,1,2,3,4,5,10,15…120,150,180…300 | D-252 ; v12 L98–100 |
| T3 | Valeur hors grille | Jamais arrondie à la lecture ; `+` → valeur de grille strictement supérieure, `−` → strictement inférieure | v12 L100 |
| T4 | Bornes | Bouton inactif à la borne, borne annoncée | CE-UI-07 L2540, L2568 |
| T5 | Maintien | Immédiat, puis 450 ms, puis 150 ms ; arrêt au relâchement | ANI-06 ; CE-UI-07 L2548 |
| T6 | Écriture | Une écriture atomique par geste au relâchement ; échec → valeur confirmée restituée + message | CE-UI-07 L2544, L2556, L2564 |
| T7 | Notifications | Préférence locale (défaut désactivée) ; aucune demande de permission ni module de notifications en PRE-2 ; lecteur d'état de permission en adaptateur, état « refusé » jamais affiché actif | CE-UI-07 L2544, L2564, L2572 ; D-079 |
| T8 | Nom d'affichage | Nullable tant que jamais renseigné ; 1..80 caractères (points de code) à l'enregistrement | C09 L147 (09.1 Entité Utilisateur) ; CE-UI-01 L2020 ; C08 L1078 |
| T9 | Bornes des noms de référentiel | Existantes : Étiquette et Catégorie ≤40, Zone 1..80 | Matrice §5.2 ; code |
| T10 | Clé normalisée | `normalizeName` + `canonicalCategoryKey` (sortie gelée) pour les trois référentiels | C09 L885, L914, L952 ; code |
| T11 | Palette | `SESSION_COLORS` (12) ; première couleur présélectionnée à la création | C09 L886, L915 ; code |
| T12 | Ordre d'affichage | Catégories : ordre déterministe = `display_order` des prédéfinies puis date de création croissante (index gelé `categories_display_order_idx`, migration002 L62–63) ; Zones : ordre défini par l'application = liste initiale dans l'ordre de C09 L968–977 puis Zones créées par date de création croissante, à égalité par ordre d'insertion ; Étiquettes : aucune règle d'ordre dans les sources attestées, décision technique déterministe = date de création croissante, à égalité par ordre d'insertion | C09 L917 (Catégorie, « Déterministe »), C09 L955 (Zone, « Défini par l'application ») ; Étiquette : décision technique ; cohérent avec RM-106 (chapitre 10, non attesté) |
| T13 | Silhouette | Une famille d'icônes de Zone, variante homme/femme, absence = homme ; affichée dans CE-UI-01 et la modale Zones ; cartes inchangées | RG-5, RG-10, PRO-01/02 ; matrice §5.3 |
| T14 | Catégorie de l'occurrence de Séance | Hors PRE-2 (aucun accès depuis l'éditeur local) | Matrice §5.2 |
| T15 | Réactivation (D2) : nom affiché | Le nom saisi (même clé normalisée) remplace le nom stocké ; identifiant et associations inchangés | D2 (« effectue simplement une création ») |
| T16 | Garde « valeur retirée » côté stockage | Création d'objet : référence active ; modification : active ou identique à l'affectation existante ; sinon erreur, brouillon conservé | D-210 ; CE-UI-09 L2824, L2836 |
| T17 | Retrait d'une Zone affectée | Permis si au moins une Zone reste | D-199 |
| T18 | Brouillon modifié | `isSessionDraftDirty(draft, baseline)` compare au brouillon initial réellement créé (valeurs du Profil), conservé par le fournisseur de brouillon | Conséquence de l'initialisation depuis le Profil |
| T19 | Absence de contexte Profil | Hors application (tests ne montant pas le fournisseur), les fonctions de brouillon gardent les valeurs du Domaine ; l'application monte toujours le fournisseur, prouvé par le test de branchement réel | Patron PRE-1 |
| T20 | Emplacement de l'identité | Nom affiché, photo et silhouette sont portés par le singleton `profiles`, et non par `users` : les attributs « Nom affiché » et « Photo de profil » relèvent de 09.1 Entité Utilisateur (L145–150), mais `users` (migration001 L2–6) et `profiles` sont deux singletons 1:1 du même utilisateur local ; `users` ne porte aucune colonne de nom ni de photo, donc aucune duplication. Regrouper l'identité avec la silhouette et les préférences évite une seconde écriture atomique sur deux tables pour un même enregistrement de Modifier le profil | C09 L118–152 ; migration001 L2–6 |
| T21 | Pause entre les côtés | Valeur du Profil copiée uniquement à l'activation bilatérale : création unilatérale (`DEFAULT_SIDE_MODE = UNILATERAL`) → 0 s ; Sans changement → D→G ou G→D → copie de la valeur courante du Profil ; D→G ↔ G→D → valeur conservée ; retour à Sans changement → valeur inchangée, non pertinente ; nouvelle activation → nouvelle copie. Exercice existant déjà bilatéral : valeur stockée conservée. Règle pure `sideRecoveryOnSideModeChange(previous, next, current, profileDefault)` dans `ActivityDefinition.ts`, appliquée par `ExerciseScreen` au changement de côté. Le stepper d'édition de cette pause dans la feuille de paramètres n'existe pas à la baseline et n'est pas demandé par la matrice PRE-2 ; il n'est pas ajouté | C09 L844 ; v12 L86 ligne 7 ; C04 L251 |
| T22 | Clé normalisée obligatoire | `labels.canonical_key` et `body_zones.canonical_key` : colonne ajoutée, remplie dans la transaction, index UNIQUE et déclencheurs `BEFORE INSERT` / `BEFORE UPDATE OF canonical_key` refusant NULL. Pas de reconstruction de `labels` : `sessions.label_id` la référence avec `ON DELETE SET NULL` ; avec `foreign_keys = ON`, `DROP TABLE labels` exécuterait cette action (`defer_foreign_keys` reporte les contrôles, pas les actions) et effacerait les Étiquettes des Séances. Contrainte équivalente à `NOT NULL UNIQUE` (patron `categories.canonical_key`, migration002 L51), prouvée par `targetSchema.test.ts` | migration002 L51 ; migration007 L81–97, L155 |
| T23 | Sortie de Modifier le profil | Retour avec brouillon modifié intercepté par `useCompositionExitGuard(shouldBlock, onConfirmExit)` importé sans modification, dialogue `DecisionDialog` aux libellés du Profil (même patron qu'`ExerciseExitConfirmModal`, non réutilisable tel quel : message propre à l'exercice) | CE-UI-01 L1980 ; REWORK11 |
| T24 | Groupes du Profil | Fond `#FCFCFE`, liseré blanc 1, rayon 12, ombre non rognée (CE-UI-07 L2532). DSF-CARTES L30 (bord `#CCD1E0` 0,5, rayon 8) décrit les cartes et non les groupes du Profil : aucun conflit ; à défaut, l'ordre des sources (C13 L13–25) placerait le chapitre 13 avant le rendu Figma | CE-UI-07 L2532 ; DSF-CARTES L30 ; C13 L13–25 |

## 5. Phases propres d'Exercice : PRE-2 et PRE-3

- **Livré en PRE-2** : les réglages Profil « Compte à rebours d'exercice » et « Fin d'exercice » (défauts 10 s et 5 s, bornes 0..60 s, pas 1 s), persistés, relus, modifiables par stepper, sans effet rétroactif.
- **Non livré en PRE-2** : l'Exercice n'a pas encore de champ pour ces phases ; aucune initialisation applicative de ces deux valeurs n'existe après PRE-2. Le branchement aux champs d'Exercice (création, feuille de paramètres v12 lignes 9–10) relève de PRE-3. PRE-2 ne livre aucune fonction d'initialisation non branchée.
- **Pause entre les côtés (v12 ligne 7)** : contrairement aux lignes 9–10, ce champ existe déjà sur l'Exercice (`sideRecoverySeconds`). PRE-2 livre son initialisation conditionnée par la bilatéralité (T21) ; elle n'est pas reportée.

## 6. Conception cible

### 6.1 Domaine

- `Profile` : `sideChangeRecoverySecondsDefault` (10), `postActivityRecoverySecondsDefault` (30), `exerciseCountdownSecondsDefault` (10), `exerciseEndSecondsDefault` (5) — constantes inchangées, lues par `migration007` — ; ajout `sessionInitialCountdownSecondsDefault` (10), `sessionFinalPhaseSecondsDefault` (5), `soundsEnabled` (true), `voiceAnnouncementsEnabled` (true), `vibrationEnabled` (true), `notificationsEnabled` (false), `displayName: string | null`, `photoUri: string | null`, `silhouette: "homme" | "femme" | null`. Fonctions : bornes par réglage (T1, T2, D1, D-089), `nextGridValue` / `previousGridValue` (T3), `validateDisplayName` (T8), `resolveSilhouette` (null → homme).
- `ProfileRepository` : `get`, `updateDefault`, `updatePreference`, `updateIdentity` (atomique).
- Référentiels : validation de nom et clé normalisée (T9, T10) ; erreurs `REQUIRED | TOO_LONG | DUPLICATE | INVALID_COLOR | RETIRED | NOT_FOUND` ; repositories `listAll`, `create` (avec réactivation D2), `rename`, `recolor` (Étiquette, Catégorie), `retire`.
- Brouillons : `createEmptyDraft(sessionDefaults?)`, `createExerciseDraft(id, postActivityRecoverySeconds?)`, `isSessionDraftDirty(draft, baseline?)` ; paramètres facultatifs aux valeurs actuelles du Domaine (T19). `createEmptyActivityDefinitionDraft()` reste inchangé (unilatéral, Pause entre les côtés 0 s) ; nouvelle règle pure `sideRecoveryOnSideModeChange` (T21).
- `moveActivity` et `duplicateActivity` (`composition.ts`) restent inchangés : la Récupération de l'occurrence suit déjà l'occurrence ; la preuve est ajoutée à `composition.test.ts` (C04 L259, CE-T03-08 L883).

### 6.2 Stockage — `migration008`

`DATABASE_VERSION = 8`. Migrations 001–007 inchangées (hashes 001–006 gelés ; `MIGRATION_007` gelé par un nouveau contrôle).

```sql
ALTER TABLE profiles ADD COLUMN session_initial_countdown_seconds_default INTEGER NOT NULL DEFAULT 10
  CHECK (session_initial_countdown_seconds_default BETWEEN 0 AND 3599); -- CHECK de stockage conservé ; bornes 0..60 de D-265 portées par le Domaine
ALTER TABLE profiles ADD COLUMN session_final_phase_seconds_default INTEGER NOT NULL DEFAULT 5
  CHECK (session_final_phase_seconds_default BETWEEN 0 AND 3599);
ALTER TABLE profiles ADD COLUMN sounds_enabled INTEGER NOT NULL DEFAULT 1 CHECK (sounds_enabled IN (0,1));
ALTER TABLE profiles ADD COLUMN voice_announcements_enabled INTEGER NOT NULL DEFAULT 1 CHECK (voice_announcements_enabled IN (0,1));
ALTER TABLE profiles ADD COLUMN vibration_enabled INTEGER NOT NULL DEFAULT 1 CHECK (vibration_enabled IN (0,1));
ALTER TABLE profiles ADD COLUMN notifications_enabled INTEGER NOT NULL DEFAULT 0 CHECK (notifications_enabled IN (0,1));
ALTER TABLE profiles ADD COLUMN display_name TEXT CHECK (display_name IS NULL OR length(display_name) BETWEEN 1 AND 80);
ALTER TABLE profiles ADD COLUMN photo_uri TEXT;
ALTER TABLE profiles ADD COLUMN silhouette TEXT CHECK (silhouette IS NULL OR silhouette IN ('homme','femme'));
ALTER TABLE labels ADD COLUMN canonical_key TEXT;
ALTER TABLE body_zones ADD COLUMN canonical_key TEXT;
-- clés calculées en JavaScript dans la transaction (UPDATE ... SET canonical_key = ?), puis :
CREATE UNIQUE INDEX labels_canonical_key_unique ON labels(canonical_key);
CREATE UNIQUE INDEX body_zones_canonical_key_unique ON body_zones(canonical_key);
CREATE TRIGGER labels_canonical_key_required_insert BEFORE INSERT ON labels
  WHEN NEW.canonical_key IS NULL BEGIN SELECT RAISE(ABORT, 'labels.canonical_key NOT NULL'); END;
CREATE TRIGGER labels_canonical_key_required_update BEFORE UPDATE OF canonical_key ON labels
  WHEN NEW.canonical_key IS NULL BEGIN SELECT RAISE(ABORT, 'labels.canonical_key NOT NULL'); END;
CREATE TRIGGER body_zones_canonical_key_required_insert BEFORE INSERT ON body_zones
  WHEN NEW.canonical_key IS NULL BEGIN SELECT RAISE(ABORT, 'body_zones.canonical_key NOT NULL'); END;
CREATE TRIGGER body_zones_canonical_key_required_update BEFORE UPDATE OF canonical_key ON body_zones
  WHEN NEW.canonical_key IS NULL BEGIN SELECT RAISE(ABORT, 'body_zones.canonical_key NOT NULL'); END;

PRAGMA defer_foreign_keys = ON;
CREATE TABLE activity_body_zones_v8 (
  activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  body_zone_id TEXT NOT NULL REFERENCES body_zones(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  PRIMARY KEY (activity_id, body_zone_id)
);
INSERT INTO activity_body_zones_v8 (activity_id, body_zone_id)
  SELECT activity_id, body_zone_id FROM activity_body_zones;
DROP TABLE activity_body_zones;
ALTER TABLE activity_body_zones_v8 RENAME TO activity_body_zones;
```

- Clé obligatoire et unique sur toutes les entrées, actives et retirées (T22) : elle garantit la réactivation D2 (une seule entrée par clé) au niveau du stockage. `categories.canonical_key` est déjà `NOT NULL UNIQUE`.
- `activity_body_zones` reconstruite (enfant uniquement : aucune action de clé étrangère déclenchée vers d'autres tables) : la cascade `ON DELETE CASCADE` sur `activity_id` et la clé primaire composite de migration004 L251–255 sont conservées ; seule la contrainte `CHECK` sur les 10 identifiants est remplacée par la clé étrangère vers `body_zones`. Toutes les lignes existantes référencent l'une des 10 Zones semées par migration007.
- `labels` et `body_zones` ne sont pas reconstruites ; `sessions.label_id` et `activity_definition_body_zones` restent intacts.
- Tests (`targetSchema.test.ts`, `migrateDatabase.test.ts`) : insertion et mise à jour avec clé NULL refusées ; clé dupliquée refusée, y compris contre une entrée retirée ; suppression d'une Activité supprimant ses liaisons de Zones (cascade conservée) ; suppression d'une Zone liée refusée ; Zone créée liable à une occurrence ; `sessions.label_id` inchangé après migration ; base PRE-1 avec données et base neuve convergentes.
- Les bornes des 4 colonnes existantes (pauses 0..300, phases 0..60) sont contrôlées par le Domaine ; pas de reconstruction de `profiles`.
- Hypothèse vérifiée en test : aucune clé dupliquée parmi les Étiquettes et Zones existantes (Zones semées distinctes ; aucun chemin applicatif ne crée d'Étiquette). Si un doublon existait, la migration échoue et annule la transaction plutôt que de fusionner silencieusement.
- Aucun effacement, aucun réensemencement, aucune réactivation ; base neuve et base PRE-1 avec données convergent.

### 6.3 Services et branchement

- `src/features/preferences/ProfileService.ts`, `ProfileServiceContext.tsx` : chargement, état confirmé, `setDefault`, `setPreference`, `saveIdentity` ; adaptateurs `notificationPermission.ts` (T7) et `profilePhoto.ts` (D3).
- `src/features/reference-data/ReferentialService.ts`, `ReferentialServiceContext.tsx` : listes et opérations explicites des trois référentiels.
- `SessionServiceProvider.tsx` : construit les repositories Profil et référentiels sur la même connexion, expose les contextes **hors** `<SQLiteProvider>` ; `onReady` attend aussi le chargement du Profil.
- `SessionService.createSession` : plus d'écrasement de `postActivityRecoverySeconds` (valeur copiée à la création de l'occurrence).
- `SessionDraftProvider` / `SessionDraftContext` : brouillon initialisé avec les défauts de Séance du Profil ; baseline exposée (T18).

### 6.4 Photo (D3)

- Sélection : `launchImageLibraryAsync` d'`expo-image-picker`, images seulement, une seule image. Sur iOS 11+, l'ouverture de la galerie n'exige pas de demande de permission (documentation Expo SDK 57) ; le plugin de configuration fixe `photosPermission` (texte français) et désactive `cameraPermission` / `microphonePermission`.
- `canceled: true` (`assets` nul) : aucune modification du brouillon.
- Image choisie : copie dans `Paths.document` via `expo-file-system` (`File.copy`), car l'URI renvoyée est en cache ; l'URI persistante entre dans le brouillon d'identité ; l'ancienne copie est supprimée après un enregistrement réussi seulement.
- Erreur de lecture ou de copie : message, brouillon conservé. Fichier absent à l'affichage : initiales.
- Dépendances et plugin déjà présents à la baseline (#286) ; `runtimeVersion` explicite `1.1.0` : aucune mise à jour OTA ne parvient aux binaires construits sans ces modules. Un nouveau build natif Routine Dev est nécessaire avant la recette ; la livraison PRE-2 elle-même sera classée `OTA_COMPATIBLE` (aucun fichier natif dans son diff) et ne déclenchera pas ce build.

### 6.5 Interface

| Écran / composant | Fichier | Contrat |
|---|---|---|
| Profil | `app/(tabs)/profile.tsx` → `src/features/preferences/ProfileScreen.tsx` | CE-UI-07 |
| Modifier le profil | `app/profile-edit.tsx`, `src/features/preferences/ProfileEditScreen.tsx`, déclaration dans `app/_layout.tsx` ; garde de sortie `useCompositionExitGuard` + `DecisionDialog` réutilisés (T23) | CE-UI-01 |
| Stepper Profil | `src/shared/ui/ProfileStepper.tsx` | D-227, ANI-06, T1–T6 |
| Icône de Zone | `src/shared/ui/BodyZoneIcon.tsx` ; enregistrement des deux icônes existantes dans `src/shared/ui/KodjoIcon.tsx` | RG-5, RG-10 |
| Sélecteurs | `src/features/reference-data/CategoryPickerModal.tsx`, `BodyZonePickerModal.tsx`, `LabelPickerModal.tsx` | CE-UI-09, CE-T03-16 |
| Dialogue d'appui long | `src/features/reference-data/ReferenceValueDialog.tsx` composé de `DecisionDialog` et `ColorPalette` existants : `Annuler`, `Modifier`, `Supprimer` | §4.10, D4 |
| Accès | `ExerciseScreen.tsx` (Catégorie, Zones), `ActivityEditorForm.tsx` / `BodyZoneSelector.tsx` (Zones), `CompositionScreen.tsx` (Étiquette) | CE-T03-04, CE-T03-08 |

Traductions : `src/shared/i18n/resources/fr.ts` (libellés CE-UI-07 L2514 et D-253, erreurs, dialogue de suppression « Supprimer « {nom} » ? » et messages utilisé / non utilisé de §4.10 L134–135, dialogue d'abandon de Modifier le profil) ; accessibilité : nom et état, unité et borne des steppers, « Silhouette homme/femme », couleur toujours accompagnée du nom, sélection multiple des Zones lisible, actions nommées, focus confiné à la modale puis dialogue puis liste (CE-UI-09 L2808, L2840 ; CE-T03-16 L1677), cibles ≥44×44. Les valeurs initiales fournies par KODJO (Catégories prédéfinies, Zones semées) sont administrables comme les autres (§4.10 L137) : aucune garde sur `isPredefined`.

## 7. Initialisation des défauts et non-rétroactivité

| Défaut | Destinataire | Point d'injection en PRE-2 | Preuve |
|---|---|---|---|
| Pause entre les côtés 10 s | Exercice du Catalogue à l'activation D→G ou G→D (jamais à une création unilatérale) | `sideRecoveryOnSideModeChange` appliquée par `ExerciseScreen` au changement de côté (T21) | Exercice unilatéral : 0 s ; Exercice existant déjà bilatéral et brouillon ouvert inchangés ; D→G ↔ G→D conserve la valeur |
| Récupération après exercice 30 s | Nouvelle occurrence (insertion Catalogue et Exercice local, en création et en modification de Séance) | `ActivitySelectionScreen`, `ExerciseScreen` (Exercice local) | Occurrences existantes inchangées ; valeur saisie conservée à l'enregistrement ; conservée au déplacement et à la duplication sans relecture du Profil ; jamais copiée dans une définition |
| CR initial 10 s, Fin de séance 5 s | Nouvelle Séance | `SessionDraftProvider` | Séance existante et brouillon en cours inchangés |
| CR d'exercice 10 s, Fin d'exercice 5 s | Nouvel Exercice | **Aucun en PRE-2** (champ absent) ; branchement PRE-3 | Réglages persistés et relus uniquement |

## 8. Critères P2-01..P2-22 et assertions

Les critères UI et exigences non UI des blocs machine portent les identifiants canoniques ; correspondance :

| Critère de préparation | Bloc machine |
|---|---|
| P2-01, P2-02, P2-03, P2-05, P2-06 | Exigence non UI « référentiels » + critères Catégorie, Zones, Étiquette |
| P2-04 | Critères Catégorie (palette), Zones (aucune couleur), Étiquette |
| P2-07, P2-08, P2-09, P2-10 | Critères Catégorie, Zones, Étiquette |
| P2-11, P2-13, P2-14, P2-15, P2-16 | Critère Profil + exigence non UI « Profil » |
| P2-12 | Critère « branchement et initialisation » |
| P2-17, P2-18 | Critère « Modifier le profil » + exigence non UI « Profil » |
| P2-19 | Critère « branchement et initialisation » |
| P2-20 | Exigence non UI « migration » + « aucune réactivation automatique » |
| P2-21 | Critères UI : preuves visuelles et contrôles d'accessibilité des six critères (Profil, Modifier le profil, Catégorie, Zones, Étiquette ; aucun rendu pour le branchement) |
| P2-22 | Exigence de préservation + frontières |

## 9. Ordre de développement

1. Domaine et tests purs.
2. `migration008`, runner, types de lignes ; tests base neuve, base PRE-1 avec données, double passage, annulation sur erreur, absence de réactivation.
3. Repositories (opérations, réactivation D2, gardes T16) et tests.
4. Services, branchement réel, tests sous vrai fournisseur.
5. Injection des défauts et tests de non-rétroactivité.
6. Composants, sélecteurs, dialogue ; écrans Profil ; photo ; traductions.
7. Accès depuis Exercice et Composition ; tests d'intégration adaptés (fournisseurs uniquement).
8. Suite complète, typescript, lint ; rapport de conformité complet.

## 10. Commandes de contrôle

```
npm test --silent
npx --no-install tsc --noEmit
npm run lint --silent
```

## 11. Recette sur iPhone (après revue d'implémentation APPROVE et nouveau build natif)

Révision du 04/10/2026 : refaire au minimum R1 (défilement, texte agrandi, bloc Identité et Modifier le profil complet), D-265 à D-267, R4 (création et modification, clavier affiché et masqué), R5, R6, R7a et R10 (confinement et retour du focus) ; conserver les résultats déjà acquis listés au §0 bis.

0. Lancer puis installer le nouveau build natif Routine Dev (runtime `1.1.0`, dépendances photo) ; la mise à jour OTA de la livraison ne vise que ce runtime.
1. Profil : six réglages, valeurs initiales ; un seul stepper ouvert ; maintien qui accélère ; boutons inactifs aux bornes (0 et 60 s pour les phases d'Exercice).
2. Modifier un défaut, fermer complètement l'app, rouvrir : valeur conservée.
3. Nouvelle Séance et nouvelle occurrence : valeurs initiales = Profil ; une Séance existante n'a pas changé ; une récupération saisie reste après enregistrement, après déplacement et dans une copie dupliquée. Nouvel Exercice Sans changement : Pause entre les côtés 0 s ; passage à D→G : valeur du Profil.
4. Préférences : quatre interrupteurs ; Notifications désactivé par défaut, aucune demande système.
5. Modifier le profil : nom vide refusé ; photo choisie dans la galerie, conservée après relance ; annulation du choix sans effet ; silhouette femme → icône femme dans la modale Zones ; retour après modification → dialogue d'abandon ; Annuler conserve le brouillon ; confirmer restaure les valeurs enregistrées.
6. Catégorie : toucher = choix et fermeture ; appui long → Modifier (nom, couleur) / Supprimer ; titre « Supprimer « {nom} » ? » et message différent pour une Catégorie utilisée et non utilisée ; après suppression la modale reste ouverte sans la valeur ; une Catégorie prédéfinie se renomme et se supprime ; recréer le nom d'une Catégorie supprimée → elle réapparaît avec la couleur choisie et les Exercices qui l'utilisaient la conservent.
7. Zones : cocher plusieurs, Confirmer ; fermer sans confirmer restaure ; appui long → Modifier / Supprimer ; Zone créée enregistrée sur une occurrence de Séance.
8. Étiquette : choisir ; toucher à nouveau l'Étiquette choisie la retire ; appui long ne change pas le choix ; couleur de la Séance suit l'Étiquette ; seul Continuer enregistre.
9. Texte agrandi ; VoiceOver sur steppers, interrupteurs, silhouettes et sur les trois modales (nom et état annoncés, couleur jamais seule, Zones sélectionnées lisibles, focus dialogue puis liste) ; groupes du Profil au rendu CE-UI-07 L2532.

## 12. Points ouverts (avec preuve)

| # | Point | État |
|---|---|---|
| O1 | Dépendances photo hors de l'écriture d'un plan V2 (`scripts/kodjo/lib/plan-impact.js` L122–129) | **Levé** : préparation #286 (`5d133f42`) |
| O2 | Entrée en revue V2 d'un plan publié localement | **Levé** : publication vérifiée générique (#290), publication de la revue fiabilisée (#292) |
| O3 | Icônes silhouette | **Levé** : préparation #287 (`53cb05c7`) |
| O4 | D-256 à D-259 dans les sources | **Levé** : #285 (`7fa6adc7`) ; plan réassemblé sur la baseline qui les contient |
| O5 | Revue du candidat | Revue initiale : REVISE, 13 constats (commentaire 5971511255) ; ce candidat les corrige ; revue de fermeture à venir |

## 13. Critères de sortie

1. Plan approuvé par la revue de fermeture V2 ; 👍 de Hermann.
2. Assertions des blocs machine couvertes ; suite, typescript, lint verts ; aucun fichier hors périmètre ; frontières PASS.
3. Migration v8 prouvée sur base neuve et base PRE-1 avec données.
4. Revue d'implémentation `APPROVE` avec rapport de conformité complet.
5. Nouveau build installé, recette §11 réussie (`VISUAL_APPROVED`), finalisation V2 et fusion.

## Tests

Tests créés :

- `src/features/preferences/__tests__/ProfileService.test.ts`
- `src/features/preferences/__tests__/ProfileScreen.test.tsx`
- `src/features/preferences/__tests__/ProfileEditScreen.test.tsx`
- `src/features/preferences/__tests__/profilePhoto.test.ts`
- `src/features/reference-data/__tests__/ReferentialService.test.ts`
- `src/features/reference-data/__tests__/CategoryPickerModal.test.tsx`
- `src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx`
- `src/features/reference-data/__tests__/LabelPickerModal.test.tsx`
- `src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx`
- `src/shared/ui/__tests__/ProfileStepper.test.tsx`
- `src/shared/ui/__tests__/BodyZoneIcon.test.tsx`

Tests existants modifiés : domaine (`Profile`, `Label`, `validation`, `BodyZone`, `SessionDraft`, `ActivityDefinition`, `composition` pour la conservation de la Récupération au déplacement et à la duplication), stockage (`migrateDatabase`, `targetSchema`, repositories Profil, Étiquette, Catégorie, Zone, Séance, définition d'Activité), fonctionnalités (`SessionService`, `SessionServiceProvider`, `SessionDraftProvider`, `ExerciseScreen`, `CompositionScreen`, `BodyZoneSelector`, `ActivitySelectionScreen`, `ActivityEditorForm`), transverses (`src/shared/i18n/index.test.ts`, `app/__tests__/rootLayoutGesture.test.tsx`). Les intégrations rendant les écrans (`CatalogueCompositionEditFlow`, `CompositionExerciseFlow`, `CategoriesSaveFlow`, `SessionDraftContext`) adaptent uniquement leurs fournisseurs ; aucune assertion existante n'est modifiée hors des comportements volontairement changés (récupération à l'enregistrement, défauts du brouillon, placeholder Profil).


<KODJO_PLAN_IMPACT_JSON>
{
  "schema": "kodjo.plan-impact.v1",
  "scan_revision": "10ac761ef453f360110bf7b668b3998487b071b3",
  "modified_modules": [
    {
      "path": "app/(tabs)/profile.tsx",
      "change": "MODIFY"
    },
    {
      "path": "app/__tests__/rootLayoutGesture.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "app/_layout.tsx",
      "change": "MODIFY"
    },
    {
      "path": "app/profile-edit.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/activities/ActivityDefinition.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/body-zones/BodyZone.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/body-zones/BodyZoneRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/body-zones/__tests__/BodyZone.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/body-zones/index.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/categories/CategoryRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/categories/__tests__/validation.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/categories/errors.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/categories/index.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/labels/Label.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/labels/LabelRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/labels/__tests__/Label.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/labels/index.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/preferences/Profile.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/preferences/ProfileRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/preferences/__tests__/Profile.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/preferences/index.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/SessionDraft.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/defaults.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/ActivityEditorForm.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/ActivitySelectionScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/preferences/ProfileEditScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/preferences/ProfileScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/preferences/ProfileService.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/preferences/ProfileServiceContext.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/preferences/__tests__/ProfileScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/preferences/__tests__/ProfileService.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/preferences/__tests__/profilePhoto.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/preferences/notificationPermission.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/preferences/profilePhoto.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/reference-data/BodyZonePickerModal.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/reference-data/CategoryPickerModal.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/reference-data/LabelPickerModal.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/reference-data/ReferenceValueDialog.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/reference-data/ReferentialService.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/reference-data/ReferentialServiceContext.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/reference-data/__tests__/ReferentialService.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/BodyZoneSelector.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/ColorPalette.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/CompositionScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/ExerciseScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/SessionDraftContext.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/SessionDraftProvider.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/SessionService.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/SessionServiceProvider.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SessionService.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/constants.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/migrateDatabase.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/migrations/migration008.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/types/DatabaseRows.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/i18n/index.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/i18n/resources/fr.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/ui/BodyZoneIcon.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/ui/KodjoIcon.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/ui/ProfileStepper.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/ui/__tests__/BodyZoneIcon.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/ui/__tests__/ProfileStepper.test.tsx",
      "change": "MODIFY"
    }
  ],
  "scan_sha256": "558c1caeb4f6c10bc41cca058b22375da1d3e4413751abee4a2267e0fa2e75d9",
  "rows": [
    {
      "path": "app/(tabs)/profile.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "app/__tests__/rootLayoutGesture.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "app/_layout.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "app/profile-edit.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/activities/ActivityDefinition.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/body-zones/BodyZone.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/body-zones/BodyZoneRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/body-zones/__tests__/BodyZone.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/body-zones/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/categories/CategoryRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/categories/__tests__/validation.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/categories/errors.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/categories/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/labels/Label.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/labels/LabelRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/labels/__tests__/Label.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/labels/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/preferences/Profile.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/preferences/ProfileRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/preferences/__tests__/Profile.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/preferences/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/SessionDraft.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/defaults.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/activities/ActivityEditorForm.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/activities/ActivitySelectionScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/preferences/ProfileEditScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/preferences/ProfileScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/preferences/ProfileService.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/preferences/ProfileServiceContext.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/preferences/__tests__/ProfileScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/preferences/__tests__/ProfileService.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/preferences/__tests__/profilePhoto.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/preferences/notificationPermission.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/preferences/profilePhoto.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/reference-data/BodyZonePickerModal.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/reference-data/CategoryPickerModal.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/reference-data/LabelPickerModal.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/reference-data/ReferenceValueDialog.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/reference-data/ReferentialService.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/reference-data/ReferentialServiceContext.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/reference-data/__tests__/ReferentialService.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/BodyZoneSelector.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/ColorPalette.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/CompositionScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/ExerciseScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/SessionDraftContext.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/SessionDraftProvider.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/SessionService.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/SessionServiceProvider.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/SessionService.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/constants.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/migrateDatabase.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/migrations/migration008.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/types/DatabaseRows.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/shared/i18n/index.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/shared/i18n/resources/fr.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/shared/ui/BodyZoneIcon.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/shared/ui/KodjoIcon.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/shared/ui/ProfileStepper.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/shared/ui/__tests__/BodyZoneIcon.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/shared/ui/__tests__/ProfileStepper.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/__tests__/composition.test.ts",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts"
      ],
      "risk_score": 150,
      "classification": "TEST_MUST_ADAPT",
      "justification": "Appels existants inchangés ; ajout de la preuve que moveActivity et duplicateActivity conservent la Récupération propre de l’occurrence sans relire le Profil (04 L259, CE-T03-08 L884)."
    },
    {
      "path": "src/features/sessions/__tests__/useSessionCatalogue.test.ts",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 150,
      "classification": "TEST_UNAFFECTED",
      "justification": "Constructeur et lecture de SessionService inchangés."
    },
    {
      "path": "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 148,
      "classification": "TEST_UNAFFECTED",
      "justification": "Constructeur et lecture de SessionService inchangés."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/body-zones/BodyZone.ts",
        "src/domain/body-zones/BodyZoneRepository.ts",
        "src/domain/categories/CategoryRepository.ts",
        "src/domain/preferences/Profile.ts",
        "src/domain/preferences/ProfileRepository.ts",
        "src/features/preferences/ProfileService.ts",
        "src/features/preferences/ProfileServiceContext.tsx",
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 140,
      "classification": "TEST_MUST_ADAPT",
      "justification": "Rend Composition et Exercice : ajout des fournisseurs Profil et référentiels, sans changer les assertions."
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/features/preferences/ProfileService.ts",
        "src/features/preferences/ProfileServiceContext.tsx",
        "src/features/reference-data/ReferentialService.ts",
        "src/features/reference-data/ReferentialServiceContext.tsx",
        "src/features/sessions/SessionService.ts",
        "src/infrastructure/database/migrateDatabase.ts",
        "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
        "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
        "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
        "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
        "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
        "src/infrastructure/database/repositories/SqliteSessionRepository.ts"
      ],
      "risk_score": 138,
      "classification": "TEST_MUST_ADAPT",
      "justification": "Rend les écrans sur base réelle : fournisseurs Profil et référentiels ajoutés ; la Récupération est copiée à la création de l’occurrence."
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts",
        "src/features/sessions/SessionDraftContext.tsx",
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 138,
      "classification": "TEST_UNAFFECTED",
      "justification": "Écran d’enregistrement inchangé."
    },
    {
      "path": "src/features/sessions/__tests__/ColorPalette.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/features/sessions/ColorPalette.tsx"
      ],
      "risk_score": 132,
      "classification": "TEST_MUST_ADAPT",
      "justification": "Test lié par le plan à un critère ou une exigence de la révision ; adapté seulement pour les comportements révisés."
    },
    {
      "path": "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/body-zones/BodyZone.ts",
        "src/domain/body-zones/BodyZoneRepository.ts",
        "src/domain/categories/CategoryRepository.ts",
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 130,
      "classification": "TEST_MUST_ADAPT",
      "justification": "Rend Composition et Exercice par les routes : fournisseurs ajoutés, assertions inchangées."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts",
        "src/features/sessions/SessionDraftContext.tsx",
        "src/features/sessions/SessionDraftProvider.tsx"
      ],
      "risk_score": 130,
      "classification": "TEST_UNAFFECTED",
      "justification": "isSessionDraftDirty garde son comportement avec la baseline par défaut."
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts",
        "src/features/sessions/SessionDraftContext.tsx",
        "src/features/sessions/SessionDraftProvider.tsx"
      ],
      "risk_score": 130,
      "classification": "TEST_UNAFFECTED",
      "justification": "Garde de navigation inchangée ; brouillon créé avec les valeurs par défaut du Domaine hors fournisseur Profil."
    },
    {
      "path": "src/features/sessions/__tests__/compositionPresentation.test.ts",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/body-zones/BodyZone.ts",
        "src/domain/sessions/SessionDraft.ts"
      ],
      "risk_score": 130,
      "classification": "TEST_UNAFFECTED",
      "justification": "Présentation préservée."
    },
    {
      "path": "src/features/activities/__tests__/ActivityCard.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/body-zones/BodyZone.ts"
      ],
      "risk_score": 127,
      "classification": "TEST_UNAFFECTED",
      "justification": "Carte préservée."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/infrastructure/database/migrateDatabase.ts"
      ],
      "risk_score": 120,
      "classification": "TEST_UNAFFECTED",
      "justification": "Médias non modifiés ; la migration v8 ne touche pas leurs tables."
    },
    {
      "path": "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/infrastructure/database/constants.ts"
      ],
      "risk_score": 120,
      "classification": "TEST_UNAFFECTED",
      "justification": "Compare user_version à DATABASE_VERSION importé : suit la valeur 8 sans modification."
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts",
        "src/features/sessions/SessionDraftContext.tsx"
      ],
      "risk_score": 118,
      "classification": "TEST_MUST_ADAPT",
      "justification": "La valeur de contexte expose la baseline du brouillon."
    },
    {
      "path": "app/__tests__/creationLayout.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/features/sessions/SessionDraftProvider.tsx"
      ],
      "risk_score": 116,
      "classification": "TEST_UNAFFECTED",
      "justification": "Le fournisseur de brouillon reste montable sans fournisseur Profil (valeurs du Domaine)."
    },
    {
      "path": "src/features/sessions/__tests__/SessionServiceContext.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 109,
      "classification": "TEST_UNAFFECTED",
      "justification": "Contexte de SessionService inchangé."
    },
    {
      "path": "app/(creation)/_layout.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/SessionDraftProvider.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Monte SessionDraftProvider sans nouvel argument."
    },
    {
      "path": "app/(creation)/activity-selection.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/activities/ActivitySelectionScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Route d’enrobage inchangée."
    },
    {
      "path": "app/(creation)/composition.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/CompositionScreen.tsx",
        "src/features/sessions/SessionDraftContext.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Route d’enrobage inchangée."
    },
    {
      "path": "app/(creation)/exercise.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/ExerciseScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Route d’enrobage inchangée."
    },
    {
      "path": "app/(tabs)/_layout.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/shared/ui/KodjoIcon.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
    },
    {
      "path": "src/domain/activities/ActivityDefinitionRepository.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/activities/ActivityDefinition.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Paramètre facultatif ajouté au brouillon ; interface inchangée."
    },
    {
      "path": "src/domain/activities/index.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/activities/ActivityDefinition.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Réexport inchangé."
    },
    {
      "path": "src/domain/categories/Category.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/categories/errors.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Nouveaux codes d’erreur ajoutés sans changer le type."
    },
    {
      "path": "src/domain/categories/validation.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/categories/errors.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Préservé ; nouveaux codes sans effet."
    },
    {
      "path": "src/domain/sessions/composition.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Fonctions de brouillon compatibles."
    },
    {
      "path": "src/domain/sessions/index.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts",
        "src/domain/sessions/defaults.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "export * inchangé."
    },
    {
      "path": "src/domain/sessions/validation.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/defaults.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Constantes de Séance conservées."
    },
    {
      "path": "src/features/activities/ActivityCard.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/body-zones/BodyZone.ts",
        "src/shared/ui/KodjoIcon.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Carte préservée."
    },
    {
      "path": "src/features/activities/ActivityDefinitionService.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/body-zones/BodyZone.ts",
        "src/domain/body-zones/BodyZoneRepository.ts",
        "src/domain/categories/CategoryRepository.ts",
        "src/domain/labels/Label.ts",
        "src/domain/labels/LabelRepository.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Listes existantes conservées ; opérations dans ReferentialService."
    },
    {
      "path": "src/features/sessions/CatalogueScreen.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/shared/ui/KodjoIcon.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
    },
    {
      "path": "src/features/sessions/CategoriesScreen.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/SessionDraftContext.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Consommateur direct d’un module de la livraison #303 ; la révision n’en modifie pas l’API importée."
    },
    {
      "path": "src/features/sessions/DurationWheelPicker.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/shared/ui/KodjoIcon.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
    },
    {
      "path": "src/features/sessions/NumberWheelPicker.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/shared/ui/KodjoIcon.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
    },
    {
      "path": "src/features/sessions/SessionCard.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/shared/ui/KodjoIcon.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
    },
    {
      "path": "src/features/sessions/SessionServiceContext.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Contexte inchangé."
    },
    {
      "path": "src/features/sessions/compositionPresentation.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/body-zones/BodyZone.ts",
        "src/domain/sessions/SessionDraft.ts",
        "src/domain/sessions/defaults.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Présentation préservée."
    },
    {
      "path": "src/infrastructure/database/ExpoDatabase.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/infrastructure/database/constants.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Adaptateur inchangé."
    },
    {
      "path": "src/infrastructure/database/initializeDatabase.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/infrastructure/database/constants.ts",
        "src/infrastructure/database/migrateDatabase.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Utilise DATABASE_VERSION et migrateDatabase sans changement."
    },
    {
      "path": "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/infrastructure/database/migrateDatabase.ts",
        "src/infrastructure/database/repositories/SqliteSessionRepository.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Outil natif inchangé (dérogation propre à PRE-1)."
    },
    {
      "path": "src/infrastructure/database/migrations/migration007.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/preferences/Profile.ts",
        "src/infrastructure/database/constants.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Préservée ; constantes lues inchangées."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteMediaRepository.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/infrastructure/database/types/DatabaseRows.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Types de lignes Médias inchangés."
    },
    {
      "path": "src/shared/i18n/index.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/shared/i18n/resources/fr.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Point d’entrée des traductions inchangé."
    },
    {
      "path": "src/shared/ui/DisclosureControl.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/shared/ui/KodjoIcon.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
    },
    {
      "path": "src/shared/ui/ScreenShell.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/shared/ui/KodjoIcon.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
    }
  ],
  "scope_allow": [
    "app/(tabs)/profile.tsx",
    "app/__tests__/rootLayoutGesture.test.tsx",
    "app/_layout.tsx",
    "app/profile-edit.tsx",
    "src/domain/activities/ActivityDefinition.ts",
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/body-zones/BodyZone.ts",
    "src/domain/body-zones/BodyZoneRepository.ts",
    "src/domain/body-zones/__tests__/BodyZone.test.ts",
    "src/domain/body-zones/index.ts",
    "src/domain/categories/CategoryRepository.ts",
    "src/domain/categories/__tests__/validation.test.ts",
    "src/domain/categories/errors.ts",
    "src/domain/categories/index.ts",
    "src/domain/labels/Label.ts",
    "src/domain/labels/LabelRepository.ts",
    "src/domain/labels/__tests__/Label.test.ts",
    "src/domain/labels/index.ts",
    "src/domain/preferences/Profile.ts",
    "src/domain/preferences/ProfileRepository.ts",
    "src/domain/preferences/__tests__/Profile.test.ts",
    "src/domain/preferences/index.ts",
    "src/domain/sessions/SessionDraft.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/domain/sessions/defaults.ts",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/preferences/ProfileEditScreen.tsx",
    "src/features/preferences/ProfileScreen.tsx",
    "src/features/preferences/ProfileService.ts",
    "src/features/preferences/ProfileServiceContext.tsx",
    "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
    "src/features/preferences/__tests__/ProfileScreen.test.tsx",
    "src/features/preferences/__tests__/ProfileService.test.ts",
    "src/features/preferences/__tests__/profilePhoto.test.ts",
    "src/features/preferences/notificationPermission.ts",
    "src/features/preferences/profilePhoto.ts",
    "src/features/reference-data/BodyZonePickerModal.tsx",
    "src/features/reference-data/CategoryPickerModal.tsx",
    "src/features/reference-data/LabelPickerModal.tsx",
    "src/features/reference-data/ReferenceValueDialog.tsx",
    "src/features/reference-data/ReferentialService.ts",
    "src/features/reference-data/ReferentialServiceContext.tsx",
    "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
    "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
    "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
    "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
    "src/features/reference-data/__tests__/ReferentialService.test.ts",
    "src/features/sessions/BodyZoneSelector.tsx",
    "src/features/sessions/ColorPalette.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionDraftContext.tsx",
    "src/features/sessions/SessionDraftProvider.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/SessionServiceProvider.tsx",
    "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/ColorPalette.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
    "src/features/sessions/__tests__/SessionService.test.ts",
    "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/__tests__/targetSchema.test.ts",
    "src/infrastructure/database/constants.ts",
    "src/infrastructure/database/migrateDatabase.ts",
    "src/infrastructure/database/migrations/migration008.ts",
    "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
    "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
    "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
    "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
    "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
    "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
    "src/infrastructure/database/types/DatabaseRows.ts",
    "src/shared/i18n/index.test.ts",
    "src/shared/i18n/resources/fr.ts",
    "src/shared/ui/BodyZoneIcon.tsx",
    "src/shared/ui/KodjoIcon.tsx",
    "src/shared/ui/ProfileStepper.tsx",
    "src/shared/ui/__tests__/BodyZoneIcon.test.tsx",
    "src/shared/ui/__tests__/ProfileStepper.test.tsx"
  ]
}
</KODJO_PLAN_IMPACT_JSON>

<KODJO_UI_CRITERIA_MATRIX_JSON>
{
  "schema": "kodjo.ui-criteria.v3",
  "criteria": [
    {
      "criterion_id": "UI-3D89E598F31D",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-09 L2768–2856 ; §4.10 L128–145",
        "requirement": "Zones corporelles : sélection multiple validée explicitement, création, renommage, suppression logique, réactivation par création du même nom, aucune couleur, icône selon la silhouette."
      },
      "risk_types": [
        "ACCESSIBILITY",
        "FUNCTIONAL",
        "VISUAL"
      ],
      "reuse_search": [
        "src/features/sessions/BodyZoneSelector.tsx",
        "src/features/activities/ActivityEditorForm.tsx"
      ],
      "component_decision": "CREATE",
      "selected_component": {
        "path": "NONE",
        "export": "NONE"
      },
      "decision_justification": "Le sélecteur actuel bascule directement le brouillon ; la validation explicite et la restauration à la fermeture exigent une modale dédiée, dont le focus et l’annonce de la sélection multiple ne peuvent être hérités d’un composant existant.",
      "change_targets": [
        "src/features/reference-data/BodyZonePickerModal.tsx",
        "src/shared/i18n/resources/fr.ts",
        "src/features/sessions/BodyZoneSelector.tsx",
        "src/features/activities/ActivityEditorForm.tsx",
        "src/features/sessions/CompositionScreen.tsx"
      ],
      "tests": [
        "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
        "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
        "src/shared/i18n/index.test.ts",
        "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
        "src/features/sessions/__tests__/CompositionScreen.test.tsx"
      ],
      "proof_required": [
        "ACCESSIBILITY_CHECK",
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-3D89E598F31D-AED410D36D72B",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2784, L2816, L2840"
          },
          "property_type": "STATE",
          "expected": "Après Confirmer, la liste des Zones de l’Exercice et les noms de Zones affichés sur les occurrences de la Composition sont immédiatement à jour pour une Zone créée, renommée ou supprimée dans la modale, sans fermer ni rouvrir l’Exercice ni remonter la Composition.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A5E23CB337921",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2788, L2804"
          },
          "property_type": "PRESENCE",
          "expected": "Aucune palette ni couleur n’est proposée ou stockée pour une Zone.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A30952ACCEE22",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2804"
          },
          "property_type": "RELATION",
          "expected": "Chaque Zone de la modale porte l’icône de la silhouette du Profil.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A1FF92A662337",
          "source": {
            "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
            "locator": "D-257 L391 ; D-259 L393"
          },
          "property_type": "STATE",
          "expected": "Créer un nom nouveau ajoute une Zone ; un nom actif est refusé ; un nom retiré réactive la Zone avec son identifiant et ses associations ; Modifier renomme sans changer l’identifiant ; Supprimer conserve les affectations existantes.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A39FF697ED918",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2796, L2808"
          },
          "property_type": "RESPONSIVE",
          "expected": "En création comme en renommage d’une Zone, la liste défile, le champ saisi et les actions Annuler, Ajouter, Enregistrer et Confirmer restent entièrement visibles et utilisables, clavier affiché ou masqué ; un nom long reste accessible sans troncature et le texte agrandi ne réduit pas la police.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-AEE8F212827AE",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2808, L2840"
          },
          "property_type": "CONTENT",
          "expected": "Le titre de la modale est exposé comme en-tête accessible ; chaque Zone annonce son nom et son état sélectionné ; toutes les Zones sélectionnées restent lisibles, sans troncature ni masquage de la sélection multiple ; Annuler, Modifier, Supprimer et Confirmer ont des libellés accessibles ; le focus reste confiné à la modale ouverte, passe au dialogue puis revient à la liste.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A6E804F8CBE09",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "§4.10 L137 ; C09 L962"
          },
          "property_type": "STATE",
          "expected": "Les dix Zones initiales fournies par KODJO sont renommables et supprimables comme les Zones créées.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A4255F88073DB",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2772, L2804 ; D-228"
          },
          "property_type": "STYLE",
          "expected": "Modale de sélection des Zones et sa carte de création au rendu des frames 4478:7209 et 4683:6336 (modale D-228) ; dialogue destructif d’une Zone au rendu de la frame 4861:6348.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A2589810B1B4F",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2824 ; D-199"
          },
          "property_type": "STATE",
          "expected": "Un nouvel Exercice exige au moins une Zone ; retirer une Zone affectée est permis s’il en reste une.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A53142CC7796C",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2784, L2816"
          },
          "property_type": "INTERACTION",
          "expected": "Un toucher bascule une Zone ; Confirmer applique la sélection ; fermer sans confirmer restaure la sélection précédente.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "criterion_id": "UI-5F3D94866D30",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-09 L2768–2856 ; §4.10 L128–145",
        "requirement": "Catégorie : choix unique validé au toucher, création, modification du nom et de la couleur, suppression logique par appui long, réactivation par création du même nom, opérations distinctes de l’enregistrement de l’Exercice."
      },
      "risk_types": [
        "ACCESSIBILITY",
        "FUNCTIONAL",
        "VISUAL"
      ],
      "reuse_search": [
        "src/features/sessions/ExerciseScreen.tsx",
        "src/features/sessions/ColorPalette.tsx",
        "src/features/sessions/DecisionDialog.tsx"
      ],
      "component_decision": "CREATE",
      "selected_component": {
        "path": "NONE",
        "export": "NONE"
      },
      "decision_justification": "Le sélecteur inline existant n’a ni palette, ni modification, ni suppression ; une modale dédiée réutilisant ColorPalette et DecisionDialog est créée. Le dialogue d’appui long ReferenceValueDialog est partagé par les trois référentiels.",
      "change_targets": [
        "src/features/reference-data/CategoryPickerModal.tsx",
        "src/shared/i18n/resources/fr.ts",
        "src/features/reference-data/ReferenceValueDialog.tsx",
        "src/features/reference-data/ReferentialService.ts",
        "src/features/reference-data/ReferentialServiceContext.tsx",
        "src/features/sessions/ExerciseScreen.tsx",
        "src/features/sessions/ColorPalette.tsx"
      ],
      "tests": [
        "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
        "src/shared/i18n/index.test.ts",
        "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
        "src/features/reference-data/__tests__/ReferentialService.test.ts",
        "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
        "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
        "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
        "src/features/sessions/__tests__/ColorPalette.test.tsx"
      ],
      "proof_required": [
        "ACCESSIBILITY_CHECK",
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-5F3D94866D30-ACA559B78D94F",
          "source": {
            "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
            "locator": "D-257 L391"
          },
          "property_type": "STATE",
          "expected": "Créer un nom nouveau ajoute une Catégorie active avec la couleur choisie ; un nom d’une Catégorie active est refusé comme doublon ; un nom d’une Catégorie retirée la réactive avec le même identifiant, ses associations et la couleur choisie.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-AE559A8230D71",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2828"
          },
          "property_type": "STATE",
          "expected": "Créer, modifier ou supprimer une Catégorie n’enregistre pas l’Exercice et conserve tous les autres champs du brouillon.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-AB9BD9AC9991B",
          "source": {
            "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
            "locator": "L926 ; C13 CE-UI-09 L2804"
          },
          "property_type": "RELATION",
          "expected": "Dans l’éditeur d’Exercice, la pilule de la Catégorie sélectionnée affiche sa pastille colorée de 26 avant son nom et en suit la couleur après une modification.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-AA0B74A61E212",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "§4.10 L133 ; CE-UI-09 L2808"
          },
          "property_type": "INTERACTION",
          "expected": "En création comme en modification d’une Catégorie, la palette s’affiche dans le flux de la carte sans recouvrir le champ ni les actions ; clavier affiché ou masqué, Annuler et Ajouter / Enregistrer restent entièrement visibles et utilisables ; la couleur touchée reste sélectionnée et n’est appliquée que par Ajouter / Enregistrer.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A4BEE35F8C506",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2808"
          },
          "property_type": "RESPONSIVE",
          "expected": "La liste des Catégories de la modale défile quel que soit le nombre d’entrées, toutes restant atteignables ; un nom long reste accessible sans troncature et le texte agrandi ne réduit pas la police, clavier affiché ou masqué.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A14AB0BC67228",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "§4.10 L135"
          },
          "property_type": "CONTENT",
          "expected": "Le message de suppression diffère selon l’usage : valeur utilisée → elle disparaît des nouveaux choix mais reste attachée aux objets existants avec son nom et sa dernière couleur, l’historique restant inchangé ; valeur non utilisée → message sans mention d’objets existants.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A2B92152E7B5A",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2808, L2840"
          },
          "property_type": "CONTENT",
          "expected": "Le titre de la modale est exposé comme en-tête accessible ; chaque Catégorie annonce son nom et son état sélectionné ; sa couleur est toujours accompagnée du nom ; Annuler, Modifier et Supprimer ont des libellés accessibles ; le focus reste confiné à la modale ouverte, passe au dialogue puis revient à la liste.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A511139B9E9D8",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "§4.10 L137 ; C09 L928"
          },
          "property_type": "STATE",
          "expected": "Les dix Catégories prédéfinies fournies par KODJO sont renommables, recolorables et supprimables comme les Catégories créées ; aucune opération n’est conditionnée par isPredefined.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A5329EB33376E",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2804 ; D-228"
          },
          "property_type": "STYLE",
          "expected": "Modale de sélection et palette au rendu des frames 4332:7095 et 4474:7157.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-AFF7326FFD33C",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2816"
          },
          "property_type": "STATE",
          "expected": "Modifier renomme sans changer l’identifiant et change la couleur ; nom et couleur sont repris par les objets courants qui l’utilisent.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A3309C3508823",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "§4.10 L138"
          },
          "property_type": "INTERACTION",
          "expected": "Pour Catégorie, Zone et Étiquette, après Supprimer la modale de sélection reste ouverte et la valeur supprimée en est absente.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A7819D6C3521A",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "§4.10 L134"
          },
          "property_type": "CONTENT",
          "expected": "Pour Catégorie, Zone et Étiquette, la confirmation de suppression a pour titre exact « Supprimer « {nom} » ? » avec le nom courant de la valeur.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-AFAD4FDE13E6D",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2812, L2836 ; CE-T03-16 L1665, L1673"
          },
          "property_type": "STATE",
          "expected": "Pour Catégorie, Zone et Étiquette, un nom vide ou invalide affiche une erreur liée au champ en conservant la saisie et la modale ; un échec d’écriture d’une opération de référentiel affiche un message, laisse la modale ouverte, ne modifie pas partiellement le référentiel et conserve le brouillon de l’Exercice ou de la Séance.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A6F2EDD689C0C",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "§4.10 L136, L139"
          },
          "property_type": "STATE",
          "expected": "Supprimer confirmé retire la Catégorie des choix ; une affectation existante reste sélectionnée et est conservée à l’enregistrement ; aucune nouvelle affectation à la valeur retirée n’est permise ; Annuler ne modifie rien.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A3E42865336F9",
          "source": {
            "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
            "locator": "D-259 L393"
          },
          "property_type": "INTERACTION",
          "expected": "Un appui long ouvre le dialogue Annuler / Modifier / Supprimer sans modifier la sélection.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A401685B96614",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2816 ; D-222"
          },
          "property_type": "INTERACTION",
          "expected": "Un toucher sur une Catégorie active la sélectionne et ferme la modale, sans bouton de validation supplémentaire.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-AB685102EBAED",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2836"
          },
          "property_type": "STATE",
          "expected": "Une Catégorie retirée entre lecture et choix provoque un message et conserve le brouillon de l’Exercice.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "criterion_id": "UI-60B2C84BF572",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-T03-16 L1605–1691 ; CE-T03-08 L879–927",
        "requirement": "Étiquette de Séance : zéro ou une, choix au toucher, désaffectation par nouveau toucher, administration du référentiel avec couleur, affectation enregistrée seulement à Continuer."
      },
      "risk_types": [
        "ACCESSIBILITY",
        "FUNCTIONAL",
        "VISUAL"
      ],
      "reuse_search": [
        "src/features/sessions/CompositionScreen.tsx",
        "src/features/sessions/ColorPalette.tsx"
      ],
      "component_decision": "CREATE",
      "selected_component": {
        "path": "NONE",
        "export": "NONE"
      },
      "decision_justification": "Aucun sélecteur d’Étiquette n’existe ; le panneau Catégorie ne doit pas être réutilisé (CE-T03-16 L1642). Le sélecteur étant une pastille colorée, l’identification non fondée sur la seule couleur est portée par le nouveau composant.",
      "change_targets": [
        "src/features/reference-data/LabelPickerModal.tsx",
        "src/shared/i18n/resources/fr.ts",
        "src/features/sessions/CompositionScreen.tsx",
        "src/features/sessions/ColorPalette.tsx"
      ],
      "tests": [
        "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
        "src/features/sessions/__tests__/CompositionScreen.test.tsx",
        "src/shared/i18n/index.test.ts",
        "src/features/sessions/__tests__/ColorPalette.test.tsx"
      ],
      "proof_required": [
        "ACCESSIBILITY_CHECK",
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-60B2C84BF572-AAA09A554B75D",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "§4.10 L138, L139"
          },
          "property_type": "STATE",
          "expected": "Après Supprimer, la modale d’Étiquettes reste ouverte et l’Étiquette en est absente ; si elle était affectée à la Séance, l’affectation existante reste sélectionnée et est conservée à Continuer.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-A2CD59253F74A",
          "source": {
            "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
            "locator": "D-257 L391"
          },
          "property_type": "STATE",
          "expected": "Créer un nom nouveau ajoute une Étiquette avec la couleur choisie ; un nom actif est refusé ; un nom retiré la réactive avec son identifiant, ses Séances associées et la couleur choisie ; Modifier renomme et recolore sans changer l’identifiant.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-A5905FEFAED8D",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-T03-16 L1609, L1677"
          },
          "property_type": "CONTENT",
          "expected": "Dans la Composition, l’Étiquette sélectionnée apparaît avec sa pastille colorée et son nom ; sans Étiquette, le contrôle montre l’icône d’étiquette au trait, sans remplissage de couleur.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-AF726088ADFDB",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-T03-16 L1645 ; §4.10 L133"
          },
          "property_type": "INTERACTION",
          "expected": "En création comme en modification d’une Étiquette, la palette s’affiche dans le flux de la carte sans recouvrir le champ ni les actions ; clavier affiché ou masqué, Annuler et Ajouter / Enregistrer restent entièrement visibles et utilisables ; la couleur touchée reste sélectionnée et n’est appliquée que par Ajouter / Enregistrer.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-A36A27047D84D",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-T03-16 L1665 ; CE-T03-08 L927"
          },
          "property_type": "STATE",
          "expected": "L’affectation est enregistrée seulement à Continuer ; les opérations du référentiel n’enregistrent pas la Séance ; la couleur de la Séance suit l’Étiquette.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-AEC754D3ABC2D",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-T03-16 L1645"
          },
          "property_type": "RESPONSIVE",
          "expected": "La feuille d’Étiquettes reste limitée à la zone sûre ; sa liste défile quel que soit le nombre d’Étiquettes, toutes restant atteignables ; son titre n’est pas tronqué et le texte agrandi ne réduit pas la police.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-A7552EF457EC4",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-T03-16 L1677"
          },
          "property_type": "CONTENT",
          "expected": "Le titre de la modale est exposé comme en-tête accessible ; chaque Étiquette annonce son nom, son état sélectionné et l’action proposée (choisir ou retirer) ; la couleur n’est jamais le seul identifiant, le nom étant toujours présent ; le focus est captif dans le dialogue de confirmation puis revient à l’Étiquette ou à la liste ; le bouton destructif est nommé Supprimer.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-AE0DDBADC6EBD",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-T03-16 L1641"
          },
          "property_type": "STYLE",
          "expected": "Modale d’Étiquettes et palette au rendu des frames 2028:11204, 4581:6404 et 4640:6308.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-A7700E70E6779",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-T03-16 L1653 ; D-259 L393"
          },
          "property_type": "INTERACTION",
          "expected": "Un appui long ouvre le dialogue Annuler / Modifier / Supprimer sans sélectionner ni désaffecter.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-AB96F73DEE9E5",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-T03-16 L1621 ; D-259 L393"
          },
          "property_type": "INTERACTION",
          "expected": "Un toucher sur une Étiquette la sélectionne et ferme la modale ; un nouveau toucher sur l’Étiquette sélectionnée retire l’affectation.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "criterion_id": "UI-82B1544AE5AE",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-07 L2494–2582",
        "requirement": "Profil : quatre préférences locales et six valeurs initiales distinctes (Exercice : Pause entre les côtés, Compte à rebours d’exercice, Fin d’exercice ; Séance : Récupération après exercice, Compte à rebours initial, Fin de séance), modifiées par steppers et enregistrées immédiatement, sans rétroactivité."
      },
      "risk_types": [
        "ACCESSIBILITY",
        "FUNCTIONAL",
        "VISUAL"
      ],
      "reuse_search": [
        "app/(tabs)/profile.tsx",
        "src/shared/ui/PlaceholderScreen.tsx",
        "src/features/sessions/NumberWheelPicker.tsx",
        "src/shared/ui/SegmentedControl.tsx"
      ],
      "component_decision": "CREATE",
      "selected_component": {
        "path": "NONE",
        "export": "NONE"
      },
      "decision_justification": "Aucun écran Profil ni stepper Profil n’existe ; les roulettes d’Exercice sont exclues du Profil (CE-UI-07 L2533).",
      "change_targets": [
        "app/(tabs)/profile.tsx",
        "src/features/preferences/ProfileScreen.tsx",
        "src/features/preferences/ProfileService.ts",
        "src/features/preferences/ProfileServiceContext.tsx",
        "src/features/preferences/notificationPermission.ts",
        "src/shared/ui/ProfileStepper.tsx",
        "src/shared/i18n/resources/fr.ts"
      ],
      "tests": [
        "src/features/preferences/__tests__/ProfileScreen.test.tsx",
        "src/features/preferences/__tests__/ProfileService.test.ts",
        "src/shared/ui/__tests__/ProfileStepper.test.tsx",
        "src/shared/i18n/index.test.ts"
      ],
      "proof_required": [
        "ACCESSIBILITY_CHECK",
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-82B1544AE5AE-AC30635CFA2E2",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2540, L2568"
          },
          "property_type": "STATE",
          "expected": "À la borne basse le bouton − est inactif, à la borne haute le bouton + est inactif, et la borne est annoncée.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-ABCC35BD82254",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2544, L2564"
          },
          "property_type": "STATE",
          "expected": "Aucune demande de permission système n’est faite depuis le Profil ; un état de permission refusé n’affiche jamais Notifications actif.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A52DF543B99EA",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2532"
          },
          "property_type": "STYLE",
          "expected": "Chaque groupe du Profil (Exercice, Séance, Préférences) a un fond #FCFCFE, un liseré blanc de 1, un rayon de 12 et une ombre non rognée ; ces valeurs du chapitre 13 s’appliquent aux groupes, le bord 0,5 / rayon 8 de DSF-CARTES L30 ne concernant que les cartes.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A7FA3A379BF2A",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2568"
          },
          "property_type": "CONTENT",
          "expected": "Chaque ligne d’interrupteur forme un seul élément accessible de rôle interrupteur qui annonce son nom et son état ; chaque stepper annonce sa valeur, son unité et ses bornes.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A099ECB62F6C2",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2544, L2556, L2560"
          },
          "property_type": "STATE",
          "expected": "Chaque modification est persistée immédiatement et relue après réouverture ; les cinq autres valeurs ne changent pas.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A5C9F2515F26D",
          "source": {
            "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
            "locator": "D-265 L417 ; D-256 L390"
          },
          "property_type": "STATE",
          "expected": "Compte à rebours initial et Fin de séance (valeurs par défaut du Profil) : 0 à 60 s, pas 1 s ; Compte à rebours d’un exercice et Fin d’exercice : 0 à 60 s, pas 1 s.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-ABADF584DFF42",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2532 ; D-267"
          },
          "property_type": "STYLE",
          "expected": "Dans chaque groupe du Profil, un séparateur horizontal au style de séparateur de référence (colors.divider) sépare deux lignes consécutives — dans le groupe Exercice : entre Pause entre les côtés et Compte à rebours d’un exercice, puis entre Compte à rebours d’un exercice et Fin d’exercice ; aucun séparateur avant la première ni après la dernière ligne.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A883EF13D880B",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2522"
          },
          "property_type": "PRESENCE",
          "expected": "En tête du Profil, avant les groupes, un bloc Identité affiche la photo enregistrée ou les initiales, le nom d’affichage et l’action Modifier, qui ouvre Modifier le profil.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AF03239AB16DE",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2536"
          },
          "property_type": "RESPONSIVE",
          "expected": "La zone centrale du Profil défile au-dessus de la navigation basse fixe, avec une marge finale égale à la hauteur de la navigation plus 16 : le bloc Identité, les six réglages et les quatre interrupteurs restent atteignables et entièrement visibles, y compris en texte agrandi.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AD4B7683C4D37",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2514 ; D-266"
          },
          "property_type": "PRESENCE",
          "expected": "Le groupe Exercice affiche Pause entre les côtés, Compte à rebours d’un exercice et Fin d’exercice, ce libellé valant aussi pour les libellés accessibles ; le groupe Séance affiche Récupération après exercice, Compte à rebours initial et Fin de séance ; aucune Pause globale entre Séries.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AC6475C2EF08A",
          "source": {
            "path": "docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md",
            "locator": "L93–100"
          },
          "property_type": "STATE",
          "expected": "Pause entre les côtés et Récupération : 0 à 300 s sur la grille 0,1,2,3,4,5,10,15…120,150,180…300 ; une valeur stockée hors grille n’est pas arrondie à l’affichage, + passe à la valeur de grille supérieure et − à la valeur inférieure.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A3B2D83AEBA4C",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2556 ; C08 L1103"
          },
          "property_type": "INTERACTION",
          "expected": "Quitter le Profil (onglet, bouton ou geste de retour) ne déclenche aucun dialogue de confirmation ni garde de sortie : chaque préférence étant déjà enregistrée, le retour est immédiat.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A5F5915E3CDE5",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2518"
          },
          "property_type": "STATE",
          "expected": "Sans modification, les six valeurs affichées sont 10 s, 10 s, 5 s, 30 s, 10 s et 5 s.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AFC3E32D05CDD",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2514, L2518, L2572"
          },
          "property_type": "STATE",
          "expected": "Sons, Annonces vocales et Vibration sont activés et Notifications désactivé par défaut ; chaque interrupteur est indépendant et relu après réouverture.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AA246BAA18DCA",
          "source": {
            "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
            "locator": "D-227"
          },
          "property_type": "STYLE",
          "expected": "Stepper au rendu lavande DSF remplaçant la valeur sur sa ligne ; un seul stepper ouvert à la fois.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AEC3D0B5DBEED",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2532"
          },
          "property_type": "PRESENCE",
          "expected": "Toutes les durées du Profil se règlent par ProfileStepper ; aucune roulette d’Exercice (DurationWheelPicker, NumberWheelPicker) n’est rendue dans le Profil.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A26F50F53FF85",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2548"
          },
          "property_type": "INTERACTION",
          "expected": "Un appui incrémente immédiatement ; un maintien répète après 450 ms puis toutes les 150 ms et s’arrête au relâchement ; un seul enregistrement par geste.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A0BE2534283C6",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2564"
          },
          "property_type": "STATE",
          "expected": "Un échec d’écriture affiche une erreur et restitue la dernière valeur confirmée.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AC69E12A6D296",
          "source": {
            "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
            "locator": "D-265 L417"
          },
          "property_type": "STATE",
          "expected": "Une valeur par défaut de Compte à rebours initial ou de Fin de séance déjà enregistrée au-delà de 60 s est affichée et conservée telle quelle, sans réécriture ni plafonnement à la lecture ; « + » est inactif et « − » la ramène d’abord à 60 s, puis suit le pas de 1 s.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "criterion_id": "UI-96E7FD739BF0",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-01 L1964–2050",
        "requirement": "Modifier le profil : nom d’affichage, photo locale facultative choisie dans la galerie et silhouette facultative homme/femme, dans un brouillon enregistré par Enregistrer ; la silhouette ne modifie que l’icône des Zones corporelles."
      },
      "risk_types": [
        "ACCESSIBILITY",
        "FUNCTIONAL",
        "VISUAL"
      ],
      "reuse_search": [
        "app/_layout.tsx",
        "src/features/sessions/DecisionDialog.tsx",
        "src/shared/ui/KodjoIcon.tsx",
        "src/features/sessions/useCompositionExitGuard.ts",
        "src/features/sessions/ExerciseExitConfirmModal.tsx",
        "src/features/sessions/AbandonCreationModal.tsx"
      ],
      "component_decision": "CREATE",
      "selected_component": {
        "path": "NONE",
        "export": "NONE"
      },
      "decision_justification": "Aucun écran d’identité ni sélecteur de photo n’existe ; l’écran est créé. Sa garde de sortie réutilise sans modification le patron canonique : useCompositionExitGuard(shouldBlock, onConfirmExit) importé tel quel et DecisionDialog, comme ExerciseExitConfirmModal ; cette modale n’est pas réutilisée telle quelle car son message porte sur un exercice. Les icônes de silhouette (6322:10874, 6322:10877, #287) sont enregistrées dans le registre KodjoIcon existant.",
      "change_targets": [
        "app/profile-edit.tsx",
        "app/_layout.tsx",
        "src/features/preferences/ProfileEditScreen.tsx",
        "src/features/preferences/profilePhoto.ts",
        "src/shared/ui/BodyZoneIcon.tsx",
        "src/shared/ui/KodjoIcon.tsx"
      ],
      "tests": [
        "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
        "src/features/preferences/__tests__/profilePhoto.test.ts",
        "src/shared/ui/__tests__/BodyZoneIcon.test.tsx",
        "app/__tests__/rootLayoutGesture.test.tsx"
      ],
      "proof_required": [
        "ACCESSIBILITY_CHECK",
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-96E7FD739BF0-AACD685D38747",
          "source": {
            "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
            "locator": "D-258 L392"
          },
          "property_type": "INTERACTION",
          "expected": "Ajouter une photo ouvre uniquement la galerie ; une annulation ne modifie pas le brouillon ; une image choisie est copiée dans le stockage local persistant de l’app.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-A6C731DD19268",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L1980"
          },
          "property_type": "STATE",
          "expected": "Annuler l’abandon ferme le dialogue, reste sur Modifier le profil et conserve le brouillon ; confirmer l’abandon restaure les valeurs enregistrées et revient au Profil.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-AD7703C936790",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L1980, L2024, L2032"
          },
          "property_type": "STATE",
          "expected": "Enregistrer persiste nom, photo et silhouette ensemble ; l’abandon restaure les valeurs enregistrées ; un échec d’enregistrement ne modifie rien.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-A7EFE96EAC23A",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2804 ; DSF RG-5, RG-10"
          },
          "property_type": "RELATION",
          "expected": "L’icône de Zone corporelle utilise la variante correspondant à la silhouette ; aucune donnée, liste ni calcul ne change.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-AB155053543ED",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L2036"
          },
          "property_type": "CONTENT",
          "expected": "Les choix sont annoncés Silhouette homme et Silhouette femme avec leur état sélectionné.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-A202F52482AC0",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L2004"
          },
          "property_type": "RESPONSIVE",
          "expected": "Modifier le profil défile dans les Safe Areas : la photo, le champ Nom d’affichage, les deux silhouettes et Enregistrer restent entièrement atteignables et utilisables, clavier affiché ou masqué, et en texte agrandi sans réduction de police.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-AC99FCD6BEC3F",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L2000"
          },
          "property_type": "STYLE",
          "expected": "Silhouettes dans deux cercles de 64, hauteur 44, écart 24 ; choisie en bleu #0508E5 contour 2, non choisie en gris #9499A8 contour #CCD1E0.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-A3846B911456D",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L2020, L2032"
          },
          "property_type": "STATE",
          "expected": "Un nom de 1 ou 80 caractères est accepté ; un nom vide ou de 81 caractères affiche une erreur liée au champ et l’écran reste ouvert.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-A3E197595DF4F",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L1980"
          },
          "property_type": "INTERACTION",
          "expected": "Un retour (bouton ou geste) avec un brouillon modifié est intercepté par useCompositionExitGuard et propose l’abandon dans DecisionDialog ; sans modification, le retour revient au Profil sans dialogue.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-ADA643B3F4D1A",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L2032"
          },
          "property_type": "STATE",
          "expected": "Une photo absente ou introuvable affiche les initiales sans bloquer les champs ; un échec de lecture ou de copie affiche un message et conserve le brouillon.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-A38AD88125DB2",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L1984, L2028"
          },
          "property_type": "STATE",
          "expected": "Une silhouette absente est affichée homme ; femme choisie puis enregistrée est relue après réouverture.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "criterion_id": "UI-B2989CC78067",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-07 L2544, L2560 ; matrice §5.4",
        "requirement": "Branchement réel des services Profil et référentiels et initialisation des nouveaux objets depuis le Profil, sans rétroactivité."
      },
      "risk_types": [
        "FUNCTIONAL"
      ],
      "reuse_search": [
        "src/features/sessions/SessionServiceProvider.tsx",
        "src/features/sessions/SessionDraftProvider.tsx"
      ],
      "component_decision": "EXTEND",
      "selected_component": {
        "path": "src/features/sessions/SessionServiceProvider.tsx",
        "export": "SessionServiceProvider"
      },
      "decision_justification": "Le fournisseur existant construit déjà les services sur la connexion SQLite hors SQLiteProvider ; il est étendu.",
      "change_targets": [
        "src/features/sessions/SessionServiceProvider.tsx",
        "src/features/sessions/SessionService.ts",
        "src/features/sessions/SessionDraftProvider.tsx",
        "src/features/sessions/SessionDraftContext.tsx",
        "src/features/activities/ActivitySelectionScreen.tsx",
        "src/features/sessions/ExerciseScreen.tsx",
        "src/domain/activities/ActivityDefinition.ts"
      ],
      "tests": [
        "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
        "src/features/sessions/__tests__/SessionService.test.ts",
        "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
        "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
        "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
        "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
        "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
        "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
        "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
        "src/domain/activities/__tests__/ActivityDefinition.test.ts",
        "src/domain/sessions/__tests__/composition.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "assertions": [
        {
          "assertion_id": "UI-B2989CC78067-A08668FEC0C22",
          "source": {
            "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
            "locator": "D-213"
          },
          "property_type": "STATE",
          "expected": "Après modification du Profil, les objets existants et les brouillons déjà initialisés gardent leurs valeurs ; seuls les nouveaux objets reçoivent la nouvelle valeur.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-B2989CC78067-AB0441B530FE9",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2560 ; matrice §5.4"
          },
          "property_type": "STATE",
          "expected": "Avec le vrai fournisseur et une base migrée, les services Profil et référentiels lisent et écrivent la base ; aucun écran n’appelle le contexte SQLite.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        },
        {
          "assertion_id": "UI-B2989CC78067-A8F55F3F1D3B6",
          "source": {
            "path": "docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md",
            "locator": "L259 ; C13 CE-T03-08 L883"
          },
          "property_type": "STATE",
          "expected": "Déplacer ou dupliquer une occurrence conserve sa propre Récupération après exercice ; la copie ne relit pas le Profil, même si le Profil a changé depuis ; supprimer l’occurrence supprime sa valeur.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-B2989CC78067-A06FE3354DAE2",
          "source": {
            "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
            "locator": "L844 ; V12 L86 ligne 7 ; C04 L251"
          },
          "property_type": "STATE",
          "expected": "Un nouvel Exercice du Catalogue créé Sans changement (unilatéral) garde une Pause entre les côtés de 0 s et ne reçoit pas la valeur du Profil ; passer de Sans changement à D→G ou G→D copie la Pause entre les côtés du Profil ; passer de D→G à G→D conserve la valeur courante ; un Exercice existant déjà bilatéral garde sa valeur à l’ouverture.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-B2989CC78067-AC9DBDF9DEB90",
          "source": {
            "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
            "locator": "L864 ; D-004"
          },
          "property_type": "STATE",
          "expected": "Une nouvelle Séance reçoit Compte à rebours initial et Fin de séance du Profil ; un brouillon neuf n’est pas considéré modifié.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-B2989CC78067-A3DE880FD82B1",
          "source": {
            "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
            "locator": "D-171 ; D-213"
          },
          "property_type": "STATE",
          "expected": "Une occurrence créée par insertion depuis le Catalogue ou comme Exercice local, en création comme en modification de Séance, reçoit la Récupération du Profil ; la valeur saisie est conservée à l’enregistrement ; aucune définition du Catalogue ne la reçoit.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    }
  ],
  "preservation": {
    "preserve": [
      {
        "target": "src/infrastructure/database/migrations/migration001.ts",
        "justification": "Migration déjà appliquée : octets inchangés.",
        "locator": {
          "kind": "PATH",
          "path": "src/infrastructure/database/migrations/migration001.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/infrastructure/database/migrations/migration002.ts",
        "justification": "Migration déjà appliquée : octets inchangés.",
        "locator": {
          "kind": "PATH",
          "path": "src/infrastructure/database/migrations/migration002.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/infrastructure/database/migrations/migration003.ts",
        "justification": "Migration déjà appliquée : octets inchangés.",
        "locator": {
          "kind": "PATH",
          "path": "src/infrastructure/database/migrations/migration003.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/infrastructure/database/migrations/migration004.ts",
        "justification": "Migration déjà appliquée : octets inchangés.",
        "locator": {
          "kind": "PATH",
          "path": "src/infrastructure/database/migrations/migration004.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/infrastructure/database/migrations/migration005.ts",
        "justification": "Migration déjà appliquée : octets inchangés.",
        "locator": {
          "kind": "PATH",
          "path": "src/infrastructure/database/migrations/migration005.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/infrastructure/database/migrations/migration006.ts",
        "justification": "Migration déjà appliquée : octets inchangés.",
        "locator": {
          "kind": "PATH",
          "path": "src/infrastructure/database/migrations/migration006.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/infrastructure/database/migrations/migration007.ts",
        "justification": "Migration déjà appliquée : octets inchangés.",
        "locator": {
          "kind": "PATH",
          "path": "src/infrastructure/database/migrations/migration007.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/features/reference-data/bodyZones.ts",
        "justification": "Seed historique des Zones, gelé.",
        "locator": {
          "kind": "PATH",
          "path": "src/features/reference-data/bodyZones.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/domain/categories/defaults.ts",
        "justification": "Catégories prédéfinies gelées.",
        "locator": {
          "kind": "PATH",
          "path": "src/domain/categories/defaults.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/domain/categories/validation.ts",
        "justification": "Clé normalisée gelée et réutilisée.",
        "locator": {
          "kind": "PATH",
          "path": "src/domain/categories/validation.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/domain/sessions/calculations.ts",
        "justification": "Calculs hors PRE-2 (PRE-3, #282, #283).",
        "locator": {
          "kind": "PATH",
          "path": "src/domain/sessions/calculations.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/features/sessions/compositionPresentation.ts",
        "justification": "Présentation de Composition hors PRE-2.",
        "locator": {
          "kind": "PATH",
          "path": "src/features/sessions/compositionPresentation.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/features/sessions/formatSessionSummary.ts",
        "justification": "Résumé hors PRE-2.",
        "locator": {
          "kind": "PATH",
          "path": "src/features/sessions/formatSessionSummary.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/features/sessions/DurationWheelPicker.tsx",
        "justification": "Roulettes et haptique indépendantes de Vibration (D-076).",
        "locator": {
          "kind": "PATH",
          "path": "src/features/sessions/DurationWheelPicker.tsx",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/features/sessions/NumberWheelPicker.tsx",
        "justification": "Roulettes et haptique indépendantes de Vibration (D-076).",
        "locator": {
          "kind": "PATH",
          "path": "src/features/sessions/NumberWheelPicker.tsx",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/features/activities/ActivityCard.tsx",
        "justification": "Refonte des cartes exclue.",
        "locator": {
          "kind": "PATH",
          "path": "src/features/activities/ActivityCard.tsx",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/features/sessions/SessionCard.tsx",
        "justification": "Refonte des cartes exclue.",
        "locator": {
          "kind": "PATH",
          "path": "src/features/sessions/SessionCard.tsx",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/features/activities/ActivityDefinitionService.ts",
        "justification": "Listes existantes conservées ; opérations de référentiel dans un nouveau service.",
        "locator": {
          "kind": "PATH",
          "path": "src/features/activities/ActivityDefinitionService.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/features/sessions/useCompositionExitGuard.ts",
        "justification": "Garde de sortie canonique réutilisée par import, sans modification.",
        "locator": {
          "kind": "PATH",
          "path": "src/features/sessions/useCompositionExitGuard.ts",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "src/features/sessions/ExerciseExitConfirmModal.tsx",
        "justification": "Dialogue d’abandon de l’Exercice inchangé ; même patron pour Modifier le profil.",
        "locator": {
          "kind": "PATH",
          "path": "src/features/sessions/ExerciseExitConfirmModal.tsx",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "Valeurs des quatre défauts du Profil lues par la migration de PRE-1",
        "justification": "Les quatre constantes existantes du Profil restent 10, 30, 10 et 5 secondes.",
        "locator": {
          "kind": "SEMANTIC",
          "path": "NONE",
          "symbol": "NONE",
          "invariant_type": "SEMANTIC_REVIEW",
          "expected": "UNCHANGED",
          "semantic_justification": "La migration de la tranche précédente lit ces constantes pour semer le Profil ; toute modification changerait le schéma déjà installé sur les appareils."
        }
      }
    ],
    "change": [
      {
        "target": "Profil",
        "justification": "Écrans Profil et Modifier le profil, six défauts, préférences, identité."
      },
      {
        "target": "Référentiels",
        "justification": "Sélecteurs et opérations Catégorie, Zones, Étiquette, dialogue Modifier/Supprimer, réactivation."
      },
      {
        "target": "Initialisation",
        "justification": "Copie des défauts du Profil aux nouveaux objets ; plus d’écrasement de la Récupération à l’enregistrement."
      },
      {
        "target": "Stockage",
        "justification": "Migration additive v8 et liaison des Zones d’occurrence ouverte aux Zones créées."
      }
    ],
    "forbidden": [
      {
        "target": "src/features/execution/README.md",
        "justification": "Aucun module d’Exécution dans PRE-2.",
        "locator": {
          "kind": "PATH",
          "path": "src/features/execution/README.md",
          "symbol": "NONE",
          "invariant_type": "FILE_UNCHANGED",
          "expected": "UNCHANGED",
          "semantic_justification": "NONE"
        }
      },
      {
        "target": "Séries variables, Ordre des côtés et nouveaux calculs",
        "justification": "Affectés à PRE-3 ; suivis par les tickets ouverts.",
        "locator": {
          "kind": "SEMANTIC",
          "path": "NONE",
          "symbol": "NONE",
          "invariant_type": "SEMANTIC_REVIEW",
          "expected": "UNCHANGED",
          "semantic_justification": "Ces règles appartiennent à la tranche suivante et ne doivent apparaître ni dans le stockage ni dans les écrans livrés par cette tranche."
        }
      }
    ]
  }
}
</KODJO_UI_CRITERIA_MATRIX_JSON>

<KODJO_NON_UI_REQUIREMENTS_JSON>
[
  {
    "source": {
      "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
      "locator": "09.1 Entité Utilisateur L145–150 ; préférences L840–865 ; référentiels L885–976",
      "requirement": "Schéma cible v8 : Profil complété (deux défauts de Séance, quatre préférences, identité portée par le singleton profiles, silhouette) ; clé normalisée obligatoire et unique pour Étiquettes et Zones (index UNIQUE et déclencheurs refusant une clé NULL à l’insertion comme à la mise à jour, pour toutes les entrées actives et retirées) ; activity_body_zones reconstruite sans CHECK sur les 10 identifiants, avec activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE conservé, body_zone_id REFERENCES body_zones(id) ON UPDATE RESTRICT ON DELETE RESTRICT et PRIMARY KEY (activity_id, body_zone_id), lignes conservées ; sessions.label_id conservé ; migration additive convergente pour base neuve et base PRE-1 avec données, idempotente, annulée en cas d’erreur."
    },
    "requirement_type": "MIGRATION",
    "change_targets": [
      "src/infrastructure/database/migrations/migration008.ts",
      "src/infrastructure/database/constants.ts",
      "src/infrastructure/database/migrateDatabase.ts",
      "src/infrastructure/database/types/DatabaseRows.ts"
    ],
    "tests": [
      "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "src/infrastructure/database/__tests__/targetSchema.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST",
      "STATIC_ANALYSIS"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
      "locator": "CE-UI-09 L2836 ; §4.10 L140",
      "requirement": "Démarrage et migrations ne recréent ni ne réactivent jamais une valeur retirée ; aucun réensemencement."
    },
    "requirement_type": "TECHNICAL",
    "change_targets": [
      "src/infrastructure/database/migrations/migration008.ts",
      "src/infrastructure/database/migrateDatabase.ts"
    ],
    "tests": [
      "src/infrastructure/database/__tests__/migrateDatabase.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
      "locator": "L885–976 ; L1222–1226",
      "requirement": "Référentiels Étiquette, Catégorie, Zone : lister, créer avec réactivation d’une entrée retirée de même clé normalisée, renommer sans changer l’identifiant, changer la couleur (Étiquette, Catégorie), retirer logiquement ; refuser un doublon actif ; nom non vide après trim et unique selon la normalisation canonique (L885, L915), borné à 40 caractères pour Étiquette et Catégorie et à 1..80 pour une Zone, refusé à la création comme au renommage ; ordre d’affichage déterministe (L917, L955) : Catégories par display_order des prédéfinies puis date de création croissante, Zones dans l’ordre de la liste initiale (L968–977) puis date de création croissante, Étiquettes par date de création croissante, à égalité par ordre d’insertion ; refuser une nouvelle affectation à une valeur retirée tout en conservant les affectations existantes ; opérations atomiques."
    },
    "requirement_type": "FUNCTIONAL",
    "change_targets": [
      "src/domain/labels/Label.ts",
      "src/domain/labels/LabelRepository.ts",
      "src/domain/labels/index.ts",
      "src/domain/categories/CategoryRepository.ts",
      "src/domain/categories/errors.ts",
      "src/domain/categories/index.ts",
      "src/domain/body-zones/BodyZone.ts",
      "src/domain/body-zones/BodyZoneRepository.ts",
      "src/domain/body-zones/index.ts",
      "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
      "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
      "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
      "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
      "src/infrastructure/database/repositories/SqliteSessionRepository.ts"
    ],
    "tests": [
      "src/domain/labels/__tests__/Label.test.ts",
      "src/domain/categories/__tests__/validation.test.ts",
      "src/domain/body-zones/__tests__/BodyZone.test.ts",
      "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
      "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
      "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
      "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
      "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
      "locator": "CE-UI-07 L2514–2564 ; CE-UI-01 L1984–2032",
      "requirement": "Profil : six défauts distincts avec leurs bornes (pauses 0..300 sur grille, phases d’Exercice 0..60 pas 1, valeurs par défaut des phases de Séance 0..60 pas 1 (D-265), une valeur enregistrée au-delà de 60 conservée sans réécriture ni plafonnement), quatre préférences, nom 1..80 ou absent, photo, silhouette homme/femme ou absente ; lecture et mises à jour atomiques."
    },
    "requirement_type": "DATA",
    "change_targets": [
      "src/domain/preferences/Profile.ts",
      "src/domain/preferences/ProfileRepository.ts",
      "src/domain/preferences/index.ts",
      "src/infrastructure/database/repositories/SqliteProfileRepository.ts"
    ],
    "tests": [
      "src/domain/preferences/__tests__/Profile.test.ts",
      "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
      "locator": "D-213",
      "requirement": "Fonctions de brouillon recevant les valeurs initiales du Profil (Séance, occurrence), règle pure de copie de la Pause entre les côtés du Profil à l’activation bilatérale d’un Exercice, et détection de modification relative au brouillon initial réellement créé."
    },
    "requirement_type": "FUNCTIONAL",
    "change_targets": [
      "src/domain/sessions/SessionDraft.ts",
      "src/domain/sessions/defaults.ts",
      "src/domain/activities/ActivityDefinition.ts"
    ],
    "tests": [
      "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "src/domain/activities/__tests__/ActivityDefinition.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md",
      "locator": "L251 ; L259",
      "requirement": "Pause entre les côtés pertinente uniquement en D→G/G→D : initialisée depuis le Profil à l’activation D→G ou G→D, jamais pour un Exercice unilatéral. Récupération après exercice propre à chaque occurrence : initialisée à sa création depuis le défaut global, puis indépendante ; elle se déplace, se duplique et se supprime avec l’occurrence."
    },
    "requirement_type": "FUNCTIONAL",
    "change_targets": [
      "src/domain/activities/ActivityDefinition.ts",
      "src/features/sessions/ExerciseScreen.tsx",
      "src/features/sessions/SessionService.ts",
      "src/domain/sessions/SessionDraft.ts"
    ],
    "tests": [
      "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "src/features/sessions/__tests__/SessionService.test.ts",
      "src/domain/sessions/__tests__/composition.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md",
      "locator": "L93–100",
      "requirement": "Grille des pauses 0..300 s (pas 1 s jusqu’à 5 s, 5 s jusqu’à 120 s, 30 s jusqu’à 300 s) pour Pause entre les côtés et Récupération du Profil : fonctions de Domaine valeur de grille supérieure et inférieure, bornes inchangées ; une valeur stockée hors grille n’est jamais arrondie par la lecture ou l’ouverture."
    },
    "requirement_type": "DATA",
    "change_targets": [
      "src/domain/preferences/Profile.ts"
    ],
    "tests": [
      "src/domain/preferences/__tests__/Profile.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST"
    ],
    "status": "DEFINED"
  },
  {
    "source": {
      "path": "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md",
      "locator": "Profil L1076–1103",
      "requirement": "Nom d’affichage de 1 à 80 caractères à l’enregistrement (borne à laquelle renvoie CE-UI-01 §14) ; préférence Vibration limitée aux vibrations fonctionnelles de séance, sans effet sur le retour haptique des roulettes numériques ; toute modification du Profil enregistrée immédiatement et sans incidence sur les Séances existantes ; quitter l’écran Profil ne demande aucune confirmation, les modifications étant déjà enregistrées (L1103) ; tous les textes utilisateur et libellés d’accessibilité des écrans, modales, dialogues et steppers livrés utilisent les clés de traduction centralisées (Langue du MVP, L1098)."
    },
    "requirement_type": "FUNCTIONAL",
    "change_targets": [
      "src/domain/preferences/Profile.ts",
      "src/features/preferences/ProfileService.ts",
      "src/features/preferences/ProfileScreen.tsx",
      "src/shared/i18n/resources/fr.ts"
    ],
    "tests": [
      "src/domain/preferences/__tests__/Profile.test.ts",
      "src/features/preferences/__tests__/ProfileService.test.ts",
      "src/features/preferences/__tests__/ProfileScreen.test.tsx",
      "src/shared/i18n/index.test.ts"
    ],
    "no_automated_test_reason": "NONE",
    "proof_required": [
      "FUNCTIONAL_TEST",
      "STATIC_ANALYSIS"
    ],
    "status": "DEFINED"
  }
]
</KODJO_NON_UI_REQUIREMENTS_JSON>

<KODJO_NON_UI_COVERAGE_JSON>
{
  "status": "ENUMERATED",
  "reason": "Exigences non UI de stockage, de référentiels, de Profil et de brouillons tirées des chapitres 09, 13, 04 et 08, du registre 07 et de la spécification v12 ; la DSF cartes ne porte que des exigences de rendu, couvertes par les critères UI.",
  "source_paths": [
    "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
    "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
    "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
    "docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md",
    "docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md",
    "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md"
  ]
}
</KODJO_NON_UI_COVERAGE_JSON>

<KODJO_REQUIREMENT_CONTRACT_JSON>
{
  "schema": "kodjo.requirement-contract.v1",
  "requirement_count": 14,
  "requirement_ids_sha256": "e234fab2288ef09e591c54509c6c73ae77e125cdd8ab5aaa8654624183bd6eae",
  "requirements": [
    {
      "requirement_id": "REQ-0FBEF4DDBFAD3BC6",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-T03-16 L1605–1691 ; CE-T03-08 L879–927",
        "requirement": "Étiquette de Séance : zéro ou une, choix au toucher, désaffectation par nouveau toucher, administration du référentiel avec couleur, affectation enregistrée seulement à Continuer."
      },
      "change_targets": [
        "src/features/reference-data/LabelPickerModal.tsx",
        "src/features/sessions/ColorPalette.tsx",
        "src/features/sessions/CompositionScreen.tsx",
        "src/shared/i18n/resources/fr.ts"
      ],
      "tests": [
        "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
        "src/features/sessions/__tests__/ColorPalette.test.tsx",
        "src/features/sessions/__tests__/CompositionScreen.test.tsx",
        "src/shared/i18n/index.test.ts"
      ],
      "proof_required": [
        "ACCESSIBILITY_CHECK",
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-60B2C84BF572",
        "component_decision": "CREATE",
        "selected_component": {
          "path": "NONE",
          "export": "NONE"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-60B2C84BF572-AAA09A554B75D",
          "property_type": "STATE",
          "expected": "Après Supprimer, la modale d’Étiquettes reste ouverte et l’Étiquette en est absente ; si elle était affectée à la Séance, l’affectation existante reste sélectionnée et est conservée à Continuer.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-A2CD59253F74A",
          "property_type": "STATE",
          "expected": "Créer un nom nouveau ajoute une Étiquette avec la couleur choisie ; un nom actif est refusé ; un nom retiré la réactive avec son identifiant, ses Séances associées et la couleur choisie ; Modifier renomme et recolore sans changer l’identifiant.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-A5905FEFAED8D",
          "property_type": "CONTENT",
          "expected": "Dans la Composition, l’Étiquette sélectionnée apparaît avec sa pastille colorée et son nom ; sans Étiquette, le contrôle montre l’icône d’étiquette au trait, sans remplissage de couleur.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-AF726088ADFDB",
          "property_type": "INTERACTION",
          "expected": "En création comme en modification d’une Étiquette, la palette s’affiche dans le flux de la carte sans recouvrir le champ ni les actions ; clavier affiché ou masqué, Annuler et Ajouter / Enregistrer restent entièrement visibles et utilisables ; la couleur touchée reste sélectionnée et n’est appliquée que par Ajouter / Enregistrer.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-A36A27047D84D",
          "property_type": "STATE",
          "expected": "L’affectation est enregistrée seulement à Continuer ; les opérations du référentiel n’enregistrent pas la Séance ; la couleur de la Séance suit l’Étiquette.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-AEC754D3ABC2D",
          "property_type": "RESPONSIVE",
          "expected": "La feuille d’Étiquettes reste limitée à la zone sûre ; sa liste défile quel que soit le nombre d’Étiquettes, toutes restant atteignables ; son titre n’est pas tronqué et le texte agrandi ne réduit pas la police.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-A7552EF457EC4",
          "property_type": "CONTENT",
          "expected": "Le titre de la modale est exposé comme en-tête accessible ; chaque Étiquette annonce son nom, son état sélectionné et l’action proposée (choisir ou retirer) ; la couleur n’est jamais le seul identifiant, le nom étant toujours présent ; le focus est captif dans le dialogue de confirmation puis revient à l’Étiquette ou à la liste ; le bouton destructif est nommé Supprimer.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-AE0DDBADC6EBD",
          "property_type": "STYLE",
          "expected": "Modale d’Étiquettes et palette au rendu des frames 2028:11204, 4581:6404 et 4640:6308.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-A7700E70E6779",
          "property_type": "INTERACTION",
          "expected": "Un appui long ouvre le dialogue Annuler / Modifier / Supprimer sans sélectionner ni désaffecter.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-60B2C84BF572-AB96F73DEE9E5",
          "property_type": "INTERACTION",
          "expected": "Un toucher sur une Étiquette la sélectionne et ferme la modale ; un nouveau toucher sur l’Étiquette sélectionnée retire l’affectation.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-249CDF62C9905704",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-07 L2544, L2560 ; matrice §5.4",
        "requirement": "Branchement réel des services Profil et référentiels et initialisation des nouveaux objets depuis le Profil, sans rétroactivité."
      },
      "change_targets": [
        "src/domain/activities/ActivityDefinition.ts",
        "src/features/activities/ActivitySelectionScreen.tsx",
        "src/features/sessions/ExerciseScreen.tsx",
        "src/features/sessions/SessionDraftContext.tsx",
        "src/features/sessions/SessionDraftProvider.tsx",
        "src/features/sessions/SessionService.ts",
        "src/features/sessions/SessionServiceProvider.tsx"
      ],
      "tests": [
        "src/domain/activities/__tests__/ActivityDefinition.test.ts",
        "src/domain/sessions/__tests__/composition.test.ts",
        "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
        "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
        "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
        "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
        "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
        "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
        "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
        "src/features/sessions/__tests__/SessionService.test.ts",
        "src/features/sessions/__tests__/SessionServiceProvider.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-B2989CC78067",
        "component_decision": "EXTEND",
        "selected_component": {
          "path": "src/features/sessions/SessionServiceProvider.tsx",
          "export": "SessionServiceProvider"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-B2989CC78067-A08668FEC0C22",
          "property_type": "STATE",
          "expected": "Après modification du Profil, les objets existants et les brouillons déjà initialisés gardent leurs valeurs ; seuls les nouveaux objets reçoivent la nouvelle valeur.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-B2989CC78067-AB0441B530FE9",
          "property_type": "STATE",
          "expected": "Avec le vrai fournisseur et une base migrée, les services Profil et référentiels lisent et écrivent la base ; aucun écran n’appelle le contexte SQLite.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        },
        {
          "assertion_id": "UI-B2989CC78067-A8F55F3F1D3B6",
          "property_type": "STATE",
          "expected": "Déplacer ou dupliquer une occurrence conserve sa propre Récupération après exercice ; la copie ne relit pas le Profil, même si le Profil a changé depuis ; supprimer l’occurrence supprime sa valeur.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-B2989CC78067-A06FE3354DAE2",
          "property_type": "STATE",
          "expected": "Un nouvel Exercice du Catalogue créé Sans changement (unilatéral) garde une Pause entre les côtés de 0 s et ne reçoit pas la valeur du Profil ; passer de Sans changement à D→G ou G→D copie la Pause entre les côtés du Profil ; passer de D→G à G→D conserve la valeur courante ; un Exercice existant déjà bilatéral garde sa valeur à l’ouverture.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-B2989CC78067-AC9DBDF9DEB90",
          "property_type": "STATE",
          "expected": "Une nouvelle Séance reçoit Compte à rebours initial et Fin de séance du Profil ; un brouillon neuf n’est pas considéré modifié.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-B2989CC78067-A3DE880FD82B1",
          "property_type": "STATE",
          "expected": "Une occurrence créée par insertion depuis le Catalogue ou comme Exercice local, en création comme en modification de Séance, reçoit la Récupération du Profil ; la valeur saisie est conservée à l’enregistrement ; aucune définition du Catalogue ne la reçoit.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-374B945713BE84A4",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
        "locator": "D-213",
        "requirement": "Fonctions de brouillon recevant les valeurs initiales du Profil (Séance, occurrence), règle pure de copie de la Pause entre les côtés du Profil à l’activation bilatérale d’un Exercice, et détection de modification relative au brouillon initial réellement créé."
      },
      "change_targets": [
        "src/domain/activities/ActivityDefinition.ts",
        "src/domain/sessions/SessionDraft.ts",
        "src/domain/sessions/defaults.ts"
      ],
      "tests": [
        "src/domain/activities/__tests__/ActivityDefinition.test.ts",
        "src/domain/sessions/__tests__/SessionDraft.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-443922E10308B36B",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-09 L2768–2856 ; §4.10 L128–145",
        "requirement": "Zones corporelles : sélection multiple validée explicitement, création, renommage, suppression logique, réactivation par création du même nom, aucune couleur, icône selon la silhouette."
      },
      "change_targets": [
        "src/features/activities/ActivityEditorForm.tsx",
        "src/features/reference-data/BodyZonePickerModal.tsx",
        "src/features/sessions/BodyZoneSelector.tsx",
        "src/features/sessions/CompositionScreen.tsx",
        "src/shared/i18n/resources/fr.ts"
      ],
      "tests": [
        "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
        "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
        "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
        "src/features/sessions/__tests__/CompositionScreen.test.tsx",
        "src/shared/i18n/index.test.ts"
      ],
      "proof_required": [
        "ACCESSIBILITY_CHECK",
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-3D89E598F31D",
        "component_decision": "CREATE",
        "selected_component": {
          "path": "NONE",
          "export": "NONE"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-3D89E598F31D-AED410D36D72B",
          "property_type": "STATE",
          "expected": "Après Confirmer, la liste des Zones de l’Exercice et les noms de Zones affichés sur les occurrences de la Composition sont immédiatement à jour pour une Zone créée, renommée ou supprimée dans la modale, sans fermer ni rouvrir l’Exercice ni remonter la Composition.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A5E23CB337921",
          "property_type": "PRESENCE",
          "expected": "Aucune palette ni couleur n’est proposée ou stockée pour une Zone.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A30952ACCEE22",
          "property_type": "RELATION",
          "expected": "Chaque Zone de la modale porte l’icône de la silhouette du Profil.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A1FF92A662337",
          "property_type": "STATE",
          "expected": "Créer un nom nouveau ajoute une Zone ; un nom actif est refusé ; un nom retiré réactive la Zone avec son identifiant et ses associations ; Modifier renomme sans changer l’identifiant ; Supprimer conserve les affectations existantes.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A39FF697ED918",
          "property_type": "RESPONSIVE",
          "expected": "En création comme en renommage d’une Zone, la liste défile, le champ saisi et les actions Annuler, Ajouter, Enregistrer et Confirmer restent entièrement visibles et utilisables, clavier affiché ou masqué ; un nom long reste accessible sans troncature et le texte agrandi ne réduit pas la police.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-AEE8F212827AE",
          "property_type": "CONTENT",
          "expected": "Le titre de la modale est exposé comme en-tête accessible ; chaque Zone annonce son nom et son état sélectionné ; toutes les Zones sélectionnées restent lisibles, sans troncature ni masquage de la sélection multiple ; Annuler, Modifier, Supprimer et Confirmer ont des libellés accessibles ; le focus reste confiné à la modale ouverte, passe au dialogue puis revient à la liste.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A6E804F8CBE09",
          "property_type": "STATE",
          "expected": "Les dix Zones initiales fournies par KODJO sont renommables et supprimables comme les Zones créées.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A4255F88073DB",
          "property_type": "STYLE",
          "expected": "Modale de sélection des Zones et sa carte de création au rendu des frames 4478:7209 et 4683:6336 (modale D-228) ; dialogue destructif d’une Zone au rendu de la frame 4861:6348.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A2589810B1B4F",
          "property_type": "STATE",
          "expected": "Un nouvel Exercice exige au moins une Zone ; retirer une Zone affectée est permis s’il en reste une.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3D89E598F31D-A53142CC7796C",
          "property_type": "INTERACTION",
          "expected": "Un toucher bascule une Zone ; Confirmer applique la sélection ; fermer sans confirmer restaure la sélection précédente.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-531FE70B9D19BBA0",
      "domain": "NON_UI",
      "requirement_type": "DATA",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-07 L2514–2564 ; CE-UI-01 L1984–2032",
        "requirement": "Profil : six défauts distincts avec leurs bornes (pauses 0..300 sur grille, phases d’Exercice 0..60 pas 1, valeurs par défaut des phases de Séance 0..60 pas 1 (D-265), une valeur enregistrée au-delà de 60 conservée sans réécriture ni plafonnement), quatre préférences, nom 1..80 ou absent, photo, silhouette homme/femme ou absente ; lecture et mises à jour atomiques."
      },
      "change_targets": [
        "src/domain/preferences/Profile.ts",
        "src/domain/preferences/ProfileRepository.ts",
        "src/domain/preferences/index.ts",
        "src/infrastructure/database/repositories/SqliteProfileRepository.ts"
      ],
      "tests": [
        "src/domain/preferences/__tests__/Profile.test.ts",
        "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-60634A3D4CE85B50",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-07 L2494–2582",
        "requirement": "Profil : quatre préférences locales et six valeurs initiales distinctes (Exercice : Pause entre les côtés, Compte à rebours d’exercice, Fin d’exercice ; Séance : Récupération après exercice, Compte à rebours initial, Fin de séance), modifiées par steppers et enregistrées immédiatement, sans rétroactivité."
      },
      "change_targets": [
        "app/(tabs)/profile.tsx",
        "src/features/preferences/ProfileScreen.tsx",
        "src/features/preferences/ProfileService.ts",
        "src/features/preferences/ProfileServiceContext.tsx",
        "src/features/preferences/notificationPermission.ts",
        "src/shared/i18n/resources/fr.ts",
        "src/shared/ui/ProfileStepper.tsx"
      ],
      "tests": [
        "src/features/preferences/__tests__/ProfileScreen.test.tsx",
        "src/features/preferences/__tests__/ProfileService.test.ts",
        "src/shared/i18n/index.test.ts",
        "src/shared/ui/__tests__/ProfileStepper.test.tsx"
      ],
      "proof_required": [
        "ACCESSIBILITY_CHECK",
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-82B1544AE5AE",
        "component_decision": "CREATE",
        "selected_component": {
          "path": "NONE",
          "export": "NONE"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-82B1544AE5AE-AC30635CFA2E2",
          "property_type": "STATE",
          "expected": "À la borne basse le bouton − est inactif, à la borne haute le bouton + est inactif, et la borne est annoncée.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-ABCC35BD82254",
          "property_type": "STATE",
          "expected": "Aucune demande de permission système n’est faite depuis le Profil ; un état de permission refusé n’affiche jamais Notifications actif.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A52DF543B99EA",
          "property_type": "STYLE",
          "expected": "Chaque groupe du Profil (Exercice, Séance, Préférences) a un fond #FCFCFE, un liseré blanc de 1, un rayon de 12 et une ombre non rognée ; ces valeurs du chapitre 13 s’appliquent aux groupes, le bord 0,5 / rayon 8 de DSF-CARTES L30 ne concernant que les cartes.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A7FA3A379BF2A",
          "property_type": "CONTENT",
          "expected": "Chaque ligne d’interrupteur forme un seul élément accessible de rôle interrupteur qui annonce son nom et son état ; chaque stepper annonce sa valeur, son unité et ses bornes.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A099ECB62F6C2",
          "property_type": "STATE",
          "expected": "Chaque modification est persistée immédiatement et relue après réouverture ; les cinq autres valeurs ne changent pas.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A5C9F2515F26D",
          "property_type": "STATE",
          "expected": "Compte à rebours initial et Fin de séance (valeurs par défaut du Profil) : 0 à 60 s, pas 1 s ; Compte à rebours d’un exercice et Fin d’exercice : 0 à 60 s, pas 1 s.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-ABADF584DFF42",
          "property_type": "STYLE",
          "expected": "Dans chaque groupe du Profil, un séparateur horizontal au style de séparateur de référence (colors.divider) sépare deux lignes consécutives — dans le groupe Exercice : entre Pause entre les côtés et Compte à rebours d’un exercice, puis entre Compte à rebours d’un exercice et Fin d’exercice ; aucun séparateur avant la première ni après la dernière ligne.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A883EF13D880B",
          "property_type": "PRESENCE",
          "expected": "En tête du Profil, avant les groupes, un bloc Identité affiche la photo enregistrée ou les initiales, le nom d’affichage et l’action Modifier, qui ouvre Modifier le profil.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AF03239AB16DE",
          "property_type": "RESPONSIVE",
          "expected": "La zone centrale du Profil défile au-dessus de la navigation basse fixe, avec une marge finale égale à la hauteur de la navigation plus 16 : le bloc Identité, les six réglages et les quatre interrupteurs restent atteignables et entièrement visibles, y compris en texte agrandi.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AD4B7683C4D37",
          "property_type": "PRESENCE",
          "expected": "Le groupe Exercice affiche Pause entre les côtés, Compte à rebours d’un exercice et Fin d’exercice, ce libellé valant aussi pour les libellés accessibles ; le groupe Séance affiche Récupération après exercice, Compte à rebours initial et Fin de séance ; aucune Pause globale entre Séries.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AC6475C2EF08A",
          "property_type": "STATE",
          "expected": "Pause entre les côtés et Récupération : 0 à 300 s sur la grille 0,1,2,3,4,5,10,15…120,150,180…300 ; une valeur stockée hors grille n’est pas arrondie à l’affichage, + passe à la valeur de grille supérieure et − à la valeur inférieure.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A3B2D83AEBA4C",
          "property_type": "INTERACTION",
          "expected": "Quitter le Profil (onglet, bouton ou geste de retour) ne déclenche aucun dialogue de confirmation ni garde de sortie : chaque préférence étant déjà enregistrée, le retour est immédiat.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A5F5915E3CDE5",
          "property_type": "STATE",
          "expected": "Sans modification, les six valeurs affichées sont 10 s, 10 s, 5 s, 30 s, 10 s et 5 s.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AFC3E32D05CDD",
          "property_type": "STATE",
          "expected": "Sons, Annonces vocales et Vibration sont activés et Notifications désactivé par défaut ; chaque interrupteur est indépendant et relu après réouverture.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AA246BAA18DCA",
          "property_type": "STYLE",
          "expected": "Stepper au rendu lavande DSF remplaçant la valeur sur sa ligne ; un seul stepper ouvert à la fois.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AEC3D0B5DBEED",
          "property_type": "PRESENCE",
          "expected": "Toutes les durées du Profil se règlent par ProfileStepper ; aucune roulette d’Exercice (DurationWheelPicker, NumberWheelPicker) n’est rendue dans le Profil.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A26F50F53FF85",
          "property_type": "INTERACTION",
          "expected": "Un appui incrémente immédiatement ; un maintien répète après 450 ms puis toutes les 150 ms et s’arrête au relâchement ; un seul enregistrement par geste.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-A0BE2534283C6",
          "property_type": "STATE",
          "expected": "Un échec d’écriture affiche une erreur et restitue la dernière valeur confirmée.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-82B1544AE5AE-AC69E12A6D296",
          "property_type": "STATE",
          "expected": "Une valeur par défaut de Compte à rebours initial ou de Fin de séance déjà enregistrée au-delà de 60 s est affichée et conservée telle quelle, sans réécriture ni plafonnement à la lecture ; « + » est inactif et « − » la ramène d’abord à 60 s, puis suit le pas de 1 s.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-981FD75459397042",
      "domain": "NON_UI",
      "requirement_type": "TECHNICAL",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-09 L2836 ; §4.10 L140",
        "requirement": "Démarrage et migrations ne recréent ni ne réactivent jamais une valeur retirée ; aucun réensemencement."
      },
      "change_targets": [
        "src/infrastructure/database/migrateDatabase.ts",
        "src/infrastructure/database/migrations/migration008.ts"
      ],
      "tests": [
        "src/infrastructure/database/__tests__/migrateDatabase.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-98C76C09DB479339",
      "domain": "NON_UI",
      "requirement_type": "MIGRATION",
      "source": {
        "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
        "locator": "09.1 Entité Utilisateur L145–150 ; préférences L840–865 ; référentiels L885–976",
        "requirement": "Schéma cible v8 : Profil complété (deux défauts de Séance, quatre préférences, identité portée par le singleton profiles, silhouette) ; clé normalisée obligatoire et unique pour Étiquettes et Zones (index UNIQUE et déclencheurs refusant une clé NULL à l’insertion comme à la mise à jour, pour toutes les entrées actives et retirées) ; activity_body_zones reconstruite sans CHECK sur les 10 identifiants, avec activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE conservé, body_zone_id REFERENCES body_zones(id) ON UPDATE RESTRICT ON DELETE RESTRICT et PRIMARY KEY (activity_id, body_zone_id), lignes conservées ; sessions.label_id conservé ; migration additive convergente pour base neuve et base PRE-1 avec données, idempotente, annulée en cas d’erreur."
      },
      "change_targets": [
        "src/infrastructure/database/constants.ts",
        "src/infrastructure/database/migrateDatabase.ts",
        "src/infrastructure/database/migrations/migration008.ts",
        "src/infrastructure/database/types/DatabaseRows.ts"
      ],
      "tests": [
        "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
        "src/infrastructure/database/__tests__/targetSchema.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-999D817E7965D8CA",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-09 L2768–2856 ; §4.10 L128–145",
        "requirement": "Catégorie : choix unique validé au toucher, création, modification du nom et de la couleur, suppression logique par appui long, réactivation par création du même nom, opérations distinctes de l’enregistrement de l’Exercice."
      },
      "change_targets": [
        "src/features/reference-data/CategoryPickerModal.tsx",
        "src/features/reference-data/ReferenceValueDialog.tsx",
        "src/features/reference-data/ReferentialService.ts",
        "src/features/reference-data/ReferentialServiceContext.tsx",
        "src/features/sessions/ColorPalette.tsx",
        "src/features/sessions/ExerciseScreen.tsx",
        "src/shared/i18n/resources/fr.ts"
      ],
      "tests": [
        "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
        "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
        "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
        "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
        "src/features/reference-data/__tests__/ReferentialService.test.ts",
        "src/features/sessions/__tests__/ColorPalette.test.tsx",
        "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
        "src/shared/i18n/index.test.ts"
      ],
      "proof_required": [
        "ACCESSIBILITY_CHECK",
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-5F3D94866D30",
        "component_decision": "CREATE",
        "selected_component": {
          "path": "NONE",
          "export": "NONE"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-5F3D94866D30-ACA559B78D94F",
          "property_type": "STATE",
          "expected": "Créer un nom nouveau ajoute une Catégorie active avec la couleur choisie ; un nom d’une Catégorie active est refusé comme doublon ; un nom d’une Catégorie retirée la réactive avec le même identifiant, ses associations et la couleur choisie.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-AE559A8230D71",
          "property_type": "STATE",
          "expected": "Créer, modifier ou supprimer une Catégorie n’enregistre pas l’Exercice et conserve tous les autres champs du brouillon.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-AB9BD9AC9991B",
          "property_type": "RELATION",
          "expected": "Dans l’éditeur d’Exercice, la pilule de la Catégorie sélectionnée affiche sa pastille colorée de 26 avant son nom et en suit la couleur après une modification.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-AA0B74A61E212",
          "property_type": "INTERACTION",
          "expected": "En création comme en modification d’une Catégorie, la palette s’affiche dans le flux de la carte sans recouvrir le champ ni les actions ; clavier affiché ou masqué, Annuler et Ajouter / Enregistrer restent entièrement visibles et utilisables ; la couleur touchée reste sélectionnée et n’est appliquée que par Ajouter / Enregistrer.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A4BEE35F8C506",
          "property_type": "RESPONSIVE",
          "expected": "La liste des Catégories de la modale défile quel que soit le nombre d’entrées, toutes restant atteignables ; un nom long reste accessible sans troncature et le texte agrandi ne réduit pas la police, clavier affiché ou masqué.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A14AB0BC67228",
          "property_type": "CONTENT",
          "expected": "Le message de suppression diffère selon l’usage : valeur utilisée → elle disparaît des nouveaux choix mais reste attachée aux objets existants avec son nom et sa dernière couleur, l’historique restant inchangé ; valeur non utilisée → message sans mention d’objets existants.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A2B92152E7B5A",
          "property_type": "CONTENT",
          "expected": "Le titre de la modale est exposé comme en-tête accessible ; chaque Catégorie annonce son nom et son état sélectionné ; sa couleur est toujours accompagnée du nom ; Annuler, Modifier et Supprimer ont des libellés accessibles ; le focus reste confiné à la modale ouverte, passe au dialogue puis revient à la liste.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A511139B9E9D8",
          "property_type": "STATE",
          "expected": "Les dix Catégories prédéfinies fournies par KODJO sont renommables, recolorables et supprimables comme les Catégories créées ; aucune opération n’est conditionnée par isPredefined.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A5329EB33376E",
          "property_type": "STYLE",
          "expected": "Modale de sélection et palette au rendu des frames 4332:7095 et 4474:7157.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-AFF7326FFD33C",
          "property_type": "STATE",
          "expected": "Modifier renomme sans changer l’identifiant et change la couleur ; nom et couleur sont repris par les objets courants qui l’utilisent.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A3309C3508823",
          "property_type": "INTERACTION",
          "expected": "Pour Catégorie, Zone et Étiquette, après Supprimer la modale de sélection reste ouverte et la valeur supprimée en est absente.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A7819D6C3521A",
          "property_type": "CONTENT",
          "expected": "Pour Catégorie, Zone et Étiquette, la confirmation de suppression a pour titre exact « Supprimer « {nom} » ? » avec le nom courant de la valeur.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-AFAD4FDE13E6D",
          "property_type": "STATE",
          "expected": "Pour Catégorie, Zone et Étiquette, un nom vide ou invalide affiche une erreur liée au champ en conservant la saisie et la modale ; un échec d’écriture d’une opération de référentiel affiche un message, laisse la modale ouverte, ne modifie pas partiellement le référentiel et conserve le brouillon de l’Exercice ou de la Séance.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A6F2EDD689C0C",
          "property_type": "STATE",
          "expected": "Supprimer confirmé retire la Catégorie des choix ; une affectation existante reste sélectionnée et est conservée à l’enregistrement ; aucune nouvelle affectation à la valeur retirée n’est permise ; Annuler ne modifie rien.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A3E42865336F9",
          "property_type": "INTERACTION",
          "expected": "Un appui long ouvre le dialogue Annuler / Modifier / Supprimer sans modifier la sélection.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-A401685B96614",
          "property_type": "INTERACTION",
          "expected": "Un toucher sur une Catégorie active la sélectionne et ferme la modale, sans bouton de validation supplémentaire.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-5F3D94866D30-AB685102EBAED",
          "property_type": "STATE",
          "expected": "Une Catégorie retirée entre lecture et choix provoque un message et conserve le brouillon de l’Exercice.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-B01623D27FF0E00D",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": "docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md",
        "locator": "Profil L1076–1103",
        "requirement": "Nom d’affichage de 1 à 80 caractères à l’enregistrement (borne à laquelle renvoie CE-UI-01 §14) ; préférence Vibration limitée aux vibrations fonctionnelles de séance, sans effet sur le retour haptique des roulettes numériques ; toute modification du Profil enregistrée immédiatement et sans incidence sur les Séances existantes ; quitter l’écran Profil ne demande aucune confirmation, les modifications étant déjà enregistrées (L1103) ; tous les textes utilisateur et libellés d’accessibilité des écrans, modales, dialogues et steppers livrés utilisent les clés de traduction centralisées (Langue du MVP, L1098)."
      },
      "change_targets": [
        "src/domain/preferences/Profile.ts",
        "src/features/preferences/ProfileScreen.tsx",
        "src/features/preferences/ProfileService.ts",
        "src/shared/i18n/resources/fr.ts"
      ],
      "tests": [
        "src/domain/preferences/__tests__/Profile.test.ts",
        "src/features/preferences/__tests__/ProfileScreen.test.tsx",
        "src/features/preferences/__tests__/ProfileService.test.ts",
        "src/shared/i18n/index.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-B04373AE337E7685",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": "docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md",
        "locator": "L251 ; L259",
        "requirement": "Pause entre les côtés pertinente uniquement en D→G/G→D : initialisée depuis le Profil à l’activation D→G ou G→D, jamais pour un Exercice unilatéral. Récupération après exercice propre à chaque occurrence : initialisée à sa création depuis le défaut global, puis indépendante ; elle se déplace, se duplique et se supprime avec l’occurrence."
      },
      "change_targets": [
        "src/domain/activities/ActivityDefinition.ts",
        "src/domain/sessions/SessionDraft.ts",
        "src/features/sessions/ExerciseScreen.tsx",
        "src/features/sessions/SessionService.ts"
      ],
      "tests": [
        "src/domain/activities/__tests__/ActivityDefinition.test.ts",
        "src/domain/sessions/__tests__/composition.test.ts",
        "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
        "src/features/sessions/__tests__/SessionService.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-C1FE11C0FD998789",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
        "locator": "L885–976 ; L1222–1226",
        "requirement": "Référentiels Étiquette, Catégorie, Zone : lister, créer avec réactivation d’une entrée retirée de même clé normalisée, renommer sans changer l’identifiant, changer la couleur (Étiquette, Catégorie), retirer logiquement ; refuser un doublon actif ; nom non vide après trim et unique selon la normalisation canonique (L885, L915), borné à 40 caractères pour Étiquette et Catégorie et à 1..80 pour une Zone, refusé à la création comme au renommage ; ordre d’affichage déterministe (L917, L955) : Catégories par display_order des prédéfinies puis date de création croissante, Zones dans l’ordre de la liste initiale (L968–977) puis date de création croissante, Étiquettes par date de création croissante, à égalité par ordre d’insertion ; refuser une nouvelle affectation à une valeur retirée tout en conservant les affectations existantes ; opérations atomiques."
      },
      "change_targets": [
        "src/domain/body-zones/BodyZone.ts",
        "src/domain/body-zones/BodyZoneRepository.ts",
        "src/domain/body-zones/index.ts",
        "src/domain/categories/CategoryRepository.ts",
        "src/domain/categories/errors.ts",
        "src/domain/categories/index.ts",
        "src/domain/labels/Label.ts",
        "src/domain/labels/LabelRepository.ts",
        "src/domain/labels/index.ts",
        "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
        "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
        "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
        "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
        "src/infrastructure/database/repositories/SqliteSessionRepository.ts"
      ],
      "tests": [
        "src/domain/body-zones/__tests__/BodyZone.test.ts",
        "src/domain/categories/__tests__/validation.test.ts",
        "src/domain/labels/__tests__/Label.test.ts",
        "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
        "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
        "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
        "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
        "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    },
    {
      "requirement_id": "REQ-D1B462A52863ED32",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-01 L1964–2050",
        "requirement": "Modifier le profil : nom d’affichage, photo locale facultative choisie dans la galerie et silhouette facultative homme/femme, dans un brouillon enregistré par Enregistrer ; la silhouette ne modifie que l’icône des Zones corporelles."
      },
      "change_targets": [
        "app/_layout.tsx",
        "app/profile-edit.tsx",
        "src/features/preferences/ProfileEditScreen.tsx",
        "src/features/preferences/profilePhoto.ts",
        "src/shared/ui/BodyZoneIcon.tsx",
        "src/shared/ui/KodjoIcon.tsx"
      ],
      "tests": [
        "app/__tests__/rootLayoutGesture.test.tsx",
        "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
        "src/features/preferences/__tests__/profilePhoto.test.ts",
        "src/shared/ui/__tests__/BodyZoneIcon.test.tsx"
      ],
      "proof_required": [
        "ACCESSIBILITY_CHECK",
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-96E7FD739BF0",
        "component_decision": "CREATE",
        "selected_component": {
          "path": "NONE",
          "export": "NONE"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-96E7FD739BF0-AACD685D38747",
          "property_type": "INTERACTION",
          "expected": "Ajouter une photo ouvre uniquement la galerie ; une annulation ne modifie pas le brouillon ; une image choisie est copiée dans le stockage local persistant de l’app.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-A6C731DD19268",
          "property_type": "STATE",
          "expected": "Annuler l’abandon ferme le dialogue, reste sur Modifier le profil et conserve le brouillon ; confirmer l’abandon restaure les valeurs enregistrées et revient au Profil.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-AD7703C936790",
          "property_type": "STATE",
          "expected": "Enregistrer persiste nom, photo et silhouette ensemble ; l’abandon restaure les valeurs enregistrées ; un échec d’enregistrement ne modifie rien.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-A7EFE96EAC23A",
          "property_type": "RELATION",
          "expected": "L’icône de Zone corporelle utilise la variante correspondant à la silhouette ; aucune donnée, liste ni calcul ne change.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-AB155053543ED",
          "property_type": "CONTENT",
          "expected": "Les choix sont annoncés Silhouette homme et Silhouette femme avec leur état sélectionné.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-A202F52482AC0",
          "property_type": "RESPONSIVE",
          "expected": "Modifier le profil défile dans les Safe Areas : la photo, le champ Nom d’affichage, les deux silhouettes et Enregistrer restent entièrement atteignables et utilisables, clavier affiché ou masqué, et en texte agrandi sans réduction de police.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-AC99FCD6BEC3F",
          "property_type": "STYLE",
          "expected": "Silhouettes dans deux cercles de 64, hauteur 44, écart 24 ; choisie en bleu #0508E5 contour 2, non choisie en gris #9499A8 contour #CCD1E0.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-A3846B911456D",
          "property_type": "STATE",
          "expected": "Un nom de 1 ou 80 caractères est accepté ; un nom vide ou de 81 caractères affiche une erreur liée au champ et l’écran reste ouvert.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-A3E197595DF4F",
          "property_type": "INTERACTION",
          "expected": "Un retour (bouton ou geste) avec un brouillon modifié est intercepté par useCompositionExitGuard et propose l’abandon dans DecisionDialog ; sans modification, le retour revient au Profil sans dialogue.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-ADA643B3F4D1A",
          "property_type": "STATE",
          "expected": "Une photo absente ou introuvable affiche les initiales sans bloquer les champs ; un échec de lecture ou de copie affiche un message et conserve le brouillon.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-96E7FD739BF0-A38AD88125DB2",
          "property_type": "STATE",
          "expected": "Une silhouette absente est affichée homme ; femme choisie puis enregistrée est relue après réouverture.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-DD38A3777CC4D034",
      "domain": "NON_UI",
      "requirement_type": "DATA",
      "source": {
        "path": "docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md",
        "locator": "L93–100",
        "requirement": "Grille des pauses 0..300 s (pas 1 s jusqu’à 5 s, 5 s jusqu’à 120 s, 30 s jusqu’à 300 s) pour Pause entre les côtés et Récupération du Profil : fonctions de Domaine valeur de grille supérieure et inférieure, bornes inchangées ; une valeur stockée hors grille n’est jamais arrondie par la lecture ou l’ouverture."
      },
      "change_targets": [
        "src/domain/preferences/Profile.ts"
      ],
      "tests": [
        "src/domain/preferences/__tests__/Profile.test.ts"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST"
      ],
      "status": "DEFINED",
      "no_automated_test_reason": "NONE"
    }
  ]
}
</KODJO_REQUIREMENT_CONTRACT_JSON>

<KODJO_TEST_CONTRACT_JSON>
{
  "schema": "kodjo.test-contract.v1",
  "binding_count": 60,
  "bindings": [
    {
      "requirement_id": "REQ-0FBEF4DDBFAD3BC6",
      "test_path": "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-0FBEF4DDBFAD3BC6",
      "test_path": "src/features/sessions/__tests__/ColorPalette.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-0FBEF4DDBFAD3BC6",
      "test_path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-0FBEF4DDBFAD3BC6",
      "test_path": "src/shared/i18n/index.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-249CDF62C9905704",
      "test_path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-249CDF62C9905704",
      "test_path": "src/domain/sessions/__tests__/composition.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-249CDF62C9905704",
      "test_path": "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-249CDF62C9905704",
      "test_path": "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-249CDF62C9905704",
      "test_path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-249CDF62C9905704",
      "test_path": "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-249CDF62C9905704",
      "test_path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-249CDF62C9905704",
      "test_path": "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-249CDF62C9905704",
      "test_path": "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-249CDF62C9905704",
      "test_path": "src/features/sessions/__tests__/SessionService.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-249CDF62C9905704",
      "test_path": "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-374B945713BE84A4",
      "test_path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-374B945713BE84A4",
      "test_path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-443922E10308B36B",
      "test_path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-443922E10308B36B",
      "test_path": "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-443922E10308B36B",
      "test_path": "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-443922E10308B36B",
      "test_path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-443922E10308B36B",
      "test_path": "src/shared/i18n/index.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-531FE70B9D19BBA0",
      "test_path": "src/domain/preferences/__tests__/Profile.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-531FE70B9D19BBA0",
      "test_path": "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-60634A3D4CE85B50",
      "test_path": "src/features/preferences/__tests__/ProfileScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-60634A3D4CE85B50",
      "test_path": "src/features/preferences/__tests__/ProfileService.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-60634A3D4CE85B50",
      "test_path": "src/shared/i18n/index.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-60634A3D4CE85B50",
      "test_path": "src/shared/ui/__tests__/ProfileStepper.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-981FD75459397042",
      "test_path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-98C76C09DB479339",
      "test_path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-98C76C09DB479339",
      "test_path": "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-999D817E7965D8CA",
      "test_path": "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-999D817E7965D8CA",
      "test_path": "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-999D817E7965D8CA",
      "test_path": "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-999D817E7965D8CA",
      "test_path": "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-999D817E7965D8CA",
      "test_path": "src/features/reference-data/__tests__/ReferentialService.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-999D817E7965D8CA",
      "test_path": "src/features/sessions/__tests__/ColorPalette.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-999D817E7965D8CA",
      "test_path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-999D817E7965D8CA",
      "test_path": "src/shared/i18n/index.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B01623D27FF0E00D",
      "test_path": "src/domain/preferences/__tests__/Profile.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B01623D27FF0E00D",
      "test_path": "src/features/preferences/__tests__/ProfileScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B01623D27FF0E00D",
      "test_path": "src/features/preferences/__tests__/ProfileService.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B01623D27FF0E00D",
      "test_path": "src/shared/i18n/index.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B04373AE337E7685",
      "test_path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B04373AE337E7685",
      "test_path": "src/domain/sessions/__tests__/composition.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B04373AE337E7685",
      "test_path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B04373AE337E7685",
      "test_path": "src/features/sessions/__tests__/SessionService.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C1FE11C0FD998789",
      "test_path": "src/domain/body-zones/__tests__/BodyZone.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C1FE11C0FD998789",
      "test_path": "src/domain/categories/__tests__/validation.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C1FE11C0FD998789",
      "test_path": "src/domain/labels/__tests__/Label.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C1FE11C0FD998789",
      "test_path": "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C1FE11C0FD998789",
      "test_path": "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C1FE11C0FD998789",
      "test_path": "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C1FE11C0FD998789",
      "test_path": "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C1FE11C0FD998789",
      "test_path": "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-D1B462A52863ED32",
      "test_path": "app/__tests__/rootLayoutGesture.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-D1B462A52863ED32",
      "test_path": "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-D1B462A52863ED32",
      "test_path": "src/features/preferences/__tests__/profilePhoto.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-D1B462A52863ED32",
      "test_path": "src/shared/ui/__tests__/BodyZoneIcon.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-DD38A3777CC4D034",
      "test_path": "src/domain/preferences/__tests__/Profile.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    }
  ]
}
</KODJO_TEST_CONTRACT_JSON>

<KODJO_BOUNDARY_CONTRACT_JSON>
{
  "schema": "kodjo.boundary-contract.v1",
  "boundary_count": 23,
  "boundaries": [
    {
      "category": "FORBIDDEN",
      "target": "Séries variables, Ordre des côtés et nouveaux calculs",
      "justification": "Affectés à PRE-3 ; suivis par les tickets ouverts.",
      "locator": {
        "kind": "SEMANTIC",
        "path": "NONE",
        "symbol": "NONE",
        "invariant_type": "SEMANTIC_REVIEW",
        "expected": "UNCHANGED",
        "semantic_justification": "Ces règles appartiennent à la tranche suivante et ne doivent apparaître ni dans le stockage ni dans les écrans livrés par cette tranche."
      }
    },
    {
      "category": "FORBIDDEN",
      "target": "src/features/execution/README.md",
      "justification": "Aucun module d’Exécution dans PRE-2.",
      "locator": {
        "kind": "PATH",
        "path": "src/features/execution/README.md",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/domain/categories/defaults.ts",
      "justification": "Catégories prédéfinies gelées.",
      "locator": {
        "kind": "PATH",
        "path": "src/domain/categories/defaults.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/domain/categories/validation.ts",
      "justification": "Clé normalisée gelée et réutilisée.",
      "locator": {
        "kind": "PATH",
        "path": "src/domain/categories/validation.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/domain/sessions/calculations.ts",
      "justification": "Calculs hors PRE-2 (PRE-3, #282, #283).",
      "locator": {
        "kind": "PATH",
        "path": "src/domain/sessions/calculations.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/features/activities/ActivityCard.tsx",
      "justification": "Refonte des cartes exclue.",
      "locator": {
        "kind": "PATH",
        "path": "src/features/activities/ActivityCard.tsx",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/features/activities/ActivityDefinitionService.ts",
      "justification": "Listes existantes conservées ; opérations de référentiel dans un nouveau service.",
      "locator": {
        "kind": "PATH",
        "path": "src/features/activities/ActivityDefinitionService.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/features/reference-data/bodyZones.ts",
      "justification": "Seed historique des Zones, gelé.",
      "locator": {
        "kind": "PATH",
        "path": "src/features/reference-data/bodyZones.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/features/sessions/compositionPresentation.ts",
      "justification": "Présentation de Composition hors PRE-2.",
      "locator": {
        "kind": "PATH",
        "path": "src/features/sessions/compositionPresentation.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/features/sessions/DurationWheelPicker.tsx",
      "justification": "Roulettes et haptique indépendantes de Vibration (D-076).",
      "locator": {
        "kind": "PATH",
        "path": "src/features/sessions/DurationWheelPicker.tsx",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/features/sessions/ExerciseExitConfirmModal.tsx",
      "justification": "Dialogue d’abandon de l’Exercice inchangé ; même patron pour Modifier le profil.",
      "locator": {
        "kind": "PATH",
        "path": "src/features/sessions/ExerciseExitConfirmModal.tsx",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/features/sessions/formatSessionSummary.ts",
      "justification": "Résumé hors PRE-2.",
      "locator": {
        "kind": "PATH",
        "path": "src/features/sessions/formatSessionSummary.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/features/sessions/NumberWheelPicker.tsx",
      "justification": "Roulettes et haptique indépendantes de Vibration (D-076).",
      "locator": {
        "kind": "PATH",
        "path": "src/features/sessions/NumberWheelPicker.tsx",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/features/sessions/SessionCard.tsx",
      "justification": "Refonte des cartes exclue.",
      "locator": {
        "kind": "PATH",
        "path": "src/features/sessions/SessionCard.tsx",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/features/sessions/useCompositionExitGuard.ts",
      "justification": "Garde de sortie canonique réutilisée par import, sans modification.",
      "locator": {
        "kind": "PATH",
        "path": "src/features/sessions/useCompositionExitGuard.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/infrastructure/database/migrations/migration001.ts",
      "justification": "Migration déjà appliquée : octets inchangés.",
      "locator": {
        "kind": "PATH",
        "path": "src/infrastructure/database/migrations/migration001.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/infrastructure/database/migrations/migration002.ts",
      "justification": "Migration déjà appliquée : octets inchangés.",
      "locator": {
        "kind": "PATH",
        "path": "src/infrastructure/database/migrations/migration002.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/infrastructure/database/migrations/migration003.ts",
      "justification": "Migration déjà appliquée : octets inchangés.",
      "locator": {
        "kind": "PATH",
        "path": "src/infrastructure/database/migrations/migration003.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/infrastructure/database/migrations/migration004.ts",
      "justification": "Migration déjà appliquée : octets inchangés.",
      "locator": {
        "kind": "PATH",
        "path": "src/infrastructure/database/migrations/migration004.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/infrastructure/database/migrations/migration005.ts",
      "justification": "Migration déjà appliquée : octets inchangés.",
      "locator": {
        "kind": "PATH",
        "path": "src/infrastructure/database/migrations/migration005.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/infrastructure/database/migrations/migration006.ts",
      "justification": "Migration déjà appliquée : octets inchangés.",
      "locator": {
        "kind": "PATH",
        "path": "src/infrastructure/database/migrations/migration006.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "src/infrastructure/database/migrations/migration007.ts",
      "justification": "Migration déjà appliquée : octets inchangés.",
      "locator": {
        "kind": "PATH",
        "path": "src/infrastructure/database/migrations/migration007.ts",
        "symbol": "NONE",
        "invariant_type": "FILE_UNCHANGED",
        "expected": "UNCHANGED",
        "semantic_justification": "NONE"
      }
    },
    {
      "category": "PRESERVE",
      "target": "Valeurs des quatre défauts du Profil lues par la migration de PRE-1",
      "justification": "Les quatre constantes existantes du Profil restent 10, 30, 10 et 5 secondes.",
      "locator": {
        "kind": "SEMANTIC",
        "path": "NONE",
        "symbol": "NONE",
        "invariant_type": "SEMANTIC_REVIEW",
        "expected": "UNCHANGED",
        "semantic_justification": "La migration de la tranche précédente lit ces constantes pour semer le Profil ; toute modification changerait le schéma déjà installé sur les appareils."
      }
    }
  ]
}
</KODJO_BOUNDARY_CONTRACT_JSON>

<KODJO_PLAN_CLARIFICATIONS_JSON>
[]
</KODJO_PLAN_CLARIFICATIONS_JSON>

PLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW


### scope_allow machine

```text
app/(tabs)/profile.tsx
app/__tests__/rootLayoutGesture.test.tsx
app/_layout.tsx
app/profile-edit.tsx
src/domain/activities/ActivityDefinition.ts
src/domain/activities/__tests__/ActivityDefinition.test.ts
src/domain/body-zones/BodyZone.ts
src/domain/body-zones/BodyZoneRepository.ts
src/domain/body-zones/__tests__/BodyZone.test.ts
src/domain/body-zones/index.ts
src/domain/categories/CategoryRepository.ts
src/domain/categories/__tests__/validation.test.ts
src/domain/categories/errors.ts
src/domain/categories/index.ts
src/domain/labels/Label.ts
src/domain/labels/LabelRepository.ts
src/domain/labels/__tests__/Label.test.ts
src/domain/labels/index.ts
src/domain/preferences/Profile.ts
src/domain/preferences/ProfileRepository.ts
src/domain/preferences/__tests__/Profile.test.ts
src/domain/preferences/index.ts
src/domain/sessions/SessionDraft.ts
src/domain/sessions/__tests__/SessionDraft.test.ts
src/domain/sessions/__tests__/composition.test.ts
src/domain/sessions/defaults.ts
src/features/activities/ActivityEditorForm.tsx
src/features/activities/ActivitySelectionScreen.tsx
src/features/activities/__tests__/ActivityEditorForm.test.tsx
src/features/activities/__tests__/ActivitySelectionScreen.test.tsx
src/features/preferences/ProfileEditScreen.tsx
src/features/preferences/ProfileScreen.tsx
src/features/preferences/ProfileService.ts
src/features/preferences/ProfileServiceContext.tsx
src/features/preferences/__tests__/ProfileEditScreen.test.tsx
src/features/preferences/__tests__/ProfileScreen.test.tsx
src/features/preferences/__tests__/ProfileService.test.ts
src/features/preferences/__tests__/profilePhoto.test.ts
src/features/preferences/notificationPermission.ts
src/features/preferences/profilePhoto.ts
src/features/reference-data/BodyZonePickerModal.tsx
src/features/reference-data/CategoryPickerModal.tsx
src/features/reference-data/LabelPickerModal.tsx
src/features/reference-data/ReferenceValueDialog.tsx
src/features/reference-data/ReferentialService.ts
src/features/reference-data/ReferentialServiceContext.tsx
src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx
src/features/reference-data/__tests__/CategoryPickerModal.test.tsx
src/features/reference-data/__tests__/LabelPickerModal.test.tsx
src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx
src/features/reference-data/__tests__/ReferentialService.test.ts
src/features/sessions/BodyZoneSelector.tsx
src/features/sessions/ColorPalette.tsx
src/features/sessions/CompositionScreen.tsx
src/features/sessions/ExerciseScreen.tsx
src/features/sessions/SessionDraftContext.tsx
src/features/sessions/SessionDraftProvider.tsx
src/features/sessions/SessionService.ts
src/features/sessions/SessionServiceProvider.tsx
src/features/sessions/__tests__/BodyZoneSelector.test.tsx
src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx
src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx
src/features/sessions/__tests__/ColorPalette.test.tsx
src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx
src/features/sessions/__tests__/CompositionScreen.test.tsx
src/features/sessions/__tests__/ExerciseScreen.test.tsx
src/features/sessions/__tests__/SessionDraftContext.test.tsx
src/features/sessions/__tests__/SessionDraftProvider.test.tsx
src/features/sessions/__tests__/SessionService.test.ts
src/features/sessions/__tests__/SessionServiceProvider.test.tsx
src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts
src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts
src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts
src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts
src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts
src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts
src/infrastructure/database/__tests__/migrateDatabase.test.ts
src/infrastructure/database/__tests__/targetSchema.test.ts
src/infrastructure/database/constants.ts
src/infrastructure/database/migrateDatabase.ts
src/infrastructure/database/migrations/migration008.ts
src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts
src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts
src/infrastructure/database/repositories/SqliteCategoryRepository.ts
src/infrastructure/database/repositories/SqliteLabelRepository.ts
src/infrastructure/database/repositories/SqliteProfileRepository.ts
src/infrastructure/database/repositories/SqliteSessionRepository.ts
src/infrastructure/database/types/DatabaseRows.ts
src/shared/i18n/index.test.ts
src/shared/i18n/resources/fr.ts
src/shared/ui/BodyZoneIcon.tsx
src/shared/ui/KodjoIcon.tsx
src/shared/ui/ProfileStepper.tsx
src/shared/ui/__tests__/BodyZoneIcon.test.tsx
src/shared/ui/__tests__/ProfileStepper.test.tsx
```

<KODJO_PLAN_REVISION_STATUS_JSON>
{
  "status": "APPROVED_BASE_NEW_CYCLE"
}
</KODJO_PLAN_REVISION_STATUS_JSON>

<KODJO_UI_PLAN_CONTRACT_JSON>
{
  "schema": "kodjo.ui-plan-contract.v1",
  "contract_version": 2,
  "protocol_commit": "8260bcaa5eba1a6897eb27055728fd3900ace2ae",
  "scan_revision": "10ac761ef453f360110bf7b668b3998487b071b3",
  "ui_applicable": true,
  "ui_paths": [
    "app/(tabs)/profile.tsx",
    "app/_layout.tsx",
    "app/profile-edit.tsx",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/preferences/ProfileEditScreen.tsx",
    "src/features/preferences/ProfileScreen.tsx",
    "src/features/preferences/ProfileService.ts",
    "src/features/preferences/ProfileServiceContext.tsx",
    "src/features/preferences/notificationPermission.ts",
    "src/features/preferences/profilePhoto.ts",
    "src/features/reference-data/BodyZonePickerModal.tsx",
    "src/features/reference-data/CategoryPickerModal.tsx",
    "src/features/reference-data/LabelPickerModal.tsx",
    "src/features/reference-data/ReferenceValueDialog.tsx",
    "src/features/reference-data/ReferentialService.ts",
    "src/features/reference-data/ReferentialServiceContext.tsx",
    "src/features/sessions/BodyZoneSelector.tsx",
    "src/features/sessions/ColorPalette.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionDraftContext.tsx",
    "src/features/sessions/SessionDraftProvider.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/SessionServiceProvider.tsx",
    "src/shared/i18n/resources/fr.ts",
    "src/shared/ui/BodyZoneIcon.tsx",
    "src/shared/ui/KodjoIcon.tsx",
    "src/shared/ui/ProfileStepper.tsx"
  ],
  "criterion_count": 6,
  "assertion_count": 73,
  "assertion_ids_sha256": "01d119b87b8364950506346dd636e5620cadeaa72f62b6db46fd5143c10cfa03",
  "matrix_sha256": "a6a4991aea38e7f4fe82021ef760a0774a5ca1afee58279e598d37c97f678fa1"
}
</KODJO_UI_PLAN_CONTRACT_JSON>

<KODJO_PLAN_CONTRACT_JSON>
{
  "schema": "kodjo.plan-contract-consistency.v2",
  "contract_version": 2,
  "protocol_commit": "8260bcaa5eba1a6897eb27055728fd3900ace2ae",
  "scan_revision": "10ac761ef453f360110bf7b668b3998487b071b3",
  "write_scope": [
    "app/(tabs)/profile.tsx",
    "app/__tests__/rootLayoutGesture.test.tsx",
    "app/_layout.tsx",
    "app/profile-edit.tsx",
    "src/domain/activities/ActivityDefinition.ts",
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/body-zones/BodyZone.ts",
    "src/domain/body-zones/BodyZoneRepository.ts",
    "src/domain/body-zones/__tests__/BodyZone.test.ts",
    "src/domain/body-zones/index.ts",
    "src/domain/categories/CategoryRepository.ts",
    "src/domain/categories/__tests__/validation.test.ts",
    "src/domain/categories/errors.ts",
    "src/domain/categories/index.ts",
    "src/domain/labels/Label.ts",
    "src/domain/labels/LabelRepository.ts",
    "src/domain/labels/__tests__/Label.test.ts",
    "src/domain/labels/index.ts",
    "src/domain/preferences/Profile.ts",
    "src/domain/preferences/ProfileRepository.ts",
    "src/domain/preferences/__tests__/Profile.test.ts",
    "src/domain/preferences/index.ts",
    "src/domain/sessions/SessionDraft.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/domain/sessions/defaults.ts",
    "src/features/activities/ActivityEditorForm.tsx",
    "src/features/activities/ActivitySelectionScreen.tsx",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/preferences/ProfileEditScreen.tsx",
    "src/features/preferences/ProfileScreen.tsx",
    "src/features/preferences/ProfileService.ts",
    "src/features/preferences/ProfileServiceContext.tsx",
    "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
    "src/features/preferences/__tests__/ProfileScreen.test.tsx",
    "src/features/preferences/__tests__/ProfileService.test.ts",
    "src/features/preferences/__tests__/profilePhoto.test.ts",
    "src/features/preferences/notificationPermission.ts",
    "src/features/preferences/profilePhoto.ts",
    "src/features/reference-data/BodyZonePickerModal.tsx",
    "src/features/reference-data/CategoryPickerModal.tsx",
    "src/features/reference-data/LabelPickerModal.tsx",
    "src/features/reference-data/ReferenceValueDialog.tsx",
    "src/features/reference-data/ReferentialService.ts",
    "src/features/reference-data/ReferentialServiceContext.tsx",
    "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
    "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
    "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
    "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
    "src/features/reference-data/__tests__/ReferentialService.test.ts",
    "src/features/sessions/BodyZoneSelector.tsx",
    "src/features/sessions/ColorPalette.tsx",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionDraftContext.tsx",
    "src/features/sessions/SessionDraftProvider.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/SessionServiceProvider.tsx",
    "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/ColorPalette.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
    "src/features/sessions/__tests__/SessionService.test.ts",
    "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/__tests__/targetSchema.test.ts",
    "src/infrastructure/database/constants.ts",
    "src/infrastructure/database/migrateDatabase.ts",
    "src/infrastructure/database/migrations/migration008.ts",
    "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
    "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
    "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
    "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
    "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
    "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
    "src/infrastructure/database/types/DatabaseRows.ts",
    "src/shared/i18n/index.test.ts",
    "src/shared/i18n/resources/fr.ts",
    "src/shared/ui/BodyZoneIcon.tsx",
    "src/shared/ui/KodjoIcon.tsx",
    "src/shared/ui/ProfileStepper.tsx",
    "src/shared/ui/__tests__/BodyZoneIcon.test.tsx",
    "src/shared/ui/__tests__/ProfileStepper.test.tsx"
  ],
  "required_test_writes": [
    "app/__tests__/rootLayoutGesture.test.tsx",
    "src/domain/activities/__tests__/ActivityDefinition.test.ts",
    "src/domain/body-zones/__tests__/BodyZone.test.ts",
    "src/domain/categories/__tests__/validation.test.ts",
    "src/domain/labels/__tests__/Label.test.ts",
    "src/domain/preferences/__tests__/Profile.test.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
    "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
    "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
    "src/features/preferences/__tests__/ProfileScreen.test.tsx",
    "src/features/preferences/__tests__/ProfileService.test.ts",
    "src/features/preferences/__tests__/profilePhoto.test.ts",
    "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
    "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
    "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
    "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
    "src/features/reference-data/__tests__/ReferentialService.test.ts",
    "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/ColorPalette.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
    "src/features/sessions/__tests__/SessionService.test.ts",
    "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
    "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/__tests__/targetSchema.test.ts",
    "src/shared/i18n/index.test.ts",
    "src/shared/ui/__tests__/BodyZoneIcon.test.tsx",
    "src/shared/ui/__tests__/ProfileStepper.test.tsx"
  ],
  "requirement_contract_sha256": "3f768d0583e3a6d679e6edf67614978a31c21b4d269bbeba7f326c655a78edca",
  "test_contract_sha256": "087d83748736496fa642c42994ef19318b620e670ba1079d91ffaa08e12bfb5b",
  "boundary_contract_sha256": "26fed58813921fa4cf2225fa61cc2b68eec90a9bdc2d3a5b9d9a05d1b1b4c64c",
  "requirement_count": 14
}
</KODJO_PLAN_CONTRACT_JSON>

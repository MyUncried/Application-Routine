# V2-PRE-2 — Référentiels + Profil — Plan technique

## 0. Statut

- Plan préparé et assemblé localement, sans génération par le modèle de planification. **Non revu** : l'autocontrôle de Claude ne constitue pas la revue indépendante V2.
- Blocs machine assemblés avec les scripts V2 du dépôt (`scan-plan-impact.js`, `generate-ui-plan-contract.js decode`, `reconcile-initial-plan-prose.js`) et contrôlés par `verify-ui-plan-criteria.js`, `verify-plan-contract-consistency.js`, `verify-plan-impact.js` sur les octets exacts de ce fichier. La sortie structurée normalement produite par le modèle de planification V2 a été rédigée localement par Claude ; aucun appel à une API de modèle n'a été fait.
- Décisions de Hermann D1 à D4 du 03/10/2026 consignées dans les sources : D-256 à D-259 (PR #285, registre L390–393, chapitres 13, 09, 11, v12).
- Tranche activée : issue #288, bootstrap `eb8bdca3…`, registre (PR #289).

## 1. Baseline et sources

- Baseline du plan (`source_head`, révision du scan) : `53cb05c782e17eb19d269f2724a0db3cfbceb1a2` = ancre `67064d1b` + D-256 à D-259 (#285) + dépendances photo et runtime natif isolé (#286) + icônes silhouette (#287). Activation (#289, `11b7ab85`) postérieure, fichiers d'orchestration seulement.
- Aucune opération PRE-2 antérieure ; runs actifs sans rapport (VNext, test en file depuis le 13/09), non touchés.

| Source | Blob | Usage |
|---|---|---|
| `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md` | voir bootstrap | CE-UI-01 (L1965–2051), CE-UI-07 (L2495–2583), CE-UI-09 (L2769–2857), CE-T03-16 (L1606–1692), §4.10 (L128–145), CE-T03-04 (L536–572), CE-T03-08 (L880–928), R-02 (L2979), ordre des sources (L13–25) |
| `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` | voir bootstrap | D-004, D-076, D-079, D-089, D-188, D-199, D-200, D-210 à D-214, D-222, D-227, D-228, D-236 à D-240, D-252, D-253, D-255, **D-256 à D-259 (L390–393)** |
| `docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md` | voir bootstrap | Profil L145–150, préférences L840–865, référentiels L885–976, cardinalités L1222–1226 |
| `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md` | `a779639c` | Profil L1076–1101 |
| `docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md` | voir bootstrap | Grille des pauses L93–100 ; lignes 7, 9, 10 (L86–89) |
| `docs/DSF-CARTES-ICONES-APPUIS-2026-09-30.md` | `16e971b5` | RG-5, RG-10, silhouettes Profil, ANI-06, PRO-01/02 |
| `docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md` | `529bfa90` | Phases propres d'Exercice L252–261 |
| Matrice `KODJO_Matrice_couverture_PRE_EXE_PRE2_2026-10-03.md` (fournie par Hermann) | — | §5 périmètre, §6 critères P2-01..P2-22 |

Empreintes SHA-256 des sources produit : `.github/orchestration/v2-slices/V2-PRE-2/slice-bootstrap.json` (blobs à la baseline `53cb05c7`).

Ordre d'application (C13 L13–25) : décisions → modèle fonctionnel/données/règles → API → architecture → C06 → C13 → Figma (rendu uniquement, D-255).

## 2. Décisions de Hermann intégrées (03/10/2026)

- **D1** — Compte à rebours d'Exercice : 0..60 s, pas 1 s, défaut 10 s. Fin d'exercice : 0..60 s, pas 1 s, défaut 5 s. Sans effet sur la durée de réalisation de l'Exercice ; bornes de Séance inchangées (CR initial et Fin de séance 0..3599 s, D-089).
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
| T4 | Bornes | Bouton inactif à la borne, borne annoncée | CE-UI-07 L2541, L2569 |
| T5 | Maintien | Immédiat, puis 450 ms, puis 150 ms ; arrêt au relâchement | ANI-06 ; CE-UI-07 L2549 |
| T6 | Écriture | Une écriture atomique par geste au relâchement ; échec → valeur confirmée restituée + message | CE-UI-07 L2545, L2557, L2565 |
| T7 | Notifications | Préférence locale (défaut désactivée) ; aucune demande de permission ni module de notifications en PRE-2 ; lecteur d'état de permission en adaptateur, état « refusé » jamais affiché actif | CE-UI-07 L2545, L2565, L2573 ; D-079 |
| T8 | Nom d'affichage | Nullable tant que jamais renseigné ; 1..80 caractères (points de code) à l'enregistrement | C09 L147 ; CE-UI-01 L2009, L2021 |
| T9 | Bornes des noms de référentiel | Existantes : Étiquette et Catégorie ≤40, Zone 1..80 | Matrice §5.2 ; code |
| T10 | Clé normalisée | `normalizeName` + `canonicalCategoryKey` (sortie gelée) pour les trois référentiels | C09 L885, L914, L952 ; code |
| T11 | Palette | `SESSION_COLORS` (12) ; première couleur présélectionnée à la création | C09 L886, L915 ; code |
| T12 | Ordre d'affichage | Catégories : prédéfinies puis date ; Étiquettes et Zones : date de création | RM-106 ; code |
| T13 | Silhouette | Une famille d'icônes de Zone, variante homme/femme, absence = homme ; affichée dans CE-UI-01 et la modale Zones ; cartes inchangées | RG-5, RG-10, PRO-01/02 ; matrice §5.3 |
| T14 | Catégorie de l'occurrence de Séance | Hors PRE-2 (aucun accès depuis l'éditeur local) | Matrice §5.2 |
| T15 | Réactivation (D2) : nom affiché | Le nom saisi (même clé normalisée) remplace le nom stocké ; identifiant et associations inchangés | D2 (« effectue simplement une création ») |
| T16 | Garde « valeur retirée » côté stockage | Création d'objet : référence active ; modification : active ou identique à l'affectation existante ; sinon erreur, brouillon conservé | D-210 ; CE-UI-09 L2825, L2837 |
| T17 | Retrait d'une Zone affectée | Permis si au moins une Zone reste | D-199 |
| T18 | Brouillon modifié | `isSessionDraftDirty(draft, baseline)` compare au brouillon initial réellement créé (valeurs du Profil), conservé par le fournisseur de brouillon | Conséquence de l'initialisation depuis le Profil |
| T19 | Absence de contexte Profil | Hors application (tests ne montant pas le fournisseur), les fonctions de brouillon gardent les valeurs du Domaine ; l'application monte toujours le fournisseur, prouvé par le test de branchement réel | Patron PRE-1 |

## 5. Phases propres d'Exercice : PRE-2 et PRE-3

- **Livré en PRE-2** : les réglages Profil « Compte à rebours d'exercice » et « Fin d'exercice » (défauts 10 s et 5 s, bornes 0..60 s, pas 1 s), persistés, relus, modifiables par stepper, sans effet rétroactif.
- **Non livré en PRE-2** : l'Exercice n'a pas encore de champ pour ces phases ; aucune initialisation applicative de ces deux valeurs n'existe après PRE-2. Le branchement aux champs d'Exercice (création, feuille de paramètres v12 lignes 9–10) relève de PRE-3. PRE-2 ne livre aucune fonction d'initialisation non branchée.

## 6. Conception cible

### 6.1 Domaine

- `Profile` : `sideChangeRecoverySecondsDefault` (10), `postActivityRecoverySecondsDefault` (30), `exerciseCountdownSecondsDefault` (10), `exerciseEndSecondsDefault` (5) — constantes inchangées, lues par `migration007` — ; ajout `sessionInitialCountdownSecondsDefault` (10), `sessionFinalPhaseSecondsDefault` (5), `soundsEnabled` (true), `voiceAnnouncementsEnabled` (true), `vibrationEnabled` (true), `notificationsEnabled` (false), `displayName: string | null`, `photoUri: string | null`, `silhouette: "homme" | "femme" | null`. Fonctions : bornes par réglage (T1, T2, D1, D-089), `nextGridValue` / `previousGridValue` (T3), `validateDisplayName` (T8), `resolveSilhouette` (null → homme).
- `ProfileRepository` : `get`, `updateDefault`, `updatePreference`, `updateIdentity` (atomique).
- Référentiels : validation de nom et clé normalisée (T9, T10) ; erreurs `REQUIRED | TOO_LONG | DUPLICATE | INVALID_COLOR | RETIRED | NOT_FOUND` ; repositories `listAll`, `create` (avec réactivation D2), `rename`, `recolor` (Étiquette, Catégorie), `retire`.
- Brouillons : `createEmptyDraft(sessionDefaults?)`, `createExerciseDraft(id, postActivityRecoverySeconds?)`, `createEmptyActivityDefinitionDraft(sideRecoverySecondsDefault?)`, `isSessionDraftDirty(draft, baseline?)` ; paramètres facultatifs aux valeurs actuelles du Domaine (T19).

### 6.2 Stockage — `migration008`

`DATABASE_VERSION = 8`. Migrations 001–007 inchangées (hashes 001–006 gelés ; `MIGRATION_007` gelé par un nouveau contrôle).

```sql
ALTER TABLE profiles ADD COLUMN session_initial_countdown_seconds_default INTEGER NOT NULL DEFAULT 10
  CHECK (session_initial_countdown_seconds_default BETWEEN 0 AND 3599);
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
-- clés calculées en JavaScript dans la transaction, puis :
CREATE UNIQUE INDEX labels_canonical_key_unique ON labels(canonical_key);
CREATE UNIQUE INDEX body_zones_canonical_key_unique ON body_zones(canonical_key);
-- activity_body_zones reconstruite : sans CHECK sur 10 ids, FK body_zones(id) ON UPDATE RESTRICT ON DELETE RESTRICT, lignes conservées
```

- Unicité sur toutes les entrées, actives et retirées : elle permet la réactivation D2 (une seule entrée par clé). `categories.canonical_key` est déjà unique.
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
| Modifier le profil | `app/profile-edit.tsx`, `src/features/preferences/ProfileEditScreen.tsx`, déclaration dans `app/_layout.tsx` | CE-UI-01 |
| Stepper Profil | `src/shared/ui/ProfileStepper.tsx` | D-227, ANI-06, T1–T6 |
| Icône de Zone | `src/shared/ui/BodyZoneIcon.tsx` ; enregistrement des deux icônes existantes dans `src/shared/ui/KodjoIcon.tsx` | RG-5, RG-10 |
| Sélecteurs | `src/features/reference-data/CategoryPickerModal.tsx`, `BodyZonePickerModal.tsx`, `LabelPickerModal.tsx` | CE-UI-09, CE-T03-16 |
| Dialogue d'appui long | `src/features/reference-data/ReferenceValueDialog.tsx` composé de `DecisionDialog` et `ColorPalette` existants : `Annuler`, `Modifier`, `Supprimer` | §4.10, D4 |
| Accès | `ExerciseScreen.tsx` (Catégorie, Zones), `ActivityEditorForm.tsx` / `BodyZoneSelector.tsx` (Zones), `CompositionScreen.tsx` (Étiquette) | CE-T03-04, CE-T03-08 |

Traductions : `src/shared/i18n/resources/fr.ts` (libellés CE-UI-07 L2515 et D-253, erreurs, dialogue) ; accessibilité : nom et état, unité et borne des steppers, « Silhouette homme/femme », couleur toujours accompagnée du nom, cibles ≥44×44.

## 7. Initialisation des défauts et non-rétroactivité

| Défaut | Destinataire | Point d'injection en PRE-2 | Preuve |
|---|---|---|---|
| Pause entre les côtés 10 s | Nouvel Exercice du Catalogue | `createEmptyActivityDefinitionDraft(profile)` dans `ExerciseScreen` | Exercice existant et brouillon ouvert inchangés |
| Récupération après exercice 30 s | Nouvelle occurrence (insertion Catalogue et Exercice local, en création et en modification de Séance) | `ActivitySelectionScreen`, `ExerciseScreen` (Exercice local) | Occurrences existantes inchangées ; valeur saisie conservée à l'enregistrement ; jamais copiée dans une définition |
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
| P2-21 | Critères UI (preuves visuelles et accessibilité) |
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

0. Lancer puis installer le nouveau build natif Routine Dev (runtime `1.1.0`, dépendances photo) ; la mise à jour OTA de la livraison ne vise que ce runtime.
1. Profil : six réglages, valeurs initiales ; un seul stepper ouvert ; maintien qui accélère ; boutons inactifs aux bornes (0 et 60 s pour les phases d'Exercice).
2. Modifier un défaut, fermer complètement l'app, rouvrir : valeur conservée.
3. Nouvelle Séance et nouvel Exercice : valeurs initiales = Profil ; une Séance existante n'a pas changé ; une récupération saisie reste après enregistrement.
4. Préférences : quatre interrupteurs ; Notifications désactivé par défaut, aucune demande système.
5. Modifier le profil : nom vide refusé ; photo choisie dans la galerie, conservée après relance ; annulation du choix sans effet ; silhouette femme → icône femme dans la modale Zones ; abandon sans modification.
6. Catégorie : toucher = choix et fermeture ; appui long → Modifier (nom, couleur) / Supprimer ; recréer le nom d'une Catégorie supprimée → elle réapparaît avec la couleur choisie et les Exercices qui l'utilisaient la conservent.
7. Zones : cocher plusieurs, Confirmer ; fermer sans confirmer restaure ; appui long → Modifier / Supprimer ; Zone créée enregistrée sur une occurrence de Séance.
8. Étiquette : choisir ; toucher à nouveau l'Étiquette choisie la retire ; appui long ne change pas le choix ; couleur de la Séance suit l'Étiquette ; seul Continuer enregistre.
9. Texte agrandi ; VoiceOver sur steppers, interrupteurs et silhouettes.

## 12. Points ouverts (avec preuve)

| # | Point | État |
|---|---|---|
| O1 | Dépendances photo hors de l'écriture d'un plan V2 (`scripts/kodjo/lib/plan-impact.js` L122–129) | **Levé** : préparation #286 (`5d133f42`) |
| O2 | Entrée en revue V2 d'un plan publié localement (`.github/workflows/kodjo-v2-slice-initial-plan-review.yml` L77–86 : seul un `PLAN_OUTPUT` du bot ou une publication PRE-1 codée en dur est accepté) | **Bloqué** : le correctif générique a été refusé par le contrôle de permissions ; aucune publication ni revue lancée |
| O3 | Icônes silhouette | **Levé** : préparation #287 (`53cb05c7`) |
| O4 | D-256 à D-259 dans les sources | **Levé** : #285 (`7fa6adc7`) ; plan réassemblé sur la baseline qui les contient |

## 13. Critères de sortie

1. O2 levé ; plan approuvé par la revue indépendante V2 ; 👍 de Hermann.
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

Tests existants modifiés : domaine (`Profile`, `Label`, `validation`, `BodyZone`, `SessionDraft`, `ActivityDefinition`), stockage (`migrateDatabase`, `targetSchema`, repositories Profil, Étiquette, Catégorie, Zone, Séance, définition d'Activité), fonctionnalités (`SessionService`, `SessionServiceProvider`, `SessionDraftProvider`, `ExerciseScreen`, `CompositionScreen`, `BodyZoneSelector`, `ActivitySelectionScreen`, `ActivityEditorForm`), transverses (`src/shared/i18n/index.test.ts`, `app/__tests__/rootLayoutGesture.test.tsx`). Les intégrations rendant les écrans (`CatalogueCompositionEditFlow`, `CompositionExerciseFlow`, `CategoriesSaveFlow`, `SessionDraftContext`) adaptent uniquement leurs fournisseurs ; aucune assertion existante n'est modifiée hors des comportements volontairement changés (récupération à l'enregistrement, défauts du brouillon, placeholder Profil).



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
src/features/sessions/CompositionScreen.tsx
src/features/sessions/ExerciseScreen.tsx
src/features/sessions/SessionDraftContext.tsx
src/features/sessions/SessionDraftProvider.tsx
src/features/sessions/SessionService.ts
src/features/sessions/SessionServiceProvider.tsx
src/features/sessions/__tests__/BodyZoneSelector.test.tsx
src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx
src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx
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

<KODJO_MODIFIED_MODULES_JSON>
[
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
    "change": "CREATE"
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
    "change": "CREATE"
  },
  {
    "path": "src/features/preferences/ProfileScreen.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/preferences/ProfileService.ts",
    "change": "CREATE"
  },
  {
    "path": "src/features/preferences/ProfileServiceContext.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/preferences/__tests__/ProfileScreen.test.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/preferences/__tests__/ProfileService.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/features/preferences/__tests__/profilePhoto.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/features/preferences/notificationPermission.ts",
    "change": "CREATE"
  },
  {
    "path": "src/features/preferences/profilePhoto.ts",
    "change": "CREATE"
  },
  {
    "path": "src/features/reference-data/BodyZonePickerModal.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/reference-data/CategoryPickerModal.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/reference-data/LabelPickerModal.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/reference-data/ReferenceValueDialog.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/reference-data/ReferentialService.ts",
    "change": "CREATE"
  },
  {
    "path": "src/features/reference-data/ReferentialServiceContext.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/features/reference-data/__tests__/ReferentialService.test.ts",
    "change": "CREATE"
  },
  {
    "path": "src/features/sessions/BodyZoneSelector.tsx",
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
    "change": "CREATE"
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
    "change": "CREATE"
  },
  {
    "path": "src/shared/ui/KodjoIcon.tsx",
    "change": "MODIFY"
  },
  {
    "path": "src/shared/ui/ProfileStepper.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/shared/ui/__tests__/BodyZoneIcon.test.tsx",
    "change": "CREATE"
  },
  {
    "path": "src/shared/ui/__tests__/ProfileStepper.test.tsx",
    "change": "CREATE"
  }
]
</KODJO_MODIFIED_MODULES_JSON>

<KODJO_PLAN_DECISIONS_JSON>
[
  {
    "path": "src/domain/sessions/__tests__/composition.test.ts",
    "classification": "TEST_UNAFFECTED",
    "justification": "Paramètres de brouillon facultatifs aux valeurs actuelles : appels existants inchangés."
  },
  {
    "path": "src/features/sessions/__tests__/useSessionCatalogue.test.ts",
    "classification": "TEST_UNAFFECTED",
    "justification": "Constructeur et lecture de SessionService inchangés."
  },
  {
    "path": "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Constructeur et lecture de SessionService inchangés."
  },
  {
    "path": "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "classification": "TEST_MUST_ADAPT",
    "justification": "Rend Composition et Exercice : ajout des fournisseurs Profil et référentiels, sans changer les assertions."
  },
  {
    "path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "classification": "TEST_MUST_ADAPT",
    "justification": "Rend les écrans sur base réelle : fournisseurs Profil et référentiels ajoutés ; la Récupération est copiée à la création de l’occurrence."
  },
  {
    "path": "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Écran d’enregistrement inchangé."
  },
  {
    "path": "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "classification": "TEST_MUST_ADAPT",
    "justification": "Rend Composition et Exercice par les routes : fournisseurs ajoutés, assertions inchangées."
  },
  {
    "path": "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "isSessionDraftDirty garde son comportement avec la baseline par défaut."
  },
  {
    "path": "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Garde de navigation inchangée ; brouillon créé avec les valeurs par défaut du Domaine hors fournisseur Profil."
  },
  {
    "path": "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "classification": "TEST_UNAFFECTED",
    "justification": "Présentation préservée."
  },
  {
    "path": "src/features/activities/__tests__/ActivityCard.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Carte préservée."
  },
  {
    "path": "src/infrastructure/database/__tests__/SqliteMediaRepository.test.ts",
    "classification": "TEST_UNAFFECTED",
    "justification": "Médias non modifiés ; la migration v8 ne touche pas leurs tables."
  },
  {
    "path": "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "classification": "TEST_UNAFFECTED",
    "justification": "Compare user_version à DATABASE_VERSION importé : suit la valeur 8 sans modification."
  },
  {
    "path": "app/__tests__/creationLayout.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Le fournisseur de brouillon reste montable sans fournisseur Profil (valeurs du Domaine)."
  },
  {
    "path": "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "classification": "TEST_MUST_ADAPT",
    "justification": "La valeur de contexte expose la baseline du brouillon."
  },
  {
    "path": "src/features/sessions/__tests__/SessionServiceContext.test.tsx",
    "classification": "TEST_UNAFFECTED",
    "justification": "Contexte de SessionService inchangé."
  },
  {
    "path": "app/(creation)/_layout.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Monte SessionDraftProvider sans nouvel argument."
  },
  {
    "path": "app/(creation)/activity-selection.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Route d’enrobage inchangée."
  },
  {
    "path": "app/(creation)/composition.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Route d’enrobage inchangée."
  },
  {
    "path": "app/(creation)/exercise.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Route d’enrobage inchangée."
  },
  {
    "path": "app/(tabs)/_layout.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
  },
  {
    "path": "src/domain/activities/ActivityDefinitionRepository.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Paramètre facultatif ajouté au brouillon ; interface inchangée."
  },
  {
    "path": "src/domain/activities/index.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Réexport inchangé."
  },
  {
    "path": "src/domain/categories/Category.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Nouveaux codes d’erreur ajoutés sans changer le type."
  },
  {
    "path": "src/domain/categories/validation.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Préservé ; nouveaux codes sans effet."
  },
  {
    "path": "src/domain/sessions/composition.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Fonctions de brouillon compatibles."
  },
  {
    "path": "src/domain/sessions/index.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "export * inchangé."
  },
  {
    "path": "src/domain/sessions/validation.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Constantes de Séance conservées."
  },
  {
    "path": "src/features/activities/ActivityCard.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Carte préservée."
  },
  {
    "path": "src/features/activities/ActivityDefinitionService.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Listes existantes conservées ; opérations dans ReferentialService."
  },
  {
    "path": "src/features/sessions/CatalogueScreen.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
  },
  {
    "path": "src/features/sessions/ColorPalette.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
  },
  {
    "path": "src/features/sessions/DurationWheelPicker.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
  },
  {
    "path": "src/features/sessions/NumberWheelPicker.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
  },
  {
    "path": "src/features/sessions/SessionCard.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
  },
  {
    "path": "src/features/sessions/SessionDraftContext.tsx",
    "classification": "MODIFY",
    "justification": "Expose la baseline du brouillon initialisé depuis le Profil pour la détection de modification."
  },
  {
    "path": "src/features/sessions/SessionServiceContext.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Contexte inchangé."
  },
  {
    "path": "src/features/sessions/compositionPresentation.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Présentation préservée."
  },
  {
    "path": "src/infrastructure/database/ExpoDatabase.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Adaptateur inchangé."
  },
  {
    "path": "src/infrastructure/database/initializeDatabase.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Utilise DATABASE_VERSION et migrateDatabase sans changement."
  },
  {
    "path": "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Outil natif inchangé (dérogation propre à PRE-1)."
  },
  {
    "path": "src/infrastructure/database/migrations/migration007.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Préservée ; constantes lues inchangées."
  },
  {
    "path": "src/infrastructure/database/repositories/SqliteMediaRepository.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Types de lignes Médias inchangés."
  },
  {
    "path": "src/shared/i18n/index.ts",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Point d’entrée des traductions inchangé."
  },
  {
    "path": "src/shared/ui/DisclosureControl.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
  },
  {
    "path": "src/shared/ui/ScreenShell.tsx",
    "classification": "CONSUMER_UNAFFECTED",
    "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
  }
]
</KODJO_PLAN_DECISIONS_JSON>

<KODJO_UI_CRITERIA_MATRIX_JSON>
{
  "schema": "kodjo.ui-criteria.v3",
  "criteria": [
    {
      "criterion_id": "UI-103FBF8D197A",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-01 L1965–2051",
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
        "src/shared/ui/KodjoIcon.tsx"
      ],
      "component_decision": "CREATE",
      "selected_component": {
        "path": "NONE",
        "export": "NONE"
      },
      "decision_justification": "Aucun écran d’identité ni sélecteur de photo n’existe ; les icônes de silhouette (6322:10874, 6322:10877, #287) sont enregistrées dans le registre KodjoIcon existant.",
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
          "assertion_id": "UI-103FBF8D197A-AACD685D38747",
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
          "assertion_id": "UI-103FBF8D197A-AFF58CD1BACEA",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L1981, L2025, L2033"
          },
          "property_type": "STATE",
          "expected": "Enregistrer persiste nom, photo et silhouette ensemble ; l’abandon restaure les valeurs enregistrées ; un échec d’enregistrement ne modifie rien.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-103FBF8D197A-AF987103B68A7",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2805 ; DSF RG-5, RG-10"
          },
          "property_type": "RELATION",
          "expected": "L’icône de Zone corporelle utilise la variante correspondant à la silhouette ; aucune donnée, liste ni calcul ne change.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-103FBF8D197A-AD824D01B96D1",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L2037"
          },
          "property_type": "CONTENT",
          "expected": "Les choix sont annoncés Silhouette homme et Silhouette femme avec leur état sélectionné.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-103FBF8D197A-AFA73F2401362",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L2001"
          },
          "property_type": "STYLE",
          "expected": "Silhouettes dans deux cercles de 64, hauteur 44, écart 24 ; choisie en bleu #0508E5 contour 2, non choisie en gris #9499A8 contour #CCD1E0.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-103FBF8D197A-A9CD4E457A189",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L2021, L2033"
          },
          "property_type": "STATE",
          "expected": "Un nom de 1 ou 80 caractères est accepté ; un nom vide ou de 81 caractères affiche une erreur liée au champ et l’écran reste ouvert.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-103FBF8D197A-A4FD2EB10B1D8",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L2033"
          },
          "property_type": "STATE",
          "expected": "Une photo absente ou introuvable affiche les initiales sans bloquer les champs ; un échec de lecture ou de copie affiche un message et conserve le brouillon.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-103FBF8D197A-AD52F95920B7A",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-01 L1985, L2029"
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
      "criterion_id": "UI-3ECC243E1B76",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-09 L2769–2857 ; §4.10 L128–145",
        "requirement": "Catégorie : choix unique validé au toucher, création, modification du nom et de la couleur, suppression logique par appui long, réactivation par création du même nom, opérations distinctes de l’enregistrement de l’Exercice."
      },
      "risk_types": [
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
      "decision_justification": "Le sélecteur inline existant n’a ni palette, ni modification, ni suppression ; une modale dédiée réutilisant ColorPalette et DecisionDialog est créée.",
      "change_targets": [
        "src/features/reference-data/CategoryPickerModal.tsx",
        "src/features/reference-data/ReferenceValueDialog.tsx",
        "src/features/reference-data/ReferentialService.ts",
        "src/features/reference-data/ReferentialServiceContext.tsx",
        "src/features/sessions/ExerciseScreen.tsx"
      ],
      "tests": [
        "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
        "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
        "src/features/reference-data/__tests__/ReferentialService.test.ts",
        "src/features/sessions/__tests__/ExerciseScreen.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-3ECC243E1B76-ACA559B78D94F",
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
          "assertion_id": "UI-3ECC243E1B76-A5B2E819BCF9D",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2829"
          },
          "property_type": "STATE",
          "expected": "Créer, modifier ou supprimer une Catégorie n’enregistre pas l’Exercice et conserve tous les autres champs du brouillon.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3ECC243E1B76-A2D759812B765",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2805 ; D-228"
          },
          "property_type": "STYLE",
          "expected": "Modale de sélection et palette au rendu des frames 4332:7095 et 4474:7157.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-3ECC243E1B76-ADBBE2DC5ABE2",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2817"
          },
          "property_type": "STATE",
          "expected": "Modifier renomme sans changer l’identifiant et change la couleur ; nom et couleur sont repris par les objets courants qui l’utilisent.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3ECC243E1B76-A8417DFDC8FC0",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "§4.10 L134–139"
          },
          "property_type": "STATE",
          "expected": "Supprimer confirmé retire la Catégorie des choix et conserve les affectations existantes avec nom et dernière couleur ; Annuler ne modifie rien.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3ECC243E1B76-A3E42865336F9",
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
          "assertion_id": "UI-3ECC243E1B76-AC873C19CD5A9",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2817 ; D-222"
          },
          "property_type": "INTERACTION",
          "expected": "Un toucher sur une Catégorie active la sélectionne et ferme la modale, sans bouton de validation supplémentaire.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3ECC243E1B76-A0CB65ABDA2C3",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2837"
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
      "criterion_id": "UI-6E8FBE118894",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-09 L2769–2857 ; §4.10 L128–145",
        "requirement": "Zones corporelles : sélection multiple validée explicitement, création, renommage, suppression logique, réactivation par création du même nom, aucune couleur, icône selon la silhouette."
      },
      "risk_types": [
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
      "decision_justification": "Le sélecteur actuel bascule directement le brouillon ; la validation explicite et la restauration à la fermeture exigent une modale dédiée.",
      "change_targets": [
        "src/features/reference-data/BodyZonePickerModal.tsx",
        "src/features/sessions/BodyZoneSelector.tsx",
        "src/features/activities/ActivityEditorForm.tsx"
      ],
      "tests": [
        "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
        "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
        "src/features/activities/__tests__/ActivityEditorForm.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-6E8FBE118894-A2959B0157A33",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2789, L2805"
          },
          "property_type": "PRESENCE",
          "expected": "Aucune palette ni couleur n’est proposée ou stockée pour une Zone.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-6E8FBE118894-A0FDDEAF48C24",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2805"
          },
          "property_type": "RELATION",
          "expected": "Chaque Zone de la modale porte l’icône de la silhouette du Profil.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-6E8FBE118894-A1FF92A662337",
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
          "assertion_id": "UI-6E8FBE118894-AF9FDD88D0270",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2825 ; D-199"
          },
          "property_type": "STATE",
          "expected": "Un nouvel Exercice exige au moins une Zone ; retirer une Zone affectée est permis s’il en reste une.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-6E8FBE118894-ABA5D2662CA69",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-09 L2785, L2817"
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
      "criterion_id": "UI-9194767E574D",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-07 L2545, L2561 ; matrice §5.4",
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
        "src/features/activities/ActivitySelectionScreen.tsx"
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
        "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "STATIC_ANALYSIS"
      ],
      "assertions": [
        {
          "assertion_id": "UI-9194767E574D-A08668FEC0C22",
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
          "assertion_id": "UI-9194767E574D-AC99E3D2E721D",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2561 ; matrice §5.4"
          },
          "property_type": "STATE",
          "expected": "Avec le vrai fournisseur et une base migrée, les services Profil et référentiels lisent et écrivent la base ; aucun écran n’appelle le contexte SQLite.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        },
        {
          "assertion_id": "UI-9194767E574D-A2A283F0E130C",
          "source": {
            "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
            "locator": "D-213 ; D-253"
          },
          "property_type": "STATE",
          "expected": "Un nouvel Exercice du Catalogue reçoit la Pause entre les côtés du Profil.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-9194767E574D-AC9DBDF9DEB90",
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
          "assertion_id": "UI-9194767E574D-A3DE880FD82B1",
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
    },
    {
      "criterion_id": "UI-BB15197A1525",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-07 L2495–2583",
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
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-BB15197A1525-A5E11D275C941",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2541, L2569"
          },
          "property_type": "STATE",
          "expected": "À la borne basse le bouton − est inactif, à la borne haute le bouton + est inactif, et la borne est annoncée.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-AB9955EC2601C",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2545, L2565"
          },
          "property_type": "STATE",
          "expected": "Aucune demande de permission système n’est faite depuis le Profil ; un état de permission refusé n’affiche jamais Notifications actif.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-A6CCA733E897F",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2569"
          },
          "property_type": "CONTENT",
          "expected": "Chaque interrupteur annonce son nom et son état ; chaque stepper annonce sa valeur, son unité et sa borne.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-A4ECDAA7AEE18",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2545, L2557, L2561"
          },
          "property_type": "STATE",
          "expected": "Chaque modification est persistée immédiatement et relue après réouverture ; les cinq autres valeurs ne changent pas.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-A08A39D59C0D0",
          "source": {
            "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
            "locator": "D-089 ; D-252 ; D-256 L390"
          },
          "property_type": "STATE",
          "expected": "Compte à rebours initial et Fin de séance : 0 à 3599 s, pas 1 s ; Compte à rebours d’exercice et Fin d’exercice : 0 à 60 s, pas 1 s.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-A0C53F41E3785",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2515"
          },
          "property_type": "PRESENCE",
          "expected": "Le groupe Exercice affiche Pause entre les côtés, Compte à rebours d’exercice et Fin d’exercice ; le groupe Séance affiche Récupération après exercice, Compte à rebours initial et Fin de séance ; aucune Pause globale entre Séries.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-AC6475C2EF08A",
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
          "assertion_id": "UI-BB15197A1525-ABE979211F53A",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2519"
          },
          "property_type": "STATE",
          "expected": "Sans modification, les six valeurs affichées sont 10 s, 10 s, 5 s, 30 s, 10 s et 5 s.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-A41D3F89C9B5A",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2515, L2519, L2573"
          },
          "property_type": "STATE",
          "expected": "Sons, Annonces vocales et Vibration sont activés et Notifications désactivé par défaut ; chaque interrupteur est indépendant et relu après réouverture.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-AA246BAA18DCA",
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
          "assertion_id": "UI-BB15197A1525-A2F33846A91BE",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2549"
          },
          "property_type": "INTERACTION",
          "expected": "Un appui incrémente immédiatement ; un maintien répète après 450 ms puis toutes les 150 ms et s’arrête au relâchement ; un seul enregistrement par geste.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-A357B7CAF9C19",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-UI-07 L2565"
          },
          "property_type": "STATE",
          "expected": "Un échec d’écriture affiche une erreur et restitue la dernière valeur confirmée.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "criterion_id": "UI-EF614F650E74",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-T03-16 L1606–1692 ; CE-T03-08 L880–928",
        "requirement": "Étiquette de Séance : zéro ou une, choix au toucher, désaffectation par nouveau toucher, administration du référentiel avec couleur, affectation enregistrée seulement à Continuer."
      },
      "risk_types": [
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
      "decision_justification": "Aucun sélecteur d’Étiquette n’existe ; le panneau Catégorie ne doit pas être réutilisé (CE-T03-16 L1642).",
      "change_targets": [
        "src/features/reference-data/LabelPickerModal.tsx",
        "src/features/sessions/CompositionScreen.tsx"
      ],
      "tests": [
        "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
        "src/features/sessions/__tests__/CompositionScreen.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "assertions": [
        {
          "assertion_id": "UI-EF614F650E74-A2CD59253F74A",
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
          "assertion_id": "UI-EF614F650E74-A9FB726338EE5",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-T03-16 L1666 ; CE-T03-08 L928"
          },
          "property_type": "STATE",
          "expected": "L’affectation est enregistrée seulement à Continuer ; les opérations du référentiel n’enregistrent pas la Séance ; la couleur de la Séance suit l’Étiquette.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-EF614F650E74-AC6613721B294",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-T03-16 L1642"
          },
          "property_type": "STYLE",
          "expected": "Modale d’Étiquettes et palette au rendu des frames 2028:11204, 4581:6404 et 4640:6308.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-EF614F650E74-A03C567FAE159",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-T03-16 L1654 ; D-259 L393"
          },
          "property_type": "INTERACTION",
          "expected": "Un appui long ouvre le dialogue Annuler / Modifier / Supprimer sans sélectionner ni désaffecter.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-EF614F650E74-A3409468666E5",
          "source": {
            "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
            "locator": "CE-T03-16 L1622 ; D-259 L393"
          },
          "property_type": "INTERACTION",
          "expected": "Un toucher sur une Étiquette la sélectionne et ferme la modale ; un nouveau toucher sur l’Étiquette sélectionnée retire l’affectation.",
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
      "locator": "Profil L145–150 ; préférences L840–865 ; référentiels L885–976",
      "requirement": "Schéma cible v8 : Profil complété (deux défauts de Séance, quatre préférences, identité, silhouette), clés normalisées uniques pour Étiquettes et Zones, liaison des Zones d’occurrence ouverte à toute Zone du référentiel ; migration additive convergente pour base neuve et base PRE-1 avec données, idempotente, annulée en cas d’erreur."
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
      "locator": "CE-UI-09 L2837 ; §4.10 L140",
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
      "requirement": "Référentiels Étiquette, Catégorie, Zone : lister, créer avec réactivation d’une entrée retirée de même clé normalisée, renommer sans changer l’identifiant, changer la couleur (Étiquette, Catégorie), retirer logiquement ; refuser un doublon actif ; refuser une nouvelle affectation à une valeur retirée tout en conservant les affectations existantes ; opérations atomiques."
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
      "locator": "CE-UI-07 L2515–2565 ; CE-UI-01 L1985–2033",
      "requirement": "Profil : six défauts distincts avec leurs bornes (pauses 0..300 sur grille, phases d’Exercice 0..60 pas 1, phases de Séance 0..3599 pas 1), quatre préférences, nom 1..80 ou absent, photo, silhouette homme/femme ou absente ; lecture et mises à jour atomiques."
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
      "requirement": "Fonctions de brouillon recevant les valeurs initiales du Profil (Séance, occurrence, Exercice du Catalogue) et détection de modification relative au brouillon initial réellement créé."
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
  }
]
</KODJO_NON_UI_REQUIREMENTS_JSON>

<KODJO_NON_UI_COVERAGE_JSON>
{
  "status": "ENUMERATED",
  "reason": "Exigences non UI de stockage, de référentiels, de Profil et de brouillons tirées des chapitres 09 et 13 et du registre 07.",
  "source_paths": [
    "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
    "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
    "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md"
  ]
}
</KODJO_NON_UI_COVERAGE_JSON>

<KODJO_REQUIREMENT_CONTRACT_JSON>
{
  "schema": "kodjo.requirement-contract.v1",
  "requirement_count": 11,
  "requirement_ids_sha256": "26226cde63b3debf93b2c2283c68da2bab9928050a0542f91800032bbf8fa74c",
  "requirements": [
    {
      "requirement_id": "REQ-0A882C7C5D9F469B",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": "docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md",
        "locator": "D-213",
        "requirement": "Fonctions de brouillon recevant les valeurs initiales du Profil (Séance, occurrence, Exercice du Catalogue) et détection de modification relative au brouillon initial réellement créé."
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
      "requirement_id": "REQ-156EDCBC434B015A",
      "domain": "NON_UI",
      "requirement_type": "FUNCTIONAL",
      "source": {
        "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
        "locator": "L885–976 ; L1222–1226",
        "requirement": "Référentiels Étiquette, Catégorie, Zone : lister, créer avec réactivation d’une entrée retirée de même clé normalisée, renommer sans changer l’identifiant, changer la couleur (Étiquette, Catégorie), retirer logiquement ; refuser un doublon actif ; refuser une nouvelle affectation à une valeur retirée tout en conservant les affectations existantes ; opérations atomiques."
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
      "requirement_id": "REQ-5CC77DFDC4EDF091",
      "domain": "NON_UI",
      "requirement_type": "MIGRATION",
      "source": {
        "path": "docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md",
        "locator": "Profil L145–150 ; préférences L840–865 ; référentiels L885–976",
        "requirement": "Schéma cible v8 : Profil complété (deux défauts de Séance, quatre préférences, identité, silhouette), clés normalisées uniques pour Étiquettes et Zones, liaison des Zones d’occurrence ouverte à toute Zone du référentiel ; migration additive convergente pour base neuve et base PRE-1 avec données, idempotente, annulée en cas d’erreur."
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
      "requirement_id": "REQ-6DD75669B2EA6E48",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-T03-16 L1606–1692 ; CE-T03-08 L880–928",
        "requirement": "Étiquette de Séance : zéro ou une, choix au toucher, désaffectation par nouveau toucher, administration du référentiel avec couleur, affectation enregistrée seulement à Continuer."
      },
      "change_targets": [
        "src/features/reference-data/LabelPickerModal.tsx",
        "src/features/sessions/CompositionScreen.tsx"
      ],
      "tests": [
        "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
        "src/features/sessions/__tests__/CompositionScreen.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-EF614F650E74",
        "component_decision": "CREATE",
        "selected_component": {
          "path": "NONE",
          "export": "NONE"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-EF614F650E74-A2CD59253F74A",
          "property_type": "STATE",
          "expected": "Créer un nom nouveau ajoute une Étiquette avec la couleur choisie ; un nom actif est refusé ; un nom retiré la réactive avec son identifiant, ses Séances associées et la couleur choisie ; Modifier renomme et recolore sans changer l’identifiant.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-EF614F650E74-A9FB726338EE5",
          "property_type": "STATE",
          "expected": "L’affectation est enregistrée seulement à Continuer ; les opérations du référentiel n’enregistrent pas la Séance ; la couleur de la Séance suit l’Étiquette.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-EF614F650E74-AC6613721B294",
          "property_type": "STYLE",
          "expected": "Modale d’Étiquettes et palette au rendu des frames 2028:11204, 4581:6404 et 4640:6308.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-EF614F650E74-A03C567FAE159",
          "property_type": "INTERACTION",
          "expected": "Un appui long ouvre le dialogue Annuler / Modifier / Supprimer sans sélectionner ni désaffecter.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-EF614F650E74-A3409468666E5",
          "property_type": "INTERACTION",
          "expected": "Un toucher sur une Étiquette la sélectionne et ferme la modale ; un nouveau toucher sur l’Étiquette sélectionnée retire l’affectation.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-77BDA28D6261646F",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-07 L2495–2583",
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
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-BB15197A1525",
        "component_decision": "CREATE",
        "selected_component": {
          "path": "NONE",
          "export": "NONE"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-BB15197A1525-A5E11D275C941",
          "property_type": "STATE",
          "expected": "À la borne basse le bouton − est inactif, à la borne haute le bouton + est inactif, et la borne est annoncée.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-AB9955EC2601C",
          "property_type": "STATE",
          "expected": "Aucune demande de permission système n’est faite depuis le Profil ; un état de permission refusé n’affiche jamais Notifications actif.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-A6CCA733E897F",
          "property_type": "CONTENT",
          "expected": "Chaque interrupteur annonce son nom et son état ; chaque stepper annonce sa valeur, son unité et sa borne.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-A4ECDAA7AEE18",
          "property_type": "STATE",
          "expected": "Chaque modification est persistée immédiatement et relue après réouverture ; les cinq autres valeurs ne changent pas.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-A08A39D59C0D0",
          "property_type": "STATE",
          "expected": "Compte à rebours initial et Fin de séance : 0 à 3599 s, pas 1 s ; Compte à rebours d’exercice et Fin d’exercice : 0 à 60 s, pas 1 s.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-A0C53F41E3785",
          "property_type": "PRESENCE",
          "expected": "Le groupe Exercice affiche Pause entre les côtés, Compte à rebours d’exercice et Fin d’exercice ; le groupe Séance affiche Récupération après exercice, Compte à rebours initial et Fin de séance ; aucune Pause globale entre Séries.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-AC6475C2EF08A",
          "property_type": "STATE",
          "expected": "Pause entre les côtés et Récupération : 0 à 300 s sur la grille 0,1,2,3,4,5,10,15…120,150,180…300 ; une valeur stockée hors grille n’est pas arrondie à l’affichage, + passe à la valeur de grille supérieure et − à la valeur inférieure.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-ABE979211F53A",
          "property_type": "STATE",
          "expected": "Sans modification, les six valeurs affichées sont 10 s, 10 s, 5 s, 30 s, 10 s et 5 s.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-A41D3F89C9B5A",
          "property_type": "STATE",
          "expected": "Sons, Annonces vocales et Vibration sont activés et Notifications désactivé par défaut ; chaque interrupteur est indépendant et relu après réouverture.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-AA246BAA18DCA",
          "property_type": "STYLE",
          "expected": "Stepper au rendu lavande DSF remplaçant la valeur sur sa ligne ; un seul stepper ouvert à la fois.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-A2F33846A91BE",
          "property_type": "INTERACTION",
          "expected": "Un appui incrémente immédiatement ; un maintien répète après 450 ms puis toutes les 150 ms et s’arrête au relâchement ; un seul enregistrement par geste.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-BB15197A1525-A357B7CAF9C19",
          "property_type": "STATE",
          "expected": "Un échec d’écriture affiche une erreur et restitue la dernière valeur confirmée.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-8600BA45E6FDDDD2",
      "domain": "NON_UI",
      "requirement_type": "TECHNICAL",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-09 L2837 ; §4.10 L140",
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
      "requirement_id": "REQ-93B15A2EDF4C0619",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-09 L2769–2857 ; §4.10 L128–145",
        "requirement": "Zones corporelles : sélection multiple validée explicitement, création, renommage, suppression logique, réactivation par création du même nom, aucune couleur, icône selon la silhouette."
      },
      "change_targets": [
        "src/features/activities/ActivityEditorForm.tsx",
        "src/features/reference-data/BodyZonePickerModal.tsx",
        "src/features/sessions/BodyZoneSelector.tsx"
      ],
      "tests": [
        "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
        "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
        "src/features/sessions/__tests__/BodyZoneSelector.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-6E8FBE118894",
        "component_decision": "CREATE",
        "selected_component": {
          "path": "NONE",
          "export": "NONE"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-6E8FBE118894-A2959B0157A33",
          "property_type": "PRESENCE",
          "expected": "Aucune palette ni couleur n’est proposée ou stockée pour une Zone.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-6E8FBE118894-A0FDDEAF48C24",
          "property_type": "RELATION",
          "expected": "Chaque Zone de la modale porte l’icône de la silhouette du Profil.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-6E8FBE118894-A1FF92A662337",
          "property_type": "STATE",
          "expected": "Créer un nom nouveau ajoute une Zone ; un nom actif est refusé ; un nom retiré réactive la Zone avec son identifiant et ses associations ; Modifier renomme sans changer l’identifiant ; Supprimer conserve les affectations existantes.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-6E8FBE118894-AF9FDD88D0270",
          "property_type": "STATE",
          "expected": "Un nouvel Exercice exige au moins une Zone ; retirer une Zone affectée est permis s’il en reste une.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-6E8FBE118894-ABA5D2662CA69",
          "property_type": "INTERACTION",
          "expected": "Un toucher bascule une Zone ; Confirmer applique la sélection ; fermer sans confirmer restaure la sélection précédente.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-9901F561E1ABA4B6",
      "domain": "NON_UI",
      "requirement_type": "DATA",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-07 L2515–2565 ; CE-UI-01 L1985–2033",
        "requirement": "Profil : six défauts distincts avec leurs bornes (pauses 0..300 sur grille, phases d’Exercice 0..60 pas 1, phases de Séance 0..3599 pas 1), quatre préférences, nom 1..80 ou absent, photo, silhouette homme/femme ou absente ; lecture et mises à jour atomiques."
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
      "requirement_id": "REQ-B316754B885B0E70",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-07 L2545, L2561 ; matrice §5.4",
        "requirement": "Branchement réel des services Profil et référentiels et initialisation des nouveaux objets depuis le Profil, sans rétroactivité."
      },
      "change_targets": [
        "src/features/activities/ActivitySelectionScreen.tsx",
        "src/features/sessions/SessionDraftContext.tsx",
        "src/features/sessions/SessionDraftProvider.tsx",
        "src/features/sessions/SessionService.ts",
        "src/features/sessions/SessionServiceProvider.tsx"
      ],
      "tests": [
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
        "criterion_id": "UI-9194767E574D",
        "component_decision": "EXTEND",
        "selected_component": {
          "path": "src/features/sessions/SessionServiceProvider.tsx",
          "export": "SessionServiceProvider"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-9194767E574D-A08668FEC0C22",
          "property_type": "STATE",
          "expected": "Après modification du Profil, les objets existants et les brouillons déjà initialisés gardent leurs valeurs ; seuls les nouveaux objets reçoivent la nouvelle valeur.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-9194767E574D-AC99E3D2E721D",
          "property_type": "STATE",
          "expected": "Avec le vrai fournisseur et une base migrée, les services Profil et référentiels lisent et écrivent la base ; aucun écran n’appelle le contexte SQLite.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "STATIC_ANALYSIS"
          ]
        },
        {
          "assertion_id": "UI-9194767E574D-A2A283F0E130C",
          "property_type": "STATE",
          "expected": "Un nouvel Exercice du Catalogue reçoit la Pause entre les côtés du Profil.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-9194767E574D-AC9DBDF9DEB90",
          "property_type": "STATE",
          "expected": "Une nouvelle Séance reçoit Compte à rebours initial et Fin de séance du Profil ; un brouillon neuf n’est pas considéré modifié.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-9194767E574D-A3DE880FD82B1",
          "property_type": "STATE",
          "expected": "Une occurrence créée par insertion depuis le Catalogue ou comme Exercice local, en création comme en modification de Séance, reçoit la Récupération du Profil ; la valeur saisie est conservée à l’enregistrement ; aucune définition du Catalogue ne la reçoit.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-C14B5ED9A68C8ECC",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-01 L1965–2051",
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
        "criterion_id": "UI-103FBF8D197A",
        "component_decision": "CREATE",
        "selected_component": {
          "path": "NONE",
          "export": "NONE"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-103FBF8D197A-AACD685D38747",
          "property_type": "INTERACTION",
          "expected": "Ajouter une photo ouvre uniquement la galerie ; une annulation ne modifie pas le brouillon ; une image choisie est copiée dans le stockage local persistant de l’app.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-103FBF8D197A-AFF58CD1BACEA",
          "property_type": "STATE",
          "expected": "Enregistrer persiste nom, photo et silhouette ensemble ; l’abandon restaure les valeurs enregistrées ; un échec d’enregistrement ne modifie rien.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-103FBF8D197A-AF987103B68A7",
          "property_type": "RELATION",
          "expected": "L’icône de Zone corporelle utilise la variante correspondant à la silhouette ; aucune donnée, liste ni calcul ne change.",
          "proof_required": [
            "FUNCTIONAL_TEST",
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-103FBF8D197A-AD824D01B96D1",
          "property_type": "CONTENT",
          "expected": "Les choix sont annoncés Silhouette homme et Silhouette femme avec leur état sélectionné.",
          "proof_required": [
            "ACCESSIBILITY_CHECK",
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-103FBF8D197A-AFA73F2401362",
          "property_type": "STYLE",
          "expected": "Silhouettes dans deux cercles de 64, hauteur 44, écart 24 ; choisie en bleu #0508E5 contour 2, non choisie en gris #9499A8 contour #CCD1E0.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-103FBF8D197A-A9CD4E457A189",
          "property_type": "STATE",
          "expected": "Un nom de 1 ou 80 caractères est accepté ; un nom vide ou de 81 caractères affiche une erreur liée au champ et l’écran reste ouvert.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-103FBF8D197A-A4FD2EB10B1D8",
          "property_type": "STATE",
          "expected": "Une photo absente ou introuvable affiche les initiales sans bloquer les champs ; un échec de lecture ou de copie affiche un message et conserve le brouillon.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-103FBF8D197A-AD52F95920B7A",
          "property_type": "STATE",
          "expected": "Une silhouette absente est affichée homme ; femme choisie puis enregistrée est relue après réouverture.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    },
    {
      "requirement_id": "REQ-CB816056E7750B1E",
      "domain": "UI",
      "requirement_type": "UI",
      "source": {
        "path": "docs/Specifications-fonctionnelles/13 – Contrats d’écran.md",
        "locator": "CE-UI-09 L2769–2857 ; §4.10 L128–145",
        "requirement": "Catégorie : choix unique validé au toucher, création, modification du nom et de la couleur, suppression logique par appui long, réactivation par création du même nom, opérations distinctes de l’enregistrement de l’Exercice."
      },
      "change_targets": [
        "src/features/reference-data/CategoryPickerModal.tsx",
        "src/features/reference-data/ReferenceValueDialog.tsx",
        "src/features/reference-data/ReferentialService.ts",
        "src/features/reference-data/ReferentialServiceContext.tsx",
        "src/features/sessions/ExerciseScreen.tsx"
      ],
      "tests": [
        "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
        "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
        "src/features/reference-data/__tests__/ReferentialService.test.ts",
        "src/features/sessions/__tests__/ExerciseScreen.test.tsx"
      ],
      "proof_required": [
        "FUNCTIONAL_TEST",
        "VISUAL_COMPARE"
      ],
      "status": "DEFINED",
      "ui_binding": {
        "criterion_id": "UI-3ECC243E1B76",
        "component_decision": "CREATE",
        "selected_component": {
          "path": "NONE",
          "export": "NONE"
        }
      },
      "assertions": [
        {
          "assertion_id": "UI-3ECC243E1B76-ACA559B78D94F",
          "property_type": "STATE",
          "expected": "Créer un nom nouveau ajoute une Catégorie active avec la couleur choisie ; un nom d’une Catégorie active est refusé comme doublon ; un nom d’une Catégorie retirée la réactive avec le même identifiant, ses associations et la couleur choisie.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3ECC243E1B76-A5B2E819BCF9D",
          "property_type": "STATE",
          "expected": "Créer, modifier ou supprimer une Catégorie n’enregistre pas l’Exercice et conserve tous les autres champs du brouillon.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3ECC243E1B76-A2D759812B765",
          "property_type": "STYLE",
          "expected": "Modale de sélection et palette au rendu des frames 4332:7095 et 4474:7157.",
          "proof_required": [
            "VISUAL_COMPARE"
          ]
        },
        {
          "assertion_id": "UI-3ECC243E1B76-ADBBE2DC5ABE2",
          "property_type": "STATE",
          "expected": "Modifier renomme sans changer l’identifiant et change la couleur ; nom et couleur sont repris par les objets courants qui l’utilisent.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3ECC243E1B76-A8417DFDC8FC0",
          "property_type": "STATE",
          "expected": "Supprimer confirmé retire la Catégorie des choix et conserve les affectations existantes avec nom et dernière couleur ; Annuler ne modifie rien.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3ECC243E1B76-A3E42865336F9",
          "property_type": "INTERACTION",
          "expected": "Un appui long ouvre le dialogue Annuler / Modifier / Supprimer sans modifier la sélection.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3ECC243E1B76-AC873C19CD5A9",
          "property_type": "INTERACTION",
          "expected": "Un toucher sur une Catégorie active la sélectionne et ferme la modale, sans bouton de validation supplémentaire.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        },
        {
          "assertion_id": "UI-3ECC243E1B76-A0CB65ABDA2C3",
          "property_type": "STATE",
          "expected": "Une Catégorie retirée entre lecture et choix provoque un message et conserve le brouillon de l’Exercice.",
          "proof_required": [
            "FUNCTIONAL_TEST"
          ]
        }
      ]
    }
  ]
}
</KODJO_REQUIREMENT_CONTRACT_JSON>

<KODJO_TEST_CONTRACT_JSON>
{
  "schema": "kodjo.test-contract.v1",
  "binding_count": 41,
  "bindings": [
    {
      "requirement_id": "REQ-0A882C7C5D9F469B",
      "test_path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-0A882C7C5D9F469B",
      "test_path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-156EDCBC434B015A",
      "test_path": "src/domain/body-zones/__tests__/BodyZone.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-156EDCBC434B015A",
      "test_path": "src/domain/categories/__tests__/validation.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-156EDCBC434B015A",
      "test_path": "src/domain/labels/__tests__/Label.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-156EDCBC434B015A",
      "test_path": "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-156EDCBC434B015A",
      "test_path": "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-156EDCBC434B015A",
      "test_path": "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-156EDCBC434B015A",
      "test_path": "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-156EDCBC434B015A",
      "test_path": "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-5CC77DFDC4EDF091",
      "test_path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-5CC77DFDC4EDF091",
      "test_path": "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-6DD75669B2EA6E48",
      "test_path": "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-6DD75669B2EA6E48",
      "test_path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-77BDA28D6261646F",
      "test_path": "src/features/preferences/__tests__/ProfileScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-77BDA28D6261646F",
      "test_path": "src/features/preferences/__tests__/ProfileService.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-77BDA28D6261646F",
      "test_path": "src/shared/i18n/index.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-77BDA28D6261646F",
      "test_path": "src/shared/ui/__tests__/ProfileStepper.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-8600BA45E6FDDDD2",
      "test_path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-93B15A2EDF4C0619",
      "test_path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-93B15A2EDF4C0619",
      "test_path": "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-93B15A2EDF4C0619",
      "test_path": "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-9901F561E1ABA4B6",
      "test_path": "src/domain/preferences/__tests__/Profile.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-9901F561E1ABA4B6",
      "test_path": "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B316754B885B0E70",
      "test_path": "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B316754B885B0E70",
      "test_path": "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B316754B885B0E70",
      "test_path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B316754B885B0E70",
      "test_path": "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B316754B885B0E70",
      "test_path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B316754B885B0E70",
      "test_path": "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B316754B885B0E70",
      "test_path": "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B316754B885B0E70",
      "test_path": "src/features/sessions/__tests__/SessionService.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-B316754B885B0E70",
      "test_path": "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C14B5ED9A68C8ECC",
      "test_path": "app/__tests__/rootLayoutGesture.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C14B5ED9A68C8ECC",
      "test_path": "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C14B5ED9A68C8ECC",
      "test_path": "src/features/preferences/__tests__/profilePhoto.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-C14B5ED9A68C8ECC",
      "test_path": "src/shared/ui/__tests__/BodyZoneIcon.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-CB816056E7750B1E",
      "test_path": "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-CB816056E7750B1E",
      "test_path": "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-CB816056E7750B1E",
      "test_path": "src/features/reference-data/__tests__/ReferentialService.test.ts",
      "proof_type": "FUNCTIONAL_TEST"
    },
    {
      "requirement_id": "REQ-CB816056E7750B1E",
      "test_path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "proof_type": "FUNCTIONAL_TEST"
    }
  ]
}
</KODJO_TEST_CONTRACT_JSON>

<KODJO_BOUNDARY_CONTRACT_JSON>
{
  "schema": "kodjo.boundary-contract.v1",
  "boundary_count": 21,
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


<KODJO_PLAN_IMPACT_JSON>
{
  "schema": "kodjo.plan-impact.v1",
  "scan_revision": "53cb05c782e17eb19d269f2724a0db3cfbceb1a2",
  "scan_sha256": "57a8876544aeefc7612b69d07c454c778a68cffaa5c133d7e285fa40fc7f0dfa",
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
      "change": "CREATE"
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
      "change": "CREATE"
    },
    {
      "path": "src/features/preferences/ProfileScreen.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/preferences/ProfileService.ts",
      "change": "CREATE"
    },
    {
      "path": "src/features/preferences/ProfileServiceContext.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/preferences/__tests__/ProfileScreen.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/preferences/__tests__/ProfileService.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/features/preferences/__tests__/profilePhoto.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/features/preferences/notificationPermission.ts",
      "change": "CREATE"
    },
    {
      "path": "src/features/preferences/profilePhoto.ts",
      "change": "CREATE"
    },
    {
      "path": "src/features/reference-data/BodyZonePickerModal.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/reference-data/CategoryPickerModal.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/reference-data/LabelPickerModal.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/reference-data/ReferenceValueDialog.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/reference-data/ReferentialService.ts",
      "change": "CREATE"
    },
    {
      "path": "src/features/reference-data/ReferentialServiceContext.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/reference-data/__tests__/ReferentialService.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/features/sessions/BodyZoneSelector.tsx",
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
      "change": "CREATE"
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
      "change": "CREATE"
    },
    {
      "path": "src/shared/ui/KodjoIcon.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/ui/ProfileStepper.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/shared/ui/__tests__/BodyZoneIcon.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/shared/ui/__tests__/ProfileStepper.test.tsx",
      "change": "CREATE"
    }
  ],
  "rows": [
    {
      "path": "app/(tabs)/profile.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "app/__tests__/rootLayoutGesture.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "app/_layout.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "app/profile-edit.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/activities/ActivityDefinition.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/activities/__tests__/ActivityDefinition.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/body-zones/BodyZone.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/body-zones/BodyZoneRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/body-zones/__tests__/BodyZone.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/body-zones/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/categories/CategoryRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/categories/__tests__/validation.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/categories/errors.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/categories/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/labels/Label.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/labels/LabelRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/labels/__tests__/Label.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/labels/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/preferences/Profile.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/preferences/ProfileRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/preferences/__tests__/Profile.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/preferences/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/SessionDraft.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/defaults.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/ActivityEditorForm.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/ActivitySelectionScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/__tests__/ActivityEditorForm.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/activities/__tests__/ActivitySelectionScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/preferences/ProfileEditScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/preferences/ProfileScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/preferences/ProfileService.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/preferences/ProfileServiceContext.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/preferences/__tests__/ProfileEditScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/preferences/__tests__/ProfileScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/preferences/__tests__/ProfileService.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/preferences/__tests__/profilePhoto.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/preferences/notificationPermission.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/preferences/profilePhoto.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/reference-data/BodyZonePickerModal.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/reference-data/CategoryPickerModal.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/reference-data/LabelPickerModal.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/reference-data/ReferenceValueDialog.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/reference-data/ReferentialService.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/reference-data/ReferentialServiceContext.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/reference-data/__tests__/CategoryPickerModal.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/reference-data/__tests__/LabelPickerModal.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/reference-data/__tests__/ReferenceValueDialog.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/reference-data/__tests__/ReferentialService.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/BodyZoneSelector.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/CompositionScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/ExerciseScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/SessionDraftProvider.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/SessionService.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/SessionServiceProvider.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/SessionService.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteActivityDefinitionRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteBodyZoneRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteLabelRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteProfileRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/__tests__/targetSchema.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/constants.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/migrateDatabase.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/migrations/migration008.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteLabelRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteProfileRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/infrastructure/database/types/DatabaseRows.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/i18n/index.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/i18n/resources/fr.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/ui/BodyZoneIcon.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/ui/KodjoIcon.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/ui/ProfileStepper.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/ui/__tests__/BodyZoneIcon.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/shared/ui/__tests__/ProfileStepper.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module explicitement déclaré par le plan initial."
    },
    {
      "path": "src/domain/sessions/__tests__/composition.test.ts",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts"
      ],
      "risk_score": 150,
      "classification": "TEST_UNAFFECTED",
      "justification": "Paramètres de brouillon facultatifs aux valeurs actuelles : appels existants inchangés."
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
        "src/features/sessions/SessionService.ts",
        "src/infrastructure/database/migrateDatabase.ts",
        "src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts",
        "src/infrastructure/database/repositories/SqliteBodyZoneRepository.ts",
        "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
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
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 138,
      "classification": "TEST_UNAFFECTED",
      "justification": "Écran d’enregistrement inchangé."
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
      "path": "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
      "candidate_kind": "TEST",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts"
      ],
      "risk_score": 112,
      "classification": "TEST_MUST_ADAPT",
      "justification": "La valeur de contexte expose la baseline du brouillon."
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
        "src/features/sessions/CompositionScreen.tsx"
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
      "path": "src/features/sessions/ColorPalette.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/shared/ui/KodjoIcon.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Utilise des icônes existantes du registre KodjoIcon ; deux entrées ajoutées, entrées existantes inchangées."
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
      "path": "src/features/sessions/SessionDraftContext.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/SessionDraft.ts"
      ],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Expose la baseline du brouillon initialisé depuis le Profil pour la détection de modification."
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
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionDraftContext.tsx",
    "src/features/sessions/SessionDraftProvider.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/SessionServiceProvider.tsx",
    "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
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

<KODJO_UI_PLAN_CONTRACT_JSON>
{
  "schema": "kodjo.ui-plan-contract.v1",
  "contract_version": 2,
  "protocol_commit": "53cb05c782e17eb19d269f2724a0db3cfbceb1a2",
  "scan_revision": "53cb05c782e17eb19d269f2724a0db3cfbceb1a2",
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
  "assertion_count": 43,
  "assertion_ids_sha256": "70ffa87d6d37a1d3ec307c0e29a326985fefcd7fc46b793a4205df8718fc34c6",
  "matrix_sha256": "ba9ceba9d3b37c6c86d3ef8c2c8df4af80d4f185cdf2e86e666eac98828e3882"
}
</KODJO_UI_PLAN_CONTRACT_JSON>

<KODJO_PLAN_CONTRACT_JSON>
{
  "schema": "kodjo.plan-contract-consistency.v2",
  "contract_version": 2,
  "protocol_commit": "53cb05c782e17eb19d269f2724a0db3cfbceb1a2",
  "scan_revision": "53cb05c782e17eb19d269f2724a0db3cfbceb1a2",
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
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionDraftContext.tsx",
    "src/features/sessions/SessionDraftProvider.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/SessionServiceProvider.tsx",
    "src/features/sessions/__tests__/BodyZoneSelector.test.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
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
  "requirement_contract_sha256": "1ad327ef0ecddca000c86426ef59c647187aee3f7df79f030310325fdb736116",
  "test_contract_sha256": "1cea683dc0239ab74671c976ec0a758434b53fe07f58f65e78bb1d81987be86e",
  "boundary_contract_sha256": "288d0035b51f97c98212850402581a5a98c161135e81927c836eaf456e0c7fdf",
  "requirement_count": 11
}
</KODJO_PLAN_CONTRACT_JSON>

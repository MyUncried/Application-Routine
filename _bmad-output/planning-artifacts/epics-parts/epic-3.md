## Epic 3 : Régler chaque Série dans la Feuille Paramètres d'exécution

**Objectif.** Dans la Feuille Paramètres d'exécution, Hermann choisit le Mode, le Changement de côté, l'Ordre des côtés et le Régime dans des popovers natifs ancrés à leur ligne. Il règle chaque Cible, numérique ou à l'échec, avec la roulette native et ses propres ✕ / ✓, présentée centrée, sans flèche, dans la couche `WheelPickerOverlay` de PRE-3 (Q37) : minutes-secondes en Durée, une colonne en Répétitions. Il gère le Tableau des séries variables par Cellule active et Pied commun, avec glisser, retrait et annulation. Il lit la Durée totale selon sa nature et peut l'inverser quand la règle le permet. Aucun réglage n'est perdu en changeant de Mode ou de N, et rien n'est enregistré avant le ✓ de la Feuille puis `Terminer`.

*Révision après la porte post-revue du 2026-10-16 (M1, F1 à F3) : AD-15 complété (T1 à T27) ; 3.3 AC8 et 3.6 AC2, AC3, AC9 alignés (champ ± ouvert : un seul geste, ± sans fermeture, N diminué sans fermer le champ ; surfaces natives : appui absorbé ; `Annuler` sans rangement) ; `R-3.6-09` ajouté.*

*Révision du 2026-10-17 (recette iPhone) : Q35 (Cible à renseigner signalée par un fond `#FFF1F0`, sans liseré ni contour, reporté dans le texte de 3.3 AC10 et `R-3.3-05`, 3.4 AC3 et AC10, 3.6 AC4, AC7, tests, `R-3.6-07` et `R-3.6-08`, et des états sans frame de la Feuille ; le reste de D-337 est inchangé) ; Q36 (Cible Durée à la seconde : bornes 5..3535 inchangées, roulette au pas de 1 s, ± au pas de base 1 avec la politique existante `EXECUTION_ACCELERATED_HOLD_POLICY`, `nearestGridValue` réduit à un bornage) : 3.4 AC2, AC4, AC10, preuves et `R-3.4-03`, `R-3.4-04` ; 3.6 AC4, AC5, AC6 et `R-3.6-01` corrigés.*

*Révision du 2026-10-17 (recette iPhone, écarts E-10 et E-11) : Q37 (la roue d'un Sélecteur de la Feuille — Cible Durée, Cible Répétitions, Cible d'une Cellule active, Durée totale — s'affiche sans flèche, centrée horizontalement sur la page, sur voile, dans la couche `WheelPickerOverlay` acceptée en PRE-3, et se ferme par ✕ ou ✓ seulement ; les popovers de choix restent natifs et ancrés) : reporté dans l'objectif, 3.1 (exigences, références, AC4 à AC7, `R-3.1-02`), 3.2 AC10, 3.3 AC8, 3.4 (architecture, AC1, AC8, AC11, AC12), 3.5 (architecture, AC1, AC8), 3.6 AC3, AC9, 3.7 (architecture, AC4), 3.8 AC5. Historique conservé en italique « Rendu remplacé par Q37 ».*

*Révision du 2026-10-17 (recette iPhone, écart E-12) : Q38 (en bilatéral, la ligne `Ordre des côtés` est masquée à N = 1 au lieu d'être atténuée et non modifiable ; l'Ordre choisi est conservé dans le Brouillon et réaffiché dès N ≥ 2 ; la normalisation effective `Un côté après l’autre` à N = 1 est inchangée) : reporté dans 3.3 AC5 et `R-3.3-03`, et dans `R-16` de l'epic 4. Historique conservé en italique « Rendu remplacé par Q38 ».*

*Révision du 2026-10-17 (recette iPhone, écart E-13) : Q39 (apparitions et disparitions fluides dans la Feuille : entrée en fondu avec léger déploiement, sortie en fondu avec repli, glissement des lignes voisines et de la feuille, durée courte et unique, sur le fil UI ; aucune animation avec « Réduire les animations », NFR-10) : reporté dans 3.8 (AC9 et preuves).*

*Révision du 2026-10-17 (recette iPhone, écart E-14) : Q40 (durée et sens de Q39 remplacés : 350 ms, entrée par le bas et sortie vers le bas en fondu simultané, l'espace se refermant pendant le fondu ; cadre D-4 à 350 ms ; lignes sélectionnées sans liseré ; tableau des séries variables sélectionné — fond d'une ligne sélectionnée — quand il est ouvert ou utilisé, état normal dès qu'un autre champ est sélectionné, cadre fixe X-3 retiré) : reporté dans 3.3 AC7, 3.6 AC1, 3.8 AC9 et preuves.*

*Révision du 2026-10-17 (recette iPhone, écart E-15) : Q41 (fondu supprimé : une ligne ou un contrôle de la Feuille monte de bas en haut, révélé par un cadre de découpe borné par la barre horizontale du dessous, et redescend sous elle ; aucun mouvement du texte à la sélection, le fond de sélection ne modifiant plus la mise en page ; un contrôle en ligne sous le champ sélectionné est dans le même cadre coloré ; sur iOS, Changement de côté, Ordre des côtés, roue de « Durée d’une série » et roue de Durée totale dans un panneau sans flèche juste sous le champ, aligné à droite, au-dessus du contenu, fermé sans application par un toucher extérieur ; popover natif du Mode inchangé ; par cohérence, toutes les roues de la Feuille — Cible Durée, Cible Répétitions, Cellule active, Durée totale — dans ce même panneau, Q37 ne s'appliquant plus à aucune) : reporté dans 3.1 (AC4 à AC6, R-3.1-02), 3.3 (AC4, AC5, AC7, AC8), 3.4 (AC1, AC3, AC11, AC12), 3.5 (architecture, AC1, AC12), 3.6 (AC sur la fermeture du Sélecteur), 3.7 (AC4), 3.8 (AC5, AC9 et preuves).*

*Révision du 2026-10-17 (recette iPhone, écart E-16) : Q42 — lignes de la Feuille et du tableau des séries variables à 44 pt de hauteur minimale (NFR-09), au lieu des 42 pt du DSF.*

**Architecture :** AD-2 (machine de brouillon unique), AD-7 (primitives natives, story S0), AD-8 (tableau, glisser conservé), AD-13 (validation unique avec ligne de base), AD-15 (une seule surface ouverte), AD-16 (mécanisme ± accepté, règle du domaine). S'appuie sur la story 1.1 (Cible typée, format v2) et la story 2.1 (nature de la Durée totale, Inversion du total dans le domaine).

**Règles communes à toutes les stories d'interface de l'epic (3.1, 3.3 à 3.8).** Elles sont reprises dans chaque story et ne sont pas répétées comme critères distincts :

- **Garde-fous des roulettes natives.** Les assertions « zéro `ScrollView` sur iOS » restent vertes et ne sont ni affaiblies, ni supprimées, ni contournées : `src/features/sessions/__tests__/DurationWheelPicker.test.tsx:378` et `:619`, `src/features/sessions/__tests__/NumberWheelPicker.test.tsx:267` (NFR-03, `AGENTS.md`, « Pièges connus »).
- **NFR-02 et NFR-03.** Chaque interaction pour laquelle une primitive native iOS existe passe par elle. Le mécanisme d'une primitive déjà acceptée (roulettes `DurationWheelPicker` et `NumberWheelPicker`, glisser des lignes PRE-3, `InlineStepper` et `ProfileStepper`) n'est pas remplacé. Seuls les remplacements de la liste fermée de NFR-03 sont admis. Une difficulté de style, une absence de test ou l'impossibilité de faire soi-même une capture ne justifient jamais un remplacement ; un écart avec la référence visuelle est signalé à Hermann (P33).
- **NFR-04.** Une suite de tests verte ne vaut jamais preuve visuelle ou tactile sur appareil réel. Aucune story ne déclare une conformité visuelle : la validation visuelle et tactile appartient à Hermann, sur iPhone (Q5).
- **Relevé visuel avant développement (FR-02-13 par analogie, FR-22-01, NFR-01).** Avant de coder, l'agent de développement relève, pour chaque frame citée par la story, les propriétés visuelles utiles (composant et variante, jetons, géométrie relative, typographie, couleurs, contours, effets, comportement adaptatif) depuis `docs/preparation/PRE-4/figma/<frame>.json.gz` et `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/preparation/PRE-4/figma/fermeture-maitres-et-variables.json.gz`. Il consigne ce relevé dans le fichier de la story, sous forme d'un tableau à une ligne par élément et par état (frame et état ; élément et identifiant de nœud ; composant maître et variante ; style ou variable lié ; police ; couleurs ; contour ; ombre et effets ; espacements relatifs ; jeton existant retenu ; écart). Les stories 3.3 à 3.7 relèvent ainsi, à elles cinq, les 19 frames de la Feuille (liste de 3.8) ; la story 4.6 (AC1) reprend ces tableaux pour la conformité des 32 frames. Aucun chiffre lu n'y devient une règle (D-255, D-300). Un composant absent de Figma n'est pas inventé : il est classé `NON VÉRIFIABLE` (FR-22-01).
- **Ordre de lecture des sources (NFR-14)**, lexique de clés et apostrophe `’` (NFR-08, AD-11), jetons de `src/shared/ui/tokens.ts` intouchés, « Réduire les animations » respecté (NFR-10), cibles tactiles d'au moins 44 × 44 pt (NFR-09, P30).
- **Recette.** Les scénarios `R-3.M-xx` sont joués dans le dev client « Routine Dev » déjà installé sur l'iPhone (Q22), une fois sa compatibilité vérifiée en ouverture de la story 3.1 (AC1) ; si un nouveau build est nécessaire, il est signalé à Hermann. Leur attendu visuel renvoie à une frame ; leur attendu fonctionnel renvoie à une FR, une décision Q, une règle P ou une hypothèse H, jamais à une capture.

### Story 3.1 : Faisabilité sur iPhone du Popover natif dans la Feuille (S0)

En tant que Hermann (utilisateur de KODJO),
je veux que la faisabilité d'un popover natif ancré dans la Feuille, avec une roulette native et ses ✕ / ✓, soit établie sur mon iPhone avant toute autre story d'interface,
afin que les popovers et le Sélecteur de cible reposent sur une primitive native qui fonctionne réellement, sans réimplémentation découverte en fin d'epic.

**Exigences :** FR-03-10 (mécanisme natif, appui extérieur, une seule surface), FR-03-11 (roulette avec ses ✕ / ✓ ; *rendu remplacé par Q37 : couche `WheelPickerOverlay`, centrée, sans flèche, au lieu d'un popover ancré* ; règle de repli) ; NFR-02, NFR-03, NFR-04 ; Q5, Q12, Q22 (dev client « Routine Dev », compatibilité vérifiée en AC1), Q37 ; P9, P33.
**Architecture :** AD-7 (décision sous condition, critères de succès de S0, repli), AD-15 (principe d'une seule surface, pour l'essai seulement). Fichiers principalement touchés (indicatif) : `src/features/activities/ExecutionParametersSheet.tsx` (prototype limité à la ligne `Mode d’exécution` et à la ligne de Cible commune), `src/features/sessions/DurationWheelPicker.tsx` (lecture ; aucune modification de mécanisme), tests iOS associés.
**Références visuelles :** frames Figma `8328:37092` (popover de Mode), `8328:37862` (roulette de Cible dans son popover, maître `8452:13297` ; repère pour la roue seulement, sa présentation suit Q37) — visuel seulement, D-255.
**Dépend de :** 1.1. Mode d'installation tranché par Q22 (`docs/preparation/PRE-4/bmad/questions-ouvertes.md` §1) : le dev client « Routine Dev », déjà installé sur l'iPhone, charge le JavaScript servi par `npx expo start` depuis ce clone. La story commence par vérifier sa compatibilité (AC1) ; aucun résultat sur appareil n'est fabriqué.
**Hypothèses non validées :** H13 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Préalable d'environnement et compatibilité du dev client (AD-7, Q22).**
**Given** le clone après `npm ci`, et le dev client « Routine Dev » installé sur l'iPhone de Hermann
**When** l'agent ouvre la story, avant tout prototype
**Then** `node_modules/@expo/ui/package.json` indique exactement la version `57.0.13`, consignée dans le fichier de la story, sans montée ni descente de version
**And** la version native de `@expo/ui` embarquée dans le dev client est relevée (par un moyen décrit dans la story, par exemple la version rapportée par le module natif au chargement ou les métadonnées du build) et comparée à `57.0.13`, en vérifiant la présence des correctifs de `57.0.12` exigés par AD-7 (modificateurs du `Popover`)
**And** l'essai s'exécute dans ce dev client, jamais dans Expo Go, avec le commit et l'état de l'arbre consignés (`recette-iphone.md` §1)
**And** issue « compatible » : la story continue ; issue « nouveau build nécessaire » (version native différente, correctifs absents, ou chargement du JavaScript refusé par le dev client) : la story s'arrête, le constat est signalé à Hermann, sans build ni publication EAS par l'agent (EAS est exclu de la préparation actuelle, pas définitivement) ; issue « non vérifiable » : consignée telle quelle et signalée à Hermann, sans conclusion fabriquée.

**AC2 — Popover de choix ancré dans la Feuille (FR-03-10, P9, AD-7).**
**Given** la Feuille ouverte (la `Modal` React Native existante, en fondu, non remplacée) et un prototype de popover `Mode d’exécution` à deux options `Durée` puis `Répétitions`, rendu par le `Popover` SwiftUI de `@expo/ui` dans un `Host` placé dans le `ScrollView` de la Feuille
**When** Hermann touche la ligne, puis recommence après avoir fait défiler le corps de la Feuille
**Then** la bulle s'ouvre ancrée à la ligne dans les deux cas
**And** un appui sur une option l'applique au Brouillon de la Feuille seulement (FR-03-10).

**AC3 — Fermeture extérieure sans application (FR-03-10, P9).**
**Given** le Mode `Durée` et le popover de Mode ouvert
**When** Hermann touche hors de la bulle
**Then** `onIsPresentedChange(false)` est reçu, le popover se ferme, et le Mode reste `Durée`
**And** la Feuille reste entièrement tactile après la fermeture (défilement, ✕, ✓, autres lignes)
**And** l'appui extérieur ne déclenche pas le contrôle situé dessous.

**AC4 — Roulette native et ✕ / ✓ dans un panneau sans flèche sous le champ (FR-03-11, Q12, Q41, AD-7).**
**Given** le Sélecteur de cible sur la ligne de Cible commune en Durée, présentant la roulette existante `DurationWheelPicker` et sa `PickerToolbar`, inchangées, sur iOS dans un panneau sans flèche (`AnchoredPanel`, conteneur de positionnement, ni `Modal` ni `Popover`)
**When** Hermann touche la valeur, fait tourner la roue, puis touche ✓ ; puis rouvre, fait tourner et touche ✕ ; puis rouvre, fait tourner et touche hors du panneau
**Then** la roue s'affiche juste sous le champ `Durée d’une série`, cadre aligné à droite sur le champ, sans flèche, au-dessus du contenu (aucune ligne ne se décale)
**And** la roue est dimensionnée sans repli, tourne au doigt et donne le retour haptique natif
**And** ✓ et ✕ sont actifs ; ✓ applique la valeur au Brouillon de la Feuille ; ✕ restaure la valeur d'avant ouverture (Q12)
**And** un toucher hors du panneau le ferme sans rien appliquer (Q41)
**And** le popover natif de `Mode d’exécution` (AC2, AC3) est conservé.
*Présentation remplacée par Q41 (2026-10-17, écart E-15). Historique Q37 : « dans `WheelPickerOverlay`, couche centrée sur la page, sur voile, fermée par ✕ et ✓ seulement, le voile ne fermant pas la roue ».*
*Rendu remplacé par Q37 (2026-10-17, écarts E-10 et E-11). Historique : « AC4 — Roulette native et ✕ / ✓ dans `Popover.Content` » ; le prototype plaçait `DurationWheelPicker` par `RNHostView` (ou un `Picker` en style roue) dans `Popover.Content`, ouvert par le popover ancré ; le constat de taille (E-05) a été corrigé et validé avant ce changement.*

**AC5 — Accessibilité minimale constatée (FR-03-10, H13).**
**Given** VoiceOver activé
**When** Hermann ouvre le popover de Mode puis le Sélecteur de la Cible commune
**Then** les options et la roue sont atteignables et annoncées, le focus reste dans la bulle ou dans le panneau de la roue (modal pour VoiceOver, fermé par le geste d'échappement ; Q41, avant lui la couche de Q37) tant qu'elle est ouverte, et revient à la ligne déclenchante à la fermeture
**And** chaque constat (réussi, partiel, impossible) est consigné tel quel, sans en déduire de conformité visuelle (NFR-04).

**AC6 — Aucune substitution (NFR-02, NFR-03, AD-7).**
**Given** le prototype sous Jest avec `Platform.OS = "ios"`
**When** les tests s'exécutent
**Then** un test vérifie qu'aucune `Modal` ni aucun `Pressable` de substitution n'est rendu à la place du `Popover` de Mode
**And** un test vérifie que la roue de la Cible commune est rendue dans le panneau sans flèche, sous le champ, aligné à droite, sans `Popover` ni `Modal` supplémentaire, que ✓ applique et que ✕ et un toucher extérieur ferment sans appliquer (Q41, tests `PRE4-Q41` ; *remplace le test Q37 : « dans `WheelPickerOverlay` […], voile non pressable »*)
**And** les garde-fous `DurationWheelPicker.test.tsx:378`, `:619` et `NumberWheelPicker.test.tsx:267` restent verts sans modification.

**AC7 — Décision consignée, sans réimplémentation (AD-7, P33, FR-03-11).**
**Given** les constats AC2 à AC5
**When** l'agent clôt la story
**Then** il consigne dans le fichier de la story et dans `docs/preparation/PRE-4/bmad/journal-comparaison.md` l'une des trois décisions :
- **succès** : les critères AC2 à AC5 sont remplis ; le prototype est conservé comme base des stories 3.3 et 3.4 ;
- **repli (a)** : le `Popover` fonctionne ancré au niveau d'un `Host` hors de la `Modal` ; le repli est décrit et ses limites listées ;
- **repli (b)** : ni l'un ni l'autre ne fonctionne ; l'écart est signalé à Hermann comme question P33 dans `questions-ouvertes.md`, et les stories 3.3 à 3.8 restent bloquées jusqu'à son arbitrage
**And** en cas de succès ou de repli (a), il consigne aussi la **voie retenue pour la roue** dans `Popover.Content`, avec sa preuve sur iPhone : (i) `RNHostView` enveloppant `DurationWheelPicker` (et, par extension, `NumberWheelPicker`), ou (ii) `Picker` SwiftUI rendu directement dans `Popover.Content` (AD-7, « Voie consignée »). Cette voie s'impose aux stories 3.4, 3.5 et 3.7, qui n'en ouvrent pas d'autre ; dans les deux voies, le contrat des roulettes reste porté par `DurationWheelPicker` et `NumberWheelPicker`. *Rendu remplacé par Q37 (2026-10-17) : la voie de la roue est désormais la couche `WheelPickerOverlay` de PRE-3, centrée, sans flèche, fermée par ✕ / ✓ seulement, avec `DurationWheelPicker` / `NumberWheelPicker` et `PickerToolbar` inchangés ; elle s'impose aux stories 3.4, 3.5 et 3.7. La voie (i) a été constatée sur iPhone (E-05 validé) avant d'être abandonnée pour ce rendu ; la décision consignée porte alors sur le popover de choix seulement*
**And** aucune réimplémentation du popover ou de la roulette (`Modal` React Native, assemblage de `ScrollView`, imitation graphique) n'est introduite, quel que soit le résultat
**And** en cas d'échec, le prototype est retiré dans la même story et l'application reste dans son état antérieur, les trois contrôles verts.

**Preuves attendues :**
- Tests : test iOS d'absence de `Modal` et de `Pressable` de substitution ; garde-fous zéro `ScrollView` inchangés et verts.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone, jouée par Hermann ou en sa présence :
  - `R-3.1-00` — Préconditions : dev client « Routine Dev » sur l'iPhone, `npx expo start` depuis ce clone. Gestes : ouvrir le projet dans le dev client. Attendu : JavaScript chargé sans erreur de module natif ; version native de `@expo/ui` relevée et comparée à 57.0.13 (Q22, AD-7). Résultat consigné : compatible, nouveau build nécessaire, ou non vérifiable.
  - `R-3.1-01` — Préconditions : `R-3.1-00` compatible, Feuille ouverte sur un Exercice en création. Gestes : toucher `Mode d’exécution`, choisir `Répétitions` ; rouvrir, toucher hors de la bulle ; faire défiler le corps, rouvrir. Attendu fonctionnel : choix appliqué au Brouillon de la Feuille ; appui extérieur sans application ; bulle ancrée après défilement ; Feuille tactile après fermeture (FR-03-10, P9). Attendu visuel : `8328:37092`.
  - `R-3.1-02` — Préconditions : Feuille ouverte, Mode `Durée`. Gestes : ouvrir le Sélecteur de la Cible commune, tourner, ✓ ; rouvrir, tourner, ✕ ; rouvrir, tourner, toucher hors du panneau. Attendu fonctionnel : roue juste sous le champ, cadre aligné à droite, sans flèche ; roue non repliée, haptique native, ✓ applique, ✕ restaure ; un toucher extérieur ferme sans appliquer (FR-03-11, Q12, Q41 ; *historique Q37 : roue centrée sur voile, fermée par ✕ / ✓ seulement*). Attendu visuel : `8328:37862` pour la roue seulement.
  - `R-3.1-03` — Préconditions : VoiceOver activé. Gestes : parcourir le popover de Mode et le Sélecteur. Attendu : options et roue annoncées, focus confiné puis rendu à la ligne (H13).
- Rappel NFR-04 : ces constats décident de la faisabilité ; ils ne valent pas conformité visuelle.

**Hors story :** les popovers Changement de côté, Ordre des côtés et Régime (3.3) ; l'option échec et les bornes du Sélecteur (3.4, 3.5) ; la roulette de Durée totale (3.7) ; le rendu Android et web (repli `SegmentedControl` et roulettes `Legacy*`, AD-7, livré avec 3.3 et 3.4) ; toute montée de version de `@expo/ui`.

---

### Story 3.2 : Brouillon de Feuille : Cibles typées, Régime, mémoire par Mode, retrait et annulation

En tant que Hermann (utilisateur de KODJO),
je veux que le Brouillon de la Feuille gère des Cibles typées, le Régime, la mémoire des Cibles par Mode, les variations de N, le retrait d'une ligne et son annulation, selon des règles fixes,
afin qu'aucun réglage ne soit perdu ni converti en changeant de Mode, de Régime ou de N, et que rien ne soit enregistré avant le ✓ de la Feuille.

**Exigences :** FR-03-03 (domaine : ✓ et ✕ de la Feuille, AC11), FR-03-04, FR-04-03, FR-04-04, FR-04-05, FR-05-02 (domaine), FR-05-03, FR-06-01, FR-06-03, FR-06-04, FR-09-06 (absence d'état partiel, domaine), FR-11-01, FR-11-02, FR-11-03, FR-11-04, FR-11-05, FR-11-06, FR-12-01, FR-12-02, FR-12-03, FR-12-04 (domaine), FR-12-05 (domaine), FR-12-07 ; NFR-05, NFR-06, NFR-07 ; H4, H5 (confirmée par Q29), Q29, H25, H26, H27, P19, P22, P37, P42.
**Architecture :** AD-2 (machine de brouillon unique, précédence H27, `pendingRemoval`), AD-13 (ligne de base alignée par identité de ligne ; le ✓ appelle `validateForSave`), AD-1 (types `SeriesTarget`). Fichiers principalement touchés (indicatif) : `src/domain/activities/ExecutionParametersDraft.ts`, `src/domain/activities/ExecutionParameters.ts` (lecture), `src/domain/activities/__tests__/`.
**Références visuelles :** aucune (domaine seul).
**Dépend de :** 1.1, 2.1.
**Hypothèses non validées :** H4, H25, H26, H27 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Cibles typées dans le Brouillon (FR-06-01, FR-06-03, AD-1, AD-2).**
**Given** le Brouillon de la Feuille ouvert sur des paramètres v2
**When** une transition fixe la Cible commune ou la Cible d'une ligne
**Then** la Cible est une `SeriesTarget` (`NUMBER` entier ≥ 1, `FAILURE` ou `UNSET`), jamais `null`, 0 ni une valeur sentinelle
**And** une ligne ne porte jamais à la fois un nombre et l'échec (FR-06-01)
**And** en `variables`, la suite ordonnée des N couples Cible / Pause est la seule vérité et accepte un mélange, par exemple `NUMBER 10`, `NUMBER 12`, `FAILURE` (FR-06-03)
**And** les quatre combinaisons Durée / Répétitions × `identiques` / `variables` acceptent des Cibles `FAILURE` (FR-06-03).

**AC2 — Valeurs initiales en création (FR-11-05, FR-03-04, FR-05-02, P19, P37).**
**Given** un Brouillon ouvert sans paramètres préalables (création)
**When** il est lu
**Then** Mode `—` (non renseigné), N = 1, Pause 0 s, Régime `identiques`, Bip 0 (`Aucun`), Changement de côté non renseigné, Cible Durée `UNSET`, aucun tempo implicite
**And** choisir directement le Mode Répétitions sans Cible préalable donne une Cible commune `NUMBER 1` (P37)
**And** choisir Durée puis Répétitions en `identiques` avec une Cible `UNSET` la laisse `UNSET`, jamais 1 (P37)
**And** un Changement de côté non renseigné est produit `Sans changement` par le ✓ (FR-11-05)
**And** une fois un Mode choisi, aucune transition ne le ramène à `—` (FR-05-02).

**AC3 — Changement de Mode sans conversion (FR-11-03, FR-05-03, H26).**
**Given** Durée, `variables`, N = 3, Cibles 30 s / 45 s / à l'échec, Pauses 10 / 20 / 30 s, Bip 2 s, `Droite puis gauche`, `Les deux côtés à chaque série`, Pause au changement de côté 5 s, Compte à rebours 10 s, Fin 5 s
**When** le Mode passe à Répétitions
**Then** N = 3, Pauses 10 / 20 / 30 s, Bip 2 s, côtés, ordre, 5 s, 10 s et 5 s sont inchangés, le Régime reste `variables`
**And** les Cibles deviennent `UNSET`, `UNSET`, `FAILURE` : jamais 30 rép., jamais 0 (FR-11-03)
**And** aucune Cible implicite n'est introduite en `variables` (FR-11-03).

**AC4 — Retour au Mode précédent et précédence (FR-11-04, H4, H27).**
**Given** l'état final d'AC3
**When** le Mode revient à Durée avant ✓
**Then** les Cibles sont 30 s, 45 s, à l'échec (FR-11-04)
**And** la mémoire suit l'identité de chaque ligne, à travers réordonnancement, retrait et restauration (H4)
**And** si, en Répétitions, la ligne 1 a reçu `FAILURE`, le retour en Durée la laisse `FAILURE` : le dernier choix explicite l'emporte et 30 s n'est pas restauré sur cette ligne (H27)
**And** une ligne `UNSET` sans mémoire pour le Mode cible reste `UNSET` (P37).

**AC5 — Passage en `variables` et retour en `identiques` (FR-04-03, FR-04-04).**
**Given** `identiques`, N = 3, Cible `FAILURE`, Pause 20 s
**When** le Régime passe à `variables`
**Then** trois lignes `FAILURE` / 20 s sont créées, le Bip restant commun (FR-04-03)
**And** revenir à `identiques` reprend la Cible et la Pause de la première ligne dans l'ordre courant, y compris après un réordonnancement (FR-04-04, FR-12-03)
**And** repasser en `variables` avant ✓ restitue le dernier tableau (lignes, ordre, Cibles, Pauses)
**And** après un ✓ en `identiques`, une réouverture puis un passage en `variables` copient les valeurs uniformes, sans retrouver l'ancien tableau (FR-04-04, FR-11-02).

**AC6 — Régime explicite et lecture (FR-04-05, FR-04-01 domaine).**
**Given** un Exercice en `variables` à 3 × 30 s, Pause 10 s
**When** le Brouillon est ouvert, validé puis rouvert
**Then** le Régime reste `variables` : il ne se déduit jamais de l'égalité des valeurs ni du Mode
**And** un Exercice relu sans Régime explicite (paramètres uniformes) s'ouvre en `identiques`, et à N = 1 le Régime effectif est `identiques` (FR-04-05).

**AC7 — Augmenter et diminuer N (FR-12-01, FR-12-02).**
**Given** `variables`, N = 5, lignes L1 à L5
**When** N passe à 3, puis à 5, puis à 6
**Then** N = 3 retire L4 et L5, gardées en Réserve avec leur Cible, leur Pause et leur ordre
**And** N = 5 restitue L4 puis L5, jamais L5 puis L4 (FR-12-01)
**And** N = 6 ajoute une ligne qui copie la Cible et la Pause de la dernière ligne de l'ordre courant ; une dernière ligne `FAILURE` est copiée `FAILURE`, sans nombre inventé (FR-12-01, NFR-06)
**And** N reste dans 1..99 : aucune transition ne le porte à 0 ni à 100 (FR-12-01, FR-12-02).

**AC8 — Déplacement d'une ligne (FR-12-03, P22).**
**Given** `variables`, N = 3, lignes (30 s, 10 s), (45 s, 20 s), (à l'échec, 30 s)
**When** la ligne 3 est déplacée en tête
**Then** l'ordre devient (à l'échec, 30 s), (30 s, 10 s), (45 s, 20 s), renuméroté de 1 à 3
**And** la nouvelle dernière ligne porte la Pause terminale PN
**And** des lignes retirées restaurées ensuite sont réinsérées en fin, dans leur ordre conservé
**And** le Bip commun n'est pas affecté (P22).

**AC9 — N = 1 normalisé dès le Brouillon (FR-12-04).**
**Given** `variables`, N = 3, bilatéral, `Les deux côtés à chaque série`
**When** N passe à 1
**Then** les paramètres effectifs (ceux que lisent la Phrase et la Durée totale) sont uniformes sur la première ligne de l'ordre courant, avec l'Ordre des côtés `Un côté après l’autre`
**And** remonter N à 2 ou plus avant ✓ restaure `variables`, ses lignes et l'ancien Ordre des côtés
**And** un ✓ à N = 1 ne produit qu'une Série uniforme et l'Ordre des côtés par défaut.

**AC10 — Retrait d'une ligne et annulation (FR-12-05, H5 confirmée par Q29, AD-2).**
**Given** `variables`, N = 4
**When** la ligne 2 est retirée
**Then** elle part avec sa Cible et sa Pause, N = 3 et les lignes suivantes sont renumérotées
**And** le Brouillon expose un instantané d'annulation (`pendingRemoval`) ; l'annulation restaure la ligne à sa position 2 avec sa Cible et sa Pause
**And** toute modification du Brouillon de la Feuille invalide l'annulation (Q29), un test par cas de la liste exhaustive de la décision : Cible, Pause, N, Mode, Régime, Bip, Pause commune, réordonnancement, autre retrait
**And** seules l'ouverture et la fermeture d'un popover ou du Sélecteur de cible, **sans application**, ne l'invalident pas (Q29) : un test ouvre puis ferme un popover par appui extérieur et un Sélecteur par ✕ (depuis Q37, le voile d'une roue ne la ferme pas), puis vérifie que l'annulation restaure toujours la ligne ; un ✓ de Sélecteur qui applique une Cible l'invalide (modification de Cible)
**And** le retrait est refusé à N = 1 ; un retrait qui ramène N à 1 applique la normalisation d'AC9 (H5, Q29).

**AC11 — ✓ et ✕ de la Feuille, Réserve jamais transmise (FR-03-03, FR-11-01, FR-11-02, FR-09-06, AD-13).**
**Given** un Brouillon modifié par des changements de Mode, de Régime, de N, de Cibles, des déplacements et des retraits
**When** la Feuille est abandonnée (✕ ou retour système)
**Then** les paramètres du parent sont inchangés
**And** **When** la Feuille est validée (✓), le Brouillon appelle `validateForSave(params, baseline)` puis produit d'un bloc les paramètres effectifs, sans aucune écriture en base
**And** le résultat ne contient ni identité de ligne, ni Réserve, ni mémoire par Mode, ni `pendingRemoval` (FR-11-02)
**And** une violation est retournée en union, sans état partiel : le parent reste dans son état complet antérieur (FR-09-06, NFR-07).

**AC12 — Ligne de base alignée par identité de ligne (AD-13, H25).**
**Given** un Exercice ancien en `variables` dont la ligne 2 porte une Cible 5999 s et la ligne 3 une Cible 7 s, Bip 11
**When** la ligne 2 est déplacée en tête sans être modifiée, puis le ✓ est demandé
**Then** la ligne de base suit l'identité des lignes : la Cible 5999 s non modifiée et le Bip 11 non modifié sont tolérés, le ✓ réussit et les valeurs sortent inchangées
**And** une ligne nouvelle (ajoutée par N) n'a pas de base : la grille s'y applique
**And** une Cible n'est tolérée que si le Mode est celui de la ligne de base ; une Cible `UNSET`, héritée comprise, bloque toujours le ✓ (H25)
**And** en création, aucune ligne de base : la grille s'applique partout.

**AC13 — Bilatéral et Bip commun (FR-06-04, FR-05-03, P22).**
**Given** un Exercice bilatéral, N = 3
**When** les Cibles sont réglées
**Then** N désigne 3 Séries par côté et les deux côtés reçoivent les mêmes Cibles (FR-06-04)
**And** le Bip, de 0 à 10 s, existe dans les deux Modes et est conservé au changement de Mode, même après ✓ (FR-05-03).

**AC14 — Compatibilité N hérité et copies (FR-12-07, FR-11-06).**
**Given** des paramètres dont N est marqué hérité (indicateur d'héritage introduit en 2.1 AC6, sans persistance v2 ; P42 : compatibilité du modèle, testée au domaine seulement)
**When** ils sont ouverts, validés et relus par le modèle
**Then** ils sont acceptés sans erreur ; N, Cibles, Pauses et ordre des lignes sont relus inchangés ; aucune règle n'exige de modifier N, de supprimer une ligne ni de purger une Réserve (FR-12-07)
**And** hors héritage, le ✓ vide la Réserve
**And** les paramètres produits par le ✓ contiennent le Bip commun et la Cible typée de chaque Série, sans état intermédiaire, prêts pour copie et Instantané (FR-11-06).

**Preuves attendues :**
- Tests unitaires purs dans `src/domain/activities/__tests__/` : un test par AC, attendus littéraux ; scénarios de FR-12-06 (N à 1 et à 99, réduction, augmentation, restauration, réordonnancement de la dernière Série, PN après déplacement) au niveau du domaine.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone : aucune propre à cette story (domaine seul) ; ses règles sont recettées par les scénarios des stories 3.3 à 3.6. Rappel NFR-04.

**Hors story :** toute modification d'interface (3.3 à 3.7) ; les fonctions `nearestGridValue` (3.4) et `stepTarget` (3.6) ; le calcul de la Durée totale et de l'Inversion du total (2.1) ; le niveau structurel de `validateForSave` et les bornes de saisie (1.1, FR-09-01 à FR-09-05) ; la persistance (E1).

---

### Story 3.3 : Popovers Mode, Changement de côté, Ordre des côtés et Régime

En tant que Hermann (utilisateur de KODJO),
je veux choisir le Mode, le Changement de côté, l'Ordre des côtés et le Régime dans des popovers natifs ancrés à leur ligne, et régler les valeurs numériques par des ± qui n'apparaissent qu'à l'appui,
afin de régler la Feuille au pouce, avec les menus du système, sans interrupteur ni segmenté et sans deux surfaces ouvertes à la fois.

**Exigences :** FR-03-01, FR-03-02, FR-03-03, FR-03-04 (affichage), FR-03-05, FR-03-06, FR-03-07, FR-03-08, FR-03-09, FR-03-10, FR-04-01, FR-04-02, FR-05-01, FR-05-02 (affichage), FR-05-04, FR-09-04 (champs hors Cible), FR-10-05, FR-12-04 (interface) ; NFR-02, NFR-03, NFR-04, NFR-09, NFR-10 ; P9, P10, P16, P33, H13.
**Architecture :** AD-7 (popovers SwiftUI selon la décision de 3.1 ; repli Android et web par `SegmentedControl`), AD-15 (état `openSurface`, distinct de la Cellule active `activeCell` ; transitions T7, T8, T10, T15 à T17, T19, et celles du `stepper(champ)` hors tableau, T20, T22, T23), AD-16 (`InlineStepper` réutilisé), AD-11 (`UNSELECTED_OPACITY`), AD-2 (dispatch au Brouillon). Fichiers principalement touchés (indicatif) : `src/features/activities/ExecutionParametersSheet.tsx`, `src/shared/ui/opacity.ts` (nouveau), `src/shared/i18n/`, tests de la Feuille.
**Références visuelles :** frames Figma `8328:36923`, `8328:37092`, `8328:38513`, `8328:37972`, `8328:38953`, `8328:39390`, `8328:39181`, `8328:39072`, `8328:37760`, `8328:38193`, `8328:38301` — visuel seulement, D-255.
**Dépend de :** 3.1 (décision « succès » ou « repli (a) » ; un « repli (b) » bloque la story), 3.2.
**Hypothèses non validées :** H13, H25 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Ouverture et en-tête maintenus (FR-03-01, FR-03-02, NFR-10).**
**Given** l'Éditeur et sa Carte Paramètres d'exécution
**When** Hermann touche la Carte
**Then** la Feuille s'ouvre sur une copie du Brouillon de l'Éditeur, voile en fondu `#1F2129` à 34 % et Feuille montant du bas ; avec « Réduire les animations », elle apparaît en place
**And** l'en-tête fixe montre ✕ à gauche, le titre `Paramètres d’exécution`, ✓ à droite ; le corps défile ; l'Éditeur est inerte et hors du parcours de focus ; aucune navigation ni nouvelle route n'est possible depuis la Feuille (FR-03-01).

**AC2 — Ordre du corps et absence d'interrupteur (FR-03-02, FR-04-01, FR-05-04).**
**Given** la Feuille ouverte en bilatéral avec une ligne Durée totale applicable
**When** Hermann parcourt le corps
**Then** l'ordre est : `Mode d’exécution` → `Séries` (champ de Régime, chevron en `variables`, nombre) → Cible et `Pause après chaque série` communes, ou Tableau des séries variables → `Changement de côté` → `Ordre des côtés` et `Pause entre les côtés` → `Bip de cadence` → `Durée totale` → `Compte à rebours` → `Fin d’exercice`
**And** sans ligne `Durée totale`, le `Bip de cadence` est juste avant `Compte à rebours`
**And** aucun interrupteur « Séries variables », aucune option ni ligne métier « échec », aucun écran « Série à l’échec » n'existent (FR-04-01, FR-05-04).

**AC3 — Popover de Mode (FR-05-01, FR-03-06, FR-05-02).**
**Given** une création, le champ `Mode d’exécution` affiche `—`
**When** Hermann touche le champ, en `identiques` comme en `variables`
**Then** le même popover propose exactement `Durée` puis `Répétitions`, sans « À l’échec »
**And** un choix l'applique au Brouillon de la Feuille ; aucune option ne ramène le Mode à `—` (FR-05-02)
**And** le segmenté de Mode est retiré sur iOS (NFR-03, liste fermée).

**AC4 — Popover Changement de côté (FR-03-07, P10).**
**Given** la ligne `Changement de côté`
**When** Hermann la touche
**Then** un popover propose exactement `Sans changement`, `Droite puis gauche`, `Gauche puis droite` ; jamais un segmenté en ligne sur iOS
**And** les libellés accessibles développent la direction en toutes lettres, sans abréviation D/G
**And** sur iOS, ce popover est un panneau sans flèche, ouvert juste sous le champ sélectionné, aligné à droite sur lui, au-dessus du contenu (aucune ligne ne se décale), qui contient le `SegmentedControl` accepté, inchangé ; un choix l'applique au Brouillon et ferme le panneau (cadre D-4) ; un toucher hors du panneau le ferme sans appliquer ; Android et web gardent le segmenté en ligne, dans le cadre de sélection de la ligne — source : Q41 (décision de Hermann du 2026-10-17, écart E-15). *Remplace, pour iOS, le popover natif SwiftUI prévu : iOS n'offre pas de popover natif sans flèche.*

**AC5 — Popover Ordre des côtés (FR-03-08, FR-12-04).**
**Given** un Changement de côté bilatéral
**When** Hermann touche `Ordre des côtés`
**Then** le popover propose `Un côté après l’autre` (par défaut) et `Les deux côtés à chaque série`, avec les sous-titres de référence `(D1 → D2) → (G1 → G2)` et `(D1 → G1) → (D2 → G2)` si la primitive le permet (P33)
**And** la ligne n'existe pas en `Sans changement`
**And** à N = 1, la ligne est masquée (ni ligne, ni séparateur propre, ni popover ; un popover ouvert se ferme), sans texte explicatif ; l'Ordre choisi est conservé et réaffiché dès N ≥ 2 — source : Q38 ; l'ordre effectif à N = 1 reste `Un côté après l’autre` (FR-12-04). *Rendu remplacé par Q38 : la ligne n'est plus atténuée à `UNSELECTED_OPACITY` ni non modifiable.*
**And** sur iOS, la présentation est celle d'AC4 : panneau sans flèche sous le champ, aligné à droite, contenant le `SegmentedControl` accepté (options et sous-titres inchangés) — source : Q41.

**AC6 — Popover Régime et chevron (FR-04-01, FR-03-09, FR-04-02, FR-12-04).**
**Given** N ≥ 2
**When** Hermann touche le champ de Régime de la ligne `Séries`
**Then** le popover propose exactement `identiques` (« toutes les séries ont la même valeur ») et `variables` (« chaque série a sa propre valeur »), les sous-titres étant une référence visuelle (P33)
**And** en `variables`, un chevron masque ou affiche le Tableau des séries variables ; trois états : `identiques` sans chevron, `variables` déployé, `variables` replié
**And** replier ne modifie aucune donnée, ne quitte pas `variables`, et une Cible à renseigner dans un tableau replié laisse le ✓ indisponible (FR-04-02, FR-03-03)
**And** à N = 1, le champ de Régime n'est pas modifiable et la Feuille montre l'état uniforme (FR-12-04, P16).

**AC7 — Comportement commun des popovers (FR-03-10, P9, AD-15).**
**Given** un popover ouvert, par exemple Mode `Durée`
**When** Hermann touche à l'extérieur
**Then** le popover se ferme sans appliquer : le Mode reste `Durée`, et l'appui n'active pas un contrôle destructif situé dessous
**And** la ligne déclenchante est désignée active pendant l'ouverture (référence visuelle : barre d'accent et fond de ligne)
**And** une ligne sélectionnée porte le fond de sélection (`colors.stepperSurface`, rayon 12), sans contour ni liseré, sans qu'aucun texte ne bouge — source : Q40 (décision de Hermann du 2026-10-17, écart E-14)
**And** sélectionner ou désélectionner une ligne ne change ni marge, ni padding, ni largeur, ni position du texte, et ne joue aucune transition de place (fond dessiné en arrière-plan) ; un contrôle affiché sur une ligne sous le champ sélectionné est dans le même cadre coloré que la ligne — source : Q41 (écart E-15)
**And** ouvrir une autre surface ferme la précédente sans appliquer sa valeur en cours : `openSurface` porte au plus une surface, en état d'interface, jamais dans le Brouillon du domaine ; l'ouverture d'un popover désactive la Cellule active éventuelle (AD-15, T15) ; un rappel `onIsPresentedChange(false)` d'une surface déjà fermée ou remplacée est ignoré (clé de surface, AD-15, T8)
**And** le focus revient au déclencheur à la fermeture (H13)
**And** ✕ de la Feuille après un choix dans un popover rétablit l'état d'avant l'ouverture de la Feuille.

**AC8 — Valeurs numériques hors tableau (FR-03-05, FR-10-05, FR-09-04).**
**Given** les lignes `Séries` (N), `Pause après chaque série`, `Pause entre les côtés`, `Bip de cadence`, `Compte à rebours`, `Fin d’exercice`
**When** Hermann touche une valeur
**Then** au repos seule la valeur est visible ; à l'appui, − et + apparaissent à sa droite, la valeur reculant d'une translation constante
**And** un seul champ actif dans toute la Feuille : toucher une autre valeur ferme le précédent et ouvre le nouveau d'un seul geste (AD-15, T20) ; un appui extérieur range l'outil sans bouton Annuler, les valeurs restant dans le Brouillon de la Feuille (T23)
**And** les − et + d'un champ ouvert ne le ferment jamais : le champ reste ouvert, avec la même clé de surface, après chaque pas, y compris le − de N qui retire des lignes du tableau (AD-15, T22 ; FR-12-02)
**And** le toucher qui range un champ ouvert active dans le même geste une cible inoffensive : ligne d'un popover (T15), ligne de Cible commune ou de Durée totale (T24), chevron (T14), ✓ ou ✕ de la Feuille (T19) ; il ne déclenche jamais la croix d'une ligne (T23)
**And** à l'inverse, pendant qu'un popover ou un Sélecteur est ouvert, toucher une valeur hors tableau ferme seulement la surface, sans appliquer, et n'ouvre pas le champ touché : la primitive native absorbe l'appui (AD-15, T10). *Pour un Sélecteur, depuis Q37 : la couche `WheelPickerOverlay` couvre la Feuille ; le toucher n'atteint pas la valeur et ne ferme pas la roue, que seuls ✕ et ✓ ferment. Depuis Q41, pour un panneau sans flèche (Changement de côté, Ordre des côtés, roue de Durée commune, roue de Durée totale, iOS) : le toucher extérieur ferme le panneau sans appliquer et n'ouvre pas le champ touché*
**And** appui bref : pas de 1 ; maintien : répétition après ≈ 500 ms toutes les 150 ms, paliers de 5 après ≈ 2 s puis de 10 après ≈ 4 s pour N et les Pauses ; `Bip de cadence`, `Compte à rebours` et `Fin d’exercice` restent au pas de 1 sans accélération ; saturation aux bornes, arrêt au relâchement sans pas supplémentaire (FR-09-04)
**And** les bornes restent N 1..99, Pauses 0..300 s, Bip 0..10 (`Aucun` à 0), Compte à rebours et Fin 0..60 s (FR-09-03, lecture).

**AC9 — Affichage des valeurs initiales (FR-03-04, FR-11-05).**
**Given** une création
**When** la Feuille s'ouvre
**Then** `Mode d’exécution` et `Changement de côté` affichent `—`, N = 1, Pause 0 s, `Bip de cadence` `Aucun`.

**AC10 — Validation de la Feuille (FR-03-03, P4).**
**Given** un Mode à renseigner ou une Cible commune `UNSET`
**When** Hermann regarde la Feuille
**Then** ✓ est indisponible ; la ligne concernée prend le fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35) ; aucun message en ligne
**And** une Pause de 0 s est valide ; une valeur ancienne hors bornes non modifiée ne rend pas ✓ indisponible (H25).

**AC11 — Repli Android et web (AD-7).**
**Given** `Platform.OS` différent de `"ios"` sous Jest
**When** la Feuille est rendue
**Then** Mode, Changement de côté, Ordre des côtés et Régime passent par le `SegmentedControl` existant, avec les mêmes options et les mêmes effets sur le Brouillon (parité fonctionnelle testée)
**And** sur iOS, un test par popover vérifie qu'aucune `Modal` ni aucun `Pressable` de substitution n'est rendu à sa place.

**Preuves attendues :**
- Relevé visuel préalable des frames citées (règles communes de l'epic).
- Tests : rendu de chaque popover et de ses options exactes ; appui extérieur sans application ; une seule surface ; ordre du corps ; ± à l'appui ; transitions du réducteur T10, T15 à T17, T19, T20, T22, T23 (champ → autre champ d'un seul geste, ± sans fermeture, appui extérieur, popover ouvert depuis un champ ouvert) ; N = 1 ; chevron ; repli Android et web ; garde-fous zéro `ScrollView` (`DurationWheelPicker.test.tsx:378`, `:619`, `NumberWheelPicker.test.tsx:267`) verts et inchangés.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22, après `R-3.1-00`) :
  - `R-3.3-01` — Création, Feuille ouverte. Gestes : toucher `Mode d’exécution`, choisir `Durée` ; rouvrir, toucher hors de la bulle. Attendu : deux options exactes, appui extérieur sans application (FR-05-01, FR-03-10). Visuel : `8328:37092`, `8328:38513`.
  - `R-3.3-02` — Gestes : `Changement de côté` → `Droite puis gauche` ; `Ordre des côtés` → `Les deux côtés à chaque série`. Attendu : options exactes, ligne `Ordre des côtés` présente seulement en bilatéral (FR-03-07, FR-03-08). Visuel : `8328:37972`, `8328:38953`, `8328:38193`, `8328:38301`.
  - `R-3.3-03` — N = 3. Gestes : champ de Régime → `variables` ; replier puis déplier par le chevron ; N à 1. Attendu : tableau visible, replié sans perte, Régime non modifiable et, en bilatéral, Ordre masqué à N = 1 ; l'Ordre choisi est conservé et réaffiché dès N ≥ 2 — source : Q38 (FR-04-01, FR-04-02, FR-12-04). Visuel : `8328:39390`, `8328:39181`, `8328:39072`.
  - `R-3.3-04` — Gestes : toucher la valeur de `Pause après chaque série`, maintenir + 5 s ; toucher `Bip de cadence` pendant que l'outil est ouvert ; toucher + du Bip deux fois ; toucher le corps de la Feuille. Attendu : ± à l'appui, accélération, un seul champ actif, Bip ouvert d'un seul geste, ± du Bip sans fermeture du champ, Bip au pas de 1, champ rangé par l'appui extérieur (FR-03-05, FR-09-04 ; AD-15 T20, T22, T23). Visuel : `8328:37760`.
  - `R-3.3-05` — Création, rien de choisi. Attendu : `—` sur fond `#FFF1F0`, sans contour (Q35), ✓ indisponible, aucun message (FR-03-03, FR-11-05). Visuel : `8328:36923`.
  - `R-3.3-06` — Dans chacun des quatre parcours. Gestes : toucher la Carte ; modifier le Mode, le Régime, N et une Pause ; ✕ ; rouvrir ; refaire puis ✓ ; recommencer avec « Réduire les animations ». Attendu : voile en fondu et Feuille montant du bas (en place avec la réduction) ; en-tête fixe ✕ / `Paramètres d’exécution` / ✓ ; ordre du corps de FR-03-02 ; ✕ rend l'Éditeur inchangé ; ✓ applique d'un bloc, rien en base avant `Terminer` ; focus rendu à la Carte (FR-03-01 à FR-03-03, FR-11-01, FR-11-02, NFR-10). Visuel : `8328:36923`.
- Rappel NFR-04.

**Hors story :** le Sélecteur de cible et la ligne de Cible commune (3.4, 3.5) ; les cellules du tableau et le Pied commun (3.6) ; la ligne Durée totale (3.7) ; l'audit VoiceOver complet de la Feuille (3.8).

---

### Story 3.4 : Sélecteur de cible en Durée : option échec et grisé manipulable

En tant que Hermann (utilisateur de KODJO),
je veux choisir la Cible d'une Série en Durée sur une roulette native minutes-secondes, ou choisir « Aucune durée, à l’échec », et revenir au numérique en faisant tourner directement le bloc atténué,
afin de régler une durée ou l'échec en un geste, sans déverrouillage ni écran supplémentaire, et sans jamais valider `00:00`.

**Exigences :** FR-03-11 (Cible), FR-06-02 (interface, ligne commune), FR-06-05 (ligne commune), FR-07-01 (ligne commune), FR-07-02, FR-07-04 (Durée), FR-07-05, FR-07-06, FR-07-08, FR-08-01, FR-08-02, FR-08-04, FR-08-05, FR-08-06, FR-09-01 (interface), FR-09-05 (ouverture, Q21) ; NFR-02, NFR-03, NFR-04, NFR-06, NFR-09 ; Q12, Q15, Q21, Q25, P5, P6, P19, P21, P33, H13, H15.
**Architecture :** AD-7 (Popover, contrat des roulettes : props optionnelles de pas, de bornes et `failureOption` typée, aucune sentinelle numérique, aucune haptique ajoutée, grisé par opacité jamais `disabled`), AD-15 (`selector(commonTarget)`, valeur locale dispatchée à ✓ seulement ; transitions T24 à T26, avec T7, T8 et T10), AD-16 (`nearestGridValue` et `selectorOpeningPosition` dans `ExecutionParameters.ts`), AD-11 (`UNSELECTED_OPACITY`). Voie de la roue : la couche `WheelPickerOverlay` de PRE-3, centrée, sans flèche, fermée par ✕ / ✓ seulement (Q37, 3.1 AC7). *Rendu remplacé par Q37 ; historique : « Voie de la roue dans `Popover.Content` : celle consignée par 3.1 AC7 ».* Fichiers principalement touchés (indicatif) : `src/features/sessions/DurationWheelPicker.tsx`, `src/domain/activities/ExecutionParameters.ts`, `src/features/activities/ExecutionParametersSheet.tsx`, `src/shared/i18n/`.
**Références visuelles :** frames Figma `8328:37862` (Sélecteur, Durée, Cible numérique ; maître `8452:13297`), `8328:37760` (ligne `Durée d’une série`) — visuel seulement, D-255.
**Dépend de :** 3.3.
**Hypothèses non validées :** H13, H15, H23 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Ouverture depuis la ligne commune (FR-07-01, FR-03-11, AD-15).**
**Given** Mode Durée, Régime `identiques`
**When** Hermann touche la valeur de la ligne `Durée d’une série`
**Then** le Sélecteur s'ouvre, sur iOS, dans un panneau sans flèche juste sous le champ `Durée d’une série`, cadre aligné à droite, au-dessus du contenu, avec ses propres ✕ et ✓, sans `Modal` ni l'ancienne modale basse séparée (Q41 ; *historique : « dans un popover ancré sous la ligne », puis Q37 « dans la couche `WheelPickerOverlay`, centré horizontalement sur la page, sans flèche, sur voile »*)  ; le Sélecteur d'une Cellule active (Durée, story 3.6) s'ouvre dans le même panneau, sous la cellule, aligné à droite (Q41, cohérence)
**And** toute autre surface ouverte se ferme sans appliquer ; une seule surface est ouverte.

**AC2 — Composition de la variante Durée (FR-07-02, P6, P21, H15).**
**Given** le Sélecteur ouvert en Durée
**When** Hermann l'observe et fait tourner les colonnes
**Then** de haut en bas : l'option « Aucune durée, à l’échec » centrée, un filet, la roulette native à deux colonnes `minutes` et `secondes`
**And** le libellé est exactement « Aucune durée, à l’échec »
**And** les minutes vont de 00 à 58, sans 59 ; les secondes avancent par pas de 1, de 00 à 59, et de 00 à 55 à 58 minutes (Q36) ; les valeurs proposées vont de 00:05 à 58:55, plus la position `00:00`
**And** la roue des minutes ne reboucle pas de 58 à 00 (H15)
**And** la roulette de Durée totale n'en fait pas partie.

**AC3 — Ouverture sur la Cible courante (FR-07-04).**
**Given** une Cible `NUMBER 30`
**When** le Sélecteur s'ouvre
**Then** la roue est sur 00:30, active, et l'option échec est à 45 % d'opacité
**And** **Given** une Cible `FAILURE`, l'option est à 100 % et le bloc minutes-secondes affiche `00:00` atténué à 45 %
**And** **Given** une Cible `UNSET` (`—` : création en Durée, P19 ; ligne après un changement de Mode ; donnée ancienne sans Cible), la roue s'ouvre sur 00:05, active, sélection numérique, option échec à 45 %, ✓ du Sélecteur disponible ; la position vient de `selectorOpeningPosition("DURATION", UNSET)` du domaine (Q25, AD-16)
**And** pendant l'ouverture, la ligne de la Feuille affiche toujours `—` ; ✕ laisse la Cible à renseigner (`—` sur fond `#FFF1F0`, sans contour, ✓ de la Feuille indisponible) ; ✓ sans avoir tourné applique 5 s (Q25, Q12)
**And** exactement une Cible est sélectionnée ; aucune coche n'est affichée.

**AC4 — Cible historique hors bornes (FR-07-04, FR-09-05, Q21, Q36).**
**Given** une Cible ancienne 5999 s
**When** le Sélecteur s'ouvre
**Then** la roue est sur 58:55, calculé par `nearestGridValue("DURATION", value)` du domaine, qui borne la valeur à 5..3535 (Q36 : sans multiple de 5) ; la roulette reçoit une valeur déjà dans les bornes et ne recale jamais
**And** la ligne de la Feuille affiche toujours 5999 s pendant l'ouverture
**And** ✕ laisse 5999 s intact ; ✓ sans avoir tourné applique 3535 s
**And** **Given** une Cible ancienne 7 s, valide depuis Q36, le Sélecteur s'ouvre sur 00:07 et ✓ sans avoir tourné laisse 7 s.

**AC5 — Passer à l'échec (FR-08-01).**
**Given** le Sélecteur ouvert sur 30 s
**When** Hermann touche « Aucune durée, à l’échec »
**Then** l'option passe à 100 %, la roue revient à `00:00` et tout le bloc minutes-secondes est atténué à 45 %
**And** le rappel du composant reçoit une `SeriesTarget` `FAILURE`, jamais un nombre (AD-7).

**AC6 — Revenir au numérique sans déverrouillage (FR-08-02, P5, FR-07-06).**
**Given** l'échec sélectionné, bloc atténué
**When** Hermann fait directement tourner la roue jusqu'à 00:30
**Then** la Cible sélectionnée devient 30 s ; l'option repasse à 45 % et la roue reprend son rendu actif
**And** aucun appui long, double appui ni déverrouillage n'est nécessaire ; le bloc n'est jamais rendu par un `disabled` natif : l'atténuation est une opacité autour de la primitive (AD-7)
**And** chaque cran donne le retour haptique natif du `Picker`, sans haptique ajoutée (FR-07-06).

**AC7 — `00:00` jamais une Cible (FR-08-04, Q15).**
**Given** une sélection numérique (option à 45 %)
**When** Hermann amène la roue sur `00:00`
**Then** le ✓ du Sélecteur est indisponible et l'échec n'est pas sélectionné : `00:00` n'est jamais converti en échec ni validé
**And** l'indisponibilité passe par la seule prop optionnelle `validateDisabled` ajoutée à `PickerToolbar`, à l'identique dans ses deux copies (`DurationWheelPicker.tsx`, `NumberWheelPicker.tsx`), sans remplacer le composant (AD-7) : le ✓ reçoit `disabled`, `accessibilityState={{ disabled: true }}` et l'opacité `UNSELECTED_OPACITY` ; un appui n'appelle pas `onValidate` ; ✕ reste disponible ; la roue n'est jamais désactivée **And** sans la prop, `PickerToolbar` se comporte comme au départ (Composition, roulette des tours) **And** le rendu du ✓ indisponible n'a pas de frame : il est inscrit `NON VÉRIFIABLE` au relevé et jugé par Hermann à la recette
**And** une Pause de 0 s reste valide ailleurs dans la Feuille.

**AC8 — Valider ou annuler, puis la Feuille (FR-07-05, Q12, AD-15).**
**Given** le Sélecteur ouvert sur 30 s
**When** Hermann tourne vers 45 s puis touche ✕
**Then** la Cible reste 30 s
**And** **When** il tourne vers 45 s et touche ✓, la Cible du Brouillon de la Feuille devient 45 s, l'Éditeur restant inchangé
**And** ✓ de la Feuille applique ensuite à l'Éditeur ; ✕ de la Feuille annule tout, y compris le choix validé dans le Sélecteur
**And** un toucher hors du panneau ferme le Sélecteur sans rien appliquer (Q41) ; la valeur en cours n'atteint jamais le Brouillon avant ✓. *Historique : « l'appui extérieur ferme le Sélecteur sans rien appliquer », puis Q37 « un toucher sur le voile ne ferme pas le Sélecteur ; seuls ✕ et ✓ le ferment ».*

**AC9 — Scénario de transition complet (FR-08-05).**
**Given** une Cible 30 s
**When** Hermann ouvre (roue 00:30, option 45 %), touche l'option (100 %, `00:00` à 45 %), tourne vers 00:30 (30 s, option 45 %), ✓, rouvre ; puis choisit l'échec, ✓, rouvre ; puis change et touche ✕
**Then** il lit successivement : 30 s ; option à 100 % et `00:00` à 45 % ; l'état d'avant l'ouverture restauré.

**AC10 — Ligne commune : affichage et validation (FR-06-05, FR-06-02, FR-08-06, FR-09-01).**
**Given** la ligne `Durée d’une série`
**When** la Cible est `FAILURE`, `UNSET` ou `NUMBER`
**Then** elle affiche `à l’échec`, `—` sur le fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35), et ✓ de la Feuille indisponible, ou la durée formatée (ex. `30 s`, `1 min`)
**And** aucune Cible à renseigner, 0 ni texte n'est converti en échec (FR-06-02)
**And** aucune nouvelle Cible hors 5..3535 s ne peut sortir du Sélecteur ; toute valeur entière dans ces bornes, multiple de 5 ou non, est valide (FR-09-01, Q36)
**And** aucun écran « Série à l’échec » n'existe (FR-08-06).

**AC11 — Accessibilité du Sélecteur (FR-07-08, H13, H23).**
**Given** VoiceOver activé
**When** Hermann parcourt le Sélecteur
**Then** l'option échec est annoncée « sélectionnée » ou « non sélectionnée », jamais par le gris seul
**And** le bloc atténué reste manipulable avec VoiceOver ; la valeur et son unité sont annoncées ; le focus reste dans le panneau de la roue, modal pour VoiceOver (Q41 ; couche de la roue selon Q37 auparavant)
**And** l'option échec, dessinée sur 30 de haut, a une cible tactile d'au moins 44 × 44 pt (P30)
**And** les textes d'annonce sont des clés du lexique (H23).

**AC12 — Contrat de la roulette et repli (AD-7, NFR-03).**
**Given** `DurationWheelPicker` étendu par des props optionnelles (pas, bornes, `failureOption`)
**When** il est utilisé sans ces props (Composition, roulette des tours)
**Then** son comportement actuel est inchangé ; `WHEEL_SECONDS_STEP` n'est pas modifié
**And** avec `failureOption`, le rappel numérique n'est jamais appelé pour l'échec
**And** hors iOS, la roulette `Legacy*` existante porte la même option et les mêmes transitions (parité testée sous Jest)
**And** sur iOS, la roue de la Cible commune est présentée dans le panneau sans flèche sous le champ (`AnchoredPanel`, conteneur de positionnement, Q41) ; `DurationWheelPicker` et sa `PickerToolbar` y gardent leur mécanisme natif ; `WheelPickerOverlay` reste inchangé pour Composition (*Q37 : « présentée dans `WheelPickerOverlay`, composant PRE-3 accepté, sans autre voie (3.1 AC7) »*). *Historique : « placée dans `Popover.Content` par la voie consignée en 3.1 AC7 ((i) `RNHostView` ou (ii) `Picker` SwiftUI direct) »*
**And** les garde-fous `DurationWheelPicker.test.tsx:378` et `:619` restent verts et inchangés.

**Preuves attendues :**
- Relevé visuel préalable de `8328:37862`, `8328:37760` et du maître `8452:13297`.
- Tests : `nearestGridValue`, bornage depuis Q36 (4 → 5, 5999 → 3535, valeurs dans les bornes inchangées, dont 7 → 7 et 31 → 31) ; `selectorOpeningPosition` (`UNSET` → 00:05, `FAILURE` → option, `NUMBER` → `nearestGridValue`) ; composant (option, transitions, `00:00`, ✕ / ✓, `SeriesTarget` émise, absence de `disabled` sur la roue, `validateDisabled` du ✓ et état d'accessibilité, comportement inchangé sans la prop) ; Feuille (ouverture, ouverture sur `UNSET`, une seule surface, dispatch à ✓) ; garde-fous zéro `ScrollView`.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22, après `R-3.1-00`) :
  - `R-3.4-01` — Durée, `identiques`, Cible 30 s. Gestes : scénario d'AC9. Attendu : FR-08-05 pas à pas. Visuel : `8328:37862`.
  - `R-3.4-02` — Gestes : sélection numérique, amener la roue sur `00:00`. Attendu : ✓ du Sélecteur indisponible, pas d'échec (FR-08-04, Q15).
  - `R-3.4-03` — Exercice ancien à Cible 5999 s. Gestes : ouvrir, ✕ ; ouvrir, ✓. Attendu : 58:55 à l'ouverture, 5999 s après ✕, 3535 s après ✓ (Q21). Une Cible ancienne 7 s, valide depuis Q36, ouvre sur 00:07 et n'est pas signalée.
  - `R-3.4-04` — Gestes : faire défiler les minutes jusqu'en butée. Attendu : 58 maximum, aucune 59, pas de rebouclage, secondes au pas de 1 (P21, H15, Q36).
  - `R-3.4-05` — VoiceOver. Attendu : AC11 (FR-07-08).
  - `R-3.4-06` — Préconditions : nouvel Exercice, Mode Durée, Cible `—`. Gestes : ouvrir le Sélecteur, ✕ ; rouvrir, ✓ sans tourner. Attendu fonctionnel : ouverture sur 00:05, option échec à 45 % ; `—` après ✕ ; 5 s après ✓ (Q25, FR-07-04). Attendu visuel : `8328:37862` pour la composition ; position d'ouverture sans frame propre.
- Rappel NFR-04 et P33 : le rendu ligne par ligne de la roue (niveaux 100/45/20/10 %) relève du rendu natif ; un écart est signalé, jamais corrigé par une réimplémentation.

**Hors story :** la variante Répétitions (3.5) ; l'ouverture depuis une cellule du tableau (3.6) ; la roulette de Durée totale (3.7).

---

### Story 3.5 : Sélecteur de cible en Répétitions à une colonne

En tant que Hermann (utilisateur de KODJO),
je veux choisir la Cible d'une Série en Répétitions sur une roulette native à une colonne dont la première ligne est « Aucune répétition, à l’échec », suivie de 1 à 100,
afin de régler un nombre de répétitions ou l'échec du même geste, sans stepper en ligne.

**Exigences :** FR-07-01 (ligne commune en Répétitions), FR-07-03, FR-07-04 (Répétitions), FR-07-05 (Répétitions), FR-07-08 (Répétitions), FR-08-03, FR-09-02 (interface), FR-09-05 (ouverture à 150) ; NFR-02, NFR-03, NFR-04 ; Q8, Q12, Q14, Q21, Q25, P37, H13, H14.
**Architecture :** AD-7 (`NumberWheelPicker` étendu : bornes 1..100 par prop, `failureOption` typée, aucune sentinelle sortante ; voie de la roue : panneau sans flèche sous le champ, aligné à droite, comme 3.4 (Q41, cohérence) — *historique : « dans `Popover.Content` », puis couche `WheelPickerOverlay` (Q37)*), AD-15, AD-16 (`nearestGridValue("REPETITIONS", …)`, `selectorOpeningPosition`). Fichiers principalement touchés (indicatif) : `src/features/sessions/NumberWheelPicker.tsx`, `src/domain/activities/ExecutionParameters.ts`, `src/features/activities/ExecutionParametersSheet.tsx`, `src/shared/i18n/`.
**Références visuelles :** aucune capture de la variante Répétitions (table de 4.22 du PRD) ; référence de contexte `8328:38741` (en-tête de colonne `Répétitions`) et géométrie hôte de `8328:37862` — visuel seulement, D-255. Le rendu de la ligne de tête est `NON VÉRIFIABLE` sur Figma et validé par Hermann sur appareil.
**Dépend de :** 3.4.
**Hypothèses non validées :** H13, H14 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Ouverture depuis la ligne commune (FR-07-01, H14).**
**Given** Mode Répétitions, Régime `identiques`
**When** Hermann touche la valeur de la ligne `Nombre de répétitions`
**Then** le Sélecteur s'ouvre, sur iOS, dans le même panneau sans flèche que 3.4, juste sous le champ `Nombre de répétitions`, cadre aligné à droite, au-dessus du contenu, avec ses propres ✕ et ✓ ; un toucher hors du panneau le ferme sans appliquer ; une seule surface ouverte (Q41, décision de cohérence du 2026-10-17 ; *historique : « dans le même popover ancré », puis Q37 « dans la même couche `WheelPickerOverlay`, centré, sans flèche, fermé par ✕ et ✓ seuls »*).

**AC2 — Une colonne, ligne de tête puis 1 à 100 (FR-07-03, Q8, Q14).**
**Given** le Sélecteur ouvert en Répétitions
**When** Hermann fait tourner la roue
**Then** elle a une seule colonne : première ligne « Aucune répétition, à l’échec », puis les entiers 1 à 100 dans l'ordre croissant
**And** ni filet, ni libellé séparé, ni position `00:00`, ni grisé ajouté n'existent ; la sélection est rendue par la roue native
**And** le stepper en ligne de la Cible Répétitions est retiré (NFR-03, liste fermée).

**AC3 — Choix par la position de la roue (FR-07-03, FR-08-03).**
**Given** la roue sur la ligne de tête
**When** Hermann tourne vers 12
**Then** la Cible sélectionnée devient 12 ; revenir sur la ligne de tête sélectionne l'échec
**And** le rappel du composant reçoit une `SeriesTarget` (`FAILURE` ou `NUMBER`), jamais une sentinelle numérique (AD-7).

**AC4 — Ouverture sur la Cible courante (FR-07-04, Q21).**
**Given** une Cible `NUMBER 12`, puis une Cible `FAILURE`, puis une Cible ancienne 150
**When** le Sélecteur s'ouvre
**Then** la roue est respectivement sur 12, sur la ligne de tête, et sur 100 (`nearestGridValue`)
**And** pour 150, la ligne de la Feuille affiche 150 pendant l'ouverture ; ✕ laisse 150 ; ✓ sans tourner applique 100
**And** **Given** une Cible `UNSET` (`—`, par exemple une ligne après un passage de Durée à Répétitions, P37) **When** le Sélecteur s'ouvre **Then** la roue est sur 1, et non sur la ligne de tête ; la position vient de `selectorOpeningPosition("REPETITIONS", UNSET)` (Q25, AD-16) ; pendant l'ouverture la ligne affiche `—` ; ✕ laisse `—` ; ✓ sans tourner applique 1.

**AC5 — Bornes (FR-09-02).**
**Given** le Sélecteur en Répétitions
**When** Hermann cherche une valeur hors plage
**Then** aucune valeur 0, 101 ou fractionnaire n'est proposée ni ne peut sortir du Sélecteur ; 1 et 100 sont atteignables.

**AC6 — Valider, annuler (FR-07-05, Q12).**
**Given** une Cible 10
**When** Hermann tourne vers 12 puis ✕, puis tourne vers l'échec puis ✓
**Then** la Cible reste 10 après ✕ ; elle devient `à l’échec` dans le Brouillon de la Feuille après ✓, l'Éditeur restant inchangé jusqu'au ✓ de la Feuille.

**AC7 — Accessibilité (FR-07-08, H13).**
**Given** VoiceOver activé
**When** Hermann parcourt la roue
**Then** la ligne de tête est annoncée avec son état sélectionné ou non, et un nombre est annoncé avec son unité
**And** le libellé « Aucune répétition, à l’échec » n'est pas tronqué au point de devenir illisible ; s'il l'est dans la largeur native, l'écart est signalé à Hermann (P33), sans réimplémentation de la roue.

**AC8 — Contrat de la roulette et repli (AD-7, NFR-03).**
**Given** `NumberWheelPicker` étendu par des props optionnelles (bornes, `failureOption`)
**When** il est utilisé sans ces props (Composition, roulette des tours)
**Then** son comportement actuel (1..99) est inchangé ; `WHEEL_NUMBER_MAX` n'est pas modifié
**And** hors iOS, la roulette `Legacy*` porte la même ligne de tête et les mêmes transitions (parité testée)
**And** sur iOS, la roue est présentée dans le panneau sans flèche (`AnchoredPanel`), la même voie que 3.4 (Q41 ; *historique : « placée dans `Popover.Content` par la voie consignée en 3.1 AC7 », puis `WheelPickerOverlay` (Q37)*) ; `PickerToolbar` de `NumberWheelPicker.tsx` reçoit la même prop optionnelle `validateDisabled` que sa copie (AD-7), sans usage obligatoire dans cette variante
**And** le garde-fou `NumberWheelPicker.test.tsx:267` reste vert et inchangé, la largeur explicite de la colonne native est conservée (pas de repli sous `matchContents`).

**Preuves attendues :**
- Relevé visuel préalable : géométrie hôte de `8328:37862` et contexte de `8328:38741` ; la ligne de tête est classée `NON VÉRIFIABLE`.
- Tests : composant (ligne de tête, 1..100, `SeriesTarget` émise, ✕ / ✓) ; `nearestGridValue("REPETITIONS", 150) = 100` ; Feuille ; garde-fou zéro `ScrollView`.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22, après `R-3.1-00`) :
  - `R-3.5-01` — Répétitions, `identiques`, Cible 10. Gestes : ouvrir, tourner vers 12, ✕ ; ouvrir, tourner jusqu'à la ligne de tête, ✓ ; rouvrir. Attendu : 10 après ✕ ; `à l’échec` après ✓ ; réouverture sur la ligne de tête (FR-07-03, FR-08-03, Q14). Visuel : `NON VÉRIFIABLE`, jugement de Hermann.
  - `R-3.5-02` — Exercice ancien à Cible 150. Gestes : ouvrir, ✕ ; ouvrir, ✓. Attendu : roue sur 100 ; 150 après ✕ ; 100 après ✓ (Q21).
  - `R-3.5-03` — VoiceOver et texte agrandi. Attendu : AC7.
  - `R-3.5-04` — Préconditions : Exercice en Durée, Cible `—`, passé en Répétitions. Gestes : ouvrir le Sélecteur, ✕ ; rouvrir, ✓ sans tourner. Attendu fonctionnel : roue sur 1 ; `—` après ✕ ; `1 rép.` après ✓ (Q25, P37). Visuel : `NON VÉRIFIABLE`.
- Rappel NFR-04.

**Hors story :** l'ouverture depuis une cellule du tableau (3.6) ; le libellé de la ligne et les autres textes de la Feuille déjà traités (3.3).

---

### Story 3.6 : Tableau des séries variables : Cellule active, Pied commun, retrait, glisser

En tant que Hermann (utilisateur de KODJO),
je veux régler chaque Série du Tableau des séries variables en touchant sa cellule, ajuster la Cellule active par le Pied commun, retirer une ligne avec annulation et réordonner par glisser,
afin de composer une suite de Cibles mixtes (par exemple 10, 12 puis à l'échec) sans steppers permanents ni réglage perdu.

**Exigences :** FR-03-12, FR-06-02 (interface, cellule), FR-06-05, FR-07-01 (cellule), FR-09-04 (Cible et Pause du tableau), FR-09-05 (± depuis une valeur hors grille), FR-09-06 (interface), FR-10-01, FR-10-02, FR-10-03, FR-10-04, FR-10-05 (un seul champ actif, tableau compris), FR-10-06, FR-10-07, FR-10-08, FR-12-02 (interface : − de N, champ ouvert), FR-12-03 (interface), FR-12-05 (interface), FR-12-06 ; NFR-02, NFR-03, NFR-04, NFR-09 ; Q13, Q15, Q21, Q25, Q26, P4, P11, P23, P38, H5 (confirmée par Q29), Q29, H19, H22.
**Architecture :** AD-8 (glisser PRE-3 et actions accessibles monter / descendre conservés ; steppers permanents retirés ; message « Série supprimée — Annuler » par le message existant `ExecutionParametersSheet.tsx:741-768`), AD-15 (`activeCell` = `{ ligne, colonne }` distinct d'`openSurface` = `selector(rowTarget(ligne))` ; table de transitions T1 à T27, dont T21 et T22 pour un champ hors tableau ouvert et T27 pour `Annuler` ; croix inactive tant qu'une surface est ouverte ou qu'une Cellule est active), AD-16 (`stepTarget` et `steppedValue` corrigé, politique `StepperHoldPolicy` de la Cible Durée), AD-2 (dispatch au Brouillon). Fichiers principalement touchés (indicatif) : `src/features/activities/ExecutionParametersSheet.tsx`, `src/domain/activities/ExecutionParameters.ts`, `src/shared/ui/ProfileStepper.tsx`, `src/shared/i18n/`.
**Références visuelles :** frames Figma `8328:38632`, `8328:38741`, `8328:38848`, `8470:13303`, `8328:39279`, `8328:39181` ; maîtres `8129:31593` (ligne), `8129:31601` (Pied commun), `8129:31604` (icône de retrait) — visuel seulement, D-255. Le texte de Phrase de `8328:38848` n'est pas reproduit (P1).
**Dépend de :** 3.5.
**Hypothèses non validées :** H19, H22 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

*Q44 (décision de Hermann du 2026-10-17) : la Cellule active et le Pied commun ne sont pas réalisés. Les cellules de Cible et de Pause gardent leurs ± permanents (code PRE-3). Statut des critères : **maintenus** AC1, AC3 (Sélecteur ouvert en touchant la valeur de la cellule de Cible, sous la cellule, Q41 ; ✓ n'applique qu'à cette ligne), AC5 et AC6 (appliqués aux ± de la cellule, par `stepTarget`), AC7, AC8, AC9 (croix inactive tant qu'un outil est ouvert), AC10, AC11, AC12, AC13 (cibles tactiles, annonce de ligne et colonne de la cellule) ; **partiel** AC2 (unicité de la surface ouverte, tableau compris ; un champ hors tableau se ferme au toucher d'une cellule de Cible, T21) ; **sans objet** AC4 (Pied commun), la partie Cellule active d'AC3 et d'AC9, les transitions AD-15 propres à `activeCell` (T4, T9, T11, T12) et R-3.6-08. Les ± d'une cellule sont indisponibles sur l'échec.*

**AC1 — Structure du tableau (FR-10-01, FR-06-05, P23).**
**Given** Régime `variables`, N = 3, Mode Durée
**When** le tableau est affiché
**Then** il est rattaché au champ de Régime ; chaque ligne, numérotée 1 à 3, porte une poignée, un numéro, une cellule de Cible, une cellule de Pause et une commande de retrait
**And** les en-têtes sont `Durée` (ou `Répétitions`) puis `Pause` ; les deux colonnes restent même si toutes les Cibles sont à l'échec
**And** une cellule de Cible affiche `30 s`, `1 min`, `12 rép.` ou `à l’échec`
**And** la disposition est la grille à cellules du DSF du 12/10, sans retraits x52 ; le tableau ne défile pas indépendamment du corps.
**And** **Given** la Feuille ouverte, le tableau n'est pas sélectionné et le groupe « Séries variables » est à l'état normal, sans fond ni contour **When** Hermann active les séries variables, déplie le tableau ou agit dans le tableau (cellule, ±, glisser, retrait) **Then** le groupe prend le fond d'une ligne sélectionnée, sans contour ; **When** il sélectionne ensuite un autre champ hors du tableau (popover, roue, ± de N, du Bip ou d'une autre ligne) ou replie le tableau **Then** le groupe revient à l'état normal (le cadre fixe X-3 du code de départ est retiré) — source : Q40 (décision de Hermann du 2026-10-17, écart E-14).

**AC2 — Une seule Cellule active, désignée trois fois (FR-10-02, FR-10-05, P11).**
**Given** le tableau affiché
**When** Hermann touche la cellule Pause de la ligne 2, puis la cellule Pause de la ligne 3
**Then** aucune cellule n'a de − / + permanents
**And** la cellule touchée devient la seule Cellule active, la précédente étant désactivée d'un seul geste ; une seule surface ou champ actif existe dans toute la Feuille, tableau compris
**And** elle est désignée par une barre d'accent sur sa ligne, un fond sur sa colonne et la mention `Série 3 · Pause` dans le Pied commun
**And** **Given** un champ hors tableau ouvert (par exemple N, ou `Pause après chaque série`) **When** Hermann touche une cellule de Cible ou de Pause **Then** le champ se ferme et la cellule devient la Cellule active **dans le même geste** ; une cellule de Cible ouvre en outre son Sélecteur (FR-03-05, FR-10-05 ; AD-15, T21)
**And** **Given** le champ de N ouvert, N = 3 **When** Hermann touche − **Then** N = 2, la ligne 3 est retirée du Brouillon (FR-12-02) et le champ de N reste ouvert ; **When** Hermann touche ensuite la cellule de Cible de la ligne 2 **Then** le champ de N se ferme, la cellule devient la Cellule active et le Sélecteur s'ouvre sur sa Cible, d'un seul geste (AD-15, T16, T22, T21 ; séquence S4 rejouée dans la spine).

**AC3 — Cellule de Cible et Sélecteur (FR-10-03, FR-07-01, Q13, Q21).**
**Given** Mode Durée, ligne 3 à 45 s
**When** Hermann touche la cellule de Cible de la ligne 3
**Then** elle devient Cellule active et le Sélecteur de la story 3.4 s'ouvre sur 00:45 (en Répétitions, celui de la story 3.5) ; une Cible hors bornes ouvre sur la valeur valide la plus proche (bornage, Q36) ; une Cible `UNSET` ouvre sur la valeur minimale, 00:05 ou 1 (Q25, `selectorOpeningPosition`)
**And** ✓ sur l'échec fait afficher `à l’échec` ; ✓ sur un nombre l'affiche ; ✕ laisse la cellule inchangée
**And** seule la cellule touchée change ; les autres lignes sont inchangées
**And** à la fermeture du Sélecteur par son ✓ ou son ✕, la cellule reste la Cellule active, de sorte que le Pied commun agit sur elle (Q13 : toucher la cellule l'active, et les ± du Pied commun ajustent la Cible numérique de la Cellule active) : `activeCell` reste `{ 3, target }` et `openSurface` revient à `none` (AD-15, T5, T6)
**And** une fermeture du Sélecteur par appui extérieur (hors de la bulle, ou geste d'échappement) ferme sans appliquer et range l'outil : plus aucune Cellule active, ± du Pied indisponibles (FR-10-04 ; AD-15, T7) ; toucher une autre cellule pendant que le Sélecteur est ouvert ferme le Sélecteur sans appliquer, sans activer la cellule touchée : la primitive native absorbe l'appui (T10 ; à la différence d'un champ hors tableau ouvert, T21). *Présentation remplacée par Q41 (cohérence) : le Sélecteur de la Cellule active s'ouvre dans le panneau sans flèche, sous la cellule, aligné à droite ; un toucher hors du panneau le ferme sans appliquer et n'active pas la cellule touchée (T7, T10 rétablies). Historique Q37 : la roue est dans la couche `WheelPickerOverlay`, dont le voile n'est pas pressable ; un toucher hors de la roue ne la ferme pas et n'atteint ni une cellule ni le Pied ; seuls ✕ et ✓ la ferment, et la Cellule active est alors conservée (T5, T6). T7 ne reste atteignable que par un geste d'échappement système, s'il existe, avec le même effet*
**And** pendant que le Sélecteur est ouvert, les ± du Pied sont indisponibles (AD-15, T12 ; FR-22-11)
**And** un rappel natif `onIsPresentedChange(false)` reçu après le ✓ ou le ✕ (surface déjà fermée) ne désactive pas la Cellule active : un test de réducteur rejoue ✕ puis le rappel tardif et vérifie `activeCell = { 3, target }` (AD-15, T8).

**AC4 — Pied commun (FR-10-04, FR-03-12, Q15, Q26, AD-16).**
**Given** une Cellule active
**When** Hermann touche − ou + du Pied commun
**Then** le Pied montre à gauche la mention `Série i · <champ>` et à droite − / + qui n'agissent que sur la Cellule active
**And** pas et bornes : Cible Durée appui 1 s et maintien accéléré dans 5..3535 s (Q36) ; Cible Répétitions pas de 1 dans 1..100 ; Pause appui 1 s et maintien accéléré dans 0..300 s ; saturation aux bornes
**And** chaque appui est acquis dans le Brouillon de la Feuille, sans bouton Annuler, et reste annulé par ✕ de la Feuille
**And** sur une Cible `FAILURE`, − et + sont indisponibles (Q13)
**And** **Given** une Cellule active de Cible `UNSET` (`—`) **When** Hermann touche + **Then** la Cible devient la valeur minimale, 5 s en Durée ou 1 en Répétitions, et le fond `#FFF1F0` disparaît (Q35) ; − est indisponible tant que la Cible est `UNSET` (Q26 ; `stepTarget(mode, UNSET, "+")` = valeur minimale, `stepTarget(mode, UNSET, "−")` = `unavailable`, AD-16)
**And** **Given** aucune Cellule active (ouverture de la Feuille, passage en `variables`, ou après qu'un appui extérieur a rangé l'outil) **Then** le Pied commun reste affiché, sans mention de cellule, et ses − et + sont indisponibles, annoncés comme tels (`accessibilityState.disabled`) ; aucune cellule n'est active à l'ouverture de la Feuille (Q26, FR-10-04, AD-16) ; la géométrie du Pied est celle de l'état avec Cellule active, sans composant nouveau.

**AC5 — ± depuis une Cible hors grille ou hors plage (FR-09-05, Q21, P38, AD-16).**
**Given** une Cellule active de Cible Durée 7 s, puis 5999 s ; une Cible Répétitions 150
**When** Hermann touche + puis − (sur une copie de l'état de départ)
**Then** depuis 7 s, valeur valide depuis Q36 : + → 8 s, − → 6 s ; depuis 5999 s : + indisponible, − → 3535 s ; depuis 150 répétitions : + indisponible, − → 100
**And** les résultats proviennent de `stepTarget(mode, target, direction)` du domaine (AD-16) ; le bouton est indisponible sur `unavailable`
**And** `steppedValue` ne renvoie jamais une valeur inférieure à la courante pour + ni supérieure pour − (correction de `steppedValue(5999, +1, 5, 5, 3535)`, qui renvoie 3535 aujourd'hui) ; le Profil est inchangé.

**AC6 — Maintien sur une Cible Durée (FR-09-04, H19, Q36).**
**Given** une Cellule active de Cible Durée à 30 s
**When** Hermann maintient +
**Then** la valeur avance de 1 s (pas de base, Q36 : la politique à pas de base 5 est levée), puis par paliers de 5 s puis de 10 s, arrondis au multiple dans le sens du geste, selon les seuils de temps d'`EXECUTION_ACCELERATED_HOLD_POLICY`, avec saturation à 3535 s sans rebouclage
**And** le relâchement arrête la répétition sans pas supplémentaire
**And** `PROFILE_HOLD_POLICY` est inchangée ; aucune accélération ne s'applique aux roulettes
**And** **Given** une Cellule active de Cible Répétitions à 10 **When** Hermann maintient + **Then** la règle générale de maintien de FR-09-04 s'applique par la politique existante `EXECUTION_ACCELERATED_HOLD_POLICY` : pas de 1, puis paliers de 5 et de 10 arrondis au multiple dans le sens du geste, saturation à 100 sans rebouclage (AD-16 ; aucune politique nouvelle).

**AC7 — Cellule à renseigner (FR-10-06, FR-06-02, P4).**
**Given** une Cible `UNSET` (par exemple après un changement de Mode)
**When** le tableau est affiché, déplié ou replié
**Then** la cellule prend le fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35), et le ✓ de la Feuille est indisponible
**And** aucun message en ligne n'apparaît (ni « Renseignez la durée… », ni « Renseignez les répétitions », ni nom de Série)
**And** la Cible n'est jamais convertie en échec.

**AC8 — Glisser une ligne (FR-10-07, FR-03-12, FR-12-03, AD-8).**
**Given** N = 3, lignes (30 s, 10 s), (45 s, 20 s), (à l'échec, 30 s)
**When** Hermann glisse la poignée de la ligne 3 en tête
**Then** la ligne entière se déplace ; le corps de la Feuille reste immobile ; un repère d'insertion (trait bleu Kodjo de 2) montre la position de dépôt
**And** l'ordre devient (à l'échec, 30 s), (30 s, 10 s), (45 s, 20 s), renuméroté, la nouvelle dernière ligne portant PN
**And** le mécanisme de glisser PRE-3 (responder React Native) est conservé, sans `List` native
**And** l'alternative accessible produit le même déplacement : actions VoiceOver `Monter la série {n}` et `Descendre la série {n}` de chaque ligne, libellés existants du lexique (`src/shared/i18n/index.ts:43-44`), conservés (FR-10-07, FR-22-09).

**AC9 — Retrait par la croix et annulation (FR-12-05, H5 confirmée par Q29, AD-15).**
**Given** N = 4, aucune surface ouverte et aucune Cellule active
**When** Hermann touche la croix de la ligne 2
**Then** la ligne est supprimée immédiatement, sans confirmation, avec sa Pause ; les lignes suivantes sont renumérotées
**And** le message discret « Série supprimée — Annuler » s'affiche par le message existant de la Feuille, sans écran ni durée nouveaux
**And** `Annuler` restaure la ligne en position 2 avec sa Cible et sa Pause, jusqu'à la modification suivante du Brouillon de la Feuille ou la fermeture de la Feuille ; toute modification du Brouillon l'invalide (Cible, Pause, N, Mode, Régime, Bip, Pause commune, réordonnancement, autre retrait), seules l'ouverture et la fermeture d'un popover ou du Sélecteur sans application ne l'invalident pas (Q29 ; 3.2 AC10)
**And** la croix est indisponible à N = 1
**And** tant qu'un champ hors tableau est ouvert ou qu'une Cellule est active, l'appui qui le range ne déclenche jamais la croix ; il active dans le même geste une cible inoffensive (autre valeur, autre cellule, ligne d'un popover, chevron) (FR-10-04, FR-03-05 ; AD-15, T13, T20, T21, T23)
**And** tant qu'un Sélecteur ou un popover est ouvert, la primitive native absorbe l'appui : la surface se ferme sans appliquer et rien n'est activé par ce geste, ni la croix, ni une cellule, ni une autre valeur (FR-22-11, FR-03-10 ; AD-15, T7, T10). *Pour un Sélecteur, depuis Q37 : le voile de `WheelPickerOverlay` absorbe l'appui sans fermer la roue ; rien n'est activé. Depuis Q41 (cohérence), le panneau sans flèche se ferme sans appliquer à l'appui extérieur, et rien n'est activé par ce geste*
**And** **Given** une ligne retirée, puis la Cible d'une autre ligne touchée et son Sélecteur fermé par ✕ (Cellule active conservée, T6) **When** Hermann touche `Annuler` **Then** la ligne retirée est restaurée à sa position et la Cellule active le reste : `Annuler` ne range pas l'outil, et la restauration n'invalide rien (Q29 ; AD-15, T27).

**AC10 — Affichage de N (FR-12-06, H22).**
**Given** la ligne `Séries`
**When** N vaut 1 puis 3
**Then** elle affiche `1 série` puis `3 séries`, textes du lexique (repris des captures `8328:37760`, `8328:38632`, validés par Hermann à la recette).

**AC11 — Bip commun hors tableau (FR-10-08, P22).**
**Given** `variables`
**When** le tableau est affiché
**Then** aucune ligne ne porte de Bip ; le `Bip de cadence` reste au premier niveau, à la place définie par FR-03-02.

**AC12 — Absence d'état partiel (FR-09-06).**
**Given** une saisie refusée (+ indisponible), une Cible manquante ou un retrait annulé
**When** Hermann ferme la Feuille par ✕ ou la valide par ✓
**Then** l'Éditeur reste dans son état complet antérieur (✕) ou reçoit d'un bloc un état valide (✓) ; les bornes de Cible ne modifient ni les bornes des Pauses ni celles de la Durée totale.

**AC13 — Cibles tactiles et accessibilité des cellules (FR-10-02, FR-22-09 lecture, P30).**
**Given** la poignée dessinée 12 × 18 et les cellules dessinées 76 × 24
**When** Hermann les touche ou les parcourt avec VoiceOver
**Then** chacune a une cible d'au moins 44 × 44 pt sans agrandir le dessin
**And** la Cellule active est identifiée par sa ligne et sa colonne (`Série i · Durée`), pas seulement par la couleur, et la mention du Pied est annoncée.

**Preuves attendues :**
- Relevé visuel préalable des frames et maîtres cités.
- Tests : `stepTarget` (cas d'AC5 ; `UNSET` : + → 5 s ou 1, − `unavailable` ; `FAILURE` : `unavailable`), `steppedValue` corrigé, politiques de maintien des Cibles Durée et Répétitions ; réducteur d'interface d'AD-15 : un test par transition T1 à T27 (la table complète, y compris les lignes déjà testées en 3.3, 3.4 et 3.7), dont la séquence de R-3.6-08 (T1, T3, T6, T12, T11, T13), la séquence S4 (T16, T22, T21), `Annuler` avec une Cellule active (T27), la règle « Ligne disparue » et le rappel tardif ignoré (T8) ; Feuille : une seule Cellule active, aucune Cellule active à l'ouverture, Pied sans Cellule active (± indisponibles, sans mention), Sélecteur depuis la cellule (ouverture sur `UNSET`), Pied commun, ± indisponibles sur l'échec, fond `#FFF1F0` sans contour ni message (Q35), glisser et actions accessibles, croix inactive sous surface ouverte, « Série supprimée — Annuler » ; garde-fous zéro `ScrollView` inchangés.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22, après `R-3.1-00`) :
  - `R-3.6-01` — Durée, `variables`, N = 3. Gestes : toucher la Cible de la ligne 3, choisir l'échec, ✓ ; toucher la Cible de la ligne 1, ± du Pied. Attendu : `à l’échec` en ligne 3, pas de 1 s en ligne 1 (Q36), ± indisponibles sur la ligne 3 (FR-10-03, FR-10-04, Q13). Visuel : `8328:38632`, `8328:38848`, `8470:13303`.
  - `R-3.6-02` — Répétitions, `variables`. Gestes : régler 10, 12, échec. Attendu : `10 rép.`, `12 rép.`, `à l’échec` (FR-10-01). Visuel : `8328:38741`.
  - `R-3.6-03` — Gestes : glisser la ligne 3 en tête ; avec VoiceOver, monter une ligne. Attendu : FR-10-07, FR-12-03. Visuel : `8328:39279`.
  - `R-3.6-04` — Gestes : croix de la ligne 2, `Annuler` ; croix, ouvrir puis fermer par ✕ le Sélecteur d'une autre ligne, `Annuler` ; croix, puis changer une Pause. Attendu : restauration ; `Annuler` toujours disponible après l'ouverture et la fermeture sans application, et la cellule de l'autre ligne toujours active après `Annuler` ; `Annuler` invalidé après la Pause (FR-12-05, Q29 ; AD-15 T6, T27).
  - `R-3.6-05` — Exercice ancien à Cible 7 s et 5999 s. Gestes : ± du Pied. Attendu : AC5 (Q21, P38).
  - `R-3.6-06` — Gestes : N à 1 puis 99 ; réduire, augmenter, restaurer ; déplacer la dernière Série puis changer la dernière ligne. Attendu : FR-12-01 à FR-12-04, FR-12-06.
  - `R-3.6-07` — Cible `—` après changement de Mode, tableau replié. Attendu : fond `#FFF1F0`, sans contour (Q35), ✓ indisponible, aucun message (FR-10-06, FR-04-02). Visuel : `8328:39181`.
  - `R-3.6-08` — Préconditions : Durée, `variables`, N = 3, une ligne à Cible `—`. Gestes : ouvrir la Feuille sans toucher le tableau, observer le Pied ; toucher la cellule `—`, ✕ ; toucher −, puis + ; toucher hors du tableau. Attendu fonctionnel : à l'ouverture, aucune Cellule active, Pied affiché sans mention, ± indisponibles ; Sélecteur ouvert sur 00:05 puis `—` conservé après ✕ ; − indisponible, + donne 5 s et retire le fond `#FFF1F0` (Q35) ; après l'appui extérieur, ± de nouveau indisponibles (Q25, Q26 ; transitions AD-15 T1, T3, T6, T12, T11, T13). Attendu visuel : `8328:38632` pour le Pied avec Cellule active ; état sans Cellule active sans frame propre (`NON VÉRIFIABLE`).
  - `R-3.6-09` — Préconditions : Durée, `variables`, N = 3, Cibles 30 s, 45 s, 60 s. Gestes : toucher la valeur de N ; − ; toucher la cellule de Cible de la ligne 2. Attendu fonctionnel : après −, deux lignes et le champ de N toujours ouvert ; au toucher de la cellule, champ de N fermé, cellule de la ligne 2 active et Sélecteur ouvert sur 00:45, d'un seul geste (FR-03-05, FR-10-05, FR-12-02 ; AD-15 T16, T22, T21). Attendu visuel : `8328:38632` ; transition sans frame (`NON VÉRIFIABLE`).
- Rappel NFR-04.

**Hors story :** la Durée totale (3.7) ; le comportement sous N hérité (FR-12-07, P42, hors recette).

---

### Story 3.7 : Ligne Durée totale et Inversion dans la Feuille

En tant que Hermann (utilisateur de KODJO),
je veux lire dans la Feuille une ligne Durée totale dont la forme suit le Mode, le Régime, le Bip et les Cibles, et, quand la règle le permet, choisir une Durée totale par sa propre roulette pour obtenir N,
afin de savoir ce que durera l'Exercice, ou au moins combien il durera au minimum, sans jamais lire un total faux.

**Exigences :** FR-03-11 (roulette de Durée totale), FR-07-05 (double validation pour le total), FR-07-07, FR-14-01, FR-14-04, FR-14-05 ; FR-14-02 et FR-14-03 (domaine livré par 2.1, vérifiés ici à l'interface) ; NFR-04, NFR-06, NFR-08 ; Q12, P24, H8, H10, H18.
**Architecture :** AD-5 (nature et disponibilité de l'Inversion lues dans `executionCalculations.ts` ; formateur unique `durationFormat.ts`), AD-7 (roulette de Durée totale dans un panneau sans flèche sous le champ, Q41 — *historique : « dans un popover », puis couche `WheelPickerOverlay` (Q37)* —, bornes inchangées, aucune option échec), AD-15 (`selector(total)` ; transitions T24 à T26, avec T7, T8 et T10), AD-2 (Inversion par une transition du Brouillon), AD-11. Fichiers principalement touchés (indicatif) : `src/features/activities/ExecutionParametersSheet.tsx`, `src/shared/i18n/`.
**Références visuelles :** frames Figma `8328:38084` (roulette de Durée totale ; maître `5544:5118`), `8328:38409` (message d'ajustement), `8470:13303` (cas mixte en lecture seule) — visuel seulement, D-255.
**Dépend de :** 3.4, 2.1.
**Hypothèses non validées :** H8, H10, H18 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Forme de la ligne selon le cas (FR-14-01, P24).**
**Given** le Brouillon de la Feuille
**When** il est dans l'un des cas suivants
**Then** la ligne `Durée totale` est :
- Durée, `identiques`, Cible numérique, N libre → modifiable par roulette ;
- Durée en `variables` à Cibles toutes numériques, ou Répétitions avec Bip et Cibles toutes numériques → lecture seule (`≈` en Répétitions) ;
- mélange calculable → lecture seule, montant précédé de `≥` : Cibles 30 s / 45 s / à l'échec, Pauses 10 / 20 / 30 s → `≥ 2 min 15 s` ;
- Répétitions sans Bip, ou toutes les Cibles à l'échec, ou `identiques` avec la Cible à l'échec → **aucune ligne** ;
**And** aucune nouvelle composante d'interface n'est créée pour l'interdiction de l'Inversion.

**AC2 — Recalcul et Cible incomplète (FR-14-01, H10, FR-06-02).**
**Given** la ligne affichée
**When** une Cible, une Pause, N, les côtés, le Bip ou le Mode changent dans le Brouillon
**Then** la ligne se recalcule aussitôt
**And** tant qu'une Cible est `UNSET`, aucune ligne ni montant n'apparaît et ✓ est indisponible ; aucun montant n'est inventé (H10, NFR-06)
**And** le retrait de la ligne raccourcit la Feuille, le `Bip de cadence` passant juste avant `Compte à rebours` (FR-03-02).

**AC3 — Restriction de l'Inversion à l'interface (FR-14-02).**
**Given** une Cible à l'échec (en `identiques` ou en `variables`), ou le Régime `variables`, ou le Mode Répétitions
**When** Hermann touche la ligne Durée totale (si elle existe)
**Then** aucune roulette ne s'ouvre ; la valeur est en lecture seule.

**AC4 — Roulette de Durée totale distincte (FR-07-07, FR-03-11, Q12, AD-7).**
**Given** Durée, `identiques`, d = 30 s, p = 10 s, unilatéral
**When** Hermann touche la ligne Durée totale
**Then** une roulette s'ouvre, sur iOS, dans un panneau sans flèche juste sous le champ Durée totale, cadre aligné à droite, au-dessus du contenu, sans `Modal`, sans animation saccadée ni animation de hauteur, avec ses propres ✕ / ✓ ; un toucher hors du panneau la ferme sans appliquer ; si le panneau dépasse le bas du contenu, une réserve vide est ajoutée sous le groupe (et le corps défile jusqu'au bas si la Feuille est à sa hauteur maximale), sans déplacer de ligne ; sans option échec et distincte du Sélecteur de cible (Q41, AD-7) ; Android et web : roulette en ligne dans le cadre de sélection de la ligne ; *historique : « dans un popover ancré sous la ligne […] ; sur iOS, la roue est placée dans `Popover.Content` par la voie consignée en 3.1 AC7 », puis Q37 « dans la couche `WheelPickerOverlay`, centrée horizontalement, sans flèche, sur voile, fermée par ✕ / ✓ seulement »*
**And** ses bornes vont de T(1) = `40 s` à T(99) = 3 960 s = `66 min`, à la seconde, la colonne des minutes allant jusqu'à T(99) sans colonne ni contrôle supplémentaire (FR-14-03, H8)
**And** ✕ restaure la valeur d'avant ouverture ; ✓ applique au Brouillon de la Feuille, puis ✓ de la Feuille applique à l'Éditeur.

**AC5 — Inversion exacte, sans message (FR-14-03).**
**Given** l'Exercice d'AC4
**When** Hermann choisit Tv = 160 s puis ✓
**Then** N = 4, T(4) = 160 s, aucun message ; la Cible reste 30 s.

**AC6 — Ajustement signalé et annulable (FR-14-04).**
**Given** l'Exercice d'AC4
**When** Hermann choisit Tv = 180 s puis ✓
**Then** N = 5 (égalité 160 s / 200 s tranchée vers le plus grand N), la ligne réaffiche `3 min 20 s`
**And** le message littéral `Durée ajustée à 3 min 20 s pour respecter un nombre entier de séries.` s'affiche avec `Annuler`
**And** `Annuler` restaure N et la Durée totale d'avant l'ajustement ; toucher le reste du message le ferme sans annuler
**And** `Annuler` est présenté en capsule sans contour, blanc transparent à 90 %, demi-cercles, marges droite, haut et bas égales (rendu à valider sur appareil).

**AC7 — Accessibilité du total (FR-14-05).**
**Given** VoiceOver activé
**When** Hermann atteint la ligne Durée totale
**Then** `≈` est annoncé « estimation », `≥` « total prévisionnel partiel », et le caractère non modifiable d'un total en lecture seule est annoncé
**And** une valeur en lecture seule est annoncée avec sa valeur, jamais par un tiret, et l'état n'est jamais transmis par le gris seul ; les textes sont des clés du lexique.

**AC8 — Formatage unique (AD-5, H8).**
**Given** tout montant affiché par la ligne
**When** il est rendu
**Then** il passe par le formateur unique de `durationFormat.ts` (ex. `2 min 15 s`, `66 min`) ; la Feuille ne formate aucune durée elle-même.

**Preuves attendues :**
- Relevé visuel préalable de `8328:38084`, `8328:38409`, `8470:13303`, maître `5544:5118`.
- Tests : forme de la ligne pour chaque cas d'AC1 (montants recalculés par formule dans le test, jamais par `executionCalculations`) ; roulette ✕ / ✓ ; Inversion 160 s et 180 s ; message et `Annuler` ; absence de roulette sur échec, `variables`, Répétitions ; garde-fous zéro `ScrollView` inchangés.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22, après `R-3.1-00`) :
  - `R-3.7-01` — Durée, `identiques`, 30 s, Pause 10 s. Gestes : ouvrir la roulette du total, choisir 3 min (180 s), ✓ ; `Annuler`. Attendu : N = 5, message littéral, restauration (FR-14-03, FR-14-04). Visuel : `8328:38084`, `8328:38409`.
  - `R-3.7-02` — `variables`, 30 s / 45 s / à l'échec, Pauses 10 / 20 / 30 s. Attendu : `≥ 2 min 15 s` en lecture seule, aucune roulette (FR-14-01, FR-14-02). Visuel : `8470:13303`.
  - `R-3.7-03` — Répétitions sans Bip ; puis tout à l'échec. Attendu : aucune ligne Durée totale, Bip juste avant `Compte à rebours` (P24).
  - `R-3.7-04` — VoiceOver sur `≈` et `≥`. Attendu : AC7.
- Rappel NFR-04.

**Hors story :** le calcul des natures et de l'Inversion (2.1) ; la Durée totale sur les cartes (2.4) ; la Phrase des paramètres (2.3) ; le total sous N hérité (compatibilité seulement, FR-12-07).

---

### Story 3.8 : Accessibilité et recette de la Feuille

En tant que Hermann (utilisateur de KODJO),
je veux une Feuille entièrement utilisable avec VoiceOver, sans action extérieure déclenchable pendant qu'une roulette est ouverte, qui maintient les décisions de recette PRE-3 non supersédées, et une liste complète de scénarios de recette,
afin de valider sur mon iPhone toute la Feuille Paramètres d'exécution, état par état.

**Exigences :** FR-03-13, FR-22-08, FR-22-11 (Feuille), FR-03-01 (focus), FR-22-05 et FR-22-06 (vérification sur la Feuille seulement) ; NFR-04, NFR-08, NFR-09, NFR-10 ; H13, H23, D-143.
**Architecture :** AD-7, AD-11, AD-15. Fichiers principalement touchés (indicatif) : `src/features/activities/ExecutionParametersSheet.tsx` (libellés et traits d'accessibilité), `src/shared/i18n/`, tests de la Feuille, `docs/preparation/PRE-4/bmad/recette-iphone.md` (scénarios de la Feuille).
**Références visuelles :** frames Figma `8328:36923`, `8328:37092`, `8328:37760`, `8328:37862`, `8328:37972`, `8328:38084`, `8328:38193`, `8328:38301`, `8328:38409`, `8328:38513`, `8328:38632`, `8328:38741`, `8328:38848`, `8470:13303`, `8328:38953`, `8328:39072`, `8328:39181`, `8328:39279`, `8328:39390` — visuel seulement, D-255.
**Dépend de :** 3.3, 3.4, 3.5, 3.6, 3.7.
**Hypothèses non validées :** H13, H23 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Focus et en-tête (FR-22-08, FR-03-01).**
**Given** VoiceOver activé et la Feuille ouverte
**When** Hermann la parcourt
**Then** le focus reste confiné dans la Feuille ; ✕ et ✓ ont un libellé accessible ; à la fermeture, le focus revient à la Carte Paramètres d'exécution
**And** le Régime `variables` est annoncé.

**AC2 — Valeurs, Cellule active et Bip (FR-22-08).**
**Given** VoiceOver activé
**When** Hermann atteint une valeur en lecture seule, la Cellule active et le `Bip de cadence`
**Then** une valeur en lecture seule est annoncée avec sa valeur et son origine, jamais un tiret
**And** la Cellule active est annoncée par sa ligne et sa colonne (`Série i · Durée`)
**And** `Bip de cadence` a ce nom accessible, la valeur `Aucun` ou l'intervalle en secondes, et ses actions augmenter, diminuer et limites sont annoncées
**And** chaque ligne du Tableau des séries variables expose les actions `Monter la série {n}` et `Descendre la série {n}` (3.6 AC8), et la poignée son libellé existant `Déplacer la série {n}` ; ces libellés sont ceux que 4.6 AC8 vérifie.

**AC3 — Totaux, échec et côtés (FR-22-08, D-143).**
**Given** VoiceOver activé
**When** Hermann atteint la Durée totale, une option échec, une Cible à l'échec et le Changement de côté
**Then** `≈` est annoncé comme estimation, `≥` comme total prévisionnel partiel, et le total comme non modifiable
**And** `Aucune durée, à l’échec` et `Aucune répétition, à l’échec` sont annoncées sélectionnées ou non ; une Cible à l'échec est annoncée ; le grisé n'est jamais le seul indicateur
**And** la valeur et l'unité de la Cible sont annoncées dans le Sélecteur
**And** les directions du Changement de côté sont annoncées en toutes lettres.

**AC4 — Textes du lexique (FR-22-08, H23, NFR-08).**
**Given** toutes les annonces de la Feuille
**When** le code est relu
**Then** chaque texte d'annonce est une clé de `src/shared/i18n/`, avec le vocabulaire du glossaire et l'apostrophe `’` ; aucun texte en dur ; les textes sont listés pour validation par Hermann.

**AC5 — Surface ouverte et actions extérieures (FR-22-11, AD-15).**
**Given** une roulette ouverte (Sélecteur de cible ou Durée totale) dans la Feuille
**When** Hermann, au doigt ou par VoiceOver, tente d'activer `Terminer`, la croix d'une ligne, ✓ de la Feuille ou une autre ligne
**Then** aucune action extérieure n'est déclenchée : l'Éditeur est inerte sous la Feuille, et dans la Feuille l'appui extérieur ferme la roulette sans appliquer ni déclencher de commande destructive. *Depuis Q37 : l'appui sur le voile de `WheelPickerOverlay` ne ferme pas la roulette et ne déclenche rien ; seuls ✕ et ✓ la ferment. Depuis Q41 (roue de Durée commune et roue de Durée totale, iOS) : l'appui hors du panneau sans flèche le ferme sans appliquer ni déclencher la commande touchée.*

**AC6 — Décisions de recette PRE-3 maintenues (FR-03-13).**
**Given** la table de FR-03-13
**When** l'agent vérifie chaque règle PRE-3 non supersédée
**Then** chacune est couverte par un test existant ou ajouté, rattaché à l'exigence PRE-4 citée (FR-03-01, FR-11-01, FR-04-03, FR-04-04, FR-12-01 à FR-12-04, FR-11-03, FR-11-04, FR-04-02, FR-03-02, FR-03-05, FR-09-04, NFR-03)
**And** seules les règles PRE-3 supersédées listées par FR-03-13 (steppers en place et permanents, message nommant la Série, Mode à trois valeurs, Cible Durée 1..5999 s, retraits x52 du tableau, segmentés intégrés, présentations D-339 et D-341) sont absentes de l'interface.

**AC7 — Texte agrandi et largeurs, Feuille seule (FR-22-05, FR-22-06).**
**Given** le texte du système à 100 %, 135 % et ≈ 200 %, et les largeurs 360, 402 et 440
**When** la Feuille est affichée dans ses états de référence
**Then** l'en-tête reste accessible, aucune hauteur fixe ne rogne un texte ni les ±, aucun chevauchement ni débordement horizontal, aucune action essentielle masquée ; aucun `maxFontSizeMultiplier` ni `allowFontScaling` à faux.

**AC8 — Scénarios de recette de la Feuille (NFR-04, Q5).**
**Given** les scénarios `R-3.1-xx` à `R-3.7-xx`
**When** l'agent rédige la section Feuille de `docs/preparation/PRE-4/bmad/recette-iphone.md`
**Then** il les consolide au format du §3 (ID, ED et story, préconditions, gestes, attendu fonctionnel sourcé, attendu visuel par frame, résultat vide), avec au moins un scénario par popover et par roulette (Mode, Côté, Ordre, Régime, Sélecteur Durée et Répétitions, Durée totale), le grisé manipulable, le tableau et son Pied commun, et VoiceOver et texte agrandi
**And** il ajoute les états exigés sans frame qui touchent la Feuille : validation incomplète (fond `#FFF1F0`, Q35), douze Séries avec défilement, Répétitions avec option échec ; leur attendu visuel est « jugement de Hermann »
**And** aucun résultat n'est prérempli ; la colonne Résultat reste vide jusqu'à la recette par Hermann.

**AC9 — Apparitions et disparitions fluides, sans fondu (NFR-10, Q39, Q40, Q41).**
**Given** la Feuille ouverte, « Réduire les animations » désactivé
**When** une ligne, un sélecteur en ligne, une roulette en ligne, le tableau des séries variables ou l'une de ses lignes, ou le message d'ajustement apparaît ou disparaît (N 1 ↔ 2 ↔ 3, Séries variables, bilatéral, Mode, ouverture et fermeture d'un sélecteur)
**Then** aucune opacité n'est animée : l'élément monte de bas en haut, révélé par un cadre de découpe (`overflow: hidden`) dont la limite basse est la barre horizontale située sous lui — il sort de sous cette barre vers le haut — et disparaît en redescendant sous la même barre ; les lignes voisines, le groupe et la feuille glissent vers leur nouvelle place pendant ce même temps, sans saut ni fondu (même durée, même courbe) ; durée unique de 350 ms, sur le fil UI, sans animation exécutée sur le fil JavaScript (Q40, Q41 ; *historique Q40 : « entre par le bas en fondu simultané et sort vers le bas en fondu simultané »*)
**And** un simple changement de sélection ne joue aucune transition de place ; les panneaux sans flèche apparaissent et disparaissent sans fondu ni mouvement (Q41)
**And** le comportement D-4 du sélecteur est conservé, cadre porté à 350 ms (valeur choisie visible 350 ms, puis repli ; Q40)
**And** avec « Réduire les animations », le changement est immédiat, sans animation
**And** la montée de la Feuille, les fondus des `Modal`, le popover natif du Mode, les roulettes, le `SegmentedControl` et le glisser des lignes du tableau sont inchangés — source : Q39 (décision de Hermann du 2026-10-17, écart E-13), Q41 (écart E-15).

**Preuves attendues :**
- Tests `PRE4-Q39` (AC9) : conteneurs porteurs des animations de mise en page `entering` / `exiting` / `layout` ; aucune avec « Réduire les animations » ; `onClosed` du sélecteur toujours appelé. La fluidité elle-même se juge sur l'iPhone (NFR-04).
- Tests `PRE4-Q40` (AC9, 3.3 AC7, 3.6 AC1) : durées 350 ms ; entrée et sortie par le bas ; ligne sélectionnée sans contour ; groupe « Séries variables » sélectionné à l'ouverture du tableau et après une action dedans, à l'état normal après sélection d'un champ hors tableau. Vitesse, sens et simultanéité se jugent sur l'iPhone (NFR-04).
- Tests `PRE4-Q41` (AC9, AC5, 3.1 AC4 et AC6, 3.3 AC4, AC5 et AC7, 3.4 AC1, 3.7 AC4), dans `ExecutionParametersSheet.test.tsx` et `AnchoredPanel.test.tsx` : aucune opacité animée ; révélation par le bas (cadre `overflow: hidden` de 0 à sa hauteur, contenu qui monte de sa hauteur) ; cadre de sélection englobant ; styles de ligne identiques sélectionnée ou non ; panneaux Côté, Ordre et roues sous le champ, alignés à droite, sans flèche, sans `Popover` ni `Modal` supplémentaire ; choix et ✓ appliquent, ✕ et toucher extérieur ferment sans appliquer. L'absence de fondu, la position et le toucher se jugent sur l'iPhone (NFR-04).
- Tests : libellés, rôles, états et actions d'accessibilité de chaque contrôle ; inertie hors surface ouverte ; couverture de la table FR-03-13 ; garde-fous zéro `ScrollView` (`DurationWheelPicker.test.tsx:378`, `:619`, `NumberWheelPicker.test.tsx:267`) inchangés.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22, après `R-3.1-00`) :
  - `R-3.8-01` — VoiceOver, création. Gestes : parcourir toute la Feuille, ouvrir chaque popover et chaque roulette. Attendu : AC1 à AC3 (FR-22-08).
  - `R-3.8-02` — Sélecteur ouvert. Gestes : tenter `Terminer`, une croix, ✓ de la Feuille. Attendu : rien ne se déclenche (FR-22-11).
  - `R-3.8-03` — Texte à ≈ 200 %, largeur 360. Gestes : parcourir la Feuille en `variables` à douze Séries. Attendu : AC7 (FR-22-05, FR-22-06).
  - La liste consolidée d'AC8.
- Rappel NFR-04 : la recette de Hermann est la seule preuve visuelle et tactile.

**Hors story :** l'accessibilité de l'écran principal de l'Éditeur et des référentiels (4.6) ; la recette finale de l'Éditeur (4.6) ; toute correction visuelle découverte en recette, traitée par une story de correction après arbitrage de Hermann.

---

#### Couverture E3

| FR | Story / AC |
|---|---|
| FR-03-01 | 3.3 AC1 ; 3.8 AC1 |
| FR-03-02 | 3.3 AC1, AC2 ; 3.7 AC2 |
| FR-03-03 | 3.3 AC10, AC6 ; 3.2 AC11 |
| FR-03-04 | 3.2 AC2 ; 3.3 AC9 |
| FR-03-05 | 3.3 AC8 ; 3.6 AC2, AC9 |
| FR-03-06 | 3.3 AC3 |
| FR-03-07 | 3.3 AC4 |
| FR-03-08 | 3.3 AC5 |
| FR-03-09 | 3.3 AC6 |
| FR-03-10 | 3.1 AC2, AC3 ; 3.3 AC7 |
| FR-03-11 | 3.1 AC4, AC7 ; 3.4 AC1 ; 3.7 AC4 |
| FR-03-12 | 3.6 AC4, AC8 |
| FR-03-13 | 3.8 AC6 |
| FR-04-01 | 3.3 AC2, AC6 ; 3.2 AC6 |
| FR-04-02 | 3.3 AC6 ; 3.6 AC7 |
| FR-04-03 | 3.2 AC5 |
| FR-04-04 | 3.2 AC5 |
| FR-04-05 | 3.2 AC6 |
| FR-05-01 | 3.3 AC3 |
| FR-05-02 | 3.2 AC2 ; 3.3 AC3 |
| FR-05-03 | 3.2 AC3, AC13 |
| FR-05-04 | 3.3 AC2 |
| FR-06-01 | 3.2 AC1 |
| FR-06-02 (interface) | 3.4 AC10 ; 3.6 AC7 ; 3.7 AC2 |
| FR-06-03 | 3.2 AC1 |
| FR-06-04 | 3.2 AC13 |
| FR-06-05 | 3.4 AC10 ; 3.6 AC1 |
| FR-07-01 | 3.4 AC1 ; 3.5 AC1 ; 3.6 AC3 |
| FR-07-02 | 3.4 AC2 |
| FR-07-03 | 3.5 AC2, AC3 |
| FR-07-04 | 3.4 AC3, AC4 ; 3.5 AC4 |
| FR-07-05 | 3.4 AC8 ; 3.5 AC6 ; 3.7 AC4 |
| FR-07-06 | 3.4 AC6 |
| FR-07-07 | 3.7 AC4 |
| FR-07-08 | 3.4 AC11 ; 3.5 AC7 |
| FR-08-01 | 3.4 AC5 |
| FR-08-02 | 3.4 AC6 |
| FR-08-03 | 3.5 AC3 |
| FR-08-04 | 3.4 AC7 |
| FR-08-05 | 3.4 AC9 |
| FR-08-06 | 3.4 AC10 |
| FR-09-04 (interface) | 3.3 AC8 ; 3.6 AC4, AC6 |
| FR-09-06 (interface) | 3.2 AC11 ; 3.6 AC12 |
| FR-10-01 | 3.6 AC1 |
| FR-10-02 | 3.6 AC2, AC13 |
| FR-10-03 | 3.6 AC3 |
| FR-10-04 | 3.6 AC4, AC9 |
| FR-10-05 | 3.3 AC8 ; 3.6 AC2 |
| FR-10-06 | 3.6 AC7 |
| FR-10-07 | 3.6 AC8 |
| FR-10-08 | 3.6 AC11 |
| FR-11-01 | 3.2 AC11 |
| FR-11-02 | 3.2 AC5, AC11 |
| FR-11-03 | 3.2 AC3 |
| FR-11-04 | 3.2 AC4 |
| FR-11-05 | 3.2 AC2 ; 3.3 AC9 |
| FR-11-06 | 3.2 AC14 |
| FR-12-01 | 3.2 AC7 |
| FR-12-02 | 3.2 AC7 ; 3.6 AC2 (− de N, champ de N ouvert) |
| FR-12-03 | 3.2 AC8 ; 3.6 AC8 |
| FR-12-04 | 3.2 AC9 ; 3.3 AC5, AC6 |
| FR-12-05 | 3.2 AC10 ; 3.6 AC9 |
| FR-12-06 | 3.6 AC10 (et recette `R-3.6-06`) |
| FR-12-07 | 3.2 AC14 |
| FR-14-01 | 3.7 AC1, AC2 |
| FR-14-04 | 3.7 AC6 |
| FR-14-05 | 3.7 AC7 |
| FR-22-08 (Feuille) | 3.8 AC1 à AC4 |
| FR-22-11 (Feuille) | 3.8 AC5 |

Vérifiés à l'interface sans être attribués à E3 : FR-14-02 et FR-14-03 (3.7 AC3 à AC6, domaine en 2.1) ; FR-09-01, FR-09-02, FR-09-03, FR-09-05 (3.3 AC8, 3.4 AC4 et AC10, 3.5 AC4 et AC5, 3.6 AC5, domaine en 1.1) ; FR-22-05, FR-22-06 sur la Feuille (3.8 AC7, attribution E4).

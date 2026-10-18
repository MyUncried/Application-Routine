## Epic 4 : Un Éditeur d'Exercice fini, fidèle et accessible

**Objectif.** Les quatre Parcours d'édition (créer au Catalogue, modifier au Catalogue, créer dans une Séance, modifier une Copie en Séance) passent par le même Éditeur d'Exercice et la même Feuille Paramètres d'exécution. L'écran principal suit ses références visuelles bloc par bloc, à partir d'un relevé consigné avant le développement (FR-02-13). Catégorie et Zones corporelles se gèrent depuis l'Éditeur sans perdre le Brouillon ni le clavier. Les Médias sont ajoutés, ordonnés et relus sans perte, et se consultent dans l'Éditeur par le lecteur natif : vidéo lue à la demande en plein écran, photo en plein écran (Q27). L'ensemble est accessible : VoiceOver, texte agrandi, largeurs 360, 402 et 440, alternatives aux gestes, cibles d'au moins 44 × 44 pt. La recette sur iPhone par Hermann, sur la liste de scénarios produite en 4.6, clôt l'epic (Q5).

**FR couvertes :** FR-01-01 à FR-01-10 ; FR-02-01 à FR-02-13 ; FR-20-01 à FR-20-11 ; FR-21-01 à FR-21-05 ; FR-22-01 à FR-22-07, FR-22-09, FR-22-10, FR-22-12.
**Architecture :** AD-7, AD-9, AD-11, AD-17 (et AD-13, AD-15 en lecture). S'appuie sur E1 à E3.

*Révision après la revue ChatGPT du 2026-10-16 (R3, Q27) : story 4.5 « Consulter un Média dans l'Éditeur (lecteur natif) » ajoutée ; l'ancienne story 4.5 devient 4.6, et ses scénarios `R-4.5-xx` deviennent `R-4.6-xx`.*

*Révision après la porte post-revue du 2026-10-16 (M2, M3, Q31) : toucher la tuile consulte le Média, le menu Retirer / Monter / Descendre passe à l'appui long (menu contextuel natif, D-335 amendée), actions VoiceOver conservées (4.4 AC3, 4.5 AC2, AC3, AC7 à AC9, `R-4.5-05`, R-41, R-51, R-52) ; ce changement de geste du menu natif des Médias est prescrit par Q31 (NFR-03). H22 précisée : invite de la seule Carte vide, avant tout Mode (4.2 AC6).*

*Révision du 2026-10-17 (recette iPhone) : Q35 (Cible à renseigner signalée par un fond `#FFF1F0`, sans liseré ni contour, reporté dans le texte des états sans frame de 4.6 et des scénarios R-18 et R-25) ; Q36 (Cible Durée à la seconde, bornes 5..3535 inchangées, plus de multiple de 5) : scénarios R-20, R-24, R-25 et R-36 corrigés.*

**Conventions de l'epic.**
- Parcours : **CC** = créer au Catalogue ; **MC** = modifier au Catalogue ; **CS** = créer dans une Séance ; **MS** = modifier une Copie en Séance.
- Littéraux : les textes d'interface sont écrits avec l'apostrophe typographique `’` (U+2019), comme dans le lexique et le Corpus 276 (NFR-08).
- **Rappel commun à toutes les stories d'interface de l'epic** (cité « Rappels E4 » dans chaque story) :
  - **NFR-02** : quand une primitive native iOS existe pour l'interaction, elle est utilisée ; une difficulté de rendu se corrige autour d'elle, sans remplacer son mécanisme.
  - **NFR-03** : aucun mécanisme de primitive déjà acceptée n'est remplacé (roulettes natives et leurs garde-fous zéro `ScrollView` iOS, glisser des lignes, menus natifs des Médias) ; un contrôle PRE-3 n'est changé que si une ED ou une décision Q le prescrit.
  - **NFR-04** : une suite de tests verte ne prouve ni le rendu ni le comportement tactile ; tests, comparaisons de captures et perception sur appareil sont consignés séparément ; la validation visuelle et tactile appartient à Hermann.
  - **NFR-09** : cibles d'au moins 44 × 44 pt, libellés VoiceOver, état non porté par la seule couleur, texte agrandi, largeurs 360, 402 et 440.
  - **NFR-14** : ordre de lecture des sources : ch. 07 → ch. 04, 09, 10 → ch. 11 → ch. 12 → ch. 06 → ch. 13 → Figma en dernier, pour le visuel seulement ; Q et P priment sur les sources qu'elles tranchent.
- **Méthode de relevé visuel** (utilisée par 4.2, 4.3 et 4.4). Avant toute modification de code, la story consigne dans un tableau, ajouté à sa section « Notes de développement », une ligne par élément visible et par état. Colonnes : frame et état ; élément (nom de nœud Figma et identifiant) ; composant maître et variante ; style ou variable Figma lié ; police (famille, style, taille, graisse, interligne) ; couleurs (texte, fond, icône) ; contour (couleur, épaisseur, rayon) ; ombre et effets ; espacements relatifs au bloc voisin ; jeton existant de `src/shared/ui/tokens.ts` retenu ; écart. Sources : les arbres des frames `docs/preparation/PRE-4/figma/<frame>.json.gz` (propriétés `fontName`, `fontSize`, `fontWeight`, `lineHeight`, `fills`, `strokes`, `strokeWeight`, `cornerRadius`, `effects`, marges d'auto-layout) et `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/preparation/PRE-4/figma/fermeture-maitres-et-variables.json.gz` (maîtres, `styles`, `variables`). Les nœuds masqués (`visible: false`) sont relevés comme masqués et ne sont pas rendus. La barre d'état dessinée est un décor système. Aucune coordonnée absolue n'est reprise. Un chiffre relevé n'est jamais une règle de comportement (NFR-01, D-255, D-300). Une valeur Figma différente d'un jeton est inscrite comme écart et signalée à Hermann ; elle n'est jamais corrigée en modifiant le jeton (verrouillé par `tokensSpecification.test.ts`) ni en codant la valeur en dur (AD-11). Une mention « conforme Figma » ne remplace pas ce tableau (FR-22-01).

---

### Story 4.1 : Quatre Parcours d'édition, Terminer et retour

En tant que Hermann (utilisateur de KODJO),
je veux ouvrir le même Éditeur d'Exercice depuis le Catalogue et depuis une Séance, en création comme en modification, et que `Terminer` agisse selon l'endroit d'où je viens,
afin que je retrouve toujours le même écran et que mes Définitions d'Exercice et mes Copies en Séance restent indépendantes.

**Exigences :** FR-01-01, FR-01-02, FR-01-03, FR-01-04, FR-01-05, FR-01-06, FR-01-07, FR-01-08, FR-01-09, FR-01-10 ; NFR-02, NFR-03, NFR-04, NFR-05, NFR-07, NFR-13, NFR-14 ; P8, P15, Q4, D-194 (écart signalé).
**Architecture :** AD-9 (clonage profond à l'ouverture, à la copie et à la réouverture), AD-13 (`validateForSave` appelé par `Terminer`), paradigme en couches. Fichiers principalement touchés (indicatif) : `src/features/sessions/ExerciseScreen.tsx`, `src/features/activities/ActivityEditorForm.tsx`, `src/features/sessions/CompositionScreen.tsx` (lecture et tests seulement, aucun changement d'enchaînement), `src/features/sessions/CatalogueScreen.tsx`, `src/domain/sessions/composition.ts`, tests d'intégration `*.integration.test.tsx`.
**Références visuelles :** `8328:35698` (Ajouter un exercice — Initial). Aucune frame « Modifier un exercice » parmi les 32 (`S/06…:1335`).
**Dépend de :** 1.3, 3.3.
**Critères d'acceptation :**

**AC1 — Créer au Catalogue (FR-01-01, Q33).**
**Given** le Catalogue ouvert sur le segment Exercices, avec un filtre et une position de défilement
**When** Hermann touche `Créer`
**Then** l'Éditeur d'Exercice s'ouvre directement en création, sans écran ni arbre intermédiaire, sans voile, sans liste d'options et sans `Annuler` intermédiaire
**And** sur les autres segments du Catalogue, `Créer` garde son comportement de départ : la liste d'options existante (`CatalogueCreateOptions`) est conservée sans modification (Q33)
**And** deux appuis rapprochés sur `Créer` n'ouvrent qu'un seul Éditeur
**And** aucune donnée n'est écrite : seul un Brouillon de l'Éditeur est initialisé
**And** au retour avant validation, le segment, les filtres et la position de défilement du Catalogue sont restitués ; après un `Terminer` réussi, l'écran affiché est Catalogues / Exercices.

**AC2 — Abandon d'une création au Catalogue (FR-01-01).**
**Given** l'Éditeur ouvert par `Créer`
**When** Hermann le quitte (sortie immédiate s'il n'a rien saisi, ou `Confirmer` dans le dialogue d'abandon de FR-02-12)
**Then** le Catalogue appelant est restauré et aucun Exercice n'est créé.

**AC3 — Modifier au Catalogue (FR-01-02).**
**Given** une Définition d'Exercice au Catalogue, avec nom, Catégorie, Zones, Paramètres d'exécution typés, description et deux Médias
**When** Hermann touche sa carte hors du bouton Lecture
**Then** l'Éditeur s'ouvre en modification et affiche ces données, Médias dans leur ordre
**And** le bouton Lecture reste désactivé, comme dans le code de départ ; son appui n'ouvre pas l'Éditeur. L'Exécution directe relève du moteur d'Exécution, hors périmètre (Q34).

**AC4 — Modifier une Copie en Séance (FR-01-03).**
**Given** Composition d'une Séance contenant une Copie en Séance
**When** Hermann fait un appui court sur la carte Exercice
**Then** l'Éditeur s'ouvre directement sur la Copie en Séance
**And** un appui long déclenche la réorganisation et n'ouvre pas l'Éditeur.

**AC5 — Créer dans une Séance, parcours PRE-3 conservé (FR-01-03, P8, Q4).**
**Given** Composition d'une Séance
**When** Hermann touche `Ajouter un exercice`
**Then** le choix `Un nouvel exercice` / `Un exercice existant` / `Annuler` s'affiche, inchangé
**And** `Un nouvel exercice` ouvre l'Éditeur en création, sans Exercice source ; `Terminer` place le nouvel Exercice dans le Brouillon de Composition, à la suite des Exercices affichés, sans l'ajouter au Catalogue
**And** `Un exercice existant` ouvre la sélection multiple du Catalogue
**And** aucun point d'entrée n'est ajouté ni retiré. L'écart avec D-194 (`S/07…:241`, `S/08…:202`, `S/06…:274,822`, qui disent cette création non exposée) reste signalé à Hermann ; la story ne le tranche pas.

**AC6 — Un seul Éditeur et une seule Feuille (FR-01-03, P8).**
**Given** chacun des parcours CC, MC, CS et MS
**When** l'Éditeur puis la Feuille sont ouverts
**Then** le même composant d'Éditeur (`ActivityEditorForm`) et la même Feuille (`ExecutionParametersSheet`) sont rendus ; un test d'intégration par parcours le vérifie.

**AC7 — Contexte d'ouverture explicite (FR-01-04).**
**Given** un même contenu affiché
**When** l'Éditeur est ouvert depuis le Catalogue, puis depuis Composition
**Then** il agit respectivement sur la Définition d'Exercice et sur la Copie en Séance ; le contexte est porté par le point d'entrée (paramètres de route), jamais déduit de l'apparence ni des données.

**AC8 — Terminer selon le contexte (FR-01-05, P8).**
**Given** un Brouillon de l'Éditeur valide
**When** Hermann touche `Terminer`
**Then** ouvert depuis le Catalogue (CC, MC), la Définition d'Exercice est créée ou mise à jour, puis le Catalogue restauré s'affiche (AC1)
**And** ouvert depuis Composition (CS, MS), seul le Brouillon de Composition est modifié, puis Composition s'affiche ; aucune écriture en base n'a lieu avant le `Continuer` de Composition
**And** aucune Exécution historisée n'est modifiée.

**AC9 — Copie isolée (FR-01-06, renvoi FR-19-01).**
**Given** une Définition d'Exercice et sa Copie en Séance
**When** Hermann modifie la Copie (MS), `Terminer`, puis `Continuer`
**Then** la Définition est inchangée ; inversement, modifier la Définition (MC) ne change pas la Copie
**And** une Copie en Séance n'apparaît jamais comme doublon dans le Catalogue ; un Exercice créé dans une Séance (CS) n'est pas ajouté au Catalogue
**And** l'isolation repose sur le clonage profond d'AD-9 livré en 1.3 : la story l'exerce par un test d'intégration d'interface, sans nouveau mécanisme.

**AC10 — Relecture à l'identique (FR-01-07).**
**Given** dans chacun des parcours CC, MC, CS et MS, un Exercice en Régime variables à Cibles mixtes (Durée 30 s, 45 s, à l'échec ; Pauses 10, 20, 30 s), bilatéral, Bip 2 s, Compte à rebours 10 s, Fin 5 s, avec description, Catégorie, deux Zones et deux Médias
**When** Hermann bascule de Mode puis revient, déplace une Série, passe à N = 1 puis remonte à 3, valide par ✓, `Terminer` (puis `Continuer` en Séance), ferme et rouvre
**Then** nom, Catégorie, Zones, description, Médias dans leur ordre et Paramètres d'exécution typés (Mode, Régime, Cibles numériques et à l'échec, Pauses, côtés, Bip, Compte à rebours, Fin) sont relus à l'identique
**And** la Définition et la Copie restent indépendantes.

**AC11 — Aucune Récupération automatique (FR-01-08, P15).**
**Given** un Exercice créé (CC, CS) ou une Copie insérée dans Composition
**When** il est enregistré
**Then** aucune Récupération n'est créée
**And** l'Éditeur et la Feuille ne contiennent aucun réglage de Récupération ; la Pause au changement de côté n'est visible qu'en bilatéral.

**AC12 — Compatibilité avec un N hérité (FR-01-09, renvoi FR-12-07).**
**Given** des Paramètres d'exécution dont N est marqué hérité, par l'indicateur introduit en 2.1 (AC6) et repris en 3.2 (AC14), non persisté (P42)
**When** ils sont validés et relus par le modèle
**Then** ils sont acceptés et relus sans erreur, N inchangé (test du modèle, sans parcours d'interface)
**And** aucun libellé « Circuit » ni « Tour » n'apparaît dans l'Éditeur ni dans la Feuille ; un test vérifie l'absence de ces mots dans le rendu des deux surfaces.

**AC13 — Source supprimée pendant l'édition (FR-01-10).**
**Given** l'Éditeur ouvert sur une Définition d'Exercice (ou une Copie) supprimée entre-temps
**When** Hermann touche `Terminer`
**Then** une erreur est signalée, rien n'est recréé implicitement, et aucun contenu de démonstration ne remplace les données manquantes
**And** le Brouillon de l'Éditeur est conservé ; le texte affiché est celui du code de départ pour l'échec d'enregistrement (P34, FR-02-10) ; aucun texte nouveau n'est inventé.

**Preuves attendues :**
- Tests d'intégration (`*.integration.test.tsx`) : un par parcours (AC6, AC8), double appui sur `Créer` (AC1), restauration du Catalogue (AC1, AC2), appui court et appui long dans Composition (AC4), choix `Un nouvel exercice` (AC5), isolation dans les deux sens (AC9), relecture typée après bascules (AC10), absence de Récupération (AC11), source supprimée (AC13). Test du modèle pour AC12.
- `npm test`, `npx tsc --noEmit` et `npm run lint` verts (NFR-11).
- Scénarios de recette iPhone : `R-4.1-01` (CC complet et retour au Catalogue restauré), `R-4.1-02` (MC et bouton Lecture), `R-4.1-03` (MS, appui court et appui long, isolation), `R-4.1-04` (CS par `Un nouvel exercice`, aucune Récupération), `R-4.1-05` (relecture à l'identique après bascules, dans les quatre parcours). Rattachés en 4.6 à `R-01` à `R-06`.
- Rappel NFR-04 : les tests ne valent pas recette ; Hermann valide sur iPhone.
**Rappels E4 :** NFR-02, NFR-03, NFR-04, NFR-09, NFR-14.
**Hors story :** tout nouveau parcours de création ou de duplication (Q4, P36) ; l'arbitrage de l'écart D-194 ; la production d'un N hérité et le comportement de l'Éditeur sous N hérité (FR-12-07) ; le libellé « Un circuit » de `CatalogueCreateOptions.tsx` ; le rendu visuel de l'écran (4.2).

---

### Story 4.2 : Écran principal conforme aux références

En tant que Hermann (utilisateur de KODJO),
je veux un écran principal de l'Éditeur dont chaque bloc a l'ordre, les textes, la typographie, les couleurs, les contours et les ombres de ses références,
afin que l'Éditeur soit fini et fidèle, et que je puisse le valider bloc par bloc sur mon iPhone.

**Exigences :** FR-02-01, FR-02-02, FR-02-03, FR-02-04, FR-02-06, FR-02-07, FR-02-08, FR-02-09, FR-02-10, FR-02-11, FR-02-12, FR-02-13 (relevé de tous les blocs, accès Catégorie et Zones compris ; leur comportement est en 4.3) ; FR-22-06 (largeurs de l'écran principal, AC5 ; contrôle complet en 4.6) ; NFR-01, NFR-02, NFR-03, NFR-04, NFR-07, NFR-08, NFR-09, NFR-14 ; Q9 (non bloquant), Q11, Q18, Q23, H22, H25, P7, P17, P18, P34.
**Architecture :** AD-11 (lexique, jetons intouchés), AD-13 (`validateForSave` pour l'état de `Terminer`). Fichiers principalement touchés (indicatif) : `src/features/activities/ActivityEditorForm.tsx`, `src/features/sessions/ExerciseScreen.tsx`, `src/features/sessions/ExerciseExitConfirmModal.tsx`, `src/shared/i18n/index.ts` et `src/shared/i18n/resources/fr.ts` (clés nouvelles), tests associés.
**Références visuelles :** `8328:35698`, `8328:35740`, `8328:36278`, `8328:36711`, `8328:36853`, `8328:37022`, `8328:36781`.
**Dépend de :** 4.1, 2.3.
**Hypothèses non validées :** H22, H25 — à confirmer par la revue ChatGPT/Hermann avant développement.
**Critères d'acceptation :**

**AC1 — Relevé des propriétés visuelles, avant tout développement (FR-02-13, FR-22-01).**
**Given** les arbres des sept frames de référence et `fermeture-maitres-et-variables.json.gz`
**When** la story démarre, avant toute modification de `src/`
**Then** le tableau de relevé de la « Méthode de relevé visuel » est consigné dans la story, avec une ligne par élément et par état pour : l'en-tête fixe (✕ circulaire « Action / Fermer », halo blanc, titre) ; la zone de contexte (« Zone bleue », dégradé) ; le champ Nom (placeholder et valeur) ; les accès Catégorie et Zones (non renseignés, renseignés, ouverts) ; l'en-tête et le champ Description (repos, saisie avec ↑) ; la Carte Paramètres d'exécution (libellé de section, Carte vide avec invite, Phrase affichée, lignes Compte à rebours et Fin) ; le bloc Médias (titre de section et emprise de la galerie ; le détail des tuiles relève de 4.4) ; `Terminer` (actif, inactif) ; le dialogue d'abandon (titre, message, `Annuler`, `Confirmer`)
**And** chaque ligne indique le jeton existant retenu, ou l'écart constaté ; les écarts sont listés à part et signalés à Hermann, sans modification de `tokens.ts`
**And** les éléments sans référence visuelle sont inscrits `NON VÉRIFIABLE` : lignes Compte à rebours et Fin (P17, absentes de `8328:37022`), dialogue d'abandon en modification, erreur d'enregistrement
**And** les textes des captures qui ne sont pas repris sont inscrits comme tels : « Modalités d’exécution » (Q11), titres de frames « Ajouter un exercice… » (D-325), liste d'étapes « 1. Décrivez la première étape » / « Étape suivante » (P18), message « l’activité ne sera pas créé » (Q18), données de démonstration (« Squats sautés », « Renforcement », « Cuisses . Fessier »).

**AC2 — Titre selon l'action (FR-02-01, Q9).**
**Given** chacun des quatre parcours
**When** l'Éditeur s'ouvre
**Then** le titre est `Créer un exercice` en création (CC, CS) et `Modifier un exercice` en modification (MC, MS) ; aucun nom de frame n'est affiché
**And** le rendu du titre suit le relevé d'AC1 ; sa validation visuelle revient à Hermann (Q9 non bloquant).

**AC3 — Ordre des blocs (FR-02-02, P7).**
**Given** l'Éditeur ouvert dans n'importe quel parcours
**When** l'écran est rendu
**Then** l'ordre vertical est : en-tête fixe → bandeau (champ Nom, puis accès Catégorie et Zones corporelles) → Description → Carte Paramètres d'exécution → Médias → `Terminer`. La Description précède la Carte (P7) ; le code de départ, qui place la Carte avant la Description, est réordonné
**And** le champ Nom est le premier élément du bandeau ; aucun contexte « Séance · {nom} » ni aucun contrôle de type d'Exercice n'est affiché
**And** le placeholder du nom est `Nom de l’exercice` ; aucune valeur de démonstration n'est codée en dur.

**AC4 — En-tête et zone de contexte (FR-02-03).**
**Given** l'Éditeur ouvert
**When** l'en-tête est rendu
**Then** la fermeture est un ✕ circulaire en haut à gauche, de cible tactile 48 × 48, cercle visible 38 × 38, icône 24, avec le halo blanc de 59,28
**And** aucun liseré n'apparaît sous l'en-tête ni autour du champ Nom ; la zone de contexte porte le dégradé `#EAEAFF` → transparent sur ses 20 % inférieurs (le séparateur de 1 px du code de départ suit le relevé d'AC1 de `8328:35698` : retiré s'il n'y figure pas, conservé et inscrit comme écart signalé à Hermann s'il y figure ; aucun jugement du développeur)
**And** 18 séparent le bas géométrique du dégradé de la première ligne de texte ; le nom est posé à la même hauteur que dans `8328:35698`.

**AC5 — Grille verticale et largeurs (FR-02-04, FR-22-06).**
**Given** l'Éditeur rendu aux largeurs 360, 402 et 440 (NFR-09), plus 390, seuil de la marge latérale de FR-02-04
**When** les tests vérifient les styles appliqués, Jest n'ayant pas de moteur de mise en page : valeurs de marge et d'espacement des `StyleSheet` des blocs, et marge latérale calculée pour chaque largeur fournie par une largeur de fenêtre simulée ; la géométrie effective est contrôlée à la recette (`R-4.2-06`), à la largeur de l'iPhone de Hermann
**Then** 20 séparent le dernier élément d'un bloc du titre suivant, 13 un titre de section de son bloc, 12 deux blocs ; les espaces internes des composants ne relèvent pas de cette grille
**And** la marge latérale vaut 24 à partir de 390 et 16 en dessous ; aucune coordonnée Figma n'est reprise en position absolue.

**AC6 — Carte Paramètres d'exécution (FR-02-06, Q11, H22, P17).**
**Given** un nouvel Exercice sans Mode
**When** l'Éditeur est rendu
**Then** le libellé de section au-dessus de la Carte est `Paramètres d’exécution` ; « Modalités d’exécution » n'apparaît nulle part
**And** la Carte vide est une zone unique qui ouvre la Feuille ; elle est rendue comme en PRE-3, sans invite (Q55, décision de Hermann du 2026-10-18, qui retire l'invite H22 « Appuyez pour définir les séries et les durées ») ; dès qu'un Mode est validé par le ✓ de la Feuille, la Phrase s'affiche
**And**, après le ✓ de la Feuille avec un Mode renseigné, la Carte affiche **une seule** Phrase des paramètres (générée par le générateur unique d'AD-6), valeurs et unités en gras, Inter 13, interligne 20, hauteur intrinsèque, sans plafond ni troncature ; le contenu situé dessous suit
**And** la Phrase passe à la ligne avant « Durée totale » sans changer sa grammaire, sans virgule isolée en début de ligne ; aucun mot ni nombre de la Phrase n'est un contrôle autonome ; ce retour de ligne est un traitement de rendu de la Carte (l'espace qui sépare « Durée totale » de la fin de phrase précédente est remplacée par un saut de ligne à l'affichage seulement), les segments produits par le générateur (2.3) restant inchangés
**And** les lignes `Compte à rebours` et `Fin d’exercice` restent dans la Carte, séparées de la Phrase (P17)
**And** la Carte entière ouvre la Feuille et a un seul focus d'accessibilité (possible une fois le bouton de Mode retiré, AC14) ; son libellé accessible garde la composition du code de départ (`ActivityEditorForm.tsx:310`, NFR-03) : `Modifier les paramètres d’exécution`, puis la Phrase entière en texte brut, puis `Compte à rebours {n} s, Fin d’exercice {n} s.` ; pour la Carte vide, la même composition, l'invite H22 prenant la place de la Phrase
**And** la phrase longue de référence (224 caractères, `7119:27855`) tient sans troncature à la largeur 324 ; la hauteur constatée n'est jamais fixée dans le code.

**AC7 — Description (FR-02-07, P18).**
**Given** le champ `Description de l’exercice`
**When** Hermann y saisit du texte
**Then** le champ est facultatif, multiligne, limité à 1000 caractères ; la touche Retour fait un retour à la ligne ; aucune structure en étapes numérotées n'est reproduite
**And** pendant la saisie, le bouton ↑ dans le champ ferme le clavier ; le texte est déjà dans le Brouillon de l'Éditeur ; ↑ n'enregistre pas l'Exercice
**And** clavier ouvert, la Description se place juste au-dessus du clavier, curseur visible
**And** le placeholder reste celui du code de départ, aucune source ne fixant ce texte (P18, P34).

**AC8 — Terminer et clavier (FR-02-08).**
**Given** l'Éditeur à la largeur 402
**When** l'écran est rendu
**Then** `Terminer` est un bouton principal sur toute la largeur utile (354 × 48 à 402), hauteur 48, rayon 24, libellé centré, sans position absolue
**And** clavier ouvert, `Terminer` reste en bas, sous le clavier, et ne remonte pas ; il redevient accessible à la fermeture du clavier ; le corps reste défilable.

**AC9 — Validation avant Terminer (FR-02-09, H25).**
**Given** un Brouillon de l'Éditeur
**When** l'une de ces conditions manque : nom de 1 à 80 caractères ; exactement une Catégorie ; au moins une Zone (nouvel Exercice) ; Paramètres d'exécution exécutables validés par la Feuille
**Then** `Terminer` est inactif, et l'est aussi pour l'accessibilité (`accessibilityState.disabled`)
**And** l'état de `Terminer` ne dépend jamais de la couleur des captures (`8328:35698` actif à vide, `8328:35740` pâle rempli)
**And** en modification, une Catégorie ou une Zone retirée de son référentiel reste affectée et enregistrable
**And** un Exercice ancien portant une valeur hors bornes non modifiée (Cible 5999 s, 150 répétitions, Bip 11) reste enregistrable, la valeur réenregistrée telle quelle ; une Cible absente, à renseigner, laisse `Terminer` inactif (H25, `validateForSave` d'AD-13).

**AC10 — Enregistrement atomique et erreur d'écriture (FR-02-10, P34).**
**Given** un Brouillon valide
**When** Hermann touche `Terminer`
**Then** nom, référentiels, description, Paramètres d'exécution validés et associations Médias ordonnées sont enregistrés ensemble ou pas du tout (en Séance : dans le Brouillon de Composition)
**And** en cas d'échec d'écriture (injection d'échec en test), le Brouillon est conservé, Hermann reste dans l'Éditeur et peut réessayer ; aucun enregistrement partiel ni doublon ; le message est celui du code de départ, inchangé (`L’exercice n’a pas pu être enregistré. Réessayez.`)
**And** des appuis répétés sur `Terminer` ne lancent qu'une opération d'enregistrement à la fois.

**AC11 — États à couvrir (FR-02-11).**
**Given** la liste d'états de FR-02-11
**When** la story est close
**Then** chaque état a au moins un test de rendu et un scénario de recette : vide ; nom seul ; Catégorie renseignée ; nom, description et Média renseignés ; modification d'un Exercice existant ; résumé identiques ; résumé variables en Durée, en Répétitions, à l'échec et Cible mixte ; bilatéral dans chaque Ordre des côtés ; abandon confirmé et annulé ; erreur d'enregistrement. L'absence de capture ne retire aucun état.

**AC12 — Abandon avec confirmation (FR-02-12, Q18).**
**Given** l'Éditeur ouvert
**When** Hermann ferme ou revient sans modification à perdre
**Then** la sortie est immédiate, sans dialogue
**When** il a des modifications non enregistrées
**Then** un dialogue de décision centré s'affiche, avec deux actions sur une ligne : `Annuler` (neutre) et `Confirmer` (destructif, rouge)
**And** en création (CC, CS), titre `Abandonner la création ?` et message `Les informations saisies seront perdues et l’exercice ne sera pas créé.`, portés par des clés nouvelles du lexique
**And** en modification (MC, MS), titre `Abandonner les modifications ?` et message `Les modifications apportées à cet exercice seront perdues.`, inchangés
**And** `Annuler` ferme le dialogue et conserve le formulaire et le Brouillon ; `Confirmer` quitte sans enregistrer.

**AC13 — Rendu conforme au relevé (FR-02-13, AD-11).**
**Given** le tableau d'AC1
**When** les blocs sont rendus, dans chacun de leurs états
**Then** typographie, couleurs, contour et ombre suivent le relevé, par les jetons existants
**And** aucun jeton n'est modifié et aucune valeur n'est codée en dur ; chaque écart reste listé et signalé à Hermann
**And** l'opacité d'un élément atténué éventuel passe par `UNSELECTED_OPACITY` (AD-11), jamais par une constante locale.

**AC14 — Bouton de Mode retiré à côté du titre de section (Q23, FR-02-06).**
**Given** le code de départ, qui affiche à droite du titre de la Carte un bouton (`exercise-parameters-mode`, texte `Choisir un mode` ou nom du Mode) de même libellé accessible que la Carte
**When** l'Éditeur est rendu, avec ou sans Mode renseigné
**Then** aucun bouton ni nom du Mode n'est affiché à droite du titre `Paramètres d’exécution` ; l'élément d'identifiant de test `exercise-parameters-mode` n'existe plus (Q23)
**And** la Carte est une seule zone touchable qui ouvre la Feuille, avec un seul focus d'accessibilité (AC6)
**And** le Mode reste visible dans la Phrase de la Carte et se choisit dans la Feuille, par son popover (3.3) ; les clés du lexique devenues sans usage sont retirées.

**Preuves attendues :**
- Tableau de relevé d'AC1 dans la story, avant le premier commit de code.
- Tests de rendu : ordre des blocs, textes exacts (titres, invite H22, libellé `Paramètres d’exécution`, textes Q18), focus unique de la Carte, absence du bouton de Mode à côté du titre (Q23), marges à 360, 390, 402 et 440, `Terminer` hors de la zone qui évite le clavier, états de FR-02-11, atomicité et erreur d'écriture (motif `FailingDatabase`), appuis répétés.
- `npm test`, `npx tsc --noEmit` et `npm run lint` verts ; `tokensSpecification.test.ts` inchangé et vert.
- Scénarios de recette iPhone : `R-4.2-01` (écran vide et invite), `R-4.2-02` (nom, description, Média, clavier), `R-4.2-03` (Phrase affichée, lignes Compte à rebours et Fin, phrase longue ; VoiceOver : un seul élément, libellé composé selon AC6, repris de `R-2.3-05`), `R-4.2-04` (validation de `Terminer`), `R-4.2-05` (abandon en création et en modification), `R-4.2-06` (comparaison bloc par bloc au relevé, à 402). Rattachés en 4.6 à `R-07` à `R-12`.
- Rappel NFR-04 : la conformité visuelle de FR-02-13 est validée par Hermann sur iPhone ; un test vert ne la prouve pas.
**Rappels E4 :** NFR-02, NFR-03, NFR-04, NFR-09, NFR-14.
**Hors story :** le comportement des sélections Catégorie et Zones et le rendu de leurs accès (4.3) ; le détail de la galerie Médias (4.4) ; la Feuille (E3) ; la Phrase elle-même (2.3) ; l'arbitrage de Q9 (non bloquant, validé sur appareil).

---

### Story 4.3 : Catégorie et Zones corporelles depuis l'Éditeur

En tant que Hermann (utilisateur de KODJO),
je veux choisir, créer, modifier et supprimer une Catégorie ou une Zone corporelle depuis le bandeau du nom, sans perdre ce que j'ai saisi ni le clavier,
afin de classer mes Exercices sans quitter l'Éditeur.

**Exigences :** FR-02-05, FR-02-13 (relevé des feuilles de référentiel, AC1), FR-22-04 (cibles des accès, AC2 ; contrôle complet en 4.6), FR-20-01, FR-20-02, FR-20-03, FR-20-04, FR-20-05, FR-20-06, FR-20-07, FR-20-08, FR-20-09, FR-20-10, FR-20-11 ; NFR-02, NFR-03, NFR-04, NFR-05, NFR-08, NFR-09, NFR-10, NFR-14 ; P12, P13, P14, P15, P34, P35, D-026, D-093, D-210, D-211, D-257, D-343, D-344, D-350, D-354.
**Architecture :** AD-11 ; capability map : `src/features/reference-data/` garde le comportement PRE-3 (P12 à P14, P34), sauf deux changements limités : l'icône et le libellé des accès non renseignés (FR-02-05, P35, ici) et l'action accessible équivalente à l'appui long (FR-22-09, en 4.6). La story **constate** d'abord par tests le comportement PRE-3 et ne corrige que les écarts aux FR ci-dessus. Fichiers principalement touchés (indicatif) : `src/features/activities/ActivityEditorForm.tsx` (accès du bandeau), `src/features/reference-data/CategoryPickerModal.tsx`, `BodyZonePickerModal.tsx`, `ReferenceValueDialog.tsx`, `src/features/sessions/BodyZoneSelector.tsx`, lexique, tests.
**Références visuelles :** `8328:35698`, `8328:36278`, `8328:37022` (accès du bandeau) ; `8328:35810`, `8328:35932`, `8328:36056`, `8328:36348`, `8328:36441`, `8328:36536` (`8328:35932` et `8328:36441` sont antérieures à D-354).
**Dépend de :** 4.2.
**Critères d'acceptation :**

**AC1 — Relevé visuel des feuilles de référentiel (FR-22-01, FR-02-13 ; méthode de l'epic).**
**Given** les frames `8328:35810`, `8328:35932`, `8328:36056`, `8328:36348`, `8328:36441`, `8328:36536` et les lignes « accès Catégorie / Zones » du relevé de 4.2
**When** la story démarre, avant toute modification de `src/`
**Then** le tableau de relevé est consigné pour : l'en-tête ✕ / titre / ✓ et son séparateur ; les options de Catégorie (pastille et nom) et de Zone (sans couleur, sans silhouette) ; l'action de création et son champ avec ↑ ; la barre de couleurs ; le dialogue de confirmation de suppression
**And** le menu d'appui long D-354 (✕ / `Modifier` / `Supprimer`), sans frame, est inscrit `NON VÉRIFIABLE` sur Figma ; les menus `Annuler` / `Supprimer` des frames `8328:35932` et `8328:36441` ne sont pas repris (P13)
**And** l'écart de nombre de cases de la barre de couleurs de `8328:36056` avec les 12 couleurs de D-026 est inscrit et signalé à Hermann ; le nombre de couleurs reste celui de D-026.

**AC2 — Accès du bandeau (FR-02-05, P35).**
**Given** le bandeau du nom
**When** Catégorie et Zones ne sont pas renseignées
**Then** chaque accès est un bouton qui affiche une icône **et** un libellé : `Catégorie` et `Zone corporelle` (captures `8328:35698`, P35) ; le code de départ, qui n'affiche que l'icône, est complété ; les libellés passent par le lexique
**When** elles sont renseignées
**Then** l'accès Catégorie affiche une pilule (pastille colorée + nom) et l'accès Zones les noms des Zones choisies, avec le séparateur et l'icône tels que montrés par `8328:36278` et `8328:37022` (P35)
**And** les icônes ont deux états : contour au repos, plein pendant l'ouverture de la sélection ; le cercle ne change pas ; elles reviennent au repos après ✓ ou ✕
**And** une seule silhouette est affichée, celle du Profil (homme par défaut) ; jamais deux boutons homme / femme
**And** chaque accès a une cible d'au moins 44 × 44 pt (FR-22-04).

**AC3 — Ouverture sans perte du Brouillon (FR-20-01).**
**Given** un Brouillon de l'Éditeur avec nom, description et Paramètres d'exécution en Régime variables
**When** Hermann ouvre puis ferme (✓ ou ✕) la sélection de Catégorie ou de Zones
**Then** tout le Brouillon est conservé
**And** la sélection est une feuille ancrée en bas, avec en-tête ✕ / titre / ✓ et séparateur.

**AC4 — Choisir une Catégorie (FR-20-02, P14).**
**Given** la feuille de Catégories ouverte
**When** Hermann touche une Catégorie
**Then** elle est marquée sans fermer la feuille ; ✓ affecte la Catégorie marquée et ferme progressivement (immédiatement avec « Réduire les animations ») ; ✕ ferme et conserve la Catégorie d'avant l'ouverture
**And** chaque Catégorie affiche une pastille colorée et son nom
**And** l'ordre est : Catégories prédéfinies selon leur ordre d'affichage, puis Catégories personnelles par date de création croissante ; une sélection ne change pas l'ordre.

**AC5 — Choisir des Zones corporelles (FR-20-03).**
**Given** la feuille de Zones ouverte
**When** Hermann touche des Zones
**Then** chaque appui bascule la sélection de la Zone ; ✓ applique la sélection ; ✕ restaure celle d'avant l'ouverture
**And** les Zones n'ont pas de couleur et aucune silhouette n'est répétée dans les options
**And** le jeu initial est celui des dix Zones de D-093 (jeu de départ, non liste fermée).

**AC6 — Une Catégorie et au moins une Zone (FR-20-04, P15).**
**Given** un nouvel Exercice
**When** il n'a pas exactement une Catégorie et au moins une Zone
**Then** `Terminer` reste inactif (FR-02-09)
**And** une Zone retirée de son référentiel et déjà affectée ne bloque ni l'enregistrement de l'Exercice (Définition ou Copie), ni son ajout à une Séance, ni l'enregistrement de la Séance : la Copie conserve l'affectation, aucun écran d'erreur système ; l'Éditeur n'affiche aucun avis textuel ni annonce VoiceOver à son sujet (Q53 (9), décision de Hermann du 2026-10-18) ; dans la feuille des Zones de cet Exercice, elle reste visible, cochée et interactive, sur fond `#FFF1F0`, sans mention « Retirée », et peut être conservée, remplacée ou retirée (règle « au moins une Zone » et son message inchangés) ; elle n'est jamais proposée à un Exercice qui ne l'a pas (Q53, décision de Hermann du 2026-10-18, qui remplace Q49 b)
**And** Catégorie et Zones sont sans effet sur l'exécution.

**AC7 — Liste longue (FR-20-05).**
**Given** une trentaine de Catégories ou de Zones
**When** la feuille s'ouvre, clavier affiché ou non
**Then** elle monte jusqu'au bord haut de la zone de contexte, la liste défile, le clavier et les actions restent visibles
**And** un nom long reste lisible en entier par l'accessibilité.

**AC8 — Créer une entrée sans quitter le clavier (FR-20-06, P12, D-344, D-350).**
**Given** le formulaire de création (champ texte avec ↑ dans le champ)
**When** Hermann saisit un nom puis touche ↑
**Then** l'entrée est enregistrée **sans fermer le clavier ni la feuille** ; le champ est vidé ; des appuis répétés ne créent qu'une entrée
**And** une Catégorie créée est marquée comme choisie, et ✓ l'affecte ; elle reste dans le référentiel si la feuille est fermée par ✕ ; une Zone créée rejoint la sélection, et ✓ l'applique
**And** le formulaire n'a pas de bouton `Annuler` : le ✕ de l'en-tête ferme la feuille (Catégorie précédente conservée, sélection de Zones antérieure restaurée)
**And** nom vide : ↑ est inactif, **sans message d'erreur** (P12)
**And** en création de Catégorie, une seule barre de couleurs sous le champ, sans pastille séparée, avec les 12 couleurs de D-026 ; les Zones n'ont pas de palette.

**AC9 — Unicité et réactivation (FR-20-07, P34).**
**Given** un référentiel
**When** Hermann crée un nom qui existe déjà, ou qui correspond à une entrée retirée
**Then** l'unicité est assurée sur la clé normalisée du code de départ ; le traitement d'un nom dupliqué (comportement et texte) est celui du code de départ, inchangé (P34)
**And** recréer un nom retiré réactive l'entrée : même identifiant, associations conservées, sans confirmation ; pour une Catégorie, la couleur choisie à cette création est appliquée
**And** ni le démarrage ni une migration ne réactivent ni ne recréent une entrée supprimée.

**AC10 — Appui long : menu ✕ / Modifier / Supprimer (FR-20-08, P13, D-354).**
**Given** une option de Catégorie ou de Zone
**When** Hermann fait un appui long
**Then** la sélection et l'affectation ne changent pas ; un dialogue de décision s'ouvre, dans la fenêtre de la feuille, avec un ✕ rond en haut à gauche, puis `Modifier` (fond bleu Kodjo) et `Supprimer` (fond rouge), texte blanc, sur une ligne (référence 147 × 48 dans un dialogue de 354, adaptés à la largeur)
**And** un clavier déjà affiché reste affiché, y compris quand le menu est fermé par ✕
**And** `Modifier` ouvre la saisie du nom de l'entrée dans le formulaire de création, texte conservé, avec la palette pour une Catégorie ; renommer conserve l'identifiant
**And** changer la couleur d'une Catégorie s'applique aux objets courants, jamais aux Instantanés.

**AC11 — Supprimer une entrée (FR-20-09).**
**Given** le menu d'appui long
**When** Hermann touche `Supprimer`
**Then** une confirmation destructive s'affiche, de titre `Supprimer « {nom} » ?`
**And** pour une entrée utilisée, le message est `Cette catégorie ne sera plus proposée. Les exercices qui l’utilisent actuellement la conserveront.` ou `Cette zone corporelle ne sera plus proposée. Les exercices qui l’utilisent actuellement la conserveront.` ; pour une entrée non utilisée, la confirmation et son texte sont ceux du code de départ (P34)
**And** après confirmation, la sélection reste ouverte sans l'entrée supprimée ; pour une Catégorie (Q53 (8)), dans l'Exercice depuis lequel la suppression est effectuée, elle disparaît immédiatement du sélecteur et de la sélection, qu'elle soit utilisée ailleurs ou non (avis `Cette valeur a été retirée. Choisissez-en une autre.` ; `Terminer` inactif tant qu'aucune Catégorie n'est choisie) ; dans les autres Exercices qui l'ont, elle reste affectée, choisie sur fond `#FFF1F0` dans leur feuille, sans menu d'appui long, sans avis textuel sous l'accès Catégorie (Q53 (9)) ; une Copie nouvelle la conserve ; elle n'est plus proposée pour de nouvelles affectations ; aucune erreur système ni sauvegarde bloquée ; pour une Zone, dans l'Exercice depuis lequel la suppression est effectuée, la Zone disparaît immédiatement du sélecteur et de la sélection, sans rester affichée en rouge ; dans les autres Exercices auxquels elle était déjà affectée, l'affectation est conservée et la Zone apparaît sur fond `#FFF1F0` dans leur sélecteur, où l'utilisateur peut la conserver, la remplacer ou la décocher ; elle n'est plus proposée pour de nouvelles affectations ; si c'était la seule Zone de l'Exercice courant, « au moins une Zone requise » s'applique (`Terminer` inactif, message existant), sans erreur système (Q53 (7), qui remplace Q49 b) ; annuler la suppression laisse la sélection intacte
**And** toutes les entrées sont supprimables, valeurs initiales de KODJO comprises.

**AC12 — Erreurs et séparation des enregistrements (FR-20-10, P34).**
**Given** une création, une modification ou une suppression confirmée dans un référentiel
**When** elle réussit
**Then** elle est enregistrée dans le référentiel indépendamment de `Terminer` ; l'Exercice, lui, n'est enregistré qu'à `Terminer`
**When** elle échoue (injection d'échec en test)
**Then** un message s'affiche (texte du code de départ, P34), le Brouillon de l'Éditeur est conservé et l'Exercice n'est pas enregistré
**And** aucun glisser n'existe dans les référentiels ; aucune action destructive n'est déclenchée par une simple sélection.

**AC13 — Scénarios de recette des référentiels (FR-20-11).**
**Given** les données de départ de `recette-iphone.md` §2
**When** la story est close
**Then** les scénarios couvrent : une Catégorie et une Zone, chacune utilisée et non utilisée ; Catégorie choisie, annulée, créée, recolorée ; Zones 0, 1 et N ; noms vide et dupliqué ; suppression d'une valeur initiale et d'une valeur personnelle ; ancienne affectation retirée enregistrée ; nouvelle affectation d'une valeur retirée impossible ; renommage sans changement d'identifiant ; silhouette du Profil dans ses deux variantes.

**Preuves attendues :**
- Tableau de relevé d'AC1 dans la story, avant le premier commit de code.
- Tests : accès du bandeau (libellés `Catégorie` et `Zone corporelle`, pilule, noms, icônes contour / plein, silhouette unique), conservation du Brouillon, ✓ / ✕ des deux feuilles, ordre des Catégories, création par ↑ sans fermeture du clavier (journal clavier existant), appuis répétés, nom vide sans message, palette à 12 couleurs, réactivation, menu D-354 avec clavier conservé, textes de suppression, échec de référentiel sans perte du Brouillon.
- `npm test`, `npx tsc --noEmit` et `npm run lint` verts.
- Scénarios de recette iPhone : `R-4.3-01` (Catégorie : marquer, ✓, ✕, créer, recolorer), `R-4.3-02` (Zones 0, 1, N ; créer une Zone), `R-4.3-03` (appui long, `Modifier`, `Supprimer`, clavier conservé), `R-4.3-04` (affectations retirées), `R-4.3-05` (silhouette du Profil, deux variantes ; liste longue). Rattachés en 4.6 à `R-38` à `R-40`.
- Rappel NFR-04 : le menu D-354, sans frame, et l'écart de la barre de couleurs sont validés par Hermann sur appareil.
**Rappels E4 :** NFR-02, NFR-03, NFR-04, NFR-09, NFR-14.
**Hors story :** Étiquettes et Profil (PRE3-PERIM §3) ; l'accessibilité complète des référentiels et les alternatives à l'appui long (FR-22-09, FR-22-10, en 4.6) ; toute nouvelle règle de normalisation des noms.

---

### Story 4.4 : Médias dans l'Éditeur, sans perte

En tant que Hermann (utilisateur de KODJO),
je veux ajouter, ordonner et retrouver les photos et vidéos d'un Exercice depuis l'Éditeur, dans les quatre parcours,
afin que mes Médias soient enregistrés avec l'Exercice, dans mon ordre, sans jamais se perdre.

**Exigences :** FR-21-01, FR-21-02, FR-21-03, FR-21-04 (côté interface ; les règles de données FR-21-50 à FR-21-58 sont livrées en 1.1 et 1.3) ; NFR-02, NFR-03, NFR-04, NFR-05, NFR-07, NFR-08, NFR-09, NFR-14 ; P18, Q31, D-115, D-264, D-333, D-335 (amendée par Q31).
**Architecture :** AD-9 (copies et duplications : liens nouveaux, fichiers partagés), AD-11, AD-17 (gestes de la tuile, Q31 : livrés en 4.5). Fichiers principalement touchés (indicatif) : `src/features/activities/ActivityMediaList.tsx`, `src/features/activities/ActivityEditorForm.tsx` (section Médias), `src/domain/media/` (lecture), `src/infrastructure/media/` (lecture), tests. La story est une exigence de non-régression : le comportement PRE-3 accepté (menu natif Retirer / Monter / Descendre, actions accessibles Retirer / Monter / Descendre, réessai) est conservé (P18, NFR-03). Seul le **geste** d'ouverture du menu change, du toucher à l'appui long (menu contextuel natif, Q31, D-335 amendée) : ce changement est livré par la story 4.5, en même temps que le toucher devient la consultation, pour que la tuile ne passe jamais par un état sans menu ni consultation (AD-17). Cette story-ci ne modifie pas `MediaTile`.
**Références visuelles :** `8328:35698`, `8328:35740`.
**Dépend de :** 4.2, 1.3.
**Critères d'acceptation :**

**AC1 — Relevé visuel du bloc Médias (FR-22-01, FR-02-13 ; méthode de l'epic).**
**Given** les frames `8328:35698` et `8328:35740`
**When** la story démarre, avant toute modification de `src/`
**Then** le tableau de relevé est consigné pour la galerie horizontale, l'aperçu tronqué du Média suivant, la tuile d'ajout (icône vectorielle `icon/ajouter`), les pictogrammes de lecture et de plein écran (rendus par la story 4.5) et les vignettes photo et vidéo
**And** les états sans capture (import en cours, erreur d'import et réessai, menu de retrait et de réordonnancement, fichier introuvable) sont inscrits `NON VÉRIFIABLE` sur Figma et soumis à la validation de Hermann
**And** l'écart entre l'icône de la tuile d'ajout du code de départ (`action-add`) et `icon/ajouter` est inscrit et traité par le relevé (même glyphe ou écart signalé) ; jamais un « + » typographique.

**AC2 — Ajouter un Média dans les quatre parcours (FR-21-01, P18).**
**Given** l'Éditeur ouvert en CC, MC, CS ou MS
**When** Hermann ajoute une photo puis une vidéo locales depuis la zone Médias
**Then** chaque Média ajouté s'affiche en dernière position
**And** les Médias sont enregistrés avec l'Exercice à `Terminer` (au Brouillon de Composition en Séance, puis au `Continuer`)
**And** aucune caméra n'est activée implicitement ; aucune limite de nombre, de taille ni de durée n'est ajoutée ; sources système, formats et permissions restent ceux du code de départ.

**AC3 — Galerie et ordre (FR-21-02).**
**Given** un Exercice à trois Médias
**When** l'Éditeur est rendu
**Then** la galerie est horizontale et ordonnée, l'aperçu du Média suivant est tronqué, et la tuile d'ajout porte l'icône vectorielle du relevé
**And** la zone Médias reste sous la Carte Paramètres d'exécution en cas de chevauchement
**And** après réordonnancement, `Terminer`, fermeture et réouverture, les Médias réapparaissent dans le même ordre et avec la même identité
**And** le premier Média (image de couverture pour une vidéo) est la vignette de la carte du Catalogue
**And** retirer ou réordonner un Média reste possible par le menu natif Retirer / Monter / Descendre et par les actions VoiceOver `Retirer {item}`, `Monter {item}`, `Descendre {item}`, sans régression (options, bornes exclues, effets) ; le retrait ne supprime que l'association, jamais le fichier (FR-21-54, livré en 1.3)
**And** le menu s'ouvre au toucher de la tuile tant que la story 4.5 n'est pas livrée (code de départ inchangé), puis par appui long, menu contextuel natif (Q31, FR-21-02) ; les tests de non-régression des trois actions écrits ici sont repris par 4.5 avec le nouveau geste, sans changer leurs attendus.

**AC4 — Plein écran et lecture vidéo : renvoi à la story 4.5 (FR-21-02, FR-21-05, Q27).**
**Given** le rendu de référence de FR-21-02, qui montre une action de plein écran et de lecture vidéo (`S/12…:829-832`, `8328:35698`, `8328:35740`), et la décision Q27, qui les inclut dans PRE-4 pour l'Éditeur
**When** la story est livrée
**Then** la galerie conserve, sans régression, la tuile dont le toucher deviendra en 4.5 la consultation (« Lire la vidéo », « Agrandir le média ») ; cette story-ci ne l'implémente pas et ne l'exclut pas : elle est livrée et recettée en 4.5 (FR-21-05, AD-17, Q31) ; aucun bouton n'est ajouté sur la tuile
**And** FR-21-04 n'exclut que la lecture pendant l'Exécution, hors périmètre (AC6).

**AC5 — Import annulé ou en erreur (FR-21-03, P18).**
**Given** un Brouillon de l'Éditeur avec deux Médias
**When** Hermann annule le sélecteur système
**Then** ni la galerie ni le Brouillon ne changent
**When** un import échoue (erreur simulée en test : `COPY_FAILED`, `STORAGE_FULL`, `INCOMPATIBLE`, `ERROR`)
**Then** le Brouillon reste intact, le message existant du lexique s'affiche, et Hermann peut relancer l'ajout par `Réessayer` ; un réessai réussi ajoute un seul Média, en dernière position
**And** les textes d'erreur, de permission refusée, d'accès limité et de fichier introuvable restent ceux du code de départ.

**AC6 — Pas de lecture d'exécution (FR-21-04).**
**Given** PRE-4
**When** la story est close
**Then** aucun moteur de lecture des Médias pendant l'exécution n'a été ajouté (vérifié par le diff : aucun fichier du moteur d'exécution touché).

**AC7 — Copies et duplications, côté interface (FR-21-01, FR-21-02 ; renvoi FR-21-53).**
**Given** une Définition à deux Médias, copiée dans une Séance
**When** Hermann ouvre la Copie (MS), réordonne puis retire un Média, `Terminer`, `Continuer`
**Then** la Définition garde ses deux Médias dans leur ordre ; le fichier retiré de la Copie existe toujours.

**Preuves attendues :**
- Tableau de relevé d'AC1 dans la story, avant le premier commit de code ; pictogrammes de lecture et de plein écran relevés pour la story 4.5.
- Tests : ajout en dernière position dans les quatre parcours, ordre relu après réouverture, vignette de carte, annulation, erreurs et réessai (un seul Média ajouté), retrait sur une Copie sans effet sur la Définition, absence d'activation de caméra ; non-régression des actions Retirer / Monter / Descendre (options du menu selon la position, bornes exclues, effets sur l'ordre, actions VoiceOver), écrite indépendamment du geste pour être reprise par 4.5.
- `npm test`, `npx tsc --noEmit` et `npm run lint` verts.
- Scénarios de recette iPhone : `R-4.4-01` (ajout photo et vidéo, ordre, réouverture après relance de l'application), `R-4.4-02` (réordonner et retirer par le menu, ouvert par appui long sur la tuile, menu contextuel natif, Q31 ; recetté après 4.5), `R-4.4-03` (import annulé ; import en erreur et réessai, si l'erreur est reproductible sur l'appareil, sinon `NON VÉRIFIABLE` consigné), `R-4.4-04` (vignette du Catalogue ; Copie indépendante). Rattachés en 4.6 à `R-41`.
- Rappel NFR-04 : les états d'import et le menu contextuel natif, sans capture, sont validés par Hermann.
**Rappels E4 :** NFR-02, NFR-03, NFR-04, NFR-09, NFR-14.
**Hors story :** les règles de données des Médias (FR-21-50 à FR-21-58 : E1) ; la lecture des Médias en exécution (FR-21-04) ; toute limite, source ou permission nouvelle ; la consultation d'un Média dans l'Éditeur, plein écran et lecture vidéo (story 4.5, Q27).

---

### Story 4.5 : Consulter un Média dans l'Éditeur (lecteur natif)

En tant que Hermann (utilisateur de KODJO),
je veux, en touchant une tuile de la galerie de l'Éditeur, lire une vidéo ou agrandir une photo en plein écran avec le lecteur du système, et garder le menu Retirer / Monter / Descendre à l'appui long,
afin de vérifier le Média d'un Exercice sans quitter l'Éditeur ni perdre mon Brouillon.

**Exigences :** FR-21-05 ; FR-21-02 (consultation au toucher de la tuile, menu à l'appui long, Q31) ; FR-21-04 (aucune lecture pendant l'Exécution) ; FR-21-58 (Média indisponible) ; FR-22-03 (lecteur et menu natifs, AC2, AC8) ; FR-22-09 (actions VoiceOver, alternative à l'appui long, AC7) ; NFR-02, NFR-03, NFR-04, NFR-05, NFR-08, NFR-09, NFR-14 ; Q27, Q31, D-335 (amendée par Q31), P18, H13, H23.
**Architecture :** AD-17 (gestes de la tuile selon Q31 : toucher → consultation, appui long → menu contextuel natif `ContextMenu` d'`@expo/ui`, vérifié en AC9, repli défini ; lecteur natif `expo-video` ~57.0.5 et plein écran natif ; photo par la présentation modale native et `expo-image` ; aucune lecture automatique ; aucun lien avec le moteur d'Exécution ; livraison atomique du changement de geste), AD-11 (lexique). API d'`@expo/ui` `ContextMenu` relue dans la documentation versionnée SDK 57 avant de coder. Fichiers principalement touchés (indicatif) : `src/features/activities/ActivityMediaList.tsx`, `src/shared/i18n/`, tests ; lecture de `src/infrastructure/media/VideoPoster.ts` (cycle de vie existant d'un lecteur `expo-video`). L'API exacte d'`expo-video` est relue dans la documentation versionnée SDK 57 avant de coder (`docs/AGENTS.md`).
**Références visuelles :** `8328:35698`, `8328:35740` (pictogrammes de lecture et de plein écran relevés en 4.4 AC1) — visuel seulement, D-255. Le lecteur plein écran lui-même est le rendu natif d'iOS, sans frame Figma (`NON VÉRIFIABLE` sur Figma, jugé par Hermann).
**Dépend de :** 4.4.
**Hypothèses non validées :** H13, H23 ; primitive du menu contextuel natif (AD-17, `[ASSUMPTION]`, vérifiée en AC9) — à confirmer par la revue ChatGPT/Hermann avant développement.
**Critères d'acceptation :**

**AC1 — Aucune lecture automatique (FR-21-05, Q27, AD-17).**
**Given** un Exercice dont la galerie contient une vidéo
**When** l'Éditeur s'ouvre, défile, ou que la Feuille s'ouvre et se ferme
**Then** aucune vidéo n'est lue et aucun son n'est émis ; aucun lecteur n'est créé au montage de la galerie (la génération d'affiche existante de `VideoPoster.ts` est conservée telle quelle)
**And** un test de composant vérifie qu'aucun appel de lecture n'a lieu sans action de l'utilisateur.

**AC2 — Lire une vidéo à la demande, en plein écran natif (FR-21-05, FR-21-02, FR-22-03, NFR-02, Q31).**
**Given** une vidéo de la galerie
**When** Hermann touche sa tuile (toucher simple, n'importe où sur la tuile)
**Then** la vidéo est lue par le lecteur natif `expo-video`, en plein écran natif, avec les contrôles natifs du système (lecture, pause, position, fermeture)
**And** aucune commande de lecture ni aucun plein écran n'est réimplémenté en composants React Native ; aucune boucle ; le lecteur est mis en pause à la sortie du plein écran et libéré au démontage (AD-17).

**AC3 — Agrandir une photo (FR-21-05, Q27, Q31).**
**Given** une photo de la galerie
**When** Hermann touche sa tuile
**Then** la photo s'affiche en plein écran, entière, par la présentation modale native existante et `expo-image`, avec une action de fermeture libellée par le lexique
**And** aucun geste, zoom ni défilement entre Médias n'est ajouté (non demandé par Q27).

**AC4 — Retour à l'Éditeur sans perte du Brouillon (FR-21-05, NFR-05).**
**Given** un Brouillon de l'Éditeur modifié et non enregistré (nom, Description, Paramètres d'exécution appliqués par ✓, ordre des Médias)
**When** Hermann ouvre un Média en plein écran, puis ferme le plein écran
**Then** l'Éditeur réapparaît dans le même état : Brouillon identique champ par champ, ordre des Médias inchangé, aucune écriture en base (base relue identique), `Terminer` dans le même état de disponibilité
**And** le focus VoiceOver revient à la tuile du Média (H13).

**AC5 — Aucun effet sur l'Exécution (FR-21-04, FR-21-05).**
**Given** le diff de la story
**When** il est relu
**Then** aucun module du moteur d'Exécution n'est créé, importé ni modifié ; le lecteur appartient au composant de galerie de l'Éditeur ; `Lecture` (désactivé, 4.1, Q34) garde son comportement de départ.

**AC6 — Vidéo illisible ou fichier absent (FR-21-05, FR-21-58).**
**Given** une vidéo dont le fichier est absent ou que le lecteur ne peut pas décoder
**When** Hermann touche sa tuile
**Then** un état d'erreur local s'affiche (texte du lexique), sans exception non capturée ni fermeture de l'Éditeur ; le Brouillon et les autres Médias restent utilisables ; le lien du Média n'est pas supprimé
**And** un test simule l'erreur du lecteur et vérifie l'absence de plantage.

**AC7 — Accessibilité (FR-21-05, FR-22-07, FR-22-09, NFR-09, Q31).**
**Given** VoiceOver actif sur la galerie
**When** Hermann atteint une tuile
**Then** l'activation de la tuile (double toucher) consulte le Média ; l'indication de la tuile annonce « Lire la vidéo » pour une vidéo et « Agrandir le média » pour une photo, puis l'appui long pour le menu, textes du lexique repris par analogie du contrat d'écran d'Exécution (ch. 13 l. 1957), validés par Hermann à la recette (H23)
**And** les actions VoiceOver existantes `Retirer {item}`, `Monter {item}`, `Descendre {item}` restent présentes sur la tuile, bornes exclues, avec leurs effets de départ : elles sont l'alternative à l'appui long (FR-22-09)
**And** la tuile a une cible d'au moins 44 × 44 pt ; les pictogrammes de lecture et de plein écran éventuels sont masqués à l'accessibilité ; aucune lecture automatique ni aucun flash.

**AC8 — Gestes de la tuile et menu à l'appui long (FR-21-02, FR-21-05, FR-22-03, Q31, D-335 amendée, AD-17).**
**Given** une galerie de trois Médias
**When** Hermann fait un appui long sur la tuile du deuxième
**Then** le menu contextuel natif s'ouvre avec `Retirer`, `Monter` et `Descendre` ; sur le premier Média, sans `Monter` ; sur le dernier, sans `Descendre` ; chaque option a l'effet de départ (retrait de l'association seule, FR-21-54 ; déplacement d'un rang)
**And** l'appui long ne lance aucune lecture ni aucun plein écran ; un toucher simple n'ouvre plus le menu
**And** aucun bouton n'est ajouté sur la tuile : les pictogrammes de lecture et de plein écran de `8328:35740`, s'ils sont rendus, sont une indication non touchable, et la tuile entière reste la cible
**And** le commentaire D-335 de `MediaTile` (`ActivityMediaList.tsx:167-172`) est réécrit selon Q31
**And** les tests de non-régression des actions Retirer / Monter / Descendre écrits en 4.4 passent, rejoués avec l'appui long et avec les actions VoiceOver, sans changement de leurs attendus.

**AC9 — Vérification du menu contextuel natif, en ouverture de story (AD-17, NFR-02, NFR-03).**
**Given** le dev client « Routine Dev » sur l'iPhone (Q22) et `@expo/ui` 57.0.13
**When** la story démarre, avant tout autre changement de `MediaTile`
**Then** l'essai sur iPhone vérifie : appui long → menu contextuel natif avec aperçu de la tuile ; toucher simple toujours reçu par le `Pressable` ; galerie horizontale toujours défilable ; résultat consigné dans le fichier de story, sans résultat fabriqué
**And** si l'essai échoue, le repli d'AD-17 s'applique (appui long ouvrant la feuille d'actions native existante) et l'écart avec « menu contextuel natif » est signalé à Hermann avant la suite ; aucun menu n'est réimplémenté en composants React Native.

**Preuves attendues :**
- Consignation de l'essai d'AC9 (voie retenue : menu contextuel natif ou repli signalé).
- Tests : absence de lecture au montage ; lecture au toucher de la tuile (lecteur simulé) ; aucun menu au toucher ; menu à l'appui long, options selon la position ; aucune lecture à l'appui long ; non-régression Retirer / Monter / Descendre (appui long et actions VoiceOver) ; pause et libération au démontage ; plein écran photo ouvert et fermé ; Brouillon identique après fermeture ; erreur du lecteur sans plantage ; libellés, indications et actions d'accessibilité.
- `npm test`, `npx tsc --noEmit` et `npm run lint` verts.
- Scénarios de recette iPhone : `R-4.5-01` (ouvrir l'Éditeur à vidéo : rien ne joue ; toucher la tuile vidéo : plein écran natif, lecture ; fermer : retour à l'Éditeur, Brouillon intact), `R-4.5-02` (toucher la tuile photo : plein écran, fermeture), `R-4.5-03` (vidéo au fichier absent, si reproductible, sinon `NON VÉRIFIABLE` consigné), `R-4.5-04` (VoiceOver sur la galerie : activation, indication, actions Retirer / Monter / Descendre), `R-4.5-05` (appui long sur la première, une médiane et la dernière tuile : menu contextuel natif, options selon la position, aucune lecture ; retirer et réordonner ; toucher simple sans menu). Rattachés en 4.6 à `R-41`, `R-51` et `R-52`.
- Rappel NFR-04 : le plein écran natif et le menu contextuel natif n'ont pas de frame ; leur rendu est jugé par Hermann.
**Rappels E4 :** NFR-02, NFR-03, NFR-04, NFR-09, NFR-14.
**Hors story :** toute lecture pendant l'Exécution (moteur, ducking, changement de face : FR-21-04, hors périmètre) ; toute bibliothèque de visionneuse ; tout zoom ou navigation entre Médias en plein écran ; tout bouton ajouté sur la tuile ; toute option nouvelle dans le menu des Médias.

---

### Story 4.6 : Fidélité, accessibilité et recette finale de l'Éditeur

En tant que Hermann (utilisateur de KODJO),
je veux un Éditeur, une Feuille et des référentiels conformes état par état, utilisables avec VoiceOver, le texte agrandi et sans geste exclusif, et une liste complète de scénarios pour les recetter,
afin de valider PRE-4 sur mon iPhone en sachant exactement quoi regarder.

**Exigences :** FR-22-01, FR-22-02, FR-22-03, FR-22-04, FR-22-05, FR-22-06, FR-22-07, FR-22-09, FR-22-10, FR-22-12 ; FR-20-11 (scénarios des référentiels rattachés à `R-38` à `R-40`, AC11) ; Q31 (alternative au menu d'appui long des Médias, AC8) ; NFR-01 à NFR-04, NFR-08, NFR-09, NFR-10, NFR-11, NFR-14 ; SM-1 ; Q5, Q22 (recette dans le dev client « Routine Dev », après la vérification de compatibilité de 3.1), P30, P33, H13, H23.
**Architecture :** AD-7 (garde-fous des roulettes, popovers natifs), AD-11 (lexique, jetons, `UNSELECTED_OPACITY`), AD-15 (une seule surface ouverte) ; convention « Texte agrandi » de la spine (aucun `maxFontSizeMultiplier` ni `allowFontScaling` à faux, aucune hauteur fixe sur un texte). Fichiers principalement touchés (indicatif) : `ActivityEditorForm.tsx`, `ExerciseScreen.tsx`, `src/features/reference-data/*`, `ActivityMediaList.tsx`, lexique, tests d'accessibilité ; `docs/preparation/PRE-4/bmad/recette-iphone.md` (insertion de la liste de scénarios, pendant le développement).
**Références visuelles :** les 32 frames de la table de 4.22 du PRD.
**Dépend de :** 4.1, 4.2, 4.3, 4.4, 4.5, 3.8.
**Hypothèses non validées :** H9, H13, H18, H20, H23, H24, H25, H29 (attendus de la liste de recette compris) — à confirmer par la revue ChatGPT/Hermann avant développement.
**Critères d'acceptation :**

**AC1 — Conformité état par état des 32 frames (FR-22-01).**
**Given** les tableaux de relevé des stories 3.3 à 3.7 (les 19 frames de la Feuille, relevées selon la règle commune de l'epic 3), 4.2 (7 frames), 4.3 (6 frames) et 4.4 (bloc Médias de `8328:35698` et `8328:35740`, pictogrammes de lecture et de plein écran de la story 4.5 compris)
**When** la story est close
**Then** un tableau de conformité donne, pour chacune des 32 frames, la surface, la story qui en porte le relevé, les états couverts, les écarts restants et leur traitement (signalé, `NON VÉRIFIABLE` ou `À CLARIFIER`) ; une frame sans relevé est un manque bloquant, comblé dans cette story
**And** chaque contrôle est vérifié par état avec ses propriétés observées (composant et variante, jeton, géométrie, typographie, couleurs, effets, comportement adaptatif, frame) ; l'absence ou la substitution d'un élément obligatoire est bloquante ; une ressemblance partielle ne suffit pas
**And** le texte de fond de `8328:38848` qui énumère des Pauses variables n'est pas reproduit (P1) ; une frame de composant n'est jamais promue au rang d'écran ou de modale ; aucun composant absent de Figma n'est inventé
**And** les interactions documentées et les actions accessibles sont présentes dans chaque état
**And** les états exigés sans frame (`Modifier un exercice`, menu D-354, erreur d'import, réordonnancement et retrait d'un Média, N hérité, validation incomplète (fond `#FFF1F0`, Q35), douze Séries avec défilement, phrase longue, Répétitions avec option échec, abandon en modification) sont listés pour validation sur appareil.

**AC2 — Trois preuves séparées (FR-22-02, NFR-04).**
**Given** la clôture de l'epic
**When** les preuves sont consignées
**Then** les résultats des tests automatisés, les comparaisons de captures et la perception sur appareil sont consignés dans trois rubriques distinctes (story et `recette-iphone.md`) ; aucune n'est déduite d'une autre
**And** aucune conformité visuelle ou tactile n'est déclarée à partir d'une suite de tests verte.

**AC3 — Primitives natives et garde-fous (FR-22-03, NFR-02, NFR-03).**
**Given** l'ensemble des surfaces de PRE-4
**When** les tests s'exécutent
**Then** `DurationWheelPicker.test.tsx` et `NumberWheelPicker.test.tsx` gardent leurs assertions de zéro `ScrollView` sur iOS, inchangées et vertes
**And** les tests d'AD-7 (aucune `Modal` ni `Pressable` de substitution pour chaque popover) sont verts
**And** la roulette dont le bloc minutes-secondes est en Grisé manipulable n'est pas désactivée nativement (aucun `disabled`)
**And** le diff de PRE-4 ne remplace aucun mécanisme accepté (glisser des lignes, menus natifs des Médias, roulettes) ; tout écart de rendu natif est signalé (P33).

**AC4 — Cibles tactiles (FR-22-04, P30).**
**Given** chaque contrôle de l'Éditeur, de la Feuille, des Sélecteurs et des référentiels
**When** ses dimensions effectives (dessin et `hitSlop`) sont mesurées par test
**Then** chaque cible fait au moins 44 × 44 pt, sans chevauchement, avec 8 pt entre cibles adjacentes ; les cibles de 48 × 48 (fermeture, actions circulaires, Disclosure) sont conservées
**And** la poignée (12 × 18), les cellules (76 × 24) et l'option échec (30 de haut) ont une cible d'au moins 44 × 44 sans que leur dessin soit agrandi.

**AC5 — Texte agrandi (FR-22-05).**
**Given** le texte du système à 100 %, 135 % et environ 200 %
**When** l'Éditeur, la Feuille, les Sélecteurs et les référentiels sont rendus
**Then** le texte suit le réglage, sans réduction automatique ; aucune hauteur fixe ne rogne un texte, la Phrase des paramètres ou les commandes ± ; l'en-tête de la Feuille reste accessible
**And** un test vérifie qu'aucun `maxFontSizeMultiplier` ni `allowFontScaling={false}` n'apparaît dans ces surfaces ; les noms de Zones du bandeau ne sont pas tronqués sans que leur liste complète reste lisible par l'accessibilité.

**AC6 — Largeurs d'écran (FR-22-06).**
**Given** les largeurs 360, 390, 402, 430 et 440 (FR-22-06 : 360, 402 et 440 de NFR-09, plus 390 et 430)
**When** les surfaces sont rendues par test, clavier ouvert et fermé
**Then** aucun chevauchement, aucune action essentielle masquée, aucun contenu sous le clavier ou les barres système, aucun débordement horizontal
**And** seule exception : `Terminer` reste sous le clavier ouvert (FR-02-08)
**And** en recette, la largeur de l'iPhone de Hermann est consignée ; les largeurs qu'aucun appareil disponible ne permet d'observer sont inscrites `NON VÉRIFIABLE` sur appareil, sans mesure fabriquée.

**AC7 — VoiceOver dans l'Éditeur (FR-22-07, H13, H23).**
**Given** VoiceOver actif sur l'Éditeur
**When** Hermann parcourt l'écran
**Then** l'ordre de lecture est : en-tête → Nom → accès Catégorie et Zones → Description → Carte Paramètres d'exécution → Médias → `Terminer`
**And** le champ Nom, le champ Description, l'action de fermeture et chaque accès ont un libellé accessible ; les accès annoncent la Catégorie et les Zones choisies
**And** la Carte a un seul focus, dont le libellé commence par `Modifier les paramètres d’exécution` et lit ensuite la Phrase en entier, selon la composition de 4.2 AC6 ; aucune valeur estimée n'est annoncée comme saisissable ; le focus revient à la Carte à la fermeture de la Feuille
**And** les textes d'annonce nouveaux sont des clés du lexique, validées par Hermann à la recette (H23).

**AC8 — Alternatives aux gestes (FR-22-09).**
**Given** chaque action qui demande un glisser ou un maintien : réordonner ou retirer une Série du Tableau des séries variables, régler une valeur au-delà du pas simple, réordonner ou retirer un Média (menu ouvert par appui long depuis Q31), ouvrir le menu d'appui long d'une Catégorie ou d'une Zone
**When** Hermann utilise VoiceOver, ou n'utilise ni glisser ni maintien
**Then** chaque action reste possible : actions accessibles existantes de la Feuille (`Monter la série {n}`, `Descendre la série {n}`, libellés de `src/shared/i18n/index.ts:43-44`, conservés par 3.6 AC8 et annoncés selon 3.8 AC2 ; retrait par la croix, qui est un simple appui) et des Médias (actions VoiceOver `Retirer {item}`, `Monter {item}`, `Descendre {item}`, alternative au menu `Retirer` / `Monter` / `Descendre` ouvert par appui long, `index.ts:92-99`, Q31 ; 4.5 AC7, AC8), et, pour les référentiels, une action accessible équivalente à l'appui long qui ouvre le menu ✕ / `Modifier` / `Supprimer` (absente du code de départ, ajoutée par cette story)
**And** la poignée a une alternative accessible ; la forme exacte de chaque alternative est consignée.

**AC9 — Référentiels accessibles (FR-22-10).**
**Given** VoiceOver actif sur une feuille de référentiel
**When** Hermann choisit, crée, modifie ou supprime une entrée
**Then** chaque option annonce son nom et son état sélectionné ; la couleur d'une Catégorie est toujours accompagnée de son nom ; les actions ont des libellés accessibles ; toutes les Zones sélectionnées sont lisibles
**And** le focus est confiné à la feuille ou au dialogue ouvert ; il va au dialogue à son ouverture, puis revient à la liste
**And** l'action ↑ inactive (nom vide) est perçue comme désactivée autrement que par la couleur (`accessibilityState.disabled`)
**And** à la fermeture d'une feuille de référentiel, le focus revient à l'accès Catégorie ou Zones qui l'a ouverte.

**AC10 — États, appuis et lexique (FR-22-12, NFR-08, NFR-10).**
**Given** les contrôles de l'Éditeur et des référentiels
**When** ils sont actifs, pressés, désactivés, sélectionnés ou destructifs
**Then** ces états passent par des jetons sémantiques et jamais par la seule couleur (état d'accessibilité ou forme associés)
**And** l'appui dilate au contact, agit au relâchement, et n'agit pas si le doigt sort de la cible ; avec « Réduire les animations », le rendu passe par l'opacité seule
**And** tous les textes, libellés d'accessibilité compris, passent par le lexique ; un test parcourt les surfaces de PRE-4 et refuse tout texte en dur et tout terme interdit (« Activité » à l'interface, « Set » comme terme métier, « Modalités d’exécution »).

**AC11 — Liste complète des scénarios de recette (SM-1, FR-22-02, FR-20-11, Q5).**
**Given** la liste ci-dessous, rédigée avant le développement
**When** la story est développée
**Then** cette liste est insérée dans `docs/preparation/PRE-4/bmad/recette-iphone.md` (nouvelle section, au format du §3 : ID, ED et story, préconditions, gestes, attendu fonctionnel, attendu visuel, résultat) ; les scénarios `R-x.y-zz` des stories 1.1 à 4.5 y sont rattachés par la colonne « Rattachement » ; un scénario de story absent de la liste y est ajouté, jamais retiré
**And** chaque ED d'ED-01 à ED-22 a au moins un scénario, et la matrice ED × parcours ci-dessous est complète
**And** la colonne « Résultat » reste vide jusqu'à la recette de Hermann ; aucun résultat n'est pré-rempli. La recette se joue dans le dev client « Routine Dev » (Q22), après la vérification de compatibilité de 3.1 (`R-3.1-00`) ; si un nouveau build est nécessaire, il est signalé à Hermann.

**Preuves attendues :**
- Tableau de conformité des 32 frames (AC1) ; liste des états sans frame.
- Tests : garde-fous zéro `ScrollView` et popovers natifs (AC3) ; dimensions de cibles (AC4) ; absence de réduction du texte (AC5) ; rendu aux cinq largeurs (AC6) ; ordre et libellés VoiceOver (AC7, AC9) ; actions accessibles des référentiels (AC8) ; lexique et termes interdits (AC10).
- `npm test`, `npx tsc --noEmit` et `npm run lint` verts.
- Scénarios de recette iPhone : la liste complète ci-dessous (`R-01` à `R-52`), insérée dans `recette-iphone.md` ; scénarios propres à la story : `R-4.6-01` (VoiceOver dans l'Éditeur), `R-4.6-02` (texte agrandi), `R-4.6-03` (largeur de l'appareil), `R-4.6-04` (alternatives aux gestes), `R-4.6-05` (référentiels avec VoiceOver), rattachés à `R-42` à `R-48`.
- Rappel NFR-04 : la recette de Hermann est la seule preuve visuelle et tactile ; le journal de comparaison consigne ses résultats sans en fabriquer (Q6).
**Rappels E4 :** NFR-02, NFR-03, NFR-04, NFR-09, NFR-14.
**Hors story :** l'accessibilité propre à la Feuille et aux Sélecteurs (FR-22-08, FR-22-11, en 3.8), dont cette story n'inclut que la vérification de conformité (AC1) et les scénarios ; l'exécution de la recette elle-même (Hermann) ; tout rendu Android ou web (Q5).

#### Liste des scénarios de recette iPhone (à insérer dans `recette-iphone.md`)

Notation des parcours : CC, MC, CS, MS (voir les conventions de l'epic). « ×4 » : à exécuter dans les quatre parcours. Préconditions de données : `recette-iphone.md` §2, procédure de la story 1.4. Attendus visuels : frames de `references-figma.json` ; aucun chiffre lu sur une capture n'est un attendu fonctionnel (NFR-01). Les écarts entre rendu natif et Figma sont relevés, jamais corrigés par remplacement (P33).

| ID | ED · stories | Parcours | Préconditions et gestes | Attendu fonctionnel (source) | Attendu visuel | Rattachement |
|---|---|---|---|---|---|---|
| R-01 | ED-01 · 4.1 | CC | Catalogue > Exercices, filtre actif, liste défilée. Deux appuis rapides sur `Créer` ; ✕ sans saisie. | Un seul Éditeur, titre `Créer un exercice`, sans écran intermédiaire ; sortie immédiate ; filtre et défilement restaurés ; aucun Exercice créé (FR-01-01). | `8328:35698` | R-4.1-01 |
| R-02 | ED-01 · 4.1, 4.2 | CC | Saisir nom, Catégorie, une Zone, Paramètres (Durée, 3 × 30 s, Pause 10 s) ; ✓ ; `Terminer` ; rouvrir la carte. | Retour à Catalogues / Exercices ; carte présente ; réouverte, titre `Modifier un exercice`, tout identique (FR-01-05, FR-01-07). | `8328:37022` | R-4.1-01 |
| R-03 | ED-01 · 4.1 | MC | Toucher une carte hors Lecture ; modifier une Cible ; `Terminer` ; puis toucher Lecture. | Éditeur en modification, données et Médias dans l'ordre ; relecture identique ; Lecture reste désactivé et son appui n'ouvre pas l'Éditeur (FR-01-02, Q34). | — (aucune frame « Modifier ») | R-4.1-02 |
| R-04 | ED-01, ED-19 · 4.1, 1.3 | MS | Composition : ajouter un Exercice existant ; appui long sur sa carte ; appui court ; changer une Cible ; `Terminer` ; `Continuer` ; ouvrir la Définition au Catalogue. | Appui long : réorganisation sans Éditeur ; appui court : Éditeur sur la Copie ; retour à Composition ; Définition inchangée ; carte de Composition selon Q17 (FR-01-03, FR-01-06, FR-19-03). | — | R-4.1-03 |
| R-05 | ED-01 · 4.1 | CS | Composition : `Ajouter un exercice` → `Un nouvel exercice` ; remplir ; `Terminer` ; `Continuer`. | Choix `Un nouvel exercice` / `Un exercice existant` / `Annuler` ; titre `Créer un exercice` ; Exercice placé en fin de liste, absent du Catalogue ; aucune Récupération ajoutée (FR-01-03, FR-01-08). | — | R-4.1-04 |
| R-06 | ED-01, ED-11, ED-12 · 4.1 | ×4 | Exercice Durée variables 30 s / 45 s / à l'échec, Pauses 10 / 20 / 30 s, bilatéral, Bip 2 s ; basculer en Répétitions puis revenir ; déplacer la Série 3 en tête ; N = 1 puis 3 ; ✓ ; `Terminer` (et `Continuer`) ; fermer, rouvrir. | Relecture identique de tous les champs ; Définition et Copie indépendantes (FR-01-07). | — | R-4.1-05 |
| R-07 | ED-02 · 4.2 | CC, CS | Ouvrir l'Éditeur vide. | Ordre en-tête → bandeau → Description → Carte → Médias → `Terminer` ; libellé `Paramètres d’exécution` ; Carte vide sans invite (Q55) ; placeholder `Nom de l’exercice` ; accès `Catégorie` et `Zone corporelle` ; `Terminer` inactif ; aucun « Modalités d’exécution » ; aucun bouton ni nom du Mode à droite du titre de la Carte, Carte à zone touchable unique (FR-02-02, FR-02-05, FR-02-06, FR-02-09 ; Q23). | `8328:35698`, `8328:36711`, `8328:36853` | R-4.2-01 |
| R-08 | ED-02 · 4.2 | CC | Saisir nom et description ; ajouter un Média ; pendant la saisie, toucher ↑. | Description au-dessus du clavier, curseur visible ; ↑ ferme le clavier sans enregistrer ; `Terminer` reste en bas sous le clavier puis réapparaît (FR-02-07, FR-02-08). | `8328:35740` | R-4.2-02 |
| R-09 | ED-02, ED-16 · 4.2, 2.3 | ×4 | Valider la Feuille sur un Exercice de phrase longue ; toucher la Carte à plusieurs endroits. | Une seule Phrase, valeurs et unités en gras, entière, sans troncature ; lignes `Compte à rebours` et `Fin d’exercice` séparées ; tout point de la Carte ouvre la Feuille (FR-02-06, P17). | `8328:37022` (lignes Compte à rebours et Fin : `NON VÉRIFIABLE`) | R-4.2-03 |
| R-10 | ED-02 · 4.2 | CC, CS puis MC, MS | Modifier un champ, puis ✕ : `Annuler`, puis ✕ : `Confirmer`. | Création : `Abandonner la création ?` / `Les informations saisies seront perdues et l’exercice ne sera pas créé.` ; modification : `Abandonner les modifications ?` / `Les modifications apportées à cet exercice seront perdues.` ; `Annuler` conserve tout ; `Confirmer` quitte sans enregistrer (FR-02-12, Q18). | `8328:36781` (textes remplacés par Q18) | R-4.2-05 |
| R-11 | ED-02 · 4.2 | CC | Nom de 80 caractères puis tentative d'un 81e ; retirer la Catégorie ; retirer la dernière Zone ; ouvrir un Exercice ancien à Cible 5999 s non modifiée. | `Terminer` inactif tant qu'une condition manque ; la saisie s'arrête à 80 ; l'Exercice ancien reste enregistrable sans modifier la valeur (FR-02-09, H25). L'erreur d'écriture, non reproductible sans outil, est couverte par les tests et inscrite `NON VÉRIFIABLE` sur appareil si elle ne peut être provoquée. | — | R-4.2-04 |
| R-12 | ED-02, ED-22 · 4.2 | CC | Comparer chaque bloc, dans chaque état disponible, au tableau de relevé de 4.2. | Typographie, couleurs, contour, ombre conformes au relevé ; écarts listés et jugés par Hermann (FR-02-13). | 7 frames de 4.2 | R-4.2-06 |
| R-13 | ED-03 · 3.3 | ×4 | Toucher la Carte ; modifier un réglage ; ✕ ; rouvrir ; refaire avec « Réduire les animations ». | Voile en fondu, Feuille montant du bas (en place avec réduction) ; en-tête ✕ / `Paramètres d’exécution` / ✓ fixe ; ordre du corps de FR-03-02 ; ✕ rend l'Éditeur inchangé ; focus revenu à la Carte (FR-03-01 à FR-03-03). | `8328:36923` | R-3.3-06 |
| R-14 | ED-03, ED-05 · 3.3 | ×4 | Ouvrir le popover `Mode d’exécution` ; appui extérieur ; rouvrir ; choisir `Répétitions`. | Exactement `Durée` puis `Répétitions` ; appui extérieur ferme sans appliquer ; une seule surface ouverte ; ligne déclenchante désignée active (FR-03-06, FR-03-10, FR-05-01). | `8328:37092`, `8328:38513` | R-3.1-01, R-3.3-01 |
| R-15 | ED-03 · 3.3 | CC | Popover `Changement de côté` ; VoiceOver sur les options. | Options `Sans changement`, `Droite puis gauche`, `Gauche puis droite` ; directions annoncées en toutes lettres ; aucun segmenté (FR-03-07). | `8328:37972` | R-3.3-02, R-3.8-01 |
| R-16 | ED-03, ED-12 · 3.3 | CC | Bilatéral ; popover `Ordre des côtés` ; puis N = 1. | Ligne présente en bilatéral seulement ; `Un côté après l’autre` et `Les deux côtés à chaque série` ; à N = 1 ligne masquée ; l'Ordre choisi est conservé et réaffiché dès N ≥ 2 — source : Q38 (FR-03-08, FR-12-04). | `8328:38953`, `8328:39072`, `8328:38193`, `8328:38301` | R-3.3-02, R-3.3-03 |
| R-17 | ED-04 · 3.3, 3.6 | CC, MC | Popover de Régime : `variables` ; replier par le chevron ; mettre 3 × 30 s / Pause 10 s ; ✓ ; `Terminer` ; rouvrir. | Deux entrées `identiques` / `variables` ; aucun interrupteur ; replier ne change rien ; Régime `variables` conservé malgré des valeurs égales (FR-04-01, FR-04-02, FR-04-05). | `8328:39390`, `8328:39181` | R-3.3-03, R-3.6-07 |
| R-18 | ED-05, ED-11 · 3.2, 3.3 | CC | Durée variables 30 s / 45 s / à l'échec ; passer en Répétitions ; tenter ✓ ; revenir en Durée. | N, Pauses, Bip, côtés, Compte à rebours, Fin conservés ; 30 s et 45 s → `—` sur fond `#FFF1F0`, sans contour (Q35), sans message ; échec conservé ; ✓ indisponible ; retour en Durée : 30 s, 45 s, à l'échec (FR-11-03, FR-11-04 ; UJ-1). | — | R-3.3-01, R-3.6-07 (règles du domaine de 3.2) |
| R-19 | ED-06, ED-10 · 3.6 | CC | Tableau en Durée, Répétitions, puis tout à l'échec et mixte. | Cellules `30 s`, `12 rép.`, `à l’échec` ; deux colonnes même tout à l'échec (FR-06-05, FR-10-01). | `8328:38632`, `8328:38741`, `8328:38848` (texte de fond non repris, P1), `8470:13303` | R-3.6-01, R-3.6-02 |
| R-20 | ED-07 · 3.4 | ×4 | Toucher `Durée d’une série` ; faire défiler minutes et secondes jusqu'aux bornes. | Option `Aucune durée, à l’échec` en tête, filet, roulette minutes-secondes ; minutes 00 à 58 sans rebouclage ; à 58 secondes jusqu'à 55 ; secondes au pas de 1 s (Q36) ; haptique à chaque cran ; ✕ / ✓ propres (FR-07-02, FR-07-05, FR-07-06). | `8328:37862` | R-3.4-01, R-3.4-04 |
| R-21 | ED-07, ED-08 · 3.5 | ×4 | Répétitions : toucher `Nombre de répétitions` ; tourner vers 12 ; revenir en tête. | Une colonne : `Aucune répétition, à l’échec`, puis 1 à 100 ; 12 sélectionne 12 ; la tête sélectionne l'échec ; aucun grisé ajouté (FR-07-03, FR-08-03 ; Q8, Q14). | — (état sans frame) | R-3.5-01 |
| R-22 | ED-08 · 3.4 | CC | Scénario FR-08-05 : ouvrir sur 30 s ; toucher l'option ; tourner vers 00:30 ; ✓ ; rouvrir ; choisir l'échec ; ✓ ; rouvrir ; changer puis ✕. | Option à 45 % puis 100 %, bloc `00:00` à 45 % manipulable sans déverrouillage ; réouvertures fidèles ; ✕ restaure (FR-08-01, FR-08-02, FR-08-05). | `8328:37862` | R-3.4-01 |
| R-23 | ED-08 · 3.4 | CC | Cible numérique ; amener la roue sur `00:00`. | ✓ du Sélecteur indisponible ; aucune conversion en échec (FR-08-04, Q15). | — | R-3.4-02 |
| R-24 | ED-09 · 3.4, 3.6, 1.4 | MC | Exercices anciens : Cible 7 s, Cible 5999 s, Cible 150 rép., Bip 11. Ouvrir le Sélecteur puis ✕ ; ± du Pied ; enregistrer sans modifier. | 7 s, valide depuis Q36 : ouvert sur 00:07, non signalé ; + → 8 s, − → 6 s ; 5999 s : ouvert sur 58:55, ✕ → 5999 s ; + indisponible, − → 3535 s ; 150 : ouvert sur 100 ; valeurs non modifiées enregistrables (FR-09-04, FR-09-05 ; Q21, P38, H25). | — | R-3.4-03, R-3.5-02, R-3.6-05, R-1.1-02 |
| R-25 | ED-09, ED-10 · 3.6 | CC | Toucher une cellule de Pause, puis une cellule de Cible ; ± du Pied ; cellule à l'échec ; cellule `—`. | Une seule Cellule active : barre, fond de colonne, Pied `Série 1 · Durée` ; Cible Durée au pas de 1 s dans 5 à 3535 s (Q36) ; Pause 0 à 300 s ; ± indisponibles sur une cellule à l'échec ; cellule `—` sur fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35), sans message (FR-10-02, FR-10-04, FR-10-06). | `8328:38632` | R-3.6-01, R-3.6-07 |
| R-26 | ED-10, ED-12, ED-22 · 3.6 | CC | Glisser la poignée de la Série 3 en tête ; puis VoiceOver : action `Monter la série {n}`. | Corps immobile, repère d'insertion bleu Kodjo de 2 ; renumérotation ; nouvelle dernière ligne porteuse de PN ; même déplacement par action accessible (FR-10-07, FR-12-03, FR-22-09). | `8328:39279` | R-3.6-03 |
| R-27 | ED-11 · 3.2 | CC | Modifier Mode, Régime, N, une Cible, déplacer une ligne ; ✕ ; refaire puis ✓ ; rouvrir et passer en `variables`. | ✕ annule toute l'ouverture ; ✓ applique d'un bloc, Phrase régénérée, rien en base ; Réserve vidée après ✓ (FR-11-01, FR-11-02). | — | R-3.3-06, R-3.6-06 (règles du domaine de 3.2) |
| R-28 | ED-12 · 3.6 | CC | N 5 → 3 → 5 ; N à 99 ; croix sur la Série 2 puis `Annuler` ; N = 1. | Lignes 4 puis 5 restaurées dans l'ordre ; N borné à 99 ; « Série supprimée — Annuler » restaure position, Cible et Pause ; croix indisponible à N = 1 ; Régime non modifiable à N = 1 (FR-12-01, FR-12-02, FR-12-04, FR-12-05). Champ de N ouvert, −, puis toucher une cellule de Cible : champ de N resté ouvert après −, puis fermé et cellule activée avec son Sélecteur d'un seul geste (FR-03-05, FR-10-05). | `8328:39072` | R-3.6-04, R-3.6-06, R-3.6-09 |
| R-29 | ED-13 · 3.7, 2.1 | CC | Composer : Durée 30 / 45 / échec, Pauses 10 × 3 ; Répétitions 10 / 12 / échec, Bip 2 s puis 0 ; tout à l'échec ; Durée 30 / 45 / 60. | `≥ 1 min 45 s` ; `≥ 1 min 14 s` ; Bip 0 : aucune ligne Durée totale ; tout échec : aucune ligne ; `2 min 45 s` exact (FR-13-02, FR-13-03 ; R01 à R04). | `8470:13303` (montant non repris de la capture) | R-3.7-02, R-3.7-03, R-2.1-01 |
| R-30 | ED-14 · 3.7 | CC | Durée identiques d = 30 s, p = 10 s : roulette de Durée totale sur 160 s puis 180 s ; `Annuler` du message ; puis une Cible à l'échec. | 160 s → N = 4, aucun message ; 180 s → N = 5, `Durée ajustée à 3 min 20 s pour respecter un nombre entier de séries.` avec `Annuler` qui restaure ; roulette sans option échec ; avec échec : aucune Inversion, total ≥ en lecture seule (FR-14-01 à FR-14-04). | `8328:38084`, `8328:38409` | R-3.7-01, R-3.7-02 |
| R-31 | ED-15 · 2.4, 1.3 | MC, MS | Cartes Catalogue et Composition des Exercices de R-29 ; ajouter une Récupération positive en Composition. | Catalogue : `≥ 1 min 45 s` ; Répétitions Bip 0 : aucune ligne de durée ; exact 165 s : `2 min 45 s`, comme avant la mise à jour ; résumé `3 séries variables` ; tout échec `3 séries à l’échec` (Q24) ; jamais `0 s` ni `0 rép.` ; Composition : partiel en `≥` minutes et secondes, exact et estimé inchangés ; Récupération remplaçant la Pause terminale dans la durée d'occurrence (FR-15-02, FR-15-06 ; Q17, Q20, P41, H20). | — | R-2.4-01 à R-2.4-05 |
| R-32 | ED-16 · 2.3 | CC | Afficher la Phrase des Exercices de R-29 et un mélange de 4 Cibles. | `3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec). Durée totale : ≥ 1 min 45 s.` ; `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec), cadencées toutes les 2 s. Durée totale : ≥ 1 min 14 s.` ; `4 séries variables, de 30 s à l’échec. Durée totale : ≥ 2 min 55 s.` ; tout échec : `3 séries menées jusqu’à l’échec`, identique dans les deux Modes ; valeurs et unités en gras (FR-16-02, FR-16-07 à FR-16-10 ; Q16, H9, H18). | `8470:13303` | R-2.3-01, R-2.3-03, R-2.3-04 |
| R-33 | ED-17, ED-18 · 2.3, 1.1 | MC | Ancien Exercice « À l’échec » (données de départ) : comparer sa Phrase avant et après la mise à jour ; afficher la phrase la plus longue. | Phrase identique (ex. `3 séries menées jusqu’à l’échec`) ; phrase la plus longue entière (FR-17-03, FR-17-05 ; UJ-2). | — | R-2.3-01, R-2.3-02, R-1.1-01 |
| R-34 | ED-18, ED-21 · 1.1, 1.4 | MC, MS | Installation à données de `c32e360d` (§2) ; mettre à jour ; ouvrir chaque Exercice, Copie, Média, Catégorie, Zone. | Rien de perdu ; ancien À l'échec → Répétitions, toutes Cibles à l'échec ; Pauses, côtés, Bip, Médias et ordre inchangés (FR-18-10, FR-18-11, FR-21-57 ; SM-2). | — | R-1.4-01, R-1.4-03 |
| R-35 | ED-18 · 1.2, 1.4 | — | Installation contenant un Exercice illisible (Q19) ; premier lancement après la mise à jour ; quitter sans toucher le bouton et relancer ; toucher le bouton ; relancer. | Exercice écarté ; message d'information unique avec le nombre écarté, un seul bouton ; de nouveau présent si l'application a été quittée avant le bouton, absent après fermeture par le bouton ; sa Séance reste visible et ouvrable (P39) ; autres données intactes (FR-18-20 ; H24). | — | R-1.2-01, R-1.2-02, R-1.4-02 |
| R-36 | ED-18, ED-09 · 1.1, 3.4 | MC | Exercice ancien Bip 11 et Cible 5999 s : `Terminer` sans les modifier ; rouvrir ; modifier la Cible. | Réenregistré tel quel ; la modification impose une valeur dans les bornes, à la seconde (Q36) (FR-09-05, FR-18-06, FR-18-07 ; H25). | — | R-1.1-02 |
| R-37 | ED-19, ED-21 · 1.3 | MS | Copier une Définition mixte à deux Médias dans une Séance ; modifier la Copie ; dupliquer l'occurrence (parcours existant) ; copier une Définition à Cible à renseigner et tenter `Continuer`. | Copie complète, Cibles typées et Médias ordonnés conservés ; Définition inchangée ; duplication fidèle ; Cible à renseigner : ajout permis, `Continuer` refusé (FR-19-01 à FR-19-08 ; H29). | — | R-1.3-01, R-1.3-02, R-1.3-03 |
| R-38 | ED-20 · 4.3 | ×4 | Feuille Catégories : marquer, ✓ ; rouvrir, marquer une autre, ✕ ; créer par ↑ (clavier ouvert) ; nom vide ; nom dupliqué ; recolorer. | Toucher marque, ✓ affecte, ✕ conserve ; création sans fermer clavier ni feuille ; ↑ inactif sans message ; doublon selon le code de départ ; 12 couleurs (FR-20-02, FR-20-06, FR-20-07). | `8328:35810`, `8328:36056`, `8328:36278` | R-4.3-01 |
| R-39 | ED-20 · 4.3 | CC, MC | Feuille Zones : 0, 1, puis N Zones ; ✓ ; ✕ ; créer une Zone ; liste longue. | Bascule par appui ; ✓ applique ; ✕ restaure ; au moins une Zone exigée ; noms des Zones dans le bandeau ; feuille jusqu'au bord de la zone de contexte (FR-20-03 à FR-20-05). | `8328:36348`, `8328:36536` | R-4.3-02, R-4.3-05 |
| R-40 | ED-20 · 4.3 | MC | Clavier ouvert : appui long sur une entrée ; ✕ ; `Modifier` (renommer) ; `Supprimer` une entrée utilisée, une valeur initiale ; ancienne affectation retirée ; Profil homme puis femme. | Menu ✕ / `Modifier` / `Supprimer`, clavier conservé ; identifiant conservé ; textes `Supprimer « {nom} » ?` et `Cette catégorie ne sera plus proposée…` ; affectation retirée enregistrable, nouvelle affectation impossible ; une seule silhouette, celle du Profil (FR-20-08, FR-20-09, FR-02-05). | `8328:35932`, `8328:36441` (antérieures à D-354 ; menu `NON VÉRIFIABLE`) | R-4.3-03, R-4.3-04 |
| R-41 | ED-21 · 4.4, 4.5 | ×4 | Ajouter une photo et une vidéo ; réordonner, retirer par le menu ouvert par appui long sur la tuile (menu contextuel natif, Q31), puis par les actions VoiceOver ; vérifier qu'un toucher simple n'ouvre pas le menu ; annuler un import ; `Terminer` ; relancer l'application ; rouvrir ; regarder la carte du Catalogue. | Dernière position à l'ajout ; ordre et identité relus ; import annulé sans effet ; vignette = premier Média ; Copie indépendante ; erreur d'import et réessai si reproductible, sinon `NON VÉRIFIABLE` ; menu `Retirer` / `Monter` / `Descendre` à l'appui long, options selon la position, sans lecture ; mêmes effets par VoiceOver (FR-21-01 à FR-21-03, FR-22-09 ; Q31). | `8328:35698`, `8328:35740` ; menu contextuel natif sans frame (`NON VÉRIFIABLE`) | R-4.4-01 à R-4.4-04, R-4.5-05 |
| R-42 | ED-22 · 4.6 | ×4 | VoiceOver : balayer l'Éditeur ; ouvrir et fermer la Feuille. | Ordre en-tête → Nom → accès → Description → Carte → Médias → `Terminer` ; Carte : un focus, libellé `Modifier les paramètres d’exécution` suivi de la Phrase lue entière (4.2 AC6) ; focus revenu à la Carte (FR-22-07). | — | R-4.6-01 |
| R-43 | ED-22 · 3.8 | CC | VoiceOver dans la Feuille et les deux Sélecteurs. | Focus confiné ; ✕ et ✓ libellés ; Régime variables annoncé ; Cellule active `Série i · Durée` ; option échec sélectionnée / non sélectionnée ; ≈ « estimation », ≥ « total prévisionnel partiel » ; `Bip de cadence` et `Aucun` ; actions `Monter la série {n}` et `Descendre la série {n}` annoncées (FR-22-08, FR-14-05 ; H23). | — | R-3.8-01, R-3.1-03, R-3.4-05, R-3.5-03, R-3.7-04 |
| R-44 | ED-22 · 4.6, 3.8 | CC | Texte du système à 100 %, 135 %, ≈ 200 % : Éditeur, Feuille, Sélecteurs, référentiels. | Aucune troncature, Phrase entière, ± visibles, en-tête de Feuille accessible (FR-22-05). | — | R-4.6-02, R-3.8-03 |
| R-45 | ED-22 · 4.6 | CC | Consigner modèle et largeur de l'iPhone ; parcourir les surfaces, clavier ouvert et fermé. | Aucun chevauchement ni action masquée ni débordement ; `Terminer` sous le clavier seul admis ; autres largeurs `NON VÉRIFIABLE` sur appareil (FR-22-06). | — | R-4.6-03 |
| R-46 | ED-22 · 4.6, 3.8 | CC | Toucher les petites cibles (poignée, cellules, option échec, ✕ des feuilles) ; ouvrir une roulette et tenter `Terminer`. | Cibles fiables d'au moins 44 × 44 ; roulette ouverte : actions extérieures inactives (FR-22-04, FR-22-11). | — | R-4.6-04, R-3.8-02 |
| R-47 | ED-22 · 4.6 | CC | Sans glisser ni maintien, avec VoiceOver : réordonner une Série, un Média ; ouvrir le menu d'une Catégorie. | Chaque action possible par une action accessible : `Monter la série {n}` / `Descendre la série {n}` ; `Monter {item}` / `Descendre {item}` ; action équivalente à l'appui long d'une Catégorie (FR-22-09). | — | R-4.6-04, R-3.6-03 |
| R-48 | ED-22 · 4.6 | CC | VoiceOver dans les feuilles de référentiel ; ↑ avec nom vide ; fermer la feuille. | Nom et état annoncés ; couleur toujours accompagnée du nom ; ↑ annoncé désactivé ; focus revenu à l'accès (FR-22-10). | — | R-4.6-05 |
| R-49 | ED-22 · 4.6 | CC | « Réduire les animations » actif : Feuille, popovers, feuilles de référentiel ; appuyer puis glisser le doigt hors d'un bouton. | Apparitions et fermetures sans animation de déplacement ; appui sans action si le doigt sort ; états non portés par la seule couleur (FR-22-12, NFR-10). | — | R-4.6-04 |
| R-50 | ED-01 à ED-22 · 4.6 | ×4 | Passe de contrôle dans chacun des parcours CC, MC, CS, MS : ouvrir l'Éditeur, la Feuille, le popover Mode, un Sélecteur, le tableau, une feuille de référentiel, ajouter un Média ; `Terminer`. | Mêmes surfaces et même comportement dans les quatre parcours ; effet de `Terminer` selon le contexte (FR-01-03, FR-01-05). | — | — |
| R-51 | ED-21, ED-22 · 4.5 | ×4 | Exercice à une vidéo et une photo ; modifier le nom sans `Terminer` ; ouvrir l'Éditeur et attendre ; toucher la tuile de la vidéo ; mettre en pause, fermer le plein écran ; toucher la tuile de la photo ; fermer ; appui long sur la vidéo ; puis `Lecture` depuis le Catalogue (MC). | Aucune lecture ni aucun son à l'ouverture ; vidéo lue seulement au toucher de sa tuile, en plein écran natif, contrôles du système ; photo entière en plein écran ; appui long : menu, aucune lecture ; aucun bouton sur la tuile ; retour à l'Éditeur avec le nom modifié et l'ordre des Médias intacts, rien en base ; `Lecture` inchangée, sans lecture de Média par le moteur (FR-21-05, FR-21-02, FR-21-04 ; Q27, Q31). | `8328:35740` (pictogrammes) ; plein écran natif sans frame (`NON VÉRIFIABLE`) | R-4.5-01, R-4.5-02 |
| R-52 | ED-21, ED-22 · 4.5 | CC | VoiceOver sur la galerie ; vidéo au fichier absent ou illisible, si reproductible. | Activation de la tuile : consultation, annoncée « Lire la vidéo » ou « Agrandir le média » ; actions `Retirer {item}`, `Monter {item}`, `Descendre {item}` toujours proposées (Q31) ; focus revenu à la tuile après fermeture ; vidéo illisible : état d'erreur local, aucun plantage, Brouillon intact ; sinon `NON VÉRIFIABLE` consigné (FR-21-05, FR-21-58 ; H23). | — | R-4.5-03, R-4.5-04 |

**Matrice ED × parcours.** Les scénarios marqués « ×4 » sont exécutés dans les quatre parcours ; R-50 assure une passe complète par parcours.

| ED | CC | MC | CS | MS |
|---|---|---|---|---|
| ED-01 | R-01, R-02, R-06, R-50 | R-03, R-06, R-50 | R-05, R-06, R-50 | R-04, R-06, R-50 |
| ED-02 | R-07 à R-12 | R-09, R-10 | R-07, R-09, R-10 | R-09, R-10 |
| ED-03 | R-13 à R-16 | R-13, R-14 | R-13, R-14 | R-13, R-14 |
| ED-04 | R-17 | R-17 | R-50 | R-50 |
| ED-05 | R-14, R-18 | R-14 | R-14 | R-14 |
| ED-06 | R-19 | R-50 | R-50 | R-50 |
| ED-07 | R-20, R-21 | R-20, R-21 | R-20, R-21 | R-20, R-21 |
| ED-08 | R-21, R-22, R-23 | R-21 | R-21 | R-21 |
| ED-09 | R-25 | R-24, R-36 | R-50 | R-50 |
| ED-10 | R-19, R-25, R-26 | R-50 | R-50 | R-50 |
| ED-11 | R-18, R-27 | R-06 | R-06 | R-06 |
| ED-12 | R-16, R-26, R-28 | R-06 | R-06 | R-06 |
| ED-13 | R-29 | R-50 | R-50 | R-50 |
| ED-14 | R-30 | R-50 | R-50 | R-50 |
| ED-15 | — (carte Catalogue : R-31 en MC) | R-31 | R-50 | R-31 |
| ED-16 | R-32 | R-09 | R-09 | R-09 |
| ED-17 | — | R-33 | — | — |
| ED-18 | — | R-33, R-34, R-36 | — | R-34 |
| ED-19 | — | — | R-05 | R-04, R-37 |
| ED-20 | R-38, R-39 | R-38, R-39, R-40 | R-38 | R-38 |
| ED-21 | R-41, R-51, R-52 | R-41, R-51 | R-41, R-51 | R-41, R-51 |
| ED-22 | R-42 à R-49 | R-42 | R-42 | R-42 |

Les cases « — » sont sans objet : ED-17 et ED-18 portent sur des données antérieures (MC, MS) ; ED-19 porte sur les copies (CS, MS) ; ED-15 porte sur les cartes consommatrices, observées hors de l'Éditeur.

#### Couverture E4

| FR | Story / AC |
|---|---|
| FR-01-01 | 4.1 AC1, AC2 |
| FR-01-02 | 4.1 AC3 |
| FR-01-03 | 4.1 AC4, AC5, AC6 |
| FR-01-04 | 4.1 AC7 |
| FR-01-05 | 4.1 AC8 |
| FR-01-06 | 4.1 AC9 |
| FR-01-07 | 4.1 AC10 |
| FR-01-08 | 4.1 AC11 |
| FR-01-09 | 4.1 AC12 |
| FR-01-10 | 4.1 AC13 |
| FR-02-01 | 4.2 AC2 |
| FR-02-02 | 4.2 AC3 |
| FR-02-03 | 4.2 AC4 |
| FR-02-04 | 4.2 AC5 |
| FR-02-05 | 4.3 AC2 |
| FR-02-06 | 4.2 AC6, AC14 |
| FR-02-07 | 4.2 AC7 |
| FR-02-08 | 4.2 AC8 |
| FR-02-09 | 4.2 AC9 ; 4.3 AC6 |
| FR-02-10 | 4.2 AC10 ; 4.1 AC13 |
| FR-02-11 | 4.2 AC11 |
| FR-02-12 | 4.2 AC12 ; 4.1 AC2 |
| FR-02-13 | 4.2 AC1, AC13 (relevé de 4.3 AC1 et 4.4 AC1 pour les blocs voisins) |
| FR-20-01 | 4.3 AC3 |
| FR-20-02 | 4.3 AC4 |
| FR-20-03 | 4.3 AC5 |
| FR-20-04 | 4.3 AC6 |
| FR-20-05 | 4.3 AC7 |
| FR-20-06 | 4.3 AC8 |
| FR-20-07 | 4.3 AC9 |
| FR-20-08 | 4.3 AC10 |
| FR-20-09 | 4.3 AC11 |
| FR-20-10 | 4.3 AC12 |
| FR-20-11 | 4.3 AC13 ; 4.6 AC11 (R-38 à R-40) |
| FR-21-01 | 4.4 AC2, AC7 |
| FR-21-02 | 4.4 AC1, AC3, AC4, AC7 ; 4.5 AC2, AC3, AC8 (gestes, Q31) |
| FR-21-03 | 4.4 AC5 |
| FR-21-04 | 4.4 AC6 ; 4.5 AC5 |
| FR-21-05 | 4.5 AC1 à AC9 (R-41, R-51, R-52) |
| FR-22-01 | 4.6 AC1 ; 4.2 AC1 ; 4.3 AC1 ; 4.4 AC1 |
| FR-22-02 | 4.6 AC2, AC11 |
| FR-22-03 | 4.6 AC3 ; 4.5 AC2, AC8 |
| FR-22-04 | 4.6 AC4 ; 4.3 AC2 |
| FR-22-05 | 4.6 AC5 |
| FR-22-06 | 4.6 AC6 ; 4.2 AC5 |
| FR-22-07 | 4.6 AC7 ; 4.5 AC7 |
| FR-22-09 | 4.6 AC8 ; 4.5 AC7 (actions VoiceOver des Médias, Q31) |
| FR-22-10 | 4.6 AC9 |
| FR-22-12 | 4.6 AC10 |

**Points signalés par l'epic et leur traitement.**
- **E4-1 (4.1 AC5)** : écart D-194 sur la création dans une Séance, déjà signalé par le PRD (FR-01-03, §9 point 3). **Traité par P8 et Q4** : le comportement PRE-3 accepté est conservé, sans nouveau parcours ; l'écart reste signalé pour la revue, sans changement de comportement.
- **E4-2 (4.2 AC14)** : bouton de Mode à côté du titre de la Carte dans le code de départ. **Tranché par Q23** : retiré ; Carte à zone touchable unique.
- **E4-3 (4.4 AC4)** : bouton plein écran et lecture vidéo de la galerie, mentionnés par le rendu de référence de FR-21-02 et absents du code de départ. **Tranché par Hermann (Q27, après la revue ChatGPT R3)** : inclus dans PRE-4 pour l'Éditeur, par le lecteur natif, sans lecture automatique (FR-21-05, AD-17, story 4.5) ; la lecture pendant l'Exécution reste hors périmètre (FR-21-04). **Geste tranché par Hermann (Q31, après la porte post-revue M2)** : toucher la tuile consulte, le menu Retirer / Monter / Descendre passe à l'appui long (menu contextuel natif), actions VoiceOver conservées ; aucun bouton ajouté ; D-335 amendée (4.5 AC8, AC9). *Traitement initial, historique : P18, non ajoutés et classés `NON VÉRIFIABLE`.*
- **E4-4 (4.6 AC6)** : contrôle sur appareil des largeurs 360, 402 et 440 ; une seule largeur est observable avec un seul iPhone, sans simulateur iOS sous Windows. **Traité par Q5 et Q6** : recette sur l'iPhone de Hermann seulement, aucune mesure fabriquée ; les autres largeurs sont couvertes par des tests et marquées `NON VÉRIFIABLE` sur appareil.
- **E4-5 (4.3 AC1)** : barre de couleurs de `8328:36056` contre les 12 couleurs de D-026, déjà signalé par le PRD (FR-20-06, notes). **Traité par NFR-01 (D-255)** : Figma ne crée aucune règle ; les 12 couleurs de D-026 s'appliquent, l'écart visuel est inscrit au relevé et signalé à Hermann.

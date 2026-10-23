---
title: 'Story 7.10 — Composant d’action principal standardisé (D-444)'
type: 'feature'
created: '2026-10-23'
status: 'review'
baseline_commit: '8948d213'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-7-9-retours-j6d-en-tete-circuit-selectionne-bouton-continuer.md'
  - '{project-root}/docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Demande de Hermann du 23/10/2026 (D-444). A) Bouton d'action principal au format unique sur tous les écrans, référence « Terminer » (dimensions, positionnement, marges latérales, typographie, couleurs, arrondis, ombre) ; seuls libellé, état et action varient ; bouton fixe en bas, indépendant du défilement ; marge de sécurité au-dessus ; le contenu défilant s'arrête avant la zone protégée ; dégradé vertical blanc 0 % en haut → 100 % en bas, pleine largeur, englobant la marge supérieure et la zone autour du bouton ; composant réutilisable. B) Barre ✓ / Annuler : Safe Area inférieure iOS intégralement respectée, sans chevaucher le geste d'accueil ; même positionnement vertical que les autres barres, sans saut au changement de mode ; composant et marges standardisés.

**Approach:** D-444, interprétation retenue (réversible) : la zone de sécurité vaut aussi pour le bouton principal, « Terminer » compris — position de référence = bas de la zone de sécurité + marge standard. Un composant partagé (`PrimaryActionZone`, `PrimaryActionButton`) et une source unique de valeurs (`finalAction.ts`), appliqués à chaque écran doté d'un bouton d'action principal.

## Boundaries & Constraints

**Always:**
- Sources : D-444 (ch07, commit `8948d213`) ; epics.md « Story 7.10 » AC1 à AC4.
- Comportements, libellés et actions des boutons inchangés ; accessibilité inchangée.
- Dégradé par une primitive de la plateforme ou de l'écosystème Expo SDK 57.

**Never:**
- Aucune modification de `docs/`, `.github/`, `_bmad-output/pre6.zip`, `tokens.ts` ; aucune bibliothèque tierce hors Expo.

## I/O & Edge-Case Matrix

| Scenario | Expected |
|---|---|
| iPhone, encart bas 34 | bas du bouton à 42 du bord (34 + 8) ; zone 24 + 48 + 42 = 114 |
| Sans encart (bouton d'accueil, web) | bas à 16 |
| Android, barre de navigation 48 | bas à 56 (48 + 8) |
| Défilement jusqu'au bout | dernière ligne au-dessus du haut de la zone (réserve = hauteur de la zone, message d'échec compris) |
| Toucher sur la partie transparente du dégradé | traverse la zone (`box-none`), atteint le contenu dessous |
| Composition : entrée / sortie du placement | même zone, même hauteur (48) : aucun saut |
| Clavier ouvert (Éditeur, Profil) | zone hors de la zone qui évite le clavier, sous le clavier, de nouveau visible à sa fermeture (comportement D-349 conservé) |

</frozen-after-approval>

## Inventaire des écrans

**Traités (bouton d'action principal ou barre de mode qui le remplace)**

| Écran | Action | Avant | Après |
|---|---|---|---|
| Éditeur d'Exercice (`ActivityEditorForm`, route `exercise`) | « Terminer » | en flux, bas à 24 du bord (iOS), réserve 12 | zone fixe, bas à encart + 8, réserve = zone |
| Composition (`CompositionScreen`) | « Continuer » ; barre ✓ / Annuler du placement | en flux, bas à 24 (story 7.9) | même zone fixe, même emplacement pour les deux |
| Sélection d'Exercices (`ActivitySelectionScreen`) | Annuler / « Ajouter N » | en flux, `insets.bottom + 16`, boutons de 41 | zone fixe ; « Ajouter » au format `Terminer`, Annuler 48 (style neutre conservé) |
| Édition du Profil (`ProfileEditScreen`) | « Enregistrer » | dans le contenu défilant, 44 de haut | zone fixe, format `Terminer`, message d'échec au-dessus |

**Exclus**

| Élément | Raison |
|---|---|
| Profil (`ProfileScreen`) « Modifier le profil » | action secondaire en ligne dans la carte d'identité, pas un bouton d'action principal de pied |
| Catalogue « Réessayer », Exercice « Réessayer » (états d'erreur de chargement) | bouton d'état centré, pas une action principale de pied |
| Diagnostic des mises à jour (`UpdatesDiagnosticScreen`) | outil de diagnostic interne, boutons en ligne |
| Feuilles et modales (Paramètres d'exécution, Volumes du circuit, sélecteurs d'Étiquette, de Catégorie, de Zones, `ReferenceValueDialog`, `DecisionDialog`, consultation des médias) | surfaces modales avec leurs propres commandes (✓ circulaire, dialogue), hors de l'écran |
| Roulettes (`WheelPickerOverlay`) | barre d'outils ✕ / ✓ de la primitive native |

## Code Map

- `src/shared/ui/finalAction.ts` : source unique (marges, hauteur de zone, gabarit du bouton, dégradé).
- `src/shared/ui/PrimaryActionZone.tsx` (nouveau) : `PrimaryActionZone`, `usePrimaryActionZone`, `PrimaryActionButton`.
- Écrans : `ActivityEditorForm.tsx`, `CompositionScreen.tsx`, `ActivitySelectionScreen.tsx`, `ProfileEditScreen.tsx`.
- Tests : `PrimaryActionZone.test.tsx` (nouveau), `ActivityEditorForm.test.tsx`, `EditorAccessibility.story46.test.tsx`, `CompositionScreen.test.tsx`, `ActivitySelectionScreen.test.tsx`, `ProfileEditScreen.test.tsx`.
- READMEs : `shared/ui`, `features/sessions`, `features/activities`, `features/preferences`.

## Tasks & Acceptance

- [x] AC1 composant, AC2 inventaire et réserve de défilement, AC3 zone de sécurité et placement sans saut, AC4 dégradé sans dépendance.
- Given l'arbre entier, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert. Given un iPhone, when J6f, then les quatre écrans conformes.

## Implementation Notes

**Valeurs.** Marge basse : encart + 8 quand une zone de sécurité existe (iPhone : 42 du bord), 16 sans encart. Justification : l'encart de 34 contient déjà l'indicateur d'accueil et son dégagement ; 8 détache le bouton de la zone sans le remonter de plus de 18 par rapport à la position validée de « Terminer » (24) ; 16 est la marge standard des écrans quand rien n'est réservé. Marge de sécurité au-dessus du bouton (hauteur du fondu au-dessus) : 24. Hauteur du bouton : 48 (`dimensions.finalAction.buttonHeight`). Marges latérales : celles de « Terminer » (16 sous 390, 24 au-delà). Zone sur iPhone : 24 + 48 + 42 = 114.

**Dégradé.** `experimental_backgroundImage: "linear-gradient(to bottom, #FFFFFF00 0%, #FFFFFF 100%)"` sur une vue de fond pleine zone (`pointerEvents="none"`). Primitive de React Native 0.86 (Fabric : calque de dégradé natif sur iOS, `LinearGradient` sur Android ; analyse JS par `processBackgroundImage`, aucun drapeau requis), sans nouvelle dépendance. Préfixe `experimental_` : API stable dans son rendu mais au nom encore marqué ; alternative documentée : `expo-linear-gradient` (dépendance à ajouter). Blanc : `colors.background` (#FFFFFF), à alpha 0 en haut (même blanc, pas `transparent` qui grisaillerait le fondu).

**Défilement.** Chaque écran réserve en bas de son contenu défilant la hauteur de la zone (`usePrimaryActionZone`, recalculée sur la hauteur mesurée du contenu de la zone) : la dernière ligne remonte au-dessus du dégradé. Composition : le défilement automatique du glisser (story 7.4) prend le haut de la zone comme bord bas de la zone visible.

**Touchers.** Zone et contenu en `box-none`, dégradé en `none` : seuls les boutons captent ; un élément du contenu visible sous la partie transparente reste touchable.

**Clavier.** iOS : zone sous le clavier, visible à sa fermeture (D-349 conservé ; Éditeur : hors du `KeyboardAvoidingView`). Android : la fenêtre se redimensionne et la zone remonterait sur le champ actif — elle est masquée tant que le clavier est ouvert. Profil : « Enregistrer », jusque-là au bout du contenu, est désormais fixe — caché par le clavier pendant la saisie du nom, visible à sa fermeture.

**Choix non dictés (à valider en J6f)**
1. Interprétation D-444 : « Terminer » aussi remonte au-dessus de la zone de sécurité (42 du bord sur iPhone au lieu de 24).
2. Marge basse 8 au-dessus de l'encart, 16 sans encart ; marge de sécurité (fondu) 24.
3. Primitive `experimental_backgroundImage` plutôt qu'`expo-linear-gradient`.
4. Sélection d'Exercices : Annuler garde son style neutre (gris) à la hauteur 48, sans ombre ; « Ajouter » prend le format `Terminer`.
5. Composition à 375 : marges latérales 16 (règle de « Terminer ») au lieu de 24.
6. Profil : « Enregistrer » sous le clavier pendant la saisie (comme « Terminer ») ; gris (inactif) pendant l'enregistrement, comme tout bouton principal inactif (avant : primaire).
7. Android : zone masquée clavier ouvert.
8. Composition : une carte soulevée près du bas passe sous la zone (dégradé et bouton) ; la bande du défilement automatique commence au haut de la zone. Le panneau de nature Android ouvert près du bas peut être recouvert.

## Spec Change Log

**Correctif J6f (23/10/2026)** — Hermann, verbatim : « le bouton d'action est trop haut, priorité à l'espace accordé à l'écran. Conserver la hauteur de la zone protégée mais recentrer verticalement le bouton dans cette zone. » D-444 mise à jour (« Position verticale », commit `b4d5728a`). Hauteur de la zone inchangée (`finalActionZoneHeight` : 24 + contenu + encart + 8, ou + 16 sans encart ; iPhone 114, sans encart 88), donc réserve de défilement et bande du défilement automatique inchangées. Contenu centré : `finalActionVerticalPadding` = (24 + marge basse de référence) / 2 au-dessus et au-dessous — iPhone 33 (bas du bouton à 33 du bord : 1 point dans l'encart de 34, accepté par Hermann, priorité à l'espace), sans encart 20, Android : le bas ne descend jamais sous l'encart (barre de navigation à boutons, encart 48 : centré, le bouton couvrirait 8 points de la barre — 32 au-dessus, 48 au-dessous, `finalActionContentPadding`). Même règle pour la barre ✓ / Annuler (même zone). Remplace, dans « Valeurs » ci-dessous, la position « encart + 8 » du bouton.

## Review Triage Log

Deux revues indépendantes du 23/10/2026 (aveugle et cas limites ; écarts de vérification), sous-agents en lecture seule.

**Corrigés**
1. Haut (cas limites 1) — défilement automatique du glisser : la hauteur réduite de la réserve servait aussi au décalage maximal (dépassement possible de 114). La zone ne remonte plus que la bande du bas (`bottomObstruction` de `useDragAutoScroll`) ; le maximum reste celui du conteneur entier ; test du décalage maximal recalé (il échouait avec l'erreur).
2. Moyen (cas limites 2) — Android, clavier ouvert : zone masquée (sinon remontée sur le champ actif) ; tests.
3. Bas (cas limites 5, 6, 8) — `scrollIndicatorInsets` sur les quatre listes ; états centrés de la Sélection au-dessus de la zone ; commentaires.
4. Haut (vérification 1) — test « sans saut » renforcé : barre dans la même zone, hauteur égale au bouton, réserve constante (114) dans les deux modes avec mesure du contenu.
5. Moyen / Bas (vérification 3, 6, 7, 9) — « Enregistrer » hors du défilement ; « Continuer » actif au primaire ; Annuler neutre sans ombre ; tests unitaires redondants retirés de l'écran.

**Acceptés / signalés (J6f)**
- Carte soulevée et panneau de nature Android sous la zone près du bas : choix 8.
- Ordre VoiceOver contenu → bouton, message d'échec au-dessus : ordre de rendu (zone après le contenu), non testé à l'écran pour chaque écran.
- Rendu réel du dégradé et touchers à travers sa partie transparente : appareil.
- Changements visibles : marges 16 sous 390 (Composition, Sélection), « Enregistrer » gris pendant l'enregistrement, dernière ligne au ras du haut du dégradé.

## Verification

**Commands:** `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`.

**Manual checks (J6f, iPhone 375 et 402)** : rendu du dégradé (sans bande grise, pleine largeur) ; bouton au-dessus de l'indicateur d'accueil sur les quatre écrans ; défilement jusqu'au bout (dernière carte, dernier champ, Médias, Fin de séance au-dessus du dégradé) ; touchers sur un élément visible sous le fondu ; Composition : entrée / sortie du placement sans saut, glisser avec défilement automatique vers le bas ; Éditeur et Profil avec clavier ; VoiceOver (ordre de lecture : contenu puis bouton).

# Rapport de clôture des corrections issues de l'audit du DSF

Date : 2026-10-05. Références : `AUDIT-DSF-SECONDE-PASSE-2026-10-05.md` (audit), `BRIEF-ALIGNEMENT-CODE-FIGMA-2026-10-05-v2.md` (brief v2).
Les corrections Figma ont été faites par une IA qui avait aussi réalisé les modifications précédentes ; une relecture strictement indépendante reste à confier à un tiers.

## 1. Statut de chaque constat

| ID | Constat | Statut | Action réalisée / reste à faire |
|---|---|---|---|
| A01 | 6 repères du chronomètre à 100 % au lieu de 62 % | **Corrigé** | Opacité rétablie (relue dans un appel séparé). Deux instances masquées laissées telles quelles (ancres d'animation). |
| A02 | 410 interactions au lieu de 429 | **Clos par décision du propriétaire** | 19 clics perdus lors de remplacements de composants (14 sans transition, 5 en Smart Animate) ; recréés **manuellement par le propriétaire**, sans impact sur le développement. La base de référence devient 410 / 285. |
| A03 | 12 identifiants du manifeste absents de Figma | **Mapping prêt, dépôt à faire** | § 4. Aucun changement Figma nécessaire. |
| A04 | Dimensions des sources de navigation ≠ manifeste | **Qualification à faire côté dépôt** | § 4. |
| A05 | Boutons « − » « + » rendus par du texte (`ProfileStepper.tsx`, l. 176 et 197) | **À faire côté dépôt** | Inscrit au brief v2 (annexe E.7). |
| A06 | Couleurs : `divider`, `iconNeutral` | **Repris dans le brief** | Valeurs et alias documentés (annexe A). Mise à jour du code à faire. |
| A07 | Polices et interlignes | **Table des rôles établie** | § 2. Exceptions d'interligne documentées. Roboto Condensed à ajouter au code. |
| A08 | « Card title » 17 px | **Corrigé dans Figma, décision restante** | § 2.1 : texte de chronomètre rebranché sur un style neutre ; 40 textes de composants DSF alignés de 17 à 15 px. Un écart code ↔ spécification ↔ Figma subsiste (§ 2.2). |
| A09 | 38 glyphes « photo.badge.plus » | **Corrigé** | Remplacés par `icon/photo-ajouter` (`7021:13149`), icône validée par le propriétaire ; 410 interactions avant et après. |
| A10 | 3 masters « Valeur modifiable » surnuméraires | **Corrigé** | Déplacés dans l'archive, renommés « copie résiduelle — à supprimer » (résidus d'un script ; à supprimer par le propriétaire). |
| A11 | Master « Tri » 32 × 32 en retard | **Corrigé** | 34 × 34, rayon 17, fond 72 %, trait 75 %, icône `icon/tri` 20 px. Les 24 contrôles des écrans ne sont pas modifiés. |
| A12 | Tokens sans usage | **Registre établi, aucune suppression** | § 3. |
| A13 | Deux scrims de noms proches | **Rôles documentés, pas de fusion** | § 3. |
| A14 | Débordement de 15 px | **Qualifié : préexistant, aucune modification** | § 3.3. |
| A15 | Témoins visuels anciens | **Action du propriétaire** | § 5 : version nommée Figma après validation visuelle. |

## 2. Table des rôles typographiques (A06, A07, A08)

**Règle.** Une correspondance se fait par **rôle** (où le texte est utilisé), jamais par égalité de corps ni par nom de style. Mesures : Prototype MVP, hors instances, 2026-10-05. « Usages » = nombre de textes liés au style dans les écrans.

### 2.1 Corrections Figma réalisées (A08)

- Le texte de chronomètre « 00:00 » du cadre flottant (`5017:6051`) utilisait « DSF / Card title » par simple égalité (Inter Semi Bold 17, interligne auto). Il est rebranché sur le style neutre **`KODJO / Texte / Inter Semi Bold 17`** (créé ; dimensions identiques).
- « DSF / Card title » était utilisé par **40 textes de composants DSF** (cartes Exercice et Séance — catalogue, Planification, Sélection, gabarits Catalogue, Calendrier, Exécution, Recherche globale), alors que **toutes les instances affichent un titre de 15 px** par surcharge (catalogue, Calendrier Semaine, Suivi). Les masters sont alignés sur **15 px** (style `Texte / Inter Semi Bold 15`) : l'écran Catalogue est identique avant et après. Le style « DSF / Card title » est marqué **obsolète** dans sa description.

### 2.2 Table de correspondance code ↔ spécification 12 ↔ Figma

| Token de code | Code | Spécification 12 | Figma observé (usages) | Statut | Action |
|---|---|---|---|---|---|
| `type.timerPrimary` | Inter SB 58 / 64 | 58 / 64 | `DSF / Timer` Roboto Condensed Bold 100 (7) ; Roboto Condensed Bold 30 (35), SemiBold 30 (18) | **Non conforme** (police et taille) | D1 : ajouter Roboto Condensed ; remplacer par des tokens issus de ces usages |
| `type.activityTitle` | SB 28 / 34 | 28 / 34 | aucun style de 28 | **Non vérifiable** (écran Exécution non codé) | — |
| `type.metricPrimary` | SB 22 / 28 | 22 / 28 | `Inter Semi Bold 22` (11 : synthèses) | **Correspondance de rôle plausible** | Interligne 28 → 27 (D2) |
| `type.screenTitle` | SB 20 / 24 | 20 / 24 | `Inter Semi Bold 20` (103 : titres d'écran, noms, **numéros de jour du calendrier**) ; `Screen title` historique (8) | **Partiel** (le même corps sert plusieurs rôles) | Ne pas déduire le rôle de la taille |
| `type.modalTitle` | SB 18 / 22 | 18 / 22 | `Inter Semi Bold 18` (52 : en-têtes de modale, **Vue Jour**, en-tête de jour) ; `Modal title` (1) | **Partiel** | idem |
| `type.sectionTitle` | SB 16 / 20 | 16 / 20 | `Inter Semi Bold 16` (128 : phrase éditable, description, en-tête parcours) ; `Section title` (37) | **Correspondance de rôle vérifiée** | Interligne 20 → 19 (D2) |
| `type.cardTitle` | SB 16 / 20 | 16 / 20 « hors famille Cartes du 30 septembre » | Titres de cartes récentes **15 px** (catalogue, Calendrier Semaine, Suivi, Composition) | **Écart code ↔ spécification ↔ Figma** | Voir § 2.3 |
| `type.compactCardTitle` | SB **14** / 18 | SB **13** / 18 | Titres de cartes imbriquées en Composition : 15 px | **Contradiction code ↔ spécification** | À clarifier (§ 2.3) |
| `type.body` | Regular 14 / 20 | 14 / 20 | `Inter Regular 14` (102) ; `Body` historique 14 / 20 px (10) | **Partiel** | 20 → 17 pour les textes en « auto » (D2) |
| `type.label` | Medium 14 / 18 | 14 / 18 | `Inter Medium 14` (252 : libellés de paramètres) | **Correspondance de rôle vérifiée** | 18 → 17 |
| `type.button` | SB 14 / 18 | 14 / 18 | `Inter Semi Bold 14` (175 : actions) ; `Button` (7) | **Correspondance de rôle vérifiée** | 18 → 17 |
| `type.supporting` | Regular 12 / 16 | 12 / 16 | `Inter Regular 12 · interligne 15 px` (56) ; `DSF / Card metadata` 12 auto (92) | **Partiel** | Exception : l'interligne explicite de 15 px reste |
| `type.caption` | Regular 11 / **14** | Regular 11 / **16** | `Inter Regular 11` auto (199) | **Contradiction code ↔ spécification** | La spécification doit être corrigée ; cible 13 (D2) |
| `type.navLabel` | Regular 11 / 16 | 11 / 16 | libellé de navigation (dans des instances) | **Non vérifié sur Figma** | 16 → 13 (D2) |
| `type.parameterColumnLabel` | SB 15 / 18 | — | `Inter Semi Bold 15` (53 : **titres de cartes**) | **Même style, deux rôles** | Ne pas migrer par la taille |
| `type.exerciseFieldValue` | Regular 13 / 18 | — | `DSF / Parameter text` 13 auto (247) | **Correspondance de rôle plausible** | 18 → 16 |

### 2.3 Décisions à prendre par le propriétaire

1. **Titres des cartes de séance et d'exercice** (`SessionCard`, `ActivityCard`) : le code utilise `type.cardTitle` 16 / 20 ; la spécification 12 et Figma disent **15 px** pour les nouvelles cartes. Recommandation : aligner le code sur 15, avec un token dédié (nom à choisir selon la convention), et conserver `cardTitle` 16 pour les titres hors famille cartes.
2. **`compactCardTitle`** : 14 / 18 dans le code, 13 / 18 dans la spécification, 15 px dans Figma pour les cartes imbriquées en Composition. À trancher par le propriétaire.
3. **`caption`** : 11 / 14 dans le code, 11 / 16 dans la spécification. Recommandation : corriger la spécification (cible issue de D2 : 13).

## 3. Registre des tokens et composants (A12, A13, A14)

### 3.1 Tokens sémantiques sans usage détecté

151 tokens sémantiques hors « observed » ; **44 sans aucun usage** (ni nœud, ni peinture, ni effet, ni alias entrant).

| Catégorie | Nombre | Classement | Recommandation |
|---|---:|---|---|
| Dimensions de référence : `size/*`, `component/*`, `position/header/title-y`, `spacing/modal-bottom-inset` | 40 | **Réserve documentaire** : valeurs mesurées qui reflètent `dimensions` de `tokens.ts` ; ne se lient pas à des calques | Conserver |
| Couleurs sans usage : `color/border/active`, `color/category-action/cancel-background`, `color/category-action/cancel-text`, `color/cards/value-icon` | 4 | **Non cités** dans le dépôt (0 fichier) ni dans les écrans | Candidats à suppression : **décision du propriétaire**, aucune suppression automatique |

« Sans usage détecté » ne signifie pas « supprimable » : la détection ne couvre pas les propriétés de composants ni tous les styles.

### 3.2 Composants sans instance

Les 205 masters DSF sans instance détectée comprennent des archives, démonstrations, identité de marque et réserves : ce ne sont pas des défauts. Les 13 familles du lot 5 sont dans le cadre d'archive (non supprimées). Aucun nettoyage supplémentaire.

### 3.3 Scrims et débordement

- **`color/overlay/scrim`** (`#1F2129` à 34 %) : voile de modale, correspondant à `color.overlayScrim` de la spécification. **`color/overlay-scrim`** (`#14171F`, plein) : teinte d'ombre de la carte déplacée (`compositionDraggedCardShadow` dans le code). Contextes distincts, alpha et RVB différents : **ne pas fusionner**, nommer sans ambiguïté dans le code.
- **Débordement de 15 px** (« Groupe — Compte à rebours / Fin de séance », `5087:5955`) : **préexistant et identique** dans 35 écrans et dans la copie non modifiée de la page Communautaire ; le parent rogne (`clip = true`) et le rendu ne montre aucun défaut. **Aucune modification.**

## 4. Mapping des icônes (A03, A04, A05, A09)

Au commit `6d03f5b`, `assets/icons/` contient 27 SVG pour 25 entrées du manifeste ; `select-field-chevron.svg` et `label-outline.svg` ne sont pas inscrits. Les fichiers existent : le problème est la traçabilité, pas l'absence.

| Clé du manifeste | Identifiant absent | Source Figma actuelle probable | Action |
|---|---|---|---|
| `action.add` | `2884:4442` | `icon/ajouter` (`6959:15706`, 24 × 24, trait 2) | Rapprocher, comparer le tracé |
| `control.back` | `2884:4426` | `icon/retour` (`6959:15940`, 24 × 24) | Rapprocher, comparer le tracé |
| `wheel.action.cancel`, `wheel.action.validate` | `3089:81`, `3089:83` | `DSF / Primitives / Icône d'action de modale` (Type = Cancel, Validate) | Rapprocher |
| `navigation.sessions.active` / `.inactive` | `2537:95`, `2537:127` | `icon/catalogue` (`6296:10468`) | Qualifier la source et le viewBox (nom « sessions » ≠ « catalogue ») |
| `action.start`, `control.chevronDown`, `control.chevronUp`, `control.repetitionPullDown`, `state.selected`, `composition.fixed` | `2884:4450`, `2884:4419`, `2884:4417`, `2745:4`, `2537:1509`, `3066:4680` | **Aucun composant `icon/*` correspondant** | Identifier l'élément actuel dans Figma avant d'exporter ; ne rien dessiner sans accord du propriétaire |

| Sources de navigation existantes | Figma | Manifeste |
|---|---|---|
| Calendrier actif / inactif (`2537:135`, `2537:103`) | 24 × 24 | 26 × 26 |
| Suivi actif / inactif (`2537:173`, `2537:109`) | 24 × 19,3846 | 26 × 21 |
| Profil actif / inactif (`2537:209`, `2537:114`) | 21,5172 × 24 | 26 × 29 |

Ces écarts sont à qualifier **avant tout remplacement** ; le dessin existant est conservé.

Nouveaux composants à exporter : `icon/tri` (`6939:26387`, 20 × 20), `icon/suivant`, `icon/précédent`, `icon/ajouter`, `icon/fermer`, `icon/retour`, `icon/photo-ajouter` (`7021:13149`, 24 × 24, trait 1,8).

## 5. Ce qui reste, et à qui

| Sujet | Responsable | Remarque |
|---|---|---|
| Recréer les 19 interactions de clic perdues | Propriétaire (manuel) | Écrans isolés : « Création activité — Avant Paramètres d'exécution », « Profil — Stepper Pause changement de côté », « Profil — Stepper Récupération après activité », « Composition séance — Standard — Séries variables », « Résumé — 15 », « Résumé — 17 » ; écrans sans sortie : « Modifier un exercice », « Exécution d'un exercice — Média plein écran », « Ordre des côtés — 7 » |
| **Enregistrer une version nommée de Figma** comme témoin approuvé (A15) | Propriétaire | Après contrôle visuel des écrans critiques (brief v2, annexe H.5) ; mon outil ne peut pas créer de version |
| Décisions typographiques du § 2.3 | Propriétaire | Cartes 15 px, `compactCardTitle`, `caption` |
| Supprimer les 3 masters « copie résiduelle — à supprimer » et, si souhaité, les 4 couleurs sans usage | Propriétaire | Aucune suppression automatique |
| Alignement du code, spécification 12, manifeste d'icônes, polices | Orchestrateur et Claude Code | Brief v2 |
| **Relecture strictement indépendante** du DSF | Un autre intervenant | Condition de qualification finale |

## 6. Enseignements de procédure (pour toute modification future de Figma)

- Avant et après tout remplacement de nœuds : comparer l'aspect, la position et le nombre d'**interactions** ; reporter les interactions de l'ancien nœud sur le nouveau.
- Lier une couleur à une variable remet l'opacité à 100 % : la rétablir après coup et la relire dans un appel séparé.
- Ne jamais rapprocher un style par égalité de corps et d'interligne sans vérifier son rôle.
- Mesurer la position d'un nœud **après** avoir retiré l'ancien quand le parent est en mise en page automatique centrée.

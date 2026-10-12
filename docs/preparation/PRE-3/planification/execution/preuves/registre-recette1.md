# PRE-3 (#340) — registre de la recette iPhone 1 de Hermann

## Repères

| Élément | Valeur |
|---|---|
| Source | Classeur `KODJO_PRE3_Grille_Recette_v2_Retour_Hermann.xlsx`, transcrit intégralement dans le prompt du 12/10/2026. 66 tests (T-01 à T-66) et 7 ajouts sans identifiant (lignes Excel 75 à 81, notés A-01 à A-07). |
| Résultats déclarés | 48 Conforme, 18 Écart (dont les 7 ajouts), 2 Clarifier, 1 Non provoqué, 4 Non testé : 73 entrées. Ce ne sont **pas** 73 défauts. |
| Candidat testé | `9f5cee0e7049494033908fcec586b0c37587e168`. Build iOS **7**, EAS `e1deb07e-3f67-43d3-9d34-9b15147af94b`, profil `review`, version 1.0.0, `runtimeVersion` 1.1.0, terminé le 2026-10-10T00:12:34Z. C’est le seul build produit depuis ce commit. Les mises à jour OTA du canal `review` lui sont toutes antérieures, donc le code embarqué s’exécute. Le build réellement installé n’a pas été confirmé par Hermann : le cadre de la grille est vide. |
| Contrat de référence | Plan approuvé `43e7b344` (`passe2/plan-technique-corrige.md`, `tests-and-preservation.json`). Spécifications v13 et v15 et DSF du 07/10. Figma figé le 08/10 (`docs/preparation/PRE-3/figma/`). Le Figma actuel n’est **pas** utilisé. |
| Correction | `50691dc0c552f4d888609e10ebc45c0939ff083a`, dans le `write_scope@43e7b344` sans extension (contrôle de portée PASS). |

**Qualifications utilisées**
- **DD** : défaut démontré.
- **DP** : défaut probable, à reproduire.
- **ARB** : demande de modification à arbitrer.
- **CONF** : conforme au contrat.
- **NT** : non testé.
- **HT** : hors tranche ou hors `write_scope`, consigné.

## 1. Registre consolidé

| ID | Réf. | Observation reformulée | Reproduction | Contrat (version, localisation) | Qualif. | Traitement | Tests / preuve | État final |
|---|---|---|---|---|---|---|---|---|
| R-01 | T-15 | Glisser une Série variable par sa poignée affiche « Impossible d’afficher KODJO » ; il faut relancer l’app. | **Reproduite** dans Jest en simulant le recyclage des événements du renderer. Erreur exacte : `TypeError: Cannot read properties of null (reading 'pageY')`. Le renderer RN 0.86.2 (`ReactFabric-prod.js`, `destructor`) remet `nativeEvent` à `null` après chaque gestionnaire ; or la ligne suivait le doigt via une mise à jour d’état différée qui relisait `event.nativeEvent`. | P3-07 (déplacement : cible et Pause ensemble, renumérotation) | DD | Corrigé : position lue de façon synchrone, départ du geste gardé dans une ref. Interruption système gérée. Aucune donnée perdue n’a été rapportée ni n’est en cause. | `ExecutionParametersSheet.test.tsx` « F-01 » (2 tests), **rouge sur 9f5cee0e**, vert après correction | Corrigé, à retester sur appareil |
| R-02 | T-10 | Après modification de durées ou répétitions variables, Durée → Répétitions → Durée réaffiche les anciennes valeurs, sauf si l’interrupteur a été désactivé puis réactivé. | **Non reproduite** sur 9f5cee0e par 5 trajets : édition au tap ou par maintien, uniforme → variable, double aller-retour, sélecteur refermé entre deux choix. Le symptôme correspond au défaut REV-01, corrigé dans `12506088`, qui est contenu dans 9f5cee0e. | P3-04 (« retour à un mode déjà visité → ses cibles sont restaurées ») | DP | Pas de correction à l’aveugle. Test de régression ajouté sur le parcours décrit. **Information demandée à Hermann** : trajet exact (nombre de Séries, tableau replié ou non, valeurs, ✓ avant le changement, maintien ou tap). | `ExecutionParametersSheet.test.tsx` « F-02 » (vert) | À reproduire avec le trajet exact |
| R-03 | T-34, T-35, T-59 | Création ou modification d’une Catégorie ou d’une Zone : le clavier masque la feuille, on ne voit pas ce qu’on saisit. Les fonctions métier (anti-doublon, Ajouter inactif à vide, appui long) sont conformes. | **Démontrée** par lecture du code : aucun évitement du clavier dans le `Modal`. La feuille est ancrée en bas et le formulaire est en fin de liste. | Spéc. 06 l.184 : « le champ actif et l’action finale restent accessibles » ; Figma figé 4474:7157 et 4683:6336 (feuille au-dessus du clavier) | DD | Corrigé pour Catégorie et Zone : `KeyboardAvoidingView` (iOS) et formulaire ramené en vue à l’ouverture et à l’apparition du clavier. **Étiquette** (`LabelPickerModal.tsx`, PRE-2, Composition) : même défaut, hors `write_scope` → **extension demandée**. | Suites Catégorie et Zone « F-03 », **rouges sur l’original** | Catégorie et Zone corrigées, à retester. Étiquette en attente d’extension. |
| R-04 | T-09, T-19 | Le sélecteur de Mode (et Côté, Ordre) reste déployé après un choix ; il devrait se refermer sur la valeur choisie. | Confirmé : aucun `onChange` ne referme le contrôle. | v13 §6 l.64 et 76 : valeur puis segmenté sous la ligne active, un seul contrôle ouvert. **Aucune règle de fermeture.** La capture figée 6407-9805 montre « Durée » choisi avec le contrôle encore ouvert. | ARB | Non modifié (préférence non prescrite). Correction prête si acceptée : refermer après choix. | — | En attente de décision |
| R-05 | T-19, T-55 | Libellés des segmentés : débordent, trop grands, en gras, mal centrés ; Hermann veut du regular, centré, à la taille des titres de section. | Code : style commun Semi Bold 16 et hauteur fixe ; sélection forcée sur Durée quand le mode est vide. | DSF segmentés 07/10 §3 et figé 6407-9805 : **Mode = Semi Bold 16 (conforme)**. Figé 6407-10481 : Côté 13, deux lignes, Medium si sélectionné et Regular sinon. Figé 6665-26185 : Ordre, titre 14 et sous-titre 11, cadre 330×60. v13 l.76 : mode non renseigné « — ». | DD (Côté, Ordre, sélection nulle — écarts E7/E14 déjà déclarés) / ARB (regular pour Mode, contraire au DSF) | `SegmentedControl.tsx` est hors `write_scope` → **extension demandée** (variante de libellés pour la feuille, sélection nulle). Mode en regular : arbitrage. | — | En attente d’extension et de décision |
| R-06 | T-49 | Zone de contexte de Créer/Modifier un exercice : courbure absente sous l’icône Retour, pas de dégradé en bas, couleur différente de celle de la Composition. | Code : fond plein `surface` #F5F7FA (token partagé avec la Composition), aucun halo, aucun dégradé. | Figé 3542-4656 : « Zone bleue » en dégradé #EAEAFF (opaque jusqu’à 0,8, transparent à 1,0) et « Halo blanc — bouton Annuler » 59×59. **Contradiction** : l’alignement DSF du 07/10 (D3, validé par Hermann) a ramené ce token à `surface`. Composition : référence propre (`ContextBand` #E5F0FF), PRE-2. | ARB (couleur) / ARB (dégradé : dépendance native `expo-linear-gradient`, nouveau build) / DP (halo, hors `write_scope` : `ScreenShell.tsx`) | Non modifié : sources contradictoires, token partagé hors tranche. Une différence avec la Composition ne prouve pas, à elle seule, qu’il faut la même couleur. | — | En attente de décision et d’extension |
| R-07 | T-54 | Interrupteur Séries variables à centrer verticalement. Le commentaire est saisi sous le test du Bip, mais il ne concerne pas sa position. | Code : ligne `alignItems:center`, interrupteur iOS natif (51×31 contre 46×28 dans Figma). Position du Bip **conforme** (spéc. l.159). | Figé 6407-9805 et 6665-24616 | DP (non déterminable sans capture) | Interrupteur natif conservé (règle de priorité aux primitives natives). Vérification par capture au retest. | — | À retester avec capture |
| R-08 | T-25, T-58 | Message d’ajustement du total : action Annuler à entourer d’un cadre plus clair ; toucher le reste du message devrait le fermer. Le mécanisme d’ajustement est déclaré conforme. | Code : texte Annuler sans cadre ; seul Annuler réagit au toucher ; fermeture après 5 s. | Figé 6423-9953 : message seul, **sans action Annuler** (Annuler vient de l’écart E15 de la revue 1). Aucune règle de style ni de fermeture au toucher. | ARB | Non modifié. Si cette option est retenue : une simple fermeture n’appliquera jamais Annuler. | — | En attente de décision |
| R-09 | T-59 | Icône de la Catégorie : c’est celle du Circuit. | **Démontrée** : `ActivityEditorForm.tsx:215` affiche `icon-tour` (« Composition — Nombre de tours »). | Figé 3542 et 4474 : master `icon/categorie` (6296:10530) | DD | Il faut un nouvel asset `icon-categorie` et une entrée dans `KodjoIcon.tsx`, tous deux hors `write_scope` → **extension demandée** (même voie que E9). | — | En attente d’extension |
| R-10 | T-34, T-59 | Champ de création Catégorie, Zone ou Étiquette : il manque l’icône « Envoyer » (flèche vers le haut). | Code : boutons texte Annuler et Ajouter sous le champ. | Figé 4474:7157 et zones 4953:6770 : « Action inline — Envoyer » 32×32, glyphe ↑ dans le champ | DP / ARB | Le figé montre ↑ dans le champ. Remplacer les boutons Annuler/Ajouter de PRE-2 (T-34 conforme) est un choix → **arbitrage**. | — | En attente de décision |
| R-11 | T-34, T-59 | Palette : une pastille sous le texte ouvre 12 cercles ; Hermann attend une barre horizontale sélectionnable, pastille à droite. | Code : `ColorPalette` de PRE-2 (variante en ligne, 12 couleurs `SESSION_COLORS`). | CE-UI-09 §9 et figé 4474:7157 : « Nuancier — Bandeau » horizontal 354×40, **16 pastels**, segment sélectionné agrandi ; **aucune pastille à droite**. | DD (disposition en bandeau) / ARB (16 pastels au lieu de 12 couleurs du domaine PRE-2 ; pastille à droite non figée) | `ColorPalette.tsx` est hors `write_scope` et touche au domaine PRE-2 → arbitrage et extension. | — | En attente |
| R-12 | T-61 | Texte agrandi au maximum : titres d’écran, titres de section, options des segmentés, boutons Créer/Filtrer/Trier et tout le Profil sont rognés. | Code : hauteurs fixes, aucun `maxFontSizeMultiplier`. | P3-20 et T-61 : aucune troncature bloquante. Ne pas réduire la police. | DD (en-têtes des 3 feuilles PRE-3, hauteur fixe 56 et titre sur 1 ligne) / HT (`ScreenShell` : titres d’écran ; Catalogue : Créer/Filtrer/Trier ; Profil) / DD hors WS (`SegmentedControl` : hauteur fixe) | Corrigé dans le périmètre : en-têtes Paramètres, Catégorie et Zones en hauteur minimale, titre non limité à une ligne. Le reste est consigné (composants partagés hors tranche). **Information demandée** : taille maximale standard ou tailles d’accessibilité supplémentaires ? | Tests « T-61 » (3 suites) | Partiellement corrigé, à retester |
| R-13 | T-39, T-43 | Vidéo importée et conservée, mais vignette grise avec le badge « Vidéo », y compris après redémarrage. Ce n’est pas un problème de lecture. | **Démontrée** dans le code natif d’expo-video 57.0.5 : `createVideoPlayer` charge la source de façon asynchrone (`useSynchronousReplace=false`) et `generateThumbnailsAsync` renvoie `[]` sans erreur tant que `currentItem` est vide ; la génération était immédiate. Un fichier vidéo personnel n’est pas nécessaire : le contrat natif est reproduit. | P3-23/video-thumbnail ; plan l.67 « miniature selon disponibilité » | DD | Corrigé : attente de `readyToPlay` (`statusChange`, docs SDK 57), avec un délai maximal de 10 s ; `error` ou délai dépassé → repli gris inchangé. | `VideoPoster.test.ts` « M-01 » (2 tests), **rouges sur l’original** | Corrigé, à retester |
| R-14 | A-01 | Séries variables actives mais repliées, puis désactivées et réactivées : le tableau devrait se redéployer. | Confirmé : l’état replié est conservé. | v13 l.76 : le chevron masque sans modifier les données ; **aucune règle** sur l’état à la réactivation | ARB | Non modifié. Correction prête si acceptée. | — | En attente de décision |
| R-15 | A-02, A-07, T-18, T-57 | Supprimer « Renseignez la durée d’une série » et « Renseignez les répétitions », sans cercle rouge autour du stepper. | Code : contour rouge danger épaisseur 1, messages affichés dès que la cible est vide. | v13 l.89 et plan l.55 : « cellule signalée et **message en ligne nommant la Série** ». Figé 6665:27232 : contour **#FF8D28 sur 1,5** et **aucun texte**. Contradiction entre v13 et le figé sur la présence du message. | DD (couleur et épaisseur du contour) / ARB (suppression des messages, changement de contrat) | Contour corrigé à la valeur figée (orange d’avertissement 1,5), assertion E19 remplacée et documentée. **Messages conservés** : les protections de validation restent actives. | Assertion P3-16/fold-incomplete mise à jour ; tests verts | Contour corrigé ; messages en attente de décision |
| R-16 | A-03 | Pas de Compte à rebours et Fin d’exercice : 1, puis 5 ? (à vérifier) | — | Plan l.75 : « Bip/CR/Fin : pas 1 » ; v13 (D-256) ; T-23 Conforme | CONF | Rien. Un passage à 5 serait une demande de modification. | — | Conforme ; demande possible |
| R-17 | A-04 | Le voile arrive avec la feuille ; il devrait apparaître sur place pendant que la feuille arrive. | Code : `Modal animationType="slide"`, voile et feuille glissent ensemble. Les feuilles Catégorie et Zones sont en `fade`. | Aucune règle écrite. Prototype figé : ouverture SMART_ANIMATE 0,25 s ease-out, fermeture DISSOLVE ; le voile ne glisse pas. Feuille ancrée en bas. | ARB | Options : (A) voile en fondu sur place et feuille qui monte depuis le bas (cohérent avec le prototype figé) ; (B) autre trajectoire précisée par Hermann. | — | En attente de décision |
| R-18 | A-05 | Interrupteur actif, tableau masqué : le cadre garde le style sélectionné. | Confirmé. | Figé 6665-27458 : variante « **État=Replié, Cadre=Non** » ; le cadre rattache l’interrupteur au tableau affiché | DD | Corrigé : cadre seulement quand le tableau est déployé ; état variable et données intacts. | Test « A-05 » | Corrigé, à retester |
| R-19 | A-06, T-30 | À l’échec avec Séries variables : la phrase devrait mentionner les pauses variables (« X s, Y s, Z s… »). | — | Plan l.62 : « clauses de Pause variable omises ». Corpus figé de 276 phrases : aucun cas variable n’a de clause de pause (ex. #242 : « 3 séries menées jusqu’à l’échec. ») | CONF | Rien. Demande de modification du corpus v15 pour tous les modes → arbitrage. | 276 phrases PASS | Conforme ; demande possible |

## 2. Observations conservées sans être transformées en défauts

| Réf. | Résultat déclaré | Observation | Statut |
|---|---|---|---|
| T-01 | Conforme | Au focus du nom, le clavier s’ouvre et Terminer remonte au-dessus. | Normal tant que le champ et l’action restent accessibles (`KeyboardAvoidingView` de l’éditeur). |
| T-18 | Conforme | Une valeur déjà renseignée ne peut pas être vidée par « − » : borne minimale. | Aucun contrôle d’effacement n’est prévu. Le cas « cible vide à l’initialisation » est réutilisé pour T-57 et R-15. |
| T-47 | Conforme | Récupérations existantes conservées ; nouvelle occurrence à 0 s sans reprise du défaut Profil. | Conforme à la règle PRE-3 (aucune récupération automatique). |
| T-48 | Conforme | Créer et Modifier ont la même structure. | À comparer chacun à sa propre référence figée, pas seulement l’un à l’autre. |
| T-50 | Conforme | Carte Paramètres de l’écran principal. | Non-régression à préserver. |
| T-66 | Conforme | Stepper de durée du Profil. | Non-régression à préserver : `ProfileStepper.test` reste vert. Seul le style `invalid` de `InlineStepper`, absent du Profil, a changé. |

## 3. Tests non concluants

| Réf. | Résultat | Suite proposée |
|---|---|---|
| T-04 | Clarifier | Parcours concret dans la procédure de retest (RT-07). |
| T-17 | Clarifier | Deux essais séparés A et B (RT-08). |
| T-42 | Non provoqué | Couvert par les tests techniques (REV-03 : ordre, réessai, absence de doublon) ; la preuve sur appareil reste ouverte. Pas besoin de le reproduire. |
| T-62 | Non testé | Contrôle visuel simple, sans VoiceOver (RT-09). |
| T-63, T-64, T-65 | Non testé | VoiceOver partiellement exploré, ni réussi ni en échec. Procédure courte après les corrections, sans exiger maintenant une nouvelle recette globale. |

## 4. Correspondance de toutes les entrées

Résultat déclaré conservé tel quel. « Inchangé » signifie qu’aucun code lié n’a été modifié dans cette correction ; le résultat n’est pas revérifié sur le nouveau candidat avant un retest.

| Réf. | Déclaré | Registre | | Réf. | Déclaré | Registre |
|---|---|---|---|---|---|---|
| T-01 | Conforme (réserve) | §2 | | T-34 | Écart | R-03, R-10, R-11 |
| T-02 | Conforme | inchangé | | T-35 | Écart | R-03 |
| T-03 | Conforme | inchangé | | T-36 | Conforme | inchangé |
| T-04 | Clarifier | §3, RT-07 | | T-37 | Conforme | inchangé |
| T-05 | Conforme (note E13) | inchangé | | T-38 | Conforme | inchangé |
| T-06 | Conforme | inchangé | | T-39 | Conforme (réserve) | R-13 |
| T-07 | Conforme | inchangé | | T-40 | Conforme | inchangé |
| T-08 | Conforme | inchangé | | T-41 | Conforme | inchangé |
| T-09 | Conforme (réserve) | R-04 | | T-42 | Non provoqué | §3 |
| T-10 | Écart | R-02 | | T-43 | Conforme (réserve) | R-13 |
| T-11 | Conforme | inchangé | | T-44 | Conforme | inchangé |
| T-12 | Conforme | inchangé | | T-45 | Conforme | inchangé |
| T-13 | Conforme | inchangé | | T-46 | Conforme | inchangé |
| T-14 | Conforme | inchangé | | T-47 | Conforme (réserve) | §2 |
| T-15 | Écart | R-01 | | T-48 | Conforme (réserve) | §2 |
| T-16 | Conforme | inchangé | | T-49 | Écart | R-06 |
| T-17 | Clarifier | §3, RT-08 | | T-50 | Conforme | §2 |
| T-18 | Conforme (réserve) | §2, R-15 | | T-51 | Conforme | inchangé |
| T-19 | Conforme (réserve) | R-04, R-05 | | T-52 | Conforme | inchangé |
| T-20 | Conforme | inchangé | | T-53 | Conforme | inchangé |
| T-21 | Conforme | inchangé | | T-54 | Écart | R-07 |
| T-22 | Conforme | inchangé | | T-55 | Écart | R-05 |
| T-23 | Conforme | inchangé (voir R-16) | | T-56 | Conforme | inchangé (glisser : R-01) |
| T-24 | Conforme (note E8) | inchangé | | T-57 | Conforme | R-15 (contour modifié) |
| T-25 | Conforme (réserve) | R-08 | | T-58 | Écart | R-08 |
| T-26 | Conforme | inchangé | | T-59 | Écart | R-03, R-09, R-10, R-11 |
| T-27 | Conforme | inchangé | | T-60 | Conforme (note E9) | inchangé |
| T-28 | Conforme | inchangé | | T-61 | Écart | R-12 |
| T-29 | Conforme | inchangé | | T-62 | Non testé | §3 |
| T-30 | Écart | R-19 | | T-63 | Non testé | §3 |
| T-31 | Conforme | inchangé | | T-64 | Non testé | §3 |
| T-32 | Conforme | inchangé | | T-65 | Non testé | §3 |
| T-33 | Conforme | inchangé | | T-66 | Conforme | §2 |
| A-01 | Écart | R-14 | | A-05 | Écart | R-18 |
| A-02 | Écart | R-15 | | A-06 | Écart | R-19 |
| A-03 | Écart | R-16 | | A-07 | Écart | R-15 |
| A-04 | Écart | R-17 | | | | |

## 5. Extension de portée demandée (non appliquée)

Ces chemins sont hors `write_scope@43e7b344`. Aucun n’a été modifié. Chacun exige une autorisation explicite avant élargissement.

| Chemin | Raison | Consommateurs | Impact |
|---|---|---|---|
| `src/features/reference-data/LabelPickerModal.tsx` (+ test) | R-03 : même défaut de clavier pour l’Étiquette | Composition (PRE-2) | Correction identique à Catégorie et Zone |
| `src/shared/ui/SegmentedControl.tsx` (+ test) | R-05 : libellés Côté (13, deux lignes) et Ordre (14 + 11, hauteur 60) ; sélection nulle ; hauteur fixe au texte agrandi (R-12) | Feuille Paramètres, Catalogue, Composition, Profil | Variante limitée à la feuille ; le standard Catalogue reste inchangé (DSF §3) |
| `assets/icons/icon-categorie.svg`, `assets/icons/manifest.json`, `src/shared/ui/KodjoIcon.tsx` | R-09 : icône de la Catégorie | Éditeur | Nouvel asset extrait du master figé `icon/categorie` |
| `src/features/sessions/ColorPalette.tsx` | R-11 : bandeau horizontal | Catégorie (PRE-3), Séance et Étiquettes (PRE-2) | Dépend de la décision sur les couleurs |
| `src/shared/ui/ScreenShell.tsx` | R-06 : halo sous Retour ; R-12 : hauteur d’en-tête fixe | Tous les écrans | Composant partagé : à traiter avec prudence |

## 6. Mise à jour du 12/10 — consolidation (`f372cc5d`)

Détail et sources : `consolidation-recette1.md`. Retest : `procedure-retest-recette1-v2.md`.

| ID | Nouvel état |
|---|---|
| R-02 | Toujours non reproduit (8 trajets). Scénario précis RT-02. |
| R-03 | Catégorie et Zone corrigées. Étiquette : surface PRE-2, **hors PRE-3**, non proposée en extension. |
| R-04 | Changement de besoin D-4 |
| R-05 | Extension technique X-1 (Côté, Ordre, sélection nulle, hauteur) ; graisse du Mode = changement de besoin D-6 |
| R-06 | Contradiction C-1 résolue (figé et ch. 12 > brief archivé). **Halo et fondu corrigés.** Couleur #EAEAFF : extension X-3 (token et ch. 12). |
| R-07 | Inchangé (interrupteur natif ; vérification par capture) |
| R-08 | C-4 : Annuler hors contrat (D-136 citée à tort) ; changement de besoin D-5 |
| R-09 | Extension X-2 (asset et `KodjoIcon`) |
| R-10 | C-6 résolue : **↑ dans le champ, corrigé** (Catégorie et Zone) ; Annuler conservé ; ✓ d’en-tête en création = D-8 |
| R-11 | C-5 résolue : **bandeau figé avec les 12 couleurs D-026, corrigé** ; pastille à droite = D-9 |
| R-12 | En-têtes des feuilles corrigés ; titres d’écran : extension X-4 ; Catalogue et Profil hors PRE-3 |
| R-14 | C-9 résolue : **déploiement à l’activation, corrigé** |
| R-15 | Contour corrigé ; messages = changement de besoin D-2 |
| R-16 | D-256 (décision validée) ; changement de besoin D-1 |
| R-17 | C-8 : **voile en fondu, corrigé** ; trajectoire de la feuille = D-7 |
| R-19 | Changement de besoin D-3 |

## 7. Décisions explicites du propriétaire — 12/10/2026

Consignées au registre du projet (`07 – Registre des décisions de conception.md`, section « Recette PRE-3 — décisions du propriétaire — 12/10/2026 »). Ces décisions ne valent pas accord global sur les extensions X-1 à X-4.

| Arbitrage | Décision | N° registre | Réalisation |
|---|---|---|---|
| D-1 Pas CR/Fin | A : pas constant de 1 | D-336 | Aucun changement nécessaire (déjà conforme) |
| D-2 Saisie incomplète | B : messages « Renseignez … » supprimés ; contour orange et ✓ bloqué conservés ; fond rouge reporté (Figma à définir) | D-337 | `4f1feebe`. La valeur à renseigner reste annoncée à VoiceOver sur le réglage (« Valeur à renseigner ») et ✓ « indisponible ». |
| D-3 Phrase | A : corpus conservé ; pauses variables = évolution ultérieure | D-338 | Aucun changement ; évolution consignée |
| D-4 Sélecteurs | A : application immédiate, valeur visible, fermeture progressive, « Réduire les animations » | D-339 | `4f1feebe` : cadre 220 ms (convention `SegmentedControl`), puis repli 200 ms |
| D-5 Ajustement | A : Annuler encadré clair ; Annuler restaure ; toucher le message ferme sans annuler | D-340 | `4f1feebe` : cadre blanc 1, rayon 8 (présentation proposée, absente du figé) |
| D-6 Options | B : plus petites, Regular, centrées, sans débordement (options seulement) | D-341 | **Bloquée par X-1** (`SegmentedControl.tsx` hors périmètre). Valeurs proposées ci-dessous, non validées. |
| D-7 Feuille | Voile en fondu sur place, feuille montante ; « Réduire les animations » | D-342 | `f372cc5d` et `4f1feebe` |
| D-8 Catégorie | B : toucher et ↑ marquent sans fermer ; ✓ confirme et ferme progressivement ; ✕ conserve la précédente | D-343 | `4f1feebe` |
| D-9 Palette | Barre sous le champ, sans pastille séparée, 12 couleurs | D-344 | Déjà réalisé (`f372cc5d`) |

**D-8, Catégorie créée puis ✕ — vérification du contrat.**
- CE-UI-09 §4 : « Création/suppression restent dans la famille de sélection » ; la création est une écriture du référentiel faite par ↑ (comportement existant : `createCategory` est immédiat).
- §5 : les affectations retirées restent conservables.
- **Conclusion** : ✕ n’annule que l’affectation. La Catégorie créée reste dans le référentiel, sans suppression silencieuse (test « D-8 — ✕ abandons the choice »). Aucune ambiguïté restante.
- Si un choix non confirmé est supprimé par appui long, le choix revient à la Catégorie actuelle de l’Exercice.

**D-6 — valeurs proposées (non validées), avec leurs références disponibles**

| Sélecteur | Proposition | Référence |
|---|---|---|
| Mode d’exécution (Durée, Répétitions, À l’échec) | Inter Regular 14, interligne 17, une ligne, centré | Taille des titres de ligne de la feuille (`type.label` : 14/17, en Medium) ; DSF actuel : Semi Bold 16 (abandonné par D-341) |
| Changement de côté (Sans changement, Droite puis gauche, Gauche puis droite) | Inter Regular 13, interligne 16, deux lignes, centré ; option de 34 dans un cadre de 42 | Figé 6407-10481 et DSF l.30 (13 px, deux lignes) ; la sélection passe de Medium à Regular (D-341) |
| Ordre des côtés (deux options) | Titre Inter Regular 14 / interligne 17, sous-titre Inter Regular 11 / interligne 13 (`type.caption`), centrés ; cadre 330×60 | Figé 6665-26185 et DSF l.31 (14/11) ; la sélection passe de Medium à Regular |
| Tous | Aucune ellipse ; hauteur minimale au lieu d’une hauteur fixe (texte agrandi) | Périmètre l.162, T-61 |

## 8. Extensions techniques encore nécessaires (mise à jour du 12/10)

| # | Objet | Dépend de | Fichiers |
|---|---|---|---|
| X-1 | D-341 (valeurs ci-dessus), libellés Côté et Ordre sur deux lignes, Mode affiché vide tant qu’il n’est pas choisi, hauteur minimale, cadre de la variante Paramètres | Approbation de l’extension et des valeurs D-341 | `src/shared/ui/SegmentedControl.tsx`, son test ; standard Catalogue inchangé |
| X-2 | Icône Catégorie | Approbation, et export du master `icon/categorie` vérifié | asset, `manifest.json`, `KodjoIcon.tsx` |
| X-3 | Zone de contexte #EAEAFF, fond de groupe #F3F3F6 | Approbation | 2 lignes du chapitre 12 (tokens dans `tokens.ts`, déjà dans le périmètre) |
| X-4 | Titre d’écran non rogné au texte agrandi | Approbation | `ScreenShell.tsx` (`minHeight`), son test |

**Extension bornée réutilisée** : `CategoriesSaveFlow.integration.test.tsx` et `CompositionExerciseFlow.integration.test.tsx`, déjà ouvertes en revue 1 pour leur harnais et leurs gestes. Seul le geste de confirmation D-8 a été ajouté (✓ après le toucher) ; aucune assertion n’a été modifiée.

## 9. Autorisations du propriétaire — 12/10/2026 (extensions X-1 à X-4, valeurs D-6)

Hermann autorise les extensions X-1, X-2, X-3 et X-4 nécessaires à la finalisation de PRE-3 et valide les valeurs D-6 (D-341).

| Point | Décision de Hermann | Réalisation |
|---|---|---|
| D-6 / D-341 | Mode : Regular 14, interligne 17, centré. Côté : Regular 13, interligne 16, deux lignes, centré. Ordre : titre Regular 14/17 et sous-titre Regular 11/13, centrés. **60 est une hauteur minimale, pas fixe** ; le texte agrandi reste entièrement lisible. Les titres des lignes ne changent pas. | `type.body` (14/17), nouveau `type.segmentedCompactLabel` (13/16), `type.caption` (11/13). Libellés Côté sur deux lignes (`sideModeOptions`), noms accessibles sur une ligne. Sous-titres d’ordre figés. Hauteurs minimales 42/42/60 ; options et cadre de sélection suivent la hauteur mesurée. |
| X-1 | Autorisée | `SegmentedControl.tsx` : variante `parameters` (cadre figé blanc, contour #DBDEE3, rayon 12, options #FCFCFE, libellés centrés sans troncature, hauteur minimale), `value: null` sans cadre de sélection, sous-titres. Rendu **standard (Catalogue) inchangé**. Tokens `parametersSegmentedBorder`, `parametersSegmentedOption`, `selectionSubtitle`, documentés au ch. 12. |
| X-2 | Autorisée, identité du master à vérifier avant export, preuve à conserver | Master `icon/categorie` (6296:10530) vérifié dans Figma, identique au figé (id, nom, 24×24, position). L’icône pleine de l’écran figé (7287:13722, sans master, supprimée depuis dans Figma) mesure exactement le glyphe du master à l’échelle 20/24 (11,667 × 16,25). Asset `icon-categorie.svg` (les 4 tracés du master), entrée de manifeste, `KodjoIcon`, affichage à 20×20. Preuve : `x2-icone-categorie/correspondance.json` et les exports bruts. |
| X-3 | Autorisée : rendu de l’application et documentation alignés ; autres consommateurs préservés | Tokens `exerciseEditorContextBand` #EAEAFF (zone de contexte de l’éditeur, avec le fondu existant) et `variableSeriesGroupSurface` #F3F3F6 (groupe Séries variables), appliqués au rendu et documentés au ch. 12. `exerciseContextBandBackground` est **inchangé**, la Composition l’utilise toujours. |
| X-4 | Autorisée : titres non rognés, écrans consommateurs vérifiés, présentation inchangée à taille normale | `ScreenShell.tsx` : `height` remplacé par `minHeight` de même valeur. Suites `ScreenShell`, Catalogue, Composition et `ExerciseScreen` vertes ; suite complète verte. |

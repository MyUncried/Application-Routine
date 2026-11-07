# 2026-11-06 — PRE-9 — Catalogues, cartes et badge « New » (D-501 à D-510)

## Mission

- **Identifiant :** `PRE9_CATALOGUES_CARTES_BADGE_NOUVEAU`.
- **Objectif :** implémenter les décisions D-501 à D-510 du 06/11/2026, puis livrer sur une branche dédiée avec une PR vers `main`, sans fusion.
  - Couleurs, onglets et zone de contexte des catalogues.
  - Carte Séance.
  - Carte Mouvement et piles.
  - Bandeau commun.
  - Badge « New ».
- **Demandeur :** Hermann (instruction du 06/11/2026).
- **Sources :**
  - `docs/KODJO-Catalogues-cartes-modales-2026-11-06.md` ;
  - `docs/KODJO-Badge-Nouveau-catalogue-mouvements-2026-11-06.md` ;
  - chapitres 06, 07, 10, 12 et 13 ;
  - `.github/orchestration/reports/2026-11-06_BADGE_NOUVEAU_INTEGRATION.md` ;
  - Figma `G6RY5Ebhgwb4AHIOYDwwvg`, consulté en lecture seule.

## Branche et point de départ

- **Branche :** `feat/pre9-catalogues-cartes-badge-20261106`.
- **Arbitrage de Hermann sur la base (06/11/2026) :** « pre9-bmad/dev + main (Recommandé) ».
  - `origin/main` (`1a28c7f6`) ne contient pas le code de PRE-9 : 128 commits locaux jamais publiés, 401 fichiers. Partir de `main` seul aurait obligé à refaire la zone de contexte, le mode catalogue des Formats et la première version du badge sur le code de PRE-8.
  - La branche part donc de `pre9-bmad/dev` (`c9096028`), avec fusion de `origin/main` @ `1a28c7f6` (décisions D-499 à D-510, jusqu'à `874b9f80`).
  - Commit de fusion : `81f427ec`.
  - Conflits documentaires résolus aux chapitres 10 et 13 : texte de `main` (D-504/D-505) retenu, annotations antérieures du 03/11 et du 05/11 conservées.
- **Conséquence :** la publication de la branche publie aussi les commits PRE-9 de `pre9-bmad/dev`, et la PR vers `main` les contient.

## Périmètre demandé

- **D-510 :** badge « New » et son cycle de vie, piles, défilement, accessibilité, exclusions.
- **D-508 :** carte Mouvement de 72, feuilles de pile, trois états « Nouveau » dans le composant réutilisable.
- **D-504 à D-507 :** carte Séance (disposition, ligne 3, Démarrer, interactions, contenu déplié).
- **D-501 à D-503 :** jetons par catalogue, fonds, zone de contexte, onglets, séparateur, champ de 34.
- **D-509 :** bande commune hors catalogue à #EAEAFF ; `selectionSurface` réservé à la sélection.
- **Hors périmètre :**
  - écrans Programmes ;
  - Calendrier et Suivi ;
  - parcours et moteur d'exécution des Formats ;
  - VNext.

## Périmètre réellement traité

- **D-501 à D-510 :** implémentés.
- **Répartition du travail :**
  - badge et carte Mouvement : session principale ;
  - carte Séance : agent délégué ;
  - couleurs, onglets et bande : agent délégué.
- **Contrôle des agents :** chaque changement a été repris dans la session principale (tests, types, lint, synchronisation documentaire).
- **Réponses de Hermann aux questions sur la saisie au clavier**, inscrites au registre :
  - question 1 : « Oui » ;
  - question 2 : « Saisie à la seconde » ;
  - question 3 : « Ok ».
  - Leur mise en œuvre n'est **pas** dans cette livraison.
  - La question 4 (cible commune vidée) attend la vérification de Hermann sur iPhone.

## Écarts code / sources constatés avant intervention

| Sujet | Code de départ | Source |
|---|---|---|
| Badge | Pastille « NEW » rouge, en majuscules. Détectée par comparaison de deux lectures du Catalogue, seulement après Créer ou Ajouter un niveau depuis la liste ; Ajouter un niveau depuis la fiche, duplication et Composition non reconnus. | D-510 : « New » vert en onglet, toute création, « New ↓ » sur une pile, défilement |
| Carte Mouvement | 80 pt, photo à 8 du bord, rayon 12, fond `#F9FAFC`, Niveau bleu, sélection par fond bleu | D-508 : 72, 4 / r8, fond blanc, liseré 50 %, Niveau noir, case de sélection |
| Feuilles de pile | 80, liseré 1 `#E0E3ED`, sans ombre | 72, liseré 0,5 à 50 %, même ombre |
| Carte Séance | 80, action lecture ronde, chevron seulement pour plusieurs exercices, format ou volume en ligne 3, sablier | D-504 à D-507 |
| Catalogues | Bande `selectionSurface` #E5F0FF partout, fond blanc, séparateur « \| » pour les Séances, champ de 44 | D-501 à D-503 |
| Bandes hors catalogue | `selectionSurface` #E5F0FF | D-509 : #EAEAFF |

## Modifications réalisées

### D-510 — badge « New »

- **Mémoire du marquage :** `src/features/activities/newMovementMarks.ts`, en mémoire, jamais persisté.
- **Points de marquage :**
  - `MovementCatalogueService.createIndependent` couvre le bouton +, Exercice libre et la duplication « Créer un nouveau mouvement » (`createAsNew`) ;
  - `MovementCatalogueService.createVariant` couvre Ajouter un niveau, depuis la liste comme depuis la fiche ;
  - `SessionService.createSession` / `updateSession` marquent les Mouvements `NEW` du brouillon, après un enregistrement réussi. C'est le cas de la création depuis la Composition.
  - Une réutilisation ou une correction (`EDITED`) ne marque rien.
- **`CatalogueScreen` :**
  - la vue Mouvements, affichée et au premier plan, déclare les marques qu'elle montre ;
  - les onglets du haut et la barre du bas retirent les marques déjà affichées ;
  - ouvrir une fiche puis revenir conserve le marquage ;
  - une fiche créée depuis la Composition reste marquée jusqu'à la visite suivante.
- **`MovementCatalogueList` :**
  - états `NO` / `YES` / `IN_PILE` ;
  - « New ↓ » sur la tête d'une pile repliée dont un niveau caché est nouveau ;
  - pile dépliée : « New » sur chaque fiche nouvelle ;
  - aucun badge en sélection ni hors de l'onglet Mouvements ;
  - défilement vers la fiche créée, ou vers sa pile repliée sans la déployer ;
  - une cible exclue par la recherche ou les filtres est abandonnée.
- **Rendu :**
  - formes d'onglet exportées de Figma : `catalogue-badge-nouveau.svg` (55 × 32) et `catalogue-badge-nouveau-pile.svg` (69 × 32), en vert #1F804F ;
  - libellé Inter Medium 12 blanc, sans majuscules forcées ;
  - découpe à l'arrondi de la carte ;
  - description arrêtée à 8 du corps de l'onglet ;
  - pas de cible tactile.
- **VoiceOver :** « nom, nouveau », et « …, contient un niveau nouveau » sur la tête de pile.

### D-508 — carte Mouvement

- Carte et feuilles de pile de 72, fond blanc, liseré `#CCD1E0` à 50 %, même ombre sur les feuilles.
- Photo à 4 du bord, rayon 8.
- Nom à 8 du haut ; Niveau en `#141414` (Figma), sur la ligne de base, à 12 du bord droit.
- En sélection : case Figma vide ou cochée, Niveau 12 pt avant la case, à la place du fond de sélection.
- Décalages de pile, actions glissées et commandes de niveau dérivent de la nouvelle hauteur.

### D-504 à D-507 — carte Séance (agent délégué)

- **Disposition :**
  - `SessionCard` réécrit : 72, photo 4 / r8, colonne des symboles ;
  - chevron sur toutes les cartes, → replié et ↓ déplié ;
  - durée en haut à droite, sans sablier.
- **Ligne 3 :**
  - « N circuits · N exercices », à partir de `structureCircuits` (projection : `shownCircuitCount`) ;
  - nombre de circuits omis sans circuit ou pour un seul circuit d'un tour ;
  - « 1 exercice » pour une séance à un exercice.
- **Démarrer :**
  - pilule de 24, cible de 48 (jeton `minTouchTarget`, au moins 44) ;
  - masquée sur une carte archivée ou avec `context="planning"`.
- **Zones de toucher :**
  - photo → ouvrir ;
  - Démarrer → `onStart` ;
  - chevron et zone centrale → déployer / replier ;
  - zone déployée → ouvrir.
  - Actions glissées de 72.
- **Contenu déplié :**
  - « Cycle » … « N passages » ;
  - « … · séries groupées / alternées » … « N tours » ;
  - « rép. ».

### D-501 à D-503 et D-509 — catalogues et bande commune (agent délégué)

- **Jetons :** `color.catalogue{Movements,Sessions,Programs}{Context,Background}` et `color.contextBand`, avec `catalogueColors(kind)`.
- **Écrans :**
  - fond de l'écran, de la barre d'état et de l'en-tête dans la couleur `background` du catalogue ;
  - zone de contexte : `context` opaque jusqu'à 80 %, puis fondu vers `background` ;
  - fondu au-dessus de la navigation basse (ajouté, absent du code).
- **Onglets :**
  - trois emplacements égaux, sans séparateurs ;
  - sélectionné en Bold `textPrimary`, les autres en Regular `textSecondary` ;
  - forme arrondie à 12, avec évasements de 10 dessinés en vues (`react-native-svg` n'est pas une dépendance du projet).
- **Zone de contexte :** séparateur « · » à 8 pt, champ Rechercher dessiné sur 34 pt avec une cible de 44.
- **`ScreenShell.ContextBand` :** `color` par défaut `contextBand` (#EAEAFF). La Composition et la sélection d'un mouvement existant passent de #E5F0FF à #EAEAFF ; la fiche Mouvement était déjà à #EAEAFF par son propre jeton.
- **Usages de sélection** conservés avec `selectionSurface`.

### Fichiers et documentation

- **Actifs :** quatre SVG déclarés dans `assets/icons/manifest.json`.
- **Jetons :** documentés au chapitre 12. Empreinte de `tokens.ts` mise à jour dans `pre4Story11Controls.test.ts`, avec historique.

## Synchronisation code / documentation

| Changement | Classe | Documents |
|---|---|---|
| D-501 à D-508, D-510 | A (le code rejoint des règles déjà écrites et intégrées le 06/11) | Aucun changement de règle. Renvoi spec §7 → badge. Chapitre 12 : jetons et choix techniques. |
| D-509, consigne de Hermann pour les bandes hors catalogue (#EAEAFF) | B | Registre D-509 complété par la consigne citée. Spec §3 et §9 annotées (« non modifiées » remplacé). Chapitre 06 annoté. |
| Recette du 06/11 (t-niveau) : pastille « NEW » rouge | Remplacé par D-510 | Registre, entrée de la recette annotée. |
| Réponses 1 à 3 sur la saisie au clavier | B (décisions, non mises en œuvre) | Registre, citées textuellement. |
| CE-CAT-CTX-01, ligne des boutons y=160 | Annotation (D-503) | Chapitre 13. |
| Badge, rendu et choix techniques | D | Chapitre 12. |

### À clarifier

1. **Circuit d'un tour dans un Cycle de plusieurs passages :** l'agent l'a compté comme « 1 circuit », puisqu'il est joué plusieurs fois. Les chapitres 10 et 13 disent seulement « un seul circuit d'un tour », ce qui l'omettrait. **Tranché par Hermann le 06/11/2026 : « Oui » (il compte) — consigné sous D-505.**
2. **Spec §4 :** « 22 pt de part et d'autre de la cible de 44 » est incompatible avec « 16 pt entre la ligne 1 et les boutons ». Figma a été suivi : environ 11 au-dessus, 22 en dessous. **Tranché par Hermann le 06/11/2026 : « Ok » — consigné dans la spec §4.**
3. **Séparateur « · » :** 8 pt selon la spécification, environ 6 pt mesurés dans Figma. La spécification a été appliquée.
4. **Démarrer :** aucun écran d'Exécution n'existe, donc la pilule est présente mais désactivée (comportement antérieur de l'action lecture, CE-T03-01). **Tranché par Hermann le 06/11/2026 : « Ok » — consigné sous D-506.**
5. **Durée de For time et Death by :** pas implémentée avant ce lot, et toujours pas. La carte affiche probablement « ≥ 0 s ». Hors lot.
6. **Bouton Retour de `FixedHeader` :** son cercle reste en `selectionSurface`. Ce n'est pas une bande ; à arbitrer.

## Preuves et tests

### Tests ciblés (Jest)

| Fichier | Résultat |
|---|---|
| `MovementCatalogueList.d510.test.tsx` (nouveau) | 12/12 |
| `newMovementMarks.test.ts` (nouveau) | 4/4 |
| `CatalogueScreen.r0611.test.tsx` (badge réécrit) | 7/7 |
| `MovementCatalogueList.r0611.test.tsx` | 8/8 |
| `MovementCatalogueList.fam.test.tsx` (géométrie passée de 80 à 72) | 14/14 |
| `MovementCatalogueService.b1` et `SessionService` (marquage des créations, échec, `EDITED`) | 38/38 |
| `src/shared/ui/__tests__` | 159/159 |
| Fichiers de la carte Séance (agent) | 71/71 |
| Fichiers de la zone de contexte et de la bande (agent) | verts |

### Suite complète, types et lint

- Suite complète `npx jest --testPathIgnorePatterns "\.claude"` : **313 suites, 5 475 tests, tous verts** (aucun échec, `CompositionScreen.recette1` compris).
- `npx tsc --noEmit` : propre.
- `npx eslint` sur les fichiers modifiés : 0 erreur ; 1 avertissement antérieur (`sessionDraftsEqual` inutilisé dans `CompositionScreen.test.tsx`, présent avant la mission).

### Couverture

- Badge :
  - cycle de vie ;
  - retour depuis chaque point de création ;
  - ouverture d'une fiche puis retour ;
  - création depuis la Composition, changement d'onglet et redémarrage (mémoire vidée) ;
  - piles repliées et dépliées, plusieurs nouveautés ;
  - filtres et recherche ;
  - défilement vers une fiche ou une pile.
- Carte Séance :
  - zones de toucher distinctes ;
  - ligne 3 : un exercice, circuits d'un ou plusieurs tours ;
  - Démarrer masqué en planification et pour une carte archivée.
- Couleurs :
  - couleurs des deux catalogues ;
  - bandes hors catalogue à #EAEAFF.

## Hypothèses non démontrées

- **Liste du catalogue sous la zone de contexte :** les cartes restent visibles à travers le fondu, par transparence. Figma montre ce fondu opaque.
- **Défilement vers la fiche créée :** il suppose la mise en page mesurée de l'entrée. Le rendu réel du défilement animé n'est pas démontré.
- **Forme de l'onglet sélectionné, dessinée en vues :** son raccord sans liseré avec la zone n'est pas démontré.

## Vérifications restant à faire sur iPhone

Aucune fidélité visuelle et aucun VoiceOver ne sont validés par les tests automatisés.

- **Badge :**
  - forme d'onglet, raccord au coin arrondi, lisibilité ;
  - description raccourcie ;
  - « New ↓ » ;
  - annonce VoiceOver ;
  - défilement au retour ;
  - disparition par les onglets du haut et la barre du bas, et non à l'ouverture d'une fiche ;
  - fiche créée depuis la Composition, visible à la visite suivante ;
  - disparition après fermeture complète de l'application.
- **Carte Mouvement :**
  - cotes 72 / 4 / 8 / 12 ;
  - Niveau noir sur la ligne de base ;
  - case de sélection (la sélection n'a plus de fond bleu) ;
  - feuilles de pile ombrées ;
  - actions glissées et commandes de niveau.
- **Carte Séance :**
  - ligne de base nom / durée, troncature ;
  - pilule Démarrer (pâle, désactivée) ;
  - chevron pivoté ;
  - aucun déclenchement croisé entre photo, chevron, zone centrale, Démarrer et glissé ;
  - actions glissées de 72 ;
  - cartes rouge et orange ;
  - texte agrandi.
- **Catalogues :**
  - couleurs de fond, de la barre d'état et de la zone ;
  - raccord de l'onglet sélectionné ;
  - fondu de la zone et fondu au-dessus de la navigation ;
  - champ de 34 et cibles ;
  - séparateur.
- **Hors catalogue :** bande #EAEAFF de la Composition et de la sélection d'un mouvement existant.
- **Non-régression :** Calendrier et Suivi, encore provisoires (`PlaceholderScreen`), ne sont touchés par aucun changement.

## Éléments non corrigés ou hors périmètre

- **Mise en œuvre des réponses 1 à 3 sur la saisie au clavier :**
  - réglages de Format au clavier ;
  - Récupération à la seconde ;
  - saisie en heures au-delà de 99:59.
- **Question 4 (cible commune vidée)** : en attente de Hermann.
- **Remarques de la recette du 06/11 au soir, validation demandée et non donnée :**
  - homogénéité des tableaux des Formats ;
  - fondus lents ;
  - clavier de Récupération ;
  - durée de circuit.
- **Écrans Programmes, Calendrier, Suivi ; moteur d'exécution.**
- **Cartes de séance des contextes Calendrier, Suivi et Choix multiple :** non migrées (§9 de la spécification).

## Fichiers modifiés

Voir le commit de livraison : `git show --stat` sur la branche. Principaux :

- **Badge et carte Mouvement :**
  - `src/features/activities/newMovementMarks.ts` (nouveau) ;
  - `MovementCatalogueList.tsx` ;
  - `MovementCatalogueService.ts` ;
  - `src/features/sessions/SessionService.ts`.
- **Carte Séance :**
  - `SessionCard.tsx`, `SessionCatalogueList.tsx` ;
  - `SessionCompositionTree.tsx`, `sessionCatalogueProjection.ts`.
- **Catalogues et bande :**
  - `CatalogueScreen.tsx`, `CatalogueNavigation.tsx` ;
  - `ScreenShell.tsx`, `catalogueContext.ts`, `CatalogueCommands.tsx` ;
  - `SessionViewToggle.tsx`, `MovementCounterToggles.tsx`.
- **Jetons, chaînes et actifs :**
  - `src/shared/ui/tokens.ts`, `src/shared/i18n/resources/fr.ts` ;
  - `assets/icons/*.svg` (quatre), `assets/icons/manifest.json`.
- **Tests :** voir la section « Preuves et tests ».
- **Documentation :**
  - chapitres 06, 07, 12 et 13 ;
  - `docs/KODJO-Catalogues-cartes-modales-2026-11-06.md`.

## Suite complète

313 suites, 5 475 tests : PASS (exécution du 06/11/2026 sur l'arbre de livraison, avant les seules retouches documentaires et la suppression d'un import inutilisé dans un test, relancé ensuite : 8/8).

## Commit final et état Git

- Commit de livraison (code, tests, documentation) : `d737e2b8` ; fusion de `main` : `81f427ec` ; ce rapport finalisé dans le commit documentaire qui suit `d737e2b8`.
- Branche publiée : `origin/feat/pre9-catalogues-cartes-badge-20261106` ; PR #420 vers `main`, **non fusionnée** : https://github.com/MyUncried/Application-Routine/pull/420
- Arbre de travail propre après publication ; `main` inchangée ; `pre9-bmad/dev` inchangée (locale).

## Recette iPhone du 06/11/2026 au soir — résultats et reprise des régressions

Cahier : https://claude.ai/artifact/XJCJLC7eHKcANDMrN1yNku (section « Livraison D-501 à D-510 »). Version testée : branche à `9a9c075f` (code de `d737e2b8`), Metro redémarré après la livraison ; saisies à partir de 18:31 UTC.

- **Livraison D-501 à D-510 :** 18 OK, 1 sans objet (VoiceOver non testé), 1 KO : `d-nonreg` — Hermann : « Ouvrir une pile, déplacer un mouvement : il disparaît, ou se repositionne mal. »
- `d-new-dup` (OK, note : « on ne peux pas dupliquer un mouvement ») : aucune action « Dupliquer » n'existe ; la copie passe par « Créer un nouveau mouvement » lors de la modification d'un mouvement utilisé. Fonction non spécifiée, hors lot.
- Les écarts de la recette du 06/11 après-midi (tableaux, champ de valeur, fondus, filtre, clavier, Buy-in / Buy-out, récapitulatif) n'étaient pas dans ce lot : lot de corrections distinct, à venir.

### Analyse historique des régressions (règle du 06/10)

| Constat | Dernier succès comparable | Premier échec conservé | Mécanisme introduit | Attribution |
|---|---|---|---|---|
| `d-nonreg` : carte déplacée dans une pile ouverte qui disparaît ou se replace mal | Recette FAM du 28/10 (`f7540637`) : glisser dans une pile validé | Recette du 06/11 au soir (version `d737e2b8`) | `8a5befaf` (06/11, 15:25, t-catalogue) : glissements de pile Reanimated (`entering`/`exiting` par translation vers la carte du dessus, superposition `zIndex`) actifs aussi pendant le geste et à la dépose ; `d737e2b8` n'a changé que la hauteur des cartes (80 → 72), dont tous les pas sont mesurés | **Plausible** : `8a5befaf`. Une carte sortie d'une pile à la dépose rejouait sa sortie (retour sous la carte du dessus) ; la superposition revenait pendant le retour de la carte déposée. Non reproduit hors iPhone. |
| `t-glisser` : famille ouverte par l'arrêt avec un gros soubresaut | Recette FAM du 28/10 (FAM-05) | Recette du 06/11 au soir (note du 20:53 UTC) | `8a5befaf` : les cartes de la pile ouverte pendant le geste glissaient depuis la carte du dessus pendant que la carte portée était recalée sous le doigt (FAM-05) | **Plausible** : `8a5befaf`. |
| `t-depli` / `w-depli` : premier déploiement brutal, ligne des noms gardée puis repliée | Aucun succès sur iPhone pour le premier déploiement d'un Circuit monté replié | Recette du 06/11 après-midi (`w-depli`, version `8a5befaf`) | `e74533f3` (attente de la mesure) puis `8a5befaf` (départ « à l'aveugle ») supposent que la mesure des cartes arrive pendant le déploiement | **Indéterminée** : le symptôme correspond à une mesure jamais reçue avant la fin de la progression, mais sa cause (mesure tardive ou nulle) n'est pas démontrée. Troisième tentative non faite à l'aveugle : traces de diagnostic à relever sur iPhone. |

### Correction (classe A — retour au comportement validé du 28/10, sans changer la règle)

- `MovementCatalogueList.tsx` : pendant le geste et 900 ms après le relâchement (`DROP_SETTLE_MS`, écriture et relecture comprises), ni glissement de pile, ni révélation d'entrée, ni superposition, ni transition de place. Le glissement lent du repli / dépli à la main (t-catalogue) est conservé hors geste.
- Test : `MovementCatalogueList.r0611.test.tsx`, « d-nonreg / t-glisser » — échoue sur le code précédent, passe sur le correctif.
- `t-depli` : non corrigé ; traces `[t-depli]` (mode développement, non committées) pour relever sur iPhone l'instant de la mesure des cartes par rapport au départ et à la fin du déploiement.

### t-depli — cause démontrée et correction (07/11/2026)

- **Preuve (traces Metro, iPhone de Hermann, version `97a2848c` + traces) :** trois premiers déploiements identiques — demande ; contenu mesuré **0** à +7 / +13 / +9 ms ; départ « à l'aveugle » à +124 / +128 / +132 ms ; fin du déploiement à +825 / +828 / +832 ms sans mesure ; vraie hauteur (169, 258) reçue à +864 / +870 / +877 ms, après la fin. Les déploiements suivants (hauteur connue) partaient normalement.
- **Attribution révisée — démontrée :** le contenu, dans la liste fermée (hauteur maximale 0), était mis en page à 0. Les correctifs `e74533f3` et `8a5befaf` supposaient une mesure tardive ; elle était en réalité nulle. Le défaut d'origine est antérieur à ces deux commits : la mesure du contenu d'une liste fermée (contre-recette n° 4 du 01/11).
- **Correction (classe A) :** `useCircuitCardsReveal` renvoie `contentStyle` ; en attente de la première mesure, le contenu est posé hors du flux (position absolue, même largeur), donc mesuré à sa hauteur naturelle ; `CompositionScreen` l'applique au contenu des cartes d'un Circuit. Test ajouté (`CompositionScreen.tdepli.test.tsx`).
- **Vérification sur iPhone (version corrigée, traces) :** quatre premiers déploiements — hauteur réelle (258, 169) reçue à +3 à +9 ms, départ immédiat avec elle, fin à +717 à +738 ms. **Hermann : « Test OK ».** Traces de diagnostic retirées avant le commit.
- **Reste du constat t-depli :** le repli lent des Circuits à l'entrée de « Créer → Ajouter un cycle » (demande nouvelle, classe B) est reporté au lot de corrections suivant.

## 07/11/2026 — réglages de Format dans les cadres des Paramètres d'exécution ; marqueurs de conflit

### Marqueurs de conflit (défaut de la fusion `81f427ec`)

En préparant la documentation, des marqueurs `<<<<<<<` / `=======` / `>>>>>>>` ont été trouvés dans quatre documents, introduits par la fusion de `main` (`81f427ec`, absents de ses deux parents) : ch07, `KODJO-Formats-entrainement-2026-11-02.md`, `KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md`, `PRODUCT.md`. Seuls ch10 et ch13 avaient été résolus. Corrigé dans `0b760acf` : texte de `main` (normatif, plus récent) et annotations de recette PRE-9 conservées ; ch07 : les deux sections gardées ; spec carte : texte antérieur conservé, marqué remplacé par D-504. Vérification : `git grep` sans marqueur sur tout le dépôt.

### Réglages de Format (demande de Hermann du 07/11, classe A)

- **Demande :** citée mot pour mot au registre ch07, « Recette iPhone du 07/11/2026 ».
- **Sources :** CE-FMT-04 §7 (« Feuille standard et ses six blocs ») ; Figma, lu sans modification : `8598:30873`, `11255:19238`, `8598:31560`, `11312:19699`, `8795:14588`, `8598:31210`, `11373:20396`.
- **Réalisé (`ExecutionParametersSheet.tsx`) :**
  - cadre séparé « {format} » à steppers ± retiré (`FormatSettingsFrame` réduit à ses types et contrôles EMOM) ;
  - Rôle dans le cadre Exécution, sous la Condition d'arrêt (segmenté « Paramètres », trois segments de 70 pour le For time) ;
  - Incrément par tour / par intervalle et Intervalle dans le cadre Séries, avant la Charge ; message EMOM sous l'Intervalle ;
  - Durée de l'exercice (AMRAP seul), Durée maximum du For time (vidée : « Aucune ») et durée héritée du Circuit (For time membre, grisée) comme valeur de la ligne « Durée de l'exercice » du cadre Cadence, sans doublon ;
  - Death by : À l'objectif grisé dans la Condition d'arrêt, ligne « Condition d'arrêt À l'échec » séparée retirée ;
  - nom du Format dans le titre de la feuille ;
  - saisie au clavier (`formatIncrement`, `formatInterval`, `formatDuration`, `formatTimeCap`), Précédent / Suivant dans l'ordre de la feuille, « ± » de la barre pour l'Incrément AMRAP.
- **Tests :** `ExecutionParametersSheet.format0711.test.tsx` (7).
- **[Clarifié]** « séries par intervalle (?) » du Death by (Figma : « Séries · Variables | Jusqu'à l'échec ») — non réalisé. [Réponse de Hermann le 07/11/2026 : deux captures Figma (« Voici une interface figma des paramètres d'exécution de death by dans le cas d'un exercice , et de plusieurs exercices avec option "dans chaque intervalle". »), « Death by — Modale exercice, standard » et « …, dans chaque intervalle » (`11373:20396`). Réalisé (classe A, Formats §12 et §14) : ligne Séries « Jusqu’à l’échec » (autonome uniquement), À l’échec imposé dès l’ouverture, Nombre de répétitions visible, ni Pause ni Durée de l’exercice ; dans chaque intervalle, ni Séries ni Intervalle. Ligne `seriesUntilFailure` (`formatSheetContext.ts`), `deathBySheet` / `deathBySeriesRow` (`ExecutionParametersSheet.tsx`) ; 2 tests ajoutés (`ExecutionParametersSheet.format0711.test.tsx`, 9/9). Capture iPhone de Hermann du 07/11 : ancien bundle (cadre « Death by » séparé), Metro étant arrêté — non probante pour 0f8de24e. Vérification iPhone à faire.]
- **À vérifier sur iPhone :** place, couleurs et dimensions des lignes dans chaque Format ; saisie au clavier et « ± ».
- **Suite complète :** 314 suites, 5 484 tests ; 5 483 verts, 1 échec : `CompositionScreen.recette1` « disposition générale (deux Circuits) » (second toucher de carte après fermeture de la feuille). Échec préexistant et indépendant de ce lot : il se reproduit à l'identique sans ces modifications (arbre remis à `3f084f35`) et avec la version de `CompositionScreen.tsx` de `97a2848c` ; déjà signalé instable au rapport de `8a5befaf`. Vert lors de la suite du 06/11 au soir. À analyser séparément.

## Fusion de main du 07/11/2026 (PR #422, D-511 à D-513)

- Cause : `main` a reçu `c67ca6e6` (PR #422, documentation Composition cartes, en-têtes et placement D-511 à D-513) ; la PR #420 était `CONFLICTING`.
- Conflits : `KODJO-Composition-conteneurs-2026-10-28.md`, ch07, ch12, ch13 — tous des ajouts parallèles sur les mêmes paragraphes.
- Résolution : union des deux côtés. Annotation « [Remplacé le 06/11/2026 pour la Composition uniquement — D-511 à D-513 … §11.] » de `main` ajoutée à la suite du texte de la branche, qui conserve ses annotations de recette PRE-9 ; ch12 : paragraphes PRE-9 puis section « DSF — Carte d’exercice de Composition » de `main`.
- Contrôle : occurrences de « D-511 à D-513 » identiques à `main` (3, 6, 6, 8) ; occurrences des annotations de recette identiques à la branche (11, 93, 5, 80) ; aucun marqueur `<<<<<<<` / `>>>>>>>` dans le dépôt.
- Code : aucun fichier hors `docs/` et rapports n’arrive de `main` ; aucun test à relancer pour cette fusion. Classe D (intégration documentaire, aucune décision).

## EMOM — pas de Pause après chaque série (07/11/2026)

- Hermann : « Paramètres EMOM - il n’y a pas de ligne « Pause après chaque série il me semble ». Vérifie et dis moi »
- Vérification : Figma « EMOM — Modale exercice, standard » `8795:14588`, cadre Séries = Séries, Nombre de répétitions, Intervalle (à la place de la Pause), Charge ; Formats §14 : l’Intervalle « remplace la Pause ». Écart confirmé : la feuille affichait les deux lignes.
- Correction (classe A) : Pause retirée de l’affichage et de l’ordre du clavier dès que l’Exercice porte son Intervalle (`formatShown("interval")`). Test EMOM complété ; `ExecutionParametersSheet.format0711` 9/9, tsc OK.
- Non tranché : EMOM membre d’un Circuit « dans chaque intervalle » (Intervalle porté par le Circuit) — la Pause y reste affichée, aucune maquette ni règle explicite.

## EMOM — décisions du 07/11/2026 : inventaire, corrections, tests

Demande de Hermann du 07/11/2026 (texte complet recopié dans ch07, « EMOM — champs de la modale « Paramètres d’exécution » et règles de conversion (Hermann, 07/11/2026) » ; point 13 remplacé le même jour : aucune recopie de S1). Sources vérifiées : Formats §1, §6, §6.1, §7.6, §10, §13 ; Figma `8795:14588` (seul, à la suite), `11856:24719` (en alternance), `8598:30515` (dans chaque intervalle). Audit en lecture seule délégué à un sous-agent (C, D, 15 à 22), conclusions principales revérifiées dans le code avant correction.

### Inventaire des écarts constatés (avant correction)

| Point | Cas | Constat | Correction | Classe |
|---|---|---|---|---|
| A2 | 1 à 4 | « À l’échec » sélectionnable dans la modale ; cible commune « à l’échec » reprise à l’entrée dans un porteur ; « à l’échec » propagé à la sortie | Modale : À l’échec grisé, À l’objectif imposé à l’ouverture (`stopTarget`) ; `enterCarrier` / `exitCarrier` : « à l’échec » → à renseigner | B (A2/B9) |
| A8 | 1 à 3 | Ligne Pause affichée (corrigé le matin pour 1 à 3, `f0f8ebab`) ; cas 4 encore affiché | Plus jamais de Pause pour l’EMOM | A (§14) |
| B | 1, 2 | Durée de l’exercice modifiable au cadre Cadence | Lecture seule, N × intervalle, sous l’Intervalle, chevron « Durée et signaux » conservé (Figma `11856:24719`) | B |
| B | 3 | Récupération affichée et conservée à l’entrée dans un Circuit standard alterné | Modale : absente, appliquée à 0 s ; `settleEntry` (SERIES) : 0 s | B |
| B | 4 | Récupération et Durée affichées ; N modifiable (Circuit TOURS non hérité) | Absentes ; N imposé (`inheritsCircuitSeriesCount` : porteur EMOM) | B |
| C11 | 4 | Composition : contrôle de l’intervalle du porteur sur le rang 0 seulement | Rang par rang | A (§14) |
| C12 | 1 à 4 | Composition : aucun contrôle après ajout d’un membre, changement du nombre de tours ou des paramètres ; enregistrement non bloqué | `configurationValidity` (raison `EMOM_DURATION` seule) : cartes en rouge, message, Enregistrer indisponible | A (§14, complément du 5 novembre) |
| D13 | — | Aucune recopie de S1 | Aucune (conforme au point 13 remplacé) ; §10 annoté | A |
| D14 | 4 | Un EMOM simple entrant restait inchangé (Intervalle propre, séries, Récupération) | `isMemberShaped` : EMOM avec Intervalle ou séries ≠ tours → converti | A (§6) |
| 4 | 4 | Changer le nombre de tours d’un porteur EMOM ne redimensionnait pas les séries des membres | Séries conservées, lignes ajoutées à renseigner, surplus retiré | A (§14) |
| 15 | 4 | Sortie « Conserver » : Récupération héritée | Récupération 0 s ; cibles et charges par série conservées | B |
| 16 | 2 | Conforme | — | — |
| 17 | 3 | Récupération conservée | 0 s (voir cas 3) | B |
| 18 | 2, 3 | Sortie d’un « À la suite » : Récupération entre mouvements conservée | Récupération 0 s à la sortie d’un Circuit standard | B |
| 19 | — | Conforme par reconstruction (`applyModelReedit` → `buildModelElements`) | — (aucun test de réédition EMOM) | — |
| 20 | 4 | Conforme | — | — |
| 21 | — | Risque « ≈ » sur une carte EMOM avec cadence | `formatOccurrenceEstimatedDuration` : `null` pour l’EMOM | A |
| 22 | 4 | Conforme | — | — |

### Fichiers modifiés

- `src/features/activities/ExecutionParametersSheet.tsx`, `FormatSettingsFrame.tsx` (lignes `stopTarget`, `durationReadOnly`, `noRecovery`) ; `src/features/sessions/formatSheetContext.ts` ; `movementExercises.ts` ; `compositionPresentation.ts` ; `CompositionScreen.tsx`.
- `src/domain/sessions/carrierMembership.ts`, `layoutOperations.ts`.
- Tests : `ExecutionParametersSheet.format0711.test.tsx` (cas 1 à 4), `carrierMembership.c4.test.ts` (14, 15, 17, 18, 20, nombre de tours), `compositionPresentation.test.ts` (21).
- Docs : ch07 (texte complet, clarification du point 13), Formats §10 (cas 3, À l’échec, Durée, S1).

### Tests

- `tsc --noEmit` : OK.
- `npx jest src/domain` + `compositionPresentation*` + `format0711` : 80 suites, 2 055 tests, tous verts ; `carrierMembership.c4` 19/19 ; `format0711` 12/12.
- Suites `src/features` : lancement arrêté par manque de mémoire du poste ; avant l’arrêt, 21 suites PASS (dont `CompositionScreen.test`, `.b1b`, `.b2`, `.b4`, `.b5`, `.b6`, `.recette1`, `.recette2`, `.incident0111`, `ExecutionParametersSheet.test`, `ExerciseScreen.test`), aucun FAIL. Suite complète non terminée.

### Non traité / à arbitrer / à vérifier

- **17 — confirmation de perte** : un EMOM simple de plus de séries que de tours déposé dans un Circuit standard alterné déclenche la confirmation de perte des Circuits standards (`lostSeriesCount`). La règle 17 dit « admis ; son nombre de séries prend les tours du circuit » sans parler de confirmation : à faire trancher par Hermann.
- **Exécution** : `planExpansion.ts` émet encore la Récupération d’un membre EMOM d’un Circuit alterné si elle n’est pas nulle (anciennes données) ; l’Exécution n’existe pas encore (Démarrer désactivé).
- **C12** : l’en-tête du Circuit porteur n’est pas mis en rouge, seulement les cartes de ses membres ; aucun test d’écran de ce contrôle.
- **19** : aucun test de réédition EMOM avec changement d’exécution.
- Vérification iPhone de l’ensemble : non faite (Metro arrêté par manque de mémoire).

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

## EMOM — réponses de Hermann du 07/11/2026 (point 17, contrôle de la Composition, Récupération dans les données)

- **Objectif** : appliquer les trois réponses de Hermann aux points laissés ouverts par la section précédente (texte recopié mot pour mot dans ch07, section EMOM du 07/11/2026).
- **Branche** : `feat/pre9-catalogues-cartes-badge-20261106` (PR #420, non fusionnée). **Commit de départ** : `b04eb09e`.
- **Périmètre demandé** : (1) point 17 — confirmation de perte conservée seulement s'il y a plus de séries que de tours, séries ajoutées à renseigner sinon ; (2) Composition — Circuit en rouge dès qu'une carte de membre l'est, durée de tour en rouge (« dans chaque intervalle ») ; (3) Récupération à 0 s dans les données à l'entrée dans un Circuit alterné ou « dans chaque intervalle », données existantes normalisées.

### Constats avant correction

| Réponse | Constat | Correction | Classe |
|---|---|---|---|
| 1 | Confirmation déjà affichée seulement au-delà des tours (`lostSeriesCount`) ; mais les séries ajoutées (moins de séries que de tours) recopiaient la dernière ligne (cible, pause, charge) | `adaptExercise` (seul point d'adaptation au compte d'un Circuit alterné : entrée, passage en alterné, nombre de tours, ancien modèle compris) : pour un EMOM simple, séries ajoutées à renseigner, Pause 0, charge de la dernière ligne ; réserve restaurée d'abord | B |
| 2 | Disposition générale (plusieurs Circuits) : les cartes des membres ne passaient **pas** en rouge — le contexte des cartes de `LayoutSequence` ne recevait pas les Exercices en dépassement (seul le rendu par zones les recevait) | `emomOverflowIds` transmis au contexte de la disposition ; cartes des Exercices directs et des membres en rouge | A (C12) |
| 2 | Circuit replié : teinté pour « à compléter » / « à vérifier », pas pour le dépassement d'intervalle | `collapsedCircuitTone(…, hasEmomOverflow)` : Circuit replié en rouge (règle de la recette n° 3 du 03/11/2026) | A |
| 2 | Durée de tour de l'en-tête toujours en bleu | Ton `OVERFLOW` (`colors.danger`) pour un Circuit porteur EMOM en dépassement | B |
| 3 | Récupération mise à 0 s seulement à l'entrée d'un EMOM simple dans un Circuit alterné ; conservée au passage d'un Circuit groupé en alterné, au changement du nombre de tours, et pour un membre déjà au format d'un Circuit porteur EMOM | `adaptExercise` (tous les chemins alternés) et `enterCarrier` (membre déjà au format) : Récupération à 0 s dans le brouillon, donc dans les données enregistrées | B |
| 3 | Données déjà enregistrées : Récupération non nulle possible | Migration 023 (`migration023.ts`), reprise de données sans changement de schéma | B |

Portée retenue pour (3) : l'Exercice EMOM, objet de la demande ; la Récupération des Exercices standards d'un Circuit alterné n'est pas modifiée (aucune règle ne la retire). Confirmé par Hermann le 07/11/2026 : « Un exercice : que pour l’emom ».

### Migration 023

- Numérotation vérifiée : dernière migration de la branche = 022 (nom du Circuit) ; `origin/main` n'en a pas de plus récente. A.5 (non autorisée) prendra la suivante disponible. Aucune migration existante réécrite.
- `UPDATE activities SET post_activity_recovery_seconds = 0 WHERE type = 'EXERCISE' AND format_key = 'EMOM' AND post_activity_recovery_seconds <> 0 AND tour_id IN (SELECT id FROM tours WHERE nature = 'SERIES' OR format_key = 'EMOM')`.
- `post_activity_recovery_present` et `updated_at` conservés ; EMOM « À la suite » (groupé standard), EMOM hors Circuit, autres Formats et Exercices libres inchangés ; séances jouées et instantanés non touchés.
- Transaction exclusive unique : un échec laisse `user_version` à 22. Idempotente.
- Effet sur l'iPhone : appliquée au prochain démarrage de l'application avec ce code. Non vérifiée sur l'appareil.

### Fichiers modifiés

- Domaine : `src/domain/sessions/circuit.ts` (`adaptExercise`, `resizeEmomSeries`), `layoutOperations.ts` (entrée en alterné simplifiée), `carrierMembership.ts` (`enterCarrier`).
- Base : `src/infrastructure/database/migrations/migration023.ts` (nouveau), `migrateDatabase.ts`, `constants.ts` (version 23).
- Composition : `src/features/sessions/CompositionScreen.tsx`, `compositionPresentation.ts`, `carrierPresentation.ts`, `CircuitHeader.tsx`.
- Tests : `migration023.test.ts` (nouveau), `CompositionScreen.emom0711.test.tsx` (nouveau), `carrierMembership.c4.test.ts` (+4) ; tests de migration 012 à 022 et `executionParametersV3.roundTrip` alignés sur la version 23 (`migration022.test` arrêté explicitement à 22).
- Docs : ch07 (réponses recopiées, portée et classes), ch12 (migration 023), Formats §10 (annotation).

### Tests

- `tsc --noEmit` : OK.
- `npx jest src/domain` : 76 suites, 1 957 tests, verts (avant ajout des 4 tests) ; `carrierMembership.c4` : 23/23.
- `npx jest src/infrastructure/database` : toutes les suites vertes, dont `migration023` 3/3.
- `npx jest src/features` (hors Composition) : 147 suites, 2 053 tests, verts.
- Composition, en-têtes, présentation, porteurs : 25 suites, 748/749 au lancement groupé ; l'échec (`CompositionScreen.recette1`, « disposition générale (deux Circuits) ») ne se reproduit pas seul (9/9) : instabilité sous charge, non liée au changement. `CompositionScreen.emom0711` : 2/2.

### Non traité / à vérifier

- **Circuit déplié** : la règle existante (03/11) ne teinte que le Circuit **replié** ; déplié, ses cartes sont visibles en rouge et l'aplat reste habituel. Confirmé par Hermann le 07/11/2026 : « Circuit déplié : pas en rouge. Mais cette règle est déjà définie et développée, pourquoi chercher à mettre une exception ? » — règle existante appliquée, aucune exception ; la question n'avait pas lieu d'être posée.
- **Ancien modèle (un seul Circuit standard)** : le contrôle C12 de la Composition ne porte que sur la disposition générale ; un EMOM « À la suite » ou alterné ne peut toutefois dépasser son intervalle propre que depuis la modale, qui bloque déjà.
- **Point 19** : toujours aucun test de réédition EMOM.
- **iPhone** : rien vérifié sur l'appareil (Metro arrêté).

## Recette iPhone des livraisons du 07/11/2026 — préparation

- Metro relancé (`--clear`, tunnel `fi5f9dc-uncried-8081.exp.direct`) ; bundle iOS servi vérifié : contient `applyMigration023`, `carrierDurationOverflow`, `resizeEmomSeries`.
- Cahier de recette (https://claude.ai/artifact/XJCJLC7eHKcANDMrN1yNku), nouvelle section en tête « Livraisons du 7 novembre (d72ac047) — à tester », 16 points : piles du Catalogue (`97a2848c`, jamais confirmé), réglages de Format dans les cadres (`0f8de24e`), Death by (`06224da1`), EMOM (`f0f8ebab`, `b04eb09e`, `1dcfdf70`), migration 023, question 4 (cible commune vidée).
- Aucun résultat iPhone reçu à ce stade.

## Homogénéité des tableaux des Formats et convention des champs de valeur (07/11/2026)

- **Objectif** : traiter la remarque générale e de la recette du 06/11 (« J'ai un problème d'homogénéité des tableaux plusieurs fois rapporté comme un écart, le résoudre une bonne fois pour toute ») et les KO de présentation associés (w-alignement, w-series, r-colonnes, n-cadres, w-charge-un), ainsi que les remarques B du récapitulatif. Texte complet recopié dans ch07, « Homogénéité des tableaux des Formats et convention des champs de valeur ».
- **Branche** : `feat/pre9-catalogues-cartes-badge-20261106` (PR #420, non fusionnée). **Commit de départ** : `a0c9342d`.
- **Consigne au lancement** (Hermann, 07/11) : « Prendre d’abord les principes édictés comme base, sur les alignements, les espaces, etc. » — Figma n'a servi qu'à mesurer la hauteur de référence désignée (« Nombre de séries » de l'EMOM, `11601:21711` : 24, marges 10 / 4, rayon 10, Inter Semi Bold 13). Figma en lecture seule.

### Constats avant correction

| Constat | Correction | Classe |
|---|---|---|
| Tableaux : colonnes de largeurs fixes différentes selon leur nature (objectif, pause, charge, Max…), dernière colonne calée au texte, valeurs sans cadre (sauf For time / EMOM / Superset, pastilles blanches) — deux rendus pour une même forme | Une seule mise en page par forme : colonnes de même largeur (le plus large champ mesuré du tableau, au moins 56), écart 8, calées à droite, dernier champ à 16 du bord ; nom du mouvement en place restante ; titres centrés | B |
| Champs de valeur : pastilles de 26 (lignes), cases de 36 sans cadre (tableaux), cadre orange avec liseré, charges sans cadre | `valueField.ts` : cadre blanc / orange / rouge, 24 de haut, aucun liseré, texte centré, bleu / noir / gris | B |
| Tableau des séries : sous-titre « (rép, +kg) » et charges sur des lignes de hauteurs différentes (w-series) | Seconde ligne de même hauteur des deux côtés, sous-titre centré sur les charges | A |
| Trait sous la dernière ligne d'un cadre de paramètres (« ex. après nombre de séries tout seul ») | `Panel` : le cadre rogne le trait de sa dernière ligne, quelle qu'elle soit | A (règle t-coche-q) |
| Décalage automatique des colonnes instantané | Animé, 450 ms (instantané si « Réduire les animations ») | B |
| Message rouge EMOM sous le cadre des paramètres qui suit le tableau | Juste sous le tableau des objectifs | B |

### Hors périmètre / à confirmer

- **Champs de valeur hors des Formats** (classe C) : feuille Paramètres d'exécution (pastille 32, rayon 8, fond gris, PRE-7 B.1), tableau des séries variables de la feuille, valeurs de la Composition. La remarque dit « quel que soit le champ » ; non modifiés sans confirmation de Hermann (baselines validées).
- **Autres KO du même lot non traités ici** : durée de Circuit au clavier (w-circuit-duree), arrêt du filtre (w-filtres), fondus lents (w-liste, w-fermer, constat d), dernière ligne Récupération sous la barre du clavier (constat A).
- **Test d'écran** du message EMOM sous le tableau : non écrit (produire un dépassement au récapitulatif exige un parcours clavier complet) ; la position est vérifiée à la lecture du code.

### Fichiers modifiés

- `src/shared/ui/valueField.ts` (nouveau) ; `src/features/sessions/FormatTables.tsx` (rendu des tableaux et des champs ; logique de saisie, ordre de Suivant et contrôles inchangés) ; `src/features/sessions/FormatModelScreen.tsx` (`Panel`, message EMOM).
- Tests : `formats.recette0611.test.tsx` (règles remplacées réécrites ; largeur commune ; décalage animé), `formats.recette0511.test.tsx` (props retirées, hauteur 24), `FormatModelScreen.c3.test.tsx` (trait de la dernière ligne masqué), `CompositionScreen.emom0711.test.tsx` (typage).
- Docs : ch07 (texte recopié, portée, classes, annotations des règles remplacées du 05/11 et du 06/11) ; Formats §9.5 (annotation).

### Tests

- `tsc --noEmit` : OK. ESLint sur les fichiers modifiés : aucune erreur nouvelle (`FormatModelScreen.c3.test.tsx` garde 1 erreur et 1 avertissement antérieurs, présents à `a0c9342d`).
- `npx jest src/features/sessions src/features/activities` : 159 suites, 2 610 tests, verts.
- Après correction des deux erreurs de lint (`FormatTables.tsx`) : suites Formats, `FormatModelScreen` et `CarrierDurationSheet` relancées, 102 / 102.
- iPhone : rien vérifié (rendu, mesure des largeurs, animation du décalage, hauteur 24 au texte agrandi).

## Recette iPhone du 07/11/2026 — premiers écarts (y-format-cadres, y-pile) et clavier de la Composition

- **Objectif** : corriger les premiers écarts notés par Hermann au cahier de recette le 07/11/2026 (y-format-cadres, y-pile), remplacer les roulettes du Compte à rebours initial et de la Fin de séance de la Composition par le clavier (demande en conversation), agrandir les zones de texte du cahier de recette sur mobile.
- **Branche** : `feat/pre9-catalogues-cartes-badge-20261106` (PR #420, non fusionnée). **Commit de départ** : `c8fe2857`.
- **Sources** : notes y-format-cadres et y-pile et demande du clavier recopiées mot pour mot dans ch07, section « Recette iPhone du 07/11/2026 — premiers écarts (y-format-cadres, y-pile) et clavier de la Composition ».

### Constats et corrections

| Écart | Constat | Correction | Classe |
|---|---|---|---|
| For time Buy-in / Buy-out | Lignes Séries et Pause après chaque série affichées | Masquées pour ces rôles (suivent le Rôle choisi dans la feuille) ; valeurs conservées | B |
| Récapitulatif For time | Case du buy-out au premier tour | Case au dernier tour, valeur toujours la seule du mouvement (même clé de clavier) | B |
| Death by, feuille | À l'ouverture, `setStopCondition(FAILURE)` remplaçait l'objectif de départ par « à l'échec » (06224da1) | À l'échec affiché imposé sans toucher l'objectif ; un objectif déjà converti reprend sa dernière valeur, sinon à renseigner | A (Formats §12) |
| Death by, Composition | Objectif « à l'échec » : synthèse « 1 série à l'échec », ni carte ni Circuit en rouge | Sans objectif de départ numérique : « Paramètres à compléter », Circuit en rouge | A |
| EMOM, séries variables | Colonne Pause dans le tableau de la feuille | Colonne retirée, Cible et Charge réparties, Suivant/Précédent sans Pause | B |
| Tableau AMRAP (récapitulatif) | Largeur commune à toutes les colonnes (Max compris) : le nom du mouvement n'avait plus de place | Largeur propre à chaque colonne (plus large champ, au moins 56) ; Max à 32, calé à droite ; même règle pour Death by, Tabata, 30/30, Renforcement, À l'échec | B |
| AMRAP membre (Tour, Buy-in) | Séries, Pause, Durée de l'exercice affichées | Masquées ; Buy-in : Récupération grisée « 0 s », appliquée à 0 s | B |
| Ordre des options (point 2) | Ordre fixe dans le code, conforme à la liste de Hermann ; aucune inversion trouvée | Rien modifié ; capture demandée | C |
| Point 4 (Phases, Charge) | Règles PRE-7 A2.1 / D-438 (structure verrouillée) et PRE-5 story 2.7 (AD-28) | Réponses consignées dans ch07, sans correction | — |
| y-pile | L'arrêt de 0,4 s s'appliquait aussi à l'entrée dans une pile ouverte (C2) | Entrée dans une pile ouverte immédiate ; arrêt conservé pour former une famille (C1) | B (interprétation à confirmer) |
| Composition, bornes | Compte à rebours initial et Fin de séance en roulette (`NumberWheelPicker` dans `WheelPickerOverlay`) | Saisie au clavier (`CarrierDurationSheet`, bornes 0..60 s, case vidée = valeur gardée) | B (« la pause » comprise comme Fin de séance, à confirmer) |

### Fichiers modifiés

- `src/features/activities/ExecutionParametersSheet.tsx`, `useSheetKeyboard.ts`, `MovementCatalogueList.tsx` (agent délégué, relu).
- `src/features/sessions/FormatTables.tsx`, `compositionPresentation.ts`, `CompositionScreen.tsx`, `CarrierDurationSheet.tsx`.
- Tests : `ExecutionParametersSheet.format0711.test.tsx` (+5), `MovementCatalogueList.r0611.test.tsx` (+2), `formats.recette0611.test.tsx` et `FormatModelScreen.c3.test.tsx` (règles remplacées), `CompositionScreen.test.tsx` (tests des roulettes réécrits pour le clavier ou retirés : 4 tests T01-S09 point D retirés, 10 tests D-06 / R4-09 / REWORK08-B remplacés par 4 tests clavier).
- Docs : ch07 (section du 07/11 au soir ; annotations de la section « Homogénéité des tableaux », de la règle t-glisser et de D-443).
- Cahier de recette (artefact) : zones de texte agrandies sur mobile, points de cette livraison ajoutés.

### Tests

- `tsc --noEmit` : OK.
- `npx jest src/features/sessions src/features/activities` (avant réécriture des tests des roulettes) : 159 suites, 2 598 tests verts, 19 échecs — 18 tests des roulettes remplacées (réécrits ensuite) et `CompositionScreen.recette1` « ancien modèle : carte à compléter → feuille de paramètres » ; ce dernier échoue aussi au commit de départ `c8fe2857` (vérifié par `git stash`), non lié à ce lot, non corrigé.
- Après réécriture : `CompositionScreen.test` + `CarrierDurationSheet` 435/435 ; `ExecutionParametersSheet.format0711` 17/17 ; Formats et `FormatModelScreen.c3` 54/54 ; Catalogue des mouvements 61/61 (agent).
- Lint : aucune erreur nouvelle dans les fichiers modifiés (erreurs `react-hooks/refs` de `CompositionScreen.tsx` et `FormatModelScreen.c3.test.tsx` antérieures).

### Non traité / à vérifier sur iPhone

- Tout : rien n'a été vérifié sur l'appareil.
- Ordre des options (point 2) : non reproduit, capture demandée.
- Interprétations confirmées par Hermann le 07/11/2026 : y-pile (carte venue d'ailleurs, « Oui ») ; « la pause » = Fin de séance (« C’est bien la fin de séance »). Ordre des options : Hermann va essayer de reproduire.
- Si un brouillon AMRAP membre ou For time Buy-in/out a des séries variables, le tableau reste affiché (ligne Séries seule masquée).
- `CompositionScreen.recette1` en échec depuis `c8fe2857` ou avant : à analyser.

## Recette iPhone du 07/11/2026 au soir — remarques restantes et « Autres constats » (08/11/2026)

- **Objectif** : demande de Hermann du 08/11/2026 : « Corriger ce qu'il te reste dans les remarques et dans la cellule autres remarques à la fin ».
- **Branche** : `feat/pre9-catalogues-cartes-badge-20261106` (PR #420, non fusionnée). **Commit de départ** : `c9f5695b`.
- **Sources** : base partagée du cahier de recette, lue le 08/11/2026 (collection `results`, 218 documents) : « Autres constats » (A à H), fiches KO (a-amrap-table, a-bornes-clavier, a-emom-table, f4-role, t-depli, w-circuit-duree, w-liste) et notes (y-rouge, d-couleurs, d-carte-choix, y-emom-cible). Toutes sont recopiées mot pour mot dans ch07, section « Recette iPhone du 07/11/2026 au soir — remarques restantes et « Autres constats » ».
- **Périmètre traité** : tout ce qui précède. Les points A, B, D, E et H, la note w-liste et les couleurs ont été délégués à un agent puis relus. Son rapport détaillé est `.github/orchestration/reports/2026-11-08_PRE9-RECETTE-0711-CATALOGUE-FORMAT.md`.
- **Notes anciennes déjà traitées et non reprises** : r-colonnes et z-unite (notes du 06/11 sur des fiches repassées OK) ; d-new-dup (06/11, OK).

### Constats et corrections

| Point | Constat (cause) | Correction | Classe |
|---|---|---|---|
| A | La carte du dessus d'une pile repliée sélectionnait le mouvement | Elle déplie la pile ; une carte d'une pile dépliée se sélectionne | B |
| B | Niveau en bleu, centré | Niveau en noir, sur la ligne de base du nom (catalogue d'un Format) | B |
| C | `automaticallyAdjustKeyboardInsets` ne compte pas la barre du clavier : la dernière ligne ne peut pas remonter au-dessus | Réserve de 64 sous le contenu pendant la saisie | A (FR-24) |
| D, w-liste | Apparition brute ; pastilles des zones corporelles en SVG chargées de façon asynchrone par `expo-image` | Fondu commun de 450 ms, icônes préchargées à l'ouverture du Format, glissement des cartes au filet | B |
| E | Fermeture immédiate | Fondu de 450 ms puis retour des paramètres en fondu | B |
| F | Liseré orange du Circuit replié à vérifier | Bord transparent ; reste à décider pour la carte d'Exercice à vérifier | B, et C pour la carte |
| G | `Switch` aux couleurs système, différentes selon le fond | `switchOffColors` (`#C2C7CF`) sur tous les `Switch` (Profil, Formats) | B |
| H | Bords droits déjà alignés ; retrait gauche différent | Cartes sans famille au retrait de 8 des piles | B (interprétation à confirmer) |
| a-bornes-clavier, w-circuit-duree | Carte flottante en `Modal` en haut de l'écran | Saisie en place (`InlineDurationField`), remontée de la Composition sous la barre du clavier, « Sans limite » dans la barre (`option` de `KeyboardAccessoryBar`), Sans limite bleu gras | B |
| a-amrap-table | Écart de 8 et minimum de 56 par colonne | Écart de 4, titre mesuré, minimum de 32, Max à 26 calé à droite | B |
| a-emom-table | Cible juste après l'amorce, Charge seule centrée | Trois espaces égaux sans Pause (`leadGap` facultatif de `DraggableRow`) | B |
| t-depli | `EnvelopeFrame` : un fragment hors mode, deux vues en mode, donc remontage des Circuits sans animation | Mêmes deux vues toujours rendues | A |
| f4-role | Aperçu du glisser à règle positionnelle, alors que le déplacement appliqué lit les Rôles | `layoutDropCandidates(…, roleOf)` | A (MAJ 04/11 §6 bis 2) |
| y-rouge | Message générique de la feuille ; absence du message non reproduite en test | Message de la Composition reformulé selon Hermann | B |
| d-couleurs | Jetons D-501 | Nouveaux jetons ; modale de la Composition aux couleurs du catalogue des mouvements | B |
| d-carte-choix, y-emom-cible | Explications demandées | Données dans le cahier de recette (section « Livraison du 8 novembre ») | — |

### Fichiers modifiés

- **Code** :
  - `src/shared/ui/tokens.ts`
  - `src/features/preferences/ProfileScreen.tsx`
  - `src/features/sessions/FormatModelScreen.tsx`, `FormatTables.tsx`, `CompositionScreen.tsx`, `CompositionSequence.tsx`, `CircuitHeader.tsx`, `CarrierDurationSheet.tsx` (réécrit : saisie en place), `layoutDrop.ts`
  - `src/features/activities/ExecutionParametersSheet.tsx`, `sheetTable.tsx`, `KeyboardAccessoryBar.tsx`
  - fichiers de l'agent : `SelectedMovementCard.tsx`, `MovementSelectionScreen.tsx`, `src/shared/ui/PrimaryActionZone.tsx`, `src/shared/ui/KodjoIcon.tsx`
  - `src/shared/i18n/resources/fr.ts`
- **Tests** :
  - réécrit : `CarrierDurationSheet.keyboard0611.test.tsx`
  - nouveaux : `layoutDrop.f4role.test.ts`, `FormatModelScreen.r0711.test.tsx` (agent)
  - adaptés :
    - `CompositionScreen.test.tsx` (bornes en place) ;
    - `formats.recette0611.test.tsx` (Max à 26, plus un test de largeur de titre) ;
    - `FormatModelScreen.c3.test.tsx`, `CatalogueScreen.test.tsx`, `MovementSelectionScreen.cat1.test.tsx` (agent).
- **Docs** :
  - ch07 : nouvelle section ; annotation de D-501 ; annotation de la section « Homogénéité des tableaux ».
  - ch12 : jetons des catalogues.
  - `docs/KODJO-Catalogues-cartes-modales-2026-11-06.md` : table des couleurs.
  - `docs/KODJO-Formats-entrainement-2026-11-02.md` : tableaux.
- **Cahier de recette** (artefact, version 29) : section « Livraison du 8 novembre » (17 points), avec les deux explications.

### Tests

- `npx tsc --noEmit` : OK.
- `npx jest src/features/sessions src/features/activities src/features/preferences src/domain/sessions` : 203 suites, 3 513 tests, 2 échecs.
  - `CompositionScreen.recette3circuits` point 3 : attendait le liseré orange retiré par F. Test adapté et vert.
  - `CompositionScreen.recette1`, « disposition générale (deux Circuits) : même comportement » : la feuille ne se rouvre pas sur la seconde carte. L’échec persiste avec `CompositionScreen.tsx`, `CompositionSequence.tsx`, `CircuitHeader.tsx` et `CarrierDurationSheet.tsx` remis à HEAD (`git stash` ciblé). Il ne vient donc pas de ces fichiers ; l’échec de cette suite est connu depuis `c8fe2857`. Non corrigé.
- Après corrections : Composition (`CompositionScreen.test`, `recette3circuits`), Formats (`FormatModelScreen*`) et saisie en place : 494/494. `formats.recette0611` 8/8. `layoutDrop*` 19/19.
- Lint des fichiers modifiés : deux erreurs nouvelles corrigées.
  - `react-hooks/refs` sur la minuterie des piles de `FormatModelScreen.tsx` : minuterie tenue par un effet.
  - `set-state-in-effect` dans `useDurationKeyboardFrame`.
  - Restent les erreurs `react-hooks/refs` de `CompositionScreen.tsx`, antérieures à ce lot.

### Hypothèses non démontrées et points ouverts

- Rien n'a été vérifié sur l'iPhone. Points à contrôler :
  - remontée de la Composition au-dessus de la barre du clavier ;
  - fondus et glissements du catalogue ;
  - préchargement des pastilles (hypothèse de cause) ;
  - repli lent à l'entrée du mode Cycle ;
  - glisser d'un buy-in devant l'autre (poignée de glisser disponible sur la carte).
- **y-rouge** : le message existait déjà sous Enregistrer d'après les tests. La cause de son absence sur l'iPhone n'est pas démontrée ; une capture est demandée.
- **À CLARIFIER** : liseré orange de la carte d'Exercice à vérifier ; sens de « aligner à droite » (H).
- `CompositionScreen.recette1` : échec antérieur à `c8fe2857`, toujours non analysé.
- Variables Figma des catalogues non modifiées (consigne) : écart Figma connu.

# CAT.1 — Zones de contexte des Catalogues Mouvements et Séances

Story PRE-9, epic CAT. Autorisation : décision fonctionnelle de Hermann du 30/10/2026 (« KODJO — PRE-9 / CAT.1 — Développement immédiat »). Sources normatives, lues sans fusion sur la branche documentaire `docs/pre9-zones-contexte-catalogues-20261030` au commit `2b7ba4fa` : `docs/KODJO-Zones-contexte-catalogues-PRE9-2026-10-30.md` (spécification complète), `_bmad-output/pre9/planning-artifacts/epics.md` § CAT.1, chapitre 13 contrat **CE-CAT-CTX-01**, registre (chapitre 07) « Décision du 30/10/2026 — Zone de contexte commune des Catalogues — PRE-9 ». Figma `G6RY5Ebhgwb4AHIOYDwwvg` (lecture seule) : Mouvements `10266:20575`, `10465:23141`, `10495:24099` ; Séances `1992:9910`, `4549:6742`, `1992:10848`.

Branche de développement `pre9-bmad/dev`, départ `bc867a99`.

## Réalisé

1. **Titre de page masqué** dans les deux Catalogues : `FixedHeader` reçoit un contenu (`content`) qui remplace le titre ; la navigation Mouvements / Séances / Programmes (`SegmentedControl`, inchangé) y est placée. La bande de contexte ne porte plus la navigation.
2. **Bande lilas de 115 pt** (`ContextBand fadeToTransparent`, fondu et défilement de la liste derrière le fondu conservés — contre-recette n° 2) avec marges verticales propres (`padding` : 26 en haut, 8 en bas) :
   - ligne 1 (hauteur 17, retrait 8 + marge 16 = `x = 24`, bord droit `x = 378`) : compteurs du Catalogue à gauche ; « N résultats » à droite en état filtré ou archivé ;
   - ligne 2 (hauteur 44, à 63 sous le haut de la bande) : champ Rechercher puis Filtre, Tri, Créer (cercles 34, cibles 44 × 44 par `hitSlop`, écart 12, Créer sur la marge droite → `x = 260 / 306 / 352` à 402 pt).
   Composant commun `src/shared/ui/CatalogueContextZone.tsx`.
3. **Champ Rechercher** (`CatalogueSearchField`, prop `width`) : 216 × 44 par défaut, 107 × 44 en état filtré ou archivé, réductible sur un écran plus étroit ; rayon 12 ; fond `#F3F4F9` fondu vers la transparence (Figma `10457:23120`) ; placeholder « Rechercher » Inter Regular 15, `#7A7A80`. Le champ de la sélection des Mouvements (A.2) est inchangé (sans `width`).
4. **Filtre actif** : forme étendue existante (Figma `10465:23141`, `4549:6742` : la pilule s'étend vers la gauche jusqu'à 12 du Tri) ; elle peut désormais se réduire (résumé tronqué) au lieu de chevaucher le champ. Séances : bascule résumé / « N filtre(s) » (`commandRowLayout`) recalculée avec le champ réduit (107) à la place de l'ancienne bascule. Tri : inchangé (désactivé).
5. **Mouvements — « N familles · N mouvements »** (`MovementCounterToggles.tsx`, module pur `movementCatalogueCounters.ts`) : deux `Pressable` distincts, rôle bouton, état `selected` annoncé, indications d'accessibilité ; actif `#0508E5` Inter Semi Bold 14, inactif `#333333` Regular 14 ; séparateur « · » non interactif. Un seul actif au maximum ; toucher l'actif le désactive. Le compteur actif se cumule à la recherche et au panneau Filtre (aucune réinitialisation croisée).
   - Familles = familles (groupe de niveaux, même règle que `groupFamilies`) ayant au moins une carte affichée ; une famille réduite à une carte simple par un filtre compte.
   - Mouvements = cartes affichées : pile repliée = 1 (sa carte du dessus), pile déployée = ses membres affichés.
   - La liste (`MovementCatalogueList`, props `counter` et `onSummaryChange`) applique le compteur, puis calcule les compteurs sur les éléments réellement rendus et l'état déplié ; l'écran n'affiche que ces valeurs (aucune autre collection).
6. **Séances — « Un exercice N | Plusieurs N »** (`SessionViewToggle`, prop `counts`) : seuls les libellés sont des commandes (bascule E.4 inchangée : exclusifs, re-toucher désélectionne) ; chaque `N` est un `Text` hors du `Pressable`, 14 Regular `#333333` ; libellés inactifs `#595E66` Regular, actif `#0508E5` Semi Bold ; séparateur « | » `#9499A8`, à 10 du nombre et du libellé (Figma : `x = 127`). Écart libellé → nombre 6 (Figma `1992:9910`).
7. **Recherche des Séances** (nouvelle, exigée par §2) : nom de la Séance, normalisation R02 existante (`normalizeSearchText` : casse et diacritiques ignorés), sous-chaîne ; message « Aucune séance ne correspond à la recherche. » quand la recherche est saisie et la liste vide. Module pur `sessionCatalogueContext.ts` : une seule dérivation fournit la liste, les deux `N` et « N résultats ».
8. **« N résultats »** : 14 Regular `#333333`, accord « 0 résultat », « 1 résultat », « 2 résultats » (`countLabel`). Mouvements : cartes affichées (= compteur mouvements) ; Séances : Séances affichées après filtres, recherche et vue. Recalcul à chaque changement de liste.

## Géométrie et décisions d'implantation

- Les coordonnées de §2 sont reproduites **relativement à la bande** : ligne 1 à +26, ligne 2 à +63, 8 sous la ligne 2. Sur iPhone, le haut de la bande suit l'en-tête réel (zone de sécurité + 48), comme le reste de l'application (doc12 §12.26 : « les insets système réels remplacent les réserves de Safe Area ») : à 402 × 874 le `y` absolu diffère donc du `y = 92` de la maquette d'autant que la zone de sécurité réelle diffère de la réserve Figma.
- Largeurs autres que 402 : marges 16, commandes alignées à droite, champ réductible et pilule réductible ; écart minimal 12 entre le champ et Filtre (cibles sans recouvrement).
- Cibles des compteurs Mouvements et des libellés Séances : 48 de haut par `hitSlop` vertical (ligne 1 de 17 à +26 → cibles de +10,5 à +58,5, sans atteindre la ligne 2 à +63) ; débord horizontal de 4 seulement pour les compteurs Mouvements (aucun recouvrement entre eux).
- Nouveaux jetons : `colors.catalogueContextText` `#333333`, `colors.catalogueContextSeparator` `#9499A8`, `type.contextLineSelected` (Semi Bold 14/17). Textes : `strings.screens.catalogueContext`, `strings.screens.sessions.search`, `strings.screens.sessions.noResult`.

## À CLARIFIER (classe C — choix provisoires en place, à arbitrer par Hermann)

1. **Sémantique de filtrage des compteurs Mouvements.** La spécification dit que l'activation « participe au filtrage » sans dire ce que chaque compteur retient. Lecture littérale retenue : le compteur actif restreint la liste à ce qu'il compte — « familles » : seules les cartes appartenant à une famille ; « mouvements » : toutes les cartes affichées, donc **aucune restriction visible** (seul l'état actif change). Alternative possible : « mouvements » = Mouvements sans famille. Changement localisé dans `applyMovementCounter`.
2. **« Filtré ou archivé »** = au moins un critère du panneau Filtre (Statut Archivés compris). La recherche seule, le compteur Mouvements actif et la vue Séances ne déclenchent ni « N résultats » ni le champ réduit.
3. **Accord des compteurs Mouvements** : « 0 famille », « 1 famille », « 2 familles » (idem « mouvement »), par analogie avec la règle des résultats et Figma `10465:23141` (« 1 famille »). La spécification n'écrit que la forme plurielle.
4. **Archives Mouvements** : Figma `10495:24099` n'affiche que « 2 mouvements » ; la spécification (« N familles · N mouvements », corrects « pour les archives ») est appliquée : les deux compteurs restent affichés.
5. **`N` des vues Séances** calculés après recherche et filtres du panneau, avant le choix de vue (sinon la vue non choisie vaudrait toujours 0) ; ils changent donc avec la recherche et les filtres. Figma `4549:6742` (« 2 | 3 » avec « 3 résultats ») n'est qu'un exemple.
6. **« N résultats » des Mouvements** = cartes affichées (une pile déployée compte chacun de ses membres affichés ; repliée, 1).
7. **Recherche des Séances** : sur le nom seul, sous-chaîne normalisée (aucune règle de recherche des Séances n'est écrite). Texte « Aucune séance ne correspond à la recherche. » ajouté par analogie avec les Mouvements.
8. **Navigation des Catalogues** : le `SegmentedControl` existant est conservé tel quel dans l'en-tête ; la présentation textuelle « Mouvements | Séances | Programmes » de Figma n'est pas reprise (hors périmètre CAT.1, « conserver la navigation »).

## Synchronisation code / documentation

- **Classe A** (conformité) : spécification du 30/10/2026, CE-CAT-CTX-01, registre du 30/10/2026, epics CAT.1 — sources présentes sur la branche documentaire non fusionnée (`2b7ba4fa`) ; aucune correction documentaire à préparer : la documentation décrit déjà la cible. Ordre « rechercher, filtrer, trier puis créer » (Hermann, 30/10) conservé.
- **Classe C** : points 1 à 8 ci-dessus.
- **Classe D** : `CatalogueContextZone`, props `content` (`FixedHeader`) et `padding` (`ContextBand`), remontée des compteurs par `onSummaryChange`.

## Fichiers

- Nouveaux : `src/shared/ui/CatalogueContextZone.tsx`, `src/shared/ui/catalogueContext.ts`, `src/features/activities/movementCatalogueCounters.ts`, `src/features/activities/MovementCounterToggles.tsx`, `src/features/sessions/sessionCatalogueContext.ts`.
- Modifiés : `src/features/sessions/CatalogueScreen.tsx`, `SessionCommandRow.tsx`, `SessionViewToggle.tsx`, `src/features/activities/MovementCatalogueList.tsx`, `src/shared/ui/CatalogueCommands.tsx`, `ScreenShell.tsx`, `tokens.ts`, `src/shared/i18n/resources/fr.ts`.

## Tests

- Nouveaux : `movementCatalogueCounters.cat1.test.ts` (bascule exclusive, piles repliées/déployées, famille en carte simple, archives, liste vide, filtrage par compteur, cumul recherche + filtre + compteur) ; `sessionCatalogueContext.cat1.test.ts` (recherche, nombres réels, archives, recherche × vue, état filtré, accords 0/1/2) ; `CatalogueScreen.cat1.test.tsx` (géométrie de la bande et des deux lignes, champ 216/107, placeholder, cibles 44, titre masqué ; Séances : nombres informatifs hors cible, couleurs, bascule et désélection, recherche, « N résultats » 2/1/0 en archives, réinitialisation ; Mouvements sur SQLite réel : compteurs repliés/déployés, exclusion/désélection/annonce, couleurs et graisses, cumul recherche + compteur, « N résultats » avec filtre, compteur, dépliage et recherche).
- Mis à jour : `CatalogueScreen.test.tsx` (titre masqué, navigation dans l'en-tête, deuxième ligne, ordre), `CatalogueScreen.e4.test.tsx` (zone de contexte, champ réduit, bascule résumé / nombre de filtres avec le champ de 107).
- Aucune vérification sur iPhone.

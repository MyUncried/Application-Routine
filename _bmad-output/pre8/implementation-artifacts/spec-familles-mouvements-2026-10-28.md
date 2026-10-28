# PRE-8 — Lot ciblé « Familles de niveaux par geste » du Catalogue des Mouvements (28/10/2026)

> Lot ciblé au sein de PRE-8, rattaché au Catalogue des Mouvements de l'epic B (clos, non rouvert). Demande de Hermann du 28/10/2026 : « Intégration immédiate des nouvelles règles de familles dans le Catalogue des Mouvements ». Statut BMAD : `fam-familles-de-niveaux-geste: done` — clôturé le 28/10/2026 sur décision de Hermann (« Clôture du lot Familles de niveaux et gestes »), après recette iPhone FAM-01 à FAM-11 et passes ciblées 2 à 4 (§ 9 à 12) ; conditions de clôture : § 13.

## 1. Décision documentaire source

- `main` @ `0a40735f` (« docs: actualiser ordre et composition des familles de mouvements »), lu sans fusion :
  - `docs/KODJO-Regles-Familles-de-niveaux-2026-10-28.md` — règles A à E (Hermann) ;
  - `docs/DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md` — spécification intégrée, réserves de transcription, FAM-01 à FAM-11 ;
  - ch09 (« Composition des familles — données, 28/10/2026 » ; « Réordonnancement… — 27/10/2026 », règles 6 à 8), ch10 (règles 1 à 5, 9), ch11, ch12, ch13 CE-MVT-03, ch07 (D-439, D-445/C08, D-448 point 9) ; la DSF porte la section « Données et invariants ».
- Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101` : `10480:23374` (Déplacement), `10797:20492` (Création d'une famille), `10484:23428` (Message de confirmation) — captures PNG de `main` relues.

## 2. Périmètre

Catalogue des Mouvements et ses dépendances nécessaires : repository et service des Mouvements, écran `MovementCatalogueList`, message temporaire partagé (durée paramétrable). Aucune migration (colonnes `level_group_id` / `level_sort_key REAL` de la migration 012 suffisent). Hors périmètre : Trier (reste grisé), epic C, suppression définitive, nouveaux parcours, Catalogue des Séances (non modifié).

## 3. Écarts constatés dans le code (avant le lot)

| Écart | Avant | Règle |
|---|---|---|
| Portée du geste | Glisser limité à une pile **dépliée**, ordre interne seulement | A à C : toute carte active ; pile repliée dépliée (A3, C5) |
| Écritures | Chaque écriture de famille renumérote **toutes** les clés 0..n-1 | « Effets sur les données » : seule la ligne concernée (clé fractionnaire) |
| Sortie | `detachFromGroup` renumérote les restants et garde un singleton | B, D2 : sortie sans réécriture ; dernier couple dissous |
| Création / entrée par geste | Inexistantes (seulement « Ajouter un niveau ») | C1 à C7 |
| Messages | Aucun message de famille ; Annuler seulement pour l'archivage ; durée 5 s | E : messages d'appartenance, 3 s, Annuler |
| Classement du Catalogue | Par nom normalisé (`search("")`), Trier grisé | B5 : le Mouvement libéré reprend sa place selon ce classement (aucune position manuelle) |

## 4. Implémentation minimale

- **Repository** (`MovementRepository`, `SqliteMovementRepository`), une transaction exclusive par opération :
  - `placeInFamily(movementId, anchorId, side)` : réordonnancement (même famille), entrée (Mouvement libre sur un membre), création (deux libres : identifiant neuf, **deux lignes**, réserve de transcription « création à partir de deux isolés ») ; clé fractionnaire `keyBetween` entre les voisines dans l'ordre complet (archivés compris) ; renumérotation de la famille seulement si la précision est épuisée ; `ALREADY_IN_GROUP` pour un membre d'une autre famille (C6) ;
  - `leaveFamily(movementId)` : au plus deux membres dans les données (archivés compris) → `DISSOLVED`, les deux appartenances effacées ; sinon `LEFT`, seule la ligne sortie ;
  - `restoreFamilyMemberships(previous)` : Annuler, rétablit groupe et clé de chaque ligne écrite ;
  - un Mouvement seul dans son groupe **dans les données** est traité comme libre ; un singleton subi (son autre membre archivé) reste membre : porté, il ne se pose sur aucune carte (C6) ; visé par un Mouvement libre, celui-ci entre dans son groupe (C2, D4 : présentation identique, suite différente).
- **Service** (`MovementCatalogueService`) : `placeInFamily`, `leaveFamily`, `restoreFamilyMemberships`.
- **Décision du geste** (`movementFamilyDrag.ts`, pur) : `dragIntent` (REORDER / LEAVE / PLACE / EXPAND / NONE), `previewLevels` (rangs provisoires sur les seuls actifs, comme b8-3), `placedOrder`, `reorderAnchor`.
- **Écran** (`MovementCatalogueList`) : un seul suivi du doigt pour toute la liste ; appui long sur toute carte active (pile repliée : dépliée puis carte du dessus portée) ; places mesurées des entrées et des membres ; prévisualisation : réordonnancement (voisines décalées, niveaux en direct), sortie (cartes refermées, filet raccourci, pastille retirée), création (filet de formation, niveaux provisoires), entrée (niveaux provisoires) ; relâchement : application immédiate ; message de 3 s avec Annuler pour création, entrée, sortie, dissolution ; aucun message pour un réordonnancement ; geste interrompu par le système (`touchCancel`) : abandon sans écriture ; échec : message d'action existant, aucun libellé inventé.
- **Message temporaire** (`TransientNotification`) : propriété `durationMs` facultative (défaut inchangé, 5 s ; 3 s pour les familles). Partagé avec le Catalogue des Séances et la feuille d'Exécution : comportement par défaut inchangé.
- **Libellés** (`fr.ts`, `movement.catalogue.family`) : textes E2 exacts ; libellé d'entrée **provisoire**, voir § 6. [Validé par Hermann le 28/10 : « Mouvement ajouté à la famille » (§ 13).]

## 5. Critères d'acceptation et preuves

| Cas | Couverture automatique |
|---|---|
| FAM-01 réordonner, aucun message, niveaux en direct | `MovementCatalogueList.fam` (A, E3) ; `movementFamilies.fam` (une ligne écrite) ; `MovementCatalogueList.b5` B08 (inchangé, vert) |
| FAM-02 sortir puis revenir | `MovementCatalogueList.fam` (B2, B4, B3) ; `movementFamilyDrag.fam` |
| FAM-03 sortie en tête | Couverture **partielle** : `movementFamilyDrag.fam` (sortie par le haut de l'emprise) ; `MovementCatalogueList.fam` (sortie au-dessus, famille non en tête) ; replacement par nom (classement existant) ; cas « famille en tête » à vérifier sur iPhone |
| FAM-04 création dans les deux sens | `MovementCatalogueList.fam` (C1, C3, C4) ; `movementFamilies.fam` |
| FAM-05 entrée dans une famille, pile repliée | `MovementCatalogueList.fam` (A3, C5) ; `movementFamilies.fam` (C2, C7) |
| FAM-06 pas de transfert direct | `MovementCatalogueList.fam` (C6) ; `movementFamilies.fam` (`ALREADY_IN_GROUP`, rien écrit) |
| FAM-07 dernier couple | `MovementCatalogueList.fam` (D2 + Annuler) ; `movementFamilies.fam` |
| FAM-08 messages, 3 s, Annuler | `MovementCatalogueList.fam` ; `TransientNotification` (3 s) ; `movementFamilies.fam` (Annuler à deux lignes) |
| FAM-09 archivage, filtres | `movementLifecycle.b8` (b8-3) inchangé et vert ; `movementFamilies.fam` (archivé compté, pas de dissolution) |
| FAM-10 invariants | `movementFamilies.fam` (identité, contenu, refus sans écriture) |
| FAM-11 accès existants | `movementFamilies.fam` (`reorder` au menu, `insertAfter`), `MovementLevelsScreen.a32`, B11/B12 inchangés |

Résultats : voir le bilan de livraison (suite complète, TypeScript, ESLint) et la recette iPhone (`recette-iphone-familles-2026-10-28.md`).

## 6. Points À CLARIFIER

1. ~~**Libellé de l'entrée dans une famille existante**~~ — **tranché le 28/10** : « Mouvement ajouté à la famille », avec Annuler et 3 s. Hermann : « libellé : je valide ce texte ».
2. ~~**Alternative accessible**~~ — **REPORTÉ** (28/10) dans un lot d'accessibilité dédié en fin de MVP : créer, rejoindre et quitter une famille restent sans alternative VoiceOver dans ce lot ; non bloquant pour sa clôture ; l'exigence n'est pas supprimée. Réordonner reste possible par les actions VoiceOver existantes (« Placer … un niveau plus haut / plus bas »). Sortir, créer, rejoindre n'ont pas d'alternative accessible dans ce lot.
3. ~~**Dernier couple accompagné d'un archivé**~~ — **vérifié le 28/10** (clôture, § 13, cas C1) : la dissolution compte les membres des données, archivés compris (D3 : l'archivé reste membre). Une famille de deux actifs et d'un archivé n'est donc pas dissoute par la sortie d'un actif : le restant s'affiche seul (singleton subi) et le message est « Mouvement sorti de la famille ».
4. **Singleton subi** — **vérifié le 28/10** (clôture, § 13, cas C2). **Famille masquée par un filtre** — lecture non tranchée par une décision, **non bloquante**, à confirmer par Hermann : une carte isolée qui appartient encore à un groupe (autre membre archivé, ou membres masqués par un filtre) ne peut pas être portée vers une autre carte (rien ne se passe) ; visée par un Mouvement libre, elle le fait entrer dans son groupe (message d'entrée).
5. ~~**Renumérotation de secours**~~ — **autorisée le 28/10** comme rééquilibrage technique exceptionnel (clôture, § 13, point D) : si la précision des clés fractionnaires est épuisée entre deux voisines (après au moins une cinquantaine de poses au même endroit), toute la famille est renumérotée dans la même transaction ; exception désormais écrite dans la documentation (patch de clôture).

## 6 bis. Limites connues (non conformes au texte, déclarées)

- ~~**Ouverture de place**~~ : levée par la recette du 28/10 (§ 9).
- **B2** : à la sortie, ce sont les cartes **sous** la carte portée qui remontent et le filet raccourcit par le bas ; rendu équivalent à « les cartes au-dessus se referment », à confirmer.
- ~~**Défilement**~~ : levée par la recette du 28/10 (§ 9).
- **Emplacement pointillé** (Figma `10480:23374`, CE-MVT-03 §7) — **écart visuel accepté provisoirement** par Hermann le 28/10 (rendu non déclaré conforme sur ce point ; référence Figma conservée) : non rendu ; la carte portée garde son ombre et les voisines se décalent (rendu du glisser B08 recetté le 27/10).

## 7. Contradictions documentaires à ne pas propager (préparées pour l'intégration de `main`)

- **b8-3** (recette A/B du 27/10, validée) : après archivage ou restauration, les rangs **affichés** des Mouvements actifs sont recalculés ; identité, appartenance et clé conservées ; le filtre ne renumérote pas. Le code applique b8-3 (inchangé par ce lot). Passages de `main` @ `0a40735f` qui le contredisent :
  - `docs/KODJO-Regles-Familles-de-niveaux-2026-10-28.md` l. 139 : « archiver, restaurer ou supprimer un membre ne modifie pas le rang des autres » ;
  - `docs/DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md` l. 133 (« archiver/restaurer ne change pas les niveaux ; les membres archivés participent au calcul ») et l. 170 (FAM-09 « Archivage/restauration … sans reclassement ») ;
  - ch09 l. 1528, règle 8 (« clarification validée par Hermann le 27/10/2026 ») : « ces opérations ne modifient pas les niveaux » ; ch09 l. 1530 : « Le calcul porte sur la famille complète, membres archivés compris, avant filtrage » ;
  - ch10 l. 29 : « le membre archivé reste pris en compte dans le calcul des niveaux de la famille complète. Ces opérations ne changent pas les niveaux ; seule la visibilité change » ;
  - renvois à la règle 8 à marquer avec elle : ch09 l. 9 (« La règle 8 du 27/10 reste applicable à l'archivage, aux filtres… »), ch07 l. 1042 (« précise la prise en compte des membres archivés »), ch13 l. 71 (« suppression définitive selon la règle 8 du 27/10 ») ;
  - formulations à préciser (rang dérivé de l'ordre des membres **actifs**) : DSF l. 118 et ch13 l. 23 (« dérivé(s) de l'ordre complet, avant filtrage ») ;
  - la phrase de la règle source (l. 139) « supprimer un membre ne modifie pas le rang des autres » contredit en outre la règle 8 elle-même sur la suppression définitive.
  Correction proposée : marquer ces passages « remplacé par b8-3 (recette A/B du 27/10) » — les rangs affichés sont dérivés des seuls membres actifs ; l'archivage conserve appartenance et clé. Le document source de Hermann est conservé à l'identique (citation), la DSF porte la précision.
- **B5** : la DSF confirme le contrôle de tri ; dans PRE-8, Trier est grisé et le classement implicite est **le nom normalisé** (`search("")`, `ORDER BY normalized_name, id`), déterministe. Le Mouvement libéré reprend sa place par nom ; aucune position manuelle n'est écrite. Une famille se place à la position alphabétique de son premier membre rencontré (archivés compris). Précision à ajouter à la DSF : « dans PRE-8, Trier n'étant pas actif, le classement implicite par nom tient lieu de tri ».
- **Règles du 27/10 remplacées** (réordonnancement règles 2 à 4, C08) : plus utilisées comme critères d'acceptation ; leur traçabilité reste dans l'annexe Historique de `main`.

## 8. Impact sur la recette en cours

- Recette E : aucun impact fonctionnel (Catalogue des Séances non modifié). Le message temporaire partagé garde 5 s par défaut.
- Recette A/B : non rejouée ; le complément `recette-iphone-familles-2026-10-28.md` cible FAM-01 à FAM-11 et la non-régression b8-3, filtres et « Ajouter un niveau ».

## 9. Recette iPhone du 28/10/2026 — résultats et corrections

Section FAM de la page de recette : 12 OK, 1 KO (`fam-05`). Hermann : « Les commentaires sur les tests OK sont des besoins à couvrir, a priori non spécifiés. »

| Point | Verdict | Remarque de Hermann | Traitement |
|---|---|---|---|
| `fam-05` entrer dans une pile repliée | **KO** | « La famille se déplie, mais la carte n'est plus sous le doigt mais en bas de la pile, relâcher le mouvement la positionne où se trouvait le doigt. » | **Défaut corrigé.** La pile dépliée au-dessus de la carte portée repoussait sa place ; le décalage de la carte n'en tenait pas compte. La carte garde maintenant sa position sous le doigt : le déplacement de sa place depuis le départ (`drift`) est relevé à chaque mise en page et à chaque mouvement, puis retranché. La décision du geste n'était pas en cause (elle suit déjà le doigt). |
| `fam-06` pas de transfert direct | OK, remarque | « Lorsqu'on porte un membre sans famille sur une famille déployée, les membres de la famille ne s'écartent pas pour laisser la place, ce devrait être le cas. » | **Couvert.** Le besoin est déjà spécifié (C2, ch10 règle 5, CE-MVT-03 §9 ; limite déclarée § 6 bis). Entrée : les membres à partir du rang d'arrivée, puis les entrées suivantes du Catalogue, descendent d'un pas ; le filet s'allonge d'un pas. Création : la carte visée descend d'un pas si l'on se pose au-dessus, les entrées suivantes aussi ; le filet de formation relie la place ouverte et la carte visée. Décalage visuel seulement : les places mesurées ne changent pas, la décision ne bascule donc pas d'un côté à l'autre. |
| `fam-07` dernier couple | OK, remarque | « Le mouvement sorti ne reste pas à la place où on l'a posé par rapport à l'autre mouvement, il se remet systématiquement à la place qu'il avait à l'origine dans le catalogue par rapport à l'autre mouvement. Si je le sors par en haut, je m'attends à ce qu'il reste en haut près de mon doigt, pas à ce qu'il se trouve à un tout autre emplacement, car alors je le cherche. » | **Non codé — besoin à spécifier (À CLARIFIER 6).** Contraire à B5 (« un Mouvement sans famille n'a pas de position manuelle ») et au classement par nom tenant lieu de Trier, grisé ; l'écrire demanderait une position manuelle des Mouvements, donc un tri et vraisemblablement un champ de données (migration exclue). |
| `fam-12` limites connues | OK, remarque | « Si je déplace une carte vers le haut ou le bas en dehors de l'écran, la liste doit se déplacer aussi. » | **Couvert.** Défilement automatique : doigt à moins de 72 pt du haut ou du bas de la liste, la liste défile de 8 pt par image (≈ 480 pt/s) jusqu'à son extrémité ; la carte portée reste sous le doigt et la décision du geste tient compte du défilement. Aucune contradiction : CE-MVT-03 §10 demande de « conserver le scroll du catalogue », ce qui reste vrai hors du geste. |
| Autres (`fam-01` à `fam-04`, `fam-08` à `fam-11`, `fam-13`) | OK | — | — |

À CLARIFIER 6 — **place d'un Mouvement sorti** : options possibles, aucune retenue sans décision :
1. garder le classement par nom (état actuel) ;
2. garder le classement par nom et, après la sortie, amener la liste sur le Mouvement sorti et le signaler brièvement (aucune donnée nouvelle) ;
3. position manuelle des Mouvements dans le Catalogue : nouvelle règle de tri, à spécifier avec Trier (hors de ce lot, migration probable).

Fichiers : `MovementCatalogueList.tsx` (correction `drift`, place ouverte, défilement automatique ; la liste est enveloppée d'une vue qui donne sa place à l'écran), `movementFamilyDrag.ts` (`autoScrollDirection`, pur). Tests : `MovementCatalogueList.fam` (+3 : carte sous le doigt après dépliage, place ouverte à l'entrée, place ouverte à la création), `movementFamilyDrag.fam` (+1 : bandes de défilement).

Limite restante : l'emplacement pointillé (Figma `10480:23374`) n'est toujours pas rendu.

## 10. Passe ciblée 2 (28/10/2026, après `f7540637`)

| Point | Verdict | Remarque de Hermann | Traitement |
|---|---|---|---|
| `f2-01` fam-05 carte sous le doigt | OK | — | — |
| `f2-02` fam-06 place ouverte à l'entrée | OK | — | — |
| `f2-03` place ouverte à la création | OK, remarque | Après dissolution, le Mouvement sorti « revient en bas » (ou en haut) : il reprend sa place par nom, loin du doigt. | Même besoin que fam-07 (À CLARIFIER 6). **Décision de Hermann : « On ne change rien et on laisse comme cela pour l'instant. »** Classement par nom conservé (B5). Une place durable demanderait un ordre manuel enregistré : nouvelle règle de tri et stockage (migration ou mécanisme hors base), hors de ce lot. |
| `f2-04` défilement pendant le geste | OK, remarque | « Le défilement est très saccadé, la carte bouge de haut en bas et de bas en haut à haute fréquence. » | **Défaut corrigé.** Les évènements `onScroll` produits par le défilement automatique arrivaient en retard et ramenaient le défilement de référence en arrière : ils sont ignorés pendant le geste. Un pas par image (`requestAnimationFrame`) ; le décalage de la carte portée est appliqué avant l'affichage (`useLayoutEffect`). |
| `f2-05` non-régression | OK | — | — |

Demande complémentaire de Hermann : « si je déplace une carte elle déplie toutes les familles au-dessus desquelles elle passe sans pourtant s'arrêter. Il faudrait qu'elle ne déplie une famille que si on s'arrête dessus. » **Traité** : C5 précisé, une famille repliée ne se déplie qu'après un arrêt de 500 ms de la carte portée sur elle ; la quitter avant annule le dépliage. La durée est une valeur technique, non spécifiée, ajustable après la recette. Test : `MovementCatalogueList.fam` (« survolée sans s'arrêter ne se déplie pas »).

À CLARIFIER 6 : clos pour ce lot (statu quo décidé par Hermann).

## 11. Passe ciblée 3 (28/10/2026, après `4ad58fb8`)

| Point | Verdict | Remarque de Hermann | Traitement |
|---|---|---|---|
| `f3-01` survol sans arrêt | **KO** | « Il y a toujours les mêmes mouvements saccadés, et du coup lorsqu'on arrive sur une famille qui était hors de l'écran elle se déplie (ce n'est pas le cas d'une famille repliée qui serait déjà sur l'écran). » | **Cause** : à chaque image du défilement automatique, tout le Catalogue était redessiné pour déplacer la carte portée ; la liste défilait aussitôt, la carte suivait en retard et tremblait. Comme elle ne quittait jamais vraiment la famille survolée, le délai d'arrêt s'écoulait. **Correction** : le défilement automatique de la Composition (`useDragAutoScroll`, PRE-6 story 7.4, recetté) est réutilisé tel quel, avec vitesse progressive et arrêt au bord du contenu. La carte portée suit le défilement par une valeur animée ajoutée à son décalage, sans redessiner la liste ; la liste n'est redessinée que si la décision du geste change. Défiler n'est pas s'arrêter : chaque image de défilement relance le délai de dépliage. Le module `autoScrollDirection` du lot précédent est retiré. |
| `f3-02` défilement | OK | — | — |
| `f3-03` non-régression | OK | — | — |

Demande complémentaire de Hermann : « augmenter un peu la largeur de la bande de la fenêtre tactile des barres verticales, car une fois sur deux on ouvre une carte par mégarde. » **Traité** : la zone de touche du filet (repli de la famille, B06) déborde de 12 pt vers la carte (`hitSlop`) ; le filet ne bouge pas. Valeur technique, ajustable.

## 12. Passe ciblée 4 (28/10/2026, après `ab808040`)

| Point | Verdict |
|---|---|
| `f3-01` survol sans arrêt (rejoué) | OK |
| `f4-01` défilement sans tremblement | OK |
| `f4-02` famille hors de l'écran : survol sans dépliage, arrêt : dépliage | OK |
| `f4-03` zone de touche du filet élargie | OK |
| `f4-04` non-régression du glisser de la Composition | OK |

Bilan de la recette FAM : tous les points de FAM-01 à FAM-11 et des passes ciblées 2 à 4 sont OK sur iPhone. Restent ouverts, sans blocage pour le lot : À CLARIFIER 1 (libellé de l'entrée, provisoire), 2 (alternative accessible), 3 et 4 (lectures à confirmer), 5 (renumérotation de secours) ; limite déclarée : emplacement pointillé. Le statut `review` passe à `done` sur validation explicite de Hermann. [Remplacé par § 13 : points 1 à 3 et 5 clos, 4 clos pour le singleton subi ; statut `done`.]

## 13. Clôture du lot (28/10/2026)

Demande de Hermann : « KODJO — Clôture du lot Familles de niveaux et gestes ». Aucune recette rejouée, aucun parcours ajouté, aucun changement d'interaction.

| Point | Statut | Évidence | Action restante |
|---|---|---|---|
| Libellé d'entrée | **CLOS** | « Mouvement ajouté à la famille » validé par Hermann ; `fr.ts` (texte inchangé, commentaire « provisoire » retiré) ; recette `fam-05`/`f2-*` OK | Aucune |
| VoiceOver (créer, rejoindre, quitter) | **REPORTÉ** | Lot d'accessibilité dédié en fin de MVP ; actions VoiceOver existantes (réordonner) et interactions tactiles conservées ; exigence différée, non supprimée | Lot d'accessibilité de fin de MVP |
| Membres archivés | **VÉRIFIÉ** (cas C1 à C3 ; la famille masquée par un filtre reste une lecture à confirmer, non bloquante) | C1 : un membre archivé reste membre ; détacher un autre ne dissout pas tant que deux membres persistés restent — `movementFamilies.fam` « D3 » ; code `leaveFamily` (compte des membres persistés, archivés compris). C2 : le restant seul garde son appartenance, pastille masquée ; restaurer l'autre retrouve la famille — `movementLifecycle.b8` « clôture FAM (cas 2) » (ajouté). C3 : le dernier couple détaché explicitement est dissous, deux appartenances effacées — `movementFamilies.fam` « D2 » et UI « FAM-07 ». Sources : DSF familles D3, D4, « Singleton subi / détachement explicite » (`main` @ `0a40735f`) | Aucune |
| Rééquilibrage exceptionnel | **VÉRIFIÉ** | Déclenché seulement quand `keyBetween` ne trouve plus de clé ; une transaction exclusive. Tests : déclenché une ou deux fois sur 60 poses, chaque autre pose n'écrit qu'une ligne ; ordre, identités, appartenances conservés, archivé compris ; échec simulé en pleine renumérotation : aucune écriture partielle (`movementFamilies.fam`, « clôture FAM (D) », 2 tests ajoutés). Le test historique ne déclenchait pas la renumérotation (poses vers la clé 0 : ~1 000 poses nécessaires) : corrigé | Aucune |
| Pointillé | **ÉCART ACCEPTÉ** | § 6 bis ; référence Figma `10480:23374` conservée ; rendu non déclaré conforme | Éventuel lot visuel ultérieur |
| Placement alphabétique | **CLOS** | Décision de Hermann du 28/10 (§ 10) ; B5 | Aucune |
| Contradiction b8-3 | **CORRIGÉE DANS PRE-8 ; PRÉPARÉE POUR `main`** | PRE-8 : ch07 (b8-3, Q5 annotée ; Q3 annotée à la clôture, relevée par la seconde passe), ch10 et DSF du 27/10 déjà annotés ; plus aucune formulation contraire non annotée (recherche et seconde passe). `main` @ `0a40735f` : patch `_bmad-output/pre8/integration-familles-cloture-2026-10-28.patch` (DSF familles, DSF Mouvements du 27/10, ch07 avec le texte de b8-3, ch09, ch10, ch13 ; annotations entre crochets, textes d'origine conservés) ; `git apply --check` sur un index temporaire d'`origin/main` : OK | Appliquer le patch à l'intégration documentaire de `main` (opération Git soumise à décision) |
| Recettes iPhone précédentes | **VALIDÉES (non rejouées)** | Base de la page de recette : `fam-01`…`fam-13`, `f2-01`…`f2-05`, `f3-01`…`f3-03`, `f4-01`…`f4-04` tous OK au 28/10 (18:18) | Aucune |
| Vérifications globales différées | **NON VÉRIFIÉ** | Suite Jest complète et ESLint global interrompus par manque de mémoire ; dernier passage ciblé : 111 suites / 2 269 tests | Exécution fractionnée dans une activité distincte |

Hors patch `main` : la règle source de Hermann (`KODJO-Regles-Familles-de-niveaux-2026-10-28.md`) est conservée à l'identique (citation) ; la DSF porte les précisions. ch11 et ch12, `PRODUCT.md`, `INDEX.md` : aucune formulation dépendante (contrôle par recherche), non modifiés.

Seconde passe indépendante (28/10, agent en lecture seule) : 17 constats, dont 13 corrigés (passages du patch oubliés : libellé d'entrée en ch13 et dans les tableaux de messages, dépliage à l'arrêt en ch10, exception de rééquilibrage en ch07, ch09, ch13, texte de b8-3 repris dans le ch07 de `main`, décision sur les membres archivés transcrite dans la DSF, DSF Mouvements du 27/10 ; Q3 du ch07 de la branche ; formulations restées ouvertes dans cet artefact, le cahier de recette et le plan d'intégration ; famille filtrée remise « à confirmer ») et 4 informatifs (règle source de Hermann conservée à l'identique ; concordance du code et des tests).

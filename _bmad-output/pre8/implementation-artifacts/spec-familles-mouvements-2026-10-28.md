# PRE-8 — Lot ciblé « Familles de niveaux par geste » du Catalogue des Mouvements (28/10/2026)

> Lot ciblé au sein de PRE-8, rattaché au Catalogue des Mouvements de l'epic B (clos, non rouvert). Demande de Hermann du 28/10/2026 : « Intégration immédiate des nouvelles règles de familles dans le Catalogue des Mouvements ». Statut BMAD : `fam-familles-de-niveaux-geste: review` — développé et testé automatiquement, **non recetté** (validation iPhone de Hermann requise).

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
- **Libellés** (`fr.ts`, `movement.catalogue.family`) : textes E2 exacts ; libellé d'entrée **provisoire**, voir § 6.

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

1. **Libellé de l'entrée dans une famille existante** (réserve de transcription de la DSF) : E2 ne le fournit pas. Le code affiche, **à titre provisoire et non validé**, « Mouvement ajouté à la famille » avec Annuler et 3 s. Texte à fournir par Hermann.
2. **Alternative accessible** : réordonner reste possible par les actions VoiceOver existantes (« Placer … un niveau plus haut / plus bas »). Sortir, créer, rejoindre n'ont pas d'alternative accessible : la règle interdit « une action nommée de retrait, dans un menu ou ailleurs ». À arbitrer (une action VoiceOver serait-elle une action nommée ?).
3. **Dernier couple accompagné d'un archivé** : la dissolution compte les membres des données, archivés compris (D3 : l'archivé reste membre). Une famille de deux actifs et d'un archivé n'est donc pas dissoute par la sortie d'un actif : le restant s'affiche seul (singleton subi) et le message est « Mouvement sorti de la famille ». Lecture à confirmer.
4. **Singleton subi ou famille masquée par un filtre** : une carte isolée qui appartient encore à un groupe (autre membre archivé, ou membres masqués par un filtre) ne peut pas être portée vers une autre carte (rien ne se passe) ; visée par un Mouvement libre, elle le fait entrer dans son groupe (message d'entrée). À confirmer.
5. **Renumérotation de secours** : si la précision des clés fractionnaires est épuisée entre deux voisines (après une cinquantaine de poses au même endroit), toute la famille est renumérotée dans la même transaction, contrairement à « aucun autre mouvement n'est réécrit ». Choix technique à valider.

## 6 bis. Limites connues (non conformes au texte, déclarées)

- ~~**Ouverture de place**~~ : levée par la recette du 28/10 (§ 9).
- **B2** : à la sortie, ce sont les cartes **sous** la carte portée qui remontent et le filet raccourcit par le bas ; rendu équivalent à « les cartes au-dessus se referment », à confirmer.
- ~~**Défilement**~~ : levée par la recette du 28/10 (§ 9).
- **Emplacement pointillé** (Figma `10480:23374`, CE-MVT-03 §7) : non rendu ; la carte portée garde son ombre et les voisines se décalent (rendu du glisser B08 recetté le 27/10).

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

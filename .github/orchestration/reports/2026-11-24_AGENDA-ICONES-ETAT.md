# 2026-11-24 — AGENDA-ICONES-ETAT : icônes d'état et teintes de cadre de l'Agenda

## Mission

- **Objectif** : prompt « Claude Code — Agenda : icônes d'état et teintes de cadre (24/11/2026) ». Appliquer à la ligne d'agenda la décision des icônes d'état et des teintes de cadre. Présentation seulement : aucune règle de calcul d'état ne change.
- **Sources** :
  - registre et DSF Agenda de la branche `docs/planification-grille-creneaux` (`be062351`), lus sans fusion ;
  - Figma `G6RY5Ebhgwb4AHIOYDwwvg` : écran « P-Calendrier — Semaine — Icônes d'état (essai) » `13149:26608` et légende « Icônes d'état de l'Agenda » `13149:26915` (colonnes « Option 2 » et « Appuyé »), lus avec `use_figma` et `get_screenshot`.
- **Branche** : `feat/agenda-icones-etat-20261124`, créée depuis `origin/main` `aaaa4b63` (worktree `C:\Dev\KODJO-AGICON`).

## Numéro de décision

- Sur la branche de documentation, la règle porte le numéro **D-566**. Sur `main`, D-566 désigne déjà « Routine qui déborde de la période de son programme », cité par le code (`occurrences.ts`, `JournalScreen.tsx`, `PlanningScreen.tsx`, `planningNotice.ts`).
- Collision technique, tranchée sans arbitrage (consigne de Hermann du 24/11) : la règle des icônes devient **D-599** sur `main`, avec un renvoi à l'ancien numéro. Les mentions de D-566 déjà présentes sur `main` sont intactes.

## PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** (vérifié inchangé dans le diff) :
  - règles de calcul des états : `CalendarWeekScreen`, `occurrences.ts`, statuts `AgendaStatus` ;
  - géométrie de la ligne : cadre de 80, bande, traits de 6, hauteur de 52 ;
  - zones tactiles gauche / centre / droite : la droite reste sans effet pour un état ;
  - textes, chevron, repère parcours, astérisque, texte grisé de la carte supprimée ;
  - carte déployée, actions glissées, filtres ;
  - Plan (`PlanScreen`, ses propres teintes) ;
  - carte de séance du catalogue.
- **CHANGE** :
  - pastille textuelle → icône ronde de 28 ;
  - teintes du cadre, de la bande et du trait par état ;
  - jetons de couleur ;
  - zone droite centrée verticalement.
- **FORBIDDEN** (respecté) :
  - aucune règle d'état modifiée ;
  - pas d'anneau de progression réelle ;
  - aucune bibliothèque ajoutée (pas de `react-native-svg`) ;
  - aucune réécriture hors périmètre.

## Réalisé

- **`src/features/planning/AgendaStatusIcon.tsx`** (nouveau) :
  - icônes à plat : Complétée, Partielle, Arrêtée, Supprimée, Expirée ;
  - icône de lecture en relief : dégradé `experimental_backgroundImage`, filet, deux ombres `boxShadow` ;
  - état appuyé : 94 %, fond `#E8EBF5`, ombre interne en haut, ombre extérieure réduite, par l'état `pressed` de `Pressable` ;
  - zone de toucher de 44 ;
  - libellés d'accessibilité, sans libellé visible.
  - Les glyphes (triangle, coche, croix, horloge) sont des SVG de `assets/icons/agenda-etat-*.svg`, teintés par jeton ; le carré et l'anneau sont dessinés en vues.
- **`RoutineAgendaCard.tsx`** :
  - teintes par état : bleu à démarrer ; rouge pour Rattraper, Arrêtée et Expirée ; vert pour Complétée ; orange pour Partielle ; gris pour Supprimée ;
  - bande = cadre à 18 % ;
  - Démarrer et Rattraper partagent la même icône ;
  - icône centrée, bord droit à 20 de l'écran (Figma).
  - « Arrêtée » passe du gris au rouge, et « Supprimée » au gris de Figma (`#F0F0F5` / `#B8BAC9`).
- **Jetons** : 20 couleurs `colors.agenda*` dans `tokens.ts`, documentées dans le ch. 12. Elles reprennent les valeurs exactes de Figma.

| État | Cadre | Trait |
|---|---|---|
| à démarrer | `#E0E4F5` | `#8F9BCC` |
| rouge (Rattraper, Arrêtée, Expirée) | `#F5E0E0` | `#CC8F8F` |
| Complétée | `#E0F5E8` | `#8FCCA8` |
| Partielle | `#F5EBE0` | `#CCAD8F` |
| Supprimée | `#F0F0F5` | `#B8BAC9` |

- **Documents** :
  - registre : D-599 ;
  - DSF Agenda : les quatre annotations du 24/11 reportées (§ 5, § 8, § 10 ×2) ;
  - ch. 12 : jetons.
- **Classe** : B (décision de Hermann).

## Écart Figma consigné

- Dans la légende, le disque appuyé mesure 24,64 (88 %). La règle écrite et la consigne disent 94 % : 94 % est retenu.

## Tests

- **`RoutineAgendaCard.d599.test.tsx`** (nouveau, 13 tests) :
  - teinte par état (cadre, trait, bande) ;
  - une icône par état, avec son libellé d'accessibilité ;
  - aucun libellé visible, aucune étiquette `status-tag` résiduelle ;
  - Démarrer et Rattraper : rendu identique, seuls interactifs, zone de 44 ;
  - relief et état appuyé ;
  - aucune couleur d'état en dur dans les deux fichiers.
- **`CalendarWeekScreen.integration`** : 7 assertions mises à jour (icônes au lieu des étiquettes, nouvelles teintes).
- `tokensSpecification` : passe.
- **Suites** :
  - 3 suites, 43 tests réussis ;
  - `--findRelatedTests` sur la carte et les icônes : 3 suites, 45 tests réussis.
- **Types et lint** : `tsc` est propre et le lint ne signale rien.
- **Limite** : le passage réel à l'état appuyé (`Pressable`) n'est pas simulable en Jest. Le rendu des deux états est testé sur le composant d'icône.

## À vérifier sur iPhone

- Lisibilité des icônes à 28.
- Relief et état appuyé de Démarrer / Rattraper.
- Contraste des cadres.
- Anneau Partielle.
- VoiceOver annonce l'état.

## Hors périmètre

- Carte de séance du catalogue ; carte déployée ; actions glissées ; filtres ; règles d'état ; anneau à progression réelle ; Plan.

## Fichiers modifiés

- `src/features/planning/AgendaStatusIcon.tsx` (nouveau)
- `src/features/planning/RoutineAgendaCard.tsx`
- `src/shared/ui/tokens.ts`
- `assets/icons/agenda-etat-lecture.svg`, `agenda-etat-coche.svg`, `agenda-etat-croix.svg` et `agenda-etat-horloge.svg` (nouveaux)
- `src/features/planning/__tests__/RoutineAgendaCard.d599.test.tsx` (nouveau)
- `src/features/planning/__tests__/CalendarWeekScreen.integration.test.tsx`
- `docs/DSF-AGENDA-PLANNING-2026-11-19.md`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/Specifications-fonctionnelles/12 – Architecture technique.md`
- ce rapport

## Complément du 24/11/2026 : alignement à droite de Démarrer / Rattraper

- **Recette** de Hermann : « le bouton démarrer n'est pas aligné à droite avec les autres boutons ».
- **Classe** : A (Figma : toutes les icônes ont leur bord droit à 20 de l'écran).
- **Cause** : la zone de toucher de 44 était portée par le bouton lui-même, dont les marges intérieures entraient dans ces 44. L'icône de lecture se trouvait donc 8 plus à droite que les icônes d'état, centrées dans un emplacement de 44.
- **Correction** : le bouton contient le même emplacement de 44 que les icônes d'état, avec l'icône centrée. Les marges sont identiques et les bords droits alignés.
- **Tests** :
  - le test D-599 vérifie l'emplacement de 44 et l'égalité des marges ;
  - 2 suites, 39 tests réussis ;
  - `tsc` est propre et le lint ne signale rien.

## Complément 2 du 24/11/2026 : orange des cadres

- **Recette** : les 9 lignes Agenda sont OK, VoiceOver est noté « sans objet », sauf `ag-icone-partielle`, KO. Hermann : « les couleurs orange des cadres ressemblent à du marron, mieux s'aligner avec le orange du symbole partielle ».
- **Classe** : B. Le « même contraste » de D-599 ne vaut plus pour l'orange (registre annoté).
- **Correction** : cadre `#FDE9D3` et trait `#F4B571`, dans la teinte du symbole `#F58C1A` (≈ 31°), nettement plus saturés. Ils remplacent les valeurs Figma `#F5EBE0` / `#CCAD8F`. La bande reste le cadre à 18 %.
- **Documents** : jetons (`tokens.ts`, ch. 12) et registre.
- **Tests** : `RoutineAgendaCard.d599` et `tokensSpecification`, 2 suites, 15 tests réussis.

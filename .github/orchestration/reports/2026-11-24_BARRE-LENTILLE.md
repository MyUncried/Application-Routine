# 2026-11-24 — BARRE-LENTILLE : effet lentille sur la barre de navigation du bas

## Mission

- **Demande** de Hermann (conversation du 24/11/2026) : « Ensuite je veux qu'on applique cet effet lentille sur la barre de navigation et sur les cadres des 5 options » ; « je parle bien de la barre de navigation du bas ».
- **Arbitrage** : Hermann a retenu « Cadre actif en verre » :
  - le fond de la barre devient du verre lentille ;
  - le cadre qui glisse sous l'onglet sélectionné devient une lentille ;
  - les autres onglets n'ont pas de cadre.
- **Référence** : l'effet lentille du bouton flottant, validé le même jour (PR #452, « On garde l'effet lentille, c'est parfait »).
- **Branche** : `feat/barre-lentille-20261124`, créée depuis `origin/main` `6ce2d832` (worktree `C:\Dev\KODJO-NAVLENS`).

## Périmètre

- **Demandé** : la barre de navigation du bas et son cadre actif.
- **Traité** : exactement ce périmètre.
- **Inchangés** :
  - forme, liseré blanc, ombre, icônes et libellés ;
  - dimensions et animation du cadre (glissement de 250 ms par le pilote natif) ;
  - Communauté désactivée.

## Constats

- La barre (`app/(tabs)/_layout.tsx`, `BottomTabBar`) avait un fond opaque `#F9FAFC` et un cadre actif opaque bleu à 10 %.
- Aucun verre n'était utilisé.
- Le composant Figma `6513:20151` ne prévoit pas de verre. Il s'agit d'une évolution demandée par Hermann (classe B).

## Modifications

- **`src/shared/ui/liquidGlass.ts`** (nouveau) :
  - `liquidGlassAvailable()` : verre natif d'iOS 26 disponible ou non ;
  - `LENS_VEIL` : voile blanc à 22 %, valeur du bouton flottant.
- **`app/(tabs)/_layout.tsx`**, avec le verre natif :
  - sous la pilule : calque `GlassView` « clear » et voile à 22 %, rayon intérieur 32, fond de la pilule rendu transparent ;
  - dans le cadre actif : `GlassView` « clear » teinté du bleu du cadre (`tintColor`, 10 %), fond rendu transparent.
  - Sans verre natif : rendu d'origine.
- **Documents** :
  - DSF Navigation, contrat commun CE-UI-05 : règle ajoutée ;
  - ch. 13 § 4.3 : complément ;
  - ch. 12 : note technique ;
  - ch. 07 : décision **D-595**. Les numéros D-593 et D-594 sont pris par les PR #453 et #452.

## Tests

- `TabsLayoutSearch.integration.test.tsx` : 12 tests réussis, dont 2 nouveaux :
  - pilule en verre clair avec voile à 22 %, même forme, liseré et ombre ;
  - cadre actif en lentille teintée, 66 × 50.
- Le test de la surface Figma `#F9FAFC` passe désormais par un verre natif indisponible : le module `liquidGlass` est simulé.
- `jest --findRelatedTests app/(tabs)/_layout.tsx src/shared/ui/liquidGlass.ts` : 1 suite, 12 tests réussis.
- **Types et lint** : `tsc` est propre et le lint ne signale rien sur les fichiers modifiés.
- **Suite complète** : non relancée, pour ménager la mémoire du PC.

## Hypothèses non démontrées

- Le rendu du verre natif (lentille, lisibilité des icônes inactives grises) ne se juge que sur iPhone.
- **Verre sur verre** : le cadre en verre est posé sur la pilule en verre ; le rendu doit être vérifié.

## À vérifier sur iPhone (iOS 26)

- La pilule laisse voir le contenu qui défile dessous, avec l'effet lentille.
- Icônes et libellés lisibles.
- Le cadre actif est une lentille bleutée qui glisse sans saccade.
- Le bouton flottant posé sur la barre reste au-dessus.

## Fichiers modifiés

- `app/(tabs)/_layout.tsx`
- `src/shared/ui/liquidGlass.ts` (nouveau)
- `src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx`
- `docs/DSF-NAVIGATION-CINQ-DESTINATIONS-2026-10-27.md`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/Specifications-fonctionnelles/12 – Architecture technique.md`
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`
- ce rapport

## État Git

Le commit final et l'état Git figurent dans le message de livraison.

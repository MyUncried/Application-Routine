# 2026-11-19 — Haut d'écran à onglets partagé (`TabbedScreen`)

## Identification et objectif

- **Demande de Hermann (19/11/2026)** : « Crée ce composant partagé pour le haut d'écran, par exemple `EcranAOnglets`, avec les propriétés nécessaires : le titre ; les onglets (intitulés, onglet actif, onglets indisponibles) ; la couleur (une palette : en-tête, zone, onglet sélectionné) ; le contenu de la zone : compteurs, recherche, filtre, tri, bouton d'action. ET APPLIQUE LE PARTOUT OÙ IL DOIT ÊTRE UTILISÉ ».
- **Choix** : B, Catalogues compris.
- **Consigne complémentaire** : « Assure-toi que ce composant est conforme à ce qui a déjà été fait ».
- **Origine** : les zones de contexte du Journal et de l'Agenda n'étaient pas au format, car leur haut d'écran avait été réassemblé à la main au lieu de reprendre celui du Catalogue.
- **Branche** : `planification/ce-ui-12-20261118`, dossier `C:\Dev\KODJO-PLANIF-CE12`.
- **Commit de départ** : `1be87f58`.

## Constats avant correction

| Écran | Écart |
|---|---|
| Agenda | Contenu de la zone fait à la main. Marges verticales hors géométrie, contenu non centré alors que le DSF Agenda § 2 dit « trois lignes centrées verticalement ». Marge latérale de 16 appliquée deux fois (32 de chaque côté au lieu de 16). Bouton Planifier refait à la main (rond de 32). |
| Journal | Bouton Planifier refait à la main (rond de 32) au lieu du cercle de commande standard. |
| Tous les écrans à onglets | Assemblage `ScreenShell` + `FixedHeader` + `CatalogueNavigation` + `ContextBand` + marges recopié écran par écran : aucun garde-fou contre l'oubli d'un paramètre. |

## Réalisation

- **Nouveau composant** `src/shared/ui/TabbedScreen.tsx` (le « EcranAOnglets » demandé, nommé selon la convention anglaise du code) :
  - `title` ;
  - `tabs` : options (intitulé, indisponible, libellé d'accessibilité), onglet actif, changement d'onglet, `testID` ;
  - `palette` : `context` (zone et onglet sélectionné), `background` (fond d'écran, barre d'état et en-tête), `header` (en-tête seul, quand il diffère du fond) ;
  - `context` :
    - `catalogue` : compteurs, « N résultats », recherche, filtre, tri, bouton d'action Créer ou Planifier, accessoire de la ligne 1 ;
    - `custom` : contenu propre dans la même bande, aux marges des Catalogues ou centré ;
    - absent : bande courte sous les onglets.
- **Assemblage repris à l'identique du Catalogue validé**, sans aucune valeur nouvelle :
  - `ScreenShell` ;
  - `FixedHeader` avec la navigation sur toute la largeur et toute la hauteur (D-502) ;
  - `ContextBand` en fondu (D-224) aux marges `CONTEXT_ZONE_GEOMETRY` (CE-CAT-CTX-01) ;
  - `CatalogueContextZone`.
- **Bouton d'action standard** : `CommandCircle` reçoit l'icône `plan` (`icon-planifier.svg`, ajoutée à `KodjoIcon` sous le nom `calendar-plan`).
- **Écrans passés au composant** :

| Écran | Zone | Rendu |
|---|---|---|
| Catalogue — Mouvements | `catalogue` | Inchangé (même assemblage, mêmes valeurs). |
| Catalogue — Séances | `custom` (`SessionCommandRow`, aux marges des Catalogues) | Inchangé. |
| Journal | `catalogue` | Planifier devient le cercle standard (34, cible 44). |
| Agenda | `custom` centré | Trois lignes centrées verticalement ; marges de 16 portées par la seule bande ; Planifier devient le cercle standard. |
| Profil — Modifier le profil | `custom` (identité, aux marges des Catalogues) | Inchangé. |
| Profil — Préférences | sans zone (bande courte) | Inchangé. |

- **Hors du composant** : bibliothèques personnelles, sélection d'un mouvement existant, Composition et éditeurs. Ce sont des en-têtes avec Retour, sans onglets ; ils gardent `ContextBand`.
- **`CalendarViewTabs`** fournit désormais `calendarTabs(vue, changement)` et `CALENDAR_PALETTE` (en-tête `#F7F7FF`, zone `#EAEAFF`, fond d'écran inchangé).
- **Hors sujet, mais bloquant la suite de tests** : l'icône `icon-agenda-chronometre.svg` (lot 3, commit `c113d0d1`) manquait au manifeste `assets/icons/manifest.json`. Elle y est ajoutée.

## Liste PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE**, démontré par les tests existants inchangés et verts :
  - rendu des Catalogues et du Profil (mêmes composants, mêmes valeurs, mêmes identifiants de test) ;
  - navigation entre onglets ;
  - comportement des zones (recherche, filtres, tri, Créer) ;
  - corps des écrans.
- **CHANGE** :
  - le haut de ces six écrans passe par `TabbedScreen` ;
  - Planifier devient le cercle standard (Journal, Agenda) ;
  - marges et centrage de la zone de l'Agenda.
- **FORBIDDEN, respecté** :
  - aucune primitive native touchée ;
  - aucun domaine ni persistance touchés ;
  - aucun test existant réécrit.

## Points à confirmer (non tranchés)

1. **Taille de Planifier** : le DSF Agenda § 2 indique 32 × 32 ; le cercle de commande standard mesure 34 (cible 44). J'ai appliqué le composant standard, comme demandé.
2. **Nom** : le composant s'appelle `TabbedScreen` (convention anglaise du code) ; « EcranAOnglets » était donné à titre d'exemple.

## Tests

- Nouveau : `src/shared/ui/__tests__/TabbedScreen.test.tsx` (3 cas) :
  - marges et couleurs de la zone standard, couleur de l'en-tête ;
  - Tri inactif, Planifier standard, Créer avec l'identifiant des Catalogues ;
  - zone libre centrée et zone libre aux marges des Catalogues ;
  - bande courte sans zone.
- Écrans concernés : planification, Profil, Catalogue, `shared/ui`, routes. Résultat : 45 suites, 382 tests réussis, après ajout de l'icône manquante au manifeste.
- `tsc` propre ; `eslint` sans erreur ni avertissement sur les fichiers touchés.
- Suite complète `npx jest -w 3` : 407 suites réussies, 6 229 tests réussis, 32 ignorés.

## Vérifications sur iPhone

- Catalogue Mouvements et Séances : en-tête, onglets et zone identiques à avant.
- Journal : Planifier au format du cercle Créer des Catalogues.
- Agenda :
  - lignes centrées dans la bande ;
  - marges de 16 ;
  - flèches de semaine à leurs positions (centres 96 et 306) ;
  - Planifier standard.
- Profil, Préférences et Modifier le profil : inchangés.

## Synchronisation code / documentation

- **Classe B** (demande explicite de Hermann) : chapitre 12, section « Haut d'écran à onglets partagé — `TabbedScreen` (19/11/2026) ».
- **Classe A** : marges et centrage de l'Agenda (DSF Agenda § 2).
- **Classe C signalée** : 32 contre 34 pour Planifier.

## Fichiers modifiés

- Nouveaux : `src/shared/ui/TabbedScreen.tsx`, `src/shared/ui/__tests__/TabbedScreen.test.tsx`.
- Modifiés :
  - `src/shared/ui/{CatalogueCommands,KodjoIcon}.tsx` ;
  - `src/features/sessions/CatalogueScreen.tsx` ;
  - `src/features/planning/{CalendarViewTabs,JournalScreen,CalendarWeekScreen}.tsx` ;
  - `src/features/preferences/{ProfileScreen,ProfileEditScreen}.tsx` ;
  - `assets/icons/manifest.json` ;
  - chapitre 12.

## Commits et état Git

- Voir le message de clôture : hash du commit, branche non poussée, non fusionnée.

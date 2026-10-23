# Story 0.1 — Décisions et réconciliation documentaire (Epic 0)

> Statut : review. Plan PRE-7 approuvé par Hermann le 24/10/2026 (`planning-artifacts/epics.md`, §4, §5 Epic 0 et Epic B, §6). Documentation seule : ni `src/`, ni `app/`, ni `.github/`, ni `CLAUDE.md` / `AGENTS.md`.

## Objectif

1. Annoter D-440 et MFN-12 de l'assouplissement de Hermann des 23 et 24/10/2026 (préférences du Profil et Catégories conservées ; Exercices et Séances réinitialisés une seule fois par la migration 012, avec avis ; filiation des occurrences existantes non reconstituable, conversion non retenue). Aucune autre décision MFN modifiée.
2. Créer D-445 — Finalisation de l'éditeur d'Exercice (B1 à B10), placée en tête du registre après D-444, avec sa ligne « Hors périmètre / Remplace ».
3. Propager les remplacements dans les chapitres qui énoncent les règles remplacées.

## Fichiers touchés

- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` : annotation de D-440 ; D-445 ; annotations dans D-404, D-408, D-411, D-416, D-424, D-425, D-431 (paragraphe après RC-13), D-434 (paragraphe après RC-15).
- `docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md` : MFN-12 (paragraphe d'assouplissement) ; RM-238 (B10) ; RM-245 (B8) ; RM-248 et RM-249 (libellés B2).
- `docs/Specifications-fonctionnelles/12 – Architecture technique.md` : « Architecture cible MFN » (D-440 assouplie) ; Disclosure `5544:4650` (B7).
- `docs/PRODUCT.md` : phrase de transition MFN (D-440 assouplie).
- `docs/Specifications-fonctionnelles/01 – Vision Générale.md` (glossaire Condition d'arrêt), `04 – Modèle fonctionnel.md` : libellés B2.
- `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md` : libellés B2 (écarts Figma et états CE-UI-10) ; tableau variable (B10).
- `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md` : lignes Description (B1), Condition d'arrêt (B2), Charge (B10), Enchainement (B5), Cadence (B8) ; paragraphe « évolution du 18/10 » (B2).
- `docs/Specifications-fonctionnelles/13 – Contrats d'écran.md` : CE-T03-04 §8 (B1) ; CE-UI-10 §8 (B2, B8), §9 (révision 24/10 : B3, B4, B6, B7), §10 (révision 24/10 : B9), §11, §12, §15 (B10), §20 (B2) ; complément Formats (B2) ; Règles communes, lignes 2, 5, 6, 7, 9, 10, 11, 12, 13 et paragraphe Création.

## Remplacements explicites (D-445)

| Point | Règle remplacée ou complétée | Où c'est consigné |
|---|---|---|
| B1 | Invite « Étape suivante » affichée au repos (D-425, CE-T03-04) : désormais seulement Description active | D-425, ch08, ch13 CE-T03-04 |
| B2 | Libellés « À la cible » / « À la cible et à l'échec » → « À l'objectif » / « À l'objectif et à l'échec » | D-411, D-416, D-424 (annotations, texte historique conservé) ; ch01, 04, 06, 08, 10 (RM-248, RM-249), 13 (texte mis à jour) |
| B3, B4, B6 | Aucune règle contraire écrite ; ajout de présentation | D-445 ; ch13 §9, lignes 9, 12, 13 |
| B5 | Menu natif iOS du Changement de côté accepté en recette PRE-5 (RC-6, `_bmad-output/pre5/recette-iphone-pre5.md`, l. 63-65) | D-445, annotation D-431, ch08 ligne Enchainement, ch13 ligne 7 |
| B7 | Variante encadrée par défaut du Disclosure (ch12) pour Durée de l'exercice | D-445, ch12, ch13 §9 et ligne 11 |
| B8 | Précise RM-245 (« affichage de la valeur personnalisée suit le contrôle existant ») et D-408 | RM-245, D-408, ch08, ch13 §8 et ligne 10 |
| B9 | Complète D-434 point 4 (disposition de la barre) | annotation D-434, ch13 §10 |
| B10 | « Sans la masque » (colonne Charge en séries variables) | D-404, RM-238, ch06 (tableau variable), ch08, ch13 ligne 6, ligne 5, §15 |

Inchangés : modèle de données, calculs, API, identifiants `TARGET` / `MIXED`, D-420, D-431 (notations), D-434 (commandes, focus, navigation), RM-236, RM-239.

## Occurrences volontairement non modifiées

- « cible » au sens métier : ch10 RM-249 et ch13 « une cellule vide n'est comptée ni à la cible ni à l'échec » ; ch07 D-239 « cible tactile ».
- Documents datés (`DSF-DEUX-MODES-ECHEC-2026-10-13.md`, archives, `docs/preparation/`) : références historiques, libellé « À la cible » laissé.
- Mentions MFN qui n'énoncent pas la perte des préférences : ch05 l. 311-313, ch09 l. 305, ch10 l. 329, ch11 l. 112, `DSF-MOUVEMENT-FILIATION-NIVEAUX-2026-10-23.md` l. 3, matrice de traçabilité (ligne D-440). Les titres « Démarrage sur base vierge » (MFN-12) et « Transition ponctuelle sur base vierge » (D-440) sont conservés pour ne pas casser les ancres.

## Ambiguïtés laissées (à soumettre à Hermann si nécessaire)

1. **Zones corporelles personnalisées** : l'assouplissement nomme le Profil et les Catégories ; le référentiel des Zones corporelles est administrable par l'utilisateur (ch12 l. 1559) et le plan §4 parle seulement de « zones liées » supprimées et de « référentiels initiaux réensemencés ». Le sort des Zones créées ou renommées par l'utilisateur n'est pas écrit. Proposition : les conserver comme les Catégories (même nature de référentiel), à confirmer en story A1.2. **Tranché par Hermann le 24/10/2026 : Zones corporelles conservées avec leurs personnalisations** ; intégré dans D-440, MFN-12, ch12 (Architecture cible MFN) et `PRODUCT.md`.
2. **Libellé de l'option dans le texte historique de D-411** : conservé et annoté, conformément à la pratique du registre ; « Définie » et « À la cible » ne sont pas ajoutés à la liste des termes obsolètes du ch01 §8 (non demandé).
3. **B9, libellés Précédent / Suivant** : D-434 prévoit des flèches seules si la largeur manque ; D-445 impose quatre emplacements égaux sans trancher ce point. La règle D-434 reste applicable.

## Contrôles

- `npx tsc --noEmit` : vert.
- Fins de ligne : fichiers de `docs/` en CRLF, aucune ligne LF seule introduite (vérifié par node).
- Aucune règle nouvelle hors des textes de Hermann (plan §4, §5, §6 et consigne de la story).

# Rapport de mission — documentation de la planification (grille de créneaux)

- **Identifiant** : PLANIF-GRILLE-DOC-2026-11-18 ; objectif : mettre à jour la documentation (classe B) d'après les décisions de Hermann du 18/11/2026 et préparer le prompt Claude Code d'application.
- **Branche / départ** : `docs/planification-grille-creneaux`, créée depuis `main` au commit `6a7e0376`.
- **Périmètre demandé** : mise à jour de la documentation et rédaction du prompt. Aucun code applicatif.
- **Périmètre traité** : registre (D-519 à D-523 + À CLARIFIER), chapitre 10 (RM-253 à RM-259, annotations RM-054a et sections x fois sur n / répétition du créneau), chapitre 13 (CE-UI-12, annotations CE-UI-05 et CE-UI-11), chapitre 06 (écrans retirés, stepper remplacé), chapitre 04 (ordre des contenus), matrice de planification, prompt.
- **Constats** : quatre points arbitrés par Hermann le 18/11/2026 : Rappel « Sans » (D-524), occurrences passées rejouables (D-525, remplace RM-049), unité « mois » retirée (D-526), roulette du Rappel sans unité.
- **Preuves et tests** : aucun test applicable (documentation). Recherche ciblée des anciennes formulations (stepper, interrupteur, x fois sur n, frames retirées) ; textes d'origine conservés avec annotation datée.
- **Hypothèses non démontrées** : ch08, ch09, PRODUCT.md et les DSF n'ont pas été modifiés ; leur dépendance au stepper et à l'interrupteur n'a pas été vérifiée exhaustivement (ch09 : mention du Rappel annotée ; texte de l'Occurrence planifiée non relu au regard de D-525).
- **Éléments non corrigés / hors périmètre** : aucun point À CLARIFIER restant ; écrans Figma non modifiés (option « 5 min » du Rappel, « mois » dans la Répétition, Agenda) ; captures du chapitre 06 et de la matrice non régénérées ; DSF du sélecteur numéroté non édité.
- **À vérifier sur appareil réel** : sans objet pour cette mission ; à vérifier lors de l'implémentation (roulettes natives, popovers, grille 7 colonnes, modale iOS).
- **Fichiers modifiés** : chapitres 04, 06, 07, 10, 13 de `docs/Specifications-fonctionnelles/` ; `docs/MATRICE-PLANIFICATION-2026-10-08.md` ; nouveaux : `docs/PROMPT-CLAUDE-CODE-PLANIFICATION-GRILLE-2026-11-18.md` et ce rapport.
- **Classe de synchronisation** : B (évolution validée explicitement). Documents mis à jour : ceux listés ci-dessus.
- **Commit final et état Git** : voir le message de livraison (hash et état renseignés après commit).

- **Renumérotation (18/11/2026)** : D-516 à D-518 étant pris par les PR #427 et #431, les décisions de la planification sont D-519 à D-527 ; RM-253 à RM-264 et CE-UI-12 inchangés. D-527 et RM-260 à RM-264 (cycle, nom, migration) sont une proposition de Claude à valider par Hermann.

## Complément du 19/11/2026

- Figma : écran « Répétition en jours (proposition) » `12665:27227` placé à droite de « P-Planifier une séance — Création », rangée décalée de 482 ; écran « cycle étendu à 3 » `12624:29713` supprimé (D-523, CE-UI-12, matrice et prompt annotés, texte d'origine conservé).
- Figma : 14 écrans calendrier au format onglets du catalogue (onglet actif `11704:29295` cloné, libellés Journal / Agenda / Vue d’ensemble).
- Décision D-532 (classe B) ; ch06 et ch13 annotés.
- Non vérifié : rendu visuel (captures non lisibles depuis l’environnement) ; contrôle géométrique seul. À vérifier par Hermann sur le Figma.
- Écran « Agenda — Planning (proposition) » inchangé ; collision de mot « Agenda » à arbitrer.

- Figma : contenu du modal « Sélecteur numéroté » reporté dans « Modal — Planifier une séance — Sélectionner une séance » `7599:14197` (arrière-plan conservé) ; écran `12628:34456` supprimé.

## Complément du 19/11/2026 (suite) — Agenda

- Figma : écran « Agenda — Planning (proposition) » repris (onglets, zone de contexte en trois lignes, cartes de jours, carte de routine) ; bande et dégradé des 15 écrans calendrier alignés sur la zone de contexte de « Planifier une séance ».
- Docs : `docs/DSF-AGENDA-PLANNING-2026-11-19.md` créé ; D-533 (registre, ch07) ; CE-UI-15 (ch13). Classe B pour le rendu, classe C (À CLARIFIER) pour la spécialité, la condition d’« Aujourd’hui » et la logique des teintes.
- Non vérifié : rendu visuel des écrans (captures non lisibles depuis l’environnement).

- D-533 précisé : la carte de routine remplace la carte de la vue Semaine (Agenda) ; ch06 et ch13 (CE-UI-03) annotés ; états déployé et actions glissées À CLARIFIER.

## Complément du 19/11/2026 (propagation de l’Agenda)

- Figma : zone de contexte, rangée des jours, liste groupée et carte de l’Agenda reportées sur 8 écrans : Semaine `1992:5101`, Actions glissées `1992:5962`, Séance déployée `1992:6389`, Après suppression `2074:86`, Étirements — Actions glissées `2094:86`, Mardi sélectionné `2252:86`, et fonds des modales `1992:5365`, `1992:6102`. Bande (115, y = 92) inchangée.
- Séance déployée : carte de l’Agenda + filet et liste des exercices clonés de `6227:5381` (catalogue).
- Docs : DSF Agenda § 6 ; CE-UI-15 annoté. Classe B (rendu).
- Non fait : écrans Jour (`1992:5510`, `1992:5602`, `1992:5697`, `1992:5794`, `2059:267`, `2128:86`) et Mois (`1992:5237`) : question de périmètre posée à Hermann.
- Non vérifié : rendu visuel (captures non lisibles depuis l’environnement) ; contrôle géométrique seul. Les jeux de dates des anciens écrans (3–9 août) sont remplacés par ceux de l’Agenda (16–22 novembre).
- Commit : voir le message de livraison.

## Complément du 19/11/2026 (routine à plusieurs séances)

- Diagnostic (branche locale `planification/ce-ui-12-20261118`, commit `a22f9f71`, non poussée) : la Routine est bien enregistrée une fois, avec son nom (RM-258, RM-261), et `occurrences.ts` produit une occurrence à plusieurs contenus ; `CalendarWeekScreen.tsx` (`itemsByDay`) crée une carte par contenu, chacune avec son « Démarrer » (`/execution` avec un seul `sessionId`). Code non modifié ; correction à faire dans cette branche : une carte par occurrence, puis orchestration au-dessus de `ExecutionService`.
- Décision D-534 (ch07), DSF Agenda § 7, ch13 annoté. Classe B.
- Figma : écran « Exécution d’une séance — Initial — Enchaînement (proposition) » ; chevron, alignements, bande et trait droit sur la carte de routine (Agenda et 8 écrans calendrier).
- Non fait : code de planification et d’exécution ; écran Jour (à remplacer) et Mois non modifiés ; dessin de l’arrêt d’une séance enchaînée.
- Non vérifié : rendu visuel (captures non lisibles) ; tests non applicables (documentation et Figma).

- Docs (19/11/2026, suite) : `docs/DSF-BARRE-TITRE-ONGLETS-2026-11-19.md` créé (DSF-SEGMENTES-TITRES et DSF Agenda renvoient vers lui) ; `docs/PROMPT-CLAUDE-CODE-AGENDA-ONGLETS-2026-11-19.md` rédigé (onglets, Agenda, une carte par occurrence). Enchaînement des séances : prompt distinct, non rédigé.

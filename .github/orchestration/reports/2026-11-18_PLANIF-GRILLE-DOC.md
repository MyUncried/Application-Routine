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
- **Ajout EMOM en durée (18/11/2026)** : D-528, RM-265 à RM-268, CE-UI-13 (ch07, ch10, ch13) et `docs/PROMPT-CLAUDE-CODE-EMOM-DUREE-2026-11-18.md`. Compléments d'exécution (effort partiel, sons, Repos sans effet) proposés par Claude, à valider.
- **Ajout coins du chronomètre (18/11/2026)** : D-529, CE-UI-14 et `docs/PROMPT-CLAUDE-CODE-COINS-CHRONOMETRE-2026-11-18.md`. Format « +Tour · n » proposé par Claude, à valider.
- **Ajout annonce des tours (18/11/2026)** : D-530, RM-269, CE-UI-14 (ligne ajoutée) et `docs/PROMPT-CLAUDE-CODE-ANNONCE-TOURS-2026-11-18.md`.
- **Ajout Max (19/11/2026)** : D-531, RM-270 à RM-272, annotations ch13 et `docs/PROMPT-CLAUDE-CODE-MAX-2026-11-19.md`.

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
- Docs : `docs/PROMPT-CLAUDE-CODE-ENCHAINEMENT-SEANCES-2026-11-19.md` rédigé (orchestration au-dessus du moteur, voile de transition ; arrêt volontaire À CLARIFIER).
- Figma : écran « Calendrier — Semaine — Étirements — Actions glissées » (`2094:86`) supprimé, redondant avec « P-Calendrier — Semaine — Actions glissées » (`1992:5962`) ; ch06, ch13 et DSF Navigation annotés. Les matrices datées (07/10 et antérieures) conservent la référence, comme instantanés historiques.
- Figma : écran « Calendrier — Semaine — Après suppression d’une planification » (`2074:86`) supprimé ; les 4 liens de prototype de la modale « Supprimer des occurrences » qui y menaient sont retirés (les boucles de prototype ne sont plus maintenues). ch06, ch13 et DSF Navigation annotés.
- Figma : écran « Calendrier — Semaine — Mardi sélectionné » (`2252:86`) supprimé (comportement déjà spécifié) ; ch06, ch13 et DSF Navigation annotés.
- Figma : écran « Calendrier — Jour suivant — Glissement gauche — MVP » (`2059:267`) supprimé (la vue Jour est remplacée par le Journal, à spécifier) ; ch06, ch13 et DSF Navigation annotés.
- Figma : écran « P-Calendrier — Mois » (`1992:5237`) supprimé ; la Vue d’ensemble n’a plus d’écran de référence (contenu à spécifier) ; ch06, ch13 et DSF Navigation annotés.

## Complément du 19/11/2026 (Journal)

- Figma : écran « Calendrier — Journal — MVP » finalisé (cartes teinte `#EAEAFF`, bouton « Modifier la planification » = composant `DSF / Actions / Édition — carré`, lignes 2 et 3 inversées) ; 4 écrans Jour supprimés (`1992:5602`, `1992:5697`, `1992:5794`, `2128:86`) ; 3 liens de navigation Calendrier redirigés vers « P-Calendrier — Semaine » ; trous de mise en page refermés sur la page.
- Docs : `docs/DSF-JOURNAL-2026-11-19.md` créé ; D-535 (ch07) ; ch06, ch13 et DSF Navigation annotés ; DSF Agenda (§ 6 actions glissées 86 × 54, renvoi au Journal). Classe B ; définition « Actives / Terminées » retenue par Claude (À CLARIFIER : écran de filtre ; déployé du Journal = celui de l’Agenda et du catalogue, décidé par Hermann).
- Non vérifié : rendu visuel (contrôle géométrique seul) ; tests non applicables.
- Journal (suite, 19/11/2026) : ligne 2 = symbole des zones corporelles sans cercle ; ligne 3 = « X à venir, jusqu’au jj/mm/aaaa » ; déployé = phrase de récurrence puis séances (DSF Journal, D-535, prompt mis à jour). Code couleur Journal/Agenda : proposé, non arbitré.

## Complément du 20/11/2026 (modification des occurrences)

- Décision D-536 (ch07) : figement des occurrences commencées, application des modifications de routine aux occurrences non commencées, protection par groupe (date et heure ; séances ; rappel), modification d'une occurrence seule dans l'Agenda, bouton « Rattraper ». DSF Journal § 5, DSF Agenda § 8, `docs/PROMPT-CLAUDE-CODE-MODIFICATION-OCCURRENCES-2026-11-20.md`. Classe B.
- Précisé le 20/11/2026 : une séance ajoutée à la main se retire, les séances de la routine se désactivent ; créneaux non concernés grisés (règle de rendu, sans écran).
- Non fait : modale de choix et état rouge « Rattraper » (Figma) ; stockage de la date réelle d'exécution à confirmer dans le code.
- Non vérifié : tests non applicables (documentation).

## Complément du 20/11/2026 (suppression, photos du catalogue)

- Décision D-537 (ch07) ; ch03 et ch13 annotés (dialogue à trois choix remplacé) ; DSF Journal § 6, DSF Agenda § 8. Classe B ; titre des dialogues du Journal retenu par Claude.
- Figma : dialogues « Supprimer des occurrences » et « Supprimer une planification unique » passés au format titre seul (doublon à supprimer, à arbitrer) ; deux écrans créés pour le Journal ; variantes « Titre seul » et « Titre et message » ajoutées à `DSF / Overlays / Confirmation` ; bouton « Rattraper » sur les cartes rouges ; 38 photos de la carte de séance du catalogue ramenées à l’aplat du composant.
- Non fait : fenêtres de choix « Cette occurrence seulement / Toute la routine » et de confirmation de modification globale (textes non fournis).
- Non vérifié : rendu visuel (contrôle géométrique seul) ; tests non applicables.
- Figma (20/11/2026, suite) : doublon « P-Modal — Supprimer une planification unique — Calendrier » supprimé ; bouton crayon « Modifier la planification » retiré des cartes du Journal ; DSF Journal, D-535, D-537 et prompts mis à jour (l'ouverture de la routine passe par le cadre de gauche, à confirmer dans le code).
- Précisé le 20/11/2026 : dans l'Agenda, toute modification ne concerne que l'occurrence (aucun choix « Cette occurrence / Toute la routine ») ; D-536, DSF Agenda § 8 et les deux prompts corrigés (texte d'origine conservé et annoté). Fenêtre de choix non dessinée, sans objet.
- Vocabulaire (20/11/2026) : dans l'interface, « créneau » désigne l'occurrence ; messages : « N créneaux non commencés seront modifiés. », « La routine et ses N créneaux seront supprimés. », « N créneaux non commencés seront modifiés ; La routine sera archivée. » (D-536, D-537, DSF Journal, prompts, deux écrans Figma du Journal).

## Complément du 20/11/2026 (Agenda — zone de contexte)

- Décision D-538 (ch07) ; DSF Agenda § 2 réécrit (§ 3 renvoie au § 2) ; D-533 et ch13 annotés ; texte d'origine conservé entre crochets. Classe B (rendu) ; prompt `docs/PROMPT-CLAUDE-CODE-AGENDA-ZONE-CONTEXTE-2026-11-20.md`.
- Figma : écran « P-Calendrier — Semaine — Carrousel dans la zone de contexte (proposition) » (`12765:24572`) validé par Hermann (deux lignes : « Aujourd'hui » + mois centré entre doubles flèches ; flèches de semaine, sept cartes 36 × 46, « Planifier » 34 × 34). Composant `icon/aujourd'hui` (jeu à deux variantes : Jour courant gris, Autre jour bleu) créé ; « + » de `icon/planifier` recentré dans le composant.
- Non fait : les écrans Semaine d'origine (dont `1992:5101`) et l'écran Journal n'ont pas été redessinés ; « Planifier » 32 → 34 reste à aligner sur ces écrans.
- À CLARIFIER : libellé du mois sur une semaine à cheval sur deux mois ; balayage.
- Non vérifié : rendu visuel côté Claude (contrôle géométrique, puis capture de Hermann sur la version intermédiaire) ; tests non applicables.

## Complément du 20/11/2026 (Agenda — filtre par routine)

- Décision D-539 (ch07) ; DSF Agenda § 9 et § 2 (icône sur la ligne 1) ; ch13 annoté ; prompt `docs/PROMPT-CLAUDE-CODE-AGENDA-FILTRE-ROUTINE-2026-11-20.md`. Classe B (rendu) ; classe C pour le contenu de la liste (routines archivées comprises, ordre alphabétique) et la définition du compteur, retenus par Claude.
- Figma : composant `icon/filtre-routine` (Inactif / Actif) et `icon/aujourd’hui`, rangés dans le cadre « Icônes — Agenda » à gauche de l'écran carrousel ; icône entonnoir ajoutée à l'écran carrousel ; deux écrans créés (« … — Choix de la routine (proposition) », « … — Vue filtrée (proposition) », sous les autres écrans du prototype). Quatre tranches d'export (« Slice 1 ») supprimées des écrans Semaine.
- Correction : le composant `icon/aujourd’hui` n'était rattaché à aucune page lors de sa création ; il est maintenant dans le cadre « Icônes — Agenda ».
- Non fait : écrans Semaine d'origine et Journal non redessinés ; ordre de la liste et compteur à confirmer par Hermann.
- Non vérifié : rendu visuel (contrôle géométrique seul) ; tests non applicables.

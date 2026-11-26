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
- Précisé le 20/11/2026 : la fenêtre de choix devient une modale simplifiée du Journal (cartes réduites au nom et à « X à venir, jusqu'au… », sélecteur à cocher, sélection multiple, barre de séparation et bouton « Filtrer N routines ») ; pastille « N routines ✕ » ; D-539, DSF Agenda § 9 et prompt mis à jour. Écrans Figma « Choix de la routine » et « Vue filtrée » redessinés.
- Précisé le 20/11/2026 : la vue filtrée garde la zone de contexte inchangée (pas de pastille ni de compteur) ; l'icône entonnoir devient pleine et bleue quand le filtre est actif ; la liste ne montre que les créneaux des routines choisies pour la semaine affichée. Bouton « Afficher toutes les routines » sans sélection et durée du filtre retenus par Claude. D-539, DSF Agenda § 9 et prompt mis à jour (texte précédent sur la pastille et le compteur remplacé). Écran Figma « Vue filtrée » refait.
- Précisé le 20/11/2026 : la modale « Filtrer par routine » affiche la zone de contexte du Journal sans « Planifier » (compteurs, recherche, filtre, tri) ; DSF Agenda § 9, D-539 et prompt mis à jour ; écran Figma « Choix de la routine » complété.
- Précisé le 20/11/2026 : modale du filtre sans compteurs ni trait de séparation en bas ; fond de la zone de contexte du Journal depuis le haut de la modale, en-tête posé dessus. DSF Agenda § 9, D-539 et prompt corrigés ; écran Figma « Choix de la routine » mis à jour.
- Précisé le 20/11/2026 : dans la modale du filtre, boutons de filtre et de tri alignés à droite, champ de recherche élargi.
- Précisé le 20/11/2026 : modale du filtre sans halo blanc ni fond blanc de l’en-tête ; bouton « Filtrer N routines » à la position standard des boutons primaires (y = 802, 354 de large). Aucune règle modifiée.
- Figma (20/11/2026) : écrans « Choix de la routine » et « Vue filtrée » replacés à droite de l'écran carrousel (les deux modales du Journal décalées d'autant) ; écrans « P-Suivi — Séances — Liste condensée » (`1992:8843`) et « Suivi — Séances — Vue déployée » (`1992:8996`) supprimés de la page Prototype MVP (historique présenté dans l'Agenda). Les copies de ces écrans des pages « Suivi » et « Conception — Hors MVP » sont conservées. Annotés : ch06, ch13, DSF Navigation ; les matrices et rapports datés (septembre-octobre 2026) restent inchangés (instantanés). Classe B.
- Non vérifié : rendu visuel ; tests non applicables.
- Livraison du 20/11/2026 : deux prompts à appliquer dans l'ordre (zone de contexte D-538, puis filtre par routine D-539) ; le premier réserve l'emplacement de l'icône du second. Documentation relue : DSF Agenda § 2 et § 9, ch07 (D-538, D-539), ch13 à jour.

## Complément 20/11/2026 — déploiement de la zone de contexte (D-538) et décisions de Hermann
- Décisions (classe B) : libellé du mois = mois comptant le plus de jours de la semaine affichée (règle ISO 8601 du jeudi appliquée au mois) ; balayage de la rangée des jours = changement de semaine, à valider à l'usage ; déploiement sur tous les écrans.
- Figma : zone de contexte (Aujourd'hui, mois, flèches, sept jours, filtre, Planifier 34×34) copiée sur les quatre écrans Semaine (déployé, actions glissées, séance déployée, modale de suppression) ; liste remontée à y=111 ; Planifier 34×34 à (352,149) sur le Journal et ses deux modales de suppression. Aucune interaction de prototype perdue (aucune réaction dans les éléments remplacés). Vérification géométrique uniquement (positions identiques à l'écran de référence) ; aucun rendu vu.
- Documents : DSF Agenda (À clarifier remplacé, original conservé entre crochets), D-538 du registre, prompt zone de contexte.
- Non traité, à arbitrer : fonds périmés des deux anciennes modales (Jour) — non modifiées.
- Tests : non applicables (documentation et maquettes).

## Complément 20/11/2026 (suite) — jetons de texte des cartes du calendrier et de la planification
- Décision de Hermann (classe B, rendu) : nom de la routine et lignes dessous prennent les tailles des cartes des catalogues (nom Inter Semi Bold 15, lignes Inter Regular 12), avec un jeton chacun : `KODJO / DSF / Card name` (créé) et `KODJO / DSF / Card metadata` (existant).
- Figma : appliqués aux 68 cartes « Ligne d’agenda » et « Ligne — Routine » de la page Prototype MVP (68 noms, 272 lignes), modales de suppression et de sélection comprises ; plus aucun texte 16 Semi Bold ni 13 Regular dans ces cartes. Positions inchangées ; vérification géométrique uniquement, aucun rendu vu.
- Icônes Agenda déplacées dans la planche DSF « Icônes — navigation et catégorie » ; fiche « Planifier et aujourd’hui » alignée sur les boutons 34×34.
- Non traité : les noms des cartes de catalogue utilisent encore le style générique « Texte / Inter Semi Bold 15 » et non le nouveau jeton (aucun écart visuel).
- Tests : non applicables.

## Complément 20/11/2026 (suite 2) — comportement du filtre par routine (D-539, classe B)
- Décision de Hermann : toucher l'icône bleue désactive le filtre sans ouvrir la modale ; la modale s'ouvre toujours vide ; bouton désactivé tant qu'aucune routine n'est cochée ; « Afficher toutes les routines » supprimé.
- Documents : DSF Agenda § 9, D-539 (registre), prompt du filtre (formulations remplacées conservées entre crochets). Figma : aucun changement (la modale montre déjà l'état avec sélection ; l'état désactivé est celui du bouton primaire du DSF).
- Tests : non applicables.

## Complément 20/11/2026 (suite 3) [rendu de l’expiré remplacé : cadre rouge conservé et étiquette rouge « Expirée » à la place du bouton, décision de Hermann] — cycle de vie d'une routine (D-540, classe B)
- Décisions de Hermann : créneau manqué rattrapable jusqu'au créneau suivant, sinon 10 jours ; ensuite « expiré » ; routine active/terminée calculée ; plus d'archivage de routine ; filtre « Terminées » ; durée sans réglage de profil. Retenus par Claude (classe C) : état expiré non modifié par la routine et supprimé avec elle, libellé du message de suppression.
- Documents : registre (D-540, D-537 et D-539 annotés), DSF Journal § 2 et § 6, DSF Agenda § 10, prompt `PROMPT-CLAUDE-CODE-CYCLE-VIE-ROUTINE-2026-11-20.md`.
- Figma : message de la modale de suppression avec historique remplacé (écran renommé « Supprimer une routine avec historique ») ; écran « P-Calendrier — Semaine — Créneau expiré (proposition) » créé (cadre gris clair, nom en gris secondaire, sans bouton). Aucune action glissée « Archiver » n'existe sur les écrans Journal. Vérification géométrique uniquement.
- Non traité : prompt de suppression d'origine non réécrit (remplacé par le nouveau prompt).
- Tests : non applicables.

## Complément 20/11/2026 (suite 5) — Calendrier à deux onglets (D-542, classe B) : le troisième onglet est retiré de 13 écrans ; Journal et Agenda centrés ; vue Plan conservée comme analyse (3 écrans, 3 onglets) ; DSF Plan et prompt Plan marqués suspendus ; D-541 annoté. Vérification géométrique uniquement, tests non applicables.

## Complément 20/11/2026 (suite 4) — troisième onglet « Plan » (D-541, classe B)
- Décision de Hermann : le troisième onglet s'appelle « Plan » et présente une grille d'une semaine (routines en lignes, jours en colonnes) dans le centre de l'écran ; pas de vue mois ni quinze jours. Retenus par Claude (classe C) : routines affichées, filtre commun avec l'Agenda, toucher une case.
- Figma : onglet renommé sur les 15 écrans du calendrier ; écrans « Grille du mois (proposition) » (à supprimer, non validé) et « Routines et jours (proposition) » dessinés. Vérification géométrique uniquement.
- Documents : D-541, D-532 annoté, DSF Barre de titre, nouveau DSF Plan, prompt `PROMPT-CLAUDE-CODE-PLAN-2026-11-20.md`.
- À clarifier : plusieurs créneaux d'une même routine le même jour.
- Tests : non applicables.

## Complément — Catalogue officiel (CPT-23), 20/11/2026

- **Classe B** (décision explicite de Hermann : « le compte Kodjo »). Le catalogue de base des Mouvements est publié sur un compte KODJO comme Bibliothèque publique (CPT-22), téléchargé après la première connexion, non livré dans le paquet de l'application. Les 60 fiches actuelles sont un jeu de test.
- **Source normative absente de cette branche** : le chapitre 07 de la section « Gestion de compte » n'existe que sur la PR #446 (`claude/blissful-meitner-iauzaf`). Pas de fusion. Patch préparé : `_bmad-output/compte/integration-documentaire-CPT-23.patch` (ajoute la ligne CPT-23 après CPT-22).
- **Vérification** : `git apply --cached --check` sur un index temporaire de la branche de la PR #446 : applicable.
- **Statut : préparé, non appliqué.** À appliquer sur la branche de la PR #446. Le plan du lot Compte (`_bmad-output/compte/plan-lot-compte.md`, même PR) doit aussi mentionner l'envoi du catalogue officiel comme suite de T6.
- Aucun test applicable (documentation).

## Complément 23/11/2026 — Programmes : période, routines, rattachement (D-560 à D-562, classe B)
- Décisions explicites de Hermann (conversation du 23/11/2026). Figma : « PROG — 13 Créer ou configurer un programme » (période : ligne « N jours, soit S semaines » ; routines au format Journal ; halo sous Annuler), « P-Planifier une séance — Choix du programme (proposition) » (modale « Rattacher un programme », sans Valider, radios), halo rétabli dans « Modal — Planifier une séance — Sélectionner une séance ».
- Documents : `docs/DSF-PROGRAMMES-2026-11-23.md` (nouveau) ; registre ch07 D-560, D-561, D-562 ; D-332 annoté ; ch04 « Ce qui reste à concevoir » annoté. Prompts : `docs/PROMPT-CLAUDE-CODE-PROGRAMME-{PERIODE,ROUTINES,SELECTION}-2026-11-23.md`.
- Mode « pendant » de la période : spécifié, non dessiné dans Figma.
- Le code ne contient pas encore l'objet Programme : les prompts demandent de ne pas l'inventer.
- Tests : non applicables.

## Complément 23/11/2026 (suite) — Nom des routines unique parmi les actives (D-563, classe B)
- Décision explicite de Hermann : unicité du nom parmi les routines actives (suffixe « (2) » proposé à la création, modifiable ; routine terminée garde son nom ; contrôle à la réactivation par extension de période ou ajout de créneaux ; séances inchangées). Remplace le « non unique » de D-553 (branche `docs/agenda-seances-journal-filtre-20261121`) et rétablit RM-258 / RM-261 / D-522 pour les routines actives.
- Appliqué sur cette branche : registre ch07 D-563 ; DSF Journal § 6 bis.
- **Préparé, non appliqué** (source normative sur la branche Agenda, non fusionnée) : `_bmad-output/compte/integration-documentaire-D-563-branche-agenda.patch` — document Agenda (§ 1, § 2), registre (D-522, D-553, note RM), ch04, ch10 (RM-258, RM-261, complément 21/11), ch13 ; `git apply --cached --check` sur un index temporaire de la branche Agenda : applicable (5 fichiers).
- Renumérotation antérieure : décisions Programmes D-560 à D-562 (collision avec D-543 à D-552 de main).
- Tests : non applicables.
- Prompt Claude Code : `docs/PROMPT-CLAUDE-CODE-NOM-ROUTINE-UNIQUE-2026-11-23.md`.

## Complément 24/11/2026 — Carte de séance du catalogue : mosaïque et informations (D-564, D-565, classe B)
- Décisions explicites de Hermann (conversation du 24/11/2026) : mosaïque des images des mouvements (disposition fixée par le nombre d'images, 5 et plus en « 4 + compteur », vue retenue = la plus à droite, ou la plus large s'il y en a trois ; rectangle stocké par image, détecté à la publication puis vérifié ; vue utilisée entière, sinon bords réduits autour du centre) ; informations de la carte repliée = nom, mouvements, formats, durée.
- Figma : planche « Visuel de séance — essais de mosaïque (1 à 6 images) » et écran d'essai « P-Catalogue des séances — Visuel en mosaïque et informations (essai) » (cartes détachées, composant `DSF / Cards / Séance` non modifié).
- Documents : `docs/DSF-CARTE-SEANCE-VISUEL-INFOS-2026-11-24.md` (nouveau) ; registre ch07 D-564, D-565 ; note de révision en tête de `docs/KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md`. Prompt : `docs/PROMPT-CLAUDE-CODE-CARTE-SEANCE-MOSAIQUE-2026-11-24.md`.
- Non traité : composition (points 3 à 6 de la liste de Hermann), composant Figma à mettre à jour, carte déployée inchangée.
- Constat : sur les 60 illustrations du 17/11/2026 (branche `assets/illustrations-60-20261117`, 1206 × 987), environ 54 sont composées de plusieurs vues et 6 sont simples ; détection stricte des séparations sur 44, assouplie sur 8 autres avec fausses séparations possibles. Hypothèse non démontrée : la fiabilité d'une détection assouplie.
- Vérification sur iPhone à faire : lisibilité des mosaïques à 64 pt. Essai de rendu des 60 illustrations livré à Hermann le 24/11/2026 (43 à deux vues, 10 à trois, 7 simples ; correction du 24/11 : `FIT-STR-003`, `FIT-PIL-006`, `REED-005`, `REED-007` sont des mises en page « deux en haut, une large en bas ») et jugé « très correct » ; coupes de têtes ou de jambes possibles dans les cases carrées, acceptées. À confirmer sur iPhone avec les vraies cartes.
- Tests : non applicables.

## Complément 24/11/2026 — Icônes et teintes des états de l'Agenda (D-566, classe B)
- Décision explicite de Hermann (conversation du 24/11/2026) : icône ronde 28 pt par état (option 2), cadre bleu pour Démarrer, rouge pour en retard et arrêtée, vert complétée, orange partielle, gris supprimée ; Rattraper porte le même triangle bleu que Démarrer.
- Figma : écran d'essai « P-Calendrier — Semaine — Icônes d'état (essai) » et légende des deux options ; composants et écrans de production non modifiés (légende alignée : triangle bleu pour Rattraper).
- Documents : `docs/DSF-AGENDA-PLANNING-2026-11-19.md` (teinte du cadre, pastille d'action, annotées) ; registre ch07 D-566.
- Non traité : propagation à l'écran Agenda de production, aux chapitres 09/10 et aux prompts Agenda ; anneau « Partielle » : décidé fixe (pas de progression réelle) ; légende Figma passée en triangle bleu pour Rattraper. Relief au repos et état appuyé réservés à Démarrer et Rattraper (colonne « Appuyé » ajoutée à la légende) ; icônes d'état à plat.
- Vérification sur iPhone à faire : lisibilité des icônes de 28 pt et contraste des cadres.
- Tests : non applicables.
- Figma (24/11/2026, suite) : icônes et teintes d'état propagées à 15 écrans Agenda (57 lignes ; « Expirée » inchangée) ; carte d'essai du catalogue : bouton Démarrer en icône à relief, durée déplacée en ligne 3 (suivie des formats). Composant `DSF / Cards / Séance — catalogue` non modifié ; carte déployée non traitée. Documents : `docs/DSF-CARTE-SEANCE-VISUEL-INFOS-2026-11-24.md` § 2. Tests : non applicables.
- Prompt Claude Code : `docs/PROMPT-CLAUDE-CODE-AGENDA-ICONES-ETAT-2026-11-24.md` ; prompt de la carte de séance mis à jour (durée en ligne 3, bouton Démarrer en icône) ; DSF Agenda : « Rattrapable » et « Expiré » précisés. Prompts Agenda du 20/11 inchangés (règles d'état toujours valables, présentation remplacée par D-566).
- Ajout de l'état Expirée (icône horloge, disque gris, à plat) : légende et écran d'essai Figma, écran « Créneau expiré (proposition) », D-566, DSF Agenda, prompt Agenda. Remplace la mention « Expirée inchangée » des compléments précédents. Tests : non applicables.

## Complément 25/11/2026 — Composant de carte de séance du catalogue et modales de sélection (D-567, classe B)
- Décision explicite de Hermann (24–25/11/2026) : carte repliée à trois lignes sans chevron, toucher la carte = composition en modale, variante de sélection sans Démarrer pour les modales de sélection ; Conception — Hors MVP non touché (remplacement global ultérieur).
- Figma : 30 cartes `DSF / Cards / Séance` (Catalogue, Replié) remplacées par `DSF / Cards / Séance — catalogue` dans 9 écrans catalogue du prototype et dans la modale « Planifier une séance — Sélectionner une séance » (variante `État=Sélection`, sans Démarrer) ; réactions de prototype recopiées ; contenus fictifs repris des cartes d'essai.
- Documents : `docs/DSF-CARTE-SEANCE-VISUEL-INFOS-2026-11-24.md` (§§ 2, 2 bis, 4) ; registre ch07 D-567 (D-565 précisé) ; ch13 (CE-T03-01 : cibles de toucher et tests) et ch10 (chevron) annotés ; `docs/DSF-CARTES-ICONES-APPUIS-2026-09-30.md` et `docs/KODJO-Catalogues-cartes-modales-2026-11-06.md` précisés ; note de révision de la spec carte/catalogue ; prompt `docs/PROMPT-CLAUDE-CODE-CARTE-SEANCE-MOSAIQUE-2026-11-24.md`.
- Non traité : cartes Archivé et Déployé de l'ancien composant et contextes Calendrier, Suivi, Choix calendrier/planification et Choix multiple ; modales de composition (création et modification), non validées : leur description est hors de ce lot ; règle de brouillon CE-T03-08 (« Continuer » obsolète à la création) à corriger avec ce lot.
- Dépendance ajoutée (consigne de Hermann, 25/11/2026) : le marquage des photos (rectangle de la vue retenue par image) est un prérequis de la mosaïque ; DSF carte et prompt mis à jour.
- Vérification sur iPhone à faire : lisibilité des trois lignes et des mosaïques à 64 pt, relief de Démarrer, ouverture de la modale, modale de sélection.
- Tests : non applicables.

## Complément 25/11/2026 (suite) — Tabata : séquence d'ouverture et modale allégée (D-568, classe B)
- Décision explicite de Hermann (25/11/2026, captures iPhone) : à l'ouverture du format Tabata, l'écran de choix des mouvements apparaît en premier (changement de séquence, aucun nouvel écran) ; la modale « Paramètres d'exécution » d'un exercice du Tabata ne garde que Charge et De chaque côté ; son intégration sera revue ultérieurement.
- Figma : « Tabata — Modale exercice, standard » et « en alternance » : modale allégée à deux lignes, hauteur de feuille adaptée. Écrans « Conception — Hors MVP » non touchés.
- Documents : registre ch07 D-568 ; `docs/KODJO-Formats-entrainement-2026-11-02.md` § 9.6 ; prompt `docs/PROMPT-CLAUDE-CODE-FORMATS-SEQUENCE-PARAMETRES-2026-11-25.md (renommé et généralisé, voir complément suivant)`.
- Non traité : autres formats (séquence et modale) ; libellé du lien du haut de l'écran de choix des mouvements (« Revenir aux paramètres » ne convient plus à la première ouverture).
- Vérification sur iPhone à faire : ouverture du Tabata sur le choix des mouvements, modale à deux lignes.
- Tests : non applicables.

## Complément 25/11/2026 (suite 2) — Modale d'exercice selon le contexte, tous formats (D-569, classe B)
- Décision explicite de Hermann (25/11/2026) : la modale d'un exercice déjà dans la séance n'affiche que les champs utiles dans son contexte ; un exercice déplacé hors du circuit prend les champs d'un exercice libre ; déploiement aux autres formats ; lien du haut « Paramètres » ; sens inverse (exercice libre entrant dans un format : valeurs conservées, masquées) validé ; liste des champs par format validée (« ok »).
- Figma : 13 écrans allégés (30/30 ; EMOM standard, en alternance, dans chaque intervalle ; AMRAP circuit, buy-in, simple à l'échec, durée à l'échec ; Death by standard et dans chaque intervalle ; For time standard, circuit, buy-in ou buy-out), hauteur de feuille adaptée, contrôle par captures (30/30, EMOM standard, For time circuit). « Conception — Hors MVP » non touché. Libellé « Revenir aux paramètres » : absent de Figma, aucune modification.
- Écart à la liste annoncée : For time conserve la ligne Séries, car son tableau porte les répétitions et pauses (sans elle, la cible de répétitions n'est plus réglable) ; Pause, durée maximum et Récupération retirées.
- Séquence d'ouverture : d'abord comprise comme limitée aux six formats à départ rapide ; [Remplacé le 25/11/2026 : Hermann précise « tous les formats sans exception » — Tabata, 30/30, Renforcement, Progression, À l'échec, Superset, EMOM, AMRAP, Death by, For time].
- Documents : registre ch07 D-569 (D-568 précisé) ; `docs/KODJO-Formats-entrainement-2026-11-02.md` § 9.7 (§ 9.6 annoté) ; prompt `docs/PROMPT-CLAUDE-CODE-FORMATS-SEQUENCE-PARAMETRES-2026-11-25.md`.
- Non traité : modales dédiées de Renforcement, Progression, À l'échec, Superset (inexistantes dans le prototype ; règle documentée) ; modales de composition (création, modification), non validées ; intégration de la modale à revoir ultérieurement.
- Vérification sur iPhone à faire : première ouverture sur le choix des mouvements, lien « Paramètres », champs de chaque modale, sortie et retour d'un exercice hors du format.
- Tests : non applicables.

## Complément 25/11/2026 (suite 3) — Séquence d'ouverture, tous les formats (D-569, classe B)
- Décision explicite de Hermann (25/11/2026) : séquence d'ouverture (choix des mouvements en premier, lien « Paramètres ») applicable à tous les formats sans exception.
- Documents : registre ch07 D-569 ; Formats § 9.7 ; prompt `docs/PROMPT-CLAUDE-CODE-FORMATS-SEQUENCE-PARAMETRES-2026-11-25.md`. Figma : aucun écran concerné (aucun écran ne relie les questionnaires aux catalogues de format à l'ouverture).
- Vérification sur iPhone à faire : première ouverture de chacun des dix formats.
- Tests : non applicables.

## Complément 25/11/2026 (suite 4) — Recouvrement de la modale des formats (D-570, classe B)
- Décision explicite de Hermann (25/11/2026) : à l'ouverture d'un format, sa modale recouvre totalement la modale des formats.
- Figma : aucune modification ; lecture seule, les écrans recouvrent déjà (fenêtre des formats 103–850 pt, modale du questionnaire 95–866 pt). Cause côté application non investiguée (code absent de ce dépôt).
- Documents : registre ch07 D-570 ; Formats § 9.7 ; prompt `docs/PROMPT-CLAUDE-CODE-FORMATS-SEQUENCE-PARAMETRES-2026-11-25.md` (point 4).
- Vérification sur iPhone à faire : recouvrement total à l'ouverture de chacun des dix formats, à la fermeture et au retour.
- Tests : non applicables.

## Complément 25/11/2026 (suite 5) — Récapitulatifs restés à l'ancien ordre (classe A)
- Constat (Hermann, 25/11/2026) : sur « AMRAP — Récapitulatif, suppression glissée » et « …buy-in et incrément », la section Mouvements était en haut, au-dessus des paramètres. Les autres récapitulatifs (ordre : Paramètres d'exécution puis tableau des mouvements, registre du 07/11/2026 et Formats § 9.5) étaient déjà à jour ; ces écrans n'avaient pas été repris. Non causé par les travaux du 25/11.
- Décision de Hermann : option A — reconstruction sur la mise en page de « AMRAP — Récapitulatif », état propre de chaque écran conservé.
- Figma (Prototype MVP, 10 écrans) : AMRAP buy-in et incrément ; AMRAP suppression glissée (glissement porté par la ligne du tableau) ; AMRAP saisie de l'objectif au clavier (répétitions et durée) et saisie d'un incrément négatif ; Progression clavier étapes 1, 2 et 3 et ajout d'une charge ; P-Tabata fiche du mouvement (récapitulatif en alternance sous la fiche). Écrans « (archive) » et page « Profil » non touchés ; « Conception — Hors MVP » non touché.
- Choix de représentation (à valider sur iPhone) : paramètres AMRAP complets (Durée, Nombre d'AMRAP, Repos) sur les écrans qui n'affichaient que la Durée ; section sans buy-in intitulée « Mouvements » (Formats § 7.4) ; Progression : étiquette « (unité, ± kg) » sous le nom, charges « (10 kg) » sous les valeurs, case vide en rouge, case active en bleu clair.
- Documents : aucun (classe A, règle déjà écrite).
- Vérification sur iPhone à faire : glissement de suppression sur une ligne du tableau AMRAP, saisie au clavier AMRAP et Progression.
- Tests : non applicables.

## Complément 25/11/2026 (suite 6) — Appui sur la carte, exercice libre, écran des formats (D-571, classe B)
- Décisions explicites de Hermann (25/11/2026) : l'appui sur la carte d'un Exercice ouvre la page unique du format (plus de distinction questionnaire/récapitulatif) ; déplacer, dupliquer et supprimer restent sur la carte ; exercice libre en modale de type format ; écran des formats : sous-titre retiré, carte Libre de même taille avec logo en cadre pointillé, titre centré.
- Figma (Prototype MVP) : écran des formats `9977:19613` ; modale libre `13242:26255` ; chevauchements corrigés (écran libre, AMRAP plusieurs, composant, mosaïque DSF) ; chevauchements restants volontaires : voile sur « Confirmer la suppression » du catalogue ; pages Démonstrations et Hors MVP intactes.
- Documents : registre ch07 D-571 (annotation de la ligne « Constat c ») ; Formats § 9.8 ; docs 08 et 10 et PRODUCT annotés ; prompt `docs/PROMPT-CLAUDE-CODE-FORMATS-SEQUENCE-PARAMETRES-2026-11-25.md` réécrit.
- Non traité : place de Charge et De chaque côté dans la page du format (aucun écran, signalée À CLARIFIER dans le prompt) ; doc 13 (contrats d'écran) non revue ; modales de composition non validées.
- Vérification sur iPhone à faire : appui sur carte, actions de la carte, modale libre, écran des formats.
- Tests : non applicables.

## Complément 25/11/2026 (suite 7) — Recette iPhone : réglages d'exercice par format (D-572, classe B ; corrections de conformité classe A)
- Décisions explicites de Hermann (25/11/2026) : réglages par format, nombre de cycles, intervalles EMOM, condition d'arrêt AMRAP/For time, catalogue en modification, nom Superset / Tri-set / Giant set.
- Documents : registre ch07 D-572 ; Formats § 9.9 (§ 9.4 annoté) ; prompt `docs/PROMPT-CLAUDE-CODE-FORMATS-RECETTE-2026-11-25.md`. Figma : aucun écran modifié.
- Non traité : écrans Figma correspondants (aucun dessiné), Giant set à 5 mouvements (appliqué « 4 et plus »), doc 13 non revue.
- Vérification sur iPhone à faire : chaque point du prompt.
- Tests : non applicables.

## Complément 25/11/2026 (suite 8) — Modale d'exercice conservée (D-571 point 1 non retenu, classe B)
- Décision de Hermann (25/11/2026) : la faisabilité d'une page unique intégrant les réglages d'exercice n'est pas établie ; des modales allégées, au format commun avec l'exercice libre, constituent déjà une amélioration.
- Documents : registre ch07 D-571 (point 1) et D-572 (point 9), annotations de la ligne « Constat c » et des documents 08 et 10 ; Formats §§ 9.8 et 9.9 ; deux prompts ajustés.
- Tests : non applicables.

## Complément 26/11/2026 (suite 9) — Navigation, titre des modales, HIIT, écran des formats, phases (D-573, classe B)
- Décisions explicites de Hermann (25-26/11/2026) : appui sur la carte = modale allégée, appui sur la ligne « N tours alternés / groupés » = page globale du format ; titre de modale = nom du mouvement ; format HIIT ; ordre et sous-titres des formats ; règle des phases. Exercice hors circuit sans page : formulé par Claude ; aucun indice visuel ajouté, à juger au test.
- Figma (Prototype MVP) : 47 titres de modales (composant d'en-tête et instances) ; 2 écrans HIIT conservés (Récapitulatif, Modale exercice ; valeurs 40 s / 20 s, 12 min) ; modales HIIT, 30/30 et Tabata (×2) complétées : Cadence et Objectif de répétitions facultatif (D-572) ; écran des formats (HIIT, ordre, sous-titres) ; modale libre finalisée.
- Documents : registre ch07 D-573 (D-571 point 1, D-572 point 9, Constat c annotés) ; Formats § 9.10 (§ 9.8 annoté) ; docs 08, 10 et PRODUCT annotés ; deux prompts mis à jour.
- Complément 26/11 (D-573 points 7 à 9) : présentation des modales de paramètres (en-tête sans trait, zone colorée, titre), regroupement des lignes Tabata/30-30/HIIT, lignes AMRAP (Rôle, objectif par tour grisé en « À l'échec »). Figma : 46 modales ; fond = composition de la séance.
- Non traité : intervalle partagé à ajouter dans la modale « Dans chaque intervalle » (Figma) ; application de la règle des phases aux autres écrans « Création activité — Paramètres » ; écran « Séance » HIIT ; doc 13 non revue.
- Vérification sur iPhone à faire : parcours carte → page → modale et retours ; titre tronqué ; HIIT ; écran des formats.
- Tests : non applicables.

## Complément 26/11/2026 (suite 10) — Fermeture de la modale des paramètres (D-574, classe B)
- Décision explicite de Hermann : la poignée (barre au-dessus du titre) est retirée des 47 modales « Paramètres d'exécution » (Figma) ; fermeture par la croix ou la coche ; glissé vers le bas désactivé.
- Documents : registre ch07 D-574 ; Formats § 9.10 ; prompt de recette (point général 4 bis).
- Non traité : les 22 autres modales conservent la poignée dans Figma (geste non revu).
- Vérification sur iPhone à faire : aucun glissé ne ferme la modale.
- Tests : non applicables.

## Complément 26/11/2026 (suite 11) — Pages Tabata/30-30/HIIT/Renforcement et modale du Renforcement (D-575, classe B)
- Décisions explicites de Hermann (Figma, 26/11/2026) ; registre ch07 D-575 ; Formats § 9.10 ; prompt de recette (point 4 ter).
- Figma : 5 pages Récapitulatif modifiées ; écran « Renforcement — Modale exercice » créé (aucune modale Renforcement n'existait) ; ligne Pause ajoutée par moi pour porter la colonne Pause.
- À arbitrer : « Nombre de séries » global de la page Renforcement conservé en plus du nombre par mouvement ; Superset et Progression sans modale.
- Vérification sur iPhone à faire : lecture de la charge sous l'intervalle.
- Tests : non applicables.
- Complément (suite 11 bis) : première colonne « Séries » du Renforcement, ligne globale « Nombre de séries » supprimée, charge sous Départ (3 pages Death by), dernière colonne des tableaux alignée à droite (Tabata, 30/30, HIIT, Renforcement, Death by). Non traité : tableaux EMOM, AMRAP, Superset, Progression.
- Complément (suite 12, D-573 point 2) : titre de la modale sur deux lignes au lieu de « … » (composant d'en-tête, Figma) ; Progression : Durée totale après Exécution (Figma). Non traité : durée totale dans la zone de contexte (collision avec l'illustration, en attente d'arbitrage).
- Complément (suite 13, D-575 point 4) : durée totale de la zone de contexte alignée à droite, en noir, devant l'illustration (132 occurrences dans Figma).
- Complément (suite 14, D-575 point 3 bis) : Renforcement, nombre de séries propre à chaque mouvement « À la suite », commun et lié « En alternance » (décision de Hermann, 26/11/2026). Figma inchangé.

## Complément 26/11/2026 (suite 15) — Exécution d'un exercice : permutation des vues et flèches média (D-576, classe B)
- Décisions explicites de Hermann : glissé horizontal = changement de vue (haut et bas) ; boutons ⇄ conservés ; changement de média par flèches gauche/droite ; galerie à plusieurs médias conservée.
- Documents : registre ch07 D-576 (D-203 annoté) ; CONCEPTION-EXECUTION-MEDIA §§ 4-5-6 et critère 4 annotés ; docs 03, 08 et PRODUCT annotés (texte d'origine conservé).
- Figma : boutons ⇄ ajoutés sur « P-Exécution d'un exercice — Démarrée » ; flèches média précédent/suivant ajoutées dans les 12 variantes du composant « Zone d'exécution — retournements » (donc sur les écrans qui l'utilisent). Bouton Réglages (illustration Expo) retiré de 24 écrans.
- Non traité : boutons ⇄ sur les autres écrans d'exécution (déploiement après validation de « Démarrée »).
- Vérification sur iPhone à faire : seuil du glissé, absence de conflit avec le défilement.
- Tests : non applicables.

## Complément 26/11/2026 (suite 16) — Retrait des boutons ⇄ sur tous les écrans d'exécution (D-576, classe B)
- Décision explicite de Hermann : plus aucun symbole ⇄ ; la permutation des vues se fait uniquement par glissé ; les flèches ‹ › de changement de média sont conservées.
- Documents : registre ch07 D-576 point 2 reformulé ; CONCEPTION-EXECUTION-MEDIA § « bouton de changement de face » annoté.
- Figma : 76 boutons ⇄ retirés (variantes du composant « Zone d'exécution — retournements » et écrans) ; vérifié sur 4968:8188 et 4997:6113.
- Vérification sur iPhone à faire : découvrabilité du glissé.
- Tests : non applicables.

## Complément 26/11/2026 (suite 17) — Média plein écran : phase dans le cadre flottant (classe B)
- Décision explicite de Hermann : la phase s'affiche à côté du côté, séparée par un point centré.
- Document : CONCEPTION-EXECUTION-MEDIA § 8 (contenu du cadre flottant).
- Figma : « Côté droit · Contracter » sur « Média plein écran » ; icône de rétrécissement recentrée dans son cercle (correction de conformité, rien à documenter).
- Tests : non applicables.

## Complément 26/11/2026 (suite 18) — Média : bouton d'extension et flèches en plein écran (D-576 point 4, classe B)
- Décisions explicites de Hermann : le média reste à la taille du demi-écran tant que le bouton d'extension n'est pas actionné ; flèches de changement de média présentes en plein écran.
- Documents : registre ch07 D-576 (point 4) et D-203 annoté ; CONCEPTION-EXECUTION-MEDIA § 7.
- Figma : flèches précédent/suivant ajoutées sur « Média plein écran ».
- Vérification sur iPhone à faire : appui sur le média sans effet (seul le bouton d'extension ouvre le plein écran).
- Tests : non applicables.

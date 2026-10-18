# Lot 6 — dossier d'arbitrage groupé (état final de la finalisation, 18/10/2026)

**Nature :** ce dossier rassemble les seules décisions produit encore nécessaires après la finalisation. **Aucune réponse n'y est inventée.** Les passages concernés restent en place, côte à côte, et sont marqués `À CLARIFIER` quand un marqueur existe déjà.

**Ce qui n'y figure plus.** Les contradictions déjà tranchées par une décision explicite ont été corrigées :
- 125 paires sur 204 ;
- 20 règles remplacées encore présentées comme actives ;
- 12 et 4 réserves des vérifications indépendantes ;
- passe résiduelle du 18/10 : 146 rattachements PROBABLE réexaminés, ancien AR-23 (53 CERTAIN repris dans les contrats, 86 non retenus, 7 divergents reportés en AR-22) ; quasi-copies du ch. 06 l. 1777 à 1823 remplacées par un renvoi (RSD-002 à 004) ; références de position des sections déplacées rétablies (STR-201 à 207) ; introduction du ch. 08 (INT-101 à 103).

Voir le [rapport final](finalisation/rapport-final-conformite.md).

**Sources de détail :**
- `finalisation/divergences-etat.tsv` : état des 204 paires ;
- `finalisation/divergences-examen-*.tsv` : citations exactes ;
- `finalisation/verification/*.tsv` ;
- `finalisation/qualite-examen.tsv`, `alias-examen.tsv`, `copies-examen.tsv`, `dsf-examen.tsv` ;
- `finalisation/tracabilite-contrats-*.tsv`, `tracabilite-probables-reexamen.tsv` ;
- `finalisation/residus-examen.tsv`, `verification/structure-2a.tsv`, `structure-2b.tsv`, `fonctionnel-3.tsv`.

## 1. Décisions produit

| ID | Question | Passages en tension (exemples) | Décisions consultées | Paires et sources |
|---|---|---|---|---|
| AR-01 | Quelle est la liste de référence des réglages du Profil (P-15) ? Faut-il y ajouter « Écran maintenu actif », les textes vocaux par défaut et la durée par défaut d'un exercice ? | CE-UI-07 §5 ; ch. 05 Profil ; glossaire ; RM-085 ; ch. 13 tableau Profil | D-240, D-213 (défauts d'exécution seulement) | 1, 2, 8, 27, 28, 62–64, 164 |
| AR-02 | Couleur d'une Séance : couleur propre (palette D-026, RM-016) ou couleur de son Étiquette uniquement ? Une Séance existe-t-elle « dès validation de son nom et de sa couleur » ? | ch. 10 « une Séance existe dès validation… » ; ch. 04 « il n'existe pas de couleur de Séance indépendante de l'Étiquette » ; ch. 09 | D-026, D-188, D-211 ; correction DIV1-009 rejetée faute de décision | 71, 119–122, 146 |
| AR-03 | La création d'une Séance comporte-t-elle une étape Étiquette distincte (ch. 08 « quatre étapes ») ou l'Étiquette est-elle choisie dans la modale intégrée à la Composition (CE-T03-16) ? | ch. 08 Création d'une séance ; ch. 03 ; CE-T03-16 | D-355 (comportement de la modale, pas de l'enchaînement) | 13, 14, 52, 119 |
| AR-04 | Nom d'une Séance dupliquée : saisi par l'utilisateur (ch. 03) ou suffixe automatique « (copie) » (ch. 08, ch. 09, API-SEA-05) ? | ch. 03 ; ch. 08 Duplication ; ch. 09 ; ch. 11 | aucune | 15 |
| AR-05 | Durée du Splash : 2,5 s avec fondu de 0,3 s, ou temps d'initialisation sans durée codée (CE-UI-06) ? | ch. 13, description issue du ch. 06 ; CE-UI-06 | aucune | 61 |
| AR-06 | Feuille Paramètres : les commandes − / + sont-elles permanentes ou révélées par appui sur la valeur ? | ch. 08 « permanentes » ; CE-UI-10 « appui révèle ± » | D-312 (steppers), PRE-4 Q26 (± sans Cellule active, hors registre) | 84 |
| AR-07 | Roulettes de la feuille Paramètres : inline sous la ligne, ou popover (CE-UI-10 §9) ? RM-189 doit-elle exclure CE-UI-10 ? Les sous-lignes restent-elles indentées à x52, ou passent-elles à la grille à cellules du DSF du 12/10 ? | ch. 10 « roulettes inline » ; CE-UI-10 §9 « popover » ; ch. 06 x52 ; RM-189 | D-193, D-377 ; PRE-4 Q12 (porté par la PR #371) ; constat X-09 | 45, 46, 102, 103, 195, 203 |
| AR-08 | Suivi au MVP : la recherche d'une Exécution existe-t-elle, et par quel contrôle, alors que `Trier` est désactivé (D-031, RM-082) ? | ch. 08 Recherche du Suivi ; CE-T03-15 « aucune recherche » | D-031, D-221 (Catalogues seulement) | 136–138 |
| AR-09 | Les Exercices persistants (`ActivityDefinition`) sont-ils possédés directement par l'Utilisateur (ch. 04, contre ch. 09) ? | ch. 04 ; ch. 09 Utilisateur | aucune | 154 |
| AR-10 | Une Séance vide : conservable et modifiable mais non exécutable (ch. 09), ou cette règle vise-t-elle seulement les Séances vidées par une migration (Q32, D-392), RM-017 interdisant d'en enregistrer une ? | ch. 09 ; RM-017 | D-392 | 156 |
| AR-11 | « Toute Exécution référence exactement une source » : faut-il lire « au plus une source persistante, l'instantané étant toujours présent » ? | ch. 09 Cohérence des relations | D-161 | 171, 172 |
| AR-12 | La récupération après exercice est-elle persistée comme objet `recovery`, `postActivityRecoverySeconds` n'étant qu'une projection (ch. 11), ou comme champ obligatoire (ch. 12) ? | ch. 11 ; ch. 12 §12.37 | D-208, D-304, D-307 (comportement, pas le stockage) | 189, 190, 193 |
| AR-13 | Le spike obligatoire D-039 / RT-001 est-il satisfait par le contrôle intégré au premier lot T04 ? | ch. 12 Contraintes T04 « aucun spike séparé » | D-039 | 192 |
| AR-14 | Grille des volumes : unité de la dernière colonne pour un Exercice tout À l'échec, en Durée, en Répétitions ou mixte (X-14) ; cible du renvoi « §9.5 » | ch. 10 ; CE-CIR-03 | aucune | 204 |
| AR-15 | Remplacer la paraphrase du calcul de progression (ch. 10, barre de progression) par un renvoi à RM-077 ? La seule source est la section « Décisions Deux modes — 13/10 », sans D-nnn | ch. 10 Informations affichées | D-241 ; section Deux modes | 182 |
| AR-16 | Cartes de Composition : la sous-carte « Récupération X min Y s » (ch. 12, composant `3572:64`) reste-t-elle prévue, alors que D-238 retire les récupérations des cartes et que D-303 garde une ligne structurelle ? | ch. 12 l. 928 ; ch. 10 « récupérations plus affichées sur les cartes de Composition » | D-238, D-303 | contradictions.tsv |
| AR-17 | Parcours « Répétitions avec cadence » (ch. 03) : la Cadence est-elle limitée au mode Répétitions, alors que le Bip de cadence vaut pour les deux modes (D-308) ? Les deux notions sont distinctes | ch. 03 l. 562 | D-308, D-313, D-268 et suivantes | contradictions.tsv |
| AR-18 | Statut de D-111 au registre : « Validée post-Figma », alors que son texte la dit supersédée le 13/10 par EC-01/02. Faut-il porter la mention « supersédée » dans la colonne Statut ? | ch. 07 D-111 | section Deux modes 13/10 | contradictions.tsv, fonctionnel.tsv |
| AR-19 | RM-099 : le plan applique « Récupération » : s'agit-il de la Pause entre les côtés ? Si oui, l'aligner sur D-208 et RM-211 | ch. 10 RM-099 | D-208 ; correction DIV1-014 rejetée | 23, 39 |
| AR-20 | Le ch. 05 exclut du MVP les « médias multiples fonctionnels » ; D-333 inclut l'import de 0..n médias. Les deux visent-ils la même chose ? | ch. 05 l. 411 | D-333, D-183 ; correction DIV1-015 rejetée | 29 |
| AR-21 | Cas des Routines à plusieurs contenus lors de l'archivage d'une Séance : D-023 ne vaut que pour le contenu unique, et l'extension n'est pas définie (ch. 10, avertissement en tête) | ch. 10, ch. 09 (marqués `À CLARIFIER` par RES-004 à 006) | D-023, D-328 | fonctionnel.tsv |
| AR-22 | Écarts entre contrats et règles relevés par la traçabilité :<br>- CE-UI-09 « Catégorie tap valide/ferme » contre RM-200 ;<br>- CE-T03-15 « aucune Vue d'ensemble » contre RM-082 ;<br>- CE-T03-13 (attente de point d'arrêt exclue) contre RM-073 ;<br>- CE-T03-14 (retour au contexte appelant) contre RM-080 ;<br>- RM-024 et RM-108 visant l'écran Catégories supprimé (CE-T03-01, CE-T03-08) ;<br>- CE-UI-10 « ± au toucher » contre RM-131 (steppers permanents ; voir AR-06 et PR #370) ;<br>- CE-UI-03 : exception de 32 pour Aujourd'hui/Planifier au minimum tactile de 44 de RM-095 | contrats et règles cités | D-343 (pour CE-UI-09) ; aucune pour les autres (RM-191 va dans le sens de CE-T03-13, RM-103 dans celui de CE-T03-14) | tracabilite-contrats-*.tsv ; tracabilite-probables-reexamen.tsv (7 DIVERGENT) |
| AR-24 | Décisions PRE-4 Q33 à Q44 du 17/10 (hors registre), dont :<br>- Q36 : suppression du pas de 5 s ;<br>- Q41 et Q43 : présentation iOS ;<br>- Q42 : lignes à 44 pt ;<br>- Q44 : abandon de la cellule active et du pied commun.<br>Elles contredisent des DSF. Faut-il les intégrer au registre et à la documentation générale (D-385) ? | DSF Circuits, DSF Bip, CE-UI-10 | D-385 | dsf-examen.tsv |
| AR-25 | Qualité des exigences : décisions de rédaction normative, sans réécriture tant qu'elles ne sont pas prises :<br>- convention d'obligation (QF §2.0) ;<br>- termes vagues (QF-07, QF-08), négations (QF-14), tolérances et précision temporelle (QF-16, QC-14), arrondi de l'inversion (QF-19) ;<br>- format des durées ≥ 1 h ;<br>- interruptions système, reprise, persistance (QC-01 à QC-05) ;<br>- notification, sauvegarde, fuseau, migration, écran actif, planification, données de santé, contraste (QC-07 à QC-15) ;<br>- vocabulaire `omitted`, « cibles44 » (unité inconnue), « 10 s dans le Figma de référence » (P-16) | qualite-examen.tsv (27 DECISION-PRODUIT) | — | qualité |
| AR-26 | Contrat d'écran du message de migration (D-394, D-401, dont le texte {N} reste à valider, C1) ; emplacement du nombre d'Exercices de la Composition (D-399) | ch. 09, ch. 13 | D-394, D-399, D-401 | arbitrages antérieurs |

## 2. Points documentaires à confirmer (sans décision produit)

| ID | Point | Source |
|---|---|---|
| AD-01 | 7 titres ou entrées de sommaire contenant « v13 », et 4 valeurs « D-247/D-248/v13 » de la colonne Version du ch. 09 : les renommer change les ancres | alias-examen.tsv (22 INCERTAIN) |
| AD-02 | Ch. 06 l. 1523 : la restauration présenterait comme « courante » une matrice qui se dit historique (R-06, ligne 39) | R06-examen-autres.tsv |
| AD-03 | Copies : choisir une occurrence actuelle comme copie conservée au lieu de S03-0128 et S06-0374 ; S08-0590, préfixe strict de S10-0748, à remplacer par un renvoi ? | copies-examen.tsv (Q-COP-A et Q-COP-C ; 6 lignes et 3 sections INCERTAIN) |
| AD-04 | Sections placées sous « Parcours prévus pour une phase ultérieure » alors que leur titre dit « MVP » (ch. 03, ch. 06) : faut-il corriger la structure ? | copies-examen.tsv (Q-COP-B) ; constat AUTRE section-MVP-sous-H1 |
| AD-05 | Règles DSF validées sans section d'accueil : grille 18/20/13/12, modales blanches, blocs de section (D-327), états des actions contextuelles (D-306). Les transférer suppose de créer une section au ch. 06 | dsf-examen.tsv (25 MAINTENU-DANS-DSF) |
| AD-06 | Ch. 06, bloc « Clôture des contrats » (sections « Impacts de données » et « Impact API » de la revue des cartes) : il annonce des règles « ci-dessous » sans suite. Les quasi-copies du même passage sont traitées (RSD-002 à 004) | verification/structure.tsv ; residus-examen.tsv |
| AD-07 | La règle de planification à plusieurs contenus reste au ch. 09 (S10-0749 renvoie vers elle) au lieu du ch. 10 | verification/structure.tsv |
| AD-08 | 39 cas rédactionnels incertains : unités non ajoutables sans source, numérotation de titres, ancres datées, libellés d'interface. S'y ajoute l'espace manquante devant les dates (« du06/10 ») : défaut systématique, présent jusque dans le registre figé ; une correction partielle de 4 titres (RSD-005 à 008) a été écartée | qualite-examen.tsv ; residus-examen.tsv |
| AD-09 | Vérifications Figma : teinte du fond rouge pâle, boutons-icônes Catégorie et Zones, V1, frame `2117:86` (état vide), fond des groupes du Profil, tokens d'espacement 14 et de rayons 14 et 17 | arbitrages antérieurs ; paires 72, 107, 109 |
| AD-10 | Publication du signalement à la PR #371 (X-06, X-07, Q17, Q21, Q25) | signalement-PR371-X06-X07.md |
| AD-11 | Placement de sections déplacées, texte conservé :<br>- périmètre propre à un écran placé au ch. 05 selon la correspondance, alors que le plan §4.5 le garde avec son objet : S06-0329 (« cette même famille » sans antécédent), S06-0346 « Filtres avancés », S06-0347 « Tri », S06-0367 et S06-0368 (« Cette vue », lisible comme visant « Suivi — Séances — Tri ») ;<br>- S05-0198 : deux titres « Conventions communes d'interface » dans le ch. 06, D-221 formulée deux fois sans équivalence complète ;<br>- S06-0281 : « Objectif » de la modale Étiquettes isolé au ch. 04 sous un titre qui ne la nomme plus ;<br>- S01-0023 : préfixe « Vision cible — médias… » sur une règle de planification au ch. 10 ;<br>- S08-0506 et S08-0464 : renvois de l'étape 6D placés au milieu d'une liste (restriction « Portée formats » plus lisible sur place) | verification/structure-2a.tsv, structure-2b.tsv (16 RESERVE) |
| AD-12 | Règles de spécifications sources absentes des chapitres : Planification §5.3 (seulement dans `docs/archives/planification-2026-10-08/demande-source.md`), Circuits §5 et §10. Un renvoi vers une archive changerait son statut | residus-examen.tsv |
| AD-13 | Introduction du ch. 08 : « Objectif » et début de « Périmètre » rédigés avant D-402 ; le renvoi « Principes généraux » vise tout le ch. 10 | verification/fonctionnel-3.tsv (RESERVE) |

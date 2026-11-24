# DSF — Agenda — Planning (proposition) — 19/11/2026

Référence Figma : écran « Agenda — Planning (proposition) » (`12580:27335`, 402 × 874), page Prototype MVP. Le Figma définit le rendu ; il ne crée pas de règle métier. Cette carte de routine remplace la carte d’occurrence de la vue Semaine (Agenda) du calendrier (CE-UI-03). Décision D-533 (chapitre 07) ; contrat d’écran CE-UI-15 (chapitre 13) ; onglets : D-532.

## 1. Barre de titre

Format défini par le [DSF Barre de titre à onglets](DSF-BARRE-TITRE-ONGLETS-2026-11-19.md). Onglets Journal · Agenda · Vue d’ensemble, au format des onglets des catalogues (libellés 17 px centrés ; onglet actif en gras sur fond arrondi). L’onglet actif est Agenda. En-tête et barre d’état teintés `#F7F7FF`, comme le catalogue des séances.

## 2. Zone de contexte et rangée des jours (20/11/2026)

Référence Figma : écran « P-Calendrier — Semaine — Carrousel dans la zone de contexte (proposition) » (`12765:24572`). Bande 402 × 115 à y = 92, hauteur inchangée par rapport aux autres écrans. Dégradé lilas `#EAEAFF` opaque jusqu’à 80 % de la hauteur, puis transparent en bas (identique à la zone de contexte de « Planifier une séance »). Marges gauche et droite de 16 px. Deux lignes ; la rangée des sept jours est dans la bande.

| Ligne | Contenu |
|---|---|
| 1 — mois | Bouton « Aujourd’hui » à l’extrême gauche : calendrier portant le numéro du jour courant, sans cercle, zone de tap 34 × 34, bord visible aligné sur le chevron de semaine en dessous. « Novembre 2026 » centré sur l’écran, Inter 18 semi-gras, avec une double flèche de mois de chaque côté, à 10 px du libellé ; les doubles flèches ne sont pas au-dessus des flèches de semaine. Icône de filtre par routine à l’extrême droite (§ 9), sans cercle, symétrique de « Aujourd’hui ». Centre vertical à y = 115. |
| 2 — semaine | Flèche simple de semaine à chaque extrémité (précédente : bord visible aligné à gauche sur l’icône « Aujourd’hui » ; suivante : à gauche du bouton « Planifier »). Entre les deux, les sept jours, centrés entre les glyphes des flèches. Bouton « Planifier » 34 × 34 au bord droit (x = 352, y = 149, comme sur l’écran Journal). Centre vertical à y = 166. |

**Bouton « Aujourd’hui »** : icône `icon/aujourd’hui`, même calendrier que l’icône « Planifier » (trait 1,5), chiffre du jour à la place du « + ». Gris foncé quand le jour sélectionné est le jour courant ; bleu (couleur du bouton « Planifier ») dès que le jour sélectionné est un autre jour. Toucher le bouton revient au jour courant. Dans la maquette, le chiffre affiché est fixe (20) ; il suit la date du jour dans l’application.

**Rangée des jours** : sept cartes 36 × 46, rayon 10, écart 3 px, largeur totale 270 px. Contenu : jour abrégé (11), numéro (18), un point de 4 px par séance du jour en bas de la carte. Carte du jour sélectionné : pleine, violet-bleu opaque, texte blanc. Autres cartes : blanc à 30 % d’opacité.

[Texte d’origine remplacé le 20/11/2026 : « Trois lignes centrées verticalement, espacées de 6 px : 1 — mois : double flèche de mois à chaque bord ; « Novembre 2026 » au centre, Inter 18 semi-gras. 2 — semaine : flèches simples rapprochées du centre (centres à x = 96 et x = 306) ; « du 16 au 22 » au centre, même style que le mois. 3 : « Aujourd’hui » en texte seul (Inter 14 normal, gris, sans bouton ni fond), centré ; bouton « Planifier » 32 × 32 à droite (x = 354). » ; « 3. Rangée des jours : sept cartes 46 × 64 sous la bande, sur toute la largeur (écart 8 px) ; jour abrégé (13), numéro (22 semi-gras), un point de 5 px par séance du jour ; carte du jour sélectionné pleine. » Le libellé « du 16 au 22 » n’est plus affiché.] [Précision du 19/11/2026 au soir (s19-mois), portant sur ce libellé retiré : à cheval sur deux mois, seul le mois de fin — « du 26 au 1er novembre ».]

## 3. Rangée des jours

Voir § 2 : la rangée des sept jours est dans la bande de contexte (ligne 2).

## 4. Liste

Regroupée par jour. [Recette du 20/11/2026 (constat C) : la liste continue sur les semaines suivantes ; le carrousel des jours suit le défilement.] En-tête de jour Inter 13. Un trait fin pleine largeur sépare deux jours, à 5 px au-dessus de la date ; aucun trait entre deux routines. Écart entre routines : 8 px ; ligne de routine : 52 px de haut. Liste sous la bande de contexte (premier en-tête de jour à y = 215). [Texte d’origine remplacé le 20/11/2026 : « Liste à 14 px sous la rangée des jours. »]

## 5. Carte d’une routine

- **Bloc heure / durée** (à gauche) : l’heure au format « 8h00 », « 14h00 » (Inter 15, noir, sans zéro initial), puis, dessous, le symbole du chronomètre (14 px) à gauche de la durée (12, gris, jeton `Card metadata` [13 remplacé le 20/11/2026]). Le bloc est encadré par un cadre sans liseré qui part du bord gauche de l’écran, centré verticalement sur le bloc, avec un trait vertical épais de 6 px à son bord gauche, de la même teinte en plus foncé.
- **Bande** : une bande horizontale de la couleur du cadre, à 18 % d’opacité, prolonge le cadre sur toute la largeur de la carte jusqu’au bord droit de l’écran, avec à droite le même trait vertical épais de 6 px qu’à gauche.
- **Teinte du cadre et du trait** — rendu proposé : vert clair pour une séance faite, rouge clair pour une séance manquée, gris clair pour une séance prévue. [Remplacé le 19/11/2026 au soir (Hermann, constat D) : exécutée complète, passée ou future → vert ; exécutée partielle → orange ; abandonnée (arrêtée) → gris ; passée non exécutée → rouge ; future non exécutée → bleu.]
- **Chevron** : un chevron de 16 px à gauche du nom, aligné sur lui, ouvre ou ferme le déployé ; il pointe vers la droite carte fermée, vers le bas carte déployée. Le nom est décalé de 18 px ; la ligne 2 reste alignée sur le bord gauche du chevron.
- **Titre** : [remplacé le 21/11/2026 (D-553) : nom de la Séance, jamais celui de la Routine] nom de la routine, Inter Semi Bold 15 noir, jeton `KODJO / DSF / Card name` [remplace « 16 » (20/11/2026, décision de Hermann : mêmes tailles que les cartes des catalogues de séances et de mouvements)]. **Lignes sous le nom** : Inter Regular 12, jeton `KODJO / DSF / Card metadata` [remplace « 13 »]. **Ligne 2** : « Spécialité · zones corporelles », gris, le point étant centré horizontalement et verticalement entre les deux (6 px de chaque côté) ; une ou deux zones, le signe « + » si les zones ne tiennent pas ; spécialité abrégée au besoin (« Kiné »).
- **À droite** : étiquette « Terminée » pour une séance faite ; bouton « Démarrer » pour une séance prévue ou manquée. [Remplacé le 19/11/2026 au soir (s19-passees, constat G) : étiquette « Complétée », « Partielle » ou « Arrêtée » selon le statut d'exécution de la ou des séances ; « Démarrer » pour une occurrence non exécutée, passée ou future. Navigation (constat B) : le cadre de gauche ouvre la planification, le centre déploie, la droite porte l'action.] Le texte du bouton et celui de l’étiquette sont alignés en bas avec le texte de la ligne 2.

## À clarifier

- ~~Condition d’affichage de « Aujourd’hui » : proposée visible seulement hors de la semaine en cours.~~ [Remplacé le 20/11/2026 : le bouton est toujours visible ; il est bleu quand le jour sélectionné n’est pas le jour courant (§ 2).]
- [Remplacé le 20/11/2026 (décision de Hermann) : « Libellé du mois quand la semaine affichée chevauche deux mois : non défini. Changement de semaine ou de mois par balayage : non défini (flèches uniquement). »] Libellé du mois : le mois qui compte le plus de jours dans la semaine affichée (4 jours ou plus sur 7 ; équivalent au mois du jeudi de la semaine). Ce n’est pas une convention d’interface : c’est la règle ISO 8601 des semaines appliquée au mois. Les flèches de mois affichent la semaine dont le libellé est le mois visé. Balayage horizontal de la rangée des jours : change de semaine ; geste réservé à la rangée (sur les cartes de la liste, le balayage est celui des actions glissées) ; à valider à l’usage (« on teste et on voit »). Les écrans Semaine déployés, actions glissées, séance déployée et fond de la modale de suppression adoptent cette zone de contexte (« oui il faut déployer sur tous les écrans ») ; le bouton Planifier 34 × 34 est aussi appliqué au Journal et à ses modales de suppression.
- Comportement du changement de mois sur la semaine affichée : proposé = première semaine du mois. [Tranché le 21/11/2026 (recette, q23-mois — Hermann : « il faut afficher le mois qui compte le plus de jours dans la semaine affichée ») : le mois affiché est celui de la semaine (son jeudi), comme le Plan ; les doubles flèches ouvrent la première semaine du mois voisin, le 1er choisi s'il y est, sinon le lundi [remplacé le 22/11/2026 (recette, c33-agenda-mois — Hermann : « Double flèches : doit être la semaine du premier jour du mois, sélectionné ») : semaine qui contient le 1er du mois voisin, le 1er choisi ; le mois atteint reste affiché tant que cette semaine l'est, même si elle compte plus de jours du mois précédent (interprétation de Claude, à valider)]. Remplace « mois du jour choisi » (D-538).]
- Logique des couleurs (teinte du cadre) : à définir par Hermann ; les valeurs ci-dessus sont provisoires.
- « Spécialité » n’existe pas dans le modèle de données fonctionnel : propriété, liste de valeurs et abréviations à définir avant tout développement.
- États de l’ancienne carte Semaine : voir § 6 pour la déclinaison proposée (déployé, actions glissées) ; la récurrence dans le détail déployé, la zone de déploiement et la zone « Démarrer » distincte ne sont pas repris : à conserver, déplacer ou retirer, à arbitrer.
- Journal : voir [DSF Journal](DSF-JOURNAL-2026-11-19.md) (D-535). [Texte d’origine remplacé le 19/11/2026 : « Vues Journal (carte compacte 298 × 46) et Vue d’ensemble : inchangées ».] Vue d’ensemble : inchangée tant qu’aucune décision ne la concerne.

## 6. Déclinaison aux écrans du calendrier (19/11/2026)

La zone de contexte et la rangée des jours (§ 2), la liste regroupée par jour (§ 4) et la carte (§ 5) s’appliquent à tous les écrans de la vue Semaine (Agenda) et aux fonds des modales de suppression. Chaque écran garde son état propre :

- **Séance déployée** : la carte de § 5 reste telle quelle ; seul le complément de composition du catalogue (« P-Catalogue des séances — Séance déployée ») est ajouté en dessous : filet de séparation [retiré le 21/11/2026 (recette, a31-deploye — Hermann : « Retirer le séparateur horizontal avant le nom du circuit / de l’exercice »)], puis la liste des exercices de la séance avec ses cycles et circuits. [Recette du 20/11/2026 (r20-recap) : sans filet ni espace quand rien ne le précède ; le nom de chaque séance est toujours affiché, même seule. Routine à plusieurs séances : repère « P » cerclé devant le nom de la carte (constat A).] Le détail est inséré dans le flux de la liste ; les routines suivantes sont repoussées.
- **Actions glissées** : la carte glisse vers la gauche de 180 px et découvre « Dupliquer » (gris) et « Supprimer » (rouge), 86 × 54 chacune [90 × 52 avant le 19/11/2026], séparées de la carte par 8 px. [Précisé le 19/11/2026 au soir (s19-glisse) : coins du bloc arrondis, marge de 16 px avec le bord droit de l'écran.]
- **Récurrence au déployé** : [retirée de l'Agenda le 19/11/2026 au soir (constat A) ; elle est affichée dans le déployé du Journal.]
- **Après suppression** : la routine supprimée disparaît de la liste et son point de la carte du jour ; les points restants sont recentrés. [Recette du 20/11/2026 (constat D) : l'Agenda ne supprime que l'occurrence (« Supprimer cette occurrence »), la routine reste au Journal.]
- **Jour sélectionné** : la carte du jour est pleine ; la liste commence à la date sélectionnée.

Ces déclinaisons sont du rendu, sans règle métier nouvelle. Les écrans Jour et Mois ne sont pas modifiés par ce paragraphe.

## 7. Routine à plusieurs séances : une carte, un enchaînement (D-534, 19/11/2026)

[Affichage remplacé le 21/11/2026 (D-553) : une carte par Séance, ligne Ⓟ et lien ; voir « Évolution validée du 21/11/2026 » en fin de document. L’enchaînement décrit ci-dessous reste en vigueur.]

Une routine planifiée avec plusieurs séances et un nom produit **une seule carte par occurrence** : le nom de la routine en titre, l’heure et la durée totale ; les séances sont listées dans le déployé. Dupliquer et Supprimer s’appliquent à la routine.

« Démarrer » enchaîne les séances dans l’ordre de la liste, sans modifier le moteur d’exécution : chaque séance reste une exécution complète et indépendante, avec son propre historique. Entre deux séances, l’écran de transition est l’écran de démarrage de la séance suivante, recouvert d’un voile vert translucide portant, dans un encadré vert plein, le texte « Appuyer pour démarrer la 2è séance du parcours » (rang calculé). Aucune information sur la séance ou le parcours n’est ajoutée aux écrans d’exécution eux-mêmes. Écran Figma : « Exécution d’une séance — Initial — Enchaînement (proposition) ».

Si l’utilisateur arrête une séance, la suite lui est proposée (« Passer à la suivante » ou « Terminer ») : formulation et dessin à définir. Après une reprise sur interruption, seule la séance interrompue est reprise.

[Complété le 19/11/2026 au soir (s19-voile, constat F) : le premier écran de démarrage présente le parcours (« Séance 1 », « Séance 2 »… avec leurs noms), avec Démarrer et Retour ; les séances intermédiaires n’ont pas de « Fin de séance » — l’écran « Séance terminée » s’affiche, puis l’écran de transition de la séance suivante s’ouvre automatiquement.]

[Contre-recette du 20/11/2026 et missions D-536 / D-537 (classe B, registre ch07) :
- carte : trois zones tactiles sur toute la hauteur — gauche (cadre) : modifier ce créneau ; centre (nom et ligne 2) : déplier ; droite (pastille) : « Démarrer » ou « Rattraper », sinon rien ;
- « Rattraper » sur une occurrence passée non commencée ;
- le cadre ouvre la modification du seul créneau (date, heure, pastilles du créneau, séance ajoutée, rappel ; nom de la routine non modifiable ; pas de répétition) ; seul le créneau ouvert est coloré, les autres sont grisés ; une occurrence commencée ne s'ouvre pas ;
- supprimer : « Supprimer ce créneau », « Annuler » en haut à gauche, « Confirmer » pleine largeur ; pas d'action Supprimer sur une occurrence commencée ;
- glisser vers la gauche : la liste reste figée (constat A).]

[Mise en œuvre du 20/11/2026 — D-538 (zone de contexte avec la rangée des sept jours), rédigée sur la branche `docs/planification-grille-creneaux` (commit 562a5a0d, non fusionnée), qui remplace les § 2 et § 3 ci-dessus : deux lignes dans la bande de 115 ; ligne 1 « Aujourd’hui » (icône calendrier au numéro du jour, grise sur le jour courant, bleue sinon), mois centré entre deux doubles flèches à 10, emplacement du filtre par routine à droite ; ligne 2 flèche de semaine, sept cartes 36 × 46 (rayon 10, écart 3, un point de 4 par séance), flèche de semaine, « Planifier » 34 × 34 ; libellé « du 16 au 22 » retiré ; « + » de l’icône « Planifier » recentré. Classe A (le code rejoint D-538) ; rapport `2026-11-20_AGENDA-ZONE-CONTEXTE.md`.]

[Mise en œuvre du 20/11/2026 — D-539 (filtre par routine, § 9 de la branche `docs/planification-grille-creneaux`, commit 562a5a0d, non fusionnée) : entonnoir à droite de la ligne 1 (contour gris, plein bleu filtre actif) ; modale « Filtrer par routine » (carte du Journal réduite au nom et à « X à venir, jusqu’au jj/mm/aaaa » [remplacé le 21/11/2026 (recette, f23-modale, f25-alignement — Hermann : « 10 créneaux à venir jusqu'au 15 novembre » ; « Mettre le mois en toutes lettres, ne pas mettre l'année, ni le nombre de créneaux passés » ; « S’il n’y a aucun créneau à venir écrire « Aucun créneau à venir » ») : « jusqu’au » = dernier créneau à venir ; un seul créneau : « 1 créneau à venir le 15 novembre » (formulation de Claude, à valider)], case à cocher, sélection multiple, « Filtrer N routines » / « Afficher toutes les routines ») ; vue filtrée : liste et points réduits aux routines choisies, filtre conservé jusqu’à son retrait. Classe A ; choix retenus par Claude non promus (D-539) ; rapport `2026-11-20_AGENDA-FILTRE-ROUTINE.md`.]

[Recette du 20/11/2026 (Hermann) — carte de l'Agenda : pastille des zones corporelles devant la ligne 2 ; repère « P » d'un parcours après le nom, cercle affiné (trait 1). Classe B ; rapport `2026-11-20_AGENDA-CARTE-REPERES.md`.]

[Mise en œuvre du 20/11/2026 — D-539 mis à jour (branche `docs/planification-grille-creneaux`, commit 8ecd17fc, non fusionnée) : toucher l'icône bleue désactive le filtre sans ouvrir la modale ; la modale s'ouvre toujours sans routine cochée ; bouton « Filtrer N routines » désactivé sans sélection ; « Afficher toutes les routines » retiré. Cartes de la modale : nom aligné sur la date, ligne des créneaux sur l'année (recette du 20/11/2026). Rapport `2026-11-20_AGENDA-FILTRE-ROUTINE-COMPORTEMENT.md`.]

[Mise en œuvre du 20/11/2026 — D-540 (§ 10 de la branche `docs/planification-grille-creneaux`, commit 171f9ca3, non fusionnée) : créneau manqué rattrapable jusqu'au début du créneau suivant de la routine, le dernier 10 jours ; puis « Expirée » (cadre rouge, étiquette rouge, ni « Rattraper » ni « Démarrer ») ; état calculé. Classe A ; rapport `2026-11-20_CYCLE-VIE-ROUTINE.md`.]

[Recette du 20/11/2026 (Hermann) : fenêtre « Supprimer ce créneau » — « Annuler » et « Confirmer » côte à côte, même format. [« Annuler » en haut à gauche, « Confirmer » pleine largeur — remplacé.]]

## 8. États du bouton, modification d’une occurrence (D-536, 20/11/2026)

- **Pastille d’action** : « Démarrer » (occurrence non commencée, d’aujourd’hui ou à venir) ; « Rattraper » (occurrence passée non commencée, journée terminée, cadre rouge) ; pour une occurrence commencée, étiquette « Complétée », « Partielle » ou « Arrêtée » à la place du bouton. La pastille a une hauteur fixe et une largeur qui suit son texte.
- **Modification d’une occurrence** : date, heure, activation ou désactivation des pastilles du créneau, ajout d’une séance à ce créneau uniquement (une séance ajoutée à la main peut être retirée de l’occurrence ; les séances de la routine ne se retirent pas, on les désactive), rappel. Toute modification faite dans l’Agenda ne concerne que l’occurrence, jamais la routine entière, et n’appelle aucun choix ; la routine entière, récurrence comprise, se modifie uniquement depuis le Journal (un seul chemin). [Remplace « Un choix « Cette occurrence seulement » / « Toute la routine » précède la sauvegarde », texte du 20/11/2026.] Seul le créneau de l’occurrence ouverte est coloré (en-tête et pastille), les autres sont grisés. Une occurrence commencée n’est pas modifiable. Règle de rendu, sans écran dédié : les créneaux non concernés sont grisés.
- Règles de figement et de protection des exceptions : D-536.
- **Suppression (D-537)** : dans l’Agenda, seule l’occurrence est supprimée. Dialogue « Supprimer cette occurrence » : titre seul, bouton « Confirmer » pleine largeur, bouton « Annuler » en haut à gauche, sans message. [Remplacé le 20/11/2026 (recette de Hermann) : « Supprimer ce créneau » — « Annuler » et « Confirmer » côte à côte, même format.] Une occurrence commencée ne peut pas être supprimée. Supprimer la dernière occurrence à venir laisse la routine dans le Journal, en gris.

## 9. Filtre par routine (20/11/2026)

Références Figma : « P-Calendrier — Semaine — Filtre par routine — Choix de la routine (proposition) » et « P-Calendrier — Semaine — Filtre par routine — Vue filtrée (proposition) ». Décision D-539 (chapitre 07). Besoin : n’afficher dans l’Agenda que les créneaux d’une ou de plusieurs routines.

- **Icône** : entonnoir (composant `icon/filtre-routine`, trait 1,5, zone de tap 34 × 34, sans cercle) sur la ligne 1 de la zone de contexte, au bord droit. Sans filtre : contour gris foncé [remplacé le 21/11/2026 (D-555) : contour bleu, comme « Aujourd'hui »]. Filtre actif : silhouette pleine, bleue. Elle se distingue de l’icône à trois traits du filtre multicritère du Journal et des catalogues. **Comportement (20/11/2026, décision de Hermann)** : un toucher sur l’icône sans filtre ouvre la modale ; un toucher sur l’icône bleue (filtre actif) désactive le filtre, sans ouvrir la modale. Pour changer de filtre, on désactive puis on rouvre la modale.
- **Modale « Filtrer par routine »** : version simplifiée de l’écran Journal. En-tête avec le bouton de fermeture (✕) en haut à gauche et le titre. Le fond de la zone de contexte du Journal commence tout en haut de la modale (aucune zone blanche) ; l’en-tête (✕ et titre) est posé dessus, puis le champ de recherche, qui prend la largeur disponible, et le bouton de filtre et le bouton de tri alignés à droite (marge de 16 px), sans compteurs et sans le bouton « Planifier », avec le même fonctionnement que sur le Journal ([DSF Journal](DSF-JOURNAL-2026-11-19.md) § 2 et § 4). Une carte par routine, au format de la carte du Journal ([DSF Journal](DSF-JOURNAL-2026-11-19.md) § 3), réduite à la première ligne (nom) et à la troisième (« X à venir, jusqu’au jj/mm/aaaa »), avec le cadre de gauche (date de création) et un sélecteur à cocher à droite à la place du chevron et de la ligne 2. Sélection multiple. En bas, un bouton, sans trait de séparation : « Filtrer N routines » (« Filtrer 1 routine » au singulier) ; [remplacé le 20/11/2026 (décision de Hermann) : « quand aucune routine n’est cochée, « Afficher toutes les routines », qui retire le filtre (retenu par Claude) »] tant qu’aucune routine n’est cochée, le bouton est désactivé (état « Désactivé » du bouton primaire). Routines ayant au moins un créneau, archivées comprises, triées par ordre alphabétique (retenu par Claude). [Remplacé le 20/11/2026 (décision de Hermann) : « À la réouverture, les routines du filtre en cours sont cochées. »] La modale n’est ouverte que filtre inactif : elle s’ouvre toujours sans routine cochée, sans mémoire du filtre précédent.
- **Vue filtrée** : la zone de contexte est inchangée (« Aujourd’hui », mois, semaine, rangée des sept jours, « Planifier » [retiré de la zone de contexte le 22/11/2026, D-558]) ; seule l’icône change (pleine, bleue). La liste n’affiche que les créneaux des routines choisies pour la semaine affichée ; un jour sans créneau de ces routines n’apparaît pas, et une semaine sans créneau affiche l’état vide existant de la vue Semaine. Les points des cartes de jour ne comptent que les séances des routines du filtre. Le filtre reste actif quand on change de semaine ou de mois et avec « Aujourd’hui » ; il reste actif tant qu’il n’est pas retiré, l’icône bleue le signale (retenu par Claude).
- Cartes, états, couleurs, déploiement, démarrer / rattraper, modification et suppression glissées : inchangés, soumis aux règles D-536 et D-537.

## 10. Créneau manqué, expiré et routine terminée (D-540, 20/11/2026)

- **Rattrapable** : un créneau non commencé dont la date est passée reste rouge, avec « Rattraper », jusqu’au début du créneau suivant de la même routine (créneau exécuté ou non entre-temps). Le dernier créneau d’une routine reste rattrapable 10 jours après sa date.
- **Expiré** : ensuite, le cadre reste rouge (séance manquée) et une étiquette rouge « Expirée » remplace le bouton « Rattraper » ; plus de « Démarrer » ni de « Rattraper ». Il reste visible dans l’Agenda passé, n’est pas modifié par un changement de la routine et est supprimé avec elle. L’état est calculé à l’affichage ; supprimer le créneau suivant recalcule la règle. Rendu de l’état expiré : écran « P-Calendrier — Semaine — Créneau expiré (proposition) » — cadre, bande et traits rouges inchangés, étiquette « Expirée » (76 × 24, fond rouge clair `#FCE6E6`, texte rouge `#B33838`) à la place du bouton, comme « Complétée », « Partielle » et « Arrêtée » pour un créneau commencé.
- **Routine active ou terminée** : voir DSF Journal § 2. Pas d’archivage ni de restauration des routines.
- La durée de 10 jours est une constante, sans réglage dans le profil.

## Évolution validée du 21/11/2026 — Agenda centré sur les Séances

**Remplace**, pour l'Agenda seulement, la carte unique par occurrence de Routine (D-533/D-534) : une carte **par Séance**, y compris Exécution libre, et un en-tête compact « Ⓟ Nom du parcours » avec rail sans numéros au-dessus des Séances d'une Routine à plusieurs Séances. Une Routine à Séance unique n'a pas d'en-tête Parcours. Les cartes utilisent toutes le même format ; le déployé ne répète plus le nom de la Séance. L'heure d'une Séance exécutée est réelle et la carte est repositionnée ; pour les Séances non exécutées à partir de la deuxième d'un Parcours, la zone heure affiche « — ». Pas de statut d'Exécution agrégé du Parcours ; enchaînement actuel conservé. Les autres règles et états non contradictoires de ce DSF demeurent. Voir [spécification consolidée du 21/11/2026](KODJO-Agenda-seances-journal-filtre-2026-11-21.md). **L'affichage Agenda est validé dans Figma** (« P-Calendrier — Semaine — Séances, parcours et hors planification (proposition B — lien fin) », `12906:47`) ; filtre et vue filtrée ajustés le 21/11/2026, à valider.

## Zone de contexte rééquilibrée — 21/11/2026 (D-555)

Précise D-538 et D-539 :
- Ligne 1 :
  - le mois et ses doubles flèches sont centrés sur la rangée des jours de la ligne 2, qui est centrée entre les flèches de semaine ;
  - l'entonnoir est centré au-dessus de la flèche de semaine suivante, symétrique de « Aujourd'hui » autour du mois, et centré verticalement sur la ligne du mois.
- Entonnoir sans filtre actif : contour bleu, comme « Aujourd'hui » [contour gris jusqu'au 20/11/2026] ; filtre actif : plein bleu.
- Figma :
  - les 11 écrans de la vue Agenda ;
  - composant `icon/filtre-routine`, état Inactif.
- Onglets : Journal · Agenda · Plan (D-554, [DSF Plan](DSF-PLAN-2026-11-21.md)).

## Modification d'un créneau de parcours — 22/11/2026 (D-556, D-557)

- **Désactiver une séance** : on peut désactiver n'importe quelle séance du créneau, même si elle n'a de pastille sur aucun autre créneau du cycle. Au moins une séance reste active. La règle « chaque séance a au moins une pastille » ne vaut que dans la grille de la routine (Journal).
- **Ordre des séances** : modifiable dans ce créneau et conservé pour lui seul ; l'enchaînement suit ce nouvel ordre.
- **Constats** : recette du 22/11/2026. Validation bloquée, et ordre non conservé (RM-274).

## Bouton flottant et zone de contexte — 22/11/2026 (D-558, D-559)

- « Planifier » quitte la zone de contexte. Le bouton flottant (calendrier « + ») crée un **créneau unique** au jour sélectionné : planification pré-remplie, sans répétition.
- Ligne 1 symétrique : « Aujourd'hui » à gauche, mois centré sur l'écran, entonnoir en miroir à droite. Ligne 2 : flèche, sept jours, flèche, centrés sur l'écran.
- Voir [DSF Bouton flottant](DSF-BOUTON-FLOTTANT-2026-11-22.md).

## Marque « hors routine » — 22/11/2026 (D-560)

- Un astérisque collé à l'heure (« 17h05* ») signale une Séance hors de la répétition d'une routine : Exécution hors planification, ou créneau ajouté à la main hors répétition. Couleur de l'heure, plus petit qu'elle (11 pour 15) ; pas de légende.
- La carte d'une Exécution hors planification porte la spécialité comme les autres ; le libellé « Hors planification » est retiré.
- La lecture vocale annonce « hors planification » ou « ajouté hors répétition ».
- Un créneau unique créé par le bouton flottant n'est pas marqué : il constitue toute sa routine. [Remplacé le 23/11/2026 (Hermann : « Oui. C'est le même concept ») : le créneau unique est marqué lui aussi ; toute routine sans répétition est marquée ; les cartes « — » d’un parcours, sans heure, n’ont pas d’astérisque (choix de Claude, à valider).]
- Figma : « P-Calendrier — Semaine — Séances, parcours et hors planification (proposition B — lien fin) » `12906:47`, carte Gainage.

## Occurrence supprimée — 23/11/2026 (D-568)

- Une occurrence prévue par la répétition d'une routine et supprimée depuis l'Agenda reste à son heure prévue : cadre et texte en gris, pastille « Supprimée » (gris) à la place de l'action.
- Glisser la carte propose « Rétablir » tant que la date n'est pas passée.
- Figma : carte « Dos et mobilité » du mardi 17, écran `12906:47`.
- Cas sans trace et règles : [compléments du 23/11/2026](KODJO-Programme-recette-2026-11-23.md) § 6.

## Recette du Programme — 23/11/2026 (D-585, D-588 ; report du 24/11/2026)

- **Parcours à chaque créneau** (constat i) : une routine à plusieurs séances est présentée en parcours (ligne « Ⓟ nom ») à chaque créneau, même quand la rotation n’y place qu’une séance.
- **Nom du parcours** (constat e — Hermann : « Agenda : mettre la couleur du nom des parcours en gris, et pas en gras ») : gris, graisse normale, taille inchangée. [Semi-gras noir — remplacé.]
- **Séance déployée d’un parcours** : les deux traits de couleur de la carte se prolongent le long de la composition (constat k — Hermann : « agenda, séance déployée dans un parcours : étendre les deux traits verticaux de couleur de la séance à gauche et à droite » ; lecture retenue par Claude, l’autre lecture possible étant d’élargir les traits) ; pas d’espace avant la première ligne (constat f — « séance déployée dans un parcours : il y a trop d'espace avant la première ligne »).
- **Séance seule déployée** (y7 — Hermann : « Ce doit être le même format pour les séances que pour les parcours ») : même format qu’une séance de parcours (traits prolongés, sans écart). [Format réservé aux séances de parcours (lot 4) — remplacé.]
- **Programme d’une occurrence** (x18 — Hermann : « On ne doit pas pouvoir modifier le programme depuis l'agenda. Le champ doit être visible mais non éditable. ») : dans la modification d’une occurrence, la ligne Programme est affichée, non modifiable. [Menu « Programme » depuis l’Agenda (contre-recette 2, g2) — remplacé.]
- **Occurrence supprimée** : dans le Plan, voir D-586 (case grise conservée).

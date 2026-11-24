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

[Texte d’origine remplacé le 20/11/2026 : « Trois lignes centrées verticalement, espacées de 6 px : 1 — mois : double flèche de mois à chaque bord ; « Novembre 2026 » au centre, Inter 18 semi-gras. 2 — semaine : flèches simples rapprochées du centre (centres à x = 96 et x = 306) ; « du 16 au 22 » au centre, même style que le mois. 3 : « Aujourd’hui » en texte seul (Inter 14 normal, gris, sans bouton ni fond), centré ; bouton « Planifier » 32 × 32 à droite (x = 354). » ; « 3. Rangée des jours : sept cartes 46 × 64 sous la bande, sur toute la largeur (écart 8 px) ; jour abrégé (13), numéro (22 semi-gras), un point de 5 px par séance du jour ; carte du jour sélectionné pleine. » Le libellé « du 16 au 22 » n’est plus affiché.]

## 3. Rangée des jours

Voir § 2 : la rangée des sept jours est dans la bande de contexte (ligne 2).

## 4. Liste

Regroupée par jour. En-tête de jour Inter 13. Un trait fin pleine largeur sépare deux jours, à 5 px au-dessus de la date ; aucun trait entre deux routines. Écart entre routines : 8 px ; ligne de routine : 52 px de haut. Liste sous la bande de contexte (premier en-tête de jour à y = 215). [Texte d’origine remplacé le 20/11/2026 : « Liste à 14 px sous la rangée des jours. »]

## 5. Carte d’une routine

- **Bloc heure / durée** (à gauche) : l’heure au format « 8h00 », « 14h00 » (Inter 15, noir, sans zéro initial), puis, dessous, le symbole du chronomètre (14 px) à gauche de la durée (12, gris, jeton `Card metadata` [13 remplacé le 20/11/2026]). Le bloc est encadré par un cadre sans liseré qui part du bord gauche de l’écran, centré verticalement sur le bloc, avec un trait vertical épais de 6 px à son bord gauche, de la même teinte en plus foncé.
- **Bande** : une bande horizontale de la couleur du cadre, à 18 % d’opacité, prolonge le cadre sur toute la largeur de la carte jusqu’au bord droit de l’écran, avec à droite le même trait vertical épais de 6 px qu’à gauche.
- **Teinte du cadre et du trait** — rendu proposé : vert clair pour une séance faite, rouge clair pour une séance manquée, gris clair pour une séance prévue.
  [Remplacé le 24/11/2026 (D-566) : le cadre et le trait portent la teinte de l’état — bleu clair : à démarrer (Démarrer) ; rouge clair : en retard (Rattraper), arrêtée, expirée ; vert clair : complétée ; orange clair : partielle ; gris clair : supprimée. Même contraste pour toutes les teintes ; seule la teinte change.]
- **Chevron** : un chevron de 16 px à gauche du nom, aligné sur lui, ouvre ou ferme le déployé ; il pointe vers la droite carte fermée, vers le bas carte déployée. Le nom est décalé de 18 px ; la ligne 2 reste alignée sur le bord gauche du chevron.
- **Titre** : nom de la routine, Inter Semi Bold 15 noir, jeton `KODJO / DSF / Card name` [remplace « 16 » (20/11/2026, décision de Hermann : mêmes tailles que les cartes des catalogues de séances et de mouvements)]. **Lignes sous le nom** : Inter Regular 12, jeton `KODJO / DSF / Card metadata` [remplace « 13 »]. **Ligne 2** : « Spécialité · zones corporelles », gris, le point étant centré horizontalement et verticalement entre les deux (6 px de chaque côté) ; une ou deux zones, le signe « + » si les zones ne tiennent pas ; spécialité abrégée au besoin (« Kiné »).
- **À droite** : étiquette « Terminée » pour une séance faite ; bouton « Démarrer » pour une séance prévue ou manquée. Le texte du bouton et celui de l’étiquette sont alignés en bas avec le texte de la ligne 2.

## À clarifier

- ~~Condition d’affichage de « Aujourd’hui » : proposée visible seulement hors de la semaine en cours.~~ [Remplacé le 20/11/2026 : le bouton est toujours visible ; il est bleu quand le jour sélectionné n’est pas le jour courant (§ 2).]
- [Remplacé le 20/11/2026 (décision de Hermann) : « Libellé du mois quand la semaine affichée chevauche deux mois : non défini. Changement de semaine ou de mois par balayage : non défini (flèches uniquement). »] Libellé du mois : le mois qui compte le plus de jours dans la semaine affichée (4 jours ou plus sur 7 ; équivalent au mois du jeudi de la semaine). Ce n’est pas une convention d’interface : c’est la règle ISO 8601 des semaines appliquée au mois. Les flèches de mois affichent la semaine dont le libellé est le mois visé. Balayage horizontal de la rangée des jours : change de semaine ; geste réservé à la rangée (sur les cartes de la liste, le balayage est celui des actions glissées) ; à valider à l’usage (« on teste et on voit »). Les écrans Semaine déployés, actions glissées, séance déployée et fond de la modale de suppression adoptent cette zone de contexte (« oui il faut déployer sur tous les écrans ») ; le bouton Planifier 34 × 34 est aussi appliqué au Journal et à ses modales de suppression.
- Comportement du changement de mois sur la semaine affichée : proposé = première semaine du mois.
- Logique des couleurs (teinte du cadre) : à définir par Hermann ; les valeurs ci-dessus sont provisoires.
- « Spécialité » n’existe pas dans le modèle de données fonctionnel : propriété, liste de valeurs et abréviations à définir avant tout développement.
- États de l’ancienne carte Semaine : voir § 6 pour la déclinaison proposée (déployé, actions glissées) ; la récurrence dans le détail déployé, la zone de déploiement et la zone « Démarrer » distincte ne sont pas repris : à conserver, déplacer ou retirer, à arbitrer.
- Journal : voir [DSF Journal](DSF-JOURNAL-2026-11-19.md) (D-535). [Texte d’origine remplacé le 19/11/2026 : « Vues Journal (carte compacte 298 × 46) et Vue d’ensemble : inchangées ».] Vue d’ensemble : inchangée tant qu’aucune décision ne la concerne.

## 6. Déclinaison aux écrans du calendrier (19/11/2026)

La zone de contexte et la rangée des jours (§ 2), la liste regroupée par jour (§ 4) et la carte (§ 5) s’appliquent à tous les écrans de la vue Semaine (Agenda) et aux fonds des modales de suppression. Chaque écran garde son état propre :

- **Séance déployée** : la carte de § 5 reste telle quelle ; seul le complément de composition du catalogue (« P-Catalogue des séances — Séance déployée ») est ajouté en dessous : filet de séparation, puis la liste des exercices de la séance avec ses cycles et circuits. Le détail est inséré dans le flux de la liste ; les routines suivantes sont repoussées.
- **Actions glissées** : la carte glisse vers la gauche de 180 px et découvre « Dupliquer » (gris) et « Supprimer » (rouge), 86 × 54 chacune [90 × 52 avant le 19/11/2026], séparées de la carte par 8 px.
- **Après suppression** : la routine supprimée disparaît de la liste et son point de la carte du jour ; les points restants sont recentrés.
- **Jour sélectionné** : la carte du jour est pleine ; la liste commence à la date sélectionnée.

Ces déclinaisons sont du rendu, sans règle métier nouvelle. Les écrans Jour et Mois ne sont pas modifiés par ce paragraphe.

## 7. Routine à plusieurs séances : une carte, un enchaînement (D-534, 19/11/2026)

Une routine planifiée avec plusieurs séances et un nom produit **une seule carte par occurrence** : le nom de la routine en titre, l’heure et la durée totale ; les séances sont listées dans le déployé. Dupliquer et Supprimer s’appliquent à la routine.

« Démarrer » enchaîne les séances dans l’ordre de la liste, sans modifier le moteur d’exécution : chaque séance reste une exécution complète et indépendante, avec son propre historique. Entre deux séances, l’écran de transition est l’écran de démarrage de la séance suivante, recouvert d’un voile vert translucide portant, dans un encadré vert plein, le texte « Appuyer pour démarrer la 2è séance du parcours » (rang calculé). Aucune information sur la séance ou le parcours n’est ajoutée aux écrans d’exécution eux-mêmes. Écran Figma : « Exécution d’une séance — Initial — Enchaînement (proposition) ».

Si l’utilisateur arrête une séance, la suite lui est proposée (« Passer à la suivante » ou « Terminer ») : formulation et dessin à définir. Après une reprise sur interruption, seule la séance interrompue est reprise.

## 8. États du bouton, modification d’une occurrence (D-536, 20/11/2026)

- **Pastille d’action** : « Démarrer » (occurrence non commencée, d’aujourd’hui ou à venir) ; « Rattraper » (occurrence passée non commencée, journée terminée, cadre rouge) ; pour une occurrence commencée, étiquette « Complétée », « Partielle » ou « Arrêtée » à la place du bouton. La pastille a une hauteur fixe et une largeur qui suit son texte.
  [Remplacé le 24/11/2026 (D-566) : dans la ligne d’agenda, la pastille textuelle d’un état d’exécution est remplacée par une icône ronde de 28 pt, à droite, sans libellé. Démarrer et Rattraper : disque blanc à filet fin et ombre légère, triangle bleu `#0508E5` (identique ; le cadre les distingue). Arrêtée : disque rouge `#CC3838`, carré blanc. Complétée : disque vert `#1A995C`, coche blanche. Partielle : anneau fixe (sans valeur de progression), piste `#D6D6DB`, arc orange `#F58C1A` sur trois quarts depuis 12 h dans le sens horaire. Supprimée : disque gris `#8C919E`, croix blanche. Expirée : disque gris `#8C919E`, horloge blanche (cadran et deux aiguilles), à plat. Démarrer et Rattraper, seuls éléments qui déclenchent une action, ont un relief au repos (dégradé blanc vers gris très clair, ombre large et ombre serrée) et un état appuyé pendant le toucher (disque réduit à 94 %, fond `#E8EBF5`, ombre interne en haut, ombre extérieure réduite). Les autres icônes sont des états : à plat, sans état appuyé. Rendu : écran « P-Calendrier — Semaine — Icônes d’état (essai) ». ]
- **Modification d’une occurrence** : date, heure, activation ou désactivation des pastilles du créneau, ajout d’une séance à ce créneau uniquement (une séance ajoutée à la main peut être retirée de l’occurrence ; les séances de la routine ne se retirent pas, on les désactive), rappel. Toute modification faite dans l’Agenda ne concerne que l’occurrence, jamais la routine entière, et n’appelle aucun choix ; la routine entière, récurrence comprise, se modifie uniquement depuis le Journal (un seul chemin). [Remplace « Un choix « Cette occurrence seulement » / « Toute la routine » précède la sauvegarde », texte du 20/11/2026.] Seul le créneau de l’occurrence ouverte est coloré (en-tête et pastille), les autres sont grisés. Une occurrence commencée n’est pas modifiable. Règle de rendu, sans écran dédié : les créneaux non concernés sont grisés.
- Règles de figement et de protection des exceptions : D-536.
- **Suppression (D-537)** : dans l’Agenda, seule l’occurrence est supprimée. Dialogue « Supprimer cette occurrence » : titre seul, bouton « Confirmer » pleine largeur, bouton « Annuler » en haut à gauche, sans message. Une occurrence commencée ne peut pas être supprimée. Supprimer la dernière occurrence à venir laisse la routine dans le Journal, en gris.

## 9. Filtre par routine (20/11/2026)

Références Figma : « P-Calendrier — Semaine — Filtre par routine — Choix de la routine (proposition) » et « P-Calendrier — Semaine — Filtre par routine — Vue filtrée (proposition) ». Décision D-539 (chapitre 07). Besoin : n’afficher dans l’Agenda que les créneaux d’une ou de plusieurs routines.

- **Icône** : entonnoir (composant `icon/filtre-routine`, trait 1,5, zone de tap 34 × 34, sans cercle) sur la ligne 1 de la zone de contexte, au bord droit. Sans filtre : contour gris foncé. Filtre actif : silhouette pleine, bleue. Elle se distingue de l’icône à trois traits du filtre multicritère du Journal et des catalogues. **Comportement (20/11/2026, décision de Hermann)** : un toucher sur l’icône sans filtre ouvre la modale ; un toucher sur l’icône bleue (filtre actif) désactive le filtre, sans ouvrir la modale. Pour changer de filtre, on désactive puis on rouvre la modale.
- **Modale « Filtrer par routine »** : version simplifiée de l’écran Journal. En-tête avec le bouton de fermeture (✕) en haut à gauche et le titre. Le fond de la zone de contexte du Journal commence tout en haut de la modale (aucune zone blanche) ; l’en-tête (✕ et titre) est posé dessus, puis le champ de recherche, qui prend la largeur disponible, et le bouton de filtre et le bouton de tri alignés à droite (marge de 16 px), sans compteurs et sans le bouton « Planifier », avec le même fonctionnement que sur le Journal ([DSF Journal](DSF-JOURNAL-2026-11-19.md) § 2 et § 4). Une carte par routine, au format de la carte du Journal ([DSF Journal](DSF-JOURNAL-2026-11-19.md) § 3), réduite à la première ligne (nom) et à la troisième (« X à venir, jusqu’au jj/mm/aaaa »), avec le cadre de gauche (date de création) et un sélecteur à cocher à droite à la place du chevron et de la ligne 2. Sélection multiple. En bas, un bouton, sans trait de séparation : « Filtrer N routines » (« Filtrer 1 routine » au singulier) ; [remplacé le 20/11/2026 (décision de Hermann) : « quand aucune routine n’est cochée, « Afficher toutes les routines », qui retire le filtre (retenu par Claude) »] tant qu’aucune routine n’est cochée, le bouton est désactivé (état « Désactivé » du bouton primaire). Routines ayant au moins un créneau, archivées comprises, triées par ordre alphabétique (retenu par Claude). [Remplacé le 20/11/2026 (décision de Hermann) : « À la réouverture, les routines du filtre en cours sont cochées. »] La modale n’est ouverte que filtre inactif : elle s’ouvre toujours sans routine cochée, sans mémoire du filtre précédent.
- **Vue filtrée** : la zone de contexte est inchangée (« Aujourd’hui », mois, semaine, rangée des sept jours, « Planifier ») ; seule l’icône change (pleine, bleue). La liste n’affiche que les créneaux des routines choisies pour la semaine affichée ; un jour sans créneau de ces routines n’apparaît pas, et une semaine sans créneau affiche l’état vide existant de la vue Semaine. Les points des cartes de jour ne comptent que les séances des routines du filtre. Le filtre reste actif quand on change de semaine ou de mois et avec « Aujourd’hui » ; il reste actif tant qu’il n’est pas retiré, l’icône bleue le signale (retenu par Claude).
- Cartes, états, couleurs, déploiement, démarrer / rattraper, modification et suppression glissées : inchangés, soumis aux règles D-536 et D-537.

## 10. Créneau manqué, expiré et routine terminée (D-540, 20/11/2026)

- **Rattrapable** : un créneau non commencé dont la date est passée reste rouge, avec « Rattraper », jusqu’au début du créneau suivant de la même routine (créneau exécuté ou non entre-temps). Le dernier créneau d’une routine reste rattrapable 10 jours après sa date.
  [Précisé le 24/11/2026 (D-566) : « Rattraper » n'est plus un libellé mais l'icône de lecture, sur un cadre rouge.]
- **Expiré** : ensuite, le cadre reste rouge (séance manquée) et une étiquette rouge « Expirée » remplace le bouton « Rattraper » ; plus de « Démarrer » ni de « Rattraper ». Il reste visible dans l’Agenda passé, n’est pas modifié par un changement de la routine et est supprimé avec elle. L’état est calculé à l’affichage ; supprimer le créneau suivant recalcule la règle. Rendu de l’état expiré : écran « P-Calendrier — Semaine — Créneau expiré (proposition) » — cadre, bande et traits rouges inchangés, étiquette « Expirée » (76 × 24, fond rouge clair `#FCE6E6`, texte rouge `#B33838`) à la place du bouton, comme « Complétée », « Partielle » et « Arrêtée » pour un créneau commencé.
  [Précisé le 24/11/2026 (D-566) : l'icône Expirée (horloge) remplace l'icône de lecture, sans libellé ; le cadre reste rouge.]
- **Routine active ou terminée** : voir DSF Journal § 2. Pas d’archivage ni de restauration des routines.
- La durée de 10 jours est une constante, sans réglage dans le profil.

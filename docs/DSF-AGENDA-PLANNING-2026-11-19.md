# DSF — Agenda — Planning (proposition) — 19/11/2026

Référence Figma : écran « Agenda — Planning (proposition) » (`12580:27335`, 402 × 874), page Prototype MVP. Le Figma définit le rendu ; il ne crée pas de règle métier. Cette carte de routine remplace la carte d’occurrence de la vue Semaine (Agenda) du calendrier (CE-UI-03). Décision D-533 (chapitre 07) ; contrat d’écran CE-UI-15 (chapitre 13) ; onglets : D-532.

## 1. Barre de titre

Format défini par le [DSF Barre de titre à onglets](DSF-BARRE-TITRE-ONGLETS-2026-11-19.md). Onglets Journal · Agenda · Vue d’ensemble, au format des onglets des catalogues (libellés 17 px centrés ; onglet actif en gras sur fond arrondi). L’onglet actif est Agenda. En-tête et barre d’état teintés `#F7F7FF`, comme le catalogue des séances.

## 2. Zone de contexte

Bande 402 × 115 à y = 92, hauteur inchangée par rapport aux autres écrans. Dégradé lilas `#EAEAFF` opaque jusqu’à 80 % de la hauteur, puis transparent en bas (identique à la zone de contexte de « Planifier une séance »). Marges gauche et droite de 16 px. Trois lignes centrées verticalement, espacées de 6 px :

| Ligne | Contenu |
|---|---|
| 1 — mois | Double flèche de mois à chaque bord ; « Novembre 2026 » au centre, Inter 18 semi-gras. |
| 2 — semaine | Flèches simples rapprochées du centre (centres à x = 96 et x = 306), de façon à former un entonnoir sous la ligne du mois ; « du 16 au 22 » au centre, même style que le mois ; flèches et texte centrés sur le même axe. [Précisé le 19/11/2026 au soir (s19-mois) : à cheval sur deux mois, seul le mois de fin — « du 26 au 1er novembre ».] |
| 3 | « Aujourd’hui » en texte seul (Inter 14 normal, gris, sans bouton ni fond), centré ; bouton « Planifier » 32 × 32 à droite (x = 354). |

## 3. Rangée des jours

Sept cartes 46 × 64 sous la bande, sur toute la largeur (écart 8 px). Contenu centré verticalement : jour abrégé (13), numéro (22 semi-gras), un point de 5 px par séance du jour. La carte du jour sélectionné est pleine.

## 4. Liste

Regroupée par jour. [Recette du 20/11/2026 (constat C) : la liste continue sur les semaines suivantes ; le carrousel des jours suit le défilement.] En-tête de jour Inter 13. Un trait fin pleine largeur sépare deux jours, à 5 px au-dessus de la date ; aucun trait entre deux routines. Écart entre routines : 8 px ; ligne de routine : 52 px de haut. Liste à 14 px sous la rangée des jours.

## 5. Carte d’une routine

- **Bloc heure / durée** (à gauche) : l’heure au format « 8h00 », « 14h00 » (Inter 15, noir, sans zéro initial), puis, dessous, le symbole du chronomètre (14 px) à gauche de la durée (13, gris). Le bloc est encadré par un cadre sans liseré qui part du bord gauche de l’écran, centré verticalement sur le bloc, avec un trait vertical épais de 6 px à son bord gauche, de la même teinte en plus foncé.
- **Bande** : une bande horizontale de la couleur du cadre, à 18 % d’opacité, prolonge le cadre sur toute la largeur de la carte jusqu’au bord droit de l’écran, avec à droite le même trait vertical épais de 6 px qu’à gauche.
- **Teinte du cadre et du trait** — rendu proposé : vert clair pour une séance faite, rouge clair pour une séance manquée, gris clair pour une séance prévue. [Remplacé le 19/11/2026 au soir (Hermann, constat D) : exécutée complète, passée ou future → vert ; exécutée partielle → orange ; abandonnée (arrêtée) → gris ; passée non exécutée → rouge ; future non exécutée → bleu.]
- **Chevron** : un chevron de 16 px à gauche du nom, aligné sur lui, ouvre ou ferme le déployé ; il pointe vers la droite carte fermée, vers le bas carte déployée. Le nom est décalé de 18 px ; la ligne 2 reste alignée sur le bord gauche du chevron.
- **Titre** : nom de la routine, 16 noir. **Ligne 2** : « Spécialité · zones corporelles », 13 gris, le point étant centré horizontalement et verticalement entre les deux (6 px de chaque côté) ; une ou deux zones, le signe « + » si les zones ne tiennent pas ; spécialité abrégée au besoin (« Kiné »).
- **À droite** : étiquette « Terminée » pour une séance faite ; bouton « Démarrer » pour une séance prévue ou manquée. [Remplacé le 19/11/2026 au soir (s19-passees, constat G) : étiquette « Complétée », « Partielle » ou « Arrêtée » selon le statut d'exécution de la ou des séances ; « Démarrer » pour une occurrence non exécutée, passée ou future. Navigation (constat B) : le cadre de gauche ouvre la planification, le centre déploie, la droite porte l'action.] Le texte du bouton et celui de l’étiquette sont alignés en bas avec le texte de la ligne 2.

## À clarifier

- Condition d’affichage de « Aujourd’hui » : proposée visible seulement hors de la semaine en cours.
- Comportement du changement de mois sur la semaine affichée : proposé = première semaine du mois.
- Logique des couleurs (teinte du cadre) : à définir par Hermann ; les valeurs ci-dessus sont provisoires.
- « Spécialité » n’existe pas dans le modèle de données fonctionnel : propriété, liste de valeurs et abréviations à définir avant tout développement.
- États de l’ancienne carte Semaine : voir § 6 pour la déclinaison proposée (déployé, actions glissées) ; la récurrence dans le détail déployé, la zone de déploiement et la zone « Démarrer » distincte ne sont pas repris : à conserver, déplacer ou retirer, à arbitrer.
- Journal : voir [DSF Journal](DSF-JOURNAL-2026-11-19.md) (D-535). [Texte d’origine remplacé le 19/11/2026 : « Vues Journal (carte compacte 298 × 46) et Vue d’ensemble : inchangées ».] Vue d’ensemble : inchangée tant qu’aucune décision ne la concerne.

## 6. Déclinaison aux écrans du calendrier (19/11/2026)

La zone de contexte (§ 2), la rangée des jours (§ 3), la liste regroupée par jour (§ 4) et la carte (§ 5) s’appliquent à tous les écrans de la vue Semaine (Agenda) et aux fonds des modales de suppression. Chaque écran garde son état propre :

- **Séance déployée** : la carte de § 5 reste telle quelle ; seul le complément de composition du catalogue (« P-Catalogue des séances — Séance déployée ») est ajouté en dessous : filet de séparation, puis la liste des exercices de la séance avec ses cycles et circuits. [Recette du 20/11/2026 (r20-recap) : sans filet ni espace quand rien ne le précède ; le nom de chaque séance est toujours affiché, même seule. Routine à plusieurs séances : repère « P » cerclé devant le nom de la carte (constat A).] Le détail est inséré dans le flux de la liste ; les routines suivantes sont repoussées.
- **Actions glissées** : la carte glisse vers la gauche de 180 px et découvre « Dupliquer » (gris) et « Supprimer » (rouge), 86 × 54 chacune [90 × 52 avant le 19/11/2026], séparées de la carte par 8 px. [Précisé le 19/11/2026 au soir (s19-glisse) : coins du bloc arrondis, marge de 16 px avec le bord droit de l'écran.]
- **Récurrence au déployé** : [retirée de l'Agenda le 19/11/2026 au soir (constat A) ; elle est affichée dans le déployé du Journal.]
- **Après suppression** : la routine supprimée disparaît de la liste et son point de la carte du jour ; les points restants sont recentrés. [Recette du 20/11/2026 (constat D) : l'Agenda ne supprime que l'occurrence (« Supprimer cette occurrence »), la routine reste au Journal.]
- **Jour sélectionné** : la carte du jour est pleine ; la liste commence à la date sélectionnée.

Ces déclinaisons sont du rendu, sans règle métier nouvelle. Les écrans Jour et Mois ne sont pas modifiés par ce paragraphe.

## 7. Routine à plusieurs séances : une carte, un enchaînement (D-534, 19/11/2026)

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

[Mise en œuvre du 20/11/2026 — D-539 (filtre par routine, § 9 de la branche `docs/planification-grille-creneaux`, commit 562a5a0d, non fusionnée) : entonnoir à droite de la ligne 1 (contour gris, plein bleu filtre actif) ; modale « Filtrer par routine » (carte du Journal réduite au nom et à « X à venir, jusqu’au jj/mm/aaaa », case à cocher, sélection multiple, « Filtrer N routines » / « Afficher toutes les routines ») ; vue filtrée : liste et points réduits aux routines choisies, filtre conservé jusqu’à son retrait. Classe A ; choix retenus par Claude non promus (D-539) ; rapport `2026-11-20_AGENDA-FILTRE-ROUTINE.md`.]

[Recette du 20/11/2026 (Hermann) — carte de l'Agenda : pastille des zones corporelles devant la ligne 2 ; repère « P » d'un parcours après le nom, cercle affiné (trait 1). Classe B ; rapport `2026-11-20_AGENDA-CARTE-REPERES.md`.]

[Mise en œuvre du 20/11/2026 — D-539 mis à jour (branche `docs/planification-grille-creneaux`, commit 8ecd17fc, non fusionnée) : toucher l'icône bleue désactive le filtre sans ouvrir la modale ; la modale s'ouvre toujours sans routine cochée ; bouton « Filtrer N routines » désactivé sans sélection ; « Afficher toutes les routines » retiré. Cartes de la modale : nom aligné sur la date, ligne des créneaux sur l'année (recette du 20/11/2026). Rapport `2026-11-20_AGENDA-FILTRE-ROUTINE-COMPORTEMENT.md`.]

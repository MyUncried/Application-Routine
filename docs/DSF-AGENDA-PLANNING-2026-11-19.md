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

Regroupée par jour. En-tête de jour Inter 13. Un trait fin pleine largeur sépare deux jours, à 5 px au-dessus de la date ; aucun trait entre deux routines. Écart entre routines : 8 px ; ligne de routine : 52 px de haut. Liste à 14 px sous la rangée des jours.

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

- **Séance déployée** : la carte de § 5 reste telle quelle ; seul le complément de composition du catalogue (« P-Catalogue des séances — Séance déployée ») est ajouté en dessous : filet de séparation, puis la liste des exercices de la séance avec ses cycles et circuits. Le détail est inséré dans le flux de la liste ; les routines suivantes sont repoussées.
- **Actions glissées** : la carte glisse vers la gauche de 180 px et découvre « Dupliquer » (gris) et « Supprimer » (rouge), 86 × 54 chacune [90 × 52 avant le 19/11/2026], séparées de la carte par 8 px. [Précisé le 19/11/2026 au soir (s19-glisse) : coins du bloc arrondis, marge de 16 px avec le bord droit de l'écran.]
- **Récurrence au déployé** : [retirée de l'Agenda le 19/11/2026 au soir (constat A) ; elle est affichée dans le déployé du Journal.]
- **Après suppression** : la routine supprimée disparaît de la liste et son point de la carte du jour ; les points restants sont recentrés.
- **Jour sélectionné** : la carte du jour est pleine ; la liste commence à la date sélectionnée.

Ces déclinaisons sont du rendu, sans règle métier nouvelle. Les écrans Jour et Mois ne sont pas modifiés par ce paragraphe.

## 7. Routine à plusieurs séances : une carte, un enchaînement (D-534, 19/11/2026)

Une routine planifiée avec plusieurs séances et un nom produit **une seule carte par occurrence** : le nom de la routine en titre, l’heure et la durée totale ; les séances sont listées dans le déployé. Dupliquer et Supprimer s’appliquent à la routine.

« Démarrer » enchaîne les séances dans l’ordre de la liste, sans modifier le moteur d’exécution : chaque séance reste une exécution complète et indépendante, avec son propre historique. Entre deux séances, l’écran de transition est l’écran de démarrage de la séance suivante, recouvert d’un voile vert translucide portant, dans un encadré vert plein, le texte « Appuyer pour démarrer la 2è séance du parcours » (rang calculé). Aucune information sur la séance ou le parcours n’est ajoutée aux écrans d’exécution eux-mêmes. Écran Figma : « Exécution d’une séance — Initial — Enchaînement (proposition) ».

Si l’utilisateur arrête une séance, la suite lui est proposée (« Passer à la suivante » ou « Terminer ») : formulation et dessin à définir. Après une reprise sur interruption, seule la séance interrompue est reprise.

[Complété le 19/11/2026 au soir (s19-voile, constat F) : le premier écran de démarrage présente le parcours (« Séance 1 », « Séance 2 »… avec leurs noms), avec Démarrer et Retour ; les séances intermédiaires n’ont pas de « Fin de séance » — l’écran « Séance terminée » s’affiche, puis l’écran de transition de la séance suivante s’ouvre automatiquement.]

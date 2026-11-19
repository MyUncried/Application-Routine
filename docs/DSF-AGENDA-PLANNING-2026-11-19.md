# DSF — Agenda — Planning (proposition) — 19/11/2026

Référence Figma : écran « Agenda — Planning (proposition) » (`12580:27335`, 402 × 874), page Prototype MVP. Le Figma définit le rendu ; il ne crée pas de règle métier. Décision D-533 (chapitre 07) ; contrat d’écran CE-UI-15 (chapitre 13) ; onglets : D-532.

## 1. Barre de titre

Onglets Journal · Agenda · Vue d’ensemble, au format des onglets des catalogues (libellés 17 px centrés ; onglet actif en gras sur fond arrondi). L’onglet actif est Agenda. En-tête et barre d’état teintés `#F7F7FF`, comme le catalogue des séances.

## 2. Zone de contexte

Bande 402 × 115 à y = 92, hauteur inchangée par rapport aux autres écrans. Dégradé lilas `#EAEAFF` opaque jusqu’à 80 % de la hauteur, puis transparent en bas (identique à la zone de contexte de « Planifier une séance »). Marges gauche et droite de 16 px. Trois lignes centrées verticalement, espacées de 6 px :

| Ligne | Contenu |
|---|---|
| 1 — mois | Double flèche de mois à chaque bord ; « Novembre 2026 » au centre, Inter 18 semi-gras. |
| 2 — semaine | Flèches simples rapprochées du centre (centres à x = 96 et x = 306), de façon à former un entonnoir sous la ligne du mois ; « du 16 au 22 » au centre, même style que le mois ; flèches et texte centrés sur le même axe. |
| 3 | « Aujourd’hui » en texte seul (Inter 14 normal, gris, sans bouton ni fond), centré ; bouton « Planifier » 32 × 32 à droite (x = 354). |

## 3. Rangée des jours

Sept cartes 46 × 64 sous la bande, sur toute la largeur (écart 8 px). Contenu centré verticalement : jour abrégé (13), numéro (22 semi-gras), un point de 5 px par séance du jour. La carte du jour sélectionné est pleine.

## 4. Liste

Regroupée par jour. En-tête de jour Inter 13. Un trait fin pleine largeur sépare deux jours, à 5 px au-dessus de la date ; aucun trait entre deux routines. Écart entre routines : 8 px ; ligne de routine : 52 px de haut. Liste à 14 px sous la rangée des jours.

## 5. Carte d’une routine

- **Bloc heure / durée** (à gauche) : l’heure au format « 8h00 », « 14h00 » (Inter 15, noir, sans zéro initial), puis, dessous, le symbole du chronomètre (14 px) à gauche de la durée (13, gris). Le bloc est encadré par un cadre sans liseré qui part du bord gauche de l’écran, centré verticalement sur le bloc, avec un trait vertical épais de 6 px à son bord gauche, de la même teinte en plus foncé.
- **Teinte du cadre et du trait** — rendu proposé : vert clair pour une séance faite, rouge clair pour une séance manquée, gris clair pour une séance prévue.
- **Titre** : nom de la routine, 16 noir. **Ligne 2** : « Spécialité · zones corporelles », 13 gris, le point étant centré horizontalement et verticalement entre les deux (6 px de chaque côté) ; une ou deux zones, le signe « + » si les zones ne tiennent pas ; spécialité abrégée au besoin (« Kiné »).
- **À droite** : étiquette « Terminée » pour une séance faite ; bouton « Démarrer » pour une séance prévue ou manquée.

## À clarifier

- Condition d’affichage de « Aujourd’hui » : proposée visible seulement hors de la semaine en cours.
- Comportement du changement de mois sur la semaine affichée : proposé = première semaine du mois.
- Logique des couleurs (teinte du cadre) : à définir par Hermann ; les valeurs ci-dessus sont provisoires.
- « Spécialité » n’existe pas dans le modèle de données fonctionnel : propriété, liste de valeurs et abréviations à définir avant tout développement.

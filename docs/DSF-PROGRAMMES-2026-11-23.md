# DSF — Programmes : période, routines, rattachement (23/11/2026)

Décisions de Hermann du 23/11/2026 (D-577 à D-579, registre, chapitre 07 ; numérotées D-560 à D-562 jusqu’au 24/11/2026, puis renumérotées à la consolidation). Écrans Figma : « PROG — 13 Créer ou configurer un programme » (période et routines), « P-Planifier une séance — Choix du programme (proposition) » (rattachement). Le Programme reste facultatif (D-332).

## 1. Définition de la période d'un programme (D-577)

Écran « PROG — 13 Créer ou configurer un programme », carte Période. Trois lignes :

[Remplacé en partie le 23/11/2026 (contre-recettes 4 et 5, report du 24/11/2026) — D-581 : le calendrier des dates est celui de Planifier, en popover, sans marquage de la période (Hermann : « Pour le calendrier du programme utilisé exactement celui de la planification (format, dimensions). On oublie le marquage des périodes dans le calendrier. ») ; D-582 : « Du » en 15, dates en pastilles, « au » / « pendant » basculé d’un toucher (pas de menu), unité en pastille qui passe à la suivante à chaque toucher (jours → semaines → mois) avec conversion automatique de la valeur, nombre à la roulette ; en mode « pendant », ligne d’information « Se termine le … » (jours), « X jours, se termine le … » (semaines), « X semaines, se termine le … » (mois). Texte d’origine conservé ci-dessous.]

1. **« Du [date] »** : date de début, toujours présente.
2. **Au choix : « au [date] »** (fin) **ou « pendant [N] [jours / semaines / mois] »** (durée). Le mot « au » ou « pendant » est une valeur modifiable qui ouvre un petit menu pour changer de mode.
3. **Ligne d'information en gris, non modifiable** :
   - mode dates : « N jours, soit S semaines », plus « et J jour(s) » si N n'est pas un multiple de 7 (92 jours : « 92 jours, soit 13 semaines et 1 jour » ; 91 jours : « 91 jours, soit 13 semaines ») ; moins d'une semaine : « N jours » seul ;
   - mode durée : « Se termine le 14 décembre 2026 ».

Règles :
- La fin est comprise dans la période : durée en jours ou semaines = début + N − 1 jour (une semaine = 7 jours) ; durée en mois = du même quantième du mois suivant moins un jour (du 15 septembre pendant 3 mois : fin le 14 décembre) ; si le quantième n'existe pas, dernier jour du mois (31 janvier + 1 mois : 28 février).
- Changement de mode : la période est conservée. De dates vers durée, elle s'exprime en jours, ou en semaines si le nombre de jours est un multiple de 7.
- Bornes : la fin ne précède pas le début ; la durée est d'au moins 1.
- Raccourcir la période : si des créneaux d'une planification dépassent la nouvelle fin, une confirmation indique « N créneaux seront supprimés ».

État Figma : le mode dates et la ligne « N jours, soit S semaines » sont dessinés ; le mode « pendant » n'est pas dessiné (à réaliser d'après cette spécification). Le bloc passe de 44 à 64 de hauteur (mode dates).

## 2. Routines d'un programme (D-578)

Carte « Planifications » de l'écran « PROG — 13 Créer ou configurer un programme » : chaque routine est présentée au format des routines du Journal.

- [Remplacé le 23/11/2026 par D-583 (Hermann : « la date affichée dans le cadre doit être celle du début de la routine pour le programme » ; « Le texte doit afficher le nombre de créneaux dans le programme et la date de fin (jour et mois) » ; « la date de fin de la routine affichée dans le programme ne peut pas excéder la date de fin du programme ») : cadre = début de la routine dans le programme ; seconde ligne « N créneaux, jusqu’au 15 déc. », fin bornée par celle du programme. Texte d’origine conservé ci-dessous.]
- **Cadre à gauche** (80 × 44) : date de création de la routine, jour et mois abrégé en gras (« 12 sept. »), année dessous (« 2026 ») ; trait d'état épais à gauche (6 × 44) ; bande de prolongement jusqu'au trait d'état épais à droite (6 × 44), couleurs de l'état « prévu » du Journal.
- **Bloc de texte**, à 14 du cadre : nom de la routine (Inter Semi Bold 15) ; seconde ligne (Inter Regular 12) = synthèse de la répétition, **« du X au Y »** : jours en chiffres, mois en toutes lettres, sans l'année (« du 15 septembre au 15 décembre »). La fréquence (« tous les jours », « tous les lundis ») et l'heure ne sont plus affichées sur la ligne.
- Deux routines en exemple ; 8 d'écart entre les lignes ; les actions « + Planifier une séance » et « Rattacher une routine existante » restent sous les routines, séparées par un filet.
- Le trait et le cadre restent à l'intérieur de la carte (flush avec ses bords).

## 3. Rattachement d'un programme lors de la planification (D-579)

La ligne « Programme » de l'écran « P-Planifier une séance — Création » ouvre une **modale « Rattacher un programme »** (écran Figma « P-Planifier une séance — Choix du programme (proposition) »), à la place du menu iOS.

- Feuille modale iOS sur la zone de contexte du catalogue des programmes : bouton ✕ Annuler en haut à gauche avec son halo (courbure de la zone de contexte), titre centré « Rattacher un programme », **pas de bouton Valider**.
- Contenu : champ Rechercher, filtre et tri, libellé « Actifs 2 · Terminés 1 », puis les cartes du « PROG — 7 Catalogue des programmes — Liste » (nom, période · état, nombre de planifications et de séances).
- **Sélection unique** : un bouton radio (composant DSF / Controls / Radio) à droite de chaque carte. Toucher une carte non sélectionnée la sélectionne et ferme la modale. Toucher la carte déjà sélectionnée retire le rattachement (valeur « Aucun », D-332) et ferme la modale. À l'ouverture, le programme actuel est sélectionné.
- Le Programme reste facultatif ; sa période borne les dates (D-332).

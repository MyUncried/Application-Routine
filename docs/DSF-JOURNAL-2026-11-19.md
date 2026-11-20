# DSF — Journal des routines (Calendrier)

Date : 19/11/2026 — décision D-535 (registre, ch07). Écran Figma : « Calendrier — Journal — MVP ».
Remplace la vue Jour du calendrier (supprimée le 19/11/2026). Rendu non vérifié visuellement (contrôle géométrique seul).

## 1. Contenu

Le Journal est la **liste des routines créées**, et non leur planification dans le temps. Une carte par routine. Aucune séparation horizontale, aucune date de regroupement, aucun bouton d’action (Terminer, Démarrer…) ; les cartes sont espacées de 8 px.

## 2. Zone de contexte

Bande de 402 × 115 (inchangée), onglet « Journal » actif (voir DSF Barre de titre à onglets).
- Ligne 1 : « Actives N · Terminées N » (compteurs). **D-540 (20/11/2026)** : une routine est active si elle a au moins un créneau à venir ou rattrapable, terminée sinon (état calculé). La liste n’affiche par défaut que les routines actives ; les terminées s’obtiennent avec le statut « Terminées » du filtre [remplace « Archivées »].
- Ligne 2 : champ Rechercher, contrôle Filtre, contrôle Tri, bouton Planifier.
- Aucune navigation par date.

## 3. Carte de routine

Famille de la carte d’agenda (DSF Agenda § 5), hauteur 72, teinte unique `#EAEAFF` (couleur de l’onglet Journal sélectionné) pour le cadre et la bande, repères épais gauche et droite en bleu-violet moyen.
- Colonne gauche (cadre) : **date de création** de la routine.
- Ligne 1 : nom de la routine (16), précédé du chevron de déploiement.
- Ligne 2 : spécialité · symbole des zones corporelles (silhouette `icon/zone-corporelle`, 16 × 16, sans cercle) suivi des zones.
- Ligne 3 : « X à venir, jusqu’au jj/mm/aaaa » (X = nombre d’occurrences à venir).
- Pas de bouton à droite de la carte. [Bouton « Modifier la planification » (crayon, composant `DSF / Actions / Édition — carré`) retiré le 20/11/2026 : il n’est plus nécessaire.]

## 4. Comportement

- Toucher la carte (ou le chevron) la **déploie** : le déployé commence par la **phrase de récurrence** de la routine (ch10, RM de la phrase de récurrence ; ex. « Chaque lundi et jeudi »), puis les séances, chacune avec sa composition comme dans l’Agenda et le catalogue (filet de séparation, exercices, cycles et circuits).
- Le cadre de gauche (date) **ouvre la routine** [anciennement le bouton « Modifier la planification », retiré le 20/11/2026 ; comportement du cadre à confirmer dans le code].
- Tri par défaut : date de création / modification, la plus récente en haut.
- Filtres : spécialité, catégorie, format, zones corporelles, programme.
- « Active » : la routine a au moins une occurrence en cours ou à venir ; « Terminée » : sa récurrence est arrivée à son terme (plus aucune occurrence à venir). Définition retenue par Claude (19/11/2026) ; une routine sans date de fin reste active.

## 5. Modifier la routine depuis le Journal (D-536)

La modification porte toujours sur la routine entière, sans choix. Elle ne s’applique qu’aux occurrences **non commencées** ; les occurrences commencées (une séance lancée) restent inchangées, séquence et statut. Un changement global ne remplace que les réglages non modifiés à la main sur l’occurrence, par groupe : date et heure ; séances ; rappel. À la sauvegarde : « N créneaux non commencés seront modifiés. ». Les occurrences à venir déjà modifiées à la main (exceptions) restent comptées dans « X à venir ».

## 6. Suppression d’une routine (D-537)

Une occurrence commencée n’est jamais supprimée. Routine sans occurrence commencée : supprimée avec toutes ses occurrences (« La routine et ses N créneaux seront supprimés. »). Routine avec au moins une occurrence commencée : ses occurrences non commencées sont supprimées, la routine est archivée (filtre « Archivées »), son historique est conservé (« N créneaux non commencés seront modifiés ; La routine sera archivée. ») [remplacé le 20/11/2026 par D-540 : plus d’archivage ; la routine devient terminée (filtre « Terminées ») ; message « N créneaux non commencés seront supprimés. La routine sera terminée. » ; l’action glissée « Archiver » est supprimée, « Supprimer » reste ; les deux écrans Figma de suppression portent encore l’ancien libellé]. Un seul dialogue : titre « Supprimer cette routine », message (selon la présence d’historique), « Confirmer », « Annuler » en haut à gauche. Écrans Figma : « P-Modal — Supprimer une routine — Journal » (sans historique), « P-Modal — Supprimer et archiver une routine — Journal » (avec historique) : deux messages du même dialogue. Composant : `DSF / Overlays / Confirmation`, variantes « Titre seul » et « Titre et message ».

## 7. À clarifier

- Écran de filtre du Journal (valeurs des cinq critères) : non dessiné.
- « Spécialité » : propriété à définir (voir DSF Agenda).
- Code couleur des cartes : proposé = bleu s’il reste des occurrences à venir, gris sinon (teinte de l’Agenda pour le futur) ; non arbitré, la teinte actuelle `#EAEAFF` est provisoire. Compteurs : « Actives · Terminées » ne couvre pas une routine jamais planifiée.

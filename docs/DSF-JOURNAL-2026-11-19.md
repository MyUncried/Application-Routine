# DSF — Journal des routines (Calendrier)

Date : 19/11/2026 — décision D-535 (registre, ch07). Écran Figma : « Calendrier — Journal — MVP ».
Remplace la vue Jour du calendrier (supprimée le 19/11/2026). Rendu non vérifié visuellement (contrôle géométrique seul).

## 1. Contenu

Le Journal est la **liste des routines créées**, et non leur planification dans le temps. Une carte par routine. Aucune séparation horizontale, aucune date de regroupement, aucun bouton d’action (Terminer, Démarrer…) ; les cartes sont espacées de 8 px.

## 2. Zone de contexte

Bande de 402 × 115 (inchangée), onglet « Journal » actif (voir DSF Barre de titre à onglets).
- Ligne 1 : « Actives N · Terminées N » (compteurs). [« Planifiées N · Terminées N » depuis la recette du 19/11/2026 au soir (j1-compteurs).]
- Ligne 2 : champ Rechercher, contrôle Filtre, contrôle Tri, bouton Planifier.
- Aucune navigation par date.

## 3. Carte de routine

Famille de la carte d’agenda (DSF Agenda § 5), hauteur 72, teinte unique `#EAEAFF` (couleur de l’onglet Journal sélectionné) pour le cadre et la bande, repères épais gauche et droite en bleu-violet moyen. [Remplacé le 19/11/2026 au soir (constat E) : bleu pour une routine planifiée (au moins une occurrence à venir), gris sinon.]
- Colonne gauche (cadre) : **date de création** de la routine.
- Ligne 1 : nom de la routine (16), précédé du chevron de déploiement.
- Ligne 2 : spécialité · zones corporelles. [Recette du 20/11/2026 (r20-j-deploye) : précédée du symbole des zones corporelles.]
- Ligne 3 : récurrence (ex. « Chaque lundi et jeudi · jusqu’au 28 déc. »). [Remplacé le 20/11/2026 (r20-j-deploye) : « N créneaux, du X mois au Y mois », « Aucun créneau à venir » ; la récurrence reste au déployé. Routine à plusieurs séances : repère « P » cerclé devant le nom (constat A).]
- À droite : bouton « Modifier la planification » — composant `DSF / Actions / Édition — carré` (32 × 32, crayon `icon/modifier`, fond `#F3F4F9`, coins 10). [Retiré le 20/11/2026 (r20-j-navigation, r20-j-deploye : « Retirer le crayon ») ; le cadre de gauche ouvre la planification.]

## 4. Comportement

- Toucher la carte (ou le chevron) la **déploie** : le déployé est identique à celui de l’Agenda et du catalogue des séances (filet de séparation, puis composition de la séance : exercices, cycles et circuits). [Recette du 19/11/2026 au soir : cadre de gauche → planification, centre → déployer, droite → crayon (constat B) ; le déployé commence par la récapitulation des jours planifiés (constat A) et « N occurrences à venir · du … au … » (constat E) ; glisser vers la gauche découvre Dupliquer et Supprimer (constat C).] [Recette du 20/11/2026 (r20-j-deploye) : sans filet en tête ; récapitulation sans symbole ; plus de ligne « N occurrences à venir » ; séances d'un parcours rapprochées. Supprimer (constat D) : « Supprimer cette routine », « La routine et ses N créneaux seront supprimés. »]
- Le bouton « Modifier la planification » **ouvre la routine**.
- Tri par défaut : date de création / modification, la plus récente en haut.
- Filtres : spécialité, catégorie, format, zones corporelles, programme.
- « Active » : la routine a au moins une occurrence en cours ou à venir ; « Terminée » : sa récurrence est arrivée à son terme (plus aucune occurrence à venir). Définition retenue par Claude (19/11/2026) ; une routine sans date de fin reste active.

## 5. À clarifier

- Écran de filtre du Journal (valeurs des cinq critères) : non dessiné.
- « Spécialité » : propriété à définir (voir DSF Agenda).

[Contre-recette du 20/11/2026 et missions D-536 / D-537 (classe B, registre ch07) :
- carte, ligne 3 : précédée du symbole du calendrier (r21-j-carte) ;
- déployé : sans répétition, ni ligne vide ni filet sous le cadre ; nom de chaque séance toujours affiché (r21-j-deploye) ;
- glisser vers la gauche : la liste reste figée (constat A) ;
- modifier la routine : confirmation « N créneaux à venir seront modifiés. » ; seules les occurrences non commencées changent, et seulement dans les groupes non modifiés à la main (D-536) ;
- supprimer : sans historique, « La routine et ses N créneaux seront supprimés. » ; avec historique, « N créneaux non commencés seront supprimés ; La routine sera archivée. » ; sans créneau à supprimer, titre « La routine <nom> sera supprimée » sans message ; « Annuler » en haut à gauche, « Confirmer » pleine largeur (D-537, `DSF / Overlays / Confirmation` « Titre seul » / « Titre et message ») ;
- routine archivée : visible avec le filtre « Archivées » seulement.]

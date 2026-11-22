# DSF — Journal des routines (Calendrier)

Date : 19/11/2026 — décision D-535 (registre, ch07). Écran Figma : « Calendrier — Journal — MVP ».
Remplace la vue Jour du calendrier (supprimée le 19/11/2026). Rendu non vérifié visuellement (contrôle géométrique seul).

## 1. Contenu

Le Journal est la **liste des routines créées**, et non leur planification dans le temps. Une carte par routine. Aucune séparation horizontale, aucune date de regroupement, aucun bouton d’action (Terminer, Démarrer…) ; les cartes sont espacées de 8 px.

## 2. Zone de contexte

Bande de 402 × 115 (inchangée), onglet « Journal » actif (voir DSF Barre de titre à onglets).
- Ligne 1 : « Actives N · Terminées N » (compteurs). [« Planifiées N · Terminées N » depuis la recette du 19/11/2026 au soir (j1-compteurs).] [Recette du 21/11/2026 (Hermann : « Cliquer sur Actives ou Terminées doit filtrer la liste ») : chaque libellé filtre la liste sur ce statut, comme la bascule « Un exercice · Plusieurs » du Catalogue (libellé actif en bleu ; retoucher le retire) ; sans choix, la liste par défaut (routines actives, D-540).]
- Ligne 2 : champ Rechercher, contrôle Filtre, contrôle Tri, bouton Planifier.
- Aucune navigation par date.

## 3. Carte de routine

Famille de la carte d’agenda (DSF Agenda § 5), hauteur 72, teinte unique `#EAEAFF` (couleur de l’onglet Journal sélectionné) pour le cadre et la bande, repères épais gauche et droite en bleu-violet moyen. [Remplacé le 19/11/2026 au soir (constat E) : bleu pour une routine planifiée (au moins une occurrence à venir), gris sinon.]
- Colonne gauche (cadre) : **date de création** de la routine.
- Ligne 1 : nom de la routine (16), précédé du chevron de déploiement.
- Ligne 2 : spécialité · zones corporelles. [Recette du 20/11/2026 (r20-j-deploye) : précédée du symbole des zones corporelles.]
- Ligne 3 : récurrence (ex. « Chaque lundi et jeudi · jusqu’au 28 déc. »). [Remplacé le 20/11/2026 (r20-j-deploye) : « N créneaux, du X mois au Y mois », « Aucun créneau à venir » ; la récurrence reste au déployé [retirée du déployé le 21/11/2026, a31-journal]. [Recette du 22/11/2026 (constat c — Hermann : « la mention d'une entrée à venir dans le journal et du filtre est incorrecte (cela doit faire mention des occurrences planifiées) ») : un créneau à venir déjà exécuté (séance faite en avance) n'est plus compté, ici comme dans la modale « Filtrer par routine » de l'Agenda.] Routine à plusieurs séances : repère « P » cerclé devant le nom (constat A).]
- À droite : bouton « Modifier la planification » — composant `DSF / Actions / Édition — carré` (32 × 32, crayon `icon/modifier`, fond `#F3F4F9`, coins 10). [Retiré le 20/11/2026 (r20-j-navigation, r20-j-deploye : « Retirer le crayon ») ; le cadre de gauche ouvre la planification.]

## 4. Comportement

- Toucher la carte (ou le chevron) la **déploie** : le déployé est identique à celui de l’Agenda et du catalogue des séances (filet de séparation, puis composition de la séance : exercices, cycles et circuits). [Recette du 19/11/2026 au soir : cadre de gauche → planification, centre → déployer, droite → crayon (constat B) ; le déployé commence par la récapitulation des jours planifiés (constat A) et « N occurrences à venir · du … au … » (constat E) ; glisser vers la gauche découvre Dupliquer et Supprimer (constat C).] [Recette du 20/11/2026 (r20-j-deploye) : sans filet en tête ; récapitulation sans symbole ; plus de ligne « N occurrences à venir » ; séances d'un parcours rapprochées.] [Recette du 21/11/2026 (a31-journal — Hermann : « supprimer la première ligne avec les jours de la semaine affichés (informations visible en regardant la planification) ») : plus de récapitulation des jours planifiés en tête du déployé. Validation d'une modification sans changement : ni message de confirmation ni enregistrement ; « Annuler » et « Confirmer » côte à côte, même taille, dans « Modifier cette routine » (Hermann : « mettre « Annuler » sur la même ligne que « Confirmer », avec les mêmes dimensions »). Supprimer (constat D) : « Supprimer cette routine », « La routine et ses N créneaux seront supprimés. »] [Recette du 22/11/2026 (r22-j-supprimer — Hermann : « Journal : Changer le Nom de l'option glisser gauche, de Supprimer à Terminer. Modifier le titre de la fenêtre de dialogue avec "Terminer cette routine". ») : action glissée « Terminer », fenêtre « Terminer cette routine » ; messages et effet inchangés (D-537, D-540). Constat d (Hermann : « Modifier la séquence d'un parcours (déjà exécuté / ou pas) modifie la séquence de son nom sans qu'on s'en rende compte. Un message de type snackbar pour informer "Le nom du parcours a été changé pour refléter l'ordre des séances", pendant 1 seconde. ») : message noir temporaire d'une seconde, sans action, sur le Journal, quand l'enregistrement change le nom généré.]
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

[Recette du 20/11/2026 (Hermann) : repère « P » d'un parcours après le nom, cercle affiné, comme l'Agenda. Classe B ; rapport `2026-11-20_JOURNAL-REPERE-PARCOURS.md`.] [Conservé le 21/11/2026 (D-553) : Ⓟ après le nom de Routine ; Figma `12736:25026`.]

[Mise en œuvre du 20/11/2026 — D-540 (§ 2 et § 6 de la branche `docs/planification-grille-creneaux`, commit 171f9ca3, non fusionnée) : routine active (créneau à venir ou rattrapable) ou terminée, état calculé ; liste par défaut = actives ; statut « Terminées » du filtre ; compteurs « Actives · Terminées » ; plus d'archivage : suppression avec historique = créneaux non commencés retirés, « N créneaux non commencés seront supprimés. La routine sera terminée. ». Classe A ; rapport `2026-11-20_CYCLE-VIE-ROUTINE.md`.]

[Recette du 20/11/2026 (Hermann) : fenêtre « Supprimer cette routine » — « Annuler » et « Confirmer » côte à côte, même format. [« Annuler » en haut à gauche — remplacé.]]

## Évolution validée du 21/11/2026 — Journal / filtre

La représentation du Journal reste **une carte par Routine**. Une Routine à plusieurs Séances (Parcours) est présentée sur **une seule ligne** avec le symbole Ⓟ et le nom de Routine ; la composition reste au déployé. Une Routine à Séance unique est présentée par son nom de Routine dans le Journal. Le filtre de l'Agenda reprend exactement cette représentation compacte, sans dérouler les Séances d'un Parcours en lignes distinctes. Les noms de Routines ne sont plus uniques et peuvent être générés ou personnalisés. **Les clauses antérieures incompatibles de ce DSF sont supersédées** par [la décision du 21/11/2026](KODJO-Agenda-seances-journal-filtre-2026-11-21.md). Figma ajusté le 21/11/2026, à valider : carte « Mobilité du matin » (`12736:25026`) de « Calendrier — Journal — MVP » (`1992:5510`), Ⓟ après le nom (règle du 20/11/2026) ; ligne `12798:26926` du filtre `12795:25088` ; vue filtrée `12799:24881`.

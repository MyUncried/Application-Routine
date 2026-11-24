# KODJO — Programme : catalogue, création et configuration

**Date :** 20 novembre 2026.

**Décisions :** D-543 à D-552 (demandes et validations explicites de Hermann du 20/11/2026, classe B).

**Périmètre :** les écrans de création et de configuration d'un programme, son catalogue, sa suppression, et le suivi de la douleur. Les écrans de résultats d'un programme relèvent de l'onglet Suivi et ne sont pas traités ici.

**Figma** (fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP », ligne Programmes, sous la ligne du catalogue des séances) :

| Écran | Nœud |
|---|---|
| PROG — 8 Catalogue des programmes — État vide | `12848:47330` |
| PROG — 13 Créer ou configurer un programme | `12848:47314` |
| PROG — 7 Catalogue des programmes — Liste | `12848:47040` |
| PROG — 7b Catalogue des programmes — Actions glissées | `12863:490` |
| PROG — 7c Modal — Supprimer un programme | `12872:610` |
| PROG — 13b Suivi de la douleur — Consentement | `12848:47353` |
| Profil — Confidentialité | `12839:4036` |

## 1. Principes

1. **Le catalogue construit et configure ; le Suivi montre les résultats.** Ouvrir un programme depuis le catalogue sert à le configurer. Aucun indicateur de résultat n'y figure. Les écrans de résultats (indicateurs, volume, contenu semaine par semaine) sont rangés sur la ligne Suivi et seront conçus avec l'onglet Suivi.
2. **Un programme contient des routines.** Une routine planifie des séances ou des exercices. Le rattachement d'une routine à un programme est facultatif. Le contenu d'un programme se lit en séances et en exercices ; un « parcours » n'a pas d'objet propre (ch04).
3. **Les personnes ne sont pas affectées à un programme.** Le partage d'un programme passe par un Espace de la communauté (hors MVP) : l'espace gère les personnes, le programme reste personnel. Un espace en étoile à une seule personne couvre le suivi individuel.

## 2. Catalogue des programmes

**Présentation** : identique aux catalogues des mouvements et des séances.
- Onglets Mouvements · Séances · Programmes, avec Programmes sélectionné.
- Couleurs Programmes : contexte et onglet `#EFE8FF`, fond `#F9F6FF`, y compris derrière les onglets.
- Première ligne **« Actifs N · Terminés N »**. Elle sert de filtre, comme la ligne « Actives · Terminées » du Journal du calendrier. Par défaut, la liste affiche les programmes **actifs**, en cours ou à venir.
- Champ « Rechercher » à gauche ; boutons filtre, tri et créer alignés à droite, à 16 px du bord. [23/11/2026 — D-589 (Hermann : « Tri : la fonction n'est encore définie nulle part et le bouton est inactif. C'est reporté à quand je serai prêt. Filtre : par séance, avec / sans douleur. Mais on ne développe ni l'un ni l'autre pour l'instant. ») : Tri reporté ; critères du Filtre décidés (par séance ; avec / sans douleur), non développés ; les deux boutons restent inactifs.]
- Cartes aux marges de 16 px. Chaque carte affiche le nom, la période et le statut, puis le nombre de planifications et d'exercices. [Précisé le 21/11/2026 — D-573 : « N planifications · N séances », séances distinctes des routines rattachées ; « exercices » remplacé.] [23/11/2026 — D-590 (Hermann : « ok ») : pour un programme en cours, « semaine N sur M » suit « En cours » ; M = jours de la période ÷ 7, arrondi au plus proche ; N = semaine en cours depuis le début, plafonnée à M (du 15 sept. au 15 déc., le 1er octobre : « semaine 3 sur 13 »).]

**État vide** : même présentation, avec « Actifs 0 · Terminés 0 ». La recherche, le filtre et le tri restent visibles. [Confirmé le 23/11/2026 (D-592, Hermann : « ok ») ; le fond de « PROG — 13 » qui affiche « 0 programme » n’est pas la référence.]

**Toucher une carte** ouvre la modale de configuration du programme (§4).

**Actions glissées** (glisser la carte vers la gauche), de gauche à droite :

| Action | Couleur | Effet |
|---|---|---|
| Enregistrer comme modèle | violet | crée un modèle à partir du programme [21/11/2026 — D-570 : grisé et inactif tant que le modèle de programme n'existe pas] |
| Dupliquer | gris | crée une copie du programme [21/11/2026 — D-571 : copie sans dates ni routines, nom suivi de « (copie) », objectif et suivi de la douleur repris] |
| Supprimer | rouge `#D92D20` | ouvre la confirmation (§3) |

Ces deux premières actions ne figurent plus dans la fiche du programme. « Archiver le programme » et « Arrêter le programme » sont supprimés : l'état Terminé les remplace.

## 3. Supprimer un programme

Même règle que la suppression d'une routine :
- **sans exécution réalisée**, le programme est supprimé ;
- **avec un historique**, ses créneaux non commencés sont supprimés et le programme passe en **Terminé**. Il reste consultable.

**Modale de confirmation** (composant « DSF / Overlays / Confirmation », variante « Titre, message et action secondaire »), de haut en bas :
1. titre « Supprimer ce programme » ;
2. message, par exemple « 12 créneaux non commencés seront supprimés. Le programme sera terminé. » ; [23/11/2026 — D-592 : sans historique, « Le programme sera supprimé. » (Hermann : « OK ») ; un programme déjà terminé avec historique reste « Terminé », sans suppression définitive (« Ok »).]
3. bouton rouge **« Supprimer avec ses routines »** : les créneaux futurs des routines du programme sont supprimés avec lui. C'est le cas courant ;
4. bouton violet clair **« Garder les routines dans le calendrier »** : les routines continuent, détachées du programme. Ce bouton n'apparaît que si le programme a des routines avec des créneaux à venir ; [Précisé le 21/11/2026 — D-574 : toutes les routines sont détachées, historique compris, aucun créneau supprimé ; programme Terminé s'il a un historique, sinon supprimé. L'historique d'un programme est porté par ses exécutions (programme figé au lancement).]
5. bouton gris **« Annuler »**.

## 4. Créer ou configurer un programme

**Forme** : modale iOS (feuille flottante arrondie aux quatre coins, marges latérales de 8 px, poignée), présentée par-dessus le catalogue des programmes.

**En-tête** (composant « En-tête de modale ») :
- croix à gauche, titre au centre, coche à droite ;
- titre **« Nouveau programme »** à la création, le nom du programme en configuration ;
- la coche enregistre. Elle suit la règle commune des modales (D-499) : active quand les données sont complètes et cohérentes, c'est-à-dire quand le nom, la date de début et la date de fin sont renseignés.

**Zone de contexte** (couleur Programmes, hauteur standard inchangée) : nom puis objectif, modifiables d'un toucher.

**Corps**, sans titre de section sauf « Planifications » ; cartes séparées de 12 px, cartes à une ligne de 44 px :
1. **Période** : une ligne « Du *15 sept. 2026* au *15 déc. 2026* ». Les dates sont en bleu, sans cadre, et se modifient d'un toucher.
2. **Planifications** :
   - la liste des routines du programme : nom, puis créneau et nombre de contenus (« tous les jours, 14 h · 2 contenus ») ;
   - **glisser une routine vers la gauche** la retire du programme sans la supprimer ;
   - **« + Planifier une séance ou un exercice »** ouvre l'écran de planification existant ; la routine créée est rattachée au programme ; [21/11/2026 — D-572 : libellé « + Planifier une séance » (D-449 : la séance est le seul contenu planifiable) ; D-576 : programme présélectionné et non modifiable, dates bornées par la période, « pendant N » plafonné à la fin du programme, sans message.]
   - **« Rattacher une routine existante »** ouvre la liste des routines du calendrier qui n'appartiennent à aucun programme.
3. **Suivi de la douleur** : interrupteur, désactivé par défaut (§5).

Ne figurent pas dans cette modale : les indicateurs de résultats, l'enrôlement de personnes, « Enregistrer comme modèle » et « Dupliquer ».

## 5. Suivi de la douleur

1. **Ce qui est demandé.** Pour une exécution lancée dans le contexte d'un programme dont le suivi est activé : une échelle de douleur avant et après la séance, et la zone concernée (règles de saisie : ch04, « Évaluations et résultats »).
2. **Où il s'active.** Programme par programme, par l'interrupteur de la modale (§4).
3. **Consentement.** Il est recueilli dans le programme, à la première activation, et vaut pour toute l'application. Une feuille de consentement s'ouvre alors (écran 13b) :
   - elle explique ce qui est demandé ; [Contre-recette 3 du 23/11/2026 (x5, texte de Hermann recopié tel quel) : « Une échelle de douleur et la zone concernée vous seront demandés avant et après chaque séance exécutée dans ce programme ». Fenêtre centrée sur un voile gris, la modale du programme restant ouverte (contre-recette 2, constat a) ; titre au format des titres de fenêtre, centré (x5 : « Le format du titre n’est pas conforme, il est trop gros, et pas centré horizontalement »). Remplace le texte provisoire du code « Une échelle de douleur et la zone concernée vous seront demandées avant et après les séances des programmes qui activent ce suivi. »]
   - elle précise que les relevés restent sur le téléphone, ne sont jamais interprétés et peuvent être effacés ;
   - elle propose « Annuler » (gris, à gauche) et « Autoriser » (bleu, à droite), côte à côte.
   Annuler laisse l'interrupteur désactivé. Les activations suivantes, dans ce programme ou un autre, ne redemandent pas l'accord.
4. **Profil › Confidentialité.** L'accord n'y est pas donné : le Profil affiche l'état qui découle des programmes et permet de revenir dessus en un seul endroit. Sans accord : « non utilisé », sans réglage. Avec un accord : date d'accord et programmes concernés, « Retirer mon accord » (désactive le suivi dans tous les programmes) et « Effacer mes relevés ». [21/11/2026 — D-575 : « Effacer mes relevés » grisé tant qu'aucun relevé n'existe ; confirmation prévue.]
5. **Données.** Les relevés restent sur le téléphone, ne sont jamais interprétés par Kodjo et ne sont jamais partagés, même quand l'exécution est visible dans la communauté. La date d'accord est enregistrée. Désactiver l'accord arrête la collecte ; « Effacer mes relevés » supprime les relevés existants.
6. **Évolution.** Au sens du RGPD, un relevé de douleur reste une donnée de santé, même sans interprétation. Une sauvegarde sur un compte ou un partage futur exigera un nouveau consentement, demandé au moment où l'usage apparaît.

## 6. Profil

**Onglets** : Compte · Préférences · Confidentialité.
- « Compte » regroupe le nom, le pseudo, l'accès au compte et les bibliothèques.
- La zone centrale a une couleur uniforme, celle de l'onglet sélectionné (`#EAEAFF`), sans dégradé ni trait sous l'onglet.

**Confidentialité** :
- **Suivi de la douleur** (état déduit des programmes, §5) :
  - avec un accord : « Accordé le 20 nov. 2026 », puis « Utilisé par 1 programme · Rééducation genou » [23/11/2026 — D-591 (Hermann : « Oui ») : seuls les programmes actifs sont comptés] ; « Retirer mon accord » en bleu ; « Effacer mes relevés » en rouge ;
  - sans accord : « non utilisé », sans réglage ;
  - mention : le suivi s'active dans un programme ; retirer l'accord le désactive partout ; les relevés restent sur le téléphone, jamais interprétés, jusqu'à leur effacement.
- **Partage communautaire** (communauté activée) :
  - interrupteur « Mes nouvelles exécutions sont visibles », activé par défaut ; chaque exécution peut être rendue privée ;
  - lignes d'information : le pseudo est visible par tous ; le nom d'affichage reste privé ; le profil est visible par les amis ; les relevés de douleur ne sont jamais partagés ;
  - mention : les exécutions antérieures à l'activation de la communauté ne sont jamais partagées.
- Communauté non activée : la section se réduit à une ligne « Activer la communauté ». Cet état n'a pas d'écran à lui.

## 7. Design system

- **« Zone de contexte »** : variante `Couleur=#EFE8FF` (Programmes) ajoutée (`12839:3960`).
- **« DSF / Overlays / Confirmation »** :
  - variantes « Titre seul » et « Titre et message » : la croix ronde standard remplace la pastille « Annuler ». Les confirmations de routines en héritent ;
  - nouvelle variante « Titre, message et action secondaire » (`12874:28`) : bouton principal, bouton secondaire violet clair `#EAEAFF` en texte bleu, bouton gris « Annuler », sans croix.

## 8. Reste à faire

- **Suivi.** Les écrans de résultats d'un programme (« PROG — 6 Détail d’un programme — Indicateurs et contenu », « PROG — 11 … Indicateur expliqué », « PROG — 12 … Détail d’un indicateur », « PROG — 5 Détail — planification hors période »), rangés sur la ligne Suivi, sont à concevoir avec l'onglet Suivi.
- **Rattachement automatique et avertissement.** La proposition automatique de rattachement des occurrences existantes et l'avertissement « hors période » (ch04, « Ce qui reste à concevoir ») ne sont pas couverts par cette spécification. « Rattacher une routine existante » est le rattachement manuel.

# PRE-8 — Complément de recette iPhone : familles de niveaux par geste (28/10/2026)

> Lot ciblé `fam-familles-de-niveaux-geste` (règles A à E du 28/10/2026, `main` @ `0a40735f`). Extension limitée du cahier PRE-8 : la recette A/B n'est pas rejouée. **Aucun cas n'est validé** avant le passage de Hermann sur appareil. Base au schéma 15, aucune migration ; build de développement Routine BMAD existant.

Pour chaque case : ✅ conforme, ❌ problème (décrire), ➖ non testé.

## Jeu de données

1. Famille de trois : « Squats assistés » (1), « Squats » (2), « Squats sautés » (3).
2. Trois Mouvements sans famille : « Fentes avant », « Gainage sur les genoux », « Mobilisation du genou ».
3. Une famille de deux : par exemple « Pont fessier » + son niveau créé par « Ajouter un niveau ».

## Cas FAM

- [ ] **FAM-01 — réordonner.** Pile repliée : appui long sur sa carte du dessus → la pile se déplie et la carte est portée. Glisser vers le bas dans la pile : les cartes libèrent l'emplacement, le filet garde sa longueur, les pastilles « Niveau N » changent pendant le geste. Relâcher : ordre appliqué, **aucun message**.
- [ ] **FAM-02 — sortir puis revenir.** Pile dépliée : porter « Squats assistés » sous la pile → le filet raccourcit, les cartes se referment, « Squats » et « Squats sautés » affichent Niveau 1 et Niveau 2, la carte portée n'a plus de pastille. Revenir dans la pile avant de relâcher → tout se rétablit. Ressortir et relâcher → message « Mouvement sorti de la famille » avec Annuler ; le Mouvement reprend sa place **par ordre alphabétique**.
- [ ] **FAM-03 — sortie en tête.** Famille en haut de la liste : porter un membre au-dessus du filet et relâcher → sortie acceptée ; replacement par nom, aucune position manuelle.
- [ ] **FAM-04 — créer une famille.** Porter « Mobilisation du genou » sur la **moitié haute** de « Gainage sur les genoux » → un filet apparaît à gauche, pastilles provisoires Niveau 2 (portée) et Niveau 1. Passer sur la moitié basse → les niveaux s'inversent. Relâcher → « Nouvelle famille de niveaux créée » avec Annuler. Refaire en dessous.
- [ ] **FAM-05 — rejoindre une famille de trois.** Pile repliée : porter un Mouvement sans famille dessus → elle se déplie. S'arrêter entre deux membres → niveaux provisoires de toute la famille. Relâcher → entrée à cet emplacement, aucune question Plus facile / Plus difficile, message avec Annuler (**libellé provisoire « Mouvement ajouté à la famille », à valider**).
- [ ] **FAM-06 — pas de transfert direct.** Porter un membre d'une famille sur un Mouvement sans famille ou sur une autre famille → aucun filet de formation ; relâché, il sort seulement. Puis, second geste : le poser sur l'autre carte → famille formée (carte sans famille) ou rejointe (membre d'une famille).
- [ ] **FAM-07 — dernier couple.** Famille de deux : sortir un membre → filet et pastilles disparaissent, message « Famille de niveaux supprimée » ; les deux Mouvements sont indépendants.
- [ ] **FAM-08 — messages et Annuler.** Pour création, entrée, sortie, dissolution : message au-dessus de la barre de navigation, environ **3 secondes**, Annuler rétablit tout (y compris les deux Mouvements d'une création ou d'une dissolution). Aucun bouton de validation.
- [ ] **FAM-09 — archivage et filtres (b8-3).** Archiver un membre d'une famille de trois → les deux actifs affichent Niveau 1 et 2 (rangs recalculés, b8-3) ; restaurer → trois niveaux. Filtre Archivés : aucun renumérotage supplémentaire. Sortir un actif d'une famille « deux actifs + un archivé » → message « Mouvement sorti de la famille », pas de dissolution (l'archivé reste membre).
- [ ] **FAM-10 — invariants.** Un Mouvement utilisé par un Exercice, sorti puis remis en famille : la Séance qui l'utilise s'ouvre sans changement ; fiche Mouvement identique (nom, médias, description).
- [ ] **FAM-11 — accès existants.** « Ajouter un niveau » (balayage) garde Plus facile / Plus difficile et le formulaire ; « Réordonner les niveaux » depuis la fiche donne le même ordre ; aucune action « Supprimer la famille » ni « Retirer ».

## Cas limites

- [ ] Glisser près du haut ou du bas de l'écran : la liste **ne défile pas** pendant le geste (limite connue) ; vérifier que rien ne se pose par erreur.
- [ ] Texte agrandi : les pastilles provisoires et le filet restent lisibles ; la moitié haute / basse d'une carte reste facile à viser.
- [ ] « Réduire les animations » : décalages immédiats, aucun saut à la dépose.
- [ ] Opérations répétées (créer, annuler, recréer, sortir, rentrer) : aucun doublon, aucune famille fantôme.
- [ ] 🔊 VoiceOver : « Placer … un niveau plus haut / plus bas » réordonne toujours ; aucune action de sortie ou de création n'est proposée (point à arbitrer).
- [ ] Appel ou notification pendant le geste (geste interrompu) : rien n'est modifié.

- [ ] Singleton subi (famille de deux dont un membre archivé) : porter le restant vers une autre carte → rien ; poser un Mouvement libre dessus → il entre dans ce groupe (message d'entrée).
- [ ] Création ou entrée : la place visée ne s'ouvre pas (limite connue) ; vérifier que la cible reste lisible sous la carte portée.

## Passe ciblée 2 (après la recette du 28/10)

- [ ] **fam-05** : porter un Mouvement sans famille placé **sous** une pile repliée vers cette pile → elle se déplie et la carte **reste sous le doigt** ; relâcher → entrée à l'endroit montré.
- [ ] **fam-06** : porter un Mouvement sans famille sur une pile dépliée → les membres suivants **s'écartent**, le filet s'allonge, les cartes du Catalogue en dessous descendent ; ressortir → tout se referme.
- [ ] **Création** : porter un Mouvement sur la moitié haute d'une carte sans famille → la carte visée descend pour laisser la place ; moitié basse → la place s'ouvre dessous.
- [ ] **Défilement** : porter une carte près du haut ou du bas de la liste → la liste défile, la carte reste sous le doigt ; s'éloigner du bord → le défilement s'arrête ; relâcher sur une famille atteinte ainsi → entrée correcte.
- [ ] Non-régression : réordonner dans une pile, sortir, dissoudre, Annuler (FAM-01, 02, 07, 08).

## À trancher pendant la recette

1. Libellé de l'entrée dans une famille (provisoire : « Mouvement ajouté à la famille »).
2. Alternative accessible pour sortir, créer, rejoindre.
3. Dernier couple accompagné d'un membre archivé : sortie simple (choix actuel) ou dissolution.
4. Singleton subi ou famille filtrée : comportement décrit ci-dessus.
5. Emplacement pointillé : limite à accepter ou à corriger (ouverture de place et défilement : couverts après la recette du 28/10).
6. Place d'un Mouvement sorti (remarque fam-07) : classement par nom, ou retour visuel sur le Mouvement sorti, ou position manuelle (nouvelle règle de tri).

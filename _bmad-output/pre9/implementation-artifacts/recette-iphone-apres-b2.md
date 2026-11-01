# PRE-9 — Recette iPhone n° 1 (après B.2)

Branche `pre9-bmad/dev`. Ce cahier couvre A.1, C.1 (mises à jour de la base), B.1a, B.1b et B.2. Le chargement de l'application met la base à jour (migrations 016 et 017) : aucune donnée ne doit être perdue. Notez pour chaque cas : **OK**, ou **KO** avec ce que vous voyez (une capture aide).

## 1. Mise à jour de la base et Séances existantes

1. Ouvrez l'application, puis le Catalogue des Séances. Toutes vos Séances sont présentes, avec leurs noms, étiquettes et durées.
2. Déployez la carte d'une Séance qui a un Circuit : la ligne indique « Circuit · N tours · groupées » ou « … · alternées » (plus jamais « N séries »).
3. Ouvrez en modification une Séance avec un Circuit et des Points d'arrêt : Exercices, Circuit, compte et Points sont à leur place. Touchez « Continuer » sans rien changer, puis rouvrez-la : rien n'a changé.
4. Si une ancienne Séance n'avait **aucun Exercice dans son Circuit** : à l'ouverture, aucun Circuit n'est affiché (c'est la nouvelle règle : pas de conteneur vide).

## 2. En-tête du Circuit (B.1a)

5. L'en-tête affiche « Circuit », un chevron, « 3 tours · groupées » (nombre et adjectif en bleu) et la durée à droite.
6. Touchez le nombre : le stepper − N + apparaît. Faites + et −, maintenez + : le compte change ; il reste entre 1 et 99. Touchez ailleurs ou faites défiler : le stepper se referme.
7. Touchez l'adjectif : le choix « Séries groupées / Séries alternées » s'ouvre avec leurs descriptions. Passez en alternées sur un Circuit dont un Exercice a plus de séries que le compte : la confirmation « Passer en séries alternées ? » apparaît ; Annuler ne change rien.
8. Touchez « Circuit » ou le chevron : le Circuit se replie (une ligne avec les noms des Exercices séparés par « · ») ; retouchez : il se déplie. Fermez et rouvrez la Séance : il est déplié.
9. Circuit déplié : l'appui long sur une carte du Circuit la déplace comme avant. Circuit replié : ses cartes sont masquées ; tout changement de son contenu (par exemple un Exercice qui y entre) le déplie.

## 3. Menu Créer et Séance sans Circuit (B.2)

10. Créez une nouvelle Séance : **aucun Circuit** n'apparaît. Touchez « + » : le menu propose, dans l'ordre, Créer un nouvel exercice, Utiliser un mouvement existant, Utiliser une séance existante (grisée), Ajouter un circuit, Ajouter un cycle, Annuler. Dans une Séance vide, « Ajouter un circuit » et « Ajouter un cycle » sont grisés. [Remplacé le 01/11/2026 — ordre de Hermann « Menu Créer et transformation du bouton », ch13 CE-T03-08 « Menu Créer — état cible » : quatre options, Créer un exercice, Utiliser une séance existante, Ajouter un circuit, Ajouter un cycle ; plus d'entrée « Utiliser un mouvement existant » (Mouvements existants repris par la saisie du nom dans « Créer un exercice ») ni de rangée Annuler (le « + » devient Annuler). Voir `spec-menu-creer-parametres-01-11.md`.]
11. Ajoutez trois Exercices. Les déplacements par appui long entre eux fonctionnent.
12. « + » → « Ajouter un circuit » : les Exercices ont un contour bleu en pointillé, la barre du bas affiche « Confirmer le circuit » (inactif) et « Annuler ». Touchez le deuxième Exercice : contour plein. Touchez « Annuler » : rien n'a changé.
13. Recommencez et touchez « Confirmer le circuit » : un Circuit (« 1 tour · groupées ») contient le deuxième Exercice. Faites glisser le troisième Exercice dans le Circuit : il y entre. Faites sortir les deux Exercices du Circuit : le Circuit disparaît.

## 4. Plusieurs Circuits et Cycles (B.1b, B.2)

14. Dans une Séance sans Point d'arrêt avec un Circuit, ajoutez un second Circuit sur un autre Exercice : les en-têtes deviennent « Circuit A » et « Circuit B ».
15. « + » → « Ajouter un cycle », désignez le Circuit A, confirmez : un bloc « Cycle » (fond plus soutenu, sans chevron, « 1 répétition », durée) contient le Circuit A.
16. Touchez le nombre du Cycle : stepper, jusqu'à 2 ou 3 répétitions ; la durée du Cycle et de la Séance augmente en conséquence.
17. Dans le Cycle, changez le compte et la nature du Circuit A ; repliez le Circuit B : chacun ne change que lui-même.
18. Ajoutez un nouvel Exercice : il se place après le dernier Exercice ajouté, dans son conteneur.
19. **Limite connue** : dans une Séance à plusieurs Circuits ou à Cycle, les cartes ne se déplacent pas encore (appui long, balayage Dupliquer / Supprimer et Points d'arrêt arrivent avec B.4 à B.6). Le toucher d'une carte ouvre bien son éditeur.
20. Touchez « Continuer » pour enregistrer, revenez au Catalogue, rouvrez la Séance : Cycle, Circuits, comptes, natures et ordre sont identiques. Dupliquez-la depuis le Catalogue : la copie a la même structure.
21. Dans une Séance qui a des Points d'arrêt et un Circuit, « Ajouter un circuit » / « Ajouter un cycle » sont grisés lorsqu'ils feraient passer la Séance à plusieurs conteneurs (limite jusqu'à B.6).

## 5. À observer

- Stepper : en maintenant + ou − jusqu'à 1 ou 99, la valeur s'arrête bien à la borne et rien ne continue après le relâchement.
- Lisibilité : contours de l'enveloppe, fond du Cycle, espacements, durée tronquée sur petit écran.
- VoiceOver (si vous le souhaitez) : « Circuit, durée », « Nombre de tours », « Nature du circuit », « Envelopper … dans le circuit ».

## Choix provisoires à confirmer pendant la recette

Spec B.1a § À CLARIFIER (fermeture du stepper, repli et gestes, chevron, arrondi de durée), spec B.1b (fond et largeurs du Cycle, rail), spec B.2 (présentation du menu, contours, libellés d'accessibilité).

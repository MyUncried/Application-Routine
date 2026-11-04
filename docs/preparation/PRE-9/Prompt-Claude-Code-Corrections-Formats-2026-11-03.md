# Claude Code — reprise des Formats sur la base finale du 4 novembre 2026

Reprends le développement PRE-9 des Formats à partir de la documentation actuelle de main. Les écrans, le parcours et plusieurs règles ont changé : relis tout le périmètre Formats, pas seulement un diff visuel. B.4c/B.7/B.8/B.9 sont développés et recettés selon Hermann ; le développement avait été arrêté au point Formats.

## Sources à lire avant de modifier le code

- `docs/KODJO-Formats-entrainement-2026-11-02.md` en entier.
- Source finale : `docs/sources/formats-2026-11-04/KODJO-Mise-a-jour-ecrans-formats-consolidee-2026-11-04_finale.md`.
- Chapitres 04/05/06/07/08/09/10/11/12/13 concernés, décisions du 4 novembre, règles FMT et contrats CE-FMT-01 à 05.
- `_bmad-output/pre9/planning-artifacts/architecture-pre9.md` et `epics.md`.
- Figma actuel `G6RY5Ebhgwb4AHIOYDwwvg`, page Prototype MVP `510:101`, galerie et inventaire au chapitre 06. Figma gouverne le rendu, la documentation les comportements.

## Travail demandé

Vérifie l’existant puis implémente les écarts confirmés. Réutilise les composants et services existants. Ne recrée pas les paramètres des Exercices dans un stockage parallèle ; les tableaux éditent les mêmes données que les modales. Ne réécris aucune migration livrée. Ajuste le plan existant aux impacts C.1/C.2–C.6 et D.1–D.5 ; aucune mise en œuvre du moteur PRE-10/11 par fragments dans ce travail de configuration.

**Formats — état cible du 4 novembre 2026.** Rôle dans le circuit : Buy-in/Tour pour AMRAP, Buy-in/Tour/Buy-out pour For time ; zones ordonnées, plusieurs buy-in/out, duplication dans la même zone, une seule exécution. AMRAP : incrément par tour en répétitions ou durée ; buy-in à l’échec possible, résultat à la clôture du premier bloc, sans saisie intercalée pendant le chrono. For time : membres en Répétitions ou Durée, au moins un Exercice en Répétitions dans l’ensemble du Circuit, buy-in/out compris. Dès deux Exercices créés par un modèle : Circuit ; À la suite et départs rapides correspondants : Circuit standard groupé à un tour. Nom du Circuit modifiable, modèle comme titre initial. Modèle d’origine distinct du Format d’origine d’exécution ; un Circuit standard n’acquiert aucun Format partagé par sa provenance. Réédition depuis le récapitulatif, mise à jour en place des seuls champs modifiés, annulation sans effet, valeurs hétérogènes « variable » sans uniformisation automatique. Avec/Sans charge effectif conservé, y compris les valeurs inactives sous Sans. Charges facultatives, vide ≠ zéro ; progression EMOM matérialisée par série et jamais réappliquée automatiquement sur des charges personnalisées.

**EMOM : Répétitions par défaut, Durée possible par Exercice.** Tableau Mouvement | Objectif, valeur avec unité et choix Répétitions/Durée dans la barre du clavier numérique ; aucune colonne Mode ni popover Mode. Avec charge : Objectif | Charge | + / série. Death by multi-mouvements : Mouvement | Départ | Incrément, valeurs propres à chaque membre, incrément ≥ +1. La ligne Repos EMOM est absente ; le repos est le restant de fenêtre.

**Contrôle EMOM des durées — seuil inclusif :** le travail prévu d’un Exercice en Durée est sa cible, multipliée par deux s’il est fait de chaque côté, plus la pause entre les côtés applicable. En simple, alternance et À la suite, travail prévu ≥ intervalle propre bloque la validation ; Dans chaque intervalle, somme du travail prévu des membres ≥ intervalle commun bloque la validation. Les membres en Répétitions contribuent pour 0 à ce contrôle de durée connue, sans garantie que le travail total tiendra dans la fenêtre. Message sous le tableau, cadres des valeurs concernées et de l’intervalle rouges ; validation bloquée dans le récapitulatif, la modale et lors de l’édition de l’intervalle du Circuit. À 60 s : 40 s d’un seul côté admis, 40 s de chaque côté refusés ; 30 s + 30 s refusés ; 10 répétitions + 30 s ne déclenche pas ce seul contrôle.

Réédition : ouvrir le récapitulatif courant via Modifier le format, Retour vers questionnaire, Enregistrer les modifications en place, seuls champs effectivement modifiés écrits. Identifiants des membres conservés, nom et position préservés. État Avec/Sans effectif ; hétérogénéité « variable » sans réinitialisation. Les valeurs initiales des modèles s’appliquent à la création, pas à chaque ouverture. Fermeture sans enregistrement = aucune mutation.

## Vérifications attendues

Teste les règles à leurs niveaux utiles : correspondance des champs entre tableau et modale ; changement d’unité sans conversion ; validation inclusive EMOM et deux côtés ; charges facultatives et valeurs conservées sous Sans ; progression EMOM puis personnalisation et réouverture ; parcours clavier ; Rôles et ordre des zones ; copies buy-in/out ; dernier Tour et dernier membre en Répétitions For time ; regroupement dès deux Exercices ; actions Circuit trois/quatre boutons ; réédition/annulation/conservation des données ; instantanés passés inchangés. Les captures Figma ne constituent pas une preuve de fonctionnement.

Livre un rapport court : changements, tests réellement exécutés, écarts restants et éventuels blocages précis. Ne prétends pas qu’un moteur, une recette sur iPhone ou un alignement visuel a été vérifié sans preuve correspondante.

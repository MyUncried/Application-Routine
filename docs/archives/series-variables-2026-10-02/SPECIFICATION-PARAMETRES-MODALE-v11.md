> Archive du commit8fc58a4. Texte historique ; seuls les liens relatifs ont été figés vers le commit d’origine. Les règles actives sont dans v12.

# Paramètres d’exécution — saisie en modale — v11

Référence active au 01/10/2026, D-246. Source : [transmission du propriétaire](https://github.com/MyUncried/Application-Routine/blob/8fc58a466679a85ea74752f0273939f901efa1b8/docs/SOURCE-SAISIE-PARAMETRES-MODALE-2026-10-01.md). Remplace l’interaction de phrase éditable v10.2. Les calculs métier et arbitrages non remplacés restent applicables. Les captures sont publiées au chapitre06 ; le contrat propriétaire de la feuille est CE-UI-10, le formulaire parent est CE-T03-04.

## Ouverture, brouillon et fermeture

La carte Paramètres d’exécution ouvre une feuille basse. Carte vide : feuille initiale. Carte renseignée : les valeurs sont des raccourcis vers la feuille ; aucune valeur n’est remplacée par un contrôle inline dans la phrase.

| Origine du toucher | État de la feuille |
|---|---|
| Mode | Ligne Mode sélectionnée, trois options déployées |
| Séries, pause entre séries ou zone vide de carte | Feuille renseignée, aucune ligne sélectionnée |
| Durée d’une série | Ligne sélectionnée, roulette minutes/secondes sous la ligne |
| Durée totale en mode Durée | Ligne sélectionnée, roulette sous la ligne |
| « sans », D→G ou G→D | Ligne Changement de côté sélectionnée, segmenté déployé |
| Autre valeur à stepper | Feuille renseignée, stepper disponible, aucun cadre sélectionné |

La feuille travaille sur une copie des paramètres du brouillon parent. ✕ annule tous les changements de cette ouverture ; ✓ applique ensemble les valeurs valides au brouillon parent, ferme la feuille et régénère le résumé. Cette validation ne sauvegarde pas l’Exercice en base : Terminer reste l’action de sauvegarde du formulaire. Un changement de champ ne valide ni ne ferme la feuille. Une seule ligne à roulette/segmenté peut être activée ; son contrôle est placé immédiatement dessous, hors du contour de sélection. Les steppers sont permanents et sans cadre de sélection. Aucun second niveau de modale de durée Annuler/Confirmer n’est ajouté.

À la réouverture, les valeurs du brouillon parent sont préremplies. Annuler rend exactement leur état antérieur. Changer de mode conserve les paramètres communs et les dernières valeurs spécifiques de chaque mode pendant l’édition. Après sélection, aucun retour à un mode vide ; la sortie sans appliquer passe par ✕.

## Ordre, visibilité et contrôles

| Ordre | Champ | Contrôle et état initial de création | Visibilité |
|---|---|---|---|
| 1 | Mode d’exécution | Valeur — ; segmenté Durée/Répétitions/À l’échec à l’activation | Toujours |
| 2 | Séries | Stepper, 1 | Toujours |
| 3 | Durée d’une série ou Répétitions | Durée : — puis roulette ; Répétitions : stepper, défaut métier 1 | Durée ou Répétitions ; absent À l’échec |
| 4 | Pause entre les séries | Stepper, **0 s** | Toujours, même avec une Série |
| 5 | Changement de côté | — à l’ouverture ; segmenté Sans changement/Droite puis gauche/Gauche puis droite | Toujours |
| 6 | Pause au changement de côté | Stepper ; copie de la préférence Profil (initialement 10 s) à activation bilatérale | Uniquement en bilatéral, immédiatement après Changement de côté |
| 7 | Durée totale | Roulette en Durée ; texte simple « Durée totale ≥ » en Répétitions | Modes Durée/Répétitions, même une Série ; absent À l’échec |
| 8 | Compte à rebours | Stepper ; défaut Profil 10 s | Toujours |
| 9 | Fin d’exercice | Stepper ; défaut Profil 5 s | Toujours |

Avant le choix d’un mode, les champs de durée non renseignés affichent — ; le prototype montre une ligne de durée d’une série vide comme emplacement initial, sans activer implicitement le mode Durée. Le total reste non calculé. Une valeur — ne signifie pas zéro. Le changement de côté non renseigné est normalisé à UNILATERAL lors de la validation, en cohérence avec le défaut Sans changement existant ; cela ne choisit jamais implicitement un côté.

✓ ne valide qu’un ensemble exécutable : mode choisi et cible du mode valide. La durée par Série doit être renseignée en mode Durée ; elle n’est pas remplacée silencieusement par l’ancien défaut visuel de 1 min. Une feuille initiale vide n’est pas validée simplement parce que le prototype affiche une coche bleue. En Répétitions, cible entière 1..100 ; À l’échec, aucune cible numérique. Terminer exige en outre nom, Catégorie et Zones selon le contrat parent.

## Bornes et calculs conservés

Séries 1..99 ; répétitions 1..100 ; durée par Série 1..5999 s ; pauses 0..300 s avec pas 5 s jusqu’à120 s puis 30 s. Les pauses se règlent désormais par **stepper**, sans changer ces valeurs admises. Compte à rebours/Fin conservent les valeurs copiées du Profil et les bornes de leur paramètre. La démonstration Séries 1..10 n’est pas une borne produit. Les valeurs 3 Séries/15 s/1 min30 du prototype sont des exemples.

Soit k=1 ou2, N le nombre de Séries, d la durée d’une Série, pS la pause entre Séries et pC celle du changement de côté. En bilatéral q=pC si pC>0, sinon pS ; en unilatéral q=0. T(N)=k×[N×d+(N−1)×pS]+q. En Répétitions, le résumé intrinsèque estime d=R×2 s ; cela ne fixe pas un rythme d’exécution. Compte à rebours, Fin et récupération post-exercice sont exclus de ce total.

En mode Durée, saisir Tv recalcule N=min(99,max(1,arrondi((Tv−q+k×pS)/(k×(d+pS))))), .5 vers le haut. Afficher T(N), pas Tv. Le sélecteur conserve minutes/secondes et la plage dérivée T(1)..T(99). Dans la feuille, la ligne Total reste visible pour une Série ; le résumé peut omettre la clause redondante selon la règle textuelle existante. Aucun contour pilote sur Séries : le contour signifie uniquement ligne de roulette/segmenté activée.

Si T(N) diffère de Tv, afficher temporairement sous la ligne Total, à 4 px : « Durée ajustée à {T(N)} pour respecter un nombre entier de séries. » Sinon, aucun message. À 402 px, l’état de référence ajoute 62 px à la feuille vers le haut ; les lignes Compte à rebours/Fin conservent leur position. Le texte s’adapte aux tailles accessibles sans hauteur fixe qui le coupe.

## Résumé et conservation

Le résumé reflète les paramètres **validés par ✓**, y compris la pause entre côtés et la transition de repli. Il n’est pas persisté comme source de vérité. Le nom de l’Exercice ne fait pas partie de la phrase. Modes et Compte à rebours/Fin restent des éléments séparés de la phrase intrinsèque. À l’échec : aucun Total. Répétitions : Total estimé non modifiable, sans pastille ni action ; toucher ce texte ne doit pas ouvrir une roulette.

## Références et limites du prototype

- `6407:9458` — Carte de paramètres vide.
- `6407:9551` — Modale ouverte — champs vides.
- `6407:9702` — Résumé des paramètres affiché.
- `6407:9805` — Mode activé — Durée.
- `6407:9966` — Modale renseignée — aucun champ activé.
- `6407:10127` — Durée d’une série — roulette ouverte.
- `6411:9546` — Durée totale — roulette ouverte.
- `6407:10481` — Changement de côté — contrôle segmenté.
- `6411:9649` — Bilatéral — pause au changement de côté.
- `6419:9847` — Mode Répétitions.
- `6419:10028` — Mode À l’échec.
- `6423:9953` — Message de durée totale ajustée.

La transmission, §3, prévaut sur le câblage : ✓ sur6407:9551 doit revenir au résumé après validation, pas à6407:9805 ; Changement de côté sur6407:9805 doit ouvrir6407:10481, pas6411:9546. Les champs non câblés restent à implémenter. Seul le stepper Séries est animé/interactif (1..10,120 ms) ; les autres contrôles statiques ne sont pas désactivés dans le produit. La phrase de démonstration ne se recalcule pas et les roulettes montrent des valeurs exemples. Aucune capture de résumé Répétitions/À l’échec n’est fournie. Le composant6426:10149 est un outil de prototype, pas un nouveau composant DSF à intégrer.

## Remplacement des anciennes références

3542:4656 reste la source non modifiée ; ce n’est plus la preuve active de la saisie. Les états de phrase éditable, notamment4279:7044,4367:7128,4367:7906 et la démo Champ éditable, sont historiques. Le changement concerne aussi la modification d’un Exercice utilisant le même formulaire ; aucune nouvelle frame Modifier n’est inventée. Les autres parcours et leurs shells restent conservés.

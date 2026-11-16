# For time — corrections de Hermann (14/11/2026, après-midi et soir : corrections 1 à 4, précision FT-15)

Messages de Hermann recopiés mot pour mot. Ils s'appuient sur la version mise à jour des règles (`for-time-regles-series-tours-2026-11-14.md`, FT-5, FT-12 et recette 2 modifiées). Réalisation : spec `spec-pre11-formats.md` §5, point 6.

## Correction 1

> Contexte : For time, exercices en rôle « Tour ». Correction à faire uniquement sur ce point.
>
> Problème constaté
> - Dans la composition, un exercice en tour est enregistré comme « séries identiques » avec une seule valeur de répétitions, alors que le récapitulatif affiche une valeur par tour (ex. 3 tours).
> - Quand on modifie les valeurs des tours 2 et 3 dans le récapitulatif et qu'on sauvegarde, la composition ne change pas, et en revenant dans le récapitulatif les valeurs ont disparu.
>
> Comportement attendu (règle FT-5 et FT-12)
> 1. Pour un exercice en rôle Tour, les cibles sont TOUJOURS enregistrées tour par tour : une valeur par tour (21-15-9, ou 10-10-10). Le nombre de séries est égal au nombre de tours du For time.
> 2. « Séries identiques » n'est qu'un raccourci de saisie dans la modale : saisir une valeur l'applique à tous les tours. Ce n'est plus un mode de stockage. Si toutes les valeurs sont égales, l'affichage peut indiquer « identiques ».
> 3. Chaque tour est modifiable individuellement, dans la composition et dans le récapitulatif.
> 4. Le récapitulatif lit les séries dans la configuration de l'exercice (source unique) et n'en déduit rien du rôle. Toute modification faite dans le récapitulatif (y compris tours 2 et 3) est écrite dans cette configuration, donc visible dans la composition, et inversement.
> 5. Aucune série sans objectif en For time.
> 6. Données existantes : à la lecture, un exercice en tour stocké comme « identique + une valeur » est converti en N valeurs égales (N = nombre de tours).
>
> À faire
> - Trouve où la configuration des séries d'un exercice en tour est écrite et lue (composition, modale des paramètres d'exécution, récapitulatif) et corrige la divergence de modèle : une seule structure, une valeur par tour.
> - Ne touche pas au buy-in / buy-out (déjà corrigé), ni aux autres formats, ni à l'interface (écrans inchangés).
> - Ajoute des tests : (a) créer un For time de 3 tours avec un exercice en tour à 10 répétitions → 3 valeurs enregistrées ; (b) modifier les tours 2 et 3 dans le récapitulatif, sauvegarder, rouvrir la composition puis le récapitulatif → mêmes valeurs ; (c) changer le nombre de tours de 3 à 4 puis à 2 → les valeurs suivent sans série vide ; (d) migration d'un exercice existant « identique ».
> - Avant de coder, dis-moi quels fichiers tu comptes modifier. Ne commite pas.

## Correction 2

> Correction 2 — Nombre de séries du buy-in et du buy-out
>
> Problème constaté : le récapitulatif affiche des colonnes S1…Sn pour le buy-in et le buy-out, mais aucun réglage ne permet de choisir ce nombre.
>
> Comportement attendu
> 1. Le nombre de séries est propre à chaque bloc (buy-in d'un côté, buy-out de l'autre), d'au moins 1, et commun à tous les exercices du bloc. Chaque exercice a ses propres valeurs par série (identiques ou variables). Il est indépendant du nombre de tours, et les séries s'exécutent une seule fois.
> 2. Dans le questionnaire « Paramètres d'exécution », les interrupteurs « Buy-in » et « Buy-out » sont remplacés par une ligne par bloc dont la valeur, à droite, est « Sans » (bloc absent) ou un nombre de séries (1 à n), choisi par une roulette comme pour « Temps limite ». Choisir un nombre active le bloc (1 par défaut). Revenir à « Sans » supprime les exercices du bloc, après confirmation.
> 3. Le récapitulatif affiche autant de colonnes S1…Sn que ce nombre ; les valeurs s'y modifient par exercice, avec la même persistance que pour les tours (règle 4 de la correction 1).
> 4. Changer le nombre de séries d'un bloc : si on en ajoute, les nouvelles reprennent la dernière valeur de chaque exercice [« reprennent la dernière valeur » remplacé le 14/11/2026 (recette i6), Hermann : « S3 ne doit prendre la dernière valeur, Elle doit être rentrée manuellement » — séries ajoutées à renseigner] ; si on en retire, les dernières séries sont supprimées.
> 5. Changement de rôle d'un exercice : Tour → buy-in/buy-out conserve ses valeurs telles quelles dans le bloc (ajuste le nombre de séries du bloc seulement s'il était vide) ; buy-in/buy-out → tour ajuste au nombre de tours (identiques : valeur répétée ; variables : tronquées ou complétées par la dernière valeur). Aucun état caché.
>
> Tests à ajouter
> a) For time à 3 tours, exercice en tour à 10 rép. → 3 valeurs enregistrées.
> b) Modifier les tours 2 et 3 dans le récapitulatif, sauvegarder, rouvrir la composition puis le récapitulatif → mêmes valeurs.
> c) Passer de 3 à 4 tours puis à 2 → valeurs cohérentes, aucune série vide.
> d) Exercice existant « identique » → migré en N valeurs.
> e) Buy-in à 2 séries et buy-out à 3 séries : récapitulatif S1-S2 et S1-S3, valeurs modifiables et conservées après réouverture ; passer le buy-in à « Sans » supprime ses exercices après confirmation.
> f) Échange des rôles buy-in ↔ tour : aucune valeur perdue en silence, aucune série sans objectif, vues identiques.

## Interprétations à confirmer (À CLARIFIER)

1. **« roulette comme pour « Temps limite » »** : depuis la décision du 05/11/2026 (« plus aucun stepper et de roulette » dans les questionnaires), le Temps limite se saisit au clavier, dans une case qui repasse à « Sans limite » quand on la vide. La ligne Buy-in / Buy-out suit donc ce Temps limite : case au clavier, « Sans » quand elle est vide, « 2 séries » sinon. Pas de roulette.
2. **Règle 5, exercice qui rejoint un bloc déjà occupé** : le bloc garde son nombre de séries (« seulement s'il était vide »). L'exercice est donc ajusté à ce nombre : complété avec sa dernière valeur, ou tronqué. Pour que la troncature ne soit jamais silencieuse (test f), la modale de la Composition l'annonce avant de valider (« Retirer des séries ? », Annuler / Continuer). Même annonce pour buy-in/buy-out → tour quand les tours sont moins nombreux.
3. **Nombre de séries d'un buy-in ou d'un buy-out dans la Composition** : commun au bloc (règle 1), il n'est plus réglable dans la modale de l'exercice (ligne Séries grisée, « imposé par le circuit », comme en tour). Il se choisit au questionnaire du For time. [Remplacé le 14/11/2026 au soir — demande de Hermann : « Pour les exercices en buy in et en buy out, je dois pouvoir ajouter ou supprimer des séries dans la composition de séance ». Voir « Demande du 14/11/2026 (soir) » en fin de fichier.]

## Correction 3

> Correction 3 — Boutons d'action de l'écran d'exécution du For time
>
> Référence : le Figma fait foi (fichier G6RY5Ebhgwb4AHIOYDwwvg, page « Prototype MVP »). Règle FT-14 du document « For time — Règles de gestion des séries et des tours » (joint). Ne modifie que l'écran d'exécution du For time ; les autres formats gardent leurs boutons actuels.
>
> Écrans Figma à consulter (get_design_context / screenshot)
> - « Exécution d'une séance — For time » : https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/?node-id=8982-15849
> - « Exécution d'une séance — For time — Buy-in et buy-out » : https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/?node-id=11990-24925
> - État en pause, à reprendre tel quel (voile pêche, bouton d'arrêt rouge, bouton redémarrer bleu) : « Exécution d'un exercice — En pause », https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/?node-id=12283-26364
> - Modale à ouvrir à l'arrêt : « P-Modale — Répétitions partielles », https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/?node-id=8928-15098
>
> Comportement attendu (buy-in, tours et buy-out)
> 1. En cours d'exécution, trois boutons en bas :
>    - gauche : « Réinitialiser », désactivé (48, rendu grisé comme les autres boutons inactifs) ;
>    - centre : pause (orange, 56) ;
>    - droite : bouton de succès ✓ (rond bleu, 72, icône check en vecteur blanc, pas un caractère de police) qui valide l'exercice SANS saisie et passe à l'exercice suivant. Au dernier exercice, il termine le For time et affiche le temps final.
> 2. Pause : le bouton pause fige le chrono et affiche l'état « En pause » du Figma : arrêt rouge à gauche (48), « Redémarrer » bleu au centre (72), ✓ grisé et inactif à droite (48). La durée de pause ne compte pas dans le chrono du For time : le résultat est le temps actif.
> 3. Arrêt (bouton rouge en pause) : en For time, il ouvre d'abord la modale « Répétitions partielles » ; après la saisie, la séance s'arrête comme avec le bouton d'arrêt des autres formats (synthèse partielle). Annuler dans la modale revient à l'état en pause.
> 4. Les tailles et couleurs suivent le Figma ; si le code diffère, aligne-le sur le Figma.
>
> Tests à ajouter
> a) For time en cours : « Réinitialiser » inerte, ✓ passe à l'exercice suivant sans modale, au dernier exercice le For time se termine avec le temps final.
> b) Pause puis redémarrage : le chrono repart sans compter la durée de pause ; en pause, le ✓ est inactif.
> c) Arrêt en pause : la modale « Répétitions partielles » s'ouvre ; confirmer arrête la séance avec synthèse partielle, annuler revient en pause.
> d) Un autre format (par exemple EMOM) garde ses boutons actuels.
>
> Avant de coder, indique les fichiers que tu comptes modifier. Ne commite pas.

## Correction 4

> Correction 4 — For time : cercle, écran de résultat, modale bloquée
>
> Référence : document « For time — Règles de gestion des séries et des tours » (joint), règles FT-15 à FT-18. Le Figma fait foi pour les écrans (fichier G6RY5Ebhgwb4AHIOYDwwvg, page « Prototype MVP ») ; ne modifie que le For time.
>
> Cas de test : For time avec un exercice, deux séries, une pause entre les séries.
>
> 1. Cercle du chrono (FT-15)
> - Constat : l'arc garde la même couleur quand on enchaîne pause et exercice.
> - Vérifie d'abord ce que l'arc représente aujourd'hui ; il doit représenter les secondes écoulées dans la minute en cours.
> - Attendu : couleur de l'arc selon la phase : exercice = bleu habituel, pause entre les séries = orange (voir l'écran Figma « Exécution d'une séance — Pause », nœud 12280:26387). À chaque changement de phase la couleur change immédiatement et l'arc garde sa position (chrono continu). À chaque minute révolue l'arc revient au gris et repart dans la couleur de la phase en cours.
>
> 2. Écran de résultat (FT-16 et FT-17)
> - Constat : une modale de résultat s'affiche juste après l'exercice et avant la pause.
> - Attendu : aucune modale de résultat dans le déroulement normal d'un For time (ni après une série, ni après un exercice, ni avant une pause). Le bouton ✓ enchaîne sans saisie ; le temps final s'affiche à la fin du For time. Seule exception : l'arrêt, qui ouvre la modale « Répétitions partielles » puis arrête toute la séance (synthèse partielle), qu'on soit dans une série ou entre deux exercices. Aucun « abandon d'une seule série » ou « d'un seul exercice ».
> - Les séries et exercices terminés sont enregistrés, plus les répétitions saisies pour la série en cours.
>
> 3. Modale bloquée (FT-18)
> - Constat : si je quitte l'application alors que la modale de résultat est affichée, au retour le bouton « Valider » est inactif et je ne peux plus sortir de l'écran, sauf en fermant l'application.
> - Cherche la cause (état de la modale ou du formulaire perdu à la mise en arrière-plan, validation recalculée à vide, chrono ou navigation qui se réinitialise au retour) et corrige-la.
> - Attendu : la modale se réaffiche avec ses valeurs, le bouton de validation reste actif (0 est une valeur valide) et la modale reste toujours fermable. Vérifie si la même cause touche les autres modales de saisie de résultat.
>
> Tests à ajouter
> a) Changement de phase exercice → pause → exercice : couleur de l'arc correcte à chaque phase ; passage à la minute : l'arc revient au gris.
> b) For time 1 exercice × 2 séries avec pause : aucune modale de résultat entre les séries ; le ✓ enchaîne ; temps final à la fin.
> c) Arrêt en cours de série : modale « Répétitions partielles », puis séance arrêtée avec synthèse partielle ; arrêt pendant la pause entre séries : même résultat.
> d) Modale ouverte, app mise en arrière-plan puis ramenée au premier plan : valeurs conservées, « Valider » actif, modale fermable.
>
> Avant de coder, indique les fichiers que tu comptes modifier, et la cause trouvée pour le point 3. Ne commite pas.

Puis : « Assure toi aussi que toutes les corrections de 1 à 3 ont bien été appliquées ».

## Précision FT-15 (cercle du For time)

> Précision sur FT-15 (cercle du For time) : le cercle doit devenir bicolore, et non changer de couleur en entier.
>
> - Chaque portion de l'arc garde la couleur de la phase pendant laquelle elle a été tracée. À un changement de phase, la partie déjà tracée reste dans l'ancienne couleur, et seule la suite de l'arc se trace dans la nouvelle couleur, à partir de la position courante.
> - Exemple : exercice jusqu'à 25 s (arc bleu de 0 à 25 s), puis pause : l'arc reste bleu de 0 à 25 s et se prolonge en orange à partir de 25 s.
> - Plusieurs changements dans la même minute donnent autant de segments (bleu, orange, bleu…), chacun dans la couleur de sa phase.
> - À chaque minute révolue, tout l'arc revient au gris, puis repart dans la couleur de la phase en cours.
> - Le curseur rond au bout de l'arc prend la couleur de la phase en cours.
>
> Implémentation attendue : enregistrer pour la minute en cours la liste des segments (instant de début, instant de fin, phase), et dessiner un arc par segment ; ne pas colorer un arc unique selon la phase courante.

## Interprétations retenues pour les corrections 3 et 4 (À CLARIFIER)

Les règles FT-14 à FT-18 ne sont pas parvenues (les deux pièces jointes reçues s'arrêtent à FT-13). Hermann n'a pas répondu aux quatre questions posées ; ses messages suivants demandant d'appliquer les corrections, les propositions ont été retenues :

1. Modale « Répétitions partielles » : l'exercice en cours seulement (le Figma en montre trois) ; entre deux séries, « Aucune série en cours » [remplacé le 14/11/2026 (recette k6), Hermann : « Supprimer cette modale, l’arrêt pendant la pause amène directement à l’écran de fin de séance. »], sans saisie.
2. Temps final : le grand chrono se fige sur le temps réalisé pendant 3 s, avec « Temps final » sous le chrono, sans saisie, puis la séance enchaîne. [Remplacé le 14/11/2026 (recette k2, k3), Hermann : « Je ne veux pas de cet écran. Les résultats des exercices seront présentés à la fin de la séance. » — aucun écran : passage direct à l'étape suivante.]
3. Durée maximum atteinte en pleine série : la saisie des répétitions faites est conservée (seule saisie restante hors arrêt), désormais jamais bloquée par l'arrière-plan.
4. ✓ pendant une pause entre séries : passe à la série suivante.
5. ✓ grisé en Pause : dessin construit sur le modèle de « Réinitialiser — inactif » ; le Figma « En pause » montre « Activité suivante » à cette place.

## Demande du 14/11/2026 (soir) — séries du buy-in et du buy-out dans la Composition

Message de Hermann, recopié : « Pour les exercices en buy in et en buy out, je dois pouvoir ajouter ou supprimer des séries dans la composition de séance »

Mise en œuvre (classe B, remplace l'interprétation 3 de la correction 2) :
- modale d'un exercice en buy-in ou en buy-out : le nombre de séries se règle (nombre, croix de retrait d'une série, Identiques/Variables) ; en tour, il reste celui des tours (FT-5) ;
- [remplacé le 14/11/2026 (recette m2, m3) : exercices indépendants] le nombre reste commun au bloc (correction 2, règle 1) : la valeur validée pour un exercice vaut pour tous les exercices de son bloc — ajout : dernière valeur reprise ; retrait : dernières valeurs retirées ;
- un retrait qui enlève des valeurs aux autres exercices du bloc est annoncé avant ✓ (« Retirer des séries ? » ; Annuler / Continuer), comme le changement de Rôle (règle 5, test f) ; séries Identiques : rien à annoncer ;
- le questionnaire du For time continue d'afficher le nombre du bloc (relu dans ses exercices).

## Précision du 14/11/2026 (soir) — buy-in ou buy-out transformé en Tour

Message de Hermann, recopié : « Pour être plus précis : le for Time a un nombre de tours. Dans la composition de séance si je transforme un exercice Buy In ou Buy Out en un exercice Tour, il doit héritier du nombre de Tours du circuit. »

Classement : A pour la règle (FT-5 et FT-10 : en tour, une série par tour du Circuit — déjà appliquée à l'enregistrement du Rôle, `setMemberRole`) ; correction de la modale :
- dès le choix « Tour » dans la modale, les séries passent au nombre de tours (dernière valeur reprise [remplacé le 14/11/2026 (recette m5) : séries ajoutées à renseigner], ou dernières valeurs retirées s'il y a moins de tours), ligne Séries grisée « imposé par le circuit » ; revenir au Rôle d'origine retrouve les séries d'origine ; vers un bloc déjà occupé, nombre du bloc ;
- moins de tours que de séries : valeurs retirées annoncées avant ✓ (« Retirer des séries ? », correction 2, règle 5) ;
- au ✓, le Rôle est enregistré avant les séries : celles-ci ne sont plus lues comme un nouveau nombre de séries de l'ancien bloc (les autres exercices du buy-in gardent les leurs).

## Recette iPhone du 14/11/2026 — écarts corrigés

Notes de Hermann dans le cahier en ligne, recopiées :
- m2, m3 (séries du buy-in et du buy-out dans la Composition) : « Les exercices de buy in (et de buy out) sont indépendants, changer le nombre de séries de l’un ne doit avoir aucun impact sur l’autre. »
- m5 (buy-in transformé en Tour) : « Il ne fait pas reprendre automatiquement la valeur de la dernière série. »
- m6 (moins de tours que de séries) : « Il faut que le message apparaisse au moment de la suppression pas au moment de la validation des paramètres. »
- i6 (nombre de séries d'un bloc changé au récapitulatif) : « S3 ne doit prendre la dernière valeur, Elle doit être rentrée manuellement »
- k2 (✓ sans saisie) : « Tout est ok, sauf que à l’issue du For Time une fenêtre Résultat s’affiche avant la pause qui précède le dernier exercice. Il faut supprimer cette fenêtre résultat, passer directement à la pause. »
- k3 (temps final) : « Je ne veux pas de cet écran. Les résultats des exercices seront présentés à la fin de la séance. »
- k5 (arrêt pendant une série) : « Écran initial : Le cadre gris doit être au milieu, avec O à l’intérieur, les chiffres suivent à droite. Défilement des chiffres : le cadre gris ne bouge pas, il reste au milieu, seuls les chiffres défilent. Un retour haptique à chaque passage de chiffre sur le cadre gris, le défilement doit marquer un léger arrêt sur le cadre. (Fonctionnement d’une roulette) »
- k6 (arrêt entre deux séries) : « Supprimer cette modale, l’arrêt pendant la pause amène directement à l’écran de fin de séance. »
- k8 (Durée maximum) : « Mettre la Durée maximum sur deux lignes à l’écran : - ligne du haut : la durée - ligne du bas : « max » Respecter les tailles de polices comme pour les autres textes des triangles »

Classement B (évolutions validées). Réalisation :
- m2, m3 : chaque exercice du buy-in ou du buy-out garde son propre nombre de séries (au moins 1) ; plus d'alignement du bloc ni d'annonce pour les autres exercices ; un exercice qui rejoint le buy-in ou le buy-out garde ses séries.
- m5 : passage en Tour, séries ajoutées « à renseigner » (✓ inactif tant qu'elles sont vides) ; les séries identiques restent répétées (une même valeur par tour).
- m6 : « Retirer des séries ? » s'affiche au choix du Rôle Tour ; Annuler garde le Rôle d'avant.
- i6 : au récapitulatif, une série ajoutée au buy-in ou au buy-out est à renseigner. FT-7 (changement du nombre de tours, « sans série vide ») n'est pas visé : la dernière valeur y reste reprise.
- k2, k3 : plus d'écran « Résultat » ni de « Temps final » à la fin normale d'un For time ; le résultat est enregistré et la séance passe directement à la pause. La saisie reste quand la Durée maximum interrompt une série.
- k5 : roulette horizontale — cadre gris fixe au centre (0 dedans au départ), défilement cranté d'un chiffre, retour haptique à chaque chiffre. Aucune roulette native horizontale n'existe sur iOS (la roue SwiftUI est verticale) : rangée existante rendue cranée.
- k6 : arrêt pendant une pause, sans modale : écran de fin de séance aussitôt.
- k8 : Durée maximum sur deux lignes dans le coin du haut à gauche (durée, puis « max »), mêmes tailles que le compteur « mouv. ».

Point ouvert — i2 (OK, avec la remarque « s’il n’y a qu’un exercice on ne peut pas réouvrir le questionnaire et le récapitulatif ») : « Modifier le format » n'existe que pour un Circuit issu d'un modèle ; un For time d'un seul exercice est posé comme exercice seul. Fonction à construire (réédition d'un exercice issu d'un modèle) — non faite dans cette livraison.


## Recette du 14 et du 15/11/2026 — notes KO suivantes

ft-i6 « La dernière valeur ne doit pas être reprise » ; ft-m5 « Buy out : la valeur de la Série a repris la valeur de la dernière série. » ; h1 « Buy In (1 serie) passé en mode Tour (3 tours de circuit) : les valeurs des Nouvelles séries doivent être entrée manuellement, pas de reprise automatique de valeur. » ; k5 « Mettre la Valeur limite à 99 » ; k8 « La modale n’est pas conforme, et la roulette horizontale ne marche pas comme celle de la Pause + Arrêt qui doit identique. » ; g7 « La feuille « séance partiellement exécuté » ne présente pas la valeur saisie dans la modale de résultat. Reprendre le mode de fonctionnement de la roulette tel que déjà expliqué (haptique, cadre gris au centre, valeur initiale, etc. ) ce devrait être un composant réutilisable. » ; ft-k8 « Le format de la durée doit être sexagésimale » ; g3 « L’objectif de la série doit passer dans le triangle du bas à droite. » ; fx1 « La ligne Exécution doit être la dernière du questionnaire » ; i7 « Questionnaire : le message ne doit apparaître que lorsqu’on appuie sur Fermer sur le clavier, pas lorsqu’on met la valeur à zéro ». Traitement : spec PRE-11 §5 point 19. [L'hypothèse « FT-7 n'est pas visé par m5 / i6 » (section précédente) — remplacée : séries ajoutées à renseigner partout.]

# Phrase des paramètres d’exécution — spécification rédactionnelle v1

06/10/2026. D-298. Remplace la présentation de v12§7 et l’ancien document v10.2, conservé historique. Sources : [dossier](../archives/cadence-2026-10-06/dossier-cadence-phrase-source.md) et [classeur v13](../archives/cadence-2026-10-06/generateur-phrase-activite_v13.xlsx), utilisé uniquement pour ses formulations. La version de ce document est indépendante de celle du classeur.

## 1. Entrées et génération

Entrées : mode, nombre de Séries, état uniforme/variable, cibles ordonnées, pauses, cadence commune facultative, direction/ordre des côtés, pause entre les côtés ; résultat du calcul intrinsèque applicable (secondes et nature déterminable/approximative/non estimable/incomplète). Le générateur ne calcule pas les durées et ne relit pas une phrase pour produire les paramètres. Phrase dérivée, non stockée comme source indépendante.

✓ de la feuille applique le brouillon valide et régénère une seule phrase ; ✕ conserve la phrase précédente. Pendant le brouillon incomplet, afficher— aux valeurs requises et interdire✓ ; pas de cible inventée. Compte à rebours/Fin restent des lignes séparées, exclus de la phrase et de son total intrinsèque. Nom, Catégorie, mode comme étiquette et Récupération contextuelle sont exclus du texte intrinsèque.

## 2. Grammaire et ordre

Ordre : Séries → cible et cadence → pause selon contexte → côtés → ligne de durée lorsqu’applicable. Phrase terminée par un point. Valeurs numériques et unités en gras dans le texte courant. Singulier :1série,1répétition ; accords menée/menées sur série(s), cadencée/cadencées sur répétition(s). Unités s et min ; espaces homogènes ; durée composée «1min30s» rendue «1 min 30 s».

| Contexte | Formulation cible (exemples de texte, pas tests de calcul) |
|---|---|
| Durée uniforme | «3 séries de 30 s» |
| Répétitions uniformes | «3 séries de 12 répétitions» |
| Avec cadence | Ajouter à répétitions «cadencées toutes les 4 s» ; singulier «1 répétition cadencée toutes les 4 s» |
| À l’échec | «3 séries menées à l’échec» / «1 série menée à l’échec» |
| Deux cibles variables | «2 séries de 12 puis 8 répétitions» ; Durée : «2 séries de durée variable (30 s puis 45 s)» |
| Trois cibles variables | «3 séries de 12, 10 puis 8 répétitions» ; Durée : «3 séries de durée variable (30 s, 45 s puis 1 min)» |
| Plus de trois cibles | «6 séries variables, de 6 à 15 répétitions» ; Durée : «6 séries variables, de 30 s à 1 min 30 s» |
| Plusieurs Séries uniformes, pause positive | «séparées par 15 s de pause» |
| Plusieurs Séries uniformes, pause nulle | «enchaînées sans pause» |
| Une Série, pause positive | «suivie de 15 s de pause» ; la pause terminale est conservée par la spécification |
| Une Série, pause nulle | Omettre la clause pause |
| Séries variables Durée/Répétitions | Omettre la clause de pause ; l’énumération décrit les cibles, pas les pauses. Cette omission rédactionnelle ne retire aucune pause du calcul. |
| À l’échec variable | Décrire les pauses selon le résumé existant : «3 séries menées à l’échec, avec des pauses de 30 s, 45 s puis 1 min» ; au-delà de3, plage min/max des pauses. Aucun total d’Exercice. |

Séries variables est un état explicite même si les valeurs sont égales. N=1 est normalisé uniforme avant génération. Les plages utilisent le minimum et maximum des cibles actives, pas les première/dernière lignes. Aucun résumé «trois premières valeurs puis ellipse».

## 3. Côtés

Sans changement : aucune clause «sans changement de côté». Une Série bilatérale : «en faisant le côté droit puis le gauche». Plusieurs Séries par paire : «en alternant le côté droit puis le gauche à chaque série». Plusieurs Séries successives : «en faisant d’abord toutes les séries à droite, puis à gauche». Si PC>0, ajouter «avec 10 s de pause au changement de côté». Inverser droite/gauche pour un départ gauche. PC=0 : omettre sa clause ; aucune pause de remplacement déduite du texte.

## 4. Durée et exceptions

Sur une nouvelle ligne : «Durée totale : {symbole éventuel}{durée}.» Aucun symbole si déterminable ;≈ si approximative ;≥ pour une borne non estimable dans un contexte agrégé qui l’affiche. Ne pas convertir≈ en≥. À l’échec : omettre le total d’Exercice. Une Série Durée unilatérale : omettre seulement si total réellement égal à la cible (Pause0) ; avec une pause positive, le conserver. Cette condition préserve D-248 face aux exemples simplifiés.

Le total et son niveau d’incertitude sont fournis par les [paramètres v13](SPECIFICATION-PARAMETRES-MODALE-v13.md) et la [Cadence](SPECIFICATION-CADENCE-REPETITIONS-v1.md). Aucun montant du classeur ou de Figma n’est un oracle de calcul.

## 5. Rendu, interaction et accessibilité

Une zone cliquable unique, sans pastilles de paramètres ni segments interactifs. Texte sombre Inter13 Regular, interligne20 ; valeurs Semi Bold/gras dans la même phrase. Référence402 : x39, largeur324 ; hauteur intrinsèque, retour à la ligne naturel et croissance de la carte ; pas de limite198/211 caractères. Le titre Paramètres d’exécution et les lignes Compte à rebours/Fin gardent leur hiérarchie. La zone entière ouvre CE-UI-10 ; focus accessible unique «Modifier les paramètres d’exécution», texte intégral lisible et agrandissable.

## 6. Recette rédactionnelle

Vérifier singulier/pluriel, deux/trois/plus de trois cibles, min=max, Durée/Répétitions/À l’échec, cadence absente/présente, pause0/positive, deux directions et deux ordres, PC0/positive. Injecter un total déterminable puis approximatif et vérifier uniquement son rendu. Vérifier omission du total seulement aux conditions ci-dessus, annulation et validation, absence de troncature à360/402/440 et texte agrandi. Les100 phrases du classeur constituent une référence de formulation ; les précisions explicites ci-dessus priment sur les omissions simplifiées. Aucune validation numérique du classeur n’est requise.

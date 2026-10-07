# Bip de cadence — spécification normative v2

07/10/2026, seconde clarification. Source : [prompt transmis par le propriétaire](../archives/bip-cadence-2026-10-07/prompt-source.md). Remplace Cadence v1 et les dispositions incompatibles de D-248, D-268–297 et D-305. Figma détermine le layout ; les règles ci-dessous proviennent du document expressément transmis, pas d’une déduction de ses chiffres. Excel reste une référence de phrases, jamais le calculateur métier.

## 1. Paramètre commun aux trois modes

**Bip de cadence** : signal périodique pendant une Série, en Durée, Répétitions et À l’échec. Intervalle entier de 0 à 10 secondes, défaut 0, affiché **Aucun** ; 1..10 affiche la valeur et l’unité s. Stepper, sans interrupteur ni roulette. Aucun nouveau réglage Profil. Zéro est une valeur valide, pas une erreur ou une cible manquante.

Nom logique cible : `cadenceBeepIntervalSeconds`. L’ancien nom limité aux répétitions est abandonné. Le réglage reste commun à toutes les Séries de l’Exercice : il est copié/modifié sur toutes les entrées de la collection effective ; aucune édition indépendante par ligne ni surcharge concurrente. Les trois modes acceptent ce champ ; changer de mode ne le masque ni ne l’efface. ✓ applique atomiquement au brouillon parent ; ✕ annule ; Terminer persiste. Déplacement/duplication/copie/instantané le conservent. Ancien objet sans champ : 0, aucun tempo implicite.

## 2. Résultats de durée

| Périmètre | Mode / contenu | Bip | Retour | Rendu |
|---|---|---|---|---|
| Exercice | Durée | 0 ou positif | exact | Valeur sans symbole |
| Exercice | Répétitions | 0 | omitted | Ligne absente |
| Exercice | Répétitions | positif | estimated | ≈ valeur |
| Exercice | À l’échec | 0 ou positif | omitted | Ligne absente |
| Séance | Tous les exercices exacts | Selon exercices | exact | Valeur sans symbole |
| Séance | Au moins une estimation, aucun exercice sans durée | Selon exercices | estimated | ≈ somme |
| Séance | Au moins un exercice sans durée | Selon exercices | lowerBound | ≥ contributions connues |

Les pauses chronométrées changent le montant, jamais la nature. Aucun ≥ au niveau d’un Exercice, même avec pauses ou récupération. omitted signifie absence de ligne, de valeur, de zéro et de tiret. Une erreur de saisie est un état de validation séparé : elle ne devient pas un cinquième résultat temporel valide. En Répétitions sans bip ou À l’échec, la ligne reste absente même si une cible est incomplète ; l’erreur reste portée par la cible et interdit ✓.

Une durée réelle réalisée reste réelle, sans symbole prévisionnel ni réécriture de l’historique. La redondance rédactionnelle d’un total Durée à une seule Série reste distincte du résultat exact calculé.

## 3. Calcul, pauses et périmètres

Pour une Série i : Durée → Ti=durée prescrite ; Répétitions avec bip b>0 → Ti=Ri×b ; Répétitions sans bip et À l’échec → durée de travail inconnue. Aucune estimation forfaitaire de répétition n’est utilisée.

Le total intrinsèque exclut Compte à rebours et Fin d’exercice. En unilatéral : T=ΣTi+Σ(Pi, i=1..N−1), soit N×d+(N−1)×p en uniforme. Aucune Pause après la toute dernière Série de l’Exercice. PN peut rester stockée pour un déplacement, une réaugmentation de N ou la frontière entre côtés ; elle ne crée pas une phase terminale.

**Conséquences dérivées, en conservant les règles de changement de côté déjà actées :**

| Configuration | Total intrinsèque, si travail calculable | Succession N=3, départ D |
|---|---|---|
| Unilatéral | ΣTi+Σ(P1..P(N−1)) | S1→P1→S2→P2→S3 |
| Un côté après l’autre | 2ΣTi+2Σ(P1..P(N−1))+PN+PC | D1→P1→D2→P2→D3→PN→PC→G1→P1→G2→P2→G3 |
| Les deux côtés à chaque série, N≥2 | 2ΣTi+Σ(P1..P(N−1))+N×PC | D1→PC→G1→P1→D2→PC→G2→P2→D3→PC→G3 |

N reste par côté. En succession des côtés, PN du premier côté reste suivie de PC selon la décision antérieure ; seule la Pause finale de l’Exercice disparaît. N=1 demeure normalisé Un côté après l’autre : T=2d+p+PC. En ordre par paire, aucune PC supplémentaire au retour à la première direction. PC=0 ne déclenche aucun remplacement par une autre Pause.

Une Récupération explicite de Séance s’ajoute après l’Exercice : To=T+R pour un travail calculable. Il n’existe plus de Pause terminale à soustraire. R=0 ne produit pas de phase. L’exécution directe n’a aucune Récupération contextuelle. Déplacement des Séries oblige à déterminer la nouvelle dernière ligne avant calcul. Tours développés avant sommation ; pas de double addition de R.

Pour une Séance avec travail inconnu, sommer les phases chronométrées réellement prévues et les travaux estimables, une seule fois ; le travail inconnu n’ajoute aucun montant inventé mais impose lowerBound. Les pauses prévues d’un Exercice dont le total propre est omitted contribuent à cette somme. Conformément au prompt, une estimation cadencée reste incluse dans les contributions connues : ≥ exprime ici un total prévisionnel partiel, pas une garantie mathématique sur le temps réel si l’utilisateur accélère ou abrège. Ne pas présenter cette estimation comme une mesure.

Les métriques Catalogue/Composition conservent leur périmètre de phases structurelles ; le plan complet inclut Compte à rebours/Fin quand applicables. L’omission du total d’Exercice ne supprime ni ses phases, ni ses données, ni leur exécution.

Exemple normatif : 4×15×4+3×15=285 s, soit ≈4 min45 s. Il est justifié par la formule du prompt, pas seulement par le texte de la capture. Q-07 est clos : omission à l’Exercice, agrégation partielle uniquement à la Séance.

## 4. Exécution et son

Le bip n’incrémente aucun compteur de répétitions réalisées, ne déclenche aucune transition et ne termine aucune Série. Durée garde sa fin automatique au zéro du minuteur ; Répétitions et À l’échec se terminent par l’action utilisateur existante. « C’est l’utilisateur qui termine » ne désactive donc pas le minuteur Durée.

Premier bip après un intervalle complet, puis périodiquement tant que la Série est active, dans les trois modes. Conséquence de la nouvelle définition : en Répétitions, le nominal Ri×b n’arrête plus le bip et n’émet plus un signal final distinct. À 10 répétitions et b=4s, bips à4,8,…40,44… jusqu’à fin/Pause. Le nominal est seulement une estimation. Le temps cible estimé utilise la ligne de temps existante ; pas de nouvelle maquette ni de compteur automatique.

Les bips s’arrêtent hors des phases de Série (Pause de série, changement de côté, récupération, point d’arrêt, préparation et fin) ; les signaux de ces phases restent distincts. Les préférences Sons existantes contrôlent l’audibilité ; les désactiver ne change ni la valeur du paramètre ni le calcul. Avec bip périodique, ne pas superposer le bip minute ; sans bip, les règles antérieures de signal minute restent celles des modes concernés. Si une fin de phase coïncide avec un bip, la transition et son signal priment ; aucun double signal.

Pause manuelle suspend le bip et conserve le temps réellement actif. Reprise : intervalle complet avant le prochain bip, sans rattrapage. Cette reprise audio ne réinitialise pas le minuteur Durée. Réinitialiser conserve sa portée métier : Série en unilatéral, côté courant en bilatéral, phase courante en récupération ; autre côté et temps cumulé conservés. Consulter les médias ne crée pas de Pause.

## 5. Progression, sécurité et arrière-plan

Conserver la progression existante par plan : Durée selon minuteur ; Répétitions avec bip selon nominal estimé et plafond100% sans transition ; Répétitions sans bip/À l’échec acquièrent leur poids à Suivant. Le bip en À l’échec ne rend pas la durée calculable. Aucun nouvel indicateur par Série. Les intervalles sonores supplémentaires après nominal ne créent pas de progrès supplémentaire ; aucun100% global avant fin du plan.

En Répétitions avec bip, Pause abandonne la fraction en cours pour la progression, mais pas pour le temps réel ; reprise sur un intervalle entier. En Durée, progression et temps restant suivent les règles du minuteur, indépendamment du nombre de bips. Les autres règles de progression du chapitre13 restent applicables aux phases effectivement générées.

Arrière-plan/verrouillage ne sont pas une Pause volontaire. Ordonnancement par ancres temporelles monotones, retour sans rejouer les signaux manqués, reprise idempotente après suspension système et absence de doublon. Qualifier le métronome sur appareil dans les trois modes, sur plusieurs minutes, avec écran verrouillé, interruptions audio et suspension ; aucune fiabilité native n’est déclarée acquise par la documentation.

Sécurité existante conservée là où elle a un sens : Répétitions avec bip,30min après nominal recalculé ; Répétitions sans bip et À l’échec (avec ou sans bip),2h sans interaction ; Durée conserve ses transitions chronométrées. Aucun arrêt définitif automatique si l’utilisateur ne répond pas à Reprendre/Arrêter.

## 6. Interface et steppers

Bip au premier niveau x36 sur référence402, séparateur330px ; juste avant Durée totale, ou à sa position lorsque le total est omis, avant Compte à rebours/Fin. Les sous-lignes Séries variables/cible/Pause et Ordre/PC restent indentées x52, séparateurs314px. La feuille se raccourcit de42px par le haut lorsque le total disparaît, en restant ancrée en bas ; texte agrandi et petits écrans : contenu défilant, aucun rognage.

Step simple=1 unité. Maintien après environ500ms : répétition au pas1 ; après2s : pas5 vers le prochain multiple dans le sens du geste ; après4s : pas10 de même. Relâchement arrête immédiatement et rétablit le pas1, sans pas supplémentaire de fin de maintien. Cadence de répétition technique existante150ms conservée tant que le produit ne la révise pas. Exemple+ depuis13→15→20 ; − depuis13→10→5. Bornes saturées, pas de dépassement ni rebouclage.

L’accélération est désactivée pour Bip, Compte à rebours et Fin d’exercice conformément au prompt ; ils restent au pas1 pendant tout maintien. Les steppers de plus grande plage utilisent les paliers ; aucune accélération appliquée aux roulettes. La règle remplace l’ancienne grille de pas des steppers de pauses dépendante de la valeur. Aucun arrondi au chargement ou à l’ouverture, uniquement lors d’un geste accéléré. Bornes des champs inchangées hors Bip0..10.

## 7. Données et livraison

Entrées de Série/snapshot : cible du mode, Pause, cadenceBeepIntervalSeconds0..10. Validation commune aux trois modes ; valeurs −1,11 et fractions refusées sans correction silencieuse. Les données historiques restent immuables ; ne pas tronquer silencieusement un ancien intervalle hors plage si une version de code l’a réellement persisté. La stratégie de reprise dépend de cet inventaire réel.

Résultats temporels typés exact/estimated/lowerBound/omitted ; omitted sans montant. Une erreur de validation est séparée. APIs validation, calcul, génération du plan et phrase utilisent ce même contrat. Renommer les paramètres logiques et l’ordonnanceur ; réutiliser les phases Série existantes, ne pas ajouter un quatrième mode.

Le prérequis SeriesParameters et les objets de pause doit être planifié avant intégration de cette évolution au modèle scalaire existant. Le numéro de migration n’est pas décidé par Figma. Ce lot documentaire ne livre ni migration SQL ni code audio.

## 8. Phrase, classeur et réserve rédactionnelle

Formulations conservées, y compris « répétitions cadencées » quand b>0. En Durée et À l’échec, le bip n’ajoute aucune clause. En Répétitions sans bip, supprimer la ligne de total ; aucune substitution par ≥. Le générateur reçoit le résultat de calcul, il ne calcule rien depuis Excel.

Q-08 : conserver toutes les formulations laisse une contradiction avec « + pause chacune » et surtout « une série suivie de15s de pause », alors que la pause terminale est supprimée. Ces textes historiques restent identifiés dans Phrase v1, sans valeur de règle d’exécution. Proposition rédactionnelle soumise au propriétaire : « + 15 s de pause entre les séries » et aucune clause de pause pour une Série unilatérale. Aucune modification silencieuse de H-03.

Le classeur pourra recevoir Bip de cadence et les six combinaisons mode×bip, avec durées fournies/omises. Sa feuille de calcul n’est pas une source normative : conserver la séparation explicitement décidée par le propriétaire.

## 9. Recette attendue

Six combinaisons mode×bip ; bornes0/1/10 et rejets−1/11/fraction ; bascule des trois modes sans perdre le bip ; annulation et application atomique ; duplication/snapshot. Exercice sans bip en Répétitions : aucune durée même avec pauses ; Séance mixte : retour partiel. Unilatéral N1 sans pause terminale, N4×15rep×4s+3×15s=285s. Bilatéral deux ordres, PC0/positive, R0/positive, inversion Durée et déplacement de dernière Série.

Bip périodique dans les trois modes, arrêt hors Série, maintien après nominal Répétitions, fin Durée prioritaire, Pause/Reprise, reset et temps réel, arrière-plan sans rafale, seuils de sécurité. Steppers : tap, maintien500ms/2s/4s, arrondi directionnel, petites plages et saturation, annulation tactile et lecteur d’écran. Ces cas sont prescrits, pas annoncés exécutés dans l’application.

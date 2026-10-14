# Bip de cadence — spécification normative v2

> **Formats de séances — cible du 14/10/2026 :** [spécification Formats du 14/10](SPECIFICATION-FORMATS-SEANCES-2026-10-14.md). Les règles propres aux formats complètent les séances libres ; elles ne changent pas les preuves figées de PRE-3/PRE-4. Moteur cible à développer. [Traçabilité](../MATRICE-FORMATS-SEANCES-2026-10-14.md) et [revue transverse](../REVUE-COHERENCE-FORMATS-2026-10-14.md).


**Actualisation13/10 :** [Deux modes et cible À l’échec](SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md). Mode commun Durée/Répétitions, cible typée par Série ; ≥ pour mélange calculable. Contrat CE-UI-10 et DSF Deux modes pour le sélecteur actuel.

> **Évolution cible du12/10/2026 — circuits de tours et de séries :** [SPECIFICATION-CIRCUITS-TOURS-SERIES-2026-10-12.md](SPECIFICATION-CIRCUITS-TOURS-SERIES-2026-10-12.md). Les dispositions nouvelles remplacent les prescriptions antérieures incompatibles dans leur périmètre. Référence PRE-3 conservée dans ses preuves figées ; captures et DSF non actualisés dans ce lot.

07/10/2026, clarification finale pauses et v15. Source : [prompt transmis par le propriétaire](../archives/bip-cadence-2026-10-07/prompt-source.md). Remplace Cadence v1 et les dispositions incompatibles de D-268–297/D-305 ; D-248 confirmée pour les pauses, D-311 remplacée par D-314. Figma détermine le layout ; les règles ci-dessous proviennent du document expressément transmis, pas d’une déduction de ses chiffres. Excel reste une référence de phrases, jamais le calculateur métier.

## 1. Paramètre commun aux deux modes

**Bip de cadence** : signal périodique pendant une Série, en Durée ou Répétitions, avec cible chiffrée ou À l’échec par série. Intervalle entier de 0 à 10 secondes, défaut 0, affiché **Aucun** ; 1..10 affiche la valeur et l’unité s. Stepper, sans interrupteur ni roulette. Aucun nouveau réglage Profil. Zéro est une valeur valide, pas une erreur ou une cible manquante.

Nom logique cible : `cadenceBeepIntervalSeconds`. L’ancien nom limité aux répétitions est abandonné. Le réglage reste commun à toutes les Séries de l’Exercice : il est copié/modifié sur toutes les entrées de la collection effective ; aucune édition indépendante par ligne ni surcharge concurrente. Les deux modes acceptent ce champ ; changer de mode ne le masque ni ne l’efface. ✓ applique atomiquement au brouillon parent ; ✕ annule ; Terminer persiste. Déplacement/duplication/copie/instantané le conservent. Ancien objet sans champ : 0, aucun tempo implicite.

## 2. Résultats de durée

| Périmètre | Mode / contenu | Bip | Retour | Rendu |
|---|---|---|---|---|
| Exercice | Durée, toutes cibles chiffrées | 0 ou positif | exact | Valeur sans symbole |
| Exercice | Répétitions | 0 | omitted | Ligne absente |
| Exercice | Répétitions, toutes cibles chiffrées | positif | estimated | ≈ valeur |
| Exercice | Toutes cibles À l’échec, les deux modes | 0 ou positif | omitted | Ligne absente |
| Exercice | Mélange chiffré/échec, Durée ou Répétitions avec bip | Selon mode | lowerBound | ≥ travail connu/estimable + pauses prévues |
| Séance | Tous les exercices exacts | Selon exercices | exact | Valeur sans symbole |
| Séance | Au moins une estimation, aucun exercice sans durée | Selon exercices | estimated | ≈ somme |
| Séance | Au moins un exercice sans durée | Selon exercices | lowerBound | ≥ contributions connues |

Les pauses chronométrées changent le montant, jamais la nature. ≥ est autorisé pour un Exercice mixte calculable ; il prime sur ≈. Toutes cibles À l’échec ou Répétitions sans bip restent omitted, même avec pauses ou récupération. omitted signifie absence de ligne, de valeur, de zéro et de tiret. Une erreur de saisie est un état de validation séparé : elle ne devient pas un cinquième résultat temporel valide. En Répétitions sans bip, la ligne reste absente même si une cible est incomplète ; l’erreur reste portée par la cible et interdit ✓. Une cible À l’échec explicitement sélectionnée est valide sans nombre.

Une durée réelle réalisée reste réelle, sans symbole prévisionnel ni réécriture de l’historique. La redondance rédactionnelle d’un total Durée à une seule Série reste distincte du résultat exact calculé.

## 3. Calcul, pauses et périmètres

Pour une Série i : Durée chiffrée → Ti=durée prescrite ; Répétitions chiffrées avec bip b>0 → Ti=Ri×b ; Répétitions sans bip et À l’échec → durée de travail inconnue. Aucune estimation forfaitaire de répétition n’est utilisée.

Le total intrinsèque exclut Compte à rebours et Fin d’exercice. **Pause après chaque série**, dernière comprise, même avec N=1 et même avec une Pause entre les côtés. Pi=0 ne crée pas de phase positive. Cette clarification explicite du propriétaire remplace les passages contraires du prompt précédent.

| Configuration | Total intrinsèque, si travail calculable | Succession N=3, départ D |
|---|---|---|
| Unilatéral | Σ(Ti+Pi) | S1→P1→S2→P2→S3→P3 |
| Un côté après l’autre | 2Σ(Ti+Pi)+PC | D1→P1→D2→P2→D3→P3→PC→G1→P1→G2→P2→G3→P3 |
| Les deux côtés à chaque série, N≥2 | 2ΣTi+ΣPi+N×PC | D1→PC→G1→P1→D2→PC→G2→P2→D3→PC→G3→P3 |

N reste par côté. Au changement de côté en ordre successif, PN et PC se cumulent, même si PC>0. En ordre par paire, Pi suit la paire complète ; aucune PC supplémentaire au retour au premier côté. N=1 est normalisé Un côté après l’autre : T=2(d+p)+PC. PC=0 ne supprime ni ne remplace Pi.

Une Récupération positive explicite de Séance qui suit l’Exercice remplace **uniquement sa toute dernière Pause** : To=T−PN+R. Sans récupération positive : To=T. R=0 ne produit pas de phase et ne supprime pas PN. La Pause du premier côté reste intacte. En direct, aucune Récupération contextuelle : PN reste exécutée. Déplacement des Séries : déterminer la nouvelle dernière ligne avant substitution. Développer les Tours avant sommation ; ne jamais ajouter R une seconde fois. Retirer une récupération rétablit la dernière Pause configurée.

Pour une Séance avec travail inconnu, sommer les phases chronométrées réellement prévues et les travaux estimables, une seule fois ; le travail inconnu n’ajoute aucun montant inventé mais impose lowerBound. Les pauses prévues d’un Exercice dont le total propre est omitted contribuent à cette somme. Conformément au prompt, une estimation cadencée reste incluse dans les contributions connues : ≥ exprime ici un total prévisionnel partiel, pas une garantie mathématique sur le temps réel si l’utilisateur accélère ou abrège. Ne pas présenter cette estimation comme une mesure.

**Clarification du12/10/2026 — D-214 :** Dans une Séance, les Compte à rebours d’exercice et Fin d’exercice ne sont jamais exécutés ; seuls le Compte à rebours initial et la Fin de séance s’appliquent, une fois, par substitution. Aucun booléen ni contrôle d’activation n’existe à cet effet. Les valeurs propres restent conservées pour l’exécution de l’Exercice seul. Ces phases propres ne contribuent donc ni au total prévu ni à la progression d’une Séance.

Les métriques Catalogue/Composition conservent leur périmètre de phases structurelles ; le plan complet inclut Compte à rebours/Fin quand applicables. L’omission du total d’Exercice ne supprime ni ses phases, ni ses données, ni leur exécution.

Exemple normatif : 4×15×4+4×15=300 s, soit ≈5 min. Il est justifié par la règle explicite du propriétaire, pas seulement par le texte de la capture. Q-07 est amendé par la spécification Deux modes : agrégation partielle également à l’Exercice mixte calculable.

## 4. Exécution et son

Le bip n’incrémente aucun compteur de répétitions réalisées, ne déclenche aucune transition et ne termine aucune Série. Durée chiffrée garde sa fin automatique au zéro du minuteur ; Répétitions et toute cible À l’échec se terminent par Suivant. « C’est l’utilisateur qui termine » ne désactive donc pas le minuteur Durée.

Premier bip après un intervalle complet, puis périodiquement tant que la Série est active, dans les deux modes. Conséquence de la nouvelle définition : en Répétitions, le nominal Ri×b n’arrête plus le bip et n’émet plus un signal final distinct. À 10 répétitions et b=4s, bips à4,8,…40,44… jusqu’à fin/Pause. Le nominal est seulement une estimation. Le temps cible estimé utilise la ligne de temps existante ; pas de nouvelle maquette d’exécution dans ce lot. Pour Répétitions à l’échec, les intervalles logiques proposent un relevé estimé, jamais un comptage détecté de mouvements.

Les bips s’arrêtent hors des phases de Série (Pause de série, changement de côté, récupération, point d’arrêt, préparation et fin) ; les signaux de ces phases restent distincts. Les préférences Sons existantes contrôlent l’audibilité ; les désactiver ne change ni la valeur du paramètre ni le calcul. Avec bip périodique, ne pas superposer le bip minute ; sans bip, les règles antérieures de signal minute restent celles des modes concernés. Si une fin de phase coïncide avec un bip, la transition et son signal priment ; aucun double signal.

Pause manuelle suspend le bip et conserve le temps réellement actif. Reprise : intervalle complet avant le prochain bip, sans rattrapage. Cette reprise audio ne réinitialise pas le minuteur Durée. Réinitialiser conserve sa portée métier : Série en unilatéral, côté courant en bilatéral, phase courante en récupération ; autre côté et temps cumulé conservés. Consulter les médias ne crée pas de Pause.

## 5. Progression, sécurité et arrière-plan

Conserver la progression existante par plan : Durée chiffrée selon minuteur ; Répétitions chiffrées avec bip selon nominal estimé et plafond100% sans transition ; Répétitions sans bip/À l’échec acquièrent leur poids à Suivant. Le bip en À l’échec ne rend pas la durée calculable. Aucun nouvel indicateur par Série. Les intervalles sonores supplémentaires après nominal ne créent pas de progrès supplémentaire ; aucun100% global avant fin du plan.

En Répétitions chiffrées avec bip, Pause abandonne la fraction en cours pour la progression, mais pas pour le temps réel ; reprise sur un intervalle entier. En Durée, progression et temps restant suivent les règles du minuteur, indépendamment du nombre de bips. Les autres règles de progression du chapitre13 restent applicables aux phases effectivement générées.

Arrière-plan/verrouillage ne sont pas une Pause volontaire. Ordonnancement par ancres temporelles monotones, retour sans rejouer les signaux manqués, reprise idempotente après suspension système et absence de doublon. Qualifier le métronome sur appareil dans les deux modes, sur plusieurs minutes, avec écran verrouillé, interruptions audio et suspension ; aucune fiabilité native n’est déclarée acquise par la documentation.

Sécurité existante conservée là où elle a un sens : Répétitions chiffrées avec bip,30min après nominal recalculé ; Répétitions sans bip et toutes cibles À l’échec (les deux modes, avec ou sans bip),2h sans interaction ; Durée chiffrée conserve ses transitions chronométrées. Aucun arrêt définitif automatique si l’utilisateur ne répond pas à Reprendre/Arrêter.

## 6. Interface et steppers

Bip au premier niveau x36 sur référence402, séparateur330px ; juste avant Durée totale, ou à sa position lorsque le total est omis, avant Compte à rebours/Fin. Les sous-lignes Séries variables/cible/Pause et Ordre/PC restent indentées x52, séparateurs314px. La feuille se raccourcit de42px par le haut lorsque le total disparaît, en restant ancrée en bas ; texte agrandi et petits écrans : contenu défilant, aucun rognage.

Step simple=1 unité. Maintien après environ500ms : répétition au pas1 ; après2s : pas5 vers le prochain multiple dans le sens du geste ; après4s : pas10 de même. Relâchement arrête immédiatement et rétablit le pas1, sans pas supplémentaire de fin de maintien. Cadence de répétition technique existante150ms conservée tant que le produit ne la révise pas. Exemple+ depuis13→15→20 ; − depuis13→10→5. Bornes saturées, pas de dépassement ni rebouclage.

L’accélération est désactivée pour Bip, Compte à rebours et Fin d’exercice conformément au prompt ; ils restent au pas1 pendant tout maintien. Les steppers de plus grande plage utilisent les paliers ; aucune accélération appliquée aux roulettes. La règle remplace l’ancienne grille de pas des steppers de pauses dépendante de la valeur. Aucun arrondi au chargement ou à l’ouverture, uniquement lors d’un geste accéléré. Bornes des champs inchangées hors Bip0..10.

## 7. Données et livraison

Entrées de Série/snapshot : cible du mode, Pause, cadenceBeepIntervalSeconds0..10. Validation commune aux deux modes ; valeurs −1,11 et fractions refusées sans correction silencieuse. Les données historiques restent immuables ; ne pas tronquer silencieusement un ancien intervalle hors plage si une version de code l’a réellement persisté. La stratégie de reprise dépend de cet inventaire réel.

Résultats temporels typés exact/estimated/lowerBound/omitted ; omitted sans montant. Une erreur de validation est séparée. APIs validation, calcul, génération du plan et phrase utilisent ce même contrat. Renommer les paramètres logiques et l’ordonnanceur ; réutiliser les phases Série existantes, ne pas ajouter un quatrième mode.

Le prérequis SeriesParameters et les objets de pause doit être planifié avant intégration de cette évolution au modèle scalaire existant. Le numéro de migration n’est pas décidé par Figma. Ce lot documentaire ne livre ni migration SQL ni code audio.

## 8. Phrase et classeur v15

Les276 formulations du [classeur v15](../archives/evolutions-v15-2026-10-07/generateur-phrase-activite_v15.xlsx) gouvernent le texte, exclusivement. Terme retenu : « pause après chaque série ». Q-08 clos ; ancienne proposition « pause entre les séries » et ancien signe+ abandonnés. Le générateur reçoit le résultat métier, retourne des segments `{texte, gras}`, ne persiste aucune phrase et régénère à chaque affichage. Voir [Phrase v1 actualisée](SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md).

## 9. Recette attendue

Deux modes × deux types de cible × bip nul/positif ; bornes0/1/10 et rejets−1/11/fraction ; bascule des deux modes sans perdre le bip ; annulation et application atomique ; duplication/snapshot. Exercice sans bip en Répétitions : aucune durée même avec pauses ; Séance mixte : retour partiel. Unilatéral N1 avec sa pause terminale, N4×15rep×4s+4×15s=300s. Bilatéral deux ordres, PC0/positive, R0/positive, inversion Durée et déplacement de dernière Série.

Bip périodique dans les deux modes, arrêt hors Série, maintien après nominal Répétitions, fin Durée chiffrée prioritaire, Pause/Reprise, reset et temps réel, arrière-plan sans rafale, seuils de sécurité. Steppers : tap, maintien500ms/2s/4s, arrondi directionnel, petites plages et saturation, annulation tactile et lecteur d’écran. Ces cas sont prescrits, pas annoncés exécutés dans l’application.



## Extension normative du12/10 — niveau Circuit

Le Circuit produit exact si tout le travail est exact ; estimated si au moins une estimation et aucun travail inconnu ; lowerBound si au moins un travail inconnu. Répétitions chiffrées avec Bip>0 : estimées ; Répétitions avec Bip0 ou toute cible À l’échec : travail inconnu. Les pauses et travaux estimables contribuent même si le total propre de l’exercice est omitted. Symbole préfixé au montant de l’en-tête : ≈ ou ≥, aucun symbole en exact.

Développer d’abord la nature du circuit. En circuit de séries, un passage bilatéral calculable vaut 2Ti+PC+Pi, ou 2Ti+PC+R si R>0 le suit. Pas de Pi avant PC. Cette règle contextuelle unique s’applique aussi à un circuit de compte1 ; elle ne réécrit pas le réglage propre ni les formules de l’exercice autonome/circuit de tours. Unilatéral : Ti+Pi, ou Ti+R si R>0. Sommer les passages une seule fois. Attentes de points exclues du prévu. Tests normatifs : Ti30,Pi10,PC5 → passage bilatéral75s ; R20 →85s. Trois passages identiques →225s, ou255s avec R20 à chaque passage. PC0 ne supprime pas Pi.

<a id="formats-raccordement"></a>

## Raccordement aux formats de séance — 14/10

La cadence de fenêtre EMOM/Death by est un paramètre de séance distinct du bip périodique d’exercice. Le travail accompli révèle le repos sans avancer l’échéance. EMOM est borné par le compte : durée N × E × W, repos inclus. Tabata garde une pause après chaque série de 10 s, aucune récupération supplémentaire par défaut. Le Death by acquiert un tour par appui confirmant l’objectif, jamais par comptage des bips. Les autres règles de bip et de pause restent conservées.

Source : [spécification Formats du 14/10](SPECIFICATION-FORMATS-SEANCES-2026-10-14.md).

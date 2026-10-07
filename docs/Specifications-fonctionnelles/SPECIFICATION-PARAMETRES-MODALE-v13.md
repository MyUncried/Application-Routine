# Paramètres d’exécution — Séries variables, Bip de cadence et phrase — v13

Référence actualisée le07/10/2026. Bip v2 remplace les dispositions de cadence, durée et pauses terminales incompatibles de D-248 et D-268–297. Les autres paramètres et comportements du brouillon sont conservés. Cible documentaire, pas preuve d’implémentation ; version indépendante du classeur.

## 1. Autorité, portée et sources

Les spécifications, le prompt de propagation amendé et les arbitrages explicites du propriétaire déterminent les calculs, comportements, transitions, validations et données. **Figma définit uniquement le layout et le rendu des états.** Ses chiffres, exemples, noms de frames et câblages ne créent aucune règle métier. Une incohérence graphique est un écart à corriger dans Figma, pas une nouvelle formule.

Sources originales immuables : [conception C1–C27](../archives/series-variables-2026-10-02/conception-source.md) et [prompt de propagation](../archives/series-variables-2026-10-02/prompt-source.md). Le présent document consolide leurs amendements et les réponses du propriétaire du 02/10, y compris N=1, déplacement, pas, vocabulaire, affichage de l’interrupteur et compatibilité. La source du 01/10 reste historique. PRE-1 et ses preuves figées ne sont pas rouverts.

## 2. Modèle et terminologie

Un Exercice possède un mode unique : Durée, Répétitions ou À l’échec. Une Série est une définition subordonnée à l’Exercice, numérotée 1..N : une cible éventuelle et une Pause. Elle n’est pas une entité autonome, ni un groupe d’exercices. En bilatéral, N signifie N Séries **par côté**, avec les mêmes paramètres pour les deux côtés.

- **Séries variables** : état explicite, indépendant de l’égalité éventuelle des valeurs.
- **Pause après chaque série** : libellé d’interface ; Pi est la Pause configurée de la Série i. Elle est exécutée entre les Séries, jamais après la toute dernière Série de l’Exercice ; PN reste stockée. Zéro signifie absence de phase positive.
- **Changement de côté** : Sans changement / Droite puis gauche / Gauche puis droite ; détermine la bilatéralité et le départ.
- **Ordre des côtés** : Un côté après l’autre (défaut) / Les deux côtés à chaque série. Sans objet en unilatéral.
- **Pause entre les côtés** : PC, libellé unique y compris dans le Profil ; initialisée depuis le Profil (défaut 10 s). Le nom technique existant `sideRecoverySeconds` peut être conservé.
- **Récupération après exercice** : R, ajoutée explicitement et portée uniquement par l’occurrence de Séance (`postActivityRecoverySeconds`), jamais par ActivityDefinition.

En uniforme, une cible et une Pause communes sont effectives. En variable, la collection ordonnée des N cibles/Pauses est l’unique source de vérité : aucune combinaison valeur commune + surcharge. Durée : cible Ti ; Répétitions : cible Ri ; À l’échec : aucune cible numérique, seules les Pauses varient. Cibles d’intensité (charge, RPE, etc.) hors périmètre.

## 3. Brouillon, bascules et normalisation

La feuille travaille sur une copie des paramètres du parent. ✕/retour système annule toute l’ouverture. ✓ applique atomiquement l’état actif et valide au parent et régénère le résumé ; Terminer seul persiste l’Exercice. Les états alternatifs cachés servent au brouillon uniquement.

Activation variable : chaque ligne copie la cible et la Pause uniformes courantes. Désactivation : sans confirmation ni message temporaire, l’état uniforme reprend la **première ligne dans l’ordre courant**. Réactivation avant ✓ restitue le dernier tableau variable. Si ✓ valide en uniforme, les anciennes valeurs variables cachées ne sont pas persistées.

Augmentation de N : rétablir d’abord les lignes temporairement retirées ; au-delà des lignes récupérables, copier la dernière ligne active. Réduction : retirer les dernières lignes de la liste active, conserver temporairement leur cible/Pause et leur ordre pour une restauration avant ✓. Restaurer une tranche retirée dans son ordre relatif d’origine (par exemple réduire 5→3 puis revenir à5 restitue 4 puis5, pas5 puis4). Après ✓, les lignes retirées ne sont plus conservées.

**Déplacement validé** : la cible, la Pause et la cadence éventuelle se déplacent ensemble ; les lignes sont renumérotées 1..N dans l’ordre obtenu ; la nouvelle dernière ligne porte PN. Les lignes actives déplacées conservent leur nouvel ordre lors de la restauration des lignes retirées, qui sont réinsérées en fin dans leur ordre conservé. La désactivation reprend la nouvelle première ligne. ✕ annule aussi les déplacements.

Changement de mode : conserver N et les Pauses ; remplacer les cibles incompatibles par —, sans conversion Durée/Répétitions. Revenir au mode précédent avant ✓ restaure ses dernières cibles. Une valeur — n’est jamais zéro.

**N=1 — arbitrage explicite** : état effectif uniforme et Ordre des côtés effectif Un côté après l’autre **dès le brouillon et son calcul**, pas seulement à la sauvegarde. Interrupteur Séries variables désactivé et grisé ; Ordre des côtés grisé lorsqu’il est visible en bilatéral ; aucun texte explicatif. Conserver temporairement l’ancien état variable, ses lignes et l’ancien ordre des côtés pour les restaurer si N remonte à2+ avant ✓. Valider à1 ne conserve qu’une série uniforme et l’ordre par défaut. Les deux formules bilatérales ne sont pas déclarées équivalentes à N=1 : la normalisation choisit explicitement la première.

## 4. Ordres d’exécution et pauses

La spécification [Bip v2 §3](SPECIFICATION-BIP-CADENCE-v2.md#3-calcul-pauses-et-périmètres) définit la succession des phases. Sans côté : S1→P1→S2→P2→S3. Par côté : D1→P1→D2→P2→D3→PN→PC→G1→P1→G2→P2→G3. Par paire : D1→PC→G1→P1→D2→PC→G2→P2→D3→PC→G3. Inverser D/G si départ gauche.

Aucune Pause terminale d’Exercice. À la frontière des deux côtés successifs, PN du premier côté puis PC restent exécutées selon la règle déjà validée. Par paire, Pi entre deux paires seulement et PC à l’intérieur de chaque paire. N=1 est normalisé par côté. Compte à rebours/Fin propres joués une fois pour l’Exercice complet. Récupération explicite après l’occurrence seulement ; aucune en direct. Phases nulles franchies de façon idempotente.

## 5. Durées, affichage et inversion

N=Séries par côté ; Ti=travail calculable de la Série ; Pi=Pause configurée ; PC=Pause de changement de côté ; R=Récupération de l’occurrence. Durée : Ti=cible ; Répétitions avec bip b>0 : Ti=Ri×b. Sans bip en Répétitions et en À l’échec : total propre omitted.

| Configuration | Total intrinsèque calculable | Uniforme |
|---|---|---|
| Unilatéral | ΣTi+Σ(P1..P(N−1)) | N×d+(N−1)×p |
| Un côté après l’autre | 2ΣTi+2Σ(P1..P(N−1))+PN+PC | 2N×d+(2N−1)×p+PC |
| Les deux côtés à chaque série, N≥2 | 2ΣTi+Σ(P1..P(N−1))+N×PC | 2N×d+(N−1)×p+N×PC |

Occurrence calculable To=T+R. Aucun PN à soustraire ; R n’est pas ajouté deux fois. Les totaux de Séance développent les Tours et les phases réellement prévues. Même si le total d’Exercice est omitted, ses pauses connues contribuent au total partiel de Séance selon Bip v2§3. Périmètres Catalogue/Composition/plan complet inchangés ; Compte à rebours et Fin propres restent exclus du total intrinsèque et inclus dans le plan complet si applicables. Temps réalisé jamais réécrit.

Rendu à l’Exercice : Durée exact sans symbole ; Répétitions avec bip ≈ ; Répétitions sans bip et À l’échec aucune ligne, jamais ≥ ou —. Les pauses n’altèrent pas cette nature. Séance : exact si tout exact, ≈ si au moins une estimation et aucun inconnu, ≥ si au moins un inconnu. Erreur de cible : validation distincte, aucune fausse valeur.

**Inversion réservée à Durée uniforme.** N dans1..99 au plus proche, égalité vers le haut. Candidats : unilatéral arrondi((Tv+p)/(d+p)) ; succession des côtés arrondi((Tv+p−PC)/(2(d+p))) ; par paire arrondi((Tv+p)/(2d+p+PC)). Comparer les candidats réalisables et N=1 calculé avec l’ordre normalisé par côté ; retenir le total le plus proche, égalité N le plus grand. Les bornes du sélecteur suivent les extrêmes réalisables. Si T(N)≠Tv : « Durée ajustée à {T(N)} pour respecter un nombre entier de séries. » Sinon aucun message. Total variable et Répétitions non éditable.

## 6. Feuille et contrôles

| Ordre | Ligne | Contrôle / visibilité |
|---|---|---|
| 1 | Mode d’exécution | Valeur puis segmenté Durée/Répétitions/À l’échec sous la ligne active |
| 2 | Séries | Stepper permanent, défaut1 |
| 3 | Séries variables | Interrupteur ; chevron de repli si variable ; visible mais inactif à1 |
| 4 | Cible et Pause | Uniforme : lignes Durée/Répétitions et Pause après chaque série ; variable : tableau rattaché à l’interrupteur, ligne numérotée, poignée, cible et Pause par steppers ; À l’échec : cible textuelle non modifiable |
| 5 | Changement de côté | Segmenté, sans changement / D→G / G→D |
| 6 | Ordre des côtés | Bilatéral uniquement, deux options ; grisé à1 |
| 7 | Pause entre les côtés | Bilatéral uniquement, stepper ; copie du Profil à activation |
| 7b | Bip de cadence | Trois modes ; stepper0..10,0=Aucun ; premier niveau, juste avant le total applicable ; commun hors tableau variable. |
| 8 | Durée totale | Durée uniforme : roulette ; variable/Répétitions avec bip : lecture seule ; Répétitions sans bip et À l’échec : absente |
| 9 | Compte à rebours | Stepper ; défaut Profil10s |
| 10 | Fin d’exercice | Stepper ; défaut Profil5s |

Création : mode/durée/côté non renseignés —, Série1, Pause0s ; cible Répétitions uniforme initiale1 ; aucune cible implicite lors d’un changement de mode variable. Côté vide normalisé Sans changement à validation. La feuille entière défile sous un en-tête ✕/titre/✓ fixe. Un seul segmenté/roulette ouvert ; les steppers restent visibles sans modale supplémentaire. Le chevron masque le tableau sans modifier les données ni désactiver le mode variable.

| Paramètre | Bornes | Granularité validée le02/10 |
|---|---|---|
| Séries | 1..99 | 1 |
| Répétitions par Série | 1..100 | 1 |
| Durée par Série | 1..5999s | 1s dans les steppers ; préserver cette précision à la saisie uniforme |
| Pause après chaque série / Pause entre les côtés | 0..300s | Tap1s ; maintien accéléré1/5/10 selon DSF Bip |
| Bip de cadence | 0..10s | 1s, aucune accélération |
| Compte à rebours / Fin d’exercice | 0..60s | 1s (D-256) |

Steppers : tap1 ; maintien≈500ms, puis paliers5 après≈2s et10 après≈4s, arrondi directionnel au multiple et saturation aux bornes. Bip/Compte à rebours/Fin restent au pas1. Relâchement arrête et rétablit le pas1 ; pas d’arrondi à l’ouverture. Voir DSF Bip. Les roulettes ne sont pas redéfinies par cette règle.

✓ grisé tant que le mode ou une cible active exigée est invalide ; cellule concernée signalée et message en ligne nommant la Série à renseigner. Pause0 valide. Repli du tableau ne contourne jamais la validation. Nom, Catégorie et Zones restent validés dans le parent.

## 7. Résumés et exécution

Carte Paramètres : phrase unique régénérée sur ✓ selon la [spécification de phrase v1](SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md). Énumérer les cibles variables jusqu’à trois Séries, puis min/max ; aucune ellipse des trois premières valeurs. Valeurs en gras dans le texte courant, pas de segments interactifs. Total fourni par le calcul, omis en Répétitions sans bip et À l’échec, ou par redondance en Durée unilatérale N=1. La zone entière ouvre la feuille.

Ligne d’Exercice en Composition ou dans une Séance déployée : **N séries variables** sans détail des valeurs. Catalogue variable : même indicateur compact, total intrinsèque applicable. Les règles de cartes avec/sans média restent inchangées.

Pendant l’exécution : `Série n/N`, côté courant séparé, aucune numérotation globale1/(2N), aucune barre de progression par Série. La barre Tour reste celle des séances ; les mentions Tour résiduelles des maquettes d’exécution directe ne créent pas de Circuit en ACTIVITY. Les cibles et pauses viennent de la Série courante de l’instantané. À suivre : **Pause**, **Pause entre les côtés**, **Récupération** selon la phase effective ; jamais Récupération en direct. Le total de l’occurrence utilise To. La progression globale pondère le plan réellement généré suivant D-241 ; elle n’introduit aucune barre par Série.

Réinitialiser conserve D-029/D-150 et RM-062 : recommencer la Série courante en unilatéral ; en bilatéral, recommencer le côté courant depuis sa première Série, préserver les résultats de l’autre côté et le temps total écoulé. Cette portée s’applique aussi à Les deux côtés à chaque série ; un passage déjà acquis de l’autre côté n’est pas rejoué. Exemple : gauche2/3 → reprise gauche1/3, résultats droits conservés. Pendant une récupération, RM-062 réinitialise seulement cette phase. Le saut confirmé d’un bloc chronométré conserve D-150 : côté courant partiel, poursuite des passages restant à exécuter de l’autre côté ; les résultats acquis ne sont pas effacés. Ces conséquences du périmètre existant ne constituent pas un nouvel arbitrage.

## 8. Compatibilité, données, API et instantanés

Existant sans nouveaux attributs : uniforme, Un côté après l’autre. Quantité de travail, cibles, Pauses stockées et direction conservées. **Le changement de durée et de pauses exécutées est assumé pour les exercices existants**, confirmé le02/10. Les instantanés et résultats historiques restent immuables ; ne pas réécrire les durées réalisées.

La règle du07/10 retire la Pause terminale de chaque Exercice ; les comparaisons de durées fondées sur son ancienne inclusion sont remplacées par les scénarios ci-dessous. Les snapshots existants demeurent immuables ; la migration physique doit être planifiée.

Le modèle persistant et les copies/duplications doivent conserver le mode uniforme/variable explicite, N, la collection ordonnée cible/Pause lorsque variable, la direction, l’ordre des côtés, PC, Compte à rebours et Fin. R reste dans l’occurrence. Les paramètres variables remplacent les paramètres uniformes comme source effective, sans surcharges. Prévoir représentation et version d’instantané compatibles ; la structure SQL exacte et la migration relèvent de la planification technique, pas d’un nouveau choix Figma.

API de validation/calcul/duplication et construction du plan doivent consommer la même représentation et les mêmes formules. Aucun résumé textuel ni total dérivé n’est une source persistée indépendante. Persistance atomique : aucune série partiellement écrite, aucune mutation d’ActivityDefinition par sa copie dans une Séance.

## 9. Scénarios de recette normative

| Cas | Paramètres | Résultat courant |
|---|---|---|
| A | Unilatéral ; cibles30/45/60s ; Pauses10/20/30s | 135+10+20=165s =2min45s |
| B | A avec R120s | 165+120=285s =4min45s |
| C | A par côté ; PC15s | 270+60+30+15=375s =6min15s |
| D | A par paire ; PC15s | 270+30+45=345s =5min45s |
| E | Répétitions12/10/8 ; bip0 ; Pauses30/45/60s | omitted, aucune durée d’Exercice ;75s de pauses connues dans le plan |
| F | À l’échec ; bip0 ou4 ; Pauses30/45/60s | omitted, même avec bip |
| Uniforme | N3,d90s,p15s | 270+30=300s =5min |
| Bilatéral | N3,d90s,p15s,PC10s | Par côté625s ; par paire600s |
| N1 bilatéral | d90s,p15s,PC10s | Ordre par côté,205s ; R30s →235s |
| Douze séries | Total travail390s,Pause10s | 390+11×10=500s =8min20s |
| Répétitions avec bip | N4,Ri15,b4s,p15s | 240+45=285s ; ≈4min45s |
| Durée avec bip | N4,Ti60s,b4s,p15s | 285s exact ; bip sans effet sur total |
| Une Série unilatérale | Ti30s,p15s | 30s, aucune pause terminale ; formulation historique en réserve Q-08 |

Tester les deux directions/ordres, p0/PC0 sans repli, R0/positive, N1/99, bascules/annulation/restauration, nouvelle dernière ligne après déplacement, copie et snapshot. Inversion et résultats dérivés de la spécification, pas des exemples Figma ni d’Excel.

## 10. Bip de cadence, validation et compatibilité

[Bip v2](SPECIFICATION-BIP-CADENCE-v2.md) : cadenceBeepIntervalSeconds entier0..10 dans les trois modes. Commun à toutes les Séries ; aucune surcharge par ligne. Bascule de mode conserve le bip, même après✓. ✕ annule toute l’ouverture ; ✓ applique ; Terminer persiste. Mise à0 supprime le bip et affiche Aucun. Ancien objet sans champ :0 ; aucun tempo implicite. Négatif,11,fraction refusés. Pas de nouvelle préférence Profil.

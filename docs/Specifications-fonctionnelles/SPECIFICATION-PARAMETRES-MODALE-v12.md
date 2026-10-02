# Paramètres d’exécution — Séries variables et Ordre des côtés — v12

Référence normative après PRE-1, avant planification PRE-2. Date : 02/10/2026. Décisions D-247 à D-255. Remplace v11 pour ce parcours et les règles de pauses/calculs incompatibles. Ne constitue pas une preuve d’implémentation.

## 1. Autorité, portée et sources

Les spécifications, le prompt de propagation amendé et les arbitrages explicites du propriétaire déterminent les calculs, comportements, transitions, validations et données. **Figma définit uniquement le layout et le rendu des états.** Ses chiffres, exemples, noms de frames et câblages ne créent aucune règle métier. Une incohérence graphique est un écart à corriger dans Figma, pas une nouvelle formule.

Sources originales immuables : [conception C1–C27](../archives/series-variables-2026-10-02/conception-source.md) et [prompt de propagation](../archives/series-variables-2026-10-02/prompt-source.md). Le présent document consolide leurs amendements et les réponses du propriétaire du 02/10, y compris N=1, déplacement, pas, vocabulaire, affichage de l’interrupteur et compatibilité. La source du 01/10 reste historique. PRE-1 et ses preuves figées ne sont pas rouverts.

## 2. Modèle et terminologie

Un Exercice possède un mode unique : Durée, Répétitions ou À l’échec. Une Série est une définition subordonnée à l’Exercice, numérotée 1..N : une cible éventuelle et une Pause. Elle n’est pas une entité autonome, ni un groupe d’exercices. En bilatéral, N signifie N Séries **par côté**, avec les mêmes paramètres pour les deux côtés.

- **Séries variables** : état explicite, indépendant de l’égalité éventuelle des valeurs.
- **Pause après chaque série** : libellé d’interface ; Pi est la Pause attachée à la Série i, y compris la dernière. Zéro signifie absence de phase positive.
- **Changement de côté** : Sans changement / Droite puis gauche / Gauche puis droite ; détermine la bilatéralité et le départ.
- **Ordre des côtés** : Un côté après l’autre (défaut) / Les deux côtés à chaque série. Sans objet en unilatéral.
- **Pause entre les côtés** : PC, libellé unique y compris dans le Profil ; initialisée depuis le Profil (défaut 10 s). Le nom technique existant `sideRecoverySeconds` peut être conservé.
- **Récupération après exercice** : R, portée uniquement par l’occurrence de Séance (`postActivityRecoverySeconds`), jamais par ActivityDefinition.

En uniforme, une cible et une Pause communes sont effectives. En variable, la collection ordonnée des N cibles/Pauses est l’unique source de vérité : aucune combinaison valeur commune + surcharge. Durée : cible Ti ; Répétitions : cible Ri ; À l’échec : aucune cible numérique, seules les Pauses varient. Cibles d’intensité (charge, RPE, etc.) hors périmètre.

## 3. Brouillon, bascules et normalisation

La feuille travaille sur une copie des paramètres du parent. ✕/retour système annule toute l’ouverture. ✓ applique atomiquement l’état actif et valide au parent et régénère le résumé ; Terminer seul persiste l’Exercice. Les états alternatifs cachés servent au brouillon uniquement.

Activation variable : chaque ligne copie la cible et la Pause uniformes courantes. Désactivation : sans confirmation ni message temporaire, l’état uniforme reprend la **première ligne dans l’ordre courant**. Réactivation avant ✓ restitue le dernier tableau variable. Si ✓ valide en uniforme, les anciennes valeurs variables cachées ne sont pas persistées.

Augmentation de N : rétablir d’abord les lignes temporairement retirées ; au-delà des lignes récupérables, copier la dernière ligne active. Réduction : retirer les dernières lignes de la liste active, conserver temporairement leur cible/Pause et leur ordre pour une restauration avant ✓. Restaurer une tranche retirée dans son ordre relatif d’origine (par exemple réduire 5→3 puis revenir à5 restitue 4 puis5, pas5 puis4). Après ✓, les lignes retirées ne sont plus conservées.

**Déplacement validé** : la cible et la Pause se déplacent ensemble ; les lignes sont renumérotées 1..N dans l’ordre obtenu ; la nouvelle dernière ligne porte PN. Les lignes actives déplacées conservent leur nouvel ordre lors de la restauration des lignes retirées, qui sont réinsérées en fin dans leur ordre conservé. La désactivation reprend la nouvelle première ligne. ✕ annule aussi les déplacements.

Changement de mode : conserver N et les Pauses ; remplacer les cibles incompatibles par —, sans conversion Durée/Répétitions. Revenir au mode précédent avant ✓ restaure ses dernières cibles. Une valeur — n’est jamais zéro.

**N=1 — arbitrage explicite** : état effectif uniforme et Ordre des côtés effectif Un côté après l’autre **dès le brouillon et son calcul**, pas seulement à la sauvegarde. Interrupteur Séries variables désactivé et grisé ; Ordre des côtés grisé lorsqu’il est visible en bilatéral ; aucun texte explicatif. Conserver temporairement l’ancien état variable, ses lignes et l’ancien ordre des côtés pour les restaurer si N remonte à2+ avant ✓. Valider à1 ne conserve qu’une série uniforme et l’ordre par défaut. Les deux formules bilatérales ne sont pas déclarées équivalentes à N=1 : la normalisation choisit explicitement la première.

## 4. Ordres d’exécution et pauses

Pour N=3, départ droit ; pour un départ gauche, inverser D et G sans autre changement :

| Configuration | Succession canonique |
|---|---|
| Unilatéral | S1 → P1 → S2 → P2 → S3 → [P3 ou R] |
| Un côté après l’autre | D1 → P1 → D2 → P2 → D3 → P3 → PC → G1 → P1 → G2 → P2 → G3 → [P3 ou R] |
| Les deux côtés à chaque série | D1 → PC → G1 → P1 → D2 → PC → G2 → P2 → D3 → PC → G3 → [P3 ou R] |

Un côté après l’autre : chaque Pi est exécutée deux fois, PC une seule fois. À la frontière, PN du premier côté **puis** PC sont exécutées : aucun repli de PC vers Pi. Les deux côtés à chaque série : chaque Pi intervient une seule fois après la paire, PC N fois à l’intérieur des paires. Le retour au premier côté pour la Série suivante suit Pi, sans PC supplémentaire.

La Pause terminale existe en direct et dans une occurrence avec R=0. Si R>0 dans une Séance, remplacer uniquement la toute dernière Pause PN par R ; ne jamais ajouter R à PN ni modifier la valeur stockée de PN. Cela s’applique à chaque occurrence, chaque Tour et à la dernière occurrence de la Séance. Une exécution directe n’a jamais de Récupération contextuelle.

Le Compte à rebours propre et la Fin d’exercice propre sont joués une seule fois pour l’Exercice complet, jamais par Série/côté. La substitution terminale intervient à la place de la Pause terminale ; la Fin propre reste liée à l’Exercice complet. Les phases nulles sont franchies immédiatement et de manière idempotente.

## 5. Durées, affichage et inversion

N = Séries par côté ; Ti = cible temporelle de la Série i ; Pi = Pause de cette Série ; PC = Pause entre les côtés ; R = Récupération de l’occurrence. Pour l’estimation Répétitions seulement, Ti=2×Ri secondes : aucune cadence n’est imposée au moteur.

| Configuration | Durée intrinsèque T | Uniforme (cible d, Pause p) |
|---|---|---|
| Unilatéral | Σ(Ti+Pi) | N×(d+p) |
| Un côté après l’autre | 2×Σ(Ti+Pi)+PC | 2N×(d+p)+PC |
| Les deux côtés à chaque série, N≥2 | 2×ΣTi+ΣPi+N×PC | N×(2d+p+PC) |

**Occurrence** : R=0 → To=T ; R>0 → To=T−PN+R. Cette soustraction est conditionnelle : ne pas soustraire PN lorsque R=0.

Catalogue d’exercices, paramètres de l’Exercice et exécution directe : durée intrinsèque. Composition, lignes de séances déployées, calendrier de source SESSION et exécution d’une occurrence : durée d’occurrence. Calendrier de source ACTIVITY : durée intrinsèque. Les totaux de Séance développent les occurrences et les Tours ; une récupération déjà substituée ne doit jamais être ajoutée une seconde fois. Les phases structurelles de Séance restent incluses/exclues selon la métrique concernée. Temps réellement écoulé/historique = durées réellement exécutées, jamais estimation réécrite.

Compte à rebours propre et Fin propre sont exclus du total intrinsèque de paramètres et de To défini ici. Ils restent des phases du plan complet lorsqu’ils sont configurés. L’affichage doit distinguer le total de l’occurrence du total du plan de Séance, sans les assimiler.

Durée : total exact. Répétitions : total estimé, libellé **Durée totale ≥**, non éditable. À l’échec : aucun total d’Exercice affiché. En variable, total toujours en lecture seule et — si une Série active est incomplète. Il reste dans le contenu lorsque le tableau est replié (pas nécessairement dans le viewport pendant le scroll). Le total uniforme reste affiché dans la feuille même à N=1 ; le résumé ne peut l’omettre comme redondant que si sa valeur égale réellement la cible de la Série.

**Saisie du total uniquement en Durée uniforme** : déterminer N dans1..99 au plus proche, égalité vers le haut, puis afficher la durée réalisable. Pour l’unilatéral : arrondi(Tv/(d+p)) ; pour Un côté après l’autre : arrondi((Tv−PC)/(2(d+p))). Pour Les deux côtés à chaque série et N≥2 : arrondi(Tv/(2d+p+PC)). Tenir compte de la normalisation N=1 : comparer les candidats réalisables et le candidat1 calculé Un côté après l’autre, puis retenir le total le plus proche (égalité : N le plus grand). Cette comparaison est nécessaire pour ne pas afficher un total calculé avec un ordre devenu inactif. Borner dans1..99 ; domaine du sélecteur = totaux réalisables extrêmes, selon l’ordre effectif. Le sélecteur conserve minutes/secondes.

Si T(N)≠Tv : « Durée ajustée à {T(N)} pour respecter un nombre entier de séries. » Sinon aucun message. Aucun pilote/contour de sélection sur Séries ; le contour désigne une ligne de roulette ou de segmenté ouverte.

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
| 8 | Durée totale | Durée uniforme : roulette ; variable/Répétitions : lecture seule ; À l’échec : absente |
| 9 | Compte à rebours | Stepper ; défaut Profil10s |
| 10 | Fin d’exercice | Stepper ; défaut Profil5s |

Création : mode/durée/côté non renseignés —, Série1, Pause0s ; cible Répétitions uniforme initiale1 ; aucune cible implicite lors d’un changement de mode variable. Côté vide normalisé Sans changement à validation. La feuille entière défile sous un en-tête ✕/titre/✓ fixe. Un seul segmenté/roulette ouvert ; les steppers restent visibles sans modale supplémentaire. Le chevron masque le tableau sans modifier les données ni désactiver le mode variable.

| Paramètre | Bornes | Granularité validée le02/10 |
|---|---|---|
| Séries | 1..99 | 1 |
| Répétitions par Série | 1..100 | 1 |
| Durée par Série | 1..5999s | 1s dans les steppers ; préserver cette précision à la saisie uniforme |
| Pause après chaque série / Pause entre les côtés | 0..300s | 0,1,2,3,4,5,10,15…120,150,180…300s |

Pas des pauses : 1s jusqu’à5s, 5s jusqu’à120s, 30s jusqu’à300s ; décrément parcourt la même grille en sens inverse. Bornes inchangées. Les données existantes ne sont pas arrondies par la seule ouverture/lecture. Maintien D-237 : action au relâchement/tap, sans attendre la fin de l’animation ; maintien et répétition450/150ms selon le DSF existant. Ce changement de pas ne redéfinit pas les bornes des autres paramètres Profil.

✓ grisé tant que le mode ou une cible active exigée est invalide ; cellule concernée signalée et message en ligne nommant la Série à renseigner. Pause0 valide. Repli du tableau ne contourne jamais la validation. Nom, Catégorie et Zones restent validés dans le parent.

## 7. Résumés et exécution

Carte Paramètres : `N séries variables : v1 · v2 · v3 …`, trois premières valeurs puis ellipse si davantage ; valeurs manquantes —. Répétitions : `12 · 10 · 8 rép.` ; À l’échec : `pauses 30 s · 45 s · 1 min`, sans total. Total applicable en lecture seule après le résumé. Bilatéral : préciser `droite puis gauche, un côté après l’autre` ou `droite puis gauche, les deux côtés à chaque série` (inverser la direction si nécessaire). La carte n’énumère pas toutes les lignes.

Ligne d’Exercice en Composition ou dans une Séance déployée : **N séries variables** sans détail des valeurs. Catalogue variable : même indicateur compact, total intrinsèque applicable. Les règles de cartes avec/sans média restent inchangées.

Pendant l’exécution : `Série n/N`, côté courant séparé, aucune numérotation globale1/(2N), aucune barre de progression par Série. La barre Tour reste celle des séances ; les mentions Tour résiduelles des maquettes d’exécution directe ne créent pas de Circuit en ACTIVITY. Les cibles et pauses viennent de la Série courante de l’instantané. À suivre : **Pause**, **Pause entre les côtés**, **Récupération** selon la phase effective ; jamais Récupération en direct. Le total de l’occurrence utilise To. La progression globale pondère le plan réellement généré suivant D-241 ; elle n’introduit aucune barre par Série.

Les commandes pause/reprise/arrêt conservent leurs contrats. Pour Un côté après l’autre, Réinitialiser conserve le bloc du côté courant selon D-029/D-150. Pendant une récupération, seule la phase courante est réinitialisée (RM-062). Le mapping de ce reset et du saut anticipé de bloc vers Les deux côtés à chaque série n’est pas défini par les sources : limite explicite du rapport et du chapitre13 §6 R-03, sans déduction depuis Figma.

## 8. Compatibilité, données, API et instantanés

Existant sans nouveaux attributs : uniforme, Un côté après l’autre. Quantité de travail, cibles, Pauses stockées et direction conservées. **Le changement de durée et de pauses exécutées est assumé pour les exercices existants**, confirmé le02/10. Les instantanés et résultats historiques restent immuables ; ne pas réécrire les durées réalisées.

À Pause uniforme p et PC>0, comparaison avec l’ancien calcul documenté : unilatéral R=0 +p ; unilatéral R>0 inchangé ; bilatéral par côté R=0 +2p ; bilatéral par côté R>0 +p. À PC=0, l’ancien repli changeait aussi la transition : ne pas appliquer ces écarts sans recalcul. L’affirmation générale du prompt « R>0 implique une durée inchangée » est corrigée explicitement. Il s’agit d’une comparaison documentaire, pas d’une certification du code historique.

Le modèle persistant et les copies/duplications doivent conserver le mode uniforme/variable explicite, N, la collection ordonnée cible/Pause lorsque variable, la direction, l’ordre des côtés, PC, Compte à rebours et Fin. R reste dans l’occurrence. Les paramètres variables remplacent les paramètres uniformes comme source effective, sans surcharges. Prévoir représentation et version d’instantané compatibles ; la structure SQL exacte et la migration relèvent de la planification technique, pas d’un nouveau choix Figma.

API de validation/calcul/duplication et construction du plan doivent consommer la même représentation et les mêmes formules. Aucun résumé textuel ni total dérivé n’est une source persistée indépendante. Persistance atomique : aucune série partiellement écrite, aucune mutation d’ActivityDefinition par sa copie dans une Séance.

## 9. Scénarios de recette normative

| Cas | Paramètres | Résultat |
|---|---|---|
| A | Unilatéral ; cibles30/45/60s ; Pauses10/20/30s | 195s =3min15s |
| B | A dans une Séance ; R120s | 195−30+120=285s =4min45s |
| C | A bilatéral Un côté après l’autre ; PC15s | 2×195+15=405s =6min45s |
| D | A bilatéral Les deux côtés à chaque série ; PC15s | 2×135+60+3×15=375s =6min15s |
| E | Répétitions12/10/8 ; Pauses30/45/60s ; unilatéral | ≥195s =≥3min15s |
| F | À l’échec ; Pauses30/45/60s | Aucun total |
| Uniforme | N3,d90s,p15s,unilatéral | 315s =5min15s |
| Uniforme bilatéral | N3,d90s,p15s,PC10s | Par côté640s =10min40s ; par paire615s =10min15s |
| N=1 bilatéral | d90s,p15s,PC10s ; ancien ordre alterné mémorisé | Ordre effectif par côté,220s =3min40s ; R30s →235s |
| Douze séries | Cibles20/25/30/35/40/45/45/40/35/30/25/20s ; Pause10s chacune | 390+120=510s =8min30s (les chiffres Figma ne définissent pas ce résultat) |

Vérifier aussi G→D, p=0, PC=0 sans repli, R=0/positif, N1/99, cible incomplète masquée, bascules avec restauration, réduction/augmentation, déplacement puis désactivation, duplication et sauvegarde/réouverture. L’inversion Durée inclut la frontière N=1 et les égalités. Les captures démontrent un layout ; elles ne remplacent pas ces critères.

# Cadence en Répétitions — spécification normative v1

06/10/2026. Décisions D-268 à D-297 (CAD-01 à CAD-30). Source : [conception validée](../archives/cadence-2026-10-06/conception-cadence-source.md). Les spécifications définissent calculs et comportements ; Figma le layout. Le classeur sert exclusivement aux phrases. Cette cible n’atteste pas une livraison logicielle.

## 1. Paramétrage et données

Cadence est une option du mode Répétitions, pas un quatrième mode. `repetitionIntervalSeconds?: integer|null`, 1..60 secondes, aucune présélection ; absent/null = Aucune. La roulette propose « Aucun » en plus des secondes1..60 ; ce choix retire la cadence (absence/null) de toutes les Séries dans le brouillon,✓ applique et✕ annule. Aucun bouton de suppression distinct. Ni0 ni une fraction ne sont valides. Aucun objet Répétition ni nouveau type de phase du plan.

Elle appartient à la Série. Le réglage commun uniforme est copié dans toutes les Séries à l’activation variable ; toute modification/suppression commune s’applique à toutes. Pas d’édition individuelle dans cette version. La collection ordonnée demeure la seule source effective ; pas de surcharge commune concurrente persistée. Revenir au mode Répétitions avant✓ restaure la cadence du brouillon ; ✓ dans un autre mode élimine la valeur cachée. ✕ annule l’ouverture, ✓ applique au brouillon parent, Terminer sauvegarde. Copie, duplication et instantané incluent la cadence ; migration d’un objet existant sans champ = absence, jamais2s.

## 2. Calcul et incertitude — révision du 07/10

Le guidage sonore, la progression et les comportements des sections suivantes sont conservés. Les signaux ne contraignent ni le mouvement ni la fin de Série : Ri×Ci est une estimation ≈. Le prompt « cadence déclarative sans signaux » est rejeté par le propriétaire.

| Retour | Condition | Rendu |
|---|---|---|
| exact | Travail Durée et phases temporelles prescrites | Valeur sans symbole |
| estimated | Travail cadencé, aucune composante inconnue | ≈ valeur, avec Ri×Ci pour le travail |
| lowerBound | Répétitions sans cadence ou agrégat avec travail inconnu | ≥ ; montant soumis à Q-07 |
| omitted | Exercice À l’échec | Aucune ligne Durée totale, ni zéro ni tiret |
| incomplete | Paramètre requis invalide/manquant | — et validation refusée ; état de validation distinct des quatre résultats valides |

Le symbole ≥ sans cadence est acté. La spécification antérieure calcule Ti≈2×Ri : cette estimation n’est pas un minimum garanti. Aucun nouveau calcul n’est décidé dans ce lot. Le montant à afficher avec ≥ reste à arbitrer (Q-07) ; ne pas réétiqueter automatiquement une estimation en borne ni appliquer silencieusement Ti=0.

Pauses, côtés et substitution R/PN suivent v13 §§4–5. Compte à rebours/Fin propres exclus du total intrinsèque et inclus dans le plan complet si applicables. L’omission propre À l’échec ne supprime pas les durées chronométrées du plan. Le montant des agrégats mixtes relève de Q-07. Durées réalisées inchangées. Le générateur reçoit le résultat typé ; aucune formule du classeur importée.

Voir [consolidation du 07/10](SPECIFICATION-PAUSES-SYMBOLES-2026-10-07.md).

## 3. Exécution, son et fin nominale

Première répétition immédiatement à00:00 ; chronomètre croissant. Pour10répétitions à4s : bips intermédiaires à4,8,…36s ; signal nominal final distinct à40s. Après40s, le chronomètre continue, aucun autre bip de cadence. Les bips de cadence remplacent le bip minute. Préférences audio existantes, aucune nouvelle préférence Profil ; les sons concrets restent à qualifier sur appareil.

La fin nominale ne termine pas la Série. Suivant termine normalement, avant ou après cette fin, sans confirmation de saut chronométré et sans statut Partielle du seul fait de la durée courte. Aucun nombre de répétitions réellement accomplies n’est déduit ou demandé. Les modes Durée et À l’échec conservent leur terminaison propre.

Même comportement en direct et en Séance, pour chaque occurrence, Tour, Série et côté. Le passage à Pause, Pause entre les côtés ou Récupération dépend du plan, jamais du dernier bip. Consulter un média ou changer de face ne suspend pas la cadence.

## 4. Progression, Pause et réinitialisation

Une Série cadencée contribue au groupe temporel de R-01 du chapitre13 avec poids fondé sur Ri×Ci ; progression continue. Avec k intervalles complets et fraction f du suivant, progression interne=min(1,(k+f)/Ri). Suivant anticipé acquiert le reste du poids ; à fin nominale, progression de Série plafonnée100%, Série toujours active. Aucun nouvel indicateur par Série n’est créé ; la publication de100% global attend la finalisation du plan.

Pause manuelle interrompt l’intervalle courant : sa fraction n’est pas acquise, la progression revient à k/Ri. Son temps actif reste dans le temps réel cumulé. Reprendre lance un nouvel intervalle complet, pas le reliquat. Le chronomètre actif ne remet pas ce temps dépensé à zéro. Après fin nominale déjà acquise, aucun bip ou intervalle supplémentaire n’est créé à la reprise. Les pauses programmées du plan sont distinctes de cette action.

Réinitialiser conserve la portée existante : Série courante unilatérale ; bloc du côté courant bilatéral selon D-029/D-150, y compris l’ordre par paire ; phase courante en récupération selon RM-062. Chronomètre de tentative00:00, cadence intervalle1, progression du périmètre0 ; cibles inchangées, autre côté et temps actif total des tentatives antérieures conservés. Réinitialiser n’efface pas le temps réellement dépensé.

## 5. Arrière-plan et sécurité

Verrouillage/arrière-plan ne sont pas une Pause manuelle : cadence continue à partir d’ancres temporelles ; au retour recalcul de l’intervalle et du nominal, aucun rejeu des bips manqués. La fiabilité audio dépend des plateformes et doit être qualifiée sur appareil.

Sans interaction : pause de sécurité30min après fin nominale recalculée (une fraction abandonnée décale cette fin). Exemple sans pause10×4s : seuil30min40s. Répétitions sans cadence/À l’échec : règle2h sans interaction conservée. Aucun arrêt automatique en l’absence de réponse au choix Reprendre/Arrêter : état suspendu conservé.

## 6. Contrat technique et résultats

Instantané immuable et versionné : séries ordonnées, cible répétitions et cadence prescrite facultative. Plan : phase Série existante avec `targetRepetitions`, `repetitionIntervalSeconds?`, `estimatedCadenceDurationSeconds` dérivé. Capacité de calcul temporel et terminaison automatique sont deux propriétés distinctes : une Série cadencée fournit une estimation mais se termine par Suivant.

État moteur récupérable : intervalles complets acquis, ancre du courant, durée de cadence, fin nominale atteinte, état suspendu et accumulateur de temps réel distinct du chronomètre de tentative. Persistance atomique/idempotente aux transitions ; résultat par Série et côté si pertinent. Une réinitialisation conserve les temps des tentatives ; un changement ultérieur du Catalogue ne modifie pas l’historique.

## 7. Recette issue des spécifications

| Cas | Attendu |
|---|---|
| Cadence absente,1,60 ;0,61,1.5 | Absence valide ; bornes valides ; autres valeurs refusées sans mutation partielle |
|10répétitions×4s, sans pause |00:00 immédiat ;9 bips intermédiaires ; signal distinct40s ; Série toujours active après40s |
| Suivant à20s ou45s | Fin normale sans confirmation ni Partielle due à la durée ; temps réel20s/45s |
| Pause à6s pour10×4s |1 intervalle acquis ; temps réel6s ; progression retombe de15% à10% ; reprise avec4s entières ; prochain signal après4s actives |
| Reset après6s, puis10s exécutées | Tentative courante10s ; temps réel cumulé16s ; autre côté conservé |
| Arrière-plan pendant deux intervalles | Recalcul par ancres ; aucun bip rattrapé ; pas de redémarrage comme une Pause |
| Variable, déplacement et duplication | Cadence commune propagée ; propriétés de ligne solidaires ; snapshot immuable |
| Catalogue/Séance/Calendrier/Suivi |≈ seulement pour estimation ;≥ seulement borne non estimable ; temps réalisé sans réécriture |

Ces cas sont des exigences de recette, pas des tests annoncés exécutés. Les montants du classeur ne les définissent pas.


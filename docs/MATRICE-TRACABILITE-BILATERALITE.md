# Matrice de traçabilité — Bilatéralité

> Mise à jour du 24 septembre 2026 — D-189 : le changement de côté n’est plus exposé au niveau du Circuit. Les critères historiques relatifs à un Tour bilatéral ne constituent plus des exigences actives. La bilatéralité active est portée par les Exercices ; le support technique historique correspondant reste conservé, fixé à `UNILATERAL`, pour non-régression.

Date de consolidation : 10 septembre 2026. Correction finale contrôlée sur `main@a904c16dc2f77189c42012071ba8ff481f122410` et sur la copie de `docs/PRODUCT.md` issue de `/Dev` fournie le 10 septembre 2026.

Les statuts portent sur le corpus documentaire canonique composé de `docs/PRODUCT.md`, `docs/INDEX.md`, des chapitres `00` à `13`, de la présente matrice et du rapport de conformité. `CONFORME` signifie que la décision validée est explicitement couverte sans ancienne règle contradictoire active connue. L’archive initiale reste une preuve de provenance historique ; elle n’est plus la limite du contrôle final.

| ID | Décision consolidée | Évidence principale | Statut |
|---|---|---|---|
| BIL-001 | États `UNILATERAL`, `RIGHT_LEFT`, `LEFT_RIGHT` | 00, 04, 09, 12 | CONFORME |
| BIL-002 | États courts de l’Exercice : `Aucun` n’affiche aucun indicateur sur la carte ; les états bilatéraux affichent `D→G` ou `G→D`. Aucun état de côté n’est exposé au niveau Tour. | 00, 06, 13 ; D-189/D-198 ; Figma courant | CONFORME |
| BIL-003 | Libellés accessibles développés | 00, 08, 13 | CONFORME |
| BIL-004 | Cycle U → D→G → G→D → U | 03, 08, 10, 13 | CONFORME |
| BIL-005 | État initial et migration `UNILATERAL` | 04, 09, 10, 12 | CONFORME |
| BIL-006 | Disponible en Durée, Répétitions, À l’échec | 06, 08, 13 | CONFORME |
| BIL-007 | Ancienne capacité fonctionnelle d’un Tour bilatéral | D-189 | SUPERSÉDÉ — le Tour reste techniquement `UNILATERAL` et non modifiable |
| BIL-008 | Phases structurelles et Récupérations sans réglage propre | 00, 08, 09, 10 | CONFORME |
| BIL-009 | Zones corporelles non latéralisées | 00, 02, 06 | CONFORME |
| BIL-010 | Exercice : toutes les Séries du premier côté puis du second | 03, 07 D-144, 08 | CONFORME |
| BIL-011 | Pour `C` Séries d’un même côté : toujours `C − 1` Pauses, uniquement entre Séries successives | PRODUCT, 00, 04, 06–11, D-208 | CONFORME D-208 |
| BIL-012 | Aucune Pause ajoutée entre côtés | 06, 07 D-144, 10 | CONFORME |
| BIL-013 | Pause au changement de côté éventuelle une fois entre le premier et le second côté | 00, 04, 06, 08–10, D-208 | CONFORME D-208 |
| BIL-014 | Nombre de Séries interprété par côté | 00, 06, 08, 10 | CONFORME |
| BIL-015 | Durée totale globale aux deux côtés | INDEX, 00, 06, 08 | CONFORME |
| BIL-016 | Durée intrinsèque bilatérale = `2×[C×A+(C−1)×B]+S` | PRODUCT, 04, 08–13, D-208 | CONFORME D-208 |
| BIL-017 | Séries pilotes : recalcul bilatéral avec `S=sideRecoverySeconds` et sans post-récupération | 06, 08–13 | CONFORME D-208 |
| BIL-018 | Durée totale pilote : cible intrinsèque de l’Exercice, post-récupération exclue | 06, 08, 10, 11, 13 | CONFORME D-208 |
| BIL-019 | Arrondi au plus proche, `.5` vers le haut, minimum 1 | 06, 08, 10, 11, 13 | CONFORME |
| BIL-020 | Après arrondi, recalcul de D réalisable | 06, 08, 10, 11, 13 | CONFORME |
| BIL-021 | Tour bilatéral exposé | D-189 | SUPERSÉDÉ |
| BIL-022 | Paire de passages à chaque Tour du Circuit | 03, 08, 10 | CONFORME |
| BIL-023 | `LEFT_RIGHT` inverse l’ordre sans changer le calcul | 00, 08, 12 | CONFORME |
| BIL-024 | Récupération par passage de Tour bilatéral | D-189 | SUPERSÉDÉ |
| BIL-025 | Ancienne règle d’héritage de direction depuis le Tour | D-189 | SUPERSÉDÉ — chaque Exercice porte sa direction propre |
| BIL-026 | Ancienne confirmation conditionnelle lors de l’activation bilatérale du Tour | D-189 | SUPERSÉDÉ — aucune activation bilatérale du Tour n’est exposée |
| BIL-027 | Ancienne mutation des Exercices lors de la confirmation d’un Tour bilatéral | D-189 | SUPERSÉDÉ — aucune confirmation ni mutation liée au Tour |
| BIL-028 | Source effective portée par le Tour | D-189 | SUPERSÉDÉ — source active = Exercice |
| BIL-029 | Ancienne désactivation des contrôles Exercice sous un Tour bilatéral | D-189 | SUPERSÉDÉ — aucune priorité de direction du Tour |
| BIL-030 | Ancien affichage des contrôles Exercice sous héritage du Tour | D-189 | SUPERSÉDÉ — aucune notion d’héritage du Tour |
| BIL-031 | Ancienne désactivation de la bilatéralité du Tour sans restauration | D-189 | SUPERSÉDÉ — aucun réglage de côté Tour exposé |
| BIL-032 | Duplication d’Exercice conserve le côté | 04, 07 D-147, 11 | CONFORME |
| BIL-033 | Duplication de Tour conserve un côté utilisateur | D-189 | SUPERSÉDÉ — champ technique historique seulement |
| BIL-034 | Exercice bilatérale en deux passages distincts | 03, 04, 08, 09 | CONFORME |
| BIL-035 | Résultats séparés par côté | 02, 04, 09, 11 | CONFORME |
| BIL-036 | Un côté partiel rend l’Exercice globale partielle | 02, 04, 10, 13 | CONFORME |
| BIL-037 | `Exercice X/Y` conserve le rang logique | 03, 06, 07 D-149, 10 | CONFORME |
| BIL-038 | Sous-titre `Côté droit` ou `Côté gauche`, sans compteur | 00, 03, 06, 07 D-149, 13 ; Figma `1992:*` | CONFORME |
| BIL-039 | Barre globale fondée sur les passages développés | 08, 12 | CONFORME |
| BIL-040 | Annonce du premier côté au démarrage | 08, 12 | CONFORME |
| BIL-041 | Annonce unique du second côté à la transition | 08, 12 | CONFORME |
| BIL-042 | Ancienne annonce liée aux passages d’un Tour bilatéral | D-189 | SUPERSÉDÉ — les annonces de côté sont portées par l’Exercice |
| BIL-043 | Réinitialisation limitée au côté courant | 06, 08, 10, 11, 13 | CONFORME |
| BIL-044 | Résultat de l’autre côté préservé | 04, 08, 11, 13 | CONFORME |
| BIL-045 | Modale générique de passage anticipé inchangée | 03, 06, 07 D-150, 13 | CONFORME |
| BIL-046 | Confirmation écrit le côté courant comme partiel | 03, 04, 08, 11 | CONFORME |
| BIL-047 | Après le premier côté, prochaine étape = second côté | 03, 06, 08, 11, 13 | CONFORME |
| BIL-048 | Règles Durée/Répétitions/Échec appliquées par passage | 01, 06, 08, 12 | CONFORME |
| BIL-049 | Exercice persistante porte un côté par défaut | 04, 09, 11 | CONFORME |
| BIL-050 | Insertion en Séance copie le côté | 04, 07 D-147, 11 | CONFORME |
| BIL-051 | Copie de Séance indépendante de la source | 04, 07 D-147, 11 | CONFORME |
| BIL-052 | Aucune propagation rétroactive | 01, 04, 07 D-147 | CONFORME |
| BIL-053 | Modèle `activity.sideMode` | 04, 09, 12 | CONFORME |
| BIL-054 | Modèle `tour.sideMode` historique conservé, fixé à `UNILATERAL`, non exposé et non modifiable | 04, 09, 12 ; D-189 | CONFORME |
| BIL-055 | Direction effective figée dans le Plan | 04, 09, 11, 12 | CONFORME |
| BIL-056 | Côté conservé dans le Résultat | 04, 09, 11, 12 | CONFORME |
| BIL-057 | Tranche Configuration avant T03 | 05, 07 D-151 | CONFORME |
| BIL-058 | Tranche : persistance, duplication, calculs, UI, validations | 05, 09–13 | CONFORME |
| BIL-059 | Exécution réelle et résultats dans T03 révisée | INDEX, 01, 05, 08–13 | CONFORME |
| BIL-060 | T03 explicitement révisée | INDEX, 04–07, 10, 13 | CONFORME |

| BIL-061 | Ancien contrôle visuel de direction du Tour | D-152 supersédée par D-189 ; anciennes évidences Figma | SUPERSÉDÉ — aucun contrôle de côté Tour dans la version actuelle |
| BIL-062 | Anciens états UI de direction du Tour (`–`, `D→G`, `G→D`) | D-189 ; anciennes évidences Figma | SUPERSÉDÉ — aucun état de côté n’est exposé au niveau Tour |
| BIL-063 | Ancienne application directe d’un changement de direction au Tour | D-146 supersédée par D-189 | SUPERSÉDÉ — aucune action de changement de côté Tour |
| BIL-064 | Ancienne confirmation atomique liée au changement de direction du Tour | D-146 supersédée par D-189 | SUPERSÉDÉ — aucune confirmation de bilatéralité Tour |
| BIL-065 | Carte de Composition : indicateur propre `D→G` / `G→D` pour l’Exercice ; absence avec `Aucun` ; aucune notion d’héritage du Tour | PRODUCT, 00, 06–08, 10, 13 ; D-189/D-198 ; Figma courant | CONFORME |
| BIL-066 | Contrôle Exercice : ligne 2 colonne 1, `74 × 42 pt`, grille `74/124/124`, espaces `8/10 pt` | 06–08, 12, CE-T01-13/CE-BIL-01 ; Figma `3704:5021`, `3542:4656` | CONFORME |
| BIL-067 | Synthèse de l’écran Ajouter/Modifier un Exercice : clause après cible et avant Pause ; texte de carte de Composition sans cette clause ; absence en unilatéral/héritage | PRODUCT, 06–08, D-154, RM-152, CE-T01-13/CE-BIL-02A ; Figma `3679:4880`, `3724:5428` | CONFORME |
| BIL-068 | `Durée totale` dans les trois modes ; borne `≥` en Répétitions/À l’échec | PRODUCT, 06–08, 10, 13 ; Figma `3561:4695`, `3561:7673`, `3561:7802` | CONFORME |

## Contrôle de cohérence final

`docs/PRODUCT.md` reprend désormais la synthèse des états, de l’ordre des passages, des Pauses, des Récupérations, des calculs, de la priorité du Tour, de l’Exécution, des Résultats par côté et du découpage Configuration puis T03 révisée. Les manifestes historiques de tranches clôturées ont été exclus du périmètre d’écriture et restent inchangés.

## Formules canoniques

Pour un Exercice autonome en mode Durée, D-208 fixe :

- `C` = nombre de Séries par côté ;
- `A` = durée cible d’une Série ;
- `B` = Pause entre Séries ;
- `L = 1` en unilatéral et `L = 2` en bilatéral ;
- `S = 0` en unilatéral et `S = sideRecoverySeconds` en bilatéral ;
- `D = L × [C × A + (C − 1) × B] + S` ;
- si la Durée totale pilote : `Cth = ((D − S) / L + B) / (A + B)` ;
- arrondi au plus proche, `.5` vers le haut, minimum `1`, puis recalcul de `D`.

`postActivityRecoverySeconds` est exclu de la durée intrinsèque. En mode Répétitions, la même structure est utilisée pour l’estimation en remplaçant `A` par `N`, nombre de répétitions par Série interprété conventionnellement en secondes.

Historique : l’ancien modèle permettait au Tour de porter la direction. Depuis D-189, cette capacité n’est plus exposée ; la direction active est portée par l’Exercice. L’ancienne formule `P(C,R)` est supersédée par D-208.

## Mise à jour D-208 — récupération et bilatéralité

D-208 supersède D-156 sur les Pauses et remplace la récupération après les deux côtés par une récupération **entre** les côtés. La récupération après exercice appartient à l’occurrence de Séance/Parcours et ne participe pas au calcul intrinsèque de bilatéralité.


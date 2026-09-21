> **Portée version courante — D-200 (21/09/2026).** La bilatéralité du Tour n’est pas activée fonctionnellement : `tour.sideMode` est conservé mais figé à `UNILATERAL`. Les lignes historiques relatives au contrôle/à l’activation du Tour sont marquées `SUPERSÉDÉ`; la bilatéralité active est portée par les Activités.

# Matrice de traçabilité — Bilatéralité

Date de consolidation : 10 septembre 2026. Correction finale contrôlée sur `main@a904c16dc2f77189c42012071ba8ff481f122410` et sur la copie de `docs/PRODUCT.md` issue de `/Dev` fournie le 10 septembre 2026.

Les statuts portent sur le corpus documentaire canonique composé de `docs/PRODUCT.md`, `docs/INDEX.md`, des chapitres `00` à `13`, de la présente matrice et du rapport de conformité. `CONFORME` signifie que la décision validée est explicitement couverte sans ancienne règle contradictoire active connue. L’archive initiale reste une preuve de provenance historique ; elle n’est plus la limite du contrôle final.

| ID | Décision consolidée | Évidence principale | Statut |
|---|---|---|---|
| BIL-001 | États `UNILATERAL`, `RIGHT_LEFT`, `LEFT_RIGHT` | 00, 04, 09, 12 | CONFORME |
| BIL-002 | États courts : Activité unilatérale sans texte, Tour unilatéral `–`, bilatéral `D→G` ou `G→D` | 00, 06, 13 ; géométrie Figma `3705:5021`, `3706:5020` | CONFORME — tiret décidé après contrôle Figma |
| BIL-003 | Libellés accessibles développés | 00, 08, 13 | CONFORME |
| BIL-004 | Cycle U → D→G → G→D → U | 03, 08, 10, 13 | CONFORME |
| BIL-005 | État initial et migration `UNILATERAL` | 04, 09, 10, 12 | CONFORME |
| BIL-006 | Disponible en Durée, Répétitions, À l’échec | 06, 08, 13 | CONFORME |
| BIL-007 | Un Tour peut être bilatéral | 03, 04, 06, 08, 13 | CONFORME |
| BIL-008 | Phases structurelles et Récupérations sans réglage propre | 00, 08, 09, 10 | CONFORME |
| BIL-009 | Zones corporelles non latéralisées | 00, 02, 06 | CONFORME |
| BIL-010 | Activité : toutes les Séries du premier côté puis du second | 03, 07 D-144, 08 | CONFORME |
| BIL-011 | Pour `C` Séries d’un même côté : `C` Pauses si `R = 0`, sinon `C − 1`; aucune Pause supplémentaire propre au changement de côté | PRODUCT, 00, 06–11, D-156 | CONFORME |
| BIL-012 | Aucune Pause ajoutée entre côtés | 06, 07 D-144, 10 | CONFORME |
| BIL-013 | Récupération d’Activité une fois après les deux côtés | 00, 06, 08, 10 | CONFORME |
| BIL-014 | Nombre de Séries interprété par côté | 00, 06, 08, 10 | CONFORME |
| BIL-015 | Durée totale globale aux deux côtés | INDEX, 00, 06, 08 | CONFORME |
| BIL-016 | Multiplicateur `L = 2` en bilatéral | INDEX, 06, 08–13 | CONFORME |
| BIL-017 | Séries pilotes : recalcul bilatéral de D | 06, 08–13 | CONFORME |
| BIL-018 | Durée totale pilote : cible globale | 06, 08, 10, 11, 13 | CONFORME |
| BIL-019 | Arrondi au plus proche, `.5` vers le haut, minimum 1 | 06, 08, 10, 11, 13 | CONFORME |
| BIL-020 | Après arrondi, recalcul de D réalisable | 06, 08, 10, 11, 13 | CONFORME |
| BIL-021 | Tour : tout le contenu premier côté puis second | 03, 07 D-145, 08 | CONFORME |
| BIL-022 | Paire de passages à chaque répétition du Tour | 03, 08, 10 | CONFORME |
| BIL-023 | `LEFT_RIGHT` inverse l’ordre sans changer le calcul | 00, 08, 12 | CONFORME |
| BIL-024 | Récupération une fois après tous les côtés de l’Activité | 00, 08–11 ; D-200 | CONFORME — règle active |
| BIL-025 | Toutes les Activités héritent du Tour ; aucune notion « latéralisable » | 00, 04, 06, 07 D-145, 10, 13 | CONFORME |
| BIL-026 | Confirmation seulement si une Activité propre bilatérale sera remplacée ; sinon application directe | PRODUCT, 02–04, 06–13 ; D-146 ; CE-BIL-02 | CONFORME |
| BIL-027 | Confirmation remet uniquement les Activités propres bilatérales concernées à `UNILATERAL` | 03, 04, 06, 09, 13 | CONFORME |
| BIL-028 | Source effective version courante : Activité ; priorité Tour conservée uniquement dans le moteur dormant | 00, 04, 09, 12 ; D-200 | CONFORME — règle active |
| BIL-029 | Contrôles enfants visibles mais désactivés | 04, 06, 10, 13 | CONFORME |
| BIL-030 | Contrôles enfants montrent leur état propre unilatéral | 04, 06, 13 | CONFORME |
| BIL-031 | Désactivation du Tour sans restauration | 04, 07 D-146, 09, 10 | CONFORME |
| BIL-032 | Duplication d’Activité conserve le côté | 04, 07 D-147, 11 | CONFORME |
| BIL-033 | Duplication de Tour conserve le côté | 04, 07 D-147, 11 | CONFORME |
| BIL-034 | Activité bilatérale en deux passages distincts | 03, 04, 08, 09 | CONFORME |
| BIL-035 | Résultats séparés par côté | 02, 04, 09, 11 | CONFORME |
| BIL-036 | Un côté partiel rend l’Activité globale partielle | 02, 04, 10, 13 | CONFORME |
| BIL-037 | `Activité X/Y` conserve le rang logique | 03, 06, 07 D-149, 10 | CONFORME |
| BIL-038 | Sous-titre `Côté droit` ou `Côté gauche`, sans compteur | 00, 03, 06, 07 D-149, 13 ; Figma `1992:*` | CONFORME |
| BIL-039 | Barre globale fondée sur les passages développés | 08, 12 | CONFORME |
| BIL-040 | Annonce du premier côté au démarrage | 08, 12 | CONFORME |
| BIL-041 | Annonce unique du second côté à la transition | 08, 12 | CONFORME |
| BIL-042 | Tour : annonce une fois par passage complet | 08, 12 | CONFORME |
| BIL-043 | Réinitialisation limitée au côté courant | 06, 08, 10, 11, 13 | CONFORME |
| BIL-044 | Résultat de l’autre côté préservé | 04, 08, 11, 13 | CONFORME |
| BIL-045 | Modale générique de passage anticipé inchangée | 03, 06, 07 D-150, 13 | CONFORME |
| BIL-046 | Confirmation écrit le côté courant comme partiel | 03, 04, 08, 11 | CONFORME |
| BIL-047 | Après le premier côté, prochaine étape = second côté | 03, 06, 08, 11, 13 | CONFORME |
| BIL-048 | Règles Durée/Répétitions/Échec appliquées par passage | 01, 06, 08, 12 | CONFORME |
| BIL-049 | Activité persistante porte un côté par défaut | 04, 09, 11 | CONFORME |
| BIL-050 | Insertion en Séance copie le côté | 04, 07 D-147, 11 | CONFORME |
| BIL-051 | Copie de Séance indépendante de la source | 04, 07 D-147, 11 | CONFORME |
| BIL-052 | Aucune propagation rétroactive | 01, 04, 07 D-147 | CONFORME |
| BIL-053 | Modèle `activity.sideMode` | 04, 09, 12 | CONFORME |
| BIL-054 | Modèle `tour.sideMode` conservé techniquement, valeur produit figée `UNILATERAL` | 04, 09, 12 ; D-200 | CONFORME — capacité dormante |
| BIL-055 | Direction effective figée dans le Plan | 04, 09, 11, 12 | CONFORME |
| BIL-056 | Côté conservé dans le Résultat | 04, 09, 11, 12 | CONFORME |
| BIL-057 | Tranche Configuration avant T03 | 05, 07 D-151 | CONFORME |
| BIL-058 | Tranche : persistance, duplication, calculs, UI, validations | 05, 09–13 | CONFORME |
| BIL-059 | Exécution réelle et résultats dans T03 révisée | INDEX, 01, 05, 08–13 | CONFORME |
| BIL-060 | T03 explicitement révisée | INDEX, 04–07, 10, 13 | CONFORME |

| BIL-061 | Contrôle Tour historique `42 × 34 pt` | D-152, D-200 ; Figma `3705:5021`, `2028:11743` | SUPERSÉDÉ — aucun contrôle Tour dans les écrans actifs |
| BIL-062 | États UI du côté Tour `–` / `D→G` / `G→D` | D-152, D-200 ; anciennes évidences Figma | SUPERSÉDÉ — capacité non activée |
| BIL-063 | Activation bilatérale du Tour | D-146, D-200 | SUPERSÉDÉ — aucune activation utilisateur dans la version courante |
| BIL-064 | Confirmation d’activation bilatérale du Tour | D-146, D-200 | SUPERSÉDÉ — aucune confirmation Tour dans la version courante |
| BIL-065 | Carte de Composition : indicateur propre `D→G` / `G→D` à `42 × 20 pt`; absence uniquement en `UNILATERAL` | PRODUCT, 00, 06–08, 10, 13 ; D-154/D-200 ; Figma `3706:5020` | CONFORME — règle active |
| BIL-066 | Contrôle Activité : ligne 2 colonne 1, `74 × 42 pt`, grille `74/124/124`, espaces `8/10 pt` | 06–08, 12, CE-T01-13/CE-BIL-01 ; Figma `3704:5021`, `3542:4656` | CONFORME |
| BIL-067 | Synthèse de l’écran Ajouter/Modifier une Activité : clause après cible et avant Pause ; texte de carte de Composition sans cette clause ; absence en unilatéral/héritage | PRODUCT, 06–08, D-154, RM-152, CE-T01-13/CE-BIL-02A ; Figma `3679:4880`, `3724:5428` | CONFORME |
| BIL-068 | `Durée totale` dans les trois modes ; borne `≥` en Répétitions/À l’échec | PRODUCT, 06–08, 10, 13 ; Figma `3561:4695`, `3561:7673`, `3561:7802` | CONFORME |

## Contrôle de cohérence final

`docs/PRODUCT.md` reprend désormais la synthèse des états, de l’ordre des passages, des Pauses, des Récupérations, des calculs, de la priorité du Tour, de l’Exécution, des Résultats par côté et du découpage Configuration puis T03 révisée. Les manifestes historiques de tranches clôturées ont été exclus du périmètre d’écriture et restent inchangés.

## Formules canoniques

Pour une Activité autonome en mode Durée :

- `L = 1` pour `UNILATERAL`, `L = 2` pour `RIGHT_LEFT` ou `LEFT_RIGHT` ;
- `P(C,R) = C` si `R = 0`, sinon `P(C,R) = C − 1` ;
- `D = L × [C × A + P(C,R) × B] + R` ;
- si `R = 0`, `Cth = D / [L × (A + B)]` ; si `R > 0`, `Cth = ((D − R) / L + B) / (A + B)` ;
- arrondi au plus proche, `.5` vers le haut, minimum `1`, puis recalcul de `D`.

Dans la version actuelle, aucun Tour bilatéral n’est produit par le produit : `tour.sideMode` est figé à `UNILATERAL`. Le moteur conserve néanmoins sa capacité historique à développer un Tour bilatéral ; cette branche reste non exposée et non opposable comme comportement produit.


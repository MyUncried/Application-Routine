# Matrice de traçabilité — Bilatéralité

Date de consolidation : 10 septembre 2026. Correction finale contrôlée sur `main@a904c16dc2f77189c42012071ba8ff481f122410` et sur la copie de `docs/PRODUCT.md` issue de `/Dev` fournie le 10 septembre 2026.

Les statuts portent sur le corpus documentaire canonique composé de `docs/PRODUCT.md`, `docs/INDEX.md`, des chapitres `00` à `13`, de la présente matrice et du rapport de conformité. `CONFORME` signifie que la décision validée est explicitement couverte sans ancienne règle contradictoire active connue. L’archive initiale reste une preuve de provenance historique ; elle n’est plus la limite du contrôle final.

| ID | Décision consolidée | Évidence principale | Statut |
|---|---|---|---|
| BIL-001 | États `UNILATERAL`, `RIGHT_LEFT`, `LEFT_RIGHT` | 00, 04, 09, 12 | CONFORME |
| BIL-002 | Libellés courts absent, `D→G`, `G→D` | 00, 06, 13 ; Figma `3706:5020` | CONFORME |
| BIL-003 | Libellés accessibles développés | 00, 08, 13 | CONFORME |
| BIL-004 | Cycle U → D→G → G→D → U | 03, 08, 10, 13 | CONFORME |
| BIL-005 | État initial et migration `UNILATERAL` | 04, 09, 10, 12 | CONFORME |
| BIL-006 | Disponible en Durée, Répétitions, À l’échec | 06, 08, 13 | CONFORME |
| BIL-007 | Un Tour peut être bilatéral | 03, 04, 06, 08, 13 | CONFORME |
| BIL-008 | Phases structurelles et Récupérations sans réglage propre | 00, 08, 09, 10 | CONFORME |
| BIL-009 | Zones corporelles non latéralisées | 00, 02, 06 | CONFORME |
| BIL-010 | Activité : toutes les Séries du premier côté puis du second | 03, 07 D-144, 08 | CONFORME |
| BIL-011 | Pauses uniquement entre Séries du même côté | 00, 06, 08, 10 | CONFORME |
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
| BIL-024 | Récupération une fois par passage de Tour bilatéral | 00, 08–11 | CONFORME |
| BIL-025 | Toutes les Activités héritent du Tour ; aucune notion « latéralisable » | 00, 04, 06, 07 D-145, 10, 13 | CONFORME |
| BIL-026 | Confirmation seulement si une Activité propre bilatérale sera remplacée ; sinon application directe | PRODUCT, 02–04, 06–13 ; D-146 ; CE-BIL-02 | CONFORME |
| BIL-027 | Confirmation remet uniquement les Activités propres bilatérales concernées à `UNILATERAL` | 03, 04, 06, 09, 13 | CONFORME |
| BIL-028 | Source effective : Tour bilatéral, sinon Activité | 00, 04, 09, 12 | CONFORME |
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
| BIL-054 | Modèle `tour.sideMode` | 04, 09, 12 | CONFORME |
| BIL-055 | Direction effective figée dans le Plan | 04, 09, 11, 12 | CONFORME |
| BIL-056 | Côté conservé dans le Résultat | 04, 09, 11, 12 | CONFORME |
| BIL-057 | Tranche Configuration avant T03 | 05, 07 D-151 | CONFORME |
| BIL-058 | Tranche : persistance, duplication, calculs, UI, validations | 05, 09–13 | CONFORME |
| BIL-059 | Exécution réelle et résultats dans T03 révisée | INDEX, 01, 05, 08–13 | CONFORME |
| BIL-060 | T03 explicitement révisée | INDEX, 04–07, 10, 13 | CONFORME |

| BIL-061 | Contrôle Tour : parent, ligne, `x=311`, `42 × 34 pt`, espace `8 pt`, alignements | 06, D-152, 12, CE-T02-01/CE-BIL-02 ; Figma `3705:5021`, `2028:11743` | CONFORME |
| BIL-062 | Tour : aucun titre ; états vide, `D→G`, `G→D` et accessibilité | 06, D-143/D-152, CE-BIL-02 ; Figma `2028:11700`, `3722:5061`, `3722:5207` | CONFORME |
| BIL-063 | Application directe si Tour vide ou Activités toutes propres `UNILATERAL` | PRODUCT, 02–04, 06–11, 13 ; D-146 | CONFORME |
| BIL-064 | Confirmation atomique limitée aux Activités propres bilatérales ; annulation sans mutation | 03, 04, D-146, 09–11, CE-BIL-02 | CONFORME |
| BIL-065 | Carte : direction propre à `x=311`, `y=24,5`, `42 × 20 pt`; absence en unilatéral/héritage | PRODUCT, 00, 06–08, 10, CE-BIL-02A ; Figma `3706:5020`, `2028:11700` | CONFORME |
| BIL-066 | Contrôle Activité : ligne 2 colonne 1, `74 × 42 pt`, grille `74/124/124`, espaces `8/10 pt` | 06–08, 12, CE-T01-13/CE-BIL-01 ; Figma `3704:5021`, `3542:4656` | CONFORME |
| BIL-067 | Synthèse propre : clause après cible et avant Pause ; absence en unilatéral/héritage | PRODUCT, 06–08, 10, 13 ; Figma `3679:4880`, `3724:5428` | CONFORME |
| BIL-068 | `Durée totale` dans les trois modes ; borne `≥` en Répétitions/À l’échec | PRODUCT, 06–08, 10, 13 ; Figma `3561:4695`, `3561:7673`, `3561:7802` | CONFORME |

## Contrôle de cohérence final

`docs/PRODUCT.md` reprend désormais la synthèse des états, de l’ordre des passages, des Pauses, des Récupérations, des calculs, de la priorité du Tour, de l’Exécution, des Résultats par côté et du découpage Configuration puis T03 révisée. Les manifestes historiques de tranches clôturées ont été exclus du périmètre d’écriture et restent inchangés.

## Formules canoniques

Pour une Activité autonome en mode Durée :

- `L = 1` pour `UNILATERAL`, `L = 2` pour `RIGHT_LEFT` ou `LEFT_RIGHT` ;
- `D = L × [C × A + (C − 1) × B] + R` ;
- `Cth = ((D − R) / L + B) / (A + B)` lorsque la Durée totale pilote ;
- arrondi au plus proche, `.5` vers le haut, minimum `1`, puis recalcul de `D`.

Dans un Tour bilatéral, la direction du Tour développe deux passages complets de son contenu. Le multiplicateur d’une Activité n’est jamais appliqué une seconde fois.


# DSF — Deux modes et cible À l’échec — 13/10/2026

Référence courante pour les composants ci-dessous, en complément du [DSF Circuits](DSF-CIRCUITS-CONTROLES-2026-10-12.md). Source : prompt transmis et inspection directe des deux pages Figma et du set `5544:5146`. Les dates des fichiers désignent le lot source. Les règles métier sont dans la [spécification](Specifications-fonctionnelles/SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md), les interactions dans CE-UI-10 ; Figma détermine le layout.

## Popover de mode

Deux options, Durée et Répétitions ; À l’échec quitte le choix de mode et devient une cible. Référence locale184×99, hauteur automatique (anciennement136). Même traitement en séries identiques/variables. Conserver shell, ancrage, voile et comportement de brouillon existants.

## Roulette de cible

Le set `DSF / Forms / Roulette` contient désormais cinq variantes. Les quatre numériques restent présentes : Secondes `5544:5101`, Minutes secondes `5544:5118`, Fin de séance `5826:4290`, Secondes avec unité `7130:13496`. La cinquième, `État=Minutes secondes avec échec`, est `8452:13297`.

| Élément de la nouvelle variante | Géométrie locale | Rendu |
|---|---|---|
| Ensemble | 330×181 | Hauteur du contenu |
| Option À l’échec | 330×30, y0 | Texte centré, Inter Regular20, marge verticale3 |
| Séparateur | 330×1, y30 | Remplissage des séparateurs de popover |
| Roulette numérique | 330×150, y31 | Structure numérique conservée |
| Popover hôte de cible | 354×249 | Hauteur automatique ; ancien216 |

Libellé : **Aucune durée, à l’échec** / **Aucune répétition, à l’échec**, selon le mode. Option en tête ; pas de coche. Le contrôle ouvre la cible courante ; validation par ✓ de la feuille, annulation par ✕. La sélection numérique et l’échec s’excluent mutuellement.

Toutes les lignes numériques ont le remplissage `#1a1a1f`. Le dégradé dépend de **l’opacité du remplissage**, pas d’une nouvelle couleur :

| Position | Opacité | Taille |
|---|---|---|
| Sélection | 100% | 20px |
| Voisine | 45% | 16px |
| Distance2 | 20% | 14px |
| Distance3 | 10% | 12px |
| Option échec sélectionnée / non sélectionnée | 100% / 45% | 20px |

Lorsque l’échec est sélectionné, la roulette numérique grisée est en position neutre00:00 ; ce zéro n’est jamais une cible. Les pauses0 restent valides et utilisent leur contrôle propre. Le §4.5 annoncé manque à la source disponible : les gestes exacts de sortie de cet état restent à vérifier avant qualification. L’état désactivé du Picker natif est une exigence à qualifier, pas une propriété technique déjà démontrée par ces dessins.

![Nouvelle variante de roulette](Specifications-fonctionnelles/images/echec-2026-10-13/8452-13297.png)

La roulette **Durée totale** reste sur `5544:5118`,330×150, popover354×216 : aucune option À l’échec. Les références `8328:38084` et l’instance Conception `7413:33276` ne sont pas remplacées par la roulette de cible.

## Tableau variable et total

Maître de ligne `8129:31593`, deux colonnes cible/Pause, même lorsque toutes les cibles sont À l’échec. La colonne de valeur avait disparu par anomalie d’instance ; il n’existe pas de variante métier à une colonne. En mode Durée, l’en-tête reste Durée ; les cellules peuvent afficher « à l’échec ».

Le cas mixte `8470:13303` illustre30s/45s/échec, pauses10s/20s/30s, ≥2min15 en lecture seule. Les chiffres restent des données de démonstration ; le moteur détermine les montants. Tout échec : total absent. La règle d’interdiction du calcul inverse n’ajoute aucun nouveau composant : variable était déjà en lecture seule, identiques tout échec omet le total.

Aucun écran uniforme « Série à l’échec » supplémentaire : la frame créée puis supprimée ne doit pas revenir dans l’inventaire. Les huit cartes catalogue, ses filtres, les roulettes de total et les layouts d’exécution/synthèse/suivi sont conservés dans cette passe.

## Accessibilité et limites

Adapter les géométries à360/402/440 et au texte agrandi ; conserver focus modal, défilement du corps et actions accessibles. Annoncer l’option sélectionnée et le caractère non éditable du total ; ne pas transmettre l’état uniquement par le gris. Les cibles tactiles suivent le DSF général, indépendamment de la hauteur dessinée30px.

La grille Volumes devra conserver l’unité du mode pour les cibles mixtes ; son rendu n’est pas illustré dans ce lot. Les autres réserves héritées du DSF Circuits ne sont pas déclarées résolues. Voir [matrice de traçabilité](MATRICE-DEUX-MODES-ECHEC-2026-10-13.md).

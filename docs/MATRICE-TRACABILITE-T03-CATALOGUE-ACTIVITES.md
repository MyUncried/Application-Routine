# Matrice de traçabilité — T03 Catalogue des activités

Baseline de départ : `main` `187d275dbfc585140c160bd3bbefbd411c7a441b`.

Branche de mise à jour : `docs/t03-catalogue-activites-final-20260915`.

Périmètre : décisions fonctionnelles, UX, données, API, architecture, roadmap, Figma et contrats d’écran T03. `13 – Contrats d’écran.md` est la référence normative T03 ; `13A – Contrats d’écran hérités avant T03 Catalogue.md` conserve l’historique antérieur. Les règles `Filtrer`/`Trier` sont intégrées directement au chapitre 13 et à D-184.

## Matrice

| Axe | Décision attendue | Documents / évidences concernés | Ancienne règle recherchée | Statut après mise à jour | Correction / remarque |
|---|---|---|---|---|---|
| T03 / roadmap | Catalogue des activités = T03 MVP ; ancien T03 Exécution Séance → T04 ; ancien T04 → T05+ | PRODUCT, 01–12, 07 bis, 13 | Catalogue V2 ; ancien T03 moteur | CONFORME | D-183 consolide D-166 ; anciens contrats Exécution remappés T04. |
| Catalogue multi-type | `Activités / Séances / Circuits`; Séances par défaut ; Activités actif ; Circuits disabled | 00–06, 07 bis, 13, PRODUCT | D-108 « Séances seul actif » | CONFORME | D-167 + CE-T03-01/02. |
| Navigation basse | `Catalogues`; titres contextuels ; DSF exact ; dessins ≤24 pt | 01, 06 bis, 13 CE-T03-17, Figma `2537:214` | libellé `Séances`, icônes surdimensionnées | CONFORME | Documentation et Figma alignés. |
| État Catalogue | recherche/filtres/tri/scroll conservés pendant aller-retour uniquement | 03, 06/06 bis, 07 bis, 13 CE-T03-01/02/05 | persistance non bornée | CONFORME | D-168. |
| Filtrer / Trier communs | Filtrer/Trier communs ; Filtrer Activités → `Archivées` ; Trier visible disabled ; aucune option inventée | 06 bis §2.1, 07 bis D-184, 13 §4.5 + CE-T03-02/05 | contrôles tous désactivés / contenu implicite | PARTIELLEMENT CONFORME | Fonctionnel déterministe ; rendu détaillé panneaux NON VÉRIFIABLE dans Figma. |
| Cycle de vie ActivityDefinition | créer, modifier, archiver, restaurer, supprimer depuis archives | 04, 08, 09/09 bis, 10, 11, 13 CE-T03-04/05 | CRUD incomplet | CONFORME | Accès Archives via Filtrer. |
| Suppression ActivityDefinition | aucune cascade vers SessionActivity / historique | 04, 09–12, 09 bis, 13 CE-T03-05 | cascade implicite | CONFORME | D-169. |
| Création depuis Composition | nouvelle activité = SessionActivity uniquement ; pas save-to-catalogue | 02–04, 06 bis, 08–12, 13 CE-T03-06 | action future bibliothèque | CONFORME | D-170. |
| Sélection existante | multi-select, 0 disabled, ordre liste filtrée | 03, 06 bis, 08, 09 bis, 11, 13 CE-T03-07 | ordre touches | CONFORME | D-165/D-171. |
| Copie vers Séance | copie complète puis indépendance | 04, 09–12, 09 bis, 13 CE-T03-07/08 | lien dynamique | CONFORME | D-171. |
| Exécution directe | origin ACTIVITY, snapshot, prep 5 s, séries/pauses/côtés/recovery, pas SESSION_END | PRODUCT, 03–05, 08–12, 09 bis, 13 CE-T03-09..14 | Exécution V2 / Session artificielle | CONFORME | D-172, frontière T03/T04 explicite. |
| Bilatéralité directe | réutilise strictement D-143–D-156 | PRODUCT, 00, 04, 07/07 bis, 08–13 | nouvelle formule | CONFORME | Aucun nouveau calcul. |
| Durée totale | visible 3 modes ; Reps/Échec = `≥ durée connue` | PRODUCT, 00, 04, 06–08, 10, 13 CE-T03-04 | RM-132/CAL anciens | CONFORME | D-155/D-181. |
| Éditeur Activité | nom gras dans Synthèse uniquement ; pas direction développée carte Composition | 00, 06 bis, 08, 13 CE-T03-04/08 | anciennes variantes | CONFORME | D-182. |
| Roulette ouverte | scrim ; CTA visuellement normal mais fonctionnel/accessibilité disabled | 06 bis, 08, 10, 13 CE-T03-04/08 | CTA actif / style disabled divergent | CONFORME | D-174. |
| Swipe gauche | carte suit geste, actions révélées derrière | 03, 06, 06 bis, 08, 10, 13 CE-T03-02/05/08 | carte immobile / overlay | CONFORME | D-175. |
| Swipe droit / fermeture | ferme uniquement si commencé sur carte ouverte | 06 bis, 10, 13 | fermeture par fond/autre swipe | CONFORME | D-175. |
| Concurrence contextuelle | autres contrôles actifs ; un seul contexte swipe | 06 bis, 10, 13 | verrouillage global | CONFORME | D-175. |
| Composition actions | Dupliquer arrondi + gap fond Tour | 06 bis, 08, 13 CE-T03-08, Figma `2028:11808` | pas de gap / overlay | CONFORME | Règle documentaire et frame Figma identifiées ; conformité de l’implémentation sera vérifiée au développement. |
| Cartes structurelles | CR initial + Fin non déplaçables | 00, 04, 06 bis, 10, 13 CE-T03-08 | poignée/appui long | CONFORME | D-177. |
| Catégories destination | save → Catalogue des séances / Séances | 03, 06 bis, 10, 13 CE-T03-16 | retour dernier segment | CONFORME | D-168. |
| Transition | cible entre droite, courant sort gauche | 06 bis, 13 CE-T03-16/17 | animation locale | CONFORME | D-178. |
| Déployer Activity | même DSF Séance, visible disabled, zone réservée | Figma `3786:5093`, `2537:1033`, 06 bis, 13 CE-T03-02 | D-164 absent | CONFORME | D-173. |
| Lecture Activity | indépendante, lance direct execution | 03, 06 bis, 13 CE-T03-02/09 | confusion Déployer | CONFORME | D-173. |
| Première carte + Recovery | démo Figma seulement | Figma + 06 bis + 07 bis + 13 | règle de position | CONFORME | Pas de règle métier. |
| Migration | structures ActivityDefinition/ACTIVITY sans promotion historique | 04, 09/09 bis, 11, 12, couverture E70 chapitre 13 | migration implicite | CONFORME | D-180. |
| Médias | multiples hors T03 ; Déployer activé plus tard | 00, 04, 05, 09, 12, 13 | activation T03 | CONFORME | Aucun média fonctionnel. |
| Circuits | visible disabled ; aucune fonction T03 | 01–05, 09, 12, 13 | Circuit fonctionnel | CONFORME | D-167/D-183. |
| Captures Figma | images physiques, chemins relatifs | images README + preuves chapitre 13 | URL temporaire | CONFORME | Export/import robuste. |
| Contrats d’écran | 17 contrats × 21 sections ; E01–E73 ; frontière T03/T04 ; tests négatifs | `13 – Contrats d’écran.md`, `13A` | ancien chapitre T03 moteur Session ; sections fusionnées | PARTIELLEMENT CONFORME | Structure et périmètre fonctionnel complets ; seule conformité visuelle détaillée Filtrer/Trier reste NON VÉRIFIABLE faute de design Figma. |

## Évidences Figma contrôlées

- `3786:5093` Catalogue Activités ;
- `3787:5148` arbre Créer Activités ;
- `3787:5209` action contextuelle directe ;
- `3841:8375` arbre Créer Séances ;
- `3788:5258` Ajouter activité depuis Composition ;
- `3789:5349`, `3789:5405` multi-sélection ;
- `3879:5947`, `3879:6079` créer/modifier référence persistante ;
- `2028:11700`, `2028:11808` Composition / actions glissées ;
- `2028:11204` Catégories ;
- `2537:1033` Déployer ;
- `2537:214` Navigation Bottom ;
- panneaux détaillés `Filtrer` / `Trier` : **NON VÉRIFIABLE** car non conçus.

## Résultat de la passe contrats d’écran

| Contrôle | Résultat | Évidence |
|---|---|---|
| 21 sections par contrat | CONFORME | 17 contrats CE-T03-01..17 explicitent les 21 rubriques. |
| Référentiel T03-E01..E73 | CONFORME | Section 12 du chapitre 13. |
| Couverture E01..E73 | CONFORME | Section 13 ; E70 explicitement non visuel. |
| Frontière T03/T04 | CONFORME | Section 14 + remapping 13A. |
| Cycle ActivityDefinition | CONFORME | CE-T03-04/05. |
| Filtrer/Trier | PARTIELLEMENT CONFORME | D-184 + CE-T03-02/05 ; détail visuel Figma absent. |
| Exécution directe | CONFORME | CE-T03-09..14. |
| Suivi ACTIVITY | CONFORME | CE-T03-15. |
| Navigation/Catégories | CONFORME | CE-T03-16/17. |
| Valeurs Figma de démonstration | CONFORME | règle commune §4.1 + tests négatifs. |
| Responsive/accessibilité | CONFORME | Les contrats définissent 360/402/440, cibles et états accessibles ; la conformité de l’implémentation sera évaluée lors de la recette applicative. |

## Contrôle de clôture documentaire

| Contrôle | Résultat | Évidence / remarque |
|---|---|---|
| Baseline courante | CONFORME | `main` contrôlé au terme de la passe : `187d275dbfc585140c160bd3bbefbd411c7a441b`, identique à la baseline de départ. |
| Branche vs baseline | CONFORME | Merge-base identique à la baseline ; branche uniquement en avance, aucun retard. |
| Périmètre physique du diff | CONFORME | Diff limité à `docs/**` et aux évidences Figma documentaires. |
| 17 contrats actifs | CONFORME | Recherche `## CE-T03-` : 17 occurrences. |
| 21e rubrique Traçabilité | CONFORME | Recherche `### 21. Traçabilité` : 17 occurrences. |
| 13A historique | CONFORME | Fichier physique présent, séparé du chapitre normatif ; anciens CE-T03 moteur Session explicitement remappés T04. |
| Référence résiduelle à 13B | CONFORME | 13B a été supprimé après intégration de D-184 directement dans le chapitre 13 ; aucune référence normative ne doit subsister. |
| Unicode des chemins | CONFORME | Tree Git contrôlé : aucune occurrence `#U` ni séquence `\u`; accents, apostrophes et tirets Unicode conservés. |
| Fichiers temporaires | CONFORME | Tree Git : aucune occurrence `.tmp` ni `.base64` ; aucun intermédiaire de capture attendu. |
| Captures Figma embarquées | CONFORME | Fichiers physiques et chemins relatifs présents ; trois captures Catalogue réexportées après corrections Déployer/navigation. |
| Panneaux Filtrer/Trier Figma | NON VÉRIFIABLE | Aucun design détaillé validé ; le comportement est borné fonctionnellement mais aucune conformité visuelle détaillée ne peut être attestée. |
| Options Filtrer/Trier supplémentaires | À CLARIFIER | Hors `Archivées` pour Filtrer Activités et état disabled de Trier, les options ne sont pas définies et ne doivent pas être implémentées. |

## Formulations historiques conservées par supersession

- `06 bis` supersède les formulations UX divergentes ;
- `07 bis` supersède les décisions citées et ajoute D-184 ;
- `09 bis` supersède les anciens marquages V2 pour ActivityDefinition/ACTIVITY/migration ;
- `13` est la référence contractuelle T03 ;
- `13A` conserve l’historique, ses anciens CE-T03-01..13 étant fonctionnellement T04.

Le seul écart volontaire restant pour la préparation T03 est visuel : les panneaux/options détaillés `Filtrer` et `Trier` ne sont pas encore dessinés dans Figma. Le comportement fonctionnel autorisé est borné ; le développement ne doit ni inventer le design, ni ajouter des options supplémentaires.

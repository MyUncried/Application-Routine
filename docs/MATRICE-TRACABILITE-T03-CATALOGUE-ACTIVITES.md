# Matrice de traçabilité — T03 Catalogue des activités

Baseline de départ : `main` `187d275dbfc585140c160bd3bbefbd411c7a441b`.

Branche de mise à jour initiale : `docs/t03-catalogue-activites-final-20260915`.

Baseline documentaire de la présente passe : `docs/t03-catalogue-activites-final-20260915` au HEAD `4d4c738facac7f499e4a67a92aacac135112f1ab`. Branche de travail dérivée : `docs/t03-catalogue-activites-figma-20260916`.

Périmètre : décisions fonctionnelles, UX, données, API, architecture, roadmap, Figma et contrats d’écran T03. `13 – Contrats d’écran.md` est la référence normative T03 ; `13A – Contrats d’écran hérités avant T03 Catalogue.md` conserve l’historique antérieur. Les règles `Créer`/`Filtrer`/`Trier` sont intégrées directement au chapitre 13 et à D-184.

## Matrice

| Axe | Décision attendue | Documents / évidences concernés | Ancienne règle recherchée | Statut après mise à jour | Correction / remarque |
|---|---|---|---|---|---|
| T03 / roadmap | Catalogue des activités = T03 MVP ; ancien T03 Exécution Séance → T04 ; ancien T04 → T05+ | PRODUCT, 01–12, 07 bis, 13 | Catalogue V2 ; ancien T03 moteur | CONFORME | D-183 consolide D-166 ; anciens contrats Exécution remappés T04. |
| Catalogue multi-type | `Activités / Séances / Circuits`; Séances par défaut ; Activités actif ; Circuits disabled | 00–06, 07 bis, 13, PRODUCT | D-108 « Séances seul actif » | CONFORME | D-167 + CE-T03-01/02. |
| Navigation basse | `Catalogues`; titres contextuels ; DSF exact ; dessins ≤24 pt | 01, 06 bis, 13 CE-T03-17, Figma `2537:214` | libellé `Séances`, icônes surdimensionnées | CONFORME | Documentation et Figma alignés. |
| État Catalogue | recherche/filtres/tri/scroll conservés pendant aller-retour uniquement | 03, 06/06 bis, 07 bis, 13 CE-T03-01/02/05 | persistance non bornée | CONFORME | D-168. |
| Rangée `Créer / Filtrer / Trier` | 3 contrôles `108 × 32 pt`, gap `8 pt`, ensemble centré en référence 402 ; même représentation Séances/Activités ; cibles ≥48 | Figma `3786:5093`, `1992:9910`, `1992:10129`, `3787:5148`, `3841:8375`; 06 bis, 07 bis D-184, PRODUCT, 13 §4.5 + CE-T03-01/02/03 | `Créer centré` seul ; contrôles « lorsqu’ils sont présents » ; représentation d’entrée Filtrer/Trier dite non conçue | CONFORME | Contrôles d’entrée conçus et propagés. Coordonnées Figma utilisées uniquement comme preuve de rendu, jamais comme positions absolues RN. |
| Filtrer / Trier — comportement | Filtrer/Trier communs ; Filtrer Activités → `Archivées` ; Trier visible disabled ; aucune option inventée | 06 bis §2.1, 07 bis D-184, PRODUCT, 13 §4.5 + CE-T03-02/05 | contrôles tous désactivés / contenu implicite | CONFORME | Fonctionnel déterministe. |
| Filtrer / Trier — panneaux/options ouverts | Aucun détail graphique inventé tant que panneaux/options non dessinés | 06 bis, 07 bis D-184, PRODUCT, 13, Figma | « représentation Filtrer/Trier non conçue » appliquée indistinctement aux boutons et panneaux | NON VÉRIFIABLE | Seuls les panneaux/options ouverts restent sans design validé. Contrôles d’entrée exclus de ce statut. |
| Recherche globale | `1992:10129` conserve la rangée Catalogue en arrière-plan sous contexte de recherche/clavier | 06 bis, PRODUCT, 13 CE-T03-01/02, Figma `1992:10129` | absence de règle contractuelle T03 explicite | CONFORME | État intégré sans créer de contrat supplémentaire ; les 17 contrats × 21 rubriques restent inchangés en structure. |
| Arbre Créer Catalogue | 3 commandes Catalogue restent visibles sous scrim ; arbre ancré à `Créer` dans sa nouvelle position | 06 bis §3, 07 bis D-184, PRODUCT, 13 CE-T03-03, Figma `3787:5148`, `3841:8375` | arbre rattaché à ancien bouton centré ; disparition implicite Filtrer/Trier | CONFORME | Ancrage et arrière-plan explicités. |
| Cycle de vie ActivityDefinition | créer, modifier, archiver, restaurer, supprimer depuis archives | 04, 08, 09/09 bis, 10, 11, 13 CE-T03-04/05 | CRUD incomplet | CONFORME | Accès Archives via Filtrer. |
| Suppression ActivityDefinition | aucune cascade vers SessionActivity / historique | 04, 09–12, 09 bis, 13 CE-T03-05 | cascade implicite | CONFORME | D-169. |
| Création depuis Composition | nouvelle activité = SessionActivity uniquement ; pas save-to-catalogue | 02–04, 06 bis, 08–12, 13 CE-T03-06 | action future bibliothèque | CONFORME | D-170. |
| Sélection existante | multi-select, 0 disabled, ordre liste filtrée | 03, 06 bis, 08, 09 bis, 11, 13 CE-T03-07 | ordre touches | CONFORME | D-165/D-171. |
| Copie vers Séance | copie complète puis indépendance | 04, 09–12, 09 bis, 13 CE-T03-07/08 | lien dynamique | CONFORME | D-171. |
| Exécution directe | origin ACTIVITY, snapshot, prep 5 s, séries/pauses/côtés/recovery, pas SESSION_END | PRODUCT, 03–05, 08–12, 09 bis, 13 CE-T03-09..14 | Exécution V2 / Session artificielle | CONFORME | D-172, frontière T03/T04 explicite. |
| Bilatéralité directe | réutilise strictement D-143–D-156 | PRODUCT, 00, 04, 07/07 bis, 08–13 | nouvelle formule | CONFORME | Aucun nouveau calcul. |
| Durée totale — métier | visible 3 modes ; Reps/Échec = borne `≥ durée connue` | PRODUCT, 00, 04, 06–08, 10, 13 CE-T03-04 | RM-132/CAL anciens | CONFORME | D-155/D-181. |
| Durée totale — rendu éditeur | mode Durée : `Durée totale`; Reps/Échec : contrôle `Durée totale >=`; Synthèse : `Durée totale : ≥ {durée connue}` | Figma `3561:4695`, `3561:7673`, `3561:7802`; 06 bis, 07 bis D-181, PRODUCT, 13 CE-T03-04 | `Durée totale` générique sans distinction du libellé de contrôle | CONFORME | Distinction contrôle UI court / sémantique de Synthèse explicitée. |
| Nom Activité dans éditeur | `Renforcement du genou` = valeur de démonstration sur états renseignés ; `Nom de l’activité` = état vide/placeholder | Figma états Création activité + `3943:6064`; 06 bis, 07 bis, PRODUCT, 13 CE-T03-04 | risque de traiter `Renforcement du genou` comme statique ; `Nom de l’activité` sur écrans renseignés | CONFORME | Donnée de démonstration explicitement interdite en dur. |
| Éditeur Activité — Synthèse | nom gras dans Synthèse uniquement ; pas direction développée carte Composition | 00, 06 bis, 08, 13 CE-T03-04/08 | anciennes variantes | CONFORME | D-182. |
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
| Référence Figma `3787:5209` | ne plus la présenter comme preuve active | 06 bis, 07 bis, 13, README preuves | node historique encore cité comme courant | CONFORME | Node absent du Figma courant ; conservé uniquement comme trace historique, aucun remplacement inventé. |
| Captures Figma physiques | copies embarquées doivent refléter les écrans modifiés du 16/09 avant d’être dites courantes | images README + preuves chapitre 13 | mention « réexportées le 15/09 » interprétée comme état courant | PARTIELLEMENT CONFORME | Figma courant contrôlé ; transfert binaire Figma→GitHub non encore matérialisé dans cette passe. Les anciens fichiers restent présents mais ne doivent pas être déclarés réexportés le 16/09. |
| Contrats d’écran | 17 contrats × 21 sections ; E01–E73 ; frontière T03/T04 ; tests négatifs | `13 – Contrats d’écran.md`, `13A` | ancien chapitre T03 moteur Session ; sections fusionnées | CONFORME | Structure conservée ; géométrie d’entrée Catalogue désormais déterministe. Seuls panneaux/options ouverts Filtrer/Trier restent NON VÉRIFIABLE. |

## Évidences Figma contrôlées le 16 septembre 2026

- `3786:5093` Catalogue Activités — liste ;
- `3787:5148` arbre Créer Activités ;
- `1992:9910` Catalogue des séances — liste par défaut ;
- `1992:10129` Recherche globale — Champ déployé ;
- `3841:8375` arbre Créer Séances ;
- `3561:4695` Création activité — Répétitions / Pause / Séries — avec mode ;
- `3561:7673` Création activité — Répétitions — roulette compacte ouverte ;
- `3561:7802` Création activité — À l’échec ;
- `3943:6064` Création activité — Durée / Pause / Séries — Vide ;
- `3788:5258` Ajouter activité depuis Composition ;
- `3789:5349`, `3789:5405` multi-sélection ;
- `3879:5947`, `3879:6079` créer/modifier référence persistante ;
- `2028:11700`, `2028:11808` Composition / actions glissées ;
- `2028:11204` Catégories ;
- `2537:1033` Déployer ;
- `2537:214` Navigation Bottom.

`3787:5209` n’est plus disponible dans le Figma courant et n’est plus une évidence active.

Panneaux/options ouverts `Filtrer` / `Trier` : **NON VÉRIFIABLE** car non conçus. La rangée d’entrée, elle, est vérifiée.

## Résultat de la passe contrats d’écran

| Contrôle | Résultat | Évidence |
|---|---|---|
| 21 sections par contrat | CONFORME | 17 contrats CE-T03-01..17 conservent les 21 rubriques. |
| Référentiel T03-E01..E73 | CONFORME | Section 12 du chapitre 13. |
| Couverture E01..E73 | CONFORME | Section 13 ; E70 explicitement non visuel. |
| Frontière T03/T04 | CONFORME | Section 14 + remapping 13A. |
| Cycle ActivityDefinition | CONFORME | CE-T03-04/05. |
| Rangée `Créer / Filtrer / Trier` | CONFORME | §4.5 + CE-T03-01/02/03 + Figma courant. |
| Filtrer/Trier — panneaux ouverts | NON VÉRIFIABLE | D-184 + CE-T03-02/05 ; détail visuel Figma absent. |
| Recherche globale | CONFORME | CE-T03-01/02 + `1992:10129`. |
| Éditeur nom/durée | CONFORME | CE-T03-04 + `3561:4695`, `3561:7673`, `3561:7802`, `3943:6064`. |
| Exécution directe | CONFORME | CE-T03-09..14. |
| Suivi ACTIVITY | CONFORME | CE-T03-15. |
| Navigation/Catégories | CONFORME | CE-T03-16/17. |
| Valeurs Figma de démonstration | CONFORME | règle commune §4.1 + CE-T03-04 + tests négatifs. |
| Responsive/accessibilité | CONFORME | Les contrats définissent 360/402/440, cibles et états accessibles ; conformité implémentation à vérifier en recette applicative. |

## Contrôle de clôture documentaire — état de la présente passe

| Contrôle | Résultat | Évidence / remarque |
|---|---|---|
| Baseline documentaire | CONFORME | Branche `docs/t03-catalogue-activites-final-20260915` vérifiée au HEAD `4d4c738facac7f499e4a67a92aacac135112f1ab` avant création de la branche dérivée. |
| Baseline non écrasée | CONFORME | Modifications réalisées sur `docs/t03-catalogue-activites-figma-20260916`. |
| Périmètre physique du diff | À VÉRIFIER EN PASSE 2 | Doit rester limité aux documents réellement affectés et, si transfert possible, aux seules évidences Figma nécessaires. |
| 17 contrats actifs | À VÉRIFIER EN PASSE 2 | Attendu : 17 occurrences `## CE-T03-`. |
| 21e rubrique Traçabilité | À VÉRIFIER EN PASSE 2 | Attendu : 17 occurrences `### 21. Traçabilité`. |
| Unicode des chemins | À VÉRIFIER EN PASSE 2 | Rechercher `#U`, `\u`; préserver accents, apostrophes et tirets Unicode. |
| Fichiers temporaires | À VÉRIFIER EN PASSE 2 | Aucun intermédiaire ne doit être commité. |
| Contrôles d’entrée Catalogue | CONFORME | Figma contrôlé le 16/09 : 108×32, gaps 8, ensemble centré. |
| Panneaux Filtrer/Trier Figma | NON VÉRIFIABLE | Aucun design détaillé validé ; le comportement est borné fonctionnellement mais aucune conformité visuelle détaillée ne peut être attestée. |
| Options Filtrer/Trier supplémentaires | À CLARIFIER | Hors `Archivées` pour Filtrer Activités et état disabled de Trier, les options ne sont pas définies et ne doivent pas être implémentées. |
| Captures Figma du 16/09 physiquement réexportées | NON VÉRIFIABLE À CE STADE | Ne pas déclarer « réexporté » tant qu’un nouveau binaire n’est pas présent dans GitHub. |

## Formulations historiques conservées par supersession

- `06 bis` supersède les formulations UX divergentes ;
- `07 bis` supersède les décisions citées et consolide D-184 au 16 septembre ;
- `09 bis` supersède les anciens marquages V2 pour ActivityDefinition/ACTIVITY/migration ;
- `13` est la référence contractuelle T03 ;
- `13A` conserve l’historique, ses anciens CE-T03-01..13 étant fonctionnellement T04.

Le seul écart visuel fonctionnel volontaire restant est le détail des panneaux/options ouverts `Filtrer` et `Trier`. Les contrôles d’entrée sont conçus. Le statut des copies d’écran physiques est suivi séparément : aucune capture n’est déclarée courante sans présence binaire effectivement vérifiée dans le dépôt.

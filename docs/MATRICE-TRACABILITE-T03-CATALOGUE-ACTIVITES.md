# Matrice de traçabilité — T03 Catalogue des activités

Baseline de consolidation : `main` au commit `7b6415f44a9ea39bd41d7e88ea6d232e07ceb5e1`.

Branche de consolidation : `docs/consolidate-06-07-t03-20260916`.

Périmètre : décisions fonctionnelles, UX, données, API, architecture, roadmap, Figma et contrats d’écran T03. Le chapitre `06 – Ecrans et navigation de la V1.md` porte directement les règles UX T03. Le chapitre `07 – Registre des décisions de conception.md` porte directement D-167 à D-188. `13 – Contrats d’écran.md` est l’unique référence normative des contrats T03.

## Matrice

| Axe | Décision attendue | Documents / évidences concernés | Ancienne règle recherchée | Statut après consolidation | Correction / remarque |
|---|---|---|---|---|---|
| T03 / roadmap | Catalogue des activités = T03 MVP ; ancien T03 Exécution Séance → T04 ; ancien T04 → T05+ | PRODUCT, 01–12, 07, 13 | Catalogue V2 ; ancien T03 moteur | CONFORME | D-183 consolide D-166. |
| Catalogue multi-type | `Activités / Séances / Circuits`; Séances par défaut ; Activités actif ; Circuits disabled | 00–07, 13, PRODUCT | D-108 « Séances seul actif » | CONFORME | D-108 est supersédée par D-167 ; CE-T03-01/02. |
| Navigation basse | `Catalogues`; titres contextuels ; DSF exact ; dessins ≤24 pt | 01, 06, 07, 13 CE-T03-17, Figma `2537:214` | libellé `Séances`, icônes surdimensionnées | CONFORME | Règles intégrées directement dans 06/07. |
| État Catalogue | recherche/filtres/tri/scroll conservés pendant aller-retour uniquement | 03, 06, 07, 13 CE-T03-01/02/05 | persistance non bornée | CONFORME | D-168. |
| Rangée `Créer / Filtrer / Trier` | 3 contrôles `108 × 32 pt`, gap `8 pt`, ensemble centré en référence 402 ; même représentation Séances/Activités ; cibles ≥48 | Figma `3786:5093`, `1992:9910`, `1992:10129`, `3787:5148`, `3841:8375`; 06, 07 D-184, PRODUCT, 13 §4.5 + CE-T03-01/02/03 | `Créer centré` seul ; contrôles « lorsqu’ils sont présents » ; représentation d’entrée Filtrer/Trier dite non conçue | CONFORME | Contrôles d’entrée conçus et propagés. Coordonnées Figma utilisées uniquement comme preuve de rendu. |
| Filtrer / Trier — comportement | Filtrer/Trier communs ; Filtrer Activités → `Archivées` ; Trier visible disabled ; aucune option inventée | 06, 07 D-184, PRODUCT, 13 §4.5 + CE-T03-02/05 | contrôles tous désactivés / contenu implicite | CONFORME | Fonctionnel déterministe. |
| Filtrer / Trier — panneaux/options ouverts | Aucun détail graphique inventé tant que panneaux/options non dessinés | 06, 07 D-184, PRODUCT, 13, Figma | « représentation Filtrer/Trier non conçue » appliquée indistinctement aux boutons et panneaux | NON VÉRIFIABLE | Seuls les panneaux/options ouverts restent sans design validé. |
| Recherche globale | `1992:10129` conserve la rangée Catalogue en arrière-plan sous contexte de recherche/clavier | 06, PRODUCT, 13 CE-T03-01/02, Figma `1992:10129` | absence de règle contractuelle T03 explicite | CONFORME | État intégré sans contrat supplémentaire. |
| `Créer` contextuel Catalogue | `Créer` ouvre directement la création de l’objet correspondant au Catalogue courant ; aucun écran/arbre intermédiaire | 02, 03, 06, 07 D-187, 08, PRODUCT, 13 CE-T03-03 | arbre `Une nouvelle activité / Une séance / Un circuit / Annuler` | CONFORME | D-187 supersède D-186 et la partie correspondante de D-184 ; anciennes frames `3787:5148`/`3841:8375` historiques. |
| Cycle de vie ActivityDefinition | créer, modifier, archiver, restaurer, supprimer depuis archives | 04, 06, 07, 08, 09/09 bis, 10, 11, 13 CE-T03-04/05 | CRUD incomplet | CONFORME | Accès Archives via Filtrer. |
| Suppression ActivityDefinition | aucune cascade vers SessionActivity / historique | 04, 07, 09–12, 09 bis, 13 CE-T03-05 | cascade implicite | CONFORME | D-169. |
| Création depuis Composition | nouvelle activité = SessionActivity uniquement ; pas save-to-catalogue | 02–04, 06–13 | action future bibliothèque | CONFORME | D-170. |
| Sélection existante | multi-select, 0 disabled, ordre liste filtrée | 03, 06–13 | ordre touches | CONFORME | D-165/D-171. |
| Copie vers Séance | copie complète puis indépendance | 04, 07, 09–13 | lien dynamique | CONFORME | D-171. |
| Exécution directe | origin ACTIVITY, snapshot, prep 5 s, séries/pauses/côtés/recovery, pas SESSION_END | PRODUCT, 03–13 | Exécution V2 / Session artificielle | CONFORME | D-172, frontière T03/T04 explicite. |
| Bilatéralité directe | réutilise strictement D-143–D-156 | PRODUCT, 00, 04, 07–13 | nouvelle formule | CONFORME | Aucun nouveau calcul. |
| Durée totale — métier | visible 3 modes ; Reps/Échec = borne `≥ durée connue` | PRODUCT, 00, 04, 06–10, 13 CE-T03-04 | RM-132/CAL anciens | CONFORME | D-155/D-181. |
| Durée totale — rendu éditeur | mode Durée : `Durée totale`; Reps/Échec : contrôle `Durée totale >=`; Synthèse : `Durée totale : ≥ {durée connue}` | Figma `3561:4695`, `3561:7673`, `3561:7802`; 06, 07 D-181, PRODUCT, 13 CE-T03-04 | contrôle générique sans distinction | CONFORME | Distinction contrôle UI court / Synthèse explicitée. |
| Nom Activité dans éditeur | `Renforcement du genou` = valeur de démonstration ; `Nom de l’activité` = état vide/placeholder | Figma + `3943:6064`; 06, 07, PRODUCT, 13 CE-T03-04 | valeur démo traitée comme statique | CONFORME | Donnée de démonstration interdite en dur. |
| Éditeur Activité — Synthèse | nom gras dans Synthèse uniquement ; pas direction développée carte Composition | 00, 06–08, 13 CE-T03-04/08 | anciennes variantes | CONFORME | D-182. |
| Roulette ouverte | scrim ; CTA visuellement normal mais fonctionnel/accessibilité disabled | 06–10, 13 CE-T03-04/08 | CTA actif / style disabled divergent | CONFORME | D-174. |
| Swipe gauche | carte suit geste, actions révélées derrière | 03, 06–10, 13 CE-T03-02/05/08 | carte immobile / overlay | CONFORME | D-175. |
| Swipe droit / fermeture | ferme uniquement si commencé sur carte ouverte | 06, 07, 10, 13 | fermeture par fond/autre swipe | CONFORME | D-175. |
| Concurrence contextuelle | autres contrôles actifs ; un seul contexte swipe | 06, 07, 10, 13 | verrouillage global | CONFORME | D-175. |
| Composition actions | Dupliquer arrondi + gap fond Tour | 06–08, 13 CE-T03-08, Figma `2028:11808` | pas de gap / overlay | CONFORME | D-176. |
| Cartes structurelles | CR initial + Fin non déplaçables | 00, 04, 06, 07, 10, 13 CE-T03-08 | poignée/appui long | CONFORME | D-177. |
| Catégories destination | save → Catalogue des séances / Séances | 03, 06, 07, 10, 13 CE-T03-16 | retour dernier segment | CONFORME | D-168. |
| Transition | cible entre droite, courant sort gauche | 06, 07, 13 CE-T03-16/17 | animation locale | CONFORME | D-178. |
| Déployer Activity | même DSF Séance, visible disabled, zone réservée | Figma `3786:5093`, `2537:1033`, 06, 07, 13 CE-T03-02 | D-164 absent | CONFORME | D-164 est supersédée par D-173. |
| Lecture Activity | indépendante, lance direct execution | 03, 06, 07, 13 CE-T03-02/09 | confusion Déployer | CONFORME | D-173. |
| Première carte + Recovery | démo Figma seulement | Figma + 06 + 07 + 13 | règle de position | CONFORME | Pas de règle métier. |
| Migration | structures ActivityDefinition/ACTIVITY sans promotion historique | 04, 07, 09/09 bis, 11, 12, couverture E70 chapitre 13 | migration implicite | CONFORME | D-180. |
| Médias | section visible/repliable ; contrôle Déployer/Condenser et placeholder désactivés ; fonctions et médias multiples hors T03 | 00, 04, 05, 07, 09, 12, 13 | activation T03 | CONFORME | Aucun média fonctionnel. |
| Circuits | visible disabled ; aucune fonction T03 | 01–07, 09, 12, 13 | Circuit fonctionnel | CONFORME | D-167/D-183. |
| Référence Figma `3787:5209` | ne plus la présenter comme preuve active | 06, 07, 13, README preuves, INDEX | node historique encore cité comme courant | CONFORME | Node absent du Figma courant ; aucun remplacement inventé. |
| Captures Figma physiques | copies embarquées doivent refléter les écrans modifiés du 16/09 avant d’être dites courantes | images README + preuves chapitre 13 | export du 15/09 interprété comme courant | PARTIELLEMENT CONFORME | Les nodes courants ont été contrôlés ; les anciens binaires restent explicitement à réexporter/historiques. |
| Contrats d’écran | 17 contrats × 21 sections ; E01–E73 ; frontière T03/T04 ; tests négatifs | `13 – Contrats d’écran.md` | ancienne version du chapitre 13 | CONFORME | `13` est la seule référence contractuelle active. |

## Évidences Figma contrôlées le 16 septembre 2026

- `3786:5093` Catalogue Activités — liste ;
- `3787:5148` ancien arbre Créer Activités — historique/supersédé par D-187 ;
- `1992:9910` Catalogue des séances — liste par défaut ;
- `1992:10129` Recherche globale — Champ déployé ;
- `3841:8375` ancien arbre Créer Séances — historique/supersédé par D-187 ;
- `3561:4695` Création activité — Répétitions / Pause / Séries — avec mode ;
- `3561:7673` Création activité — Répétitions — roulette compacte ouverte ;
- `3561:7802` Création activité — À l’échec ;
- `3943:6064` Création activité — Durée / Pause / Séries — Vide ;
- `3788:5258`, `3933:5780` Ajouter activité depuis Composition — arbres courants synchronisés avec Point d’arrêt ;
- `3789:5349`, `3789:5405` multi-sélection ;
- `3879:5947`, `3879:6079` créer/modifier référence persistante ;
- `2028:11700`, `2028:11808` Composition / actions glissées ; `2028:11808` inclut le Point d’arrêt courant ;
- `2028:11204` Catégories ;
- `2537:1033` Déployer ;
- `2537:214` Navigation Bottom.

`3787:5209` n’est plus disponible dans le Figma courant et n’est plus une évidence active.

Panneaux/options ouverts `Filtrer` / `Trier` : **NON VÉRIFIABLE** car non conçus. La rangée d’entrée, elle, est vérifiée.

## Résultat de la consolidation

| Contrôle | Résultat | Évidence |
|---|---|---|
| Corrections UX T03 intégrées dans 06 | CONFORME | Règles UX T03 présentes dans les sections concernées de 06 ; anciennes formulations contradictoires remplacées. |
| D-167 à D-188 intégrées dans 07 | CONFORME | Registre 07 consolidé ; D-187 supersède explicitement l’ancien arbre `Créer` des Catalogues et D-188 introduit le Point d’arrêt de Composition. |
| 13 unique | CONFORME | `13 – Contrats d’écran.md` reste l’unique référence des contrats T03. |
| 21 sections par contrat | CONFORME | 17 contrats CE-T03-01..17 conservent les 21 rubriques. |
| Référentiel T03-E01..E73 | CONFORME | Section 12 du chapitre 13. |
| Frontière T03/T04 | CONFORME | Section 14 du chapitre 13. |
| Filtrer/Trier — panneaux ouverts | NON VÉRIFIABLE | Aucun détail visuel Figma validé. |
| Options Filtrer/Trier supplémentaires | À CLARIFIER | Hors `Archivées` pour Activités et état disabled de Trier, aucune option supplémentaire ne doit être implémentée. |
| Captures Figma du 16/09 physiquement réexportées | PARTIELLEMENT CONFORME | Les nodes sont vérifiés mais les copies binaires concernées ne sont pas encore toutes réexportées. |

## Contrôle de clôture du 16 septembre 2026

| Axe de clôture | Statut | Évidence |
|---|---|---|
| Anciens compléments documentaires retirés | CONFORME | Les trois fichiers supprimés ne sont plus présents dans l’arbre courant et aucune référence Markdown active ne les cible. |
| Chapitre de contrats T03 | CONFORME | `13 – Contrats d’écran.md` est l’unique chapitre actif de contrats T03. |
| Structure des contrats | CONFORME | 17 contrats `CE-T03-01..17`, chacun avec 21 rubriques et une section `21. Traçabilité`. |
| Anciennes règles UX contradictoires | CONFORME | Les formulations actives « carte immobile », Durée totale masquée et absence de `Déployer` sur les cartes Activité ont été éliminées des documents normatifs concernés. |
| Décisions supersédées | CONFORME | D-108, D-116, D-164, D-166 et RES-NAV-LABEL-01 sont explicitement supersédés/précisés par les décisions T03 courantes. |
| Unicode / fichiers temporaires | CONFORME | Aucun chemin dégradé `#Uxxxx` / `\uXXXX` ni fichier temporaire ajouté par la consolidation. |

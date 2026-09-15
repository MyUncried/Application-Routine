# Matrice de traçabilité — T03 Catalogue des activités

Baseline de départ : `main` `187d275dbfc585140c160bd3bbefbd411c7a441b`.

Branche de mise à jour : `docs/t03-catalogue-activites-final-20260915`.

Périmètre de cette matrice : décisions fonctionnelles, UX, données, API, architecture, roadmap, Figma et contrats d’écran de T03. Le chapitre 13 a désormais fait l’objet d’une passe dédiée : `13 – Contrats d’écran.md` constitue la référence normative T03, `13A – Contrats d’écran hérités avant T03 Catalogue.md` conserve l’historique antérieur, et `13B – Complément contrats T03 – Filtrer et Trier.md` complète explicitement les contrats CE-T03-01/02/05 sur les contrôles Catalogue non encore dessinés en détail dans Figma.

## Matrice

| Axe | Décision attendue | Documents / évidences concernés | Ancienne règle recherchée | Statut après mise à jour | Correction / remarque |
|---|---|---|---|---|---|
| T03 / roadmap | Catalogue des activités = T03 MVP ; ancien T03 Exécution Séance → T04 ; ancien T04 → T05+ | PRODUCT, 01, 02, 04, 05, 07 + 07 bis, 09, 11, 12, 13 | Catalogue V2 ; ancien T03 moteur | CONFORME | D-183 consolide D-166 ; les anciens contrats d’Exécution T03 sont remappés T04 dans le chapitre 13. |
| Catalogue multi-type | `Activités / Séances / Circuits`; Séances par défaut ; Activités actif T03 ; Circuits désactivé | 00–06, 07 bis, 13, PRODUCT, D-167 | D-108 « Séances seul actif » | CONFORME | D-167 supersède D-108 sur Activités ; contrats CE-T03-01/02 déterministes. |
| Navigation basse | libellé permanent `Catalogues` ; titres contextuels en minuscules après `des` ; inventaire DSF déterministe ; dessins de destination max `24 pt` centrés | 01, 06 bis, 13 CE-T03-17, Figma `2537:214`, D-167/D-179 | libellé `Séances` ; dessins 26–29 pt | CONFORME | Documentation et composant DSF Figma alignés. |
| État Catalogue | recherche/filtres/tri/scroll restaurés uniquement pendant l’aller-retour courant ; non persistés au relaunch | 03, 06/06 bis, 07 bis, 13 CE-T03-01/02/05, D-168/D-184 | restauration sans borne temporelle | CONFORME | Portée explicite dans contrats et arbitrages. |
| Filtrer / Trier communs | contrôles communs aux trois Catalogues ; Filtrer Activités actif au minimum pour `Archivées`; Trier visible disabled ; autres options non inventées | 06 bis §2.1, 07 bis D-184, 13B, CE-T03-01/02/05 | contrôles entièrement désactivés / contenu implicite | PARTIELLEMENT CONFORME | Fonctionnel déterministe ; rendu détaillé des panneaux/options NON VÉRIFIABLE dans Figma tant qu’ils ne sont pas conçus. |
| Cycle de vie ActivityDefinition | créer, consulter/modifier, archiver, restaurer, suppression définitive depuis archives | 04, 08, 09/09 bis, 10, 11, 13 CE-T03-04/05, D-169 | CRUD sans cycle complet | CONFORME | Accès archives désormais déterminé via `Filtrer > Archivées`. |
| Suppression ActivityDefinition | pas de cascade vers copies de Séance ni historique | 04, 09–12, 09 bis, 13 CE-T03-05, D-169 | ambiguïté de suppression | CONFORME | Copies et instantanés conservés. |
| Création depuis Composition | `Une nouvelle activité` = SessionActivity uniquement ; aucun save-to-catalogue en T03 | 02–04, 06 bis, 08–12, 13 CE-T03-06, D-170 | future action bibliothèque | CONFORME | Architecture prépare l’évolution sans UI T03. |
| Sélection existante | multi-sélection persistante, validation vide désactivée, ordre d’insertion = ordre de liste filtrée | 03, 06 bis, 08, 09 bis, 11, 13 CE-T03-07, D-165/D-171 | ordre des touchers | CONFORME | Règle API et UX alignées. |
| Copie vers Séance | copie de tout l’état métier applicable ; indépendance complète après insertion | 04, 09–12, 09 bis, 13 CE-T03-07/08, D-171 | référence liée / propagation | CONFORME | Aucun lien de synchronisation. |
| Exécution directe | origine `ACTIVITY`, snapshot autonome, préparation 5 s, séries/pauses/côtés/récupération, pas de SESSION_END | PRODUCT, 03–05, 08–12, 09 bis, 13 CE-T03-09..14, D-157–D-163/D-172 | Exécution directe V2 | CONFORME | T03 ne développe pas l’orchestration complète de Séance. |
| Bilatéralité directe | réutilise strictement UNILATERAL/RIGHT_LEFT/LEFT_RIGHT et règles D-143–D-156 | PRODUCT, 00, 04, 07/07 bis, 08–12, 13 CE-T03-12 | nouvelle logique éventuelle | CONFORME | Aucun nouveau calcul. |
| Durée totale | visible dans les trois modes ; Reps/Échec = `≥ {durée connue}` | PRODUCT, 00, 04, 06–08, 10, 13 CE-T03-04, matrice/rpt Récupération, D-155/D-181 | RM-132 ; CAL-15/16 « masquée » ; ancienne formule `C−1` inconditionnelle | CONFORME | Glossaire, modèle fonctionnel, RM-132 et contrat éditeur alignés. |
| Éditeur Activité | nom en gras dans la synthèse ; pas de nouveau texte de direction dans cartes Composition | 00, 06 bis, 08, 13 CE-T03-04/08, D-154/D-182, Figma | direction développée dans carte | CONFORME | La direction développée reste limitée à la synthèse de l’éditeur. |
| Roulette ouverte | voile grisé ; CTA inférieur visuellement inchangé mais fonctionnellement + accessibilité désactivé | 06 bis, 08, 10, 13 CE-T03-04/08, D-174 | style disabled / CTA actif | CONFORME | Aucun déclenchement VoiceOver/TalkBack. |
| Swipe gauche | la carte suit le geste ; actions révélées progressivement derrière | 03, 06, 06 bis, 08, 10, 13 CE-T03-02/05/08, D-175 | carte immobile / actions superposées | CONFORME | RM-012 corrigée ; 06 bis et contrats supersèdent les formulations historiques résiduelles. |
| Swipe droit / fermeture | seul right-swipe commencé sur la carte ouverte ferme ; ailleurs aucun effet | 06 bis, 10, 13 CE-T03-02/05/08, D-175 | fermeture implicite ailleurs | CONFORME | Fond et autres swipes ne ferment pas. |
| Concurrence contextuelle | autres contrôles actifs ; tap autre carte autorisé ; second swipe contextuel bloqué | 06 bis, 10, 13 CE-T03-02/05/08, D-175 | verrouillage global | CONFORME | Une seule carte peut exposer les options. |
| Composition — actions glissées | `Dupliquer` arrondi DSF ; gap montrant le fond du Tour | 06 bis, 08, 13 CE-T03-08, D-176, Figma `2028:11808` | absence de gap/rayon | CONFORME DOCUMENTAIRE | Règle déterministe dans contrat ; comparaison visuelle implementation/Figma à faire en développement. |
| Cartes structurelles | CR initial + Fin séance non déplaçables, aucun appui long/poignée | 00, 04, 06 bis, 10, 13 CE-T03-08, D-177 | assimilation à une poignée | CONFORME | Exception à D-127 explicitée. |
| Catégories — destination | après Enregistrer → `Catalogue des séances`, segment Séances | 03, 06 bis, 10, 13 CE-T03-16, D-168 | restauration segment précédent | CONFORME | Destination et transition déterministes. |
| Transition navigation | forward canonique : cible depuis droite, courant sort gauche | 06 bis, 13 CE-T03-16/17, DSF, D-178 | animation locale | CONFORME | Règle transverse. |
| Déployer Activity card | même composant DSF que Catalogue séances, visible mais désactivé, emplacement réservé identique | Figma `3786:5093`, `3787:5148`, `3787:5209`; `2537:1033`; 05, 06 bis, 13 CE-T03-02 ; D-173 | D-164 « absent » | CONFORME | D-173 supersède D-164 ; Figma et contrat alignés. |
| Lecture Activity card | action indépendante, lance uniquement Exécution directe | 03, 06 bis, 13 CE-T03-02/09, D-173, Figma | confusion avec Déployer | CONFORME | Déployer n’intercepte pas Lecture. |
| Première carte + Récupération | donnée de démonstration Figma uniquement | Figma + 06 bis + 07 bis + 13 CE-T03-02 | interprétation règle métier | CONFORME | Toute carte l’affiche uniquement si sa définition porte une Récupération. |
| Migration | nouvelles structures ActivityDefinition/ACTIVITY sans promotion des SessionActivity historiques | 04, 09, 09 bis, 11, 12, couverture E70 chapitre 13, D-180 | migration implicite | CONFORME | Pas de création silencieuse de références ; E70 explicitement non visuel. |
| Médias | multiples hors MVP ; Déployer activé plus tard | 00, 04, 05, 09, 12, 13 CE-T03-03/04, D-173 | activation T03 | CONFORME | Aucun média fonctionnel T03. |
| Circuits | concept préparé ; segment visible disabled ; aucune création/exécution/planification T03 | 01–05, 09, 12, 13 CE-T03-01/03, D-167/D-183 | Circuit fonctionnel en T03 | CONFORME | Fonctionnel post-MVP. |
| Captures Figma | images physiques dans le dépôt, visibles en Markdown, chemins relatifs | `Specifications-fonctionnelles/images/README-T03-FIGMA.md` + preuves référencées dans chapitre 13 | URL courte Figma | CONFORME | Évidences embarquées ; trois captures Catalogue réexportées après corrections finales. |
| Contrats d’écran | structure canonique 21 sections ; couverture E01–E73 ; frontière T03/T04 ; tests négatifs | `13 – Contrats d’écran.md`, `13A`, `13B` | ancien chapitre T03 moteur Session ; contrats incomplets | PARTIELLEMENT CONFORME | Contrats T03 rédigés et périmètre couvert ; seule conformité visuelle détaillée des panneaux Filtrer/Trier reste NON VÉRIFIABLE faute de design Figma. |

## Évidences Figma contrôlées

- Fichier : `G6RY5Ebhgwb4AHIOYDwwvg`.
- `3786:5093` — Catalogue des activités — Liste.
- `3787:5148` — Catalogue — Créer — Arbre d’actions.
- `3787:5209` — Catalogue — action contextuelle directe.
- `3841:8375` — Catalogue des séances — arbre Créer.
- `3788:5258` — Composition — Ajouter une activité — arbre d’actions.
- `3789:5349`, `3789:5405` — sélection multiple d’activités existantes.
- `3879:5947`, `3879:6079` — créer / modifier une activité persistante.
- `1992:9910` — Catalogue des séances — référence de conformité du bouton `Déployer`.
- `2537:1033 — State=Collapsed` — composant DSF canonique `Déployer`.
- `2537:214 — Navigation / Bottom — Source exact` — navigation corrigée à `24 pt` max.
- Les panneaux détaillés `Filtrer` / `Trier` ne disposent pas encore de frame Figma validée : `NON VÉRIFIABLE` visuellement.

## Résultat de la passe contrats d’écran

| Contrôle | Résultat | Évidence / remarque |
|---|---|---|
| Structure canonique des contrats | CONFORME | Chapitre 13 impose les 21 sections nécessaires à un contrat déterministe. |
| Couverture T03-E01..E73 | CONFORME | Tableau de couverture du chapitre 13 ; E70 explicitement non visuel et gouverné par migration. |
| Frontière T03/T04 | CONFORME | Ancien CE-T03-01..13 moteur Session remappé CE-T04-01..13 ; frontière explicite en chapitre 13. |
| Cycle ActivityDefinition | CONFORME | CE-T03-04/05 + 13B ; accès archives via `Filtrer > Archivées`. |
| Filtrer/Trier | PARTIELLEMENT CONFORME | Comportement fonctionnel arbitré ; rendu détaillé Figma manquant. Aucun design local ne peut être inventé. |
| Exécution directe | CONFORME | CE-T03-09..14 couvrent préparation, modes, bilatéralité, fin, Synthèse et retour sans SESSION_END. |
| Suivi ACTIVITY | CONFORME | CE-T03-15. |
| Navigation/Catégories | CONFORME | CE-T03-16/17. |
| Valeurs Figma de démonstration | CONFORME | Règle commune §4.1 ; tests négatifs intégrés. |
| Responsive/accessibilité | CONFORME DOCUMENTAIRE | 360/402/440, cibles et états accessibles définis ; validation réelle à effectuer sur implémentation. |

## Résultat de la seconde passe indépendante générale

| Contrôle | Résultat | Évidence / remarque |
|---|---|---|
| Baseline | CONFORME | Branche dérivée de `187d275dbfc585140c160bd3bbefbd411c7a441b`; aucune réinjection globale d’une ancienne branche. |
| Périmètre physique | CONFORME | Modifications documentaires/Figma justifiées par T03 uniquement. |
| Anciennes règles actives | CONFORME PAR SUPERSÉSSION | 06 bis, 07 bis, 09 bis, 13 et 13B rendent explicites les règles actives et les anciennes formulations historiques. |
| Unicode des chemins | CONFORME au dernier contrôle | Pas de `#Uxxxx`/`\uXXXX`; noms Unicode conservés. |
| Fichiers temporaires | CONFORME au dernier contrôle | Aucun intermédiaire temporaire attendu. |
| Références Markdown T03 | À RECONTRÔLER à la clôture de branche | Les nouveaux fichiers 13A/13B doivent être inclus dans le dernier contrôle de liens avant fusion. |
| Captures Figma | CONFORME pour les évidences embarquées | Chemins relatifs et fichiers physiques présents. |

### Formulations historiques conservées par supersession

Des formulations anciennes peuvent encore être physiquement présentes dans les longs chapitres historiques lorsqu’elles appartiennent à un contexte antérieur. Elles ne sont pas actives lorsqu’elles divergent des arbitrages :

- `06 bis` supersède les formulations UX divergentes ;
- `07 bis` supersède D-108/D-164/D-166 et ajoute D-184 ;
- `09 bis` supersède les anciens marquages V2 de 09/11/12 pour ActivityDefinition/ACTIVITY/migration ;
- `13` remplace les anciens contrats T03 relatifs au moteur Session ; ceux-ci sont conservés dans `13A` et remappés T04 ;
- `13B` complète CE-T03-01/02/05 pour Filtrer/Trier sans inventer de design non validé.

Le seul écart documentaire volontaire restant dans le périmètre contrats est l’absence de représentation Figma détaillée des panneaux `Filtrer`/`Trier`; ce point est explicitement `NON VÉRIFIABLE` visuellement et ne doit pas être interprété comme une autorisation d’inventer l’interface.

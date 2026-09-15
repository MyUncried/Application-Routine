# Matrice de traçabilité — T03 Catalogue des activités

Baseline de départ : `main` `187d275dbfc585140c160bd3bbefbd411c7a441b`.

Branche de mise à jour : `docs/t03-catalogue-activites-final-20260915`.

Périmètre de cette matrice : décisions fonctionnelles, UX, données, API, architecture, roadmap et Figma de T03. **Les contrats d’écran détaillés du chapitre 13 sont volontairement exclus de la présente passe**, conformément à l’arbitrage produit ; ils seront repris dans une passe dédiée. Les captures Figma sont néanmoins maintenues car elles constituent des évidences documentaires.

## Matrice

| Axe | Décision attendue | Documents / évidences concernés | Ancienne règle recherchée | Statut après mise à jour | Correction / remarque |
|---|---|---|---|---|---|
| T03 / roadmap | Catalogue des activités = T03 MVP ; ancien T03 Exécution Séance → T04 ; ancien T04 → T05+ | PRODUCT, 01, 02, 04, 05, 07 + 07 bis, 09, 11, 12 | Catalogue V2 ; ancien T03 moteur | CONFORME | D-183 consolide D-166. |
| Catalogue multi-type | `Activités / Séances / Circuits`; Séances par défaut ; Activités actif T03 ; Circuits désactivé | 00–06, PRODUCT, D-167 | D-108 « Séances seul actif » | CONFORME | D-167 supersède D-108 sur Activités ; 00/01/04/05 ont été réalignés directement. |
| Navigation basse | libellé permanent `Catalogues` ; titres contextuels en minuscules après `des` ; inventaire DSF déterministe ; dessins de destination max `24 pt` centrés | 01, 06 bis, Figma `2537:214`, D-167/D-179 | libellé `Séances` ; dessins 26–29 pt | CONFORME | Vision, documentation UX et composant DSF Figma alignés. |
| État Catalogue | recherche/filtres/tri/scroll restaurés uniquement pendant l’aller-retour courant ; non persistés au relaunch | 03, 06/06 bis, 08, D-168 | restauration sans borne temporelle | CONFORME | Portée explicitée par D-168. |
| Cycle de vie ActivityDefinition | créer, consulter/modifier, archiver, restaurer, suppression définitive depuis archives | 04, 08, 09/09 bis, 10, 11, D-169 | CRUD sans cycle complet | CONFORME | Modèle fonctionnel et complément de données explicitent le cycle complet. |
| Suppression ActivityDefinition | pas de cascade vers copies de Séance ni historique | 04, 09–12, 09 bis, D-169 | ambiguïté de suppression | CONFORME | Copies et instantanés conservés. |
| Création depuis Composition | `Une nouvelle activité` = SessionActivity uniquement ; aucun save-to-catalogue en T03 | 02–04, 06 bis, 08–12, D-170 | future action bibliothèque | CONFORME | Architecture prépare l’évolution sans UI T03. |
| Sélection existante | multi-sélection persistante, validation vide désactivée, ordre d’insertion = ordre de liste filtrée | 03, 06 bis, 08, 09 bis, 11, D-165/D-171 | ordre des touchers | CONFORME | Règle API et UX alignées. |
| Copie vers Séance | copie de tout l’état métier applicable ; indépendance complète après insertion | 04, 09–12, 09 bis, D-171 | référence liée / propagation | CONFORME | Aucun lien de synchronisation. |
| Exécution directe | origine `ACTIVITY`, snapshot autonome, préparation 5 s, séries/pauses/côtés/récupération, pas de SESSION_END | PRODUCT, 03–05, 08–12, 09 bis, D-157–D-163/D-172 | Exécution directe V2 | CONFORME | T03 ne développe pas l’orchestration complète de Séance. Les anciennes mentions V2 éventuelles de 09/11/12 sont explicitement supersédées par 09 bis pour ce périmètre. |
| Bilatéralité directe | réutilise strictement UNILATERAL/RIGHT_LEFT/LEFT_RIGHT et règles D-143–D-156 | PRODUCT, 00, 04, 07/07 bis, 08–12 | nouvelle logique éventuelle | CONFORME | Aucun nouveau calcul. |
| Durée totale | visible dans les trois modes ; Reps/Échec = `≥ {durée connue}` | PRODUCT, 00, 04, 06–08, 10, matrice/rpt Récupération, D-155/D-181 | RM-132 ; CAL-15/16 « masquée » ; ancienne formule `C−1` inconditionnelle | CONFORME | Glossaire, modèle fonctionnel et RM-132 corrigés ; D-181 supersède les anciens CAL historiques. |
| Éditeur Activité | nom en gras dans la synthèse ; pas de nouveau texte de direction dans cartes Composition | 00, 06 bis, 08, D-154/D-182, Figma | direction développée dans carte | CONFORME | La direction développée reste limitée à la synthèse de l’éditeur. |
| Roulette ouverte | voile grisé ; CTA inférieur visuellement inchangé mais fonctionnellement + accessibilité désactivé | 06 bis, 08, 10, D-174 | style disabled / CTA actif | CONFORME | Aucun déclenchement VoiceOver/TalkBack. |
| Swipe gauche | la carte suit le geste ; actions révélées progressivement derrière | 03, 06, 06 bis, 08, 10, D-175 | carte immobile / actions superposées | CONFORME | RM-012 corrigée ; 06 bis supersède explicitement les formulations historiques résiduelles de 03/06/08. |
| Swipe droit / fermeture | seul right-swipe commencé sur la carte ouverte ferme ; ailleurs aucun effet | 06 bis, 10, D-175 | fermeture implicite ailleurs | CONFORME | Fond et autres swipes ne ferment pas. |
| Concurrence contextuelle | autres contrôles actifs ; tap autre carte autorisé ; second swipe contextuel bloqué | 06 bis, 10, D-175 | verrouillage global | CONFORME | Une seule carte peut exposer les options. |
| Composition — actions glissées | `Dupliquer` arrondi DSF ; gap montrant le fond du Tour | 06 bis, 08, D-176, Figma | absence de gap/rayon dans implémentation | CONFORME | Règle documentaire établie ; validation frame par frame sera reprise dans la passe contrats. |
| Cartes structurelles | CR initial + Fin séance non déplaçables, aucun appui long/poignée | 00, 04, 06 bis, 10, D-177 | assimilation à une poignée | CONFORME | Règle rendue explicite dans les sources fonctionnelles. |
| Catégories — destination | après Enregistrer → `Catalogue des séances`, segment Séances | 03, 06 bis, 10, D-168 | restauration segment précédent | CONFORME | État Catalogue cible déterminé. |
| Transition navigation | forward canonique : cible depuis droite, courant sort gauche | 06 bis, DSF, D-178 | animation locale | CONFORME | Règle transverse. |
| Déployer Activity card | même composant DSF que Catalogue séances, visible mais désactivé, emplacement réservé identique | Figma `3786:5093`, `3787:5148`, `3787:5209`; `2537:1033`; 05, 06 bis ; D-173 | D-164 « absent » | CONFORME | D-173 supersède explicitement D-164 ; 05 et Figma ont été corrigés. |
| Lecture Activity card | action indépendante, lance uniquement Exécution directe | 03, 06 bis, D-164/D-173, Figma | confusion avec Déployer | CONFORME | Déployer n’intercepte pas Lecture. |
| Première carte + Récupération | donnée de démonstration Figma uniquement | Figma + 06 bis + 07 bis | interprétation règle métier | CONFORME | Toute carte l’affiche uniquement si sa définition porte une Récupération. |
| Migration | nouvelles structures ActivityDefinition/ACTIVITY sans promotion des SessionActivity historiques | 04, 09, 09 bis, 11, 12, D-180 | migration implicite | CONFORME | Pas de création silencieuse de références ; 09 bis supersède les anciens marquages V2. |
| Médias | multiples hors MVP ; Déployer activé plus tard | 00, 04, 05, 09, 12, D-173 | activation T03 | CONFORME | Aucun média fonctionnel T03. |
| Circuits | concept préparé ; segment visible disabled ; aucune création/exécution/planification T03 | 01–05, 09, 12, D-167/D-183 | Circuit fonctionnel en T03 | CONFORME | Fonctionnel post-MVP. |
| Captures Figma | images physiques dans le dépôt, visibles en Markdown, chemins relatifs, aucune URL Figma temporaire requise | `Specifications-fonctionnelles/images/README-T03-FIGMA.md` + 3 JPG | URL courte Figma | CONFORME | Les trois évidences ont été réexportées après les corrections finales Déployer + navigation. |
| Contrats d’écran | hors périmètre de cette passe | chapitre 13 | — | NON VÉRIFIABLE | Passe dédiée demandée par le responsable produit ; aucune modification du chapitre 13 dans ce diff. |

## Évidences Figma contrôlées

- Fichier : `G6RY5Ebhgwb4AHIOYDwwvg`.
- `3786:5093` — Catalogue des activités — Liste.
- `3787:5148` — Catalogue — Créer — Arbre d’actions.
- `3787:5209` — Catalogue — action contextuelle directe.
- `1992:9910` — Catalogue des séances — référence de conformité du bouton `Déployer`.
- `2537:1033 — State=Collapsed` — composant DSF canonique `Déployer` réutilisé sur les cartes Activité.
- `2537:214 — Navigation / Bottom — Source exact` — composant DSF de navigation ; dessins de destination corrigés à `24 pt` max et recentrés.

## Résultat de la seconde passe indépendante

| Contrôle | Résultat | Évidence / remarque |
|---|---|---|
| Baseline | CONFORME | La branche dérive directement de `187d275dbfc585140c160bd3bbefbd411c7a441b` ; le merge-base du diff reste cette baseline et la branche n’est pas en retard sur elle. |
| Périmètre physique du diff | CONFORME | Le diff final ne contient que `docs/**` ; aucun fichier applicatif, protocolaire ou de configuration n’est modifié. |
| Chapitre 13 | NON VÉRIFIABLE | Volontairement exclu de cette passe et absent du diff ; il doit être audité dans la passe contrats d’écran. |
| Anciennes règles métier actives | CONFORME | 00, 01, 04, 05 et 10 ont été corrigés sur les contradictions identifiées ; 07 bis supersède explicitement D-108/D-164/D-166 et 06 bis/09 bis neutralisent les formulations historiques divergentes de leurs chapitres sources. |
| Unicode des chemins | CONFORME | Contrôle du tree Git : aucune occurrence `#U` ni séquence `\u` dans les chemins ; accents, apostrophes et tirets Unicode sont conservés physiquement. |
| Fichiers temporaires | CONFORME | Aucun `.tmp-audit-marker`, `.base64`, fichier source intermédiaire ou rapport temporaire n’apparaît dans le tree ni dans le diff final. |
| Références Markdown T03 | CONFORME | Les compléments 06 bis/07 bis/09 bis, la matrice et `README-T03-FIGMA.md` existent aux chemins référencés ; les trois liens image utilisent exactement les trois noms physiques `*-t03.jpg`. |
| Captures après dernière correction Figma | CONFORME | Commit `1504b24aa5dc7686046fe150913f83cbecb32a04` remplace les trois binaires ; tailles finales contrôlées : `4845`, `4774`, `4924` octets. README précise leur réexport après Déployer et navigation 24 pt. |
| Fichiers non concernés | CONFORME | La comparaison avec la baseline ne montre aucun changement hors de la liste documentaire justifiée par T03 et ses évidences Figma. |

### Formulations historiques conservées par supersession

Des formulations anciennes peuvent encore être physiquement présentes dans les longs chapitres 03, 06, 07, 08, 09, 11 ou 12 lorsqu’elles appartiennent à un contexte historique ou n’ont pas été réécrites localement. Elles ne sont **pas actives** lorsqu’elles divergent des arbitrages :

- `06 bis` supersède explicitement les formulations UX divergentes de 03/06/08, notamment « carte immobile / actions en superposition » ;
- `07 bis` supersède explicitement les décisions antérieures citées, notamment D-108, D-164 et D-166 ;
- `09 bis` supersède explicitement, pour T03, les anciens marquages V2 de 09/11/12 relatifs à `ActivityDefinition`, `ACTIVITY`, Exécution directe et migration.

Cette supersession est explicite et traçable ; elle n’est pas une inférence. Les contrats du chapitre 13 restent le seul périmètre documentaire volontairement non contrôlé dans cette passe.

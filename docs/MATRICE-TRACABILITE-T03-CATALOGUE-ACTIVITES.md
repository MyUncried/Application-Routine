# Matrice de traçabilité — T03 Catalogue des activités

Baseline de départ : `main` `187d275dbfc585140c160bd3bbefbd411c7a441b`.

Branche de mise à jour : `docs/t03-catalogue-activites-final-20260915`.

Périmètre de cette matrice : décisions fonctionnelles, UX, données, API, architecture, roadmap et Figma de T03. **Les contrats d’écran détaillés du chapitre 13 sont volontairement exclus de la présente passe**, conformément à l’arbitrage produit ; ils seront repris dans une passe dédiée. Les captures Figma sont néanmoins maintenues car elles constituent des évidences documentaires.

## Matrice

| Axe | Décision attendue | Documents / évidences concernés | Ancienne règle recherchée | Statut après mise à jour | Correction / remarque |
|---|---|---|---|---|---|
| T03 / roadmap | Catalogue des activités = T03 MVP ; ancien T03 Exécution Séance → T04 ; ancien T04 → T05+ | PRODUCT, 01, 02, 04, 05, 07 + 07 bis, 09, 11, 12 | Catalogue V2 ; ancien T03 moteur | CONFORME | D-183 consolide D-166. |
| Catalogue multi-type | `Activités / Séances / Circuits`; Séances par défaut ; Activités actif T03 ; Circuits désactivé | 01–06, PRODUCT, D-167 | D-108 « Séances seul actif » | CONFORME | D-167 supersède D-108 sur Activités. |
| Navigation basse | libellé permanent `Catalogues` ; titres contextuels en minuscules après `des` ; inventaire DSF déterministe ; dessins de destination max `24 pt` centrés | 06 bis, Figma `2537:214`, D-167/D-179 | libellé `Séances` ; dessins 26–29 pt | CONFORME | Inventaire documenté ; composant DSF Figma corrigé sur ses variantes. |
| État Catalogue | recherche/filtres/tri/scroll restaurés uniquement pendant l’aller-retour courant ; non persistés au relaunch | 03, 06/06 bis, 08, D-168 | restauration sans borne temporelle | CONFORME | Portée explicitée par D-168. |
| Cycle de vie ActivityDefinition | créer, consulter/modifier, archiver, restaurer, suppression définitive depuis archives | 04, 08, 09/09 bis, 10, 11, D-169 | CRUD sans cycle complet | CONFORME | Aligné sur le pattern Séance. |
| Suppression ActivityDefinition | pas de cascade vers copies de Séance ni historique | 04, 09–12, 09 bis, D-169 | ambiguïté de suppression | CONFORME | Copies et instantanés conservés. |
| Création depuis Composition | `Une nouvelle activité` = SessionActivity uniquement ; aucun save-to-catalogue en T03 | 02–04, 06 bis, 08–12, D-170 | future action bibliothèque | CONFORME | Architecture prépare l’évolution sans UI T03. |
| Sélection existante | multi-sélection persistante, validation vide désactivée, ordre d’insertion = ordre de liste filtrée | 03, 06 bis, 08, 09 bis, 11, D-165/D-171 | ordre des touchers | CONFORME | Règle API déjà présente et reclassée T03. |
| Copie vers Séance | copie de tout l’état métier applicable ; indépendance complète après insertion | 04, 09–12, 09 bis, D-171 | référence liée / propagation | CONFORME | Aucun lien de synchronisation. |
| Exécution directe | origine `ACTIVITY`, snapshot autonome, préparation 5 s, séries/pauses/côtés/récupération, pas de SESSION_END | PRODUCT, 03–05, 08–12, 09 bis, D-157–D-163/D-172 | Exécution directe V2 | CONFORME | T03 ne développe pas l’orchestration complète de Séance. |
| Bilatéralité directe | réutilise strictement UNILATERAL/RIGHT_LEFT/LEFT_RIGHT et règles D-143–D-156 | PRODUCT, 04, 07/07 bis, 08–12 | nouvelle logique éventuelle | CONFORME | Aucun nouveau calcul. |
| Durée totale | visible dans les trois modes ; Reps/Échec = `≥ {durée connue}` | PRODUCT, 06–08, 10, matrice/rpt Récupération, D-155/D-181 | RM-132 ; CAL-15/16 « masquée » | CONFORME | D-181 déclare explicitement ces anciennes règles obsolètes ; matrice/rapport historique révisés. |
| Éditeur Activité | nom en gras dans la synthèse ; pas de nouveau texte de direction dans cartes Composition | 06 bis, 08, D-154/D-182, Figma | direction développée dans carte | CONFORME | La direction développée reste limitée à la synthèse de l’éditeur. |
| Roulette ouverte | voile grisé ; CTA inférieur visuellement inchangé mais fonctionnellement + accessibilité désactivé | 06 bis, 08, 10, D-174 | style disabled / CTA actif | CONFORME | Aucun déclenchement VoiceOver/TalkBack. |
| Swipe gauche | la carte suit le geste ; actions révélées progressivement derrière | 06 bis, 08, 10, D-175 | carte immobile / actions superposées | CONFORME PAR SUPERSÉSSION | D-175 et 06 bis supersèdent RM-012 et formulations historiques. |
| Swipe droit / fermeture | seul right-swipe commencé sur la carte ouverte ferme ; ailleurs aucun effet | 06 bis, 08, 10, D-175 | fermeture implicite ailleurs | CONFORME | Fond et autres swipes ne ferment pas. |
| Concurrence contextuelle | autres contrôles actifs ; tap autre carte autorisé ; second swipe contextuel bloqué | 06 bis, 08, D-175 | verrouillage global | CONFORME | Une seule carte peut exposer les options. |
| Composition — actions glissées | `Dupliquer` arrondi DSF ; gap montrant le fond du Tour | 06 bis, 08, D-176, Figma | absence de gap/rayon dans implémentation | CONFORME DOCUMENTAIRE | Validation frame par frame à reprendre dans la passe contrats. |
| Cartes structurelles | CR initial + Fin séance non déplaçables, aucun appui long/poignée | 06 bis, 08, D-177 | assimilation à une poignée | CONFORME | D-177 fait exception à D-127. |
| Catégories — destination | après Enregistrer → `Catalogue des séances`, segment Séances | 03, 06 bis, 08, D-168 | restauration segment précédent | CONFORME | État Catalogue cible déterminé. |
| Transition navigation | forward canonique : cible depuis droite, courant sort gauche | 06 bis, DSF, D-178 | animation locale | CONFORME | Règle transverse. |
| Déployer Activity card | même composant DSF que Catalogue séances, visible mais désactivé, emplacement réservé identique | Figma `3786:5093`, `3787:5148`, `3787:5209`; `2537:1033`; 06 bis ; D-173 | D-164 « absent » | CONFORME | Figma corrigé avec le composant canonique. |
| Lecture Activity card | action indépendante, lance uniquement Exécution directe | 03, 06 bis, D-164/D-173, Figma | confusion avec Déployer | CONFORME | Déployer n’intercepte pas Lecture. |
| Première carte + Récupération | donnée de démonstration Figma uniquement | Figma + 06 bis + 07 bis | interprétation règle métier | CONFORME | Toute carte l’affiche uniquement si sa définition porte une Récupération. |
| Migration | nouvelles structures ActivityDefinition/ACTIVITY sans promotion des SessionActivity historiques | 09, 09 bis, 11, 12, D-180 | migration implicite | CONFORME | Pas de création silencieuse de références. |
| Médias | multiples hors MVP ; Déployer activé plus tard | 05, 09, 12, D-173 | activation T03 | CONFORME | Bouton Ajouter média reste désactivé selon règles existantes. |
| Circuits | concept préparé ; segment visible disabled ; aucune création/exécution/planification T03 | 01–05, 09, 12, D-167/D-183 | Circuit fonctionnel en T03 | CONFORME | Fonctionnel post-MVP. |
| Captures Figma | images physiques dans le dépôt, visibles en Markdown, chemins relatifs, aucune URL Figma temporaire requise | `Specifications-fonctionnelles/images/README-T03-FIGMA.md` + 3 JPG | URL courte Figma | CONFORME | Les trois évidences corrigées sont embarquées et ont été réexportées après correction finale de navigation. |
| Contrats d’écran | hors périmètre de cette passe | chapitre 13 | — | NON VÉRIFIABLE dans cette passe | Passe dédiée demandée par le responsable produit. |

## Évidences Figma contrôlées

- Fichier : `G6RY5Ebhgwb4AHIOYDwwvg`.
- `3786:5093` — Catalogue des activités — Liste.
- `3787:5148` — Catalogue — Créer — Arbre d’actions.
- `3787:5209` — Catalogue — action contextuelle directe.
- `1992:9910` — Catalogue des séances — référence de conformité du bouton `Déployer`.
- `2537:1033 — State=Collapsed` — composant DSF canonique `Déployer` réutilisé sur les cartes Activité.
- `2537:214 — Navigation / Bottom — Source exact` — composant DSF de navigation ; dessins de destination corrigés à `24 pt` max et recentrés.

## Contrôle de deuxième passe

La seconde passe recherche notamment : anciennes mentions Catalogue `V2`, `Séances` comme seule destination active, D-164 sans `Déployer`, RM-132/CAL-15/CAL-16 masquant Durée totale, carte immobile au swipe gauche, fermeture contextuelle par tap extérieur, poignée/appui long sur Compte à rebours initial ou Fin de séance, promotion automatique `SessionActivity → ActivityDefinition`, anciens numéros T03/T04. Toute occurrence historique conservée doit être explicitement identifiée comme supersédée ou historique, et non comme règle active.

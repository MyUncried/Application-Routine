# État des lieux — Créer ou modifier un exercice — 03/10/2026

## Base et méthode

GitHub vérifié : main `8fc58a466679a85ea74752f0273939f901efa1b8`, PR284 à `117bedcb27a7290d8dc35bdd7bcee58ad0c739b5` avant cette correction. Le travail continue sur cette PR, pas sur une ancienne version documentaire. Figma : fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page Prototype MVP `510:101`, **132 frames directement sous la page** au relevé. Ce nombre n’est pas un nombre d’écrans fonctionnels.

Lecture actuelle de la structure, export et inspection visuelle des42frames du périmètre. Pour les références existantes, comparaison du SHA Git de l’export PNG avec le fichier publié : identique = rendu exporté inchangé ; différent = capture actualisée. Cette comparaison ne prétend pas reconstituer l’historique des modifications de chaque calque. Les captures ne prouvent pas le fonctionnement des interactions.

## Résultat consolidé

| Catégorie | Nombre | Traitement |
|---|---:|---|
| Écrans existants de paramètres modifiés | 11 | Export actuel à l’emplacement existant ; références rétablies aux IDs6407/6411/6419/6423 ; CE-T03-04 et CE-UI-10 revus |
| Nouvelles frames intégrées à Prototype MVP | 15 | 11états de feuille,2résumés,1Catalogue,1Composition ; capturés et intégrés au chapitre06 |
| Écrans d’exécution impactés | 3 | Exports actualisés ; contrats compteur/côté et règles métier conservés |
| Références existantes inchangées | 13 | Formulaire/référentiels/confirmations et carte Paramètres vide vérifiés ; conservés comme courants |
| Total du périmètre contrôlé | 42 | Chaque frame a une capture actuelle, un statut et un contrat hôte ci-dessous |

La famille Créer/modifier comprend37frames :9vues du formulaire/résumé,21états de la même feuille Paramètres,7sélections/créations/confirmations. Les5autres frames relèvent du Catalogue, de la Composition et de l’Exécution. Aucun nouveau shell et aucun contrat indépendant par variante Figma.

## Inventaire frame par frame

Les noms source sont conservés pour retrouver Figma ; l’interface cible dit Exercice et utilise les libellés v12. Lien PNG = fichier documentaire courant, pas une capture historique de copie.

| Frame et nom source | État face à la version publiée | Contrat hôte | Capture actuelle | SHA Git |
|---|---|---|---|---|
| [1992:8132](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8132) — Exécution d'une séance — Démarrée | modifié | CE-EXEC-SESSION-01 | [PNG](Specifications-fonctionnelles/images/ecran-9-execution-seance.png) | `834ea8b402f0c26b3b3273da6d87ff37c6ad59bf` |
| [4968:8188](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4968-8188) — Exécution d'un exercice — Démarrée | modifié | CE-T03-09..13 | [PNG](Specifications-fonctionnelles/images/figma-4968-8188.png) | `f85a68465698a9cb8d80526b3b4ea745612eeb9d` |
| [3542:4656](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3542-4656) — Création activité — Avant Paramètres d'exécution | inchangé | CE-T03-04 | [PNG](Specifications-fonctionnelles/images/ecran-4-creation-activite-duree.png) | `074482e3abca16eee80056329741a8c703fd6cd4` |
| [3943:6064](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3943-6064) — Ajouter un exercice — Initial | inchangé | CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-3943-6064.png) | `5dfb6a27e496ddaa6345a7058ed01493f0ff5e18` |
| [4217:6980](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4217-6980) — Ajouter un exercice — Nom Description Media | inchangé | CE-T03-04 | [PNG](Specifications-fonctionnelles/images/ecran-15-creation-activite-persistante.png) | `bfdac38156e0a32396c31ee7753dd8825884de21` |
| [5088:6398](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5088-6398) — Ajouter un exercice — Catégorie renseignée | inchangé | CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-5088-6398.png) | `b5b07d2461ed0db8f81b6716a1a8011722dd7c27` |
| [4734:6342](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4734-6342) — Modifier un exercice | inchangé | CE-T03-04 | [PNG](Specifications-fonctionnelles/images/ecran-15a-modification-activite-persistante.png) | `1f864f14e20ac5270a86cfc6f26c646ad9e58307` |
| [4332:7095](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4332-7095) — Ajouter un exercice — Catégories | inchangé | CE-UI-09 | [PNG](Specifications-fonctionnelles/images/figma-4332-7095.png) | `91ae1ffd8e15fd33a2f9c3d189faea41562cf6d5` |
| [4474:7157](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4474-7157) — Ajouter un exercice — Nouvelle catégorie | inchangé | CE-UI-09 | [PNG](Specifications-fonctionnelles/images/figma-4474-7157.png) | `b16a117fccd4f1b8ecd119d3b6e5e6bb865d568a` |
| [4478:7209](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4478-7209) — Ajouter un exercice — Zones corporelles | inchangé | CE-UI-09 | [PNG](Specifications-fonctionnelles/images/ecran-4h-creation-activite-zone-corporelle.png) | `d791e6275a6be79aec443d404887eaa072fc4de8` |
| [4683:6336](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4683-6336) — Ajouter un exercice — Nouvelle zone corporelle | inchangé | CE-UI-09 | [PNG](Specifications-fonctionnelles/images/figma-4683-6336.png) | `48f9dcac9d88af2e57aa9c6928564f7e6ab14505` |
| [4714:6241](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4714-6241) — Modal — Abandonner la création de l’activité | inchangé | CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-4714-6241.png) | `a7f65dfa058f94e1e2a4231aa146a2c1630bd541` |
| [4861:6259](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4861-6259) — Ajouter un exercice — Catégorie — Appui long — Confirmation suppression | inchangé | CE-UI-09 | [PNG](Specifications-fonctionnelles/images/figma-4861-6259.png) | `2a1735abb723f92b2c3b4d4209b2929d53326012` |
| [4861:6348](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4861-6348) — Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression | inchangé | CE-UI-09 | [PNG](Specifications-fonctionnelles/images/figma-4861-6348.png) | `f90a950055146ed9e6bbd6cf268183666656f9d9` |
| [5581:4257](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5581-4257) — Exécution d'un exercice — Démarré —  Bascule haute avec texte | modifié | CE-MEDIA-EXEC-01 / CE-T03-09..13 | [PNG](Specifications-fonctionnelles/images/figma-5581-4257.png) | `0340b890a95fc3217971175962125c9e0d1289d0` |
| [6407:9458](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6407-9458) — Création activité — Paramètres en modale — 1 Champ vide | inchangé | CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6407-9458.png) | `074482e3abca16eee80056329741a8c703fd6cd4` |
| [6407:9551](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6407-9551) — Création activité — Paramètres en modale — 2 Modale ouverte (champs vides) | modifié | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6407-9551.png) | `b907620967b1cae35e433a0051eda824df98309a` |
| [6407:9702](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6407-9702) — Création activité — Paramètres en modale — 3 Texte affiché | modifié | CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6407-9702.png) | `c3cc6eaf6249655191fcb36ba0f789f030488618` |
| [6407:9805](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6407-9805) — Création activité — Paramètres en modale — 4 Modale complète — mode activé | modifié | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6407-9805.png) | `35a3047ea838fa35a0ebf16c1d1105b67cb7ef6b` |
| [6407:9966](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6407-9966) — Création activité — Paramètres en modale — 5 Modale complète — steppers (séries, pauses) | modifié | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6407-9966.png) | `966f6c4fae19d6e17c105e0481aa33bdfbd086ce` |
| [6407:10127](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6407-10127) — Création activité — Paramètres en modale — 6 Durée activée (roulette ouverte) | modifié | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6407-10127.png) | `99b760d465ae79b13821473e74cb04f37b639d71` |
| [6407:10481](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6407-10481) — Création activité — Paramètres en modale — 8 Changement de côté activé (contrôle segmenté) | modifié | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6407-10481.png) | `38df4343e6586a5d083f213d7bdb64489462ca1c` |
| [6411:9546](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6411-9546) — Création activité — Paramètres en modale — 7 Durée totale activée (roulette ouverte) | modifié | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6411-9546.png) | `9ef966b2deb7a048b872541f4ee4a8f7baca4b88` |
| [6411:9649](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6411-9649) — Création activité — Paramètres en modale — 9 Avec changement de côté (pause au changement de côté) | modifié | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6411-9649.png) | `a0da0f9719ffc4f77e02944713386ab626e7a097` |
| [6419:9847](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6419-9847) — Création activité — Paramètres en modale — 10 Répétitions (mode activé) | modifié | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6419-9847.png) | `702d6b88963f5e9e1c2e637601e77a4962dc2fdb` |
| [6419:10028](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6419-10028) — Création activité — Paramètres en modale — 11 À l’échec (mode activé) | modifié | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6419-10028.png) | `af77e73cadfe19b6782809af81a31712ac2fbb63` |
| [6423:9953](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6423-9953) — Création activité — Paramètres en modale — 12 Modale complète — steppers (séries, pauses) avec message de durée totale ajustée | modifié | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6423-9953.png) | `eacc694a1d0593b0195a8bbaa55d7b50b9a12c40` |
| [6665:23973](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-23973) — Composition séance — Standard — Séries variables | nouveau | CE-T03-08 | [PNG](Specifications-fonctionnelles/images/figma-6665-23973.png) | `620a9d06c4ce8aed040dc2081d1e3a9d0ee41298` |
| [6665:24120](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-24120) — Catalogue des exercices — Liste — Séries variables | nouveau | CE-T03-02 | [PNG](Specifications-fonctionnelles/images/figma-6665-24120.png) | `5b061c9b12e9168e7281cafc8bd23c287e96c744` |
| [6665:24616](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-24616) — Séries variables — 2 Durée variable (scénario A) | nouveau | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6665-24616.png) | `bc51688f9951d0c720fd47a6c77c8088616be8a4` |
| [6665:24844](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-24844) — Séries variables — 3 Répétitions variables (scénario E) | nouveau | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6665-24844.png) | `d7b77c94a4fc7dbe2da659789f04287774b24c28` |
| [6665:25072](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-25072) — Séries variables — 4 À l’échec variable (scénario F) | nouveau | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6665-25072.png) | `4b48ea23488ec3ebcd9fa687d4908f8d56957de2` |
| [6665:25277](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-25277) — Séries variables — 5 Douze séries (défilement — haut) | nouveau | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6665-25277.png) | `9a3109e30b0ffc03a2b632944cd8763762f359f4` |
| [6665:26185](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-26185) — Ordre des côtés — 7 Sélection : Un côté après l’autre | nouveau | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6665-26185.png) | `ecc63ab11ac605fc7674efd259fb0fff8debd9f9` |
| [6665:26575](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-26575) — Séries variables + Les deux côtés à chaque série — 9 (scénario D) | nouveau | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6665-26575.png) | `ac26667a4601f8445aa562da52430c53c4e5e820` |
| [6665:26822](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-26822) — Une seule série — 10 Options sans effet | nouveau | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6665-26822.png) | `fb83a116830d7c4582a0f1953eaaeeeece8a0f7f` |
| [6665:27008](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-27008) — Changement de mode — 11 Cibles à renseigner | nouveau | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6665-27008.png) | `b4432cb1bae13f2569de0733c2c37394af0a81e7` |
| [6665:27232](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-27232) — Validation impossible — 12 Série incomplète | nouveau | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6665-27232.png) | `a3795047d881a86b6a643b01958a98f267185194` |
| [6665:27458](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-27458) — Séries variables — 13 Tableau masqué | nouveau | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6665-27458.png) | `91f095cdf0054f08b767e6df15f75a978dcca24a` |
| [6665:27608](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-27608) — Séries variables — 14 Déplacement d’une série | nouveau | CE-UI-10 | [PNG](Specifications-fonctionnelles/images/figma-6665-27608.png) | `cc4992eddc597e259c958cc9128f7d617b96b30d` |
| [6665:27862](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-27862) — Résumé — 15 Durée variable bilatérale Par série | nouveau | CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6665-27862.png) | `ad955699fd35e1d0be1af5109ba0074db9f02497` |
| [6665:28050](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=6665-28050) — Résumé — 17 À l’échec variable | nouveau | CE-T03-04 | [PNG](Specifications-fonctionnelles/images/figma-6665-28050.png) | `fe0e61686ed8efa21e18dae389376c14ec4046cd` |

## Copies précédentes et états sans frame actuelle dédiée

Les39copies exportées le02/10 ne figurent plus directement sur Prototype MVP au relevé.30ont une correspondance de présentation dans les références actuelles ;9n’ont plus de correspondance dédiée ci-dessous. Cela ne signifie ni suppression du fichier Figma entier, ni suppression d’une exigence. Les anciens PNG restent historiques ; la galerie active ne les présente plus comme courants.

| Ancienne copie | État illustré | Couverture actuelle / traitement |
|---|---|---|
| 6607:10896 | Tests — Composants Séries variables | Essai DSF historique ; ne certifie aucun composant maître. |
| 6611:12930 | Copie — Résumé — 15 Répétitions variables | Résumé Répétitions visible derrière6665:24844 ; vue parent seule absente. |
| 6611:13215 | Copie — Résumé — 17 Uniforme bilatéral Par série | Uniforme alterné requis par v12 ; pas de résumé parent dédié actuel. |
| 6612:12272 | Copie — Exécution d’une séance — Dernière série — Récupération (scénario B) | R>0 remplace PN selon spécification ; aucune preuve dédiée actuelle de la phase terminale. |
| 6612:12371 | Copie — Exécution d’un exercice — Par série — Série 1/3 Côté droit | Série/côté visible dans les exécutions générales ; absence de frame dédiée au passage droit de la paire. |
| 6612:12471 | Copie — Exécution d’un exercice — Par série — Série 1/3 Côté gauche | Même couverture partielle ; absence de frame dédiée au passage gauche de la paire. |
| 6623:12956 | Copie — Séries variables — 1 Activation (valeurs recopiées) | Activation par copie spécifiée dans v12§3 ; états variables présents, pas de démonstration dédiée d’activation. |
| 6623:14880 | Copie — Séries variables — 6 Douze séries (défilement — bas) | 6665:25277 montre le haut ; accès au bas par scroll prescrit, capture basse absente. |
| 6623:15749 | Copie — Ordre des côtés — 8 Sélection : Les deux côtés à chaque série | 6665:26185 montre les deux options ;6665:26575 montre la valeur alternée, pas son segmenté ouvert sélectionné. |

G→D reste une direction spécifiée et testable, sans frame dédiée dans ce lot. Ce manque de preuve graphique ne rouvre aucun arbitrage métier.

## Revue des contrats — contenu des21rubriques

CE-T03-04, CE-UI-10 et CE-UI-09 ont été relus sur leur contenu, avec la correspondance suivante. CE-T03-02/08, CE-EXEC-SESSION-01 et CE-MEDIA-EXEC-01 ont leurs références et limites de preuve actualisées ; CE-T03-09..13 héritent des mêmes règles d’exécution et de réinitialisation. Le contrôle structurel porte aussi sur les30contrats du chapitre13 :21rubriques numérotées et non vides chacun.

| Rubrique | Formulaire CE-T03-04 | Feuille CE-UI-10 | Référentiels CE-UI-09 |
|---|---|---|---|
| 1. Identification | 9vues+abandon, IDs actuels | 21états sous un contrat unique | 6frames sélection/création/suppression |
| 2. Finalité | Créer/modifier un Exercice | Éditer paramètres uniformes/variables | Classer sans changer les paramètres |
| 3. Entrée | Catalogue ou copie, brouillon | Copie transactionnelle du parent | Accès depuis parent conservé |
| 4. Sortie | Terminer/retour/abandon | ✕annule,✓applique | Catégorie simple / Zones multiples |
| 5. Données | Paramètres appliqués et référentiels | Mode,N,tableau,direction,ordre,PC,CR/Fin | IDs,couleurs,affectations |
| 6. Valeurs Figma | Résumé dynamique, exemples non normatifs | Total dérivé,≥,—,absence À l’échec | Libellés dynamiques et jeux de départ |
| 7. Structure | Shell et ordre des sections | En-tête fixe,corps/tableau défilant | Feuille,palette/clavier,dialogue |
| 8. Obligatoires | Résumé/raccourcis,Terminer | Interrupteur,tableau,ordre conditionnel | Catégorie1,Zones≥1 |
| 9. Layout | Références formulaire/résumés actuels | Groupe354,ligne334,segmenté330×60 | D-228,palette Catégorie uniquement |
| 10. Adaptation | 360/402/440,clavier,focus | Scroll global,Safe Areas,texte agrandi | Scroll/clavier et actions accessibles |
| 11. États | Vide,partiel,modification,résumés,erreur | Uniforme/variable,modes,N1,12lignes,invalide,repli,drag | Vide/choix/création/retrait/erreur |
| 12. Interactions | Raccourcis,✓puisTerminer | Bascules,restauration,déplacement | Tap,toggle,création,suppression |
| 13. Gestes | Tap,saisie,scroll | Stepper,roulette,drag,repli | Tap,scroll,appui long |
| 14. Validation | Nom,Catégorie,Zones,paramètres valides | Bornes et cibles actives,✓grisé | Nom unique,affectations valides |
| 15. Persistance | Atomique àTerminer | Aucun état caché persisté ; N1 normalisé | Affectations distinctes de création du référentiel |
| 16. Navigation | Retour contexte et état restaurés | Annuler restaure tout le parent | Retour conserve paramètres variables |
| 17. Erreurs | ÉchecDB,brouillon conservé | —≠0,invalidité même repliée | Nom vide/doublon,échec,retrait concurrent |
| 18. Accessibilité | Labels,résumé,focus restitué | Série/unité,erreur,readonly,déplacement accessible | Nom/état/couleur,focus dialogue |
| 19. Invariants | Pas de saisie inline ni import ajouté | Mode unique,mêmes valeurs deux côtés,total intrinsèque | Classification sans effet moteur |
| 20. Recette | Sauvegarde/réouverture,copie indépendante | A–F,bascules,N1,bornes,scroll,drag | Choix/création/suppression,historique |
| 21. Traçabilité | Inventaire et v12 actuels | Preuves courantes et absences distinguées | D-210/222 conservées,PNG inchangés |

## Écarts actuels à ne pas transformer en règles

- 6407:9551 : ✓ bleu alors que les paramètres sont incomplets ; le contrat impose l’état inactif.6665:27008/27232 illustrent l’invalidité grisée.
- 4734:6342 et certains parents derrière les confirmations gardent5min et « pause entre les séries » ; calculs/libellés v12 restent normatifs.
- 4332:7095 conserve une coche pour la Catégorie alors que D-222 prescrit la sélection simple auto-validée. Aucun nouveau besoin de validation ajouté.
- 6665:23973 conserve « Parcours » pour le Circuit et une récupération visible ; vocabulaire Circuit/Tour et masquage D-238 restent applicables.
- 4968:8188/5581:4257 montrent Tour en direct, et la dernière Série0/3 ; ACTIVITY sans Tour et index à partir de1 restent les règles.
- 6665:25277 : bas hors viewport ; présence des calques sous le viewport ne prouve pas le scroll interactif. Capture basse et accessibilité360/440/texte agrandi restent à qualifier.

Les écarts sont de preuve ou d’assemblage Figma, pas des questions de calcul à poser au propriétaire. Aucun Figma n’est modifié par cette mise à jour.

## Réinitialisation et réserve retirée

D-029/D-150 restent applicables dans les deux ordres : recommencer le côté courant depuis sa première Série, préserver les résultats de l’autre côté et le temps total. En alternance, gauche2/3 revient à gauche1/3 sans rejouer les passages droits acquis. Pendant une récupération, seule la phase courante est réinitialisée. Le saut anticipé conserve le côté courant comme partiel et poursuit les passages de l’autre côté restant à exécuter. La réserve ajoutée le02/10 a été retirée de la cible normative et corrigée dans le rapport précédent : aucune décision de design n’était à rouvrir.

## Fichiers et vérification finale

- Chapitre06 : famille Créer/modifier reconstruite en trois groupes logiques,37captures actuelles ; Catalogue/Composition/Exécution reliés à leurs références courantes. Anciennes copies retirées de la galerie active.
- Chapitre13 : références, états, layout, recette et preuves actualisés ; règles de réinitialisation clarifiées sans nouveau périmètre.30contrats/630rubriques complets structurellement.
- DSF existant : références actuelles, dimensions relues, preuve de scroll distinguée de son exigence.
- v12,registre,chapitres transverses : retrait de la réserve injustifiée ; aucun nouveau calcul.
- Ancienne matrice/rapport datés02/10 : signalés comme historiques et reliés au présent état des lieux. INDEX,PRODUCT et matrice de couverture pointent ici.
- 42exports inspectés, SHA comparés, chaque image référencée dans chapitre06 et chaque frame rattachée à un contrat ; liens locaux et concordance des IDs contrôlés avant publication.

La documentation du parcours est complète au regard des décisions établies. Les limites de preuve Figma sont listées ci-dessus : aucune affirmation de recette interactive ou de conformité applicative. Aucun code/test/moteur modifié ; PRE-1 reste fermé.

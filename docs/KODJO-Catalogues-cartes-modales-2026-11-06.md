# KODJO — Catalogues, cartes et validation des modales — 5 et 6 novembre 2026

**Nature :** spécification active. Elle complète la référence Formats (`KODJO-Formats-entrainement-2026-11-02.md`), la spécification des cartes et du catalogue des séances (`KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md`), les zones de contexte des catalogues (`KODJO-Zones-contexte-catalogues-PRE9-2026-10-30.md`) et les contrats CE-CAT-CTX-01, CE-T03-01, CE-MVT-03 et CE-FMT-01 à CE-FMT-05. Elle remplace leurs prescriptions contraires dans les seuls périmètres ci-dessous.
**Décisions :** Hermann, 5 novembre 2026 (§1, §2) et 6 novembre 2026 (§3 à §9). Registre : D-499 à D-509.
**Figma :** fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP » `510:101` ; planche DSF « DSF V2 / Catalogues — couleurs, onglet, cartes et validation des modales — 6 novembre 2026 » `11734:2100` (page « Design system — Fondations »).

## 1. Validation des modales par la coche de l'en-tête (D-499)

**D-499 — précision validée par Hermann le 06/11/2026 :** « Valider les paramètres » apparaît uniquement lorsqu’une seconde étape est nécessaire et ouvre le récapitulatif sans enregistrer dans la séance. Dans ce cas, la coche du questionnaire reste grise et inactive. Sans seconde étape, la coche enregistre dans la séance lorsque les données sont complètes et cohérentes. Dans le récapitulatif, elle devient bleue et active lorsque les données sont complètes et cohérentes, puis enregistre dans la séance. Death by à un mouvement : questionnaire → coche → Composition, sans récapitulatif ; à deux mouvements : questionnaire → « Valider les paramètres » → récapitulatif → coche → Composition. L’enregistrement reste un ajout au brouillon de Composition, sans sauvegarde définitive de la Séance. Cette précision supersède la suppression générale du bouton dans les questionnaires ; les autres validations par coche restent applicables.

Une modale qui crée ou modifie se valide par la **coche** de son en-tête, à droite, en face de la croix (ou de la flèche Retour) à gauche. Elle n'a pas de bouton d’enregistrement en bas ; la place libérée revient au contenu. Le bouton de transition « Valider les paramètres » est conservé dans les questionnaires nécessitant une seconde étape, selon la précision ci-dessus.

| Modale | Action portée par la coche | Ancien bouton |
|---|---|---|
| Questionnaire d'un Format | Sans seconde étape : enregistre dans la séance si les données sont complètes et cohérentes. Avec seconde étape : reste grise et inactive. | « Valider les paramètres » conservé uniquement si une seconde étape est nécessaire ; ouvre le récapitulatif |
| Récapitulatif d'un Format | Enregistre dans la Séance ; à la réouverture depuis la Composition, enregistre les modifications | « Enregistrer dans la séance », « Enregistrer les modifications » |
| Choix des mouvements d'un Format (y compris le choix du buy-in) | Revient au questionnaire avec la sélection ; grise tant qu’aucun mouvement n’est sélectionné | « Enregistrer dans la séance » |
| Catalogue des séances ouvert depuis la planification (une ou plusieurs séances) | Valide la sélection | « Valider » |
| Planifier une séance, Planifier un parcours (écran et modale du Calendrier) | Enregistre la planification ; la phrase de synthèse descend en bas de l'écran | « Enregistrer » |
| Fréquence d'un contenu de parcours | Valide la fréquence ; croix et coche dans l'en-tête | « Valider » |

- **États :** coche bleue (`color/wheel-action/confirm-background`, bleu KODJO) quand la validation est possible ; coche grise quand un paramètre requis manque ou est incohérent. Les règles de complétude et de cohérence restent applicables. Si un récapitulatif est nécessaire, la coche du questionnaire demeure grise, même si les réponses permettent d’accéder au récapitulatif. Les conditions existantes de passage par « Valider les paramètres » sont conservées (notamment deux mouvements requis à la création d’un Superset) ; le contrôle bloquant de l’EMOM reste applicable.
- **Écrans Figma :** questionnaires vides des dix Formats et « AMRAP — Questionnaire, plusieurs blocs » : coche grise. « EMOM — Questionnaire, un mouvement » `11753:21642`, « P-Tabata — Questionnaire, deux mouvements » `11753:21977`, « Superset — Questionnaire, deux mouvements » `11753:22133` : bouton « Valider les paramètres », coche grise. « P-Tabata — Questionnaire, un mouvement » `11753:21837` et « Death by — Questionnaire, un mouvement » `8624:30602` : coche bleue, sans récapitulatif.
- **Composants :** en-tête de modale existant à croix et coche (variante « Roulette » de « En-tête modal — Paramètres d'exécution ») ; coche « DSF / Actions / Fermer et valider », variante **« Désactivé »** `11756:2172` (fond `color/disabled`) ; en-tête fixe « DSF / Navigation / En-tête fixe », variante **« Fermer et valider »** ajoutée pour les écrans de planification.
- **Exceptions, bouton large conservé :** pendant et juste après l'effort, la cible doit rester grande et sous le pouce : « Résultat de série », « Répétitions partielles », « Avant la séance — Douleur » (Commencer), synthèses de séance et d'exécution. « Modifier le profil » est un écran avec Retour, pas une modale : inchangé.
- Toute mention des libellés remplacés dans les documents désigne désormais l'action de la coche, sauf « Valider les paramètres », bouton de transition conservé lorsqu’une seconde étape est nécessaire.

## 2. Ajout d'un mouvement dans un questionnaire de Format (D-500)

« + Ajouter » ouvre **directement le mode catalogue** : champ de recherche actif, clavier ouvert, résultats sous le champ, filtres, tri et piles à côté du champ. L'étape intermédiaire de saisie avec suggestions et le lien « Ouvrir / Fermer le mode catalogue » sont retirés. La fiche de création d'un exercice (Exercice libre) garde ses suggestions pendant la saisie du nom : ce champ nomme aussi un nouveau mouvement.

Écrans supprimés : « Tabata — Questionnaire, saisie d'un mouvement » `11335:20151`, « AMRAP — Questionnaire, saisie d'un mouvement » `11335:19986`. Lien retiré de `8598:29503`, `11220:19121`, `11220:19397`.

## 3. Couleurs des catalogues (D-501)

Chaque catalogue a une **zone de contexte** et un **fond d'écran** propres, de même clarté, dont la teinte glisse le long du bleu KODJO. Pas de couleurs vives : elles entreraient en conflit avec les couleurs des formats, des statuts et des étiquettes.

| Catalogue | Zone de contexte et onglet sélectionné | Fond d'écran |
|---|---|---|
| Mouvements | `color/catalogue/mouvements/context` → `color/blue/sky-context-E5F0FF` (#E5F0FF) | `color/catalogue/mouvements/background` → `color/blue/sky-background-F7FAFF` (#F7FAFF) |
| Séances | `color/catalogue/seances/context` → `color/blue/context-EAEAFF` (#EAEAFF) | `color/catalogue/seances/background` → `color/blue/background-tint-F8F8FF` (#F8F8FF) |
| Programmes | `color/catalogue/programmes/context` → `color/blue/violet-context-EFE8FF` (#EFE8FF) | `color/catalogue/programmes/background` → `color/blue/violet-background-FAF8FF` (#FAF8FF) |

Variables d'usage dans la collection « KODJO / Sémantiques », couleurs de base dans « KODJO / Primitives ». Le fond d'écran, la barre d'état, l'en-tête fixe et le fondu au-dessus de la navigation utilisent `background`. La zone de contexte est opaque (`context`) jusqu'à 80 % de sa hauteur, puis passe en fondu vers `background` ; elle est placée au-dessus de l'en-tête fixe pour former une seule surface avec l'onglet sélectionné. Une variable de couleur Figma étant opaque, le point transparent du fondu au-dessus de la navigation garde une valeur fixe.

Cartes sur ces fonds : fond **blanc**, liseré existant à **50 %** d'opacité, ombre existante (0 / 2 / 10, 8 %).

La Composition, la fiche Mouvement et les autres écrans à zone de contexte ne sont pas modifiés par ce paragraphe (§9).

## 4. Onglets et zone de contexte des catalogues (D-502, D-503)

- **Onglets Mouvements / Séances / Programmes :** trois emplacements fixes d'un tiers de (402 − 2 × 16) pt, texte centré ; le gras ne déplace plus rien d'un écran à l'autre. Les barres verticales sont supprimées.
- **Onglet sélectionné :** forme posée sur la zone de contexte, de sa couleur (`context` du catalogue) ; coins hauts arrondis à 12, bas évasés en courbe inversée de rayon 10 jusqu'à la zone de contexte, sans raccord. Libellé **Bold**, `color/text-primary`. Onglets non sélectionnés : Regular, `color/text-secondary`. Plus de bleu sur le libellé.
- **Hauteur de la zone de contexte inchangée** (115 pt, `y=92..207`) : elle reste commune avec la Composition et la fiche Mouvement.
- **Première ligne** (« N familles · N mouvements », « Un exercice N · Plusieurs N », « N résultats » à droite) : séparateur **point médian** pour les deux catalogues, 8 pt de part et d'autre (remplace « | » des Séances). Écart entre cette ligne et la rangée de boutons égal à l'écart entre les boutons et la fin perçue de la zone (milieu du fondu), soit 16 pt.
- **Deuxième ligne :** champ Rechercher de **34 pt** de haut, comme les boutons Filtre, Tri et Créer (34 pt), centré sur leur ligne ; rangée centrée entre la première ligne et le bas de la zone de contexte (22 pt de part et d'autre de la cible de 44 pt). Cible tactile du champ : 44 pt, sans changer son dessin.

## 5. Carte Séance (D-504, D-505, D-506)

Composant « DSF / Cards / Séance », variantes Catalogue repliée, archivée et dépliée.

| Élément | Règle |
|---|---|
| Hauteur | 72 pt (repliée et archivée) ; en-tête de 72 pt dans la dépliée |
| Photo | 64 pt, à 4 pt du bord gauche, haut et bas ; rayon 8 (concentrique : 12 − 4) |
| Colonne des symboles | à 8 pt de la photo ; symboles centrés dans 10 pt (chevron, catégorie, haltère 12 × 10) ; textes alignés sur une même verticale |
| Texte | à 8 pt du haut et du bas ; nom tronqué (« … ») avant la durée |
| Chevron | à gauche du nom, sur **toutes** les cartes ; → quand la carte est repliée, ↓ quand elle est dépliée ; zone de toucher : chevron et toute la zone centrale, hors photo et Démarrer ; cible minimale 44 pt |
| Durée | en haut à droite, à 12 pt du bord, sans sablier, alignée sur la ligne de base du nom |
| Ligne 3 | « N circuits · N exercices » ; le nombre de circuits est omis si la Séance n'a aucun circuit, ou un seul circuit joué une seule fois ; une Séance d'un seul exercice affiche « 1 exercice » |
| Démarrer | pilule de 24 pt en bas à droite (12 pt du bord droit, 8 pt du bas) ; fond = `background` du catalogue ; texte « Démarrer » 12 pt Medium, bleu KODJO ; sans liseré ; ombre 0 / 2 / 4, noir 14 % (ombre des actions contextuelles) ; cible 44 pt |
| Surface | fond blanc ; liseré à 50 % |
| Archivée | même format, sans Démarrer |

- **Modales de planification** (« Choisir une séance », « Sélectionner une séance », « Sélectionner plusieurs séances ») : la carte n'affiche pas Démarrer.
- **Interactions — précision de Hermann du 06/11/2026 (D-504) :** Dans le catalogue des séances : toucher la photo ouvre la composition de séance en modification ; Démarrer exécute la séance ; le chevron et toute la zone centrale de la carte déploient/replient la séance ; toucher toute la zone déployée ouvre la séance en modification. Ces cibles sont distinctes.
- **Actions glissées** : hauteur 72 pt, alignées sur la carte.
- **Remplace :** action lecture ronde à droite, sablier, chevron seulement pour plusieurs exercices, « jamais 1 exercice », format ou volume en ligne 3, carte de 80 pt, visuel à 8 pt du bord.

## 6. Carte Séance dépliée (D-507)

- Ligne de **cycle** : « Cycle » à gauche, « **N passages** » aligné à droite dans la colonne des volumes.
- Ligne de **circuit** : « Circuit · **séries groupées** » ou « Circuit · **séries alternées** » à gauche, « **N tours** » aligné à droite.
- Volumes des exercices écrits comme dans la Composition : « 3 × 12 rép. », « 2 × 45 s ».
- Indentation de 16 pt par niveau et filets verticaux inchangés ; une Séance peut contenir plusieurs cycles (écran d'essai « P-Catalogue des séances — Séance déployée — Essai cycles » `11727:467`).
- **Remplace :** « Cycle · N répétitions », « Circuit · N tours » sans mode, « reps ».

## 7. Carte Mouvement et piles (D-508)

Composant « Carte — Mouvement » (`10124:21979`), variantes sans sélection, vide et cochée.

- 72 pt ; photo 64 à 4 pt du bord, rayon 8 ; fond blanc ; liseré à 50 %.
- Nom et description à 8 pt de la photo ; nom à 8 pt du haut.
- Niveau à 12 pt du bord droit (en mode sélection : 12 pt avant la case, centrée verticalement), aligné sur la ligne de base du nom.
- **Feuilles de pile :** 72 pt, blanches, liseré 0,5 pt à 50 %, **même ombre que la carte** : chaque couche ombre la suivante et les bandes visibles sont identiques.
- Cartes réempilées en gardant leurs écarts ; actions glissées et commandes « Plus facile / Plus difficile » alignées sur les nouvelles hauteurs.

## 8. Écart du code à corriger (D-509)

Le bandeau de contexte commun du code (`ScreenShell.ContextBand`) utilise `colors.selectionSurface` (#E5F0FF), couleur prévue pour un élément sélectionné, alors que le chapitre 06 fixait `#EAEAFF`. La couleur de la zone de contexte et du fond devient celle du catalogue (§3) : le code doit introduire des jetons par catalogue et ne plus réutiliser `selectionSurface` pour la zone de contexte. Classe A (conformité) pour l'écart historique, classe B pour les nouvelles couleurs.

## 9. Hors périmètre et points ouverts

- **Catalogue des programmes :** aucun écran dans le prototype ; ses variables sont prêtes.
- **Zone de contexte de la Composition, de la fiche Mouvement et des écrans d'exercice :** couleur non modifiée ; rattachement à une teinte de catalogue à décider.
- **Cartes de séance des contextes Calendrier, Suivi, Choix multiple :** non migrées au nouveau format.
- **AMRAP :** proposition non arbitrée (au moins un exercice de la boucle en Répétitions ; Max seulement en Répétitions). Aucune règle n'est modifiée par ce document.
- **Zones de toucher :** le champ Rechercher (34 pt), Démarrer (24 pt) et le chevron (10 pt) gardent une cible de 44 pt dans le code.

- **Titre des modales de planification :** aligné à gauche après la croix sur les écrans en pleine page (« Planifier une séance », « Planifier un parcours », variante « Fermer et valider ») et centré dans la modale ouverte depuis le Calendrier (`1992:5794`, `7594:34653`). Écart antérieur à ce lot, non corrigé ; à harmoniser lors de la revue des modales.

## 10. Écrans Figma concernés

Catalogue des séances : `1992:9910`, `1992:10014`, `1992:10518`, `1992:10628`, `1992:10848`, `1992:10937`, `2117:86`, `2234:88`, `2234:189`, `4168:11149`, `4549:6742`, `4592:6217`, `4593:6285`. Catalogue des mouvements : `4521:6220`, `10266:20575`, `10462:23370`, `10465:23141`, `10471:23291`, `10475:47634`, `10480:23374`, `10484:23428`, `10495:24054`, `10495:24099`, `10496:23705`, `10500:23772`, `10579:21580`, `10797:20492`. Planification : `1992:6249`, `7599:14197`, `7594:34809`, `1992:6838`, `1992:6622`, `1992:7187`, `1992:7369`, `1992:7537`, `1992:7716`, `7594:34531`, `7594:34653`, `1992:5794`. Formats (coche, mode catalogue) : questionnaires, récapitulatifs et choix des mouvements des dix Formats (voir référence Formats §7).

Composants modifiés : « DSF / Cards / Séance » (`6214:3572`, `6214:3625`, `6214:3696`), « Carte — Mouvement » (`10124:21979`), « DSF / Navigation / En-tête fixe » (`5544:4504`, variante `11626:23875`).

Planche DSF : « DSF V2 / Catalogues — couleurs, onglet, cartes et validation des modales — 6 novembre 2026 » `11734:2100` (page « Design system — Fondations »). Écran d’essai : « P-Catalogue des séances — Séance déployée — Essai cycles » `11727:467`.

Captures : chapitre 06, section « Captures du 6 novembre 2026 » ; fichiers dans `docs/Specifications-fonctionnelles/images/catalogues-2026-11-06/`.

## 11. Composition — carte d'exercice, en-tête de circuit, placement

Décisions de Hermann du 06/11/2026, classe B : D-511 à D-513. Elles remplacent les prescriptions antérieures contraires dans la Composition uniquement.

### Carte d'exercice — D-511

- Carte : hauteur 72 pt, fond blanc, liseré 0,5 pt à 50 % utilisant la variable des cartes de séance, rayon 12. Largeur de référence 362 pt ; adaptation au terminal selon le contrat existant.
- Photo : 64 × 64 pt, à 4 pt du bord, rayon 8. Pictogramme noir hors circuit et gris dans un circuit.
- Ligne 1 : nom Semi Bold 15, à 8 pt de la photo et du haut, tronqué avant la valeur de droite ; niveau Medium 12, text-primary, à 12 pt du bord droit, aligné sur la ligne de base du nom. Sans niveau, aucun contenu à droite.
- Ligne 2 : catégorie ; à droite, prescription Semi Bold 12, text-primary (« 50 rép. », « 10 · 12 · … rép. », « 3 × 1 min 30 », « max », « 45 s »). L’icône de changement de côté précède immédiatement la prescription. Aucun chronomètre devant la valeur. D-515 (07/11/2026) : la prescription seule occupe cette valeur. « À l’échec » s’affiche sans durée. Les estimations ≥ ou ≈ sont réservées aux en-têtes de Circuit, de Cycle et de Séance.
- Ligne 3 : zones corporelles ; à droite, rôle « Buy-in » ou « Buy-out » lorsqu’il existe, et récupération lorsqu’elle existe : sablier suivi de sa durée en text-secondary, Regular 12. Sans récupération, ni sablier ni valeur.
- Grille verticale : lignes à 8, 30 et 48 pt du haut ; icônes des lignes 2 et 3 centrées dans une colonne de 10 pt, textes alignés après cette colonne.
- Aucun chevron sur la carte d’exercice : elle ne se déplie pas.
- Rail au centre de la photo ; écarts entre cartes et fond des circuits resserrés conformément à l’écran de référence, sans inventer de nouvelle cote non spécifiée.
- Les niveaux « Niveau 3 », « Niveau 2 » et les 30 s de récupération d’« Étirement du quadriceps » sont des exemples, jamais des valeurs imposées.

### En-tête de circuit — D-512

Le chevron de repli se place immédiatement après le rond du rail et devant le nom, avec le même écart que sur la carte Séance du catalogue. Le bloc « N bloc · nature » ne bouge pas. Seul le Circuit se replie ; le Cycle ne se replie pas.

**Déploiement Figma partiel :** disposition appliquée sur `11789:21914` uniquement selon l’état communiqué par Hermann. Le contrôle direct confirme le chevron avant le nom sur cet écran et encore après le nom sur `8328:29270`. Ne pas déclarer les autres en-têtes migrés.

### Placement — D-513

Seul le Point d’arrêt se pose. La récupération ne se pose plus ; sa saisie reste dans les paramètres d’exécution de l’Exercice. Le cadre « Récupération » en pointillés est retiré de la carte et du composant. Le mode conserve les règles métier existantes des emplacements autorisés et de validation des Points d’arrêt.

Écran `8328:29270` : « P-Composition séance — Placement d'un point d'arrêt ». Bandeau : « Confirmer N points d'arrêt ajoutés », N étant le nombre de points ajoutés. Remplace « Placement d’une pause », la pose/emplacement de récupération et « Confirmer N pauses ajoutées ».

### Références et état des preuves

- Écran de référence : « P-AMRAP — Séance, circuit avec buy-in — Cartes au format catalogue » `11789:21914`.
- Composant : « DSF / Cards / Exercice — Composition » `11810:2159`, page « Design system — Fondations » ; variantes « Hors circuit » `11810:2102`, « Dans un circuit » `11810:2132`. Dimensions 362 × 72 confirmées par lecture directe des métadonnées.
- Déploiement annoncé par Hermann : 120 instances sur 37 écrans, aucune carte manuelle restante. Ce décompte n’a pas été recompté dans cette passe ; les deux écrans de référence ont été contrôlés directement. Aucune conformité du code n’est déclarée.

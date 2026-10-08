# PRE-3 — Périmètre détaillé et matrice de couverture

Date : 8 octobre 2026. Version de préparation : 4 — rapprochement avec main et Figma actuels, import de médias inclus.
**Objet : traduire le périmètre validé par Hermann en une définition exploitable pour la planification.**
Ce document n’est ni un plan technique approuvé, ni une autorisation de développement.

## 1. Résultat attendu

Créer, modifier, enregistrer et rouvrir un Exercice avec les nouveaux paramètres d’exécution, depuis le Catalogue et depuis la Composition d’une Séance. Les champs nécessaires et leur interface sont livrés ensemble.

La tranche comprend l’éditeur d’Exercice, sa feuille Paramètres, les sélecteurs Catégorie/Zones qu’il ouvre, les brouillons, la persistance, les calculs et les résumés associés. Elle préserve la distinction entre une définition du Catalogue et sa copie dans une Séance.

L’interface des surfaces listées ici fait partie du résultat. Une validation purement fonctionnelle avec report global des écarts Figma n’est pas l’objectif de PRE-3.

## 2. Références et préséance

Référence Git vérifiée : MyUncried/Application-Routine, commit `17d9774a31429bc2bee4eb834e4ed1e9aafa68ec`.
Référence Figma consultée : fichier Application-Routine, page Prototype MVP. Figma reste modifiable : ses propriétés devront être figées dans le dossier de préparation du plan.

Ordre d’autorité :
1. Décisions explicites du propriétaire et spécifications normatives courantes pour comportements, validations, données et calculs.
2. Figma courant pour composants, géométrie, disposition, typographie, couleurs et effets.
3. Captures documentaires comme références visuelles datées.
4. Anciens briefs, copies et versions remplacées : provenance historique seulement.

Les exemples numériques et couleurs de données dans Figma ne deviennent pas des règles métier. Les 276 cas v15 servent de référence rédactionnelle ; leurs montants ne remplacent pas le calcul métier.

**Amendement explicite du 08/10 :** Hermann inclut l’import de médias au MVP, avant le moteur d’exécution. Cette décision remplace l’exclusion écrite dans CE-T03-04 §2 (« Ajout/import média toujours hors périmètre MVP. ») et §19 (« aucun import média ajouté »). La PR de préparation propose l’amendement correspondant de CE-T03-04 et des documents transverses, avec la décision D-333 ; ces modifications ne sont pas encore fusionnées. D-327 désigne désormais la grille DSF générale dans main : seul l’identifiant de la décision médias de l’ancienne préparation a été réconcilié, sans changer la décision propriétaire. Le plan doit reprendre les règles médias déjà documentées et identifier précisément les formats, sources d’import, ordre, suppression et conservation ; aucune règle manquante ne sera inventée.

Sources épinglées :

| Source | Blob Git | Lien |
|---|---|---|
| 04 – Modèle fonctionnel.md | `d97b7f0e7a7fc836da73d4e816b4873a00ddb496` | [Lire](https://github.com/MyUncried/Application-Routine/blob/17d9774a31429bc2bee4eb834e4ed1e9aafa68ec/docs/Specifications-fonctionnelles/04%20%E2%80%93%20Mod%C3%A8le%20fonctionnel.md) |
| 06 – Ecrans et navigation de la V1.md | `899d88aeae3ff65c390cb3e2412ebb7be2dbb561` | [Lire](https://github.com/MyUncried/Application-Routine/blob/17d9774a31429bc2bee4eb834e4ed1e9aafa68ec/docs/Specifications-fonctionnelles/06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md) |
| 08 – Conception fonctionnelle détaillée.md | `3a05413b3d17d3b618513e66004e1df0aa5c6a09` | [Lire](https://github.com/MyUncried/Application-Routine/blob/17d9774a31429bc2bee4eb834e4ed1e9aafa68ec/docs/Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md) |
| 09 – Modèle de données fonctionnel.md | `cb9344029830f32d1d0b32521fab8a7843f88174` | [Lire](https://github.com/MyUncried/Application-Routine/blob/17d9774a31429bc2bee4eb834e4ed1e9aafa68ec/docs/Specifications-fonctionnelles/09%20%E2%80%93%20Mod%C3%A8le%20de%20donn%C3%A9es%20fonctionnel.md) |
| 13 – Contrats d’écran.md | `b0caf784f1cea6dc2a5b9e5171f2efea955cc1b6` | [Lire](https://github.com/MyUncried/Application-Routine/blob/17d9774a31429bc2bee4eb834e4ed1e9aafa68ec/docs/Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md) |
| SPECIFICATION-PARAMETRES-MODALE-v13.md | `f28d3f9b4f44c0db262f2c9e9f58d474f334959d` | [Lire](https://github.com/MyUncried/Application-Routine/blob/17d9774a31429bc2bee4eb834e4ed1e9aafa68ec/docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v13.md) |
| SPECIFICATION-BIP-CADENCE-v2.md | `47c98cc75728527a4ad19235420138951971ba32` | [Lire](https://github.com/MyUncried/Application-Routine/blob/17d9774a31429bc2bee4eb834e4ed1e9aafa68ec/docs/Specifications-fonctionnelles/SPECIFICATION-BIP-CADENCE-v2.md) |
| SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md | `991575b002f5ae23965da636fdcbc2243209e25f` | [Lire](https://github.com/MyUncried/Application-Routine/blob/17d9774a31429bc2bee4eb834e4ed1e9aafa68ec/docs/Specifications-fonctionnelles/SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md) |
| SPECIFICATION-PAUSES-SYMBOLES-2026-10-07.md | `e9531523d366008dc86ce18b5c224490cc3c3c8d` | [Lire](https://github.com/MyUncried/Application-Routine/blob/17d9774a31429bc2bee4eb834e4ed1e9aafa68ec/docs/Specifications-fonctionnelles/SPECIFICATION-PAUSES-SYMBOLES-2026-10-07.md) |
| DSF-BIP-CADENCE-2026-10-07.md | `e77523d4f6d3e81e698e5cd746c5ea5acdde7c81` | [Lire](https://github.com/MyUncried/Application-Routine/blob/17d9774a31429bc2bee4eb834e4ed1e9aafa68ec/docs/DSF-BIP-CADENCE-2026-10-07.md) |
| phrases-276.json | `17e61b1466837ff996c3c86ec5a05089dcec8fdf` | [Lire](https://github.com/MyUncried/Application-Routine/blob/17d9774a31429bc2bee4eb834e4ed1e9aafa68ec/docs/archives/evolutions-v15-2026-10-07/phrases-276.json) |

Contrats hôtes : **CE-T03-04** (éditeur), **CE-UI-10** (Paramètres), **CE-UI-09** (Catégorie et Zones). Contrats Catalogue/Composition : intégration des données et régression, sans refonte générale de leur présentation.

## 3. Inclus et exclus

| Domaine | PRE-3 livre | Limite explicite |
|---|---|---|
| Éditeur | Création/modification, nom, description, Catégorie, Zones, carte Paramètres, actions et navigation | Même couverture des paramètres depuis Catalogue et copie de Séance |
| Paramètres | Trois modes, Séries uniformes/variables, cibles, pauses, directions, ordre des côtés, bip, compte à rebours, fin | Aucun champ de charge/RPE/intensité ajouté |
| Calcul | Durée intrinsèque, durée d’occurrence, résultat typé, inversion Durée uniforme | Aucun temps réalisé historique réécrit |
| Résumé | Générateur de segments, phrase complète de l’éditeur et adaptation minimale des consommateurs | Refonte générale des cartes du Catalogue reportée à PRE-5 |
| Persistance | Modèle, migration nécessaire, repositories, services, copies/duplication, compatibilité des instantanés | Numéro et structure de migration déterminés sur la vraie baseline du développement |
| Référentiels | Présentation Figma des sélecteurs et formulaires ouverts depuis l’éditeur ; comportement existant conservé | Pas de refonte d’Étiquette ni du Profil |
| Médias | Import/ajout depuis l’éditeur, association à l’Exercice, conservation et réouverture ; paramètres nécessaires aux écrans d’exécution | Inclus au MVP et livré avant le moteur d’exécution ; aucun moteur de lecture en exécution anticipé |
| Bip | Champ commun, persistance, copies et utilisation pour l’estimation | **Émission sonore et cycle réel pendant l’exécution reportés aux tranches EXE** |
| Séance | Entrées/sorties de l’éditeur, conservation de la copie, calculateur partagé | Refonte de Composition et placement des Récupérations/Points d’arrêt : PRE-4 |
| Profil | Lecture des défauts existants pour créer les nouveaux paramètres | Stepper du Profil et refonte du Profil exclus |
| Catalogue | Exercice nouvellement sauvegardé visible et rouvrable | Sélecteur à deux options exclu ; évolution distincte |
| Protocole | Préparation d’un dossier utilisable par VNext | Aucun correctif VNext implicitement inclus |

## 4. Champs et règles fermées

| Champ | Règle |
|---|---|
| Mode | Durée / Répétitions / À l’échec ; un seul mode actif |
| Séries | 1..99 ; nombre **par côté**, défaut 1 |
| Séries variables | État explicite ; jamais déduit de l’égalité des valeurs |
| Cible Durée | 1..5999 s par Série |
| Cible Répétitions | 1..100 par Série |
| À l’échec | Aucune cible numérique ; les Pauses peuvent varier |
| Pause après chaque série | 0..300 s ; défaut 0 ; dernière Série comprise |
| Changement de côté | Sans changement / droite puis gauche / gauche puis droite |
| Ordre des côtés | Un côté après l’autre / Les deux côtés à chaque série ; bilatéral uniquement |
| Pause entre les côtés | 0..300 s ; initialisée depuis le Profil lors de l’activation du changement de côté ; défaut Profil 10 s |
| Bip de cadence | Entier 0..10 s ; 0 = Aucun ; défaut 0 ; présent dans les trois modes, commun à toutes les Séries |
| Compte à rebours d’Exercice | 0..60 s ; défaut copié du Profil (initialement 10 s) |
| Fin d’Exercice | 0..60 s ; défaut copié du Profil (initialement 5 s) |

Une modification ultérieure du Profil ne réécrit pas les objets existants.
L’ancienne hypothèse de **2 s par répétition** n’est plus la règle courante : le calcul utilise le bip positif ; sans bip, la durée d’Exercice est omise.

La Récupération de Séance est distincte des Pauses de Série et des Pauses entre les côtés. La spécification du 07/10 déplace son défaut Profil vers son **ajout explicite** : une nouvelle occurrence ne crée pas automatiquement de récupération. PRE-3 respecte cette règle dans son parcours de création de copie ; le parcours de placement complet reste PRE-4. Les récupérations déjà présentes ne sont pas effacées.

## 5. Brouillons, transitions et sauvegarde

- Ouvrir Paramètres copie le brouillon parent. ✕ ou retour système annule toute cette ouverture. ✓ applique atomiquement les paramètres valides au parent. **Terminer seul persiste l’Exercice.**
- Activer variable copie cible/Pause uniformes dans les lignes. Revenir en uniforme reprend la première ligne dans l’ordre courant. Réactiver avant ✓ restaure le tableau temporaire.
- Réduire N retire les dernières lignes ; remonter N avant ✓ les restaure dans leur ordre relatif, puis copie la dernière ligne active pour les nouvelles lignes supplémentaires.
- Déplacer une ligne déplace ses paramètres ensemble, renumérote et recalcule la nouvelle dernière Pause. ✕ annule également les déplacements.
- Changer de mode conserve N, les Pauses et le bip. Les cibles incompatibles deviennent non renseignées, jamais zéro ; retour au mode précédent avant ✓ restaure ses cibles.
- **N=1 normalise immédiatement l’état effectif uniforme et l’ordre Un côté après l’autre**, y compris dans le calcul du brouillon. Les contrôles sans effet sont grisés. Remonter N avant ✓ restaure les états temporaires ; sauvegarder à N=1 ne les conserve pas.
- Replier le tableau ne change ni données ni validité. Une Série incomplète empêche ✓ avec un message identifiant la Série.
- Nom, une Catégorie et au moins une Zone sont requis pour un nouvel Exercice. Les affectations retirées d’un référentiel restent conservées sur les objets existants selon les règles déjà validées.
- **Nom vide dans un formulaire de création de référentiel : Ajouter inactif, sans message d’erreur**, conformément à la décision explicite de Hermann. Ne pas réintroduire l’ancien attendu de message.
- Abandon du parent : garde existante, Annuler conserve le brouillon, confirmer abandonne. Erreur d’écriture conserve le brouillon ; aucun enregistrement partiel ou doublon.

## 6. Calculs et preuves numériques

N = Séries par côté ; Ti = travail calculable ; Pi = Pause après Série ; PC = Pause entre côtés ; R = récupération explicite suivant l’occurrence.

| Configuration | Total intrinsèque T |
|---|---|
| Sans changement de côté | Σ(Ti + Pi) |
| Un côté après l’autre | 2 × Σ(Ti + Pi) + PC |
| Les deux côtés à chaque série, N ≥ 2 | 2 × ΣTi + ΣPi + N × PC |

Durée : Ti = durée prescrite. Répétitions avec bip b > 0 : Ti = Ri × b.
Occurrence avec R > 0 : To = T − PN + R ; R absente ou zéro : To = T. Seule la toute dernière Pause est remplacée ; la récupération n’est jamais ajoutée deux fois.

Compte à rebours et Fin sont exclus du total intrinsèque, intégrés une seule fois au plan complet applicable. Pour une Séance avec travail inconnu, les contributions chronométrées connues restent calculées ; aucun temps de travail arbitraire n’est inventé.

| Mode | Rendu dans l’éditeur |
|---|---|
| Durée, bip nul ou positif | Durée exacte, sans symbole |
| Répétitions, bip positif | Durée estimée, ≈ |
| Répétitions, bip nul | Aucune ligne, valeur, zéro, tiret ou ≥ |
| À l’échec, bip nul ou positif | Aucune ligne, valeur, zéro, tiret ou ≥ |

À la Séance : exact / ≈ / ≥ selon l’absence d’estimation et de travail inconnu. Une cible invalide est une erreur de validation, distincte d’une durée omise.

Inversion : **Durée uniforme seulement** ; rechercher N réalisable dans 1..99, total le plus proche, égalité vers le N le plus grand. N=1 utilise toujours son ordre normalisé. Message d’ajustement uniquement lorsque le total réalisé diffère du total demandé.

| Cas de référence | Attendu |
|---|---|
| Durées 30/45/60 s ; Pauses 10/20/30 s ; unilatéral | 195 s |
| Même cas ; R = 120 s | 285 s |
| Même cas ; deux côtés successifs ; PC = 15 s | 405 s |
| Même cas ; côtés par Série ; PC = 15 s | 375 s |
| Répétitions 12/10/8 ; bip 0 ; Pauses 30/45/60 s | Durée d’Exercice omise ; 135 s de pauses connues |
| À l’échec ; bip 0 puis 4 s | Durée omise dans les deux cas |
| 4 Séries de 15 répétitions ; bip 4 s ; Pause 15 s | ≈ 300 s |
| 4 Séries de 60 s ; bip 4 s ; Pause 15 s | 300 s exact |
| Une Série bilatérale de 90 s ; Pause 15 s ; PC 10 s | 220 s ; avec R 30 s : 235 s |

## 7. Phrase des paramètres

Fonction pure produisant des segments ordonnés `{texte, gras}`. Les valeurs et unités prévues sont en gras ; aucune recherche/remplacement a posteriori ni interprétation Markdown.

- Aucun texte de phrase ou segment persisté : génération depuis les paramètres à chaque affichage, notamment après ✓.
- Corpus **276 cas v15** ; les montants sont injectés depuis un calcul métier indépendant du classeur.
- Jusqu’à trois cibles variables : énumération ; au-delà : min/max. La phrase des variables omet les pauses conformément au corpus, sans les supprimer des données ou du calcul.
- En mode Durée, le total de la phrase est omis uniquement pour une seule Série unilatérale sans pause ; une pause positive rend le total non redondant, même à N=1. Le calcul reste exact et la carte Catalogue conserve sa durée.
- Terminologie « pause après chaque série », y compris N=1. Les clauses de bip de la phrase suivent le corpus ; le champ reste pourtant présent dans les trois modes.
- Zone entière ouvrant Paramètres ; aucun chiffre de la phrase ne devient un contrôle autonome.
- Texte long intégral, hauteur intrinsèque, aucun plafonnement ni troncature. Français MVP ; aucun nouveau moteur de traduction.

## 8. Attendus visuels et extraction obligatoire

Surfaces à rendre conformes : éditeur Créer/Modifier, carte Paramètres, feuille Paramètres et tous ses états utiles, roulettes/segmentés intégrés, sélecteurs Catégorie/Zones, création/modification de leurs valeurs, dialogues ouverts dans ce parcours.

Pour **chaque élément visible** du périmètre, le plan doit disposer d’une ligne identifiable : écran/état, élément, composant maître et variante, token, géométrie/alignement/espacement, typographie, couleurs, bordures/rayons/effets, comportement adaptatif, source Figma et preuve de contrôle. Une mention générique « conforme Figma » ne remplace pas ces propriétés.

Exemples vérifiés directement :
- Feuille Zones : en-tête ✕ / titre / ✓, séparation, options textuelles en pastilles et action Créer une zone ; **pas de silhouette répétée dans chaque option**. La silhouette du Profil concerne le contrôle d’accès selon sa variante.
- Feuille Paramètres : steppers en place, Bip au premier niveau immédiatement avant le total applicable ; total absent → avant Compte à rebours. Voile #1F2129 à 34 %.
- À la largeur de référence 402 : Bip x36, séparateur 330 ; groupes indentés x52, séparateur 314. Traduire ces relations sur 360/440, sans figer tout l’écran en coordonnées absolues.
- Phrase : Inter 13, interligne 20, valeurs Semi Bold ; référence longue 224 caractères, cinq lignes à largeur 324. La carte suit son contenu.
- En-tête maintenu accessible, corps défilant, Safe Areas, clavier et texte agrandi. La barre d’état dessinée dans Figma est un décor système, pas une nouvelle barre à coder.
- Steppers : tap au pas 1 ; maintien à partir d’environ 500 ms ; accélération 1/5/10 aux seuils prescrits pour les champs concernés ; Bip/Compte à rebours/Fin restent au pas 1 ; arrêt immédiat au relâchement sans second tap.
- Réutiliser composants/tokens existants, vérifier leurs variantes et consommateurs. L’existence d’un composant partagé ne prouve pas sa fidélité au maître Figma.

La comparaison visuelle est réalisée par le développeur sur les surfaces livrées avant la recette de Hermann. Chaque écart restant doit être nommé. La recette iPhone porte ensuite sur une liste bornée de points, pas sur une affirmation de fidélité de toute l’application.

## 9. Inventaire Figma fermé

Les noms ci-dessous sont ceux des frames, conservés pour les retrouver. Plusieurs frames représentent des états du même écran.

| Frame | Référence |
|---|---|
| Création activité — Avant Paramètres d’exécution | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=3542-4656) |
| Ajouter un exercice — Initial | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=3943-6064) |
| Ajouter un exercice — Nom Description Media | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=4217-6980) |
| Ajouter un exercice — Catégorie renseignée | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=5088-6398) |
| Modifier un exercice | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=4734-6342) |
| Ajouter un exercice — Catégories | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=4332-7095) |
| Ajouter un exercice — Nouvelle catégorie | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=4474-7157) |
| Ajouter un exercice — Zones corporelles | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=4478-7209) |
| Ajouter un exercice — Nouvelle zone corporelle | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=4683-6336) |
| Modal — Abandonner la création de l’activité | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=4714-6241) |
| Ajouter un exercice — Catégorie — Appui long — Confirmation suppression | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=4861-6259) |
| Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=4861-6348) |
| Création activité — Paramètres en modale — 1 Champ vide | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6407-9458) |
| Création activité — Paramètres en modale — 2 Modale ouverte (champs vides) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6407-9551) |
| Création activité — Paramètres en modale — 3 Texte affiché | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6407-9702) |
| Création activité — Paramètres en modale — 4 Modale complète — mode activé | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6407-9805) |
| Création activité — Paramètres en modale — 5 Modale complète — steppers (séries, pauses) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6407-9966) |
| Création activité — Paramètres en modale — 6 Durée activée (roulette ouverte) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6407-10127) |
| Création activité — Paramètres en modale — 8 Changement de côté activé (contrôle segmenté) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6407-10481) |
| Création activité — Paramètres en modale — 7 Durée totale activée (roulette ouverte) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6411-9546) |
| Création activité — Paramètres en modale — 9 Avec changement de côté (pause au changement de côté) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6411-9649) |
| Création activité — Paramètres en modale — 10 Répétitions (mode activé) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6419-9847) |
| Création activité — Paramètres en modale — 11 À l’échec (mode activé) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6419-10028) |
| Création activité — Paramètres en modale — 12 Modale complète — steppers (séries, pauses) avec message de durée totale ajustée | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6423-9953) |
| Séries variables — 2 Durée variable (scénario A) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6665-24616) |
| Séries variables — 3 Répétitions variables (scénario E) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6665-24844) |
| Séries variables — 4 À l’échec variable (scénario F) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6665-25072) |
| Séries variables — 5 Douze séries (défilement — haut) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6665-25277) |
| Ordre des côtés — 7 Sélection : Un côté après l’autre | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6665-26185) |
| Séries variables + Les deux côtés à chaque série — 9 (scénario D) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6665-26575) |
| Une seule série — 10 Options sans effet | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6665-26822) |
| Changement de mode — 11 Cibles à renseigner | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6665-27008) |
| Validation impossible — 12 Série incomplète | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6665-27232) |
| Séries variables — 13 Tableau masqué | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6665-27458) |
| Séries variables — 14 Déplacement d’une série | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6665-27608) |
| Résumé — 15 Durée variable bilatérale Par série | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6665-27862) |
| Résumé — 17 À l’échec variable | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=6665-28050) |
| Création activité — Paramètres en modale — 13 Répétitions avec cadence | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=7059-13302) |
| Création activité — Paramètres en modale — 9b Avec changement de côté (copie) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=7069-13464) |
| Création activité — Paramètres en modale — 10b Répétitions (copie) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=7069-13573) |
| Création activité — Phrase longue (224 caractères) | [Ouvrir](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=7119-27855) |

Les vues Catalogue/Composition montrant des Séries variables servent de preuve d’intégration et de présentation compacte ; elles n’autorisent pas leur refonte complète. Les écrans d’exécution réelle restent hors livraison PRE-3.

États sans frame dédiée signalés par l’inventaire documentaire : G→D, bas des douze Séries, activation variable par copie, certaines sélections alternatives et résumés. Leurs règles sont déjà spécifiées : les tests les couvrent avec les composants et dispositions du même écran, sans inventer de nouveau design.

## 10. Matrice de couverture PRE-3

Ces identifiants sont ceux du présent périmètre, pas des identifiants machine VNext déjà produits.

| ID | Exigence de sortie | Preuve avant recette | Recette ciblée |
|---|---|---|---|
| P3-01 | Quatre entrées créer/modifier × Catalogue/Séance ; copies indépendantes | Intégration navigation/services | Parcours et retour |
| P3-02 | Éditeur complet et actions accessibles | Tests de rendu + comparaison Figma | Clavier, scroll, sauvegarde |
| P3-03 | Catégorie/Zones fidèles, valeurs conservées | Rendu, sélection, persistance, comparaison | Choix et réouverture |
| P3-04 | Mode et cibles corrects dans trois modes | Tests de validation et transition | Champs conditionnels |
| P3-05 | Uniforme/variable explicite, copie/restauration | Tests de machine de brouillon | Bascules puis Annuler |
| P3-06 | Augmentation/réduction/restauration de N | Tests d’ordre et contenu | Réduire puis rétablir |
| P3-07 | Déplacement, nouvelle première/dernière ligne | Tests d’ordre, pause finale, annulation | Réordonner |
| P3-08 | N=1 normalisé immédiatement | Tests état, calcul, sauvegarde | Contrôles grisés |
| P3-09 | Directions et deux ordres bilatéraux | Tests croisés modes/ordres | Sélection et affichage |
| P3-10 | Défauts Profil copiés sans réécriture | Tests création/activation/édition | Nouveau puis existant |
| P3-11 | Bip 0..10 dans trois modes | Bornes, copie, persistance | Aucun/positif, bascule |
| P3-12 | Totaux exact/estimé/omis corrects | Cas numériques indépendants | Présence, valeur, symbole |
| P3-13 | R remplace PN ; calcul Séance sans doublon | Intégration calcul/copie/duplication | Totaux d’un exemple connu |
| P3-14 | Inversion Durée uniforme | Limites N, égalités, normalisation N=1 | Total ajusté et message |
| P3-15 | Phrase et gras conformes aux 276 gabarits | Comparaison des segments et montants injectés | Phrase courte/longue |
| P3-16 | Brouillons atomiques et erreurs conservées | Annulation, double validation, échec DB | Abandon/restauration |
| P3-17 | Persistance et migration compatibles | SQL réel de test, repositories, anciennes données | Enregistrer/relancer/rouvrir |
| P3-18 | Copie/duplication/instantané incluent tous les paramètres | Tests d’intégration et historique immuable | Copie dans Séance |
| P3-19 | Steppers/roulettes/repli/scroll fonctionnels | Temps simulé, limites, rendu adapté | Maintien et accès au bas |
| P3-20 | Surfaces visuelles bornées conformes | Comparaisons par état, properties mesurées | Écarts résiduels explicités |
| P3-21 | Accessibilité des nouveaux contrôles | Rôles, labels, focus, alternatives au drag | VoiceOver ciblé, aucun contrôle SQLite technique délégué à Hermann |
| P3-22 | Frontières respectées, consommateurs préservés | Impact, tests de régression, diff de périmètre | Catalogue/Composition non refondus |
| P3-23 | Import de médias depuis l’éditeur, association persistante et données disponibles pour la future exécution | Import nominal/annulé/en erreur, conservation après redémarrage, copie et ordre selon les règles médias documentées | Ajouter, enregistrer, relancer et rouvrir un Exercice avec média |

Les résultats attendus sont écrits avant le développement. Les tests techniques nécessaires à la persistance et au calcul ne sont pas transférés à une recette visuelle.

## 11. Réserves PRE-2 : affectation précise

| Réserve | Traitement |
|---|---|
| Présentation éditeur et sélecteurs Catégorie/Zones | PRE-3, dans les surfaces listées |
| Interface et calcul des modes, durée totale | PRE-3 avec règles actuelles, pas anciens attendus |
| Voile et segmentés déjà alignés | Réutiliser les tokens validés ; contrôler les nouveaux consommateurs |
| Stepper du Profil sur une autre ligne | Hors PRE-3, reste reporté |
| Présentation générale Profil/Étiquettes/Séances/Calendrier | Hors PRE-3, à affecter à leur tranche |
| Cartes Catalogue et changement à deux options | PRE-5 ou mission dédiée ; décision D-324 conservée, aucun élargissement automatique |
| Accessibilité générale non certifiée | Pas d’attestation globale ; contrôles ciblés des surfaces PRE-3 seulement |
| Import média | Inclus dans PRE-3 par décision de Hermann du 08/10 ; exclusion de CE-T03-04 à amender |
| Chronomètre / audio / lecture de médias pendant l’exécution | Pas de réalisation anticipée du moteur dans PRE-3 |

## 12. État vérifié et prochaine étape

Réalisé ici :
- Lecture des sources au commit indiqué, identification de leurs versions courantes et inventaire Figma.
- Consultation directe du contexte et des captures Figma : Séries variables Durée (scénario A), Répétitions avec cadence, Zones corporelles.
- Définition du périmètre et des preuves de sortie.

Non réalisé :
- Plan technique final, graphe applicatif complet et assertions de livraison ; l’extraction détaillée Figma est désormais disponible dans [le paquet du08/10](extraction-figma.md).
- Audit exhaustif du code et liste finale des fichiers d’écriture, migrations et tests à adapter. Une première analyse ciblée du modèle, de l’éditeur, des calculs et des médias est disponible dans analyse-existant.md.
- Vérification de la qualification actuelle de VNext, détenue dans le chantier séparé.
- Activation de tranche, appel de reviewer ou développement. La PR documentaire de préparation ne constitue aucun de ces événements.

**Prochaine étape concrète : préparer le plan technique PRE-3 à partir de ce périmètre, avec l’extraction Figma atomique exhaustive en entrée.** Le dossier doit relier chaque ligne P3 aux règles, aux éléments visuels et aux fichiers réellement concernés. Il doit déclarer les différences documentaires résiduelles et résoudre les ambiguïtés techniques à partir des sources, avant toute implémentation.

Rapprochement actualisé le 08/10 : les 41 frames sont présentes, leurs textes et accès médias ont été interrogés directement, et quatre surfaces ont été contrôlées visuellement. Voir [preuves Figma](verification-figma-2026-10-08.json) et [bilan par axe](rapprochement-main-figma.md). Le relevé initial est complété par [l’extraction détaillée](extraction-figma.md) : 41 écrans, 6 725 éléments dont 65 descendants masqués, 41 captures, maîtres/variantes et fermeture des tokens ; seconde lecture concordante sur les 41 arbres.

La préparation conserve les décisions validées ; elle ne rouvre ni PRE-1 ni PRE-2 et n’introduit aucune refonte globale.


## 13. Reprise de préparation

État : périmètre validé par Hermann, import compris. Rapprochement daté dans [rapprochement-main-figma.md](rapprochement-main-figma.md). Aucun plan technique approuvé ni autorisation d’implémentation.

La préparation est publiée sous docs/preparation/PRE-3/ afin de ne pas activer implicitement une identité legacy V2. VNext est intégré et activé dans main ; les corrections et qualifications de #334 constituent un chantier séparé. Cette PR de préparation ne modifie ni ce chantier ni les preuves d’activation et n’atteste pas la qualification des correctifs. Le prochain dossier de planification doit consommer le périmètre, l’analyse de l’existant et le [manifeste Figma détaillé](figma/manifest.json) établi dans cette préparation.

## Arbitrage de reprise PRE-3 — source d’import

Le08/10/2026, Hermann choisit la **photothèque seule** (D-334, issue #340). Photos et vidéos locales restent incluses. Les mentions précédentes « caméra / sources système à clarifier » décrivent la préparation antérieure et sont remplacées sur ce seul point. Formats/compatibilité, permissions effectives et présentation des états/gestes manquants restent à finaliser dans le plan ; aucune limite arbitraire ajoutée.

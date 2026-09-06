# Contre-revue indépendante de la documentation KODJO — 2026-09-06

## Identifiant et objectif de la mission

Contre-revue indépendante, strictement en lecture seule, de la documentation fonctionnelle et technique KODJO au commit `ea3d86fb4c2fb82f0487dc8713b12e934670d069`. Objectif : identifier les contradictions, décisions manquantes, sous-spécifications techniques et critères de recette insuffisants susceptibles de bloquer ou de fragiliser le développement, sans utiliser les revues antérieures ni le dossier `Revue-claude` comme source, et sans modifier aucun fichier applicatif.

## Branche et commit de départ

- Dépôt : `C:\Dev\Application-routine`
- Branche : `feat/creation-seance-catalogue`
- Commit analysé : `ea3d86fb4c2fb82f0487dc8713b12e934670d069` (`docs: align activities media catalogue and circuits`)
- Worktree propre avant et après la mission (`git status --porcelain` vide)

## Périmètre demandé

`PRODUCT.md`, `INDEX.md`, `README.md`, puis les chapitres 00 à 13 de `Specifications-fonctionnelles`, avec vérification prioritaire des frontières MVP/V2/V3, des modes Durée/Répétitions/À l'échec, de l'action `Suivant` et de l'enchaînement des Séries, des calculs de durée/progression, d'`ActivityDefinition`/`SessionActivity`, des médias multiples et instantanés, du Catalogue Activités/Séances/Circuits, des filtres et tris, des Circuits et leurs transitions, de la cohérence règles métier ↔ données ↔ API ↔ architecture ↔ contrats d'écran, et des migrations/erreurs/transactions/comportements hors ligne.

## Périmètre réellement traité

Lecture intégrale de `PRODUCT.md`, `INDEX.md`, `README.md` et des quatorze chapitres `00` à `13` (chapitres 06, 08, 09, 12 et 13 lus en totalité malgré leur troncature en pagination outil). Le dossier `Revue-claude` n'a pas été consulté, conformément à l'instruction de mission (analyse indépendante d'abord) et par économie de temps — cette lecture croisée reste un point ouvert, voir section « Vérifications restant à effectuer ». Aucune vérification de cohérence avec le code applicatif n'a été effectuée : la mission porte exclusivement sur la cohérence interne de la documentation, pas sur sa conformité à l'implémentation actuelle.

## Constats

Sévérités : **BLOQUANT** (bloque ou risque de faire diverger un développement en cours ou imminent), **MAJEUR** (risque réel de mauvaise implémentation ou de blocage lors d'une tranche à venir), **MINEUR** (défaut réel mais à faible risque), **À SURVEILLER** (signal faible, pas d'action immédiate requise).

---

### C1 — BLOQUANT — Le contrat CE-T01-04 fait varier le libellé du bouton final de Composition (`Enregistrer` → `Continuer`), alors que le reste de la documentation décrit un libellé unique et constant `Continuer`, simplement activé/désactivé

**Problème.** `13 – Contrats d'écran.md`, contrat `CE-T01-04` (§ tableau des contrôles) : *« Action finale | Affichée désactivée tant que le nom et au moins un Exercice valide ne sont pas présents. Son libellé suit le composant Figma de l'état : `Enregistrer` avant validation complète, puis `Continuer` lorsque la Composition est valide. »* Or `06 – Ecrans et navigation de la V1.md` (§ « Validation de la Composition ») dit : *« L'action `Continuer` valide la Composition. Elle reste désactivée tant que le nom n'est pas renseigné… »* — un seul libellé, jamais `Enregistrer`. Même chose dans `10 – Processus métier...` RM-017 (*« `Continuer` reste désactivé tant que… »*) et dans `08 – Conception fonctionnelle détaillée.md`, annexe Composition (*« Continuer | Désactivé lorsque… »*). Aucun de ces trois documents ne mentionne un état `Enregistrer`.

**Impact sur le développement.** CE-T01-04 est un contrat T01, donc actif dans la tranche en cours. Un développeur ou un agent IA suivant littéralement ce contrat implémentera un bouton dont le libellé change de texte selon l'état de validité (`Enregistrer` puis `Continuer`), ce qui produit un écran visuellement différent de celui décrit par les trois autres sources et invalidable en recette contre l'une ou l'autre référence selon laquelle est utilisée.

**Fichiers et sections contradictoires.**
- `13 – Contrats d'écran.md`, contrat `CE-T01-04`, tableau des contrôles, ligne « Action finale ».
- `06 – Ecrans et navigation de la V1.md`, Écran 3 « Composition d'une séance », § « Validation de la Composition ».
- `10 – Processus métier et règles métier transverses.md`, RM-017.
- `08 – Conception fonctionnelle détaillée.md`, annexe « Composition d'une séance — création et modification », ligne « Continuer ».

**Décision attendue.** Arbitrer : soit le bouton porte toujours le libellé `Continuer` (simplement désactivé) et CE-T01-04 doit être corrigé pour supprimer la mention `Enregistrer`, soit un état `Enregistrer` est réellement voulu et RM-017/D-042/ch06/ch08 doivent être mis à jour en conséquence, avec la règle exacte de bascule du libellé. Compte tenu de l'ordre de priorité documentaire (`06 – Écrans et navigation` prévaut sur `13 – Contrats d'écran` selon `INDEX.md` § 6), la première option est la plus probable, mais elle doit être confirmée explicitement plutôt que déduite silencieusement.

---

### C2 — BLOQUANT — Le modèle de données affirme qu'une Activité « appartient toujours à un seul Tour », contredisant le modèle « Avant Tour / Dans Tour / Après Tour » validé partout ailleurs, y compris dans le même chapitre

**Problème.** `09 – Modèle de données fonctionnel.md`, § 09.13 « Cycles de vie », sous-section « Cycle de vie d'une activité » : *« Une activité appartient toujours à un seul Tour. »* Cette affirmation contredit directement :
- le même chapitre, § 09.2 « Relations principales » : *« Le Cycle peut contenir zéro, une ou plusieurs Activités avant le Tour et zéro, une ou plusieurs Activités après le Tour. Le Tour contient zéro, une ou plusieurs Activités » ;*
- le même chapitre, § 09.5, tableau des attributs de l'entité Activité : *« Position structurelle | Obligatoire | `Avant Tour`, `Dans Tour` ou `Après Tour` »* et *« Tour | Conditionnel | Obligatoire uniquement pour une Activité `Dans Tour` »* — le Tour est ici explicitement **conditionnel**, pas systématique ;
- `PRODUCT.md`, `00 – Glossaire.md`, `04 – Modèle fonctionnel.md`, `06 – Ecrans...`, `08 – Conception fonctionnelle détaillée.md` et `13 – Contrats d'écran.md` (CE-T01-09 : *« Activités avant le Tour ; Tour ; Activités du Tour ; Activités après le Tour »*), qui décrivent tous de façon cohérente et validée le modèle à trois zones.

**Impact sur le développement.** Cette phrase figure dans le chapitre normatif du modèle de données (rang 2 dans l'ordre de contradiction d'`INDEX.md`, juste après le registre des décisions), directement pertinent pour la tranche en cours de préparation (T01-S09/S10, qui doit faire évoluer la persistance vers plusieurs Activités par Séance avec position structurelle). Une lecture littérale et isolée de § 09.13 pourrait laisser croire qu'une contrainte `tourId` obligatoire est correcte pour toute Activité, ce qui est faux et contredit le reste du même chapitre.

**Fichiers et sections contradictoires.** `09 – Modèle de données fonctionnel.md` § 09.13 (ligne « Une activité appartient toujours à un seul Tour ») vs § 09.2 « Relations principales » et § 09.5 « Attributs fonctionnels » (même chapitre).

**Décision attendue.** Correction documentaire pure : supprimer ou reformuler la phrase de § 09.13, qui semble être un résidu d'un modèle antérieur à l'introduction des positions « Avant/Après Tour ». Aucun arbitrage produit n'est nécessaire, le modèle correct est déjà démontré ailleurs dans le même chapitre — seule la cohérence rédactionnelle doit être rétablie avant que T01-S09/S10 ne s'appuie sur ce chapitre comme référence.

---

### C3 — MAJEUR (à la limite du BLOQUANT) — Le chapitre Architecture technique présente encore Drizzle ORM comme le choix retenu « sous réserve de validation », alors que le registre des décisions atteste que cette validation a déjà eu lieu et a été négative

**Problème.** `12 – Architecture technique.md` § 12.6, § 12.24 et § 12.25 présentent tous **Drizzle ORM** comme la technologie ORM retenue, « sous réserve de validation de sa compatibilité avec la version Expo retenue » (formulation strictement prospective, comme si la décision restait à prendre). Le § 12.27 (RT-002) décrit même le spike de validation comme un risque *encore à couvrir*.

Or `07 – Registre des décisions de conception.md`, **D-043** (statut `Révisée`, `Intégrée : Oui`) énonce sans ambiguïté : *« Le spike RT-002 (§ 12.27) mené lors de T01-S01 a jugé la combinaison Drizzle ORM / Expo insuffisamment stable ; le repli déjà prévu par RT-002 a été appliqué — accès direct à `expo-sqlite`, sans Drizzle ORM, derrière une couche Repository… »* — la validation a donc **déjà eu lieu**, il y a plusieurs tranches (T01-S01), et sa conclusion est l'abandon de Drizzle ORM.

**Impact sur le développement.** N'importe quel lecteur ou agent IA consultant `12 – Architecture technique.md` isolément — c'est-à-dire en suivant l'ordre de lecture recommandé par `INDEX.md` § 5 (« Pour préparer l'implémentation technique : 06, 13, 11, 12 ») — prendra Drizzle ORM pour le choix technique actif, à l'encontre d'une décision déjà validée et déjà appliquée en pratique. Le risque n'est pas hypothétique : c'est exactement le type d'incohérence qui produit une régression d'architecture (réintroduction d'une dépendance explicitement abandonnée) si un travail futur se fonde sur le chapitre 12 sans croiser le registre des décisions.

**Fichiers et sections contradictoires.** `12 – Architecture technique.md` § 12.6 (« Persistance et stockage local »), § 12.24 (tableau « Choix technologiques retenus », ligne ORM), § 12.25 (« Drizzle ORM ») vs `07 – Registre des décisions de conception.md`, D-043.

**Décision attendue.** Mise à jour purement rédactionnelle de `12 – Architecture technique.md` pour refléter D-043 : remplacer les formulations « sous réserve de validation » par l'état de fait (accès direct `expo-sqlite`, sans ORM, Drizzle écarté après RT-002). Aucun arbitrage produit n'est nécessaire — la décision existe déjà, seule sa propagation documentaire manque, en violation de la règle de mise à jour d'`INDEX.md` § 7 (« Toute évolution fonctionnelle doit identifier son impact sur… l'architecture technique »).

---

### C4 — MAJEUR — Trois usages documentés de l'action « Dupliquer » (Routine/occurrence de Calendrier, Activité dans la Composition, Séance) restent sans définition fonctionnelle exploitable, à des degrés divers

**Problème.**

1. **Dupliquer une occurrence/Routine du Calendrier (le plus grave des trois) :** `06 – Ecrans et navigation de la V1.md`, Écran 7 « Calendrier », tableau des états Figma (*« Actions glissées | `Dupliquer` et `Supprimer` sur une occurrence hebdomadaire »*) et § « Comportement » (*« [la carte] révèle uniquement `Dupliquer` et `Supprimer` par glissement gauche »*) documentent une action `Dupliquer` visible sur une occurrence de vue Semaine. Or **aucune** des sources suivantes ne définit cette action : `10 – Processus métier...` § 5 « Planification et Calendrier » (RM-043 à RM-050, qui ne couvrent que la suppression) ; `11 – API fonctionnelles.md` § 11.5 « API Routines et Planification » (API-ROU-01 à 08, aucune opération de duplication) ; `08 – Conception fonctionnelle détaillée.md` § 5 « Planification d'une routine » ; `09 – Modèle de données fonctionnel.md` § 09.3/09.3.1. Cette ambiguïté est structurellement significative car une **occurrence n'est pas une entité persistée** (D-013, RM-049, § 09.4) : dupliquer « cette occurrence » n'a donc de sens que si l'action porte en réalité sur la Routine sous-jacente — ce qui n'est écrit nulle part, et qui entrerait potentiellement en tension avec D-022 (« Les exceptions de planification [modifier une seule occurrence] sont exclues du MVP »).
2. **Dupliquer une Activité dans la Composition :** mentionné comme affordance UI dans `06 – Ecrans...` (*« Un glissement gauche révèle les actions `Dupliquer` et `Supprimer` »*), dans `08 – Conception fonctionnelle détaillée.md` (annexe Composition, ligne « Activités »), et dans `10 – Processus métier...` RM-021, mais sans opération API dédiée dans `11 – API fonctionnelles.md` § 11.3 (API-COM-01 à 08 ne comportent pas de « Dupliquer une activité ») ni de règle précisant le placement du doublon, son identifiant, ou la reprise éventuelle d'un suffixe de nom. `09 – Modèle de données fonctionnel.md` § 09.12 comble partiellement ce vide (« Duplication d'une activité » : nouvel identifiant, copie des propriétés, y compris la Récupération après Série), mais reste silencieux sur le placement exact du doublon dans l'ordre de la zone structurelle.
3. **Dupliquer une Séance :** le mieux spécifié des trois (API-SEA-05, § 09.2, § 09.12, § 09.13), mais `08 – Conception fonctionnelle détaillée.md` § 2.4 signale lui-même explicitement un point ouvert non résolu : *« La copie reprend : le nom de la séance (**avec un suffixe à définir**) […] »*.

**Impact sur le développement.** Le cas (1) est le plus critique car il touche à une action UI déjà représentée dans une frame Figma de référence, sans aucune règle métier, alors que sa sémantique n'est pas triviale (l'objet dupliqué n'est même pas persistant). Les cas (2) et (3) sont actuellement hors périmètre T01 — `13 – Contrats d'écran.md`, CE-T01-03, précise explicitement que dans T01 « les actions `Planifier`, `Dupliquer` et `Archiver` deviennent obligatoires dans les tranches et contrats qui livrent leurs parcours complets » et que « les actions par glissement non livrées en T01 ne doivent pas apparaître actives » — mais ils bloqueront la préparation de plan (`PLAN_DRAFT`/`PLAN_READY_FOR_REVIEW`) de la tranche qui les activera si la règle n'est pas écrite avant.

**Fichiers et sections contradictoires/incomplets.** `06 – Ecrans et navigation de la V1.md` (Écran 7 Calendrier, Écran 3 Composition) ; `10 – Processus métier...` (silence RM) ; `11 – API fonctionnelles.md` § 11.3/11.5 (silence API) ; `08 – Conception fonctionnelle détaillée.md` § 2.4, § 3.7 et annexe Composition ; `09 – Modèle de données fonctionnel.md` § 09.12.

**Décision attendue.** Trois décisions distinctes à consigner dans `07 – Registre des décisions de conception.md` avant que les tranches concernées ne démarrent : (a) sémantique exacte de « Dupliquer » sur une occurrence de Calendrier (duplique la Routine ? crée une nouvelle Routine identique à partir de la même Séance ? action retirée du Figma si non voulue ?) ; (b) règle de placement/identité du doublon d'une Activité dans la Composition, avec ajout d'une opération API dédiée ; (c) convention exacte du suffixe de nom pour la duplication d'une Séance (ex. « Squats (copie) », « Squats 2 »).

---

### C5 — MAJEUR — Le chapitre « Conception fonctionnelle détaillée » (§ 3.4) ne mentionne toujours que deux modes d'Exercice (Durée, Répétitions), omettant `À l'échec` déjà validé partout ailleurs

**Problème.** `08 – Conception fonctionnelle détaillée.md` § 3.4 « Types d'activités » → « Exercice » : *« Elle peut être définie : — par une durée ; — par un nombre de répétitions. »* Cette définition centrale, dans le chapitre que l'`INDEX.md` § 5 place juste avant `09 – Modèle de données` dans l'ordre de préparation du développement fonctionnel, ne liste que deux modes, alors que le mode `À l'échec` est validé et intégré partout ailleurs : `PRODUCT.md` § 3/12, `00 – Glossaire.md` § 9, `04 – Modèle fonctionnel.md` § 4.9, `07 – Registre des décisions...` D-111, `09 – Modèle de données fonctionnel.md` § 09.5 (tableau des attributs, qui liste correctement les trois modes), `10 – Processus métier...` RM-034/RM-111, et même **dans le même chapitre 08**, plus bas, § « Activité — contrat révisé » (ajouté lors de la mise à jour du 6 septembre 2026) qui liste correctement les trois modes.

**Impact sur le développement.** Le § 3.4 est un résidu non mis à jour lors de l'introduction du troisième mode ; sa coexistence avec la section corrigée plus bas dans le même document crée une contradiction interne facilement manquée par un lecteur qui s'arrête à la première définition rencontrée.

**Fichiers et sections contradictoires.** `08 – Conception fonctionnelle détaillée.md` § 3.4 « Types d'activités → Exercice » vs le même fichier, section « Activité — contrat révisé » (fin du document), et vs `09 – Modèle de données fonctionnel.md` § 09.5.

**Décision attendue.** Correction rédactionnelle pure de § 3.4 pour ajouter `À l'échec` ; aucun arbitrage produit nécessaire.

---

### C6 — MAJEUR — Le résumé de ligne d'Activité en mode `À l'échec` (D-095, Composition) réintroduit le nom de l'Exercice dans le texte du résumé, alors que les formats Durée/Répétitions du même D-095 ne le font jamais, et que le nom est déjà affiché séparément sur la même ligne

**Problème.** `06 – Ecrans et navigation de la V1.md` § « Résumé de la ligne d'une Activité de type Exercice (D-095) » définit trois formats :
- Durée : *« N série(s) de X min Y s avec Z min Y s de pause par série »* (pas de nom) ;
- Répétitions : *« N série(s) de X répétition(s) avec Z min Y s de pause par série »* (pas de nom) ;
- À l'échec : *« N série(s) de **{nom}**, jusqu'à l'échec, avec Z s de pause entre les séries »* (nom réinséré).

Or la même section précise, juste au-dessus, que la ligne de Composition affiche déjà *« le nom de l'Exercice ; un résumé compact de sa configuration essentielle »* — deux éléments distincts. `13 – Contrats d'écran.md`, CE-T01-09, confirme : *« Chaque ligne d'Exercice affiche son nom et le résumé défini par D-095. »* Pour un Exercice en mode À l'échec, le nom serait donc affiché deux fois sur la même ligne (une fois comme titre, une fois réinjecté dans le résumé), ce qui n'arrive pour aucun des deux autres modes. Le connecteur de pause change également de formulation selon le mode (« de pause par série » pour Durée/Répétitions, « de pause entre les séries » pour À l'échec) sans que cette différence de vocabulaire soit justifiée.

**Impact sur le développement.** Ce défaut touche un critère de recette concret et actif en T01 (CE-T01-09 renvoie explicitement à D-095). Une implémentation suivant D-095 à la lettre produira un doublon visuel du nom pour toute Activité en mode À l'échec.

**Fichiers et sections contradictoires.** `06 – Ecrans et navigation de la V1.md` § « Résumé de la ligne d'une Activité de type Exercice (D-095) » (asymétrie interne des trois formats) vs `13 – Contrats d'écran.md` CE-T01-09 (confirme que le nom est déjà un élément séparé de la ligne).

**Décision attendue.** Retirer `{nom}` du format À l'échec de D-095 (l'aligner sur les deux autres : *« N série(s), jusqu'à l'échec, avec Z s de pause entre les séries »*, ou formulation équivalente sans répétition du nom), et harmoniser la formule de pause (« par série » vs « entre les séries ») entre les trois modes, sauf si la différence est délibérée — auquel cas elle doit être justifiée explicitement.

---

### C7 — MAJEUR — Le chapitre 08 (« Conception fonctionnelle détaillée ») définit un cycle de vie de Séance à cinq états (« En création / Disponible / Planifiée / Exécutée / Supprimée ») incompatible avec le modèle binaire Actif/Archivé validé comme attribut de données

**Problème.** `08 – Conception fonctionnelle détaillée.md` § 2.9 « États d'une séance » présente un tableau à cinq états mutuellement présentés comme le cycle de vie de la Séance, sans état « Archivée » et en traitant « Planifiée »/« Exécutée » comme des états exclusifs plutôt que des attributs dérivés pouvant coexister. Cela contredit `09 – Modèle de données fonctionnel.md` § 09.2, qui définit l'attribut `Statut` d'une Séance comme *« Active ou archivée »* (binaire), ainsi que `10 – Processus métier...` RM-003 (*« Une Séance est soit active, soit archivée »*) et l'ensemble du modèle d'archivage/restauration/suppression (RM-006 à RM-011, API-SEA-06/07/08, § 09.12 « Archivage et suppression »). Le § 09.13 du même chapitre 09 propose par ailleurs un diagramme cohérent (`Création → Édition → Active ├─ Archiver → Séance archivée → Restaurer`) qui, lui, ne contredit pas le modèle binaire.

**Impact sur le développement.** `08 – Conception fonctionnelle détaillée.md` est lu avant `09 – Modèle de données fonctionnel.md` dans l'ordre recommandé par `INDEX.md` § 5. Un lecteur qui s'arrête à ce tableau pourrait modéliser un champ `statut` à cinq valeurs exclusives, ce qui contredirait le modèle réellement validé.

**Fichiers et sections contradictoires.** `08 – Conception fonctionnelle détaillée.md` § 2.9 « États d'une séance » vs `09 – Modèle de données fonctionnel.md` § 09.2 (attribut Statut) et § 09.13 (diagramme correct du même chapitre).

**Décision attendue.** Correction rédactionnelle de § 2.9 pour aligner ce tableau sur le modèle binaire Actif/Archivé, en présentant « Planifiée »/« Exécutée » comme des qualificatifs dérivés (facultatifs, non exclusifs) plutôt que comme des états de cycle de vie.

---

### C8 — MINEUR — `PRODUCT.md` : la numérotation des sections 10/11/12 est incohérente et la liste à puces de la section 10 (« Évolutions prévues ») est coupée par l'insertion de la section 12

**Problème.** `PRODUCT.md` présente les titres dans l'ordre `## 10. Évolutions prévues`, puis `## 12. Évolution Activités, Catalogue et Circuits — décision du 6 septembre 2026`, puis `## 11. Gouvernance documentaire` — numérotation non séquentielle. De plus, trois puces qui appartiennent visiblement à la liste de la section 10 (*« planification périodique étendue… »*, *« intelligence artificielle… »*, *« suppression d'une Catégorie personnalisée créée par erreur… »*) apparaissent **après** le contenu de la section 12 et **avant** le titre de la section 11, ce qui signale une insertion mal positionnée lors de la mise à jour du 6 septembre 2026.

**Impact sur le développement.** Purement cosmétique/navigationnel ; aucun risque fonctionnel, mais nuit à la lisibilité et à la maintenabilité du document de synthèse.

**Fichiers et sections contradictoires.** `PRODUCT.md`, titres `## 10`, `## 12`, `## 11` et la liste à puces entre les sections 12 et 11.

**Décision attendue.** Renumérotation simple et déplacement des trois puces orphelines dans la liste de la section 10 (aucun arbitrage de contenu nécessaire).

---

### C9 — MINEUR / À SURVEILLER — Le référentiel des Catégories expose des attributs `Icône` et `Couleur` facultatifs qu'aucun écran ou règle métier ne permet actuellement de renseigner pour une Catégorie personnalisée

**Problème.** `09 – Modèle de données fonctionnel.md` § 09.10 déclare les attributs `Icône` (*« Choisie dans la bibliothèque de l'application »*) et `Couleur` (*« Choisie dans la palette de l'application »*) comme facultatifs sur l'entité Catégorie. Or le parcours de création intégrée d'une Catégorie (`06 – Ecrans...` Écran 6, `07 – Registre...` D-106, `10 – Processus métier...` RM-106/107, `13 – Contrats d'écran.md` CE-T01-12) ne comporte qu'un champ `Nom de la catégorie` — aucune sélection d'icône ni de couleur n'est jamais décrite pour une Catégorie créée par l'utilisateur, et le composant `Selection / Category Tag` (§ 12, table des composants) ne documente pas de slot d'icône.

**Impact sur le développement.** Faible : les attributs sont facultatifs et n'empêchent pas l'implémentation. Mais ce sont des champs de données non reliés à un flux fonctionnel réel dans le périmètre documenté, ce qui peut indiquer soit un vestige d'un concept abandonné, soit une fonctionnalité destinée aux seules Catégories prédéfinies (fournies par l'application) sans que cela soit dit explicitement.

**Fichiers concernés.** `09 – Modèle de données fonctionnel.md` § 09.10 vs `06 – Ecrans...` Écran 6, `07 – Registre...` D-106, `10 – Processus métier...` RM-106/107, `13 – Contrats d'écran.md` CE-T01-11/12.

**Décision attendue.** Clarifier si `Icône`/`Couleur` sont réservés aux Catégories prédéfinies fournies par l'application (auquel cas le documenter explicitement dans § 09.10) ou s'ils sont un reliquat à retirer du modèle.

---

## Hypothèses non démontrées

- Il est supposé que l'ordre de priorité documentaire défini par `INDEX.md` § 6 (registre des décisions > glossaire/modèle fonctionnel/modèle de données > conception fonctionnelle détaillée > écrans et navigation > contrats d'écran > versions/vision) s'applique bien pour trancher C1, C2, C5 et C7 en faveur de la source de rang le plus élevé ; cette hypothèse n'a pas été confrontée à un arbitrage humain ou à ChatGPT, et le present rapport ne fait que signaler la contradiction, pas la trancher.
- Il est supposé que le dossier `Revue-claude`, non consulté, ne contient pas déjà une résolution actée de ces constats qui n'aurait simplement pas été répercutée dans les chapitres normatifs ; cette hypothèse n'a pas été vérifiée (voir « Vérifications restant à effectuer »).
- Aucune vérification n'a été faite quant à savoir si le code applicatif actuel (`src/`) est déjà aligné avec l'une ou l'autre version contradictoire pour C1, C3 et C7 — la mission portait exclusivement sur la documentation, pas sur son alignement avec l'implémentation.

## Modifications réalisées

Aucune. Aucun fichier applicatif n'a été modifié, aucun fichier de `docs/` n'a été modifié. Seul le présent rapport a été créé, conformément à l'obligation de livraison documentaire de `CLAUDE.md` (aucune exception expresse n'a été formulée par l'utilisateur).

## Éléments non corrigés ou hors périmètre

Toutes les corrections nécessaires identifiées ci-dessus (C1 à C9) restent à traiter par arbitrage puis par une mission documentaire dédiée ; aucune n'a été appliquée, conformément à la consigne de lecture seule. Les chapitres `00 – Glossaire`, `01`, `02`, `03`, `04`, `05`, `07`, `10`, `11` n'ont révélé aucune contradiction supplémentaire au-delà de celles listées ci-dessus lors de cette lecture ; cela ne constitue pas une preuve d'absence totale de défaut, seulement l'absence de défaut détecté par cette contre-revue.

## Vérifications restant à effectuer sur appareil réel

Sans objet pour cette mission (revue documentaire pure, aucun test sur appareil).

## Vérifications restant à effectuer (documentaires)

- Croiser les constats C1 à C9 avec le contenu du dossier `Revue-claude` (non consulté ici par instruction de mission) pour vérifier qu'aucun n'est déjà connu et en cours de traitement.
- Faire trancher C1 (libellé du bouton Composition) en priorité absolue avant toute nouvelle recette de CE-T01-04, car il s'agit d'un contrat T01 actif.
- Faire corriger C2 (Activité toujours « dans un Tour ») avant que le travail de modélisation multi-Activités de T01-S09/S10 ne s'appuie sur le chapitre 09 comme référence.
- Vérifier si le code actuel (`src/infrastructure/database/repositories/*`, `src/domain/sessions/*`) est déjà aligné sur D-043 (`expo-sqlite` direct, sans Drizzle) — c'est une vérification technique hors du périmètre de cette mission documentaire, mais nécessaire pour confirmer que C3 est un défaut purement documentaire et non une divergence réelle de stack.

## Fichiers modifiés

Aucun fichier applicatif ni fichier `docs/` n'a été modifié. Seul le présent rapport a été créé :
- `.github/orchestration/reports/2026-09-06_contre-revue-documentation-kodjo.md` (nouveau fichier)

## Commit final

À renseigner après commit (voir message de clôture de la conversation) : ce rapport est committé seul, sans modification applicative associée, conformément à la règle « diagnostic, audit, revue ou test sans correction » de `CLAUDE.md`.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD avant mission : `ea3d86fb4c2fb82f0487dc8713b12e934670d069`
- Worktree strictement propre pendant toute la durée de l'analyse (aucune écriture applicative)
- Un seul commit documentaire est produit par cette mission, contenant exclusivement ce rapport

## Tests

Sans objet — mission de revue documentaire pure, aucun test automatisé n'est applicable. Aucune suite Jest, `tsc` ou `eslint` n'a été exécutée car aucun fichier de code n'a été touché.

## Synthèse finale

- **Peut-on poursuivre le développement du MVP ? OUI SOUS CONDITIONS.**
  Aucun des constats n'invalide l'architecture ou le modèle métier dans leur ensemble ; la très large majorité de la documentation (chapitres 00, 01, 02, 03, 05, 07, 10, 11 en quasi-totalité, et l'essentiel de 04, 06, 08, 09, 12, 13) est cohérente, précise et exploitable. Mais **C1** (libellé du bouton final de Composition) est un contrat T01 actif et directement contradictoire ; il doit être arbitré avant la prochaine recette de CE-T01-04. **C2** touche le chapitre normatif du modèle de données au moment précis où T01-S09/S10 doit étendre ce modèle vers plusieurs Activités par Séance.

- **Nombre de constats par sévérité :**
  - BLOQUANT : 2 (C1, C2)
  - MAJEUR : 5 (C3, C4, C5, C6, C7)
  - MINEUR : 1 (C8)
  - À SURVEILLER : 1 (C9)

- **Arbitrages nécessaires avant la prochaine tranche :**
  1. C1 — libellé exact du bouton final de Composition (`Continuer` constant, ou bascule `Enregistrer`/`Continuer` à documenter précisément).
  2. C2 — correction du § 09.13 pour supprimer la phrase contredisant le modèle Avant/Dans/Après Tour, avant que T01-S09/S10 ne s'appuie dessus.
  3. C7 — alignement du § 2.9 de ch08 sur le modèle Actif/Archivé binaire (peut être traité avec C2 dans la même passe de nettoyage du modèle de données).
  4. C6 — retrait de `{nom}` du format À l'échec de D-095, actif en T01.
  5. C4(a) — sémantique de « Dupliquer » sur une occurrence de Calendrier, à trancher avant la tranche qui livre les actions de Calendrier (non urgent pour T01 mais à traiter avant cette tranche).

- **Points pouvant rester dans le backlog V2/V3 :**
  - C3 (staleness Drizzle ORM dans ch12) — correction purement rédactionnelle, sans urgence produit, mais à ne pas oublier avant qu'un nouveau contributeur ne s'appuie sur le chapitre 12 comme source unique.
  - C4(b) et C4(c) — duplication d'Activité et suffixe de duplication de Séance, différées car les actions correspondantes ne sont pas encore livrées en T01 (CE-T01-03/CE-T01-09 le confirment explicitement).
  - C8 (numérotation PRODUCT.md) et C9 (icône/couleur de Catégorie) — cosmétique et à faible risque, traitables lors d'une prochaine passe de toilettage documentaire.

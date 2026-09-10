# Mission de planification verrouillée — V2-BILAT-01

## État protocolaire

- Type : `PLAN_ONLY`
- Statut : `PLANNING_AUTHORIZED`
- Implémentation autorisée : **NON**
- Tranche : `V2-BILAT-01`
- Issue : [#52](https://github.com/MyUncried/Application-Routine/issues/52)
- Dépôt : `MyUncried/Application-Routine`
- Révision applicative à analyser : `04a15580f65d2b3702776447c3574dee988e5b83`
- Baseline documentaire corrigée : `7e4f6984a8aefb6018e908e183dd7dda56e2482d` (PR #56)
- Branche cible future : `main`
- Identité : `.github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json`
- Empreinte d’identité : `6646d159c0e5e9c0293146e272a176d31d7b90c9019bc83e0cb20601edfbc6a2`
- Protocole d’exploitation : KODJO V2 lean 0.6.13

La révision ci-dessus reste la source du plan. L’ajout du présent artefact protocolaire ne constitue pas une nouvelle baseline applicative.

## Rôle confié à ChatGPT Développement

Agir exclusivement comme **planificateur technique**. Examiner le code et les tests existants, confronter leur état aux sources fonctionnelles, puis produire un plan d’implémentation détaillé et vérifiable.

Il est interdit de modifier un fichier, créer une branche, committer, pousser, ouvrir une PR, lancer Claude ou déposer une demande dans la file V2.

## Sources normatives

1. `docs/PRODUCT.md`
2. `docs/MATRICE-TRACABILITE-BILATERALITE.md`
3. `docs/RAPPORT-CONFORMITE-BILATERALITE.md`
4. `docs/INDEX.md`
5. spécifications fonctionnelles `docs/Specifications-fonctionnelles/00` à `13`
6. Figma uniquement par les références canoniques citées dans la documentation
7. code et tests présents à la révision verrouillée

Ordre de prévalence : registre des décisions, modèles et glossaire, conception détaillée, écrans, synthèses, documents historiques.

## Périmètre fonctionnel inclus

Cette tranche livre uniquement la **configuration préalable à T03** :

- modèle de côté `UNILATERAL`, `RIGHT_LEFT`, `LEFT_RIGHT` ;
- valeur initiale et migration vers `UNILATERAL` ;
- persistance pour Activité et Tour ;
- copie, insertion et duplication avec conservation du côté ;
- contrôle UI `Côtés` : Unilatéral → D→G → G→D → Unilatéral ;
- disponibilité pour Durée, Répétitions et À l’échec ;
- confirmation lors de l’activation bilatérale d’un Tour ;
- remise atomique des Activités enfants à `UNILATERAL` ;
- contrôles enfants visibles mais désactivés sous un Tour bilatéral ;
- absence de restauration des anciens réglages enfants ;
- résolution centralisée de la direction propre/effective ;
- calculs de Durée totale et synthèses conformément aux formules documentées ;
- validations, accessibilité et tests correspondant à cette configuration.

## Hors périmètre impératif

Ne pas planifier dans cette tranche :

- développement ou modification du moteur d’exécution T03 ;
- génération des passages droit/gauche dans le plan d’exécution ;
- affichage du côté pendant l’exécution ;
- résultats séparés par côté ;
- progression fondée sur les passages développés ;
- annonces vocales de changement de côté ;
- réinitialisation ou passage anticipé propres à l’exécution bilatérale ;
- médias, catalogue d’Activités V2, Circuits, comptes ou synchronisation ;
- refonte visuelle ou fonctionnelle non exigée par la bilatéralité ;
- modification des manifestes historiques de tranches clôturées ;
- correction opportuniste étrangère au périmètre.

Toute dépendance indispensable située hors de ces bornes doit être signalée comme question ou risque, jamais ajoutée tacitement.

## Analyse demandée

Le planificateur doit :

1. établir l’état réel du code à la révision verrouillée ;
2. identifier ce qui existe déjà, ce qui manque et ce qui doit être migré ;
3. localiser les modèles, services, repositories, providers, formulaires, composants, calculs et tests concernés ;
4. rechercher les duplications de règles et proposer une source de vérité unique ;
5. vérifier les impacts sur création, modification, copie, duplication et persistance ;
6. distinguer explicitement configuration bilatérale et future exécution bilatérale ;
7. proposer l’ordre de mise en œuvre limitant les régressions ;
8. définir les contrôles automatisés et les validations manuelles strictement nécessaires ;
9. relever toute contradiction entre code et documentation sans la résoudre par hypothèse.

## Livrable attendu

Répondre en français avec un plan comprenant obligatoirement :

1. **Constat de l’existant** — preuves par chemins de fichiers et symboles.
2. **Écarts fonctionnels** — correspondance avec les identifiants `BIL-001` à `BIL-060`.
3. **Périmètre exact proposé** — liste exhaustive des fichiers à créer, modifier ou supprimer, avec justification.
4. **Plan séquencé** — étapes atomiques, dépendances et résultat vérifiable de chaque étape.
5. **Données et migration** — compatibilité avec les données existantes et comportement par défaut.
6. **Tests** — tests unitaires, intégration, composants et contrôles finaux.
7. **Critères d’acceptation** — matrice exigence → preuve.
8. **Risques et questions** — uniquement les arbitrages réellement nécessaires.
9. **Proposition de `scope_allow`** — chemins minimaux destinés à l’implémentation V2.
10. **Verdict de planification** — `PLAN_READY_FOR_INDEPENDENT_REVIEW` ou `CLARIFICATION_REQUIRED`.

Le livrable ne doit contenir ni code d’implémentation complet ni commande destinée à l’utilisateur.

## Clarification migrations — CLÔTURÉE

Décision canonique intégrée au plan :

- `migration004` reste attribuée à T02-S02 avec `DATABASE_VERSION = 4` ;
- `migration005` appartient à `V2-BILAT-01`, ajoute les `side_mode` de configuration et fixe `DATABASE_VERSION = 5` ;
- `migration006` est réservée à T03 pour la persistance d’Exécution et de Résultats avec `DATABASE_VERSION = 6`.

Cette décision ne constitue plus une question ouverte et ne doit pas être soumise à une nouvelle validation métier.

## Suite obligatoire

Le plan produit n’autorise rien. ChatGPT Protocole le transmettra à une revue indépendante. Après corrections éventuelles, l’utilisateur devra le valider explicitement. Seule cette validation permettra à ChatGPT Protocole de créer une demande lean dans la file V2.

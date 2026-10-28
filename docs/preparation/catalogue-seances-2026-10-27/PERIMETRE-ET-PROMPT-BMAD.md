# Prochaine tranche — Catalogue des séances — périmètre proposé et prompt BMAD

Date : 27/10/2026. **Proposition de périmètre à valider par Hermann.** Préparation autorisée, pas démarrage du développement. Ne pas attribuer un numéro de PRE sans vérifier les tranches en cours.

## Avis sur le périmètre

**Recommandation : retenir le seul Catalogue des séances.** Il forme un ensemble fonctionnel cohérent : carte unique, vues, lecture déployée, filtres et accès aux actions de séance. Les douze écrans de la ligne et les trois variantes Catalogue sont documentés. Les changements de nom lors de la création appartiennent à la Composition ; la marge globale du prototype appartient à un autre chantier. Les intégrer ferait perdre la limite de cette tranche.

Cette tranche n'est pas seulement cosmétique. Le catalogue doit lire le modèle D-449 : séances d'un ou plusieurs exercices, mouvements partagés, cycles et circuits successifs. La documentation de ce modèle ne prouve pas sa livraison. Le constat sur `main` au départ de cette préparation (`e1347d971c85da23f4ef6144effef1958bb86808`) est le suivant :

- `src/domain/sessions/Session.ts` expose encore un `cycle` unique et les positions `beforeTour` / `tour` / `afterTour`.
- `src/features/sessions/useSessionCatalogue.ts` charge les séances actives via le service existant.
- `src/features/sessions/CatalogueScreen.tsx` conserve le filtre désactivé et l'ancienne rangée de commandes.
- Aucun dossier de planification PRE-8 n'est présent dans cette version de `main` ; il peut exister sur une branche de travail. BMAD doit examiner la branche effective et réutiliser les travaux A/B/C déjà présents, sans les redévelopper ni conclure qu'ils sont absents partout.

Le modèle cible est donc une dépendance à vérifier story par story. S'il manque, isoler sa livraison dans son chantier existant ; ne pas recréer temporairement un catalogue autonome d'exercices ni convertir la base dans une story visuelle.

## Périmètre inclus

| Lot fonctionnel | Résultat attendu | Dépendance |
|---|---|---|
| Projection des séances | Compte structurel des exercices, catégories ordonnées/dédupliquées, médias selon cascade, format/volume/durée, arbre lisible | Modèle D-449 et services de lecture des mouvements/médias ; calculs existants |
| Carte unique | Visuel 64, titre et chevron unique conditionnel, catégories +N, synthèse et Lecture ; variante archivée sans action directe | Projection précédente ; composants DSF actuels |
| Déploiement | Lecture Cycle/Circuit/Exercice, filets, décalages, volumes et récupérations, conteneurs triviaux masqués, hauteur dynamique | Arbre de composition ; aucune édition de la structure |
| Écran et vues | Segmenté trois entrées, Un exercice/Plusieurs désélectionnables, collection complète par défaut, Filtre/Tri/Créer dans l'ordre, marges 16 et écart 12 | Navigation existante ; destinations disponibles |
| Actions glissées | Bloc 80 sur toute hauteur de carte ; Planifier/Dupliquer/Archiver ou Restaurer/Supprimer, confirmations existantes | Services de cycle de vie et parcours de planification déjà définis |
| Filtres | Statut/Catégories/Zones/Étiquettes/Format, statut compact, sections actives ouvertes, pied Réinitialiser fixe | Règles combinatoires existantes à réutiliser ou précision locale à obtenir ; raccordement des vignettes |
| Intégration et recette | Suppression de l'entrée du catalogue autonome d'exercices au profit de la vue Un exercice ; états vides, erreurs et retours ; contrôles automatiques et visuels | Services existants ; non-régression Calendrier/Suivi/Choix |

La suppression de l'entrée d'interface ne vaut pas suppression des données, des migrations historiques ou des composants encore utilisés ailleurs. Lancer, planifier, créer et modifier réutilisent leurs parcours existants : on raccorde les entrées du catalogue, sans refondre ces parcours. Programmes visible dans le segmenté n'autorise pas le développement d'un catalogue Programmes ; une destination non livrée reste explicitement indisponible selon la règle commune. Le déplacement des boutons ne suffit pas à rendre le tri actif.

## Hors de cette tranche

- Les trois états automatiques du nom de séance (§8 de la spécification), à intégrer dans la tranche création/composition.
- La refonte de l'éditeur, la création de cycles/circuits ou la reprise de séance ; la carte ne fait que lire la structure existante.
- Le moteur d'exécution, les formules de durée, les phases, les paramètres, la filiation et les instantanés.
- Les cartes Calendrier, Suivi et Choix ; leurs absence de visuel et comportements restent conservés.
- Le déploiement global de la marge 16 sur toute l'application et la refonte du catalogue des mouvements. Le nouvel ordre Filtre/Tri/Créer y est documenté, mais son implémentation reste dans son lot.
- Les fonctionnalités Programmes et Communauté ; les fonctions de rattachement/détachement de mouvements non validées.
- Les migrations ou réinitialisations de données sans nécessité établie et autorisation applicable.

## Compléments circonscrits à traiter dans la préparation

| Point | Traitement recommandé |
|---|---|
| Modèle D-449 | Vérifier les livraisons A/B/C sur la branche de développement ; cartographier les dépendances réelles, sans ouvrir de seconde implémentation |
| Vignettes de formats | Raccorder le jeu final quand disponible. L'exemple EMOM utilisant Libre est une limite connue, pas la cible. La dépendance porte sur cette story, pas sur tout le catalogue |
| Catégories/Zones | Chercher une sémantique existante. À défaut, proposition à faire valider : OU entre valeurs d'une même section, ET entre sections, recherche sur l'ensemble des exercices de la séance. Cette proposition n'est pas une décision produit |
| Arrière-plan de suppression `2234:189` | Appliquer les trois segments et le glissé Restaurer/Supprimer prescrits ; ne pas reprendre le dessin ancien. Correction Figma à coordonner séparément |
| Filtre étendu et bascule de vue | Vérifier qu'aucune zone interactive ne se recouvre, aux largeurs prises en charge et avec texte agrandi. Pas de troisième option Toutes |
| État vide | Réutiliser le comportement existant. Les anciennes frames hors ligne ne sont pas une justification pour recréer l'ancien catalogue |
| Routines multicontenus | Conserver la limite existante de RM-008 ; ne pas inventer de suppression des autres contenus lors de l'archivage |

## Critères d'acceptation du lot proposé

1. Une séance reste la même entité avec un ou plusieurs exercices ; les vues ne modifient pas les données.
2. Aucun chevron pour une seule occurrence ; plusieurs occurrences peuvent déployer la composition sans lancer ni modifier la séance.
3. La cascade de médias, les catégories, les volumes et les durées sont calculés depuis des données réelles ; aucune donnée d'exemple codée en dur.
4. Les répétitions de cycles/circuits ne multiplient pas le nombre d'exercices ni les lignes du détail ; les récupérations ne comptent pas comme exercices.
5. Les actions et leur ordre correspondent aux états actif/archivé ; hauteur 80 même sur carte déployée ; confirmations et historique préservés.
6. Les vues et filtres produisent les bons résultats, y compris collection complète, absence de résultat, archives et retour de parcours.
7. Les douze états Catalogue respectent les captures courantes et les règles normatives qui corrigent les écarts explicitement listés ; les autres contextes ne changent pas.
8. Les tests automatiques couvrent la projection, le filtrage arrêté, les actions, les états et les non-régressions. La recette visuelle vérifie les dimensions, les textes longs, les zones tactiles et les états déployés sur l'environnement réel disponible.

## Prompt à transmettre à ChatGPT BMAD

> Tu prépares la prochaine tranche de KODJO dans `MyUncried/Application-Routine`, limitée au Catalogue des séances. Commence par vérifier la branche de développement effective et les travaux PRE-8 déjà engagés. N'attribue pas de numéro de tranche sur la seule base du nom de ce dossier.
>
> Lis `docs/INDEX.md`, `docs/KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md`, `docs/DSF-CATALOGUE-SEANCES-2026-10-27.md` et le présent périmètre. Consulte les chapitres 07 (D-449, D-260/D-261 et complément Catalogue du 27/10), 09 (modèle), 10 (règles), 12 (composants) et 13 (CE-T03-01 actualisé). Les captures des douze écrans et trois variantes sont référencées dans le relevé DSF ; Figma : `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101`.
>
> Prépare un périmètre fonctionnel et technique, un découpage en stories avec dépendances réelles, des critères d'acceptation et un plan de tests automatiques et de recette visuelle. Réutilise le découpage A/B/C et les services/composants existants lorsque pertinents. La carte Catalogue doit lire le modèle D-449 sans le réimplémenter ; vérifie sa disponibilité avant de déclarer chaque story prête.
>
> Inclus : carte unique avec visuel, catégories et synthèse ; détail structuré ; vues Un exercice/Plusieurs ; écran à trois segments ; actions glissées ; panneau de filtres et raccordements aux parcours existants. Respecte la marge 16, la largeur utile 370 au gabarit 402, l'écart 12 et les actions de hauteur 80. Ne recrée aucun catalogue autonome d'exercices.
>
> Exclus : nomination automatique lors de la création, refonte de Composition, moteur et paramètres, autres contextes de cartes, catalogue Programmes, fonctionnalités Communauté, refonte globale des marges et du catalogue des mouvements. Les règles correspondantes sont documentées mais ne sont pas autorisées à entrer dans cette tranche par dépendance implicite.
>
> Traite les compléments localement : jeu final des vignettes ; sémantique des nouveaux filtres si aucune règle existante ne répond ; ancien arrière-plan de la confirmation de suppression et chevauchement du filtre étendu. Distingue faits, décisions validées et propositions. N'invente pas de règle métier pour combler un manque ; ne bloque pas les stories indépendantes.
>
> Termine par : périmètre prêt à approuver, stories et ordre de réalisation, dépendances disponibles/manquantes, tests et seuls points nécessitant une décision produit. Ce travail prépare le lancement : ne commence pas le développement et ne modifie ni Figma ni les règles validées. Aucune fusion de développement sur main n'est autorisée par ce prompt.

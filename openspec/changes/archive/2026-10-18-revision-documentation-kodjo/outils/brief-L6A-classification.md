# Brief — lot 6A, classification des sections (lecture seule)

Dépôt : `C:\Dev\KODJO-OPENSPEC-DOCS`, branche `docs/openspec-revision`. **Aucune modification** d'un fichier de `docs/`, ni d'aucun fichier hors du TSV de sortie qui t'est attribué. Pas de commande git qui modifie l'état (pas de commit, checkout, stash, reset).

## Entrées

- Inventaire : `openspec/changes/revision-documentation-kodjo/lot6/inventaire-sections.tsv` (colonnes : id, chapitre, niveau, titre, ancres, ligne_debut, ligne_fin, lignes, mots, ids_definis, nb_ids_cites, datee, liens_entrants). Les plages de lignes renvoient aux fichiers de `docs/Specifications-fonctionnelles/`.
- Constats existants à réutiliser (cite leurs identifiants, ne les refais pas) : `diagnostic.md`, `qualite.md`, `constats/H-hierarchie.md`, `constats/P-perimetre.md`, `constats/S-seances.md`, `constats/X-exercice.md`, `constats/qualite/QS-structure.md`, `QF-formulation.md`, `QC-contenu.md`, `arbitrages.md` (reports « lot 6 »).

## Travail

Pour **chaque** section de ton périmètre (toutes les lignes de l'inventaire dont la colonne chapitre est dans ton périmètre, sans exception), lis le texte de la plage et produis une ligne. Ne résume pas : classe.

Colonnes de sortie (TSV, en-tête obligatoire, une ligne par section, même ordre que l'inventaire) :

1. `id` — identifiant de l'inventaire (ex. `S08-0465`).
2. `type` — type **dominant** du contenu, une valeur parmi :
   `VISION` (intention, problème, ambition) · `BESOIN` · `PARCOURS` (récit d'usage) · `CONCEPT` (définition d'un objet ou d'un terme) · `PERIMETRE` (version, tranche, inclus/exclu, roadmap) · `NAVIGATION` (articulation des écrans, inventaire, captures) · `DECISION` (ligne de registre, arbitrage) · `COMPORTEMENT` (comportement fonctionnel d'une fonctionnalité, non lié à un écran unique) · `REGLE` (règle métier identifiée ou non) · `CALCUL` (formule, durée, agrégat, format d'affichage d'une valeur) · `DONNEE` (entité, attribut, invariant, persistance, migration) · `API` · `ARCHITECTURE` (technique) · `RENDU` (px, couleurs, polices, disposition visuelle, icônes) · `CONTRAT` (comportement d'un écran précis, CE-xx) · `CONVENTION-UI` (règle d'interface commune à plusieurs écrans) · `RECETTE` (cas de test, oracle) · `HISTORIQUE` (journal, consolidation datée, statut de livraison, preuve Figma, transmission) · `META` (objet du chapitre, organisation, ordre de priorité, renvois, convention de lecture) · `CONTENEUR` (titre sans contenu propre, ses sous-sections portent tout).
3. `types_secondaires` — autres types présents de façon significative (séparés par `+`), ou vide.
4. `domaine` — une valeur parmi :
   `SEANCE` (catalogue, cycle de vie, archivage, étiquettes de séance) · `EXERCICE` (Exercice de référence, éditeur, catalogue des exercices, médias d'exercice) · `PARAMETRES` (séries, cibles, modes, cadence, bip, pauses, phrase de synthèse, feuille Paramètres) · `COMPOSITION` (composer, ordre, récupérations, points d'arrêt, validation) · `CIRCUIT` · `FORMAT` (formats de séances, modèles, Death by…) · `BILATERALITE` · `EXECUTION` (séance ou exercice, phases, moteur, interruptions, fin) · `MEDIA-EXEC` (médias pendant l'Exécution) · `PLANIFICATION` (routines, calendrier, occurrences, rappels) · `SUIVI` (synthèse, historique, suivi) · `PROFIL` (préférences globales, défauts) · `REFERENTIELS` (catégories, zones, étiquettes) · `PARCOURS-HORS-MVP` · `TRANSVERSE-UI` · `TRANSVERSE-CALCUL` · `TRANSVERSE-PRODUIT` (vision, utilisateurs, versions, roadmap) · `TECHNIQUE` · `GOUVERNANCE` (autorité, sources, conventions documentaires) · `MULTI` (la section couvre plusieurs domaines sans dominante : précise-les dans `domaines_secondaires`).
5. `domaines_secondaires` — séparés par `+`, ou vide.
6. `normatif` — `oui` (porte au moins une règle applicable aujourd'hui), `non` (description, historique, méta), `mixte`.
7. `accretion` — `oui` si la section est un **complément daté ou empilé** (ajout postérieur posé à côté ou en fin de chapitre au lieu d'être intégré à la rubrique thématique), sinon `non`.
8. `recouvrements` — sections d'**autres** chapitres (ou du même) qui traitent le même sujet au même niveau de détail, sous la forme `id:nature` séparés par espaces, où nature ∈ `COPIE` (texte identique ou quasi identique), `PARAPHRASE` (même règle reformulée), `DIVERGENCE` (même sujet, contenu différent ou contradictoire), `RESUME` (version abrégée qui renvoie ou devrait renvoyer). Ne liste que ce que tu as vérifié par lecture ou recherche (`grep`). Vide si aucun.
9. `constats` — identifiants des constats existants qui portent sur cette section (H-xx, P-xx, S-xx, X-xx, QS-xx, QF-xx, QC-xx, R-0x, report lot 6), séparés par espaces, ou vide.
10. `defauts_structurels` — défauts **structurels** observés, codes séparés par espaces, parmi :
    `TITRE-NUM` (numérotation incohérente ou en double) · `TITRE-DATE` (titre daté ou « complément ») · `HORS-DOMICILE` (le type de contenu n'est pas celui du chapitre) · `MELANGE` (plusieurs types sans séparation) · `DOUBLON` · `SANS-ID` (règle sans identifiant) · `TABLEAU-COUPE` (tableau interrompu) · `ORPHELIN` (titre sans contenu ni sous-section) · `ALIAS` (alias de version « v13 », « Bip v2 »…) · `RENVOI-ABSENT` (règle d'un autre chapitre restatée sans renvoi) · `TROP-LONG` (section > 150 lignes sans sous-structure) · `AUTRE:<texte court>`.
11. `note` — une phrase au plus, factuelle (ce qu'il faut savoir pour décider de sa destination). Pas de tabulation.

## Règles

- N'invente aucun constat : chaque `recouvrements` et `defauts_structurels` doit être observable dans le texte.
- Ne tranche aucune contradiction ; marque `DIVERGENCE`.
- Le ch. 13 a ses contrats agrégés (un contrat = une section, 20 rubriques). Pour les contrats, `type` = `CONTRAT` ; signale dans `note` les rubriques qui portent du `RENDU`, des `REGLE` recopiées ou des `RECETTE`.
- Écris le fichier en UTF-8, fins de ligne LF, sans guillemets autour des champs, aucune tabulation dans les champs.
- À la fin, réponds en moins de 250 mots : nombre de lignes écrites (doit égaler le nombre de sections de ton périmètre), principaux recouvrements inter-chapitres repérés, et toute difficulté.

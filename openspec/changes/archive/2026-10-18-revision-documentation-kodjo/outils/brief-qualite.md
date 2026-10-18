# Brief commun — passe 2 : qualité de la spécification KODJO (lecture seule)

Dépôt : C:\Dev\KODJO-OPENSPEC-DOCS (base main 6656fefc). Corpus : docs/Specifications-fonctionnelles/01..13 (≈1,4 Mo), docs/PRODUCT.md, docs/INDEX.md, docs/README.md, docs/DSF-*.md. Ignorer docs/archives, docs/preparation, .github.
INTERDITS : ne modifier aucun fichier du dépôt ni d'un autre clone ; écrire seulement votre fichier de sortie dans le scratchpad.

Objet : évaluer la QUALITÉ de la spécification selon les bonnes pratiques d'ingénierie des exigences — PAS la conformité au format OpenSpec. Ne jamais présenter une convention OpenSpec (SHALL/MUST, `### Requirement:`, `#### Scenario:` WHEN/THEN, deltas ADDED/MODIFIED) comme une règle universelle. Si vous la mentionnez, la ranger dans une rubrique séparée « Écart au format OpenSpec (convention d'outil) ».

Référentiels (citer précisément la clause utilisée ; ne citer que ce que vous connaissez de façon sûre ; si un numéro de clause/règle est incertain, écrire « clause à vérifier ») :
- ISO/IEC/IEEE 29148:2018, Systems and software engineering — Life cycle processes — Requirements engineering : §5.2.5 caractéristiques d'une exigence individuelle (necessary, appropriate, unambiguous, complete, singular, feasible, verifiable, correct, conforming) ; §5.2.6 caractéristiques d'un ensemble (complete, consistent, feasible, comprehensible, able to be validated) ; §5.2.7 langage des exigences ; §5.2.8 attributs (identification, priorité, source, rationale…).
- INCOSE, Guide to Writing Requirements (GtWR), version 4 (2023) : caractéristiques C1–C15 et règles R1–R42 (citer le numéro seulement si sûr).
- IREB, CPRE Foundation Level Syllabus (version 3.x) : niveaux d'exigences, documentation, traçabilité, validation.
- ISO/IEC 25010:2023 (modèle de qualité produit) pour la couverture des exigences non fonctionnelles.
- A. Cockburn, Writing Effective Use Cases (2001) pour le contenu des parcours : acteur principal, préconditions, garanties, scénario nominal, extensions (variantes/erreurs/annulations).
- Aucune certification formelle n'est revendiquée.

Méthode : la revue est forcément partielle. Déclarer exactement ce qui a été lu (fichier, plages de lignes ou sections) et ce qui a été échantillonné ou mesuré mécaniquement (grep/compte). Une lecture partielle ne permet pas de conclure à la complétude globale : le dire.

Les incohérences entre sources sont traitées par une autre passe (cohérence) : ne pas les recenser ici, sauf comme illustration d'un défaut de maintenabilité.

Format de sortie Markdown :
1. Couverture réelle (tableau).
2. Pour chaque dimension attribuée : **bilan** (3–6 lignes, appréciation qualitative : solide / acceptable / faible, avec justification), **défauts concrets** (ID QX-NN, exemple exact verbatim ≤ 3 lignes avec `fichier:ligne` vérifié par grep -n, référentiel et clause, conséquence pour un développeur/testeur), **points forts** avec exemple.
3. Recommandations priorisées (P1/P2/P3) avec effort estimé (faible/moyen/fort).
4. 2 à 4 exemples AVANT/APRÈS : avant = texte exact du dépôt ; après = réécriture proposée en français, indépendante d'OpenSpec (une variante OpenSpec peut être ajoutée séparément). Les réécritures ne doivent inventer aucune règle : si une valeur manque, écrire [À CONFIRMER] au lieu de l'inventer.
5. Distinguer « manque démontré » (absence vérifiée par recherche, citer la recherche) et « sujet à confirmer ».

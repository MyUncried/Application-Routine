# Claude Code — KODJO, niveaux et recherche v6

Reprendre le chantier existant dans MyUncried/Application-Routine, avec BMAD et les stories en cours. Lire AGENTS.md, docs/INDEX.md, les chapitres 06/10/12/13 et la spécification KODJO-Niveaux-Recherche-Parcours-Regles-v6.md. Lire impérativement DSF-NIVEAUX-RECHERCHE-2026-10-25.md : les captures et références de composants y sont actuelles, les contradictions C01–C09 ne sont pas des décisions rendues.

Ne pas reconstruire l’application ni relancer VNext. Analyser le code effectivement présent et préserver les développements en cours. Réutiliser les composants et tokens existants ; les valeurs Figma non liées à un token sont identifiées, ne pas inventer une liaison. La carte Résultat 107 pt est distincte de la carte simple 80 pt. Le catalogue mouvements en piles reste une proposition, pas une route MVP obligatoire. La mission documentaire n’a ni changé le code ni prouvé sa conformité.

Implémenter les règles non contradictoires dans leur portée : état vide Niveau, progression linéaire sans plafond, variante explicite sans dialogue de correction, recherche nom/alias dédupliquée, actions internes de carte, Entrée sans sélection, paramètres indépendants, transfert de phases par rang, remplacement atomique d’occurrence, historique figé avec classification actuelle résoluble. Ne pas instaurer unicité, propagation aux copies ou nouveau seuil de dialogue sans décision explicite couvrant C01/C03/C04/C05. Recenser les dépendances aux arbitrages et poursuivre les travaux indépendants.

Base vierge autorisée : pas de migration des anciennes données. Relation active vers le mouvement avec intégrité ; filiation des copies immuable, sans cascade ; ne pas fusionner rétroactivement des identités par nom.

Les tests de recherche doivent être automatiques, exécutés dans la CI existante. Corpus R07 complet : exact, accents/casse, pluriels prudents, fautes, noms partiels, ordre des mots, alias, différences significatives. Tester résultats, ordre, déduplication et déclenchement de suggestion ; ne pas recopier la formule en guise d’oracle. Coefficients ajustables par le développeur contre ce corpus, sans nouveau réglage utilisateur. Ajouter chaque défaut réel corrigé au corpus.

Tester les quatre cas de transfert de phases, l’annulation intégrale, les paramètres conservés et l’immuabilité des exécutions passées. Contrôler aussi les interactions clavier et les cibles tactiles ; la capture Confirmer absent et celle Durées à compléter déjà renseignée sont des écarts documentés, pas des comportements à copier.

Livrer les changements réellement nécessaires avec tests adaptés et un compte rendu distinguant réalisé, vérifié, écarts Figma et arbitrages encore dépendants. Ne pas déclarer ces derniers clos sur la seule autorité d’une maquette.

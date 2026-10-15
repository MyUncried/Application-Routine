# Couverture des composants VNext

Toute nouvelle construction UI produit `component_coverage` et `component_bindings` (vide si aucun mapping n'est démontré). Aucun identifiant de tranche ni commutateur d'activation ne sélectionne ce mécanisme. Les contrats historiques sans ces champs se reconstruisent dans leur format exact ; ils ne sont ni migrés ni approuvés implicitement.

## Obligations conservées

Le catalogue intégral, les identifiants d'assertion, les sources et leurs empreintes restent présents. Les niveaux `COMPONENT_COMMON`, `INSTANCE` et `INTEGRATION` indiquent la responsabilité de vérification. `instance_checks` rend explicites l'identité, la variante, les paramètres, bindings et la disponibilité du relevé de surcharges pour chaque instance. Un contrôle d'instance référence son critère direct ; un inventaire de propriétés conservé ne vaut pas revue.

Les positions, adaptations, contenus, comportements et obligations d'accessibilité propres à l'écran restent directs. Les paramètres sans preuve de dépendances et les instances comportant des surcharges restent actuellement directs par prudence. Une instance détachée, un descendant dont la correspondance au maître n'est pas corroborée, une capture sans `overrides`, un mapping absent ou un candidat non existant ne peuvent bénéficier de l'héritage.

## Mappings et qualification commune

`componentBindings` est une donnée de préparation, jamais une autorisation : `source_id`, `element_id`, `master_id`, `code_path`, `code_export`, `usage_paths`, `evidence_refs`. Le chemin et l'export doivent correspondre au composant sélectionné par le critère, et les chemins d'usage à des fichiers de code existants du candidat. Le reviewer doit vérifier cette correspondance réelle, les usages, variantes, paramètres et bindings ; une déclaration de mapping seule ne couvre rien.

Une propriété est candidate à l'héritage seulement si la filiation vers le maître, sa valeur, son observable, les bindings et les modes correspondent et que la capture explicite ne révèle aucune surcharge. Les variantes ont des maîtres/propriétés canoniques distincts. Une propriété commune peut être examinée sur une assertion du maître déjà exigée, ou sur une occurrence canonique explicitement mappée lorsque les maîtres sont des observations conservées. Aucun nouveau besoin produit n'est déduit d'une observation de maître.

## Deux phases séparées

En revue du plan, `inheritance_links` décrit une couverture **conditionnelle**. Le contrôleur dérive `inherited_target_ids` uniquement si la réponse réellement archivée atteste l'examen direct de la propriété canonique et des critères de mapping commun/instance. Les cibles héritées ne sont pas ajoutées à `reviewed_target_ids`. Toutes les autres cibles restent exigées. Le seuil des omissions secondaires est inchangé. Le reçu conserve la réponse brute, sa session, ses empreintes et le contexte exact. Cette couverture n'atteste aucune conformité d'implémentation.

En revue d'implémentation, la qualification est refaite contre le HEAD de livraison exact. `component_review.mapping_facts` matérialise les octets Git du composant et des usages. Le reviewer restitue `component_mapping_observations` avec les fichiers effectivement observés et leur version. L'héritage nécessite `MATCH`, la couverture canonique et les deux mappings ; un mapping absent, altéré ou `MISMATCH` ne peut produire une approbation. Le reçu archive séparément assertions directement examinées et assertions héritées, signature de livraison et empreinte des observations. Sa relecture et son déplacement revalident les mêmes données ; la revue de plan ne remplace jamais cette qualification.

Les mesures de conformité et les preuves fonctionnelles/accès/appareil restent exigées propriété par propriété par leurs validateurs. Leur production automatique peut rester exhaustive sans imposer une nouvelle revue indépendante de chaque propriété commune. La finalisation conserve ses contrôles techniques et ses portes humaines ; aucune preuve visuelle, appareil ou accessibilité n'est fabriquée par ce mécanisme.

## Validité et limites actuelles

Les références Figma, maîtres/variantes, variables, bindings, règles et arbre de code sont liés par empreinte au contexte ; la qualification d'implémentation lie en plus les octets réellement observés et le HEAD de livraison. Toute modification rend l'ancien reçu impropre à certifier le nouveau contexte. Les reçus anciens restent archivés, jamais réécrits. La réutilisation du reçu/résultat d'une même opération conserve les protections de cache, intent et déduplication.

La granularité d'invalidation est conservatrice : un changement de paquet figé ou d'arbre de code peut invalider davantage que le seul composant affecté. L'import entre contextes est désormais pris en charge par vnext-qualified-component-import : l'ancien reçu brut est revalidé, le dépôt et les octets applicatifs doivent correspondre, et la signature inclut fichier Figma, maître, règles, tokens, ressources et mapping. Seules les assertions communes canoniques sont importables ; les mappings courants et l'intégration restent directement examinés. Un changement de code ou de token invalide l'import. Une ancienne source peut être relue dans un worktree temporaire détaché au HEAD exact, sans mutation ni nouvel appel modèle. Les sources qualifiées sont des références de preuves, jamais un opt-in de tranche. Aucune source ancienne non qualifiée n'est promue automatiquement. Le cumul existe pour la planification et l'implémentation ; la réception Work doit toujours être prouvée en fonctionnement réel.

Sur PRE-4, le rapport d'impact versionné au HEAD `211a9a59` constate 180 526 assertions conservées, zéro capture explicite des surcharges parmi les 680 instances et zéro mapping qualifié enregistré. Il ne justifie donc aucun héritage effectif ni réduction. Les égalités de valeurs observées sont des candidats d'analyse, pas des preuves.

## Analyse préalable aux grands dossiers

`componentReuseDecisions` permet de consigner une vérification étayée concluant `DIRECT_JUSTIFIED` pour un maître (`source_id`, `master_id`, `reason`, `evidence_refs`). C'est une donnée contrôlable du dossier, pas une couverture ni une approbation. Le constructeur signale les composants répétés dont les surcharges ou le mapping restent non qualifiés dans `reuse_assessment`. Une nouvelle grande revue ne contourne pas cette analyse en lançant simplement le cumul : les sources/mappings manquants doivent être qualifiés ou les vérifications directes justifiées. Aucune règle de tranche ne sélectionne ce contrôle.

La portée cumulative est scellée avec la demande et sa capacité bornée. Les réponses partielles ne peuvent être consommées comme reçus finaux. Le ledger au chemin commun dérivé du contexte garde ses preuves et observations ; une réponse sans progrès ou un contexte modifié ne permet pas une nouvelle invocation identique.

## Cumul de la revue d'implémentation

Le relais commun dérive une portée de la version exacte du dossier, conserve les réponses brutes, statuts de processus, sessions, constats, observations de mapping et couverture réellement lue. Les réponses partielles portent REVIEW_INCOMPLETE ; elles ne sont jamais des approbations. Le contrôleur consomme un ledger avant la portée suivante. La dernière agrégation utilise les validateurs de revue existants et n'appelle aucun modèle. Les contextes d'implémentation sont identifiés par leur propre dossier_hash, pas par un hash de planification absent.

Les critères de préservation et les scénarios restent directs. Un mapping MISMATCH réintroduit les propriétés conditionnelles dans le travail restant ; il ne peut pas faire disparaître ces obligations. Les imports qualifiés couvrent seulement le commun canonique et exigent encore le mapping commun courant MATCH. L'agrégat garde les vraies sessions séparées, sans session synthétique.

Les commits de preuves/ledgers peuvent suivre le HEAD applicatif : seule une différence limitée aux métadonnées exactes déclarées et effectivement lues est admissible ; tout changement applicatif reste refusé. Les fichiers, head et signatures de livraison sont toujours revalidés. Les contrats et snapshots historiques restent inchangés.

Les surcharges explicites portant uniquement sur le nom du calque sont conservées comme métadonnées. Elles n’interdisent pas l’héritage d’un autre observable inchangé ; une assertion portant sur ce nom reste directe. Toute autre surcharge, provenance malformée ou dépendance de paramètre non qualifiée reste traitée directement.

# VNext — restauration du retour commun vers Work

## Demande et baseline

Hermann demande de rétablir le réveil automatique par synchronize, commun aux tranches, après constat de sa disparition du relais PRE-4. Travail depuis main e844b55fddf23ffb648108fa56c423ccd1f4a7f9 ; correction #355 déjà intégrée et qualifiée. Aucun code produit ni PlanContract modifié, aucune nouvelle certification ou appel Claude.

## Historique causal

Le transport GitHub → PR synchronize → Work avait été démontré dans la configuration V1.3 (T1–T9, PR#19). L'ancienne automation « KODJO GitHub Transport » est encore activée mais liée à cette PR et à son ancien fil. Le signal de cycle VNext dans signal-vnext-cycle-continuation.js est lié en dur à la campagne VNEXT-12-QUALIF et à#269. Les deux ne démontrent pas un réveil de PRE-4.

Les ajouts du relais88a83368 puis50415ae3 ont explicitement laissé le réveil non raccordé ; les documents du relais l'indiquent. Les tests portent sur exécution/cache/archive, pas sur la réception Work. L'écart ne vient pas d'une nécessité propre à une tranche : c'est une lacune de raccordement. Aucun succès historique n'est effacé ni reclassé.

## Réalité du dernier run

Run38465662376, job115531699206, FAILURE après appel Claude réel. La réponse est conservée : sessionbc292af0-5ef7-41be-961c-245cbc7daff3,729événements,155tours, processus status0, duration1176764ms. Refus final VNEXT_REVIEW_COVERAGE_INCOMPLETE, model_invoked:true. Six constats partiels ; ranges4996cibles sur236896. Ni APPROVE ni revue complète. Le signal ne doit pas transformer ce refus en non-invocation ou autoriser un deuxième appel sur le même paquet.

Archive11852478408 : ZIP36285octets, SHA-2566e6b45bec633e1c53546917f3d36450b00777c72b61dff51590edccc87dcf116. Téléchargement physique/hash, manifeste/fichiers et failure/checkpoint vérifiés par le validateur du relais. Le nouveau constructeur de signal vérifie aussi demande/bootstrap/activation/run/archive sur ces preuves réelles, sans publication ni appel modèle : VERIFIED_REAL_RESULT. La restitution durable de cette revue partielle est rattachée à la branche de plan existante.

## Raccordement concret

Une PR de transport commune#356, branche orchestration/vnext-work-signals, est créée sans code métier. Cette PR reste ouverte et n'est pas une livraison de tranche. Aucune référence de tranche n'est codée en dur dans le publisher.

La capacité d'événement GitHub est découverte sur la connexion autorisée. Son schéma prend en charge les mises à jour de commit des PR. Une lecture authentifiée de#356 vérifie son auteur MyUncried. Automation « Piloter VNext » créée et activée dans la conversation6ac7f420-2fd8-83eb-83ae-4c72a07603a5, avec trigger PR#356/authorMyUncried/enable_commit_updates:true, sans cadence indépendante. L'ancienne automation historique n'est ni modifiée ni présentée comme celle du parcours courant. Le binding exact figure dans KODJO_VNEXT_WORK_TRANSPORT.json.

Le nouveau workflow réagit aux résultats du relais commun après leur archivage. Un contrôle publish/<run_id>.json permet de signaler un résultat terminé avant intégration, sans rejouer la revue. Un seul publisher vérifie et émet dans les deux cas. Il publie un seul fichier de signal isolé, par commit non forcé, avec déduplication demande/opération/run/tentative. Branche déplacée, signal conflictuel, destination fermée/étrangère ou preuve altérée sont refusés. Les droits contents:write sont limités au job sérialisé publish-signal ; les deux producteurs exacts sont déclarés dans la politique existante. Rien n'est supprimé de ses protections historiques.

L'automation exige accusé durable [VNEXT_WORK_SIGNAL_RECEIVED]/[VNEXT_WORK_SIGNAL_PROCESSED], contrôle d'opérations actives, vérification du reçu métier, puis poursuite jusqu'au gate propriétaire. Le signal garde semantic_validation_required:true ; il n'accorde aucune autorisation de développement.

## Contrôles

- 9tests du nouveau transport PASS : deux tranches distinctes et trois opérations, échec partiel après modèle, preuves incohérentes, fork/acteur/état refusés, activation exigée, signal idempotent, branche déplacée sans push, chemin de signal refusé, digest ZIP, symlinks et traversal refusés avant extraction.
- 60tests transport/relais/entrée compatible/ancien signal/sécurité des écritures PASS avant dernière extension des assertions de refus ; les9tests étendus repassent sans erreur.
- Archive PRE-4 réelle acceptée par le constructeur sans masquer son échec sémantique ; aucun nouveau modèle invoqué.
- Scanner NO_UNDECLARED_REMOTE_WRITE_CAPABILITY ; YAML indépendant75workflows acceptés ; syntaxe Node et git diff --check PASS.
- CI du candidat de raccordement à suivre avant intégration.

## Limites et jalons

Configuration Work confirmée, mais réception courante NON ENCORE DEMONTREE. Le commit de signal devra être émis sur le résultat réel existant après intégration du publisher et doit produire un accusé durable dans cette conversation. Aucune qualification de réveil déduite des tests simulés ou d'une automation créée.

Archive absente/altérée/sans provenance : publisher en échec technique visible, pas de signal métier ni retry modèle. Le fonctionnement de cette récupération reste à tracer, pas à annoncer conforme. Le défaut de couverture PRE-4 est distinct et n'est pas corrigé par le réveil ; ses six constats doivent être vérifiés et sa lecture complète obtenue selon le protocole, sans fabriquer une couverture.

Fichiers : workflow/publisher/tests nouveaux, binding et contrat de retour commun, politique des seuls deux writers nouveaux, manifeste et documentation du relais/continuité. Commit exact et CI sont liés par la PR de correction ; la branche de transport reste distincte. Le dépôt applicatif et le plan0ef1ec59 restent inchangés. Pas d'action PowerShell, de fermeture ou de redémarrage demandé à Hermann.

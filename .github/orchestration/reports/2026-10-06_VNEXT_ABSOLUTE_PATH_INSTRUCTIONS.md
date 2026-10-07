# VNext — résolution explicite des fichiers et relance réelle

Mission : appliquer la précision demandée après le run 37535461703 et relancer directement FIGMA_INITIAL. Départ local `33a7f304c49428661ea8cd21cb6d06afe1a8cd75`, branche `protocol/vnext-proof-stability-20260930`, parent distant `0386a31cffb7e5452adefca2d6403ad55f9cd682`.

Diagnostic et comparaison historique conservés dans `2026-10-06_VNEXT_DIAGNOSTIC_37535461703.md`. Le run précédent a refusé le plan avant développement. Les consignes pertinentes étaient identiques à celles approuvées au run 37520798420. Le programme des sondes utilisait déjà des chemins absolus ; le plan n'explicitait pas la résolution pour le test à générer. Ce point appartient aux corrections du contrat de preuve, pas au correctif des empreintes ni à une optimisation de durée.

Correctif limité à la consigne canonique `Functional.EXPECTED` : résolution des deux modules par le parent depuis `__dirname`, passage de leurs chemins absolus aux enfants après leur source inline et lecture de `process.argv[1]` / `process.argv[2]`. Une seule méthode est indiquée. La description des sondes indépendantes indique leur comportement déjà existant. Le plan généré reprend cette même consigne par le mécanisme existant ; aucun nouveau contrôle bloquant, fichier auxiliaire, dépendance ou navigateur ajouté.

Nouvelle règle permanente utilisateur consignée dans CLAUDE.md : ne plus relancer le test jetable. Instruction complémentaire du 7 octobre à 00:00 Paris : ne plus lancer non plus les qualifications Linux/Windows. Aucun parcours Claude préalable, aucune étape EXECUTE_* ou QUALIFY_ONLY. FIGMA_INITIAL utilise désormais qualification_policy=DIRECT_REAL_USER_REQUEST ; le job admission-controls est sauté, et le runtime ne réclame plus de run de qualification. L'historique reste conditionné au succès du réel. Identité du runner, tête Git distante, demande unique et protections pendant le réel restent vérifiées. Aucun précheck jetable local lancé. Aucune modification applicative, PRE-1 ou audit d'architecture.

Une qualification 37537230990 avait été lancée avant cette instruction complémentaire : elle ne sera pas utilisée pour l'admission. Le connecteur ne dispose pas de capacité d'annulation de run ; une annulation n'est pas revendiquée. Aucun autre run de qualification ne sera lancé.

Vérifications : syntaxe et publication locales uniquement. Relance directe du réel en cours ; identifiants et résultats seront complétés. Aucun succès réel revendiqué ; le contrôle déterministe des empreintes reste à exercer après développement.

Fichiers modifiés : `scripts/kodjo/lib/vnext-disposable-functional-contract.js`, `CLAUDE.md`, présent rapport ; la demande et le checkpoint seront mis à jour pour la nouvelle exécution. Aucun contrôle sur appareil ni inspection visuelle applicable au test du protocole. Le commit de livraison et l'état Git final seront communiqués à la clôture.

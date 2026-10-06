@docs/AGENTS.md
@.github/AI_ORCHESTRATION.md
@.github/AI_ORCHESTRATION_CONTINUITY.md

## Livraison documentaire obligatoire de chaque mission

Toute mission Claude, quelle que soit sa nature — diagnostic, audit, développement, correction, revue, test ou investigation — doit produire ou mettre à jour un rapport Markdown versionné dans le répertoire de rapports défini par le projet (`.github/orchestration/reports/`).

Cette obligation est une condition de clôture permanente.

Une réponse affichée uniquement dans la conversation, le terminal, une synthèse GitHub ou un commentaire ne constitue pas un livrable.

Le rapport doit contenir au minimum :

- identifiant et objectif de la mission ;
- branche et commit de départ ;
- périmètre demandé ;
- périmètre réellement traité ;
- constats ;
- preuves et tests ;
- hypothèses non démontrées ;
- modifications réalisées ;
- éléments non corrigés ou hors périmètre ;
- vérifications restant à effectuer sur appareil réel ;
- fichiers modifiés ;
- commit final ;
- état Git.

Règles selon le type de mission :

- **diagnostic, audit, revue ou test sans correction** : aucun fichier applicatif ne doit être modifié ; le rapport Markdown constitue une modification documentaire expressément autorisée et doit être committé ;
- **développement ou correction** : le rapport Markdown doit être inclus dans le commit de livraison ou dans un commit documentaire final explicitement rattaché au commit de code ;
- **mission bloquée ou interrompue** : un rapport d'état doit être produit et committé avant l'arrêt, sauf impossibilité technique démontrée.

Aucune instruction ponctuelle interdisant les modifications, les commits ou les livraisons ne suspend implicitement cette obligation.

Les expressions telles que :

- « ne modifier aucun fichier » ;
- « diagnostic seul » ;
- « ne créer aucun commit » ;
- « analyse uniquement » ;

doivent être interprétées comme :

- ne modifier aucun fichier applicatif ;
- ne committer aucune modification applicative ;
- créer et committer néanmoins le rapport documentaire obligatoire.

Cette obligation ne peut être suspendue que par une instruction explicite contenant exactement :

`EXCEPTION EXPRESSE — AUCUN RAPPORT DE MISSION`

En cas de contradiction ou d'ambiguïté, Claude doit demander un arbitrage avant de clôturer la mission.

Claude ne peut déclarer une mission terminée qu'après avoir fourni :

1. le chemin exact du rapport ;
2. le hash du commit qui contient le rapport ;
3. l'état Git final ;
4. les résultats des tests ou la mention explicite qu'aucun test n'était applicable.

Convention de nommage : `YYYY-MM-DD_<identifiant-de-mission>.md`.

Ne pas remplacer ou écraser les rapports antérieurs correspondant à une autre mission.

> Note de consolidation (2026-09-03) : cette section remplace et rend normative la règle jusqu'ici uniquement conversationnelle appliquée depuis `T01_S01_S08_CONFORMITY_AUDIT_20260902.md` (jamais écrite dans un fichier suivi avant ce jour). Les deux rapports déjà produits sous l'ancienne convention informelle (`<PERIMETRE>_<TYPE>_YYYYMMDD.md` : `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`, `T01_INTERACTIVE_CONTROLS_DIAGNOSTIC_20260903.md`) n'ont pas été renommés — un renommage changerait des chemins déjà référencés ailleurs et n'a pas été explicitement demandé. La convention `YYYY-MM-DD_<identifiant-de-mission>.md` ci-dessus s'applique à tout nouveau rapport à partir de cette consolidation.

## Diagnostic historique obligatoire de VNext

### Parcours demandé : pas de relance du test jetable

Instructions utilisateur des 6 et 7 octobre 2026 : ne plus relancer le test jetable ni les qualifications Linux/Windows ; passer directement au parcours réel après correction. Ne lancer aucun parcours jetable, préflight jetable, session Claude préalable, matrix de qualification ou audit d'architecture préalable. Pour la tâche 2, utiliser FIGMA_INITIAL avec qualification_policy=DIRECT_REAL_USER_REQUEST : select-stage puis Real Figma INITIAL, sans admission-controls ni qualify-driver. Les vérifications de syntaxe et de publication restent des vérifications locales de fichiers ; elles ne doivent pas déclencher les suites de qualification. Conserver les protections d'identité du runner, de tête Git, de demande unique, de portée et les vérifications exécutées pendant le parcours réel. Aucun navigateur ni contrôle visuel. L'historique ne démarre qu'après succès du réel. Ne pas présenter une qualification comme une preuve du réel.

### Validation visuelle : règle utilisateur du 6 octobre 2026

Le parcours de test VNext, ses qualifications automatiques et ses tests historiques ne doivent lancer aucun navigateur ni contrôler automatiquement un rendu HTML, une géométrie, des pixels ou des captures. Aucun contrôle visuel humain n’est non plus requis dans les tests jetables ou réels du protocole. Les vérifications visuelles réalisées exclusivement par l’utilisateur concernent le développement du produit, pas une étape de ces tests. Une lecture de sources Figma n’est pas une validation visuelle. Ne jamais déclarer une preuve visuelle PASS à partir des tests fonctionnels. Toute réintroduction d’un navigateur, d’un contrôle automatique de rendu ou d’un gate visuel humain dans ces tests nécessite une nouvelle autorisation utilisateur explicite ; une réserve de revue ne l’autorise pas.

Instruction utilisateur du 6 octobre 2026 : pour chaque échec ou régression VNext, comparer systématiquement l'historique avant de définir un correctif. Identifier le parcours exact, sa dernière preuve de succès comparable, le premier échec conservé, les commits introduisant le mécanisme et ceux le corrigeant. Distinguer introduction du défaut et détection. Séparer optimisation de performance, transport, preuve, contrat et nettoyage, même dans un commit mixte. Citer commits et runs ; vérifier les sources et les preuves conservées. Classer l'attribution comme démontrée, plausible ou indéterminée ; ne pas attribuer automatiquement un défaut récemment détecté à l'optimisation. Une qualification verte ou le succès d'un autre scénario ne remplace pas le parcours comparable. Si une preuve manque, l'indiquer et proposer la vérification ciblée nécessaire. Consigner cette analyse dans le rapport de mission avant correction ou relance ; conserver les anciens succès et échecs sans les reclasser.

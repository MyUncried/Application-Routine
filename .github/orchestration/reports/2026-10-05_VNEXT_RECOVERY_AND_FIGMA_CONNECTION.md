# VNext — reprise, coûts et raccordement Figma : diagnostic et conception
Date : 2026-10-05. PR #269. Code examiné : `3ca40be0acf2001a59119ddfbec93c8ec171414a`.
Campagne existante : `628b3349-88b4-4bf1-be6b-50bc09e7d245`, tranche `VNEXT-12-QUALIF`.
Ce document enregistre des preuves initiales et la conception à poursuivre. Il ne qualifie aucun raccordement ni aucun nouveau candidat. Aucun code exécutable ou workflow modifié à ce point.

## 1. Récupération et portée
PR ouverte, draft, head `protocol/vnext-proof-stability-20260930` au commit ci-dessus ; base `protocol/vnext-f01-remote-write-security-20260930`, pas main. Clone propre de ce head ; absence de diff local/distant du workflow. Cela ne prouve pas l'absence de changements non publiés dans le workspace de l'ancienne conversation ou sur le PC de l'utilisateur : NON VÉRIFIABLE.
GitHub ne retourne aucun run in_progress. Un run V2 ancien est queued : 34748621746, créé le 13 septembre, laissé intact. Aucun nouveau workflow, contrôleur, gate, réaction d'approbation ou appel Claude lancé pendant cette reprise.
Request existante : QUALIFY_ONLY, génération 43, preparation_generation 17, revision_limit 1, final_audit_authorized false. Le checkpoint conserve controller_generation 51, une autre notion : ne pas les assimiler.

Les décisions du prompt joint sont les autorisations courantes : étapes 1–5 et raccordement Figma dans la même campagne ; interdiction de toucher PRE-2, V2, #303, main ou l'activation ; aucune nouvelle campagne ; approbations et règles métier inchangées. La consolidation du code reste un sujet ouvert NON AUTORISÉ.
Le découpage en dix étapes est fourni par ce prompt et évoqué dans les rapports existants. Aucun plan original autonome détaillé en dix étapes n'a été retrouvé dans les rapports/checkpoint ni les commentaires accessibles de #269. Les détails absents ne sont pas reconstruits. Les anciennes cinq étapes du corps de PR/checkpoint ne remplacent pas les dix étapes demandées.

## 2. Durées : preuves distinctes
Run [37214491253](https://github.com/MyUncried/Application-Routine/actions/runs/37214491253), head exact, job Windows 111472501770 : début 16:21:01Z, fin 17:21:31Z.
Le workflow versionné impose encore timeout-minutes: 60 à protocol-windows-preflight. Les logs terminent par « The operation was canceled » à 17:21:10Z. La limite et les horodatages établissent une coupure à la borne globale ; le mécanisme serveur interne d'annulation n'est pas directement journalisé.
| Phase | Début UTC | Fin UTC | Durée | Observation |
|---|---|---|---|---|
| Suite pilote Windows | 16:22:38 | 17:16:43 | 54 min 05 s | 1016 tests : 1012 PASS, 0 FAIL, 4 SKIP |
| Banc PowerShell 5.1 | 17:16:43 | 17:18:25 | 1 min 42 s | SUCCESS ; services/modèle de fixture |
| Préflight jetable | 17:18:25 | 17:21:10 | 2 min 45 s | CANCELLED ; explicitement sans Claude |
Ne pas additionner les durées individuelles des tests : exécution concurrente et affichage groupé. Les plus longues durées rapportées : live chain large catalog 691,1 s ; intégration après recette 683,6 s ; transmission approved revised plan 591,3 s ; composition chaîne réelle avec services injectés 578,2 s ; publication révision 567,4 s ; ancien plan Git réel 530,5 s. Ces tests utilisent des processus Git/Node, copies de fixtures et adaptateurs injectés : leurs noms « real » ne signifient pas appel réel Claude.
Les coûts par opération Git/copie/processus, CPU, mémoire, contention et attentes réseau ne sont pas encore profilés. La cause de la lenteur interne des fixtures reste À MESURER ; aucun antivirus ou problème machine n'est affirmé.
La sortie PowerShell « Passage en mode débogage » apparaît près de l'annulation ; elle ne démontre pas une autre cause ni un blocage antérieur.

Les appels réels Claude sont dans les préparations/revues INITIAL/REVISION et les exécutions explicitement sélectionnées, pas dans ce préflight sans Claude. Dans le run drivers 37214491263, prépare-initial, prépare-revision et exécution sont SKIPPED. Aucun coût Claude ne peut être imputé à ce run pilote sur cette base.
Le rapport versionné 2026-10-04_VNEXT_REVIEW_TRANSPORT_AND_DIAGNOSTICS.md mesure 756620 → 370412 octets avant consignes, 1186 cibles préservées (environ 51 % d'allègement). Cette mesure est enregistrée, non remesurée ici depuis l'artefact original. Le code compactReviewDossier est présent. INITIAL conserve 600000 ms, REVISION 900000 ms. L'efficacité en durée après compactage n'est pas démontrée. Le timeout Claude antérieur et le timeout job Windows sont deux incidents distincts.
La hausse annoncée du budget du pilote Windows n'est pas publiée sur ce head. Le job contrats VNext a bien 40 min. Aucun délai n'est augmenté dans cette reprise.

## 3. Qualification du candidat examiné
| Axe | Statut vérifié | Limite |
|---|---|---|
| Pilote Linux 37214491253 | SUCCESS | Résultat job, pas certification réelle complète |
| Suite Windows et banc | SUCCESS avant coupure | Préflight Windows incomplet |
| Contrats/historique 37214491288 | 4 jobs OS SUCCESS ; couverture interplateforme SUCCESS | architecture-audit SKIPPED |
| Drivers 37214491263 | Linux/Windows SUCCESS | Préparations/exécution SKIPPED |
| UI atomicité ciblée locale | 15 PASS, 0 FAIL, 0 SKIP | Tests synthétiques, pas Figma/Claude/appareil |
| Parcours du candidat actuel | NON DÉMONTRÉ | INITIAL, REVISION, après recette et réveils restent requis |
Les anciens chiffres 1011 PASS, 24 PASS et 78 PASS sont ceux de contrôles distincts enregistrés ; ils ne sont ni additionnés ni réexécutés ici.

Les correctifs précédents sont présents dans les consommateurs inspectés : compactage/délai/diagnostics dans vnext-live-chain ; archivage et recoverReview sans rappel ; origine ACCEPTANCE_GAPS et baseline conservée ; vérification des trois fichiers approuvés ; vue temporaire assertView/restore/recover dans vnext-runtime-plan ; lecture Git liée et consommation/verrous existants. Leur portée réelle de bout en bout sur ce head reste NON DÉMONTRÉE. Le diagnostic antérieur des autres correctifs est conservé ; ce rapport n'est pas une nouvelle certification exhaustive de chaque correctif.

## 4. Figma actuel : extraction initiale contrôlée
Référence : [Ajouter un exercice — Zones corporelles](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Routine?node-id=4478-7209), page 510:101.
Rapport initial lu intégralement : 2026-10-05_FIGMA_ZONES_CORPORELLES_MODAL_READ.md, libfile_742119628490819195c3753cb7a46e28. Il demeure une extraction initiale, pas une certification.
Lecture directe Figma en mode lecture seule : inventaire de 149 nœuds, y compris fond, éléments invisibles, voile et modale ; propriétés récupérées en 15 lots de 10/9 nœuds ; onze maîtres identifiés avec leurs variantes disponibles ; 28 variables liées lues ; trois ressources SVG d'actions exportées ; capture PNG 402×874.
Deux réponses initiales furent tronquées vers 20 Ko malgré isError=false, avec JSON incomplet : rejetées. L'inventaire compact et les lots suivants sont parsables, terminés par end:true et contrôlés contre leurs identifiants demandés. Ne pas confondre ceci avec une preuve que la collecte Figma est entièrement résolue.
Le téléchargement par URL de la capture a renvoyé HTML de 195 octets malgré exit 0 ; rejeté et supprimé. Capture obtenue ensuite par réponse inline, signature PNG contrôlée. Une réponse HTTP/outil positive n'atteste pas le contenu.
Voile 4953:6605 : calque opacity=1 ; peinture opacity=0.3400000035762787 (34 %). Cette valeur lève la réserve précise du rapport initial. Modale 4953:6606 : 402×254 à (0,620), effects=[] ; contenu 4953:6613 : layoutMode=NONE. Aucune règle responsive n'est déduite des coordonnées.
L'export courant des actions a des boîtes SVG différentes de l'export initial : annuler 53×58, valider 56×58 ; boîtes tactiles Figma 48×53 et disque Ø38 inchangés dans ces données. Ne pas utiliser une ancienne boîte d'export comme dimension du contrôle.

Preuves locales versionnées dans ../vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/ : observed-frame.json, variables.json, actions.json, frame.png et integrity.json.
Limites : descendants des maîtres et propriétés détaillées des autres variantes non extraits intégralement ; liens aliases variables à résoudre si requis ; ressources du fond non exhaustives ; règle de retour à la ligne précise et états pressés/désactivés non établis. Aucun choix de réalisation/conservation/exclusion finalisé. Ce paquet ne peut être étiqueté READY pour planification.
Un rapprochement initial est enregistré dans documentary-reconciliation.json : chapitre 13 courant lu à main b961719cd3e22704709d7c75c12b0a286bade2f1, CE-UI-09 et §4.2. Les libellés/choix montrés sont dynamiques/démonstratifs ; sélection multiple puis confirmation, annulation restaure la sélection antérieure ; viewport 402 et contrôles 360/402/440 ; coordonnées non copiées en positions absolues ; scroll et focus modal ; états vide/enrichi/retiré/création/erreur requis au-delà de cette seule frame. Les bounds d'instances de 48 hauts sont espacés verticalement de 38 : ils se recouvrent de 10, mais ne prouvent pas à eux seuls une cible tactile native. Le rapprochement avec la règle ≥44 sans chevauchement doit être explicite, sans inventer l'équivalence bounds=cible ni un comportement observé sur appareil. Ce rapprochement partiel ne ferme pas les adaptations ni toutes les contradictions transverses.
L'accès de cette session à Figma ne prouve pas celui du runner ni l'utilisation effective par Claude.

## 5. Lacunes démontrées et conception du raccordement
Existant à réutiliser : source-manifest (FIGMA, autorité VISUAL, unités et fingerprints), requirement-registry (couverture SOURCE_UNIT), planning-envelope ; impact/plan/UI/review/approval ; artefacts figés et vue runtime ; receipts/reprise/consommation existants.
Lacune certaine : observeSources dans vnext-live-chain.js refuse FIGMA et OTHER par WAIT_FOR_PROOF. Pas d'adaptateur d'observation figée consommable dans cette chaîne réelle.
Lacune certaine : normalizeAssertions valide une chaîne expected non vide ; visualCriterion dans vnext-ui-atomicity.pilot.js contient « La géométrie correspond à la référence Figma. », et le test de construction passe. Le mécanisme contrôle la structure et la couverture des changements/proofs déclarés, pas l'exhaustivité de la frame ou la précision des propriétés.

Conception à implémenter, sans schéma concurrent aux contrats d'écran :
1. Collecte après choix des écrans/états, avant plan : inventaire indépendant des assertions, fermeture hiérarchique, pagination/lots explicitement complets, maîtres/variantes/styles/variables et ressources nécessaires. Conserver données brutes puis manifeste d'intégrité ; refuser réponse tronquée, propriété inaccessible, identité/count/hash incohérent. Une sortie technique ne constitue pas un choix produit.
2. Figement par objets Git et hashes : fileKey, frame/état, noms, timestamp de collecte, content hashes et ressources archivées. Utiliser l'empreinte observée si version serveur indisponible. Chaque consommateur/admission/reprise est lié au même paquet ; aucun fallback vers Figma courant. Un changement ultérieur ne remplace pas la référence approuvée ; nouvelle extraction et requalification proportionnée seulement via les transitions existantes.
3. Chaque élément de l'inventaire reçoit REALIZE/PRESERVE/EXCLUDE avec raison, liens documentaire et décision si pertinent. Chaque propriété nécessaire reçoit valeur exacte ou contrainte relationnelle/adaptive observée dans une source identifiée. Les valeurs X/Y d'une frame restent observations au viewport indiqué. Les inconnues restent bloquantes/À CLARIFIER tant que les sources ne les résolvent pas.
4. Rapprochement selon la hiérarchie validée : Figma présentation ; documentation comportement/navigation/persistance. Un conflit mixte exige une résolution explicite référencée ; le bouton présent mais supprimé fonctionnellement ne peut être décidé par le planificateur.
5. Générer les unités source et exigences/assertions depuis cet inventaire traité, dans la chaîne existante. Contrôler à l'entrée de plan la totalité des éléments/propriétés requis, puis mapping bijectif ou explicite justifié vers exigences/assertions, plan/proofs et observation d'implémentation. La simple présence d'un champ et un filtre lexical sont insuffisants. Préservation et réemploi exigent preuve visuelle contre la cible, pas seulement nom du composant.
6. Remettre planificateur, implémenteur et reviewer au même paquet identifiable. Le plan exact et sa vue runtime doivent référencer les ressources complètes réellement accessibles ; le reviewer reçoit cette même identité. Mesurer octets/tokens/ressources, dédupliquer par hash et contrôler les chemins locaux, sans incorporer répétitivement tout le paquet dans plusieurs narrations et sans troncature. Accessibilité technique puis usage réel par Claude sont deux preuves distinctes.
7. Qualifier les neuf cas demandés dans cette campagne : omissions, assertion vague, divergence référence, conflit mixte, réemploi incorrect, variante oubliée, accès/troncature, changement après APPROVE, ressources effectivement utilisées. Les tests synthétiques peuvent qualifier les refus contractuels ; seules traces réelles liées au candidat/paquet établissent utilisation/reprise.

## 6. Suite et points ouverts
Étape 1 reprise : faits courants établis ; profil détaillé des coûts et historique non retrouvé restent limites.
Étape 2 : conception de raccordement enregistrée, rapprochement source et détails d'intégration encore à terminer.
Étapes 3–4 : adaptateur, couverture propriétés/inventaire et transmission pas implémentés ; neuf scénarios pas qualifiés. Aucun code incomplet présenté comme livré.
Étape 5 : aucun candidat consolidé Figma publié/qualifié. Aucune relance isolée qui certifierait l'ancienne version à sa place.
Étapes 6–8 : parcours réels, réveils de ChatGPT et audit final exact ouverts. Aucun signal envoyé n'est une preuve de réveil.
Étapes 9–10 : promotion préparée puis activation seulement avec autorisation finale ; main et PRE-3 interdits avant qualification requise.
Sujet ouvert non intégré : consolidation de modules entiers/outils de review/profiling appareil. Aucun outil installé, aucune campagne créée.

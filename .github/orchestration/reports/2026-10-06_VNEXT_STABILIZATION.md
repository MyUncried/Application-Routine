# VNEXT-STABILIZATION-20261006 — revue profonde et préparation indépendante

## Mission et état de départ

Demande : reprendre le protocole et son banc de test de bout en bout, réconcilier
instructions, contrôles et preuves, sans nouvelle interprétation abusive du
navigateur, puis une seule revue indépendante préparée. Aucun parcours réel
d'implémentation n'est relancé pendant cette préparation.

Branche de départ : `protocol/vnext-proof-stability-20260930`.
HEAD local : `3b2cbad94d754101358b20ec1634ca68d7d7b7a6`, clean.
HEAD distant connu : `37e85e0e6dc6b7cd7785c1e285a2a38245ace779`.
Dernier candidat qualifié : `f15aa64eef32549e2c37b2fa242a6541146fa460`.
Dernier parcours réel : `37491799216`, FAILED / REVISE en revue de plan.

## Diagnostic causal avant correction

Le rapport `2026-10-06_VNEXT_NO_BROWSER_RESULT_DIAGNOSTIC.md` conserve les quatre
findings, la réponse réelle de Claude et la comparaison historique. Son résultat
n'est pas un timeout : Claude a fini normalement en 408768 ms. Le navigateur
avait été complètement retiré dans f15aa64e et ne joue aucun rôle dans cet échec.

1. La simplification de f15aa64e a retiré du **texte** le re-require du module
   partagé après effacement des caches : défaut démontré d'instruction.
2. Le contrôle indépendant normal/sentinel existait bien dans assertDelta :
   l'affirmation d'une absence de contrôle est contredite par le code. En revanche
   son résultat n'était pas explicitement enregistré dans le dossier lisible
   du reviewer : défaut démontré d'exposition de preuve, pas contrôle à inventer.
3. Le code appelait déjà toggle deux fois sur la même instance ; l'expression
   « independent isolated calls » brouillait la continuité de l'état : défaut
   de description, pas nouvelle mécanique fonctionnelle à ajouter.
4. CREATE désignait le nouveau comportement mais la justification parlait de
   création de module : clarification de portée, sans changer le scope MODIFY.

L'ajout du navigateur dans b0bf7edf était une extension non demandée. Son retrait
incomplet dans 187b8846 était incorrect. La distinction optimisation/transport/
preuve/contrat reste celle de `VNEXT_SYSTEMATIC_HISTORY`. Les anciens succès
INITIAL/REVISION ne sont pas une preuve que le benchmark Figma courant a réussi.

## Périmètre réellement traité et corrections

- Décisions utilisateur figées dans CLAUDE et spécification : aucun navigateur,
  aucun rendu automatique, aucun gate visuel humain pendant les tests du protocole.
- Matrice `KODJO_VNEXT_STABILIZATION_TRACE.md` : sources → exigences → scope → plan
  → revue → approbation → exécution → correction → reprise → conservation → clôture.
  Elle distingue contrôles de contrats, exécutions Node/Git réelles, services
  injectés et preuves externes encore à obtenir.
- Contrat fonctionnel unique du banc : procédure exacte, deux appels ordonnés
  sur une instance, conservation normal/sentinel dans un enfant indépendant.
- Le receipt inclut le résultat de conservation **déjà exécuté**, ainsi que le
  hash du shared. Aucun contrôle doublonné supplémentaire ni helper livré ajouté.
- Le dossier execution.json expose l'ordre, les valeurs réellement retournées,
  l'instance unique et ce receipt. Rejet de receipt absent/corrompu ou source dérivée.
- Clarification CREATE nouveau toggle/export versus MODIFY du fichier existant.
- Revue d'implémentation : distinction fait réellement exécuté / observation de
  fixture injectée et interdiction d'inventer une obligation de rendu.
- Nouvelle référence générée de bout en bout et mutations négatives : toujours
  true, mauvais état initial, shared constant/manquant/modifié, receipt incomplet,
  faute fonctionnelle puis correction exacte. Aucun APPROVE de modèle injecté.
- Workflow existant : voie de revue indépendante sur création de branche dédiée
  `qualification/vnext-stabilization-audit-*`, après les deux qualifications.
  Les historiques sont SKIPPED sur create ; le workflow runtime ne reçoit pas
  cet événement. Aucun PR supplémentaire ni relance réelle nécessaire.
- Audit Claude : lecture seule Read/Glob/Grep, Bash/Edit/Write/MCP refusés, hooks
  désactivés, credentials GitHub retirés, source inventoriée avant/après, sortie
  réelle préservée, pas de retry. Deux heures par appel ; 125 min pour le job,
  dont marge de sauvegarde après l'appel. Le rapport ne vaut pas autorisation runtime.
- Request du candidat déposé : QUALIFY_ONLY. L'ancienne identité consommée n'est
  ni réutilisée pour une exécution ni transformée en nouvelle autorisation.

## Tests et preuves

- Premier ciblage : 22 PASS, 0 FAIL, 0 SKIP (9 nouvelles sondes + superviseur).
- Première suite complète locale après correction fonctionnelle : 338 PASS,
  0 FAIL, 0 SKIP. Ce résultat précède l'ajout du test du routage d'audit.
- Suite locale après ajout du routage : 339 PASS, 0 FAIL, 0 SKIP en 29 secondes.
- Workflow syntaxe : 65 fichiers acceptés par parseur YAML indépendant ;
  validate-workflows PASS après ajout de la voie d'audit.
- Qualification finale locale et distante, parser Windows natif, SHA exact et
  audit réel : à consigner dans le suivi. Aucune qualification Windows antérieure
  n'est transférée implicitement à ce candidat.

## Hypothèses non démontrées et restant à faire

La nouvelle référence est déterministe et artificielle : elle ne prouve pas la
production correcte d'une livraison par Claude. Les services GitHub injectés
ne valent pas nouveaux tests externes de publication/recovery. Le pilote Boolean
ne prouve pas les parcours génériques de révision, cutover ou PRE-1 à lui seul.
La matrice est un guide vérifiable pour la revue profonde, pas une attestation
automatique de fermeture de tous les contrats.

La revue indépendante doit parcourir les modules de chaque ligne et leurs
dépendances, puis ses constats doivent être confrontés à l'autorité normative
et aux preuves. Aucune recommandation ne devient un gate implicitement. UNE
relance réelle ne sera préparée qu'après cette confrontation et qualification
exacte. Aucun test visuel utilisateur n'est restant à faire pour cette mission.
Application, appareil réel, UX produit, PRE-1, cutover et tâche 3 restent hors périmètre.

## Fichiers modifiés et livraison

CLAUDE ; spécification VNext ; matrice et mission de stabilisation ; ce rapport ;
request QUALIFY_ONLY ; workflow proof-stability ; driver Figma réel ; recette ;
review implémentation ; nouveau contrat fonctionnel ; nouveau driver audit ;
sondes de cohérence et test de séquence.

Le commit documentaire final est celui retourné par
`git log -1 --format=%H -- .github/orchestration/reports/2026-10-06_VNEXT_STABILIZATION.md`.
Le SHA exact du candidat distant et l'état Git après dépôt sont fournis dans
le suivi de mission. Aucune publication produit ni activation de VNext.

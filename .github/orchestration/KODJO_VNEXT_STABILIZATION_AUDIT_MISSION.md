# Revue indépendante de stabilisation VNext — 6 octobre 2026

Une seule revue, lecture seule. Ce n'est ni une revue de plan jetable, ni une
approbation finale, ni PRE-1, ni une relance de parcours réel. Le candidat exact
est fourni par le contrôleur. Les qualifications Linux et Windows du même SHA
doivent réussir avant cette invocation. Aucun fichier ni décision ne doit être
modifié. Une recommandation ne devient jamais une obligation automatiquement.

## Décisions utilisateur non réinterprétables

- Aucun navigateur et aucun contrôle automatique de rendu dans les tests du
  protocole, jetables, réels ou historiques. Aucun gate visuel humain non plus.
- Les validations visuelles produit restent faites exclusivement par l'utilisateur
  lors du développement produit. Un test fonctionnel ne les certifie pas.
- Figma figé peut rester contexte documentaire. Lire ses ressources ne constitue
  pas une certification visuelle ni un motif pour créer un contrôle de rendu.
- Séquence de relance nominale : contrôles automatiques, puis pilote Claude si
  succès, puis contrôles historiques si succès. Pas de trois runs concurrents.
- Les appels Claude disposent de deux heures. Un timeout technique est un échec
  d'exécution à diagnostiquer, pas une réserve produit ni une preuve de conformité.
- Aucun développement applicatif, publication produit, tâche 3, PRE-1, cutover ou
  nouvelle autorité d'écriture n'est autorisé dans cette mission.

## Lecture et méthode obligatoires

Lire `CLAUDE.md`, `.github/AI_ORCHESTRATION.md`, la continuité, la spécification
VNext, puis la matrice
`.github/orchestration/KODJO_VNEXT_STABILIZATION_TRACE.md`, le rapport
`reports/2026-10-06_VNEXT_STABILIZATION.md` et les modules/tests qui implémentent
chaque ligne. Suivre les dépendances locales réellement utilisées. Ne se limiter
ni aux trois derniers findings ni aux fonctions utilitaires isolées.

Pour chaque garantie, confronter l'instruction du plan, le contrôle exécuté,
son résultat, la preuve réellement accessible au reviewer, puis la décision
permise. Vérifier le plan généré et le dossier `execution.json`, pas seulement
les noms de tests. Distinguer référence déterministe, reviewer injecté, processus
Node réellement exécuté, vrai Claude et vrai service externe. Des tests verts
ne démontrent pas à eux seuls l'absence de trou sémantique.

Examiner succès, refus, correction bornée, source/HEAD obsolète, preuve modifiée,
réponse partielle, timeout, reprise sans nouvel appel, verrou, consommation
unique, préservation et clôture. Vérifier explicitement les scénarios qui sont
hors du pilote Boolean mais qui restent dans les contrats génériques. Ne pas
inventer un écran ou une interaction produit pour couvrir ces contrats.

Comparer les succès conservés 37115247745/08cb8b93 et 36881458781/3a931996,
l'origine Figma c1ea9aef, le commit mixte b0bf7edf, les suppressions partielles
187b8846, puis la suppression complète f15aa64e et le run 37491799216. Lire les
preuves et rapports cités. Une preuve historique absente reste NON VERIFIABLE.
Ne pas présenter un succès generic INITIAL comme preuve du pilote Figma courant.

## Restitution

Pour chaque finding : ID stable, règle exacte et autorité, cible, preuve lue,
contre-exemple, classe (VIOLATION_EXISTANTE, TROU_ARCHITECTURAL, PREUVE_MANQUANTE,
RECOMMANDATION, PREFERENCE), caractère bloquant pour cette phase et sa raison,
origine historique démontrée/plausible/indéterminée, correction minimale et
test négatif de fermeture. Une obligation nouvelle non autorisée est une
proposition, jamais une réserve bloquante inventée.

Conclure séparément sur cohérence du protocole, fidélité du banc de test,
preuves externes restant à obtenir, possibilité de préparer UNE relance réelle.
Ne pas lancer de correction ni de test. Ne pas conclure au succès de la relance
réelle, qui n'a pas lieu pendant cette revue.

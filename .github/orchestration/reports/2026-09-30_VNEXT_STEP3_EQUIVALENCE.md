# Étape 3 — correspondances individuelles et preuves exécutées

La revue comporte 165 incidents, 138 tests historiques et 117 unités
normatives : 420 sujets individuels. Le résultat de cette revue n’est pas
une autorisation de passage en production. La clôture normative reste
**NOT_READY** tant que les écarts ci-dessous ne sont pas corrigés et prouvés.

## Correspondances consultables

Le fichier [KODJO_VNEXT_HISTORICAL_EQUIVALENCE.json](../KODJO_VNEXT_HISTORICAL_EQUIVALENCE.json)
référence, pour chaque sujet, sa source hachée, sa protection, les assertions
précises, leur fichier, leur ligne, les mécanismes lus ou exécutés et la
limite de démonstration. Il complète l’inventaire original sans changer
les résultats des incidents ou des scénarios historiques.

398 assertions nommées sont référencées : 386 dans des suites exécutant des
mécanismes ou des fixtures, 12 contrôlant le contenu de workflows.
Un contrôle du texte d’un workflow ne démontre pas sa consommation réelle.
Les chemins de mécanismes sont les dépendances du fichier de test et de ses
helpers ; ils ne prétendent pas constituer une trace de couverture de branches.

Les limites de 8/40 tours et de quatre passes ne sont pas réintroduites :
T-057, INC-077 et INC-084 pointent vers INC-086/T-059 ; T-100 et INC-125
pointent vers INC-139/T-112. Les successeurs préservent la protection et
remplacent les paramètres explicitement devenus obsolètes.

## Résolution des preuves

`vnext-equivalence-reporter.js` consomme les événements structurés de Node,
avec identité du commit, plateforme, fichier, nom, ligne et résultat.
Il ignore les sorties stdout imitant un PASS. Le résolveur refuse candidat
périmé, preuve incomplète, doublon, sujet omis et emplacement de test changé.
SKIP/TODO ne valent jamais PASS. Chaque clause garde son statut individuel.

Le job `historical-equivalence` exécute les fixtures historiques sur
Ubuntu et Windows au HEAD exact, avec le tokenizer isolé du lockfile.
Les lignes `KODJO_EQ_IDENTITY`, `KODJO_EQ_CASE` et `KODJO_EQ_SUBJECT` des logs
permettent de résoudre chaque preuve séparément. Le résultat d’une
plateforme ne remplace pas un test spécifique à l’autre.

Validation locale du premier delta : 184 tests VNext PASS, 0 FAIL, 0 SKIP ;
syntaxe indépendante des 63 workflows et invariants exécutables PASS.
La suite complète dépend aussi du tokenizer et de l’historique Git réel ;
les résultats distants du commit publié sont nécessaires à sa qualification.

Premier candidat publié `ff1ae5083f2d463604687498801b74cddaaee69c`,
[run 36743532496](https://github.com/MyUncried/Application-Routine/actions/runs/36743532496) :
184 tests VNext PASS sur Ubuntu et Windows, syntaxe/invariants/whitespace
SUCCESS. Qualification historique Ubuntu : 886 tests, 885 PASS, 0 FAIL,
1 SKIP ; 397 assertions mappées PASS et un SKIP explicite du nettoyage
Windows. Les logs contiennent les 398 résultats de cas et les 420 résultats
de sujets liés à ce commit. La qualification historique Windows est encore
en cours au moment de cette note ; aucun PASS Windows complet n’est inféré.

Le delta suivant ajoute deux refus vérifiés : substitution du texte de
protection en conservant son hash source et résultat inconnu présenté comme
CONFORME. Les quatre tests du résolveur passent localement après ce delta.

## Écarts sémantiques identifiés

| Clauses | Protection | Écart du contrat VNext |
| --- | --- | --- |
| NORM-e90e0483826ca49f, NORM-f8258fa64fdea1d8, NORM-58a37601f46fb94b | Mode LOCAL/CLOUD et écrivain désigné ; nouvelle autorisation lors du relais ; pas d’auto-attribution | L’ExecutionCore ne lie pas explicitement ces deux attributs à l’ApprovalTarget. Le consommateur historique possède des contrôles, mais leur PASS ne prouve pas cette liaison VNext. |
| NORM-e3404f3947781e03, NORM-c4f2d360bef1982b, NORM-8b7af59e2c72d9cd | Préférence native et exception fonctionnelle justifiée, avec arrêt NATIVE_PRIMITIVE_EXCEPTION_REQUIRED et autorisation avant code | UIAtomicity décrit la réutilisation et les assertions UI, mais ne modélise pas explicitement la disponibilité native et l’autorisation de substitution. |

Ces six clauses restent NONCONFORME même lorsque tous leurs tests associés
passent. Aucun champ déclaratif ne convertit leurs assertions de fixture en
preuve d’équivalence opérationnelle.

## Limites et étapes suivantes

Les tests réels GitHub/Claude, l’observance humaine, la livraison applicative
et les mesures device historiques ne sont pas rejoués par cette qualification.
Leur responsabilité et leur scénario restent conservés par sujet. Le
raccordement des producteurs et consommateurs opérationnels relève de
l’étape 4 ; le VNext-12 réel et l’audit FINAL restent conditionnés à ses
prérequis. Cette qualification ne les lance pas.

L’étape 3 a maintenant une correspondance individuelle contrôlable et un
résolveur de preuves ; elle ne peut pas être déclarée conforme avant la
correction des deux lacunes de contrats ci-dessus. Aucune activation,
fusion, modification de PRE-1 ou bascule du protocole n’est effectuée.

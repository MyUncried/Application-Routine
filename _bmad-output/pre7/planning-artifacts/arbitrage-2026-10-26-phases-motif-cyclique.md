# Arbitrage de Hermann du 26/10/2026 — phases comme motif cyclique (recette JA, point 1)

> Réponse de Hermann, verbatim, à la question « Comment une série à phases et à l'échec doit-elle se dérouler ? » posée après son constat de recette : « les options de Avec phase et à l'échec sont exclusives, ce ne doit pas être le cas. Un exercice à l'échec doit pouvoir avoir des phases. »
> Sources de l'exclusion actuelle (PRE-5, 19/10) : ch08 l.258, ch10 l.293, ch13 l.1088 ; code `ExecutionParametersDraft.ts:1257` (`setStopCondition`), `ExecutionParametersSheet.tsx:1256` (commits `80a6b75a`, `8f3e9512`, puis `2d73cd90`).

Je retiens **l'option 1 : séquence en boucle**, mais la correction porte sur trois points liés, pas seulement sur l'activation d'« À l'échec ». Le constat initial dans l'application est qu'« À l'échec » devient indisponible lorsque des phases existent. L'analyse révèle une confusion plus générale entre **durée des phases**, **durée d'une répétition** et **objectif de la série**.

## 1. Principe fonctionnel

Les phases constituent un **motif cyclique de guidage de l'exécution**. Elles s'enchaînent selon leurs durées, puis recommencent tant que la série continue.

Exemple : montée sur mollets pendant **5 s**, puis descente pendant **2 s**. Un passage complet des deux phases constitue **une répétition**, dont la durée nominale est de **7 s**. Cette somme n'est pas la durée de la série.

La condition d'arrêt s'applique à la **série**, jamais individuellement aux phases. Les phases restent chronométrées en secondes, quel que soit le mode de l'exercice.

## 2. Les trois corrections à réaliser

- **Autoriser les phases avec une condition d'arrêt À l'échec.**
- **Autoriser les phases en mode Répétitions**, en conservant leurs durées en secondes.
- **Supprimer le calcul qui impose la somme des durées des phases comme durée cible de la série.** En mode Durée, cet objectif reste indépendant et modifiable.

L'incompatibilité à conserver est **phases + séries variables**. Ne pas étendre cette restriction au mode Répétitions ni à la condition d'arrêt À l'échec.

## 3. Comportements attendus

Pour le motif montée 5 s / descente 2 s :

| Configuration | Comportement |
|---|---|
| Durée, objectif 2 min, 3 séries identiques | Répéter les deux phases pendant 2 min pour chaque série. À 2 min, terminer la série, même si une phase est en cours. |
| Durée, À l'échec, 3 séries identiques | Répéter les deux phases jusqu'à l'appui sur « Suivant », pour chaque série. Aucune durée cible numérique n'est prescrite. |
| Répétitions, objectif 10, 3 séries identiques | Guider 10 passages complets du motif pour chaque série, soit 70 s de durée nominale par série. Conserver la règle existante de validation manuelle par « Suivant » en mode Répétitions ; ne pas introduire une fin automatique du seul fait des phases. |
| Répétitions, À l'échec, 3 séries identiques | Répéter le motif jusqu'à « Suivant ». Le nombre de répétitions réalisé n'est pas fixé à l'avance et peut différer entre les séries. |

Chaque nouvelle série commence à la première phase. Les pauses et les changements de côté conservent leurs règles propres.

Le timer affiche la phase courante et passe à la suivante à expiration de sa durée. Les cycles guidés ne constituent pas une mesure automatique des répétitions réellement effectuées.

En mode Répétitions à objectif chiffré, ne pas inventer silencieusement le comportement du guidage après atteinte du nombre cible et avant « Suivant » : vérifier la règle existante et signaler précisément ce point si elle ne permet pas de conclure.

## 4. Calculs et paramètres

- `Durée du motif = somme des durées des phases`.
- En mode Durée, la durée cible de série est saisie indépendamment du motif.
- En mode Répétitions, la durée nominale du guidage est `nombre cible × durée du motif`. Elle ne remplace pas l'objectif en répétitions.
- À l'échec, la durée finale et le nombre réalisé sont inconnus avant exécution. Réutiliser l'affichage existant prévu pour une durée non calculable, plutôt qu'introduire arbitrairement « — ».
- Modifier une durée de phase modifie le rythme du guidage, pas l'objectif de la série.
- Ne pas redimensionner automatiquement les phases pour faire correspondre leur somme à la durée cible de série, y compris lorsqu'un format impose cette durée.

## 5. Point distinct : arrêt mixte

Mes exemples « deux séries à l'objectif, puis la dernière à l'échec » expriment un besoin distinct. Le modèle publié représente actuellement ces cibles différentes par des séries variables.

Ne pas prétendre résoudre ce point en autorisant les phases avec les séries variables, ni ajouter implicitement une règle « dernière série à l'échec ». Identifier séparément l'adaptation nécessaire pour représenter ce fonctionnement. Cela ne doit pas empêcher de traiter les trois corrections ci-dessus.

## 6. Mise en œuvre et vérification

Ces précisions corrigent l'interprétation fonctionnelle portée par la documentation et le code ; elles ne se limitent pas à dégriser deux commandes.

Revoir les règles concernées, notamment D-370 et la proposition D-446, puis les modèles, calculs, transitions du brouillon, contrats d'écran et comportements d'exécution. Préserver les travaux PRE-7 en cours et les règles indépendantes de cette correction.

Ajouter des tests automatiques couvrant au minimum :

- phases compatibles avec Durée/Répétitions et objectif/échec ;
- phases toujours incompatibles avec séries variables ;
- objectif de durée indépendant de la somme des phases ;
- enchaînement et bouclage des phases ;
- arrêt à la durée cible au milieu d'une phase ;
- arrêt manuel à l'échec ;
- comptage d'un motif complet comme un cycle guidé ;
- reprise à la première phase pour une nouvelle série ;
- maintien de la validation manuelle en mode Répétitions.

Enfin, distinguer dans ton compte rendu ce qui était déjà présent dans la version effectivement testée, ce qui a changé et ce qui a été corrigé. Ne pas attribuer une régression à PRE-7 sans comparaison du code ou du build concerné.

---

# Complément de Hermann du 26/10/2026 — phases et séries variables (remplace l'exclusion maintenue par PHC-20261026 / PR #398)

> Verbatim. Cette instruction remplace explicitement l'exclusion phases + séries variables (§2 et §5 ci-dessus, PHC-20261026 et chapitres concernés sur `main`) ainsi que le point ouvert sur la représentation des séries mixtes avec phases.

Complément à la correction des phases : **lever également l'incompatibilité entre phases et séries variables.**

Cette conséquence s'applique dès maintenant, indépendamment de la proposition de simplification du modèle exercice/séance, qui n'est pas encore validée.

L'ancienne exclusion reposait sur l'idée que la somme des durées des phases devait correspondre à la durée de chaque série. Avec le fonctionnement désormais retenu, les phases constituent un **motif cyclique de guidage indépendant de l'objectif de série**. Cette justification disparaît.

**Fonctionnement attendu**

Une seule séquence de phases, avec les mêmes durées, est commune à toutes les séries de l'exercice. Chaque série conserve ses paramètres propres : cible numérique ou À l'échec, charge et pause. Le mode Durée ou Répétitions reste commun à l'exercice.

Exemple : montée sur mollets 5 s → descente 2 s, soit un motif de 7 s.

- En mode Durée : série 1 de 30 s, série 2 de 45 s, série 3 À l'échec.
- En mode Répétitions : série 1 de 10 répétitions, série 2 de 12 répétitions, série 3 À l'échec.

Dans les deux cas, le même motif guide chaque série. Une nouvelle série recommence à la première phase. En Durée chiffrée, la série se termine à sa cible, même au milieu d'une phase. En Répétitions et À l'échec, conserver la validation manuelle par Suivant.

**Conséquences**

1. Autoriser les phases avec les séries identiques comme variables, dans les deux modes et avec les conditions d'arrêt numérique, À l'échec ou mixtes.
2. Conserver une seule configuration des phases pour l'exercice : **ne pas créer de durées de phase propres à chaque série**.
3. Ne jamais recalculer les durées des phases à partir des cibles des séries, ni remplacer une cible par leur somme.
4. Préserver phases et durées lors du passage Identiques ↔ Variables ; appliquer les règles existantes de conversion des autres paramètres.
5. Représenter normalement les exemples mixtes, comme `30 s / 45 s / échec` ou `10 / 12 / échec`, par les séries variables existantes. Aucun mécanisme supplémentaire « dernière série à l'échec » n'est nécessaire.
6. Des séries toutes À l'échec peuvent rester variables si leurs charges ou pauses diffèrent.

**Documentation et réalisation**

La PR #398, publiée sur main, conserve encore l'exclusion phases + séries variables dans PHC-20261026 et les chapitres concernés. **Cette instruction remplace explicitement cette exclusion**, ainsi que le point resté ouvert sur la représentation des séries mixtes avec phases.

Actualise les règles, contrats, modèles de données et validations concernés, puis le code dans le chantier en cours. Vérifie notamment que les phases restent communes lorsque les paramètres passent en séries variables. Préserve la séparation validée entre structure du mouvement et durées dans les paramètres d'exécution.

Ajoute les tests automatiques couvrant les deux exemples, les charges et pauses variables, les transitions Identiques ↔ Variables sans perte des phases, les calculs de durée et l'enchaînement à l'exécution. Remplace les tests qui imposaient l'ancienne exclusion par des tests de compatibilité.

Ne modifie pas le modèle exercice/séance sur la base de cette correction. Le comportement du guidage après atteinte d'un objectif de répétitions et avant Suivant reste un point distinct ; ne déduis pas de cette instruction une fin automatique.

## Numérotation (réponse de Hermann du 26/10/2026)

La décision éditeur de PRE-7 (ancien « D-445 » local, B1–B10) devient **D-447** ; toutes ses références PRE-7 sont renommées, sans modifier le D-445 de `main`. **D-446** est conservé pour le chantier des phases et rapproché de PHC-20261026 avec les compléments ci-dessus. La renumérotation ne change aucune règle fonctionnelle.
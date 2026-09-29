# KODJO — Prochaine évolution du protocole — R1 / R3 / R4 / continuité opératoire

## 1. Objet

Cette évolution vise à réduire les blocages inutiles du protocole sans affaiblir les garanties de causalité, de périmètre, de preuve ni les gates utilisateur.

Principe directeur :

> Le protocole ne bloque que lorsqu’un risque réel de causalité, de périmètre autorisé, de preuve, de contrat produit ou de décision utilisateur le justifie. Il ne s’arrête pas après un simple diagnostic lorsqu’une transition canonique non décisionnelle peut encore être poursuivie.

Cette évolution ne modifie aucune règle fonctionnelle du produit KODJO.

---

## 2. R1 — Handoff utilisateur explicite

Le mécanisme d’approbation utilisateur par réaction 👍 existe déjà et reste canonique.

L’évolution porte sur le comportement opératoire autour de ce gate.

Lorsqu’un `PLAN_HANDOFF_READY` ou état équivalent exige une approbation utilisateur, le cockpit doit :

1. publier ou identifier le commentaire canonique ;
2. fournir le lien direct vers ce commentaire ;
3. indiquer explicitement l’action attendue : ajouter 👍 pour autoriser la suite ;
4. s’arrêter clairement en attente de cette approbation ;
5. ne déclencher aucune Lean Queue avant l’approbation valide.

La règle ne doit pas imposer une formulation textuelle exacte : seule l’intention observable est normative.

---

## 3. R3 / PE-28 — VISUAL_CORRECTION directe si contrat inchangé

Lorsqu’une inspection visuelle/device conclut `NON CONFORME`, une replanification complète n’est pas obligatoire si les écarts restent couverts par un contrat produit déjà approuvé.

Le routage cible est :

`DEVICE_REVIEW_FAIL`
→ qualification `CONTRACT_UNCHANGED | CONTRACT_CHANGED`
→ si `CONTRACT_UNCHANGED` : `VISUAL_CORRECTION` bornée
→ revue indépendante
→ tests
→ device gate
→ clôture ou nouvelle correction

Une replanification complète reste obligatoire si :

- une nouvelle exigence produit apparaît ;
- un comportement ou une règle métier change ;
- le périmètre fonctionnel s’élargit ;
- une ambiguïté normative pertinente empêche de déterminer la correction ;
- les sources normatives pertinentes pour l’écart ont changé de manière substantielle.

La simple modification d’un document, d’une frame ou d’un fichier sans lien avec l’écart corrigé ne doit pas forcer une replanification.

Plusieurs écarts visuels peuvent être regroupés dans un même cycle borné lorsqu’ils restent dans le même contrat approuvé.

---

## 4. R4 — Clôture canonique de tranche

Une tranche reconnue comme terminée par le protocole ne doit plus rester `ACTIVE` dans le registre.

La transition cible est :

`FINAL_VERIFICATION`
→ `READY_TO_CLOSE`
→ preuves de clôture valides
→ `CLOSED`

La clôture doit au minimum :

1. faire évoluer l’entrée de `.github/orchestration/v2-activation-registry.json` de `ACTIVE` vers `CLOSED` ;
2. conserver une référence durable aux preuves de clôture pertinentes ;
3. empêcher une nouvelle implémentation ou reprise sur une tranche `CLOSED` comme si elle était encore active ;
4. être idempotente ;
5. détecter un état incohérent du type « preuves de clôture présentes + registre ACTIVE ».

La fermeture de l’Issue n’est pas universellement obligatoire : elle dépend du rôle réel de l’Issue. Une Issue dédiée exclusivement à une tranche peut être fermée ; une Issue servant de conteneur durable peut rester ouverte si la tranche est clairement `CLOSED`.

De même, une PR applicative fusionnée n’est pas une condition universelle : les preuves de clôture dépendent du type de tranche.

Le protocole doit autoriser plusieurs tranches `ACTIVE` indépendantes. Il ne doit interdire que les concurrences incompatibles sur les mêmes identités, ressources ou périmètres.

---

## 5. R5 — Continuité opératoire obligatoire du cockpit

### 5.1 Principe

Après toute étape, résultat, diagnostic, retry ou correction technique, le cockpit responsable poursuit automatiquement le parcours canonique jusqu’au prochain vrai gate utilisateur ou jusqu’à un blocage technique réellement démontré.

Un simple compte-rendu n’est pas une raison suffisante pour s’arrêter.

### 5.2 Rafraîchissement obligatoire de l’état réel

Avant d’affirmer qu’une Issue, branche, PR, activation, plan, revue, handoff, queue ou run n’existe pas, le cockpit doit relire l’état GitHub courant.

Une conclusion de blocage fondée sur un snapshot antérieur, une mémoire de conversation ou un état mis en cache est interdite.

La vérification doit porter au minimum sur les objets directement concernés par la transition suivante.

### 5.3 Blocage réel

Si la transition suivante ne peut réellement pas être exécutée, le cockpit doit :

1. identifier précisément la capacité ou l’action manquante ;
2. distinguer un manque de capacité outil d’un gate protocolaire ;
3. ne demander à l’utilisateur que l’action minimale réellement nécessaire ;
4. ne pas inventer de transport manuel ou de voie alternative non qualifiée ;
5. ne pas transformer une difficulté d’orchestration en pseudo-décision produit.

### 5.4 Alternatives

L’absence d’une capacité dans le cockpit n’autorise pas à substituer silencieusement un mécanisme différent.

Une alternative peut être utilisée uniquement si elle est déjà qualifiée par le protocole ou si elle est explicitement validée comme évolution.

### 5.5 Retry

Lorsqu’un échec est transitoire ou externe et que la relance est sûre, le cockpit doit pouvoir relancer automatiquement sans interrompre l’utilisateur.

À l’inverse, il ne doit pas multiplier les retries lorsque la cause est durable et déjà identifiée, par exemple une saturation externe avec fenêtre de recalcul connue.

---

## 6. R6 — Réduction systématique de la non-détermination

### 6.1 Validation déterministe des chemins

Toute sortie de planification contenant des modules `MODIFY` ou `CREATE` doit être validée mécaniquement avant les traitements coûteux.

Règles minimales :

- `MODIFY` : le chemin exact doit exister dans `git ls-files` au `source_head` ;
- `CREATE` : le chemin exact ne doit pas exister au `source_head` ;
- casse, Unicode et chemin POSIX comparés exactement ;
- diagnostic machine précis en cas d’écart ;
- éventuel retry borné à la correction d’identité de chemin, sans réinterprétation fonctionnelle.

### 6.2 Révision sans reconstruction inutile

Après `VERDICT: REVISE`, le protocole distingue les éléments rejetés, les éléments déjà validés, les dépendances devenues invalides et les éléments réellement affectés par un changement de contrat.

Sans changement de contrat ni dépendance imposant une reconstruction, la révision préserve les éléments validés et corrige uniquement le delta rejeté. Les validateurs complets sont ensuite rejoués sur le plan résultant.

### 6.3 Audit transversal des opérations non déterministes

La prochaine évolution doit cartographier chaque transition/sous-étape selon :

- `DETERMINISTIC` ;
- `MODEL_ASSISTED` ;
- `HUMAN_DECISION`.

Pour chaque étape `MODEL_ASSISTED`, l’audit détermine si tout ou partie du résultat peut être dérivé mécaniquement depuis Git, contrats, schémas, décisions et preuves.

La sortie attendue est une matrice contenant au minimum : étape, entrées, résultat actuel, source de non-détermination, possibilité de déterminisation, garde-fou proposé, coût, risque, preuve de qualification et priorité.

L’objectif est de mécaniser ce qui est calculable et de réserver l’IA aux analyses réellement sémantiques.

### 6.4 Hiérarchie obligatoire de traitement des erreurs

Pour chaque famille d’échec connue, le protocole doit d’abord déterminer si la cause est :

- `PREVENTABLE_BY_DETERMINISM` ;
- `RESIDUAL_AUTOCORRECTABLE` ;
- `HUMAN_DECISION_REQUIRED`.

L’ordre de traitement est obligatoire :

1. dériver mécaniquement les faits calculables et supprimer la cause à la source ;
2. valider mécaniquement avant les étapes coûteuses ;
3. n’utiliser une auto-correction bornée que pour les résidus qui ne peuvent pas être empêchés ;
4. solliciter l’utilisateur uniquement lorsqu’un arbitrage réellement ouvert subsiste.

Une boucle de retry est un filet de sécurité, jamais le mécanisme nominal de convergence.

PRE-1 a notamment montré qu’un ensemble exact de chemins déjà calculé ne doit pas être redemandé au modèle sous forme de recopie libre : la structure du contrat doit lier ces identités déterministes et ne laisser au modèle que la classification sémantique nécessaire.



---

## 7. R7 / PE-36 — Cycle de vie des artifacts GitHub Actions

### 7.1 Principe

Les artifacts GitHub Actions sont un mécanisme de transport, recovery ou diagnostic temporaire. Ils ne constituent pas par défaut la source de vérité durable des preuves.

La preuve durable requise doit être matérialisée dans `Application-Routine-KODJO-Evidence` lorsque le protocole l’exige.

### 7.2 Classification à la création

Chaque artifact doit déclarer un rôle déterministe, par exemple :

- `TEMPORARY_TRANSPORT` ;
- `RECOVERY_REQUIRED` ;
- `DIAGNOSTIC` ;
- `DURABLE_EVIDENCE_SOURCE`.

Une classification équivalente est acceptable si elle permet de déterminer mécaniquement sa criticité, sa rétention et son éligibilité à suppression.

### 7.3 Rétention et suppression

La rétention ne doit pas être uniforme par défaut.

Les durées exactes restent à décider pendant la conception, mais toute suppression automatique exige au minimum que :

- aucune tranche active ne référence l’artifact ;
- aucune recovery active ou transition future admissible n’en dépende ;
- la preuve durable requise soit matérialisée et vérifiée lorsqu’elle est nécessaire.

À la clôture d’une tranche, le protocole doit inventorier ses artifacts et rendre supprimables ceux qui ne servent plus au transport, à la recovery ou à une preuve encore non matérialisée.

### 7.4 Préflight quota

Avant un workflow coûteux dont la conformité dépend obligatoirement d’un nouvel artifact, le protocole doit vérifier autant que possible que la capacité de stockage nécessaire existe.

Un quota externe durablement saturé ne doit pas provoquer une boucle de retries qui répète les mêmes calculs coûteux sans possibilité d’aboutir.

### 7.5 Criticité des uploads

Chaque usage de `upload-artifact` doit être audité séparément :

- upload obligatoire pour la conformité ou la recovery ;
- upload diagnostique ou de confort ;
- preuve transitoire déjà matérialisée durablement ailleurs.

Un upload non critique ne doit pas devenir bloquant par accident. À l’inverse, un upload réellement nécessaire ne doit pas être rendu silencieusement facultatif par un `continue-on-error` générique.

### 7.6 Volume et duplication

Le protocole doit préférer une preuve minimale, un digest, un manifeste ou une preuve durable ciblée lorsqu’un snapshot complet n’est pas nécessaire.

L’incident PRE-1 du 29/09/2026 a montré qu’une famille de snapshots complets répétée à chaque qualification pouvait saturer seule le quota GitHub Free, alors que les autres artifacts utiles ne représentaient que quelques mégaoctets.

Le protocole doit rester viable avec le quota opérationnel actuel de 500 Mo et ne doit pas supposer implicitement un plan GitHub supérieur.

### 7.7 Observabilité

Le cockpit et les preuves de run doivent distinguer explicitement :

- échec fonctionnel/protocolaire ;
- échec de test ;
- échec de stockage d’artifact ;
- quota externe ;
- upload obligatoire ;
- upload diagnostique/non critique.



---

## 8. R8 / PE-37 / PE-38 — Efficience déterministe des qualifications

### 8.1 Supersession des runs de PR

Une qualification strictement liée au HEAD courant d’une PR ne doit pas continuer à consommer des ressources après publication d’un HEAD plus récent sur cette même PR.

Pour les workflows éligibles, la concurrence cible doit :

- utiliser une identité stable par workflow et PR/branche ;
- activer `cancel-in-progress: true` ;
- garantir que seul le run du HEAD le plus récent poursuit la qualification ;
- ne jamais appliquer cette règle à un writer, une recovery, une publication ou une transition dont l’interruption ferait perdre un état durable ou une preuve encore nécessaire.

La simple présence de `pull_request:synchronize` ne suffit pas à rendre un run annulable : l’annulabilité doit être déclarée par catégorie de workflow.

### 8.2 Classification déterministe de l’impact CI

Avant toute qualification lourde, le delta de la PR doit être classé mécaniquement dans une catégorie fermée :

- `RUNTIME_PROTOCOL_CHANGE` ;
- `NORMATIVE_PROTOCOL_CHANGE` ;
- `NON_NORMATIVE_DOCUMENTATION` ;
- `UNKNOWN`.

Règles de routage :

- `RUNTIME_PROTOCOL_CHANGE` → qualification complète ;
- `NORMATIVE_PROTOCOL_CHANGE` → qualification complète adaptée au contrat normatif concerné ;
- `NON_NORMATIVE_DOCUMENTATION` → contrôle documentaire léger, sans suite lourde Linux/Windows ;
- `UNKNOWN` → qualification complète par sécurité.

La classification doit reposer sur une source versionnée et explicite des fichiers/catégories normatives et exécutables. Elle ne doit jamais déduire qu’un fichier est non normatif uniquement parce qu’il est Markdown ou placé sous un préfixe documentaire générique.

Les renommages, déplacements et modifications mixtes prennent la catégorie la plus exigeante parmi les fichiers touchés.

### 8.3 Relation avec PE-13

PE-13 reste l’origine historique du besoin d’éviter les CI sans rapport déclenchées par des commits `synchronize`.

PE-38 généralise ce principe à toutes les modifications de PR et le rend déterministe par classification de criticité, sans dépendre du motif ayant créé le commit.


---

## 9. Critères d’acceptation

L’évolution n’est conforme que si les scénarios suivants sont démontrés :

1. handoff prêt → lien direct + demande explicite 👍 + attente ;
2. inspection visuelle non conforme, contrat inchangé → correction directe sans replanification ;
3. inspection visuelle non conforme, contrat changé → replanification obligatoire ;
4. tranche clôturée → registre `CLOSED` ;
5. preuves de clôture + registre `ACTIVE` → incohérence détectée ;
6. état GitHub modifié après un ancien snapshot → le cockpit relit GitHub avant diagnostic ;
7. transition non décisionnelle disponible → le cockpit la poursuit sans demander d’action utilisateur ;
8. capacité outil réellement absente → arrêt avec diagnostic précis et action minimale ;
9. alternative manuelle non qualifiée → refus de substitution silencieuse ;
10. erreur externe transitoire relançable → retry borné sans interruption utilisateur ;
11. erreur externe durable connue → pas de boucle de retries inutile ;
12. artifact de recovery encore référencé → suppression interdite ;
13. preuve durable matérialisée et transport devenu inutile → artifact éligible à suppression ;
14. quota insuffisant avant un upload obligatoire → arrêt avant consommation inutile des étapes coûteuses lorsque le préflight est possible ;
15. upload diagnostique non critique en échec → diagnostic distinct sans masquer un éventuel verdict fonctionnel ;
16. upload critique en échec → blocage explicite ;
17. snapshot complet non nécessaire à la preuve/recovery → remplacement par une preuve minimale ou suppression de la duplication ;
18. dashboard/storage externe obsolète après nettoyage → aucun retry répété tant que la capacité réelle n’est pas redevenue disponible ;
19. HEAD A en qualification sur une PR puis HEAD B publié → le run A éligible est annulé et seul B poursuit ;
20. run portant une recovery/writer critique → aucune annulation par la règle de supersession ;
21. modification limitée à des rapports non normatifs explicitement classés → aucun pilot test lourd Linux/Windows ;
22. modification d’une spec normative, d’un workflow, d’un script ou catégorie UNKNOWN → qualification complète ;
23. modification mixte non normative + normative/runtime → routage vers la qualification la plus exigeante ;
24. renommage ou déplacement entre catégories → classification selon source et destination, sans downgrade silencieux.

---

## 10. Non-régression recherchée

Cette évolution ne doit pas :

- ajouter un nouveau workflow si les workflows existants suffisent ;
- créer un nouvel état protocolaire sans nécessité ;
- imposer une seule tranche ACTIVE globale ;
- bloquer sur toute modification documentaire sans analyse d’impact ;
- obliger une PR applicative ou la fermeture d’Issue pour toutes les catégories de tranche ;
- rigidifier le protocole au-delà des invariants réellement nécessaires ;
- affaiblir les gates de sécurité, de périmètre, de preuve ou d’approbation utilisateur ;
- supprimer automatiquement un artifact référencé par une tranche ou une recovery active ;
- rendre tous les uploads non bloquants par un `continue-on-error` générique ;
- dépendre d’un plan GitHub supérieur ou d’un stockage supposé illimité ;
- annuler un run portant un writer, une recovery ou une transition critique simplement parce qu’un HEAD de PR a avancé ;
- classer tous les fichiers Markdown comme non normatifs ;
- utiliser un simple préfixe large tel que `.github/orchestration/**` comme preuve de criticité ;
- ignorer silencieusement une catégorie inconnue : `UNKNOWN` doit rester fail-safe et déclencher la qualification complète.

---

## 11. Ordre recommandé d’intégration

1. R1 — handoff explicite ;
2. R4 — clôture canonique ;
3. R5 — continuité opératoire / refresh GitHub ;
4. R6 — réduction systématique de la non-détermination et hiérarchie de traitement des erreurs (PE-32/33/34/35) ;
5. R7 / PE-36 — cycle de vie des artifacts et préflight quota ;
6. R8 / PE-37/38 — supersession sûre des runs et classification déterministe de l’impact CI ;
7. R3 / PE-28 — correction visuelle directe bornée.

PE-27 reste une évolution distincte déjà implémentée dans la PR #243 ; elle doit être qualifiée puis activée avant la planification de PRE-2.

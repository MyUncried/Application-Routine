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

## 6. Critères d’acceptation

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
11. erreur externe durable connue → pas de boucle de retries inutile.

---

## 7. Non-régression recherchée

Cette évolution ne doit pas :

- ajouter un nouveau workflow si les workflows existants suffisent ;
- créer un nouvel état protocolaire sans nécessité ;
- imposer une seule tranche ACTIVE globale ;
- bloquer sur toute modification documentaire sans analyse d’impact ;
- obliger une PR applicative ou la fermeture d’Issue pour toutes les catégories de tranche ;
- rigidifier le protocole au-delà des invariants réellement nécessaires ;
- affaiblir les gates de sécurité, de périmètre, de preuve ou d’approbation utilisateur.

---

## 8. Ordre recommandé d’intégration

1. R1 — handoff explicite ;
2. R4 — clôture canonique ;
3. R5 — continuité opératoire / refresh GitHub ;
4. R3 / PE-28 — correction visuelle directe bornée.

PE-27 reste une évolution distincte déjà implémentée dans la PR #243 ; elle doit être qualifiée puis activée avant la planification de PRE-2.

# Rapport de mission — AGENDA-JOURNAL-FILTRE-REVUE (21 novembre 2026)

## Identifiant et objectif

- **Mission :** `AGENDA-JOURNAL-FILTRE-REVUE`.
- **Objectif :**
  - revue indépendante de la spécification `docs/KODJO-Agenda-seances-journal-filtre-2026-11-21.md` et de sa propagation dans la documentation ;
  - ajustement Figma du Journal et du filtre de l'Agenda ;
  - contrôle seul de l'Agenda.
- **Hors périmètre :** aucun code applicatif.

## Branche et commit de départ

- **Branche :** `docs/agenda-seances-journal-filtre-20261121`, reprise depuis `origin`. Elle contient 10 commits documentaires au-dessus de `integration/bmad-planification-20261120` (`78db25d2`).
- **Commit de départ :** `f9800391`.

## Périmètre demandé

Le prompt de mission de Hermann (21/11/2026) demande :
- de vérifier l'état du dépôt, des décisions et de Figma ;
- une revue documentaire avec matrice par décision ;
- de rechercher les anciennes formulations ;
- d'ajuster dans Figma le Journal et le filtre ;
- de contrôler l'Agenda, sans le modifier ;
- une seconde passe indépendante ;
- une PR sans fusion.

## Périmètre réellement traité

Tout le périmètre demandé est traité.

Ajouts de cette mission :
- un identifiant de registre, **D-553**, pour les décisions du 21/11/2026, qui n'en avaient pas. D-553 est libre : D-543 à D-552 sont pris sur `main` (Programme) et D-541/D-542 sur `docs/planification-grille-creneaux` ;
- des annotations datées en ligne sur les formulations contraires, qui jusque-là n'étaient supersédées que par des compléments placés en fin de document.

## Constats

### Agenda (contrôle seul, aucune modification)

Écran validé : « P-Calendrier — Semaine — Séances, parcours et hors planification (proposition B — lien fin) » `12906:47`.

| Règle | Constat |
|---|---|
| Une carte uniforme par Séance | CONFORME |
| Ligne Ⓟ compacte au-dessus du premier élément, sans heure, statut ni compteur | CONFORME |
| Rail sans numéros | CONFORME (lien vertical noir fin) |
| Composition sans répétition du nom | NON VÉRIFIABLE : aucun écran déployé dans cette évolution |
| Pas de statut global du parcours | CONFORME |
| Heure réelle des Séances exécutées | CONFORME (14h00 exécutée) |
| « — » pour les Séances suivantes non exécutées | **NON CONFORME** : « Étirement du quadriceps », non exécutée, affiche « 14h07 ». Écart laissé en l'état, À CLARIFIER (spécification § 8, question 7) |
| Hors planification | CONFORME (« Gainage », 17h05) |

L'écran `12890:19` (rail gris) est la variante non retenue.

### Décisions D-536 à D-540

- **D-536 et D-537** : présentes dans ch07 de cette branche.
- **D-538 à D-540** : rédigées seulement sur `docs/planification-grille-creneaux`, non fusionnée. Elles sont citées dans les DSF et leur texte a été lu sur cette branche.
- **Aucune incompatibilité constatée avec D-553.**
- **D-539** retenait, au choix de Claude et sans promotion en règle, les routines terminées et l'ordre alphabétique pour le filtre. Cette mention est ajoutée à la question 3, qui reste À CLARIFIER.

### Cohérence interne de la spécification

**Contradiction corrigée (classe A, mise en cohérence interne).**
- § 5 représentait une Routine à Séance unique, dans le filtre, « par le nom de sa Séance ».
- Or § 2 dit que le renommage d'une Routine se voit dans le filtre, et CE-UI-15 que le libellé est identique au Journal.
- § 5 porte désormais le nom de la Routine.

## Matrice de conformité par décision

| Décision | Avant mission | Après mission |
|---|---|---|
| D-522 (nom unique, non hérité) | supersédée par un complément, ligne non annotée | annotée « Remplacé en partie le 21/11/2026 (D-553) » |
| D-527 (portée de l'unicité) | non traitée | annotée |
| D-533 (carte de routine) | complément | annotée ; rendu de carte conservé |
| D-534 (une carte par occurrence, enchaînement) | complément | annotée ; enchaînement en vigueur |
| D-535 (Journal) | complément | annotée « Complété » |
| D-536, D-537 | conservées | conservées, aucun conflit |
| D-538 à D-540 | branche non fusionnée | non modifiées ; D-539 rappelée à la question 3 |
| RM-258, RM-261 (ch10) | complément | annotées (RM-261 supprimée ; cas du nom vidé À CLARIFIER) |
| ch04, ch09 | complément présent | CONFORME, aucune contradiction trouvée |
| ch11 API | non traité | API-ROU-01 : nom généré, sans unicité |
| ch12 Architecture | non traité (unicité, `RoutineAgendaCard`) | annoté ; rattachement et lecture des Exécutions sans occurrence à concevoir |
| ch13 CE-UI-15 et carte Semaine | complément | annotations en tête et sur la carte Semaine |
| ch06 Écrans | non traité | carte Semaine annotée, écran de référence `12906:47` |
| ch05 MVP | — | CONFORME : aucune formulation contraire |
| PRODUCT.md | complément | état Figma mis à jour |
| DSF Agenda | complément en fin | titre de carte et § 7 annotés ; référence Figma |
| DSF Journal | complément en fin | position du Ⓟ annotée ; nœuds Figma |
| INDEX.md | absent | entrée ajoutée |

## Recherche des anciennes formulations

Expressions recherchées :
- `nom … (unique|obligatoire)` et `unicité … routine/planification` : D-522, D-527, RM-258, RM-261, ch12 l. 619 ; toutes annotées ;
- `une (seule) carte par occurrence` : D-534, DSF Agenda § 7, ch12 l. 623 ; annotées ;
- `carte de routine`, `nom de la routine` en titre : D-533, DSF Agenda § 5, ch13 l. 4136, ch06 l. 1245 ; annotées ;
- `statut global` / `statut agrégé` : aucune occurrence active.

Contradictions résiduelles volontairement conservées :
- les anciens prompts `docs/PROMPT-CLAUDE-CODE-AGENDA-ONGLETS-2026-11-19.md` et `…ENCHAINEMENT-SEANCES-2026-11-19.md` décrivent la carte par occurrence. Ce sont des traces de missions closes, non normatives ;
- les copies sous `docs/preparation/` sont aussi des traces de missions closes.

## Figma

### Nœuds consultés

| Nœud | Écran ou élément |
|---|---|
| `12906:47` | Agenda validé |
| `12890:19` | Variante Agenda non retenue |
| `1992:5510` | « Calendrier — Journal — MVP » |
| `12795:25088` | Filtre — choix de la routine |
| `12799:24881` | Filtre — vue filtrée |
| `12798:26906` | Ligne de filtre « Renforcement du genou » |
| `12759:24627`, `12759:24830` | Modales de suppression du Journal |

### Nœuds modifiés

| Nœud | Modification |
|---|---|
| `12736:25026` (dans `1992:5510`) | Carte « Mobilité du matin (parcours) » : Ⓟ `12917:25326` après le nom (`12736:25032`), zones « Hanches, Dos + » |
| `12798:26926` (dans `12795:25088`) | Ligne « Mobilité du matin (parcours) » : Ⓟ `12917:25328`, nom `12798:26932` |
| `12799:24881` | Lundi : la carte « Étirement du quadriceps » est remplacée par le groupe parcours `12917:25330` (ligne Ⓟ, lien, 14h00 terminée, « — » à rattraper) |
| `12799:24881` | Jeudi : la carte est remplacée par le groupe `12917:25371` (teintes « à venir », « Démarrer » sur la 1re Séance, « — » sans action sur la 2e) |

Composants : aucun créé ni modifié. Il n'existe pas de composant pour le Ⓟ ; l'icône a été copiée depuis l'écran validé.

### Captures

Les captures du Journal, du filtre et de la vue filtrée sont envoyées dans la conversation.

## Hypothèses non démontrées

- **Ⓟ après le nom dans le Journal et le filtre.** La règle de Hermann du 20/11/2026 (« au Journal aussi, le P suit le nom ») est conservée. Un premier essai plaçait le Ⓟ devant ; la seconde passe l'a signalé comme une règle inventée, et il a été corrigé.
- **Vue filtrée, 2e Séance non commencée d'un parcours sans action.** Rendu provisoire, À CLARIFIER (question 5).

## Modifications réalisées

Documentation uniquement :
- annotations datées ;
- ligne D-553 au registre ;
- spécification (§ 5, § 6, § 8 : questions 5 à 7) ;
- DSF, PRODUCT et INDEX.

## Éléments non corrigés ou hors périmètre

- **Écart Agenda « 14h07 » contre « — »** : à arbitrer.
- **Questions À CLARIFIER 1 à 8 de la spécification** : non tranchées.
- **Report de D-553 sur `docs/planification-grille-creneaux`** : non préparé (voir seconde passe, point 6).
- **Écran déployé du Journal pour un parcours** : non dessiné (inchangé).

## Synchronisation code / documentation

- **Classe B** : D-553, décision de Hermann.
- **Classe A** : cohérence interne du § 5.
- **Aucun code modifié.**

## Vérifications restant à effectuer sur appareil réel

Aucune pour cette mission documentaire. La lisibilité du Ⓟ et du lien fin sera vérifiée lors du développement.

## Preuves et tests

- **Aucun test applicable** : la mission est documentaire.
- **Contrôles :**
  - `git diff --check` ;
  - recherches ci-dessus ;
  - captures Figma relues après modification ;
  - seconde passe indépendante (section suivante).

## Seconde passe indépendante

Un agent distinct a relu le diff, les liens, les formulations contraires et la cohérence interne, en lecture seule.

- **Bloquant :** aucun.
- **Sans défaut :**
  - texte historique préservé (14 lignes annotées, aucune suppression) ;
  - aucun renommage de chemin ;
  - 16 liens qui résolvent ;
  - plus aucune carte par occurrence ni statut global actif ;
  - aucun filtre qui liste les Séances d'un parcours séparément.

**Points relevés et traités :**
1. **CE-UI-12** (ch13) : « nom … unique, RM-258 ». Annoté.
2. **Complément CE-UI-15** : « Heure prévue uniquement pour la première Séance non exécutée » contredisait « — ». Reformulé.
3. **DSF Journal** : le Ⓟ devant le nom contredisait la règle du 20/11. Rétabli après le nom, dans les documents et dans Figma.
4. **Registre, recette du 20/11** (nom de Séance au déployé, nom obligatoire, P après le nom sur l'Agenda) : annotés.
5. **Cas d'une Séance suivante d'un parcours déjà commencé** (D-536 et D-540), statut et gestes : question 8 ajoutée.
6. **Branche `docs/planification-grille-creneaux`** (D-536 à D-540, non fusionnée) : aucun correctif préparé. À reporter lors de sa fusion : l'annotation D-553 sur D-539 (liste du filtre, cartes réduites au nom).
7. **Divers :** « Journal et filtre à ajuster » mis à jour. Règle « — » étendue au parcours commencé, citation du prompt de Hermann. Nom de Routine visible dans la ligne Ⓟ. RM-264 annotée.

## Fichiers modifiés

- `docs/KODJO-Agenda-seances-journal-filtre-2026-11-21.md`
- `docs/DSF-AGENDA-PLANNING-2026-11-19.md`
- `docs/DSF-JOURNAL-2026-11-19.md`
- `docs/PRODUCT.md`
- `docs/INDEX.md`
- `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md`
- `docs/Specifications-fonctionnelles/11 – API fonctionnelles.md`
- `docs/Specifications-fonctionnelles/12 – Architecture technique.md`
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`
- ce rapport.

## Commit final et état Git

Donnés dans le compte rendu de livraison et dans la PR.

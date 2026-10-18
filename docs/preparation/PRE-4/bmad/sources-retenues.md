# PRE-4 BMAD — sources retenues et révisions

Établi le 2026-10-16, puis actualisé le même jour avec les décisions de Hermann. Ce fichier sert d'entrée aux skills BMad 6.12.4 et sera transmis à ChatGPT pour la revue indépendante.

Les blobs sont des identifiants Git abrégés à 12 caractères.

## 0. Décision de Hermann (2026-10-16)

- **Code de départ :** `c32e360d891614f2b08a1d8f7f3f631eef0b57ea`, inchangé.
- **Exigences et visuel :** les mêmes sources consolidées que PRE-4 VNext, prises à `caa2a5cf11dc70f4c158dc5ccde325b49ff9d76d`. Leur provenance et leurs différences avec la base sont vérifiées (§3 et §5). Un document n'est pas prioritaire du seul fait qu'il est plus récent : chaque différence est classée et, si elle n'est pas résolue, signalée avant la rédaction de toute exigence qu'elle concerne.
- **Données Figma acquises pendant la préparation VNext :** captures, arbres, maîtres et variables sont des données d'entrée communes, donc utilisables.
- **Exclus :** le plan technique de VNext, ses contrats générés et les conclusions de ses revues.

## 1. Base Git

| Élément | Valeur |
|---|---|
| Dépôt | `MyUncried/Application-Routine` |
| Clone | `C:\Dev\KODJO-BMAD-PRE4` |
| Branche | `bmad/pre4-comparaison` |
| Commit de départ | `c32e360d891614f2b08a1d8f7f3f631eef0b57ea`, 2026-10-13, parent `96a191a9` sur `main` |
| Code applicatif | `src/`, `app/`, `package.json`, `package-lock.json` et `tsconfig.json` sont identiques à `626632c3` (clôture PRE-3) et à `main` 6656fefc. `git diff` vide. |
| Commit des sources communes | `caa2a5cf11dc70f4c158dc5ccde325b49ff9d76d`, 2026-10-15, descendant de la base sur `origin/plan/pre4-vnext-20261013` |
| Push | Bloqué (`pushurl` en `example.invalid`) |

## 2. Documents de cadrage, identiques à la base et à `caa2a5cf`

| Fichier | Blob | Usage |
|---|---|---|
| `docs/preparation/PRE-4/perimetre-et-couverture.md` | `be39e68ca43a` | Périmètre normatif : ED-01 à ED-22 et « Hors périmètre ». Les passages de pilotage VNext ne s'appliquent pas : #352, pilote, bootstrap, PlanContract, relais, « Suite opérationnelle ». |
| `docs/preparation/PRE-4/references-figma.json` | `6ca7a511af31` | Les 32 frames de la page Prototype MVP (`G6RY5Ebhgwb4AHIOYDwwvg`, `510:101`) |
| `docs/preparation/PRE-4/figma/manifest.json` et les 32 `*.json.gz` | `52981b457896` | Arbres Figma du 13/10, SHA-256 vérifiés, 0 écart |

## 3. Provenance des sources communes

Vérification faite à partir des seules métadonnées du paquet source Figma de VNext (`planification/figma-source-vnext.json`, champs `metadata.documents` et `metadata.resources`, sans lecture des états, décisions ni du plan) :

- **Document normatif :** le chapitre 13 au commit `87c53f24`, en fichier entier. Son empreinte est identique à celle du chapitre 13 de `caa2a5cf`. Aucun fichier de `docs/` ne diffère entre `87c53f24` et `caa2a5cf`, hors `planification/`.
- **Captures :** les 32 PNG ont la même empreinte SHA-256 qu'à `caa2a5cf`.
- **Données Figma :** 786 variables et 3 collections, comme dans `fermeture-maitres-et-variables.json.gz`. 5 465 nœuds, soit les 5 085 de la capture du 13/10 plus les 380 nœuds de maîtres.

Origine des changements entre la base et `caa2a5cf` dans les documents produit :

| Commit | Date | Nature | Statut pour BMad |
|---|---|---|---|
| `7a89220f` « docs: consolider les spécifications dans les chapitres 01 à 13 » | 14/10 | Documentation produit : fusion des `SPECIFICATION-*.md` dans les chapitres, glossaire déplacé du ch. 00 au ch. 01 | Source commune |
| `d8985d6e` « préciser autorité des spécifications… » | 14/10 | Documentation produit, dont la « Clarification d'autorité » du ch. 13, l. 4057-4063 | Source commune |
| `f8088616` « intégrer les formats de séances… » | 14/10 | Lot Formats | Hors périmètre (D-357 à D-369, CE-FMT, RM sans numéro) |
| `768dbaa7` « actualiser 129 captures depuis Prototype MVP » | 14/10 | Captures | Source commune (§4) |
| `69e9178c` « docs(pre4): freeze visual closure and expected plan scenarios » et `66ece980` « docs(pre4): disambiguate end-to-end screen states… » | 13/10 | **Préparation VNext** insérée dans le ch. 13 : « Inventaire opposable PRE-4 », l. 4346-5996, JSON `kodjo.screen-states.v1`, 83 états | Source commune pour son contenu produit, mécanismes VNext exclus (Q7, 2026-10-16) |
| `87c53f24`, `8b441f80`, `4b4c02e1`, `caa2a5cf` (`pre4`) | 15/10 | Reprise du plan VNext sur la documentation consolidée | Seule la documentation produit qu'ils portent est retenue |

## 4. Sources normatives pour les exigences et le visuel : dossier commun `caa2a5cf`

Tous les fichiers sont copiés sous `docs/preparation/PRE-4/bmad/sources-caa2a5cf/`, avec leur arborescence d'origine. Les 50 fichiers ont été vérifiés contre leur blob `caa2a5cf` : 0 écart. Les documents de la base ne sont pas remplacés.

| Source | Chemin à `caa2a5cf` | Blob |
|---|---|---|
| Glossaire, dont §8 sur les termes interdits | `docs/Specifications-fonctionnelles/01 – Vision Générale.md` | `1394b693258d` |
| Ch. 04 Modèle fonctionnel | `…/04 – Modèle fonctionnel.md` | `67648e47d317` |
| Ch. 05 Versions et frontières | `…/05 – Versions du produit.md` | `e455a5771b75` |
| Ch. 06 Écrans et navigation | `…/06 – Ecrans et navigation de la V1.md` | `74de302c7cb8` |
| Ch. 07 Décisions | `…/07 – Registre des décisions de conception.md` | `2b5e02efeae7` |
| Ch. 08 Conception détaillée : `#parametres-exercice`, `#phrases`, annexe | `…/08 – Conception fonctionnelle détaillée.md` | `30d5c3224c2b` |
| Ch. 09 Données : `#cibles-typees`, migration | `…/09 – Modèle de données fonctionnel.md` | `579225e77e0f` |
| Ch. 10 Règles : `#calculs-durees`, `#resultats-temporels`, `#cibles-mixtes` | `…/10 – Processus métier et règles métier transverses.md` | `3dd483e58829` |
| Ch. 11 API | `…/11 – API fonctionnelles.md` | `cc52bf4e4a77` |
| Ch. 12 Architecture | `…/12 – Architecture technique.md` | `312343afd9ac` |
| Ch. 13 Contrats d'écran : CE-T03-04, CE-UI-09, CE-UI-10, l. 4057-4345. **La section l. 4346-5996 (« Inventaire opposable PRE-4 ») est reprise comme source produit commune, après vérification de cohérence, sans ses mécanismes VNext (décision Q7 du 2026-10-16).** | `…/13 – Contrats d’écran.md` | `d3f7f6da8560` |
| DSF Interface générale du 08/10 | `docs/DSF-INTERFACE-GENERALE-2026-10-08.md` | `ed11859ddff2`, identique à la base |
| DSF Circuits et contrôles du 12/10 (contrôles de l'éditeur seulement) | `docs/DSF-CIRCUITS-CONTROLES-2026-10-12.md` | `c31eb8c5d627` |
| DSF Deux modes du 13/10 | `docs/DSF-DEUX-MODES-ECHEC-2026-10-13.md` | `df94401ae4fc` |
| DSF Phrases v15 | `docs/DSF-PHRASES-V15-2026-10-07.md` | `544d41bcf106` |
| Matrice Deux modes | `docs/MATRICE-DEUX-MODES-ECHEC-2026-10-13.md` | `5d24d043dbcb`, identique à la base |
| 32 captures PNG | `docs/Specifications-fonctionnelles/images/circuits-2026-10-12/*`, `images/echec-2026-10-13/*` | Commit `768dbaa7` ; empreintes égales à celles du paquet VNext |
| Maîtres, variables et styles Figma : 25 racines, 380 nœuds, 786 variables, 3 collections, 61 styles | `docs/preparation/PRE-4/figma/fermeture-maitres-et-variables.json.gz` à `caa2a5cf`. Copie locale : `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/preparation/PRE-4/figma/`. Le fichier est absent du dossier `figma/` de la base. | `191bbbbc06b7` |
| Provenance des surcharges de 680 instances | `docs/preparation/PRE-4/figma/provenance-instances-2026-10-14.json` | `537271fe5088` |

Les chemins `…/` se lisent sous `docs/Specifications-fonctionnelles/`.

**Lues en place, identiques aux deux révisions :**
- `docs/archives/deux-modes-echec-2026-10-13/KODJO_Prompt_Deux-modes-et-echec_2026-10-13_complet.md` (`1dd4e5638427`) : les consignes d'origine du 13/10, source historique et non normative ;
- `docs/archives/evolutions-v15-2026-10-07/phrases-276.json` (`17e61b146683`) : le corpus de référence des 276 phrases v15 ;
- `docs/preparation/PRE-3/perimetre-et-couverture.md` (`2c4b7f3755cb`) : les règles PRE-3 conservées.

**Base `c32e360d`, en traçabilité seulement.** Les fichiers `SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md` (`032c69cf698d`), `SPECIFICATION-PARAMETRES-MODALE-v13.md` (`d2da955ba0d8`), `SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md` (`3bdd6de1378b`), `SPECIFICATION-BIP-CADENCE-v2.md` (`f15c7c5db0c0`) et `CONSOLIDATION-EVOLUTIONS-V15-2026-10-07.md` (`46c14013adf4`) servent à retrouver ce que la consolidation a perdu (§5). Le tableau EC-01 à EC-10 et les liens vers le corpus n'existent plus qu'à la base.

**Figma en direct :** lecture seule, aucune modification. Figma ne définit que le visuel, jamais une règle (D-255, D-300).

## 5. Différences entre la base et `caa2a5cf` dans le périmètre

Ce relevé vient de quatre comparaisons ligne à ligne en lecture seule. Le cœur normatif (cible typée, brouillon, bornes, sélecteur, calculs, résultats temporels, grammaire, migration) a été intégré tel quel. Aucune décision D n'est retirée, aucun statut ne change, aucune borne ni valeur par défaut n'est modifiée.

Les différences fonctionnelles ci-dessous sont classées en trois catégories :
- **Retenue** : la règle de `caa2a5cf` s'applique ;
- **Base** : le contenu perdu à `caa2a5cf` reste repris depuis la base ;
- **Ouverte** : voir `questions-ouvertes.md`.

| ID | Différence | ED | Classement |
|---|---|---|---|
| Δ1 | Phrase v1 l. 50 « aucun ≥ » devient au ch. 08 l. 647 « ≥ lorsque calculable pour le mélange chiffré/échec ». La contradiction interne de la base avec Phrase v1 l. 76 et Deux modes §4 disparaît. | ED-13, ED-16 | Retenue |
| Δ2 | Ch. 08 l. 1790 : la Durée totale est omise « uniquement en Durée, une Série, sans changement de côté et sans pause ». Alignement sur la règle de redondance de Phrase v1. | ED-16 | Retenue |
| Δ3 | Ch. 06 l. 2206 : le segment Mode a deux options, et À l'échec est un type de cible. Une contradiction interne de la base disparaît. | ED-05 | Retenue |
| Δ4 | Ch. 08 l. 609-618 : la règle de format des durées (0 s, x s, x min, m min s s), reprise de Phrase v10.2 §4, devient active. Son accord avec les 276 cas reste à vérifier. Les durées d'une heure ou plus ne sont pas définies. | ED-16, ED-17 | Retenue, avec vérification contre le corpus |
| Δ5 | Ch. 09 l. 687-689 : `SERIES_PAUSE` existe après chaque Série positive, dernière comprise, sauf si une récupération positive la remplace. Alignement sur D-248, DM-014 et RM-036. | ED-15, ED-13 | Retenue. Le moteur reste hors périmètre. |
| Δ6 | Ch. 08 l. 33 : le ch. 13 fait autorité sur les champs. L'annexe du ch. 08 (l. 1559-1561) maintient pourtant « commandes −/valeur/+ permanentes », contre ch. 13 l. 2997 et 4085 (± révélés à l'appui). | ED-10 | Retenue : le ch. 13 prévaut, en application de ch. 08 l. 33 |
| Δ7 | Les liens vers `phrases-276.json`, la plage de référence et la répartition (140 sans total, 46 ≈, 90 exacts, aucun ≥) sont perdus. Le croisement régime × tout numérique/tout échec/mixte n'est repris que partiellement. | ED-17 | Base : Phrase v1 et Deux modes l. 159 à `c32e360d`, corpus en archives |
| Δ8 | Le tableau EC-01 à EC-10 de Deux modes §1 est perdu. D-111 et D-298 y renvoient encore (renvois sans cible). | ED-05 à ED-08, ED-13, ED-16 | Base : identifiants EC conservés pour la traçabilité |
| Δ9 | Q-07 et D-309 (« ≥ seulement en Séance ») ne sont plus marqués comme amendés. La règle active autorise ≥ à l'Exercice. | ED-13 | Retenue : la règle active s'applique, Q-07 et D-309 lus comme amendés (ch. 07 l. 604) |
| Δ10 | Ch. 06 l. 2265-2310 (base) : la phrase « une frame de référence de composant ne doit pas être promue au rang d'écran » disparaît. | ED-02 | Base : principe conservé, sans conflit à `caa2a5cf` |
| Δ11 | Les 32 PNG diffèrent tous, sur les lignes 60-76 seulement : le titre « Créer un exercice » passe de gras foncé à normal gris plus petit. Aucun texte ne documente ce changement. | ED-02 | Ouverte, non bloquante. Les captures de `caa2a5cf` font foi, Figma en direct sert d'arbitre visuel (Q9). |
| Δ12 | La valeur « négatif, 11, fraction refusés » du Bip (v13 §10) avait été relevée comme absente de `caa2a5cf`. **Corrigé le 2026-10-16 : elle y figure, ch. 13 l. 3027 et ch. 09 l. 1270.** | ED-09, ED-11 | Retenue : la règle est présente aux deux révisions |
| Δ13 | Pertes mineures : la précision de compaction de Deux modes l. 153 et les exemples de calcul de CONSOLIDATION (330 s) ; seules les formules sont conservées. | ED-15, ED-16 | Base, à titre d'exemple non normatif |
| Δ14 | Défauts de rédaction à `caa2a5cf` : « (RM-et RM-) » en ch. 10 l. 134-143, l'ancre F-0 à F-8 en ch. 12 l. 1565, « paramètres d'exercice et8 » en ch. 09 l. 1142, et « migrations 001..008 ; 009 prochain » en ch. 12 l. 1565 et ch. 11 l. 435, alors que le code de départ contient déjà `migration001` à `migration009`. | ED-13, ED-15, ED-18, ED-19 | Sans effet sur les règles. La numérotation de migration se lit dans le code, pas dans la spécification. |

Les contradictions présentes aux deux révisions et les manques résiduels sont dans `questions-ouvertes.md`.

## 6. Exclues

- `docs/preparation/PRE-4/planification/` (`caa2a5cf`) : plan technique, contrats générés, inventaires et graphes, revues, reprises, résolutions, `create-slots.json`. La lecture s'est limitée aux métadonnées de provenance citées au §3. Voir l'exposition involontaire consignée dans `journal-comparaison.md`.
- Dans le ch. 13 de `caa2a5cf`, l. 4346-5996, les seuls mécanismes VNext : identifiants techniques `state_id`/`scenario_id`, champs `proof_required`, verdicts et preuves de revue. Le contenu produit est repris (Q7).
- `autorisation-demarrage.json`, `checkpoint-demarrage.json`, `.github/orchestration/reports/*PRE4*`, `scripts/kodjo/`, `tests/kodjo/`, les workflows et les requêtes `vnext-agent`.
- Le lot Formats (D-357 à D-369, CE-FMT, `docs/sources/formats-2026-10-14/`), Composition, Volumes, circuits, le placement R et Points d'arrêt, et le moteur d'exécution.
- `main` postérieur à `caa2a5cf`.

## 7. Sources effectivement utilisées par les documents BMad (2026-10-16)

Les documents BMad de `_bmad-output/` ont été rédigés à partir des sources ci-dessous. Toutes sont lues à `HEAD` = `a8ec6c35cfecabce705c5a052e2a1d993279334d`, dont le code applicatif est identique à `c32e360d`. Le lockfile est vérifié identique à `626632c3` et `c32e360d` (`git diff` vide).

| Usage | Source | Blob ou révision |
|---|---|---|
| Exigences et visuel | Les 50 copies consolidées de `caa2a5cf` (§4), section l. 4346-5996 du ch. 13 comprise, sans ses mécanismes VNext (Q7) | Blobs du §4 |
| Périmètre | `docs/preparation/PRE-4/perimetre-et-couverture.md` (ED-01 à ED-22, hors périmètre) | `be39e68ca43a` |
| Règles PRE-3 conservées | `docs/preparation/PRE-3/perimetre-et-couverture.md` | `2c4b7f3755cb` |
| Corpus oracle | `docs/archives/evolutions-v15-2026-10-07/phrases-276.json` | `17e61b146683` |
| Corpus, encodage de test PRE-3 (276 phrases identiques, P43) | `docs/preparation/PRE-3/planification/attendus-phrases-276.json` | `c9ebd6c563ae` |
| Traçabilité de la base (contenus perdus Δ7, Δ8, Δ13) | `SPECIFICATION-*.md`, `CONSOLIDATION-EVOLUTIONS-V15-2026-10-07.md`, consigne historique du 13/10 (§4) | Blobs du §4 |
| Conventions et règles d'implémentation | `AGENTS.md` | `356ad144ff6e` |
| Code de départ (architecture, état des lieux) | `src/`, `app/`, `package.json`, `package-lock.json` | `c32e360d` ; lockfile `a3a033f3dfa5` |
| Figma | **Données locales seulement** : les 32 arbres `docs/preparation/PRE-4/figma/*.json.gz` (`manifest.json`), `references-figma.json` (`6ca7a511af31`), et `fermeture-maitres-et-variables.json.gz` (`191bbbbc06b7`, copie sous `sources-caa2a5cf/`). **Aucune lecture de Figma en direct** pendant cette préparation. Fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page Prototype MVP `510:101`. | — |
| Bibliothèque `@expo/ui` 57.0.13 (faisabilité des primitives natives) | Types, Swift et changelog lus **en lecture seule** dans `C:\Dev\Application-routine-pre2-plan\node_modules\@expo\ui\`, faute de `node_modules` dans ce clone ; documentation Expo v57 en ligne. Même version que le lockfile ; aucun document VNext. Voir `journal-comparaison.md`. | npm `@expo/ui@57.0.13` |
| Décisions | `docs/preparation/PRE-4/bmad/questions-ouvertes.md` : Q1 à Q24 de Hermann, P1 à P45, H4 à H30 | Version de travail, non commitée |

Les extractions règle par règle, avec `fichier:ligne`, sont dans `_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/extracts/`.

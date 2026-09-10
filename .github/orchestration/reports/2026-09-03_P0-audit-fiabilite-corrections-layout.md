# AUDIT P0 — Fiabilité de l’identification et de la correction des écarts de layout

**Date :** 2026-09-03  
**Projet :** KODJO / `MyUncried/Application-Routine`  
**Branche examinée :** `feat/creation-seance-catalogue`  
**Périmètre volontairement limité :** Catalogue vide, Composition d’une séance, création d’un Exercice.  
**Verdict :** **NO-GO — chaîne de conformité visuelle non fiable**.

## 1. Objet de l’audit

Cet audit ne cherche pas à dresser une nouvelle liste exhaustive d’écarts. Il cherche à expliquer pourquoi des écarts simples, visibles, documentés et parfois signalés plusieurs fois sont encore présents après plusieurs cycles d’analyse et de correction.

La chaîne examinée est :

`référence Figma/contrat → première implémentation → audit → instruction de correction → modification → tests → validation sur iPhone`.

## 2. Sources effectivement examinées

- captures Figma de référence : `catalogue-vide.png`, `composition-etat-initial.png`, `creation-activite-exercice.png` ;
- captures iPhone des premières versions et de la livraison suivant les corrections ;
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md` ;
- rapport `T01_S01_S08_CONFORMITY_AUDIT_20260902.md` ;
- diagnostic `2026-09-03_P0-diagnostic-controles-interactifs.md` ;
- historique Git vérifiable des premières livraisons : S06 `e56c5de`, S07 `bc58445`, S08 `d43317e`/`d19fd18`/`3a8f7f7`, puis PR #34, HEAD distant `6ef1821` ;
- périmètre déclaré de la PR #34 et fichiers d’écran modifiés ;
- état local déclaré dans le dernier diagnostic : 21 fichiers applicatifs/tests modifiés, corrections d’ordre/zIndex incluses, non commitées au moment du diagnostic.

### Limite de preuve

Les modifications locales postérieures à `6ef1821` ne sont pas toutes disponibles dans GitHub. Leur effet est néanmoins observable dans les captures iPhone et leur nature générale est déclarée dans le diagnostic. L’audit distingue donc :

- **démontré** par document, code versionné ou capture ;
- **rapporté** par le compte rendu Claude ;
- **non traçable** faute de commit/diff publié.

## 3. Chronologie utile

| Étape | Ce qui a été produit | Ce qui aurait dû empêcher la persistance des défauts | Ce qui s’est réellement passé |
| --- | --- | --- | --- |
| S06–S08 | Premières implémentations Catalogue, Composition et Exercice | Comparaison systématique aux frames de production | Les implémentations précèdent le contrat d’écran complet ; aucune preuve de comparaison géométrique n’est conservée |
| PR #34 | Contrats d’écran complets, assets et icônes | Revalidation complète de chaque écran au nouveau contrat | Les changements applicatifs visibles portent surtout sur les glyphes/icônes ; la structure des layouts n’est pas remise à niveau |
| Audit du 02/09 | Audit formel sur `6ef1821` | Transformer chaque écart en défaut traçable et bloquant | Le rapport reconnaît l’absence totale de comparaison visuelle, mais qualifie malgré tout la structure du Catalogue de conforme/partiellement conforme |
| Première correction locale | Corrections ponctuelles, notamment ordre et zIndex | Rejouer tous les critères visuels des écrans touchés | Les captures montrent des améliorations isolées, sans convergence globale ; aucun tableau avant/après par défaut n’est livré |
| Diagnostic P0 contrôles | Analyse statique des interactions | Isoler les causes des contrôles inactifs | Diagnostic utile sur les contrôles, mais hors sujet pour les écarts de layout ; aucune correction ni preuve device |
| Nouvelle recette iPhone | Captures réelles | Fermer uniquement les défauts visuellement démontrés | Plusieurs défauts initiaux restent présents ; ils avaient été omis ou insuffisamment spécifiés dans les missions précédentes |

## 4. Traçabilité des exemples retenus

### LAY-01 — Catalogue vide : séparateur de Header et bande Context bleu pâle absents

- **Référence :** frame `2117:86`, Shell `Context=On, Bottom=Navigation`, Header `0–92`, Context `92–207`. La capture de référence montre un séparateur horizontal fin sous le Header et une bande Context bleu très pâle.
- **Première livraison :** titre, segments et action sont rendus comme un bloc générique sur fond blanc ; la structure visuelle du Shell n’est pas reproduite.
- **Audit du 02/09 :** **non identifié**. Le rapport affirme au contraire « structure, filtres, calculs de carte conformes », tout en indiquant qu’aucune comparaison visuelle n’a été faite.
- **Correction demandée :** aucune correction atomique et mesurable retrouvée pour ce point.
- **Livraison suivante :** défaut toujours visible.
- **Cause de persistance :** faux positif d’audit. Une conclusion de conformité a été émise sans preuve visuelle et le défaut n’est donc jamais entré dans une liste de correction obligatoire.

### LAY-02 — Composition : séparateur/bande Context et titre d’écran absents

- **Référence :** frame `2028:11137`, titre fixe `Composition d’une séance`, séparateur sous le Header, zone Context bleu pâle contenant le nom/couleur et l’action Ajouter.
- **Première livraison :** le nom de séance tient lieu de titre principal ; le vrai titre d’écran et la structure du Shell manquent.
- **Audit du 02/09 :** **partiellement identifié mais mal cadré**. AUD-03 relève uniquement l’absence du bouton Retour. Le titre et la bande Context ne sont pas recensés.
- **Correction demandée :** ajout du Retour et corrections ponctuelles ; aucune reconstruction explicite du Shell avec ses zones et dimensions.
- **Livraison suivante :** Retour ajouté, mais titre et structure du Shell toujours absents.
- **Cause de persistance :** la correction a suivi exactement le défaut étroitement formulé (« Retour absent »), pas la frame complète. L’écran a été corrigé par addition locale au lieu d’être recomposé selon le Shell.

### LAY-03 — Composition : bouton `+ Ajouter une activité` trop haut

- **Référence :** bouton visuel compact de la frame, distinct de sa cible tactile minimale de 48 points.
- **Première livraison :** hauteur dictée par l’icône 24 points et le padding vertical générique ; le cadre visuel devient plus haut que la référence.
- **Audit du 02/09 :** **non identifié**. L’audit vérifie le remplacement du glyphe `+` par l’asset `action-add`, pas la boîte visuelle du bouton.
- **Correction demandée :** remplacement d’asset, sans critère sur hauteur, padding, alignement optique ni séparation entre taille visuelle et hit area.
- **Livraison suivante :** défaut persistant.
- **Cause de persistance :** validation de présence d’asset confondue avec validation du composant rendu.

### LAY-04 — Composition : carte Tour non conforme

- **Référence :** composant `Tour Section` bleu/lavande, icône de Tour à gauche, `Tour`, contrôle `x1`, dimensions et rayons déterminés ; placé entre les activités concernées et avant Fin de séance.
- **Première livraison :** ligne grise générique, icône absente, dimensions et hiérarchie incorrectes ; synthèse globale indépendante mal placée.
- **Audit du 02/09 :** **très partiellement identifié**. Le rapport vérifie la valeur `x1`, l’absence de Cycle et les calculs, mais ne relève ni couleur, ni dimensions, ni icône, ni composition interne.
- **Correction demandée :** une correction d’ordre est rapportée dans l’état local, sans spécification complète du composant.
- **Livraison suivante :** l’ordre et la distinction Tour/activité restent confus sur les captures ; la carte demeure visuellement non conforme.
- **Cause de persistance :** le défaut composite a été réduit à une règle de données/ordre. Il n’a pas été décomposé en critères vérifiables : position, taille, couleur, icône, libellé, contrôle x1 et relation avec la synthèse.

### LAY-05 — Composition : icônes Compte à rebours et Fin de séance mal positionnées

- **Référence :** icônes à droite des cartes Boundary Activity ; poignée de structure à gauche, titre et sous-libellé dans la colonne de texte.
- **Première livraison :** icônes rendues à gauche comme icônes de ligne génériques.
- **Audit du 02/09 :** **non identifié**. Le contrôle `visualAssets.test.ts` vérifie l’existence des ressources et l’absence de glyphes, pas leur placement.
- **Correction demandée :** utilisation des bons SVG, sans contrainte de slot ni composant `Boundary Activity`.
- **Livraison suivante :** les bonnes icônes existent, toujours dans le mauvais emplacement.
- **Cause de persistance :** l’exigence a été formulée au niveau « ressource », pas au niveau « composant + position ».

### LAY-06 — Création d’Exercice : rangée des trois paramètres et cadres

- **Référence :** sous `Paramètres de l’activité`, Durée, Pause et Séries sont sur une même rangée, dans un cadre de groupe bleu très pâle ; chaque valeur est dans un contrôle blanc bordé.
- **Contrat :** CE-T01-13 impose explicitement que la rangée des trois paramètres reste lisible et ne se réorganise qu’en largeur compacte si nécessaire. La largeur de référence est `402 × 874` : la rangée doit donc être conservée.
- **Première livraison :** trois grandes cartes verticales pleine largeur, sans cadre de groupe ni contrôles blancs internes.
- **Audit du 02/09 :** **non identifié**. Le rapport traite les cibles tactiles et les popovers, mais pas cette divergence structurelle évidente.
- **Correction demandée :** aucune instruction atomique retrouvée imposant la rangée, le cadre parent et les trois cadres enfants.
- **Livraison suivante :** défaut intact.
- **Cause de persistance :** le contrat textuel pourtant explicite n’a pas été transformé en assertion de layout ni en capture de contrôle.

### LAY-07 — Création d’Exercice : couleur du segment sélectionné

- **Référence :** sélection pleine bleu/violet DS ; texte blanc. Les segments non sélectionnés restent blancs/gris selon le composant.
- **Première livraison :** sélection blanche sur fond gris clair, texte sombre ; état actif presque inversé par rapport à la référence.
- **Audit du 02/09 :** **non identifié**.
- **Correction demandée :** ajout ou présence du segment seulement ; aucune exigence sur les tokens d’état sélectionné.
- **Livraison suivante :** segment présent, couleur toujours incorrecte.
- **Cause de persistance :** un contrôle a été considéré conforme dès qu’il existait et répondait à l’action, sans vérification de ses variantes visuelles.

## 5. Ce qui avait été identifié et ce qui ne l’avait pas été

| Catégorie | Correctement identifié | Identifié trop partiellement | Non identifié |
| --- | --- | --- | --- |
| Catalogue | Recherche absente ; dette de comparaison visuelle | — | Shell Header/Context, séparateur, fond bleu pâle, géométrie réelle du bouton Créer |
| Composition | Retour absent ; popovers en flux ; action finale désactivée | ordre/données du Tour ; présence des SVG | titre d’écran, Shell, bande Context, hauteur Ajouter, visuel complet du Tour, position des Boundary icons, position de la synthèse |
| Exercice | segment Type initialement absent ; cibles tactiles ; popovers | présence/égalité logique des segments | rangée des trois paramètres, cadre parent, cadres enfants, couleur sélectionnée, conformité géométrique |

## 6. Classification contractuelle

| Écart | Couverture disponible | Conclusion |
| --- | --- | --- |
| Shell, séparateur, zones fixes, bande Context | Figma + Design Foundation + contrat `Shell / Screen` | Identifiable sans commentaire utilisateur |
| Titre Composition | Figma + contrat CE-T01-04 | Identifiable sans ambiguïté |
| Hauteur du bouton Ajouter | Figma + tokens de contrôle + distinction cible tactile/cadre visuel | Identifiable par mesure ; le contrat textuel seul est moins précis mais la frame tranche |
| Tour : taille/couleur/icône/structure | Figma + composants DS + CE-T01-09 | Identifiable sans commentaire utilisateur |
| Position des Boundary icons | Figma + assets/composants DS | Identifiable visuellement ; insuffisamment explicite dans le contrat textuel isolé |
| Rangée Durée/Pause/Séries et cadres | Figma + CE-T01-13 explicite | Identifiable sans ambiguïté |
| Couleur du segment sélectionné | Figma + tokens/variant du Segmented DS | Identifiable sans commentaire utilisateur |

**Conclusion :** aucun des exemples retenus ne dépendait d’une information métier introuvable. Certains nécessitaient de mesurer la frame plutôt que de lire uniquement le texte, mais tous étaient objectivement identifiables à partir des sources disponibles.

## 7. Causes racines de non-fiabilité

### RC-01 — Conformité déclarée sans preuve visuelle

Le rapport du 02/09 dit simultanément qu’aucune comparaison Figma n’existe et que la structure du Catalogue est conforme. Cette conclusion était méthodologiquement invalide.

### RC-02 — Absence de registre atomique des défauts

Les écarts n’ont pas reçu d’identifiant stable, de statut `OPEN`, de propriétaire, de preuve attendue et de condition de fermeture. Ils disparaissent entre un commentaire général, une mission de correction et le rapport suivant.

### RC-03 — Instructions orientées symptômes partiels

Exemples : « ajouter le Retour », « remplacer le glyphe par le SVG », « corriger l’ordre ». Ces formulations permettent une modification locale tout en laissant le composant ou le Shell globalement faux.

### RC-04 — Tests inadaptés au risque

- Jest vérifie logique et rendu structurel ;
- `visualAssets.test.ts` vérifie présence/nom des assets ;
- TypeScript vérifie les types ;
- aucun de ces contrôles ne prouve taille, couleur, alignement ou position.

La couche de test correspondant au risque de layout — capture normalisée et comparaison visuelle — est absente.

### RC-05 — Fermeture par l’auteur de la correction

Claude a pu conclure « terminé » à partir du code et des tests qu’il venait lui-même de modifier. La validation indépendante sur la frame et sur iPhone n’était pas une barrière de clôture.

### RC-06 — Travail local non versionné

Les 21 fichiers modifiés localement rendent impossible une revue exacte depuis GitHub : pas de diff stable, pas de correspondance correction → commit, pas de retour fiable à l’état précédent.

### RC-07 — Rapport de mission, pas rapport de conformité par défaut

Les comptes rendus listent les fichiers et tests globaux, mais ne répondent pas pour chaque écart : attendu, obtenu, cause, changement, preuve avant/après, statut résiduel.

## 8. Pourquoi deux ou trois itérations n’ont pas convergé

La boucle réellement exécutée était :

`commentaire global → correction locale ciblée → tests techniques verts → mission déclarée terminée → nouvelle découverte visuelle par l’utilisateur`.

La boucle nécessaire est :

`défaut atomique OPEN → mesure attendue → correction → test adapté → capture après → comparaison indépendante → PASS ou reste OPEN`.

Sans le dernier segment, répéter la première boucle ne produit pas mécaniquement de convergence. Les mêmes défauts peuvent survivre indéfiniment malgré du code modifié et des tests verts.

## 9. Correctifs obligatoires du protocole

### G-01 — Registre de défauts obligatoire

Chaque défaut reçoit un ID stable et les champs : écran/frame, capture réelle, attendu mesurable, constat, source contractuelle, sévérité, cause racine, fichiers ciblés, tests exigés, statut, preuve de clôture.

### G-02 — Interdiction du mot « conforme » sans type de preuve

Chaque verdict doit être `PASS`, `FAIL` ou `NON VÉRIFIABLE` pour chacune des dimensions : fonctionnel, visuel, accessibilité, device. Un test logique vert ne peut produire qu’un PASS fonctionnel.

### G-03 — Correction pilotée par critères atomiques

Une mission Claude ne doit plus demander « aligner l’écran ». Elle doit citer les IDs et, pour chacun, les dimensions/relations/tokens/composants attendus.

### G-04 — Preuves avant/après normalisées

Pour chaque écran touché : capture `402 × 874`, même état de données, même échelle de texte, comparaison à la frame. Les largeurs `360` et `440` restent des contrôles de non-régression.

### G-05 — Non-clôture sans preuve device lorsque le défaut est device/layout

Si Claude ne peut pas exécuter sur iPhone, il livre `IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`, jamais `DONE` ni `CONFORME`.

### G-06 — Double contrôle indépendant

Claude implémente et fournit les preuves techniques ; ChatGPT compare les captures à la référence et ferme ou rouvre chaque ID. L’utilisateur ne doit intervenir que pour produire les captures device impossibles à obtenir à distance.

### G-07 — Rapport Markdown versionné à chaque mission

Le rapport complet est publié sous `.github/orchestration/reports/` dans le même cycle que la mission. Il contient le SHA, le diff, le tableau des IDs, les tests et les statuts résiduels. L’affichage terminal ne constitue pas une livraison.

### G-08 — Worktree propre et diff publiable avant nouvelle correction

Aucune nouvelle vague ne commence avec 21 fichiers non committés sans qualification. Les modifications existantes doivent être inventoriées, commitées sur une branche dédiée ou explicitement écartées par décision tracée.

## 10. Conditions minimales de la prochaine mission Claude

La prochaine mission de correction devra :

1. partir d’un commit identifiable et d’un worktree qualifié ;
2. ne traiter que LAY-01 à LAY-07 ;
3. reconstruire les écrans depuis les Shells/composants DS, pas empiler des offsets locaux ;
4. associer chaque changement de code à un ID ;
5. ajouter les tests structurels possibles, tout en reconnaissant qu’ils ne valent pas preuve visuelle ;
6. produire des captures normalisées si l’environnement le permet ;
7. publier le rapport Markdown avant de conclure ;
8. terminer au statut `IMPLEMENTED_AWAITING_DEVICE_VERIFICATION` tant que les captures iPhone n’ont pas été comparées ;
9. conserver tout ID non démontré comme `OPEN`.

## 11. Verdict final

Les écarts retenus étaient identifiables dans les sources disponibles. Leur persistance ne provient pas principalement d’un manque de documentation ou d’une difficulté technique. Elle provient d’une chaîne de contrôle qui :

- n’a pas recensé plusieurs écarts évidents ;
- a conclu à tort à une conformité partielle sans comparaison visuelle ;
- a formulé des corrections trop étroites ;
- a utilisé des tests sans rapport avec le risque de layout ;
- a clôturé des missions sans preuve après correction ;
- n’a pas conservé une traçabilité versionnée complète des itérations locales.

La chaîne actuelle ne permet donc pas de garantir qu’un écart signalé sera corrigé. La reprise du développement doit être conditionnée à l’application de G-01 à G-08 dès la prochaine mission.

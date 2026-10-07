# KODJO — corrections de l’audit fonctionnel documentaire du 06/10/2026

Mission : `CORRECTIONS_AUDIT_FONCTIONNEL_DOCUMENTAIRE`. Objectif : intégrer les corrections déterminées par la seconde passe de Claude, préserver les décisions déjà validées et isoler les points réellement non tranchés.

Branche : `docs/cadence-dsf-2026-10-06`, PR [#323](https://github.com/MyUncried/Application-Routine/pull/323), brouillon. Départ local et distant : `81dc851fc882dbafbb60045062d57cefdcfdd8f1`. Main observé : `6d03f5be579f2d0e2e7602b6abf1c2b46f4c740b`. Aucun run GitHub Actions sur la branche au contrôle préalable ; état propre du checkout. Les sessions externes de Claude ne sont pas observables ici.

## Sources et couverture

[Audit reçu](2026-10-06_AUDIT_FONCTIONNEL_CHAPITRES_CONTRATS_KODJO.md), conservé octet pour octet. Le patch fourni crée uniquement ce rapport ; `git apply --check` passe, le patch n’est pas appliqué en plus de la copie. Le commit local indiqué dans le patch n’est pas assimilé à une publication distante. Les empreintes des deux pièces et le delta exact sont conservés dans [les preuves](2026-10-06_CORRECTIONS_AUDIT_FONCTIONNEL_DOCUMENTAIRE_PREUVES.json).

Claude a contrôlé les 30 contrats avec les exclusions qu’il précise, lu intégralement Cadence v1 et Phrase v1, et recoupé les passages concernés. Il indique expressément une revue non exhaustive et non indépendante : chapitres01–05, grande partie de06 et08–12, rubriques de présentation/gestes/accessibilité des contrats non lus en continu. Le présent correctif ne transforme pas cette couverture partielle en certification globale.

Les changements G-01 à G-05 et les exports déjà publiés sont réutilisés sans réexport ni écrasement. La spécification v13 et les décisions D-029/D-150, D-238/D-260/D-261, RM-062, Cadence v1 et les documents courants sont relus aux passages impliqués ; aucune nouvelle règle de calcul n’est créée.

## Résultats par constat

| Constat | État | Modification / réserve |
|---|---|---|
| H-01 | Corrigé | Réserves CAD-V01–04 levées partout aux passages signalés et dans v13 §10 ; suppression par Aucun, layout existant. |
| H-02 | Corrigé | D-029 annotée ; chapitre08, v13 et deux formulations du chapitre13 précisent Série courante unilatérale / bloc du côté courant bilatéral / phase courante en récupération. |
| H-03 | À arbitrer | Grammaire validée « séparées par » conservée. N pauses restent comptées, pause terminale incluse. La précision rédactionnelle éventuelle nécessite une décision du propriétaire. |
| H-06 | Corrigé | CE-T03-10 conserve la Pause terminale positive en direct ; cinq phrases communes rendent le côté et la Pause entre les côtés conditionnels au bilatéral. |
| H-08 | Partiellement corrigé | Ancienne ligne visible à 0 s qualifiée historique ; donnée et calcul conservés ; 13/17 frames documentées dans V-10 et CE-T03-08. L’exception éventuelle du mode placement de Point d’arrêt et l’accès au réglage par occurrence restent à clarifier, sans nouvelle interface inventée. |
| H-09 | Partiellement corrigé | Synthèse : Enregistrer, jamais changement global de Terminer dans l’éditeur ; média : gouttière permanente, aucun déploiement Exercice. Avertissement sans pause : absence de source signalée, maintien/retrait et déclenchement à confirmer. |
| H-10 | Citations corrigées ; source manquante explicite | Référence ajout courante 6959:15706 (24×24, pas preuve de 16×16) ; composant Tour canonique 3066:4685 conservé ; IDs supprimés qualifiés historiques, y compris Profil, confirmation, catalogue variable et INDEX. Source courante de Selection Check non retrouvée, aucun remplacement inventé. Pas de certification globale des 214 IDs. |
| H-12 | Corrigé | CE-UI-07 : Pause initiale 0 s. Ancien attribut Pause après chaque série par défaut retiré du modèle cible Profil, note historique conservée ; paramètres existants des Exercices inchangés. |
| H-13 | Corrigé documentairement | Navigation #F9FAFC, cartes archivées #F5F7FA ; référence centralisée au chapitre12. Fond circulaire Retour #FCFCFE conservé comme observation distincte. Ancienne prescription #F6F6F6 identifiée sans l’assimiler à une preuve de la valeur historique du token supprimé. |

## Vérifications

- Revue ciblée du diff : suppression des prescriptions contradictoires signalées, maintien de la grammaire Phrase v1 et des bornes, formules, seuils et données déjà validés. La synthèse change de libellé ; l’éditeur garde Terminer.
- Cas de pause terminale : trois Séries de 30 s, Pause 15 s donnent `3 × (30 + 15) = 135 s`, soit 2 min 15 s ; CE-T03-10 inclut désormais la dernière Pause, comme v13. Avec Pause0, aucun temps de pause ni phase positive n’est ajouté. CR/Fin restent hors total intrinsèque.
- Valeur initiale : carte vide de CE-UI-10 et v13 prescrivent Pause0 ; CE-UI-07 est aligné et le modèle Profil ne prescrit plus un défaut concurrent. Aucune migration de données ni correction du code n’est faite.
- Contrôles documentaires : 136 captures décodées, dimensions et empreintes validées (les deux renouvelées au commit précédent remplacent leurs empreintes antérieures) ; références du chapitre06 ; 30 contrats ×21 rubriques non vides ; IDs D/RM uniques ; liens locaux des fichiers modifiés et des rapports nouveaux ; ancres actives et `git diff --check`.

Ces contrôles structurels ne prouvent pas à eux seuls la justesse de chaque rubrique. Les absences de nœuds et observations Figma sont attribuées au relevé de Claude ; les références d’ajout et Tour sont aussi cohérentes avec le DSF courant. Aucune nouvelle lecture exhaustive de Figma n’est revendiquée. Aucun code, Figma, asset, fichier de protocole ou workflow n’est modifié. Tests applicatifs et appareil réel : non applicables à ce lot documentaire. Aucun appel Claude ni qualification VNext/V2/PRE n’est lancé.

## Réserves et prochaine action

1. H-03 : préciser ou accepter le décalage de lecture entre « séparées par » et le total incluant la pause finale ; calcul validé conservé.
2. H-08 : confirmer la présentation dans le seul mode placement du Point d’arrêt et clarifier l’accès au réglage par occurrence, sans réintroduire la ligne générale retirée ni ouvrir un nouveau menu par hypothèse.
3. H-09 : maintenir et définir l’avertissement sans pause, ou retirer la mention ; pas d’arbitrage silencieux.
4. H-10 : retrouver la source actuelle de la coche de sélection multiple ; les anciennes citations sont désormais historiques, sans remplacement inventé.
5. Compléter la lecture fonctionnelle continue des zones non couvertes et la comparaison de présentation des contrats avec les captures si l’objectif reste l’alignement total. Aucun audit supplémentaire n’est lancé dans cette mission.

## Fichiers et livraison

Chapitres05/06/07/08/09/10/12/13 ; Paramètres v13 ; DSF-CADENCE ; INDEX et README ; audit source reçu ; présent rapport et JSON de preuves. Les sources archivées, rapports antérieurs, Phrase v1, Cadence v1 et captures restent intacts.

Commit final : commit introduisant ce rapport, dont le SHA exact est publié dans la PR #323 et le bilan de livraison (pas d’empreinte auto-référente dans le fichier). Livraison uniquement sur la branche documentaire existante, avec vérification de tête attendue. PR maintenue en brouillon, pas de fusion main ni synchronisation du PC. Clôture et alignement total non déclarés.

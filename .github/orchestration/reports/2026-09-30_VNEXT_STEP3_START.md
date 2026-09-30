# Étape 3 — VNext-12 lancé, résultat opérationnel non encore acquis

Le plan fixé reste inchangé.

| Étape | Statut |
| --- | --- |
| 1. Raccorder la chaîne réelle | TERMINÉE lors du lot précédent ; raccordement du préflight complété pendant ce lancement |
| 2. Qualifier le commit Linux/Windows | TERMINÉE au candidat 308ac67 ; nouvelle correction qualifiée VNext Linux/Windows ci-dessous |
| 3. VNext-12 jetable INITIAL puis REVISION bornée jusqu’au résultat réel | EN COURS |
| 4. Audit FINAL indépendant de Claude | NON DÉMARRÉ |
| 5. Activation, bascule et clôture | NON DÉMARRÉE |

## Candidat et lancement réels

Candidat exact : `27eee886a5ecb0990cd53de34e77f32eaba4c2aa`.

[Préparation VNext-12, run 36776220115](https://github.com/MyUncried/Application-Routine/actions/runs/36776220115).

La tranche `VNEXT-12-QUALIF` demande de retourner 2 au lieu de 1 dans `scripts/kodjo/fixtures/vnext12/core.js`, d’adapter `tests/fixtures/vnext12/core.test.js` et de préserver `scripts/kodjo/fixtures/vnext12/keep.js` octet pour octet. Le dossier lie les vrais objets Git, le mode LOCAL et le rédacteur CLAUDE. La limite de révision reste 1.

Le banc construit les contrats depuis les octets Git, puis appelle la vraie revue Claude en lecture seule, sans jeton GitHub dans le processus Claude. Il conserve la sortie structurée et la session réelle ; aucun APPROVE n’est fabriqué. Il ne lance pas implicitement l’implémentation ou FINAL.

## Vérifications enregistrées

- Linux, job `110095152114` : recette exécutée sur le candidat exact, 193 tests VNext PASS, 0 FAIL, 0 SKIP.
- Windows, job `110095152395` : recette exécutée sur le candidat exact, 193 tests VNext PASS, 0 FAIL, 0 SKIP.
- Contrôles locaux ciblés des chemins legacy de préflight et du contrat de mission : 39 PASS, 0 FAIL, 0 SKIP.
- Syntaxe indépendante : 64 workflows acceptés ; invariants et whitespace PASS.
- Six fichiers de correction comparés par empreinte Git aux fichiers locaux ; demande de lancement comparée au contenu exact enregistré.
- La qualification historique structurée et le pilote global de ce nouveau candidat ont leurs propres runs ; leur réussite globale n’est pas anticipée.

Le lancement a révélé un raccordement manquant : le préflight legacy attendait des blocs V2 dans les projections VNext. PF-010 utilise maintenant l’admission canonique VNext complète, sélectionnée par le bootstrap immuable ; PF-009 vérifie les octets exacts de la mission approuvée. La mission transporte le plan exact à implémenter. Aucun drapeau déclaratif ne remplace l’autorisation ou une preuve.

Un test d’intégration nouveau exerce les vrais consommateurs de préflight, accepte plan/mission/identité VNext, refuse une mission altérée et bloque en l’absence d’approbation. Ses réponses GitHub et Claude sont des doublures déclarées : il ne prouve pas l’implémentation opérationnelle.

La préparation initiale au commit 925ce973 a été remplacée après ce constat. Des commits intermédiaires incomplets ou un workflow tronqué ont été corrigés avant toute implémentation. Ils ne sont pas candidats qualifiés. Le run de préparation précédent 36772862894 a été annulé ; sa revue Claude n’avait pas démarré.

## État vérifié après achèvement du run

Le job `prepare-initial` (`110097292499`) du run `36776220115` s’est terminé en FAILURE. Windows a refusé la création du processus Claude avec `spawnSync ... ENAMETOOLONG`. La revue n’a pas produit de session ni de verdict. L’artefact `11127334204` contient uniquement `produced.json` et `recipe.json`, au candidat exact `27eee886a5ecb0990cd53de34e77f32eaba4c2aa`. Son ZIP a l’empreinte SHA256 `7e27cf24b3fdce9fc1f04a08cf4ad03d22809ed98daab224bfa2a059a4e95c07`.

Le schéma sémantique de ce dossier comporte 69 152 caractères : les deux énumérations du catalogue de cibles dépassaient à elles seules la limite de commande Windows. Le correctif transmet le schéma complet sur stdin dans le dossier ; le schéma de transport de la commande conserve sa structure et toutes les autres contraintes, avec 972 caractères pour sa partie sémantique. Les deux listes de cibles restent contrôlées après réponse par `buildReviewReport` contre le contexte exact, avant création du reçu. Aucune cible ou dépendance inconnue ne devient acceptable.

Un test de régression utilise un vrai catalogue Git de plus de 700 fichiers et un schéma supérieur à 32 767 caractères, vérifie une commande inférieure à 8 000 caractères, puis les refus de cible et dépendance inconnues. Les appels Claude de ce test sont des doublures déclarées, sans valeur de preuve opérationnelle. Validation locale du correctif : 194 tests VNext PASS, 0 FAIL, 0 SKIP.

La demande PREPARE_INITIAL passe à la génération 5 pour qualifier le correctif sur Linux/Windows, puis demander une vraie revue sur le nouveau candidat. L’exécution réelle Windows et son verdict restent à observer ; la réussite n’est pas anticipée.

Le run de qualification globale VNext `36776220111` au candidat précédent est SUCCESS ; le pilote complémentaire `36776220101` est FAILURE, dont le détail n’est pas requalifié par ce correctif.

Cible d’approbation GitHub : pas encore publiée. Approbation utilisateur : pas encore demandée. Admission opérationnelle de queue et implémentation INITIAL : pas encore exécutées. REVISION opérationnelle : non démarrée. Résultat VNext-12 : NON ACQUIS.

PRE-1 reste hors périmètre. Aucun cutover, activation, fusion ou audit FINAL.

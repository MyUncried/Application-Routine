# VNEXT_REGRESSION_ORIGINS — attribution des échecs après optimisation

Mission : identifier l'origine des régressions à partir du rapport transmis et des preuves existantes. Départ : branche `protocol/vnext-proof-stability-20260930`, HEAD local `445fae7b768e3db45123b22acf51399827b0e82a`, checkout propre. Aucun correctif de code, test, workflow, appel Claude ou publication lancé. V2, PRE-2, PRE-3, tâche 3 et clôture hors périmètre. Analyse du parcours jetable, sans certification de l'application native ni acquisition Figma fraîche.

## Conclusion

Les échecs observés ne démontrent pas une régression de l'optimisation du scanner Git. Ils concernent la construction des réponses de revue, le dispositif de preuve Figma et le nettoyage du nouveau navigateur. Le commit publié `b0bf7edf616b5a585b5cfddf08c4b121289af75c` regroupe optimisation et correctifs Figma préexistants : son titre ne suffit pas à attribuer les défauts à la performance.

La qualification antérieure réussie et la suite historique verte ne prouvent pas que le même parcours Figma initial fonctionnait auparavant. Sur `e0c766fe`, avant ce lot, le run `37325776512` échouait déjà à la revue sur `DEPENDENCY_UNKNOWN: PLAN_CONTRACT`, avant implémentation. Les mécanismes antérieurs de mesure lisaient des valeurs retournées par `render()` ; les mécanismes actuels mesurent du DOM. Les deux preuves ne sont pas équivalentes.

## Origines vérifiées

| Défaut | Origine dans l'historique disponible | Attribution |
| --- | --- | --- |
| Réponse avec autodépendance | `b0bf7edf` introduit les dépendances par indices pour traiter le rejet précédent ; le schéma borne les indices sans exclure la cible courante et le prompt ne rappelle pas cette exclusion. La règle canonique anti-autodépendance existe déjà dans `e0c766fe`. | Réponse Claude invalide, génération insuffisamment guidée ; décodage correct, barrière correcte. Aucun lien démontré avec la lecture Git par lots ou la compaction du dossier. |
| Mesure modifiée par le code testé | `b0bf7edf` introduit l'observateur et sa lecture de `subject.__figmaWidthDelta`, suivie d'une mutation du DOM avant mesure. | Défaut du dispositif de preuve ajouté avec les correctifs Figma, indépendant de l'optimisation du scanner. |
| Fenêtre calée sur les dimensions attendues | `b0bf7edf` introduit la mesure navigateur ; le driver configure largeur depuis le viewport requis et hauteur depuis la valeur attendue. | La preuve isolée ne distingue pas dimensions fixes et dimensions relatives à cette fenêtre. Un rendu relatif n'est pas intrinsèquement incorrect pour toute application ; il est non discriminé ici par rapport à l'intention fixe du test. |
| Obligation Node trop faible | `67d18be21e865846fac780351b34bc6cd4c636a3` introduit `visual_test_expected`, exigeant la présence de déclarations width/height, pas leurs valeurs. | Lacune de contrat dans une correction ultérieure de qualification ; affaiblissement de la formulation du test, malgré une preuve navigateur séparée censée assurer l'égalité. |
| Suppression Windows EPERM | `b0bf7edf` introduit le profil navigateur temporaire et son nettoyage. Le code courant conserve ce mécanisme. | Défaut de cycle de vie/nettoyage du navigateur ; échec exact démontré, processus détenteur du verrou non identifié. |

## Preuves examinées

Archive du run `37402330192`, conservée sous `task2/two-hours-relaunch-20261006/runtime-result-37402330192/` : SHA-256 recalculé `3cb35ffe7d382a1cbb727b321c1120039beb5a56c295a655362bdd1911176303`, intégrité ZIP sans erreur. Lecture de la réponse originale et de `produced.json` : 436 cibles ; cible 424 = `PROOF-7d83cc32dc5249b4ce221b29`, identique au target_id du premier finding, qui dépend notamment de 424. Durée de l'appel : 440 167 ms, code 0. Les trois constats de fond sont présents dans la réponse originale. Aucun timeout de ce run ; augmentation des plafonds dans `f317d534` sans lien causal observé avec ces échecs.

Lecture directe du journal GitHub du job `112072543935`, run pilot `37402330270` : le test navigateur échoue après 8 177,96 ms dans `vnext-figma-browser-observer.js:62`, sur `fs.rmSync(profile, ...)`, pendant la première observation appelée par le test ligne 49. La suite dure 595 929,56 ms, avec un échec. Le préflight suivant est ignoré et son upload échoue faute de preuves produites : conséquence de l'échec initial, pas troisième cause indépendante.

Le finally attend `exit` du processus lancé ; après trois secondes il appelle `kill()` puis résout sans attendre la sortie effective. Ce chemin et l'absence de preuve de terminaison des descendants rendent une course de nettoyage plausible. Le journal n'établit ni quel chemin de fermeture a été pris ni quel processus tenait le profil ; ne pas présenter cette hypothèse comme la cause Windows démontrée. Le rm comporte déjà dix retries : ajouter seulement des retries ne suffirait pas à démontrer la correction.

Comparaisons ciblées `e0c766fe → b0bf7edf`, `b0bf7edf → 67d18be2` et lecture du rapport d'optimisation : séparation des changements scanner/profilage et Figma. Le diff `b0bf7edf → HEAD` est vide pour `impact-graph.js`, `vnext-git-batch.js`, `vnext-performance.js`. Aucun indice de hash corrompu, donnée Git divergente ou scan incomplet dans le résultat fourni. Cela n'est pas une preuve générale d'absence de régression ; les comparaisons d'équivalence antérieures restent les preuves disponibles pour le scanner.

## Pourquoi les contrôles verts n'ont pas suffi

Les tests de transport vérifient bornes, unicité et reconstruction des IDs ; ils ne démontrent pas que Claude produira une réponse conforme à toutes les relations du contrat. Le test navigateur couvre une largeur réelle différente des exports numériques, une capture et un delta positif, mais il autorise expressément la coopération du sujet avec l'observateur. Il ne couvre pas un delta compensateur ni un rendu relatif à la fenêtre. Les tests de projection vérifient que l'obligation reprend la chaîne attendue ; ils n'établissent pas que cette chaîne exige la bonne précision. Enfin un nettoyage Windows peut réussir dans une qualification puis échouer dans une exécution ultérieure : le succès antérieur ne prouve pas sa stabilité.

## Corrections recommandées, non exécutées

1. Guider la production des dépendances pour exclure la cible courante et vérifier cette relation avant admission ; conserver le refus canonique et la réponse originale. Ne pas enlever silencieusement une dépendance d'une réponse scellée.
2. Supprimer tout ajustement de mesure commandé par le sujet. Injecter les défauts négatifs dans le rendu lui-même ; démontrer le rejet d'un rendu incorrect avec compensation exportée.
3. Mesurer à des dimensions supplémentaires indépendantes de la taille fixe attendue, sans supprimer le viewport requis. Vérifier explicitement les contre-exemples relatifs et l'égalité des valeurs pertinentes dans l'obligation Node, sans imposer une syntaxe CSS arbitraire au protocole générique.
4. Vérifier la fermeture réelle du navigateur et diagnostiquer les descendants/verrous Windows avant suppression ; préserver stderr et l'erreur principale si le nettoyage échoue. Démontrer la stabilité avec des observations ciblées avant un nouveau parcours coûteux.
5. Séparer les prochains lots de performance, transport et preuve Figma afin que leur qualification permette d'attribuer les effets. Aucun retour arrière global du scanner justifié par les preuves actuelles.

## Livraison et limites

Seul fichier créé : présent rapport. Aucun test neuf exécuté, aucune reproduction navigateur, aucun appel de qualification ni parcours réel relancé ; vérifications effectuées par lecture, comparaison Git et contrôle d'archive. Les résultats Windows cités sont ceux des runs existants. Aucun état distant actuel ou processus Claude Windows actif certifié par cette analyse historique. Le SHA du commit local contenant ce rapport est communiqué dans le bilan et disponible par `git log -1 --format=%H -- .github/orchestration/reports/2026-10-06_VNEXT_REGRESSION_ORIGINS.md`. Publication non effectuée. État Git final contrôlé après commit.

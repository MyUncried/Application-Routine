# VNEXT_SYSTEMATIC_HISTORY — attribution historique systématique

Mission demandée le 6 octobre 2026 à 09:57 Paris : analyser systématiquement les évolutions VNext, puisque des tests réussissaient auparavant avec une durée excessive. Départ d5f90f39f5c92c740fac32ba6c078224a79597ed ; branche protocol/vnext-proof-stability-20260930. Périmètre réalisé : comparaison des versions Git, relecture des preuves historiques, attribution des derniers défauts et inscription durable de la méthode dans CLAUDE.md. Aucun correctif exécutable ni relance.

## Succès antérieurs et comparaison

Le succès antérieur est réel : INITIAL 37115247745 sur protocole 08cb8b936f91a19b33aa47b5a00b1f8dfd73ddb1, session 23570c25-875b-4158-8d87-5f075cb8056a, artefact 11270759916. Checkpoint et rapport 2026-10-03_VNEXT_V8_CONSOLIDATED_CORRECTIONS le conservent. Ancienne REVISION 36881458781 sur 3a931996 également documentée dans 2026-10-04_VNEXT_POST_ACCEPTANCE_REVISION_COVERAGE. Ces succès ne sont pas annulés par les échecs actuels.

La tâche 2 Figma a cependant son propre pilote, créé dans c1ea9aef65e7f61662cb91eee8c5fa8d93032c09 le 5 octobre. Il lit d'abord les valeurs retournées par render(), sans navigateur ; b0bf7edf616b5a585b5cfddf08c4b121289af75c le remplace par du HTML mesuré dans un navigateur. La version et la nature de la preuve ont donc changé. Le run Figma comparable 37325776512 sur e0c766fe échouait déjà avant b0bf7edf (DEPENDENCY_UNKNOWN: PLAN_CONTRACT, zéro implémentation). Cela ne prouve pas que tous les anciens parcours échouaient ni qu'aucun Figma antérieur n'a réussi : ce diagnostic n'est pas un inventaire exhaustif de tous les runs.

## Origines établies par les diffs

| Défaut | Introduction ou origine vérifiée | Nature et lien avec optimisation |
| --- | --- | --- |
| Seconde fenêtre non reportée aux preuves | cf80c57c69a1f74e0ff3e4b6c62da169a1fd30c9 ajoute le second viewport mais laisse VISUAL_COMPARE.expected=r.statement | Omission de mon dernier correctif. La seconde fenêtre n'existait pas dans 67d18be2. Pas une régression du scanner. |
| Préservation par égalité de true | 67d18be21e865846fac780351b34bc6cd4c636a3 ajoute assertPreservedExport et la promesse « dropping the re-export must fail » | Correctif ultérieur insuffisant. Avant, le contrôle conservait les octets du fichier partagé, sans ce nouveau contrôle de provenance. L'égalité faible ne démontre pas un affaiblissement d'un ancien test plus fort. |
| Captures sans propriétaire/chemins déclarés dans le plan | c1ea9aef contient déjà une obligation visuelle sans infrastructure nommée ; b0bf7edf ajoute le véritable navigateur et la capture sans compléter le contrat d'exécution dans le plan | Lacune déclarative ancienne, devenue concrète avec la nouvelle preuve navigateur ; détection actuelle amplifiée par deux fenêtres. Attribution au mécanisme de preuve du lot mixte, pas à la lecture Git par lots. |
| taskkill retourne 128 pendant la fermeture | cf80c57c introduit taskkill /PID /T /F et la nouvelle logique closeProcess | Nouvelle erreur sur un chemin de nettoyage introduit dans le dernier correctif ; symptômes vérifiés dans 37428291663. Cause OS complète non démontrée. |
| EPERM antérieur à la suppression du profil | b0bf7edf crée le profil temporaire et sa suppression | Nouveau cycle de vie navigateur ; absence de navigateur dans c1ea9aef. Aucun détenteur du verrou identifié. |
| Mesure influencée par le sujet | b0bf7edf introduit __figmaWidthDelta et mutation du DOM ; cf80c57c les supprime | Défaut introduit dans les correctifs Figma du lot mixte, désormais retiré des sources. Aucun lien avec le scanner. |
| Autodépendance de réponse Claude | b0bf7edf introduit les dépendances par indices pour corriger DEPENDENCY_UNKNOWN, sans exclusion suffisante de la cible courante | Défaut de guidage de transport ajouté avec le lot ; règle canonique déjà présente. cf80c57c renforce guidage et décodage. Dernier run 37428291785 accepté techniquement sans autodépendance. |
| Ancienne obligation markup sans valeurs exactes | 67d18be2 ajoute une formulation exigeant surtout la présence de width/height | Contrat ajouté dans un correctif ultérieur, précisé dans cf80c57c. |

Ces conclusions affinent le diagnostic précédent : « nouvellement détecté » ne signifie pas « nouvellement introduit ». Le test de préservation faible est précisément introduit par 67d18be2, et l'ambiguïté d'observation a un précurseur dès c1ea9aef. Le commit b0bf7edf regroupe réellement optimisation Git, changements de transport et changements de preuve : dire que les problèmes sont indépendants de l'optimisation du scanner ne signifie pas qu'ils sont indépendants de ce lot de modifications.

## Méthode permanente et preuves

CLAUDE.md impose désormais la comparaison historique pour chaque diagnostic VNext : dernier succès comparable, premier échec, introduction/détection, changements séparés, niveau de certitude et preuves manquantes. Le titre d'un commit ou la chronologie seuls ne suffisent pas. Comparaisons ciblées c1ea9aef, b0bf7edf, 67d18be2 et cf80c57c avec contrôles de présence hors ligne réussis ; matrice conservée dans history-attribution.json. Relecture des rapports d'origines, performance locale, résultat 37428291785 et résumé scellé 37325776512. Pas de nouvelle suite applicable aux modifications documentaires, pas de reproduction Windows ni appel Claude. Une reproduction ciblée demeure nécessaire pour la fermeture Windows. La cause de la durée globale d'une heure n'est pas requalifiée par ce diagnostic, ni une réduction promise.

Fichiers modifiés : CLAUDE.md, présent rapport, history-attribution.json. Correctifs exécutables et appareil réel hors périmètre ; aucune publication ni relance. Commit final : commit documentaire contenant ce rapport, SHA communiqué dans la réponse et disponible via git log -1 --format=%H -- ce chemin. Git propre vérifié après commit.

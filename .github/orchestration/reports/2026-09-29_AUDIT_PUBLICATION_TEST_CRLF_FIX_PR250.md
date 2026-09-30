# Correction du test de publication sous Windows — PR #250

Mission : diagnostiquer la qualification terminée et reprendre la correction/qualification autorisée.

Branche : protocol/next-evolution-r1-r3-r4-continuity-20260928. Départ : a6d042c9487629cf286a81d1eff7039cb3845dbb. Écrivain : ChatGPT via GitHub, mise à jour atomique sans force.

## Preuves et diagnostic

Le run 36631550624 a terminé en FAILURE : protocol (Linux) SUCCESS, protocol-windows-preflight FAILURE. Les deux échecs du run précédent sont résolus ; la suite complète Linux passe.

Le job Windows 109622390867 échoue uniquement sur le nouveau test « remote writer scanner admits only the declared archive job and keeps other writes forbidden », ligne 180 : actual=0, expected=1.

La lecture du workflow dans le checkout Windows produit CRLF. Trois mutations du test cherchaient des chaînes contenant LF ; elles ne modifiaient donc pas la fixture. Le scanner acceptait à raison la fixture inchangée et le test prenait ce résultat pour l’acceptation d’une écriture interdite.

Reproduction locale exacte : convertir le workflow en CRLF reproduit le même échec à la même assertion. Après correction, les 8 tests dédiés passent avec le workflow en CRLF puis en LF. Ce contrôle des deux formats ne prétend pas exécuter un Windows natif localement.

L’échec de l’upload disposable-preflight est secondaire : les étapes de production de cette preuve avaient été sautées après l’échec du test. Aucun nouveau défaut de recovery n’est démontré par cet upload.

## Correction minimale et contrôle

La fixture est normalisée en LF uniquement en mémoire avant ses mutations. Le fichier workflow et les noms physiques ne sont pas normalisés par le test. Chaque mutation doit désormais être différente de sa source, avant d’exiger le refus du scanner. Les gardes et les permissions runtime ne changent pas.

Le filtre pull_request de l’audit inclut le fichier de tests de publication pour que ses corrections déclenchent l’audit sur le nouveau HEAD ; il n’est pas nécessaire de rejouer un run lié au HEAD obsolète.

Seconde passe : correction limitée au test, à sa dépendance de déclenchement et à ce rapport. 8 tests dédiés PASS pour chaque format ; validation du workflow modifié PASS. La qualification GitHub Windows reste à vérifier sur le nouveau HEAD.

## Livraison et limites

Fichiers : tests/kodjo/independent-audit-publication.pilot.js ; .github/workflows/kodjo-v2-next-evolution-independent-audit.yml (un chemin de déclenchement ajouté) ; ce rapport.

Aucun fichier applicatif, #252 ou PRE-1/#249 modifié. Aucun test appareil applicable. #250 reste DRAFT, sans verdict de qualification présumé.

Le commit contenant ce rapport, sa relecture GitHub et les nouveaux runs sont communiqués dans le commentaire de livraison. Aucun reset/rebase/force-push. Le rapport ne peut contenir son propre hash de commit.

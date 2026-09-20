# Correction du contrôle de dérive lors de la matérialisation du handoff

## Périmètre et preuve causale

Correction protocolaire séparée autorisée par Hermann le 20 septembre 2026.
Baseline distante : `b2d5db7bde4127bf85d60a7f4107e7b4ebd96265`.
Issue : #150, V2-CAT-01. PR applicative #181 ouverte, non fusionnée,
HEAD `e43004df9f04a10aa091ba28cc681592bea759ca`.
Plan #5749470081 et revue APPROVE #5749494128 désignent cette même PR et ce même HEAD.

Le run 35508739662, job 106072845224, exécute le script depuis main à la baseline
ci-dessus. Le contrôle compare `impact.scan_revision` (HEAD applicatif) à `HEAD`
(main protocolaire), sur app/src. Les 50 chemins du diagnostic
HANDOFF_APPLICATION_DRIFT correspondent exactement aux 50 fichiers de la PR #181.
Il classe donc le delta applicatif déjà présent et revu comme une dérive nouvelle.
Aucun PLAN_HANDOFF_READY n'a été publié par ce run.

## Correction minimale et préservation des refus

La matérialisation conserve les contrôles d'auteur, Issue, tranche, approbation,
bootstrap et registre existants. Elle vérifie maintenant séparément :

- la transition entre les sources protocolaires du plan/de la revue et le HEAD
  courant avec `verify-plan-review-transition.js`, sans modifier son classificateur ;
  toutes les sources protégées restent identiques et seuls les chemins protocolaires
  déjà admis peuvent changer ;
- en révision, les identités PR/HEAD du plan et de la revue, leur égalité au scan,
  puis la PR distante exacte, ouverte, non fusionnée, dans le dépôt attendu,
  ciblant la branche du bootstrap, et toujours au HEAD approuvé ;
- en INITIAL, la provenance INITIAL et l'égalité scan/source sont exigées ;
  aucun lookup de PR n'est ajouté et le contrôle applicatif historique est conservé.

Un HEAD applicatif déplacé est refusé, même si le changement est hors app/src.
Une PR fermée, fusionnée, différente, sur un autre dépôt ou une autre cible,
une erreur API, une identité incohérente ou une source protégée modifiée sont refusés.
Le workflow reçoit uniquement la permission additionnelle `pull-requests: read`,
nécessaire au contrôle d'une PR privée.

Le plan, la revue et le bootstrap ne sont pas réécrits par cette correction.
La matérialisation canonique ultérieure reste seule responsable de produire les
artefacts et le commentaire demandant le pouce utilisateur. Aucun gate humain,
aucune queue, aucune implémentation, fusion applicative ni clôture n'est autorisé
par cette PR. Aucun correctif de transition automatique/idempotence n'est ajouté.

## Vérifications et limites

Snapshot local contrôlé fichier par fichier contre les OID Git de la baseline
GitHub : aucune divergence. Tests portables sur de vrais dépôts Git temporaires :
acceptation d'une PR non fusionnée portant un delta préexistant, correction
protocolaire seule, refus des dérives et identités invalides, sources protégées,
erreurs API, compatibilité INITIAL et permission/câblage workflow.
Le pilote est découvert automatiquement par run-all.js sur Linux et Windows.
La suite complète et le préflight Windows du workflow existant sont requis sur
le commit publié avant intégration ; résultats et SHA exacts seront consignés
sur la PR. Les tests synthétiques ne valent pas preuve de matérialisation réelle.

Seconde passe : aucune modification produit, Figma, données, calculs, API produit
ou architecture applicative. Les noms Unicode existants sont conservés ; les
fichiers hors des quatre chemins de cette correction restent identiques à la
baseline distante. Le mécanisme historique fautif a été remplacé en révision,
son contrôle INITIAL reste explicite. Les évolutions de niveau 2 et 3 demandées
restent hors périmètre de ce correctif et différées après le cycle applicatif.

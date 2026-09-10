# Rapport de changement — KODJO V2 `0.6.11` → `0.6.12`

## Objet

Fermer l’écart entre la spécification normative et le pilote local : aucune implémentation V2 ne peut désormais démarrer à partir d’un simple identifiant libre.

## Correctifs livrés

1. schéma fermé de `SliceBootstrapIdentity` ;
2. registre d’activation V2 explicite et unique ;
3. empreinte canonique SHA-256 du bootstrap ;
4. distinction entre `baseline_head` immuable et HEAD courant d’une opération ;
5. vérification que le HEAD courant descend de la baseline ;
6. empreinte individuelle de chaque source produit ;
7. refus des manifestes `kodjo.slice.v1` comme identité V2 ;
8. liaison obligatoire du lanceur Claude local et du workflow distant au bootstrap ;
9. commande PowerShell bornée de préparation d’une activation ;
10. tests déterministes des cas valide, absent, divergent et altéré.

## Activation

Une tranche est préparée par `scripts/kodjo/activate-kodjo-v2-slice.ps1`. Les deux fichiers produits — bootstrap et registre — doivent être revus puis ancrés par commit avant toute commande de plan ou d’implémentation. L’Issue V2 dédiée doit exister avant cette préparation.

## Compatibilité

Les manifestes V1 historiques ne sont ni modifiés ni supprimés. Les requêtes locales `0.6.11` sont volontairement refusées : une nouvelle requête `0.6.12` liée à une identité active est obligatoire.

## Profil opérationnel

La version 0.6.12 rend activable le pilote local borné et son parcours de conservation. Elle ne prétend pas automatiser les portes humaines de plan et de revue décrites dans la spécification.

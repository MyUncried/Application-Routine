# Change report — KODJO Protocol V2 0.6.33

Date : 2026-09-18

## Objet

Superséder le raccordement transitoire 0.6.32 et rétablir une seule frontière exécutable vers IMPLEMENT : `lean-request.0.6.13`.

## Cause

0.6.32 avait ajouté une voie parallèle entre les preuves PLAN/REVIEW/USER et le superviseur local. Les premiers runs réels ont échoué avant Claude sur des défauts propres à cette nouvelle couche de transport : quoting Unicode Git puis BOM PowerShell.

Le socle Lean Queue utilisé pour V2-BILAT-01 n’était pas en cause.

## Modifications

- ajout du matérialiseur commun INITIAL / REVIEW-RÉVISION ;
- ajout du générateur direct de Lean Request ;
- ajout des workflows `kodjo-v2-plan-handoff-materialize.yml` et `kodjo-v2-plan-handoff-queue.yml` ;
- mode `VALIDATE_PLAN_HANDOFF` arrêté avant `run-queued-request.ps1` ;
- suppression de la voie `queue/v2-causal` et du workflow comment-causal ;
- restauration de `run-queued-request.ps1` à l’entrée Lean Queue canonique ;
- contrôle de supersession, de `planning_application_head`, de `source_head`, de mission et de scope ;
- nouveaux tests E2E bornés et négatifs ;
- scanner remote-write étendu uniquement aux deux writers protocolaires bornés.

## Preuves déjà obtenues sur la branche

- E2E INITIAL réel : run `35311869021` — SUCCESS ;
- E2E handoff borné : run `35312559196` — SUCCESS ;
- négatifs ciblés : run `35313102469` — 11/11 PASS ;
- qualification branche scanner + positif + négatifs : run `35313763670` — SUCCESS.

La qualification PR Linux/Windows finale doit être verte sur le HEAD de fusion.

## Hors périmètre

Aucune décision produit V2-CAT-01, aucun moteur d’exécution, aucun changement de recovery, RESUME_DELTA ou VISUAL_CORRECTION.

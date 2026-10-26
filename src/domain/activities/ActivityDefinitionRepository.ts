import type {
  ActivityDefinition,
  CreateActivityDefinitionInput,
  UpdateActivityDefinitionInput,
} from "./ActivityDefinition";
import type { SiblingCompletion } from "./sharedCorrection";

/**
 * PRE-7 (A1.3, MFN-06, MFN-07, MFN-08 ; ch11 « Créer / rechercher », « Créer
 * une variante ») — origine EXPLICITE du Mouvement d'un nouvel Exercice du
 * Catalogue ; aucun rattachement automatique.
 *
 * - `INDEPENDENT` : nouveau Mouvement sans groupe (défaut historique) ;
 * - `SAME_MOVEMENT` : « Même geste, autres paramètres » — la définition
 *   référence le Mouvement existant ; le contenu saisi lui est appliqué comme
 *   une correction partagée (« Corriger ce geste »), frères complétés selon
 *   `siblingCompletions`. Les paramètres saisis doivent être construits sur
 *   la structure du geste repris (identités de phases du Mouvement) : une
 *   phase dont l'identité figure dans la structure est tenue pour cette
 *   phase ;
 * - `VARIANT` : « Créer une variante / un niveau » ou « Créer un nouvel
 *   exercice » / « En faire un geste distinct » — nouveau Mouvement, original
 *   intact ; `joinOriginGroup` est le choix de l'utilisateur (proposé sans
 *   présélection, MFN-08) : vrai → inséré immédiatement après l'origine dans
 *   son groupe (créé au besoin, MFN-05, MFN-07). PRE-7 (R-5, D-445 C02,
 *   MFN-07 l.371) : `placement` `BEFORE_ORIGIN` (Plus facile) l'insère
 *   immédiatement AVANT l'origine ; absent ou `AFTER_ORIGIN` (Plus difficile,
 *   « Ajouter un niveau ») : après.
 */
export type ActivityDefinitionOrigin =
  | { readonly kind: "INDEPENDENT" }
  | {
      readonly kind: "SAME_MOVEMENT";
      readonly movementId: string;
      readonly siblingCompletions?: readonly SiblingCompletion[];
    }
  | {
      readonly kind: "VARIANT";
      readonly originMovementId: string;
      readonly joinOriginGroup: boolean;
      readonly placement?: "BEFORE_ORIGIN" | "AFTER_ORIGIN";
    };

/**
 * Repository de persistance des `ActivityDefinition` (V2-CAT-01). Aucune
 * suppression, archivage ni restauration ne sont exposés.
 *
 * PRE-7 (A1.3) : une correction ou une création sur un geste repris dont les
 * frères ne sont pas prêts lève `SharedCorrectionRefusedError` (entrée
 * invalide, rien n'est écrit) ; un Mouvement d'origine inconnu lève
 * `MovementNotFoundError`. `ActivityDefinitionService` rend ces cas en union.
 */
export interface ActivityDefinitionRepository {
  /** `origin` absent : geste indépendant. */
  create(input: CreateActivityDefinitionInput, origin?: ActivityDefinitionOrigin): Promise<ActivityDefinition>;
  findById(id: string): Promise<ActivityDefinition | null>;
  /** Triée par `updatedAt DESC` — tri implicite, jamais une préférence persistée (plan §4.1). */
  listAll(): Promise<readonly ActivityDefinition[]>;
  /**
   * Correction de l'Exercice et du contenu partagé de son Mouvement (« Corriger
   * cet exercice », MFN-08), avec les durées des frères par `phaseId`
   * (`siblingCompletions`), dans UNE transaction. `null` si l'identifiant est
   * inconnu.
   */
  update(
    id: string,
    input: UpdateActivityDefinitionInput,
    siblingCompletions?: readonly SiblingCompletion[],
  ): Promise<ActivityDefinition | null>;
}

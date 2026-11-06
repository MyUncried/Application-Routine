import { encodeInstructionSteps } from "@/domain/activities/instructionSteps";
import type { Movement } from "@/domain/activities/Movement";

/**
 * Petit corpus fonctionnel de test, indépendant du pilote documentaire.
 * Les catégories/zones sont des choix EXCLUSIVEMENT de fixture, non une
 * validation éditoriale ou clinique des 60 fiches.
 */
export const SMOKE_MOVEMENTS: readonly Movement[] = [
  {
    id: "seed-movement-air-squat",
    name: "Air squat",
    aliases: ["Squat au poids du corps"],
    categoryId: "renforcement",
    bodyZoneIds: ["cuisses", "hanches-bassin"],
    description: encodeInstructionSteps([
      "Tenez-vous debout, pieds écartés.",
      "Reculez les hanches et fléchissez les genoux.",
      "Redressez-vous sans décoller les talons.",
    ]),
    phases: [],
    nextPhaseId: 1,
    media: [],
    levelGroup: null,
  },
  {
    id: "seed-movement-bird-dog",
    name: "Bird-dog",
    aliases: ["Extension bras-jambe opposés"],
    categoryId: "equilibre",
    bodyZoneIds: ["dos", "hanches-bassin"],
    description: encodeInstructionSteps([
      "Placez-vous à quatre pattes.",
      "Tendez le bras et la jambe opposés.",
      "Revenez, puis changez de diagonale.",
    ]),
    phases: [],
    nextPhaseId: 1,
    media: [],
    levelGroup: null,
  },
  {
    id: "seed-movement-pendulaire",
    name: "Pendulaire d’épaule",
    aliases: [],
    categoryId: "mobilite",
    bodyZoneIds: ["epaules"],
    description: encodeInstructionSteps([
      "Inclinez légèrement le buste.",
      "Laissez le bras pendre et détendez-le.",
      "Effectuez de petits mouvements pendulaires.",
    ]),
    phases: [],
    nextPhaseId: 1,
    media: [],
    levelGroup: null,
  },
] as const;

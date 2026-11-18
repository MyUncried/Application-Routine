/**
 * PRE-11 — pilotes des Formats raccordés au moteur (conception consolidée §12) : la Séance est parcourue par le
 * pilote de séquence ; chaque élément formaté exécutable ouvre sa portée sous le pilote de son Format.
 */

import { libreEnv, type EngineEnv } from "../kernel";
import type { ExecutablePlan } from "../plan";
import { AMRAP_PILOT, amrapPilot } from "./amrap";
import { DEATH_BY_PILOT, deathByPilot } from "./deathBy";
import { EMOM_PILOT, emomPilot } from "./emom";
import { FOR_TIME_PILOT, forTimePilot } from "./forTime";

export function executionEnv(plan: ExecutablePlan): EngineEnv {
  return libreEnv(plan, { [FOR_TIME_PILOT]: forTimePilot, [EMOM_PILOT]: emomPilot, [AMRAP_PILOT]: amrapPilot, [DEATH_BY_PILOT]: deathByPilot });
}

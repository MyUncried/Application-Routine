import { describe, expect, it, jest } from "@jest/globals";

import { ExecutionSounds } from "../ExecutionSounds";
import { ExecutionVoice } from "@/infrastructure/speech/ExecutionVoice";

/**
 * Recette du 09/11/2026 : application installée sans les modules natifs du lot son et voix → « Cannot find
 * native module 'ExpoAudio' » au lancement d'une séance. Le module natif absent, ni `expo-audio` ni
 * `expo-speech` n'est chargé ; l'Exécution continue sans son.
 */
const mockLoaded: string[] = [];

jest.mock("expo", () => ({ requireOptionalNativeModule: () => null }));
jest.mock("expo-audio", () => {
  mockLoaded.push("expo-audio");
  throw new Error("Cannot find native module 'ExpoAudio'");
});
jest.mock("expo-speech", () => {
  mockLoaded.push("expo-speech");
  throw new Error("Cannot find native module 'ExpoSpeech'");
});

describe("Son et voix — module natif absent", () => {
  it("aucun chargement d'expo-audio ni d'expo-speech, aucune erreur", async () => {
    new ExecutionSounds().play("BIP_GRAVE");
    new ExecutionVoice().say("Gainage");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockLoaded).toEqual([]);
  });
});

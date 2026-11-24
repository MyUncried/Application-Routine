/**
 * J1 « Gestion des langues » (23/11/2026) : démarrage avec un téléphone en anglais, ou dans une langue non prise
 * en charge (repli anglais) — le catalogue, les accords, les formats et la voix suivent.
 */
/* eslint-disable @typescript-eslint/no-require-imports -- jest.isolateModules exige des require */
import { describe, expect, it, jest } from "@jest/globals";

function bootWith(languageTag: string) {
  const [languageCode, regionCode] = languageTag.split("-");
  let loaded: {
    strings: typeof import("./index").strings;
    plural: typeof import("./plural");
    format: typeof import("./format");
    voice: typeof import("@/infrastructure/speech/ExecutionVoice");
  } | null = null;
  jest.isolateModules(() => {
    jest.doMock("expo-localization", () => ({ getLocales: () => [{ languageTag, languageCode, regionCode }] }));
    loaded = {
      strings: require("./index").strings,
      plural: require("./plural"),
      format: require("./format"),
      voice: require("@/infrastructure/speech/ExecutionVoice"),
    };
  });
  return loaded!;
}

describe("J1 — téléphone en anglais", () => {
  it("affiche le catalogue anglais, accorde, formate et parle en anglais", () => {
    const { strings, plural, format, voice } = bootWith("en-GB");
    expect(strings.splash.subtitle).not.toBe("Votre assistant du quotidien");
    expect(strings.execution.nextDialog.cancel).toBe("Cancel");
    expect(strings.voice.getReady).toBe("Get ready");
    expect(plural.pluralCategory(0)).toBe("other");
    expect(format.formatDecimal(1.25)).toBe("1.25");
    expect(voice.EXECUTION_VOICE_LANGUAGE).toBe("en-GB");
  });

  it("se replie sur l'anglais pour une langue non prise en charge", () => {
    const { strings, voice } = bootWith("ja-JP");
    expect(strings.voice.getReady).toBe("Get ready");
    expect(voice.EXECUTION_VOICE_LANGUAGE).toBe("en-US");
  });
});

describe("J1 — version compilée sans le module natif de langue", () => {
  it("ne plante pas et prend la langue du moteur JavaScript", () => {
    let language: string | null = null;
    jest.isolateModules(() => {
      jest.doMock("expo-localization", () => {
        throw new Error("Cannot find native module 'ExpoLocalization'");
      });
      language = require("./locale").appLanguage;
    });
    expect(["fr", "en"]).toContain(language);
  });
});

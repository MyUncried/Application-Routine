import { useEffect, useState } from "react";

import { profileGuidance } from "@/domain/preferences/Profile";
import type { GuidanceEvent, GuidanceSettings, SoundChoice } from "@/domain/preferences/guidanceSettings";
import { effectiveGuidance, type SessionGuidance } from "@/domain/sessions/sessionGuidance";
import { FilterSheetFrame } from "@/features/activities/FilterSheetPrimitives";
import { GuidanceSettingsForm, SoundChoiceList } from "@/features/preferences/GuidanceSettingsForm";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import { strings } from "@/shared/i18n";

/**
 * Modale « Guidage sonore » de la Composition — documentation publiée sur main `ebe72f76` (ch13 « Guidage sonore en
 * Composition et dans le Profil ») et demande de Hermann du 11/11/2026 (cahier, constat d), Figma `12132:27436` et
 * `12175:25882` (deux positions de défilement d'une seule modale).
 *
 * - « Fermer », le titre et « Valider » restent fixes pendant le défilement (cadre de feuille native des Filtres).
 * - À l'ouverture : réglages effectifs de la séance (ceux validés pour elle, sinon ceux du Profil).
 * - « Fermer » abandonne ; « Valider » applique les réglages à cette séance seulement.
 * - Le chevron d'un son ouvre « Choix d'un son » (`12068:25044`) dans la même feuille ; ✕ y revient sans changer, ✓
 *   retient le son choisi.
 *
 * [Remplacé le 11/11/2026 — feuille « Guidage de la séance » (Sons, Annonces vocales, objectif, « Comme le Profil ») :
 * texte par-dessus l'en-tête, ✕ et ✓ sans effet (recette w2).]
 */
/** Figma `12132:27436` : contenu à 16 des bords, 8 sous l'en-tête ; `12068:25044` : 16, 13 sous l'en-tête. */
const SHEET_CONTENT_INSET = { horizontal: 16, top: 8 } as const;
export const PICKER_CONTENT_INSET = { horizontal: 16, top: 13 } as const;

export function SessionGuidanceSheet({
  initial,
  onApply,
  onClose,
  native,
}: {
  readonly initial: SessionGuidance | undefined;
  readonly onApply: (guidance: SessionGuidance) => void;
  readonly onClose: () => void;
  readonly native?: { readonly onNeededHeight?: (height: number) => void };
}) {
  const profileService = useProfileService();
  const t = strings.screens.soundGuidance;
  const [settings, setSettings] = useState<GuidanceSettings | null>(initial ?? null);
  const [choosing, setChoosing] = useState<{ readonly event: GuidanceEvent; readonly sound: SoundChoice } | null>(null);

  useEffect(() => {
    if (initial !== undefined) return;
    let cancelled = false;
    profileService.getProfile().then(
      (profile) => {
        if (!cancelled) setSettings((current) => current ?? effectiveGuidance(undefined, profileGuidance(profile)));
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [initial, profileService]);

  const frame = native === undefined ? {} : { native };

  if (choosing !== null && settings !== null) {
    return (
      <FilterSheetFrame
        {...frame}
        title={t.events[choosing.event]}
        closeLabel={t.close}
        applyLabel={t.validate}
        onClose={() => setChoosing(null)}
        contentInset={PICKER_CONTENT_INSET}
        onApply={() => {
          setSettings({
            ...settings,
            events: { ...settings.events, [choosing.event]: { ...settings.events[choosing.event], sound: choosing.sound } },
          });
          setChoosing(null);
        }}
        testIDPrefix="session-guidance-sound"
      >
        <SoundChoiceList
          event={choosing.event}
          value={choosing.sound}
          onChange={(sound) => setChoosing({ event: choosing.event, sound })}
          testIDPrefix="session-guidance-sound"
        />
      </FilterSheetFrame>
    );
  }

  return (
    <FilterSheetFrame
      {...frame}
      title={t.title}
      closeLabel={t.close}
      applyLabel={t.validate}
      onClose={onClose}
      contentInset={SHEET_CONTENT_INSET}
      onApply={() => {
        if (settings !== null) onApply(settings);
        else onClose();
      }}
      testIDPrefix="session-guidance"
    >
      {settings === null ? null : (
        <GuidanceSettingsForm
          settings={settings}
          onAnnouncementChange={(announcement, value) =>
            setSettings({ ...settings, announcements: { ...settings.announcements, [announcement]: value } })
          }
          onVibrationChange={(event, value) =>
            setSettings({ ...settings, events: { ...settings.events, [event]: { ...settings.events[event], vibration: value } } })
          }
          onOpenSound={(event) => setChoosing({ event, sound: settings.events[event].sound })}
          testIDPrefix="session-guidance"
          variant="sheet"
        />
      )}
    </FilterSheetFrame>
  );
}

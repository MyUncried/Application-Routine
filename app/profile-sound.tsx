import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { GUIDANCE_EVENTS, type GuidanceEvent, type SoundChoice } from "@/domain/preferences/guidanceSettings";
import { FilterSheetFrame } from "@/features/activities/FilterSheetPrimitives";
import { SoundChoiceList } from "@/features/preferences/GuidanceSettingsForm";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import { PICKER_CONTENT_INSET } from "@/features/sessions/SessionGuidanceSheet";
import { strings } from "@/shared/i18n";
import { useTitleCappedSheetDetent } from "@/shared/ui/nativeSheet";

/**
 * « Préférences — Choix d’un son » (Figma `12068:25044`), ouverte par le chevron d'un événement dans Profil ›
 * Préférences : feuille native iOS, ✕ ferme sans changer, ✓ enregistre le son de l'événement dans le Profil (portée
 * globale, RM-086/RM-087). Sa vibration n'est pas modifiée.
 */
export default function ProfileSoundRoute() {
  const router = useRouter();
  const profileService = useProfileService();
  const params = useLocalSearchParams<{ event?: string }>();
  const event = (GUIDANCE_EVENTS as readonly string[]).includes(params.event ?? "") ? (params.event as GuidanceEvent) : null;
  const detent = useTitleCappedSheetDetent(null);
  const [choice, setChoice] = useState<SoundChoice | null>(null);
  const [vibration, setVibration] = useState(true);

  useEffect(() => {
    if (event === null) {
      if (router.canGoBack()) router.back();
      return;
    }
    let cancelled = false;
    profileService.getProfile().then(
      (profile) => {
        if (cancelled) return;
        setChoice((current) => current ?? profile.guidanceEvents[event].sound);
        setVibration(profile.guidanceEvents[event].vibration);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [event, profileService, router]);

  if (event === null) return null;
  const t = strings.screens.soundGuidance;
  return (
    <>
      <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
      <FilterSheetFrame
        native={{}}
        title={t.events[event]}
        closeLabel={t.close}
        applyLabel={t.validate}
        onClose={() => router.back()}
        contentInset={PICKER_CONTENT_INSET}
        onApply={() => {
          if (choice === null) {
            router.back();
            return;
          }
          profileService.setGuidanceEvent(event, { sound: choice, vibration }).then(
            () => router.back(),
            (error: unknown) => console.error("Le son n'a pas pu être enregistré.", error),
          );
        }}
        testIDPrefix="profile-sound"
      >
        {choice === null ? null : <SoundChoiceList event={event} value={choice} onChange={setChoice} testIDPrefix="profile-sound" />}
      </FilterSheetFrame>
    </>
  );
}

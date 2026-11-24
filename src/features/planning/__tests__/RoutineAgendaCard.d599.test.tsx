import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { readFileSync } from "node:fs";
import path from "node:path";
import { StyleSheet } from "react-native";

import { AGENDA_ICON_PRESSED_SCALE, AGENDA_ICON_SIZE, AGENDA_ICON_TOUCH, AgendaPlayIcon } from "@/features/planning/AgendaStatusIcon";
import { RoutineAgendaCard, type AgendaStatus } from "@/features/planning/RoutineAgendaCard";
import { colors } from "@/shared/ui/tokens";

/**
 * D-599 (Hermann, 24/11/2026 ; DSF Agenda — Planning § 5 et § 8 ; Figma `13149:26608`, légende `13149:26915`) : icônes d'état
 * de 28 à la place des pastilles textuelles, teintes de cadre selon l'état, en jetons. Jest ne prouve pas le rendu sur iPhone
 * (lisibilité à 28, contraste des cadres).
 */
function renderCard(status: AgendaStatus, onStart = jest.fn()) {
  render(
    <RoutineAgendaCard
      time="8h00"
      duration="15′"
      name="Mobilisation du genou"
      detail="Genou"
      status={status}
      expanded={false}
      onOpen={jest.fn()}
      onToggleExpanded={jest.fn()}
      onStart={onStart}
      testID="card"
    />,
  );
  return onStart;
}

const frameOf = () => StyleSheet.flatten(screen.getByTestId("card-frame").props.style).backgroundColor as string;
const barOf = (status: AgendaStatus) => StyleSheet.flatten(screen.getByTestId(`card-status-${status}`).props.style).backgroundColor as string;
const bandOf = () => StyleSheet.flatten(screen.getByTestId("card-band").props.style).backgroundColor as string;

const EXPECTED: Record<AgendaStatus, { frame: string; bar: string; band: string; label: string }> = {
  UPCOMING: { frame: "#E0E4F5", bar: "#8F9BCC", band: "rgba(224, 228, 245, 0.18)", label: "Démarrer" },
  MISSED: { frame: "#F5E0E0", bar: "#CC8F8F", band: "rgba(245, 224, 224, 0.18)", label: "Rattraper" },
  STOPPED: { frame: "#F5E0E0", bar: "#CC8F8F", band: "rgba(245, 224, 224, 0.18)", label: "Arrêtée" },
  EXPIRED: { frame: "#F5E0E0", bar: "#CC8F8F", band: "rgba(245, 224, 224, 0.18)", label: "Expirée" },
  COMPLETED: { frame: "#E0F5E8", bar: "#8FCCA8", band: "rgba(224, 245, 232, 0.18)", label: "Complétée" },
  PARTIAL: { frame: "#F5EBE0", bar: "#CCAD8F", band: "rgba(245, 235, 224, 0.18)", label: "Partielle" },
  DELETED: { frame: "#F0F0F5", bar: "#B8BAC9", band: "rgba(240, 240, 245, 0.18)", label: "Supprimée" },
};

describe("D-599 — teinte du cadre, de la bande et du trait selon l'état (Figma 13149:26608)", () => {
  for (const status of Object.keys(EXPECTED) as AgendaStatus[]) {
    it(`${status} : cadre ${EXPECTED[status].frame}, trait ${EXPECTED[status].bar}, bande à 18 %`, () => {
      renderCard(status);
      expect(frameOf()).toBe(EXPECTED[status].frame);
      expect(barOf(status)).toBe(EXPECTED[status].bar);
      expect(bandOf()).toBe(EXPECTED[status].band);
    });
  }
});

describe("D-599 — une icône par état, libellé d'accessibilité, aucun libellé visible", () => {
  it("Complétée, Partielle, Arrêtée, Supprimée, Expirée : icône à plat de 28, non interactive, libellée", () => {
    const discs: Record<string, string | undefined> = {
      COMPLETED: colors.agendaIconCompleted,
      STOPPED: colors.agendaIconStopped,
      DELETED: colors.agendaIconMuted,
      EXPIRED: colors.agendaIconMuted,
    };
    for (const status of ["COMPLETED", "PARTIAL", "STOPPED", "DELETED", "EXPIRED"] as const) {
      const view = render(
        <RoutineAgendaCard time="8h00" duration="15′" name="R" detail="" status={status} expanded={false} onOpen={jest.fn()} onToggleExpanded={jest.fn()} onStart={jest.fn()} testID="card" />,
      );
      const icon = screen.getByTestId("card-status-icon");
      expect(icon.props.accessibilityLabel).toBe(EXPECTED[status].label);
      expect(StyleSheet.flatten(icon.props.style)).toMatchObject({ width: AGENDA_ICON_SIZE, height: AGENDA_ICON_SIZE });
      expect(screen.queryByTestId("card-start")).toBeNull();
      expect(screen.queryByTestId("card-status-tag")).toBeNull();
      expect(screen.queryByText(EXPECTED[status].label)).toBeNull();
      if (status === "PARTIAL") {
        expect(StyleSheet.flatten(screen.getByTestId("card-status-icon-track").props.style).borderColor).toBe(colors.agendaIconPartialTrack);
        expect(StyleSheet.flatten(screen.getByTestId("card-status-icon-arc").props.style)).toMatchObject({
          borderTopColor: colors.agendaIconPartial,
          borderRightColor: colors.agendaIconPartial,
          borderBottomColor: colors.agendaIconPartial,
          borderLeftColor: "transparent",
          transform: [{ rotate: "45deg" }],
        });
      } else {
        expect(StyleSheet.flatten(screen.getByTestId("card-status-icon-disc").props.style).backgroundColor).toBe(discs[status]);
      }
      view.unmount();
    }
  });

  it("Démarrer et Rattraper : la même icône de lecture, seuls interactifs, zone de toucher de 44, libellés distincts", () => {
    const styleOf = () => StyleSheet.flatten(screen.getByTestId("card-start-icon-disc").props.style);
    const onStart = renderCard("UPCOMING");
    const start = screen.getByTestId("card-start");
    expect(start.props.accessibilityLabel).toBe("Démarrer");
    expect(StyleSheet.flatten(start.props.style)).toMatchObject({ minWidth: AGENDA_ICON_TOUCH, minHeight: AGENDA_ICON_TOUCH });
    expect(AGENDA_ICON_TOUCH).toBeGreaterThanOrEqual(44);
    const upcoming = styleOf();
    expect(screen.queryByText("Démarrer")).toBeNull();
    fireEvent.press(start);
    expect(onStart).toHaveBeenCalledTimes(1);
    screen.unmount();
    renderCard("MISSED");
    expect(screen.getByTestId("card-start").props.accessibilityLabel).toBe("Rattraper");
    expect(styleOf()).toEqual(upcoming);
    expect(screen.queryByText("Rattraper")).toBeNull();
  });

  it("relief au repos (dégradé, filet, ombres) ; appuyé : 94 %, fond #E8EBF5, ombre interne en haut", () => {
    const rest = render(<AgendaPlayIcon pressed={false} testID="p" />);
    const raised = StyleSheet.flatten(screen.getByTestId("p-disc").props.style);
    expect(raised).toMatchObject({ width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.agendaIconRaisedStroke });
    expect(raised.experimental_backgroundImage).toBe(`linear-gradient(to bottom, ${colors.agendaIconRaisedTop} 0%, ${colors.agendaIconRaisedBottom} 100%)`);
    expect(String(raised.boxShadow).split("),").length).toBe(2);
    rest.unmount();
    render(<AgendaPlayIcon pressed testID="p" />);
    const pressed = StyleSheet.flatten(screen.getByTestId("p-disc-pressed").props.style);
    expect(pressed.backgroundColor).toBe(colors.agendaIconPressed);
    expect(pressed.transform).toEqual([{ scale: AGENDA_ICON_PRESSED_SCALE }]);
    expect(AGENDA_ICON_PRESSED_SCALE).toBe(0.94);
    expect(String(pressed.boxShadow)).toMatch(/^inset /);
  });

  // L'état appuyé suit `pressed` de `Pressable` (rendu natif) : le simulacre de test ne déclenche pas la pression interne de
  // `Pressable` ; le rendu des deux états est vérifié ci-dessus sur `AgendaPlayIcon`, le passage réel sur iPhone.
});

describe("D-599 — jetons, aucune couleur d'état en dur", () => {
  it("la carte et les icônes ne portent aucune couleur hexadécimale en dur pour les états", () => {
    const read = (file: string) => readFileSync(path.resolve(__dirname, "..", file), "utf8");
    const card = read("RoutineAgendaCard.tsx");
    const icons = read("AgendaStatusIcon.tsx");
    for (const value of Object.values(EXPECTED).flatMap((e) => [e.frame, e.bar])) {
      expect(card.includes(`"${value}"`)).toBe(false);
    }
    for (const value of ["#CC3838", "#1A995C", "#F58C1A", "#D6D6DB", "#8C919E", "#E8EBF5", "#E3E5F0", "#D6D9E3"]) {
      expect(icons.includes(`"${value}"`)).toBe(false);
    }
    expect(colors.agendaIconStopped).toBe("#CC3838");
    expect(colors.agendaIconCompleted).toBe("#1A995C");
    expect(colors.agendaIconPartial).toBe("#F58C1A");
    expect(colors.agendaIconMuted).toBe("#8C919E");
  });
});

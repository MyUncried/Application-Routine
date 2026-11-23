import { useEffect, useMemo, useState } from "react";

import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { RoutineFilterSheet, type RoutineFilterChoice } from "@/features/planning/RoutineFilterSheet";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";

import { OutsidePeriodDialog } from "./OutsidePeriodDialog";
import type { AttachChoice, ProgramService } from "./ProgramService";
import type { AttachedRoutine, ProgramSheetRequest } from "./programSheetRelay";
import { programStrings } from "./programStrings";

/**
 * « Rattacher des routines existantes » (D-549 ; recette du 23/11/2026, p4-rattacher — Hermann : « Il faut pouvoir rattacher
 * plusieurs routines en même temps » ; « la modale de sélection des routines doit être identique à celle du filtre des routines,
 * avec la modification suivante : le texte de chaque carte doit indiquer le nombre de séances entre les dates et hors des dates
 * du programme "X créneaux sur la période, Y en dehors" ») — modale du filtre des routines de l'Agenda (`RoutineFilterSheet`) :
 * recherche, filtre, cases à cocher, bouton « Rattacher N routines ».
 *
 * D-566 : si des créneaux à venir des routines choisies tombent hors de la période, la question est posée avant de rendre la
 * sélection ; « Annuler » laisse la feuille ouverte, rien n'est rattaché. La sélection est rendue à la modale du programme, qui
 * ne l'enregistre qu'à la coche (p4-croix). [Avant : une routine à la fois, rattachée aussitôt.]
 */
const t = programStrings.attach;

export function attachSlotsLine(choice: AttachChoice): string {
  const values = { inside: String(choice.period.inside), outside: String(choice.period.outside) };
  return fillTemplate(choice.period.inside === 1 ? t.slotsOne : t.slots, values);
}

export function attachButtonLabel(count: number): string {
  return count === 1 ? t.applyOne : fillTemplate(t.applyMany, { count: String(count) });
}

export function ProgramAttachSheet({
  service,
  request,
  onClose,
}: {
  readonly service: ProgramService;
  readonly request: Extract<ProgramSheetRequest, { kind: "attach" }>;
  readonly onClose: () => void;
}) {
  const [choices, setChoices] = useState<readonly AttachChoice[] | null>(null);
  const [question, setQuestion] = useState<{ readonly selected: readonly AttachChoice[]; readonly outside: number } | null>(null);
  const { state: catalogue, reload } = useSessionCatalogue();
  useEffect(() => {
    reload();
    let cancelled = false;
    service.attachChoices(request.period, request.excluded, request.released).then(
      (list) => {
        if (!cancelled) setChoices(list);
      },
      () => {
        if (!cancelled) setChoices([]);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [service, request, reload]);
  const sessions = useMemo(() => {
    const map = new Map<string, SessionCatalogueProjection>();
    if (catalogue.status === "ready") for (const projection of catalogue.sessions) map.set(projection.id, projection);
    return map;
  }, [catalogue]);

  const finish = (selected: readonly AttachChoice[], removeOutside: boolean) => {
    const attached: AttachedRoutine[] = selected.map((choice) => ({ routine: choice.routine, removeOutside: removeOutside && choice.period.outside > 0 }));
    request.onAttach(attached);
    onClose();
  };

  return (
    <>
      <RoutineFilterSheet
        choices={choices ?? []}
        loading={choices === null}
        sessions={sessions}
        onClose={onClose}
        onValidate={(ids) => {
          const selected = (choices ?? []).filter((choice) => ids.includes(choice.routine.id));
          const outside = selected.reduce((sum, choice) => sum + choice.period.outside, 0);
          if (outside > 0) setQuestion({ selected, outside });
          else finish(selected, false);
        }}
        texts={{
          title: t.title,
          empty: t.empty,
          slotsLine: (choice: RoutineFilterChoice) => attachSlotsLine(choice as AttachChoice),
          buttonLabel: attachButtonLabel,
        }}
      />
      {question !== null ? (
        <OutsidePeriodDialog
          count={question.outside}
          onKeep={() => finish(question.selected, false)}
          onDelete={() => finish(question.selected, true)}
          onCancel={() => setQuestion(null)}
          testIDPrefix="program-attach-outside"
        />
      ) : null}
    </>
  );
}

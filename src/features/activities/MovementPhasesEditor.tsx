import { useEffect, useRef, useState, type ReactElement } from "react";
import { StyleSheet, Text, TextInput, View, type AccessibilityActionEvent, type TextInputProps } from "react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { WORK_PATTERN_DURATION_BOUNDS, WORK_PHASE_LIMITS } from "@/domain/activities/ExecutionParameters";
import { movementPhaseDefaultDuration } from "@/domain/activities/Movement";
import {
  addMovementPhase,
  moveMovementPhase,
  removeMovementPhase,
  renameMovementPhase,
  setMovementPhaseDuration,
  type MovementPhaseList,
} from "@/domain/activities/movementPhaseList";
import { cellDurationSeconds, mmssDigitsOf } from "@/features/activities/cellEntry";
import { useAttachedKeyboardBar } from "@/features/activities/KeyboardAccessoryBar";
import { KeyboardField } from "@/features/activities/KeyboardField";
import { codePointLength } from "@/domain/sessions/validation";
import { strings } from "@/shared/i18n";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-8 (story B.2, CE-MVT-01 §7 et §12, Figma « DSF / Formulaires / Phases du mouvement »
 * `10450:24387`) — bloc « Phases du mouvement (pour minuter l'exécution) » de la fiche :
 * structure et libellés seulement, JAMAIS de durée (paramètres locaux des Exercices, MVT-09).
 *
 * Recette A/B (F04, F05, F06) : liste d'étapes textuelles présentée comme la Description
 * (`DescriptionSteps`) — titre Regular 11 secondaire, numéro aligné à droite puis libellé, sans
 * contenant, sans poignée ni croix ni ligne de tableau. Une ligne par phase, puis une ligne
 * d'invite : « Nommez la première phase » à vide, « Phase suivante » ensuite, seulement quand le
 * bloc est en saisie au-delà de la première. Saisir dans l'invite crée la phase (compteur
 * monotone, `movementPhaseList.ts`) ; Entrée passe à l'invite ; retour arrière sur une phase vide
 * la retire (règle de la Description). L'ordre reste explicite (numéros) ; Monter, Descendre et
 * Retirer restent disponibles comme actions VoiceOver. Libellé limité à
 * `WORK_PHASE_LIMITS.labelMaxLength` points de code (20), la limite du modèle d'exécution, en
 * création comme en modification : une saisie qui la dépasse est refusée. En lecture seule :
 * libellés seuls, sans invite. Aucune exigence de phase : un Mouvement peut n'en avoir aucune.
 *
 * [Remplacé le 31/10/2026, PRE-9 A.2b — décision de Hermann du 30/10/2026 : « les durées de la phase
 * peuvent faire partie du mouvement, si elles sont renseignées elles sont reprises par défaut et
 * peuvent être changées dans la séance ». « JAMAIS de durée » ci-dessus est remplacé : chaque phase
 * porte une durée FACULTATIVE, affichée à droite de son libellé (« Durée » en invite si elle est
 * vide). La toucher ouvre, sous la ligne, la roulette de durée partagée (`DurationWheelPicker`,
 * bornes 1..3535 s, `WORK_PATTERN_DURATION_BOUNDS`, ouverture sur `00:00` quand elle est vide) ;
 * « Sans durée » la retire. En lecture seule : durée renseignée affichée, rien sinon. Aucun rendu
 * Figma de cette durée (`10450:24387` n'en montre pas) : rendu CHOISI, à valider en recette.]
 *
 * [Remplacé le 31/10/2026, PRE-9 — recette iPhone n° 2 (a2b-creer KO, Hermann : « Toucher la durée >
 * Le clavier disparait et la roulette apparait, sous la photo, pas ergonomique. Comportement
 * souhaité : - Première entrée de la description de la phase, clavier alphanumérique ouvert. -
 * Appuyer sur "Entrée" déplace le curseur sur la durée de la même ligne, le clavier doit rester
 * ouvert mais se transformer en clavier numérique. - Entrer la durée, appuyer sur entrée fait passer
 * le curseur sur la ligne suivante, le clavier doit rester ouvert et se transformer en clavier
 * alphanumérique. ») : la roulette et « Sans durée » sont retirés. Entrée sur un libellé place le
 * curseur sur la durée de la même ligne (au lieu d'ouvrir l'invite juste après la phase, recette du
 * 27/10, remarque 2). La durée se saisit au clavier numérique dans sa cellule, avec les règles des
 * cellules de durée du tableau des phases de la Feuille (`KeyboardField` `cellDuration`,
 * `cellEntry.ts`, D-434 : « MM:SS », première frappe qui remplace, secondes > 59 reportées, hors
 * bornes ramenée à 1..3535 s) ; vidée : aucune durée. Elle s'applique à chaque frappe. Entrée de la
 * durée (Android) ou « Suivant → » de la barre du clavier (pavé numérique iOS sans touche Entrée,
 * `onKeyboardBarChange`) : ligne suivante — libellé de la phase suivante, sinon l'invite. Le
 * clavier reste ouvert d'un champ à l'autre.]
 *
 * [Remplacé le 31/10/2026, PRE-9 — recette iPhone n° 2, contrôle (cr2-phases KO, Hermann : « Un
 * bouton « Next » est apparu, le retirer. Retirer aussi la barre optionnelle avec les boutons
 * précédent, suivant et fermer. L'utilisateur appuiera manuellement sur le champ étape suivante ») :
 * la touche Entrée du libellé reprend son libellé par défaut (« retour », plus « Next ») ; la barre
 * du clavier (« ← Précédent », « Suivant → », « Fermer ») et le passage automatique de la durée à la
 * ligne suivante sont retirés. Lecture appliquée : Entrée sur le libellé place toujours le curseur
 * sur la durée de la MÊME ligne (demande du 31/10 non retirée ; ce n'est pas l'« étape suivante ») ;
 * depuis la durée, l'utilisateur touche lui-même le libellé de la phase suivante ou l'invite.]
 *
 * [Recette iPhone du 26/11/2026 (après-midi), Hermann : « Régression : création d'une fiche de mouvement, création de phases et
 * entrée de la durée. Nous avions défini une barre d'option au-dessus du clavier, elle n'est plus affichée. » — la barre du
 * clavier de la durée (« ← Précédent » : libellé de la même ligne ; « Suivant → » : ligne suivante ; « Fermer ») est rétablie
 * telle qu'elle existait avant son retrait du 31/10 (`onKeyboardBarChange`). La touche Entrée du libellé garde son libellé par
 * défaut et la durée ne passe toujours pas d'elle-même à la ligne suivante (cr2-phases) : seul un toucher de la barre le fait.]
 *
 * [Complété le 26/11/2026 (recette iPhone, après-midi, réponse de Hermann : « précédent, suivant, fermer. Précédent et Suivant
 * permettent bien de passer d'un champ à l'autre (phase n > durée n > phase n+1 > durée n+1) ») : la barre (« ← Précédent »,
 * « Suivant → », « Fermer ») est affichée sur TOUS les champs du bloc — libellé de phase, durée et invite d'ajout — et non plus
 * sur la seule durée. Précédent / Suivant parcourent les champs dans l'ordre affiché : libellé 1 → durée 1 → libellé 2 → durée 2
 * → … ; l'invite d'ajout prend sa place affichée (en fin de liste, ou juste sous la phase après laquelle elle s'ouvre). Précédent
 * est indisponible sur le premier champ, Suivant sur le dernier (l'invite, toujours affichée pendant la saisie) : depuis la
 * dernière durée, Suivant mène donc à l'invite, comme avant. « Fermer » ferme le clavier. Entrée du libellé (durée de la même
 * ligne) et absence de passage automatique depuis la durée : inchangées.]
 */

const t = strings.screens.movement.phases;

/** Relevé Figma `10450:24382` : mêmes valeurs que `Description / Étape` (`DescriptionSteps`). */
const ROW_GAP = spacing[8];
const NUMBER_GAP = spacing[8];
const NUMBER_WIDTH = 16;
/** Titre → liste : 10 (Figma `10450:24387`, comme la Description, `EDITOR_VERTICAL_GRID.titleToBlock`). */
const TITLE_TO_LIST = spacing[10];
/** Numéro et texte de l'invite, comme la Description (`#AEB3BA`, sans jeton). */
const PROMPT_COLOR = "#AEB3BA";

/** PRE-9 A.2b : largeur de la valeur de durée, celle d'une cellule Durée du tableau des phases (76). */
const DURATION_WIDTH = 76;
/** Hauteur de la valeur de durée (ligne de texte) ; cible portée à 44 par `hitSlop`. */
const DURATION_TOUCH_HEIGHT = 20;
const DURATION_HIT_SLOP = {
  top: (minTouchTarget - DURATION_TOUCH_HEIGHT) / 2,
  bottom: (minTouchTarget - DURATION_TOUCH_HEIGHT) / 2,
};

/**
 * Recette iPhone du 26/11/2026 (après-midi) : actions de la barre du clavier pendant la saisie d'un champ du bloc (libellé,
 * durée ou invite) : « ← Précédent » / « Suivant → » vers le champ voisin dans l'ordre libellé 1 → durée 1 → libellé 2 → …,
 * indisponibles aux extrémités (sans boucle).
 */
export type MovementPhasesKeyboardBar = {
  readonly canPrevious: boolean;
  readonly canNext: boolean;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
};

/**
 * Recette iPhone du 26/11/2026 (soir), Hermann : « la barre d'option du clavier n'apparaît pas » — champ texte du bloc (libellé,
 * invite) portant la barre native rattachée au clavier (`useAttachedKeyboardBar`, `InputAccessoryView` montée juste après le champ).
 */
function BarTextInput({ active, inputRef, ...props }: TextInputProps & { readonly active: boolean; readonly inputRef: (node: TextInput | null) => void }) {
  const bar = useAttachedKeyboardBar(active, true);
  return (
    <>
      <TextInput ref={inputRef} {...props} inputAccessoryViewID={bar.id} />
      {bar.accessory}
    </>
  );
}

/** Clé d'un champ du bloc : libellé ou durée d'une phase, ou l'invite d'ajout. */
type PhaseFieldKey = `label:${number}` | `duration:${number}` | "invite";

/**
 * Recette iPhone du 26/11/2026 (après-midi) : ordre de parcours des champs par la barre du clavier, celui de l'affichage —
 * libellé puis durée de chaque phase, l'invite à sa place (sous la phase `inviteIndex`, sinon en fin de liste).
 */
export function movementPhaseFieldOrder(
  phaseIds: readonly number[],
  showInvite: boolean,
  inviteIndex: number | null,
): PhaseFieldKey[] {
  const order: PhaseFieldKey[] = [];
  phaseIds.forEach((id, index) => {
    order.push(`label:${id}`, `duration:${id}`);
    if (showInvite && inviteIndex === index) order.push("invite");
  });
  if (showInvite && inviteIndex === null) order.push("invite");
  return order;
}

/** Libellé admis (F06) : au plus `WORK_PHASE_LIMITS.labelMaxLength` points de code. */
export function isPhaseLabelWithinLimit(label: string): boolean {
  return codePointLength(label) <= WORK_PHASE_LIMITS.labelMaxLength;
}

export type MovementPhasesEditorProps = {
  readonly value: MovementPhaseList;
  readonly onChange: (next: MovementPhaseList) => void;
  readonly editable: boolean;
  /**
   * Recette A/B B.10 (b2-4) : bloc en saisie ou non (gabarit photo remonté, ↑ de fermeture du
   * clavier). Le passage d'une ligne à l'autre n'est pas une fin de saisie (perte de focus différée,
   * comme `DescriptionSteps`).
   */
  readonly onFocusChange?: (focused: boolean) => void;
  /**
   * Recette du 27/10 (r11-remontee) : bas de la ligne en saisie, relatif au haut du bloc, à chaque
   * changement de ligne ou de mesure (recadrage au-dessus du clavier, comme la Description).
   */
  readonly onActiveRowBottomChange?: (bottom: number) => void;
  /**
   * Recette iPhone du 26/11/2026 (après-midi) : durée en saisie (actions de la barre du clavier) ou `null`. L'écran affiche la
   * barre (`KeyboardAccessoryBar`) tant qu'elle est fournie.
   */
  readonly onKeyboardBarChange?: (bar: MovementPhasesKeyboardBar | null) => void;
  readonly testID?: string;
};

export function MovementPhasesEditor({
  value,
  onChange,
  editable,
  onFocusChange,
  onActiveRowBottomChange,
  onKeyboardBarChange,
  testID = "movement-phases",
}: MovementPhasesEditorProps) {
  const [active, setActiveState] = useState(false);
  const onFocusChangeRef = useRef(onFocusChange);
  const onActiveRowBottomRef = useRef(onActiveRowBottomChange);
  const onKeyboardBarRef = useRef(onKeyboardBarChange);
  useEffect(() => {
    onFocusChangeRef.current = onFocusChange;
    onActiveRowBottomRef.current = onActiveRowBottomChange;
    onKeyboardBarRef.current = onKeyboardBarChange;
  });
  // Ligne en saisie et cadres des lignes (dans la liste), pour le recadrage au-dessus du clavier.
  const focusedKey = useRef<number | "invite" | null>(null);
  const rowLayouts = useRef(new Map<number | "invite", { y: number; height: number }>());
  const listY = useRef(0);
  function reportActive(key: number | "invite" | null) {
    if (key === null) return;
    const layout = rowLayouts.current.get(key);
    if (layout) onActiveRowBottomRef.current?.(listY.current + layout.y + layout.height);
  }
  function recordRowLayout(key: number | "invite", layout: { y: number; height: number }) {
    rowLayouts.current.set(key, { y: layout.y, height: layout.height });
    if (focusedKey.current === key) reportActive(key);
  }
  const pendingBlur = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (pendingBlur.current !== null) clearTimeout(pendingBlur.current);
    },
    [],
  );
  function setActive(next: boolean) {
    if (pendingBlur.current !== null) {
      clearTimeout(pendingBlur.current);
      pendingBlur.current = null;
    }
    if (next) {
      setActiveState(true);
      onFocusChangeRef.current?.(true);
      return;
    }
    // Sur iOS, la perte de focus de l'ancienne ligne peut précéder le focus de la nouvelle : différée,
    // et annulée par ce focus.
    pendingBlur.current = setTimeout(() => {
      pendingBlur.current = null;
      setActiveState(false);
      onFocusChangeRef.current?.(false);
    }, 0);
  }
  // Une saisie dans l'invite crée la phase et y déplace le focus : la suite de la frappe complète
  // CETTE phase (jamais une phase par caractère). Clé `"invite"` : la ligne d'invite.
  const inputs = useRef(new Map<number | "invite", TextInput>());
  const pendingFocus = useRef<number | "invite" | null>(null);
  // Recette du 27/10 (remarque 2, accord de Hermann) : comme la Description, Entrée sur une phase
  // ouvre la phase suivante JUSTE APRÈS elle — l'invite se place sous la phase (`null` : en fin).
  const [inviteAfter, setInviteAfter] = useState<number | null>(null);
  // PRE-9, recette iPhone n° 2 : champs de durée (focus programmé) et durée en saisie.
  const durationInputs = useRef(new Map<number, TextInput>());
  const [activeDuration, setActiveDuration] = useState<number | null>(null);
  // Recette iPhone du 26/11/2026 (après-midi), réponse de Hermann : champ du bloc en saisie (libellé, durée ou invite), qui porte
  // la barre du clavier. Sa perte de focus est différée comme celle du bloc (`setActive`) et annulée par le focus du champ
  // suivant : passer d'un champ à l'autre ne retire pas la barre (pas de nouvelle montée).
  const [barField, setBarField] = useState<PhaseFieldKey | null>(null);
  const pendingBarBlur = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (pendingBarBlur.current !== null) clearTimeout(pendingBarBlur.current);
    },
    [],
  );
  function focusBarField(key: PhaseFieldKey) {
    if (pendingBarBlur.current !== null) {
      clearTimeout(pendingBarBlur.current);
      pendingBarBlur.current = null;
    }
    setBarField(key);
  }
  function blurBarField(key: PhaseFieldKey) {
    if (pendingBarBlur.current !== null) clearTimeout(pendingBarBlur.current);
    pendingBarBlur.current = setTimeout(() => {
      pendingBarBlur.current = null;
      setBarField((current) => (current === key ? null : current));
    }, 0);
  }
  useEffect(() => {
    if (pendingFocus.current === null) return;
    inputs.current.get(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  });
  const phases = value.phases;
  const showInvite = editable && (phases.length === 0 || active);
  // Place de l'invite : sous la phase `inviteAfter` si elle existe encore, sinon en fin de liste.
  const inviteIndex = inviteAfter !== null && inviteAfter < phases.length - 1 ? inviteAfter : null;

  // Recette iPhone du 26/11/2026 (après-midi) : ordre de parcours de la barre (ordre affiché) et champ courant, relus par ses
  // actions au moment du toucher. Le focus passe d'un champ à l'autre sans fermer le clavier.
  const fieldOrder = movementPhaseFieldOrder(
    phases.map((phase) => phase.id),
    showInvite,
    inviteIndex,
  );
  const fieldOrderKey = fieldOrder.join(",");
  const barNavigation = useRef({ order: fieldOrder, field: barField });
  useEffect(() => {
    barNavigation.current = { order: fieldOrder, field: barField };
  });
  function focusField(key: PhaseFieldKey) {
    if (key === "invite") {
      const invite = inputs.current.get("invite");
      if (invite) invite.focus();
      else pendingFocus.current = "invite";
      return;
    }
    const [kind, id] = key.split(":");
    if (kind === "label") inputs.current.get(Number(id))?.focus();
    else durationInputs.current.get(Number(id))?.focus();
  }
  function moveField(step: -1 | 1) {
    const { order, field } = barNavigation.current;
    if (field === null) return;
    const target = order[order.indexOf(field) + step];
    if (order.indexOf(field) >= 0 && target !== undefined) focusField(target);
  }
  const moveFieldRef = useRef(moveField);
  useEffect(() => {
    moveFieldRef.current = moveField;
  });
  useEffect(() => {
    if (barField === null) {
      onKeyboardBarRef.current?.(null);
      return;
    }
    const order = fieldOrderKey.split(",");
    const index = order.indexOf(barField);
    onKeyboardBarRef.current?.({
      canPrevious: index > 0,
      canNext: index >= 0 && index < order.length - 1,
      onPrevious: () => moveFieldRef.current(-1),
      onNext: () => moveFieldRef.current(1),
    });
  }, [barField, fieldOrderKey]);
  useEffect(() => () => onKeyboardBarRef.current?.(null), []);

  function removeAt(index: number) {
    const phase = phases[index];
    if (!phase) return;
    const previous = phases[index - 1];
    pendingFocus.current = previous ? previous.id : null;
    // Recette du 27/10 (r11-entree-phases) : le focus passe à la phase précédente AVANT le retrait de
    // la ligne en saisie — retirer un champ qui a le focus ferme puis rouvre le clavier.
    if (previous) inputs.current.get(previous.id)?.focus();
    onChange(removeMovementPhase(value, phase.id));
  }

  function onAccessibilityAction(index: number, event: AccessibilityActionEvent) {
    const phase = phases[index];
    if (!phase) return;
    if (event.nativeEvent.actionName === "moveUp") onChange(moveMovementPhase(value, phase.id, index - 1));
    else if (event.nativeEvent.actionName === "moveDown") onChange(moveMovementPhase(value, phase.id, index + 1));
    else if (event.nativeEvent.actionName === "remove") removeAt(index);
  }

  // Recette du 27/10 (r11-entree-phases) : lignes et invite dans UNE liste à clés — l'invite garde son
  // champ (jamais démonté pendant la saisie, sinon le clavier se ferme puis se rouvre) où qu'elle soit.
  const items: ReactElement[] = phases.flatMap((phase, index) => {
          const rank = String(index + 1);
          // Numéro affiché : décalé d'un rang sous une invite insérée (l'invite porte le rang suivant).
          const shownRank = String(index + 1 + (showInvite && inviteIndex !== null && index > inviteIndex ? 1 : 0));
          const actions = [
            ...(index > 0 ? [{ name: "moveUp", label: t.moveUp }] : []),
            ...(index < phases.length - 1 ? [{ name: "moveDown", label: t.moveDown }] : []),
            { name: "remove", label: t.remove.replace("{rank}", rank) },
          ];
          const row = (
            <View
              key={phase.id}
              style={styles.row}
              onLayout={(event) => recordRowLayout(phase.id, event.nativeEvent.layout)}
              testID={`${testID}-row-${rank}`}
            >
              <Text style={styles.number} accessible={false} importantForAccessibility="no-hide-descendants">
                {`${shownRank}.`}
              </Text>
              {editable ? (
                <BarTextInput
                  active={barField === `label:${phase.id}`}
                  inputRef={(node) => {
                    if (node) inputs.current.set(phase.id, node);
                    else inputs.current.delete(phase.id);
                  }}
                  value={phase.label}
                  onChangeText={(label) => {
                    // F06 : une saisie au-delà de la limite est refusée en entier (le libellé reste).
                    if (!isPhaseLabelWithinLimit(label)) return;
                    onChange(renameMovementPhase(value, phase.id, label));
                  }}
                  onKeyPress={(event) => {
                    if (event.nativeEvent.key === "Backspace" && phase.label === "") removeAt(index);
                  }}
                  // Recette iPhone n° 2 du 31/10/2026 : Entrée place le curseur sur la durée de la même
                  // ligne, clavier ouvert (il devient numérique) [remplace l'invite ouverte juste après
                  // la phase, recette du 27/10, remarque 2].
                  onSubmitEditing={() => durationInputs.current.get(phase.id)?.focus()}
                  submitBehavior="submit"
                  // Contrôle de la recette n° 2 (cr2-phases KO) : touche Entrée au libellé par défaut,
                  // jamais « Next ».
                  returnKeyType="default"
                  onFocus={() => {
                    focusedKey.current = phase.id;
                    setActive(true);
                    focusBarField(`label:${phase.id}`);
                    reportActive(phase.id);
                  }}
                  onBlur={() => {
                    blurBarField(`label:${phase.id}`);
                    setActive(false);
                  }}
                  style={styles.text}
                  accessibilityLabel={t.labelAccessibility.replace("{rank}", rank)}
                  accessibilityActions={actions}
                  onAccessibilityAction={(event) => onAccessibilityAction(index, event)}
                  testID={`${testID}-label-${rank}`}
                />
              ) : (
                <Text style={styles.text} testID={`${testID}-label-${rank}`}>
                  {phase.label}
                </Text>
              )}
              {renderDuration(phase.id, movementPhaseDefaultDuration(phase), rank)}
            </View>
          );
          return showInvite && inviteIndex === index ? [row, renderInvite()] : [row];
  });
  if (showInvite && inviteIndex === null) items.push(renderInvite());

  return (
    <View style={styles.section} testID={testID}>
      <Text style={styles.title} accessibilityRole="header" testID={`${testID}-title`}>
        {t.title}
      </Text>
      <View
        style={styles.list}
        onLayout={(event) => {
          listY.current = event.nativeEvent.layout.y;
        }}
      >
        {items}
      </View>
    </View>
  );

  /**
   * PRE-9 A.2b : durée par défaut de la phase, à droite du libellé. Recette iPhone n° 2 du 31/10 :
   * cellule saisie au clavier numérique (`KeyboardField` `cellDuration`), appliquée à chaque frappe.
   */
  function renderDuration(phaseId: number, seconds: number | null, rank: string) {
    const shown = seconds === null ? null : formatPhraseDuration(seconds);
    if (!editable) {
      return shown === null ? null : (
        <Text style={styles.duration} testID={`${testID}-duration-${rank}`}>
          {shown}
        </Text>
      );
    }
    const focused = activeDuration === phaseId;
    return (
      <KeyboardField
        mode="cellDuration"
        displayValue={shown ?? t.durationPrompt}
        spokenDisplayValue={shown ?? t.durationNone}
        editText={seconds === null ? "" : mmssDigitsOf(seconds)}
        active={focused}
        onFocus={() => {
          focusedKey.current = phaseId;
          setActive(true);
          setActiveDuration(phaseId);
          focusBarField(`duration:${phaseId}`);
          reportActive(phaseId);
        }}
        onBlur={() => {
          setActiveDuration((current) => (current === phaseId ? null : current));
          blurBarField(`duration:${phaseId}`);
          setActive(false);
        }}
        onChangeText={(text) =>
          onChange(setMovementPhaseDuration(value, phaseId, cellDurationSeconds(text, WORK_PATTERN_DURATION_BOUNDS)))
        }
        inputRef={(node) => {
          if (node) durationInputs.current.set(phaseId, node);
          else durationInputs.current.delete(phaseId);
        }}
        accessibilityLabel={t.durationAccessibility.replace("{rank}", rank)}
        hitSlop={DURATION_HIT_SLOP}
        style={styles.durationButton}
        valueStyle={[styles.duration, shown === null && !focused ? styles.durationPrompt : null]}
        testID={`${testID}-duration-${rank}`}
      />
    );
  }

  function renderInvite() {
    const position = inviteIndex === null ? phases.length : inviteIndex + 1;
    return (
          <View
            key="invite"
            style={styles.row}
            onLayout={(event) => recordRowLayout("invite", event.nativeEvent.layout)}
            testID={`${testID}-invite-row`}
          >
            <Text style={[styles.number, styles.promptNumber]} accessible={false} importantForAccessibility="no-hide-descendants">
              {`${position + 1}.`}
            </Text>
            <BarTextInput
              active={barField === "invite"}
              inputRef={(node) => {
                if (node) inputs.current.set("invite", node);
                else inputs.current.delete("invite");
              }}
              value=""
              placeholder={phases.length === 0 ? t.firstPlaceholder : t.nextPlaceholder}
              placeholderTextColor={PROMPT_COLOR}
              onChangeText={(label) => {
                if (label.length === 0 || !isPhaseLabelWithinLimit(label)) return;
                pendingFocus.current = value.nextPhaseId;
                // L'invite reste juste sous la phase créée, qui prend le focus (r11-entree-phases).
                setInviteAfter(position);
                const added = addMovementPhase(value, label);
                onChange(position < phases.length ? moveMovementPhase(added, value.nextPhaseId, position) : added);
              }}
              onKeyPress={(event) => {
                const previous = phases[position - 1];
                if (event.nativeEvent.key !== "Backspace" || !previous) return;
                setInviteAfter(null);
                inputs.current.get(previous.id)?.focus();
              }}
              submitBehavior="submit"
              returnKeyType="default"
              onFocus={() => {
                focusedKey.current = "invite";
                setActive(true);
                focusBarField("invite");
                reportActive("invite");
              }}
              onBlur={() => {
                blurBarField("invite");
                setActive(false);
              }}
              style={styles.text}
              accessibilityLabel={phases.length === 0 ? t.firstPlaceholder : t.nextPlaceholder}
              testID={`${testID}-invite`}
            />
          </View>
    );
  }
}

const styles = StyleSheet.create({
  section: {
    gap: TITLE_TO_LIST,
  },
  // F04 : même titre que « Description du mouvement » (Regular 11 secondaire, Figma `10450:24381`).
  title: {
    ...type.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  // Sans contenant, comme la Description : ni fond, ni contour, ni padding.
  list: {
    gap: ROW_GAP,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: NUMBER_GAP,
  },
  number: {
    ...type.label,
    color: colors.textSecondary,
    minWidth: NUMBER_WIDTH,
    textAlign: "right",
  },
  promptNumber: {
    color: PROMPT_COLOR,
  },
  // PRE-9 A.2b (rendu choisi) : valeur de durée alignée à droite, sur la largeur d'une cellule Durée.
  durationButton: {
    width: DURATION_WIDTH,
    minHeight: DURATION_TOUCH_HEIGHT,
    alignItems: "flex-end",
  },
  duration: {
    ...type.body,
    color: colors.textPrimary,
    textAlign: "right",
  },
  durationPrompt: {
    color: PROMPT_COLOR,
  },
  text: {
    ...type.body,
    flex: 1,
    color: colors.textPrimary,
    padding: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
});

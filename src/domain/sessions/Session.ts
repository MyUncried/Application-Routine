export const SESSION_COLORS = [
  "#E5484D",
  "#F47B20",
  "#F7D154",
  "#2E9B62",
  "#20B2AA",
  "#32B8D8",
  "#3B82F6",
  "#5A5BD7",
  "#7B61D1",
  "#A34AB7",
  "#E45C9A",
  "#8E8E93",
] as const;

export const DEFAULT_SESSION_COLOR = "#3B82F6" as const;

export type SessionColor = (typeof SESSION_COLORS)[number];

export type DurationExercise = {
  id: string;
  type: "EXERCISE";
  executionMode: "DURATION";
  structuralPosition: "IN_TOUR";
  position: 0;
  name: string;
  durationSeconds: number;
  repetitionCount: null;
  seriesCount: 1;
  pauseSeconds: 0;
  instruction: string | null;
};
export type Session = {
  id: string;
  ownerId: string;
  name: string;
  color: SessionColor;
  status: "ACTIVE";
  initialCountdownSeconds: number;
  finalPhaseSeconds: number;
  createdAt: string;
  updatedAt: string;
  cycle: {
    id: string;
    position: 1;
    repeatCount: 1;
    tour: {
      id: string;
      position: 1;
      repeatCount: 1;
      exercise: DurationExercise;
    };
  };
};

export type CreateSessionInput = {
  name: string;
  color: SessionColor;
  initialCountdownSeconds: number;
  finalPhaseSeconds: number;
  exercise: {
    name: string;
    durationSeconds: number;
    instruction?: string | null;
  };
};

export type SessionSummary = {
  id: string;
  name: string;
  color: SessionColor;
  activityCount: 1;
  estimatedDurationSeconds: number;
  tourRepeatCount: 1;
  updatedAt: string;
};

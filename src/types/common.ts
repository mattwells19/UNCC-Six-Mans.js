import { DateTime } from "luxon";

export const enum Team {
  Blue = 0,
  Orange = 1,
}

export interface BallChaser {
  id: Readonly<number>;
  mmr: Readonly<number>;
  name: Readonly<string>;
  isCap: Readonly<boolean>;
  team: Readonly<Team | null>;
  queueTime: Readonly<DateTime>;
}

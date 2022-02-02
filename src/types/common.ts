import { DateTime } from "luxon";

export const enum Team {
  Blue = "Blue",
  Orange = "Orange",
}

export interface BallChaser {
  id: Readonly<string>;
  mmr: Readonly<number>;
  name: Readonly<string>;
  isCap: Readonly<boolean>;
  team: Readonly<Team | null>;
  queueTime: Readonly<DateTime | null>;
}

export const normIconURL = "https://raw.githubusercontent.com/mattwells19/UNCC-Six-Mans.js/main/media/norm_still.png";
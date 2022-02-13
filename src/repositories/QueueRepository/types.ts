import { DateTime } from "luxon";
import { Team } from "../../types/common";

export interface UpdateBallChaserOptions {
  id: number;
  mmr?: number;
  name?: string;
  isCap?: boolean;
  team?: Team;
  queueTime?: DateTime;
}

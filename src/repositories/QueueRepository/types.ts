import { DateTime } from "luxon";
import { Team } from "../../types/common";
import { BallChaser } from "../../types/common";
export interface UpdateBallChaserOptions {
  id: number;
  isCap?: boolean;
  team?: Team;
  queueTime?: DateTime;
}

export type PlayerInQueueResponse = Omit<BallChaser, "mmr"> & {
  mmr: number | null;
};

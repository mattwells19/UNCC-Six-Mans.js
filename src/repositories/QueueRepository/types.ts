import { BallChaser, Queue } from "@prisma/client";
import { DateTime } from "luxon";
import { Team } from "../../types/common";

export interface UpdateBallChaserOptions {
  id: number;
  isCap?: boolean;
  team?: Team;
  queueTime?: DateTime;
}

export type PlayerInQueueResponse = BallChaser &
  Omit<Queue, "playerId" | "queueTime"> & {
    mmr: number | null;
    queueTime: DateTime;
  };

export interface AddBallChaserToQueueInput {
  id: number;
  name: string;
  queueTime: DateTime;
}

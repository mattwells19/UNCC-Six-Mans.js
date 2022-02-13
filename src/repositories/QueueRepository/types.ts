import { BallChaser, Queue } from "@prisma/client";
import { DateTime } from "luxon";
import { Team } from "../../types/common";

export interface UpdateBallChaserInQueueInput {
  id: number;
  isCap?: boolean;
  team?: Team | null;
  queueTime?: DateTime;
}

export type PlayerInQueue = {
  id: number;
  isCap: boolean;
  mmr: number | null;
  name: string;
  queueTime: DateTime;
  team: Team | null;
};

export interface AddBallChaserToQueueInput {
  id: number;
  name: string;
  queueTime: DateTime;
}

export type QueueWithBallChaser = Queue & { player: BallChaser; team: Team | null };

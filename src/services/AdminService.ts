import QueueRepository from "../repositories/QueueRepository";
import { PlayerInQueue } from "../repositories/QueueRepository/types";
import { InvalidCommand } from "../utils/InvalidCommand";
import { leaveQueue } from "./QueueService";

export async function kickPlayerFromQueue(playerIdToRemove: string): Promise<ReadonlyArray<PlayerInQueue>> {
  const playersInQueue = await QueueRepository.getAllBallChasersInQueue();
  if (playersInQueue.length === 0) {
    throw new InvalidCommand("Queue is empty, who are you trying to remove?");
  } else if (playersInQueue.some((p) => p.isCap)) {
    throw new InvalidCommand("Can't kick a player after captains have been chosen.");
  }

  return await leaveQueue(playerIdToRemove);
}

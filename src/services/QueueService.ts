import { DateTime } from "luxon";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import QueueRepository from "../repositories/QueueRepository";
import { PlayerInQueue } from "../repositories/QueueRepository/types";

export async function joinQueue(userId: string, userName: string): Promise<ReadonlyArray<PlayerInQueue> | null> {
  //Check if in Active Match so as not to add to the queue.
  const activeMatchMember = await ActiveMatchRepository.isPlayerInActiveMatch(userId);
  if (activeMatchMember) return null;

  //Check if in Queue so as not to add to the queue again.
  const queueMember = await QueueRepository.getBallChaserInQueue(userId);
  if (!queueMember) {
    await QueueRepository.addBallChaserToQueue({
      id: userId,
      name: userName,
      queueTime: DateTime.now().plus({ minutes: 60 }).set({ millisecond: 0, second: 0 }),
    });
  } else {
    await QueueRepository.updateBallChaserInQueue({
      id: userId,
      queueTime: DateTime.now().plus({ minutes: 60 }).set({ millisecond: 0, second: 0 }),
    });
  }

  return await QueueRepository.getAllBallChasersInQueue();
}

export async function leaveQueue(userId: string): Promise<ReadonlyArray<PlayerInQueue>> {
  await QueueRepository.removeBallChaserFromQueue(userId);
  return await QueueRepository.getAllBallChasersInQueue();
}

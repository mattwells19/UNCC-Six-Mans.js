import { DateTime } from "luxon";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import QueueRepository from "../repositories/QueueRepository";
import { AddBallChaserToQueueInput, PlayerInQueue } from "../repositories/QueueRepository/types";

export async function joinQueue(userId: string, userName: string): Promise<ReadonlyArray<PlayerInQueue>> {
  const queueMember = await QueueRepository.getBallChaserInQueue(userId);

  if (!queueMember) {
    const player: AddBallChaserToQueueInput = {
      id: userId,
      name: userName,
      queueTime: DateTime.now().plus({ minutes: 60 }).set({ second: 0, millisecond: 0 }),
    };
    await QueueRepository.addBallChaserToQueue(player);
  } else {
    await QueueRepository.updateBallChaserInQueue({
      id: userId,
      queueTime: DateTime.now().plus({ minutes: 60 }).set({ second: 0, millisecond: 0 }),
    });
  }

  return await QueueRepository.getAllBallChasersInQueue();
}

export async function leaveQueue(userId: string): Promise<ReadonlyArray<PlayerInQueue> | null> {
  const member = await QueueRepository.getBallChaserInQueue(userId);

  if (!member) return null;

  await QueueRepository.removeBallChaserFromQueue(userId);
  return await QueueRepository.getAllBallChasersInQueue();
}

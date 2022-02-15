import { DateTime } from "luxon";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import QueueRepository from "../repositories/QueueRepository";
import { BallChaser } from "../types/common";

export async function joinQueue(userId: string, userName: string): Promise<ReadonlyArray<BallChaser>> {
  const queueMember = await QueueRepository.getBallChaserInQueue(userId);

  if (!queueMember) {
    const leaderboardMember = await LeaderboardRepository.getPlayerStats(userId);
    const player: BallChaser = {
      id: userId,
      isCap: false,
      mmr: leaderboardMember ? leaderboardMember.mmr : 100,
      name: userName,
      queueTime: DateTime.now().plus({ minutes: 60}),
      team: null,
    };
    await QueueRepository.addBallChaserToQueue(player);
  } else {
    await QueueRepository.updateBallChaserInQueue({
      id: userId,
      queueTime: DateTime.now().plus({ minutes: 60 }),
    });
  }

  return await QueueRepository.getAllBallChasersInQueue();
}

export async function leaveQueue(userId: string): Promise<ReadonlyArray<BallChaser> | null> {
  const member = await QueueRepository.getBallChaserInQueue(userId);

  if (!member) return null;

  await QueueRepository.removeBallChaserFromQueue(userId);
  return await QueueRepository.getAllBallChasersInQueue();
}

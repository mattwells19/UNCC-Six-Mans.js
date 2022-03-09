import { DateTime } from "luxon";
import QueueRepository from "../repositories/QueueRepository";
import { PlayerInQueue } from "../repositories/QueueRepository/types";

export async function fillTeams(): Promise<ReadonlyArray<PlayerInQueue>> {
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();
  const numPlayersToFill = 6 - ballchasers.length;

  for (let i = 0; i < numPlayersToFill; i++) {
    const player = testPlayers[i];
    await QueueRepository.addBallChaserToQueue(player);
  }

  const updatedQueue = await QueueRepository.getAllBallChasersInQueue();

  return updatedQueue;
}

const testPlayers: PlayerInQueue[] = [
  {
    id: "346838372649795595",
    isCap: false,
    mmr: 178,
    name: "Tux",
    queueTime: DateTime.now(),
    team: null,
  },
  {
    id: "528369347807412227",
    isCap: false,
    mmr: 72,
    name: "Don",
    queueTime: DateTime.now(),
    team: null,
  },
  {
    id: "163667436229361664",
    isCap: false,
    mmr: 200,
    name: "h.",
    queueTime: DateTime.now(),
    team: null,
  },
  {
    id: "209084277223194624",
    isCap: false,
    mmr: 198,
    name: "DaffyJr",
    queueTime: DateTime.now(),
    team: null,
  },
  {
    id: "929967919763439656",
    isCap: false,
    mmr: 302,
    name: "GamerDadOf4",
    queueTime: DateTime.now(),
    team: null,
  },
  {
    id: "385935752413970432",
    isCap: false,
    mmr: 264,
    name: "AlphaGiddy",
    queueTime: DateTime.now(),
    team: null,
  },
];

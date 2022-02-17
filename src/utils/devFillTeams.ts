import { DateTime } from "luxon";
import QueueRepository from "../repositories/QueueRepository";
import { BallChaser } from "../types/common";

export async function fillTeams(): Promise<ReadonlyArray<BallChaser>> {
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();
  const numPlayersToFill = 6 - ballchasers.length;

  for (let i = 0; i < numPlayersToFill; i++) {
    const player = testPlayers[i];
    await QueueRepository.addBallChaserToQueue(player);
  }

  const updatedQueue = await QueueRepository.getAllBallChasersInQueue();

  return updatedQueue;
}

const testPlayers: BallChaser[] = 
[
  {
    id: "346838372649795595",
    isCap: false,
    mmr: Math.floor(Math.random() * (300 - 0 + 1)) + 0,
    name: "Tux",
    queueTime: DateTime.now(),
    team: null
  },
  {
    id: "528369347807412227",
    isCap: false,
    mmr: Math.floor(Math.random() * (300 - 0 + 1)) + 0,
    name: "Don",
    queueTime: DateTime.now(),
    team: null
  },  {
    id: "163667436229361664",
    isCap: false,
    mmr: Math.floor(Math.random() * (300 - 0 + 1)) + 0,
    name: "h.",
    queueTime: DateTime.now(),
    team: null
  },  {
    id: "209084277223194624",
    isCap: false,
    mmr: Math.floor(Math.random() * (300 - 0 + 1)) + 0,
    name: "DaffyJr",
    queueTime: DateTime.now(),
    team: null
  },  {
    id: "347083937216200704",
    isCap: false,
    mmr: Math.floor(Math.random() * (300 - 0 + 1)) + 0,
    name: "cash",
    queueTime: DateTime.now(),
    team: null
  },  {
    id: "385935752413970432",
    isCap: false,
    mmr: Math.floor(Math.random() * (300 - 0 + 1)) + 0,
    name: "AlphaGiddy",
    queueTime: DateTime.now(),
    team: null
  },
];
import { joinQueue } from "../QueueService";
import { leaveQueue } from "../QueueService";
import { BallChaserQueueBuilder } from "../../../.jest/Builder";
import { DateTime } from "luxon";
import getEnvVariable from "../../utils/getEnvVariable";
import { PrismaClient } from "@prisma/client";
import LeaderboardRepository from "../../repositories/LeaderboardRepository";
import { mocked } from "ts-jest/utils";
import { PlayerInQueue } from "../../repositories/QueueRepository/types";
import { PlayerStats } from "../../repositories/LeaderboardRepository/types";
import faker from "faker";
import { LeaderboardToString } from "../LeaderboardService";

jest.mock("../../utils/getEnvVariable");
jest.mock("../../repositories/LeaderboardRepository");

let prisma: PrismaClient;
let seasonSemester: string;
let seasonYear: string;

beforeEach(async () => {
  jest.clearAllMocks();
});

beforeAll(async () => {
  seasonSemester = getEnvVariable("season_semester");
  seasonYear = getEnvVariable("season_year");

  prisma = new PrismaClient();
  await prisma.$connect();
  await prisma.leaderboard.deleteMany();
  await prisma.activeMatch.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.ballChaser.deleteMany();
});

afterEach(async () => {
  await prisma.leaderboard.deleteMany();
  await prisma.activeMatch.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.ballChaser.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const mockPlayer1 = BallChaserQueueBuilder.single({});

describe("QueueService tests", () => {
  describe("Joining queue", () => {
    describe("Not already in queue", () => {
      it("joins a player to the queue if they are not already in the queue", async () => {
        const result = await joinQueue(mockPlayer1.id, mockPlayer1.name);

        expect(result).toHaveLength(1);
      });

      it("Not on leaderboard | joins queue with 100 MMR and queue time 1 hour from now", async () => {
        const result = await joinQueue(mockPlayer1.id, mockPlayer1.name);
        let mmr = result[0].mmr;
        let receivedQueueTime = result[0].queueTime.diffNow().as("minutes");
        let expectedQueueTime = DateTime.now().plus({ minutes: 60 });

        expect(mmr).toBe(null);
        expect(Math.round(receivedQueueTime)).toEqual(Math.round(expectedQueueTime.diffNow().as("minutes")));
      });
      it("On leaderboard | joins queue with Leaderboard MMR and queue time 1 hour from now", async () => {
        const mockPlayer2: PlayerStats = {
          id: "player_id_2",
          losses: 6,
          matchesPlayed: 16,
          mmr: 119,
          name: "h",
          winPerc: 0.63,
          wins: 10,
        };
        mocked(LeaderboardRepository.getPlayerStats).mockResolvedValue(mockPlayer2);
        const resultJoin = await joinQueue(mockPlayer2.id, mockPlayer2.name);
        let receivedQueueTime = resultJoin[0].queueTime.diffNow().as("minutes");
        let expectedQueueTime = DateTime.now().plus({ minutes: 60 });

        expect(resultJoin[0].mmr).toEqual(mockPlayer2.mmr);
        expect(Math.round(receivedQueueTime)).toEqual(Math.round(expectedQueueTime.diffNow().as("minutes")));
      });
    });

    it("Already in the queue | updates queue time to 1 hour from now", async () => {
      const firstJoin = await joinQueue(mockPlayer1.id, mockPlayer1.name);
      let receivedQueueTime1 = firstJoin[0].queueTime.diffNow().as("minutes");
      let expectedQueueTime1 = DateTime.now().plus({ minutes: 60 });
      expect(Math.round(receivedQueueTime1)).toEqual(Math.round(expectedQueueTime1.diffNow().as("minutes")));
      const secondJoin = await joinQueue(mockPlayer1.id, mockPlayer1.name);
      let receivedQueueTime2 = secondJoin[0].queueTime.diffNow().as("minutes");
      let expectedQueueTime2 = DateTime.now().plus({ minutes: 60 });
      expect(Math.round(receivedQueueTime2)).toEqual(Math.round(expectedQueueTime2.diffNow().as("minutes")));
      expect(receivedQueueTime1).not.toEqual(receivedQueueTime2);
    });
  });

  describe("Leaving queue", () => {
    it.todo("removes player from queue when they exist");
    it.todo("does nothing if player is not in queue");
  });
});

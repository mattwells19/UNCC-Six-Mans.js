import { joinQueue } from "../QueueService";
import { leaveQueue } from "../QueueService";
import { BallChaserQueueBuilder, LeaderboardBuilder } from "../../../.jest/Builder";
import { DateTime } from "luxon";
import { PrismaClient } from "@prisma/client";
import LeaderboardRepository from "../../repositories/LeaderboardRepository";

jest.mock("../../utils/getEnvVariable");
jest.mock("../../repositories/LeaderboardRepository");

let prisma: PrismaClient;

beforeEach(async () => {
  jest.clearAllMocks();
});

beforeAll(async () => {
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
        expect(result[0].id).toBe(mockPlayer1.id);
      });

      it("Not on leaderboard | joins queue with 100 MMR and queue time 1 hour from now", async () => {
        const result = await joinQueue(mockPlayer1.id, mockPlayer1.name);
        const mmr = result[0].mmr;
        const receivedQueueTime = result[0].queueTime;
        const expectedQueueTime = DateTime.now().plus({ minutes: 60 }).set({ millisecond: 0, second: 0 });

        expect(mmr).toBe(null);
        expect(receivedQueueTime).toEqual(expectedQueueTime);
      });
      it("On leaderboard | joins queue with Leaderboard MMR and queue time 1 hour from now", async () => {
        const mockPlayer2 = LeaderboardBuilder.single();
        jest.mocked(LeaderboardRepository.getPlayerStats).mockResolvedValue(mockPlayer2);
        const resultJoin = await joinQueue(mockPlayer2.id, mockPlayer2.name);
        const receivedQueueTime = resultJoin[0].queueTime;
        const expectedQueueTime = DateTime.now().plus({ minutes: 60 }).set({ millisecond: 0, second: 0 });

        expect(resultJoin[0].mmr).toEqual(mockPlayer2.mmr);
        expect(resultJoin).toHaveLength(1);
        expect(receivedQueueTime).toEqual(expectedQueueTime);
      });
    });

    it("Already in the queue | updates queue time to 1 hour from now", async () => {
      const firstJoin = await joinQueue(mockPlayer1.id, mockPlayer1.name);
      const receivedQueueTime1 = firstJoin[0].queueTime;
      const expectedQueueTime1 = DateTime.now().plus({ minutes: 60 }).set({ millisecond: 0, second: 0 });

      expect(receivedQueueTime1).toEqual(expectedQueueTime1);

      const secondJoin = await joinQueue(mockPlayer1.id, mockPlayer1.name);
      const receivedQueueTime2 = secondJoin[0].queueTime;
      const expectedQueueTime2 = DateTime.now().plus({ minutes: 60 }).set({ millisecond: 0, second: 0 });

      expect(receivedQueueTime2).toEqual(expectedQueueTime2);
    });
  });

  describe("Leaving queue", () => {
    it("removes player from queue when they exist", async () => {
      const resultJoin = await joinQueue(mockPlayer1.id, mockPlayer1.name);

      expect(resultJoin).toHaveLength(1);
      expect(resultJoin[0].id).toEqual(mockPlayer1.id);

      const resultLeave = await leaveQueue(mockPlayer1.id);

      expect(resultLeave).toStrictEqual([]);
      expect(resultLeave).not.toEqual(resultJoin);
    });
    it("does nothing if player is not in queue", async () => {
      const result = await leaveQueue(mockPlayer1.id);

      expect(result).toEqual(null);
    });
  });
});

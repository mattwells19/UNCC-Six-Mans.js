import { BallChaserQueueBuilder } from "../../../.jest/Builder";
import ActiveMatchRepository from "../../repositories/ActiveMatchRepository";
import { Team } from "../../types/common";
import { PrismaClient } from "@prisma/client";
import { PlayerInQueue } from "../../repositories/QueueRepository/types";
import { checkReport, reportMatch } from "../MatchReportService";

jest.mock("../../repositories/ActiveMatchRepository");
jest.mock("../../repositories/QueueRepository");
jest.mock("../../utils");

let prisma: PrismaClient;
let eventId: number = 1;

beforeEach(() => {
  jest.clearAllMocks();
});

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
  await prisma.event.deleteMany();

  await prisma.event.create({
    data: {
      id: 1,
      name: "Test Event",
    },
  });

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

async function manuallyAddBallChaserToQueue(ballChaser: PlayerInQueue) {
  await prisma.ballChaser.create({
    data: {
      id: ballChaser.id,
      name: ballChaser.name,
      queue: {
        create: {
          isCap: ballChaser.isCap,
          queueTime: ballChaser.queueTime.toISO(),
          team: ballChaser.team,
        },
      },
      rank: {
        create: {
          mmr: ballChaser.mmr ?? 100,
          eventId,
        },
      },
    },
  });
}

async function manuallyAddActiveMatchForBlue(ballChaser: PlayerInQueue) {
  await prisma.activeMatch.create({
    data: {
      id: "1",
      playerId: ballChaser.id,
      team: 0,
    },
  });
}

async function manuallyAddActiveMatchForOrange(ballChaser: PlayerInQueue) {
  await prisma.activeMatch.create({
    data: {
      id: "1",
      playerId: ballChaser.id,
      team: 1,
    },
  });
}

describe("Match Report Service tests", () => {
  jest.mocked(ActiveMatchRepository.getAllPlayersInActiveMatch).mockResolvedValueOnce({
    blueTeam: [],
    orangeTeam: [],
  });

  describe.each([Team.Blue, Team.Orange])("Report team button was pressed", (team) => {
    it.todo("Does not report if the player is not in an active match", async () => {
      const mockBallChaser = BallChaserQueueBuilder.single();
      await manuallyAddBallChaserToQueue(mockBallChaser);
      await manuallyAddActiveMatchForBlue(mockBallChaser);
      const testBallChaser = BallChaserQueueBuilder.single();
      const report = await checkReport(team, testBallChaser.id);
      const match = await prisma.activeMatch.findFirst({
        where: {
          id: "1",
          playerId: testBallChaser.id,
        },
      });

      expect(report).toBeFalsy;
      expect(match?.reportedTeam).not.toEqual(team);
    });

    it.todo("Reports the team won if the player is in an active match", async () => {
      const mockBallChaser1 = BallChaserQueueBuilder.single();
      const mockBallChaser2 = BallChaserQueueBuilder.single();
      await manuallyAddBallChaserToQueue(mockBallChaser1);
      await manuallyAddBallChaserToQueue(mockBallChaser2);
      await manuallyAddActiveMatchForBlue(mockBallChaser1);
      await manuallyAddActiveMatchForOrange(mockBallChaser2);
      const report = await checkReport(team, mockBallChaser2.id);
      const match = await prisma.activeMatch.findFirst({
        where: {
          playerId: mockBallChaser2.id,
        },
      });

      expect(report).toBeFalsy;
      expect(match).not.toBeNull;
      expect(match?.reportedTeam).toEqual(team);
    });
    it.todo("Does not change the report if another player on the same team reports the same team", async () => {});
    it.todo("Switches the reported team if the opposite team is reported", async () => {});
    it.todo("Confirms the team won if this is the second report by opposite team", async () => {});
  });
});

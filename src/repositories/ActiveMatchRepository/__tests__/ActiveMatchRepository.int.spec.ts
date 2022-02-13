import * as faker from "faker";
import { ActiveMatchBuilder, BallChaserQueueBuilder } from "../../../../.jest/Builder";
import ActiveMatchRepository from "../ActiveMatchRepository";
import { PlayerInActiveMatch } from "../types";
import { Team } from "../../../types/common";
import { BallChaser, PrismaClient } from "@prisma/client";

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

async function manuallyAddActiveMatch(activeMatch: PlayerInActiveMatch | Array<PlayerInActiveMatch>) {
  const playersToAdd = Array.isArray(activeMatch) ? activeMatch : [activeMatch];

  const promises = [];
  for (const activeMatch of playersToAdd) {
    promises.push(
      await prisma.ballChaser.create({
        data: {
          id: activeMatch.id,
          name: faker.name.firstName(),
          activeMatch: {
            create: {
              id: activeMatch.matchId,
              team: activeMatch.team,
              reportedTeam: activeMatch.reportedTeam,
            },
          },
        },
      })
    );
  }

  await Promise.all(promises);
}

async function manuallyAddBallChaser(ballChaser: BallChaser | Array<BallChaser>) {
  if (Array.isArray(ballChaser)) {
    await prisma.ballChaser.createMany({
      data: ballChaser.map((p) => ({
        id: p.id,
        name: p.name,
      })),
    });
  } else {
    await prisma.ballChaser.create({
      data: {
        id: ballChaser.id,
        name: ballChaser.name,
      },
    });
  }
}

describe("ActiveMatchRepository Tests", () => {
  describe("Happy path tests", () => {
    it("can add an active match", async () => {
      const mockBallChasers = BallChaserQueueBuilder.many(6);
      await manuallyAddBallChaser(mockBallChasers);

      await ActiveMatchRepository.addActiveMatch(mockBallChasers.map((p) => ({ id: p.id, team: p.team! })));

      const actual = await prisma.activeMatch.findMany();
      expect(actual).toHaveLength(6);

      const matchId = actual[0].id;

      expect(actual).toEqual(
        expect.arrayContaining(
          mockBallChasers.map((p) => ({
            id: matchId,
            playerId: p.id,
            team: p.team,
            reportedTeam: null,
          }))
        )
      );
    });

    it("can remove all players in a match", async () => {
      const mockMatchId = faker.datatype.uuid();
      const mockPlayers = ActiveMatchBuilder.many(6, { matchId: mockMatchId });
      await manuallyAddActiveMatch(mockPlayers);

      await ActiveMatchRepository.removeAllPlayersInActiveMatch(mockPlayers[0].id);

      const count = await prisma.activeMatch.count();
      expect(count).toBe(0);
    });

    it("throws when trying to remove a player not in an active match", async () => {
      await expect(
        ActiveMatchRepository.removeAllPlayersInActiveMatch(BallChaserQueueBuilder.single().id)
      ).rejects.toThrowError();
    });

    it("retreives all players part of an active match", async () => {
      const mockMatchId = faker.datatype.uuid();
      const mockPlayers = ActiveMatchBuilder.many(6, { matchId: mockMatchId });
      await manuallyAddActiveMatch(mockPlayers);

      const oneOfThePlayers = faker.random.arrayElement(mockPlayers);
      const allPlayersInActiveMatch = await ActiveMatchRepository.getAllPlayersInActiveMatch(oneOfThePlayers.id);

      allPlayersInActiveMatch.forEach((player) => {
        const expectedPlayer = mockPlayers.find((p) => p.id === player.id);
        expect(expectedPlayer).not.toBeNull();
        expect(player.matchId).toBe(mockMatchId);
        expect(player.reportedTeam).toBe(expectedPlayer?.reportedTeam);
        expect(player.team).toBe(expectedPlayer?.team);
      });
    });

    it("returns an empty array when trying to retreive a player not in an active match", async () => {
      const allPlayers = await ActiveMatchRepository.getAllPlayersInActiveMatch(BallChaserQueueBuilder.single().id);
      expect(allPlayers).toHaveLength(0);
    });

    it("updates player in active match correctly", async () => {
      const mockMatchId = faker.datatype.uuid();
      const mockPlayers = ActiveMatchBuilder.many(6, { matchId: mockMatchId });

      await manuallyAddActiveMatch(mockPlayers);
      const oneOfThePlayers = faker.random.arrayElement(mockPlayers);

      const reportedTeam = faker.random.arrayElement([Team.Orange, Team.Blue]);
      const oneOfThePlayersIndex = mockPlayers.findIndex((mockPlayer) => mockPlayer.id === oneOfThePlayers.id);

      await ActiveMatchRepository.updatePlayerInActiveMatch(mockPlayers[oneOfThePlayersIndex].id, {
        reportedTeam: reportedTeam,
      });

      const actual = await prisma.activeMatch.findMany({
        where: {
          id: mockMatchId,
        },
      });

      expect(actual).toHaveLength(6);
      actual.forEach((match) => {
        const mockPlayerForEntry = mockPlayers.find((p) => p.id === match.playerId);

        expect(mockPlayerForEntry).not.toBeNull();
        expect(match.id).toBe(mockMatchId);
        expect(match.team).toBe(mockPlayerForEntry?.team);

        if (match.playerId === oneOfThePlayers.id) {
          expect(match.reportedTeam).toBe(reportedTeam);
        } else {
          expect(match.reportedTeam).toBe(mockPlayerForEntry?.reportedTeam);
        }
      });
    });
  });

  describe("Exception handling tests", () => {
    it("throws if trying to add a ballchaser to an active match with no team", async () => {
      await expect(
        ActiveMatchRepository.addActiveMatch([BallChaserQueueBuilder.single({ team: null }) as any])
      ).rejects.toThrowError();
    });

    it("throws when trying to update a player not in an active match", async () => {
      await expect(
        ActiveMatchRepository.updatePlayerInActiveMatch(BallChaserQueueBuilder.single().id, { reportedTeam: Team.Blue })
      ).rejects.toThrowError();
    });
  });
});

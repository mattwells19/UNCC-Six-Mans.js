import { BallChaser, PrismaClient } from "@prisma/client";
import * as faker from "faker";
import { LeaderboardBuilder } from "../../../../.jest/Builder";
import getEnvVariable from "../../../utils/getEnvVariable";
import LeaderboardRepository from "../LeaderboardRepository";
import { PlayerStats } from "../types";

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

const validatePlayerStats = (expected: PlayerStats, actual: PlayerStats | null) => {
  expect(actual).not.toBeNull();
  expect(actual!.id).toBe(expected.id);
  expect(actual!.losses).toBe(expected.losses);
  expect(actual!.matchesPlayed).toBe(expected.matchesPlayed);
  expect(actual!.mmr).toBe(expected.mmr);
  expect(actual!.name).toBe(expected.name);
  expect(actual!.winPerc).toBe(expected.winPerc);
  expect(actual!.wins).toBe(expected.wins);
};

async function manuallyAddPlayerStatsToLeaderboard(ballChaser: PlayerStats | Array<PlayerStats>) {
  const playersToAdd = Array.isArray(ballChaser) ? ballChaser : [ballChaser];

  const promises = [];
  for (const player of playersToAdd) {
    promises.push(
      await prisma.ballChaser.create({
        data: {
          id: player.id,
          name: player.name,
          rank: {
            create: {
              mmr: player.mmr,
              losses: player.losses,
              wins: player.wins,
              seasonSemester,
              seasonYear,
            },
          },
        },
      })
    );
  }

  await Promise.all(promises);
}

async function manuallyAddBallChaser(ballChaser: BallChaser) {
  await prisma.ballChaser.create({
    data: {
      id: ballChaser.id,
      name: ballChaser.name,
    },
  });
}

describe("LeaderboardRepository tests", () => {
  it("gets player's stats", async () => {
    const mockPlayerStats = LeaderboardBuilder.single();
    await manuallyAddPlayerStatsToLeaderboard(mockPlayerStats);

    const result = await LeaderboardRepository.getPlayerStats(mockPlayerStats.id);

    validatePlayerStats(mockPlayerStats, result);
  });

  it("returns null when looking for player that does not exist", async () => {
    const result = await LeaderboardRepository.getPlayerStats(faker.datatype.number());
    expect(result).toBeNull();
  });

  it("updates player stats when the player exists", async () => {
    const mockPlayerStats = LeaderboardBuilder.single();
    await manuallyAddPlayerStatsToLeaderboard(mockPlayerStats);

    const mockPlayerUpdates = LeaderboardBuilder.single({ id: mockPlayerStats.id, name: mockPlayerStats.name });

    await LeaderboardRepository.updatePlayersStats([mockPlayerUpdates]);

    const actual = await prisma.leaderboard.findUnique({
      include: {
        player: true,
      },
      where: {
        seasonSemester_seasonYear_playerId: {
          playerId: mockPlayerStats.id,
          seasonSemester,
          seasonYear,
        },
      },
    });

    expect(actual).not.toBeNull();

    // should not change
    expect(actual?.player.id).toBe(mockPlayerStats.id);
    expect(actual?.player.name).toBe(mockPlayerStats.name);

    // should change
    expect(actual?.mmr).toBe(mockPlayerUpdates.mmr);
    expect(actual?.wins).toBe(mockPlayerUpdates.wins);
    expect(actual?.losses).toBe(mockPlayerUpdates.losses);
  });

  it("adds a player's stats when the player does not already exist", async () => {
    const mockPlayerStats = LeaderboardBuilder.single();
    await manuallyAddBallChaser(mockPlayerStats);

    await LeaderboardRepository.updatePlayersStats([mockPlayerStats]);

    const actual = await prisma.leaderboard.findUnique({
      include: {
        player: true,
      },
      where: {
        seasonSemester_seasonYear_playerId: {
          playerId: mockPlayerStats.id,
          seasonSemester,
          seasonYear,
        },
      },
    });

    expect(actual).not.toBeNull();

    expect(actual?.player.id).toBe(mockPlayerStats.id);
    expect(actual?.player.name).toBe(mockPlayerStats.name);
    expect(actual?.mmr).toBe(mockPlayerStats.mmr);
    expect(actual?.wins).toBe(mockPlayerStats.wins);
    expect(actual?.losses).toBe(mockPlayerStats.losses);
  });

  it("gets top n player stats", async () => {
    const playersToAdd = LeaderboardBuilder.many(10);
    await manuallyAddPlayerStatsToLeaderboard(playersToAdd);

    const allPlayers = await LeaderboardRepository.getPlayersStats(5);

    expect(allPlayers).toHaveLength(5);
    // 5 - 1 since you can't [i + 1] on the last item
    for (let i = 0; i < 5 - 1; i++) {
      expect(allPlayers[i].mmr).toBeGreaterThan(allPlayers[i + 1].mmr);
    }
  });

  it("gets all player stats sorted correctly based on MMR", async () => {
    const playersToAdd = LeaderboardBuilder.many(10);
    await manuallyAddPlayerStatsToLeaderboard(playersToAdd);

    const allPlayers = await LeaderboardRepository.getPlayersStats();

    expect(allPlayers).toHaveLength(playersToAdd.length);
    // playersToAdd.length - 1 since you can't [i + 1] on the last item
    for (let i = 0; i < playersToAdd.length - 1; i++) {
      expect(allPlayers[i].mmr).toBeGreaterThan(allPlayers[i + 1].mmr);
    }
  });

  it("gets all player stats sorted correctly by wins when MMR is equal", async () => {
    const playersToAdd = LeaderboardBuilder.many(5, { mmr: 100 });
    await manuallyAddPlayerStatsToLeaderboard(playersToAdd);

    const allPlayers = await LeaderboardRepository.getPlayersStats();

    expect(allPlayers).toHaveLength(playersToAdd.length);
    // playersToAdd.length - 1 since you can't [i + 1] on the last item
    for (let i = 0; i < playersToAdd.length - 1; i++) {
      expect(allPlayers[i].wins).toBeGreaterThan(allPlayers[i + 1].wins);
    }
  });
});

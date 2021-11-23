import LeaderboardRepository from "../LeaderboardRepository";
import * as faker from "faker";
import { BallChaser } from "../../../types/common";
import { PlayerStats } from "../types";
import { BallChaserBuilder } from "../../../../.jest/Builder";
import NotionClient from "../../helpers/NotionClient";

// set timeout to be longer (20 seconds) since async requests take extra time
jest.setTimeout(20000);

async function removeAllPlayersFromLeaderboard() {
  const notionClient = new NotionClient(process.env.notion_leaderboard_id ?? "");
  await notionClient.findAllAndRemove();
}

function makePlayerStats(
  ballChaser: BallChaser = BallChaserBuilder.single(),
  overrides?: Partial<PlayerStats>
): PlayerStats {
  const wins = faker.datatype.number({ min: 0 });
  const losses = faker.datatype.number({ min: 0 });

  return {
    id: ballChaser.id,
    losses,
    matchesPlayed: wins + losses,
    mmr: faker.datatype.number({ min: 0 }),
    name: ballChaser.name,
    winPerc: wins / (wins + losses),
    wins,
    ...overrides,
  };
}

describe("Leaderboard Repository integration tests", () => {
  afterEach(async () => {
    await removeAllPlayersFromLeaderboard();
  });

  it("gets player by id", async () => {
    const playerToAdd = makePlayerStats();
    await LeaderboardRepository.updatePlayersStats([playerToAdd]);
    const foundPlayer = await LeaderboardRepository.getPlayerStats(playerToAdd.id);

    expect(foundPlayer).not.toBeNull();
    expect(foundPlayer!.id).toBe(playerToAdd.id);
    expect(foundPlayer!.losses).toBe(playerToAdd.losses);
    expect(foundPlayer!.matchesPlayed).toBe(playerToAdd.matchesPlayed);
    expect(foundPlayer!.mmr).toBe(playerToAdd.mmr);
    expect(foundPlayer!.name).toBe(playerToAdd.name);
    // formulas are fixed to one decimal place in NotionHelper so need to replicate here for equality
    expect(foundPlayer!.winPerc).toBe(+playerToAdd.winPerc.toFixed(2));
    expect(foundPlayer!.wins).toBe(playerToAdd.wins);
  });

  it("can add a player's stats and retrieve them in order based on MMR", async () => {
    const playersToAdd = Array.from({ length: 10 }, () => makePlayerStats());

    await LeaderboardRepository.updatePlayersStats(playersToAdd);
    const allPlayers = await LeaderboardRepository.getAllPlayersStats();

    expect(allPlayers).toHaveLength(10);
    for (let i = 0; i < 10 - 1; i++) {
      expect(allPlayers[i].mmr).toBeGreaterThan(allPlayers[i + 1].mmr);
    }
  });

  it("can add a player's stats and get the top 5 players based on MMR", async () => {
    const playersToAdd = Array.from({ length: 10 }, () => makePlayerStats());

    await LeaderboardRepository.updatePlayersStats(playersToAdd);
    const allPlayers = await LeaderboardRepository.getTopNPlayersStats(5);

    expect(allPlayers).toHaveLength(5);
    for (let i = 0; i < 5 - 1; i++) {
      expect(allPlayers[i].mmr).toBeGreaterThan(allPlayers[i + 1].mmr);
    }
  });

  it("update a player's stats if they're already on the leaderboard", async () => {
    const playersToAdd = Array.from({ length: 10 }, () => makePlayerStats());
    await LeaderboardRepository.updatePlayersStats(playersToAdd);

    const allPlayersBefore = await LeaderboardRepository.getAllPlayersStats();
    expect(allPlayersBefore).toHaveLength(10);

    const playerUpdates = playersToAdd.map((p) => {
      return makePlayerStats(undefined, { id: p.id, name: p.name });
    });

    await LeaderboardRepository.updatePlayersStats(playerUpdates);

    const allPlayersAfter = await LeaderboardRepository.getAllPlayersStats();
    expect(allPlayersAfter).toHaveLength(10);

    allPlayersAfter.forEach((actual) => {
      const expected = playerUpdates.find((p) => p.id === actual.id);

      expect(actual).not.toBeNull();
      expect(actual.id).toBe(expected!.id);
      expect(actual.losses).toBe(expected!.losses);
      expect(actual.matchesPlayed).toBe(expected!.matchesPlayed);
      expect(actual.mmr).toBe(expected!.mmr);
      expect(actual.name).toBe(expected!.name);
      // formulas are fixed to one decimal place in NotionHelper so need to replicate here for equality
      expect(actual.winPerc).toBe(+expected!.winPerc.toFixed(2));
      expect(actual.wins).toBe(expected!.wins);
    });
  });
});

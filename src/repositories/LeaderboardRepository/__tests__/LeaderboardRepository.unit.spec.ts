import { PropertyValueMap } from "@notionhq/client/build/src/api-endpoints";
import { Page } from "@notionhq/client/build/src/api-types";
import * as faker from "faker";
import { mocked } from "ts-jest/utils";
import { BallChaserBuilder } from "../../../../.jest/Builder";
import { BallChaser } from "../../../types/common";
import NotionClient from "../../helpers/NotionClient";
import NotionElementHelper from "../../helpers/NotionElementHelper";
import { LeaderboardRepository as LeaderboardRepositoryClass } from "../LeaderboardRepository";
import { LeaderboardPageResponseProperties, PlayerStats } from "../types";

jest.mock("../../helpers/NotionClient");

let LeaderboardRepository: LeaderboardRepositoryClass;

beforeEach(async () => {
  jest.clearAllMocks();
  process.env.notion_leaderboard_id = faker.datatype.uuid();

  // have to wait to import the repo until after the test environment variable is set
  const ImportedRepo = await import("../LeaderboardRepository");
  LeaderboardRepository = ImportedRepo.default; // <- get the default export from the imported file
});

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

function makeProps(playerStats: PlayerStats = makePlayerStats()): LeaderboardPageResponseProperties {
  return {
    ID: NotionElementHelper.notionTextElementFromText(playerStats.id),
    Losses: NotionElementHelper.notionNumberElementFromNumber(playerStats.losses),
    MMR: NotionElementHelper.notionNumberElementFromNumber(playerStats.mmr),
    Name: NotionElementHelper.notionTextElementFromText(playerStats.name),
    Wins: NotionElementHelper.notionNumberElementFromNumber(playerStats.wins),
    MatchesPlayed: NotionElementHelper.notionFormulaElementFromNumber(playerStats.matchesPlayed),
    WinPerc: NotionElementHelper.notionFormulaElementFromNumber(playerStats.winPerc),
  };
}

function makePage(leaderboardProps: LeaderboardPageResponseProperties = makeProps()): Page {
  return {
    archived: false,
    cover: null,
    created_time: "",
    icon: null,
    id: faker.datatype.uuid(),
    last_edited_time: "",
    object: "page",
    parent: {
      database_id: process.env.notion_leaderboard_id ?? "",
      type: "database_id",
    },
    properties: leaderboardProps as unknown as PropertyValueMap,
    url: "",
  };
}

const validatePlayerStats = (expected: PlayerStats, actual: PlayerStats | null) => {
  expect(actual).not.toBeNull();
  expect(actual!.id).toBe(expected.id);
  expect(actual!.losses).toBe(expected.losses);
  expect(actual!.matchesPlayed).toBe(expected.matchesPlayed);
  expect(actual!.mmr).toBe(expected.mmr);
  expect(actual!.name).toBe(expected.name);
  // formulas are fixed to one decimal place in NotionHelper so need to replicate here for equality
  expect(actual!.winPerc).toBe(+expected.winPerc.toFixed(1));
  expect(actual!.wins).toBe(expected.wins);
};

describe("LeaderboardRepository tests", () => {
  it("gets player's stats", async () => {
    const mockPlayerStats = makePlayerStats();
    const mockProps = makeProps(mockPlayerStats);
    const mockPage = makePage(mockProps);
    mocked(NotionClient.prototype.getById).mockResolvedValue(mockPage);

    const result = await LeaderboardRepository.getPlayerStats(mockPlayerStats.id);

    validatePlayerStats(mockPlayerStats, result);
  });

  it("returns null when looking for player that does not exist", async () => {
    mocked(NotionClient.prototype.getById).mockResolvedValue(null);
    const result = await LeaderboardRepository.getPlayerStats(faker.datatype.uuid());
    expect(result).toBeNull();
  });

  it("updates player stats when the player exists", async () => {
    const mockPlayerStats = makePlayerStats();
    const mockProps = makeProps(mockPlayerStats);
    const mockPage = makePage(mockProps);

    const mockPlayerUpdates = makePlayerStats(undefined, { id: mockPlayerStats.id, name: mockPlayerStats.name });

    mocked(NotionClient.prototype.getById).mockResolvedValue(mockPage);
    const mockUpdate = mocked(NotionClient.prototype.update);
    const mockInsert = mocked(NotionClient.prototype.insert);

    await LeaderboardRepository.updatePlayersStats([mockPlayerUpdates]);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockInsert).not.toHaveBeenCalled();

    const mockUpdateProps = makeProps(mockPlayerUpdates);
    const modifiedUpdateProps = {
      ID: mockUpdateProps.ID,
      Losses: mockUpdateProps.Losses,
      MMR: mockUpdateProps.MMR,
      Name: mockUpdateProps.Name,
      Wins: mockUpdateProps.Wins,
    };
    expect(mockUpdate).toHaveBeenLastCalledWith(mockPage.id, modifiedUpdateProps);
  });

  it("adds a player's stats when the player does not already exist", async () => {
    const mockPlayerStats = makePlayerStats();
    const mockPlayerUpdates = makePlayerStats(undefined, { id: mockPlayerStats.id, name: mockPlayerStats.name });

    mocked(NotionClient.prototype.getById).mockResolvedValue(null);
    const mockInsert = mocked(NotionClient.prototype.insert);
    const mockUpdate = mocked(NotionClient.prototype.update);

    await LeaderboardRepository.updatePlayersStats([mockPlayerUpdates]);

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();

    const mockUpdateProps = makeProps(mockPlayerUpdates);
    const modifiedUpdateProps = {
      ID: mockUpdateProps.ID,
      Losses: mockUpdateProps.Losses,
      MMR: mockUpdateProps.MMR,
      Name: mockUpdateProps.Name,
      Wins: mockUpdateProps.Wins,
    };
    expect(mockInsert).toHaveBeenLastCalledWith(modifiedUpdateProps);
  });
});

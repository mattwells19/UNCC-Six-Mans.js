import { PropertyValueMap } from "@notionhq/client/build/src/api-endpoints";
import { Page } from "@notionhq/client/build/src/api-types";
import * as faker from "faker";
import { mocked } from "ts-jest/utils";
import { BallChaserBuilder } from "../../../../.jest/Builder";
import { BallChaser } from "../../../types/common";
import NotionClient from "../../helpers/NotionClient";
import NotionElementHelper from "../../helpers/NotionElementHelper";
import LeaderboardRepository from "../LeaderboardRepository";
import { LeaderboardPageResponseProperties, PlayerStats } from "../types";

beforeEach(async () => {
  jest.clearAllMocks();
});

const validatePlayerStats = (expected: PlayerStats, actual: PlayerStats | null) => {
  expect(actual).not.toBeNull();
  expect(actual!.id).toBe(expected.id);
  expect(actual!.losses).toBe(expected.losses);
  expect(actual!.matchesPlayed).toBe(expected.matchesPlayed);
  expect(actual!.mmr).toBe(expected.mmr);
  expect(actual!.name).toBe(expected.name);
  // formulas are fixed to one decimal place in NotionHelper so need to replicate here for equality
  expect(actual!.winPerc).toBe(+expected.winPerc.toFixed(2));
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

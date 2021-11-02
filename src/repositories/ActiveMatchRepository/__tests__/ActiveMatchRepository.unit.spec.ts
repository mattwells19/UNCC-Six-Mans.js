import * as faker from "faker";
import { mocked } from "ts-jest/utils";
import NotionClient from "../../helpers/NotionClient";
import NotionElementHelper from "../../helpers/NotionElementHelper";
import { BallChaserBuilder } from "../../../../.jest/Builder";
import { ActiveMatchRepository as ActiveMatchRepositoryClass } from "../ActiveMatchRepository";
import { ActiveMatchPageProperties, PlayerInActiveMatch } from "../types";
import { BallChaser, Team } from "../../../types/common";
import { Page } from "@notionhq/client/build/src/api-types";
import { PropertyValueMap } from "@notionhq/client/build/src/api-endpoints";

jest.mock("../../helpers/NotionClient");

let ActiveMatchRepository: ActiveMatchRepositoryClass;

beforeEach(async () => {
  jest.clearAllMocks();
  process.env.notion_active_match_id = faker.datatype.uuid();

  // have to wait to import the repo until after the test environment variable is set
  const ImportedRepo = await import("../ActiveMatchRepository");
  ActiveMatchRepository = ImportedRepo.default; // <- get the default export from the imported file
});

function makePlayer(
  ballChaser: BallChaser = BallChaserBuilder.single(),
  overrides?: Partial<PlayerInActiveMatch>
): PlayerInActiveMatch {
  return {
    id: ballChaser.id,
    matchId: faker.datatype.uuid(),
    reported: null,
    team: ballChaser.team ?? Team.Blue,
    ...overrides,
  };
}

function makeProps(playerInActiveMatch: PlayerInActiveMatch = makePlayer()): ActiveMatchPageProperties {
  return {
    ID: NotionElementHelper.notionTextElementFromText(playerInActiveMatch.id),
    MatchID: NotionElementHelper.notionTextElementFromText(playerInActiveMatch.matchId),
    Reported: NotionElementHelper.notionSelectElementFromValue<Team>(playerInActiveMatch.reported),
    Team: NotionElementHelper.notionSelectElementFromValue<Team>(playerInActiveMatch.team),
  };
}

function makePage(activeMatchProps: ActiveMatchPageProperties = makeProps()): Page {
  return {
    archived: false,
    cover: null,
    created_time: "",
    icon: null,
    id: faker.datatype.uuid(),
    last_edited_time: "",
    object: "page",
    parent: {
      database_id: process.env.notion_active_match_id ?? "",
      type: "database_id",
    },
    properties: activeMatchProps as unknown as PropertyValueMap,
    url: "",
  };
}

describe("ActiveMatchRepository Tests", () => {
  describe("Happy path tests", () => {
    it("can add an active match", async () => {
      const mockInsert = mocked(NotionClient.prototype.insert);

      const mockBallChasers = BallChaserBuilder.many(6);
      await ActiveMatchRepository.addActiveMatch(mockBallChasers);

      expect(mockInsert).toHaveBeenCalledTimes(6);
      mockBallChasers.forEach((mockBallChaser) => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            ID: NotionElementHelper.notionTextElementFromText(mockBallChaser.id),
          })
        );
      });
    });

    it("can remove all players in a match", async () => {
      const mockPlayer = BallChaserBuilder.single();
      const mockProps = makeProps();
      const mockPage = makePage(mockProps);
      mocked(NotionClient.prototype.getById).mockResolvedValue(mockPage);

      const mockFindAllAndRemove = mocked(NotionClient.prototype.findAllAndRemove);

      await ActiveMatchRepository.removeAllPlayersInActiveMatch(mockPlayer.id);

      expect(mockFindAllAndRemove).toHaveBeenCalledTimes(1);
      expect(mockFindAllAndRemove).toHaveBeenLastCalledWith({
        filter: {
          property: "MatchID",
          text: {
            equals: NotionElementHelper.textFromNotionTextElement(mockProps.MatchID),
          },
        },
      });
    });

    it("does nothing when trying to remove a player not in an active match", async () => {
      mocked(NotionClient.prototype.getById).mockResolvedValue(null);
      await expect(
        ActiveMatchRepository.removeAllPlayersInActiveMatch(BallChaserBuilder.single().id)
      ).resolves.not.toThrowError();
    });

    it("retreives all players part of an active match", async () => {
      const mockBallChasers = BallChaserBuilder.many(6);
      const mockMatchId = faker.datatype.uuid();

      const mockPlayers = mockBallChasers.map((mockBallChaser) => makePlayer(mockBallChaser, { matchId: mockMatchId }));
      const mockProps = mockPlayers.map((mockPlayer) => makeProps(mockPlayer));
      const mockPages = mockProps.map((mockProp) => makePage(mockProp));

      mocked(NotionClient.prototype.getAll).mockResolvedValue(mockPages);

      const oneOfThePlayers = faker.random.arrayElement(mockPlayers);
      const allPlayersInActiveMatch = await ActiveMatchRepository.getAllPlayersInActiveMatch(oneOfThePlayers.id);

      allPlayersInActiveMatch.forEach((player) => {
        const expectedPlayer = mockPlayers.find((p) => p.id === player.id);
        expect(expectedPlayer).not.toBeNull();
        expect(player.matchId).toBe(mockMatchId);
        expect(player.reported).toBe(expectedPlayer?.reported);
        expect(player.team).toBe(expectedPlayer?.team);
      });
    });

    it("returns an empty array when trying to retreive a player not in an active match", async () => {
      mocked(NotionClient.prototype.getById).mockResolvedValue(null);
      const allPlayers = await ActiveMatchRepository.getAllPlayersInActiveMatch(BallChaserBuilder.single().id);
      expect(allPlayers).toHaveLength(0);
    });

    it("updates player in active match correctly", async () => {
      const mockBallChasers = BallChaserBuilder.many(6);
      const mockMatchId = faker.datatype.uuid();

      const mockPlayers = mockBallChasers.map((mockBallChaser) => makePlayer(mockBallChaser, { matchId: mockMatchId }));
      const mockProps = mockPlayers.map((mockPlayer) => makeProps(mockPlayer));
      const mockPages = mockProps.map((mockProp) => makePage(mockProp));

      const oneOfThePlayersPage = faker.random.arrayElement(mockPages);
      mocked(NotionClient.prototype.getById).mockResolvedValue(oneOfThePlayersPage);
      mocked(NotionClient.prototype.getAll).mockResolvedValue(mockPages);
      const mockUpdate = mocked(NotionClient.prototype.update);

      const reportedTeam = faker.random.arrayElement([Team.Orange, Team.Blue]);
      const oneOfThePlayersPageIndex = mockPages.findIndex((mockPage) => mockPage.id === oneOfThePlayersPage.id);

      await ActiveMatchRepository.updatePlayerInActiveMatch(mockPlayers[oneOfThePlayersPageIndex].id, {
        reported: reportedTeam,
      });

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenLastCalledWith(
        oneOfThePlayersPage.id,
        expect.objectContaining({
          Reported: NotionElementHelper.notionSelectElementFromValue<Team>(reportedTeam),
        })
      );
    });
  });

  describe("Exception handling tests", () => {
    it("throws if trying to add a ballchaser to an active match with no team", async () => {
      await expect(
        ActiveMatchRepository.addActiveMatch([BallChaserBuilder.single({ team: null })])
      ).rejects.toThrowError();
    });

    it("throws when trying to update a player not in an active match", async () => {
      mocked(NotionClient.prototype.getById).mockResolvedValue(null);
      await expect(
        ActiveMatchRepository.updatePlayerInActiveMatch(BallChaserBuilder.single().id, {})
      ).rejects.toThrowError();
    });
  });
});

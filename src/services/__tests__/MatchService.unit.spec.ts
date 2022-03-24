import { ActiveMatchBuilder, BallChaserQueueBuilder } from "../../../.jest/Builder";
import { createMatchFromChosenTeams, createRandomMatch } from "../MatchService";
import ActiveMatchRepository from "../../repositories/ActiveMatchRepository";
import QueueRepository from "../../repositories/QueueRepository";
import { Team } from "../../types/common";
import { PlayerInQueue } from "../../repositories/QueueRepository/types";

jest.mock("../../repositories/ActiveMatchRepository");
jest.mock("../../repositories/QueueRepository");
jest.mock("../../utils");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Match Service tests", () => {
  describe("Random button was pressed", () => {
    it("random teams are created", async () => {
      const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null });
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);
      jest
        .mocked(ActiveMatchRepository.getAllPlayersInActiveMatch)
        .mockResolvedValueOnce({ blueTeam: [], orangeTeam: [] });

      const players = await createRandomMatch();

      expect(players.orange.players.filter((player) => player.team === Team.Orange)).toHaveLength(3);
      expect(players.blue.players.filter((player) => player.team === Team.Blue)).toHaveLength(3);
    });
    it("updates queue with update player teams", async () => {
      const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null });
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);
      jest
        .mocked(ActiveMatchRepository.getAllPlayersInActiveMatch)
        .mockResolvedValueOnce({ blueTeam: [], orangeTeam: [] });

      await createRandomMatch();
      const addMatchMock = jest.mocked(ActiveMatchRepository.addActiveMatch);
      const removePlayersMock = jest.mocked(QueueRepository.removeAllBallChasersFromQueue);

      expect(removePlayersMock).toHaveBeenCalled();
      expect(addMatchMock).toHaveBeenCalled();
    });
  });
  describe("Captains button was pressed", () => {
    it("last available queueMember is placed on blue team", async () => {
      const mockOrangeBallChasers = BallChaserQueueBuilder.many(3, { team: Team.Orange });
      const mockBlueBallChasers = BallChaserQueueBuilder.many(2, { team: Team.Blue });
      const mockBallChaserNoTeam = BallChaserQueueBuilder.single({ team: null, isCap: false });
      const mockBallChasers: PlayerInQueue[] = [...mockOrangeBallChasers, ...mockBlueBallChasers, mockBallChaserNoTeam];

      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);
      jest
        .mocked(ActiveMatchRepository.getAllPlayersInActiveMatch)
        .mockResolvedValueOnce({ blueTeam: [], orangeTeam: [] });

      const players = await createMatchFromChosenTeams();
      const removePlayersMock = jest.mocked(QueueRepository.removeAllBallChasersFromQueue);
      const addMatchMock = jest.mocked(ActiveMatchRepository.addActiveMatch);

      expect(removePlayersMock).toHaveBeenCalled();
      expect(addMatchMock).toHaveBeenCalled();
      expect(players.orange.players.filter((player) => player.team === Team.Orange)).toHaveLength(3);
      expect(players.blue.players.filter((player) => player.team === Team.Blue)).toHaveLength(3);
    });
  });
});

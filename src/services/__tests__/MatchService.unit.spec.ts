import { BallChaserQueueBuilder } from "../../../.jest/Builder";
import { createMatchFromChosenTeams, createRandomMatch } from "../MatchService";
import ActiveMatchRepository from "../../repositories/ActiveMatchRepository";
import QueueRepository from "../../repositories/QueueRepository";
import { Team } from "../../types/common";
import { PlayerInQueue } from "../../repositories/QueueRepository/types";

jest.mock("../../repositories/ActiveMatchRepository");
jest.mock("../../repositories/QueueRepository");
jest.mock("../../utils/getEnvVariable");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Match Service tests", () => {
  describe("Random button was pressed", () => {
    it("random teams are created", async () => {
      const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null });
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);

      const players = await createRandomMatch();

      expect(players.filter((player) => player.team === Team.Orange)).toHaveLength(3);
      expect(players.filter((player) => player.team === Team.Blue)).toHaveLength(3);
    });
    it("updates queue with update player teams", async () => {
      const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null });
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);

      await createRandomMatch();
      const addMatchMock = jest.mocked(ActiveMatchRepository.addActiveMatch);

      expect(addMatchMock).toHaveBeenCalled();
    });
    it("removes players from queue", async () => {
      const mockBallChasers = BallChaserQueueBuilder.many(6);
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);

      await createRandomMatch();
      const removePlayersMock = jest.mocked(QueueRepository.removeAllBallChasersFromQueue);

      expect(removePlayersMock).toHaveBeenCalled();
    });
  });
  describe("Captains button was pressed", () => {
    it("last available queueMember is placed on blue team", async () => {
      const mockBallChasers: PlayerInQueue[] = [];
      const mockOrangeBallChasers = BallChaserQueueBuilder.many(3, { team: Team.Orange });
      const mockBlueBallChasers = BallChaserQueueBuilder.many(2, { team: Team.Blue });
      const mockBallChaserNoTeam = BallChaserQueueBuilder.single({ team: null, isCap: false });
      mockBallChasers.push(mockBallChaserNoTeam);
      mockOrangeBallChasers.forEach((p) => {
        mockBallChasers.push(p);
      });
      mockBlueBallChasers.forEach((p) => {
        mockBallChasers.push(p);
      });

      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);

      const players = await createMatchFromChosenTeams();

      expect(players.filter((player) => player.team === Team.Orange)).toHaveLength(3);
      expect(players.filter((player) => player.team === Team.Blue)).toHaveLength(3);
    });
    it("removes players from queue", async () => {
      const mockBallChasers = BallChaserQueueBuilder.many(6);
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);

      await createRandomMatch();
      const removePlayersMock = jest.mocked(QueueRepository.removeAllBallChasersFromQueue);

      expect(removePlayersMock).toHaveBeenCalled();
    });
  });
});

import { BallChaserQueueBuilder } from "../../../.jest/Builder";
import { blueCaptainsChoice, createRandomMatch } from "../MatchService";
import ActiveMatchRepository from "../../repositories/ActiveMatchRepository";
import QueueRepository from "../../repositories/QueueRepository";
import { Team } from "../../types/common";
import faker from "faker";

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
      const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null });
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);

      await createRandomMatch();
      const removePlayersMock = jest.mocked(QueueRepository.removeAllBallChasersFromQueue);

      expect(removePlayersMock).toHaveBeenCalled();
    });
  });
  describe("Captains button was pressed", () => {
    it("captains are set", async () => {
      const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null, isCap: false });
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);
      jest.mocked(QueueRepository.updateBallChaserInQueue({ id: mockBallChasers[0].id, isCap: true, team: Team.Blue }));
      jest.mocked(
        QueueRepository.updateBallChaserInQueue({ id: mockBallChasers[1].id, isCap: true, team: Team.Orange })
      );

      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);
      const players = await blueCaptainsChoice(null);

      expect(players.filter((player) => player.team === Team.Orange)).toHaveLength(1);
      expect(players.filter((player) => player.team === Team.Blue)).toHaveLength(1);
      expect(players.filter((player) => player.isCap)).toHaveLength(2);
    });
    it("blue captains choice is set", async () => {
      const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null });
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);
      jest.mocked(QueueRepository.updateBallChaserInQueue({ id: mockBallChasers[2].id, isCap: true, team: Team.Blue }));
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);
      const players = await blueCaptainsChoice(mockBallChasers[2].id);

      expect(players.filter((player) => player.team === Team.Blue)).toHaveLength(2);
    });
  });
});

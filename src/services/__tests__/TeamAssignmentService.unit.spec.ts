import { bluePlayerChosen, createRandomTeams, orangePlayerChosen, setCaptains } from "../TeamAssignmentService";
import { Team } from "../../types/common";
import { BallChaserQueueBuilder } from "../../../.jest/Builder";
import QueueRepository from "../../repositories/QueueRepository";
import faker from "faker";

jest.mock("../../repositories/QueueRepository");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Team Assignment Service tests", () => {
  describe("create random teams", () => {
    it("splits teams equally in size", () => {
      const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null });
      const sortedBallChasers = createRandomTeams(mockBallChasers);

      expect(sortedBallChasers).toHaveLength(6);
      expect(sortedBallChasers.filter((player) => player.team === Team.Orange)).toHaveLength(3);
      expect(sortedBallChasers.filter((player) => player.team === Team.Blue)).toHaveLength(3);
    });
  });
  describe("captains choose teams", () => {
    it("captains are set", async () => {
      const mockBallChasers = BallChaserQueueBuilder.many(6, { isCap: false });

      await setCaptains(mockBallChasers);

      expect(QueueRepository.updateBallChaserInQueue).toBeCalledTimes(2);
      expect(QueueRepository.updateBallChaserInQueue).toBeCalledWith(
        expect.objectContaining({
          id: mockBallChasers[0].id,
          isCap: true,
          team: Team.Orange,
        })
      );
      expect(QueueRepository.updateBallChaserInQueue).toBeCalledWith(
        expect.objectContaining({
          id: mockBallChasers[1].id,
          isCap: true,
          team: Team.Blue,
        })
      );
    });
    it("blue player is set after being chosen", async () => {
      const playerId = faker.datatype.uuid();
      await bluePlayerChosen(playerId);

      const mockBallChasers = BallChaserQueueBuilder.many(6);
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);

      expect(QueueRepository.updateBallChaserInQueue).toBeCalledTimes(1);
      expect(QueueRepository.updateBallChaserInQueue).toBeCalledWith(
        expect.objectContaining({
          id: playerId,
          team: Team.Blue,
        })
      );
      expect(QueueRepository.getAllBallChasersInQueue).toBeCalled();
    });
    it("orange player is set after being chosen", async () => {
      const playerIds = [faker.datatype.uuid(), faker.datatype.uuid()];
      await orangePlayerChosen(playerIds);

      expect(QueueRepository.updateBallChaserInQueue).toBeCalledTimes(2);
      expect(QueueRepository.updateBallChaserInQueue).toBeCalledWith(
        expect.objectContaining({
          id: playerIds[0],
          team: Team.Orange,
        })
      );
      expect(QueueRepository.updateBallChaserInQueue).toBeCalledWith(
        expect.objectContaining({
          id: playerIds[1],
          team: Team.Orange,
        })
      );
    });
  });
});

import QueueRepository from "../../repositories/QueueRepository";
import LeaderboardRepository from "../../repositories/LeaderboardRepository";
import { mocked } from "ts-jest/utils";

jest.mock("../../repositories/QueueRepository");
jest.mock("../../repositories/LeaderboardRepository");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("QueueService tests", () => {
  describe("Joining queue", () => {
    describe("Not already in queue", () => {
      beforeEach(() => {
        mocked(QueueRepository.getBallChaserInQueue).mockResolvedValue(null);
      });

      it.todo("Not on leaderboard | joins queue with 100 MMR and queue time 1 hour from now");
      it.todo("On leaderboard | joins queue with Leaderboard MMR and queue time 1 hour from now");
    });

    it.todo("Already in the queue | updates queue time to 1 hour from now");
  });

  describe("Leaving queue", () => {
    it.todo("removes player from queue when they exist");
    it.todo("does nothing if player is not in queue");
  });
});

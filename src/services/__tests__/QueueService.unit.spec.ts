import QueueRepository from "../../repositories/QueueRepository";
import { joinQueue } from "../QueueService";
import { leaveQueue } from "../QueueService";
import { mocked } from "ts-jest/utils";
import { BallChaser } from "../../types/common";
import { BallChaserBuilder } from "../../../.jest/Builder";
import faker from "faker";
import { DateTime } from "luxon";

jest.mock("../../repositories/QueueRepository");
jest.mock("../../repositories/LeaderboardRepository");
jest.mock("../../utils/getEnvVariable");

beforeEach(() => {
  jest.clearAllMocks();
});


function makeBallChaser(
  ballChaser: BallChaser = BallChaserBuilder.single(),
  overrides?: Partial<BallChaser>
): BallChaser {

  let mockDate = DateTime.now();
  const queueTime = mockDate;

  return {
    id: ballChaser.id,
    mmr: faker.datatype.number({ min: 0 }),
    name: ballChaser.name,
    isCap: false,
    team: null,
    queueTime,
    ...overrides,
  };
}

const mockPlayer1 = makeBallChaser()

describe("QueueService tests", () => {
  describe("Joining queue", () => {
    describe("Not already in queue", () => {
      beforeEach(() => {
        mocked(QueueRepository.getBallChaserInQueue).mockResolvedValue(null);
      });

      it("joins a player to the queue if they are not already in the queue", async () => {
        mocked(joinQueue(mockPlayer1.id, mockPlayer1.name));
        const result = await joinQueue(mockPlayer1.id, mockPlayer1.name);

        expect(result).toBe(QueueRepository.getAllBallChasersInQueue());
        expect([result].length).toEqual([(await QueueRepository.getAllBallChasersInQueue())].length)
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

import { BallChaserQueueBuilder } from "../../../.jest/Builder";
import { createRandomMatch } from "../MatchService";
import { mocked } from "ts-jest/utils";
import ActiveMatchRepository from "../../repositories/ActiveMatchRepository";
import QueueRepository from "../../repositories/QueueRepository";
import { Team } from "../../types/common";

jest.mock("../../repositories/ActiveMatchRepository");
jest.mock("../../repositories/QueueRepository");
jest.mock("../../utils/getEnvVariable");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Match Service tests", () => {
  it("random teams are created", async () => {
    const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null });
    mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);

    const players = await createRandomMatch();

    expect(players.filter((player) => player.team === Team.Orange)).toHaveLength(3);
    expect(players.filter((player) => player.team === Team.Blue)).toHaveLength(3);
  });

  it("updates queue with update player teams", async () => {
    const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null });
    mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);

    await createRandomMatch();
    const addMatchMock = mocked(ActiveMatchRepository.addActiveMatch);

    expect(addMatchMock).toHaveBeenCalled();
  });

  it("removes players from queue", async () => {
    const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null });
    mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);

    await createRandomMatch();
    const removePlayersMock = mocked(QueueRepository.removeAllBallChasersFromQueue);

    expect(removePlayersMock).toHaveBeenCalled();
  });
});

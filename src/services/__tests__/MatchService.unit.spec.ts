import { BallChaserQueueBuilder } from "../../../.jest/Builder";
import { createRandomMatch } from "../MatchService";
import { mocked } from "ts-jest/utils";
import ActiveMatchRepository from "../../repositories/ActiveMatchRepository";
import QueueRepository from "../../repositories/QueueRepository";
import { Team } from "../../types/common";
import { NewActiveMatchInput, PlayerInActiveMatch } from "../../repositories/ActiveMatchRepository/types";
import { PlayerInQueue } from "../../repositories/QueueRepository/types";
import { createRandomTeams } from "../TeamAssignmentService";

jest.mock("../../repositories/ActiveMatchRepository");
jest.mock("../../repositories/QueueRepository");
jest.mock("../../utils/getEnvVariable");

beforeEach(async () => {
  jest.clearAllMocks();
});

describe("Match Service tests", () => {
  it("random teams are created", async () => {
    const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null });
    mocked(QueueRepository.getAllBallChasersInQueue).mockImplementationOnce(() =>
      Promise.resolve(mockBallChasers as Readonly<PlayerInQueue[]>)
    );

    let players = await createRandomMatch();

    mocked(ActiveMatchRepository.addActiveMatch);
    expect(players.filter((player) => player.team === Team.Orange)).toHaveLength(3);
    expect(players.filter((player) => player.team === Team.Blue)).toHaveLength(3);
  });

  it("updates queue with update player teams", async () => {
    const mockBallChasers = BallChaserQueueBuilder.many(6);
    mockBallChasers.forEach((player) => (player.team = null));
    mocked(QueueRepository.getAllBallChasersInQueue).mockImplementationOnce(() =>
      Promise.resolve(mockBallChasers as Readonly<PlayerInQueue[]>)
    );

    await createRandomMatch();
    const addMatchMock = mocked(ActiveMatchRepository.addActiveMatch);

    expect(addMatchMock).toHaveBeenCalled();
  });

  it("removes players from queue", async () => {
    const mockBallChasers = BallChaserQueueBuilder.many(6);
    mockBallChasers.forEach((player) => (player.team = null));
    mocked(QueueRepository.getAllBallChasersInQueue).mockImplementationOnce(() =>
      Promise.resolve(mockBallChasers as Readonly<PlayerInQueue[]>)
    );

    await createRandomMatch();
    const removePlayersMock = mocked(QueueRepository.removeAllBallChasersFromQueue);

    expect(removePlayersMock).toHaveBeenCalled();
  });
});

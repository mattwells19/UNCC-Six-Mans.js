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

describe("Match Service tests", () => {
  const mockBallChasers = BallChaserQueueBuilder.many(6);
  mockBallChasers.forEach((player) => (player.team = null));
  const addMatchMock = mocked(ActiveMatchRepository.addActiveMatch);
  mocked(QueueRepository.getAllBallChasersInQueue).mockImplementationOnce(() =>
    Promise.resolve(mockBallChasers as Readonly<PlayerInQueue[]>)
  );
  let players: readonly PlayerInActiveMatch[];

  beforeAll(async () => {
    players = await createRandomMatch();
  });

  it("random teams are created", async () => {
    expect(players.filter((player) => player.team === Team.Orange)).toHaveLength(3);
    expect(players.filter((player) => player.team === Team.Blue)).toHaveLength(3);
  });

  it("updates queue with update player teams", async () => {
    let newTeams = await createRandomTeams(mockBallChasers);

    expect(addMatchMock).toHaveBeenCalled();
    expect(addMatchMock).toHaveBeenCalledWith(newTeams);
  });
});

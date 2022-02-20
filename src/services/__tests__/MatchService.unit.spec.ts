import { BallChaserQueueBuilder } from "../../../.jest/Builder";
import { createRandomMatch } from "../MatchService";
import { mocked } from "ts-jest/utils";
import ActiveMatchRepository from "../../repositories/ActiveMatchRepository";
import { Team } from "../../types/common";
import { NewActiveMatchInput } from "../../repositories/ActiveMatchRepository/types";

jest.mock("../../repositories/ActiveMatchRepository");
jest.mock("../../utils/getEnvVariable");

describe("Match Service tests", () => { 
  const mockBallChasers = BallChaserQueueBuilder.many(6);
  mockBallChasers.forEach((player) => player.team = null);
  const addMatchMock = mocked(ActiveMatchRepository.addActiveMatch);

  it("random teams are created", async () => {
    await createRandomMatch(mockBallChasers);
    expect(mockBallChasers.filter((player) => player.team == Team.Orange)).toHaveLength(3);
  });

  it("updates queue with update player teams", async () => {
    const activeMatch: Array<NewActiveMatchInput> = [];
    mockBallChasers.forEach((player) => {
      if(player.team != null){
        activeMatch.push({id: player.id, team: player.team});
      }
    });
    expect(addMatchMock).toHaveBeenCalled();
    expect(addMatchMock).toHaveBeenCalledWith(activeMatch);
  });
});
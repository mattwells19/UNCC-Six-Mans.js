import faker from "faker";
import { BallChaserQueueBuilder } from "../../../../.jest/Builder";
import { ActiveMatchCreated } from "../../../services/MatchService";
import MessageBuilder from "../MessageBuilder";
import { PlayerInActiveMatch } from "../../../repositories/ActiveMatchRepository/types";
import { Team } from "../../../types/common";

jest.mock("../../utils");

describe("Building Buttons", () => {
  const mockBallChasers = BallChaserQueueBuilder.many(6);
  const mockMatchId = faker.datatype.uuid();

  it("return queue buttons", () => {
    const result = MessageBuilder.queueMessage(mockBallChasers);
    expect(result).toMatchSnapshot();
  });
  it("return full queue buttons", () => {
    const result = MessageBuilder.fullQueueMessage(mockBallChasers);
    expect(result).toMatchSnapshot();
  });
  it("return break match buttons", () => {
    const result = MessageBuilder.captainChooseMessage(true, mockBallChasers);
    expect(result).toMatchSnapshot();
  });
  it("return active match buttons", async () => {
    const orangePlayer: PlayerInActiveMatch = {
      id: mockBallChasers[0].id,
      team: Team.Orange,
      reportedTeam: null,
      matchId: mockMatchId,
      mmr: 100,
    };

    const bluePlayer: PlayerInActiveMatch = {
      id: mockBallChasers[1].id,
      team: Team.Blue,
      reportedTeam: null,
      matchId: mockMatchId,
      mmr: 100,
    };

    const activeMatch: ActiveMatchCreated = {
      blue: {
        mmrStake: 100,
        players: [bluePlayer],
        winProbability: 50,
      },
      orange: {
        mmrStake: 100,
        players: [orangePlayer],
        winProbability: 50,
      },
    };

    const result = MessageBuilder.activeMatchMessage(activeMatch);
    expect(result).toMatchSnapshot();
  });
});

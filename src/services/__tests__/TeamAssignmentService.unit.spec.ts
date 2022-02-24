import { createRandomTeams } from "../TeamAssignmentService";
import { Team } from "../../types/common";
import { BallChaserQueueBuilder } from "../../../.jest/Builder";

const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null });

//Remove team values and mmr as they will be set below.
mockBallChasers.forEach((player) => (player.team = null));

describe("Team Assignment Service tests", () => {
  it("splits teams equally in size", async () => {
    const sortedBallChasers = await createRandomTeams(mockBallChasers);

    expect(sortedBallChasers).toHaveLength(6);
    expect(sortedBallChasers.filter((player) => player.team == Team.Orange)).toHaveLength(3);
    expect(sortedBallChasers.filter((player) => player.team == Team.Blue)).toHaveLength(3);
  });
});

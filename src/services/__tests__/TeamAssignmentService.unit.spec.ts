import { BallChaserBuilder } from "../../../.jest/Builder";
import { createRandomTeams } from "../TeamAssignmentService";
import { Team } from "../../types/common";

const mockBallChasers = BallChaserBuilder.many(6);
//Remove team values as they will be set below.
mockBallChasers.forEach((player) => player.team = null);

describe("Team Assignment Service tests", () => {
  it("splits teams equally", async () => {
    const sortedBallChasers = await createRandomTeams(mockBallChasers);

    expect(sortedBallChasers).toHaveLength(6);
    expect(sortedBallChasers.filter((player) => player.team == Team.Orange)).toHaveLength(3);
    expect(sortedBallChasers.filter((player) => player.team == Team.Blue)).toHaveLength(3);
    sortedBallChasers.forEach((player) => {
      expect(player.team).not.toBeNull();
    });
  });
});
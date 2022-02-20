import { createRandomTeams } from "../TeamAssignmentService";
import { Team } from "../../types/common";
import { BallChaserQueueBuilder } from "../../../.jest/Builder";

const mockBallChasers = BallChaserQueueBuilder.many(6);
const mockMMRs = [23,72,117,158,162,219];
//Remove team values and mmr as they will be set below.
mockBallChasers.forEach((player, index) => {
  player.team = null,
  player.mmr = mockMMRs[index]
});



describe("Team Assignment Service tests", () => {
  
  it("splits teams equally in size", async () => {
    const sortedBallChasers = await createRandomTeams(mockBallChasers);
    
    expect(sortedBallChasers).toHaveLength(6);
    expect(sortedBallChasers.filter((player) => player.team == Team.Orange)).toHaveLength(3);
    expect(sortedBallChasers.filter((player) => player.team == Team.Blue)).toHaveLength(3);
    sortedBallChasers.forEach((player) => {
      expect(player.team).not.toBeNull();
    });
  });
});
import { NewActiveMatchInput } from "../repositories/ActiveMatchRepository/types";
import { PlayerInQueue } from "../repositories/QueueRepository/types";
import { Team } from "../types/common";

export async function createRandomTeams(
  ballchasers: ReadonlyArray<PlayerInQueue>
): Promise<Array<NewActiveMatchInput>> {
  const sortedBallChaser = ballchasers
    .map((player) => {
      return player;
    })
    .sort((o, b) => o.mmr - b.mmr);

  const blueTeam: number[] = [];
  const orangeTeam: number[] = [];
  const activeMatch: NewActiveMatchInput[] = [];

  //This splits the teams with the minimal difference in the sum of MMR.
  //This actually splits the ball chasers into two arrays that aren't
  //neccessarily even arrays.  So the If statements that say .lenght /2
  //is ensuring that there aren't 4 players on one team and two on the other.
  sortedBallChaser.forEach((p) => {
    if (blueTeam.reduce((sum, current) => sum + current, 0) > orangeTeam.reduce((sum, current) => sum + current, 0)) {
      if (orangeTeam.length < sortedBallChaser.length / 2) {
        orangeTeam.push(p.mmr);
        activeMatch.push({ id: p.id, team: Team.Orange });
      } else {
        blueTeam.push(p.mmr);
        activeMatch.push({ id: p.id, team: Team.Blue });
      }
    } else {
      if (blueTeam.length < sortedBallChaser.length / 2) {
        blueTeam.push(p.mmr);
        activeMatch.push({ id: p.id, team: Team.Blue });
      } else {
        orangeTeam.push(p.mmr);
        activeMatch.push({ id: p.id, team: Team.Orange });
      }
    }
  });

  return activeMatch;
}

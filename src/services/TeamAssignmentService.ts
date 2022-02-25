import { NewActiveMatchInput } from "../repositories/ActiveMatchRepository/types";
import { PlayerInQueue } from "../repositories/QueueRepository/types";
import { Team } from "../types/common";

export async function createRandomTeams(
  ballchasers: ReadonlyArray<PlayerInQueue>
): Promise<Array<NewActiveMatchInput>> {
  const sortedBallChaser = ballchasers.slice().sort((o, b) => o.mmr - b.mmr);

  const activeMatch: NewActiveMatchInput[] = [];
  let orangeTeamMmr = 0;
  let blueTeamMmr = 0;
  let orangeTeamCounter = 0;
  let blueTeamCounter = 0;

  //This splits the teams with the minimal difference in the sum of MMR.
  //This actually splits the ball chasers into two arrays that aren't
  //neccessarily even arrays.  So the If statements that say .lenght /2
  //is ensuring that there aren't 4 players on one team and two on the other.
  sortedBallChaser.forEach((p) => {
    if (blueTeamMmr > orangeTeamMmr) {
      if (orangeTeamCounter < sortedBallChaser.length / 2) {
        orangeTeamMmr += p.mmr;
        activeMatch.push({ id: p.id, team: Team.Orange });
        orangeTeamCounter++;
      } else {
        blueTeamMmr += p.mmr;
        activeMatch.push({ id: p.id, team: Team.Blue });
        blueTeamCounter++;
      }
    } else {
      if (blueTeamCounter < sortedBallChaser.length / 2) {
        blueTeamMmr += p.mmr;
        activeMatch.push({ id: p.id, team: Team.Blue });
        blueTeamCounter++;
      } else {
        orangeTeamMmr += p.mmr;
        activeMatch.push({ id: p.id, team: Team.Orange });
        orangeTeamCounter++;
      }
    }
  });

  return activeMatch;
}

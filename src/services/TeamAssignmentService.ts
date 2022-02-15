import { BallChaser, Team } from "../types/common";

export async function createRandomTeams(ballchasers: BallChaser[]): Promise<BallChaser[]> {
  const sortedBallChaser = ballchasers.sort((o, b) => (o.mmr > b.mmr ? -1 : 1));

  const blueTeam: number[] = [];
  const orangeTeam: number[] = [];

  //This splits the teams with the minimal difference in the sum of MMR.
  //This actually splits the ball chasers into two arrays that aren't
  //neccessarily even arrays.  So the If statements that say .lenght /2
  //is ensuring that there aren't 4 players on one team and two on the other.
  sortedBallChaser.forEach((p) => {
    if (blueTeam.reduce((sum, current) => sum + current, 0) > orangeTeam.reduce((sum, current) => sum + current, 0)) {
      if (orangeTeam.length < sortedBallChaser.length / 2) {
        orangeTeam.push(p.mmr);
        p.team = Team.Orange;
      } else {
        blueTeam.push(p.mmr);
        p.team = Team.Blue;
      }
    } else {
      if (blueTeam.length < sortedBallChaser.length / 2) {
        blueTeam.push(p.mmr);
        p.team = Team.Blue;
      } else {
        orangeTeam.push(p.mmr);
        p.team = Team.Orange;
      }
    }
  });

  return sortedBallChaser;
}
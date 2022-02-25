import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import { PlayerInActiveMatch } from "../repositories/ActiveMatchRepository/types";
import { Team } from "../types/common";

async function organizeTeams(ballChasers: Promise<ReadonlyArray<Readonly<PlayerInActiveMatch>>>) {
  const blueTeam: Readonly<PlayerInActiveMatch>[] = [];
  const orangeTeam: Readonly<PlayerInActiveMatch>[] = [];
  (await ballChasers).forEach((ballChaser) => {
    if (ballChaser.team === Team.Blue) {
      blueTeam.push({
        id: ballChaser.id,
        reportedTeam: ballChaser.reportedTeam,
        matchId: ballChaser.matchId,
        team: ballChaser.team,
      });
    } else {
      orangeTeam.push({
        id: ballChaser.id,
        reportedTeam: ballChaser.reportedTeam,
        matchId: ballChaser.matchId,
        team: ballChaser.team,
      });
    }
  });
  return { blueTeam: blueTeam, orangeTeam: orangeTeam };
}

export async function mmr(activeMatchBallChasers: Promise<ReadonlyArray<Readonly<PlayerInActiveMatch>>>) {
  const blueTeamMMR = 0;
  const orangeTeamMMR = 0;
  const teams = await organizeTeams(activeMatchBallChasers);
  let blueTeam = teams.blueTeam;
  let orangeTeam = teams.orangeTeam;

  blueTeam.forEach((x) => {});
}

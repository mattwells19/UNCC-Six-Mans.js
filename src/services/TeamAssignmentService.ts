import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import { NewActiveMatchInput } from "../repositories/ActiveMatchRepository/types";
import QueueRepository from "../repositories/QueueRepository";
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

export async function setCaptains(ballChasers: ReadonlyArray<PlayerInQueue>): Promise<Array<PlayerInQueue>> {
  const sortedBallChaser = ballChasers.slice().sort((o, b) => o.mmr - b.mmr);

  // 🐧 random thought: what if we allowed the second highest rated player in the queue sorted `sortedBallChaser[1]`
  // 🐧 to pick first? Would that be slightly more balanced?
  await Promise.all([
    await QueueRepository.updateBallChaserInQueue({
      id: sortedBallChaser[0].id,
      isCap: true,
      team: Team.Blue,
    }),
    await QueueRepository.updateBallChaserInQueue({
      id: sortedBallChaser[1].id,
      isCap: true,
      team: Team.Orange,
    }),
  ]);

  return sortedBallChaser;
}

// 🐧 I'd probably add the check to make sure the player was in the queue as part of this function
export async function bluePlayerChosen(chosenPlayer: string): Promise<void> {
  await QueueRepository.updateBallChaserInQueue({
    id: chosenPlayer,
    team: Team.Blue,
  });
}

// 🐧 I'd probably add the check to make sure both players are in the queue as part of this function
export async function orangePlayerChosen(chosenPlayers: string[]): Promise<void> {
  for (const p of chosenPlayers) {
    await QueueRepository.updateBallChaserInQueue({
      id: p,
      team: Team.Orange,
    });
  }
}

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

export async function bluePlayerChosen(chosenPlayer: string): Promise<void> {
  await QueueRepository.updateBallChaserInQueue({
    id: chosenPlayer,
    team: Team.Blue,
  });
}

export async function orangePlayerChosen(chosenPlayers: string[]): Promise<void> {
  for (const p of chosenPlayers) {
    await QueueRepository.updateBallChaserInQueue({
      id: p,
      team: Team.Orange,
    });
  }
}

export async function createMatchFromChosenTeams(): Promise<Array<NewActiveMatchInput>> {
  const createdTeams: NewActiveMatchInput[] = [];

  //Update the last available player to blue and push all players into Active Match
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();
  for (const p of ballchasers) {
    if (p.team !== null) {
      createdTeams.push({ id: p.id, team: p.team });
    } else {
      await QueueRepository.updateBallChaserInQueue({
        id: p.id,
        team: Team.Blue,
      });
      createdTeams.push({ id: p.id, team: Team.Blue });
    }
  }

  await Promise.all([
    //Create Match
    await ActiveMatchRepository.addActiveMatch(createdTeams),
    //Match is created, reset the queue.
    await QueueRepository.removeAllBallChasersFromQueue(),
  ]);

  return createdTeams;
}

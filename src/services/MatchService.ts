import { createRandomTeams } from "../services/TeamAssignmentService";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import QueueRepository from "../repositories/QueueRepository";
import { NewActiveMatchInput } from "../repositories/ActiveMatchRepository/types";
import { Team } from "../types/common";

export async function createRandomMatch(): Promise<Array<NewActiveMatchInput>> {
  const ballChasers = await QueueRepository.getAllBallChasersInQueue();
  //Assign teams based on MMR and
  const createdTeams = await createRandomTeams(ballChasers);

  await Promise.all([
    //Create Match
    await ActiveMatchRepository.addActiveMatch(createdTeams),
    //Match is created, reset the queue.
    await QueueRepository.removeAllBallChasersFromQueue(),
  ]);

  return createdTeams;
}

export async function createMatchFromChosenTeams(): Promise<Array<NewActiveMatchInput>> {
  const createdTeams: NewActiveMatchInput[] = [];

  //Sort the ballchasers so those without a team go at the end of the array for ActiveMatch embed visual fix
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();
  const sortedBallChasers = ballchasers.slice().sort((a, b) => (a.team ?? 100) - (b.team ?? 100));

  //Update the last available player to blue and push all players into Active Match
  for (const p of sortedBallChasers) {
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

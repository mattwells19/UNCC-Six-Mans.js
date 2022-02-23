import { createRandomTeams } from "../services/TeamAssignmentService";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import QueueRepository from "../repositories/QueueRepository";
import { PlayerInActiveMatch } from "../repositories/ActiveMatchRepository/types";

export async function createRandomMatch(): Promise<ReadonlyArray<PlayerInActiveMatch>> {
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

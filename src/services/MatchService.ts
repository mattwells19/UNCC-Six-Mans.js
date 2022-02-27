import {
  bluePlayerChosen,
  createRandomTeams,
  orangePlayerChosen,
  setCaptains,
} from "../services/TeamAssignmentService";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import QueueRepository from "../repositories/QueueRepository";
import { NewActiveMatchInput } from "../repositories/ActiveMatchRepository/types";
import { PlayerInQueue } from "../repositories/QueueRepository/types";

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

export async function blueCaptainsChoice(chosenPlayers: string | null): Promise<ReadonlyArray<PlayerInQueue>> {
  const ballChasers = await QueueRepository.getAllBallChasersInQueue();

  if (!chosenPlayers) {
    await setCaptains(ballChasers);
  } else {
    await bluePlayerChosen(chosenPlayers);
  }

  return await QueueRepository.getAllBallChasersInQueue();
}

export async function orangeCaptainsChoice(chosenPlayers: string[]): Promise<void> {
  await orangePlayerChosen(chosenPlayers);
}

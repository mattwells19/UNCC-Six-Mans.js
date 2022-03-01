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

// 🐧  I think this method is unnecessary. Just call `setCaptains` in Interaction.ts where you know it'll be null
// 🐧 Then just call `bluePlayerChosen` in MenuInteraction.ts where you verify that a player in the queue was chosen
export async function blueCaptainsChoice(chosenPlayers: string | null): Promise<ReadonlyArray<PlayerInQueue>> {
  const ballChasers = await QueueRepository.getAllBallChasersInQueue();

  if (!chosenPlayers) {
    await setCaptains(ballChasers);
  } else {
    await bluePlayerChosen(chosenPlayers);
  }

  return await QueueRepository.getAllBallChasersInQueue();
}

// 🐧 Don't think this method is really necessary. Just call `orangePlayerChosen` in MenuInteraction.ts
export async function orangeCaptainsChoice(chosenPlayers: string[]): Promise<void> {
  await orangePlayerChosen(chosenPlayers);
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

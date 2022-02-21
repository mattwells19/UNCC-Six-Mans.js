import { PlayerInQueue } from "../repositories/QueueRepository/types";
import { createRandomTeams } from "../services/TeamAssignmentService";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";

export async function createRandomMatch(ballChasers: PlayerInQueue[]): Promise<ReadonlyArray<PlayerInQueue>> {
  //Assign teams based on MMR
  const createdTeams = await createRandomTeams(ballChasers);

  //Create Match
  await ActiveMatchRepository.addActiveMatch(createdTeams);

  ballChasers.forEach((player) => {
    createdTeams.filter((p) => {
      if (player.id == p.id) player.team = p.team;
    });
  });

  return ballChasers;
}

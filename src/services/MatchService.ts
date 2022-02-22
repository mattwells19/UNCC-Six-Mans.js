import { createRandomTeams } from "../services/TeamAssignmentService";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import QueueRepository from "../repositories/QueueRepository";
import { PlayerInActiveMatch } from "../repositories/ActiveMatchRepository/types";

export async function createRandomMatch(): Promise<ReadonlyArray<PlayerInActiveMatch>> {
  const ballChasers = await QueueRepository.getAllBallChasersInQueue();

  //Assign teams based on MMR
  const createdTeams = await createRandomTeams(ballChasers);

  const newTeams: PlayerInActiveMatch[] = createdTeams.map((player) => ({
    id: player.id,
    matchId: "",
    reportedTeam: null,
    team: player.team,
  }));

  //Create Match
  await ActiveMatchRepository.addActiveMatch(createdTeams);

  await QueueRepository.removeAllBallChasersFromQueue();

  return newTeams;
}

import { BallChaser } from "../types/common";
import { createRandomTeams } from "../services/TeamAssignmentService";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";

export async function createRandomMatch(ballChasers: BallChaser[]): Promise<void> {
  //Assign teams based on MMR
  const createdTeams = await createRandomTeams(ballChasers);

  //Create Match
  await ActiveMatchRepository.addActiveMatch(createdTeams);
}

import { BallChaser } from "../types/common";
import TeamPicker from "../repositories/helpers/TeamPicker";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import QueueRepository from "../repositories/QueueRepository";

export async function createRandomMatch(ballChasers: BallChaser[]): Promise<void> {
  //Assign teams based on MMR
  const createdTeams = TeamPicker.createRandomTeams(ballChasers);

  await createMatch(createdTeams);
}

async function createMatch(teams: BallChaser[]): Promise<void> {
  //Update all ball players
  await QueueRepository.updateAllBallChasers(teams);

  //Create Match
  await ActiveMatchRepository.addActiveMatch(teams);
}

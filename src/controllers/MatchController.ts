import { BallChaser } from "../types/common";
import TeamPicker from "../repositories/helpers/TeamPicker";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import QueueRepository from "../repositories/QueueRepository";

export async function createMatch(ballChasers: BallChaser[]): Promise<void> {

  //Assign teams based on MMR
  const createdTeams = TeamPicker.createRandomTeams(ballChasers);

  //Update all ball players
  await QueueRepository.updateAllBallChasers(createdTeams);

  //Create Match
  await ActiveMatchRepository.addActiveMatch(createdTeams);

}
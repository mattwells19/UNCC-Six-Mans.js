import { createRandomTeams } from "../services/TeamAssignmentService";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import QueueRepository from "../repositories/QueueRepository";
import { NewActiveMatchInput, PlayerInActiveMatch } from "../repositories/ActiveMatchRepository/types";
import { Team } from "../types/common";
import { calculateMMR, calculateProbability, calculateProbabilityDecimal } from "./MatchReportService";

interface ActiveMatchTeamDetails {
  mmrStake: number;
  players: ReadonlyArray<PlayerInActiveMatch>;
  winProbability: number;
}

export interface ActiveMatchCreated {
  orange: ActiveMatchTeamDetails;
  blue: ActiveMatchTeamDetails;
}

async function buildNewMatchDetails(playerInMatchId: string): Promise<ActiveMatchCreated> {
  const teams = await ActiveMatchRepository.getAllPlayersInActiveMatch(playerInMatchId);
  const { blueProbabilityDecimal, orangeProbabilityDecimal } = calculateProbabilityDecimal(teams);

  return {
    blue: {
      mmrStake: calculateMMR(blueProbabilityDecimal),
      players: teams.blueTeam,
      winProbability: calculateProbability(blueProbabilityDecimal),
    },
    orange: {
      mmrStake: calculateMMR(orangeProbabilityDecimal),
      players: teams.orangeTeam,
      winProbability: calculateProbability(orangeProbabilityDecimal),
    },
  };
}

export async function createRandomMatch(): Promise<ActiveMatchCreated> {
  const ballChasers = await QueueRepository.getAllBallChasersInQueue();
  //Assign teams based on MMR and
  const createdTeams = createRandomTeams(ballChasers);

  await Promise.all([
    //Create Match
    await ActiveMatchRepository.addActiveMatch(createdTeams),
    //Match is created, reset the queue.
    await QueueRepository.removeAllBallChasersFromQueue(),
  ]);

  return await buildNewMatchDetails(createdTeams[0].id);
}

export async function createMatchFromChosenTeams(): Promise<ActiveMatchCreated> {
  const createdTeams: NewActiveMatchInput[] = [];

  //Sort the ballchasers so those without a team go at the end of the array for ActiveMatch embed visual fix
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();
  const sortedBallChasers = ballchasers.slice().sort((a, b) => (a.team ?? 100) - (b.team ?? 100));

  //Update the last available player to blue and push all players into Active Match
  for (const p of sortedBallChasers) {
    if (p.team !== null) {
      createdTeams.push({ id: p.id, team: p.team });
    } else {
      createdTeams.push({ id: p.id, team: Team.Blue });
    }
  }

  await Promise.all([
    //Create Match
    await ActiveMatchRepository.addActiveMatch(createdTeams),
    //Match is created, reset the queue.
    await QueueRepository.removeAllBallChasersFromQueue(),
  ]);

  return await buildNewMatchDetails(createdTeams[0].id);
}

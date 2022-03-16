import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import { ActiveMatchTeams, PlayerInActiveMatch } from "../repositories/ActiveMatchRepository/types";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import { UpdatePlayerStatsInput } from "../repositories/LeaderboardRepository/types";
import { Team } from "../types/common";
import { waitForAllPromises } from "../utils";

async function calculateProbabilityDecimal(playerInMatchId: string, reportedTeam: Team): Promise<number> {
  let reportedWinner = 0;
  let reportedLoser = 0;
  const teams = await ActiveMatchRepository.getAllPlayersInActiveMatch(playerInMatchId);
  const blueTeam = teams.blueTeam;
  const orangeTeam = teams.orangeTeam;

  const blueTeamMMR = blueTeam.reduce((ballchaser1, ballchaser2) => ballchaser1 + ballchaser2.mmr, 0);
  const orangeTeamMMR = orangeTeam.reduce((ballchaser1, ballchaser2) => ballchaser1 + ballchaser2.mmr, 0);

  if (reportedTeam === Team.Blue) {
    reportedWinner = blueTeamMMR;
    reportedLoser = orangeTeamMMR;
  } else {
    reportedWinner = orangeTeamMMR;
    reportedLoser = blueTeamMMR;
  }

  const difference = (reportedLoser - reportedWinner) / 400;
  const power = Math.pow(10, difference) + 1;
  const probabilityDecimal = 1 / power;

  return probabilityDecimal;
}

export async function calculateMMR(playerInMatchId: string, reportedTeam: Team): Promise<number> {
  const probabilityDecimal = await calculateProbabilityDecimal(playerInMatchId, reportedTeam);

  let mmr = (1 - probabilityDecimal) * 20;
  mmr = Math.min(15, mmr);
  mmr = Math.max(5, mmr);

  return Math.round(mmr);
}

export async function calculateProbability(playerInMatchId: string, reportedTeam: Team): Promise<number> {
  const probabilityDecimal = await calculateProbabilityDecimal(playerInMatchId, reportedTeam);
  const probability = probabilityDecimal * 100;

  return Math.round(probability);
}

export async function checkReport(team: Team, playerInMatchId: string): Promise<boolean> {
  const teams = await ActiveMatchRepository.getAllPlayersInActiveMatch(playerInMatchId);
  const reporter = [...teams.blueTeam, ...teams.orangeTeam].find((p) => {
    return p.id === playerInMatchId;
  });

  const reportedPlayer = [...teams.blueTeam, ...teams.orangeTeam].find((p) => {
    return p.reportedTeam !== null;
  });

  if (!reporter) return false;
  if (reportedPlayer?.team === reporter.team && reportedPlayer.reportedTeam === team) {
    return false;
  } else if (reportedPlayer?.reportedTeam !== team || reportedPlayer?.id === reporter.id) {
    await reportMatch(team, reporter, teams);
    return false;
  } else {
    await confirmMatch(team, teams, playerInMatchId);
    return true;
  }
}

export async function reportMatch(team: Team, reporter: PlayerInActiveMatch, teams: ActiveMatchTeams) {
  await waitForAllPromises(teams.blueTeam, async (player) => {
    await ActiveMatchRepository.updatePlayerInActiveMatch(player.id, {
      reportedTeam: null,
    });
  });

  await waitForAllPromises(teams.orangeTeam, async (player) => {
    await ActiveMatchRepository.updatePlayerInActiveMatch(player.id, {
      reportedTeam: null,
    });
  });

  await ActiveMatchRepository.updatePlayerInActiveMatch(reporter.id, {
    reportedTeam: team,
  });
}

export async function confirmMatch(team: Team, teams: ActiveMatchTeams, playerInMatchId: string) {
  switch (team) {
    case Team.Blue: {
      const mmr = await calculateMMR(playerInMatchId, Team.Blue);
      const updateStats: Array<UpdatePlayerStatsInput> = [];
      await waitForAllPromises(teams.blueTeam, async (player) => {
        const playerStats = await LeaderboardRepository.getPlayerStats(player.id);
        if (playerStats) {
          const stats: UpdatePlayerStatsInput = {
            id: player.id,
            mmr: playerStats.mmr + mmr,
            wins: playerStats.wins + 1,
          };
          updateStats.push(stats);
        } else {
          const stats: UpdatePlayerStatsInput = {
            id: player.id,
            mmr: 100 + mmr,
            wins: 1,
          };
          updateStats.push(stats);
        }
      });
      await waitForAllPromises(teams.orangeTeam, async (player) => {
        const playerStats = await LeaderboardRepository.getPlayerStats(player.id);
        if (playerStats) {
          const stats: UpdatePlayerStatsInput = {
            id: player.id,
            losses: playerStats.losses + 1,
            mmr: playerStats.mmr - mmr,
          };
          updateStats.push(stats);
        } else {
          const stats: UpdatePlayerStatsInput = {
            id: player.id,
            losses: 1,
            mmr: 100 - mmr,
          };
          updateStats.push(stats);
        }
      });

      Promise.all([
        await LeaderboardRepository.updatePlayersStats(updateStats),
        await ActiveMatchRepository.removeAllPlayersInActiveMatch(playerInMatchId),
      ]);

      break;
    }
    case Team.Orange: {
      const mmr = await calculateMMR(playerInMatchId, Team.Orange);
      const updateStats: Array<UpdatePlayerStatsInput> = [];
      await waitForAllPromises(teams.orangeTeam, async (player) => {
        const playerStats = await LeaderboardRepository.getPlayerStats(player.id);
        if (playerStats) {
          const stats: UpdatePlayerStatsInput = {
            id: player.id,
            mmr: playerStats.mmr + mmr,
            wins: playerStats.wins + 1,
          };
          updateStats.push(stats);
        } else {
          const stats: UpdatePlayerStatsInput = {
            id: player.id,
            mmr: 100 + mmr,
            wins: 1,
          };
          updateStats.push(stats);
        }
      });
      await waitForAllPromises(teams.blueTeam, async (player) => {
        const playerStats = await LeaderboardRepository.getPlayerStats(player.id);
        if (playerStats) {
          const stats: UpdatePlayerStatsInput = {
            id: player.id,
            losses: playerStats.losses + 1,
            mmr: playerStats.mmr - mmr,
          };
          updateStats.push(stats);
        } else {
          const stats: UpdatePlayerStatsInput = {
            id: player.id,
            losses: 1,
            mmr: 100 - mmr,
          };
          updateStats.push(stats);
        }
      });

      Promise.all([
        await LeaderboardRepository.updatePlayersStats(updateStats),
        await ActiveMatchRepository.removeAllPlayersInActiveMatch(playerInMatchId),
      ]);

      break;
    }
  }
}

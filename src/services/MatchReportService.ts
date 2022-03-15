import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import { ActiveMatchTeams, PlayerInActiveMatch } from "../repositories/ActiveMatchRepository/types";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import { UpdatePlayerStatsInput } from "../repositories/LeaderboardRepository/types";
import { Team } from "../types/common";

// 🐧 Can we rename this function to something more appropriate? calculateNumbers is pretty vague
async function calculateNumbers(playerInMatchId: string, reportedTeam: Team): Promise<number> {
  let blueTeamMMR = 0;
  let orangeTeamMMR = 0;
  let reportedWinner = 0;
  let reportedLoser = 0;
  const teams = await ActiveMatchRepository.getAllPlayersInActiveMatch(playerInMatchId);
  const blueTeam = teams.blueTeam;
  const orangeTeam = teams.orangeTeam;

  // 🐧 You can use `.reduce` instead for both of these and not need to use lets
  blueTeam.forEach((ballChaser) => {
    blueTeamMMR += ballChaser.mmr;
  });
  orangeTeam.forEach((ballChaser) => {
    orangeTeamMMR += ballChaser.mmr;
  });

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
  const probabilityDecimal = await calculateNumbers(playerInMatchId, reportedTeam);

  let mmr = (1 - probabilityDecimal) * 20;
  mmr = Math.min(15, mmr);
  mmr = Math.max(5, mmr);

  return Math.round(mmr);
}

export async function calculateProbability(playerInMatchId: string, reportedTeam: Team): Promise<number> {
  const probabilityDecimal = await calculateNumbers(playerInMatchId, reportedTeam);
  const probability = probabilityDecimal * 100;

  return Math.round(probability);
}

export async function isConfirm(team: Team, playerInMatchId: string): Promise<boolean> {
  let reportedTeam;
  const teams = await ActiveMatchRepository.getAllPlayersInActiveMatch(playerInMatchId);
  // 🐧 Can we just look up the player from `teams`? We expect the reporter to be in there, right? That way we avoid
  // a network call.
  const reporter = await ActiveMatchRepository.getPlayerInActiveMatch(playerInMatchId);

  const reportedPlayer = [...teams.blueTeam, ...teams.orangeTeam].find((p) => {
    // 🐧 You should return a boolean. You can just return `p.reportedTeam !== null` in this case
    if (p.reportedTeam !== null) {
      return p;
    }
  });

  // 🐧 Why not just use `team` instead of using reportedTeam at all?
  switch (team) {
    case Team.Blue: {
      reportedTeam = Team.Blue;
      break;
    }
    case Team.Orange: {
      reportedTeam = Team.Orange;
      break;
    }
  }

  if (!reporter) return false;
  if (reportedPlayer?.team === reporter.team && reportedPlayer.reportedTeam === reportedTeam) {
    return false;
  } else if (reportedPlayer?.reportedTeam !== reportedTeam || reportedPlayer?.id === reporter.id) {
    // 🐧 Should this be awaited?
    reportMatch(team, reporter, teams);
    return false;
  } else {
    // 🐧 Should this be awaited?
    confirmMatch(team, teams, playerInMatchId);
    return true;
  }
}

export async function reportMatch(team: Team, reporter: PlayerInActiveMatch, teams: ActiveMatchTeams) {
  // 🐧 Can we leverage the `waitForAllPromises` util for this?
  for (const player of teams.blueTeam) {
    await ActiveMatchRepository.updatePlayerInActiveMatch(player.id, {
      reportedTeam: null,
    });
  }
  for (const player of teams.orangeTeam) {
    await ActiveMatchRepository.updatePlayerInActiveMatch(player.id, {
      reportedTeam: null,
    });
  }

  // 🐧 Do we need a switch here? Can we just set `reportedTeam: team`?
  switch (team) {
    case Team.Blue: {
      await ActiveMatchRepository.updatePlayerInActiveMatch(reporter.id, {
        reportedTeam: Team.Blue,
      });
      break;
    }
    case Team.Orange: {
      await ActiveMatchRepository.updatePlayerInActiveMatch(reporter.id, {
        reportedTeam: Team.Orange,
      });
      break;
    }
  }
}

export async function confirmMatch(team: Team, teams: ActiveMatchTeams, playerInMatchId: string) {
  switch (team) {
    case Team.Blue: {
      const mmr = await calculateMMR(playerInMatchId, Team.Blue);
      const updateStats: Array<UpdatePlayerStatsInput> = [];
      // 🐧 Can we leverage the `waitForAllPromises` util for this?
      for (const player of teams.blueTeam) {
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
      }
      // 🐧 Can we leverage the `waitForAllPromises` util for this?
      for (const player of teams.orangeTeam) {
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
      }
      // 🐧 Can this parallelizes with Promise.all?
      await LeaderboardRepository.updatePlayersStats(updateStats);
      await ActiveMatchRepository.removeAllPlayersInActiveMatch(playerInMatchId);
      break;
    }
    case Team.Orange: {
      // 🐧 Comments from above apply to this case block as well
      const mmr = await calculateMMR(playerInMatchId, Team.Orange);
      const updateStats: Array<UpdatePlayerStatsInput> = [];
      for (const player of teams.orangeTeam) {
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
      }
      for (const player of teams.blueTeam) {
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
      }
      await LeaderboardRepository.updatePlayersStats(updateStats);
      await ActiveMatchRepository.removeAllPlayersInActiveMatch(playerInMatchId);
      break;
    }
  }
}

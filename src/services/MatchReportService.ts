import { ButtonInteraction } from "discord.js";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import { ActiveMatchTeams, PlayerInActiveMatch } from "../repositories/ActiveMatchRepository/types";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import { UpdatePlayerStatsInput } from "../repositories/LeaderboardRepository/types";
import { Team } from "../types/common";
import { ButtonCustomID } from "../utils/MessageBuilder";

async function calculateNumbers(playerInMatchId: string, reportedTeam: Team): Promise<number> {
  let blueTeamMMR = 0;
  let orangeTeamMMR = 0;
  let reportedWinner = 0;
  let reportedLoser = 0;
  const teams = await ActiveMatchRepository.getAllPlayersInActiveMatch(playerInMatchId);
  const blueTeam = teams.blueTeam;
  const orangeTeam = teams.orangeTeam;

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

export async function isConfirm(buttonInteraction: ButtonInteraction): Promise<boolean> {
  let reportedTeam;
  const teams = await ActiveMatchRepository.getAllPlayersInActiveMatch(buttonInteraction.user.id);
  const reporter = await ActiveMatchRepository.getPlayerInActiveMatch(buttonInteraction.user.id);

  const reportedPlayer = [...teams.blueTeam, ...teams.orangeTeam].find((p) => {
    if (p.reportedTeam !== null) {
      return p;
    }
  });

  switch (buttonInteraction.customId) {
    case ButtonCustomID.ReportBlue: {
      reportedTeam = Team.Blue;
      break;
    }
    case ButtonCustomID.ReportOrange: {
      reportedTeam = Team.Orange;
      break;
    }
  }

  if (!reporter) return false;
  if (reportedPlayer?.id !== reporter.id) {
    if (reportedPlayer?.team === reporter.team) return false;
  }
  if (reportedPlayer?.reportedTeam !== reportedTeam) {
    reportMatch(buttonInteraction, reporter, teams);
    return false;
  } else {
    confirmMatch(buttonInteraction, teams);
    return true;
  }
}

export async function reportMatch(
  buttonInteraction: ButtonInteraction,
  reporter: PlayerInActiveMatch,
  teams: ActiveMatchTeams
) {
  for (const player of teams.blueTeam) {
    await ActiveMatchRepository.updatePlayerInActiveMatch(player.id, {
      reportedTeam: undefined,
    });
  }
  for (const player of teams.orangeTeam) {
    await ActiveMatchRepository.updatePlayerInActiveMatch(player.id, {
      reportedTeam: undefined,
    });
  }

  switch (buttonInteraction.customId) {
    case ButtonCustomID.ReportBlue: {
      await ActiveMatchRepository.updatePlayerInActiveMatch(reporter.id, {
        reportedTeam: Team.Blue,
      });
      break;
    }
    case ButtonCustomID.ReportOrange: {
      await ActiveMatchRepository.updatePlayerInActiveMatch(reporter.id, {
        reportedTeam: Team.Orange,
      });
      break;
    }
  }
}

export async function confirmMatch(buttonInteraction: ButtonInteraction, teams: ActiveMatchTeams) {
  switch (buttonInteraction.customId) {
    case ButtonCustomID.ReportBlue: {
      const mmr = await calculateMMR(buttonInteraction.user.id, Team.Blue);
      const updateStats: Array<UpdatePlayerStatsInput> = [];
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
      await LeaderboardRepository.updatePlayersStats(updateStats);
      await ActiveMatchRepository.removeAllPlayersInActiveMatch(buttonInteraction.user.id);
      break;
    }
    case ButtonCustomID.ReportOrange: {
      const mmr = await calculateMMR(buttonInteraction.user.id, Team.Orange);
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
      await ActiveMatchRepository.removeAllPlayersInActiveMatch(buttonInteraction.user.id);
      break;
    }
  }
}

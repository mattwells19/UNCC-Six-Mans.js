import { ButtonInteraction } from "discord.js";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import { ActiveMatchTeams, PlayerInActiveMatch } from "../repositories/ActiveMatchRepository/types";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import { UpdatePlayerStatsInput } from "../repositories/LeaderboardRepository/types";
import { Team } from "../types/common";
import { ButtonCustomID } from "../utils/MessageBuilder";

export async function calculateMMR(playerInMatchId: string, reportedTeam: Team): Promise<number> {
  let blueTeamMMR = 0;
  let orangeTeamMMR = 0;
  let reportedWinner = 0;
  let reportedLoser = 0;
  const teams = await ActiveMatchRepository.getAllPlayersInActiveMatch(playerInMatchId);
  let blueTeam = teams.blueTeam;
  let orangeTeam = teams.orangeTeam;

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

  let difference = (reportedLoser - reportedWinner) / 400;

  let power = Math.pow(10, difference) + 1;

  let probability = 1 / power;

  let mmr = (1 - probability) * 20;
  mmr = Math.min(15, mmr);
  mmr = Math.max(5, mmr);

  return Math.round(mmr);
}

export async function calculateProbability(playerInMatchId: string, reportedTeam: Team): Promise<number> {
  let blueTeamMMR = 0;
  let orangeTeamMMR = 0;
  let reportedWinner = 0;
  let reportedLoser = 0;
  const teams = await ActiveMatchRepository.getAllPlayersInActiveMatch(playerInMatchId);
  let blueTeam = teams.blueTeam;
  let orangeTeam = teams.orangeTeam;

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

  let difference = (reportedLoser - reportedWinner) / 400;
  let power = Math.pow(10, difference) + 1;
  let probabilityDecimal = 1 / power;
  let probability = probabilityDecimal * 100;

  return Math.round(probability);
}

export async function isConfirm(buttonInteraction: ButtonInteraction): Promise<boolean> {
  let reportedTeam;
  const badTeamValues = [null, -1];
  const teams = await ActiveMatchRepository.getAllPlayersInActiveMatch(buttonInteraction.user.id);
  const reporter = await ActiveMatchRepository.getPlayerInActiveMatch(buttonInteraction.user.id);
  const hasPlayerReported = [...teams.blueTeam, ...teams.orangeTeam].some((p) => {
    return p.reportedTeam !== (badTeamValues[0] || badTeamValues[1]);
  });

  const reportedPlayer = [...teams.blueTeam, ...teams.orangeTeam].find((p) => {
    return p.reportedTeam !== (badTeamValues[0] || badTeamValues[1]);
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
  if (reportedPlayer?.team === reporter.team) return false;
  if (!hasPlayerReported || reportedPlayer?.reportedTeam !== reportedTeam) {
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
      reportedTeam: -1,
    });
  }
  for (const player of teams.orangeTeam) {
    await ActiveMatchRepository.updatePlayerInActiveMatch(player.id, {
      reportedTeam: -1,
    });
  }

  switch (buttonInteraction.customId) {
    case ButtonCustomID.ReportBlue: {
      await ActiveMatchRepository.updatePlayerInActiveMatch(reporter.id, {
        reportedTeam: Team.Blue,
      });
    }
    case ButtonCustomID.ReportOrange: {
      await ActiveMatchRepository.updatePlayerInActiveMatch(reporter.id, {
        reportedTeam: Team.Orange,
      });
    }
  }
}

export async function confirmMatch(buttonInteraction: ButtonInteraction, teams: ActiveMatchTeams) {
  switch (buttonInteraction.customId) {
    case ButtonCustomID.ReportBlue: {
      const mmr = await calculateMMR(buttonInteraction.user.id, Team.Blue);
      let updateStats: Array<UpdatePlayerStatsInput> = [];
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
            mmr: playerStats.mmr - mmr,
            losses: playerStats.losses + 1,
          };
          updateStats.push(stats);
        } else {
          const stats: UpdatePlayerStatsInput = {
            id: player.id,
            mmr: 100 - mmr,
            losses: 1,
          };
          updateStats.push(stats);
        }
      }
      LeaderboardRepository.updatePlayersStats(updateStats);
      ActiveMatchRepository.removeAllPlayersInActiveMatch(buttonInteraction.user.id);
    }
    case ButtonCustomID.ReportOrange: {
      const mmr = await calculateMMR(buttonInteraction.user.id, Team.Orange);
      let updateStats: Array<UpdatePlayerStatsInput> = [];
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
            mmr: playerStats.mmr - mmr,
            losses: playerStats.losses + 1,
          };
          updateStats.push(stats);
        } else {
          const stats: UpdatePlayerStatsInput = {
            id: player.id,
            mmr: 100 - mmr,
            losses: 1,
          };
          updateStats.push(stats);
        }
      }
      LeaderboardRepository.updatePlayersStats(updateStats);
      ActiveMatchRepository.removeAllPlayersInActiveMatch(buttonInteraction.user.id);
    }
  }
}

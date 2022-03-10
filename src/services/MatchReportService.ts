import { ButtonInteraction } from "discord.js";
import { deleteActiveMatchEmbed } from "../controllers/Interactions";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import { ActiveMatchTeams, PlayerInActiveMatch } from "../repositories/ActiveMatchRepository/types";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import { UpdatePlayerStatsInput } from "../repositories/LeaderboardRepository/types";
import { Team } from "../types/common";
import { ButtonCustomID } from "../utils/MessageBuilder";

export async function calculateMMR(playerInMatchId: string): Promise<number> {
  let blueTeamMMR = 0;
  let orangeTeamMMR = 0;
  const teams = await ActiveMatchRepository.getAllPlayersInActiveMatch(playerInMatchId);
  let blueTeam = teams.blueTeam;
  let orangeTeam = teams.orangeTeam;

  blueTeam.forEach((ballChaser) => {
    blueTeamMMR += ballChaser.mmr;
  });
  orangeTeam.forEach((ballChaser) => {
    orangeTeamMMR += ballChaser.mmr;
  });

  let difference = (orangeTeamMMR - blueTeamMMR) / 400;

  let power = Math.pow(10, difference) + 1;

  let probability = 1 / power;

  let mmr = (1 - probability) * 20;

  mmr = Math.min(15, mmr);
  mmr = Math.max(5, mmr);

  return Math.round(mmr);
}

export async function isConfirm(playerInMatchId: string, buttonInteraction: ButtonInteraction) {
  let reportedTeam;
  const teams = await ActiveMatchRepository.getAllPlayersInActiveMatch(playerInMatchId);
  const reporter = await ActiveMatchRepository.getPlayerInActiveMatch(playerInMatchId);
  const hasPlayerReported = [...teams.blueTeam, ...teams.orangeTeam].some((p) => {
    return p.reportedTeam !== null;
  });

  const reportedPlayer = [...teams.blueTeam, ...teams.orangeTeam].find((p) => {
    return p.reportedTeam !== null;
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

  if (!reporter) return;
  if (!hasPlayerReported || reportedPlayer?.reportedTeam !== reportedTeam) {
    reportMatch(buttonInteraction, reporter, teams);
  } else {
    confirmMatch(buttonInteraction, playerInMatchId);
  }
}

export async function reportMatch(
  buttonInteraction: ButtonInteraction,
  reporter: PlayerInActiveMatch,
  teams: ActiveMatchTeams
) {
  switch (buttonInteraction.customId) {
    case ButtonCustomID.ReportBlue: {
      for (const player of teams.blueTeam) {
        await ActiveMatchRepository.updatePlayerInActiveMatch(player.id, {
          reportedTeam: undefined,
        });
      }
      await ActiveMatchRepository.updatePlayerInActiveMatch(reporter.id, {
        reportedTeam: Team.Blue,
      });
    }
    case ButtonCustomID.ReportOrange: {
      for (const player of teams.orangeTeam) {
        await ActiveMatchRepository.updatePlayerInActiveMatch(player.id, {
          reportedTeam: undefined,
        });
      }
      await ActiveMatchRepository.updatePlayerInActiveMatch(reporter.id, {
        reportedTeam: Team.Orange,
      });
    }
  }
}
/*
        if (teamWhoReported === reporter.team) {
          return;
        } else {
          const mmr = await calculateMMR(playerInMatchId);
          let updateStats: Array<UpdatePlayerStatsInput> = [];
          for (const player of teams.blueTeam) {
            const playerStats = await LeaderboardRepository.getPlayerStats(player.id);
            if (playerStats) {
              const stats: UpdatePlayerStatsInput = {
                id: player.id,
                mmr: playerStats.mmr + mmr,
                wins: playerStats.wins + 1,
              };
              console.log("exist " + stats.mmr);
              updateStats.push(stats);
            } else {
              const stats: UpdatePlayerStatsInput = {
                id: player.id,
                mmr: 100 + mmr,
                wins: 1,
              };
              console.log("new " + stats.mmr);
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
              console.log("exist " + stats.mmr);
              updateStats.push(stats);
            } else {
              const stats: UpdatePlayerStatsInput = {
                id: player.id,
                mmr: 100 - mmr,
                losses: 1,
              };
              console.log("new " + stats.mmr);
              updateStats.push(stats);
            }
          }
          LeaderboardRepository.updatePlayersStats(updateStats);
          ActiveMatchRepository.removeAllPlayersInActiveMatch(playerInMatchId);
          deleteActiveMatchEmbed(buttonInteraction);
        }
      }
      break;
    }

    case ButtonCustomID.ReportOrange: {
      if (!hasPlayerReported || reportedPlayer?.reportedTeam !== Team.Orange) {
        await ActiveMatchRepository.updatePlayerInActiveMatch(reporter.id, {
          reportedTeam: Team.Orange,
        });
        return;
      } else {
        if (teamWhoReported === reporter.team) {
          return;
        } else {
          const mmr = await calculateMMR(playerInMatchId);
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
          ActiveMatchRepository.removeAllPlayersInActiveMatch(playerInMatchId);
          deleteActiveMatchEmbed(buttonInteraction);
        }
      }
      break;
    }
  }
}
*/
export async function confirmMatch(buttonInteraction: ButtonInteraction, playerInMatchId: string) {}
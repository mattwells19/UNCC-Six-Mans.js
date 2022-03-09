import { ButtonInteraction } from "discord.js";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
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
  orangeTeam.forEach((ballChaer) => {
    orangeTeamMMR += ballChaer.mmr;
  });

  let difference = (orangeTeamMMR - blueTeamMMR) / 400;

  let power = Math.pow(10, difference) + 1;

  let probability = 1 / power;

  let mmr = (1 - probability) * 20;

  mmr = Math.min(15, mmr);
  mmr = Math.max(5, mmr);

  return Math.round(mmr);
}

export async function reportMatch(buttonInteraction: ButtonInteraction, playerInMatchId: string) {
  const teams = await ActiveMatchRepository.getAllPlayersInActiveMatch(playerInMatchId);
  let reporter = await ActiveMatchRepository.getPlayerInActiveMatch(playerInMatchId);

  const playerIsInMatch = await ActiveMatchRepository.isPlayerInActiveMatch(buttonInteraction.user.id);
  const hasPlayerReported = [...teams.blueTeam, ...teams.orangeTeam].some((p) => {
    return p.reportedTeam !== null;
  });
  const reportedPlayer = [...teams.blueTeam, ...teams.orangeTeam].find((p) => {
    return p.reportedTeam !== null;
  });
  const teamWhoReported = reportedPlayer?.team;

  if (!playerIsInMatch || !reporter) {
    return;
  }

  switch (buttonInteraction.customId) {
    case ButtonCustomID.ReportBlue: {
      if (!hasPlayerReported) {
        await ActiveMatchRepository.updatePlayerInActiveMatch(reporter.id, {
          reportedTeam: Team.Blue,
        });
      } else {
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
                mmr: player.mmr + mmr,
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
                mmr: player.mmr - mmr,
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
        }
      }
      break;
    }

    case ButtonCustomID.ReportOrange: {
      if (!hasPlayerReported) {
        await ActiveMatchRepository.updatePlayerInActiveMatch(reporter.id, {
          reportedTeam: Team.Orange,
        });
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
                mmr: player.mmr + mmr,
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
                mmr: player.mmr - mmr,
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
        }
      }
      break;
    }
  }
}
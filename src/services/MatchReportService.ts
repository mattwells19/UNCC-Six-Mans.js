import { ButtonInteraction } from "discord.js";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import { UpdatePlayerStatsInput } from "../repositories/LeaderboardRepository/types";
import { Team } from "../types/common";
import { ButtonCustomID } from "../utils/MessageBuilder";

let reportingTeam: Team;

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
  const reporter = await ActiveMatchRepository.getPlayerInActiveMatch(playerInMatchId);

  const playerIsInMatch = await ActiveMatchRepository.isPlayerInActiveMatch(buttonInteraction.user.id);
  const hasPlayerReported = [...teams.blueTeam, ...teams.orangeTeam].some((p) => {
    return p.reportedTeam !== null;
  });

  if (!playerIsInMatch || !reporter) {
    return;
  }

  switch (buttonInteraction.customId) {
    case ButtonCustomID.ReportBlue: {
      if (hasPlayerReported) {
        reporter.reportedTeam = Team.Blue;
        reportingTeam = reporter.team;
      } else {
        if (reportingTeam === reporter.team) {
          return;
        } else {
          const mmr = calculateMMR(playerInMatchId);
          let updateStats: Array<UpdatePlayerStatsInput> = [];
          for (const player of teams.blueTeam) {
            const playerStats = await LeaderboardRepository.getPlayerStats(player.id);
            if (playerStats) {
              const stats: UpdatePlayerStatsInput = {
                id: player.id,
                mmr: player.mmr + (await mmr),
                wins: playerStats.wins + 1,
              };
              updateStats.push(stats);
            }
          }
          for (const player of teams.orangeTeam) {
            const playerStats = await LeaderboardRepository.getPlayerStats(player.id);
            if (playerStats) {
              const stats: UpdatePlayerStatsInput = {
                id: player.id,
                mmr: player.mmr - (await mmr),
                losses: playerStats.losses + 1,
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
      if (hasPlayerReported) {
        reporter.team = Team.Orange;
      } else {
        if (reportingTeam === reporter.team) {
          return;
        } else {
          const mmr = calculateMMR(playerInMatchId);
          let updateStats: Array<UpdatePlayerStatsInput> = [];
          for (const player of teams.orangeTeam) {
            const playerStats = await LeaderboardRepository.getPlayerStats(player.id);
            if (playerStats) {
              const stats: UpdatePlayerStatsInput = {
                id: player.id,
                mmr: player.mmr + (await mmr),
                wins: playerStats.wins + 1,
              };
              updateStats.push(stats);
            }
          }
          for (const player of teams.blueTeam) {
            const playerStats = await LeaderboardRepository.getPlayerStats(player.id);
            if (playerStats) {
              const stats: UpdatePlayerStatsInput = {
                id: player.id,
                mmr: player.mmr - (await mmr),
                losses: playerStats.losses + 1,
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

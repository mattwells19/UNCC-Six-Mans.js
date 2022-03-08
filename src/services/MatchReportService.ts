import { ButtonInteraction } from "discord.js";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import { Team } from "../types/common";
import MessageBuilder, { ButtonCustomID } from "../utils/MessageBuilder";

let reportedTeam: Team = -1;
let reportingTeam: Team = -1;

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
  if (!playerIsInMatch || !reporter) {
    return;
  }

  switch (buttonInteraction.customId) {
    case ButtonCustomID.ReportBlue: {
      if (reportedTeam != Team.Blue) {
        reportedTeam = Team.Blue;
        reportingTeam = reporter.team;
      } else {
        if (reportingTeam === reporter.team) {
          return;
        } else {
        }
      }
      break;
    }

    case ButtonCustomID.ReportOrange: {
      if (reportedTeam != Team.Orange) {
        reportedTeam = Team.Orange;
        reportingTeam = reporter.team;
      } else {
        if (reportingTeam === reporter.team) {
          return;
        } else {
          //report confirm goes here
        }
      }
      break;
    }
  }
}

import { ButtonInteraction } from "discord.js";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import { PlayerInActiveMatch } from "../repositories/ActiveMatchRepository/types";
import { Team } from "../types/common";
import MessageBuilder, { ButtonCustomID } from "../utils/MessageBuilder";

async function organizeTeams(ballChasers: Promise<ReadonlyArray<Readonly<PlayerInActiveMatch>>>) {
  const blueTeam: Readonly<PlayerInActiveMatch>[] = [];
  const orangeTeam: Readonly<PlayerInActiveMatch>[] = [];
  (await ballChasers).forEach((ballChaser) => {
    if (ballChaser.team === Team.Blue) {
      blueTeam.push({
        id: ballChaser.id,
        reportedTeam: ballChaser.reportedTeam,
        matchId: ballChaser.matchId,
        team: ballChaser.team,
      });
    } else {
      orangeTeam.push({
        id: ballChaser.id,
        reportedTeam: ballChaser.reportedTeam,
        matchId: ballChaser.matchId,
        team: ballChaser.team,
      });
    }
  });
  return { blueTeam: blueTeam, orangeTeam: orangeTeam };
}

export async function mmr(activeMatchBallChasers: Promise<ReadonlyArray<Readonly<PlayerInActiveMatch>>>) {
  let blueTeamMMR = 0;
  let orangeTeamMMR = 0;
  const teams = await organizeTeams(activeMatchBallChasers);
  let blueTeam = teams.blueTeam;
  let orangeTeam = teams.orangeTeam;

  //Get each Team MMR here

  let difference = (orangeTeamMMR - blueTeamMMR) / 400;

  let power = Math.pow(10, difference) + 1;

  let probability = 1 / power;

  let mmr = (1 - probability) * 20;

  mmr = Math.min(15, mmr);
  mmr = Math.max(5, mmr);

  return Math.round(mmr);
}

export async function reportMatch(buttonInteraction: ButtonInteraction) {
  let reportedTeam;

  switch (buttonInteraction.customId) {
    case ButtonCustomID.ReportBlue: {
      if (reportedTeam != Team.Blue) {
        reportedTeam = Team.Blue;
        MessageBuilder.reportedTeamButtons(buttonInteraction);
      } else {
        //code for report confirm goes here
      }
      break;
    }

    case ButtonCustomID.ReportOrange: {
      if (reportedTeam != Team.Orange) {
        reportedTeam = Team.Orange;
        MessageBuilder.reportedTeamButtons(buttonInteraction);
      } else {
        //code for report confirm goes here
      }
      break;
    }
  }
}

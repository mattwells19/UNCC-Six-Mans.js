import { ButtonInteraction, MessageActionRow, MessageButton, MessageEmbed, MessageOptions } from "discord.js";
import { NewActiveMatchInput } from "../repositories/ActiveMatchRepository/types";
import { Team } from "../types/common";
import getEnvVariable from "./getEnvVariable";
import { PlayerInQueue } from "../repositories/QueueRepository/types";

export const enum ButtonCustomID {
  JoinQueue = "joinQueue",
  LeaveQueue = "leaveQueue",
  CreateRandomTeam = "randomizeTeams",
  FillTeam = "fillTeam",
  ReportMatch = "reportMatch",
  RemoveAll = "removeAll",
  BreakMatch = "breakMatch",
}

export default class MessageBuilder {
  private static readonly normIconURL =
    "https://raw.githubusercontent.com/mattwells19/UNCC-Six-Mans.js/main/media/norm_still.png";

  private static readonly isDev = getEnvVariable("ENVIRONMENT") === "dev";

  static leaderboardMessage(leaderboardInfo: string[]): MessageOptions {
    const embeds = leaderboardInfo.map((content, index) => {
      const embedCtr = leaderboardInfo.length > 1 ? `(${index + 1}/${leaderboardInfo.length})` : "";

      return new MessageEmbed({
        color: "BLUE",
        description: "```" + content + "```",
        thumbnail: { url: this.normIconURL },
        title: `UNCC 6 Mans | Leaderboard ${embedCtr}`.trim(),
      });
    });

    return {
      embeds,
    };
  }

  static disabledQueueButtons(buttonInteraction: ButtonInteraction): MessageOptions {
    const waitLabel = "Please wait...";
    const joinButton = new MessageButton({
      customId: ButtonCustomID.JoinQueue,
      disabled: true,
      label: "Join",
      style: "SUCCESS",
    });
    const leaveButton = new MessageButton({
      customId: ButtonCustomID.LeaveQueue,
      disabled: true,
      label: "Leave",
      style: "DANGER",
    });

    switch (buttonInteraction.customId) {
      case ButtonCustomID.JoinQueue: {
        joinButton.label = waitLabel;
        break;
      }
      case ButtonCustomID.LeaveQueue: {
        leaveButton.label = waitLabel;
        break;
      }
    }
    return {
      components: [new MessageActionRow({ components: [joinButton, leaveButton] })],
    };
  }

  static enabledQueueButtons(): MessageOptions {
    const joinButton = new MessageButton({
      customId: ButtonCustomID.JoinQueue,
      label: "Join",
      style: "SUCCESS",
    });
    const leaveButton = new MessageButton({
      customId: ButtonCustomID.LeaveQueue,
      label: "Leave",
      style: "DANGER",
    });
    return {
      components: [new MessageActionRow({ components: [joinButton, leaveButton] })],
    };
  }

  static queueMessage(ballchasers: ReadonlyArray<Readonly<PlayerInQueue>>): MessageOptions {
    const embed = new MessageEmbed({
      color: "GREEN",
      thumbnail: { url: this.normIconURL },
    });
    const joinButton = new MessageButton({
      customId: ButtonCustomID.JoinQueue,
      label: "Join",
      style: "SUCCESS",
    });
    const leaveButton = new MessageButton({
      customId: ButtonCustomID.LeaveQueue,
      label: "Leave",
      style: "DANGER",
    });
    const fillTeamButton = new MessageButton({
      customId: ButtonCustomID.FillTeam,
      label: "DEV: Fill Queue",
      style: "DANGER",
    });
    const removeAllButton = new MessageButton({
      customId: ButtonCustomID.RemoveAll,
      label: "DEV: Remove All",
      style: "DANGER",
    });

    if (ballchasers.length == 0) {
      embed.setTitle("Queue is Empty").setDescription("Click the green button to join the queue!");
    } else {
      const ballChaserList = ballchasers
        .map((ballChaser) => {
          // + 1 since it seems that joining the queue calculates to 59 instead of 60
          const queueTime = ballChaser.queueTime?.diffNow().as("minutes") ?? 0;
          return `${ballChaser.name} (${Math.min(queueTime + 1, 60).toFixed()} mins)`;
        })
        .join("\n");

      embed
        .setTitle(`Current Queue: ${ballchasers.length}/6`)
        .setDescription("Click the green button to join the queue! \n\n" + ballChaserList);
    }

    return {
      components: this.isDev
        ? [new MessageActionRow({ components: [joinButton, leaveButton, fillTeamButton, removeAllButton] })]
        : [new MessageActionRow({ components: [joinButton, leaveButton] })],
      embeds: [embed],
    };
  }

  static fullQueueMessage(ballchasers: ReadonlyArray<Readonly<PlayerInQueue>>): MessageOptions {
    const embed = new MessageEmbed({
      color: "GREEN",
      thumbnail: { url: this.normIconURL },
    });
    const pickTeamsButton = new MessageButton({
      customId: ButtonCustomID.CreateRandomTeam,
      label: "Create Teams",
      style: "SUCCESS",
    });
    const leaveButton = new MessageButton({
      customId: ButtonCustomID.LeaveQueue,
      label: "Leave",
      style: "DANGER",
    });
    const removeAllButton = new MessageButton({
      customId: ButtonCustomID.RemoveAll,
      label: "DEV: Remove All",
      style: "DANGER",
    });

    const ballChaserList = ballchasers
      .map((ballChaser) => {
        // + 1 since it seems that joining the queue calculates to 59 instead of 60
        const queueTime = ballChaser.queueTime?.diffNow().as("minutes") ?? 0;
        return `${ballChaser.name} (${Math.min(queueTime + 1, 60).toFixed()} mins)`;
      })
      .join("\n");

    embed
      .setTitle("Queue is Full")
      .setDescription("Click the Create Teams button to get started! \n\n" + ballChaserList);

    return {
      components: this.isDev
        ? [new MessageActionRow({ components: [pickTeamsButton, leaveButton, removeAllButton] })]
        : [new MessageActionRow({ components: [pickTeamsButton, leaveButton] })],
      embeds: [embed],
    };
  }

  static activeMatchMessage(ballchasers: Array<NewActiveMatchInput>): MessageOptions {
    const embed = new MessageEmbed({
      color: "DARK_RED",
      thumbnail: { url: this.normIconURL },
    });
    const reportMatch = new MessageButton({
      customId: ButtonCustomID.ReportMatch,
      label: "Report Match",
      style: "SUCCESS",
    });
    const breakMatch = new MessageButton({
      customId: ButtonCustomID.BreakMatch,
      label: "DEV: Break Match",
      style: "DANGER",
    });

    const orangeTeam: Array<string> = [];
    const blueTeam: Array<string> = [];

    ballchasers.forEach((ballChaser) => {
      if (ballChaser.team === Team.Blue) {
        blueTeam.push("<@" + ballChaser.id + ">");
      } else {
        orangeTeam.push("<@" + ballChaser.id + ">");
      }
    });

    embed
      .setTitle("Teams are set!")
      .addField("🔷 Blue Team 🔷", blueTeam.join("\n"))
      .addField("🔶 Orange Team 🔶", orangeTeam.join("\n"));

    return {
      components: this.isDev
        ? [new MessageActionRow({ components: [reportMatch, breakMatch] })]
        : [new MessageActionRow({ components: [reportMatch] })],
      embeds: [embed],
    };
  }
}

import { Message, MessageActionRow, MessageButton, MessageEmbed, MessageOptions } from "discord.js";
import { report } from "process";
import { BallChaser } from "../types/common";
import getEnvVariable from "./getEnvVariable";

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

  static queueMessage(ballchasers: ReadonlyArray<Readonly<BallChaser>>): MessageOptions {
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
        .setDescription("Click the green button to join the queue!\n\n" + ballChaserList);
    }

    return {
      components: [new MessageActionRow({ components: [joinButton, leaveButton] })],
      embeds: [embed],
    };
  }

  static activeMatchMessage(ballchasers: ReadonlyArray<Readonly<BallChaser>>) : MessageOptions {
    const embed = new MessageEmbed({
      color: "GREEN",
      thumbnail: { url: this.normIconURL },
    });
    const reportMatch = new MessageButton({
      customId: ButtonCustomID.ReportMatch,
      label: "Report Match",
      style: "SUCCESS",
    });
    const breakMatch = new MessageButton({
      customId: ButtonCustomID.BreakMatch,
      label: "Break Match",
      style: "DANGER",
    });

    const ballChaserList = ballchasers
      .map((ballChaser) => {
        return ballChaser.name;
      })
      .join("\n");
    
    embed
      .setTitle("Active Match")
      .setDescription("Make sure to report your match after the games.\n\n" + ballChaserList);

    return {
      components: [new MessageActionRow(
        {components: [getEnvVariable("ENVIRONMENT") == "dev" ? breakMatch : reportMatch]})],
      embeds: [embed],
    };
  }
}

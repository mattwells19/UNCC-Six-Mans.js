import { MessageActionRow, MessageButton, MessageEmbed, MessageOptions } from "discord.js";
import { BallChaser, Team } from "../types/common";
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

  static disabledButtonsJoining(): MessageOptions {
    const joinButton = new MessageButton({
      customId: ButtonCustomID.JoinQueue,
      disabled: true,
      label: "Please wait...",
      style: "SUCCESS",
    });
    const leaveButton = new MessageButton({
      customId: ButtonCustomID.LeaveQueue,
      disabled: true,
      label: "Leave",
      style: "DANGER",
    });
    return {
      components: [new MessageActionRow({ components: [joinButton, leaveButton] })]
    };
  }

  static disabledButtonsLeaving(): MessageOptions {
    const joinButton = new MessageButton({
      customId: ButtonCustomID.JoinQueue,
      disabled: true,
      label: "Join",
      style: "SUCCESS",
    });
    const leaveButton = new MessageButton({
      customId: ButtonCustomID.LeaveQueue,
      disabled: true,
      label: "Please wait...",
      style: "DANGER",
    });
    return {
      components: [new MessageActionRow({ components: [joinButton, leaveButton] })]
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
        .setDescription("Click the green button to join the queue!\n\n" + ballChaserList);
    }

    return {
      components: getEnvVariable("ENVIRONMENT") == "dev" ?
        [new MessageActionRow({ components: [joinButton, leaveButton, fillTeamButton, removeAllButton] })] :
        [new MessageActionRow({ components: [joinButton, leaveButton]})],
      embeds: [embed],
    };
  }

  static fullQueueMessage(ballchasers: ReadonlyArray<Readonly<BallChaser>>) : MessageOptions {
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
      customId: ButtonCustomID.BreakMatch,
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
      .setDescription("Click the Create Teams button to get started!\n\n" + ballChaserList);

    return {
      components: getEnvVariable("ENVIRONMENT") == "dev" ?
        [new MessageActionRow({ components: [pickTeamsButton, leaveButton, removeAllButton] })] :
        [new MessageActionRow({ components: [pickTeamsButton, leaveButton]})],
      embeds: [embed],
    };
  }

  static activeMatchMessage(ballchasers: ReadonlyArray<Readonly<BallChaser>>) : MessageOptions {
    const embed = new MessageEmbed({
      color: "#F1C40F",
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
        blueTeam.push("<@"+ballChaser.id+">");
      } else {
        orangeTeam.push("<@"+ballChaser.id+">");
      }
    });
    
    embed
      .setTitle("Teams are set!")
      .setDescription( 
        "🔶 Orange Team 🔶\n" + orangeTeam.join("\n") +
        "\n\n🔷 Blue Team 🔷\n" + blueTeam.join("\n"));

    return {
      components: getEnvVariable("ENVIRONMENT") == "dev" ? 
        [new MessageActionRow( {components: [ reportMatch, breakMatch ]} )]:
        [new MessageActionRow( {components: [ reportMatch ]} )],
      embeds: [embed],
    };
  }
}

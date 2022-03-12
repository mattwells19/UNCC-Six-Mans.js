import {
  ButtonInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageOptions,
  MessageSelectMenu,
  MessageSelectOptionData,
} from "discord.js";
import { NewActiveMatchInput } from "../repositories/ActiveMatchRepository/types";
import { Team } from "../types/common";
import { getEnvVariable } from "./utils";
import { PlayerInQueue } from "../repositories/QueueRepository/types";
import { calculateMMR, calculateProbability, reportMatch } from "../services/MatchReportService";

export const enum ButtonCustomID {
  JoinQueue = "joinQueue",
  LeaveQueue = "leaveQueue",
  CreateRandomTeam = "randomizeTeams",
  ChooseTeam = "chooseTeam",
  FillTeam = "fillTeam",
  RemoveAll = "removeAll",
  BreakMatch = "breakMatch",
  ReportBlue = "reportBlue",
  ReportOrange = "reportOrange",
}

export const enum MenuCustomID {
  BlueSelect = "blueSelect",
  OrangeSelect = "orangeSelect",
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

  static reportedTeamButtons(buttonInteraction: ButtonInteraction): MessageOptions {
    const primaryStyle = "PRIMARY";
    const reportBlue = new MessageButton({
      customId: ButtonCustomID.ReportBlue,
      label: "🔷 Blue Team Won 🔷",
      style: "SECONDARY",
    });
    const reportOrange = new MessageButton({
      customId: ButtonCustomID.ReportOrange,
      label: "🔶 Orange Team Won 🔶",
      style: "SECONDARY",
    });

    switch (buttonInteraction.customId) {
      case ButtonCustomID.ReportBlue: {
        reportBlue.style = primaryStyle;
        break;
      }
      case ButtonCustomID.ReportOrange: {
        reportOrange.style = primaryStyle;
        break;
      }
    }
    return {
      components: [new MessageActionRow({ components: [reportBlue, reportOrange] })],
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
    const randomTeamsButton = new MessageButton({
      customId: ButtonCustomID.CreateRandomTeam,
      label: "Random",
      style: "PRIMARY",
    });
    const pickCaptainsButton = new MessageButton({
      customId: ButtonCustomID.ChooseTeam,
      label: "Captains",
      style: "PRIMARY",
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
        ? [new MessageActionRow({ components: [pickCaptainsButton, randomTeamsButton, leaveButton, removeAllButton] })]
        : [new MessageActionRow({ components: [pickCaptainsButton, randomTeamsButton, leaveButton] })],
      embeds: [embed],
    };
  }

  static async activeMatchMessage(ballchasers: Array<NewActiveMatchInput>): Promise<MessageOptions> {
    const embed = new MessageEmbed({
      color: "DARK_RED",
      thumbnail: { url: this.normIconURL },
    });
    const reportBlue = new MessageButton({
      customId: ButtonCustomID.ReportBlue,
      label: "🔷 Blue Team Won 🔷",
      style: "SECONDARY",
    });
    const reportOrange = new MessageButton({
      customId: ButtonCustomID.ReportOrange,
      label: "🔶 Orange Team Won 🔶",
      style: "SECONDARY",
    });
    const breakMatch = new MessageButton({
      customId: ButtonCustomID.BreakMatch,
      label: "DEV: Break Match",
      style: "DANGER",
    });

    const orangeTeam: Array<string> = [];
    const blueTeam: Array<string> = [];
    const mmrBlue = await calculateMMR(ballchasers[0].id, Team.Blue);
    const mmrOrange = await calculateMMR(ballchasers[0].id, Team.Orange);
    let probability;
    let winner;
    if (mmrBlue < mmrOrange) {
      probability = await calculateProbability(ballchasers[0].id, Team.Blue);
      winner = "Blue Team";
    } else {
      probability = await calculateProbability(ballchasers[0].id, Team.Orange);
      winner = "Orange Team";
    }

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
      .addField("🔶 Orange Team 🔶", orangeTeam.join("\n"))
      .addField(
        "MMR Stake & Probability Rating:\n",
        "🔷 Blue Team: \u007F\u007F\u007F\u007F**+" +
          mmrBlue.toString() +
          "** MMR\u007F\u007F**-" +
          mmrOrange.toString() +
          "** MMR 🔷\n🔶 Orange Team:\u007F\u007F**+" +
          mmrOrange.toString() +
          "** MMR\u007F\u007F**-" +
          mmrBlue.toString() +
          "** MMR 🔶\n" +
          winner +
          " is predicted to have a **" +
          probability +
          "%** chance of winning."
      );

    return {
      components: this.isDev
        ? [new MessageActionRow({ components: [reportBlue, reportOrange, breakMatch] })]
        : [new MessageActionRow({ components: [reportBlue, reportOrange] })],
      embeds: [embed],
    };
  }

  static blueChooseMessage(ballChasers: ReadonlyArray<PlayerInQueue>): MessageOptions {
    const embed = new MessageEmbed({
      color: "BLUE",
      thumbnail: { url: this.normIconURL },
    });
    const breakMatch = new MessageButton({
      customId: ButtonCustomID.RemoveAll,
      label: "DEV: Break Match",
      style: "DANGER",
    });

    //Get Available Players and Map players
    const availablePlayers: Array<MessageSelectOptionData> = [];
    const orangeTeam: Array<string> = [];
    const blueTeam: Array<string> = [];
    let blueCaptain: string | null = null;

    ballChasers.forEach((player) => {
      if (player.team === Team.Blue) {
        if (player.isCap) {
          blueCaptain = player.name;
        }
        blueTeam.push("<@" + player.id + ">");
      } else if (player.team === Team.Orange) {
        orangeTeam.push("<@" + player.id + ">");
      } else {
        availablePlayers.push({ description: "MMR: " + player.mmr, label: player.name, value: player.id });
      }
    });

    const playerChoices = new MessageSelectMenu()
      .setCustomId(MenuCustomID.BlueSelect)
      .setPlaceholder(blueCaptain + " choose a player")
      .addOptions(availablePlayers);

    embed
      .setTitle("Captains pick your players")
      .setDescription("🔷 " + blueCaptain + " 🔷 chooses first")
      .addField("🔷 Blue Team 🔷", blueTeam.join("\n"))
      .addField("🔶 Orange Team 🔶", orangeTeam.join("\n"));

    return {
      components: this.isDev
        ? [new MessageActionRow({ components: [playerChoices] }), new MessageActionRow({ components: [breakMatch] })]
        : [new MessageActionRow({ components: [playerChoices] })],
      embeds: [embed],
    };
  }

  static orangeChooseMessage(ballChasers: ReadonlyArray<PlayerInQueue>): MessageOptions {
    const embed = new MessageEmbed({
      color: "ORANGE",
      thumbnail: { url: this.normIconURL },
    });
    const breakMatch = new MessageButton({
      customId: ButtonCustomID.RemoveAll,
      label: "DEV: Break Match",
      style: "DANGER",
    });

    //Get Available Players and Map players
    const availablePlayers: Array<MessageSelectOptionData> = [];
    const orangeTeam: Array<string> = [];
    const blueTeam: Array<string> = [];
    let orangeCaptain: string | null = null;

    ballChasers.forEach((player) => {
      if (player.team === Team.Blue) {
        blueTeam.push("<@" + player.id + ">");
      } else if (player.team === Team.Orange) {
        if (player.isCap) {
          orangeCaptain = player.name;
        }
        orangeTeam.push("<@" + player.id + ">");
      } else {
        availablePlayers.push({ description: "MMR: " + player.mmr, label: player.name, value: player.id });
      }
    });

    const playerChoices = new MessageSelectMenu()
      .setCustomId(MenuCustomID.OrangeSelect)
      .setPlaceholder(orangeCaptain + " choose 2 players")
      .setMinValues(2)
      .setMaxValues(2)
      .addOptions(availablePlayers);

    embed
      .setTitle("Captains pick your players")
      .setDescription("🔶 " + orangeCaptain + " 🔶 choose 2 players")
      .addField("🔷 Blue Team 🔷", blueTeam.join("\n"))
      .addField("🔶 Orange Team 🔶", orangeTeam.join("\n"));

    return {
      components: this.isDev
        ? [new MessageActionRow({ components: [playerChoices] }), new MessageActionRow({ components: [breakMatch] })]
        : [new MessageActionRow({ components: [playerChoices] })],
      embeds: [embed],
    };
  }
}

import {
  ButtonInteraction,
  EmbedField,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageOptions,
  MessageSelectMenu,
  MessageSelectOptionData,
} from "discord.js";
import { Team } from "../types/common";
import { getEnvVariable } from "./utils";
import { PlayerInQueue } from "../repositories/QueueRepository/types";
import { ActiveMatchCreated } from "../services/MatchService";

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

  static reportedTeamButtons(buttonInteraction: ButtonInteraction, activeMatchEmbed: MessageEmbed): MessageOptions {
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

    let reportedTeam;
    switch (buttonInteraction.customId) {
      case ButtonCustomID.ReportBlue: {
        reportBlue.setStyle("PRIMARY");
        reportedTeam = "**Blue Team**";
        break;
      }
      case ButtonCustomID.ReportOrange: {
        reportOrange.setStyle("PRIMARY");
        reportedTeam = "**Orange Team**";
        break;
      }
    }
    const newField: EmbedField = {
      inline: false,
      name: "Reporting",
      value:
        "<@" +
        buttonInteraction.user +
        "> reported " +
        reportedTeam +
        " as the winner.\nAwaiting confirmation from the other team...\n" +
        "If this is incorrect, click the button of the correct team.",
    };
    const embed = new MessageEmbed(activeMatchEmbed);
    const updatedFields = embed.fields.map((field) => {
      if (field.name === "Reporting") {
        return newField;
      } else {
        return field;
      }
    });
    embed.setFields(updatedFields);

    return {
      components: [new MessageActionRow({ components: [reportBlue, reportOrange] })],
      embeds: [embed],
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
      label: "Random (0)",
      style: "PRIMARY",
    });
    const pickCaptainsButton = new MessageButton({
      customId: ButtonCustomID.ChooseTeam,
      label: "Captains (0)",
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
      .setDescription("Vote for Captains or Random teams to get started! \n\n" + ballChaserList);

    return {
      components: this.isDev
        ? [new MessageActionRow({ components: [pickCaptainsButton, randomTeamsButton, leaveButton, removeAllButton] })]
        : [new MessageActionRow({ components: [pickCaptainsButton, randomTeamsButton, leaveButton] })],
      embeds: [embed],
    };
  }

  static voteCaptainsOrRandomMessage(
    ballchasers: ReadonlyArray<Readonly<PlayerInQueue>>,
    captainsVotes: number,
    randomVotes: number,
    voterList: PlayerInQueue[],
    buttonInteraction: ButtonInteraction
  ): MessageOptions {
    const captainsCounterLabel = captainsVotes;
    const randomCounterLabel = randomVotes;
    const embed = new MessageEmbed({
      color: "GREEN",
      thumbnail: { url: this.normIconURL },
    });
    const randomTeamsButton = new MessageButton({
      customId: ButtonCustomID.CreateRandomTeam,
      label: "Random (" + randomCounterLabel.toString() + ")",
      style: "PRIMARY",
    });
    const pickCaptainsButton = new MessageButton({
      customId: ButtonCustomID.ChooseTeam,
      label: "Captains (" + captainsCounterLabel.toString() + ")",
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

    const cap = "\uD83C\uDDE8";
    const ran = "\uD83C\uDDF7";
    const ballChaserList = ballchasers
      .map((ballChaser) => {
        // + 1 since it seems that joining the queue calculates to 59 instead of 60
        const queueTime = ballChaser.queueTime?.diffNow().as("minutes") ?? 0;
        const voter = voterList.find((p) => p.id == ballChaser.id);
        if (buttonInteraction.customId == ButtonCustomID.ChooseTeam && voter) {
          return `${cap} ${ballChaser.name} (${Math.min(queueTime + 1, 60).toFixed()} mins)`;
        } else if (buttonInteraction.customId == ButtonCustomID.CreateRandomTeam && voter) {
          return `${ran} ${ballChaser.name} (${Math.min(queueTime + 1, 60).toFixed()} mins)`;
        } else {
          return `${ballChaser.name} (${Math.min(queueTime + 1, 60).toFixed()} mins)`;
        }
      })
      .join("\n");

    embed
      .setTitle("Queue is Full")
      .setDescription("Vote for Captains or Random teams to get started! \n\n" + ballChaserList);

    return {
      components: this.isDev
        ? [new MessageActionRow({ components: [pickCaptainsButton, randomTeamsButton, leaveButton, removeAllButton] })]
        : [new MessageActionRow({ components: [pickCaptainsButton, randomTeamsButton, leaveButton] })],
      embeds: [embed],
    };
  }

  static activeMatchMessage({ blue, orange }: ActiveMatchCreated): MessageOptions {
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

    let probability;
    let winner;
    if (blue.winProbability > orange.winProbability) {
      probability = blue.winProbability;
      winner = "Blue Team is";
    } else if (blue.winProbability < orange.winProbability) {
      probability = orange.winProbability;
      winner = "Orange Team is";
    } else {
      probability = "50";
      winner = "Both teams are";
    }

    const blueTeam: Array<string> = blue.players.map((player) => "<@" + player.id + ">");
    const orangeTeam: Array<string> = orange.players.map((player) => "<@" + player.id + ">");

    embed
      .setTitle("Teams are set!")
      .addField("🔷 Blue Team 🔷", blueTeam.join("\n"))
      .addField("🔶 Orange Team 🔶", orangeTeam.join("\n"))
      .addField(
        "MMR Stake & Probability Rating:\n",
        "🔷 Blue Team: \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0**(+" +
          blue.mmrStake.toString() +
          ")**\u00A0\u00A0**(-" +
          orange.mmrStake.toString() +
          ")** 🔷\n🔶 Orange Team:\u00A0\u00A0**(+" +
          orange.mmrStake.toString() +
          ")**\u00A0\u00A0**(-" +
          blue.mmrStake.toString() +
          ")** 🔶\n" +
          winner +
          " predicted to have a **" +
          probability +
          "%** chance of winning."
      )
      .addField("Reporting", "Use the buttons to report which team won the match.");

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

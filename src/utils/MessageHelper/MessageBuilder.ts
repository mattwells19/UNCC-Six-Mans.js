import {
  ButtonInteraction,
  EmbedField,
  InteractionUpdateOptions,
  MessageActionRow,
  MessageEmbed,
  MessageOptions,
  MessageSelectMenu,
  MessageSelectOptionData,
} from "discord.js";
import { ActiveMatchCreated } from "../../services/MatchService";
import { Team } from "../../types/common";
import { getEnvVariable } from "../utils";
import { PlayerInQueue } from "../../repositories/QueueRepository/types";
import EmbedBuilder from "./EmbedBuilder";
import ButtonBuilder from "./ButtonBuilder";
import CustomButton, { ButtonCustomID } from "./CustomButtons";

export const enum MenuCustomID {
  BlueSelect = "blueSelect",
  OrangeSelect = "orangeSelect",
}

export default class MessageBuilder {
  private static readonly isDev = getEnvVariable("ENVIRONMENT") === "dev";

  static leaderboardMessage(leaderboardInfo: string[]): MessageOptions {
    const embeds = leaderboardInfo.map((content, index) => {
      const embedCtr = leaderboardInfo.length > 1 ? `(${index + 1}/${leaderboardInfo.length})` : "";

      return EmbedBuilder.leaderboardEmbed("```" + content + "```", `UNCC 6 Mans | Leaderboard ${embedCtr}`.trim());
    });

    return {
      embeds,
    };
  }

  static queueMessage(ballchasers: ReadonlyArray<Readonly<PlayerInQueue>>): MessageOptions {
    let embed;
    if (ballchasers.length == 0) {
      embed = EmbedBuilder.queueEmbed("Queue is Empty", "Click the green button to join the queue!");
    } else {
      const ballChaserList = ballchasers
        .map((ballChaser) => {
          // + 1 since it seems that joining the queue calculates to 59 instead of 60
          const queueTime = ballChaser.queueTime?.diffNow().as("minutes") ?? 0;
          return `${ballChaser.name} (${Math.min(queueTime + 1, 60).toFixed()} mins)`;
        })
        .join("\n");

      embed = EmbedBuilder.queueEmbed(
        `Current Queue: ${ballchasers.length}/6`,
        "Click the green button to join the queue! \n\n" + ballChaserList
      );
    }

    return {
      components: [ButtonBuilder.queueButtons()],
      embeds: [embed],
    };
  }

  static fullQueueMessage(ballchasers: ReadonlyArray<Readonly<PlayerInQueue>>): MessageOptions {
    const ballChaserList = ballchasers
      .map((ballChaser) => {
        // + 1 since it seems that joining the queue calculates to 59 instead of 60
        const queueTime = ballChaser.queueTime?.diffNow().as("minutes") ?? 0;
        return `${ballChaser.name} (${Math.min(queueTime + 1, 60).toFixed()} mins)`;
      })
      .join("\n");

    const embed = EmbedBuilder.fullQueueEmbed("Click the Create Teams button to get started! \n\n" + ballChaserList);

    return {
      components: [ButtonBuilder.fullQueueButtons()],
      embeds: [embed],
    };
  }

  static activeMatchMessage({ blue, orange }: ActiveMatchCreated): MessageOptions {
    const embed = EmbedBuilder.activeMatchEmbed({ blue, orange });

    return {
      components: [ButtonBuilder.activeMatchButtons()],
      embeds: [embed],
    };
  }

  static captainChooseMessage(firstPick = true, ballChasers: ReadonlyArray<PlayerInQueue>): MessageOptions {
    //Get Available Players and Map players
    const availablePlayers: Array<MessageSelectOptionData> = [];
    const orangeTeam: Array<string> = [];
    const blueTeam: Array<string> = [];
    let captain = "";
    const embedColor = firstPick ? Team.Blue : Team.Orange;

    ballChasers.forEach((player) => {
      if (player.team === Team.Blue) {
        if (player.isCap && firstPick) {
          captain = player.name;
        }
        blueTeam.push("<@" + player.id + ">");
      } else if (player.team === Team.Orange) {
        if (player.isCap && !firstPick) {
          captain = player.name;
        }
        orangeTeam.push("<@" + player.id + ">");
      } else {
        availablePlayers.push({ description: "MMR: " + player.mmr, label: player.name, value: player.id });
      }
    });

    const playerChoices = new MessageSelectMenu();

    if (firstPick) {
      playerChoices.setCustomId(MenuCustomID.BlueSelect).setPlaceholder(captain + " choose a player");
    } else {
      playerChoices
        .setCustomId(MenuCustomID.OrangeSelect)
        .setPlaceholder(captain + " choose 2 players")
        .setMinValues(2)
        .setMaxValues(2);
    }

    playerChoices.addOptions(availablePlayers);

    const embed = EmbedBuilder.captainsChooseEmbed(embedColor, captain)
      .addField("🔷 Blue Team 🔷", blueTeam.join("\n"))
      .addField("🔶 Orange Team 🔶", orangeTeam.join("\n"));

    const components = [new MessageActionRow({ components: [playerChoices] })];
    if (this.isDev) {
      components.push(ButtonBuilder.removeAllButtons());
    }
    return {
      components,
      embeds: [embed],
    };
  }

  static voteCaptainsOrRandomMessage(
    ballchasers: ReadonlyArray<Readonly<PlayerInQueue>>,
    captainsVotes: number,
    randomVotes: number,
    voterList: PlayerInQueue[],
    players: Map<string, string>
  ): MessageOptions {
    const captainsCounterLabel = captainsVotes;
    const randomCounterLabel = randomVotes;
    const randomTeams = new CustomButton({
      customId: ButtonCustomID.CreateRandomTeam,
      label: "Random (" + randomCounterLabel.toString() + ")",
    });
    const chooseCaptain = new CustomButton({
      customId: ButtonCustomID.ChooseTeam,
      label: "Captains (" + captainsCounterLabel.toString() + ")",
    });
    const leaveQueue = new CustomButton({ customId: ButtonCustomID.LeaveQueue });

    const cap = "\uD83C\uDDE8";
    const ran = "\uD83C\uDDF7";
    const ballChaserList = ballchasers
      .map((ballChaser) => {
        // + 1 since it seems that joining the queue calculates to 59 instead of 60
        const queueTime = ballChaser.queueTime?.diffNow().as("minutes") ?? 0;
        const voter = voterList.find((p) => p.id == ballChaser.id);
        const vote = players.get(ballChaser.id);
        if (voter && vote == ButtonCustomID.ChooseTeam) {
          return `${cap} ${ballChaser.name} (${Math.min(queueTime + 1, 60).toFixed()} mins)`;
        } else if (voter && vote == ButtonCustomID.CreateRandomTeam) {
          return `${ran} ${ballChaser.name} (${Math.min(queueTime + 1, 60).toFixed()} mins)`;
        } else {
          return `${ballChaser.name} (${Math.min(queueTime + 1, 60).toFixed()} mins)`;
        }
      })
      .join("\n");

    const embed = EmbedBuilder.voteForCaptainsOrRandomEmbed(
      "Queue is Full",
      "Vote for Captains or Random teams to get started! \n\n" + ballChaserList
    );

    const components = [new MessageActionRow({ components: [chooseCaptain, randomTeams, leaveQueue] })];
    if (this.isDev) {
      components.push(ButtonBuilder.removeAllButtons());
    }

    return {
      components,
      embeds: [embed],
    };
  }

  static reportedTeamButtons(buttonInteraction: ButtonInteraction, activeMatchEmbed: MessageEmbed): MessageOptions {
    let reportedTeam;
    const reportBlue = new CustomButton({ customId: ButtonCustomID.ReportBlue });
    const reportOrange = new CustomButton({ customId: ButtonCustomID.ReportOrange });

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
      components: [new MessageActionRow({ components: [reportBlue, reportOrange] }), ButtonBuilder.breakMatchButtons()],
      embeds: [embed],
    };
  }

  static confirmSeasonMessage(seasonName: string): MessageOptions {
    const embed = EmbedBuilder.newSeasonEmbed(seasonName).addField("⚠️ CAUTION ⚠️", "THIS CANNOT BE UNDONE", true);
    return {
      components: [ButtonBuilder.newSeasonButtons()],
      embeds: [embed],
    };
  }

  static seasonConfirmedMessage(seasonName: string): InteractionUpdateOptions {
    const embed = EmbedBuilder.newSeasonConfirmedEmbed(seasonName);
    return {
      components: [],
      embeds: [embed],
    };
  }

  static newSeasonCancelMessage(): InteractionUpdateOptions {
    const embed = EmbedBuilder.newSeasonCancellationEmbed();
    return {
      components: [],
      embeds: [embed],
    };
  }
}

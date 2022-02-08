/* eslint-disable max-len */
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { BallChaser } from "../../types/common";

export default class MessageBuilder {
  
  static readonly normIconURL = "https://raw.githubusercontent.com/mattwells19/UNCC-Six-Mans.js/main/media/norm_still.png";

  static readonly queueButtons = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId("joinQueue")
        .setLabel("Join")
        .setStyle("SUCCESS"),
      new MessageButton()
        .setCustomId("leaveQueue")
        .setLabel("Leave")
        .setStyle("DANGER"),
    );

  static readonly queueFullButtons = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId("randomizeTeams")
        .setLabel("Random Teams")
        .setStyle("SUCCESS"),
      new MessageButton()
        .setCustomId("leaveQueue")
        .setLabel("Leave")
        .setStyle("DANGER"),
    );

  static readonly activeMatchButtons = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId("reportMatch")
        .setLabel("Report")
        .setStyle("SUCCESS")
    );

  static leaderboardMessage(leaderboardInfo : string[]) : MessageEmbed[] {

    const embeds = leaderboardInfo.map((content, index) => {
      const embedCtr = leaderboardInfo.length > 1 ? `(${index + 1}/${leaderboardInfo.length})` : "";
  
      return new MessageEmbed()
        .setColor("BLUE")
        .setTitle(`UNCC 6 Mans | Leaderboard ${embedCtr}`.trim())
        .setThumbnail(this.normIconURL)
        .setDescription("```" + content + "```");
    });

    return embeds;
  }

  static activeQueueMessage( ballchasers : Readonly<BallChaser>[] ) : MessageEmbed {
    
    const ballChaserNames = ballchasers.map(function (a) { return a.name; }).join("\n");

    const embed = new MessageEmbed()
      .setColor("#3ba55c") // <- This is green
      .setTitle("Current Queue")
      .setThumbnail(this.normIconURL)
      .setDescription("Click the green button to join the queue!\n\n" +
                "Current Queue: " + ballchasers.length + "/6\n" + ballChaserNames);

    return embed;
  }

  static fullQueueMessage( ballchasers : Readonly<BallChaser>[] ) : MessageEmbed {
    const ballChaserNames = ballchasers.map(function (a) { return a.name; }).join("\n");

    const embed = new MessageEmbed()
      .setColor("#3ba55c") // <- This is green
      .setTitle("Queue is Full")
      .setThumbnail(this.normIconURL)
      .setDescription("Click the Random Button to assign teams.\n\n" +
              "Current Queue: " + ballchasers.length + "/6\n" + ballChaserNames);

    return embed;
  }

  static activeMatchMessage( ballchasers : Readonly<BallChaser>[] ) : MessageEmbed {
    const ballChaserNames = ballchasers.map(function (a) { return a.name; }).join("\n");

    const embed = new MessageEmbed()
      .setColor("#3ba55c") // <- This is green
      .setTitle("Active Match -Good Luck!")
      .setThumbnail(this.normIconURL)
      .setDescription("Report match once complete.\n\n" +
              "Current Queue: " + ballchasers.length + "/6\n" + ballChaserNames);

    return embed;
  }

  static emptyQueueMessage() : MessageEmbed {

    const embed = new MessageEmbed()
      .setColor("#3ba55c") // <- This is green
      .setTitle("Queue is Empty")
      .setThumbnail(this.normIconURL)
      .setDescription("Click the green button to join the queue!");
    
    return embed;
  }
}
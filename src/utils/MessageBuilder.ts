import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { BallChaser } from "../types/common";
import getEnvVariable from "./getEnvVariable";

export default class MessageBuilder {
  
  // eslint-disable-next-line max-len
  static readonly normIconURL = "https://raw.githubusercontent.com/mattwells19/UNCC-Six-Mans.js/main/media/norm_still.png";

  static queueButtons() : MessageActionRow {
    const buttons = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId("joinQueue")
          .setLabel("Join")
          .setStyle("SUCCESS"),
        new MessageButton()
          .setCustomId("leaveQueue")
          .setLabel("Leave")
          .setStyle("DANGER")
      );

    if(getEnvVariable("ENVIRONMENT") == "dev"){
      buttons.addComponents(
        new MessageButton()
          .setCustomId("createFullTeam")
          .setLabel("DEV: Create Full Team")
          .setStyle("DANGER"),
        new MessageButton()
          .setCustomId("removeAll")
          .setLabel("DEV: Remove All")
          .setStyle("DANGER"));
    }

    return buttons;
  }

  static queueFullButtons() : MessageActionRow {
    const buttons = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId("randomizeTeams")
          .setLabel("Random Teams")
          .setStyle("SUCCESS"),
        new MessageButton()
          .setCustomId("leaveQueue")
          .setLabel("Leave")
          .setStyle("DANGER")
      );
    
    if(getEnvVariable("ENVIRONMENT") == "dev"){
      buttons.addComponents(
        new MessageButton()
          .setCustomId("removeAll")
          .setLabel("DEV: Remove All")
          .setStyle("DANGER"));
    }
      
    return buttons;
  }

  static activeMatchButtons() : MessageActionRow {
    const buttons = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId("reportMatch")
          .setLabel("Report")
          .setStyle("SUCCESS")
      );

    if(getEnvVariable("ENVIRONMENT") == "dev"){
      buttons.addComponents(
        new MessageButton()
          .setCustomId("breakMatch")
          .setLabel("DEV: Break Match")
          .setStyle("DANGER"));
    }

    return buttons;
  }

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

  static queueMessage( ballchasers : ReadonlyArray<Readonly<BallChaser>> ) : MessageEmbed {
    
    let embed : MessageEmbed;

    if(ballchasers == null){
      embed = new MessageEmbed()
        .setColor("GREEN")
        .setTitle("Queue is Empty")
        .setThumbnail(this.normIconURL)
        .setDescription("Click the green button to join the queue!");
    } else{
      const ballChaserNames = ballchasers.map((ballChaser) => ballChaser.name).join("\n");
      embed = new MessageEmbed()
        .setColor("GREEN")
        .setTitle("Current Queue")
        .setThumbnail(this.normIconURL)
        .setDescription("Click the green button to join the queue!\n\n" +
          "Current Queue: " + ballchasers.length + "/6\n" + ballChaserNames);
    }

    return embed;
  }

  static fullQueueMessage( ballchasers : ReadonlyArray<Readonly<BallChaser>> ) : MessageEmbed {
    const ballChaserNames = ballchasers.map(function (a) { return a.name; }).join("\n");

    const embed = new MessageEmbed()
      .setColor("#3ba55c") // <- This is green
      .setTitle("Queue is Full")
      .setThumbnail(this.normIconURL)
      .setDescription("Click the Random Button to assign teams.\n\n" +
              "Current Queue: " + ballchasers.length + "/6\n" + ballChaserNames);

    return embed;
  }

  static activeMatchMessage( ballchasers : ReadonlyArray<Readonly<BallChaser>> ) : MessageEmbed {
    const ballChaserNames = ballchasers.map(function (a) { return a.name; }).join("\n");

    const embed = new MessageEmbed()
      .setColor("#3ba55c") // <- This is green
      .setTitle("Active Match -Good Luck!")
      .setThumbnail(this.normIconURL)
      .setDescription("Report match once complete.\n\n" +
              "Current Queue: " + ballchasers.length + "/6\n" + ballChaserNames);

    return embed;
  }
}
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { BallChaser } from "../types/common";

export default class MessageBuilder {
  
  // eslint-disable-next-line max-len
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
}
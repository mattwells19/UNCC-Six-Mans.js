import { TextChannel } from "discord.js";
import { LeaderboardToString } from "../services/LeaderboardService";
import deleteAllMessagesInTextChannel from "../utils/deleteAllMessagesInTextChannel";
import MessageBuilder from "../repositories/helpers/MessageBuilder";

export async function updateLeaderboardChannel(leaderboardChannel: TextChannel): Promise<void> {

  const leaderboardContent = await LeaderboardToString();
  const normIconURL = "https://raw.githubusercontent.com/mattwells19/UNCC-Six-Mans.js/main/media/norm_still.png";

  await deleteAllMessagesInTextChannel(leaderboardChannel);

  const embeds = leaderboardContent.map((content, index) => {
    const embedCtr = leaderboardContent.length > 1 ? `(${index + 1}/${leaderboardContent.length})` : "";

    return new MessageEmbed()
      .setColor("BLUE")
      .setTitle(`UNCC 6 Mans | Leaderboard ${embedCtr}`.trim())
      .setDescription("```" + content + "```")
      .setThumbnail(normIconURL);
  });

  await leaderboardChannel.send({ embeds: MessageBuilder.leaderboardMessage(leaderboardContent) });
}

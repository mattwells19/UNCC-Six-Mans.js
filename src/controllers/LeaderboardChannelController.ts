import { MessageEmbed, TextChannel } from "discord.js";
import { LeaderboardToString } from "../services/LeaderboardService";
import Colors from "../utils/colors";
import deleteAllMessagesInTextChannel from "../utils/deleteAllMessagesInTextChannel";

export async function updateLeaderboardChannel(leaderboardChannel: TextChannel): Promise<void> {
  const leaderboardContent = await LeaderboardToString();

  await deleteAllMessagesInTextChannel(leaderboardChannel);

  const embeds = leaderboardContent.map((content, index) => {
    const embedCtr = leaderboardContent.length > 1 ? `(${index + 1}/${leaderboardContent.length})` : "";

    return new MessageEmbed()
      .setColor(Colors.Blue)
      .setTitle(`UNCC 6 Mans | Leaderboard ${embedCtr}`.trim())
      .setDescription("```" + content + "```");
  });

  await leaderboardChannel.send({ embeds });
}

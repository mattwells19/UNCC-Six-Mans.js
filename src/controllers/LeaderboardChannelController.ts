import { MessageEmbed, TextChannel } from "discord.js";
import { LeaderboardToString } from "../services/LeaderboardService";
import deleteAllMessagesInTextChannel from "../utils/deleteAllMessagesInTextChannel";
import { normIconURL } from "../types/common";

export async function updateLeaderboardChannel(leaderboardChannel: TextChannel): Promise<void> {
  const leaderboardContent = await LeaderboardToString();

  await deleteAllMessagesInTextChannel(leaderboardChannel);

  const embeds = leaderboardContent.map((content, index) => {
    const embedCtr = leaderboardContent.length > 1 ? `(${index + 1}/${leaderboardContent.length})` : "";

    return new MessageEmbed()
      .setColor("BLUE")
      .setTitle(`UNCC 6 Mans | Leaderboard ${embedCtr}`.trim())
      .setDescription("```" + content + "```")
      .setThumbnail(normIconURL);
  });

  await leaderboardChannel.send({ embeds });
}

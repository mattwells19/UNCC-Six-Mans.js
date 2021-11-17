import { MessageEmbed, TextChannel } from "discord.js";
import { LeaderboardToString } from "../services/LeaderboardService";
import Colors from "../utils/colors";

export async function updateLeaderboardChannel(leaderboardChannel: TextChannel): Promise<void> {
  const leaderboardContent = await LeaderboardToString();

  if (leaderboardChannel) {
    await leaderboardChannel.messages.fetch({ limit: 99 }).then((messages) => leaderboardChannel.bulkDelete(messages));

    const embeds = leaderboardContent.map((content, index) =>
      new MessageEmbed()
        .setColor(Colors.Blue)
        .setTitle(`UNCC 6 Mans | Leaderboard ${index + 1}/${leaderboardContent.length}`)
        .setDescription("```" + content + "```")
    );

    await leaderboardChannel.send({ embeds });
  }
}

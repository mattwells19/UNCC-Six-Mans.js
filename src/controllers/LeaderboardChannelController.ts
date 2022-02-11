import { TextChannel } from "discord.js";
import { LeaderboardToString } from "../services/LeaderboardService";
import deleteAllMessagesInTextChannel from "../utils/deleteAllMessagesInTextChannel";
import MessageBuilder from "../utils/MessageBuilder";

export async function updateLeaderboardChannel(leaderboardChannel: TextChannel): Promise<void> {

  const leaderboardContent = await LeaderboardToString();

  await deleteAllMessagesInTextChannel(leaderboardChannel);

  await leaderboardChannel.send({ embeds: MessageBuilder.leaderboardMessage(leaderboardContent) });
}

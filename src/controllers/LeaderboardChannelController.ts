import { TextChannel } from "discord.js";
import { LeaderboardToString } from "../services/LeaderboardService";
import deleteAllMessagesInTextChannel from "../utils/deleteAllMessagesInTextChannel";
import MessageBuilder from "../repositories/helpers/MessageBuilder";

export async function updateLeaderboardChannel(leaderboardChannel: TextChannel): Promise<void> {

  await deleteAllMessagesInTextChannel(leaderboardChannel);

  const leaderboardContent = await LeaderboardToString();

  await leaderboardChannel.send({ embeds: MessageBuilder.leaderboardMessage(leaderboardContent) });
}

import type { Client, TextChannel } from "discord.js";

export default async function getDiscordChannelById(
  NormClient: Client,
  channelId: string | undefined
): Promise<TextChannel | null> {
  if (!channelId) {
    return null;
  }

  const channel = await NormClient.channels.fetch(channelId);
  if (!channel) {
    return null;
  }

  if (channel.isText()) {
    return channel as TextChannel;
  }

  return null;
}

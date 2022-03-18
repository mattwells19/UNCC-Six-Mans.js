import { Client, Message, TextChannel } from "discord.js";

export async function deleteAllMessagesInTextChannel(channel: TextChannel): Promise<void> {
  await channel.messages.fetch({ limit: 99 }).then((messages) => channel.bulkDelete(messages));
}

export async function getDiscordChannelById(
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

export function isQueueEmbed(msg: Message): boolean {
  return msg.embeds[0].color === 5763719;
}

export function isActiveMatchEmbed(msg: Message): boolean {
  return msg.embeds[0].color === 10038562;
}

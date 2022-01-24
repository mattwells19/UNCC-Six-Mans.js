import { TextChannel } from "discord.js";

export default async function deleteAllMessagesInTextChannel(channel: TextChannel): Promise<void> {
  await channel.messages.fetch({ limit: 99 }).then((messages) => channel.bulkDelete(messages));
}

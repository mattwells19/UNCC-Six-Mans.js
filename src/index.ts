import { Client, Message } from "discord.js";
import { updateLeaderboardChannel } from "./controllers/LeaderboardChannelController";
import { handleInteraction, postCurrentQueue } from "./controllers/Interactions";
import { getDiscordChannelById } from "./utils/discordUtils";
import { getEnvVariable } from "./utils";
import { handleDevInteraction } from "./controllers/DevInteractions";
import { handleAdminInteraction, registerAdminSlashCommands } from "./controllers/AdminController";
import { handleMenuInteraction } from "./controllers/MenuInteractions";
import { startQueueTimer } from "./controllers/QueueController";

const NormClient = new Client({ intents: "GUILDS" });

const guildId = getEnvVariable("guild_id");
const leaderboardChannelId = getEnvVariable("leaderboard_channel_id");
const queueChannelId = getEnvVariable("queue_channel_id");
const discordToken = getEnvVariable("token");

let queueEmbed: Message | null;

// function called on startup
NormClient.on("ready", async (client) => {
  console.info("NormJS is running.");

  if (!client.user) throw new Error("No client id");
  const registerAdminCommandsPromise = registerAdminSlashCommands(client.user.id, guildId, discordToken);

  const updateLeaderboardPromise = getDiscordChannelById(NormClient, leaderboardChannelId).then(
    (leaderboardChannel) => {
      if (leaderboardChannel) {
        updateLeaderboardChannel(leaderboardChannel);
      }
    }
  );

  const postCurrentQueuePromise = getDiscordChannelById(NormClient, queueChannelId)
    .then((queueChannel) => {
      if (queueChannel) {
        return postCurrentQueue(queueChannel);
      }
    })
    .then((queueEmbedMsg) => {
      queueEmbed = queueEmbedMsg ?? null;
    });

  await Promise.all([registerAdminCommandsPromise, updateLeaderboardPromise, postCurrentQueuePromise]);

  if (queueEmbed) {
    startQueueTimer(queueEmbed);
  } else {
    console.warn("Unable to start queue timers since queue embed is null.");
  }
});

NormClient.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    await interaction.deferUpdate();

    await handleInteraction(interaction);
    await handleDevInteraction(interaction);
  } else if (interaction.isSelectMenu()) {
    await interaction.deferUpdate();

    await handleMenuInteraction(interaction);
  } else if (interaction.isCommand()) {
    if (!queueEmbed) throw new Error("No queue embed set.");

    await interaction.deferReply({ ephemeral: true });
    await handleAdminInteraction(interaction, queueEmbed);
  }
});

// 🐧 First thing, this function isn't async and doesn't return a promise.
// Second, instead of calling this function from somewhere else, just pass NormClient to the handleInteraction function
// above.
export async function getClient(): Promise<Client<boolean>> {
  return NormClient;
}

NormClient.login(discordToken);

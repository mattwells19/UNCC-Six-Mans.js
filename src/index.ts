import { Client, Intents, Message } from "discord.js";
import { updateLeaderboardChannel } from "./controllers/LeaderboardChannelController";
import { handleInteraction, postCurrentQueue } from "./controllers/Interactions";
import { getDiscordChannelById, isQueueEmbed } from "./utils/discordUtils";
import { getEnvVariable } from "./utils";
import { handleDevInteraction } from "./controllers/DevInteractions";
import { handleAdminInteraction, registerAdminSlashCommands } from "./controllers/AdminController";
import { handleMenuInteraction } from "./controllers/MenuInteractions";
import { startQueueTimer } from "./controllers/QueueController";

const NormClient = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const guildId = getEnvVariable("guild_id");
const leaderboardChannelId = getEnvVariable("leaderboard_channel_id");
const queueChannelId = getEnvVariable("queue_channel_id");
const discordToken = getEnvVariable("token");

const queueMessages: Array<Message> = [];

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

  const postCurrentQueuePromise = getDiscordChannelById(NormClient, queueChannelId).then((queueChannel) => {
    if (queueChannel) {
      return postCurrentQueue(queueChannel);
    }
  });

  await Promise.all([registerAdminCommandsPromise, updateLeaderboardPromise, postCurrentQueuePromise]);

  const queueEmbed = queueMessages.find((msg) => isQueueEmbed(msg));
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
    await interaction.deferReply({ ephemeral: true });
    await handleAdminInteraction(interaction, queueMessages);
  }
});

NormClient.on("messageCreate", (msg) => {
  if (!NormClient.user) throw new Error("No client id");
  if (msg.author.id !== NormClient.user.id || msg.embeds.length === 0 || msg.channelId !== queueChannelId) return;

  queueMessages.push(msg);
});

NormClient.login(discordToken);

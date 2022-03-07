import { Client, Message } from "discord.js";
import { updateLeaderboardChannel } from "./controllers/LeaderboardChannelController";
import { handleInteraction, postCurrentQueue } from "./controllers/Interactions";
import getDiscordChannelById from "./utils/getDiscordChannelById";
import getEnvVariable from "./utils/getEnvVariable";
import { handleDevInteraction } from "./controllers/DevInteractions";
import { handleAdminInteraction, registerAdminSlashCommands } from "./controllers/AdminController";

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
});

NormClient.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    await interaction.deferUpdate();
    await handleInteraction(interaction);
    await handleDevInteraction(interaction);
  } else if (interaction.isCommand()) {
    if (!queueEmbed) throw new Error("No queue embed set.");

    await interaction.deferReply({ ephemeral: true });
    await handleAdminInteraction(interaction, queueEmbed);
  }
  // if (interaction.isSelectMenu()) {
  //   await interaction.deferUpdate();
  //   handleMenuInteraction(interaction);
  // }
});

NormClient.login(discordToken);

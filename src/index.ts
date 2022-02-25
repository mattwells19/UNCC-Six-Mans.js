import { Client } from "discord.js";
import { updateLeaderboardChannel } from "./controllers/LeaderboardChannelController";
import { handleInteraction, postCurrentQueue } from "./controllers/Interactions";
import getDiscordChannelById from "./utils/getDiscordChannelById";
import getEnvVariable from "./utils/getEnvVariable";
import { handleDevInteraction } from "./controllers/DevInteractions";

const NormClient = new Client({ intents: "GUILDS" });

const leaderboardChannelId = getEnvVariable("leaderboard_channel_id");
const queueChannelId = getEnvVariable("queue_channel_id");
const discordToken = getEnvVariable("token");

// function called on startup
NormClient.on("ready", () => {
  console.info("NormJS is running.");

  getDiscordChannelById(NormClient, leaderboardChannelId).then((leaderboardChannel) => {
    if (leaderboardChannel) {
      updateLeaderboardChannel(leaderboardChannel);
    }
  });

  getDiscordChannelById(NormClient, queueChannelId).then((queueChannel) => {
    if (queueChannel) {
      postCurrentQueue(queueChannel);
    }
  });
});

NormClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  await interaction.deferUpdate();

  handleInteraction(interaction);
  handleDevInteraction(interaction);
});

NormClient.login(discordToken);

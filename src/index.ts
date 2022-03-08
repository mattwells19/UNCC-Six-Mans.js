import { Client } from "discord.js";
import { updateLeaderboardChannel } from "./controllers/LeaderboardChannelController";
import { handleInteraction, postCurrentQueue } from "./controllers/Interactions";
import { getDiscordChannelById } from "./utils/discordUtils";
import { getEnvVariable } from "./utils";
import { handleDevInteraction } from "./controllers/DevInteractions";
import { handleMenuInteraction } from "./controllers/MenuInteractions";

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
  if (interaction.isButton()) {
    await interaction.deferUpdate();
    handleInteraction(interaction);
    handleDevInteraction(interaction);
  }
  if (interaction.isSelectMenu()) {
    await interaction.deferUpdate();
    handleMenuInteraction(interaction);
  }
});

NormClient.login(discordToken);

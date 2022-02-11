import { Client, Collection } from "discord.js";
import { updateLeaderboardChannel } from "./controllers/LeaderboardChannelController";
import { buttonEmbeds } from "./controllers/Interactions";
import getDiscordChannelById from "./utils/getDiscordChannelById";
import getEnvVariable from "./utils/getEnvVariable";

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
      buttonEmbeds(queueChannel);
    }
  });
});

NormClient.login(discordToken);

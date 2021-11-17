import { Client } from "discord.js";
import { updateLeaderboardChannel } from "./controllers/LeaderboardChannelController";
import getDiscordChannelById from "./utils/getDiscordChannelById";

const NormClient = new Client({ intents: "GUILDS" });

// function called on startup
NormClient.on("ready", async () => {
  console.info("NormJS is running.");

  const leaderboardChannel = await getDiscordChannelById(NormClient, process.env.leaderbord_channel_id);
  if (leaderboardChannel) {
    updateLeaderboardChannel(leaderboardChannel);
  }
});

NormClient.login(process.env.token);

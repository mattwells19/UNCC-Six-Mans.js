import { Client } from "discord.js";

const NormClient = new Client({ intents: "GUILDS" });

// function called on startup
NormClient.on("ready", () => {
  console.info("NormJS is running.");
});

NormClient.login(process.env.token);

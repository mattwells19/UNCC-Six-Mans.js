import { Client, Interaction, TextChannel } from "discord.js";
import { DateTime } from "luxon";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import QueueRepository from "../repositories/QueueRepository";
import { BallChaser } from "../types/common";
import getDiscordChannelById from "../utils/getDiscordChannelById";
import getEnvVariable from "../utils/getEnvVariable";
import MessageBuilder from "../repositories/helpers/MessageBuilder";

const NormClient = new Client({ intents: "GUILDS" });
const queueChannelId = getEnvVariable("queue_channel_id");


export async function buttonEmbeds(queueChannel: TextChannel): Promise<void> {
  
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();
  if (ballchasers == null) {

    await queueChannel.send({ 
      components: [MessageBuilder.queueButtons],
      embeds: [MessageBuilder.emptyQueueMessage()] });

  } else {

    await queueChannel.send({ 
      components: [MessageBuilder.queueButtons],
      embeds: [MessageBuilder.activeQueueMessage(ballchasers)] });
  }
}

NormClient.on("interactionCreate", async (buttonInteraction: Interaction) => {

  if (!buttonInteraction.isButton()) return;
  await buttonInteraction.deferReply();

  switch (buttonInteraction.customId) {
    case "joinQueue": {

      const queueMember = await QueueRepository.getBallChaserInQueue(buttonInteraction.user.toString());
      const leaderboardMember = await LeaderboardRepository.getPlayerStats(buttonInteraction.user.toString());

      if (!queueMember) {
        const player: BallChaser = {
          id: buttonInteraction.user.toString(),
          isCap: false,
          mmr: leaderboardMember ? leaderboardMember.mmr : 100,
          name: buttonInteraction.user.username,
          queueTime: DateTime.now(),
          team: null
        };
        await QueueRepository.addBallChaserToQueue(player);
      }

      const ballchasers = await QueueRepository.getAllBallChasersInQueue();

      getDiscordChannelById(NormClient, queueChannelId).then((queueChannel) => {
        if (queueChannel) {
          queueChannel.messages.delete(buttonInteraction.message.id);
        }
      });

      await buttonInteraction.editReply({ 
        components: [MessageBuilder.queueButtons],
        embeds: [MessageBuilder.activeQueueMessage(ballchasers)] });
      break;
    }

    case "leaveQueue": {

      const member = await QueueRepository.getBallChaserInQueue(buttonInteraction.user.toString());

      if (member != null) {
        const remainingMembers = await QueueRepository.removeBallChaserFromQueue(buttonInteraction.user.toString());

        getDiscordChannelById(NormClient, queueChannelId).then((queueChannel) => {
          if (queueChannel) {
            queueChannel.messages.delete(buttonInteraction.message.id);
          }
        });

        await buttonInteraction.editReply({ 
          components: [MessageBuilder.queueButtons],
          embeds: [MessageBuilder.activeQueueMessage(remainingMembers)] });

      } else {
        const ballchasers = await QueueRepository.getAllBallChasersInQueue();

        getDiscordChannelById(NormClient, queueChannelId).then((queueChannel) => {
          if (queueChannel) {
            queueChannel.messages.delete(buttonInteraction.message.id);
          }
        });

        await buttonInteraction.editReply({
          components: [MessageBuilder.queueButtons],
          embeds: [MessageBuilder.activeQueueMessage(ballchasers)] });
      }
      break;
    }
  }
});

NormClient.login(process.env.token);
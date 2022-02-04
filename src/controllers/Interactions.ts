/* eslint-disable prefer-const */
/* eslint-disable sort-keys */
import { Client, Interaction, TextChannel } from "discord.js";
import { DateTime } from "luxon";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import { PlayerStats } from "../repositories/LeaderboardRepository/types";
import QueueRepository from "../repositories/QueueRepository";
import { BallChaser } from "../types/common";
import getDiscordChannelById from "../utils/getDiscordChannelById";
import getEnvVariable from "../utils/getEnvVariable";
import MessageBuilder from "../repositories/helpers/MessageBuilder";

const NormClient = new Client({ intents: "GUILDS" });
const queueChannelId = getEnvVariable("queue_channel_id");


export async function buttonEmbeds(queueChannel: TextChannel): Promise<void> {
  
  let ballchasers = await QueueRepository.getAllBallChasersInQueue();
  if (ballchasers == null) {

    await queueChannel.send({ embeds: [MessageBuilder.emptyQueueMessage()], components: [MessageBuilder.buttons] });

  } else {

    await queueChannel.send({ 
      embeds: [MessageBuilder.activeQueueMessage(ballchasers)],
      components: [MessageBuilder.buttons]
    });
  }
}

NormClient.on("interactionCreate", async (buttonInteraction: Interaction) => {

  if (!buttonInteraction.isButton()) return;
  await buttonInteraction.deferReply();

  switch (buttonInteraction.customId) {
    case "joinQueue": {

      let queueMember: BallChaser | null;
      queueMember = await QueueRepository.getBallChaserInQueue(buttonInteraction.user.toString());

      let leaderboardMember: Readonly<PlayerStats> | null;
      leaderboardMember = await LeaderboardRepository.getPlayerStats(buttonInteraction.user.toString());

      if (queueMember == null && leaderboardMember == null) {
        const player: BallChaser = {
          id: buttonInteraction.user.toString(),
          mmr: 100,
          name: buttonInteraction.user.username,
          isCap: false,
          team: null,
          queueTime: DateTime.now(),
        };

        await QueueRepository.addBallChaserToQueue(player);

      } else if (queueMember == null && leaderboardMember != null) {
        const player: BallChaser = {
          id: buttonInteraction.user.toString(),
          mmr: leaderboardMember.mmr,
          name: buttonInteraction.user.username,
          isCap: false,
          team: null,
          queueTime: DateTime.now(),
        };

        await QueueRepository.addBallChaserToQueue(player);
      }

      let ballchasers = await QueueRepository.getAllBallChasersInQueue();

      getDiscordChannelById(NormClient, queueChannelId).then((queueChannel) => {
        if (queueChannel) {
          queueChannel.messages.delete(buttonInteraction.message.id);
        }
      });

      buttonInteraction.editReply({ 
        embeds: [MessageBuilder.activeQueueMessage(ballchasers)],
        components: [MessageBuilder.buttons]
      });
      break;
    }

    case "leaveQueue": {

      let member: BallChaser | null;
      member = await QueueRepository.getBallChaserInQueue(buttonInteraction.user.toString());

      if (member != null) {
        let remainingMembers = await QueueRepository.removeBallChaserFromQueue(buttonInteraction.user.toString());

        getDiscordChannelById(NormClient, queueChannelId).then((queueChannel) => {
          if (queueChannel) {
            queueChannel.messages.delete(buttonInteraction.message.id);
          }
        });

        buttonInteraction.editReply({ 
          embeds: [MessageBuilder.activeQueueMessage(remainingMembers)],
          components: [MessageBuilder.buttons]
        });

      } else {
        let ballchasers = await QueueRepository.getAllBallChasersInQueue();

        getDiscordChannelById(NormClient, queueChannelId).then((queueChannel) => {
          if (queueChannel) {
            queueChannel.messages.delete(buttonInteraction.message.id);
          }
        });

        buttonInteraction.editReply({
          embeds: [MessageBuilder.activeQueueMessage(ballchasers)],
          components: [MessageBuilder.buttons]
        });
      }
      break;
    }
  }
});

NormClient.login(process.env.token);
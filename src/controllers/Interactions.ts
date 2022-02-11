import { Client, Interaction, TextChannel } from "discord.js";
import { DateTime } from "luxon";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import QueueRepository from "../repositories/QueueRepository";
import { BallChaser } from "../types/common";
import getDiscordChannelById from "../utils/getDiscordChannelById";
import getEnvVariable from "../utils/getEnvVariable";
import MessageBuilder from "../repositories/helpers/MessageBuilder";
import { createRandomMatch } from "./MatchController";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import { Guid } from "guid-typescript";

const NormClient = new Client({ intents: "GUILDS" });
const queueChannelId = getEnvVariable("queue_channel_id");


export async function buttonEmbeds(queueChannel: TextChannel): Promise<void> {
  
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();
  await ActiveMatchRepository.removeAllPlayersInActiveMatch("<@929967919763439656>");

  if (ballchasers == null) {

    await queueChannel.send({ 
      components: [MessageBuilder.queueButtons()],
      embeds: [MessageBuilder.emptyQueueMessage()] });

  }else {

    await queueChannel.send({ 
      components: [MessageBuilder.queueButtons()],
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
      
      if (ballchasers.length == 6) {
        await buttonInteraction.editReply({ 
          components: [MessageBuilder.queueFullButtons()],
          embeds: [MessageBuilder.fullQueueMessage(ballchasers)]
        });
      } else {
        await buttonInteraction.editReply({ 
          components: [MessageBuilder.queueButtons()],
          embeds: [MessageBuilder.activeQueueMessage(ballchasers)]
        });
      }
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
          components: [MessageBuilder.queueButtons()],
          embeds: [MessageBuilder.activeQueueMessage(remainingMembers)] });

      } else {
        const ballchasers = await QueueRepository.getAllBallChasersInQueue();

        getDiscordChannelById(NormClient, queueChannelId).then((queueChannel) => {
          if (queueChannel) {
            queueChannel.messages.delete(buttonInteraction.message.id);
          }
        });

        await buttonInteraction.editReply({
          components: [MessageBuilder.queueButtons()],
          embeds: [MessageBuilder.activeQueueMessage(ballchasers)] });
      }
      break;
    }

    case "randomizeTeams":{
      const ballchasers = await QueueRepository.getAllBallChasersInQueue();

      await createRandomMatch(ballchasers as BallChaser[]);

      getDiscordChannelById(NormClient, queueChannelId).then((queueChannel) => {
        if (queueChannel) {
          queueChannel.messages.delete(buttonInteraction.message.id);
        }
      });

      await QueueRepository.removeAllBallChasersFromQueue();

      //Edit the reply to start a match.
      await buttonInteraction.editReply({
        components: [MessageBuilder.activeMatchButtons()],
        embeds: [MessageBuilder.activeMatchMessage(ballchasers)]
      });

      //Create a new message to restart a new availability of queue
      /*       await getDiscordChannelById(NormClient, queueChannelId).then((queueChannel) => {
        if (queueChannel) {
          queueChannel.send({ 
            components: [MessageBuilder.queueButtons()],
            embeds: [MessageBuilder.activeQueueMessage(ballchasers)] });
        }
      }); */

      break;
    }

    case "createFullTeam":{

      const randName = [
        "Gamer 1",
        "Gamer 2",
        "Gamer 3",
        "Gamer 4",
        "Gamer 5",
        "Gamer 6"
      ];

      const ballchasers = await QueueRepository.getAllBallChasersInQueue();
      const numPlayersToFill = 6-ballchasers.length;

      for (let i = 0; i < numPlayersToFill; i++) {
        const player: BallChaser = {
          id: Guid.create().toString(),
          isCap: false,
          mmr: Math.floor(Math.random() * (300 - 0 + 1)) + 0,
          name: randName[i],
          queueTime: DateTime.now(),
          team: null
        };
        await QueueRepository.addBallChaserToQueue(player);
      }

      const updatedBallchasers = await QueueRepository.getAllBallChasersInQueue();

      await buttonInteraction.editReply({ 
        components: [MessageBuilder.queueFullButtons()],
        embeds: [MessageBuilder.fullQueueMessage(updatedBallchasers)]
      });

      break;
    }

    case "removeAll":{
      await QueueRepository.removeAllBallChasersFromQueue();

      await buttonInteraction.editReply({ 
        components: [MessageBuilder.queueButtons()],
        embeds: [MessageBuilder.emptyQueueMessage()]
      });

      break;
    }

    case "breakMatch":{
      await ActiveMatchRepository.removeAllPlayersInActiveMatch("<@929967919763439656>");

      await buttonInteraction.editReply({ 
        components: [MessageBuilder.queueButtons()],
        embeds: [MessageBuilder.emptyQueueMessage()]
      });
      
      break; 
    }
  }
});

NormClient.login(process.env.token);
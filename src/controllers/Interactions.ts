import { Interaction, TextChannel } from "discord.js";
import { DateTime } from "luxon";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import QueueRepository from "../repositories/QueueRepository";
import { BallChaser } from "../types/common";
import MessageBuilder from "../utils/MessageBuilder";
import { createRandomMatch } from "./MatchController";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";

export async function getCurrentQueue(queueChannel: TextChannel): Promise<void> {
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();

  await queueChannel.send({
    components: [MessageBuilder.queueButtons()],
    embeds: [MessageBuilder.queueMessage(ballchasers)],
  });
}

export async function onInteraction(buttonInteraction: Interaction, queueChannel: TextChannel): Promise<void> {
  if (!buttonInteraction.isButton()) return;
  await buttonInteraction.deferReply();

  switch (buttonInteraction.customId) {
    case "joinQueue": {

      const queueMember = await QueueRepository.getBallChaserInQueue(buttonInteraction.user.id);
      const leaderboardMember = await LeaderboardRepository.getPlayerStats(buttonInteraction.user.id);

      if (!queueMember) {
        const player: BallChaser = {
          id: buttonInteraction.user.id,
          isCap: false,
          mmr: leaderboardMember ? leaderboardMember.mmr : 100,
          name: buttonInteraction.user.username,
          queueTime: DateTime.now().plus({hours: 1}),
          team: null
        };
        await QueueRepository.addBallChaserToQueue(player);
      }

      const ballchasers = await QueueRepository.getAllBallChasersInQueue();

      queueChannel.messages.delete(buttonInteraction.message.id);

      await buttonInteraction.editReply({
        components: [MessageBuilder.queueButtons()],
        embeds: [MessageBuilder.queueMessage(ballchasers)],
      });

      break;
    }

    case "leaveQueue": {

      const member = await QueueRepository.getBallChaserInQueue(buttonInteraction.user.id);

      if (member != null) {
        await QueueRepository.removeBallChaserFromQueue(buttonInteraction.user.id);

        const remainingMembers = await QueueRepository.getAllBallChasersInQueue();

        queueChannel.messages.delete(buttonInteraction.message.id);

        await buttonInteraction.editReply({
          components: [MessageBuilder.queueButtons()],
          embeds: [MessageBuilder.queueMessage(remainingMembers)],
        });
      } else {
        const ballchasers = await QueueRepository.getAllBallChasersInQueue();

        queueChannel.messages.delete(buttonInteraction.message.id);

        await buttonInteraction.editReply({
          components: [MessageBuilder.queueButtons()],
          embeds: [MessageBuilder.queueMessage(ballchasers)],
        });
      }
      break;
    }

    case "randomizeTeams": {
      const ballchasers = await QueueRepository.getAllBallChasersInQueue();

      await createRandomMatch(ballchasers as BallChaser[]);

      queueChannel.messages.delete(buttonInteraction.message.id);

      await QueueRepository.removeAllBallChasersFromQueue();

      //Edit the reply to start a match.
      await buttonInteraction.editReply({
        components: [MessageBuilder.activeMatchButtons()],
        embeds: [MessageBuilder.activeMatchMessage(ballchasers)],
      });
      
      break;
    }

    case "createFullTeam": {
      const randName = ["Gamer 1", "Gamer 2", "Gamer 3", "Gamer 4", "Gamer 5", "Gamer 6"];

      const ballchasers = await QueueRepository.getAllBallChasersInQueue();
      const numPlayersToFill = 6 - ballchasers.length;

      for (let i = 0; i < numPlayersToFill; i++) {
        const player: BallChaser = {
          id: Guid.create().toString(),
          isCap: false,
          mmr: Math.floor(Math.random() * (300 - 0 + 1)) + 0,
          name: randName[i],
          queueTime: DateTime.now(),
          team: null,
        };
        await QueueRepository.addBallChaserToQueue(player);
      }

      const updatedBallchasers = await QueueRepository.getAllBallChasersInQueue();

      await buttonInteraction.editReply({
        components: [MessageBuilder.queueFullButtons()],
        embeds: [MessageBuilder.fullQueueMessage(updatedBallchasers)],
      });

      break;
    }

    case "removeAll": {
      await QueueRepository.removeAllBallChasersFromQueue();

      const ballchasers = await QueueRepository.getAllBallChasersInQueue();

      await buttonInteraction.editReply({
        components: [MessageBuilder.queueButtons()],
        embeds: [MessageBuilder.queueMessage(ballchasers)],
      });

      break;
    }

    case "breakMatch": {
      await ActiveMatchRepository.removeAllPlayersInActiveMatch("<@929967919763439656>");

      const ballchasers = await QueueRepository.getAllBallChasersInQueue();

      await buttonInteraction.editReply({
        components: [MessageBuilder.queueButtons()],
        embeds: [MessageBuilder.queueMessage(ballchasers)],
      });

      break;
    }
  }
}

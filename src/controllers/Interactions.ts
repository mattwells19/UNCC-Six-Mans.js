import { Interaction, TextChannel } from "discord.js";
import { DateTime } from "luxon";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import QueueRepository from "../repositories/QueueRepository";
import { BallChaser } from "../types/common";
import MessageBuilder from "../utils/MessageBuilder";

export async function getCurrentQueue(queueChannel: TextChannel): Promise<void> {
  
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();

  await queueChannel.send({ 
    components: [MessageBuilder.queueButtons],
    embeds: [MessageBuilder.queueMessage(ballchasers)]
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
        components: [MessageBuilder.queueButtons],
        embeds: [MessageBuilder.queueMessage(ballchasers)]
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
          components: [MessageBuilder.queueButtons],
          embeds: [MessageBuilder.queueMessage(remainingMembers)]
        });

      } else {
        const ballchasers = await QueueRepository.getAllBallChasersInQueue();

        queueChannel.messages.delete(buttonInteraction.message.id);

        await buttonInteraction.editReply({
          components: [MessageBuilder.queueButtons],
          embeds: [MessageBuilder.queueMessage(ballchasers)]
        });
      }
      break;
    }
  }
}

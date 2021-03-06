import { ButtonInteraction, Message, TextChannel } from "discord.js";
import { joinQueue, leaveQueue } from "../services/QueueService";
import MessageBuilder, { ButtonCustomID } from "../utils/MessageBuilder";
import { createRandomMatch } from "../services/MatchService";
import { PlayerInQueue } from "../repositories/QueueRepository/types";
import QueueRepository from "../repositories/QueueRepository";
import { setCaptains } from "../services/TeamAssignmentService";

export async function postCurrentQueue(queueChannel: TextChannel): Promise<Message> {
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();
  return await queueChannel.send(MessageBuilder.queueMessage(ballchasers));
}

export async function handleInteraction(buttonInteraction: ButtonInteraction): Promise<void> {
  const message = buttonInteraction.message;
  if (!(message instanceof Message)) return;

  switch (buttonInteraction.customId) {
    case ButtonCustomID.JoinQueue: {
      await message.edit(MessageBuilder.disabledQueueButtons(buttonInteraction));

      const ballchasers = await joinQueue(buttonInteraction.user.id, buttonInteraction.user.username);

      if (ballchasers) {
        if (ballchasers.length === 6) {
          await message.edit(MessageBuilder.fullQueueMessage(ballchasers));
        } else {
          await message.edit(MessageBuilder.queueMessage(ballchasers));
        }
      } else {
        await message.edit(MessageBuilder.enabledQueueButtons());
      }

      break;
    }

    case ButtonCustomID.LeaveQueue: {
      await message.edit(MessageBuilder.disabledQueueButtons(buttonInteraction));

      await leaveQueue(buttonInteraction.user.id)
        .then((remainingMembers) => {
          return message.edit(MessageBuilder.queueMessage(remainingMembers));
        })
        .catch(() => {
          return message.edit(MessageBuilder.enabledQueueButtons());
        });

      break;
    }

    case ButtonCustomID.CreateRandomTeam: {
      const playerInQueue = await QueueRepository.isPlayerInQueue(buttonInteraction.user.id);

      if (!playerInQueue) {
        break;
      } else {
        const currentMatch = await createRandomMatch();
        const emptyQueue: PlayerInQueue[] = [];

        await Promise.all([
          //Create new reply to start a match
          await message.channel.send(MessageBuilder.activeMatchMessage(currentMatch)),

          //Update the embed with an empty queue message
          await message.edit(MessageBuilder.queueMessage(emptyQueue)),
        ]);

        break;
      }
    }

    case ButtonCustomID.ChooseTeam: {
      const playerInQueue = await QueueRepository.isPlayerInQueue(buttonInteraction.user.id);

      if (playerInQueue) {
        const ballChasers = await QueueRepository.getAllBallChasersInQueue();
        const players = await setCaptains(ballChasers);

        await message.edit(MessageBuilder.blueChooseMessage(players));
        break;
      }
    }
  }
}

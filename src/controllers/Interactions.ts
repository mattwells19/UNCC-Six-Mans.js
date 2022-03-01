import { ButtonInteraction, Message, TextChannel } from "discord.js";
import QueueRepository from "../repositories/QueueRepository";
import { joinQueue, leaveQueue } from "../services/QueueService";
import MessageBuilder, { ButtonCustomID } from "../utils/MessageBuilder";
import { blueCaptainsChoice, createRandomMatch } from "../services/MatchService";
import { PlayerInQueue } from "../repositories/QueueRepository/types";

export async function postCurrentQueue(queueChannel: TextChannel): Promise<void> {
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();
  await queueChannel.send(MessageBuilder.queueMessage(ballchasers));
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
      const remainingMembers = await leaveQueue(buttonInteraction.user.id);

      if (remainingMembers) {
        await message.edit(MessageBuilder.queueMessage(remainingMembers));
      } else {
        await message.edit(MessageBuilder.enabledQueueButtons());
      }
      break;
    }

    case ButtonCustomID.CreateRandomTeam: {
      const ballchasers = await QueueRepository.getAllBallChasersInQueue();
      if (!ballchasers.find((player) => player.id === buttonInteraction.user.id)) {
        await message.edit(MessageBuilder.fullQueueMessage(ballchasers));
      }

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

    case ButtonCustomID.ChooseTeam: {
      // 🐧 I think it would be useful to add a `isPlayerInQueue` function to the QueueRepository to handle this check
      const ballchasers = await QueueRepository.getAllBallChasersInQueue();
      if (!ballchasers.find((player) => player.id === buttonInteraction.user.id)) {
        await message.edit(MessageBuilder.fullQueueMessage(ballchasers));
      }

      const players = await blueCaptainsChoice(null);

      await message.edit(MessageBuilder.blueChooseMessage(players));
      break;
    }
  }
}

import { Interaction, Message, TextChannel } from "discord.js";
import QueueRepository from "../repositories/QueueRepository";
import { joinQueue, leaveQueue } from "../services/QueueService";
import MessageBuilder, { ButtonCustomID } from "../utils/MessageBuilder";
import { createRandomMatch } from "../services/MatchService";

export async function postCurrentQueue(queueChannel: TextChannel): Promise<void> {
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();
  await queueChannel.send(MessageBuilder.queueMessage(ballchasers));
}

export async function handleInteraction(buttonInteraction: Interaction): Promise<void> {
  if (!buttonInteraction.isButton()) return;

  const message = buttonInteraction.message;
  if (!(message instanceof Message)) return;

  switch (buttonInteraction.customId) {
    case ButtonCustomID.JoinQueue: {
      await message.edit(MessageBuilder.disabledQueueButtons(buttonInteraction));
      const ballchasers = await joinQueue(buttonInteraction.user.id, buttonInteraction.user.username);

      if (ballchasers.length == 6) {
        await message.edit(MessageBuilder.fullQueueMessage(ballchasers));
      } else {
        await message.edit(MessageBuilder.queueMessage(ballchasers));
      }

      break;
    }
    case ButtonCustomID.LeaveQueue: {
      await message.edit(MessageBuilder.disabledQueueButtons(buttonInteraction));
      const remainingMembers = await leaveQueue(buttonInteraction.user.id);

      if (remainingMembers) {
        await message.edit(MessageBuilder.queueMessage(remainingMembers));
      } else {
        await message.edit(MessageBuilder.queueMessage([]));
      }
      break;
    }

    case ButtonCustomID.CreateRandomTeam: {
      const ballchasers = await createRandomMatch();

      //Edit the reply to start a match.
      await message.edit(MessageBuilder.activeMatchMessage(ballchasers));

      break;
    }
  }
}

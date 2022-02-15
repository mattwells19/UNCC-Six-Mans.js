import { Interaction, Message, TextChannel } from "discord.js";
import QueueRepository from "../repositories/QueueRepository";
import { joinQueue, leaveQueue } from "../services/QueueService";
import MessageBuilder, { ButtonCustomID } from "../utils/MessageBuilder";

export async function postCurrentQueue(queueChannel: TextChannel): Promise<void> {
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();
  await queueChannel.send(MessageBuilder.queueMessage(ballchasers));
}

export async function handleInteraction(buttonInteraction: Interaction): Promise<void> {
  if (!buttonInteraction.isButton()) return;

  const message = buttonInteraction.message;
  if (!(message instanceof Message)) return;

  await buttonInteraction.deferUpdate();

  switch (buttonInteraction.customId) {
    case ButtonCustomID.JoinQueue: {
      const ballchasers = await joinQueue(buttonInteraction.user.id, buttonInteraction.user.username);
      await message.edit(MessageBuilder.queueMessage(ballchasers));
      break;
    }
    case ButtonCustomID.LeaveQueue: {
      const remainingMembers = await leaveQueue(buttonInteraction.user.id);

      if (remainingMembers) {
        await message.edit(MessageBuilder.queueMessage(remainingMembers));
      }
      break;
    }
  }
}

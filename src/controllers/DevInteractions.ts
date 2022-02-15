import { Interaction, Message } from "discord.js";
import QueueRepository from "../repositories/QueueRepository";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import MessageBuilder, { ButtonCustomID } from "../utils/MessageBuilder";

export async function handleDevInteraction(buttonInteraction: Interaction): Promise<void> {
  if (!buttonInteraction.isButton()) return;

  const message = buttonInteraction.message;
  if (!(message instanceof Message)) return;

  await buttonInteraction.deferUpdate();

  switch (buttonInteraction.customId) {
    case ButtonCustomID.FillTeam: {

      break;
    }
    case ButtonCustomID.RemoveAll: {
      await QueueRepository.removeAllBallChasersFromQueue();

      const ballChasers = await QueueRepository.getAllBallChasersInQueue();
      await message.edit(MessageBuilder.queueMessage(ballChasers));
      break;
    }
    case ButtonCustomID.BreakMatch: {
      await ActiveMatchRepository.removeAllPlayersInActiveMatch("<@929967919763439656>");

      const ballChasers = await QueueRepository.getAllBallChasersInQueue();
      await message.edit(MessageBuilder.queueMessage(ballChasers));
      break;
    }
  }
}
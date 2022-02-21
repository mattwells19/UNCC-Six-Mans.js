import { Interaction, Message } from "discord.js";
import QueueRepository from "../repositories/QueueRepository";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import MessageBuilder, { ButtonCustomID } from "../utils/MessageBuilder";
import { fillTeams } from "../utils/devFillTeams";

export async function handleDevInteraction(buttonInteraction: Interaction): Promise<void> {
  if (!buttonInteraction.isButton()) return;

  const message = buttonInteraction.message;
  if (!(message instanceof Message)) return;

  switch (buttonInteraction.customId) {
    case ButtonCustomID.FillTeam: {
      const fullTeam = await fillTeams();

      await message.edit(MessageBuilder.fullQueueMessage(fullTeam));
      break;
    }
    case ButtonCustomID.RemoveAll: {
      await QueueRepository.removeAllBallChasersFromQueue();

      const ballChasers = await QueueRepository.getAllBallChasersInQueue();
      await message.edit(MessageBuilder.queueMessage(ballChasers));
      break;
    }
    case ButtonCustomID.BreakMatch: {
      await ActiveMatchRepository.removeAllPlayersInActiveMatch("346838372649795595");

      const ballChasers = await QueueRepository.getAllBallChasersInQueue();
      await message.edit(MessageBuilder.queueMessage(ballChasers));
      break;
    }
  }
}

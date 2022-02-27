import { Message, SelectMenuInteraction } from "discord.js";
import QueueRepository from "../repositories/QueueRepository";
import { blueCaptainsChoice, orangeCaptainsChoice } from "../services/MatchService";
import { createMatchFromChosenTeams } from "../services/TeamAssignmentService";
import { Team } from "../types/common";
import getEnvVariable from "../utils/getEnvVariable";
import MessageBuilder, { MenuCustomID } from "../utils/MessageBuilder";

export async function handleMenuInteraction(menuInteraction: SelectMenuInteraction): Promise<void> {
  const message = menuInteraction.message;
  if (!(message instanceof Message)) return;

  const isDev = getEnvVariable("ENVIRONMENT") === "dev";

  switch (menuInteraction.customId) {
    case MenuCustomID.BlueSelect: {
      // If user is not the captain and not in dev
      const ballchasers = await QueueRepository.getAllBallChasersInQueue();
      if (
        !ballchasers.find(
          (player) => player.isCap && player.team === Team.Blue && player.id === menuInteraction.user.id
        ) &&
        !isDev
      ) {
        await message.edit(MessageBuilder.blueChooseMessage(ballchasers));
        break;
      } else {
        const updatedPlayers = await blueCaptainsChoice(menuInteraction.values[0]);

        await message.edit(MessageBuilder.orangeChooseMessage(updatedPlayers));
        break;
      }
    }
    case MenuCustomID.OrangeSelect: {
      // If user is not the captain and not in dev
      const ballchasers = await QueueRepository.getAllBallChasersInQueue();
      if (
        !ballchasers.find(
          (player) => player.isCap && player.team === Team.Orange && player.id === menuInteraction.user.id
        ) &&
        !isDev
      ) {
        await message.edit(MessageBuilder.orangeChooseMessage(ballchasers));
        break;
      } else {
        await orangeCaptainsChoice(menuInteraction.values);

        const match = await createMatchFromChosenTeams();

        await message.edit(MessageBuilder.activeMatchMessage(match));
        break;
      }
    }
  }
}

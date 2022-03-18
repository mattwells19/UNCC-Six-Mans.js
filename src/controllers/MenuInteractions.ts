import { Message, SelectMenuInteraction } from "discord.js";
import QueueRepository from "../repositories/QueueRepository";
import { PlayerInQueue } from "../repositories/QueueRepository/types";
import { createMatchFromChosenTeams } from "../services/MatchService";
import { bluePlayerChosen, orangePlayerChosen } from "../services/TeamAssignmentService";
import { Team } from "../types/common";
import { getEnvVariable } from "../utils";
import MessageBuilder, { MenuCustomID } from "../utils/MessageBuilder";

export async function handleMenuInteraction(menuInteraction: SelectMenuInteraction): Promise<void> {
  const message = menuInteraction.message;
  if (!(message instanceof Message)) return;

  const isDev = getEnvVariable("ENVIRONMENT") === "dev";

  switch (menuInteraction.customId) {
    case MenuCustomID.BlueSelect: {
      // If user is not the captain and not in dev
      const isCaptain = await QueueRepository.isTeamCaptain(menuInteraction.user.id, Team.Blue);
      if (isCaptain || isDev) {
        const playersLeft = await bluePlayerChosen(menuInteraction.values[0]);

        await message.edit(MessageBuilder.orangeChooseMessage(playersLeft));
        break;
      }

      break;
    }
    case MenuCustomID.OrangeSelect: {
      // If user is not the captain and not in dev
      const isCaptain = await QueueRepository.isTeamCaptain(menuInteraction.user.id, Team.Orange);
      const emptyQueue: PlayerInQueue[] = [];
      if (isCaptain || isDev) {
        await orangePlayerChosen(menuInteraction.values);

        const match = await createMatchFromChosenTeams();

        Promise.all([
          await message.channel.send(await MessageBuilder.activeMatchMessage(match)),
          await message.edit(MessageBuilder.queueMessage(emptyQueue)),
        ]);
        break;
      }

      break;
    }
  }
}

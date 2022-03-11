import { CommandInteraction, GuildMemberRoleManager, Message } from "discord.js";
import QueueRepository from "../repositories/QueueRepository";
import { REST } from "@discordjs/rest";
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from "discord-api-types/v9";
import { SlashCommandBuilder } from "@discordjs/builders";
import MessageBuilder from "../utils/MessageBuilder";
import { kickPlayerFromQueue, updateMmrMultiplier } from "../services/AdminService";
import { InvalidCommand } from "../utils/InvalidCommand";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import { isActiveMatchEmbed, isQueueEmbed } from "../utils/discordUtils";

const enum AdminCommandOptions {
  Kick = "kick",
  Clear = "clear",
  ForceBrokenQueue = "forcebrokenq",
  MmrMultiplier = "mmrmult",
}

export async function handleAdminInteraction(
  slashCommandInteraction: CommandInteraction,
  queueMessages: Array<Message>
) {
  const memberRoles = slashCommandInteraction.member?.roles;
  if (
    !memberRoles ||
    (memberRoles instanceof GuildMemberRoleManager && memberRoles.cache.every((role) => role.name !== "Bot Admin")) ||
    (Array.isArray(memberRoles) && !memberRoles.includes("Bot Admin"))
  ) {
    await slashCommandInteraction.editReply(
      // eslint-disable-next-line max-len
      "What do you think you're doing? Trying to run an admin command when you're not a Bot Admin. Typical. How dare you even consider that my parents didn't think to check this. You think this is their first time writing code? Of course not! Now scram before I call my parents to come pick me up."
    );
    return;
  }

  switch (slashCommandInteraction.commandName) {
    case AdminCommandOptions.Kick: {
      const playerToRemove = slashCommandInteraction.options.getUser("player");
      if (!playerToRemove) return;

      try {
        const updatedList = await kickPlayerFromQueue(playerToRemove.id);

        const queueEmbed = queueMessages.find((msg) => isQueueEmbed(msg));

        await Promise.all([
          queueEmbed?.edit(MessageBuilder.queueMessage(updatedList)),
          slashCommandInteraction.editReply(`${playerToRemove.username} has been removed from the queue.`),
        ]);
      } catch (err) {
        if (err instanceof InvalidCommand) {
          await slashCommandInteraction.editReply(
            `Error trying to remove: ${playerToRemove.username}\n${err.name}: ${err.message}`
          );
        }
      }

      break;
    }
    case AdminCommandOptions.Clear: {
      // leaving this out of the Promise.all in case it fails we don't want to do the other two
      await QueueRepository.removeAllBallChasersFromQueue();

      const queueEmbed = queueMessages.find((msg) => isQueueEmbed(msg));
      if (!queueEmbed) throw new Error("No queue embed to update.");

      await Promise.all([
        queueEmbed.edit(MessageBuilder.queueMessage([])),
        slashCommandInteraction.editReply("Queue has been cleared."),
      ]);
      break;
    }
    case AdminCommandOptions.ForceBrokenQueue: {
      const player = slashCommandInteraction.options.getUser("player");
      if (!player) return;

      try {
        await ActiveMatchRepository.removeAllPlayersInActiveMatch(player.id);

        const activeMatchEmbed = queueMessages.find((msg) => {
          return isActiveMatchEmbed(msg) && msg.embeds[0].fields.some((field) => field.value.includes(player.id));
        });

        await Promise.all([
          slashCommandInteraction.editReply("Active match has been removed."),
          activeMatchEmbed?.delete(),
        ]);
      } catch (err) {
        if (err instanceof InvalidCommand) {
          await slashCommandInteraction.editReply(
            `Error trying to remove match with ${player.username}.\n${err.name}: ${err.message}`
          );
        }
      }
      break;
    }
    case AdminCommandOptions.MmrMultiplier: {
      const newMmrMult = slashCommandInteraction.options.getNumber("mmr");
      // has to be strict null check since 0 would evaluate to true but is allowed
      if (newMmrMult === null) return;

      try {
        await updateMmrMultiplier(newMmrMult);
        await slashCommandInteraction.editReply(`MMR multiplier has been set to ${newMmrMult}.`);
      } catch (err) {
        if (err instanceof InvalidCommand) {
          await slashCommandInteraction.editReply(
            `Error trying to update MMR multiplier to ${newMmrMult}.\n${err.name}: ${err.message}`
          );
        }
      }
      break;
    }
  }
}

export async function registerAdminSlashCommands(clientId: string, guildId: string, token: string) {
  const rest = new REST({ version: "9" }).setToken(token);

  const kickCommand = new SlashCommandBuilder()
    .setName(AdminCommandOptions.Kick)
    .setDescription("Removes a player from the queue.")
    .addUserOption((option) => {
      return option.setName("player").setDescription("The player you want to remove.").setRequired(true);
    })
    .toJSON();

  const clearCommand = new SlashCommandBuilder()
    .setName(AdminCommandOptions.Clear)
    .setDescription("Clears the queue.")
    .toJSON();

  const brokenQueueCommand = new SlashCommandBuilder()
    .setName(AdminCommandOptions.ForceBrokenQueue)
    .setDescription("Removes an active match without reporting a winner.")
    .addUserOption((option) => {
      return option.setName("player").setDescription("One of the players in the match to remove.").setRequired(true);
    })
    .toJSON();

  const mmrMultiplierCommand = new SlashCommandBuilder()
    .setName(AdminCommandOptions.MmrMultiplier)
    .setDescription("Update the MMR multiplier.")
    .addNumberOption((option) => {
      return option.setName("mmr").setDescription("New MMR multiplier.").setMinValue(0).setRequired(true);
    })
    .toJSON();

  try {
    const commands: Array<RESTPostAPIApplicationCommandsJSONBody> = [
      brokenQueueCommand,
      clearCommand,
      kickCommand,
      mmrMultiplierCommand,
    ];

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
  } catch (error) {
    console.error(error);
  }
}

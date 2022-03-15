import { ButtonInteraction, Message, TextChannel } from "discord.js";
import { joinQueue, leaveQueue } from "../services/QueueService";
import MessageBuilder, { ButtonCustomID } from "../utils/MessageBuilder";
import { getDiscordChannelById } from "../utils/discordUtils";
import { createRandomMatch } from "../services/MatchService";
import { PlayerInQueue } from "../repositories/QueueRepository/types";
import { isConfirm } from "../services/MatchReportService";
import { updateLeaderboardChannel } from "./LeaderboardChannelController";
import { getClient } from "..";
import { getEnvVariable } from "../utils";
import QueueRepository from "../repositories/QueueRepository";
import { setCaptains } from "../services/TeamAssignmentService";
import { Team } from "../types/common";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";

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
          await message.channel.send(await MessageBuilder.activeMatchMessage(currentMatch)),

          //Update the embed with an empty queue message
          await message.edit(MessageBuilder.queueMessage(emptyQueue)),
        ]);
      }
      break;
    }

    case ButtonCustomID.ChooseTeam: {
      const playerInQueue = await QueueRepository.isPlayerInQueue(buttonInteraction.user.id);

      if (playerInQueue) {
        const ballChasers = await QueueRepository.getAllBallChasersInQueue();
        const players = await setCaptains(ballChasers);

        await message.edit(MessageBuilder.blueChooseMessage(players));
      }
      break;
    }

    case ButtonCustomID.ReportBlue: {
      // 🐧 It looks like isConfirm is doing everything. When we talked last time I recommended using isConfirm
      // as a way to just check whether the player reporting put us in the report or confirm state and then calling
      // reportMatch or confirmMatch from here in the controller. This way isn't wrong. I would just give the function
      // a different name since I can't tell that it's calling reportMatch/confirMatch just from the name.
      if (await isConfirm(Team.Blue, buttonInteraction.user.id)) {
        await message.delete();
        const leaderboardChannelId = getEnvVariable("leaderboard_channel_id");
        await getDiscordChannelById(await getClient(), leaderboardChannelId).then((leaderboardChannel) => {
          if (leaderboardChannel) {
            updateLeaderboardChannel(leaderboardChannel);
          }
        });
      } else if (await ActiveMatchRepository.isPlayerInActiveMatch(buttonInteraction.user.id)) {
        const previousEmbed = message.embeds[0];
        await message.edit(await MessageBuilder.reportedTeamButtons(buttonInteraction, previousEmbed));
      }
      break;
    }

    case ButtonCustomID.ReportOrange: {
      // 🐧 I think it'd be a bit cleaner to assign await calls to variables then put the variable in the if. So:
      // const matchConfirmed = await isConfirm(...);
      // if (matchConfirmed) {...}
      // Just makes it a bit easier to read.
      if (await isConfirm(Team.Orange, buttonInteraction.user.id)) {
        // 🐧 From here down it looks like this is the exact same code as ReportBlue. Can this be a single function for
        // both cases instead of duplicating it?
        await message.delete();
        const leaderboardChannelId = getEnvVariable("leaderboard_channel_id");
        await getDiscordChannelById(await getClient(), leaderboardChannelId).then((leaderboardChannel) => {
          if (leaderboardChannel) {
            updateLeaderboardChannel(leaderboardChannel);
          }
        });
      } else if (await ActiveMatchRepository.isPlayerInActiveMatch(buttonInteraction.user.id)) {
        const previousEmbed = message.embeds[0];
        await message.edit(await MessageBuilder.reportedTeamButtons(buttonInteraction, previousEmbed));
      }
      break;
    }
  }
}

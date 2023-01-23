import { ButtonInteraction, Client, Message, TextChannel } from "discord.js";
import { joinQueue, leaveQueue } from "../services/QueueService";
import MessageBuilder from "../utils/MessageHelper/MessageBuilder";
import { getDiscordChannelById } from "../utils/discordUtils";
import { createRandomMatch, getActiveMatch } from "../services/MatchService";
import { PlayerInQueue } from "../repositories/QueueRepository/types";
import { checkReport } from "../services/MatchReportService";
import { updateLeaderboardChannel } from "./LeaderboardChannelController";
import { getEnvVariable } from "../utils";
import QueueRepository from "../repositories/QueueRepository";
import { setCaptains } from "../services/TeamAssignmentService";
import { Team } from "../types/common";
import ActiveMatchRepository from "../repositories/ActiveMatchRepository";
import { ButtonCustomID } from "../utils/MessageHelper/CustomButtons";

export async function postCurrentQueue(queueChannel: TextChannel): Promise<Message> {
  const ballchasers = await QueueRepository.getAllBallChasersInQueue();
  return await queueChannel.send(MessageBuilder.queueMessage(ballchasers));
}

export async function handleInteraction(
  buttonInteraction: ButtonInteraction,
  NormClient: Client<boolean>
): Promise<void> {
  const message = buttonInteraction.message;
  if (!(message instanceof Message)) return;

  switch (buttonInteraction.customId) {
    case ButtonCustomID.JoinQueue: {
      const ballchasers = await joinQueue(buttonInteraction.user.id, buttonInteraction.user.username);

      if (ballchasers) {
        if (ballchasers.length === 6) {
          await QueueRepository.resetCaptainsRandomVoters();
          await message.edit(MessageBuilder.fullQueueMessage(ballchasers));
        } else {
          await message.edit(MessageBuilder.queueMessage(ballchasers));
        }
      }

      break;
    }

    case ButtonCustomID.LeaveQueue: {
      await leaveQueue(buttonInteraction.user.id).then((remainingMembers) => {
        return message.edit(MessageBuilder.queueMessage(remainingMembers));
      });

      break;
    }

    case ButtonCustomID.CreateRandomTeam: {
      await captainsRandomVote(buttonInteraction, message);
      break;
    }

    case ButtonCustomID.ChooseTeam: {
      await captainsRandomVote(buttonInteraction, message);
      break;
    }

    case ButtonCustomID.ReportBlue: {
      await report(buttonInteraction, Team.Blue, message, NormClient);
      break;
    }

    case ButtonCustomID.ReportOrange: {
      await report(buttonInteraction, Team.Orange, message, NormClient);
      break;
    }

    case ButtonCustomID.BrokenQueue: {
      await brokenQueue(buttonInteraction, message);
      break;
    }
  }
}

async function captainsRandomVote(buttonInteraction: ButtonInteraction, message: Message) {
  const playerInQueue = await QueueRepository.isPlayerInQueue(buttonInteraction.user.id);
  if (!playerInQueue) return;
  const ballChasers = await QueueRepository.getAllBallChasersInQueue();

  const vote = await QueueRepository.countCaptainsRandomVote(buttonInteraction);

  if (vote.captains >= 4) {
    QueueRepository.resetCaptainsRandomVoters();
    const ballChasers = await QueueRepository.getAllBallChasersInQueue();
    const players = await setCaptains(ballChasers);

    await message.edit(MessageBuilder.captainChooseMessage(true, players));
  } else if (vote.random >= 4) {
    QueueRepository.resetCaptainsRandomVoters();
    const currentMatch = await createRandomMatch();
    const emptyQueue: PlayerInQueue[] = [];

    await Promise.all([
      //Create new reply to start a match
      await message.channel.send(MessageBuilder.activeMatchMessage(currentMatch)),

      //Update the embed with an empty queue message
      await message.edit(MessageBuilder.queueMessage(emptyQueue)),
    ]);
  } else {
    const captainsVotes = vote.captains;
    const randomVotes = vote.random;
    const players = await QueueRepository.getCaptainsRandomVoters();
    const voterList: PlayerInQueue[] = [];

    for (const key of players.keys()) {
      const player = await QueueRepository.getBallChaserInQueue(key);
      if (player) {
        voterList.push(player);
      }
      break;
    }
    await message.edit(
      MessageBuilder.voteCaptainsOrRandomMessage(ballChasers, captainsVotes, randomVotes, voterList, players)
    );
  }
}

async function report(buttonInteraction: ButtonInteraction, team: Team, message: Message, NormClient: Client) {
  const playerInMatch = await ActiveMatchRepository.isPlayerInActiveMatch(buttonInteraction.user.id);
  if (!playerInMatch) return;

  const confirmReport = await checkReport(team, buttonInteraction.user.id);

  if (confirmReport) {
    await message.delete();
    const leaderboardChannelId = getEnvVariable("leaderboard_channel_id");
    await getDiscordChannelById(NormClient, leaderboardChannelId).then((leaderboardChannel) => {
      if (leaderboardChannel) {
        updateLeaderboardChannel(leaderboardChannel);
      }
    });
  } else {
    const previousEmbed = message.embeds[0];
    await message.edit(MessageBuilder.reportedTeamButtons(buttonInteraction, previousEmbed));
  }
}

async function brokenQueue(buttonInteraction: ButtonInteraction, message: Message) {
  const playerinMatch = await ActiveMatchRepository.isPlayerInActiveMatch(buttonInteraction.user.id);
  if (!playerinMatch) return;
  let vote = false;
  const playerVoting = await ActiveMatchRepository.getPlayerInActiveMatch(buttonInteraction.user.id);
  if (playerVoting?.brokenQueue == false) {
    vote = true;
  } else {
    vote = false;
  }
  await ActiveMatchRepository.updatePlayerInActiveMatch(buttonInteraction.user.id, {
    brokenQueue: vote,
  });

  const brokenQueueVotes = await ActiveMatchRepository.getAllBrokenQueueVotesInActiveMatch(buttonInteraction.user.id);
  if (brokenQueueVotes >= 4) {
    message.delete();
    await ActiveMatchRepository.removeAllPlayersInActiveMatch(buttonInteraction.user.id);
  } else {
    const teams = await ActiveMatchRepository.getAllBrokenQueueVotersInActiveMatch(buttonInteraction.user.id);
    const currentMatch = await getActiveMatch(buttonInteraction.user.id);
    await Promise.all([
      await message.edit(MessageBuilder.voteBrokenQueueMessage(currentMatch, teams, brokenQueueVotes)),
    ]);
  }
}

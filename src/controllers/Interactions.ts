/* eslint-disable no-console */
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
      const time = new Date().getTime();
      const queue = await QueueRepository.getAllBallChasersInQueue();
      if (!QueueRepository.isPlayerInQueue(buttonInteraction.user.id) && queue.length === 6) return;
      const ballchasers = await joinQueue(buttonInteraction.user.id, buttonInteraction.user.username);

      if (ballchasers) {
        if (queue.length === 6) {
          const list = ballchasers.map((ballChaser) => {
            return `<@${ballChaser.id}> `;
          });

          const msg = await message.channel.send({ content: list.toString() });
          msg;
          Promise.all([
            msg.delete(),
            message.edit(MessageBuilder.fullQueueMessage(ballchasers)),
            QueueRepository.resetCaptainsRandomVoters(),
          ]);
          const diff = new Date().getTime() - time;
          console.log(`Join: ${buttonInteraction.user.username} - ${diff}ms`);
        } else if (queue.length === 0) {
          const msg = await message.channel.send({ content: "@here" });
          msg;
          Promise.all([msg.delete(), message.edit(MessageBuilder.queueMessage(ballchasers))]);
          const diff = new Date().getTime() - time;
          console.log(`Join: ${buttonInteraction.user.username} - ${diff}ms`);
        } else {
          message.edit(MessageBuilder.queueMessage(ballchasers));
          const diff = new Date().getTime() - time;
          console.log(`Join: ${buttonInteraction.user.username} - ${diff}ms`);
        }
      }

      break;
    }

    case ButtonCustomID.LeaveQueue: {
      const time = new Date().getTime();
      await leaveQueue(buttonInteraction.user.id).then(async (remainingMembers) => {
        return message.edit(MessageBuilder.queueMessage(remainingMembers));
      });
      const diff = new Date().getTime() - time;
      console.log(`Leave: ${buttonInteraction.user.username} - ${diff}ms`);
      break;
    }

    case ButtonCustomID.CreateRandomTeam: {
      const randInteraction = new Date().getTime();
      await captainsRandomVote(buttonInteraction, message);
      const totaltime = new Date().getTime() - randInteraction;
      if (totaltime > 500) {
        console.log(`Random Rate Limiting ${buttonInteraction.createdAt}!\nTook ${totaltime}ms to respond!`);
      }
      break;
    }

    case ButtonCustomID.ChooseTeam: {
      const captainInteraction = new Date().getTime();
      await captainsRandomVote(buttonInteraction, message);
      const totaltime = new Date().getTime() - captainInteraction;
      if (totaltime > 500) {
        console.log(`Captain Rate Limiting ${buttonInteraction.createdAt}!\nTook ${totaltime}ms to respond!`);
      }
      break;
    }

    case ButtonCustomID.ReportBlue: {
      const time = new Date().getTime();
      await report(buttonInteraction, Team.Blue, message, NormClient);
      const diff = new Date().getTime() - time;
      console.log(`Report Blue: ${buttonInteraction.user.username} - ${diff}ms`);
      break;
    }

    case ButtonCustomID.ReportOrange: {
      const time = new Date().getTime();
      await report(buttonInteraction, Team.Orange, message, NormClient);
      const diff = new Date().getTime() - time;
      console.log(`Report Orange: ${buttonInteraction.user.username} - ${diff}ms`);
      break;
    }

    case ButtonCustomID.BrokenQueue: {
      const time = new Date().getTime();
      await brokenQueue(buttonInteraction, message);
      const diff = new Date().getTime() - time;
      console.log(`Broken Queue: ${buttonInteraction.user.username} - ${diff}ms`);
      break;
    }
  }
}

async function captainsRandomVote(buttonInteraction: ButtonInteraction, message: Message) {
  const time = new Date().getTime();
  const playerInQueue = await QueueRepository.isPlayerInQueue(buttonInteraction.user.id);
  if (!playerInQueue) return;
  const ballChasers = await QueueRepository.getAllBallChasersInQueue();

  const vote = await QueueRepository.countCaptainsRandomVote(buttonInteraction);

  if (vote.captains == 4) {
    const players = await setCaptains(ballChasers);
    await message.edit(MessageBuilder.captainChooseMessage(true, players));
  } else if (vote.random == 4) {
    const currentMatch = await createRandomMatch();
    const emptyQueue: PlayerInQueue[] = [];

    await Promise.all([
      //Create new reply to start a match
      await message.channel.send(await MessageBuilder.activeMatchMessage(currentMatch)),

      //Update the embed with an empty queue message
      await message.edit(MessageBuilder.queueMessage(emptyQueue)),
    ]);

    QueueRepository.resetCaptainsRandomVoters();
  } else if (vote.captains > 4 || vote.random > 4) return;
  else {
    const players = await QueueRepository.getCaptainsRandomVoters();
    const captainsVotes = vote.captains;
    const randomVotes = vote.random;
    const voterList: PlayerInQueue[] = [];

    for (const key of players.keys()) {
      const player = await QueueRepository.getBallChaserInQueue(key);
      if (player) {
        voterList.push(player);
      }
      // break;
    }
    Promise.all([
      await message.edit(
        MessageBuilder.voteCaptainsOrRandomMessage(ballChasers, captainsVotes, randomVotes, voterList, players)
      ),
    ]);
    const diff = new Date().getTime() - time;
    console.log(`${buttonInteraction.customId}: ${buttonInteraction.user.username} - ${diff}ms`);
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
      message.edit(await MessageBuilder.voteBrokenQueueMessage(currentMatch, teams, brokenQueueVotes)),
    ]);
  }
}

/* eslint-disable no-console */
import { ButtonInteraction, Client, Message, MessageActionRow, MessageButton, TextChannel } from "discord.js";
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
      console.log(`Join: ${buttonInteraction.user.username}`);

      if (ballchasers) {
        if (ballchasers.length === 6) {
          const list = ballchasers.map((ballChaser) => {
            return `<@${ballChaser.id}> `;
          });

          const msg = await message.channel.send({ content: list.toString() });
          msg;
          await Promise.all([
            msg.delete(),
            message.edit(MessageBuilder.fullQueueMessage(ballchasers)),
            QueueRepository.resetCaptainsRandomVoters(),
          ]);
          // msg;
          // await msg.delete();
          // await message.edit(MessageBuilder.fullQueueMessage(ballchasers));
          // await QueueRepository.resetCaptainsRandomVoters();
        } else if (ballchasers.length === 1) {
          const msg = await message.channel.send({ content: "@here" });
          msg;
          await Promise.all([msg.delete(), message.edit(MessageBuilder.queueMessage(ballchasers))]);
          // msg;
          // await msg.delete();
          // await message.edit(MessageBuilder.queueMessage(ballchasers));
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
      const randInteraction = new Date().getTime();
      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId(ButtonCustomID.ChooseTeam)
            .setDisabled(true)
            .setStyle("PRIMARY")
            .setLabel("Please Wait...")
        )
        .addComponents(
          new MessageButton()
            .setCustomId(ButtonCustomID.CreateRandomTeam)
            .setDisabled(true)
            .setStyle("PRIMARY")
            .setLabel("Please Wait...")
        );

      await buttonInteraction.followUp({
        content: "Your selection has been recorded: **Random**",
        ephemeral: true,
      });
      await message.edit({ components: [row] });
      const totaltime = new Date().getTime() - randInteraction;
      await captainsRandomVote(buttonInteraction, message);
      if (totaltime > 500) {
        console.log(`Random Rate Limiting ${buttonInteraction.createdAt}!\nTook ${totaltime}ms to respond!\n`);
      }
      // await message.edit({ components: [row] });
      // await captainsRandomVote(buttonInteraction, message);
      break;
    }

    case ButtonCustomID.ChooseTeam: {
      const captainInteraction = new Date().getTime();
      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId(ButtonCustomID.ChooseTeam)
            .setDisabled(true)
            .setStyle("PRIMARY")
            .setLabel("Please Wait...")
        )
        .addComponents(
          new MessageButton()
            .setCustomId(ButtonCustomID.CreateRandomTeam)
            .setDisabled(true)
            .setStyle("PRIMARY")
            .setLabel("Please Wait...")
        );

      await buttonInteraction.followUp({
        content: "Your selection has been recorded: **Captains**",
        ephemeral: true,
      });
      await message.edit({ components: [row] });
      const totaltime = new Date().getTime() - captainInteraction;
      await captainsRandomVote(buttonInteraction, message);
      if (totaltime > 500) {
        console.log(`Captain Rate Limiting ${buttonInteraction.createdAt}!\nTook ${totaltime}ms to respond!\n`);
      }
      // await message.edit({ components: [row] });
      // await captainsRandomVote(buttonInteraction, message);
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
  const test = new Date().getTime();
  const playerInQueue = await QueueRepository.isPlayerInQueue(buttonInteraction.user.id);
  if (!playerInQueue) return;
  const ballChasers = await QueueRepository.getAllBallChasersInQueue();

  const vote = await QueueRepository.countCaptainsRandomVote(buttonInteraction);

  if (vote.captains >= 4) {
    const ballChasers = await QueueRepository.getAllBallChasersInQueue();
    const players = await setCaptains(ballChasers);
    Promise.all([message.edit(MessageBuilder.captainChooseMessage(true, players))]);
    QueueRepository.resetCaptainsRandomVoters();
  } else if (vote.random >= 4) {
    const currentMatch = await createRandomMatch();
    const emptyQueue: PlayerInQueue[] = [];

    await Promise.all([
      //Create new reply to start a match
      await message.channel.send(MessageBuilder.activeMatchMessage(currentMatch)),

      //Update the embed with an empty queue message
      await message.edit(MessageBuilder.queueMessage(emptyQueue)),
    ]);

    QueueRepository.resetCaptainsRandomVoters();
  } else {
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
    const promess = new Date().getTime() - test;
    console.log(`Captains/Random - ${buttonInteraction.user.username}: ${promess}ms\n`);
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

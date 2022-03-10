import { Message } from "discord.js";
import QueueRepository from "../repositories/QueueRepository";
import { checkQueueTimes } from "../services/QueueService";
import MessageBuilder from "../utils/MessageBuilder";

export function startQueueTimer(queueEmbed: Message) {
  let minuteCounter = 0;

  setInterval(async () => {
    minuteCounter++;

    const updatedList = await checkQueueTimes();

    if (updatedList) {
      await queueEmbed.edit(MessageBuilder.queueMessage(updatedList));
    } else if (minuteCounter === 5) {
      const allPlayers = await QueueRepository.getAllBallChasersInQueue();

      if (allPlayers.length > 0) {
        await queueEmbed.edit(MessageBuilder.queueMessage(allPlayers));
      }
    }

    if (minuteCounter === 5) {
      minuteCounter = 0;
    }
    // every 1 minute
  }, 1 * 60 * 1000);
}

import { Message } from "discord.js";
import QueueRepository from "../repositories/QueueRepository";
import { checkQueueTimes } from "../services/QueueService";
import MessageBuilder from "../utils/MessageBuilder";

export function startQueueTimers(queueEmbed: Message) {
  let minuteCounter = 0;

  setInterval(() => {
    minuteCounter++;

    if (minuteCounter === 5) {
      QueueRepository.getAllBallChasersInQueue()
        .then((updatedList) => {
          if (updatedList.length > 0) {
            return queueEmbed.edit(MessageBuilder.queueMessage(updatedList));
          }
        })
        .finally(() => {
          minuteCounter = 0;
        });
    } else {
      checkQueueTimes().then((updatedList) => {
        if (updatedList) {
          queueEmbed.edit(MessageBuilder.queueMessage(updatedList));
        }
      });
    }
    // every 1 minute
  }, 1 * 60 * 1000);
}

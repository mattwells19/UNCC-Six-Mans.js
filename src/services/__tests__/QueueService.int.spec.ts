import QueueRepository from "../../repositories/QueueRepository";
import { joinQueue } from "../QueueService";
import { leaveQueue } from "../QueueService";
import { BallChaserQueueBuilder } from "../../../.jest/Builder";
import { DateTime } from "luxon";

const mockPlayer1 = BallChaserQueueBuilder.single({
  queueTime: DateTime.now(),
});

describe("QueueService tests", () => {
  describe("Joining queue", () => {
    describe("Not already in queue", () => {
      it("joins a player to the queue if they are not already in the queue", async () => {
        joinQueue(mockPlayer1.id, mockPlayer1.name);
        const result = await joinQueue(mockPlayer1.id, mockPlayer1.name);

        expect([result[0]]).toBe(QueueRepository.getAllBallChasersInQueue());
        expect([result].length).toEqual([await QueueRepository.getAllBallChasersInQueue()].length);
      });

      it("Not on leaderboard | joins queue with 100 MMR and queue time 1 hour from now", async () => {
        joinQueue(mockPlayer1.id, mockPlayer1.name);
        const result = await joinQueue(mockPlayer1.id, mockPlayer1.name);
        let mmr = result[0].mmr;
        let queueTime = result[0].queueTime;

        expect(mmr).toEqual(100);
        expect(queueTime).toEqual(DateTime.now().plus({ minutes: 60 }));
      });
      it.todo("On leaderboard | joins queue with Leaderboard MMR and queue time 1 hour from now");
    });

    it.todo("Already in the queue | updates queue time to 1 hour from now");
  });

  describe("Leaving queue", () => {
    it.todo("removes player from queue when they exist");
    it.todo("does nothing if player is not in queue");
  });
});

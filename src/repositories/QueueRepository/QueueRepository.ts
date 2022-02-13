import { BallChaser } from "../../types/common";
import { UpdateBallChaserOptions } from "./types";
import { PrismaClient, Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import LeaderboardRepository from "../LeaderboardRepository";

type PlayerInQueueResponse = Omit<BallChaser, "mmr"> & {
  mmr: number | null;
};

export class QueueRepository {
  #Queue: Prisma.QueueDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;
  #BallChasers: Prisma.BallChaserDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;

  constructor() {
    this.#Queue = new PrismaClient().queue;
    this.#BallChasers = new PrismaClient().ballChaser;
  }

  /**
   * Retrieves a BallChaser with a specific Discord ID
   * @param id Discord ID of the BallChaser to retrieve
   * @returns A BallChaser object if the player is found, otherwise null
   */
  async getBallChaserInQueue(id: number): Promise<Readonly<PlayerInQueueResponse> | null> {
    const playerInQueue = await this.#Queue.findUnique({
      include: {
        player: true,
      },
      where: {
        playerId: id,
      },
    });
    if (playerInQueue) {
      const lb = await LeaderboardRepository.getPlayerStats(id);
      return {
        id: playerInQueue.player.id,
        isCap: playerInQueue.isCap,
        mmr: lb?.mmr ?? null,
        name: playerInQueue.player.name,
        queueTime: DateTime.fromJSDate(playerInQueue.queueTime),
        team: playerInQueue.team,
      };
    } else {
      return null;
    }
  }

  /**
   * Retrieves all BallChasers in the queue
   * @returns A list of all BallChasers currently in the queue
   */
  async getAllBallChasersInQueue(): Promise<ReadonlyArray<Readonly<PlayerInQueueResponse>>> {
    const allPlayersInQueue = await this.#Queue.findMany({
      include: {
        player: true,
      },
    });

    const allPlayersPromises: Array<Promise<PlayerInQueueResponse>> = [];

    for (const playerInQueue of allPlayersInQueue) {
      const queuePlayerPromise: Promise<PlayerInQueueResponse> = (async () => {
        const lb = await LeaderboardRepository.getPlayerStats(playerInQueue.player.id);
        return {
          id: playerInQueue.player.id,
          isCap: playerInQueue.isCap,
          mmr: lb?.mmr ?? null,
          name: playerInQueue.player.name,
          queueTime: DateTime.fromJSDate(playerInQueue.queueTime),
          team: playerInQueue.team,
        };
      })();

      allPlayersPromises.push(queuePlayerPromise);
    }

    const allPlayersWithMmr = await Promise.all(allPlayersPromises);
    // sort so that shorter queue times are first
    allPlayersWithMmr.sort((a, b) => a.queueTime.toMillis() - b.queueTime.toMillis());
    return allPlayersWithMmr;
  }

  /**
   * Removes the BallChaser from the queue with the specified ID
   * @param id Discord ID of the BallChaser to remove from the queue
   */
  async removeBallChaserFromQueue(id: number): Promise<void> {
    await this.#Queue.delete({ where: { playerId: id } });
  }

  /**
   * Removes all BallChasers currently in the queue.
   */
  async removeAllBallChasersFromQueue(): Promise<void> {
    await this.#Queue.deleteMany();
  }

  /**
   * Function for updating an existing BallChaser in the queue.
   * @param options BallChaser fields to update. ID field is required for retrieving the BallChaser object to update.
   */
  async updateBallChaserInQueue({ id, ...options }: UpdateBallChaserOptions): Promise<void> {
    await this.#Queue.update({
      data: {
        ...options,
        queueTime: options.queueTime?.toISO(),
      },
      where: { playerId: id },
    });
  }

  /**
   * Adds a new BallChaser to the queue.
   * @param ballChaserToAdd New BallChaser object to add to the queue.
   */
  async addBallChaserToQueue(ballChaserToAdd: { id: number; name: string; queueTime: DateTime }): Promise<void> {
    await this.#BallChasers
      .upsert({
        create: {
          id: ballChaserToAdd.id,
          name: ballChaserToAdd.name,
        },
        update: {
          name: ballChaserToAdd.name,
        },
        where: {
          id: ballChaserToAdd.id,
        },
      })
      .then(() => {
        return this.#Queue.create({
          data: {
            playerId: ballChaserToAdd.id,
            queueTime: ballChaserToAdd.queueTime.toISO(),
          },
        });
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
          console.error("Player is already in the queue.");
        }
      });
  }
}

export default new QueueRepository();

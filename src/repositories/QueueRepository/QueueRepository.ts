import { AddBallChaserToQueueInput, PlayerInQueue, QueueWithBallChaser, UpdateBallChaserInQueueInput } from "./types";
import { PrismaClient, Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import LeaderboardRepository from "../LeaderboardRepository";

export class QueueRepository {
  #Queue: Prisma.QueueDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;
  #BallChasers: Prisma.BallChaserDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;

  constructor() {
    this.#Queue = new PrismaClient().queue;
    this.#BallChasers = new PrismaClient().ballChaser;
  }

  async #getPlayerMmr(playerInQueue: QueueWithBallChaser): Promise<PlayerInQueue> {
    const lb = await LeaderboardRepository.getPlayerStats(playerInQueue.player.id);
    return {
      id: playerInQueue.player.id,
      isCap: playerInQueue.isCap,
      mmr: lb?.mmr ?? 100,
      name: playerInQueue.player.name,
      queueTime: DateTime.fromJSDate(playerInQueue.queueTime),
      team: playerInQueue.team,
    };
  }

  /**
   * Retrieves a BallChaser with a specific Discord ID
   * @param id Discord ID of the BallChaser to retrieve
   * @returns A BallChaser object if the player is found, otherwise null
   */
  async getBallChaserInQueue(id: string): Promise<Readonly<PlayerInQueue> | null> {
    const playerInQueue = await this.#Queue.findUnique({
      include: {
        player: true,
      },
      where: {
        playerId: id,
      },
    });
    if (playerInQueue) {
      return this.#getPlayerMmr(playerInQueue);
    } else {
      return null;
    }
  }

  /**
   * Retrieves all BallChasers in the queue
   * @returns A list of all BallChasers currently in the queue
   */
  async getAllBallChasersInQueue(): Promise<ReadonlyArray<Readonly<PlayerInQueue>>> {
    const allPlayersInQueue = await this.#Queue.findMany({
      include: {
        player: true,
      },
    });

    const allPlayersPromises: Array<Promise<PlayerInQueue>> = [];

    for (const playerInQueue of allPlayersInQueue) {
      const queuePlayerPromise: Promise<PlayerInQueue> = this.#getPlayerMmr(playerInQueue);
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
  async removeBallChaserFromQueue(id: string): Promise<void> {
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
  async updateBallChaserInQueue({ id, ...updates }: UpdateBallChaserInQueueInput): Promise<void> {
    await this.#Queue.update({
      data: {
        isCap: updates.isCap,
        queueTime: updates.queueTime?.toISO(),
        team: updates.team,
      },
      where: { playerId: id },
    });
  }

  /**
   * Function for updating an existing BallChaser in the queue.
   * @param options BallChaser fields to update. ID field is required for retrieving the BallChaser object to update.
   */
  /* async updateAllBallChasers(ballChasers: BallChaser[]): Promise<void> {
    for (const ballChaser of ballChasers) {
      const ballChaserPage = await this.#Client.getById(ballChaser.id);

      if (!ballChaserPage) {
        throw new Error(`Cannot update BallChaser. No BallChaser with the ID ${ballChaser.id} was found.`);
      }

      const existingBallChaserProps = ballChaserPage.properties;
      const propertiesUpdate: BallChaserPageProperties = {
        ID: NotionElementHelper.notionTextElementFromText(ballChaser.id),
        MMR: ballChaser.mmr
          ? NotionElementHelper.notionNumberElementFromNumber(ballChaser.mmr)
          : existingBallChaserProps.MMR,
        Name: ballChaser.name
          ? NotionElementHelper.notionTextElementFromText(ballChaser.name)
          : existingBallChaserProps.Name,
        QueueTime: ballChaser.queueTime
          ? NotionElementHelper.notionDateElementFromDateTime(ballChaser.queueTime)
          : existingBallChaserProps.QueueTime,
        Team: ballChaser.team
          ? NotionElementHelper.notionSelectElementFromValue<Team>(ballChaser.team)
          : existingBallChaserProps.Team,
        isCap:
          ballChaser.isCap !== undefined
            ? NotionElementHelper.notionBooleanElementFromBool(ballChaser.isCap)
            : existingBallChaserProps.isCap,
      };

      await this.#Client.update(ballChaserPage.id, propertiesUpdate);
    }
  } */

  /**
   * Adds a new BallChaser to the queue.
   * @param ballChaserToAdd New BallChaser object to add to the queue.
   */
  async addBallChaserToQueue(ballChaserToAdd: AddBallChaserToQueueInput): Promise<void> {
    await this.#BallChasers.upsert({
      create: {
        id: ballChaserToAdd.id,
        name: ballChaserToAdd.name,
        queue: {
          create: {
            queueTime: ballChaserToAdd.queueTime.toISO(),
          },
        },
      },
      update: {
        name: ballChaserToAdd.name,
        queue: {
          create: {
            queueTime: ballChaserToAdd.queueTime.toISO(),
          },
        },
      },
      where: {
        id: ballChaserToAdd.id,
      },
    });
  }
}

export default new QueueRepository();

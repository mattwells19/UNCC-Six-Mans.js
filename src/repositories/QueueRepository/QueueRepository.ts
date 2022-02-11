import { BallChaser, Team } from "../../types/common";
import { BallChaserPageProperties, UpdateBallChaserOptions } from "./types";
import NotionClient from "../helpers/NotionClient";
import NotionElementHelper from "../helpers/NotionElementHelper";
import getEnvVariable from "../../utils/getEnvVariable";

export class QueueRepository {
  #Client: NotionClient<BallChaserPageProperties>;

  constructor() {
    const databaseId = getEnvVariable("notion_queue_id");
    this.#Client = new NotionClient(databaseId);
  }

  /**
   * Retrieves a BallChaser with a specific Discord ID
   * @param id Discord ID of the BallChaser to retrieve
   * @returns A BallChaser object if the player is found, otherwise null
   */
  async getBallChaserInQueue(id: string): Promise<Readonly<BallChaser> | null> {
    const ballChaserPage = await this.#Client.getById(id);

    if (ballChaserPage) {
      const { properties } = ballChaserPage;

      return {
        id: NotionElementHelper.textFromNotionTextElement(properties.ID),
        isCap: NotionElementHelper.boolFromNotionBooleanElement(properties.isCap),
        mmr: NotionElementHelper.numberFromNotionNumberElement(properties.MMR),
        name: NotionElementHelper.textFromNotionTextElement(properties.Name),
        queueTime: NotionElementHelper.dateTimeFromNotionDateElement(properties.QueueTime),
        team: NotionElementHelper.valueFromNotionSelectElement<Team>(properties.Team),
      };
    } else {
      return null;
    }
  }

  /**
   * Retrieves all BallChasers in the queue
   * @returns A list of all BallChasers currently in the queue
   */
  async getAllBallChasersInQueue(): Promise<ReadonlyArray<Readonly<BallChaser>>> {
    const ballChaserPages = await this.#Client.getAll();

    return ballChaserPages.map(({ properties }) => {
      return {
        id: NotionElementHelper.textFromNotionTextElement(properties.ID),
        isCap: NotionElementHelper.boolFromNotionBooleanElement(properties.isCap),
        mmr: NotionElementHelper.numberFromNotionNumberElement(properties.MMR),
        name: NotionElementHelper.textFromNotionTextElement(properties.Name),
        queueTime: NotionElementHelper.dateTimeFromNotionDateElement(properties.QueueTime),
        team: NotionElementHelper.valueFromNotionSelectElement<Team>(properties.Team),
      };
    });
  }

  /**
   * Removes the BallChaser from the queue with the specified ID
   * @param id Discord ID of the BallChaser to remove from the queue
   */
  async removeBallChaserFromQueue(id: string): Promise<ReadonlyArray<Readonly<BallChaser>>> {
    const ballChaserPage = await this.#Client.getById(id);

    if (!ballChaserPage) {
      throw new Error(`Cannot remove BallChaser. No BallChaser with the ID ${id} was found.`);
    }

    await this.#Client.remove(ballChaserPage.id);

    return this.getAllBallChasersInQueue();
  }

  /**
   * Removes all BallChasers currently in the queue.
   */
  async removeAllBallChasersFromQueue(): Promise<void> {
    const allBallChaserPages = await this.#Client.getAll();
    const allBallChaserPageIds = allBallChaserPages.map((allBallChaserPage) => allBallChaserPage.id);

    await this.#Client.remove(allBallChaserPageIds);
  }

  /**
   * Function for updating an existing BallChaser in the queue.
   * @param options BallChaser fields to update. ID field is required for retrieving the BallChaser object to update.
   */
  async updateBallChaserInQueue({ id, ...options }: UpdateBallChaserOptions): Promise<void> {
    const ballChaserPage = await this.#Client.getById(id);

    if (!ballChaserPage) {
      throw new Error(`Cannot update BallChaser. No BallChaser with the ID ${id} was found.`);
    }

    const existingBallChaserProps = ballChaserPage.properties;
    const propertiesUpdate: BallChaserPageProperties = {
      ID: NotionElementHelper.notionTextElementFromText(id),
      MMR: options.mmr ? NotionElementHelper.notionNumberElementFromNumber(options.mmr) : existingBallChaserProps.MMR,
      Name: options.name ? NotionElementHelper.notionTextElementFromText(options.name) : existingBallChaserProps.Name,
      QueueTime: options.queueTime
        ? NotionElementHelper.notionDateElementFromDateTime(options.queueTime)
        : existingBallChaserProps.QueueTime,
      Team: options.team
        ? NotionElementHelper.notionSelectElementFromValue<Team>(options.team)
        : existingBallChaserProps.Team,
      isCap:
        options.isCap !== undefined
          ? NotionElementHelper.notionBooleanElementFromBool(options.isCap)
          : existingBallChaserProps.isCap,
    };

    await this.#Client.update(ballChaserPage.id, propertiesUpdate);
  }

  /**
   * Adds a new BallChaser to the queue.
   * @param ballChaserToAdd New BallChaser object to add to the queue.
   */
  async addBallChaserToQueue(ballChaserToAdd: BallChaser): Promise<void> {
    const ballChaserAlreadyInQueue = await this.getBallChaserInQueue(ballChaserToAdd.id);

    if (ballChaserAlreadyInQueue) {
      throw new Error(`BallChaser with the ID ${ballChaserToAdd.id} is already in the queue.`);
    }

    const newBallChaserProperties: BallChaserPageProperties = {
      ID: NotionElementHelper.notionTextElementFromText(ballChaserToAdd.id),
      MMR: NotionElementHelper.notionNumberElementFromNumber(ballChaserToAdd.mmr),
      Name: NotionElementHelper.notionTextElementFromText(ballChaserToAdd.name),
      QueueTime: NotionElementHelper.notionDateElementFromDateTime(ballChaserToAdd.queueTime),
      Team: NotionElementHelper.notionSelectElementFromValue<Team>(ballChaserToAdd.team),
      isCap: NotionElementHelper.notionBooleanElementFromBool(ballChaserToAdd.isCap),
    };

    await this.#Client.insert(newBallChaserProperties);
  }
}

export default new QueueRepository();

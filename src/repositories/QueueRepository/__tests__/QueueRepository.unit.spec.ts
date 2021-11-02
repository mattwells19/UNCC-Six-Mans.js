import * as faker from "faker";
import { mocked } from "ts-jest/utils";
import { BallChaserPageProperties, UpdateBallChaserOptions } from "../types";
import NotionClient from "../../helpers/NotionClient";
import { PropertyValueMap } from "@notionhq/client/build/src/api-endpoints";
import { BallChaser, Team } from "../../../types/common";
import { Page } from "@notionhq/client/build/src/api-types";
import { QueueRepository as QueueRepositoryClass } from "../QueueRepository";
import NotionElementHelper from "../../helpers/NotionElementHelper";
import { BallChaserBuilder } from "../../../../.jest/Builder";

jest.mock("../../helpers/NotionClient");

function makeProps(ballChaser: BallChaser = BallChaserBuilder.single()): BallChaserPageProperties {
  return {
    ID: NotionElementHelper.notionTextElementFromText(ballChaser.id),
    MMR: NotionElementHelper.notionNumberElementFromNumber(ballChaser.mmr),
    Name: NotionElementHelper.notionTextElementFromText(ballChaser.name),
    QueueTime: NotionElementHelper.notionDateElementFromDateTime(ballChaser.queueTime),
    Team: NotionElementHelper.notionSelectElementFromValue<Team>(ballChaser.team),
    isCap: NotionElementHelper.notionBooleanElementFromBool(ballChaser.isCap),
  };
}

function makePage(mockBallChaserPageProperties: BallChaserPageProperties = makeProps()): Page {
  return {
    archived: false,
    cover: null,
    created_time: "",
    icon: null,
    id: faker.datatype.uuid(),
    last_edited_time: "",
    object: "page",
    parent: {
      database_id: process.env.notion_queue_id ?? "",
      type: "database_id",
    },
    properties: mockBallChaserPageProperties as unknown as PropertyValueMap,
    url: "",
  };
}

function verifyBallChasersAreEqual(expectedBallChaser: BallChaser, actualBallChaser: BallChaser): void {
  expect(actualBallChaser).not.toBeNull();
  expect(actualBallChaser?.id).toBe(expectedBallChaser.id);
  expect(actualBallChaser?.mmr).toBe(expectedBallChaser.mmr);
  expect(actualBallChaser?.name).toBe(expectedBallChaser.name);
  expect(actualBallChaser?.queueTime?.toISO()).toBe(expectedBallChaser.queueTime?.toISO());
  expect(actualBallChaser?.team).toBe(expectedBallChaser.team);
  expect(actualBallChaser?.isCap).toBe(expectedBallChaser.isCap);
}

let QueueRepository: QueueRepositoryClass;

beforeEach(async () => {
  jest.clearAllMocks();
  process.env.notion_queue_id = faker.datatype.uuid();

  // have to wait to import the repo until after the test environment variable is set
  const ImportedRepo = await import("../QueueRepository");
  QueueRepository = ImportedRepo.default; // <- get the default export from the imported file
});

describe("Queue Repository tests", () => {
  it("gets BallChaser using ID when BallChaser exists", async () => {
    const expectedBallChaser = BallChaserBuilder.single();
    const mockPage = makePage(makeProps(expectedBallChaser));
    mocked(NotionClient.prototype.getById).mockResolvedValue(mockPage);

    const actualBallChaser = await QueueRepository.getBallChaserInQueue(expectedBallChaser.id);

    verifyBallChasersAreEqual(expectedBallChaser, actualBallChaser!);
  });

  it("returns null when BallChaser does not exist with ID", async () => {
    mocked(NotionClient.prototype.getById).mockResolvedValue(null);

    const actualBallChaser = await QueueRepository.getBallChaserInQueue(faker.datatype.uuid());
    expect(actualBallChaser).toBeNull();
  });

  it("retrieves all BallChasers in queue", async () => {
    const expectedBallChaser1 = BallChaserBuilder.single();
    const mockPage1 = makePage(makeProps(expectedBallChaser1));
    const expectedBallChaser2 = BallChaserBuilder.single();
    const mockPage2 = makePage(makeProps(expectedBallChaser2));

    mocked(NotionClient.prototype.getAll).mockResolvedValue([mockPage1, mockPage2]);

    const actualBallChasers = await QueueRepository.getAllBallChasersInQueue();

    expect(actualBallChasers).toHaveLength(2);
    verifyBallChasersAreEqual(expectedBallChaser1, actualBallChasers[0]);
    verifyBallChasersAreEqual(expectedBallChaser2, actualBallChasers[1]);
  });

  it("removes BallChaser when found in queue", async () => {
    const mockBallChaser = BallChaserBuilder.single();
    const mockPage = makePage(makeProps(mockBallChaser));

    mocked(NotionClient.prototype.getById).mockResolvedValue(mockPage);
    const mockRemove = mocked(NotionClient.prototype.remove);

    await expect(QueueRepository.removeBallChaserFromQueue(mockBallChaser.id)).resolves.not.toThrowError();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it("throws error when trying to remove BallChaser when not found in queue", async () => {
    mocked(NotionClient.prototype.getById).mockResolvedValue(null);

    await expect(QueueRepository.removeBallChaserFromQueue(faker.datatype.uuid())).rejects.toThrowError();
  });

  it("removes all BallChasers in queue", async () => {
    const mockPage1 = makePage();
    const mockPage2 = makePage();

    const mockRemove = mocked(NotionClient.prototype.remove);
    mocked(NotionClient.prototype.getAll).mockResolvedValue([mockPage1, mockPage2]);

    await expect(QueueRepository.removeAllBallChasersFromQueue()).resolves.not.toThrowError();
    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockRemove).toHaveBeenLastCalledWith(expect.arrayContaining([mockPage1.id, mockPage2.id]));
  });

  it("updates BallChaser when BallChaser is found", async () => {
    const mockBallChaser = BallChaserBuilder.single();
    const mockPage = makePage(makeProps(mockBallChaser));

    const updatedBallChaser = BallChaserBuilder.single({ id: mockBallChaser.id });
    const updateProperties = makeProps(updatedBallChaser);

    mocked(NotionClient.prototype.getById).mockResolvedValue(mockPage);
    const mockUpdate = mocked(NotionClient.prototype.update);

    const updateOptions: UpdateBallChaserOptions = {
      id: mockBallChaser.id,
      isCap: updatedBallChaser.isCap,
      mmr: updatedBallChaser.mmr,
      name: updatedBallChaser.name,
      queueTime: updatedBallChaser.queueTime,
      team: updatedBallChaser.team,
    };

    await QueueRepository.updateBallChaserInQueue(updateOptions);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith(mockPage.id, updateProperties);
  });

  it("throws when player to update is not found", async () => {
    const mockBallChaser = BallChaserBuilder.single();
    mocked(NotionClient.prototype.getById).mockResolvedValue(null);
    const mockUpdate = mocked(NotionClient.prototype.update);

    await expect(QueueRepository.updateBallChaserInQueue(mockBallChaser)).rejects.toThrowError();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("adds BallChaser to queue", async () => {
    mocked(NotionClient.prototype.getById).mockResolvedValue(null);
    const mockInsert = mocked(NotionClient.prototype.insert);

    const mockBallChaser = BallChaserBuilder.single();
    const mockBallChaserPageProperties = makeProps(mockBallChaser);

    await QueueRepository.addBallChaserToQueue(mockBallChaser);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenLastCalledWith(mockBallChaserPageProperties);
  });

  it("throws when BallChaser already exists", async () => {
    const mockBallChaser = BallChaserBuilder.single();
    const mockPage = makePage(makeProps(mockBallChaser));

    mocked(NotionClient.prototype.getById).mockResolvedValue(mockPage);
    const mockInsert = mocked(NotionClient.prototype.insert);

    await expect(QueueRepository.addBallChaserToQueue(mockBallChaser)).rejects.toThrowError();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

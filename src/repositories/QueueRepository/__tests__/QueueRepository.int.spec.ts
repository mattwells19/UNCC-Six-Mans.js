import { BallChaser } from "../../../types/common";
import * as faker from "faker";
import QueueRepository from "..";
import { BallChaserBuilder } from "../../../../.jest/Builder";

function verifyBallChasersAreEqual(expectedBallChaser: BallChaser, actualBallChaser: BallChaser): void {
  expect(actualBallChaser).not.toBeNull();
  expect(actualBallChaser?.id).toBe(expectedBallChaser.id);
  expect(actualBallChaser?.mmr).toBe(expectedBallChaser.mmr);
  expect(actualBallChaser?.name).toBe(expectedBallChaser.name);
  expect(actualBallChaser?.queueTime?.toISO()).toBe(expectedBallChaser.queueTime?.toISO());
  expect(actualBallChaser?.team).toBe(expectedBallChaser.team);
  expect(actualBallChaser?.isCap).toBe(expectedBallChaser.isCap);
}

// set timeout to be longer (10 seconds) since async requests take extra time
jest.setTimeout(10000);

describe("Queue Repository Integration Tests", () => {
  it("add and remove BallChaser from queue", async () => {
    const ballChaserToAdd = BallChaserBuilder.single();

    await QueueRepository.addBallChaserToQueue(ballChaserToAdd);
    const retrievedBallChaser = await QueueRepository.getBallChaserInQueue(ballChaserToAdd.id);

    verifyBallChasersAreEqual(ballChaserToAdd, retrievedBallChaser!);

    await QueueRepository.removeBallChaserFromQueue(ballChaserToAdd.id);
    const retrievedBallChaserShouldBeNull = await QueueRepository.getBallChaserInQueue(ballChaserToAdd.id);
    expect(retrievedBallChaserShouldBeNull).toBeNull();
  });

  it("gets and removes everyone from the queue", async () => {
    const [ballChaserToAdd1, ballChaserToAdd2] = BallChaserBuilder.many(2);

    const addOne = QueueRepository.addBallChaserToQueue(ballChaserToAdd1);
    const addTwo = QueueRepository.addBallChaserToQueue(ballChaserToAdd2);
    await Promise.all([addOne, addTwo]);

    const allBallChasers = await QueueRepository.getAllBallChasersInQueue();
    expect(allBallChasers).toHaveLength(2);

    await QueueRepository.removeAllBallChasersFromQueue();
    const shouldBeEmptyBallChasers = await QueueRepository.getAllBallChasersInQueue();
    expect(shouldBeEmptyBallChasers).toHaveLength(0);
  });

  it("can update a BallChaser", async () => {
    const ballChaserToAdd = BallChaserBuilder.single();

    await QueueRepository.addBallChaserToQueue(ballChaserToAdd);

    const newName = faker.random.word();
    const expectedUpdatedBallChaser: BallChaser = {
      ...ballChaserToAdd,
      name: newName,
    };
    await QueueRepository.updateBallChaserInQueue({
      id: ballChaserToAdd.id,
      name: newName,
    });

    const updatedBallChaser = await QueueRepository.getBallChaserInQueue(ballChaserToAdd.id);
    verifyBallChasersAreEqual(expectedUpdatedBallChaser, updatedBallChaser!);

    await QueueRepository.removeBallChaserFromQueue(ballChaserToAdd.id);
    const retrievedBallChaserShouldBeNull = await QueueRepository.getBallChaserInQueue(ballChaserToAdd.id);
    expect(retrievedBallChaserShouldBeNull).toBeNull();
  });

  it("can handle team and queueTime being null", async () => {
    const ballChaserToAdd = BallChaserBuilder.single({ queueTime: null });

    await QueueRepository.addBallChaserToQueue(ballChaserToAdd);
    const retrievedBallChaser = await QueueRepository.getBallChaserInQueue(ballChaserToAdd.id);

    verifyBallChasersAreEqual(ballChaserToAdd, retrievedBallChaser!);

    await QueueRepository.removeBallChaserFromQueue(ballChaserToAdd.id);
    const retrievedBallChaserShouldBeNull = await QueueRepository.getBallChaserInQueue(ballChaserToAdd.id);
    expect(retrievedBallChaserShouldBeNull).toBeNull();
  });
});

import QueueRepository from "../../repositories/QueueRepository";
import EventRepository from "../../repositories/EventRepository";
import { kickPlayerFromQueue, updateMmrMultiplier } from "../AdminService";
import * as faker from "faker";
import { InvalidCommand } from "../../utils/InvalidCommand";
import { leaveQueue } from "../QueueService";
import { BallChaserQueueBuilder } from "../../../.jest/Builder";

jest.mock("../QueueService");
jest.mock("../../repositories/QueueRepository");
jest.mock("../../repositories/EventRepository");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AdminService tests", () => {
  describe("Kick command tests", () => {
    it("throws when queue is empty", async () => {
      const leaveQueueMock = jest.mocked(leaveQueue);
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValue([]);

      await expect(kickPlayerFromQueue(faker.datatype.uuid())).rejects.toThrowError(InvalidCommand);
      await expect(leaveQueueMock).not.toHaveBeenCalled();
    });

    it("throws when captains are already set", async () => {
      const leaveQueueMock = jest.mocked(leaveQueue);
      const captains = BallChaserQueueBuilder.many(2, { isCap: true });
      const otherPlayers = BallChaserQueueBuilder.many(4, { isCap: false });
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValue([...otherPlayers, ...captains]);

      await expect(kickPlayerFromQueue(faker.datatype.uuid())).rejects.toThrowError(InvalidCommand);
      expect(leaveQueueMock).not.toHaveBeenCalled();
    });

    it("calls leave queue with correct id", async () => {
      const mockBallChaser = BallChaserQueueBuilder.single({ isCap: false });
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValue([mockBallChaser]);
      const leaveQueueMock = jest.mocked(leaveQueue);

      await kickPlayerFromQueue(mockBallChaser.id);

      expect(leaveQueueMock).toHaveBeenCalledWith(mockBallChaser.id);
    });
  });

  describe("Update MMR tests", () => {
    it("throws if MMR is less than 0", async () => {
      const mockUpdateEvent = jest.mocked(EventRepository.updateCurrentEvent);
      const newMmr = faker.datatype.number({ max: -0.1 });

      await expect(updateMmrMultiplier(newMmr)).rejects.toThrowError(InvalidCommand);

      expect(mockUpdateEvent).not.toHaveBeenCalled();
    });

    it("calls update current event", async () => {
      const mockUpdateEvent = jest.mocked(EventRepository.updateCurrentEvent);
      const newMmr = faker.datatype.number({ min: 0, max: 10, precision: 2 });

      await updateMmrMultiplier(newMmr);

      expect(mockUpdateEvent).toBeCalledWith({
        mmrMult: newMmr,
      });
    });
  });
});

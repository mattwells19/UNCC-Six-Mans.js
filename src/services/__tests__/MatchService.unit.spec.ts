import { BallChaserQueueBuilder } from "../../../.jest/Builder";
import { createMatchFromChosenTeams, createRandomMatch } from "../MatchService";
import ActiveMatchRepository from "../../repositories/ActiveMatchRepository";
import QueueRepository from "../../repositories/QueueRepository";
import { Team } from "../../types/common";
import { PlayerInQueue } from "../../repositories/QueueRepository/types";
import { calculateProbabilityDecimal } from "../MatchReportService";
import * as faker from "faker";

jest.mock("../../repositories/ActiveMatchRepository");
jest.mock("../../repositories/QueueRepository");
jest.mock("../../utils");
jest.mock("../MatchReportService");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Match Service tests", () => {
  jest.mocked(ActiveMatchRepository.getAllPlayersInActiveMatch).mockResolvedValue({
    blueTeam: [],
    orangeTeam: [],
  });
  jest.mocked(calculateProbabilityDecimal).mockReturnValue({
    blueProbabilityDecimal: faker.datatype.number(),
    orangeProbabilityDecimal: faker.datatype.number(),
  });

  describe("Random button was pressed", () => {
    it("random teams are created", async () => {
      const mockBallChasers = BallChaserQueueBuilder.many(6, { team: null });
      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);

      const addMatchMock = jest.mocked(ActiveMatchRepository.addActiveMatch);
      const removePlayersMock = jest.mocked(QueueRepository.removeAllBallChasersFromQueue);

      await createRandomMatch();

      expect(addMatchMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ team: Team.Blue }),
          expect.objectContaining({ team: Team.Blue }),
          expect.objectContaining({ team: Team.Blue }),
          expect.objectContaining({ team: Team.Orange }),
          expect.objectContaining({ team: Team.Orange }),
          expect.objectContaining({ team: Team.Orange }),
        ])
      );
      expect(removePlayersMock).toHaveBeenCalled();
    });
  });
  describe("Captains button was pressed", () => {
    it("last available queueMember is placed on blue team", async () => {
      const mockOrangeBallChasers = BallChaserQueueBuilder.many(3, { team: Team.Orange });
      const mockBlueBallChasers = BallChaserQueueBuilder.many(2, { team: Team.Blue });
      const mockBallChaserNoTeam = BallChaserQueueBuilder.single({ team: null, isCap: false });
      const mockBallChasers: PlayerInQueue[] = [...mockOrangeBallChasers, ...mockBlueBallChasers, mockBallChaserNoTeam];

      jest.mocked(QueueRepository.getAllBallChasersInQueue).mockResolvedValueOnce(mockBallChasers);

      const addMatchMock = jest.mocked(ActiveMatchRepository.addActiveMatch);
      const removePlayersMock = jest.mocked(QueueRepository.removeAllBallChasersFromQueue);

      await createMatchFromChosenTeams();

      expect(addMatchMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          ...mockOrangeBallChasers.map((orangePlayer) =>
            expect.objectContaining({ id: orangePlayer.id, team: Team.Orange })
          ),
          ...mockBlueBallChasers.map((bluePlayer) => expect.objectContaining({ id: bluePlayer.id, team: Team.Blue })),
          // The player with no team was added to the Blue team
          expect.objectContaining({ id: mockBallChaserNoTeam.id, team: Team.Blue }),
        ])
      );
      expect(removePlayersMock).toHaveBeenCalled();
    });
  });
});

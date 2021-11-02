import ActiveMatchRepository from "..";
import { BallChaserBuilder } from "../../../../.jest/Builder";
import * as faker from "faker";
import { Team } from "../../../types/common";

// set timeout to be longer (10 seconds) since async requests take extra time
jest.setTimeout(10000);

describe("Active Match Repository Integration Tests", () => {
  it("adds to, retreives from, and removes players in active match", async () => {
    const mockBallChasers = BallChaserBuilder.many(6);
    await ActiveMatchRepository.addActiveMatch(mockBallChasers);

    const oneOfThePlayers = faker.random.arrayElement(mockBallChasers);
    const playersInActiveMatch = await ActiveMatchRepository.getAllPlayersInActiveMatch(oneOfThePlayers.id);

    expect(playersInActiveMatch).toHaveLength(6);
    playersInActiveMatch.forEach((playerInActiveMatch) => {
      const expectedPlayer = mockBallChasers.find((ballChaser) => ballChaser.id === playerInActiveMatch.id);
      expect(expectedPlayer).not.toBeNull();
      expect(playerInActiveMatch.team).toBe(expectedPlayer?.team);
    });

    await ActiveMatchRepository.removeAllPlayersInActiveMatch(oneOfThePlayers.id);

    const playersInActiveMatchAfterRemoval = await ActiveMatchRepository.getAllPlayersInActiveMatch(oneOfThePlayers.id);
    expect(playersInActiveMatchAfterRemoval).toHaveLength(0);
  });

  it("updates player in active match", async () => {
    const mockBallChasers = BallChaserBuilder.many(6);
    await ActiveMatchRepository.addActiveMatch(mockBallChasers);

    const oneOfThePlayers = faker.random.arrayElement(mockBallChasers);
    const reportedTeam = faker.random.arrayElement([Team.Orange, Team.Blue]);

    await ActiveMatchRepository.updatePlayerInActiveMatch(oneOfThePlayers.id, {
      reported: reportedTeam,
    });

    const playersInActiveMatch = await ActiveMatchRepository.getAllPlayersInActiveMatch(oneOfThePlayers.id);
    expect(playersInActiveMatch).toHaveLength(6);

    const playerThatWasUpdated = playersInActiveMatch.find((p) => p.id === oneOfThePlayers.id);
    expect(playerThatWasUpdated).not.toBeNull();
    expect(playerThatWasUpdated!.reported).toBe(reportedTeam);

    await ActiveMatchRepository.removeAllPlayersInActiveMatch(oneOfThePlayers.id);

    const playersInActiveMatchAfterRemoval = await ActiveMatchRepository.getAllPlayersInActiveMatch(oneOfThePlayers.id);
    expect(playersInActiveMatchAfterRemoval).toHaveLength(0);
  });
});

import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import generateRandomId from "../../utils/randomId";
import { NewActiveMatchInput, PlayerInActiveMatch, UpdatePlayerInActiveMatchInput } from "./types";

export class ActiveMatchRepository {
  #ActiveMatch: Prisma.ActiveMatchDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;

  constructor() {
    this.#ActiveMatch = new PrismaClient().activeMatch;
  }

  async addActiveMatch(newActiveMatchPlayers: Array<NewActiveMatchInput>): Promise<void> {
    const notEveryoneHasATeam = newActiveMatchPlayers.some((player) => !Number.isInteger(player.team));
    if (notEveryoneHasATeam) {
      throw new Error("Not all players are assigned a team.");
    }

    const matchId = generateRandomId();

    await this.#ActiveMatch.createMany({
      data: newActiveMatchPlayers.map((newActiveMatchPlayer) => ({
        id: matchId,
        playerId: newActiveMatchPlayer.id,
        team: newActiveMatchPlayer.team,
      })),
    });
  }

  async updatePlayerInActiveMatch(playerInMatchId: string, updates: UpdatePlayerInActiveMatchInput): Promise<void> {
    await this.#ActiveMatch
      .update({
        data: {
          brokenQueue: updates.brokenQueue,
          reportedTeam: updates.reportedTeam,
        },
        where: {
          playerId: playerInMatchId,
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError && err.code === "P2025") {
          throw new Error(`Player with ID: ${playerInMatchId} is not in an active match.`);
        }
      });
  }

  async removeAllPlayersInActiveMatch(playerInMatchId: string): Promise<void> {
    await this.#ActiveMatch
      .findUnique({
        select: {
          id: true,
        },
        where: {
          playerId: playerInMatchId,
        },
      })
      .then((match) => {
        if (!match) {
          throw new Error(`Player with ID: ${playerInMatchId} is not in an active match.`);
        }

        return this.#ActiveMatch.deleteMany({
          where: {
            id: match.id,
          },
        });
      });
  }

  async getAllPlayersInActiveMatch(playerInMatchId: string): Promise<ReadonlyArray<Readonly<PlayerInActiveMatch>>> {
    const allPlayersInMatch = await this.#ActiveMatch
      .findUnique({
        select: {
          id: true,
        },
        where: {
          playerId: playerInMatchId,
        },
      })
      .then((match) => {
        if (!match) {
          console.warn(`Player with ID: ${playerInMatchId} is not in an active match.`);
          return [];
        }

        return this.#ActiveMatch.findMany({
          where: {
            id: match.id,
          },
        });
      });

    return allPlayersInMatch.map((playerInMatch) => ({
      id: playerInMatch.playerId,
      matchId: playerInMatch.id,
      reportedTeam: playerInMatch.reportedTeam,
      team: playerInMatch.team,
    }));
  }

  async isPlayerInActiveMatch(playerInMatchId: string): Promise<boolean> {
    const playerInMatch = await this.#ActiveMatch.count({
      where: {
        playerId: playerInMatchId,
      },
    });

    return playerInMatch > 0;
  }
}

export default new ActiveMatchRepository();

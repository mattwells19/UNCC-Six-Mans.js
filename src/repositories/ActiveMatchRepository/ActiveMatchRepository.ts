import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { Team } from "../../types/common";
import generateRandomId from "../../utils/randomId";
import { PlayerInActiveMatch } from "./types";

export class ActiveMatchRepository {
  #ActiveMatch: Prisma.ActiveMatchDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;

  constructor() {
    this.#ActiveMatch = new PrismaClient().activeMatch;
  }

  async addActiveMatch(ballChasers: Array<{ id: number; team: Team }>): Promise<void> {
    const notEveryoneHasATeam = ballChasers.some((ballChaser) => !ballChaser.team);
    if (notEveryoneHasATeam) {
      throw new Error("Not all players are assigned a team.");
    }

    const matchId = generateRandomId();

    this.#ActiveMatch.createMany({
      data: ballChasers.map((ballChaser) => ({
        id: matchId,
        playerId: ballChaser.id,
        team: ballChaser.team,
      })),
    });
  }

  async updatePlayerInActiveMatch(playerInMatchId: number, updates: Partial<PlayerInActiveMatch>): Promise<void> {
    await this.#ActiveMatch
      .update({
        data: {
          id: updates.matchId,
          playerId: updates.id,
          reportedTeam: updates.reported,
          team: updates.team,
        },
        where: {
          playerId: playerInMatchId,
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError && err.code === "P5003") {
          throw new Error(`Player with ID: ${playerInMatchId} is not in an active match.`);
        }
      });
  }

  async removeAllPlayersInActiveMatch(playerInMatchId: number): Promise<void> {
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

  async getAllPlayersInActiveMatch(playerInMatchId: number): Promise<ReadonlyArray<Readonly<PlayerInActiveMatch>>> {
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
          throw new Error(`Player with ID: ${playerInMatchId} is not in an active match.`);
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
      reported: playerInMatch.reportedTeam,
      team: playerInMatch.team,
    }));
  }
}

export default new ActiveMatchRepository();

import { BallChaser, Leaderboard, Prisma, PrismaClient } from "@prisma/client";
import getEnvVariable from "../../utils/getEnvVariable";
import { PlayerStats, PlayerStatsUpdates } from "./types";

export class LeaderboardRepository {
  #Leaderboard: Prisma.LeaderboardDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;
  #seasonKey: string;

  constructor() {
    this.#Leaderboard = new PrismaClient().leaderboard;
    this.#seasonKey = getEnvVariable("season_key");
  }

  #calculatePlayerStats(playerStats: Leaderboard & { player: BallChaser }): PlayerStats {
    return {
      id: playerStats.player.id,
      losses: playerStats.losses,
      matchesPlayed: playerStats.wins + playerStats.losses,
      mmr: playerStats.mmr,
      name: playerStats.player.name,
      winPerc: playerStats.wins / (playerStats.wins + playerStats.losses),
      wins: playerStats.wins,
    };
  }

  /**
   * Gets the leaderboard stats for a specific player
   * @param id ID of the player to get stats for
   * @returns returns the player's stats if they exist, otherwise null
   */
  async getPlayerStats(id: number): Promise<Readonly<PlayerStats> | null> {
    const playerStats = await this.#Leaderboard.findUnique({
      include: {
        player: true,
      },
      where: {
        playerId: id,
      },
    });

    if (!playerStats) {
      return null;
    }

    return this.#calculatePlayerStats(playerStats);
  }

  /**
   * Retreives the top (n) number of players in the leaderboard
   * @param n Number of players to retrieve from the top of the leaderboard. Returns all entries if left undefined.
   * @returns An array of the top 'n' players in the leaderboard
   */
  async getPlayersStats(n?: number): Promise<ReadonlyArray<Readonly<PlayerStats>>> {
    const playersStats = await this.#Leaderboard.findMany({
      include: {
        player: true,
      },
      orderBy: [{ mmr: "desc" }, { wins: "desc" }],
      take: n,
      where: {
        seasonKey: this.#seasonKey,
      },
    });

    return playersStats.map((playerStats) => this.#calculatePlayerStats(playerStats));
  }

  /**
   * Updates the stats for a list of players. Will update a player if they are already on the leaderboard,
   * otherwise it will add them.
   * @param playersUpdates An array of player stats to update the leaderboard with.
   */
  async updatePlayersStats(playersUpdates: Array<PlayerStatsUpdates>): Promise<void> {
    const promises: Array<Promise<Leaderboard>> = [];
    for (const playerUpdates of playersUpdates) {
      const leaderboardUpdate = this.#Leaderboard.upsert({
        create: {
          losses: playerUpdates.losses,
          mmr: playerUpdates.mmr,
          playerId: playerUpdates.id,
          seasonKey: this.#seasonKey,
          wins: playerUpdates.wins,
        },
        update: {
          losses: playerUpdates.losses,
          mmr: playerUpdates.mmr,
          wins: playerUpdates.wins,
        },
        where: {
          seasonKey_playerId: {
            playerId: playerUpdates.id,
            seasonKey: this.#seasonKey,
          },
        },
      });

      promises.push(leaderboardUpdate);
    }

    await Promise.all(promises);
  }
}

export default new LeaderboardRepository();
